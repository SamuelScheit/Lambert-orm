import { Provider } from "..";
import { Database } from "../Database";
import { MongoDatabase } from "../Mongodb";

const db: Database = new MongoDatabase();

db.init().then(async () => {
	try {
		let success = await db.data.users.push({ id: 0, roles: [] });
		if (!success) throw new Error("couldn't insert new user");
		let user = await db.data.users({ id: 0 }).get();
		success = await db.data
			.users({ id: 0 })
			.roles.push({ type: "admin", name: "hey", permissions: 2, users: [1, 2, 3, 4] });
		if (!success) throw new Error("couldn't add role for user");
		success = await db.data.users({ id: 1 }).delete();
		if (!success) throw new Error("couldn't add role for user");
		// @ts-ignore
		console.log(await db.data.users.get());
	} catch (error) {
		console.error(error);
	}
});
