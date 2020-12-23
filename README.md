# Lambert-ORM
A promise-based Object–Relational Mapping layer for different databases.

This will allow you to easily access your database just like you would access an object.

The library was designed so that you can change the underlying database engine without changing your code.

Also it only gets/sets the necessary data for the operations and not the whole table unlike quick.db.

## Installation
```
npm i lambert-orm
# or "yarn add lambert-orm"
```

## Usage
ES5 import

```js
require("lambert-orm");
```
or ES6 import

```js
import "lambert-orm";
```

## Database
Choose your database engine: ``MongoDatabase``

At the moment there is only an implementation for MongoDB available, however I will add others.
You can also make your own database class and submit a pull request.

Every Database has a ``.init()`` method that needs to be awaited before using the db.
```ts
class Database {
    init   (): Promise<any>;
    destroy(): Promise<any>;
    data     : DatastoreInterface; // ES6 Proxy Object
}
```
To use the db, access the ``.data`` property and you can now specify the path.
e.g.: ``db.data.users.name`` (the path for this example is ``users.name``)
After that you can call those functions on this path:

## Access Data

```ts
delete().                   : Promise<boolean>; // deletes the value for this path
set(value: any)             : Promise<boolean>; // sets the value for this path
get(projection?: Projection): Promise<any>; // returns a Promise with the value for this path
exists()                    : Promise<boolean>; // checks if a value for this path exists
push(value: any)            : Promise<boolean>; // pushes the value into the array for this path
first()                     : Promise<any>; // returns a promise with the first entry
last()                      : Promise<any>; // returns a promise with the last entry
random()                    : Promise<any>; // returns a promise with a random entry 
```
All operations are asynchronous and return a [promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise) which you have to await.
A ``Promise<boolean>`` as a return value indicates whether or not the operations was successful.

### Projection
The ``.get(projection?: Projection)`` function can optionally take a projection object.

A Projection is a Key-Value Object of booleans representing wether or not you want to receive those properties. 
```ts
type Projection = {
    [index: string]: boolean;
};

var projection = { id: true, name: true}
```

What does this means? For example if you have a database with a ``boards`` table in which you have board objects like those: ``{ id: number, name: string, members: [], posts: [] }``. Now if you only want to get multiple, but not all properties (id's and name's) of all boards you can use the projection parameter to specify what properties you want to get e.g:
```js
db.data.boards.get({ id: true, name: true});
```

### Filter sub arrays

If you take the example from above you may only want to get a specific board, this is where filters come in place:

Additionally, while accessing the path, you can also filter by simply calling the property with ``property.(filter)``.
A filter can be an object or a function (Warning this function will be called for every entry in the array) e.g:
```js
db.data.boards({id: 1}).get()
```
btw. you can use as many filters as you want e.g. ``db.data.boards({id: 1}).posts({id: 0}).comments({id}).get()``

## Full Example
```js
const { MongoDatabase } = require("lambert-orm");

const db: Database = new MongoDatabase();

db.init().then(async () => {
	let success = await db.data.users.push({ id: 0, roles: [] });
	if (!success) throw new Error("couldn't insert new user");

	let user = await db.data.users({ id: 0 }).get();
	console.log(user);
	
	success = await db.data.users({ id: 0 }).roles.push({ type: "admin", name: "hey", permissions: 2 });
	if (!success) throw new Error("couldn't add role for user");

	success = await db.data.users({ id: 1 }).delete();
	if (!success) throw new Error("couldn't add role for user");

	console.log(await db.data.users.get({ id: true}));
});
```
