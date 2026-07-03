const mongoose = require('mongoose')

const LabelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Label name is required.'],
    trim: true,
    minlength: [2, 'Label name must be at least 2 characters long.'],
    maxlength: [30, 'Label name cannot exceed 30 characters.']
  },
  color: {
    type: String,
    required: [true, 'Label color is required.'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code (e.g., #RRGGBB or #RGB).'],
    default: '#6366f1' // Default to indigo-500
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

// Ensure label names are unique per user
LabelSchema.index({ name: 1, user: 1 }, { unique: true })

module.exports = mongoose.model('Label', LabelSchema)
