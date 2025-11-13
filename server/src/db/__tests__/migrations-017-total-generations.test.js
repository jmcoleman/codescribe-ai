/**
 * Migration 017 Test: Total Generations Column with Auto-Increment Trigger
 *
 * Tests the denormalized total_generations column on users table
 * This column is maintained automatically by a database trigger for O(1) lookups
 *
 * Run in Docker sandbox: npm run test:db -- migrations-017
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

describe('Migration 017: Total Generations Column with Trigger', () => {
  let client;

  beforeAll(async () => {
    client = await pool.connect();
  });

  afterAll(async () => {
    // Clean up test data
    await client.query("DELETE FROM user_quotas WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test-migration-017%')");
    await client.query("DELETE FROM users WHERE email LIKE 'test-migration-017%'");

    if (client) {
      client.release();
    }
    await pool.end();
  });

  describe('Schema Changes', () => {
    it('should have added total_generations column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'total_generations'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toBe('integer');
      expect(result.rows[0].column_default).toBe('0');
      expect(result.rows[0].is_nullable).toBe('NO');
    });

    it('should have created index on total_generations column', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
          AND indexname = 'idx_users_total_generations'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('total_generations DESC');
    });
  });

  describe('Trigger Function', () => {
    it('should have created update_user_total_generations function', async () => {
      const result = await client.query(`
        SELECT routine_name, routine_type, data_type
        FROM information_schema.routines
        WHERE routine_name = 'update_user_total_generations'
          AND routine_schema = 'public'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].routine_type).toBe('FUNCTION');
      expect(result.rows[0].data_type).toBe('trigger');
    });

    it('should have created trigger on user_quotas table', async () => {
      const result = await client.query(`
        SELECT trigger_name, event_object_table, action_timing, event_manipulation
        FROM information_schema.triggers
        WHERE trigger_name = 'trigger_update_user_total_generations'
          AND event_object_table = 'user_quotas'
      `);

      expect(result.rows.length).toBeGreaterThan(0); // One row per event (INSERT, UPDATE, DELETE)

      // Check for all three operations
      const events = result.rows.map(r => r.event_manipulation);
      expect(events).toContain('INSERT');
      expect(events).toContain('UPDATE');
      expect(events).toContain('DELETE');

      // All should be AFTER triggers
      result.rows.forEach(row => {
        expect(row.action_timing).toBe('AFTER');
      });
    });
  });

  describe('Trigger Behavior - INSERT', () => {
    it('should increment total_generations when quota INSERT occurs', async () => {
      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ('test-migration-017-insert@example.com', 'Test', 'User', 'hash123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Verify initial total_generations is 0
      let userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(0);

      // Insert first quota record
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES ($1, 5, 5, DATE_TRUNC('month', CURRENT_DATE))
      `, [userId]);

      // Verify total_generations incremented by monthly_count
      userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(5);

      // Insert second quota record for different period
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES ($1, 10, 10, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'))
      `, [userId]);

      // Verify total_generations incremented again
      userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(15); // 5 + 10
    });
  });

  describe('Trigger Behavior - UPDATE', () => {
    it('should update total_generations when monthly_count changes', async () => {
      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ('test-migration-017-update@example.com', 'Test', 'User', 'hash123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Insert initial quota
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES ($1, 10, 10, DATE_TRUNC('month', CURRENT_DATE))
      `, [userId]);

      // Verify initial total
      let userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(10);

      // Update monthly_count (increase)
      await client.query(`
        UPDATE user_quotas
        SET monthly_count = 25
        WHERE user_id = $1 AND period_start_date = DATE_TRUNC('month', CURRENT_DATE)
      `, [userId]);

      // Verify total increased by difference (25 - 10 = 15 increase)
      userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(25);

      // Update monthly_count (decrease)
      await client.query(`
        UPDATE user_quotas
        SET monthly_count = 15
        WHERE user_id = $1 AND period_start_date = DATE_TRUNC('month', CURRENT_DATE)
      `, [userId]);

      // Verify total decreased by difference (15 - 25 = -10 decrease)
      userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(15);
    });

    it('should not change total_generations when daily_count changes', async () => {
      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ('test-migration-017-daily@example.com', 'Test', 'User', 'hash123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Insert initial quota
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES ($1, 5, 20, DATE_TRUNC('month', CURRENT_DATE))
      `, [userId]);

      // Verify initial total
      let userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      const initialTotal = userCheck.rows[0].total_generations;
      expect(initialTotal).toBe(20);

      // Update only daily_count (not monthly_count)
      await client.query(`
        UPDATE user_quotas
        SET daily_count = 10
        WHERE user_id = $1 AND period_start_date = DATE_TRUNC('month', CURRENT_DATE)
      `, [userId]);

      // Verify total unchanged (trigger calculates difference in monthly_count only)
      userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(initialTotal);
    });
  });

  describe('Trigger Behavior - DELETE', () => {
    it('should decrement total_generations when quota DELETE occurs', async () => {
      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ('test-migration-017-delete@example.com', 'Test', 'User', 'hash123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Insert multiple quota records
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES
          ($1, 5, 5, DATE_TRUNC('month', CURRENT_DATE)),
          ($1, 10, 10, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'))
      `, [userId]);

      // Verify total
      let userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(15);

      // Delete one quota record
      await client.query(`
        DELETE FROM user_quotas
        WHERE user_id = $1 AND period_start_date = DATE_TRUNC('month', CURRENT_DATE)
      `, [userId]);

      // Verify total decremented
      userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(10); // 15 - 5
    });
  });

  describe('Backfill Verification', () => {
    it('should correctly calculate total_generations from existing quotas', async () => {
      // Create test user with existing quotas BEFORE migration would have run
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, total_generations)
        VALUES ('test-migration-017-backfill@example.com', 'Test', 'User', 'hash123', 0)
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Insert historical quotas
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES
          ($1, 5, 100, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')),
          ($1, 10, 200, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')),
          ($1, 15, 150, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')),
          ($1, 8, 80, DATE_TRUNC('month', CURRENT_DATE))
      `, [userId]);

      // Manually trigger backfill logic (simulating what migration does)
      await client.query(`
        UPDATE users u
        SET total_generations = COALESCE(
          (SELECT SUM(monthly_count)
           FROM user_quotas
           WHERE user_id = u.id),
          0
        )
        WHERE id = $1
      `, [userId]);

      // Verify total_generations equals sum of all monthly_counts
      const userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(530); // 100 + 200 + 150 + 80

      // Verify trigger still works after backfill
      await client.query(`
        UPDATE user_quotas
        SET monthly_count = 90
        WHERE user_id = $1 AND period_start_date = DATE_TRUNC('month', CURRENT_DATE)
      `, [userId]);

      const updatedCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(updatedCheck.rows[0].total_generations).toBe(540); // 530 + (90 - 80)
    });

    it('should handle users with no quotas (total_generations = 0)', async () => {
      // Create user with no quotas
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ('test-migration-017-noquotas@example.com', 'Test', 'User', 'hash123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Verify total_generations defaults to 0
      const userCheck = await client.query(
        'SELECT total_generations FROM users WHERE id = $1',
        [userId]
      );
      expect(userCheck.rows[0].total_generations).toBe(0);
    });
  });

  describe('Performance & Indexing', () => {
    it('should efficiently query top users by total_generations', async () => {
      // Create multiple users with varying totals
      const users = [];
      for (let i = 1; i <= 5; i++) {
        const userResult = await client.query(`
          INSERT INTO users (email, first_name, last_name, password_hash)
          VALUES ($1, 'Test', 'User', 'hash123')
          RETURNING id
        `, [`test-migration-017-perf-${i}@example.com`]);

        const userId = userResult.rows[0].id;
        users.push(userId);

        // Insert quotas with different monthly_counts
        await client.query(`
          INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
          VALUES ($1, ${i * 10}, ${i * 100}, DATE_TRUNC('month', CURRENT_DATE))
        `, [userId]);
      }

      // Query top users by total_generations (should use index)
      const result = await client.query(`
        SELECT id, email, total_generations
        FROM users
        WHERE email LIKE 'test-migration-017-perf-%'
        ORDER BY total_generations DESC
        LIMIT 3
      `);

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].total_generations).toBe(500); // User 5
      expect(result.rows[1].total_generations).toBe(400); // User 4
      expect(result.rows[2].total_generations).toBe(300); // User 3
    });
  });

  describe('Idempotency', () => {
    it('should be safe to run migration multiple times', async () => {
      // Try to add column again (should not error with IF NOT EXISTS)
      await expect(
        client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_generations INTEGER NOT NULL DEFAULT 0`)
      ).resolves.not.toThrow();

      // Try to create index again (should not error with IF NOT EXISTS)
      await expect(
        client.query(`CREATE INDEX IF NOT EXISTS idx_users_total_generations ON users(total_generations DESC)`)
      ).resolves.not.toThrow();

      // Try to drop and recreate trigger (should not error)
      await expect(
        client.query(`DROP TRIGGER IF EXISTS trigger_update_user_total_generations ON user_quotas`)
      ).resolves.not.toThrow();

      await expect(
        client.query(`
          CREATE TRIGGER trigger_update_user_total_generations
          AFTER INSERT OR UPDATE OR DELETE ON user_quotas
          FOR EACH ROW
          EXECUTE FUNCTION update_user_total_generations()
        `)
      ).resolves.not.toThrow();
    });
  });

  describe('Admin Dashboard Integration', () => {
    it('should support admin dashboard query pattern', async () => {
      // Create test user with multiple periods of usage
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, tier)
        VALUES ('test-migration-017-admin@example.com', 'Test', 'User', 'hash123', 'pro')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Insert current period quota
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES ($1, 25, 250, DATE_TRUNC('month', CURRENT_DATE))
      `, [userId]);

      // Insert historical quotas
      await client.query(`
        INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date)
        VALUES
          ($1, 0, 150, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')),
          ($1, 0, 100, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months'))
      `, [userId]);

      // Query as admin dashboard would (This Period + All Time)
      const result = await client.query(`
        SELECT
          uq.user_id,
          u.email,
          u.tier,
          uq.monthly_count as this_period,
          u.total_generations as all_time
        FROM user_quotas uq
        JOIN users u ON uq.user_id = u.id
        WHERE uq.period_start_date = DATE_TRUNC('month', CURRENT_DATE)
          AND u.id = $1
      `, [userId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].this_period).toBe(250); // Current month
      expect(result.rows[0].all_time).toBe(500); // 250 + 150 + 100
      expect(result.rows[0].tier).toBe('pro');
    });
  });
});
