import process, {env} from 'process';
import fs from 'fs';
import {join} from 'path';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import {RewriteFrames} from '@sentry/integrations';
import yaml from 'js-yaml';
import * as StartupHandler from './handlers/startup-handler';

const configPath = join(process.cwd(), 'configs/server.yaml');

let dsn = env.SENTRY;
let tracing = true;
let rate = process.env.NODE_ENV === 'dev' ? 1 : 0.2;

if (env.SENTRY_TRACING && Boolean(env.SENTRY_TRACING)) {
	tracing = Boolean(env.SENTRY_TRACING);
}

if (
	env.SENTRY_RATE &&
	Number(env.SENTRY_RATE) &&
	Number(env.SENTRY_RATE) >= 0 &&
	Number(env.SENTRY_RATE) <= 1
) {
	rate = Number(env.SENTRY_RATE);
}

type Config = {
	sentry?: {
		dsn?: string;
		tracing?: boolean;
		rate?: number;
	};
};

if (fs.existsSync(configPath)) {
	const conf = yaml.load(configPath);
	if (conf && typeof conf === 'object') {
		const actConf = conf as Config;
		if (actConf.sentry?.dsn && typeof actConf.sentry?.dsn === 'string') {
			dsn = dsn ?? actConf.sentry?.dsn;
		}

		if (
			actConf.sentry?.tracing &&
			typeof actConf.sentry?.tracing === 'boolean'
		) {
			tracing = tracing ?? actConf.sentry?.tracing;
		}

		if (actConf.sentry?.rate && typeof actConf.sentry?.rate === 'number') {
			rate = rate ?? actConf.sentry?.rate;
		}
	}
}

const integrations: any[] = [new RewriteFrames({root: process.cwd()})] as any[];

if (tracing) {
	integrations.push(
		new Sentry.Integrations.Http({tracing: true}),
		new Tracing.Integrations.Mongo({useMongoose: true}),
	);
}

if (dsn) {
	if (env.NODE_ENV === 'debug') {
		console.log('[DEBUG]: Sentry Initialized');
	}

	Sentry.init({
		dsn,

		// 1 will capture all transactions
		tracesSampleRate: rate,
		integrations,
		environment: env.NODE_ENV === 'dev' ? 'development' : 'production',
		debug: env.DEBUG ? Boolean(env.DEBUG) : false,
	});
}

process.on('beforeExit', (code) => {
	console.log(`Exiting with code ${code}`);
});

process.on('exit', (code) => {
	console.log(`Exiting with code ${code}`);
	console.log('(Index) Exiting...');
});
void StartupHandler.startFolderr();

process.on('SIGINT', async () => {
	process.exit(0);
});

process.on('SIGTERM', async () => {
	process.exit(0);
});
