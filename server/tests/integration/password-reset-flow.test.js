/**
 * Integration tests for password reset flow
 * Tests the complete password reset journey
 *
 * Run with: npm test tests/integration/password-reset-flow.test.js
 */

import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import crypto from 'crypto';
import authRoutes, { resetPasswordResetRateLimit } from '../../src/routes/auth.js';
import '../../src/config/passport.js';

// Mock the User model
jest.mock('../../src/models/User.js');
import User from '../../src/models/User.js';

// Mock email service
jest.mock('../../src/services/emailService.js');
import { sendPasswordResetEmail } from '../../src/services/emailService.js';

// Mock the database connection
jest.mock('../../src/db/connection.js', () => ({
  sql: jest.fn(),
  testConnection: jest.fn().mockResolvedValue(true),
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  cleanupSessions: jest.fn().mockResolvedValue(0)
}));

describe('Password Reset Flow Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Set up test environment
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.SESSION_SECRET = 'test-session-secret-key';
    process.env.CLIENT_URL = 'http://localhost:5173';

    // Create Express app with auth routes
    app = express();
    app.use(express.json());

    // Add session middleware (required for Passport)
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
      })
    );

    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Mount auth routes
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset rate limiting for each test
    resetPasswordResetRateLimit();
  });

  describe('POST /api/auth/forgot-password - Request Password Reset', () => {
    it('should send reset email for existing user', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        password_hash: '$2b$10$hashedpassword',
        tier: 'free'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.setResetToken.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        tier: 'free'
      });
      sendPasswordResetEmail.mockResolvedValue({ id: 'email-123' });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'user@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account exists');

      // Verify email was sent
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          resetToken: expect.any(String)
        })
      );

      // Verify reset token was stored
      expect(User.setResetToken).toHaveBeenCalledWith(
        1,
        expect.any(String),
        expect.any(Date)
      );
    });

    it('should handle OAuth-only user (no password_hash)', async () => {
      const mockUser = {
        id: 2,
        email: 'github@test.com',
        password_hash: null, // OAuth-only user
        github_id: 'gh123',
        tier: 'free'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.setResetToken.mockResolvedValue({
        id: 2,
        email: 'github@test.com',
        tier: 'free'
      });
      sendPasswordResetEmail.mockResolvedValue({ id: 'email-456' });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'github@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify OAuth-only user handling was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Password set requested for OAuth-only user')
      );

      // Verify email was sent (OAuth users can add password)
      expect(sendPasswordResetEmail).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return success even for non-existent email (security)', async () => {
      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account exists');

      // Verify email was NOT sent
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(User.setResetToken).not.toHaveBeenCalled();
    });

    it('should rate limit password reset requests', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        password_hash: '$2b$10$hash',
        tier: 'free'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.setResetToken.mockResolvedValue({ id: 1, email: 'user@test.com', tier: 'free' });
      sendPasswordResetEmail.mockResolvedValue({ id: 'email-123' });

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'user@test.com' });

        expect(response.status).toBe(200);
      }

      // 4th request should be rate limited
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Too many password reset requests');
    });

    it('should return success even when email service fails (security)', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        password_hash: '$2b$10$hash',
        tier: 'free'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.setResetToken.mockResolvedValue({ id: 1, email: 'user@test.com', tier: 'free' });
      sendPasswordResetEmail.mockRejectedValue(new Error('Email service down'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' });

      // Still returns success for security
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // But error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send password reset email:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return success even on database errors (security)', async () => {
      User.findByEmail.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' });

      // Still returns success for security
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account exists');
    });
  });

  describe('POST /api/auth/reset-password - Complete Password Reset', () => {
    it('should reset password with valid token', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        password_hash: '$2b$10$oldhash',
        tier: 'free',
        reset_token_hash: resetToken,
        reset_token_expires: new Date(Date.now() + 3600000)
      };

      User.findByResetToken.mockResolvedValue(mockUser);
      User.updatePassword.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        tier: 'free'
      });
      User.clearResetToken.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        tier: 'free'
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successfully');
      expect(response.body.token).toBeDefined(); // JWT for auto-login
      expect(response.body.user).toBeDefined();

      // Verify password was updated
      expect(User.updatePassword).toHaveBeenCalledWith(1, 'NewPassword123');
      expect(User.clearResetToken).toHaveBeenCalledWith(1);

      // Verify success was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Password reset successful for user: user@test.com'
      );

      consoleSpy.mockRestore();
    });

    it('should handle OAuth-only user adding password', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const mockUser = {
        id: 2,
        email: 'github@test.com',
        password_hash: null, // OAuth-only user adding password
        github_id: 'gh123',
        tier: 'free',
        reset_token_hash: resetToken,
        reset_token_expires: new Date(Date.now() + 3600000)
      };

      User.findByResetToken.mockResolvedValue(mockUser);
      User.updatePassword.mockResolvedValue({
        id: 2,
        email: 'github@test.com',
        tier: 'free'
      });
      User.clearResetToken.mockResolvedValue({
        id: 2,
        email: 'github@test.com',
        tier: 'free'
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify OAuth user handling was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Setting password for OAuth-only user: github@test.com'
      );

      consoleSpy.mockRestore();
    });

    it('should reject invalid reset token', async () => {
      // Use a token that passes validation (32+ chars) but is invalid
      const invalidToken = crypto.randomBytes(32).toString('hex');
      User.findByResetToken.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: invalidToken,
          password: 'NewPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired reset token');

      // Verify password was NOT updated
      expect(User.updatePassword).not.toHaveBeenCalled();
      expect(User.clearResetToken).not.toHaveBeenCalled();
    });

    it('should reject expired reset token', async () => {
      // Use a token that passes validation but is expired
      const expiredToken = crypto.randomBytes(32).toString('hex');
      User.findByResetToken.mockResolvedValue(null); // Expired tokens return null

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredToken,
          password: 'NewPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should reject short token (validation)', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'short-token',
          password: 'NewPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.token).toContain('at least 32 characters');
    });

    it('should handle database errors gracefully', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');

      User.findByResetToken.mockRejectedValue(new Error('Database connection lost'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to reset password');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Reset password error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Complete Password Reset Flow', () => {
    it('should handle full password reset journey', async () => {
      const userEmail = 'fullflow@test.com';
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Step 1: User requests password reset
      const mockUser = {
        id: 1,
        email: userEmail,
        password_hash: '$2b$10$oldhash',
        tier: 'free'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.setResetToken.mockImplementation((id, token, expires) => {
        // Simulate storing the token
        return Promise.resolve({ id, email: userEmail, tier: 'free' });
      });
      sendPasswordResetEmail.mockResolvedValue({ id: 'email-123' });

      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userEmail });

      expect(forgotResponse.status).toBe(200);
      expect(forgotResponse.body.success).toBe(true);

      // Extract the token that was sent via email
      const emailCall = sendPasswordResetEmail.mock.calls[0][0];
      const sentToken = emailCall.resetToken;

      // Step 2: User clicks link in email and submits new password
      User.findByResetToken.mockResolvedValue({
        ...mockUser,
        reset_token_hash: sentToken,
        reset_token_expires: new Date(Date.now() + 3600000)
      });
      User.updatePassword.mockResolvedValue({
        id: 1,
        email: userEmail,
        tier: 'free'
      });
      User.clearResetToken.mockResolvedValue({
        id: 1,
        email: userEmail,
        tier: 'free'
      });

      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: sentToken,
          password: 'NewSecurePassword123'
        });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body.success).toBe(true);
      expect(resetResponse.body.token).toBeDefined(); // JWT for auto-login
      expect(resetResponse.body.user.email).toBe(userEmail);

      // Verify complete flow
      expect(User.setResetToken).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(User.updatePassword).toHaveBeenCalled();
      expect(User.clearResetToken).toHaveBeenCalled();
    });
  });
});
