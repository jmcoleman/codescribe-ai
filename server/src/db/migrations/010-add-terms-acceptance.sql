-- Migration: Add versioned terms acceptance tracking
-- Version: 010
-- Date: 2025-11-02
-- Description: Adds terms acceptance tracking with version support to enforce re-acceptance when terms change

-- Add terms acceptance columns if they don't exist
DO $$
BEGIN
  -- Track when user accepted terms
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE users
    ADD COLUMN terms_accepted_at TIMESTAMP;

    RAISE NOTICE 'Added terms_accepted_at column to users table';
  ELSE
    RAISE NOTICE 'Column terms_accepted_at already exists in users table';
  END IF;

  -- Track which version of terms user accepted
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'terms_version_accepted'
  ) THEN
    ALTER TABLE users
    ADD COLUMN terms_version_accepted VARCHAR(20);

    RAISE NOTICE 'Added terms_version_accepted column to users table';
  ELSE
    RAISE NOTICE 'Column terms_version_accepted already exists in users table';
  END IF;

  -- Track privacy policy acceptance separately (can change independently)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'privacy_accepted_at'
  ) THEN
    ALTER TABLE users
    ADD COLUMN privacy_accepted_at TIMESTAMP;

    RAISE NOTICE 'Added privacy_accepted_at column to users table';
  ELSE
    RAISE NOTICE 'Column privacy_accepted_at already exists in users table';
  END IF;

  -- Track privacy policy version separately
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'privacy_version_accepted'
  ) THEN
    ALTER TABLE users
    ADD COLUMN privacy_version_accepted VARCHAR(20);

    RAISE NOTICE 'Added privacy_version_accepted column to users table';
  ELSE
    RAISE NOTICE 'Column privacy_version_accepted already exists in users table';
  END IF;
END $$;

-- Create indexes for querying users who need to re-accept terms
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted_at ON users(terms_accepted_at);
CREATE INDEX IF NOT EXISTS idx_users_terms_version_accepted ON users(terms_version_accepted);
CREATE INDEX IF NOT EXISTS idx_users_privacy_accepted_at ON users(privacy_accepted_at);
CREATE INDEX IF NOT EXISTS idx_users_privacy_version_accepted ON users(privacy_version_accepted);

-- Verify columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'terms_accepted_at',
    'terms_version_accepted',
    'privacy_accepted_at',
    'privacy_version_accepted'
  )
ORDER BY column_name;
