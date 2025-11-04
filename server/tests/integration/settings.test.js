/**
 * Integration Tests: Settings API Endpoints
 * Tests password change, account deletion, and preferences update
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { sql } from '@vercel/postgres';

// Mock Stripe config BEFORE importing routes
// Note: We define mocks inside the factory to avoid hoisting issues
jest.mock('../../src/config/stripe.js', () => {
  const { jest: jestGlobal } = require('@jest/globals');

  const list = jestGlobal.fn();
  const cancel = jestGlobal.fn();

  // Store references globally so tests can access them
  global.mockStripeList = list;
  global.mockStripeCancel = cancel;

  return {
    __esModule: true,
    default: {
      subscriptions: {
        list,
        cancel
      }
    },
    STRIPE_PRICES: {},
    STRIPE_WEBHOOK_SECRET: 'test_webhook_secret',
    CHECKOUT_URLS: { success: 'http://localhost/success', cancel: 'http://localhost/cancel' },
    getTierFromPriceId: jestGlobal.fn(),
    getBillingPeriod: jestGlobal.fn(),
    isValidPriceForTier: jestGlobal.fn(),
    getTierValue: jestGlobal.fn()
  };
});

// Import routes and models AFTER mocks
import authRoutes from '../../src/routes/auth.js';
import User from '../../src/models/User.js';
import { generateToken } from '../../src/middleware/auth.js';

describe('Settings API Integration Tests', () => {
  let app;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Set up test environment
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.SESSION_SECRET = 'test-session-secret-key';
    process.env.CLIENT_URL = 'http://localhost:5173';

    // Create Express app with auth routes
    app = express();
    app.use(express.json());

    // Mount auth routes (auth middleware is included in the routes)
    app.use('/api/auth', authRoutes);

    // Create test user with email auth
    testUser = await User.create({
      email: 'settings-test@example.com',
      password: 'OldPassword123!',
      tier: 'starter',
      first_name: 'Settings',
      last_name: 'Test'
    });

    // Generate real JWT token
    authToken = generateToken(testUser);
  });

  beforeEach(() => {
    // Reset Stripe mocks before each test
    global.mockStripeList.mockReset();
    global.mockStripeCancel.mockReset();
  });

  afterAll(async () => {
    // Clean up test user if still exists
    try {
      await sql`DELETE FROM users WHERE email = 'settings-test@example.com'`;
    } catch (err) {
      // User already deleted - that's ok
    }
  });

  describe('PATCH /api/auth/password', () => {
    it('should successfully change password with valid current password', async () => {
      const response = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password updated successfully');

      // Verify new password works (use findByEmail to get password_hash)
      const updatedUser = await User.findByEmail(testUser.email);
      const isValid = await User.validatePassword('NewPassword456!', updatedUser.password_hash);
      expect(isValid).toBe(true);

      // Reset password for other tests
      await User.updatePassword(testUser.id, 'OldPassword123!');
    });

    it('should reject password change with incorrect current password', async () => {
      const response = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('should reject password change for OAuth users', async () => {
      // Create GitHub OAuth user
      const oauthUser = await User.findOrCreateByGithub({
        githubId: 'settings-test-github-123',
        email: 'oauth-settings@example.com'
      });

      const oauthToken = generateToken(oauthUser);

      const response = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${oauthToken}`)
        .send({
          currentPassword: 'anything',
          newPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('GitHub account');

      // Clean up
      await sql`DELETE FROM users WHERE id = ${oauthUser.id}`;
    });

    it('should reject password change without authentication', async () => {
      const response = await request(app)
        .patch('/api/auth/password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(401);
    });

    it('should validate new password length', async () => {
      const response = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('8 characters');
    });

    it('should require both passwords', async () => {
      const response = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'OldPassword123!'
          // Missing newPassword
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('PATCH /api/auth/preferences', () => {
    it('should successfully update analytics preference to false', async () => {
      const response = await request(app)
        .patch('/api/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          analytics_enabled: false
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Preferences updated successfully');
      expect(response.body.preferences.analytics_enabled).toBe(false);

      // Verify in database
      const updatedUser = await User.findById(testUser.id);
      expect(updatedUser.analytics_enabled).toBe(false);
    });

    it('should successfully update analytics preference to true', async () => {
      const response = await request(app)
        .patch('/api/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          analytics_enabled: true
        });

      expect(response.status).toBe(200);
      expect(response.body.preferences.analytics_enabled).toBe(true);

      // Verify in database
      const updatedUser = await User.findById(testUser.id);
      expect(updatedUser.analytics_enabled).toBe(true);
    });

    it('should reject preference update without authentication', async () => {
      const response = await request(app)
        .patch('/api/auth/preferences')
        .send({
          analytics_enabled: false
        });

      expect(response.status).toBe(401);
    });

    it('should validate analytics_enabled is boolean', async () => {
      const response = await request(app)
        .patch('/api/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          analytics_enabled: 'not-a-boolean'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('boolean');
    });

    it('should require analytics_enabled field', async () => {
      const response = await request(app)
        .patch('/api/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('boolean');
    });
  });

  describe('DELETE /api/auth/account', () => {
    it('should reject deletion without confirmation text', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmation: 'wrong text'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid confirmation');
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .send({
          confirmation: 'DELETE MY ACCOUNT'
        });

      expect(response.status).toBe(401);
    });

    it('should successfully delete account with FREE tier (no Stripe)', async () => {
      // Create temporary test user
      const tempUser = await User.create({
        email: `temp-delete-${Date.now()}@example.com`,
        password: 'Password123!',
        tier: 'free'
      });

      const tempToken = generateToken(tempUser);

      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({
          confirmation: 'DELETE MY ACCOUNT'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(tempUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should cancel Stripe subscription before deleting paid account', async () => {
      // Create temporary paid user
      const paidUser = await User.create({
        email: `paid-delete-${Date.now()}@example.com`,
        password: 'Password123!',
        tier: 'pro'
      });

      // Add Stripe customer ID
      const customerId = `cus_test_${Date.now()}`;
      await User.updateStripeCustomerId(paidUser.id, customerId, 'app');

      // Mock Stripe subscription list
      global.mockStripeList.mockResolvedValue({
        data: [
          {
            id: 'sub_test123',
            status: 'active'
          }
        ]
      });

      // Mock Stripe subscription cancel
      global.mockStripeCancel.mockResolvedValue({
        id: 'sub_test123',
        status: 'canceled'
      });

      const paidToken = generateToken(paidUser);

      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${paidToken}`)
        .send({
          confirmation: 'DELETE MY ACCOUNT'
        });

      expect(response.status).toBe(200);
      expect(global.mockStripeList).toHaveBeenCalledWith({
        customer: customerId,
        status: 'active',
        limit: 1
      });
      expect(global.mockStripeCancel).toHaveBeenCalledWith('sub_test123');

      // Verify user is deleted
      const deletedUser = await User.findById(paidUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should handle Stripe cancellation errors gracefully', async () => {
      // Create temporary paid user
      const paidUser = await User.create({
        email: `stripe-error-delete-${Date.now()}@example.com`,
        password: 'Password123!',
        tier: 'pro'
      });

      await User.updateStripeCustomerId(paidUser.id, `cus_error_${Date.now()}`, 'app');

      // Mock Stripe to throw error
      global.mockStripeList.mockResolvedValue({
        data: [{ id: 'sub_error123', status: 'active' }]
      });
      global.mockStripeCancel.mockRejectedValue(new Error('Stripe API error'));

      const paidToken = generateToken(paidUser);

      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${paidToken}`)
        .send({
          confirmation: 'DELETE MY ACCOUNT'
        });

      // Should still succeed (graceful error handling)
      // Account deletion continues even if Stripe cancellation fails
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account deleted successfully');

      // Verify user is deleted (even though Stripe failed)
      const deletedUser = await User.findById(paidUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should skip Stripe cancellation if no active subscriptions', async () => {
      // Create temporary paid user
      const paidUser = await User.create({
        email: `no-sub-delete-${Date.now()}@example.com`,
        password: 'Password123!',
        tier: 'starter'
      });

      await User.updateStripeCustomerId(paidUser.id, `cus_nosub_${Date.now()}`, 'app');

      // Mock Stripe - no active subscriptions
      global.mockStripeList.mockResolvedValue({
        data: []
      });

      const paidToken = generateToken(paidUser);

      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${paidToken}`)
        .send({
          confirmation: 'DELETE MY ACCOUNT'
        });

      expect(response.status).toBe(200);
      expect(global.mockStripeList).toHaveBeenCalled();
      expect(global.mockStripeCancel).not.toHaveBeenCalled();

      // Verify user is deleted
      const deletedUser = await User.findById(paidUser.id);
      expect(deletedUser).toBeNull();
    });
  });
});
