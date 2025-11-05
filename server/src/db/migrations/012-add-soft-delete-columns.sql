/**
 * Migration: Add Soft Delete Columns
 *
 * Purpose: Add columns for 30-day soft delete workflow with restore capability
 * Epic: 2.5 - Legal Compliance (Phase 4: User Data Rights)
 * Date: November 4, 2025
 *
 * Changes:
 * - Add deleted_at column (TIMESTAMP, nullable)
 * - Add deletion_scheduled_at column (TIMESTAMP, nullable)
 * - Add deletion_reason column (TEXT, nullable)
 * - Add restore_token column (VARCHAR(255), nullable)
 * - Add indexes for deletion queries
 *
 * Workflow:
 * 1. User requests deletion → deletion_scheduled_at = NOW() + 30 days
 * 2. Email sent with restore link (restore_token)
 * 3. User can restore within 30 days
 * 4. After 30 days, cron job sets deleted_at = NOW() and permanently deletes
 *
 * Naming Conventions: docs/database/DB-NAMING-STANDARDS.md
 */

-- Add deletion_scheduled_at column
-- When user requests deletion, this is set to NOW() + 30 days
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP NULL;

-- Add deleted_at column
-- Set when account is permanently deleted (after 30-day grace period)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Add deletion_reason column
-- Optional user-provided reason for deletion (for product insights)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deletion_reason TEXT NULL;

-- Add restore_token column
-- Secure token for restore link in deletion confirmation email
ALTER TABLE users
ADD COLUMN IF NOT EXISTS restore_token VARCHAR(255) NULL;

-- Create index for finding scheduled deletions (cron job)
-- Used to find accounts that need permanent deletion
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled
ON users(deletion_scheduled_at)
WHERE deletion_scheduled_at IS NOT NULL AND deleted_at IS NULL;

-- Create index for soft-deleted accounts
-- Used to exclude deleted accounts from queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at
ON users(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Create index for restore token lookups
-- Used when user clicks restore link in email
CREATE INDEX IF NOT EXISTS idx_users_restore_token
ON users(restore_token)
WHERE restore_token IS NOT NULL;

-- Add comments
COMMENT ON COLUMN users.deletion_scheduled_at IS 'When permanent deletion is scheduled (NOW() + 30 days). NULL if not scheduled.';
COMMENT ON COLUMN users.deleted_at IS 'When account was permanently deleted. NULL if not deleted.';
COMMENT ON COLUMN users.deletion_reason IS 'Optional user-provided reason for deletion (for product insights)';
COMMENT ON COLUMN users.restore_token IS 'Secure token for account restore link. NULL after restore or permanent deletion.';

/**
 * Verification Queries
 *
 * Run these after migration to verify:
 */

-- Check columns exist with correct properties
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- AND column_name IN ('deletion_scheduled_at', 'deleted_at', 'deletion_reason', 'restore_token')
-- ORDER BY column_name;

-- Check indexes exist
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'users'
-- AND indexname IN ('idx_users_deletion_scheduled', 'idx_users_deleted_at', 'idx_users_restore_token')
-- ORDER BY indexname;

-- Count users by deletion status
-- SELECT
--   COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as permanently_deleted,
--   COUNT(*) FILTER (WHERE deletion_scheduled_at IS NOT NULL AND deleted_at IS NULL) as scheduled_for_deletion,
--   COUNT(*) FILTER (WHERE deletion_scheduled_at IS NULL AND deleted_at IS NULL) as active
-- FROM users;
