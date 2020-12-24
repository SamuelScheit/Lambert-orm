# Lambert-db
A Database abstraction layer for different DB Engines

This allows easy access to a database much like like accessing an object.

The library design facilitates exchanging the underlying database engine without changing your application code.

Also it only get's/set's the necessary data for the operations and not the whole table unlike quick.db.

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
Choose a database engine: ``MongoDatabase``

At the moment there is only an implementation for MongoDB available, however I will add others.
You can also implement your own database class and submit a pull request.

Every Database has an ``.init()`` method whose execution must be awaited before using the database.
```ts
class Database {
    init   (): Promise<any>;
    destroy(): Promise<any>;
    data     : DatastoreInterface; // ES6 Proxy Object
}
```
To use the database, access the ``.data`` property and specify the path.
#### Example
```js
db.data.users.name // (the path for this example is users.name). 
``` 
The below operations can then be called on the path:

## Operations

```ts
get(projection?: Projection): Promise<any>; // returns a promise with the value for this path
first()                     : Promise<any>; // returns a promise with the first entry
last()                      : Promise<any>; // returns a promise with the last entry
random()                    : Promise<any>; // returns a promise with a random entry 
delete()                    : Promise<boolean>; // deletes the value for this path
set(value: any)             : Promise<boolean>; // sets the value for this path
exists()                    : Promise<boolean>; // checks if a value for this path exists
push(value: any)            : Promise<boolean>; // pushes the value into the array for this path
```
All operations are asynchronous and return a [promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise) which have to be awaited.
The return value of type ``Promise<boolean>`` indicates a successful operation.
#### Example
```js
await db.data.users.push({id: 1, name: "test", posts: [1,2,3] }) // this will insert this user object
await db.data.users.name.set("hello") // this will set the name hello for all users
await db.data.users.name.get() // this will return an array with the users names
await db.data.users.delete() // this will delete all users
```

### Projection
The ``.get(projection?: Projection)`` function can optionally accept a projection parameter.

A Projection is a Key-Value Object of booleans that indicates whether these properties should be received. 
```ts
type Projection = {
    [index: string]: boolean;
};

var projection = { id: true, name: true}
```

For example, a database with a ``boards`` table that contains  board objects like: ``{ id: number, name: string, members: [], posts: [] }`` and only ids and names should be accessed. 

The projection parameters can be used to specify multiple but not all properties to be retrieved e.g:
```js
await db.data.boards.get({ id: true, name: true}); // This will only return the id and name of the boards
```

### Filter sub arrays

Filters can be used to get a specific card in the example above, by calling a property with ``.property(filter)`` when accessing a path.

A filter can be an object or a function which will be called for every entry in an array and can be specified for each property in a path.

#### Example:
```js
await db.data.boards({id: 1}).get() // This will return the board with id: 1 and insert 
await db.data.boards({id: 1}).posts({id: 0}).comments.push({author: 1, content: "test"}) // This will post a comment to board.id: 1 and post.id: 0
```


## Full Example
```js
const { MongoDatabase } = require("lambert-orm");

const db: Database = new MongoDatabase();

db.init().then(async () => {
	let success = await db.data.users.push({ id: 0, roles: [] });
	if (!success) throw new Error("couldn't insert new user");

	let user = await db.data.users({ id: 0 }).get();
	console.log(user);
	
	success = await db.data.users({ id: 0 }).roles.push({ type: "admin", name: "test", permissions: 2 });
	if (!success) throw new Error("couldn't add role for user");

	console.log(await db.data.users.get({ id: true}));
	
	success = await db.data.users({ id: 1 }).delete();
	if (!success) throw new Error("couldn't delete user");
});
```
