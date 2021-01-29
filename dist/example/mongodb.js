"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
setTimeout(() => { }, 10000000);
const Mongodb_1 = require("../Mongodb");
const test_1 = require("./test");
const db = new Mongodb_1.MongoDatabase();
db.init().then(() => test_1.test(db));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uZ29kYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGFtcGxlL21vbmdvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMvQyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUVoRCxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBSS9CLHdDQUEyQztBQUMzQyxpQ0FBOEI7QUFFOUIsTUFBTSxFQUFFLEdBQWEsSUFBSSx1QkFBYSxFQUFFLENBQUM7QUFFekMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyJ9