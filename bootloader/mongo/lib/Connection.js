/**
 * Manages the connection
 * */

import mongoose from 'mongoose';

class Connection {

	constructor(mongoUrl, callback) {
		Connection._connections = Connection._connections || {};
		this.mongoUrl = mongoUrl;
		this.connect(callback);
	}

	connect(callback) {
		if (!this.mongoUrl) throw new Error('Can not connect without a mongo url!');
		if (Connection._connections[this.mongoUrl]) return callback(null, Connection._connections[this.mongoUrl], mongoose);
		// Connect and cache connection
		mongoose.connect(this.mongoUrl);
		let db = mongoose.connection;
		db.on('error', callback);
		db.once('open', () => {
			log.info('Connected to Mongodb!');
			Connection._connections[this.mongoUrl] = db;
			callback(null, Connection._connections[this.mongoUrl], mongoose);
		});
	}
}

export default Connection;
