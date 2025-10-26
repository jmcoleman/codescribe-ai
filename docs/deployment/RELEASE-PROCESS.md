# Release Process Guide

**Project:** CodeScribe AI
**Last Updated:** October 26, 2025

This guide documents the complete process for shipping a new release, including versioning, tagging, testing, deployment, and post-release tasks.

> **🚀 Quick Start:** For a streamlined release workflow, see [RELEASE-QUICKSTART.md](./RELEASE-QUICKSTART.md) - includes step-by-step instructions with automated CI/CD flow.

---

## 📋 Table of Contents

1. [Versioning Strategy](#versioning-strategy)
2. [Pre-Release Checklist](#pre-release-checklist)
3. [Release Steps](#release-steps)
4. [Deploying Interactive Roadmap to GitHub Pages](#️-deploying-interactive-roadmap-to-github-pages)
5. [Post-Release Tasks](#post-release-tasks)
6. [Rollback Procedure](#rollback-procedure)
7. [Release History](#release-history)

---

## 📌 Versioning Strategy

CodeScribe AI uses **Semantic Versioning (SemVer)** for public releases:

```
MAJOR.MINOR.PATCH (e.g., v1.3.0, v2.0.0)
```

- **MAJOR** (v1 → v2): Breaking changes, new product surfaces (CLI, VS Code extension)
- **MINOR** (v1.3 → v1.4): New features, backwards-compatible additions
- **PATCH** (v1.3.0 → v1.3.1): Bug fixes, maintenance, security patches

### Phase-to-Version Mapping

| Phase | Version | Description |
|-------|---------|-------------|
| Phase 1.0 | v1.0.0 | Initial web application |
| Phase 1.5 | v1.2.0 | WCAG AA compliance + production deployment |
| Phase 2 | v1.3.0 | UX improvements (mobile, filename, GitHub import, download) |
| Phase 3 | v1.4.0 | Layout enhancements (resizable panels, full-width) |
| Phase 4 | v2.0.0 | OpenAPI/Swagger (5th doc type - major feature) |
| Phase 5 | v2.1.0 | Multi-file projects (6th doc type) |
| Phase 6 | v3.0.0 | CLI tool (new product surface) |
| Phase 7 | v4.0.0 | VS Code extension (new product surface) |

### Tag Naming Convention

```bash
# Production releases
v1.3.0                    # Standard release
v1.3.1                    # Patch release
v2.0.0                    # Major release

# Phase completion tags (optional, for reference)
v1.2.0-phase-1.5         # Phase 1.5 completion
v1.3.0-phase-2           # Phase 2 completion
```

---

## ✅ Pre-Release Checklist

### 1. Code Quality & Testing

- [ ] All feature branches merged to `main`
- [ ] Working tree is clean (`git status`)
- [ ] All tests passing:
  ```bash
  # Frontend tests
  cd client && npm test

  # Backend tests
  cd server && npm test

  # E2E tests
  cd client && npm run test:e2e
  ```
- [ ] Test coverage meets targets (>90% backend, >70% frontend)
- [ ] Lighthouse audit scores meet targets:
  - Performance: ≥75/100
  - Accessibility: 100/100
  - Best Practices: ≥90/100
  - SEO: ≥90/100
- [ ] axe DevTools scan shows 0 violations
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified (iOS Safari, Android Chrome)

### 2. Documentation

- [ ] `CHANGELOG.md` updated with release notes
- [ ] `README.md` updated with new features
- [ ] API documentation updated if endpoints changed
- [ ] Architecture docs updated if structure changed
- [ ] Version number updated in `package.json` files

### 3. Security & Performance

- [ ] No secrets committed (scan with git-secrets or similar)
- [ ] Dependencies audited (`npm audit` clean or justified)
- [ ] Environment variables documented in `.env.example`
- [ ] Bundle size checked (frontend should be <100KB gzipped)
- [ ] API rate limiting tested and configured
- [ ] CORS settings verified for production

### 4. Deployment Configuration

- [ ] Vercel configuration up to date (`vercel.json`)
- [ ] Environment variables set in Vercel dashboard
- [ ] Custom domain configured (if applicable)
- [ ] CI/CD pipeline tested (GitHub Actions passing)
- [ ] Deploy hooks configured (if using test-gated deployment)

---

## 🚀 Release Steps

### Step 1: Finalize Version Number

Determine the version based on changes:

```bash
# View recent commits to assess changes
git log --oneline --since="1 month ago"

# Decide version (MAJOR.MINOR.PATCH)
# - New features = MINOR bump (v1.2.0 → v1.3.0)
# - Bug fixes only = PATCH bump (v1.3.0 → v1.3.1)
# - Breaking changes = MAJOR bump (v1.x.x → v2.0.0)
```

### Step 2: Update Version Numbers

```bash
# Update package.json versions
cd client
npm version 1.3.0 --no-git-tag-version
cd ../server
npm version 1.3.0 --no-git-tag-version
cd ..

# Commit version changes
git add client/package.json server/package.json
git commit -m "chore: bump version to v1.3.0"
```

### Step 3: Update CHANGELOG.md

Add release notes following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.3.0] - 2025-10-25

### Added
- Download button for generated documentation (MD, TXT, HTML formats)
- Filename display in code editor header
- GitHub direct file import integration
- Multi-format download with file type selector

### Changed
- Improved mobile responsiveness on small screens
- Enhanced error messages for file upload failures

### Fixed
- Monaco Editor loading race condition on slow connections
- Quality score display precision (now shows 1 decimal place)

### Security
- Updated dependencies to patch CVE-2024-XXXXX
```

Commit the changelog:

```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.3.0"
```

### Step 4: Create Git Tag

```bash
# Create annotated tag with release notes
git tag -a v1.3.0 -m "Release v1.3.0 - UX Improvements

Features:
- Download button for generated docs (MD, TXT, HTML)
- Filename display in code editor
- GitHub direct file import
- Multi-format download selector

Improvements:
- Enhanced mobile responsiveness
- Better error messaging

Bug Fixes:
- Monaco Editor loading race condition
- Quality score display precision

🤖 Generated with Claude Code
https://claude.com/claude-code"

# Verify tag
git tag -l -n9 v1.3.0

# Push code and tag to GitHub
git push origin main
git push origin v1.3.0
```

### Step 5: Test Deployment

Vercel will auto-deploy when you push to `main`. Monitor the deployment:

1. **Watch Build Logs:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click on your project
   - Monitor the deployment in progress

2. **Verify Deployment:**
   ```bash
   # Health check
   curl https://codescribeai.com/api/health

   # Test new features
   # (Manual testing checklist based on release changes)
   ```

3. **Run Smoke Tests:**
   - Visit production URL
   - Test critical user flows:
     - Code input → Generate docs → View results
     - File upload → Generate docs → Download
     - Mobile view (responsive design)
   - Check browser console for errors

### Step 6: Create GitHub Release

1. Go to [GitHub Releases](https://github.com/YOUR_USERNAME/codescribe-ai/releases)
2. Click "Draft a new release"
3. Choose tag: `v1.3.0`
4. Release title: `v1.3.0 - UX Improvements`
5. Description: Copy from CHANGELOG.md
6. Attach any release assets (screenshots, binaries, etc.)
7. Click "Publish release"

**Or use GitHub CLI:**

```bash
gh release create v1.3.0 \
  --title "v1.3.0 - UX Improvements" \
  --notes "$(cat << 'EOF'
## Features
- Download button for generated documentation (MD, TXT, HTML formats)
- Filename display in code editor header
- GitHub direct file import integration
- Multi-format download with file type selector

## Improvements
- Enhanced mobile responsiveness on small screens
- Better error messages for file upload failures

## Bug Fixes
- Monaco Editor loading race condition on slow connections
- Quality score display precision (now shows 1 decimal place)

## Security
- Updated dependencies to patch CVE-2024-XXXXX

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 🔧 Troubleshooting: Missed Release Tagging

### If You Forgot to Create a Tag/Release

Sometimes you might deploy to production and forget to create the git tag and GitHub release. Here's how to fix it retroactively:

#### Step 1: Identify the Correct Commit

Find which commit represents the missed release:

```bash
# View recent commit history
git log --oneline --all -20

# View commit graph to understand branching
git log --oneline --graph --all -10

# View full details of a specific commit
git show COMMIT_HASH --stat
```

**Key indicators of the right commit:**
- Date matches CHANGELOG.md date for the release
- Comes chronologically AFTER previous release
- Comes chronologically BEFORE next release
- Contains the changes documented in CHANGELOG.md

#### Step 2: Verify Commit in GitHub

Before tagging, confirm the commit exists in GitHub:

```bash
# Direct URL format
https://github.com/USERNAME/REPO/commit/COMMIT_HASH

# Get full commit details
git show COMMIT_HASH --stat
```

#### Step 3: Create Retroactive Tag

Create an annotated tag pointing to the specific commit (NOT current HEAD):

```bash
# Syntax: git tag -a VERSION COMMIT_HASH -m "MESSAGE"
git tag -a v1.2.1 abc123d -m "v1.2.1 - Bug fixes and improvements"

# Verify tag was created
git tag -l "v1.2.*"

# Verify tag points to correct commit
git show v1.2.1 --stat
```

**Critical Notes:**
- ✅ Use `-a` flag to create annotated tag (includes metadata)
- ✅ Include commit hash to tag a specific commit (not HEAD)
- ✅ Use meaningful message that summarizes the release
- ❌ Don't tag HEAD if you've made commits since the release

#### Step 4: Push Tag to GitHub

```bash
# Push the single tag
git push origin v1.2.1

# Verify on GitHub
# Visit: https://github.com/USERNAME/REPO/tags
```

#### Step 5: Create GitHub Release

**Option A: GitHub CLI**
```bash
gh release create v1.2.1 \
  --title "v1.2.1 - Bug Fixes" \
  --notes "Copy from CHANGELOG.md for this version"
```

**Option B: GitHub Web UI**
1. Go to: `https://github.com/USERNAME/REPO/releases/new`
2. Choose tag: Select `v1.2.1` from dropdown
3. Release title: `v1.2.1 - Bug Fixes`
4. Description: Copy relevant section from CHANGELOG.md
5. Verify target shows correct commit hash
6. Click "Publish release"

#### Common Mistakes to Avoid

❌ **Tagging HEAD when you've moved forward:**
```bash
# WRONG - tags current commit, not the v1.2.1 commit
git tag -a v1.2.1 -m "v1.2.1"
```

❌ **Creating lightweight tag:**
```bash
# WRONG - no metadata, harder to manage
git tag v1.2.1 abc123d
```

❌ **Not verifying commit in GitHub first:**
```bash
# WRONG - tag might point to local commit not pushed yet
git tag -a v1.2.1 LOCAL_COMMIT_HASH -m "v1.2.1"
```

#### Verification

After creating the retroactive tag and release:

```bash
# Check tags
git tag -l "v1.*"

# Check tag timeline
git log --oneline --decorate --all | grep -E "v1\.[0-9]"

# Visit GitHub releases page
# Verify all releases appear in chronological order
```

**For detailed troubleshooting and examples, see:**
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Retroactive tagging procedures
- [DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md) - Issue #10: Missed Release Tagging

---

## 🗺️ Deploying Interactive Roadmap to GitHub Pages

If you've updated the interactive roadmap ([ROADMAP-TIMELINE.html](../planning/roadmap/ROADMAP-TIMELINE.html)) and need to publish it to GitHub Pages:

### When to Update GitHub Pages

Update the GitHub Pages deployment when:
- Major roadmap changes (new phases, completed epics, timeline shifts)
- Version updates that affect the roadmap
- Strategic direction changes
- After completing a major release milestone

**Note:** Minor roadmap updates don't require GitHub Pages deployment - the HTML file in the main branch is the primary source.

### Deployment Steps

1. **Verify Your Changes:**
   ```bash
   # Ensure you've updated the roadmap data and HTML
   # See ROADMAP.md section "Updating the Interactive Roadmap" for data update workflow

   # Verify the HTML file has your latest changes
   open docs/planning/roadmap/ROADMAP-TIMELINE.html
   ```

2. **Check Current GitHub Pages Status:**
   ```bash
   # View current gh-pages branch
   git log gh-pages --oneline -5

   # View files currently on gh-pages
   git ls-tree gh-pages --name-only
   ```

3. **Deploy to GitHub Pages:**
   ```bash
   # Switch to gh-pages branch
   git checkout gh-pages

   # Copy the updated HTML from main branch
   git checkout main docs/planning/roadmap/ROADMAP-TIMELINE.html

   # Move to root for GitHub Pages (optional - depends on your Pages config)
   # GitHub Pages typically serves from root or /docs folder
   cp docs/planning/roadmap/ROADMAP-TIMELINE.html index.html

   # Commit and push
   git add index.html
   git commit -m "Update interactive roadmap for v2.0.0"
   git push origin gh-pages

   # Switch back to main branch
   git checkout main
   ```

4. **Verify Deployment:**
   - Visit your GitHub Pages URL: `https://[username].github.io/codescribe-ai/`
   - Verify the roadmap displays correctly
   - Test keyboard shortcuts (T, Shift+L, Shift+S)
   - Hard refresh with **Cmd+Shift+R** to bypass cache

### Alternative: Automated Deployment Script

Create a helper script for future deployments:

```bash
#!/bin/bash
# scripts/deploy-roadmap.sh

echo "🚀 Deploying interactive roadmap to GitHub Pages..."

# Verify HTML exists
if [ ! -f "docs/planning/roadmap/ROADMAP-TIMELINE.html" ]; then
    echo "❌ ROADMAP-TIMELINE.html not found"
    exit 1
fi

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Checkout gh-pages
git checkout gh-pages

# Copy latest HTML
git checkout main docs/planning/roadmap/ROADMAP-TIMELINE.html
cp docs/planning/roadmap/ROADMAP-TIMELINE.html index.html

# Commit and push
git add index.html
git commit -m "chore: update interactive roadmap from main branch"
git push origin gh-pages

# Return to original branch
git checkout "$CURRENT_BRANCH"

echo "✅ Roadmap deployed to GitHub Pages!"
echo "🌐 View at: https://[username].github.io/codescribe-ai/"
```

Make it executable:
```bash
chmod +x scripts/deploy-roadmap.sh
```

Add to `package.json`:
```json
"roadmap:deploy": "./scripts/deploy-roadmap.sh"
```

Then deploy with:
```bash
npm run roadmap:deploy
```

### Troubleshooting

**Issue: Changes don't appear on GitHub Pages**
- **Cause:** GitHub Pages caching
- **Solution:**
  - Wait 1-2 minutes for GitHub to rebuild
  - Hard refresh with Cmd+Shift+R
  - Check GitHub → Settings → Pages for build status
  - Verify gh-pages branch has your commit

**Issue: 404 error on GitHub Pages**
- **Cause:** File not at expected location
- **Solution:**
  - Verify GitHub Pages source is set to `gh-pages` branch
  - Check if Pages serves from root or `/docs` folder
  - Ensure `index.html` exists at the correct path

**Issue: Old version still showing**
- **Cause:** Browser cache or embedded data stale
- **Solution:**
  - Clear browser cache completely
  - Open in incognito/private window
  - Check if you saved embedded data with Shift+S before deploying

### GitHub Pages Configuration

Verify your repository's GitHub Pages settings:

1. Go to: `https://github.com/[username]/codescribe-ai/settings/pages`
2. **Source:** Deploy from a branch → `gh-pages` → `/ (root)`
3. **Custom domain:** (optional)
4. **Enforce HTTPS:** ✅ Enabled

### Reference Documentation

- [ROADMAP.md](../planning/roadmap/ROADMAP.md) - Section "Updating the Interactive Roadmap"
- [update-roadmap.sh](../../scripts/update-roadmap.sh) - Script for updating local HTML with backups
- GitHub Pages docs: https://docs.github.com/en/pages

---

## 📝 Post-Release Tasks

### Immediate (Within 1 Hour)

- [ ] Verify production deployment is live
- [ ] Test critical user flows on production
- [ ] Monitor error logs (Vercel, browser console)
- [ ] Check Anthropic API usage for spikes
- [ ] Announce release internally (if applicable)

### First 24 Hours

- [ ] Monitor Vercel analytics for traffic patterns
- [ ] Watch for error alerts or unexpected behavior
- [ ] Check GitHub Issues for new bug reports
- [ ] Review user feedback (if any)
- [ ] Update project status in README.md

### Within 1 Week

- [ ] Write blog post or case study (optional)
- [ ] Share on social media (LinkedIn, Twitter, etc.)
- [ ] Update portfolio with new features
- [ ] Plan next sprint/phase based on learnings
- [ ] Document any deployment issues in DEPLOYMENT-LEARNINGS.md

### Optional Marketing

- [ ] Submit to Product Hunt / Hacker News
- [ ] Share in developer communities (Reddit, Dev.to)
- [ ] Create demo video showcasing new features
- [ ] Update demo screenshots in README

---

## 🔄 Rollback Procedure

If critical issues are discovered post-release:

### Option 1: Rollback in Vercel (Fastest)

1. Go to Vercel Dashboard → Deployments
2. Find the previous stable deployment
3. Click "..." → "Promote to Production"
4. Previous version is now live (~30 seconds)

### Option 2: Revert Git Tag (Permanent Fix)

```bash
# Revert the problematic commit(s)
git revert HEAD~1

# Or reset to previous tag (use with caution)
git reset --hard v1.2.0

# Force push (only if absolutely necessary)
git push origin main --force

# Delete bad tag
git tag -d v1.3.0
git push origin :refs/tags/v1.3.0
```

### Option 3: Hot Fix Release

```bash
# Create hotfix branch from last stable tag
git checkout -b hotfix/v1.3.1 v1.3.0

# Fix the issue
# ... make changes ...

# Commit and tag
git commit -m "fix: critical bug in download feature"
git tag -a v1.3.1 -m "Hotfix: fix critical download bug"

# Push and deploy
git push origin hotfix/v1.3.1
git push origin v1.3.1

# Merge back to main
git checkout main
git merge hotfix/v1.3.1
git push origin main
```

---

## 📊 Release History

| Version | Date | Phase | Description |
|---------|------|-------|-------------|
| v1.2.2 | Oct 22, 2025 | Maintenance | Mobile compatibility, UX polish, feature flag management |
| v1.2.1 | Oct 22, 2025 | Maintenance | Bug fixes (footer alignment, download button, sign-in) |
| v1.2.0 | Oct 19, 2025 | Phase 1.5 | Production deployment + WCAG AA compliance |
| v1.1.0 | Oct 16, 2025 | Phase 1.0 | Initial web application (pre-production) |
| v1.0.0 | Oct 11, 2025 | Phase 1.0 | MVP complete (development) |

---

## 🔗 Related Documentation

- **[RELEASE-QUICKSTART.md](./RELEASE-QUICKSTART.md)** - Quick reference for standard releases
- **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** - Initial deployment setup
- **[DEPLOYMENT-LEARNINGS.md](./DEPLOYMENT-LEARNINGS.md)** - Deployment insights and troubleshooting
- **[ROADMAP.md](../planning/roadmap/ROADMAP.md)** - Product roadmap and phase planning
- **[CHANGELOG.md](../../CHANGELOG.md)** - Complete change history
- **[README.md](../../README.md)** - Project overview and status

---

## 📞 Release Manager

**Current Release Manager:** Jenni Coleman
**Contact:** GitHub Issues
**Emergency Rollback Authority:** Project Owner

---

**Last Release:** v1.2.2 (October 22, 2025)
**Next Planned Release:** v1.3.0 (Phase 2 - UX Improvements)
