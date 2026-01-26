-- Migration: Rename campaigns to trial_programs
-- Version: v3.5.0
-- Date: 2026-01-14
-- Description: Renames campaigns table to trial_programs to better reflect the concept.
--              A trial program defines a trial offering that users can enroll in via
--              auto-enrollment (new signups) or invite codes (manual redemption).
--
-- Changes:
-- 1. Rename campaigns table to trial_programs
-- 2. Rename campaign_id to trial_program_id in user_trials
-- 3. Change campaign (string) to trial_program_id (FK) in invite_codes
-- 4. Update all constraints, indexes, and comments

-- =============================================================================
-- STEP 1: Rename campaigns table to trial_programs
-- =============================================================================

ALTER TABLE campaigns RENAME TO trial_programs;

-- Update table comment
COMMENT ON TABLE trial_programs IS 'Trial programs with enrollment methods (auto-enroll for new signups, invite codes for manual redemption) and eligibility rules. Max trials per user is a system-wide setting (MAX_TRIALS_PER_USER_LIFETIME env var).';

-- =============================================================================
-- STEP 2: Rename constraints and indexes on trial_programs table
-- =============================================================================

-- Rename check constraints
ALTER TABLE trial_programs
  RENAME CONSTRAINT campaigns_cooldown_days_check TO trial_programs_cooldown_days_check;

-- Rename indexes
ALTER INDEX idx_campaigns_eligibility RENAME TO idx_trial_programs_eligibility;

-- Note: Primary key and other constraints are automatically renamed by PostgreSQL

-- =============================================================================
-- STEP 3: Rename campaign_id to trial_program_id in user_trials table
-- =============================================================================

-- Rename column
ALTER TABLE user_trials
  RENAME COLUMN campaign_id TO trial_program_id;

-- Rename index
ALTER INDEX idx_user_trials_campaign RENAME TO idx_user_trials_program;

-- Update column comment
COMMENT ON COLUMN user_trials.trial_program_id IS 'Trial program that granted this trial (NULL if admin-granted without program association)';

-- =============================================================================
-- STEP 4: Add trial_program_id FK to invite_codes (replaces string 'campaign')
-- =============================================================================

-- Add new foreign key column
ALTER TABLE invite_codes
  ADD COLUMN trial_program_id INTEGER REFERENCES trial_programs(id) ON DELETE SET NULL;

-- Backfill: Match campaign names to trial_program IDs
-- Only update where campaign string is not null
UPDATE invite_codes ic
SET trial_program_id = tp.id
FROM trial_programs tp
WHERE ic.campaign IS NOT NULL
  AND ic.campaign = tp.name;

-- Create index for the new foreign key
CREATE INDEX idx_invite_codes_trial_program ON invite_codes(trial_program_id);

-- Add comment
COMMENT ON COLUMN invite_codes.trial_program_id IS 'Trial program this invite code belongs to (NULL for standalone invite codes not associated with a program)';

-- Drop the old campaign string column
-- Note: We keep this column for now to allow rollback, will drop in a future migration
-- ALTER TABLE invite_codes DROP COLUMN campaign;

-- Add comment to old column indicating it's deprecated
COMMENT ON COLUMN invite_codes.campaign IS 'DEPRECATED: Use trial_program_id instead. Will be removed in future migration.';

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =============================================================================

-- To rollback this migration:
-- 1. Restore campaign string values from trial_program_id:
--    UPDATE invite_codes ic SET campaign = tp.name FROM trial_programs tp WHERE ic.trial_program_id = tp.id;
-- 2. ALTER TABLE invite_codes DROP COLUMN trial_program_id;
-- 3. ALTER TABLE user_trials RENAME COLUMN trial_program_id TO campaign_id;
-- 4. ALTER TABLE trial_programs RENAME TO campaigns;
-- 5. Rename indexes and constraints back
