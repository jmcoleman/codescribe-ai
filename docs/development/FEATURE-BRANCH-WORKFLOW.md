# Feature Branch Workflow

**Last Updated:** November 16, 2025
**Status:** Production Workflow

This document outlines the complete workflow for developing, testing, and deploying features using feature branches, Pull Requests, and Vercel preview deployments.

---

## Table of Contents

1. [Overview](#overview)
2. [Branch Strategy](#branch-strategy)
3. [Development Workflow](#development-workflow)
4. [Testing & Preview Workflow](#testing--preview-workflow)
5. [Merging to Production](#merging-to-production)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Goals

- ✅ Keep `main` branch stable and production-ready
- ✅ Test features thoroughly before merging
- ✅ Automate testing and deployment
- ✅ Enable preview deployments for stakeholder review
- ✅ Prevent accidental merges

### Tech Stack

- **Git:** Version control
- **GitHub Actions:** Automated CI/CD testing
- **Vercel:** Automated preview and production deployments
- **Pull Requests:** Code review and testing gate

---

## Branch Strategy

### Branch Types

| Branch Type | Purpose | Naming Convention | Lifespan |
|------------|---------|-------------------|----------|
| `main` | Production code | `main` | Permanent |
| Feature | New features/fixes | `feature/description-v{version}` | Temporary |
| Hotfix | Urgent production fixes | `hotfix/description` | Temporary |

### Branch Protection

**`main` branch is protected:**
- ❌ Cannot push directly
- ✅ Requires Pull Request
- ✅ Requires passing CI tests
- ✅ Requires code review (optional but recommended)

---

## Development Workflow

### Step 1: Create Feature Branch

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create feature branch (use descriptive name)
git checkout -b feature/multi-file-sidebar-v2.8.0

# Or for fixes
git checkout -b feature/fix-accessibility-issues
```

**Naming Convention:**
- `feature/` prefix for new features
- `hotfix/` prefix for urgent fixes
- Descriptive name with hyphens
- Include version number for major features (e.g., `v2.8.0`)

### Step 2: Develop & Commit

```bash
# Make your changes
# ...

# Run tests locally BEFORE committing
cd client && npm test -- --run
cd server && npm test

# Stage and commit changes
git add .
git commit -m "feat: add resizable split panel

- Implemented VS Code-style resize handle
- Added container queries for responsive UI
- All tests passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Commit Message Format:**
- **Type:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- **Subject:** Brief description (50 chars)
- **Body:** Detailed explanation with bullet points
- **Footer:** Attribution and links

### Step 3: Push Feature Branch

```bash
# Push to remote
git push origin feature/multi-file-sidebar-v2.8.0

# If branch already exists and you need to force push
git push --force-with-lease origin feature/multi-file-sidebar-v2.8.0
```

**What Happens:**
- ✅ Vercel automatically creates a preview deployment
- ❌ GitHub Actions does NOT run tests yet (only runs on PRs)

---

## Testing & Preview Workflow

### Step 4: Create Pull Request for Testing

**IMPORTANT:** Creating a PR does NOT merge your code. It's for testing and review.

#### Option A: GitHub Web UI (Recommended)

1. Go to: https://github.com/YOUR_USERNAME/codescribe-ai
2. Click "Pull requests" tab
3. Click "New pull request"
4. Set:
   - **Base:** `main`
   - **Compare:** `feature/multi-file-sidebar-v2.8.0`
5. Click "Create pull request"
6. **Check "Create as draft"** if not ready to merge
7. Add title and description (template below)

#### Option B: GitHub CLI (if installed)

```bash
gh pr create --base main --head feature/multi-file-sidebar-v2.8.0 \
  --title "feat: Multi-File Sidebar (v2.8.0)" \
  --draft \
  --body-file .github/pull_request_template.md
```

### PR Title Template

```
feat: [Feature Name] (v[Version])
```

Examples:
- `feat: Multi-File Sidebar (v2.8.0)`
- `fix: Accessibility Improvements`
- `refactor: Split Panel Architecture`

### PR Description Template

```markdown
## Summary
[Brief description of changes]

**Status:** 🚧 Testing in progress - NOT ready to merge

## Features Added
- ✨ [Feature 1]
- 📱 [Feature 2]
- ♿ [Feature 3]

## Test Results
- **Frontend:** X passed | Y skipped | 0 failures
- **Backend:** X passed | Y skipped | 0 failures
- **Total:** X tests passing

## Preview Deployment
Vercel preview URL will appear below once deployed.

## Testing Checklist
- [ ] Manual testing on desktop
- [ ] Responsive testing on mobile
- [ ] Accessibility testing with screen reader
- [ ] Integration testing
- [ ] No console errors

## Next Steps
1. ⏳ Wait for CI tests to pass
2. 🔍 Review Vercel preview deployment
3. 🧪 Complete testing checklist
4. ✅ Mark ready for review when satisfied

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Step 5: Wait for Automated Checks

**What Runs Automatically:**

1. **GitHub Actions** (~3-5 minutes)
   - ✅ Backend unit tests
   - ✅ Backend integration tests
   - ✅ Frontend tests
   - ✅ Lint checks
   - ✅ Security audit

2. **Vercel Deployment** (~2-3 minutes)
   - ✅ Builds preview deployment
   - ✅ Adds comment to PR with preview URL
   - ✅ Shows deployment status

**Example Vercel Comment:**
```
✅ Preview deployment ready!

🔗 Preview: https://codescribe-ai-git-feature-multi-file-sidebar-v2-8-0.vercel.app
📊 Inspect: https://vercel.com/...
```

### Step 6: Test the Preview Deployment

**Access Preview:**
1. Click the Vercel preview URL in PR comments
2. Or go to Vercel dashboard → Deployments → Find your branch

**Testing Checklist:**

#### Functional Testing
- [ ] Upload files successfully
- [ ] Generate documentation
- [ ] Download/copy documentation
- [ ] Test all new features

#### Responsive Testing
- [ ] Desktop (1920px+)
- [ ] Tablet (768px-1024px)
- [ ] Mobile (375px-767px)

#### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announcements (VoiceOver/NVDA)
- [ ] Focus indicators visible
- [ ] Color contrast sufficient

#### Performance Testing
- [ ] Page loads in <3 seconds
- [ ] No console errors
- [ ] No layout shift
- [ ] Smooth animations

#### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Step 7: Fix Issues (If Found)

**If you find bugs or issues:**

```bash
# Make fixes on your feature branch
git checkout feature/multi-file-sidebar-v2.8.0

# Make changes, then commit
git add .
git commit -m "fix: resolve resize handle flickering issue"

# Push changes
git push origin feature/multi-file-sidebar-v2.8.0
```

**What Happens Automatically:**
- ✅ GitHub Actions re-runs all tests
- ✅ Vercel creates new preview deployment
- ✅ PR updates with new status
- ✅ You can test again

**Iterate as many times as needed!** The PR stays open until you merge.

---

## Merging to Production

### Step 8: Mark PR as Ready

**When all tests pass and testing is complete:**

1. ✅ Check all CI status checks are green
2. ✅ Verify preview deployment works correctly
3. ✅ Complete testing checklist
4. ✅ Remove "Draft" status (if draft PR)
5. ✅ Request code review (optional but recommended)

**In GitHub PR:**
- Click "Ready for review" button (if draft)
- Add reviewers (optional)
- Add comment: "Testing complete, ready to merge"

### Step 9: Merge to Main

**Merge Options:**

#### Option A: Merge Commit (Recommended)
- Preserves full commit history
- Clear feature boundaries
- Easy to revert entire feature

```bash
# Via GitHub UI: Click "Merge pull request" → "Create a merge commit"
```

#### Option B: Squash and Merge
- Combines all commits into one
- Cleaner main branch history
- Loses individual commit details

```bash
# Via GitHub UI: Click "Merge pull request" → "Squash and merge"
```

#### Option C: Rebase and Merge
- Linear history
- No merge commits
- Can be confusing for complex features

**Our Recommendation:** Use **Merge Commit** for features, **Squash** for small fixes.

### Step 10: Production Deployment

**What Happens Automatically After Merge:**

1. ✅ GitHub Actions runs tests on `main` branch
2. ✅ If all tests pass, Vercel deployment webhook triggers
3. ✅ Vercel builds and deploys to production
4. ✅ Production URL updates: https://codescribeai.com
5. ✅ GitHub Actions marks deployment successful

**Monitor Deployment:**
- Vercel dashboard: https://vercel.com/dashboard
- GitHub Actions: Repository → Actions tab
- Production URL: https://codescribeai.com

### Step 11: Cleanup

```bash
# Delete local feature branch
git checkout main
git pull origin main
git branch -d feature/multi-file-sidebar-v2.8.0

# Delete remote feature branch (optional - GitHub can do this automatically)
git push origin --delete feature/multi-file-sidebar-v2.8.0
```

**GitHub Settings:**
- Enable "Automatically delete head branches" in repo settings
- Branches auto-delete after PR merge

---

## Common Scenarios

### Scenario 1: Long-Running Feature Branch

**Problem:** Feature takes days/weeks to complete, need to keep up with main.

**Solution:**

```bash
# Regularly sync with main to avoid conflicts
git checkout main
git pull origin main

git checkout feature/multi-file-sidebar-v2.8.0
git merge main

# Resolve any conflicts, then push
git push origin feature/multi-file-sidebar-v2.8.0
```

**Best Practice:** Merge from main at least once per week for long-running features.

### Scenario 2: Urgent Hotfix While Feature is in Progress

**Problem:** Production bug needs immediate fix, but feature branch is open.

**Solution:**

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-bug

# Fix the bug, test, commit
git add .
git commit -m "fix: resolve critical production bug"

# Create PR for hotfix (skip extensive testing - it's urgent)
git push origin hotfix/fix-critical-bug

# Merge hotfix PR immediately after tests pass

# Then update your feature branch with the fix
git checkout feature/multi-file-sidebar-v2.8.0
git merge main
git push origin feature/multi-file-sidebar-v2.8.0
```

### Scenario 3: Multiple People Working on Same Feature

**Problem:** Two developers need to collaborate on one feature.

**Solution:**

```bash
# Developer 1 creates feature branch and PR
git checkout -b feature/multi-file-sidebar-v2.8.0
# ... work ...
git push origin feature/multi-file-sidebar-v2.8.0

# Developer 2 checks out the same branch
git fetch origin
git checkout feature/multi-file-sidebar-v2.8.0

# Developer 2 makes changes
# ... work ...
git add .
git commit -m "feat: add sidebar component"

# Pull latest changes before pushing
git pull origin feature/multi-file-sidebar-v2.8.0

# Resolve conflicts if any, then push
git push origin feature/multi-file-sidebar-v2.8.0
```

**Best Practice:** Communicate frequently, pull often, use small commits.

### Scenario 4: PR Has Merge Conflicts

**Problem:** Main branch changed while PR was open, now has conflicts.

**Solution:**

```bash
# Update main locally
git checkout main
git pull origin main

# Go to feature branch and merge main
git checkout feature/multi-file-sidebar-v2.8.0
git merge main

# Resolve conflicts in your editor
# Look for <<<<<<< HEAD markers

# After resolving conflicts
git add .
git commit -m "chore: resolve merge conflicts with main"
git push origin feature/multi-file-sidebar-v2.8.0
```

**GitHub UI Alternative:**
- Click "Resolve conflicts" button in PR
- Edit conflicts in browser
- Commit resolution

---

## Troubleshooting

### Issue: GitHub Actions Tests Failing

**Symptoms:**
- ❌ Red X on PR checks
- Tests pass locally but fail in CI

**Solutions:**

1. **Check CI logs:**
   - PR → "Details" link next to failing check
   - Look for specific error messages

2. **Common causes:**
   - Environment variables missing (add to GitHub Secrets)
   - Node version mismatch (update `.github/workflows/test.yml`)
   - Dependency issues (`npm ci` vs `npm install`)

3. **Fix and re-run:**
   ```bash
   # Make fixes
   git add .
   git commit -m "fix: resolve CI test failures"
   git push origin feature/multi-file-sidebar-v2.8.0
   ```

### Issue: Vercel Preview Not Deploying

**Symptoms:**
- No Vercel comment on PR
- Preview URL not appearing

**Solutions:**

1. **Check Vercel dashboard:**
   - Go to vercel.com/dashboard
   - Look for failed deployments
   - Check build logs

2. **Common causes:**
   - Build errors (check Vercel logs)
   - Environment variables missing
   - Vercel integration disconnected

3. **Retry deployment:**
   - Vercel dashboard → Deployments → Click "Redeploy"
   - Or push a small change to trigger rebuild

### Issue: Cannot Merge PR (Branch Protection)

**Symptoms:**
- "Merge pull request" button is disabled
- Red status checks blocking merge

**Solutions:**

1. **Check requirements:**
   - All status checks must be green
   - No merge conflicts
   - Branch must be up to date with main

2. **Update branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/multi-file-sidebar-v2.8.0
   git merge main
   git push origin feature/multi-file-sidebar-v2.8.0
   ```

3. **Override (use sparingly):**
   - Only if you're a repo admin
   - "Merge without waiting for requirements"

### Issue: Accidentally Pushed to Main

**Symptoms:**
- Commit appears on main branch
- No PR was created

**Prevention:**
- Set up branch protection (blocks direct pushes)

**Recovery:**
```bash
# Revert the commit on main
git checkout main
git revert HEAD
git push origin main

# Move changes to feature branch
git checkout -b feature/accidental-changes
git cherry-pick <commit-sha>
git push origin feature/accidental-changes

# Create PR properly
```

---

## Best Practices

### ✅ Do

- Create feature branches for all changes
- Write descriptive commit messages
- Run tests locally before pushing
- Keep PRs focused and reasonably sized
- Test preview deployments thoroughly
- Merge from main regularly
- Delete branches after merging

### ❌ Don't

- Push directly to main
- Create PRs without testing
- Leave PRs open for months
- Merge without reviewing preview
- Skip CI checks
- Force push to main
- Commit sensitive data

---

## Quick Reference

### Common Commands

```bash
# Create and switch to feature branch
git checkout -b feature/name

# Push feature branch
git push origin feature/name

# Update feature branch with main
git checkout main && git pull origin main
git checkout feature/name && git merge main

# Delete local branch
git branch -d feature/name

# Delete remote branch
git push origin --delete feature/name
```

### PR States

| State | Meaning | Can Merge? |
|-------|---------|------------|
| Draft | Work in progress | ❌ No |
| Open | Ready for review | ✅ Yes (if checks pass) |
| Approved | Reviewed and approved | ✅ Yes |
| Changes Requested | Needs updates | ❌ No |
| Merged | Already merged | N/A |
| Closed | Rejected/abandoned | ❌ No |

### Deployment Environments

| Environment | Branch | URL | Auto-Deploy |
|------------|--------|-----|-------------|
| Local Dev | Any | http://localhost:5173 | Manual |
| Preview | Feature branches | `*.vercel.app` | ✅ Auto |
| Production | `main` | https://codescribeai.com | ✅ Auto (after tests) |

---

## Related Documentation

- [GitHub Actions CI/CD Setup](.github/workflows/test.yml)
- [Vercel Deployment Guide](../deployment/VERCEL-DEPLOYMENT-GUIDE.md)
- [Testing Guide](../testing/README.md)
- [Git Commit Conventions](GIT-COMMIT-CONVENTIONS.md)

---

**Questions or Issues?**
- Check [Troubleshooting](#troubleshooting) section
- Review [Common Scenarios](#common-scenarios)
- Open an issue on GitHub
- Contact team lead

**Last Updated:** November 16, 2025
**Maintained by:** Development Team
