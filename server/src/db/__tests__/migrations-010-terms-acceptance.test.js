/**
 * Migration 010: Add Terms Acceptance Tests
 * Tests for versioned legal document acceptance tracking
 *
 * Run: npm run test:db -- migration-010
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

describe('Migration 010: Terms Acceptance', () => {
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
    it('should add terms_accepted_at column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'terms_accepted_at'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        column_name: 'terms_accepted_at',
        data_type: 'timestamp without time zone',
        is_nullable: 'YES',
      });
    });

    it('should add terms_version_accepted column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'terms_version_accepted'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        column_name: 'terms_version_accepted',
        data_type: 'character varying',
        is_nullable: 'YES',
        character_maximum_length: 20,
      });
    });

    it('should add privacy_accepted_at column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'privacy_accepted_at'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        column_name: 'privacy_accepted_at',
        data_type: 'timestamp without time zone',
        is_nullable: 'YES',
      });
    });

    it('should add privacy_version_accepted column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'privacy_version_accepted'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        column_name: 'privacy_version_accepted',
        data_type: 'character varying',
        is_nullable: 'YES',
        character_maximum_length: 20,
      });
    });
  });

  describe('Indexes', () => {
    it('should create idx_users_terms_accepted_at index', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_terms_accepted_at'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('terms_accepted_at');
    });

    it('should create idx_users_terms_version_accepted index', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_terms_version_accepted'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('terms_version_accepted');
    });

    it('should create idx_users_privacy_accepted_at index', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_privacy_accepted_at'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('privacy_accepted_at');
    });

    it('should create idx_users_privacy_version_accepted index', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_privacy_version_accepted'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('privacy_version_accepted');
    });
  });

  describe('Data Operations', () => {
    let testUserId;

    beforeAll(async () => {
      // Create a test user
      const result = await client.query(`
        INSERT INTO users (email, password_hash, tier)
        VALUES ($1, $2, $3)
        RETURNING id
      `, ['test-terms@example.com', 'hashed_password', 'free']);

      testUserId = result.rows[0].id;
    });

    afterAll(async () => {
      // Cleanup test user
      if (testUserId) {
        await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('should allow NULL values for all new columns (backward compatibility)', async () => {
      const result = await client.query(`
        SELECT terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted
        FROM users
        WHERE id = $1
      `, [testUserId]);

      expect(result.rows[0]).toMatchObject({
        terms_accepted_at: null,
        terms_version_accepted: null,
        privacy_accepted_at: null,
        privacy_version_accepted: null,
      });
    });

    it('should accept terms acceptance data', async () => {
      const now = new Date();
      const termsVersion = '2025-11-02';

      await client.query(`
        UPDATE users
        SET terms_accepted_at = $1,
            terms_version_accepted = $2
        WHERE id = $3
      `, [now, termsVersion, testUserId]);

      const result = await client.query(`
        SELECT terms_accepted_at, terms_version_accepted
        FROM users
        WHERE id = $1
      `, [testUserId]);

      expect(result.rows[0].terms_accepted_at).toBeInstanceOf(Date);
      expect(result.rows[0].terms_version_accepted).toBe(termsVersion);
    });

    it('should accept privacy policy acceptance data', async () => {
      const now = new Date();
      const privacyVersion = '2025-11-02';

      await client.query(`
        UPDATE users
        SET privacy_accepted_at = $1,
            privacy_version_accepted = $2
        WHERE id = $3
      `, [now, privacyVersion, testUserId]);

      const result = await client.query(`
        SELECT privacy_accepted_at, privacy_version_accepted
        FROM users
        WHERE id = $1
      `, [testUserId]);

      expect(result.rows[0].privacy_accepted_at).toBeInstanceOf(Date);
      expect(result.rows[0].privacy_version_accepted).toBe(privacyVersion);
    });

    it('should accept both terms and privacy independently', async () => {
      const termsDate = new Date('2025-11-01');
      const privacyDate = new Date('2025-11-02');

      await client.query(`
        UPDATE users
        SET terms_accepted_at = $1,
            terms_version_accepted = '2025-11-01',
            privacy_accepted_at = $2,
            privacy_version_accepted = '2025-11-02'
        WHERE id = $3
      `, [termsDate, privacyDate, testUserId]);

      const result = await client.query(`
        SELECT terms_accepted_at, terms_version_accepted,
               privacy_accepted_at, privacy_version_accepted
        FROM users
        WHERE id = $1
      `, [testUserId]);

      // Verify independent versioning
      expect(result.rows[0].terms_version_accepted).toBe('2025-11-01');
      expect(result.rows[0].privacy_version_accepted).toBe('2025-11-02');
    });

    it('should support version string up to 20 characters', async () => {
      const longVersion = '2025-11-02-v1.0.0.0'; // 19 characters

      await client.query(`
        UPDATE users
        SET terms_version_accepted = $1
        WHERE id = $2
      `, [longVersion, testUserId]);

      const result = await client.query(`
        SELECT terms_version_accepted
        FROM users
        WHERE id = $1
      `, [testUserId]);

      expect(result.rows[0].terms_version_accepted).toBe(longVersion);
    });
  });

  describe('Index Availability', () => {
    it('should have indexes available for query optimizer', async () => {
      // Verify all 4 indexes exist (already tested in Indexes section)
      // Note: PostgreSQL may choose Sequential Scan over Index Scan for small tables
      // This is expected optimizer behavior, not a bug
      const result = await client.query(`
        SELECT COUNT(*) as index_count
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname IN (
          'idx_users_terms_accepted_at',
          'idx_users_terms_version_accepted',
          'idx_users_privacy_accepted_at',
          'idx_users_privacy_version_accepted'
        )
      `);

      expect(parseInt(result.rows[0].index_count)).toBe(4);
    });
  });
});
