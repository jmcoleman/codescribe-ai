/**
 * User Model - Deletion & Data Export Tests
 *
 * Tests for Epic 2.5 Phase 4: User Data Rights
 * - Account deletion (soft delete with 30-day grace period)
 * - Account restoration
 * - Permanent deletion
 * - Data export (GDPR/CCPA compliance)
 */

import User from '../User.js';

// Mock @vercel/postgres
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

import { sql } from '@vercel/postgres';

describe('User Model - Deletion & Data Export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleForDeletion', () => {
    it('should schedule account for deletion with 30-day grace period', async () => {
      const userId = 1;
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      sql.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe',
          deletion_scheduled_at: deletionDate.toISOString(),
          restore_token: 'mock-restore-token-abc123'
        }]
      });

      const result = await User.scheduleForDeletion(userId);

      expect(sql).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: userId,
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        deletion_scheduled_at: deletionDate.toISOString(),
        restore_token: 'mock-restore-token-abc123'
      });

      // Verify SQL query structure
      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('UPDATE users');
      expect(sqlCall.join('')).toContain('deletion_scheduled_at');
      expect(sqlCall.join('')).toContain('restore_token');
    });

    it('should include optional deletion reason', async () => {
      const userId = 1;
      const reason = 'Not using the service anymore';

      sql.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe',
          deletion_scheduled_at: new Date().toISOString(),
          restore_token: 'mock-token'
        }]
      });

      await User.scheduleForDeletion(userId, reason);

      expect(sql).toHaveBeenCalledTimes(1);
      const sqlCall = sql.mock.calls[0];

      // Check that reason is included in the SQL call
      expect(sqlCall).toContain(reason);
    });

    it('should throw error if user not found', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      await expect(User.scheduleForDeletion(999))
        .rejects
        .toThrow('User not found or already deleted');
    });

    it('should prevent scheduling deletion for already deleted account', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      await expect(User.scheduleForDeletion(1))
        .rejects
        .toThrow('User not found or already deleted');

      // Verify WHERE clause includes deleted_at IS NULL check
      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('deleted_at IS NULL');
    });

    it('should generate unique restore token', async () => {
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe',
          deletion_scheduled_at: new Date().toISOString(),
          restore_token: 'a'.repeat(64) // crypto.randomBytes(32).toString('hex') = 64 chars
        }]
      });

      const result = await User.scheduleForDeletion(1);

      expect(result.restore_token).toBeDefined();
      expect(typeof result.restore_token).toBe('string');
      expect(result.restore_token.length).toBeGreaterThan(0);
    });
  });

  describe('findByRestoreToken', () => {
    it('should find user by valid restore token', async () => {
      const token = 'valid-restore-token';

      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe',
          deletion_scheduled_at: new Date().toISOString(),
          restore_token: token
        }]
      });

      const result = await User.findByRestoreToken(token);

      expect(sql).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: 1,
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        deletion_scheduled_at: expect.any(String),
        restore_token: token
      });

      // Verify WHERE clause
      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('restore_token');
      expect(sqlCall.join('')).toContain('deletion_scheduled_at IS NOT NULL');
      expect(sqlCall.join('')).toContain('deleted_at IS NULL');
    });

    it('should return null for invalid token', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      const result = await User.findByRestoreToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should not find users without scheduled deletion', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      await User.findByRestoreToken('some-token');

      // Verify query includes deletion_scheduled_at IS NOT NULL
      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('deletion_scheduled_at IS NOT NULL');
    });

    it('should not find already deleted accounts', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      await User.findByRestoreToken('some-token');

      // Verify query includes deleted_at IS NULL
      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('deleted_at IS NULL');
    });
  });

  describe('restoreAccount', () => {
    it('should restore scheduled deletion and clear restore token', async () => {
      const userId = 1;

      sql.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe'
        }]
      });

      const result = await User.restoreAccount(userId);

      expect(sql).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: userId,
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe'
      });

      // Verify SQL sets fields to NULL
      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('deletion_scheduled_at = NULL');
      expect(sqlCall.join('')).toContain('deletion_reason = NULL');
      expect(sqlCall.join('')).toContain('restore_token = NULL');
    });

    it('should throw error if deletion not scheduled', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      await expect(User.restoreAccount(1))
        .rejects
        .toThrow('User not found or deletion not scheduled');
    });

    it('should only restore accounts with scheduled deletion', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      // This should throw because no rows returned
      await expect(User.restoreAccount(1))
        .rejects
        .toThrow('User not found or deletion not scheduled');

      // Verify WHERE clause was still used
      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('deletion_scheduled_at IS NOT NULL');
      expect(sqlCall.join('')).toContain('deleted_at IS NULL');
    });
  });

  describe('findExpiredDeletions', () => {
    it('should find accounts ready for permanent deletion', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      sql.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: 'user1@example.com',
            first_name: 'User',
            last_name: 'One',
            deletion_scheduled_at: expiredDate.toISOString(),
            deletion_reason: 'No longer needed'
          },
          {
            id: 2,
            email: 'user2@example.com',
            first_name: 'User',
            last_name: 'Two',
            deletion_scheduled_at: expiredDate.toISOString(),
            deletion_reason: null
          }
        ]
      });

      const result = await User.findExpiredDeletions();

      expect(sql).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[1].email).toBe('user2@example.com');

      // Verify query filters by deletion_scheduled_at <= NOW()
      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('deletion_scheduled_at <= NOW()');
      expect(sqlCall.join('')).toContain('deleted_at IS NULL');
    });

    it('should return empty array if no expired deletions', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      const result = await User.findExpiredDeletions();

      expect(result).toEqual([]);
    });

    it('should order by deletion_scheduled_at ASC', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      await User.findExpiredDeletions();

      const sqlCall = sql.mock.calls[0][0];
      expect(sqlCall.join('')).toContain('ORDER BY deletion_scheduled_at ASC');
    });
  });

  describe('permanentlyDelete', () => {
    it('should use tombstone approach: aggregate usage, delete quotas, NULL PII', async () => {
      const userId = 1;

      // First query: Delete user sessions
      sql.mockResolvedValueOnce({ rowCount: 1 });

      // Second query: Aggregate usage data
      sql.mockResolvedValueOnce({ rowCount: 1 });

      // Third query: Delete user_quotas
      sql.mockResolvedValueOnce({ rowCount: 2 });

      // Fourth query: Tombstone user (NULL PII, keep IDs)
      sql.mockResolvedValueOnce({
        rows: [{
          id: userId,
          stripe_customer_id: 'cus_123',
          tier: 'pro',
          created_at: new Date().toISOString()
        }]
      });

      const result = await User.permanentlyDelete(userId);

      expect(sql).toHaveBeenCalledTimes(4);
      expect(result.id).toBe(userId);
      expect(result.stripe_customer_id).toBe('cus_123');
      expect(result.tier).toBe('pro');

      // Verify first query deletes sessions
      const firstCall = sql.mock.calls[0][0];
      expect(firstCall.join('')).toContain('DELETE FROM session');

      // Verify second query aggregates to usage_analytics_aggregate
      const secondCall = sql.mock.calls[1][0];
      expect(secondCall.join('')).toContain('INSERT INTO usage_analytics_aggregate');
      expect(secondCall.join('')).toContain('account_age_days');
      expect(secondCall.join('')).toContain('total_monthly_count');

      // Verify third query deletes user_quotas
      const thirdCall = sql.mock.calls[2][0];
      expect(thirdCall.join('')).toContain('DELETE FROM user_quotas');

      // Verify fourth query tombstones user (NULLs PII but preserves IDs)
      const fourthCall = sql.mock.calls[3][0];
      expect(fourthCall.join('')).toContain('email = NULL');
      expect(fourthCall.join('')).toContain('first_name = NULL');
      expect(fourthCall.join('')).toContain('password_hash = NULL');
      expect(fourthCall.join('')).toContain('deleted_at = NOW()');
      // User row NOT deleted - tombstone approach
      expect(fourthCall.join('')).not.toContain('DELETE FROM users');
    });

    it('should throw error if user not found', async () => {
      // Mock all four queries
      sql.mockResolvedValueOnce({ rowCount: 0 }); // Delete sessions
      sql.mockResolvedValueOnce({ rowCount: 0 }); // Aggregate usage
      sql.mockResolvedValueOnce({ rowCount: 0 }); // Delete quotas
      sql.mockResolvedValueOnce({ rows: [] }); // Tombstone returns no rows

      await expect(User.permanentlyDelete(999))
        .rejects
        .toThrow('User not found or already deleted');
    });

    it('should only delete accounts not already deleted', async () => {
      // Mock all four queries
      sql.mockResolvedValueOnce({ rowCount: 0 }); // Delete sessions
      sql.mockResolvedValueOnce({ rowCount: 0 }); // Aggregate usage
      sql.mockResolvedValueOnce({ rowCount: 0 }); // Delete quotas
      sql.mockResolvedValueOnce({ rows: [] }); // Tombstone returns no rows (user already deleted)

      // This should throw because no rows returned
      await expect(User.permanentlyDelete(1))
        .rejects
        .toThrow('User not found or already deleted');

      // Verify WHERE clause checks deleted_at IS NULL (index 3 = fourth query)
      const tombstoneCall = sql.mock.calls[3][0];
      expect(tombstoneCall.join('')).toContain('deleted_at IS NULL');
    });

    it('should preserve stripe_customer_id for billing dispute resolution', async () => {
      const userId = 1;

      // Mock all four queries
      sql.mockResolvedValueOnce({ rowCount: 1 }); // Delete sessions
      sql.mockResolvedValueOnce({ rowCount: 1 }); // Aggregate
      sql.mockResolvedValueOnce({ rowCount: 2 }); // Delete quotas
      sql.mockResolvedValueOnce({
        rows: [{
          id: userId,
          stripe_customer_id: 'cus_stripe_billing_123',
          tier: 'enterprise',
          created_at: new Date().toISOString()
        }]
      });

      const result = await User.permanentlyDelete(userId);

      // Stripe customer ID preserved for billing disputes
      expect(result.stripe_customer_id).toBe('cus_stripe_billing_123');

      // Verify RETURNING clause includes stripe_customer_id (index 3 = fourth query)
      const tombstoneCall = sql.mock.calls[3][0];
      expect(tombstoneCall.join('')).toContain('RETURNING id, stripe_customer_id, tier, created_at');
    });
  });

  describe('exportUserData', () => {
    it('should export complete user data in GDPR-compliant format', async () => {
      const userId = 1;

      // Mock user profile query
      sql.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe',
          github_id: null,
          tier: 'pro',
          tier_updated_at: new Date().toISOString(),
          stripe_customer_id: 'cus_123',
          customer_created_via: 'app',
          email_verified: true,
          verification_token_expires: null,
          terms_accepted_at: new Date().toISOString(),
          terms_version_accepted: '1.0',
          privacy_accepted_at: new Date().toISOString(),
          privacy_version_accepted: '1.0',
          analytics_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deletion_scheduled_at: null,
          deletion_reason: null
        }]
      });

      // Mock usage quotas query
      sql.mockResolvedValueOnce({
        rows: [{
          period_start_date: '2025-11-01',
          daily_count: 5,
          monthly_count: 15,
          last_reset_date: new Date().toISOString()
        }]
      });

      // Mock subscriptions query
      sql.mockResolvedValueOnce({
        rows: [{
          subscription_id: 'sub_123',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date().toISOString(),
          cancel_at_period_end: false,
          canceled_at: null
        }]
      });

      const result = await User.exportUserData(userId);

      expect(sql).toHaveBeenCalledTimes(3); // user, quotas, subscriptions (no anonymous)
      expect(result).toMatchObject({
        export_date: expect.any(String),
        export_version: '1.0',
        user_profile: {
          id: userId,
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe',
          github_connected: false,
          tier: 'pro',
          email_verified: true,
          analytics_enabled: true
        },
        usage_history: expect.any(Array),
        subscriptions: expect.any(Array),
        data_retention_policy: expect.objectContaining({
          code_processing: expect.any(String),
          deletion_grace_period: '30 days'
        })
      });
    });

    it('should include GitHub connection status', async () => {
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe',
          github_id: 'github_12345', // Has GitHub
          tier: 'free',
          stripe_customer_id: null,
          customer_created_via: null,
          email_verified: true,
          tier_updated_at: null,
          verification_token_expires: null,
          terms_accepted_at: null,
          terms_version_accepted: null,
          privacy_accepted_at: null,
          privacy_version_accepted: null,
          analytics_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deletion_scheduled_at: null,
          deletion_reason: null
        }]
      });
      sql.mockResolvedValueOnce({ rows: [] }); // quotas
      sql.mockResolvedValueOnce({ rows: [] }); // subscriptions

      const result = await User.exportUserData(1);

      expect(result.user_profile.github_connected).toBe(true);
    });

    it('should include usage history', async () => {
      sql.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'user@example.com', first_name: null, last_name: null, github_id: null, tier: 'free', stripe_customer_id: null, customer_created_via: null, email_verified: false, tier_updated_at: null, verification_token_expires: null, terms_accepted_at: null, terms_version_accepted: null, privacy_accepted_at: null, privacy_version_accepted: null, analytics_enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deletion_scheduled_at: null, deletion_reason: null }]
      });

      sql.mockResolvedValueOnce({
        rows: [
          { period_start_date: '2025-11-01', daily_count: 3, monthly_count: 10, last_reset_date: '2025-11-04' },
          { period_start_date: '2025-10-01', daily_count: 0, monthly_count: 8, last_reset_date: '2025-10-31' }
        ]
      });

      sql.mockResolvedValueOnce({ rows: [] }); // subscriptions

      const result = await User.exportUserData(1);

      expect(result.usage_history).toHaveLength(2);
      expect(result.usage_history[0]).toMatchObject({
        period_start_date: '2025-11-01',
        daily_count: 3,
        monthly_count: 10
      });
    });

    it('should throw error if user not found', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      await expect(User.exportUserData(999))
        .rejects
        .toThrow('User not found');
    });

    it('should include data retention policy', async () => {
      sql.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'user@example.com', first_name: null, last_name: null, github_id: null, tier: 'free', stripe_customer_id: null, customer_created_via: null, email_verified: false, tier_updated_at: null, verification_token_expires: null, terms_accepted_at: null, terms_version_accepted: null, privacy_accepted_at: null, privacy_version_accepted: null, analytics_enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deletion_scheduled_at: null, deletion_reason: null }]
      });
      sql.mockResolvedValueOnce({ rows: [] }); // quotas
      sql.mockResolvedValueOnce({ rows: [] }); // subscriptions

      const result = await User.exportUserData(1);

      expect(result.data_retention_policy).toEqual({
        code_processing: 'Code is processed in memory only and never stored',
        generated_documentation: 'Not stored on our servers',
        account_data: 'Retained until account deletion',
        usage_logs: 'Retained for billing and analytics purposes',
        deletion_grace_period: '30 days'
      });
    });
  });
});
