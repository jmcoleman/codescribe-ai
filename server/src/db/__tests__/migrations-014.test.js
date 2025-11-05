/**
 * Migration 014 Test: Usage Analytics Aggregate Table
 *
 * Tests the creation of usage_analytics_aggregate table for anonymized analytics
 * This allows business intelligence after user deletion while respecting GDPR data minimization
 * Run in Docker sandbox: npm run test:db -- migrations-014
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import pg from 'pg';

const { Pool } = pg;

// Docker test database connection
const pool = new Pool({
  host: 'localhost',
  port: 5433, // Docker test DB port
  database: 'codescribe_test',
  user: 'test_user',
  password: 'test_password',
});

describe('Migration 014: Usage Analytics Aggregate Table', () => {
  let client;

  beforeAll(async () => {
    client = await pool.connect();
  });

  afterAll(async () => {
    // Clean up test data
    await client.query("DELETE FROM usage_analytics_aggregate WHERE tier LIKE 'test_%'");

    if (client) {
      client.release();
    }
    await pool.end();
  });

  describe('Schema Validation', () => {
    it('should have created usage_analytics_aggregate table', async () => {
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'usage_analytics_aggregate'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should have all required columns with correct types', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'usage_analytics_aggregate'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.reduce((acc, row) => {
        acc[row.column_name] = {
          type: row.data_type,
          nullable: row.is_nullable === 'YES'
        };
        return acc;
      }, {});

      // Verify all expected columns exist with correct types
      expect(columns.id).toEqual({ type: 'integer', nullable: false });
      expect(columns.deleted_date).toEqual({ type: 'timestamp without time zone', nullable: false });
      expect(columns.tier).toEqual({ type: 'character varying', nullable: false });
      expect(columns.account_age_days).toEqual({ type: 'integer', nullable: true });
      expect(columns.created_at_month).toEqual({ type: 'date', nullable: true });
      expect(columns.total_daily_count).toEqual({ type: 'integer', nullable: true });
      expect(columns.total_monthly_count).toEqual({ type: 'integer', nullable: true });
      expect(columns.avg_daily_count).toEqual({ type: 'numeric', nullable: true });
      expect(columns.avg_monthly_count).toEqual({ type: 'numeric', nullable: true });
      expect(columns.usage_periods_count).toEqual({ type: 'integer', nullable: true });
      expect(columns.created_at).toEqual({ type: 'timestamp without time zone', nullable: true });
    });

    it('should have required indexes for analytics queries', async () => {
      const result = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'usage_analytics_aggregate'
        ORDER BY indexname
      `);

      const indexes = result.rows.map(r => r.indexname);

      expect(indexes).toContain('idx_usage_analytics_deleted_date');
      expect(indexes).toContain('idx_usage_analytics_tier');
      expect(indexes).toContain('idx_usage_analytics_created_month');
      expect(indexes).toContain('idx_usage_analytics_tier_month');
    });

    it('should have table and column comments for documentation', async () => {
      // Check table comment
      const tableComment = await client.query(`
        SELECT obj_description('usage_analytics_aggregate'::regclass) as comment
      `);
      expect(tableComment.rows[0].comment).toContain('Anonymized aggregated usage data');
      expect(tableComment.rows[0].comment).toContain('GDPR compliant');

      // Check tier column comment (column 3, not 2 - id is 1, deleted_date is 2, tier is 3)
      const columnComment = await client.query(`
        SELECT col_description('usage_analytics_aggregate'::regclass, 3) as comment
      `);
      expect(columnComment.rows[0].comment).toContain('User tier at time of deletion');
    });
  });

  describe('Data Insertion & Aggregation', () => {
    it('should allow inserting anonymized aggregated data', async () => {
      const result = await client.query(`
        INSERT INTO usage_analytics_aggregate (
          tier,
          account_age_days,
          created_at_month,
          total_daily_count,
          total_monthly_count,
          avg_daily_count,
          avg_monthly_count,
          usage_periods_count
        )
        VALUES (
          'test_pro',
          365,
          '2024-01-01',
          100,
          3000,
          3.33,
          100.00,
          30
        )
        RETURNING id, tier, account_age_days
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tier).toBe('test_pro');
      expect(result.rows[0].account_age_days).toBe(365);
    });

    it('should set default values for counts', async () => {
      const result = await client.query(`
        INSERT INTO usage_analytics_aggregate (tier, account_age_days, created_at_month)
        VALUES ('test_free', 30, '2024-10-01')
        RETURNING total_daily_count, total_monthly_count, usage_periods_count
      `);

      expect(result.rows[0].total_daily_count).toBe(0);
      expect(result.rows[0].total_monthly_count).toBe(0);
      expect(result.rows[0].usage_periods_count).toBe(0);
    });

    it('should support querying by tier for business analytics', async () => {
      // Insert multiple records for different tiers
      await client.query(`
        INSERT INTO usage_analytics_aggregate (tier, account_age_days, created_at_month, total_monthly_count)
        VALUES
          ('test_starter', 90, '2024-08-01', 500),
          ('test_starter', 120, '2024-09-01', 800),
          ('test_enterprise', 180, '2024-07-01', 5000)
      `);

      // Query aggregated data by tier
      const result = await client.query(`
        SELECT tier, COUNT(*) as user_count, AVG(total_monthly_count) as avg_usage
        FROM usage_analytics_aggregate
        WHERE tier LIKE 'test_%'
        GROUP BY tier
        ORDER BY tier
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(3);

      const starter = result.rows.find(r => r.tier === 'test_starter');
      expect(parseInt(starter.user_count)).toBe(2);
      expect(parseFloat(starter.avg_usage)).toBe(650); // (500 + 800) / 2
    });

    it('should support cohort analysis by created_at_month', async () => {
      await client.query(`
        INSERT INTO usage_analytics_aggregate (tier, created_at_month, total_monthly_count)
        VALUES
          ('test_cohort', '2024-01-01', 100),
          ('test_cohort', '2024-01-01', 150),
          ('test_cohort', '2024-02-01', 200)
      `);

      const result = await client.query(`
        SELECT created_at_month, COUNT(*) as cohort_size, SUM(total_monthly_count) as cohort_usage
        FROM usage_analytics_aggregate
        WHERE tier = 'test_cohort'
        GROUP BY created_at_month
        ORDER BY created_at_month
      `);

      expect(result.rows.length).toBe(2);
      expect(result.rows[0].cohort_size).toBe('2');
      expect(parseInt(result.rows[0].cohort_usage)).toBe(250); // 100 + 150
      expect(parseInt(result.rows[1].cohort_usage)).toBe(200);
    });
  });

  describe('GDPR Compliance - Data Minimization', () => {
    it('should contain no PII - only aggregated metrics', async () => {
      // Verify table has no PII columns
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'usage_analytics_aggregate'
      `);

      const columns = result.rows.map(r => r.column_name);

      // No PII columns
      expect(columns).not.toContain('email');
      expect(columns).not.toContain('first_name');
      expect(columns).not.toContain('last_name');
      expect(columns).not.toContain('user_id');
      expect(columns).not.toContain('password_hash');

      // Only anonymized characteristics
      expect(columns).toContain('tier');
      expect(columns).toContain('account_age_days');
      expect(columns).toContain('created_at_month');
      expect(columns).toContain('total_monthly_count');
    });

    it('should allow business intelligence without privacy violations', async () => {
      // Scenario: Analyze usage patterns without knowing who the users are
      await client.query(`
        INSERT INTO usage_analytics_aggregate (
          tier, account_age_days, created_at_month,
          total_monthly_count, avg_monthly_count, usage_periods_count
        )
        VALUES
          ('test_gdpr_pro', 365, '2023-10-01', 10000, 333.33, 30),
          ('test_gdpr_pro', 400, '2023-09-01', 12000, 400.00, 30),
          ('test_gdpr_free', 90, '2024-08-01', 100, 3.33, 30)
      `);

      // Business question: What's average usage for pro users aged 1+ year?
      const result = await client.query(`
        SELECT
          tier,
          COUNT(*) as user_count,
          AVG(avg_monthly_count) as avg_monthly_usage,
          AVG(account_age_days) as avg_account_age
        FROM usage_analytics_aggregate
        WHERE tier LIKE 'test_gdpr_%'
          AND account_age_days >= 365
        GROUP BY tier
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].tier).toBe('test_gdpr_pro');
      expect(parseInt(result.rows[0].user_count)).toBe(2);

      // Can answer business questions without knowing user identities
      // This is GDPR-compliant analytics (Article 5: data minimization)
    });
  });

  describe('Integration with User Deletion Flow', () => {
    it('should simulate aggregate-then-delete pattern from User.permanentlyDelete()', async () => {
      // Simulate user with quotas (use valid tier: 'pro')
      const testUser = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, tier)
        VALUES ('test-agg@example.com', 'Test', 'User', 'hash123', 'pro')
        RETURNING id, tier, created_at
      `);

      const userId = testUser.rows[0].id;

      // Create some user_quotas records
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES
          (${userId}, 5, 100, '2024-10-01'),
          (${userId}, 3, 80, '2024-11-01')
      `);

      // Step 1: Aggregate usage data (what User.permanentlyDelete() does)
      await client.query(`
        INSERT INTO usage_analytics_aggregate (
          tier, account_age_days, created_at_month,
          total_daily_count, total_monthly_count,
          avg_daily_count, avg_monthly_count, usage_periods_count
        )
        SELECT
          u.tier,
          EXTRACT(DAY FROM NOW() - u.created_at)::INTEGER,
          DATE_TRUNC('month', u.created_at)::DATE,
          COALESCE(SUM(uq.daily_count), 0),
          COALESCE(SUM(uq.monthly_count), 0),
          COALESCE(AVG(uq.daily_count), 0),
          COALESCE(AVG(uq.monthly_count), 0),
          COUNT(uq.id)
        FROM users u
        LEFT JOIN user_quotas uq ON uq.user_id = u.id
        WHERE u.id = ${userId}
        GROUP BY u.tier, u.created_at
      `);

      // Step 2: Delete granular usage data
      await client.query(`DELETE FROM user_quotas WHERE user_id = ${userId}`);

      // Step 3: Verify aggregated data was preserved
      const analytics = await client.query(`
        SELECT tier, total_daily_count, total_monthly_count, usage_periods_count
        FROM usage_analytics_aggregate
        WHERE tier = 'pro'
          AND deleted_date::date = CURRENT_DATE
      `);

      expect(analytics.rows.length).toBe(1);
      expect(analytics.rows[0].total_daily_count).toBe(8); // 5 + 3
      expect(analytics.rows[0].total_monthly_count).toBe(180); // 100 + 80
      expect(analytics.rows[0].usage_periods_count).toBe(2);

      // Step 4: Verify granular data was deleted
      const quotas = await client.query(`
        SELECT * FROM user_quotas WHERE user_id = ${userId}
      `);

      expect(quotas.rows.length).toBe(0);

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = ${userId}`);
    });
  });
});
