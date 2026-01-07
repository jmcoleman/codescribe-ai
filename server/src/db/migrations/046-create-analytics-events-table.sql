-- Migration 046: Create analytics_events table for admin dashboard
-- Created: 2025-01-05
-- Description: Stores analytics events for the admin metrics dashboard
--
-- Features:
-- - Tracks funnel events (session_start, code_input, generation, copy/download)
-- - Tracks business events (signup, tier_upgrade, checkout)
-- - Tracks usage events (doc_generation, batch_generation, quality_score)
-- - Supports filtering by internal users (admins, tier overrides)
-- - JSONB event_data for flexible event properties

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  -- Primary key (UUID for distributed systems compatibility)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL
    CHECK (event_category IN ('funnel', 'business', 'usage')),

  -- Session/User context
  session_id VARCHAR(64),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,

  -- Flexible event data
  event_data JSONB NOT NULL DEFAULT '{}',

  -- Internal user filtering (admins, tier overrides)
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE analytics_events IS 'Stores analytics events for admin dashboard metrics';
COMMENT ON COLUMN analytics_events.event_name IS 'Event type: session_start, code_input, doc_generation, signup, etc.';
COMMENT ON COLUMN analytics_events.event_category IS 'Category for dashboard tabs: funnel, business, or usage';
COMMENT ON COLUMN analytics_events.session_id IS 'Browser session ID from frontend (UUID format)';
COMMENT ON COLUMN analytics_events.user_id IS 'Authenticated user ID (NULL for anonymous)';
COMMENT ON COLUMN analytics_events.ip_address IS 'Client IP for anonymous user tracking';
COMMENT ON COLUMN analytics_events.event_data IS 'Flexible JSONB for event-specific properties';
COMMENT ON COLUMN analytics_events.is_internal IS 'True for admin users or tier override sessions (exclude from metrics)';

-- Indexes for dashboard queries
-- Query by event name and time (most common query pattern)
CREATE INDEX idx_analytics_events_name_created
  ON analytics_events(event_name, created_at DESC);

-- Query by category for tab filtering
CREATE INDEX idx_analytics_events_category_created
  ON analytics_events(event_category, created_at DESC);

-- Note: For date-based time-series queries, use created_at with range conditions
-- e.g., WHERE created_at >= '2024-01-01' AND created_at < '2024-01-02'
-- The idx_analytics_events_name_created and idx_analytics_events_category_created
-- indexes already cover this use case efficiently.

-- Query excluding internal users (most dashboard views)
CREATE INDEX idx_analytics_events_external
  ON analytics_events(created_at DESC)
  WHERE is_internal = FALSE;

-- Query by user for user-specific analytics
CREATE INDEX idx_analytics_events_user
  ON analytics_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Query by session for funnel analysis
CREATE INDEX idx_analytics_events_session
  ON analytics_events(session_id, created_at)
  WHERE session_id IS NOT NULL;

-- Verify migration
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'analytics_events'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'analytics_events'
ORDER BY indexname;

-- Test migration
DO $$
DECLARE
  test_event_id UUID;
  test_user_id INTEGER;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
  VALUES ('analyticstest@example.com', 'Analytics', 'Test', 'hash', true)
  RETURNING id INTO test_user_id;

  -- Test 1: Create funnel event (anonymous)
  INSERT INTO analytics_events (
    event_name, event_category, session_id, ip_address, event_data
  ) VALUES (
    'session_start', 'funnel', 'test-session-001', '192.168.1.1',
    '{"referrer": "google.com", "landing_page": "/"}'::jsonb
  ) RETURNING id INTO test_event_id;

  IF (SELECT COUNT(*) FROM analytics_events WHERE id = test_event_id) = 1 THEN
    RAISE NOTICE 'Test PASSED: Funnel event created';
  ELSE
    RAISE EXCEPTION 'Test FAILED: Funnel event not found';
  END IF;

  -- Test 2: Create business event (authenticated)
  INSERT INTO analytics_events (
    event_name, event_category, user_id, session_id, event_data
  ) VALUES (
    'tier_upgrade', 'business', test_user_id, 'test-session-002',
    '{"previous_tier": "free", "new_tier": "pro"}'::jsonb
  );

  IF (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'tier_upgrade') = 1 THEN
    RAISE NOTICE 'Test PASSED: Business event created';
  ELSE
    RAISE EXCEPTION 'Test FAILED: Business event not found';
  END IF;

  -- Test 3: Create usage event with internal flag
  INSERT INTO analytics_events (
    event_name, event_category, user_id, event_data, is_internal
  ) VALUES (
    'doc_generation', 'usage', test_user_id,
    '{"doc_type": "README", "language": "javascript"}'::jsonb,
    TRUE
  );

  IF (SELECT COUNT(*) FROM analytics_events WHERE is_internal = TRUE) = 1 THEN
    RAISE NOTICE 'Test PASSED: Internal event flagged correctly';
  ELSE
    RAISE EXCEPTION 'Test FAILED: Internal flag not set';
  END IF;

  -- Test 4: Verify category constraint
  BEGIN
    INSERT INTO analytics_events (event_name, event_category, event_data)
    VALUES ('test', 'invalid_category', '{}');
    RAISE EXCEPTION 'Test FAILED: Category constraint not enforced';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test PASSED: Category constraint enforced';
  END;

  -- Test 5: Verify external index excludes internal events
  IF (SELECT COUNT(*) FROM analytics_events WHERE is_internal = FALSE) = 2 THEN
    RAISE NOTICE 'Test PASSED: External events count correct';
  ELSE
    RAISE EXCEPTION 'Test FAILED: External events count incorrect';
  END IF;

  -- Cleanup test data
  DELETE FROM analytics_events WHERE session_id LIKE 'test-session-%' OR user_id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;

  RAISE NOTICE 'Migration 046 completed successfully';
END $$;
