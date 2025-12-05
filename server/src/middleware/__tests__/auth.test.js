/**
 * Unit tests for auth middleware
 * Tests JWT validation, authentication checks, and request validation
 */

import jwt from 'jsonwebtoken';
import {
  requireAuth,
  optionalAuth,
  requireTier,
  requireVerifiedEmail,
  validateBody,
  generateToken,
  sanitizeUser
} from '../auth.js';

// Mock User model
jest.mock('../../models/User.js');

// Mock Trial model
jest.mock('../../models/Trial.js', () => ({
  default: {
    findActiveByUserId: jest.fn().mockResolvedValue(null),
    expire: jest.fn().mockResolvedValue(null)
  }
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret-key';

    // Reset the User mock
    const User = (await import('../../models/User.js')).default;
    User.findById = jest.fn();

    req = {
      headers: {},
      user: null,
      isAuthenticated: jest.fn()
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should allow request with valid JWT token', async () => {
      const User = (await import('../../models/User.js')).default;
      const mockUser = { id: 123, tier: 'free', email: 'test@example.com' };
      User.findById.mockResolvedValue(mockUser);

      const token = jwt.sign({ sub: 123 }, process.env.JWT_SECRET, { expiresIn: '1h' });
      req.headers.authorization = `Bearer ${token}`;

      await requireAuth(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        ...mockUser,
        effectiveTier: 'free',
        activeTrial: null,
        isOnTrial: false,
        trialTier: null,
        trialEndsAt: null
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authentication', () => {
      req.isAuthenticated.mockReturnValue(false);

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', () => {
      const expiredToken = jwt.sign(
        { sub: 123 },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      req.headers.authorization = `Bearer ${expiredToken}`;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept token without "Bearer " prefix', async () => {
      const User = (await import('../../models/User.js')).default;
      const mockUser = { id: 456, tier: 'pro', email: 'test2@example.com' };
      User.findById.mockResolvedValue(mockUser);

      const token = jwt.sign({ sub: 456 }, process.env.JWT_SECRET, { expiresIn: '1h' });
      req.headers.authorization = token;

      await requireAuth(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(456);
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        ...mockUser,
        effectiveTier: 'pro',
        activeTrial: null,
        isOnTrial: false,
        trialTier: null,
        trialEndsAt: null
      });
    });

    it('should prioritize JWT over session', async () => {
      const User = (await import('../../models/User.js')).default;
      const mockUser = { id: 789, tier: 'team', email: 'test3@example.com' };
      User.findById.mockResolvedValue(mockUser);

      const token = jwt.sign({ sub: 789 }, process.env.JWT_SECRET, { expiresIn: '1h' });
      req.headers.authorization = `Bearer ${token}`;
      req.isAuthenticated.mockReturnValue(true);
      req.user = { id: 999 };

      await requireAuth(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(789);
      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe(789); // JWT takes precedence
      expect(req.user.effectiveTier).toBe('team');
    });

  });

  describe('optionalAuth', () => {
    it('should attach user if JWT is valid', async () => {
      const User = (await import('../../models/User.js')).default;
      const mockUser = { id: 123, tier: 'free', email: 'test@example.com' };
      User.findById.mockResolvedValue(mockUser);

      const token = jwt.sign({ sub: 123 }, process.env.JWT_SECRET, { expiresIn: '1h' });
      req.headers.authorization = `Bearer ${token}`;

      await optionalAuth(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        ...mockUser,
        effectiveTier: 'free',
        activeTrial: null,
        isOnTrial: false,
        trialTier: null,
        trialEndsAt: null
      });
    });

    it('should continue without user if not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    it('should continue if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    it('should not fail request on auth error', () => {
      req.headers.authorization = 'Bearer malformed';
      req.isAuthenticated.mockReturnValue(false);

      expect(() => optionalAuth(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireTier', () => {
    it('should allow access if user has exact required tier', async () => {
      req.user = { id: 1, tier: 'pro', effectiveTier: 'pro' };

      const middleware = requireTier('pro');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access if user has higher tier', async () => {
      req.user = { id: 1, tier: 'enterprise', effectiveTier: 'enterprise' };

      const middleware = requireTier('pro');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject access if user has lower tier', async () => {
      req.user = { id: 1, tier: 'free', effectiveTier: 'free' };

      const middleware = requireTier('pro');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'This feature requires pro tier or higher',
        currentTier: 'free',
        effectiveTier: 'free',
        requiredTier: 'pro'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if user is not authenticated', async () => {
      req.user = null;

      const middleware = requireTier('free');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error for invalid tier', () => {
      expect(() => requireTier('invalid-tier')).toThrow('Invalid tier: invalid-tier');
    });

    it('should validate tier hierarchy correctly', async () => {
      const tiers = ['free', 'pro', 'team', 'enterprise'];

      for (const [userIndex, userTier] of tiers.entries()) {
        for (const [requiredIndex, requiredTier] of tiers.entries()) {
          req.user = { id: 1, tier: userTier, effectiveTier: userTier };
          next.mockClear();
          res.status.mockClear();

          const middleware = requireTier(requiredTier);
          await middleware(req, res, next);

          if (userIndex >= requiredIndex) {
            expect(next).toHaveBeenCalled();
          } else {
            expect(res.status).toHaveBeenCalledWith(403);
          }
        }
      }
    });
  });

  describe('validateBody', () => {
    beforeEach(() => {
      req.body = {};
    });

    it('should pass validation for valid data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'SecurePass123'
      };

      const middleware = validateBody({
        email: { required: true, type: 'email' },
        password: { required: true, type: 'password', minLength: 8 }
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing required fields', () => {
      req.body = {};

      const middleware = validateBody({
        email: { required: true },
        password: { required: true }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: {
          email: 'email is required',
          password: 'password is required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate email format', () => {
      req.body = { email: 'not-an-email' };

      const middleware = validateBody({
        email: { required: true, type: 'email' }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].details.email).toBe('Invalid email format');
    });

    it('should validate password minimum length', () => {
      req.body = { password: 'short' };

      const middleware = validateBody({
        password: { required: true, type: 'password', minLength: 8 }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].details.password).toContain('at least 8 characters');
    });

    it('should validate custom minLength', () => {
      req.body = { username: 'ab' };

      const middleware = validateBody({
        username: { required: true, minLength: 3 }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].details.username).toContain('at least 3 characters');
    });

    it('should validate maxLength', () => {
      req.body = { username: 'a'.repeat(51) };

      const middleware = validateBody({
        username: { required: true, maxLength: 50 }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].details.username).toContain('at most 50 characters');
    });

    it('should skip validation for optional missing fields', () => {
      req.body = { email: 'test@example.com' };

      const middleware = validateBody({
        email: { required: true, type: 'email' },
        name: { required: false, minLength: 2 }
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should validate optional fields if provided', () => {
      req.body = {
        email: 'test@example.com',
        name: 'a'
      };

      const middleware = validateBody({
        email: { required: true, type: 'email' },
        name: { required: false, minLength: 2 }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].details.name).toContain('at least 2 characters');
    });

    it('should use custom validator function', () => {
      req.body = { username: 'test@user' };

      const middleware = validateBody({
        username: {
          required: true,
          custom: (value) => {
            if (value.includes('@')) {
              return 'Username cannot contain @ symbol';
            }
            return null;
          }
        }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].details.username).toBe('Username cannot contain @ symbol');
    });

    it('should pass custom validation if valid', () => {
      req.body = { username: 'validuser' };

      const middleware = validateBody({
        username: {
          required: true,
          custom: (value) => {
            if (value.includes('@')) {
              return 'Username cannot contain @ symbol';
            }
            return null;
          }
        }
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle empty strings as missing', () => {
      req.body = { email: '   ' };

      const middleware = validateBody({
        email: { required: true }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].details.email).toBe('email is required');
    });

    // Tests for number type validation
    describe('number type validation', () => {
      it('should accept valid number', () => {
        req.body = { count: 5 };

        const middleware = validateBody({
          count: { required: true, type: 'number' }
        });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should accept 0 as valid number (not treat as missing)', () => {
        req.body = { failCount: 0 };

        const middleware = validateBody({
          failCount: { required: true, type: 'number', min: 0 }
        });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should reject non-number value', () => {
        req.body = { count: 'five' };

        const middleware = validateBody({
          count: { required: true, type: 'number' }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.count).toBe('count must be a number');
      });

      it('should reject NaN', () => {
        req.body = { count: NaN };

        const middleware = validateBody({
          count: { required: true, type: 'number' }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.count).toBe('count must be a number');
      });

      it('should validate min constraint', () => {
        req.body = { count: -1 };

        const middleware = validateBody({
          count: { required: true, type: 'number', min: 0 }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.count).toBe('count must be at least 0');
      });

      it('should validate max constraint', () => {
        req.body = { count: 101 };

        const middleware = validateBody({
          count: { required: true, type: 'number', max: 100 }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.count).toBe('count must be at most 100');
      });

      it('should accept number within min/max range', () => {
        req.body = { count: 50 };

        const middleware = validateBody({
          count: { required: true, type: 'number', min: 0, max: 100 }
        });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    // Tests for string type with enum validation
    describe('string type with enum validation', () => {
      it('should accept valid enum value', () => {
        req.body = { batchType: 'batch' };

        const middleware = validateBody({
          batchType: { required: true, type: 'string', enum: ['batch', 'single'] }
        });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should reject invalid enum value', () => {
        req.body = { batchType: 'invalid' };

        const middleware = validateBody({
          batchType: { required: true, type: 'string', enum: ['batch', 'single'] }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.batchType).toBe('batchType must be one of: batch, single');
      });

      it('should reject non-string value for string type', () => {
        req.body = { batchType: 123 };

        const middleware = validateBody({
          batchType: { required: true, type: 'string' }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.batchType).toBe('batchType must be a string');
      });
    });

    // Tests for array type validation
    describe('array type validation', () => {
      it('should accept valid array', () => {
        req.body = { documentIds: ['doc-1', 'doc-2'] };

        const middleware = validateBody({
          documentIds: { required: true, type: 'array' }
        });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should accept empty array', () => {
        req.body = { documentIds: [] };

        const middleware = validateBody({
          documentIds: { required: true, type: 'array' }
        });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should reject non-array value', () => {
        req.body = { documentIds: 'not-an-array' };

        const middleware = validateBody({
          documentIds: { required: true, type: 'array' }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.documentIds).toBe('documentIds must be an array');
      });
    });

    // Tests for null/undefined handling
    describe('null and undefined handling', () => {
      it('should treat null as missing for required fields', () => {
        req.body = { email: null };

        const middleware = validateBody({
          email: { required: true }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.email).toBe('email is required');
      });

      it('should treat undefined as missing for required fields', () => {
        req.body = { email: undefined };

        const middleware = validateBody({
          email: { required: true }
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].details.email).toBe('email is required');
      });

      it('should skip validation for optional null fields', () => {
        req.body = { name: null };

        const middleware = validateBody({
          name: { required: false, minLength: 2 }
        });

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const user = { id: 123 };
      const token = generateToken(user);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.sub).toBe(123);
    });

    it('should use default expiration of 7 days', () => {
      const user = { id: 456 };
      const token = generateToken(user);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + sevenDays + 10); // Allow 10s margin
    });

    it('should accept custom expiration', () => {
      const user = { id: 789 };
      const token = generateToken(user, '1h');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const now = Math.floor(Date.now() / 1000);
      const oneHour = 60 * 60;

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + oneHour + 10);
    });

    it('should include user ID in sub claim', () => {
      const user = { id: 999 };
      const token = generateToken(user);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.sub).toBe(999);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password_hash from user object', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        tier: 'free'
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized.password_hash).toBeUndefined();
      expect(sanitized.id).toBe(1);
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.tier).toBe('free');
    });

    it('should return null for null input', () => {
      const sanitized = sanitizeUser(null);
      expect(sanitized).toBeNull();
    });

    it('should return null for undefined input', () => {
      const sanitized = sanitizeUser(undefined);
      expect(sanitized).toBeNull();
    });

    it('should not modify original user object', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword'
      };

      const sanitized = sanitizeUser(user);

      expect(user.password_hash).toBe('$2b$10$hashedpassword');
      expect(sanitized.password_hash).toBeUndefined();
    });

    it('should preserve all other fields', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        tier: 'pro',
        github_id: '12345',
        created_at: new Date(),
        updated_at: new Date(),
        custom_field: 'value'
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized.id).toBe(user.id);
      expect(sanitized.email).toBe(user.email);
      expect(sanitized.tier).toBe(user.tier);
      expect(sanitized.github_id).toBe(user.github_id);
      expect(sanitized.created_at).toBe(user.created_at);
      expect(sanitized.updated_at).toBe(user.updated_at);
      expect(sanitized.custom_field).toBe(user.custom_field);
      expect(sanitized.password_hash).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JWT gracefully', () => {
      req.headers.authorization = 'Bearer not.a.valid.jwt.token';

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JWT with wrong secret', () => {
      const token = jwt.sign({ sub: 123 }, 'wrong-secret', { expiresIn: '1h' });
      req.headers.authorization = `Bearer ${token}`;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing isAuthenticated function', () => {
      delete req.isAuthenticated;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireVerifiedEmail', () => {
    it('should reject request without user', async () => {
      req.user = null;

      await requireVerifiedEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with user missing id', async () => {
      req.user = { email: 'test@test.com' }; // No id

      await requireVerifiedEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
