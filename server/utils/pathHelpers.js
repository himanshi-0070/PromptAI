'use strict';

const path = require('path');
const { PATHS } = require('../config/constants');

/**
 * Pure path helper functions.
 * No business logic. No side effects.
 */

/**
 * Returns the absolute path to the generated-projects directory.
 */
function getGeneratedProjectsRoot() {
  return path.resolve(__dirname, '..', PATHS.GENERATED_PROJECTS);
}

/**
 * Returns the absolute path to a specific project's folder.
 * @param {string} projectId - UUID of the project.
 */
function getProjectFolderPath(projectId) {
  return path.join(getGeneratedProjectsRoot(), projectId);
}

/**
 * Returns the absolute path to a file within a project.
 * @param {string} projectId
 * @param {string} relativePath - e.g. 'frontend/src/App.jsx'
 */
function getProjectFilePath(projectId, relativePath) {
  return path.join(getProjectFolderPath(projectId), relativePath);
}

/**
 * Returns the absolute path to the temp directory.
 */
function getTempDir() {
  return path.resolve(__dirname, '..', PATHS.TEMP);
}

/**
 * Normalizes a file path to use forward slashes for consistency.
 * @param {string} filePath
 */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

/**
 * Extracts the language from a file extension.
 * @param {string} filePath
 * @returns {string}
 */
function getLanguageFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const map = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    json: 'json',
    html: 'html',
    css: 'css',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    env: 'plaintext',
    gitignore: 'plaintext',
    sh: 'bash',
    txt: 'plaintext',
  };
  return map[ext] || 'plaintext';
}

module.exports = {
  getGeneratedProjectsRoot,
  getProjectFolderPath,
  getProjectFilePath,
  getTempDir,
  normalizePath,
  getLanguageFromPath,
};
