/**
 * Migration 009 Test: Add livemode column to subscriptions
 *
 * Tests the addition of livemode tracking for test vs production subscriptions
 *
 * Run: npm run test:db -- migrations-009
 */

const { sql } = require('./helpers/setup.js');

describe('Migration 009: Add livemode to subscriptions', () => {
  // Cleanup test data after tests
  beforeEach(async () => {
    await sql`
      DELETE FROM subscriptions
      WHERE stripe_subscription_id LIKE 'sub_test_%'
    `;
    await sql`
      DELETE FROM users
      WHERE email LIKE 'test-migration-009%@example.com'
    `;
  });

  describe('Schema Changes', () => {
    it('should have livemode column in subscriptions table', async () => {
      const result = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'subscriptions'
        AND column_name = 'livemode'
      `;

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        column_name: 'livemode',
        data_type: 'boolean',
        is_nullable: 'NO'
      });
      expect(result.rows[0].column_default).toContain('false');
    });

    it('should create index on livemode column', async () => {
      const result = await sql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'subscriptions'
        AND indexname = 'idx_subscriptions_livemode'
      `;

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('livemode');
    });

    it('should create composite index on user_id, livemode, status', async () => {
      const result = await sql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'subscriptions'
        AND indexname = 'idx_subscriptions_user_livemode_status'
      `;

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('user_id');
      expect(result.rows[0].indexdef).toContain('livemode');
      expect(result.rows[0].indexdef).toContain('status');
    });
  });

  describe('Data Insertion', () => {
    it('should insert test subscription with livemode=false', async () => {
      // Create user first
      const userResult = await sql`
        INSERT INTO users (email, tier)
        VALUES ('test-migration-009-livemode-false@example.com', 'free')
        RETURNING id
      `;
      const userId = userResult.rows[0].id;

      // Insert subscription
      const result = await sql`
        INSERT INTO subscriptions (
          user_id, stripe_subscription_id, stripe_price_id,
          tier, status, current_period_start, current_period_end,
          livemode, created_via
        ) VALUES (
          ${userId}, 'sub_test_sandbox', 'price_test_starter',
          'starter', 'active', NOW(), NOW() + INTERVAL '1 month',
          false, 'app'
        )
        RETURNING *
      `;

      expect(result.rows[0].livemode).toBe(false);
      expect(result.rows[0].tier).toBe('starter');
      expect(result.rows[0].status).toBe('active');

      // Cleanup
      await sql`DELETE FROM subscriptions WHERE stripe_subscription_id = 'sub_test_sandbox'`;
      await sql`DELETE FROM users WHERE id = ${userId}`;
    });

    it('should insert production subscription with livemode=true', async () => {
      // Create user first
      const userResult = await sql`
        INSERT INTO users (email, tier)
        VALUES ('test-migration-009-livemode-true@example.com', 'free')
        RETURNING id
      `;
      const userId = userResult.rows[0].id;

      // Insert subscription
      const result = await sql`
        INSERT INTO subscriptions (
          user_id, stripe_subscription_id, stripe_price_id,
          tier, status, current_period_start, current_period_end,
          livemode, created_via
        ) VALUES (
          ${userId}, 'sub_test_prod', 'price_live_pro',
          'pro', 'active', NOW(), NOW() + INTERVAL '1 month',
          true, 'app'
        )
        RETURNING *
      `;

      expect(result.rows[0].livemode).toBe(true);
      expect(result.rows[0].tier).toBe('pro');
      expect(result.rows[0].status).toBe('active');

      // Cleanup
      await sql`DELETE FROM subscriptions WHERE stripe_subscription_id = 'sub_test_prod'`;
      await sql`DELETE FROM users WHERE id = ${userId}`;
    });

    it('should default livemode to false when not specified', async () => {
      // Create user first
      const userResult = await sql`
        INSERT INTO users (email, tier)
        VALUES ('test-migration-009-default@example.com', 'free')
        RETURNING id
      `;
      const userId = userResult.rows[0].id;

      // Insert subscription without specifying livemode
      const result = await sql`
        INSERT INTO subscriptions (
          user_id, stripe_subscription_id, stripe_price_id,
          tier, status, current_period_start, current_period_end,
          created_via
        ) VALUES (
          ${userId}, 'sub_test_default', 'price_test',
          'starter', 'active', NOW(), NOW() + INTERVAL '1 month',
          'app'
        )
        RETURNING livemode
      `;

      expect(result.rows[0].livemode).toBe(false);

      // Cleanup
      await sql`DELETE FROM subscriptions WHERE stripe_subscription_id = 'sub_test_default'`;
      await sql`DELETE FROM users WHERE id = ${userId}`;
    });

    it('should update livemode value', async () => {
      // Create user first
      const userResult = await sql`
        INSERT INTO users (email, tier)
        VALUES ('test-migration-009-update@example.com', 'free')
        RETURNING id
      `;
      const userId = userResult.rows[0].id;

      // Insert subscription with livemode=false
      await sql`
        INSERT INTO subscriptions (
          user_id, stripe_subscription_id, stripe_price_id,
          tier, status, current_period_start, current_period_end,
          livemode, created_via
        ) VALUES (
          ${userId}, 'sub_test_update', 'price_test',
          'starter', 'active', NOW(), NOW() + INTERVAL '1 month',
          false, 'app'
        )
      `;

      // Update livemode to true
      const result = await sql`
        UPDATE subscriptions
        SET livemode = true
        WHERE stripe_subscription_id = 'sub_test_update'
        RETURNING livemode
      `;

      expect(result.rows[0].livemode).toBe(true);

      // Cleanup
      await sql`DELETE FROM subscriptions WHERE stripe_subscription_id = 'sub_test_update'`;
      await sql`DELETE FROM users WHERE id = ${userId}`;
    });
  });

  describe('Constraints', () => {
    it('should not allow NULL values for livemode', async () => {
      // Create user first
      const userResult = await sql`
        INSERT INTO users (email, tier)
        VALUES ('test-migration-009-null@example.com', 'free')
        RETURNING id
      `;
      const userId = userResult.rows[0].id;

      // Attempt to insert with NULL livemode should fail
      await expect(async () => {
        await sql`
          INSERT INTO subscriptions (
            user_id, stripe_subscription_id, stripe_price_id,
            tier, status, current_period_start, current_period_end,
            livemode, created_via
          ) VALUES (
            ${userId}, 'sub_test_null', 'price_test',
            'starter', 'active', NOW(), NOW() + INTERVAL '1 month',
            NULL, 'app'
          )
        `;
      }).rejects.toThrow();

      // Cleanup user
      await sql`DELETE FROM users WHERE id = ${userId}`;
    });
  });
});
