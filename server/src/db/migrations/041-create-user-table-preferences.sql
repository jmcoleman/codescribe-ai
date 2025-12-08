-- Migration: 041-create-user-table-preferences
-- Description: Create user_table_preferences table for per-table UI settings (column sizing, etc.)
-- Date: 2025-12-08

-- Per-table UI preferences (column sizing, sorting, etc.)
CREATE TABLE IF NOT EXISTS user_table_preferences (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  table_id VARCHAR(50) NOT NULL,  -- 'history', 'admin_users', 'trials', etc.

  -- Table state
  column_sizing JSONB DEFAULT '{}',  -- { "columnId": width, ... }

  -- Future extensibility (commented out for now)
  -- sort_state JSONB DEFAULT '[]',
  -- column_visibility JSONB DEFAULT '{}',
  -- column_order TEXT[],

  -- Timestamps
  updated_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (user_id, table_id)
);

-- Index for user lookups
CREATE INDEX idx_user_table_preferences_user ON user_table_preferences(user_id);

-- Comments
COMMENT ON TABLE user_table_preferences IS 'Per-table UI preferences (column sizes, sorting, etc.)';
COMMENT ON COLUMN user_table_preferences.table_id IS 'Table identifier: history, admin_users, trials, etc.';
COMMENT ON COLUMN user_table_preferences.column_sizing IS 'TanStack Table column widths as JSON';
