-- Migration 033: Add project_id to generation_batches
-- Links batches to projects for organizing generation history by project
-- Part of: Graph Engine API (Epic 5.4) - Phase 3: Link batches/workspace to projects

-- Add project_id column (nullable for backward compatibility)
ALTER TABLE generation_batches
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Index for finding batches by project
CREATE INDEX IF NOT EXISTS idx_generation_batches_project_id
ON generation_batches(project_id)
WHERE project_id IS NOT NULL;

-- Compound index for project + user queries (ownership validation)
CREATE INDEX IF NOT EXISTS idx_generation_batches_project_user
ON generation_batches(project_id, user_id)
WHERE project_id IS NOT NULL;

-- Compound index for project history (newest first)
CREATE INDEX IF NOT EXISTS idx_generation_batches_project_created
ON generation_batches(project_id, created_at DESC)
WHERE project_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN generation_batches.project_id IS 'Optional link to project for organizing batch history';
