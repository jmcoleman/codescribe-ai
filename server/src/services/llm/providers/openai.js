/**
 * OpenAI Provider Adapter
 * Supports GPT-4, GPT-3.5, and compatible models
 */

import OpenAI from 'openai';
import { retryWithBackoff, standardizeError, estimateTokens } from '../utils.js';

// Singleton OpenAI client
let openaiClient = null

/**
 * Get or create OpenAI client instance
 * @param {string} apiKey - OpenAI API key
 * @returns {OpenAI} OpenAI client instance
 */
function getOpenAIClient(apiKey) {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

/**
 * Determine which max tokens parameter to use based on model
 * GPT-5+ uses max_completion_tokens, GPT-4 and earlier use max_tokens
 * @param {string} model - Model identifier
 * @returns {string} Parameter name to use ('max_completion_tokens' or 'max_tokens')
 */
function getMaxTokensParamName(model) {
  // GPT-5 and later models use max_completion_tokens
  // Check for gpt-5, gpt-6, etc.
  if (model.match(/gpt-([5-9]|\d{2,})/i)) {
    return 'max_completion_tokens';
  }
  // GPT-4 and earlier use max_tokens
  return 'max_tokens';
}

/**
 * Generate text with OpenAI (non-streaming)
 *
 * @param {string} prompt - User message/prompt
 * @param {Object} options - Generation options
 * @param {string} [options.systemPrompt] - System instructions
 * @param {boolean} [options.enableCaching] - Ignored for OpenAI (no prompt caching support)
 * @param {number} [options.maxTokens] - Override max tokens
 * @param {number} [options.temperature] - Sampling temperature
 * @param {number} [options.topP] - Nucleus sampling parameter
 * @param {Object} config - Provider configuration from llm.config.js
 * @returns {Promise<{text: string, metadata: Object}>}
 */
async function generateWithOpenAI(prompt, options = {}, config) {
  const client = getOpenAIClient(config.apiKey)
  const startTime = Date.now()

  try {
    const response = await retryWithBackoff(async () => {
      // Build messages array
      const messages = []

      // Add system message if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        })
      }

      // Add user message
      messages.push({
        role: 'user',
        content: prompt
      })

      // Build request parameters
      const requestParams = {
        model: config.model,
        messages
      }

      // Add max tokens parameter (GPT-5+ uses max_completion_tokens, GPT-4 and earlier use max_tokens)
      const maxTokensParam = getMaxTokensParamName(config.model);
      requestParams[maxTokensParam] = options.maxTokens || config.maxTokens;

      // Add optional parameters
      if (options.temperature !== undefined) {
        requestParams.temperature = options.temperature
      } else if (config.temperature !== undefined) {
        requestParams.temperature = config.temperature
      }

      if (options.topP !== undefined) {
        requestParams.top_p = options.topP
      } else if (config.topP !== undefined) {
        requestParams.top_p = config.topP
      }

      // Make API call
      return await client.chat.completions.create(requestParams)
    }, config.maxRetries, 'OpenAI generate')

    // Extract text from response
    const text = response.choices[0].message.content

    // Build metadata
    const metadata = {
      provider: 'openai',
      model: response.model,
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      cacheReadTokens: 0,  // OpenAI doesn't support explicit prompt caching
      cacheWriteTokens: 0,
      wasCached: false,
      latencyMs: Date.now() - startTime,
      timestamp: new Date()
    }

    return { text, metadata }

  } catch (error) {
    // Standardize error and throw
    throw standardizeError(error, 'openai', 'generate')
  }
}

/**
 * Generate text with OpenAI (streaming)
 *
 * @param {string} prompt - User message/prompt
 * @param {Function} onChunk - Callback for each text chunk: (chunk: string) => void
 * @param {Object} options - Generation options (same as generateWithOpenAI)
 * @param {Function} [options.onRetry] - Callback when retry occurs: (attempt, maxAttempts, delayMs, error, reason) => void
 * @param {Object} config - Provider configuration
 * @returns {Promise<{text: string, metadata: Object}>}
 */
async function streamWithOpenAI(prompt, onChunk, options = {}, config) {
  const client = getOpenAIClient(config.apiKey)
  const startTime = Date.now()
  let fullText = ''

  try {
    await retryWithBackoff(async () => {
      // Build messages array
      const messages = []

      // Add system message if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        })
      }

      // Add user message
      messages.push({
        role: 'user',
        content: prompt
      })

      // Build request parameters
      const requestParams = {
        model: config.model,
        messages,
        stream: true
      }

      // Add max tokens parameter (GPT-5+ uses max_completion_tokens, GPT-4 and earlier use max_tokens)
      const maxTokensParam = getMaxTokensParamName(config.model);
      requestParams[maxTokensParam] = options.maxTokens || config.maxTokens;

      // Add optional parameters
      if (options.temperature !== undefined) {
        requestParams.temperature = options.temperature
      } else if (config.temperature !== undefined) {
        requestParams.temperature = config.temperature
      }

      if (options.topP !== undefined) {
        requestParams.top_p = options.topP
      } else if (config.topP !== undefined) {
        requestParams.top_p = config.topP
      }

      // Create streaming request
      const stream = await client.chat.completions.create(requestParams)

      // Process stream chunks
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        if (delta) {
          fullText += delta
          onChunk(delta)
        }
      }
    }, config.maxRetries, 'OpenAI stream', { onRetry: options.onRetry })

    // Build metadata
    // Note: OpenAI doesn't provide token counts in streaming mode,
    // so we estimate them
    const systemPromptTokens = options.systemPrompt
      ? estimateTokens(options.systemPrompt)
      : 0
    const promptTokens = estimateTokens(prompt)
    const outputTokens = estimateTokens(fullText)

    const metadata = {
      provider: 'openai',
      model: config.model,
      inputTokens: systemPromptTokens + promptTokens,
      outputTokens: outputTokens,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      wasCached: false,
      latencyMs: Date.now() - startTime,
      timestamp: new Date(),
      isEstimated: true  // Flag to indicate token counts are estimated
    }

    return { text: fullText, metadata }

  } catch (error) {
    // Standardize error and throw
    throw standardizeError(error, 'openai', 'stream')
  }
}

export {
  generateWithOpenAI,
  streamWithOpenAI
}
