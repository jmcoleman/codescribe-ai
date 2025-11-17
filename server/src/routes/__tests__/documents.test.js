/**
 * Integration tests for Documents API endpoints
 *
 * Tests all CRUD operations for generated documents including:
 * - POST /api/documents - Save document
 * - GET /api/documents - List documents with pagination
 * - GET /api/documents/stats - Get user statistics
 * - GET /api/documents/:id - Get single document
 * - DELETE /api/documents/:id - Soft delete document
 * - DELETE /api/documents - Bulk delete
 * - POST /api/documents/:id/restore - Restore deleted document
 * - DELETE /api/documents/ephemeral - Delete ephemeral documents
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 * - Use ES6 imports with jest.mock() BEFORE the actual imports
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing routes
jest.mock('../../middleware/auth.js', () => ({
  requireAuth: jest.fn((req, res, next) => next()),
  validateBody: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../../services/documentService.js', () => ({
  default: {
    saveDocument: jest.fn(),
    getUserDocuments: jest.fn(),
    getDocument: jest.fn(),
    deleteDocument: jest.fn(),
    bulkDeleteDocuments: jest.fn(),
    restoreDocument: jest.fn(),
    deleteEphemeralDocuments: jest.fn(),
    getUserStats: jest.fn()
  }
}));

// Now import routes and mocked modules
import documentsRouter from '../documents.js';
import { requireAuth } from '../../middleware/auth.js';
import documentService from '../../services/documentService.js';

// Get mocked version (the mock is automatically applied by Jest)
const mockedDocumentService = documentService;

describe('Documents Routes', () => {
  let app;
  let mockUser;

  beforeEach(() => {
    // Create Express app with documents routes
    app = express();
    app.use(express.json());
    app.use('/api/documents', documentsRouter);

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

    // Set default mock implementations for document service
    mockedDocumentService.saveDocument.mockResolvedValue({ documentId: 'doc-123', savedAt: new Date().toISOString() });
    mockedDocumentService.getUserDocuments.mockResolvedValue({ documents: [], total: 0, hasMore: false });
    mockedDocumentService.getDocument.mockResolvedValue(null);
    mockedDocumentService.deleteDocument.mockResolvedValue(null);
    mockedDocumentService.bulkDeleteDocuments.mockResolvedValue(0);
    mockedDocumentService.restoreDocument.mockResolvedValue(null);
    mockedDocumentService.deleteEphemeralDocuments.mockResolvedValue(0);
    mockedDocumentService.getUserStats.mockResolvedValue({});
  });

  describe('POST /api/documents', () => {
    it('should save a document successfully', async () => {
      const mockResult = {
        documentId: 'doc-123-uuid',
        savedAt: '2025-11-15T12:00:00Z'
      };

      mockedDocumentService.saveDocument.mockResolvedValue(mockResult);

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

      const response = await request(app)
        .post('/api/documents')
        .send(docData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.documentId).toBe('doc-123-uuid');
      expect(mockedDocumentService.saveDocument).toHaveBeenCalledWith(42, expect.objectContaining({
        filename: 'test.js',
        language: 'javascript'
      }));
    });

    it('should save a document with GitHub metadata', async () => {
      const mockResult = {
        documentId: 'doc-456-uuid',
        savedAt: '2025-11-15T13:00:00Z'
      };

      mockedDocumentService.saveDocument.mockResolvedValue(mockResult);

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
        githubSha: 'abc123',
        githubBranch: 'main'
      };

      const response = await request(app)
        .post('/api/documents')
        .send(docData);

      expect(response.status).toBe(200);
      expect(response.body.documentId).toBe('doc-456-uuid');
      expect(mockedDocumentService.saveDocument).toHaveBeenCalledWith(42, expect.objectContaining({
        githubRepo: 'acme-corp/project',
        githubPath: 'src/auth.js'
      }));
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/documents')
        .send({
          filename: 'test.js',
          language: 'javascript',
          fileSize: 1024,
          documentation: '# Test',
          qualityScore: { score: 85 },
          docType: 'README',
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250929'
        });

      expect(requireAuth).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockedDocumentService.saveDocument.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/documents')
        .send({
          filename: 'test.js',
          language: 'javascript',
          fileSize: 1024,
          documentation: '# Test',
          qualityScore: { score: 85 },
          docType: 'README',
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250929'
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/documents', () => {
    it('should fetch user documents with default pagination', async () => {
      const mockResult = {
        documents: [
          {
            id: 'doc-1',
            filename: 'test1.js',
            documentation: '# Doc 1',
            generated_at: '2025-11-15T12:00:00Z'
          },
          {
            id: 'doc-2',
            filename: 'test2.js',
            documentation: '# Doc 2',
            generated_at: '2025-11-15T11:00:00Z'
          }
        ],
        total: 2,
        hasMore: false
      };

      mockedDocumentService.getUserDocuments.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/documents');

      expect(response.status).toBe(200);
      expect(response.body.documents).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.hasMore).toBe(false);
      expect(mockedDocumentService.getUserDocuments).toHaveBeenCalledWith(42, {
        limit: 50,
        offset: 0,
        sort: 'generated_at:desc',
        includeDeleted: false
      });
    });

    it('should support custom pagination parameters', async () => {
      const mockResult = {
        documents: [],
        total: 100,
        hasMore: true
      };

      mockedDocumentService.getUserDocuments.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/documents?limit=10&offset=20&sort=filename:asc');

      expect(response.status).toBe(200);
      expect(mockedDocumentService.getUserDocuments).toHaveBeenCalledWith(42, {
        limit: 10,
        offset: 20,
        sort: 'filename:asc',
        includeDeleted: false
      });
    });

    it('should support includeDeleted flag', async () => {
      mockedDocumentService.getUserDocuments.mockResolvedValue({
        documents: [],
        total: 0,
        hasMore: false
      });

      await request(app)
        .get('/api/documents?includeDeleted=true');

      expect(mockedDocumentService.getUserDocuments).toHaveBeenCalledWith(42, {
        limit: 50,
        offset: 0,
        sort: 'generated_at:desc',
        includeDeleted: true
      });
    });

    it('should require authentication', async () => {
      await request(app).get('/api/documents');

      expect(requireAuth).toHaveBeenCalled();
    });
  });

  describe('GET /api/documents/stats', () => {
    it('should fetch user document statistics', async () => {
      const mockStats = {
        total_documents: '25',
        active_documents: '20',
        deleted_documents: '5',
        ephemeral_documents: '3',
        avg_quality_score: '87.5',
        first_generation: '2025-10-01T10:00:00Z',
        last_generation: '2025-11-15T16:00:00Z'
      };

      mockedDocumentService.getUserStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/documents/stats');

      expect(response.status).toBe(200);
      expect(response.body.total_documents).toBe('25');
      expect(response.body.avg_quality_score).toBe('87.5');
      expect(mockedDocumentService.getUserStats).toHaveBeenCalledWith(42);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/documents/stats');

      expect(requireAuth).toHaveBeenCalled();
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should fetch a single document', async () => {
      const mockDocument = {
        id: 'doc-123',
        filename: 'test.js',
        documentation: '# Test',
        user_id: 42
      };

      mockedDocumentService.getDocument.mockResolvedValue(mockDocument);

      const response = await request(app)
        .get('/api/documents/doc-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('doc-123');
      expect(response.body.filename).toBe('test.js');
      expect(mockedDocumentService.getDocument).toHaveBeenCalledWith(42, 'doc-123');
    });

    it('should return 404 if document not found', async () => {
      mockedDocumentService.getDocument.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/documents/doc-nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Document not found');
    });

    it('should require authentication', async () => {
      mockedDocumentService.getDocument.mockResolvedValue({ id: 'doc-123' });

      await request(app).get('/api/documents/doc-123');

      expect(requireAuth).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should soft delete a document', async () => {
      const mockResult = {
        deleted_at: '2025-11-15T14:00:00Z'
      };

      mockedDocumentService.deleteDocument.mockResolvedValue(mockResult);

      const response = await request(app)
        .delete('/api/documents/doc-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedAt).toBe('2025-11-15T14:00:00Z');
      expect(mockedDocumentService.deleteDocument).toHaveBeenCalledWith(42, 'doc-123');
    });

    it('should return 404 if document not found', async () => {
      mockedDocumentService.deleteDocument.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/documents/doc-nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Document not found or already deleted');
    });

    it('should require authentication', async () => {
      await request(app).delete('/api/documents/doc-123');

      expect(requireAuth).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/documents', () => {
    it('should bulk delete documents', async () => {
      mockedDocumentService.bulkDeleteDocuments.mockResolvedValue(3);

      const response = await request(app)
        .delete('/api/documents')
        .send({ documentIds: ['doc-1', 'doc-2', 'doc-3'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(3);
      expect(mockedDocumentService.bulkDeleteDocuments).toHaveBeenCalledWith(42, ['doc-1', 'doc-2', 'doc-3']);
    });

    it('should return 400 if documentIds is not an array', async () => {
      const response = await request(app)
        .delete('/api/documents')
        .send({ documentIds: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('documentIds must be a non-empty array');
    });

    it('should return 400 if documentIds is empty', async () => {
      const response = await request(app)
        .delete('/api/documents')
        .send({ documentIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('documentIds must be a non-empty array');
    });

    it('should require authentication', async () => {
      await request(app)
        .delete('/api/documents')
        .send({ documentIds: ['doc-1'] });

      expect(requireAuth).toHaveBeenCalled();
    });
  });

  describe('POST /api/documents/:id/restore', () => {
    it('should restore a soft-deleted document', async () => {
      const mockResult = {
        restored_at: '2025-11-15T15:00:00Z'
      };

      mockedDocumentService.restoreDocument.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/documents/doc-123/restore');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.restoredAt).toBe('2025-11-15T15:00:00Z');
      expect(mockedDocumentService.restoreDocument).toHaveBeenCalledWith(42, 'doc-123');
    });

    it('should return 404 if document not found or restoration window expired', async () => {
      mockedDocumentService.restoreDocument.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/documents/doc-expired/restore');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Document not found or restoration window expired (30 days)');
    });

    it('should require authentication', async () => {
      await request(app).post('/api/documents/doc-123/restore');

      expect(requireAuth).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/documents/ephemeral', () => {
    it('should delete all ephemeral documents for the user', async () => {
      mockedDocumentService.deleteEphemeralDocuments.mockResolvedValue(5);

      const response = await request(app)
        .delete('/api/documents/ephemeral');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(5);
      expect(mockedDocumentService.deleteEphemeralDocuments).toHaveBeenCalledWith(42);
    });

    it('should return 0 if no ephemeral documents exist', async () => {
      mockedDocumentService.deleteEphemeralDocuments.mockResolvedValue(0);

      const response = await request(app)
        .delete('/api/documents/ephemeral');

      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app).delete('/api/documents/ephemeral');

      expect(requireAuth).toHaveBeenCalled();
    });
  });
});
