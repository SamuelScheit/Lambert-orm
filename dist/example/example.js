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
const Mongodb_1 = require("../Mongodb");
const db = new Mongodb_1.MongoDatabase();
db.init().then(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let success = yield db.data.users.push({ id: 0, roles: [] });
        if (!success)
            throw new Error("couldn't insert new user");
        let user = yield db.data.users({ id: 0 }).get();
        success = yield db.data.users({ id: 0 }).roles.push({ type: "admin" });
        if (!success)
            throw new Error("couldn't add role for user");
        success = yield db.data.users({ id: 1 }).delete();
        if (!success)
            throw new Error("couldn't add role for user");
    }
    catch (error) {
        console.error(error);
    }
}));
//# sourceMappingURL=example.js.map