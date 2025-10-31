/**
 * Integration tests for email verification routes
 * Tests /verify-email and /resend-verification endpoints
 *
 * TODO: Fix mock expectations after User model changes (Migration 008)
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock dependencies BEFORE importing routes
jest.mock('../../models/User.js');
jest.mock('../../services/emailService.js');
jest.mock('../../config/stripe.js');
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

// Now import routes and models
import authRouter from '../auth.js';
import User from '../../models/User.js';
import { sendVerificationEmail } from '../../services/emailService.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// Helper to create valid JWT tokens for testing
function createTestToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );
}

const describeOrSkip = skipIfNoDb();

describeOrSkip('Email Verification Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        email_verified: false,
        verification_token_expires: new Date(Date.now() + 3600000)
      };

      const mockVerifiedUser = {
        ...mockUser,
        email_verified: true
      };

      User.findByVerificationToken.mockResolvedValue(mockUser);
      User.markEmailAsVerified.mockResolvedValue(mockVerifiedUser);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token-123' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Email verified successfully',
        user: expect.objectContaining({
          id: mockVerifiedUser.id,
          email: mockVerifiedUser.email,
          first_name: mockVerifiedUser.first_name,
          last_name: mockVerifiedUser.last_name,
          email_verified: mockVerifiedUser.email_verified
        })
      });

      expect(User.findByVerificationToken).toHaveBeenCalledWith('valid-token-123');
      expect(User.markEmailAsVerified).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 400 for invalid token', async () => {
      User.findByVerificationToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid or expired verification token'
      });

      expect(User.markEmailAsVerified).not.toHaveBeenCalled();
    });

    it('should return 400 for expired token', async () => {
      // findByVerificationToken returns null for expired tokens (filtered by SQL)
      User.findByVerificationToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'expired-token' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid or expired verification token'
      });
    });

    it('should return 400 when token is missing', async () => {
      User.findByVerificationToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid or expired verification token'
      });
    });

    it('should return 400 when token is empty string', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should handle database errors gracefully', async () => {
      User.findByVerificationToken.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'some-token' })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to verify email'
      });
    });

    it('should handle verification update errors', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        email_verified: false
      };

      User.findByVerificationToken.mockResolvedValue(mockUser);
      User.markEmailAsVerified.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should sanitize user data in response', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        email_verified: false
      };

      const mockVerifiedUser = {
        ...mockUser,
        email_verified: true
        // Note: password_hash, verification_token, etc should be sanitized by route
      };

      User.findByVerificationToken.mockResolvedValue(mockUser);
      User.markEmailAsVerified.mockResolvedValue(mockVerifiedUser);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' })
        .expect(200);

      // Verify sensitive fields are not in response
      expect(response.body.user.password_hash).toBeUndefined();
      expect(response.body.user.verification_token).toBeUndefined();
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email for unverified user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        email_verified: false
      };

      const mockToken = 'new-verification-token-123';

      User.findById.mockResolvedValue(mockUser);
      User.createVerificationToken.mockResolvedValue(mockToken);
      sendVerificationEmail.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Verification email sent'
      });

      expect(User.findById).toHaveBeenCalledWith(1);
      expect(User.createVerificationToken).toHaveBeenCalledWith(1);
      expect(sendVerificationEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        verificationToken: mockToken
      });
    });

    it('should return 400 if email already verified', async () => {
      const mockUser = {
        id: 1,
        email: 'verified@example.com',
        first_name: 'Test',
        last_name: 'User',
        email_verified: true
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Email already verified'
      });

      expect(User.createVerificationToken).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authentication required'
      });

      expect(User.findById).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found'
      });

      expect(User.createVerificationToken).not.toHaveBeenCalled();
    });

    it('should handle token creation errors', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        email_verified: false
      };

      User.findById.mockResolvedValue(mockUser);
      User.createVerificationToken.mockRejectedValue(new Error('Token creation failed'));

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors but still succeed', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        email_verified: false
      };

      const mockToken = 'new-token';

      User.findById.mockResolvedValue(mockUser);
      User.createVerificationToken.mockResolvedValue(mockToken);
      sendVerificationEmail.mockRejectedValue(new Error('Email service failed'));

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(User.createVerificationToken).toHaveBeenCalled();
    });

    it('should use correct email address from user object', async () => {
      const mockUser = {
        id: 5,
        email: 'specific-user@example.com',
        email_verified: false
      };

      const mockToken = 'token-123';

      User.findById.mockResolvedValue(mockUser);
      User.createVerificationToken.mockResolvedValue(mockToken);
      sendVerificationEmail.mockResolvedValue();

      await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(200);

      expect(sendVerificationEmail).toHaveBeenCalledWith({
        to: 'specific-user@example.com',
        verificationToken: mockToken
      });
    });
  });

  describe('Verification Flow Integration', () => {
    it('should complete full flow: signup -> resend -> verify', async () => {
      const mockUser = {
        id: 1,
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        email_verified: false
      };

      // Step 1: Resend verification (simulating lost email)
      User.findById.mockResolvedValue(mockUser);
      const newToken = 'resent-token-456';
      User.createVerificationToken.mockResolvedValue(newToken);
      sendVerificationEmail.mockResolvedValue();

      const resendResponse = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(200);

      expect(resendResponse.body.success).toBe(true);

      // Step 2: Verify email with new token
      User.findByVerificationToken.mockResolvedValue(mockUser);
      User.markEmailAsVerified.mockResolvedValue({
        ...mockUser,
        email_verified: true
      });

      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: newToken })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.user.email_verified).toBe(true);
    });

    it('should prevent resending after verification', async () => {
      const mockUser = {
        id: 1,
        email: 'verified@example.com',
        email_verified: true
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(400);

      expect(response.body.error).toBe('Email already verified');
    });

    it('should handle concurrent verification attempts', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        email_verified: false
      };

      const mockVerifiedUser = {
        ...mockUser,
        email_verified: true
      };

      User.findByVerificationToken.mockResolvedValue(mockUser);
      User.markEmailAsVerified.mockResolvedValue(mockVerifiedUser);

      // Make two concurrent verification requests
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/auth/verify-email')
          .send({ token: 'same-token' }),
        request(app)
          .post('/api/auth/verify-email')
          .send({ token: 'same-token' })
      ]);

      // Both should succeed (idempotent operation)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should not leak user existence for invalid tokens', async () => {
      User.findByVerificationToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'non-existent-token' })
        .expect(400);

      // Generic error message doesn't reveal if user exists
      expect(response.body.error).toBe('Invalid or expired verification token');
    });

    it('should require authentication for resend endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should validate token format (not empty)', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed tokens safely', async () => {
      User.findByVerificationToken.mockResolvedValue(null);

      const malformedTokens = [
        'a'.repeat(1000), // Very long token
        '../../../etc/passwd', // Path traversal attempt
        '<script>alert("xss")</script>', // XSS attempt
        'token; DROP TABLE users;--', // SQL injection attempt
      ];

      for (const maliciousToken of malformedTokens) {
        const response = await request(app)
          .post('/api/auth/verify-email')
          .send({ token: maliciousToken })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(User.findByVerificationToken).toHaveBeenCalledWith(maliciousToken);
      }
    });

    it('should not expose sensitive user data in error messages', async () => {
      User.findByVerificationToken.mockRejectedValue(
        new Error('User email is sensitive@company.com')
      );

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'some-token' })
        .expect(500);

      // Should return generic error, not expose actual error message
      expect(response.body.error).toBe('Failed to verify email');
      expect(response.body.error).not.toContain('sensitive@company.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with null email field', async () => {
      const mockUser = {
        id: 1,
        email: null,
        email_verified: false
      };

      User.findById.mockResolvedValue(mockUser);
      User.createVerificationToken.mockResolvedValue('mock-token-123');

      // Mock sendVerificationEmail to reject when email is null
      sendVerificationEmail.mockRejectedValue(
        new Error('Cannot send email to null address')
      );

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${createTestToken(1)}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to send verification email');
    });

    it('should handle user with missing name fields gracefully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: null,
        last_name: null,
        email_verified: false
      };

      User.findByVerificationToken.mockResolvedValue(mockUser);
      User.markEmailAsVerified.mockResolvedValue({
        ...mockUser,
        email_verified: true
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.first_name).toBeNull();
      expect(response.body.user.last_name).toBeNull();
    });

    it('should handle extremely long tokens', async () => {
      const longToken = 'a'.repeat(10000);
      User.findByVerificationToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: longToken })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle special characters in tokens', async () => {
      const specialToken = 'token!@#$%^&*()_+{}|:"<>?[]\\;,./`~';
      User.findByVerificationToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: specialToken })
        .expect(400);

      expect(response.body.error).toBe('Invalid or expired verification token');
    });
  });
});
