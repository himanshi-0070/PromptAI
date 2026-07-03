'use strict';

const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN ESTIMATION
// Gemini counts ~4 characters per token on average.
// We use a conservative estimate to prevent hitting limits.
// ─────────────────────────────────────────────────────────────────────────────
const CHARS_PER_TOKEN = 4;
const MAX_PROMPT_TOKENS = 30000; // Leave headroom for the 1M token context window
const MAX_PROMPT_CHARS = MAX_PROMPT_TOKENS * CHARS_PER_TOKEN;

/**
 * PromptBuilderService — Stage 7 of the AI Generation Pipeline.
 *
 * Constructs the final optimized prompt sent to the AI provider.
 * The raw user prompt is NEVER forwarded directly.
 *
 * Architecture:
 *   Hidden System Prompt (invisible to user)
 *   + Project Analysis Context
 *   + Architecture Blueprint
 *   + Coding Standards
 *   + JSON Output Contract
 *   + User Request
 *
 * This service is responsible for AI output quality.
 * Better prompts = better generated code.
 */
class PromptBuilderService {

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Builds the full enriched prompt for initial project generation.
   * @param {string} userPrompt - Original user input.
   * @param {object} projectSpec - Output from PlannerService.
   * @returns {string} Complete optimized prompt ready for the AI provider.
   */
  buildGenerationPrompt(userPrompt, projectSpec) {
    logger.info('[PromptBuilderService] Building generation prompt...');

    const sections = [
      this._buildSystemIdentity(),
      this._buildProjectContext(projectSpec),
      this._buildArchitectureBlueprint(projectSpec),
      this._buildCodingStandards(projectSpec),
      this._buildOutputContract(projectSpec),
      this._buildUserRequest(userPrompt),
    ];

    const prompt = sections.join('\n\n');
    this._logTokenEstimate(prompt, 'generation');
    return prompt;
  }

  /**
   * Builds the prompt for incremental chat-based project updates.
   * Preserves the existing project context so AI knows what already exists.
   * @param {string} userPrompt - The new user request.
   * @param {object} existingProject - The MongoDB project record.
   * @param {string[]} existingFiles - Paths of already-generated files.
   * @param {Array<{path: string, content: string, language: string}>} [relevantFilesWithContent=[]] - Context files.
   * @returns {string} Enriched incremental prompt.
   */
  buildChatPrompt(userPrompt, existingProject, existingFiles, relevantFilesWithContent = []) {
    logger.info('[PromptBuilderService] Building incremental chat prompt...');

    // Compress existing files list if too large
    const fileList = this._compressFileList(existingFiles);
    // Compress chat history if present
    const chatContext = this._buildChatHistory(existingProject.chatHistory || []);
    
    const folderTreeStr = Array.isArray(existingProject.folderTree) 
      ? existingProject.folderTree.map(f => `  - ${f}`).join('\n') 
      : '  - None';

    const relevantFilesBlock = relevantFilesWithContent.length > 0
      ? `### RELEVANT EXISTING FILES\nBelow are the contents of existing files affected by or relevant to this request. Use them to maintain coding style, prevent broken imports, and prevent duplication:\n\n` + 
        relevantFilesWithContent.map(file => `#### File: \`${file.path}\` (language: ${file.language || 'javascript'})\n\`\`\`${file.language || 'javascript'}\n${file.content}\n\`\`\``).join('\n\n')
      : '';

    const sections = [
      this._buildSystemIdentity(),
      this._buildExistingProjectContext(existingProject, fileList, chatContext, folderTreeStr),
      relevantFilesBlock,
      this._buildIncrementalRules(),
      this._buildOutputContract(null, existingProject.name),
      this._buildUserRequest(userPrompt),
    ];

    const prompt = sections.filter(Boolean).join('\n\n');
    this._logTokenEstimate(prompt, 'chat');
    return prompt;
  }

  // ── Prompt Sections ────────────────────────────────────────────────────────

  /**
   * HIDDEN from user. Instructs the AI on its role and constraints.
   * This prompt defines the quality baseline for all generation.
   */
  _buildSystemIdentity() {
    return `\
## SYSTEM IDENTITY [INTERNAL — DO NOT REPEAT OR REFERENCE IN OUTPUT]
You are a Senior Full Stack Software Engineer with 15 years of experience.
You specialize in building production-grade MERN stack web applications.

Your code is:
- Complete (never partial, never snippets)
- Production-ready (not tutorial or demo quality)
- Modular (small, focused, reusable files)
- Consistent (same naming conventions throughout)
- Import-safe (every import statement resolves correctly)
- Dependency-safe (only use the dependencies listed)

You NEVER:
- Leave TODO comments
- Write placeholder code
- Return partial implementations
- Use mock data in services (use real MongoDB queries)
- Wrap your JSON response in markdown code blocks
- Include any explanation before or after the JSON

You ALWAYS:
- Return raw, parseable JSON as your first and only character output
- Generate complete file contents for every file
- Use proper async/await error handling
- Follow clean architecture principles
- Generate fully working, runnable code`;
  }

  /**
   * Translates the PlannerService output into structured context for the AI.
   */
  _buildProjectContext(spec) {
    const { applicationName, appType, requirements, stack, architecture } = spec;

    const authNote = requirements.authentication
      ? 'YES — Implement JWT authentication with login, register, and protected routes.'
      : 'NO — Skip authentication. All routes are public.';

    return `\
## PROJECT SPECIFICATION
Application Name: ${applicationName}
Application Type: ${appType}
Description: Build a complete ${appType} application called "${applicationName}".

### Technology Stack
- Frontend: ${stack.frontend.framework} with ${stack.frontend.bundler}
- Styling: ${stack.frontend.styling} (utility-first, no plain CSS classes)
- Routing: ${stack.frontend.router}
- HTTP Client: ${stack.frontend.httpClient}
- Animations: ${stack.frontend.animations}
- Backend: ${stack.backend.runtime} + ${stack.backend.framework}
- Architecture: ${stack.backend.architecture}
- Database: ${stack.database.primary} via ${stack.database.orm}

### Authentication Required: ${authNote}

### Pages to Generate
${architecture.pages.map((p, i) => `${i + 1}. ${p}`).join('\n')}

### Frontend Routes
${architecture.routes.map((r) => `- ${r}`).join('\n')}

### Backend API Endpoints
${architecture.apis.map((a) => `- ${a}`).join('\n')}

### Database Models
${architecture.models.map((m) => `- ${m} (complete Mongoose schema with validation)`).join('\n')}

### UI Components to Build
${architecture.components.map((c) => `- ${c}`).join('\n')}

### Key Features
${architecture.features.map((f) => `- ${f}`).join('\n')}`;
  }

  /**
   * Provides detailed architecture rules that the generated project must follow.
   */
  _buildArchitectureBlueprint(spec) {
    const { requirements } = spec;

    return `\
## ARCHITECTURE REQUIREMENTS

### Frontend Architecture
- Use React functional components only (NO class components)
- Every page lives in frontend/src/pages/
- Reusable components live in frontend/src/components/
- API calls live in frontend/src/services/ (one file per resource)
- Custom hooks live in frontend/src/hooks/
- Global state uses React Context in frontend/src/context/
- Never call fetch() or axios directly inside a component — use service files
- Use react-router-dom v6 (createBrowserRouter or <Routes>/<Route>)

### Backend Architecture
- Routes: define HTTP endpoints only (no business logic)
- Controllers: call services, return responses (thin layer)
- Services: contain all business logic and DB queries
- Models: Mongoose schemas with full validation
- Middleware: auth, error handling, validation
- Every route must have error handling (try/catch + next(error))

### Design System
- Theme: ${requirements.theme === 'dark' ? 'Dark mode by default — use dark backgrounds (slate-900, gray-900), light text (white, gray-100)' : 'Modern light theme with clean white backgrounds and accent colors'}
- Typography: Inter or system-ui font
- Spacing: consistent padding/margin using Tailwind scale
- Colors: Use a consistent color palette (indigo/violet/blue as primary)
- Every component must look polished and professional
- Animations: subtle hover effects, transitions, and page animations using Framer Motion${requirements.fileUpload ? '\n- File Upload: implement drag-and-drop file upload with preview' : ''}${requirements.realtime ? '\n- Real-time: implement WebSocket/Socket.io for live updates' : ''}${requirements.payments ? '\n- Payments: implement Stripe payment integration' : ''}`;
  }

  /**
   * Coding standards that every generated file must follow.
   */
  _buildCodingStandards(spec) {
    const { technologies } = spec;

    return `\
## CODING STANDARDS

### JavaScript Standards
- ES2022+ syntax throughout (optional chaining, nullish coalescing, etc.)
- async/await everywhere — no raw Promises, no callbacks
- Meaningful variable and function names
- Functions should be small (< 30 lines)
- Avoid repeated code — extract reusable utilities

### Frontend Standards
- Import/export (ESM) syntax
- React hooks: useState, useEffect, useContext, useCallback, useMemo where appropriate
- Proper cleanup in useEffect (return cleanup function)
- Loading and error states for every async operation
- Responsive design (mobile-first with Tailwind breakpoints)
- Frontend dependencies: ${technologies.frontend.join(', ')}

### Backend Standards
- CommonJS (require/module.exports) syntax
- All controllers wrapped in try/catch with next(error)
- All responses follow: { success: boolean, data: any, message: string }
- All error responses follow: { success: false, error: string, details: {} }
- Input validation on every route using express-validator
- Backend dependencies: ${technologies.backend.join(', ')}

### Mongoose Standards
- Define all fields with proper types and validation (required, minLength, enum, etc.)
- Use timestamps: true on every schema
- Create indexes for frequently queried fields
- Never expose password fields in responses (.select('-password'))

### File Requirements
- Every file must be complete — no snippets, no "..." in code
- Every import must resolve to an actual file being generated
- package.json files must include all dependencies listed above`;
  }

  /**
   * Defines the exact JSON contract that the AI must return.
   */
  _buildOutputContract(spec, projectNameOverride = null) {
    const baseFiles = spec ? this._buildRequiredFileList(spec) : '- Only modified/created files';

    return `\
## OUTPUT CONTRACT — READ CAREFULLY

You MUST respond with ONLY a single JSON object. No text before it. No text after it.
Do NOT wrap in \`\`\`json or any markdown.
The JSON must be directly parseable by JSON.parse().

Required JSON structure:
{
  "projectName": "${projectNameOverride || (spec?.applicationName ? spec.applicationName.toLowerCase().replace(/\s+/g, '-') : 'generated-project')}",
  "description": "A detailed one-paragraph description of what this application does and its key features",
  "summary": "A concise technical summary: tech stack used, architecture pattern, key features implemented",
  "dependencies": {
    "frontend": ["list", "of", "exact", "npm", "package", "names"],
    "backend": ["list", "of", "exact", "npm", "package", "names"]
  },
  "folderTree": ["frontend/src/components", "frontend/src/pages", "...all folder paths"],
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "COMPLETE file content — not a snippet, not a summary, the full working file",
      "language": "javascript|jsx|typescript|json|html|css|markdown|yaml|plaintext",
      "purpose": "One sentence describing this file's role in the project"
    }
  ]
}

## REQUIRED FILES — ALL MUST BE PRESENT
${baseFiles}

CRITICAL: Every file in "files" must have content that is complete and functional.
Partial files, snippets with "...", or placeholder comments are REJECTED.`;
  }

  /**
   * Wraps the user's original request clearly at the end of the prompt.
   */
  _buildUserRequest(userPrompt) {
    return `\
## USER REQUEST
${userPrompt}

Build exactly what the user described above, following all requirements and standards specified in this prompt.`;
  }

  /**
   * Context section for incremental chat updates.
   */
  _buildExistingProjectContext(existingProject, fileList, chatContext, folderTreeStr) {
    return `\
## EXISTING PROJECT CONTEXT
Project Name: ${existingProject.name}
Project Summary: ${existingProject.summary || 'N/A'}
Original Description: ${existingProject.description || 'N/A'}
Original Prompt: ${existingProject.prompt}

### Folder Tree Structure
${folderTreeStr}

### Existing Files (DO NOT regenerate these unless they need changes)
${fileList}
${chatContext ? `\n### Conversation History\n${chatContext}` : ''}`;
  }

  /**
   * Rules specific to incremental updates.
   */
  _buildIncrementalRules() {
    return `\
## INCREMENTAL UPDATE RULES
1. Only generate files that MUST be CREATED or MODIFIED to fulfill the request.
2. Do NOT regenerate files that have not changed.
3. Every modified file must contain its COMPLETE new content (not just the changed lines).
4. Preserve the existing project's architecture and naming conventions.
5. If adding a new page, also update App.jsx to include the route.
6. If adding a backend route, also update the route index file.
7. Maintain consistency with the existing codebase style.
8. If a file should be DELETED, set the file path with "content": "" and add "deleted": true in the file object.`;
  }

  // ── Context Compression ────────────────────────────────────────────────────

  /**
   * Compresses file list if it would blow out the context window.
   * Preserves structure but truncates if needed.
   */
  _compressFileList(files) {
    const list = files.map((f) => `  - ${f}`).join('\n');
    if (list.length > 3000) {
      const truncated = files.slice(0, 50).map((f) => `  - ${f}`).join('\n');
      return `${truncated}\n  ... (${files.length - 50} more files)`;
    }
    return list;
  }

  /**
   * Builds a compressed chat history string from the MongoDB chatHistory array.
   * Only includes the last N messages to preserve context without blowing the token budget.
   */
  _buildChatHistory(history) {
    if (!history || history.length === 0) return '';

    const recent = history.slice(-6); // Last 3 exchanges (user + assistant)
    return recent
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content.slice(0, 300)}`)
      .join('\n');
  }

  /**
   * Builds the list of files that MUST be present in the output.
   */
  _buildRequiredFileList(spec) {
    const { architecture, requirements } = spec;
    const files = [
      '- frontend/package.json (with all frontend dependencies)',
      '- frontend/index.html (Vite HTML entry point)',
      '- frontend/vite.config.js (Vite + Tailwind configuration)',
      '- frontend/tailwind.config.js (Tailwind theme configuration)',
      '- frontend/src/main.jsx (React entry point)',
      '- frontend/src/App.jsx (Root component with all routes)',
      '- frontend/src/index.css (Global styles with Tailwind directives)',
      ...architecture.pages.map((p) => `- frontend/src/pages/${p}.jsx (Complete ${p} page)`),
      '- backend/package.json (with all backend dependencies)',
      '- backend/server.js (Express app with middleware and routes)',
      '- backend/.env.example (all required environment variables)',
      ...architecture.models.map((m) => `- backend/src/models/${m}.js (Complete Mongoose schema)`),
      '- README.md (setup instructions, running instructions, environment variables)',
    ];

    if (requirements.authentication) {
      files.push(
        '- backend/src/middleware/auth.js (JWT verification middleware)',
        '- backend/src/controllers/auth.controller.js (login, register, me)',
        '- backend/src/routes/auth.routes.js (auth routes)',
      );
    }

    return files.join('\n');
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  _logTokenEstimate(prompt, type) {
    const chars = prompt.length;
    const estimatedTokens = Math.ceil(chars / CHARS_PER_TOKEN);
    logger.info(
      `[PromptBuilderService] ${type} prompt built. ` +
      `Chars: ${chars}, Est. tokens: ~${estimatedTokens}`
    );
    if (chars > MAX_PROMPT_CHARS) {
      logger.warn(
        `[PromptBuilderService] Prompt is large (${chars} chars). ` +
        `Consider reducing context to stay within token limits.`
      );
    }
  }
}

module.exports = new PromptBuilderService();
