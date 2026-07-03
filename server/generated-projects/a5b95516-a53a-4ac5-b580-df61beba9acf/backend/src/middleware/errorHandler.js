const CustomError = require('../utils/CustomError')

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Server Error'
  let details = {}

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404
    message = `Resource not found with id of ${err.value}`
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue)[0]
    message = `Duplicate field value: ${field} already exists. Please use another value.`
    details = { field: err.keyValue[field] }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
    details = Object.values(err.errors).map(val => val.message)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Not authorized, token failed.'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Not authorized, token expired.'
  }

  // CustomError handling
  if (err instanceof CustomError) {
    statusCode = err.statusCode
    message = err.message
    details = err.details || {}
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    details: details
  })
}

module.exports = errorHandler
