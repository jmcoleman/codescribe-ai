import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TEST_DOCUMENTATION,
  TEST_QUALITY_SCORE,
  TEST_CODE,
  createTestDataLoader,
  exposeTestDataLoader,
} from '../testData';

describe('testData utilities', () => {
  describe('TEST_DOCUMENTATION', () => {
    it('should be a non-empty string', () => {
      expect(typeof TEST_DOCUMENTATION).toBe('string');
      expect(TEST_DOCUMENTATION.length).toBeGreaterThan(0);
    });

    it('should contain markdown headers', () => {
      expect(TEST_DOCUMENTATION).toContain('# Test Documentation');
      expect(TEST_DOCUMENTATION).toContain('## Overview');
    });

    it('should contain code blocks', () => {
      expect(TEST_DOCUMENTATION).toContain('```javascript');
      expect(TEST_DOCUMENTATION).toContain('```bash');
    });
  });

  describe('TEST_CODE', () => {
    it('should be a non-empty string', () => {
      expect(typeof TEST_CODE).toBe('string');
      expect(TEST_CODE.length).toBeGreaterThan(0);
    });

    it('should contain the hello function', () => {
      expect(TEST_CODE).toContain('function hello(name)');
      expect(TEST_CODE).toContain('console.log(hello(\'World\'))');
    });

    it('should contain demoDocumentationFeatures function', () => {
      expect(TEST_CODE).toContain('function demoDocumentationFeatures()');
    });

    it('should contain demo action methods', () => {
      expect(TEST_CODE).toContain('download()');
      expect(TEST_CODE).toContain('copy()');
      expect(TEST_CODE).toContain('score()');
    });

    it('should contain example usage', () => {
      expect(TEST_CODE).toContain('const docDemo = demoDocumentationFeatures()');
      expect(TEST_CODE).toContain('docDemo.download()');
      expect(TEST_CODE).toContain('docDemo.copy()');
      expect(TEST_CODE).toContain('docDemo.score()');
    });
  });

  describe('TEST_QUALITY_SCORE', () => {
    it('should have correct structure', () => {
      expect(TEST_QUALITY_SCORE).toHaveProperty('score');
      expect(TEST_QUALITY_SCORE).toHaveProperty('grade');
      expect(TEST_QUALITY_SCORE).toHaveProperty('docType');
      expect(TEST_QUALITY_SCORE).toHaveProperty('breakdown');
      expect(TEST_QUALITY_SCORE).toHaveProperty('summary');
    });

    it('should have valid score and grade', () => {
      expect(TEST_QUALITY_SCORE.score).toBe(85);
      expect(TEST_QUALITY_SCORE.grade).toBe('B');
      expect(TEST_QUALITY_SCORE.docType).toBe('README');
    });

    it('should have breakdown with all criteria', () => {
      const { breakdown } = TEST_QUALITY_SCORE;
      expect(breakdown).toHaveProperty('overview');
      expect(breakdown).toHaveProperty('installation');
      expect(breakdown).toHaveProperty('examples');
      expect(breakdown).toHaveProperty('apiDocs');
      expect(breakdown).toHaveProperty('structure');

      // Each criterion should have score, max, and suggestion
      Object.values(breakdown).forEach((criterion) => {
        expect(criterion).toHaveProperty('score');
        expect(criterion).toHaveProperty('max');
        expect(criterion).toHaveProperty('suggestion');
      });
    });

    it('should have summary with strengths and improvements', () => {
      const { summary } = TEST_QUALITY_SCORE;
      expect(summary).toHaveProperty('strengths');
      expect(summary).toHaveProperty('improvements');
      expect(Array.isArray(summary.strengths)).toBe(true);
      expect(Array.isArray(summary.improvements)).toBe(true);
    });
  });

  describe('createTestDataLoader', () => {
    it('should return a function', () => {
      const setDoc = vi.fn();
      const setScore = vi.fn();
      const loader = createTestDataLoader(setDoc, setScore);

      expect(typeof loader).toBe('function');
    });

    it('should call setters with test data when invoked', () => {
      const setDoc = vi.fn();
      const setScore = vi.fn();
      const loader = createTestDataLoader(setDoc, setScore);

      loader();

      expect(setDoc).toHaveBeenCalledWith(TEST_DOCUMENTATION);
      expect(setScore).toHaveBeenCalledWith(TEST_QUALITY_SCORE);
    });

    it('should call setters exactly once', () => {
      const setDoc = vi.fn();
      const setScore = vi.fn();
      const loader = createTestDataLoader(setDoc, setScore);

      loader();

      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(setScore).toHaveBeenCalledTimes(1);
    });

    it('should not call setCode when includeCode is false', () => {
      const setDoc = vi.fn();
      const setScore = vi.fn();
      const setCode = vi.fn();
      const loader = createTestDataLoader(setDoc, setScore, setCode);

      loader({ includeCode: false });

      expect(setDoc).toHaveBeenCalledWith(TEST_DOCUMENTATION);
      expect(setScore).toHaveBeenCalledWith(TEST_QUALITY_SCORE);
      expect(setCode).not.toHaveBeenCalled();
    });

    it('should not call setCode when no options are provided', () => {
      const setDoc = vi.fn();
      const setScore = vi.fn();
      const setCode = vi.fn();
      const loader = createTestDataLoader(setDoc, setScore, setCode);

      loader();

      expect(setDoc).toHaveBeenCalledWith(TEST_DOCUMENTATION);
      expect(setScore).toHaveBeenCalledWith(TEST_QUALITY_SCORE);
      expect(setCode).not.toHaveBeenCalled();
    });

    it('should call setCode when includeCode is true', () => {
      const setDoc = vi.fn();
      const setScore = vi.fn();
      const setCode = vi.fn();
      const loader = createTestDataLoader(setDoc, setScore, setCode);

      loader({ includeCode: true });

      expect(setDoc).toHaveBeenCalledWith(TEST_DOCUMENTATION);
      expect(setScore).toHaveBeenCalledWith(TEST_QUALITY_SCORE);
      expect(setCode).toHaveBeenCalledWith(TEST_CODE);
    });

    it('should not call setCode if setCode is not provided even when includeCode is true', () => {
      const setDoc = vi.fn();
      const setScore = vi.fn();
      const loader = createTestDataLoader(setDoc, setScore);

      // Should not throw error
      expect(() => loader({ includeCode: true })).not.toThrow();

      expect(setDoc).toHaveBeenCalledWith(TEST_DOCUMENTATION);
      expect(setScore).toHaveBeenCalledWith(TEST_QUALITY_SCORE);
    });

    it('should work with third parameter undefined', () => {
      const setDoc = vi.fn();
      const setScore = vi.fn();
      const loader = createTestDataLoader(setDoc, setScore, undefined);

      loader({ includeCode: true });

      expect(setDoc).toHaveBeenCalledWith(TEST_DOCUMENTATION);
      expect(setScore).toHaveBeenCalledWith(TEST_QUALITY_SCORE);
    });
  });

  describe('exposeTestDataLoader', () => {
    let originalLoadTestDoc;

    beforeEach(() => {
      // Save original window.loadTestDoc if it exists
      originalLoadTestDoc = window.loadTestDoc;
    });

    afterEach(() => {
      // Restore original or delete if it didn't exist
      if (originalLoadTestDoc) {
        window.loadTestDoc = originalLoadTestDoc;
      } else {
        delete window.loadTestDoc;
      }
    });

    it('should expose loader function to window.loadTestDoc', () => {
      const mockLoader = vi.fn();
      exposeTestDataLoader(mockLoader);

      expect(window.loadTestDoc).toBe(mockLoader);
    });

    it('should return a cleanup function', () => {
      const mockLoader = vi.fn();
      const cleanup = exposeTestDataLoader(mockLoader);

      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function should remove window.loadTestDoc', () => {
      const mockLoader = vi.fn();
      const cleanup = exposeTestDataLoader(mockLoader);

      expect(window.loadTestDoc).toBe(mockLoader);

      cleanup();

      expect(window.loadTestDoc).toBeUndefined();
    });

    it('should allow window.loadTestDoc to be called', () => {
      const mockLoader = vi.fn();
      exposeTestDataLoader(mockLoader);

      window.loadTestDoc();

      expect(mockLoader).toHaveBeenCalledTimes(1);
    });
  });
});
