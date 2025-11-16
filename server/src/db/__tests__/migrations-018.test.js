/**
 * Migration 018 Test: Create generated_documents table
 * Tests schema creation, indexes, constraints, and CASCADE behavior
 * Run in Docker sandbox: npm run test:db -- migrations-018
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

describe('Migration 018: Create generated_documents table', () => {
  let client;
  let testUserId;

  beforeAll(async () => {
    client = await pool.connect();

    // Create test user
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
      VALUES ('migration18@test.com', 'Migration', 'Test', 'hash', true)
      RETURNING id
    `);
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await client.query(`DELETE FROM users WHERE id = $1`, [testUserId]);

    if (client) {
      client.release();
    }
    await pool.end();
  });

  describe('User Preferences Columns', () => {
    test('should add save_docs_preference column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'save_docs_preference'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].column_name).toBe('save_docs_preference');
      expect(result.rows[0].data_type).toBe('character varying');
      expect(result.rows[0].column_default).toBe("'ask'::character varying");
      expect(result.rows[0].is_nullable).toBe('NO');
    });

    test('should add docs_consent_shown_at column to users table', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'docs_consent_shown_at'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].column_name).toBe('docs_consent_shown_at');
      expect(result.rows[0].data_type).toBe('timestamp with time zone');
      expect(result.rows[0].is_nullable).toBe('YES');
    });

    test('should have check constraint for save_docs_preference values', async () => {
      // Test valid values
      await expect(
        client.query(`UPDATE users SET save_docs_preference = 'always' WHERE id = $1`, [testUserId])
      ).resolves.toBeDefined();

      await expect(
        client.query(`UPDATE users SET save_docs_preference = 'never' WHERE id = $1`, [testUserId])
      ).resolves.toBeDefined();

      await expect(
        client.query(`UPDATE users SET save_docs_preference = 'ask' WHERE id = $1`, [testUserId])
      ).resolves.toBeDefined();

      // Test invalid value
      await expect(
        client.query(`UPDATE users SET save_docs_preference = 'invalid' WHERE id = $1`, [testUserId])
      ).rejects.toThrow(/violates check constraint/);
    });
  });

  describe('Generated Documents Table', () => {
    test('should create generated_documents table', async () => {
      const result = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = 'generated_documents'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].table_name).toBe('generated_documents');
    });

    test('should have all required columns', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'generated_documents'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(r => r.column_name);

      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('filename');
      expect(columns).toContain('language');
      expect(columns).toContain('file_size_bytes');
      expect(columns).toContain('documentation');
      expect(columns).toContain('quality_score');
      expect(columns).toContain('doc_type');
      expect(columns).toContain('generated_at');
      expect(columns).toContain('origin');
      expect(columns).toContain('github_repo');
      expect(columns).toContain('github_path');
      expect(columns).toContain('github_sha');
      expect(columns).toContain('github_branch');
      expect(columns).toContain('provider');
      expect(columns).toContain('model');
      expect(columns).toContain('input_tokens');
      expect(columns).toContain('output_tokens');
      expect(columns).toContain('was_cached');
      expect(columns).toContain('latency_ms');
      expect(columns).toContain('is_ephemeral');
      expect(columns).toContain('deleted_at');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('should have all required indexes', async () => {
      const result = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'generated_documents'
        ORDER BY indexname
      `);

      const indexes = result.rows.map(r => r.indexname);

      expect(indexes).toContain('generated_documents_pkey'); // Primary key
      expect(indexes).toContain('idx_generated_docs_user_generated_at');
      expect(indexes).toContain('idx_generated_docs_user_filename');
      expect(indexes).toContain('idx_generated_docs_user_ephemeral');
      expect(indexes).toContain('idx_generated_docs_github_repo');
      expect(indexes).toContain('idx_generated_docs_deleted_at');
    });

    test('should have foreign key constraint on user_id with ON DELETE CASCADE', async () => {
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
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
          AND rc.constraint_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'generated_documents'
          AND kcu.column_name = 'user_id'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('users');
      expect(result.rows[0].foreign_column_name).toBe('id');
      expect(result.rows[0].delete_rule).toBe('CASCADE');
    });

    test('should have check constraints for doc_type and origin', async () => {
      const result = await client.query(`
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_schema = 'public'
          AND constraint_name LIKE '%generated_documents%'
        ORDER BY constraint_name
      `);

      const constraints = result.rows.map(r => ({
        name: r.constraint_name,
        clause: r.check_clause
      }));

      // Check doc_type constraint
      const docTypeConstraint = constraints.find(c => c.clause.includes('doc_type'));
      expect(docTypeConstraint).toBeDefined();
      expect(docTypeConstraint.clause).toContain('README');
      expect(docTypeConstraint.clause).toContain('JSDOC');
      expect(docTypeConstraint.clause).toContain('API');
      expect(docTypeConstraint.clause).toContain('ARCHITECTURE');

      // Check origin constraint
      const originConstraint = constraints.find(c => c.clause.includes('origin'));
      expect(originConstraint).toBeDefined();
      expect(originConstraint.clause).toContain('upload');
      expect(originConstraint.clause).toContain('github');
      expect(originConstraint.clause).toContain('paste');
      expect(originConstraint.clause).toContain('sample');
    });
  });

  describe('Data Integrity', () => {
    let testDocId;

    afterEach(async () => {
      // Clean up test document
      if (testDocId) {
        await client.query(`DELETE FROM generated_documents WHERE id = $1`, [testDocId]);
        testDocId = null;
      }
    });

    test('should insert a document with all fields', async () => {
      const result = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, github_repo, github_path, github_sha,
          provider, model, input_tokens, output_tokens,
          was_cached, latency_ms, is_ephemeral
        ) VALUES (
          $1, 'test.js', 'javascript', 2100,
          '# Test Module', '{"score": 92, "grade": "A"}'::jsonb, 'README',
          'github', 'owner/repo', 'src/test.js', 'abc123',
          'claude', 'claude-sonnet-4-5-20250929', 500, 1000,
          true, 1250, false
        )
        RETURNING id, created_at, updated_at
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      testDocId = result.rows[0].id;

      expect(result.rows[0].created_at).toBeDefined();
      expect(result.rows[0].updated_at).toBeDefined();
    });

    test('should reject invalid doc_type', async () => {
      await expect(
        client.query(`
          INSERT INTO generated_documents (
            user_id, filename, language, file_size_bytes,
            documentation, quality_score, doc_type,
            origin, provider, model
          ) VALUES (
            $1, 'test.js', 'javascript', 2100,
            '# Test', '{}'::jsonb, 'INVALID',
            'upload', 'claude', 'model'
          )
        `, [testUserId])
      ).rejects.toThrow(/violates check constraint/);
    });

    test('should reject invalid origin', async () => {
      await expect(
        client.query(`
          INSERT INTO generated_documents (
            user_id, filename, language, file_size_bytes,
            documentation, quality_score, doc_type,
            origin, provider, model
          ) VALUES (
            $1, 'test.js', 'javascript', 2100,
            '# Test', '{}'::jsonb, 'README',
            'invalid', 'claude', 'model'
          )
        `, [testUserId])
      ).rejects.toThrow(/violates check constraint/);
    });

    test('should support soft delete', async () => {
      const insertResult = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'test.js', 'javascript', 2100,
          '# Test', '{}'::jsonb, 'README',
          'upload', 'claude', 'model'
        )
        RETURNING id
      `, [testUserId]);

      testDocId = insertResult.rows[0].id;

      // Soft delete
      await client.query(`
        UPDATE generated_documents
        SET deleted_at = NOW()
        WHERE id = $1
      `, [testDocId]);

      // Verify soft delete
      const result = await client.query(`
        SELECT id, deleted_at
        FROM generated_documents
        WHERE id = $1
      `, [testDocId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].deleted_at).not.toBeNull();
    });

    test('should CASCADE delete when user is deleted', async () => {
      // Create temp user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('cascade-test@test.com', 'Cascade', 'Test', 'hash', true)
        RETURNING id
      `);
      const tempUserId = userResult.rows[0].id;

      // Create document for temp user
      const docResult = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'test.js', 'javascript', 2100,
          '# Test', '{}'::jsonb, 'README',
          'upload', 'claude', 'model'
        )
        RETURNING id
      `, [tempUserId]);

      const tempDocId = docResult.rows[0].id;

      // Delete user (should CASCADE to document)
      await client.query(`DELETE FROM users WHERE id = $1`, [tempUserId]);

      // Verify document was also deleted
      const result = await client.query(`
        SELECT id FROM generated_documents WHERE id = $1
      `, [tempDocId]);

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('Trigger Functionality', () => {
    test('should have updated_at trigger', async () => {
      const result = await client.query(`
        SELECT trigger_name, event_manipulation, event_object_table
        FROM information_schema.triggers
        WHERE trigger_name = 'trigger_update_generated_documents_updated_at'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].event_manipulation).toBe('UPDATE');
      expect(result.rows[0].event_object_table).toBe('generated_documents');
    });

    test('should auto-update updated_at on document update', async () => {
      // Insert document
      const insertResult = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'test.js', 'javascript', 2100,
          '# Test', '{}'::jsonb, 'README',
          'upload', 'claude', 'model'
        )
        RETURNING id, created_at, updated_at
      `, [testUserId]);

      const docId = insertResult.rows[0].id;
      const originalUpdatedAt = insertResult.rows[0].updated_at;

      // Wait 100ms
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update document
      await client.query(`
        UPDATE generated_documents
        SET documentation = '# Updated Test'
        WHERE id = $1
      `, [docId]);

      // Check updated_at changed
      const result = await client.query(`
        SELECT updated_at FROM generated_documents WHERE id = $1
      `, [docId]);

      expect(new Date(result.rows[0].updated_at).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );

      // Clean up
      await client.query(`DELETE FROM generated_documents WHERE id = $1`, [docId]);
    });
  });
});
