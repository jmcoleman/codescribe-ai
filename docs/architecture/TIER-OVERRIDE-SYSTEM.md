# Tier Override System

**Project:** CodeScribe AI
**Feature:** Admin/Support Tier Override for Testing
**Version:** v2.8.1
**Status:** ✅ Production
**Created:** November 17, 2025
**Last Updated:** November 17, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Design Goals](#design-goals)
4. [System Architecture](#system-architecture)
5. [Implementation Details](#implementation-details)
6. [Security Considerations](#security-considerations)
7. [Audit Trail](#audit-trail)
8. [UI Components](#ui-components)
9. [API Endpoints](#api-endpoints)
10. [Testing Strategy](#testing-strategy)
11. [Migration History](#migration-history)

---

## Overview

The Tier Override System allows admin, support, and super_admin users to temporarily test the application as if they were a different subscription tier. This is critical for:

- **Bug Reproduction**: Support team can replicate user-reported issues at specific tiers
- **Feature Testing**: QA can test tier-gated features without creating test accounts
- **Sales Demos**: Sales team can demonstrate Pro/Team features to prospects
- **Development**: Engineers can test tier-specific logic without modifying code

**Key Principle:** Override is **database-based and temporary** - it never modifies the user's actual billing tier, ensuring billing integrity.

---

## Problem Statement

### Current Pain Points

1. **Support Cannot Replicate Bugs**: Support team receives bug reports like "Multi-file upload doesn't work" from Pro users, but support staff are on Free tier and can't access the feature.

2. **Manual Tier Changes Are Risky**: Temporarily upgrading a user's tier in the database:
   - Risks billing errors if not reverted
   - Requires database access (security risk)
   - Leaves no audit trail of why tier was changed
   - Can affect production billing if forgotten

3. **Test Accounts Are Inefficient**:
   - Maintaining separate test accounts for each tier
   - Can't replicate specific user data/configurations
   - Duplicate work to set up realistic scenarios

4. **No Audit Trail**: When tier changes are made manually, there's no record of who changed it, when, or why.

### User Needs

**Support Team:**
- "I need to see the exact UI/features a Pro user sees to debug their issue"
- "I need to test if bug exists in all tiers or just Pro tier"

**Admin/QA:**
- "I need to verify tier-gating works correctly before shipping"
- "I need to test Pro features without creating test Stripe subscriptions"

**Sales/Demo:**
- "I need to show Team features to prospects without upgrading real accounts"

---

## Design Goals

### Functional Requirements

1. **FR-1**: Admin/support can override their own tier temporarily
2. **FR-2**: Override expires automatically after 4 hours (default, configurable)
3. **FR-3**: All overrides are logged with reason, timestamp, and who applied it
4. **FR-4**: Visual indicator shows when override is active
5. **FR-5**: Override can be cleared manually at any time
6. **FR-6**: Override only affects feature access, not billing or database tier
7. **FR-7**: Override persists across page refreshes (stored in database)

### Non-Functional Requirements

1. **NFR-1 Security**: Only admin/support/super_admin roles can apply overrides
2. **NFR-2 Auditability**: Complete audit trail for compliance
3. **NFR-3 Performance**: Minimal overhead (read from database like any other field)
4. **NFR-4 UX**: Clear visual feedback prevents confusion
5. **NFR-5 Safety**: Cannot affect billing or actual subscription status

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Database-Based Tier Override Flow                   │
└─────────────────────────────────────────────────────────────────┘

1. APPLY OVERRIDE
   Admin/Support User              Backend API                Database
   ─────────────────               ───────────               ────────
         │                              │                         │
         │ POST /api/admin/            │                         │
         │   tier-override              │                         │
         │ {                            │                         │
         │   targetTier: "pro",         │                         │
         │   reason: "Testing #1234",   │                         │
         │   hoursValid: 4              │                         │
         │ }                            │                         │
         ├──────────────────────────────>                         │
         │                              │                         │
         │                        ┌─────▼─────┐                  │
         │                        │ Verify:   │                  │
         │                        │ - Role OK │                  │
         │                        │ - Tier OK │                  │
         │                        │ - Reason  │                  │
         │                        └─────┬─────┘                  │
         │                              │                         │
         │                              │ UPDATE users            │
         │                              │ SET viewing_as_tier     │
         │                              │   = 'pro',              │
         │                              │ override_expires_at     │
         │                              │   = NOW() + 4 hours,    │
         │                              │ override_reason = ...   │
         │                              ├────────────────────────>│
         │                              │                         │
         │                              │ INSERT audit_log        │
         │                              ├────────────────────────>│
         │                              │                         │
         │ Response:                    │                         │
         │ { override details }         │                         │
         │<─────────────────────────────┤                         │
         │                              │                         │
    ┌────▼────┐                         │                         │
    │ Refresh │                         │                         │
    │ user    │                         │                         │
    │ from    │                         │                         │
    │ /api/   │                         │                         │
    │ auth/me │                         │                         │
    └────┬────┘                         │                         │
         │                              │                         │

2. USE OVERRIDE
   Frontend                        Backend API                Feature Check
   ────────                        ───────────                ─────────────
         │                              │                         │
         │ GET /api/documents           │                         │
         │ Authorization: Bearer <JWT>  │                         │
         ├──────────────────────────────>                         │
         │                              │                         │
         │                        ┌─────▼─────┐                  │
         │                        │ Verify JWT│                  │
         │                        │ Extract ID│                  │
         │                        └─────┬─────┘                  │
         │                              │                         │
         │                              │ User.findById(id)       │
         │                              │ SELECT ...,             │
         │                              │   viewing_as_tier,      │
         │                              │   override_expires_at   │
         │                              ├────────────────────────>│
         │                              │                         │
         │                              │        ┌────────────────▼───┐
         │                              │        │ getEffectiveTier() │
         │                              │        │ Check expiry:      │
         │                              │        │  if expired:       │
         │                              │        │    return tier     │
         │                              │        │  else:             │
         │                              │        │    return viewing_ │
         │                              │        │      as_tier       │
         │                              │        └────────────────┬───┘
         │                              │                         │
         │                              │<────────────────────────┤
         │                              │  effectiveTier: "pro"   │
         │                              │                         │
         │ Response: { documents }      │                         │
         │<─────────────────────────────┤                         │
         │                              │                         │

3. CLEAR OVERRIDE
   Admin/Support User              Backend API                Database
   ─────────────────               ───────────               ────────
         │                              │                         │
         │ POST /api/admin/            │                         │
         │   tier-override/clear        │                         │
         ├──────────────────────────────>                         │
         │                              │                         │
         │                              │ UPDATE users            │
         │                              │ SET viewing_as_tier     │
         │                              │   = NULL,               │
         │                              │ override_expires_at     │
         │                              │   = NULL,               │
         │                              │ override_reason = NULL  │
         │                              ├────────────────────────>│
         │                              │                         │
         │                              │ INSERT audit_log        │
         │                              │ (cleared override)      │
         │                              ├────────────────────────>│
         │                              │                         │
         │ Response: { success }        │                         │
         │<─────────────────────────────┤                         │
         │                              │                         │
```

### Data Flow

**1. Override Application:**
```
Admin clicks "Override to Pro"
  → POST /api/admin/tier-override
    → Verify role (admin/support/super_admin)
      → User.applyTierOverride(userId, targetTier, reason, hoursValid)
        → UPDATE users SET viewing_as_tier, override_expires_at, override_reason
          → Log to user_audit_log table
            → Return override details
              → Frontend refreshes user from /api/auth/me
                → Visual banner appears
```

**2. Feature Access Check:**
```
User requests Pro feature (e.g., multi-file upload)
  → Backend extracts JWT, calls User.findById()
    → Database returns user with viewing_as_tier, override_expires_at
      → getEffectiveTier(user)
        → Check if viewing_as_tier exists and override_expires_at > NOW()
          → Use override tier OR real tier
            → hasFeature(effectiveTier, feature)
              → Allow or deny access
```

**3. Override Expiry:**
```
Override is 4 hours old
  → getEffectiveTier() checks override_expires_at
    → If NOW() > override_expires_at: return real tier
      → Feature access reverts to actual tier
        → Visual banner auto-hides
```

---

## Implementation Details

### Database Schema

#### Migration 020: Tier Override Columns

**File:** `server/src/db/migrations/020-add-tier-override-columns.sql`

```sql
-- Add tier override columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS viewing_as_tier VARCHAR(50) DEFAULT NULL
CHECK (viewing_as_tier IN ('free', 'starter', 'pro', 'team', 'enterprise') OR viewing_as_tier IS NULL);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS override_expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS override_reason TEXT DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS override_applied_at TIMESTAMPTZ DEFAULT NULL;

-- Index for finding users with active overrides (admin dashboard, cleanup)
CREATE INDEX IF NOT EXISTS idx_users_override_expiry
ON users(override_expires_at)
WHERE override_expires_at IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.viewing_as_tier IS 'Temporary tier override for admin/support testing. NULL means no override active.';
COMMENT ON COLUMN users.override_expires_at IS 'When the tier override expires. NULL means no override active.';
COMMENT ON COLUMN users.override_reason IS 'Why the override was applied (required for audit compliance).';
COMMENT ON COLUMN users.override_applied_at IS 'When the override was applied (for audit trail).';
```

**Benefits:**
- Simple: Just read from database like any other field
- Persistent: Survives page refreshes, browser closes
- Queryable: Can find all users with active overrides
- No sync issues: Single source of truth

### Backend

#### 1. User Model Methods

**File:** `server/src/models/User.js`

```javascript
/**
 * Apply tier override for admin/support testing
 */
static async applyTierOverride(userId, targetTier, reason, hoursValid = 4) {
  const validTiers = ['free', 'starter', 'pro', 'team', 'enterprise'];
  if (!validTiers.includes(targetTier)) {
    throw new Error(`Invalid tier: ${targetTier}`);
  }

  if (!reason || reason.trim().length < 10) {
    throw new Error('Reason must be at least 10 characters');
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hoursValid);

  const result = await sql`
    UPDATE users
    SET viewing_as_tier = ${targetTier},
        override_expires_at = ${expiresAt.toISOString()},
        override_reason = ${reason.trim()},
        override_applied_at = NOW(),
        updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, tier, role, viewing_as_tier,
              override_expires_at, override_reason, override_applied_at
  `;

  return result.rows[0];
}

/**
 * Clear tier override for a user
 */
static async clearTierOverride(userId) {
  const result = await sql`
    UPDATE users
    SET viewing_as_tier = NULL,
        override_expires_at = NULL,
        override_reason = NULL,
        override_applied_at = NULL,
        updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, tier, role
  `;

  return result.rows[0];
}

/**
 * Check if user has an active tier override
 */
static async getActiveTierOverride(userId) {
  const result = await sql`
    SELECT viewing_as_tier, override_expires_at, override_reason, override_applied_at
    FROM users
    WHERE id = ${userId}
      AND viewing_as_tier IS NOT NULL
      AND override_expires_at > NOW()
  `;

  if (result.rows.length === 0) return null;

  const override = result.rows[0];
  // Calculate remaining time...
  return { tier, expiresAt, reason, appliedAt, remainingTime };
}
```

#### 2. Helper Functions

**File:** `server/src/utils/tierOverride.js`

```javascript
/**
 * Get effective tier (considering override if present and valid)
 *
 * @param {Object} user - User object from database
 * @param {string} user.tier - Real tier from database (billing tier)
 * @param {string} user.viewing_as_tier - Override tier (if applied)
 * @param {string} user.override_expires_at - Override expiry timestamp
 * @returns {string} - Effective tier to use for feature checks
 */
export const getEffectiveTier = (user) => {
  if (!user) return 'free';

  // Only admin/support/super_admin can have overrides
  if (!['admin', 'support', 'super_admin'].includes(user.role)) {
    return user.tier || 'free';
  }

  // Check if override exists in database
  if (!user.viewing_as_tier || !user.override_expires_at) {
    return user.tier || 'free';
  }

  // Check if override has expired
  const now = new Date();
  const expiry = new Date(user.override_expires_at);

  if (now > expiry) {
    console.log(`[TierOverride] Override expired for user ${user.id}`);
    return user.tier || 'free';
  }

  console.log(`[TierOverride] Using override tier "${user.viewing_as_tier}"`);
  return user.viewing_as_tier;
};

/**
 * Check if user has active override
 */
export const hasActiveOverride = (user) => {
  if (!user || !user.viewing_as_tier || !user.override_expires_at) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(user.override_expires_at);
  return now < expiry;
};

/**
 * Get override details (for logging/display)
 */
export const getOverrideDetails = (user) => {
  if (!hasActiveOverride(user)) return null;

  const now = new Date();
  const expiry = new Date(user.override_expires_at);
  const remainingMs = expiry.getTime() - now.getTime();

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    tier: user.viewing_as_tier,
    reason: user.override_reason,
    appliedAt: user.override_applied_at,
    expiresAt: user.override_expires_at,
    remainingTime: { hours, minutes, totalMs: remainingMs }
  };
};
```

#### 3. Database Audit Log

Uses existing `user_audit_log` table:

```sql
-- Override applied
INSERT INTO user_audit_log (
  user_id,
  user_email,
  changed_by_id,
  field_name,
  old_value,
  new_value,
  reason
) VALUES (
  123,
  'support@codescribe.com',
  123,
  'tier_override',
  'free',
  '{"targetTier":"pro","reason":"Testing multi-file bug #1234","expiresAt":"2025-11-17T19:00:00Z"}',
  'Testing multi-file bug #1234'
);

-- Override cleared
INSERT INTO user_audit_log (
  user_id,
  user_email,
  changed_by_id,
  field_name,
  old_value,
  new_value,
  reason
) VALUES (
  123,
  'support@codescribe.com',
  123,
  'tier_override_cleared',
  '{"tier":"pro","expiresAt":"2025-11-17T19:00:00Z"}',
  'free',
  'Tier override cleared by admin'
);
```

### Frontend

#### 1. React Hook

**File:** `client/src/hooks/useTierOverride.js`

```javascript
/**
 * Parse override from current user (database fields)
 */
const parseOverrideFromUser = useCallback(() => {
  if (!user || !user.viewing_as_tier) {
    return null;
  }

  const now = new Date();
  const expiry = new Date(user.override_expires_at);

  // Check if expired
  if (now > expiry) {
    return null;
  }

  const remainingMs = expiry.getTime() - now.getTime();
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    active: true,
    tier: user.viewing_as_tier,
    reason: user.override_reason,
    expiresAt: user.override_expires_at,
    appliedAt: user.override_applied_at,
    remainingTime: { hours, minutes, totalMs: remainingMs }
  };
}, [user]);

/**
 * Apply tier override
 */
const applyOverride = async ({ targetTier, reason, hoursValid = 4 }) => {
  const response = await fetch(`${API_URL}/api/admin/tier-override`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ targetTier, reason, hoursValid })
  });

  const data = await response.json();

  // Refresh user from /api/auth/me to get updated override fields
  if (updateToken) {
    await updateToken();
  }

  setOverride({ active: true, ...data.data.override });
  return data;
};
```

---

## Security Considerations

### 1. Role-Based Access Control

**Threat**: Unauthorized users apply overrides to get free access to paid features.

**Mitigation**:
```javascript
// Backend validation
if (!['admin', 'support', 'super_admin'].includes(user.role)) {
  throw new Error('Unauthorized: Only admin/support can apply overrides');
}
```

**Result**: Only privileged roles can apply overrides.

### 2. Billing Integrity

**Threat**: Override accidentally affects billing or subscription status.

**Mitigation**:
- Override stored in `viewing_as_tier` column (separate from `tier`)
- Billing queries use `users.tier` directly (ignore override)
- Stripe webhooks update `users.tier` (unaffected by overrides)

**Result**: Billing completely isolated from override system.

### 3. Audit Trail

**Threat**: Unauthorized override goes undetected.

**Mitigation**:
- Every override logged to `user_audit_log`
- Includes: who, when, why, which tier
- Immutable audit log (append-only)

**Result**: Complete forensic trail for security audits.

### 4. Time-Limited Overrides

**Threat**: Forgotten override gives permanent free access.

**Mitigation**:
- Expiry stored in `override_expires_at`
- `getEffectiveTier()` checks expiry on every request
- Expired overrides automatically ignored

**Result**: Maximum window (default 4 hours), then reverts to real tier.

---

## Audit Trail

### Events Logged

All override events are logged to `user_audit_log` table:

| Event | Field Name | Old Value | New Value | Reason |
|-------|-----------|-----------|-----------|--------|
| Override Applied | `tier_override` | `free` | `{"targetTier":"pro",...}` | "Testing multi-file bug #1234" |
| Override Cleared | `tier_override_cleared` | `{"tier":"pro",...}` | `free` | "Testing complete" |

### Audit Log Query Examples

```sql
-- Get all active overrides
SELECT
  u.id,
  u.email,
  u.viewing_as_tier,
  u.override_expires_at,
  u.override_reason
FROM users u
WHERE u.viewing_as_tier IS NOT NULL
  AND u.override_expires_at > NOW()
ORDER BY u.override_expires_at ASC;

-- Get override history for specific user
SELECT
  field_name,
  old_value,
  new_value,
  reason,
  changed_at
FROM user_audit_log
WHERE user_id = 123
  AND field_name IN ('tier_override', 'tier_override_cleared')
ORDER BY changed_at DESC;

-- Count overrides by user (detect abuse)
SELECT
  user_email,
  COUNT(*) as override_count,
  MIN(changed_at) as first_override,
  MAX(changed_at) as last_override
FROM user_audit_log
WHERE field_name = 'tier_override'
  AND changed_at > NOW() - INTERVAL '30 days'
GROUP BY user_email
ORDER BY override_count DESC;

-- Find expired overrides that need cleanup
SELECT id, email, viewing_as_tier, override_expires_at
FROM users
WHERE viewing_as_tier IS NOT NULL
  AND override_expires_at <= NOW();
```

---

## UI Components

### 1. TierOverrideBanner (Header)

**Purpose**: Shows when override is active, prevents confusion.

**Location**: `client/src/components/TierOverrideBanner.jsx`

**Design**:
```jsx
// Shows at top of page when override active
<div className="bg-amber-500 dark:bg-amber-600 text-white px-4 py-2">
  <div className="flex items-center gap-3">
    <AlertTriangle className="w-5 h-5" />
    <span>Viewing As: {user.viewing_as_tier}</span>
    <span>• Expires in {timeRemaining}</span>
  </div>
  <button onClick={clearOverride}>Clear Override</button>
</div>
```

### 2. TierOverridePanel (Settings)

**Purpose**: Apply/clear tier overrides.

**Location**: `client/src/components/TierOverridePanel.jsx`

**Features**:
- Select target tier (Free, Starter, Pro, Team, Enterprise)
- Required reason field (min 10 characters, shows character counter)
- Configurable expiry (default 4 hours)
- Shows current override status
- Clear override button when active

---

## API Endpoints

### POST /api/admin/tier-override

Apply a tier override.

**Authentication**: Required (admin/support/super_admin only)

**Request**:
```json
{
  "targetTier": "pro",
  "reason": "Testing multi-file bug #1234",
  "hoursValid": 4
}
```

**Response**:
```json
{
  "success": true,
  "message": "Tier override applied: pro for 4 hours",
  "data": {
    "override": {
      "tier": "pro",
      "expiresAt": "2025-11-17T19:00:00Z",
      "reason": "Testing multi-file bug #1234",
      "appliedAt": "2025-11-17T15:00:00Z"
    }
  }
}
```

**Errors**:
- `403`: Insufficient permissions (not admin/support)
- `400`: Invalid tier or reason too short
- `500`: Server error

### POST /api/admin/tier-override/clear

Clear active tier override.

**Authentication**: Required (admin/support/super_admin only)

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "message": "Tier override cleared successfully",
  "data": {
    "tier": "free"
  }
}
```

**Errors**:
- `403`: Insufficient permissions
- `400`: No active override to clear
- `500`: Server error

### GET /api/admin/tier-override/status

Get current tier override status.

**Authentication**: Required (admin/support/super_admin only)

**Response** (with active override):
```json
{
  "success": true,
  "data": {
    "active": true,
    "realTier": "free",
    "effectiveTier": "pro",
    "override": {
      "tier": "pro",
      "expiresAt": "2025-11-17T19:00:00Z",
      "reason": "Testing multi-file bug #1234",
      "appliedAt": "2025-11-17T15:00:00Z"
    }
  }
}
```

**Response** (no override):
```json
{
  "success": true,
  "data": {
    "active": false,
    "realTier": "free",
    "effectiveTier": "free"
  }
}
```

---

## Testing Strategy

### Manual Testing Checklist

**Functional Tests:**
- [x] Admin can apply override
- [x] Support can apply override
- [x] Regular user cannot apply override
- [x] Override persists across page refreshes
- [x] Override can be cleared manually
- [x] Banner shows when override active
- [x] Banner hides when override cleared
- [x] Feature access changes based on override
- [x] Billing queries ignore override
- [ ] Override expires after configured hours (requires 4+ hour wait)

**Security Tests:**
- [x] Non-admin gets 403 when applying override
- [x] Invalid tier rejected
- [x] Reason < 10 chars rejected
- [x] Expired override ignored by getEffectiveTier()
- [x] Override does not affect `users.tier` in database
- [x] Audit log captures all override events

**UX Tests:**
- [x] Banner is visible and clear
- [x] Time remaining updates correctly
- [x] Clear button works
- [x] Settings panel shows current override status
- [x] Form validation shows helpful errors
- [x] Character counter for reason field

---

## Migration History

### v2.8.0 → v2.8.1: JWT to Database Migration

**Date:** November 17, 2025

**Reason:** The JWT-based approach had multiple sync points where it could fail. Switching to database provides a single source of truth.

**Changes:**
1. Added database columns: `viewing_as_tier`, `override_expires_at`, `override_reason`, `override_applied_at`
2. Updated `User.findById()` to include override fields
3. Added `User.applyTierOverride()`, `User.clearTierOverride()`, `User.getActiveTierOverride()`
4. Updated `getEffectiveTier()` to read from database fields
5. Removed JWT override logic from middleware
6. Updated frontend hook to use database field names
7. API endpoints no longer return tokens

**Benefits:**
- ✅ Simpler: Just read/write database
- ✅ No sync issues: Single source of truth
- ✅ Easier debugging: Can query database directly
- ✅ Persistent: Survives browser close, JWT refresh
- ✅ Queryable: Can find all active overrides for admin dashboard

---

## Related Documents

- [TIER-ARCHITECTURE.md](./TIER-ARCHITECTURE.md) - Tier feature configuration
- [SUBSCRIPTION-MANAGEMENT.md](./SUBSCRIPTION-MANAGEMENT.md) - Subscription and billing
- [Database Migration Guide](../database/DB-MIGRATION-MANAGEMENT.MD) - Migration workflow

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-17 | Claude Code | Initial design document (JWT-based) |
| 2.0 | 2025-11-17 | Claude Code | Migrated to database-based approach |

---

**End of Document**
