-- Migration: 047-backfill-analytics-internal-flag
-- Description: Mark existing analytics events from admin/support users as internal
-- This ensures the "Exclude Internal" filter works correctly for historical data

-- Update events from users with admin/support roles
UPDATE analytics_events ae
SET is_internal = TRUE
FROM users u
WHERE ae.user_id = u.id
  AND ae.is_internal = FALSE
  AND u.role IN ('admin', 'support', 'super_admin');

-- Log the number of updated rows (for verification in logs)
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % analytics events to is_internal = TRUE for admin users', updated_count;
END $$;
