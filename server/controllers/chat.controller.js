'use strict';

const chatService = require('../services/ChatService');
const projectService = require('../services/ProjectService');
const { success } = require('../utils/responseFormatter');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Chat Controller — Handles AI chat messages for iterative project improvement.
 */

/**
 * GET /api/v1/chat/:projectId
 * Returns the full chat history for a project.
 */
async function getChatHistory(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await projectService.getProjectById(projectId);

    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    return res.json(success({ messages: project.chatHistory || [] }));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/chat/:projectId
 * Sends a new message and triggers streamed incremental AI generation.
 */
async function sendMessage(req, res, next) {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    logger.info(`[ChatController] New message for project ${projectId}`);

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onProgress = (status) => {
      res.write(`data: ${JSON.stringify({ type: 'stage', ...status })}\n\n`);
    };

    const result = await chatService.processMessage(projectId, message.trim(), req.user.userId, onProgress);

    const payload = {
      assistantMessage: result.assistantMessage,
      filesWritten: result.filesWritten,
      projectId,
      project: {
        projectId: result.updatedProject.projectId,
        name: result.updatedProject.name,
        description: result.updatedProject.description,
        status: result.updatedProject.status,
        summary: result.updatedProject.summary,
        filesWritten: result.filesWritten,
        durationMs: result.durationMs,
        createdAt: result.updatedProject.createdAt,
        versions: result.updatedProject.versions,
        dependencies: result.updatedProject.dependencies,
        filesMeta: result.updatedProject.filesMeta,
        folderTree: result.updatedProject.folderTree,
      },
      diffs: result.diffs,
      reviewWarnings: result.reviewWarnings,
      durationMs: result.durationMs,
    };

    res.write(`data: ${JSON.stringify({ type: 'complete', ...payload })}\n\n`);
    res.end();
  } catch (error) {
    logger.error(`[ChatController] Chat update failed: ${error.message}`);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Chat update failed.' })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
}

module.exports = { getChatHistory, sendMessage };
