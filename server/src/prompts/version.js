/**
 * Prompt Version Tracking
 *
 * This file tracks the version of all prompts used in documentation generation.
 * Increment the version when making significant changes to prompt structure or content.
 *
 * Version History:
 * - v1.0.0 (2025-11-19): Initial extraction from inline code to external files
 * - v1.0.1 (2025-11-19): Fixed README prompt to exclude Contributing/License sections
 * - v1.1.0 (2025-11-19): Added per-doc-type LLM provider/model configuration
 * - v1.2.0 (2025-11-19): Added OPENAPI doc type with OpenAI GPT-5.1
 */

export const PROMPT_VERSION = 'v1.2.0';

/**
 * Get prompt metadata for a specific doc type
 * @param {string} docType - Type of documentation (README, JSDOC, API, ARCHITECTURE, OPENAPI)
 * @returns {Object} Metadata about the prompt
 */
export function getPromptMetadata(docType) {
  return {
    version: PROMPT_VERSION,
    docType,
    extractedAt: '2025-11-19',
    format: 'markdown',
    cachingEnabled: true
  };
}
