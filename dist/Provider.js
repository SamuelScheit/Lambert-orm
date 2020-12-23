"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
Array.prototype.last = function () {
    return this[this.length - 1];
};
class Provider {
    constructor(db, path) {
        this.db = db;
        this.path = path;
    }
    delete() { }
    set(value) { }
    get(projection) { }
    exists() { }
    push(value) { }
    first() { }
    last() { }
    random() { }
    __getProvider() {
        return this;
    }
}
exports.Provider = Provider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBVUEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUc7SUFDdEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUM7QUE4REYsTUFBc0IsUUFBUTtJQUM3QixZQUFzQixFQUFZLEVBQVksSUFBd0I7UUFBaEQsT0FBRSxHQUFGLEVBQUUsQ0FBVTtRQUFZLFNBQUksR0FBSixJQUFJLENBQW9CO0lBQUcsQ0FBQztJQUUxRSxNQUFNLEtBQVMsQ0FBQztJQUNoQixHQUFHLENBQUMsS0FBVSxJQUFRLENBQUM7SUFDdkIsR0FBRyxDQUFDLFVBQXVCLElBQVEsQ0FBQztJQUNwQyxNQUFNLEtBQVMsQ0FBQztJQUNoQixJQUFJLENBQUMsS0FBVSxJQUFRLENBQUM7SUFDeEIsS0FBSyxLQUFTLENBQUM7SUFDZixJQUFJLEtBQVMsQ0FBQztJQUNkLE1BQU0sS0FBUyxDQUFDO0lBQ2hCLGFBQWE7UUFDWixPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7Q0FHRDtBQWhCRCw0QkFnQkMifQ==