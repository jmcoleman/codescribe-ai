/**
 * Migration: Add Theme Preference Column
 *
 * Purpose: Add theme_preference column to users table for appearance settings
 * Date: November 17, 2025
 *
 * Changes:
 * - Add theme_preference column (VARCHAR(10) DEFAULT 'auto')
 * - Add check constraint for valid theme values
 * - Add index for theme preference queries
 *
 * Naming Conventions: docs/database/DB-NAMING-STANDARDS.md
 */

-- Add theme_preference column to users table
-- Defaults to 'auto' (system preference) for existing and new users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) NOT NULL DEFAULT 'auto'
CHECK (theme_preference IN ('light', 'dark', 'auto'));

-- Create index for theme preference queries
-- Useful for analytics on user theme preferences
CREATE INDEX IF NOT EXISTS idx_users_theme_preference
ON users(theme_preference);

-- Add comment
COMMENT ON COLUMN users.theme_preference IS 'User appearance preference: light, dark, or auto (system). Defaults to auto.';

/**
 * Verification Queries
 *
 * Run these after migration to verify:
 */

-- Check column exists with correct properties
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name = 'theme_preference';

-- Check constraint exists
-- SELECT con.conname, pg_get_constraintdef(con.oid)
-- FROM pg_constraint con
-- INNER JOIN pg_class rel ON rel.oid = con.conrelid
-- WHERE rel.relname = 'users' AND con.contype = 'c';

-- Check index exists
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'users'
-- AND indexname = 'idx_users_theme_preference';

-- Count users by theme preference
-- SELECT theme_preference, COUNT(*) as user_count
-- FROM users
-- GROUP BY theme_preference;
