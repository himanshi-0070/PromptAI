const Label = require('../models/Label')
const CustomError = require('../utils/CustomError')

const getLabels = async (userId) => {
  const labels = await Label.find({ user: userId }).sort({ name: 1 })
  return labels
}

const getLabelById = async (labelId, userId) => {
  const label = await Label.findOne({ _id: labelId, user: userId })
  if (!label) {
    throw new CustomError('Label not found.', 404)
  }
  return label
}

const createLabel = async (labelData, userId) => {
  const newLabel = await Label.create({ ...labelData, user: userId })
  return newLabel
}

const updateLabel = async (labelId, labelData, userId) => {
  const label = await Label.findOneAndUpdate(
    { _id: labelId, user: userId },
    labelData,
    { new: true, runValidators: true }
  )

  if (!label) {
    throw new CustomError('Label not found or not authorized.', 404)
  }
  return label
}

const deleteLabel = async (labelId, userId) => {
  const label = await Label.findOneAndDelete({ _id: labelId, user: userId })

  if (!label) {
    throw new CustomError('Label not found or not authorized.', 404)
  }
  return { message: 'Label removed successfully.' }
}

module.exports = {
  getLabels,
  getLabelById,
  createLabel,
  updateLabel,
  deleteLabel
}
