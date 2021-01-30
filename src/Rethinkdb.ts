import { Database } from "./Database";
import { r, Connection, RConnectionOptions, RDatabase, RTable, RStream, RDatum } from "rethinkdb-ts";
import { Datastore, DatastoreInterface, DatastoreProxyPath } from "./Datastore";
import { Provider, ProviderCache } from ".";
import { Projection } from "./Provider";
import "missing-native-js-functions";

// @ts-ignore
export type RethinkDatabaseOptions = RConnectionOptions & {
	db: string;
};

export class RethinkDatabase extends Database {
	public provider = RethinkdbProvider;
	public connection: Connection;
	public connected: boolean = false;
	public tables: string[] = [];

	constructor(public opts: RethinkDatabaseOptions) {
		super();
	}

	// @ts-ignore
	get data(): DatastoreInterface {
		return Datastore(this);
	}

	async init() {
		this.connection = await r.connect(this.opts);
		try {
			await r.dbCreate(this.opts.db).run(this.connection);
		} catch (error) {}
		this.tables = await r.tableList().run(this.connection);

		this.connected = true;
		this.emit("connect");
		this.connection.on("error", (e: any) => this.emit("error", e));
		this.connection.on("close", () => this.emit("close"));
		this.connection.on("timeout", () => this.emit("timeout"));
		this.connection.on("connect", () => this.emit("connect"));
	}

	async destroy() {
		return this.connection.close();
	}
}

export class RethinkdbProviderCache extends ProviderCache {}

export class RethinkdbProvider extends Provider {
	public table: string;
	public document?: any;

	constructor(protected db: RethinkDatabase, protected path: DatastoreProxyPath) {
		super(db, path);
		if (!db.connected) throw new Error("Database is not connected");
		if (!path.length) throw new Error("Path must contain at least one element");

		this.table = path[0].name;

		this.path.forEach((path) => {
			if (typeof path.filter === "function") {
				path.filter = r.js(`(${path.filter})`);
			}
		});
	}

	async init() {
		if (!this.db.tables.includes(this.table)) {
			this.db.tables.push(this.table);
			await r.tableCreate(this.table).run(this.db.connection);
		}

		var query: RStream | RTable = r.table(this.table);
		return query;
	}

	async query() {
		let query = await this.init();

		let i = 0;
		for (const path of this.path) {
			if (i == 0) {
			} else if (i == 1) {
				query = query.getField(path.name);
			} else query = query.concatMap(r.row(path.name));

			if (path.filter) query = query.filter(path.filter);
			i++;
		}

		return query;
	}

	getFilter(paths: DatastoreProxyPath) {
		const result: any = {};
		let current = result;
		let lastFilter = paths.findLastIndex((x) => x.filter);

		if (lastFilter == -1) return result;

		for (let i = 0; i < paths.length; i++) {
			if (i === lastFilter) {
				break;
			}
		}
		for (const path of paths) {
			current[path.name] = path.filter || {};
			current = current[path.name];
		}

		return result;
	}

	async get(projection?: Projection) {
		let query = await this.query();
		if (projection) query = query.pluck(projection);

		return query.run(this.db.connection);
	}

	async set(value: any) {
		try {
			let query = await this.init();
			let path = this.path.slice(1, this.path.length - 1);
			let last = this.path.slice(1).last();
			let filter = typeof value === "object" && value != null ? { ...last?.filter, ...value } : value;
			let name = <string>last?.name;

			let newValue = this.getFilter([...path, { name, filter }]);
			const result = await (<RTable>query).update(newValue).run(this.db.connection);
			if (result.inserted || result.replaced) return result;

			await (<RTable>query).insert(value).run(this.db.connection);
		} catch (error) {
			return error;
		}
	}

	// @ts-ignore
	public get cache() {
		return new RethinkdbProviderCache(this);
	}
}
