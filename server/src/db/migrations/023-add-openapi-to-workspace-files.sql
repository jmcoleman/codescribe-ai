-- Migration 023: Add OPENAPI to workspace_files doc_type constraint
-- Created: 2025-11-23
-- Description: Extends the workspace_files doc_type check constraint to support OPENAPI
--
-- Context:
-- Migration 022 added OPENAPI to generated_documents but forgot to update
-- workspace_files table, causing constraint violations when adding OPENAPI
-- files to the workspace.

-- Drop the old constraint
ALTER TABLE workspace_files
  DROP CONSTRAINT IF EXISTS workspace_files_doc_type_check;

-- Add the new constraint with OPENAPI included
ALTER TABLE workspace_files
  ADD CONSTRAINT workspace_files_doc_type_check
  CHECK (doc_type IN ('README', 'JSDOC', 'API', 'ARCHITECTURE', 'OPENAPI'));

-- Verify the constraint was updated
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'workspace_files_doc_type_check';

-- Test the migration
DO $$
DECLARE
  test_user_id INTEGER;
  test_workspace_id UUID;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
  VALUES ('openapi-workspace-test@example.com', 'OpenAPI', 'Workspace', 'hash', true)
  RETURNING id INTO test_user_id;

  -- Test OPENAPI doc type in workspace_files (should succeed now)
  INSERT INTO workspace_files (
    user_id, filename, language, file_size_bytes,
    doc_type, origin
  ) VALUES (
    test_user_id, 'api.yaml', 'yaml', 3500,
    'OPENAPI', 'upload'
  ) RETURNING id INTO test_workspace_id;

  -- Verify workspace file was inserted
  IF (SELECT COUNT(*) FROM workspace_files WHERE id = test_workspace_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: OPENAPI doc type accepted in workspace_files';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: OPENAPI workspace file not found';
  END IF;

  -- Test that invalid doc types still fail
  BEGIN
    INSERT INTO workspace_files (
      user_id, filename, language, file_size_bytes,
      doc_type, origin
    ) VALUES (
      test_user_id, 'invalid.md', 'markdown', 1000,
      'INVALID_TYPE', 'upload'
    );
    RAISE EXCEPTION 'Migration test FAILED: Invalid doc type was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Migration test PASSED: Invalid doc types still rejected';
  END;

  -- Cleanup test data
  DELETE FROM users WHERE id = test_user_id;

  RAISE NOTICE 'Migration 023 completed successfully';
END $$;
