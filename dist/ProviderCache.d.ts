/// <reference types="node" />
import "missing-native-js-functions";
import { Provider } from "./Provider";
import { EventEmitter } from "events";
export declare type ProviderCacheOptions = {};
export declare class ProviderCache extends EventEmitter {
    provider: Provider;
    opts?: ProviderCacheOptions | undefined;
    cache: any;
    private timeout;
    constructor(provider: Provider, opts?: ProviderCacheOptions | undefined);
    init(): Promise<ProviderCache>;
    delete(): any;
    set(value: any): any;
    get(): any;
    exists(): boolean;
    push(value: any): any;
    first(): any;
    last(): any;
    random(): any;
    destroy(): void;
}
