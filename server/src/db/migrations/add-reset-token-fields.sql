-- Migration: Add password reset token fields
-- Date: 2025-10-24
-- Description: Adds reset_token_hash and reset_token_expires columns to users table

-- Add reset token columns if they don't exist
DO $$
BEGIN
    -- Add reset_token_hash column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_token_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(255);
        RAISE NOTICE 'Added reset_token_hash column';
    END IF;

    -- Add reset_token_expires column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_token_expires'
    ) THEN
        ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
        RAISE NOTICE 'Added reset_token_expires column';
    END IF;
END $$;

-- Create index for reset token lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token_hash);

-- Verify the migration
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name IN ('reset_token_hash', 'reset_token_expires')
ORDER BY column_name;
