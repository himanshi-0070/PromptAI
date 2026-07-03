'use strict';

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const AIProvider = require('./AIProvider');
const { env } = require('../../config/env');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Non-Retryable Error Codes
// These indicate a problem with the request itself, not a transient issue.
// Retrying them wastes quota and time.
// ─────────────────────────────────────────────────────────────────────────────
const NON_RETRYABLE_PATTERNS = [
  'API_KEY_INVALID',
  'PERMISSION_DENIED',
  'INVALID_ARGUMENT',
  'RESOURCE_EXHAUSTED',
  'SAFETY',           // Safety filter triggered — retrying won't help
  '400',              // Bad request
  '401',              // Unauthorized
  '403',              // Forbidden
];

// ─────────────────────────────────────────────────────────────────────────────
// Exponential Backoff Configuration
// ─────────────────────────────────────────────────────────────────────────────
const BASE_DELAY_MS = 1500;     // First retry delay
const MAX_DELAY_MS = 30000;     // Cap to avoid indefinite waiting
const JITTER_FACTOR = 0.2;      // ±20% randomization to avoid thundering herd

/**
 * GeminiProvider — Concrete implementation of AIProvider using Google Gemini.
 *
 * This is the ONLY file that imports or uses @google/generative-ai.
 * GenerationService depends only on the AIProvider interface.
 *
 * Responsibilities:
 *   - Authenticate with the Gemini API using the configured API key
 *   - Send fully-constructed prompts to the Gemini model
 *   - Parse structured JSON from the response
 *   - Handle transient failures with exponential backoff + jitter
 *   - Translate Gemini-specific errors into AppErrors
 *   - Never leak Gemini SDK types outside this file
 */
class GeminiProvider extends AIProvider {
  constructor() {
    super();

    if (!env.GEMINI_API_KEY) {
      throw new AppError('GEMINI_API_KEY is not configured. Cannot initialize AI provider.', 500);
    }

    this._client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    // Primary generation model — JSON mode ensures clean structured output
    this._model = this._client.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: {
        temperature: 0.2,         // Low temperature = deterministic, consistent code
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 65536,   // Maximized for large full-stack projects
        responseMimeType: 'application/json',
      },
      safetySettings: [
        // Relax safety filters for code generation (code can contain "harmful" patterns like SQL injection examples)
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    });

    logger.info(`[GeminiProvider] Initialized with model: ${env.GEMINI_MODEL}`);
  }

  // ── Public API (AIProvider Interface) ──────────────────────────────────────

  /**
   * Sends an enriched prompt to Gemini and returns the parsed JSON response.
   * Implements exponential backoff with jitter for transient failures.
   *
   * @param {string} prompt - Fully-constructed prompt from PromptBuilderService.
   * @returns {Promise<{ parsed: object, latencyMs: number }>}
   * @throws {AppError} If all retries are exhausted or a non-retryable error occurs.
   */
  async generate(prompt) {
    const maxRetries = env.MAX_RETRY_ATTEMPTS;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`[GeminiProvider] Generation attempt ${attempt}/${maxRetries}...`);
        const startTime = Date.now();

        const result = await this._model.generateContent(prompt);
        const response = result.response;

        // Check for blocked response (safety filters)
        if (!response || !response.candidates || response.candidates.length === 0) {
          throw new AppError(
            'Gemini returned no candidates. The prompt may have triggered a safety filter. ' +
            'Please rephrase your request.',
            422
          );
        }

        const candidate = response.candidates[0];

        // Check finish reason — SAFETY means the content was blocked
        if (candidate.finishReason === 'SAFETY') {
          throw new AppError(
            'Response blocked by Gemini safety filters. Please rephrase your request.',
            422
          );
        }

        const text = response.text();
        const latencyMs = Date.now() - startTime;

        logger.info(`[GeminiProvider] Response received in ${latencyMs}ms (${text.length} chars)`);

        const parsed = this._extractJSON(text);

        return { parsed, latencyMs };

      } catch (error) {
        lastError = error;

        // Don't retry non-retryable errors
        if (this._isNonRetryable(error)) {
          logger.error(`[GeminiProvider] Non-retryable error: ${error.message}`);
          if (error instanceof AppError) throw error;
          throw new AppError(
            `AI provider error: ${error.message}`,
            error.message.includes('API_KEY') ? 401 : 502
          );
        }

        logger.warn(`[GeminiProvider] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

        if (attempt < maxRetries) {
          const delay = this._calculateDelay(attempt);
          logger.info(`[GeminiProvider] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await this._sleep(delay);
        }
      }
    }

    logger.error(`[GeminiProvider] All ${maxRetries} attempts exhausted.`);
    throw new AppError(
      `AI generation failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}. ` +
      'Please try again.',
      502
    );
  }

  /**
   * Verifies that the Gemini API is reachable and the API key is valid.
   * Used by the health check endpoint.
   * Does NOT generate any content.
   *
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      // Minimal generation to verify connectivity — uses a tiny prompt
      const result = await this._model.generateContent(
        'Return exactly this JSON: {"status":"ok"}'
      );
      const text = result.response.text();
      return text.includes('ok');
    } catch (error) {
      logger.warn(`[GeminiProvider] Health check failed: ${error.message}`);
      return false;
    }
  }

  // ── JSON Extraction ────────────────────────────────────────────────────────

  /**
   * Extracts a valid JSON object from the AI response text.
   * Handles edge cases where the model returns markdown fences, leading text,
   * or other non-JSON content despite being instructed not to.
   *
   * @param {string} text - Raw response text from Gemini.
   * @returns {object} Parsed JSON object.
   * @throws {AppError} If no valid JSON can be extracted.
   */
  _extractJSON(text) {
    let cleaned = text.trim();

    // Strategy 1: Direct parse (most responses in JSON mode are clean)
    try {
      return JSON.parse(cleaned);
    } catch (_) { /* fall through to cleanup strategies */ }

    // Strategy 2: Strip markdown code fences (```json ... ``` or ``` ... ```)
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (_) { /* fall through */ }

    // Strategy 3: Find the first { and last } to extract JSON block
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(extracted);
      } catch (_) { /* fall through */ }
    }

    // Strategy 4: Attempt to fix common JSON issues (trailing commas, single quotes)
    try {
      // Remove trailing commas before ] or }
      const fixed = cleaned
        .replace(/,\s*([\]}])/g, '$1')  // trailing commas
        .replace(/'/g, '"');             // single quotes → double quotes
      return JSON.parse(fixed);
    } catch (_) { /* fall through */ }

    // All strategies failed
    logger.error(`[GeminiProvider] JSON extraction failed. Response preview: ${text.slice(0, 500)}`);
    throw new AppError(
      'AI response could not be parsed as JSON. The model may have returned an unexpected format. ' +
      'Please try again.',
      502
    );
  }

  // ── Retry Utilities ────────────────────────────────────────────────────────

  /**
   * Determines if an error should NOT be retried.
   * Non-retryable errors are configuration or content issues that won't
   * resolve themselves with additional attempts.
   *
   * @param {Error} error
   * @returns {boolean}
   */
  _isNonRetryable(error) {
    if (error instanceof AppError && error.statusCode === 422) return true;
    const msg = (error.message || '').toUpperCase();
    return NON_RETRYABLE_PATTERNS.some((pattern) => msg.includes(pattern));
  }

  /**
   * Calculates exponential backoff delay with jitter.
   * Formula: BASE_DELAY * 2^(attempt-1) * (1 ± JITTER_FACTOR), capped at MAX_DELAY
   *
   * @param {number} attempt - Current attempt number (1-indexed).
   * @returns {number} Delay in milliseconds.
   */
  _calculateDelay(attempt) {
    const exponential = BASE_DELAY_MS * Math.pow(2, attempt - 1);
    const jitter = exponential * JITTER_FACTOR * (Math.random() * 2 - 1);
    return Math.min(Math.round(exponential + jitter), MAX_DELAY_MS);
  }

  /**
   * Returns a Promise that resolves after the specified milliseconds.
   * @param {number} ms
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = GeminiProvider;
