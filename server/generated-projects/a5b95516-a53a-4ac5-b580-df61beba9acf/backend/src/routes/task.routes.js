const express = require('express')
const { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  updateTaskStatus, 
  deleteTask 
} = require('../controllers/task.controller')
const { protect } = require('../middleware/auth')
const { validate, createTaskValidation, updateTaskValidation, updateTaskStatusValidation } = require('../middleware/validation')

const router = express.Router()

// All task routes require protection
router.use(protect)

router.route('/')
  .get(getTasks)
  .post(createTaskValidation, validate, createTask)

router.route('/:id')
  .get(getTaskById)
  .put(updateTaskValidation, validate, updateTask)
  .delete(deleteTask)

router.patch('/:id/status', updateTaskStatusValidation, validate, updateTaskStatus)

module.exports = router
