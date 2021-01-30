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
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
const Rethinkdb_1 = require("../Rethinkdb");
const db = new Rethinkdb_1.RethinkDatabase({ host: "localhost", db: "test", port: 28015 });
// db.init().then(() => test(db));
db.init().then(() => __awaiter(void 0, void 0, void 0, function* () {
    let success = yield db.data.users({ id: 0 }).set({ users: null });
    console.log({ success });
    let res = yield db.data.users.get();
    console.log(res);
}));
//# sourceMappingURL=rethinkdb.js.map