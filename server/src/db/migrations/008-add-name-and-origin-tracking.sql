/**
 * Migration: Add Name Fields and Origin Tracking
 *
 * Purpose: Add user name fields for personalization and track creation origin
 * Epic: 2.5 - Compliance & User Profile
 * Date: October 30, 2025
 *
 * Changes:
 * - Add first_name and last_name to users table for email personalization
 * - Add created_via to subscriptions table to track subscription origin
 *
 * Naming Conventions: docs/database/DB-NAMING-STANDARDS.md
 */

-- ============================================================================
-- Add Name Fields to Users Table
-- ============================================================================

-- Add first_name column (e.g., "John")
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

-- Add last_name column (e.g., "Smith" or "Garcia Lopez" for multi-part surnames)
-- Max 150 to ensure first_name (100) + space (1) + last_name (150) = 251 chars (under Stripe's 255 limit)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_name VARCHAR(150);

-- Create index for name searches (useful for admin interfaces)
CREATE INDEX IF NOT EXISTS idx_users_last_name
ON users(last_name)
WHERE last_name IS NOT NULL;

-- Add comments
COMMENT ON COLUMN users.first_name IS 'User first name for email personalization (e.g., "Hi John,")';
COMMENT ON COLUMN users.last_name IS 'User last name - supports multi-part surnames (e.g., "Garcia Lopez")';

-- ============================================================================
-- Add Origin Tracking (Subscriptions & Customers)
-- ============================================================================

-- Create enum for origin tracking (shared between subscriptions and customers)
DO $$ BEGIN
  CREATE TYPE origin_enum AS ENUM (
    'app',                -- Created via app (user self-service)
    'stripe_dashboard',   -- Created manually in Stripe Dashboard by admin
    'api',                -- Created via API (future: CLI, integrations)
    'migration'           -- Created during data migration (historical)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add customer origin tracking to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS customer_created_via origin_enum;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_customer_created_via
ON users(customer_created_via)
WHERE customer_created_via IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.customer_created_via IS 'How Stripe customer was created: app (user checkout), stripe_dashboard (admin), api (integration), migration (historical)';

-- Add subscription origin tracking to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS created_via origin_enum DEFAULT 'app';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_via
ON subscriptions(created_via);

-- Add comment
COMMENT ON COLUMN subscriptions.created_via IS 'How subscription was created: app (user), stripe_dashboard (admin), api (integration), migration (historical)';

/**
 * Verification Queries
 *
 * Run these after migration to verify:
 */

-- Check users table has name and origin columns
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name IN ('first_name', 'last_name', 'customer_created_via')
-- ORDER BY column_name;

-- Check subscriptions table has created_via column
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'subscriptions' AND column_name = 'created_via';

-- Check enum values
-- SELECT enumlabel
-- FROM pg_enum
-- WHERE enumtypid = 'origin_enum'::regtype
-- ORDER BY enumsortorder;

-- Check indexes exist
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('users', 'subscriptions')
-- AND (indexname LIKE '%name%' OR indexname LIKE '%created_via%')
-- ORDER BY tablename, indexname;
