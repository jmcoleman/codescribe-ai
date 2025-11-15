/**
 * Unified LLM Service
 * Routes requests to the appropriate provider (Claude or OpenAI) based on configuration
 *
 * Usage:
 *   const llmService = new LLMService()
 *   const result = await llmService.generate('Write a README')
 *   console.log(result.text, result.metadata)
 */

import { getLLMConfig, logConfig } from '../../config/llm.config.js';
import { generateWithClaude, streamWithClaude } from './providers/claude.js';
import { generateWithOpenAI, streamWithOpenAI } from './providers/openai.js';

class LLMService {
  constructor() {
    // Load configuration on instantiation
    this.config = getLLMConfig()

    // Log configuration in development
    if (process.env.NODE_ENV !== 'production') {
      logConfig()
    }
  }

  /**
   * Generate text from a prompt (non-streaming)
   *
   * @param {string} prompt - User prompt/message
   * @param {Object} options - Generation options
   * @param {string} [options.systemPrompt] - System instructions
   * @param {boolean} [options.enableCaching=false] - Enable prompt caching (only works with Claude)
   * @param {number} [options.maxTokens] - Override max tokens
   * @param {number} [options.temperature] - Sampling temperature (0-1)
   * @param {number} [options.topP] - Nucleus sampling parameter (0-1)
   * @returns {Promise<{text: string, metadata: Object}>}
   * @throws {Error} On API errors or invalid configuration
   *
   * @example
   * const result = await llmService.generate('Explain quantum computing', {
   *   systemPrompt: 'You are a helpful assistant.',
   *   enableCaching: true
   * })
   * console.log(result.text)
   * console.log(result.metadata) // { provider, model, inputTokens, outputTokens, ... }
   */
  async generate(prompt, options = {}) {
    const { provider } = this.config

    switch (provider) {
      case 'claude':
        return await generateWithClaude(prompt, options, this.config)

      case 'openai':
        return await generateWithOpenAI(prompt, options, this.config)

      default:
        throw new Error(
          `Unsupported LLM provider: ${provider}. ` +
          `Supported providers: claude, openai`
        )
    }
  }

  /**
   * Generate text with real-time streaming
   *
   * @param {string} prompt - User prompt/message
   * @param {Function} onChunk - Callback for each text chunk: (chunk: string) => void
   * @param {Object} options - Generation options (same as generate())
   * @returns {Promise<{text: string, metadata: Object}>} - Full text and metadata after streaming completes
   * @throws {Error} On API errors or invalid configuration
   *
   * @example
   * const result = await llmService.generateWithStreaming(
   *   'Write a story',
   *   (chunk) => process.stdout.write(chunk),
   *   { systemPrompt: 'You are a creative writer.' }
   * )
   * console.log('\nDone! Total tokens:', result.metadata.outputTokens)
   */
  async generateWithStreaming(prompt, onChunk, options = {}) {
    const { provider } = this.config

    // Validate onChunk callback
    if (typeof onChunk !== 'function') {
      throw new Error('onChunk must be a function that receives text chunks')
    }

    switch (provider) {
      case 'claude':
        return await streamWithClaude(prompt, onChunk, options, this.config)

      case 'openai':
        return await streamWithOpenAI(prompt, onChunk, options, this.config)

      default:
        throw new Error(
          `Unsupported LLM provider: ${provider}. ` +
          `Supported providers: claude, openai`
        )
    }
  }

  /**
   * Get current provider name
   * @returns {string} Provider name ('claude' or 'openai')
   */
  getProvider() {
    return this.config.provider
  }

  /**
   * Get current model identifier
   * @returns {string} Model name (e.g., 'claude-sonnet-4-5-20250929', 'gpt-5.1')
   */
  getModel() {
    return this.config.model
  }

  /**
   * Check if current provider supports prompt caching
   * @returns {boolean}
   */
  supportsCaching() {
    return this.config.supportsCaching
  }

  /**
   * Check if current provider supports streaming
   * @returns {boolean}
   */
  supportsStreaming() {
    return this.config.supportsStreaming
  }

  /**
   * Get provider capabilities
   * @returns {Object} Capabilities object
   */
  getCapabilities() {
    return {
      provider: this.config.provider,
      model: this.config.model,
      supportsCaching: this.config.supportsCaching,
      supportsStreaming: this.config.supportsStreaming
    }
  }
}

export default LLMService;
