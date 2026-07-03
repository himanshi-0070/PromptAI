const jwt = require('jsonwebtoken')
const User = require('../models/User')
const CustomError = require('../utils/CustomError')

const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Attach user to the request (excluding password)
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return next(new CustomError('User not found.', 401))
      }

      next()
    } catch (error) {
      console.error(error)
      return next(new CustomError('Not authorized, token failed.', 401))
    }
  }

  if (!token) {
    return next(new CustomError('Not authorized, no token.', 401))
  }
}

module.exports = {
  protect
}
