# Database Environment Configuration Checklist

**Last Updated:** October 26, 2025

This checklist helps you verify that development and production databases are properly separated and configured.

---

## 🎯 Overview

**Recommended Setup:**
- **Development/Preview**: `codescribe-db` (neondb) - For local dev and feature branch previews
- **Production**: Separate Neon database - For live production traffic

**Why Separate?**
- ✅ Prevents dev/test changes from affecting production data
- ✅ Allows safe schema testing and migrations
- ✅ Better security (different credentials)
- ✅ Independent scaling and performance tuning

---

## ✅ Verification Checklist

### 1. Check Local Development Configuration

**File:** `server/.env`

```bash
# Check which database your local environment uses
grep "DATABASE_URL=" server/.env
```

**Expected for Development:**
- Should point to dev database (e.g., `ep-dry-salad-ahwmlpya` or similar dev identifier)
- Comment should indicate it's the dev database
- `NODE_ENV=development`

**Checklist:**
- [ ] `DATABASE_URL` points to development database
- [ ] `NODE_ENV=development` is set
- [ ] `ENABLE_AUTH=true` for testing auth features
- [ ] Credentials are from Neon dev database project

---

### 2. Check Vercel Production Configuration

**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Steps:**
1. Go to https://vercel.com/dashboard
2. Select your `codescribe-ai` project
3. Click **Settings** → **Environment Variables**
4. Filter by **Production** environment

**Checklist:**
- [ ] `DATABASE_URL` or `POSTGRES_URL` exists for Production
- [ ] Production database URL is **different** from dev database
- [ ] All database variables are scoped to "Production" only
- [ ] `NODE_ENV=production` is set

**Key Variables to Check:**
```
DATABASE_URL or POSTGRES_URL - Should be different host than dev
POSTGRES_PASSWORD - Should be different from dev
POSTGRES_HOST - Should be different endpoint than dev
```

---

### 3. Verify Database Separation

**In Neon Console:** https://console.neon.tech/

**Checklist:**
- [ ] You have at least 2 database projects:
  - Development: `codescribe-db` (or `neondb`)
  - Production: `codescribe-prod` (or similar)
- [ ] Each has different connection credentials
- [ ] Production database has backups enabled
- [ ] Production database is on appropriate tier (Free/Launch/Scale)

**How to Check:**
1. Log in to Neon Console
2. View all projects
3. Confirm you see both dev and prod databases
4. Click each → Settings → Check connection details

---

### 4. Test Database Connectivity

**Test Local Dev Connection:**
```bash
# From project root
cd server
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); pool.end(); });"
```

**Expected Output:**
- Should show current timestamp
- No connection errors
- Confirms dev database is accessible

**Test Production (via Vercel CLI):**
```bash
# Install Vercel CLI if not already: npm i -g vercel
vercel env ls
```

**Checklist:**
- [ ] Local dev connects successfully
- [ ] Production environment variables are listed in Vercel
- [ ] No shared credentials between environments

---

### 5. Migration Safety Check

**Before Running Migrations:**

**Checklist:**
- [ ] Verify which database you're connected to
- [ ] Confirm `NODE_ENV` matches intended environment
- [ ] Backup production database before prod migrations
- [ ] Test migrations on dev database first

**Check Current Connection:**
```bash
# In server directory
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL.split('@')[1].split('/')[0]);"
```

This shows the host without exposing credentials.

---

### 6. Environment Variable Audit

**Files to Check:**

| File | Purpose | What to Verify |
|------|---------|----------------|
| `server/.env` | Local development | Dev database, `NODE_ENV=development` |
| `server/.env.example` | Template for developers | Placeholder values, clear comments |
| Vercel → Production Env Vars | Live production | Prod database, `NODE_ENV=production` |
| Vercel → Preview Env Vars | Feature branches | Dev database or branches |

**Checklist:**
- [ ] `.env` is gitignored (never committed)
- [ ] `.env.example` has clear documentation
- [ ] Production secrets are only in Vercel (not in code)
- [ ] No hardcoded database URLs in source code

---

### 7. Security Best Practices

**Checklist:**
- [ ] Production database has different password than dev
- [ ] Database connection strings use SSL (`?sslmode=require`)
- [ ] `.env` files are in `.gitignore`
- [ ] No database credentials in git history
- [ ] Production database has IP allowlist (if needed)
- [ ] Rotate credentials if exposed

**Verify SSL:**
```bash
grep "sslmode=require" server/.env
```

---

## 🚨 Common Issues & Solutions

### Issue: Local dev is hitting production database

**Symptoms:**
- Changes made locally appear in production
- Same database host in local `.env` and Vercel production

**Solution:**
1. Check `server/.env` `DATABASE_URL`
2. Compare with Vercel production env vars
3. If identical, create separate dev database in Neon
4. Update local `.env` with dev database URL

### Issue: Production using dev database

**Symptoms:**
- Production data mixing with test data
- Same Neon project for all environments

**Solution:**
1. Create new Neon database project for production
2. Update Vercel production environment variables
3. Migrate data from dev to prod if needed
4. Update DNS/connection strings

### Issue: Can't connect to database

**Symptoms:**
- Connection timeout errors
- Authentication failures

**Solution:**
1. Verify database URL format: `postgresql://user:pass@host/db?sslmode=require`
2. Check Neon project is active (not suspended for inactivity)
3. Verify network connectivity
4. Check Neon console for any alerts
5. Ensure password doesn't contain special characters that need URL encoding

### Issue: Migrations ran on wrong database

**Symptoms:**
- Production schema changed unexpectedly
- Dev database missing expected tables

**Solution:**
1. Always verify `DATABASE_URL` before migrations
2. Use migration tool's dry-run feature
3. Keep database backups
4. Consider using separate migration secrets per environment

---

## 📝 Quick Reference Commands

**Check current database connection:**
```bash
echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1
```

**List all environment variables (without values):**
```bash
grep -E "^[A-Z_]+=" server/.env | cut -d'=' -f1
```

**Verify Vercel production settings:**
```bash
vercel env ls --environment production
```

**Test database query:**
```bash
psql $DATABASE_URL -c "SELECT current_database(), current_user;"
```

---

## 🔄 When to Review This Checklist

- ✅ **Before deploying to production** - Ensure separation is complete
- ✅ **After adding new developers** - Verify they have correct dev setup
- ✅ **Before running migrations** - Confirm target database
- ✅ **After database issues** - Audit configuration
- ✅ **Quarterly** - Security and configuration review
- ✅ **When changing database providers** - Verify new setup

---

## 📚 Related Documentation

- [VERCEL-POSTGRES-SETUP.md](./VERCEL-POSTGRES-SETUP.md) - Initial database setup guide
- [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) - Complete deployment guide
- [VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md) - All environment variables
- [README.md](../../README.md) - Environment variables overview
- [API-Reference.md](../api/API-Reference.md) - API endpoints and database usage
- Neon Docs: https://neon.tech/docs/introduction
- Vercel Docs: https://vercel.com/docs/storage/vercel-postgres

---

## ✅ Sign-Off Template

Use this template to document that you've verified the configuration:

```
Database Configuration Verified: [Date]
Verified By: [Your Name]

✅ Dev database: [neondb endpoint]
✅ Prod database: [production endpoint - DIFFERENT from dev]
✅ Local .env uses dev database
✅ Vercel production env uses prod database
✅ No shared credentials
✅ SSL enabled on all connections
✅ Migrations tested on dev first

Notes: [Any special configuration or exceptions]
```

---

**Last Verified:** [Add date when you complete verification]
**Next Review:** [Schedule next check - recommend quarterly]
