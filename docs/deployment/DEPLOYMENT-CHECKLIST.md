# Vercel Deployment Checklist

**Project:** CodeScribe AI
**Date Deployed:** October 19, 2025
**Production URL:** https://codescribeai.com (custom domain)
**Staging URL:** https://codescribe-ai.vercel.app
**Status:** ✅ **DEPLOYMENT COMPLETE**

> **Note:** This checklist has been completed and is kept for reference. For deployment learnings and insights, see [DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md).

---

## Pre-Deployment Checklist

### 1. Code Repository
- [x] All changes committed to git
- [x] Working tree is clean
- [x] On main branch
- [x] Pushed to GitHub

### 2. Configuration Files
- [x] `vercel.json` created with:
  - `buildCommand` includes `npm run migrate` for automatic database migrations
  - `git.deploymentEnabled.main = false` (uses CI/CD Deploy Hooks instead)
  - Routes configuration for API endpoints
- [x] `.gitignore` configured (excludes .env, node_modules, etc.)
- [x] `server/.env.example` exists
- [x] CORS configured for production URL

> **See:** [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) for complete vercel.json configuration

### 3. Build Scripts
- [x] Frontend build script: `npm run build`
- [x] Backend start script: `npm start`
- [x] Root install script: `npm run install:all`

### 4. Environment Variables Ready

> **📚 Complete Reference:** See [VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md) for detailed environment variable documentation.

#### Core Application
- [x] ✅ `CLAUDE_API_KEY` (configured in Vercel)
- [x] ✅ `NODE_ENV=production`
- [x] ✅ `PORT=3000` (optional, Vercel sets automatically)

#### Database (Neon Postgres)
> **Note:** Auto-injected when you connect Neon via Vercel Marketplace. Use separate database for production.
- [x] ✅ `POSTGRES_URL` (pooled connection for general queries)
- [x] ✅ `POSTGRES_PRISMA_URL` (PgBouncer connection for ORM)
- [x] ✅ `POSTGRES_URL_NON_POOLING` (direct connection for migrations - **CRITICAL**)
- [x] ✅ `POSTGRES_DATABASE` (database name metadata)

#### Authentication
- [x] ✅ `ENABLE_AUTH=true` (backend feature flag)
- [x] ✅ `VITE_ENABLE_AUTH=true` (frontend feature flag)
- [x] ✅ `SESSION_SECRET` (secure random string via `openssl rand -base64 32`)
- [x] ✅ `GITHUB_CLIENT_ID` (OAuth app credentials - see [GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md))
- [x] ✅ `GITHUB_CLIENT_SECRET` (OAuth app secret)
- [x] ✅ `GITHUB_CALLBACK_URL` (https://codescribeai.com/api/auth/github/callback)

#### Email (Resend)
> **Setup Guide:** See [RESEND-SETUP.md](./RESEND-SETUP.md) for email configuration.
- [x] ✅ `RESEND_API_KEY` (email service API key)
- [x] ✅ `EMAIL_FROM` (verified sender: `CodeScribe AI <noreply@mail.codescribeai.com>`)
- [x] ✅ `MOCK_EMAILS` (optional - controls email mocking: `true`=always mock, `false`=always send, not set=auto)

#### Stripe Payments
> **Setup Guide:** See [STRIPE-SETUP.md](./STRIPE-SETUP.md) for complete Stripe configuration.
- [x] ✅ `STRIPE_ENV=sandbox` (use 'production' when ready for live payments)
- [x] ✅ `STRIPE_SECRET_KEY` (sk_test_xxx for sandbox, sk_live_xxx for production)
- [x] ✅ `STRIPE_PUBLISHABLE_KEY` (pk_test_xxx for sandbox, pk_live_xxx for production)
- [x] ✅ `STRIPE_WEBHOOK_SECRET` (webhook signature verification - from Stripe Dashboard)
- [x] ✅ `STRIPE_PRICE_STARTER_MONTHLY` (price ID from Stripe dashboard)
- [x] ✅ `STRIPE_PRICE_STARTER_ANNUAL` (price ID from Stripe dashboard)
- [x] ✅ `STRIPE_PRICE_PRO_MONTHLY` (price ID from Stripe dashboard)
- [x] ✅ `STRIPE_PRICE_PRO_ANNUAL` (price ID from Stripe dashboard)
- [x] ✅ `STRIPE_PRICE_TEAM_MONTHLY` (price ID from Stripe dashboard)
- [x] ✅ `STRIPE_PRICE_TEAM_ANNUAL` (price ID from Stripe dashboard)
- [x] ✅ ~~`STRIPE_SUCCESS_URL`~~ — **Not needed in Vercel** (auto-resolved via `VERCEL_URL`)
- [x] ✅ ~~`STRIPE_CANCEL_URL`~~ — **Not needed in Vercel** (auto-resolved via `VERCEL_URL`)

#### Frontend Configuration
- [x] ✅ `VITE_ENABLE_AUTH=true` (enable authentication features)
- [x] ✅ `VITE_STRIPE_ENV=sandbox` (match backend STRIPE_ENV)
- [x] ✅ `VITE_STRIPE_PUBLISHABLE_KEY` (pk_test_xxx for sandbox)
- [x] ✅ `VITE_ANALYTICS_API_KEY` (must match server ANALYTICS_API_KEY - for frontend event tracking)

#### Analytics Configuration
- [x] ✅ `ANALYTICS_API_KEY` (shared secret for analytics endpoint - generate with `openssl rand -base64 32`)

#### CORS & URLs
- [x] ✅ `ALLOWED_ORIGINS=https://codescribeai.com,https://www.codescribeai.com`
- [x] ✅ `CLIENT_URL=https://codescribeai.com`

#### Rate Limiting (Optional - has defaults)
- [x] ✅ `RATE_LIMIT_WINDOW_MS=60000` (default: 1 minute)
- [x] ✅ `RATE_LIMIT_MAX=10` (default: 10 requests per window)
- [x] ✅ `RATE_LIMIT_HOURLY_MAX=100` (default: 100 requests per hour)

### 5. Database Migrations

> **IMPORTANT:** Migrations now run AUTOMATICALLY during Vercel deployment via `vercel.json` buildCommand. Manual runs are for testing only.

#### Pre-Deployment Migration Testing (Optional but Recommended)
- [x] ✅ Test migrations in Docker sandbox first:
  ```bash
  cd server
  npm run test:db:setup      # Start Docker test database
  npm run test:db            # Run migration tests
  npm run test:db:teardown   # Clean up
  ```
- [x] ✅ Apply to Neon dev database (requires user approval after sandbox passes):
  ```bash
  cd server
  npm run migrate            # Apply to Neon dev (uses POSTGRES_URL_NON_POOLING)
  npm run migrate:validate   # Verify migration integrity
  ```
- [x] ✅ Verify migration success (check table output)
- [x] ✅ Test database connection from application

#### Production Deployment Migration (Automatic)
- [x] ✅ Vercel buildCommand automatically runs migrations:
  ```
  cd server && npm install && npm run migrate && cd ../client && npm install && npm run build
  ```
- [x] ✅ Migrations use `POSTGRES_URL_NON_POOLING` (direct connection, not pooled)
- [x] ✅ Separate production database configured in Neon (codescribe-prod vs codescribe-db)

> **See:** [DB-MIGRATION-MANAGEMENT.MD](../database/DB-MIGRATION-MANAGEMENT.MD) for complete migration workflow and [DATABASE-ENVIRONMENT-CHECKLIST.md](./DATABASE-ENVIRONMENT-CHECKLIST.md) for environment separation.

### 6. CI/CD Deploy Hooks Configuration

> **Test-Gated Deployment:** Deployments only proceed if all tests pass via GitHub Actions.

- [x] ✅ GitHub Actions test workflow configured (`.github/workflows/test.yml`)
- [x] ✅ Vercel Deploy Hook created in Vercel Dashboard → Settings → Deploy Hooks
- [x] ✅ `VERCEL_DEPLOY_HOOK` secret added to GitHub repo (Settings → Secrets)
- [x] ✅ Auto-deploy disabled in `vercel.json` (`git.deploymentEnabled.main = false`)
- [x] ✅ Test-gated deployment verified (push to main → tests run → deploy on pass)

> **See:** [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) for CI/CD configuration details.

### 7. Email DNS Configuration (Custom Domain)

> **Required for production email functionality.** See [RESEND-SETUP.md](./RESEND-SETUP.md) and [CUSTOM-DOMAIN-SETUP.md](./CUSTOM-DOMAIN-SETUP.md) for detailed setup.

#### Resend (Outbound) - Subdomain: `mail.codescribeai.com`
- [x] ✅ SPF record: `send.mail` → `v=spf1 include:_spf.resend.com ~all`
- [x] ✅ DKIM record: `resend._domainkey.mail` → (DKIM key from Resend Dashboard)
- [x] ✅ MX record: `send.mail` → `feedback-smtp.us-east-1.amazonses.com` (priority 10)
- [x] ✅ DMARC record: `_dmarc` → `v=DMARC1; p=none;`
- [x] ✅ Domain verified in Resend Dashboard (green checkmark)

#### Namecheap Email Forwarding (Inbound) - Root Domain
- [x] ✅ Configure in Namecheap: Domain tab → "Redirect Email"
- [x] ✅ Set Mail Settings to "Email Forwarding" mode
- [x] ✅ Add forwarding rule: `support@codescribeai.com` → your Gmail
- [x] ✅ Click confirmation email to activate forwarding

### 8. Environment Separation Verification

> **CRITICAL:** Production must use separate resources from development.

- [x] ✅ Production database separate from dev (codescribe-prod vs codescribe-db)
- [x] ✅ Production `SESSION_SECRET` different from dev
- [x] ✅ Production `EMAIL_FROM` uses production domain (`noreply@mail.codescribeai.com`)
- [x] ✅ Production GitHub OAuth app separate OR callbacks include production URL
- [x] ✅ Production Stripe keys different from dev (live vs test)
- [x] ✅ Run [DATABASE-ENVIRONMENT-CHECKLIST.md](./DATABASE-ENVIRONMENT-CHECKLIST.md) verification

---

## Deployment Steps

### Step 1: Push to GitHub (if not already done)
```bash
git add .
git commit -m "chore: add vercel configuration for deployment"
git push origin main
```

### Step 2: Import to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import the `codescribe-ai` repository
5. Vercel will auto-detect the `vercel.json` configuration

### Step 3: Configure Environment Variables

> **📚 Full List:** See **Section 4: Environment Variables Ready** above for the complete list of 40+ environment variables.

In Vercel Dashboard → Settings → Environment Variables, configure ALL variables from Section 4:

**Critical Variables to Set:**
- Core: `CLAUDE_API_KEY`, `NODE_ENV`, `PORT`
- Database: Auto-injected by Neon integration (4 variables)
- Auth: `ENABLE_AUTH`, `VITE_ENABLE_AUTH`, `SESSION_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- Stripe: `STRIPE_ENV`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, 6 price IDs, success/cancel URLs
- Frontend: `VITE_ENABLE_AUTH`, `VITE_STRIPE_ENV`, `VITE_STRIPE_PUBLISHABLE_KEY`
- CORS: `ALLOWED_ORIGINS`, `CLIENT_URL`

> **Reference Guides:**
> - [VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md) - Complete variable reference
> - [STRIPE-SETUP.md](./STRIPE-SETUP.md) - Stripe configuration
> - [GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md) - OAuth configuration
> - [RESEND-SETUP.md](./RESEND-SETUP.md) - Email configuration

### Step 4: Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete (~2-3 minutes)
3. Note the assigned URL (e.g., `https://codescribe-ai.vercel.app`)

### Step 5: Test Production Deployment
```bash
# Health check
curl https://your-url.vercel.app/api/health

# Test generate endpoint
curl -X POST https://your-url.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function hello() { return \"world\"; }",
    "language": "javascript",
    "docType": "README"
  }'
```

### Step 6: Final Verification
- [x] ✅ Visit the deployed URL in browser
- [x] ✅ Test file upload feature
- [x] ✅ Test code input and documentation generation
- [x] ✅ Test streaming generation
- [x] ✅ Check quality score display
- [x] ✅ Test on mobile device (responsive design)
- [x] ✅ Run Lighthouse audit (Performance 75/100, Accessibility 100/100)
- [x] ✅ Check browser console for errors

---

## Post-Deployment Tasks

### Update Documentation
- [x] ✅ Add live demo link to [README.md](../../README.md)
- [ ] Take screenshots of the application (pending)
- [x] ✅ Update deployment documentation with actual URL

### Create GitHub Release
- [x] ✅ Create git tag for the release
- [x] ✅ Push tag to GitHub
- [x] ✅ Create GitHub Release with changelog notes

**Standard Release Process:**

**Step 1: Create and Push Git Tag**
```bash
# Create annotated tag
git tag -a v1.2.0 -m "v1.2.0 - Production Release"

# Push tag to GitHub
git push origin v1.2.0
```

**Step 2: Create GitHub Release**

**Option A: Using GitHub Web UI**

1. Go to your repository's releases page:
   ```
   https://github.com/USERNAME/codescribe-ai/releases
   ```
2. Click **"Draft a new release"** button (top right)
3. **Choose a tag:** Click dropdown and select `v1.2.0` (the tag you just pushed)
4. **Release title:** Enter `v1.2.0 - Production Release`
5. **Description:** Copy the relevant section from CHANGELOG.md for this version
   - Include all Added, Changed, Fixed, Security sections
   - Format with markdown for better readability
6. **Attach binaries** (optional): Drag and drop any release assets if needed
7. Click **"Publish release"**

**Option B: Using GitHub CLI**
```bash
gh release create v1.2.0 \
  --title "v1.2.0 - Production Release" \
  --notes "$(cat <<'EOF'
**Status:** ✅ Production Release

### Added
- AI-powered documentation generation
- Real-time streaming with SSE
- Quality scoring system (0-100)

### Changed
- Enhanced mobile responsiveness
- Improved error handling

### Fixed
- Monaco Editor loading issues
- Quality score precision

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Verification:**
- Visit `https://github.com/USERNAME/codescribe-ai/releases/tag/v1.2.0`
- Confirm release appears on releases page
- Verify changelog notes are properly formatted

**If You Forgot to Tag a Release:**

Sometimes you might deploy and forget to create the git tag and GitHub release. Here's how to fix it retroactively:

1. **Identify the Correct Commit:**
   ```bash
   # View recent commit history
   git log --oneline --all -20

   # View commit graph to understand branching
   git log --oneline --graph --all -10

   # View full details of a specific commit
   git show COMMIT_HASH --stat
   ```

2. **Verify Commit in GitHub:**
   - **Direct URL:** `https://github.com/USERNAME/REPO/commit/COMMIT_HASH`
   - **Via Web UI:** Repository → Commits → Search for commit hash
   - **Check:** Ensure it's before the next release and after the previous release

3. **Create Retroactive Tag:**
   ```bash
   # Tag the specific commit (not HEAD)
   git tag -a v1.2.1 COMMIT_HASH -m "v1.2.1 - Bug fixes"

   # Example:
   git tag -a v1.2.1 0ef49dc -m "v1.2.1 - Bug fixes: footer alignment, download button UX"

   # Push the tag to GitHub
   git push origin v1.2.1
   ```

4. **Create GitHub Release:**

   **Option A: GitHub CLI**
   ```bash
   gh release create v1.2.1 \
     --title "v1.2.1 - Bug Fixes" \
     --notes "Bug fixes: footer alignment, download button UX, sign-in button hiding"
   ```

   **Option B: GitHub Web UI**
   - Go to `github.com/USERNAME/REPO/releases`
   - Click "Draft a new release"
   - Tag: Select `v1.2.1` from dropdown (will appear after pushing)
   - Target: Verify it shows the correct commit hash
   - Title: `v1.2.1 - Bug Fixes`
   - Description: Copy relevant section from CHANGELOG.md
   - Click "Publish release"

5. **Verify:**
   - Check that release appears in chronological order
   - Verify tag points to correct commit
   - Confirm changelog notes are accurate

**Common Mistakes to Avoid:**
- ❌ Don't tag HEAD if you've made commits since the release
- ❌ Don't create tags without commit hashes for retroactive releases
- ❌ Don't forget to include the `-a` flag (creates annotated tags)
- ❌ Don't skip verifying the commit in GitHub before tagging

### Monitoring (First 24-48 Hours)
- [x] ✅ Monitor Vercel deployment logs
- [x] ✅ Check Anthropic API usage in console
- [x] ✅ Watch for error alerts
- [x] ✅ Monitor rate limiting effectiveness

### Optional Enhancements
- [x] ✅ Add custom domain (codescribeai.com - configured October 19, 2025)
- [x] ✅ Set up Vercel Analytics (configured October 20, 2025)
- [x] ✅ Configure Speed Insights (configured October 20, 2025)
- [ ] Add Sentry for error tracking

---

## Troubleshooting

### Build Fails
**Check:**
- Vercel build logs for specific errors
- All dependencies in `package.json` are correct
- Build commands in `vercel.json` are accurate

**Solution:**
```bash
# Test build locally first
cd client
npm run build
# Should succeed without errors
```

### API Endpoints Return 404
**Check:**
- `vercel.json` routes configuration
- Environment variable `NODE_ENV=production`
- Server `index.js` exports are correct

**Solution:**
- Verify `/api/*` routes point to `server/index.js`

### CORS Errors
**Check:**
- `ALLOWED_ORIGINS` environment variable
- CORS configuration in `server/src/server.js`

**Solution:**
- Ensure `ALLOWED_ORIGINS` matches exact Vercel URL
- Check for trailing slashes or protocol mismatches

### Claude API Errors
**Check:**
- `CLAUDE_API_KEY` is set correctly
- API key has available credits
- Anthropic API console for usage/errors

**Solution:**
- Regenerate API key if needed
- Verify key has proper permissions

### Rate Limiting Too Strict
**Check:**
- Environment variables for rate limits
- User IP detection working correctly

**Solution:**
- Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_HOURLY_MAX` in Vercel env vars
- Monitor usage patterns before changing

---

## Rollback Procedure

If deployment has critical issues:

1. **Immediate Fix:**
   - Go to Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Fix and Redeploy:**
   - Fix issues locally
   - Test thoroughly
   - Commit and push
   - Vercel will auto-deploy

3. **Emergency:**
   - Disable domain temporarily in Vercel
   - Display maintenance page
   - Fix issues offline

---

## Success Criteria

Deployment is successful when:
- [x] Application loads without errors
- [x] All API endpoints respond correctly
- [x] Documentation generation works (standard & streaming)
- [x] File upload works
- [x] Quality scoring displays correctly
- [x] Responsive design works on mobile/tablet
- [x] Lighthouse scores: 90+ (Performance, Accessibility, Best Practices, SEO)
- [x] No console errors or warnings
- [x] Rate limiting prevents abuse
- [x] Error handling works gracefully

---

## Next Steps After Successful Deployment

1. **Portfolio Integration:**
   - Add to portfolio website
   - Write case study blog post
   - Create demo video

2. **Marketing:**
   - Share on LinkedIn, Twitter, etc.
   - Submit to product directories (Product Hunt, Hacker News)
   - Share in developer communities

3. **User Feedback:**
   - Monitor analytics
   - Collect user feedback
   - Track feature requests

4. **Phase 2 Planning:**
   - Evaluate Phase 4 optional enhancements
   - Plan CLI tool development
   - Consider VS Code extension

---

**Date Deployed:** October 19, 2025
**Vercel URL:** https://codescribe-ai.vercel.app
**Custom Domain:** https://codescribeai.com (configured October 19, 2025)
**Deployed By:** Jenni Coleman

---

## 📚 Related Documentation

### Core Deployment Guides
- **[VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md)** - Master deployment guide
- **[VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md)** - Complete environment variable reference
- **[DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md)** - Critical learnings, troubleshooting, and best practices
- **[RELEASE-QUICKSTART.md](./RELEASE-QUICKSTART.md)** - Standard release process

### Service Configuration
- **[STRIPE-SETUP.md](./STRIPE-SETUP.md)** - Stripe payment integration
- **[STRIPE-TESTING-GUIDE.md](./STRIPE-TESTING-GUIDE.md)** - Stripe testing procedures
- **[GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md)** - GitHub OAuth configuration
- **[RESEND-SETUP.md](./RESEND-SETUP.md)** - Email service configuration
- **[CUSTOM-DOMAIN-SETUP.md](./CUSTOM-DOMAIN-SETUP.md)** - Custom domain setup

### Database & Infrastructure
- **[DATABASE-ENVIRONMENT-CHECKLIST.md](./DATABASE-ENVIRONMENT-CHECKLIST.md)** - Environment separation verification
- **[VERCEL-POSTGRES-SETUP.md](./VERCEL-POSTGRES-SETUP.md)** - Neon Postgres configuration
- **[DB-MIGRATION-MANAGEMENT.MD](../database/DB-MIGRATION-MANAGEMENT.MD)** - Migration workflow

### Other Resources
- **[README.md](../../README.md)** - Project overview with live demo
- **[PRD.md](../planning/mvp/01-PRD.md)** - Product requirements and roadmap
