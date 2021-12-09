import winston from 'winston';
import { format } from 'logform';

const consoleFormat = format.combine(
	format.timestamp({
		format: 'YYYY-MM-DD HH:mm:ss.sss'
	}),
	format.errors({ stack: true }),
	format.padLevels(),
	format.colorize({ all: true }),
	format.printf((info) => {
		return `[${info.timestamp}] ${info.level}  ${info.message}`;
	})
);

const logger = winston.createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss.sss'
		}),
		format.errors({ stack: true }),
		format.json()
	),
	//defaultMeta: { service: 'user-service' },
	transports: [
		//
		// - Write to all logs with level `info` and below to `combined.log`
		// - Write all logs error (and below) to `error.log`.
		// - Write all logs to standard out.
		//
		// new winston.transports.File({ filename: 'error.log', level: 'error' }),
		// new winston.transports.File({ filename: 'combined.log' }),
		new winston.transports.Console({ format: consoleFormat })
	]
});

export default logger;
