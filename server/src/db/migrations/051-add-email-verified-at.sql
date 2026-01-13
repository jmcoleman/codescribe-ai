-- Migration: Add email_verified_at timestamp column
-- Version: 051
-- Date: 2026-01-13
-- Description: Adds email_verified_at timestamp to track when email was verified (for time-to-value metrics)

-- Add email_verified_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;

    -- Backfill: Set email_verified_at to created_at for already verified users
    -- (This is an approximation - we don't have the exact verification time for historical data)
    UPDATE users
    SET email_verified_at = created_at
    WHERE email_verified = TRUE
      AND email_verified_at IS NULL;

    RAISE NOTICE 'Added email_verified_at column and backfilled for % verified users',
      (SELECT COUNT(*) FROM users WHERE email_verified = TRUE);
  ELSE
    RAISE NOTICE 'Column email_verified_at already exists';
  END IF;
END $$;

-- Create index for performance (used in time-to-value queries)
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);

-- Verify column was added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'email_verified_at';
