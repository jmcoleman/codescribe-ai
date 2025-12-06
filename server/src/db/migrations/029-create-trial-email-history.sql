-- Migration 029: Create trial_email_history table
-- Tracks email reminders sent for trials to prevent duplicate sends
-- Part of v3.1.0 Trial Operations & Analytics

-- Create trial_email_history table
CREATE TABLE IF NOT EXISTS trial_email_history (
  id SERIAL PRIMARY KEY,

  -- References
  trial_id INTEGER NOT NULL REFERENCES user_trials(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Email details
  email_type VARCHAR(50) NOT NULL
    CHECK (email_type IN ('3_day_reminder', '1_day_reminder', 'trial_expired', 'trial_extended')),

  -- Delivery status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),

  -- Error tracking for failed sends
  error_message TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: Only one email of each type per trial
-- This prevents duplicate reminder sends
CREATE UNIQUE INDEX idx_trial_email_unique
  ON trial_email_history(trial_id, email_type);

-- Index for querying by user
CREATE INDEX idx_trial_email_user
  ON trial_email_history(user_id, sent_at DESC);

-- Index for querying pending/failed emails for retry
CREATE INDEX idx_trial_email_status
  ON trial_email_history(status)
  WHERE status IN ('pending', 'failed');

-- Index for analytics queries
CREATE INDEX idx_trial_email_type_date
  ON trial_email_history(email_type, created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trial_email_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trial_email_history_updated_at
  BEFORE UPDATE ON trial_email_history
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_email_history_updated_at();

-- Comments for documentation
COMMENT ON TABLE trial_email_history IS 'Tracks trial-related email notifications to prevent duplicate sends';
COMMENT ON COLUMN trial_email_history.email_type IS 'Type of email: 3_day_reminder, 1_day_reminder, trial_expired, trial_extended';
COMMENT ON COLUMN trial_email_history.status IS 'Delivery status: pending (queued), sent (delivered), failed (error), skipped (already sent)';
