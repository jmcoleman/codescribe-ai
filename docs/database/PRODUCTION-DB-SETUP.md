s # Production Database Setup Guide

**Status:** ✅ Ready for Production Deployment
**Date:** October 25, 2025
**Migration System:** Automated with tracking ([DB-MIGRATION-MANAGEMENT.MD](DB-MIGRATION-MANAGEMENT.MD))

---

## Overview

This guide walks you through setting up separate production and development Neon databases in Vercel using our automated migration tracking system.

**What You'll Get:**
- ✅ Isolated production and development databases
- ✅ **Automated migrations on every deployment** (runs during build)
- ✅ Migration tracking with checksums and version control
- ✅ Full audit trail of applied migrations
- ✅ Build fails if migrations fail (safety first!)

---

## Current State

**Development Database:** ✅ Configured
- Vercel Storage: `codescribe-db`
- Environment: Preview/Development
- Migrations: 3 applied (000, 001, 002)

**Production Database:** ⏳ Needs Setup

---

## How Database Selection Works

### Environment-Based Database Routing

The migration system automatically connects to the correct database based on environment variables. Here's how it works:

```mermaid
graph TB
    subgraph Local["🖥️ Local Development"]
        A[npm run migrate] --> B[Loads server/.env]
        B --> C[POSTGRES_URL=dev-db]
        C --> D["✅ DEV Database"]
    end

    subgraph Prod["🌐 Vercel Production"]
        E[POST /api/migrate/run with Bearer token] --> F[Vercel Env: Production]
        F --> G[POSTGRES_URL=prod-db]
        G --> H["✅ PROD Database"]
    end

    subgraph Preview["🔍 Vercel Preview"]
        I[Preview Deploy] --> J[Vercel Env: Preview]
        J --> K[POSTGRES_URL=preview-db]
        K --> L["✅ PREVIEW Database"]
    end

    style D fill:#90EE90,stroke:#2d5016,stroke-width:2px
    style H fill:#FFB6C1,stroke:#8b0000,stroke-width:2px
    style L fill:#87CEEB,stroke:#00008b,stroke-width:2px

    classDef localStyle fill:#f9f9f9,stroke:#333,stroke-width:1px
    classDef prodStyle fill:#fff5f5,stroke:#333,stroke-width:1px
    classDef previewStyle fill:#f0f8ff,stroke:#333,stroke-width:1px

    class Local localStyle
    class Prod prodStyle
    class Preview previewStyle
```

### The @vercel/postgres SDK

The migration runner (`server/src/db/migrate.js`) uses `@vercel/postgres`:

```javascript
import { sql } from '@vercel/postgres';
```

This SDK **automatically** reads database credentials from environment variables in this priority order:

1. ✅ `POSTGRES_URL` (recommended - what we use)
2. `DATABASE_URL` (fallback)
3. Individual params: `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`

### Environment Variable Sources by Context

| Context | Variable Source | Database Connected | Command/URL |
|---------|----------------|-------------------|-------------|
| **Local Dev** | `server/.env` file | Development Neon DB | `npm run migrate` |
| **Production** | Vercel env vars (Production) | Production Neon DB | `https://codescribeai.com/api/migrate/run` |
| **Preview** | Vercel env vars (Preview) | Preview/Dev Neon DB | `https://preview-xxx.vercel.app` |

### Example Configuration

**Local Development (`server/.env`):**
```env
# Points to your development database
POSTGRES_URL=postgresql://neondb_owner:xxx@ep-dev-abc123-pooler.us-east-1.aws.neon.tech/neondb
```

**Production (Vercel Environment Variables - Production only):**
```env
# Points to production database (different endpoint ID)
POSTGRES_URL=postgresql://neondb_owner:yyy@ep-prod-xyz789-pooler.us-east-1.aws.neon.tech/neondb
```

**Preview (Vercel Environment Variables - Preview only):**
```env
# Points to preview/dev database (same as or different from local)
POSTGRES_URL=postgresql://neondb_owner:zzz@ep-preview-def456-pooler.us-east-1.aws.neon.tech/neondb
```

**Notice:** Each `POSTGRES_URL` has a **different endpoint ID** (e.g., `ep-dev-abc123` vs `ep-prod-xyz789`), ensuring complete database isolation.

### How It Works: Step-by-Step

**Local Development:**
```bash
$ npm run migrate
   ↓
1. Runs: node -r dotenv/config src/db/migrate.js
   ↓
2. dotenv loads server/.env file
   ↓
3. POSTGRES_URL=postgresql://...ep-dev-abc123...
   ↓
4. @vercel/postgres reads POSTGRES_URL
   ↓
5. Connects to DEVELOPMENT database ✅
```

**Production Deployment:**
```bash
POST request to: https://codescribeai.com/api/migrate/run
Header: Authorization: Bearer YOUR_MIGRATION_SECRET
   ↓
1. Vercel serverless function runs
   ↓
2. Vercel injects Production environment variables
   ↓
3. POSTGRES_URL=postgresql://...ep-prod-xyz789...
   ↓
4. @vercel/postgres reads POSTGRES_URL
   ↓
5. Connects to PRODUCTION database ✅
```

### Verification

When you run migrations, the system confirms which database it's using:

```bash
$ cd server && npm run migrate:status

📊 Migration Status

Database: neondb
Environment: development  # ← Confirms environment

Applied Migrations (3):
✅ 000-create-migration-table          (10/25/2025, 2:00:17 PM) - 25ms
✅ 001-create-users-table              (10/25/2025, 2:01:28 PM) - 46ms
✅ 002-add-reset-token-fields          (10/25/2025, 2:01:28 PM) - 27ms
```

### Key Security & Isolation Features

✅ **Complete Isolation:** Each environment has its own `POSTGRES_URL` pointing to a separate database
✅ **No Cross-Contamination:** Local changes never touch production data
✅ **Vercel Manages Secrets:** Environment variables stored securely in Vercel
✅ **Per-Environment Config:** Production, Preview, and Development are completely independent
✅ **Automatic Selection:** No manual switching required - environment determines database

### Common Questions

**Q: How does the migration runner know which database to use?**
A: It reads `POSTGRES_URL` from the environment. Locally this comes from `server/.env`, on Vercel it comes from Vercel's environment variables.

**Q: What if I accidentally run migrations on the wrong database?**
A: The system shows the database name and environment before running. Plus, the migration tracking table prevents re-running migrations.

**Q: Can I test production migrations locally?**
A: Yes! Temporarily set `POSTGRES_URL` in your local `.env` to the production URL (get it from Vercel). **Warning:** This will modify production data!

**Q: How do I verify I'm connected to the right database?**
A: Run `npm run migrate:status` - it shows the database name and environment at the top.

---

## Automatic Migration on Deploy ✨

**Good News:** Migrations now run automatically on every deployment!

The [vercel.json](../../vercel.json#L3) build command has been updated to run migrations before building the client:

```json
"buildCommand": "cd server && npm install && npm run migrate && cd ../client && npm install && npm run build"
```

**What This Means:**
- ✅ Every production deployment automatically runs pending migrations
- ✅ Build fails if migrations fail (prevents deploying incompatible code)
- ✅ No manual migration step required after deployment
- ✅ Migration tracking ensures same migration never runs twice

**How It Works:**
1. Vercel triggers deployment (via git push)
2. Installs server dependencies
3. Runs `npm run migrate` (applies pending migrations only)
4. Installs client dependencies
5. Builds frontend
6. Deploys if all steps succeed

**Migration Endpoints Available:**
- **Public status (no auth):** `/api/migrate/status` - Check applied/pending migrations
- **Admin operations (secure header auth):** `/api/migrate/run` - Run migrations manually (POST with Bearer token)

---

## Step 1: Create Production Database in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → **Storage** tab

2. Click **"Create Database"** (top right)

3. Select **Neon Serverless Postgres**

4. Configure:
   - Name: `codescribe-production` (or leave default)
   - **Environment:** Select **Production only** ✅
   - Uncheck Preview/Development ❌

5. Click **Create**

Vercel will automatically:
- Create a new Neon project in your Neon account
- Set up all `POSTGRES_*` environment variables for Production
- Keep your existing dev database untouched

---

## Step 2: Add Migration Secret

In Vercel Dashboard → Settings → Environment Variables:

1. Click **Add New**

2. Configure:
   - **Key:** `MIGRATION_SECRET`
   - **Value:** Generate a secure random string:
     ```bash
     openssl rand -base64 32
     ```
   - **Environments:** Select **Production only** ✅

3. Save

**Security Note:** This secret protects the migration endpoint from unauthorized access.

---

## Step 3: Deploy to Production

Commit and push your changes:

```bash
# Commit the updated build configuration
git add vercel.json
git commit -m "feat: Add automatic migrations on deploy"
git push origin main

# Vercel will auto-deploy to production
# Migrations will run automatically during the build!
```

**What Happens During Deploy:**
1. ✅ Vercel starts build process
2. ✅ Installs server dependencies
3. ✅ **Runs `npm run migrate`** → Applies migrations to production DB
4. ✅ Installs client dependencies
5. ✅ Builds frontend
6. ✅ Deploys to production

**Check Build Logs:**
Go to Vercel Dashboard → Deployments → Latest → Build Logs

Look for migration output:
```
Running "cd server && npm install && npm run migrate && cd ../client && npm install && npm run build"

> server@1.2.2 migrate
> node -r dotenv/config src/db/migrate.js

🔄 Running Migrations...

Database: neondb
Environment: production

✅ 000-create-migration-table          (28ms)
✅ 001-create-users-table              (52ms)
✅ 002-add-reset-token-fields          (31ms)

✅ Migrations completed successfully! Applied 3 migrations.
```

Wait for deployment to complete (~1-2 minutes).

---

## Step 4: Verify Migration Status (Optional)

After deployment completes, you can verify migrations were applied successfully:

**Option 1: Public Status Endpoint (Recommended - No Secret Required)** ✨
```
https://codescribeai.com/api/migrate/status
```

This read-only endpoint shows migration status without requiring authentication:
```json
{
  "success": true,
  "environment": "production",
  "database": "neondb",
  "pgVersion": "PostgreSQL 16.x",
  "appliedMigrations": 3,
  "pendingMigrations": 0,
  "lastMigration": {
    "version": "002-add-reset-token-fields",
    "name": "Add Reset Token Fields",
    "appliedAt": "2025-10-25T19:05:12.455Z"
  },
  "migrations": [...]
}
```

**Option 2: Check Vercel build logs**
- Go to Vercel Dashboard → Deployments → Latest
- Look for migration output in the build logs (shown in Step 3)

**Option 3: Authenticated admin endpoint (for manual migration runs)**
```bash
# Run pending migrations manually
curl -X POST \
  -H "Authorization: Bearer YOUR_MIGRATION_SECRET" \
  https://codescribeai.com/api/migrate/run

# Or just check detailed status
curl -X POST \
  -H "Authorization: Bearer YOUR_MIGRATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}' \
  https://codescribeai.com/api/migrate/run
```

---

## Step 5: Enable Authentication in Production

Once the database is set up, enable authentication:

1. Go to Vercel → Settings → Environment Variables

2. Update **Production environment** variables:

   ```env
   ENABLE_AUTH=true

   # JWT & Session Secrets (generate new ones for production!)
   JWT_SECRET=<generate-with-openssl-rand-base64-32>
   SESSION_SECRET=<generate-with-openssl-rand-base64-32>

   # GitHub OAuth (create production app at github.com/settings/developers)
   GITHUB_CLIENT_ID=<production-github-app-client-id>
   GITHUB_CLIENT_SECRET=<production-github-app-secret>
   GITHUB_CALLBACK_URL=https://codescribeai.com/api/auth/github/callback

   # Resend Email (for password reset)
   RESEND_API_KEY=<your-resend-api-key>
   EMAIL_FROM="CodeScribe AI <noreply@codescribeai.com>"

   # Client URL
   CLIENT_URL=https://codescribeai.com
   ```

3. **Redeploy** to apply changes (migrations will run automatically again if there are any new ones)

---

## Step 6: Future Migrations

**Good News:** Future migrations are fully automated! Just create the migration file and deploy.

**Workflow:**
1. Create new migration file (e.g., `003-add-usage-tracking.sql`)
2. Test locally: `npm run migrate`
3. Commit and push: `git push origin main`
4. **Migrations run automatically during Vercel deployment** ✅

**Available Endpoints:**
- **`/api/migrate/status`** (public GET, no auth) - Check applied/pending migrations
- **`/api/migrate/run`** (admin POST, Bearer auth) - Manually run migrations or get detailed status

**Security:** Admin endpoint uses secure header-based authentication (secret never appears in URLs or logs).

---

## Migration System Commands

For local development and future migrations:

```bash
# Run all pending migrations
npm run migrate

# Show migration status
npm run migrate:status

# Validate migration integrity
npm run migrate:validate
```

**Example Output:**

```
📊 Migration Status

Database: neondb
Environment: development

Applied Migrations (3):
✅ 000-create-migration-table          (10/25/2025, 2:00:17 PM) - 25ms
✅ 001-create-users-table              (10/25/2025, 2:01:28 PM) - 46ms
✅ 002-add-reset-token-fields          (10/25/2025, 2:01:28 PM) - 27ms

Pending Migrations: None
```

---

## Migration File Structure

```
server/src/db/
├── migrate.js                          # Automated migration runner
└── migrations/
    ├── 000-create-migration-table.sql  # Migration tracking system
    ├── 001-create-users-table.sql      # Users + session tables
    └── 002-add-reset-token-fields.sql  # Password reset fields
```

**Naming Convention:** `{NNN}-{description}.sql`
- `NNN`: 3-digit zero-padded version (000, 001, 002, etc.)
- `description`: kebab-case description
- Migrations run in numerical order

---

## Creating New Migrations

When you need to add new database changes:

1. **Create new migration file:**

   ```bash
   touch server/src/db/migrations/003-add-usage-tracking.sql
   ```

2. **Write idempotent SQL:**

   ```sql
   -- Migration: Add usage tracking
   -- Version: 003
   -- Date: 2025-10-26
   -- Description: Adds usage_stats table for tracking user activity

   CREATE TABLE IF NOT EXISTS usage_stats (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id),
     action VARCHAR(50),
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);
   CREATE INDEX IF NOT EXISTS idx_usage_stats_created_at ON usage_stats(created_at);
   ```

3. **Test locally:**

   ```bash
   npm run migrate:status  # Check pending migrations
   npm run migrate         # Run new migration
   npm run migrate:validate # Verify integrity
   ```

4. **Deploy to production:**

   ```bash
   git add server/src/db/migrations/003-add-usage-tracking.sql
   git commit -m "Add usage tracking migration"
   git push origin main
   ```

5. **Verify on production:**

   **Automatic:** Migrations run during deploy (check build logs)

   **Manual check:** Visit `https://codescribeai.com/api/migrate/status` (no secret needed)

---

## Security Considerations

### Public Status Endpoint (`/api/migrate/status`)

**What's Safe to Expose:**
- ✅ Migration version numbers and names
- ✅ Applied/pending migration counts
- ✅ Timestamps of when migrations ran
- ✅ Database name and PostgreSQL version
- ✅ Environment (production/preview/development)

**What's NOT Exposed:**
- ❌ Database credentials or connection strings
- ❌ Actual SQL code from migrations
- ❌ Detailed error messages (production mode)
- ❌ Ability to run or modify migrations

**Why It's Safe:**
- Read-only operation (GET requests only)
- No authentication bypass - can't run migrations without secret
- No sensitive user data exposed
- Standard metadata useful for monitoring/debugging

### Admin Endpoint (`/api/migrate/run`)

**Secure Header-Based Authentication:**
- POST request with `Authorization: Bearer YOUR_SECRET` header
- Secret never appears in URLs, browser history, or access logs
- Generate secret: `openssl rand -base64 32`

**Usage:**
```bash
# Run pending migrations
curl -X POST \
  -H "Authorization: Bearer YOUR_MIGRATION_SECRET" \
  https://codescribeai.com/api/migrate/run

# Status check (detailed)
curl -X POST \
  -H "Authorization: Bearer YOUR_MIGRATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}' \
  https://codescribeai.com/api/migrate/run
```

**Best Practices:**
- ✅ Only use for emergency manual runs (migrations auto-run on deploy)
- ✅ Store secret in Vercel environment variables only
- ✅ Secret in headers (not URLs) prevents accidental exposure
- ✅ Rotate secret periodically for enhanced security

**Why POST + Headers?**
- GET with `?secret=XXX` exposes secret in URLs, logs, and browser history
- POST with header auth keeps secrets secure in transit and at rest
- Industry standard for API authentication (OAuth, JWT, etc.)

---

## Migration Best Practices

### ✅ DO

- **Always use idempotent SQL:** `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`
- **Use transactions:** Migration runner wraps each migration in BEGIN/COMMIT
- **Test locally first:** Run on dev database before production
- **Never modify applied migrations:** Create new migrations to fix issues
- **Use descriptive names:** `003-add-usage-tracking` not `003-update`
- **Include version header:** Document version, date, description in SQL comments

### ❌ DON'T

- **Don't edit applied migrations:** Checksum validation will fail
- **Don't skip version numbers:** Keep sequential (000, 001, 002, not 000, 002, 005)
- **Don't use destructive operations without backups:** DROP TABLE, TRUNCATE
- **Don't run migrations manually in production:** Use the automated system
- **Don't commit sensitive data:** Keep test data out of migrations

---

## Troubleshooting

### Migration Fails with Checksum Mismatch

**Error:** `Migration has been modified after being applied`

**Cause:** You edited a migration file that was already applied

**Solution:**
- **Never edit applied migrations**
- Create a new migration to fix the issue
- If in development only: Delete from `schema_migrations` and re-run

### Migration Stuck or Partial Failure

**Cause:** SQL error in migration

**Solution:**
- Transaction automatically rolls back failed migrations
- Fix the SQL in the migration file
- Run again (safe due to idempotent SQL)

### Different Migration Status in Dev vs Prod

**Expected Behavior:** This is normal if you're testing migrations locally first

**Verify:**
```bash
# Local dev status
npm run migrate:status

# Production status (use public endpoint or admin endpoint with header auth)
curl https://codescribeai.com/api/migrate/status

# Or detailed admin status
curl -X POST \
  -H "Authorization: Bearer YOUR_MIGRATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}' \
  https://codescribeai.com/api/migrate/run
```

### Can't Access Migration Endpoint

**Error:** 401 Unauthorized

**Solution:** Check that `MIGRATION_SECRET` is set in Vercel and matches the Bearer token in your Authorization header

---

## Database Isolation Verification

Confirm your databases are properly isolated:

1. **Check Vercel Storage Tab:**
   - `codescribe-db` → Preview/Development ✅
   - `codescribe-production` → Production ✅

2. **Check Environment Variables:**
   - Production has its own `POSTGRES_URL`, `POSTGRES_HOST`, etc.
   - Preview has separate values

3. **Test Isolation:**
   ```bash
   # Dev database
   npm run migrate:status
   # Shows: Database: neondb, Environment: development

   # Production database (public endpoint)
   curl https://codescribeai.com/api/migrate/status
   # Shows: environment: "production", database: "neondb"
   ```

---

## Migration Timeline

**Phase 1: Setup (Completed)**
- ✅ Created migration tracking system
- ✅ Organized migrations with naming convention
- ✅ Built automated migrate.js runner
- ✅ Tested on development database
- ✅ Created production migration endpoint

**Phase 2: Production Deployment (In Progress)**
- ⏳ Create production database in Vercel
- ⏳ Add migration secret
- ⏳ Deploy to production
- ⏳ Run production migrations
- ⏳ Enable authentication

**Phase 3: Future** (as needed)
- 📋 Create additional migrations for new features
- 📋 Consider GitHub Actions integration for automated migrations
- 📋 Add migration rollback capability (if needed)

---

## Related Documentation

- [DB-MIGRATION-MANAGEMENT.MD](DB-MIGRATION-MANAGEMENT.MD) - Complete migration system guide
- [migrate.js](../../server/src/db/migrate.js) - Automated migration runner source
- [PASSWORD-RESET-SETUP.md](../authentication/PASSWORD-RESET-SETUP.md) - Authentication setup
- [VERCEL-POSTGRES-SETUP.md](../deployment/VERCEL-POSTGRES-SETUP.md) - Database connection guide

---

## Quick Reference

```bash
# Local Development Commands
npm run migrate              # Run pending migrations
npm run migrate:status       # Show migration status
npm run migrate:validate     # Validate integrity

# Production Migrations (Automatic)
git push origin main         # Migrations run automatically during build!

# Check Migration Status (Public - No Secret Required)
curl https://codescribeai.com/api/migrate/status

# Run Migrations Manually (Admin - Secure Header Auth)
curl -X POST -H "Authorization: Bearer SECRET" https://codescribeai.com/api/migrate/run
curl -X POST -H "Authorization: Bearer SECRET" -H "Content-Type: application/json" \
  -d '{"action":"status"}' https://codescribeai.com/api/migrate/run

# Vercel Database Management
# 1. Vercel Dashboard → Storage → Create Database
# 2. Select environment (Production vs Preview)
# 3. Vercel auto-configures environment variables

# Generate Secure Secrets
openssl rand -base64 32  # For JWT_SECRET, SESSION_SECRET, MIGRATION_SECRET
```

---

**Created:** October 25, 2025
**Status:** Ready for Production
**Next Step:** Create production database in Vercel (Step 1)
