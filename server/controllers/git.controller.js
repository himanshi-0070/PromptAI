'use strict';

const gitService = require('../services/GitService');
const projectService = require('../services/ProjectService');
const { success } = require('../utils/responseFormatter');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * GitController — Maps REST endpoints to GitService operations.
 * Enforces ownership security automatically via requireProjectOwner middleware.
 */

/**
 * GET /api/v1/projects/:projectId/git/status
 * Returns clean/dirty status, untracked/modified files, branch, and last commit.
 */
async function getStatus(req, res, next) {
  try {
    const project = req.project;
    const status = await gitService.status(project.projectPath);
    return res.json(success({ status }));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/projects/:projectId/git/history
 * Returns the Git commit history list.
 */
async function getHistory(req, res, next) {
  try {
    const project = req.project;
    const history = await gitService.getHistory(project.projectPath);
    return res.json(success({ history }));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/projects/:projectId/git/diff
 * Returns standard diff string. Optionally compares two commits.
 */
async function getDiff(req, res, next) {
  try {
    const project = req.project;
    const { from, to } = req.query;
    const diff = await gitService.getDiff(project.projectPath, from, to);
    return res.json(success({ diff }));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/projects/:projectId/git/commit
 * Commits current uncommitted manual changes in the workspace.
 */
async function commitChanges(req, res, next) {
  try {
    const project = req.project;
    const { message } = req.body;

    logger.info(`[GitController] User committing manual changes for project: ${project.projectId}`);
    
    const commitMsg = message?.trim() || 'Manual workspace modifications';
    const commitHash = await gitService.commit(project.projectPath, commitMsg);

    // Create a new version snapshot in MongoDB for this manual commit
    const newVersionNum = (project.versions?.length || 0) + 1;
    const status = await gitService.status(project.projectPath);
    const modifiedFiles = [...status.modified, ...status.added, ...status.deleted];

    const manualVersion = {
      versionNumber: newVersionNum,
      prompt: `Manual Commit: ${commitMsg}`,
      timestamp: new Date(),
      modifiedFiles: modifiedFiles.length > 0 ? modifiedFiles : ['Multiple files'],
      summary: commitMsg,
      commitHash,
    };

    await projectService.updateProjectMeta(project.projectId, {
      $push: { versions: manualVersion }
    });

    return res.json(success({ commitHash }, 'Manual changes committed successfully.'));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/projects/:projectId/git/discard
 * Reverts all uncommitted changes in the workspace.
 */
async function discardChanges(req, res, next) {
  try {
    const project = req.project;
    await gitService.discardChanges(project.projectPath);
    return res.json(success(null, 'Workspace changes discarded successfully.'));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/projects/:projectId/git/rollback
 * Restores project workspace state to a specific commit.
 */
async function rollback(req, res, next) {
  try {
    const project = req.project;
    const { commitHash } = req.body;

    if (!commitHash) {
      throw new AppError('Commit hash is required for rollback.', 400);
    }

    // 1. Run git checkout/commit rollback
    const newHash = await gitService.rollback(project.projectPath, commitHash);

    // 2. Fetch the target version info from MongoDB history to sync metadata
    const targetVersion = project.versions?.find((v) => v.commitHash === commitHash);

    const nextVersionNum = (project.versions?.length || 0) + 1;
    const rollbackVersion = {
      versionNumber: nextVersionNum,
      prompt: `Rollback to version ${targetVersion?.versionNumber || 'previous'} (${commitHash.slice(0, 7)})`,
      timestamp: new Date(),
      modifiedFiles: targetVersion ? targetVersion.modifiedFiles : [],
      summary: `Rolled back workspace state to commit ${commitHash.slice(0, 7)}.`,
      commitHash: newHash,
    };

    // Update Project version tree in DB
    await projectService.updateProjectMeta(project.projectId, {
      summary: rollbackVersion.summary,
      $push: { versions: rollbackVersion }
    });

    logger.info(`[GitController] Project ${project.projectId} rolled back to commit ${commitHash}`);

    return res.json(
      success(
        {
          rollbackCommitHash: newHash,
          versionNumber: nextVersionNum,
        },
        'Project rolled back successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/projects/:projectId/git/branches
 * Lists repository branches.
 */
async function getBranches(req, res, next) {
  try {
    const project = req.project;
    const branches = await gitService.getBranches(project.projectPath);
    return res.json(success({ branches }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStatus,
  getHistory,
  getDiff,
  commitChanges,
  discardChanges,
  rollback,
  getBranches,
};
