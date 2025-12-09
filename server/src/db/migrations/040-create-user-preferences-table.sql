-- Migration: 040-create-user-preferences-table
-- Description: Create user_preferences table for core UI settings (cross-device sync)
-- Date: 2025-12-08

-- User preferences table for core UI settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Appearance
  theme VARCHAR(10) DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),

  -- Layout
  layout_mode VARCHAR(10) DEFAULT 'split' CHECK (layout_mode IN ('split', 'code', 'doc')),
  sidebar_collapsed BOOLEAN DEFAULT false,
  sidebar_width INTEGER DEFAULT 20 CHECK (sidebar_width >= 10 AND sidebar_width <= 50),

  -- Workspace
  selected_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for project lookups
CREATE INDEX idx_user_preferences_project ON user_preferences(selected_project_id);

-- Comments
COMMENT ON TABLE user_preferences IS 'User UI preferences synced across devices';
COMMENT ON COLUMN user_preferences.theme IS 'Appearance theme: light, dark, or auto';
COMMENT ON COLUMN user_preferences.layout_mode IS 'Code/doc panel layout: split, code, or doc';
COMMENT ON COLUMN user_preferences.sidebar_collapsed IS 'Whether sidebar is collapsed';
COMMENT ON COLUMN user_preferences.sidebar_width IS 'Sidebar width percentage (10-50)';
COMMENT ON COLUMN user_preferences.selected_project_id IS 'Currently selected project for batch generation';
