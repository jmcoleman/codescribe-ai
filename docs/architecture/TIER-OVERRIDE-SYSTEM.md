# Tier Override System

**Project:** CodeScribe AI
**Feature:** Admin/Support Tier Override for Testing
**Version:** v2.8.0
**Status:** 🚧 In Development
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
11. [Rollout Plan](#rollout-plan)

---

## Overview

The Tier Override System allows admin, support, and super_admin users to temporarily test the application as if they were a different subscription tier. This is critical for:

- **Bug Reproduction**: Support team can replicate user-reported issues at specific tiers
- **Feature Testing**: QA can test tier-gated features without creating test accounts
- **Sales Demos**: Sales team can demonstrate Pro/Team features to prospects
- **Development**: Engineers can test tier-specific logic without modifying code

**Key Principle:** Override is **session-based and temporary** - it never modifies the user's actual tier in the database, ensuring billing integrity.

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
2. **FR-2**: Override expires automatically after 4 hours
3. **FR-3**: All overrides are logged with reason, timestamp, and who applied it
4. **FR-4**: Visual indicator shows when override is active
5. **FR-5**: Override can be cleared manually at any time
6. **FR-6**: Override only affects feature access, not billing or database tier
7. **FR-7**: Override persists across page refreshes (stored in JWT/session)

### Non-Functional Requirements

1. **NFR-1 Security**: Only admin/support/super_admin roles can apply overrides
2. **NFR-2 Auditability**: Complete audit trail for compliance
3. **NFR-3 Performance**: No additional database queries per request
4. **NFR-4 UX**: Clear visual feedback prevents confusion
5. **NFR-5 Safety**: Cannot affect billing or actual subscription status

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Tier Override Flow                     │
└─────────────────────────────────────────────────────────────────┘

1. APPLY OVERRIDE
   Admin/Support User              Backend API                Database
   ─────────────────               ───────────               ────────
         │                              │                         │
         │ POST /api/admin/            │                         │
         │   tier-override              │                         │
         │ {                            │                         │
         │   tierOverride: "pro",       │                         │
         │   reason: "Testing #1234"    │                         │
         │ }                            │                         │
         ├──────────────────────────────>                         │
         │                              │                         │
         │                        ┌─────▼─────┐                  │
         │                        │ Verify:   │                  │
         │                        │ - Role OK │                  │
         │                        │ - Tier OK │                  │
         │                        └─────┬─────┘                  │
         │                              │                         │
         │                              │ INSERT audit_log        │
         │                              ├────────────────────────>│
         │                              │                         │
         │                              │ Generate new JWT        │
         │                        ┌─────▼─────┐                  │
         │                        │ JWT:      │                  │
         │                        │  tier: free│                 │
         │                        │  tierOver-│                  │
         │                        │   ride: pro│                 │
         │                        │  expiry: +4h│                │
         │                        └─────┬─────┘                  │
         │ Response:                    │                         │
         │ { token, expiry }            │                         │
         │<─────────────────────────────┤                         │
         │                              │                         │
    ┌────▼────┐                         │                         │
    │ Store   │                         │                         │
    │ new JWT │                         │                         │
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
         │                        │ Extract:  │                  │
         │                        │  tier: free│                 │
         │                        │  override:│                  │
         │                        │    pro    │                  │
         │                        └─────┬─────┘                  │
         │                              │                         │
         │                              │ getEffectiveTier()      │
         │                              ├────────────────────────>│
         │                              │                         │
         │                              │        ┌────────────────▼───┐
         │                              │        │ Check expiry:      │
         │                              │        │  if expired:       │
         │                              │        │    return tier     │
         │                              │        │  else:             │
         │                              │        │    return override │
         │                              │        └────────────────┬───┘
         │                              │                         │
         │                              │<────────────────────────┤
         │                              │  effectiveTier: "pro"   │
         │                              │                         │
         │                              │ hasFeature(pro,         │
         │                              │   "batchProcessing")    │
         │                              ├────────────────────────>│
         │                              │<────────────────────────┤
         │                              │  true                   │
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
         │                              │ INSERT audit_log        │
         │                              │ (cleared override)      │
         │                              ├────────────────────────>│
         │                              │                         │
         │                              │ Generate JWT            │
         │                              │ (no override)           │
         │                              │                         │
         │ Response: { token }          │                         │
         │<─────────────────────────────┤                         │
         │                              │                         │
```

### Data Flow

**1. Override Application:**
```
Admin clicks "Override to Pro"
  → POST /api/admin/tier-override
    → Verify role (admin/support/super_admin)
      → Log to user_audit_log table
        → Generate new JWT with tierOverride + expiry
          → Return new token to frontend
            → Frontend stores token
              → Visual banner appears
```

**2. Feature Access Check:**
```
User requests Pro feature (e.g., multi-file upload)
  → Backend extracts JWT
    → getEffectiveTier(user)
      → Check if override exists and not expired
        → Use override tier OR real tier
          → hasFeature(effectiveTier, feature)
            → Allow or deny access
```

**3. Override Expiry:**
```
Override is 4 hours old
  → getEffectiveTier() checks expiry timestamp
    → If expired: return real tier
      → Feature access reverts to actual tier
        → Visual banner auto-hides
```

---

## Implementation Details

### Backend

#### 1. JWT Schema Extension

```javascript
// Current JWT payload
{
  id: 123,
  email: "user@example.com",
  tier: "free",
  role: "user"
}

// NEW: JWT with override
{
  id: 123,
  email: "support@codescribe.com",
  tier: "free",                  // Real tier (unchanged)
  role: "support",               // User role
  tierOverride: "pro",           // Override tier
  overrideExpiry: "2025-11-17T19:00:00Z", // 4 hours from now
  overrideReason: "Testing multi-file bug #1234",
  overrideAppliedAt: "2025-11-17T15:00:00Z"
}
```

#### 2. Helper Functions

```javascript
// server/src/utils/tierOverride.js

/**
 * Get effective tier (considering override if present and valid)
 */
export const getEffectiveTier = (user) => {
  // Only admin/support/super_admin can have overrides
  if (!['admin', 'support', 'super_admin'].includes(user.role)) {
    return user.tier;
  }

  // Check if override exists
  if (!user.tierOverride || !user.overrideExpiry) {
    return user.tier;
  }

  // Check if override has expired
  const now = new Date();
  const expiry = new Date(user.overrideExpiry);
  if (now > expiry) {
    console.log(`[TierOverride] Override expired for user ${user.id}`);
    return user.tier; // Expired, use real tier
  }

  console.log(`[TierOverride] Using override tier "${user.tierOverride}" for user ${user.id}`);
  return user.tierOverride;
};

/**
 * Check if user has feature (considering override)
 */
export const hasFeatureWithOverride = (user, feature) => {
  const effectiveTier = getEffectiveTier(user);
  return hasFeature(effectiveTier, feature);
};

/**
 * Validate override request
 */
export const validateOverrideRequest = (user, targetTier, reason) => {
  // Role check
  if (!['admin', 'support', 'super_admin'].includes(user.role)) {
    throw new Error('Only admin/support roles can apply tier overrides');
  }

  // Tier check
  const validTiers = ['free', 'starter', 'pro', 'team', 'enterprise'];
  if (!validTiers.includes(targetTier)) {
    throw new Error(`Invalid tier: ${targetTier}`);
  }

  // Reason required
  if (!reason || reason.trim().length < 10) {
    throw new Error('Override reason must be at least 10 characters');
  }

  return true;
};
```

#### 3. Middleware Enhancement

```javascript
// server/src/middleware/auth.js

// BEFORE
export const requireAuth = (req, res, next) => {
  const user = req.user; // From JWT
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// AFTER (no changes needed - JWT already has override data)
// getEffectiveTier() is called in feature checks, not middleware
```

#### 4. Database Audit Log

Uses existing `user_audit_log` table from migration 015:

```sql
-- Override applied
INSERT INTO user_audit_log (
  user_id,
  user_email,
  changed_by_id,  -- Self-applied (same user)
  field_name,
  old_value,
  new_value,
  change_type,
  reason,
  metadata
) VALUES (
  123,
  'support@codescribe.com',
  123,
  'tier_override',
  NULL,
  'pro',
  'update',
  'Testing multi-file bug #1234',
  jsonb_build_object(
    'override_expiry', '2025-11-17T19:00:00Z',
    'ip_address', req.ip,
    'user_agent', req.headers['user-agent']
  )
);

-- Override cleared
INSERT INTO user_audit_log (
  user_id,
  user_email,
  changed_by_id,
  field_name,
  old_value,
  new_value,
  change_type,
  reason,
  metadata
) VALUES (
  123,
  'support@codescribe.com',
  123,
  'tier_override',
  'pro',
  NULL,
  'update',
  'Override cleared by user',
  jsonb_build_object(
    'cleared_at', NOW(),
    'ip_address', req.ip
  )
);
```

### Frontend

#### 1. Helper Functions

```javascript
// client/src/utils/tierOverride.js

/**
 * Get effective tier from user object
 */
export const getEffectiveTier = (user) => {
  if (!user) return 'free';

  // Only admin/support/super_admin can have overrides
  if (!['admin', 'support', 'super_admin'].includes(user.role)) {
    return user.tier || 'free';
  }

  // Check if override exists and is not expired
  if (user.tierOverride && user.overrideExpiry) {
    const now = Date.now();
    const expiry = new Date(user.overrideExpiry).getTime();
    if (now < expiry) {
      return user.tierOverride;
    }
  }

  return user.tier || 'free';
};

/**
 * Check if user has feature (considering override)
 */
export const hasFeatureWithOverride = (user, feature) => {
  const effectiveTier = getEffectiveTier(user);
  return hasFeature(effectiveTier, feature);
};

/**
 * Check if override is active
 */
export const hasActiveOverride = (user) => {
  if (!user || !user.tierOverride) return false;

  const now = Date.now();
  const expiry = new Date(user.overrideExpiry).getTime();
  return now < expiry;
};

/**
 * Get time remaining for override
 */
export const getOverrideTimeRemaining = (user) => {
  if (!hasActiveOverride(user)) return null;

  const now = Date.now();
  const expiry = new Date(user.overrideExpiry).getTime();
  const remaining = expiry - now;

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, total: remaining };
};
```

#### 2. Context Enhancement

```javascript
// client/src/contexts/AuthContext.jsx

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // ... existing auth logic ...

  // NEW: Apply tier override
  const applyTierOverride = async (targetTier, reason) => {
    const response = await api.post('/admin/tier-override', {
      tierOverride: targetTier,
      reason
    });

    // Update user with new token
    const newToken = response.data.token;
    localStorage.setItem('token', newToken);

    // Refresh user data (includes override in JWT)
    await refreshUser();

    return response.data;
  };

  // NEW: Clear tier override
  const clearTierOverride = async () => {
    const response = await api.post('/admin/tier-override/clear');

    // Update user with new token
    const newToken = response.data.token;
    localStorage.setItem('token', newToken);

    // Refresh user data (override removed from JWT)
    await refreshUser();

    return response.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      // ... existing methods ...
      applyTierOverride,
      clearTierOverride,
    }}>
      {children}
    </AuthContext.Provider>
  );
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
- Override stored only in JWT (never in `users.tier` column)
- Billing queries use `users.tier` directly (ignore JWT override)
- Stripe webhooks update `users.tier` (unaffected by overrides)

**Result**: Billing completely isolated from override system.

### 3. Audit Trail

**Threat**: Unauthorized override goes undetected.

**Mitigation**:
- Every override logged to `user_audit_log`
- Includes: who, when, why, which tier, IP address
- Immutable audit log (append-only)

**Result**: Complete forensic trail for security audits.

### 4. Time-Limited Overrides

**Threat**: Forgotten override gives permanent free access.

**Mitigation**:
- 4-hour expiry hardcoded in backend
- `getEffectiveTier()` checks expiry on every request
- Expired overrides automatically ignored

**Result**: Maximum 4-hour window, then reverts to real tier.

### 5. Visual Indicator

**Threat**: User forgets override is active, makes incorrect support decisions.

**Mitigation**:
- Prominent banner at top of screen
- Shows tier, expiry time, reason
- Cannot be dismissed (only cleared via API)

**Result**: Always aware when testing with override.

---

## Audit Trail

### Events Logged

All override events are logged to `user_audit_log` table:

| Event | Field Name | Old Value | New Value | Reason |
|-------|-----------|-----------|-----------|--------|
| Override Applied | `tier_override` | `NULL` | `pro` | "Testing multi-file bug #1234" |
| Override Cleared | `tier_override` | `pro` | `NULL` | "Testing complete" |
| Override Expired | `tier_override` | `pro` | `NULL` | "Auto-expired after 4 hours" |

### Audit Log Query Examples

```sql
-- Get all overrides applied today
SELECT
  user_email,
  new_value as override_tier,
  reason,
  metadata->>'override_expiry' as expires_at,
  changed_at
FROM user_audit_log
WHERE field_name = 'tier_override'
  AND change_type = 'update'
  AND new_value IS NOT NULL
  AND DATE(changed_at) = CURRENT_DATE
ORDER BY changed_at DESC;

-- Get override history for specific user
SELECT
  field_name,
  old_value,
  new_value,
  reason,
  changed_at,
  metadata
FROM user_audit_log
WHERE user_id = 123
  AND field_name = 'tier_override'
ORDER BY changed_at DESC;

-- Count overrides by user (detect abuse)
SELECT
  user_email,
  COUNT(*) as override_count,
  MIN(changed_at) as first_override,
  MAX(changed_at) as last_override
FROM user_audit_log
WHERE field_name = 'tier_override'
  AND new_value IS NOT NULL
  AND changed_at > NOW() - INTERVAL '30 days'
GROUP BY user_email
ORDER BY override_count DESC;
```

---

## UI Components

### 1. TierOverrideBanner (Header)

**Purpose**: Shows when override is active, prevents confusion.

**Location**: `client/src/components/TierOverrideBanner.jsx`

**Design**:
```jsx
// Shows at top of page when override active
<div className="bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <AlertTriangle className="w-5 h-5" />
    <span className="font-medium">
      TIER OVERRIDE ACTIVE: Testing as "{user.tierOverride}" tier
    </span>
    <span className="text-amber-100">
      Expires in {timeRemaining}
    </span>
  </div>
  <div className="flex items-center gap-3">
    <span className="text-sm text-amber-100">
      Reason: {user.overrideReason}
    </span>
    <button
      onClick={clearOverride}
      className="text-white hover:text-amber-100 underline text-sm"
    >
      Clear Override
    </button>
  </div>
</div>
```

**Accessibility**:
- `role="alert"` for screen reader announcement
- High contrast colors (WCAG AA)
- Keyboard accessible clear button

### 2. TierOverridePanel (Admin Dashboard)

**Purpose**: Apply/clear tier overrides.

**Location**: `client/src/components/Admin/TierOverridePanel.jsx`

**Design**:
```jsx
<div className="bg-white dark:bg-slate-800 rounded-lg p-6 border">
  <h3 className="text-lg font-semibold mb-4">
    Tier Override (Testing Only)
  </h3>

  {/* Current Status */}
  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded">
    <div className="text-sm text-slate-600 dark:text-slate-400">
      Current Tier: <strong>{user.tier}</strong>
    </div>
    {hasActiveOverride(user) && (
      <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
        Override Active: <strong>{user.tierOverride}</strong>
        (Expires in {timeRemaining})
      </div>
    )}
  </div>

  {/* Override Form */}
  <form onSubmit={handleApplyOverride}>
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Override Tier
      </label>
      <select
        value={selectedTier}
        onChange={(e) => setSelectedTier(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      >
        <option value="">-- Select Tier --</option>
        <option value="free">Free</option>
        <option value="starter">Starter</option>
        <option value="pro">Pro</option>
        <option value="team">Team</option>
        <option value="enterprise">Enterprise</option>
      </select>
    </div>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Reason (required, min 10 chars)
      </label>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g., Testing multi-file bug #1234"
        className="w-full px-3 py-2 border rounded"
        minLength={10}
        required
      />
    </div>

    <div className="flex gap-3">
      <button
        type="submit"
        disabled={!selectedTier || reason.length < 10}
        className="btn-primary"
      >
        Apply Override (4 hours)
      </button>

      {hasActiveOverride(user) && (
        <button
          type="button"
          onClick={handleClearOverride}
          className="btn-secondary"
        >
          Clear Override
        </button>
      )}
    </div>
  </form>

  {/* Warning */}
  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
    ⚠️ Override expires after 4 hours. Does not affect billing or subscription status.
  </div>
</div>
```

---

## API Endpoints

### POST /api/admin/tier-override

Apply a tier override.

**Authentication**: Required (admin/support/super_admin only)

**Request**:
```json
{
  "tierOverride": "pro",
  "reason": "Testing multi-file bug #1234"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiry": "2025-11-17T19:00:00Z",
  "effectiveTier": "pro",
  "message": "Tier override applied successfully"
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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "effectiveTier": "free",
  "message": "Tier override cleared successfully"
}
```

**Errors**:
- `403`: Insufficient permissions
- `404`: No active override to clear
- `500`: Server error

### GET /api/admin/tier-override/audit

Get audit log of tier overrides (admin only).

**Authentication**: Required (admin/super_admin only)

**Query Parameters**:
- `userId` (optional): Filter by user ID
- `limit` (optional, default 50): Number of records
- `offset` (optional, default 0): Pagination offset

**Response**:
```json
{
  "overrides": [
    {
      "userId": 123,
      "userEmail": "support@codescribe.com",
      "override": "pro",
      "reason": "Testing multi-file bug #1234",
      "appliedAt": "2025-11-17T15:00:00Z",
      "expiry": "2025-11-17T19:00:00Z",
      "clearedAt": null,
      "ipAddress": "192.168.1.1"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

---

## Testing Strategy

### Unit Tests

**Backend** (`server/src/utils/__tests__/tierOverride.test.js`):
```javascript
describe('getEffectiveTier', () => {
  it('should return real tier if no override', () => {
    const user = { tier: 'free', role: 'support' };
    expect(getEffectiveTier(user)).toBe('free');
  });

  it('should return override if valid and not expired', () => {
    const user = {
      tier: 'free',
      role: 'support',
      tierOverride: 'pro',
      overrideExpiry: new Date(Date.now() + 3600000).toISOString()
    };
    expect(getEffectiveTier(user)).toBe('pro');
  });

  it('should return real tier if override expired', () => {
    const user = {
      tier: 'free',
      role: 'support',
      tierOverride: 'pro',
      overrideExpiry: new Date(Date.now() - 1000).toISOString()
    };
    expect(getEffectiveTier(user)).toBe('free');
  });

  it('should ignore override for non-admin users', () => {
    const user = {
      tier: 'free',
      role: 'user',
      tierOverride: 'pro',
      overrideExpiry: new Date(Date.now() + 3600000).toISOString()
    };
    expect(getEffectiveTier(user)).toBe('free');
  });
});
```

**Frontend** (`client/src/utils/__tests__/tierOverride.test.js`):
```javascript
describe('hasActiveOverride', () => {
  it('should return true if override not expired', () => {
    const user = {
      tierOverride: 'pro',
      overrideExpiry: new Date(Date.now() + 3600000).toISOString()
    };
    expect(hasActiveOverride(user)).toBe(true);
  });

  it('should return false if expired', () => {
    const user = {
      tierOverride: 'pro',
      overrideExpiry: new Date(Date.now() - 1000).toISOString()
    };
    expect(hasActiveOverride(user)).toBe(false);
  });
});
```

### Integration Tests

**API Tests** (`server/src/routes/__tests__/admin.tierOverride.test.js`):
```javascript
describe('POST /api/admin/tier-override', () => {
  it('should apply override for admin user', async () => {
    const response = await request(app)
      .post('/api/admin/tier-override')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tierOverride: 'pro',
        reason: 'Testing multi-file feature'
      });

    expect(response.status).toBe(200);
    expect(response.body.effectiveTier).toBe('pro');
    expect(response.body.token).toBeDefined();
  });

  it('should reject override for non-admin user', async () => {
    const response = await request(app)
      .post('/api/admin/tier-override')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        tierOverride: 'pro',
        reason: 'Testing'
      });

    expect(response.status).toBe(403);
  });

  it('should log override to audit table', async () => {
    await request(app)
      .post('/api/admin/tier-override')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tierOverride: 'pro',
        reason: 'Testing multi-file feature'
      });

    const auditLog = await sql`
      SELECT * FROM user_audit_log
      WHERE user_id = ${adminUser.id}
        AND field_name = 'tier_override'
      ORDER BY changed_at DESC
      LIMIT 1
    `;

    expect(auditLog.rows[0].new_value).toBe('pro');
    expect(auditLog.rows[0].reason).toBe('Testing multi-file feature');
  });
});
```

### Manual Testing Checklist

**Functional Tests:**
- [ ] Admin can apply override
- [ ] Support can apply override
- [ ] Regular user cannot apply override
- [ ] Override expires after 4 hours
- [ ] Override can be cleared manually
- [ ] Banner shows when override active
- [ ] Banner hides when override cleared/expired
- [ ] Feature access changes based on override
- [ ] Billing queries ignore override

**Security Tests:**
- [ ] Non-admin gets 403 when applying override
- [ ] Invalid tier rejected
- [ ] Reason < 10 chars rejected
- [ ] Expired override ignored by getEffectiveTier()
- [ ] Override does not affect `users.tier` in database
- [ ] Audit log captures all override events

**UX Tests:**
- [ ] Banner is visible and clear
- [ ] Time remaining updates correctly
- [ ] Clear button works
- [ ] Admin panel shows current override status
- [ ] Form validation shows helpful errors

---

## Rollout Plan

### Phase 1: Backend Foundation (Week 1)

**Tasks:**
1. Create `tierOverride.js` utility functions
2. Add `/api/admin/tier-override` endpoints
3. Extend JWT payload to include override fields
4. Add audit logging for overrides
5. Write backend unit tests
6. Write API integration tests

**Success Criteria:**
- All tests passing
- API endpoints functional
- Audit logs working

### Phase 2: Frontend Integration (Week 1)

**Tasks:**
1. Create `TierOverrideBanner.jsx` component
2. Create `TierOverridePanel.jsx` component
3. Add `applyTierOverride` / `clearTierOverride` to AuthContext
4. Create frontend utility functions
5. Write component tests
6. Update App.jsx to show banner when override active

**Success Criteria:**
- Banner shows/hides correctly
- Admin panel functional
- Override persists across page refreshes

### Phase 3: Multi-File Integration (Week 1-2)

**Tasks:**
1. Use `getEffectiveTier()` for multi-file feature gating
2. Show upgrade prompt for Free/Starter users
3. Test multi-file with each tier override
4. Document multi-file + tier override behavior

**Success Criteria:**
- Multi-file only available to Pro+ (or override)
- Free/Starter see upgrade prompt
- Override allows testing multi-file

### Phase 4: Documentation & Training (Week 2)

**Tasks:**
1. Document tier override in admin guide
2. Create training video for support team
3. Add override instructions to onboarding
4. Create audit log query examples

**Success Criteria:**
- Support team trained
- Documentation complete
- Audit queries documented

---

## Future Enhancements

### Phase 5: Advanced Features (Future)

**Potential additions:**
1. **Override History Dashboard**: UI to view past overrides
2. **Override Templates**: Save common testing scenarios
3. **Scheduled Expiry**: Custom expiry times (1hr, 8hr, 24hr)
4. **Feature-Specific Overrides**: Override individual features, not entire tier
5. **Team Overrides**: Admin can apply override to other users (for testing)
6. **Slack Notifications**: Alert team when overrides applied/cleared

---

## Appendix

### Related Documents

- [TIER-CONFIG.md](../server/src/config/tiers.js) - Tier feature configuration
- [MULTI-FILE-IMPLEMENTATION-PLAN-V2.md](./MULTI-FILE-IMPLEMENTATION-PLAN-V2.md) - Multi-file feature spec
- [AUTHENTICATION.md](../authentication/AUTHENTICATION.md) - JWT and auth system

### Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-17 | Claude Code | Initial design document |

---

**End of Document**
