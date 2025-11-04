/**
 * Migration: Add Analytics Preference Column
 *
 * Purpose: Add analytics_enabled column to users table for privacy settings
 * Epic: 2.5 - Legal Compliance (Phase 3: Account Settings)
 * Date: November 3, 2025
 *
 * Changes:
 * - Add analytics_enabled column (BOOLEAN DEFAULT TRUE)
 * - Add index for analytics preference queries
 *
 * Naming Conventions: docs/database/DB-NAMING-STANDARDS.md
 */

-- Add analytics_enabled column to users table
-- Defaults to TRUE (analytics enabled) for existing users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Create index for analytics preference queries
-- Useful for filtering users by analytics preference or counting opt-outs
CREATE INDEX IF NOT EXISTS idx_users_analytics_enabled
ON users(analytics_enabled);

-- Add comment
COMMENT ON COLUMN users.analytics_enabled IS 'Whether user has enabled analytics tracking (Vercel Analytics, Speed Insights). Defaults to TRUE.';

/**
 * Verification Queries
 *
 * Run these after migration to verify:
 */

-- Check column exists with correct properties
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name = 'analytics_enabled';

-- Check index exists
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'users'
-- AND indexname = 'idx_users_analytics_enabled';

-- Count users by analytics preference
-- SELECT analytics_enabled, COUNT(*) as user_count
-- FROM users
-- GROUP BY analytics_enabled;
