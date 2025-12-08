/**
 * Integration tests for graph context in generate endpoints
 * Tests POST /api/generate and POST /api/generate-stream with graph context
 */

import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing routes
jest.mock('../../services/graphService.js');
jest.mock('../../services/docGenerator.js');
jest.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    next();
  },
  optionalAuth: (req, res, next) => next(),
}));
jest.mock('../../middleware/tierGate.js', () => ({
  checkUsage: () => (req, res, next) => next(),
  incrementUsage: jest.fn(),
  requireFeature: () => (req, res, next) => next(),
}));
jest.mock('../../middleware/rateLimiter.js', () => ({
  apiLimiter: (req, res, next) => next(),
  generationLimiter: (req, res, next) => next(),
}));
jest.mock('../../middleware/rateLimitBypass.js', () => ({
  rateLimitBypass: (req, res, next) => next(),
}));

// Import AFTER all mocks are set up
import apiRoutes from '../api.js';
import graphService from '../../services/graphService.js';
import docGenerator from '../../services/docGenerator.js';

describe('Graph Context in Generate Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware - attach user to request based on auth header
    app.use((req, res, next) => {
      if (req.headers.authorization === 'Bearer valid-token') {
        req.user = { id: 1, tier: 'pro', effectiveTier: 'pro' };
      }
      next();
    });

    app.use('/api', apiRoutes);
    jest.clearAllMocks();

    // Default mock for docGenerator
    docGenerator.generateDocumentation.mockResolvedValue({
      documentation: '# Test Documentation',
      qualityScore: { score: 85, grade: 'B' },
      metadata: { provider: 'claude', model: 'claude-sonnet-4-5-20250929' }
    });
    docGenerator.buildAttribution.mockReturnValue('');
  });

  describe('POST /api/generate with graph context', () => {
    it('should pass graph context to docGenerator when projectId and filePath provided', async () => {
      const mockContext = {
        contextString: 'This module exports: foo, bar. It is imported by 2 file(s): a.js, b.js.',
        stats: { dependentCount: 2, dependencyCount: 1 },
        node: { exports: ['foo', 'bar'] },
        dependents: [{ path: 'a.js' }, { path: 'b.js' }],
        dependencies: [{ path: 'utils.js' }]
      };
      graphService.getFileContext.mockResolvedValue(mockContext);

      await request(app)
        .post('/api/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          docType: 'README',
          projectId: 'abc123',
          filePath: 'src/utils.js'
        })
        .expect(200);

      expect(graphService.getFileContext).toHaveBeenCalledWith('abc123', 'src/utils.js', 1);
      expect(docGenerator.generateDocumentation).toHaveBeenCalledWith(
        'function test() {}',
        expect.objectContaining({
          graphContext: mockContext
        })
      );
    });

    it('should work without graph context (backward compatibility)', async () => {
      await request(app)
        .post('/api/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          docType: 'README'
        })
        .expect(200);

      expect(graphService.getFileContext).not.toHaveBeenCalled();
      expect(docGenerator.generateDocumentation).toHaveBeenCalledWith(
        'function test() {}',
        expect.objectContaining({
          graphContext: null
        })
      );
    });

    it('should gracefully handle graph not found', async () => {
      graphService.getFileContext.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          projectId: 'nonexistent',
          filePath: 'src/file.js'
        })
        .expect(200);

      expect(docGenerator.generateDocumentation).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          graphContext: null
        })
      );
    });

    it('should gracefully handle graphService errors', async () => {
      graphService.getFileContext.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          projectId: 'abc123',
          filePath: 'src/file.js'
        })
        .expect(200);

      // Should still succeed with null graphContext
      expect(docGenerator.generateDocumentation).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          graphContext: null
        })
      );
    });

    it('should skip graph context for unauthenticated users', async () => {
      await request(app)
        .post('/api/generate')
        // No Authorization header
        .send({
          code: 'function test() {}',
          projectId: 'abc123',
          filePath: 'src/file.js'
        })
        .expect(200);

      // Should not call getFileContext without auth
      expect(graphService.getFileContext).not.toHaveBeenCalled();
    });

    it('should skip graph context if only projectId provided', async () => {
      await request(app)
        .post('/api/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          projectId: 'abc123'
          // filePath missing
        })
        .expect(200);

      expect(graphService.getFileContext).not.toHaveBeenCalled();
    });

    it('should skip graph context if only filePath provided', async () => {
      await request(app)
        .post('/api/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          filePath: 'src/file.js'
          // projectId missing
        })
        .expect(200);

      expect(graphService.getFileContext).not.toHaveBeenCalled();
    });

    it('should skip graph context if projectId is empty string', async () => {
      await request(app)
        .post('/api/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          projectId: '',
          filePath: 'src/file.js'
        })
        .expect(200);

      expect(graphService.getFileContext).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/generate-stream with graph context', () => {
    it('should pass graph context to docGenerator when projectId and filePath provided', async () => {
      const mockContext = {
        contextString: 'This module exports: authenticate. It is imported by 3 file(s).',
        stats: { dependentCount: 3, dependencyCount: 2 }
      };
      graphService.getFileContext.mockResolvedValue(mockContext);

      const res = await request(app)
        .post('/api/generate-stream')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function authenticate() {}',
          docType: 'API',
          projectId: 'proj456',
          filePath: 'src/auth.js'
        })
        .expect(200);

      expect(graphService.getFileContext).toHaveBeenCalledWith('proj456', 'src/auth.js', 1);
      expect(docGenerator.generateDocumentation).toHaveBeenCalledWith(
        'function authenticate() {}',
        expect.objectContaining({
          graphContext: mockContext,
          streaming: true
        })
      );
    });

    it('should work without graph context (backward compatibility)', async () => {
      const res = await request(app)
        .post('/api/generate-stream')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          docType: 'JSDOC'
        })
        .expect(200);

      expect(graphService.getFileContext).not.toHaveBeenCalled();
      expect(docGenerator.generateDocumentation).toHaveBeenCalledWith(
        'function test() {}',
        expect.objectContaining({
          graphContext: null,
          streaming: true
        })
      );
    });

    it('should gracefully handle graph errors for streaming', async () => {
      graphService.getFileContext.mockRejectedValue(new Error('Network error'));

      const res = await request(app)
        .post('/api/generate-stream')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() {}',
          projectId: 'abc123',
          filePath: 'src/file.js'
        })
        .expect(200);

      // Should still succeed with null graphContext
      expect(docGenerator.generateDocumentation).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          graphContext: null
        })
      );
    });

    it('should skip graph context for unauthenticated streaming requests', async () => {
      await request(app)
        .post('/api/generate-stream')
        // No Authorization header
        .send({
          code: 'function test() {}',
          projectId: 'abc123',
          filePath: 'src/file.js'
        })
        .expect(200);

      expect(graphService.getFileContext).not.toHaveBeenCalled();
    });
  });
});
