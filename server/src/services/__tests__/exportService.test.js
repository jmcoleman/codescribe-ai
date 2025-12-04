/**
 * Unit tests for exportService
 *
 * Tests ZIP export functionality:
 * - Creating ZIP archives from documents
 * - Creating batch ZIP archives
 * - Manifest generation
 * - README generation
 * - Size estimation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import exportService from '../exportService.js';
import { PassThrough } from 'stream';

describe('ExportService', () => {
  describe('createDocumentsZip', () => {
    it('should create a ZIP with documents and manifest', async () => {
      const documents = [
        {
          id: 'doc-1',
          filename: 'auth.js',
          language: 'javascript',
          documentation: '# Auth Module\n\nHandles authentication.',
          quality_score: { score: 85, grade: 'B' },
          doc_type: 'README',
          generated_at: '2025-12-01T12:00:00Z',
          origin: 'upload'
        },
        {
          id: 'doc-2',
          filename: 'utils.js',
          language: 'javascript',
          documentation: '# Utilities\n\nHelper functions.',
          quality_score: { score: 90, grade: 'A' },
          doc_type: 'JSDOC',
          generated_at: '2025-12-01T12:05:00Z',
          origin: 'upload'
        }
      ];

      const result = await exportService.createDocumentsZip(documents);

      expect(result).toHaveProperty('stream');
      expect(result.stream).toBeInstanceOf(PassThrough);
      expect(result).toHaveProperty('filename');
      expect(result.filename).toMatch(/^codescribe-export-\d{4}-\d{2}-\d{2}\.zip$/);
      expect(result).toHaveProperty('fileCount', 2);
    });

    it('should include batch summary when provided', async () => {
      const documents = [
        {
          id: 'doc-1',
          filename: 'test.js',
          language: 'javascript',
          documentation: '# Test',
          quality_score: { score: 80, grade: 'B' },
          doc_type: 'README',
          generated_at: '2025-12-01T12:00:00Z',
          origin: 'upload'
        }
      ];

      const options = {
        summaryMarkdown: '# Batch Summary\n\nGenerated 1 file.',
        batchId: 'batch-123'
      };

      const result = await exportService.createDocumentsZip(documents, options);

      expect(result.filename).toMatch(/^codescribe-batch-\d{4}-\d{2}-\d{2}\.zip$/);
    });

    it('should throw error for empty documents array', async () => {
      await expect(exportService.createDocumentsZip([]))
        .rejects.toThrow('documents must be a non-empty array');
    });

    it('should throw error when documents is not an array', async () => {
      await expect(exportService.createDocumentsZip(null))
        .rejects.toThrow('documents must be a non-empty array');
    });
  });

  describe('createBatchZip', () => {
    it('should create ZIP from batch data', async () => {
      const batchData = {
        batch: {
          id: 'batch-123',
          summary_markdown: '# Summary'
        },
        documents: [
          {
            id: 'doc-1',
            filename: 'component.jsx',
            language: 'javascript',
            documentation: '# Component',
            quality_score: { score: 88, grade: 'B' },
            doc_type: 'README',
            generated_at: '2025-12-01T12:00:00Z',
            origin: 'github',
            github_repo: 'user/repo',
            github_path: 'src/component.jsx'
          }
        ]
      };

      const result = await exportService.createBatchZip(batchData);

      expect(result).toHaveProperty('stream');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('fileCount', 1);
    });

    it('should throw error when batch is missing', async () => {
      await expect(exportService.createBatchZip({ documents: [] }))
        .rejects.toThrow('batchData must contain batch and documents');
    });

    it('should throw error when documents is missing', async () => {
      await expect(exportService.createBatchZip({ batch: {} }))
        .rejects.toThrow('batchData must contain batch and documents');
    });
  });

  describe('_generateDocFilename', () => {
    it('should generate safe filename from document', () => {
      const doc = {
        filename: 'my-component.jsx',
        doc_type: 'README'
      };

      const result = exportService._generateDocFilename(doc);

      expect(result).toBe('my-component.readme.md');
    });

    it('should sanitize special characters', () => {
      const doc = {
        filename: 'file with spaces & special!chars.ts',
        doc_type: 'JSDOC'
      };

      const result = exportService._generateDocFilename(doc);

      expect(result).toBe('file_with_spaces___special_chars.jsdoc.md');
    });

    it('should truncate long filenames', () => {
      const doc = {
        filename: 'a'.repeat(100) + '.js',
        doc_type: 'API'
      };

      const result = exportService._generateDocFilename(doc);

      // Should be truncated to 50 chars + .api.md
      expect(result.length).toBeLessThanOrEqual(57); // 50 + '.api.md'
    });
  });

  describe('_createManifest', () => {
    it('should create manifest with document metadata', () => {
      const documents = [
        {
          id: 'doc-1',
          filename: 'auth.js',
          language: 'javascript',
          quality_score: { score: 85, grade: 'B' },
          doc_type: 'README',
          generated_at: '2025-12-01T12:00:00Z',
          origin: 'upload'
        }
      ];

      const manifest = exportService._createManifest(documents, {
        batchId: 'batch-123',
        hasSummary: true
      });

      expect(manifest).toHaveProperty('exportedBy', 'CodeScribe AI');
      expect(manifest).toHaveProperty('version', '1.0');
      expect(manifest).toHaveProperty('batchId', 'batch-123');
      expect(manifest).toHaveProperty('hasSummary', true);
      expect(manifest).toHaveProperty('totalFiles', 1);
      expect(manifest.files).toHaveLength(1);
      expect(manifest.files[0]).toHaveProperty('originalFilename', 'auth.js');
      expect(manifest.files[0]).toHaveProperty('language', 'javascript');
    });

    it('should include GitHub metadata when present', () => {
      const documents = [
        {
          id: 'doc-1',
          filename: 'component.jsx',
          language: 'javascript',
          quality_score: { score: 90, grade: 'A' },
          doc_type: 'README',
          generated_at: '2025-12-01T12:00:00Z',
          origin: 'github',
          github_repo: 'user/repo',
          github_path: 'src/component.jsx'
        }
      ];

      const manifest = exportService._createManifest(documents, {});

      expect(manifest.files[0].github).toEqual({
        repo: 'user/repo',
        path: 'src/component.jsx'
      });
    });
  });

  describe('_createReadme', () => {
    it('should create README with file listing', () => {
      const documents = [
        {
          filename: 'auth.js',
          quality_score: { score: 85, grade: 'B' },
          doc_type: 'README'
        },
        {
          filename: 'utils.js',
          quality_score: { score: 90, grade: 'A' },
          doc_type: 'JSDOC'
        }
      ];

      const readme = exportService._createReadme(documents, {});

      expect(readme).toContain('# CodeScribe AI Export');
      expect(readme).toContain('**Files:** 2');
      expect(readme).toContain('auth.readme.md');
      expect(readme).toContain('utils.jsdoc.md');
      expect(readme).toContain('Quality Scores');
    });

    it('should include batch summary reference when present', () => {
      const documents = [{ filename: 'test.js', quality_score: {}, doc_type: 'README' }];

      const readme = exportService._createReadme(documents, {
        batchId: 'batch-123',
        summaryMarkdown: '# Summary'
      });

      expect(readme).toContain('**Batch ID:** batch-123');
      expect(readme).toContain('BATCH-SUMMARY.md');
    });
  });

  describe('estimateZipSize', () => {
    it('should estimate ZIP size based on documentation length', () => {
      const documents = [
        { documentation: 'A'.repeat(10000) }, // 10KB
        { documentation: 'B'.repeat(5000) }   // 5KB
      ];

      const estimate = exportService.estimateZipSize(documents);

      // ~30% of 15KB + 5KB overhead = ~9.5KB
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(20000);
    });

    it('should handle empty documentation', () => {
      const documents = [
        { documentation: null },
        { documentation: '' }
      ];

      const estimate = exportService.estimateZipSize(documents);

      // Just overhead
      expect(estimate).toBe(5000);
    });
  });
});
