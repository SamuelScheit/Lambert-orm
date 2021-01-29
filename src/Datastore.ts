import { Database } from "./Database";
import { Provider } from "./Provider";

const noop = () => {};
const methods = ["delete", "set", "get", "exists", "push", "first", "last", "random", "cache", "__getProvider"];
const reflectors = [
	"toString",
	"valueOf",
	"inspect",
	"constructor",
	Symbol.toPrimitive,
	Symbol.for("nodejs.util.inspect.custom"),
];

export type DatastoreProxyPath = { name: string; filter?: any }[];

type Methods = "delete" | "set" | "get" | "exists" | "push" | "first" | "last" | "random" | "cache" | "__getProvider";

export interface DatastoreInterface {
	[key: string]: DatastoreInterface & Provider & { (...args: any[]): any };
}

export function Datastore(db: Database, path: DatastoreProxyPath = []): DatastoreInterface {
	let method: Methods;

	const handler = {
		get(target: Function, name: string): WindowProxy | Function {
			if (reflectors.includes(name)) return () => path.join("."); // debugger is requesting prop -> don't add to path
			if (methods.includes(name)) {
				// check if method is called e.g. get()
				method = <Methods>name;
			} else {
				path.push({ name, filter: null }); // add to the path -> name of the prop, unique id to add it mongo arrayFilters
			}
			return new Proxy(noop, handler);
		},
		apply(_: any, self: any, args: any[]): WindowProxy | Promise<any> {
			var arg = args[0];

			// @ts-ignore
			if (method === "__getProvider") return new db.provider(db, path);

			if (methods.includes(method)) {
				// @ts-ignore
				return new db.provider(db, path)[method](arg); // actually run the query
			}

			path[path.length - 1].filter = arg;

			return new Proxy(noop, handler);
		},
	};
	return new Proxy(noop, handler);
}
