'use strict';

const path = require('path');
const fs = require('fs/promises');
const logger = require('./logger');

/**
 * Safely resolves a file path within a base directory.
 * Prevents directory traversal attacks.
 * @param {string} base - The allowed base directory.
 * @param {string} filePath - The relative file path to resolve.
 * @returns {string} Resolved absolute path.
 * @throws {Error} If the resolved path escapes the base directory.
 */
function safeResolvePath(base, filePath) {
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.resolve(base, normalized);

  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error(`Directory traversal attempt detected: ${filePath}`);
  }

  return resolved;
}

/**
 * Recursively creates a directory structure.
 * @param {string} dirPath - Absolute directory path to create.
 */
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Writes content to a file asynchronously with UTF-8 encoding.
 * Creates parent directories if they don't exist.
 * @param {string} filePath - Absolute path to write.
 * @param {string} content - File content.
 */
async function writeFileAsync(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, { encoding: 'utf-8' });
  logger.debug(`File written: ${filePath}`);
}

/**
 * Checks if a path exists.
 * @param {string} targetPath
 * @returns {Promise<boolean>}
 */
async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively reads a directory and returns a flat list of file paths.
 * @param {string} dirPath - Base directory.
 * @param {string} [base] - Base for relative path computation.
 * @returns {Promise<Array<{path: string, relativePath: string}>>}
 */
async function readDirRecursive(dirPath, base = dirPath) {
  const results = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next'];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoreDirs.includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await readDirRecursive(fullPath, base);
      results.push(...nested);
    } else {
      results.push({
        path: fullPath,
        relativePath: path.relative(base, fullPath).replace(/\\/g, '/'),
      });
    }
  }

  return results;
}

/**
 * Reads a file and returns its content as a UTF-8 string.
 * @param {string} filePath - Absolute path.
 * @returns {Promise<string>}
 */
async function readFileAsync(filePath) {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Verifies that write permissions exist for a directory.
 * @param {string} dirPath
 */
async function verifyWritePermissions(dirPath) {
  await ensureDir(dirPath);
  const testFile = path.join(dirPath, '.write_test');
  await fs.writeFile(testFile, 'ok', 'utf-8');
  await fs.unlink(testFile);
}

module.exports = {
  safeResolvePath,
  ensureDir,
  writeFileAsync,
  pathExists,
  readDirRecursive,
  readFileAsync,
  verifyWritePermissions,
};
