-- Migration 026: Create invite_codes table for trial system
-- Created: 2025-12-04
-- Description: Adds invite code system for managing trial access to Pro features
--
-- Features:
-- - Unique invite codes for trial access
-- - Configurable trial tier and duration per code
-- - Usage limits (single-use or multi-use codes)
-- - Validity period tracking
-- - Campaign/source attribution for analytics

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  -- Primary key
  id SERIAL PRIMARY KEY,

  -- The invite code itself (URL-safe, unique)
  code VARCHAR(32) UNIQUE NOT NULL,

  -- Trial configuration
  trial_tier VARCHAR(50) NOT NULL DEFAULT 'pro'
    CHECK (trial_tier IN ('pro', 'team')),
  duration_days INTEGER NOT NULL DEFAULT 14
    CHECK (duration_days >= 1 AND duration_days <= 90),

  -- Usage limits
  max_uses INTEGER DEFAULT 1
    CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses INTEGER NOT NULL DEFAULT 0
    CHECK (current_uses >= 0),

  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ DEFAULT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'exhausted', 'expired')),

  -- Attribution/tracking
  source VARCHAR(100) NOT NULL DEFAULT 'admin',
  campaign VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,

  -- Creator tracking (nullable for system-generated codes)
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: current_uses cannot exceed max_uses
  CONSTRAINT valid_usage_count CHECK (
    max_uses IS NULL OR current_uses <= max_uses
  )
);

-- Add comments for documentation
COMMENT ON TABLE invite_codes IS 'Stores invite codes for trial access to Pro/Team features';
COMMENT ON COLUMN invite_codes.code IS 'Unique invite code string (URL-safe, 12-32 chars)';
COMMENT ON COLUMN invite_codes.trial_tier IS 'Tier granted during trial period (pro or team)';
COMMENT ON COLUMN invite_codes.duration_days IS 'Length of trial in days (1-90)';
COMMENT ON COLUMN invite_codes.max_uses IS 'Maximum redemptions allowed (NULL = unlimited)';
COMMENT ON COLUMN invite_codes.current_uses IS 'Number of times this code has been redeemed';
COMMENT ON COLUMN invite_codes.valid_from IS 'When code becomes valid for redemption';
COMMENT ON COLUMN invite_codes.valid_until IS 'When code expires (NULL = never expires)';
COMMENT ON COLUMN invite_codes.status IS 'Current status: active, paused, exhausted, or expired';
COMMENT ON COLUMN invite_codes.source IS 'Origin of code: admin, sales, marketing, partner, api';
COMMENT ON COLUMN invite_codes.campaign IS 'Campaign identifier for analytics grouping';

-- Indexes for performance
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_status ON invite_codes(status);
CREATE INDEX idx_invite_codes_campaign ON invite_codes(campaign) WHERE campaign IS NOT NULL;
CREATE INDEX idx_invite_codes_creator ON invite_codes(created_by_user_id) WHERE created_by_user_id IS NOT NULL;
CREATE INDEX idx_invite_codes_valid_period ON invite_codes(valid_from, valid_until);

-- Verify migration
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'invite_codes'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'invite_codes'
ORDER BY indexname;

-- Test migration with sample data
DO $$
DECLARE
  test_user_id INTEGER;
  test_code_id INTEGER;
BEGIN
  -- Create test user (admin)
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified, role)
  VALUES ('invitetest@example.com', 'Invite', 'Test', 'hash', true, 'admin')
  RETURNING id INTO test_user_id;

  -- Test 1: Create basic invite code
  INSERT INTO invite_codes (
    code, trial_tier, duration_days, max_uses, source, campaign, notes, created_by_user_id
  ) VALUES (
    'TEST-INVITE-001', 'pro', 14, 1, 'admin', 'beta-testers', 'Test invite code', test_user_id
  ) RETURNING id INTO test_code_id;

  IF (SELECT COUNT(*) FROM invite_codes WHERE id = test_code_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: Invite code created successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Invite code not found';
  END IF;

  -- Test 2: Verify default values
  IF (SELECT status FROM invite_codes WHERE id = test_code_id) = 'active' THEN
    RAISE NOTICE 'Migration test PASSED: Default status is active';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Default status incorrect';
  END IF;

  -- Test 3: Create unlimited-use code (max_uses = NULL)
  INSERT INTO invite_codes (code, trial_tier, max_uses, source)
  VALUES ('TEST-UNLIMITED', 'pro', NULL, 'marketing');

  IF (SELECT max_uses IS NULL FROM invite_codes WHERE code = 'TEST-UNLIMITED') THEN
    RAISE NOTICE 'Migration test PASSED: Unlimited use code created';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Unlimited use code not created properly';
  END IF;

  -- Test 4: Constraint - invalid tier should fail
  BEGIN
    INSERT INTO invite_codes (code, trial_tier, source)
    VALUES ('TEST-BAD-TIER', 'invalid_tier', 'admin');
    RAISE EXCEPTION 'Migration test FAILED: Invalid tier constraint not enforced';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Migration test PASSED: Tier constraint enforced';
  END;

  -- Test 5: Constraint - duration out of range should fail
  BEGIN
    INSERT INTO invite_codes (code, duration_days, source)
    VALUES ('TEST-BAD-DURATION', 100, 'admin');
    RAISE EXCEPTION 'Migration test FAILED: Duration constraint not enforced';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Migration test PASSED: Duration constraint enforced (1-90 days)';
  END;

  -- Test 6: Constraint - current_uses cannot exceed max_uses
  BEGIN
    INSERT INTO invite_codes (code, max_uses, current_uses, source)
    VALUES ('TEST-OVERUSE', 1, 2, 'admin');
    RAISE EXCEPTION 'Migration test FAILED: Usage count constraint not enforced';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Migration test PASSED: Usage count constraint enforced';
  END;

  -- Cleanup test data
  DELETE FROM invite_codes WHERE code LIKE 'TEST-%';
  DELETE FROM users WHERE id = test_user_id;

  RAISE NOTICE 'Migration 026 completed successfully';
END $$;
