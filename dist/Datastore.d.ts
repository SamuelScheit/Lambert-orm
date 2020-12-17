import { Database } from "./Database";
import { Provider } from "./Provider";
export declare type DatastoreProxyPath = {
    name: string;
    filter?: any;
}[];
export interface DatastoreInterface {
    [key: string]: DatastoreInterface & Provider & {
        (...args: any[]): any;
    };
}
export declare function Datastore(db: Database, path?: DatastoreProxyPath): DatastoreInterface;
//# sourceMappingURL=Datastore.d.ts.map