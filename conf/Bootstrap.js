import {series} from 'async';
/**
 * Bootstrap, called at time of app initializing.
 * */

class Bootstrap {
    constructor(callback) {
        series([
            this.ensureAdminUser.bind(this),
            this.print.bind(this),
        ], callback);
        setTimeout(() => {
            _appEvent.emit('Test', 'Hook', 'Test', 'OK!');
        }, 3000);
    }

    print(callabck) {
        log.debug('Running', this.constructor.name);
        callabck();
    }

    ensureAdminUser(callback) {
        const that = this;
        _db.User.findOne({name: 'Super Admin', email: 'admin@admin.com'}, (err, user) => {
            if (err) return callback(err);
            if (user) {
                that.adminUser = user;
                return callback();
            }
            const adminUser = new _db.User({
                name: 'Super Admin',
                email: 'admin@admin.com',
                password: '',
                dateCreated: new Date(),
                dateUpdated: new Date(),
                frequentFlyerOf: []
            });
            adminUser.setPassword('admin', 10, () => adminUser.save(
                (err, _user) => callback(err, that.adminUser = _user)
            ));
        });
    }

}

export default Bootstrap;
