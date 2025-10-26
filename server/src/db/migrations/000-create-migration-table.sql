-- Migration: Create schema migrations tracking table
-- Version: 000
-- Date: 2025-10-24
-- Description: Creates the schema_migrations table to track which migrations have been applied

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) UNIQUE NOT NULL,  -- e.g., "001-create-users-table"
  name VARCHAR(255) NOT NULL,             -- Human-readable description
  applied_at TIMESTAMP DEFAULT NOW(),
  execution_time_ms INTEGER,              -- Performance tracking
  checksum VARCHAR(64)                    -- Verify file hasn't changed
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);

-- Verify the table was created
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'schema_migrations'
ORDER BY ordinal_position;
