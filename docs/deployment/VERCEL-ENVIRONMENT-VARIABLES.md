# Vercel Environment Variables - Complete Reference

**Project:** CodeScribe AI
**Last Updated:** November 4, 2025

---

## 📋 Overview

This document contains **all environment variables** needed for CodeScribe AI across all environments (Production, Preview, Development).

**Quick Navigation:**
- [Production Environment](#production-environment) ⭐ **Your actual deployed config**
- [Preview Environment](#preview-environment)
- [Development Environment](#development-environment)
- [Variable Reference by Service](#variable-reference-by-service)

---

## 🎯 Production Environment

**This is the actual configuration running on codescribeai.com:**

### How to Add in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **codescribe-ai** project
3. Click **Settings** → **Environment Variables**
4. For each variable below:
   - Click **"Add Variable"**
   - Enter **Key** and **Value**
   - Check **"Production"** environment only
   - Click **"Save"**

### Production Variables

```bash
# ============================================================================
# CORE APPLICATION
# ============================================================================

# Claude AI API Key
# Where to get: https://console.anthropic.com/settings/keys
# Used for: AI-powered documentation generation
CLAUDE_API_KEY=sk-ant-api03-YOUR_PRODUCTION_KEY_HERE

# Node Environment
# Value: Always "production" for production environment
NODE_ENV=production

# Port (optional, Vercel sets automatically)
# Value: 3000 (default)
PORT=3000


# ============================================================================
# DATABASE (Neon Postgres)
# ============================================================================
# These are AUTO-ADDED when you connect Neon via Vercel Marketplace
# DO NOT add manually - Vercel injects these automatically

# Pooled connection (use for most queries)
POSTGRES_URL=(auto-injected by Neon integration)

# Prisma/ORM connection
POSTGRES_PRISMA_URL=(auto-injected by Neon integration)

# Direct connection (for migrations)
POSTGRES_URL_NON_POOLING=(auto-injected by Neon integration)

# Database name (optional metadata)
POSTGRES_DATABASE=(auto-injected by Neon integration)

# ⚠️ IMPORTANT: Use separate database for production
# When adding Neon integration, create "codescribe-prod" database
# Configure to inject variables ONLY in Production environment


# ============================================================================
# AUTHENTICATION - GitHub OAuth
# ============================================================================

# GitHub OAuth Client ID
# Where to get: GitHub → Settings → Developer settings → OAuth Apps
# See: GITHUB-OAUTH-SETUP.md
GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXXXX

# GitHub OAuth Client Secret
# Where to get: Same as above, click "Generate a new client secret"
# ⚠️ CRITICAL: Never commit this value to git
GITHUB_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# GitHub OAuth Callback URL
# Value: Must match exactly what's in GitHub OAuth app settings
# Format: https://YOUR_DOMAIN/api/auth/github/callback
GITHUB_CALLBACK_URL=https://codescribeai.com/api/auth/github/callback


# ============================================================================
# EMAIL - Resend
# ============================================================================

# Resend API Key
# Where to get: https://resend.com/api-keys
# See: RESEND-SETUP.md
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Email From Address
# Format: Display Name <email@domain.com> OR just email@domain.com
# ⚠️ IMPORTANT: Must use verified domain (mail.codescribeai.com)
# Value for production:
EMAIL_FROM=CodeScribe AI <noreply@mail.codescribeai.com>


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

# Session Secret (for cookie signing)
# How to generate: openssl rand -base64 32
# ⚠️ CRITICAL: Use different secret for each environment
# Never reuse dev secret in production
SESSION_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX


# ============================================================================
# CRON JOBS (Vercel Cron)
# ============================================================================

# Cron Secret (for authenticating Vercel Cron requests)
# How to generate: openssl rand -base64 32
# Used for: POST /api/cron/permanent-deletions endpoint security
# ⚠️ CRITICAL: Only Vercel Cron should have this secret
CRON_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX


# ============================================================================
# CORS CONFIGURATION
# ============================================================================

# Allowed Origins (comma-separated list)
# Include both www and non-www variants
# Format: https://domain1.com,https://domain2.com
ALLOWED_ORIGINS=https://codescribeai.com,https://www.codescribeai.com

# Client URL (for frontend references)
# Value: Your primary domain
CLIENT_URL=https://codescribeai.com


# ============================================================================
# RATE LIMITING (Optional - has sensible defaults)
# ============================================================================

# Rate limit window in milliseconds (default: 60000 = 1 minute)
RATE_LIMIT_WINDOW_MS=60000

# Max requests per window (default: 10)
RATE_LIMIT_MAX=10

# Max requests per hour (default: 100)
RATE_LIMIT_HOURLY_MAX=100
```

---

## 🔄 Preview Environment

**For Vercel preview deployments (feature branches):**

### How Preview Environment Works

- Every pull request gets a unique preview URL
- Uses development database (not production)
- Uses preview-specific email sender
- Same OAuth app (different callback URL per PR)

### Preview Variables

Most variables same as production, with these exceptions:

```bash
# Email - Different sender to identify preview emails
EMAIL_FROM=CodeScribe AI <preview@mail.codescribeai.com>

# Session Secret - Different from production for security
SESSION_SECRET=DIFFERENT_SECRET_FROM_PRODUCTION

# Cron Secret - Different from production for security
CRON_SECRET=DIFFERENT_SECRET_FROM_PRODUCTION

# Client URL - Dynamically set by Vercel to preview URL
CLIENT_URL=(Vercel sets automatically to https://codescribe-ai-git-BRANCH-USER.vercel.app)

# Database - Uses development database (set in Neon integration)
# When adding Neon: Check "Preview" environment for dev database
POSTGRES_URL=(points to codescribe-db, not codescribe-prod)

# GitHub Callback - Vercel handles dynamically
GITHUB_CALLBACK_URL=(Vercel sets automatically per preview deployment)

# CORS - Allow preview URLs
ALLOWED_ORIGINS=(includes preview URLs - Vercel handles automatically)
```

---

## 💻 Development Environment

**For local development (`npm run dev`):**

### Where to Set

Create `server/.env` file in your local repository:

```bash
# server/.env (local file, git-ignored)
```

### Development Variables

```bash
# ============================================================================
# CORE APPLICATION
# ============================================================================

CLAUDE_API_KEY=sk-ant-api03-YOUR_DEV_KEY_HERE
NODE_ENV=development
PORT=3000


# ============================================================================
# DATABASE (Neon Postgres)
# ============================================================================
# Get from: Vercel → Storage → Neon → ".env.local" tab
# OR: Neon dashboard → Connection string

POSTGRES_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
POSTGRES_PRISMA_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

# ⚠️ IMPORTANT: Use development database (codescribe-db)
# Never use production database locally


# ============================================================================
# AUTHENTICATION - GitHub OAuth
# ============================================================================

# Option 1: Use production OAuth app with localhost callback
GITHUB_CLIENT_ID=(same as production)
GITHUB_CLIENT_SECRET=(same as production)
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Option 2: Create separate localhost OAuth app (recommended)
# Create at: GitHub → Settings → Developer settings → OAuth Apps
# Homepage URL: http://localhost:5173
# Callback URL: http://localhost:3000/api/auth/github/callback


# ============================================================================
# EMAIL - Resend
# ============================================================================

RESEND_API_KEY=(same as production - shared API key)
EMAIL_FROM=CodeScribe AI <dev@mail.codescribeai.com>

# Email Mocking Configuration
# Controls whether emails are sent via Resend or mocked to console
# - MOCK_EMAILS=true: Always mock (logs to console)
# - MOCK_EMAILS=false: Always send real emails via Resend
# - Not set: Mock in dev/test, real in production (safe default, recommended)
# MOCK_EMAILS=false


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

# Generate with: openssl rand -base64 32
# Different from production
SESSION_SECRET=LOCAL_DEV_SECRET_DIFFERENT_FROM_PROD


# ============================================================================
# CRON JOBS (Vercel Cron)
# ============================================================================

# Generate with: openssl rand -base64 32
# Different from production
# Used for manual testing of cron endpoint locally
CRON_SECRET=LOCAL_DEV_CRON_SECRET_DIFFERENT_FROM_PROD


# ============================================================================
# CORS CONFIGURATION
# ============================================================================

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CLIENT_URL=http://localhost:5173


# ============================================================================
# RATE LIMITING (Relaxed for development)
# ============================================================================

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
RATE_LIMIT_HOURLY_MAX=1000
```

---

## 📚 Variable Reference by Service

### Core Application Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLAUDE_API_KEY` | ✅ Yes | None | Anthropic Claude API key for AI generation |
| `NODE_ENV` | ✅ Yes | None | Environment: `production`, `development`, `test` |
| `PORT` | ⚠️ Optional | 3000 | Server port (Vercel sets automatically) |

**Where to get:**
- CLAUDE_API_KEY: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

---

### Database Variables (Neon)

| Variable | Required | Auto-Injected | Description |
|----------|----------|---------------|-------------|
| `POSTGRES_URL` | ✅ Yes | ✅ Yes | Pooled connection string (use for queries) |
| `POSTGRES_PRISMA_URL` | ✅ Yes | ✅ Yes | PgBouncer connection (for ORMs) |
| `POSTGRES_URL_NON_POOLING` | ✅ Yes | ✅ Yes | Direct connection (for migrations) |
| `POSTGRES_DATABASE` | ⚠️ Optional | ✅ Yes | Database name (metadata) |

**Where to get:**
- Auto-added by Vercel when you connect Neon via Marketplace
- Manual: Neon Dashboard → Connection Details

**Setup guide:** [VERCEL-POSTGRES-SETUP.md](./VERCEL-POSTGRES-SETUP.md)

---

### GitHub OAuth Variables

| Variable | Required | Environment-Specific | Description |
|----------|----------|---------------------|-------------|
| `GITHUB_CLIENT_ID` | ✅ Yes | No (same across envs) | OAuth application ID |
| `GITHUB_CLIENT_SECRET` | ✅ Yes | No (same across envs) | OAuth application secret |
| `GITHUB_CALLBACK_URL` | ✅ Yes | ✅ Yes (per environment) | OAuth redirect URL |

**Where to get:**
- GitHub → Settings → Developer settings → OAuth Apps
- Create new app or use existing

**Setup guide:** [GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md)

**Environment-specific callback URLs:**
- Production: `https://codescribeai.com/api/auth/github/callback`
- Preview: `https://PREVIEW_URL/api/auth/github/callback` (Vercel handles)
- Development: `http://localhost:3000/api/auth/github/callback`

---

### Email Variables (Resend)

| Variable | Required | Environment-Specific | Description |
|----------|----------|---------------------|-------------|
| `RESEND_API_KEY` | ✅ Yes | No (shared API key) | Resend API authentication |
| `EMAIL_FROM` | ✅ Yes | ✅ Yes (per environment) | Email sender address |
| `MOCK_EMAILS` | ⚠️ Optional | ✅ Yes | Control email mocking behavior |

**Where to get:**
- RESEND_API_KEY: [resend.com/api-keys](https://resend.com/api-keys)

**Setup guide:** [RESEND-SETUP.md](./RESEND-SETUP.md)

**Environment-specific sender addresses:**
- Production: `noreply@mail.codescribeai.com`
- Preview: `preview@mail.codescribeai.com`
- Development: `dev@mail.codescribeai.com`

**⚠️ IMPORTANT:** Must use `@mail.codescribeai.com` subdomain (verified in Resend)

**MOCK_EMAILS Configuration:**
- `MOCK_EMAILS=true`: Always mock (logs to console only)
- `MOCK_EMAILS=false`: Always send real emails via Resend
- Not set (default): Mock in dev/test, real in production
- **Example:** `MOCK_EMAILS=false` in `server/.env` to test real email delivery in development

---

### Session Variables

| Variable | Required | Environment-Specific | Description |
|----------|----------|---------------------|-------------|
| `SESSION_SECRET` | ✅ Yes | ✅ Yes (unique per env) | Secret for cookie signing |

**How to generate:**
```bash
openssl rand -base64 32
```

**⚠️ CRITICAL:** Use different secret for each environment. Never reuse production secret in development.

---

### Cron Job Variables

| Variable | Required | Environment-Specific | Description |
|----------|----------|---------------------|-------------|
| `CRON_SECRET` | ✅ Yes | ✅ Yes (unique per env) | Secret for Vercel Cron authentication |

**How to generate:**
```bash
openssl rand -base64 32
```

**Purpose:**
- Authenticates requests from Vercel Cron Jobs to `/api/cron/permanent-deletions` endpoint
- Prevents unauthorized execution of scheduled tasks
- Required for user account permanent deletion system (GDPR/CCPA compliance)

**⚠️ CRITICAL:** Use different secret for each environment. Only Vercel Cron should have this secret.

**What happens if not set:**
- Cron endpoint returns `500 Internal Server Error`
- Vercel Dashboard shows failed cron executions
- No permanent deletions are processed
- Error logged: `[Cron] CRON_SECRET environment variable not configured`

**How to detect missing variable:**
1. Vercel Dashboard → Cron Jobs → Check for failed executions
2. Vercel Logs → Filter by `/api/cron/permanent-deletions` → Look for 500 errors
3. Check response body: `{"success": false, "error": "Server configuration error"}`

**Related documentation:**
- [USER-DELETION-COMPLIANCE.md](../database/USER-DELETION-COMPLIANCE.md) - Permanent deletion system

---

### CORS Variables

| Variable | Required | Environment-Specific | Description |
|----------|----------|---------------------|-------------|
| `ALLOWED_ORIGINS` | ✅ Yes | ✅ Yes | Comma-separated allowed origins |
| `CLIENT_URL` | ✅ Yes | ✅ Yes | Primary frontend URL |

**Environment-specific values:**
- Production: `https://codescribeai.com,https://www.codescribeai.com`
- Preview: (Vercel handles automatically)
- Development: `http://localhost:5173,http://localhost:3000`

---

### Rate Limiting Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | ⚠️ Optional | 60000 | Rate limit window (milliseconds) |
| `RATE_LIMIT_MAX` | ⚠️ Optional | 10 | Max requests per window |
| `RATE_LIMIT_HOURLY_MAX` | ⚠️ Optional | 100 | Max requests per hour |

**Recommended values:**
- Production: Use defaults (stricter)
- Development: Increase limits for easier testing

---

## 🔒 Security Best Practices

### Never Commit These to Git

- ❌ `CLAUDE_API_KEY`
- ❌ `GITHUB_CLIENT_SECRET`
- ❌ `RESEND_API_KEY`
- ❌ `SESSION_SECRET`
- ❌ `CRON_SECRET`
- ❌ `POSTGRES_URL` (contains password)

**Verify:** Check `.gitignore` includes `server/.env`

### Use Different Secrets Per Environment

- ✅ Different `SESSION_SECRET` for prod/preview/dev
- ✅ Different `CRON_SECRET` for prod/preview/dev
- ✅ Different `CLAUDE_API_KEY` if possible (track costs separately)
- ❌ Never use production database credentials locally

### Rotate Secrets Regularly

- GitHub OAuth: Create new client secret every 6-12 months
- Session secret: Rotate on suspected compromise
- API keys: Monitor usage, rotate if suspicious activity

---

## 🧪 Testing Your Configuration

### Verify Local Development

```bash
# Check environment variables loaded
cd server
node -e "console.log('API Key:', process.env.CLAUDE_API_KEY ? '✅ Set' : '❌ Missing')"
node -e "console.log('Database:', process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing')"
node -e "console.log('Email:', process.env.EMAIL_FROM)"
```

### Verify Vercel Production

1. Go to Vercel → Settings → Environment Variables
2. Check "Production" column shows variables
3. Deploy and check logs for startup messages

### Verify Each Service

**Database:**
```bash
# Local
npm run db:test

# Production
# Check Vercel deployment logs for "Database connected" message
```

**OAuth:**
- Click "Sign in with GitHub" button
- Should redirect to GitHub
- Should redirect back to app after auth

**Email:**
- Trigger password reset
- Check email arrives
- Check sender shows correct environment (dev@, preview@, or noreply@)

---

## 📝 Quick Reference Table

**All Variables Summary:**

| Variable | Prod | Preview | Dev | Source |
|----------|------|---------|-----|--------|
| `CLAUDE_API_KEY` | ✅ | ✅ | ✅ | Anthropic Console |
| `NODE_ENV` | production | development | development | Manual |
| `POSTGRES_URL` | ✅ | ✅ | ✅ | Neon (auto) |
| `POSTGRES_PRISMA_URL` | ✅ | ✅ | ✅ | Neon (auto) |
| `POSTGRES_URL_NON_POOLING` | ✅ | ✅ | ✅ | Neon (auto) |
| `GITHUB_CLIENT_ID` | ✅ | ✅ | ✅ | GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | ✅ | ✅ | ✅ | GitHub OAuth App |
| `GITHUB_CALLBACK_URL` | codescribeai.com | (dynamic) | localhost:3000 | Manual |
| `RESEND_API_KEY` | ✅ | ✅ | ✅ | Resend Dashboard |
| `EMAIL_FROM` | noreply@ | preview@ | dev@ | Manual |
| `SESSION_SECRET` | unique | unique | unique | `openssl rand -base64 32` |
| `CRON_SECRET` | unique | unique | unique | `openssl rand -base64 32` |
| `ALLOWED_ORIGINS` | codescribeai.com | (dynamic) | localhost | Manual |
| `CLIENT_URL` | codescribeai.com | (dynamic) | localhost:5173 | Manual |

**Legend:**
- ✅ = Required
- (auto) = Auto-injected by Vercel integration
- (dynamic) = Vercel sets based on deployment URL

---

## 🔗 Related Documentation

- [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) - Master deployment guide
- [VERCEL-POSTGRES-SETUP.md](./VERCEL-POSTGRES-SETUP.md) - Database setup
- [GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md) - OAuth configuration
- [RESEND-SETUP.md](./RESEND-SETUP.md) - Email setup
- [DATABASE-ENVIRONMENT-CHECKLIST.md](./DATABASE-ENVIRONMENT-CHECKLIST.md) - Verify database separation

---

**Last Updated:** November 4, 2025
**Version:** 1.1
**Maintained By:** CodeScribe AI Team
