const labelService = require('../services/label.service')
const CustomError = require('../utils/CustomError')

// @desc    Get all labels for a user
// @route   GET /api/labels
// @access  Private
const getLabels = async (req, res, next) => {
  try {
    const labels = await labelService.getLabels(req.user.id)
    res.status(200).json({ success: true, data: labels, message: 'Labels fetched successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single label by ID
// @route   GET /api/labels/:id
// @access  Private
const getLabelById = async (req, res, next) => {
  try {
    const label = await labelService.getLabelById(req.params.id, req.user.id)
    res.status(200).json({ success: true, data: label, message: 'Label fetched successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Create new label
// @route   POST /api/labels
// @access  Private
const createLabel = async (req, res, next) => {
  try {
    const label = await labelService.createLabel(req.body, req.user.id)
    res.status(201).json({ success: true, data: label, message: 'Label created successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Update label by ID
// @route   PUT /api/labels/:id
// @access  Private
const updateLabel = async (req, res, next) => {
  try {
    const label = await labelService.updateLabel(req.params.id, req.body, req.user.id)
    res.status(200).json({ success: true, data: label, message: 'Label updated successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete label by ID
// @route   DELETE /api/labels/:id
// @access  Private
const deleteLabel = async (req, res, next) => {
  try {
    const result = await labelService.deleteLabel(req.params.id, req.user.id)
    res.status(200).json({ success: true, message: result.message })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getLabels,
  getLabelById,
  createLabel,
  updateLabel,
  deleteLabel
}
