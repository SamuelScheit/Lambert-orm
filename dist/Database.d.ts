/// <reference types="node" />
import { EventEmitter } from "events";
import { DatastoreInterface } from "./Datastore";
import { Provider } from "./Provider";
export declare abstract class Database extends EventEmitter {
    provider: typeof Provider;
    data: DatastoreInterface;
    init(): Promise<any>;
    destroy(): Promise<any>;
}
