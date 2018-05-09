import {series, mapSeries} from 'async';
import {join} from 'path';
import express from 'express';
import Agenda from 'agenda';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import fs from 'fs';
import http from 'http';
import {EventEmitter} from 'events';

import ConfigManager from './bootloader/ConfigManager';
import Bootstrap from './conf/Bootstrap';
import Logger from './bootloader/Logger';
import StatelessMiddleware from './bootloader/security/StatelessMiddleware';

/**
 * Main Class to load the project.
 *
 * Starts the api server.
 * Manages environments
 * Initialises databases and loggers
 *
 * */
class Main {

    /**
     * Constructor
     * */
    constructor(callback) {
        // Some app vars
        this.appBaseDir = __dirname;
        this.appEnv = process.env.NODE_ENV || 'development';
        this.frameworkEvents = new EventEmitter();
        this.addSafeReadOnlyGlobal('_frameworkEvents', this.frameworkEvents);
        // Notify of env
        console.log('[FRAMEWORK]'.bold.yellow, `Initialising Class '${this.constructor.name.bold}' using environment '${this.appEnv.bold}'.`.green);
        // Run bootloader tasks
        series([
            this.initializeExpressApp.bind(this),
            this.initializeConfig.bind(this),
            this.initializeLogger.bind(this),
            this.initialiseExportedVars.bind(this),
            this.initializeModels.bind(this),
            this.loadServices.bind(this),
            this.initialiseSecurity.bind(this),
            this.initialiseRoutes.bind(this),
            this.bootstrapApp.bind(this),
            this.initEventHooks.bind(this),
            this.initJobSchedulers.bind(this),
            this.startServer.bind(this),
            this.sendOnlineEvent.bind(this)
        ], callback);
    }

    // Initialize config
    initializeConfig(callback) {
        let self = this;
        new ConfigManager({appBaseDir: this.appBaseDir, env: this.appEnv}, function (_config) {
            self.config = _config;
            callback();
        });
    }

    //Initialize Logger
    initializeLogger(callback) {
        let logOnStdOut = this.config.logger.stdout.enabled,
            self = this;
        this.addSafeReadOnlyGlobal('log', new Logger(function (message) {
            if (logOnStdOut) {
                //Print on console the fully formatted message
                console.log(message.fullyFormattedMessage);
            }
        }, self.config.logger, self.appBaseDir));
        callback();
    }

    // Pre initialize the express app
    initializeExpressApp(callback) {
        this.app = express();
        // view engine setup
        this.app.set('views', join(this.appBaseDir, 'views'));
        this.app.set('view engine', 'ejs');
        // uncomment after placing your favicon in /public
        //this.app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
        this.app.use(logger('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: false}));
        this.app.use(cookieParser());
        this.app.use(express.static(join(this.appBaseDir, 'public')));
        this.app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
        });
        callback();
    }

    // Initialize exports
    initialiseExportedVars(callback) {
        this.addSafeReadOnlyGlobal('_config', this.config);
        this.addSafeReadOnlyGlobal('_appEnv', this.appEnv);
        //Add noop function in global context
        this.addSafeReadOnlyGlobal('noop', function () {
            log.info('Noop Executed with params:', arguments);
        });
        //set the base dir of project in global, This is done to maintain the correct base in case of forked processes.
        this.addSafeReadOnlyGlobal('_appBaseDir', this.appBaseDir);
        callback();
    }

    //Load Service
    loadServices(callback) {
        //Inject all Singleton Services
        let services = {};
        try {
            let list = fs.readdirSync(join(this.appBaseDir, 'services'));
            list.forEach(item => {
                if (item.search(/.js$/) !== -1) {
                    let name = item.toString().replace(/\.js$/, '');
                    console.log('[FRAMEWORK]'.bold.yellow, `Loading Service: '${name.bold}'`.magenta);
                    services[name] = new (require(join(this.appBaseDir, 'services', name)).default);
                }
            });
            this.addSafeReadOnlyGlobal('services', services);
            callback();
        } catch (err) {
            callback(err);
        }
    }

    initialiseSecurity(callback) {
        new StatelessMiddleware(
            this.app,
            '_testdemopssk',
            this.config.session.generatorAlgo,
            this.config.session.generatorSecret
        );
        callback();
    }

    // Init routes
    initialiseRoutes(callback) {
        let router = express.Router();
        try {
            let list = fs.readdirSync(join(this.appBaseDir, 'controllers'));
            list.forEach(item => {
                if (item.search(/.js$/) !== -1) {
                    let name = item.toString().replace(/\.js$/, '');
                    console.log('[FRAMEWORK]'.bold.yellow, `Loading Controller Module: '${name.bold}'`.magenta);
                    new (require(join(this.appBaseDir, 'controllers', item)).default)(router);
                }
            });
            this.app.use('/', router);
            callback();
        } catch (err) {
            callback(err);
        }
    }

    // Init Models
    initializeModels(callback) {
        let list = fs.readdirSync(join(this.appBaseDir, 'models', 'mongo')),
            db = {};
        mapSeries(list, (item, callback) => {
            if (item.search(/.js$/) !== -1) {
                let name = item.toString().replace(/\.js$/, '');
                console.log('[FRAMEWORK]'.bold.yellow, `Loading Model: '${name.bold}'`.magenta);
                (require(join(this.appBaseDir, 'models', 'mongo', item)).default).initialize(this.config.mongoUrl, (err, model) => {
                    if (err) return callback(err);
                    db[name] = model;
                    callback();
                });
            } else {
                callback();
            }
        }, err => {
            if (err) return callback(err);
            this.addSafeReadOnlyGlobal('_db', db);
            callback();
        });
    }

    // Execute Bootstrap
    bootstrapApp(callback) {
        new Bootstrap(callback, this);
    }

    // Init Schedulers
    initJobSchedulers(callback) {
        let list = fs.readdirSync(join(this.appBaseDir, 'jobs'));
        const agenda = new Agenda({
            db: {address: this.config.mongoUrl},
            defaultConcurrency: 1,
            defaultLockLifetime: 10000
        });
        agenda.on('ready', () => {
            mapSeries(list, (item, callback) => {
                if (item.search(/.js$/) !== -1) {
                    let name = item.toString().replace(/\.js$/, '');
                    const job = require(join(this.appBaseDir, 'jobs', item.toString())).default;
                    console.log('[FRAMEWORK]'.bold.yellow, `Loading Job: '${name.bold}'`.magenta, `=> Every: ${job.trigger.bold}`.blue);
                    agenda.define(name, job.task.bind(job));
                    agenda.every(job.trigger, name);
                }
                callback();
            }, err => {
                if (err) return callback(err);
                agenda.start();
                this.addSafeReadOnlyGlobal('_agenda', agenda);
                callback();
            });
        });
        agenda.on('error', err => callback(new Error(err)));
    }

    // Init Event Hooks
    initEventHooks(callback) {
        let list = fs.readdirSync(join(this.appBaseDir, 'hooks'));
        const emitter = new EventEmitter();
        const hooks = {};
        mapSeries(list, (item, callback) => {
            if (item.search(/Hook.js$/) !== -1) {
                let name = item.toString().replace(/Hook\.js$/, '');
                const hook = require(join(this.appBaseDir, 'hooks', item.toString())).default;
                console.log('[FRAMEWORK]'.bold.yellow, `Loading Hook: '${name.bold}'`.magenta);
                hooks[name] = hook;
                emitter.on(name, (...args) => hook.onEvent(...args));
            }
            callback();
        }, err => {
            if (err) return callback(err);
            this.addSafeReadOnlyGlobal('_appEvent', {
                emit: (name, ...args) => {
                    if (hooks[name]) emitter.emit(name, ...args);
                    else log.error('No Event hook with name:', name);
                }
            });
            callback();
        });
    }

    // Start server
    startServer(callback) {
        // catch 404 and forward to error handler
        this.app.use(function (req, res, next) {
            let err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // error handler
        this.app.use(function (err, req, res, next) {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });
        let server = http.createServer(this.app);
        server.listen(this.config.port);
        server.on('listening', () => {
            let addr = server.address();
            let bind = typeof addr === 'string'
                ? 'pipe ' + addr
                : 'port ' + addr.port;
            log.debug('Listening on ' + bind);
            this.frameworkEvents.emit('SERVER_STARTED');
        });
        callback();
    }

    addSafeReadOnlyGlobal(prop, val) {
        console.log('[FRAMEWORK]'.bold.yellow, `Exporting safely '${prop.bold}' from ${this.constructor.name}`.cyan);
        Object.defineProperty(global, prop, {
            get: function () {
                return val;
            },
            set: function () {
                log.warn('You are trying to set the READONLY GLOBAL variable `', prop, '`. This is not permitted. Ignored!');
            }
        });
    }

    sendOnlineEvent(callback) {
        if (process.send) {
            process.send({
                type: "server-running",
                pid: process.pid,
                env: this.appEnv,
                port: _config.port,
                url: _config.serverUrl,
                file: process.argv[1],
                node: process.argv[0],
                workerId: 'xxxxx-xxxxxx'.replace(/x/g, a => (~~(Math.random() * 16)).toString(16))
            });
        }
    }
}

// Time load process
console.log('[FRAMEWORK]'.bold.yellow, `Loaded main module! Took ${((+new Date() - __timers.main) / 1000).toString().bold} seconds.`.green);

// Export now
export default Main;
