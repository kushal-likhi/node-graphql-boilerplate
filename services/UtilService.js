/**
 * Util Service
 * */

export default class UtilService {

	/**
	 * @name UtilService.toTitleCase
	 * @description converts to title case.
	 * */
	toTitleCase(str) {
		return str.replace(/(( +)|^)([^ ])([^ ]+)?/g, (a, s, _, f, r) => (" " + f.toUpperCase() + (r && r.toLowerCase() || ""))).trim();
	}

	/**
	 * @name UtilService.addSortToQuery
	 * @description sorts the Query
	 * @return callback | Function => (quer)
	 * */
	addSortToQuery(query, sortArr) {
		if (sortArr && sortArr.length) {
			query = query.sort(sortArr.reduce((p, c) => {
				p[c.fieldName] = c.direction;
				return p;
			}, {}));
		}
		return query;
	}

	/**
	 * @name UtilService.validateRequest
	 * @description check request validations
	 * @return mappableArr => [err, userId, orgId]
	 * */
	validateRequest(request) {
		let userId = null,
			orgId = null,
			err = null;
		if (!request || !request.user) return [new Error('Permission denied!'), userId, orgId];
		userId = _db.User.convertToObjectId(request.user._id);
		orgId = _db.Organization.convertToObjectId(request.user.organizationId);
		if (!userId) err = new Error('Invalid Token!');
		if (!orgId) err = new Error('Invalid Token!');
		return [err, userId, orgId];
	}

	/**
	 * @name UtilService.searchRegExp
	 * @description replace unwanted characters from the searched string.
	 * @return correct String
	 * */
	searchRegExp(exep) {
		return new RegExp(exep.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, ' '), 'i')
	}

	/**
	 * @name UtilService.toS3FileObj
	 * @description make s3 file obj compatible with keystone.
	 * @return file obj
	 * */
	toS3FileObj(url) {
		let bucket, path, file;
		if (!url) return null;
		url.trim().replace(/^https?:\/\/([^.]+)[^\/]+(.+)\/([^\/]+)$/i, (a, ...groups) => {
			[bucket, path, file] = groups;
		});
		if (bucket && path && file) {
			return {
				mimetype: file.search(/png$/i) > -1 ? "image/png" : "image/jpeg",
				path: path,
				size: -1,
				filename: file,
				etag: "",
				bucket: bucket,
				url: url
			};
		} else return null;
	}
}
