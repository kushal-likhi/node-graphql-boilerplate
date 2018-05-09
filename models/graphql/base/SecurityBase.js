/**
 * Security base class
 * */

export default class SecurityBase {

	static getUserAndPermissionsFromRequest(request) {
		let loggedIn = !!(request.user || request.getLazyUser()),
			user = request.user || request.getLazyUser(),
			permissions = request.userPermissions;
		return {loggedIn, user, permissions};
	}

	static fetchPermissionsForPath(permissions, path) {
		path = path.split('.');
		let permission;
		while (path.length) {
			let _path = path.join('.');
			if (permissions[_path]) {
				permission = permissions[_path];
				break;
			}
			path.pop();
		}
		if (!permission) {
			permission = permissions['default'];
		}
		return permission;
	}

}
