# Modal Design Standards

**Last Updated:** 2025-01-14  
**Version:** 1.0

This document defines standardized design patterns, accessibility requirements, and implementation guidelines for all modals in CodeScribe AI.

---

## 📐 Modal Structure

All modals should follow this consistent structure:

```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
  <div
    ref={modalRef}
    className="bg-white rounded-xl shadow-2xl max-w-[size] w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title-id"
  >
    {/* Header */}
    {/* Body */}
  </div>
</div>
```

### Key Classes:
- **Backdrop:** `fixed inset-0 bg-black/50` with fade-in animation
- **Modal Container:** `bg-white rounded-xl shadow-2xl`
- **Max Width:** Varies by modal type (see sizing section)
- **Max Height:** `max-h-[90vh]` to prevent overflow on small screens
- **Animations:** `animate-in fade-in duration-200` (backdrop) + `zoom-in-95 duration-200` (modal)

---

## 🎨 Header Design Standards

### **Required Structure:**

```jsx
<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
  <h2 id="modal-title-id" className="text-lg font-semibold text-slate-900">
    Modal Title
  </h2>
  <button
    ref={closeButtonRef}
    onClick={onClose}
    className="p-2 hover:bg-purple-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    aria-label="Close [modal name] modal"
  >
    <X className="w-5 h-5 text-slate-600 hover:text-purple-600 transition-colors" />
  </button>
</div>
```

### **Typography Standards:**

| Element | Classes | Sizes | Rationale |
|---------|---------|-------|-----------|
| **Title** | `text-lg font-semibold text-slate-900` | 18px, 600 weight | Clear hierarchy, professional |
| **No Icons** | ❌ Avoid decorative icons | N/A | Keep headers clean, title is self-explanatory |

### **Spacing Standards:**

| Element | Horizontal | Vertical | Total Height |
|---------|-----------|----------|--------------|
| **Header Container** | `px-6` (24px) | `py-4` (16px) | ~56px |
| **Border** | N/A | `border-b border-slate-200` | 1px |

### **Close Button Standards:**

| Property | Value | Size | Rationale |
|----------|-------|------|-----------|
| **Padding** | `p-2` | 8px | Creates 36×36px touch target |
| **Icon Size** | `w-5 h-5` | 20px | Balanced with padding |
| **Touch Target** | Total | **36×36px** | Meets WCAG AA (24px min), comfortable for mobile |
| **Hover Background** | `hover:bg-purple-50` | N/A | Brand-consistent purple tint |
| **Icon Hover Color** | `hover:text-purple-600` | N/A | Purple brand color |
| **Default Color** | `text-slate-600` | N/A | Subtle, not distracting |
| **Border Radius** | `rounded-lg` | 8px | Consistent with app design |
| **Focus Ring** | `focus:ring-2 focus:ring-purple-500 focus:ring-offset-2` | 2px ring, 2px offset | Keyboard accessibility |

---

## 🎯 Accessibility Requirements

### **Focus Management:**

```jsx
const modalRef = useRef(null);
const closeButtonRef = useRef(null);

// Auto-focus close button when modal opens
useEffect(() => {
  if (isOpen && closeButtonRef.current) {
    closeButtonRef.current.focus();
  }
}, [isOpen]);
```

### **Focus Trap Implementation:**

```jsx
useEffect(() => {
  if (!isOpen) return;

  const handleKeyDown = (e) => {
    // Close on Escape key
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Focus trap on Tab
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);
```

### **ARIA Attributes (Required):**

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `role` | `"dialog"` | Identifies modal semantics |
| `aria-modal` | `"true"` | Indicates modal behavior |
| `aria-labelledby` | Points to title ID | Associates title with dialog |
| `aria-label` (close btn) | Descriptive text | Screen reader context |

### **Keyboard Interactions:**

- ✅ **Escape** → Close modal
- ✅ **Tab** → Cycle through focusable elements (trapped)
- ✅ **Shift+Tab** → Reverse cycle (trapped)
- ✅ **Enter/Space** → Activate focused button

### **Why Focus Traps + `aria-modal="true"` Are Sufficient:**

**DO NOT apply `inert` or `aria-hidden` to background content.** Here's why:

✅ **Best Practice:** Focus trap + `aria-modal="true"`
- Modern screen readers respect `aria-modal="true"` and treat background as inert
- Focus trap prevents keyboard navigation to background
- Backdrop clicks still work (important UX pattern)
- No browser compatibility issues
- Simpler architecture (modals stay with their parent components)

❌ **Anti-Pattern:** Applying `inert` to background
- Creates timing issues (button that opened modal gets focus, then becomes inert)
- Breaks backdrop click functionality
- Browser support inconsistent (Safari < 15.5 needs polyfill)
- Adds architectural complexity (modals must move outside parent)
- Major sites (GitHub, Stripe, Google) don't use this pattern

**Reference:** WCAG 2.1 AA compliance is achieved through:
1. `aria-modal="true"` (tells assistive tech the dialog is modal)
2. Focus trap (prevents keyboard escape)
3. Proper ARIA labels (`aria-labelledby`, `aria-label`)

---

## 🖱️ Backdrop Click Behavior

### **UX Pattern by Modal Type:**

| Modal Type | Backdrop Click | Confirmation | Rationale |
|------------|---------------|--------------|-----------|
| **Read-only** (Help, Samples, Quality Score) | ✅ Close | None | Low risk, no data loss |
| **Simple forms** (Appearance, theme picker) | ✅ Close | None | Trivial changes, easy to redo |
| **Forms with input** (Login, Signup, Contact) | ⚠️ Conditional | "Discard changes?" if dirty | Prevents accidental data loss |
| **Critical actions** (Delete, Payment) | ❌ No backdrop close | Explicit button only | Too risky for accidents |

### **Implementation Pattern:**

```jsx
// For forms with state
const [isDirty, setIsDirty] = useState(false);

const handleBackdropClick = (e) => {
  // Only close if clicking the backdrop itself, not modal content
  if (e.target === e.currentTarget) {
    if (isDirty) {
      if (window.confirm('Discard unsaved changes?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }
};

// Backdrop with conditional close
<div
  className="fixed inset-0 bg-black/50..."
  onClick={handleBackdropClick}
>
  {/* Modal content */}
</div>
```

### **Critical UX Principle:**

> **Users expect backdrop clicks to close modals.** This is the industry-standard pattern. Breaking this expectation (by making background non-interactive with `inert`) creates frustration and confusion.

**Examples from major products:**
- GitHub: Backdrop click closes PR review modals
- Gmail: Backdrop click closes compose window (with draft save)
- Stripe: Backdrop click closes payment modals (with confirmation)
- Slack: Backdrop click closes channel creation modal

---

## 📏 Modal Sizing Standards

### **Width Options:**

| Modal Type | Max Width | Use Case |
|-----------|-----------|----------|
| **Small** | `max-w-md` (448px) | Simple confirmations, quality scores |
| **Medium** | `max-w-2xl` (672px) | Forms, content with moderate complexity |
| **Large** | `max-w-4xl` (896px) | Split-pane layouts, code examples |
| **Full Width** | `max-w-6xl` (1152px) | Complex interfaces, data tables |

### **Height Constraints:**

- **Always use:** `max-h-[90vh]` for outer container
- **Overflow handling:** Use `overflow-hidden` on container, `overflow-y-auto` on scrollable sections
- **Flexible layouts:** Use `flex flex-col` on container with `flex-1` on scrollable content

---

## 🎨 Color & Brand Standards

### **Modal Colors:**

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Backdrop** | `bg-black/50` | rgba(0,0,0,0.5) | Overlay darkening |
| **Modal Background** | `bg-white` | #ffffff | Clean, neutral |
| **Border** | `border-slate-200` | #e2e8f0 | Subtle separation |
| **Shadow** | `shadow-2xl` | Tailwind preset | Depth and elevation |

### **Text Colors:**

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Title** | `text-slate-900` | #0f172a | Strong, authoritative |
| **Body Text** | `text-slate-600` | #475569 | Readable, neutral |
| **Subtle Text** | `text-slate-500` | #64748b | Secondary information |

### **Interactive States:**

| State | Background | Text/Icon | Focus Ring |
|-------|-----------|-----------|------------|
| **Default** | Transparent | `text-slate-600` | None |
| **Hover** | `bg-purple-50` | `text-purple-600` | None |
| **Focus** | `bg-purple-50` | `text-purple-600` | `ring-purple-500` |

---

## ✨ Animation Standards

### **Entrance Animations:**

```jsx
// Backdrop
className="... animate-in fade-in duration-200"

// Modal Container
className="... animate-in zoom-in-95 duration-200"
```

### **Timing:**
- **Duration:** 200ms (quick but smooth)
- **Easing:** Default ease-out
- **Fade-in:** 0 → 100% opacity
- **Zoom-in:** 95% → 100% scale

### **Exit Behavior:**
- Controlled by conditional rendering: `{isOpen && <Modal />}`
- No exit animation (instant unmount on close)

---

## 🚫 Anti-Patterns (Do NOT Do)

### ❌ **Don't Add Decorative Icons to Titles**
**Bad:**
```jsx
<Code2 className="w-5 h-5 text-purple-600" />
<h2>Modal Title</h2>
```

**Good:**
```jsx
<h2>Modal Title</h2>
```

**Why:** Icons add visual clutter without functional value. The title is self-explanatory.

---

### ❌ **Don't Use Inconsistent Header Sizing**
**Bad:**
```jsx
<div className="px-4 py-3">  {/* Inconsistent padding */}
  <h2 className="text-sm">    {/* Too small */}
```

**Good:**
```jsx
<div className="px-6 py-4">
  <h2 className="text-lg font-semibold">
```

**Why:** Consistency creates professional polish.

---

### ❌ **Don't Skip Focus Management**
**Bad:**
```jsx
// No focus trap, no auto-focus
<button onClick={onClose}>Close</button>
```

**Good:**
```jsx
<button ref={closeButtonRef} ...>Close</button>
// + useEffect for focus management
```

**Why:** Accessibility is non-negotiable. Screen reader users and keyboard navigators must be supported.

---

### ❌ **Don't Make Close Buttons Too Small**
**Bad:**
```jsx
<button className="p-1">  {/* 28×28px - too small */}
  <X className="w-4 h-4" />
</button>
```

**Good:**
```jsx
<button className="p-2">  {/* 36×36px - accessible */}
  <X className="w-5 h-5" />
</button>
```

**Why:** Touch targets below 36px are difficult to tap on mobile. WCAG AA requires minimum 24px, but 36px+ is recommended.

---

### ❌ **Don't Use Harsh Colors**
**Bad:**
```jsx
<X className="w-5 h-5 text-red-600 hover:bg-red-100" />
```

**Good:**
```jsx
<X className="w-5 h-5 text-slate-600 hover:text-purple-600 hover:bg-purple-50" />
```

**Why:** Red is aggressive. Purple aligns with brand and feels welcoming.

---

## 📋 Pre-Launch Checklist

Before deploying a new modal, verify:

### **Structure:**
- [ ] Backdrop uses `bg-black/50 animate-in fade-in duration-200`
- [ ] Modal uses `shadow-2xl animate-in zoom-in-95 duration-200`
- [ ] `max-h-[90vh]` prevents viewport overflow
- [ ] Appropriate max-width for content type

### **Header:**
- [ ] `px-6 py-4` padding
- [ ] `text-lg font-semibold text-slate-900` title
- [ ] No decorative icons
- [ ] `border-b border-slate-200` separator

### **Close Button:**
- [ ] `p-2` padding (36×36px touch target)
- [ ] `w-5 h-5` icon size
- [ ] `hover:bg-purple-50` background
- [ ] `hover:text-purple-600` icon color
- [ ] `focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`
- [ ] Proper `aria-label`

### **Accessibility:**
- [ ] `role="dialog"` on container
- [ ] `aria-modal="true"` on container
- [ ] `aria-labelledby` points to title ID
- [ ] Focus trap implemented
- [ ] Auto-focus on close button when opened
- [ ] Escape key closes modal
- [ ] All interactive elements keyboard accessible

### **Testing:**
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Test on small screens (320px width)
- [ ] Test with long content (scrolling)

---

## 📚 Reference Examples

### **Existing Modals:**
- ✅ Quality Breakdown Modal: `client/src/components/QualityScore.jsx`
- ✅ Examples Modal: `client/src/components/ExamplesModal.jsx`

### **Complete Modal Template:**

```jsx
import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function ExampleModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus management: auto-focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Close on Escape key
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="example-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 id="example-modal-title" className="text-lg font-semibold text-slate-900">
            Modal Title
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-purple-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600 hover:text-purple-600 transition-colors" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Your content here */}
        </div>

        {/* Optional Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
          {/* Action buttons */}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Version History

- **v1.1** (2025-11-16) - Added accessibility best practices and backdrop click patterns
  - Documented why `inert` attribute should NOT be used on background content
  - Explained focus trap + `aria-modal="true"` pattern as industry best practice
  - Added backdrop click behavior patterns by modal type
  - Included conditional close logic for forms with unsaved state
  - Referenced major products (GitHub, Gmail, Stripe, Slack) for UX validation

- **v1.0** (2025-01-14) - Initial modal design standards document
  - Established header styling (no icons, text-lg titles, px-6 py-4 padding)
  - Defined close button sizing (36×36px touch target)
  - Documented accessibility requirements (focus trap, ARIA, keyboard nav)
  - Created color and animation standards
  - Added code templates and checklists

---

**Questions or suggestions?** Open an issue or contact the design team.
