/**
 * Auth Service
 * */
const crypto = require('crypto');

export default class AuthService {
	
	decrypt(cryptText, callback) {
		var data = null;
		try {
			var decipher = crypto.createDecipher(_config.session.generatorAlgo, _config.session.generatorSecret);
			data = JSON.parse(decipher.update(cryptText, 'hex') + decipher.final());
		} catch (c) {
			c.message = "Unable to decode the cryptext. Tampered input! Or Invalid Secret! " + c.message;
			return callback(new Error(c));
		}
		if (data && data.payload) {
			return callback(null, data.payload);
		} else {
			return callback(new Error("Unable to parse. Bad data or secret."));
		}
	}

	encrypt(data, callback) {
		var json = JSON.stringify({payload: data});
		try {
			var cipher = crypto.createCipher(_config.session.generatorAlgo, _config.session.generatorSecret);
			return callback(null, cipher.update(json, 'binary', 'hex') + cipher.final('hex'));
		} catch (c) {
			return callback(new Error(c));
		}
	}
}
