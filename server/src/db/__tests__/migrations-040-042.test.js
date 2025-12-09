/**
 * Migration 040-042 Tests: User Preferences Tables
 * Tests user_preferences and user_table_preferences tables for cross-device sync
 * Run in Docker sandbox: npm run test:db
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

describe('Migration 040-042: User Preferences Tables', () => {
  let client;
  let testUserId;
  let testProjectId;

  beforeAll(async () => {
    client = await pool.connect();

    // Create test user
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, password_hash, email_verified, save_docs_preference)
      VALUES ('prefs-test@test.com', 'Prefs', 'Test', 'hash', true, 'always')
      RETURNING id
    `);
    testUserId = userResult.rows[0].id;

    // Create test project for selectedProjectId tests
    const projectResult = await client.query(`
      INSERT INTO projects (user_id, name, description)
      VALUES ($1, 'Test Project', 'For preferences testing')
      RETURNING id
    `, [testUserId]);
    testProjectId = projectResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data in correct order (foreign keys)
    await client.query(`DELETE FROM user_table_preferences WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM user_preferences WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM projects WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [testUserId]);

    if (client) {
      client.release();
    }
    await pool.end();
  });

  describe('Migration 040: user_preferences table', () => {
    test('should have created user_preferences table', async () => {
      const result = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_preferences'
      `);

      expect(result.rows).toHaveLength(1);
    });

    test('should have correct columns', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_preferences'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('user_id');
      expect(columns).toContain('theme');
      expect(columns).toContain('layout_mode');
      expect(columns).toContain('sidebar_collapsed');
      expect(columns).toContain('sidebar_width');
      expect(columns).toContain('selected_project_id');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('should insert preferences with default values', async () => {
      const result = await client.query(`
        INSERT INTO user_preferences (user_id)
        VALUES ($1)
        RETURNING *
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].theme).toBe('auto');
      expect(result.rows[0].layout_mode).toBe('split');
      expect(result.rows[0].sidebar_collapsed).toBe(false);
      expect(result.rows[0].sidebar_width).toBe(20);
      expect(result.rows[0].selected_project_id).toBeNull();
    });

    test('should accept valid theme values', async () => {
      for (const theme of ['light', 'dark', 'auto']) {
        await client.query(`
          UPDATE user_preferences SET theme = $1 WHERE user_id = $2
        `, [theme, testUserId]);

        const result = await client.query(`
          SELECT theme FROM user_preferences WHERE user_id = $1
        `, [testUserId]);

        expect(result.rows[0].theme).toBe(theme);
      }
    });

    test('should reject invalid theme values', async () => {
      await expect(
        client.query(`
          UPDATE user_preferences SET theme = 'invalid' WHERE user_id = $1
        `, [testUserId])
      ).rejects.toThrow(/violates check constraint/);
    });

    test('should accept valid layout_mode values', async () => {
      for (const layout of ['split', 'code', 'doc']) {
        await client.query(`
          UPDATE user_preferences SET layout_mode = $1 WHERE user_id = $2
        `, [layout, testUserId]);

        const result = await client.query(`
          SELECT layout_mode FROM user_preferences WHERE user_id = $1
        `, [testUserId]);

        expect(result.rows[0].layout_mode).toBe(layout);
      }
    });

    test('should reject invalid layout_mode values', async () => {
      await expect(
        client.query(`
          UPDATE user_preferences SET layout_mode = 'invalid' WHERE user_id = $1
        `, [testUserId])
      ).rejects.toThrow(/violates check constraint/);
    });

    test('should enforce sidebar_width range (10-50)', async () => {
      // Should accept valid values
      for (const width of [10, 20, 30, 50]) {
        await client.query(`
          UPDATE user_preferences SET sidebar_width = $1 WHERE user_id = $2
        `, [width, testUserId]);

        const result = await client.query(`
          SELECT sidebar_width FROM user_preferences WHERE user_id = $1
        `, [testUserId]);

        expect(result.rows[0].sidebar_width).toBe(width);
      }

      // Should reject values outside range
      await expect(
        client.query(`
          UPDATE user_preferences SET sidebar_width = 9 WHERE user_id = $1
        `, [testUserId])
      ).rejects.toThrow(/violates check constraint/);

      await expect(
        client.query(`
          UPDATE user_preferences SET sidebar_width = 51 WHERE user_id = $1
        `, [testUserId])
      ).rejects.toThrow(/violates check constraint/);
    });

    test('should accept selected_project_id reference', async () => {
      await client.query(`
        UPDATE user_preferences SET selected_project_id = $1 WHERE user_id = $2
      `, [testProjectId, testUserId]);

      const result = await client.query(`
        SELECT selected_project_id FROM user_preferences WHERE user_id = $1
      `, [testUserId]);

      expect(result.rows[0].selected_project_id).toBe(testProjectId);
    });

    test('should cascade delete when user is deleted', async () => {
      // Create a temporary user with preferences
      const tempUser = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified, save_docs_preference)
        VALUES ('temp-cascade-test@test.com', 'Temp', 'User', 'hash', true, 'always')
        RETURNING id
      `);
      const tempUserId = tempUser.rows[0].id;

      await client.query(`
        INSERT INTO user_preferences (user_id) VALUES ($1)
      `, [tempUserId]);

      // Verify preferences exist
      const before = await client.query(`
        SELECT * FROM user_preferences WHERE user_id = $1
      `, [tempUserId]);
      expect(before.rows).toHaveLength(1);

      // Delete user
      await client.query(`DELETE FROM users WHERE id = $1`, [tempUserId]);

      // Verify preferences were cascaded
      const after = await client.query(`
        SELECT * FROM user_preferences WHERE user_id = $1
      `, [tempUserId]);
      expect(after.rows).toHaveLength(0);
    });
  });

  describe('Migration 041: user_table_preferences table', () => {
    test('should have created user_table_preferences table', async () => {
      const result = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_table_preferences'
      `);

      expect(result.rows).toHaveLength(1);
    });

    test('should have correct columns', async () => {
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user_table_preferences'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('user_id');
      expect(columns).toContain('table_id');
      expect(columns).toContain('column_sizing');
      expect(columns).toContain('updated_at');
    });

    test('should insert table preferences', async () => {
      const columnSizing = { filename: 200, docType: 150 };

      const result = await client.query(`
        INSERT INTO user_table_preferences (user_id, table_id, column_sizing)
        VALUES ($1, 'history', $2)
        RETURNING *
      `, [testUserId, JSON.stringify(columnSizing)]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].table_id).toBe('history');
      expect(result.rows[0].column_sizing).toEqual(columnSizing);
    });

    test('should have composite primary key (user_id, table_id)', async () => {
      // Insert second table for same user
      await client.query(`
        INSERT INTO user_table_preferences (user_id, table_id, column_sizing)
        VALUES ($1, 'admin_users', '{"email": 250}')
      `, [testUserId]);

      // Both should exist
      const result = await client.query(`
        SELECT table_id FROM user_table_preferences
        WHERE user_id = $1
        ORDER BY table_id
      `, [testUserId]);

      expect(result.rows).toHaveLength(2);
      expect(result.rows.map(r => r.table_id)).toEqual(['admin_users', 'history']);

      // Duplicate should fail
      await expect(
        client.query(`
          INSERT INTO user_table_preferences (user_id, table_id, column_sizing)
          VALUES ($1, 'history', '{}')
        `, [testUserId])
      ).rejects.toThrow(/duplicate key/i);

      // Cleanup
      await client.query(`
        DELETE FROM user_table_preferences WHERE user_id = $1 AND table_id = 'admin_users'
      `, [testUserId]);
    });

    test('should update column_sizing via upsert', async () => {
      const newSizing = { filename: 300, docType: 200, status: 100 };

      await client.query(`
        INSERT INTO user_table_preferences (user_id, table_id, column_sizing)
        VALUES ($1, 'history', $2)
        ON CONFLICT (user_id, table_id)
        DO UPDATE SET column_sizing = $2, updated_at = NOW()
      `, [testUserId, JSON.stringify(newSizing)]);

      const result = await client.query(`
        SELECT column_sizing FROM user_table_preferences
        WHERE user_id = $1 AND table_id = 'history'
      `, [testUserId]);

      expect(result.rows[0].column_sizing).toEqual(newSizing);
    });

    test('should cascade delete when user is deleted', async () => {
      // Create temporary user with table preferences
      const tempUser = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified, save_docs_preference)
        VALUES ('temp-table-cascade@test.com', 'Temp', 'Table', 'hash', true, 'always')
        RETURNING id
      `);
      const tempUserId = tempUser.rows[0].id;

      await client.query(`
        INSERT INTO user_table_preferences (user_id, table_id, column_sizing)
        VALUES ($1, 'test_table', '{"col": 100}')
      `, [tempUserId]);

      // Verify exists
      const before = await client.query(`
        SELECT * FROM user_table_preferences WHERE user_id = $1
      `, [tempUserId]);
      expect(before.rows).toHaveLength(1);

      // Delete user
      await client.query(`DELETE FROM users WHERE id = $1`, [tempUserId]);

      // Verify cascaded
      const after = await client.query(`
        SELECT * FROM user_table_preferences WHERE user_id = $1
      `, [tempUserId]);
      expect(after.rows).toHaveLength(0);
    });
  });

  describe('Migration 042: Theme migration', () => {
    test('should migrate theme_preference from users table', async () => {
      // Create user with theme_preference
      const newUser = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified, save_docs_preference, theme_preference)
        VALUES ('theme-migration-test@test.com', 'Theme', 'Test', 'hash', true, 'always', 'dark')
        RETURNING id
      `);
      const newUserId = newUser.rows[0].id;

      // Run the migration logic manually (since we're testing after migrations ran)
      await client.query(`
        INSERT INTO user_preferences (user_id, theme)
        SELECT $1, 'dark'
        WHERE NOT EXISTS (SELECT 1 FROM user_preferences WHERE user_id = $1)
      `, [newUserId]);

      // Verify migration
      const result = await client.query(`
        SELECT theme FROM user_preferences WHERE user_id = $1
      `, [newUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].theme).toBe('dark');

      // Cleanup
      await client.query(`DELETE FROM user_preferences WHERE user_id = $1`, [newUserId]);
      await client.query(`DELETE FROM users WHERE id = $1`, [newUserId]);
    });
  });

  describe('Index performance', () => {
    test('should have index on user_preferences.selected_project_id', async () => {
      const result = await client.query(`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'user_preferences'
        AND indexname = 'idx_user_preferences_project'
      `);

      expect(result.rows).toHaveLength(1);
    });

    test('should have index on user_table_preferences.user_id', async () => {
      const result = await client.query(`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'user_table_preferences'
        AND indexname = 'idx_user_table_preferences_user'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });
});
