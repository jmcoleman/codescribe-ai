# SQL Best Practices for @vercel/postgres

**Last Updated:** January 28, 2026
**Status:** ✅ Production Standard

## Overview

This guide documents security-first SQL patterns for dynamic queries using `@vercel/postgres`. All database operations MUST follow these patterns to prevent SQL injection vulnerabilities while maintaining flexibility for dynamic query building.

**Key Principle:** Use parameterized queries with `$1`, `$2`, etc. placeholders and `sql.query(queryText, params)` for all dynamic SQL operations.

---

## 🔒 Core Principle: Parameterized Queries

When building dynamic queries with @vercel/postgres, **always use parameterized queries** with `$1`, `$2`, etc. placeholders. Never concatenate user input directly into SQL strings.

```javascript
import { sql } from '@vercel/postgres';

// ✅ CORRECT - Parameterized query with placeholders
const queryText = 'SELECT * FROM users WHERE status = $1';
const params = [status];
const result = await sql.query(queryText, params);

// ✅ ALSO CORRECT - Simple queries can use sql tagged template
const result = await sql`SELECT * FROM users WHERE status = ${status}`;

// ❌ WRONG - String concatenation (SQL injection risk!)
const query = `SELECT * FROM users WHERE status = '${status}'`;
const result = await sql.query(query);

// ❌ WRONG - Template literal without proper parameterization
const whereClause = `status = '${status}'`;
const result = await sql`SELECT * FROM users WHERE ${whereClause}`;
```

**When to use each approach:**
- **Parameterized queries (`$1`, `$2`)** - Required for dynamic queries with conditional clauses
- **sql tagged template** - Simple static queries with fixed structure
- **sql.query()** - Never use without parameters!

---

## 🔧 Pattern: Dynamic WHERE Clauses

### Problem
Building queries with optional filters (e.g., admin dashboards, search endpoints) requires conditionally adding WHERE clauses.

### Solution
Use parameterized queries with `$1`, `$2` placeholders:

```javascript
import { sql } from '@vercel/postgres';

async function getUsers(filters = {}) {
  const { status, role, searchTerm } = filters;

  // Build query string and params separately
  let queryText = 'SELECT * FROM users';
  const conditions = [];
  const params = [];
  let paramCounter = 1;

  if (status) {
    conditions.push(`status = $${paramCounter++}`);
    params.push(status);
  }

  if (role) {
    conditions.push(`role = $${paramCounter++}`);
    params.push(role);
  }

  if (searchTerm) {
    conditions.push(`(name ILIKE $${paramCounter++} OR email ILIKE $${paramCounter++})`);
    params.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await sql.query(queryText, params);
  return result.rows;
}
```

### Why This Works
- Each user value is in the `params` array, never in the query string
- `$1`, `$2` placeholders tell PostgreSQL to treat values as data, not SQL
- String concatenation is safe because we're only joining the placeholder strings (`status = $1`), not user data
- SQL injection is impossible because user input never becomes SQL syntax

### Common Mistake
```javascript
// ❌ WRONG - Incrementing placeholder in string literal
if (status) {
  conditions.push(`status = $${paramCounter}`);
  params.push(status);
  paramCounter++; // Easy to forget!
}

// ✅ CORRECT - Increment inline
if (status) {
  conditions.push(`status = $${paramCounter++}`);
  params.push(status);
}
```

---

## 🔧 Pattern: Dynamic ORDER BY

### Problem
Allowing user-controlled sorting (e.g., sortable table columns).

### Solution
Whitelist column names and directions, then build the query string:

```javascript
async function getUsers({ sortBy = 'created_at', sortDir = 'DESC' } = {}) {
  // Whitelist valid columns and directions
  const validColumns = ['created_at', 'email', 'name', 'status'];
  const validDirections = ['ASC', 'DESC'];

  const column = validColumns.includes(sortBy) ? sortBy : 'created_at';
  const direction = validDirections.includes(sortDir.toUpperCase()) ? sortDir.toUpperCase() : 'DESC';

  // ORDER BY columns cannot be parameterized - must be in query string
  // Security: Validated against whitelist above
  const queryText = `
    SELECT * FROM users
    ORDER BY ${column} ${direction}
  `;

  const result = await sql.query(queryText);
  return result.rows;
}
```

### Security Notes
- **Never** parameterize column names or SQL keywords (ORDER BY, ASC/DESC, table names)
- **Always** whitelist valid values before using them in query strings
- Use explicit validation instead of relying on sanitization
- PostgreSQL does not support `$1` placeholders for identifiers

---

## 🔧 Pattern: Dynamic Pagination

### Problem
Implementing LIMIT/OFFSET pagination with user-provided values.

### Solution
Validate inputs, then use parameterized queries:

```javascript
async function getUsers({ page = 1, limit = 25 } = {}) {
  // Validate and constrain pagination values
  const validatedLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
  const validatedPage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (validatedPage - 1) * validatedLimit;

  const queryText = `
    SELECT * FROM users
    ORDER BY created_at DESC
    LIMIT $1
    OFFSET $2
  `;
  const params = [validatedLimit, offset];

  const result = await sql.query(queryText, params);
  return result.rows;
}
```

### Best Practices
- Cap maximum limit (e.g., 100) to prevent resource exhaustion
- Validate page >= 1 to prevent negative offsets
- Use `parseInt()` with base 10 for robust number conversion
- Provide sensible defaults (page=1, limit=25)
- Calculate offset from validated inputs

---

## 🔧 Pattern: IN Clauses with Arrays

### Problem
Filtering by multiple values (e.g., `WHERE id IN (1, 2, 3)`).

### Solution
Use PostgreSQL's `ANY()` operator with array parameters:

```javascript
async function getUsersByIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const queryText = 'SELECT * FROM users WHERE id = ANY($1)';
  const params = [userIds];

  const result = await sql.query(queryText, params);
  return result.rows;
}
```

### Alternative: Dynamic IN clause
If you need traditional IN syntax for compatibility:

```javascript
async function getUsersByIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  // Build placeholders: $1, $2, $3
  const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');

  const queryText = `SELECT * FROM users WHERE id IN (${placeholders})`;
  const params = userIds;

  const result = await sql.query(queryText, params);
  return result.rows;
}
```

### Security Notes
- Validate `userIds` is an array before using
- Handle empty arrays explicitly (return early or omit WHERE clause)
- PostgreSQL's `ANY()` syntax is often more efficient than `IN`
- Both approaches are safe from SQL injection when done correctly

---

## 🔧 Pattern: Date Range Filters

### Problem
Filtering by date ranges from user input.

### Solution
Validate dates and use parameterized queries:

```javascript
async function getEventsByDateRange(startDate, endDate) {
  // Validate dates (ensure they're valid Date objects or ISO strings)
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date range');
  }

  let queryText = 'SELECT * FROM events';
  const conditions = [];
  const params = [];
  let paramCounter = 1;

  if (startDate) {
    conditions.push(`created_at >= $${paramCounter++}`);
    params.push(start.toISOString());
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramCounter++}`);
    params.push(end.toISOString());
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await sql.query(queryText, params);
  return result.rows;
}
```

### Best Practices
- Always validate date inputs before using in queries
- Use ISO 8601 format for consistency (`toISOString()`)
- Handle timezone conversions at the application level
- Consider using PostgreSQL's `BETWEEN` for inclusive ranges:
  ```javascript
  conditions.push(`created_at BETWEEN $${paramCounter++} AND $${paramCounter++}`);
  params.push(start.toISOString(), end.toISOString());
  ```

---

## 🔧 Pattern: Complex Joins with Dynamic Conditions

### Problem
Building queries with JOINs and multiple optional filters.

### Solution
Build query string and params array, handling all dynamic parts:

```javascript
async function getGenerationsWithUsers(filters = {}) {
  const { userId, docType, startDate } = filters;

  let queryText = `
    SELECT
      g.id,
      g.doc_type,
      g.created_at,
      u.email,
      u.name
    FROM doc_generations g
    INNER JOIN users u ON u.id = g.user_id
  `;

  const conditions = [];
  const params = [];
  let paramCounter = 1;

  if (userId) {
    conditions.push(`g.user_id = $${paramCounter++}`);
    params.push(userId);
  }

  if (docType) {
    conditions.push(`g.doc_type = $${paramCounter++}`);
    params.push(docType);
  }

  if (startDate) {
    const start = new Date(startDate);
    conditions.push(`g.created_at >= $${paramCounter++}`);
    params.push(start.toISOString());
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY g.created_at DESC';

  const result = await sql.query(queryText, params);
  return result.rows;
}
```

---

## 🔧 Pattern: Multiple Search Terms (OR conditions)

### Problem
Searching across multiple fields with a single search term.

### Solution
Build OR conditions with proper parameterization:

```javascript
async function searchUsers(searchTerm) {
  if (!searchTerm) {
    return [];
  }

  const queryText = `
    SELECT * FROM users
    WHERE
      email ILIKE $1 OR
      first_name ILIKE $2 OR
      last_name ILIKE $3
    ORDER BY created_at DESC
  `;

  const searchPattern = `%${searchTerm}%`;
  const params = [searchPattern, searchPattern, searchPattern];

  const result = await sql.query(queryText, params);
  return result.rows;
}
```

### Alternative: Dynamic search fields

```javascript
async function searchUsers(searchTerm, searchFields = ['email', 'first_name', 'last_name']) {
  if (!searchTerm) {
    return [];
  }

  // Whitelist valid search fields
  const validFields = ['email', 'first_name', 'last_name', 'company'];
  const fields = searchFields.filter(f => validFields.includes(f));

  if (fields.length === 0) {
    throw new Error('No valid search fields provided');
  }

  // Build OR conditions
  const conditions = fields.map((field, index) => `${field} ILIKE $${index + 1}`);
  const queryText = `
    SELECT * FROM users
    WHERE ${conditions.join(' OR ')}
    ORDER BY created_at DESC
  `;

  const searchPattern = `%${searchTerm}%`;
  const params = fields.map(() => searchPattern);

  const result = await sql.query(queryText, params);
  return result.rows;
}
```

---

## 🚫 Anti-Patterns to Avoid

### 1. String Concatenation with User Input
```javascript
// ❌ NEVER DO THIS
const status = req.query.status;
const query = `SELECT * FROM users WHERE status = '${status}'`;
await sql.query(query);
```

**Why:** SQL injection vulnerability. User can input `' OR '1'='1` to bypass filter.

### 2. Missing Parameter for Placeholder
```javascript
// ❌ NEVER DO THIS
const queryText = 'SELECT * FROM users WHERE status = $1 AND role = $2';
const params = [status]; // Missing second parameter!
await sql.query(queryText, params);
```

**Why:** Query will fail at runtime with parameter mismatch error.

### 3. Wrong Placeholder Number
```javascript
// ❌ NEVER DO THIS
let paramCounter = 1;
if (status) {
  conditions.push(`status = $${paramCounter}`);
  params.push(status);
  // Forgot to increment!
}
if (role) {
  conditions.push(`role = $${paramCounter}`); // Still $1, should be $2!
  params.push(role);
}
```

**Why:** Multiple placeholders map to same parameter. Use `paramCounter++` inline.

### 4. Parameterizing Column Names
```javascript
// ❌ NEVER DO THIS
const orderBy = req.query.orderBy;
const queryText = 'SELECT * FROM users ORDER BY $1';
const params = [orderBy];
await sql.query(queryText, params);
```

**Why:** PostgreSQL will treat it as a string value, not a column name. Always whitelist and concatenate.

### 5. Building WHERE Clause String with User Input
```javascript
// ❌ NEVER DO THIS
const whereClause = `status = '${status}'`; // User input in string!
const queryText = `SELECT * FROM users WHERE ${whereClause}`;
await sql.query(queryText);
```

**Why:** Still vulnerable to SQL injection even though using sql.query().

---

## 📋 Checklist for New SQL Queries

Before merging any PR with SQL queries, verify:

- [ ] All user inputs are in the `params` array, not concatenated into query string
- [ ] Placeholder numbers (`$1`, `$2`, etc.) match the params array indices
- [ ] `paramCounter++` is used inline to avoid skipped numbers
- [ ] Dynamic ORDER BY uses whitelisted column names
- [ ] Array inputs use `ANY($1)` or dynamic placeholders
- [ ] Date inputs are validated before use
- [ ] LIMIT/OFFSET values are validated and capped
- [ ] Empty conditions arrays are handled (don't generate invalid SQL)
- [ ] No `sql.query()` calls without params (unless truly static query)
- [ ] Column/table names are whitelisted, not parameterized

---

## 🔍 Real-World Examples from Codebase

### Example 1: Admin User List with Filters
From `server/src/routes/admin.js` (lines 3095-3150):

```javascript
// Multi-field search with tier filtering
const conditions = [];
const params = [];
let paramIndex = 1;

// Search filter (email, first_name, last_name)
if (search) {
  conditions.push(`(
    u.email ILIKE $${paramIndex} OR
    u.first_name ILIKE $${paramIndex} OR
    u.last_name ILIKE $${paramIndex}
  )`);
  params.push(`%${search}%`);
  paramIndex++;
}

// Tier filter
if (tier && tier !== 'all') {
  conditions.push(`u.tier = $${paramIndex}`);
  params.push(tier);
  paramIndex++;
}

const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

const queryText = `
  SELECT u.*, COUNT(*) OVER() as total_count
  FROM users u
  ${whereClause}
  ORDER BY u.created_at DESC
  LIMIT $${paramIndex++}
  OFFSET $${paramIndex++}
`;

params.push(limit, offset);
const result = await sql.query(queryText, params);
```

### Example 2: Audit Log Summary with Date Range
From `server/src/models/AuditLog.js` (lines 220-250):

```javascript
async function getAuditSummary(filters = {}) {
  const { startDate, endDate } = filters;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate.toISOString());
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate.toISOString());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const queryText = `
    SELECT
      COUNT(*) as total_events,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(*) FILTER (WHERE contains_potential_phi = true) as phi_events
    FROM audit_logs
    ${whereClause}
  `;

  const result = await sql.query(queryText, params);
  return result.rows[0];
}
```

---

## 💡 Tips and Best Practices

### Use `paramCounter++` Inline
```javascript
// ✅ GOOD - Increment inline
if (status) {
  conditions.push(`status = $${paramCounter++}`);
  params.push(status);
}

// ❌ AVOID - Easy to forget increment
if (status) {
  conditions.push(`status = $${paramCounter}`);
  params.push(status);
  paramCounter++; // Easy to forget or place incorrectly
}
```

### Handle Empty Conditions Gracefully
```javascript
// ✅ GOOD - Check length before adding WHERE
const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

// ❌ BAD - Invalid SQL if no conditions
const whereClause = `WHERE ${conditions.join(' AND ')}`; // "WHERE " if empty
```

### Order Matters: Build Query Then Add LIMIT/OFFSET
```javascript
// ✅ GOOD - Add LIMIT/OFFSET after WHERE clause
let queryText = 'SELECT * FROM users';
const conditions = [];
const params = [];
let paramCounter = 1;

// Add conditions...
if (conditions.length > 0) {
  queryText += ' WHERE ' + conditions.join(' AND ');
}

// Then add LIMIT/OFFSET
queryText += ` LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
params.push(limit, offset);
```

### Validate Before Query Building
```javascript
// ✅ GOOD - Validate early
async function getUsers({ page, limit, sortBy }) {
  // Validation
  const validatedLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
  const validatedPage = Math.max(parseInt(page, 10) || 1, 1);
  const validSortBy = ['created_at', 'email', 'name'].includes(sortBy) ? sortBy : 'created_at';

  // Query building with validated values
  const queryText = `SELECT * FROM users ORDER BY ${validSortBy} LIMIT $1 OFFSET $2`;
  const offset = (validatedPage - 1) * validatedLimit;
  const params = [validatedLimit, offset];

  return await sql.query(queryText, params);
}
```

---

## 🔗 Related Documentation

- [DB Naming Standards](DB-NAMING-STANDARDS.md) - Table/column naming conventions
- [DB Migration Management](DB-MIGRATION-MANAGEMENT.md) - Schema change workflow
- [@vercel/postgres Documentation](https://vercel.com/docs/storage/vercel-postgres/sdk) - Official SDK docs
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) - Security guide
- [PostgreSQL Documentation - Query Parameters](https://www.postgresql.org/docs/current/sql-prepare.html) - How parameterized queries work

---

## 📝 Summary

**Golden Rule:** All user-provided values MUST be in the `params` array using `$1`, `$2` placeholders. If you're concatenating user input into the query string, you're doing it wrong.

**Quick Reference:**
- ✅ `conditions.push(\`status = $${paramCounter++}\`); params.push(status);` - Safe
- ✅ Whitelist column names before concatenating into query string - Safe for ORDER BY
- ✅ `sql.query(queryText, params)` - Parameterized queries
- ✅ `sql\`SELECT * FROM users WHERE id = ${id}\`` - Simple static queries
- ❌ `\`WHERE status = '${status}'\`` - SQL injection risk
- ❌ `sql.query(queryWithConcatenatedInput)` - Still vulnerable

**When in doubt:** Build your query string with `$1`, `$2` placeholders and put all user values in the `params` array.
