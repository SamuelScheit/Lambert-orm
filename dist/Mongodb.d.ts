import { Collection, Connection } from "mongoose";
import { Provider } from "./Provider";
import { ProviderCache, ProviderCacheOptions } from "./ProviderCache";
import { Database } from "./Database";
import { DatastoreProxyPath } from "./Datastore";
declare global {
    interface Array<T> {
        last(): T;
    }
}
export declare class MongoDatabase implements Database<MongodbProvider> {
    private uri?;
    private mongod?;
    mongoConnection?: Connection;
    provider: typeof MongodbProvider;
    constructor(uri?: string | undefined);
    get data(): any;
    init(): Promise<void>;
    destroy(): Promise<void>;
}
export declare class MongodbProviderCache extends ProviderCache {
    provider: MongodbProvider;
    private changeStream;
    constructor(provider: MongodbProvider, opts?: ProviderCacheOptions);
    init(): Promise<void>;
    update: (e: any) => void;
    destroy(): Promise<void>;
}
export declare class MongodbProvider implements Provider {
    private db;
    private path;
    collection: Collection;
    pipe: any[];
    document?: any;
    subpath?: string;
    updatepath?: string;
    options: any;
    arrayFilters: any[];
    get cache(): MongodbProviderCache;
    constructor(db: MongoDatabase, path: DatastoreProxyPath);
    convertFilterToQuery(obj: any): any;
    delete(): Promise<boolean> | Promise<import("mongodb").DeleteWriteOpResultObject> | Promise<void>;
    get(): Promise<any>;
    set(value: any): any;
    exists(): Promise<boolean>;
    checkIfModified(result: any): Promise<boolean>;
    push(element: any): any;
    pull(): Promise<boolean> | Promise<import("mongodb").DeleteWriteOpResultObject>;
    pop(): Promise<import("mongodb").DeleteWriteOpResultObject>;
    first(): Promise<any>;
    last(): Promise<any>;
    random(): Promise<any>;
    __getProvider(): this;
}
//# sourceMappingURL=Mongodb.d.ts.map