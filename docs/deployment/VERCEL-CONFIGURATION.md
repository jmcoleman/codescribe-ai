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

**Issue: CORS Error**
- **Solution:** Verify `ALLOWED_ORIGINS` includes your Vercel URL

**Issue: API Key Invalid**
- **Solution:** Check `CLAUDE_API_KEY` is correct and has credits

**Issue: Build Fails**
- **Solution:** Check build logs, verify all dependencies are installed

**Issue: 404 on Routes**
- **Solution:** Ensure `vercel.json` has proper rewrites (if needed)

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

**Next Steps After Deployment:**
1. ✅ Test all features in production
2. ✅ Run Lighthouse audit
3. ✅ Update README with live demo link
4. ✅ Test cross-browser compatibility
5. ✅ Monitor error logs for 24-48 hours
