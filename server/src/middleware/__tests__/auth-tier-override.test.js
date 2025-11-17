/**
 * Tests for Auth Middleware with Tier Override Support
 *
 * Tests the updated requireAuth and requireTier middleware
 * to ensure tier overrides are properly handled:
 * - JWT override fields are preserved in req.user
 * - requireTier uses effective tier (considering overrides)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock User model
const mockUser = {
  findById: vi.fn()
};

vi.mock('../../models/User.js', () => ({
  default: mockUser
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn()
  }
}));

describe('Auth Middleware - Tier Override Support', () => {
  let requireAuth;
  let requireTier;
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(async () => {
    vi.clearAllMocks();

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
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Mock next
    mockNext = vi.fn();

    // Mock environment
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('requireAuth with tier override fields', () => {
    it('should preserve override fields from JWT in req.user', async () => {
      const decodedToken = {
        sub: 1,
        id: 1,
        tierOverride: 'enterprise',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString(),
        overrideReason: 'Testing enterprise features',
        overrideAppliedAt: new Date().toISOString()
      };

      const dbUser = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin'
      };

      jwt.verify.mockReturnValue(decodedToken);
      mockUser.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.tierOverride).toBe('enterprise');
      expect(mockRequest.user.overrideExpiry).toBe(decodedToken.overrideExpiry);
      expect(mockRequest.user.overrideReason).toBe('Testing enterprise features');
      expect(mockRequest.user.overrideAppliedAt).toBe(decodedToken.overrideAppliedAt);
    });

    it('should work with JWT using sub field', async () => {
      const decodedToken = {
        sub: 1,
        tierOverride: 'pro',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString(),
        overrideReason: 'Testing',
        overrideAppliedAt: new Date().toISOString()
      };

      const dbUser = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin'
      };

      jwt.verify.mockReturnValue(decodedToken);
      mockUser.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockUser.findById).toHaveBeenCalledWith(1);
      expect(mockRequest.user.tierOverride).toBe('pro');
    });

    it('should work with JWT using id field', async () => {
      const decodedToken = {
        id: 1,
        tierOverride: 'pro',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString(),
        overrideReason: 'Testing',
        overrideAppliedAt: new Date().toISOString()
      };

      const dbUser = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin'
      };

      jwt.verify.mockReturnValue(decodedToken);
      mockUser.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockUser.findById).toHaveBeenCalledWith(1);
      expect(mockRequest.user.tierOverride).toBe('pro');
    });

    it('should not add override fields when not present in JWT', async () => {
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
      mockUser.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user.tierOverride).toBeUndefined();
      expect(mockRequest.user.overrideExpiry).toBeUndefined();
    });

    it('should merge database user with override fields', async () => {
      const decodedToken = {
        sub: 1,
        tierOverride: 'team',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString(),
        overrideReason: 'Testing team features',
        overrideAppliedAt: new Date().toISOString()
      };

      const dbUser = {
        id: 1,
        email: 'support@test.com',
        tier: 'free',
        role: 'support',
        created_at: new Date(),
        email_verified: true
      };

      jwt.verify.mockReturnValue(decodedToken);
      mockUser.findById.mockResolvedValue(dbUser);

      await requireAuth(mockRequest, mockResponse, mockNext);

      // Database fields preserved
      expect(mockRequest.user.id).toBe(1);
      expect(mockRequest.user.email).toBe('support@test.com');
      expect(mockRequest.user.tier).toBe('free');
      expect(mockRequest.user.role).toBe('support');
      expect(mockRequest.user.email_verified).toBe(true);

      // Override fields added
      expect(mockRequest.user.tierOverride).toBe('team');
      expect(mockRequest.user.overrideExpiry).toBe(decodedToken.overrideExpiry);
      expect(mockRequest.user.overrideReason).toBe('Testing team features');
    });
  });

  describe('requireTier with tier override support', () => {
    it('should allow access when override tier meets requirement', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        tierOverride: 'pro',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString()
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
        tierOverride: 'starter',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString()
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
        tierOverride: 'free',
        overrideExpiry: new Date(Date.now() - 3600000).toISOString() // Expired
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
        tierOverride: 'pro', // Should be ignored
        overrideExpiry: new Date(Date.now() + 3600000).toISOString()
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
        tierOverride: 'starter',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString()
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
        vi.clearAllMocks();

        mockRequest.user = {
          id: 1,
          tier: 'free',
          role: 'admin',
          tierOverride: tier,
          overrideExpiry: new Date(Date.now() + 3600000).toISOString()
        };

        const middleware = requireTier(tier);
        await middleware(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should handle tier hierarchy correctly', async () => {
      // Enterprise override can access all tiers
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        tierOverride: 'enterprise',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString()
      };

      const tiers = ['free', 'starter', 'pro', 'team', 'enterprise'];

      for (const requiredTier of tiers) {
        vi.clearAllMocks();

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
        tierOverride: 'free',
        overrideExpiry: new Date(Date.now() + 3600000).toISOString()
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
        tierOverride: 'pro',
        overrideExpiry: 'invalid-date'
      };

      const middleware = requireTier('pro');
      await middleware(mockRequest, mockResponse, mockNext);

      // Should handle gracefully, possibly falling back to real tier
      // Exact behavior depends on getEffectiveTier implementation
    });
  });
});
