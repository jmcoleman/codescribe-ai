/**
 * Migration 022 Test: Add OPENAPI to doc_type check constraint
 * Tests that OPENAPI doc type is accepted and invalid types still rejected
 * Run in Docker sandbox: npm run test:db -- migrations-022
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

describe('Migration 022: Add OPENAPI to doc_type check constraint', () => {
  let client;
  let testUserId;

  beforeAll(async () => {
    client = await pool.connect();

    // Create test user
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, password_hash, email_verified, save_docs_preference)
      VALUES ('migration22@test.com', 'Migration', 'Test', 'hash', true, 'always')
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

  describe('Check Constraint Updates', () => {
    test('should have updated doc_type constraint', async () => {
      const result = await client.query(`
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name = 'generated_documents_doc_type_check'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].check_clause).toContain('OPENAPI');
    });

    test('should accept OPENAPI doc type in generated_documents', async () => {
      const result = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'api.yaml', 'yaml', 3500,
          'openapi: 3.0.0\ninfo:\n  title: Test API',
          '{"score": 85, "grade": "B"}'::jsonb,
          'OPENAPI',
          'upload', 'openai', 'gpt-5.1'
        ) RETURNING id, doc_type
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].doc_type).toBe('OPENAPI');

      // Cleanup
      await client.query(`DELETE FROM generated_documents WHERE id = $1`, [result.rows[0].id]);
    });

    test('should accept README doc type (existing)', async () => {
      const result = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'README.md', 'markdown', 2000,
          '# Test Project',
          '{"score": 90, "grade": "A"}'::jsonb,
          'README',
          'upload', 'claude', 'claude-sonnet-4-5-20250929'
        ) RETURNING id, doc_type
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].doc_type).toBe('README');

      // Cleanup
      await client.query(`DELETE FROM generated_documents WHERE id = $1`, [result.rows[0].id]);
    });

    test('should accept JSDOC doc type (existing)', async () => {
      const result = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'utils.js', 'javascript', 1500,
          '/** @function test */',
          '{"score": 88, "grade": "B"}'::jsonb,
          'JSDOC',
          'upload', 'claude', 'claude-sonnet-4-5-20250929'
        ) RETURNING id, doc_type
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].doc_type).toBe('JSDOC');

      // Cleanup
      await client.query(`DELETE FROM generated_documents WHERE id = $1`, [result.rows[0].id]);
    });

    test('should accept API doc type (existing)', async () => {
      const result = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'routes.js', 'javascript', 2500,
          '# API Documentation',
          '{"score": 92, "grade": "A"}'::jsonb,
          'API',
          'upload', 'claude', 'claude-sonnet-4-5-20250929'
        ) RETURNING id, doc_type
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].doc_type).toBe('API');

      // Cleanup
      await client.query(`DELETE FROM generated_documents WHERE id = $1`, [result.rows[0].id]);
    });

    test('should accept ARCHITECTURE doc type (existing)', async () => {
      const result = await client.query(`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, provider, model
        ) VALUES (
          $1, 'system.js', 'javascript', 4000,
          '# System Architecture',
          '{"score": 94, "grade": "A"}'::jsonb,
          'ARCHITECTURE',
          'upload', 'claude', 'claude-sonnet-4-5-20250929'
        ) RETURNING id, doc_type
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].doc_type).toBe('ARCHITECTURE');

      // Cleanup
      await client.query(`DELETE FROM generated_documents WHERE id = $1`, [result.rows[0].id]);
    });

    test('should reject invalid doc types', async () => {
      await expect(
        client.query(`
          INSERT INTO generated_documents (
            user_id, filename, language, file_size_bytes,
            documentation, quality_score, doc_type,
            origin, provider, model
          ) VALUES (
            $1, 'invalid.md', 'markdown', 1000,
            '# Invalid',
            '{"score": 50, "grade": "F"}'::jsonb,
            'INVALID_TYPE',
            'upload', 'claude', 'claude-sonnet-4-5-20250929'
          )
        `, [testUserId])
      ).rejects.toThrow(/violates check constraint/);
    });

    test('should accept all 5 valid doc types', async () => {
      const validTypes = ['README', 'JSDOC', 'API', 'ARCHITECTURE', 'OPENAPI'];

      for (const docType of validTypes) {
        const result = await client.query(`
          INSERT INTO generated_documents (
            user_id, filename, language, file_size_bytes,
            documentation, quality_score, doc_type,
            origin, provider, model
          ) VALUES (
            $1, $2, 'javascript', 1000,
            '# Test',
            '{"score": 85, "grade": "B"}'::jsonb,
            $3,
            'upload', 'claude', 'claude-sonnet-4-5-20250929'
          ) RETURNING id, doc_type
        `, [testUserId, `test-${docType}.js`, docType]);

        expect(result.rows[0].doc_type).toBe(docType);

        // Cleanup
        await client.query(`DELETE FROM generated_documents WHERE id = $1`, [result.rows[0].id]);
      }
    });
  });

  describe('workspace_files table compatibility', () => {
    test('should accept OPENAPI doc type in workspace_files', async () => {
      const result = await client.query(`
        INSERT INTO workspace_files (
          user_id, filename, language, file_size_bytes, doc_type, origin
        ) VALUES (
          $1, 'openapi-spec.yaml', 'yaml', 3500, 'OPENAPI', 'upload'
        ) RETURNING id, doc_type
      `, [testUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].doc_type).toBe('OPENAPI');

      // Cleanup
      await client.query(`DELETE FROM workspace_files WHERE id = $1`, [result.rows[0].id]);
    });

    test('should enforce doc_type constraint in workspace_files', async () => {
      await expect(
        client.query(`
          INSERT INTO workspace_files (
            user_id, filename, language, file_size_bytes, doc_type, origin
          ) VALUES (
            $1, 'invalid.yaml', 'yaml', 1000, 'INVALID_TYPE', 'upload'
          )
        `, [testUserId])
      ).rejects.toThrow(/violates check constraint/);
    });
  });
});
