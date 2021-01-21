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
        this.document = {};
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
                .find(this.document)
                .project(projection)
                .toArray();
            if (result && result.length) {
                if (result.length === 1)
                    return result[0];
                else
                    return result;
            }
            return undefined;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9uZ29kYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Nb25nb2RiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlFQUEwRDtBQUMxRCx3REFBbUU7QUFFbkUseUNBQWtEO0FBQ2xELG1EQUFzRTtBQUV0RSw0Q0FBb0I7QUFDcEIsMkNBQWdGO0FBRWhGLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHO0lBQ3RCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDO0FBUUYsTUFBYSxhQUFhO0lBS3pCLFlBQW9CLEdBQVk7UUFBWixRQUFHLEdBQUgsR0FBRyxDQUFTO1FBRnpCLGFBQVEsR0FBRyxlQUFlLENBQUM7SUFFQyxDQUFDO0lBRXBDLElBQUksSUFBSTtRQUNQLE9BQU8scUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUssSUFBSTs7O1lBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ2QsTUFBTSxNQUFNLEdBQUcsR0FBRyxTQUFTLGVBQWUsQ0FBQztnQkFFM0MsSUFBSSxDQUFDLFlBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUFFLFlBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx5Q0FBaUIsQ0FBQztvQkFDbkMsUUFBUSxFQUFFO3dCQUNULE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNO3dCQUNOLGFBQWEsRUFBRSxZQUFZO3dCQUMzQixJQUFJLEVBQUUsS0FBSzt3QkFDWCxJQUFJLEVBQUUsRUFBRTt3QkFDUixJQUFJLEVBQUUsS0FBSztxQkFDWDtvQkFDRCxTQUFTLEVBQUUsSUFBSTtpQkFDZixDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLEdBQUcsR0FBRyxhQUFNLElBQUksQ0FBQyxNQUFNLDBDQUFFLE1BQU0sR0FBRSxDQUFDO2FBQ3ZDO1lBQ0QsSUFBSSxPQUFPLEdBQUc7Z0JBQ2IsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGtCQUFrQixFQUFFLElBQUk7YUFDeEIsQ0FBQztZQUVGLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxrQkFBUSxDQUFDLGdCQUFnQixDQUFTLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbEYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzs7S0FDaEQ7SUFFSyxPQUFPOzs7WUFDWixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBQyxJQUFJLENBQUMsZUFBZSwwQ0FBRSxLQUFLLFVBQUksSUFBSSxDQUFDLE1BQU0sMENBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQzs7S0FDeEU7Q0FDRDtBQXpDRCxzQ0F5Q0M7QUFFRCxNQUFhLG9CQUFxQixTQUFRLDZCQUFhO0lBSXRELFlBQW1CLFFBQXlCLEVBQUUsSUFBMkI7UUFDeEUsYUFBYTtRQUNiLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFGSixhQUFRLEdBQVIsUUFBUSxDQUFpQjtRQXdCNUMsV0FBTSxHQUFHLENBQUMsQ0FBTSxFQUFFLEVBQUU7WUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQztJQXZCRixDQUFDO0lBRUssSUFBSTs7Ozs7WUFDVCxJQUFJLENBQUMsb0JBQW9CLENBQUMsdUJBQXVCO2dCQUFFLE9BQU87WUFFMUQsSUFBSTtnQkFDSCxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUNyQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN2RSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUN0Qyx5REFBeUQ7b0JBQ3pELElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzdDLENBQUMsQ0FBQyxDQUFDO2FBQ0g7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDZixvQkFBb0IsQ0FBQyx1QkFBdUIsR0FBRyxLQUFLLENBQUM7Z0JBQ3JELE9BQU8sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQzthQUNsRDtZQUNELE9BQU8sT0FBTSxJQUFJLFlBQUc7UUFDckIsQ0FBQztLQUFBO0lBTUssT0FBTzs7Ozs7O1lBQ1osTUFBQSxJQUFJLENBQUMsWUFBWSwwQ0FBRSxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDOUMsYUFBTSxJQUFJLENBQUMsWUFBWSwwQ0FBRSxLQUFLLEdBQUUsQ0FBQztZQUNqQyxPQUFPLE9BQU0sT0FBTyxZQUFHOztLQUN2Qjs7QUFwQ0Ysb0RBcUNDO0FBbkNjLDRDQUF1QixHQUFZLElBQUksQ0FBQztBQXFDdkQsU0FBUyxPQUFPLENBQUMsR0FBUSxFQUFFLEtBQUssR0FBRyxFQUFFO0lBQ3BDLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtRQUFFLE9BQU8sR0FBRyxDQUFDO0lBRWhELGFBQWE7SUFDYixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFDckMsYUFBYTtJQUNiLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTVCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDeEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLGFBQWE7WUFDYixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEYsQ0FBQztBQUVELE1BQWEsZUFBZ0IsU0FBUSxtQkFBUTtJQWM1QyxZQUFzQixFQUFpQixFQUFZLElBQXdCOztRQUMxRSxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBREssT0FBRSxHQUFGLEVBQUUsQ0FBZTtRQUFZLFNBQUksR0FBSixJQUFJLENBQW9CO1FBWnBFLFNBQUksR0FBVSxFQUFFLENBQUM7UUFDakIsYUFBUSxHQUFTLEVBQUUsQ0FBQztRQUdwQixZQUFPLEdBQVEsRUFBRSxDQUFDO1FBQ2xCLGlCQUFZLEdBQVUsRUFBRSxDQUFDO1FBUy9CLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUzQixJQUFJLE9BQU8sVUFBVSxDQUFDLE1BQU0sSUFBSSxVQUFVLElBQUksT0FBTyxVQUFVLENBQUMsTUFBTSxJQUFJLFFBQVEsRUFBRTtZQUNuRixxRkFBcUY7WUFDckYsVUFBVSxDQUFDLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7WUFDN0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1NBQ2xDO2FBQU0sSUFBSSxPQUFPLFVBQVUsQ0FBQyxNQUFNLElBQUksUUFBUSxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUU7WUFDckUsYUFBYTtZQUNiLFVBQUksVUFBVSxDQUFDLE1BQU0sMENBQUUsR0FBRztnQkFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxrQkFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuRyxJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFFbEMsVUFBVSxDQUFDLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDbEQ7UUFFRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFakIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRW5FLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWpFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNoQixJQUFJLElBQUksR0FBVSxFQUFFLENBQUM7WUFDckIsSUFBSSxZQUFZLEdBQVUsRUFBRSxDQUFDO1lBQzdCLElBQUksRUFBRSxHQUFhLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFVixJQUFJLFVBQVUsQ0FBQyxNQUFNO2dCQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXBELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMxQixJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtvQkFDZCxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQzt3QkFBRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFFakcsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN6QyxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLE9BQU87aUJBQ1A7Z0JBRUQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFFdEIsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWpFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDekcsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUMzRSxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUN2RCxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztTQUNqQztRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0lBOURELGFBQWE7SUFDYixJQUFXLEtBQUs7UUFDZixPQUFPLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQTZERCxvQkFBb0IsQ0FBQyxHQUFRO1FBQzVCLElBQUksQ0FBQyxHQUFHO1lBQUUsT0FBTyxHQUFHLENBQUM7UUFDckIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLElBQUksR0FBRyxHQUFRLEVBQUUsQ0FBQztRQUNsQixJQUFJLEtBQUssR0FBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUUzQyxPQUFPLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3hCLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN2QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ25CLEtBQUssSUFBSSxRQUFRLElBQUksR0FBRyxFQUFFO2dCQUN6QixJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ2pDLElBQUksT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTt3QkFDdEUsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO3dCQUN6QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs0QkFDdkMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dDQUNoQyxZQUFZLEdBQUcsSUFBSSxDQUFDO2dDQUNwQixNQUFNOzZCQUNOO3lCQUNEO3dCQUNELElBQUksQ0FBQyxZQUFZLEVBQUU7NEJBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7NEJBQzNCLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDO3lCQUN2RTtxQkFDRDt5QkFBTTt3QkFDTixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDOzRCQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDekUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDckMsR0FBRyxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQ25DO2lCQUNEO2FBQ0Q7U0FDRDtRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQztJQUVELE1BQU07UUFDTCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDcEIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUMxQixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FDeEIsSUFBSSxDQUFDLFFBQVEsRUFDYixFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLGtDQUNoQyxJQUFJLENBQUMsT0FBTyxLQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxJQUNsRCxDQUNELENBQUM7U0FDRjtRQUNELElBQUksSUFBSSxDQUFDLFFBQVE7WUFBRSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuRSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFSyxHQUFHLENBQUMsVUFBdUI7O1lBQ2hDLFVBQVUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkQsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDckIsSUFBSSxRQUFRLEdBQXVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEYsSUFBSSxVQUFVLEVBQUU7b0JBQ2YsSUFBSSxRQUFRO3dCQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsVUFBVSxDQUFDOzt3QkFDN0QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztpQkFDOUM7Z0JBRUQsMERBQTBEO2dCQUMxRCx5SUFBeUk7Z0JBQ3pJLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsRSxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO29CQUM1QixJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFBRSxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7O3dCQUN0RSxPQUFPLE1BQU0sQ0FBQztpQkFDbkI7Z0JBQ0QsT0FBTyxTQUFTLENBQUM7YUFDakI7WUFFRCxJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVO2lCQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztpQkFDbkIsT0FBTyxDQUFNLFVBQVUsQ0FBQztpQkFDeEIsT0FBTyxFQUFFLENBQUM7WUFFWixJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUM1QixJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQztvQkFBRSxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7b0JBQ3JDLE9BQU8sTUFBTSxDQUFDO2FBQ25CO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztLQUFBO0lBRUQsR0FBRyxDQUFDLEtBQVU7UUFDYixLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQzFCLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUN4QixJQUFJLENBQUMsUUFBUSxFQUNiLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsa0NBQ2pDLElBQUksQ0FBQyxPQUFPLEtBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLElBQ2xELENBQ0QsQ0FBQztTQUNGO1FBRUQsd0NBQXdDO1FBQ3hDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN6QixtREFBbUQ7WUFDbkQsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNoQyxPQUFPO29CQUNOLFNBQVMsRUFBRTt3QkFDVixNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTt3QkFDcEIsTUFBTSxFQUFFOzRCQUNQLElBQUksRUFBRSxDQUFDO3lCQUNQO3dCQUNELE1BQU0sRUFBRSxJQUFJO3FCQUNaO2lCQUNELENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFO2dCQUM1QyxPQUFPLEVBQUUsS0FBSzthQUNkLENBQUMsQ0FBQztTQUNIO2FBQU07WUFDTixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQ3JHO1lBQ0QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN4QztJQUNGLENBQUM7SUFFSyxNQUFNOztZQUNYLDZDQUE2QztZQUM3QyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDN0IsQ0FBQztLQUFBO0lBRUssZUFBZSxDQUFDLE1BQVc7O1lBQ2hDLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQztZQUN0QixPQUFPLE1BQU0sQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7S0FBQTtJQUVELElBQUksQ0FBQyxPQUFZO1FBQ2hCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQzFCLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUN4QixJQUFJLENBQUMsUUFBUSxFQUNiLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsa0NBQ3BDLElBQUksQ0FBQyxPQUFPLEtBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLElBQ2xELENBQ0QsQ0FBQztTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJO1FBQ0gsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxNQUFNO2dCQUFFLE1BQU0seUNBQXlDLENBQUM7WUFDN0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUMxQixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQzdGLENBQUM7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFRCxHQUFHO1FBQ0YsT0FBTztRQUNQLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVLLEtBQUs7O1lBQ1YsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNqQixJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFaEMsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVTtxQkFDaEMsU0FBUyxDQUFDO29CQUNWLEdBQUcsSUFBSSxDQUFDLElBQUk7b0JBQ1osRUFBRSxPQUFPLEVBQUUsR0FBRyxHQUFHLElBQUksRUFBRTtvQkFDdkIsRUFBRSxZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxHQUFHLElBQUksRUFBRSxFQUFFO29CQUN6QyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUU7aUJBQ2IsQ0FBQztxQkFDRCxPQUFPLEVBQUUsQ0FBQztnQkFDWixPQUFPLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQzthQUN2RDtZQUVELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMvRCxDQUFDO0tBQUE7SUFFRCxJQUFJO1FBQ0gsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLE9BQU87WUFDUCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM5QztRQUVELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFSyxNQUFNOztZQUNYLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDakIsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRWhDLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVU7cUJBQ2hDLFNBQVMsQ0FBQztvQkFDVixHQUFHLElBQUksQ0FBQyxJQUFJO29CQUNaLEVBQUUsT0FBTyxFQUFFLEdBQUcsR0FBRyxJQUFJLEVBQUU7b0JBQ3ZCLEVBQUUsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsR0FBRyxJQUFJLEVBQUUsRUFBRTtvQkFDekMsRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7aUJBQ3hCLENBQUM7cUJBQ0QsT0FBTyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7YUFDdkQ7WUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQztLQUFBO0lBRUQsYUFBYTtRQUNaLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztDQUNEO0FBdlJELDBDQXVSQyJ9