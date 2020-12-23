"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Datastore = void 0;
const noop = () => { };
const methods = ["delete", "set", "get", "exists", "push", "first", "last", "random", "__getProvider"];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0RhdGFzdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxNQUFNLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUM7QUFDdEIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ3ZHLE1BQU0sVUFBVSxHQUFHO0lBQ2xCLFVBQVU7SUFDVixTQUFTO0lBQ1QsU0FBUztJQUNULGFBQWE7SUFDYixNQUFNLENBQUMsV0FBVztJQUNsQixNQUFNLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDO0NBQ3hDLENBQUM7QUFVRixTQUFnQixTQUFTLENBQUMsRUFBWSxFQUFFLE9BQTJCLEVBQUU7SUFDcEUsSUFBSSxNQUFlLENBQUM7SUFFcEIsTUFBTSxPQUFPLEdBQUc7UUFDZixHQUFHLENBQUMsTUFBZ0IsRUFBRSxJQUFZO1lBQ2pDLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQUUsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsbURBQW1EO1lBQy9HLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDM0IsdUNBQXVDO2dCQUN2QyxNQUFNLEdBQVksSUFBSSxDQUFDO2FBQ3ZCO2lCQUFNO2dCQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyw4RUFBOEU7YUFDakg7WUFDRCxPQUFPLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsS0FBSyxDQUFDLENBQU0sRUFBRSxJQUFTLEVBQUUsSUFBVztZQUNuQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbEIsYUFBYTtZQUNiLElBQUksTUFBTSxLQUFLLGVBQWU7Z0JBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWpFLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDN0IsYUFBYTtnQkFDYixPQUFPLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyx5QkFBeUI7YUFDeEU7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBRW5DLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLENBQUM7S0FDRCxDQUFDO0lBQ0YsT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDakMsQ0FBQztBQS9CRCw4QkErQkMifQ==