/**
 * Unit tests for Usage model
 * Tests usage tracking, quota management, and anonymous user migration
 */

import Usage from '../Usage.js';

// Mock @vercel/postgres
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

import { sql } from '@vercel/postgres';

const describeOrSkip = skipIfNoDb();

describeOrSkip('Usage Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserUsage', () => {
    it('should return usage for authenticated user', async () => {
      const mockUsage = {
        user_id: 1,
        daily_count: 5,
        monthly_count: 25,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1), // Oct 1, 2025
      };

      sql.mockResolvedValue({ rows: [mockUsage] });

      const usage = await Usage.getUserUsage(1);

      expect(usage.dailyGenerations).toBe(5);
      expect(usage.monthlyGenerations).toBe(25);
      expect(usage.resetDate).toBeInstanceOf(Date);
      expect(usage.periodStart).toBeInstanceOf(Date);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return usage for anonymous user by IP', async () => {
      const mockUsage = {
        ip_address: '192.168.1.1',
        daily_count: 3,
        monthly_count: 10,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockUsage] });

      const usage = await Usage.getUserUsage('ip:192.168.1.1');

      expect(usage.dailyGenerations).toBe(3);
      expect(usage.monthlyGenerations).toBe(10);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return zeroed stats if no usage record exists', async () => {
      sql.mockResolvedValue({ rows: [] });

      const usage = await Usage.getUserUsage(999);

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(0);
      expect(usage.resetDate).toBeInstanceOf(Date);
      expect(usage.periodStart).toBeInstanceOf(Date);
    });

    it('should trigger daily reset if needed', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockUsage = {
        user_id: 1,
        daily_count: 10,
        monthly_count: 50,
        last_reset_date: yesterday,
        period_start_date: new Date(2025, 9, 1),
      };

      // First call: get usage (needs reset)
      // Second call: reset daily usage
      sql
        .mockResolvedValueOnce({ rows: [mockUsage] })
        .mockResolvedValueOnce({
          rows: [{
            user_id: 1,
            daily_count: 0,
            monthly_count: 50,
            last_reset_date: new Date(),
            period_start_date: new Date(2025, 9, 1),
          }]
        });

      const usage = await Usage.getUserUsage(1);

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(50);
      expect(sql).toHaveBeenCalledTimes(2);
    });
  });

  describe('incrementUsage', () => {
    it('should create new usage record for authenticated user', async () => {
      const mockResult = {
        user_id: 1,
        daily_count: 1,
        monthly_count: 1,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockResult] });

      const usage = await Usage.incrementUsage(1);

      expect(usage.dailyGenerations).toBe(1);
      expect(usage.monthlyGenerations).toBe(1);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should increment existing usage record', async () => {
      const mockResult = {
        user_id: 1,
        daily_count: 6,
        monthly_count: 26,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockResult] });

      const usage = await Usage.incrementUsage(1);

      expect(usage.dailyGenerations).toBe(6);
      expect(usage.monthlyGenerations).toBe(26);
    });

    it('should increment usage for anonymous user by IP', async () => {
      const mockResult = {
        ip_address: '192.168.1.1',
        daily_count: 1,
        monthly_count: 1,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockResult] });

      const usage = await Usage.incrementUsage('ip:192.168.1.1');

      expect(usage.dailyGenerations).toBe(1);
      expect(usage.monthlyGenerations).toBe(1);
    });

    it('should support custom increment count', async () => {
      const mockResult = {
        user_id: 1,
        daily_count: 5,
        monthly_count: 5,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockResult] });

      const usage = await Usage.incrementUsage(1, 5);

      expect(usage.dailyGenerations).toBe(5);
      expect(usage.monthlyGenerations).toBe(5);
    });
  });

  describe('resetDailyUsage', () => {
    it('should reset daily counter for authenticated user', async () => {
      const mockResult = {
        user_id: 1,
        daily_count: 0,
        monthly_count: 50,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockResult] });

      const usage = await Usage.resetDailyUsage(1);

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(50);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should reset daily counter for anonymous user', async () => {
      const mockResult = {
        ip_address: '192.168.1.1',
        daily_count: 0,
        monthly_count: 20,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockResult] });

      const usage = await Usage.resetDailyUsage('ip:192.168.1.1');

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(20);
    });

    it('should return zeroed stats if no record exists', async () => {
      sql.mockResolvedValue({ rows: [] });

      const usage = await Usage.resetDailyUsage(999);

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(0);
    });
  });

  describe('resetMonthlyUsage', () => {
    it('should reset monthly counter for authenticated user', async () => {
      const mockResult = {
        user_id: 1,
        daily_count: 0,
        monthly_count: 0,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 10, 1), // Nov 1, 2025
      };

      sql.mockResolvedValue({ rows: [mockResult] });

      const usage = await Usage.resetMonthlyUsage(1);

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(0);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should reset monthly counter for anonymous user', async () => {
      const mockResult = {
        ip_address: '192.168.1.1',
        daily_count: 0,
        monthly_count: 0,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 10, 1),
      };

      sql.mockResolvedValue({ rows: [mockResult] });

      const usage = await Usage.resetMonthlyUsage('ip:192.168.1.1');

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(0);
    });
  });

  describe('getUsageHistory', () => {
    it('should return usage history for date range', async () => {
      const mockHistory = [
        {
          user_id: 1,
          daily_count: 10,
          monthly_count: 100,
          last_reset_date: new Date('2025-10-15'),
          period_start_date: new Date('2025-10-01'),
          created_at: new Date('2025-10-01'),
          updated_at: new Date('2025-10-15'),
        },
        {
          user_id: 1,
          daily_count: 8,
          monthly_count: 95,
          last_reset_date: new Date('2025-09-30'),
          period_start_date: new Date('2025-09-01'),
          created_at: new Date('2025-09-01'),
          updated_at: new Date('2025-09-30'),
        },
      ];

      sql.mockResolvedValue({ rows: mockHistory });

      const history = await Usage.getUsageHistory(
        1,
        new Date('2025-09-01'),
        new Date('2025-10-31')
      );

      expect(history).toHaveLength(2);
      expect(history[0].dailyGenerations).toBe(10);
      expect(history[1].monthlyGenerations).toBe(95);
    });

    it('should return empty array if no history exists', async () => {
      sql.mockResolvedValue({ rows: [] });

      const history = await Usage.getUsageHistory(
        999,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );

      expect(history).toEqual([]);
    });
  });

  describe('deleteUserUsage', () => {
    it('should delete all usage records for a user', async () => {
      sql.mockResolvedValue({ rowCount: 3 });

      const result = await Usage.deleteUserUsage(1);

      expect(result).toBe(true);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return false if no records deleted', async () => {
      sql.mockResolvedValue({ rowCount: 0 });

      const result = await Usage.deleteUserUsage(999);

      expect(result).toBe(false);
    });
  });

  describe('getSystemUsageStats', () => {
    it('should return system-wide statistics', async () => {
      const mockStats = {
        total_users: '150',
        total_daily_generations: '1200',
        total_monthly_generations: '35000',
        avg_daily_per_user: '8.5',
        avg_monthly_per_user: '233.33',
      };

      sql.mockResolvedValue({ rows: [mockStats] });

      const stats = await Usage.getSystemUsageStats();

      expect(stats.totalUsers).toBe(150);
      expect(stats.totalDailyGenerations).toBe(1200);
      expect(stats.totalMonthlyGenerations).toBe(35000);
      expect(stats.avgDailyPerUser).toBe(8.5);
      expect(stats.avgMonthlyPerUser).toBe(233.33);
    });

    it('should handle null values in statistics', async () => {
      const mockStats = {
        total_users: null,
        total_daily_generations: null,
        total_monthly_generations: null,
        avg_daily_per_user: null,
        avg_monthly_per_user: null,
      };

      sql.mockResolvedValue({ rows: [mockStats] });

      const stats = await Usage.getSystemUsageStats();

      expect(stats.totalUsers).toBe(0);
      expect(stats.totalDailyGenerations).toBe(0);
      expect(stats.totalMonthlyGenerations).toBe(0);
      expect(stats.avgDailyPerUser).toBe(0);
      expect(stats.avgMonthlyPerUser).toBe(0);
    });
  });

  describe('migrateAnonymousUsage', () => {
    it('should migrate anonymous usage to user account', async () => {
      const mockAnonymousUsage = {
        daily_count: 5,
        monthly_count: 15,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      const mockMergedUsage = {
        user_id: 1,
        daily_count: 5,
        monthly_count: 15,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      // First call: get anonymous usage
      // Second call: merge into user_quotas
      // Third call: delete anonymous record
      sql
        .mockResolvedValueOnce({ rows: [mockAnonymousUsage] })
        .mockResolvedValueOnce({ rows: [mockMergedUsage] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await Usage.migrateAnonymousUsage('192.168.1.1', 1);

      expect(result.migrated).toBe(true);
      expect(result.message).toBe('Anonymous usage migrated successfully');
      expect(result.usage.dailyGenerations).toBe(5);
      expect(result.usage.monthlyGenerations).toBe(15);
      expect(sql).toHaveBeenCalledTimes(3);
    });

    it('should merge anonymous usage with existing user usage', async () => {
      const mockAnonymousUsage = {
        daily_count: 3,
        monthly_count: 8,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      const mockMergedUsage = {
        user_id: 1,
        daily_count: 10, // 7 (existing) + 3 (anonymous)
        monthly_count: 25, // 17 (existing) + 8 (anonymous)
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql
        .mockResolvedValueOnce({ rows: [mockAnonymousUsage] })
        .mockResolvedValueOnce({ rows: [mockMergedUsage] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await Usage.migrateAnonymousUsage('192.168.1.1', 1);

      expect(result.usage.dailyGenerations).toBe(10);
      expect(result.usage.monthlyGenerations).toBe(25);
    });

    it('should return false if no anonymous usage exists', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await Usage.migrateAnonymousUsage('192.168.1.1', 1);

      expect(result.migrated).toBe(false);
      expect(result.message).toBe('No anonymous usage found for this IP');
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should preserve the most recent last_reset_date during migration', async () => {
      // Scenario: Anonymous user has newer last_reset_date (today)
      // than existing authenticated user's last_reset_date (3 days ago)
      // Migration should preserve the newer date to prevent incorrect daily resets
      const today = new Date();

      const mockAnonymousUsage = {
        daily_count: 1,
        monthly_count: 1,
        last_reset_date: today, // Newer reset date from anonymous user
        period_start_date: new Date(2025, 10, 1),
      };

      const mockMergedUsage = {
        user_id: 1,
        daily_count: 10, // 9 (existing) + 1 (anonymous)
        monthly_count: 10, // 9 (existing) + 1 (anonymous)
        last_reset_date: today, // Should preserve the newer date via GREATEST()
        period_start_date: new Date(2025, 10, 1),
      };

      sql
        .mockResolvedValueOnce({ rows: [mockAnonymousUsage] })
        .mockResolvedValueOnce({ rows: [mockMergedUsage] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await Usage.migrateAnonymousUsage('192.168.1.1', 1);

      expect(result.migrated).toBe(true);
      expect(result.usage.dailyGenerations).toBe(10);
      expect(result.usage.monthlyGenerations).toBe(10);

      // Verify that migration was called with correct parameters
      expect(sql).toHaveBeenCalledTimes(3); // Get anonymous, merge, delete
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      sql.mockRejectedValue(new Error('Database connection failed'));

      await expect(Usage.getUserUsage(1)).rejects.toThrow('Database connection failed');
    });

    it('should handle IPv6 addresses', async () => {
      const mockUsage = {
        ip_address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        daily_count: 2,
        monthly_count: 5,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockUsage] });

      const usage = await Usage.getUserUsage('ip:2001:0db8:85a3:0000:0000:8a2e:0370:7334');

      expect(usage.dailyGenerations).toBe(2);
      expect(usage.monthlyGenerations).toBe(5);
    });

    it('should handle zero usage counts', async () => {
      const mockUsage = {
        user_id: 1,
        daily_count: 0,
        monthly_count: 0,
        last_reset_date: new Date(),
        period_start_date: new Date(2025, 9, 1),
      };

      sql.mockResolvedValue({ rows: [mockUsage] });

      const usage = await Usage.getUserUsage(1);

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should support full user lifecycle from anonymous to authenticated', async () => {
      const ipAddress = '192.168.1.100';
      const userId = 1;

      // Step 1: Anonymous user makes generations
      sql.mockResolvedValueOnce({
        rows: [{
          ip_address: ipAddress,
          daily_count: 3,
          monthly_count: 3,
          last_reset_date: new Date(),
          period_start_date: new Date(2025, 9, 1),
        }]
      });
      await Usage.incrementUsage(`ip:${ipAddress}`);

      // Step 2: User signs up, migrate anonymous usage
      sql
        .mockResolvedValueOnce({ rows: [{ daily_count: 3, monthly_count: 3 }] }) // Get anonymous
        .mockResolvedValueOnce({ rows: [{ user_id: userId, daily_count: 3, monthly_count: 3 }] }) // Merge
        .mockResolvedValueOnce({ rowCount: 1 }); // Delete anonymous
      const migrationResult = await Usage.migrateAnonymousUsage(ipAddress, userId);

      expect(migrationResult.migrated).toBe(true);

      // Step 3: User continues making generations as authenticated user
      sql.mockResolvedValueOnce({
        rows: [{
          user_id: userId,
          daily_count: 4,
          monthly_count: 4,
          last_reset_date: new Date(),
          period_start_date: new Date(2025, 9, 1),
        }]
      });
      await Usage.incrementUsage(userId);
    });

    it('should handle daily reset at midnight', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Day 1: User makes 10 generations
      sql.mockResolvedValueOnce({
        rows: [{
          user_id: 1,
          daily_count: 10,
          monthly_count: 10,
          last_reset_date: yesterday,
          period_start_date: new Date(2025, 9, 1),
        }]
      });

      // Day 2: Check usage (should trigger reset)
      sql
        .mockResolvedValueOnce({ rows: [{ daily_count: 10, monthly_count: 10, last_reset_date: yesterday }] })
        .mockResolvedValueOnce({ rows: [{ daily_count: 0, monthly_count: 10 }] });

      const usage = await Usage.getUserUsage(1);

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(10);
    });

    it('should handle monthly reset at month start', async () => {
      const userId = 1;

      // November: Reset monthly counter (creates new record for new period)
      sql.mockResolvedValue({
        rows: [{
          user_id: userId,
          daily_count: 0,
          monthly_count: 0,
          last_reset_date: new Date(2025, 10, 1),
          period_start_date: new Date(2025, 10, 1),
        }]
      });

      const usage = await Usage.resetMonthlyUsage(userId);

      expect(usage.dailyGenerations).toBe(0);
      expect(usage.monthlyGenerations).toBe(0);
    });
  });
});
