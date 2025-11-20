/**
 * Unit tests for documentService
 *
 * Tests all CRUD operations for generated documents including:
 * - Saving documents
 * - Fetching user documents with pagination/sorting
 * - Getting single documents
 * - Deleting documents (soft delete)
 * - Bulk deletion
 * - Restoring soft-deleted documents
 * - Ephemeral document cleanup
 * - User statistics
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 * - Use ES6 imports with jest.mock() BEFORE the actual imports
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock @vercel/postgres BEFORE importing documentService
jest.mock('@vercel/postgres', () => {
  const mockSql = Object.assign(
    jest.fn(), // Main function for tagged templates
    {
      // Additional methods on sql
      unsafe: jest.fn((value) => value) // For dynamic SQL values
    }
  );

  return {
    sql: mockSql
  };
});

import { sql } from '@vercel/postgres';
import documentService from '../documentService.js';

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveDocument', () => {
    it('should save a document with all required fields', async () => {
      const mockResult = {
        rows: [{
          id: 'doc-123-uuid',
          generated_at: '2025-11-15T12:00:00Z'
        }]
      };
      sql.mockResolvedValue(mockResult);

      const userId = 42;
      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test Documentation',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      const result = await documentService.saveDocument(userId, docData);

      expect(result).toEqual({
        documentId: 'doc-123-uuid',
        savedAt: '2025-11-15T12:00:00Z'
      });
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should save a document with optional GitHub metadata', async () => {
      const mockResult = {
        rows: [{
          id: 'doc-456-uuid',
          generated_at: '2025-11-15T13:00:00Z'
        }]
      };
      sql.mockResolvedValue(mockResult);

      const userId = 42;
      const docData = {
        filename: 'auth.js',
        language: 'javascript',
        fileSize: 2048,
        documentation: '# Auth Module',
        qualityScore: { score: 92, grade: 'A' },
        docType: 'JSDOC',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        githubRepo: 'acme-corp/project',
        githubPath: 'src/auth.js',
        githubSha: 'abc123def456',
        githubBranch: 'main'
      };

      const result = await documentService.saveDocument(userId, docData);

      expect(result.documentId).toBe('doc-456-uuid');
      expect(sql).toHaveBeenCalled();
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        documentService.saveDocument(null, {})
      ).rejects.toThrow('User ID is required');
    });

    it('should throw error if required fields are missing', async () => {
      await expect(
        documentService.saveDocument(42, {
          filename: 'test.js'
          // Missing other required fields
        })
      ).rejects.toThrow('Missing required fields');
    });

    it('should throw error if provider/model are missing', async () => {
      await expect(
        documentService.saveDocument(42, {
          filename: 'test.js',
          language: 'javascript',
          documentation: '# Test',
          qualityScore: { score: 85 },
          docType: 'README'
          // Missing provider and model
        })
      ).rejects.toThrow('Missing required fields: provider, model');
    });
  });

  describe('getUserDocuments', () => {
    it.skip('should fetch user documents with default pagination', async () => {
      const mockDocuments = {
        rows: [
          {
            id: 'doc-1',
            filename: 'test1.js',
            language: 'javascript',
            documentation: '# Doc 1',
            generated_at: '2025-11-15T12:00:00Z'
          },
          {
            id: 'doc-2',
            filename: 'test2.js',
            language: 'javascript',
            documentation: '# Doc 2',
            generated_at: '2025-11-15T11:00:00Z'
          }
        ]
      };

      const mockCount = {
        rows: [{ total: '2' }]
      };

      // Mock both the main sql call and the parameterized sql() calls
      sql.mockImplementation((strings, ...values) => {
        // Return a promise for tagged template calls
        if (Array.isArray(strings)) {
          if (sql.mockReturnValueIndex === 0) {
            sql.mockReturnValueIndex = 1;
            return Promise.resolve(mockDocuments);
          } else {
            return Promise.resolve(mockCount);
          }
        }
        // For parameterized calls like sql(validSortField), just return the value
        return values[0] || strings;
      });
      sql.mockReturnValueIndex = 0;

      const result = await documentService.getUserDocuments(42);

      expect(result.documents).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it.skip('should support pagination with limit and offset', async () => {
      const mockDocuments = { rows: [] };
      const mockCount = { rows: [{ total: '100' }] };

      sql.mockResolvedValueOnce(mockDocuments).mockResolvedValueOnce(mockCount);

      const result = await documentService.getUserDocuments(42, {
        limit: 10,
        offset: 20
      });

      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true); // 20 + 10 < 100
    });

    it.skip('should support custom sorting', async () => {
      const mockDocuments = { rows: [] };
      const mockCount = { rows: [{ total: '0' }] };

      sql.mockResolvedValueOnce(mockDocuments).mockResolvedValueOnce(mockCount);

      await documentService.getUserDocuments(42, {
        sort: 'filename:asc'
      });

      expect(sql).toHaveBeenCalledTimes(2);
      // Verify sort order is applied (implicitly tested via SQL call)
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        documentService.getUserDocuments(null)
      ).rejects.toThrow('User ID is required');
    });
  });

  describe('getDocument', () => {
    it('should fetch a single document by ID', async () => {
      const mockDocument = {
        rows: [{
          id: 'doc-123',
          filename: 'test.js',
          documentation: '# Test',
          user_id: 42
        }]
      };

      sql.mockResolvedValue(mockDocument);

      const result = await documentService.getDocument(42, 'doc-123');

      expect(result).toEqual(mockDocument.rows[0]);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return null if document not found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await documentService.getDocument(42, 'doc-nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error if userId or documentId is missing', async () => {
      await expect(
        documentService.getDocument(null, 'doc-123')
      ).rejects.toThrow('User ID and Document ID are required');

      await expect(
        documentService.getDocument(42, null)
      ).rejects.toThrow('User ID and Document ID are required');
    });
  });

  describe('deleteDocument', () => {
    it('should soft delete a document', async () => {
      const mockResult = {
        rows: [{
          deleted_at: '2025-11-15T14:00:00Z'
        }]
      };

      sql.mockResolvedValue(mockResult);

      const result = await documentService.deleteDocument(42, 'doc-123');

      expect(result).toEqual(mockResult.rows[0]);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return null if document not found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await documentService.deleteDocument(42, 'doc-nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('bulkDeleteDocuments', () => {
    it('should delete multiple documents', async () => {
      const mockResult = { rowCount: 3 };

      sql.mockResolvedValue(mockResult);

      const documentIds = ['doc-1', 'doc-2', 'doc-3'];
      const result = await documentService.bulkDeleteDocuments(42, documentIds);

      expect(result).toBe(3);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should throw error if documentIds is not an array', async () => {
      await expect(
        documentService.bulkDeleteDocuments(42, 'not-an-array')
      ).rejects.toThrow('documentIds must be a non-empty array');
    });

    it('should throw error if documentIds is empty', async () => {
      await expect(
        documentService.bulkDeleteDocuments(42, [])
      ).rejects.toThrow('documentIds must be a non-empty array');
    });
  });

  describe('restoreDocument', () => {
    it('should restore a soft-deleted document', async () => {
      const mockResult = {
        rows: [{
          restored_at: '2025-11-15T15:00:00Z'
        }]
      };

      sql.mockResolvedValue(mockResult);

      const result = await documentService.restoreDocument(42, 'doc-123');

      expect(result).toEqual(mockResult.rows[0]);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return null if document not found or outside 30-day window', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await documentService.restoreDocument(42, 'doc-expired');

      expect(result).toBeNull();
    });
  });

  describe('deleteEphemeralDocuments', () => {
    it('should delete all ephemeral documents for a user', async () => {
      const mockResult = { rowCount: 5 };

      sql.mockResolvedValue(mockResult);

      const result = await documentService.deleteEphemeralDocuments(42);

      expect(result).toBe(5);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        documentService.deleteEphemeralDocuments(null)
      ).rejects.toThrow('User ID is required');
    });
  });

  describe('permanentlyDeleteOldDocuments', () => {
    it('should permanently delete documents older than 30 days', async () => {
      const mockResult = { rowCount: 10 };

      sql.mockResolvedValue(mockResult);

      const result = await documentService.permanentlyDeleteOldDocuments();

      expect(result).toBe(10);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return 0 if no old documents to delete', async () => {
      sql.mockResolvedValue({ rowCount: 0 });

      const result = await documentService.permanentlyDeleteOldDocuments();

      expect(result).toBe(0);
    });
  });

  describe('getUserStats', () => {
    it('should return user document statistics', async () => {
      const mockStats = {
        rows: [{
          total_documents: '25',
          active_documents: '20',
          deleted_documents: '5',
          ephemeral_documents: '3',
          avg_quality_score: '87.5',
          first_generation: '2025-10-01T10:00:00Z',
          last_generation: '2025-11-15T16:00:00Z'
        }]
      };

      sql.mockResolvedValue(mockStats);

      const result = await documentService.getUserStats(42);

      expect(result).toEqual(mockStats.rows[0]);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        documentService.getUserStats(null)
      ).rejects.toThrow('User ID is required');
    });
  });
});
