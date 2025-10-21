# Deployment Learnings - CodeScribe AI

**Project:** CodeScribe AI - Production Deployment
**Deployment Platform:** Vercel
**Deployment Dates:** October 17-19, 2025
**Status:**  Successfully Deployed
**Production URL:** [https://codescribe-ai.vercel.app](https://codescribe-ai.vercel.app)

---

## =� Executive Summary

This document captures critical learnings from deploying CodeScribe AI to Vercel production. The deployment process required 2 days of configuration, optimization, and troubleshooting, but resulted in a fully functional production application with CI/CD, security hardening, and performance optimization.

**Key Achievements:**
-  Production deployment with zero downtime
-  CI/CD pipeline via GitHub Actions
-  Environment variable security and sanitization
-  Build optimization for Vercel's platform
-  API URL centralization and configuration management
-  Monorepo detection and automatic builds

---

## =� Key Learnings

### 1. Vercel Build Dependencies

**Critical Lesson:** In Vercel's build environment, `devDependencies` are NOT installed. Any package needed during `npm run build` must be in `dependencies`.

**What Happened:**
- Initial build failed with "Cannot find module 'vite'"
- Vite was in `devDependencies` but needed during build
- Vercel's build environment only installs `dependencies`, not `devDependencies`

**Solution:** Moved all build-time dependencies from `devDependencies` to `dependencies`:

```json
// client/package.json - Required in dependencies for Vercel
{
  "dependencies": {
    "vite": "^6.2.3",
    "@vitejs/plugin-react": "^4.4.1",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "rollup-plugin-visualizer": "^5.12.0"
  }
}
```

**Git Commits:**
- `1e51777` - fix vite during deploy by moving from a devdependency to a dependency
- `aed5312` - move more vite related devDependencies to dependencies
- `ea1f0d9` - move all build-time dependencies to dependencies for Vercel

**Recommendation:** For Vercel deployments, any package needed during the build step must be in `dependencies`. This differs from local development where `devDependencies` are installed.

---

### 2. API URL Centralization

**Critical Lesson:** Never hardcode API URLs in components. Use centralized configuration with environment variables.

**What Happened:**
- Frontend had hardcoded `http://localhost:3000` URLs throughout components
- Production deployment couldn't reach backend API
- Environment-specific URLs were scattered across multiple files

**Solution:** Created centralized configuration file:

```javascript
// client/src/config.js (NEW FILE)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export { API_BASE_URL };
```

**Updated All API Calls:**
```javascript
// BEFORE (scattered throughout components)
const response = await fetch('http://localhost:3000/api/generate', { ... });

// AFTER (centralized)
import { API_BASE_URL } from './config';
const response = await fetch(`${API_BASE_URL}/api/generate`, { ... });
```

**Environment Variables:**
```bash
# Development (client/.env.local)
VITE_API_URL=http://localhost:3000

# Production (Vercel Environment Variables)
VITE_API_URL=https://your-backend-api.vercel.app
```

**Git Commit:** `7caf8dd` - use centralized api url logic

**Recommendation:** Create a single configuration file for all external URLs. Update all components to import from this file. Configure environment variables for different deployment environments.

---

### 3. Monorepo Auto-Detection

**Critical Lesson:** Vercel has excellent monorepo support built-in. Trust the auto-detection and avoid custom build commands unless absolutely necessary.

**What Happened:**
- Initial vercel.json had custom `buildCommand` and `installCommand`
- Custom commands interfered with Vercel's automatic monorepo detection
- Build failed to find correct output directory
- Vercel couldn't detect npm workspaces structure

**Solution:** Removed custom commands and let Vercel auto-detect:

```json
// vercel.json - BEFORE (caused issues)
{
  "buildCommand": "cd client && npm run build",
  "installCommand": "npm install && cd client && npm install"
}

// vercel.json - AFTER (works perfectly)
{
  // Let Vercel auto-detect monorepo structure
  // No custom commands needed!
}
```

**Root package.json Configuration:**
```json
{
  "name": "codescribe-ai",
  "private": true,
  "workspaces": [
    "client",
    "server"
  ],
  "scripts": {
    "build": "npm run build --workspace=client"
  }
}
```

**Git Commit:** `b0dbbbe` - remove the custom build/install commands and let Vercel auto-detect the monorepo structure

**Recommendation:** For npm workspaces monorepos, configure `package.json` properly and let Vercel handle the rest. Only add custom commands if you have specific requirements.

---

### 4. Environment Variable Security

**Critical Lesson:** NEVER log sensitive environment variables. Use sanitization to prevent accidental API key exposure.

**What Happened:**
- Risk of accidentally exposing API keys in server logs
- Debugging code might log full environment object
- Vercel function logs are visible in dashboard

**Solution:** Implemented environment variable sanitization:

```javascript
// server/src/server.js
const sanitizedEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HAS_CLAUDE_KEY: !!process.env.CLAUDE_API_KEY,  // Boolean instead of actual key
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  // NEVER expose the actual API key or other secrets
};

console.log('Server starting with environment:', sanitizedEnv);

// L NEVER DO THIS:
// console.log('Environment:', process.env);
```

**Created .env.example Files:**
```bash
# server/.env.example
CLAUDE_API_KEY=your-api-key-here
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# client/.env.example
VITE_API_URL=http://localhost:3000
```

**Git Commits:**
- `18414f1` - sanitizing security
- `4d1ca1a` - Update deployment checklist for Vercel git integration setup

**Recommendation:**
1. Create `.env.example` files without actual secrets
2. Sanitize all log output to use boolean flags instead of actual keys
3. Add `.env` to `.gitignore`
4. Use Vercel's encrypted environment variables for production

---

### 5. CI/CD with GitHub Actions

**Critical Lesson:** Automate deployment from day one to prevent manual errors and ensure consistent deployments.

**What Happened:**
- Manual deployments via Vercel CLI were error-prone
- Needed consistent deployment process for team collaboration
- Wanted automatic deployments on push to main branch

**Solution:** Implemented GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Required GitHub Secrets:**
1. `VERCEL_TOKEN` - Vercel authentication token (from Vercel account settings)
2. `VERCEL_ORG_ID` - Vercel organization ID (from `.vercel/project.json`)
3. `VERCEL_PROJECT_ID` - Vercel project ID (from `.vercel/project.json`)

**Git Commit:** `2a7bc50` - add github actions deploy wf and fix vercel build command

**Recommendation:** Set up CI/CD early in the project. GitHub Actions + Vercel CLI provides reliable, automated deployments with full control over the build process.

---

## =� Security Best Practices Implemented

### 1. API Key Protection
-  Store API keys in environment variables only
-  Never commit `.env` files to version control
-  Sanitize logs to prevent accidental key exposure
-  Use Vercel's encrypted environment variables in production

### 2. CORS Configuration
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 3. Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
  max: process.env.RATE_LIMIT_MAX || 10,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

---

## <� Performance Optimization for Production

### Build Optimizations Applied

**Lazy Loading Strategy:**
- Monaco Editor: Loaded on first code interaction (4.85 KB gzipped)
- Mermaid.js: Loaded only when diagrams detected (139.30 KB gzipped)
- DocPanel: Lazy loaded with ReactMarkdown (281.53 KB gzipped)
- Modals: Individual lazy loading (2-12 KB each)

**Results:**
- Initial bundle: 78 KB gzipped (down from 516 KB, -85%)
- Total chunks: ~450 KB (loaded on demand)
- Lighthouse Performance: 75/100 (up from 45, +67%)
- Core Web Vitals:
  - FCP: 0.6s (down from 5.4s, -89%)
  - LCP: 1.0s (down from 13.9s, -93%)
  - TBT: 2,100ms (down from 3,000ms, -30%)

---

##  Production Deployment Checklist

### Pre-Deployment
- [x]  All tests passing (660+ tests, 100% pass rate)
- [x]  Environment variables configured in Vercel dashboard
- [x]  API keys added to Vercel secrets (encrypted)
- [x]  CORS origins updated for production domain
- [x]  Rate limiting configured appropriately
- [x]  Build dependencies moved to `dependencies`
- [x]  API URLs centralized in config file
- [x]  `.env.example` files created for documentation
- [x]  Health check endpoint implemented
- [x]  Error handling tested in production mode

### Deployment
- [x]  GitHub repository connected to Vercel
- [x]  Build command configured (`npm run build`)
- [x]  Output directory set (`client/dist`)
- [x]  Root directory set (`.` for monorepo)
- [x]  GitHub Actions workflow created
- [x]  Vercel secrets added to GitHub repository settings
- [x]  Initial deployment successful
- [x]  Production domain configured

### Post-Deployment
- [x]  Frontend loads correctly on production URL
- [x]  Backend API responds to health check endpoint
- [x]  Documentation generation works end-to-end
- [x]  File upload functionality tested in production
- [x]  Streaming works correctly in production
- [x]  Error handling displays correctly to users
- [x]  Accessibility features verified (95/100 score, 0 violations)
- [x]  Performance metrics acceptable (Lighthouse 75/100)
- [x]  Mobile responsiveness tested on real devices
- [x]  Cross-browser compatibility verified (Chrome, Firefox, Safari, Edge)

---

## = Common Issues and Solutions

### Issue 1: "Cannot find module 'vite'" during build

**Error:**
```
Error: Cannot find module 'vite'
    at Function.Module._resolveFilename
```

**Root Cause:** Vite is in `devDependencies` but Vercel doesn't install devDependencies during build.

**Solution:** Move vite to `dependencies`:
```bash
npm install --save vite
npm uninstall --save-dev vite
```

---

### Issue 2: Frontend can't reach backend API in production

**Error:**
```
Failed to fetch: http://localhost:3000/api/generate
TypeError: NetworkError when attempting to fetch resource
```

**Root Cause:** Frontend using hardcoded localhost URL instead of production API URL.

**Solution:** Centralize API URLs:
```javascript
// config.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export { API_BASE_URL };
```

---

### Issue 3: Vercel build doesn't detect monorepo

**Error:**
```
Error: No build output found
Build failed with exit code 1
```

**Root Cause:** Custom build commands override Vercel's auto-detection.

**Solution:** Remove custom commands from vercel.json and let Vercel auto-detect npm workspaces.

---

### Issue 4: Transient Vercel Build Failures

**Error:**
```
Error: An unexpected error happened when running this build.
We have been notified of the problem. This may be a transient error.
If the problem persists, please contact Vercel Support
```

**Root Cause:** Transient infrastructure failures in Vercel's build system. This is NOT a code issue.

**Common Causes:**
1. **Build server failure** - The specific build server crashed or encountered an internal error
2. **Network issues** - Connection problems between Vercel and npm registry/GitHub
3. **Resource contention** - Build server overloaded or running out of resources
4. **Cache inconsistency** - Vercel's caching layer in inconsistent state
5. **Internal service timeout** - Vercel's internal services (artifact storage, etc.) temporarily failed

**Solution:** Simply retry the deployment:
```bash
# Re-trigger the deployment
vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN

# Or via GitHub Actions - push a new commit or re-run workflow
```

**Why Retry Works:**
- You get assigned to a different (healthy) build server
- Network issues have resolved
- Cache layers have synchronized
- Internal services have recovered

**When to Worry:**
- ✅ **One-time failure:** Normal and expected (~0.1% of deployments)
- ⚠️ **Repeated failures:** If >5% of deployments fail, check:
  1. Vercel status page: https://www.vercel-status.com/
  2. Build logs for specific errors (not generic "unexpected error")
  3. Contact Vercel support if persistent pattern

**Best Practice:** Consider adding automatic retry logic to CI/CD:
```yaml
# .github/workflows/deploy.yml
- name: Deploy with Retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    retry_wait_seconds: 30
    command: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Important Notes:**
- This is a cloud infrastructure issue, not your code
- All major cloud providers (AWS, Azure, GCP, Vercel) have occasional transient failures
- Industry standard uptime is ~99.9% (0.1% = occasional expected failures)
- CI/CD systems are designed to handle retry automatically

**Real Example:** October 20, 2025 - Deployment failed with "unexpected error," succeeded immediately on retry with zero code changes. Build logs showed Vercel platform issue, not application issue.

---

## =� Deployment Timeline

**Day 1 (Oct 17):** Environment Setup
- Configured Vercel project
- Added environment variables
- First deployment attempt (failed - dependency issues)

**Day 2 (Oct 18):** Build Optimization
- Fixed dependency issues (moved to `dependencies`)
- Implemented API URL centralization
- Configured monorepo auto-detection
- Second deployment (successful!)

**Day 3 (Oct 19):** CI/CD & Security
- Set up GitHub Actions workflow
- Implemented environment variable sanitization
- Created deployment documentation
- Final production deployment 

**Total Time:** 2-3 days from first attempt to production-ready deployment

---

## <� Key Takeaways

### What Went Well
1.  **Vercel Auto-Detection:** Once custom commands were removed, deployment was smooth
2.  **Monorepo Support:** Excellent out-of-the-box support for npm workspaces
3.  **Environment Variables:** Secure and easy to manage in Vercel dashboard
4.  **CI/CD Integration:** GitHub Actions + Vercel CLI worked flawlessly after setup
5.  **Build Performance:** Fast builds (~2-3 minutes) with intelligent caching

### Challenges Overcome
1. =' **Dependency Management:** Took 2-3 iterations to move all build dependencies correctly
2. =' **API Configuration:** Required refactoring to centralize all external URLs
3. =' **Monorepo Detection:** Had to remove custom commands to enable auto-detection

### Future Improvements
1. =� **Custom Domain:** Add custom domain (e.g., codescribe.ai)
2. =� **Analytics:** Integrate Vercel Analytics for usage tracking
3. = **Error Tracking:** Add Sentry or similar for production error monitoring
4. = **Preview Deployments:** Utilize Vercel preview deployments for PR testing
5. � **Edge Functions:** Consider using Vercel Edge Functions for lower latency

---

## = Related Documentation

### Internal Documentation
- [README.md](../../README.md) - Project overview and setup
- [PRD Phase 1.5](../planning/01-PRD.md) - Deployment milestone details
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - System architecture
- [OPTIMIZATION-GUIDE.md](../performance/OPTIMIZATION-GUIDE.md) - Performance optimization details

### External Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

**Document Version:** 1.0
**Last Updated:** October 19, 2025
**Author:** Jenni Coleman
**Status:**  Production Deployment Complete

---

## Issue 5: Vercel Analytics and Speed Insights Not Loading

**Error:**
```
window.__VERCEL_ANALYTICS__ → undefined
window.__VERCEL_SPEED_INSIGHTS__ → undefined
```

**Root Causes:**
1. `import.meta.env.MODE === 'production'` returns false in Vercel builds
2. Nested `client/client/` directory created by running npm install from wrong directory
3. Packages not properly included in production build

**Solution:**

**Step 1: Use hostname-based production detection:**
```javascript
// client/src/main.jsx
const isProduction =
  window.location.hostname === 'codescribeai.com' ||
  window.location.hostname.includes('vercel.app')

{isProduction && (
  <>
    <Analytics />
    <SpeedInsights />
  </>
)}
```

**Step 2: Clean up nested directories:**
```bash
rm -rf client/client/
git add -A
git commit -m "Remove nested client directory"
```

**Step 3: Enable Speed Insights in Vercel Dashboard:**
- Settings → Speed Insights → Toggle ON
- Deploy changes
- Wait 15-30 minutes for data to appear

**Step 4: Verify in production:**

**IMPORTANT:** `window.__VERCEL_ANALYTICS__` and `window.__VERCEL_SPEED_INSIGHTS__` will show `undefined` even when working correctly. The packages don't expose global variables in newer versions.

**Correct Way to Verify (Network Tab):**
1. Open DevTools → Network tab
2. Check "Preserve log" checkbox
3. Filter by typing `vitals` or `insights`
4. Use the app for 30-60 seconds
5. Look for POST requests to:
   - `/_vercel/insights/view` (Analytics - page views)
   - `/_vercel/speed-insights/vitals` (Speed Insights - Web Vitals)
6. Both should show **Status: 200 OK** or **204 No Content**

**If you see 200/204 responses:** ✅ Components are working correctly!

**Expected Timeline:**
- **Analytics (page views):** 5-10 minutes
- **Speed Insights (Web Vitals):** **24-48 hours** ⚠️ MUCH LONGER!

**Why Speed Insights Takes Longer:**
- Analytics shows every page view immediately (raw data)
- Speed Insights aggregates performance metrics from multiple sessions
- Needs statistically significant data to calculate percentiles (P75)
- Dashboard waits for minimum threshold of complete user sessions
- First data typically appears after 1-2 days of traffic

**Git Commits:**
- `a78ec14` - add vercel speed-insights package for analytics
- `6749267` - Fix analytics not loading - use hostname detection instead of env.MODE
- `d3485b6` - Remove typeof window check from analytics detection
- `320ad90` - resolving analytics deploy issues (removed nested client/client/)

---

**Document Last Updated:** October 20, 2025 (v1.2 - Added Speed Insights Data Delay Explanation)

---

## Issue 6: Speed Insights Shows "No data available" Despite Working Components

**Dashboard Message:**
```
"No data available. Make sure you are using the latest @vercel/speed-insights package."
```

**Symptoms:**
- Analytics dashboard showing visitors and page views ✅
- Speed Insights dashboard showing "Get Started" setup page with "No data points collected"
- Network tab shows successful POST requests to `/_vercel/speed-insights/vitals` (200 OK)
- `window.__VERCEL_SPEED_INSIGHTS__` returns `undefined` (this is normal!)

**Root Cause:**
Speed Insights has a **24-48 hour delay** before first data appears in dashboard. This is by design, not a bug.

**Why the Delay:**
1. **Data Aggregation:** Speed Insights doesn't show individual measurements like Analytics
2. **Statistical Significance:** Waits for enough sessions to calculate meaningful percentiles (P75)
3. **Multiple Metrics:** Each measurement includes 5+ Web Vitals (FCP, LCP, CLS, TBT, INP)
4. **Quality Threshold:** Won't display until it has high-confidence performance data

**How to Verify It's Working (While Waiting for Dashboard):**

**Method 1: Network Tab (Most Reliable)**
1. Open production site with DevTools → Network tab
2. Enable "Preserve log" checkbox
3. Filter by `vitals` or `insights`
4. Use the app normally for 1-2 minutes
5. Look for POST request to `/_vercel/speed-insights/vitals`
6. **Status 200 or 204 = Working! ✅**

**Method 2: Check Multiple Times**
- Visit site from different browsers/devices
- Complete full user sessions (don't just refresh)
- Each visit sends new vitals data
- More sessions = faster dashboard population

**Expected Timeline:**
- **Day 1:** Components installed, data being sent (Network tab shows 200 OK)
- **Day 2:** Enough data collected, dashboard starts showing metrics
- **Day 3+:** Full historical data and trends available

**Solution:**
✅ **If Network tab shows 200/204 responses:** Everything is working! Just wait 24-48 hours.
❌ **If Network tab shows no requests:** Components not loading - check hostname detection logic.

**Verification Checklist:**
- [ ] Network tab shows POST to `/_vercel/speed-insights/vitals` with 200 OK
- [ ] Analytics dashboard shows page views (proves components load)
- [ ] Speed Insights enabled in Vercel Dashboard (Settings → Speed Insights)
- [ ] Using latest package version (`@vercel/speed-insights@1.2.0`)
- [ ] Multiple user sessions completed (at least 10+)
- [ ] Waited at least 24 hours since first deployment

**Common Misconception:**
❌ "Dashboard says 'no data' so components aren't working"
✅ "Network tab shows 200 OK so components ARE working, dashboard just needs time"

**Real Example:**
- October 20, 2025: Components deployed, Network tab confirmed 200 OK responses
- Dashboard showed "No data points collected" 
- After 24-48 hours: Dashboard populated with Real Experience Score and Web Vitals graphs

**Pro Tip:** Don't debug further if Network tab shows 200 OK responses. Just wait!

---

## Issue 7: GitHub Actions Deployment - "Project not found" Error

**Error:**
```
Error: Project not found ({"VERCEL_PROJECT_ID":"***","VERCEL_ORG_ID":"***"})
> [debug] #2 ← 404 Not Found
```

**Symptoms:**
- Local `vercel deploy` works fine
- GitHub Actions deployment fails with 404
- Environment variables show as set (YES) in workflow logs
- `.vercel/project.json` created but Vercel CLI can't find project
- All deployments showing as "Canceled" in Vercel dashboard

**Root Causes:**
1. **Wrong Project ID format** - Used Project ID from Vercel Settings page but had typo (`it2` instead of `lt2`)
2. **Wrong Org ID format** - Used `team_xxx` format from old Vercel Settings, but CLI expects team slug
3. **Outdated Vercel CLI** - Older CLI versions had bugs with project detection

**Critical Discovery:**
The Project ID and Org ID values shown in Vercel's web dashboard **may not match** what the CLI expects! Always use `vercel` CLI commands to get the correct values.

**Solution:**

**Step 1: Update Vercel CLI to latest version:**
```bash
npm install -g vercel@latest
```

**Step 2: Get correct Project ID using CLI:**
```bash
vercel project inspect codescribe-ai
```

**Output:**
```
Found Project jenni-colemans-projects/codescribe-ai

  General
    ID                          prj_h7LVP6tjkw52lt2Eoh99hxwXHJUR  ← Use this exact value
    Name                        codescribe-ai
    Owner                       Jenni Coleman's projects
```

⚠️ **CRITICAL:** Copy the ID character-by-character! Common mistakes:
- `it2` vs `lt2` (lowercase i vs lowercase L)
- Extra spaces before/after
- Missing characters when copy-pasting

**Step 3: Get correct Org ID (team slug) using CLI:**
```bash
vercel teams list
```

**Output:**
```
id                          Team name
jenni-colemans-projects     Jenni Coleman's projects  ← Use the ID column (slug), NOT team_xxx format
```

**Step 4: Update GitHub Secrets with CLI-provided values:**

Go to: `https://github.com/[username]/codescribe-ai/settings/secrets/actions`

| Secret Name | Correct Value | Wrong Value (Don't Use) |
|-------------|---------------|-------------------------|
| `VERCEL_PROJECT_ID` | `prj_h7LVP6tjkw52lt2Eoh99hxwXHJUR` | `prj_h7LVP6tjkw52it2Eoh99hxwXHJUR` (typo: it2) |
| `VERCEL_ORG_ID` | `jenni-colemans-projects` | `team_fzBS6hN894eToZoYOLi50Ath` (wrong format) |
| `VERCEL_TOKEN` | [from Vercel Dashboard → Settings → Tokens] | [any expired token] |

**Step 5: Simplify GitHub Actions workflow:**

Instead of complex `vercel pull` → `vercel build` → `vercel deploy --prebuilt` workflow, use single command:

```yaml
# .github/workflows/deploy.yml
- name: Deploy to Vercel
  run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} --debug
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

This lets Vercel handle project detection, build, and deployment in one step.

**Why This Works:**
- `vercel deploy --prod` uses environment variables for authentication
- Reads `vercel.json` for build configuration
- No need to manually create `.vercel/project.json` or run `vercel pull`
- Single command = fewer failure points

**Verification:**
After updating secrets and pushing changes, check GitHub Actions logs for:
```
✓ Deployment started
✓ Building project
✓ Deployment complete
Production: https://codescribe-ai.vercel.app
```

**Common Pitfalls to Avoid:**

❌ **Don't use values from:**
- Vercel web dashboard Settings page (may be outdated)
- `.vercel/project.json` from another machine (machine-specific)
- Old documentation or screenshots

✅ **Always get fresh values from:**
- `vercel project inspect [project-name]` (for Project ID)
- `vercel teams list` (for Org ID/team slug)
- Vercel Dashboard → Settings → Tokens (for fresh token)

**Debugging Tips:**

If deployment still fails with 404:
1. **Verify CLI version:** `vercel --version` (should be 48.4.1+)
2. **Test locally first:** `vercel deploy --prod` from project root
3. **Check token scope:** Token must have access to the team/project
4. **Verify secrets exist:** GitHub Settings → Secrets should show 3 secrets
5. **Check secret names:** Must be EXACTLY `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`, `VERCEL_TOKEN` (case-sensitive)

**Timeline:**
- **Hours spent debugging:** ~2 hours
- **Root cause:** Typo in Project ID (`it2` vs `lt2`) + wrong Org ID format
- **Fix time:** 5 minutes once correct values identified

**Key Lesson:**
When GitHub Actions deployment fails but local deployment works, the issue is almost always **incorrect or stale credentials/IDs in GitHub Secrets**, NOT your code or workflow configuration.

**Git Commits:**
- `671bf43` - Fix environment variable expansion in .vercel/project.json
- `ba6e499` - Simplify deployment: use vercel deploy directly
- `74e2212` - Trigger deployment with corrected Vercel credentials

**Date:** October 20, 2025

---

## Issue 8: Vercel Git Integration - "Ignored Build Step" Blocking Deployments

**Error:**
No error message! Deployments simply don't trigger automatically when pushing to GitHub.

**Symptoms:**
- Code pushed to GitHub main branch
- No automatic deployment triggered in Vercel
- Last successful deployment was hours/days ago
- Vercel Git Integration shows as "Connected" with GitHub repo
- Manual "Redeploy" button works, but automatic deployments don't

**Root Cause:**
**"Ignored Build Step" setting was set to "Don't build anything"** instead of "Automatic".

This setting silently prevents Vercel from building on every push, even though the Git integration appears to be properly connected.

**Critical Discovery:**
You can have Vercel Git Integration fully connected and configured, but if "Ignored Build Step" is misconfigured, **zero deployments will happen automatically**. No error messages, no warnings in logs - just silence.

**Solution:**

**Step 1: Check the Ignored Build Step setting:**
```
Vercel Dashboard → Project → Settings → Git → Ignored Build Step
```

**Should be set to:** `Automatic` (default)
**Not:** `Don't build anything` ❌

**Step 2: Fix the setting:**
1. Change from "Don't build anything" to **"Automatic"**
2. Click **Save**
3. You'll see a warning: "Configuration Settings in the current Production deployment differ from your current Project Settings"
   - This is expected - the old deployment used the old settings

**Step 3: Trigger a fresh deployment:**

**Option A: Redeploy from Vercel Dashboard**
- Go to Deployments tab
- Click "Redeploy" on latest deployment
- New deployment will use "Automatic" setting

**Option B: Push a new commit**
```bash
git commit --allow-empty -m "Trigger automatic deployment"
git push
```
- Vercel will automatically detect and deploy

**Step 4: Verify automatic deployments work:**
- Make a small change to your code
- Push to main branch
- Check Vercel Deployments tab - should automatically start building within seconds

**Why This Happens:**

The "Ignored Build Step" setting allows you to conditionally skip builds based on file changes or custom logic. Common use cases:
- Only build when certain files change (e.g., skip builds for README updates)
- Use a custom script to determine if build is needed

**Setting options:**
- **Automatic (default):** Build on every push
- **Don't build anything:** Never build automatically (useful for manual-only deployments)
- **Custom command:** Use a script that exits with code 0 (build) or 1 (skip)

**When might "Don't build anything" get set:**
- Testing manual deployments
- Temporarily disabling auto-deploy
- Migrating from another deployment method
- Accidentally changed during settings exploration

**How to Avoid This Issue:**

✅ **Use Vercel Git Integration as primary deployment method** (not GitHub Actions)
✅ **Keep "Ignored Build Step" on "Automatic"** unless you have specific needs
✅ **Check Vercel project settings first** when deployments mysteriously stop
✅ **Test automatic deployment** after any settings changes

**Debugging Checklist:**

If automatic deployments stop working:
1. ☑️ Check Vercel Dashboard → Settings → Git → Is repo connected?
2. ☑️ Check "Ignored Build Step" setting → Should be "Automatic"
3. ☑️ Check "Production Branch" → Should match your main branch name
4. ☑️ Check GitHub → Settings → Webhooks → Vercel webhook should exist and be active
5. ☑️ Try manual "Redeploy" → If this works, it's a Git integration config issue

**Competing Deployment Methods:**

⚠️ **Don't run multiple deployment methods simultaneously:**
- Vercel Git Integration (automatic on push)
- GitHub Actions with Vercel CLI (also triggers on push)
- Manual deployments via `vercel` CLI

**Running multiple methods causes:**
- Deployment conflicts and cancellations
- Wasted build minutes
- Confusing deployment logs
- Race conditions

**Best Practice:** Pick ONE method:
- **Vercel Git Integration:** Easiest, most reliable (recommended for most projects)
- **GitHub Actions:** More control, custom workflows, can run tests first
- **Manual CLI:** Development/testing only

**Timeline:**
- **Hours spent debugging:** ~3 hours (combined with GitHub Actions troubleshooting)
- **Root cause:** "Ignored Build Step" set to "Don't build anything"
- **Fix time:** 2 minutes once setting was discovered

**Key Lesson:**
**Always check the Vercel project settings in the dashboard first**, before debugging GitHub Actions workflows, CLI commands, or tokens. The simplest explanation is often the correct one.

**Related Issues:**
- See Issue #7 for GitHub Actions "Project not found" errors
- Both issues stemmed from trying to use GitHub Actions when Vercel Git Integration was the better/simpler solution

**Git Commits:**
- `b952a4b` - Disable GitHub Actions deployment workflow (switched to Vercel Git Integration)
- Settings change in Vercel Dashboard (not tracked in git)

**Date:** October 21, 2025

