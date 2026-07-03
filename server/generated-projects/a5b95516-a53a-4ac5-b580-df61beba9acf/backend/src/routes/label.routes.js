const express = require('express')
const { 
  getLabels, 
  getLabelById, 
  createLabel, 
  updateLabel, 
  deleteLabel 
} = require('../controllers/label.controller')
const { protect } = require('../middleware/auth')
const { validate, createLabelValidation, updateLabelValidation } = require('../middleware/validation')

const router = express.Router()

// All label routes require protection
router.use(protect)

router.route('/')
  .get(getLabels)
  .post(createLabelValidation, validate, createLabel)

router.route('/:id')
  .get(getLabelById)
  .put(updateLabelValidation, validate, updateLabel)
  .delete(deleteLabel)

module.exports = router
