"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserModel {
    getUser(db) {
        return db('users').select('id', 'username', 'fullname');
    }
}
exports.UserModel = UserModel;
