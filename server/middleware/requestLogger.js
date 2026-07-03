'use strict';

const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * HTTP request logging middleware using morgan + winston.
 * Streams morgan output through the Winston logger at 'debug' level.
 * Only active in non-production environments to avoid log noise.
 */
const requestLogger = morgan(
  ':method :url :status :response-time ms — :res[content-length] bytes',
  {
    stream: {
      write: (message) => logger.debug(message.trim()),
    },
    // Skip health check spam in logs
    skip: (req) => req.url === '/api/v1/health',
  }
);

module.exports = requestLogger;
