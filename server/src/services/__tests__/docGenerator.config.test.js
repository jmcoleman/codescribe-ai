import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DocGeneratorService } from '../docGenerator.js';
import LLMService from '../llm/llmService.js';
import { parseCode } from '../codeParser.js';
import { calculateQualityScore } from '../qualityScorer.js';
import { DOC_TYPE_CONFIG } from '../../prompts/docTypeConfig.js';

// Mock dependencies
jest.mock('../llm/llmService.js');
jest.mock('../codeParser.js');
jest.mock('../qualityScorer.js');

describe('DocGeneratorService - Doc Type Configuration', () => {
  let docGenerator;
  let mockLlmService;

  const mockAnalysis = {
    functions: [{ name: 'testFunc' }],
    classes: [],
    exports: ['testFunc'],
    complexity: 'simple'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock llmService with configurable responses
    mockLlmService = {
      generate: jest.fn().mockImplementation((prompt, options) => {
        return Promise.resolve({
          text: `Generated doc with provider: ${options.provider}, model: ${options.model}`,
          metadata: {
            provider: options.provider,
            model: options.model,
            inputTokens: 100,
            outputTokens: 200
          }
        });
      }),
      generateWithStreaming: jest.fn().mockImplementation((prompt, onChunk, options) => {
        const text = `Streamed doc with provider: ${options.provider}`;
        onChunk(text);
        return Promise.resolve({
          text,
          metadata: {
            provider: options.provider,
            model: options.model,
            inputTokens: 100,
            outputTokens: 200
          }
        });
      })
    };

    // Mock the LLMService constructor
    LLMService.mockImplementation(() => mockLlmService);

    docGenerator = new DocGeneratorService();

    parseCode.mockResolvedValue(mockAnalysis);
    calculateQualityScore.mockReturnValue({
      total: 85,
      breakdown: { overview: 20, installation: 15, usage: 18, api: 20, structure: 12 }
    });
  });

  describe('Provider/Model Configuration per Doc Type', () => {
    it('should use configured provider/model for README', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'README', language: 'javascript' }
      );

      const expectedConfig = DOC_TYPE_CONFIG.README;
      expect(result.metadata.docTypeConfig).toEqual({
        provider: expectedConfig.provider,
        model: expectedConfig.model,
        temperature: expectedConfig.temperature
      });
    });

    it('should use configured provider/model for JSDOC', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'JSDOC', language: 'javascript' }
      );

      const expectedConfig = DOC_TYPE_CONFIG.JSDOC;
      expect(result.metadata.docTypeConfig).toEqual({
        provider: expectedConfig.provider,
        model: expectedConfig.model,
        temperature: expectedConfig.temperature
      });
    });

    it('should use configured provider/model for API', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'API', language: 'javascript' }
      );

      const expectedConfig = DOC_TYPE_CONFIG.API;
      expect(result.metadata.docTypeConfig).toEqual({
        provider: expectedConfig.provider,
        model: expectedConfig.model,
        temperature: expectedConfig.temperature
      });
    });

    it('should use configured provider/model for ARCHITECTURE', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'ARCHITECTURE', language: 'javascript' }
      );

      const expectedConfig = DOC_TYPE_CONFIG.ARCHITECTURE;
      expect(result.metadata.docTypeConfig).toEqual({
        provider: expectedConfig.provider,
        model: expectedConfig.model,
        temperature: expectedConfig.temperature
      });
    });

    it('should use configured provider/model for OPENAPI', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'OPENAPI', language: 'javascript' }
      );

      const expectedConfig = DOC_TYPE_CONFIG.OPENAPI;
      expect(result.metadata.docTypeConfig).toEqual({
        provider: expectedConfig.provider,
        model: expectedConfig.model,
        temperature: expectedConfig.temperature
      });
    });
  });

  describe('Metadata includes docTypeConfig', () => {
    it('should include docTypeConfig in response metadata', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'README', language: 'javascript' }
      );

      expect(result.metadata).toHaveProperty('docTypeConfig');
      expect(result.metadata.docTypeConfig).toHaveProperty('provider');
      expect(result.metadata.docTypeConfig).toHaveProperty('model');
      expect(result.metadata.docTypeConfig).toHaveProperty('temperature');
    });

    it('should include promptVersion in metadata', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'README', language: 'javascript' }
      );

      expect(result.metadata).toHaveProperty('promptVersion');
      expect(result.metadata.promptVersion).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it('should include all standard metadata fields', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'README', language: 'javascript' }
      );

      expect(result.metadata).toHaveProperty('provider');
      expect(result.metadata).toHaveProperty('model');
      expect(result.metadata).toHaveProperty('language');
      expect(result.metadata).toHaveProperty('docType');
      expect(result.metadata).toHaveProperty('generatedAt');
      expect(result.metadata).toHaveProperty('codeLength');
      expect(result.metadata).toHaveProperty('promptVersion');
      expect(result.metadata).toHaveProperty('docTypeConfig');
    });
  });

  describe('Configuration applies to different doc types', () => {
    it('should use correct temperature for structured docs', async () => {
      const jsdocResult = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'JSDOC', language: 'javascript' }
      );

      const apiResult = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'API', language: 'javascript' }
      );

      // JSDOC and API should have lower temperature
      expect(jsdocResult.metadata.docTypeConfig.temperature).toBeLessThanOrEqual(0.5);
      expect(apiResult.metadata.docTypeConfig.temperature).toBeLessThanOrEqual(0.5);
    });

    it('should use correct temperature for creative docs', async () => {
      const readmeResult = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'README', language: 'javascript' }
      );

      const archResult = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'ARCHITECTURE', language: 'javascript' }
      );

      // README and ARCHITECTURE should have higher temperature
      expect(readmeResult.metadata.docTypeConfig.temperature).toBeGreaterThanOrEqual(0.6);
      expect(archResult.metadata.docTypeConfig.temperature).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe('Streaming with doc type configuration', () => {
    it('should use doc type config in streaming mode', async () => {
      const chunks = [];

      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        {
          docType: 'README',
          language: 'javascript',
          streaming: true,
          onChunk: (chunk) => chunks.push(chunk)
        }
      );

      const expectedConfig = DOC_TYPE_CONFIG.README;
      expect(result.metadata.docTypeConfig).toEqual({
        provider: expectedConfig.provider,
        model: expectedConfig.model,
        temperature: expectedConfig.temperature
      });
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Unknown doc type handling', () => {
    it('should use default config for unknown doc type', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        { docType: 'UNKNOWN_TYPE', language: 'javascript' }
      );

      // Should fall back to default (null provider/model, uses env defaults)
      expect(result.metadata.docTypeConfig).toHaveProperty('provider');
      expect(result.metadata.docTypeConfig).toHaveProperty('model');
      expect(result.metadata.docTypeConfig.provider).toBe(null); // Default is null (use env)
      expect(result.metadata.docTypeConfig.model).toBe(null); // Default is null (use provider default)
    });
  });

  describe('Integration with caching', () => {
    it('should apply doc type config even with caching enabled', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}',
        {
          docType: 'JSDOC',
          language: 'javascript',
          isDefaultCode: true  // Enable caching
        }
      );

      expect(result.metadata.cacheEnabled).toBe(true);
      expect(result.metadata.docTypeConfig.temperature).toBe(0.3);
    });
  });

  describe('Backward compatibility', () => {
    it('should work with legacy API (no breaking changes)', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}'
      );

      expect(result).toHaveProperty('documentation');
      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('metadata');
    });

    it('should default to README doc type', async () => {
      const result = await docGenerator.generateDocumentation(
        'function test() {}'
      );

      expect(result.metadata.docType).toBe('README');
      expect(result.metadata.docTypeConfig.temperature).toBe(0.7);
    });
  });
});
