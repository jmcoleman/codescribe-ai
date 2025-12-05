-- Migration 027: Create user_trials table for trial tracking
-- Created: 2025-12-04
-- Description: Tracks individual user trial periods for Pro/Team access
--
-- Features:
-- - Links users to their trial periods
-- - Tracks trial status (active, expired, converted, cancelled)
-- - Stores trial configuration (tier, duration)
-- - Supports conversion tracking to paid subscriptions
-- - Enforces one active trial per user

-- Create user_trials table
CREATE TABLE IF NOT EXISTS user_trials (
  -- Primary key
  id SERIAL PRIMARY KEY,

  -- User relationship (ON DELETE CASCADE for GDPR compliance)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Invite code relationship (NULL for self-serve trials in future)
  invite_code_id INTEGER REFERENCES invite_codes(id) ON DELETE SET NULL,

  -- Trial configuration (copied from invite code at redemption time)
  trial_tier VARCHAR(50) NOT NULL DEFAULT 'pro'
    CHECK (trial_tier IN ('pro', 'team')),
  duration_days INTEGER NOT NULL DEFAULT 14
    CHECK (duration_days >= 1 AND duration_days <= 90),

  -- Trial period
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'converted', 'cancelled')),

  -- Conversion tracking
  converted_at TIMESTAMPTZ DEFAULT NULL,
  converted_to_tier VARCHAR(50) DEFAULT NULL,
  converted_subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Source tracking (for analytics)
  source VARCHAR(50) NOT NULL DEFAULT 'invite'
    CHECK (source IN ('invite', 'self_serve', 'admin_grant')),

  -- Extension tracking
  original_ends_at TIMESTAMPTZ DEFAULT NULL,
  extended_by_days INTEGER DEFAULT 0,
  extension_reason TEXT DEFAULT NULL,

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE user_trials IS 'Tracks individual user trial periods for Pro/Team access';
COMMENT ON COLUMN user_trials.user_id IS 'User who owns this trial';
COMMENT ON COLUMN user_trials.invite_code_id IS 'Invite code used to start trial (NULL for self-serve)';
COMMENT ON COLUMN user_trials.trial_tier IS 'Tier granted during trial (pro or team)';
COMMENT ON COLUMN user_trials.duration_days IS 'Original duration in days';
COMMENT ON COLUMN user_trials.started_at IS 'When the trial period began';
COMMENT ON COLUMN user_trials.ends_at IS 'When the trial period ends (may be extended)';
COMMENT ON COLUMN user_trials.status IS 'Trial status: active, expired, converted, or cancelled';
COMMENT ON COLUMN user_trials.converted_at IS 'Timestamp when user converted to paid';
COMMENT ON COLUMN user_trials.converted_to_tier IS 'Tier user converted to after trial';
COMMENT ON COLUMN user_trials.source IS 'How trial was initiated: invite, self_serve, or admin_grant';
COMMENT ON COLUMN user_trials.original_ends_at IS 'Original end date before any extensions';
COMMENT ON COLUMN user_trials.extended_by_days IS 'Total days added via extensions';
COMMENT ON COLUMN user_trials.extension_reason IS 'Reason for trial extension (audit)';

-- Partial unique index: Only one active trial per user
CREATE UNIQUE INDEX idx_user_trials_active_user
  ON user_trials(user_id) WHERE status = 'active';

-- Performance indexes
CREATE INDEX idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX idx_user_trials_ends_at ON user_trials(ends_at) WHERE status = 'active';
CREATE INDEX idx_user_trials_invite_code ON user_trials(invite_code_id) WHERE invite_code_id IS NOT NULL;
CREATE INDEX idx_user_trials_status ON user_trials(status);
CREATE INDEX idx_user_trials_source ON user_trials(source);

-- Verify migration
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_trials'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_trials'
ORDER BY indexname;

-- Test migration with sample data
DO $$
DECLARE
  test_user_id INTEGER;
  test_code_id INTEGER;
  test_trial_id INTEGER;
  test_ends_at TIMESTAMPTZ;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
  VALUES ('trialtest@example.com', 'Trial', 'Test', 'hash', true)
  RETURNING id INTO test_user_id;

  -- Create test invite code
  INSERT INTO invite_codes (code, trial_tier, duration_days, source)
  VALUES ('TRIAL-TEST-CODE', 'pro', 14, 'admin')
  RETURNING id INTO test_code_id;

  -- Calculate expected end date
  test_ends_at := NOW() + INTERVAL '14 days';

  -- Test 1: Create trial
  INSERT INTO user_trials (
    user_id, invite_code_id, trial_tier, duration_days, ends_at, source
  ) VALUES (
    test_user_id, test_code_id, 'pro', 14, test_ends_at, 'invite'
  ) RETURNING id INTO test_trial_id;

  IF (SELECT COUNT(*) FROM user_trials WHERE id = test_trial_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: Trial created successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Trial not found';
  END IF;

  -- Test 2: Verify default status is active
  IF (SELECT status FROM user_trials WHERE id = test_trial_id) = 'active' THEN
    RAISE NOTICE 'Migration test PASSED: Default status is active';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Default status incorrect';
  END IF;

  -- Test 3: Constraint - only one active trial per user
  BEGIN
    INSERT INTO user_trials (
      user_id, trial_tier, duration_days, ends_at, source
    ) VALUES (
      test_user_id, 'pro', 7, NOW() + INTERVAL '7 days', 'admin_grant'
    );
    RAISE EXCEPTION 'Migration test FAILED: Duplicate active trial constraint not enforced';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'Migration test PASSED: Only one active trial per user enforced';
  END;

  -- Test 4: Can have expired + new active trial (after expiring first)
  UPDATE user_trials SET status = 'expired' WHERE id = test_trial_id;

  INSERT INTO user_trials (
    user_id, trial_tier, duration_days, ends_at, source
  ) VALUES (
    test_user_id, 'team', 7, NOW() + INTERVAL '7 days', 'admin_grant'
  );

  IF (SELECT COUNT(*) FROM user_trials WHERE user_id = test_user_id AND status = 'active') = 1 THEN
    RAISE NOTICE 'Migration test PASSED: New active trial allowed after expiration';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Could not create new trial after expiration';
  END IF;

  -- Test 5: Constraint - invalid status should fail
  BEGIN
    INSERT INTO user_trials (
      user_id, trial_tier, ends_at, status, source
    ) VALUES (
      test_user_id, 'pro', NOW() + INTERVAL '7 days', 'invalid_status', 'invite'
    );
    RAISE EXCEPTION 'Migration test FAILED: Invalid status constraint not enforced';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Migration test PASSED: Status constraint enforced';
  END;

  -- Test 6: Self-serve trial (no invite code)
  UPDATE user_trials SET status = 'expired' WHERE user_id = test_user_id AND status = 'active';

  INSERT INTO user_trials (
    user_id, invite_code_id, trial_tier, duration_days, ends_at, source
  ) VALUES (
    test_user_id, NULL, 'pro', 14, NOW() + INTERVAL '14 days', 'self_serve'
  );

  IF (SELECT invite_code_id IS NULL FROM user_trials WHERE user_id = test_user_id AND source = 'self_serve') THEN
    RAISE NOTICE 'Migration test PASSED: Self-serve trial (no invite code) created';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Self-serve trial not created properly';
  END IF;

  -- Cleanup test data
  DELETE FROM user_trials WHERE user_id = test_user_id;
  DELETE FROM invite_codes WHERE id = test_code_id;
  DELETE FROM users WHERE id = test_user_id;

  RAISE NOTICE 'Migration 027 completed successfully';
END $$;
