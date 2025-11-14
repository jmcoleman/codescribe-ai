/**
 * Unit tests for LLMService
 */

import LLMService from '../llm/llmService.js';
import { getLLMConfig } from '../../config/llm.config.js';
import * as claudeProvider from '../llm/providers/claude.js';
import * as openaiProvider from '../llm/providers/openai.js';

// Mock dependencies
jest.mock('../../config/llm.config.js');
jest.mock('../llm/providers/claude.js');
jest.mock('../llm/providers/openai.js');

describe('LLMService', () => {
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env.LLM_PROVIDER;
  });

  afterEach(() => {
    process.env.LLM_PROVIDER = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize with Claude provider by default', () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-claude-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      const service = new LLMService();

      expect(service.getProvider()).toBe('claude');
      expect(service.getModel()).toBe('claude-sonnet-4-5-20250929');
      expect(service.supportsCaching()).toBe(true);
    });

    it('should initialize with OpenAI provider when configured', () => {
      getLLMConfig.mockReturnValue({
        provider: 'openai',
        apiKey: 'test-openai-key',
        model: 'gpt-4-turbo-preview',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: false,
        supportsStreaming: true
      });

      const service = new LLMService();

      expect(service.getProvider()).toBe('openai');
      expect(service.getModel()).toBe('gpt-4-turbo-preview');
      expect(service.supportsCaching()).toBe(false);
    });

    it('should throw error for unsupported provider when generating', async () => {
      getLLMConfig.mockReturnValue({
        provider: 'unsupported',
        apiKey: 'test-key',
        model: 'test-model',
        maxTokens: 4000,
        temperature: 0.7
      });

      const service = new LLMService();
      await expect(service.generate('test')).rejects.toThrow('Unsupported LLM provider: unsupported');
    });

    it('should throw error when no API key provided', () => {
      getLLMConfig.mockImplementation(() => {
        throw new Error('API key required for provider "claude"');
      });

      expect(() => new LLMService()).toThrow('API key required');
    });
  });

  describe('generate()', () => {
    it('should call Claude provider for generation', async () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-claude-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      const mockResponse = {
        text: 'Generated documentation',
        metadata: {
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250929',
          tokens: { input: 100, output: 50 }
        }
      };

      claudeProvider.generateWithClaude.mockResolvedValue(mockResponse);

      const service = new LLMService();
      const result = await service.generate('Test prompt', {
        systemPrompt: 'System instructions',
        enableCaching: true
      });

      expect(claudeProvider.generateWithClaude).toHaveBeenCalledWith(
        'Test prompt',
        expect.objectContaining({
          systemPrompt: 'System instructions',
          enableCaching: true
        }),
        expect.objectContaining({
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250929',
          maxTokens: 4000,
          temperature: 0.7
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should call OpenAI provider for generation', async () => {
      getLLMConfig.mockReturnValue({
        provider: 'openai',
        apiKey: 'test-openai-key',
        model: 'gpt-4-turbo-preview',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: false,
        supportsStreaming: true
      });

      const mockResponse = {
        text: 'Generated documentation',
        metadata: {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          tokens: { input: 100, output: 50 }
        }
      };

      openaiProvider.generateWithOpenAI.mockResolvedValue(mockResponse);

      const service = new LLMService();
      const result = await service.generate('Test prompt', {
        systemPrompt: 'System instructions'
      });

      expect(openaiProvider.generateWithOpenAI).toHaveBeenCalledWith(
        'Test prompt',
        expect.objectContaining({
          systemPrompt: 'System instructions'
        }),
        expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          maxTokens: 4000,
          temperature: 0.7
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should pass through options to provider', async () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      claudeProvider.generateWithClaude.mockResolvedValue({
        text: 'test',
        metadata: { provider: 'claude', model: 'test' }
      });

      const service = new LLMService();
      await service.generate('prompt', {
        systemPrompt: 'system',
        maxTokens: 8000,
        temperature: 0.5,
        enableCaching: false
      });

      expect(claudeProvider.generateWithClaude).toHaveBeenCalledWith(
        'prompt',
        expect.objectContaining({
          systemPrompt: 'system',
          maxTokens: 8000,
          temperature: 0.5,
          enableCaching: false
        }),
        expect.any(Object) // Config object
      );
    });

    it('should handle provider errors', async () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      const error = new Error('API Error');
      claudeProvider.generateWithClaude.mockRejectedValue(error);

      const service = new LLMService();
      await expect(service.generate('prompt')).rejects.toThrow('API Error');
    });
  });

  describe('generateWithStreaming()', () => {
    it('should call Claude streaming provider', async () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      const mockResponse = {
        text: 'Streamed content',
        metadata: { provider: 'claude', model: 'test' }
      };

      claudeProvider.streamWithClaude.mockResolvedValue(mockResponse);

      const onChunk = jest.fn();
      const service = new LLMService();
      const result = await service.generateWithStreaming('prompt', onChunk, {
        systemPrompt: 'system'
      });

      expect(claudeProvider.streamWithClaude).toHaveBeenCalledWith(
        'prompt',
        onChunk,
        expect.objectContaining({
          systemPrompt: 'system'
        }),
        expect.any(Object) // Config object
      );
      expect(result).toEqual(mockResponse);
    });

    it('should call OpenAI streaming provider', async () => {
      getLLMConfig.mockReturnValue({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4-turbo-preview',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: false,
        supportsStreaming: true
      });

      const mockResponse = {
        text: 'Streamed content',
        metadata: { provider: 'openai', model: 'test' }
      };

      openaiProvider.streamWithOpenAI.mockResolvedValue(mockResponse);

      const onChunk = jest.fn();
      const service = new LLMService();
      const result = await service.generateWithStreaming('prompt', onChunk, {
        systemPrompt: 'system'
      });

      expect(openaiProvider.streamWithOpenAI).toHaveBeenCalledWith(
        'prompt',
        onChunk,
        expect.objectContaining({
          systemPrompt: 'system'
        }),
        expect.any(Object) // Config object
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle streaming errors', async () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      const error = new Error('Streaming Error');
      claudeProvider.streamWithClaude.mockRejectedValue(error);

      const service = new LLMService();
      await expect(
        service.generateWithStreaming('prompt', jest.fn())
      ).rejects.toThrow('Streaming Error');
    });
  });

  describe('getProvider()', () => {
    it('should return current provider name', () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      const service = new LLMService();
      expect(service.getProvider()).toBe('claude');
    });
  });

  describe('getModel()', () => {
    it('should return current model name', () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      const service = new LLMService();
      expect(service.getModel()).toBe('claude-sonnet-4-5-20250929');
    });
  });

  describe('supportsCaching()', () => {
    it('should return true for Claude provider', () => {
      getLLMConfig.mockReturnValue({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: true,
        supportsStreaming: true
      });

      const service = new LLMService();
      expect(service.supportsCaching()).toBe(true);
    });

    it('should return false for OpenAI provider', () => {
      getLLMConfig.mockReturnValue({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4-turbo-preview',
        maxTokens: 4000,
        temperature: 0.7,
        supportsCaching: false,
        supportsStreaming: true
      });

      const service = new LLMService();
      expect(service.supportsCaching()).toBe(false);
    });
  });
});
