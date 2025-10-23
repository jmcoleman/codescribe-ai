# GitHub Pages Setup Guide

## Goal
Host the interactive roadmap timeline at: `https://{your-github-username}.github.io/codescribe-ai/roadmap/`

**Note:** Replace `{your-github-username}` with your actual GitHub username throughout this guide.

---

## Setup Steps

You can set up GitHub Pages using either the **Command Line (CLI)** or the **GitHub Web Interface**. Choose the method that works best for you.

---

### 1. Create GitHub Pages Branch

<details open>
<summary><strong>Option A: Using Command Line (CLI)</strong></summary>

```bash
# Create a new orphan branch (no history)
git checkout --orphan gh-pages

# Clear the working directory
git reset --hard

# Create an empty initial commit
git commit --allow-empty -m "Initialize gh-pages branch"

# Push the branch to GitHub
git push origin gh-pages

# Switch back to main branch
git checkout main
```

</details>

<details>
<summary><strong>Option B: Using GitHub Web Interface</strong></summary>

1. Go to your repository: `https://github.com/{your-github-username}/codescribe-ai`
2. Click the **branch dropdown** (usually says "main") near the top-left
3. Type `gh-pages` in the text field
4. Click **"Create branch: gh-pages from 'main'"**
5. The branch is now created (it will contain a copy of main initially)

**Note:** The web UI creates a branch with history. If you prefer an orphan branch (no history), use the CLI method instead.

</details>

---

### 2. Create Public Roadmap Directory

<details open>
<summary><strong>Option A: Using Command Line (CLI)</strong></summary>

```bash
# Create the directory structure
mkdir -p docs/roadmap

# Copy the interactive roadmap to the new location
cp docs/planning/roadmap/roadmap-timeline.html docs/roadmap/index.html

# Commit the changes on main branch
git add docs/roadmap/index.html
git commit -m "Add interactive roadmap for GitHub Pages"
git push origin main
```

</details>

<details>
<summary><strong>Option B: Using GitHub Web Interface</strong></summary>

1. Go to your repository on GitHub
2. Ensure you're on the **main** branch
3. Click **Add file → Create new file**
4. In the filename field, type: `docs/roadmap/index.html`
   - GitHub will automatically create the `docs/roadmap/` directory structure
5. Copy the entire contents of `docs/planning/roadmap/interactive-roadmap-timeline.html` into the editor
6. Scroll down to **Commit new file**
7. Add commit message: `Add interactive roadmap for GitHub Pages`
8. Select **Commit directly to the main branch**
9. Click **Commit new file**

**Tip:** To copy file contents, open [docs/planning/roadmap/interactive-roadmap-timeline.html](../../planning/roadmap/interactive-roadmap-timeline.html) in GitHub, click the **Raw** button, then copy all the HTML.

</details>

---

### 3. Enable GitHub Pages in Repository Settings

**These steps are the same regardless of CLI or web interface:**

1. Go to your GitHub repository: `https://github.com/{your-github-username}/codescribe-ai`
2. Click **Settings** tab (top navigation bar)
3. Click **Pages** in the left sidebar (under "Code and automation")
4. Under **Build and deployment**:
   - **Source:** Select "Deploy from a branch"
   - **Branch:** Select `gh-pages` from the dropdown
   - **Folder:** Select `/ (root)` or `/docs` depending on your setup
5. Click **Save**
6. Wait 1-2 minutes for initial deployment
7. A green success banner will appear with your site URL

---

### 4. Verify Deployment

After deployment completes, visit:
```
https://{your-github-username}.github.io/codescribe-ai/roadmap/
```

You should see your interactive roadmap timeline.

---

## Alternative: Deploy from Main Branch `/docs` Folder

If you prefer to keep everything on the main branch:

1. **Skip step 1** (no gh-pages branch needed)
2. **Complete step 2** (create `docs/roadmap/index.html`)
3. **In GitHub Settings → Pages:**
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/docs`
4. Your site will be at: `https://{your-github-username}.github.io/codescribe-ai/roadmap/`

**Pros:** Simpler workflow, single branch
**Cons:** Entire `/docs` folder becomes public (may expose internal documentation)

---

## Update README with Link

Once deployed, add this to your main [README.md](../../README.md):

```markdown
## 📅 Roadmap

View our [interactive development timeline](https://{your-github-username}.github.io/codescribe-ai/roadmap/) to explore the project's evolution and see our progress across all phases.
```

---

## Troubleshooting

### Site Not Loading
- Check **Settings → Pages** for deployment status
- Ensure branch/folder settings are correct
- Wait 2-5 minutes after first setup
- Check **Actions** tab for deployment logs

### 404 Error
- Verify file is named `index.html` (not `interactive-roadmap-timeline.html`)
- Check file path matches GitHub Pages source folder
- Clear browser cache and try again

### Assets Not Loading
- If your HTML references external CSS/JS files, ensure they're in the same directory or use absolute paths
- Check browser console for errors

### Branch Not Appearing in Settings
- Ensure the branch was pushed to GitHub (check branches list)
- Refresh the Settings page
- The branch must have at least one file/commit to be selectable

---

## Custom Domain (Optional)

To use `roadmap.codescribeai.com`:

1. Add CNAME record in your DNS provider:
   ```
   roadmap.codescribeai.com → {your-github-username}.github.io
   ```
2. In **Settings → Pages**, add custom domain: `roadmap.codescribeai.com`
3. Enable **Enforce HTTPS**

---

## Maintenance

To update the roadmap:

**If using gh-pages branch:**

<details>
<summary><strong>Using Command Line (CLI)</strong></summary>

```bash
git checkout gh-pages
# Edit docs/roadmap/index.html
git add docs/roadmap/index.html
git commit -m "Update roadmap timeline"
git push origin gh-pages
git checkout main
```

</details>

<details>
<summary><strong>Using GitHub Web Interface</strong></summary>

1. Go to your repository on GitHub
2. Switch to the **gh-pages** branch using the branch dropdown
3. Navigate to `docs/roadmap/index.html`
4. Click the **pencil icon** (Edit this file)
5. Make your changes
6. Scroll down and click **Commit changes**
7. Add a commit message: "Update roadmap timeline"
8. Click **Commit changes**

</details>

**If using main branch `/docs`:**

<details>
<summary><strong>Using Command Line (CLI)</strong></summary>

```bash
# Edit docs/roadmap/index.html on main branch
git add docs/roadmap/index.html
git commit -m "Update roadmap timeline"
git push origin main
```

</details>

<details>
<summary><strong>Using GitHub Web Interface</strong></summary>

1. Go to your repository on GitHub (ensure you're on **main** branch)
2. Navigate to `docs/roadmap/index.html`
3. Click the **pencil icon** (Edit this file)
4. Make your changes
5. Scroll down and click **Commit changes**
6. Add a commit message: "Update roadmap timeline"
7. Click **Commit changes**

</details>

Changes will deploy automatically within 1-2 minutes.

---

## Recommendation

**Use the `/docs` folder on main branch** for simplicity, since your documentation is already well-organized and professional. This avoids managing a separate branch while keeping your roadmap version-controlled with the rest of your project.

---

Last updated: October 23, 2025
