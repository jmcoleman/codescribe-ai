-- Migration 009: Add livemode column to subscriptions table
-- Purpose: Track whether subscription was created in Stripe test mode (sandbox) or live mode (production)
-- Date: October 31, 2025
--
-- Background:
-- - Stripe includes a 'livemode' boolean on all API objects (subscriptions, payments, etc.)
-- - livemode=false: Test/sandbox subscription (no real payment, tier stays FREE)
-- - livemode=true: Production subscription (real payment, tier upgraded)
--
-- Use Cases:
-- 1. Prevent tier upgrades from sandbox subscriptions while still allowing checkout flow testing
-- 2. Analytics: Track which subscription tiers users tested vs purchased
-- 3. Debugging: Distinguish test data from production data

-- Add livemode column to track test vs production subscriptions
ALTER TABLE subscriptions
ADD COLUMN livemode BOOLEAN NOT NULL DEFAULT false;

-- Add index for common query pattern: "get all production subscriptions"
CREATE INDEX IF NOT EXISTS idx_subscriptions_livemode
ON subscriptions(livemode);

-- Add composite index for common query: "get active production subscriptions for user"
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_livemode_status
ON subscriptions(user_id, livemode, status);

-- Verification queries (run after migration)
-- 1. Verify column added: SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'livemode';
-- 2. Verify indexes: SELECT indexname FROM pg_indexes WHERE tablename = 'subscriptions' AND indexname LIKE '%livemode%';
-- 3. Check existing subscriptions defaulted to false: SELECT id, stripe_subscription_id, livemode FROM subscriptions LIMIT 5;
