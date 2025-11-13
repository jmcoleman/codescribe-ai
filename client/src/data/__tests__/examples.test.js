import { describe, it, expect } from 'vitest';
import { codeSamples } from '../examples';

describe('Code Examples Data', () => {
  describe('Data Structure', () => {
    it('should be an array', () => {
      expect(Array.isArray(codeSamples)).toBe(true);
    });

    it('should have exactly 8 examples', () => {
      expect(codeSamples).toHaveLength(8);
    });

    it('should have all required properties for each example', () => {
      const requiredProperties = ['id', 'title', 'description', 'language', 'docType', 'code'];

      codeSamples.forEach(example => {
        requiredProperties.forEach(prop => {
          expect(example).toHaveProperty(prop);
          expect(example[prop]).toBeDefined();
          expect(example[prop]).not.toBe('');
        });
      });
    });

    it('should have unique IDs for all examples', () => {
      const ids = codeSamples.map(ex => ex.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(codeSamples.length);
    });
  });

  describe('Property Types', () => {
    it('should have string type for all properties', () => {
      codeSamples.forEach(example => {
        expect(typeof example.id).toBe('string');
        expect(typeof example.title).toBe('string');
        expect(typeof example.description).toBe('string');
        expect(typeof example.language).toBe('string');
        expect(typeof example.docType).toBe('string');
        expect(typeof example.code).toBe('string');
      });
    });

    it('should have non-empty strings for all properties', () => {
      codeSamples.forEach(example => {
        expect(example.id.length).toBeGreaterThan(0);
        expect(example.title.length).toBeGreaterThan(0);
        expect(example.description.length).toBeGreaterThan(0);
        expect(example.language.length).toBeGreaterThan(0);
        expect(example.docType.length).toBeGreaterThan(0);
        expect(example.code.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DocType Validation', () => {
    const validDocTypes = ['README', 'JSDOC', 'API', 'ARCHITECTURE'];

    it('should only use valid docTypes', () => {
      codeSamples.forEach(example => {
        expect(validDocTypes).toContain(example.docType);
      });
    });

    it('should not use mixed-case docTypes', () => {
      // Ensure no mixed-case docTypes (should be uppercase)
      codeSamples.forEach(example => {
        expect(example.docType).not.toBe('JSDoc');
        expect(example.docType).not.toBe('jsdoc');
        expect(example.docType).not.toBe('Api');
        expect(example.docType).not.toBe('Readme');
      });
    });

    it('should have examples for multiple docTypes', () => {
      const docTypes = [...new Set(codeSamples.map(ex => ex.docType))];
      expect(docTypes.length).toBeGreaterThan(1);
    });

    it('should have at least 1 API example', () => {
      const apiExamples = codeSamples.filter(ex => ex.docType === 'API');
      expect(apiExamples.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least 2 README examples', () => {
      const readmeExamples = codeSamples.filter(ex => ex.docType === 'README');
      expect(readmeExamples.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Language Validation', () => {
    // Valid languages that CodeScribe AI supports
    const validLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'ruby', 'php', 'c', 'cpp', 'csharp'];

    it('should only use valid supported languages', () => {
      codeSamples.forEach(example => {
        expect(validLanguages).toContain(example.language);
      });
    });

    it('should have at least one code example', () => {
      expect(codeSamples.length).toBeGreaterThan(0);
    });
  });

  describe('Code Content', () => {
    it('should have substantial code (> 100 characters) for each example', () => {
      codeSamples.forEach(example => {
        expect(example.code.length).toBeGreaterThan(100);
      });
    });

    it('should have multi-line code for each example', () => {
      codeSamples.forEach(example => {
        const lines = example.code.split('\n');
        expect(lines.length).toBeGreaterThan(10);
      });
    });

    it('should have valid JavaScript-like syntax (contains function/class/const/let/var)', () => {
      codeSamples.forEach(example => {
        const hasValidSyntax = /\b(function|class|const|let|var|import|export|async|await)\b/.test(example.code);
        expect(hasValidSyntax).toBe(true);
      });
    });

    it('should not have placeholder code like TODO or FIXME', () => {
      codeSamples.forEach(example => {
        expect(example.code).not.toMatch(/TODO:|FIXME:|XXX:/i);
      });
    });
  });

  describe('Description Quality', () => {
    it('should have descriptions longer than 30 characters', () => {
      codeSamples.forEach(example => {
        expect(example.description.length).toBeGreaterThan(30);
      });
    });

    it('should have descriptions ending with proper punctuation', () => {
      codeSamples.forEach(example => {
        const lastChar = example.description.trim().slice(-1);
        expect(['.', '!', '?']).toContain(lastChar);
      });
    });

    it('should have unique descriptions', () => {
      const descriptions = codeSamples.map(ex => ex.description);
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(codeSamples.length);
    });
  });

  describe('Title Quality', () => {
    it('should have titles shorter than 50 characters', () => {
      codeSamples.forEach(example => {
        expect(example.title.length).toBeLessThan(50);
      });
    });

    it('should have titles longer than 5 characters', () => {
      codeSamples.forEach(example => {
        expect(example.title.length).toBeGreaterThan(5);
      });
    });

    it('should have unique titles', () => {
      const titles = codeSamples.map(ex => ex.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(codeSamples.length);
    });

    it('should not have titles ending with punctuation', () => {
      codeSamples.forEach(example => {
        const lastChar = example.title.trim().slice(-1);
        expect(['.', '!', '?', ':']).not.toContain(lastChar);
      });
    });
  });

  describe('ID Format', () => {
    it('should use kebab-case for IDs', () => {
      codeSamples.forEach(example => {
        const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
        expect(example.id).toMatch(kebabCaseRegex);
      });
    });

    it('should have descriptive IDs', () => {
      codeSamples.forEach(example => {
        expect(example.id.length).toBeGreaterThan(3);
      });
    });
  });

  describe('Specific Examples', () => {
    it('should have "csharp-api" example', () => {
      const example = codeSamples.find(ex => ex.id === 'csharp-api');
      expect(example).toBeDefined();
      expect(example.title).toBe('C# ASP.NET Core API');
      expect(example.docType).toBe('API');
    });

    it('should have "java-spring-api" example', () => {
      const example = codeSamples.find(ex => ex.id === 'java-spring-api');
      expect(example).toBeDefined();
      expect(example.title).toBe('Java Spring Boot API');
      expect(example.docType).toBe('API');
    });

    it('should have "express-api" example', () => {
      const example = codeSamples.find(ex => ex.id === 'express-api');
      expect(example).toBeDefined();
      expect(example.title).toBe('Express API Endpoint');
      expect(example.docType).toBe('API');
    });

    it('should have "data-processor" example', () => {
      const example = codeSamples.find(ex => ex.id === 'data-processor');
      expect(example).toBeDefined();
      expect(example.title).toBe('Data Processing Algorithm');
      expect(example.docType).toBe('README');
    });

    it('should have "ruby-sinatra-api" example', () => {
      const example = codeSamples.find(ex => ex.id === 'ruby-sinatra-api');
      expect(example).toBeDefined();
      expect(example.title).toBe('Ruby Sinatra API');
      expect(example.docType).toBe('API');
    });

    it('should have "python-flask-api" example', () => {
      const example = codeSamples.find(ex => ex.id === 'python-flask-api');
      expect(example).toBeDefined();
      expect(example.title).toBe('Python Flask API');
      expect(example.language).toBe('python');
      expect(example.docType).toBe('API');
    });

    it('should have "microservices-architecture" example', () => {
      const example = codeSamples.find(ex => ex.id === 'microservices-architecture');
      expect(example).toBeDefined();
      expect(example.title).toBe('Microservices Architecture');
      expect(example.language).toBe('javascript');
      expect(example.docType).toBe('ARCHITECTURE');
    });

    it('should have "poorly-documented" example', () => {
      const example = codeSamples.find(ex => ex.id === 'poorly-documented');
      expect(example).toBeDefined();
      expect(example.title).toBe('Poorly Documented Utility');
      expect(example.docType).toBe('README');
    });
  });

  describe('Code Variety', () => {
    it('should have examples with different code patterns', () => {
      const patterns = {
        hasFunction: false,
        hasClass: false,
        hasAsync: false,
        hasExport: false,
        hasImport: false,
      };

      codeSamples.forEach(example => {
        if (/\bfunction\b/.test(example.code)) patterns.hasFunction = true;
        if (/\bclass\b/.test(example.code)) patterns.hasClass = true;
        if (/\basync\b/.test(example.code)) patterns.hasAsync = true;
        if (/\bexport\b/.test(example.code)) patterns.hasExport = true;
        if (/\bimport\b/.test(example.code)) patterns.hasImport = true;
      });

      // Should have at least 3 different patterns
      const patternCount = Object.values(patterns).filter(Boolean).length;
      expect(patternCount).toBeGreaterThanOrEqual(3);
    });

    it('should have varying code lengths', () => {
      const lengths = codeSamples.map(ex => ex.code.length);
      const minLength = Math.min(...lengths);
      const maxLength = Math.max(...lengths);

      // Should have variety (max > 2x min)
      expect(maxLength).toBeGreaterThan(minLength * 2);
    });
  });

  describe('Export Validation', () => {
    it('should export codeSamples as a named export', () => {
      expect(codeSamples).toBeDefined();
    });

    it('should be importable', () => {
      // If we got here, the import worked
      expect(true).toBe(true);
    });
  });
});
