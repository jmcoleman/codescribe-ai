/**
 * Migration 021 Test: Create workspace_files table
 * Tests schema creation, indexes, constraints, and CASCADE behavior
 * Run in Docker sandbox: npm run test:db -- migrations-021
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

describe('Migration 021: Create workspace_files table', () => {
  let client;
  let testUserId;

  beforeAll(async () => {
    client = await pool.connect();

    // Create test user
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
      VALUES ('migration21@test.com', 'Migration', 'Test', 'hash', true)
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

  describe('Table Structure', () => {
    test('should create workspace_files table', async () => {
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'workspace_files'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].table_name).toBe('workspace_files');
    });

    test('should have all required columns', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'workspace_files'
        ORDER BY ordinal_position
      `);

      const columnNames = result.rows.map(r => r.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('filename');
      expect(columnNames).toContain('language');
      expect(columnNames).toContain('file_size_bytes');
      expect(columnNames).toContain('doc_type');
      expect(columnNames).toContain('origin');
      expect(columnNames).toContain('github_repo');
      expect(columnNames).toContain('github_path');
      expect(columnNames).toContain('github_sha');
      expect(columnNames).toContain('github_branch');
      expect(columnNames).toContain('document_id');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('should have UUID primary key', async () => {
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'workspace_files' AND column_name = 'id'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toBe('uuid');
    });

    test('should have user_id foreign key to users table', async () => {
      const result = await client.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'workspace_files'
          AND kcu.column_name = 'user_id'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('users');
    });

    test('should have document_id foreign key to generated_documents table', async () => {
      const result = await client.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'workspace_files'
          AND kcu.column_name = 'document_id'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('generated_documents');
    });
  });

  describe('Check Constraints', () => {
    test('should enforce doc_type CHECK constraint', async () => {
      // Valid doc_type should work
      await expect(
        client.query(`
          INSERT INTO workspace_files (user_id, filename, language, file_size_bytes, doc_type, origin)
          VALUES ($1, 'test.js', 'javascript', 100, 'README', 'upload')
        `, [testUserId])
      ).resolves.toBeDefined();

      // Invalid doc_type should fail
      await expect(
        client.query(`
          INSERT INTO workspace_files (user_id, filename, language, file_size_bytes, doc_type, origin)
          VALUES ($1, 'test2.js', 'javascript', 100, 'INVALID', 'upload')
        `, [testUserId])
      ).rejects.toThrow();
    });

    test('should enforce origin CHECK constraint', async () => {
      // Valid origin should work
      await expect(
        client.query(`
          INSERT INTO workspace_files (user_id, filename, language, file_size_bytes, doc_type, origin)
          VALUES ($1, 'test3.js', 'javascript', 100, 'README', 'github')
        `, [testUserId])
      ).resolves.toBeDefined();

      // Invalid origin should fail
      await expect(
        client.query(`
          INSERT INTO workspace_files (user_id, filename, language, file_size_bytes, doc_type, origin)
          VALUES ($1, 'test4.js', 'javascript', 100, 'README', 'INVALID')
        `, [testUserId])
      ).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    test('should have index on user_id and created_at', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'workspace_files'
          AND indexname = 'idx_workspace_files_user_created'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('user_id');
      expect(result.rows[0].indexdef).toContain('created_at');
    });

    test('should have index on user_id and filename', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'workspace_files'
          AND indexname = 'idx_workspace_files_user_filename'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('user_id');
      expect(result.rows[0].indexdef).toContain('filename');
    });

    test('should have index on document_id', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'workspace_files'
          AND indexname = 'idx_workspace_files_document_id'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('document_id');
    });

    test('should have index on github_repo', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'workspace_files'
          AND indexname = 'idx_workspace_files_github_repo'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('github_repo');
    });
  });

  describe('Triggers', () => {
    test('should auto-update updated_at timestamp on UPDATE', async () => {
      // Insert test workspace file
      const insertResult = await client.query(`
        INSERT INTO workspace_files (user_id, filename, language, file_size_bytes, doc_type, origin)
        VALUES ($1, 'trigger-test.js', 'javascript', 100, 'README', 'upload')
        RETURNING id, updated_at
      `, [testUserId]);

      const workspaceId = insertResult.rows[0].id;
      const originalUpdatedAt = insertResult.rows[0].updated_at;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update the workspace file
      await client.query(`
        UPDATE workspace_files
        SET filename = 'updated-test.js'
        WHERE id = $1
      `, [workspaceId]);

      // Check that updated_at changed
      const selectResult = await client.query(`
        SELECT updated_at
        FROM workspace_files
        WHERE id = $1
      `, [workspaceId]);

      const newUpdatedAt = selectResult.rows[0].updated_at;
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());

      // Cleanup
      await client.query(`DELETE FROM workspace_files WHERE id = $1`, [workspaceId]);
    });
  });

  describe('CASCADE Behavior', () => {
    test('should CASCADE delete workspace files when user is deleted (GDPR)', async () => {
      // Create test user
      const userResult = await client.query(`
        INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
        VALUES ('cascade-test@test.com', 'Cascade', 'Test', 'hash', true)
        RETURNING id
      `);
      const cascadeUserId = userResult.rows[0].id;

      // Insert workspace file
      const workspaceResult = await client.query(`
        INSERT INTO workspace_files (user_id, filename, language, file_size_bytes, doc_type, origin)
        VALUES ($1, 'cascade-test.js', 'javascript', 100, 'README', 'upload')
        RETURNING id
      `, [cascadeUserId]);
      const workspaceId = workspaceResult.rows[0].id;

      // Verify workspace file exists
      const beforeDelete = await client.query(`
        SELECT COUNT(*) FROM workspace_files WHERE id = $1
      `, [workspaceId]);
      expect(parseInt(beforeDelete.rows[0].count)).toBe(1);

      // Delete user (should CASCADE to workspace_files)
      await client.query(`DELETE FROM users WHERE id = $1`, [cascadeUserId]);

      // Verify workspace file was CASCADE deleted
      const afterDelete = await client.query(`
        SELECT COUNT(*) FROM workspace_files WHERE id = $1
      `, [workspaceId]);
      expect(parseInt(afterDelete.rows[0].count)).toBe(0);
    });

    test('should SET NULL document_id when generated_document is deleted', async () => {
      // Create generated document
      const docResult = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'doc-test.js', 'javascript', 2100,
          '# Test', '{"score": 92, "grade": "A"}'::jsonb, 'README',
          'upload', 'claude', 'claude-sonnet-4-5-20250929'
        ) RETURNING id
      `, [testUserId]);
      const documentId = docResult.rows[0].id;

      // Create workspace file linked to document
      const workspaceResult = await client.query(`
        INSERT INTO workspace_files (
          user_id, filename, language, file_size_bytes, doc_type, origin, document_id
        ) VALUES (
          $1, 'doc-test.js', 'javascript', 2100, 'README', 'upload', $2
        ) RETURNING id
      `, [testUserId, documentId]);
      const workspaceId = workspaceResult.rows[0].id;

      // Verify document_id is set
      const beforeDelete = await client.query(`
        SELECT document_id FROM workspace_files WHERE id = $1
      `, [workspaceId]);
      expect(beforeDelete.rows[0].document_id).toBe(documentId);

      // Delete generated document (should SET NULL on workspace_files)
      await client.query(`DELETE FROM generated_documents WHERE id = $1`, [documentId]);

      // Verify document_id was SET NULL
      const afterDelete = await client.query(`
        SELECT document_id FROM workspace_files WHERE id = $1
      `, [workspaceId]);
      expect(afterDelete.rows[0].document_id).toBeNull();

      // Cleanup
      await client.query(`DELETE FROM workspace_files WHERE id = $1`, [workspaceId]);
    });
  });

  describe('Data Operations', () => {
    test('should insert workspace file with all fields', async () => {
      const result = await client.query(`
        INSERT INTO workspace_files (
          user_id, filename, language, file_size_bytes, doc_type, origin,
          github_repo, github_path, github_sha, github_branch
        ) VALUES (
          $1, 'full-test.js', 'javascript', 1500,
          'API', 'github',
          'owner/repo', 'src/test.js', 'abc123', 'main'
        ) RETURNING id, filename, github_repo
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].filename).toBe('full-test.js');
      expect(result.rows[0].github_repo).toBe('owner/repo');

      // Cleanup
      await client.query(`DELETE FROM workspace_files WHERE id = $1`, [result.rows[0].id]);
    });

    test('should retrieve user workspace files ordered by created_at', async () => {
      // Insert multiple workspace files
      await client.query(`
        INSERT INTO workspace_files (user_id, filename, language, file_size_bytes, doc_type, origin)
        VALUES
          ($1, 'file1.js', 'javascript', 100, 'README', 'upload'),
          ($1, 'file2.js', 'javascript', 200, 'API', 'upload'),
          ($1, 'file3.js', 'javascript', 300, 'JSDOC', 'upload')
      `, [testUserId]);

      const result = await client.query(`
        SELECT filename
        FROM workspace_files
        WHERE user_id = $1
        ORDER BY created_at ASC
      `, [testUserId]);

      expect(result.rows.length).toBeGreaterThanOrEqual(3);
      const filenames = result.rows.map(r => r.filename);
      expect(filenames).toContain('file1.js');
      expect(filenames).toContain('file2.js');
      expect(filenames).toContain('file3.js');

      // Cleanup
      await client.query(`DELETE FROM workspace_files WHERE user_id = $1`, [testUserId]);
    });
  });
});
