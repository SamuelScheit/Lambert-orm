import { DatastoreInterface } from "./Datastore";
import { Provider } from "./Provider";
export declare abstract class Database {
    provider: typeof Provider;
    init(): Promise<any>;
    destroy(): Promise<any>;
    data: DatastoreInterface;
}
