'use strict';

const historyService = require('../services/HistoryService');
const { success } = require('../utils/responseFormatter');

/**
 * History Controller — Returns paginated project history.
 */

/**
 * GET /api/history
 */
async function getHistory(req, res, next) {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;

    const result = await historyService.getHistory({
      userId: req.user.userId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: String(search),
    });

    return res.json(success(result));
  } catch (error) {
    next(error);
  }
}

module.exports = { getHistory };
