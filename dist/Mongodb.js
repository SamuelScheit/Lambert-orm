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
                        replSet: "test",
                        auth: false,
                        args: [],
                        port: 54618,
                    },
                    autoStart: true,
                });
                this.uri = `${yield ((_a = this.mongod) === null || _a === void 0 ? void 0 : _a.getUri())}`;
                console.log(this.uri);
            }
            let options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            };
            // mongodb://127.0.0.1:54618/lambert?readPreference=primaryPreferred&appname=MongoDB%20Compass&ssl=false
            this.mongoConnection = yield mongoose_1.default.createConnection(this.uri, options);
            this.mongoConnection.on("error", console.error);
            if (localServer) {
                try {
                    yield this.mongoConnection.db.admin().command({ replSetInitiate: { _id: "test" } });
                }
                catch (error) { }
            }
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
        this.update = (data) => {
            this.emit("change", data);
        };
    }
    init() {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
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
            yield _super.init.call(this);
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
    cache() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9uZ29kYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Nb25nb2RiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlFQUEwRDtBQUMxRCx3REFBbUU7QUFFbkUseUNBQWtEO0FBQ2xELG1EQUFzRTtBQUN0RSx5Q0FBc0M7QUFDdEMsNENBQW9CO0FBQ3BCLDJDQUFnRjtBQUVoRixLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRztJQUN0QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQztBQVFGLE1BQWEsYUFBYyxTQUFRLG1CQUFRO0lBSzFDLFlBQW9CLEdBQVk7UUFDL0IsS0FBSyxFQUFFLENBQUM7UUFEVyxRQUFHLEdBQUgsR0FBRyxDQUFTO1FBRnpCLGFBQVEsR0FBRyxlQUFlLENBQUM7SUFJbEMsQ0FBQztJQUVELGFBQWE7SUFDYixJQUFJLElBQUk7UUFDUCxPQUFPLHFCQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVLLElBQUk7OztZQUNULElBQUksV0FBVyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixJQUFJLFdBQVcsRUFBRTtnQkFDaEIsTUFBTSxNQUFNLEdBQUcsR0FBRyxTQUFTLGVBQWUsQ0FBQztnQkFFM0MsSUFBSSxDQUFDLFlBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUFFLFlBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx5Q0FBaUIsQ0FBQztvQkFDbkMsUUFBUSxFQUFFO3dCQUNULE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNO3dCQUNOLGFBQWEsRUFBRSxZQUFZO3dCQUMzQixPQUFPLEVBQUUsTUFBTTt3QkFDZixJQUFJLEVBQUUsS0FBSzt3QkFDWCxJQUFJLEVBQUUsRUFB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