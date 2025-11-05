-- Migration 013: Fix Subscription Data Retention for Legal/Financial Compliance
--
-- GDPR Article 17(3)(b) allows data retention "for compliance with a legal obligation"
-- Financial regulations require transaction records for 7 years (tax, chargeback, audit)
--
-- Strategy:
-- 1. Change ON DELETE CASCADE to ON DELETE SET NULL
-- 2. Keep subscription records but set user_id to NULL when user deleted
-- 3. Stripe IDs (customer_id, subscription_id) preserved for Stripe correlation
-- 4. Records effectively anonymized (user_id NULL, no PII, but billing history intact)

-- Drop existing foreign key constraint with CASCADE
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS fk_subscriptions_user;

-- Re-add foreign key with SET NULL to preserve records but remove user reference
-- This allows user deletion while keeping billing history for compliance
-- Note: We still have stripe_customer_id and stripe_subscription_id for Stripe correlation
ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscriptions_user
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Make user_id nullable to support ON DELETE SET NULL
ALTER TABLE subscriptions
ALTER COLUMN user_id DROP NOT NULL;

-- Add comment explaining retention policy
COMMENT ON TABLE subscriptions IS 'Subscription records retained for 7 years per financial regulations. User deletions do not cascade to preserve billing history for tax/audit compliance. Records are effectively anonymized since user PII is deleted.';

-- Verification: Check that subscriptions will survive user deletion
-- (Run manually to test, not part of migration)
-- BEGIN;
-- INSERT INTO users (email, first_name, last_name, password_hash) VALUES ('test@example.com', 'Test', 'User', 'hash');
-- INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_price_id, tier, status, current_period_start, current_period_end)
--   VALUES (currval('users_id_seq'), 'sub_test123', 'price_test123', 'pro', 'active', NOW(), NOW() + INTERVAL '30 days');
-- DELETE FROM users WHERE id = currval('users_id_seq');
-- SELECT * FROM subscriptions WHERE stripe_subscription_id = 'sub_test123'; -- Should still exist
-- ROLLBACK;
