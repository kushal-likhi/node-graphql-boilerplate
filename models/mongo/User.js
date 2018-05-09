/**
 * Role model
 * */

import MongoDbModel from '../../bootloader/mongo';
import bcrypt from 'bcrypt-nodejs';

export default class User extends MongoDbModel {

    /* Needed functions by the MongoDbModel Interface */
    static get Name() {
        return this.name; //Return other string if need a different model name
    }

    static get Schema() {
        return mongoose => ({
            name: String,
            email: String,
            password: String,
            dateCreated: Date,
            dateUpdated: Date,
            frequentFlyerOf: [
                {type: mongoose.Schema.Types.ObjectId, ref: 'Airline'}
            ]
        })
    }

    static get Indexes() {
        return [
            {name: 1},
            {frequentFlyerOf: 1},
            {email: 1, password: 1}
        ];
    }

    /* Our functions here */
    verifyPassword(password, callback) {
        bcrypt.compare(password, this.password, callback);
    }

    setPassword(password, workFactor = 10, callback) {
        let self = this;
        bcrypt.genSalt(workFactor, function (err, salt) {
            if (err) return reject(err);
            bcrypt.hash(password, salt, () => null, function (err, hash) {
                if (err) return callback(err);
                self.password = hash;
                callback();
            });
        });
    }
}
