'use strict';

const projectService = require('../services/ProjectService');
const { success } = require('../utils/responseFormatter');

/**
 * Project Controller — Retrieves and deletes project records.
 * Delegates to ProjectService for all operations.
 */

/**
 * GET /api/projects/:projectId
 */
async function getProject(req, res, next) {
  try {
    const project = req.project;
    return res.json(success({ project }));
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/projects/:projectId
 */
async function deleteProject(req, res, next) {
  try {
    const { projectId } = req.params;
    await projectService.deleteProject(projectId);
    return res.json(success({}, 'Project deleted successfully.'));
  } catch (error) {
    next(error);
  }
}

module.exports = { getProject, deleteProject };
