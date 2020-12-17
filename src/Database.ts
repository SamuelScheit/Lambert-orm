import { DatastoreInterface, DatastoreProxyPath } from "./Datastore";
import { Provider } from "./Provider";

export interface Database<P extends Provider> {
	provider: new (db: Database<P>, path: DatastoreProxyPath) => P;

	init(): Promise<any>;
	destroy(): Promise<any>;

	data: DatastoreInterface & Provider;
}
