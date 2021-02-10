process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

setTimeout(() => {}, 10000000);
// process.env.MONGOMS_DEBUG = "yes";

import { Database } from "../Database";
import { MongoDatabase } from "../Mongodb";
import { test } from "./test";

const db: Database = new MongoDatabase();

db.init().then(async () => {
	// @ts-ignore
	await db.data.test.push({ test: 2398723434058967349872349n });
	const result = await db.data.test.get();

	console.log(result);

	// return test(db);
});
