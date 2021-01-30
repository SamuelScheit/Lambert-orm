process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

import { Database } from "../Database";
import { MongoDatabase } from "../Mongodb";
import { RethinkDatabase } from "../Rethinkdb";
import { test } from "./test";

const db: Database = new RethinkDatabase({ host: "localhost", db: "test", port: 28015 });

// db.init().then(() => test(db));

db.init().then(async () => {
	let success = await db.data.users({ id: 0 }).set({ users: null });
	console.log({ success });
	let res = await db.data.users.get();
	console.log(res);
});
