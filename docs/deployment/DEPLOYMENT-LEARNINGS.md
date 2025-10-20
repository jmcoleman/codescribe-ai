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
```javascript
// Should return objects (not undefined)
window.__VERCEL_ANALYTICS__
window.__VERCEL_SPEED_INSIGHTS__
```

**Expected Timeline:**
- Analytics (page views): 5 minutes
- Speed Insights (Web Vitals): 15-30 minutes

**Git Commits:**
- `a78ec14` - add vercel speed-insights package for analytics
- `6749267` - Fix analytics not loading - use hostname detection instead of env.MODE
- `d3485b6` - Remove typeof window check from analytics detection
- `320ad90` - resolving analytics deploy issues (removed nested client/client/)

---

**Document Last Updated:** October 20, 2025 (v1.1 - Added Analytics Troubleshooting)
