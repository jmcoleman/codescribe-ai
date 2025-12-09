-- Migration: 044-add-project-name-to-batches.sql
-- Description: Add project_name column to generation_batches for denormalized storage
--
-- Purpose:
-- Store project name directly on batches so it persists even if the project is deleted.
-- This provides historical context for batches without requiring the project to exist.
--
-- Sync behavior:
-- - Populated at batch creation from the linked project
-- - Updated when project is renamed (via application code)
-- - Preserved when project is deleted (project_id becomes NULL, but name remains)

-- Add project_name column
ALTER TABLE generation_batches
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- Backfill existing batches with project names from projects table
UPDATE generation_batches gb
SET project_name = p.name
FROM projects p
WHERE gb.project_id = p.id
  AND gb.project_name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN generation_batches.project_name IS 'Denormalized project name - persists even if project is deleted, synced on project rename';
