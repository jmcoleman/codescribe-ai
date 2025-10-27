# Release Quickstart Guide

Quick reference for creating and deploying new releases of CodeScribe AI.

## 📋 Prerequisites

- [ ] All changes committed and pushed to a feature branch
- [ ] All tests passing locally
- [ ] CHANGELOG.md updated with release notes
- [ ] Version numbers updated in package.json files (root, client, server)
- [ ] Documentation updated (if applicable)

## 🚀 Release Process

### Step 1: Update Version Numbers

Update version in all three package.json files:

```bash
# Root package.json
"version": "2.0.0"

# client/package.json
"version": "2.0.0"

# server/package.json
"version": "2.0.0"
```

### Step 2: Update CHANGELOG.md

Move items from `[Unreleased]` to a new release section:

```markdown
## [Unreleased]

---

## [2.0.0] - 2025-10-26

**Status:** ✅ Feature Release - Phase 2: Monetization Foundation

### Added
- Feature 1
- Feature 2
...
```

### Step 3: Push to Main Branch

```bash
# Commit version bump and changelog
git add package.json client/package.json server/package.json CHANGELOG.md
git commit -m "chore: bump version to 2.0.0 - Phase 2 release"

# Push to main
git push origin main
```

### Step 4: Automated CI/CD Pipeline

Once you push to `main`, GitHub Actions automatically runs:

#### 4.1 Test Phase (Parallel Execution)
```
┌─────────────────────────────────────────────┐
│   GitHub Actions Test Workflow (.github/   │
│          workflows/test.yml)                │
└─────────────────────────────────────────────┘
                    ▼
        ┌───────────────────────┐
        │   All Tests Must Pass │
        └───────────────────────┘
                    ▼
    ┌───────┬───────┬───────┬────────┐
    ▼       ▼       ▼       ▼        ▼
┌────────┐ ┌────-┐ ┌────┐ ┌─────────┐
│Backend │ │Front│ │Lint│ │Security │
│ Tests  │ │ end │ │    │ │ Audit   │
│        │ │Tests│ │    │ │         │
└────────┘ └─────┘ └────┘ └─────────┘
```

**Jobs:**
1. **test-backend** - Backend unit & integration tests, coverage thresholds
2. **test-frontend** - Component tests (Vitest + React Testing Library)
3. **lint** - Code formatting check (Prettier)
4. **security** - Dependency vulnerability scan (npm audit)

#### 4.2 Deploy Phase (Conditional)

**Triggers only if:**
- ✅ All 4 test jobs pass
- ✅ Push is to `main` branch

```
        All Tests Passed? ──┐
                            │
                            ▼
                    ┌───────────────┐
                    │  Deploy Job   │
                    │ (Vercel Hook) │
                    └───────────────┘
                            ▼
                    ┌───────────────┐
                    │ Vercel Build  │
                    └───────────────┘
```

**Deploy Job Steps:**
```bash
# GitHub Actions triggers Vercel Deploy Hook
curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
```

### Step 5: Vercel Automatic Deployment

Vercel runs the build command from `vercel.json`:

```bash
cd server && \
  npm install && \
  npm run migrate && \        # ← Database migrations run here!
  cd ../client && \
  npm install && \
  npm run build
```

**Build Process:**
1. ✅ Install server dependencies
2. ✅ **Run database migrations** (`npm run migrate` executes migrations in `server/src/db/migrations/`)
3. ✅ Install client dependencies
4. ✅ Build optimized production bundle
5. ✅ Deploy to https://codescribeai.com

**⏱️ Expected Duration:** 2-3 minutes

### Step 6: Verify Deployment

Once deployment completes (you'll see ✅ in GitHub Actions):

1. **Check GitHub Actions:**
   - Visit: https://github.com/jmcoleman/codescribe-ai/actions
   - Verify "Tests" workflow shows ✅ green checkmark
   - Verify "Deploy to Vercel" job completed

2. **Verify Production:**
   - Visit: https://codescribeai.com
   - Test critical user flows:
     - [ ] Generate documentation (README)
     - [ ] File upload
     - [ ] Authentication (login/signup)
     - [ ] Password reset flow (if applicable)
   - Check browser console for errors
   - Test database operations (signup, login)

3. **Check Vercel Dashboard:**
   - Visit: https://vercel.com/your-project/deployments
   - Verify deployment status is "Ready"
   - Check build logs for migration success

### Step 7: Create Git Tag

After verifying deployment is successful:

```bash
# Create annotated tag
git tag -a v2.0.0 -m "Release v2.0.0 - Phase 2: Monetization Foundation"

# Push tag to GitHub
git push origin v2.0.0
```

**Tag Naming Convention:**
- Use semantic versioning: `vMAJOR.MINOR.PATCH`
- Examples: `v1.0.0`, `v2.0.0`, `v2.1.0`, `v2.0.1`

### Step 8: Create GitHub Release

1. **Navigate to Releases:**
   - Go to: https://github.com/jmcoleman/codescribe-ai/releases/new

2. **Fill in Release Form:**
   - **Choose a tag:** Select `v2.0.0` from dropdown
   - **Release title:** `v2.0.0 - Phase 2: Monetization Foundation`
   - **Description:** Copy release notes from CHANGELOG.md (see template below)
   - **Options:**
     - ✅ Check "Set as the latest release"
     - ⬜ Leave "Set as a pre-release" unchecked

3. **Release Notes Template:**

```markdown
## Release v2.0.0 - Phase 2: Monetization Foundation

**Release Date:** October 26, 2025
**Status:** ✅ Production Release
**Phase:** Phase 2 (Monetization Foundation)

### 🎯 Highlights

[Copy major features from CHANGELOG.md]

### ✨ What's New

#### Authentication & User Management
- Email/password authentication with bcrypt
- GitHub OAuth integration
- JWT token-based sessions
- Password reset flow with email verification

#### Database Infrastructure
- Neon Postgres integration
- User model with tier support
- Database migration system
- Session management with connect-pg-simple

#### Developer Experience
- Test data utilities for easier development
- Improved test coverage (86.84% models, 65.41% routes)
- Comprehensive documentation

### 📊 Metrics

- **Total Tests:** 1,347 (97.5% pass rate)
- **Backend Coverage:** 86.84% models, 65.41% routes
- **Frontend Tests:** 24 new tests for utilities
- **CI/CD:** Fully automated with test-gated deployments

### 🔗 Links

- **Live Application:** https://codescribeai.com
- **Full Changelog:** [CHANGELOG.md](../CHANGELOG.md)
- **Documentation:** [docs/](../docs/)

### 📦 Installation

See [README.md](../README.md#quick-start) for installation instructions.

### ⚠️ Breaking Changes

This is a major version release with breaking architectural changes:

- **Database Required:** Application now requires PostgreSQL database (Neon)
- **Authentication:** New authentication system changes session management
- **Environment Variables:** New required variables (see `.env.example`)

### 🔄 Migration Guide

For existing users upgrading from v1.x:

1. Set up Neon database (see [VERCEL-POSTGRES-SETUP.md](../docs/planning/VERCEL-POSTGRES-SETUP.md))
2. Add new environment variables to `.env`
3. Run database migrations: `npm run migrate`
4. Update GitHub OAuth callback URLs (if using OAuth)

### 👥 Contributors

[@jmcoleman](https://github.com/jmcoleman) - All features, tests, and documentation
```

4. **Publish Release:**
   - Review all information
   - Click **"Publish release"**

### Step 9: Post-Release Tasks

- [ ] Announce release (if applicable - Twitter, Discord, etc.)
- [ ] Update project documentation with new version
- [ ] Monitor error tracking for issues
- [ ] Check analytics for usage patterns
- [ ] Create release retrospective notes (what went well, what to improve)

---

## 🔄 Quick Reference

### Version Numbering (Semantic Versioning)

| Version Type | Format | Example | When to Use |
|-------------|---------|---------|-------------|
| **MAJOR** | `X.0.0` | `2.0.0` | Breaking changes, major architecture changes, new phase |
| **MINOR** | `X.Y.0` | `2.1.0` | New features, no breaking changes |
| **PATCH** | `X.Y.Z` | `2.0.1` | Bug fixes, security patches, documentation |

### Phase to Version Mapping

Per [ROADMAP.md](../planning/roadmap/ROADMAP.md#versioning-strategy):

| Phase | Version | Description |
|-------|---------|-------------|
| Phase 1 | v1.0.0 | MVP - Initial production release |
| Phase 2 | v2.0.0 | Monetization Foundation (Auth + Database) |
| Phase 3 | v3.0.0 | UX Enhancements (Dark mode, layout, file handling) |
| Phase 4 | v4.0.0 | Documentation Capabilities (OpenAPI, multi-file) |
| Phase 5 | v5.0.0 | Developer Tools (CLI + VS Code extension) |
| Phase 6 | v6.0.0 | Enterprise Readiness (SSO, audit logs, on-premise) |

### Automated vs Manual Steps

| Step | Type | Tool/Location |
|------|------|---------------|
| Run tests | ✅ Automatic | GitHub Actions (`.github/workflows/test.yml`) |
| Deploy to Vercel | ✅ Automatic | GitHub Actions → Vercel Deploy Hook |
| Run migrations | ✅ Automatic | Vercel build command (`vercel.json`) |
| Create git tag | ⏱️ Manual | `git tag -a v2.0.0 -m "..."` |
| Create GitHub release | ⏱️ Manual | GitHub UI (Releases page) |

---

## 🚨 Troubleshooting

### Tests Fail in CI

**Problem:** GitHub Actions test workflow shows ❌ red X

**Solutions:**
1. Check which job failed (backend, frontend, lint, security)
2. Review logs in GitHub Actions
3. Run tests locally: `npm test` (in server/ or client/)
4. Fix failing tests
5. Push fixes to main

**Note:** Deploy job will NOT run if tests fail.

### Deployment Fails

**Problem:** Vercel deployment shows error or times out

**Common Issues:**
1. **Build timeout:** Increase `maxDuration` in vercel.json
2. **Migration failure:** Check Vercel logs for SQL errors
3. **Environment variables:** Verify all required vars are set in Vercel dashboard
4. **Database connection:** Check Neon database status

**Solutions:**
- View logs: Vercel Dashboard → Deployments → [Failed Deployment] → Build Logs
- Manual migration: Run `npm run migrate` locally with production DB credentials
- Redeploy: Push empty commit to trigger rebuild

### Migrations Don't Run

**Problem:** Database schema not updated after deployment

**Check:**
1. Verify `npm run migrate` in `vercel.json` buildCommand
2. Check Vercel build logs for migration output
3. Verify migrations exist in `server/src/db/migrations/`
4. Check `POSTGRES_URL` environment variable in Vercel

**Manual Fix:**
```bash
# Run migrations manually in production
# (Requires production database credentials)
cd server
POSTGRES_URL="your-production-db-url" npm run migrate
```

### Tag Already Exists

**Problem:** `git tag v2.0.0` fails with "tag already exists"

**Solutions:**
```bash
# Delete local tag
git tag -d v2.0.0

# Delete remote tag (if pushed)
git push --delete origin v2.0.0

# Recreate tag
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0
```

---

## 📚 Related Documentation

- [CHANGELOG.md](../../CHANGELOG.md) - Complete version history
- [ROADMAP.md](../planning/roadmap/ROADMAP.md) - Product roadmap and versioning strategy
- [MVP-DEPLOY-LAUNCH.md](./MVP-DEPLOY-LAUNCH.md) - Detailed deployment guide
- [VERCEL-POSTGRES-SETUP.md](../planning/VERCEL-POSTGRES-SETUP.md) - Database setup
- [DB-MIGRATION-MANAGEMENT.md](../planning/DB-MIGRATION-MANAGEMENT.md) - Migration procedures
- [GitHub Actions Workflow](.github/workflows/test.yml) - CI/CD configuration

---

## ✅ Release Checklist

Use this checklist for each release:

### Pre-Release
- [ ] All features complete and tested
- [ ] Version numbers updated (root, client, server)
- [ ] CHANGELOG.md updated with release notes
- [ ] Documentation updated
- [ ] All tests passing locally
- [ ] No pending security vulnerabilities

### Release
- [ ] Push to main branch
- [ ] Verify GitHub Actions tests pass
- [ ] Verify Vercel deployment succeeds
- [ ] Test production application
- [ ] Create git tag
- [ ] Create GitHub release with notes

### Post-Release
- [ ] Monitor error logs for issues
- [ ] Check analytics for usage patterns
- [ ] Update project boards/issues
- [ ] Create release announcement (if applicable)
- [ ] Document lessons learned

---

## 📝 Recent Releases

### v2.0.0 - Phase 2: Monetization Foundation (October 26, 2025)

**Status:** ✅ Deployed to Production

**Major Features:**
- **Authentication System:** Email/password + GitHub OAuth, JWT tokens, password reset flow with email verification
- **Database Infrastructure:** Neon Postgres integration, user management, session storage, migration system
- **Email Service:** Resend integration with custom domain (codescribeai.com), branded HTML templates
- **Test Data Utilities:** Modularized test data loading (testData.js module), window.loadTestDoc() with optional code panel
- **Password Visibility Toggle:** Eye icon toggles in SignupModal for show/hide password functionality
- **Backend Test Coverage:** 25 new password reset tests, coverage improved to 86.84% models (+23.69%), 65.41% routes
- **Migration API Endpoints:** GET /api/migrate/status (public) + POST /api/migrate/run (admin with Bearer auth)
- **Form Validation:** Comprehensive client-server validation with automatic focus management (flushSync pattern)
- **OAuth Account Linking:** GitHub users can add email/password, symmetric linking both directions

**Technical Improvements:**
- Complete password reset security: token hashing (SHA-256), 1-hour expiration, single-use tokens
- Rate limiting: 3 password reset requests per hour per email (prevents abuse)
- Email security: enumeration prevention, rate limiting, secure URL encoding
- Form validation guide v1.3 with server-side validation patterns and focus management
- Storage constants centralization (AUTH_TOKEN_KEY in client/src/constants/storage.js)

**Testing & Quality:**
- **Total Tests:** 1,347 (97.5% pass rate, 0 failures)
- **Backend Coverage:** Models 86.84%, Routes 65.41%, Services 94%, Middleware 100%
- **Test Data Tests:** 24 new tests for testData.js module (100% passing)
- **Password Reset Tests:** 25 new tests (12 User model + 13 integration)
- **E2E Tests:** 20 password reset scenarios (password-reset.spec.js + password-reset-core.spec.js)
- **All CI Coverage Thresholds:** ✅ Passing (deployment fully unblocked)

**Documentation Updates:**
- **Pricing Structure:** Updated from 4 tiers to 5 tiers (added Starter tier: $12/mo, 50 docs/month)
- **Resend Configuration:** Complete setup guide for prod vs dev environments (custom domain, DNS, API keys)
- **Password Reset Docs:** PASSWORD-RESET-IMPLEMENTATION.md, PASSWORD-RESET-SETUP.md, RESEND-SETUP.md
- **Form Validation:** FORM-VALIDATION-GUIDE.md v1.3 (client-server patterns, focus management, flushSync)
- **Test Data Utilities:** client/src/utils/README.md (comprehensive usage guide)
- **Database Migrations:** DB-MIGRATION-MANAGEMENT.md, PRODUCTION-DB-SETUP.md with migration API details
- **Testing Documentation:** TEST-FIXES-OCT-2025.md Session 3 (coverage improvement details)

**Dependencies Added:**
- resend (^4.0.1) - Email sending service
- react-router-dom (^7.0.2) - Client-side routing (from v1.3.0)
- Multiple auth-related packages: bcrypt, passport, @vercel/postgres, etc. (from v1.3.0)

**Security Enhancements:**
- Token hashing (SHA-256) before database storage
- Cryptographically secure token generation (32 bytes)
- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiration
- Session cookies: httpOnly, secure (production), sameSite strict
- Input validation on all endpoints
- MIGRATION_SECRET environment variable for admin endpoints

**Breaking Changes:**
- Database required (PostgreSQL via Neon)
- New environment variables: RESEND_API_KEY, FROM_EMAIL, MIGRATION_SECRET, JWT_SECRET
- Authentication system changes session management
- Migration from v1.x requires database setup and configuration

**Links:**
- [Full v2.0 Changelog](../../CHANGELOG.md#200---2025-10-26)
- [Live Application](https://codescribeai.com)
- [Migration Guide](../../CHANGELOG.md#-migration-guide) (in CHANGELOG.md)

---

**Last Updated:** October 27, 2025
**Version:** 1.1.0
