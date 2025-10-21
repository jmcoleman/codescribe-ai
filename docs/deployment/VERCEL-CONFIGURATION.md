# Vercel Deployment Configuration

**Project:** CodeScribe AI
**Status:** ✅ **DEPLOYED TO PRODUCTION**
**Deployment Date:** October 19, 2025
**Production URL:** [https://codescribe-ai.vercel.app](https://codescribe-ai.vercel.app)

> **Note:** This configuration has been applied and is kept for reference. For deployment learnings, see [DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md)

---

## Environment Variables for Vercel Dashboard

Copy these values into Vercel Dashboard → Settings → Environment Variables:

### Production Environment

**Environment:** Production

```bash
# Claude API Configuration
CLAUDE_API_KEY=sk-ant-api03-YOUR_ACTUAL_API_KEY_HERE

# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=https://codescribe-ai.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
RATE_LIMIT_HOURLY_MAX=100

# Client Configuration
VITE_API_URL=https://codescribe-ai.vercel.app
```

---

## GitHub Actions CI/CD Setup

### Required GitHub Secrets

For automated deployment via GitHub Actions, configure these secrets in your repository:

**Location:** `Settings → Secrets and variables → Actions → Repository secrets`

| Secret Name | How to Get Value | Example Format |
|-------------|------------------|----------------|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens → Create Token | `Ab1Cd2Ef3Gh4...` |
| `VERCEL_PROJECT_ID` | Run: `vercel project inspect [project-name]` | `prj_h7LVP6tjkw52lt2Eoh99hxwXHJUR` |
| `VERCEL_ORG_ID` | Run: `vercel teams list` | `jenni-colemans-projects` |

**⚠️ CRITICAL: Getting Correct Values**

**Do NOT use values from:**
- ❌ Vercel web dashboard Settings page (may be stale or wrong format)
- ❌ `.vercel/project.json` from your local machine (machine-specific)
- ❌ Old documentation or screenshots

**Always get fresh values using Vercel CLI:**

```bash
# 1. Update CLI to latest version
npm install -g vercel@latest

# 2. Get Project ID
vercel project inspect codescribe-ai
# Copy the "ID" value exactly (watch for typos like it2 vs lt2!)

# 3. Get Org ID (team slug)
vercel teams list
# Copy the "id" column value (NOT the team_xxx format!)

# 4. Create new token
# Go to Vercel Dashboard → Settings → Tokens → Create Token
# Scope: Select your team
# Copy immediately (shown only once)
```

**Common Mistakes:**
- Typos in Project ID (e.g., `it2` vs `lt2` - lowercase i vs lowercase L)
- Using `team_xxx` format instead of team slug for Org ID
- Using expired or wrong-scoped tokens
- Extra spaces before/after values when pasting

### GitHub Actions Workflow

The deployment workflow (`.github/workflows/deploy.yml`) runs automatically on:
- Push to `main` branch (after tests pass)
- Manual trigger via GitHub UI

**Workflow structure:**
```yaml
- Install Vercel CLI
- Deploy to Vercel (single command)
  Uses: vercel deploy --prod
  Authenticates with: VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID
```

**Simplified approach:** Uses `vercel deploy --prod` in one step instead of separate `pull/build/deploy` commands for fewer failure points.

---

## Deployment Steps

### 1. Initial Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "chore: prepare for production deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import `codescribe-ai` repository

3. **Configure Build Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** Leave as root
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/dist`
   - **Install Command:** `npm install --prefix client && npm install --prefix server`

4. **Add Environment Variables:**
   - Copy all variables from above into Vercel dashboard
   - Set environment to "Production"
   - Leave `ALLOWED_ORIGINS` and `VITE_API_URL` as placeholder for now

5. **Deploy:**
   - Click "Deploy"
   - Note the assigned URL (e.g., `https://your-project-name.vercel.app`)

### 2. Update Environment Variables

After first deployment, update these variables with the actual Vercel URL:

```bash
ALLOWED_ORIGINS=https://your-project-name.vercel.app
VITE_API_URL=https://your-project-name.vercel.app
```

**Steps:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update `ALLOWED_ORIGINS` with your actual Vercel URL
3. Update `VITE_API_URL` with your actual Vercel URL
4. Click "Redeploy" to apply changes

---

## Custom Domain (Optional)

If you want to use a custom domain:

1. **Add Domain in Vercel:**
   - Go to Settings → Domains
   - Add your custom domain (e.g., `codescribe.ai`)

2. **Update DNS Records:**
   - Follow Vercel's instructions to add DNS records
   - Wait for DNS propagation (can take 24-48 hours)

3. **Update Environment Variables:**
   ```bash
   ALLOWED_ORIGINS=https://codescribe.ai,https://www.codescribe.ai
   VITE_API_URL=https://codescribe.ai
   ```

4. **Redeploy**

---

## Monitoring & Troubleshooting

### Check Deployment Status
- Vercel Dashboard → Deployments
- View build logs for errors

### Test API Endpoints
```bash
# Health check
curl https://your-project-name.vercel.app/api/health

# Generate docs (test)
curl -X POST https://your-project-name.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function hello() { return \"world\"; }",
    "docType": "README"
  }'
```

### Common Issues

**Issue: GitHub Actions - "Project not found" 404 Error**
```
Error: Project not found ({"VERCEL_PROJECT_ID":"***","VERCEL_ORG_ID":"***"})
```
- **Symptoms:** Local deployment works, GitHub Actions fails with 404
- **Root Cause:** Wrong Project ID or Org ID in GitHub Secrets
- **Solution:**
  1. Update Vercel CLI: `npm install -g vercel@latest`
  2. Get correct Project ID: `vercel project inspect codescribe-ai`
  3. Get correct Org ID: `vercel teams list` (use slug, NOT team_xxx)
  4. Update GitHub Secrets with exact values (watch for typos!)
  5. Common typo: `it2` vs `lt2` in Project ID
- **See:** [DEPLOYMENT-LEARNINGS.md Issue #7](./DEPLOYMENT-LEARNINGS.md#issue-7-github-actions-deployment---project-not-found-error) for detailed guide

**Issue: CORS Error**
- **Solution:** Verify `ALLOWED_ORIGINS` includes your Vercel URL

**Issue: API Key Invalid**
- **Solution:** Check `CLAUDE_API_KEY` is correct and has credits

**Issue: Build Fails**
- **Solution:** Check build logs, verify all dependencies are installed

**Issue: 404 on Routes**
- **Solution:** Ensure `vercel.json` has proper rewrites (if needed)

**Issue: Deployments Showing as "Canceled"**
- **Symptoms:** Multiple deployments in Vercel show "Canceled" status
- **Root Cause:** GitHub Actions triggering new deployments before previous ones complete, or workflow failures
- **Solution:** Check GitHub Actions logs, fix any errors, allow one deployment to complete before triggering another

**Issue: Automatic Deployments Not Triggering** ⭐ **MOST COMMON**
```
Symptom: Push to GitHub but no deployment starts in Vercel
```
- **Symptoms:** Code pushed to main branch, but Vercel doesn't deploy automatically
- **Root Cause:** "Ignored Build Step" setting is misconfigured
- **Solution:**
  1. Go to Vercel Dashboard → Settings → Git
  2. Check **"Ignored Build Step"** setting
  3. Should be **"Automatic"** (NOT "Don't build anything")
  4. Save and trigger a redeploy
  5. Test by pushing a new commit - should auto-deploy within seconds
- **See:** [DEPLOYMENT-LEARNINGS.md Issue #8](./DEPLOYMENT-LEARNINGS.md#issue-8-vercel-git-integration---ignored-build-step-blocking-deployments) for detailed guide

**Issue: Competing Deployment Methods**
- **Symptoms:** Deployments work sometimes, canceled other times, inconsistent behavior
- **Root Cause:** Both Vercel Git Integration AND GitHub Actions trying to deploy
- **Solution:** Pick ONE deployment method:
  - **Recommended:** Vercel Git Integration (automatic, simple, reliable)
  - **Alternative:** GitHub Actions (more control, can run tests first)
  - Disable whichever method you're NOT using

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit API keys to repositories (use Vercel environment variables)
- Rotate `CLAUDE_API_KEY` regularly
- Use Vercel's environment variables (never hardcode secrets)
- Enable rate limiting to prevent abuse
- Monitor API usage in Anthropic console

---

## Rollback Instructions

If deployment fails:
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Fix issues locally
5. Redeploy when ready

---

## Vercel Git Integration Deployment Checklist

Use this checklist to ensure smooth automatic deployments:

### Initial Setup
- [ ] GitHub repository connected to Vercel project
- [ ] Production branch set to `main` (or your primary branch)
- [ ] **"Ignored Build Step" set to "Automatic"** ⭐ **CRITICAL**
- [ ] All environment variables added to Vercel Dashboard
- [ ] CORS `ALLOWED_ORIGINS` includes production URL
- [ ] GitHub webhook exists and is active (Settings → Webhooks)

### Before Every Deployment
- [ ] All tests passing locally
- [ ] Code committed and pushed to main branch
- [ ] No competing deployment methods running (GitHub Actions, manual CLI)

### After Deployment
- [ ] Check Vercel Deployments tab shows "Ready" status (not "Canceled" or "Error")
- [ ] Visit production URL and verify latest changes are live
- [ ] Test core functionality end-to-end
- [ ] Check browser console for errors
- [ ] Verify API endpoints respond correctly

### Troubleshooting Automatic Deployments
If push doesn't trigger deployment:
1. [ ] Check **Settings → Git → Ignored Build Step** = "Automatic"
2. [ ] Check **Settings → Git → Production Branch** matches your branch
3. [ ] Check **GitHub → Settings → Webhooks** - Vercel webhook active
4. [ ] Try manual "Redeploy" to test if build works at all
5. [ ] Check Vercel Deployment logs for error messages

### Monthly Maintenance
- [ ] Review and rotate API keys (CLAUDE_API_KEY, VERCEL_TOKEN)
- [ ] Check for Vercel platform updates
- [ ] Review deployment frequency and build times
- [ ] Verify automatic deployments still working

---

**Next Steps After Deployment:**
1. ✅ Test all features in production
2. ✅ Run Lighthouse audit
3. ✅ Update README with live demo link
4. ✅ Test cross-browser compatibility
5. ✅ Monitor error logs for 24-48 hours
