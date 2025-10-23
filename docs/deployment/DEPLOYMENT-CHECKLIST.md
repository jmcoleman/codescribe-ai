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
- [x] `vercel.json` created
- [x] `.gitignore` configured (excludes .env, node_modules, etc.)
- [x] `server/.env.example` exists
- [x] CORS configured for production URL

### 3. Build Scripts
- [x] Frontend build script: `npm run build`
- [x] Backend start script: `npm start`
- [x] Root install script: `npm run install:all`

### 4. Environment Variables Ready
- [x] ✅ `CLAUDE_API_KEY` (configured in Vercel)
- [x] ✅ `NODE_ENV=production`
- [x] ✅ `PORT=3000`
- [x] ✅ `ALLOWED_ORIGINS` (configured for production URL)
- [x] ✅ `VITE_API_URL` (configured for production URL)
- [x] ✅ Rate limiting configs (using defaults)

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
In Vercel Dashboard → Settings → Environment Variables, add:

**Required:**
```
CLAUDE_API_KEY=sk-ant-api03-YOUR_API_KEY_HERE
NODE_ENV=production
PORT=3000
```

**Production (custom domain):**
```
ALLOWED_ORIGINS=https://codescribeai.com
VITE_API_URL=https://codescribeai.com
```

**Optional (has defaults):**
```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
RATE_LIMIT_HOURLY_MAX=100
```

### Step 4: Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete (~2-3 minutes)
3. Note the assigned URL (e.g., `https://codescribe-ai.vercel.app`)

### Step 5: Update Environment Variables
After first deployment, update these with the actual URL:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update `ALLOWED_ORIGINS` with your Vercel URL
3. Update `VITE_API_URL` with your Vercel URL
4. Click "Redeploy" to apply changes

### Step 6: Test Production Deployment
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

### Step 7: Final Verification
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

For deployment insights and learnings from this deployment, see:
- **[DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md)** - Critical learnings, troubleshooting, and best practices
- **[README.md](../../README.md)** - Updated with production deployment status
- **[PRD.md](../planning/01-PRD.md)** - Phase 1.5 deployment milestone completed
