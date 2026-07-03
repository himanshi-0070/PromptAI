# Changelog — PromptAI Workspace

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-07-01
### Added
- **AI Workspace**: Released the core generative workspace utilizing Google Gemini to bootstrap full-stack React projects based on natural language intents.
- **Incremental Editor**: Integrated an intelligent conversational update engine to map user requests to precise codebase diffs.
- **Git Version Control**: Backed every AI edit and manual `Ctrl+S` checkpoint with local `simple-git` repositories automatically mounted into MongoDB histories.
- **Live Preview Environment**: Embedded the `@webcontainer/api` SDK for secure in-browser execution, module bundling, and live server previews.
- **OAuth Multi-Tenancy**: Added Google OAuth Dual-Token Authentication separating public sandboxes from persistent authenticated workspaces.
- **Security Checkpoints**: Embedded `helmet`, `compression`, and `express-rate-limit` layers to harden the Express API backend.
- **Global Error Handling**: Added a robust centralized API error wrapper logging unhandled runtime errors cleanly.
- **Downloads & Checkouts**: Provided `.zip` workspace downloads and localized timeline rollbacks to previous Git commits.

### Fixed
- Stabilized massive API payload sizes by aggressively slicing context lengths before triggering Gemini prompts.
- Remediated React rendering lifecycle bugs via exhaustive dependency arrays patches.
- Fixed infinite loader loops inside the Project Explorer by isolating network exception fallbacks.

### Removed
- Deprecated temporary debugging logs, scratch folders, and non-optimized file IO utilities for production releases.
