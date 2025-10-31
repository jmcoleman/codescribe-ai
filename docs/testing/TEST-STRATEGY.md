# Test Strategy

**Purpose:** Define testing approach for local development and CI/CD
**Last Updated:** October 31, 2025 (v2.4.0)

---

## 🎯 Testing Philosophy

**Two-Step Local Testing Strategy:**
1. **Docker DB (Fresh Install)** - Validates migrations work for new installations
2. **Dev DB (Incremental Upgrade)** - Validates migrations work for existing databases

**CI/CD Strategy:**
- Run non-database tests only (fast, no infrastructure needed)
- Database tests must pass locally before merging to main

---

## 🏗️ Test Architecture

### Test Categories

| Category | Location | Database | Runs In CI | Count |
|----------|----------|----------|------------|-------|
| **Unit Tests** | `src/services/__tests__/` | No DB (mocked) | ✅ Yes | ~100 |
| **Integration Tests (DB)** | `src/models/__tests__/`, `src/routes/__tests__/` | Real DB required | ❌ No (skipped) | ~400 |
| **Database Schema Tests** | `src/db/__tests__/` | Docker DB required | ❌ No (excluded) | ~40 |
| **Frontend Tests** | `client/src/**/__tests__/` | No DB | ✅ Yes | ~1,100 |

### Database Test Suites (Skipped in CI)

These 8 test suites require a real database connection and skip in GitHub Actions:

1. **User Model** (`src/models/__tests__/User.test.js`) - 68 tests
2. **Usage Model** (`src/models/__tests__/Usage.test.js`) - 28 tests
3. **Subscription Model** (`src/models/__tests__/Subscription.test.js`) - 16 tests
4. **Email Verification Routes** (`src/routes/__tests__/email-verification.test.js`) - 27 tests
5. **Migration Endpoints** (`src/routes/__tests__/migrate.test.js`) - 10 tests
6. **Payment Routes** (`src/routes/__tests__/payments.test.js`) - 18 tests
7. **Webhook Handler** (`src/routes/__tests__/webhooks.test.js`) - 23 tests
8. **OAuth Routes** (`src/routes/__tests__/oauth.test.js`) - 22 tests

**Total:** 212 tests skip in CI, must pass locally before merge

---

## 🔬 Local Testing (Two-Step Process)

### Step 1: Docker DB Tests (Fresh Install Validation)

**Purpose:** Validates migrations work for new installations with clean database state

```bash
# 1. Start Docker test database
cd server
npm run test:db:setup

# 2. Run all tests (including database tests)
npm test

# Expected: 522 passing, 21 skipped, 0 failing
```

**What this validates:**
- ✅ Migrations work from scratch (fresh install scenario)
- ✅ Database schema is correct
- ✅ Models work with PostgreSQL
- ✅ Route handlers interact correctly with database
- ✅ Test data isolation (Docker resets between runs)

**Database Used:** Docker PostgreSQL at `localhost:5432/test_db`
- User: `test`
- Password: `test`
- Port: `5432`

### Step 2: Dev DB Tests (Incremental Upgrade Validation)

**Purpose:** Validates migrations work for existing databases with data

```bash
# 1. Ensure dev database is migrated to latest
npm run migrate

# 2. Set POSTGRES_URL to dev database
export POSTGRES_URL="your-neon-dev-db-url"

# 3. Run tests against dev database
npm test

# Expected: Same results as Docker tests
```

**What this validates:**
- ✅ Migrations work incrementally (upgrade scenario)
- ✅ Existing data isn't corrupted
- ✅ New columns/tables coexist with old data
- ✅ Real-world database performance

**Database Used:** Neon Postgres (dev environment)

### Step 3: Cleanup

```bash
# Stop Docker database
npm run test:db:teardown
```

---

## ☁️ CI/CD Testing (GitHub Actions)

### What Runs in CI

**Test Jobs:**
1. **Backend Unit Tests** - Services, middleware (no DB)
2. **Frontend Tests** - All React component tests
3. **Lint** - Code formatting checks
4. **Security** - Dependency vulnerability scan

**Environment Variables:**
```yaml
env:
  NODE_ENV: test
  CLAUDE_API_KEY: test-key-12345
  POSTGRES_URL: postgresql://test:test@localhost:5432/test_db  # Satisfies import requirement
  CI: true  # Triggers skipIfNoDb() helper
```

### What Gets Skipped

Database-dependent tests automatically skip via `skipIfNoDb()` helper:

```javascript
// In test setup (tests/helpers/setup.js)
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

global.skipIfNoDb = () => {
  if (isCI) {
    return describe.skip;  // Skip entire suite in CI
  }
  return describe;  // Run normally in local
};

// In test file
const describeOrSkip = skipIfNoDb();
describeOrSkip('User Model', () => {
  // Tests only run locally
});
```

**CI Test Results:** 331 passing, 212 skipped (database tests)

---

## 📋 Pre-Release Checklist

Before merging to `main` (triggers production deployment):

### Local Testing Requirements

- [ ] **Step 1 - Docker DB Tests:**
  ```bash
  cd server
  npm run test:db:setup
  npm test
  # Expect: 522 passing, 21 skipped, 0 failing
  ```

- [ ] **Step 2 - Dev DB Tests:**
  ```bash
  npm run migrate  # Update dev DB
  export POSTGRES_URL="neon-dev-url"
  npm test
  # Expect: Same results as Step 1
  ```

- [ ] **Frontend Tests:**
  ```bash
  cd client
  npm test
  # Expect: 1,104 passing, 15 skipped
  ```

- [ ] **Database Schema Tests (Optional but recommended):**
  ```bash
  cd server
  npm run test:db
  # Tests in src/db/__tests__/
  ```

### CI Requirements

- [ ] GitHub Actions passing (backend unit tests, frontend tests, lint, security)
- [ ] All database tests passing locally (developer verification)
- [ ] No new security vulnerabilities

---

## 🚀 Release Testing Workflow

**Pre-Release (Local):**
1. Run Docker DB tests → ✅ Pass
2. Run Dev DB tests → ✅ Pass
3. Commit changes

**Release (CI/CD):**
4. Push to `main` branch
5. GitHub Actions runs → ✅ Pass (non-DB tests only)
6. Vercel deployment triggers
7. Production migrations run (`npm run migrate` in build)
8. Production deployment completes

**Post-Release (Production):**
9. Manual verification:
   - Test signup/login
   - Test payment flow (test mode)
   - Test documentation generation
   - Check logs for errors

---

## 🔮 Future Improvements (Epic 6.4)

**Goal:** Run all tests in CI/CD without skipping database tests

**Options:**

### Option 1: GitHub Actions with PostgreSQL Service
```yaml
services:
  postgres:
    image: postgres:17
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test_db
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

**Pros:** Free, fast, integrated
**Cons:** Requires workflow changes

### Option 2: Neon Test Database
Create dedicated Neon test database for CI

**Pros:** Matches production environment
**Cons:** Costs money, requires secrets management

### Option 3: Docker Compose in CI
Run Docker container in GitHub Actions

**Pros:** Matches local development
**Cons:** Slower, more complex

**Recommendation:** Start with Option 1 (GitHub Actions PostgreSQL service)

---

## 📊 Test Metrics (v2.4.0)

### Local (Full Test Suite)
- **Total:** 543 tests
- **Passing:** 522 (96.1%)
- **Skipped:** 21 (database schema tests in `src/db/__tests__/`)
- **Failing:** 0
- **Coverage:** 95.81% backend, 98%+ frontend

### CI/CD (Non-Database Tests)
- **Total:** 543 tests
- **Passing:** 331 (60.9%)
- **Skipped:** 212 (database-dependent tests)
- **Failing:** 0
- **Runtime:** ~2-3 minutes

---

## 🛠️ Troubleshooting

### "Cannot read properties of undefined (reading 'rows')"

**Cause:** Test trying to use real database but no connection available

**Fix:** Ensure `skipIfNoDb()` wrapper is used:
```javascript
const describeOrSkip = skipIfNoDb();
describeOrSkip('Test Suite Name', () => {
  // tests here
});
```

### "Duplicate key value violates unique constraint"

**Cause:** Test isolation issue - previous test left data in database

**Fix:**
1. Use unique identifiers per test run (e.g., `testRunId = Date.now()`)
2. Add cleanup in `beforeEach` or `afterEach`
3. Reset Docker database: `npm run test:db:reset`

**Example Fix:**
```javascript
describe('Model Test', () => {
  let testRunId;

  beforeEach(async () => {
    testRunId = Date.now(); // Unique per test run
    // Create test data with unique IDs
    stripeSubscriptionId: `sub_test_${testRunId}`
  });
});
```

### Docker Database Not Starting

**Check:**
```bash
docker ps  # Should show codescribe-test-db
docker logs codescribe-test-db  # Check for errors
```

**Fix:**
```bash
npm run test:db:teardown
npm run test:db:setup
```

### Tests Pass Locally But Fail in CI

**Check:**
1. Is test wrapped in `skipIfNoDb()`? (Should skip in CI)
2. Is test importing real database? (Should be mocked in CI)
3. Check GitHub Actions logs for actual error

---

## 📚 Related Documentation

- [RELEASE-QUICKSTART.md](../deployment/RELEASE-QUICKSTART.md) - Release process checklist
- [SKIPPED-TESTS.md](./SKIPPED-TESTS.md) - Documentation of intentionally skipped tests
- [DB-MIGRATION-MANAGEMENT.MD](../database/DB-MIGRATION-MANAGEMENT.MD) - Database migration guide
- [frontend-testing-guide.md](./frontend-testing-guide.md) - Frontend testing patterns

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0
