# File Details Panel Design

**Status**: Approved for Implementation
**Date**: November 19, 2025
**Feature**: Multi-file sidebar metadata panel

---

## Overview

Slide-out panel to display detailed file metadata, accessible via the **FileActions menu** (multi-file sidebar file card menu, NOT code panel menu). The panel follows existing patterns (custom focus management like AppearanceModal) and meets WCAG AA accessibility standards.

---

## Requirements Summary

1. ✅ **Actions off panel** - Add download to FileActions menu (already exists)
2. ✅ **Menu access + keyboard shortcut** - "View Details" or "File Meta" menu item
3. ✅ **Configurable card metadata** - Design now, implement future
4. ✅ **DocType always visible** - Shown in panel and card (no "Generated:" prefix)
5. ✅ **No info icon** - Access via menu only
6. ✅ **Custom focus management** - Use existing `useFocusTrap` hook pattern
7. ✅ **WCAG AA accessibility** - Full compliance
8. ✅ **Tablet/mobile equivalents** - Bottom sheet for mobile

---

## Key Findings from Codebase

### Focus Management (Requirement #6)
- ✅ App uses **custom `useFocusTrap` hook**, NOT focus-trap-react library
- Implementation: `client/src/hooks/useFocusTrap.js`
- Example: `AppearanceModal.jsx` (custom focus trap + arrow key navigation)
- FileDetailsPanel will use same pattern for consistency

### FileActions Menu Location
- **Multi-file sidebar**: `client/src/components/Sidebar/FileActions.jsx`
- Already has: Generate Docs, View in History, Regenerate, Download Docs, Delete
- **Code panel menu**: Different component (not relevant for this feature)

### File Metadata Available
- `origin` - upload | github | paste | sample
- `docType` - README | JSDOC | API | ARCHITECTURE
- `language` - javascript, python, etc.
- `fileSize` - bytes
- `content` - calculate lines of code
- `documentation` - generated docs
- `qualityScore` - { grade, score }
- `documentId` - DB reference
- `isGenerating` - boolean
- `error` - string | null

---

## File Details Panel Component

### Metadata Sections

**1. File Information**
- Filename (with extension)
- File type (e.g., "JavaScript File")
- File size (formatted: KB/MB)
- Lines of code (calculated from content.split('\n').length)
- **Origin** (Upload | GitHub Import | Code Panel | Sample)

**2. Documentation** (Always visible - Requirement #4)
- **Doc Type**: README _(no "Generated:" or "Will generate:" prefix)_
- Quality Score (if generated): A 92 / 100
- Status: Not generated | Generating... | Generated | Error
- Generated date (if available)

**3. Timestamps**
- Date added
- Last modified (if content changed)

### Layout Example (Desktop)

```
┌─────────────────────────────┐
│ File Details            [X] │ ← Header with close button
├─────────────────────────────┤
│ example.js                  │ ← Filename (large)
│                             │
│ File Information            │ ← Section heading
│ Type      JavaScript File   │
│ Size      2.4 KB            │
│ Lines     87                │
│ Origin    GitHub Import     │
│                             │
│ Documentation               │ ← Always visible
│ Type      README            │ ← No prefix, just type
│ Quality   A 92 / 100        │
│ Status    Generated         │
│ Created   Nov 19, 2:34 PM   │
│                             │
│ Timestamps                  │
│ Added     Nov 19, 2:30 PM   │
│ Modified  Nov 19, 2:33 PM   │
└─────────────────────────────┘
```

### Responsive Design (Requirement #8)

**Desktop** (≥768px):
- Right slide-out panel
- Width: 320px
- Height: 100vh
- Position: fixed right side
- Animation: slide from right

**Tablet/Mobile** (<768px):
- Bottom sheet
- Width: 100%
- Height: 60vh
- Position: fixed bottom
- Animation: slide from bottom
- Touch: swipe down to close

---

## Implementation Details

### Access Pattern (Requirement #2)

**Via FileActions Menu**:
- Menu location: Multi-file sidebar file card (FileActions.jsx)
- Menu item: "View Details" or "File Meta"
- Icon: `Info` from lucide-react
- Position: Top of menu (before "Generate Docs")
- Label: "View Details (⌘I)"

**Via Keyboard Shortcut**:
- Shortcut: `Cmd/Ctrl + I` (for Info)
- Scope: When file is focused in sidebar
- Behavior: Opens panel for focused file

### File Structure

**New Files** (2):
```
client/src/components/Sidebar/FileDetailsPanel.jsx
client/src/constants/fileMetadata.js
```

**Modified Files** (2):
```
client/src/components/Sidebar/FileActions.jsx
client/src/components/Sidebar/FileList.jsx
```

### Component API

**FileDetailsPanel.jsx**:
```jsx
<FileDetailsPanel
  file={fileObject}
  isOpen={boolean}
  onClose={function}
/>
```

**FileActions.jsx** (updated):
```jsx
<FileActions
  file={fileObject}
  onRemove={function}
  onGenerate={function}
  onViewDetails={function}  // NEW
/>
```

**FileList.jsx** (updated):
```jsx
const [detailsFileId, setDetailsFileId] = useState(null);

// In render:
{detailsFileId && (
  <FileDetailsPanel
    file={files.find(f => f.id === detailsFileId)}
    isOpen={true}
    onClose={() => setDetailsFileId(null)}
  />
)}
```

---

## Configurable Card Metadata (Requirement #3)

### Design for Future Implementation

**File**: `client/src/constants/fileMetadata.js`

```javascript
/**
 * Available metadata fields for file cards
 * Future: User can configure which fields show, in what order
 */
export const AVAILABLE_METADATA_FIELDS = [
  {
    id: 'docType',
    label: 'Doc Type',
    alwaysVisible: true, // Cannot be hidden
    format: (value) => value || 'README'
  },
  {
    id: 'qualityGrade',
    label: 'Quality',
    alwaysVisible: false,
    format: (file) => file.qualityScore
      ? `${file.qualityScore.grade} ${file.qualityScore.score}`
      : null
  },
  {
    id: 'language',
    label: 'Language',
    alwaysVisible: false,
    format: (value) => value || 'Unknown'
  },
  {
    id: 'fileSize',
    label: 'Size',
    alwaysVisible: false,
    format: (bytes) => {
      if (!bytes) return '0 B';
      const kb = bytes / 1024;
      if (kb < 1) return `${bytes} B`;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      return `${(kb / 1024).toFixed(1)} MB`;
    }
  },
  {
    id: 'origin',
    label: 'Origin',
    alwaysVisible: false,
    format: (value) => {
      const labels = {
        upload: 'Upload',
        github: 'GitHub',
        paste: 'Pasted',
        sample: 'Sample'
      };
      return labels[value] || value;
    }
  },
  {
    id: 'linesOfCode',
    label: 'Lines',
    alwaysVisible: false,
    format: (file) => file.content?.split('\n').length || 0
  }
];

/**
 * Default metadata shown on file cards
 * Current: hardcoded in FileItem.jsx (lines 191-209)
 * Future: User configurable via settings
 */
export const DEFAULT_CARD_METADATA = [
  'docType',      // Always visible (Requirement #4)
  'qualityGrade', // If available
  'language',
  'fileSize'
];
```

**Current Implementation**:
- Use existing hardcoded fields in FileItem.jsx
- Overflow handling already implemented (lines 178-223)
- Tooltip shows full metadata on hover

**Future Enhancement**:
- Add user settings UI for field selection
- Drag-and-drop to reorder fields
- Toggle visibility per field
- Save preferences to localStorage

---

## Accessibility (Requirement #7 - WCAG AA)

### Focus Management
- ✅ Custom `useFocusTrap` hook (consistent with AppearanceModal)
- ✅ Focus first focusable element on open (close button)
- ✅ Trap Tab/Shift+Tab navigation within panel
- ✅ Return focus to trigger element on close
- ✅ ESC key closes panel
- ✅ Backdrop click closes panel

### ARIA Attributes
```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="file-details-title"
  className="..."
>
  <h2 id="file-details-title">File Details</h2>
  {/* ... */}
</div>
```

### Keyboard Navigation
- **Tab/Shift+Tab**: Navigate focusable elements within panel
- **ESC**: Close panel
- **Cmd/Ctrl + I**: Open panel (when file focused)
- **Enter/Space**: Activate close button

### Color Contrast
- Use existing color palette (WCAG AA compliant)
- Section headings: `text-slate-700 dark:text-slate-300`
- Metadata labels: `text-slate-600 dark:text-slate-400`
- Metadata values: `text-slate-900 dark:text-slate-100`

### Screen Reader Support
- Announce panel opening: "File Details dialog opened"
- Announce panel closing: "File Details dialog closed"
- Section headings properly structured (h2, h3)
- Metadata fields in semantic list structure

---

## Implementation Phases

### Phase 1: Core Functionality (Current)
✅ All 8 requirements addressed

**Tasks**:
1. Create FileDetailsPanel.jsx component
   - Desktop layout (right slide-out, 320px)
   - Mobile layout (bottom sheet, 60vh)
   - Custom focus trap (useFocusTrap)
   - Metadata sections (File Info, Documentation, Timestamps)

2. Update FileActions.jsx
   - Add "View Details" menu item (top of menu)
   - Add `onViewDetails` prop
   - Show keyboard shortcut hint "⌘I"

3. Update FileList.jsx
   - Add state: `const [detailsFileId, setDetailsFileId] = useState(null)`
   - Render FileDetailsPanel when file selected
   - Pass onViewDetails handler to FileItem → FileActions
   - Handle keyboard shortcut (Cmd/Ctrl + I)

4. Create fileMetadata.js (for future use)
   - Field definitions
   - Default card metadata
   - Format functions

5. Testing
   - Component tests (open/close, ESC, backdrop)
   - Accessibility tests (keyboard, focus trap, screen reader)
   - Responsive tests (desktop, tablet, mobile)

### Phase 2: Future Enhancements
- User settings for card metadata configuration
- Field order customization UI
- Additional metadata fields (dependencies, imports)
- Drag-and-drop field ordering

---

## Design Decisions Summary

| Requirement | Decision | Implementation |
|-------------|----------|----------------|
| #1 Actions off panel | ✅ Metadata-only panel | Download already in FileActions menu |
| #2 Menu access + shortcut | ✅ "View Details" + Cmd/Ctrl+I | Top of FileActions menu |
| #3 Configurable cards | ⏳ Design now, build later | fileMetadata.js created |
| #4 DocType always visible | ✅ No prefix, just type | "README" (not "Generated: README") |
| #5 Info icon | ✅ No icon | Menu-only access |
| #6 Focus management | ✅ Custom useFocusTrap | Matches AppearanceModal |
| #7 WCAG AA | ✅ Full compliance | Focus trap, keyboard, ARIA, contrast |
| #8 Mobile equivalent | ✅ Bottom sheet | Slide from bottom, 60vh height |

---

## Testing Plan

### Component Tests
```javascript
// FileDetailsPanel.test.jsx
- Renders with file data
- Closes on ESC key
- Closes on backdrop click
- Closes on close button
- Shows correct metadata sections
- Formats file size correctly
- Formats origin correctly
- Mobile: renders as bottom sheet
- Desktop: renders as right slide-out
```

### Accessibility Tests
```javascript
// FileDetailsPanel.a11y.test.jsx
- Focus traps within panel
- Tab navigation works
- Shift+Tab navigation works
- ESC closes panel
- Focus returns to trigger on close
- ARIA attributes present
- Color contrast meets WCAG AA
- Screen reader announcements
```

### Integration Tests
```javascript
// FileList integration
- Opens panel on menu click
- Opens panel on Cmd/Ctrl+I
- Shows correct file data
- Closes panel correctly
- Multiple files: switches between details
```

---

## Visual Design

### Desktop Layout (≥768px)

```
┌────────────────────────────┐
│ Backdrop (click to close)  │ ← bg-slate-900/20 backdrop-blur-sm
│                            │
│                     ┌──────┴──────────────────┐
│                     │ File Details        [X] │ ← Header
│                     ├─────────────────────────┤
│                     │ example.js              │ ← Filename (text-lg)
│                     │                         │
│                     │ File Information        │ ← h3
│                     │ Type  JavaScript File   │ ← Label/Value pairs
│                     │ Size  2.4 KB            │
│                     │ Lines 87                │
│                     │ Origin GitHub Import    │
│                     │                         │
│                     │ Documentation           │ ← h3
│                     │ Type  README            │ ← No prefix
│                     │ Quality A 92 / 100      │
│                     │ Status Generated        │
│                     │ Created Nov 19, 2:34 PM │
│                     │                         │
│                     │ Timestamps              │ ← h3
│                     │ Added Nov 19, 2:30 PM   │
│                     │ Modified Nov 19, 2:33 PM│
│                     │                         │
│                     └─────────────────────────┘
│                                              ↑
│                                         320px width
│                                         100vh height
└──────────────────────────────────────────────┘
```

### Mobile Layout (<768px)

```
┌────────────────────────────┐
│ Backdrop (click to close)  │ ← bg-slate-900/20 backdrop-blur-sm
│                            │
│                            │
│                            │
│ ┌──────────────────────────┐ ← Swipe down to close
│ │ File Details        [X]  │ ← Header
│ ├──────────────────────────┤
│ │ example.js               │
│ │                          │
│ │ File Information         │
│ │ Type  JavaScript File    │
│ │ Size  2.4 KB             │
│ │ Lines 87                 │
│ │ Origin GitHub Import     │
│ │                          │
│ │ Documentation            │
│ │ Type  README             │
│ │ Quality A 92 / 100       │
│ │ Status Generated         │
│ │ Created Nov 19, 2:34 PM  │
│ │                          │
│ │ Timestamps               │
│ │ Added Nov 19, 2:30 PM    │
│ │ Modified Nov 19, 2:33 PM │
│ └──────────────────────────┘
│           ↑
│      60vh height
│    100% width
└────────────────────────────┘
```

---

## Next Steps

1. ✅ Design approved
2. ⏳ Implement Phase 1 (core functionality)
3. ⏳ Write tests
4. ⏳ Accessibility review
5. ⏳ User testing
6. ⏳ Phase 2 planning (configurability)

---

**References**:
- Focus trap pattern: `client/src/hooks/useFocusTrap.js`
- Example modal: `client/src/components/AppearanceModal.jsx`
- Menu location: `client/src/components/Sidebar/FileActions.jsx`
- File card: `client/src/components/Sidebar/FileItem.jsx`
