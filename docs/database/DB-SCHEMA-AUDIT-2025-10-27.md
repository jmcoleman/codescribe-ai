# Database Schema Naming Standards Audit

**Date:** October 27, 2025
**Database:** Neon Postgres (Development)
**Standards Reference:** [DB-NAMING-STANDARDS.md](./DB-NAMING-STANDARDS.md)
**Status:** ⚠️ **Issues Found** - 4 non-compliant items requiring fixes

---

## Executive Summary

**Overall Compliance:** 92% (46/50 database objects compliant)

| Category | Total | Compliant | Issues | Compliance Rate |
|----------|-------|-----------|--------|----------------|
| Tables | 5 | 5 | 0 | 100% ✅ |
| Columns | 29 | 29 | 0 | 100% ✅ |
| Indexes | 13 | 9 | 4 | 69% ⚠️ |
| Constraints | 3 | 3 | 0 | 100% ✅ |

**Issues to Fix:**
1. ❌ `usage_analytics` table has 2 indexes missing table name prefix
2. ❌ `session` table has duplicate indexes (one non-compliant naming)

---

## Detailed Audit Results

### ✅ Tables (5/5 Compliant)

All tables follow the **plural, snake_case** convention:

| Table Name | Status | Notes |
|------------|--------|-------|
| `users` | ✅ | Plural, snake_case |
| `user_quotas` | ✅ | Plural, snake_case, descriptive |
| `usage_analytics` | ✅ | Plural, snake_case, descriptive |
| `session` | ✅ | Singular (acceptable for session stores) |
| `schema_migrations` | ✅ | Plural, snake_case, system table |

**Verdict:** All table names comply with standards.

---

### ✅ Columns (29/29 Compliant)

All columns follow **singular, snake_case** with appropriate suffixes:

#### Users Table (11 columns)
```
✅ id                          - PRIMARY KEY
✅ email                       - VARCHAR, snake_case
✅ password_hash               - Security field, _hash suffix
✅ github_id                   - OAuth identifier, _id suffix
✅ tier                        - Enum-like field
✅ email_verified              - Boolean without is_ prefix (acceptable)
✅ verification_token          - Token field
✅ verification_token_expires  - Timestamp, _expires suffix
✅ reset_token_hash            - Security field, _hash suffix
✅ reset_token_expires         - Timestamp, _expires suffix
✅ created_at                  - Standard timestamp, _at suffix
✅ updated_at                  - Standard timestamp, _at suffix
```

#### User Quotas Table (8 columns)
```
✅ id                    - PRIMARY KEY
✅ user_id               - Foreign key, _id suffix
✅ daily_count           - Numeric, _count suffix
✅ monthly_count         - Numeric, _count suffix
✅ last_reset_date       - Timestamp, _date suffix
✅ period_start_date     - Date field, _date suffix
✅ created_at            - Standard timestamp
✅ updated_at            - Standard timestamp
```

#### Usage Analytics Table (6 columns)
```
✅ id               - PRIMARY KEY
✅ user_id          - Foreign key, _id suffix
✅ operation_type   - Varchar, _type suffix
✅ file_size        - Integer, _size suffix
✅ tokens_used      - Integer, _used suffix
✅ created_at       - Standard timestamp
```

#### Session Table (3 columns)
```
✅ sid     - Session ID (standard for connect-pg-simple)
✅ sess    - Session data (standard for connect-pg-simple)
✅ expire  - Expiration timestamp (standard for connect-pg-simple)
```

**Verdict:** All column names comply with standards.

---

### ⚠️ Indexes (9/13 Compliant)

**Standard:** `idx_<table>_<column(s)>`

#### ✅ Compliant Indexes (9)

| Index Name | Table | Status |
|------------|-------|--------|
| `idx_users_email` | users | ✅ Correct pattern |
| `idx_users_github_id` | users | ✅ Correct pattern |
| `idx_users_reset_token` | users | ✅ Correct pattern |
| `idx_users_verification_token` | users | ✅ Correct pattern |
| `idx_user_quotas_user_period` | user_quotas | ✅ Correct pattern (multi-column) |
| `idx_user_quotas_last_reset` | user_quotas | ✅ Correct pattern |
| `idx_schema_migrations_version` | schema_migrations | ✅ Correct pattern |
| `idx_session_expire` | session | ✅ Correct pattern |
| `unique_user_period` | user_quotas | ✅ UNIQUE constraint (acceptable naming) |

#### ❌ Non-Compliant Indexes (4)

| Index Name | Table | Issue | Should Be |
|------------|-------|-------|-----------|
| `idx_usage_user_id` | usage_analytics | Missing full table name | `idx_usage_analytics_user_id` |
| `idx_usage_created_at` | usage_analytics | Missing full table name | `idx_usage_analytics_created_at` |
| `IDX_session_expire` | session | **DUPLICATE** + PascalCase | Delete (duplicate of `idx_session_expire`) |
| `idx_usage_analytics_operation` | usage_analytics | Missing (not created yet) | Should exist for `operation_type` column |

**Note:** The `session` table has TWO indexes on the `expire` column:
- `IDX_session_expire` (PascalCase, non-compliant)
- `idx_session_expire` (snake_case, compliant)

This is a duplicate that should be removed.

---

### ✅ Constraints (3/3 Compliant)

#### Unique Constraints
```
✅ unique_user_period               - user_quotas (descriptive)
✅ users_email_key                  - users (auto-generated, acceptable)
✅ users_github_id_key              - users (auto-generated, acceptable)
✅ schema_migrations_version_key    - schema_migrations (auto-generated)
```

#### Foreign Keys
```
✅ user_quotas_user_id_fkey   - user_quotas → users (auto-generated, acceptable)
✅ usage_analytics_user_id_fkey - usage_analytics → users (auto-generated, acceptable)
```

**Verdict:** All constraints follow acceptable naming patterns.

---

## 🔧 Recommended Fixes

### Priority 1: Fix Non-Compliant Indexes

#### Fix 1: Rename usage_analytics Indexes

```sql
-- Rename to include full table name
ALTER INDEX idx_usage_user_id RENAME TO idx_usage_analytics_user_id;
ALTER INDEX idx_usage_created_at RENAME TO idx_usage_analytics_created_at;
```

#### Fix 2: Remove Duplicate Session Index

```sql
-- Remove the PascalCase duplicate (keep the snake_case one)
DROP INDEX "IDX_session_expire";
```

#### Fix 3: Add Missing Index (Optional but Recommended)

```sql
-- Add index for operation_type column (frequently queried)
CREATE INDEX idx_usage_analytics_operation ON usage_analytics(operation_type);
```

### Priority 2: Create Migration for Fixes

**Recommended Approach:**
1. Create migration `004-fix-index-naming.sql`
2. Apply fixes to development database
3. Update checksums in `schema_migrations`
4. Deploy to production when ready

---

## 📊 Compliance Summary by Migration

| Migration | Tables | Indexes | Constraints | Compliance |
|-----------|--------|---------|-------------|------------|
| `000-create-migration-table.sql` | ✅ | ✅ | ✅ | 100% |
| `001-create-users-table.sql` | ✅ | ✅ | ✅ | 100% |
| `002-add-reset-token-fields.sql` | N/A | ✅ | N/A | 100% |
| `003-create-user-quotas-table.sql` | ✅ | ✅ | ✅ | 100% |
| **Existing schema (pre-migrations)** | ⚠️ | ❌ | ✅ | **69%** |

**Root Cause:** The `usage_analytics` and `session` tables were created in `server/src/db/connection.js` before the migration system was established, so they don't follow the newer naming standards.

---

## 🎯 Next Steps

1. **Immediate:**
   - [ ] Create migration `004-fix-index-naming.sql` with the three index fixes
   - [ ] Test migration locally
   - [ ] Apply to development database

2. **Short-term:**
   - [ ] Document the fixes in migration file
   - [ ] Update any code that references the old index names (unlikely, but check)
   - [ ] Run `npm run migrate:validate` to ensure checksums are correct

3. **Long-term:**
   - [ ] Establish pre-commit hook to validate database naming standards
   - [ ] Consider adding database linting to CI/CD pipeline
   - [ ] Update `server/src/db/connection.js` to remove manual table creation (rely on migrations only)

---

## 📝 Lessons Learned

1. **Manual table creation bypasses standards** - The `usage_analytics` table was created in `connection.js` instead of via migration, leading to non-compliant naming.

2. **Duplicate indexes waste resources** - The `session` table has duplicate indexes on `expire` column.

3. **Missing indexes on query columns** - The `operation_type` column in `usage_analytics` is likely queried frequently but has no index.

4. **Migration system enforces consistency** - All tables created via migrations (001-003) are 100% compliant.

---

## ✅ Compliance Checklist

Use this checklist before creating new database objects:

- [ ] Table names are plural and snake_case
- [ ] Column names are singular and snake_case with appropriate suffixes
- [ ] Indexes follow `idx_<table>_<column>` pattern (full table name)
- [ ] Foreign keys have explicit `ON DELETE` behavior
- [ ] Constraints have descriptive names
- [ ] Migration file includes verification queries
- [ ] Migration tested with `npm run migrate`
- [ ] Migration validated with `npm run migrate:validate`

---

**Audit Performed By:** Claude (AI Assistant)
**Review Status:** Pending human review
**Next Review Date:** When schema changes are made

---

## Appendix: Full Schema Listing

### Tables
```sql
users (11 columns)
user_quotas (8 columns)
usage_analytics (6 columns)
session (3 columns)
schema_migrations (6 columns)
```

### Indexes (13 total)
```sql
-- Compliant (9)
idx_users_email
idx_users_github_id
idx_users_reset_token
idx_users_verification_token
idx_user_quotas_user_period
idx_user_quotas_last_reset
idx_schema_migrations_version
idx_session_expire
unique_user_period

-- Non-compliant (4)
idx_usage_user_id                ❌ → idx_usage_analytics_user_id
idx_usage_created_at             ❌ → idx_usage_analytics_created_at
IDX_session_expire               ❌ → DELETE (duplicate)
(missing)                        ❌ → idx_usage_analytics_operation (recommended)
```

### Foreign Keys (2)
```sql
user_quotas_user_id_fkey: user_quotas(user_id) → users(id) ON DELETE CASCADE
usage_analytics_user_id_fkey: usage_analytics(user_id) → users(id) ON DELETE CASCADE
```

---

**End of Audit Report**
