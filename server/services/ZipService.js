'use strict';

const archiver = require('archiver');
const { getProjectFolderPath } = require('../utils/pathHelpers');
const { pathExists } = require('../utils/fileHelpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * ZipService — Creates downloadable ZIP archives of generated projects.
 * Streams the archive directly to the response object.
 * Temp files are cleaned up after streaming.
 */
class ZipService {
  /**
   * Streams a ZIP archive of the project to the HTTP response.
   * @param {string} projectId
   * @param {string} projectName - Used for the download filename.
   * @param {object} res - Express response object.
   */
  async streamProjectZip(projectId, projectName, res) {
    const projectPath = getProjectFolderPath(projectId);

    if (!(await pathExists(projectPath))) {
      throw new AppError(`Project files not found: ${projectId}`, 404);
    }

    const safeName = projectName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    const filename = `${safeName}-${projectId.slice(0, 8)}.zip`;

    logger.info(`[ZipService] Creating ZIP for project ${projectId}: ${filename}`);

    return new Promise((resolve, reject) => {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const archive = archiver('zip', { zlib: { level: 6 } });

      archive.on('error', (err) => {
        logger.error(`[ZipService] Archive error: ${err.message}`);
        reject(new AppError('Failed to create project archive.', 500));
      });

      archive.on('end', () => {
        logger.info(`[ZipService] ZIP streamed: ${archive.pointer()} bytes`);
        resolve();
      });

      archive.pipe(res);
      archive.directory(projectPath, safeName);
      archive.finalize();
    });
  }
}

module.exports = new ZipService();
