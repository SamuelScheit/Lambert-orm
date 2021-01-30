import { Database } from "./Database";
import { Connection, RConnectionOptions, RTable, RStream } from "rethinkdb-ts";
import { DatastoreInterface, DatastoreProxyPath } from "./Datastore";
import { Provider, ProviderCache } from ".";
import { Projection } from "./Provider";
import "missing-native-js-functions";
export declare type RethinkDatabaseOptions = RConnectionOptions & {
    db: string;
};
export declare class RethinkDatabase extends Database {
    opts: RethinkDatabaseOptions;
    provider: typeof RethinkdbProvider;
    connection: Connection;
    connected: boolean;
    tables: string[];
    constructor(opts: RethinkDatabaseOptions);
    get data(): DatastoreInterface;
    init(): Promise<void>;
    destroy(): Promise<void>;
}
export declare class RethinkdbProviderCache extends ProviderCache {
}
export declare class RethinkdbProvider extends Provider {
    protected db: RethinkDatabase;
    protected path: DatastoreProxyPath;
    table: string;
    document?: any;
    constructor(db: RethinkDatabase, path: DatastoreProxyPath);
    init(): Promise<RStream<any> | RTable<any>>;
    query(): Promise<RStream<any> | RTable<any>>;
    getFilter(paths: DatastoreProxyPath): any;
    get(projection?: Projection): Promise<any[]>;
    set(value: any): Promise<any>;
    get cache(): RethinkdbProviderCache;
}
