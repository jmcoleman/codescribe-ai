/**
 * Password Reset Authentication Tests
 *
 * Tests for password reset flow including:
 * - Forgot password endpoint
 * - Reset password endpoint
 * - Token generation and validation
 * - Email enumeration protection
 * - OAuth user protection
 */

import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import User from '../../models/User.js';
import authRoutes from '../auth.js';
import { sendPasswordResetEmail } from '../../services/emailService.js';

// Mock dependencies
jest.mock('../../models/User.js');
jest.mock('../../services/emailService.js');

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('Password Reset Flow', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  // ============================================================================
  // POST /api/auth/forgot-password
  // ============================================================================
  describe('POST /api/auth/forgot-password', () => {
    const validEmail = 'user@example.com';

    describe('Request Validation', () => {
      it('should reject request without email', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeTruthy();
      });

      it('should reject invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'not-an-email' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeTruthy();
      });

      it('should accept valid email format', async () => {
        User.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Email Enumeration Protection', () => {
      it('should return same success message for non-existent user', async () => {
        User.findByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('If an account exists');
        expect(sendPasswordResetEmail).not.toHaveBeenCalled();
      });

      it('should return same success message for existing user', async () => {
        User.findByEmail.mockResolvedValue({
          id: 1,
          email: validEmail,
          password_hash: 'hashed_password'
        });
        User.setResetToken.mockResolvedValue({});
        sendPasswordResetEmail.mockResolvedValue({});

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('If an account exists');
      });

      it('should not reveal user existence through timing', async () => {
        // Test that response times are similar for existing/non-existing users
        User.findByEmail.mockResolvedValue(null);

        const start1 = Date.now();
        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'fake@example.com' });
        const time1 = Date.now() - start1;

        User.findByEmail.mockResolvedValue({
          id: 1,
          email: validEmail,
          password_hash: 'hash'
        });
        User.setResetToken.mockResolvedValue({});
        sendPasswordResetEmail.mockResolvedValue({});

        const start2 = Date.now();
        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });
        const time2 = Date.now() - start2;

        // Times should be within 100ms of each other
        // (Timing attack mitigation)
        expect(Math.abs(time1 - time2)).toBeLessThan(100);
      });
    });

    describe('OAuth User Protection', () => {
      it('should not send email for OAuth-only users', async () => {
        User.findByEmail.mockResolvedValue({
          id: 1,
          email: validEmail,
          password_hash: null, // OAuth user has no password
          github_id: 'github123'
        });

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(User.setResetToken).not.toHaveBeenCalled();
      });

      it('should send email for email/password users', async () => {
        User.findByEmail.mockResolvedValue({
          id: 1,
          email: validEmail,
          password_hash: 'hashed_password'
        });
        User.setResetToken.mockResolvedValue({});
        sendPasswordResetEmail.mockResolvedValue({});

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });

        expect(response.status).toBe(200);
        expect(sendPasswordResetEmail).toHaveBeenCalledWith({
          to: validEmail,
          resetToken: expect.any(String)
        });
      });
    });

    describe('Token Generation', () => {
      it('should generate secure random token', async () => {
        User.findByEmail.mockResolvedValue({
          id: 1,
          email: validEmail,
          password_hash: 'hash'
        });
        User.setResetToken.mockResolvedValue({});
        sendPasswordResetEmail.mockResolvedValue({});

        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });

        expect(User.setResetToken).toHaveBeenCalledWith(
          1,
          expect.any(String),
          expect.any(Date)
        );

        // Verify token is 64 characters (32 bytes hex)
        const token = User.setResetToken.mock.calls[0][1];
        expect(token).toHaveLength(64);
        expect(token).toMatch(/^[a-f0-9]{64}$/);
      });

      it('should set token expiration to 1 hour', async () => {
        User.findByEmail.mockResolvedValue({
          id: 1,
          email: validEmail,
          password_hash: 'hash'
        });
        User.setResetToken.mockResolvedValue({});
        sendPasswordResetEmail.mockResolvedValue({});

        const beforeRequest = Date.now();
        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });

        const expiresAt = User.setResetToken.mock.calls[0][2];
        const expectedExpiry = beforeRequest + 3600000; // 1 hour

        // Should be within 1 second of expected
        expect(Math.abs(expiresAt.getTime() - expectedExpiry)).toBeLessThan(1000);
      });

      it('should generate unique tokens for multiple requests', async () => {
        User.findByEmail.mockResolvedValue({
          id: 1,
          email: validEmail,
          password_hash: 'hash'
        });
        User.setResetToken.mockResolvedValue({});
        sendPasswordResetEmail.mockResolvedValue({});

        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });
        const token1 = User.setResetToken.mock.calls[0][1];

        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });
        const token2 = User.setResetToken.mock.calls[1][1];

        expect(token1).not.toBe(token2);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        User.findByEmail.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });

        // Should still return success to prevent information disclosure
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should handle email service errors gracefully', async () => {
        User.findByEmail.mockResolvedValue({
          id: 1,
          email: validEmail,
          password_hash: 'hash'
        });
        User.setResetToken.mockResolvedValue({});
        sendPasswordResetEmail.mockRejectedValue(new Error('Email service error'));

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: validEmail });

        // Should still return success
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // POST /api/auth/reset-password
  // ============================================================================
  describe('POST /api/auth/reset-password', () => {
    const validToken = crypto.randomBytes(32).toString('hex');
    const newPassword = 'newSecurePassword123';

    describe('Request Validation', () => {
      it('should reject request without token', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ password: newPassword });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeTruthy();
      });

      it('should reject request without password', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeTruthy();
      });

      it('should reject password shorter than 8 characters', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: 'short' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeTruthy();
      });

      it('should reject token shorter than 32 characters', async () => {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: 'tooshort', password: newPassword });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Token Validation', () => {
      it('should reject invalid token', async () => {
        User.findByResetToken.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid or expired');
      });

      it('should reject expired token', async () => {
        // Token exists but is expired (handled by DB query)
        User.findByResetToken.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid or expired');
      });

      it('should accept valid non-expired token', async () => {
        User.findByResetToken.mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          password_hash: 'old_hash'
        });
        User.updatePassword.mockResolvedValue({});
        User.clearResetToken.mockResolvedValue({});

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Password Reset', () => {
      it('should update user password', async () => {
        User.findByResetToken.mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          password_hash: 'old_hash'
        });
        User.updatePassword.mockResolvedValue({});
        User.clearResetToken.mockResolvedValue({});

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(response.status).toBe(200);
        expect(User.updatePassword).toHaveBeenCalledWith(1, newPassword);
      });

      it('should clear reset token after successful reset', async () => {
        User.findByResetToken.mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          password_hash: 'old_hash'
        });
        User.updatePassword.mockResolvedValue({});
        User.clearResetToken.mockResolvedValue({});

        await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(User.clearResetToken).toHaveBeenCalledWith(1);
      });

      it('should return success message', async () => {
        User.findByResetToken.mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          password_hash: 'old_hash'
        });
        User.updatePassword.mockResolvedValue({});
        User.clearResetToken.mockResolvedValue({});

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Password reset successfully');
      });
    });

    describe('OAuth User Protection', () => {
      it('should reject password reset for OAuth-only users', async () => {
        User.findByResetToken.mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          password_hash: null, // OAuth user
          github_id: 'github123'
        });

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('OAuth');
        expect(User.updatePassword).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors during token lookup', async () => {
        User.findByResetToken.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });

      it('should handle errors during password update', async () => {
        User.findByResetToken.mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          password_hash: 'old_hash'
        });
        User.updatePassword.mockRejectedValue(new Error('Update failed'));

        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: validToken, password: newPassword });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================
  describe('End-to-End Flow', () => {
    it('should complete full password reset flow', async () => {
      const userEmail = 'user@example.com';
      const userId = 1;
      let resetToken;

      // Step 1: Request password reset
      User.findByEmail.mockResolvedValue({
        id: userId,
        email: userEmail,
        password_hash: 'old_hash'
      });
      User.setResetToken.mockImplementation((id, token, expires) => {
        resetToken = token;
        return Promise.resolve({});
      });
      sendPasswordResetEmail.mockResolvedValue({});

      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail });

      expect(forgotResponse.status).toBe(200);
      expect(resetToken).toBeTruthy();

      // Step 2: Reset password with token
      User.findByResetToken.mockResolvedValue({
        id: userId,
        email: userEmail,
        password_hash: 'old_hash'
      });
      User.updatePassword.mockResolvedValue({});
      User.clearResetToken.mockResolvedValue({});

      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, password: 'newPassword123' });

      expect(resetResponse.status).toBe(200);
      expect(User.updatePassword).toHaveBeenCalledWith(userId, 'newPassword123');
      expect(User.clearResetToken).toHaveBeenCalledWith(userId);
    });

    it('should prevent token reuse', async () => {
      const token = crypto.randomBytes(32).toString('hex');

      // First use: Success
      User.findByResetToken.mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
        password_hash: 'hash'
      });
      User.updatePassword.mockResolvedValue({});
      User.clearResetToken.mockResolvedValue({});

      const firstResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newPassword123' });

      expect(firstResponse.status).toBe(200);

      // Second use: Should fail (token cleared)
      User.findByResetToken.mockResolvedValueOnce(null);

      const secondResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'anotherPassword456' });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.error).toContain('Invalid or expired');
    });
  });
});
