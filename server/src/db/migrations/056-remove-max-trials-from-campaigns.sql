/**
 * Migration 056: Remove max_trials_per_user from campaigns table
 *
 * Why: max_trials_per_user is a system-wide lifetime limit, not per-campaign.
 * Moving to environment variable MAX_TRIALS_PER_USER_LIFETIME (default: 3)
 *
 * Changes:
 * - Drop max_trials_per_user column from campaigns
 * - Drop associated constraint campaigns_max_trials_check
 *
 * Rollback: See DOWN migration to restore column
 */

-- UP Migration
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_max_trials_check;

ALTER TABLE campaigns
  DROP COLUMN IF EXISTS max_trials_per_user;

COMMENT ON TABLE campaigns IS 'Trial campaigns with eligibility rules. Max trials per user is a system-wide setting (MAX_TRIALS_PER_USER_LIFETIME env var).';

-- DOWN Migration (commented out, for reference)
/*
ALTER TABLE campaigns
  ADD COLUMN max_trials_per_user INTEGER DEFAULT 1;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_max_trials_check CHECK (max_trials_per_user >= 1 AND max_trials_per_user <= 10);

COMMENT ON COLUMN campaigns.max_trials_per_user IS 'Deprecated: Use MAX_TRIALS_PER_USER_LIFETIME environment variable instead';
*/
