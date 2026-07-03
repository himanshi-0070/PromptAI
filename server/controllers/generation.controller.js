'use strict';

const generationService = require('../services/GenerationService');
const logger = require('../utils/logger');

/**
 * Generation Controller — Thin orchestrator.
 * Receives request → calls GenerationService → returns streamed SSE response.
 */

/**
 * POST /api/generate
 * Generates a complete new project from a natural language prompt.
 * Streams active planning and writing stages via SSE.
 */
async function generateProject(req, res, next) {
  try {
    const { prompt } = req.body;

    logger.info(`[GenerationController] New generation request. Prompt: "${prompt.slice(0, 80)}..."`);

    // Setup headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onProgress = (status) => {
      res.write(`data: ${JSON.stringify({ type: 'stage', ...status })}\n\n`);
    };

    const result = await generationService.generateProject(prompt, req.user.userId, onProgress);

    const payload = {
      project: {
        projectId: result.project.projectId,
        name: result.project.name,
        description: result.project.description,
        status: result.project.status,
        summary: result.summary,
        filesWritten: result.filesWritten,
        durationMs: result.durationMs,
        createdAt: result.project.createdAt,
        versions: result.project.versions,
        dependencies: result.project.dependencies,
        filesMeta: result.project.filesMeta,
        folderTree: result.project.folderTree,
      },
      diffs: result.diffs,
      reviewWarnings: result.reviewWarnings,
    };

    res.write(`data: ${JSON.stringify({ type: 'complete', ...payload })}\n\n`);
    res.end();
  } catch (error) {
    logger.error(`[GenerationController] Generation failed: ${error.message}`);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Generation failed.' })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
}

module.exports = { generateProject };
