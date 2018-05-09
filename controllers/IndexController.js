/**
 * Index Controller for main pages
 * */

export default class IndexController {

	constructor(router) {
		router.get('/', this.constructor.home);
	}

	static home(req, res) {
		res.render('index', {env: _appEnv});
	}
	
}
