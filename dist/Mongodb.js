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
const Provider_1 = require("./Provider");
const ProviderCache_1 = require("./ProviderCache");
const fs_1 = __importDefault(require("fs"));
const Datastore_1 = require("./Datastore");
Array.prototype.last = function () {
    return this[this.length - 1];
};
class MongoDatabase {
    constructor(uri) {
        this.uri = uri;
        this.provider = MongodbProvider;
    }
    get data() {
        return Datastore_1.Datastore(this);
    }
    init() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.uri) {
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
                    autoStart: true,
                });
                this.uri = yield ((_a = this.mongod) === null || _a === void 0 ? void 0 : _a.getUri());
            }
            let options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            };
            this.mongoConnection = yield mongoose_1.default.createConnection(this.uri, options);
            this.mongoConnection.on("error", console.error);
        });
    }
    destroy() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([(_a = this.mongoConnection) === null || _a === void 0 ? void 0 : _a.close(), (_b = this.mongod) === null || _b === void 0 ? void 0 : _b.stop()]);
        });
    }
}
exports.MongoDatabase = MongoDatabase;
class MongodbProviderCache extends ProviderCache_1.ProviderCache {
    constructor(provider, opts) {
        // @ts-ignore
        super(provider, opts);
        this.provider = provider;
        this.update = (e) => {
            console.log("changestream", this, e);
        };
    }
    init() {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (!MongodbProviderCache.CHANGE_STREAM_SUPPORTED)
                return;
            try {
                yield new Promise((resolve, reject) => {
                    this.changeStream = this.provider.collection.watch(this.provider.pipe);
                    this.changeStream.once("error", reject);
                    this.changeStream.once("close", reject);
                    this.changeStream.once("end", reject);
                    // this.changeStream.once("resumeTokenChanged", resolve);
                    this.changeStream.on("change", this.update);
                });
            }
            catch (error) {
                MongodbProviderCache.CHANGE_STREAM_SUPPORTED = false;
                console.error("change streams are not supported");
            }
            return _super.init.call(this);
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
    if (!obj || typeof obj !== "object")
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
        if (!db.mongoConnection)
            throw new Error("Database not connected");
        this.collection = db.mongoConnection.collection(collection.name);
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
    // @ts-ignore
    get cache() {
        return new MongodbProviderCache(this);
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
            return result;
        });
    }
    set(value) {
        value = decycle(value);
        if (this.updatepath) {
            return this.checkIfModified(this.collection.updateOne(this.document, { $set: { [this.updatepath]: value } }, Object.assign(Object.assign({}, this.options), { arrayFilters: this.arrayFilters })));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9uZ29kYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Nb25nb2RiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlFQUEwRDtBQUMxRCx3REFBbUU7QUFFbkUseUNBQWtEO0FBQ2xELG1EQUFzRTtBQUV0RSw0Q0FBb0I7QUFDcEIsMkNBQWdGO0FBRWhGLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHO0lBQ3RCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDO0FBUUYsTUFBYSxhQUFhO0lBS3pCLFlBQW9CLEdBQVk7UUFBWixRQUFHLEdBQUgsR0FBRyxDQUFTO1FBRnpCLGFBQVEsR0FBRyxlQUFlLENBQUM7SUFFQyxDQUFDO0lBRXBDLElBQUksSUFBSTtRQUNQLE9BQU8scUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUssSUFBSTs7O1lBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ2QsTUFBTSxNQUFNLEdBQUcsR0FBRyxTQUFTLGVBQWUsQ0FBQztnQkFFM0MsSUFBSSxDQUFDLFlBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUFFLFlBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx5Q0FBaUIsQ0FBQztvQkFDbkMsUUFBUSxFQUFFO3dCQUNULE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNO3dCQUNOLGFBQWEsRUFBRSxZQUFZO3dCQUMzQixJQUFJLEVBQUUsS0FBSzt3QkFDWCxJQUFJLEVBQUUsRUFBRTt3QkFDUixJQUFJLEVBQUUsS0FBSztxQkFDWDtvQkFDRCxTQUFTLEVBQUUsSUFBSTtpQkFDZixDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLEdBQUcsR0FBRyxhQUFNLElBQUksQ0FBQyxN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