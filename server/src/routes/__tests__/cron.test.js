/**
 * Cron Endpoints Tests
 *
 * Tests the Vercel Cron endpoints for scheduled tasks.
 * Covers:
 * - Authentication (CRON_SECRET)
 * - Permanent deletion job execution
 * - Error handling
 * - Response format
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock processPermanentDeletions BEFORE importing routes
jest.mock('../../jobs/permanentDeletionJob.js', () => ({
  processPermanentDeletions: jest.fn(),
}));

// Import after mocking
import cronRoutes from '../cron.js';
import { processPermanentDeletions } from '../../jobs/permanentDeletionJob.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/cron', cronRoutes);

describe('POST /api/cron/permanent-deletions', () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  describe('Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Unauthorized'
      });
      expect(processPermanentDeletions).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid Bearer token', async () => {
      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer wrong-secret')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Unauthorized'
      });
      expect(processPermanentDeletions).not.toHaveBeenCalled();
    });

    it('should reject requests with malformed authorization header', async () => {
      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'test-secret-key') // Missing "Bearer "
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Unauthorized'
      });
      expect(processPermanentDeletions).not.toHaveBeenCalled();
    });

    it('should return 500 if CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Server configuration error'
      });
      expect(processPermanentDeletions).not.toHaveBeenCalled();
    });

    it('should accept requests with valid Bearer token', async () => {
      processPermanentDeletions.mockResolvedValue({
        found: 0,
        deleted: 0,
        failed: 0,
        errors: []
      });

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      expect(processPermanentDeletions).toHaveBeenCalledTimes(1);
    });
  });

  describe('Job Execution', () => {
    it('should execute permanent deletion job successfully with no users', async () => {
      const mockResults = {
        found: 0,
        deleted: 0,
        failed: 0,
        errors: []
      };

      processPermanentDeletions.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        results: mockResults
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('duration');
      expect(typeof response.body.duration).toBe('number');
      expect(processPermanentDeletions).toHaveBeenCalledTimes(1);
    });

    it('should execute permanent deletion job successfully with users deleted', async () => {
      const mockResults = {
        found: 3,
        deleted: 3,
        failed: 0,
        errors: []
      };

      processPermanentDeletions.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        results: mockResults
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle partial deletion failures', async () => {
      const mockResults = {
        found: 5,
        deleted: 3,
        failed: 2,
        errors: [
          { userId: 2, email: 'user2@example.com', error: 'Database error' },
          { userId: 4, email: 'user4@example.com', error: 'Constraint violation' }
        ]
      };

      processPermanentDeletions.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        results: mockResults
      });
      expect(response.body.results.errors).toHaveLength(2);
    });

    it('should return timestamp in ISO 8601 format', async () => {
      processPermanentDeletions.mockResolvedValue({
        found: 0,
        deleted: 0,
        failed: 0,
        errors: []
      });

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should measure and return execution duration', async () => {
      processPermanentDeletions.mockImplementation(async () => {
        // Simulate work taking 50ms
        await new Promise(resolve => setTimeout(resolve, 50));
        return { found: 1, deleted: 1, failed: 0, errors: [] };
      });

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      // Duration should be close to 50ms (allow 10ms tolerance for timing precision in CI)
      expect(response.body.duration).toBeGreaterThanOrEqual(40);
      expect(response.body.duration).toBeLessThan(200); // Reasonable upper bound
    });
  });

  describe('Error Handling', () => {
    it('should handle job execution errors gracefully', async () => {
      const errorMessage = 'Database connection lost';
      processPermanentDeletions.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: errorMessage
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('duration');
    });

    it('should handle unexpected errors during job execution', async () => {
      processPermanentDeletions.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unexpected error');
    });

    it('should return timestamp even on error', async () => {
      processPermanentDeletions.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return execution duration even on error', async () => {
      processPermanentDeletions.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        throw new Error('Test error');
      });

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(500);
      // Duration should be at least 10ms (allowing for timer precision variance)
      expect(response.body.duration).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle large batch deletions', async () => {
      const mockResults = {
        found: 100,
        deleted: 100,
        failed: 0,
        errors: []
      };

      processPermanentDeletions.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.results.found).toBe(100);
      expect(response.body.results.deleted).toBe(100);
    });

    it('should handle mixed success and failure results', async () => {
      const mockResults = {
        found: 10,
        deleted: 7,
        failed: 3,
        errors: [
          { userId: 1, email: 'user1@example.com', error: 'Error 1' },
          { userId: 5, email: 'user5@example.com', error: 'Error 2' },
          { userId: 9, email: 'user9@example.com', error: 'Error 3' }
        ]
      };

      processPermanentDeletions.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.deleted).toBe(7);
      expect(response.body.results.failed).toBe(3);
      expect(response.body.results.errors).toHaveLength(3);
    });

    it('should provide complete response format for successful job', async () => {
      processPermanentDeletions.mockResolvedValue({
        found: 2,
        deleted: 2,
        failed: 0,
        errors: []
      });

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('duration');
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveProperty('found');
      expect(response.body.results).toHaveProperty('deleted');
      expect(response.body.results).toHaveProperty('failed');
      expect(response.body.results).toHaveProperty('errors');
    });

    it('should provide complete response format for failed job', async () => {
      processPermanentDeletions.mockRejectedValue(new Error('Complete failure'));

      const response = await request(app)
        .post('/api/cron/permanent-deletions')
        .set('Authorization', 'Bearer test-secret-key')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Complete failure');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('duration');
    });
  });
});
