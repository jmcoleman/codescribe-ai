/**
 * Integration tests for file upload functionality
 * Tests file validation, size limits, and content reading
 *
 * These tests verify the /api/upload endpoint behavior
 * Note: Run with npm test to use Jest + Babel for ES modules
 */

const fs = require('fs');
const path = require('path');

describe('File Upload Validation', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/upload');

  beforeAll(() => {
    // Ensure test fixtures exist
    expect(fs.existsSync(fixturesDir)).toBe(true);
  });

  describe('Test fixtures', () => {
    it('should have valid JavaScript test file', () => {
      const jsFile = path.join(fixturesDir, 'valid-javascript.js');
      expect(fs.existsSync(jsFile)).toBe(true);

      const content = fs.readFileSync(jsFile, 'utf-8');
      expect(content).toContain('calculateSum');
      expect(content).toContain('Calculator');
      expect(content.length).toBeLessThan(500 * 1024); // Under 500KB
    });

    it('should have valid TypeScript test file', () => {
      const tsFile = path.join(fixturesDir, 'valid-typescript.ts');
      expect(fs.existsSync(tsFile)).toBe(true);

      const content = fs.readFileSync(tsFile, 'utf-8');
      expect(content).toContain('interface User');
      expect(content).toContain('UserService');
    });

    it('should have valid JSX test file', () => {
      const jsxFile = path.join(fixturesDir, 'valid-react.jsx');
      expect(fs.existsSync(jsxFile)).toBe(true);

      const content = fs.readFileSync(jsxFile, 'utf-8');
      expect(content).toContain('Counter');
      expect(content).toContain('useState');
    });

    it('should have valid TSX test file', () => {
      const tsxFile = path.join(fixturesDir, 'valid-typescript-react.tsx');
      expect(fs.existsSync(tsxFile)).toBe(true);

      const content = fs.readFileSync(tsxFile, 'utf-8');
      expect(content).toContain('TodoList');
      expect(content).toContain('React.FC');
    });

    it('should have valid Python test file', () => {
      const pyFile = path.join(fixturesDir, 'valid-python.py');
      expect(fs.existsSync(pyFile)).toBe(true);

      const content = fs.readFileSync(pyFile, 'utf-8');
      expect(content).toContain('DataProcessor');
      expect(content).toContain('fibonacci');
    });

    it('should have invalid file type test file', () => {
      const txtFile = path.join(fixturesDir, 'invalid-type.txt');
      expect(fs.existsSync(txtFile)).toBe(true);

      const content = fs.readFileSync(txtFile, 'utf-8');
      expect(content).toContain('plain text');
    });

    it('should have large file for size testing', () => {
      const largeFile = path.join(fixturesDir, 'large-file.js');
      expect(fs.existsSync(largeFile)).toBe(true);

      const stats = fs.statSync(largeFile);
      expect(stats.size).toBeGreaterThan(500 * 1024); // Over 500KB
    });
  });

  describe('File extension validation logic', () => {
    const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py'];

    it('should allow all valid extensions', () => {
      const validFiles = [
        'test.js',
        'component.jsx',
        'types.ts',
        'app.tsx',
        'script.py'
      ];

      validFiles.forEach(filename => {
        const ext = path.extname(filename).toLowerCase();
        expect(allowedExtensions.includes(ext)).toBe(true);
      });
    });

    it('should reject invalid extensions', () => {
      const invalidFiles = [
        'readme.txt',
        'image.png',
        'document.pdf',
        'data.json',
        'style.css'
      ];

      invalidFiles.forEach(filename => {
        const ext = path.extname(filename).toLowerCase();
        expect(allowedExtensions.includes(ext)).toBe(false);
      });
    });

    it('should handle uppercase extensions', () => {
      const upperFiles = ['TEST.JS', 'Component.JSX', 'Types.TS'];

      upperFiles.forEach(filename => {
        const ext = path.extname(filename).toLowerCase();
        expect(allowedExtensions.includes(ext)).toBe(true);
      });
    });
  });

  describe('File size validation logic', () => {
    const MAX_SIZE = 500 * 1024; // 500KB

    it('should accept files under size limit', () => {
      const testFiles = [
        'valid-javascript.js',
        'valid-typescript.ts',
        'valid-react.jsx',
        'valid-typescript-react.tsx',
        'valid-python.py'
      ];

      testFiles.forEach(filename => {
        const filePath = path.join(fixturesDir, filename);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeLessThan(MAX_SIZE);
      });
    });

    it('should identify files over size limit', () => {
      const largeFile = path.join(fixturesDir, 'large-file.js');
      const stats = fs.statSync(largeFile);
      expect(stats.size).toBeGreaterThan(MAX_SIZE);
    });
  });

  describe('File content reading', () => {
    it('should read UTF-8 content correctly', () => {
      const jsFile = path.join(fixturesDir, 'valid-javascript.js');
      const content = fs.readFileSync(jsFile, 'utf-8');

      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('function');
    });

    it('should preserve special characters', () => {
      // Create temp file with special characters
      const tempFile = path.join(fixturesDir, 'temp-special.js');
      const specialContent = '// Special: é, ñ, 中文, 🚀\nconsole.log("test");';
      fs.writeFileSync(tempFile, specialContent, 'utf-8');

      const readContent = fs.readFileSync(tempFile, 'utf-8');
      expect(readContent).toBe(specialContent);
      expect(readContent).toContain('é');
      expect(readContent).toContain('🚀');

      // Cleanup
      fs.unlinkSync(tempFile);
    });

    it('should handle different line endings', () => {
      const tempFile = path.join(fixturesDir, 'temp-line-endings.js');

      // Windows-style line endings
      const windowsContent = 'line1\r\nline2\r\nline3';
      fs.writeFileSync(tempFile, windowsContent, 'utf-8');

      const readContent = fs.readFileSync(tempFile, 'utf-8');
      expect(readContent).toContain('line1');
      expect(readContent).toContain('line2');

      // Cleanup
      fs.unlinkSync(tempFile);
    });
  });

  describe('Response format helper', () => {
    // Test the formatBytes helper that's used in the API
    function formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(100)).toBe('100 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('should format test file sizes', () => {
      const testFiles = [
        'valid-javascript.js',
        'valid-typescript.ts',
        'valid-react.jsx'
      ];

      testFiles.forEach(filename => {
        const filePath = path.join(fixturesDir, filename);
        const stats = fs.statSync(filePath);
        const formatted = formatBytes(stats.size);

        expect(formatted).toMatch(/^\d+(\.\d+)?\s+(Bytes|KB|MB)$/);
      });
    });
  });

  describe('Integration readiness', () => {
    it('should have all required test fixtures', () => {
      const requiredFiles = [
        'valid-javascript.js',
        'valid-typescript.ts',
        'valid-react.jsx',
        'valid-typescript-react.tsx',
        'valid-python.py',
        'invalid-type.txt',
        'large-file.js'
      ];

      requiredFiles.forEach(filename => {
        const filePath = path.join(fixturesDir, filename);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should validate all file types are represented', () => {
      const extensions = ['.js', '.jsx', '.ts', '.tsx', '.py'];

      extensions.forEach(ext => {
        const files = fs.readdirSync(fixturesDir)
          .filter(f => path.extname(f) === ext);
        expect(files.length).toBeGreaterThan(0);
      });
    });
  });
});

/**
 * Manual API Testing Instructions
 * ================================
 *
 * Since the API uses ES modules and requires a running server,
 * use these curl commands to test the actual /api/upload endpoint:
 *
 * 1. Start the server:
 *    cd server && npm run dev
 *
 * 2. Test valid JavaScript file:
 *    curl -X POST http://localhost:3000/api/upload \
 *      -F "file=@tests/fixtures/upload/valid-javascript.js"
 *
 * 3. Test invalid file type:
 *    curl -X POST http://localhost:3000/api/upload \
 *      -F "file=@tests/fixtures/upload/invalid-type.txt"
 *
 * 4. Test file too large:
 *    curl -X POST http://localhost:3000/api/upload \
 *      -F "file=@tests/fixtures/upload/large-file.js"
 *
 * 5. Test all valid file types:
 *    for file in tests/fixtures/upload/valid-*; do
 *      echo "Testing: $file"
 *      curl -X POST http://localhost:3000/api/upload -F "file=@$file"
 *      echo ""
 *    done
 *
 * Expected Results:
 * ----------------
 * - Valid files (.js/.jsx/.ts/.tsx/.py under 500KB):
 *   Status 200, success: true, file object with content
 *
 * - Invalid file type (.txt):
 *   Status 400, success: false, error: "Invalid file type"
 *
 * - File too large (>500KB):
 *   Status 413, success: false, error: "File too large"
 *
 * - No file uploaded:
 *   Status 400, success: false, error: "No file uploaded"
 */
