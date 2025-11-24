/**
 * Unified LLM Service
 * Routes requests to the appropriate provider (Claude, OpenAI, or Gemini) based on configuration
 *
 * Usage:
 *   const llmService = new LLMService()
 *   const result = await llmService.generate('Write a README')
 *   console.log(result.text, result.metadata)
 */

import { getLLMConfig, logConfig } from '../../config/llm.config.js';
import { generateWithClaude, streamWithClaude } from './providers/claude.js';
import { generateWithOpenAI, streamWithOpenAI } from './providers/openai.js';
import { generateWithGemini, streamWithGemini } from './providers/gemini.js';

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
   * @param {string} [options.provider] - Override provider ('claude' | 'openai' | 'gemini')
   * @param {string} [options.model] - Override model (e.g., 'gpt-5.1', 'claude-sonnet-4-5-20250929', 'gemini-2.0-flash-exp')
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
    // Allow per-request provider override, fall back to default config
    const provider = options.provider || this.config.provider;

    // Debug logging for provider selection
    console.log(`[LLMService] Provider selected: ${provider} (options.provider: ${options.provider}, default: ${this.config.provider})`);
    console.log(`[LLMService] Model: ${options.model || 'default'}`);

    // Build config with overrides
    const requestConfig = this._buildRequestConfig(provider, options);

    switch (provider) {
      case 'claude':
        return await generateWithClaude(prompt, options, requestConfig)

      case 'openai':
        return await generateWithOpenAI(prompt, options, requestConfig)

      case 'gemini':
        return await generateWithGemini(prompt, options, requestConfig)

      default:
        throw new Error(
          `Unsupported LLM provider: ${provider}. ` +
          `Supported providers: claude, openai, gemini`
        )
    }
  }

  /**
   * Build request configuration with overrides
   * @private
   * @param {string} provider - Provider name
   * @param {Object} options - Request options that may contain overrides
   * @returns {Object} Merged configuration
   */
  _buildRequestConfig(provider, options) {
    const baseConfig = { ...this.config };

    // Validate provider exists BEFORE spreading
    if (!this.config[provider]) {
      throw new Error(
        `Unknown provider: ${provider}. Available providers: claude, openai, gemini`
      );
    }

    const providerConfig = { ...this.config[provider] };

    // Validate API key exists for the requested provider
    if (!providerConfig.apiKey) {
      const envVarMap = {
        'claude': 'CLAUDE_API_KEY',
        'openai': 'OPENAI_API_KEY',
        'gemini': 'GEMINI_API_KEY'
      };
      const envVar = envVarMap[provider] || `${provider.toUpperCase()}_API_KEY`;
      throw new Error(
        `API key required for ${provider} provider. ` +
        `Please set ${envVar} in your .env file.`
      );
    }

    // Apply model override if provided
    if (options.model) {
      providerConfig.model = options.model;
    }

    // Apply temperature override if provided
    if (options.temperature !== undefined) {
      baseConfig.temperature = options.temperature;
    }

    // Apply maxTokens override if provided
    if (options.maxTokens !== undefined) {
      baseConfig.maxTokens = options.maxTokens;
    }

    return {
      ...baseConfig,
      provider,
      model: providerConfig.model,  // Override with provider-specific model
      [provider]: providerConfig,
      apiKey: providerConfig.apiKey  // Ensure API key is at top level
    };
  }

  /**
   * Generate text with real-time streaming
   *
   * @param {string} prompt - User prompt/message
   * @param {Function} onChunk - Callback for each text chunk: (chunk: string) => void
   * @param {Object} options - Generation options (same as generate())
   * @param {string} [options.provider] - Override provider ('claude' | 'openai' | 'gemini')
   * @param {string} [options.model] - Override model
   * @param {number} [options.temperature] - Override temperature
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
    // Allow per-request provider override, fall back to default config
    const provider = options.provider || this.config.provider;

    // Debug logging for provider selection
    console.log(`[LLMService STREAM] Provider selected: ${provider} (options.provider: ${options.provider}, default: ${this.config.provider})`);
    console.log(`[LLMService STREAM] Model: ${options.model || 'default'}`);

    // Validate onChunk callback
    if (typeof onChunk !== 'function') {
      throw new Error('onChunk must be a function that receives text chunks')
    }

    // Build config with overrides
    const requestConfig = this._buildRequestConfig(provider, options);

    switch (provider) {
      case 'claude':
        return await streamWithClaude(prompt, onChunk, options, requestConfig)

      case 'openai':
        return await streamWithOpenAI(prompt, onChunk, options, requestConfig)

      case 'gemini':
        return await streamWithGemini(prompt, onChunk, options, requestConfig)

      default:
        throw new Error(
          `Unsupported LLM provider: ${provider}. ` +
          `Supported providers: claude, openai, gemini`
        )
    }
  }

  /**
   * Get current provider name
   * @returns {string} Provider name ('claude', 'openai', or 'gemini')
   */
  getProvider() {
    return this.config.provider
  }

  /**
   * Get current model identifier
   * @returns {string} Model name (e.g., 'claude-sonnet-4-5-20250929', 'gpt-5.1', 'gemini-2.0-flash-exp')
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
