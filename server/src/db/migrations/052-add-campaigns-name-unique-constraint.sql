-- Migration: 052-add-campaigns-name-unique-constraint
-- Description: Add unique constraint to campaigns.name to prevent duplicate campaign names
-- Date: 2026-01-13

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Add unique constraint to campaign name
ALTER TABLE campaigns ADD CONSTRAINT campaigns_name_unique UNIQUE (name);

-- Add comment
COMMENT ON CONSTRAINT campaigns_name_unique ON campaigns IS 'Ensures campaign names are unique for clarity in admin UI';

-- ============================================================================
-- DOWN MIGRATION (for rollback)
-- ============================================================================
-- ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_name_unique;
