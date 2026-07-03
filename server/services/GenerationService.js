'use strict';

const path = require('path');
const GeminiProvider = require('./ai/GeminiService');
const plannerService = require('./PlannerService');
const promptBuilderService = require('./PromptBuilderService');
const responseParserService = require('./ResponseParserService');
const projectWriterService = require('./ProjectWriterService');
const projectService = require('./ProjectService');
const gitService = require('./GitService');
const { PROJECT_STATUS } = require('../config/constants');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * GenerationService — The Central Orchestrator of the AI Generation Pipeline.
 *
 * This service is the ONLY public entry point for project generation.
 * It coordinates the full pipeline but knows nothing about Gemini internals.
 */
class GenerationService {
  /**
   * @param {import('./ai/AIProvider')} aiProvider - Concrete AI provider implementation.
   */
  constructor(aiProvider) {
    this._ai = aiProvider;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Generates a complete new project from a user prompt.
   * Orchestrates all 12 pipeline stages.
   *
   * @param {string} userPrompt - The raw user prompt from the request body.
   * @param {string} userId - Owner user ID.
   * @param {function} [onProgress] - Progress listener callback.
   * @returns {Promise<GenerationResult>}
   */
  async generateProject(userPrompt, userId, onProgress = () => {}) {
    const startTime = Date.now();
    const pipeline = this._createPipelineLogger('generateProject');

    pipeline.start();
    onProgress({ stage: 'Understanding Project', index: 1 });

    // Transient DB record — only set once the project is created in MongoDB
    let projectRecord = null;

    try {
      // ── Stages 1–6: Planning ─────────────────────────────────────────────
      onProgress({ stage: 'Analyzing Requirements', index: 2 });
      pipeline.stage('1-6', 'PlannerService — analyzing intent and architecture');
      const projectSpec = plannerService.analyze(userPrompt);
      pipeline.done('1-6', `appType: ${projectSpec.appType}, pages: ${projectSpec.architecture.pages.length}`);

      // ── Stage 7: Prompt Construction ─────────────────────────────────────
      onProgress({ stage: 'Planning Architecture', index: 3 });
      pipeline.stage('7', 'PromptBuilderService — constructing enriched prompt');
      const enrichedPrompt = promptBuilderService.buildGenerationPrompt(userPrompt, projectSpec);
      pipeline.done('7', `prompt length: ${enrichedPrompt.length} chars`);

      // ── Stage 8: AI Generation ────────────────────────────────────────────
      onProgress({ stage: 'Generating Source Files', index: 4 });
      pipeline.stage('8', 'AIProvider — calling Gemini with enriched prompt');
      const { parsed: rawResponse, latencyMs } = await this._ai.generate(enrichedPrompt);
      pipeline.done('8', `Gemini responded in ${latencyMs}ms`);

      // ── Stages 9–10: Validation + Review ─────────────────────────────────
      onProgress({ stage: 'Running Code Review Checks', index: 5 });
      pipeline.stage('9-10', 'ResponseParserService — validating and normalizing response');
      const validatedResponse = responseParserService.validate(rawResponse, false);
      pipeline.done('9-10', `${validatedResponse.files.length} files validated`);

      // ── Stage 11: Write to Filesystem ────────────────────────────────────
      onProgress({ stage: 'Writing Workspace Files', index: 6 });
      pipeline.stage('11', 'ProjectWriterService — writing files to disk');
      const { projectId, projectPath, filesWritten, diffs } = await projectWriterService.write(validatedResponse);
      pipeline.done('11', `${filesWritten} files written → ${projectPath}`);

      // Initialize Git repository
      const commitHash = await gitService.initRepo(projectPath);

      // ── Stage 12: Persist Metadata to MongoDB ────────────────────────────
      onProgress({ stage: 'Saving Version History', index: 7 });
      pipeline.stage('12', 'ProjectService — persisting project metadata to MongoDB');
      const durationMs = Date.now() - startTime;

      const initialVersion = {
        versionNumber: 1,
        prompt: userPrompt,
        timestamp: new Date(),
        modifiedFiles: validatedResponse.files.map((f) => f.path),
        summary: validatedResponse.summary,
        commitHash,
      };

      projectRecord = await projectService.createProject({
        projectId,
        name: validatedResponse.projectName,
        description: validatedResponse.description,
        prompt: userPrompt,
        projectPath,
        status: PROJECT_STATUS.COMPLETE,
        dependencies: [
          ...(validatedResponse.dependencies.frontend),
          ...(validatedResponse.dependencies.backend),
        ],
        folderTree: validatedResponse.folderTree,
        filesMeta: validatedResponse.files.map((f) => ({
          path: f.path,
          language: f.language,
          purpose: f.purpose,
        })),
        summary: validatedResponse.summary,
        aiProvider: 'gemini',
        generationDurationMs: durationMs,
        versions: [initialVersion],
        ownerId: userId,
        createdBy: userId,
      });

      pipeline.done('12', `Project saved: ${projectRecord.projectId}`);
      pipeline.complete(durationMs, filesWritten);
      onProgress({ stage: 'Complete', index: 8 });

      return {
        project: projectRecord,
        filesWritten,
        durationMs,
        diffs,
        summary: validatedResponse.summary,
        reviewWarnings: validatedResponse.reviewWarnings,
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      pipeline.fail(error, durationMs);

      // If the project record was partially created, mark it as failed
      if (projectRecord?.projectId) {
        await projectService
          .updateStatus(projectRecord.projectId, PROJECT_STATUS.FAILED)
          .catch((updateErr) => {
            logger.error(`[GenerationService] Failed to update project status: ${updateErr.message}`);
          });
      }

      // Re-throw AppErrors as-is (they are already structured and safe)
      if (error instanceof AppError) throw error;

      // Wrap unexpected errors
      throw new AppError(
        `Project generation failed: ${error.message}. Please try again.`,
        502
      );
    }
  }

  /**
   * Incrementally updates an existing project based on a chat message.
   * Reuses the full pipeline but with a chat-specific prompt.
   * Only files that changed are written to disk.
   *
   * @param {string} projectId - UUID of the project to update.
   * @param {string} userPrompt - The new chat message from the user.
   * @param {string} userId - Updating user ID.
   * @param {function} [onProgress] - Progress listener callback.
   * @returns {Promise<UpdateResult>}
   */
  async updateProject(projectId, userPrompt, userId, onProgress = () => {}) {
    const startTime = Date.now();
    logger.info(`[GenerationService] Starting incremental update for project: ${projectId}`);
    onProgress({ stage: 'Understanding Project', index: 1 });

    const existingProject = await projectService.getProjectById(projectId);
    if (!existingProject) {
      throw new AppError('Project not found.', 404);
    }

    // Safety: Verify uncommitted changes status map before edits
    const projectPath = existingProject.projectPath;
    const gitStatus = await gitService.status(projectPath);
    if (!gitStatus.clean) {
      throw new AppError('Your workspace contains uncommitted manual changes. Please commit or discard them before requesting AI edits.', 400);
    }

    try {
      // ── Impact Analysis (Stage 3) ──────────────────────────────────────────
      onProgress({ stage: 'Analyzing Existing Code', index: 2 });
      const existingFiles = existingProject.filesMeta.map((f) => f.path);
      
      onProgress({ stage: 'Planning Changes', index: 3 });
      const relevantFilesWithContent = await this._performImpactAnalysis(
        projectId,
        userPrompt,
        existingFiles
      );

      // Build context-aware incremental prompt
      const enrichedPrompt = promptBuilderService.buildChatPrompt(
        userPrompt,
        existingProject,
        existingFiles,
        relevantFilesWithContent
      );

      logger.info(`[GenerationService] Incremental prompt: ${enrichedPrompt.length} chars`);

      // Run AI generation with retry logic (Stage 4)
      onProgress({ stage: 'Generating Source Files', index: 4 });
      const { parsed: rawResponse, latencyMs } = await this._ai.generate(enrichedPrompt);
      logger.info(`[GenerationService] Incremental AI response in ${latencyMs}ms`);

      // Validate response (Stage 5)
      onProgress({ stage: 'Running Code Review Checks', index: 5 });
      const validatedResponse = responseParserService.validate(rawResponse, true);

      // Write only the changed files to the existing project folder (Stage 6)
      onProgress({ stage: 'Writing Workspace Files', index: 6 });
      const { filesWritten, diffs } = await projectWriterService.write(validatedResponse, projectId);
      logger.info(`[GenerationService] Incremental write: ${filesWritten} file(s) updated`);

      // Create Git Commit for AI modifications
      const commitMsg = `AI Update: ${validatedResponse.summary || 'modified files'}`;
      const commitHash = await gitService.commit(projectPath, commitMsg);

      // Merge file metadata (new files added, existing updated, unchanged preserved, deleted removed)
      const deletedPaths = new Set(diffs.deleted);
      const newFilePaths = new Set(validatedResponse.files.filter(f => !f.deleted).map((f) => f.path));
      
      const mergedMeta = [
        // Keep files that were not overwritten by new generation and not deleted
        ...existingProject.filesMeta.filter((f) => !newFilePaths.has(f.path) && !deletedPaths.has(f.path)),
        // Add newly generated/modified files (filtering out deleted ones)
        ...validatedResponse.files.filter(f => !f.deleted).map((f) => ({
          path: f.path,
          language: f.language,
          purpose: f.purpose,
        })),
      ];

      // Merge folders
      const currentFolders = new Set(existingProject.folderTree || []);
      if (Array.isArray(validatedResponse.folderTree)) {
        validatedResponse.folderTree.forEach(f => currentFolders.add(f));
      }

      // Add to snapshot version list (Stage 7)
      onProgress({ stage: 'Saving Version History', index: 7 });
      
      const newVersionNum = (existingProject.versions?.length || 0) + 1;
      const nextVersion = {
        versionNumber: newVersionNum,
        prompt: userPrompt,
        timestamp: new Date(),
        modifiedFiles: [
          ...diffs.added,
          ...diffs.modified,
          ...diffs.deleted
        ],
        summary: validatedResponse.summary || existingProject.summary,
        commitHash,
      };

      await projectService.updateProjectMeta(projectId, {
        filesMeta: mergedMeta,
        folderTree: Array.from(currentFolders),
        summary: validatedResponse.summary || existingProject.summary,
        status: PROJECT_STATUS.COMPLETE,
        updatedBy: userId,
        $push: { versions: nextVersion }
      });

      const durationMs = Date.now() - startTime;
      logger.info(`[GenerationService] Incremental update complete in ${durationMs}ms. Files: ${filesWritten}`);
      onProgress({ stage: 'Complete', index: 8 });

      return {
        project: await projectService.getProjectById(projectId),
        filesWritten,
        durationMs,
        diffs,
        summary: validatedResponse.summary,
        reviewWarnings: validatedResponse.reviewWarnings,
      };

    } catch (error) {
      logger.error(`[GenerationService] Incremental update failed: ${error.message}`);

      // Mark project as failed
      await projectService
        .updateStatus(projectId, PROJECT_STATUS.FAILED)
        .catch(() => {});

      if (error instanceof AppError) throw error;
      throw new AppError(
        `Project update failed: ${error.message}. Please try again.`,
        502
      );
    }
  }

  /**
   * Scans prompt and project tree to select and load relevant file content context.
   */
  async _performImpactAnalysis(projectId, userPrompt, existingFiles) {
    const relevantPaths = new Set();
    const promptLower = userPrompt.toLowerCase();

    // 1. Always include core layout and routing configuration files for context if they exist
    const coreStructurePatterns = [
      /app\.jsx$/i,
      /main\.jsx$/i,
      /server\.js$/i,
      /routes\/index\.js$/i,
      /routes\/auth\.routes\.js$/i,
      /controllers\/auth\.controller\.js$/i,
      /models\/User\.js$/i,
    ];

    existingFiles.forEach(filepath => {
      const isCore = coreStructurePatterns.some(regex => regex.test(filepath));
      if (isCore) {
        relevantPaths.add(filepath);
        return;
      }

      // 2. Keyword heuristic mapping: if query references path base name words
      const filename = filepath.split('/').pop().toLowerCase().split('.')[0];
      const filenameWords = filename.split(/[-_]/);
      const isRelevant = filenameWords.some(word => word.length > 2 && promptLower.includes(word));
      if (isRelevant) {
        relevantPaths.add(filepath);
      }
    });

    // 3. Load contents for the final set of resolved relevant files
    const { readFileAsync } = require('../utils/fileHelpers');
    const { getProjectFolderPath } = require('../utils/pathHelpers');
    
    const projectPath = getProjectFolderPath(projectId);
    const loadedFiles = [];

    for (const relPath of relevantPaths) {
      try {
        const absPath = path.resolve(projectPath, relPath);
        const content = await readFileAsync(absPath);
        const { getLanguageFromPath } = require('../utils/pathHelpers');
        loadedFiles.push({
          path: relPath,
          content,
          language: getLanguageFromPath(relPath)
        });
      } catch (err) {
        logger.warn(`[GenerationService] Impact analysis failed to load file content: ${relPath}`);
      }
    }

    return loadedFiles;
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Creates a structured pipeline logger for readable stage tracking.
   */
  _createPipelineLogger(operation) {
    return {
      start: () => {
        logger.info(`[GenerationService] ════════════════════════════════`);
        logger.info(`[GenerationService] Pipeline START: ${operation}`);
        logger.info(`[GenerationService] ════════════════════════════════`);
      },
      stage: (num, desc) => {
        logger.info(`[GenerationService] ── Stage ${num}: ${desc}`);
      },
      done: (num, detail) => {
        logger.info(`[GenerationService] ✓ Stage ${num} complete. ${detail}`);
      },
      complete: (durationMs, filesWritten) => {
        logger.info(`[GenerationService] ════════════════════════════════`);
        logger.info(`[GenerationService] Pipeline COMPLETE in ${durationMs}ms. Files: ${filesWritten}`);
        logger.info(`[GenerationService] ════════════════════════════════`);
      },
      fail: (error, durationMs) => {
        logger.error(`[GenerationService] ════════════════════════════════`);
        logger.error(`[GenerationService] Pipeline FAILED after ${durationMs}ms`);
        logger.error(`[GenerationService] Error: ${error.message}`);
        logger.error(`[GenerationService] ════════════════════════════════`);
      },
    };
  }
}

// Inject GeminiProvider as the concrete AIProvider implementation.
module.exports = new GenerationService(new GeminiProvider());
