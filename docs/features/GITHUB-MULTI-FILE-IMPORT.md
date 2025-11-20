# GitHub Multi-File Import - Design & Implementation

**Feature:** Multi-file import from GitHub repositories into multi-file workspace
**Status:** 📋 Planning
**Created:** November 18, 2025
**Owner:** Product Team

---

## 📋 Overview

Allow Pro+ users to select and import multiple files simultaneously from GitHub repositories into their multi-file workspace, with tier-based limits, progress tracking, and graceful error handling.

### Business Goals
- Reduce friction for users documenting multiple files from same repo
- Differentiate Pro tier from Starter (batch processing value prop)
- Maintain GitHub API rate limit budget (5000/hr shared)
- Preserve user experience on partial failures

### User Story
> As a Pro tier user, I want to select multiple files from a GitHub repository and import them all at once, so that I can efficiently document entire modules without repetitive clicking.

---

## 🎯 Key Design Decisions

### Decision 1: Batched Parallel Processing (Batch Size = 5)

**Chosen Approach:** Process 5 files concurrently per batch, then move to next batch.

**Rationale:**
- **Performance:** 5-10x faster than sequential (10 files in ~1-2 seconds vs 5 seconds)
- **User Feedback:** Progress updates after each batch (every 5 files) feels responsive
- **Rate Limit Control:** Can check GitHub API headers between batches, pause if needed
- **Memory Efficiency:** Max 5 files in memory at once (vs all files with full parallel)
- **Cancellable:** User can cancel between batches without losing partial progress
- **Error Isolation:** Individual file failures don't block the batch

**Alternatives Considered:**
- ❌ **Sequential (one at a time):** Better progress granularity but 5-10x slower
- ❌ **Full Parallel (all at once):** Fastest but no progress updates, memory spike, can't check rate limits mid-process

**Implementation:**
```javascript
const BATCH_SIZE = 5;
for (let i = 0; i < paths.length; i += BATCH_SIZE) {
  const batch = paths.slice(i, Math.min(i + BATCH_SIZE, paths.length));
  const batchPromises = batch.map(path => fetchFile(path));
  const results = await Promise.all(batchPromises);
  // Update progress: "Imported 5 of 10 files..."
}
```

---

### Decision 2: Skip Duplicate Filenames (Same as Local Upload)

**Chosen Approach:** Check for existing filenames in workspace before import. Skip duplicates with notification.

**Rationale:**
- **Consistency:** Matches existing local file upload behavior (users already familiar)
- **No Workspace Clutter:** Prevents duplicate files (`App.jsx`, `App.jsx (2)`)
- **Clear Communication:** Toast shows "Skipped 2 duplicates: App.jsx, Header.jsx"
- **Simpler Logic:** Just filter out duplicates vs. managing renamed copies
- **User Control:** User knows duplicates were skipped and can manually remove old file if needed

**Alternatives Considered:**
- ❌ **Auto-rename with counter:** Creates confusion ("which App.jsx is which?"), clutters workspace
- ❌ **Prompt user per duplicate:** Interrupts flow, annoying for multiple duplicates
- ❌ **Always overwrite:** Dangerous, user loses existing file without warning

**Implementation:**
```javascript
// Frontend: Filter duplicates before API call
const existingFilenames = new Set(workspaceFiles.map(f => f.filename));
const newPaths = selectedPaths.filter(path => {
  const filename = path.split('/').pop();
  return !existingFilenames.has(filename);
});
const duplicates = selectedPaths.filter(path => {
  const filename = path.split('/').pop();
  return existingFilenames.has(filename);
});

if (duplicates.length > 0) {
  toast.info(`Skipped ${duplicates.length} duplicate files`);
}
```

---

## 🎯 Requirements

### Functional Requirements

**FR-1: Multi-Select UI**
- ✅ Checkboxes on each file item in FileTree
- ✅ "Select All" / "Deselect All" buttons
- ✅ Visual feedback for selected state (purple highlight)
- ✅ Bulk actions footer showing selection count
- ✅ Keyboard navigation support (Space to toggle)

**FR-2: Tier-Based Access Control**
- ✅ Pro, Team, Enterprise tiers only (requires `batchProcessing` feature)
- ✅ Free/Starter users see upgrade prompt when attempting multi-select
- ✅ Tier-specific file count limits (see table below)
- ✅ Tier-specific file size limits per file

**FR-3: Batch File Fetching**
- ✅ Batched parallel processing (5 files per batch, not sequential or full parallel)
- ✅ Partial success handling (some files succeed, others fail)
- ✅ Continue processing on individual file errors
- ✅ Return detailed results array with per-file success/failure
- ✅ Skip duplicate filenames (consistent with local file upload)

**FR-4: Progress Tracking**
- ✅ Inline progress bar in modal footer (not popup modal)
- ✅ Real-time status: "Importing file 3 of 10..."
- ✅ Percentage completion indicator
- ✅ No blocking - users can cancel mid-import

**FR-5: Error Handling**
- ✅ Show list of failed files with specific error messages
- ✅ Allow retry for failed files only
- ✅ Keep modal open on partial/full failure (user reviews errors)
- ✅ Close modal automatically only on 100% success
- ✅ GitHub rate limit warnings (show remaining quota)

**FR-6: Workspace Integration**
- ✅ Add imported files to existing workspace (don't replace)
- ✅ Skip duplicate filenames (same behavior as local file upload)
- ✅ Show notification for skipped duplicates
- ✅ Sync to database + localStorage (hybrid storage)
- ✅ Show success toast with import summary

### Non-Functional Requirements

**NFR-1: Performance**
- Import 10 files in < 3 seconds (batched parallel, assuming 5KB avg file size)
- Progress updates after each batch (every 5 files)
- No UI blocking during import

**NFR-2: Rate Limiting**
- Respect GitHub API rate limits (5000/hr with token)
- Check `x-ratelimit-remaining` header after each batch completes
- Pause/warn when < 100 requests remaining
- Stop processing if < 10 requests remaining (preserve quota)
- Exponential backoff on 429 errors

**NFR-3: Accessibility**
- Checkboxes keyboard navigable (Tab, Space)
- Progress bar has ARIA live region
- Error list screen reader compatible
- All actions have keyboard shortcuts

**NFR-4: Testing**
- 90%+ unit test coverage for batch logic
- Integration tests for partial failure scenarios
- Manual testing on 3+ real GitHub repos

---

## 📐 Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHubLoadModal (React)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  FileTree (checkboxes, multi-select mode)            │  │
│  │  - Selection state: Set<string> (file paths)         │  │
│  │  - Visual feedback: purple bg for selected           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Bulk Actions Footer                                  │  │
│  │  - "8 files selected"                                 │  │
│  │  - [Import Selected] button (tier-gated)             │  │
│  │  - Progress bar (when importing)                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Error List Banner (on partial/full failure)          │  │
│  │  - "2 files failed to import (show details)"         │  │
│  │  - Collapsible list of failures with errors          │  │
│  │  - [Retry Failed] button                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    githubService.importBatchFiles()
                            ↓
                POST /api/github/files-batch
                            ↓
        ┌───────────────────────────────────────────┐
        │  Backend: Batched Parallel Fetching       │
        │  - Process 5 files per batch (parallel)   │
        │  - Validate tier file size per file       │
        │  - Check rate limit headers after batch   │
        │  - Catch errors, continue to next batch   │
        │  - Return results[] + summary             │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │  Workspace Integration                    │
        │  - Call multiFileState.addFiles()         │
        │  - DB: workspace_files table (metadata)   │
        │  - localStorage: file content             │
        │  - Show toast with summary                │
        └───────────────────────────────────────────┘
```

### Data Flow

**1. User Selects Files**
```javascript
// FileTree.jsx
const [selectedFiles, setSelectedFiles] = useState(new Set());

const handleToggleSelection = (filePath) => {
  const newSelected = new Set(selectedFiles);
  if (newSelected.has(filePath)) {
    newSelected.delete(filePath);
  } else {
    // Tier validation
    if (newSelected.size >= GITHUB_BATCH_LIMITS[userTier]) {
      toast.error(`Maximum ${GITHUB_BATCH_LIMITS[userTier]} files for ${userTier} tier`);
      return;
    }
    newSelected.add(filePath);
  }
  setSelectedFiles(newSelected);
};
```

**2. User Clicks "Import Selected"**
```javascript
// GitHubLoadModal.jsx
const handleImportSelected = async () => {
  // Tier check
  if (!hasFeature('batchProcessing')) {
    setShowUpgradePrompt(true);
    return;
  }

  // Filter out duplicates before sending to API
  const paths = Array.from(selectedFiles);
  const existingFilenames = new Set(workspaceFiles.map(f => f.filename));
  const newPaths = paths.filter(path => {
    const filename = path.split('/').pop();
    return !existingFilenames.has(filename);
  });
  const duplicates = paths.filter(path => {
    const filename = path.split('/').pop();
    return existingFilenames.has(filename);
  });

  // Notify about duplicates
  if (duplicates.length > 0) {
    const duplicateNames = duplicates.map(p => p.split('/').pop()).join(', ');
    toast.info(`Skipped ${duplicates.length} duplicate file${duplicates.length > 1 ? 's' : ''}: ${duplicateNames}`);
  }

  // No new files to import
  if (newPaths.length === 0) {
    toast.warning('All selected files already exist in workspace');
    return;
  }

  setImporting(true);
  setProgress({ current: 0, total: newPaths.length, status: 'Preparing...' });

  try {
    const { results, summary } = await githubService.importBatchFiles({
      owner: repository.owner,
      repo: repository.repo,
      paths: newPaths, // Only new files, duplicates already filtered
      ref: repository.branch,
      onProgress: (current, total, filename) => {
        setProgress({
          current,
          total,
          status: `Importing ${filename}... (${current}/${total})`
        });
      }
    });

    // Separate successes from failures
    const successfulFiles = results.filter(r => r.success).map(r => r.file);
    const failedFiles = results.filter(r => !r.success);

    // Import successful files to workspace
    if (successfulFiles.length > 0) {
      const workspaceFiles = successfulFiles.map(file => ({
        filename: file.name,
        language: file.language,
        content: file.content,
        fileSize: file.size,
        origin: 'github',
        githubRepo: `${repository.owner}/${repository.repo}`,
        githubPath: file.path,
        githubBranch: repository.branch,
        githubSha: file.sha
      }));

      await onFilesLoad(workspaceFiles); // Callback to App.jsx
    }

    // Handle results
    if (failedFiles.length === 0) {
      // 100% success - close modal, show toast
      toast.success(`Imported ${summary.successful} files from ${repository.owner}/${repository.repo}`);
      onClose();
    } else {
      // Partial or full failure - keep modal open, show errors
      setFailedFiles(failedFiles);
      setShowErrorBanner(true);

      if (summary.successful > 0) {
        toast.warning(`Imported ${summary.successful} of ${summary.total} files. ${summary.failed} failed.`);
      } else {
        toast.error(`All ${summary.total} files failed to import. See details below.`);
      }
    }

  } catch (error) {
    toast.error(`Failed to import files: ${error.message}`);
    setError(error.message);
  } finally {
    setImporting(false);
    setProgress(null);
  }
};
```

**3. Backend Batch Endpoint**
```javascript
// server/src/routes/api.js
router.post('/github/files-batch', apiLimiter, requireAuth, async (req, res) => {
  const { owner, repo, paths, ref = 'main' } = req.body;
  const user = req.user;

  // Tier validation
  const effectiveTier = getEffectiveTier(user);
  const tierConfig = getTierFeatures(effectiveTier);

  if (!hasFeature(effectiveTier, 'batchProcessing')) {
    return res.status(403).json({
      error: 'Feature not available',
      message: 'Multi-file import requires Pro tier or higher',
      currentTier: user.tier,
      effectiveTier,
      upgradePath: '/pricing'
    });
  }

  // Validate file count
  const maxFiles = GITHUB_BATCH_LIMITS[effectiveTier] || 20;
  if (paths.length > maxFiles) {
    return res.status(400).json({
      error: 'Too many files',
      message: `Maximum ${maxFiles} files per batch for ${effectiveTier} tier`
    });
  }

  // Batched parallel file fetching (5 files per batch)
  const BATCH_SIZE = 5;
  const results = [];
  let rateLimitRemaining = null;

  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, Math.min(i + BATCH_SIZE, paths.length));

    // Process batch in parallel
    const batchPromises = batch.map(async (path) => {
      try {
        const file = await githubService.fetchFile(owner, repo, path, ref);

        // Store rate limit info from response headers
        rateLimitRemaining = file.rateLimitRemaining;

        // Validate file size against user's tier
        if (file.size > tierConfig.maxFileSize) {
          return {
            path,
            success: false,
            error: `File too large (${formatBytes(file.size)}). Your ${effectiveTier} tier limit is ${formatBytes(tierConfig.maxFileSize)}.`
          };
        }

        // Success
        return {
          path,
          success: true,
          file: {
            name: file.name,
            path: file.path,
            content: file.content,
            size: file.size,
            language: file.language,
            sha: file.sha,
            url: file.url
          }
        };

      } catch (error) {
        // Individual file failure
        return {
          path,
          success: false,
          error: error.message
        };
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Rate limit check after each batch
    if (rateLimitRemaining !== null && rateLimitRemaining < 10) {
      // Stop processing remaining batches to preserve quota
      const remainingPaths = paths.slice(results.length);
      remainingPaths.forEach(path => {
        results.push({
          path,
          success: false,
          error: 'GitHub rate limit approaching. Import stopped to preserve quota.'
        });
      });
      break;
    }
  }

  // Return summary
  const successCount = results.filter(r => r.success).length;
  res.json({
    results,
    summary: {
      total: paths.length,
      successful: successCount,
      failed: paths.length - successCount
    },
    rateLimit: {
      remaining: rateLimitRemaining,
      warning: rateLimitRemaining < 100
    }
  });
});
```

**4. GitHub Service Enhancement**
```javascript
// server/src/services/githubService.js
async fetchFile(owner, repo, path, ref = 'main') {
  try {
    const response = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    // Store rate limit headers
    const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
    const rateLimitReset = response.headers['x-ratelimit-reset'];

    // Decode content
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

    return {
      name: response.data.name,
      path: response.data.path,
      content,
      size: response.data.size,
      language: this.detectLanguage(response.data.name),
      sha: response.data.sha,
      url: response.data.html_url,
      rateLimitRemaining: parseInt(rateLimitRemaining, 10),
      rateLimitReset: parseInt(rateLimitReset, 10)
    };

  } catch (error) {
    throw this.normalizeError(error);
  }
}
```

---

## 🎨 UI/UX Design

### Multi-Select Mode

**FileTree with Checkboxes:**
```jsx
┌────────────────────────────────────────────────────┐
│  📁 src/                                    [v]    │
│    ☑ App.jsx                        5.2 KB        │
│    ☐ index.js                       1.8 KB        │
│    📁 components/                          [v]    │
│      ☑ Header.jsx                   3.1 KB        │
│      ☐ Footer.jsx                   2.4 KB        │
│  📁 styles/                                 [>]    │
└────────────────────────────────────────────────────┘
```

**Bulk Actions Footer (Collapsed - No Selection):**
```jsx
┌────────────────────────────────────────────────────┐
│  [Select All]                    [Single File Mode]│
└────────────────────────────────────────────────────┘
```

**Bulk Actions Footer (Expanded - 3 Selected):**
```jsx
┌────────────────────────────────────────────────────┐
│  3 files selected                  [Deselect All]  │
│  ┌──────────────────────────────────────────────┐  │
│  │         [Import 3 Files]                     │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Progress Bar (During Import):**
```jsx
┌────────────────────────────────────────────────────┐
│  Importing file 2 of 3...                    [×]   │
│  ████████████████░░░░░░░░░░░░░░  67%              │
│  Header.jsx (3.1 KB)                               │
└────────────────────────────────────────────────────┘
```

**Error Banner (Partial Failure):**
```jsx
┌────────────────────────────────────────────────────┐
│  ⚠ 1 of 3 files failed to import   [Show Details] │
│  ┌──────────────────────────────────────────────┐  │
│  │  ❌ Footer.jsx                               │  │
│  │     File too large (2.4 MB). Your Pro tier   │  │
│  │     limit is 1 MB.                           │  │
│  └──────────────────────────────────────────────┘  │
│  [Retry Failed]                        [Close]     │
└────────────────────────────────────────────────────┘
```

**Upgrade Prompt (Free/Starter User):**
```jsx
┌────────────────────────────────────────────────────┐
│  🔒 Multi-File Import (Pro Feature)                │
│                                                     │
│  Import multiple files at once from GitHub repos.  │
│  Available on Pro tier and higher.                 │
│                                                     │
│  ✓ Import up to 20 files simultaneously            │
│  ✓ Batch process entire modules                    │
│  ✓ Save time with smart file selection             │
│                                                     │
│  [Upgrade to Pro - $29/mo]          [Maybe Later]  │
└────────────────────────────────────────────────────┘
```

---

## 📊 Tier-Based Limits

### File Count Limits (GITHUB_BATCH_LIMITS)

| Tier | Max Files per Batch | Max File Size per File | Feature Flag |
|------|---------------------|------------------------|--------------|
| Free | 1 (single-file only) | 100 KB | ❌ No batch |
| Starter | 1 (single-file only) | 500 KB | ❌ No batch |
| **Pro** | **20** | **1 MB** | ✅ `batchProcessing` |
| **Team** | **50** | **5 MB** | ✅ `batchProcessing` |
| **Enterprise** | **100** | **50 MB** | ✅ `batchProcessing` |

**Constants Location:** `client/src/constants/github.js`
```javascript
export const GITHUB_BATCH_LIMITS = {
  free: 1,
  starter: 1,
  pro: 20,
  team: 50,
  enterprise: 100
};
```

**Backend Validation:** `server/src/config/tiers.js`
```javascript
export const TIER_FEATURES = {
  pro: {
    // ...existing features
    batchProcessing: true,
    maxBatchSize: 20,
    maxFileSize: 1_000_000, // 1 MB
  },
  team: {
    // ...existing features
    batchProcessing: true,
    maxBatchSize: 50,
    maxFileSize: 5_000_000, // 5 MB
  },
  enterprise: {
    // ...existing features
    batchProcessing: true,
    maxBatchSize: 100,
    maxFileSize: 50_000_000, // 50 MB
  }
};
```

---

## 🔧 Implementation Checklist

### Phase 1: Multi-Select UI (4-5 hours)

**Files to Create:**
- [ ] `client/src/constants/github.js` - Batch limits constants

**Files to Modify:**
- [ ] `client/src/components/GitHubLoader/FileTree.jsx`
  - [ ] Add `multiSelectMode` prop (boolean)
  - [ ] Add checkbox to each file item (styled like Sidebar/FileItem)
  - [ ] Add selection state: `useState(new Set())`
  - [ ] Add `onToggleSelection(filePath)` handler
  - [ ] Add visual selected state (purple bg: `bg-purple-50 dark:bg-purple-900/20`)
  - [ ] Add keyboard support (Space key toggles checkbox)
  - [ ] Prevent row click when checkbox clicked (`e.stopPropagation()`)

- [ ] `client/src/components/GitHubLoader/GitHubLoadModal.jsx`
  - [ ] Add tier feature check: `const { hasFeature } = useTierFeatures()`
  - [ ] Add selection state management
  - [ ] Add "Select All" / "Deselect All" buttons
  - [ ] Add bulk actions footer component
  - [ ] Add tier validation (show upgrade prompt if Free/Starter)
  - [ ] Add max file count validation using `GITHUB_BATCH_LIMITS[tier]`
  - [ ] Update footer to show selection count vs. single file info

**Acceptance Criteria:**
- ✅ Checkboxes appear on all file items in tree
- ✅ Clicking checkbox toggles selection (doesn't trigger row click)
- ✅ Selected files have purple background
- ✅ Selection count shows in footer: "3 files selected"
- ✅ "Select All" / "Deselect All" buttons work
- ✅ Free/Starter users see upgrade prompt when selecting 2+ files
- ✅ Pro users blocked at 20 files, Team at 50, Enterprise at 100

---

### Phase 2: Backend Batch Endpoint (3-4 hours)

**Files to Modify:**
- [ ] `server/src/routes/api.js`
  - [ ] Add new route: `POST /api/github/files-batch`
  - [ ] Add tier validation (requireAuth + check `batchProcessing` feature)
  - [ ] Add file count validation (check against tier's maxBatchSize)
  - [ ] Implement sequential file fetching loop
  - [ ] Add per-file error handling (continue on failure)
  - [ ] Add rate limit monitoring (check headers, stop if < 10 remaining)
  - [ ] Return results array + summary object

- [ ] `server/src/services/githubService.js`
  - [ ] Update `fetchFile()` to return rate limit headers
  - [ ] Add tier-aware file size validation (accept `userTier` param)
  - [ ] Store rate limit info in response

- [ ] `server/src/config/tiers.js`
  - [ ] Add `maxBatchSize` to Pro, Team, Enterprise tiers
  - [ ] Verify `maxFileSize` is correct for each tier

**Request Schema:**
```typescript
{
  owner: string;        // "facebook"
  repo: string;         // "react"
  paths: string[];      // ["src/index.js", "src/App.jsx"]
  ref?: string;         // "main" (default)
}
```

**Response Schema:**
```typescript
{
  results: Array<{
    path: string;
    success: boolean;
    file?: {
      name: string;
      path: string;
      content: string;
      size: number;
      language: string;
      sha: string;
      url: string;
    };
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  rateLimit: {
    remaining: number;
    warning: boolean;  // true if < 100
  };
}
```

**Acceptance Criteria:**
- ✅ Endpoint returns 403 for Free/Starter users
- ✅ Endpoint returns 400 if file count exceeds tier limit
- ✅ Sequential processing (not parallel)
- ✅ Partial success handling (some succeed, some fail)
- ✅ Each failed file has specific error message
- ✅ Rate limit headers checked after each request
- ✅ Processing stops if rate limit < 10 remaining

---

### Phase 3: Frontend Integration (3-4 hours)

**Files to Create:**
- [ ] `client/src/components/GitHubLoader/ImportProgress.jsx` - Progress bar component
- [ ] `client/src/components/GitHubLoader/ImportErrorList.jsx` - Error list component

**Files to Modify:**
- [ ] `client/src/services/githubService.js`
  - [ ] Add `importBatchFiles(owner, repo, paths, ref, onProgress)` method
  - [ ] Call `POST /api/github/files-batch` endpoint
  - [ ] Parse results, separate successes from failures
  - [ ] Trigger `onProgress` callback for real-time updates

- [ ] `client/src/components/GitHubLoader/GitHubLoadModal.jsx`
  - [ ] Add `handleImportSelected()` function
  - [ ] Add progress state: `{ current, total, status }`
  - [ ] Add failed files state: `failedFiles[]`
  - [ ] Add importing state: `isImporting`
  - [ ] Render `<ImportProgress />` when importing
  - [ ] Render `<ImportErrorList />` when failures exist
  - [ ] Call `onFilesLoad(files[])` callback with successful files
  - [ ] Keep modal open on partial/full failure
  - [ ] Close modal automatically only on 100% success
  - [ ] Show summary toast

- [ ] `client/src/App.jsx`
  - [ ] Add `handleGitHubBatchImport(files[])` function
  - [ ] Call `multiFileState.addFiles(files)` for batch import
  - [ ] Pass new callback to GitHubLoadModal: `onFilesLoad={handleGitHubBatchImport}`

**Acceptance Criteria:**
- ✅ Progress bar shows during import
- ✅ Status updates in real-time: "Importing file 3 of 10..."
- ✅ Percentage shown: "67%"
- ✅ Cancel button stops import
- ✅ Successful files added to workspace immediately
- ✅ Failed files shown in collapsible error list
- ✅ Modal stays open on failures
- ✅ Modal closes automatically on 100% success
- ✅ Toast shows summary: "Imported 8 of 10 files. 2 failed."

---

### Phase 4: Error Handling & UX Polish (2-3 hours)

**Enhancements:**
- [ ] **Upgrade Prompt Component**
  - [ ] Show when Free/Starter user tries multi-select
  - [ ] Highlight Pro tier benefits
  - [ ] Link to /pricing

- [ ] **Partial Failure UX**
  - [ ] Collapsible error list (default: collapsed)
  - [ ] "2 files failed to import (show details)" header
  - [ ] Each failed file shows specific error
  - [ ] "Retry Failed" button to re-attempt only failures
  - [ ] Successful files already in workspace (not retried)

- [ ] **Progress Enhancements**
  - [ ] Show current filename being fetched
  - [ ] Show file size: "Header.jsx (3.1 KB)"
  - [ ] Animate progress bar smoothly
  - [ ] Cancel button with confirmation

- [ ] **Rate Limit Warnings**
  - [ ] Show GitHub quota in modal footer: "API quota: 4,856 remaining"
  - [ ] Yellow warning banner when < 100 remaining
  - [ ] Red error banner when < 10 remaining
  - [ ] Pause import if rate limit hit, show "Rate limit exceeded" error

- [ ] **Duplicate Filename Handling**
  - [ ] Check for existing files in workspace before API call
  - [ ] Filter out duplicates (don't import)
  - [ ] Show toast: "Skipped 2 duplicates: App.jsx, Header.jsx"
  - [ ] Include in summary: "Imported 8 of 10 files (2 duplicates skipped)"

**Acceptance Criteria:**
- ✅ Free users see upgrade prompt (can't enable multi-select)
- ✅ Error list shows specific errors per file
- ✅ Retry button re-attempts only failed files
- ✅ Progress bar animates smoothly
- ✅ Cancel button works mid-import
- ✅ Rate limit warnings appear appropriately
- ✅ Duplicate filenames handled gracefully

---

### Phase 5: Testing (3-4 hours)

**Unit Tests:**
- [ ] `client/src/components/GitHubLoader/GitHubLoadModal.test.jsx`
  - [ ] Multi-select mode toggles correctly
  - [ ] Selection state updates on checkbox click
  - [ ] Max file count enforced per tier
  - [ ] Upgrade prompt shown for Free/Starter users
  - [ ] Import button disabled when no files selected

- [ ] `server/src/routes/__tests__/api-github-batch.test.js`
  - [ ] Returns 403 for Free/Starter users
  - [ ] Returns 400 for too many files
  - [ ] Sequential processing works
  - [ ] Partial success returns correct results
  - [ ] Rate limit checking stops processing
  - [ ] File size validation per tier works

**Integration Tests:**
- [ ] `client/src/__tests__/integration/github-batch-import.test.js`
  - [ ] Import 10 files successfully (all files added to workspace)
  - [ ] Import with 2 files exceeding size limit (8 succeed, 2 fail)
  - [ ] Import with rate limit hit (processing stops, partial results)
  - [ ] Cancel mid-import (partial files loaded)

**Manual Testing Checklist:**
- [ ] Test on real GitHub repos (public)
  - [ ] Small repo: 5-10 files (facebook/react/packages/react/src)
  - [ ] Medium repo: 20-30 files (vercel/next.js/packages/next/server)
  - [ ] Large repo: 50+ files (Microsoft/vscode/src/vs/editor)
- [ ] Test tier enforcement
  - [ ] Free user sees upgrade prompt
  - [ ] Pro user blocked at 21 files
  - [ ] Team user blocked at 51 files
- [ ] Test error scenarios
  - [ ] Some files exceed tier file size limit
  - [ ] Some files are binary (unsupported)
  - [ ] Repository is private (403 error)
  - [ ] Invalid file paths (404 error)
- [ ] Test UX flows
  - [ ] 100% success (modal closes, toast shown)
  - [ ] Partial failure (modal stays open, errors shown)
  - [ ] 100% failure (all errors shown)
  - [ ] Retry failed files (only failures re-attempted)
  - [ ] Cancel mid-import (partial results loaded)
- [ ] Test accessibility
  - [ ] Keyboard navigation (Tab, Space, Enter)
  - [ ] Screen reader announces selection count
  - [ ] Progress bar has ARIA live region
  - [ ] Error list is screen reader compatible

**Acceptance Criteria:**
- ✅ 90%+ unit test coverage for batch logic
- ✅ All integration tests pass
- ✅ Manual testing completed on 3+ repos
- ✅ No regressions in single-file import flow
- ✅ Accessibility audit passes (no new violations)

---

## 🚀 Deployment Plan

### Phase 1: Soft Launch (Pro+ Users Only)
1. Deploy to production with feature flag (default: enabled for Pro+)
2. Monitor error rates, GitHub API usage, user feedback
3. Track metrics:
   - Avg files per batch import
   - Success rate (% of files successfully imported)
   - Time to import (avg seconds per file)
   - GitHub API quota consumption

### Phase 2: General Availability (1-2 weeks)
1. Remove feature flag, enable for all Pro+ users
2. Add onboarding tooltip: "Try multi-file import! Select multiple files from GitHub repos."
3. Document in help center / user guide

### Rollback Plan
- Feature flag: `ENABLE_GITHUB_BATCH_IMPORT=false` (env var)
- Disable multi-select mode in GitHubLoadModal
- Show "Feature temporarily disabled" message

---

## 📈 Success Metrics

### Adoption Metrics
- % of Pro+ users who use multi-file import (target: 30% within 30 days)
- Avg files per batch (target: 5-10 files)
- Repeat usage rate (target: 50% use 2+ times)

### Performance Metrics
- Import success rate (target: 95%+)
- Avg import time (target: < 2 seconds per file)
- GitHub API quota consumption (target: < 50% of daily limit)

### Quality Metrics
- Error rate (target: < 5% of imports have failures)
- User-reported bugs (target: < 5 in first month)
- Support tickets related to batch import (target: < 10 in first month)

### Business Metrics
- Pro tier conversion lift (target: +5% from Free/Starter)
- Avg docs generated per Pro user (expect increase from batch usage)
- User satisfaction (NPS survey: target 8+/10)

---

## 🔮 Future Enhancements

### V2 Features (Q1 2026)
1. **Smart File Selection**
   - "Select all .jsx files"
   - "Select all components/"
   - Pattern matching: `src/**/*.test.js`

2. **Import Templates**
   - Save selection as template: "React Components"
   - Quick import: "Load React Components template"
   - Share templates across team (Team tier only)

3. **GitHub Integration Enhancements**
   - Private repo support (OAuth GitHub login)
   - Branch comparison: "Import changed files since last commit"
   - Pull request integration: "Import all PR files"

4. **Performance Optimizations**
   - Parallel fetching (batch groups of 5)
   - Caching: Store repo trees for 1 hour
   - Prefetch file previews on hover

5. **Advanced Error Handling**
   - Auto-retry on transient failures (429, 503)
   - Smart rate limiting (pause/resume based on quota)
   - Webhook integration for private repos

---

## 📚 References

### Related Documentation
- [Multi-File Integration Plan](./MULTI-FILE-INTEGRATION-PLAN.md)
- [Multi-File Sidebar UX](./MULTI-FILE-SIDEBAR-UX.md)
- [GitHub API Scaling Guide](../architecture/GITHUB-API-SCALING.md)
- [Tier System Documentation](../architecture/SUBSCRIPTION-FLOWS.md)

### External Resources
- [GitHub REST API - Contents](https://docs.github.com/en/rest/repos/contents)
- [GitHub Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [Octokit REST.js](https://octokit.github.io/rest.js/)

---

## 🤝 Stakeholders

**Owner:** Product Team
**Engineering Lead:** [TBD]
**Design Review:** [TBD]
**QA Lead:** [TBD]

**Review Schedule:**
- Daily standups during implementation
- Mid-phase demo (after Phase 2)
- Pre-launch review (after Phase 4)
- Post-launch retrospective (1 week after GA)

---

## ✅ Sign-Off

- [ ] **Product:** Requirements approved
- [ ] **Engineering:** Technical design approved
- [ ] **Design:** UI/UX approved
- [ ] **QA:** Test plan approved
- [ ] **Ready to implement:** All sign-offs complete

---

**Last Updated:** November 18, 2025
**Status:** 📋 Planning → Ready for implementation
**Next Steps:** Begin Phase 1 (Multi-Select UI)
