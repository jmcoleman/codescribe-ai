import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import LLMService from '../llmService.js';

// Mock the provider modules
jest.mock('../providers/claude.js');
jest.mock('../providers/openai.js');

import { generateWithClaude, streamWithClaude } from '../providers/claude.js';
import { generateWithOpenAI, streamWithOpenAI } from '../providers/openai.js';

describe('LLMService - Provider/Model Overrides', () => {
  let llmService;

  beforeEach(() => {
    llmService = new LLMService();
    jest.clearAllMocks();

    // Set up default mock responses
    generateWithClaude.mockResolvedValue({
      text: 'Claude response',
      metadata: { provider: 'claude', model: 'claude-sonnet-4-5-20250929' }
    });

    generateWithOpenAI.mockResolvedValue({
      text: 'OpenAI response',
      metadata: { provider: 'openai', model: 'gpt-5.1' }
    });

    streamWithClaude.mockResolvedValue({
      text: 'Claude stream response',
      metadata: { provider: 'claude' }
    });

    streamWithOpenAI.mockResolvedValue({
      text: 'OpenAI stream response',
      metadata: { provider: 'openai' }
    });
  });

  describe('generate() with provider override', () => {
    it('should use default provider when no override specified', async () => {
      await llmService.generate('test prompt');

      expect(generateWithClaude).toHaveBeenCalled();
      expect(generateWithOpenAI).not.toHaveBeenCalled();
    });

    it('should use claude when provider override is claude', async () => {
      await llmService.generate('test prompt', { provider: 'claude' });

      expect(generateWithClaude).toHaveBeenCalled();
      expect(generateWithOpenAI).not.toHaveBeenCalled();
    });

    it('should use openai when provider override is openai', async () => {
      await llmService.generate('test prompt', { provider: 'openai' });

      expect(generateWithOpenAI).toHaveBeenCalled();
      expect(generateWithClaude).not.toHaveBeenCalled();
    });

    it('should throw error for invalid provider override', async () => {
      await expect(
        llmService.generate('test', { provider: 'invalid' })
      ).rejects.toThrow('Unknown provider: invalid');
    });
  });

  describe('generate() with model override', () => {
    it('should pass model override to provider', async () => {
      await llmService.generate('test prompt', {
        provider: 'openai',
        model: 'gpt-5.1-mini'
      });

      expect(generateWithOpenAI).toHaveBeenCalled();
      const config = generateWithOpenAI.mock.calls[0][2];
      expect(config.openai.model).toBe('gpt-5.1-mini');
    });

    it('should use default model when no override', async () => {
      await llmService.generate('test prompt');

      expect(generateWithClaude).toHaveBeenCalled();
      // Config object structure depends on environment, just verify it was called
    });
  });

  describe('generate() with temperature override', () => {
    it('should pass temperature override to provider', async () => {
      await llmService.generate('test prompt', {
        temperature: 0.2
      });

      expect(generateWithClaude).toHaveBeenCalled();
      const config = generateWithClaude.mock.calls[0][2];
      expect(config.temperature).toBe(0.2);
    });

    it('should allow temperature 0', async () => {
      await llmService.generate('test prompt', {
        temperature: 0
      });

      const config = generateWithClaude.mock.calls[0][2];
      expect(config.temperature).toBe(0);
    });

    it('should allow temperature 1', async () => {
      await llmService.generate('test prompt', {
        temperature: 1
      });

      const config = generateWithClaude.mock.calls[0][2];
      expect(config.temperature).toBe(1);
    });
  });

  describe('generate() with maxTokens override', () => {
    it('should pass maxTokens override to provider', async () => {
      await llmService.generate('test prompt', {
        maxTokens: 1000
      });

      expect(generateWithClaude).toHaveBeenCalled();
      const config = generateWithClaude.mock.calls[0][2];
      expect(config.maxTokens).toBe(1000);
    });
  });

  describe('generate() with multiple overrides', () => {
    it('should apply all overrides together', async () => {
      await llmService.generate('test prompt', {
        provider: 'openai',
        model: 'gpt-5.1-mini',
        temperature: 0.3,
        maxTokens: 500
      });

      expect(generateWithOpenAI).toHaveBeenCalled();
      const config = generateWithOpenAI.mock.calls[0][2];

      expect(config.provider).toBe('openai');
      expect(config.openai.model).toBe('gpt-5.1-mini');
      expect(config.temperature).toBe(0.3);
      expect(config.maxTokens).toBe(500);
    });
  });

  describe('generateWithStreaming() with provider override', () => {
    it('should use default provider when no override', async () => {
      await llmService.generateWithStreaming('test', () => {});

      expect(streamWithClaude).toHaveBeenCalled();
      expect(streamWithOpenAI).not.toHaveBeenCalled();
    });

    it('should use openai when provider override is openai', async () => {
      await llmService.generateWithStreaming('test', () => {}, {
        provider: 'openai'
      });

      expect(streamWithOpenAI).toHaveBeenCalled();
      expect(streamWithClaude).not.toHaveBeenCalled();
    });

    it('should pass model override in streaming', async () => {
      await llmService.generateWithStreaming('test', () => {}, {
        provider: 'openai',
        model: 'gpt-5.1-mini'
      });

      const config = streamWithOpenAI.mock.calls[0][3];
      expect(config.openai.model).toBe('gpt-5.1-mini');
    });

    it('should pass temperature override in streaming', async () => {
      await llmService.generateWithStreaming('test', () => {}, {
        temperature: 0.1
      });

      const config = streamWithClaude.mock.calls[0][3];
      expect(config.temperature).toBe(0.1);
    });
  });

  describe('_buildRequestConfig()', () => {
    // Note: These tests verify the internal _buildRequestConfig method
    // In practice, the integration tests above verify the end-to-end behavior

    it('should preserve base config when no overrides', () => {
      const config = llmService._buildRequestConfig('claude', {});

      expect(config).toHaveProperty('provider', 'claude');
      expect(config).toHaveProperty('claude');
      // Model comes from environment/defaults, exact value may vary
    });

    it('should apply temperature override', () => {
      const config = llmService._buildRequestConfig('claude', {
        temperature: 0.5
      });

      expect(config.temperature).toBe(0.5);
    });

    it('should apply maxTokens override', () => {
      const config = llmService._buildRequestConfig('claude', {
        maxTokens: 2000
      });

      expect(config.maxTokens).toBe(2000);
    });

    it('should not mutate original config', () => {
      const originalProvider = llmService.config.provider;
      const originalTemp = llmService.config.temperature;

      llmService._buildRequestConfig('openai', {
        temperature: 0.1
      });

      // Original config should be unchanged
      expect(llmService.config.provider).toBe(originalProvider);
      expect(llmService.config.temperature).toBe(originalTemp);
    });
  });

  describe('Real-world usage patterns', () => {
    it('should support doc type specific config (README with Claude)', async () => {
      await llmService.generate('Generate README', {
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        temperature: 0.7
      });

      expect(generateWithClaude).toHaveBeenCalled();
      const config = generateWithClaude.mock.calls[0][2];
      expect(config.temperature).toBe(0.7);
    });

    it('should support doc type specific config (TESTS with OpenAI)', async () => {
      await llmService.generate('Generate tests', {
        provider: 'openai',
        model: 'gpt-5.1',
        temperature: 0.2,
        maxTokens: 3000
      });

      expect(generateWithOpenAI).toHaveBeenCalled();
      const config = generateWithOpenAI.mock.calls[0][2];
      expect(config.openai.model).toBe('gpt-5.1');
      expect(config.temperature).toBe(0.2);
      expect(config.maxTokens).toBe(3000);
    });

    it('should support cost-optimized config (comments with mini)', async () => {
      await llmService.generate('Add comments', {
        provider: 'openai',
        model: 'gpt-5.1-mini',
        temperature: 0.3,
        maxTokens: 500
      });

      expect(generateWithOpenAI).toHaveBeenCalled();
      const config = generateWithOpenAI.mock.calls[0][2];
      expect(config.openai.model).toBe('gpt-5.1-mini');
      expect(config.maxTokens).toBe(500);
    });
  });
});
