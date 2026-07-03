'use strict';

const dotenv = require('dotenv');
dotenv.config();

const REQUIRED_VARS = [
  'GEMINI_API_KEY',
  'MONGO_URI',
  'CLIENT_URL',
  'GEMINI_MODEL',
];

/**
 * Validates that all required environment variables are present.
 * Fails fast on missing critical configuration.
 */
function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[PromptAI] FATAL: Missing required environment variables: ${missing.join(', ')}`);
    console.error('[PromptAI] Please copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
}

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGO_URI: process.env.MONGO_URI,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  MAX_PROMPT_LENGTH: parseInt(process.env.MAX_PROMPT_LENGTH, 10) || 4000,
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS, 10) || 3,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
  API_VERSION: 'v1',
};

module.exports = { env, validateEnv };
