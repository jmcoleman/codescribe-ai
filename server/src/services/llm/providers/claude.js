/**
 * Claude (Anthropic) Provider Adapter
 * Refactored from claudeClient.js for multi-provider architecture
 */

import Anthropic from '@anthropic-ai/sdk';
import { retryWithBackoff, standardizeError } from '../utils.js';

// Singleton Claude client
let claudeClient = null

/**
 * Get or create Claude client instance
 * @param {string} apiKey - Anthropic API key
 * @returns {Anthropic} Claude client instance
 */
function getClaudeClient(apiKey) {
  if (!claudeClient) {
    claudeClient = new Anthropic({ apiKey })
  }
  return claudeClient
}

/**
 * Generate text with Claude (non-streaming)
 *
 * @param {string} prompt - User message/prompt
 * @param {Object} options - Generation options
 * @param {string} [options.systemPrompt] - System instructions (will be cached)
 * @param {boolean} [options.enableCaching=false] - Enable prompt caching for user message
 * @param {number} [options.maxTokens] - Override max tokens
 * @param {number} [options.temperature] - Sampling temperature
 * @param {number} [options.topP] - Nucleus sampling parameter
 * @param {Object} config - Provider configuration from llm.config.js
 * @returns {Promise<{text: string, metadata: Object}>}
 */
async function generateWithClaude(prompt, options = {}, config) {
  const client = getClaudeClient(config.apiKey)
  const startTime = Date.now()

  try {
    const response = await retryWithBackoff(async () => {
      // Build messages array
      const messages = [{
        role: 'user',
        content: options.enableCaching && config.supportsCaching && config.enableCaching
          ? [{
              type: 'text',
              text: prompt,
              cache_control: { type: 'ephemeral', ttl: '1h' }
            }]
          : prompt
      }]

      // Build request parameters
      const requestParams = {
        model: config.model,
        max_tokens: options.maxTokens || config.maxTokens,
        messages
      }

      // Add system prompt with caching if provided
      if (options.systemPrompt) {
        requestParams.system = [{
          type: 'text',
          text: options.systemPrompt,
          cache_control: { type: 'ephemeral', ttl: '1h' }
        }]
      }

      // Add optional parameters
      // Note: Claude API doesn't allow both temperature and top_p to be specified
      // Default to temperature if both are provided
      if (options.temperature !== undefined) {
        requestParams.temperature = options.temperature
      } else if (options.topP !== undefined) {
        requestParams.top_p = options.topP
      } else if (config.temperature !== undefined) {
        requestParams.temperature = config.temperature
      }

      // Make API call
      return await client.messages.create(requestParams)
    }, config.maxRetries, 'Claude generate')

    // Extract text from response
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Build metadata
    const metadata = {
      provider: 'claude',
      model: response.model,
      inputTokens: response.usage.input_tokens || 0,
      outputTokens: response.usage.output_tokens || 0,
      cacheReadTokens: response.usage.cache_read_input_tokens || 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens || 0,
      wasCached: (response.usage.cache_read_input_tokens || 0) > 0,
      latencyMs: Date.now() - startTime,
      timestamp: new Date()
    }

    // Log cache performance
    if (metadata.cacheReadTokens > 0 || metadata.cacheWriteTokens > 0) {
      console.log('[Claude] Cache stats:', {
        input_tokens: metadata.inputTokens,
        cache_read: metadata.cacheReadTokens,
        cache_write: metadata.cacheWriteTokens,
        cached: metadata.wasCached
      })
    }

    return { text, metadata }

  } catch (error) {
    // Standardize error and throw
    throw standardizeError(error, 'claude', 'generate')
  }
}

/**
 * Generate text with Claude (streaming)
 *
 * @param {string} prompt - User message/prompt
 * @param {Function} onChunk - Callback for each text chunk: (chunk: string) => void
 * @param {Object} options - Generation options (same as generateWithClaude)
 * @param {Object} config - Provider configuration
 * @returns {Promise<{text: string, metadata: Object}>}
 */
async function streamWithClaude(prompt, onChunk, options = {}, config) {
  const client = getClaudeClient(config.apiKey)
  const startTime = Date.now()
  let fullText = ''
  let usage = null

  try {
    await retryWithBackoff(async () => {
      // Build messages array
      const messages = [{
        role: 'user',
        content: options.enableCaching && config.supportsCaching && config.enableCaching
          ? [{
              type: 'text',
              text: prompt,
              cache_control: { type: 'ephemeral', ttl: '1h' }
            }]
          : prompt
      }]

      // Build request parameters
      const requestParams = {
        model: config.model,
        max_tokens: options.maxTokens || config.maxTokens,
        messages,
        stream: true
      }

      // Add system prompt with caching if provided
      if (options.systemPrompt) {
        requestParams.system = [{
          type: 'text',
          text: options.systemPrompt,
          cache_control: { type: 'ephemeral', ttl: '1h' }
        }]
      }

      // Add optional parameters
      // Note: Claude API doesn't allow both temperature and top_p to be specified
      // Default to temperature if both are provided
      if (options.temperature !== undefined) {
        requestParams.temperature = options.temperature
      } else if (options.topP !== undefined) {
        requestParams.top_p = options.topP
      } else if (config.temperature !== undefined) {
        requestParams.temperature = config.temperature
      }

      // Create streaming request
      const stream = await client.messages.create(requestParams)

      // Process stream events
      for await (const event of stream) {
        // Handle text deltas
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text
          fullText += chunk
          onChunk(chunk)
        }

        // Capture usage stats from message_start event
        if (event.type === 'message_start' && event.message?.usage) {
          usage = event.message.usage
        }

        // Update usage stats from message_delta event (final counts)
        if (event.type === 'message_delta' && event.usage) {
          usage = { ...usage, ...event.usage }
        }
      }
    }, config.maxRetries, 'Claude stream')

    // Build metadata
    const metadata = {
      provider: 'claude',
      model: config.model,
      inputTokens: usage?.input_tokens || 0,
      outputTokens: usage?.output_tokens || 0,
      cacheReadTokens: usage?.cache_read_input_tokens || 0,
      cacheWriteTokens: usage?.cache_creation_input_tokens || 0,
      wasCached: (usage?.cache_read_input_tokens || 0) > 0,
      latencyMs: Date.now() - startTime,
      timestamp: new Date()
    }

    // Log cache performance
    if (metadata.cacheReadTokens > 0 || metadata.cacheWriteTokens > 0) {
      console.log('[Claude] Streaming cache stats:', {
        input_tokens: metadata.inputTokens,
        cache_read: metadata.cacheReadTokens,
        cache_write: metadata.cacheWriteTokens,
        cached: metadata.wasCached
      })
    }

    return { text: fullText, metadata }

  } catch (error) {
    // Standardize error and throw
    throw standardizeError(error, 'claude', 'stream')
  }
}

export {
  generateWithClaude,
  streamWithClaude
}
