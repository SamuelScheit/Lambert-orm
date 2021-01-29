import { EventEmitter } from "events";
import { DatastoreInterface, DatastoreProxyPath } from "./Datastore";
import { Provider } from "./Provider";

export abstract class Database extends EventEmitter {
	public provider: typeof Provider;
	public data: DatastoreInterface;

	public async init(): Promise<any> {}
	public async destroy(): Promise<any> {}
}
