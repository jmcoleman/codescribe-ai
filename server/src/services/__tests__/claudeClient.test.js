/**
 * Unit tests for claudeClient service
 */

import Anthropic from '@anthropic-ai/sdk';
import { ClaudeClient } from '../claudeClient.js';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('ClaudeClient', () => {
  let claudeClient;
  let mockAnthropicInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock Anthropic client instance
    mockAnthropicInstance = {
      messages: {
        create: jest.fn(),
      },
    };

    // Mock the Anthropic constructor
    Anthropic.mockImplementation(() => mockAnthropicInstance);

    // Set up environment variable
    process.env.CLAUDE_API_KEY = 'test-api-key';

    // Create a new instance with mocked dependencies
    claudeClient = new ClaudeClient();
  });

  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  describe('Constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(Anthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
    });

    it('should set correct model', () => {
      expect(claudeClient.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('should set max retries to 3', () => {
      expect(claudeClient.maxRetries).toBe(3);
    });
  });

  describe('generate()', () => {
    const mockPrompt = 'Generate documentation for this code';
    const mockResponse = {
      content: [{ text: '# Documentation\n\nThis is great documentation!' }],
    };

    it('should generate documentation successfully', async () => {
      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const result = await claudeClient.generate(mockPrompt);

      expect(result).toBe('# Documentation\n\nThis is great documentation!');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [{ role: 'user', content: mockPrompt }],
      });
    });

    it('should call API with correct parameters', async () => {
      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      await claudeClient.generate(mockPrompt);

      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(1);
      const callArgs = mockAnthropicInstance.messages.create.mock.calls[0][0];
      expect(callArgs.model).toBe('claude-sonnet-4-5-20250929');
      expect(callArgs.max_tokens).toBe(4000);
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0].role).toBe('user');
      expect(callArgs.messages[0].content).toBe(mockPrompt);
    });

    it('should retry on failure with exponential backoff', async () => {
      const error = new Error('API Error');
      mockAnthropicInstance.messages.create
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockResponse);

      // Mock sleep to avoid actual delays
      jest.spyOn(claudeClient, 'sleep').mockResolvedValue();

      const result = await claudeClient.generate(mockPrompt);

      expect(result).toBe('# Documentation\n\nThis is great documentation!');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(3);
      expect(claudeClient.sleep).toHaveBeenCalledTimes(2);
      // First retry: 2^1 * 1000 = 2000ms
      expect(claudeClient.sleep).toHaveBeenNthCalledWith(1, 2000);
      // Second retry: 2^2 * 1000 = 4000ms
      expect(claudeClient.sleep).toHaveBeenNthCalledWith(2, 4000);
    });

    it('should throw error after max retries', async () => {
      const error = new Error('Persistent API Error');
      mockAnthropicInstance.messages.create.mockRejectedValue(error);

      // Mock sleep to avoid actual delays
      jest.spyOn(claudeClient, 'sleep').mockResolvedValue();

      await expect(claudeClient.generate(mockPrompt)).rejects.toThrow(
        'Persistent API Error'
      );
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(3);
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;

      mockAnthropicInstance.messages.create
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse);

      jest.spyOn(claudeClient, 'sleep').mockResolvedValue();

      const result = await claudeClient.generate(mockPrompt);

      expect(result).toBe('# Documentation\n\nThis is great documentation!');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(2);
    });

    it('should handle empty response gracefully', async () => {
      const emptyResponse = { content: [{ text: '' }] };
      mockAnthropicInstance.messages.create.mockResolvedValue(emptyResponse);

      const result = await claudeClient.generate(mockPrompt);

      expect(result).toBe('');
    });
  });

  describe('generateWithStreaming()', () => {
    const mockPrompt = 'Generate documentation with streaming';

    it('should stream documentation progressively', async () => {
      const chunks = ['# Doc', 'umen', 'tation', '\n\nGreat!'];
      const mockStream = (async function* () {
        for (const chunk of chunks) {
          yield {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: chunk },
          };
        }
      })();

      mockAnthropicInstance.messages.create.mockResolvedValue(mockStream);

      const onChunk = jest.fn();
      const result = await claudeClient.generateWithStreaming(
        mockPrompt,
        onChunk
      );

      expect(result).toBe('# Documentation\n\nGreat!');
      expect(onChunk).toHaveBeenCalledTimes(4);
      expect(onChunk).toHaveBeenNthCalledWith(1, '# Doc');
      expect(onChunk).toHaveBeenNthCalledWith(2, 'umen');
      expect(onChunk).toHaveBeenNthCalledWith(3, 'tation');
      expect(onChunk).toHaveBeenNthCalledWith(4, '\n\nGreat!');
    });

    it('should call API with streaming enabled', async () => {
      const mockStream = (async function* () {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'test' },
        };
      })();

      mockAnthropicInstance.messages.create.mockResolvedValue(mockStream);

      await claudeClient.generateWithStreaming(mockPrompt, () => {});

      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [{ role: 'user', content: mockPrompt }],
        stream: true,
      });
    });

    it('should filter out non-text delta events', async () => {
      const mockStream = (async function* () {
        yield { type: 'message_start' };
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Hello' },
        };
        yield { type: 'content_block_stop' };
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: ' World' },
        };
        yield { type: 'message_stop' };
      })();

      mockAnthropicInstance.messages.create.mockResolvedValue(mockStream);

      const onChunk = jest.fn();
      const result = await claudeClient.generateWithStreaming(
        mockPrompt,
        onChunk
      );

      expect(result).toBe('Hello World');
      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onChunk).toHaveBeenNthCalledWith(2, ' World');
    });

    it('should handle streaming errors', async () => {
      const mockStream = (async function* () {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Start' },
        };
        throw new Error('Stream interrupted');
      })();

      mockAnthropicInstance.messages.create.mockResolvedValue(mockStream);

      const onChunk = jest.fn();

      await expect(
        claudeClient.generateWithStreaming(mockPrompt, onChunk)
      ).rejects.toThrow('Stream interrupted');

      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(onChunk).toHaveBeenCalledWith('Start');
    });

    it('should return empty string for empty stream', async () => {
      const mockStream = (async function* () {
        // Empty stream
      })();

      mockAnthropicInstance.messages.create.mockResolvedValue(mockStream);

      const onChunk = jest.fn();
      const result = await claudeClient.generateWithStreaming(
        mockPrompt,
        onChunk
      );

      expect(result).toBe('');
      expect(onChunk).not.toHaveBeenCalled();
    });

    it('should accumulate all chunks correctly', async () => {
      const chunks = Array.from({ length: 10 }, (_, i) => `chunk${i} `);
      const mockStream = (async function* () {
        for (const chunk of chunks) {
          yield {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: chunk },
          };
        }
      })();

      mockAnthropicInstance.messages.create.mockResolvedValue(mockStream);

      const onChunk = jest.fn();
      const result = await claudeClient.generateWithStreaming(
        mockPrompt,
        onChunk
      );

      expect(result).toBe(chunks.join(''));
      expect(onChunk).toHaveBeenCalledTimes(10);
    });
  });

  describe('sleep()', () => {
    it('should delay for specified milliseconds', async () => {
      jest.useFakeTimers();

      const sleepPromise = claudeClient.sleep(1000);

      // Fast-forward time
      jest.advanceTimersByTime(999);
      await Promise.resolve(); // Allow microtasks to run

      // Should not be resolved yet
      let resolved = false;
      sleepPromise.then(() => {
        resolved = true;
      });

      await Promise.resolve();
      expect(resolved).toBe(false);

      // Fast-forward the remaining time
      jest.advanceTimersByTime(1);
      await sleepPromise;

      expect(resolved).toBe(true);

      jest.useRealTimers();
    });

    it('should work with different durations', async () => {
      const startTime = Date.now();
      await claudeClient.sleep(50);
      const elapsed = Date.now() - startTime;

      // Allow some margin for timing precision
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed API response', async () => {
      const malformedResponse = { content: [] };
      mockAnthropicInstance.messages.create.mockResolvedValue(
        malformedResponse
      );

      await expect(
        claudeClient.generate('test prompt')
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockAnthropicInstance.messages.create.mockRejectedValue(networkError);

      jest.spyOn(claudeClient, 'sleep').mockResolvedValue();

      await expect(
        claudeClient.generate('test prompt')
      ).rejects.toThrow('Network timeout');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key');
      authError.status = 401;
      mockAnthropicInstance.messages.create.mockRejectedValue(authError);

      jest.spyOn(claudeClient, 'sleep').mockResolvedValue();

      await expect(
        claudeClient.generate('test prompt')
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from nested error structure', () => {
      const error = new Error('400 {"type":"error","error":{"type":"invalid_request_error","message":"Invalid prompt format"}}');
      const result = claudeClient.extractErrorMessage(error);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('invalid_request_error');
      expect(parsed.message).toBe('Invalid prompt format');
    });

    it('should extract message from flat error structure', () => {
      const error = new Error('400 {"type":"invalid_request_error","message":"Rate limit exceeded"}');
      const result = claudeClient.extractErrorMessage(error);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('invalid_request_error');
      expect(parsed.message).toBe('Rate limit exceeded');
    });

    it('should handle JSON parse errors gracefully', () => {
      const error = new Error('400 {invalid json}');
      const result = claudeClient.extractErrorMessage(error);

      expect(result).toBe('400 {invalid json}');
    });

    it('should handle structured error object', () => {
      const error = {
        error: {
          type: 'authentication_error',
          message: 'Invalid API key'
        }
      };
      const result = claudeClient.extractErrorMessage(error);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('authentication_error');
      expect(parsed.message).toBe('Invalid API key');
    });

    it('should return default message for errors without message or error object', () => {
      const error = {};
      const result = claudeClient.extractErrorMessage(error);

      expect(result).toBe('An error occurred while generating documentation');
    });

    it('should return error message as-is if not JSON', () => {
      const error = new Error('Simple error message');
      const result = claudeClient.extractErrorMessage(error);

      expect(result).toBe('Simple error message');
    });
  });

  describe('Prompt Caching Options', () => {
    const mockResponse = {
      content: [{ text: 'Generated docs' }],
    };

    it('should include system prompt with caching in generate()', async () => {
      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      await claudeClient.generate('User prompt', {
        systemPrompt: 'You are a documentation expert'
      });

      const callArgs = mockAnthropicInstance.messages.create.mock.calls[0][0];
      expect(callArgs.system).toEqual([{
        type: 'text',
        text: 'You are a documentation expert',
        cache_control: { type: 'ephemeral', ttl: '1h' }
      }]);
    });

    it('should include system prompt with caching in generateWithStreaming()', async () => {
      const mockStream = (async function* () {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'test' },
        };
      })();
      mockAnthropicInstance.messages.create.mockResolvedValue(mockStream);

      await claudeClient.generateWithStreaming('User prompt', () => {}, {
        systemPrompt: 'You are a documentation expert'
      });

      const callArgs = mockAnthropicInstance.messages.create.mock.calls[0][0];
      expect(callArgs.system).toEqual([{
        type: 'text',
        text: 'You are a documentation expert',
        cache_control: { type: 'ephemeral', ttl: '1h' }
      }]);
    });

    it('should cache user message when cacheUserMessage is true in generate()', async () => {
      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      await claudeClient.generate('Default code example', {
        cacheUserMessage: true
      });

      const callArgs = mockAnthropicInstance.messages.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toEqual([{
        type: 'text',
        text: 'Default code example',
        cache_control: { type: 'ephemeral', ttl: '1h' }
      }]);
    });

    it('should cache user message when cacheUserMessage is true in generateWithStreaming()', async () => {
      const mockStream = (async function* () {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'test' },
        };
      })();
      mockAnthropicInstance.messages.create.mockResolvedValue(mockStream);

      await claudeClient.generateWithStreaming('Default code example', () => {}, {
        cacheUserMessage: true
      });

      const callArgs = mockAnthropicInstance.messages.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toEqual([{
        type: 'text',
        text: 'Default code example',
        cache_control: { type: 'ephemeral', ttl: '1h' }
      }]);
    });

    it('should use both systemPrompt and cacheUserMessage together', async () => {
      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      await claudeClient.generate('Default code', {
        systemPrompt: 'You are an expert',
        cacheUserMessage: true
      });

      const callArgs = mockAnthropicInstance.messages.create.mock.calls[0][0];
      expect(callArgs.system).toBeDefined();
      expect(callArgs.messages[0].content[0].cache_control).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle very long prompts', async () => {
      const longPrompt = 'a'.repeat(10000);
      const mockResponse = {
        content: [{ text: 'Documentation for long input' }],
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const result = await claudeClient.generate(longPrompt);

      expect(result).toBe('Documentation for long input');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: longPrompt }],
        })
      );
    });

    it('should handle special characters in prompts', async () => {
      const specialPrompt = 'Code with <tags> & "quotes" and \\backslashes\\';
      const mockResponse = {
        content: [{ text: 'Handled special chars' }],
      };

      mockAnthropicInstance.messages.create.mockResolvedValue(mockResponse);

      const result = await claudeClient.generate(specialPrompt);

      expect(result).toBe('Handled special chars');
    });

    it('should handle concurrent requests', async () => {
      const mockResponse1 = { content: [{ text: 'Response 1' }] };
      const mockResponse2 = { content: [{ text: 'Response 2' }] };
      const mockResponse3 = { content: [{ text: 'Response 3' }] };

      mockAnthropicInstance.messages.create
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)
        .mockResolvedValueOnce(mockResponse3);

      const promises = [
        claudeClient.generate('prompt1'),
        claudeClient.generate('prompt2'),
        claudeClient.generate('prompt3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual(['Response 1', 'Response 2', 'Response 3']);
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(3);
    });
  });
});
