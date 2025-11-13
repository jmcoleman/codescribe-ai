-- Migration 016: Remove session table (no longer used)
-- Created: 2025-11-13
-- Description: Drops the session table as the app now uses JWT-only authentication
--              Sessions were previously used for passport.js but are no longer needed

-- Drop the session table
DROP TABLE IF EXISTS session CASCADE;

-- Verify the table was dropped
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'session';

-- Expected result: 0 rows (table should not exist)

-- Log completion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'session'
  ) THEN
    RAISE NOTICE 'Migration 016 completed successfully - session table removed';
  ELSE
    RAISE EXCEPTION 'Migration 016 FAILED - session table still exists';
  END IF;
END $$;
