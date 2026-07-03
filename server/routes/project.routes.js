'use strict';

const { Router } = require('express');
const { getProject, deleteProject } = require('../controllers/project.controller');
const { projectIdValidator } = require('../validators/project.validator');
const validateRequest = require('../middleware/validateRequest');
const { requireProjectOwner } = require('../middleware/auth');

const router = Router();

// Enforce project ownership checks on routes taking :projectId
router.param('projectId', requireProjectOwner);

router.get('/:projectId', projectIdValidator, validateRequest, getProject);
router.delete('/:projectId', projectIdValidator, validateRequest, deleteProject);

module.exports = router;
