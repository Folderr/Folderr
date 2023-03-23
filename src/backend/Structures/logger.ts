import fs from 'fs';
import {join} from 'path'
import process from 'process';
import pino from 'pino';
import pretty from 'pino-pretty';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface LogOptions extends pino.LoggerOptions {
	customLevels: {
		startup: 35;
	};
}

const dir = join(process.cwd(), 'logs');

if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir);
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const transport = pino.transport({
	targets: [
		{
			target: 'pino/file',
			level: 'error',
			options: {destination: join(dir, 'error.log')},
		},
		{
			target: 'pino/file',
			level: 'debug',
			options: {destination: join(dir, 'debug.log')},
		},
		{
			target: 'pino/file',
			level: 'warn',
			options: {destination: join(dir, 'warn.log')},
		},
		{
			target: 'pino/file',
			options: {destination: join(dir, 'all.log')},
			level: 'trace',
		},
	],
	levels: {startup: 35},
	worker: {
		autoEnd: true,
	},
	dedupe: true,
});

const options: LogOptions = {
	level: process.env.DEBUG ? 'debug' : 'info',
	redact: ['ip', 'token', 'Authorization'],
	customLevels: {
		startup: 35,
	},
};

if (process.env.NODE_ENV !== 'dev') {
	options.formatters = {
		level(label) {
			return {
				level: label,
			};
		},
	};
}

export default pino(
	options,
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	process.env.NODE_ENV === 'dev'
		? pretty({
				customLevels: {
					...pino.levels.values,
					startup: 35,
				},
				minimumLevel: process.env.DEBUG ? 'debug' : 'info',
		  })
		: transport,
);
