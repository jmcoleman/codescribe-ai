/**
 * Migration 056 Test: Remove max_trials_per_user from campaigns
 * Tests removal of per-campaign max trials (now system-wide env var)
 * Run in Docker sandbox: npm run test:db -- migrations-056
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

describe('Migration 056: Remove max_trials_per_user from campaigns', () => {
  let client;
  let testUserId;

  beforeAll(async () => {
    client = await pool.connect();

    // Create test user for campaigns
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
      VALUES ('migration056@test.com', 'Migration', 'Test', 'hash', true)
      RETURNING id
    `);
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await client.query('DELETE FROM trial_programs WHERE name LIKE $1', ['%Migration 056%']);
    await client.query('DELETE FROM users WHERE email = $1', ['migration056@test.com']);
    client.release();
    await pool.end();
  });

  describe('Column and Constraint Removal', () => {
    test('should NOT have max_trials_per_user column', async () => {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'max_trials_per_user'
      `);

      expect(result.rows.length).toBe(0);
    });

    test('should NOT have campaigns_max_trials_check constraint', async () => {
      const result = await client.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'campaigns' AND constraint_name = 'campaigns_max_trials_check'
      `);

      expect(result.rows.length).toBe(0);
    });

    test('should NOT have max_trials_per_user column', async () => {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'max_trials_per_user'
      `);

      expect(result.rows.length).toBe(0);
    });

    test('should NOT have campaigns_max_trials_check constraint', async () => {
      const result = await client.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'campaigns' AND constraint_name = 'campaigns_max_trials_check'
      `);

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Remaining Eligibility Columns Intact', () => {
    test('should still have allow_previous_trial_users column', async () => {
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'allow_previous_trial_users'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('boolean');
    });

    test('should still have cooldown_days column', async () => {
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'cooldown_days'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('integer');
    });
  });

  describe('Trial Program CRUD Operations', () => {
    test('should be able to insert campaign without max_trials_per_user', async () => {
      const result = await client.query(`
        INSERT INTO trial_programs (
          name, trial_tier, trial_days,
          is_active, allow_previous_trial_users, cooldown_days,
          starts_at, ends_at, created_by_user_id
        ) VALUES (
          'Migration 056 Test Trial Program', 'team', 30,
          true, true, 90,
          NOW(), NOW() + INTERVAL '30 days', $1
        ) RETURNING id, name, trial_tier, allow_previous_trial_users, cooldown_days
      `, [testUserId]);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].name).toBe('Migration 056 Test Trial Program');
      expect(result.rows[0].trial_tier).toBe('team');
      expect(result.rows[0].allow_previous_trial_users).toBe(true);
      expect(result.rows[0].cooldown_days).toBe(90);
    });

    test('should reject insert with max_trials_per_user column', async () => {
      await expect(
        client.query(`
          INSERT INTO trial_programs (
            name, trial_tier, trial_days,
            is_active, allow_previous_trial_users, cooldown_days, max_trials_per_user,
            starts_at, ends_at, created_by_user_id
          ) VALUES (
            'Invalid Trial Program', 'pro', 14,
            true, false, 0, 3,
            NOW(), NOW() + INTERVAL '30 days', $1
          )
        `, [testUserId])
      ).rejects.toThrow(/column "max_trials_per_user" of relation "campaigns" does not exist/);
    });
  });

  describe('Table Comments', () => {
    test('should reference MAX_TRIALS_PER_USER_LIFETIME env var in table comment', async () => {
      const result = await client.query(`
        SELECT obj_description('campaigns'::regclass) AS table_comment
      `);

      expect(result.rows[0].table_comment).toContain('system-wide setting');
      expect(result.rows[0].table_comment).toContain('MAX_TRIALS_PER_USER_LIFETIME');
    });
  });
});
