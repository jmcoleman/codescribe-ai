-- Migration: Add tier tracking columns to users table
-- Version: 005
-- Date: 2025-10-27
-- Description: Adds tier_updated_at, previous_tier columns and CHECK constraint for tier system

-- Step 1: Add tier_updated_at column to track when tier was last changed
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP DEFAULT NOW();

-- Step 2: Add previous_tier column to track tier downgrades/upgrades
ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_tier VARCHAR(50);

-- Step 3: Add CHECK constraint to enforce valid tier values
-- Valid tiers: 'free', 'starter', 'pro', 'team', 'enterprise' (must match server/src/config/tiers.js)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_valid_tier'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT check_valid_tier
      CHECK (tier IN ('free', 'starter', 'pro', 'team', 'enterprise'));
    RAISE NOTICE 'Added CHECK constraint: check_valid_tier';
  END IF;
END $$;

-- Step 4: Backfill tier_updated_at for existing users
-- Set to created_at for users who already exist (one-time operation)
UPDATE users
SET tier_updated_at = created_at
WHERE tier_updated_at IS NULL;

-- Verify the columns were added and constraint exists
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name IN ('tier', 'tier_updated_at', 'previous_tier')
ORDER BY column_name;

-- Verify CHECK constraint was created
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'users'
    AND con.conname = 'check_valid_tier';
