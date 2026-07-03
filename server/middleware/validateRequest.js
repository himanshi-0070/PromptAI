'use strict';

const { validationResult } = require('express-validator');
const { failure } = require('../utils/responseFormatter');

/**
 * Middleware that checks express-validator results.
 * Must be placed after validator chains in the route definition.
 * Returns 422 with structured errors if validation fails.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().reduce((acc, err) => {
      acc[err.path] = err.msg;
      return acc;
    }, {});

    return res.status(422).json(
      failure('Validation failed. Please check your input.', details)
    );
  }

  return next();
}

module.exports = validateRequest;
