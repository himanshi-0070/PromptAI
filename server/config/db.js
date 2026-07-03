'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { env } = require('./env');

/**
 * Establishes a MongoDB connection with fail-fast behavior.
 * Registers connection event handlers for lifecycle monitoring.
 * The server will not start if the initial connection fails.
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    logger.info(`[DB] MongoDB connected: ${conn.connection.host}`);
    logger.info(`[DB] Database: ${conn.connection.name}`);
  } catch (error) {
    logger.error(`[DB] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('[DB] MongoDB reconnected successfully.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`[DB] MongoDB error: ${err.message}`);
  });
}

/**
 * Closes the MongoDB connection gracefully.
 * Called during server shutdown.
 */
async function closeDB() {
  try {
    await mongoose.connection.close();
    logger.info('[DB] MongoDB connection closed.');
  } catch (error) {
    logger.error(`[DB] Error closing MongoDB: ${error.message}`);
  }
}

/**
 * Returns the current MongoDB connection state as a string.
 * Used by the health check endpoint.
 * @returns {'connected'|'disconnected'|'connecting'|'disconnecting'}
 */
function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

module.exports = { connectDB, closeDB, getDBStatus };
