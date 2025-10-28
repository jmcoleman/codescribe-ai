# Database Naming Standards & Conventions

**Status:** ✅ **ACTIVE** - Official naming conventions for CodeScribe AI
**Created:** October 27, 2025
**Version:** 1.0
**Purpose:** Establish consistent, industry-standard naming conventions for all database objects

---

## 📋 Quick Reference

| Object Type | Convention | Example | Pattern |
|------------|-----------|---------|---------|
| **Tables** | Plural, snake_case | `users`, `user_quotas` | `<noun>s` or `<entity>_<noun>s` |
| **Columns** | Singular, snake_case | `user_id`, `created_at` | `<name>` or `<entity>_<attribute>` |
| **Indexes** | Prefixed, snake_case | `idx_users_email` | `idx_<table>_<column(s)>` |
| **Primary Keys** | Auto-generated | `users_pkey` | `<table>_pkey` (PostgreSQL default) |
| **Foreign Keys** | Auto-generated | `user_quotas_user_id_fkey` | `<table>_<column>_fkey` (PostgreSQL default) |
| **Unique Constraints** | Descriptive | `unique_user_period` | `unique_<description>` or `uq_<table>_<columns>` |
| **Check Constraints** | Descriptive | `check_positive_count` | `check_<description>` or `chk_<table>_<rule>` |

---

## 📐 Detailed Standards

### 1. Table Names

**Rules:**
- ✅ Use **plural nouns** (e.g., `users`, not `user`)
- ✅ Use **snake_case** for multi-word names
- ✅ Use descriptive, business-domain names
- ❌ Avoid abbreviations unless universally understood
- ❌ Don't prefix with `tbl_` or similar

**Examples:**
```sql
✅ GOOD:
CREATE TABLE users (...);
CREATE TABLE user_quotas (...);
CREATE TABLE usage_analytics (...);
CREATE TABLE password_reset_tokens (...);

❌ BAD:
CREATE TABLE user (...);              -- Not plural
CREATE TABLE UserQuotas (...);        -- PascalCase instead of snake_case
CREATE TABLE tbl_users (...);         -- Unnecessary prefix
CREATE TABLE usr_qta (...);           -- Over-abbreviated
```

**Naming Patterns:**
- **Simple entities:** `users`, `products`, `orders`
- **Join/linking tables:** `user_roles`, `product_categories`
- **Domain-specific:** `user_quotas`, `usage_analytics`, `audit_logs`

---

### 2. Column Names

**Rules:**
- ✅ Use **singular nouns** (e.g., `email`, not `emails`)
- ✅ Use **snake_case** for multi-word names
- ✅ Use suffixes for clarity: `_id`, `_at`, `_count`, `_date`, `_hash`
- ✅ Boolean columns: Use `is_`, `has_`, or `can_` prefix (e.g., `is_active`, `has_verified_email`)
- ❌ Don't use data type in name (e.g., `email_varchar`)
- ❌ Don't abbreviate unless universally understood

**Standard Column Names:**
```sql
-- Primary Keys
id                    -- Auto-incrementing integer (SERIAL)

-- Foreign Keys
user_id               -- References users(id)
organization_id       -- References organizations(id)

-- Timestamps
created_at            -- Record creation time (TIMESTAMP)
updated_at            -- Last modification time (TIMESTAMP)
deleted_at            -- Soft delete time (TIMESTAMP, nullable)

-- Dates
start_date            -- Date-only field (DATE)
end_date              -- Date-only field (DATE)
birth_date            -- Date-only field (DATE)

-- Boolean Flags
is_active             -- Active/inactive status
is_verified           -- Verification status
has_accepted_terms    -- User acceptance flags
can_send_email        -- Permission flags

-- Counts/Quantities
daily_count           -- Numeric counts
monthly_total         -- Numeric totals
max_attempts          -- Numeric limits

-- Security
password_hash         -- Hashed passwords (never plain text)
token_hash            -- Hashed tokens
salt                  -- Cryptographic salt

-- Metadata
metadata              -- JSONB for flexible data
settings              -- JSONB for configuration
```

**Examples:**
```sql
✅ GOOD:
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

❌ BAD:
CREATE TABLE users (
  UserID INT PRIMARY KEY,               -- PascalCase
  emailAddress VARCHAR(255),            -- camelCase
  pwd VARCHAR(255),                     -- Over-abbreviated
  activeFlag BOOLEAN,                   -- Unclear naming
  CreateDate TIMESTAMP                  -- PascalCase
);
```

---

### 3. Index Names

**Rules:**
- ✅ Use prefix `idx_` for all indexes
- ✅ Include table name: `idx_<table>_<column(s)>`
- ✅ For multi-column indexes, use descriptive name or abbreviated columns
- ✅ Use snake_case
- ❌ Don't use auto-generated names (they're cryptic)

**Pattern:**
```
idx_<table_name>_<indexed_columns>
```

**Examples:**
```sql
✅ GOOD:
-- Single column indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_user_quotas_last_reset ON user_quotas(last_reset_date);

-- Multi-column indexes (composite)
CREATE INDEX idx_user_quotas_user_period ON user_quotas(user_id, period_start_date);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);

-- Partial/filtered indexes
CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = TRUE;

❌ BAD:
CREATE INDEX users_email ON users(email);                    -- No prefix
CREATE INDEX idx_email ON users(email);                      -- Missing table name
CREATE INDEX index_users_email_address ON users(email);      -- Inconsistent prefix
```

**Index Naming by Type:**

```sql
-- B-tree (default, most common)
CREATE INDEX idx_<table>_<column> ON <table>(<column>);

-- Unique indexes (use UNIQUE constraint instead when possible)
CREATE UNIQUE INDEX idx_<table>_<column>_unique ON <table>(<column>);

-- GIN indexes (for JSONB, full-text search)
CREATE INDEX idx_<table>_<column>_gin ON <table> USING GIN(<column>);

-- Partial indexes
CREATE INDEX idx_<table>_<column>_<filter> ON <table>(<column>) WHERE <condition>;
```

---

### 4. Constraint Names

**Primary Keys:**
- PostgreSQL auto-generates: `<table>_pkey`
- ✅ Accept the default (e.g., `users_pkey`)
- Don't override unless necessary

**Foreign Keys:**
- PostgreSQL auto-generates: `<table>_<column>_fkey`
- ✅ Accept the default (e.g., `user_quotas_user_id_fkey`)
- Can specify explicitly for clarity:

```sql
✅ GOOD (explicit):
CONSTRAINT fk_user_quotas_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE

✅ GOOD (implicit):
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
-- Creates: user_quotas_user_id_fkey
```

**Unique Constraints:**
- Use descriptive names: `unique_<description>`
- Or pattern: `uq_<table>_<columns>`

```sql
✅ GOOD:
CONSTRAINT unique_user_period UNIQUE (user_id, period_start_date)
CONSTRAINT uq_users_email UNIQUE (email)
CONSTRAINT unique_github_oauth UNIQUE (github_id)
```

**Check Constraints:**
- Use pattern: `check_<description>` or `chk_<table>_<rule>`

```sql
✅ GOOD:
CONSTRAINT check_positive_count CHECK (daily_count >= 0)
CONSTRAINT chk_user_quotas_valid_dates CHECK (period_start_date <= last_reset_date)
CONSTRAINT check_valid_tier CHECK (tier IN ('free', 'starter', 'pro', 'team', 'enterprise'))
```

---

### 5. Foreign Key Relationships

**Rules:**
- ✅ Always specify `ON DELETE` behavior explicitly
- ✅ Always specify `ON UPDATE` behavior when needed
- ✅ Use `CASCADE` when child records should be deleted with parent
- ✅ Use `SET NULL` when orphaned records should remain
- ✅ Use `RESTRICT` when deletion should be prevented if children exist

**Patterns:**

```sql
-- Cascade delete (most common for owned relationships)
user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE

-- Set to null (for optional relationships)
updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL

-- Restrict deletion (prevent orphaned records)
category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT

-- Update cascade (rare, but useful for mutable foreign keys)
organization_id INTEGER REFERENCES organizations(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE
```

**Decision Guide:**

| Relationship | ON DELETE Action | Example |
|--------------|------------------|---------|
| **Owns** (parent owns child) | `CASCADE` | `users` → `user_quotas` |
| **Optional reference** | `SET NULL` | `posts.updated_by` → `users` |
| **Required dependency** | `RESTRICT` | `orders` → `products` |
| **Audit trail** | `RESTRICT` | `transactions` → `users` |

---

### 6. Data Types

**Standard Choices:**

```sql
-- Primary Keys
id SERIAL PRIMARY KEY                          -- Auto-incrementing integer (1, 2, 3...)
id BIGSERIAL PRIMARY KEY                       -- For high-volume tables (billions of rows)

-- Strings
VARCHAR(255)                                   -- Variable-length strings (email, names)
TEXT                                           -- Unlimited length (descriptions, content)
CHAR(2)                                        -- Fixed-length (country codes: 'US', 'UK')

-- Numbers
INTEGER                                        -- Whole numbers (-2B to +2B)
BIGINT                                         -- Large whole numbers
DECIMAL(10,2)                                  -- Exact decimals (money: 12345678.99)
REAL                                           -- Approximate decimals (measurements)

-- Booleans
BOOLEAN                                        -- TRUE/FALSE/NULL

-- Dates/Times
DATE                                           -- Date only (2025-10-27)
TIMESTAMP                                      -- Date + time (2025-10-27 14:30:00)
TIMESTAMPTZ                                    -- Timestamp with timezone (recommended for UTC)

-- JSON
JSONB                                          -- Binary JSON (recommended, indexable)
JSON                                           -- Text JSON (use JSONB instead)

-- Arrays
INTEGER[]                                      -- Array of integers
TEXT[]                                         -- Array of strings
```

**Best Practices:**

```sql
✅ GOOD:
email VARCHAR(255)                -- Sufficient for all valid emails
price DECIMAL(10,2)               -- Exact decimal for money
created_at TIMESTAMPTZ            -- Timezone-aware
metadata JSONB                    -- Binary JSON (faster queries)

❌ BAD:
email VARCHAR(50)                 -- Too short for some emails
price REAL                        -- Floating point errors with money
created_at VARCHAR(255)           -- Strings instead of proper types
metadata TEXT                     -- Should use JSONB
```

---

### 7. Default Values & NULLability

**Rules:**
- ✅ Use `NOT NULL` unless the field is truly optional
- ✅ Provide sensible defaults where possible
- ✅ Use `DEFAULT NOW()` for timestamps
- ✅ Use `DEFAULT FALSE` for boolean flags
- ❌ Don't use `NULL` as a magic value (use enums or sentinel values)

**Examples:**

```sql
✅ GOOD:
-- Required fields
email VARCHAR(255) NOT NULL
user_id INTEGER NOT NULL

-- Optional fields with defaults
is_active BOOLEAN DEFAULT TRUE
tier VARCHAR(50) DEFAULT 'free'
created_at TIMESTAMP DEFAULT NOW()

-- Optional fields without defaults
deleted_at TIMESTAMP            -- NULL means not deleted
middle_name VARCHAR(100)        -- NULL means no middle name

❌ BAD:
email VARCHAR(255)              -- Should be NOT NULL
created_at TIMESTAMP            -- Should have DEFAULT NOW()
is_active BOOLEAN               -- Should have DEFAULT
```

---

### 8. Naming Anti-Patterns

**Avoid These Common Mistakes:**

```sql
❌ Don't use reserved words as names:
user, order, group, index, table, column

✅ Instead:
users, orders, user_groups

❌ Don't use cryptic abbreviations:
usr, qta, tmp, cnt

✅ Instead:
users, quotas, temporary_records, count

❌ Don't use Hungarian notation:
tblUsers, intUserID, strEmail

✅ Instead:
users, user_id, email

❌ Don't mix naming styles:
userName, user_email, UserID

✅ Instead:
user_name, user_email, user_id

❌ Don't use data type prefixes:
email_varchar, created_timestamp

✅ Instead:
email, created_at
```

---

## 🎯 Migration File Standards

**Filename Format:**
```
NNN-description-of-change.sql

Examples:
001-create-users-table.sql
002-add-reset-token-fields.sql
003-create-user-quotas-table.sql
```

**Migration Structure:**
```sql
-- Migration: <Brief description>
-- Version: <NNN>
-- Date: <YYYY-MM-DD>
-- Description: <Detailed description of what this migration does>

-- Step 1: <What this does>
<SQL statements>

-- Step 2: <What this does>
<SQL statements>

-- Verification query
SELECT ... FROM information_schema ... ;
```

**Best Practices:**
- ✅ Always use `CREATE TABLE IF NOT EXISTS`
- ✅ Always use `CREATE INDEX IF NOT EXISTS`
- ✅ Use `DO $$` blocks for conditional logic
- ✅ Include verification queries at the end
- ✅ Add comments explaining each step
- ❌ Never modify migrations after they're applied
- ❌ Never delete migrations that have been applied

---

## 📚 Real Examples from CodeScribe AI

### Example 1: Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  github_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) DEFAULT 'free',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP,
  reset_token_hash VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token_hash);
```

### Example 2: User Quotas Table
```sql
CREATE TABLE IF NOT EXISTS user_quotas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_count INTEGER DEFAULT 0 NOT NULL,
  monthly_count INTEGER DEFAULT 0 NOT NULL,
  last_reset_date TIMESTAMP NOT NULL DEFAULT NOW(),
  period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_period UNIQUE (user_id, period_start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_period
  ON user_quotas(user_id, period_start_date);
CREATE INDEX IF NOT EXISTS idx_user_quotas_last_reset
  ON user_quotas(last_reset_date);
```

### Example 3: Usage Analytics Table
```sql
CREATE TABLE IF NOT EXISTS usage_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id
  ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at
  ON usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_operation
  ON usage_analytics(operation_type);
```

---

## 🔍 Validation Checklist

Before committing a new migration, verify:

- [ ] Table names are plural and snake_case
- [ ] Column names are singular and snake_case
- [ ] All indexes have `idx_<table>_` prefix
- [ ] Foreign keys have explicit `ON DELETE` behavior
- [ ] Required fields are marked `NOT NULL`
- [ ] Timestamp fields have `DEFAULT NOW()`
- [ ] Boolean fields have `DEFAULT TRUE/FALSE`
- [ ] Constraints have descriptive names
- [ ] Migration includes verification queries
- [ ] Migration tested locally with `npm run migrate`
- [ ] Migration validated with `npm run migrate:validate`

---

## 📖 Additional Resources

**Internal Documentation:**
- [DB-MIGRATION-MANAGEMENT.MD](./DB-MIGRATION-MANAGEMENT.MD) - Migration system guide
- [PRODUCTION-DB-SETUP.md](./PRODUCTION-DB-SETUP.md) - Production database setup

**PostgreSQL Documentation:**
- [Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

**Industry Standards:**
- [SQL Style Guide by Simon Holywell](https://www.sqlstyle.guide/)
- [PostgreSQL Style Guide](https://github.com/ankane/strong_migrations#postgresql-schema-naming-conventions)

---

**Version History:**
- **v1.0** (October 27, 2025) - Initial version based on existing migrations and industry standards

**Maintained by:** CodeScribe AI Development Team
**Last Updated:** October 27, 2025
