import Anthropic from '@anthropic-ai/sdk';

class ClaudeClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.model = 'claude-sonnet-4-5-20250929';
    this.maxRetries = 3;
  }

  /**
   * Extract user-friendly error message from Anthropic API errors
   * @param {Error} error - The error from Anthropic SDK
   * @returns {string} User-friendly error message (JSON string for structured errors)
   */
  extractErrorMessage(error) {
    // Try to parse error.message if it contains JSON (from Anthropic SDK errors)
    if (error.message) {
      try {
        // Check if message contains a JSON error object
        // Format: "400 {"type":"error","error":{"type":"invalid_request_error","message":"..."}}"
        const jsonMatch = error.message.match(/\d{3}\s+(\{.*\})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);

          // Handle nested structure: {error: {type: "...", message: "..."}}
          if (parsed.error && typeof parsed.error === 'object' && parsed.error.message) {
            return JSON.stringify({
              error: parsed.error.type || 'Error',
              message: parsed.error.message
            });
          }

          // Handle flat structure: {type: "...", message: "..."}
          if (parsed.message) {
            return JSON.stringify({
              error: parsed.type || 'Error',
              message: parsed.message
            });
          }
        }
      } catch (e) {
        // Not JSON, continue to return original message
      }

      return error.message;
    }

    // Check if error has a structured error object from Anthropic
    if (error.error && typeof error.error === 'object') {
      return JSON.stringify({
        error: error.error.type || 'Error',
        message: error.error.message || 'An error occurred while generating documentation'
      });
    }

    return 'An error occurred while generating documentation';
  }

  /**
   * Generate documentation without streaming
   * @param {string} prompt - The prompt to send to Claude (or user message if systemPrompt provided)
   * @param {Object} options - Generation options
   * @param {string} options.systemPrompt - Optional system prompt (will be cached)
   * @param {boolean} options.cacheUserMessage - Whether to cache the user message (for default/example code)
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, options = {}) {
    const { systemPrompt, cacheUserMessage = false } = options;
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        // Build request parameters
        const requestParams = {
          model: this.model,
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: cacheUserMessage
              ? [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral', ttl: '1h' } }]
              : prompt
          }],
        };

        // Add system prompt with caching if provided (1-hour TTL)
        if (systemPrompt) {
          requestParams.system = [
            {
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral', ttl: '1h' }
            }
          ];
        }

        const response = await this.client.messages.create(requestParams);

        // Log cache performance for monitoring
        if (response.usage) {
          const cacheStats = {
            input_tokens: response.usage.input_tokens || 0,
            cache_creation_input_tokens: response.usage.cache_creation_input_tokens || 0,
            cache_read_input_tokens: response.usage.cache_read_input_tokens || 0,
          };
          if (cacheStats.cache_creation_input_tokens > 0 || cacheStats.cache_read_input_tokens > 0) {
            console.log('[ClaudeClient] Cache stats:', cacheStats);
          }
        }

        return response.content[0].text;
      } catch (error) {
        retries++;
        if (retries === this.maxRetries) {
          // Log the full error for development debugging
          console.error('[ClaudeClient] Full API error after retries:', error);

          // Throw a new error with just the user-friendly message
          const userMessage = this.extractErrorMessage(error);
          const enhancedError = new Error(userMessage);
          // Preserve original error for backend logging, but don't send to frontend
          enhancedError.originalError = error;
          throw enhancedError;
        }

        // Exponential backoff
        await this.sleep(Math.pow(2, retries) * 1000);
      }
    }
  }

  /**
   * Generate documentation with streaming
   * @param {string} prompt - The prompt to send to Claude (or user message if systemPrompt provided)
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Generation options
   * @param {string} options.systemPrompt - Optional system prompt (will be cached)
   * @param {boolean} options.cacheUserMessage - Whether to cache the user message (for default/example code)
   * @returns {Promise<string>} Complete generated text
   */
  async generateWithStreaming(prompt, onChunk, options = {}) {
    const { systemPrompt, cacheUserMessage = false } = options;

    try {
      // Build request parameters
      const requestParams = {
        model: this.model,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: cacheUserMessage
            ? [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral', ttl: '1h' } }]
            : prompt
        }],
        stream: true,
      };

      // Add system prompt with caching if provided (1-hour TTL)
      if (systemPrompt) {
        requestParams.system = [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral', ttl: '1h' }
          }
        ];
      }

      const stream = await this.client.messages.create(requestParams);

      let fullText = '';
      let cacheStats = {
        input_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      };

      for await (const event of stream) {
        if (event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          fullText += chunk;
          onChunk(chunk);
        }

        // Capture usage stats from message_start event
        if (event.type === 'message_start' && event.message?.usage) {
          cacheStats = {
            input_tokens: event.message.usage.input_tokens || 0,
            cache_creation_input_tokens: event.message.usage.cache_creation_input_tokens || 0,
            cache_read_input_tokens: event.message.usage.cache_read_input_tokens || 0,
          };
        }
      }

      // Log cache performance for monitoring
      if (cacheStats.cache_creation_input_tokens > 0 || cacheStats.cache_read_input_tokens > 0) {
        console.log('[ClaudeClient] Streaming cache stats:', cacheStats);
      }

      return fullText;
    } catch (error) {
      // Log the full error for development debugging
      console.error('[ClaudeClient] Full API error:', error);

      // Throw a new error with just the user-friendly message
      const userMessage = this.extractErrorMessage(error);
      const enhancedError = new Error(userMessage);
      // Preserve original error for backend logging, but don't send to frontend
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export both the class (for testing) and a singleton instance (for use)
export { ClaudeClient };
export default new ClaudeClient();