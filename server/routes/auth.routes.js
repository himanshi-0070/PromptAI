'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// Public auth endpoints
router.post('/google', authController.googleSignIn);
router.post('/refresh', authController.refreshSession);
router.post('/logout', authController.logout);

// Protected user profile & settings endpoints
router.get('/me', requireAuth, authController.getMe);
router.put('/preferences', requireAuth, authController.updatePreferences);

module.exports = router;
