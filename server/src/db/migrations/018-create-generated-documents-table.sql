-- Migration 018: Create generated_documents table for multi-file documentation persistence
-- Created: 2025-11-15
-- Description: Adds database storage for generated documentation with user consent model
--
-- Privacy-First Approach:
-- - Stores ONLY generated documentation (our output), never user's code
-- - User consent required (save_docs_preference column)
-- - Soft delete with 30-day recovery window
-- - ON DELETE CASCADE for GDPR compliance

-- Add user preferences for documentation saving
ALTER TABLE users
  ADD COLUMN save_docs_preference VARCHAR(20) NOT NULL DEFAULT 'ask'
    CHECK (save_docs_preference IN ('always', 'never', 'ask'));

ALTER TABLE users
  ADD COLUMN docs_consent_shown_at TIMESTAMPTZ;

COMMENT ON COLUMN users.save_docs_preference IS 'User preference for saving generated documentation: always, never, or ask';
COMMENT ON COLUMN users.docs_consent_shown_at IS 'Timestamp when user was first shown documentation consent modal';

-- Create generated_documents table
CREATE TABLE IF NOT EXISTS generated_documents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User relationship (ON DELETE CASCADE for GDPR compliance)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- File metadata (NOT the user's code - only metadata about the file)
  filename VARCHAR(255) NOT NULL,
  language VARCHAR(50) NOT NULL,
  file_size_bytes INTEGER NOT NULL,

  -- Generated content (OUR output - documentation we created for the user)
  documentation TEXT NOT NULL,
  quality_score JSONB NOT NULL,
  doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('README', 'JSDOC', 'API', 'ARCHITECTURE')),

  -- Provenance & audit trail
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  origin VARCHAR(50) NOT NULL CHECK (origin IN ('upload', 'github', 'paste', 'sample')),

  -- GitHub integration metadata (optional)
  github_repo VARCHAR(255),           -- e.g., 'acme-corp/project'
  github_path VARCHAR(500),           -- e.g., 'src/components/auth.js'
  github_sha VARCHAR(40),             -- Git commit SHA
  github_branch VARCHAR(255),         -- e.g., 'main', 'feature/auth'

  -- LLM metadata (for analytics, debugging, billing)
  provider VARCHAR(50) NOT NULL,      -- 'claude' | 'openai'
  model VARCHAR(100) NOT NULL,        -- 'claude-sonnet-4-5-20250929'
  input_tokens INTEGER,
  output_tokens INTEGER,
  was_cached BOOLEAN DEFAULT FALSE,
  latency_ms INTEGER,

  -- Ephemeral flag (for authenticated users with save_docs_preference='never')
  is_ephemeral BOOLEAN DEFAULT FALSE, -- Delete on logout if true

  -- Soft delete (30-day recovery window)
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE generated_documents IS 'Stores generated documentation (our output) with user consent. User code is NEVER stored. Auth required.';
COMMENT ON COLUMN generated_documents.documentation IS 'Generated documentation text (markdown format)';
COMMENT ON COLUMN generated_documents.quality_score IS 'Quality score object: { score: number, grade: string, breakdown: {...} }';
COMMENT ON COLUMN generated_documents.is_ephemeral IS 'If true, delete on logout (user preference: save_docs_preference=never or one-time choice)';
COMMENT ON COLUMN generated_documents.deleted_at IS 'Soft delete timestamp - allows 30-day recovery window';

-- Indexes for performance
CREATE INDEX idx_generated_docs_user_generated_at
  ON generated_documents(user_id, generated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_generated_docs_user_filename
  ON generated_documents(user_id, filename)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_generated_docs_user_ephemeral
  ON generated_documents(user_id)
  WHERE is_ephemeral = TRUE AND deleted_at IS NULL;

CREATE INDEX idx_generated_docs_github_repo
  ON generated_documents(user_id, github_repo)
  WHERE github_repo IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_generated_docs_deleted_at
  ON generated_documents(deleted_at)
  WHERE deleted_at IS NOT NULL; -- For cleanup jobs

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_generated_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_generated_documents_updated_at
  BEFORE UPDATE ON generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_documents_updated_at();

-- Verify migration
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('save_docs_preference', 'docs_consent_shown_at')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_documents'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'generated_documents'
ORDER BY indexname;

-- Test migration with sample data
DO $$
DECLARE
  test_user_id INTEGER;
  test_doc_id UUID;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified, save_docs_preference)
  VALUES ('doctest@example.com', 'Doc', 'Test', 'hash', true, 'always')
  RETURNING id INTO test_user_id;

  -- Insert test document
  INSERT INTO generated_documents (
    user_id, filename, language, file_size_bytes,
    documentation, quality_score, doc_type,
    origin, provider, model
  ) VALUES (
    test_user_id, 'test.js', 'javascript', 2100,
    '# Test Module', '{"score": 92, "grade": "A"}'::jsonb, 'README',
    'upload', 'claude', 'claude-sonnet-4-5-20250929'
  ) RETURNING id INTO test_doc_id;

  -- Verify document was inserted
  IF (SELECT COUNT(*) FROM generated_documents WHERE id = test_doc_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: Document inserted successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Document not found';
  END IF;

  -- Test soft delete
  UPDATE generated_documents SET deleted_at = NOW() WHERE id = test_doc_id;

  IF (SELECT deleted_at IS NOT NULL FROM generated_documents WHERE id = test_doc_id) THEN
    RAISE NOTICE 'Migration test PASSED: Soft delete works';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Soft delete not working';
  END IF;

  -- Test cascade delete (user deletion should cascade to documents)
  DELETE FROM users WHERE id = test_user_id;

  IF (SELECT COUNT(*) FROM generated_documents WHERE id = test_doc_id) = 0 THEN
    RAISE NOTICE 'Migration test PASSED: CASCADE delete works (GDPR compliance)';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: CASCADE delete not working';
  END IF;

  RAISE NOTICE 'Migration 018 completed successfully';
END $$;
