'use strict';

/**
 * Abstract AI Provider Interface.
 * All AI providers must implement these methods.
 * GenerationService depends on this interface, not on any concrete provider.
 *
 * To add a new provider:
 *   1. Create a new class that extends AIProvider.
 *   2. Implement generate() and healthCheck().
 *   3. Register it in the provider factory.
 */
class AIProvider {
  /**
   * Sends an enriched prompt to the AI and returns structured JSON output.
   * @param {string} prompt - The fully constructed prompt from PromptBuilderService.
   * @returns {Promise<object>} - Parsed project specification JSON.
   */
  // eslint-disable-next-line no-unused-vars
  async generate(prompt) {
    throw new Error('AIProvider.generate() must be implemented by a subclass.');
  }

  /**
   * Verifies that the AI provider is reachable and authenticated.
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    throw new Error('AIProvider.healthCheck() must be implemented by a subclass.');
  }
}

module.exports = AIProvider;
