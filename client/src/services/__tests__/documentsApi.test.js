/**
 * Tests for documentsApi Service
 *
 * Tests all document persistence API calls including:
 * - Saving documents
 * - Loading documents
 * - Deleting/restoring documents
 * - Ephemeral cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as documentsApi from '../documentsApi';
import api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }
}));

describe('documentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveDocument', () => {
    it('should call POST /documents with correct data', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-123',
          savedAt: '2025-11-15T12:00:00Z'
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        origin: 'upload',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        llm: {
          inputTokens: 500,
          outputTokens: 1000,
          wasCached: true,
          latencyMs: 1250
        }
      };

      const result = await documentsApi.saveDocument(docData);

      expect(api.post).toHaveBeenCalledWith('/documents', {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        origin: 'upload',
        githubRepo: null,
        githubPath: null,
        githubSha: null,
        githubBranch: null,
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: 500,
        outputTokens: 1000,
        wasCached: true,
        latencyMs: 1250,
        isEphemeral: false
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should include GitHub metadata when provided', async () => {
      const mockResponse = { data: { documentId: 'doc-123', savedAt: '2025-11-15T12:00:00Z' } };
      api.post.mockResolvedValue(mockResponse);

      const docData = {
        filename: 'auth.js',
        language: 'javascript',
        fileSize: 2048,
        documentation: '# Auth Module',
        qualityScore: { score: 90, grade: 'A' },
        docType: 'README',
        origin: 'github',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        github: {
          repo: 'acme/project',
          path: 'src/auth.js',
          sha: 'abc123',
          branch: 'main'
        }
      };

      await documentsApi.saveDocument(docData);

      expect(api.post).toHaveBeenCalledWith('/documents', expect.objectContaining({
        githubRepo: 'acme/project',
        githubPath: 'src/auth.js',
        githubSha: 'abc123',
        githubBranch: 'main',
        origin: 'github'
      }));
    });

    it('should mark as ephemeral when specified', async () => {
      const mockResponse = { data: { documentId: 'doc-123', savedAt: '2025-11-15T12:00:00Z' } };
      api.post.mockResolvedValue(mockResponse);

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        isEphemeral: true
      };

      await documentsApi.saveDocument(docData);

      expect(api.post).toHaveBeenCalledWith('/documents', expect.objectContaining({
        isEphemeral: true
      }));
    });
  });

  describe('getUserDocuments', () => {
    it('should call GET /documents with default options', async () => {
      const mockResponse = {
        data: {
          documents: [],
          total: 0,
          hasMore: false
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await documentsApi.getUserDocuments();

      expect(api.get).toHaveBeenCalledWith('/documents?limit=50&offset=0&sort=generated_at%3Adesc');
      expect(result).toEqual(mockResponse.data);
    });

    it('should call GET /documents with custom options', async () => {
      const mockResponse = {
        data: {
          documents: [],
          total: 100,
          hasMore: true
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await documentsApi.getUserDocuments({
        limit: 25,
        offset: 50,
        sort: 'filename:asc'
      });

      expect(api.get).toHaveBeenCalledWith('/documents?limit=25&offset=50&sort=filename%3Aasc');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getDocument', () => {
    it('should call GET /documents/:id', async () => {
      const mockResponse = {
        data: {
          id: 'doc-123',
          filename: 'test.js',
          documentation: '# Test'
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await documentsApi.getDocument('doc-123');

      expect(api.get).toHaveBeenCalledWith('/documents/doc-123');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteDocument', () => {
    it('should call DELETE /documents/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          deletedAt: '2025-11-15T12:00:00Z'
        }
      };
      api.delete.mockResolvedValue(mockResponse);

      const result = await documentsApi.deleteDocument('doc-123');

      expect(api.delete).toHaveBeenCalledWith('/documents/doc-123');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('bulkDeleteDocuments', () => {
    it('should call DELETE /documents with documentIds in body', async () => {
      const mockResponse = {
        data: {
          success: true,
          deletedCount: 3
        }
      };
      api.delete.mockResolvedValue(mockResponse);

      const documentIds = ['doc-1', 'doc-2', 'doc-3'];
      const result = await documentsApi.bulkDeleteDocuments(documentIds);

      expect(api.delete).toHaveBeenCalledWith('/documents', {
        data: { documentIds }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('restoreDocument', () => {
    it('should call POST /documents/:id/restore', async () => {
      const mockResponse = {
        data: {
          success: true,
          restoredAt: '2025-11-15T12:00:00Z'
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await documentsApi.restoreDocument('doc-123');

      expect(api.post).toHaveBeenCalledWith('/documents/doc-123/restore');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteEphemeralDocuments', () => {
    it('should call DELETE /documents/ephemeral', async () => {
      const mockResponse = {
        data: {
          success: true,
          deletedCount: 5
        }
      };
      api.delete.mockResolvedValue(mockResponse);

      const result = await documentsApi.deleteEphemeralDocuments();

      expect(api.delete).toHaveBeenCalledWith('/documents/ephemeral');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getUserStats', () => {
    it('should call GET /documents/stats', async () => {
      const mockResponse = {
        data: {
          totalDocuments: 42,
          avgQualityScore: 87.5
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await documentsApi.getUserStats();

      expect(api.get).toHaveBeenCalledWith('/documents/stats');
      expect(result).toEqual(mockResponse.data);
    });
  });
});
