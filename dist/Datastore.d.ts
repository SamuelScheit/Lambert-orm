import { Database } from "./Database";
import { Provider } from "./Provider";
export declare type DatastoreProxyPath = {
    name: string;
    filter?: any;
}[];
export interface DatastoreInterface {
    delete(): any;
    set(value: any): any;
    get(): any;
    exists(): any;
    push(value: any): any;
    first(): any;
    last(): any;
    random(): any;
}
export declare function Datastore<P extends Provider>(db: Database<P>, path?: DatastoreProxyPath): any | DatastoreInterface;
//# sourceMappingURL=Datastore.d.ts.map