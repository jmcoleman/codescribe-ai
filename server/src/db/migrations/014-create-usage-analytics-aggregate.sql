-- Migration 014: Create Usage Analytics Aggregate Table
--
-- Purpose: Store anonymized, aggregated usage data for business analytics
-- when users delete their accounts. Complies with GDPR data minimization
-- while preserving valuable business intelligence.
--
-- Strategy:
-- 1. Aggregate user_quotas data before deletion
-- 2. Store only non-identifying metrics (tier, counts, dates)
-- 3. No PII - completely anonymous analytics
-- 4. Supports business intelligence without privacy violations

CREATE TABLE IF NOT EXISTS usage_analytics_aggregate (
  id SERIAL PRIMARY KEY,

  -- When this data was aggregated (user deletion date)
  deleted_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Non-identifying user characteristics
  tier VARCHAR(50) NOT NULL,  -- 'free', 'starter', 'pro', 'team', 'enterprise'
  account_age_days INTEGER,   -- How long the user had an account
  created_at_month DATE,      -- Month user signed up (for cohort analysis)

  -- Aggregated usage metrics
  total_daily_count INTEGER DEFAULT 0,
  total_monthly_count INTEGER DEFAULT 0,
  avg_daily_count NUMERIC(10,2),
  avg_monthly_count NUMERIC(10,2),
  usage_periods_count INTEGER DEFAULT 0,  -- Number of quota records

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_analytics_deleted_date
  ON usage_analytics_aggregate(deleted_date);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_tier
  ON usage_analytics_aggregate(tier);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_month
  ON usage_analytics_aggregate(created_at_month);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_tier_month
  ON usage_analytics_aggregate(tier, created_at_month);

-- Add comments for documentation
COMMENT ON TABLE usage_analytics_aggregate IS 'Anonymized aggregated usage data from deleted accounts. No PII - used only for business intelligence and product analytics. GDPR compliant under data minimization principle.';

COMMENT ON COLUMN usage_analytics_aggregate.tier IS 'User tier at time of deletion (free/starter/pro/team/enterprise)';
COMMENT ON COLUMN usage_analytics_aggregate.account_age_days IS 'Number of days between account creation and deletion';
COMMENT ON COLUMN usage_analytics_aggregate.created_at_month IS 'Month the user originally signed up (for cohort analysis, e.g., "2024-10-01")';
COMMENT ON COLUMN usage_analytics_aggregate.total_daily_count IS 'Sum of all daily_count values from user_quotas';
COMMENT ON COLUMN usage_analytics_aggregate.total_monthly_count IS 'Sum of all monthly_count values from user_quotas';
COMMENT ON COLUMN usage_analytics_aggregate.avg_daily_count IS 'Average daily_count across all quota periods';
COMMENT ON COLUMN usage_analytics_aggregate.avg_monthly_count IS 'Average monthly_count across all quota periods';
COMMENT ON COLUMN usage_analytics_aggregate.usage_periods_count IS 'Number of quota period records the user had';

-- Verification query (run manually to check table structure)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'usage_analytics_aggregate'
ORDER BY ordinal_position;

-- Verification query for indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'usage_analytics_aggregate'
ORDER BY indexname;
