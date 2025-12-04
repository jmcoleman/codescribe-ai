-- Migration 025: Create generation_batches table for documentation history
-- Created: 2025-11-25
-- Description: Adds batch grouping for generated documentation to support history and export features
--
-- Features:
-- - Groups generated documents into batches (single or multi-file)
-- - Stores batch summary markdown and quality metrics
-- - Tracks success/failure counts for batch operations
-- - Links documents to batches via batch_id foreign key
-- - Supports ZIP export of entire batches

-- Create generation_batches table
CREATE TABLE IF NOT EXISTS generation_batches (
  -- Primary key (UUID for URL-safe IDs)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User relationship (ON DELETE CASCADE for GDPR compliance)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Batch metadata
  batch_type VARCHAR(50) NOT NULL CHECK (batch_type IN ('batch', 'single')),
  total_files INTEGER NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,

  -- Quality metrics (aggregated from individual documents)
  avg_quality_score DECIMAL(5,2),  -- e.g., 85.50
  avg_grade VARCHAR(2),             -- A, B, C, D, F

  -- Summary content
  summary_markdown TEXT,            -- Full Generation Summary markdown
  error_details JSONB,              -- Array of failed files: [{filename, error, docType}]

  -- Document types in this batch (for filtering/display)
  doc_types JSONB,                  -- e.g., ["README", "JSDOC", "API"]

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraint
  CONSTRAINT valid_file_counts CHECK (total_files = success_count + fail_count),
  CONSTRAINT positive_files CHECK (total_files > 0)
);

-- Add comments for documentation
COMMENT ON TABLE generation_batches IS 'Groups generated documents into batches for history and export features';
COMMENT ON COLUMN generation_batches.batch_type IS 'Type of generation: single (one file) or batch (multiple files)';
COMMENT ON COLUMN generation_batches.summary_markdown IS 'Full generation summary in markdown format (displayed in UI)';
COMMENT ON COLUMN generation_batches.error_details IS 'JSON array of failed files with error messages';
COMMENT ON COLUMN generation_batches.doc_types IS 'JSON array of unique doc types in this batch';

-- Indexes for performance
CREATE INDEX idx_generation_batches_user_created
  ON generation_batches(user_id, created_at DESC);

CREATE INDEX idx_generation_batches_user_type
  ON generation_batches(user_id, batch_type);

-- Add batch_id column to generated_documents table
ALTER TABLE generated_documents
  ADD COLUMN batch_id UUID REFERENCES generation_batches(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN generated_documents.batch_id IS 'Links document to its generation batch (NULL for standalone docs)';

-- Index for batch lookups (find all docs in a batch)
CREATE INDEX idx_generated_docs_batch_id
  ON generated_documents(batch_id)
  WHERE batch_id IS NOT NULL;

-- Verify migration
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'generation_batches'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_documents'
  AND column_name = 'batch_id';

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('generation_batches', 'generated_documents')
  AND indexname LIKE '%batch%'
ORDER BY indexname;

-- Test migration with sample data
DO $$
DECLARE
  test_user_id INTEGER;
  test_batch_id UUID;
  test_doc_id UUID;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified, save_docs_preference)
  VALUES ('batchtest@example.com', 'Batch', 'Test', 'hash', true, 'always')
  RETURNING id INTO test_user_id;

  -- Create test batch
  INSERT INTO generation_batches (
    user_id, batch_type, total_files, success_count, fail_count,
    avg_quality_score, avg_grade, summary_markdown, error_details, doc_types
  ) VALUES (
    test_user_id, 'batch', 3, 2, 1,
    85.50, 'B',
    '# Generation Summary\n\n## Results\n- 2 successful\n- 1 failed',
    '[{"filename": "broken.js", "error": "Parse error", "docType": "README"}]'::jsonb,
    '["README", "JSDOC"]'::jsonb
  ) RETURNING id INTO test_batch_id;

  -- Verify batch was inserted
  IF (SELECT COUNT(*) FROM generation_batches WHERE id = test_batch_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: Batch inserted successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Batch not found';
  END IF;

  -- Create test document linked to batch
  INSERT INTO generated_documents (
    user_id, filename, language, file_size_bytes,
    documentation, quality_score, doc_type,
    origin, provider, model, batch_id
  ) VALUES (
    test_user_id, 'component.jsx', 'javascript', 2500,
    '# Component\n\nA React component.', '{"score": 88, "grade": "B"}'::jsonb, 'README',
    'upload', 'claude', 'claude-sonnet-4-5-20250929', test_batch_id
  ) RETURNING id INTO test_doc_id;

  -- Verify document is linked to batch
  IF (SELECT batch_id FROM generated_documents WHERE id = test_doc_id) = test_batch_id THEN
    RAISE NOTICE 'Migration test PASSED: Document linked to batch successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Document not linked to batch';
  END IF;

  -- Test that batch deletion sets batch_id to NULL (not cascades)
  DELETE FROM generation_batches WHERE id = test_batch_id;

  IF (SELECT batch_id IS NULL FROM generated_documents WHERE id = test_doc_id) THEN
    RAISE NOTICE 'Migration test PASSED: Batch deletion sets batch_id to NULL (docs preserved)';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Batch deletion did not set batch_id to NULL';
  END IF;

  -- Test constraint: total_files must equal success_count + fail_count
  BEGIN
    INSERT INTO generation_batches (
      user_id, batch_type, total_files, success_count, fail_count
    ) VALUES (
      test_user_id, 'single', 5, 2, 1  -- 5 != 2 + 1
    );
    RAISE EXCEPTION 'Migration test FAILED: Invalid file count constraint not enforced';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Migration test PASSED: File count constraint enforced';
  END;

  -- Cleanup test data
  DELETE FROM users WHERE id = test_user_id;

  RAISE NOTICE 'Migration 025 completed successfully';
END $$;
