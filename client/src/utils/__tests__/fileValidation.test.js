import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  validateFileExtension,
  validateFileSize,
  validateFileMimeType,
  validateFile,
  getValidationErrorMessage,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS
} from '../fileValidation';

describe('fileValidation', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(500 * 1024)).toBe('500 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should respect decimal parameter', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 2)).toBe('1.5 KB');
    });
  });

  describe('validateFileExtension', () => {
    it('should accept valid extensions', () => {
      const result = validateFileExtension('test.js');
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('.js');
      expect(result.error).toBeUndefined();
    });

    it('should accept all allowed extensions', () => {
      ALLOWED_EXTENSIONS.forEach(ext => {
        const result = validateFileExtension(`test${ext}`);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid extensions', () => {
      const result = validateFileExtension('test.exe');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should reject files with no extension', () => {
      const result = validateFileExtension('test');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no extension');
    });

    it('should be case insensitive', () => {
      const result = validateFileExtension('test.JS');
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('.js');
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const result = validateFileSize(100 * 1024); // 100KB
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept files at exact size limit', () => {
      const result = validateFileSize(MAX_FILE_SIZE);
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const result = validateFileSize(MAX_FILE_SIZE + 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should include formatted size in response', () => {
      const result = validateFileSize(100 * 1024);
      expect(result.sizeFormatted).toBe('100 KB');
    });
  });

  describe('validateFileMimeType', () => {
    it('should accept valid MIME types', () => {
      const result = validateFileMimeType('text/javascript');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid MIME types', () => {
      const result = validateFileMimeType('application/pdf');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });
  });

  describe('validateFile', () => {
    // Helper to create a mock File object
    const createMockFile = (name, size, type) => {
      return {
        name,
        size,
        type
      };
    };

    it('should validate a valid file', () => {
      const file = createMockFile('test.js', 1024, 'text/javascript');
      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.file.name).toBe('test.js');
      expect(result.file.extension).toBe('.js');
    });

    it('should reject null/undefined file', () => {
      const result = validateFile(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No file provided');
    });

    it('should reject file with invalid extension', () => {
      const file = createMockFile('test.exe', 1024, 'application/octet-stream');
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('not supported'))).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      const file = createMockFile('test.js', MAX_FILE_SIZE + 1000, 'text/javascript');
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('exceeds maximum'))).toBe(true);
    });

    it('should reject empty files', () => {
      const file = createMockFile('test.js', 0, 'text/javascript');
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });

    it('should warn about unexpected MIME types but not fail', () => {
      const file = createMockFile('test.js', 1024, 'application/pdf');
      const result = validateFile(file);

      // Should still be valid if extension is correct
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Unexpected MIME type');
    });

    it('should accumulate multiple errors', () => {
      const file = createMockFile('test.exe', MAX_FILE_SIZE + 1000, 'application/pdf');
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle files with uppercase extensions', () => {
      const file = createMockFile('TEST.JS', 1024, 'text/javascript');
      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.file.extension).toBe('.js');
    });

    it('should validate all allowed file extensions', () => {
      ALLOWED_EXTENSIONS.forEach(ext => {
        const file = createMockFile(`test${ext}`, 1024, 'text/plain');
        const result = validateFile(file);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return null for valid validation', () => {
      const validation = { valid: true, errors: [], warnings: [] };
      const message = getValidationErrorMessage(validation);
      expect(message).toBeNull();
    });

    it('should return single error message', () => {
      const validation = { valid: false, errors: ['File is too large'], warnings: [] };
      const message = getValidationErrorMessage(validation);
      expect(message).toBe('File is too large');
    });

    it('should format multiple errors with bullets', () => {
      const validation = {
        valid: false,
        errors: ['File is too large', 'Invalid file type'],
        warnings: []
      };
      const message = getValidationErrorMessage(validation);
      expect(message).toContain('•');
      expect(message).toContain('File is too large');
      expect(message).toContain('Invalid file type');
    });
  });
});
