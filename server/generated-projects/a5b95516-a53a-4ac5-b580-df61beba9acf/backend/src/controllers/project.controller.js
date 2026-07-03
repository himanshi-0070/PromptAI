const projectService = require('../services/project.service')
const CustomError = require('../utils/CustomError')

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(req.user.id)
    res.status(200).json({ success: true, data: projects, message: 'Projects fetched successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user.id)
    res.status(200).json({ success: true, data: project, message: 'Project fetched successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user.id)
    res.status(201).json({ success: true, data: project, message: 'Project created successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Update project by ID
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user.id)
    res.status(200).json({ success: true, data: project, message: 'Project updated successfully.' })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete project by ID
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user.id)
    res.status(200).json({ success: true, message: result.message })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
}
