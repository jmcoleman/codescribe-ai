/**
 * Migration 055 Test: Add campaign eligibility settings
 * Tests schema changes for flexible trial eligibility rules
 * Run in Docker sandbox: npm run test:db -- migrations-055
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
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

describe('Migration 055: Add campaign eligibility settings', () => {
  let client;
  let testUserId;
  let testCampaignId;

  beforeAll(async () => {
    client = await pool.connect();

    // Create test user
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
      VALUES ('migration055@test.com', 'Migration', 'Test', 'hash', true)
      RETURNING id
    `);
    testUserId = userResult.rows[0].id;

    // Create test campaign
    const campaignResult = await client.query(`
      INSERT INTO trial_programs (
        name, trial_tier, trial_days,
        is_active, starts_at, ends_at, created_by_user_id
      ) VALUES (
        'Test Trial Program', 'pro', 14,
        true, NOW(), NOW() + INTERVAL '30 days', $1
      ) RETURNING id
    `, [testUserId]);
    testCampaignId = campaignResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await client.query(`DELETE FROM trial_programs WHERE id = $1`, [testCampaignId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [testUserId]);

    if (client) {
      client.release();
    }
    await pool.end();
  });

  describe('Column Structure', () => {
    test('should have allow_previous_trial_users column', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'allow_previous_trial_users'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toBe('boolean');
      expect(result.rows[0].column_default).toBe('false');
      expect(result.rows[0].is_nullable).toBe('YES');
    });

    test('should have cooldown_days column', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'cooldown_days'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toBe('integer');
      expect(result.rows[0].column_default).toBe('0');
      expect(result.rows[0].is_nullable).toBe('YES');
    });

    test('should have max_trials_per_user column', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'max_trials_per_user'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toBe('integer');
      expect(result.rows[0].column_default).toBe('1');
      expect(result.rows[0].is_nullable).toBe('YES');
    });
  });

  describe('Check Constraints', () => {
    test('should enforce cooldown_days range (0-365)', async () => {
      // Valid cooldown_days should work
      await expect(
        client.query(`
          INSERT INTO trial_programs (
            name, trial_tier, trial_days,
            is_active, starts_at, ends_at, created_by_user_id,
            allow_previous_trial_users, cooldown_days
          ) VALUES (
            'Valid Cooldown', 'pro', 14,
            true, NOW(), NOW() + INTERVAL '30 days', $1,
            true, 90
          )
        `, [testUserId])
      ).resolves.toBeDefined();

      // Cleanup
      await client.query(`DELETE FROM trial_programs WHERE name = 'Valid Cooldown'`);

      // Negative cooldown_days should fail
      await expect(
        client.query(`
          INSERT INTO trial_programs (
            name, trial_tier, trial_days,
            is_active, starts_at, ends_at, created_by_user_id,
            cooldown_days
          ) VALUES (
            'Invalid Cooldown 1', 'pro', 14,
            true, NOW(), NOW() + INTERVAL '30 days', $1,
            -1
          )
        `, [testUserId])
      ).rejects.toThrow(/campaigns_cooldown_days_check/);

      // Cooldown > 365 should fail
      await expect(
        client.query(`
          INSERT INTO trial_programs (
            name, trial_tier, trial_days,
            is_active, starts_at, ends_at, created_by_user_id,
            cooldown_days
          ) VALUES (
            'Invalid Cooldown 2', 'pro', 14,
            true, NOW(), NOW() + INTERVAL '30 days', $1,
            366
          )
        `, [testUserId])
      ).rejects.toThrow(/campaigns_cooldown_days_check/);
    });

    test('should enforce max_trials_per_user range (1-10)', async () => {
      // Valid max_trials_per_user should work
      await expect(
        client.query(`
          INSERT INTO trial_programs (
            name, trial_tier, trial_days,
            is_active, starts_at, ends_at, created_by_user_id,
            max_trials_per_user
          ) VALUES (
            'Valid Max Trials', 'pro', 14,
            true, NOW(), NOW() + INTERVAL '30 days', $1,
            3
          )
        `, [testUserId])
      ).resolves.toBeDefined();

      // Cleanup
      await client.query(`DELETE FROM trial_programs WHERE name = 'Valid Max Trials'`);

      // max_trials_per_user = 0 should fail
      await expect(
        client.query(`
          INSERT INTO trial_programs (
            name, trial_tier, trial_days,
            is_active, starts_at, ends_at, created_by_user_id,
            max_trials_per_user
          ) VALUES (
            'Invalid Max Trials 1', 'pro', 14,
            true, NOW(), NOW() + INTERVAL '30 days', $1,
            0
          )
        `, [testUserId])
      ).rejects.toThrow(/campaigns_max_trials_check/);

      // max_trials_per_user > 10 should fail
      await expect(
        client.query(`
          INSERT INTO trial_programs (
            name, trial_tier, trial_days,
            is_active, starts_at, ends_at, created_by_user_id,
            max_trials_per_user
          ) VALUES (
            'Invalid Max Trials 2', 'pro', 14,
            true, NOW(), NOW() + INTERVAL '30 days', $1,
            11
          )
        `, [testUserId])
      ).rejects.toThrow(/campaigns_max_trials_check/);
    });
  });

  describe('Indexes', () => {
    test('should have index on eligibility fields', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'campaigns'
          AND indexname = 'idx_campaigns_eligibility'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('allow_previous_trial_users');
      expect(result.rows[0].indexdef).toContain('cooldown_days');
    });
  });

  describe('Default Values', () => {
    test('should use default values for new campaigns', async () => {
      const result = await client.query(`
        INSERT INTO trial_programs (
          name, trial_tier, trial_days,
          is_active, starts_at, ends_at, created_by_user_id
        ) VALUES (
          'Default Values Trial Program', 'pro', 14,
          true, NOW(), NOW() + INTERVAL '30 days', $1
        ) RETURNING allow_previous_trial_users, cooldown_days, max_trials_per_user
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].allow_previous_trial_users).toBe(false);
      expect(result.rows[0].cooldown_days).toBe(0);
      expect(result.rows[0].max_trials_per_user).toBe(1);

      // Cleanup
      await client.query(`DELETE FROM trial_programs WHERE name = 'Default Values Trial Program'`);
    });

    test('should backfill existing campaigns with default values', async () => {
      const result = await client.query(`
        SELECT allow_previous_trial_users, cooldown_days, max_trials_per_user
        FROM trial_programs
        WHERE id = $1
      `, [testCampaignId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].allow_previous_trial_users).toBe(false);
      expect(result.rows[0].cooldown_days).toBe(0);
      expect(result.rows[0].max_trials_per_user).toBe(1);
    });
  });

  describe('Data Operations', () => {
    test('should support re-engagement campaign configuration', async () => {
      const result = await client.query(`
        INSERT INTO trial_programs (
          name, trial_tier, trial_days,
          is_active, starts_at, ends_at, created_by_user_id,
          allow_previous_trial_users, cooldown_days, max_trials_per_user
        ) VALUES (
          'Come Back Special', 'team', 30,
          true, NOW(), NOW() + INTERVAL '60 days', $1,
          true, 90, 2
        ) RETURNING id, allow_previous_trial_users, cooldown_days, max_trials_per_user
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].allow_previous_trial_users).toBe(true);
      expect(result.rows[0].cooldown_days).toBe(90);
      expect(result.rows[0].max_trials_per_user).toBe(2);

      // Cleanup
      await client.query(`DELETE FROM trial_programs WHERE id = $1`, [result.rows[0].id]);
    });

    test('should support new-users-only campaign configuration', async () => {
      const result = await client.query(`
        INSERT INTO trial_programs (
          name, trial_tier, trial_days,
          is_active, starts_at, ends_at, created_by_user_id,
          allow_previous_trial_users, cooldown_days, max_trials_per_user
        ) VALUES (
          'New User Welcome', 'pro', 14,
          true, NOW(), NOW() + INTERVAL '90 days', $1,
          false, 0, 1
        ) RETURNING id, allow_previous_trial_users, cooldown_days, max_trials_per_user
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].allow_previous_trial_users).toBe(false);
      expect(result.rows[0].cooldown_days).toBe(0);
      expect(result.rows[0].max_trials_per_user).toBe(1);

      // Cleanup
      await client.query(`DELETE FROM trial_programs WHERE id = $1`, [result.rows[0].id]);
    });

    test('should query campaigns by eligibility settings', async () => {
      // Insert test campaigns with different eligibility settings
      await client.query(`
        INSERT INTO trial_programs (
          name, trial_tier, trial_days,
          is_active, starts_at, ends_at, created_by_user_id,
          allow_previous_trial_users, cooldown_days, max_trials_per_user
        ) VALUES
          ('New Only 1', 'pro', 14, true, NOW(), NOW() + INTERVAL '30 days', $1, false, 0, 1),
          ('Lapsed 90d', 'team', 30, true, NOW(), NOW() + INTERVAL '30 days', $1, true, 90, 2),
          ('Lapsed 180d', 'pro', 21, true, NOW(), NOW() + INTERVAL '30 days', $1, true, 180, 3)
      `, [testUserId]);

      // Query campaigns that allow previous trial users
      const result = await client.query(`
        SELECT name, cooldown_days
        FROM trial_programs
        WHERE allow_previous_trial_users = true
        ORDER BY cooldown_days ASC
      `);

      const lapsedCampaigns = result.rows.filter(r =>
        ['Lapsed 90d', 'Lapsed 180d'].includes(r.name)
      );

      expect(lapsedCampaigns.length).toBeGreaterThanOrEqual(2);
      expect(lapsedCampaigns[0].name).toBe('Lapsed 90d');
      expect(lapsedCampaigns[0].cooldown_days).toBe(90);

      // Cleanup
      await client.query(`DELETE FROM trial_programs WHERE name IN ('New Only 1', 'Lapsed 90d', 'Lapsed 180d')`);
    });
  });

  describe('Column Comments', () => {
    test('should have descriptive comments on new columns', async () => {
      const result = await client.query(`
        SELECT
          col.column_name,
          pgd.description
        FROM pg_catalog.pg_statio_all_tables AS st
        INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
        INNER JOIN information_schema.columns col ON (
          col.table_schema = st.schemaname
          AND col.table_name = st.relname
          AND col.ordinal_position = pgd.objsubid
        )
        WHERE st.relname = 'campaigns'
          AND col.column_name IN ('allow_previous_trial_users', 'cooldown_days', 'max_trials_per_user')
        ORDER BY col.column_name
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(2); // At least 2 of the 3 columns should have comments
      const commentedColumns = result.rows.map(r => r.column_name);
      expect(commentedColumns).toContain('allow_previous_trial_users');
      expect(commentedColumns).toContain('cooldown_days');
    });
  });
});
