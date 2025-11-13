-- Migration 017: Add total_generations column with auto-increment trigger
-- Created: 2025-11-13
-- Description: Adds denormalized total_generations column to users table for performance
--              Auto-incremented via trigger when user_quotas is updated
--              Enables O(1) lookup for lifetime usage stats in admin dashboard

-- 1. Add total_generations column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS total_generations INTEGER NOT NULL DEFAULT 0;

-- 2. Create index for fast sorting/filtering by total usage
CREATE INDEX IF NOT EXISTS idx_users_total_generations
ON users(total_generations DESC);

-- 3. Create trigger function to maintain total_generations
CREATE OR REPLACE FUNCTION update_user_total_generations()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: Add new monthly_count to user's total
  IF (TG_OP = 'INSERT') THEN
    UPDATE users
    SET total_generations = total_generations + NEW.monthly_count
    WHERE id = NEW.user_id;
    RETURN NEW;

  -- On UPDATE: Adjust by the difference (new - old)
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE users
    SET total_generations = total_generations + (NEW.monthly_count - OLD.monthly_count)
    WHERE id = NEW.user_id;
    RETURN NEW;

  -- On DELETE: Subtract the monthly_count
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE users
    SET total_generations = total_generations - OLD.monthly_count
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on user_quotas table
DROP TRIGGER IF EXISTS trigger_update_user_total_generations ON user_quotas;

CREATE TRIGGER trigger_update_user_total_generations
AFTER INSERT OR UPDATE OR DELETE ON user_quotas
FOR EACH ROW
EXECUTE FUNCTION update_user_total_generations();

-- 5. Backfill existing data
-- Calculate sum of all monthly_count for each user and update users.total_generations
UPDATE users u
SET total_generations = COALESCE(
  (SELECT SUM(monthly_count)
   FROM user_quotas
   WHERE user_id = u.id),
  0
)
WHERE EXISTS (SELECT 1 FROM user_quotas WHERE user_id = u.id);

-- 6. Verify backfill worked
SELECT
  COUNT(*) as users_with_generations,
  SUM(total_generations) as total_across_all_users,
  MAX(total_generations) as highest_user_total,
  AVG(total_generations) as average_per_user
FROM users
WHERE total_generations > 0;

-- 7. Verify trigger function exists
SELECT
  routine_name,
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_name = 'update_user_total_generations'
  AND routine_schema = 'public';

-- 8. Verify trigger exists
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_user_total_generations'
  AND event_object_table = 'user_quotas';

-- Expected results:
-- - All users should have total_generations >= 0
-- - Users with quotas should have total_generations = SUM of their monthly_counts
-- - Trigger function should exist with RETURNS trigger
-- - Trigger should exist on user_quotas for INSERT/UPDATE/DELETE

-- Log completion
DO $$
DECLARE
  users_count INTEGER;
  total_gens INTEGER;
BEGIN
  SELECT COUNT(*), SUM(total_generations)
  INTO users_count, total_gens
  FROM users
  WHERE total_generations > 0;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'total_generations'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_update_user_total_generations'
  ) THEN
    RAISE NOTICE 'Migration 017 completed successfully';
    RAISE NOTICE '  - Added total_generations column to users table';
    RAISE NOTICE '  - Created trigger to auto-increment on user_quotas changes';
    RAISE NOTICE '  - Backfilled % users with % total generations', users_count, total_gens;
  ELSE
    RAISE EXCEPTION 'Migration 017 FAILED - column or trigger not created';
  END IF;
END $$;
