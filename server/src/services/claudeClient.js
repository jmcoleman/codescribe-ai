import Anthropic from '@anthropic-ai/sdk';

class ClaudeClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.model = 'claude-sonnet-4-20250514';
    this.maxRetries = 3;
  }

  /**
   * Extract user-friendly error message from Anthropic API errors
   * @param {Error} error - The error from Anthropic SDK
   * @returns {string} User-friendly error message
   */
  extractErrorMessage(error) {
    // Check if error has a structured error object from Anthropic
    if (error.error && typeof error.error === 'object') {
      // Return just the message field from the error object
      return error.error.message || error.message || 'An error occurred while generating documentation';
    }

    // Try to parse error.message if it contains JSON
    if (error.message) {
      try {
        // Check if message contains a JSON error object
        const jsonMatch = error.message.match(/\{.*"message".*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.message || error.message;
        }
      } catch (e) {
        // Not JSON, continue to return original message
      }

      return error.message;
    }

    return 'An error occurred while generating documentation';
  }

  /**
   * Generate documentation without streaming
   * @param {string} prompt - The prompt to send to Claude
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt) {
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        });

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
   * @param {string} prompt - The prompt to send to Claude
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<string>} Complete generated text
   */
  async generateWithStreaming(prompt, onChunk) {
    try {
      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      let fullText = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          fullText += chunk;
          onChunk(chunk);
        }
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