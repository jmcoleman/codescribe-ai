/**
 * Unit tests for LLM configuration
 */

import {
  LLM_PROVIDERS,
  getLLMConfig,
  getProviderCapabilities,
  logConfig
} from '../llm.config.js';

describe('LLM Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original env vars
    originalEnv = { ...process.env };

    // Clear LLM-related env vars
    delete process.env.LLM_PROVIDER;
    delete process.env.CLAUDE_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_MODEL;
    delete process.env.CLAUDE_MODEL;
    delete process.env.OPENAI_MODEL;
    delete process.env.LLM_MAX_TOKENS;
    delete process.env.LLM_MAX_RETRIES;
    delete process.env.LLM_TIMEOUT;
    delete process.env.LLM_TEMPERATURE;
    delete process.env.LLM_ENABLE_CACHING;

    // Need to clear module cache to reload config with new env vars
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env vars
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('LLM_PROVIDERS constant', () => {
    it('should export provider constants', () => {
      expect(LLM_PROVIDERS.CLAUDE).toBe('claude');
      expect(LLM_PROVIDERS.OPENAI).toBe('openai');
    });
  });

  describe('getLLMConfig()', () => {
    it('should load Claude config with CLAUDE_API_KEY', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-ant-test-key';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      expect(config.provider).toBe('claude');
      expect(config.apiKey).toBe('sk-ant-test-key');
      expect(config.model).toBe('claude-sonnet-4-5-20250929');
      expect(config.supportsCaching).toBe(true);
      expect(config.supportsStreaming).toBe(true);
    });

    it('should load OpenAI config with OPENAI_API_KEY', async () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      expect(config.provider).toBe('openai');
      expect(config.apiKey).toBe('sk-test-key');
      expect(config.model).toBe('gpt-5.1');
      expect(config.supportsCaching).toBe(false);
      expect(config.supportsStreaming).toBe(true);
    });

    it('should fall back to LLM_API_KEY if provider key not set', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.LLM_API_KEY = 'sk-generic-key';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      expect(config.apiKey).toBe('sk-generic-key');
    });

    it('should use LLM_MODEL override', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-key';
      process.env.LLM_MODEL = 'claude-3-opus';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      expect(config.model).toBe('claude-3-opus');
    });

    it('should use provider-specific model override', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-key';
      process.env.CLAUDE_MODEL = 'claude-3-5-sonnet';
      process.env.LLM_MODEL = 'generic-model';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      // Provider-specific should take precedence
      expect(config.model).toBe('claude-3-5-sonnet');
    });

    it('should load common settings with defaults', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-key';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      expect(config.maxTokens).toBe(4000);
      expect(config.maxRetries).toBe(3);
      expect(config.timeout).toBe(60000);
      expect(config.temperature).toBe(0.7);
      expect(config.enableCaching).toBe(true);
    });

    it('should load common settings from environment', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-key';
      process.env.LLM_MAX_TOKENS = '8000';
      process.env.LLM_MAX_RETRIES = '5';
      process.env.LLM_TIMEOUT = '120000';
      process.env.LLM_TEMPERATURE = '0.5';
      process.env.LLM_ENABLE_CACHING = 'false';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      expect(config.maxTokens).toBe(8000);
      expect(config.maxRetries).toBe(5);
      expect(config.timeout).toBe(120000);
      expect(config.temperature).toBe(0.5);
      expect(config.enableCaching).toBe(false);
    });

    it('should throw error for unknown provider', async () => {
      process.env.LLM_PROVIDER = 'unknown';
      process.env.LLM_API_KEY = 'sk-key';

      const { getLLMConfig } = await import('../llm.config.js');

      expect(() => getLLMConfig()).toThrow('Unknown LLM provider: "unknown"');
    });

    it('should throw error when API key is missing', async () => {
      process.env.LLM_PROVIDER = 'claude';
      // No API key set

      const { getLLMConfig } = await import('../llm.config.js');

      expect(() => getLLMConfig()).toThrow('API key required for provider "claude"');
    });

    it('should default to Claude provider if not specified', async () => {
      // No LLM_PROVIDER set
      process.env.CLAUDE_API_KEY = 'sk-key';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      expect(config.provider).toBe('claude');
    });

    it('should handle case-insensitive provider names', async () => {
      process.env.LLM_PROVIDER = 'CLAUDE';
      process.env.CLAUDE_API_KEY = 'sk-key';

      const { getLLMConfig } = await import('../llm.config.js');
      const config = getLLMConfig();

      expect(config.provider).toBe('claude');
    });
  });

  describe('getProviderCapabilities()', () => {
    it('should return Claude capabilities', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-key';

      const { getProviderCapabilities } = await import('../llm.config.js');
      const capabilities = getProviderCapabilities('claude');

      expect(capabilities.supportsCaching).toBe(true);
      expect(capabilities.supportsStreaming).toBe(true);
    });

    it('should return OpenAI capabilities', async () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'sk-key';

      const { getProviderCapabilities } = await import('../llm.config.js');
      const capabilities = getProviderCapabilities('openai');

      expect(capabilities.supportsCaching).toBe(false);
      expect(capabilities.supportsStreaming).toBe(true);
    });

    it('should use current provider if not specified', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-key';

      const { getProviderCapabilities } = await import('../llm.config.js');
      const capabilities = getProviderCapabilities();

      expect(capabilities.supportsCaching).toBe(true);
      expect(capabilities.supportsStreaming).toBe(true);
    });

    it('should return false capabilities for unknown provider', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-key';

      const { getProviderCapabilities } = await import('../llm.config.js');
      const capabilities = getProviderCapabilities('unknown');

      expect(capabilities.supportsCaching).toBe(false);
      expect(capabilities.supportsStreaming).toBe(false);
    });

    it('should handle case-insensitive provider names', async () => {
      process.env.LLM_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = 'sk-key';

      const { getProviderCapabilities } = await import('../llm.config.js');
      const capabilities = getProviderCapabilities('OPENAI');

      expect(capabilities.supportsCaching).toBe(false);
      expect(capabilities.supportsStreaming).toBe(true);
    });
  });

  describe('logConfig()', () => {
    it('should log sanitized config without full API key', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-ant-test-key-12345';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { logConfig } = await import('../llm.config.js');
      logConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[LLMConfig] Configuration:',
        expect.stringContaining('sk-ant-t')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[LLMConfig] Configuration:',
        expect.not.stringContaining('sk-ant-test-key-12345')
      );

      consoleSpy.mockRestore();
    });

    it('should log provider and model', async () => {
      process.env.LLM_PROVIDER = 'claude';
      process.env.CLAUDE_API_KEY = 'sk-key';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { logConfig } = await import('../llm.config.js');
      logConfig();

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData).toContain('claude');
      expect(loggedData).toContain('claude-sonnet-4-5-20250929');

      consoleSpy.mockRestore();
    });
  });
});
