## 🔧 v1.x POST-PRODUCTION TODO LIST

**Status:** 📋 **PLANNED** (Post-Production Enhancements)
**Timeline:** TBD (after v1.2.0 production deployment)
**Last Updated:** October 21, 2025

---

### 📦 v1.2.1 - Bug Fixes (PRIORITY: P0)

**Estimated Duration:** 0.5 days
**Target Release:** Immediate (hotfix)
**Status:** 📋 **NOT STARTED**

#### Critical UI Fixes

**Bug Fix #1: DocPanel Footer Alignment**
- [ ] **Issue:** DocPanel footer alignment doesn't match CodePanel footer
- [ ] **Analysis:** Compare CodePanel footer structure (lines 88-96) vs DocPanel footer (lines 239-344)
  - CodePanel: Simple `flex items-center justify-between px-4 py-2` with `bg-slate-50 border-t border-slate-200`
  - DocPanel: Has nested structure with expandable report, may have alignment inconsistency
- [ ] **Fix:** Ensure DocPanel footer uses same padding, spacing, and alignment as CodePanel
  - Verify `px-4 py-2` padding matches
  - Verify flex alignment (`items-center justify-between`)
  - Verify vertical centering of all footer elements
  - Test with and without quality score
  - Test with expandable section collapsed and expanded
- [ ] **Files to modify:**
  - `client/src/components/DocPanel.jsx` (lines 237-345)
- [ ] **Testing:**
  - [ ] Visual comparison: CodePanel footer vs DocPanel footer side-by-side
  - [ ] Test with quality score present
  - [ ] Test with quality score absent
  - [ ] Test expandable section transitions
  - [ ] Cross-browser testing (Chrome, Firefox, Safari)
  - [ ] Responsive testing (mobile, tablet, desktop)

**Bug Fix #2: Download Button Checkmark Issue**
- [ ] **Issue:** Download button shows checkmark after clicking (copied from CopyButton pattern)
- [ ] **Analysis:** Determine if download button exists or is planned
  - Search codebase for DownloadButton component
  - Review roadmap for download button feature (Phase 2: UX Improvements)
- [ ] **Decision:**
  - If button exists: Remove checkmark state transition (downloads don't need success confirmation like copy does)
  - If planned: Note for Phase 2 implementation (don't use CopyButton checkmark pattern)
- [ ] **Fix (if button exists):**
  - Create `DownloadButton.jsx` component without checkmark state
  - Use Download icon only (no Check icon swap)
  - Maintain hover/active states but remove success animation
  - Keep toast notification for download completion (if applicable)
- [ ] **Files to check/modify:**
  - `client/src/components/DownloadButton.jsx` (if exists)
  - `client/src/components/DocPanel.jsx` (if download button is inline)
  - Search for download-related code
- [ ] **Testing:**
  - [ ] Verify download triggers correctly
  - [ ] Verify no checkmark appears after download
  - [ ] Verify button returns to normal state immediately
  - [ ] Test download functionality (file saves correctly)
  - [ ] Cross-browser testing
  - [ ] Mobile testing (download behavior varies by device)

#### Success Criteria (v1.2.1)
- [ ] DocPanel footer perfectly aligned with CodePanel footer (pixel-perfect)
- [ ] Download button (if exists) has correct visual behavior without checkmark
- [ ] No regressions in existing UI
- [ ] All tests passing
- [ ] Deployed to production

---

### 🎨 v1.3.0 - Phase 2: UX Improvements (PRIORITY: P1)

**Estimated Duration:** 2-3 days
**Target Release:** TBD (after v1.2.1)
**Status:** 📋 **NOT STARTED**
**Goal:** Enhance user experience with mobile fixes, GitHub integration, and download capabilities

#### Feature 1: Mobile Issues Fix
- [ ] **Discovery:** Identify mobile-specific issues (user feedback TBD)
- [ ] **Analysis:** Test current mobile experience
  - [ ] Test on iOS Safari (iPhone 12, 13, 14)
  - [ ] Test on Android Chrome (Pixel, Samsung)
  - [ ] Test tablet experience (iPad, Android tablet)
  - [ ] Document all issues found
- [ ] **Common mobile issues to check:**
  - [ ] Monaco Editor touch interactions
  - [ ] Keyboard interactions on mobile
  - [ ] File upload on mobile browsers
  - [ ] Modal behavior on small screens
  - [ ] Sticky header behavior
  - [ ] Safe area insets (iPhone notch)
  - [ ] Landscape vs portrait layout
- [ ] **Fix:** Address all identified issues
- [ ] **Testing:** Real device testing (not just browser DevTools)

#### Feature 2: Filename Display
- [ ] **Design:** Header bar above Monaco Editor
  - [ ] Mockup header with filename, icon, breadcrumb
  - [ ] Choose file type icon library (lucide-react has file icons)
  - [ ] Determine placement (above editor or integrated into CodePanel header?)
- [ ] **Implementation:**
  - [ ] Add filename state to App.jsx
  - [ ] Update CodePanel to display filename prominently
  - [ ] Add file type detection from extension
  - [ ] Add file type icon (e.g., JS icon, Python icon)
  - [ ] Consider breadcrumb if multiple files (future-proofing)
- [ ] **Files to modify:**
  - `client/src/App.jsx` - filename state management
  - `client/src/components/CodePanel.jsx` - filename display UI
  - `client/src/utils/fileHelpers.js` - file type detection (create if needed)
- [ ] **Edge cases:**
  - [ ] Pasted code (no filename) - show "Untitled" or "code.js"
  - [ ] Uploaded file - show actual filename
  - [ ] Example loaded - show example name
  - [ ] Long filenames - truncate with ellipsis
- [ ] **Testing:**
  - [ ] Upload file - verify filename displays
  - [ ] Paste code - verify default name
  - [ ] Load example - verify example name
  - [ ] Long filename - verify truncation
  - [ ] Responsive behavior (mobile)

#### Feature 3: GitHub Single-File Import
- [ ] **Planning:**
  - [ ] Define supported GitHub URL formats:
    - `https://github.com/user/repo/blob/main/file.js`
    - `https://raw.githubusercontent.com/user/repo/main/file.js`
    - `https://gist.github.com/user/gist-id`
  - [ ] Design "Load from GitHub" button placement (ControlBar)
  - [ ] Design URL input modal/prompt
- [ ] **Implementation:**
  - [ ] Create GitHub URL parser utility
    - [ ] Detect GitHub URLs
    - [ ] Convert blob URLs to raw URLs
    - [ ] Extract filename from URL
    - [ ] Extract language from file extension
  - [ ] Add "Load from GitHub" button to ControlBar
  - [ ] Create URL input modal (HeadlessUI Dialog)
  - [ ] Implement client-side fetch (no backend needed)
  - [ ] Handle CORS (raw.githubusercontent.com supports CORS)
  - [ ] Show loading state during fetch
  - [ ] Handle errors (404, network errors, rate limits)
- [ ] **Files to create/modify:**
  - `client/src/utils/githubImporter.js` (new utility)
  - `client/src/components/ControlBar.jsx` (add button)
  - `client/src/components/GitHubImportModal.jsx` (new modal)
  - `client/src/App.jsx` (integrate import functionality)
- [ ] **Error handling:**
  - [ ] Invalid URL format
  - [ ] File not found (404)
  - [ ] Network errors
  - [ ] GitHub API rate limits
  - [ ] Private repository (not accessible)
  - [ ] File too large
- [ ] **Testing:**
  - [ ] Test with public GitHub file
  - [ ] Test with invalid URL
  - [ ] Test with 404
  - [ ] Test with various file types (.js, .py, .java, .ts, .jsx)
  - [ ] Test with gist URLs
  - [ ] Test error states
  - [ ] Test loading states
  - [ ] Accessibility testing (modal, keyboard nav)

#### Feature 4: Download Button
- [ ] **Design:**
  - [ ] Button placement: DocPanel header (next to Copy button)
  - [ ] Icon: Download icon from lucide-react
  - [ ] Supported formats:
    - Markdown (.md) - default
    - Plain text (.txt)
    - HTML (rendered version) - future consideration
  - [ ] Filename logic: Use current filename or fallback
    - Example: `authentication-service-README.md`
    - Example: `code-README.md` (if no filename)
- [ ] **Implementation:**
  - [ ] Create DownloadButton component (similar to CopyButton but NO checkmark)
  - [ ] Implement browser download API (blob + URL.createObjectURL)
  - [ ] Add format selector (dropdown or separate buttons)
  - [ ] Generate appropriate filename based on:
    - Current code filename
    - Selected doc type
    - Fallback to generic name
  - [ ] Show toast on successful download (not checkmark animation)
- [ ] **Files to create/modify:**
  - `client/src/components/DownloadButton.jsx` (new component - **NO CHECKMARK PATTERN**)
  - `client/src/components/DocPanel.jsx` (add download button to header)
  - `client/src/utils/downloadHelpers.js` (download logic)
- [ ] **Implementation notes:**
  - [ ] **IMPORTANT:** Do NOT copy CopyButton checkmark pattern
  - [ ] Use static Download icon only (no icon swap)
  - [ ] Toast notification for success, not visual button state change
  - [ ] Keep hover/active states for button feedback
- [ ] **Edge cases:**
  - [ ] No documentation generated yet - button disabled
  - [ ] Long filename - sanitize for filesystem
  - [ ] Special characters in filename - sanitize
  - [ ] Mobile download behavior (varies by browser)
  - [ ] Safari download restrictions
- [ ] **Testing:**
  - [ ] Download .md file - verify format
  - [ ] Download .txt file - verify format
  - [ ] Verify filename is correct
  - [ ] Verify content is complete
  - [ ] Test on Chrome, Firefox, Safari
  - [ ] Test on mobile (iOS, Android)
  - [ ] Test disabled state (no docs)
  - [ ] **Verify NO checkmark appears** (critical)
  - [ ] Accessibility testing

#### Success Criteria (v1.3.0)
- [ ] Mobile issues resolved and tested on real devices
- [ ] Filename displays correctly for uploaded files and examples
- [ ] GitHub import works with raw URLs and repository URLs
- [ ] Download button exports docs in .md and .txt formats
- [ ] Download button has correct visual behavior (NO checkmark)
- [ ] No regressions in existing features
- [ ] All tests passing (add tests for new features)
- [ ] Documentation updated (README, ARCHITECTURE, etc.)
- [ ] Deployed to production

---

### 🖥️ v1.4.0 - Phase 3: Layout Enhancements (PRIORITY: P2)

**Estimated Duration:** 3-4 days
**Target Release:** TBD (after v1.3.0)
**Status:** 📋 **NOT STARTED**
**Goal:** Enhanced layout with full-width design and resizable panels

**Note:** Can ship incrementally (full-width first as v1.3.1, then resizable as v1.4.0) or together.

#### Feature 1: Full-Width Layout
- [ ] **Analysis:** Current layout constraints
  - [ ] Identify `max-width` constraints in App.jsx or main container
  - [ ] Document current breakpoints and padding
  - [ ] Test on ultra-wide monitors (2560px, 3440px)
- [ ] **Design:**
  - [ ] Remove max-width from main container (1280px → 100vw)
  - [ ] Keep responsive padding (px-4, px-6, px-8)
  - [ ] Add `max-w-prose` to DocPanel markdown content only (65ch for readability)
  - [ ] Ensure CodePanel and DocPanel scale proportionally
- [ ] **Implementation:**
  - [ ] Remove `max-w-7xl` from main container
  - [ ] Add `max-w-prose` to DocPanel markdown wrapper
  - [ ] Test on multiple monitor sizes
- [ ] **Files to modify:**
  - `client/src/App.jsx` - main container
  - `client/src/components/DocPanel.jsx` - markdown wrapper
- [ ] **Testing:**
  - [ ] Test on 1920px (Full HD)
  - [ ] Test on 2560px (2K)
  - [ ] Test on 3440px (ultra-wide)
  - [ ] Test on laptop (1440px, 1366px)
  - [ ] Verify DocPanel text remains readable
  - [ ] Verify CodePanel uses available space
  - [ ] Mobile/tablet unchanged

#### Feature 2: Resizable Panels
- [ ] **Dependencies:**
  - [ ] Research: `react-resizable-panels` vs alternatives
  - [ ] Install chosen library: `npm install react-resizable-panels`
- [ ] **Design:**
  - [ ] Panel constraints:
    - Minimum: 30% width for each panel
    - Maximum: 70% width for each panel
    - Default: 50/50 split
  - [ ] Divider design:
    - Width: 2px or 8px (draggable area)
    - Color: slate-200, hover: purple-500
    - Cursor: col-resize
  - [ ] "Reset to Default" button placement (toolbar or context menu?)
  - [ ] localStorage key: `codescribe-panel-sizes`
- [ ] **Implementation:**
  - [ ] Add PanelGroup, Panel, PanelResizeHandle from react-resizable-panels
  - [ ] Wrap CodePanel and DocPanel in Panel components
  - [ ] Add draggable handle between panels
  - [ ] Implement panel size constraints (30% min, 70% max)
  - [ ] Save sizes to localStorage on resize
  - [ ] Load sizes from localStorage on mount
  - [ ] Add "Reset to Default" button (50/50)
  - [ ] Implement keyboard resize (arrow keys)
  - [ ] Disable resizing on mobile (stack panels vertically)
- [ ] **Files to modify:**
  - `client/src/App.jsx` - main layout with PanelGroup
  - `client/src/components/ResizablePanels.jsx` - new wrapper component
  - `client/src/utils/panelStorage.js` - localStorage helpers
- [ ] **Implementation example:**
```javascript
// Panel constraints
const PANEL_CONSTRAINTS = {
  code: { min: 30, max: 70, default: 50 },
  doc: { min: 30, max: 70, default: 50 }
};

// Usage with react-resizable-panels
<PanelGroup direction="horizontal" onLayout={saveSizesToLocalStorage}>
  <Panel defaultSize={50} minSize={30} maxSize={70}>
    <CodePanel />
  </Panel>
  <PanelResizeHandle className="w-2 bg-slate-200 hover:bg-purple-500" />
  <Panel defaultSize={50} minSize={30} maxSize={70}>
    <DocPanel />
  </Panel>
</PanelGroup>
```
- [ ] **localStorage best practices:**
  - [ ] Namespace key: `codescribe-panel-sizes`
  - [ ] Validate stored data before using
  - [ ] Handle edge cases (disabled localStorage, corrupt data)
  - [ ] Mobile exception: don't persist, always stack
  - [ ] Version data structure for future migrations
- [ ] **Accessibility:**
  - [ ] ARIA labels for resize handle
  - [ ] Keyboard navigation (arrow keys to resize)
  - [ ] Screen reader announcements for size changes
  - [ ] Focus management during resize
- [ ] **Edge cases:**
  - [ ] localStorage disabled (private browsing)
  - [ ] Corrupt localStorage data
  - [ ] Panel sizes don't sum to 100% (validation)
  - [ ] Mobile/tablet (disable resizing, stack vertically)
  - [ ] Rapid resize (debounce localStorage writes)
- [ ] **Testing:**
  - [ ] Drag divider - verify smooth resize
  - [ ] Verify panel constraints (can't go below 30% or above 70%)
  - [ ] Refresh page - verify sizes persist
  - [ ] Clear localStorage - verify defaults (50/50)
  - [ ] Reset button - verify return to 50/50
  - [ ] Keyboard resize - verify arrow keys work
  - [ ] Mobile - verify panels stack vertically
  - [ ] Tablet - verify resizing works (or stacks if <768px)
  - [ ] Accessibility audit (keyboard, screen reader)

#### Success Criteria (v1.4.0)
- [ ] App uses full browser width on large monitors
- [ ] Doc text remains readable (not too wide) with `max-w-prose`
- [ ] Panels resize smoothly with draggable handle
- [ ] Panel sizes persist across page refreshes
- [ ] Constraints prevent panels from becoming unusable (<30% or >70%)
- [ ] Keyboard users can resize panels with arrow keys
- [ ] Mobile users see stacked panels (no resizing)
- [ ] Reset button works correctly (50/50)
- [ ] Responsive behavior unchanged on mobile/tablet
- [ ] No regressions in existing features
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Deployed to production

---

## 📊 Version Summary

| Version | Focus | Features | Priority | Status |
|---------|-------|----------|----------|--------|
| **v1.2.0** | Production Deployment | Initial production release | P0 | ✅ Complete |
| **v1.2.1** | Bug Fixes | DocPanel footer alignment, Download button checkmark | P0 | 📋 Planned |
| **v1.3.0** | UX Improvements | Mobile fixes, filename display, GitHub import, download button | P1 | 📋 Planned |
| **v1.4.0** | Layout Enhancements | Full-width layout, resizable panels | P2 | 📋 Planned |
| **v2.0.0** | OpenAPI/Swagger (Phase 4) | 5th doc type | P3 | 📋 Future |
| **v2.1.0** | Multi-File Docs (Phase 5) | 6th doc type | P3 | 📋 Future |

---

## 📝 Notes for PM

### v1.2.1 - Immediate Actions
1. **DocPanel footer alignment** - Quick CSS fix, high visibility issue
2. **Download button checkmark** - May not exist yet (check codebase first)
   - If exists: Remove checkmark animation (downloads ≠ copy)
   - If planned: Note for v1.3.0 implementation

### v1.3.0 - UX Polish
- **Mobile fixes** - Requires real device testing (not just DevTools)
- **GitHub import** - Consider rate limits, CORS, error states
- **Download button** - **CRITICAL:** Do NOT use CopyButton checkmark pattern
  - Downloads should use toast notification for success
  - Button should remain static (icon doesn't change)

### v1.4.0 - Advanced Layout
- **Full-width** - Can ship separately as v1.3.1 (low risk)
- **Resizable panels** - Higher complexity, requires library evaluation
- **Consider:** Ship full-width first, get feedback, then add resizing

### Testing Strategy
- **v1.2.1:** Visual regression testing, cross-browser
- **v1.3.0:** Real device testing (iOS, Android), GitHub API testing
- **v1.4.0:** Multi-monitor testing, localStorage testing, accessibility

### Documentation Updates Needed
- [ ] Update ROADMAP.md with v1.2.1 release
- [ ] Update CHANGELOG.md for each release
- [ ] Update ARCHITECTURE.md if significant changes
- [ ] Update README.md with new features
- [ ] Create release notes for GitHub
