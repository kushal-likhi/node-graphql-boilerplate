/**
 * Stateless security
 * */

import crypto from 'crypto';

export default class StatelessMiddleware {

	constructor(app, cookie, generatorAlgo, generatorSecret) {
		this.cookie = cookie;
		this.generatorAlgo = generatorAlgo;
		this.generatorSecret = generatorSecret;
		app.use('/', this.tokenAuthCommon.bind(this));
		app.use('/', this.tokenTryAuth.bind(this));
	}

	tokenAuthCommon(req, res, next) {
		delete req.query._;
		let self = this,
			lazyUser;
		//TO LOGIN
		req.loginUser = user => {
			req.user = user;
			lazyUser = user;
			req.isAuthenticated = true;
			let token = self.encrypt(user);
			if (token instanceof Error) {
				return res.status(500).send(token);
			}
			req.token = token;
			if (self.cookie) {
				res.cookie(self.cookie, token, {
					expires: new Date(+new Date() + 3600000)
				});
			}
		};
		req.getLazyUser = () => {
			return lazyUser;
		};
		//TO LOGOUT
		req.logout = () => {
			req.user = null;
			lazyUser = null;
			req.isAuthenticated = false;
			if (self.cookie) {
				res.cookie(self.cookie, '', {
					expires: new Date(+new Date() - 3600000)
				});
			}
		};
		next();
	};

	_getTokenFromRequest(req) {
		let token =
			req.headers['authorization'] ||
			req.headers['Authorization'] ||
			req.query.token ||
			(this.cookie && req.cookies && req.cookies[this.cookie] || undefined) ||
			undefined;
		delete req.query.token;
		return token;
	}

	_processToken(req, res, next, token) {
		token = token.trim().replace(/^Bearer /, '').trim();
		let session = this.decrypt(token);
		if (session instanceof Error) {
			return res.status(403).send('Invalid token defined');
		}
		req.user = session;
		req.isAuthenticated = true;
		if (this.cookie) {
			res.cookie(this.cookie, token, {
				expires: new Date(+new Date() + 3600000)
			});
		}
		return next();
	}

	tokenAuth(req, res, next) {
		let token = this._getTokenFromRequest(req);
		if (token) {
			this._processToken(req, res, next, token);
		} else {
			res.status(403).send({error: 'Forbidden'});
		}

	};

	tokenTryAuth(req, res, next) {
		let token = this._getTokenFromRequest(req);
		if (token) {
			this._processToken(req, res, next, token);
		} else {
			next();
		}
	};

	encrypt(data) {
		let json = JSON.stringify({payload: data});
		try {
			let cipher = crypto.createCipher(this.generatorAlgo, this.generatorSecret);
			return cipher.update(json, 'binary', 'hex') + cipher.final('hex');
		} catch (c) {
			return new Error(c);
		}
	}

	decrypt(cryptText) {
		let data = null;
		try {
			let decipher = crypto.createDecipher(this.generatorAlgo, this.generatorSecret);
			data = JSON.parse(decipher.update(cryptText, 'hex') + decipher.final());
		} catch (c) {
			c.message = "Unable to decode the cryptext. Tampered input! Or Invalid Secret! " + c.message;
			return new Error(c);
		}
		if (data && data.payload) {
			return data.payload;
		} else {
			return new Error("Unable to parse. Bad data or secret.");
		}
	}
}
