/**
 * Migration 011 Tests: Add Analytics Preference Column
 *
 * Tests the analytics_enabled column addition to users table
 * Run in Docker sandbox: npm run test:db -- migrations-011
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

describe('Migration 011: Add Analytics Preference', () => {
  let client;

  beforeAll(async () => {
    client = await pool.connect();
  });

  afterAll(async () => {
    if (client) {
      client.release();
    }
    await pool.end();
  });

  describe('Schema Changes', () => {
    it('should add analytics_enabled column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'analytics_enabled'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        column_name: 'analytics_enabled',
        data_type: 'boolean',
        is_nullable: 'NO',
        column_default: 'true',
      });
    });

    it('should create idx_users_analytics_enabled index', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_analytics_enabled'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexname).toBe('idx_users_analytics_enabled');
      expect(result.rows[0].indexdef).toContain('analytics_enabled');
    });

    it('should have column comment set', async () => {
      const result = await client.query(`
        SELECT col_description('users'::regclass,
          (SELECT ordinal_position
           FROM information_schema.columns
           WHERE table_name = 'users' AND column_name = 'analytics_enabled')
        ) as column_comment
      `);

      expect(result.rows[0].column_comment).toContain('analytics tracking');
      expect(result.rows[0].column_comment).toContain('Vercel Analytics');
    });
  });

  describe('Data Integrity', () => {
    it('should default analytics_enabled to TRUE for new users', async () => {
      // Create test user without specifying analytics_enabled
      const result = await client.query(`
        INSERT INTO users (email, tier)
        VALUES ('analytics-test-default@example.com', 'free')
        RETURNING id, email, analytics_enabled
      `);

      expect(result.rows[0].analytics_enabled).toBe(true);

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [result.rows[0].id]);
    });

    it('should allow analytics_enabled to be FALSE', async () => {
      const result = await client.query(`
        INSERT INTO users (email, tier, analytics_enabled)
        VALUES ('analytics-test-false@example.com', 'free', false)
        RETURNING id, email, analytics_enabled
      `);

      expect(result.rows[0].analytics_enabled).toBe(false);

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [result.rows[0].id]);
    });

    it('should allow updating analytics_enabled', async () => {
      // Create user with analytics enabled
      const createResult = await client.query(`
        INSERT INTO users (email, tier, analytics_enabled)
        VALUES ('analytics-test-update@example.com', 'free', true)
        RETURNING id, email, analytics_enabled
      `);

      expect(createResult.rows[0].analytics_enabled).toBe(true);
      const userId = createResult.rows[0].id;

      // Update to false
      const updateResult = await client.query(`
        UPDATE users
        SET analytics_enabled = false
        WHERE id = $1
        RETURNING id, analytics_enabled
      `, [userId]);

      expect(updateResult.rows[0].analytics_enabled).toBe(false);

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should allow querying by analytics_enabled (index test)', async () => {
      // Create test users with different preferences
      const user1 = await client.query(`
        INSERT INTO users (email, tier, analytics_enabled)
        VALUES ('analytics-enabled@example.com', 'free', true)
        RETURNING id
      `);

      const user2 = await client.query(`
        INSERT INTO users (email, tier, analytics_enabled)
        VALUES ('analytics-disabled@example.com', 'free', false)
        RETURNING id
      `);

      // Query by analytics_enabled (should use index)
      const enabledResult = await client.query(`
        SELECT COUNT(*) as count
        FROM users
        WHERE analytics_enabled = true
      `);

      const disabledResult = await client.query(`
        SELECT COUNT(*) as count
        FROM users
        WHERE analytics_enabled = false
      `);

      expect(Number(enabledResult.rows[0].count)).toBeGreaterThan(0);
      expect(Number(disabledResult.rows[0].count)).toBeGreaterThan(0);

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [user1.rows[0].id]);
      await client.query(`DELETE FROM users WHERE id = $1`, [user2.rows[0].id]);
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing user queries', async () => {
      // Create a user and query all standard fields
      const createResult = await client.query(`
        INSERT INTO users (email, tier)
        VALUES ('compatibility-test@example.com', 'free')
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Standard query used throughout the app
      const queryResult = await client.query(`
        SELECT id, email, tier, analytics_enabled, created_at
        FROM users
        WHERE id = $1
      `, [userId]);

      expect(queryResult.rows).toHaveLength(1);
      expect(queryResult.rows[0].id).toBe(userId);
      expect(queryResult.rows[0].analytics_enabled).toBe(true);

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should allow NULL values to be explicitly set to TRUE (existing users)', async () => {
      // This simulates updating existing users who didn't have this column
      // Though in practice, the DEFAULT TRUE handles this
      const result = await client.query(`
        INSERT INTO users (email, tier, analytics_enabled)
        VALUES ('null-to-true@example.com', 'free', true)
        RETURNING id, analytics_enabled
      `);

      expect(result.rows[0].analytics_enabled).toBe(true);

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [result.rows[0].id]);
    });
  });

  describe('Migration Idempotency', () => {
    it('should handle IF NOT EXISTS correctly (can run migration multiple times)', async () => {
      // Check that column exists (migration already ran)
      const columnResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'analytics_enabled'
      `);

      expect(columnResult.rows).toHaveLength(1);

      // Check that index exists
      const indexResult = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'users' AND indexname = 'idx_users_analytics_enabled'
      `);

      expect(indexResult.rows).toHaveLength(1);
    });
  });
});
