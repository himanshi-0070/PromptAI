'use strict';

const { param, query } = require('express-validator');

/**
 * Validation rules for project-related endpoints.
 */
const projectIdValidator = [
  param('projectId')
    .exists()
    .withMessage('Project ID is required.')
    .isUUID()
    .withMessage('Project ID must be a valid UUID.'),
];

const filePathValidator = [
  query('path')
    .exists({ checkFalsy: true })
    .withMessage('File path query parameter is required.')
    .isString()
    .withMessage('File path must be a string.')
    .trim(),
];

const historyQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50.'),

  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search term must not exceed 200 characters.'),
];

module.exports = { projectIdValidator, filePathValidator, historyQueryValidator };
