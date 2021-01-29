"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Datastore = void 0;
const noop = () => { };
const methods = ["delete", "set", "get", "exists", "push", "first", "last", "random", "cache", "__getProvider"];
const reflectors = [
    "toString",
    "valueOf",
    "inspect",
    "constructor",
    Symbol.toPrimitive,
    Symbol.for("nodejs.util.inspect.custom"),
];
function Datastore(db, path = []) {
    let method;
    const handler = {
        get(target, name) {
            if (reflectors.includes(name))
                return () => path.join("."); // debugger is requesting prop -> don't add to path
            if (methods.includes(name)) {
                // check if method is called e.g. get()
                method = name;
            }
            else {
                path.push({ name, filter: null }); // add to the path -> name of the prop, unique id to add it mongo arrayFilters
            }
            return new Proxy(noop, handler);
        },
        apply(_, self, args) {
            var arg = args[0];
            // @ts-ignore
            if (method === "__getProvider")
                return new db.provider(db, path);
            if (methods.includes(method)) {
                // @ts-ignore
                return new db.provider(db, path)[method](arg); // actually run the query
            }
            path[path.length - 1].filter = arg;
            return new Proxy(noop, handler);
        },
    };
    return new Proxy(noop, handler);
}
exports.Datastore = Datastore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0RhdGFzdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxNQUFNLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUM7QUFDdEIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQztBQUNoSCxNQUFNLFVBQVUsR0FBRztJQUNsQixVQUFVO0lBQ1YsU0FBUztJQUNULFNBQVM7SUFDVCxhQUFhO0lBQ2IsTUFBTSxDQUFDLFdBQVc7SUFDbEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQztDQUN4QyxDQUFDO0FBVUYsU0FBZ0IsU0FBUyxDQUFDLEVBQVksRUFBRSxPQUEyQixFQUFFO0lBQ3BFLElBQUksTUFBZSxDQUFDO0lBRXBCLE1BQU0sT0FBTyxHQUFHO1FBQ2YsR0FBRyxDQUFDLE1BQWdCLEVBQUUsSUFBWTtZQUNqQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUFFLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLG1EQUFtRDtZQUMvRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzNCLHVDQUF1QztnQkFDdkMsTUFBTSxHQUFZLElBQUksQ0FBQzthQUN2QjtpQkFBTTtnQkFDTixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsOEVBQThFO2FBQ2pIO1lBQ0QsT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUNELEtBQUssQ0FBQyxDQUFNLEVBQUUsSUFBUyxFQUFFLElBQVc7WUFDbkMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWxCLGFBQWE7WUFDYixJQUFJLE1BQU0sS0FBSyxlQUFlO2dCQUFFLE9BQU8sSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVqRSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQzdCLGFBQWE7Z0JBQ2IsT0FBTyxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMseUJBQXlCO2FBQ3hFO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztZQUVuQyxPQUFPLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDO0tBQ0QsQ0FBQztJQUNGLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2pDLENBQUM7QUEvQkQsOEJBK0JDIn0=