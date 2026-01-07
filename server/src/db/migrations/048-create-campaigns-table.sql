-- Migration: 048-create-campaigns-table
-- Description: Create campaigns table for admin-configurable auto-trial campaigns
-- Date: 2026-01-07

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,

  -- Campaign identity
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Trial configuration
  trial_tier VARCHAR(50) NOT NULL DEFAULT 'pro'
    CHECK (trial_tier IN ('pro', 'team')),
  trial_days INTEGER NOT NULL DEFAULT 14
    CHECK (trial_days > 0 AND trial_days <= 90),

  -- Campaign scheduling
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,  -- NULL = no end date

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- Stats (denormalized for quick access)
  signups_count INTEGER NOT NULL DEFAULT 0,
  conversions_count INTEGER NOT NULL DEFAULT 0,

  -- Audit
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for active campaign lookup (most common query)
CREATE INDEX idx_campaigns_active ON campaigns(is_active) WHERE is_active = true;

-- Create index for date-based queries
CREATE INDEX idx_campaigns_dates ON campaigns(starts_at, ends_at);

-- Add comments
COMMENT ON TABLE campaigns IS 'Auto-trial campaigns that grant Pro access to new signups';
COMMENT ON COLUMN campaigns.name IS 'Human-readable campaign name (e.g., "January Pro Trial")';
COMMENT ON COLUMN campaigns.trial_tier IS 'Tier to grant: pro or team';
COMMENT ON COLUMN campaigns.trial_days IS 'Trial duration in days (1-90)';
COMMENT ON COLUMN campaigns.starts_at IS 'When campaign becomes active (if is_active=true)';
COMMENT ON COLUMN campaigns.ends_at IS 'When campaign auto-deactivates (NULL = no end)';
COMMENT ON COLUMN campaigns.is_active IS 'Manual toggle - only ONE campaign can be active at a time';
COMMENT ON COLUMN campaigns.signups_count IS 'Number of new users who signed up during this campaign';
COMMENT ON COLUMN campaigns.conversions_count IS 'Number of trial users who converted to paid';

-- Create function to ensure only one active campaign at a time
CREATE OR REPLACE FUNCTION ensure_single_active_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- If activating a campaign, deactivate all others
  IF NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false) THEN
    UPDATE campaigns
    SET is_active = false, updated_at = NOW()
    WHERE id != NEW.id AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for single active campaign enforcement
CREATE TRIGGER trg_ensure_single_active_campaign
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_campaign();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- ============================================================================
-- DOWN MIGRATION (for rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
-- DROP FUNCTION IF EXISTS update_campaigns_updated_at();
-- DROP TRIGGER IF EXISTS trg_ensure_single_active_campaign ON campaigns;
-- DROP FUNCTION IF EXISTS ensure_single_active_campaign();
-- DROP INDEX IF EXISTS idx_campaigns_dates;
-- DROP INDEX IF EXISTS idx_campaigns_active;
-- DROP TABLE IF EXISTS campaigns;
