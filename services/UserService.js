/**
 * User Service
 * @namespace services
 * */
import CriteriaBuilder from './helpers/CriteriaBuilder';

export default class UserService {

	constructor() {
		new CriteriaBuilder(this, _db.User, {
			// TODO DEMO OF BUILDER
			// orgMatch: function (criteria) {
			// 	this.elemMatch('organizations', criteria);
			// },
			// teamMatch: function (criteria) {
			// 	this.elemMatch('organizations.teams', criteria);
			// }
		});
	}
}
