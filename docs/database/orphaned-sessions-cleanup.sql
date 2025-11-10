-- ============================================================================
-- Orphaned Sessions Cleanup Script for CodeScribe AI
-- ============================================================================
-- Purpose: Identify and remove orphaned sessions from production database
-- Author: CodeScribe AI Team
-- Last Updated: November 10, 2025
-- Database: PostgreSQL (Neon)
-- Related Docs: docs/database/ORPHANED-SESSIONS-CLEANUP.md
-- ============================================================================

-- ============================================================================
-- SECTION 1: PREVIEW ORPHANED SESSIONS (READ-ONLY)
-- ============================================================================
-- Run these queries first to understand what will be deleted.
-- SAFE: These queries only read data, they don't modify anything.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Query 1.1: Preview Orphaned Sessions (Count + Samples in One Query)
-- ----------------------------------------------------------------------------
-- PURPOSE: Get count AND sample data in a single efficient query
-- DEFINITION: Orphaned session = session references user ID that doesn't exist
-- EXPECTED: orphaned_count = 0 after proper user deletion (with session cleanup)
-- WHEN TO RUN: Before any cleanup to assess scope of problem
-- EFFICIENCY: Combines count + samples using json_agg (single table scan)
-- ----------------------------------------------------------------------------
SELECT
  -- Total count of orphaned sessions
  COUNT(*) as orphaned_count,

  -- JSON array of up to 5 sample sessions with key details
  json_agg(
    json_build_object(
      'sid', substring(sid, 1, 20),           -- First 20 chars of session ID
      'user_id', sess::jsonb->'passport'->>'user',  -- Orphaned user ID
      'expires', expire,                      -- Expiration timestamp
      'is_expired', (expire < NOW())          -- Already expired flag
    )
  ) FILTER (WHERE row_number() OVER (ORDER BY expire DESC) <= 5) as samples

FROM sessions

WHERE
  -- Check if session has a user ID stored
  sess::jsonb->'passport'->>'user' IS NOT NULL
  -- Check if that user ID doesn't exist (or is soft-deleted)
  AND NOT EXISTS (
    SELECT 1
    FROM users
    WHERE
      -- Convert user.id (integer) to text for comparison with JSON field
      id::text = sess::jsonb->'passport'->>'user'
      -- Exclude tombstoned users (scheduled for deletion)
      AND deleted_at IS NULL
  );

-- INTERPRETATION:
-- orphaned_count = 0   → ✅ Healthy database, no cleanup needed (samples = null)
-- orphaned_count > 0   → ⚠️  Orphaned sessions detected, review samples
-- orphaned_count > 100 → 🚨 Large number, investigate root cause first
--
-- SAMPLE OUTPUT:
-- {
--   "orphaned_count": 3,
--   "samples": [
--     {"sid": "s:abc123...", "user_id": "123", "expires": "2025-11-15T00:00:00Z", "is_expired": false},
--     {"sid": "s:def456...", "user_id": "456", "expires": "2025-11-12T00:00:00Z", "is_expired": true},
--     {"sid": "s:ghi789...", "user_id": "789", "expires": "2025-11-18T00:00:00Z", "is_expired": false}
--   ]
-- }


-- ----------------------------------------------------------------------------
-- Query 1.3: Breakdown by Expiration Status
-- ----------------------------------------------------------------------------
-- PURPOSE: Categorize orphaned sessions by expiration status
-- USE CASES:
--   - Prioritize cleanup (active vs expired)
--   - Estimate impact on users (active sessions = users seeing errors)
--   - Decide if manual cleanup needed or wait for auto-expiry
-- ----------------------------------------------------------------------------
SELECT
  -- Categorize sessions by expiration status
  CASE
    WHEN expire > NOW() + INTERVAL '24 hours' THEN 'Active (>24h remaining)'
    WHEN expire > NOW() THEN 'Active (<24h remaining)'
    ELSE 'Already Expired'
  END as status_category,

  -- Count sessions in each category
  COUNT(*) as session_count,

  -- Show earliest and latest expiration in each category
  MIN(expire) as earliest_expiry,
  MAX(expire) as latest_expiry

FROM sessions

WHERE
  -- Same orphaned session detection logic
  sess::jsonb->'passport'->>'user' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE id::text = sess::jsonb->'passport'->>'user'
      AND deleted_at IS NULL
  )

GROUP BY status_category
ORDER BY
  CASE
    WHEN status_category LIKE 'Active (>24h%' THEN 1
    WHEN status_category LIKE 'Active (<24h%' THEN 2
    ELSE 3
  END;

-- INTERPRETATION:
-- 'Active (>24h remaining)' → High priority, users getting errors now
-- 'Active (<24h remaining)' → Medium priority, will expire soon
-- 'Already Expired'         → Low priority, auto-cleanup will handle


-- ============================================================================
-- SECTION 2: DELETE ORPHANED SESSIONS (DESTRUCTIVE)
-- ============================================================================
-- ⚠️ WARNING: This query DELETES data from the database
-- PREREQUISITES:
--   1. Review results from Section 1 queries above
--   2. Verify orphaned_count matches expectations
--   3. Confirm sessions are truly orphaned (user IDs don't exist)
--   4. Take database backup if running for first time
-- SAFETY:
--   - Only deletes from `sessions` table (no user data affected)
--   - Idempotent (can run multiple times safely)
--   - Does NOT delete valid user sessions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Query 2.1: Delete All Orphaned Sessions
-- ----------------------------------------------------------------------------
-- PURPOSE: Remove orphaned sessions to prevent "Failed to deserialize" errors
-- WHEN TO RUN:
--   - After manually deleting users from database console
--   - When seeing 500 errors on /api/user/usage or /api/legal/status
--   - When usage dashboard fails to load for logged-in users
--   - As part of quarterly database maintenance
-- IMPACT:
--   - Deleted users will be fully logged out (prevents errors)
--   - Valid user sessions remain untouched
--   - No user data lost (only session tokens deleted)
-- ----------------------------------------------------------------------------
DELETE FROM sessions
WHERE
  -- Only delete sessions that reference a user ID
  sess::jsonb->'passport'->>'user' IS NOT NULL

  -- Only delete if that user ID doesn't exist in users table
  AND NOT EXISTS (
    SELECT 1
    FROM users
    WHERE
      -- Match user ID from session to user ID in users table
      id::text = sess::jsonb->'passport'->>'user'
      -- Don't delete sessions for soft-deleted users (they can restore)
      AND deleted_at IS NULL
  );

-- EXPECTED OUTPUT:
-- DELETE X   (where X = orphaned_count from Query 1.1)
-- If X = 0, no orphaned sessions found (healthy database)

-- POST-EXECUTION CHECKLIST:
-- [ ] Run Query 3.1 to verify orphaned_count = 0
-- [ ] Run Query 3.2 to verify valid sessions remain
-- [ ] Test login/logout in production
-- [ ] Check Vercel logs for "Successfully deserialized user" messages


-- ============================================================================
-- SECTION 3: VERIFY CLEANUP SUCCESS (READ-ONLY)
-- ============================================================================
-- Run these queries after deletion to confirm cleanup was successful.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Query 3.1: Confirm Zero Orphaned Sessions
-- ----------------------------------------------------------------------------
-- PURPOSE: Verify all orphaned sessions removed
-- EXPECTED: remaining_orphaned = 0
-- IF NON-ZERO: Re-run Section 1 queries to investigate
-- ----------------------------------------------------------------------------
SELECT
  COUNT(*) as remaining_orphaned,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All orphaned sessions removed'
    ELSE '⚠️  Orphaned sessions still exist - investigate'
  END as status
FROM sessions
WHERE
  sess::jsonb->'passport'->>'user' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE id::text = sess::jsonb->'passport'->>'user'
      AND deleted_at IS NULL
  );


-- ----------------------------------------------------------------------------
-- Query 3.2: Count Sessions by Type
-- ----------------------------------------------------------------------------
-- PURPOSE: Show breakdown of all sessions (valid, anonymous, orphaned)
-- USE CASES:
--   - Verify valid user sessions remain after cleanup
--   - Monitor anonymous sessions (unauthenticated users)
--   - Ongoing health monitoring
-- ----------------------------------------------------------------------------
SELECT
  -- Categorize each session by type
  CASE
    WHEN u.id IS NOT NULL THEN 'Valid User Session'
    WHEN sess::jsonb->'passport'->>'user' IS NULL THEN 'Anonymous Session'
    ELSE 'Orphaned Session'
  END as session_type,

  -- Count sessions in each category
  COUNT(*) as session_count,

  -- Calculate percentage of total sessions
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage

FROM sessions s
LEFT JOIN users u
  ON u.id::text = s.sess::jsonb->'passport'->>'user'
  AND u.deleted_at IS NULL

GROUP BY session_type
ORDER BY session_count DESC;

-- EXPECTED RESULTS AFTER CLEANUP:
-- session_type          | session_count | percentage
-- ----------------------|---------------|------------
-- Valid User Session    | 45            | 78.95%
-- Anonymous Session     | 12            | 21.05%
-- Orphaned Session      | 0             | 0.00%      ← Should always be 0


-- ----------------------------------------------------------------------------
-- Query 3.3: Total Sessions Summary
-- ----------------------------------------------------------------------------
-- PURPOSE: High-level overview of session health
-- WHEN TO RUN: After cleanup, and regularly for monitoring
-- ----------------------------------------------------------------------------
SELECT
  -- Total sessions across all types
  COUNT(*) as total_sessions,

  -- Active sessions (not yet expired)
  COUNT(CASE WHEN expire > NOW() THEN 1 END) as active_sessions,

  -- Expired sessions (will be cleaned up by Passport eventually)
  COUNT(CASE WHEN expire < NOW() THEN 1 END) as expired_sessions,

  -- Sessions with user IDs (authenticated sessions)
  COUNT(CASE WHEN sess::jsonb->'passport'->>'user' IS NOT NULL THEN 1 END) as authenticated_sessions,

  -- Sessions without user IDs (unauthenticated users)
  COUNT(CASE WHEN sess::jsonb->'passport'->>'user' IS NULL THEN 1 END) as anonymous_sessions

FROM sessions;

-- TYPICAL HEALTHY VALUES:
-- total_sessions:          50-200 (depends on traffic)
-- active_sessions:         40-180 (80-90% of total)
-- expired_sessions:        10-20  (10-20% of total)
-- authenticated_sessions:  30-150 (depends on signup rate)
-- anonymous_sessions:      10-50  (unauthenticated browsing)


-- ============================================================================
-- SECTION 4: BACKUP & RESTORE (EMERGENCY USE)
-- ============================================================================
-- Use these queries if you need to backup sessions before cleanup
-- or restore sessions if something goes wrong.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Query 4.1: Backup Sessions Table (Before Cleanup)
-- ----------------------------------------------------------------------------
-- PURPOSE: Create a backup of all sessions before running cleanup
-- WHEN TO USE: First-time cleanup, or if uncertain about impact
-- STORAGE: Creates new table `sessions_backup_YYYYMMDD`
-- ----------------------------------------------------------------------------
-- CREATE TABLE sessions_backup_20251110 AS
-- SELECT * FROM sessions;

-- VERIFY BACKUP:
-- SELECT COUNT(*) FROM sessions_backup_20251110;

-- RESTORE IF NEEDED:
-- TRUNCATE sessions;
-- INSERT INTO sessions SELECT * FROM sessions_backup_20251110;


-- ----------------------------------------------------------------------------
-- Query 4.2: Backup Only Orphaned Sessions (For Audit Trail)
-- ----------------------------------------------------------------------------
-- PURPOSE: Keep record of which sessions were orphaned (for investigation)
-- WHEN TO USE: If you need to analyze why sessions became orphaned
-- ----------------------------------------------------------------------------
-- CREATE TABLE orphaned_sessions_audit_20251110 AS
-- SELECT
--   sid,
--   sess::jsonb->'passport'->>'user' as orphaned_user_id,
--   expire,
--   NOW() as audit_timestamp
-- FROM sessions
-- WHERE
--   sess::jsonb->'passport'->>'user' IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM users
--     WHERE id::text = sess::jsonb->'passport'->>'user'
--       AND deleted_at IS NULL
--   );


-- ============================================================================
-- SECTION 5: ADVANCED DIAGNOSTICS
-- ============================================================================
-- Additional queries for troubleshooting complex session issues.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Query 5.1: Find Sessions for Specific User ID
-- ----------------------------------------------------------------------------
-- PURPOSE: Check if a specific user has orphaned sessions
-- USE CASE: User reports being logged out unexpectedly
-- USAGE: Replace '123' with actual user ID
-- ----------------------------------------------------------------------------
-- SELECT
--   sid,
--   sess::jsonb->'passport'->>'user' as user_id,
--   expire,
--   (expire > NOW()) as is_active,
--   sess::jsonb->'cookie' as cookie_data
-- FROM sessions
-- WHERE sess::jsonb->'passport'->>'user' = '123';


-- ----------------------------------------------------------------------------
-- Query 5.2: Find Users with Multiple Sessions
-- ----------------------------------------------------------------------------
-- PURPOSE: Identify users with unusual number of sessions
-- USE CASE: Detect potential session management issues
-- ----------------------------------------------------------------------------
-- SELECT
--   sess::jsonb->'passport'->>'user' as user_id,
--   COUNT(*) as session_count,
--   MAX(expire) as latest_expiry,
--   MIN(expire) as earliest_expiry
-- FROM sessions
-- WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
-- GROUP BY user_id
-- HAVING COUNT(*) > 3  -- Flag users with >3 sessions
-- ORDER BY session_count DESC;


-- ----------------------------------------------------------------------------
-- Query 5.3: Sessions Expiring Soon (Next 24 Hours)
-- ----------------------------------------------------------------------------
-- PURPOSE: Preview sessions that will expire soon
-- USE CASE: Estimate impact of natural session expiry
-- ----------------------------------------------------------------------------
-- SELECT
--   COUNT(*) as expiring_soon,
--   COUNT(CASE WHEN sess::jsonb->'passport'->>'user' IS NOT NULL THEN 1 END) as authenticated,
--   COUNT(CASE WHEN sess::jsonb->'passport'->>'user' IS NULL THEN 1 END) as anonymous
-- FROM sessions
-- WHERE expire BETWEEN NOW() AND NOW() + INTERVAL '24 hours';


-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- RELATED DOCUMENTATION:
--   - docs/database/ORPHANED-SESSIONS-CLEANUP.md (Full cleanup guide)
--   - docs/database/DB-NAMING-STANDARDS.md (Naming conventions)
--   - server/src/models/User.js (User deletion with session cleanup)
--   - server/src/middleware/auth.js (Session validation)
--   - server/src/config/passport.js (Deserialization safety)
--
-- MAINTENANCE SCHEDULE:
--   - Run Section 1 queries quarterly (every 3 months)
--   - Run Section 2 cleanup if orphaned_count > 0
--   - Run Section 3 verification after every cleanup
--
-- SUPPORT:
--   - GitHub Issues: https://github.com/codescribe-ai/codescribe-ai/issues
--   - Documentation: https://docs.codescribeai.com
-- ============================================================================
