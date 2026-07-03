'use strict';

const { body } = require('express-validator');
const { env } = require('../config/env');

/**
 * Validation rules for the project generation endpoint.
 */
const generateProjectValidator = [
  body('prompt')
    .exists({ checkFalsy: true })
    .withMessage('Prompt is required.')
    .isString()
    .withMessage('Prompt must be a string.')
    .trim()
    .isLength({ min: 10, max: env.MAX_PROMPT_LENGTH })
    .withMessage(`Prompt must be between 10 and ${env.MAX_PROMPT_LENGTH} characters.`),

  body('projectId')
    .optional()
    .isUUID()
    .withMessage('projectId must be a valid UUID if provided.'),
];

module.exports = { generateProjectValidator };
