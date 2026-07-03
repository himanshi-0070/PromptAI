'use strict';

const simpleGit = require('simple-git');
const path = require('path');
const { pathExists } = require('../utils/fileHelpers');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * GitService — Infrastructure layer managing Git operations.
 * Wraps simple-git to run repository initializations, commits, diffs, and rollbacks.
 * Uses cross-platform NodeJS APIs.
 */
class GitService {
  /**
   * Safe getter for simple-git instance.
   * @param {string} projectPath
   * @returns {import('simple-git').SimpleGit}
   * @private
   */
  _getGit(projectPath) {
    return simpleGit(projectPath);
  }

  /**
   * Initializes a Git repository in the project folder.
   * Configures local user details to ensure compatibility.
   * @param {string} projectPath
   * @returns {Promise<string|null>} Initial commit hash.
   */
  async initRepo(projectPath) {
    try {
      const gitPath = path.join(projectPath, '.git');
      const gitExists = await pathExists(gitPath);

      if (gitExists) {
        logger.info(`[GitService] Git repository already exists in ${projectPath}`);
        const git = this._getGit(projectPath);
        const log = await git.log({ maxCount: 1 });
        return log.latest ? log.latest.hash : null;
      }

      logger.info(`[GitService] Initializing new Git repository at ${projectPath}`);
      const git = this._getGit(projectPath);
      await git.init();

      // Configure local user to prevent git commit failures if global configs are missing
      await git.addConfig('user.name', 'PromptAI Developer');
      await git.addConfig('user.email', 'developer@promptai.dev');

      // Create initial commit
      await git.add('-A');
      await git.commit('Initial AI Project Generation');

      const log = await git.log({ maxCount: 1 });
      const hash = log.latest ? log.latest.hash : null;
      logger.info(`[GitService] Initial commit created: ${hash}`);
      return hash;
    } catch (error) {
      logger.error(`[GitService] Initialization failed: ${error.message}`);
      throw new AppError(`Git initialization failed: ${error.message}`, 500);
    }
  }

  /**
   * Creates a commit with the specified message.
   * Stages all changes automatically.
   * @param {string} projectPath
   * @param {string} message
   * @returns {Promise<string|null>} Commit hash.
   */
  async commit(projectPath, message) {
    try {
      const git = this._getGit(projectPath);
      const status = await git.status();

      // Check if there are changes to commit
      if (status.isClean()) {
        logger.debug(`[GitService] Working tree is clean. Skipping commit.`);
        const log = await git.log({ maxCount: 1 });
        return log.latest ? log.latest.hash : null;
      }

      await git.add('-A');
      await git.commit(message);

      const log = await git.log({ maxCount: 1 });
      const hash = log.latest ? log.latest.hash : null;
      logger.info(`[GitService] Commit created: ${hash} - "${message}"`);
      return hash;
    } catch (error) {
      logger.error(`[GitService] Commit failed: ${error.message}`);
      throw new AppError(`Git commit failed: ${error.message}`, 500);
    }
  }

  /**
   * Retrieves the current workspace status.
   * @param {string} projectPath
   * @returns {Promise<object>} Status metrics.
   */
  async status(projectPath) {
    try {
      const git = this._getGit(projectPath);
      const status = await git.status();

      // Fetch latest commit metadata safely
      let lastCommit = null;
      try {
        const log = await git.log({ maxCount: 1 });
        if (log.latest) {
          lastCommit = {
            hash: log.latest.hash,
            message: log.latest.message,
            date: log.latest.date,
          };
        }
      } catch (err) {
        // Log query can fail if no commits exist yet
      }

      return {
        clean: status.isClean(),
        branch: status.current,
        modified: status.modified,
        deleted: status.deleted,
        added: status.created, // simple-git maps newly created/added files as status.created
        untracked: status.not_added,
        lastCommit,
      };
    } catch (error) {
      logger.error(`[GitService] Status retrieval failed: ${error.message}`);
      throw new AppError(`Git status failed: ${error.message}`, 500);
    }
  }

  /**
   * Returns a list of commits in reverse chronological order.
   * @param {string} projectPath
   * @returns {Promise<array>} Commit list logs.
   */
  async getHistory(projectPath) {
    try {
      const git = this._getGit(projectPath);
      const logs = await git.log();
      return logs.all.map((log) => ({
        hash: log.hash,
        message: log.message,
        date: log.date,
        author: log.author_name,
        email: log.author_email,
      }));
    } catch (error) {
      logger.error(`[GitService] History retrieval failed: ${error.message}`);
      throw new AppError(`Git history failed: ${error.message}`, 500);
    }
  }

  /**
   * Generates diff maps.
   * If hash2 is omitted, generates diff of working directory against latest commit.
   * @param {string} projectPath
   * @param {string} [hash1]
   * @param {string} [hash2]
   * @returns {Promise<string>} Diff output text.
   */
  async getDiff(projectPath, hash1 = null, hash2 = null) {
    try {
      const git = this._getGit(projectPath);
      const args = [];
      if (hash1) args.push(hash1);
      if (hash2) args.push(hash2);

      return await git.diff(args);
    } catch (error) {
      logger.error(`[GitService] Diff generation failed: ${error.message}`);
      throw new AppError(`Git diff failed: ${error.message}`, 500);
    }
  }

  /**
   * Performs non-destructive rollbacks.
   * Restores files to target state and commits changes.
   * @param {string} projectPath
   * @param {string} hash
   * @returns {Promise<string|null>} Rollback commit hash.
   */
  async rollback(projectPath, hash) {
    try {
      logger.info(`[GitService] Initiating rollback to commit ${hash} in ${projectPath}`);
      const git = this._getGit(projectPath);

      // Restore files from target commit to working directory
      await git.checkout([hash, '--', '.']);

      // Commit the checkout changes
      await git.add('-A');
      const commitMessage = `Rollback to commit ${hash.slice(0, 7)}`;
      await git.commit(commitMessage);

      const log = await git.log({ maxCount: 1 });
      const newHash = log.latest ? log.latest.hash : null;
      logger.info(`[GitService] Rollback commit finalized: ${newHash}`);
      return newHash;
    } catch (error) {
      logger.error(`[GitService] Rollback failed: ${error.message}`);
      throw new AppError(`Git rollback failed: ${error.message}`, 500);
    }
  }

  /**
   * Discards all uncommitted changes in the workspace.
   * Reverts modified files and cleans untracked files.
   * @param {string} projectPath
   */
  async discardChanges(projectPath) {
    try {
      logger.info(`[GitService] Discarding all uncommitted changes in ${projectPath}`);
      const git = this._getGit(projectPath);
      
      // Revert edits
      await git.checkout(['--', '.']);
      // Remove untracked files and folders
      await git.clean('f', ['-d']);
      
      logger.info(`[GitService] Discard complete.`);
    } catch (error) {
      logger.error(`[GitService] Discard failed: ${error.message}`);
      throw new AppError(`Git discard failed: ${error.message}`, 500);
    }
  }

  /**
   * Lists local branches.
   * @param {string} projectPath
   * @returns {Promise<object>} Branches collection.
   */
  async getBranches(projectPath) {
    try {
      const git = this._getGit(projectPath);
      const branches = await git.branchLocal();
      return {
        current: branches.current,
        all: branches.all,
      };
    } catch (error) {
      logger.error(`[GitService] Branch retrieval failed: ${error.message}`);
      throw new AppError(`Git branches failed: ${error.message}`, 500);
    }
  }
}

module.exports = new GitService();
