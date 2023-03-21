import process from 'process';
import pino from 'pino';
import pretty from 'pino-pretty';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface LogOptions extends pino.LoggerOptions {
	customLevels: {
		startup: 35;
	};
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const transport = pino.transport({
	targets: [
		{
			target: 'pino/file',
			level: 'error',
			options: {destination: 'logs/error.log'},
		},
		{
			target: 'pino/file',
			level: 'debug',
			options: {destination: 'logs/debug.log'},
		},
		{
			target: 'pino/file',
			level: 'warn',
			options: {destination: 'logs/warn.log'},
		},
		{
			target: 'pino/file',
			options: {destination: 'logs/all.log'},
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
