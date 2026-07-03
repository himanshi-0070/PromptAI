'use strict';

const Project = require('../models/Project');
const logger = require('../utils/logger');

/**
 * HistoryService — Handles paginated project history queries.
 * Read-only queries against the Project collection.
 */
class HistoryService {
  /**
   * Returns a paginated list of projects, ordered by creation date.
   * Supports text search.
   * @param {object} options - { page, limit, search }
   * @returns {Promise<{ projects: object[], total: number, page: number, totalPages: number }>}
   */
  async getHistory({ userId, page = 1, limit = 12, search = '' } = {}) {
    const skip = (page - 1) * limit;

    const query = { ownerId: userId };
    if (search) {
      query.$text = { $search: search };
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .select('projectId name description prompt status summary createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    logger.debug(`[HistoryService] Fetched ${projects.length} projects for user ${userId} (page ${page})`);

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns all projects for the history page (simplified, no pagination).
   * @param {string} userId - Owner ID.
   * @param {string} search - Optional search term.
   * @returns {Promise<object[]>}
   */
  async getAllProjects(userId, search = '') {
    const query = { ownerId: userId };
    if (search) {
      query.$text = { $search: search };
    }

    return Project.find(query)
      .select('projectId name description prompt status summary createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new HistoryService();
