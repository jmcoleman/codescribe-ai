# PHI Inline Editing - User Guide

**Status:** ✅ Implemented (v3.5.6)
**Component:** `PHIEditorEnhancer.jsx`
**Purpose:** Edit replacement values directly in the PHI review table

---

## How It Works

### Two Columns

| Column | Purpose | Editable? |
|--------|---------|-----------|
| **Found** | Original detected PHI (audit record) | ❌ Immutable |
| **Replacement** | Sanitized value to use | ✅ Click to edit |

### Workflow

**Primary: Table → Monaco** ✅ WORKING

1. PHI is detected and highlighted in Monaco editor
2. Review table shows all detections
3. Click on a **Replacement** value to edit it
4. Type your custom replacement
5. Press **Enter** to save (or **Escape** to cancel)
6. Click **Accept (✓)** button
7. Monaco editor updates with your custom replacement

**Example:**
```
Found: john.doe@hospital.com (immutable audit record)
Replacement: user@example.com (suggested) → Click → Edit to: test@example.com → Accept
Result: Monaco code updates to "test@example.com"
```

---

## Current Behavior (v3.5.6)

### ✅ What Works

**Table → Monaco Sync**
- Edit replacement values directly in table
- Press Enter to save, Escape to cancel
- Click Accept to apply to Monaco editor
- Custom replacements persist even if PHI positions shift
- Audit trail maintained (Found column never changes)

**Stable IDs**
- PHI items have content-based IDs (hash of type + value)
- IDs persist when code positions shift (line/column changes)
- Custom replacements preserved across PHI re-detection
- Review state maintained even after code edits

**Visual Feedback**
- Hover: Light background on replacement cells
- Focus: Purple outline when editing
- Editable indicator: Cursor changes to pointer on hover

### ❌ Known Limitation

**Monaco → Table Sync (Not Implemented)**

When you edit PHI directly in Monaco editor:
- The PHI value changes
- This triggers a fresh PHI detection scan (after 1 second)
- New scan creates new PHI items
- Previous review state is lost for that item

**Why not implemented:**
1. When PHI value changes, the content-based ID changes too
2. Can't reliably track "which PHI was edited"
3. Fresh detection is actually better for compliance
   (re-review after manual code changes)

**Recommended approach:**
- Use the table for systematic PHI sanitization
- Use Monaco for general code editing
- If you edit PHI in Monaco, it will trigger re-detection

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Click** | Start editing replacement value |
| **Enter** | Save edited value |
| **Escape** | Cancel and revert to original |
| **Tab** | Move to next cell (not implemented yet) |

---

## Technical Implementation

### Stable ID Generation

```javascript
function createPHIItemId(value, type) {
  // Content-based hash: same PHI → same ID
  const str = `${type}:${value}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `phi-${Math.abs(hash)}`;
}
```

**Benefits:**
- Same PHI always gets same ID (e.g., email always = `phi-12345`)
- ID persists even when line numbers shift
- Custom replacements stay linked to correct PHI
- Enables state preservation across re-detection

### State Preservation

When PHI re-detection runs (after code changes):

```javascript
// Old approach (position-based ID):
id: `${lineNumber}-${columnStart}`
// ❌ Changes when positions shift

// New approach (content-based ID):
id: createPHIItemId(value, type)
// ✅ Stable across position changes

// Preserved across re-detection:
customReplacements[phi-12345] = "custom@email.com"
reviewState[phi-12345] = "accepted"
originalValues[phi-12345] = "john.doe@hospital.com"
```

---

## User Scenarios

### Scenario 1: Systematic Sanitization (Recommended)

1. PHI detected → Table shows all items
2. Review each item in table:
   - Click replacement → Edit if needed → Enter
   - Click Accept (✓)
3. Monaco updates automatically
4. Move to next item
5. All PHI sanitized with clear audit trail

### Scenario 2: Custom Replacements

1. PHI detected with suggested replacement "user@example.com"
2. Click on replacement cell
3. Edit to something specific: "engineering@example.com"
4. Press Enter
5. Click Accept
6. Monaco updates with custom value
7. Audit trail: Found = original, Replacement = custom

### Scenario 3: Mixed Workflow

1. Sanitize most PHI via table
2. Edit code directly in Monaco for other changes
3. If Monaco edit touches PHI area:
   - Fresh detection runs after 1 second
   - Table refreshes with new scan
   - Previous custom replacements preserved (by ID)
4. Continue reviewing in table

---

## Audit Trail

Every PHI action is tracked:

```
Found Column (Immutable):
- Original detected PHI value
- Never changes
- Permanent audit record

Replacement Column (Editable):
- Initially: Auto-suggested value
- User can: Click to edit
- Finally: Accepted custom or suggested value

Audit Record:
john.doe@hospital.com → user@example.com (accepted, suggested)
john.doe@hospital.com → engineering@example.com (accepted, custom)
jane.smith@hospital.com → [skipped - user confirmed not PHI]
```

---

## Compliance Notes

**HIPAA-Compliant Approach:**
1. All original PHI preserved in "Found" column (immutable)
2. All replacements tracked (suggested vs custom)
3. All actions logged (accept, skip, custom)
4. Clear before/after audit trail
5. No actual PHI stored in database (see PHI-AUDIT-TRACKING-PLAN.md)

**Data Flow:**
```
Detection → Review → Sanitize → Generate
    ↓         ↓          ↓          ↓
  Found    Actions   Replaced   Audit Log
(original) (table)  (Monaco)  (hashed metadata)
```

---

## Future Enhancements

### Planned (Not Yet Implemented)

1. **Tab Navigation**
   - Tab to next replacement cell
   - Shift+Tab to previous
   - Streamlined keyboard workflow

2. **Batch Edit**
   - Edit multiple replacements of same type at once
   - E.g., "Replace all emails with: [PLACEHOLDER]"

3. **Replacement Templates**
   - User-defined replacement patterns
   - E.g., "Always use [REDACTED] for SSNs"
   - Saved preferences per user

4. **Undo/Redo**
   - Ctrl+Z to undo replacement edit
   - Ctrl+Y to redo
   - Stack of edit history

5. **Copy From Found**
   - Button to copy original value into replacement
   - Useful if suggested replacement is wrong
   - One-click revert before accepting

---

## Troubleshooting

### "My custom replacement disappeared"

**Cause:** You edited the PHI directly in Monaco, changing its value
**Fix:** Use the table for replacements, Monaco for general code edits

### "Replacement cell won't edit"

**Check:**
- Click directly on the code text, not the cell background
- Ensure PHI item is in "pending" state (not already accepted)
- If accepted, click Revert first, then edit

### "Accept button doesn't apply my custom value"

**Cause:** Custom replacement not saved (didn't press Enter)
**Fix:** Click replacement → Edit → Press Enter → Then Accept

---

## Summary

**✅ Use table for PHI sanitization:**
- Edit replacements inline
- Click Accept to apply
- Clear audit trail maintained

**ℹ️ Monaco edits trigger fresh detection:**
- Not a bug, intended behavior
- Re-scan ensures nothing missed
- Previous custom replacements preserved by ID

**📊 Best practice:**
- Systematic table review for PHI
- Monaco editing for code changes
- Combine both as needed
