-- Migration: Add auto_enroll flag to trial_programs
-- Version: v3.5.0
-- Date: 2026-01-14
-- Description: Adds auto_enroll flag to distinguish between:
--              - Auto-enrollment campaigns: New signups automatically get the trial
--              - Invite-only campaigns: Only accessible via invite codes (beta groups, etc.)

-- =============================================================================
-- Add auto_enroll column
-- =============================================================================

ALTER TABLE trial_programs
  ADD COLUMN auto_enroll BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN trial_programs.auto_enroll IS
  'Whether new signups are automatically enrolled in this trial program. When true, this is an auto-enrollment campaign. When false, this is invite-only (accessible via invite codes only).';

-- Create index for auto-enroll lookup (common query: find active auto-enroll campaign)
CREATE INDEX idx_trial_programs_auto_enroll ON trial_programs(auto_enroll, is_active)
  WHERE auto_enroll = true AND is_active = true;

-- =============================================================================
-- Update trigger to enforce single active auto-enroll campaign
-- =============================================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS trg_ensure_single_active_campaign ON trial_programs;

-- Recreate trigger function with auto_enroll logic
CREATE OR REPLACE FUNCTION ensure_single_active_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- If activating an auto-enroll campaign, deactivate all OTHER auto-enroll campaigns
  -- (Invite-only campaigns can have multiple active at once)
  IF NEW.is_active = true
     AND NEW.auto_enroll = true
     AND (OLD IS NULL OR OLD.is_active = false OR OLD.auto_enroll = false) THEN
    UPDATE trial_programs
    SET is_active = false, updated_at = NOW()
    WHERE id != NEW.id
      AND is_active = true
      AND auto_enroll = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trg_ensure_single_active_campaign
  BEFORE INSERT OR UPDATE ON trial_programs
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_campaign();

-- =============================================================================
-- Backfill existing records
-- =============================================================================

-- Set all existing trial programs to auto_enroll = true (preserve current behavior)
-- Admin can change this manually after migration
UPDATE trial_programs SET auto_enroll = true;

-- =============================================================================
-- Rollback (if needed):
-- =============================================================================
-- DROP INDEX IF EXISTS idx_trial_programs_auto_enroll;
-- ALTER TABLE trial_programs DROP COLUMN IF EXISTS auto_enroll;
--
-- -- Restore original trigger logic
-- CREATE OR REPLACE FUNCTION ensure_single_active_campaign()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false) THEN
--     UPDATE trial_programs
--     SET is_active = false, updated_at = NOW()
--     WHERE id != NEW.id AND is_active = true;
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
