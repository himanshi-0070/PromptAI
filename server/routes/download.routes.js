'use strict';

const { Router } = require('express');
const { downloadProject } = require('../controllers/download.controller');
const { projectIdValidator } = require('../validators/project.validator');
const validateRequest = require('../middleware/validateRequest');
const { requireProjectOwner } = require('../middleware/auth');

const router = Router();

// Enforce project ownership checks on routes taking :projectId
router.param('projectId', requireProjectOwner);

router.get('/:projectId', projectIdValidator, validateRequest, downloadProject);

module.exports = router;
