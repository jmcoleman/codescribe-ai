/**
 * Google Gemini Provider Adapter
 * Supports Gemini 2.0 Flash, Gemini 1.5 Pro, and compatible models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryWithBackoff, standardizeError, estimateTokens } from '../utils.js';

// Singleton Gemini client
let geminiClient = null;

/**
 * Get or create Gemini client instance
 * @param {string} apiKey - Google API key
 * @returns {GoogleGenerativeAI} Gemini client instance
 */
function getGeminiClient(apiKey) {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Generate text with Gemini (non-streaming)
 *
 * @param {string} prompt - User message/prompt
 * @param {Object} options - Generation options
 * @param {string} [options.systemPrompt] - System instructions
 * @param {boolean} [options.enableCaching] - Ignored for Gemini (no prompt caching support yet)
 * @param {number} [options.maxTokens] - Override max tokens
 * @param {number} [options.temperature] - Sampling temperature
 * @param {number} [options.topP] - Nucleus sampling parameter
 * @param {Object} config - Provider configuration from llm.config.js
 * @returns {Promise<{text: string, metadata: Object}>}
 */
async function generateWithGemini(prompt, options = {}, config) {
  const client = getGeminiClient(config.apiKey);
  const startTime = Date.now();

  try {
    const response = await retryWithBackoff(async () => {
      // Get the generative model
      const model = client.getGenerativeModel({ model: config.model });

      // Build generation config
      const generationConfig = {
        maxOutputTokens: options.maxTokens || config.maxTokens,
      };

      // Add temperature if specified
      if (options.temperature !== undefined) {
        generationConfig.temperature = options.temperature;
      } else if (config.temperature !== undefined) {
        generationConfig.temperature = config.temperature;
      }

      // Add topP if specified
      if (options.topP !== undefined) {
        generationConfig.topP = options.topP;
      } else if (config.topP !== undefined) {
        generationConfig.topP = config.topP;
      }

      // Build request parts
      const parts = [];

      // Add system instruction if provided (Gemini handles this differently)
      if (options.systemPrompt) {
        parts.push({ text: `System: ${options.systemPrompt}\n\nUser: ${prompt}` });
      } else {
        parts.push({ text: prompt });
      }

      // Make API call
      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig,
      });

      return result.response;
    }, config.maxRetries, 'Gemini generate');

    // Extract text from response
    const text = response.text();

    // Extract token usage (if available)
    const usageMetadata = response.usageMetadata || {};

    // Build metadata
    const metadata = {
      provider: 'gemini',
      model: config.model,
      inputTokens: usageMetadata.promptTokenCount || estimateTokens(prompt),
      outputTokens: usageMetadata.candidatesTokenCount || estimateTokens(text),
      cacheReadTokens: 0,  // Gemini doesn't support prompt caching yet
      cacheWriteTokens: 0,
      wasCached: false,
      latencyMs: Date.now() - startTime,
      timestamp: new Date(),
      isEstimated: !usageMetadata.promptTokenCount  // Flag if we estimated tokens
    };

    return { text, metadata };

  } catch (error) {
    // Standardize error and throw
    throw standardizeError(error, 'gemini', 'generate');
  }
}

/**
 * Generate text with Gemini (streaming)
 *
 * @param {string} prompt - User message/prompt
 * @param {Function} onChunk - Callback for each text chunk: (chunk: string) => void
 * @param {Object} options - Generation options (same as generateWithGemini)
 * @param {Function} [options.onRetry] - Callback when retry occurs: (attempt, maxAttempts, delayMs, error, reason) => void
 * @param {Object} config - Provider configuration
 * @returns {Promise<{text: string, metadata: Object}>}
 */
async function streamWithGemini(prompt, onChunk, options = {}, config) {
  const client = getGeminiClient(config.apiKey);
  const startTime = Date.now();
  let fullText = '';
  let usageMetadata = null;

  try {
    await retryWithBackoff(async () => {
      // Get the generative model
      const model = client.getGenerativeModel({ model: config.model });

      // Build generation config
      const generationConfig = {
        maxOutputTokens: options.maxTokens || config.maxTokens,
      };

      // Add temperature if specified
      if (options.temperature !== undefined) {
        generationConfig.temperature = options.temperature;
      } else if (config.temperature !== undefined) {
        generationConfig.temperature = config.temperature;
      }

      // Add topP if specified
      if (options.topP !== undefined) {
        generationConfig.topP = options.topP;
      } else if (config.topP !== undefined) {
        generationConfig.topP = config.topP;
      }

      // Build request parts
      const parts = [];

      // Add system instruction if provided
      if (options.systemPrompt) {
        parts.push({ text: `System: ${options.systemPrompt}\n\nUser: ${prompt}` });
      } else {
        parts.push({ text: prompt });
      }

      // Create streaming request
      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts }],
        generationConfig,
      });

      // Process stream chunks
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(chunkText);

        // Capture usage metadata if available
        if (chunk.usageMetadata) {
          usageMetadata = chunk.usageMetadata;
        }
      }
    }, config.maxRetries, 'Gemini stream', { onRetry: options.onRetry });

    // Build metadata
    // Note: Gemini may not provide token counts in streaming mode,
    // so we estimate them
    const systemPromptTokens = options.systemPrompt
      ? estimateTokens(options.systemPrompt)
      : 0;
    const promptTokens = estimateTokens(prompt);
    const outputTokens = estimateTokens(fullText);

    const metadata = {
      provider: 'gemini',
      model: config.model,
      inputTokens: usageMetadata?.promptTokenCount || (systemPromptTokens + promptTokens),
      outputTokens: usageMetadata?.candidatesTokenCount || outputTokens,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      wasCached: false,
      latencyMs: Date.now() - startTime,
      timestamp: new Date(),
      isEstimated: !usageMetadata?.promptTokenCount  // Flag to indicate token counts are estimated
    };

    return { text: fullText, metadata };

  } catch (error) {
    // Standardize error and throw
    throw standardizeError(error, 'gemini', 'stream');
  }
}

export {
  generateWithGemini,
  streamWithGemini
};
