-- Migration: Update campaign trigger to use trial_programs table
-- Version: v3.5.0
-- Date: 2026-01-14
-- Description: Updates the ensure_single_active_campaign() trigger function to reference
--              trial_programs instead of campaigns table after the rename in migration 057.

-- =============================================================================
-- Update trigger function to use new table name
-- =============================================================================

CREATE OR REPLACE FUNCTION ensure_single_active_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- If activating a campaign, deactivate all others
  IF NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false) THEN
    UPDATE trial_programs
    SET is_active = false, updated_at = NOW()
    WHERE id != NEW.id AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger itself (trg_ensure_single_active_campaign) was automatically
-- updated when the table was renamed from campaigns to trial_programs in migration 057.
-- We only need to update the function body to reference the new table name.
