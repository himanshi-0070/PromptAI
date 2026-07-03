const { body, param, validationResult } = require('express-validator')
const CustomError = require('../utils/CustomError')

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({ [err.path]: err.msg }))
    return next(new CustomError('Validation failed.', 400, extractedErrors))
  }
  next()
}

// Auth Validations
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
]

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
]

// Task Validations
const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required.').isLength({ min: 3, max: 100 }).withMessage('Task title must be between 3 and 100 characters.'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Task description cannot exceed 500 characters.'),
  body('status').optional().isIn(['backlog', 'todo', 'in-progress', 'done']).withMessage('Invalid task status.'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid task priority.'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Invalid due date format.').custom((value, { req }) => {
    if (value && new Date(value) < new Date()) {
      throw new Error('Due date cannot be in the past.');
    }
    return true;
  }),
  body('project').optional().isMongoId().withMessage('Invalid project ID.'),
  body('labels').optional().isArray().withMessage('Labels must be an array.').custom((value) => {
    if (value && value.some(labelId => !require('mongoose').Types.ObjectId.isValid(labelId))) {
      throw new Error('One or more label IDs are invalid.');
    }
    return true;
  })
]

const updateTaskValidation = [
  param('id').isMongoId().withMessage('Invalid Task ID.'),
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Task title must be between 3 and 100 characters.'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Task description cannot exceed 500 characters.'),
  body('status').optional().isIn(['backlog', 'todo', 'in-progress', 'done']).withMessage('Invalid task status.'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid task priority.'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Invalid due date format.').custom((value, { req }) => {
    if (value && new Date(value) < new Date()) {
      throw new Error('Due date cannot be in the past.');
    }
    return true;
  }),
  body('project').optional().isMongoId().withMessage('Invalid project ID.').customSanitizer(value => value === '' ? null : value), // Allow empty string to mean null
  body('labels').optional().isArray().withMessage('Labels must be an array.').custom((value) => {
    if (value && value.some(labelId => !require('mongoose').Types.ObjectId.isValid(labelId))) {
      throw new Error('One or more label IDs are invalid.');
    }
    return true;
  })
]

const updateTaskStatusValidation = [
  param('id').isMongoId().withMessage('Invalid Task ID.'),
  body('status').notEmpty().withMessage('Status is required.').isIn(['backlog', 'todo', 'in-progress', 'done']).withMessage('Invalid task status.')
]

// Project Validations
const createProjectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required.').isLength({ min: 3, max: 50 }).withMessage('Project name must be between 3 and 50 characters.'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Project description cannot exceed 200 characters.')
]

const updateProjectValidation = [
  param('id').isMongoId().withMessage('Invalid Project ID.'),
  body('name').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Project name must be between 3 and 50 characters.'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Project description cannot exceed 200 characters.')
]

// Label Validations
const createLabelValidation = [
  body('name').trim().notEmpty().withMessage('Label name is required.').isLength({ min: 2, max: 30 }).withMessage('Label name must be between 2 and 30 characters.'),
  body('color').trim().notEmpty().withMessage('Label color is required.').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Please enter a valid hex color code (e.g., #RRGGBB or #RGB).')
]

const updateLabelValidation = [
  param('id').isMongoId().withMessage('Invalid Label ID.'),
  body('name').optional().trim().isLength({ min: 2, max: 30 }).withMessage('Label name must be between 2 and 30 characters.'),
  body('color').optional().trim().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Please enter a valid hex color code (e.g., #RRGGBB or #RGB).')
]

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createTaskValidation,
  updateTaskValidation,
  updateTaskStatusValidation,
  createProjectValidation,
  updateProjectValidation,
  createLabelValidation,
  updateLabelValidation
}
