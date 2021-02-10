import { Database } from "..";

export async function test(db: Database) {
	console.log("connected");

	const cache = db.data.users.cache();
	await cache.init();
	cache.on("change", console.log);

	let success = await db.data.users.push({ id: 0, roles: [] });
	if (!success) throw new Error("couldn't insert new user");

	let user = await db.data.users({ id: 0 }).get();
	console.log(user);

	success = await db.data
		.users({ id: 0 })
		.roles.push({ type: "admin", name: "hey", permissions: 2, users: [1, 2, 3, 4] });
	if (!success) throw new Error("couldn't add role for user");

	success = await db.data.users({ id: 1 }).delete();
	if (!success) throw new Error("couldn't add role for user");

	// @ts-ignore
	console.log(await db.data.users.get());
}
