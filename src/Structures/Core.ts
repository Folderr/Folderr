// Third party modules
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import winston from 'winston';
import superagent, { SuperAgent, SuperAgentRequest } from 'superagent';
import spdy from 'spdy';
// Node modules
import { join } from 'path';
import { platform } from 'os';
import { EventEmitter } from 'events';
import http from 'http';
import { ChildProcess, fork } from 'child_process';
import fs from 'fs';
// Local files
import DB from './Database/MongooseDB';
import wlogger from './WinstonLogger';
import Emailer from './Emailer';
import Regexs from './Utilities/RegExps';
import Utils from './Utilities/Utils';
import Status_Codes from './Utilities/Status_Codes';
import { MemoryLimiter } from './Middleware/ratelimiter';
import Configurer, { CoreConfig, DBConfig, ActEmailConfig, KeyConfig } from '../Handlers/ConfigHandler';
import * as endpoints from '../Paths/index';

const ee = new EventEmitter();
ee.on('fail', code => {
    setTimeout( () => {
        // process.exit(code || 1);
    }, 1000);
} );

export default class Core {
    public readonly db: DB

    public app: express.Application;

    public readonly config: CoreConfig;

    public readonly logger: winston.Logger;

    public readonly server: http.Server;

    public readonly emailer: Emailer;

    public readonly regexs: Regexs;

    public readonly codes: typeof Status_Codes;

    public readonly Utils: Utils;

    public readonly superagent: SuperAgent<SuperAgentRequest>;

    #deleter: ChildProcess;

    #keys: KeyConfig;

    #emailConfig: ActEmailConfig;

    #dbConfig: DBConfig;

    constructor()  {
        const limiter = new MemoryLimiter();
        this.db = new DB();
        this.app = express(); // Time to abuse Node
        this.app.use(express.json() );
        this.app.use(helmet() );
        this.app.use(cookieParser() );
        this.app.use(express.urlencoded( { extended: false } ) );
        this.app.use(express.static(join(__dirname, '../Frontend') ) );
        this.app.use('/assets', express.static(join(__dirname, '../assets') ) );
        this.app.use('/', express.static(join(__dirname, '../otherFiles') ) );
        this.app.use(limiter.consumer.bind(limiter) );
        
        const configs = Configurer.verifyFetch();
        this.config = configs.core;
        this.#keys = configs.key;
        this.#dbConfig = configs.db;
        this.#emailConfig = configs.email;
        
        this.regexs = new Regexs();
        this.Utils = new Utils(this, this.#keys.jwtConfig);
        this.emailer = new Emailer(this, this.#emailConfig?.sendingEmail, this.#emailConfig?.mailerOptions);
        this.codes = Status_Codes;
        this.logger = wlogger;
        this.superagent = superagent;
        this.#deleter = fork(join(__dirname, '../FileDelQueue'), undefined, { silent: true } );

        this.server = this.initServer();
    }

    addDeleter(userID: string): void {
        this.#deleter.send( { message: 'add', data: userID } );
    }

    initServer(): http.Server {
        if (this.config.trustProxies) {
            this.app.enable('trust proxy');
        }
        if (this.#keys.httpsCertOptions?.key && this.#keys.httpsCertOptions?.cert) {
            // IMPL http/2 server
            const server = spdy.createServer({
                cert: fs.readFileSync(this.#keys.httpsCertOptions.cert),
                key: fs.readFileSync(this.#keys.httpsCertOptions.key),
                spdy: {
                    protocols: [ 'h2', 'http/1.1' ],
                },
            }, this.app)
            wlogger.log('prelisten', "Initalized Server");
            return server;
        }
        wlogger.log('prelisten', "Initalized Server");
        return http.createServer(this.app);
    }

    initDB(): Promise<void> {
        wlogger.info('Init DB');
        return this.db.init(this.#dbConfig.url || 'mongodb://localhost/fldrrDB');
    }

    initPaths(): boolean {
        let pathCount = 0;
        for (const endpoint in endpoints) { // This works TS, trust me.
            const base = endpoint; // @ts-ignore
            const ActualEndpoint = endpoints[endpoint];
            const path = new ActualEndpoint(this);
            if (path.enabled) {
                if (!path.label || !path.path) {
                    wlogger.error(`Path ${path.path || path.label || base} label or endpoint not found, fail init of Path.`);
                    continue;
                }
                if (!path.execute) {
                    wlogger.error(`Path ${path.path || path.label || base} executable found, fail init of Path.`);
                    continue;
                }
                if (path.type === 'post') {
                    this.app.post(path.path, path._execute.bind(path) );
                } else if (path.type === 'delete') {
                    this.app.delete(path.path, path._execute.bind(path));
                } else if (path.type === 'patch') {
                    this.app.patch(path.path, path._execute.bind(path) );
                } else {
                    this.app.get(path.path, path._execute.bind(path) );
                }
                wlogger.log(`startup`, `Initalized path ${path.label} (${base}) with method ${path.type.toUpperCase()}`);
                pathCount++;
            }
        }
        wlogger.log(`startup`, `Initalized ${pathCount} paths`);
        return true;
    }

    checkPorts(): boolean {
        const linuxRootPorts = 1024;
        const linuxRootUid = 0;
        if ( (process.getuid && process.getuid() !== linuxRootUid) && this.config.port < linuxRootPorts && platform() === 'linux') {
            ee.emit('fail', 13);
            wlogger.error(`[FATAL] Cannot listen to port ${this.config.port} as you are not root!`)
            throw Error(`Cannot listen to port ${this.config.port} as you are not root!`);
        }
        wlogger.log('prelisten', 'Listen Port OK');
        return true;
    }

    listen(): http.Server | boolean {
        this.checkPorts();
        return this.server.listen(this.config.port)
    }
}