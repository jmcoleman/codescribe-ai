/**
 * Rate Limit Bypass Middleware Tests
 * Tests for role-based rate limit bypass functionality
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { rateLimitBypass } from '../rateLimitBypass.js';

describe('rateLimitBypass Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup request, response, and next function
    req = {
      user: null,
    };
    res = {};
    next = jest.fn();

    // Reset console.log mock
    console.log = jest.fn();
  });

  describe('User with bypass privileges', () => {
    it('should call next() when user has admin role', () => {
      // Setup
      req.user = {
        id: 'test-user-id',
        role: 'admin',
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // No error passed
    });

    it('should call next() when user has super_admin role', () => {
      // Setup
      req.user = {
        id: 'super-admin-id',
        role: 'super_admin',
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next() when user has support role', () => {
      // Setup
      req.user = {
        id: 'support-user-id',
        role: 'support',
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should log bypass in development mode', () => {
      // Setup
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      req.user = {
        id: 'admin-123',
        role: 'admin',
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[RateLimitBypass] User admin-123 (admin) bypassing rate limit')
      );
      expect(next).toHaveBeenCalledTimes(1);

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT log bypass in production mode', () => {
      // Setup
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      req.user = {
        id: 'admin-123',
        role: 'admin',
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(console.log).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('User without bypass privileges', () => {
    it('should call next() for regular user role', () => {
      // Setup
      req.user = {
        id: 'regular-user-id',
        role: 'user',
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // No error passed
    });

    it('should not log anything for regular users', () => {
      // Setup
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      req.user = {
        id: 'user-123',
        role: 'user',
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(console.log).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Unauthenticated users', () => {
    it('should call next() when req.user is null', () => {
      // Setup
      req.user = null;

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // No error passed
    });

    it('should call next() when req.user is undefined', () => {
      // Setup
      req.user = undefined;

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle user with missing role property', () => {
      // Setup
      req.user = {
        id: 'user-no-role',
        // role property missing
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle user with null role', () => {
      // Setup
      req.user = {
        id: 'user-123',
        role: null,
      };

      // Execute
      rateLimitBypass(req, res, next);

      // Verify
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should always return from next() call', () => {
      // Setup
      req.user = {
        id: 'admin-123',
        role: 'admin',
      };

      // Execute
      const result = rateLimitBypass(req, res, next);

      // Verify - middleware should return undefined (from next())
      expect(result).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should work in middleware chain', () => {
      // Setup - simulate middleware chain
      const middleware1 = jest.fn((req, res, next) => next());
      const middleware2 = rateLimitBypass;
      const middleware3 = jest.fn((req, res, next) => next());

      req.user = {
        id: 'admin-123',
        role: 'admin',
      };

      // Execute middleware chain
      middleware1(req, res, () => {
        middleware2(req, res, () => {
          middleware3(req, res, () => {});
        });
      });

      // Verify
      expect(middleware1).toHaveBeenCalledTimes(1);
      expect(middleware3).toHaveBeenCalledTimes(1);
    });

    it('should not interfere with error handling', () => {
      // Setup
      req.user = {
        id: 'user-123',
        role: 'user',
      };
      const error = new Error('Test error');
      next = jest.fn(() => {
        throw error;
      });

      // Execute & Verify
      expect(() => {
        rateLimitBypass(req, res, next);
      }).toThrow('Test error');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
