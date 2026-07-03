'use strict';

const { Router } = require('express');
const gitController = require('../controllers/git.controller');

const router = Router();

router.get('/status', gitController.getStatus);
router.get('/history', gitController.getHistory);
router.get('/diff', gitController.getDiff);
router.post('/commit', gitController.commitChanges);
router.post('/discard', gitController.discardChanges);
router.post('/rollback', gitController.rollback);
router.get('/branches', gitController.getBranches);

module.exports = router;
