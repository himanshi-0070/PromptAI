'use strict';

const { Router } = require('express');
const { getFileTree, getFileContent } = require('../controllers/workspace.controller');
const { projectIdValidator, filePathValidator } = require('../validators/project.validator');
const validateRequest = require('../middleware/validateRequest');
const { requireProjectOwner } = require('../middleware/auth');

const router = Router();

// Enforce project ownership checks on routes taking :projectId
router.param('projectId', requireProjectOwner);

router.get('/:projectId/files', projectIdValidator, validateRequest, getFileTree);
router.get('/:projectId/file', projectIdValidator, filePathValidator, validateRequest, getFileContent);

module.exports = router;
