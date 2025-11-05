/**
 * Migration 013 Test: Subscription Retention for Financial Compliance
 *
 * Tests the foreign key change from ON DELETE CASCADE to ON DELETE SET NULL
 * This ensures subscription records are retained for tax/audit compliance when users delete accounts
 * Run in Docker sandbox: npm run test:db -- migrations-013
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

describe('Migration 013: Subscription Data Retention', () => {
  let client;

  beforeAll(async () => {
    client = await pool.connect();
  });

  afterAll(async () => {
    // Clean up test data
    await client.query("DELETE FROM subscriptions WHERE stripe_subscription_id LIKE 'test_%'");
    await client.query("DELETE FROM users WHERE email LIKE 'test-migration-013%'");

    if (client) {
      client.release();
    }
    await pool.end();
  });

  describe('Schema Changes', () => {
    it('should have changed user_id column to nullable', async () => {
      const result = await client.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = 'subscriptions'
          AND column_name = 'user_id'
      `);

      expect(result.rows[0].is_nullable).toBe('YES');
    });

    it('should have foreign key with ON DELETE SET NULL', async () => {
      const result = await client.query(`
        SELECT
          tc.constraint_name,
          rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'subscriptions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.constraint_name = 'fk_subscriptions_user'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].delete_rule).toBe('SET NULL');
    });
  });

  describe('Data Integrity', () => {
    it('should preserve subscription record when user is deleted (SET NULL)', async () => {
      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ('test-migration-013-preserve@example.com', 'Test', 'User', 'hash123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Create test subscription
      await client.query(`
        INSERT INTO subscriptions (
          user_id,
          stripe_subscription_id,
          stripe_price_id,
          tier,
          status,
          current_period_start,
          current_period_end
        )
        VALUES (
          $1,
          'test_sub_preserve_123',
          'price_test123',
          'pro',
          'active',
          NOW(),
          NOW() + INTERVAL '30 days'
        )
      `, [userId]);

      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      // Verify subscription still exists with user_id = NULL
      const subResult = await client.query(`
        SELECT user_id, stripe_subscription_id, stripe_price_id, tier, status
        FROM subscriptions
        WHERE stripe_subscription_id = 'test_sub_preserve_123'
      `);

      expect(subResult.rows.length).toBe(1);
      expect(subResult.rows[0].user_id).toBe(null);
      expect(subResult.rows[0].stripe_subscription_id).toBe('test_sub_preserve_123');
      expect(subResult.rows[0].stripe_price_id).toBe('price_test123');
      expect(subResult.rows[0].tier).toBe('pro');
      expect(subResult.rows[0].status).toBe('active');
    });

    it('should preserve Stripe IDs for audit trail', async () => {
      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, stripe_customer_id)
        VALUES ('test-migration-013-audit@example.com', 'Test', 'User', 'hash123', 'cus_test_audit_123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Create test subscription
      await client.query(`
        INSERT INTO subscriptions (
          user_id,
          stripe_subscription_id,
          stripe_price_id,
          tier,
          status,
          current_period_start,
          current_period_end
        )
        VALUES (
          $1,
          'test_sub_audit_456',
          'price_test_audit_456',
          'team',
          'active',
          NOW(),
          NOW() + INTERVAL '30 days'
        )
      `, [userId]);

      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      // Verify subscription record is effectively anonymized but billing history intact
      const subResult = await client.query(`
        SELECT
          user_id,
          stripe_subscription_id,
          stripe_price_id,
          tier,
          status,
          current_period_start,
          current_period_end
        FROM subscriptions
        WHERE stripe_subscription_id = 'test_sub_audit_456'
      `);

      expect(subResult.rows.length).toBe(1);

      const sub = subResult.rows[0];

      // User link removed (anonymized)
      expect(sub.user_id).toBe(null);

      // But billing history preserved for compliance
      expect(sub.stripe_subscription_id).toBe('test_sub_audit_456');
      expect(sub.stripe_price_id).toBe('price_test_audit_456');
      expect(sub.tier).toBe('team');
      expect(sub.status).toBe('active');
      expect(sub.current_period_start).not.toBe(null);
      expect(sub.current_period_end).not.toBe(null);
    });

    it('should allow querying subscription history after user deletion', async () => {
      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ('test-migration-013-query@example.com', 'Test', 'User', 'hash123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Create multiple subscriptions
      await client.query(`
        INSERT INTO subscriptions (
          user_id,
          stripe_subscription_id,
          stripe_price_id,
          tier,
          status,
          current_period_start,
          current_period_end
        )
        VALUES
          ($1, 'test_sub_query_1', 'price_starter', 'starter', 'canceled', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),
          ($1, 'test_sub_query_2', 'price_pro', 'pro', 'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days')
      `, [userId]);

      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      // Verify we can still query subscription history for business analytics
      const subResult = await client.query(`
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE stripe_subscription_id IN ('test_sub_query_1', 'test_sub_query_2')
      `);

      expect(parseInt(subResult.rows[0].count)).toBe(2);

      // Verify we can query by tier for reporting
      const tierResult = await client.query(`
        SELECT tier, COUNT(*) as count
        FROM subscriptions
        WHERE stripe_subscription_id IN ('test_sub_query_1', 'test_sub_query_2')
        GROUP BY tier
        ORDER BY tier
      `);

      expect(tierResult.rows.length).toBe(2);
      expect(tierResult.rows[0].tier).toBe('pro');
      expect(tierResult.rows[1].tier).toBe('starter');
    });
  });

  describe('GDPR Compliance', () => {
    it('should comply with GDPR Article 17(3)(b) - legal obligation exemption', async () => {
      // GDPR allows data retention for "compliance with a legal obligation"
      // Financial regulations require keeping transaction records for 7 years

      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash)
        VALUES ('test-migration-013-gdpr@example.com', 'Test', 'User', 'hash123')
        RETURNING id
      `);
      const userId = userResult.rows[0].id;

      // Create subscription with billing period
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-02-01');

      await client.query(`
        INSERT INTO subscriptions (
          user_id,
          stripe_subscription_id,
          stripe_price_id,
          tier,
          status,
          current_period_start,
          current_period_end
        )
        VALUES (
          $1,
          'test_sub_gdpr_789',
          'price_test_gdpr_789',
          'enterprise',
          'canceled',
          $2,
          $3
        )
      `, [userId, periodStart.toISOString(), periodEnd.toISOString()]);

      // User exercises "right to erasure" (deletes account)
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      // Verify:
      // 1. PII is gone (user record deleted)
      const userCheck = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      expect(userCheck.rows.length).toBe(0);

      // 2. But billing record remains for legal compliance
      const subResult = await client.query(`
        SELECT
          user_id,
          stripe_subscription_id,
          tier,
          current_period_start,
          current_period_end
        FROM subscriptions
        WHERE stripe_subscription_id = 'test_sub_gdpr_789'
      `);

      expect(subResult.rows.length).toBe(1);

      const sub = subResult.rows[0];

      // No way to identify the person (user_id = NULL)
      expect(sub.user_id).toBe(null);

      // But billing period preserved for tax/audit (legal obligation)
      expect(sub.stripe_subscription_id).toBe('test_sub_gdpr_789');
      expect(sub.tier).toBe('enterprise');
      expect(new Date(sub.current_period_start).toISOString()).toBe(periodStart.toISOString());
      expect(new Date(sub.current_period_end).toISOString()).toBe(periodEnd.toISOString());
    });
  });
});
