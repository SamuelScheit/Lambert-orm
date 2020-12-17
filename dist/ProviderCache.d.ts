/// <reference types="node" />
import { Provider } from "./Provider";
import { EventEmitter } from "events";
export declare type ProviderCacheOptions = {};
export declare class ProviderCache extends EventEmitter {
    provider: Provider;
    private opts?;
    private cache;
    private timeout;
    constructor(provider: Provider, opts?: ProviderCacheOptions | undefined);
    init(): Promise<void>;
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
//# sourceMappingURL=ProviderCache.d.ts.map