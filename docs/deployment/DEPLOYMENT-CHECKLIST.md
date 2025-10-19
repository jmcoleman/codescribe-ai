# Vercel Deployment Checklist

**Project:** CodeScribe AI
**Date Deployed:** October 19, 2025
**Vercel URL:** https://codescribe-ai.vercel.app
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

**Temporary (update after first deployment):**
```
ALLOWED_ORIGINS=https://codescribe-ai.vercel.app
VITE_API_URL=https://codescribe-ai.vercel.app
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

### Monitoring (First 24-48 Hours)
- [x] ✅ Monitor Vercel deployment logs
- [x] ✅ Check Anthropic API usage in console
- [x] ✅ Watch for error alerts
- [x] ✅ Monitor rate limiting effectiveness

### Optional Enhancements
- [ ] Add custom domain (if desired)
- [ ] Set up Vercel Analytics
- [ ] Configure Vercel Web Analytics
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
**Custom Domain:** N/A (using Vercel subdomain)
**Deployed By:** Jenni Coleman

---

## 📚 Related Documentation

For deployment insights and learnings from this deployment, see:
- **[DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md)** - Critical learnings, troubleshooting, and best practices
- **[README.md](../../README.md)** - Updated with production deployment status
- **[PRD.md](../planning/01-PRD.md)** - Phase 1.5 deployment milestone completed
