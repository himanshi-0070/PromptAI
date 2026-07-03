'use strict';

const { Router } = require('express');
const { getHistory } = require('../controllers/history.controller');
const { historyQueryValidator } = require('../validators/project.validator');
const validateRequest = require('../middleware/validateRequest');

const router = Router();

router.get('/', historyQueryValidator, validateRequest, getHistory);

module.exports = router;
