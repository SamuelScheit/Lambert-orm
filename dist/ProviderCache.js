"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderCache = void 0;
const events_1 = require("events");
class ProviderCache extends events_1.EventEmitter {
    constructor(provider, opts) {
        super();
        this.provider = provider;
        this.opts = opts;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cache = yield this.provider.get();
        });
    }
    delete() {
        this.cache = undefined;
        return this.provider.delete();
    }
    set(value) {
        this.cache = value;
        return this.provider.set(value);
    }
    get() {
        return this.cache;
    }
    exists() {
        return !!this.cache;
    }
    push(value) {
        this.cache = (this.cache || []).push(value);
        return this.provider.push(value);
    }
    first() {
        return (this.cache || []).first();
    }
    last() {
        return (this.cache || []).last();
    }
    random() {
        return (this.cache || []).random();
    }
    destroy() {
        this.cache = null;
    }
}
exports.ProviderCache = ProviderCache;
//# sourceMappingURL=ProviderCache.js.map