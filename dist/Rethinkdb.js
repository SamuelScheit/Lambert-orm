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
exports.RethinkdbProvider = exports.RethinkdbProviderCache = exports.RethinkDatabase = void 0;
const Database_1 = require("./Database");
const rethinkdb_ts_1 = require("rethinkdb-ts");
const Datastore_1 = require("./Datastore");
const _1 = require(".");
require("missing-native-js-functions");
class RethinkDatabase extends Database_1.Database {
    constructor(opts) {
        super();
        this.opts = opts;
        this.provider = RethinkdbProvider;
        this.connected = false;
        this.tables = [];
    }
    // @ts-ignore
    get data() {
        return Datastore_1.Datastore(this);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.connection = yield rethinkdb_ts_1.r.connect(this.opts);
            try {
                yield rethinkdb_ts_1.r.dbCreate(this.opts.db).run(this.connection);
            }
            catch (error) { }
            this.tables = yield rethinkdb_ts_1.r.tableList().run(this.connection);
            this.connected = true;
            this.emit("connect");
            this.connection.on("error", (e) => this.emit("error", e));
            this.connection.on("close", () => this.emit("close"));
            this.connection.on("timeout", () => this.emit("timeout"));
            this.connection.on("connect", () => this.emit("connect"));
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connection.close();
        });
    }
}
exports.RethinkDatabase = RethinkDatabase;
class RethinkdbProviderCache extends _1.ProviderCache {
}
exports.RethinkdbProviderCache = RethinkdbProviderCache;
class RethinkdbProvider extends _1.Provider {
    constructor(db, path) {
        super(db, path);
        this.db = db;
        this.path = path;
        if (!db.connected)
            throw new Error("Database is not connected");
        if (!path.length)
            throw new Error("Path must contain at least one element");
        this.table = path[0].name;
        this.path.forEach((path) => {
            if (typeof path.filter === "function") {
                path.filter = rethinkdb_ts_1.r.js(`(${path.filter})`);
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db.tables.includes(this.table)) {
                this.db.tables.push(this.table);
                yield rethinkdb_ts_1.r.tableCreate(this.table).run(this.db.connection);
            }
            var query = rethinkdb_ts_1.r.table(this.table);
            return query;
        });
    }
    query() {
        return __awaiter(this, void 0, void 0, function* () {
            let query = yield this.init();
            let i = 0;
            for (const path of this.path) {
                if (i == 0) {
                }
                else if (i == 1) {
                    query = query.getField(path.name);
                }
                else
                    query = query.concatMap(rethinkdb_ts_1.r.row(path.name));
                if (path.filter)
                    query = query.filter(path.filter);
                i++;
            }
            return query;
        });
    }
    getFilter(paths) {
        const result = {};
        let current = result;
        let lastFilter = paths.findLastIndex((x) => x.filter);
        if (lastFilter == -1)
            return result;
        for (let i = 0; i < paths.length; i++) {
            if (i === lastFilter) {
                break;
            }
        }
        for (const path of paths) {
            current[path.name] = path.filter || {};
            current = current[path.name];
        }
        return result;
    }
    get(projection) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = yield this.query();
            if (projection)
                query = query.pluck(projection);
            return query.run(this.db.connection);
        });
    }
    set(value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let query = yield this.init();
                let path = this.path.slice(1, this.path.length - 1);
                let last = this.path.slice(1).last();
                let filter = typeof value === "object" && value != null ? Object.assign(Object.assign({}, last === null || last === void 0 ? void 0 : last.filter), value) : value;
                let name = last === null || last === void 0 ? void 0 : last.name;
                let newValue = this.getFilter([...path, { name, filter }]);
                const result = yield query.update(newValue).run(this.db.connection);
                if (result.inserted || result.replaced)
                    return result;
                yield query.insert(value).run(this.db.connection);
            }
            catch (error) {
                return error;
            }
        });
    }
    // @ts-ignore
    get cache() {
        return new RethinkdbProviderCache(this);
    }
}
exports.RethinkdbProvider = RethinkdbProvider;
//# sourceMappingURL=Rethinkdb.js.map