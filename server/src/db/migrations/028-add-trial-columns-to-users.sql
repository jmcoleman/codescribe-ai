-- Migration 028: Add trial eligibility columns to users table
-- Created: 2025-12-04
-- Description: Adds columns to track trial eligibility and usage history
--
-- Features:
-- - trial_eligible: Whether user can start a new trial
-- - trial_used_at: Timestamp of last trial usage (for cooldown periods)

-- Add trial columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMPTZ DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.trial_eligible IS 'Whether user can start a new trial (set to FALSE after trial ends)';
COMMENT ON COLUMN users.trial_used_at IS 'When user last used a trial (for cooldown periods and analytics)';

-- Index for eligibility checks (finding users who can trial)
CREATE INDEX IF NOT EXISTS idx_users_trial_eligible
  ON users(trial_eligible) WHERE trial_eligible = TRUE;

-- Verify migration
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('trial_eligible', 'trial_used_at')
ORDER BY column_name;

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname LIKE '%trial%';

-- Test migration
DO $$
DECLARE
  test_user_id INTEGER;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
  VALUES ('trialeligible@example.com', 'Trial', 'Eligible', 'hash', true)
  RETURNING id INTO test_user_id;

  -- Test 1: Verify default values
  IF (SELECT trial_eligible FROM users WHERE id = test_user_id) = TRUE THEN
    RAISE NOTICE 'Migration test PASSED: Default trial_eligible is TRUE';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Default trial_eligible incorrect';
  END IF;

  IF (SELECT trial_used_at IS NULL FROM users WHERE id = test_user_id) THEN
    RAISE NOTICE 'Migration test PASSED: Default trial_used_at is NULL';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Default trial_used_at incorrect';
  END IF;

  -- Test 2: Update trial_eligible and trial_used_at
  UPDATE users
  SET trial_eligible = FALSE, trial_used_at = NOW()
  WHERE id = test_user_id;

  IF (SELECT trial_eligible = FALSE AND trial_used_at IS NOT NULL FROM users WHERE id = test_user_id) THEN
    RAISE NOTICE 'Migration test PASSED: Trial columns updated successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Trial columns not updated properly';
  END IF;

  -- Cleanup test data
  DELETE FROM users WHERE id = test_user_id;

  RAISE NOTICE 'Migration 028 completed successfully';
END $$;
