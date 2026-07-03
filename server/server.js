'use strict';

/**
 * PromptAI Server Entry Point
 *
 * Startup sequence:
 * 1. Load & validate environment variables (fail fast)
 * 2. Connect to MongoDB
 * 3. Ensure required directories exist
 * 4. Verify write permissions
 * 5. Register middleware
 * 6. Mount versioned API routes at /api/v1/
 * 7. Register 404 handler
 * 8. Register centralized error handler
 * 9. Start HTTP server
 * 10. Register graceful shutdown handlers
 */

const dns = require('dns');

// Override DNS servers to use Google Public DNS.
// The default corporate DNS blocks .mongodb.net SRV record lookups.
// This must happen before any network connections are established.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const { validateEnv, env } = require('./config/env');

// Step 1: Fail fast on missing env vars before any other imports
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { connectDB, closeDB } = require('./config/db');
const { PATHS, API_VERSION } = require('./config/constants');
const logger = require('./utils/logger');
const { verifyWritePermissions, ensureDir } = require('./utils/fileHelpers');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes/index');

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true, // Return rate limit info in standard headers
  legacyHeaders: false, // Disable older X-RateLimit headers
  message: {
    status: 'error',
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// ── Security & Optimization Middleware ───────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use('/api', limiter);

app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(require('cookie-parser')());

// ── Request Logging ──────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Versioned API Routes ─────────────────────────────────────────────────────
app.use(`/api/${API_VERSION}`, routes);

// ── 404 Handler (after all routes) ───────────────────────────────────────────
app.use(notFound);

// ── Centralized Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    logger.info('[Bootstrap] Starting PromptAI server...');

    // Connect to MongoDB
    await connectDB();

    // Ensure required directories exist and are writable
    const generatedProjectsDir = path.resolve(__dirname, PATHS.GENERATED_PROJECTS);
    const logsDir = path.resolve(__dirname, PATHS.LOGS);
    const tempDir = path.resolve(__dirname, PATHS.TEMP);

    await Promise.all([
      ensureDir(generatedProjectsDir),
      ensureDir(logsDir),
      ensureDir(tempDir),
    ]);

    await verifyWritePermissions(generatedProjectsDir);
    logger.info(`[Bootstrap] Write permissions verified: ${generatedProjectsDir}`);

    // Start the HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`[Bootstrap] PromptAI server running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`[Bootstrap] API base: http://localhost:${env.PORT}/api/${API_VERSION}`);
      logger.info(`[Bootstrap] Client origin: ${env.CLIENT_URL}`);
    });

    // ── Graceful Shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`[Bootstrap] ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await closeDB();
        logger.info('[Bootstrap] Server closed cleanly.');
        process.exit(0);
      });

      // Force exit after 10 seconds if shutdown hangs
      setTimeout(() => {
        logger.error('[Bootstrap] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Log unhandled rejections rather than crashing silently
    process.on('unhandledRejection', (reason) => {
      logger.error(`[Bootstrap] Unhandled Promise Rejection: ${reason}`);
    });

  } catch (error) {
    logger.error(`[Bootstrap] Startup failed: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
