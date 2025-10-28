# GitHub Pages Roadmap Deployment - Troubleshooting Guide

**Last Updated:** October 28, 2025
**Workflow:** `.github/workflows/deploy-roadmap.yml`
**Live URL:** https://jmcoleman.github.io/codescribe-ai/docs/roadmap/

---

## 🎯 Quick Reference

### When Does Deployment Happen?

**Automatic:** When you push changes to `main` branch that modify:
- `docs/planning/roadmap/ROADMAP-TIMELINE.html`
- `docs/planning/roadmap/roadmap-data.json`

**Manual:** Go to Actions → Deploy Roadmap to GitHub Pages → Run workflow

### Expected Timeline
1. ⏱️ **0-60 seconds:** GitHub Action runs
2. ⏱️ **60-180 seconds:** GitHub Pages CDN updates
3. ✅ **Total:** ~3 minutes from push to live

---

## 🔍 How to Verify Deployment Worked

### Step 1: Check Workflow Status
```bash
# Go to GitHub Actions:
https://github.com/jmcoleman/codescribe-ai/actions/workflows/deploy-roadmap.yml

# Look for:
✅ Green checkmark = Success
❌ Red X = Failed (see "Common Issues" below)
```

### Step 2: Verify gh-pages Branch Updated
```bash
git fetch origin gh-pages
git log origin/gh-pages -1 --format="%ai %s"

# Should show:
# - Recent timestamp (within last few minutes)
# - Message: "Deploy roadmap to GitHub Pages"
```

### Step 3: Check Files on gh-pages
```bash
git checkout gh-pages
git pull origin gh-pages
ls -lh docs/roadmap/

# Should show:
# index.html          72K  [recent timestamp]
# roadmap-data.json   17K  [recent timestamp]
```

### Step 4: Test Live Site
```bash
# IMPORTANT: Open in incognito/private mode to bypass cache
# Mac: Cmd + Shift + N (Chrome) or Cmd + Shift + P (Firefox)
# Windows: Ctrl + Shift + N (Chrome) or Ctrl + Shift + P (Firefox)

# URL:
https://jmcoleman.github.io/codescribe-ai/docs/roadmap/

# Or with cache-buster:
https://jmcoleman.github.io/codescribe-ai/docs/roadmap/?v=123
```

---

## ❌ Common Issues & Solutions

### Issue 1: "Workflow didn't trigger automatically"

**Symptoms:** You pushed changes but no workflow ran

**Causes:**
- Changed files other than `ROADMAP-TIMELINE.html` or `roadmap-data.json`
- Only changed the workflow file itself

**Solution:**
```bash
# Option A: Trigger manually
# Go to: Actions → Deploy Roadmap to GitHub Pages → Run workflow

# Option B: Touch a watched file
echo "<!-- Updated $(date) -->" >> docs/planning/roadmap/roadmap-data.json
git add docs/planning/roadmap/roadmap-data.json
git commit -m "Trigger roadmap deployment"
git push origin main
```

---

### Issue 2: "Workflow failed with permission error"

**Symptoms:** Red X on workflow, error mentions "permission denied" or "forbidden"

**Cause:** GitHub Actions doesn't have write permissions

**Solution:**
```bash
# Go to repo settings:
https://github.com/jmcoleman/codescribe-ai/settings/actions

# Under "Workflow permissions":
✅ Select "Read and write permissions"
✅ Check "Allow GitHub Actions to create and approve pull requests"

# Then re-run the failed workflow
```

---

### Issue 3: "gh-pages updated but site shows old version"

**Symptoms:**
- ✅ Workflow succeeded
- ✅ gh-pages branch has new files
- ❌ Live site still shows old content

**Causes:**
1. Browser cache
2. GitHub Pages CDN cache (takes 1-3 minutes)

**Solutions:**
```bash
# Solution 1: Hard refresh browser
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R

# Solution 2: Open in incognito/private mode
Mac: Cmd + Shift + N (Chrome)
Windows: Ctrl + Shift + N (Chrome)

# Solution 3: Add cache-buster to URL
https://jmcoleman.github.io/codescribe-ai/docs/roadmap/?v=2

# Solution 4: Wait 3-5 minutes
# GitHub Pages CDN can take time to propagate
```

---

### Issue 4: "Deployed to wrong location"

**Symptoms:** Files appear at `/roadmap/` instead of `/docs/roadmap/`

**Cause:** Workflow `destination_dir` is misconfigured

**Solution:**
```bash
# Check workflow file:
cat .github/workflows/deploy-roadmap.yml | grep destination_dir

# Should say:
destination_dir: ./

# NOT:
destination_dir: roadmap

# If wrong, fix it:
vim .github/workflows/deploy-roadmap.yml
# Change destination_dir to: ./
git add .github/workflows/deploy-roadmap.yml
git commit -m "Fix deployment destination"
git push origin main
```

---

### Issue 5: "Other GitHub Pages content disappeared"

**Symptoms:** Brand palette or other docs no longer accessible

**Cause:** `keep_files: false` in workflow

**Solution:**
```bash
# Check workflow:
cat .github/workflows/deploy-roadmap.yml | grep keep_files

# Should say:
keep_files: true

# If false:
vim .github/workflows/deploy-roadmap.yml
# Change to: keep_files: true
```

---

## 🔧 Manual Deployment (Fallback)

If the GitHub Action is completely broken, you can deploy manually:

```bash
# 1. Switch to gh-pages
git checkout gh-pages
git pull origin gh-pages

# 2. Copy files from main
git checkout main -- docs/planning/roadmap/ROADMAP-TIMELINE.html
git checkout main -- docs/planning/roadmap/roadmap-data.json

# 3. Move to correct location
mkdir -p docs/roadmap
cp docs/planning/roadmap/ROADMAP-TIMELINE.html docs/roadmap/index.html
cp docs/planning/roadmap/roadmap-data.json docs/roadmap/roadmap-data.json

# 4. Clean up temp files
rm -rf docs/planning

# 5. Commit and push
git add docs/roadmap/
git commit -m "Manual roadmap deployment"
git push origin gh-pages

# 6. Switch back to main
git checkout main

# Wait 2-3 minutes, then check:
# https://jmcoleman.github.io/codescribe-ai/docs/roadmap/
```

---

## 📋 Workflow Overview

### What the Workflow Does:

```yaml
# Trigger: When these files change on main branch
paths:
  - 'docs/planning/roadmap/ROADMAP-TIMELINE.html'
  - 'docs/planning/roadmap/roadmap-data.json'

# Steps:
1. Checkout main branch
2. Create temp folder: .deploy/docs/roadmap/
3. Copy: ROADMAP-TIMELINE.html → .deploy/docs/roadmap/index.html
4. Copy: roadmap-data.json → .deploy/docs/roadmap/roadmap-data.json
5. Deploy .deploy/ to gh-pages at root level
6. keep_files: true (preserves other content like brand palette)
```

### File Mapping:
```
main branch:                      gh-pages branch:
docs/planning/roadmap/
├── ROADMAP-TIMELINE.html    →   docs/roadmap/index.html
└── roadmap-data.json        →   docs/roadmap/roadmap-data.json
```

### Live URL:
```
https://jmcoleman.github.io/codescribe-ai/docs/roadmap/
```

---

## 📞 Quick Checklist for Next Update

When you update the roadmap next time:

```bash
# 1. Update the HTML/JSON locally
open docs/planning/roadmap/ROADMAP-TIMELINE.html
# Press Shift+L, then Shift+S
npm run roadmap:update

# 2. Commit and push
git add docs/planning/roadmap/ROADMAP-TIMELINE.html
git add docs/planning/roadmap/roadmap-data.json
git commit -m "Update roadmap: [describe changes]"
git push origin main

# 3. Verify workflow triggered
# Go to: https://github.com/jmcoleman/codescribe-ai/actions
# Should see "Deploy Roadmap to GitHub Pages" running

# 4. Wait 3 minutes, then test
# Open in incognito:
# https://jmcoleman.github.io/codescribe-ai/docs/roadmap/
```

---

## 🆘 Emergency Contacts

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **GitHub Pages Docs:** https://docs.github.com/en/pages
- **peaceiris/actions-gh-pages:** https://github.com/peaceiris/actions-gh-pages

---

**Last Successful Deployment:** October 28, 2025
**Deployment Method:** Manual workflow trigger (first test of new configuration)
**Result:** ✅ Success - roadmap updated at /docs/roadmap/
