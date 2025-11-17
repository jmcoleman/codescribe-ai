import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  validateFileExtension,
  validateFileSize,
  validateFileMimeType,
  validateFile,
  getValidationErrorMessage,
  sanitizeFilename,
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

    it('should accept newly added language extensions (v2.8.1)', () => {
      // Kotlin
      expect(validateFileExtension('MainActivity.kt').valid).toBe(true);
      expect(validateFileExtension('script.kts').valid).toBe(true);

      // Swift
      expect(validateFileExtension('ViewController.swift').valid).toBe(true);

      // Dart
      expect(validateFileExtension('main.dart').valid).toBe(true);

      // Shell scripts
      expect(validateFileExtension('backup.sh').valid).toBe(true);
      expect(validateFileExtension('deploy.bash').valid).toBe(true);
      expect(validateFileExtension('setup.zsh').valid).toBe(true);

      // Google Apps Script
      expect(validateFileExtension('Code.gs').valid).toBe(true);
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

  describe('sanitizeFilename', () => {
    describe('Basic Sanitization', () => {
      it('should remove filesystem-unsafe characters (/ \\ : * ? " < > |)', () => {
        expect(sanitizeFilename('file/name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file\\name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file:name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file*name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file?name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file"name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file<name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file>name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file|name.js')).toBe('file_name.js');
      });

      it('should handle multiple unsafe characters', () => {
        // Multiple consecutive unsafe characters are collapsed to single underscore
        expect(sanitizeFilename('file:/\\*?.js')).toBe('file_.js');
        expect(sanitizeFilename('my:file*name?.txt')).toBe('my_file_name_.txt');
      });

      it('should collapse multiple consecutive underscores', () => {
        expect(sanitizeFilename('file://name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file***name.js')).toBe('file_name.js');
        expect(sanitizeFilename('file::||name.js')).toBe('file_name.js');
      });

      it('should preserve file extensions', () => {
        expect(sanitizeFilename('code:file.js')).toBe('code_file.js');
        expect(sanitizeFilename('my*code.cpp')).toBe('my_code.cpp');
        expect(sanitizeFilename('test?file.py')).toBe('test_file.py');
      });
    });

    describe('Whitespace Handling', () => {
      it('should trim leading and trailing whitespace', () => {
        expect(sanitizeFilename('  file.js  ')).toBe('file.js');
        expect(sanitizeFilename('   code.py   ')).toBe('code.py');
      });

      it('should trim leading and trailing dots', () => {
        expect(sanitizeFilename('..file.js')).toBe('file.js');
        expect(sanitizeFilename('file.js..')).toBe('file.js');
        // '...code...py' is parsed as name='...code..' and extension='.py'
        // Leading/trailing dots are trimmed from name → 'code'
        expect(sanitizeFilename('...code...py')).toBe('code.py');
      });

      it('should preserve internal spaces', () => {
        expect(sanitizeFilename('my file.js')).toBe('my file.js');
        expect(sanitizeFilename('code sample.py')).toBe('code sample.py');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty or null filenames', () => {
        expect(sanitizeFilename('')).toBe('unnamed.txt');
        expect(sanitizeFilename(null)).toBe('unnamed.txt');
        expect(sanitizeFilename(undefined)).toBe('unnamed.txt');
      });

      it('should handle filenames with no extension', () => {
        expect(sanitizeFilename('file')).toBe('file');
        expect(sanitizeFilename('my:code')).toBe('my_code');
      });

      it('should handle filenames that become empty after sanitization', () => {
        expect(sanitizeFilename('***')).toBe('unnamed');
        expect(sanitizeFilename(':::')).toBe('unnamed');
        expect(sanitizeFilename('<<<')).toBe('unnamed');
        expect(sanitizeFilename('   ')).toBe('unnamed.txt');
      });

      it('should handle control characters (ASCII 0-31)', () => {
        expect(sanitizeFilename('file\x00name.js')).toBe('filename.js');
        expect(sanitizeFilename('file\x1Fname.js')).toBe('filename.js');
        expect(sanitizeFilename('code\ttab.js')).toBe('codetab.js');
      });

      it('should handle multiple dots in filename', () => {
        expect(sanitizeFilename('my.code.file.js')).toBe('my.code.file.js');
        expect(sanitizeFilename('test.backup.py')).toBe('test.backup.py');
      });

      it('should handle filename with extension only', () => {
        // Files starting with dot are treated as having no name, extension is preserved
        expect(sanitizeFilename('.js')).toBe('unnamed.js');
        expect(sanitizeFilename('.gitignore')).toBe('unnamed.gitignore');
      });
    });

    describe('Real-world Scenarios', () => {
      it('should sanitize Windows-style paths', () => {
        // Consecutive backslashes are collapsed to single underscore
        expect(sanitizeFilename('C:\\Users\\file.js')).toBe('C_Users_file.js');
        expect(sanitizeFilename('D:\\code\\test.py')).toBe('D_code_test.py');
      });

      it('should sanitize Unix-style paths', () => {
        expect(sanitizeFilename('/home/user/file.js')).toBe('_home_user_file.js');
        expect(sanitizeFilename('/var/log/test.txt')).toBe('_var_log_test.txt');
      });

      it('should handle sample titles with special characters', () => {
        expect(sanitizeFilename('calculator:-api.js')).toBe('calculator_-api.js');
        expect(sanitizeFilename('user-auth:service.py')).toBe('user-auth_service.py');
        expect(sanitizeFilename('file*upload?.cpp')).toBe('file_upload_.cpp');
      });

      it('should preserve common filename patterns', () => {
        expect(sanitizeFilename('code.test.js')).toBe('code.test.js');
        expect(sanitizeFilename('my-component.tsx')).toBe('my-component.tsx');
        expect(sanitizeFilename('api_service.py')).toBe('api_service.py');
      });
    });

    describe('Extension Preservation', () => {
      it('should correctly identify and preserve extensions', () => {
        expect(sanitizeFilename('test.js')).toBe('test.js');
        expect(sanitizeFilename('code.cpp')).toBe('code.cpp');
        expect(sanitizeFilename('api.py')).toBe('api.py');
      });

      it('should handle multiple extensions correctly', () => {
        expect(sanitizeFilename('file.test.js')).toBe('file.test.js');
        expect(sanitizeFilename('code.backup.cpp')).toBe('code.backup.cpp');
      });

      it('should handle unusual but valid extensions', () => {
        expect(sanitizeFilename('file.min.js')).toBe('file.min.js');
        expect(sanitizeFilename('code.d.ts')).toBe('code.d.ts');
      });
    });
  });
});
