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
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
setTimeout(() => { }, 10000000);
const Mongodb_1 = require("../Mongodb");
const express_1 = __importDefault(require("express"));
const db = new Mongodb_1.MongoDatabase("mongodb+srv://devUser:uzbDYuLDV6WvoTCA@server.8omlw.mongodb.net/Developer?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });
const app = express_1.default();
app.listen(3001);
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.data.einsätze.get();
    console.log(result);
    res.json(result);
}));
db.init().then(() => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    // await db.data.test.push({ test: "2398723434058967349872349" });
    // return test(db);
    console.log("connected");
}));
//# sourceMappingURL=mongodb.js.map