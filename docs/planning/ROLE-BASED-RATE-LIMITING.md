# Role-Based Rate Limiting Implementation Plan

**Status:** Ready for Implementation
**Estimated Time:** 6 hours (includes generic user audit system)
**Target Version:** v2.8.0
**Created:** November 13, 2025
**Updated:** November 13, 2025 - Switched to generic field-based audit

---

## Overview

Allow admin and support users to bypass usage-based rate limits while still tracking their usage for LLM cost analysis. Regular users continue to have tier-based limits enforced.

**Audit System:** Generic field-based audit logging tracks ALL user field changes (role, email, first_name, last_name, tier, etc.) for compliance and security purposes.

---

## Goals

- ✅ Admin/support can generate unlimited docs for testing
- ✅ Usage still tracked for all users (cost analysis)
- ✅ UI warnings/banners suppressed for bypass roles
- ✅ Email rate limits still apply to everyone (prevent abuse)
- ✅ Handle role demotion edge cases gracefully
- ✅ Full audit trail of all role changes with transaction safety
- ✅ Audit retention during soft delete and hard delete protection

---

## Key Design Decisions

### ✅ DECISION MADE: Generic Field-Based Audit

**Chosen Approach:** Generic user audit system (tracks ALL user field changes)

**Why Generic Audit:**
1. ✅ Compliance-ready (SOC2, ISO 27001 future-proof)
2. ✅ Tracks security-critical changes (email, role, tier)
3. ✅ Single audit table (no need for multiple tables per field)
4. ✅ Extensible (automatically handles new fields)
5. ✅ Only 1.5 extra hours vs. role-only approach

**Tracked Fields:**
- `role` - Privilege escalation tracking
- `email` - Account takeover prevention
- `first_name` - Profile change auditing
- `last_name` - Profile change auditing
- `tier` - Billing dispute resolution
- `email_verified` - Email verification status changes
- `deleted_at` - Soft delete tracking

See "Design Choice: Role-Only vs. Generic Audit" section for full comparison and rationale.

### Audit Logging via Database Trigger ✅
- **Automatic**: Every field change creates audit entry (impossible to forget)
- **Foolproof**: Works with manual SQL, bulk updates, application code
- **Secure**: Can't bypass logging at database level
- **Selective**: Only logs specified fields (excludes password_hash, updated_at, etc.)

### No Audit for Initial User Creation ✅
- Default values at signup are NOT audited (reduces noise)
- Only field CHANGES are logged (user→admin, old@x.com→new@x.com)
- `users.created_at` already shows when user joined

### Soft Delete Preserves Audit History ✅
- Soft delete (`deleted_at` timestamp) creates audit entry and keeps history intact
- Full change history available even for deleted users
- User can be restored with complete audit trail

### Hard Delete Protected by Database ✅
- `ON DELETE RESTRICT` prevents accidental user deletion
- Must explicitly archive/delete audit entries first
- Protects compliance and legal requirements
- Denormalized `user_email` column for retention after deletion

---

## Design Choice: Role-Only vs. Generic Audit

### Current Plan: Role-Specific Audit

**Schema:**
```sql
CREATE TABLE role_change_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_email VARCHAR(255),
  changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  old_role VARCHAR(50) NOT NULL,
  new_role VARCHAR(50) NOT NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Pros:**
- ✅ Simple, specific queries (optimized for role changes)
- ✅ Type-safe (old_role/new_role are proper columns)
- ✅ Fast implementation (4.5 hours)
- ✅ Security-focused (roles are privileged changes)
- ✅ Easier to reason about (single purpose)

**Cons:**
- ❌ Not extensible (only tracks roles)
- ❌ Need separate tables for email, name, etc. changes
- ❌ Redundant schema if you add more audit tables

**Best for:**
- You only care about security-critical changes (role elevation)
- Don't need full user change history
- Want simplest implementation

---

### Alternative: Generic User Audit System

**Schema Option 1: Field-based audit**
```sql
CREATE TABLE user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_email VARCHAR(255), -- Denormalized
  changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  field_name VARCHAR(100) NOT NULL, -- 'role', 'email', 'name', etc.
  old_value TEXT,
  new_value TEXT,
  change_type VARCHAR(50), -- 'update', 'delete', 'restore'
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for efficient field-specific queries
CREATE INDEX idx_user_audit_field ON user_audit_log(user_id, field_name, changed_at DESC);
CREATE INDEX idx_user_audit_changed_at ON user_audit_log(changed_at DESC);
```

**Schema Option 2: JSONB snapshot audit (more robust)**
```sql
CREATE TABLE user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_email VARCHAR(255), -- Denormalized
  changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'update', 'delete', 'restore', 'login'
  old_data JSONB, -- Full snapshot before change
  new_data JSONB, -- Full snapshot after change
  changed_fields TEXT[], -- ['role', 'email'] for quick filtering
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- GIN index for JSONB queries
CREATE INDEX idx_user_audit_old_data ON user_audit_log USING GIN(old_data);
CREATE INDEX idx_user_audit_new_data ON user_audit_log USING GIN(new_data);
CREATE INDEX idx_user_audit_changed_fields ON user_audit_log USING GIN(changed_fields);
```

**Generic Trigger (tracks ALL user changes):**
```sql
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  field RECORD;
BEGIN
  -- Track which fields changed
  FOR field IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
  LOOP
    -- Compare old vs new for each field
    IF (TG_OP = 'UPDATE' AND
        OLD.* IS DISTINCT FROM NEW.* AND
        to_jsonb(OLD)->field.column_name IS DISTINCT FROM to_jsonb(NEW)->field.column_name)
    THEN
      changed_fields := array_append(changed_fields, field.column_name);
    END IF;
  END LOOP;

  -- Only log if something actually changed
  IF array_length(changed_fields, 1) > 0 THEN
    INSERT INTO user_audit_log (
      user_id,
      user_email,
      event_type,
      old_data,
      new_data,
      changed_fields,
      reason
    ) VALUES (
      NEW.id,
      NEW.email,
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      changed_fields,
      'Automatic audit log via trigger'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_user_changes
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_changes();
```

**Example Queries:**
```sql
-- Get all role changes (same as role-specific audit)
SELECT user_email, old_data->>'role' as old_role, new_data->>'role' as new_role, changed_at
FROM user_audit_log
WHERE 'role' = ANY(changed_fields)
ORDER BY changed_at DESC;

-- Get all email changes
SELECT user_email, old_data->>'email' as old_email, new_data->>'email' as new_email, changed_at
FROM user_audit_log
WHERE 'email' = ANY(changed_fields)
ORDER BY changed_at DESC;

-- Get full change history for a user
SELECT changed_at, changed_fields, old_data, new_data, reason
FROM user_audit_log
WHERE user_id = 123
ORDER BY changed_at DESC;

-- Find when user last changed their name
SELECT changed_at, old_data->>'name' as old_name, new_data->>'name' as new_name
FROM user_audit_log
WHERE user_id = 123 AND 'name' = ANY(changed_fields)
ORDER BY changed_at DESC
LIMIT 1;
```

**Pros:**
- ✅ Tracks ALL user changes (role, email, name, password_hash, tier, etc.)
- ✅ Single audit table (no need for separate email_audit, name_audit, etc.)
- ✅ Extensible (automatically picks up new columns)
- ✅ Full snapshot history (can see entire user state at any point)
- ✅ Compliance-ready (GDPR, SOX, HIPAA often require this)

**Cons:**
- ❌ More complex queries (JSONB operations)
- ❌ Slightly slower (JSONB overhead, more data stored)
- ❌ Takes longer to implement (6-7 hours vs 4.5 hours)
- ❌ TEXT storage loses type safety (everything becomes text)
- ❌ Password hash changes also logged (could be sensitive)

**Best for:**
- You need compliance-grade audit trail
- Want to track security-critical changes (email, password reset, etc.)
- Plan to add more audit-worthy fields in future
- Need to answer "what did this user's profile look like on [date]?"

---

### Comparison Table

| Aspect | Role-Only Audit | Generic Field Audit | JSONB Snapshot Audit |
|--------|----------------|--------------------|--------------------|
| **Implementation** | 4.5 hours | 6 hours | 7 hours |
| **Complexity** | Low | Medium | High |
| **Query Speed** | ✅ Fast | ⚠️ Moderate | ⚠️ Slower (JSONB) |
| **Extensibility** | ❌ Not extensible | ✅ Extensible | ✅ Very extensible |
| **Storage** | ~50 KB/10K users | ~200 KB/10K users | ~500 KB/10K users |
| **Type Safety** | ✅ Typed columns | ❌ TEXT only | ❌ JSONB (weakly typed) |
| **Tracks roles** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Tracks email** | ❌ No | ✅ Yes | ✅ Yes |
| **Tracks name** | ❌ No | ✅ Yes | ✅ Yes |
| **Tracks tier** | ❌ No | ✅ Yes | ✅ Yes |
| **Full snapshots** | ❌ No | ❌ No | ✅ Yes |
| **Compliance** | ⚠️ Partial | ✅ Good | ✅ Excellent |
| **Security focus** | ✅ Roles only | ✅ All fields | ✅ All fields |
| **Add new fields** | ❌ Need new table | ⚠️ Need trigger update | ✅ Automatic |

---

### Hybrid Approach (Recommended)

**Best of both worlds:**
1. Generic `user_audit_log` for all changes
2. Separate `security_audit_log` for critical events (role changes, password resets, failed logins)

```sql
-- Generic audit (all user changes)
CREATE TABLE user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_email VARCHAR(255),
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Security-critical audit (privileged changes only)
CREATE TABLE security_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_email VARCHAR(255),
  changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'role_change', 'password_reset', 'failed_login', etc.
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Pros:**
- ✅ Generic audit for normal changes (email, name)
- ✅ Security audit for privileged changes (roles, permissions)
- ✅ Fast queries on security events
- ✅ Complete change history available

**Cons:**
- ⚠️ Two tables to maintain
- ⚠️ More complex (7-8 hours implementation)

---

### My Recommendation

**For CodeScribe AI, I recommend:**

**Option: Generic User Audit (Field-based, not JSONB)**

**Why:**
1. ✅ You're building a SaaS product (will need compliance eventually)
2. ✅ Email changes are security-critical (account takeover vector)
3. ✅ Tier changes affect billing (need audit trail for disputes)
4. ✅ 2 extra hours now saves weeks of refactoring later
5. ✅ Not much more complex (triggers handle everything)
6. ✅ Future-proof for SOC2, ISO 27001 compliance

**What changes:**
- Migration 012 creates `user_audit_log` instead of `role_change_audit`
- Trigger tracks role, email, name, tier, email_verified, deleted_at
- Same frontend/backend logic (just query different table)
- Better compliance posture from day 1

**Time impact:**
- Current: 4.5 hours (role-only)
- Generic: 6 hours (+1.5 hours)
- **Trade-off: 1.5 hours now vs. 2-3 days refactoring later**

---

### Decision Matrix

**Choose Role-Only Audit if:**
- [ ] You only care about privilege escalation
- [ ] You don't plan to audit email/name/tier changes
- [ ] You want fastest implementation
- [ ] You don't need compliance certifications

**Choose Generic Audit if:**
- [x] You're building a SaaS product
- [x] You might pursue SOC2/ISO compliance
- [x] You want to track email changes (account takeover prevention)
- [x] You want to track tier changes (billing disputes)
- [x] You're okay with 1.5 extra hours now

---

### What to Do Next

**✅ DECISION MADE: Generic Field-Based Audit**

The plan has been updated to use generic field-based audit logging that tracks:
- `role` changes (admin privilege escalation)
- `email` changes (account takeover prevention)
- `first_name` and `last_name` changes (profile updates)
- `tier` changes (billing/subscription tracking)
- `email_verified` changes (verification status)
- `deleted_at` changes (soft delete tracking)

**Ready to implement!** Scroll to "Implementation Phases" below.

---

## Implementation Phases

### Phase 1: Backend (2.5 hours)

#### 1.1 Database Migration (30 min)

**File:** `server/src/migrations/012_add_user_roles_and_audit.sql`

```sql
-- Add role column to users table
ALTER TABLE users
  ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';

-- Add constraint for valid roles
ALTER TABLE users
  ADD CONSTRAINT check_valid_role
    CHECK (role IN ('user', 'support', 'admin', 'super_admin'));

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Create generic user audit table
-- Tracks ALL user field changes (role, email, first_name, last_name, tier, etc.)
-- IMPORTANT: ON DELETE RESTRICT prevents accidental deletion of users with audit history
CREATE TABLE IF NOT EXISTS user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_email VARCHAR(255), -- Denormalized for retention after user deletion
  changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  field_name VARCHAR(100) NOT NULL, -- 'role', 'email', 'first_name', 'last_name', 'tier', etc.
  old_value TEXT, -- Previous value (stored as text)
  new_value TEXT, -- New value (stored as text)
  change_type VARCHAR(50) DEFAULT 'update', -- 'update', 'delete', 'restore'
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- Additional context (IP, user agent, etc.)
);

-- Indexes for efficient queries
CREATE INDEX idx_user_audit_user_id ON user_audit_log(user_id);
CREATE INDEX idx_user_audit_field_name ON user_audit_log(field_name);
CREATE INDEX idx_user_audit_user_field ON user_audit_log(user_id, field_name, changed_at DESC);
CREATE INDEX idx_user_audit_changed_by ON user_audit_log(changed_by_id);
CREATE INDEX idx_user_audit_changed_at ON user_audit_log(changed_at DESC);
CREATE INDEX idx_user_audit_user_email ON user_audit_log(user_email); -- For orphaned records after deletion

-- Create trigger function for automatic audit logging
-- NOTE: Does NOT fire on INSERT (only on UPDATE) to avoid auditing initial values
-- Tracks specific fields only (excludes password_hash, updated_at, etc.)
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  audit_fields TEXT[] := ARRAY['role', 'email', 'first_name', 'last_name', 'tier', 'email_verified', 'deleted_at'];
  field TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Loop through each field we want to audit
  FOREACH field IN ARRAY audit_fields
  LOOP
    -- Get old and new values as text
    EXECUTE format('SELECT ($1).%I::TEXT', field) INTO old_val USING OLD;
    EXECUTE format('SELECT ($1).%I::TEXT', field) INTO new_val USING NEW;

    -- Only log if the field actually changed
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO user_audit_log (
        user_id,
        user_email,
        field_name,
        old_value,
        new_value,
        change_type,
        reason,
        metadata
      ) VALUES (
        NEW.id,
        NEW.email, -- Denormalized for retention
        field,
        old_val,
        new_val,
        CASE
          WHEN field = 'deleted_at' AND new_val IS NOT NULL THEN 'delete'
          WHEN field = 'deleted_at' AND old_val IS NOT NULL AND new_val IS NULL THEN 'restore'
          ELSE 'update'
        END,
        'Automatic audit log via trigger',
        jsonb_build_object(
          'changed_via', 'database_trigger',
          'timestamp', NOW()
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
CREATE TRIGGER trigger_audit_user_changes
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_changes();

-- Verify migration
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

SELECT table_name FROM information_schema.tables
WHERE table_name = 'user_audit_log';

SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_audit_user_changes';

-- Test trigger with sample data (will be cleaned up in test)
DO $$
DECLARE
  test_user_id INTEGER;
BEGIN
  -- Insert test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
  VALUES ('audit-test@example.com', 'Test', 'User', 'hash', true)
  RETURNING id INTO test_user_id;

  -- Update role (should create audit entry)
  UPDATE users SET role = 'admin' WHERE id = test_user_id;

  -- Update email (should create audit entry)
  UPDATE users SET email = 'audit-test-updated@example.com' WHERE id = test_user_id;

  -- Verify 2 audit entries created
  IF (SELECT COUNT(*) FROM user_audit_log WHERE user_id = test_user_id) = 2 THEN
    RAISE NOTICE 'Migration test PASSED: 2 audit entries created';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Expected 2 audit entries';
  END IF;

  -- Clean up test data
  DELETE FROM user_audit_log WHERE user_id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
END $$;
```

**Test in Docker:**
```bash
cd server
npm run test:db:setup
npm run test:db -- migrations-012
```

#### 1.2 User Model Updates (20 min)

**File:** `server/src/models/User.js`

```javascript
// Add method to User class

canBypassRateLimits() {
  return ['support', 'admin', 'super_admin'].includes(this.role);
}

// Add role update method (audit logging handled by database trigger)
static async updateRole(userId, newRole, changedById = null, reason = null) {
  const validRoles = ['user', 'support', 'admin', 'super_admin'];

  if (!validRoles.includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current user
    const currentUser = await client.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (currentUser.rows.length === 0) {
      throw new Error('User not found');
    }

    const oldRole = currentUser.rows[0].role;

    // Don't update if role is the same
    if (oldRole === newRole) {
      await client.query('ROLLBACK');
      return currentUser.rows[0];
    }

    // Update role (trigger will automatically create audit log entry)
    const result = await client.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [newRole, userId]
    );

    // Optionally update audit entry with changed_by and reason if provided
    if (changedById || reason) {
      await client.query(
        `UPDATE user_audit_log
         SET changed_by_id = $1, reason = $2
         WHERE user_id = $3 AND field_name = 'role' AND new_value = $4
         ORDER BY changed_at DESC
         LIMIT 1`,
        [changedById, reason, userId, newRole]
      );
    }

    await client.query('COMMIT');

    console.log(`[Audit] Role changed: User ${currentUser.rows[0].email} (${oldRole} → ${newRole})`);

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get audit history for a user (all fields or specific field)
static async getAuditHistory(userId, fieldName = null) {
  const query = fieldName
    ? `SELECT
         ual.*,
         u.email as user_email,
         cb.email as changed_by_email
       FROM user_audit_log ual
       JOIN users u ON ual.user_id = u.id
       LEFT JOIN users cb ON ual.changed_by_id = cb.id
       WHERE ual.user_id = $1 AND ual.field_name = $2
       ORDER BY ual.changed_at DESC`
    : `SELECT
         ual.*,
         u.email as user_email,
         cb.email as changed_by_email
       FROM user_audit_log ual
       JOIN users u ON ual.user_id = u.id
       LEFT JOIN users cb ON ual.changed_by_id = cb.id
       WHERE ual.user_id = $1
       ORDER BY ual.changed_at DESC`;

  const params = fieldName ? [userId, fieldName] : [userId];
  const result = await pool.query(query, params);

  return result.rows;
}

// Get role change history for a user (convenience method)
static async getRoleHistory(userId) {
  return this.getAuditHistory(userId, 'role');
}

// Get email change history for a user (convenience method)
static async getEmailHistory(userId) {
  return this.getAuditHistory(userId, 'email');
}

// Get full profile change history (first_name, last_name, email)
static async getProfileHistory(userId) {
  const result = await pool.query(
    `SELECT
       ual.*,
       u.email as user_email,
       cb.email as changed_by_email
     FROM user_audit_log ual
     JOIN users u ON ual.user_id = u.id
     LEFT JOIN users cb ON ual.changed_by_id = cb.id
     WHERE ual.user_id = $1
       AND ual.field_name IN ('email', 'first_name', 'last_name')
     ORDER BY ual.changed_at DESC`,
    [userId]
  );

  return result.rows;
}
```

**Key Changes:**
- ✅ Database trigger automatically logs ALL field changes (not just role)
- ✅ Application code is simpler (no manual audit insert)
- ✅ Generic `getAuditHistory()` method for any field
- ✅ Convenience methods for common queries (role, email, profile)
- ✅ Manual SQL changes are automatically audited
- ✅ Can't forget to log (happens at database level)

**Test:**
```javascript
// Add to server/src/models/__tests__/User.test.js

describe('canBypassRateLimits', () => {
  it('should return true for admin role', () => {
    const user = { role: 'admin' };
    expect(new User(user).canBypassRateLimits()).toBe(true);
  });

  it('should return false for user role', () => {
    const user = { role: 'user' };
    expect(new User(user).canBypassRateLimits()).toBe(false);
  });
});

describe('getAuditHistory', () => {
  it('should return all audit entries for a user', async () => {
    const history = await User.getAuditHistory(userId);
    expect(history).toBeInstanceOf(Array);
    expect(history[0]).toHaveProperty('field_name');
    expect(history[0]).toHaveProperty('old_value');
    expect(history[0]).toHaveProperty('new_value');
  });

  it('should return only role changes when field specified', async () => {
    const history = await User.getAuditHistory(userId, 'role');
    expect(history.every(entry => entry.field_name === 'role')).toBe(true);
  });
});
```

#### 1.3 Bypass Middleware (30 min)

**File:** `server/src/middleware/rateLimitBypass.js` (NEW)

```javascript
/**
 * Checks if the authenticated user has a role that bypasses rate limits.
 * Sets req.bypassRateLimit flag for downstream middleware.
 *
 * IMPORTANT: Only applies to usage-based rate limiting (LLM generation).
 * Email rate limits still apply to all users.
 *
 * @middleware
 */
export const checkRateLimitBypass = (req, res, next) => {
  // Skip bypass check if user not authenticated
  if (!req.user) {
    req.bypassRateLimit = false;
    return next();
  }

  // Check if user has bypass role
  const BYPASS_ROLES = ['support', 'admin', 'super_admin'];
  req.bypassRateLimit = BYPASS_ROLES.includes(req.user.role);

  // Log bypass for monitoring (not stored in DB to avoid noise)
  if (req.bypassRateLimit && process.env.NODE_ENV !== 'test') {
    console.log(`[RateLimit] Bypass granted for ${req.user.role}: ${req.user.email}`);
  }

  next();
};
```

**Test:**
```javascript
// server/src/middleware/__tests__/rateLimitBypass.test.js

import { describe, it, expect, jest } from '@jest/globals';
import { checkRateLimitBypass } from '../rateLimitBypass.js';

describe('checkRateLimitBypass middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  it('should set bypassRateLimit=true for admin users', () => {
    req.user = { role: 'admin', email: 'admin@test.com' };
    checkRateLimitBypass(req, res, next);
    expect(req.bypassRateLimit).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it('should set bypassRateLimit=true for support users', () => {
    req.user = { role: 'support', email: 'support@test.com' };
    checkRateLimitBypass(req, res, next);
    expect(req.bypassRateLimit).toBe(true);
  });

  it('should set bypassRateLimit=false for regular users', () => {
    req.user = { role: 'user', email: 'user@test.com' };
    checkRateLimitBypass(req, res, next);
    expect(req.bypassRateLimit).toBe(false);
  });

  it('should set bypassRateLimit=false for unauthenticated requests', () => {
    req.user = null;
    checkRateLimitBypass(req, res, next);
    expect(req.bypassRateLimit).toBe(false);
  });
});
```

#### 1.4 Update Rate Limiter (15 min)

**File:** `server/src/middleware/rateLimiter.js`

```javascript
// Update ONLY usageRateLimiter (NOT emailRateLimiter)

export const usageRateLimiter = async (req, res, next) => {
  // Check for bypass flag set by checkRateLimitBypass middleware
  if (req.bypassRateLimit) {
    return next();
  }

  // Existing usage quota logic continues unchanged...
  try {
    let usage;

    if (req.user) {
      usage = await Usage.getUserUsage(req.user.id);
    } else {
      usage = await Usage.getAnonymousUsage(req.ip);
    }

    // Check daily limit
    if (usage.daily.used >= usage.daily.limit) {
      return res.status(429).json({
        error: 'Daily generation limit reached',
        usage: usage.daily,
        resetTime: usage.daily.resetTime
      });
    }

    next();
  } catch (error) {
    console.error('[RateLimit] Error checking usage:', error);
    next(error);
  }
};

// emailRateLimiter - NO CHANGES
// Admins still rate limited for emails to prevent abuse
export const emailRateLimiter = async (req, res, next) => {
  // Keep existing logic exactly as-is
  // ...
};
```

#### 1.5 Update Generate Routes (15 min)

**File:** `server/src/routes/generate.js`

```javascript
import { checkRateLimitBypass } from '../middleware/rateLimitBypass.js';

// Standard generation endpoint
router.post('/api/generate',
  optionalAuth,
  checkRateLimitBypass,  // ← NEW: Check bypass before rate limiter
  usageRateLimiter,
  validateBody(generateSchema),
  generateController.generate
);

// Streaming generation endpoint
router.post('/api/generate-stream',
  optionalAuth,
  checkRateLimitBypass,  // ← NEW: Check bypass before rate limiter
  usageRateLimiter,
  validateBody(generateSchema),
  generateController.generateStream
);
```

#### 1.6 Update Usage API (15 min)

**File:** `server/src/routes/usage.js`

```javascript
// GET /api/usage/current
router.get('/current', requireAuth, async (req, res) => {
  try {
    const usage = await Usage.getUserUsage(req.user.id);

    res.json({
      ...usage,
      bypassRole: req.user.canBypassRateLimits(), // ← NEW: Frontend uses this
      role: req.user.role                          // ← NEW: Display in UI
    });
  } catch (error) {
    console.error('[Usage] Error fetching current usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});
```

---

### Phase 2: Frontend (2 hours)

#### 2.1 Update Usage Hook (30 min)

**File:** `client/src/hooks/useUsageTracking.js`

```javascript
export const useUsageTracking = () => {
  const [usageData, setUsageData] = useState(null);
  const [shouldShowWarnings, setShouldShowWarnings] = useState(true); // ← NEW
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchUsage = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/usage/current', {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch usage');

        const data = await response.json();
        setUsageData(data);

        // Suppress warnings for bypass roles
        setShouldShowWarnings(!data.bypassRole); // ← NEW

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUsage();

    // Poll every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    usageData,
    shouldShowWarnings, // ← NEW: Components check this flag
    isAtLimit: shouldShowWarnings && usageData?.daily?.percentage >= 100,
    isNearLimit: shouldShowWarnings && usageData?.daily?.percentage >= 80,
    loading,
    error
  };
};
```

#### 2.2 Update Warning Banner (10 min)

**File:** `client/src/components/UsageWarningBanner.jsx`

```javascript
export default function UsageWarningBanner() {
  const { usageData, shouldShowWarnings, isNearLimit } = useUsageTracking(); // ← Add shouldShowWarnings

  // Don't render for bypass roles
  if (!shouldShowWarnings || !isNearLimit) {
    return null;
  }

  // Existing banner render...
  // Cap percentage display at 100% to handle role demotion edge case
  const displayPercentage = Math.min(usageData.daily.percentage, 100);

  return (
    // ... existing JSX with displayPercentage
  );
}
```

#### 2.3 Update Limit Modal (10 min)

**File:** `client/src/components/UsageLimitModal.jsx`

```javascript
export default function UsageLimitModal({ isOpen, onClose }) {
  const { usageData, shouldShowWarnings, isAtLimit } = useUsageTracking(); // ← Add shouldShowWarnings

  // Don't show modal for bypass roles
  if (!shouldShowWarnings || !isAtLimit) {
    return null;
  }

  // Existing modal render...
}
```

#### 2.4 Update App.jsx (10 min)

**File:** `client/src/App.jsx`

```javascript
function App() {
  const { shouldShowWarnings, isAtLimit } = useUsageTracking(); // ← Add shouldShowWarnings
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    // Only show modal if warnings enabled
    if (shouldShowWarnings && isAtLimit) {
      setShowLimitModal(true);
    } else {
      setShowLimitModal(false);
    }
  }, [shouldShowWarnings, isAtLimit]);

  // Rest of App component unchanged...
}
```

#### 2.5 Update Usage Dashboard (30 min)

**File:** `client/src/pages/UsageDashboard.jsx`

```javascript
import { Shield } from 'lucide-react';

export default function UsageDashboard() {
  const { usageData, shouldShowWarnings, loading } = useUsageTracking();

  if (loading) return <LoadingSpinner />;

  // Show special admin view for bypass roles
  if (!shouldShowWarnings && usageData?.bypassRole) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          Usage Dashboard
        </h1>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {usageData.role === 'admin' ? 'Admin Account' :
               usageData.role === 'support' ? 'Support Account' :
               'Privileged Account'}
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Your account has unlimited generation capacity. Usage is still tracked for cost analysis,
            but rate limits and quota warnings are disabled.
          </p>
          <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <div>
                <span className="font-medium">Role:</span>{' '}
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {usageData.role}
                </span>
              </div>
              <div>
                <span className="font-medium">Daily Generations:</span>{' '}
                <span className="font-mono">{usageData.daily.used}</span>
              </div>
              <div>
                <span className="font-medium">Monthly Generations:</span>{' '}
                <span className="font-mono">{usageData.monthly.used}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular usage dashboard for normal users (existing code)
  // Cap percentage display at 100% to handle role demotion edge case
  const dailyPercentage = Math.min(usageData.daily.percentage, 100);
  const monthlyPercentage = Math.min(usageData.monthly.percentage, 100);

  return (
    // ... existing dashboard JSX with capped percentages
  );
}
```

#### 2.6 Add Role Badge Component (20 min)

**File:** `client/src/components/RoleBadge.jsx` (NEW)

```javascript
import { User, Headphones, Shield, Crown } from 'lucide-react';

const ROLE_CONFIG = {
  user: {
    label: 'User',
    color: 'slate',
    icon: User,
    description: 'Standard account'
  },
  support: {
    label: 'Support',
    color: 'blue',
    icon: Headphones,
    description: 'Support team member with unlimited generation'
  },
  admin: {
    label: 'Admin',
    color: 'purple',
    icon: Shield,
    description: 'Administrator with unlimited generation'
  },
  super_admin: {
    label: 'Super Admin',
    color: 'indigo',
    icon: Crown,
    description: 'Super administrator with full access'
  }
};

export default function RoleBadge({ role, showDescription = false }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const Icon = config.icon;

  return (
    <div>
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        ${config.color === 'slate' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : ''}
        ${config.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}
        ${config.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : ''}
        ${config.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : ''}
      `}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
      {showDescription && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {config.description}
        </p>
      )}
    </div>
  );
}
```

#### 2.7 Update Settings Page (10 min)

**File:** `client/src/pages/Settings.jsx`

```javascript
import RoleBadge from '../components/RoleBadge';

export default function Settings() {
  const { user } = useAuth();

  return (
    // ... existing Settings JSX

    // In Account tab, after Email field:
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Account Type
      </label>
      <RoleBadge role={user.role} showDescription={true} />
    </div>
  );
}
```

---

## Edge Case: Role Demotion Handling

### Problem
If an admin generates 1000 docs, then gets demoted to 'user' role (10 daily limit), they'll have usage counts far exceeding the tier limit.

### Potential Issues
1. **UI percentage overflow** - 1000/10 = 10,000% could break progress bars
2. **Modal/banner logic** - Should still appear correctly (>= 100%)
3. **Next period reset** - Lazy reset should work normally

### Solutions Implemented

#### 1. Cap Percentage Display at 100%
```javascript
// In UsageWarningBanner and UsageDashboard
const displayPercentage = Math.min(usageData.daily.percentage, 100);
```

#### 2. Progress Bar Overflow Handling
```javascript
// Ensure progress bar caps at 100% width
<div className="w-full bg-slate-200 rounded-full h-2">
  <div
    className="bg-purple-600 h-2 rounded-full transition-all"
    style={{ width: `${Math.min(percentage, 100)}%` }}
  />
</div>
```

#### 3. Banner/Modal Still Appear
```javascript
// These checks work correctly even with overflow
if (percentage >= 100) // Shows limit modal
if (percentage >= 80)  // Shows warning banner
```

#### 4. Lazy Reset Works Normally
```javascript
// Usage.js getUserUsage() already handles this:
// - If current time > period_end, reset counters to 0
// - Demoted user gets fresh start next period
```

### Expected Behavior After Role Demotion

| Scenario | Behavior |
|----------|----------|
| **Immediately after demotion** | User blocked from generating (100% limit) |
| **UI display** | Shows "10/10" or "100% (limit reached)" |
| **Warning banner** | Appears (percentage >= 80%) |
| **Limit modal** | Appears (percentage >= 100%) |
| **Next period (midnight)** | Lazy reset gives them 10 new credits |
| **Progress bars** | Render correctly (capped at 100% width) |
| **Database** | No corruption, counts stored accurately |

### Testing Role Demotion

```bash
# 1. Set user to admin
UPDATE users SET role = 'admin' WHERE email = 'test@example.com';

# 2. Generate 50+ docs as admin (should work)

# 3. Check usage
SELECT * FROM user_quotas WHERE user_id = 'xxx';
# Shows: daily_count = 50, monthly_count = 50

# 4. Demote to user
UPDATE users SET role = 'user' WHERE email = 'test@example.com';

# 5. Try to generate (should fail with 429)
# 6. Check UI shows 100% limit (not 500%)
# 7. Wait for next period, verify lazy reset works
```

---

## What Gets Bypassed vs. Not

| Endpoint | Calls LLM? | Bypass Rate Limit? | Reasoning |
|----------|------------|-------------------|-----------|
| `/api/generate` | ✅ Yes | ✅ Yes | Admin testing documentation |
| `/api/generate-stream` | ✅ Yes | ✅ Yes | Admin testing documentation |
| `/api/upload` | ❌ No | ❌ No | No LLM call, no bypass needed |
| `/api/contact/support` | ❌ No | ❌ No | Prevent email abuse/spam |
| `/api/contact/sales` | ❌ No | ❌ No | Prevent email abuse/spam |

---

## Manual Role Assignment (Phase 3 Deferred)

Until admin UI is built, assign roles via SQL. **Audit logging happens automatically via database trigger!**

```bash
# Connect to Neon dev database
npm run db:shell

# Simple role assignment - audit log created automatically by trigger!
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

# Optionally add reason/changed_by to the auto-generated audit entry
UPDATE user_audit_log
SET reason = 'Initial admin setup for development',
    changed_by_id = NULL, -- or specific user ID
    metadata = metadata || '{"changed_by_name": "Your Name", "changed_via": "manual_sql"}'::jsonb
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
  AND field_name = 'role'
  AND changed_at >= NOW() - INTERVAL '1 minute'
ORDER BY changed_at DESC
LIMIT 1;

# Verify role assignment
SELECT id, email, role, created_at FROM users WHERE role != 'user';

# View audit history for a user (see automatic trigger entries for all fields)
SELECT
  ual.changed_at,
  ual.field_name,
  ual.old_value,
  ual.new_value,
  ual.reason,
  ual.metadata,
  cb.email as changed_by
FROM user_audit_log ual
LEFT JOIN users cb ON ual.changed_by_id = cb.id
WHERE ual.user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
ORDER BY ual.changed_at DESC;

# View only role changes for a user
SELECT
  ual.changed_at,
  ual.old_value as old_role,
  ual.new_value as new_role,
  ual.reason,
  cb.email as changed_by
FROM user_audit_log ual
LEFT JOIN users cb ON ual.changed_by_id = cb.id
WHERE ual.user_id = (SELECT id FROM users WHERE email = 'your-email@example.com')
  AND ual.field_name = 'role'
ORDER BY ual.changed_at DESC;
```

### Production Role Assignment

```bash
# Connect to Neon production database (use with caution)
# Get connection string from Vercel environment variables

# Update role (trigger automatically creates audit entry)
UPDATE users SET role = 'admin' WHERE email = 'production-admin@example.com';

# Add reason to auto-generated audit entry (RECOMMENDED for production)
UPDATE user_audit_log
SET reason = 'Promoted to admin - approved by [Manager Name] on [Date]',
    metadata = metadata || '{"changed_by_name": "Your Name", "approved_by": "Manager Name", "ticket_id": "TICKET-123"}'::jsonb
WHERE user_id = (SELECT id FROM users WHERE email = 'production-admin@example.com')
  AND field_name = 'role'
  AND changed_at >= NOW() - INTERVAL '1 minute'
ORDER BY changed_at DESC
LIMIT 1;

# Verify
SELECT u.email, u.role, ual.changed_at, ual.reason, ual.metadata
FROM users u
JOIN user_audit_log ual ON u.id = ual.user_id
WHERE u.email = 'production-admin@example.com'
  AND ual.field_name = 'role'
ORDER BY ual.changed_at DESC
LIMIT 1;
```

### Audit Log Best Practices

1. ✅ **Automatic logging** - Database trigger ensures every role change is logged
2. ✅ **No forgotten logs** - Impossible to change role without audit entry
3. ✅ **Add context** - Update audit entry with reason/approver after automatic creation
4. ✅ **Production approval** - Include approver name and ticket ID in metadata
5. ✅ **Review regularly** - Audit logs should be reviewed quarterly

### Why This Approach Is Better

| Aspect | Manual Audit Inserts | Database Trigger |
|--------|---------------------|------------------|
| **Forget to log?** | ❌ Possible | ✅ Impossible |
| **SQL changes audited?** | ❌ Only if remembered | ✅ Always |
| **Application bugs?** | ❌ Can skip logging | ✅ Database enforces |
| **Code complexity** | ❌ Higher | ✅ Lower |
| **Consistency** | ⚠️ Developer-dependent | ✅ 100% guaranteed |

### Bulk Updates and the Trigger

**Q: Does the trigger work with bulk role updates?**

**A: Yes!** The `FOR EACH ROW` trigger fires once per row, so bulk updates work correctly:

```sql
-- Bulk promote 3 users to support role
UPDATE users SET role = 'support'
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com');

-- Result: 3 separate audit log entries created
SELECT user_id, old_role, new_role, changed_at
FROM role_change_audit
WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com')
)
ORDER BY changed_at DESC;

-- Output:
-- user_id | old_role | new_role | changed_at
-- --------+----------+----------+-------------------------
--     123 | user     | support  | 2025-11-13 10:30:00-05
--     124 | user     | support  | 2025-11-13 10:30:00-05
--     125 | admin    | support  | 2025-11-13 10:30:00-05
-- (3 audit entries, one per user)
```

**Adding context to bulk updates:**

```sql
-- After bulk update, add reason to all recent audit entries
UPDATE role_change_audit
SET reason = 'Bulk promotion approved by Manager - TICKET-456',
    metadata = metadata || '{"changed_by_name": "Your Name", "bulk_operation": true}'::jsonb
WHERE changed_at >= NOW() - INTERVAL '1 minute'
  AND reason = 'Automatic audit log via trigger';
```

**Performance Note:**
- Bulk updates of <100 users: No performance impact
- Bulk updates of 1000+ users: Audit inserts add ~50ms overhead (acceptable)
- Trigger is lightweight (single INSERT per row, indexed columns)

---

## Audit Retention and User Deletion

### 1. Initial User Creation (No Audit Entry)

**Q: Should we audit when a new user is created with default values?**

**A: No.** Initial field values are NOT audited because:
- ✅ Reduces noise (every new user would create 7+ audit entries)
- ✅ `users.created_at` already shows when user was created
- ✅ Only field CHANGES are audited (old_value → new_value)

```sql
-- User created with default values
INSERT INTO users (email, first_name, last_name, password_hash, role) VALUES (...);
-- No audit entries created ✅

-- Later, user updates their name
UPDATE users SET first_name = 'John', last_name = 'Doe' WHERE email = 'user@example.com';
-- 2 audit entries created: first_name (NULL → 'John'), last_name (NULL → 'Doe') ✅

-- Later, promoted to admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
-- 1 audit entry created: role ('user' → 'admin') ✅
```

### 2. Soft Delete (Audit Preserved)

**Q: What happens to audit entries when a user is soft-deleted?**

**A: Audit entries are fully preserved.** Soft delete creates an audit entry and keeps all history:

```sql
-- Soft delete user (current behavior)
UPDATE users SET deleted_at = NOW() WHERE id = 123;

-- Audit entry created for deleted_at field change ✅
SELECT * FROM user_audit_log WHERE user_id = 123 AND field_name = 'deleted_at';
-- Returns: old_value=NULL, new_value='2025-11-13 10:30:00-05', change_type='delete'

-- All audit entries still accessible
SELECT * FROM user_audit_log WHERE user_id = 123;
-- Returns ALL field changes for user 123 (role, email, first_name, last_name, etc.) ✅

-- User can see their full history even after deletion
SELECT ual.changed_at, ual.field_name, ual.old_value, ual.new_value, ual.reason
FROM user_audit_log ual
WHERE ual.user_id = 123
ORDER BY ual.changed_at DESC;
```

**Soft delete preserves:**
- ✅ All audit entries (user_id foreign key still valid)
- ✅ Complete field change history (not just roles)
- ✅ Soft delete itself is audited (deleted_at field change)
- ✅ Ability to restore user with full audit trail

### 3. Hard Delete (Physical Deletion)

**Q: What happens to audit entries if a user is physically deleted from the database?**

**A: Physical deletion is BLOCKED** by `ON DELETE RESTRICT` foreign key constraint:

```sql
-- Attempt to physically delete user
DELETE FROM users WHERE id = 123;

-- ERROR: update or delete on table "users" violates foreign key constraint
-- DETAIL: Key (id)=(123) is still referenced from table "user_audit_log"
```

**Why ON DELETE RESTRICT?**
1. ✅ **Compliance**: Audit logs must be retained for legal/compliance reasons
2. ✅ **Prevents accidents**: Can't accidentally delete users with audit history
3. ✅ **Forces review**: Must explicitly handle audit retention before deletion

### 4. Handling Required Physical Deletions

**If you MUST physically delete a user (GDPR right to be forgotten, etc.):**

#### Option A: Archive audit entries first (Recommended)
```sql
-- 1. Archive audit entries to separate retention table
INSERT INTO user_audit_log_archive
SELECT * FROM user_audit_log WHERE user_id = 123;

-- 2. Delete audit entries
DELETE FROM user_audit_log WHERE user_id = 123;

-- 3. Now you can delete user
DELETE FROM users WHERE id = 123;
```

#### Option B: Remove foreign key temporarily (Use with caution)
```sql
-- 1. Drop foreign key constraint
ALTER TABLE user_audit_log
DROP CONSTRAINT user_audit_log_user_id_fkey;

-- 2. Delete user (audit entries become orphaned but preserved)
DELETE FROM users WHERE id = 123;

-- 3. Recreate foreign key with SET NULL
ALTER TABLE user_audit_log
ADD CONSTRAINT user_audit_log_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

#### Option C: Change to ON DELETE SET NULL (Alternative design)
```sql
-- Migration change (if you prefer this approach):
-- user_id INTEGER REFERENCES users(id) ON DELETE SET NULL

-- Pros: Audit entries preserved with orphaned user_id
-- Cons: Lose referential integrity, need user_email for identification
-- Trade-off: Better for GDPR compliance, worse for data integrity
```

### 5. Denormalized user_email Column

The audit table includes `user_email` to preserve user identification even if:
- User's email changes in `users` table
- User is physically deleted (if using ON DELETE SET NULL in future)

```sql
-- Audit queries work even if user deleted (with ON DELETE SET NULL)
SELECT user_email, old_role, new_role, changed_at
FROM role_change_audit
WHERE user_id IS NULL; -- Orphaned audit entries from deleted users
```

### 6. Recommended Deletion Policy

**For CodeScribe AI:**
1. ✅ **Default: Soft delete only** - Never physically delete users
2. ✅ **Audit retention: 7 years** - Keep audit logs per compliance standards
3. ✅ **GDPR exceptions:** Physical deletion only for legal requirements
4. ✅ **Deletion workflow:**
   - User requests deletion → Soft delete (30-day grace period)
   - After 30 days → Archive audit logs, then physical delete if required
   - Production: Require manager approval for any physical deletion

### 7. Audit Table Size Estimates

```sql
-- Check audit table size
SELECT
  COUNT(*) as total_entries,
  COUNT(DISTINCT user_id) as unique_users,
  pg_size_pretty(pg_total_relation_size('user_audit_log')) as table_size
FROM user_audit_log;

-- Count entries by field type
SELECT
  field_name,
  COUNT(*) as entry_count
FROM user_audit_log
GROUP BY field_name
ORDER BY entry_count DESC;

-- Example output after 1 year with 10K users:
-- total_entries: ~15,000 entries
-- unique_users: ~8,000 users
-- table_size: ~2 MB (still negligible)

-- Breakdown of entries (estimated):
-- - email changes: ~500 (5% of users change email)
-- - first_name changes: ~3,000 (30% update name after signup)
-- - last_name changes: ~3,000 (30% update name after signup)
-- - role changes: ~50 (0.5% promoted to admin/support)
-- - tier changes: ~5,000 (50% upgrade from free tier)
-- - email_verified: ~10,000 (all users verify email)
-- - deleted_at: ~450 (5% soft delete)

-- Audit log is lightweight:
-- - ~150 bytes per entry (field_name, old_value, new_value, metadata)
-- - 15,000 entries × 150 bytes = 2.25 MB
-- - Indexes add ~500 KB
-- - Total: ~3 MB for 10K users over 1 year
```

### 8. Testing Deletion Scenarios

```bash
# Test in Docker sandbox
npm run test:db:setup
npm run db:shell

# 1. Test soft delete creates audit entry and preserves history
INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
VALUES ('test@ex.com', 'Test', 'User', 'hash', true);

UPDATE users SET role = 'admin' WHERE email = 'test@ex.com';
UPDATE users SET first_name = 'Updated' WHERE email = 'test@ex.com';
UPDATE users SET deleted_at = NOW() WHERE email = 'test@ex.com';

SELECT field_name, old_value, new_value FROM user_audit_log
WHERE user_email = 'test@ex.com'
ORDER BY changed_at DESC;
-- Should return 3 entries: deleted_at, first_name, role ✅

# 2. Test hard delete is blocked
DELETE FROM users WHERE email = 'test@ex.com';
-- Should ERROR with foreign key constraint violation ✅

# 3. Test workaround (delete audit first)
DELETE FROM user_audit_log WHERE user_email = 'test@ex.com';
DELETE FROM users WHERE email = 'test@ex.com';
-- Should succeed (but audit history lost - not recommended) ⚠️

# 4. Test trigger tracks all audited fields
INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
VALUES ('test2@ex.com', 'Jane', 'Doe', 'hash', false);

UPDATE users
SET first_name = 'Janet',
    last_name = 'Smith',
    email = 'test2-updated@ex.com',
    role = 'support',
    email_verified = true
WHERE email = 'test2@ex.com';

SELECT COUNT(*) FROM user_audit_log WHERE user_id = (
  SELECT id FROM users WHERE email = 'test2-updated@ex.com'
);
-- Should return 5 entries (first_name, last_name, email, role, email_verified) ✅

# Cleanup
DELETE FROM user_audit_log WHERE user_email LIKE 'test%@ex.com';
DELETE FROM users WHERE email LIKE 'test%@ex.com' OR email LIKE 'test%-updated@ex.com';
```

---

## Testing Strategy

### Backend Tests (1 hour)

```bash
# 1. Migration test
cd server
npm run test:db:setup
npm run test:db -- migrations-012

# 2. Test database trigger manually in Docker
npm run db:shell

# Create test user
INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
VALUES ('test@example.com', 'Test', 'User', 'hash', true)
RETURNING id;

# Update multiple fields and verify trigger creates separate entries
UPDATE users
SET role = 'admin',
    first_name = 'Updated',
    email = 'test-updated@example.com'
WHERE email = 'test@example.com';

# Check audit log was automatically created (3 entries)
SELECT field_name, old_value, new_value FROM user_audit_log
WHERE user_id = (SELECT id FROM users WHERE email = 'test-updated@example.com')
ORDER BY field_name;
-- Should show 3 entries: email, first_name, role

# Test trigger doesn't fire if no fields changed
UPDATE users SET role = 'admin' WHERE email = 'test-updated@example.com';

# Verify no duplicate audit entries
SELECT COUNT(*) FROM user_audit_log
WHERE user_id = (SELECT id FROM users WHERE email = 'test-updated@example.com');
-- Should still be 3

# Test soft delete creates audit entry
UPDATE users SET deleted_at = NOW() WHERE email = 'test-updated@example.com';

SELECT field_name, new_value, change_type FROM user_audit_log
WHERE user_id = (SELECT id FROM users WHERE email = 'test-updated@example.com')
  AND field_name = 'deleted_at';
-- Should show: field_name='deleted_at', new_value='2025-...', change_type='delete'

# Clean up test data (must delete audit first due to ON DELETE RESTRICT)
DELETE FROM user_audit_log WHERE user_email LIKE 'test%@example.com';
DELETE FROM users WHERE email LIKE 'test%@example.com';

# 3. Unit tests
npm test -- User.test.js
npm test -- rateLimitBypass.test.js

# 4. Integration tests - Add to generate.test.js
# Test admin can generate unlimited
# Test user still rate limited
# Test role demotion edge case
```

### Frontend Tests (30 min)

```bash
cd client

# 1. Hook tests
npm test -- useUsageTracking.test.js

# 2. Component tests
npm test -- UsageWarningBanner.test.jsx
npm test -- UsageLimitModal.test.jsx
npm test -- UsageDashboard.test.jsx
npm test -- RoleBadge.test.jsx

# 3. Integration test
npm test -- App.test.jsx
```

### Manual Testing Checklist

- [ ] **Admin User**
  - [ ] Set role to 'admin' via SQL
  - [ ] Generate 20+ docs rapidly
  - [ ] Verify no 429 errors
  - [ ] Verify no UI warnings/modals
  - [ ] Check Usage Dashboard shows admin view
  - [ ] Check Settings shows admin badge
  - [ ] Verify usage still increments in database

- [ ] **Regular User**
  - [ ] Generate docs until 80% daily limit
  - [ ] Verify warning banner appears
  - [ ] Generate to 100% daily limit
  - [ ] Verify limit modal appears
  - [ ] Verify 429 error on next attempt
  - [ ] Check Usage Dashboard shows percentages

- [ ] **Role Demotion Edge Case**
  - [ ] Generate 50+ docs as admin
  - [ ] Demote to 'user' role
  - [ ] Verify immediate 429 error
  - [ ] Verify UI shows 100% (not 500%)
  - [ ] Verify progress bars render correctly
  - [ ] Wait for next period, verify lazy reset works

---

## Security Considerations

### Role Assignment
- Only manually assign roles via SQL until Phase 3 admin UI
- Document all role changes in team logs
- Never expose role assignment endpoints without proper authentication

### Bypass Logging
- Log bypass usage in development for monitoring
- Do NOT store bypass events in database (noise)
- Monitor admin usage via existing `user_quotas` table

### Rate Limit Headers
```javascript
// Still send headers even for bypassed requests
res.set({
  'X-RateLimit-Bypass': req.bypassRateLimit ? 'true' : 'false',
  'X-RateLimit-Remaining': req.bypassRateLimit ? 'unlimited' : remaining,
  'X-RateLimit-Reset': resetTime
});
```

---

## Cost Analysis Queries

### Admin/Support Usage Report
```sql
-- Monthly cost breakdown by role
SELECT
  u.role,
  COUNT(DISTINCT u.id) as user_count,
  SUM(uq.monthly_count) as total_requests,
  AVG(uq.monthly_count) as avg_requests_per_user
FROM user_quotas uq
JOIN users u ON uq.user_id = u.id
WHERE uq.period_start >= DATE_TRUNC('month', NOW())
GROUP BY u.role
ORDER BY total_requests DESC;
```

### Individual Admin Usage
```sql
-- Find heavy admin users
SELECT
  u.email,
  u.role,
  uq.daily_count,
  uq.monthly_count,
  uq.period_start,
  uq.period_end
FROM user_quotas uq
JOIN users u ON uq.user_id = u.id
WHERE u.role IN ('admin', 'support')
ORDER BY uq.monthly_count DESC
LIMIT 20;
```

### User Audit Queries

```sql
-- View all user changes (recent first)
SELECT
  ual.changed_at,
  u.email as user_email,
  ual.field_name,
  ual.old_value,
  ual.new_value,
  ual.reason,
  cb.email as changed_by,
  ual.metadata
FROM user_audit_log ual
JOIN users u ON ual.user_id = u.id
LEFT JOIN users cb ON ual.changed_by_id = cb.id
ORDER BY ual.changed_at DESC
LIMIT 50;

-- View only role changes
SELECT
  ual.changed_at,
  u.email as user_email,
  ual.old_value as old_role,
  ual.new_value as new_role,
  ual.reason,
  cb.email as changed_by
FROM user_audit_log ual
JOIN users u ON ual.user_id = u.id
LEFT JOIN users cb ON ual.changed_by_id = cb.id
WHERE ual.field_name = 'role'
ORDER BY ual.changed_at DESC
LIMIT 50;

-- View email changes (account takeover tracking)
SELECT
  ual.changed_at,
  ual.user_email,
  ual.old_value as old_email,
  ual.new_value as new_email,
  ual.reason,
  cb.email as changed_by
FROM user_audit_log ual
LEFT JOIN users cb ON ual.changed_by_id = cb.id
WHERE ual.field_name = 'email'
ORDER BY ual.changed_at DESC
LIMIT 50;

-- View profile changes (first_name, last_name, email)
SELECT
  ual.changed_at,
  u.email as user_email,
  ual.field_name,
  ual.old_value,
  ual.new_value,
  ual.reason
FROM user_audit_log ual
JOIN users u ON ual.user_id = u.id
WHERE ual.field_name IN ('email', 'first_name', 'last_name')
ORDER BY ual.changed_at DESC
LIMIT 50;

-- Count changes by field type
SELECT
  field_name,
  COUNT(*) as change_count
FROM user_audit_log
GROUP BY field_name
ORDER BY change_count DESC;

-- Find users who were demoted from admin
SELECT
  u.email,
  u.role as current_role,
  ual.old_value as old_role,
  ual.new_value as new_role,
  ual.changed_at,
  ual.reason
FROM user_audit_log ual
JOIN users u ON ual.user_id = u.id
WHERE ual.field_name = 'role'
  AND ual.old_value IN ('admin', 'super_admin')
  AND ual.new_value NOT IN ('admin', 'super_admin')
ORDER BY ual.changed_at DESC;

-- Full audit log for specific user (all fields)
SELECT
  ual.changed_at,
  ual.field_name,
  ual.old_value,
  ual.new_value,
  ual.reason,
  cb.email as changed_by
FROM user_audit_log ual
LEFT JOIN users cb ON ual.changed_by_id = cb.id
WHERE ual.user_id = (SELECT id FROM users WHERE email = 'user@example.com')
ORDER BY ual.changed_at DESC;

-- Track when a user changed their name
SELECT
  ual.changed_at,
  ual.field_name,
  ual.old_value,
  ual.new_value
FROM user_audit_log ual
WHERE ual.user_id = (SELECT id FROM users WHERE email = 'user@example.com')
  AND ual.field_name IN ('first_name', 'last_name')
ORDER BY ual.changed_at DESC;
```

---

## Future Enhancements (Phase 3)

**Not included in this implementation:**

1. **Admin UI for Role Management**
   - Page: `/admin/users`
   - Promote/demote users via UI (instead of SQL)
   - View all users by role with filtering/search
   - Visual audit log timeline with filters
   - Bulk role operations

2. **Role-Based Permissions**
   - Fine-grained permissions beyond bypass
   - Admin can view all users' usage
   - Support can impersonate users for troubleshooting
   - Permission matrix for different actions

3. **Advanced Audit Features**
   - Real-time audit log streaming
   - Alert on suspicious activity (multiple role changes)
   - Export audit logs to CSV/JSON
   - Audit log retention policies
   - Integration with security monitoring tools

**Estimated Time for Phase 3:** 6-8 hours

**What IS included in current implementation:**
- ✅ Audit table (`role_change_audit`) with full schema
- ✅ `User.updateRole()` with automatic audit logging
- ✅ `User.getRoleHistory()` for viewing audit logs
- ✅ Manual SQL-based role assignment with audit logging
- ✅ Comprehensive audit queries for reporting

---

## Rollback Plan

If issues occur in production:

```sql
-- Remove role column (keep data intact)
ALTER TABLE users DROP CONSTRAINT check_valid_role;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Set all users to 'user' role
UPDATE users SET role = 'user';

-- Redeploy previous version without bypass logic
```

---

## Files Modified/Created

### Backend (7 files)
1. ✅ `server/src/migrations/012_add_user_roles.sql` - NEW
2. ✅ `server/src/middleware/rateLimitBypass.js` - NEW
3. ✅ `server/src/middleware/rateLimiter.js` - MODIFIED
4. ✅ `server/src/routes/generate.js` - MODIFIED
5. ✅ `server/src/routes/usage.js` - MODIFIED
6. ✅ `server/src/models/User.js` - MODIFIED
7. ✅ `server/src/middleware/__tests__/rateLimitBypass.test.js` - NEW

### Frontend (7 files)
8. ✅ `client/src/hooks/useUsageTracking.js` - MODIFIED
9. ✅ `client/src/components/UsageWarningBanner.jsx` - MODIFIED
10. ✅ `client/src/components/UsageLimitModal.jsx` - MODIFIED
11. ✅ `client/src/pages/UsageDashboard.jsx` - MODIFIED
12. ✅ `client/src/App.jsx` - MODIFIED
13. ✅ `client/src/components/RoleBadge.jsx` - NEW
14. ✅ `client/src/pages/Settings.jsx` - MODIFIED

### Documentation (1 file)
15. ✅ `docs/planning/ROLE-BASED-RATE-LIMITING.md` - NEW (this file)

**Total: 15 files (4 new, 11 modified)**

---

## Success Criteria

- [ ] Migration runs successfully in Docker sandbox
- [ ] Database trigger automatically creates audit logs on ALL tracked field changes
- [ ] Tracked fields: role, email, first_name, last_name, tier, email_verified, deleted_at
- [ ] Trigger does NOT fire on initial user creation (reduces noise)
- [ ] Manual SQL changes are automatically audited
- [ ] Soft delete creates audit entry and preserves history
- [ ] Hard delete is blocked by ON DELETE RESTRICT constraint
- [ ] user_email denormalized in audit table for retention
- [ ] Admin users can generate unlimited docs
- [ ] Regular users still see rate limits enforced
- [ ] UI warnings suppressed for admin/support
- [ ] Usage still tracked for all users
- [ ] Role visible in Settings page
- [ ] Role demotion edge case handled gracefully
- [ ] Bulk updates create separate audit entries per user per field
- [ ] All tests pass (backend + frontend)
- [ ] No production errors after deployment
- [ ] Audit queries return correct field change history (role, email, name, etc.)

---

## Post-Implementation Checklist

- [ ] Update CHANGELOG.md with role-based rate limiting feature
- [ ] Update README.md with admin role information
- [ ] Add entry to SKIPPED-TESTS.md if any tests skipped
- [ ] Document manual role assignment process for team
- [ ] Monitor admin usage patterns in production
- [ ] Plan Phase 3 (admin UI) for future release

---

**Ready to begin implementation.**
