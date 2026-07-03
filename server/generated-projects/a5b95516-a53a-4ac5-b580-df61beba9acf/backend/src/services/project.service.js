const Project = require('../models/Project')
const CustomError = require('../utils/CustomError')

const getProjects = async (userId) => {
  const projects = await Project.find({ user: userId }).sort({ createdAt: -1 })
  return projects
}

const getProjectById = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, user: userId })
  if (!project) {
    throw new CustomError('Project not found.', 404)
  }
  return project
}

const createProject = async (projectData, userId) => {
  const newProject = await Project.create({ ...projectData, user: userId })
  return newProject
}

const updateProject = async (projectId, projectData, userId) => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, user: userId },
    projectData,
    { new: true, runValidators: true }
  )

  if (!project) {
    throw new CustomError('Project not found or not authorized.', 404)
  }
  return project
}

const deleteProject = async (projectId, userId) => {
  const project = await Project.findOneAndDelete({ _id: projectId, user: userId })

  if (!project) {
    throw new CustomError('Project not found or not authorized.', 404)
  }
  return { message: 'Project removed successfully.' }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
}
