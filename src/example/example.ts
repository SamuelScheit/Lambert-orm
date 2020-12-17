import { MongoDatabase } from "../Mongodb";

const db = new MongoDatabase();

db.init().then(async () => {
	try {
		let t = await db.data.test({ _id: "5fda70bae8d65472d1dcd64c" }).get();
		console.log(t);
	} catch (error) {
		console.error(error);
	}
});
