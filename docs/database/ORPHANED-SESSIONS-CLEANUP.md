# Orphaned Sessions Cleanup Guide

**Last Updated:** November 10, 2025
**Status:** Active maintenance procedure

---

## 📋 Overview

This guide explains how to identify and clean up orphaned sessions in the production database. Orphaned sessions occur when user records are deleted but their sessions remain in the `sessions` table, causing "Failed to deserialize user" errors and 500 status codes on authenticated endpoints.

---

## 🔍 What Are Orphaned Sessions?

**Orphaned sessions** are database records in the `sessions` table that reference user IDs that no longer exist in the `users` table.

### **How They Occur:**

1. User account is deleted manually via database console
2. User is deleted via `User.delete()` (before session cleanup was added)
3. User account is permanently deleted via `User.permanentlyDelete()`
4. Database migrations or resets that don't clean up sessions

### **Symptoms:**

- 500 errors on authenticated endpoints (`/api/user/usage`, `/api/legal/status`)
- Browser console errors: "Failed to fetch usage: Error: Failed to fetch usage: 500"
- Vercel logs showing: "Failed to deserialize user out of session"
- Usage dashboard not loading metric cards
- User appears logged in but can't access authenticated features

---

## 🛠️ Prevention (Implemented)

As of November 10, 2025, we have three layers of protection:

### **Layer 1: Automatic Session Cleanup on User Deletion**

Both `User.delete()` and `User.permanentlyDelete()` now automatically clean up sessions:

```javascript
// User.js lines 222-225 and 686-689
await sql`
  DELETE FROM sessions
  WHERE sess::jsonb->'passport'->>'user' = ${id.toString()}
`;
```

**Prevents:** Future orphaned sessions when users are deleted via application code

### **Layer 2: Invalid Session Detection**

The `requireAuth` middleware detects and clears invalid sessions:

```javascript
// auth.js lines 36-51
if (req.isAuthenticated() && !req.user) {
  req.logout();
  req.session.destroy();
  return res.status(401).json({
    error: 'Invalid session - please log in again',
    sessionCleared: true
  });
}
```

**Catches:** Orphaned sessions from manual database deletions or legacy issues

### **Layer 3: Passport Deserialization Safety**

Passport's `deserializeUser` returns `false` instead of crashing:

```javascript
// passport.js lines 22-45
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  if (!user) {
    console.log(`[Passport] User not found - clearing invalid session`);
    return done(null, false); // Don't crash
  }
  done(null, user);
});
```

**Prevents:** 500 errors when deserialization fails

---

## 🧹 Cleanup Methods

### **Method 1: Neon SQL Editor** ⭐ **RECOMMENDED FOR PRODUCTION**

Safest method for production databases.

#### **Step 1: Preview Orphaned Sessions**

```sql
-- Count orphaned sessions
SELECT COUNT(*) as orphaned_count
FROM sessions
WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE id::text = sess::jsonb->'passport'->>'user'
      AND deleted_at IS NULL
  );
```

#### **Step 2: View Sample Sessions**

```sql
-- Show first 5 orphaned sessions with details
SELECT
  substring(sid, 1, 20) as session_id,
  sess::jsonb->'passport'->>'user' as user_id,
  expire as expires_at,
  (expire < NOW()) as is_expired
FROM sessions
WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE id::text = sess::jsonb->'passport'->>'user'
      AND deleted_at IS NULL
  )
ORDER BY expire DESC
LIMIT 5;
```

#### **Step 3: Delete Orphaned Sessions**

```sql
-- Delete orphaned sessions (safe - only deletes sessions, not users)
DELETE FROM sessions
WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE id::text = sess::jsonb->'passport'->>'user'
      AND deleted_at IS NULL
  );
```

#### **Step 4: Verify Cleanup**

```sql
-- Confirm all orphaned sessions removed (should return 0)
SELECT COUNT(*) as remaining_orphaned
FROM sessions
WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE id::text = sess::jsonb->'passport'->>'user'
      AND deleted_at IS NULL
  );
```

#### **Step 5: Check Total Sessions**

```sql
-- View total sessions remaining
SELECT
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN expire > NOW() THEN 1 END) as active_sessions,
  COUNT(CASE WHEN expire < NOW() THEN 1 END) as expired_sessions
FROM sessions;
```

---

### **Method 2: Cleanup Script** ⚠️ **USE WITH CAUTION**

Automated script for development, staging, or emergency production use.

#### **Usage:**

```bash
cd server
npm run cleanup:sessions
```

#### **What It Does:**

1. Counts orphaned sessions
2. Shows sample of first 5 orphaned sessions
3. Deletes all orphaned sessions
4. Verifies cleanup completed
5. Reports total sessions remaining

#### **Example Output:**

```
🚀 Orphaned Session Cleanup Script
==================================================
Environment: production
Database: ep-cool-silence-a5xz2y3b.us-east-2.aws.neon.tech
==================================================

🔍 Starting orphaned session cleanup...

📊 Found 3 orphaned session(s)

📝 Sample orphaned sessions:
  1. Session ID: s:abc123def456...
     User ID: 123
     Expires: 2025-11-15T00:00:00.000Z
  2. Session ID: s:xyz789uvw...
     User ID: 456
     Expires: 2025-11-12T00:00:00.000Z
  3. Session ID: s:ghi789jkl...
     User ID: 789
     Expires: 2025-11-18T00:00:00.000Z

🗑️  Deleting orphaned sessions...
✅ Deleted 3 orphaned session(s)

✅ Cleanup successful! All orphaned sessions removed.
📊 Total sessions remaining: 15
```

#### **Safety Notes:**

- ✅ Read-only queries run first (preview before deletion)
- ✅ Only deletes sessions, never users
- ✅ Can be run multiple times safely (idempotent)
- ⚠️ Requires `POSTGRES_URL` environment variable
- ⚠️ Runs against production database if production env vars set

---

## 📊 Query Explanation

### **How the Orphaned Session Query Works:**

```sql
WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
```
- `sess::jsonb` - Cast `sess` column to JSONB type for JSON operations
- `->` - Navigate to nested 'passport' object
- `->>'user'` - Extract 'user' field as text (the user ID)
- `IS NOT NULL` - Only check sessions that have a user ID stored

```sql
AND NOT EXISTS (
  SELECT 1 FROM users
  WHERE id::text = sess::jsonb->'passport'->>'user'
    AND deleted_at IS NULL
)
```
- `NOT EXISTS` - Session is orphaned if no matching user found
- `id::text` - Convert user.id (integer) to text for comparison
- `deleted_at IS NULL` - Exclude tombstoned users (soft-deleted)

---

## 🔄 When to Run Cleanup

### **Immediate Cleanup Required:**

- ✅ After manually deleting users from database console
- ✅ When seeing "Failed to deserialize user" errors in production
- ✅ When usage dashboard fails to load for logged-in users
- ✅ After database migrations that affect user records

### **Periodic Maintenance:**

- 📅 **Quarterly** - Run as part of routine database maintenance
- 📅 **After major releases** - Verify no orphaned sessions introduced
- 📅 **Before major migrations** - Clean slate before schema changes

### **NOT Required After:**

- ❌ Normal user login/logout (sessions managed automatically)
- ❌ User account deletion via Settings page (Layer 1 handles cleanup)
- ❌ Scheduled account deletions (Layer 1 handles cleanup)
- ❌ Expired session cleanup (Passport handles expired sessions)

---

## 🚨 Emergency Recovery

If production is currently experiencing orphaned session errors:

### **Immediate Steps:**

1. **Run SQL cleanup in Neon** (Method 1 above)
2. **Verify cleanup completed** (remaining_orphaned = 0)
3. **Ask affected users to log out and log back in**
4. **Monitor Vercel logs** for "Successfully deserialized user" messages

### **If Issues Persist:**

1. Check Vercel logs for specific error messages:
   ```bash
   vercel logs --prod | grep "Passport\|Auth"
   ```

2. Verify all fixes are deployed:
   - User.delete() session cleanup
   - requireAuth session validation
   - passport.deserializeUser safety

3. Check for database connectivity issues:
   ```bash
   cd server && npm run db:test
   ```

---

## 📈 Monitoring

### **Health Check Queries:**

```sql
-- Count sessions by user existence
SELECT
  CASE
    WHEN u.id IS NOT NULL THEN 'Valid Session'
    WHEN sess::jsonb->'passport'->>'user' IS NULL THEN 'Anonymous Session'
    ELSE 'Orphaned Session'
  END as session_type,
  COUNT(*) as count
FROM sessions s
LEFT JOIN users u ON u.id::text = s.sess::jsonb->'passport'->>'user'
  AND u.deleted_at IS NULL
GROUP BY session_type;
```

**Expected Results:**
```
session_type        | count
--------------------+-------
Valid Session       | 45
Anonymous Session   | 12
Orphaned Session    | 0     ← Should always be 0
```

### **Vercel Log Monitoring:**

```bash
# Check for orphaned session errors
vercel logs --prod | grep "User not found for ID"

# Check for successful deserializations
vercel logs --prod | grep "Successfully deserialized user"

# Check for session clearing
vercel logs --prod | grep "Session exists but no user loaded"
```

---

## ⚙️ Technical Details

### **Session Table Schema:**

```sql
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,           -- Session ID (from cookie)
  sess JSON NOT NULL,                -- Session data (includes user ID)
  expire TIMESTAMP(6) NOT NULL       -- Expiration timestamp
);

CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
```

### **Session Data Structure:**

```json
{
  "cookie": {
    "originalMaxAge": 604800000,
    "expires": "2025-11-17T00:00:00.000Z",
    "httpOnly": true,
    "path": "/"
  },
  "passport": {
    "user": 123  ← User ID stored here
  }
}
```

### **Why Foreign Keys Don't Work:**

PostgreSQL foreign keys require a table column, not a JSON field. Since `sess` is a JSON column and the user ID is nested inside (`sess->passport->user`), we cannot create a `FOREIGN KEY` constraint with `ON DELETE CASCADE`.

**Solution:** Manual cleanup via SQL queries or application code.

---

## 📚 Related Documentation

- [DB-NAMING-STANDARDS.md](DB-NAMING-STANDARDS.md) - Database naming conventions
- [DB-MIGRATION-MANAGEMENT.MD](DB-MIGRATION-MANAGEMENT.MD) - Migration testing workflow
- [PRODUCTION-DB-SETUP.md](PRODUCTION-DB-SETUP.md) - Production database configuration
- [User.js](../../server/src/models/User.js) - User deletion methods with session cleanup
- [auth.js](../../server/src/middleware/auth.js) - Session validation middleware
- [passport.js](../../server/src/config/passport.js) - Passport deserialization

---

## 🔒 Security Considerations

### **Safe Operations:**

- ✅ Deleting sessions from `sessions` table (no user data lost)
- ✅ Running cleanup queries (read-only preview first)
- ✅ Multiple cleanup runs (idempotent)

### **Dangerous Operations:**

- ❌ **NEVER** delete from `users` table without session cleanup
- ❌ **NEVER** run `TRUNCATE sessions` (deletes all sessions including valid ones)
- ❌ **NEVER** modify `sess` JSON directly (can corrupt session data)

### **Backup Before Major Changes:**

```sql
-- Backup sessions table before cleanup
CREATE TABLE sessions_backup AS
SELECT * FROM sessions;

-- Run cleanup

-- If something goes wrong, restore:
-- TRUNCATE sessions;
-- INSERT INTO sessions SELECT * FROM sessions_backup;
```

---

## ✅ Verification Checklist

After running cleanup:

- [ ] Zero orphaned sessions: `SELECT COUNT(*) ... = 0`
- [ ] Valid sessions remain: `SELECT COUNT(*) FROM sessions WHERE sess::jsonb->'passport'->>'user' IS NOT NULL`
- [ ] Users can log in successfully
- [ ] Usage dashboard loads metric cards
- [ ] No 500 errors in browser console
- [ ] Vercel logs show successful deserializations
- [ ] All three protection layers deployed

---

**Last Maintenance:** November 10, 2025
**Next Scheduled Cleanup:** February 10, 2026 (Quarterly)
