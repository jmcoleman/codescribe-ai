/**
 * Unit tests for docGenerator service
 */

import { DocGeneratorService } from '../docGenerator.js';
import claudeClient from '../claudeClient.js';
import { parseCode } from '../codeParser.js';
import { calculateQualityScore } from '../qualityScorer.js';

// Mock dependencies
jest.mock('../claudeClient.js');
jest.mock('../codeParser.js');
jest.mock('../qualityScorer.js');

describe('DocGeneratorService', () => {
  let docGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
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
      claudeClient.generate.mockResolvedValue(mockDocumentation);
      claudeClient.generateWithStreaming.mockResolvedValue(mockDocumentation);
      calculateQualityScore.mockReturnValue(mockQualityScore);
    });

    it('should generate README documentation successfully', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'README',
      });

      expect(result.documentation).toBe(mockDocumentation);
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
      const buildPromptSpy = jest.spyOn(docGenerator, 'buildPrompt');

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

      expect(claudeClient.generate).toHaveBeenCalledTimes(1);
      expect(claudeClient.generate).toHaveBeenCalledWith(
        expect.stringContaining('README.md')
      );
    });

    it('should calculate quality score with documentation and analysis', async () => {
      await docGenerator.generateDocumentation(sampleCode);

      expect(calculateQualityScore).toHaveBeenCalledWith(
        mockDocumentation,
        mockAnalysis,
        'README'
      );
    });

    it('should support streaming generation', async () => {
      const onChunk = jest.fn();

      await docGenerator.generateDocumentation(sampleCode, {
        streaming: true,
        onChunk,
      });

      expect(claudeClient.generateWithStreaming).toHaveBeenCalledWith(
        expect.any(String),
        onChunk
      );
      expect(claudeClient.generate).not.toHaveBeenCalled();
    });

    it('should not use streaming if onChunk is not provided', async () => {
      await docGenerator.generateDocumentation(sampleCode, {
        streaming: true,
      });

      expect(claudeClient.generate).toHaveBeenCalled();
      expect(claudeClient.generateWithStreaming).not.toHaveBeenCalled();
    });

    it('should generate JSDOC documentation', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'JSDOC',
      });

      expect(result.documentation).toBe(mockDocumentation);
      expect(result.metadata.docType).toBe('JSDOC');
      expect(claudeClient.generate).toHaveBeenCalledWith(
        expect.stringContaining('JSDoc')
      );
    });

    it('should generate API documentation', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'API',
      });

      expect(result.documentation).toBe(mockDocumentation);
      expect(result.metadata.docType).toBe('API');
      expect(claudeClient.generate).toHaveBeenCalledWith(
        expect.stringContaining('API documentation')
      );
    });

    it('should generate ARCHITECTURE documentation', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'ARCHITECTURE',
      });

      expect(result.documentation).toBe(mockDocumentation);
      expect(result.metadata.docType).toBe('ARCHITECTURE');
      expect(claudeClient.generate).toHaveBeenCalledWith(
        expect.stringContaining('architectural')
      );
    });

    it('should default to README for unknown docType', async () => {
      const result = await docGenerator.generateDocumentation(sampleCode, {
        docType: 'UNKNOWN',
      });

      expect(result.documentation).toBe(mockDocumentation);
      expect(claudeClient.generate).toHaveBeenCalledWith(
        expect.stringContaining('README.md')
      );
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

      expect(result.documentation).toBe(mockDocumentation);
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
      claudeClient.generate.mockRejectedValue(apiError);

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
      expect(prompt).toContain('Endpoint/Function Overview');
      expect(prompt).toContain('Parameters');
      expect(prompt).toContain('Return value');
      expect(prompt).toContain('Error responses');
      expect(prompt).toContain('Example request/response');
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
      const mockScore = { score: 90, grade: 'A' };

      parseCode.mockResolvedValue(mockAnalysis);
      claudeClient.generate.mockResolvedValue(mockDoc);
      calculateQualityScore.mockReturnValue(mockScore);

      const result = await docGenerator.generateDocumentation(sampleCode);

      // Verify call order
      expect(parseCode).toHaveBeenCalled();
      expect(claudeClient.generate).toHaveBeenCalled();
      expect(calculateQualityScore).toHaveBeenCalled();

      // Verify result structure
      expect(result).toEqual({
        documentation: mockDoc,
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
      claudeClient.generateWithStreaming.mockImplementation(
        async (prompt, callback) => {
          for (const chunk of chunks) {
            callback(chunk);
          }
          return fullDoc;
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

      claudeClient.generate.mockResolvedValue('# Large Project\n\nDocs');
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

      claudeClient.generate.mockResolvedValue('# Simple Script');
      calculateQualityScore.mockReturnValue({ score: 50, grade: 'F' });

      const result = await docGenerator.generateDocumentation(simpleCode);

      expect(result.documentation).toBe('# Simple Script');
      expect(result.analysis.functions).toHaveLength(0);
    });

    it('should handle multiple options simultaneously', async () => {
      parseCode.mockResolvedValue({
        functions: [],
        classes: [],
        exports: [],
      });

      const onChunk = jest.fn();
      claudeClient.generateWithStreaming.mockResolvedValue('# Docs');
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
      expect(claudeClient.generateWithStreaming).toHaveBeenCalled();
    });
  });
});
