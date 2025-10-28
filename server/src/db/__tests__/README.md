# Database Testing Guide

**Quick Start:** Run database tests with Docker PostgreSQL

---

## Prerequisites

- Docker installed and running
- Node.js 20+ installed

---

## Quick Start

### 1. Start Test Database

```bash
cd server
npm run test:db:setup
```

This will:
- Start PostgreSQL 16 in Docker container
- Use port 5433 (won't conflict with dev database)
- Create `codescribe_test` database
- Use tmpfs (in-memory) for fast tests

### 2. Run Database Tests

```bash
npm run test:db
```

This will:
- Auto-connect to test database
- Run migrations to set up schema
- Execute all database integration tests
- Report results

### 3. Stop Test Database (Optional)

```bash
npm run test:db:teardown
```

**Note:** You can leave the container running for faster subsequent test runs.

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run test:db` | Run all database tests |
| `npm run test:db:watch` | Run tests in watch mode |
| `npm run test:db:setup` | Start Docker PostgreSQL container |
| `npm run test:db:teardown` | Stop Docker container |
| `npm run test:db:reset` | Reset database (destroy & recreate) |

---

## Test Files

### Current Tests

- **`migrate.test.js`** - Unit tests for migration system (no DB required)
- **`migrations-004-005.test.js`** - Integration tests for migrations 004-005 (DB required)

### Test Helpers

Located in `helpers/`:
- `setup.js` - Database setup/teardown utilities
- `load-env.js` - Environment variable loader
- `jest-setup.js` - Jest global setup

---

## Configuration

### Test Database Connection

File: `server/.env.test`

```bash
POSTGRES_URL=postgresql://test_user:test_password@localhost:5433/codescribe_test
NODE_ENV=test
```

### Docker Configuration

File: `server/docker-compose.test.yml`

- **Image:** postgres:16
- **Port:** 5433 (host) → 5432 (container)
- **Database:** codescribe_test
- **User:** test_user
- **Password:** test_password
- **Storage:** tmpfs (in-memory for speed)

---

## Writing Database Tests

### Example Test

```javascript
import { sql } from '@vercel/postgres';
import { createTestUser, deleteTestUser } from './helpers/setup.js';

describe('My Database Test', () => {
  let testUserId;

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await deleteTestUser(testUserId);
      testUserId = null;
    }
  });

  it('should create user with default tier', async () => {
    const user = await createTestUser();
    testUserId = user.id;

    expect(user.tier).toBe('free');
    expect(user.created_at).toBeDefined();
  });

  it('should enforce unique email constraint', async () => {
    const email = 'test@example.com';

    await createTestUser({ email });

    await expect(
      createTestUser({ email })
    ).rejects.toThrow(/unique constraint/i);
  });
});
```

### Test Helpers Available

```javascript
import {
  startTestDatabase,      // Start Docker container
  stopTestDatabase,       // Stop Docker container
  resetTestDatabase,      // Clear all data
  runTestMigrations,      // Run migrations
  createTestUser,         // Create test user
  createTestQuota,        // Create test quota
  deleteTestUser,         // Delete user (cascades)
  cleanupTestData         // Delete all test users
} from './helpers/setup.js';
```

---

## Troubleshooting

### Port 5433 Already in Use

```bash
# Check what's using the port
lsof -i :5433

# Stop any existing container
npm run test:db:teardown
```

### Database Connection Timeout

```bash
# Check container status
docker ps | grep codescribe-test-db

# Check container logs
docker logs codescribe-test-db

# Restart container
npm run test:db:reset
```

### Migrations Not Applied

```bash
# Manually run migrations
cd server
source .env.test
npm run migrate
```

### Container Won't Start

```bash
# Check Docker is running
docker ps

# Remove orphaned containers
docker-compose -f docker-compose.test.yml down -v

# Start fresh
npm run test:db:reset
```

---

## CI/CD Integration

### GitHub Actions Example

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

      - name: Run database tests
        env:
          POSTGRES_URL: postgresql://test_user:test_password@localhost:5432/codescribe_test
        run: cd server && npm run test:db
```

---

## Best Practices

1. **Always clean up test data** - Use `afterEach` to delete test records
2. **Use transactions when possible** - Faster rollback than DELETE
3. **Run tests sequentially** - Avoid race conditions (already configured)
4. **Use descriptive test data** - Prefix emails with `test-` for easy cleanup
5. **Test constraints** - Verify foreign keys, unique constraints work
6. **Test indexes** - Use EXPLAIN to verify index usage
7. **Keep tests fast** - Use tmpfs, avoid unnecessary waits

---

## Performance Tips

1. **Leave container running** between test runs (faster startup)
2. **Use tmpfs** for in-memory storage (already configured)
3. **Run specific test files** instead of all tests:
   ```bash
   npm run test:db -- migrations-004-005
   ```
4. **Use watch mode** for development:
   ```bash
   npm run test:db:watch
   ```

---

## References

- [DATABASE-TESTING-GUIDE.md](../../../../docs/testing/DATABASE-TESTING-GUIDE.md) - Comprehensive guide
- [DB-NAMING-STANDARDS.md](../../../../docs/database/DB-NAMING-STANDARDS.md) - Naming conventions
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Jest Configuration](https://jestjs.io/docs/configuration)

---

**Last Updated:** October 27, 2025
**Status:** Active - Ready for use
