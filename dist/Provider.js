"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
Array.prototype.last = function () {
    return this[this.length - 1];
};
/**
 *
 * ┌─────────┐
 * │Datastore│
 * └─────────┘
 *
 * @example:

 * guild.data.xp-enabled.get()
 *
 * @returns {Promise}
 *
 * @template Actions:
 * - delete() - deletes the property
 * - get() - gets the value of the property
 * - exists() - check if the property exists
 * - set(value) - sets the value for the property
 * - push(value) - inserts the value in the array
 * - every(fn) - check if every element fulfills the function
 * - some(fn) - check if any element fulfills the function
 * - first() - gets the first element of the array
 * - last() - get the last element of the array
 * - random() - gets a random element of the array
 * - TODO concat(arr) - combines database with this array
 *
 * @variation Identifier:
 * - value
 * - {id}
 * - function (warning much overhead)
 * - native mongodb cmds: $gt $lt $eq $ne
 *
 *
 * db.guilds.aggregate([{$match: {id:"561235799233003551"}}, {$unwind: "$members"},{$replaceRoot: {newRoot: "$members"}}, {$match: {"id":"311129357362135041"}}])
 * db.guilds.aggregate([{$match: {id:"561235799233003551"}}, {$unwind: "$members"},{$replaceRoot: {newRoot: "$members"}}, {$match: {"id":"311129357362135041"}}, {$project: {"joined_at": "$joined_at"}}])
 *
 * db.guilds.aggregate([{$match: {id:"561235799233003551"}}, {$project: {"name": "$name"}}])
 *
 * db.guilds.updateOne({}, [{$match: {id:"561235799233003551"}}, {$unwind: "$members"},{$replaceRoot: {newRoot: "$members"}}, {$match: {"id":"311129357362135041"}}, {$set: {"nick": "test"}}])
 *
 */
/** example PATH:
 * user
 * users
 * users({id: 311129357362135041})
 * guilds
 * guilds({id: 769302137364283432})
 * guilds({id: 769302137364283432}).xp-system
 * guilds({id: 769302137364283432}).xp-system.enabled
 * guilds({id: 769302137364283432}).members({id: 311129357362135041}.data.rank
 * -> {$and: [{id: "769302137364283432"}, members: {}]
 *
 * db.collection("guilds").deleteOne({id: "769302137364283432"})
 *
 */
class Provider {
    constructor(db, path) {
        this.db = db;
        this.path = path;
    }
    delete() { }
    set(value) { }
    get() { }
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
//# sourceMappingURL=Provider.js.map