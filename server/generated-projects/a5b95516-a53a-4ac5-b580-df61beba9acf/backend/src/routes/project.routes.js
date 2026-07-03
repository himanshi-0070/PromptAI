const express = require('express')
const { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject 
} = require('../controllers/project.controller')
const { protect } = require('../middleware/auth')
const { validate, createProjectValidation, updateProjectValidation } = require('../middleware/validation')

const router = express.Router()

// All project routes require protection
router.use(protect)

router.route('/')
  .get(getProjects)
  .post(createProjectValidation, validate, createProject)

router.route('/:id')
  .get(getProjectById)
  .put(updateProjectValidation, validate, updateProject)
  .delete(deleteProject)

module.exports = router
