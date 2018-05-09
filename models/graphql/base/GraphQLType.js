/**
 * Defines the base for all types.
 * */

import {
	GraphQLObjectType,
} from 'graphql';
import SecurityBase from './SecurityBase';
import {series} from 'async';

let TYPES = {};

export default class GraphQLType extends SecurityBase {

	static toGraphQLObjectType() {
		if (!TYPES[this.name]) {
			TYPES[this.name] = new GraphQLObjectType({
				name: (this.name).replace(/([^_]+)_(\1)/, '$1'),
				description: this.description,
				fields: () => this.fields()
			});
		}
		return TYPES[this.name];
	}

	static resolveSecuredField(path, resolver, addOriginObject) {
		const core = this;
		return (obj, _, request) => {
			let {loggedIn, user, permissions} = core.getUserAndPermissionsFromRequest(request);
			// Check for permissions and is logged in
			if (!loggedIn || !permissions) return null;
			let {mine, org, all} = core.fetchPermissionsForPath(permissions, path);
			if (all.read) {
				return core._addOrigObject(resolver(obj, request), obj, addOriginObject);
			}
			return new Promise((done, reject) => {
				let hasMineScope = false,
					hasOrgScope = false;
				request._typeFieldResolverCache = request._typeFieldResolverCache || {};
				series([
					callback => {
						if (core.isMine) {
							core.isMine(path, obj._orig || obj, user, request._typeFieldResolverCache, result => {
								hasMineScope = result;
								callback();
							});
						} else {
							hasMineScope = true;
							callback();
						}
					},
					callback => {
						if (hasMineScope) return callback();
						if (core.isOrg) {
							core.isOrg(path, obj._orig || obj, user, request._typeFieldResolverCache, result => {
								hasOrgScope = result;
								callback();
							});
						} else {
							hasOrgScope = true;
							callback();
						}
					}
				], () => {
					if (hasMineScope && mine.read) done(core._addOrigObject(resolver(obj, request), obj, addOriginObject));
					else if (hasOrgScope && org.read) done(core._addOrigObject(resolver(obj, request), obj, addOriginObject));
					else done(null);
				});

			});
		};
	}

	static _addOrigObject(inVal, obj, addOriginObject) {
		if (!addOriginObject) return inVal;
		if (inVal._orig) return inVal;
		if (inVal instanceof Array) {
			inVal.forEach(el => {
				el._orig = (obj._orig || obj);
			});
		} else {
			inVal._orig = (obj._orig || obj);
		}
		return inVal;
	}

}
