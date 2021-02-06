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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongodbProvider = exports.MongodbProviderCache = exports.MongoDatabase = void 0;
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const Provider_1 = require("./Provider");
const ProviderCache_1 = require("./ProviderCache");
const Database_1 = require("./Database");
const fs_1 = __importDefault(require("fs"));
const Datastore_1 = require("./Datastore");
Array.prototype.last = function () {
    return this[this.length - 1];
};
class MongoDatabase extends Database_1.Database {
    constructor(uri) {
        super();
        this.uri = uri;
        this.provider = MongodbProvider;
    }
    // @ts-ignore
    get data() {
        return Datastore_1.Datastore(this);
    }
    init() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let localServer = !this.uri;
            if (localServer) {
                const dbPath = `${__dirname}/../database/`;
                if (!fs_1.default.existsSync(dbPath))
                    fs_1.default.mkdirSync(dbPath);
                this.mongod = new mongodb_memory_server_1.MongoMemoryServer({
                    instance: {
                        dbName: "lambert",
                        dbPath,
                        storageEngine: "wiredTiger",
                        auth: false,
                        args: [],
                        port: 54618,
                    },
                });
                yield this.mongod.start();
                this.uri = yield ((_a = this.mongod) === null || _a === void 0 ? void 0 : _a.getUri());
                console.log(this.uri);
            }
            let options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            };
            // mongodb://127.0.0.1:54618/lambert?readPreference=primaryPreferred&appname=MongoDB%20Compass&ssl=false
            this.conn = yield mongoose_1.default.createConnection(this.uri, options);
            this.conn.on("error", console.error);
            if (localServer) {
                try {
                    yield this.conn.db.admin().command({ replSetInitiate: { _id: "test" } });
                }
                catch (error) { }
            }
        });
    }
    destroy() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([(_a = this.conn) === null || _a === void 0 ? void 0 : _a.close(), (_b = this.mongod) === null || _b === void 0 ? void 0 : _b.stop()]);
        });
    }
}
exports.MongoDatabase = MongoDatabase;
class MongodbProviderCache extends ProviderCache_1.ProviderCache {
    constructor(provider, opts) {
        // @ts-ignore
        super(provider, opts);
        this.provider = provider;
        this.opts = opts;
        this.update = (data) => {
            // TODO: update internal cache object
            this.emit("change", data);
        };
    }
    init() {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!MongodbProviderCache.CHANGE_STREAM_SUPPORTED)
                throw new Error("Change Streams are not supported");
            try {
                yield new Promise((resolve, reject) => {
                    this.changeStream = this.provider.collection.watch(this.provider.pipe);
                    this.changeStream.once("error", reject);
                    this.changeStream.once("close", reject);
                    this.changeStream.once("end", reject);
                    this.changeStream.once("resumeTokenChanged", resolve);
                    this.changeStream.on("change", this.update);
                });
            }
            catch (error) {
                MongodbProviderCache.CHANGE_STREAM_SUPPORTED = false;
                console.error("change streams are not supported");
            }
            if (!((_a = this.opts) === null || _a === void 0 ? void 0 : _a.onlyEvents)) {
                yield _super.init.call(this);
            }
            return this;
        });
    }
    destroy() {
        const _super = Object.create(null, {
            destroy: { get: () => super.destroy }
        });
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.changeStream) === null || _a === void 0 ? void 0 : _a.off("change", this.update);
            yield ((_b = this.changeStream) === null || _b === void 0 ? void 0 : _b.close());
            return _super.destroy.call(this);
        });
    }
}
exports.MongodbProviderCache = MongodbProviderCache;
MongodbProviderCache.CHANGE_STREAM_SUPPORTED = true;
function decycle(obj, stack = []) {
    if (typeof obj === "bigint")
        return mongodb_1.Long.fromString(obj.toString());
    if (!obj || typeof obj !== "object")
        return obj;
    if (typeof obj === "object" && !Array.isArray(obj) && obj.constructor.name !== "Object")
        return obj;
    // @ts-ignore
    if (stack.includes(obj))
        return null;
    // @ts-ignore
    let s = stack.concat([obj]);
    return Array.isArray(obj)
        ? obj.map((x) => decycle(x, s))
        : // @ts-ignore
            Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, decycle(v, s)]));
}
class MongodbProvider extends Provider_1.Provider {
    constructor(db, path) {
        var _a;
        super(db, path);
        this.db = db;
        this.path = path;
        this.pipe = [];
        this.options = {};
        this.arrayFilters = [];
        if (!path.length)
            throw new Error("Path must contain at least one element");
        const collection = path[0];
        if (typeof collection.filter == "function" || typeof collection.filter == "string") {
            // run js on mongodb: https://docs.mongodb.com/manual/reference/operator/query/where/
            collection.filter = { $where: collection.filter.toString() };
            this.document = collection.filter;
        }
        else if (typeof collection.filter == "object" && collection.filter) {
            // @ts-ignore
            if ((_a = collection.filter) === null || _a === void 0 ? void 0 : _a._id)
                collection.filter._id = mongoose_1.default.Types.ObjectId(collection.filter._id);
            this.document = collection.filter;
            collection.filter = { $match: collection.filter };
        }
        this.path = path.slice(1);
        path = this.path;
        if (!db.conn)
            throw new Error("Database not connected");
        this.collection = db.conn.collection(collection.name);
        if (path.length) {
            var pipe = [];
            var arrayFilters = [];
            var up = [];
            var i = 0;
            if (collection.filter)
                pipe.push(collection.filter);
            this.path.forEach((x, i) => {
                if (!x.filter) {
                    up.push(x.name);
                    if (!(pipe.last() || {})["$project"])
                        return pipe.push({ $project: { [x.name]: "$" + x.name } });
                    var projection = pipe.last()["$project"];
                    var key = Object.keys(projection)[0];
                    projection[key] += "." + x.name;
                    return;
                }
                var id = x.name + i++;
                up.push(x.name, `$[${id}]`);
                arrayFilters.push(this.convertFilterToQuery({ [id]: x.filter }));
                pipe.push({ $unwind: "$" + x.name }, { $replaceRoot: { newRoot: "$" + x.name } }, { $match: x.filter });
            });
            this.pipe = pipe;
            this.subpath = path.length ? path.map((x) => x.name).join(".") : undefined;
            this.updatepath = up.length ? up.join(".") : undefined;
            this.arrayFilters = arrayFilters;
        }
        this.options.upsert = true;
    }
    cache(opts) {
        return new MongodbProviderCache(this, opts);
    }
    convertFilterToQuery(obj) {
        if (!obj)
            return obj;
        var walked = [];
        var res = {};
        var stack = [{ obj: obj, stack: "" }];
        while (stack.length > 0) {
            var item = stack.pop();
            var obj = item.obj;
            for (var property in obj) {
                if (obj.hasOwnProperty(property)) {
                    if (typeof obj[property] == "object" && !Array.isArray(obj[property])) {
                        var alreadyFound = false;
                        for (var i = 0; i < walked.length; i++) {
                            if (walked[i] === obj[property]) {
                                alreadyFound = true;
                                break;
                            }
                        }
                        if (!alreadyFound) {
                            walked.push(obj[property]);
                            stack.push({ obj: obj[property], stack: item.stack + "." + property });
                        }
                    }
                    else {
                        if (Array.isArray(obj[property]))
                            obj[property] = { $in: obj[property] };
                        var id = (item.stack + ".").slice(1);
                        res[id + property] = obj[property];
                    }
                }
            }
        }
        return res;
    }
    delete() {
        if (this.updatepath) {
            return this.checkIfModified(this.collection.updateOne(this.document, { $unset: { [this.updatepath]: "" } }, Object.assign(Object.assign({}, this.options), { arrayFilters: this.arrayFilters })));
        }
        if (this.document)
            return this.collection.deleteOne(this.document);
        return this.collection.conn.dropCollection(this.collection.name);
    }
    get(projection) {
        return __awaiter(this, void 0, void 0, function* () {
            projection = this.convertFilterToQuery(projection);
            if (this.pipe.length) {
                var lastProp = Object.keys(this.pipe.last()["$project"] || {})[0];
                if (projection) {
                    if (lastProp)
                        this.pipe.last()["$project"][lastProp] = projection;
                    else
                        this.pipe.push({ $project: projection });
                }
                // if (this.pipe.last()["$match"] && this.pipe.length > 1)
                // 	this.pipe.push({ $project: { [lastProp]: "$$ROOT" } }); // used to properly get the element if last pipe operator was an array filter
                let result = yield this.collection.aggregate(this.pipe).toArray();
                if (result && result.length) {
                    if (result.length === 1)
                        return lastProp ? result[0][lastProp] : result[0];
                    else
                        return result;
                }
                return undefined;
            }
            let result = yield this.collection
                .find(this.document || {})
                .project(projection)
                .toArray();
            if (this.document) {
                if (result && result.length) {
                    if (result.length === 1)
                        return result[0];
                    else
                        return result;
                }
                return undefined;
            }
            return result;
        });
    }
    set(value) {
        value = decycle(value);
        if (this.updatepath) {
            return this.checkIfModified(this.collection.updateOne(this.document || {}, { $set: { [this.updatepath]: value } }, Object.assign(Object.assign({}, this.options), { arrayFilters: this.arrayFilters })));
        }
        // set collection -> insert all elements
        if (Array.isArray(value)) {
            // do not use insertmany -> fails if already exists
            var operations = value.map((x) => {
                return {
                    updateOne: {
                        filter: { id: x.id },
                        update: {
                            $set: x,
                        },
                        upsert: true,
                    },
                };
            });
            return this.collection.bulkWrite(operations, {
                ordered: false,
            });
        }
        else {
            if (this.document) {
                return this.checkIfModified(this.collection.updateOne(this.document, { $set: value }, this.options));
            }
            return this.collection.insertOne(value);
        }
    }
    exists() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO make it efficient and do not fetch it
            return !!(yield this.get());
        });
    }
    checkIfModified(result) {
        return __awaiter(this, void 0, void 0, function* () {
            result = yield result;
            return result.modifiedCount > 0;
        });
    }
    push(element) {
        if (this.updatepath) {
            return this.checkIfModified(this.collection.updateOne(this.document, { $push: { [this.updatepath]: element } }, Object.assign(Object.assign({}, this.options), { arrayFilters: this.arrayFilters })));
        }
        return this.set(element);
    }
    pull() {
        if (this.subpath) {
            // @ts-ignore
            var { filter } = this.path.last();
            if (!filter)
                throw "the last property must specify a filter";
            return this.checkIfModified(this.collection.updateOne(this.document, { $pull: { [this.subpath]: filter } }, this.options));
        }
        return this.pop();
    }
    pop() {
        // TODO
        return this.collection.deleteOne({});
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.subpath) {
                // @ts-ignore
                var { name } = this.path.last();
                var result = yield this.collection
                    .aggregate([
                    ...this.pipe,
                    { $unwind: "$" + name },
                    { $replaceRoot: { newRoot: "$" + name } },
                    { $limit: 1 },
                ])
                    .toArray();
                return result && result.length ? result[0] : undefined;
            }
            return this.collection.findOne({}, { sort: { $natural: 1 } });
        });
    }
    last() {
        if (this.subpath) {
            // TODO
            return this.collection.findOne(this.document);
        }
        return this.collection.findOne({}, { sort: { $natural: -1 } });
    }
    random() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.subpath) {
                // @ts-ignore
                var { name } = this.path.last();
                var result = yield this.collection
                    .aggregate([
                    ...this.pipe,
                    { $unwind: "$" + name },
                    { $replaceRoot: { newRoot: "$" + name } },
                    { $sample: { size: 1 } },
                ])
                    .toArray();
                return result && result.length ? result[0] : undefined;
            }
            return this.collection.aggregate([{ $sample: { size: 1 } }]);
        });
    }
    __getProvider() {
        return this;
    }
}
exports.MongodbProvider = MongodbProvider;
//# sourceMappingURL=Mongodb.js.map