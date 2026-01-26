-- Migration: Rename campaign unique constraint to trial_programs
-- Version: v3.5.0
-- Date: 2026-01-14
-- Description: Renames the campaigns_name_unique constraint to trial_programs_name_unique
--              after the table rename in migration 057. PostgreSQL doesn't automatically
--              rename constraints when tables are renamed.

-- =============================================================================
-- Rename unique constraint
-- =============================================================================

ALTER TABLE trial_programs
  RENAME CONSTRAINT campaigns_name_unique TO trial_programs_name_unique;

-- Update constraint comment
COMMENT ON CONSTRAINT trial_programs_name_unique ON trial_programs IS
  'Ensures trial program names are unique for clarity in admin UI';

-- =============================================================================
-- Rollback (if needed):
-- =============================================================================
-- ALTER TABLE trial_programs
--   RENAME CONSTRAINT trial_programs_name_unique TO campaigns_name_unique;
