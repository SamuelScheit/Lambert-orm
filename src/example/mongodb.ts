process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

setTimeout(() => {}, 10000000);
// process.env.MONGOMS_DEBUG = "yes";

import { Database } from "../Database";
import { MongoDatabase } from "../Mongodb";
import { test } from "./test";
import express from "express";

const db: Database = new MongoDatabase(
	"mongodb+srv://devUser:uzbDYuLDV6WvoTCA@server.8omlw.mongodb.net/Developer?retryWrites=true&w=majority",
	{ useNewUrlParser: true, useUnifiedTopology: true }
);
const app = express();

app.listen(3001);
app.get("/", async (req, res) => {
	const result = await db.data.einsätze.get();

	console.log(result);
	res.json(result);
});

db.init().then(async () => {
	// @ts-ignore
	// await db.data.test.push({ test: "2398723434058967349872349" });
	// return test(db);
	console.log("connected");
});
