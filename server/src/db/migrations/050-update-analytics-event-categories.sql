-- Migration: 050-update-analytics-event-categories
-- Description: Update event_category values and CHECK constraint
-- Changes:
--   - Rename 'funnel' category to 'workflow'
--   - Add 'system' category for error and performance events
--
-- Categories after migration:
--   - workflow: Core user workflow (session_start, code_input, generation_*, doc_export)
--   - business: Monetization events (login, signup, trial, tier_change, checkout_completed, usage_alert)
--   - usage: Product usage (doc_generation, batch_generation, quality_score, oauth_flow, user_interaction)
--   - system: Infrastructure/technical (error, performance)

-- Step 1: Drop the old CHECK constraint FIRST (allows updating rows)
ALTER TABLE analytics_events
DROP CONSTRAINT IF EXISTS analytics_events_event_category_check;

-- Step 2: Update existing 'funnel' rows to 'workflow'
UPDATE analytics_events
SET event_category = 'workflow'
WHERE event_category = 'funnel';

-- Step 3: Add the new constraint with updated category values
ALTER TABLE analytics_events
ADD CONSTRAINT analytics_events_event_category_check
CHECK (event_category IN ('workflow', 'business', 'usage', 'system'));

-- Verify: Count events by category
-- SELECT event_category, COUNT(*) FROM analytics_events GROUP BY event_category;
