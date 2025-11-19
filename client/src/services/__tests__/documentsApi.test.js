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

// Mock global fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('documentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('saveDocument', () => {
    it('should call POST /documents with correct data', async () => {
      const mockResponseData = {
        documentId: 'doc-123',
        savedAt: '2025-11-15T12:00:00Z'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

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

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"filename":"test.js"')
        })
      );

      expect(result).toEqual(mockResponseData);
    });

    it('should include GitHub metadata when provided', async () => {
      const mockResponseData = { documentId: 'doc-123', savedAt: '2025-11-15T12:00:00Z' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

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

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"githubRepo":"acme/project"')
        })
      );
    });

    it('should mark as ephemeral when specified', async () => {
      const mockResponseData = { documentId: 'doc-123', savedAt: '2025-11-15T12:00:00Z' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

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

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"isEphemeral":true')
        })
      );
    });
  });

  describe('getUserDocuments', () => {
    it('should call GET /documents with default options', async () => {
      const mockResponseData = {
        documents: [],
        total: 0,
        hasMore: false
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await documentsApi.getUserDocuments();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents?limit=50&offset=0&sort=generated_at%3Adesc'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(result).toEqual(mockResponseData);
    });

    it('should call GET /documents with custom options', async () => {
      const mockResponseData = {
        documents: [],
        total: 100,
        hasMore: true
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await documentsApi.getUserDocuments({
        limit: 25,
        offset: 50,
        sort: 'filename:asc'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents?limit=25&offset=50&sort=filename%3Aasc'),
        expect.anything()
      );
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('getDocument', () => {
    it('should call GET /documents/:id', async () => {
      const mockResponseData = {
        id: 'doc-123',
        filename: 'test.js',
        documentation: '# Test'
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await documentsApi.getDocument('doc-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/doc-123'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('deleteDocument', () => {
    it('should call DELETE /documents/:id', async () => {
      const mockResponseData = {
        success: true,
        deletedAt: '2025-11-15T12:00:00Z'
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await documentsApi.deleteDocument('doc-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/doc-123'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('bulkDeleteDocuments', () => {
    it('should call DELETE /documents with documentIds in body', async () => {
      const mockResponseData = {
        success: true,
        deletedCount: 3
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const documentIds = ['doc-1', 'doc-2', 'doc-3'];
      const result = await documentsApi.bulkDeleteDocuments(documentIds);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents'),
        expect.objectContaining({
          method: 'DELETE',
          body: expect.stringContaining('"documentIds"')
        })
      );
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('restoreDocument', () => {
    it('should call POST /documents/:id/restore', async () => {
      const mockResponseData = {
        success: true,
        restoredAt: '2025-11-15T12:00:00Z'
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await documentsApi.restoreDocument('doc-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/doc-123/restore'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('deleteEphemeralDocuments', () => {
    it('should call DELETE /documents/ephemeral', async () => {
      const mockResponseData = {
        success: true,
        deletedCount: 5
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await documentsApi.deleteEphemeralDocuments();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/ephemeral'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('getUserStats', () => {
    it('should call GET /documents/stats', async () => {
      const mockResponseData = {
        totalDocuments: 42,
        avgQualityScore: 87.5
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await documentsApi.getUserStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/stats'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(result).toEqual(mockResponseData);
    });
  });
});
