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
exports.test = void 0;
function test(db) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("connected");
        const cache = db.data.users.cache();
        yield cache.init();
        cache.on("change", console.log);
        let success = yield db.data.users.push({ id: 0, roles: [] });
        if (!success)
            throw new Error("couldn't insert new user");
        let user = yield db.data.users({ id: 0 }).get();
        console.log(user);
        success = yield db.data
            .users({ id: 0 })
            .roles.push({ type: "admin", name: "hey", permissions: 2, users: [1, 2, 3, 4] });
        if (!success)
            throw new Error("couldn't add role for user");
        success = yield db.data.users({ id: 1 }).delete();
        if (!success)
            throw new Error("couldn't add role for user");
        // @ts-ignore
        console.log(yield db.data.users.get());
    });
}
exports.test = test;
//# sourceMappingURL=test.js.map