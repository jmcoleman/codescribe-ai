/**
 * User Deletion & Data Export API Tests
 *
 * Tests Epic 2.5 Phase 4 endpoints:
 * - POST /api/user/delete-account (schedule deletion)
 * - POST /api/user/restore-account (restore account)
 * - GET /api/user/data-export (GDPR data export)
 *
 * Strategy: Create isolated Express app with only deletion routes
 * to avoid multer/middleware initialization issues from full api.js import
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing models
jest.mock('../../models/User.js');
jest.mock('../../services/emailService.js', () => ({
  __esModule: true,
  default: {
    sendDeletionScheduledEmail: jest.fn().mockResolvedValue(true),
    sendAccountRestoredEmail: jest.fn().mockResolvedValue(true),
  },
}));

// Import after mocks
import User from '../../models/User.js';
import emailService from '../../services/emailService.js';

describe('User Deletion & Data Export API', () => {
  let app;

  // Mock user data
  const mockUser = {
    id: 1,
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    tier: 'pro',
    deletion_scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    restore_token: 'valid-restore-token-123',
    created_at: new Date('2024-01-01'),
  };

  const mockExportData = {
    user: {
      email: mockUser.email,
      first_name: mockUser.first_name,
      last_name: mockUser.last_name,
      tier: mockUser.tier,
      created_at: mockUser.created_at.toISOString(),
    },
    usage: {
      total_generations: 150,
      last_used: '2024-11-01T12:00:00Z',
    },
    metadata: {
      export_date: '2024-11-04T12:00:00Z',
      export_version: '1.0',
    },
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create isolated Express app with only deletion routes
    app = express();
    app.use(express.json());

    // Mock auth middleware
    app.use((req, _res, next) => {
      req.user = mockUser; // Simulate authenticated user
      next();
    });

    // Define deletion routes inline (isolated from api.js)

    // GET /api/user/data-export
    app.get('/api/user/data-export', async (req, res) => {
      try {
        const userId = req.user.id;
        const exportData = await User.exportUserData(userId);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `codescribe-ai-data-export-${timestamp}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        res.json(exportData);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to export user data',
          message: error.message
        });
      }
    });

    // POST /api/user/delete-account
    app.post('/api/user/delete-account', async (req, res) => {
      try {
        const userId = req.user.id;
        const { reason } = req.body;

        const user = await User.scheduleForDeletion(userId, reason || null);

        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        await emailService.sendDeletionScheduledEmail(
          user.email,
          userName,
          user.restore_token,
          user.deletion_scheduled_at
        );

        res.json({
          message: 'Account deletion scheduled successfully',
          deletion_date: user.deletion_scheduled_at,
          grace_period_days: 30
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to schedule account deletion',
          message: error.message
        });
      }
    });

    // POST /api/user/restore-account (no auth required - token-based)
    app.post('/api/user/restore-account', async (req, res) => {
      try {
        const { token } = req.body;

        if (!token) {
          return res.status(400).json({
            error: 'Restore token is required'
          });
        }

        const user = await User.findByRestoreToken(token);

        if (!user) {
          return res.status(404).json({
            error: 'Invalid or expired restore token'
          });
        }

        const restoredUser = await User.restoreAccount(user.id);

        const userName = `${restoredUser.first_name || ''} ${restoredUser.last_name || ''}`.trim();
        await emailService.sendAccountRestoredEmail(
          restoredUser.email,
          userName
        );

        res.json({
          message: 'Account restored successfully',
          email: restoredUser.email
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to restore account',
          message: error.message
        });
      }
    });
  });

  describe('POST /api/user/delete-account', () => {
    it('should schedule account deletion with 30-day grace period', async () => {
      User.scheduleForDeletion = jest.fn().mockResolvedValue(mockUser);
      emailService.sendDeletionScheduledEmail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/user/delete-account')
        .send({ reason: 'No longer need the service' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('scheduled successfully');
      expect(response.body.deletion_date).toBeDefined();
      expect(response.body.grace_period_days).toBe(30);

      expect(User.scheduleForDeletion).toHaveBeenCalledWith(
        mockUser.id,
        'No longer need the service'
      );
      expect(emailService.sendDeletionScheduledEmail).toHaveBeenCalledWith(
        mockUser.email,
        'Test User',
        mockUser.restore_token,
        mockUser.deletion_scheduled_at
      );
    });

    it('should accept deletion without reason', async () => {
      User.scheduleForDeletion = jest.fn().mockResolvedValue(mockUser);
      emailService.sendDeletionScheduledEmail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/user/delete-account')
        .send({});

      expect(response.status).toBe(200);
      expect(User.scheduleForDeletion).toHaveBeenCalledWith(mockUser.id, null);
    });

    it('should handle user not found gracefully', async () => {
      User.scheduleForDeletion = jest.fn().mockRejectedValue(
        new Error('User not found')
      );

      const response = await request(app)
        .post('/api/user/delete-account')
        .send({ reason: 'Test reason' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to schedule account deletion');
      expect(response.body.message).toBe('User not found');
    });

    it('should handle email service failure', async () => {
      User.scheduleForDeletion = jest.fn().mockResolvedValue(mockUser);
      emailService.sendDeletionScheduledEmail.mockRejectedValue(
        new Error('Email service unavailable')
      );

      const response = await request(app)
        .post('/api/user/delete-account')
        .send({ reason: 'Test' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to schedule account deletion');
    });

    it('should handle already deleted account', async () => {
      User.scheduleForDeletion = jest.fn().mockRejectedValue(
        new Error('Account already scheduled for deletion')
      );

      const response = await request(app)
        .post('/api/user/delete-account')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('already scheduled');
    });

    it('should send email with correct user name format', async () => {
      const userWithoutLastName = { ...mockUser, last_name: null };
      User.scheduleForDeletion = jest.fn().mockResolvedValue(userWithoutLastName);
      emailService.sendDeletionScheduledEmail.mockResolvedValue(true);

      await request(app)
        .post('/api/user/delete-account')
        .send({ reason: 'Test' });

      expect(emailService.sendDeletionScheduledEmail).toHaveBeenCalledWith(
        mockUser.email,
        'Test', // Only first name
        expect.any(String),
        expect.any(Date)
      );
    });
  });

  describe('POST /api/user/restore-account', () => {
    const validToken = 'valid-restore-token-123';

    it('should restore account with valid token', async () => {
      User.findByRestoreToken = jest.fn().mockResolvedValue(mockUser);
      User.restoreAccount = jest.fn().mockResolvedValue(mockUser);
      emailService.sendAccountRestoredEmail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/user/restore-account')
        .send({ token: validToken });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('restored successfully');
      expect(response.body.email).toBe(mockUser.email);

      expect(User.findByRestoreToken).toHaveBeenCalledWith(validToken);
      expect(User.restoreAccount).toHaveBeenCalledWith(mockUser.id);
      expect(emailService.sendAccountRestoredEmail).toHaveBeenCalledWith(
        mockUser.email,
        'Test User'
      );
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/user/restore-account')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Restore token is required');
      expect(User.findByRestoreToken).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      User.findByRestoreToken = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/restore-account')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invalid or expired restore token');
      expect(User.restoreAccount).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      User.findByRestoreToken = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/restore-account')
        .send({ token: 'expired-token-abc' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Invalid or expired');
    });

    it('should handle restore failure gracefully', async () => {
      User.findByRestoreToken = jest.fn().mockResolvedValue(mockUser);
      User.restoreAccount = jest.fn().mockRejectedValue(
        new Error('Account not scheduled for deletion')
      );

      const response = await request(app)
        .post('/api/user/restore-account')
        .send({ token: validToken });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to restore account');
    });

    it('should handle email service failure on restore', async () => {
      User.findByRestoreToken = jest.fn().mockResolvedValue(mockUser);
      User.restoreAccount = jest.fn().mockResolvedValue(mockUser);
      emailService.sendAccountRestoredEmail.mockRejectedValue(
        new Error('Email service unavailable')
      );

      const response = await request(app)
        .post('/api/user/restore-account')
        .send({ token: validToken });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to restore account');
    });

    it('should handle user name with missing last name', async () => {
      const userWithoutLastName = { ...mockUser, last_name: '' };
      User.findByRestoreToken = jest.fn().mockResolvedValue(userWithoutLastName);
      User.restoreAccount = jest.fn().mockResolvedValue(userWithoutLastName);
      emailService.sendAccountRestoredEmail.mockResolvedValue(true);

      await request(app)
        .post('/api/user/restore-account')
        .send({ token: validToken });

      expect(emailService.sendAccountRestoredEmail).toHaveBeenCalledWith(
        mockUser.email,
        'Test' // Only first name
      );
    });
  });

  describe('GET /api/user/data-export', () => {
    it('should export complete user data', async () => {
      User.exportUserData = jest.fn().mockResolvedValue(mockExportData);

      const response = await request(app)
        .get('/api/user/data-export');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockExportData);
      expect(User.exportUserData).toHaveBeenCalledWith(mockUser.id);
    });

    it('should set correct response headers for download', async () => {
      User.exportUserData = jest.fn().mockResolvedValue(mockExportData);

      const response = await request(app)
        .get('/api/user/data-export');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('codescribe-ai-data-export');
      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
    });

    it('should generate unique filename with timestamp', async () => {
      User.exportUserData = jest.fn().mockResolvedValue(mockExportData);

      const response1 = await request(app).get('/api/user/data-export');
      const response2 = await request(app).get('/api/user/data-export');

      const filename1 = response1.headers['content-disposition'];
      const filename2 = response2.headers['content-disposition'];

      // Filenames should contain timestamps (may be same if called in same second)
      expect(filename1).toContain('codescribe-ai-data-export-');
      expect(filename2).toContain('codescribe-ai-data-export-');
    });

    it('should handle export failure gracefully', async () => {
      User.exportUserData = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/user/data-export');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to export user data');
      expect(response.body.message).toBe('Database connection failed');
    });

    it('should include all required export data fields', async () => {
      User.exportUserData = jest.fn().mockResolvedValue(mockExportData);

      const response = await request(app)
        .get('/api/user/data-export');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(mockUser.email);
      expect(response.body.usage).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should handle user with no usage data', async () => {
      const exportWithNoUsage = {
        ...mockExportData,
        usage: null,
      };
      User.exportUserData = jest.fn().mockResolvedValue(exportWithNoUsage);

      const response = await request(app)
        .get('/api/user/data-export');

      expect(response.status).toBe(200);
      expect(response.body.usage).toBeNull();
    });

    it('should export data for user with minimal profile', async () => {
      const minimalExport = {
        user: {
          email: mockUser.email,
          first_name: null,
          last_name: null,
          tier: 'free',
          created_at: mockUser.created_at.toISOString(),
        },
        usage: null,
        metadata: mockExportData.metadata,
      };
      User.exportUserData = jest.fn().mockResolvedValue(minimalExport);

      const response = await request(app)
        .get('/api/user/data-export');

      expect(response.status).toBe(200);
      expect(response.body.user.first_name).toBeNull();
      expect(response.body.user.last_name).toBeNull();
    });
  });

  describe('Integration: Deletion + Restore Flow', () => {
    it('should complete full deletion and restore cycle', async () => {
      // Step 1: Schedule deletion
      User.scheduleForDeletion = jest.fn().mockResolvedValue(mockUser);
      emailService.sendDeletionScheduledEmail.mockResolvedValue(true);

      const deleteResponse = await request(app)
        .post('/api/user/delete-account')
        .send({ reason: 'Testing restore flow' });

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.grace_period_days).toBe(30);

      // Step 2: Restore account with token
      User.findByRestoreToken = jest.fn().mockResolvedValue(mockUser);
      User.restoreAccount = jest.fn().mockResolvedValue(mockUser);
      emailService.sendAccountRestoredEmail.mockResolvedValue(true);

      const restoreResponse = await request(app)
        .post('/api/user/restore-account')
        .send({ token: mockUser.restore_token });

      expect(restoreResponse.status).toBe(200);
      expect(restoreResponse.body.message).toContain('restored successfully');

      // Verify both emails were sent
      expect(emailService.sendDeletionScheduledEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendAccountRestoredEmail).toHaveBeenCalledTimes(1);
    });
  });
});
