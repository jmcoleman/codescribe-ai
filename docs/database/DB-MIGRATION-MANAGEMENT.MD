# Database Migration Management - Future Implementation Guide

**Status:** 📋 Concept Guide (Not Implemented)
**Purpose:** Reference for implementing automated migration management when needed
**Context:** Currently using manual migration runner ([runMigration.js](../../server/src/db/runMigration.js))

---

## When to Implement This

Consider implementing automated migration management when you have:

✅ **Multiple environments** (dev, staging, production)
✅ **Team collaboration** (multiple developers making schema changes)
✅ **Frequent schema changes** (3+ migrations per month)
✅ **Zero-downtime requirements** (need controlled rollouts)
✅ **Audit requirements** (need migration history tracking)

❌ **Skip if:**
- Single developer, single environment
- One-time or rare schema changes
- Simple manual process is sufficient

---

## Current State (Manual Migration)

**What We Have:**
```
server/src/db/
├── runMigration.js          # Manual migration runner
└── migrations/
    └── add-reset-token-fields.sql  # Single migration file
```

**How It Works:**
1. Developer creates `.sql` file in `migrations/`
2. Developer manually runs `node src/db/runMigration.js`
3. Migration executes (idempotent SQL prevents duplicates)
4. No tracking of which migrations have run

**Limitations:**
- No migration history tracking
- Manual execution required for each environment
- No automatic detection of pending migrations
- Risk of running wrong migration or missing one
- No rollback capability

---

## Proposed Architecture

### 1. Migration Tracking Table

**Purpose:** Track which migrations have been applied to each database

```sql
-- server/src/db/migrations/000-create-migration-table.sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) UNIQUE NOT NULL,  -- e.g., "001-add-reset-token-fields"
  name VARCHAR(255) NOT NULL,             -- Human-readable description
  applied_at TIMESTAMP DEFAULT NOW(),
  execution_time_ms INTEGER,              -- Performance tracking
  checksum VARCHAR(64)                    -- Verify file hasn't changed
);

CREATE INDEX idx_schema_migrations_version ON schema_migrations(version);
```

**Benefits:**
- Know exactly which migrations have run
- Prevent duplicate executions
- Audit trail for debugging
- Performance metrics

### 2. Migration File Naming Convention

**Format:** `{version}-{description}.sql`

```
migrations/
├── 000-create-migration-table.sql
├── 001-create-users-table.sql
├── 002-add-email-verification.sql
├── 003-add-reset-token-fields.sql
├── 004-add-usage-tracking.sql
└── 005-add-user-preferences.sql
```

**Rules:**
- Version number: 3-digit zero-padded (001, 002, 003)
- Description: kebab-case, descriptive
- Run in alphabetical/numerical order
- Never modify existing migrations (create new ones)

### 3. Enhanced Migration Runner

**Location:** `server/src/db/migrate.js`

**Features:**
```javascript
/**
 * Automated Migration Runner
 *
 * Features:
 * - Discovers all .sql files in migrations/
 * - Checks schema_migrations table for applied migrations
 * - Runs only pending migrations in order
 * - Records each successful migration
 * - Atomic transactions (rollback on failure)
 * - Checksum validation
 */

// High-level algorithm:
async function migrate() {
  // 1. Ensure schema_migrations table exists
  await ensureMigrationTableExists();

  // 2. Get list of all migration files
  const allMigrations = await getMigrationFiles();

  // 3. Get list of applied migrations from database
  const appliedMigrations = await getAppliedMigrations();

  // 4. Determine pending migrations
  const pending = allMigrations.filter(m =>
    !appliedMigrations.includes(m.version)
  );

  // 5. Run each pending migration in transaction
  for (const migration of pending) {
    await runMigrationInTransaction(migration);
  }

  // 6. Report results
  console.log(`✅ ${pending.length} migrations applied successfully`);
}
```

**Key Implementation Details:**

```javascript
// Migration file structure
interface Migration {
  version: string;        // "001-create-users-table"
  filename: string;       // "001-create-users-table.sql"
  name: string;          // "Create users table"
  sql: string;           // SQL file contents
  checksum: string;      // MD5 hash of SQL
}

// Run migration in transaction
async function runMigrationInTransaction(migration) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const startTime = Date.now();

    // Execute migration SQL
    await client.query(migration.sql);

    const executionTime = Date.now() - startTime;

    // Record in schema_migrations
    await client.query(`
      INSERT INTO schema_migrations (version, name, execution_time_ms, checksum)
      VALUES ($1, $2, $3, $4)
    `, [migration.version, migration.name, executionTime, migration.checksum]);

    await client.query('COMMIT');

    console.log(`✅ Applied: ${migration.version} (${executionTime}ms)`);

  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Migration ${migration.version} failed: ${error.message}`);
  } finally {
    client.release();
  }
}
```

### 4. Checksum Validation

**Purpose:** Prevent accidental modification of applied migrations

```javascript
import crypto from 'crypto';

function calculateChecksum(sql) {
  return crypto.createHash('md5').update(sql).digest('hex');
}

async function validateMigrationIntegrity() {
  const appliedMigrations = await getAppliedMigrations();

  for (const applied of appliedMigrations) {
    const currentFile = readMigrationFile(applied.version);
    const currentChecksum = calculateChecksum(currentFile.sql);

    if (currentChecksum !== applied.checksum) {
      throw new Error(
        `Migration ${applied.version} has been modified after being applied! ` +
        `This is dangerous and could cause inconsistencies.`
      );
    }
  }
}
```

### 5. CLI Interface

**Commands:**

```bash
# Run all pending migrations
npm run migrate

# Show migration status
npm run migrate:status

# Create new migration file
npm run migrate:create "add user preferences"

# Rollback last migration (advanced)
npm run migrate:rollback

# Validate migration integrity
npm run migrate:validate
```

**Implementation in package.json:**

```json
{
  "scripts": {
    "migrate": "node src/db/migrate.js",
    "migrate:status": "node src/db/migrate.js status",
    "migrate:create": "node src/db/migrate.js create",
    "migrate:rollback": "node src/db/migrate.js rollback",
    "migrate:validate": "node src/db/migrate.js validate"
  }
}
```

### 6. Status Command

**Show pending and applied migrations:**

```bash
$ npm run migrate:status

📊 Migration Status

Applied Migrations (3):
✅ 001-create-users-table           (2025-10-20 14:23:15) - 45ms
✅ 002-add-email-verification       (2025-10-22 09:15:32) - 23ms
✅ 003-add-reset-token-fields       (2025-10-24 11:45:01) - 18ms

Pending Migrations (2):
⏳ 004-add-usage-tracking
⏳ 005-add-user-preferences

Database: production (neon-db-abc123.us-east-1.aws.neon.tech)
```

---

## Integration with Deployment

### Option A: Vercel Build Hook

**Automatically run migrations during deployment:**

```json
// package.json (server)
{
  "scripts": {
    "vercel-build": "npm run migrate && npm run build",
    "migrate": "node src/db/migrate.js",
    "build": "echo 'Server build complete'"
  }
}
```

**Pros:**
- Automatic migration on every deploy
- Zero manual intervention
- Works with Vercel's deployment flow

**Cons:**
- Blocks deployment if migration fails
- No preview of migrations before deploy
- Can't easily skip migrations in emergency

### Option B: Pre-Deployment Script

**Run migrations before code deployment:**

```bash
# deployment script
#!/bin/bash

echo "🔄 Running database migrations..."
POSTGRES_URL=$PROD_DB_URL npm run migrate

if [ $? -eq 0 ]; then
  echo "✅ Migrations complete. Deploying code..."
  vercel --prod
else
  echo "❌ Migrations failed. Aborting deployment."
  exit 1
fi
```

**Pros:**
- Explicit migration step
- Can review migration status first
- Easy to skip if needed

**Cons:**
- Requires manual script execution
- Not integrated with CI/CD by default

### Option C: GitHub Actions Workflow

**Automated migration in CI/CD pipeline:**

```yaml
# .github/workflows/deploy.yml
name: Deploy with Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd server && npm install

      - name: Run migrations
        env:
          POSTGRES_URL: ${{ secrets.POSTGRES_URL }}
        run: cd server && npm run migrate

      - name: Deploy to Vercel
        if: success()
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Pros:**
- Fully automated CI/CD pipeline
- Migration runs before deploy
- Automatic rollback if migration fails
- Visible in GitHub Actions logs

**Cons:**
- More complex setup
- Requires GitHub Actions knowledge
- Secrets management needed

---

## Multi-Environment Strategy

### Separate Databases per Environment

```bash
# .env.development
POSTGRES_URL=postgresql://dev-db-url

# .env.staging
POSTGRES_URL=postgresql://staging-db-url

# .env.production (Vercel)
POSTGRES_URL=postgresql://prod-db-url
```

### Migration Workflow

```
1. Developer creates migration
   ├── 004-add-usage-tracking.sql
   └── Commit to feature branch

2. Run migration on dev database
   └── npm run migrate (uses .env.development)

3. Test changes locally
   └── Verify schema changes work

4. Merge to staging branch
   ├── CI/CD runs migration on staging DB
   └── Automated tests run

5. Merge to main branch
   ├── CI/CD runs migration on production DB
   └── Deploy new code to production

6. Verify in production
   └── Check migration status
```

### Environment-Specific Migrations

**Rarely needed, but possible:**

```sql
-- migrations/004-add-usage-tracking.sql
-- Only run in staging and production
DO $$
BEGIN
  IF current_database() NOT LIKE '%test%' THEN
    CREATE TABLE usage_stats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );
  END IF;
END $$;
```

---

## Rollback Strategy

### Approach 1: Down Migrations (Complex)

**Create paired up/down migrations:**

```
migrations/
├── 004-add-usage-tracking.up.sql
└── 004-add-usage-tracking.down.sql
```

**Down migration:**
```sql
-- 004-add-usage-tracking.down.sql
DROP TABLE IF EXISTS usage_stats;
DELETE FROM schema_migrations WHERE version = '004-add-usage-tracking';
```

**Rollback command:**
```bash
npm run migrate:rollback  # Rolls back last migration
```

**Pros:**
- Clean rollback mechanism
- Easy to undo changes

**Cons:**
- Double the migration files
- Data loss on rollback (DROP TABLE)
- Complex to maintain

### Approach 2: Forward-Only (Recommended)

**Never rollback, always move forward:**

```
Problem: Migration 004 added wrong column type

Solution: Create migration 005 to fix it
├── 004-add-usage-tracking.sql        (added wrong column)
└── 005-fix-usage-tracking-column.sql (fixes the column)
```

**Pros:**
- Simpler to reason about
- No data loss
- Clear audit trail
- Matches production reality

**Cons:**
- More migration files over time
- Can't truly "undo" a migration

---

## Alternative: Use Existing Tools

Instead of building custom migration system, consider:

### Prisma Migrate

**Best if:** Starting fresh or willing to adopt Prisma ORM

```bash
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name add-reset-token-fields

# Deploy to production
npx prisma migrate deploy
```

**Pros:**
- Production-ready migration system
- Automatic migration generation from schema
- Type-safe database client
- Great DX with Prisma Studio

**Cons:**
- Requires adopting Prisma ORM
- Migration away from raw SQL
- Learning curve

### node-pg-migrate

**Best if:** Want to keep raw SQL but add migration management

```bash
npm install node-pg-migrate

# Create migration
npx node-pg-migrate create add-reset-token-fields

# Run migrations
npx node-pg-migrate up

# Rollback
npx node-pg-migrate down
```

**Pros:**
- Works with existing SQL files
- Lightweight, focused on migrations
- Supports rollbacks
- CLI included

**Cons:**
- Another dependency
- Less feature-rich than Prisma

### Knex.js Migrations

**Best if:** Using Knex.js as query builder

```bash
npm install knex

# Create migration
npx knex migrate:make add_reset_token_fields

# Run migrations
npx knex migrate:latest

# Rollback
npx knex migrate:rollback
```

**Pros:**
- Integrated with Knex query builder
- JavaScript-based migrations
- Good documentation

**Cons:**
- Requires Knex.js adoption
- Not pure SQL

---

## Implementation Checklist

When ready to implement automated migration management:

**Phase 1: Setup (2-4 hours)**
- [ ] Create `schema_migrations` table migration
- [ ] Update file naming convention for existing migrations
- [ ] Build `migrate.js` script with core functionality
- [ ] Add `npm run migrate` command
- [ ] Test on development database

**Phase 2: Status & Validation (1-2 hours)**
- [ ] Implement `migrate:status` command
- [ ] Add checksum validation
- [ ] Create `migrate:validate` command
- [ ] Test with existing migrations

**Phase 3: Creation & Documentation (1-2 hours)**
- [ ] Build `migrate:create` command (generates template)
- [ ] Document migration workflow
- [ ] Update deployment docs
- [ ] Create migration guide for team

**Phase 4: CI/CD Integration (2-3 hours)**
- [ ] Add migration step to GitHub Actions
- [ ] Configure for staging environment
- [ ] Test migration workflow
- [ ] Deploy to production

**Phase 5: Monitoring (Ongoing)**
- [ ] Monitor migration execution times
- [ ] Track migration failures
- [ ] Review migration patterns
- [ ] Refine as needed

**Total Estimated Time:** 6-11 hours

---

## Testing Strategy

### Unit Tests

```javascript
// server/src/db/__tests__/migrate.test.js
describe('Migration System', () => {
  it('should detect pending migrations', async () => {
    const pending = await getPendingMigrations();
    expect(pending).toHaveLength(2);
  });

  it('should calculate checksums correctly', () => {
    const sql = 'CREATE TABLE users (id SERIAL);';
    const checksum = calculateChecksum(sql);
    expect(checksum).toBe('expected-md5-hash');
  });

  it('should run migration in transaction', async () => {
    await runMigrationInTransaction(testMigration);
    const applied = await getAppliedMigrations();
    expect(applied).toContainEqual(testMigration.version);
  });

  it('should rollback on migration failure', async () => {
    const badMigration = { sql: 'INVALID SQL;' };
    await expect(
      runMigrationInTransaction(badMigration)
    ).rejects.toThrow();

    // Verify rollback happened
    const tables = await getTables();
    expect(tables).not.toContain('new_table');
  });
});
```

### Integration Tests

```javascript
describe('Migration Integration', () => {
  it('should run all pending migrations', async () => {
    await migrate();
    const pending = await getPendingMigrations();
    expect(pending).toHaveLength(0);
  });

  it('should be idempotent', async () => {
    await migrate();
    await migrate(); // Run again
    // Should not throw errors
  });

  it('should detect modified migrations', async () => {
    // Modify applied migration file
    await expect(validateMigrationIntegrity()).rejects.toThrow(
      /has been modified/
    );
  });
});
```

---

## Troubleshooting

### Migration Stuck in "Running" State

**Cause:** Transaction not committed or rolled back

**Solution:**
```sql
-- Check for active transactions
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Kill stuck transaction if needed
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = XXX;
```

### Checksum Mismatch

**Cause:** Migration file was edited after being applied

**Solution:**
- Never edit applied migrations
- Create new migration to fix issues
- If in development only, delete from `schema_migrations` and re-run

### Migration Fails Midway

**Cause:** SQL error in migration

**Solution:**
- Transactions ensure automatic rollback
- Fix SQL in migration file
- Run again (idempotent)

---

## Related Documentation

- [runMigration.js](../../server/src/db/runMigration.js) - Current manual migration runner
- [PASSWORD-RESET-SETUP.md](../authentication/PASSWORD-RESET-SETUP.md) - Using current migration system
- [DEPLOYMENT-CHECKLIST.md](../deployment/DEPLOYMENT-CHECKLIST.md) - Deployment migration steps
- [VERCEL-POSTGRES-SETUP.md](../deployment/VERCEL-POSTGRES-SETUP.md) - Database setup

---

**Created:** October 24, 2025
**Status:** Concept guide for future implementation
**Next Steps:** Implement when multi-environment or team collaboration requires it
