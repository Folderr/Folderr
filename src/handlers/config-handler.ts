import fs, {existsSync} from 'fs';
import {join} from 'path';
import yaml from 'js-yaml';
import wlogger from '../Structures/winston-logger';

interface CertOptions {
	key?: string | any;
	cert?: string | any;
	requestCert?: boolean;
	ca?: string[];
}

interface EmailOptions {
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
}

export interface DBConfig {
	url: string;
	protocol?: string;
	dbName?: string;
	extraConfig?: Record<string, unknown>;
}
export interface KeyOptions {
	privKeyPath: string;
	algorithm?: string;
	pubKeyPath: string;
}

export interface Options {
	port?: number;
	url?: string;
	db: DBConfig;
	signups?: number;
	apiOnly?: boolean;
	trustProxies?: boolean;
	certOptions?: CertOptions;
	auth: KeyOptions;
	email?: EmailOptions;
}

export interface ServerConfig {
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
}

export interface EmailConfig {
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
}

export interface CoreConfig {
	port: number;
	signups: number;
	url: string;
	trustProxies: boolean;
	apiOnly: boolean;
}

export interface KeyConfig {
	httpsCertOptions?: {
		key?: string;
		cert?: string;
		requestCert?: boolean;
		ca?: string[];
	};
}

export interface ActEmailConfig {
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
}

const ConfigHandler = {
	fetchFiles(): {
		server: Record<string, unknown>;
		db: Record<string, unknown>;
		email: Record<string, unknown> | undefined | false;
	} {
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
		const missing: string[] = [];
		if (typeof server !== 'object') {
			missing.push('server.yaml');
		}

		if (typeof db !== 'object') {
			missing.push('db.yaml');
		}

		if (typeof email !== 'object' && typeof email !== 'undefined') {
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
			email: email as Record<string, unknown> | undefined | false
		};
	},

	verifyFetch(noExitEmit?: boolean): {
		core: CoreConfig;
		email: ActEmailConfig;
		key: KeyConfig;
		db: DBConfig;
	} {
		const files = this.fetchFiles() as unknown as {
			server: ServerConfig;
			db: DBConfig;
			email?: EmailConfig;
		};
		// This line can be remvoed when files ARE properly checked during start up.
		// This file will need lots of reworking to properly check files.
		process.emitWarning('The files are not properly checked during start up.');
		try {
			this.preCheck(files);
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw error;
			}
		}

		const keyConfig: KeyConfig = {
			httpsCertOptions: {
				key: files.server.httpsCertOptions?.key,
				cert: files.server.httpsCertOptions?.cert,
				ca: files.server.httpsCertOptions?.ca,
				requestCert: Boolean(files.server.httpsCertOptions?.requestCert)
			}
		};
		const coreConfig = {
			url: files.server.url,
			port: files.server.port,
			trustProxies: files.server.trustProxies ?? false,
			signups: files.server.signups,
			apiOnly: files.server.apiOnly ?? false
		};
		const emailConfig: ActEmailConfig = {};
		const dbConfig = {
			url: files.db.url,
			dbName: files.db.dbName,
			protocol: files.db.protocol,
			extraConfig: files.db.extraConfig
		};
		if (files.email) {
			emailConfig.sendingEmail = files.email.sendingEmail;
			const hasAuth =
				Boolean(files.email.mailerOptions?.auth) &&
				Boolean(files.email.mailerOptions?.auth.password) &&
				Boolean(files.email.mailerOptions?.auth.username);
			if (files.email.mailerOptions && hasAuth) {
				emailConfig.mailerOptions = {
					auth: {
						user: files.email.mailerOptions.auth.username,
						pass: files.email.mailerOptions.auth.password
					},
					host: files.email.mailerOptions.host,
					port: files.email.mailerOptions.port,
					secure: files.email.mailerOptions.secure,
					requireTLS: files.email.mailerOptions.requireTls,
					ignoreTLS: files.email.mailerOptions.ignoreTls
				};
			}
		}

		// Check validity, exit process if invalid.
		const postCheck = this.postCheck(
			coreConfig,
			keyConfig,
			emailConfig,
			!noExitEmit
		);
		if (typeof postCheck === 'string') {
			throw new TypeError(postCheck);
		}

		return {key: keyConfig, email: emailConfig, core: coreConfig, db: dbConfig};
	},

	preCheck(files: {
		server: ServerConfig;
		db: DBConfig;
		email?: EmailConfig;
	}): true | void {
		const missingConfigs = {
			server: [] as string[],
			db: [] as string[]
		};

		if (!files.server.port || typeof files.server.port !== 'number') {
			missingConfigs.server.push('server/port - Must be a number');
		}

		if (
			(!files.server.signups && files.server.signups !== 0) ||
			typeof files.server.signups !== 'number'
		) {
			missingConfigs.server.push('server/signups - Must be a number');
		}

		if (!files.server.url || typeof files.server.url !== 'string') {
			missingConfigs.db.push('server/url - Must be a url string');
		}

		if (!files.db.url || typeof files.db.url !== 'string') {
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

			error += 'Potential fix: run "npm run configure --invalid-or-missing"';

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
		exitEmit?: boolean
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
		if (failedSignups || failedPort || missingFiles.length > 0) {
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
				console.log(error);
				wlogger.error(error);
				const ms = 500;
				setTimeout(() => {
					// This is the one time im going to tell unicorn to can it
					// eslint-disable-next-line unicorn/no-process-exit
					process.exit(1);
				}, ms);
			} else {
				return error;
			}

			return true;
		}
	}
};

export default ConfigHandler;
