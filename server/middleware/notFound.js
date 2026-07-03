'use strict';

const { failure } = require('../utils/responseFormatter');

/**
 * 404 Not Found middleware.
 * Registered after all routes. Returns a structured JSON response
 * for unmatched routes instead of Express's default HTML response.
 */
function notFound(req, res) {
  return res.status(404).json(
    failure(`Route not found: ${req.method} ${req.originalUrl}`)
  );
}

module.exports = notFound;
