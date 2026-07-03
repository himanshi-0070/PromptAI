'use strict';

/**
 * App-wide constants. No business logic here.
 */

const GENERATION_STAGES = {
  ANALYZING: 'Analyzing Requirements',
  PLANNING: 'Planning Project',
  DESIGNING: 'Designing Architecture',
  GENERATING: 'Generating Code',
  WRITING: 'Writing Files',
  FINALIZING: 'Finalizing Project',
  COMPLETE: 'Complete',
};

const PROJECT_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETE: 'complete',
  FAILED: 'failed',
};

const SUPPORTED_LANGUAGES = [
  'javascript', 'jsx', 'typescript', 'tsx',
  'json', 'html', 'css', 'markdown',
  'yaml', 'env', 'plaintext',
];

const FILE_LIMITS = {
  MAX_FILES_PER_PROJECT: 200,
  MAX_FILE_SIZE_KB: 512,
};

const AI_PROVIDER = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  CLAUDE: 'claude',
};

const PATHS = {
  GENERATED_PROJECTS: 'generated-projects',
  LOGS: 'logs',
  TEMP: 'temp',
};

const API_VERSION = 'v1';

module.exports = {
  GENERATION_STAGES,
  PROJECT_STATUS,
  SUPPORTED_LANGUAGES,
  FILE_LIMITS,
  AI_PROVIDER,
  PATHS,
  API_VERSION,
};
