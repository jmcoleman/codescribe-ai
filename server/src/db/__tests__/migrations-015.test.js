/**
 * Migration 012 Tests: Add User Roles and Generic Audit Logging
 *
 * Tests the role column addition and user_audit_log table creation
 * Run in Docker sandbox: npm run test:db -- migrations-012
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

describe('Migration 012: Add User Roles and Audit Logging', () => {
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

  describe('Schema Changes - Role Column', () => {
    it('should add role column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        column_name: 'role',
        data_type: 'character varying',
        is_nullable: 'NO',
      });
      expect(result.rows[0].column_default).toContain('user');
    });

    it('should have check constraint for valid roles', async () => {
      const result = await client.query(`
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name = 'check_valid_role'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].check_clause).toContain('user');
      expect(result.rows[0].check_clause).toContain('support');
      expect(result.rows[0].check_clause).toContain('admin');
      expect(result.rows[0].check_clause).toContain('super_admin');
    });

    it('should create idx_users_role index', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_role'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexname).toBe('idx_users_role');
      expect(result.rows[0].indexdef).toContain('role');
    });
  });

  describe('Schema Changes - Audit Table', () => {
    it('should create user_audit_log table', async () => {
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'user_audit_log'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].table_name).toBe('user_audit_log');
    });

    it('should have all required columns in user_audit_log', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_audit_log'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map((r) => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('user_email');
      expect(columns).toContain('changed_by_id');
      expect(columns).toContain('field_name');
      expect(columns).toContain('old_value');
      expect(columns).toContain('new_value');
      expect(columns).toContain('change_type');
      expect(columns).toContain('reason');
      expect(columns).toContain('changed_at');
      expect(columns).toContain('metadata');
    });

    it('should have foreign key constraint on user_id with ON DELETE RESTRICT', async () => {
      const result = await client.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'user_audit_log'
          AND kcu.column_name = 'user_id'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('users');
      expect(result.rows[0].foreign_column_name).toBe('id');
      expect(result.rows[0].delete_rule).toBe('RESTRICT');
    });

    it('should have all required indexes on user_audit_log', async () => {
      const result = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'user_audit_log'
        ORDER BY indexname
      `);

      const indexes = result.rows.map((r) => r.indexname);
      expect(indexes).toContain('idx_user_audit_user_id');
      expect(indexes).toContain('idx_user_audit_field_name');
      expect(indexes).toContain('idx_user_audit_user_field');
      expect(indexes).toContain('idx_user_audit_changed_by_id');
      expect(indexes).toContain('idx_user_audit_changed_at');
      expect(indexes).toContain('idx_user_audit_user_email');
    });
  });

  describe('Trigger Function', () => {
    it('should create audit_user_changes trigger function', async () => {
      const result = await client.query(`
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE routine_name = 'audit_user_changes'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].routine_type).toBe('FUNCTION');
    });

    it('should create trigger_audit_user_changes trigger', async () => {
      const result = await client.query(`
        SELECT trigger_name, event_manipulation, event_object_table, action_timing
        FROM information_schema.triggers
        WHERE trigger_name = 'trigger_audit_user_changes'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].event_manipulation).toBe('UPDATE');
      expect(result.rows[0].event_object_table).toBe('users');
      expect(result.rows[0].action_timing).toBe('AFTER');
    });
  });

  describe('Data Integrity - Role', () => {
    it('should default role to "user" for new users', async () => {
      const result = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('role-test-default@example.com', 'Test', 'User', 'hash', true)
        RETURNING id, email, role
      `);

      expect(result.rows[0].role).toBe('user');

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [result.rows[0].id]);
    });

    it('should allow valid role values', async () => {
      const roles = ['user', 'support', 'admin', 'super_admin'];

      for (const role of roles) {
        const result = await client.query(`
          INSERT INTO users (email, first_name, last_name, password_hash, email_verified, role)
          VALUES ($1, 'Test', 'User', 'hash', true, $2)
          RETURNING id, role
        `, [`role-test-${role}@example.com`, role]);

        expect(result.rows[0].role).toBe(role);

        // Cleanup
        await client.query(`DELETE FROM users WHERE id = $1`, [result.rows[0].id]);
      }
    });

    it('should reject invalid role values', async () => {
      await expect(
        client.query(`
          INSERT INTO users (email, first_name, last_name, password_hash, email_verified, role)
          VALUES ('role-test-invalid@example.com', 'Test', 'User', 'hash', true, 'invalid_role')
        `)
      ).rejects.toThrow();
    });
  });

  describe('Audit Trigger Functionality', () => {
    it('should create audit entry when role is updated', async () => {
      // Create test user
      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('audit-test-role@example.com', 'Test', 'User', 'hash', true)
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Update role
      await client.query(`
        UPDATE users SET role = 'admin' WHERE id = $1
      `, [userId]);

      // Check audit log
      const auditResult = await client.query(`
        SELECT field_name, old_value, new_value, change_type
        FROM user_audit_log
        WHERE user_id = $1 AND field_name = 'role'
      `, [userId]);

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0]).toMatchObject({
        field_name: 'role',
        old_value: 'user',
        new_value: 'admin',
        change_type: 'update',
      });

      // Cleanup
      await client.query(`DELETE FROM user_audit_log WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should create audit entries for multiple field changes', async () => {
      // Create test user
      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('audit-test-multi@example.com', 'John', 'Doe', 'hash', false)
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Update multiple fields
      await client.query(`
        UPDATE users
        SET first_name = 'Jane',
            last_name = 'Smith',
            role = 'support',
            email_verified = true
        WHERE id = $1
      `, [userId]);

      // Check audit log
      const auditResult = await client.query(`
        SELECT field_name, old_value, new_value
        FROM user_audit_log
        WHERE user_id = $1
        ORDER BY field_name
      `, [userId]);

      expect(auditResult.rows).toHaveLength(4);

      const fieldNames = auditResult.rows.map((r) => r.field_name);
      expect(fieldNames).toContain('first_name');
      expect(fieldNames).toContain('last_name');
      expect(fieldNames).toContain('role');
      expect(fieldNames).toContain('email_verified');

      // Cleanup
      await client.query(`DELETE FROM user_audit_log WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should NOT create audit entry on INSERT (only on UPDATE)', async () => {
      // Create test user
      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('audit-test-insert@example.com', 'Test', 'User', 'hash', true)
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Check audit log (should be empty)
      const auditResult = await client.query(`
        SELECT * FROM user_audit_log WHERE user_id = $1
      `, [userId]);

      expect(auditResult.rows).toHaveLength(0);

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should NOT create audit entry if field value did not change', async () => {
      // Create test user
      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('audit-test-nochange@example.com', 'Test', 'User', 'hash', true)
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Update role to admin
      await client.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [userId]);

      // Update role to admin again (no change)
      await client.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [userId]);

      // Check audit log (should only have 1 entry)
      const auditResult = await client.query(`
        SELECT * FROM user_audit_log WHERE user_id = $1 AND field_name = 'role'
      `, [userId]);

      expect(auditResult.rows).toHaveLength(1);

      // Cleanup
      await client.query(`DELETE FROM user_audit_log WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should create "delete" type audit entry when soft deleting user', async () => {
      // Create test user
      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('audit-test-delete@example.com', 'Test', 'User', 'hash', true)
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Soft delete user
      await client.query(`UPDATE users SET deleted_at = NOW() WHERE id = $1`, [userId]);

      // Check audit log
      const auditResult = await client.query(`
        SELECT field_name, old_value, new_value, change_type
        FROM user_audit_log
        WHERE user_id = $1 AND field_name = 'deleted_at'
      `, [userId]);

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0]).toMatchObject({
        field_name: 'deleted_at',
        change_type: 'delete',
      });
      expect(auditResult.rows[0].old_value).toBeNull();
      expect(auditResult.rows[0].new_value).not.toBeNull();

      // Cleanup
      await client.query(`DELETE FROM user_audit_log WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('should denormalize user_email in audit entries', async () => {
      // Create test user
      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('audit-test-email-denorm@example.com', 'Test', 'User', 'hash', true)
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Update role
      await client.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [userId]);

      // Check audit log has user_email
      const auditResult = await client.query(`
        SELECT user_email FROM user_audit_log WHERE user_id = $1
      `, [userId]);

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].user_email).toBe('audit-test-email-denorm@example.com');

      // Cleanup
      await client.query(`DELETE FROM user_audit_log WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });
  });

  describe('Hard Delete Protection', () => {
    it('should block hard delete when audit entries exist (ON DELETE RESTRICT)', async () => {
      // Create test user
      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('audit-test-protect@example.com', 'Test', 'User', 'hash', true)
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Update role to create audit entry
      await client.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [userId]);

      // Try to hard delete user (should fail)
      await expect(
        client.query(`DELETE FROM users WHERE id = $1`, [userId])
      ).rejects.toThrow();

      // Cleanup (delete audit first, then user)
      await client.query(`DELETE FROM user_audit_log WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing user queries', async () => {
      // Create a user and query all standard fields
      const createResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('compatibility-test@example.com', 'Test', 'User', 'hash', true)
        RETURNING id
      `);

      const userId = createResult.rows[0].id;

      // Standard query used throughout the app
      const queryResult = await client.query(`
        SELECT id, email, first_name, last_name, role, created_at
        FROM users
        WHERE id = $1
      `, [userId]);

      expect(queryResult.rows).toHaveLength(1);
      expect(queryResult.rows[0].id).toBe(userId);
      expect(queryResult.rows[0].role).toBe('user');

      // Cleanup
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });
  });
});
