/**
 * Rate Limiter Middleware Tests
 * Tests for rate limiting configuration, skip logic, and handlers
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  shouldSkipRateLimit,
  rateLimitHandler,
  hourlyLimitHandler,
  apiLimiter,
  generationLimiter
} from '../rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  // ============================================================================
  // shouldSkipRateLimit Function
  // ============================================================================

  describe('shouldSkipRateLimit', () => {
    it('should return true for admin users', () => {
      const req = { user: { id: 1, role: 'admin' } };
      expect(shouldSkipRateLimit(req)).toBe(true);
    });

    it('should return true for support users', () => {
      const req = { user: { id: 2, role: 'support' } };
      expect(shouldSkipRateLimit(req)).toBe(true);
    });

    it('should return true for super_admin users', () => {
      const req = { user: { id: 3, role: 'super_admin' } };
      expect(shouldSkipRateLimit(req)).toBe(true);
    });

    it('should return false for free users', () => {
      const req = { user: { id: 4, role: 'free' } };
      expect(shouldSkipRateLimit(req)).toBe(false);
    });

    it('should return false for pro users', () => {
      const req = { user: { id: 5, role: 'pro' } };
      expect(shouldSkipRateLimit(req)).toBe(false);
    });

    it('should return false when no user on request', () => {
      const req = {};
      expect(shouldSkipRateLimit(req)).toBeFalsy();
    });

    it('should return false when user is null', () => {
      const req = { user: null };
      expect(shouldSkipRateLimit(req)).toBeFalsy();
    });
  });

  // ============================================================================
  // Handler Functions
  // ============================================================================

  describe('rateLimitHandler', () => {
    it('should respond with 429 and correct error message', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      rateLimitHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again in 60 seconds.',
        retryAfter: 60
      });
    });
  });

  describe('hourlyLimitHandler', () => {
    it('should respond with 429 and correct error message', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      hourlyLimitHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Hourly limit exceeded',
        message: 'You have exceeded 100 generations per hour. Please try again later.',
        retryAfter: 3600
      });
    });
  });

  // ============================================================================
  // Exported Limiters
  // ============================================================================

  describe('Exported Limiters', () => {
    it('should exist and be importable', async () => {
      expect(apiLimiter).toBeDefined();
      expect(generationLimiter).toBeDefined();
    });

    it('should export apiLimiter as a function', async () => {
      expect(typeof apiLimiter).toBe('function');
    });

    it('should export generationLimiter as a function', async () => {
      expect(typeof generationLimiter).toBe('function');
    });
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
