/**
 * Tests for batchesApi Service
 *
 * Tests all batch and export API calls including:
 * - Creating batches
 * - Linking documents to batches
 * - Getting user batches
 * - Exporting batches as ZIP
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as batchesApi from '../batchesApi';

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

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('batchesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('createBatch', () => {
    it('should call POST /batches with correct data', async () => {
      const mockResponseData = {
        success: true,
        batchId: 'batch-123',
        createdAt: '2025-12-01T12:00:00Z'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const batchData = {
        batchType: 'batch',
        totalFiles: 5,
        successCount: 4,
        failCount: 1,
        avgQualityScore: 85,
        avgGrade: 'B',
        summaryMarkdown: '# Summary',
        docTypes: ['README', 'JSDOC']
      };

      const result = await batchesApi.createBatch(batchData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"batchType":"batch"')
        })
      );

      expect(result).toEqual(mockResponseData);
    });

    it('should throw error on failed request', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Failed to create batch' })
      });

      await expect(batchesApi.createBatch({
        batchType: 'batch',
        totalFiles: 1,
        successCount: 1,
        failCount: 0
      })).rejects.toThrow('Failed to create batch');
    });
  });

  describe('linkDocumentsToBatch', () => {
    it('should link documents to a batch', async () => {
      const mockResponseData = {
        success: true,
        linkedCount: 3
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await batchesApi.linkDocumentsToBatch('batch-123', ['doc-1', 'doc-2', 'doc-3']);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches/batch-123/link'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"documentIds"')
        })
      );

      expect(result.linkedCount).toBe(3);
    });
  });

  describe('getUserBatches', () => {
    it('should get user batches with pagination', async () => {
      const mockResponseData = {
        batches: [
          { id: 'batch-1', batch_type: 'batch', total_files: 5 }
        ],
        total: 10,
        hasMore: true
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await batchesApi.getUserBatches({ limit: 10, offset: 0 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches?'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );

      expect(result.batches).toHaveLength(1);
      expect(result.total).toBe(10);
    });
  });

  describe('getBatch', () => {
    it('should get a single batch by ID', async () => {
      const mockResponseData = {
        id: 'batch-123',
        batch_type: 'batch',
        total_files: 5,
        success_count: 5,
        fail_count: 0
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await batchesApi.getBatch('batch-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches/batch-123'),
        expect.any(Object)
      );

      expect(result.id).toBe('batch-123');
    });
  });

  describe('getBatchWithDocuments', () => {
    it('should get batch with all its documents', async () => {
      const mockResponseData = {
        batch: { id: 'batch-123', summary_markdown: '# Summary' },
        documents: [
          { id: 'doc-1', filename: 'file1.js', documentation: '# File 1' }
        ]
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await batchesApi.getBatchWithDocuments('batch-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches/batch-123/documents'),
        expect.any(Object)
      );

      expect(result.batch).toBeDefined();
      expect(result.documents).toHaveLength(1);
    });
  });

  describe('deleteBatch', () => {
    it('should delete a batch', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await batchesApi.deleteBatch('batch-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches/batch-123'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('getBatchStats', () => {
    it('should get batch statistics', async () => {
      const mockResponseData = {
        total_batches: '10',
        total_files_generated: '45',
        overall_avg_quality: '85.5'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await batchesApi.getBatchStats();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches/stats'),
        expect.any(Object)
      );

      expect(result.total_batches).toBe('10');
    });
  });

  describe('exportBatchZip', () => {
    it('should export batch as ZIP and return blob', async () => {
      const mockBlob = new Blob(['mock zip content'], { type: 'application/zip' });
      const mockHeaders = new Headers({
        'Content-Disposition': 'attachment; filename="codescribe-batch-2025-12-01.zip"',
        'Content-Type': 'application/zip'
      });

      global.fetch.mockResolvedValue({
        ok: true,
        headers: mockHeaders,
        blob: async () => mockBlob
      });

      const result = await batchesApi.exportBatchZip('batch-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches/batch-123/export'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );

      expect(result.blob).toBeDefined();
      expect(result.filename).toBe('codescribe-batch-2025-12-01.zip');
    });

    it('should use default filename when header not present', async () => {
      const mockBlob = new Blob(['mock zip content'], { type: 'application/zip' });
      const mockHeaders = new Headers({
        'Content-Type': 'application/zip'
      });

      global.fetch.mockResolvedValue({
        ok: true,
        headers: mockHeaders,
        blob: async () => mockBlob
      });

      const result = await batchesApi.exportBatchZip('batch-123');

      expect(result.filename).toBe('codescribe-export.zip');
    });
  });

  describe('exportDocumentsZip', () => {
    it('should export selected documents as ZIP', async () => {
      const mockBlob = new Blob(['mock zip content'], { type: 'application/zip' });
      const mockHeaders = new Headers({
        'Content-Disposition': 'attachment; filename="codescribe-export-2025-12-01.zip"',
        'Content-Type': 'application/zip'
      });

      global.fetch.mockResolvedValue({
        ok: true,
        headers: mockHeaders,
        blob: async () => mockBlob
      });

      const result = await batchesApi.exportDocumentsZip(['doc-1', 'doc-2']);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/batches/export'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"documentIds"')
        })
      );

      expect(result.blob).toBeDefined();
    });
  });

  describe('downloadBlob', () => {
    it('should create and click download link', () => {
      const mockBlob = new Blob(['test content']);
      const mockA = {
        href: '',
        download: '',
        click: vi.fn()
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockA);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      batchesApi.downloadBlob(mockBlob, 'test.zip');

      expect(mockA.href).toBe('blob:mock-url');
      expect(mockA.download).toBe('test.zip');
      expect(mockA.click).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
