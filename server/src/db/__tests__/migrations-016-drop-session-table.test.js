/**
 * Migration 016: Drop session table
 * Tests for removing the session table (no longer used with JWT-only auth)
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

describe('Migration 016: Drop session table', () => {
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

  it('should have dropped the session table', async () => {
    // Verify session table no longer exists (migration already ran)
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'session'
    `);

    expect(result.rows).toHaveLength(0);
  });

  it('should be idempotent - creating and dropping again should work', async () => {
    // Recreate session table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);

    // Add index like connect-pg-simple does
    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
    `);

    // Verify table exists
    const beforeResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'session'
    `);
    expect(beforeResult.rows).toHaveLength(1);

    // Drop it with CASCADE
    await client.query(`DROP TABLE IF EXISTS session CASCADE`);

    // Verify table is gone
    const afterResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'session'
    `);
    expect(afterResult.rows).toHaveLength(0);

    // Verify indexes are gone too (CASCADE should have dropped them)
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'session'
    `);
    expect(indexResult.rows).toHaveLength(0);
  });

  it('should not error when dropping non-existent table', async () => {
    // This should not throw an error
    await expect(
      client.query(`DROP TABLE IF EXISTS session CASCADE`)
    ).resolves.not.toThrow();
  });
});
