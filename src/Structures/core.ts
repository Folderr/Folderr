// Third party modules
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import winston from 'winston';
import superagent, {SuperAgent, SuperAgentRequest} from 'superagent';
import spdy from 'spdy';
// Node modules
import {join} from 'path';
import {platform} from 'os';
import {EventEmitter} from 'events';
import http from 'http';
import {ChildProcess, fork} from 'child_process';
import fs from 'fs';
// Local files
import DB from './Database/mongoose-db';
import wlogger from './winston-logger';
import Emailer from './emailer';
import Regexs from './Utilities/reg-exps';
import Utils from './Utilities/utils';
import StatusCodes from './Utilities/status-codes';
import {MemoryLimiter} from './Middleware/ratelimiter';
import Configurer, {
	CoreConfig,
	DBConfig,
	ActEmailConfig,
	KeyConfig
} from '../handlers/config-handler';
import * as endpoints from '../Paths/index';
import Path from './path';

const Endpoints = endpoints as unknown as Record<string, typeof Path>; // TS fuckery.

const ee = new EventEmitter();
ee.on('fail', code => {
	setTimeout(() => { // eslint-disable-next-line unicorn/no-process-exit
		process.exit(code || 1); // Justification: Process may not exit if this is not called
	}, 1000);
});

export default class Core {
	public readonly db: DB;

	public app: express.Application;

	public readonly config: CoreConfig;

	public readonly logger: winston.Logger;

	public readonly server: http.Server;

	public readonly emailer: Emailer;

	public readonly regexs: Regexs;

	public readonly codes: typeof StatusCodes;

	public readonly Utils: Utils;

	public readonly superagent: SuperAgent<SuperAgentRequest>;

    #deleter: ChildProcess;

    #keys: KeyConfig;

    #emailConfig: ActEmailConfig;

    #dbConfig: DBConfig;

	#requestIDs: Set<string>;

	#internals: {
		serverClosed: Error | boolean;
		deleterShutdown: boolean;
		noRequests: boolean;
	};

	constructor() { /* eslint-disable @typescript-eslint/indent */
		const limiter = new MemoryLimiter();
		this.db = new DB();
		this.app = express(); // Time to abuse Node
		this.app.use(express.json());
		this.app.use(helmet());
		this.app.use(cookieParser());
		this.app.use(express.urlencoded({extended: false}));
		this.app.use(express.static(join(__dirname, '../Frontend')));
		this.app.use('/assets', express.static(join(__dirname, '../assets')));
		this.app.use('/', express.static(join(__dirname, '../otherFiles')));
		this.app.use(limiter.consumer.bind(limiter));

		const configs = Configurer.verifyFetch();
		this.config = configs.core;
		this.#keys = configs.key;
		this.#dbConfig = configs.db;
		this.#emailConfig = configs.email;

		this.regexs = new Regexs();
		this.Utils = new Utils(this, this.#keys.jwtConfig);
		this.emailer = new Emailer(
			this,
			this.#emailConfig?.sendingEmail,
			this.#emailConfig?.mailerOptions
		);
		this.codes = StatusCodes;
		this.logger = wlogger;
		this.superagent = superagent;
		this.#deleter = fork(join(__dirname, '../file-del-queue'), undefined, {silent: true});

		this.server = this.initServer();
		this.#requestIDs = new Set();
		this.#internals = {
			serverClosed: false,
			deleterShutdown: false,
			noRequests: true
		};
    }

    addDeleter(userID: string): void {
		this.#deleter.send({message: 'add', data: userID});
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
					protocols: ['h2', 'http/1.1']
				}
			}, this.app);
			wlogger.log('prelisten', 'Initalized Server');
			return server;
		}

		wlogger.log('prelisten', 'Initalized Server');
		return http.createServer(this.app);
    }

    async initDB(): Promise<void> {
		wlogger.info('Init DB');
		return this.db.init(this.#dbConfig.url || 'mongodb://localhost/fldrrDB');
    }

    initPaths(): boolean {
		let pathCount = 0;
		for (const endpoint in endpoints) { // This works TS, trust me.
			if (endpoint.startsWith('debug') && !process.env.DEBUG) {
				continue;
			}

			const base = endpoint;
			const ActualEndpoint = Endpoints[endpoint];
			const path = new ActualEndpoint(this);
			const endpointName = (
				(typeof path.path === 'string' && path.path) || path.label) ??
				base;
			if (path.enabled) {
				if (!path.label || !path.path) {
					wlogger.error(
						`Path ${endpointName} label or endpoint not found, fail init of Path.`
					);
					continue;
				}

				if (!path.execute) {
					wlogger.error(`Path ${endpointName} executable found, fail init of Path.`);
					continue;
				}

				if (path.type === 'post') {
					this.app.post(path.path, path.internal_execute.bind(path));
				} else if (path.type === 'delete') {
					this.app.delete(path.path, path.internal_execute.bind(path));
				} else if (path.type === 'patch') {
					this.app.patch(path.path, path.internal_execute.bind(path));
				} else {
					this.app.get(path.path, path.internal_execute.bind(path));
				}

				// eslint, this is a string. Do not mark this as max-len.
				wlogger.log(
					'startup',
					`Initalized path ${path.label} (${base}) with method ${path.type.toUpperCase()}`
				);
				pathCount++;
			}
		}

		wlogger.log('startup', `Initalized ${pathCount} paths`);
		return true;
    }

    checkPorts(): boolean {
		const linuxRootPorts = 1024;
		const linuxRootUid = 0;
		if ((process.getuid && process.getuid() !== linuxRootUid) &&
			this.config.port < linuxRootPorts &&
			platform() === 'linux'
		) {
			ee.emit('fail', 13);
			wlogger.error(`[FATAL] Cannot listen to port ${this.config.port} as you are not root!`);
			throw new Error(`Cannot listen to port ${this.config.port} as you are not root!`);
		}

		wlogger.log('prelisten', 'Listen Port OK');
		return true;
    }

    listen(): http.Server | boolean {
		this.checkPorts();
		return this.server.listen(this.config.port);
    }

	shutdownServer(): void {
		this.#deleter.send({msg: 'stop'});
		this.#deleter.on('exit', () => {
			this.#internals.deleterShutdown = true;
		});
		this.server.close((error: Error | undefined) => {
			if (error) {
				this.logger.error('Failed to shutdown server');
				this.#internals.serverClosed = error;
				return;
			}

			this.#internals.serverClosed = true;
		});
		ee.once('noRequests', () => {
			try {
				this.logger.close();
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.log(`Logger shutdown error:\n${error.message}`);
				}

				console.log('Logger shutdown encountered an unkown error (result may be weird):\n');
				console.log(error);
			} finally { // Silence unicorn.
				// eslint-disable-next-line unicorn/no-process-exit
				process.exit(0);
			}
		});
	}

	removeRequestID(id: string): boolean {
		const output = this.#requestIDs.delete(id);
		if (this.#requestIDs.size === 0) {
			this.#internals.noRequests = true;
		}

		return output;
	}

	addRequestID(id: string): boolean {
		this.#requestIDs.add(id);
		this.#internals.noRequests = false;
		return this.#requestIDs.has(id);
	}
}

/* eslint-enable @typescript-eslint/indent */
