# Multi-File Sidebar UX Design

**Project:** CodeScribe AI
**Feature:** Multi-File Documentation with Collapsible Sidebar
**Version:** v2.7.11 (Design Phase)
**Status:** 📋 Design Document
**Last Updated:** November 15, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design Goals](#design-goals)
3. [Layout Architecture](#layout-architecture)
4. [Sidebar Behavior](#sidebar-behavior)
5. [File Management](#file-management)
6. [Bulk Operations](#bulk-operations)
7. [Split Panel Integration](#split-panel-integration)
8. [Responsive Design](#responsive-design)
9. [Accessibility](#accessibility)
10. [Technical Implementation](#technical-implementation)
11. [User Flows](#user-flows)
12. [Visual Specifications](#visual-specifications)

---

## Overview

### Problem Statement

Current CodeScribe AI supports single-file documentation. For larger projects with multiple files, users must:
- Generate documentation one file at a time
- Manually copy/paste code between files
- Lose context when switching files
- Cannot see project structure

### Solution

**Multi-file workspace with collapsible sidebar** that provides:
- File tree/list navigation
- Batch upload and generation
- Per-file status tracking
- Project-level organization
- Persistent sidebar state
- Split panel view for active file

---

## Design Goals

### Primary Goals

1. **Scale to Projects** - Handle 1-50 files efficiently
2. **Maintain Simplicity** - Don't overwhelm single-file users
3. **Progressive Disclosure** - Show complexity only when needed
4. **Preserve Screen Space** - Sidebar collapses when not needed
5. **Fast Navigation** - Quick switching between files
6. **Clear Status** - Visual feedback for generation state

### User Experience Principles

- **Familiar Patterns** - Behaves like VS Code, GitHub, JetBrains
- **Keyboard First** - All actions keyboard accessible
- **Mobile Friendly** - Adapts to small screens
- **Performance** - Handles large file lists smoothly
- **Recoverable** - Unsaved work warnings, undo actions

---

## Layout Architecture

### Three-Panel Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Logo, Actions, User Menu)                          │
├────┬────────────────────────────────────────────────────────┤
│    │ ControlBar (Doc Type, Generate, Upload, GitHub)       │
│ S  ├────────────────────────────────────────────────────────┤
│ i  │                                                        │
│ d  │  Main Content Area                                    │
│ e  │  ┌──────────────────┬──────────────────────────┐     │
│ b  │  │ Code Panel       │ Documentation Panel      │     │
│ a  │  │ (Monaco Editor)  │ (Markdown Render)        │     │
│ r  │  │                  │                          │     │
│    │  │                  │  - Empty state           │     │
│ 📁 │  │                  │  - Generated docs        │     │
│ F  │  │                  │  - Quality score         │     │
│ i  │  │                  │                          │     │
│ l  │  │                  │                          │     │
│ e  │  └──────────────────┴──────────────────────────┘     │
│ s  │                                                        │
│    │                                                        │
├────┴────────────────────────────────────────────────────────┤
│ Footer (Links, Version)                                    │
└─────────────────────────────────────────────────────────────┘
```

### Collapsed Sidebar

```
┌──────────────────────────────────────────────────────────────┐
│ Header (Logo, Actions, User Menu)                           │
├─┬────────────────────────────────────────────────────────────┤
│ │ ControlBar (Doc Type, Generate, Upload, GitHub)           │
│█├────────────────────────────────────────────────────────────┤
│█│                                                            │
│█│  Full-Width Content Area                                  │
│█│  ┌─────────────────────┬──────────────────────────────┐  │
│█│  │ Code Panel          │ Documentation Panel          │  │
│█│  │ (Monaco Editor)     │ (Markdown Render)            │  │
│█│  │                     │                              │  │
│ │  │                     │                              │  │
│📁│  │                     │                              │  │
│ │  │                     │                              │  │
│ │  │                     │                              │  │
│ │  │                     │                              │  │
│ │  └─────────────────────┴──────────────────────────────┘  │
│ │                                                            │
├─┴────────────────────────────────────────────────────────────┤
│ Footer (Links, Version)                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Sidebar Behavior

### Interaction Modes

#### **Mode 1: Expanded (Pinned)**
- **Trigger**: Click pin icon or toggle button
- **Width**: 280px (desktop), 240px (tablet)
- **Behavior**: Stays open, pushes content right
- **Persistence**: Saved to localStorage `sidebar:expanded`
- **Use Case**: Working with multiple files, project navigation

#### **Mode 2: Collapsed (Unpinned)**
- **Trigger**: Click collapse icon or Cmd+B
- **Width**: 48px (icon bar only)
- **Behavior**: Shows icon strip, hover to expand
- **Persistence**: Saved to localStorage
- **Use Case**: Focus mode, single file, small screens

#### **Mode 3: Hover Overlay (Temporary)**
- **Trigger**: Hover over collapsed sidebar for 300ms
- **Width**: 280px (overlay, doesn't push content)
- **Behavior**: Appears as overlay, auto-hides on mouse leave (500ms delay)
- **Persistence**: Not saved (temporary)
- **Use Case**: Quick file switching without changing layout

#### **Mode 4: Hidden (Mobile)**
- **Trigger**: Auto on screens < 1024px
- **Width**: 0px (completely hidden)
- **Behavior**: Accessible via hamburger menu / bottom sheet
- **Persistence**: Not applicable
- **Use Case**: Mobile devices, limited screen space

### Transition Animations

Following [ERROR-HANDLING-UX.md](ERROR-HANDLING-UX.md#animation-specifications) guidelines:

```css
/* Expand/Collapse */
.sidebar {
  transition: width 200ms ease-in-out;
}

/* Hover Overlay */
.sidebar-overlay {
  animation: slideInFade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideInFade {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## File Management

### File List Structure

#### Compact View (Default)
```
┌──────────────────────────┐
│ 📁 Files (3)         [+] │
├──────────────────────────┤
│ ✓ auth.js            ⋮  │
│ ✓ utils.ts           ⋮  │
│ ⏳ api.py             ⋮  │
├──────────────────────────┤
│ [Generate All] [Clear]   │
└──────────────────────────┘
```

#### Expanded View (with details)
```
┌────────────────────────────────┐
│ 📁 Files (3/3 generated)  [+]  │
├────────────────────────────────┤
│ ✓ auth.js                  ⋮  │
│   2.1 KB | JavaScript | A 92   │
│                                │
│ ✓ utils.ts                 ⋮  │
│   1.8 KB | TypeScript | B 85   │
│                                │
│ ⏳ api.py (Generating...)   ⋮  │
│   3.4 KB | Python | --         │
├────────────────────────────────┤
│ [Generate All] [Clear All]     │
└────────────────────────────────┘
```

### File States

| Icon | State | Description | Action |
|------|-------|-------------|--------|
| 📄 | **Uploaded** | File uploaded, not generated | Click to generate |
| ⏳ | **Generating** | AI is generating docs | Animated spinner |
| ✓ | **Generated** | Documentation complete | Click to view |
| ❌ | **Error** | Generation failed | Click to retry |
| 📝 | **Modified** | Code changed after generation | Re-generate needed |
| ⭐ | **Active** | Currently viewing this file | Purple highlight |

### File Actions

#### Per-File Actions (⋮ menu)
- **Generate Docs** - Generate documentation for this file
- **Regenerate** - Re-generate if modified
- **Download Docs** - Download .md file
- **Remove from List** - Remove file (with confirmation if unsaved)
- **Rename** - Change display name
- **Duplicate** - Create copy with new name

#### Bulk Actions (Bottom of sidebar)
- **Generate All** - Generate docs for all files without docs
- **Download All** - Download all as ZIP
- **Clear All** - Remove all files (with confirmation)
- **Upload More** - Add more files to project

### File Limits

| Tier | Max Files | Max File Size | Total Project Size |
|------|-----------|---------------|-------------------|
| **Free** | 5 files | 500 KB each | 2 MB total |
| **Pro** | 25 files | 2 MB each | 20 MB total |
| **Team** | 100 files | 5 MB each | 100 MB total |
| **Enterprise** | Unlimited | 10 MB each | 1 GB total |

---

## Bulk Operations

### Generate All Flow

```mermaid
graph TD
    A[Click Generate All] --> B{All files valid?}
    B -->|Yes| C[Show progress modal]
    B -->|No| D[Show validation errors]
    C --> E[Generate files sequentially]
    E --> F{Current file}
    F -->|Success| G[Update UI with ✓]
    F -->|Error| H[Log error, continue]
    G --> I{More files?}
    H --> I
    I -->|Yes| F
    I -->|No| J[Show completion summary]
    J --> K[Close progress modal]
```

### Progress Modal

```
┌────────────────────────────────────────┐
│ Generating Documentation              │
├────────────────────────────────────────┤
│                                        │
│  Progress: 3 of 5 files completed     │
│  ████████████░░░░░░░░  60%            │
│                                        │
│  ✓ auth.js         (2.1s)             │
│  ✓ utils.ts        (1.8s)             │
│  ⏳ api.py          (in progress...)   │
│  ⏺ database.py     (pending)          │
│  ⏺ config.py       (pending)          │
│                                        │
│  Estimated time remaining: 8s          │
│                                        │
├────────────────────────────────────────┤
│         [Cancel]        [Background]   │
└────────────────────────────────────────┘
```

**Features:**
- Real-time progress bar
- Per-file status with timing
- Estimated time remaining
- Cancel to stop (preserves completed files)
- Background to minimize (continues in background)

### Download All (ZIP)

**Filename Pattern:** `codescribe-docs-{timestamp}.zip`

**Contents:**
```
codescribe-docs-2025-11-15/
├── auth.js.md
├── utils.ts.md
├── api.py.md
├── database.py.md
├── config.py.md
└── README.md (project summary)
```

**README.md includes:**
- Project name (from folder/repo)
- Generation date/time
- File count and languages
- Overall quality score (average)
- Links to individual docs

---

## Split Panel Integration

### Within-File Split Panel

Once a file is active, split panel shows:

```
┌─────────────────────┬──────────────────────────┐
│ Code Panel          │ Documentation Panel      │
│ ┌─────────────────┐ │ ┌──────────────────────┐ │
│ │ File: auth.js   │ │ │ Quality Score: A 92  │ │
│ │                 │ │ │                      │ │
│ │ Monaco Editor   │ │ │ Markdown Rendered    │ │
│ │ (editable)      │ │ │ (read-only)          │ │
│ │                 │ │ │                      │ │
│ │                 │ │ │ [Copy] [Download]    │ │
│ └─────────────────┘ │ └──────────────────────┘ │
└─────────────────────┴──────────────────────────┘
        ↕ Resizable handle
```

### Resize Persistence

**localStorage keys:**
- `split-panel:default` - Single file mode (global)
- `split-panel:project-{projectId}` - Multi-file mode (per project)
- Defaults to 50/50 split

**Constraints:**
- Min: 30% each panel
- Max: 70% each panel
- Mobile: No resizing, stacked vertically

---

## Responsive Design

### Desktop (≥1280px)
- Sidebar: 280px expanded, 48px collapsed
- Split panel: Horizontal, resizable
- All features visible

### Tablet (768px - 1279px)
- Sidebar: 240px expanded, 40px collapsed (narrower)
- Split panel: Horizontal, resizable (tighter constraints: 35-65%)
- Hover mode works

### Mobile (< 768px)
- Sidebar: Hidden by default, accessible via bottom sheet
- Split panel: Stacked vertically, no resizing
- File list in modal overlay
- One file at a time focus

### Bottom Sheet (Mobile)

```
┌──────────────────────────────────┐
│ Main Content (dimmed)            │
│                                  │
│ (Tap outside to close)           │
│                                  │
├──────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Drag handle
│                                  │
│ 📁 Files (3)             [✕]    │
│                                  │
│ ✓ auth.js                    ⋮  │
│ ✓ utils.ts                   ⋮  │
│ ⏳ api.py                     ⋮  │
│                                  │
│ [Generate All] [Clear All]       │
│                                  │
└──────────────────────────────────┘
```

---

## Accessibility

### Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Toggle sidebar collapse |
| `Cmd/Ctrl + \` | Toggle sidebar pin |
| `Cmd/Ctrl + Shift + E` | Focus file list |
| `↑ / ↓` | Navigate file list |
| `Enter` | Open selected file |
| `Space` | Toggle file selection |
| `Cmd/Ctrl + N` | Add new file |
| `Delete` | Remove selected file |
| `Cmd/Ctrl + Shift + G` | Generate all |

### Screen Reader Support

**ARIA Labels:**
```jsx
<aside
  aria-label="File navigation sidebar"
  aria-expanded={isExpanded}
  role="complementary"
>
  <nav aria-label="Project files">
    <ul role="list">
      <li role="listitem">
        <button
          aria-label="auth.js - Generated (Quality Score A 92)"
          aria-current={isActive ? "page" : undefined}
        >
          auth.js
        </button>
      </li>
    </ul>
  </nav>
</aside>
```

**Live Regions:**
```jsx
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage} {/* "Generating documentation for api.py" */}
</div>
```

### Focus Management

- Sidebar toggle maintains focus on toggle button
- Opening file moves focus to code editor
- Closing file returns focus to file list
- Modal dialogs trap focus
- Skip links available

---

## Technical Implementation

### Component Structure

```
App.jsx
├── Header.jsx
├── Sidebar/ (NEW)
│   ├── Sidebar.jsx              # Main container
│   ├── SidebarToggle.jsx        # Collapse/expand button
│   ├── FileList.jsx             # File list container
│   ├── FileItem.jsx             # Individual file entry
│   ├── FileActions.jsx          # Per-file menu (⋮)
│   ├── BulkActions.jsx          # Generate All, Clear All
│   ├── FileUploadZone.jsx       # Drag-drop zone
│   └── ProgressModal.jsx        # Bulk generation progress
├── ControlBar.jsx
├── SplitPanel/ (NEW)
│   ├── SplitPanel.jsx           # Wrapper with react-resizable-panels
│   ├── CodePanel.jsx            # Left panel (existing)
│   └── DocPanel.jsx             # Right panel (existing)
└── Footer.jsx
```

### State Management

```javascript
// App.jsx - Multi-file state
const [files, setFiles] = useState([
  {
    id: 'file-1',
    name: 'auth.js',
    language: 'javascript',
    content: '...',
    documentation: '',
    qualityScore: null,
    status: 'uploaded', // uploaded | generating | generated | error | modified
    size: 2100,
    timestamp: Date.now(),
    error: null
  }
]);

const [activeFileId, setActiveFileId] = useState('file-1');
const [sidebarState, setSidebarState] = useState({
  isExpanded: true,
  isPinned: true,
  width: 280
});

// Derived values
const activeFile = files.find(f => f.id === activeFileId);
const generatedCount = files.filter(f => f.status === 'generated').length;
const totalCount = files.length;
```

### localStorage Schema

```javascript
// Sidebar state
localStorage.setItem('codescribe:sidebar', JSON.stringify({
  isExpanded: true,
  isPinned: true,
  width: 280
}));

// Project files (for session persistence)
localStorage.setItem('codescribe:project:files', JSON.stringify([
  {
    id: 'file-1',
    name: 'auth.js',
    content: '...',
    // ... rest of file data
  }
]));

// Active file
localStorage.setItem('codescribe:project:activeFileId', 'file-1');

// Split panel sizes (per project)
localStorage.setItem('codescribe:split-panel:project-123', JSON.stringify({
  leftPanelSize: 45,
  rightPanelSize: 55
}));
```

### API Changes

**New Endpoint: Bulk Generation**
```
POST /api/generate-bulk
Content-Type: application/json

Request:
{
  "files": [
    {
      "id": "file-1",
      "filename": "auth.js",
      "content": "...",
      "language": "javascript"
    },
    {
      "id": "file-2",
      "filename": "utils.ts",
      "content": "...",
      "language": "typescript"
    }
  ],
  "docType": "README"
}

Response (SSE Stream):
data: {"type":"progress","fileId":"file-1","status":"generating"}
data: {"type":"complete","fileId":"file-1","documentation":"...","qualityScore":{...}}
data: {"type":"progress","fileId":"file-2","status":"generating"}
data: {"type":"complete","fileId":"file-2","documentation":"...","qualityScore":{...}}
data: {"type":"done","summary":{"total":2,"successful":2,"failed":0}}
```

---

## User Flows

### Flow 1: Upload Multiple Files

```mermaid
graph TD
    A[Click Upload Files] --> B[File picker opens]
    B --> C{Select files}
    C -->|Single file| D[Add to file list]
    C -->|Multiple files| E[Add all to file list]
    D --> F[Show in sidebar]
    E --> F
    F --> G[First file becomes active]
    G --> H[Code panel shows first file]
    H --> I[User can switch files or generate]
```

### Flow 2: Generate All Documentation

```mermaid
graph TD
    A[Click Generate All] --> B{Check quota}
    B -->|Over limit| C[Show usage limit modal]
    B -->|Within limit| D[Show progress modal]
    C --> E[User upgrades or cancels]
    D --> F[Generate files sequentially]
    F --> G{All complete?}
    G -->|Yes| H[Show success summary]
    G -->|Some failed| I[Show partial success summary]
    H --> J[Update file list with ✓]
    I --> J
    J --> K[User reviews results]
```

### Flow 3: Switch Between Files

```mermaid
graph TD
    A[User clicks file in sidebar] --> B{Current file modified?}
    B -->|Yes| C[Show unsaved warning]
    B -->|No| D[Load clicked file]
    C --> E{User choice}
    E -->|Save| F[Save changes, then load]
    E -->|Discard| D
    E -->|Cancel| G[Stay on current file]
    F --> D
    D --> H[Update code panel]
    H --> I[Update doc panel]
    I --> J[Highlight active file in sidebar]
```

### Flow 4: Sidebar Collapse/Expand

```mermaid
graph TD
    A{Sidebar state}
    A -->|Expanded| B[User clicks collapse]
    A -->|Collapsed| C[User clicks expand]
    B --> D[Animate width: 280px → 48px]
    C --> E[Animate width: 48px → 280px]
    D --> F[Save state to localStorage]
    E --> F
    F --> G[Adjust split panel layout]
```

---

## Visual Specifications

### Sidebar Styling

#### Expanded State
```jsx
<aside className="
  w-[280px]
  bg-white dark:bg-slate-900
  border-r border-slate-200 dark:border-slate-700
  transition-all duration-200 ease-in-out
  flex flex-col
">
  {/* Header */}
  <div className="
    px-4 py-3
    border-b border-slate-200 dark:border-slate-700
    flex items-center justify-between
  ">
    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
      📁 Files ({totalCount})
    </h2>
    <div className="flex items-center gap-1">
      <button aria-label="Add files" className="icon-btn">
        <Plus className="w-4 h-4" />
      </button>
      <button aria-label="Collapse sidebar" className="icon-btn">
        <PanelLeftClose className="w-4 h-4" />
      </button>
    </div>
  </div>

  {/* File List */}
  <nav className="flex-1 overflow-y-auto p-2">
    {/* FileItem components */}
  </nav>

  {/* Bulk Actions */}
  <div className="
    p-3
    border-t border-slate-200 dark:border-slate-700
    flex flex-col gap-2
  ">
    <button className="btn-primary w-full text-sm">
      Generate All
    </button>
    <button className="btn-secondary w-full text-sm">
      Clear All
    </button>
  </div>
</aside>
```

#### Collapsed State
```jsx
<aside className="
  w-[48px]
  bg-white dark:bg-slate-900
  border-r border-slate-200 dark:border-slate-700
  transition-all duration-200 ease-in-out
  flex flex-col items-center
  py-3
">
  {/* Icon strip */}
  <button
    aria-label="Expand sidebar"
    className="
      p-2 rounded-lg
      hover:bg-slate-100 dark:hover:bg-slate-800
      transition-colors duration-200
    "
  >
    <PanelLeftOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
  </button>

  <div className="flex-1 mt-4 space-y-2">
    {/* File count badge */}
    <div className="
      w-8 h-8 rounded-full
      bg-purple-100 dark:bg-purple-900/30
      flex items-center justify-center
      text-xs font-bold
      text-purple-700 dark:text-purple-400
    ">
      {totalCount}
    </div>
  </div>
</aside>
```

### File Item States

#### Active File
```jsx
<button className="
  w-full px-3 py-2 rounded-lg
  bg-purple-50 dark:bg-purple-900/20
  border-l-2 border-purple-600 dark:border-purple-400
  text-left
  transition-all duration-200
">
  <div className="flex items-center gap-2">
    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
      auth.js
    </span>
  </div>
  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
    2.1 KB | JavaScript | A 92
  </div>
</button>
```

#### Generating File
```jsx
<button className="
  w-full px-3 py-2 rounded-lg
  bg-slate-50 dark:bg-slate-800/50
  border-l-2 border-blue-500 dark:border-blue-400
  text-left
  transition-all duration-200
">
  <div className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
      api.py
    </span>
  </div>
  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
    Generating...
  </div>
</button>
```

#### Error File
```jsx
<button className="
  w-full px-3 py-2 rounded-lg
  bg-red-50 dark:bg-red-900/20
  border-l-2 border-red-500 dark:border-red-400
  text-left
  transition-all duration-200
">
  <div className="flex items-center gap-2">
    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
      database.py
    </span>
  </div>
  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
    Generation failed
  </div>
</button>
```

### Color Palette

Following [COLOR-REFERENCE.md](../design/theming/COLOR-REFERENCE.md):

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Sidebar Background** | `bg-white` | `bg-slate-900` |
| **Sidebar Border** | `border-slate-200` | `border-slate-700` |
| **Active File BG** | `bg-purple-50` | `bg-purple-900/20` |
| **Active Border** | `border-purple-600` | `border-purple-400` |
| **Hover BG** | `hover:bg-slate-50` | `hover:bg-slate-800` |
| **Icon Color** | `text-slate-600` | `text-slate-400` |
| **Text Primary** | `text-slate-900` | `text-slate-100` |
| **Text Secondary** | `text-slate-600` | `text-slate-400` |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create Sidebar component structure
- [ ] Implement collapse/expand with animation
- [ ] Add localStorage persistence
- [ ] Basic file list rendering
- [ ] File selection (single file at a time)
- [ ] Integration with existing CodePanel/DocPanel

### Phase 2: Multi-File Support (Week 2)
- [ ] Multi-file state management
- [ ] File upload (multiple selection)
- [ ] File status tracking
- [ ] Per-file actions menu
- [ ] Remove file with confirmation
- [ ] Active file highlighting

### Phase 3: Bulk Operations (Week 3)
- [ ] Generate All button
- [ ] Progress modal with real-time updates
- [ ] Sequential generation with SSE
- [ ] Error handling per file
- [ ] Download All as ZIP
- [ ] Clear All with confirmation

### Phase 4: Split Panel Integration (Week 4)
- [ ] Integrate react-resizable-panels
- [ ] Per-project size persistence
- [ ] Resize handle styling
- [ ] Keyboard shortcuts
- [ ] Mobile responsive stacking

### Phase 5: Polish & Testing (Week 5)
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Mobile bottom sheet
- [ ] Hover overlay mode
- [ ] Performance optimization (virtualization for 50+ files)
- [ ] E2E tests
- [ ] Documentation

---

## Success Metrics

### User Experience
- [ ] Users can upload 10 files in < 5 seconds
- [ ] Sidebar toggle feels instant (< 200ms)
- [ ] File switching feels instant (< 100ms)
- [ ] Generate All completes 10 files in < 60 seconds
- [ ] Zero data loss on page refresh

### Accessibility
- [ ] 100% keyboard navigable
- [ ] WCAG 2.1 AA compliant
- [ ] Screen reader friendly
- [ ] Respects prefers-reduced-motion

### Performance
- [ ] Handles 50 files without lag
- [ ] Smooth scrolling in file list
- [ ] < 100ms state updates
- [ ] Efficient re-renders (React.memo)

---

## Future Enhancements

### v2.8.0+
- **Folder Organization** - Group files in folders
- **Search/Filter** - Find files by name/language
- **Sort Options** - By name, date, status, quality score
- **Drag-to-Reorder** - Custom file ordering
- **Git Integration** - See git status in file list
- **Compare View** - Diff before/after regeneration
- **Templates** - Save project structures
- **Workspace Tabs** - Multiple projects open

### v3.0.0+
- **Real-time Collaboration** - Multiple users editing
- **Cloud Sync** - Save projects to cloud
- **Version History** - Time-travel through changes
- **AI Chat** - Ask questions about project
- **Code Insights** - Project-level analysis

---

## References

### Design Systems
- **VS Code** - Sidebar patterns, file explorer
- **GitHub** - File tree navigation, status icons
- **JetBrains** - Tool windows, drag-to-dock
- **Figma** - Layers panel, collapse behavior

### CodeScribe AI Docs
- [ERROR-HANDLING-UX.md](ERROR-HANDLING-UX.md) - Animation specs
- [COLOR-REFERENCE.md](../design/theming/COLOR-REFERENCE.md) - Color palette
- [ACCESSIBILITY-AUDIT.MD](../testing/ACCESSIBILITY-AUDIT.MD) - A11y standards
- [OPTIMIZATION-GUIDE.md](../performance/OPTIMIZATION-GUIDE.md) - Performance

### Technical References
- [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lucide Icons](https://lucide.dev/)

---

**Document Status:** ✅ Design Complete, Ready for Implementation
**Next Steps:** Begin Phase 1 implementation (Sidebar foundation)
**Timeline:** 5 weeks for complete feature (Phases 1-5)
**Version Target:** v2.8.0 (Full multi-file support)
