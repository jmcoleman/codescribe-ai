/**
 * Unit tests for Mermaid diagram inclusion in docGenerator service
 *
 * Tests that prompts correctly include Mermaid diagram instructions
 * and that generated documentation can contain Mermaid diagrams.
 */

import { DocGeneratorService } from '../docGenerator.js';
import LLMService from '../llm/llmService.js';
import { parseCode } from '../codeParser.js';
import { calculateQualityScore } from '../qualityScorer.js';

// Mock dependencies
jest.mock('../llm/llmService.js');
jest.mock('../codeParser.js');
jest.mock('../qualityScorer.js');

describe('DocGeneratorService - Mermaid Diagram Support', () => {
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

  const mockAnalysis = {
    functions: [{ name: 'processData', params: ['input'] }],
    classes: [{ name: 'DataProcessor' }],
    exports: ['processData', 'DataProcessor'],
    complexity: 'medium',
  };

  const mockQualityScore = {
    score: 85,
    grade: 'B',
    breakdown: {},
    summary: { strengths: [], improvements: [] },
  };

  describe('Prompt Generation - Mermaid Instructions', () => {
    describe('README prompts', () => {
      it('should include Mermaid diagram instructions in README prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'README', 'javascript');

        expect(systemPrompt + userMessage).toContain('MERMAID DIAGRAMS:');
        expect(systemPrompt + userMessage).toContain('Include Mermaid diagrams');
        expect(systemPrompt + userMessage).toContain('```mermaid');
      });

      it('should specify flowchart syntax for README', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'README', 'javascript');

        expect(systemPrompt + userMessage).toContain('flowchart TD');
        expect(systemPrompt + userMessage).toContain('flowchart LR');
      });

      it('should provide Mermaid syntax rules in README prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'README', 'javascript');

        expect(systemPrompt + userMessage).toContain('Mermaid syntax rules');
        expect(systemPrompt + userMessage).toContain('CRITICAL - Follow exactly');
        expect(systemPrompt + userMessage).toContain('Node IDs:');
        expect(systemPrompt + userMessage).toContain('Arrow syntax:');
        expect(systemPrompt + userMessage).toContain('Use --> only');
      });

      it('should include correct Mermaid example in README prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'README', 'javascript');

        // Example from COMMON.txt
        expect(systemPrompt + userMessage).toContain('Client[Client App] --> API[API Server]');
        expect(systemPrompt + userMessage).toContain('API --> Auth[Auth Service]');
        expect(systemPrompt + userMessage).toContain('API --> DB[(Database)]');
      });

      it('should warn against incorrect Mermaid syntax in README prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'README', 'javascript');

        // COMMON.txt uses "CRITICAL - Characters to AVOID in labels" section
        expect(systemPrompt + userMessage).toContain('CRITICAL - Characters to AVOID in labels');
        expect(systemPrompt + userMessage).toContain('NEVER use forward slashes');
        expect(systemPrompt + userMessage).toContain('NEVER use special characters in node IDs');
      });
    });

    describe('API prompts', () => {
      it('should include Mermaid diagram instructions in API prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'API', 'javascript');

        expect(systemPrompt + userMessage).toContain('MERMAID DIAGRAMS:');
        expect(systemPrompt + userMessage).toContain('Include Mermaid sequence diagrams');
        expect(systemPrompt + userMessage).toContain('```mermaid');
      });

      it('should specify sequence diagram syntax for API', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'API', 'javascript');

        expect(systemPrompt + userMessage).toContain('sequenceDiagram');
        expect(systemPrompt + userMessage).toContain('participant');
      });

      it('should provide sequence diagram example in API prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'API', 'javascript');

        // Example from COMMON.txt
        expect(systemPrompt + userMessage).toContain('participant C as Client');
        expect(systemPrompt + userMessage).toContain('participant A as API');
        expect(systemPrompt + userMessage).toContain('C->>A: GET /users');
        expect(systemPrompt + userMessage).toContain('A-->>C: 200 OK');
      });

      it('should explain arrow syntax for sequence diagrams in API prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'API', 'javascript');

        expect(systemPrompt + userMessage).toContain('->> for requests');
        expect(systemPrompt + userMessage).toContain('-->> for responses');
      });
    });

    describe('ARCHITECTURE prompts', () => {
      it('should include Mermaid diagram instructions in ARCHITECTURE prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'ARCHITECTURE', 'javascript');

        expect(systemPrompt + userMessage).toContain('MERMAID DIAGRAMS:');
        expect(systemPrompt + userMessage).toContain('ALWAYS include Mermaid diagrams');
        expect(systemPrompt + userMessage).toContain('```mermaid');
      });

      it('should emphasize diagram importance in ARCHITECTURE prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'ARCHITECTURE', 'javascript');

        expect(systemPrompt + userMessage).toContain('ALWAYS include Mermaid diagrams');
        expect(systemPrompt + userMessage).toContain('visualize system architecture');
        expect(systemPrompt + userMessage).toContain('component relationships');
        expect(systemPrompt + userMessage).toContain('data flow');
      });

      it('should provide architecture-specific Mermaid example', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'ARCHITECTURE', 'javascript');

        // Example from COMMON.txt (shared across all doc types)
        expect(systemPrompt + userMessage).toContain('Client[Client App] --> API[API Server]');
        expect(systemPrompt + userMessage).toContain('Auth[Auth Service]');
        expect(systemPrompt + userMessage).toContain('DB[(Database)]');
      });

      it('should explain database shape syntax in ARCHITECTURE prompt', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'ARCHITECTURE', 'javascript');

        expect(systemPrompt + userMessage).toContain('Database shape:');
        expect(systemPrompt + userMessage).toContain('[(Database Name)]');
      });
    });

    describe('JSDOC prompts', () => {
      it('should include Mermaid rules in JSDOC prompt (via COMMON.txt)', () => {
        const code = 'function test() {}';
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching(code, mockAnalysis, 'JSDOC', 'javascript');

        // JSDOC now includes COMMON.txt with Mermaid rules for consistency
        // (even though JSDoc typically doesn't use Mermaid, the rules are included)
        expect(systemPrompt + userMessage).toContain('MERMAID DIAGRAM RULES');
        expect(systemPrompt + userMessage).toContain('```mermaid');
      });
    });
  });

  describe('Documentation Generation with Mermaid Diagrams', () => {
    beforeEach(() => {
      parseCode.mockResolvedValue(mockAnalysis);
      calculateQualityScore.mockReturnValue(mockQualityScore);
    });

    it('should handle documentation with Mermaid flowchart', async () => {
      const docWithMermaid = `# Data Processor

## Architecture

\`\`\`mermaid
flowchart TD
    A[Input] --> B[Process]
    B --> C[Output]
\`\`\`

This is a simple data processor.`;

      mockLlmService.generate.mockResolvedValue({ text: docWithMermaid, metadata: { provider: 'claude', model: 'test-model' } });

      const result = await docGenerator.generateDocumentation('function test() {}', {
        docType: 'README',
      });

      expect(result.documentation).toContain('```mermaid');
      expect(result.documentation).toContain('flowchart TD');
      expect(result.documentation).toContain('A[Input] --> B[Process]');
    });

    it('should handle documentation with Mermaid sequence diagram', async () => {
      const docWithSequence = `# API Documentation

## Request Flow

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database
    C->>A: POST /data
    A->>D: INSERT data
    D-->>A: Success
    A-->>C: 201 Created
\`\`\`

API endpoint documentation.`;

      mockLlmService.generate.mockResolvedValue({ text: docWithSequence, metadata: { provider: 'claude', model: 'test-model' } });

      const result = await docGenerator.generateDocumentation('function test() {}', {
        docType: 'API',
      });

      expect(result.documentation).toContain('sequenceDiagram');
      expect(result.documentation).toContain('participant');
      expect(result.documentation).toContain('C->>A:');
    });

    it('should handle documentation with multiple Mermaid diagrams', async () => {
      const docWithMultipleDiagrams = `# System Documentation

## Component Flow

\`\`\`mermaid
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

## Data Flow

\`\`\`mermaid
flowchart LR
    Input --> Transform
    Transform --> Output
\`\`\`

Complete system documentation.`;

      mockLlmService.generate.mockResolvedValue({ text: docWithMultipleDiagrams, metadata: { provider: 'claude', model: 'test-model' } });

      const result = await docGenerator.generateDocumentation('function test() {}', {
        docType: 'ARCHITECTURE',
      });

      const mermaidBlocks = (result.documentation.match(/```mermaid/g) || []).length;
      expect(mermaidBlocks).toBeGreaterThanOrEqual(2);
    });

    it('should handle documentation without Mermaid diagrams', async () => {
      const docWithoutMermaid = `# Simple Function

A basic function that does something.

## Usage

\`\`\`javascript
const result = test();
\`\`\``;

      mockLlmService.generate.mockResolvedValue({ text: docWithoutMermaid, metadata: { provider: 'claude', model: 'test-model' } });

      const result = await docGenerator.generateDocumentation('function test() {}', {
        docType: 'README',
      });

      expect(result.documentation).not.toContain('```mermaid');
      expect(result.documentation).toBeDefined();
    });

    it('should preserve Mermaid diagram formatting during streaming', async () => {
      const chunks = [
        '# Documentation\n\n## Flow\n\n```mermaid\n',
        'flowchart TD\n',
        '    A[Start] --> B[Process]\n',
        '    B --> C[End]\n',
        '```\n\n',
        'End of doc.',
      ];

      const fullDoc = chunks.join('');

      mockLlmService.generateWithStreaming.mockImplementation(async (prompt, callback) => {
        for (const chunk of chunks) {
          callback(chunk);
        }
        return { text: fullDoc, metadata: { provider: 'claude', model: 'test-model' } };
      });

      const onChunk = jest.fn();

      const result = await docGenerator.generateDocumentation('function test() {}', {
        docType: 'README',
        streaming: true,
        onChunk,
      });

      // Verify chunks were called
      expect(onChunk).toHaveBeenCalledTimes(chunks.length);

      // Verify final documentation contains valid Mermaid
      expect(result.documentation).toContain('```mermaid');
      expect(result.documentation).toContain('flowchart TD');
      expect(result.documentation).toContain('A[Start] --> B[Process]');
    });
  });

  describe('Mermaid Syntax Validation in Prompts', () => {
    it('should enforce simple node IDs in all prompts', () => {
      const docTypes = ['README', 'API', 'ARCHITECTURE'];

      docTypes.forEach((docType) => {
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching('code', mockAnalysis, docType, 'javascript');

        if (docType !== 'JSDOC') {
          // README and ARCHITECTURE have "Node IDs:", API has "Participant names:"
          expect(systemPrompt + userMessage).toContain('NO special characters');
        }
      });
    });

    it('should prohibit incorrect arrow syntax in all prompts', () => {
      const docTypes = ['README', 'API', 'ARCHITECTURE'];

      docTypes.forEach((docType) => {
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching('code', mockAnalysis, docType, 'javascript');

        if (docType !== 'JSDOC') {
          expect(systemPrompt + userMessage).toContain('AVOID');
          expect(systemPrompt + userMessage).toMatch(/==>|other arrow types?/i);
        }
      });
    });

    it('should provide correct syntax examples in all prompts', () => {
      const readme = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'README', 'javascript');
      const api = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'API', 'javascript');
      const arch = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'ARCHITECTURE', 'javascript');

      const readmePrompt = readme.systemPrompt + readme.userMessage;
      const apiPrompt = api.systemPrompt + api.userMessage;
      const archPrompt = arch.systemPrompt + arch.userMessage;

      // All prompts should have COMMON.txt Mermaid rules via shared content
      // README should have flowchart example from COMMON.txt
      expect(readmePrompt).toContain('flowchart TD');
      expect(readmePrompt).toContain('Client[Client App] --> API[API Server]');

      // API should have sequence diagram example from COMMON.txt
      expect(apiPrompt).toContain('sequenceDiagram');
      expect(apiPrompt).toContain('C->>A: GET /users');

      // ARCHITECTURE should have flowchart and database example from COMMON.txt
      expect(archPrompt).toContain('API --> DB[(Database)]');
      expect(archPrompt).toContain('[(Database)]');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      parseCode.mockResolvedValue(mockAnalysis);
      calculateQualityScore.mockReturnValue(mockQualityScore);
    });

    it('should handle incomplete Mermaid diagram in documentation', async () => {
      const incompleteDoc = `# Docs

\`\`\`mermaid
flowchart TD
    A[Start]
\`\`\`

Rest of docs.`;

      mockLlmService.generate.mockResolvedValue({ text: incompleteDoc, metadata: { provider: 'claude', model: 'test-model' } });

      const result = await docGenerator.generateDocumentation('function test() {}');

      expect(result.documentation).toContain('```mermaid');
      expect(result.documentation).toBeDefined();
    });

    it('should handle Mermaid diagram with syntax errors', async () => {
      const docWithError = `# Docs

\`\`\`mermaid
flowchart TD
    [Invalid] ==> [Syntax]
\`\`\`

Text.`;

      mockLlmService.generate.mockResolvedValue({ text: docWithError, metadata: { provider: 'claude', model: 'test-model' } });

      const result = await docGenerator.generateDocumentation('function test() {}');

      // Documentation should still be generated even with invalid Mermaid
      expect(result.documentation).toBeDefined();
      expect(result.documentation).toContain('```mermaid');
    });

    it('should handle documentation with only Mermaid diagrams', async () => {
      const onlyMermaid = `\`\`\`mermaid
flowchart TD
    A --> B
    B --> C
\`\`\``;

      mockLlmService.generate.mockResolvedValue({ text: onlyMermaid, metadata: { provider: 'claude', model: 'test-model' } });

      const result = await docGenerator.generateDocumentation('function test() {}');

      expect(result.documentation).toContain('```mermaid');
      expect(result.documentation).toContain('flowchart TD');
    });

    it('should handle very large Mermaid diagrams', async () => {
      const nodes = Array.from({ length: 50 }, (_, i) => `Node${i}`);
      const connections = nodes.slice(0, -1).map((node, i) => `    ${node}[Label ${i}] --> Node${i + 1}[Label ${i + 1}]`).join('\n');

      const largeDoc = `# Complex System

\`\`\`mermaid
flowchart TD
${connections}
\`\`\`

System documentation.`;

      mockLlmService.generate.mockResolvedValue({ text: largeDoc, metadata: { provider: 'claude', model: 'test-model' } });

      const result = await docGenerator.generateDocumentation('function test() {}', {
        docType: 'ARCHITECTURE',
      });

      expect(result.documentation).toContain('```mermaid');
      expect(result.documentation.length).toBeGreaterThan(1000);
    });
  });

  describe('Language-Specific Mermaid Support', () => {
    beforeEach(() => {
      parseCode.mockResolvedValue(mockAnalysis);
      calculateQualityScore.mockReturnValue(mockQualityScore);
    });

    it('should include Mermaid instructions for JavaScript', () => {
      const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'README', 'javascript');
      expect(systemPrompt + userMessage).toContain('MERMAID DIAGRAMS:');
    });

    it('should include Mermaid instructions for TypeScript', () => {
      const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'README', 'typescript');
      expect(systemPrompt + userMessage).toContain('MERMAID DIAGRAMS:');
    });

    it('should include Mermaid instructions for Python', () => {
      const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'README', 'python');
      expect(systemPrompt + userMessage).toContain('MERMAID DIAGRAMS:');
    });

    it('should include Mermaid instructions for all supported languages', () => {
      const languages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust'];

      languages.forEach((lang) => {
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'ARCHITECTURE', lang);
        expect(systemPrompt + userMessage).toContain('MERMAID DIAGRAMS:');
      });
    });
  });

  describe('Prompt Consistency', () => {
    it('should consistently format Mermaid instructions across doc types', () => {
      const readme = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'README', 'javascript');
      const api = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'API', 'javascript');
      const arch = docGenerator.buildPromptWithCaching('code', mockAnalysis, 'ARCHITECTURE', 'javascript');

      const readmePrompt = readme.systemPrompt + readme.userMessage;
      const apiPrompt = api.systemPrompt + api.userMessage;
      const archPrompt = arch.systemPrompt + arch.userMessage;

      // All should have Mermaid section header
      [readmePrompt, apiPrompt, archPrompt].forEach((prompt) => {
        expect(prompt).toContain('MERMAID DIAGRAMS:');
        expect(prompt).toContain('```mermaid');
        expect(prompt).toContain('IMPORTANT:');
      });
    });

    it('should include code fence format in all Mermaid instructions', () => {
      const docTypes = ['README', 'API', 'ARCHITECTURE'];

      docTypes.forEach((docType) => {
        const { systemPrompt, userMessage } = docGenerator.buildPromptWithCaching('code', mockAnalysis, docType, 'javascript');
        expect(systemPrompt + userMessage).toContain('```mermaid');
        expect(systemPrompt + userMessage).toMatch(/```mermaid[\s\S]*?```/);
      });
    });
  });
});
