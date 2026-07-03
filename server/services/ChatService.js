'use strict';

const generationService = require('./GenerationService');
const projectService = require('./ProjectService');
const logger = require('../utils/logger');

/**
 * ChatService — Handles incremental AI-driven project improvements.
 * Appends messages to chat history and triggers targeted generation.
 */
class ChatService {
  /**
   * Processes a new chat message for an existing project.
   * Stores user message, runs incremental generation, stores assistant response.
   * @param {string} projectId
   * @param {string} userMessage
   * @returns {Promise<{ assistantMessage: string, updatedProject: object, filesWritten: number }>}
   */
  async processMessage(projectId, userMessage, userId, onProgress = () => {}) {
    logger.info(`[ChatService] Processing chat for project ${projectId} by user ${userId}`);

    // Store user message
    await projectService.appendChatMessage(projectId, {
      role: 'user',
      content: userMessage,
    });

    // Trigger incremental generation
    const { project: updatedProject, filesWritten, diffs, reviewWarnings, durationMs } = await generationService.updateProject(
      projectId,
      userMessage,
      userId,
      onProgress
    );

    const assistantMessage =
      updatedProject.summary ||
      `I've updated your project. ${filesWritten} file(s) were modified based on your request.`;

    // Store assistant message
    await projectService.appendChatMessage(projectId, {
      role: 'assistant',
      content: assistantMessage,
    });

    return {
      assistantMessage,
      updatedProject,
      filesWritten,
      diffs,
      reviewWarnings,
      durationMs,
    };
  }
}

module.exports = new ChatService();
