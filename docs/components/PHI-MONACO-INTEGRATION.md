# PHI Monaco Editor Integration

**Status:** ✅ Implemented (v3.5.6)
**Components:** `PHIEditorEnhancer.jsx`, `PHIEditorEnhancer.css`
**Integration Points:** `CodePanel.jsx`, `LazyMonacoEditor.jsx`, `App.jsx`, `PHIWarningBanner.jsx`

## Overview

Embeds PHI detection and sanitization directly into Monaco editor with inline decorations, gutter markers, hover tooltips, and a review panel. **Key improvement: enables direct code editing while PHI is highlighted**, rather than forcing users through a review modal that only shows instructions.

## Problem with Previous Modal-Only Approach

- Shows PHI occurrences with context
- Provides suggestions and instructions
- **Doesn't allow direct code editing** - users must use accept/skip buttons
- Users can't freely navigate and edit the code
- Requires completing review before seeing changes
- Separate UI interrupts coding workflow

## Monaco Integration Benefits

- **Direct code editing** - users can edit anywhere in the editor while PHI is highlighted
- Visual indicators (underlines, gutter icons) show what needs attention
- Quick actions available but not required - users can manually edit
- Review and sanitize simultaneously, not sequentially
- Stay in the editor - no context switching
- Better for users who want to navigate through code and make changes on their own terms

---

## Architecture

### Component Structure

```
CodePanel.jsx (modified)
├─ LazyMonacoEditor.jsx (modified)
│  └─ Monaco Editor instance
│
└─ PHIEditorEnhancer.jsx (NEW)
   ├─ Uses Monaco decorations API
   ├─ Manages PHI markers and highlights
   ├─ Registers hover provider
   ├─ Registers code action provider
   └─ Renders PHI Review Panel
```

### PHIEditorEnhancer Component

**Location:** `client/src/components/PHIEditorEnhancer.jsx`

**Props:**
```javascript
{
  editorInstance: React.RefObject,           // Monaco editor instance
  monacoInstance: Object,                    // Monaco global object
  phiDetection: Object,                      // PHI detection result
  code: string,                              // Current code
  onCodeChange: Function,                    // Update code after sanitization
  onPhiResolved: Function,                   // Called when all PHI handled
  effectiveTheme: 'light'|'dark'             // For styling
}
```

**Responsibilities:**
1. Extract PHI items from detection data
2. Apply decorations (underlines) and markers
3. Register hover tooltips
4. Register code action providers (quick fixes)
5. Render bottom review panel
6. Handle user actions (accept/skip/apply)

---

## Monaco API Usage

### 1. Decorations for PHI Highlighting

```javascript
const decorations = phiItems.map(item => ({
  range: new monaco.Range(
    item.lineNumber,
    item.columnStart,
    item.lineNumber,
    item.columnEnd
  ),
  options: {
    className: getDecorationClass(item.confidence),
    hoverMessage: { value: `**${item.type}**: ${item.message}` },
    glyphMarginClassName: 'phi-gutter-icon',
    minimap: {
      color: getMinimapColor(item.confidence),
      position: monaco.editor.MinimapPosition.Inline
    }
  }
}));

editorInstance.deltaDecorations([], decorations);
```

**CSS Classes:**
- `.phi-high-severity` - Red wavy underline (high confidence)
- `.phi-medium-severity` - Amber wavy underline (medium)
- `.phi-low-severity` - Yellow wavy underline (low)
- `.phi-accepted` - Green strikethrough (after replacement)
- `.phi-skipped` - Gray dotted (user chose to skip)
- `.phi-gutter-icon` - Warning triangle in gutter margin
- `.phi-gutter-icon-current` - Highlighted current item (pulsing)

### 2. Markers for Problem Panel

```javascript
const markers = phiItems.map(item => ({
  severity: monaco.MarkerSeverity.Warning,
  message: `${item.type}: ${item.message}`,
  startLineNumber: item.lineNumber,
  startColumn: item.columnStart,
  endLineNumber: item.lineNumber,
  endColumn: item.columnEnd,
  source: 'PHI Detector'
}));

monaco.editor.setModelMarkers(
  editorInstance.getModel(),
  'phi-detector',
  markers
);
```

### 3. Hover Provider

```javascript
monaco.languages.registerHoverProvider('*', {
  provideHover: (model, position) => {
    const phiItem = findPHIAtPosition(position);
    if (!phiItem) return null;

    return {
      range: new monaco.Range(...),
      contents: [
        { value: `**⚠️ ${phiItem.type}**` },
        { value: phiItem.message },
        { value: `Suggested: \`${phiItem.suggestedReplacement}\`` },
        { value: '_Click lightbulb for quick actions_' }
      ]
    };
  }
});
```

### 4. Code Actions (Quick Fixes)

```javascript
monaco.languages.registerCodeActionProvider('*', {
  provideCodeActions: (model, range, context) => {
    const phiItem = findPHIAtPosition(range.getStartPosition());
    if (!phiItem) return { actions: [], dispose: () => {} };

    return {
      actions: [
        {
          title: `✓ Replace with "${phiItem.suggestedReplacement}"`,
          kind: 'quickfix',
          edit: { /* Monaco edit object */ },
          isPreferred: true
        },
        {
          title: '⊘ Skip this occurrence',
          kind: 'quickfix',
          command: { id: 'phi.skip', arguments: [phiItem.id] }
        }
      ],
      dispose: () => {}
    };
  }
});
```

---

## User Workflows

### Initial Load

1. User pastes code → PHI detection runs (debounced 1 sec)
2. PHI detected → Editor shows decorations + gutter markers
3. PHI panel opens at bottom (auto-expanded)
4. First PHI item highlighted in panel
5. User sees warning in banner (unchanged)
6. **User can now edit code directly** - they're not blocked or forced into a modal

### Workflow 1: Direct Manual Editing (Primary)

1. User sees PHI highlighted in editor (underlined)
2. User navigates to highlighted area
3. User edits code directly in Monaco editor (delete, replace, modify)
4. Decorations disappear when PHI removed
5. Panel updates to reflect changes
6. No modal interruption, no forced workflow

### Workflow 2: Quick Actions (Optional Convenience)

1. User hovers over PHI → Tooltip shows type and suggestion
2. User clicks lightbulb (or `Ctrl+.`) → Quick action menu appears
3. User selects action:
   - **Replace** → Immediately applies suggested replacement in editor
   - **Skip** → Marks as reviewed, decoration remains (user decides to keep it)
4. Panel updates to show ✓ (replaced) or ⊘ (skipped)
5. Progress indicator updates

### Workflow 3: Panel-Driven (Systematic Review)

1. User clicks item in panel → Jumps to that line
2. User manually edits OR uses quick actions
3. Clicks "Next" or navigates to next item
4. Reviews all items systematically
5. "Back to First" button allows re-review

### Completion

**Automatic (Preferred):**
- User edits code manually, removing/replacing PHI
- Decorations disappear as PHI is removed
- When all PHI removed → Banner automatically updates to "ready to generate"
- Panel shows all items resolved

**Manual Confirmation:**
- User clicks "Apply All Changes" in panel
- Accepted replacements are applied to code
- `onPhiResolved` callback fires
- Banner updates to "ready to generate"

---

## PHI Review Panel Design

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Monaco Editor                                                │
│ (with PHI highlighted and gutter markers)                    │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Protected Health Information Detected (5 items)          │
│                                                              │
│ [Progress Bar: ████████░░░░░░░░░░░░░] 40%                  │
│ ✓ 2 Accepted  ⊘ 0 Skipped  ⋯ 3 Pending                     │
│                                                              │
│ ┌─────┬──────────────────────────┬──────────┬─────────────┐ │
│ │ ✓/⊘ │ Type & Location          │ Found    │ Action      │ │
│ ├─────┼──────────────────────────┼──────────┼─────────────┤ │
│ │ ✓   │ Email (Line 3)           │ john@…   │ Accepted    │ │
│ │ •   │ SSN (Line 5)             │ 123-45-… │ [✓] [⊘]    │ │
│ │ •   │ Phone (Line 8)           │ 555-…    │ [✓] [⊘]    │ │
│ └─────┴──────────────────────────┴──────────┴─────────────┘ │
│                                                              │
│ Progress: 2/5 Reviewed  [Back to First] [Apply All (2)]    │
└─────────────────────────────────────────────────────────────┘
```

### Features

- **Collapsible panel** (default: expanded when PHI detected)
- **Click row** to jump to PHI location in editor
- **Inline action buttons** for each item (Accept/Skip)
- **"Back to First"** button appears after reviewing last item
- **Progress indicator** shows reviewed vs total
- **"Apply All Changes"** button applies accepted replacements

---

## Integration Points

### 1. LazyMonacoEditor.jsx

**Changes:**
- Added `onMount` prop to expose editor instance
- Added `handleEditorDidMount` callback
- Enabled `glyphMargin: true` option

```javascript
export function LazyMonacoEditor({
  height, language, value, onChange, options, theme,
  onMount  // NEW
}) {
  const handleEditorDidMount = (editor, monaco) => {
    if (onMount) onMount(editor, monaco);
  };

  return (
    <Editor
      // ... other props
      onMount={handleEditorDidMount}
      options={{
        ...options,
        glyphMargin: true,  // Enable gutter icons
      }}
    />
  );
}
```

### 2. CodePanel.jsx

**Changes:**
- Added `editorRef` and `monacoRef` state
- Added `handleEditorMount` callback
- Added `phiDetection` and `onPhiResolved` props
- Conditionally render `PHIEditorEnhancer` when PHI detected

```javascript
export function CodePanel({
  // ... existing props
  phiDetection = null,        // NEW
  onPhiResolved = null        // NEW
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }, []);

  return (
    <div>
      {/* Monaco Editor */}
      <LazyMonacoEditor onMount={handleEditorMount} {...props} />

      {/* PHI Editor Enhancer - Bottom Panel */}
      {phiDetection?.containsPHI && editorRef.current && monacoRef.current && (
        <LazyPHIEditorEnhancer
          editorInstance={editorRef.current}
          monacoInstance={monacoRef.current}
          phiDetection={phiDetection}
          code={code}
          onCodeChange={onChange}
          onPhiResolved={onPhiResolved}
          effectiveTheme={effectiveTheme}
        />
      )}
    </div>
  );
}
```

### 3. App.jsx

**Changes:**
- Added `handlePhiResolved` callback
- Pass `phiDetection` and `onPhiResolved` to all `CodePanel` instances

```javascript
const handlePhiResolved = useCallback(() => {
  setPhiConfirmed(true);
  setShowPhiWarning(false);
}, []);

// In render:
<CodePanel
  // ... existing props
  phiDetection={phiDetection}
  onPhiResolved={handlePhiResolved}
/>
```

### 4. PHIWarningBanner.jsx

**Changes:**
- Added hint about Monaco editor integration

```javascript
<p className="text-xs mt-1.5 opacity-75">
  💡 Detected PHI is highlighted in the editor with wavy underlines.
  Click the lightbulb (Ctrl+.) for quick actions, or use the review panel below.
</p>
```

---

## Styling (PHIEditorEnhancer.css)

### Decoration Classes

```css
.phi-high-severity {
  background: rgba(239, 68, 68, 0.15);
  border-bottom: 2px wavy #ef4444;
}

.phi-medium-severity {
  background: rgba(245, 158, 11, 0.15);
  border-bottom: 2px wavy #f59e0b;
}

.phi-low-severity {
  background: rgba(234, 179, 8, 0.15);
  border-bottom: 2px wavy #eab308;
}

.phi-accepted {
  background: rgba(34, 197, 94, 0.15);
  border-bottom: 2px solid #22c55e;
  text-decoration: line-through;
  opacity: 0.7;
}

.phi-skipped {
  background: rgba(148, 163, 184, 0.1);
  border-bottom: 2px dotted #94a3b8;
  opacity: 0.5;
}
```

### Gutter Icons

```css
.phi-gutter-icon {
  background-image: url('data:image/svg+xml;utf8,...');  /* Warning triangle */
  background-repeat: no-repeat;
  background-position: center;
  background-size: 16px 16px;
  width: 16px;
}

.phi-gutter-icon-current {
  /* Same as above, but filled icon + pulse animation */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Panel Styling

- **Light theme:** `bg-slate-50`, `border-slate-200`
- **Dark theme:** `bg-slate-800`, `border-slate-600`
- **Progress bar:** Amber gradient
- **Table:** Sticky header, hover states, current row highlighting
- **Buttons:** Green accept, slate skip, amber apply

---

## Accessibility

### Keyboard Navigation

- **Tab** - Navigate through panel items
- **Enter** - Apply action (accept/skip)
- **Arrow keys** - Navigate table rows (future enhancement)
- **Ctrl+.** - Open quick actions menu (Monaco built-in)

### Screen Reader Support

- Panel announces "Protected Health Information Detected" on render
- Progress updates announced as items are reviewed
- Action buttons have clear aria-labels
- Table has proper header associations

### Visual Indicators

- **High contrast underlines** (WCAG AA compliant)
- **Gutter icons** for non-color users
- **Clear focus indicators** on all interactive elements
- **Panel row highlighting** for current item

---

## Testing

### Unit Tests (`PHIEditorEnhancer.test.jsx`)

- ✅ Renders panel when PHI detected
- ✅ Displays PHI items in table
- ✅ Applies decorations to editor
- ✅ Shows progress stats
- ✅ Collapses and expands panel
- ✅ Calls onPhiResolved when Apply All Changes clicked
- ✅ Does not render when no PHI detected
- ✅ Registers hover and code action providers

### Integration Tests (Future)

- Full workflow: paste code → review PHI → sanitize → generate
- Keyboard navigation (F8, Shift+F8, Ctrl+.)
- Click-to-jump functionality
- "Back to First" button behavior

### Manual Testing Checklist

- [ ] Paste code with 10+ PHI items
- [ ] Verify decorations appear (underlines, gutter icons)
- [ ] Hover over PHI → Tooltip shows
- [ ] Click lightbulb → Quick actions menu appears
- [ ] Accept 5 items → Panel shows ✓ marks
- [ ] Skip 3 items → Panel shows ⊘ marks
- [ ] Reach last item → "Back to First" button appears
- [ ] Click "Back to First" → Jumps to item #1
- [ ] Click "Apply All Changes" → Code updated, panel updates
- [ ] Generate documentation → Works without PHI warning

---

## Performance Considerations

### Decoration Limits

- **Current:** No limit - all PHI items get decorations
- **Future:** If 100+ items, virtualize panel list and limit decorations to viewport

### Debouncing

- PHI detection already debounced (1 sec) in App.jsx
- Decoration updates happen on every `phiItems` change (acceptable for <100 items)

### Memory Cleanup

- Decorations cleaned up on unmount
- Hover/code action providers disposed on unmount
- No memory leaks detected in testing

---

## Future Enhancements

### Keyboard Shortcuts (Optional)

- `F8` - Next PHI item
- `Shift+F8` - Previous PHI item
- `Ctrl+Shift+.` - Custom replacement prompt

### Mobile Support

- Fallback to modal on mobile devices
- Touch-friendly panel UI
- Simplified actions for small screens

### Batch Actions

- "Accept All" button (with confirmation)
- "Skip All" button
- Undo/redo support

### Custom Replacements

- Inline edit mode in panel
- Template-based replacements (e.g., "User {N}")
- Save custom replacement patterns

---

## Migration from Modal-Only Approach

### Rollout Strategy

1. **Phase 1:** Deploy with feature flag (default: off)
2. **Phase 2:** Enable for 10% of users
3. **Phase 3:** Monitor feedback, fix bugs
4. **Phase 4:** Enable for 100% of users
5. **Phase 5:** Keep modal as fallback for edge cases

### Fallback Conditions

Use modal instead of Monaco integration when:
- Browser doesn't support Monaco (unlikely)
- Mobile device (optional - Monaco works but may prefer modal)
- Accessibility mode (for users who prefer dialogs)

---

## Documentation References

- **Architecture:** `ARCHITECTURE-OVERVIEW.md` (visual), `ARCHITECTURE.md` (technical)
- **Component Patterns:** `BANNER-PATTERNS.md`, `ERROR-HANDLING-UX.md`
- **Testing:** `TEST-PATTERNS-GUIDE.md`, `COMPONENT-TEST-COVERAGE.md`
- **UI Standards:** `UI-STANDARDS.md` (button labels, text conventions)
- **Design:** `brand-palette-unified.html` (colors)

---

## Changelog

**v3.5.6** (January 30, 2026)
- ✅ Initial implementation of PHI Monaco integration
- ✅ Created `PHIEditorEnhancer.jsx` component
- ✅ Added decoration and marker support
- ✅ Implemented hover tooltips and code actions
- ✅ Built bottom review panel UI
- ✅ Integrated with `CodePanel.jsx` and `App.jsx`
- ✅ Added unit tests
- ✅ Updated `PHIWarningBanner.jsx` with editor hint

---

**Last Updated:** January 30, 2026
**Maintainer:** CodeScribe AI Team
