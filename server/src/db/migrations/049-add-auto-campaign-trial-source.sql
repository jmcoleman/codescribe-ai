-- Migration: 049-add-auto-campaign-trial-source
-- Description: Add 'auto_campaign' as valid source for user_trials and link to campaigns
-- Date: 2026-01-07

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Drop the existing CHECK constraint on source column
ALTER TABLE user_trials DROP CONSTRAINT IF EXISTS user_trials_source_check;

-- Add new CHECK constraint that includes 'auto_campaign'
ALTER TABLE user_trials ADD CONSTRAINT user_trials_source_check
  CHECK (source IN ('invite', 'self_serve', 'admin_grant', 'auto_campaign'));

-- Add campaign_id column to track which campaign granted the trial
ALTER TABLE user_trials ADD COLUMN IF NOT EXISTS campaign_id INTEGER
  REFERENCES campaigns(id) ON DELETE SET NULL;

-- Create index for campaign-based queries
CREATE INDEX IF NOT EXISTS idx_user_trials_campaign ON user_trials(campaign_id)
  WHERE campaign_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_trials.campaign_id IS 'Campaign that auto-granted this trial (NULL if not from campaign)';

-- ============================================================================
-- DOWN MIGRATION (for rollback)
-- ============================================================================
-- DROP INDEX IF EXISTS idx_user_trials_campaign;
-- ALTER TABLE user_trials DROP COLUMN IF EXISTS campaign_id;
-- ALTER TABLE user_trials DROP CONSTRAINT IF EXISTS user_trials_source_check;
-- ALTER TABLE user_trials ADD CONSTRAINT user_trials_source_check
--   CHECK (source IN ('invite', 'self_serve', 'admin_grant'));
