# Multi-Provider LLM Architecture Plan

**Version:** 1.0.0
**Date:** November 13, 2025
**Status:** 🔵 PROPOSED - Architectural Design
**Objective:** Abstract LLM functionality to support multiple providers (Claude, OpenAI, Azure, Bedrock, etc.) while maintaining current Claude implementation as default

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Proposed Architecture](#proposed-architecture)
4. [Directory Structure](#directory-structure)
5. [Provider Interface Design](#provider-interface-design)
6. [Provider Implementations](#provider-implementations)
7. [Factory Pattern](#factory-pattern)
8. [Configuration Management](#configuration-management)
9. [Migration Strategy](#migration-strategy)
10. [Testing Strategy](#testing-strategy)
11. [Error Handling](#error-handling)
12. [Caching Strategy](#caching-strategy)
13. [Best Practices & SOLID Principles](#best-practices--solid-principles)

---

## Executive Summary

### Goals
- ✅ Support multiple LLM providers (Claude, OpenAI, Azure OpenAI, AWS Bedrock, Google Vertex AI)
- ✅ Maintain current Claude implementation with zero breaking changes
- ✅ Enable runtime provider switching via configuration
- ✅ Preserve prompt caching capabilities where supported
- ✅ Follow SOLID principles for maintainability
- ✅ Comprehensive test coverage for all providers

### Key Design Patterns
- **Strategy Pattern**: Abstract provider interface with concrete implementations
- **Factory Pattern**: Provider instantiation based on configuration
- **Adapter Pattern**: Normalize provider-specific APIs to common interface
- **Dependency Injection**: Inject provider into services that need LLM access

### Success Metrics
- Zero breaking changes to existing API routes
- < 5% performance overhead from abstraction
- Support for 3+ providers at launch
- 95%+ test coverage for provider layer
- Configuration-driven switching (no code changes)

---

## Current Architecture Analysis

### Existing Flow
```
┌─────────────────┐
│   API Routes    │  POST /api/generate, /api/generate-stream
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DocGenerator    │  Orchestrates: parse → prompt → generate → score
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ClaudeClient   │  Wraps Anthropic SDK (generate, streaming, retries)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ @anthropic-ai/  │  Official Anthropic SDK
│      sdk        │
└─────────────────┘
```

### Current Coupling Points
| Component | Coupling Issue | Impact |
|-----------|----------------|--------|
| **claudeClient.js** | Hardcoded model name `claude-sonnet-4-5-20250929` | ⚠️ Can't switch models easily |
| **claudeClient.js** | Anthropic-specific error parsing | ⚠️ Won't work with other providers |
| **claudeClient.js** | Prompt caching syntax (`cache_control`) | ⚠️ Claude-only feature |
| **docGenerator.js** | Direct import of `claudeClient` | ⚠️ Tightly coupled to one provider |
| **api.js routes** | No coupling! Calls generic `docGenerator` | ✅ Already abstracted |

### What Works Well (Keep!)
- ✅ **API routes** - Provider-agnostic, just consume `docGenerator` service
- ✅ **Streaming architecture** - Callback-based, works with any provider
- ✅ **Prompt building** - No provider-specific syntax
- ✅ **Error handling structure** - Just needs provider-specific adapters
- ✅ **Retry logic** - Generic exponential backoff (just extract it)

---

## Proposed Architecture

### New Flow
```
┌─────────────────┐
│   API Routes    │  POST /api/generate (unchanged)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DocGenerator    │  Uses injected LLM provider (interface)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLMFactory     │  Creates provider based on env config
└────────┬────────┘
         │
         ▼
    ┌────┴─────┬──────────┬──────────┬──────────┐
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Claude │ │ OpenAI │ │ Azure  │ │Bedrock │ │ Vertex │
│Provider│ │Provider│ │Provider│ │Provider│ │Provider│
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  BaseLLMProvider│  Abstract base class
            │   (Interface)   │
            └─────────────────┘
```

### Layer Responsibilities

#### 1. **BaseLLMProvider (Abstract Interface)**
- Defines contract: `generate()`, `generateWithStreaming()`, `supportsStreaming()`, `supportsCaching()`
- Enforces consistent error handling
- Provides utilities: retry logic, token counting, timeout management

#### 2. **Concrete Providers (Claude, OpenAI, etc.)**
- Implement BaseLLMProvider interface
- Handle provider-specific API calls
- Normalize responses to common format
- Translate errors to standard structure

#### 3. **LLMFactory**
- Reads configuration (env vars, config file)
- Validates provider availability
- Instantiates correct provider with config
- Singleton pattern for provider reuse

#### 4. **LLMConfig**
- Centralized configuration management
- Provider-specific settings (models, tokens, endpoints)
- Validation & defaults
- Support for multiple environments (dev, prod)

#### 5. **DocGeneratorService (Updated)**
- Receives provider via dependency injection
- Provider-agnostic logic (no changes to prompt building)
- Delegates LLM calls to injected provider

---

## Directory Structure

### New File Organization
```
server/
├── src/
│   ├── services/
│   │   ├── llm/                          # NEW: LLM abstraction layer
│   │   │   ├── providers/                # Provider implementations
│   │   │   │   ├── base/
│   │   │   │   │   ├── BaseLLMProvider.js        # Abstract base class
│   │   │   │   │   ├── LLMError.js               # Standard error class
│   │   │   │   │   └── RetryHelper.js            # Extracted retry logic
│   │   │   │   ├── anthropic/
│   │   │   │   │   ├── ClaudeProvider.js         # Refactored claudeClient
│   │   │   │   │   ├── ClaudeConfig.js           # Claude-specific config
│   │   │   │   │   └── ClaudeErrorAdapter.js     # Error translation
│   │   │   │   ├── openai/
│   │   │   │   │   ├── OpenAIProvider.js         # OpenAI implementation
│   │   │   │   │   ├── OpenAIConfig.js
│   │   │   │   │   └── OpenAIErrorAdapter.js
│   │   │   │   ├── azure/
│   │   │   │   │   ├── AzureOpenAIProvider.js    # Azure OpenAI
│   │   │   │   │   └── AzureConfig.js
│   │   │   │   ├── bedrock/
│   │   │   │   │   ├── BedrockProvider.js        # AWS Bedrock
│   │   │   │   │   └── BedrockConfig.js
│   │   │   │   └── index.js                      # Exports all providers
│   │   │   ├── factory/
│   │   │   │   ├── LLMFactory.js                 # Factory implementation
│   │   │   │   └── ProviderRegistry.js           # Provider registration
│   │   │   ├── config/
│   │   │   │   ├── LLMConfig.js                  # Global LLM config
│   │   │   │   ├── providerDefaults.js           # Default settings
│   │   │   │   └── validation.js                 # Config validation
│   │   │   ├── types/
│   │   │   │   ├── LLMTypes.js                   # TypeScript/JSDoc types
│   │   │   │   └── ProviderCapabilities.js       # Capability flags
│   │   │   └── index.js                          # Main export
│   │   ├── docGenerator.js               # UPDATED: Use injected provider
│   │   ├── claudeClient.js               # DEPRECATED (or keep as legacy)
│   │   ├── codeParser.js                 # Unchanged
│   │   └── qualityScorer.js              # Unchanged
│   ├── routes/
│   │   └── api.js                        # Unchanged (no breaking changes)
│   ├── middleware/
│   │   └── llmProvider.js                # NEW: Inject provider into req
│   └── config/
│       ├── llm.config.js                 # NEW: Environment-based config
│       └── index.js
├── __tests__/
│   ├── llm/                              # NEW: Provider tests
│   │   ├── providers/
│   │   │   ├── ClaudeProvider.test.js
│   │   │   ├── OpenAIProvider.test.js
│   │   │   └── BaseLLMProvider.test.js
│   │   ├── factory/
│   │   │   └── LLMFactory.test.js
│   │   └── integration/
│   │       ├── provider-switching.test.js
│   │       └── streaming.test.js
│   ├── docGenerator.test.js              # UPDATED: Mock provider
│   └── claudeClient.test.js              # Keep for legacy/migration
└── .env.example                          # UPDATED: Add LLM config vars
```

### File Size Estimates
- `BaseLLMProvider.js`: ~200 lines (interface + utilities)
- `ClaudeProvider.js`: ~250 lines (refactored claudeClient + adapter)
- `OpenAIProvider.js`: ~200 lines (new implementation)
- `LLMFactory.js`: ~150 lines (factory + registry)
- `LLMConfig.js`: ~100 lines (config management)

**Total New Code**: ~1,200 lines
**Refactored Code**: ~300 lines (docGenerator updates)
**Tests**: ~1,500 lines (comprehensive provider coverage)

---

## Provider Interface Design

### BaseLLMProvider Abstract Class

```javascript
/**
 * Abstract base class for all LLM providers.
 * All concrete providers (Claude, OpenAI, etc.) must extend this class.
 *
 * @abstract
 */
class BaseLLMProvider {
  /**
   * @param {Object} config - Provider configuration
   * @param {string} config.apiKey - API key for authentication
   * @param {string} config.model - Model identifier (e.g., 'claude-sonnet-4-5-20250929')
   * @param {number} config.maxTokens - Maximum tokens per request (default: 4000)
   * @param {number} config.maxRetries - Maximum retry attempts (default: 3)
   * @param {number} config.timeout - Request timeout in ms (default: 60000)
   */
  constructor(config) {
    if (this.constructor === BaseLLMProvider) {
      throw new Error('BaseLLMProvider is abstract and cannot be instantiated directly')
    }

    this.config = this._validateConfig(config)
    this.retryHelper = new RetryHelper(config.maxRetries, config.backoffMultiplier)
  }

  // ============================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ============================================================================

  /**
   * Generate text from a prompt (non-streaming).
   *
   * @abstract
   * @param {string} prompt - User prompt
   * @param {Object} options - Generation options
   * @param {string} [options.systemPrompt] - System instructions
   * @param {boolean} [options.enableCaching=false] - Enable prompt caching (if supported)
   * @param {number} [options.temperature=0.7] - Sampling temperature (0-1)
   * @param {number} [options.topP=1.0] - Nucleus sampling parameter
   * @param {string[]} [options.stopSequences] - Stop sequences
   * @returns {Promise<GenerationResult>}
   * @throws {LLMError} On API errors, rate limits, or validation failures
   */
  async generate(prompt, options = {}) {
    throw new Error('generate() must be implemented by subclass')
  }

  /**
   * Generate text with streaming (real-time chunks).
   *
   * @abstract
   * @param {string} prompt - User prompt
   * @param {Function} onChunk - Callback for each text chunk: (chunk: string) => void
   * @param {Object} options - Generation options (same as generate())
   * @returns {Promise<GenerationResult>} - Full result after streaming completes
   * @throws {LLMError} On API errors, rate limits, or validation failures
   */
  async generateWithStreaming(prompt, onChunk, options = {}) {
    throw new Error('generateWithStreaming() must be implemented by subclass')
  }

  /**
   * Get provider-specific capabilities.
   *
   * @abstract
   * @returns {ProviderCapabilities}
   */
  getCapabilities() {
    throw new Error('getCapabilities() must be implemented by subclass')
  }

  // ============================================================================
  // CONCRETE METHODS (Provided by base class, can be overridden)
  // ============================================================================

  /**
   * Validate configuration on instantiation.
   *
   * @protected
   * @param {Object} config
   * @returns {Object} Validated config with defaults
   */
  _validateConfig(config) {
    if (!config.apiKey) {
      throw new Error(`API key required for ${this.constructor.name}`)
    }
    if (!config.model) {
      throw new Error(`Model identifier required for ${this.constructor.name}`)
    }

    return {
      apiKey: config.apiKey,
      model: config.model,
      maxTokens: config.maxTokens || 4000,
      maxRetries: config.maxRetries !== undefined ? config.maxRetries : 3,
      timeout: config.timeout || 60000,
      backoffMultiplier: config.backoffMultiplier || 2,
      temperature: config.temperature || 0.7,
      topP: config.topP || 1.0,
      ...config
    }
  }

  /**
   * Execute a function with retry logic and error handling.
   *
   * @protected
   * @param {Function} fn - Async function to execute
   * @param {string} operation - Operation name (for logging)
   * @returns {Promise<any>}
   */
  async _executeWithRetry(fn, operation = 'LLM request') {
    return this.retryHelper.execute(fn, operation, this.constructor.name)
  }

  /**
   * Check if provider supports streaming.
   *
   * @returns {boolean}
   */
  supportsStreaming() {
    return this.getCapabilities().streaming
  }

  /**
   * Check if provider supports prompt caching.
   *
   * @returns {boolean}
   */
  supportsCaching() {
    return this.getCapabilities().caching
  }

  /**
   * Estimate token count for text (rough approximation).
   *
   * @param {string} text
   * @returns {number} Approximate token count
   */
  estimateTokens(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  /**
   * Get provider name.
   *
   * @returns {string}
   */
  getProviderName() {
    return this.constructor.name.replace('Provider', '').toLowerCase()
  }

  /**
   * Get current model identifier.
   *
   * @returns {string}
   */
  getModel() {
    return this.config.model
  }
}

// ============================================================================
// TYPE DEFINITIONS (JSDoc for IDE autocomplete)
// ============================================================================

/**
 * @typedef {Object} GenerationResult
 * @property {string} text - Generated text
 * @property {GenerationMetadata} metadata - Generation metadata
 */

/**
 * @typedef {Object} GenerationMetadata
 * @property {string} model - Model used for generation
 * @property {string} provider - Provider name (e.g., 'claude', 'openai')
 * @property {number} inputTokens - Tokens in input
 * @property {number} outputTokens - Tokens in output
 * @property {number} cacheReadTokens - Tokens read from cache (if caching enabled)
 * @property {number} cacheWriteTokens - Tokens written to cache (if caching enabled)
 * @property {number} latencyMs - Request latency in milliseconds
 * @property {Date} timestamp - Generation timestamp
 * @property {boolean} wasCached - Whether response used cached prompts
 */

/**
 * @typedef {Object} ProviderCapabilities
 * @property {boolean} streaming - Supports streaming responses
 * @property {boolean} caching - Supports prompt caching
 * @property {boolean} functionCalling - Supports function/tool calling
 * @property {boolean} vision - Supports image inputs
 * @property {number} maxContextWindow - Maximum context window in tokens
 * @property {string[]} supportedModels - List of available models
 */

module.exports = BaseLLMProvider
```

### Standard Error Class

```javascript
/**
 * Standard error class for all LLM operations.
 * Provides consistent error structure across providers.
 */
class LLMError extends Error {
  /**
   * @param {string} message - User-friendly error message
   * @param {Object} details
   * @param {string} details.provider - Provider name
   * @param {string} details.operation - Operation that failed (e.g., 'generate', 'stream')
   * @param {string} [details.errorType] - Error category (e.g., 'RATE_LIMIT', 'AUTH', 'VALIDATION')
   * @param {number} [details.statusCode] - HTTP status code
   * @param {number} [details.retryAfter] - Seconds until retry allowed (for rate limits)
   * @param {Error} [details.originalError] - Original error from provider SDK
   */
  constructor(message, details = {}) {
    super(message)
    this.name = 'LLMError'
    this.provider = details.provider
    this.operation = details.operation
    this.errorType = details.errorType || 'UNKNOWN'
    this.statusCode = details.statusCode
    this.retryAfter = details.retryAfter
    this.originalError = details.originalError
    this.timestamp = new Date()

    // Capture stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Check if error is retryable (network, timeout, 5xx errors).
   * @returns {boolean}
   */
  isRetryable() {
    const retryableTypes = ['NETWORK', 'TIMEOUT', 'SERVER_ERROR', 'RATE_LIMIT']
    return retryableTypes.includes(this.errorType)
  }

  /**
   * Check if error is a rate limit error.
   * @returns {boolean}
   */
  isRateLimit() {
    return this.errorType === 'RATE_LIMIT'
  }

  /**
   * Check if error is an authentication error.
   * @returns {boolean}
   */
  isAuthError() {
    return this.errorType === 'AUTH'
  }

  /**
   * Convert to JSON for API responses.
   * @returns {Object}
   */
  toJSON() {
    return {
      error: this.message,
      provider: this.provider,
      operation: this.operation,
      errorType: this.errorType,
      statusCode: this.statusCode,
      retryAfter: this.retryAfter,
      timestamp: this.timestamp.toISOString()
    }
  }
}

// Error type constants
LLMError.Types = {
  AUTH: 'AUTH',                   // Invalid API key, unauthorized
  RATE_LIMIT: 'RATE_LIMIT',       // Rate limit exceeded
  VALIDATION: 'VALIDATION',       // Invalid request parameters
  TIMEOUT: 'TIMEOUT',             // Request timeout
  NETWORK: 'NETWORK',             // Network connectivity issue
  SERVER_ERROR: 'SERVER_ERROR',   // 5xx server errors
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED', // Account quota/billing issue
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND', // Invalid model identifier
  UNKNOWN: 'UNKNOWN'              // Unknown/unclassified error
}

module.exports = LLMError
```

### Retry Helper

```javascript
/**
 * Utility for exponential backoff retry logic.
 * Extracted from claudeClient.js for reuse across providers.
 */
class RetryHelper {
  constructor(maxRetries = 3, backoffMultiplier = 2) {
    this.maxRetries = maxRetries
    this.backoffMultiplier = backoffMultiplier
  }

  /**
   * Execute function with exponential backoff retry.
   *
   * @param {Function} fn - Async function to execute
   * @param {string} operation - Operation name for logging
   * @param {string} provider - Provider name for logging
   * @returns {Promise<any>}
   */
  async execute(fn, operation, provider) {
    let lastError

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        // Don't retry on non-retryable errors
        if (error instanceof LLMError && !error.isRetryable()) {
          throw error
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break
        }

        // Calculate backoff delay: 2^attempt * 1000ms (1s, 2s, 4s, ...)
        const delayMs = Math.pow(this.backoffMultiplier, attempt) * 1000

        console.log(
          `[${provider}] ${operation} failed (attempt ${attempt + 1}/${this.maxRetries + 1}), ` +
          `retrying in ${delayMs}ms...`,
          error.message
        )

        await this._sleep(delayMs)
      }
    }

    // All retries exhausted
    throw lastError
  }

  /**
   * Sleep for specified milliseconds.
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = RetryHelper
```

---

## Provider Implementations

### 1. ClaudeProvider (Refactored from claudeClient.js)

```javascript
const Anthropic = require('@anthropic-ai/sdk')
const BaseLLMProvider = require('../base/BaseLLMProvider')
const LLMError = require('../base/LLMError')

/**
 * Claude (Anthropic) provider implementation.
 * Refactored from the original claudeClient.js with provider abstraction.
 */
class ClaudeProvider extends BaseLLMProvider {
  constructor(config) {
    super(config)

    this.client = new Anthropic({
      apiKey: this.config.apiKey
    })
  }

  /**
   * Get Claude-specific capabilities.
   */
  getCapabilities() {
    return {
      streaming: true,
      caching: true,  // Claude supports prompt caching
      functionCalling: true,
      vision: true,   // Claude 3.5+ supports vision
      maxContextWindow: 200000, // 200K tokens for Sonnet 4.5
      supportedModels: [
        'claude-sonnet-4-5-20250929',
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ]
    }
  }

  /**
   * Generate text (non-streaming).
   */
  async generate(prompt, options = {}) {
    const startTime = Date.now()

    const result = await this._executeWithRetry(async () => {
      try {
        // Build messages array
        const messages = [{ role: 'user', content: prompt }]

        // Add cache control to user message if caching enabled
        if (options.enableCaching && this.supportsCaching()) {
          messages[0].content = [
            {
              type: 'text',
              text: prompt,
              cache_control: { type: 'ephemeral' }
            }
          ]
        }

        // Build request parameters
        const params = {
          model: this.config.model,
          max_tokens: options.maxTokens || this.config.maxTokens,
          messages
        }

        // Add system prompt with caching if provided
        if (options.systemPrompt) {
          params.system = [
            {
              type: 'text',
              text: options.systemPrompt,
              cache_control: { type: 'ephemeral' } // Always cache system prompts
            }
          ]
        }

        // Add optional parameters
        if (options.temperature !== undefined) {
          params.temperature = options.temperature
        }
        if (options.topP !== undefined) {
          params.top_p = options.topP
        }
        if (options.stopSequences) {
          params.stop_sequences = options.stopSequences
        }

        // Call Anthropic API
        const response = await this.client.messages.create(params)

        // Extract text from response
        const text = response.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('')

        // Build metadata
        const metadata = {
          model: response.model,
          provider: 'claude',
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheReadTokens: response.usage.cache_read_input_tokens || 0,
          cacheWriteTokens: response.usage.cache_creation_input_tokens || 0,
          latencyMs: Date.now() - startTime,
          timestamp: new Date(),
          wasCached: (response.usage.cache_read_input_tokens || 0) > 0
        }

        return { text, metadata }

      } catch (error) {
        throw this._adaptError(error, 'generate')
      }
    }, 'generate')

    return result
  }

  /**
   * Generate text with streaming.
   */
  async generateWithStreaming(prompt, onChunk, options = {}) {
    const startTime = Date.now()
    let fullText = ''
    let usage = null

    await this._executeWithRetry(async () => {
      try {
        // Build messages (same as generate())
        const messages = [{ role: 'user', content: prompt }]

        if (options.enableCaching && this.supportsCaching()) {
          messages[0].content = [
            {
              type: 'text',
              text: prompt,
              cache_control: { type: 'ephemeral' }
            }
          ]
        }

        const params = {
          model: this.config.model,
          max_tokens: options.maxTokens || this.config.maxTokens,
          messages,
          stream: true
        }

        if (options.systemPrompt) {
          params.system = [
            {
              type: 'text',
              text: options.systemPrompt,
              cache_control: { type: 'ephemeral' }
            }
          ]
        }

        if (options.temperature !== undefined) params.temperature = options.temperature
        if (options.topP !== undefined) params.top_p = options.topP
        if (options.stopSequences) params.stop_sequences = options.stopSequences

        // Stream response
        const stream = await this.client.messages.stream(params)

        for await (const event of stream) {
          // Handle different event types
          if (event.type === 'content_block_delta') {
            const chunk = event.delta.text || ''
            fullText += chunk
            onChunk(chunk)
          } else if (event.type === 'message_start') {
            usage = event.message.usage
          } else if (event.type === 'message_delta') {
            // Update usage with final counts
            usage = { ...usage, ...event.usage }
          }
        }

      } catch (error) {
        throw this._adaptError(error, 'generateWithStreaming')
      }
    }, 'generateWithStreaming')

    // Build metadata
    const metadata = {
      model: this.config.model,
      provider: 'claude',
      inputTokens: usage?.input_tokens || 0,
      outputTokens: usage?.output_tokens || 0,
      cacheReadTokens: usage?.cache_read_input_tokens || 0,
      cacheWriteTokens: usage?.cache_creation_input_tokens || 0,
      latencyMs: Date.now() - startTime,
      timestamp: new Date(),
      wasCached: (usage?.cache_read_input_tokens || 0) > 0
    }

    return { text: fullText, metadata }
  }

  /**
   * Adapt Anthropic SDK errors to standard LLMError.
   * @private
   */
  _adaptError(error, operation) {
    // Extract error details from Anthropic's error structure
    let message = 'An error occurred during Claude API request'
    let errorType = LLMError.Types.UNKNOWN
    let statusCode = null
    let retryAfter = null

    // Handle Anthropic SDK error structure
    if (error.status) {
      statusCode = error.status

      if (statusCode === 401) {
        errorType = LLMError.Types.AUTH
        message = 'Invalid Anthropic API key'
      } else if (statusCode === 429) {
        errorType = LLMError.Types.RATE_LIMIT
        message = 'Claude API rate limit exceeded'
        retryAfter = error.headers?.['retry-after'] || 60
      } else if (statusCode >= 500) {
        errorType = LLMError.Types.SERVER_ERROR
        message = 'Claude API server error'
      } else if (statusCode === 400) {
        errorType = LLMError.Types.VALIDATION
      }
    }

    // Extract message from various error formats
    if (error.error?.message) {
      message = error.error.message
    } else if (error.message) {
      // Parse JSON embedded in error message (Anthropic format)
      const jsonMatch = error.message.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          message = parsed.error?.message || message
        } catch (e) {
          message = error.message
        }
      } else {
        message = error.message
      }
    }

    return new LLMError(message, {
      provider: 'claude',
      operation,
      errorType,
      statusCode,
      retryAfter,
      originalError: error
    })
  }
}

module.exports = ClaudeProvider
```

### 2. OpenAIProvider (Example Alternative)

```javascript
const OpenAI = require('openai')
const BaseLLMProvider = require('../base/BaseLLMProvider')
const LLMError = require('../base/LLMError')

/**
 * OpenAI provider implementation.
 * Supports GPT-5.1, GPT-4, GPT-3.5, and compatible models.
 */
class OpenAIProvider extends BaseLLMProvider {
  constructor(config) {
    super(config)

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: config.baseURL // Allow custom endpoints (Azure, etc.)
    })
  }

  getCapabilities() {
    return {
      streaming: true,
      caching: false, // OpenAI doesn't have explicit prompt caching
      functionCalling: true,
      vision: true,   // GPT-4 Vision
      maxContextWindow: this._getContextWindow(),
      supportedModels: [
        'gpt-5.1',
        'gpt-4-1106-preview',
        'gpt-4',
        'gpt-3.5-turbo-16k',
        'gpt-3.5-turbo'
      ]
    }
  }

  _getContextWindow() {
    const model = this.config.model
    if (model.includes('gpt-5.1')) return 128000
    if (model.includes('gpt-4-turbo')) return 128000
    if (model.includes('gpt-4')) return 8192
    if (model.includes('16k')) return 16384
    return 4096
  }

  async generate(prompt, options = {}) {
    const startTime = Date.now()

    const result = await this._executeWithRetry(async () => {
      try {
        // Build messages array
        const messages = []

        if (options.systemPrompt) {
          messages.push({ role: 'system', content: options.systemPrompt })
        }

        messages.push({ role: 'user', content: prompt })

        // Call OpenAI API
        const response = await this.client.chat.completions.create({
          model: this.config.model,
          messages,
          max_tokens: options.maxTokens || this.config.maxTokens,
          temperature: options.temperature !== undefined ? options.temperature : this.config.temperature,
          top_p: options.topP !== undefined ? options.topP : this.config.topP,
          stop: options.stopSequences || null
        })

        const text = response.choices[0].message.content

        const metadata = {
          model: response.model,
          provider: 'openai',
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          cacheReadTokens: 0,  // OpenAI doesn't provide cache metrics
          cacheWriteTokens: 0,
          latencyMs: Date.now() - startTime,
          timestamp: new Date(),
          wasCached: false
        }

        return { text, metadata }

      } catch (error) {
        throw this._adaptError(error, 'generate')
      }
    }, 'generate')

    return result
  }

  async generateWithStreaming(prompt, onChunk, options = {}) {
    const startTime = Date.now()
    let fullText = ''
    let usage = null

    await this._executeWithRetry(async () => {
      try {
        const messages = []

        if (options.systemPrompt) {
          messages.push({ role: 'system', content: options.systemPrompt })
        }

        messages.push({ role: 'user', content: prompt })

        const stream = await this.client.chat.completions.create({
          model: this.config.model,
          messages,
          max_tokens: options.maxTokens || this.config.maxTokens,
          temperature: options.temperature !== undefined ? options.temperature : this.config.temperature,
          top_p: options.topP !== undefined ? options.topP : this.config.topP,
          stop: options.stopSequences || null,
          stream: true
        })

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || ''
          if (delta) {
            fullText += delta
            onChunk(delta)
          }

          // OpenAI doesn't provide usage in streaming (estimate it)
          if (chunk.choices[0]?.finish_reason) {
            usage = {
              prompt_tokens: this.estimateTokens(prompt + (options.systemPrompt || '')),
              completion_tokens: this.estimateTokens(fullText)
            }
          }
        }

      } catch (error) {
        throw this._adaptError(error, 'generateWithStreaming')
      }
    }, 'generateWithStreaming')

    const metadata = {
      model: this.config.model,
      provider: 'openai',
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      latencyMs: Date.now() - startTime,
      timestamp: new Date(),
      wasCached: false
    }

    return { text: fullText, metadata }
  }

  _adaptError(error, operation) {
    let message = 'An error occurred during OpenAI API request'
    let errorType = LLMError.Types.UNKNOWN
    let statusCode = error.status || null
    let retryAfter = null

    if (error.status === 401) {
      errorType = LLMError.Types.AUTH
      message = 'Invalid OpenAI API key'
    } else if (error.status === 429) {
      errorType = LLMError.Types.RATE_LIMIT
      message = 'OpenAI API rate limit exceeded'
      retryAfter = error.headers?.['retry-after'] || 60
    } else if (error.status >= 500) {
      errorType = LLMError.Types.SERVER_ERROR
      message = 'OpenAI API server error'
    } else if (error.status === 400) {
      errorType = LLMError.Types.VALIDATION
      message = error.message || 'Invalid request parameters'
    }

    if (error.message) {
      message = error.message
    }

    return new LLMError(message, {
      provider: 'openai',
      operation,
      errorType,
      statusCode,
      retryAfter,
      originalError: error
    })
  }
}

module.exports = OpenAIProvider
```

---

## Factory Pattern

### LLMFactory Implementation

```javascript
const ClaudeProvider = require('../providers/anthropic/ClaudeProvider')
const OpenAIProvider = require('../providers/openai/OpenAIProvider')
const AzureOpenAIProvider = require('../providers/azure/AzureOpenAIProvider')
const BedrockProvider = require('../providers/bedrock/BedrockProvider')

/**
 * Factory for creating LLM provider instances.
 * Supports runtime provider switching via configuration.
 */
class LLMFactory {
  constructor() {
    // Provider registry (maps provider name to class)
    this.registry = new Map([
      ['anthropic', ClaudeProvider],
      ['claude', ClaudeProvider],  // Alias
      ['openai', OpenAIProvider],
      ['azure-openai', AzureOpenAIProvider],
      ['azure', AzureOpenAIProvider],  // Alias
      ['bedrock', BedrockProvider],
      ['aws-bedrock', BedrockProvider]  // Alias
    ])

    // Singleton instances (one per provider+model combo)
    this.instances = new Map()
  }

  /**
   * Register a custom provider class.
   * Useful for plugins or custom implementations.
   *
   * @param {string} name - Provider name (e.g., 'custom-llm')
   * @param {Class} ProviderClass - Class extending BaseLLMProvider
   */
  register(name, ProviderClass) {
    if (!ProviderClass.prototype.generate) {
      throw new Error(`${ProviderClass.name} must implement generate() method`)
    }
    this.registry.set(name.toLowerCase(), ProviderClass)
  }

  /**
   * Create or retrieve provider instance.
   * Uses singleton pattern to reuse instances.
   *
   * @param {Object} config - Provider configuration
   * @param {string} config.provider - Provider name ('anthropic', 'openai', etc.)
   * @param {string} config.apiKey - API key
   * @param {string} config.model - Model identifier
   * @param {number} [config.maxTokens=4000]
   * @param {number} [config.maxRetries=3]
   * @param {Object} [config.providerOptions] - Provider-specific options
   * @returns {BaseLLMProvider}
   */
  create(config) {
    if (!config.provider) {
      throw new Error('Provider name is required (e.g., "anthropic", "openai")')
    }

    const providerName = config.provider.toLowerCase()
    const ProviderClass = this.registry.get(providerName)

    if (!ProviderClass) {
      throw new Error(
        `Unknown provider: "${config.provider}". ` +
        `Available providers: ${Array.from(this.registry.keys()).join(', ')}`
      )
    }

    // Create unique key for singleton lookup
    const instanceKey = `${providerName}:${config.model}:${config.apiKey.substring(0, 8)}`

    // Return existing instance if available
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)
    }

    // Create new instance
    const instance = new ProviderClass({
      apiKey: config.apiKey,
      model: config.model,
      maxTokens: config.maxTokens,
      maxRetries: config.maxRetries,
      timeout: config.timeout,
      ...config.providerOptions
    })

    // Cache for reuse
    this.instances.set(instanceKey, instance)

    console.log(`[LLMFactory] Created ${providerName} provider with model ${config.model}`)

    return instance
  }

  /**
   * Create provider from environment variables.
   * Reads from LLM_PROVIDER, LLM_API_KEY, LLM_MODEL, etc.
   *
   * @param {Object} [overrides] - Override specific config values
   * @returns {BaseLLMProvider}
   */
  createFromEnv(overrides = {}) {
    const config = {
      provider: process.env.LLM_PROVIDER || 'anthropic',
      apiKey: process.env.LLM_API_KEY || process.env.CLAUDE_API_KEY,
      model: process.env.LLM_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000', 10),
      maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3', 10),
      timeout: parseInt(process.env.LLM_TIMEOUT || '60000', 10),
      ...overrides
    }

    if (!config.apiKey) {
      throw new Error(
        'LLM API key not found. Set LLM_API_KEY or CLAUDE_API_KEY environment variable.'
      )
    }

    return this.create(config)
  }

  /**
   * List all registered providers.
   * @returns {string[]}
   */
  listProviders() {
    return Array.from(this.registry.keys())
  }

  /**
   * Clear all cached instances (useful for testing).
   */
  clearInstances() {
    this.instances.clear()
  }
}

// Singleton factory instance
const factory = new LLMFactory()

module.exports = factory
```

### Usage Example

```javascript
const llmFactory = require('./services/llm/factory/LLMFactory')

// Option 1: Create from environment variables (default)
const provider = llmFactory.createFromEnv()

// Option 2: Create with explicit config
const claudeProvider = llmFactory.create({
  provider: 'anthropic',
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4000,
  maxRetries: 3
})

// Option 3: Switch to OpenAI
const openaiProvider = llmFactory.create({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-5.1'
})

// Use provider (same interface for all)
const result = await provider.generate('Explain quantum computing', {
  systemPrompt: 'You are a helpful assistant.',
  enableCaching: true
})

console.log(result.text)
console.log(result.metadata) // { model, provider, tokens, latency, ... }
```

---

## Configuration Management

### Environment Variables (.env)

```bash
# ==============================================================================
# LLM Provider Configuration
# ==============================================================================

# Primary provider selection (anthropic, openai, azure-openai, bedrock)
LLM_PROVIDER=anthropic

# API credentials
LLM_API_KEY=sk-ant-...                    # Generic API key
CLAUDE_API_KEY=sk-ant-...                 # Claude-specific (backward compat)
OPENAI_API_KEY=sk-...                     # OpenAI-specific
AZURE_OPENAI_API_KEY=...                  # Azure-specific

# Model configuration
LLM_MODEL=claude-sonnet-4-5-20250929      # Generic model name
CLAUDE_MODEL=claude-sonnet-4-5-20250929   # Claude-specific (backward compat)
OPENAI_MODEL=gpt-5.1          # OpenAI-specific

# Request parameters
LLM_MAX_TOKENS=4000                       # Max tokens per request
LLM_MAX_RETRIES=3                         # Max retry attempts
LLM_TIMEOUT=60000                         # Request timeout (ms)
LLM_TEMPERATURE=0.7                       # Sampling temperature (0-1)
LLM_TOP_P=1.0                             # Nucleus sampling

# Provider-specific options
AZURE_OPENAI_ENDPOINT=https://...         # Azure OpenAI endpoint
AZURE_OPENAI_DEPLOYMENT=...               # Azure deployment name
BEDROCK_REGION=us-east-1                  # AWS Bedrock region

# Feature flags
LLM_ENABLE_CACHING=true                   # Enable prompt caching (if supported)
LLM_ENABLE_STREAMING=true                 # Enable streaming responses
LLM_LOG_TOKENS=false                      # Log token usage (verbose)
```

### LLM Config Module

```javascript
/**
 * Centralized LLM configuration management.
 * Loads from environment variables with validation and defaults.
 */
class LLMConfig {
  constructor() {
    this.config = this._loadConfig()
  }

  /**
   * Load configuration from environment variables.
   * @private
   */
  _loadConfig() {
    const provider = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase()

    // Base configuration
    const config = {
      provider,
      apiKey: this._getApiKey(provider),
      model: this._getModel(provider),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000', 10),
      maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3', 10),
      timeout: parseInt(process.env.LLM_TIMEOUT || '60000', 10),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      topP: parseFloat(process.env.LLM_TOP_P || '1.0'),
      enableCaching: process.env.LLM_ENABLE_CACHING !== 'false',
      enableStreaming: process.env.LLM_ENABLE_STREAMING !== 'false',
      logTokens: process.env.LLM_LOG_TOKENS === 'true'
    }

    // Add provider-specific options
    config.providerOptions = this._getProviderOptions(provider)

    // Validate configuration
    this._validate(config)

    return config
  }

  /**
   * Get API key for provider (with fallbacks).
   * @private
   */
  _getApiKey(provider) {
    // Try provider-specific key first
    if (provider === 'anthropic' || provider === 'claude') {
      return process.env.LLM_API_KEY || process.env.CLAUDE_API_KEY
    }
    if (provider === 'openai') {
      return process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
    }
    if (provider === 'azure-openai' || provider === 'azure') {
      return process.env.LLM_API_KEY || process.env.AZURE_OPENAI_API_KEY
    }

    // Generic fallback
    return process.env.LLM_API_KEY
  }

  /**
   * Get model name for provider (with fallbacks).
   * @private
   */
  _getModel(provider) {
    // Try provider-specific model first
    if (provider === 'anthropic' || provider === 'claude') {
      return process.env.LLM_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929'
    }
    if (provider === 'openai') {
      return process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-5.1'
    }
    if (provider === 'azure-openai') {
      return process.env.LLM_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT
    }

    // Generic fallback
    return process.env.LLM_MODEL
  }

  /**
   * Get provider-specific options.
   * @private
   */
  _getProviderOptions(provider) {
    const options = {}

    if (provider === 'azure-openai' || provider === 'azure') {
      options.baseURL = process.env.AZURE_OPENAI_ENDPOINT
      options.deployment = process.env.AZURE_OPENAI_DEPLOYMENT
      options.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
    }

    if (provider === 'bedrock' || provider === 'aws-bedrock') {
      options.region = process.env.BEDROCK_REGION || 'us-east-1'
      options.accessKeyId = process.env.AWS_ACCESS_KEY_ID
      options.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    }

    return options
  }

  /**
   * Validate configuration.
   * @private
   */
  _validate(config) {
    if (!config.apiKey) {
      throw new Error(
        `API key required for provider "${config.provider}". ` +
        `Set LLM_API_KEY or provider-specific key (e.g., CLAUDE_API_KEY).`
      )
    }

    if (!config.model) {
      throw new Error(`Model name required for provider "${config.provider}".`)
    }

    if (config.maxTokens < 1 || config.maxTokens > 200000) {
      throw new Error(`Invalid maxTokens: ${config.maxTokens} (must be 1-200000)`)
    }

    if (config.temperature < 0 || config.temperature > 1) {
      throw new Error(`Invalid temperature: ${config.temperature} (must be 0-1)`)
    }

    // Provider-specific validation
    if (config.provider === 'azure-openai' && !config.providerOptions.baseURL) {
      throw new Error('AZURE_OPENAI_ENDPOINT required for Azure OpenAI provider')
    }
  }

  /**
   * Get current configuration.
   * @returns {Object}
   */
  get() {
    return { ...this.config }
  }

  /**
   * Get configuration for specific provider (for testing/debugging).
   */
  getForProvider(providerName) {
    const tempConfig = { ...this.config, provider: providerName }
    tempConfig.apiKey = this._getApiKey(providerName)
    tempConfig.model = this._getModel(providerName)
    tempConfig.providerOptions = this._getProviderOptions(providerName)
    return tempConfig
  }

  /**
   * Update configuration at runtime (use sparingly).
   */
  update(updates) {
    this.config = { ...this.config, ...updates }
    this._validate(this.config)
  }

  /**
   * Log current configuration (sanitized).
   */
  log() {
    const sanitized = {
      ...this.config,
      apiKey: `${this.config.apiKey.substring(0, 8)}...`,
      providerOptions: {
        ...this.config.providerOptions,
        accessKeyId: this.config.providerOptions.accessKeyId
          ? `${this.config.providerOptions.accessKeyId.substring(0, 8)}...`
          : undefined,
        secretAccessKey: this.config.providerOptions.secretAccessKey ? '***' : undefined
      }
    }

    console.log('[LLMConfig] Current configuration:', JSON.stringify(sanitized, null, 2))
  }
}

// Singleton instance
const llmConfig = new LLMConfig()

module.exports = llmConfig
```

---

## Migration Strategy

### Phase 1: Create Abstraction Layer (No Breaking Changes)

**Goal**: Introduce provider abstraction WITHOUT changing existing code.

#### Step 1.1: Create Base Provider Infrastructure
```bash
# Create directory structure
mkdir -p server/src/services/llm/providers/{base,anthropic,openai}
mkdir -p server/src/services/llm/{factory,config}

# Create base files
touch server/src/services/llm/providers/base/{BaseLLMProvider.js,LLMError.js,RetryHelper.js}
```

#### Step 1.2: Implement Base Classes
- ✅ Write `BaseLLMProvider.js` (abstract interface)
- ✅ Write `LLMError.js` (standard error class)
- ✅ Write `RetryHelper.js` (extracted from claudeClient)

#### Step 1.3: Refactor ClaudeClient → ClaudeProvider
- ✅ Create `ClaudeProvider.js` extending `BaseLLMProvider`
- ✅ Copy logic from `claudeClient.js`
- ✅ Adapt to new interface (`generate()`, `generateWithStreaming()`)
- ✅ Keep `claudeClient.js` as thin wrapper (backward compatibility)

```javascript
// server/src/services/claudeClient.js (LEGACY WRAPPER)
const ClaudeProvider = require('./llm/providers/anthropic/ClaudeProvider')

/**
 * Legacy wrapper around ClaudeProvider for backward compatibility.
 * @deprecated Use LLMFactory instead
 */
class ClaudeClient {
  constructor() {
    console.warn('[ClaudeClient] This class is deprecated. Use LLMFactory.createFromEnv() instead.')

    this.provider = new ClaudeProvider({
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
      maxTokens: 4000,
      maxRetries: 3
    })
  }

  async generate(prompt, options = {}) {
    const result = await this.provider.generate(prompt, {
      systemPrompt: options.systemPrompt,
      enableCaching: options.cacheUserMessage
    })
    return result.text
  }

  async generateWithStreaming(prompt, onChunk, options = {}) {
    const result = await this.provider.generateWithStreaming(prompt, onChunk, {
      systemPrompt: options.systemPrompt,
      enableCaching: options.cacheUserMessage
    })
    return result.text
  }
}

module.exports = ClaudeClient
```

**Testing**: Run existing tests → Should pass with no changes ✅

---

### Phase 2: Implement Factory & Config

#### Step 2.1: Create Factory
- ✅ Implement `LLMFactory.js`
- ✅ Register ClaudeProvider
- ✅ Add singleton pattern

#### Step 2.2: Create Config Module
- ✅ Implement `LLMConfig.js`
- ✅ Add environment variable loading
- ✅ Add validation

#### Step 2.3: Update Environment Variables
```bash
# Add to server/.env
LLM_PROVIDER=anthropic
LLM_API_KEY=${CLAUDE_API_KEY}
LLM_MODEL=claude-sonnet-4-5-20250929
```

**Testing**: Create factory tests → Verify provider creation ✅

---

### Phase 3: Add Alternative Providers

#### Step 3.1: Implement OpenAIProvider
- ✅ Create `OpenAIProvider.js`
- ✅ Install `openai` npm package
- ✅ Implement `generate()` and `generateWithStreaming()`
- ✅ Register in factory

#### Step 3.2: (Optional) Implement Additional Providers
- ✅ Azure OpenAI
- ✅ AWS Bedrock
- ✅ Google Vertex AI

**Testing**: Write provider-specific tests → Verify all providers work ✅

---

### Phase 4: Update DocGenerator (Dependency Injection)

**Goal**: Replace direct ClaudeClient import with injected provider.

#### Before (Current)
```javascript
// server/src/services/docGenerator.js
const ClaudeClient = require('./claudeClient')

class DocGeneratorService {
  constructor() {
    this.claudeClient = new ClaudeClient()
  }

  async generateDocumentation(code, options = {}) {
    // ...
    const text = await this.claudeClient.generate(userMessage, {
      systemPrompt: systemMessages,
      cacheUserMessage: isDefaultCode
    })
    // ...
  }
}
```

#### After (Provider Injection)
```javascript
// server/src/services/docGenerator.js
const llmFactory = require('./llm/factory/LLMFactory')

class DocGeneratorService {
  /**
   * @param {BaseLLMProvider} [llmProvider] - LLM provider (optional, defaults to env config)
   */
  constructor(llmProvider = null) {
    // Use injected provider OR create from environment
    this.llmProvider = llmProvider || llmFactory.createFromEnv()
  }

  async generateDocumentation(code, options = {}) {
    // ... (same prompt building logic)

    // Use provider interface (same method names, different implementation)
    const result = await this.llmProvider.generate(userMessage, {
      systemPrompt: systemMessages,
      enableCaching: isDefaultCode
    })

    const documentation = result.text

    // ... (same quality scoring logic)

    return {
      documentation,
      qualityScore,
      analysis: parseAnalysis,
      metadata: {
        ...result.metadata,  // Now includes provider name, tokens, latency
        usedDefaultCode: isDefaultCode
      }
    }
  }

  async generateDocumentationStream(code, onChunk, options = {}) {
    // ... (same prompt building)

    const result = await this.llmProvider.generateWithStreaming(
      userMessage,
      onChunk,
      {
        systemPrompt: systemMessages,
        enableCaching: isDefaultCode
      }
    )

    // ... (same post-processing)

    return { documentation: result.text, qualityScore, metadata: result.metadata }
  }
}
```

**Testing**: Update DocGenerator tests to mock provider → All tests pass ✅

---

### Phase 5: Update API Routes (Middleware Injection)

**Goal**: Inject provider into request context via middleware.

#### Middleware: Inject Provider
```javascript
// server/src/middleware/llmProvider.js
const llmFactory = require('../services/llm/factory/LLMFactory')

/**
 * Middleware to inject LLM provider into request.
 * Allows per-request provider switching (future feature).
 */
function injectLLMProvider(req, res, next) {
  try {
    // Create provider from env (or override with request header for testing)
    const providerOverride = req.headers['x-llm-provider']
    const modelOverride = req.headers['x-llm-model']

    if (providerOverride || modelOverride) {
      req.llmProvider = llmFactory.create({
        provider: providerOverride || process.env.LLM_PROVIDER,
        apiKey: process.env.LLM_API_KEY,
        model: modelOverride || process.env.LLM_MODEL,
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000', 10)
      })
    } else {
      // Use default from environment
      req.llmProvider = llmFactory.createFromEnv()
    }

    next()
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initialize LLM provider',
      details: error.message
    })
  }
}

module.exports = injectLLMProvider
```

#### Update Routes
```javascript
// server/src/routes/api.js
const injectLLMProvider = require('../middleware/llmProvider')
const DocGeneratorService = require('../services/docGenerator')

// Apply middleware to all generation routes
router.use('/generate*', injectLLMProvider)

router.post('/generate', async (req, res) => {
  try {
    const { code, docType, language, isDefaultCode } = req.body

    // Create doc generator with injected provider
    const docGenerator = new DocGeneratorService(req.llmProvider)

    const result = await docGenerator.generateDocumentation(code, {
      docType,
      language,
      isDefaultCode
    })

    res.json(result)
  } catch (error) {
    // ... (same error handling)
  }
})
```

**Testing**: API integration tests → Verify all endpoints work ✅

---

### Phase 6: Testing & Validation

#### Test Checklist
- ✅ Unit tests for each provider (Claude, OpenAI)
- ✅ Factory tests (provider creation, registration)
- ✅ Config tests (validation, defaults)
- ✅ Integration tests (DocGenerator with different providers)
- ✅ E2E tests (API routes with provider switching)
- ✅ Error handling tests (LLMError, retries)
- ✅ Streaming tests (both providers)

#### Migration Validation
```bash
# Run all tests with Claude (default)
cd server && npm test

# Run tests with OpenAI (override)
LLM_PROVIDER=openai LLM_API_KEY=$OPENAI_API_KEY npm test

# Test provider switching via API
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "X-LLM-Provider: openai" \
  -H "X-LLM-Model: gpt-5.1" \
  -d '{"code": "console.log(\"Hello\")", "docType": "README"}'
```

---

### Phase 7: Documentation & Deprecation

#### Update Documentation
- ✅ Add `MULTI-PROVIDER-LLM-ARCHITECTURE.md` (this document)
- ✅ Update `CLAUDE.md` with provider switching instructions
- ✅ Update `API-Reference.md` with provider headers
- ✅ Update `.env.example` with LLM config vars

#### Deprecation Plan for claudeClient.js
```javascript
/**
 * @deprecated Since v3.0.0. Use LLMFactory instead.
 *
 * Migration guide:
 *   Before: const client = new ClaudeClient()
 *   After:  const client = llmFactory.createFromEnv()
 *
 * This file will be removed in v4.0.0.
 */
```

---

### Phase 8: Performance & Monitoring

#### Metrics to Track
- ✅ Request latency per provider
- ✅ Token usage per provider
- ✅ Cache hit rate (Claude only)
- ✅ Error rate per provider
- ✅ Retry count per provider

#### Add Logging
```javascript
// In BaseLLMProvider or middleware
console.log('[LLM]', {
  provider: this.getProviderName(),
  model: this.getModel(),
  operation: 'generate',
  inputTokens: metadata.inputTokens,
  outputTokens: metadata.outputTokens,
  latencyMs: metadata.latencyMs,
  wasCached: metadata.wasCached
})
```

---

## Testing Strategy

### Test Coverage Requirements
- **Unit Tests**: 95% coverage for provider layer
- **Integration Tests**: All providers tested with DocGenerator
- **E2E Tests**: API routes tested with each provider
- **Error Scenarios**: Rate limits, auth failures, network errors
- **Streaming**: Real-time chunk delivery for all providers

### Test Structure

```
server/__tests__/
├── llm/
│   ├── providers/
│   │   ├── base/
│   │   │   ├── BaseLLMProvider.test.js        # Abstract class tests
│   │   │   ├── LLMError.test.js               # Error class tests
│   │   │   └── RetryHelper.test.js            # Retry logic tests
│   │   ├── anthropic/
│   │   │   ├── ClaudeProvider.test.js         # Claude-specific tests
│   │   │   └── ClaudeErrorAdapter.test.js     # Error parsing tests
│   │   └── openai/
│   │       ├── OpenAIProvider.test.js         # OpenAI-specific tests
│   │       └── OpenAIErrorAdapter.test.js
│   ├── factory/
│   │   ├── LLMFactory.test.js                 # Factory tests
│   │   └── ProviderRegistry.test.js           # Registration tests
│   ├── config/
│   │   └── LLMConfig.test.js                  # Config validation tests
│   └── integration/
│       ├── provider-switching.test.js         # Multi-provider integration
│       ├── streaming.test.js                  # Streaming with all providers
│       ├── caching.test.js                    # Caching behavior (Claude)
│       └── error-handling.test.js             # Error scenarios
└── services/
    └── docGenerator.test.js                   # Updated with provider mocking
```

### Example: Provider Unit Test

```javascript
// __tests__/llm/providers/anthropic/ClaudeProvider.test.js
const { describe, it, expect, beforeEach, jest } = require('@jest/globals')
const ClaudeProvider = require('../../../../src/services/llm/providers/anthropic/ClaudeProvider')
const LLMError = require('../../../../src/services/llm/providers/base/LLMError')

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
      stream: jest.fn()
    }
  }))
})

describe('ClaudeProvider', () => {
  let provider
  let mockClient

  beforeEach(() => {
    provider = new ClaudeProvider({
      apiKey: 'test-key',
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 4000
    })

    mockClient = provider.client
  })

  describe('generate()', () => {
    it('should generate text successfully', async () => {
      // Mock successful response
      mockClient.messages.create.mockResolvedValueOnce({
        model: 'claude-sonnet-4-5-20250929',
        content: [{ type: 'text', text: 'Generated documentation' }],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0
        }
      })

      const result = await provider.generate('Generate docs for this code')

      expect(result.text).toBe('Generated documentation')
      expect(result.metadata.provider).toBe('claude')
      expect(result.metadata.inputTokens).toBe(100)
      expect(result.metadata.outputTokens).toBe(50)
      expect(mockClient.messages.create).toHaveBeenCalledTimes(1)
    })

    it('should enable prompt caching when requested', async () => {
      mockClient.messages.create.mockResolvedValueOnce({
        model: 'claude-sonnet-4-5-20250929',
        content: [{ type: 'text', text: 'Cached response' }],
        usage: {
          input_tokens: 50,
          output_tokens: 30,
          cache_read_input_tokens: 1500,  // Cache hit!
          cache_creation_input_tokens: 0
        }
      })

      const result = await provider.generate('Prompt', {
        systemPrompt: 'System instructions',
        enableCaching: true
      })

      expect(result.metadata.wasCached).toBe(true)
      expect(result.metadata.cacheReadTokens).toBe(1500)

      // Verify cache_control was added
      const call = mockClient.messages.create.mock.calls[0][0]
      expect(call.system[0].cache_control).toEqual({ type: 'ephemeral' })
    })

    it('should retry on transient errors', async () => {
      // First call fails, second succeeds
      mockClient.messages.create
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          model: 'claude-sonnet-4-5-20250929',
          content: [{ type: 'text', text: 'Success after retry' }],
          usage: { input_tokens: 100, output_tokens: 50 }
        })

      const result = await provider.generate('Prompt')

      expect(result.text).toBe('Success after retry')
      expect(mockClient.messages.create).toHaveBeenCalledTimes(2)
    })

    it('should throw LLMError on authentication failure', async () => {
      mockClient.messages.create.mockRejectedValueOnce({
        status: 401,
        message: 'Invalid API key'
      })

      await expect(provider.generate('Prompt')).rejects.toThrow(LLMError)

      try {
        await provider.generate('Prompt')
      } catch (error) {
        expect(error.errorType).toBe(LLMError.Types.AUTH)
        expect(error.isAuthError()).toBe(true)
        expect(error.isRetryable()).toBe(false)
      }
    })

    it('should handle rate limits with retry-after', async () => {
      mockClient.messages.create.mockRejectedValueOnce({
        status: 429,
        headers: { 'retry-after': '60' },
        message: 'Rate limit exceeded'
      })

      await expect(provider.generate('Prompt')).rejects.toThrow(LLMError)

      try {
        await provider.generate('Prompt')
      } catch (error) {
        expect(error.isRateLimit()).toBe(true)
        expect(error.retryAfter).toBe('60')
      }
    })
  })

  describe('generateWithStreaming()', () => {
    it('should stream text chunks', async () => {
      const chunks = []

      // Mock streaming response
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'message_start', message: { usage: { input_tokens: 100 } } }
          yield { type: 'content_block_delta', delta: { text: 'First chunk ' } }
          yield { type: 'content_block_delta', delta: { text: 'Second chunk' } }
          yield { type: 'message_delta', usage: { output_tokens: 50 } }
        }
      }

      mockClient.messages.stream.mockResolvedValueOnce(mockStream)

      const result = await provider.generateWithStreaming(
        'Prompt',
        (chunk) => chunks.push(chunk)
      )

      expect(chunks).toEqual(['First chunk ', 'Second chunk'])
      expect(result.text).toBe('First chunk Second chunk')
      expect(result.metadata.outputTokens).toBe(50)
    })
  })

  describe('getCapabilities()', () => {
    it('should return Claude capabilities', () => {
      const capabilities = provider.getCapabilities()

      expect(capabilities.streaming).toBe(true)
      expect(capabilities.caching).toBe(true)
      expect(capabilities.maxContextWindow).toBe(200000)
      expect(capabilities.supportedModels).toContain('claude-sonnet-4-5-20250929')
    })
  })
})
```

### Example: Integration Test

```javascript
// __tests__/llm/integration/provider-switching.test.js
const { describe, it, expect, beforeEach } = require('@jest/globals')
const llmFactory = require('../../../src/services/llm/factory/LLMFactory')
const DocGeneratorService = require('../../../src/services/docGenerator')

describe('Provider Switching Integration', () => {
  it('should generate docs with Claude provider', async () => {
    const claudeProvider = llmFactory.create({
      provider: 'anthropic',
      apiKey: process.env.CLAUDE_API_KEY,
      model: 'claude-sonnet-4-5-20250929'
    })

    const docGenerator = new DocGeneratorService(claudeProvider)

    const code = 'function add(a, b) { return a + b }'
    const result = await docGenerator.generateDocumentation(code, {
      docType: 'README'
    })

    expect(result.documentation).toContain('function')
    expect(result.metadata.provider).toBe('claude')
    expect(result.qualityScore).toBeGreaterThan(0)
  })

  it('should generate docs with OpenAI provider', async () => {
    const openaiProvider = llmFactory.create({
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-5.1'
    })

    const docGenerator = new DocGeneratorService(openaiProvider)

    const code = 'function add(a, b) { return a + b }'
    const result = await docGenerator.generateDocumentation(code, {
      docType: 'README'
    })

    expect(result.documentation).toContain('function')
    expect(result.metadata.provider).toBe('openai')
    expect(result.qualityScore).toBeGreaterThan(0)
  })

  it('should switch providers at runtime', async () => {
    const docGenerator = new DocGeneratorService()

    // First call uses default provider (Claude)
    const result1 = await docGenerator.generateDocumentation('code', { docType: 'README' })
    expect(result1.metadata.provider).toBe('claude')

    // Switch to OpenAI
    const openaiProvider = llmFactory.create({
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-5.1'
    })
    docGenerator.llmProvider = openaiProvider

    const result2 = await docGenerator.generateDocumentation('code', { docType: 'README' })
    expect(result2.metadata.provider).toBe('openai')
  })
})
```

---

## Error Handling

### Error Flow

```
Provider Error
  ↓
Adapt to LLMError (provider-specific adapter)
  ↓
RetryHelper (check if retryable)
  ↓
Retry with exponential backoff (if retryable)
  ↓
Throw LLMError to DocGenerator
  ↓
DocGenerator catches, logs, adds context
  ↓
API route catches, returns HTTP error response
```

### Error Types & HTTP Status Mapping

| LLMError Type | HTTP Status | Description | Retryable? |
|---------------|-------------|-------------|------------|
| `AUTH` | 401 | Invalid API key | ❌ No |
| `RATE_LIMIT` | 429 | Rate limit exceeded | ✅ Yes (with backoff) |
| `VALIDATION` | 400 | Invalid request parameters | ❌ No |
| `TIMEOUT` | 408 | Request timeout | ✅ Yes |
| `NETWORK` | 503 | Network connectivity issue | ✅ Yes |
| `SERVER_ERROR` | 503 | 5xx server errors | ✅ Yes |
| `QUOTA_EXCEEDED` | 402 | Account quota/billing issue | ❌ No |
| `MODEL_NOT_FOUND` | 400 | Invalid model identifier | ❌ No |
| `UNKNOWN` | 500 | Unknown/unclassified error | ❌ No |

### Error Response Format

```json
{
  "error": "Claude API rate limit exceeded",
  "provider": "claude",
  "operation": "generate",
  "errorType": "RATE_LIMIT",
  "statusCode": 429,
  "retryAfter": 60,
  "timestamp": "2025-11-13T10:30:00.000Z"
}
```

---

## Caching Strategy

### Provider Support Matrix

| Provider | Prompt Caching | Implementation | TTL | Cost Savings |
|----------|----------------|----------------|-----|--------------|
| **Claude** | ✅ Yes | Native `cache_control` | 1 hour (ephemeral) | ~90% |
| **OpenAI** | ❌ No | None (server-side only) | N/A | N/A |
| **Azure OpenAI** | ❌ No | None | N/A | N/A |
| **Bedrock** | ⚠️ Partial | Model-dependent | Varies | Varies |

### Caching Logic

```javascript
// In ClaudeProvider.generate()
if (options.enableCaching && this.supportsCaching()) {
  // Cache system prompt (always)
  params.system = [
    {
      type: 'text',
      text: options.systemPrompt,
      cache_control: { type: 'ephemeral' }  // 1-hour TTL
    }
  ]

  // Cache user message (for default/example code only)
  if (options.cacheUserMessage) {
    messages[0].content = [
      {
        type: 'text',
        text: prompt,
        cache_control: { type: 'ephemeral' }
      }
    ]
  }
}
```

### Cache Metrics Tracking

```javascript
// From metadata
{
  cacheReadTokens: 1500,    // Tokens read from cache (saved money!)
  cacheWriteTokens: 0,      // Tokens written to cache (first request)
  wasCached: true           // Whether this request hit cache
}
```

### Cost Analysis

**Example Request:**
- System prompt: 2,000 tokens
- User message: 500 tokens
- Output: 1,000 tokens

**Without Caching:**
- Input: 2,500 tokens × $0.003/1K = $0.0075
- Output: 1,000 tokens × $0.015/1K = $0.015
- **Total: $0.0225 per request**

**With Caching (after first request):**
- Cache read: 2,000 tokens × $0.0003/1K = $0.0006
- New input: 500 tokens × $0.003/1K = $0.0015
- Output: 1,000 tokens × $0.015/1K = $0.015
- **Total: $0.0171 per request (-24%)**

**At scale (1,000 requests/day):**
- Without caching: $22.50/day
- With caching: $17.10/day
- **Savings: $5.40/day = $162/month**

---

## Best Practices & SOLID Principles

### 1. Single Responsibility Principle (SRP)
✅ **Each class has one job:**
- `BaseLLMProvider`: Define provider interface
- `ClaudeProvider`: Implement Claude API calls
- `LLMFactory`: Create provider instances
- `LLMConfig`: Manage configuration
- `RetryHelper`: Handle retry logic
- `LLMError`: Represent errors

### 2. Open/Closed Principle (OCP)
✅ **Open for extension, closed for modification:**
- Adding a new provider = Create new class extending `BaseLLMProvider`
- No changes to existing providers or factory
- Register new provider: `factory.register('custom', CustomProvider)`

### 3. Liskov Substitution Principle (LSP)
✅ **All providers interchangeable:**
- `DocGeneratorService` accepts any `BaseLLMProvider`
- Same interface (`generate()`, `generateWithStreaming()`)
- Can switch providers at runtime without breaking code

### 4. Interface Segregation Principle (ISP)
✅ **Providers only implement what they support:**
- `getCapabilities()` returns what's available
- Check `provider.supportsStreaming()` before calling
- Check `provider.supportsCaching()` before enabling

### 5. Dependency Inversion Principle (DIP)
✅ **Depend on abstractions, not concretions:**
- `DocGeneratorService` depends on `BaseLLMProvider` (interface)
- NOT on `ClaudeProvider` or `OpenAIProvider` (concrete classes)
- Inject provider via constructor (dependency injection)

### Additional Best Practices

#### Configuration Management
- ✅ Environment variables over hardcoded values
- ✅ Validation on startup (fail fast)
- ✅ Defaults for optional parameters
- ✅ Sanitized logging (hide API keys)

#### Error Handling
- ✅ Standard error structure across providers
- ✅ Distinguish retryable vs non-retryable errors
- ✅ Preserve original error for debugging
- ✅ User-friendly error messages

#### Testing
- ✅ Mock providers in unit tests
- ✅ Integration tests with real providers (separate suite)
- ✅ Test error scenarios (auth, rate limits, network)
- ✅ Test streaming with all providers

#### Performance
- ✅ Singleton providers (reuse instances)
- ✅ Connection pooling in SDKs
- ✅ Timeout configuration
- ✅ Retry with exponential backoff

#### Monitoring
- ✅ Log provider name, model, latency
- ✅ Track token usage per provider
- ✅ Alert on high error rates
- ✅ Dashboard for provider health

---

## Summary

### What We Built

1. **Abstract Provider Interface** (`BaseLLMProvider`)
   - Enforces consistent API across providers
   - Utilities: retry logic, token estimation, error handling

2. **Concrete Providers** (Claude, OpenAI, Azure, Bedrock)
   - Implement provider-specific API calls
   - Normalize responses to common format
   - Translate errors to standard structure

3. **Factory Pattern** (`LLMFactory`)
   - Runtime provider switching via configuration
   - Singleton instances for performance
   - Environment variable integration

4. **Configuration Management** (`LLMConfig`)
   - Centralized config with validation
   - Support for multiple environments
   - Provider-specific options

5. **Error Handling** (`LLMError`)
   - Standard error structure
   - Retryable vs non-retryable classification
   - User-friendly messages

6. **Migration Strategy**
   - Zero breaking changes to existing code
   - Backward compatibility via legacy wrapper
   - Phased rollout (8 phases)

### Key Benefits

✅ **Flexibility**: Switch providers without code changes
✅ **Maintainability**: Clean separation of concerns
✅ **Testability**: Mock providers in unit tests
✅ **Scalability**: Add new providers easily
✅ **Cost Optimization**: Leverage provider-specific features (caching)
✅ **Reliability**: Consistent error handling and retries
✅ **Performance**: Singleton instances, connection pooling

### Next Steps

1. **Implement Phase 1-3** (Base abstraction + Claude refactor)
2. **Add OpenAI provider** (Phase 3)
3. **Update DocGenerator** (Phase 4)
4. **Test thoroughly** (Phase 6)
5. **Deploy to production** (Phase 8)
6. **Monitor metrics** (latency, tokens, cache hit rate)

---

**Questions? See [CLAUDE.md](../../CLAUDE.md) for project context or [API-Reference.md](../api/API-Reference.md) for endpoint documentation.**
