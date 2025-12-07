/**
 * Unit tests for batchService
 *
 * Tests batch operations for generation history and export features:
 * - Creating batches
 * - Linking documents to batches
 * - Getting user batches with pagination
 * - Getting single batch
 * - Getting batch with documents
 * - Deleting batches
 * - User statistics
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 * - Use ES6 imports with jest.mock() BEFORE the actual imports
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock @vercel/postgres BEFORE importing batchService
jest.mock('@vercel/postgres', () => {
  const mockSql = Object.assign(
    jest.fn(),
    {
      unsafe: jest.fn((value) => value),
      query: jest.fn() // For raw SQL queries with parameters
    }
  );

  return {
    sql: mockSql
  };
});

import { sql } from '@vercel/postgres';
import batchService from '../batchService.js';

describe('BatchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBatch', () => {
    it('should create a batch with required fields', async () => {
      const mockResult = {
        rows: [{
          id: 'batch-123-uuid',
          created_at: '2025-12-01T12:00:00Z'
        }]
      };
      sql.mockResolvedValue(mockResult);

      const userId = 42;
      const batchData = {
        batchType: 'batch',
        totalFiles: 5,
        successCount: 4,
        failCount: 1
      };

      const result = await batchService.createBatch(userId, batchData);

      expect(result).toEqual({
        batchId: 'batch-123-uuid',
        createdAt: '2025-12-01T12:00:00Z'
      });
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should create a batch with all optional fields', async () => {
      const mockResult = {
        rows: [{
          id: 'batch-456-uuid',
          created_at: '2025-12-01T13:00:00Z'
        }]
      };
      sql.mockResolvedValue(mockResult);

      const userId = 42;
      const batchData = {
        batchType: 'batch',
        totalFiles: 3,
        successCount: 3,
        failCount: 0,
        avgQualityScore: 85.5,
        avgGrade: 'B',
        summaryMarkdown: '# Batch Summary\n\nGenerated 3 files.',
        errorDetails: null,
        docTypes: ['README', 'JSDOC']
      };

      const result = await batchService.createBatch(userId, batchData);

      expect(result).toEqual({
        batchId: 'batch-456-uuid',
        createdAt: '2025-12-01T13:00:00Z'
      });
    });

    it('should throw error when userId is missing', async () => {
      await expect(batchService.createBatch(null, {
        batchType: 'batch',
        totalFiles: 1,
        successCount: 1,
        failCount: 0
      })).rejects.toThrow('User ID is required');
    });

    it('should throw error for invalid batchType', async () => {
      await expect(batchService.createBatch(42, {
        batchType: 'invalid',
        totalFiles: 1,
        successCount: 1,
        failCount: 0
      })).rejects.toThrow('batchType must be "batch" or "single"');
    });

    it('should throw error when file counts do not match', async () => {
      await expect(batchService.createBatch(42, {
        batchType: 'batch',
        totalFiles: 5,
        successCount: 3,
        failCount: 1 // 5 != 3 + 1
      })).rejects.toThrow('totalFiles must equal successCount + failCount');
    });
  });

  describe('linkDocumentsToBatch', () => {
    it('should link documents to a batch', async () => {
      // Mock batch ownership check
      sql.mockResolvedValueOnce({ rows: [{ id: 'batch-123' }] });
      // Mock document update
      sql.mockResolvedValueOnce({ rowCount: 3 });

      const result = await batchService.linkDocumentsToBatch(
        42,
        'batch-123',
        ['doc-1', 'doc-2', 'doc-3']
      );

      expect(result).toBe(3);
      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should throw error when batch not found', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      await expect(batchService.linkDocumentsToBatch(
        42,
        'nonexistent-batch',
        ['doc-1']
      )).rejects.toThrow('Batch not found or does not belong to user');
    });

    it('should throw error for empty documentIds array', async () => {
      await expect(batchService.linkDocumentsToBatch(
        42,
        'batch-123',
        []
      )).rejects.toThrow('documentIds must be a non-empty array');
    });
  });

  describe('getUserBatches', () => {
    it('should return user batches with pagination', async () => {
      const mockBatches = {
        rows: [
          { id: 'batch-1', batch_type: 'batch', total_files: 5, file_count: 5 },
          { id: 'batch-2', batch_type: 'single', total_files: 1, file_count: 1 }
        ]
      };
      const mockCount = { rows: [{ total: '10', total_documents: '45' }] };

      // getUserBatches now uses sql.query() for dynamic queries
      sql.query.mockResolvedValueOnce(mockBatches);
      sql.query.mockResolvedValueOnce(mockCount);

      const result = await batchService.getUserBatches(42, {
        limit: 10,
        offset: 0
      });

      expect(result).toEqual({
        batches: mockBatches.rows,
        total: 10,
        totalDocuments: 45,
        hasMore: false,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });

    it('should filter by batchType', async () => {
      const mockBatches = {
        rows: [
          { id: 'batch-1', batch_type: 'batch', total_files: 5, file_count: 5 }
        ]
      };
      const mockCount = { rows: [{ total: '1', total_documents: '5' }] };

      // getUserBatches now uses sql.query() for dynamic queries
      sql.query.mockResolvedValueOnce(mockBatches);
      sql.query.mockResolvedValueOnce(mockCount);

      const result = await batchService.getUserBatches(42, {
        batchType: 'batch'
      });

      expect(result.batches).toHaveLength(1);
      expect(result.batches[0].batch_type).toBe('batch');
    });

    it('should support server-side sorting', async () => {
      const mockBatches = {
        rows: [
          { id: 'batch-1', batch_type: 'batch', avg_grade: 'A', total_files: 5 }
        ]
      };
      const mockCount = { rows: [{ total: '1', total_documents: '5' }] };

      sql.query.mockResolvedValueOnce(mockBatches);
      sql.query.mockResolvedValueOnce(mockCount);

      const result = await batchService.getUserBatches(42, {
        sortBy: 'avg_grade',
        sortOrder: 'asc'
      });

      expect(result.batches).toHaveLength(1);
      // Verify sql.query was called with correct parameters
      expect(sql.query).toHaveBeenCalled();
    });

    it('should support grade filtering', async () => {
      const mockBatches = {
        rows: [
          { id: 'batch-1', batch_type: 'batch', avg_grade: 'A', total_files: 3 }
        ]
      };
      const mockCount = { rows: [{ total: '1', total_documents: '3' }] };

      sql.query.mockResolvedValueOnce(mockBatches);
      sql.query.mockResolvedValueOnce(mockCount);

      const result = await batchService.getUserBatches(42, {
        gradeFilter: 'A'
      });

      expect(result.batches).toHaveLength(1);
      expect(result.batches[0].avg_grade).toBe('A');
    });
  });

  describe('getBatch', () => {
    it('should return a batch by ID', async () => {
      const mockBatch = {
        rows: [{
          id: 'batch-123',
          user_id: 42,
          batch_type: 'batch',
          total_files: 5,
          success_count: 5,
          fail_count: 0
        }]
      };
      sql.mockResolvedValue(mockBatch);

      const result = await batchService.getBatch(42, 'batch-123');

      expect(result).toEqual(mockBatch.rows[0]);
    });

    it('should return null for non-existent batch', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await batchService.getBatch(42, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getBatchWithDocuments', () => {
    it('should return batch with its documents', async () => {
      const mockBatch = {
        rows: [{
          id: 'batch-123',
          batch_type: 'batch',
          summary_markdown: '# Summary'
        }]
      };
      const mockDocs = {
        rows: [
          { id: 'doc-1', filename: 'file1.js', documentation: '# File 1' },
          { id: 'doc-2', filename: 'file2.js', documentation: '# File 2' }
        ]
      };

      // First call uses sql tagged template, second uses sql.query()
      sql.mockResolvedValueOnce(mockBatch);
      sql.query.mockResolvedValueOnce(mockDocs);

      const result = await batchService.getBatchWithDocuments(42, 'batch-123');

      expect(result).toEqual({
        batch: mockBatch.rows[0],
        documents: mockDocs.rows
      });
    });

    it('should return null when batch not found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await batchService.getBatchWithDocuments(42, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteBatch', () => {
    it('should delete a batch and return true', async () => {
      sql.mockResolvedValue({ rowCount: 1 });

      const result = await batchService.deleteBatch(42, 'batch-123');

      expect(result).toBe(true);
    });

    it('should return false when batch not found', async () => {
      sql.mockResolvedValue({ rowCount: 0 });

      const result = await batchService.deleteBatch(42, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getUserBatchStats', () => {
    it('should return user batch statistics', async () => {
      const mockStats = {
        rows: [{
          total_batches: '10',
          multi_file_batches: '7',
          single_file_batches: '3',
          total_files_generated: '45',
          total_successful: '42',
          total_failed: '3',
          overall_avg_quality: '85.5',
          first_batch: '2025-01-01T00:00:00Z',
          last_batch: '2025-12-01T00:00:00Z'
        }]
      };
      sql.mockResolvedValue(mockStats);

      const result = await batchService.getUserBatchStats(42);

      expect(result).toEqual(mockStats.rows[0]);
    });
  });

  describe('getDocumentsByIds', () => {
    it('should return documents by their IDs', async () => {
      const mockDocs = {
        rows: [
          { id: 'doc-1', filename: 'file1.js', documentation: '# File 1' },
          { id: 'doc-2', filename: 'file2.js', documentation: '# File 2' }
        ]
      };
      sql.mockResolvedValue(mockDocs);

      const result = await batchService.getDocumentsByIds(42, ['doc-1', 'doc-2']);

      expect(result).toEqual(mockDocs.rows);
    });

    it('should throw error for empty documentIds array', async () => {
      await expect(batchService.getDocumentsByIds(42, []))
        .rejects.toThrow('documentIds must be a non-empty array');
    });
  });
});
