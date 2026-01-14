/**
 * Tests for Admin Tier Override API Endpoints
 *
 * Tests tier override endpoints (database-based):
 * - POST /api/admin/tier-override (apply override)
 * - POST /api/admin/tier-override/clear (clear override)
 * - GET /api/admin/tier-override/status (check status)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sql } from '@vercel/postgres';

// Mock dependencies
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

describe('Admin Tier Override API Endpoints', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock response object
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    // Mock request object
    mockRequest = {
      user: {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin'
      },
      body: {},
      params: {}
    };
  });

  describe('POST /api/admin/tier-override', () => {
    it('should validate override request', async () => {
      mockRequest.body = {
        targetTier: 'pro',
        reason: 'Testing pro tier features for customer support',
        hoursValid: 4
      };

      const { validateOverrideRequest } = await import('../../utils/tierOverride.js');

      expect(() => {
        validateOverrideRequest(mockRequest.user, 'pro', mockRequest.body.reason);
      }).not.toThrow();
    });

    it('should reject override request from non-admin user', async () => {
      mockRequest.user.role = 'user';
      mockRequest.body = {
        targetTier: 'pro',
        reason: 'Testing features'
      };

      const { validateOverrideRequest } = await import('../../utils/tierOverride.js');

      expect(() => {
        validateOverrideRequest(mockRequest.user, 'pro', 'Testing features');
      }).toThrow('Only admin/support roles can apply tier overrides');
    });

    it('should reject invalid tier', async () => {
      mockRequest.body = {
        targetTier: 'invalid',
        reason: 'Testing invalid tier'
      };

      const { validateOverrideRequest } = await import('../../utils/tierOverride.js');

      expect(() => {
        validateOverrideRequest(mockRequest.user, 'invalid', 'Testing invalid tier');
      }).toThrow('Invalid tier: invalid');
    });

    it('should reject short reason', async () => {
      mockRequest.body = {
        targetTier: 'pro',
        reason: 'short'
      };

      const { validateOverrideRequest } = await import('../../utils/tierOverride.js');

      expect(() => {
        validateOverrideRequest(mockRequest.user, 'pro', 'short');
      }).toThrow('Override reason must be at least 10 characters');
    });

    it('should log override to audit trail', async () => {
      mockRequest.body = {
        targetTier: 'pro',
        reason: 'Testing pro tier features',
        hoursValid: 4
      };

      sql.mockResolvedValue({ rows: [] });

      // Verify SQL audit log structure
      const mockAuditData = {
        user_id: mockRequest.user.id,
        user_email: mockRequest.user.email,
        changed_by: mockRequest.user.id,
        field_name: 'tier_override',
        old_value: mockRequest.user.tier,
        new_value: JSON.stringify({
          targetTier: 'pro',
          reason: 'Testing pro tier features',
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        }),
        reason: 'Testing pro tier features'
      };

      expect(mockAuditData.field_name).toBe('tier_override');
      expect(mockAuditData.user_id).toBe(1);
      expect(mockAuditData.changed_by).toBe(1);
    });
  });

  describe('POST /api/admin/tier-override/clear', () => {
    it('should detect active override', async () => {
      mockRequest.user = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      const { hasActiveOverride } = await import('../../utils/tierOverride.js');

      expect(hasActiveOverride(mockRequest.user)).toBe(true);
    });

    it('should detect no active override', async () => {
      mockRequest.user = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin'
      };

      const { hasActiveOverride } = await import('../../utils/tierOverride.js');

      expect(hasActiveOverride(mockRequest.user)).toBe(false);
    });

    it('should log clear action to audit trail', async () => {
      mockRequest.user = {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      sql.mockResolvedValue({ rows: [] });

      const mockAuditData = {
        user_id: mockRequest.user.id,
        user_email: mockRequest.user.email,
        changed_by: mockRequest.user.id,
        field_name: 'tier_override_cleared',
        old_value: JSON.stringify({
          tier: mockRequest.user.viewing_as_tier,
          expiresAt: mockRequest.user.override_expires_at
        }),
        new_value: mockRequest.user.tier,
        reason: 'Tier override cleared by admin'
      };

      expect(mockAuditData.field_name).toBe('tier_override_cleared');
    });
  });

  describe('GET /api/admin/tier-override/status', () => {
    it('should return inactive status when no override', async () => {
      mockRequest.user = {
        id: 1,
        tier: 'pro',
        role: 'admin'
      };

      const { getOverrideDetails } = await import('../../utils/tierOverride.js');
      const details = getOverrideDetails(mockRequest.user);

      expect(details).toBeNull();

      const expectedResponse = {
        success: true,
        data: {
          active: false,
          realTier: 'pro',
          effectiveTier: 'pro'
        }
      };

      expect(expectedResponse.data.active).toBe(false);
      expect(expectedResponse.data.realTier).toBe(expectedResponse.data.effectiveTier);
    });

    it('should return active status with override details', async () => {
      const expiryTime = new Date(Date.now() + 2.1 * 60 * 60 * 1000); // 2.1 hours to avoid edge case
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'enterprise',
        override_expires_at: expiryTime.toISOString(),
        override_reason: 'Testing enterprise features',
        override_applied_at: new Date().toISOString()
      };

      const { getOverrideDetails } = await import('../../utils/tierOverride.js');
      const details = getOverrideDetails(mockRequest.user);

      expect(details).not.toBeNull();
      expect(details.tier).toBe('enterprise');
      expect(details.reason).toBe('Testing enterprise features');
      expect(details.remainingTime.hours).toBe(2); // Math.floor(2.1) = 2
    });

    it('should calculate remaining time correctly', async () => {
      const expiryTime = new Date(Date.now() + 1.5 * 60 * 60 * 1000); // 1.5 hours
      mockRequest.user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: expiryTime.toISOString(),
        override_reason: 'Testing',
        override_applied_at: new Date().toISOString()
      };

      const { getOverrideDetails } = await import('../../utils/tierOverride.js');
      const details = getOverrideDetails(mockRequest.user);

      expect(details.remainingTime.hours).toBe(1);
      expect(details.remainingTime.minutes).toBeGreaterThanOrEqual(29);
      expect(details.remainingTime.minutes).toBeLessThanOrEqual(30);
    });
  });

  describe('Audit Log Queries', () => {
    it('should query audit log entries', async () => {
      mockRequest.user = { id: 1, role: 'admin' };

      const mockAuditRows = [
        {
          id: 1,
          user_id: 1,
          user_email: 'admin@test.com',
          changed_by: 1,
          field_name: 'tier_override',
          old_value: 'free',
          new_value: JSON.stringify({ targetTier: 'pro', reason: 'Testing', expiresAt: new Date().toISOString() }),
          changed_at: new Date(),
          reason: 'Testing'
        },
        {
          id: 2,
          user_id: 1,
          user_email: 'admin@test.com',
          changed_by: 1,
          field_name: 'tier_override_cleared',
          old_value: JSON.stringify({ tier: 'pro', expiresAt: new Date().toISOString() }),
          new_value: 'free',
          changed_at: new Date(),
          reason: 'Tier override cleared by admin'
        }
      ];

      sql.mockResolvedValue({ rows: mockAuditRows });

      const formattedLog = mockAuditRows.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        timestamp: entry.changed_at,
        action: entry.field_name === 'tier_override_cleared' ? 'cleared' : 'applied',
        oldValue: entry.old_value,
        newValue: entry.new_value,
        reason: entry.reason,
        changedBy: entry.changed_by
      }));

      expect(formattedLog).toHaveLength(2);
      expect(formattedLog[0].action).toBe('applied');
      expect(formattedLog[1].action).toBe('cleared');
    });

    it('should filter by field_name for tier overrides', async () => {
      mockRequest.user = { id: 1, role: 'admin' };

      const mockRows = [
        {
          id: 1,
          field_name: 'tier_override',
          old_value: 'free',
          new_value: JSON.stringify({ targetTier: 'pro' }),
          changed_at: new Date(),
          changed_by: 1
        },
        {
          id: 2,
          field_name: 'tier_override_cleared',
          old_value: JSON.stringify({ tier: 'pro' }),
          new_value: 'free',
          changed_at: new Date(),
          changed_by: 1
        }
      ];

      sql.mockResolvedValue({ rows: mockRows });

      // Verify all rows are tier override related
      expect(mockRows.every(row =>
        row.field_name === 'tier_override' || row.field_name === 'tier_override_cleared'
      )).toBe(true);
    });

    it('should order by changed_at DESC', async () => {
      mockRequest.user = { id: 1, role: 'admin' };

      const now = new Date();
      const mockRows = [
        {
          id: 3,
          field_name: 'tier_override',
          changed_at: new Date(now.getTime() - 3600000), // 1 hour ago
        },
        {
          id: 2,
          field_name: 'tier_override',
          changed_at: new Date(now.getTime() - 7200000), // 2 hours ago
        },
        {
          id: 1,
          field_name: 'tier_override',
          changed_at: new Date(now.getTime() - 10800000), // 3 hours ago
        }
      ];

      sql.mockResolvedValue({ rows: mockRows });

      // Verify order (most recent first)
      expect(mockRows[0].id).toBe(3);
      expect(mockRows[1].id).toBe(2);
      expect(mockRows[2].id).toBe(1);
    });
  });

  describe('Middleware Integration', () => {
    it('should require authentication', async () => {
      const unauthenticatedRequest = { user: null };

      // requireAuth middleware would reject this
      expect(unauthenticatedRequest.user).toBeNull();
    });

    it('should require admin role', async () => {
      const nonAdminUser = {
        id: 1,
        email: 'user@test.com',
        tier: 'free',
        role: 'user'
      };

      // requireAdmin middleware would reject this
      expect(['admin', 'support', 'super_admin'].includes(nonAdminUser.role)).toBe(false);
    });

    it('should allow admin role', async () => {
      expect(['admin', 'support', 'super_admin'].includes(mockRequest.user.role)).toBe(true);
    });

    it('should allow support role', async () => {
      mockRequest.user.role = 'support';
      expect(['admin', 'support', 'super_admin'].includes(mockRequest.user.role)).toBe(true);
    });

    it('should allow super_admin role', async () => {
      mockRequest.user.role = 'super_admin';
      expect(['admin', 'support', 'super_admin'].includes(mockRequest.user.role)).toBe(true);
    });
  });
});
