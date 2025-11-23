/**
 * Tests for Auth Middleware with Tier Override Support
 *
 * Tests the updated requireAuth and requireTier middleware
 * to ensure tier overrides from database are properly handled:
 * - Database override fields are included in req.user
 * - requireTier uses effective tier (considering overrides)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

// Mock User model
jest.mock('../../models/User.js');

// Mock tierOverride utilities
jest.mock('../../utils/tierOverride.js', () => ({
  getEffectiveTier: jest.fn((user) => {
    if (!user) return 'free';

    // Only admin/support/super_admin can have overrides
    if (!['admin', 'support', 'super_admin'].includes(user.role)) {
      return user.tier || 'free';
    }

    // Check if override exists and is valid
    if (!user.viewing_as_tier || !user.override_expires_at) {
      return user.tier || 'free';
    }

    // Check if override has expired
    const now = new Date();
    const expiry = new Date(user.override_expires_at);

    if (isNaN(expiry.getTime()) || now > expiry) {
      return user.tier || 'free';
    }

    return user.viewing_as_tier;
  })
}));

describe('Auth Middleware - Tier Override Support', () => {
  let requireAuth;
  let requireTier;
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup JWT spy
    jest.spyOn(jwt, 'verify');

    // Import middleware (after mocks are set up)
    const authModule = await import('../auth.js');
    requireAuth = authModule.requireAuth;
    requireTier = authModule.requireTier;

    // Mock request
    mockRequest = {
      headers: {
        authorization: 'Bearer mock-token'
      },
      user: null
    };

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock next
    mockNext = jest.fn();

    // Mock environment
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('requireAuth with database tier override fields', () => {
    it('should include override fields from database in req.user', async () => {
      const decodedToken = {
        sub: 1,
        id: 1
      };

      const dbUser = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'enterprise',
        override_expires_at: new Date(Date.now() + 3600000).toISOString(),
        override_reason: 'Testing enterprise features',
        override_applied_at: new Date().toISOString()
      };

      jwt.verify.mockReturnValue(decodedToken);
      User.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.viewing_as_tier).toBe('enterprise');
      expect(mockRequest.user.override_expires_at).toBe(dbUser.override_expires_at);
      expect(mockRequest.user.override_reason).toBe('Testing enterprise features');
      expect(mockRequest.user.override_applied_at).toBe(dbUser.override_applied_at);
      // effectiveTier added by middleware - check it exists
      expect(mockRequest.user).toHaveProperty('effectiveTier');
    });

    it('should work with JWT using sub field', async () => {
      const decodedToken = {
        sub: 1
      };

      const dbUser = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      jwt.verify.mockReturnValue(decodedToken);
      User.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      expect(User.findById).toHaveBeenCalledWith(1);
      expect(mockRequest.user.viewing_as_tier).toBe('pro');
      // effectiveTier added by middleware - check it exists
      expect(mockRequest.user).toHaveProperty('effectiveTier');
    });

    it('should work with JWT using id field', async () => {
      const decodedToken = {
        id: 1
      };

      const dbUser = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      jwt.verify.mockReturnValue(decodedToken);
      User.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      expect(User.findById).toHaveBeenCalledWith(1);
      expect(mockRequest.user.viewing_as_tier).toBe('pro');
      // effectiveTier added by middleware - check it exists
      expect(mockRequest.user).toHaveProperty('effectiveTier');
    });

    it('should not have override fields when not present in database', async () => {
      const decodedToken = {
        sub: 1
      };

      const dbUser = {
        id: 1,
        email: 'user@test.com',
        tier: 'pro',
        role: 'user'
      };

      jwt.verify.mockReturnValue(decodedToken);
      User.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user.viewing_as_tier).toBeUndefined();
      expect(mockRequest.user.override_expires_at).toBeUndefined();
      // effectiveTier added by middleware - check it exists
      expect(mockRequest.user).toHaveProperty('effectiveTier');
    });

    it('should include all database fields in req.user', async () => {
      const decodedToken = {
        sub: 1
      };

      const dbUser = {
        id: 1,
        email: 'support@test.com',
        tier: 'free',
        role: 'support',
        viewing_as_tier: 'team',
        override_expires_at: new Date(Date.now() + 3600000).toISOString(),
        override_reason: 'Testing team features',
        override_applied_at: new Date().toISOString(),
        created_at: new Date(),
        email_verified: true
      };

      jwt.verify.mockReturnValue(decodedToken);
      User.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      // All database fields preserved
      expect(mockRequest.user.id).toBe(1);
      expect(mockRequest.user.email).toBe('support@test.com');
      expect(mockRequest.user.tier).toBe('free');
      expect(mockRequest.user.role).toBe('support');
      expect(mockRequest.user.email_verified).toBe(true);
      expect(mockRequest.user.viewing_as_tier).toBe('team');
      expect(mockRequest.user.override_expires_at).toBe(dbUser.override_expires_at);
      expect(mockRequest.user.override_reason).toBe('Testing team features');
      // effectiveTier added by middleware - check it exists
      expect(mockRequest.user).toHaveProperty('effectiveTier');
    });
  });

  describe('requireTier with tier override support', () => {
    it('should allow access when override tier meets requirement', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString(),
        effectiveTier: 'pro' // Added by requireAuth
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when override tier below requirement', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'starter',
        override_expires_at: new Date(Date.now() + 3600000).toISOString(),
        effectiveTier: 'starter' // Added by requireAuth
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'This feature requires pro tier or higher'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use real tier when override expired', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'pro',
        role: 'admin',
        viewing_as_tier: 'free',
        override_expires_at: new Date(Date.now() - 3600000).toISOString(), // Expired
        effectiveTier: 'pro' // getEffectiveTier returns real tier when override expired
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      // Should use real tier (pro), not expired override (free)
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should use real tier when user is not admin/support', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'user',
        viewing_as_tier: 'pro', // Should be ignored
        override_expires_at: new Date(Date.now() + 3600000).toISOString(),
        effectiveTier: 'free' // getEffectiveTier returns real tier for non-admin
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      // Should use real tier (free), not override (pro) for non-admin
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include effectiveTier in error response', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'starter',
        override_expires_at: new Date(Date.now() + 3600000).toISOString(),
        effectiveTier: 'starter' // Added by requireAuth
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          currentTier: 'free',
          effectiveTier: 'starter',
          requiredTier: 'pro'
        })
      );
    });

    it('should support all tier levels', async () => {
      const tiers = ['free', 'starter', 'pro', 'team', 'enterprise'];

      for (const tier of tiers) {
        jest.clearAllMocks();

        mockRequest.user = {
          id: 1,
          tier: 'free',
          role: 'admin',
          viewing_as_tier: tier,
          override_expires_at: new Date(Date.now() + 3600000).toISOString(),
          effectiveTier: tier // Added by requireAuth
        };

        const middleware = requireTier(tier);
        await middleware(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should handle tier hierarchy correctly', async () => {
      // Enterprise override can access all tiers
      const tiers = ['free', 'starter', 'pro', 'team', 'enterprise'];

      for (const requiredTier of tiers) {
        jest.clearAllMocks();

        mockRequest.user = {
          id: 1,
          tier: 'free',
          role: 'admin',
          viewing_as_tier: 'enterprise',
          override_expires_at: new Date(Date.now() + 3600000).toISOString(),
          effectiveTier: 'enterprise' // Added by requireAuth
        };

        const middleware = requireTier(requiredTier);
        await middleware(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
      }
    });

    it('should reject free override for pro tier requirement', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'pro',
        role: 'admin',
        viewing_as_tier: 'free',
        override_expires_at: new Date(Date.now() + 3600000).toISOString(),
        effectiveTier: 'free' // Added by requireAuth
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing user gracefully', async () => {
      mockRequest.user = null;

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Authentication required'
        })
      );
    });

    it('should handle missing tier in user object', async () => {
      mockRequest.user = {
        id: 1,
        role: 'user'
        // tier is missing
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle malformed override expiry date', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: 'invalid-date',
        effectiveTier: 'free' // getEffectiveTier returns real tier when date is malformed
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      // getEffectiveTier should handle gracefully, falling back to real tier
      // Since malformed date will be treated as invalid, should use real tier (free)
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});
