-- Migration: 030-create-project-graphs-table.sql
-- Description: Create project_graphs table for dependency graph caching
-- Part of: Graph Engine API (Epic 5.4)
--
-- This table stores project dependency graph METADATA only.
-- NO source code is stored - only structural information (function names, imports, exports).
-- Graphs expire after 24 hours for SOC2 compliance.

CREATE TABLE IF NOT EXISTS project_graphs (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Project identification
  project_name VARCHAR(255) NOT NULL,
  project_path VARCHAR(500),
  branch VARCHAR(255) DEFAULT 'main',

  -- Graph data (METADATA ONLY - no source code)
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',

  -- Aggregate statistics
  stats JSONB NOT NULL DEFAULT '{}',

  -- File tracking
  file_count INTEGER NOT NULL DEFAULT 0,
  total_functions INTEGER NOT NULL DEFAULT 0,
  total_classes INTEGER NOT NULL DEFAULT 0,
  total_exports INTEGER NOT NULL DEFAULT 0,

  -- Timestamps and TTL
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_project_graphs_user_id ON project_graphs(user_id);

-- Index for TTL cleanup (find expired graphs)
CREATE INDEX IF NOT EXISTS idx_project_graphs_expires_at ON project_graphs(expires_at);

-- Index for project lookups by user
CREATE INDEX IF NOT EXISTS idx_project_graphs_user_project ON project_graphs(user_id, project_name);

-- Composite index for branch-specific lookups
CREATE INDEX IF NOT EXISTS idx_project_graphs_user_project_branch ON project_graphs(user_id, project_name, branch);

-- Add comment for documentation
COMMENT ON TABLE project_graphs IS 'Caches project dependency graphs (metadata only, no source code). 24h TTL for SOC2 compliance.';
COMMENT ON COLUMN project_graphs.nodes IS 'Array of file nodes with exports, imports, functions (names only, no code)';
COMMENT ON COLUMN project_graphs.edges IS 'Array of dependency edges between files';
COMMENT ON COLUMN project_graphs.expires_at IS 'Graph expires 24 hours after analysis for SOC2 compliance';
