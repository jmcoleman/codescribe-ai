/**
 * Mock Claude API client for testing
 * Simulates Claude API responses without making real API calls
 */

class MockClaudeClient {
  constructor() {
    this.mockResponses = [];
    this.mockStreamChunks = [];
    this.callCount = 0;
    this.streamCount = 0;
    this.shouldFail = false;
    this.failureError = new Error('Mock API Error');
  }

  /**
   * Configure a mock response for the next call
   * @param {string} text - Response text
   */
  setMockResponse(text) {
    this.mockResponses.push({
      content: [
        {
          type: 'text',
          text: text,
        },
      ],
    });
  }

  /**
   * Configure multiple mock responses (for sequential calls)
   * @param {Array<string>} responses - Array of response texts
   */
  setMockResponses(responses) {
    responses.forEach((text) => this.setMockResponse(text));
  }

  /**
   * Configure mock streaming chunks
   * @param {Array<string>} chunks - Array of text chunks to stream
   */
  setMockStreamChunks(chunks) {
    this.mockStreamChunks = chunks;
  }

  /**
   * Configure the mock to fail
   * @param {Error} error - Error to throw
   */
  setFailure(error) {
    this.shouldFail = true;
    if (error) {
      this.failureError = error;
    }
  }

  /**
   * Mock generateDocumentation method
   * @param {string} prompt - The prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Mock response
   */
  async generateDocumentation(prompt, options = {}) {
    this.callCount++;

    if (this.shouldFail) {
      throw this.failureError;
    }

    // Return queued response if available
    if (this.mockResponses.length > 0) {
      return this.mockResponses.shift();
    }

    // Default mock response
    return {
      content: [
        {
          type: 'text',
          text: `# Mock Documentation

This is a mock response for testing purposes.

## Installation

\`\`\`bash
npm install mock-package
\`\`\`

## Usage

\`\`\`javascript
const mock = require('mock-package');
mock.run();
\`\`\`

## API

### run()
Executes the main functionality.

**Parameters:** None
**Returns:** \`Promise<void>\`
`,
        },
      ],
    };
  }

  /**
   * Mock streamDocumentation method
   * @param {string} prompt - The prompt
   * @param {Object} options - Streaming options
   * @yields {Object} Mock stream chunks
   */
  async *streamDocumentation(prompt, options = {}) {
    this.streamCount++;

    if (this.shouldFail) {
      throw this.failureError;
    }

    // Use configured chunks or default chunks
    const chunks =
      this.mockStreamChunks.length > 0
        ? this.mockStreamChunks
        : [
            '# Mock ',
            'Documentation\n\n',
            'This is ',
            'streamed ',
            'content ',
            'for testing.\n\n',
            '## Installation\n\n',
            '```bash\n',
            'npm install\n',
            '```\n',
          ];

    for (const chunk of chunks) {
      yield {
        type: 'content_block_delta',
        delta: {
          type: 'text_delta',
          text: chunk,
        },
      };
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    // Send completion event
    yield {
      type: 'message_stop',
    };
  }

  /**
   * Reset the mock to initial state
   */
  reset() {
    this.mockResponses = [];
    this.mockStreamChunks = [];
    this.callCount = 0;
    this.streamCount = 0;
    this.shouldFail = false;
    this.failureError = new Error('Mock API Error');
  }

  /**
   * Get the number of times generateDocumentation was called
   * @returns {number} Call count
   */
  getCallCount() {
    return this.callCount;
  }

  /**
   * Get the number of times streamDocumentation was called
   * @returns {number} Stream count
   */
  getStreamCount() {
    return this.streamCount;
  }

  /**
   * Check if any API calls were made
   * @returns {boolean} True if called
   */
  wasCalled() {
    return this.callCount > 0 || this.streamCount > 0;
  }
}

module.exports = MockClaudeClient;
