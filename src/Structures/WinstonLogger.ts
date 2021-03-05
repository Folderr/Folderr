import winston from 'winston';
import moment from 'moment';

/**
 * @fileoverview Create the winston logger and configure it.
 */

const loggingLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        verbose: 4,
        debug: 5,
        startup: 6,
        prelisten: 6,
        ready: 6
    },
};

const format = winston.format.printf( ( { level, message, timestamp } ) => `[${moment(timestamp).format('MM/DD/YY HH:MM')}] [${level.toUpperCase()}]: ${message}`);
const logger = winston.createLogger( {
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    levels: loggingLevels.levels,
    transports: [
        new winston.transports.File( { filename: 'logs/error.log', level: 'error' } ),
        new winston.transports.File( { filename: 'logs/warn.log', level: 'warn' } ),
        new winston.transports.File( { filename: 'logs/debug.log', level: 'debug' } ),
        new winston.transports.File( { filename: 'logs/all.log', level: 'startup' } ),
    ],
} );
winston.exceptions.handle(
    new winston.transports.File( { filename: '../logs/exception.log' } ),
);
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console( {
        format: winston.format.combine(
            winston.format.timestamp(),
            format,
        ),
        level: 'startup',
    } ) );
}

export default logger;
