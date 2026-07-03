'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { getChatHistory, sendMessage } = require('../controllers/chat.controller');
const { projectIdValidator } = require('../validators/project.validator');
const validateRequest = require('../middleware/validateRequest');
const { requireProjectOwner } = require('../middleware/auth');

const router = Router();

// Enforce project ownership checks on routes taking :projectId
router.param('projectId', requireProjectOwner);

/**
 * Validation rules for the chat message body.
 */
const chatMessageValidator = [
  body('message')
    .exists({ checkFalsy: true })
    .withMessage('Message is required.')
    .isString()
    .withMessage('Message must be a string.')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters.'),
];

/**
 * GET /api/v1/chat/:projectId
 * Returns the chat history for a project.
 */
router.get('/:projectId', projectIdValidator, validateRequest, getChatHistory);

/**
 * POST /api/v1/chat/:projectId
 * Sends a new message and triggers incremental generation.
 */
router.post(
  '/:projectId',
  projectIdValidator,
  chatMessageValidator,
  validateRequest,
  sendMessage
);

module.exports = router;
