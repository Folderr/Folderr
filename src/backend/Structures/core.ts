// Node modules
import { join } from "path";
import { platform } from "os";
import { EventEmitter } from "events";
import http from "http";
import { fork } from "child_process";
import fs from "fs";
import process from "process";
import type { ChildProcess } from "child_process";

// Fastify imports
import fastify from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import fastifyStatic from "@fastify/static";
import ratelimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import multipart from "@fastify/multipart";
import type {
	FastifyBaseLogger,
	FastifyInstance,
	FastifyServerFactoryHandler,
} from "fastify";

// Frontend stuff

import middie from "@fastify/middie";

// Other imports
import spdy from "spdy"; // Fuck spdy
import got from "got";
import type { Got } from "got";
import * as Sentry from "@sentry/node";
import type pino from "pino";
import fg from "fast-glob";

// Local files
// Handlers
import Configurer from "../handlers/config-handler.js";
import type {
	CoreConfig,
	DbConfig,
	ActEmailConfig,
	KeyConfig,
} from "../handlers/config-handler.js";
// Structs, classes
import * as endpointsImport from "../Paths/index.js";
import * as APIs from "../Paths/API/index.js";
import {
	Emailer,
	Utils,
	MongoDB,
	Regexs,
	codes as StatusCodes,
} from "../internals.js";
import pkg from "../../../package.json" assert { type: "json" };
import DelQueue from "./Utilities/db-queue.js";

const version = pkg.version;

import type { Path } from "../internals.js";

// Other utilities
import logger from "./logger.js";
import type { LoggerLevels } from "./logger.js";

// Local Fastify plugins
import SentryPlugin from "./plugins/sentry.js";
import type { ErrorHandlerWithSeverity, supressErrorHandlerRoute } from "./plugins/errorHandler.js";
import errorHandlerPlugin from "./plugins/errorHandler.js";

const endpoints = endpointsImport as unknown as Record<string, typeof Path>; // TS fuckery.

const ee = new EventEmitter();
ee.on("fail", (code: number) => {
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

declare module "fastify" {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface FastifyInstance {
		codes: typeof StatusCodes;
		got: Got;
		utils: Utils;
		db: MongoDB;
		handleError: ErrorHandlerWithSeverity;
		supressErrorHandlerRoute: supressErrorHandlerRoute;
		setRouteFailed: (route: string) => void;
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type importedApi =
	| typeof Path
	| ((fastify: FastifyInstance, core: Core) => FastifyInstance);

// eslint-disable-next-line @typescript-eslint/naming-convention
const isTSNode =
	Boolean(process.env.TS_NODE_DEV) || Boolean(process.env.TS_NODE);

if (isTSNode && process.env.NODE_ENV !== "dev") {
	logger.fatal(
		"Running in ts-node-dev while not being in dev mode is not supported",
	);
	process.exit(1);
}

export default class Core {
	public readonly db: MongoDB;

	public app: FastifyInstance;

	public readonly config: CoreConfig;

	public readonly logger: pino.Logger<LoggerLevels>;

	public readonly emailer: Emailer;

	public readonly regexs: Regexs;

	public readonly codes: typeof StatusCodes;

	// eslint-disable-next-line @typescript-eslint/naming-convention
	public readonly Utils: Utils;

	public readonly got: Got;

	public readonly httpsEnabled: boolean;

	public listening: boolean;

	readonly #rewritten: string[];

	readonly #registeredEndpoints: Set<string>;

	readonly #deleter: ChildProcess | DelQueue;

	readonly #keys: KeyConfig;

	readonly #emailConfig: ActEmailConfig;

	readonly #dbConfig: DbConfig;

	readonly #requestIds: Set<string>;

	readonly #internals: {
		serverClosed: Error | boolean;
		deleterShutdown: boolean;
		noRequests: boolean;
	};

	#health: {
		failedEndpoints: Set<string>;
	}

	constructor() {
		this.logger = logger;
		this.#requestIds = new Set();
		this.#internals = {
			serverClosed: false,
			deleterShutdown: false,
			noRequests: true,
		};

		// For new paths rewritten under "NeoAPI" Folder
		this.#rewritten = [];
		this.#registeredEndpoints = new Set<string>();

		// Init configs
		const configs = Configurer.verifyFetch();
		this.config = configs.core;
		this.#keys = configs.key;
		this.#dbConfig = configs.db;
		this.#emailConfig = configs.email;

		this.#health = {
			failedEndpoints: new Set(),
		};

		// Init app
		this.httpsEnabled = Boolean(
			this.#keys.httpsCertOptions?.cert &&
				this.#keys.httpsCertOptions?.key,
		);

		this.app = fastify({
			trustProxy: this.config.trustProxies,
			disableRequestLogging: true,
			serverFactory: this.initServer(this.#keys),
			logger: this.logger as FastifyBaseLogger,
		});
		this.app.decorate("codes", StatusCodes);

		// Init db
		this.db = new MongoDB(); // Time to abuse Node. :)
		this.listening = false;

		this.regexs = new Regexs();
		this.Utils = new Utils(this);
		this.app.decorate("utils", this.Utils);
		this.app.decorate("db", this.db);
		this.app.decorate("setRouteFailed", (route: string) => {
			this.#health.failedEndpoints.add(route);
		});
		this.emailer = new Emailer(
			this,
			this.#emailConfig?.sendingEmail,
			this.#emailConfig?.mailerOptions,
			this.#emailConfig?.selfTest,
		);
		this.codes = StatusCodes;
		this.got = got.extend({
			http2: true,
			headers: {
				"User-Agent": `Folderr/${version} (github.com/Folderr/Folderr)`,
			},
		});
		this.app.decorate("got", this.got);

		// User Account Deleter
		this.#deleter = this.initDeleter();

		this.app.addContentTypeParser(
			"text/plain",
			{
				parseAs: "string",
			},
			// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
			(_request, body, done) => done(null, body),
		);
	}

	getHealth(): { failedEndpoints: Set<string>; activeRoutes: Set<string> } {
		return {
			failedEndpoints: this.#health.failedEndpoints,
			activeRoutes: this.#registeredEndpoints.difference(this.#health.failedEndpoints),
		};
	}

	async testEmailer() {
		if (!this.emailer.active) {
			this.logger.info("Skipping emailer check. Emailer not enabled.");
			return;
		}

		this.logger.info("Testing emailer connection");
		const { error } = await this.emailer.verifyConnection();
		if (error && error.message !== "Emailer not activated") {
			this.logger.fatal(
				"Emailer connection failed. Shutting down. Error below.",
			);
			this.logger.fatal(error);
			this.logger.warn(
				"This may mean your emailer is not configured properly.",
			);
			this.logger.warn(
				"Please check host, port, and authentication are correct " +
					"and in line with your host",
			);
			process.exit(1);
		} else {
			this.logger.info("Emailer OK or disabled");
		}
	}

	async registerServerPlugins() {
		await this.app.register(cookie);

		await this.app.register(errorHandlerPlugin);

		// Enable Sentry tracing
		await this.app.register(SentryPlugin);

		if (process.env.NODE_ENV !== "dev") {
			const defaultSrc = ["'self'"];
			if (process.env.NODE_ENV !== "production") {
				defaultSrc.push("ws://localhost:*");
			}

			if (process.env.BENCHMARK && process.env.BENCHMARK !== "true") {
				this.logger.info("Enabling CSP");
				await this.app.register(helmet, {
					contentSecurityPolicy: {
						directives: {
							defaultSrc,

							scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
						},
					},
				});
			}
		}

		let maxReq = process.env.BENCHMARK === "true" ? 100_000_000 : 20;
		if (process.env.NODE_ENV === "dev") {
			maxReq = 100_000_000;
		}

		this.logger.info(`Ratelimiting at ${maxReq} requests per 10s`);
		await this.app.register(ratelimit, {
			max: maxReq,
			timeWindow: "10s",
		});

		this.logger.info("Enabling CORS");
		await this.app.register(fastifyCors, {
			origin: "*",
		});

		this.logger.debug("Enabling Multipart");
		await this.app.register(multipart, {
			limits: {
				fields: 0,
				files: 1,
				fileSize: 10_000_000_000,
			},
		});
		this.logger.debug("Enabling Fastify Static for dist/src/frontend");
		await this.app.register(fastifyStatic, {
			root: join(process.cwd(), "dist/src/frontend"),
		});

		if (process.env.DEBUG) {
			this.logger.debug("Enabling request hooks");
			this.app.addHook("onRequest", (request, _, done) => {
				this.logger.debug(`URL: ${request.url}`);
				this.logger.debug(`Is 404: ${request.is404.toString()}`);

				done();
			});
			this.app.addHook("onResponse", async (_, reply) => {
				this.logger.debug(`Status: ${reply.raw.statusCode}`);
			});
			this.app.addHook("preValidation", (request, _, done) => {
				this.logger.debug("Validation:");
				this.logger.debug(
					`Content-Type: ${request.headers["content-type"] ?? "N/A"}`,
				);
				done();
			});
		}
	}

	addDeleter(userID: string): void {
		if (this.#deleter instanceof DelQueue) {
			this.#deleter.add(userID);
			return;
		}

		this.#deleter.send({ message: "add", data: userID });
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
							protocols: ["h2", "http/1.1"],
						},
					},
					(request, response) => {
						handler(request, response);
					},
				);
				this.logger.debug("Using SPDY server");
				this.logger.debug("Initalized Server");

				return server;
			}

			if (
				process.env.NODE_ENV === "production" &&
				!this.config.trustProxies
			) {
				this.logger.error(
					"HTTPS and/or HTTP/2 required in production. Shuting down",
				);
				this.shutdownServer("Core.initServer", "No HTTPS Certificate");
				throw new Error(
					"HTTPS and/or HTTP/2 required in production. Shuting down",
				);
			}

			const server = http.createServer((request, response) => {
				handler(request, response);
			});
			this.logger.debug("Using HTTP server");
			this.logger.debug("Initalized Server");

			return server;
		};
	}

	async registerNewApi() {
		this.logger.debug("Automatically loading new APIs");
		let basedir = "src/backend/NeoAPI";
		let extension = ".ts";
		if (process.env.NODE_ENV !== "dev") {
			basedir = `dist/${basedir}`;
			extension = ".js";
		}

		let osPrefix = "";
		if (platform() === "win32") {
			osPrefix = "file://";
		}

		const files = await fg(`${basedir}/**/*${extension}`, {
			ignore: ["**/index*"],
		});
		let prefixes = new Map<string, string>();
		const dirs = fs.readdirSync(basedir);
		const fullPaths: Array<{ prefix: string; dirs: string[] }> = [];
		// Find all the files!
		const filebase = `${osPrefix}${process.cwd()}`;
		let fileGroups = new Map<string, string[]>();
		for (const lfile of files) {
			const dir = join(lfile, "../");
			let topPrefix = prefixes.get(dir);
			if (!prefixes.has(dir)) {
				const { prefix } = await import(
					join(filebase, dir, `index${extension}`)
				);
				topPrefix = prefix;
				prefixes.set(dir, prefix);
			}
			if (!fileGroups.has(topPrefix as string)) {
				const filteredFiles = files.filter((lfile) =>
					lfile.startsWith(dir),
				);
				fileGroups.set(topPrefix as string, filteredFiles);
			}
		}
		const initQueue = [];
		// impl: Faster import
		for (const [prefix, files] of fileGroups) {
			initQueue.push(
				this.app.register(
					async (instance, opts) => {
						const endpoints = files.map(async (file) => {
							const imported: {
								name: string;
								path: string;
								route: (
									fastify: FastifyInstance,
									core: Core,
								) => any;
								method: string;
								rewrites?: string;
								enabled: boolean;
							} = await import(join(filebase, file));
							if (!imported.enabled) return;
							if (imported.rewrites) {
								this.logger.debug(
									`Using new rewritten endpoint for ${imported.method}:${imported.rewrites}`,
								);
								this.#rewritten.push(imported.rewrites);
							}

							imported.route(instance, this);
							this.#registeredEndpoints.add(
								`${imported.method}:${imported.path}`,
							);
						});
						Promise.all(endpoints);
					},
					{
						prefix: `/api${prefix}`,
					},
				),
			);
		}

		await Promise.all(initQueue);
	}

	async initDb(): Promise<void> {
		this.logger.debug("Init DB");
		// Again, neglecting this potential error to handle elsewhere
		return this.db.init(
			this.#dbConfig.url || "mongodb://localhost/folderr",
		);
	}

	async registerApis() {
		this.logger.debug("Using fancy API register function");
		for (const api of Object.values<{
			version: string;
			prefix: string;
			endpoints: Record<string, typeof Path>;
		}>(APIs)) {
			const { version } = api;
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
							(endpoint.label.startsWith("DEBUG") &&
								!process.env.DEBUG)
						) {
							continue;
						}

						// In the event that the API is rewritten by newer non-legacy code,
						// skip the legacy code.
						const path = Array.isArray(endpoint.path)
							? endpoint.path[0]
							: endpoint.path;
						if (this.#rewritten.includes(path)) {
							continue;
						}

						this.internalInitPath(endpoint, instance);
						this.#registeredEndpoints.add(
							`${endpoint.type}:` +
								(Array.isArray(endpoint.path)
									? endpoint.path[0]
									: endpoint.path),
						);

						const method = endpoint.type.toUpperCase();

						this.logger.startup(
							`API Path ${label} v${version} initialized with method ${method}!`,
						);
						count++;
					}

					this.logger.info(
						`${count} API v${version} initialized paths`,
					);
					this.logger.info(
						`Initalized ${this.#registeredEndpoints.size} total endpoints!`,
					);

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
		if (Array.isArray(path.path)) {
			for (const url of path.path) {
				this.app.supressErrorHandlerRoute(`${path.type.toUpperCase()}:${app.prefix}${url}`);
				switch (path.type.toLowerCase()) {
					case "post": {
						app.post(
							url,
							path.options || {},
							path.execute.bind(path),
						);
						break;
					}
					case "delete": {
						app.delete(url, path.options || {}, path.execute.bind(path));
						break;
					}
					case "patch": {
						app.patch(url, path.options || {}, path.execute.bind(path));
						break;
					}
					default: {
						app.get(url, path.options || {}, path.execute.bind(path));
					}
				}
			}
		} else {
			this.app.supressErrorHandlerRoute(`${path.type.toUpperCase()}:${app.prefix}${path.path}`);
			switch (path.type.toLowerCase()) {
				case "post": {
					app.post(
						path.path,
						path.options || {},
						path.execute.bind(path),
					);
					break;
				}
				case "delete": {
					app.delete(path.path, path.options || {}, path.execute.bind(path));
					break;
				}
				case "patch": {
					app.patch(path.path, path.options || {}, path.execute.bind(path));
					break;
				}
				default: {
					app.get(path.path, path.options || {}, path.execute.bind(path));
				}
			}
		}
	}

	initPaths(): boolean {
		let pathCount = 0;
		for (const endpoint in endpoints) {
			// This works TS, trust me.
			if (
				endpoint.toLowerCase().startsWith("debug") &&
				!process.env.DEBUG
			) {
				continue;
			}

			const base = endpoint; // eslint-disable-next-line @typescript-eslint/naming-convention
			const ActualEndpoint = endpoints[endpoint];
			const path = new ActualEndpoint(this);
			const endpointName =
				((typeof path.path === "string" && path.path) || path.label) ??
				base;
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

				this.app.supressErrorHandlerRoute(`${path.type.toUpperCase()}:${Array.isArray(path.path) ? path.path[0] : path.path}`);

				this.internalInitPath(path);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				this.logger.startup(
					`Initalized path ${
						path.label
					} (${base}) with method ${path.type.toUpperCase()}`,
				);
				pathCount++;
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		this.logger.startup(`Initalized ${pathCount} paths`);
		return true;
	}

	async initFrontend() {
		console.log("Node Env: " + process.env.NODE_ENV);
		if (process.env.NODE_ENV !== "dev") {
			this.logger.debug("Using production build for frontend");

			this.app.setNotFoundHandler(async (request, reply) => {
				if (request.url.startsWith("/api")) {
					return reply.status(404).send({
						code: "404",
						message: `${request.method}: ${request.url} Not Found`,
					});
				}

				if (!this.config.apiOnly) {
					return reply.sendFile("index.html");
				}

				return reply.status(404).send({
					code: "404",
					message: `${request.method}: ${request.url} Not Found`,
				});
			});

			return;
		}

		this.logger.debug("Using Development Vite server for frontend");

		const vite = await import("vite");
		await this.app.register(middie);
		await this.app.after();
		const server = await vite.createServer({
			server: {
				middlewareMode: true,
			},
			envDir: process.cwd(),
		});
		const publicPaths = fs.readdirSync("./src/frontend/public");
		this.app.use((request, response, next) => {
			if (!request.url) return next();
			const strippedUrl = request.url?.slice(1, request.url.length) ?? "";
			const regex =
				/^\/(api|confirm|image|i\/|v\/|video|file|f|l|link\/)/;
			if (publicPaths.includes(strippedUrl)) {
				server.middlewares(request, response, next);
			} else if (regex.exec(request.url)) {
				next();
			} else {
				server.middlewares(request, response, next);
			}
		});
		this.app.setNotFoundHandler(async (request, reply) => {
			if (request.url.startsWith("/api")) {
				return reply.status(404).send({
					code: "404",
					message: `${request.method}: ${request.url} Not Found`,
				});
			}

			if (!this.config.apiOnly) {
				return reply.sendFile("index.html");
			}

			return reply.status(404).send({
				code: "404",
				message: `${request.method}: ${request.url} Not Found`,
			});
		});

		this.app.addContentTypeParser(
			"text/json",
			{ parseAs: "string" },
			this.app.getDefaultJsonParser("ignore", "ignore"),
		);
		return "development";
	}

	checkPorts(): boolean {
		const linuxRootPorts = 1024;
		const linuxRootUid = 0;
		if (
			process.getuid &&
			process.getuid() !== linuxRootUid &&
			this.config.port < linuxRootPorts &&
			platform() === "linux"
		) {
			ee.emit("fail", 13);
			this.logger.fatal(
				`Cannot listen to port ${this.config.port} as you are not root!`,
			);
			throw new Error(
				`Cannot listen to port ${this.config.port} as you are not root!`,
			);
		}

		this.logger.debug("Listen Port OK");

		return true;
	}

	async listen(): Promise<string> {
		this.checkPorts();
		return this.app.listen({
			port: this.config.port,
			host: process.env.DOCKER === "true" ? "0.0.0.0" : "localhost",
		});
	}

	shutdownServer(
		calledby?: string,
		reason?: string,
		exitCode?: number,
	): void {
		if (calledby) {
			this.logger.info(`SHUTDOWN - Shutdown called by ${calledby}`);
			if (process.env.NODE_ENV !== "dev") {
				console.log(`SHUTDOWN - Shutdown called by ${calledby}`);
			}
		}

		if (reason) {
			this.logger.info(`SHUTDOWN - Shutting down because ${reason}`);
			if (process.env.NODE_ENV !== "dev") {
				console.log(`SHUTDOWN - Shutting down because ${reason}`);
			}
		}

		if (
			this.#deleter &&
			!(this.#deleter instanceof DelQueue) &&
			this.#deleter?.connected &&
			!this.#deleter.killed
		) {
			this.logger.info("SHUTDOWN - Waiting on deleter shutdown");
			if (process.env.NODE_ENV !== "dev") {
				console.log("SHUTDOWN - Waiting on deleter shutdown");
			}
			this.#deleter.send({ msg: "shutdown" });
			this.#deleter.on("exit", () => {
				this.logger.info("Account Deleter: Offline");
				if (process.env.NODE_ENV !== "dev") {
					console.log("Account Deleter: Offline");
				}
				this.#internals.deleterShutdown = true;
				if (
					this.#requestIds.size === 0 &&
					this.#internals.serverClosed
				) {
					process.exit(exitCode || 0);
				}
			});
		} else if (this.#deleter instanceof DelQueue) {
			if (!this.#deleter.onGoing) {
				this.#internals.deleterShutdown = true;
			}
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

		if (
			this.#internals.serverClosed &&
			this.#requestIds.size === 0 &&
			this.#internals.deleterShutdown
		) {
			process.exit(exitCode || 0);
		}

		if (!this.#internals.serverClosed || this.#requestIds.size !== 0) {
			this.logger.info("SHUTDOWN - Waiting on HTTP server shutdown");
			this.logger.info(
				"SHUTDOWN - Requests Currently Handling: " +
					this.#requestIds.size,
			);
			if (process.env.NODE_ENV !== "dev") {
				console.log("SHUTDOWN - Waiting on HTTP server shutdown");
				console.log(
					"SHUTDOWN - Requests Currently Handling: " +
						this.#requestIds.size,
				);
			}
		}

		ee.once("noRequests", () => {
			if (this.#internals.deleterShutdown) {
				process.exit(exitCode || 0);
			}

			if (this.#deleter instanceof DelQueue) {
				this.#deleter.once("stopped", () => {
					this.#internals.deleterShutdown = true;
					process.exit(exitCode || 0);
				});
			}
		});
	}

	removeRequestId(id: string): boolean {
		const output = this.#requestIds.delete(id);
		if (this.#requestIds.size === 0) {
			this.#internals.noRequests = true;
			ee.emit("noRequests");
		}

		return output;
	}

	private initDeleter(): ChildProcess | DelQueue {
		// One quick note: It would seem that TS-Node and IPC don't play well,
		// which Folderr NEEDS to properly handle user deletion
		if (isTSNode && process.env.NODE_ENV === "dev") {
			this.logger.debug("Using same-process deleter queue");
			return new DelQueue(this.db);
		}

		const deleterModule = "dist/src/backend/file-del-queue";
		const deleter = fork(deleterModule);

		// Let's make this play nice.
		deleter.on("error", (error: Error) => {
			this.logger.fatal(error);
		});

		deleter.on("close", (data) => {
			if (typeof data === "number") {
				this.logger.error(`Deleter closed with code ${data}`);
			} else {
				this.logger.error("Deleter closed with unknown exit code");
			}
		});
		deleter.on("message", (data) => {
			this.logger.info(data);
		});

		deleter.on("exit", (message) => {
			if (typeof message === "number") {
				this.logger.warn(`Deleter exited with code ${message}`);
			} else {
				this.logger.fatal("Deleter exited with unknown exit code");
			}
		});

		if (deleter.connected) {
			deleter.send({ msg: "check" });
		}

		return deleter;
	}
}
