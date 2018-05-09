/**
 * Resolves native auth node path
 * */

import {
    GraphQLNonNull,
    GraphQLString,
} from 'graphql';
import {series} from 'async';
import ResolverBase from '../base/ResolverBase';

export default class UserGetResolver extends ResolverBase {

    get args() {
        return {
            id: {
                type: new GraphQLNonNull(GraphQLString),
                description: 'ID for the user.'
            }
        };
    }

    resolve(parent, args, request) {
        return new Promise((done, reject) => {
            let user;

            // Auth
            if (!request.user) return reject(new Error('Unauthorised!'));

            // sanitise ID
            if (!args.id || args.id === 'me') {
                args.id = request.user._id;
            }
            let id = _db.User.convertToObjectId(args.id);
            if (!id) return reject(new Error('Invalid ID passed!'));

            series([
                // find USer
                callback => {
                    _db.User.findOne({'_id': id}, (err, _user) => {
                        if (err) callback(err);
                        else if (_user) callback(null, user = _user);
                        else callback(new Error('No user found!'));
                    });
                }
            ], err => {
                if (err) return reject(err);
                done(user);
            });
        });
    }
}
