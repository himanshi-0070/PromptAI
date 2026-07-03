'use strict';

const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const { env } = require('../config/env');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `[${ts}] ${level.toUpperCase()}: ${stack || message}`;
});

const logger = createLogger({
  level: env.IS_PRODUCTION ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        logFormat
      ),
    }),
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'exceptions.log') }),
  ],
});

module.exports = logger;
