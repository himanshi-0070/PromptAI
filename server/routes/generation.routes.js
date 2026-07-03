'use strict';

const { Router } = require('express');
const { generateProject } = require('../controllers/generation.controller');
const { generateProjectValidator } = require('../validators/generation.validator');
const validateRequest = require('../middleware/validateRequest');

const router = Router();

/**
 * Middleware to set a 5-minute timeout on the generate endpoint.
 * AI generation with a full project can take 3-5 minutes.
 * Without this, the default Express timeout (2 minutes) kills long requests.
 */
function generationTimeout(req, res, next) {
  // 5 minutes — generous enough for large projects
  res.setTimeout(300000, () => {
    res.status(503).json({
      success: false,
      error: 'Generation is taking longer than expected. Please try again with a simpler prompt.',
    });
  });
  next();
}

/**
 * POST /api/v1/generate
 * Starts the full 12-stage AI generation pipeline for a new project.
 * Long-running — timeout is set to 5 minutes.
 */
router.post('/', generationTimeout, generateProjectValidator, validateRequest, generateProject);

module.exports = router;
