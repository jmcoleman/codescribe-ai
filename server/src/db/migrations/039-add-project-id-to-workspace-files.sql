-- Migration 034: Add project_id to workspace_files
-- Links workspace files to projects for project-based file organization
-- Part of: Graph Engine API (Epic 5.4) - Phase 3: Link batches/workspace to projects

-- Add project_id column (nullable for backward compatibility)
ALTER TABLE workspace_files
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Index for finding files by project
CREATE INDEX IF NOT EXISTS idx_workspace_files_project_id
ON workspace_files(project_id)
WHERE project_id IS NOT NULL;

-- Compound index for project + user queries (ownership validation)
CREATE INDEX IF NOT EXISTS idx_workspace_files_project_user
ON workspace_files(project_id, user_id)
WHERE project_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN workspace_files.project_id IS 'Optional link to project for organizing workspace files';
