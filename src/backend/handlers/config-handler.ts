/* eslint-disable @typescript-eslint/naming-convention */
import fs, {existsSync} from 'fs';
import process from 'process';
import {join} from 'path';
import yaml from 'js-yaml';
import {
	cleanEnv,
	json,
	port,
	host,
	bool,
	num,
	email as envemail,
	str,
} from 'envalid';
import {logger} from '../internals';

type CertOptions = {
	key?: string;
	cert?: string;
	requestCert?: boolean;
	ca?: string[];
};

type EmailOptions = {
	mailerOptions?: {
		auth: {
			user: string;
			pass: string;
		};
		port?: number;
		secure?: boolean;
		host: string;
		requireTLS?: boolean;
		ignoreTLS?: boolean;
	};
	sendingEmail?: string;
};

export type DbConfig = {
	url: string;
	protocol?: string;
	dbName?: string;
	extraConfig?: Record<string, unknown>;
};
export type KeyOptions = {
	privKeyPath: string;
	algorithm?: string;
	pubKeyPath: string;
};

export type Options = {
	port?: number;
	url?: string;
	db: EnvDbConfig;
	signups?: number;
	apiOnly?: boolean;
	trustProxies?: boolean;
	certOptions?: CertOptions;
	auth: KeyOptions;
	email?: EmailOptions;
};

export type ServerConfig = {
	port: number;
	signups: number;
	url: string;
	trustProxies?: boolean;
	apiOnly?: boolean;
	httpsCertOptions?: {
		key?: string;
		cert?: string;
		requestCert?: boolean;
		ca?: string[];
	};
	sentry?: {
		dsn?: string;
		tracing?: boolean;
		rate?: number;
	};
};

export type EmailConfig = {
	mailerOptions?: {
		auth: {
			username: string;
			password: string;
		};
		port?: number;
		secure?: boolean;
		host: string;
		requireTls?: boolean;
		ignoreTls?: boolean;
	};
	sendingEmail?: string;
};

export type CoreConfig = {
	port: number;
	signups: number;
	url: string;
	trustProxies: boolean;
	apiOnly: boolean;
	sentry: {
		dsn?: string;
		tracing?: boolean;
		rate?: number;
	};
};

export type KeyConfig = {
	httpsCertOptions?: {
		key?: string;
		cert?: string;
		requestCert?: boolean;
		ca?: string[];
	};
};

export type ActEmailConfig = {
	mailerOptions?: {
		auth: {
			user: string;
			pass: string;
		};
		port?: number;
		secure?: boolean;
		host: string;
		requireTLS?: boolean;
		ignoreTLS?: boolean;
	};
	sendingEmail?: string;
};

export type EnvDbConfig = {
	DB_URL: string;
};

export type EnvServerConfig = {
	PORT: number;
	SIGNUPS: number;
	URL: string;
	TRUST_PROXIES?: boolean;
	API_ONLY?: boolean;
	HTTPS_CERT_OPTIONS?: {
		KEY?: string;
		CERT?: string;
		REQUEST_CERT?: boolean;
		CA?: string[];
	};
	SENTRY?: {
		DSN?: string;
		TRACING?: boolean;
		RATE?: number;
	};
};

type EnvEmailConfig = {
	AUTH: {
		PASS?: string;
		USER?: string;
	};
	HOST?: string;
	EMAIL_PORT?: number;
	SECURE?: boolean;
	REQUIRE_TLS?: boolean;
	IGNORE_TLS?: boolean;
	SENDING_EMAIL?: string;
};

export type EnvCoreConfig = {
	PORT: number;
	SIGNUPS: number;
	URL: string;
	TRUST_PROXIES: boolean;
	API_ONLY: boolean;
	SENTRY: {
		DSN?: string;
		TRACING?: boolean;
		RATE?: number;
	};
};

export type EnvKeyLiteConfig = {
	KEY?: string;
	CERT?: string;
	REQUEST_CERT?: boolean;
	CA?: string[];
};

export type EnvKeyConfig = {
	HTTPS_CERT_OPTIONS?: EnvKeyLiteConfig
};

const configHandler = {
	fetchFiles(env: {server: EnvCoreConfig; db: EnvDbConfig; email: EnvEmailConfig}): {
		server?: Record<string, unknown>;
		db?: Record<string, unknown>;
		email?: Record<string, unknown> | undefined | false;
	} {
		// This entire segment sees if the env has the required config
		const precheck = this.preCheckEnv(env);
		const dbFail = precheck.filter((item) => item.includes('db'));
		const serverFail = precheck.filter((item) => item.includes('server'));
		const emailFail = precheck.filter((item) => item.includes('email'));

		// Grab all the config files (if they exist)
		const dir = join(process.cwd(), 'configs');
		const server =
			existsSync(join(dir, 'server.yaml')) &&
			yaml.load(fs.readFileSync(join(dir, 'server.yaml'), {encoding: 'utf8'}));
		const db =
			existsSync(join(dir, 'db.yaml')) &&
			yaml.load(fs.readFileSync(join(dir, 'db.yaml'), {encoding: 'utf8'}));
		const email =
			existsSync(join(dir, 'email.yaml')) &&
			yaml.load(fs.readFileSync(join(dir, 'email.yaml'), {encoding: 'utf8'}));

		// Check if the configs exist
		// Note: Envs count as configs
		const missing: string[] = [];
		if (typeof server !== 'object' && serverFail.length <= 0) {
			// If the server config is not present, the env server config must work instead.
			missing.push('server.yaml');
		}

		if (typeof db !== 'object' && dbFail.length <= 0) {
			// If the db config is not present, the env db config must work instead.
			missing.push('db.yaml');
		}

		if (
			(typeof email !== 'object' && typeof email !== 'undefined') ||
			emailFail.length <= 0
		) {
			// If the email config is not present, the env email config must work instead.
			missing.push('email.yaml');
		}

		if (
			missing.length > 0 &&
			!(missing.length === 1 && missing[0] === 'email.yaml')
		) {
			console.log(`Invalid YAML config, missing: ${missing.join(', ')}`);
			throw new Error(`Invalid YAML config, missing: ${missing.join(', ')}`);
		} // OK TS, shut up.

		return {
			server: server as Record<string, unknown>,
			db: db as Record<string, unknown>,
			email: email as Record<string, unknown> | undefined | false,
		};
	},

	verifyEmailer(
		envEmailConfig: EnvEmailConfig,
		email?: EmailConfig,
	): ActEmailConfig {
		const emailConfig: ActEmailConfig = {};
		if (email ?? envEmailConfig) {
			emailConfig.sendingEmail =
				envEmailConfig.SENDING_EMAIL ?? email?.sendingEmail;
			const hasAuth =
				Boolean(envEmailConfig.AUTH ?? email?.mailerOptions?.auth) &&
				Boolean(
					envEmailConfig.AUTH.PASS ?? email?.mailerOptions?.auth.password,
				) &&
				Boolean(
					envEmailConfig.AUTH.USER ?? email?.mailerOptions?.auth.username,
				);
			if (email?.mailerOptions && hasAuth) {
				emailConfig.mailerOptions = {
					auth: {
						user:
							envEmailConfig.AUTH.USER ?? email?.mailerOptions.auth.username,
						pass:
							envEmailConfig.AUTH.PASS ?? email?.mailerOptions.auth.password,
					},
					host: envEmailConfig.HOST ?? email.mailerOptions.host,
					port: envEmailConfig.EMAIL_PORT ?? email.mailerOptions.port,
					secure: envEmailConfig.SECURE ?? email.mailerOptions.secure,
					requireTLS:
						envEmailConfig.REQUIRE_TLS ?? email.mailerOptions.requireTls,
					ignoreTLS: envEmailConfig.IGNORE_TLS ?? email.mailerOptions.ignoreTls,
				};
			}
		}

		return emailConfig;
	},

	verifyFetch(noExitEmit?: boolean): {
		core: CoreConfig;
		email: ActEmailConfig;
		key: KeyConfig;
		db: DbConfig;
	} {
		const partialEnvCoreConfig = cleanEnv(process.env, {
			URL: host({default: undefined}),
			PORT: port({default: undefined}),
			TRUST_PROXIES: bool({default: undefined}),
			SIGNUPS: num({default: undefined}),
			API_ONLY: bool({default: undefined}),
			HTTPS_CERT_OPTIONS: json<EnvKeyLiteConfig>({
				default: {
					KEY: undefined,
					CERT: undefined,
					REQUEST_CERT: undefined,
					CA: undefined,
				},
			}),
		});

		// Handle the configuration for sentry

		const envSentryConf = cleanEnv(process.env, {
			SENTRY: str({default: undefined}),
			SENTRY_RATE: num({default: undefined}),
			SENTRY_TRACING: bool({default: undefined}),
		});
		const envCoreConfig = {
			...partialEnvCoreConfig,
			SENTRY: {
				DSN: envSentryConf.SENTRY,
				RATE: envSentryConf.SENTRY_RATE,
				TRACING: envSentryConf.SENTRY_TRACING,
			},
		};

		const envDbConfig = cleanEnv(process.env, {
			DB_URL: host({default: undefined}),
		});

		const envEmailConfig = cleanEnv(process.env, {
			AUTH: json<
				{USER: string; PASS: string} | {USER: undefined; PASS: undefined}
			>({default: {user: undefined, pass: undefined}}),
			HOST: host({default: undefined}),
			EMAIL_PORT: port({default: undefined}),
			SECURE: bool({default: false}),
			REQUIRE_TLS: bool({default: false}),
			IGNORE_TLS: bool({default: false}),
			SENDING_EMAIL: envemail({default: undefined}),
		});

		const files = this.fetchFiles({
			server: envCoreConfig,
			db: envDbConfig,
			email: envEmailConfig,
		}) as unknown as {
			server?: ServerConfig;
			db?: DbConfig;
			email?: EmailConfig;
		};
		try {
			this.preCheck(files, {
				server: envCoreConfig,
				db: envDbConfig,
				email: envEmailConfig,
			});
		} catch (error: unknown) {
			process.emitWarning('Unknown Error (config-handler:171)');
			if (error instanceof Error) {
				throw error;
			}
		}

		const keyConfig: KeyConfig = {
			httpsCertOptions: {
				key:
					envCoreConfig.HTTPS_CERT_OPTIONS?.KEY ??
					files.server?.httpsCertOptions?.key,
				cert:
					envCoreConfig.HTTPS_CERT_OPTIONS?.CERT ??
					files.server?.httpsCertOptions?.cert,
				ca:
					envCoreConfig.HTTPS_CERT_OPTIONS?.CA ??
					files.server?.httpsCertOptions?.ca,
				requestCert:
					envCoreConfig.HTTPS_CERT_OPTIONS?.REQUEST_CERT ??
					Boolean(files.server?.httpsCertOptions?.requestCert),
			},
		};

		const coreConfig = {
			url: envCoreConfig.URL ?? files.server?.url,
			port: envCoreConfig.PORT ?? files.server?.port,
			trustProxies: envCoreConfig.TRUST_PROXIES ?? files.server?.trustProxies,
			signups: envCoreConfig.SIGNUPS ?? files.server?.signups,
			apiOnly: envCoreConfig.API_ONLY ?? files.server?.apiOnly,
			sentry: {
				dsn: envCoreConfig.SENTRY.DSN ?? files.server?.sentry?.dsn,
				rate:
					envCoreConfig.SENTRY.RATE ??
					files.server?.sentry?.rate ??
					process.env.NODE_ENV === 'dev'
						? 1
						: 0.2,
				tracing:
					envCoreConfig.SENTRY.TRACING ??
					files.server?.sentry?.tracing ??
					false,
			},
		};
		const emailConfig = this.verifyEmailer(envEmailConfig, files.email);
		const dbConfig = {
			url: envDbConfig.DB_URL ?? files.db?.url,
			// These aren't implemented yet so... worthless :)
			dbName: files.db?.dbName,
			protocol: files.db?.protocol,
			extraConfig: files.db?.extraConfig,
		};

		// Check validity, exit process if invalid.
		const postCheck = this.postCheck(
			coreConfig,
			keyConfig,
			emailConfig,
			!noExitEmit,
		);
		if (typeof postCheck === 'string') {
			throw new TypeError(postCheck);
		}

		return {key: keyConfig, email: emailConfig, core: coreConfig, db: dbConfig};
	},

	preCheckEnv(env: {
		server: EnvServerConfig;
		db: EnvDbConfig;
		email: EnvEmailConfig;
	}): string[] {
		const missing = [];

		if (!env.server.PORT) {
			missing.push('server/port');
		}

		if (!env.server.URL) {
			missing.push('server/url');
		}

		if (!env.server.SIGNUPS) {
			missing.push('server/signups');
		}

		if (!env.db.DB_URL) {
			missing.push('server/url');
		}

		if (env.email?.SENDING_EMAIL && !env.email.AUTH) {
			missing.push('email', 'email/auth');
		}

		return missing;
	},

	preCheck(
		files?: {
			server?: ServerConfig;
			db?: DbConfig;
			email?: EmailConfig;
		},
		env?: {
			server: EnvServerConfig,
			db: EnvDbConfig,
			email: EnvEmailConfig
		},
	): true | void {
		const missingConfigs = {
			server: [] as string[],
			db: [] as string[],
		};

		if (
			!(files?.server?.port ?? env?.server.PORT) ||
			typeof files?.server?.port !== 'number'
		) {
			missingConfigs.server.push('server/port - Must be a number');
		}

		if (
			(!env?.server.SIGNUPS &&
				!files?.server?.signups &&
				files?.server?.signups !== 0) ||
			(!files?.server?.signups && files?.server?.signups !== 0) ||
			typeof files.server.signups !== 'number'
		) {
			console.log(env?.server.SIGNUPS);
			missingConfigs.server.push('server/signups - Must be a number');
		}

		if (
			!(files?.server?.url ?? env?.server.URL) ||
			typeof files?.server?.url !== 'string'
		) {
			missingConfigs.db.push('server/url - Must be a url string');
		}

		if (
			!(files?.db?.url ?? env?.db.DB_URL) ||
			typeof files?.db?.url !== 'string'
		) {
			missingConfigs.db.push('db/url - Must be a url string');
		}

		if (missingConfigs.server.length > 0 || missingConfigs.db.length > 0) {
			console.log('[CONFIG] Missing/Invalid Required Options:');
			let error = '[CONFIG] Missing/Invalid Required Options:';
			if (missingConfigs.server.length > 0) {
				console.log(missingConfigs.server.join('\n'));
				error += `\n${missingConfigs.server.join('\n')}`;
			}

			if (missingConfigs.db.length > 0) {
				console.log(missingConfigs.db.join('\n'));
				error += `\n${missingConfigs.db.join('\n')}`;
			}

			error += '\nPotential fix: run "npm run configure --invalid-or-missing"';
			process.emitWarning('Config Error (config-handler:277)');

			throw new Error(`[CONFIG] Missing/Invalid Required Options:\n${error}`);
		}

		return true;
	},

	keyCheck(keyConfig: KeyConfig): string[] {
		const missingFiles = [];
		if (
			keyConfig.httpsCertOptions?.key &&
			!existsSync(keyConfig.httpsCertOptions?.key)
		) {
			missingFiles.push('https certificate options/key');
		}

		if (
			keyConfig.httpsCertOptions?.cert &&
			!existsSync(keyConfig.httpsCertOptions?.cert)
		) {
			missingFiles.push('https certificate options/cert');
		}

		return missingFiles;
	},

	postCheck(
		coreConfig: CoreConfig,
		keyConfig: KeyConfig,
		emailConfig: ActEmailConfig,
		exitEmit?: boolean,
	): true | string | void {
		const missingFiles = this.keyCheck(keyConfig);

		// Validate ports
		const maxPort = 65_535;
		let failedPort;
		let failedSignups;
		if (!coreConfig.port || coreConfig.port > maxPort || coreConfig.port < 1) {
			failedPort = true;
		}

		// Validate signups type
		if (
			(!coreConfig.signups && coreConfig.signups !== 0) ||
			coreConfig.signups < 0 ||
			coreConfig.signups > 2
		) {
			failedSignups = 'Signup type invalid';
		}

		if (
			coreConfig.signups === 2 &&
			(!emailConfig.sendingEmail ||
				!emailConfig.mailerOptions?.auth.pass ||
				!emailConfig.mailerOptions?.auth.user)
		) {
			failedSignups =
				'Signup Type Not Configured Properly (Emailer not configured)';
		}

		// Check if anything has failed
		if (failedSignups ?? failedPort ?? missingFiles.length > 0) {
			let error = '[CONFIG - INVALID CONFIG]';
			if (failedPort) {
				error +=
					'\nPort configuration invalid. Please be below 65535 and above 0';
			}

			if (failedSignups && typeof failedSignups === 'string') {
				error += `\n${failedSignups}`;
			}

			let potentialFix =
				'Potential fix: Try running "npm run configure --invalid"';

			if (missingFiles.length > 0) {
				error +=
					'\nThe following key files were not found:\n' +
					missingFiles.join('\n');
				potentialFix +=
					' and generating the specified keys' +
					'(See key generation documentation for detail)';
			}

			error += `\n${potentialFix}"`;

			if (exitEmit) {
				process.emitWarning('Config Error (config-handler:366)');
				console.log(error);
				logger.error(error);
				const ms = 500;
				setTimeout(() => {
					process.exit(1);
				}, ms);
			} else {
				process.emitWarning('Config Error (config-handler:376)');
				return error;
			}

			return true;
		}
	},
};

export default configHandler;
