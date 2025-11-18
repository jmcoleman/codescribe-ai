-- Migration 021: Create workspace_files table for multi-file state persistence
-- Created: 2025-11-17
-- Description: Stores user's current workspace (active file list)
--
-- Purpose:
-- - Persist file list across browser sessions/navigation
-- - Track user's current working files
-- - Link to generated_documents when docs are created
-- - Enable workspace restoration on return
--
-- Privacy:
-- - Code content NOT stored (privacy-first)
-- - Only file metadata stored
-- - No history accumulation (current workspace only)
--
-- Lifecycle:
-- - User adds file → row inserted
-- - User removes file → row deleted (hard delete)
-- - User clears workspace → all rows deleted
-- - generated_documents table handles completed work history

CREATE TABLE IF NOT EXISTS workspace_files (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User relationship (ON DELETE CASCADE for GDPR compliance)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- File metadata (NOT the user's code - only metadata)
  filename VARCHAR(255) NOT NULL,
  language VARCHAR(50) NOT NULL,
  file_size_bytes INTEGER NOT NULL,

  -- File state
  doc_type VARCHAR(50) NOT NULL DEFAULT 'README' CHECK (doc_type IN ('README', 'JSDOC', 'API', 'ARCHITECTURE')),
  origin VARCHAR(50) NOT NULL CHECK (origin IN ('upload', 'github', 'paste', 'sample')),

  -- GitHub integration metadata (optional)
  github_repo VARCHAR(255),           -- e.g., 'acme-corp/project'
  github_path VARCHAR(500),           -- e.g., 'src/components/auth.js'
  github_sha VARCHAR(40),             -- Git commit SHA
  github_branch VARCHAR(255),         -- e.g., 'main', 'feature/auth'

  -- Link to generated document (nullable - file may not have docs yet)
  document_id UUID REFERENCES generated_documents(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE workspace_files IS 'Stores user current workspace (active file list). Code content never stored, only metadata. Current state only, no history.';
COMMENT ON COLUMN workspace_files.document_id IS 'Links to generated_documents when docs are created (null if not yet generated)';

-- Indexes for performance
CREATE INDEX idx_workspace_files_user_created
  ON workspace_files(user_id, created_at DESC);

CREATE INDEX idx_workspace_files_user_filename
  ON workspace_files(user_id, filename);

CREATE INDEX idx_workspace_files_document_id
  ON workspace_files(document_id)
  WHERE document_id IS NOT NULL;

CREATE INDEX idx_workspace_files_github_repo
  ON workspace_files(user_id, github_repo)
  WHERE github_repo IS NOT NULL;

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_workspace_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workspace_files_updated_at
  BEFORE UPDATE ON workspace_files
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_files_updated_at();

-- Verify migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workspace_files'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'workspace_files'
ORDER BY indexname;

-- Test migration with sample data
DO $$
DECLARE
  test_user_id INTEGER;
  test_workspace_id UUID;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
  VALUES ('workspacetest@example.com', 'Workspace', 'Test', 'hash', true)
  RETURNING id INTO test_user_id;

  -- Insert test workspace file
  INSERT INTO workspace_files (
    user_id, filename, language, file_size_bytes,
    doc_type, origin
  ) VALUES (
    test_user_id, 'test.js', 'javascript', 2100,
    'README', 'upload'
  ) RETURNING id INTO test_workspace_id;

  -- Verify workspace file was inserted
  IF (SELECT COUNT(*) FROM workspace_files WHERE id = test_workspace_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: Workspace file inserted successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Workspace file not found';
  END IF;

  -- Test cascade delete (user deletion should cascade to workspace files)
  DELETE FROM users WHERE id = test_user_id;

  IF (SELECT COUNT(*) FROM workspace_files WHERE id = test_workspace_id) = 0 THEN
    RAISE NOTICE 'Migration test PASSED: CASCADE delete works (GDPR compliance)';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: CASCADE delete not working';
  END IF;

  RAISE NOTICE 'Migration 021 completed successfully';
END $$;
