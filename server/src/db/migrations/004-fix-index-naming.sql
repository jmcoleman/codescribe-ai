-- Migration: Fix index naming to comply with DB-NAMING-STANDARDS.md
-- Version: 004
-- Date: 2025-10-27
-- Description: Renames non-compliant indexes and removes duplicate index from pre-migration schema

-- Step 1: Rename usage_analytics indexes to include full table name
-- Standard: idx_<table>_<column> requires full table name, not abbreviated
ALTER INDEX IF EXISTS idx_usage_user_id RENAME TO idx_usage_analytics_user_id;
ALTER INDEX IF EXISTS idx_usage_created_at RENAME TO idx_usage_analytics_created_at;

-- Step 2: Fix session index naming (PascalCase to snake_case)
-- Drop the non-compliant PascalCase index and create the compliant snake_case version
DROP INDEX IF EXISTS "IDX_session_expire";
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

-- Step 3: Add missing index for operation_type column (frequently queried)
-- This column is used for filtering analytics by operation type
CREATE INDEX IF NOT EXISTS idx_usage_analytics_operation ON usage_analytics(operation_type);

-- Verify indexes were renamed/created correctly
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('usage_analytics', 'session')
    AND indexname LIKE 'idx%'
ORDER BY tablename, indexname;
