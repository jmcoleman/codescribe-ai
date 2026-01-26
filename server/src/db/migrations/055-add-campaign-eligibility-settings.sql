-- Migration: Add campaign eligibility settings for flexible trial campaigns
-- Version: v3.5.0
-- Date: 2026-01-14
-- Description: Adds eligibility settings to campaigns table to support re-engagement campaigns
--              with configurable rules (previous trial users, cooldown periods, max trials per user)

-- Add eligibility settings columns to campaigns table
ALTER TABLE campaigns
  ADD COLUMN allow_previous_trial_users BOOLEAN DEFAULT FALSE,
  ADD COLUMN cooldown_days INTEGER DEFAULT 0,
  ADD COLUMN max_trials_per_user INTEGER DEFAULT 1;

-- Add comments explaining fields
COMMENT ON COLUMN campaigns.allow_previous_trial_users IS
  'If TRUE, users with expired trials can participate. If FALSE, only new trial users eligible.';

COMMENT ON COLUMN campaigns.cooldown_days IS
  'Minimum days required since last trial ended. Only applies if allow_previous_trial_users=TRUE. Default: 0 (no cooldown).';

COMMENT ON COLUMN campaigns.max_trials_per_user IS
  'Maximum number of trials a user can receive from ANY campaign (lifetime). Default: 1.';

-- Add check constraints for valid values
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_cooldown_days_check CHECK (cooldown_days >= 0 AND cooldown_days <= 365);

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_max_trials_check CHECK (max_trials_per_user >= 1 AND max_trials_per_user <= 10);

-- Index for eligibility queries (will be used frequently during trial redemption)
CREATE INDEX idx_campaigns_eligibility ON campaigns(allow_previous_trial_users, cooldown_days);

-- Backfill existing campaigns with default values (already done by DEFAULT clause, but explicit for clarity)
UPDATE campaigns
SET
  allow_previous_trial_users = FALSE,
  cooldown_days = 0,
  max_trials_per_user = 1
WHERE allow_previous_trial_users IS NULL;
