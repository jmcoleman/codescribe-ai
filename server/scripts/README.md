# Server Scripts

This directory contains utility scripts for development, testing, and database management.

## Scripts Overview

| Script | Purpose | Command | Environment |
|--------|---------|---------|-------------|
| [reset-dev-user.js](#reset-dev-userjs) | Reset or delete user data | `npm run reset:user <email>` | Development only |
| [prompt-caching-manual.js](#prompt-caching-manualjs) | Test prompt caching implementation | `node server/scripts/prompt-caching-manual.js` | Development/Testing |
| [test-pg-connection.cjs](#test-pg-connectioncjs) | Verify PostgreSQL connection | `node server/scripts/test-pg-connection.cjs` | Development/Testing |

---

## reset-dev-user.js

**Purpose:** Reset user quotas or completely delete a user account and all related data from the development database.

**Location:** `server/scripts/reset-dev-user.js`

### Usage

```bash
# Delete user and all related data
npm run reset:user <email>

# Reset quotas only (keep user account)
npm run reset:user <email> -- --quotas-only
```

**Note:** Can be run from either root directory or `server/` directory. The `--` separator is required when passing flags from the root.

### Examples

```bash
# Delete user john@example.com and all data
npm run reset:user john@example.com

# Reset only usage quotas for john@example.com (from root)
npm run reset:user john@example.com -- --quotas-only

# Or run from server directory (no extra -- needed)
cd server && npm run reset:user john@example.com --quotas-only
```

### Options

- `--quotas-only` - Only reset usage quotas, keep user account intact

### What It Does

**Full Reset (without `--quotas-only`):**
1. Finds user by email
2. Displays user information (ID, tier, email verification status, auth method, created date)
3. Shows data that will be deleted:
   - User quotas
   - Sessions
   - User account
4. Deletes all data (cascades to user_quotas via foreign key)

**Quotas Only (`--quotas-only`):**
1. Finds user by email
2. Displays user information
3. Deletes only user_quotas records
4. Keeps user account and sessions intact

### Safety Features

- ✅ **Production Protection:** Refuses to run if `POSTGRES_URL` contains "prod" or "production"
- ✅ **Email Validation:** Requires valid email address argument
- ✅ **Confirmation Display:** Shows what will be deleted before execution
- ✅ **Colored Terminal Output:** Clear visual feedback with color-coded messages
- ✅ **Error Handling:** Graceful error messages and exit codes

### Output

```bash
🗄️  Reset Dev User Data

Email: john@example.com
Mode:  Delete user and all data
DB:    postgresql://user:pass@host/database...

✅ User found:
   ID:       123
   Tier:     free
   Verified: Yes
   Auth:     Email/Password
   Created:  1/15/2024, 10:30:00 AM

📊 Data to be deleted:
   User quotas: 3 record(s)
   Sessions:    2 record(s)
   User:        1 record

⏳ Deleting user and all related data...
✅ Successfully deleted user and all related data

✨ Operation completed successfully!
```

### When to Use

- Testing authentication flows
- Resetting usage quotas during development
- Cleaning up test accounts
- Debugging subscription/tier changes
- Testing account deletion flows

---

## prompt-caching-manual.js

**Purpose:** Manual testing script to verify prompt caching implementation and measure cost savings.

**Location:** `server/scripts/prompt-caching-manual.js`

### Usage

```bash
node server/scripts/prompt-caching-manual.js
```

### What It Does

Runs three sequential tests to verify prompt caching behavior:

1. **Test 1: Cache Creation**
   - Generates documentation with default code
   - Creates cache for system prompt and user message
   - Expected: `cache_creation_input_tokens > 0` in logs

2. **Test 2: Cache Hit** (after 2-second delay)
   - Generates documentation with same code
   - Uses cached prompts (90% cost savings)
   - Expected: `cache_read_input_tokens > 0` in logs

3. **Test 3: Partial Cache Hit**
   - Generates documentation with different code
   - Uses cached system prompt only
   - Expected: `cache_read_input_tokens` for system prompt

### Output

```bash
🧪 Testing prompt caching implementation...

📝 Test 1: First generation (cache creation)
Expected: cache_creation_input_tokens > 0
✅ Test 1 passed - Documentation generated
   Metadata: {
     "usage": { ... },
     "cache_creation_input_tokens": 2000
   }

⏱️  Waiting 2 seconds before second generation...

📝 Test 2: Second generation (cache hit)
Expected: cache_read_input_tokens > 0
✅ Test 2 passed - Documentation generated
   Metadata: {
     "usage": { ... },
     "cache_read_input_tokens": 2000
   }

✨ Prompt caching tests complete!

📊 Summary:
- Test 1: Should show cache_creation_input_tokens in logs
- Test 2: Should show cache_read_input_tokens in logs (90% cost savings!)
- Test 3: Should show cache_read_input_tokens for system prompt only
```

### When to Use

- Verifying prompt caching after code changes
- Measuring cost savings from caching
- Debugging cache behavior
- Testing cache TTL (1-hour duration)
- Validating cache detection logic

### Related Documentation

See [PROMPT-CACHING-GUIDE.md](../../docs/architecture/PROMPT-CACHING-GUIDE.md) for:
- Caching strategy and implementation
- Cost savings analysis ($100-400/month)
- Adding new cacheable examples
- Cache monitoring and performance

---

## test-pg-connection.cjs

**Purpose:** Quick health check script to verify PostgreSQL database connectivity.

**Location:** `server/scripts/test-pg-connection.cjs`

### Usage

```bash
node server/scripts/test-pg-connection.cjs
```

### What It Does

1. Loads environment from `.env.test`
2. Attempts connection using `POSTGRES_URL`
3. Runs simple `SELECT 1` query
4. Reports success or failure with error details

### Output

**Success:**
```bash
🔌 Testing connection to: postgresql://user:pass@host/database
✅ Connection successful: [ { test: 1 } ]
```

**Failure:**
```bash
🔌 Testing connection to: postgresql://user:pass@host/database
❌ Connection failed: connection timeout
Full error: [Error details...]
```

### When to Use

- Troubleshooting database connection issues
- Verifying environment variables are correct
- Testing network connectivity to database
- Debugging SSL/TLS connection problems
- Quick sanity check before running migrations

### Exit Codes

- `0` - Connection successful
- `1` - Connection failed

### Notes

- Uses `.env.test` by default (can be modified in script)
- CommonJS format (`.cjs`) for maximum compatibility
- Minimal dependencies (@vercel/postgres, dotenv)

---

## Common Workflows

### Testing Database Changes

1. Reset user data: `npm run reset:user test@example.com`
2. Test connection: `node server/scripts/test-pg-connection.cjs`
3. Run migrations: `npm run migrate`
4. Validate: `npm run migrate:validate`

### Verifying Prompt Caching

1. Run caching test: `node server/scripts/prompt-caching-manual.js`
2. Check logs for cache statistics
3. Verify cost savings in Claude API dashboard

### Debugging Authentication Issues

1. Check connection: `node server/scripts/test-pg-connection.cjs`
2. Reset user quotas: `npm run reset:user user@example.com -- --quotas-only`
3. Or delete account: `npm run reset:user user@example.com`
4. Test sign up/login flow

---

## Environment Variables

All scripts use environment variables from `.env` (or `.env.test` for test-pg-connection.cjs):

- `POSTGRES_URL` - PostgreSQL connection string (required for reset-dev-user.js, test-pg-connection.cjs)
- `CLAUDE_API_KEY` - Anthropic API key (required for prompt-caching-manual.js)
- `NODE_ENV` - Environment identifier (development/test/production)

---

## Safety & Best Practices

### Production Protection

- **reset-dev-user.js** includes safety checks to prevent running on production databases
- Always verify `POSTGRES_URL` before running destructive operations
- Use `--quotas-only` flag when you only need to reset usage data

### Testing Workflow

1. Test in Docker sandbox first (see [DB-MIGRATION-MANAGEMENT.MD](../../docs/database/DB-MIGRATION-MANAGEMENT.MD))
2. Verify on development database
3. Never run reset scripts on production

### Monitoring

- Check script exit codes in CI/CD pipelines
- Monitor cache statistics for cost optimization
- Validate database connections before deployments

---

## Related Documentation

- [DB-MIGRATION-MANAGEMENT.MD](../../docs/database/DB-MIGRATION-MANAGEMENT.MD) - Database migration workflow
- [DB-NAMING-STANDARDS.md](../../docs/database/DB-NAMING-STANDARDS.md) - Database naming conventions
- [PROMPT-CACHING-GUIDE.md](../../docs/architecture/PROMPT-CACHING-GUIDE.md) - Prompt caching strategy
- [VERCEL-DEPLOYMENT-GUIDE.md](../../docs/deployment/VERCEL-DEPLOYMENT-GUIDE.md) - Production deployment
