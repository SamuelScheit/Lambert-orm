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
        let t = yield db.data.test({ _id: "5fda70bae8d65472d1dcd64c" }).get();
        console.log(t);
    }
    catch (error) {
        console.error(error);
    }
}));
//# sourceMappingURL=example.js.map