/**
 * Migration: Add Tier Override Columns
 *
 * Purpose: Add columns to users table for admin/support tier override functionality
 * Date: November 17, 2025
 *
 * Changes:
 * - Add viewing_as_tier column (nullable, for testing as different tiers)
 * - Add override_expires_at column (nullable, automatic expiry)
 * - Add override_reason column (nullable, audit trail)
 * - Add override_applied_at column (nullable, tracking)
 * - Add check constraint for valid override tiers
 * - Add index for expiry queries
 */

-- Add tier override columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS viewing_as_tier VARCHAR(50) DEFAULT NULL
CHECK (viewing_as_tier IN ('free', 'starter', 'pro', 'team', 'enterprise') OR viewing_as_tier IS NULL);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS override_expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS override_reason TEXT DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS override_applied_at TIMESTAMPTZ DEFAULT NULL;

-- Index for finding users with active overrides (admin dashboard, cleanup)
CREATE INDEX IF NOT EXISTS idx_users_override_expiry
ON users(override_expires_at)
WHERE override_expires_at IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.viewing_as_tier IS 'Temporary tier override for admin/support testing. NULL means no override active.';
COMMENT ON COLUMN users.override_expires_at IS 'When the tier override expires. NULL means no override active.';
COMMENT ON COLUMN users.override_reason IS 'Why the override was applied (required for audit compliance).';
COMMENT ON COLUMN users.override_applied_at IS 'When the override was applied (for audit trail).';
