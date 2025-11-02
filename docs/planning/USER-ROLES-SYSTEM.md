# User Roles System - Planning Document

**Status:** Planning
**Target Version:** v2.5.1
**Priority:** Medium
**Created:** November 2, 2025

---

## Overview

Implement a flexible role-based system to manage user permissions and features, starting with unlimited usage for admin/support accounts.

## Goals

1. Enable superadmin accounts with unlimited app usage (dev + prod)
2. Support future role-based features (admin panels, feature flags, etc.)
3. Maintain extensibility for additional roles/permissions
4. Clean separation from tier system (roles ≠ tiers)

---

## Database Design

### New Table: `user_roles`

```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INTEGER REFERENCES users(id),
  notes TEXT,
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

**Design Rationale:**
- Separate table allows multiple roles per user (future extensibility)
- Tracks who granted the role and when (audit trail)
- Notes field for context (e.g., "Support access for customer issue #123")
- ON DELETE CASCADE ensures cleanup when user deleted

### Initial Roles

| Role | Description | Usage Limit | Future Permissions |
|------|-------------|-------------|-------------------|
| `superadmin` | Full system access | Unlimited | User management, system settings, analytics |
| `admin` | Admin access | Unlimited | User support, basic analytics |
| `developer` | Development/testing | Unlimited (dev only) | Feature flags, debug mode |

**Note:** Regular users have no roles (empty set = standard user)

---

## Implementation Plan

### Phase 1: Core Infrastructure (v2.5.1)

**1. Database Migration (006)**
```sql
-- server/src/db/migrations/006_create_user_roles.sql
-- Creates user_roles table
-- Adds initial superadmin role for specified user
```

**2. UserRole Model**
```javascript
// server/src/models/UserRole.js
class UserRole {
  static async getRoles(userId)
  static async hasRole(userId, role)
  static async grantRole(userId, role, grantedBy, notes)
  static async revokeRole(userId, role)
}
```

**3. Update User Model**
```javascript
// server/src/models/User.js
async getRoles()
async hasRole(roleName)
async isSuperadmin()
async isAdmin()
async hasUnlimitedUsage()
```

**4. Update Usage Service**
```javascript
// server/src/services/usageService.js
async checkUsageLimit(userId) {
  const user = await User.findById(userId);

  // Check for unlimited usage roles
  if (await user.hasUnlimitedUsage()) {
    return {
      allowed: true,
      unlimited: true,
      reason: 'Unlimited usage role'
    };
  }

  // Continue with tier-based limits...
}
```

**5. Utility Script**
```javascript
// server/src/scripts/grant-superadmin.js
// CLI tool to promote users to superadmin
// Usage: node server/src/scripts/grant-superadmin.js email@example.com
```

### Phase 2: Admin Features (Future)

**Admin Panel UI** (v2.6.0+)
- View all users
- Grant/revoke roles
- View role history
- Only accessible to superadmins

**Role-Based Feature Flags** (v2.7.0+)
- Beta features for developers
- Early access for admins
- Experimentation framework

**Audit Logging** (v2.8.0+)
- Track all role changes
- Log superadmin actions
- Compliance reporting

---

## API Design

### Internal APIs (Backend Only)

```javascript
// No new routes initially - internal use only
// Future: POST /api/admin/users/:id/roles
// Future: DELETE /api/admin/users/:id/roles/:role
// Future: GET /api/admin/users (with role filtering)
```

### Example Usage

```javascript
// In any backend route/service
const user = await User.findById(userId);

if (await user.isSuperadmin()) {
  // Grant special privileges
}

if (await user.hasRole('developer')) {
  // Enable debug features
}
```

---

## Migration Strategy

### Development Environment
1. Run migration: `npm run migrate` (from server/)
2. Run script to grant superadmin: `node src/scripts/grant-superadmin.js your-email@example.com`
3. Verify: Check user_roles table

### Production Environment
1. Migration runs automatically on deploy (via Vercel)
2. Manually run grant script in production database connection
3. Alternative: Add superadmin grant in migration itself (one-time, hardcoded email)

---

## Testing Requirements

### Unit Tests
- [ ] UserRole model CRUD operations
- [ ] User model role checking methods
- [ ] Usage service unlimited bypass

### Integration Tests
- [ ] Superadmin can generate unlimited docs
- [ ] Regular users still hit tier limits
- [ ] Role granting/revoking works correctly

### Database Tests
- [ ] Migration creates table correctly
- [ ] Unique constraint prevents duplicate roles
- [ ] Cascade delete removes roles with user

---

## Security Considerations

1. **No Client Exposure (Phase 1)**
   - Roles stored server-side only
   - No role data sent to frontend
   - Prevents role manipulation attempts

2. **Audit Trail**
   - Track who granted each role
   - Timestamp all role changes
   - Notes field for justification

3. **Minimal Attack Surface**
   - No public APIs initially
   - Only database-level access
   - Future admin APIs require superadmin auth

4. **Separation of Concerns**
   - Roles ≠ Tiers (billing)
   - Roles = Permissions/Features
   - Tiers = Subscription levels

---

## Alternative Approaches Considered

### Option A: Direct Column on Users Table
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
```

**Pros:** Simpler, faster queries
**Cons:** Only one role per user, harder to extend, no audit trail
**Decision:** Rejected - Not extensible enough

### Option B: Environment Variable Override
```bash
VITE_DEV_UNLIMITED=true
```

**Pros:** Quick to implement
**Cons:** Doesn't work in prod, not scalable, no user-level control
**Decision:** Rejected - Too limited

### Option C: Separate Permissions Table (Full RBAC)
```sql
user_roles (many-to-many)
roles (id, name, description)
permissions (id, name, resource, action)
role_permissions (many-to-many)
```

**Pros:** Industry-standard RBAC, maximum flexibility
**Cons:** Overkill for current needs, complex to implement
**Decision:** Deferred - Start simple, migrate later if needed

---

## Success Criteria

**Phase 1 (v2.5.1):**
- [ ] Superadmin role exists and works
- [ ] Superadmins have unlimited usage in dev and prod
- [ ] Regular users unaffected (no regressions)
- [ ] Migration tested in Docker sandbox
- [ ] Script to grant superadmin works
- [ ] All tests pass

**Future Phases:**
- [ ] Admin panel UI for role management
- [ ] Role-based feature flags
- [ ] Audit logging system

---

## Effort Estimate

**Phase 1 Implementation:** 2-3 hours
- Migration: 30 min
- Models: 45 min
- Usage service update: 30 min
- Script: 15 min
- Tests: 45 min
- Documentation: 15 min

**Total:** ~3 hours for complete unlimited usage support

---

## Related Documents

- [DB-NAMING-STANDARDS.md](../database/DB-NAMING-STANDARDS.md) - Database naming conventions
- [DB-MIGRATION-MANAGEMENT.MD](../database/DB-MIGRATION-MANAGEMENT.MD) - Migration workflow
- [USAGE-QUOTA-SYSTEM.md](../database/USAGE-QUOTA-SYSTEM.md) - Current usage tracking

---

## Notes

- Keep it simple for Phase 1 - just enough to solve the unlimited usage problem
- Build foundation for future admin features without over-engineering
- Maintain clear separation between roles (permissions) and tiers (billing)
- Document everything for future team members

---

**Next Steps:**
1. Review and approve this plan
2. Prioritize in roadmap (v2.5.1 or later)
3. Implement when ready
4. Test thoroughly in Docker sandbox before production
