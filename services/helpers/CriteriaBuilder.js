/**
 * Criteria Builder Super Class
 * */
const util = require('util');

export default class CriteriaBuilder {

	constructor(base, model, addedFuncs) {
		Object.keys(addedFuncs).forEach(fn => this[fn] = addedFuncs[fn].bind(this));
		this.base = base;
		this.model = model;
		base.CriteriaBuilder = function () {
			return new CriteriaBuilder({}, model, addedFuncs);
		};
		this.criteria = {};
	}

	add(prop, condition) {
		this.criteria[prop] = condition;
	}

	search(prop, expr) {
		this.criteria[prop] = new RegExp(expr.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, ' '), 'i');
	}

	searchGroup(...exprs) {
		this.criteria['$or'] = this.criteria['$or'] || [];
		exprs.forEach(expr => this.criteria['$or'].push({[expr.prop]: new RegExp(expr.str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, ' '), 'i')}));
	}

	and(conditions) {
		this.criteria['$and'] = conditions;
	}

	or(conditions) {
		this.criteria['$or'] = conditions;
	}

	in(prop, options) {
		this.criteria[prop] = {$in: options};
	}

	elemMatch(prop, criteria) {
		this.criteria[prop] = {$elemMatch: criteria};
	}

	empty(prop) {
		this.criteria[prop] = {$size: 0};
	}

	getCriteria() {
		return this.criteria;
	}

	print() {
		log.trace(`Criteria for '${this.base.constructor.name}': \n${util.inspect(this.criteria)}\n------------`);
	}

	run(pagination, sortArr, callback) {
		if (_config.logQuery) this._logQuery();
		let query = this.model.find(this.criteria).lean().skip(pagination.offset).limit(pagination.limit);
		query = services.UtilService.addSortToQuery(query, sortArr);
		query.exec(callback);
	}

	count(callback) {
		if (_config.logQuery) this._logQuery();
		this.model.count(this.criteria).exec(callback);
	}

	_logQuery() {
		log.debug(`<<--criteria[${new Buffer(JSON.stringify(this.criteria), 'utf8').toString('hex')}]-->>`);
	}

}
