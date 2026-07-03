'use strict';

const { Router } = require('express');
const { getDBStatus } = require('../config/db');
const { env } = require('../config/env');
const { success } = require('../utils/responseFormatter');
const Project = require('../models/Project');
const { getGeneratedProjectsRoot } = require('../utils/pathHelpers');
const { pathExists } = require('../utils/fileHelpers');
const fs = require('fs/promises');

const { requireAuth, requireProjectOwner } = require('../middleware/auth');
const authRoutes = require('./auth.routes');
const gitRoutes = require('./git.routes');
const generationRoutes = require('./generation.routes');
const projectRoutes = require('./project.routes');
const historyRoutes = require('./history.routes');
const workspaceRoutes = require('./workspace.routes');
const downloadRoutes = require('./download.routes');
const chatRoutes = require('./chat.routes');

const router = Router();

// ── Auth Routes ───────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Feature Routes (Protected) ────────────────────────────────────────────────
router.use('/generate', requireAuth, generationRoutes);
router.use('/projects', requireAuth, projectRoutes);
router.use('/projects/:projectId/git', requireAuth, requireProjectOwner, gitRoutes);
router.use('/history', requireAuth, historyRoutes);
router.use('/workspace', requireAuth, workspaceRoutes);
router.use('/download', requireAuth, downloadRoutes);
router.use('/chat', requireAuth, chatRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
/**
 * GET /api/v1/health
 * Lightweight probe used by load balancers and monitoring tools.
 * Does NOT call Gemini — only checks internal state.
 */
router.get('/health', async (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus === 'connected';

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    aiProvider: env.GEMINI_MODEL ? 'configured' : 'not configured',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  return res.status(isHealthy ? 200 : 503).json(success(payload, 'Health check completed.'));
});

// ── Status Endpoint ───────────────────────────────────────────────────────────
/**
 * GET /api/v1/status
 * Returns extended diagnostic information.
 * Useful for debugging deployments.
 */
router.get('/status', async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    const generatedRoot = getGeneratedProjectsRoot();
    const projectsRootExists = await pathExists(generatedRoot);

    // Project count — safe fallback if DB is not connected
    let projectCount = 0;
    if (dbStatus === 'connected') {
      projectCount = await Project.countDocuments();
    }

    // Disk usage of generated-projects folder
    let generatedFolderSize = 0;
    if (projectsRootExists) {
      try {
        const entries = await fs.readdir(generatedRoot);
        generatedFolderSize = entries.length;
      } catch {
        generatedFolderSize = -1;
      }
    }

    // Check Git CLI availability
    let gitAvailable = false;
    let gitVersion = 'unknown';
    try {
      const { execSync } = require('child_process');
      const versionOutput = execSync('git --version', { encoding: 'utf8', stdio: [] });
      gitAvailable = true;
      gitVersion = versionOutput.trim();
    } catch {
      // Git not installed/accessible
    }

    return res.json(
      success({
        name: 'PromptAI API',
        version: env.API_VERSION,
        environment: env.NODE_ENV,
        database: {
          status: dbStatus,
          uri: env.MONGO_URI ? env.MONGO_URI.replace(/\/\/.*@/, '//***@') : 'not set',
        },
        ai: {
          provider: 'gemini',
          model: env.GEMINI_MODEL,
          configured: Boolean(env.GEMINI_API_KEY),
        },
        git: {
          installed: gitAvailable,
          version: gitVersion,
        },
        projects: {
          count: projectCount,
          generatedFolder: projectsRootExists ? 'present' : 'missing',
          projectDirectories: generatedFolderSize,
        },
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      }, 'Status retrieved.')
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
