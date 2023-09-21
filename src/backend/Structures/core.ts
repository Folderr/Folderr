// Node modules
import {join} from 'path';
import {platform} from 'os';
import {EventEmitter} from 'events';
import http from 'http';
import {fork} from 'child_process';
import fs from 'fs';
import process from 'process';
import type {ChildProcess} from 'child_process';

// Fastify imports
import fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import ratelimit from '@fastify/rate-limit';
import fastifyCors from '@fastify/cors';
import multipart from '@fastify/multipart';
import type {FastifyInstance, FastifyServerFactoryHandler} from 'fastify';

// Frontend stuff

import middie from '@fastify/middie';

// Other imports
import spdy from 'spdy'; // Fuck spdy
import http2 from 'http2';
import got from 'got';
import type {Got} from 'got';
import * as Sentry from '@sentry/node';
import type pino from 'pino';

// Local files
import Configurer from '../handlers/config-handler';
import * as endpointsImport from '../Paths/index';
import * as APIs from '../Paths/API/index';
import {
	Emailer,
	Utils,
	MongoDB,
	Regexs,
	codes as StatusCodes,
} from '../internals';
import {version} from '../../../package.json';
import type {
	CoreConfig,
	DbConfig,
	ActEmailConfig,
	KeyConfig,
} from '../handlers/config-handler';
import type {Path} from '../internals';
import logger from './logger';

// Local Fastify plugins
import SentryPlugin from './plugins/sentry';
import { FoldCodes } from "./Utilities/fold-codes";

const endpoints = endpointsImport as unknown as Record<string, typeof Path>; // TS fuckery.

const ee = new EventEmitter();
ee.on('fail', (code: number) => {
	setTimeout(() => {
		 
		process.exit(code || 1); // Justification: Process may not exit if this is not called
	}, 1000);
});

// Since we decorate the fastify instance we need to add that as a type.

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface LogOptions extends pino.LoggerOptions {
	customLevels: {
		startup: 35;
	};
}
declare module 'fastify' {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface FastifyInstance {
		codes: typeof StatusCodes;
		got: Got;
		utils: Utils;
		db: MongoDB
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type importedApi = typeof Path | ((fastify: FastifyInstance, core: Core) => FastifyInstance)

export default class Core {
	public readonly db: MongoDB;

	public app: FastifyInstance;

	public readonly config: CoreConfig;

	public readonly logger: pino.Logger<LogOptions>;

	public readonly emailer: Emailer;

	public readonly regexs: Regexs;

	public readonly codes: typeof StatusCodes;

	// eslint-disable-next-line @typescript-eslint/naming-convention
	public readonly Utils: Utils;

	public readonly got: Got;

	public readonly httpsEnabled: boolean;

	public listening: boolean;

	#deleter: ChildProcess;

	#keys: KeyConfig;

	#emailConfig: ActEmailConfig;

	#dbConfig: DbConfig;

	#requestIds: Set<string>;

	#internals: {
		serverClosed: Error | boolean;
		deleterShutdown: boolean;
		noRequests: boolean;
	};

	constructor() {
		this.logger = logger;
		this.#requestIds = new Set();
		this.#internals = {
			serverClosed: false,
			deleterShutdown: false,
			noRequests: true,
		};

		// Init configs
		const configs = Configurer.verifyFetch();
		this.config = configs.core;
		this.#keys = configs.key;
		this.#dbConfig = configs.db;
		this.#emailConfig = configs.email;

		// Init app
		this.httpsEnabled = Boolean(
			this.#keys.httpsCertOptions?.cert && this.#keys.httpsCertOptions?.key,
		);

		this.app = fastify({
			trustProxy: this.config.trustProxies,
			disableRequestLogging: true,
			serverFactory: this.initServer(this.#keys),
			logger: this.logger,
		});
		this.app.decorate('codes', StatusCodes);

		// Init db
		this.db = new MongoDB(); // Time to abuse Node. :)
		this.listening = false;

		this.regexs = new Regexs();
		this.Utils = new Utils(this);
		this.app.decorate('utils', this.Utils)
		this.app.decorate('db', this.db)
		this.emailer = new Emailer(
			this,
			this.#emailConfig?.sendingEmail,
			this.#emailConfig?.mailerOptions,
			this.#emailConfig?.selfTest
		);
		this.codes = StatusCodes;
		this.got = got.extend({
			http2: true,
			headers: {
				'User-Agent': `Folderr/${version} (github.com/Folderr/Folderr)`,
			},
		});
		this.app.decorate('got', this.got)
		this.#deleter = fork(join(process.cwd(), 'src/file-del-queue'), undefined, {
			silent: true,
		});

		this.app.addContentTypeParser(
			'text/plain',
			{
				parseAs: 'string',
			},
			// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
			(_request, body, done) => done(null, body),
		);
	}

	async registerServerPlugins() {
		await this.app.register(cookie);

		// Enable Sentry tracing
		await this.app.register(SentryPlugin);

		if (process.env.NODE_ENV !== 'dev') {
			 
			const defaultSrc = ["'self'"];
			if (process.env.NODE_ENV !== 'production') {
				defaultSrc.push('ws://localhost:*');
			}

			await this.app.register(helmet, {
				contentSecurityPolicy: {
					directives: {
						defaultSrc,
						 
						scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
					},
				},
			});
		}

		await this.app.register(ratelimit, {
			max: process.env.NODE_ENV === 'dev' ? 100 : 20,
			timeWindow: '10s',
		});

		await this.app.register(fastifyCors, {
			origin: '*',
		});

		await this.app.register(multipart, {
			limits: {
				fields: 0,
				files: 1,
				fileSize: 10_000_000_000,
			},
		});
		await this.app.register(fastifyStatic, {
			root: join(process.cwd(), 'dist/src/frontend'),
		});

		if (process.env.DEBUG) {
			this.app.addHook('onRequest', (request, reply, done) => {
				this.logger.debug(`URL: ${request.url}`);
				this.logger.debug(`Is 404: ${request.is404.toString()}`);

				done();
			});
			this.app.addHook('onResponse', async (request, reply) => {
				this.logger.debug(`Status: ${reply.raw.statusCode}`);
			});
			this.app.addHook('preValidation', (request, reply, done) => {
				this.logger.debug('Validation:');
				this.logger.debug(
					`Content-Type: ${request.headers['content-type'] ?? 'N/A'}`,
				);
				done();
			});
		}
	}

	addDeleter(userID: string): void {
		this.#deleter.send({message: 'add', data: userID});
	}

	async initAuthorization() {
		await this.Utils.authorization.init();
	}

	initServer(
		keys: KeyConfig,
	): (handler: FastifyServerFactoryHandler) => http.Server {
		return (handler: FastifyServerFactoryHandler) => {
			if (keys.httpsCertOptions?.key && keys.httpsCertOptions?.cert) {
				// IMPL http/2 server
				const server = spdy.createServer(
					{
						cert: fs.readFileSync(keys.httpsCertOptions.cert),
						key: fs.readFileSync(keys.httpsCertOptions.key),
						spdy: {
							protocols: ['h2', 'http/1.1'],
						},
					},
					(request, response) => {
						handler(request, response);
					},
				);
				this.logger.debug('Using SPDY server');
				this.logger.debug('Initalized Server');

				return server;
			}

			if (process.env.NODE_ENV === 'production' && !this.config.trustProxies) {
				this.logger.error(
					'HTTPS and/or HTTP/2 required in production. Shuting down',
				);
				this.shutdownServer('Core.initServer', 'No HTTPS Certificate');
				throw new Error(
					'HTTPS and/or HTTP/2 required in production. Shuting down',
				);
			}

			const server = http.createServer((request, response) => {
				handler(request, response);
			});
			this.logger.debug('Using HTTP server');
			this.logger.debug('Initalized Server');

			return server;
		};
	}

	async initDb(): Promise<void> {
		this.logger.debug('Init DB');
		// Again, neglecting this potential error to handle elsewhere
		return this.db.init(this.#dbConfig.url || 'mongodb://localhost/folderr');
	}

	async registerApis() {
		this.logger.debug("Using fancy API register function")
		for (const api of Object.values<{
			version: string;
			prefix: string;
			endpoints: Record<string, typeof Path>;
		}>(APIs)) {
			const {version} = api;
			let count = 0;

			void this.app.register(
				(instance, _options, done) => {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					for (const EndpointType of Object.values(api.endpoints)) {
						const endpoint = new EndpointType(this);
						// eslint-disable-next-line prefer-destructuring
						const label = endpoint.label;
						if (
							!endpoint.enabled ||
							(endpoint.label.startsWith('DEBUG') && !process.env.DEBUG)
						) {
							continue;
						}

						this.internalInitPath(endpoint, instance);

						const method = endpoint.type.toUpperCase();

						this.logger.startup(
							`API Path ${label} v${version} initialized with method ${method}!`,
						);
						count++;
					}

					this.logger.info(`${count} API v${version} initialized paths`);

					done();
				},
				{
					prefix: api.prefix,
				},
			);
		}
	}

	internalInitPath(path: Path, instance = this.app) {
		const app = instance;

		switch (path.type) {
			case 'post': {
				if (Array.isArray(path.path)) {
					for (const url of path.path) {
						if (path.options) {
							app.post(url, path.options, path.execute.bind(path));
							continue;
						}

						app.post(url, path.execute.bind(path));
					}
				} else {
					if (path.options) {
						app.post(path.path, path.options, path.execute.bind(path));
						break;
					}

					app.post(path.path, path.execute.bind(path));
				}

				break;
			}

			case 'delete': {
				if (Array.isArray(path.path)) {
					for (const url of path.path) {
						if (path.options) {
							app.delete(url, path.options, path.execute.bind(path));
							continue;
						}

						app.delete(url, path.execute.bind(path));
					}
				} else {
					if (path.options) {
						app.delete(path.path, path.options, path.execute.bind(path));
						break;
					}

					app.delete(path.path, path.execute.bind(path));
				}

				break;
			}

			case 'patch': {
				if (Array.isArray(path.path)) {
					for (const url of path.path) {
						if (path.options) {
							app.patch(url, path.options, path.execute.bind(path));
							continue;
						}

						app.patch(url, path.execute.bind(path));
					}
				} else {
					if (path.options) {
						app.patch(path.path, path.options, path.execute.bind(path));
						break;
					}

					app.patch(path.path, path.execute.bind(path));
				}

				break;
			}

			default: {
				if (Array.isArray(path.path)) {
					for (const url of path.path) {
						if (path.options) {
							app.get(url, path.options, path.execute.bind(path));
							continue;
						}

						app.get(url, path.execute.bind(path));
					}
				} else {
					if (path.options) {
						app.get(path.path, path.options, path.execute.bind(path));
						break;
					}

					app.get(path.path, path.execute.bind(path));
				}
			}
		}
	}

	findPaths(dir: string): Array<Promise<{
		default: importedApi,
		type?: string;
		label?: string;
		url?: string;
	}>> {
		if (!require.main?.path) {
			return [];
		}

		const paths: Array<
			Promise<
				{
					default: importedApi
					type?: string;
					label?: string;
					url?: string
				}
			>
		> = [];
		const apiitems = fs.readdirSync(dir);
		for (const apiordir of apiitems) {
			if (apiordir.startsWith('index')) continue;
			if (apiordir.includes('.')) {
				paths.push(
					import(
						join(dir, apiordir)
					) as Promise<{
						default: importedApi,
						type?: string,
						label?: string,
						url?: string
					}>
				);
				continue;
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			paths.push(...this.findPaths(join(dir, apiordir)));
		}

		return paths;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	async initAPI(): Promise<void> {
		this.logger.debug("Using initAPI function")
		let count = 0;
		if (require.main?.path) {
			const dir = fs.readdirSync(join(require.main?.path, 'Paths/API'));
			const paths:
				Array<{
					version: string,
					paths: Array<
						Promise<
							{
								default: importedApi,
								type?: string,
								label?: string,
								url?: string
							}
						>
					>
				}> = [];
			for (const item of dir) {
				if (!item.startsWith('V')) continue;

				const output = this.findPaths(join(require.main.path, `Paths/API/${item}`));
				paths.push({version: item, paths: output});

			}
			
			paths.forEach(async value => {
				const actpaths = await Promise.all(value.paths);
				await this.app.register((instance, _options, done) => {
					for (const pathimport of actpaths) {
						let label: string;
						let endpointType: string;
						let endUrl: string;
						// eslint-disable-next-line @typescript-eslint/naming-convention
						const Endpoint = pathimport.default;
						if (
							Object.getOwnPropertyNames(Endpoint).includes('prototype')
						) {
							const endpoint = new (Endpoint as typeof Path)(this);
							if (!endpoint.enabled) continue;
							label = endpoint.label;
							endpointType = endpoint.type
							endUrl = Array.isArray(endpoint.path) ? endpoint.path[0] : endpoint.path
	
							this.internalInitPath(endpoint, instance);
						} else {
							(
								Endpoint as (
									fastify: FastifyInstance, core: Core
								) => FastifyInstance
							)(instance, this)
							endpointType = pathimport.type ?? "unknown";
							label = pathimport.label ?? "unknown"
							endUrl = pathimport.url ?? "Unknown"
						}
	
						this.logger.startup(
							`Loaded ${label}` +
							` ${value.version} with method ${endpointType}` +
							` with url /api${endUrl}`
						);
						count++;
					}
	
					this.logger.startup(`Loaded ${count} API Paths (${value.version})`);
					done();
				}, {
					prefix: '/api'
				});
			})
			
		}
	}

	initPaths(): boolean {
		let pathCount = 0;
		for (const endpoint in endpoints) {
			// This works TS, trust me.
			if (endpoint.toLowerCase().startsWith('debug') && !process.env.DEBUG) {
				continue;
			}

			const base = endpoint; // eslint-disable-next-line @typescript-eslint/naming-convention
			const ActualEndpoint = endpoints[endpoint];
			const path = new ActualEndpoint(this);
			const endpointName =
				((typeof path.path === 'string' && path.path) || path.label) ?? base;
			if (path.enabled) {
				if (!path.label || !path.path) {
					this.logger.error(
						`Path ${endpointName} label or endpoint not found, fail init of Path.`,
					);
					continue;
				}

				if (!path.execute) {
					this.logger.error(
						`Path ${endpointName} executable found, fail init of Path.`,
					);
					continue;
				}

				this.internalInitPath(path);

				// eslint, this is a string. Do not mark this as max-len.
				this.logger.startup(
					`Initalized path ${
						path.label
					} (${base}) with method ${path.type.toUpperCase()}`,
				);
				pathCount++;
			}
		}

		this.logger.startup(`Initalized ${pathCount} paths`);
		return true;
	}

	async initFrontend() {
		if (process.env.NODE_ENV === 'production') {
			this.logger.debug('Using production build for frontend');

			this.app.setNotFoundHandler(async (request, reply) => {
				if (request.url.startsWith('/api')) {
					return reply.status(404).send({
						code: '404',
						message: `${request.method}: ${request.url} Not Found`,
					});
				}

				if (!this.config.apiOnly) {
					return reply.sendFile('index.html');
				}

				return reply.status(404).send({
					code: '404',
					message: `${request.method}: ${request.url} Not Found`,
				});
			});

			return;
		}

		if (process.env.DEBUG) {
			this.logger.debug('Using Development Vite server for frontend');
		}

		const vite = await import('vite');
		await this.app.register(middie);
		await this.app.after();
		const server = await vite.createServer(
			{server:
				{
					middlewareMode: true
				},
				envDir: process.cwd()
			}
		);
		this.app.use((request, response, next) => {
			if (request.url?.match(/^\/(api|image|i\/|v\/|video|file|f|l|link\/)/)) {
				next();
			} else {
				server.middlewares(request, response, next);
			}
		});
		this.app.setNotFoundHandler(async (request, reply) => {
			if (request.url.startsWith('/api')) {
				return reply.status(404).send({
					code: '404',
					message: `${request.method}: ${request.url} Not Found`,
				});
			}

			if (!this.config.apiOnly) {
				return reply.sendFile('index.html');
			}

			return reply.status(404).send({
				code: '404',
				message: `${request.method}: ${request.url} Not Found`,
			});
		});

		this.app.addContentTypeParser(
			'text/json',
			{parseAs: 'string'},
			this.app.getDefaultJsonParser('ignore', 'ignore'),
		);
		return 'development';
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
			this.logger.fatal(
				`Cannot listen to port ${this.config.port} as you are not root!`,
			);
			throw new Error(
				`Cannot listen to port ${this.config.port} as you are not root!`,
			);
		}

		this.logger.debug('Listen Port OK');

		return true;
	}

	async listen(): Promise<string> {
		this.checkPorts();
		return this.app.listen({
			port: this.config.port,
			host: process.env.DOCKER === 'true' ? '0.0.0.0' : 'localhost',
		});
	}

	shutdownServer(calledby?: string, reason?: string): void {
		if (calledby) {
			this.logger.info(`Shutdown called by ${calledby}`);
			if (process.env.NODE_ENV !== 'dev') {
				console.log(`Shutdown called by ${calledby}`);
			}
		}

		if (reason) {
			this.logger.info(`Shutting down because ${reason}`);
			if (process.env.NODE_ENV !== 'dev') {
				console.log(`Shutting down because ${reason}`);
			}
		}

		if (this.#deleter?.connected && !this.#deleter.killed) {
			this.#deleter.send({msg: 'stop'});
			this.#deleter.on('exit', () => {
				this.#internals.deleterShutdown = true;
			});
		}

		try {
			if (!this.app?.close || !this.listening) {
				this.#internals.serverClosed = true;
			} else {
				this.app.close(() => {
					this.#internals.serverClosed = true;
				});
			}
		} catch (error: unknown) {
			Sentry.captureException(error);
			this.logger.error(error);
			console.log(error);
		}

		if (this.#internals.serverClosed && this.#requestIds.size === 0) {
			 
			process.exit(0);
		}

		ee.once('noRequests', () => {
			 
			process.exit(0);
		});
	}

	removeRequestId(id: string): boolean {
		const output = this.#requestIds.delete(id);
		if (this.#requestIds.size === 0) {
			this.#internals.noRequests = true;
			ee.emit('noRequests');
		}

		return output;
	}

	addRequestId(id: string): boolean {
		this.#requestIds.add(id);
		this.#internals.noRequests = false;
		return this.#requestIds.has(id);
	}
}
