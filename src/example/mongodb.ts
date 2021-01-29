process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

setTimeout(() => {}, 10000000);
// process.env.MONGOMS_DEBUG = "yes";

import { Database } from "../Database";
import { MongoDatabase } from "../Mongodb";
import { test } from "./test";

const db: Database = new MongoDatabase();

db.init().then(() => test(db));
