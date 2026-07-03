const authService = require('../services/auth.service')
const CustomError = require('../utils/CustomError')

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    const user = await authService.registerUser(name, email, password)
    res.status(201).json({ success: true, data: user, message: 'User registered successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const { user, token } = await authService.loginUser(email, password)
    res.status(200).json({ success: true, data: { user, token }, message: 'Logged in successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    if (!req.user) {
      return next(new CustomError('User not found.', 404))
    }
    res.status(200).json({ success: true, data: req.user, message: 'User profile fetched successfully.' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  registerUser,
  loginUser,
  getMe
}
