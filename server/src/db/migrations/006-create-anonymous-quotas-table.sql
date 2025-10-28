-- Migration: Create anonymous quotas table
-- Version: 006
-- Date: 2025-10-28
-- Description: Creates anonymous_quotas table for tracking usage by IP address before user signup

-- Create anonymous_quotas table for IP-based usage tracking
CREATE TABLE IF NOT EXISTS anonymous_quotas (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,  -- Supports both IPv4 and IPv6
  daily_count INTEGER DEFAULT 0 NOT NULL,
  monthly_count INTEGER DEFAULT 0 NOT NULL,
  last_reset_date TIMESTAMP NOT NULL DEFAULT NOW(),
  period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_ip_period UNIQUE (ip_address, period_start_date),
  CONSTRAINT check_positive_daily_count CHECK (daily_count >= 0),
  CONSTRAINT check_positive_monthly_count CHECK (monthly_count >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_quotas_ip_period ON anonymous_quotas(ip_address, period_start_date);
CREATE INDEX IF NOT EXISTS idx_anonymous_quotas_last_reset ON anonymous_quotas(last_reset_date);
CREATE INDEX IF NOT EXISTS idx_anonymous_quotas_period_start ON anonymous_quotas(period_start_date);

-- Add comment to table for documentation
COMMENT ON TABLE anonymous_quotas IS 'Tracks usage quotas for anonymous users by IP address. Data is migrated to user_quotas when user signs up.';
COMMENT ON COLUMN anonymous_quotas.ip_address IS 'IP address of anonymous user (IPv4 or IPv6)';
COMMENT ON COLUMN anonymous_quotas.daily_count IS 'Number of generations today';
COMMENT ON COLUMN anonymous_quotas.monthly_count IS 'Number of generations this month';
COMMENT ON COLUMN anonymous_quotas.last_reset_date IS 'Last time daily counter was reset';
COMMENT ON COLUMN anonymous_quotas.period_start_date IS 'Start date of current monthly period (YYYY-MM-01)';

-- Verify the table was created with correct schema
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'anonymous_quotas'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'anonymous_quotas'
ORDER BY indexname;
