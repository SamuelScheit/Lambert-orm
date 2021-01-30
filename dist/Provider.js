"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
Array.prototype.last = function () {
    return this[this.length - 1];
};
class Provider {
    constructor(db, path) {
        this.db = db;
        this.path = path;
    }
    delete() { }
    set(value) { }
    get(projection) { }
    exists() { }
    push(value) { }
    first() { }
    last() { }
    random() { }
    __getProvider() {
        return this;
    }
    cache() {
        throw new Error("not implemented");
    }
}
exports.Provider = Provider;
//# sourceMappingURL=Provider.js.map