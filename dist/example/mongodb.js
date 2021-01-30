"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
setTimeout(() => { }, 10000000);
const Mongodb_1 = require("../Mongodb");
const test_1 = require("./test");
const db = new Mongodb_1.MongoDatabase();
db.init().then(() => test_1.test(db));
//# sourceMappingURL=mongodb.js.map