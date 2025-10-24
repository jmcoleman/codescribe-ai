# Neon Postgres Setup Guide

**Project:** CodeScribe AI
**Database:** Neon (via Vercel Marketplace)
**Status:** Production Ready
**Last Updated:** October 24, 2025

---

## Overview

This guide covers setting up Neon Postgres for CodeScribe AI's authentication and usage tracking features. Neon is a serverless Postgres database that integrates seamlessly with Vercel through the Marketplace.

**Why Neon:**
- **Always-free tier** (no credit card required)
- **20 projects, 10 branches** (great for dev/staging/prod)
- **Vercel-native integration** (automatic provisioning, unified billing)
- **Advanced features** (database branching, point-in-time recovery, instant restore)
- **Generous limits** (0.5 GiB storage, unlimited compute on primary branch)

**Prerequisites:**
- Vercel account with project deployed
- `@vercel/postgres` package (already installed - works with Neon!)
- Node.js 20+

---

## Quick Start

### 1. Create Neon Database via Vercel Marketplace

**Via Vercel Marketplace:**

1. Navigate to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **codescribe-ai** project
3. Click **Storage** tab or **Marketplace** in the navigation
4. Find **Neon** (or search "Neon Postgres")
5. Click **Add Integration** or **Connect**
6. Choose your Neon plan:
   - **Free** - 512 MB storage, 20 projects, 10 branches (recommended to start)
   - **Launch** ($19/mo) - 3 GiB storage, database branching, point-in-time restore
   - **Scale** ($69/mo) - 10 GiB storage, higher throughput, advanced monitoring
   - **Business** ($700/mo) - Enterprise features, compliance, dedicated support
7. Choose a database name (e.g., `codescribe-db`)
8. Select a region (choose closest to your deployment region for best performance)
9. Click **Create Database** or **Continue**
10. Select which Vercel projects to connect (choose your **codescribe-ai** project)
11. Click **Continue** to authorize the integration

**Region Recommendations:**
- **US East (AWS us-east-2)** - East Coast users, lowest latency
- **US West (AWS us-west-2)** - West Coast users
- **Europe West (AWS eu-west-1)** - European users

**Note:** After creation, Vercel automatically injects the database connection strings as environment variables into your selected projects. Neon billing is handled through Vercel for seamless integration.

### 2. Get Connection Strings

After creation, Vercel provides connection strings automatically. You'll see these environment variables:

| Variable | Purpose | Usage |
|----------|---------|-------|
| `POSTGRES_URL` | Pooled connection | General queries (recommended) |
| `POSTGRES_PRISMA_URL` | PgBouncer connection | Prisma/ORM usage |
| `POSTGRES_URL_NON_POOLING` | Direct connection | Migrations, schema changes |
| `POSTGRES_USER` | Database username | Manual connection config |
| `POSTGRES_HOST` | Database host | Manual connection config |
| `POSTGRES_PASSWORD` | Database password | Manual connection config |
| `POSTGRES_DATABASE` | Database name | Manual connection config |

**Note:** These are automatically added to your Vercel project environment variables.

---

## Local Development Setup

### 3. Configure Environment Variables

Copy connection strings from Vercel dashboard to your local environment:

**Update [server/.env](../../server/.env):**

```bash
# Database Configuration (Neon via Vercel Marketplace)
# Copy these values from Vercel Dashboard → Storage → Neon → .env.local tab
POSTGRES_URL="postgres://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb"
POSTGRES_PRISMA_URL="postgres://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb"
POSTGRES_USER="username"
POSTGRES_HOST="ep-xxx-xxx.us-east-2.aws.neon.tech"
POSTGRES_PASSWORD="password"
POSTGRES_DATABASE="neondb"

# Enable authentication features
ENABLE_AUTH=true

# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

**Security Best Practices:**
- Never commit `.env` files to git
- Use different secrets for development/production
- Generate strong secrets: `openssl rand -base64 32`

### 4. Quick Copy from Vercel Dashboard

**Fastest Method:**

1. Vercel Dashboard → Storage tab
2. Click on your **Neon** database
3. Click **`.env.local`** tab (or **Quickstart** tab)
4. Click **Copy Snippet** to copy all connection strings
5. Paste into your `server/.env` file
6. Add `ENABLE_AUTH=true` and auth secrets (JWT_SECRET, SESSION_SECRET)

**Note:** The `@vercel/postgres` SDK works seamlessly with Neon - no code changes needed!

---

## Database Schema Initialization

### 5. Automatic Schema Setup

Your database schema is defined in [server/src/db/connection.js](../../server/src/db/connection.js). The schema includes:

**Tables:**
1. **users** - User accounts and authentication
2. **session** - Express session storage (connect-pg-simple)
3. **usage** - Usage tracking and analytics

**Initialization Methods:**

**Option A: Automatic on Server Start (Recommended)**

The database initializes automatically when your server starts (if `ENABLE_AUTH=true`). Check your server startup file.

**Option B: Manual Initialization**

Run this command to initialize schema manually:

```bash
node -e "import('./server/src/db/connection.js').then(db => db.initializeDatabase())"
```

**Option C: Via npm Script**

Add to [server/package.json](../../server/package.json):

```json
"scripts": {
  "db:init": "node -e \"import('./server/src/db/connection.js').then(db => db.initializeDatabase())\"",
  "db:test": "node -e \"import('./server/src/db/connection.js').then(db => db.testConnection())\""
}
```

Then run:
```bash
cd server
npm run db:init
```

### 6. Database Schema Details

**users table:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  github_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github_id ON users(github_id);
```

**session table:**
```sql
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_session_expire ON session(expire);
```

**usage table:**
```sql
CREATE TABLE usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_user_id ON usage(user_id);
CREATE INDEX idx_usage_created_at ON usage(created_at);
```

---

## Testing Connection

### 7. Verify Database Connection

**Test connection:**
```bash
node -e "import('./server/src/db/connection.js').then(db => db.testConnection())"
```

**Expected output:**
```
✅ Database connection successful: 2025-10-24T12:34:56.789Z
```

**If connection fails:**
- Verify environment variables are set correctly
- Check network connectivity
- Confirm database is running in Vercel dashboard
- Verify region matches your deployment

---

## Server Configuration

### 8. Session Store Setup

Your server already has `connect-pg-simple` installed. Configure session storage:

**Example configuration (Express):**

```javascript
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { sql } from '@vercel/postgres';

const app = express();
const PgSession = connectPgSimple(session);

// Session middleware
app.use(session({
  store: new PgSession({
    pool: sql,
    tableName: 'session',
    createTableIfMissing: false  // Already created by initializeDatabase
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
    sameSite: 'lax'
  }
}));
```

**Session Configuration Options:**
- `secure: true` - Require HTTPS (production)
- `httpOnly: true` - Prevent XSS attacks
- `sameSite: 'lax'` - CSRF protection
- `maxAge` - Session expiration time

### 9. Database Connection in Code

**Import and use:**

```javascript
import { sql, testConnection, initializeDatabase } from './db/connection.js';

// Test connection on startup
await testConnection();

// Initialize schema (if needed)
await initializeDatabase();

// Query examples
const users = await sql`SELECT * FROM users WHERE tier = 'free'`;
const user = await sql`SELECT * FROM users WHERE email = ${email}`;

// Insert
await sql`
  INSERT INTO users (email, password_hash, tier)
  VALUES (${email}, ${passwordHash}, 'free')
`;

// Update
await sql`
  UPDATE users
  SET tier = ${newTier}, updated_at = NOW()
  WHERE id = ${userId}
`;
```

---

## Production Deployment

### 10. Vercel Production Setup

**Environment Variables:**

Vercel automatically injects Postgres environment variables into your production deployment. No manual configuration needed!

**Verify in Dashboard:**
1. Project Settings → Environment Variables
2. Confirm all `POSTGRES_*` variables are present
3. Add custom variables (JWT_SECRET, SESSION_SECRET, ENABLE_AUTH)

**Required Production Environment Variables:**
```
ENABLE_AUTH=true
JWT_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>
GITHUB_CLIENT_ID=<your-github-oauth-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-secret>
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback
CLIENT_URL=https://yourdomain.com
```

### 11. Deployment Checklist

- [ ] Database created in Vercel dashboard
- [ ] Connection strings copied to local `.env`
- [ ] `ENABLE_AUTH=true` set
- [ ] Schema initialized successfully
- [ ] Connection test passes
- [ ] Production environment variables configured
- [ ] Session store configured
- [ ] Authentication routes working
- [ ] User model integrated

---

## Database Management

### 12. Neon Console Features

**Via Vercel Dashboard:**
- Click **Storage** → Your Neon database
- Click **Open in Neon** to access advanced features

**Neon Console Features:**

**Tables Tab:**
- View/edit tables directly
- Browse table contents with SQL
- Create indexes and constraints

**SQL Editor Tab:**
- Run SQL queries with autocomplete
- Export query results
- Save and share queries
- Query history

**Branches Tab:**
- Create database branches (like git branches!)
- Test schema changes safely
- Point-in-time restore (Launch tier+)

**Monitoring Tab:**
- Connection statistics
- Query performance metrics
- Storage usage
- Compute hours breakdown

**Settings Tab:**
- Connection strings (all formats)
- Region and compute settings
- Delete database
- Scale resources

**Access:**
Vercel Dashboard → Storage → Neon database → **Open in Neon** button

### 13. Common Operations

**View all tables:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

**Count users:**
```sql
SELECT COUNT(*) FROM users;
```

**Check session expiry:**
```sql
SELECT COUNT(*) FROM session WHERE expire < NOW();
```

**View usage stats:**
```sql
SELECT
  operation_type,
  COUNT(*) as count,
  AVG(tokens_used) as avg_tokens
FROM usage
GROUP BY operation_type;
```

### 14. Maintenance Tasks

**Clean expired sessions:**

Your codebase includes a cleanup utility at [server/src/db/connection.js:85-96](../../server/src/db/connection.js#L85-L96):

```javascript
import { cleanupSessions } from './db/connection.js';

// Run periodically (e.g., daily cron job)
const deletedCount = await cleanupSessions();
console.log(`Deleted ${deletedCount} expired sessions`);
```

**Recommended schedule:**
- Daily cleanup via cron job or Vercel Cron
- Monitor storage usage weekly
- Review query performance monthly

---

## Performance Optimization

### 15. Connection Best Practices

**Use pooled connections:**
```javascript
// ✅ Good - Uses connection pooling
import { sql } from '@vercel/postgres';
const users = await sql`SELECT * FROM users`;
```

**Avoid non-pooled for queries:**
```javascript
// ❌ Bad - Uses direct connection unnecessarily
// Only use POSTGRES_URL_NON_POOLING for migrations
```

**Connection Types:**
- **Pooled** (`POSTGRES_URL`) - Default for all queries
- **Non-pooled** (`POSTGRES_URL_NON_POOLING`) - Schema changes only
- **PgBouncer** (`POSTGRES_PRISMA_URL`) - ORM usage (Prisma)

### 16. Query Optimization

**Existing indexes (already implemented):**
- `users(email)` - Fast email lookups
- `users(github_id)` - Fast OAuth lookups
- `session(expire)` - Fast cleanup queries
- `usage(user_id, created_at)` - Fast analytics

**Query tips:**
- Use parameterized queries (prevents SQL injection)
- Limit result sets with `LIMIT`
- Add indexes for frequently queried columns
- Monitor slow queries in Vercel dashboard

---

## Monitoring and Limits

### 17. Neon Plans and Limits

**Free Tier (Always Available, No Credit Card):**
| Resource | Limit | CodeScribe Usage Estimate |
|----------|-------|--------------------------|
| Storage | 0.5 GiB (512 MB) | 6-8 MB for 1K users, 50-70 MB for 10K users |
| Projects | 20 | Need 1-3 (dev/staging/prod) |
| Branches | 10 per project | 2-5 (feature branches) |
| Compute (primary) | Unlimited | Minimal (simple auth queries) |
| Compute (non-primary) | 5 hours/month | Only for testing |
| Written data | 512 MiB/month | <10 MiB (lightweight writes) |
| Max database size | 0.5 GiB | Plenty of headroom |

**Launch Tier ($19/month):**
| Resource | Limit | When You'd Need This |
|----------|-------|---------------------|
| Storage | 3 GiB per branch | 50K+ users |
| Projects | Unlimited | Multiple production apps |
| Branches | Unlimited | Heavy dev workflow |
| Compute | Unlimited all branches | Active feature development |
| Written data | 512 MiB/month | Same as Free |
| Point-in-time restore | 7 days | Production safety net |
| Database branching | ✅ Full support | Test schema changes |

**Scale Tier ($69/month):**
- 10 GiB storage, higher throughput
- Advanced monitoring and observability
- 30-day point-in-time restore
- Ideal for 200K+ users

**Business Tier ($700/month):**
- 100+ GiB storage, dedicated resources
- SOC 2, HIPAA compliance
- Private networking, SLAs
- Enterprise-scale workloads

**Monitoring:**
- Neon Console → Monitoring tab
- Track storage, compute, connections in real-time
- Usage alerts available (Launch tier+)

### 18. Scaling Considerations for CodeScribe AI

**Free Tier Runway:**
| User Count | Estimated Storage | Database Cost | Status |
|------------|------------------|---------------|--------|
| 0-10K | <100 MB | **Free** | ✅ Safe |
| 10K-50K | 100-350 MB | **Free** | ✅ Safe |
| 50K-100K | 350-500 MB | **Free** (approaching limit) | ⚠️ Monitor |
| 100K+ | >500 MB | **Launch $19/mo** | 💰 Upgrade time |

**When to upgrade to Launch ($19/mo):**
- Storage approaching 400+ MB (buffer for growth)
- Need database branching for preview deployments
- Want point-in-time restore (7-day safety net)
- 50,000+ registered users
- Revenue justifies infrastructure investment

**When to upgrade to Scale ($69/mo):**
- 200,000+ users with high activity
- Need advanced monitoring/observability
- 30-day point-in-time restore required
- Higher read/write throughput needs

**Optimization before upgrading:**
1. **Session cleanup** - Already implemented! ([connection.js:85-96](../../server/src/db/connection.js#L85-L96))
2. **Archive old usage data** - Move logs >90 days to cold storage
3. **Optimize queries** - Already indexed! (email, github_id, user_id, created_at)
4. **Usage tracking** - Only store essential metrics, not full request logs

**Cost Projections:**
- **First 50K users:** $0/month (Free tier)
- **50K-200K users:** $19/month (Launch tier)
- **200K+ users:** $69/month (Scale tier)

By the time you need Launch tier, you'll likely have monetization in place (see [Monetization Strategy](#monetization-strategy) below).

---

## Troubleshooting

### 19. Common Issues

**Connection Timeout:**
```
Error: Connection timeout
```
**Solution:**
- Check environment variables
- Verify database region matches deployment
- Use `POSTGRES_URL` (pooled) not `POSTGRES_URL_NON_POOLING`

**Max Connections:**
```
Error: Too many connections
```
**Solution:**
- Use connection pooling (default with `@vercel/postgres`)
- Close connections properly
- Check for connection leaks
- Consider upgrading tier

**Schema Initialization Fails:**
```
Error: relation "users" already exists
```
**Solution:**
- This is normal if schema already exists
- `CREATE TABLE IF NOT EXISTS` prevents this
- Verify with `testConnection()`

**Session Store Issues:**
```
Error: Unable to create/read session
```
**Solution:**
- Verify `session` table exists
- Check `SESSION_SECRET` is set
- Confirm `connect-pg-simple` configured correctly

### 20. Debug Commands

**Test connection:**
```bash
node -e "import('./server/src/db/connection.js').then(db => db.testConnection())"
```

**Check environment variables:**
```bash
node -e "console.log(process.env.POSTGRES_URL ? '✅ POSTGRES_URL set' : '❌ POSTGRES_URL missing')"
```

**View schema:**
```sql
-- Run in Vercel Dashboard → Query tab
\dt
\d users
\d session
\d usage
```

---

## Security Best Practices

### 21. Security Checklist

- [ ] Use environment variables for all credentials
- [ ] Never commit `.env` files to git
- [ ] Verify `.env` in `.gitignore`
- [ ] Use strong JWT and session secrets (32+ characters)
- [ ] Enable HTTPS-only cookies in production
- [ ] Parameterize all SQL queries (prevent injection)
- [ ] Implement rate limiting on auth endpoints
- [ ] Hash passwords with bcrypt (already implemented)
- [ ] Sanitize user inputs
- [ ] Regular security audits

### 22. Environment Variable Security

**Generate strong secrets:**
```bash
# JWT Secret
openssl rand -base64 32

# Session Secret
openssl rand -base64 32
```

**Verify .gitignore:**
```bash
git check-ignore server/.env
# Should output: server/.env
```

**Production secrets:**
- Use Vercel dashboard to set production secrets
- Never use development secrets in production
- Rotate secrets periodically (every 90 days)

---

## Integration Examples

### 23. User Model Integration

Your User model at [server/src/models/User.js](../../server/src/models/User.js) integrates with Postgres:

```javascript
import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

class User {
  static async create({ email, password, githubId }) {
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const result = await sql`
      INSERT INTO users (email, password_hash, github_id)
      VALUES (${email}, ${passwordHash}, ${githubId})
      RETURNING id, email, tier, created_at
    `;

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result.rows[0];
  }
}
```

### 24. Usage Tracking

Track API usage for tier enforcement:

```javascript
import { sql } from '@vercel/postgres';

async function trackUsage(userId, operationType, fileSize, tokensUsed) {
  await sql`
    INSERT INTO usage (user_id, operation_type, file_size, tokens_used)
    VALUES (${userId}, ${operationType}, ${fileSize}, ${tokensUsed})
  `;
}

async function getUserMonthlyUsage(userId) {
  const result = await sql`
    SELECT
      COUNT(*) as total_operations,
      SUM(tokens_used) as total_tokens
    FROM usage
    WHERE user_id = ${userId}
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  `;

  return result.rows[0];
}
```

---

## Next Steps

### 25. Post-Setup Tasks

After completing setup:

1. **Verify authentication flow** - Test signup, login, logout
2. **Check GitHub OAuth** - See [GITHUB-OAUTH-SETUP.md](../authentication/GITHUB-OAUTH-SETUP.md)
3. **Implement tier enforcement** - See [server/src/middleware/tierGate.js](../../server/src/middleware/tierGate.js)
4. **Set up monitoring** - Configure alerts in Vercel dashboard
5. **Test session persistence** - Verify sessions survive server restarts
6. **Performance testing** - Run load tests with authentication

### 26. Related Documentation

**Authentication:**
- [GITHUB-OAUTH-SETUP.md](../authentication/GITHUB-OAUTH-SETUP.md) - GitHub OAuth configuration
- [server/src/config/passport.js](../../server/src/config/passport.js) - Passport strategies
- [server/src/routes/auth.js](../../server/src/routes/auth.js) - Auth endpoints

**Testing:**
- [docs/testing/AUTH-TESTS.md](../testing/AUTH-TESTS.md) - Authentication test suite
- [docs/testing/AUTH-SECURITY-TESTS.md](../testing/AUTH-SECURITY-TESTS.md) - Security tests
- [docs/api/AUTH-API-TESTING.md](../api/AUTH-API-TESTING.md) - API testing guide

**Deployment:**
- [MVP-DEPLOY-LAUNCH.md](./MVP-DEPLOY-LAUNCH.md) - Production deployment
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Pre-launch checklist

---

## Support and Resources

**Vercel Documentation:**
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Postgres SDK](https://vercel.com/docs/storage/vercel-postgres/sdk)
- [Vercel Postgres Quickstart](https://vercel.com/docs/storage/vercel-postgres/quickstart)

**Package Documentation:**
- [@vercel/postgres npm](https://www.npmjs.com/package/@vercel/postgres)
- [connect-pg-simple](https://www.npmjs.com/package/connect-pg-simple)
- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)

**CodeScribe AI:**
- Main docs: [CLAUDE.md](../../CLAUDE.md)
- Architecture: [docs/architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md)
- API Reference: [docs/api/API-Reference.md](../api/API-Reference.md)

---

## Changelog

- **v1.1** (October 24, 2025) - Updated database creation workflow
  - Corrected Step 1: Postgres is added via Marketplace, not direct Storage tab
  - Updated dashboard navigation paths for current Vercel interface
  - Expanded Data/Query/Insights tab descriptions
  - Clarified automatic environment variable injection
- **v1.0** (October 24, 2025) - Initial Vercel Postgres setup guide
  - Database creation and configuration
  - Schema initialization
  - Session store setup
  - Production deployment
  - Security best practices
  - Troubleshooting guide

---

**Questions?** Check the [troubleshooting section](#19-common-issues) or refer to [Vercel Postgres documentation](https://vercel.com/docs/storage/vercel-postgres).
