import { DatastoreInterface, DatastoreProxyPath } from "./Datastore";
import { Provider } from "./Provider";

export abstract class Database {
	provider: typeof Provider;

	async init(): Promise<any> {}
	async destroy(): Promise<any> {}

	data: DatastoreInterface;
}
