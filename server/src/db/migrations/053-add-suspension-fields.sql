-- Migration: Add suspension fields to users table
-- Version: 053
-- Date: 2026-01-13
-- Description: Separates suspension (account locked, data preserved) from deletion (data removal after grace period)
--
-- Behavioral changes:
-- - suspended = TRUE: Account locked indefinitely, data preserved, admin can unsuspend anytime
-- - deletion_scheduled_at: Data deletion scheduled (30-day grace period), used for user-initiated or admin-initiated deletion
-- - Both states are independent and can coexist (suspended account can also be scheduled for deletion)

-- Add suspended column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'suspended'
  ) THEN
    ALTER TABLE users ADD COLUMN suspended BOOLEAN DEFAULT FALSE NOT NULL;

    RAISE NOTICE 'Added suspended column to users table';
  ELSE
    RAISE NOTICE 'Column suspended already exists';
  END IF;
END $$;

-- Add suspended_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP;

    RAISE NOTICE 'Added suspended_at column to users table';
  ELSE
    RAISE NOTICE 'Column suspended_at already exists';
  END IF;
END $$;

-- Add suspension_reason column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'suspension_reason'
  ) THEN
    ALTER TABLE users ADD COLUMN suspension_reason TEXT;

    RAISE NOTICE 'Added suspension_reason column to users table';
  ELSE
    RAISE NOTICE 'Column suspension_reason already exists';
  END IF;
END $$;

-- Create index on suspended for performance (used in auth checks and admin queries)
CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(suspended) WHERE suspended = TRUE;

-- Verify columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('suspended', 'suspended_at', 'suspension_reason')
ORDER BY column_name;
