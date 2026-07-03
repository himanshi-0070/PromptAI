'use strict';

const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * ProjectService — MongoDB CRUD for Project metadata.
 * No file system logic here. No business logic.
 * Only database interaction for project records.
 */
class ProjectService {
  /**
   * Creates and saves a new Project document.
   * @param {object} projectData
   * @returns {Promise<object>} Saved project document.
   */
  async createProject(projectData) {
    const project = new Project(projectData);
    const saved = await project.save();
    logger.info(`[ProjectService] Project created: ${saved.projectId}`);
    return saved;
  }

  /**
   * Retrieves a project by its UUID.
   * @param {string} projectId
   * @returns {Promise<object|null>}
   */
  async getProjectById(projectId) {
    return Project.findOne({ projectId }).lean();
  }

  /**
   * Updates the status of a project.
   * @param {string} projectId
   * @param {string} status
   */
  async updateStatus(projectId, status) {
    await Project.updateOne({ projectId }, { status });
  }

  /**
   * Updates project metadata after incremental generation.
   * @param {string} projectId
   * @param {object} updates
   */
  async updateProjectMeta(projectId, updates) {
    await Project.updateOne({ projectId }, { ...updates, updatedAt: new Date() });
  }

  /**
   * Deletes a project document from MongoDB and cleans up the filesystem directory.
   * @param {string} projectId
   */
  async deleteProject(projectId) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    // Clean up project files on filesystem
    const fs = require('fs/promises');
    try {
      if (project.projectPath) {
        await fs.rm(project.projectPath, { recursive: true, force: true });
        logger.info(`[ProjectService] Deleted project folder: ${project.projectPath}`);
      }
    } catch (err) {
      logger.error(`[ProjectService] Failed to delete folder ${project.projectPath}: ${err.message}`);
    }

    await Project.deleteOne({ projectId });
    logger.info(`[ProjectService] Project deleted from DB: ${projectId}`);
  }

  /**
   * Appends a chat message to the project's history.
   * @param {string} projectId
   * @param {{ role: string, content: string }} message
   */
  async appendChatMessage(projectId, message) {
    await Project.updateOne(
      { projectId },
      {
        $push: {
          chatHistory: {
            role: message.role,
            content: message.content,
            timestamp: new Date(),
          },
        },
      }
    );
  }
}

module.exports = new ProjectService();
