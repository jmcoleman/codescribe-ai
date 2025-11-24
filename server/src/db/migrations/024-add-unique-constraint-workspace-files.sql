-- Migration 024: Add unique constraint on workspace_files (user_id, filename, doc_type)
-- Created: 2025-11-23
-- Description: Prevent duplicate file + doc type combinations in a user's workspace
--
-- Background:
-- The workspace_files table had an INDEX on (user_id, filename) but no UNIQUE constraint.
-- This allowed users to add the same filename multiple times, creating duplicates.
-- The backend checks for error code 23505 (unique violation) but it never fired.
--
-- Design Decision:
-- Using UNIQUE (user_id, filename, doc_type) instead of just (user_id, filename) to allow:
-- - file.js (README)
-- - file.js (JSDOC)
-- - file.js (API)
-- This is future-ready for multi-doc-type per file feature (planned for v3.x).
--
-- Future Migration (v3.x):
-- Will normalize to workspace_files (file metadata) + workspace_generations (doc types).
-- See roadmap: "Multi-Doc-Type per File Architecture"

-- Step 1: Remove duplicate files (keep the most recent one per user+filename+doc_type)
DELETE FROM workspace_files
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, filename, doc_type
        ORDER BY created_at DESC
      ) AS rn
    FROM workspace_files
  ) sub
  WHERE rn > 1
);

-- Step 2: Drop the existing non-unique index
DROP INDEX IF EXISTS idx_workspace_files_user_filename;

-- Step 3: Add UNIQUE constraint on (user_id, filename, doc_type)
-- This also creates an index automatically
ALTER TABLE workspace_files
  ADD CONSTRAINT workspace_files_user_filename_doctype_unique
  UNIQUE (user_id, filename, doc_type);

-- Add comment
COMMENT ON CONSTRAINT workspace_files_user_filename_doctype_unique ON workspace_files IS
  'Ensures each user can only have one file+doc_type combination in their workspace. Allows same file with different doc types (future multi-doc-type feature).';

-- Verify the constraint was added
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'workspace_files'::regclass
  AND conname = 'workspace_files_user_filename_doctype_unique';
