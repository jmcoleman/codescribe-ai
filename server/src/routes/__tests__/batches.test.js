/**
 * Integration tests for Batches API endpoints
 *
 * Tests batch and export operations:
 * - POST /api/batches - Create batch
 * - POST /api/batches/:id/link - Link documents to batch
 * - GET /api/batches - List user batches
 * - GET /api/batches/stats - Get batch statistics
 * - GET /api/batches/:id - Get single batch
 * - GET /api/batches/:id/documents - Get batch with documents
 * - GET /api/batches/:id/export - Export batch as ZIP
 * - POST /api/batches/export - Export selected documents as ZIP
 * - DELETE /api/batches/:id - Delete batch
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { PassThrough } from 'stream';

// Mock dependencies BEFORE importing routes
jest.mock('../../middleware/auth.js', () => ({
  requireAuth: jest.fn((req, res, next) => next()),
  validateBody: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../../services/batchService.js');
jest.mock('../../services/exportService.js');

// Now import routes and mocked modules
import batchesRouter from '../batches.js';
import { requireAuth } from '../../middleware/auth.js';
import batchService from '../../services/batchService.js';
import exportService from '../../services/exportService.js';

// Get mock functions
const mockCreateBatch = batchService.createBatch;
const mockLinkDocumentsToBatch = batchService.linkDocumentsToBatch;
const mockGetUserBatches = batchService.getUserBatches;
const mockGetBatch = batchService.getBatch;
const mockGetBatchWithDocuments = batchService.getBatchWithDocuments;
const mockDeleteBatch = batchService.deleteBatch;
const mockGetUserBatchStats = batchService.getUserBatchStats;
const mockGetDocumentsByIds = batchService.getDocumentsByIds;
const mockCreateBatchZip = exportService.createBatchZip;
const mockCreateDocumentsZip = exportService.createDocumentsZip;

describe('Batches Routes', () => {
  let app;
  let mockUser;

  beforeEach(() => {
    // Create Express app with batches routes
    app = express();
    app.use(express.json());
    app.use('/api/batches', batchesRouter);

    // Reset mocks
    jest.clearAllMocks();

    // Default mock user
    mockUser = {
      id: 42,
      email: 'test@example.com',
      tier: 'pro'
    };

    // Mock requireAuth to add user to request
    requireAuth.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Set default mock implementations
    mockCreateBatch.mockResolvedValue({ batchId: 'batch-123', createdAt: new Date().toISOString() });
    mockLinkDocumentsToBatch.mockResolvedValue(2);
    mockGetUserBatches.mockResolvedValue({ batches: [], total: 0, hasMore: false });
    mockGetBatch.mockResolvedValue(null);
    mockGetBatchWithDocuments.mockResolvedValue(null);
    mockDeleteBatch.mockResolvedValue(false);
    mockGetUserBatchStats.mockResolvedValue({});
    mockGetDocumentsByIds.mockResolvedValue([]);
  });

  describe('POST /api/batches', () => {
    it('should create a batch successfully', async () => {
      const batchData = {
        batchType: 'batch',
        totalFiles: 5,
        successCount: 4,
        failCount: 1,
        avgQualityScore: 85,
        avgGrade: 'B',
        summaryMarkdown: '# Summary'
      };

      mockCreateBatch.mockResolvedValue({
        batchId: 'batch-123',
        createdAt: '2025-12-01T12:00:00Z'
      });

      const response = await request(app)
        .post('/api/batches')
        .send(batchData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.batchId).toBe('batch-123');
      expect(mockCreateBatch).toHaveBeenCalledWith(42, expect.objectContaining({
        batchType: 'batch',
        totalFiles: 5
      }));
    });
  });

  describe('POST /api/batches/:id/link', () => {
    it('should link documents to a batch', async () => {
      mockLinkDocumentsToBatch.mockResolvedValue(3);

      const response = await request(app)
        .post('/api/batches/batch-123/link')
        .send({ documentIds: ['doc-1', 'doc-2', 'doc-3'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.linkedCount).toBe(3);
    });
  });

  describe('GET /api/batches', () => {
    it('should return user batches', async () => {
      mockGetUserBatches.mockResolvedValue({
        batches: [
          { id: 'batch-1', batch_type: 'batch', total_files: 5 }
        ],
        total: 1,
        hasMore: false
      });

      const response = await request(app)
        .get('/api/batches');

      expect(response.status).toBe(200);
      expect(response.body.batches).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });

    it('should support pagination', async () => {
      mockGetUserBatches.mockResolvedValue({
        batches: [],
        total: 100,
        hasMore: true
      });

      const response = await request(app)
        .get('/api/batches?limit=10&offset=20');

      expect(response.status).toBe(200);
      expect(mockGetUserBatches).toHaveBeenCalledWith(42, {
        limit: 10,
        offset: 20,
        batchType: null
      });
    });
  });

  describe('GET /api/batches/stats', () => {
    it('should return batch statistics', async () => {
      mockGetUserBatchStats.mockResolvedValue({
        total_batches: '10',
        total_files_generated: '45'
      });

      const response = await request(app)
        .get('/api/batches/stats');

      expect(response.status).toBe(200);
      expect(response.body.total_batches).toBe('10');
    });
  });

  describe('GET /api/batches/:id', () => {
    it('should return a batch by ID', async () => {
      mockGetBatch.mockResolvedValue({
        id: 'batch-123',
        batch_type: 'batch',
        total_files: 5
      });

      const response = await request(app)
        .get('/api/batches/batch-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('batch-123');
    });

    it('should return 404 for non-existent batch', async () => {
      mockGetBatch.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/batches/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Batch not found');
    });
  });

  describe('GET /api/batches/:id/documents', () => {
    it('should return batch with documents', async () => {
      mockGetBatchWithDocuments.mockResolvedValue({
        batch: { id: 'batch-123' },
        documents: [
          { id: 'doc-1', filename: 'file1.js' }
        ]
      });

      const response = await request(app)
        .get('/api/batches/batch-123/documents');

      expect(response.status).toBe(200);
      expect(response.body.batch).toBeDefined();
      expect(response.body.documents).toHaveLength(1);
    });

    it('should return 404 when batch not found', async () => {
      mockGetBatchWithDocuments.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/batches/nonexistent/documents');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/batches/:id/export', () => {
    it('should export batch as ZIP', async () => {
      const mockStream = new PassThrough();
      // End stream immediately to prevent timeout
      process.nextTick(() => mockStream.end());

      mockGetBatchWithDocuments.mockResolvedValue({
        batch: { id: 'batch-123' },
        documents: [{ id: 'doc-1', documentation: '# Test' }]
      });
      mockCreateBatchZip.mockResolvedValue({
        stream: mockStream,
        filename: 'codescribe-batch-2025-12-01.zip',
        fileCount: 1
      });

      const response = await request(app)
        .get('/api/batches/batch-123/export');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
    });

    it('should return 404 when batch not found', async () => {
      mockGetBatchWithDocuments.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/batches/nonexistent/export');

      expect(response.status).toBe(404);
    });

    it('should return 400 when batch has no documents', async () => {
      mockGetBatchWithDocuments.mockResolvedValue({
        batch: { id: 'batch-123' },
        documents: []
      });

      const response = await request(app)
        .get('/api/batches/batch-123/export');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Batch has no documents to export');
    });
  });

  describe('POST /api/batches/export', () => {
    it('should export selected documents as ZIP', async () => {
      const mockStream = new PassThrough();
      // End stream immediately to prevent timeout
      process.nextTick(() => mockStream.end());

      mockGetDocumentsByIds.mockResolvedValue([
        { id: 'doc-1', documentation: '# Test' }
      ]);
      mockCreateDocumentsZip.mockResolvedValue({
        stream: mockStream,
        filename: 'codescribe-export-2025-12-01.zip',
        fileCount: 1
      });

      const response = await request(app)
        .post('/api/batches/export')
        .send({ documentIds: ['doc-1'] });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
    });

    it('should return 400 for empty documentIds', async () => {
      const response = await request(app)
        .post('/api/batches/export')
        .send({ documentIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('documentIds must be a non-empty array');
    });

    it('should return 404 when no documents found', async () => {
      mockGetDocumentsByIds.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/batches/export')
        .send({ documentIds: ['nonexistent'] });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No documents found for the given IDs');
    });
  });

  describe('DELETE /api/batches/:id', () => {
    it('should delete a batch', async () => {
      mockDeleteBatch.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/batches/batch-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent batch', async () => {
      mockDeleteBatch.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/batches/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
