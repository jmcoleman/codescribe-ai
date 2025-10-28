# Database Testing Guide - Best Practices

**Created:** October 27, 2025
**Status:** ✅ **ACTIVE** - Official database testing standards
**Scope:** Migration testing, schema validation, data integrity, performance

---

## 📋 Table of Contents

1. [Industry Best Practices Overview](#industry-best-practices-overview)
2. [Testing Layers](#testing-layers)
3. [Migration Testing Strategy](#migration-testing-strategy)
4. [Schema Validation Tests](#schema-validation-tests)
5. [Data Integrity Tests](#data-integrity-tests)
6. [Performance & Index Tests](#performance--index-tests)
7. [Test Database Setup](#test-database-setup)
8. [CI/CD Integration](#cicd-integration)
9. [Testing Tools & Frameworks](#testing-tools--frameworks)

---

## Industry Best Practices Overview

### Core Principles

**1. Test Pyramid for Databases:**
```
         /\
        /  \      E2E Integration Tests (Few)
       /────\     - Full migration runs
      /      \    - Production-like scenarios
     /────────\
    /          \  Component Tests (More)
   /────────────\ - Individual migrations
  /              \- Schema validation
 /────────────────\
/                  \ Unit Tests (Most)
────────────────────
- Migration logic
- Naming conventions
- Checksum validation
```

**2. Key Testing Areas:**
- ✅ Migration reversibility (rollback capability)
- ✅ Schema correctness (constraints, indexes, types)
- ✅ Data integrity (foreign keys, unique constraints)
- ✅ Performance (query execution, index usage)
- ✅ Idempotency (safe to run multiple times)
- ✅ Zero-downtime deployments (backward compatibility)

---

## Testing Layers

### Layer 1: Unit Tests (No Database Required)

**What to Test:**
- Migration file naming conventions
- Checksum calculation algorithms
- SQL parsing and validation logic
- Version number extraction
- Migration sorting logic

**Example:** [server/src/db/__tests__/migrate.test.js](../../server/src/db/__tests__/migrate.test.js)

```javascript
describe('Migration System - Unit Tests', () => {
  it('should validate migration filename format', () => {
    const filename = '003-create-user-quotas-table.sql';
    const match = filename.match(/^(\d{3})-(.+)\.sql$/);
    expect(match).not.toBeNull();
  });

  it('should calculate consistent checksums', () => {
    const sql = 'CREATE TABLE test (id SERIAL)';
    const checksum1 = crypto.createHash('md5').update(sql).digest('hex');
    const checksum2 = crypto.createHash('md5').update(sql).digest('hex');
    expect(checksum1).toBe(checksum2);
  });
});
```

**Status:** ✅ 479 tests in `migrate.test.js`

---

### Layer 2: Schema Validation Tests (With Test Database)

**What to Test:**
- Tables exist with correct structure
- Columns have correct types and constraints
- Indexes exist with proper naming
- Foreign keys configured correctly
- Constraints enforce business rules

**Example Test:**

```javascript
describe('Schema Validation Tests', () => {
  let testDb;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await runMigrations(testDb);
  });

  afterAll(async () => {
    await dropTestDatabase(testDb);
  });

  it('should create user_quotas table with correct columns', async () => {
    const columns = await testDb.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_quotas'
      ORDER BY ordinal_position
    `);

    expect(columns.rows).toEqual([
      { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
      { column_name: 'user_id', data_type: 'integer', is_nullable: 'NO' },
      { column_name: 'daily_count', data_type: 'integer', is_nullable: 'NO' },
      { column_name: 'monthly_count', data_type: 'integer', is_nullable: 'NO' }
      // ... more columns
    ]);
  });

  it('should enforce unique constraint on (user_id, period_start_date)', async () => {
    await testDb.query(`
      INSERT INTO user_quotas (user_id, period_start_date, daily_count, monthly_count)
      VALUES (1, '2025-10-27', 0, 0)
    `);

    await expect(
      testDb.query(`
        INSERT INTO user_quotas (user_id, period_start_date, daily_count, monthly_count)
        VALUES (1, '2025-10-27', 0, 0)
      `)
    ).rejects.toThrow(/unique constraint/i);
  });

  it('should cascade delete user_quotas when user is deleted', async () => {
    const userId = await createTestUser(testDb);
    await createUserQuota(testDb, userId);

    await testDb.query('DELETE FROM users WHERE id = $1', [userId]);

    const quotas = await testDb.query(
      'SELECT * FROM user_quotas WHERE user_id = $1',
      [userId]
    );
    expect(quotas.rows).toHaveLength(0);
  });

  it('should have all required indexes with correct naming', async () => {
    const indexes = await testDb.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'user_quotas'
      AND indexname LIKE 'idx%'
      ORDER BY indexname
    `);

    const indexNames = indexes.rows.map(r => r.indexname);
    expect(indexNames).toEqual([
      'idx_user_quotas_last_reset',
      'idx_user_quotas_user_period'
    ]);
  });
});
```

**Status:** ❌ Not yet implemented

---

### Layer 3: Migration Integration Tests

**What to Test:**
- Migrations run in correct order
- Migrations are idempotent (can run multiple times)
- Migrations can be rolled back (if designed for it)
- Migration checksums prevent modification
- Transaction rollback on errors

**Example Test:**

```javascript
describe('Migration Integration Tests', () => {
  let testDb;

  beforeEach(async () => {
    testDb = await createFreshDatabase();
  });

  afterEach(async () => {
    await dropTestDatabase(testDb);
  });

  it('should run all migrations successfully in order', async () => {
    const result = await runAllMigrations(testDb);

    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(5); // 000-004 migrations

    const appliedMigrations = await getAppliedMigrations(testDb);
    expect(appliedMigrations).toEqual([
      '000-create-migration-table',
      '001-create-users-table',
      '002-add-reset-token-fields',
      '003-create-usage-table',
      '004-fix-index-naming',
      '005-add-tier-tracking-columns'
    ]);
  });

  it('should be idempotent - safe to run multiple times', async () => {
    await runAllMigrations(testDb);
    const firstCount = await getTableCount(testDb, 'users');

    // Run again
    await runAllMigrations(testDb);
    const secondCount = await getTableCount(testDb, 'users');

    expect(firstCount).toBe(secondCount);
  });

  it('should rollback migration on error', async () => {
    const badMigration = `
      CREATE TABLE test1 (id SERIAL);
      INSERT INTO nonexistent_table VALUES (1); -- This will fail
      CREATE TABLE test2 (id SERIAL);
    `;

    await expect(runMigration(testDb, badMigration)).rejects.toThrow();

    // Verify rollback - neither table should exist
    const tables = await getTables(testDb);
    expect(tables).not.toContain('test1');
    expect(tables).not.toContain('test2');
  });

  it('should prevent running modified migrations', async () => {
    await runAllMigrations(testDb);

    // Simulate modifying a migration file
    const originalChecksum = await getChecksum(testDb, '001-create-users-table');
    const modifiedSQL = '/* modified */ CREATE TABLE users...';
    const newChecksum = calculateChecksum(modifiedSQL);

    expect(newChecksum).not.toBe(originalChecksum);

    // Validation should fail
    const validation = await validateMigrations(testDb);
    expect(validation.errors).toContain(
      'Migration 001-create-users-table has been modified'
    );
  });

  it('should track execution time for each migration', async () => {
    await runAllMigrations(testDb);

    const migrations = await getAppliedMigrations(testDb);
    migrations.forEach(migration => {
      expect(migration.execution_time_ms).toBeGreaterThan(0);
      expect(migration.execution_time_ms).toBeLessThan(10000); // Sanity check
    });
  });
});
```

**Status:** ❌ Not yet implemented

---

### Layer 4: Data Integrity Tests

**What to Test:**
- Foreign key constraints work correctly
- CHECK constraints enforce business rules
- Default values are applied
- NULL/NOT NULL constraints work
- Unique constraints prevent duplicates

**Example Test:**

```javascript
describe('Data Integrity Tests', () => {
  it('should enforce valid tier values with CHECK constraint', async () => {
    const validTiers = ['free', 'starter', 'pro', 'team', 'enterprise'];

    for (const tier of validTiers) {
      const user = await createUser({ tier });
      expect(user.tier).toBe(tier);
    }

    // Invalid tier should fail
    await expect(
      createUser({ tier: 'invalid_tier' })
    ).rejects.toThrow(/check constraint "check_valid_tier"/i);
  });

  it('should enforce positive quota counts', async () => {
    // Valid positive counts
    await createUserQuota({ daily_count: 5, monthly_count: 10 });

    // Negative counts should fail if CHECK constraint exists
    await expect(
      createUserQuota({ daily_count: -1, monthly_count: 10 })
    ).rejects.toThrow(/check constraint/i);
  });

  it('should prevent orphaned user_quotas records', async () => {
    // Try to create quota for non-existent user
    await expect(
      createUserQuota({ user_id: 99999 })
    ).rejects.toThrow(/foreign key constraint/i);
  });

  it('should apply default values correctly', async () => {
    const user = await createUser({ email: 'test@example.com' });

    expect(user.tier).toBe('free'); // Default tier
    expect(user.email_verified).toBe(false); // Default false
    expect(user.created_at).toBeDefined();
    expect(user.updated_at).toBeDefined();
  });
});
```

**Status:** ❌ Not yet implemented

---

### Layer 5: Performance & Index Tests

**What to Test:**
- Indexes are used for common queries
- Query performance meets benchmarks
- No N+1 query problems
- Index coverage for foreign keys

**Example Test:**

```javascript
describe('Performance & Index Tests', () => {
  beforeAll(async () => {
    await seedLargeDataset(testDb, { users: 10000, quotas: 10000 });
  });

  it('should use index for user email lookup', async () => {
    const plan = await testDb.query(`
      EXPLAIN (FORMAT JSON)
      SELECT * FROM users WHERE email = 'test@example.com'
    `);

    const scanType = plan.rows[0]['QUERY PLAN'][0].Plan['Node Type'];
    expect(scanType).toBe('Index Scan');
    expect(plan.rows[0]['QUERY PLAN'][0].Plan['Index Name']).toBe('idx_users_email');
  });

  it('should use composite index for quota lookups', async () => {
    const plan = await testDb.query(`
      EXPLAIN (FORMAT JSON)
      SELECT * FROM user_quotas
      WHERE user_id = 1 AND period_start_date = '2025-10-27'
    `);

    const indexName = plan.rows[0]['QUERY PLAN'][0].Plan['Index Name'];
    expect(indexName).toBe('idx_user_quotas_user_period');
  });

  it('should complete user quota query in under 100ms', async () => {
    const startTime = Date.now();

    await testDb.query(`
      SELECT uq.*, u.tier
      FROM user_quotas uq
      JOIN users u ON u.id = uq.user_id
      WHERE u.email = 'test@example.com'
      AND uq.period_start_date = CURRENT_DATE
    `);

    const executionTime = Date.now() - startTime;
    expect(executionTime).toBeLessThan(100);
  });

  it('should have indexes on all foreign key columns', async () => {
    const foreignKeys = await testDb.query(`
      SELECT
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);

    for (const fk of foreignKeys.rows) {
      const hasIndex = await checkIndexExists(
        testDb,
        fk.table_name,
        fk.column_name
      );
      expect(hasIndex).toBe(true);
    }
  });
});
```

**Status:** ❌ Not yet implemented

---

## Test Database Setup

### Option 1: In-Memory SQLite (Fast, Limited)

**Pros:**
- ✅ Fast startup (milliseconds)
- ✅ No external dependencies
- ✅ Parallel test execution

**Cons:**
- ❌ Not PostgreSQL (syntax differences)
- ❌ Limited feature support
- ❌ Not production-like

**Not recommended for our project** - We use PostgreSQL-specific features

---

### Option 2: Dockerized PostgreSQL (Recommended)

**Pros:**
- ✅ Exact same database as production
- ✅ Isolated test environment
- ✅ Easy cleanup
- ✅ Parallel databases for concurrent tests

**Cons:**
- ⚠️ Slower startup (~2-5 seconds)
- ⚠️ Requires Docker installed

**Setup:**

```bash
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:16
    environment:
      POSTGRES_DB: codescribe_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # In-memory for speed
```

**Jest Setup:**

```javascript
// server/tests/setup.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function setupTestDatabase() {
  // Start Docker container
  await execAsync('docker-compose -f docker-compose.test.yml up -d');

  // Wait for PostgreSQL to be ready
  await waitForPostgres('postgresql://test_user:test_password@localhost:5433/codescribe_test');

  // Run migrations
  process.env.POSTGRES_URL = 'postgresql://test_user:test_password@localhost:5433/codescribe_test';
  await runMigrations();
}

export async function teardownTestDatabase() {
  await execAsync('docker-compose -f docker-compose.test.yml down -v');
}
```

---

### Option 3: Neon Branching (Production-Like)

**Pros:**
- ✅ Exact production environment
- ✅ Branch per PR
- ✅ Easy preview deployments

**Cons:**
- ❌ Requires Neon account
- ❌ API rate limits
- ❌ Network latency

**When to Use:**
- E2E tests in CI/CD
- Preview deployments
- Production-like testing

---

## Migration Testing Strategy

### Required Tests for Each Migration

**Before Creating Migration:**
- [ ] Unit test for migration logic (if complex)
- [ ] Schema validation test
- [ ] Data integrity test
- [ ] Performance test (if adding indexes)

**Before Deploying Migration:**
- [ ] Test on fresh database
- [ ] Test on database with existing data
- [ ] Test idempotency (run twice)
- [ ] Test rollback (if reversible)
- [ ] Validate checksums
- [ ] Review execution time

**Example Test Template:**

```javascript
describe('Migration 005: Add Tier Tracking Columns', () => {
  let testDb;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    await runMigrationsUpTo('004'); // Run up to previous migration
  });

  afterEach(async () => {
    await dropTestDatabase(testDb);
  });

  it('should add tier_updated_at column', async () => {
    await runMigration('005');

    const column = await getColumn(testDb, 'users', 'tier_updated_at');
    expect(column).toMatchObject({
      data_type: 'timestamp without time zone',
      column_default: 'now()',
      is_nullable: 'YES'
    });
  });

  it('should add previous_tier column', async () => {
    await runMigration('005');

    const column = await getColumn(testDb, 'users', 'previous_tier');
    expect(column).toMatchObject({
      data_type: 'character varying',
      is_nullable: 'YES'
    });
  });

  it('should add CHECK constraint for valid tiers', async () => {
    await runMigration('005');

    const constraint = await getConstraint(testDb, 'users', 'check_valid_tier');
    expect(constraint).toBeDefined();

    // Test valid tier
    await createUser({ tier: 'pro' }); // Should succeed

    // Test invalid tier
    await expect(
      createUser({ tier: 'invalid' })
    ).rejects.toThrow(/check_valid_tier/);
  });

  it('should backfill tier_updated_at for existing users', async () => {
    // Create user before migration
    const user = await createUser({ email: 'before@example.com' });
    expect(user.tier_updated_at).toBeUndefined();

    await runMigration('005');

    const updatedUser = await getUser(testDb, user.id);
    expect(updatedUser.tier_updated_at).toEqual(updatedUser.created_at);
  });

  it('should be idempotent', async () => {
    await runMigration('005');
    const firstSchema = await getTableSchema(testDb, 'users');

    await runMigration('005'); // Run again
    const secondSchema = await getTableSchema(testDb, 'users');

    expect(secondSchema).toEqual(firstSchema);
  });
});
```

---

## Test Suite Separation

### Current Implementation (October 28, 2025)

**Database tests are separated from the default test suite** to prevent failures in CI where migrations haven't been run.

### Jest Configuration

**Default Test Suite (`jest.config.cjs`):**
```javascript
testPathIgnorePatterns: [
  '/node_modules/',
  '/dist/',
  '/src/db/__tests__/', // Database tests excluded - run separately
],
```

**Database Test Suite (`jest.config.db.cjs`):**
```javascript
// Override to allow database tests
testPathIgnorePatterns: ['/node_modules/', '/dist/'],

testMatch: [
  '**/__tests__/**/migrations-*.test.js',
  '**/__tests__/**/db-*.test.js',
  '**/__tests__/**/schema-*.test.js'
],
```

### Running Tests

```bash
# Default test suite (NO database required)
npm test                     # 373 tests (excludes 65 database tests)

# Database tests ONLY (requires migrations applied)
npm run test:db              # 25 tests (migrations-004-005.test.js)

# With Docker setup
npm run test:db:setup        # Start test database
npm run migrate              # Run migrations
npm run test:db              # Run database tests
npm run test:db:teardown     # Stop test database
```

### Why This Separation?

1. **CI/CD Compatibility**: GitHub Actions runs unit tests without a database
2. **Fast Feedback**: Default test suite runs in ~7s without database overhead
3. **Explicit Control**: Database tests only run when explicitly requested
4. **Local Development**: Developers can run full suite after running migrations

### File Structure

```
server/src/db/__tests__/
├── README.md                        # Database test documentation
├── helpers/
│   ├── setup.js                     # Test database connection
│   ├── jest-setup.js                # Jest configuration
│   └── load-env.js                  # Load .env.test
└── migrations-004-005.test.js       # Migration integration tests (25 tests)
```

### Current Test Stats

**Default Suite (`npm test`):**
- Test Suites: 15 passed, 1 skipped (database tests)
- Tests: 373 passed, 21 skipped (database tests)
- Time: ~7s

**Database Suite (`npm run test:db`):**
- Test Suites: 1 passed
- Tests: 25 passed (all migration 004-005 tests)
- Time: ~0.25s (with pre-applied migrations)

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Database Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: codescribe_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd server && npm install

      - name: Run migrations
        env:
          POSTGRES_URL: postgresql://test_user:test_password@localhost:5432/codescribe_test
        run: cd server && npm run migrate

      - name: Run database tests
        env:
          POSTGRES_URL: postgresql://test_user:test_password@localhost:5432/codescribe_test
        run: cd server && npm run test:db

      - name: Validate migration checksums
        env:
          POSTGRES_URL: postgresql://test_user:test_password@localhost:5432/codescribe_test
        run: cd server && npm run migrate:validate
```

---

## Testing Tools & Frameworks

### Recommended Stack

1. **Jest** - Test runner
2. **@databases/pg-test** - PostgreSQL test utilities
3. **Docker** - Isolated test databases
4. **faker-js** - Test data generation

### Installation

```bash
npm install --save-dev @databases/pg-test
```

### Helper Utilities

```javascript
// server/tests/helpers/db.js
export async function createTestDatabase() {
  const db = await createDatabase({
    migrationsFolder: './src/db/migrations'
  });
  return db;
}

export async function seedTestData(db, options = {}) {
  const userCount = options.users || 10;
  const quotaCount = options.quotas || 10;

  for (let i = 0; i < userCount; i++) {
    await createUser(db, {
      email: `user${i}@example.com`,
      tier: ['free', 'pro', 'enterprise'][i % 3]
    });
  }

  for (let i = 0; i < quotaCount; i++) {
    await createUserQuota(db, {
      user_id: (i % userCount) + 1,
      daily_count: Math.floor(Math.random() * 100),
      monthly_count: Math.floor(Math.random() * 1000)
    });
  }
}
```

---

## Implementation Checklist

### Immediate (Priority 1)

- [ ] Create `server/tests/setup.js` for test database configuration
- [ ] Add Docker Compose file for test PostgreSQL
- [ ] Create migration integration tests (`migration-integration.test.js`)
- [ ] Create schema validation tests (`schema-validation.test.js`)
- [ ] Add data integrity tests for new migrations (004, 005)

### Short-term (Priority 2)

- [ ] Add performance tests for indexed queries
- [ ] Create test data seeding utilities
- [ ] Add GitHub Actions workflow for database tests
- [ ] Document test database setup in README

### Long-term (Priority 3)

- [ ] Add migration rollback tests
- [ ] Performance benchmarking suite
- [ ] Load testing with realistic data volumes
- [ ] Schema drift detection

---

## Summary

### Current Status

✅ **Unit Tests:** 479 tests in `migrate.test.js` (migration logic, checksums, validation)
❌ **Schema Tests:** Not yet implemented
❌ **Integration Tests:** Not yet implemented
❌ **Performance Tests:** Not yet implemented

### Recommended Next Steps

1. Set up Docker-based test database
2. Implement schema validation tests for migrations 004 & 005
3. Add data integrity tests for tier system constraints
4. Integrate into CI/CD pipeline

### Industry Standards We're Following

- ✅ Test pyramid (unit → integration → E2E)
- ✅ Isolated test environments (Docker)
- ✅ Migration validation (checksums)
- ✅ Idempotency testing
- ⚠️ Schema validation (pending)
- ⚠️ Performance testing (pending)

---

**References:**
- [Strong Migrations (Ruby/Rails)](https://github.com/ankane/strong_migrations)
- [Flyway Best Practices](https://documentation.red-gate.com/fd/best-practices-184127474.html)
- [PostgreSQL Testing Best Practices](https://www.postgresql.org/docs/current/regress.html)
- [Martin Fowler - Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)

---

**Version:** 1.0
**Last Updated:** October 27, 2025
**Status:** Active - Implementation in progress
