'use strict';

const zipService = require('../services/ZipService');
const projectService = require('../services/ProjectService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Download Controller — Streams project as a ZIP archive.
 */

/**
 * GET /api/download/:projectId
 */
async function downloadProject(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await projectService.getProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    logger.info(`[DownloadController] Download requested for: ${project.name} (${projectId})`);

    await zipService.streamProjectZip(projectId, project.name, res);
  } catch (error) {
    next(error);
  }
}

module.exports = { downloadProject };
