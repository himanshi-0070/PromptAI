const mongoose = require('mongoose')

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required.'],
    trim: true,
    minlength: [3, 'Project name must be at least 3 characters long.'],
    maxlength: [50, 'Project name cannot exceed 50 characters.']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Project description cannot exceed 200 characters.']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for efficient querying by user
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
})

// Ensure project names are unique per user
ProjectSchema.index({ name: 1, user: 1 }, { unique: true })

module.exports = mongoose.model('Project', ProjectSchema)
