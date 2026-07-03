const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required.'],
    trim: true,
    minlength: [3, 'Task title must be at least 3 characters long.'],
    maxlength: [100, 'Task title cannot exceed 100 characters.']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Task description cannot exceed 500 characters.']
  },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in-progress', 'done'],
    default: 'todo',
    required: [true, 'Task status is required.']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: [true, 'Task priority is required.']
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return v === null || v > new Date();
      },
      message: 'Due date must be in the future.'
    }
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false // A task can optionally belong to a project
  },
  labels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Label'
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for efficient querying by user
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
})

// Index for frequently queried fields
TaskSchema.index({ user: 1, status: 1 })
TaskSchema.index({ user: 1, dueDate: 1 })
TaskSchema.index({ user: 1, priority: 1 })

module.exports = mongoose.model('Task', TaskSchema)
