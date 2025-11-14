# GitHub File Loader Component Guide

**Feature:** Import from GitHub
**Version:** 2.8.0+
**Components:** GitHubLoadModal, FileTree, FilePreview, SmartInput
**Location:** `client/src/components/GitHubLoader/`

---

## Overview

The GitHub File Loader allows users to import code files directly from GitHub repositories into the CodeScribe AI editor. It features a full-featured file browser with tree navigation, file preview, and smart file type validation.

---

## Component Architecture

```
GitHubLoadModal (Main container)
├── SmartInput (URL/repo input with validation)
├── Recent Files (Collapsible list of recent files)
├── FileTree (Repository browser)
│   ├── Repository header (owner/repo, stars, branch)
│   ├── Search functionality
│   └── TreeNode (Recursive tree structure)
└── FilePreview (File content preview)
    ├── File header (name, repository context, GitHub link)
    ├── Warning banners (unsupported/too large)
    ├── Content area (preview or binary placeholder)
    └── Footer stats (lines, chars, size, language)
```

---

## File Type Handling

### Binary Files (No Preview)
**Extensions:** JPG, PNG, GIF, BMP, HEIC, PDF, ZIP, EXE, MP3, MP4, WOFF, etc.

**Behavior:**
1. ✅ No API fetch (prevents errors)
2. ✅ Show "Unsupported File Type" warning (amber)
3. ✅ Show "Binary File" placeholder with icon
4. ✅ No content preview (would be gibberish)
5. ✅ No footer stats
6. ✅ "Open in GitHub" button available
7. ✅ No "Load File" button

**Code Location:**
- Detection: `client/src/services/githubService.js` → `isBinaryFile()`
- Skip fetch: `GitHubLoadModal.jsx:141-155`
- UI: `FilePreview.jsx:116-127`

### Text-based Unsupported Files
**Examples:** SVG (XML), unknown text formats

**Behavior:**
1. ✅ Fetch and preview content (first 50 lines)
2. ✅ Show "Unsupported File Type" warning (amber)
3. ✅ Show footer stats (lines, chars, size, language)
4. ✅ No "Load File" button

### Supported Files
**Extensions:** JS, JSX, TS, TSX, PY, JAVA, GO, RS, HTML, CSS, JSON, MD, etc.

**Behavior:**
1. ✅ Fetch and preview content
2. ✅ No warning banners
3. ✅ Show footer stats
4. ✅ Show "Load File" button (if under 100KB)

**Full list:** See `isFileSupported()` in `githubService.js`

---

## Error Priority System

When multiple issues exist, only the **highest priority** error is shown:

### Priority 1: Unsupported File Type (Amber Warning)
- **Condition:** File extension not in supported list OR is binary
- **Action:** Show amber warning banner
- **Load Button:** Hidden
- **File Size Highlight:** Not shown (irrelevant if unsupported)

### Priority 2: File Too Large (Red Error)
- **Condition:** File size > 100KB AND file IS supported
- **Action:** Show red error banner with size details
- **Load Button:** Hidden
- **File Size Highlight:** Red in footer

### Priority 3: No Errors
- **Condition:** File supported and under 100KB
- **Load Button:** Visible

**Code Location:** `FilePreview.jsx:81-112` (ternary operator ensures only one banner)

---

## Key Features

### 1. Smart URL Input
**Component:** `SmartInput.jsx`

**Supported Formats:**
- `owner/repo` → Loads repository root
- `owner/repo@branch` → Loads specific branch
- `github.com/owner/repo/blob/main/file.js` → Auto-selects file
- `https://github.com/owner/repo` → Full URLs

**Validation:**
- Client-side pattern matching
- Shows errors on blur or Enter key
- Clears errors immediately when typing (encouraging feedback)

**Placeholder:**
```
owner/repo or paste any GitHub URL (file URLs auto-select the file)
```

### 2. Recent Files
**Storage:** localStorage (`github_recent_files`)
**Limit:** 5 most recent files
**Display:** Collapsible list (starts expanded)

**Features:**
- Shows owner/repo/filename with visual hierarchy
- File icon with hover effects
- Path in muted text, filename in medium weight
- Disabled during loading to prevent double-clicks
- Persists across sessions

**Code Location:** `GitHubLoadModal.jsx:281-324`

### 3. File Tree Browser
**Component:** `FileTree.jsx`

**Features:**
- Recursive tree structure with folders and files
- Search with auto-expand matching folders
- Visual indicators for unsupported files (amber warning icon, grayed text)
- Selected file highlighted in purple
- Auto-scroll selected file into view
- Folder/file counts in footer

**State Management:**
- Parent controls `expandedPaths` state
- Auto-expansion for:
  - Direct file URLs
  - Recent file selections
  - Search results

**Code Location:** `FileTree.jsx:18-30` (scroll into view), `FileTree.jsx:157-189` (tree rendering)

### 4. File Preview
**Component:** `FilePreview.jsx`

**Header:**
- File name
- Repository context: `From owner/repo/path/to/file.js on branch main`
- "Open in GitHub" button (opens in new tab)

**Content Area:**
- First 50 lines for text files
- "Binary File" placeholder for binary files
- Line numbers with hover highlighting

**Footer:**
- `lines • chars • size • language` (only for non-binary files)
- Size highlighted in red if too large (and not unsupported)

---

## User Flows

### Flow 1: Load Repository by Name
1. User types `facebook/react`
2. Press Enter or click "Load Repository"
3. Tree loads with repository structure
4. User browses folders and files
5. Click file to preview
6. Click "Load File" button (if supported)

### Flow 2: Direct File URL
1. User pastes `github.com/vercel/next.js/blob/canary/readme.md`
2. Press Enter
3. Repository loads
4. Tree auto-expands to file location
5. File auto-selected and previewed
6. File scrolled into view in tree
7. User reviews preview
8. Click "Load File" button

### Flow 3: Recent Files
1. User opens modal
2. "Recent Files (5)" section visible
3. Click any recent file
4. Repository loads
5. Tree expands to file
6. File auto-selected
7. Click "Load File" to reload into editor

### Flow 4: Binary File Selection
1. User browses repository
2. Clicks `logo.png` (binary file)
3. No API fetch occurs
4. "Unsupported File Type" warning shown (amber)
5. "Binary File" placeholder in content area
6. No "Load File" button
7. User can click "Open in GitHub" to view on GitHub

### Flow 5: Oversized Supported File
1. User clicks large JavaScript file (200KB)
2. File fetches and previews first 50 lines
3. "File Too Large" error shown (red)
4. File size highlighted in red in footer
5. No "Load File" button
6. User can still read preview or open on GitHub

---

## State Management

### GitHubLoadModal State
```javascript
const [input, setInput] = useState('');                    // URL/repo input value
const [loading, setLoading] = useState(false);             // Repository loading
const [error, setError] = useState(null);                  // Top-level errors
const [filePreviewError, setFilePreviewError] = useState(null); // File preview errors
const [repository, setRepository] = useState(null);        // Loaded repo data
const [selectedFile, setSelectedFile] = useState(null);    // Currently selected file
const [filePreview, setFilePreview] = useState(null);      // File preview data
const [loadingPreview, setLoadingPreview] = useState(false); // File loading
const [recentFiles, setRecentFiles] = useState([]);        // Recent files list
const [expandedPaths, setExpandedPaths] = useState(new Set()); // Expanded folders
const [recentFilesExpanded, setRecentFilesExpanded] = useState(true); // Collapsible state
```

### FileTree State (Controlled by Parent)
- `expandedPaths` - Set of expanded folder paths (controlled)
- `searchTerm` - Local search input (internal)
- `selectedFileRef` - Ref for scroll-into-view (internal)

---

## API Integration

### Backend Service
**Location:** `server/src/services/githubService.js`

**Endpoints:**
- `POST /api/github/parse-url` - Parse GitHub URL
- `POST /api/github/file` - Fetch file content
- `POST /api/github/tree` - Fetch repository tree

### Frontend Service
**Location:** `client/src/services/githubService.js`

**Functions:**
- `parseGitHubUrl(url)` - Parse input into components
- `fetchFile(owner, repo, path, ref)` - Get file content
- `fetchTree(owner, repo, ref)` - Get repository tree
- `validateGitHubUrl(input)` - Client-side validation
- `getRecentFiles()` - Load from localStorage
- `addRecentFile(file)` - Save to localStorage (max 5)
- `isFileSupported(filename)` - Check if file can be loaded
- `isBinaryFile(filename)` - Check if file is binary

---

## Theming & Accessibility

### Dark Mode Support
All components use theme-aware colors:
- Background: `bg-white dark:bg-slate-900`
- Borders: `border-slate-200 dark:border-slate-700`
- Text: `text-slate-700 dark:text-slate-300`

### Warning Colors
- **Amber** (unsupported): `bg-amber-50 dark:bg-amber-900/20`
- **Red** (too large): `bg-red-50 dark:bg-red-900/20`
- **Purple** (selected): `bg-purple-100 dark:bg-purple-900/30`

### ARIA Attributes
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Collapsible sections: `aria-expanded`, `aria-controls`
- Error messages: `aria-invalid`, `aria-describedby`
- Tree navigation: Keyboard accessible with Enter/Space

### Keyboard Support
- **Escape** - Close modal
- **Enter** - Submit URL, toggle folders, select files
- **Tab** - Navigate between elements

---

## Performance Optimizations

1. **No fetch for binary files** - Prevents unnecessary API calls and errors
2. **50-line preview limit** - Reduces rendering for large files
3. **Auto-focus with delay** - Smooth modal animation (100ms)
4. **Scroll-into-view delay** - Wait for tree expansion (150ms)
5. **Recent files limit** - Max 5 stored in localStorage

---

## Error Handling

### Top-Level Errors (Repository)
**Location:** Error banner at top of modal
**Dismissible:** Yes
**Examples:**
- Invalid GitHub URL
- Repository not found
- API rate limit
- Network errors

### File Preview Errors
**Location:** Error banner in preview pane
**Dismissible:** Yes
**Examples:**
- File fetch failed
- File encoding issues
- Branch not found

### Validation Errors
**Location:** Below SmartInput field
**Dismissible:** No (clears when user types)
**Examples:**
- Invalid URL format
- Empty input

---

## File Size Limits

**Maximum:** 100KB (100 * 1024 bytes)

**Rationale:**
- Monaco Editor performance
- Network transfer time
- User experience (large files slow to load)

**Handling:**
- Files > 100KB show red error banner
- Size calculation uses `Blob` API for accuracy
- Preview still shows first 50 lines
- "Load File" button hidden

---

## Future Enhancements

**Potential improvements tracked in backlog:**
- Multiple file selection
- Folder import
- Private repository support (OAuth)
- File content search
- Diff view for file changes
- Branch switching within modal
- Commit history navigation

---

## Testing Guidelines

### Manual Testing Checklist
- [ ] Load repository by `owner/repo`
- [ ] Load repository by full GitHub URL
- [ ] Paste file URL and verify auto-selection
- [ ] Click recent file and verify loading
- [ ] Search for file in tree
- [ ] Collapse/expand folders
- [ ] Select binary file (verify no fetch, shows warning)
- [ ] Select oversized file (verify size error)
- [ ] Select supported file and load into editor
- [ ] Test dark mode
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test error states (invalid URL, network failure)

### Edge Cases
- Empty repository (no files)
- Repository with only binary files
- Very deep folder structure (10+ levels)
- File names with special characters
- Very long file paths (truncation)
- Repositories with thousands of files

---

## Code References

**Main Components:**
- `client/src/components/GitHubLoader/GitHubLoadModal.jsx:1-398`
- `client/src/components/GitHubLoader/FileTree.jsx:1-217`
- `client/src/components/GitHubLoader/FilePreview.jsx:1-172`
- `client/src/components/GitHubLoader/SmartInput.jsx:1-115`

**Services:**
- `client/src/services/githubService.js:1-263`
- `server/src/services/githubService.js`

**Key Functions:**
- Binary detection: `githubService.js:150-173`
- File support check: `githubService.js:180-254`
- File selection handler: `GitHubLoadModal.jsx:135-172`
- Tree expansion: `GitHubLoadModal.jsx:84-97`
- Scroll into view: `FileTree.jsx:18-30`

---

## Related Documentation

- [ERROR-HANDLING-UX.md](./ERROR-HANDLING-UX.md) - Error banner patterns
- [TOAST-SYSTEM.md](./TOAST-SYSTEM.md) - Success toast when file loaded
- [COLOR-REFERENCE.md](../design/theming/COLOR-REFERENCE.md) - Theme colors
- [GitHub OAuth Setup](../deployment/GITHUB-OAUTH-SETUP.md) - For private repos (future)

---

**Last Updated:** November 14, 2025
**Author:** Claude Code
**Status:** ✅ Complete
