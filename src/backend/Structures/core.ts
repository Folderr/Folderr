// Node modules
import {join} from 'path';
import {platform} from 'os';
import {EventEmitter} from 'events';
import http from 'http';
import {ChildProcess, fork} from 'child_process';
import fs from 'fs';

// Fastify imports

import fastify, {FastifyInstance, FastifyServerFactoryHandler} from 'fastify';
import cookie from 'fastify-cookie';
import helmet from 'fastify-helmet';
import fastifyStatic from 'fastify-static';
import ratelimit from 'fastify-rate-limit';
import fastifyCors from 'fastify-cors';

// Frontend stuff

import {createServer as createViteServer} from 'vite';
import middie from 'middie';

// Other imports
import spdy from 'spdy';
import winston from 'winston';
import got, {Got} from 'got';

// Local files
import Configurer, {
	CoreConfig,
	DBConfig,
	ActEmailConfig,
	KeyConfig
} from '../handlers/config-handler';
import * as endpoints from '../Paths/index';
import {
	Path,
	Emailer,
	Utils,
	MongoDB,
	wlogger,
	Regexs,
	codes as StatusCodes
} from '../internals';
import {version} from '../../../package.json';

const Endpoints = endpoints as unknown as Record<string, typeof Path>; // TS fuckery.

const ee = new EventEmitter();
ee.on('fail', (code) => {
	setTimeout(() => {
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(code || 1); // Justification: Process may not exit if this is not called
	}, 1000);
});

export default class Core {
	public readonly db: MongoDB;

	public app: FastifyInstance;

	public readonly config: CoreConfig;

	public readonly logger: winston.Logger;

	public readonly emailer: Emailer;

	public readonly regexs: Regexs;

	public readonly codes: typeof StatusCodes;

	public readonly Utils: Utils;

	public readonly got: Got;

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

	constructor() {
		// Init configs
		const configs = Configurer.verifyFetch();
		this.config = configs.core;
		this.#keys = configs.key;
		this.#dbConfig = configs.db;
		this.#emailConfig = configs.email;

		this.app = fastify({
			trustProxy: this.config.trustProxies,
			disableRequestLogging: true,
			serverFactory: this.initServer(this.#keys)
		});

		this.db = new MongoDB(); // Time to abuse Node. :)

		this.regexs = new Regexs();
		this.Utils = new Utils(this);
		this.emailer = new Emailer(
			this,
			this.#emailConfig?.sendingEmail,
			this.#emailConfig?.mailerOptions
		);
		this.codes = StatusCodes;
		this.logger = wlogger;
		this.got = got.extend({
			http2: true,
			headers: {
				'User-Agent': `Folderr/${version} (github.com/Folderr/Folderr)`
			}
		});
		this.#deleter = fork(join(process.cwd(), 'src/file-del-queue'), undefined, {
			silent: true
		});

		this.#requestIDs = new Set();
		this.#internals = {
			serverClosed: false,
			deleterShutdown: false,
			noRequests: true
		};
	}

	async registerServerPlugins() {
		await this.app.register(cookie);
		if (process.env.NODE_ENV !== 'dev') {
			await this.app.register(helmet);
		}

		await this.app.register(ratelimit, {
			max: 100,
			timeWindow: '10s'
		});
		let origin: RegExp | string = '*';
		if (process.env.NODE_ENV === 'dev') {
			origin = /localhost/;
		}

		await this.app.register(fastifyCors, {
			origin,
			credentials: true
		});

		this.app.addHook('onRequest', (request, reply, done) => {
			if (process.env.DEBUG) {
				this.logger.debug(`URL: ${request.url}`);
				this.logger.debug(`Is 404: ${request.is404.toString()}`);
			}

			done();
		});
		this.app.addHook('onResponse', (request, reply, done) => {
			if (process.env.DEBUG) {
				this.logger.debug(`Status: ${reply.raw.statusCode}`);
			}

			done();
		});
	}

	addDeleter(userID: string): void {
		this.#deleter.send({message: 'add', data: userID});
	}

	async initAuthorization() {
		await this.Utils.authorization.init();
	}

	initServer(
		keys: KeyConfig
	): (handler: FastifyServerFactoryHandler) => http.Server {
		return (handler: FastifyServerFactoryHandler) => {
			if (keys.httpsCertOptions?.key && keys.httpsCertOptions?.cert) {
				// IMPL http/2 server
				const server = spdy.createServer(
					{
						cert: fs.readFileSync(keys.httpsCertOptions.cert),
						key: fs.readFileSync(keys.httpsCertOptions.key),
						spdy: {
							protocols: ['h2', 'http/1.1']
						}
					},
					(request, response) => {
						handler(request, response);
					}
				);
				wlogger.log('prelisten', 'Initalized Server');
				if (process.env.DEBUG) {
					wlogger.log('debug', 'Using SPDY server');
				}

				return server;
			}

			const server = http.createServer((request, response) => {
				handler(request, response);
			});
			if (process.env.DEBUG) {
				wlogger.log('debug', 'Using HTTP server');
			}

			wlogger.log('prelisten', 'Initalized Server');
			if (process.env.NODE_ENV === 'production') {
				wlogger.log(
					'fatal',
					'HTTPS and/or HTTP/2 required in production. Shuting down'
				);
				this.shutdownServer();
			}

			return server;
		};
	}

	async initDB(): Promise<void> {
		wlogger.info('Init DB');
		// Again, neglecting this potential error to handle elsewhere
		return this.db.init(this.#dbConfig.url || 'mongodb://localhost/folderr');
	}

	internalInitPath(path: Path) {
		switch (path.type) {
			case 'post': {
				if (Array.isArray(path.path)) {
					for (const url of path.path) {
						if (path.options) {
							this.app.post(url, path.options, path.execute.bind(path));
							continue;
						}

						this.app.post(url, path.execute.bind(path));
					}
				} else {
					if (path.options) {
						this.app.post(path.path, path.options, path.execute.bind(path));
						break;
					}

					this.app.post(path.path, path.execute.bind(path));
				}

				break;
			}

			case 'delete': {
				if (Array.isArray(path.path)) {
					for (const url of path.path) {
						if (path.options) {
							this.app.delete(url, path.options, path.execute.bind(path));
							continue;
						}

						this.app.delete(url, path.execute.bind(path));
					}
				} else {
					if (path.options) {
						this.app.delete(path.path, path.options, path.execute.bind(path));
						break;
					}

					this.app.delete(path.path, path.execute.bind(path));
				}

				break;
			}

			case 'patch': {
				if (Array.isArray(path.path)) {
					for (const url of path.path) {
						if (path.options) {
							this.app.patch(url, path.options, path.execute.bind(path));
							continue;
						}

						this.app.patch(url, path.execute.bind(path));
					}
				} else {
					if (path.options) {
						this.app.patch(path.path, path.options, path.execute.bind(path));
						break;
					}

					this.app.patch(path.path, path.execute.bind(path));
				}

				break;
			}

			default: {
				if (Array.isArray(path.path)) {
					for (const url of path.path) {
						if (path.options) {
							this.app.get(url, path.options, path.execute.bind(path));
							continue;
						}

						this.app.get(url, path.execute.bind(path));
					}
				} else {
					if (path.options) {
						this.app.get(path.path, path.options, path.execute.bind(path));
						break;
					}

					this.app.get(path.path, path.execute.bind(path));
				}
			}
		}
	}

	initPaths(): boolean {
		let pathCount = 0;
		for (const endpoint in endpoints) {
			// This works TS, trust me.
			if (endpoint.startsWith('debug') && !process.env.DEBUG) {
				continue;
			}

			const base = endpoint;
			const ActualEndpoint = Endpoints[endpoint];
			const path = new ActualEndpoint(this);
			const endpointName =
				((typeof path.path === 'string' && path.path) || path.label) ?? base;
			if (path.enabled) {
				if (!path.label || !path.path) {
					wlogger.error(
						`Path ${endpointName} label or endpoint not found, fail init of Path.`
					);
					continue;
				}

				if (!path.execute) {
					wlogger.error(
						`Path ${endpointName} executable found, fail init of Path.`
					);
					continue;
				}

				this.internalInitPath(path);

				// eslint, this is a string. Do not mark this as max-len.
				wlogger.log(
					'startup',
					`Initalized path ${
						path.label
					} (${base}) with method ${path.type.toUpperCase()}`
				);
				pathCount++;
			}
		}

		wlogger.log('startup', `Initalized ${pathCount} paths`);
		return true;
	}

	async initFrontend() {
		if (process.env.NODE_ENV === 'production') {
			await this.app.register(fastifyStatic, {
				root: 'dist/src/frontend',
				decorateReply: false
			});
			return 'production';
		}

		if (process.env.DEBUG) {
			this.logger.debug('Using Development Vite server for frontend');
		}

		await this.app.register(middie);
		await this.app.after();
		const server = await createViteServer({
			server: {
				middlewareMode: 'html'
			}
		});
		this.app.use((request, response, next) => {
			if (request.url?.startsWith('/api')) {
				next();
			} else {
				server.middlewares(request, response, next);
			}
		});
	}

	checkPorts(): boolean {
		const linuxRootPorts = 1024;
		const linuxRootUid = 0;
		if (
			process.getuid &&
			process.getuid() !== linuxRootUid &&
			this.config.port < linuxRootPorts &&
			platform() === 'linux'
		) {
			ee.emit('fail', 13);
			wlogger.error(
				`[FATAL] Cannot listen to port ${this.config.port} as you are not root!`
			);
			throw new Error(
				`Cannot listen to port ${this.config.port} as you are not root!`
			);
		}

		if (process.env.DEBUG) {
			wlogger.log('debug', 'Listen Port OK');
		}

		return true;
	}

	async listen(): Promise<string> {
		this.checkPorts();
		return this.app.listen(this.config.port);
	}

	shutdownServer(): void {
		if (this.#deleter?.connected && !this.#deleter.killed) {
			this.#deleter.send({msg: 'stop'});
			this.#deleter.on('exit', () => {
				this.#internals.deleterShutdown = true;
			});
		}

		this.app.close(() => {
			this.#internals.serverClosed = true;
		});
		ee.once('noRequests', () => {
			try {
				this.logger.close();
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.log(`Logger shutdown error:\n${error.message}`);
				}

				console.log(
					'Logger shutdown encountered an unkown error (result may be weird):\n'
				);
				console.log(error);
			} finally {
				// Silence unicorn.
				// eslint-disable-next-line unicorn/no-process-exit
				process.exit(0);
			}
		});
	}

	removeRequestID(id: string): boolean {
		const output = this.#requestIDs.delete(id);
		if (this.#requestIDs.size === 0) {
			this.#internals.noRequests = true;
			ee.emit('noRequests');
		}

		return output;
	}

	addRequestID(id: string): boolean {
		this.#requestIDs.add(id);
		this.#internals.noRequests = false;
		return this.#requestIDs.has(id);
	}
}
