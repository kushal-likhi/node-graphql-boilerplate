/**
 * Resolves native auth node path
 * */

import {
	GraphQLNonNull,
	GraphQLString,
} from 'graphql';
import {series} from 'async';
import ResolverBase from '../../base/ResolverBase';

export default class AuthNativeResolver extends ResolverBase {

	get args() {
		return {
			username: {
				type: new GraphQLNonNull(GraphQLString),
				description: 'Username for the user.'
			},
			password: {
				type: new GraphQLNonNull(GraphQLString),
				description: 'Password for the user.'
			}
		};
	}

	resolve(parent, args, request) {
		return new Promise((done, reject) => {
			let authInfo = {}, user;
			series([
				// search
				callback => {
					_db.User.findOne({'email': args.username}, (err, _user) => {
						if (err) callback(err);
						else if (_user) callback(null, user = _user);
						else callback(new Error('No user found!'));
					});
				},
				// match password
				callback => {
					user.verifyPassword(args.password, (err, resp) => {
						if (err) callback(err);
						else if (!resp) callback(new Error('Password does not match !'));
						else callback();
					});
				},
				// Generate token
				callback => {
					request.loginUser(user);
					authInfo = {
						id: user._id.toString(),
						token: request.token,
						expires: request.token_expires || -1
					};
					callback();
				}
			], err => {
				if (err) return reject(err);
				done(authInfo);
			});
		});
	}
}
