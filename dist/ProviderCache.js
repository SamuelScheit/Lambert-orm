"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderCache = void 0;
const events_1 = require("events");
class ProviderCache extends events_1.EventEmitter {
    constructor(provider, opts) {
        super();
        this.provider = provider;
        this.opts = opts;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cache = yield this.provider.get();
        });
    }
    delete() {
        this.cache = undefined;
        return this.provider.delete();
    }
    set(value) {
        this.cache = value;
        return this.provider.set(value);
    }
    get() {
        return this.cache;
    }
    exists() {
        return !!this.cache;
    }
    push(value) {
        this.cache = (this.cache || []).push(value);
        return this.provider.push(value);
    }
    first() {
        return (this.cache || []).first();
    }
    last() {
        return (this.cache || []).last();
    }
    random() {
        return (this.cache || []).random();
    }
    destroy() {
        this.cache = null;
    }
}
exports.ProviderCache = ProviderCache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvdmlkZXJDYWNoZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Qcm92aWRlckNhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLG1DQUFzQztBQUl0QyxNQUFhLGFBQWMsU0FBUSxxQkFBWTtJQUc5QyxZQUFtQixRQUFrQixFQUFVLElBQTJCO1FBQ3pFLEtBQUssRUFBRSxDQUFDO1FBRFUsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUFVLFNBQUksR0FBSixJQUFJLENBQXVCO0lBRTFFLENBQUM7SUFFSyxJQUFJOztZQUNULElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3hDLENBQUM7S0FBQTtJQUVELE1BQU07UUFDTCxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztRQUN2QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUNELEdBQUcsQ0FBQyxLQUFVO1FBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBQ0QsR0FBRztRQUNGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNuQixDQUFDO0lBQ0QsTUFBTTtRQUNMLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDckIsQ0FBQztJQUNELElBQUksQ0FBQyxLQUFVO1FBQ2QsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUNELEtBQUs7UUFDSixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBQ0QsSUFBSTtRQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2xDLENBQUM7SUFDRCxNQUFNO1FBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUVELE9BQU87UUFDTixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNuQixDQUFDO0NBQ0Q7QUExQ0Qsc0NBMENDIn0=