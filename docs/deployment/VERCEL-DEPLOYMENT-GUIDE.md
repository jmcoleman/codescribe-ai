# Vercel Deployment Guide - CodeScribe AI

**Master Guide for Complete Vercel Deployment**

**Last Updated:** November 14, 2025 (v2.7.8 - Multi-provider LLM + GitHub Integration)
**Status:** Production Ready
**Estimated Time:** 45-60 minutes (first-time setup)

---

## 🎯 Quick Overview - Your Actual Setup

**This is the complete production configuration for CodeScribe AI:**

### Infrastructure
- **Platform:** Vercel (Frontend + Backend)
- **Domain:** codescribeai.com (custom domain)
- **Database:** Neon Postgres (via Vercel Marketplace)
- **Email:** Resend (mail.codescribeai.com subdomain)
- **Auth:** GitHub OAuth + email/password
- **CI/CD:** GitHub Actions + Deploy Hooks

### Services Configured
1. ✅ **Custom Domain** - codescribeai.com (with www redirect)
2. ✅ **Database** - Neon Postgres (separate dev/prod)
3. ✅ **GitHub OAuth** - Social login
4. ✅ **Resend Email** - Password resets, verification (mail.codescribeai.com)
5. ✅ **Email Forwarding** - Support inbox (support@codescribeai.com)
6. ✅ **Deploy Hooks** - Test-gated deployments

### Cost
- **Total:** $0/month (all free tiers)
- Vercel: Free (Hobby)
- Neon: Free (512 MB, 20 projects)
- Resend: Free (3K emails/month)
- GitHub: Free (public repos)

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] **GitHub account** with repository access
- [ ] **Vercel account** (free tier is fine)
- [ ] **Domain purchased** (e.g., codescribeai.com via Namecheap)
- [ ] **Claude API key** from Anthropic
- [ ] **Terminal/command line** access
- [ ] **Vercel CLI** installed (`npm install -g vercel`)
- [ ] **Time:** 45-60 minutes uninterrupted

**Optional but recommended:**
- [ ] Gmail/Google account (for email forwarding)
- [ ] Git familiarity (for CI/CD setup)

---

## 🚀 Deployment Steps Overview

Follow these steps in order:

1. [Initial Vercel Project Setup](#step-1-initial-vercel-project-setup) (5 min)
2. [Custom Domain Configuration](#step-2-custom-domain-configuration) (15 min)
3. [Database Setup (Neon Postgres)](#step-3-database-setup) (10 min)
4. [GitHub OAuth Setup](#step-4-github-oauth-setup) (10 min)
5. [Email Setup (Resend)](#step-5-email-setup) (15 min)
6. [Environment Variables](#step-6-environment-variables) (10 min)
7. [CI/CD & Deploy Hooks](#step-7-cicd--deploy-hooks) (10 min)
8. [Verification & Testing](#step-8-verification--testing) (5 min)

**Total Time:** ~45-60 minutes

---

## Step 1: Initial Vercel Project Setup

**Goal:** Deploy your GitHub repository to Vercel

**Time:** 5 minutes

### 1.1 Create Vercel Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository (`codescribe-ai`)
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Click **"Deploy"**

### 1.2 Verify Initial Deployment

- Wait for deployment to complete (~2-3 minutes)
- Visit your Vercel URL: `https://codescribe-ai.vercel.app`
- Should see CodeScribe AI homepage (may show errors - that's okay, we'll fix with env vars)

**✅ Checkpoint:** You have a live Vercel deployment at `*.vercel.app`

---

## Step 2: Custom Domain Configuration

**Goal:** Set up codescribeai.com as your primary domain

**Time:** 15 minutes (+ 5-30 min DNS propagation)

### Quick Steps

1. **In Vercel:**
   - Settings → Domains
   - Add `codescribeai.com` and `www.codescribeai.com`
   - Copy DNS records shown

2. **In Namecheap:**
   - Advanced DNS tab
   - Add A record: `@` → Vercel IP
   - Add CNAME: `www` → `cname.vercel-dns.com`

3. **Wait for verification** (5-30 minutes)

### Detailed Guide

See [CUSTOM-DOMAIN-SETUP.md](./CUSTOM-DOMAIN-SETUP.md) for:
- Complete step-by-step instructions
- DNS troubleshooting
- SSL certificate setup
- Redirect configuration

**✅ Checkpoint:** `https://codescribeai.com` loads with HTTPS

---

## Step 3: Database Setup

**Goal:** Set up Neon Postgres for authentication and usage tracking

**Time:** 10 minutes

### Quick Steps

1. **Add Neon via Vercel Marketplace:**
   - Vercel → Storage tab → Neon
   - Create database: `codescribe-db` (development)
   - Create database: `codescribe-prod` (production)
   - Configure environment access:
     - Dev database: ✅ Development, ✅ Preview, ❌ Production
     - Prod database: ❌ Development, ❌ Preview, ✅ Production

2. **Initialize Schema:**
   ```bash
   # Connect to production database
   npm run db:setup
   ```

3. **Verify connection** in Vercel → Storage

### Detailed Guide

See [VERCEL-POSTGRES-SETUP.md](./VERCEL-POSTGRES-SETUP.md) for:
- Complete Neon setup instructions
- Schema initialization
- Development vs production separation
- Database branching

**Also see:** [DATABASE-ENVIRONMENT-CHECKLIST.md](./DATABASE-ENVIRONMENT-CHECKLIST.md) to verify proper separation

**✅ Checkpoint:** Database connected, schema initialized, tables created

---

## Step 4: GitHub OAuth Setup

**Goal:** Enable "Sign in with GitHub" functionality

**Time:** 10 minutes

### Quick Steps

1. **Create GitHub OAuth App:**
   - GitHub → Settings → Developer settings → OAuth Apps
   - New OAuth App
   - Callback URL: `https://codescribeai.com/api/auth/github/callback`

2. **Get credentials:**
   - Client ID
   - Generate Client Secret

3. **Add to Vercel environment variables** (we'll do this in Step 6)

### Detailed Guide

See [GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md) for:
- Complete OAuth app setup
- Callback URL configuration
- Testing OAuth flow
- Troubleshooting

**✅ Checkpoint:** OAuth app created, credentials ready

---

## Step 5: Email Setup

**Goal:** Set up email sending (Resend) and receiving (Namecheap forwarding)

**Time:** 15 minutes (+ 5-15 min DNS propagation)

### Quick Steps

**5.1 Resend Setup (Outbound Emails):**

1. **Create Resend account** at [resend.com](https://resend.com)
2. **Add domain:** `mail.codescribeai.com` (subdomain)
3. **Copy DNS records** from Resend
4. **Add DNS in Namecheap:**
   - SPF: `send.mail` → `v=spf1 include:_spf.resend.com ~all`
   - DKIM: `resend._domainkey` → (long key from Resend)
   - MX: `send.mail` → `feedback-smtp.us-east-1.amazonses.com`
5. **Verify domain** in Resend (click "Restart" after DNS propagates)
6. **Generate API key**

**5.2 Email Forwarding Setup (Inbound Emails):**

1. **In Namecheap:**
   - Domain tab → "Redirect Email"
   - Add forwarder: `support` → `jenni.m.coleman@gmail.com`
   - Confirm via email
   - Advanced DNS → Mail Settings → Select "Email Forwarding"

2. **Test forwarding:** Send email to `support@codescribeai.com`

### Detailed Guide

See [RESEND-SETUP.md](./RESEND-SETUP.md) for:
- Complete Resend setup
- DNS record details
- Email forwarding configuration
- Subdomain vs root domain explanation
- Troubleshooting

**✅ Checkpoint:**
- Resend domain verified
- Test password reset email works
- Email forwarding receives at Gmail

---

## Step 6: Environment Variables

**Goal:** Configure all environment variables in Vercel

**Time:** 10 minutes

### Complete Variable List

See [VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md) for the complete consolidated list.

### Quick Configuration

**In Vercel:** Settings → Environment Variables

**Add these for Production environment:**

```bash
# Core App (v2.7.8+)
LLM_PROVIDER=claude                                      # NEW: Required
CLAUDE_API_KEY=sk-ant-api03-xxx                         # Required if LLM_PROVIDER=claude
NODE_ENV=production

# Optional: OpenAI (only if using OpenAI instead of Claude)
# OPENAI_API_KEY=sk-xxx                                 # Required if LLM_PROVIDER=openai
# LLM_MODEL=gpt-5.1                                     # Optional, OpenAI model selection

# Database (auto-added by Neon integration)
POSTGRES_URL=xxx (from Neon)
POSTGRES_PRISMA_URL=xxx (from Neon)
POSTGRES_URL_NON_POOLING=xxx (from Neon)

# GitHub OAuth
GITHUB_CLIENT_ID=xxx (from Step 4)
GITHUB_CLIENT_SECRET=xxx (from Step 4)
GITHUB_CALLBACK_URL=https://codescribeai.com/api/auth/github/callback

# GitHub Integration (v2.7.8+)
GITHUB_TOKEN=ghp_xxx                                     # NEW: Optional (recommended for GitHub file loader)

# Email (Resend)
RESEND_API_KEY=re_xxx (from Step 5)
EMAIL_FROM=noreply@mail.codescribeai.com

# Session
SESSION_SECRET=xxx (generate: openssl rand -base64 32)

# CORS
ALLOWED_ORIGINS=https://codescribeai.com,https://www.codescribeai.com
```

**Repeat for Preview and Development environments** with appropriate values.

### Detailed Guide

See [VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md) for:
- Complete variable reference
- Environment-specific configurations
- How to get each value
- Best practices

**✅ Checkpoint:** All environment variables configured in Vercel

---

## Step 7: CI/CD & Deploy Hooks

**Goal:** Set up test-gated automated deployments

**Time:** 10 minutes

### Quick Steps

1. **Create Deploy Hook in Vercel:**
   - Settings → Git → Deploy Hooks
   - Name: "Production Deploy (after tests)"
   - Branch: `main`
   - Copy hook URL

2. **Add GitHub Secret:**
   - GitHub repo → Settings → Secrets → Actions
   - Name: `VERCEL_DEPLOY_HOOK`
   - Value: (hook URL from step 1)

3. **Disable auto-deploy** (optional):
   - Add to `vercel.json`:
     ```json
     {
       "git": {
         "deploymentEnabled": {
           "main": false
         }
       }
     }
     ```

4. **Verify GitHub Actions workflow** exists at `.github/workflows/test.yml`

### How It Works

1. Push to `main` branch
2. GitHub Actions runs tests
3. If tests pass → Triggers deploy hook
4. Vercel deploys to production
5. If tests fail → No deployment

### Detailed Guide

See [DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md) Issue #9 for:
- Complete deploy hook setup
- GitHub Actions configuration
- Troubleshooting CI/CD
- Alternative approaches

**✅ Checkpoint:** Push to main triggers tests, then deployment

---

## Step 8: Verification & Testing

**Goal:** Verify everything works end-to-end

**Time:** 5 minutes

### Verification Checklist

**Website:**
- [ ] ✅ `https://codescribeai.com` loads with HTTPS
- [ ] ✅ www redirects to non-www
- [ ] ✅ Homepage renders correctly
- [ ] ✅ Monaco Editor loads (code input works)
- [ ] ✅ File upload works
- [ ] ✅ AI generation works (Claude API connected)

**Authentication:**
- [ ] ✅ Email signup works (sends verification email)
- [ ] ✅ Email verification link works
- [ ] ✅ Login works
- [ ] ✅ GitHub OAuth login works
- [ ] ✅ Password reset works (sends email)

**Database:**
- [ ] ✅ User data persists (refresh page, still logged in)
- [ ] ✅ Sessions work across page refreshes
- [ ] ✅ Development and production databases are separate

**Email:**
- [ ] ✅ Password reset email arrives (from dev@mail.codescribeai.com)
- [ ] ✅ Verification email arrives
- [ ] ✅ Email forwarding works (support@codescribeai.com → Gmail)

**CI/CD:**
- [ ] ✅ Push to main triggers GitHub Actions
- [ ] ✅ Tests run successfully
- [ ] ✅ Vercel deploys after tests pass

### Performance Check

```bash
# Run Lighthouse audit
lighthouse https://codescribeai.com --view

# Expected scores:
# Performance: 75+
# Accessibility: 95+
# Best Practices: 90+
# SEO: 90+
```

### DNS Verification

```bash
# Website DNS
dig codescribeai.com +short
# Should show: Vercel IP

# Email DNS
dig TXT send.mail.codescribeai.com
# Should show: SPF record with _spf.resend.com

dig MX codescribeai.com
# Should show: Namecheap forwarding servers
```

**✅ Final Checkpoint:** All checks pass, application fully functional

---

## 🎉 Deployment Complete!

Congratulations! Your CodeScribe AI application is now:

- ✅ Deployed to production on Vercel
- ✅ Accessible at custom domain (codescribeai.com)
- ✅ Connected to Neon Postgres database
- ✅ Configured with GitHub OAuth
- ✅ Sending emails via Resend
- ✅ Receiving support emails via forwarding
- ✅ Automated CI/CD with test-gated deployments

### Next Steps

1. **Monitor your deployment:**
   - Vercel Dashboard: Check logs, analytics
   - Neon Dashboard: Monitor database usage
   - Resend Dashboard: Track email deliverability

2. **Update documentation:**
   - README.md with live URL
   - Portfolio/resume with project link

3. **Optional enhancements:**
   - Set up monitoring (UptimeRobot, Pingdom)
   - Configure error tracking (Sentry)
   - Add analytics (Google Analytics, Plausible)

---

## 📚 Reference Documentation

### Detailed Setup Guides
- [CUSTOM-DOMAIN-SETUP.md](./CUSTOM-DOMAIN-SETUP.md) - Complete domain configuration
- [VERCEL-POSTGRES-SETUP.md](./VERCEL-POSTGRES-SETUP.md) - Database setup and schema
- [GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md) - OAuth configuration
- [RESEND-SETUP.md](./RESEND-SETUP.md) - Email sending and forwarding

### Configuration Reference
- [VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md) - All environment variables
- [DATABASE-ENVIRONMENT-CHECKLIST.md](./DATABASE-ENVIRONMENT-CHECKLIST.md) - Database separation verification

### Maintenance & Operations
- [DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md) - Troubleshooting and best practices
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Pre-deployment checklist
- [RELEASE-PROCESS.md](./RELEASE-PROCESS.md) - How to deploy updates

---

## 🔄 Manual Preview Deployments

**Deployment Strategy:**
- ✅ **Main branch:** Auto-deploys via GitHub Actions hook (after tests pass)
- ✅ **PR branches:** Tests run automatically, but NO auto-deploy
- ✅ **Manual preview:** You trigger when ready to test

**Why manual previews?** This prevents accidental deployments and gives you full control over when to test in a deployed environment.

### Method 1: Vercel CLI (Recommended - Fastest)

```bash
# From your project directory
cd /path/to/codescribe-ai

# Make sure you're on the feature branch
git checkout feature/your-branch-name

# Deploy to preview
vercel

# Vercel will:
# 1. Detect your project (codescribe-ai)
# 2. Build the current branch
# 3. Give you a preview URL immediately
```

**Expected Output:**
```
🔍  Inspect: https://vercel.com/your-account/codescribe-ai/...
✅  Preview: https://codescribe-ai-abc123xyz.vercel.app
```

**First Time Setup:**
If this is your first time using the Vercel CLI, you'll be prompted to:
1. Log in to Vercel
2. Link to existing project → Yes → `codescribe-ai`
3. Confirm project settings

### Method 2: Vercel Dashboard (More Control)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your **codescribe-ai** project
3. Go to **"Deployments"** tab
4. Click **"Deploy"** button (top right corner)
5. In the deployment dialog:
   - **Branch:** Select your feature branch (e.g., `feature/multi-file-db`)
   - **Production:** Leave UNCHECKED (ensures preview deployment)
   - Click **"Deploy"**
6. Wait 2-3 minutes for build to complete
7. Get your preview URL from the deployment list

### Method 3: GitHub Pull Request (Automatic)

**Best for:** Team collaboration and code review

1. **Create or open a Pull Request:**
   - Go to your GitHub repository
   - Click **"Pull requests"** → **"New pull request"**
   - Base: `main`, Compare: your feature branch
   - Click **"Create pull request"**

2. **Vercel automatically deploys:**
   - Vercel bot will comment on the PR with preview URL
   - Look for the "View deployment" link in PR checks
   - Preview deploys automatically on every push to the PR branch

3. **View the preview:**
   - Click the preview URL in Vercel's PR comment
   - Or go to "View deployment" in the PR checks section

**Benefits:**
- Automatic preview on every push to PR
- Easy sharing with reviewers
- Preview URL stays updated as you push changes
- No manual CLI or dashboard interaction needed

**Note:** If Vercel isn't commenting on PRs, check:
- Vercel GitHub integration is installed (vercel.com/account/integrations)
- Repository has correct permissions
- PR is from a branch in the same repo (not a fork)

### Testing Your Preview

Once deployed, test your preview environment:

**Functional Testing:**
- [ ] Upload and generate documentation
- [ ] Test new features
- [ ] Verify database connections work
- [ ] Check environment variables are correct

**Integration Testing:**
- [ ] OAuth login works
- [ ] Email sending works (password reset, etc.)
- [ ] Database queries execute correctly
- [ ] API endpoints respond as expected

**Performance Testing:**
- [ ] Page load times acceptable
- [ ] No console errors
- [ ] SSE streaming works
- [ ] File uploads process correctly

### Sharing Preview URLs

Preview URLs are public and can be shared with:
- Team members for review
- Stakeholders for feedback
- Testing on different devices

**Preview URL Format:**
```
https://codescribe-ai-[unique-id].vercel.app
```

### Cleaning Up Previews

Vercel automatically manages preview deployments:
- Old previews are kept for 30 days
- You can manually delete from Vercel dashboard
- No action needed unless you want to clean up early

---

## 🆘 Troubleshooting

### Common Issues

**Issue: Custom domain shows 404**
- Check DNS propagation (5-30 min delay)
- Verify A record points to correct Vercel IP
- Check Vercel domain status (should show "Active")

**Issue: Database connection errors**
- Verify environment variables are set in Vercel
- Check Neon dashboard for database status
- Ensure correct database selected for each environment

**Issue: OAuth not working**
- Verify callback URL matches exactly
- Check client ID/secret are correct
- Ensure environment variables set in production

**Issue: Emails not sending**
- Check Resend domain is verified
- Verify DNS records with `dig` commands
- Check RESEND_API_KEY is set
- Verify EMAIL_FROM uses @mail.codescribeai.com

**Issue: Email forwarding not working**
- Check Mail Settings dropdown is on "Email Forwarding"
- Verify forwarding rule exists in Domain tab → Redirect Email
- Check confirmation email was clicked
- Test with different sender email

For detailed troubleshooting, see individual setup guides linked above.

---

## 📝 Deployment Timeline

**What to expect:**

| Time | Action | Status |
|------|--------|--------|
| 0 min | Start deployment | Initial setup |
| 5 min | Vercel project created | First deployment live |
| 20 min | Custom domain configured | DNS propagating |
| 30 min | Database + OAuth setup | Backend configured |
| 45 min | Email setup complete | Full functionality |
| 60 min | CI/CD configured | Automated deployments |
| +30 min | DNS fully propagated | 100% operational |

**Total:** ~1.5 hours for complete first-time setup

---

**Last Updated:** November 14, 2025 (v2.7.8 - Multi-provider LLM + GitHub Integration)
**Version:** 1.1
**Maintained By:** CodeScribe AI Team
