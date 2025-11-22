-- Migration 022: Add OPENAPI to doc_type check constraint
-- Created: 2025-11-22
-- Description: Extends the doc_type check constraint to support OPENAPI spec generation
--
-- Context:
-- OPENAPI doc type was added in docTypeConfig.js but the database constraint
-- was not updated, causing constraint violations when saving OPENAPI documents.

-- Drop the old constraint
ALTER TABLE generated_documents
  DROP CONSTRAINT IF EXISTS generated_documents_doc_type_check;

-- Add the new constraint with OPENAPI included
ALTER TABLE generated_documents
  ADD CONSTRAINT generated_documents_doc_type_check
  CHECK (doc_type IN ('README', 'JSDOC', 'API', 'ARCHITECTURE', 'OPENAPI'));

-- Verify the constraint was updated
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'generated_documents_doc_type_check';

-- Test the migration
DO $$
DECLARE
  test_user_id INTEGER;
  test_doc_id UUID;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified, save_docs_preference)
  VALUES ('openapi-test@example.com', 'OpenAPI', 'Test', 'hash', true, 'always')
  RETURNING id INTO test_user_id;

  -- Test OPENAPI doc type (should succeed now)
  INSERT INTO generated_documents (
    user_id, filename, language, file_size_bytes,
    documentation, quality_score, doc_type,
    origin, provider, model
  ) VALUES (
    test_user_id, 'api.yaml', 'yaml', 3500,
    'openapi: 3.0.0\ninfo:\n  title: Test API', '{"score": 85, "grade": "B"}'::jsonb, 'OPENAPI',
    'upload', 'openai', 'gpt-5.1'
  ) RETURNING id INTO test_doc_id;

  -- Verify document was inserted
  IF (SELECT COUNT(*) FROM generated_documents WHERE id = test_doc_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: OPENAPI doc type accepted';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: OPENAPI document not found';
  END IF;

  -- Test that invalid doc types still fail
  BEGIN
    INSERT INTO generated_documents (
      user_id, filename, language, file_size_bytes,
      documentation, quality_score, doc_type,
      origin, provider, model
    ) VALUES (
      test_user_id, 'invalid.md', 'markdown', 1000,
      '# Invalid', '{"score": 50, "grade": "F"}'::jsonb, 'INVALID_TYPE',
      'upload', 'claude', 'claude-sonnet-4-5-20250929'
    );
    RAISE EXCEPTION 'Migration test FAILED: Invalid doc type was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Migration test PASSED: Invalid doc types still rejected';
  END;

  -- Cleanup test data
  DELETE FROM users WHERE id = test_user_id;

  RAISE NOTICE 'Migration 022 completed successfully';
END $$;
