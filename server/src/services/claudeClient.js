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
        if (retries === this.maxRetries) throw error;
        
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
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export both the class (for testing) and a singleton instance (for use)
export { ClaudeClient };
export default new ClaudeClient();