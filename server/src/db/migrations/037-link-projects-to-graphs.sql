-- Migration: 037-link-projects-to-graphs.sql
-- Description: Add foreign key to link project_graphs to persistent projects
-- Part of: Graph Engine API (Epic 5.4) - Phase 2: Link Projects to Graphs
--
-- This migration adds a nullable FK column to project_graphs that references
-- the persistent projects table. This allows:
-- 1. Graphs to be associated with user-created projects
-- 2. Graph reuse across multiple batch generations
-- 3. Backward compatibility (anonymous graphs still work via graph_id hash)

-- Add nullable foreign key column to project_graphs
ALTER TABLE project_graphs
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

-- Index for looking up graphs by project ID
CREATE INDEX IF NOT EXISTS idx_project_graphs_project_id
ON project_graphs(project_id)
WHERE project_id IS NOT NULL;

-- Composite index for finding a user's graph for a specific project
CREATE INDEX IF NOT EXISTS idx_project_graphs_user_project_id
ON project_graphs(user_id, project_id)
WHERE project_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN project_graphs.project_id IS 'Optional FK to projects table for persistent project association. NULL for ad-hoc/anonymous graphs.';
