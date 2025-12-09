-- Migration: 031-create-projects-table.sql
-- Description: Create projects table for organizing multi-file documentation sets
-- Part of: Graph Engine API (Epic 5.4) - Phase 1: Projects Entity
--
-- Projects allow users to organize documentation generation across multiple files
-- and reuse dependency graphs without re-uploading all files each time.

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Project metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  github_repo_url VARCHAR(500),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Composite index for user's projects sorted by most recent
CREATE INDEX IF NOT EXISTS idx_projects_user_id_created_at ON projects(user_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE projects IS 'User-created projects for organizing multi-file documentation sets';
COMMENT ON COLUMN projects.name IS 'User-defined project name';
COMMENT ON COLUMN projects.description IS 'Optional project description';
COMMENT ON COLUMN projects.github_repo_url IS 'Optional GitHub repository URL for reference';
