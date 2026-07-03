'use strict';

const workspaceService = require('../services/WorkspaceService');
const { success } = require('../utils/responseFormatter');

/**
 * Workspace Controller — File tree and file content for the workspace UI.
 */

/**
 * GET /api/workspace/:projectId/files
 * Returns the full file tree for the project.
 */
async function getFileTree(req, res, next) {
  try {
    const { projectId } = req.params;
    const tree = await workspaceService.getFileTree(projectId);
    return res.json(success({ tree }));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/workspace/:projectId/file?path=...
 * Returns the content of a specific file.
 */
async function getFileContent(req, res, next) {
  try {
    const { projectId } = req.params;
    const { path: filePath } = req.query;

    const fileData = await workspaceService.getFileContent(projectId, filePath);
    return res.json(success({ file: fileData }));
  } catch (error) {
    next(error);
  }
}

module.exports = { getFileTree, getFileContent };
