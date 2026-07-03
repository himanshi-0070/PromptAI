const Task = require('../models/Task')
const CustomError = require('../utils/CustomError')

const getTasks = async (userId, queryParams) => {
  const { status, priority, project, search } = queryParams
  const filter = { user: userId }

  if (status) {
    filter.status = status
  }
  if (priority) {
    filter.priority = priority
  }
  if (project) {
    filter.project = project
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  }

  const tasks = await Task.find(filter)
    .populate('project', 'name') // Populate project name
    .populate('labels', 'name color') // Populate label name and color
    .sort({ createdAt: -1 })

  return tasks
}

const getTaskById = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, user: userId })
    .populate('project', 'name')
    .populate('labels', 'name color')

  if (!task) {
    throw new CustomError('Task not found.', 404)
  }
  return task
}

const createTask = async (taskData, userId) => {
  const newTask = await Task.create({ ...taskData, user: userId })
  // Populate after creation for consistent response structure
  const populatedTask = await Task.findById(newTask._id)
    .populate('project', 'name')
    .populate('labels', 'name color')
  return populatedTask
}

const updateTask = async (taskId, taskData, userId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    taskData,
    { new: true, runValidators: true }
  )

  if (!task) {
    throw new CustomError('Task not found or not authorized.', 404)
  }
  // Populate after update for consistent response structure
  const populatedTask = await Task.findById(task._id)
    .populate('project', 'name')
    .populate('labels', 'name color')
  return populatedTask
}

const updateTaskStatus = async (taskId, newStatus, userId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    { status: newStatus },
    { new: true, runValidators: true }
  )

  if (!task) {
    throw new CustomError('Task not found or not authorized.', 404)
  }
  // Populate after update for consistent response structure
  const populatedTask = await Task.findById(task._id)
    .populate('project', 'name')
    .populate('labels', 'name color')
  return populatedTask
}

const deleteTask = async (taskId, userId) => {
  const task = await Task.findOneAndDelete({ _id: taskId, user: userId })

  if (!task) {
    throw new CustomError('Task not found or not authorized.', 404)
  }
  return { message: 'Task removed successfully.' }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
}
