import { describe, it, expect } from '@jest/globals';
import {
  loadSystemPrompts,
  loadUserMessageTemplates,
  processTemplate,
  getPromptVersion
} from '../promptLoader.js';

describe('promptLoader', () => {
  describe('loadSystemPrompts()', () => {
    it('should load all system prompts', () => {
      const prompts = loadSystemPrompts();

      expect(prompts).toHaveProperty('README');
      expect(prompts).toHaveProperty('JSDOC');
      expect(prompts).toHaveProperty('API');
      expect(prompts).toHaveProperty('ARCHITECTURE');
      expect(prompts).toHaveProperty('OPENAPI');
    });

    it('should load non-empty prompts', () => {
      const prompts = loadSystemPrompts();

      Object.entries(prompts).forEach(([docType, prompt]) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
      });
    });

    it('should load README prompt with correct content', () => {
      const prompts = loadSystemPrompts();

      expect(prompts.README).toContain('technical documentation expert');
      expect(prompts.README).toContain('README.md');
      expect(prompts.README).toContain('IMPORTANT:');
    });

    it('should load JSDOC prompt with correct content', () => {
      const prompts = loadSystemPrompts();

      expect(prompts.JSDOC).toContain('code documentation expert');
      expect(prompts.JSDOC).toContain('JSDoc');
      expect(prompts.JSDOC).toContain('@param');
    });

    it('should load API prompt with correct content', () => {
      const prompts = loadSystemPrompts();

      expect(prompts.API).toContain('API documentation');
      expect(prompts.API).toContain('Endpoint');
    });

    it('should load ARCHITECTURE prompt with correct content', () => {
      const prompts = loadSystemPrompts();

      expect(prompts.ARCHITECTURE).toContain('architect');
      expect(prompts.ARCHITECTURE).toContain('Architecture Overview');
    });

    it('should load OPENAPI prompt with correct content', () => {
      const prompts = loadSystemPrompts();

      expect(prompts.OPENAPI).toContain('OpenAPI');
      expect(prompts.OPENAPI).toContain('Swagger');
      expect(prompts.OPENAPI).toContain('specification');
    });
  });

  describe('loadUserMessageTemplates()', () => {
    it('should load all user message templates', () => {
      const templates = loadUserMessageTemplates();

      expect(templates).toHaveProperty('README');
      expect(templates).toHaveProperty('JSDOC');
      expect(templates).toHaveProperty('API');
      expect(templates).toHaveProperty('ARCHITECTURE');
      expect(templates).toHaveProperty('OPENAPI');
    });

    it('should load non-empty templates', () => {
      const templates = loadUserMessageTemplates();

      Object.entries(templates).forEach(([docType, template]) => {
        expect(typeof template).toBe('string');
        expect(template.length).toBeGreaterThan(0);
      });
    });

    it('should have template variables in user messages', () => {
      const templates = loadUserMessageTemplates();

      Object.entries(templates).forEach(([docType, template]) => {
        // Should contain at least {{code}} variable
        expect(template).toContain('{{code}}');
      });
    });
  });

  describe('processTemplate()', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{name}}!';
      const result = processTemplate(template, { name: 'World' });

      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const template = 'Language: {{language}}, Code: {{code}}';
      const result = processTemplate(template, {
        language: 'javascript',
        code: 'function test() {}'
      });

      expect(result).toBe('Language: javascript, Code: function test() {}');
    });

    it('should replace the same variable multiple times', () => {
      const template = '{{name}} likes {{name}}';
      const result = processTemplate(template, { name: 'Alice' });

      expect(result).toBe('Alice likes Alice');
    });

    it('should leave unmatched variables unchanged', () => {
      const template = 'Hello {{name}}, age: {{age}}';
      const result = processTemplate(template, { name: 'Bob' });

      expect(result).toBe('Hello Bob, age: {{age}}');
    });

    it('should handle empty template', () => {
      const result = processTemplate('', { name: 'test' });

      expect(result).toBe('');
    });

    it('should handle no variables', () => {
      const template = 'No variables here';
      const result = processTemplate(template, {});

      expect(result).toBe('No variables here');
    });

    it('should handle code template with backticks', () => {
      const template = 'Code:\n```{{language}}\n{{code}}\n```';
      const result = processTemplate(template, {
        language: 'javascript',
        code: 'const x = 1;'
      });

      expect(result).toBe('Code:\n```javascript\nconst x = 1;\n```');
    });

    it('should handle baseContext variable', () => {
      const template = '{{baseContext}}\n\nCode: {{code}}';
      const result = processTemplate(template, {
        baseContext: 'Language: javascript\nFunctions: 3',
        code: 'function hello() {}'
      });

      expect(result).toContain('Language: javascript');
      expect(result).toContain('Functions: 3');
      expect(result).toContain('function hello()');
    });
  });

  describe('getPromptVersion()', () => {
    it('should return a version string', () => {
      const version = getPromptVersion();

      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    it('should return semantic version format', () => {
      const version = getPromptVersion();

      // Should match vX.Y.Z format
      expect(version).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it('should return current version', () => {
      const version = getPromptVersion();

      // Should be at least v1.1.0 (when per-doc-type config was added)
      const versionNumber = version.substring(1); // Remove 'v'
      const [major, minor] = versionNumber.split('.').map(Number);

      expect(major).toBeGreaterThanOrEqual(1);
      if (major === 1) {
        expect(minor).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Integration: Full Template Processing', () => {
    it('should process a complete user message template', () => {
      const templates = loadUserMessageTemplates();
      const readmeTemplate = templates.README;

      const processed = processTemplate(readmeTemplate, {
        language: 'javascript',
        baseContext: 'Functions detected: 2\nClasses detected: 0',
        code: 'function add(a, b) { return a + b; }'
      });

      expect(processed).toContain('javascript');
      expect(processed).toContain('Functions detected: 2');
      expect(processed).toContain('function add(a, b)');
      expect(processed).not.toContain('{{');
    });
  });
});
