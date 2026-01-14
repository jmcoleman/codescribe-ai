-- Migration: Rename changed_by_id to changed_by in user_audit_log
-- Version: 054
-- Date: 2026-01-13
-- Description: Renames changed_by_id to changed_by for cleaner naming convention (follows standard audit patterns like created_by, updated_by)

-- Rename column from changed_by_id to changed_by
ALTER TABLE user_audit_log
  RENAME COLUMN changed_by_id TO changed_by;

-- Index already exists as idx_user_audit_changed_by, no need to recreate

-- Verify column was renamed
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_audit_log'
  AND column_name = 'changed_by';
