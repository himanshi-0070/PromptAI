'use strict';


const { getProjectFolderPath, getLanguageFromPath, normalizePath } = require('../utils/pathHelpers');
const { readDirRecursive, readFileAsync, pathExists, safeResolvePath } = require('../utils/fileHelpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * WorkspaceService — File system reads for the workspace.
 * Reads project files, builds file trees, serves file content.
 * Never modifies the filesystem.
 */
class WorkspaceService {
  /**
   * Returns the full file tree for a project.
   * @param {string} projectId
   * @returns {Promise<object[]>} Nested file tree structure.
   */
  async getFileTree(projectId) {
    const projectPath = getProjectFolderPath(projectId);

    if (!(await pathExists(projectPath))) {
      throw new AppError(`Project files not found for ID: ${projectId}`, 404);
    }

    const files = await readDirRecursive(projectPath);
    const tree = this._buildTree(files);

    logger.debug(`[WorkspaceService] File tree built for project ${projectId}`);
    return tree;
  }

  /**
   * Returns the content of a specific file within a project.
   * @param {string} projectId
   * @param {string} relativePath - Relative path within the project folder.
   * @returns {Promise<{ content: string, language: string, path: string }>}
   */
  async getFileContent(projectId, relativePath) {
    const projectPath = getProjectFolderPath(projectId);
    const safePath = safeResolvePath(projectPath, relativePath);

    const content = await readFileAsync(safePath);
    const language = getLanguageFromPath(relativePath);

    logger.debug(`[WorkspaceService] File served: ${relativePath}`);

    return {
      content,
      language,
      path: normalizePath(relativePath),
    };
  }

  /**
   * Builds a nested file tree from a flat list of file entries.
   * @param {Array<{path: string, relativePath: string}>} files
  _buildTree(files) {
    const root = [];

    for (const file of files) {
      const parts = file.relativePath.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        if (isFile) {
          current.push({
            type: 'file',
            name: part,
            path: file.relativePath,
            language: getLanguageFromPath(part),
          });
        } else {
          let dir = current.find((n) => n.type === 'directory' && n.name === part);
          if (!dir) {
            dir = {
              type: 'directory',
              name: part,
              path: parts.slice(0, i + 1).join('/'),
              children: [],
            };
            current.push(dir);
          }
          current = dir.children;
        }
      }
    }

    return this._sortTree(root);
  }

  /**
   * Sorts tree nodes — directories first, then files, both alphabetically.
   */
  _sortTree(nodes) {
    return nodes
      .map((node) => {
        if (node.type === 'directory') {
          return { ...node, children: this._sortTree(node.children) };
        }
        return node;
      })
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }
}

module.exports = new WorkspaceService();
