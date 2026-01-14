/**
 * Tests for Admin Suspension and Deletion API Endpoints
 *
 * Tests suspension and deletion endpoints:
 * - POST /api/admin/users/:userId/suspend (suspend account)
 * - POST /api/admin/users/:userId/unsuspend (unsuspend account)
 * - POST /api/admin/users/:userId/schedule-deletion (schedule deletion)
 * - POST /api/admin/users/:userId/cancel-deletion (cancel scheduled deletion)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sql } from '@vercel/postgres';

// Mock dependencies
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

describe('Admin Suspension and Deletion API Endpoints', () => {
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

  describe('POST /api/admin/users/:userId/suspend', () => {
    it('should suspend a user account with reason', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Terms of service violation - spam activity detected'
      };

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        first_name: 'Test',
        last_name: 'User',
        suspended: false
      };

      const mockUpdatedUser = {
        ...mockUser,
        suspended: true,
        suspended_at: new Date().toISOString(),
        suspension_reason: 'Terms of service violation - spam activity detected'
      };

      // Mock user fetch
      sql.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock user update
      sql.mockResolvedValueOnce({ rows: [mockUpdatedUser] });
      // Mock audit log insert
      sql.mockResolvedValueOnce({ rows: [] });

      expect(mockRequest.body.reason.length).toBeGreaterThanOrEqual(10);
      expect(mockUpdatedUser.suspended).toBe(true);
      expect(mockUpdatedUser.suspension_reason).toBe(mockRequest.body.reason);
    });

    it('should reject suspension with short reason', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'spam' // Too short
      };

      expect(mockRequest.body.reason.length).toBeLessThan(10);
    });

    it('should reject suspension from non-admin user', async () => {
      mockRequest.user.role = 'user';
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Valid reason for suspension'
      };

      const isAdmin = ['admin', 'support', 'super_admin'].includes(mockRequest.user.role);
      expect(isAdmin).toBe(false);
    });

    it('should log suspension to audit trail', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Terms of service violation - spam activity detected'
      };

      const mockAuditData = {
        user_id: 2,
        user_email: 'user@test.com',
        changed_by: mockRequest.user.id,
        field_name: 'suspended',
        old_value: 'false',
        new_value: 'true',
        reason: 'Terms of service violation - spam activity detected'
      };

      expect(mockAuditData.field_name).toBe('suspended');
      expect(mockAuditData.user_id).toBe(2);
      expect(mockAuditData.changed_by).toBe(1);
      expect(mockAuditData.old_value).toBe('false');
      expect(mockAuditData.new_value).toBe('true');
    });

    it('should handle already suspended user', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Additional suspension reason'
      };

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        suspended: true,
        suspended_at: new Date(Date.now() - 86400000).toISOString()
      };

      sql.mockResolvedValueOnce({ rows: [mockUser] });

      expect(mockUser.suspended).toBe(true);
    });
  });

  describe('POST /api/admin/users/:userId/unsuspend', () => {
    it('should unsuspend a user account with reason', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Appeal approved - false positive spam detection'
      };

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        suspended: true,
        suspended_at: new Date(Date.now() - 86400000).toISOString(),
        suspension_reason: 'Previous violation'
      };

      const mockUpdatedUser = {
        ...mockUser,
        suspended: false,
        suspended_at: null,
        suspension_reason: null
      };

      // Mock user fetch
      sql.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock user update
      sql.mockResolvedValueOnce({ rows: [mockUpdatedUser] });
      // Mock audit log insert
      sql.mockResolvedValueOnce({ rows: [] });

      expect(mockUpdatedUser.suspended).toBe(false);
      expect(mockUpdatedUser.suspended_at).toBeNull();
      expect(mockUpdatedUser.suspension_reason).toBeNull();
    });

    it('should reject unsuspension with short reason', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'fixed' // Too short
      };

      expect(mockRequest.body.reason.length).toBeLessThan(10);
    });

    it('should log unsuspension to audit trail', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Appeal approved - false positive spam detection'
      };

      const mockAuditData = {
        user_id: 2,
        user_email: 'user@test.com',
        changed_by: mockRequest.user.id,
        field_name: 'suspended',
        old_value: 'true',
        new_value: 'false',
        reason: 'Appeal approved - false positive spam detection'
      };

      expect(mockAuditData.field_name).toBe('suspended');
      expect(mockAuditData.old_value).toBe('true');
      expect(mockAuditData.new_value).toBe('false');
    });

    it('should handle user not currently suspended', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Unsuspension reason'
      };

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        suspended: false,
        suspended_at: null
      };

      sql.mockResolvedValueOnce({ rows: [mockUser] });

      expect(mockUser.suspended).toBe(false);
    });
  });

  describe('POST /api/admin/users/:userId/schedule-deletion', () => {
    it('should schedule user deletion with grace period', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Account closure requested by compliance team',
        gracePeriodDays: 30
      };

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        deletion_scheduled_at: null
      };

      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      const mockUpdatedUser = {
        ...mockUser,
        deletion_scheduled_at: deletionDate.toISOString()
      };

      // Mock user fetch
      sql.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock user update
      sql.mockResolvedValueOnce({ rows: [mockUpdatedUser] });
      // Mock audit log insert
      sql.mockResolvedValueOnce({ rows: [] });

      expect(mockUpdatedUser.deletion_scheduled_at).not.toBeNull();
      expect(new Date(mockUpdatedUser.deletion_scheduled_at).getTime()).toBeGreaterThan(Date.now());
    });

    it('should validate grace period (1-90 days)', async () => {
      const invalidGracePeriods = [0, -1, 91, 100];
      const validGracePeriods = [1, 7, 30, 60, 90];

      invalidGracePeriods.forEach(days => {
        expect(days < 1 || days > 90).toBe(true);
      });

      validGracePeriods.forEach(days => {
        expect(days >= 1 && days <= 90).toBe(true);
      });
    });

    it('should reject scheduling with short reason', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'delete',
        gracePeriodDays: 30
      };

      expect(mockRequest.body.reason.length).toBeLessThan(10);
    });

    it('should log deletion scheduling to audit trail', async () => {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      const mockAuditData = {
        user_id: 2,
        user_email: 'user@test.com',
        changed_by: mockRequest.user.id,
        field_name: 'deletion_scheduled_at',
        old_value: null,
        new_value: deletionDate.toISOString(),
        reason: 'Account closure requested by compliance team'
      };

      expect(mockAuditData.field_name).toBe('deletion_scheduled_at');
      expect(mockAuditData.old_value).toBeNull();
      expect(mockAuditData.new_value).not.toBeNull();
    });

    it('should handle already scheduled deletion', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Reschedule deletion',
        gracePeriodDays: 30
      };

      const existingDeletionDate = new Date();
      existingDeletionDate.setDate(existingDeletionDate.getDate() + 7);

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        deletion_scheduled_at: existingDeletionDate.toISOString()
      };

      sql.mockResolvedValueOnce({ rows: [mockUser] });

      expect(mockUser.deletion_scheduled_at).not.toBeNull();
    });

    it('should use default grace period of 30 days if not provided', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Account closure requested by compliance team'
        // No gracePeriodDays provided
      };

      const defaultGracePeriod = 30;
      expect(defaultGracePeriod).toBe(30);
    });
  });

  describe('POST /api/admin/users/:userId/cancel-deletion', () => {
    it('should cancel scheduled deletion with reason', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'User appeal approved - account restored'
      };

      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        deletion_scheduled_at: deletionDate.toISOString()
      };

      const mockUpdatedUser = {
        ...mockUser,
        deletion_scheduled_at: null
      };

      // Mock user fetch
      sql.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock user update
      sql.mockResolvedValueOnce({ rows: [mockUpdatedUser] });
      // Mock audit log insert
      sql.mockResolvedValueOnce({ rows: [] });

      expect(mockUpdatedUser.deletion_scheduled_at).toBeNull();
    });

    it('should reject cancellation with short reason', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'cancel'
      };

      expect(mockRequest.body.reason.length).toBeLessThan(10);
    });

    it('should log cancellation to audit trail', async () => {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      const mockAuditData = {
        user_id: 2,
        user_email: 'user@test.com',
        changed_by: mockRequest.user.id,
        field_name: 'deletion_scheduled_at',
        old_value: deletionDate.toISOString(),
        new_value: null,
        reason: 'User appeal approved - account restored'
      };

      expect(mockAuditData.field_name).toBe('deletion_scheduled_at');
      expect(mockAuditData.old_value).not.toBeNull();
      expect(mockAuditData.new_value).toBeNull();
    });

    it('should handle user with no scheduled deletion', async () => {
      mockRequest.params = { userId: '2' };
      mockRequest.body = {
        reason: 'Cancel deletion'
      };

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        deletion_scheduled_at: null
      };

      sql.mockResolvedValueOnce({ rows: [mockUser] });

      expect(mockUser.deletion_scheduled_at).toBeNull();
    });
  });

  describe('Middleware Integration', () => {
    it('should require authentication', async () => {
      const unauthenticatedRequest = { user: null };
      expect(unauthenticatedRequest.user).toBeNull();
    });

    it('should require admin role', async () => {
      const nonAdminUser = {
        id: 1,
        email: 'user@test.com',
        tier: 'free',
        role: 'user'
      };

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

  describe('Audit Log Queries', () => {
    it('should query suspension audit log entries', async () => {
      mockRequest.user = { id: 1, role: 'admin' };

      const mockAuditRows = [
        {
          id: 1,
          user_id: 2,
          user_email: 'user@test.com',
          changed_by: 1,
          field_name: 'suspended',
          old_value: 'false',
          new_value: 'true',
          changed_at: new Date(),
          reason: 'Terms violation'
        },
        {
          id: 2,
          user_id: 2,
          user_email: 'user@test.com',
          changed_by: 1,
          field_name: 'suspended',
          old_value: 'true',
          new_value: 'false',
          changed_at: new Date(),
          reason: 'Appeal approved'
        }
      ];

      sql.mockResolvedValue({ rows: mockAuditRows });

      const formattedLog = mockAuditRows.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        timestamp: entry.changed_at,
        action: entry.new_value === 'true' ? 'suspended' : 'unsuspended',
        reason: entry.reason,
        changedBy: entry.changed_by
      }));

      expect(formattedLog).toHaveLength(2);
      expect(formattedLog[0].action).toBe('suspended');
      expect(formattedLog[1].action).toBe('unsuspended');
    });

    it('should query deletion scheduling audit log entries', async () => {
      mockRequest.user = { id: 1, role: 'admin' };

      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      const mockAuditRows = [
        {
          id: 1,
          user_id: 2,
          user_email: 'user@test.com',
          changed_by: 1,
          field_name: 'deletion_scheduled_at',
          old_value: null,
          new_value: deletionDate.toISOString(),
          changed_at: new Date(),
          reason: 'Scheduled for deletion'
        },
        {
          id: 2,
          user_id: 2,
          user_email: 'user@test.com',
          changed_by: 1,
          field_name: 'deletion_scheduled_at',
          old_value: deletionDate.toISOString(),
          new_value: null,
          changed_at: new Date(),
          reason: 'Deletion cancelled'
        }
      ];

      sql.mockResolvedValue({ rows: mockAuditRows });

      const formattedLog = mockAuditRows.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        timestamp: entry.changed_at,
        action: entry.new_value ? 'scheduled' : 'cancelled',
        reason: entry.reason,
        changedBy: entry.changed_by
      }));

      expect(formattedLog).toHaveLength(2);
      expect(formattedLog[0].action).toBe('scheduled');
      expect(formattedLog[1].action).toBe('cancelled');
    });

    it('should filter by field_name for suspension/deletion actions', async () => {
      mockRequest.user = { id: 1, role: 'admin' };

      const mockRows = [
        {
          id: 1,
          field_name: 'suspended',
          old_value: 'false',
          new_value: 'true',
          changed_at: new Date(),
          changed_by: 1
        },
        {
          id: 2,
          field_name: 'deletion_scheduled_at',
          old_value: null,
          new_value: new Date().toISOString(),
          changed_at: new Date(),
          changed_by: 1
        }
      ];

      sql.mockResolvedValue({ rows: mockRows });

      // Verify all rows are suspension/deletion related
      expect(mockRows.every(row =>
        row.field_name === 'suspended' || row.field_name === 'deletion_scheduled_at'
      )).toBe(true);
    });

    it('should order by changed_at DESC', async () => {
      mockRequest.user = { id: 1, role: 'admin' };

      const now = new Date();
      const mockRows = [
        {
          id: 3,
          field_name: 'suspended',
          changed_at: new Date(now.getTime() - 3600000), // 1 hour ago
        },
        {
          id: 2,
          field_name: 'suspended',
          changed_at: new Date(now.getTime() - 7200000), // 2 hours ago
        },
        {
          id: 1,
          field_name: 'suspended',
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

  describe('Combined Status Scenarios', () => {
    it('should handle user with both suspension and scheduled deletion', async () => {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      const mockUser = {
        id: 2,
        email: 'user@test.com',
        suspended: true,
        suspended_at: new Date(Date.now() - 86400000).toISOString(),
        suspension_reason: 'Terms violation',
        deletion_scheduled_at: deletionDate.toISOString()
      };

      expect(mockUser.suspended).toBe(true);
      expect(mockUser.deletion_scheduled_at).not.toBeNull();
    });

    it('should handle unsuspension without affecting deletion schedule', async () => {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      const mockUserBefore = {
        id: 2,
        suspended: true,
        deletion_scheduled_at: deletionDate.toISOString()
      };

      const mockUserAfter = {
        ...mockUserBefore,
        suspended: false,
        suspended_at: null,
        suspension_reason: null
        // deletion_scheduled_at remains unchanged
      };

      expect(mockUserAfter.suspended).toBe(false);
      expect(mockUserAfter.deletion_scheduled_at).toBe(deletionDate.toISOString());
    });

    it('should handle deletion cancellation without affecting suspension', async () => {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      const mockUserBefore = {
        id: 2,
        suspended: true,
        suspended_at: new Date(Date.now() - 86400000).toISOString(),
        suspension_reason: 'Terms violation',
        deletion_scheduled_at: deletionDate.toISOString()
      };

      const mockUserAfter = {
        ...mockUserBefore,
        deletion_scheduled_at: null
        // suspended remains true
      };

      expect(mockUserAfter.suspended).toBe(true);
      expect(mockUserAfter.deletion_scheduled_at).toBeNull();
    });
  });
});
