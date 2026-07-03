'use strict';

const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');
const { writeFileAsync, pathExists, readFileAsync } = require('../utils/fileHelpers');
const { getProjectFolderPath } = require('../utils/pathHelpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * ProjectWriterService — Stage 11 of the AI Generation Pipeline.
 *
 * Responsible for safely writing validated files to the filesystem.
 * Never executes generated code.
 * Never installs dependencies automatically.
 * Prevents overwriting existing projects.
 */
class ProjectWriterService {
  /**
   * Writes a validated generation response to the filesystem.
   * @param {object} validatedResponse - Output from ResponseParserService.
   * @param {string} [existingProjectId] - For incremental updates, the existing project UUID.
   * @returns {Promise<{projectId: string, projectPath: string, filesWritten: number, diffs: object}>}
   */
  async write(validatedResponse, existingProjectId = null) {
    const projectId = existingProjectId || uuidv4();
    const projectPath = getProjectFolderPath(projectId);

    logger.info(`[ProjectWriterService] Writing project ${projectId} to ${projectPath}`);

    // Prevent overwriting an existing project on first generation
    if (!existingProjectId && await pathExists(projectPath)) {
      throw new AppError(`Project folder already exists: ${projectPath}`, 500);
    }

    const files = validatedResponse.files;
    let filesWritten = 0;

    const diffs = {
      added: [],
      modified: [],
      deleted: [],
      unchanged: [],
    };

    // Write files asynchronously in parallel batches
    const processPromises = files.map(async (file) => {
      const safePath = this._buildSafePath(projectPath, file.path);
      
      if (file.deleted) {
        if (await pathExists(safePath)) {
          await fs.unlink(safePath);
          diffs.deleted.push(file.path);
          filesWritten++;
          logger.info(`[ProjectWriterService] Deleted: ${file.path}`);
        } else {
          diffs.unchanged.push(file.path);
        }
        return;
      }

      const exists = await pathExists(safePath);
      if (exists) {
        const oldContent = await readFileAsync(safePath);
        if (oldContent === file.content) {
          diffs.unchanged.push(file.path);
          logger.debug(`[ProjectWriterService] Unchanged (skipped write): ${file.path}`);
        } else {
          await writeFileAsync(safePath, file.content);
          diffs.modified.push(file.path);
          filesWritten++;
          logger.info(`[ProjectWriterService] Modified: ${file.path}`);
        }
      } else {
        await writeFileAsync(safePath, file.content);
        diffs.added.push(file.path);
        filesWritten++;
        logger.info(`[ProjectWriterService] Added: ${file.path}`);
      }
    });

    await Promise.all(processPromises);

    logger.info(`[ProjectWriterService] Diff processing complete. Added: ${diffs.added.length}, Modified: ${diffs.modified.length}, Deleted: ${diffs.deleted.length}, Unchanged: ${diffs.unchanged.length}`);

    return {
      projectId,
      projectPath,
      filesWritten,
      diffs,
    };
  }

  /**
   * Builds and validates a safe absolute path within the project folder.
   * Prevents directory traversal.
   * @param {string} projectBase - Absolute base path.
   * @param {string} relativePath - AI-generated relative path.
   * @returns {string}
   */
  _buildSafePath(projectBase, relativePath) {
    const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const resolved = path.resolve(projectBase, normalized);

    if (!resolved.startsWith(path.resolve(projectBase))) {
      throw new AppError(
        `Security violation: Path "${relativePath}" would escape the project directory.`,
        500
      );
    }

    return resolved;
  }
}

module.exports = new ProjectWriterService();
