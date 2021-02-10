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
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
setTimeout(() => { }, 10000000);
const Mongodb_1 = require("../Mongodb");
const db = new Mongodb_1.MongoDatabase();
db.init().then(() => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    yield db.data.test.push({ test: 2398723434058967349872349n });
    const result = yield db.data.test.get();
    console.log(result);
    // return test(db);
}));
//# sourceMappingURL=mongodb.js.map