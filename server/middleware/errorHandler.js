'use strict';

const logger = require('../utils/logger');
const { failure } = require('../utils/responseFormatter');

/**
 * Centralized error handling middleware.
 * Must be registered LAST in the Express middleware chain.
 * Logs errors internally and returns safe, sanitized responses.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log the full error internally
  logger.error(`[${req.method}] ${req.path} — ${err.message}`, { stack: err.stack });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Never expose stack traces
  const message = err.isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again.';

  return res.status(statusCode).json(failure(message));
}

/**
 * Creates an operational error with a specific status code.
 * These errors are safe to expose to the frontend.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
