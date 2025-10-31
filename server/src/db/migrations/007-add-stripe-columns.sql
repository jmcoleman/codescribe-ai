/**
 * Migration: Add Stripe Integration Tables
 *
 * Purpose: Add subscriptions table and Stripe customer ID to users table
 * Epic: 2.4 - Payment Integration
 * Date: October 29, 2025
 *
 * Changes:
 * - Add stripe_customer_id to users table
 * - Create subscriptions table for full subscription history
 * - Support multiple subscriptions per user (current + historical)
 *
 * Naming Conventions: docs/database/DB-NAMING-STANDARDS.md
 */

-- Add Stripe customer ID to users table (one customer per user)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Create index for faster lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
ON users(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID (cus_xxx) - links user to Stripe account';

-- Create subscription status enum
-- States match Stripe API: https://docs.stripe.com/api/subscriptions/object#subscription_object-status
DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM (
    'active',              -- Subscription is active and paid
    'canceled',            -- Subscription canceled (access until period end)
    'incomplete',          -- Initial payment incomplete
    'incomplete_expired',  -- Initial payment failed after 23 hours
    'past_due',            -- Payment failed, awaiting retry
    'trialing',            -- In trial period
    'unpaid',              -- Payment failed, no more retries
    'paused'               -- Subscription paused (Stripe feature)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create subscriptions table for full history tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,

  -- Stripe identifiers
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,  -- Which price/plan they're on

  -- Subscription details
  tier VARCHAR(50) NOT NULL,  -- 'starter', 'pro', 'team', 'enterprise'
  status subscription_status_enum NOT NULL DEFAULT 'incomplete',

  -- Billing period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,

  -- Cancellation tracking
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ DEFAULT NULL,
  ended_at TIMESTAMPTZ DEFAULT NULL,

  -- Trial tracking (if applicable)
  trial_start TIMESTAMPTZ DEFAULT NULL,
  trial_end TIMESTAMPTZ DEFAULT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key to users
  CONSTRAINT fk_subscriptions_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  -- Ensure tier matches our tier system
  CONSTRAINT check_valid_tier
    CHECK (tier IN ('free', 'starter', 'pro', 'team', 'enterprise'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
ON subscriptions(status);

-- Composite index for finding active subscription
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status)
WHERE status = 'active';

-- Index for period queries (analytics, billing)
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
ON subscriptions(current_period_end)
WHERE status IN ('active', 'trialing');

-- Comments
COMMENT ON TABLE subscriptions IS 'Full history of user subscriptions for analytics and debugging';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Stripe price ID (price_xxx) - which plan/billing period';
COMMENT ON COLUMN subscriptions.tier IS 'Subscription tier: free, starter, pro, team, enterprise';
COMMENT ON COLUMN subscriptions.status IS 'Current status from Stripe webhook events';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'True if user canceled but has access until period end';
COMMENT ON COLUMN subscriptions.canceled_at IS 'When subscription was canceled (immediate or scheduled)';
COMMENT ON COLUMN subscriptions.ended_at IS 'When subscription actually ended (after period end)';

/**
 * Verification Queries
 *
 * Run these after migration to verify:
 */

-- Check users table has stripe_customer_id
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name = 'stripe_customer_id';

-- Check subscriptions table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'subscriptions'
-- ORDER BY ordinal_position;

-- Check indexes exist
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('users', 'subscriptions')
-- AND (indexname LIKE 'idx_%stripe%' OR indexname LIKE 'idx_subscriptions%')
-- ORDER BY tablename, indexname;

-- Check enum values
-- SELECT enumlabel
-- FROM pg_enum
-- WHERE enumtypid = 'subscription_status_enum'::regtype
-- ORDER BY enumsortorder;

-- Check foreign key constraint
-- SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
-- FROM pg_constraint
-- WHERE conname = 'fk_subscriptions_user';
