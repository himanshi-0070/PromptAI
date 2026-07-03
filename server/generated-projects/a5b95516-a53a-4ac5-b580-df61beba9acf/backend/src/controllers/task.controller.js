const taskService = require('../services/task.service')
const CustomError = require('../utils/CustomError')

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getTasks(req.user.id, req.query)
    res.status(200).json({ success: true, data: tasks, message: 'Tasks fetched successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.id)
    res.status(200).json({ success: true, data: task, message: 'Task fetched successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user.id)
    res.status(201).json({ success: true, data: task, message: 'Task created successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Update task by ID
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user.id)
    res.status(200).json({ success: true, data: task, message: 'Task updated successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Update task status by ID
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const task = await taskService.updateTaskStatus(req.params.id, status, req.user.id)
    res.status(200).json({ success: true, data: task, message: 'Task status updated successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete task by ID
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.id, req.user.id)
    res.status(200).json({ success: true, message: result.message })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
}
