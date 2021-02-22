import "missing-native-js-functions";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Collection, Connection, Types } from "mongoose";
import { ChangeEvent, ChangeStream, Long } from "mongodb";
import { Projection, Provider } from "./Provider";
import { ProviderCache, ProviderCacheOptions } from "./ProviderCache";
import { Database } from "./Database";
import fs from "fs";
import { Datastore, DatastoreInterface, DatastoreProxyPath } from "./Datastore";

Array.prototype.last = function () {
	return this[this.length - 1];
};

declare global {
	interface Array<T> {
		last(): T;
	}
}

export class MongoDatabase extends Database {
	private mongod?: MongoMemoryServer;
	public conn: Connection;
	public provider = MongodbProvider;

	constructor(
		public uri?: string,
		public opts?: {
			useNewUrlParser: boolean;
			useUnifiedTopology: boolean;
		}
	) {
		super();
	}

	// @ts-ignore
	get data(): DatastoreInterface {
		return Datastore(this);
	}

	async init() {
		let localServer = !this.uri;
		if (localServer) {
			const dbPath = `${__dirname}/../database/`;

			if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);
			this.mongod = new MongoMemoryServer({
				instance: {
					dbName: "lambert",
					dbPath,
					storageEngine: "wiredTiger",
					auth: false,
					args: [],
					port: 54618,
				},
			});
			await this.mongod.start();
			this.uri = await this.mongod?.getUri();
			console.log(this.uri);
		}

		// mongodb://127.0.0.1:54618/lambert?readPreference=primaryPreferred&appname=MongoDB%20Compass&ssl=false

		this.conn = await mongoose.createConnection(<string>this.uri, this.opts);
		this.conn.on("error", console.error);

		if (localServer) {
			try {
				await this.conn.db.admin().command({ replSetInitiate: { _id: "test" } });
			} catch (error) {}
		}
	}

	async destroy() {
		await Promise.all([this.conn?.close(), this.mongod?.stop()]);
	}
}

export interface MongodbProviderCache {
	on(event: "insert", listener: (newdata: any) => void): this;
	on(event: "update", listener: (old: any, newdata: any) => void): this;
	on(event: "change", listener: (data: ChangeEvent<Record<string, any>>) => void): this;
}

interface MongodbProviderCacheOptions {
	onlyEvents: boolean;
}

export class MongodbProviderCache extends ProviderCache {
	private changeStream?: ChangeStream;
	public static CHANGE_STREAM_SUPPORTED: boolean = true;

	constructor(public provider: MongodbProvider, public opts?: MongodbProviderCacheOptions) {
		// @ts-ignore
		super(provider, opts);
	}

	async init(): Promise<MongodbProviderCache> {
		if (!MongodbProviderCache.CHANGE_STREAM_SUPPORTED) throw new Error("Change Streams are not supported");

		try {
			await new Promise((resolve, reject) => {
				this.changeStream = this.provider.collection.watch(this.provider.pipe);
				this.changeStream.once("error", reject);
				this.changeStream.once("close", reject);
				this.changeStream.once("end", reject);
				this.changeStream.once("resumeTokenChanged", resolve);
				this.changeStream.on("change", this.update);
			});
		} catch (error) {
			MongodbProviderCache.CHANGE_STREAM_SUPPORTED = false;
			console.error("change streams are not supported");
		}
		if (!this.opts?.onlyEvents) {
			await super.init();
		}
		return this;
	}

	update = (data: ChangeEvent<Record<string, any>>) => {
		const old = { ...data };

		switch (data.operationType) {
			case "insert":
				this.emit("insert", data.fullDocument);
				this.cache = data.documentKey.merge(this.cache);
				break;
			case "update":
				// ? if there are problems/data inconsistency -> use fullDocument: true and just set the complete object

				if (Array.isArray(data.updateDescription.removedFields)) {
					for (const key of data.updateDescription.removedFields) {
						delete this.cache[key];
					}
				}

				this.cache = data.updateDescription.updatedFields.merge(this.cache);

				break;
			case "replace":
				this.cache = data.fullDocument;
				break;
			case "invalidate":
				break;
			case "delete":
			case "drop":
			case "dropDatabase":
				this.cache = undefined;
				break;
			case "rename":
				// rename collection -> update nothing
				break;
			case "invalidate":
				return this.destroy();
		}

		this.emit("update", old, this.cache);
		this.emit("change", data);
	};

	async destroy() {
		this.changeStream?.off("change", this.update);
		await this.changeStream?.close();
		return super.destroy();
	}
}

function decycle(obj: any, stack = []): any {
	if (typeof obj === "bigint") return Long.fromString(obj.toString());
	if (!obj || typeof obj !== "object") return obj;
	if (typeof obj === "object" && !Array.isArray(obj) && obj.constructor.name !== "Object") return obj;

	// @ts-ignore
	if (stack.includes(obj)) return null;
	// @ts-ignore
	let s = stack.concat([obj]);

	return Array.isArray(obj)
		? obj.map((x) => decycle(x, s))
		: // @ts-ignore
		  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, decycle(v, s)]));
}

export class MongodbProvider extends Provider {
	public collection: Collection;
	public pipe: any[] = [];
	public document?: any;
	public subpath?: string;
	public updatepath?: string;
	public options: any = {};
	public arrayFilters: any[] = [];

	public cache(opts?: MongodbProviderCacheOptions) {
		return new MongodbProviderCache(this, opts);
	}

	constructor(protected db: MongoDatabase, protected path: DatastoreProxyPath) {
		super(db, path);
		if (!path.length) throw new Error("Path must contain at least one element");
		const collection = path[0];

		if (typeof collection.filter == "function" || typeof collection.filter == "string") {
			// run js on mongodb: https://docs.mongodb.com/manual/reference/operator/query/where/
			collection.filter = { $where: collection.filter.toString() };
			this.document = collection.filter;
		} else if (typeof collection.filter == "object" && collection.filter) {
			// @ts-ignore
			if (collection.filter?._id) collection.filter._id = mongoose.Types.ObjectId(collection.filter._id);
			this.document = collection.filter;

			collection.filter = { $match: collection.filter };
		}

		this.path = path.slice(1);
		path = this.path;

		if (!db.conn) throw new Error("Database not connected");

		this.collection = db.conn.collection(collection.name);

		if (path.length) {
			var pipe: any[] = [];
			var arrayFilters: any[] = [];
			var up: string[] = [];
			var i = 0;

			if (collection.filter) pipe.push(collection.filter);

			this.path.forEach((x, i) => {
				if (!x.filter) {
					up.push(x.name);
					if (!(pipe.last() || {})["$project"]) return pipe.push({ $project: { [x.name]: "$" + x.name } });

					var projection = pipe.last()["$project"];
					var key = Object.keys(projection)[0];
					projection[key] += "." + x.name;
					return;
				}

				var id = x.name + i++;

				up.push(x.name, `$[${id}]`);
				arrayFilters.push(this.convertFilterToQuery({ [id]: x.filter }));

				pipe.push({ $unwind: "$" + x.name }, { $replaceRoot: { newRoot: "$" + x.name } }, { $match: x.filter });
			});

			this.pipe = pipe;
			this.subpath = path.length ? path.map((x) => x.name).join(".") : undefined;
			this.updatepath = up.length ? up.join(".") : undefined;
			this.arrayFilters = arrayFilters;
		}

		this.options.upsert = true;
	}

	convertFilterToQuery(obj: any) {
		if (!obj) return obj;
		var walked = [];
		var res: any = {};
		var stack: any = [{ obj: obj, stack: "" }];

		while (stack.length > 0) {
			var item = stack.pop();
			var obj = item.obj;
			for (var property in obj) {
				if (obj.hasOwnProperty(property)) {
					if (typeof obj[property] == "object" && !Array.isArray(obj[property])) {
						var alreadyFound = false;
						for (var i = 0; i < walked.length; i++) {
							if (walked[i] === obj[property]) {
								alreadyFound = true;
								break;
							}
						}
						if (!alreadyFound) {
							walked.push(obj[property]);
							stack.push({ obj: obj[property], stack: item.stack + "." + property });
						}
					} else {
						if (Array.isArray(obj[property])) obj[property] = { $in: obj[property] };
						var id = (item.stack + ".").slice(1);
						res[id + property] = obj[property];
					}
				}
			}
		}
		return res;
	}

	convertResult(obj: any) {
		if (obj instanceof Long) return BigInt(obj.toString());
		if (typeof obj === "object" && obj != null) {
			Object.keys(obj).forEach((key) => {
				obj[key] = this.convertResult(obj[key]);
			});
		}

		return obj;
	}

	delete() {
		if (this.updatepath) {
			return this.checkIfModified(
				this.collection.updateOne(
					this.document,
					{ $unset: { [this.updatepath]: "" } },
					{ ...this.options, arrayFilters: this.arrayFilters }
				)
			);
		}
		if (this.document) return this.collection.deleteOne(this.document);

		return this.collection.conn.dropCollection(this.collection.name);
	}

	// TODO: convert Long Datatype to bigint
	async get(projection?: Projection) {
		projection = this.convertFilterToQuery(projection);
		if (this.pipe.length) {
			var lastProp: string | undefined = Object.keys(this.pipe.last()["$project"] || {})[0];
			if (projection) {
				if (lastProp) this.pipe.last()["$project"][lastProp] = projection;
				else this.pipe.push({ $project: projection });
			}

			// if (this.pipe.last()["$match"] && this.pipe.length > 1)
			// 	this.pipe.push({ $project: { [lastProp]: "$$ROOT" } }); // used to properly get the element if last pipe operator was an array filter
			let result = await this.collection.aggregate(this.pipe).toArray();
			if (result && result.length) {
				if (result.length === 1) return this.convertResult(lastProp ? result[0][lastProp] : result[0]);
				else return this.convertResult(result);
			}
			return undefined;
		}

		let result = await this.collection
			.find(this.document || {})
			.project(<any>projection)
			.toArray();

		if (this.document) {
			if (result && result.length) {
				if (result.length === 1) return this.convertResult(result[0]);
				else return this.convertResult(result);
			}
			return undefined;
		}

		return this.convertResult(result);
	}

	set(value: any): any {
		value = decycle(value);
		if (this.updatepath) {
			return this.checkIfModified(
				this.collection.updateOne(
					this.document || {},
					{ $set: { [this.updatepath]: value } },
					{ ...this.options, arrayFilters: this.arrayFilters }
				)
			);
		}

		// set collection -> insert all elements
		if (Array.isArray(value)) {
			// do not use insertmany -> fails if already exists
			var operations = value.map((x) => {
				return {
					updateOne: {
						filter: { id: x.id },
						update: {
							$set: x,
						},
						upsert: true,
					},
				};
			});
			return this.collection.bulkWrite(operations, {
				ordered: false,
			});
		} else {
			if (this.document) {
				return this.checkIfModified(this.collection.updateOne(this.document, { $set: value }, this.options));
			}
			return this.collection.insertOne(value);
		}
	}

	async exists() {
		// TODO make it efficient and do not fetch it
		return !!(await this.get());
	}

	async checkIfModified(result: any) {
		result = await result;
		return result.modifiedCount > 0;
	}

	push(element: any) {
		if (this.updatepath) {
			return this.checkIfModified(
				this.collection.updateOne(
					this.document,
					{ $push: { [this.updatepath]: element } },
					{ ...this.options, arrayFilters: this.arrayFilters }
				)
			);
		}

		return this.set(element);
	}

	pull() {
		if (this.subpath) {
			// @ts-ignore
			var { filter } = this.path.last();
			if (!filter) throw "the last property must specify a filter";
			return this.checkIfModified(
				this.collection.updateOne(this.document, { $pull: { [this.subpath]: filter } }, this.options)
			);
		}

		return this.pop();
	}

	pop() {
		// TODO
		return this.collection.deleteOne({});
	}

	async first() {
		if (this.subpath) {
			// @ts-ignore
			var { name } = this.path.last();

			var result = await this.collection
				.aggregate([
					...this.pipe,
					{ $unwind: "$" + name },
					{ $replaceRoot: { newRoot: "$" + name } },
					{ $limit: 1 },
				])
				.toArray();
			return result && result.length ? result[0] : undefined;
		}

		return await this.collection.findOne({}, { sort: { $natural: 1 } });
	}

	async last() {
		if (this.subpath) {
			// TODO
			return this.collection.findOne(this.document);
		}

		return await this.collection.findOne({}, { sort: { $natural: -1 } });
	}

	async random() {
		if (this.subpath) {
			// @ts-ignore
			var { name } = this.path.last();

			var result = await this.collection
				.aggregate([
					...this.pipe,
					{ $unwind: "$" + name },
					{ $replaceRoot: { newRoot: "$" + name } },
					{ $sample: { size: 1 } },
				])
				.toArray();
			return result && result.length ? result[0] : undefined;
		}

		return await this.collection.aggregate([{ $sample: { size: 1 } }]);
	}

	__getProvider() {
		return this;
	}
}
