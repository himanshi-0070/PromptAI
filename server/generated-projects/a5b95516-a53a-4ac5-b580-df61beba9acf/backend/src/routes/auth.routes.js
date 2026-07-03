const express = require('express')
const { registerUser, loginUser, getMe } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth')
const { validate } = require('../middleware/validation')
const { registerValidation, loginValidation } = require('../middleware/validation')

const router = express.Router()

router.post('/register', registerValidation, validate, registerUser)
router.post('/login', loginValidation, validate, loginUser)
router.get('/me', protect, getMe)

module.exports = router
