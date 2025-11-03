# UI Organization Patterns

**Version:** 1.0
**Last Updated:** November 2, 2025
**Status:** Active Design Pattern

---

## Overview

This document defines the information architecture patterns used to organize UI controls across the CodeScribe AI application. These patterns help maintain consistency and intuitive user experience as new features are added.

---

## Core Pattern: Functional Grouping by Workflow Stage

UI controls are organized based on **where they fit in the user's workflow** and **the weight of the operation** they perform.

---

## Control Bar (Top of Main View)

**Purpose:** Primary workflow controls - "What am I generating?"

**Mental Model:** The "input pipeline" - how code enters the system and what you want to do with it.

### Controls

1. **Doc Type Dropdown** - What kind of documentation to create
   - Location: Far left (first decision point)
   - Type: Configuration
   - Weight: N/A (required selection)

2. **Upload Button** - Bring in code from files
   - Type: Heavy input operation
   - Characteristics: File system access, parsing, validation
   - Source: External (user's local files)

3. **GitHub Import Button** - Bring in code from repositories
   - Type: Heavy input operation
   - Characteristics: Network request, URL parsing, potential authentication
   - Source: External (remote repositories)
   - Status: Feature-flagged (currently disabled)

4. **Generate Button** - Execute the generation
   - Location: Far right (final action)
   - Type: Primary action
   - Weight: Heavy operation (API call, streaming response)

### Key Characteristics

- **External sources:** Upload and GitHub Import both fetch code from outside the application
- **Heavy operations:** File parsing, network requests, validation
- **Sequential workflow:** Type selection → Code input → Generation

---

## CodePanel Header

**Purpose:** Editor helpers - "Quick actions on the code I'm working with"

**Mental Model:** Editor utilities - quick actions you take while actively working with code.

### Layout Pattern

```
[Filename] [Language Badge]  |  [Examples] [Clear] [Copy]
     ← Context (Left)              Actions (Right) →
```

### Left Side: Context/Information

1. **Filename Display**
   - Shows current file name or "code.js" default
   - Read-only information
   - Helps user understand "what am I looking at?"

2. **Language Badge**
   - Display-only (not a configuration control)
   - Auto-detected from file upload or example selection
   - Visual: Cyan badge (`text-cyan-800 bg-cyan-50`)

### Right Side: Actions

1. **Examples Button**
   - Type: Lightweight input operation
   - Characteristics: Instant template swap, pre-loaded content
   - Source: Internal (application templates)
   - Why here: Feels like an "editor helper" rather than "external input"

2. **Clear Button**
   - Resets editor to default state
   - Resets filename to "code.js"
   - Resets language to "javascript"

3. **Copy Button**
   - Copies current code to clipboard
   - Shows "Copied" feedback (2-second timeout)
   - Icon switches: Copy → Check → Copy

### Key Characteristics

- **Internal operations:** All actions work with code already in the editor
- **Lightweight operations:** No file system, no network requests
- **Instant feedback:** All actions complete immediately
- **Editor-focused:** User is actively working with the code, not bringing it in

---

## The Key Distinction: Examples vs Upload

Even though both "bring code in," they differ in fundamental ways:

| Aspect | Examples | Upload/GitHub |
|--------|----------|---------------|
| **Source** | Internal templates | External files/repos |
| **Weight** | Lightweight (instant) | Heavy (parsing, validation) |
| **Location** | Already in app memory | Fetched from outside |
| **UI Placement** | CodePanel header | Control Bar |
| **User Intent** | "Try a quick template" | "Work with my actual code" |

**Decision Rule:** Examples feels more like "swapping code in the editor" than "importing from an external source," so it belongs with other editor utilities.

---

## Visual Hierarchy Patterns

### Left-to-Right Reading Flow

1. **Left side = Information** ("What am I looking at?")
   - Filename
   - Language badge
   - Non-interactive context

2. **Right side = Actions** ("What can I do?")
   - Buttons
   - Interactive controls
   - Operations

### Button Consistency Pattern

All CodePanel header action buttons use the same styling:

```jsx
className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
           text-slate-700 bg-white hover:bg-slate-50 border border-slate-200
           hover:border-slate-300 rounded-lg transition-all duration-200
           hover:scale-[1.02] active:scale-[0.98] focus:outline-none
           focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
```

- Icon size: `w-3.5 h-3.5`
- Gap between icon and text: `gap-1.5`
- Padding: `px-2.5 py-1.5`
- Text: `text-xs font-medium`

---

## Design Rationale

### Why Not Put Everything in Control Bar?

**Problem:** Control Bar would become crowded and confusing with too many controls.

**Solution:** Separate concerns by workflow stage:
- **Control Bar** = "Setup and execute" (input sources + generation)
- **CodePanel Header** = "Work with code" (editor utilities)

### Why Not Put Examples in Control Bar with Upload?

**Analysis:**
- Examples could logically go in Control Bar (it does "bring code in")
- But it feels different because it's instant and lightweight
- Upload/GitHub are "serious" operations (files, networks, errors)
- Examples is more casual ("just show me something quickly")

**Decision:** Group by operation weight and user intent, not just function.

---

## Adding New Features: Decision Tree

When adding a new UI control, ask:

### 1. Is this about bringing code IN or working with code already IN the editor?

- **Bringing code IN** → Likely Control Bar
- **Working with existing code** → Likely CodePanel Header

### 2. How heavy is the operation?

- **Heavy** (file system, network, parsing) → Control Bar
- **Lightweight** (instant, in-memory) → Could be CodePanel Header

### 3. What is the source?

- **External** (files, repos, URLs) → Control Bar
- **Internal** (templates, transformations) → Could be CodePanel Header

### 4. What is the user's intent?

- **"I need to work with my actual code"** → Control Bar (Upload/Import)
- **"Let me try something quick"** → CodePanel Header (Examples)
- **"I want to manipulate what I'm seeing"** → CodePanel Header (Clear/Copy)

---

## Examples of Pattern Application

### ✅ Correct Placement

| Feature | Location | Rationale |
|---------|----------|-----------|
| Examples | CodePanel Header | Lightweight, internal, editor-focused |
| Clear | CodePanel Header | Editor utility, instant operation |
| Copy | CodePanel Header | Editor utility, instant operation |
| Upload | Control Bar | Heavy, external, primary input source |
| GitHub Import | Control Bar | Heavy, external, network operation |
| Generate | Control Bar | Primary workflow action |

### ❌ What NOT to Do

- Don't put heavy operations in CodePanel Header (feels janky)
- Don't put editor utilities in Control Bar (clutters main workflow)
- Don't mix operation weights in the same group (confusing)
- Don't break the left (context) / right (actions) pattern

---

## Future Considerations

### Potential New Features

**Multi-file Upload:**
- Location: Control Bar (heavy operation, external source)
- Rationale: Similar weight to single file upload

**Code Formatter Button:**
- Location: CodePanel Header (lightweight transformation)
- Rationale: Working with existing code, instant operation

**AI Code Suggestions:**
- Location: Could be either, depends on implementation:
  - If live/inline → CodePanel Header (editor utility)
  - If modal/heavy → Control Bar (separate workflow)

**Export Documentation:**
- Location: DocPanel header (separate from code input)
- Rationale: Output operation, not input operation

---

## Related Patterns

- [ERROR-HANDLING-UX.md](ERROR-HANDLING-UX.md) - Error display patterns
- [USAGE-PROMPTS.md](USAGE-PROMPTS.md) - Usage warning placement
- [TOAST-SYSTEM.md](TOAST-SYSTEM.md) - Notification patterns

---

## Revision History

- **v1.0** (November 2, 2025) - Initial documentation capturing v2.4.5 UI reorganization patterns
