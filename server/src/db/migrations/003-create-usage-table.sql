-- Migration: Create user quotas table
-- Version: 003
-- Date: 2025-10-27
-- Description: Renames existing usage table and creates user_quotas table for quota tracking

-- Step 1: Rename existing usage table to usage_analytics (or create if doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage') THEN
    ALTER TABLE usage RENAME TO usage_analytics;
    RAISE NOTICE 'Renamed existing usage table to usage_analytics';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_analytics') THEN
    -- Create usage_analytics table if neither usage nor usage_analytics exists
    CREATE TABLE usage_analytics (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      operation_type VARCHAR(50) NOT NULL,
      tokens_used INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
    -- Create indexes with compliant names from the start
    CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON usage_analytics(created_at);
    RAISE NOTICE 'Created usage_analytics table with indexes';
  END IF;
END $$;

-- Step 2: Create user_quotas table for quota tracking
CREATE TABLE IF NOT EXISTS user_quotas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_count INTEGER DEFAULT 0 NOT NULL,
  monthly_count INTEGER DEFAULT 0 NOT NULL,
  last_reset_date TIMESTAMP NOT NULL DEFAULT NOW(),
  period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_period UNIQUE (user_id, period_start_date)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_period ON user_quotas(user_id, period_start_date);
CREATE INDEX IF NOT EXISTS idx_user_quotas_last_reset ON user_quotas(last_reset_date);

-- Verify the table was created with correct schema
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_quotas'
ORDER BY ordinal_position;
