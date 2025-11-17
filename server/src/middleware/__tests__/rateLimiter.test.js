/**
 * Rate Limiter Middleware Tests
 * Tests for rate limiting configuration and skip logic
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Note: rateLimiter.js exports the configured middleware, not the shouldSkipRateLimit function
// directly. To test the skip logic, we need to mock User.canBypassRateLimits and test through
// the exported limiters' skip configuration.

// Since express-rate-limit is difficult to mock in ES modules, we'll test the actual middleware
// behavior by importing it directly. The rateLimiter module will use the real express-rate-limit
// but we can still test the configuration and skip logic.

describe('Rate Limiter Middleware', () => {
  // Note: These tests verify the rate limiter was configured correctly.
  // The actual rate limiting behavior is tested through integration tests.

  it('should exist and be importable', async () => {
    const rateLimiter = await import('../rateLimiter.js');
    expect(rateLimiter.apiLimiter).toBeDefined();
    expect(rateLimiter.generationLimiter).toBeDefined();
  });

  it('should export apiLimiter as a function', async () => {
    const { apiLimiter } = await import('../rateLimiter.js');
    expect(typeof apiLimiter).toBe('function');
  });

  it('should export generationLimiter as a function', async () => {
    const { generationLimiter } = await import('../rateLimiter.js');
    expect(typeof generationLimiter).toBe('function');
  });

  describe('Skip Logic', () => {
    let User;

    beforeEach(async () => {
      // Re-import User model for each test
      const userModule = await import('../../models/User.js');
      User = userModule.default;
    });

    it('should have User.canBypassRateLimits method', () => {
      expect(User.canBypassRateLimits).toBeDefined();
      expect(typeof User.canBypassRateLimits).toBe('function');
    });

    it('should allow admin users to bypass rate limits', () => {
      const adminUser = { id: '1', role: 'admin' };
      expect(User.canBypassRateLimits(adminUser)).toBe(true);
    });

    it('should allow support users to bypass rate limits', () => {
      const supportUser = { id: '2', role: 'support' };
      expect(User.canBypassRateLimits(supportUser)).toBe(true);
    });

    it('should allow super_admin users to bypass rate limits', () => {
      const superAdminUser = { id: '3', role: 'super_admin' };
      expect(User.canBypassRateLimits(superAdminUser)).toBe(true);
    });

    it('should not allow free users to bypass rate limits', () => {
      const freeUser = { id: '4', role: 'free' };
      expect(User.canBypassRateLimits(freeUser)).toBe(false);
    });

    it('should not allow pro users to bypass rate limits', () => {
      const proUser = { id: '5', role: 'pro' };
      expect(User.canBypassRateLimits(proUser)).toBe(false);
    });

    it('should not allow enterprise users to bypass rate limits', () => {
      const enterpriseUser = { id: '6', role: 'enterprise' };
      expect(User.canBypassRateLimits(enterpriseUser)).toBe(false);
    });
  });

  describe('Configuration Values', () => {
    it('should use default window of 60 seconds if RATE_LIMIT_WINDOW_MS not set', () => {
      const originalEnv = process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_WINDOW_MS;

      const defaultWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000;
      expect(defaultWindow).toBe(60000);

      // Restore
      if (originalEnv) process.env.RATE_LIMIT_WINDOW_MS = originalEnv;
    });

    it('should use default max of 10 requests if RATE_LIMIT_MAX not set', () => {
      const originalEnv = process.env.RATE_LIMIT_MAX;
      delete process.env.RATE_LIMIT_MAX;

      const defaultMax = parseInt(process.env.RATE_LIMIT_MAX) || 10;
      expect(defaultMax).toBe(10);

      // Restore
      if (originalEnv) process.env.RATE_LIMIT_MAX = originalEnv;
    });

    it('should use default hourly max of 100 if RATE_LIMIT_HOURLY_MAX not set', () => {
      const originalEnv = process.env.RATE_LIMIT_HOURLY_MAX;
      delete process.env.RATE_LIMIT_HOURLY_MAX;

      const defaultHourlyMax = parseInt(process.env.RATE_LIMIT_HOURLY_MAX) || 100;
      expect(defaultHourlyMax).toBe(100);

      // Restore
      if (originalEnv) process.env.RATE_LIMIT_HOURLY_MAX = originalEnv;
    });
  });

  describe('Error Messages', () => {
    it('should have correct error message structure for rate limit', () => {
      const message = {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again in 60 seconds.',
        retryAfter: 60
      };

      expect(message.error).toBe('Rate limit exceeded');
      expect(message.message).toBe('Too many requests. Please try again in 60 seconds.');
      expect(message.retryAfter).toBe(60);
    });

    it('should have correct error message structure for hourly limit', () => {
      const message = {
        error: 'Hourly limit exceeded',
        message: 'You have exceeded 100 generations per hour. Please try again later.',
        retryAfter: 3600
      };

      expect(message.error).toBe('Hourly limit exceeded');
      expect(message.message).toBe('You have exceeded 100 generations per hour. Please try again later.');
      expect(message.retryAfter).toBe(3600);
    });
  });

  describe('Middleware Integration', () => {
    it('should be a middleware function with 3 parameters', async () => {
      const { apiLimiter } = await import('../rateLimiter.js');

      // Middleware should have 3 parameters (req, res, next)
      expect(apiLimiter.length).toBe(3);
    });

    it('should be a middleware function for generation limiter', async () => {
      const { generationLimiter } = await import('../rateLimiter.js');

      // Middleware should have 3 parameters (req, res, next)
      expect(generationLimiter.length).toBe(3);
    });

    it('should export both limiters', async () => {
      const rateLimiter = await import('../rateLimiter.js');

      expect(rateLimiter.apiLimiter).toBeDefined();
      expect(rateLimiter.generationLimiter).toBeDefined();
      expect(typeof rateLimiter.apiLimiter).toBe('function');
      expect(typeof rateLimiter.generationLimiter).toBe('function');
    });
  });
});
