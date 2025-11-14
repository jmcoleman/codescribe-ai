/**
 * Unit tests for docGenerator service
 */

import { DocGeneratorService } from '../docGenerator.js';
import LLMService from '../llm/llmService.js';
import { parseCode } from '../codeParser.js';
import { calculateQualityScore } from '../qualityScorer.js';

// Mock dependencies
jest.mock('../llm/llmService.js');
jest.mock('../codeParser.js');
jest.mock('../qualityScorer.js');

describe('DocGeneratorService', () => {
  let docGenerator;
  let mockLlmService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock llmService instance
    mockLlmService = {
      generate: jest.fn(),
      generateWithStreaming: jest.fn()
    };

    // Mock the LLMService constructor to return our mock
    LLMService.mockImplementation(() => mockLlmService);

    docGenerator = new DocGeneratorService();
  });

  describe('Constructor', () => {
    it('should create an instance', () => {
      expect(docGenerator).toBeInstanceOf(DocGeneratorService);
    });
  });

  describe('generateDocumentation()', () => {
    const sampleCode = `
function greet(name) {
  return \`Hello, \${name}!\`;
}
`;

    const mockAnalysis = {
      functions: [{ name: 'greet', params: ['name'] }],
      classes: [],
      exports: ['greet'],
      complexity: 'simple',
      metrics: {
        functions: 1,
        classes: 0,
        lines: 3,
      },
    };

    const mockDocumentation = '# Documentation\n\nThis is great documentation!';
    // Free tier attribution (default)
    const attribution = `\n\n\n\n---\n\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • **Free Tier***\n\n*Upgrade to [Pro](https://codescribeai.com/pricing) to remove this watermark and unlock advanced features*`;
    const mockDocumentationWithAttribution = mockDocumentation + attribution;

    const mockQualityScore = {
      score: 85,
      grade: 'B',
      breakdown: {
        overview: { present: true, points: 20 },
        installation: { present: true, points: 15 },
        examples: { count: 2, points: 15 },
        apiDocs: { coveragePercent: 100, points: 25 },
        structure: { headers: 4, points: 20 },
      },
      summary: {
        strengths: ['Good overview', 'Clear examples'],
        improvements: ['Add more examples'],
      },
    };

    beforeEach(() => {
      parseCode.mockResolvedValue(mockAnalysis);
      mockLlmService.generate.mockResolvedValue({ text: mockDocumentation, metadata: { provider: 'claude', model: 'test-model' } });
      mockLlmService.generateWithStreaming.mockResolvedValue({ text: mockDocumentation, metadata: { provider: 'claude', model: 'test-model' } });
      calculateQualityScore.mockReturnValue(mockQualityScore);
    });

    it('should generate README documentation successfully', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'README',
      });

      expect(result.documentation).toBe(mockDocumentationWithAttribution);
      expect(result.qualityScore).toEqual(mockQualityScore);
      expect(result.analysis).toEqual(mockAnalysis);
      expect(result.metadata).toHaveProperty('language', 'javascript');
      expect(result.metadata).toHaveProperty('docType', 'README');
      expect(result.metadata).toHaveProperty('generatedAt');
      expect(result.metadata).toHaveProperty('codeLength', sampleCode.length);
    });

    it('should parse code with correct language', async () => {
      await docGenerator.generateDocumentation(sampleCode, {
        language: 'typescript',
      });

      expect(parseCode).toHaveBeenCalledWith(sampleCode, 'typescript');
    });

    it('should use default language if not specified', async () => {
      await docGenerator.generateDocumentation(sampleCode);

      expect(parseCode).toHaveBeenCalledWith(sampleCode, 'javascript');
    });

    it('should build prompt with correct parameters', async () => {
      const buildPromptSpy = jest.spyOn(docGenerator, 'buildPromptWithCaching');

      await docGenerator.generateDocumentation(sampleCode, {
        docType: 'README',
        language: 'javascript',
      });

      expect(buildPromptSpy).toHaveBeenCalledWith(
        sampleCode,
        mockAnalysis,
        'README',
        'javascript'
      );
    });

    it('should call Claude API for generation', async () => {
      await docGenerator.generateDocumentation(sampleCode);

      expect(mockLlmService.generate).toHaveBeenCalledTimes(1);
      expect(mockLlmService.generate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          systemPrompt: expect.any(String),
          enableCaching: false
        })
      );
    });

    it('should calculate quality score with documentation and analysis', async () => {
      await docGenerator.generateDocumentation(sampleCode);

      expect(calculateQualityScore).toHaveBeenCalledWith(
        mockDocumentationWithAttribution,
        mockAnalysis,
        'README',
        sampleCode
      );
    });

    it('should support streaming generation', async () => {
      const onChunk = jest.fn();

      await docGenerator.generateDocumentation(sampleCode, {
        streaming: true,
        onChunk,
      });

      expect(mockLlmService.generateWithStreaming).toHaveBeenCalledWith(
        expect.any(String),
        onChunk,
        expect.objectContaining({
          systemPrompt: expect.any(String),
          enableCaching: false
        })
      );
      expect(mockLlmService.generate).not.toHaveBeenCalled();
    });

    it('should not use streaming if onChunk is not provided', async () => {
      await docGenerator.generateDocumentation(sampleCode, {
        streaming: true,
      });

      expect(mockLlmService.generate).toHaveBeenCalled();
      expect(mockLlmService.generateWithStreaming).not.toHaveBeenCalled();
    });

    it('should generate JSDOC documentation', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'JSDOC',
      });

      expect(result.documentation).toBe(mockDocumentationWithAttribution);
      expect(result.metadata.docType).toBe('JSDOC');
      const callArgs = mockLlmService.generate.mock.calls[0];
      expect(callArgs[1].systemPrompt).toContain('JSDoc');
    });

    it('should generate API documentation', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'API',
      });

      expect(result.documentation).toBe(mockDocumentationWithAttribution);
      expect(result.metadata.docType).toBe('API');
      const callArgs = mockLlmService.generate.mock.calls[0];
      expect(callArgs[1].systemPrompt).toContain('API documentation');
    });

    it('should generate ARCHITECTURE documentation', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'ARCHITECTURE',
      });

      expect(result.documentation).toBe(mockDocumentationWithAttribution);
      expect(result.metadata.docType).toBe('ARCHITECTURE');
      const callArgs = mockLlmService.generate.mock.calls[0];
      expect(callArgs[1].systemPrompt).toContain('architectural');
    });

    it('should default to README for unknown docType', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'UNKNOWN',
      });

      expect(result.documentation).toBe(mockDocumentationWithAttribution);
      const callArgs = mockLlmService.generate.mock.calls[0];
      expect(callArgs[1].systemPrompt).toContain('README.md');
    });

    it('should handle empty code gracefully', async () => {
      parseCode.mockResolvedValue({
        functions: [],
        classes: [],
        exports: [],
        complexity: 'simple',
        metrics: { functions: 0, classes: 0, lines: 0 },
      });

      const result = await docGenerator.generateDocumentation('', {
        docType: 'README',
      });

      expect(result.documentation).toBe(mockDocumentationWithAttribution);
      expect(result.metadata.codeLength).toBe(0);
    });

    it('should include timestamp in metadata', async () => {
      const beforeTime = new Date().toISOString();
      const result = await docGenerator.generateDocumentation(sampleCode);
      const afterTime = new Date().toISOString();

      expect(result.metadata.generatedAt).toBeDefined();
      expect(result.metadata.generatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
      expect(result.metadata.generatedAt >= beforeTime).toBe(true);
      expect(result.metadata.generatedAt <= afterTime).toBe(true);
    });

    it('should propagate parseCode errors', async () => {
      const parseError = new Error('Parse failed');
      parseCode.mockRejectedValue(parseError);

      await expect(
        docGenerator.generateDocumentation(sampleCode)
      ).rejects.toThrow('Parse failed');
    });

    it('should propagate Claude API errors', async () => {
      const apiError = new Error('API request failed');
      mockLlmService.generate.mockRejectedValue(apiError);

      await expect(
        docGenerator.generateDocumentation(sampleCode)
      ).rejects.toThrow('API request failed');
    });

    it('should handle quality scoring errors gracefully', async () => {
      calculateQualityScore.mockImplementation(() => {
        throw new Error('Quality scoring failed');
      });

      await expect(
        docGenerator.generateDocumentation(sampleCode)
      ).rejects.toThrow('Quality scoring failed');
    });
  });

  describe('buildPrompt()', () => {
    const sampleCode = 'function test() {}';
    const mockAnalysis = {
      functions: [{ name: 'test' }],
      classes: [],
      exports: ['test', 'helper'],
      complexity: 'simple',
    };

    it('should build README prompt with correct structure', () => {
      const prompt = docGenerator.buildPrompt(
        sampleCode,
        mockAnalysis,
        'README',
        'javascript'
      );

      expect(prompt).toContain('README.md');
      expect(prompt).toContain('Language: javascript');
      expect(prompt).toContain('Functions detected: 1');
      expect(prompt).toContain('Classes detected: 0');
      expect(prompt).toContain('Exports: test, helper');
      expect(prompt).toContain('Complexity: simple');
      expect(prompt).toContain('Project Overview');
      expect(prompt).toContain('Features');
      expect(prompt).toContain('Installation');
      expect(prompt).toContain('Usage');
      expect(prompt).toContain('API Documentation');
      expect(prompt).toContain(sampleCode);
    });

    it('should build JSDOC prompt with correct structure', () => {
      const prompt = docGenerator.buildPrompt(
        sampleCode,
        mockAnalysis,
        'JSDOC',
        'javascript'
      );

      expect(prompt).toContain('JSDoc');
      expect(prompt).toContain('@param tags');
      expect(prompt).toContain('@returns tag');
      expect(prompt).toContain('@throws tag');
      expect(prompt).toContain('@example tag');
      expect(prompt).toContain(sampleCode);
    });

    it('should build API prompt with correct structure', () => {
      const prompt = docGenerator.buildPrompt(
        sampleCode,
        mockAnalysis,
        'API',
        'javascript'
      );

      expect(prompt).toContain('API documentation');
      expect(prompt).toContain('Overview Section');
      expect(prompt).toContain('Installation/Setup Section');
      expect(prompt).toContain('Request parameters');
      expect(prompt).toContain('Response format');
      expect(prompt).toContain('Error responses');
      expect(prompt).toContain('Usage Examples');
      expect(prompt).toContain('QUALITY SCORING GUIDANCE');
      expect(prompt).toContain(sampleCode);
    });

    it('should build ARCHITECTURE prompt with correct structure', () => {
      const prompt = docGenerator.buildPrompt(
        sampleCode,
        mockAnalysis,
        'ARCHITECTURE',
        'javascript'
      );

      expect(prompt).toContain('architectural');
      expect(prompt).toContain('Architecture Overview');
      expect(prompt).toContain('Component Breakdown');
      expect(prompt).toContain('Data Flow');
      expect(prompt).toContain('Dependencies');
      expect(prompt).toContain('Design Patterns');
      expect(prompt).toContain('Scalability');
      expect(prompt).toContain(sampleCode);
    });

    it('should include code analysis in prompt', () => {
      const complexAnalysis = {
        functions: [{ name: 'fn1' }, { name: 'fn2' }, { name: 'fn3' }],
        classes: [{ name: 'MyClass' }],
        exports: ['fn1', 'fn2', 'MyClass'],
        complexity: 'medium',
      };

      const prompt = docGenerator.buildPrompt(
        sampleCode,
        complexAnalysis,
        'README',
        'typescript'
      );

      expect(prompt).toContain('Language: typescript');
      expect(prompt).toContain('Functions detected: 3');
      expect(prompt).toContain('Classes detected: 1');
      expect(prompt).toContain('fn1, fn2, MyClass');
      expect(prompt).toContain('Complexity: medium');
    });

    it('should handle no exports', () => {
      const analysisNoExports = {
        functions: [{ name: 'privateFunc' }],
        classes: [],
        exports: [],
        complexity: 'simple',
      };

      const prompt = docGenerator.buildPrompt(
        sampleCode,
        analysisNoExports,
        'README',
        'javascript'
      );

      expect(prompt).toContain('Exports: None');
    });

    it('should handle unknown complexity', () => {
      const analysisUnknownComplexity = {
        functions: [],
        classes: [],
        exports: [],
        complexity: undefined,
      };

      const prompt = docGenerator.buildPrompt(
        sampleCode,
        analysisUnknownComplexity,
        'README',
        'javascript'
      );

      expect(prompt).toContain('Complexity: Unknown');
    });

    it('should default to README prompt for unknown docType', () => {
      const prompt = docGenerator.buildPrompt(
        sampleCode,
        mockAnalysis,
        'UNKNOWN_TYPE',
        'javascript'
      );

      expect(prompt).toContain('README.md');
      expect(prompt).toContain('Project Overview');
    });

    it('should properly escape code in prompt', () => {
      const codeWithSpecialChars = 'const str = "Hello \\n World";';
      const prompt = docGenerator.buildPrompt(
        codeWithSpecialChars,
        mockAnalysis,
        'README',
        'javascript'
      );

      expect(prompt).toContain(codeWithSpecialChars);
    });

    it('should include language in code fence', () => {
      const prompt = docGenerator.buildPrompt(
        sampleCode,
        mockAnalysis,
        'README',
        'python'
      );

      expect(prompt).toContain('```python');
      expect(prompt).toContain('Language: python');
    });
  });

  describe('Integration with dependencies', () => {
    const sampleCode = `
export function add(a, b) {
  return a + b;
}
`;

    it('should call all dependencies in correct order', async () => {
      const mockAnalysis = {
        functions: [{ name: 'add', params: ['a', 'b'] }],
        classes: [],
        exports: ['add'],
        complexity: 'simple',
      };

      const mockDoc = '# Add Function\n\nAdds two numbers.';
      const mockDocWithAttribution = mockDoc + `\n\n\n\n---\n\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • **Free Tier***\n\n*Upgrade to [Pro](https://codescribeai.com/pricing) to remove this watermark and unlock advanced features*`;
      const mockScore = { score: 90, grade: 'A' };

      parseCode.mockResolvedValue(mockAnalysis);
      mockLlmService.generate.mockResolvedValue({ text: mockDoc, metadata: { provider: 'claude', model: 'test-model' } });
      calculateQualityScore.mockReturnValue(mockScore);

      const result = await docGenerator.generateDocumentation(sampleCode);

      // Verify call order
      expect(parseCode).toHaveBeenCalled();
      expect(mockLlmService.generate).toHaveBeenCalled();
      expect(calculateQualityScore).toHaveBeenCalled();

      // Verify result structure
      expect(result).toEqual({
        documentation: mockDocWithAttribution,
        qualityScore: mockScore,
        analysis: mockAnalysis,
        metadata: expect.objectContaining({
          language: 'javascript',
          docType: 'README',
          codeLength: sampleCode.length,
        }),
      });
    });

    it('should pass streaming callback correctly', async () => {
      const chunks = ['# Add', ' Function', '\n\nAdds numbers'];
      const fullDoc = chunks.join('');

      // Mock parse code
      parseCode.mockResolvedValue({
        functions: [{ name: 'add', params: ['a', 'b'] }],
        classes: [],
        exports: ['add'],
        complexity: 'simple',
      });

      // Mock streaming generation
      mockLlmService.generateWithStreaming.mockImplementation(
        async (prompt, callback) => {
          for (const chunk of chunks) {
            callback(chunk);
          }
          return { text: fullDoc, metadata: { provider: 'claude', model: 'test-model' } };
        }
      );

      // Mock quality score
      calculateQualityScore.mockReturnValue({ score: 85, grade: 'B' });

      const onChunk = jest.fn();

      await docGenerator.generateDocumentation(sampleCode, {
        streaming: true,
        onChunk,
      });

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, '# Add');
      expect(onChunk).toHaveBeenNthCalledWith(2, ' Function');
      expect(onChunk).toHaveBeenNthCalledWith(3, '\n\nAdds numbers');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large code files', async () => {
      const largeCode = 'function test() {}\n'.repeat(10000);

      parseCode.mockResolvedValue({
        functions: Array(10000)
          .fill()
          .map((_, i) => ({ name: `test${i}` })),
        classes: [],
        exports: [],
        complexity: 'complex',
      });

      mockLlmService.generate.mockResolvedValue({ text: '# Large Project\n\nDocs', metadata: { provider: 'claude', model: 'test-model' } });
      calculateQualityScore.mockReturnValue({ score: 70, grade: 'C' });

      const result = await docGenerator.generateDocumentation(largeCode);

      expect(result.metadata.codeLength).toBe(largeCode.length);
      expect(result.documentation).toBeDefined();
    });

    it('should handle code with no structure', async () => {
      const simpleCode = 'console.log("Hello");';

      parseCode.mockResolvedValue({
        functions: [],
        classes: [],
        exports: [],
        complexity: 'simple',
      });

      const simpleDoc = '# Simple Script';
      const simpleDocWithAttribution = simpleDoc + `\n\n\n\n---\n\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • **Free Tier***\n\n*Upgrade to [Pro](https://codescribeai.com/pricing) to remove this watermark and unlock advanced features*`;
      mockLlmService.generate.mockResolvedValue({ text: simpleDoc, metadata: { provider: 'claude', model: 'test-model' } });
      calculateQualityScore.mockReturnValue({ score: 50, grade: 'F' });

      const result = await docGenerator.generateDocumentation(simpleCode);

      expect(result.documentation).toBe(simpleDocWithAttribution);
      expect(result.analysis.functions).toHaveLength(0);
    });

    it('should handle multiple options simultaneously', async () => {
      parseCode.mockResolvedValue({
        functions: [],
        classes: [],
        exports: [],
      });

      const onChunk = jest.fn();
      mockLlmService.generateWithStreaming.mockResolvedValue({ text: '# Docs', metadata: { provider: 'claude', model: 'test-model' } });
      calculateQualityScore.mockReturnValue({ score: 80 });

      const result = await docGenerator.generateDocumentation('code', {
        docType: 'API',
        language: 'typescript',
        streaming: true,
        onChunk,
      });

      expect(parseCode).toHaveBeenCalledWith('code', 'typescript');
      expect(result.metadata.docType).toBe('API');
      expect(result.metadata.language).toBe('typescript');
      expect(mockLlmService.generateWithStreaming).toHaveBeenCalled();
    });
  });
});
