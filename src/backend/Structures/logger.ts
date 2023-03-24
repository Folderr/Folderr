import fs from 'fs';
import {join} from 'path'
import process from 'process';
import pino, { multistream } from 'pino';
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

// eslint-disable-next-line spaced-comment
/*const transport = pino.transport({
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
			options: {destination: './logs/all.log'},
			level: 'trace',
		},
	],
	levels: {startup: 35},
	worker: {
		autoEnd: true,
	},
});*/

const getFileSize = (fd: fs.PathLike): number => {
	if (!fs.existsSync(fd)) {
		return 0;
	}

	const {size} = fs.statSync(fd);
	return size;
}

const streams = [
	{
		stream: fs.createWriteStream(join(dir, 'warn.log'), {
			flags: 'r+',
			start: getFileSize(join(dir, 'warn.log'))
		}),
		level: 'warn'
	},
	{
		stream: fs.createWriteStream(join(dir, 'all.log'), {
			flags: 'r+',
			start: getFileSize(join(dir, 'all.log'))
		}),
		level: 'info'
	},
	{
		stream: fs.createWriteStream(join(dir, 'error.log'), {
			flags: 'r+',
			start: getFileSize(join(dir, 'error.log'))
		}),
		level: 'error'
	}
]

if (process.env.DEBUG === 'true') {
	streams.push({
		stream: fs.createWriteStream(join(dir, 'debug.log'), {
			flags: 'r+',
			start: getFileSize(join(dir, 'debug.log'))
		}),
		level: 'debug'
	});
}

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

const destination = process.env.NODE_ENV === 'dev'
	? pretty({
		customLevels: {
			...pino.levels.values,
			startup: 35,
		},
		minimumLevel: process.env.DEBUG ? 'debug' : 'info',
  	  })
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	: multistream(streams as any, {
		levels: {
			...pino.levels.values,
			startup: 35
		}
	})

const log = pino(
	options,
	destination,
);

export default log;
