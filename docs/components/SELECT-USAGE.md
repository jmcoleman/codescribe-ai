# Select Component - Usage Guide

**Component:** `client/src/components/Select.jsx`
**Library:** Headless UI (@headlessui/react)
**Status:** Production-ready
**Last Updated:** October 17, 2025

---

## Overview

The Select component is a fully accessible, keyboard-navigable dropdown built with Headless UI. It provides enterprise-grade accessibility out of the box with custom styling that matches the CodeScribe AI design system.

**Key Features:**
- ✅ Full keyboard navigation (Arrow keys, Home, End, Type-ahead search, Escape)
- ✅ Complete ARIA attributes (automatic)
- ✅ Screen reader support
- ✅ Brand-consistent styling
- ✅ Smooth transitions
- ✅ Responsive design

---

## Basic Usage

### Import

```jsx
import { Select } from './components/Select';
```

### Simple Example

```jsx
const docTypes = [
  { value: 'README', label: 'README.md' },
  { value: 'JSDOC', label: 'JSDoc Comments' },
  { value: 'API', label: 'API Documentation' },
  { value: 'ARCHITECTURE', label: 'Architecture Docs' },
];

function MyComponent() {
  const [docType, setDocType] = useState('README');

  return (
    <Select
      options={docTypes}
      value={docType}
      onChange={setDocType}
      ariaLabel="Select documentation type"
    />
  );
}
```

---

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `Array<{value: string, label: string}>` | Array of option objects with value and label |
| `value` | `string` | Currently selected value |
| `onChange` | `(value: string) => void` | Callback when selection changes |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Select...'` | Placeholder text when no value selected |
| `label` | `string` | `undefined` | Visible label above dropdown |
| `ariaLabel` | `string` | `undefined` | Accessible label for screen readers |

### Props Notes

- **`ariaLabel` vs `label`**:
  - Use `label` for visible text above the dropdown
  - Use `ariaLabel` for screen reader context without visible label
  - `ariaLabel` takes precedence if both are provided

---

## Examples

### With Visible Label

```jsx
<Select
  label="Documentation Type"
  options={docTypes}
  value={docType}
  onChange={setDocType}
/>
```

### With Screen Reader Label Only

```jsx
<Select
  ariaLabel="Select documentation type"
  options={docTypes}
  value={docType}
  onChange={setDocType}
/>
```

### With Placeholder

```jsx
<Select
  placeholder="Choose a format..."
  options={formats}
  value={format}
  onChange={setFormat}
  ariaLabel="Select export format"
/>
```

### Dynamic Options

```jsx
const [language, setLanguage] = useState('javascript');

const languageOptions = useMemo(() => [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
], []);

<Select
  options={languageOptions}
  value={language}
  onChange={setLanguage}
  ariaLabel="Select programming language"
/>
```

---

## Current Styling

### Design Decisions

**Hover State:**
- Background: `bg-purple-50/75` (purple-50 at 75% opacity)
- Subtle purple tint that shows brand personality
- Clearly visible without being overwhelming

**Selected Item:**
- Checkmark: `text-slate-600` (slate gray)
- No background color (checkmark is sufficient indicator)
- No bold text (modern, minimal approach)

**Text:**
- All options: `text-slate-700` (consistent weight)
- No font-weight changes between states

**Border & Shadow:**
- Border: `border-slate-200` (light gray)
- Shadow: `shadow-md` (medium drop shadow)
- No focus ring around dropdown list

**Transitions:**
- Smooth fade-out on close (100ms)
- Respects `prefers-reduced-motion`

### Color Reference

| Element | Tailwind Class | Hex Value | Purpose |
|---------|---------------|-----------|---------|
| Hover background | `bg-purple-50/75` | `#faf5ff` @ 75% | Interactive feedback |
| Checkmark | `text-slate-600` | `#475569` | Selection indicator |
| Text | `text-slate-700` | `#334155` | All options |
| Border | `border-slate-200` | `#e2e8f0` | Dropdown outline |

---

## Keyboard Navigation

The Select component supports full keyboard navigation via Headless UI:

| Key | Action |
|-----|--------|
| **Tab** | Focus dropdown button |
| **Space** / **Enter** | Open dropdown / Select highlighted option |
| **Escape** | Close dropdown |
| **Arrow Down** | Move to next option |
| **Arrow Up** | Move to previous option |
| **Home** | Jump to first option |
| **End** | Jump to last option |
| **Type letters** | Jump to option starting with typed letters (type-ahead) |

**No custom keyboard code needed** - all handled by Headless UI!

---

## Accessibility Features

### Automatic ARIA Attributes

Headless UI automatically manages all ARIA attributes:

**Button:**
- `role="button"`
- `aria-haspopup="listbox"`
- `aria-expanded="true/false"` (dynamic)
- `aria-labelledby` (links to label)

**Dropdown:**
- `role="listbox"`
- `aria-labelledby` (links to button)
- `aria-activedescendant` (tracks focused option)

**Options:**
- `role="option"`
- `aria-selected="true/false"` (dynamic)
- Unique `id` for each option

### Screen Reader Support

**Announcements:**
- Button announces current selection
- Opening dropdown announces "listbox, X items"
- Navigating options announces label and position (e.g., "API Documentation, 3 of 4")
- Selecting announces new selection

**Testing:**
- Tested with NVDA, JAWS, and VoiceOver
- Follows WAI-ARIA Authoring Practices 1.2
- WCAG 2.1 Level AA compliant

---

## When to Use This Component

### ✅ Use Select When:

- Single selection from a list (3-20 options ideal)
- Options are simple text labels
- Need full keyboard navigation
- Need screen reader support
- Want consistent brand styling

### ❌ Don't Use Select For:

- **Multi-select** - Create a new component based on Headless UI's Combobox or Listbox
- **Searchable dropdown** - Use Headless UI Combobox instead
- **Very long lists (50+)** - Consider searchable or grouped options
- **Complex option content** - (e.g., with images, descriptions) - Customize or create variant

---

## Creating Custom Variants

If you need a Select with different styling for a specific use case:

### Option 1: Add className Prop (Minor Tweaks)

Add support for custom classes:

```jsx
// In Select.jsx
export function Select({ options, value, onChange, className, ...props }) {
  return (
    <div className={`relative ${className || ''}`}>
      {/* ... */}
    </div>
  );
}

// Usage
<Select
  options={options}
  value={value}
  onChange={onChange}
  className="min-w-[200px]"
/>
```

### Option 2: Create Variant Prop (Distinct Styles)

For significantly different styles:

```jsx
// Add variant support
export function Select({ variant = 'default', ...props }) {
  const hoverClass = variant === 'search'
    ? 'bg-blue-50'
    : 'bg-purple-50/75';

  // Apply variant-specific styles
}

// Usage
<Select variant="search" ... />
```

### Option 3: New Component (Different Behavior)

For completely different functionality:
- Create `SearchableSelect.jsx` for searchable dropdowns
- Create `MultiSelect.jsx` for multi-selection
- Document in separate usage guide
- Keep design system consistency (colors, spacing, accessibility)

---

## Examples in Codebase

### ControlBar Component

**Location:** [client/src/components/ControlBar.jsx:50-55](../../client/src/components/ControlBar.jsx#L50)

```jsx
<Select
  options={docTypes}
  value={docType}
  onChange={onDocTypeChange}
  ariaLabel="Select documentation type"
/>
```

**Context:** Main documentation type selector in the control bar. No visible label (uses ariaLabel for screen readers). Used in production.

---

## Testing Guidelines

### Manual Testing Checklist

- [ ] Click to open dropdown
- [ ] Hover over options (should see purple highlight)
- [ ] Click option to select (should show checkmark)
- [ ] Press Tab to focus button
- [ ] Press Space/Enter to open
- [ ] Use Arrow keys to navigate
- [ ] Press Enter to select
- [ ] Press Escape to close
- [ ] Type letters for type-ahead search
- [ ] Test on mobile (touch interactions)

### Screen Reader Testing

- [ ] Button announces current selection
- [ ] Opening announces listbox with item count
- [ ] Arrow navigation announces each option
- [ ] Selection announces change
- [ ] All ARIA attributes present (inspect with dev tools)

### Accessibility Testing

- [ ] Keyboard-only navigation works
- [ ] Focus indicators visible (purple ring on button)
- [ ] Screen reader announces all states
- [ ] Respects prefers-reduced-motion
- [ ] Color contrast meets WCAG AA (text on backgrounds)

---

## Common Issues & Solutions

### Issue: Dropdown Opens Off-Screen

**Cause:** Parent container has `overflow: hidden` or fixed height
**Solution:** Ensure parent allows absolute positioning or use portal

```jsx
// If needed, add portal support
import { Portal } from '@headlessui/react';

<Portal>
  <Listbox.Options>...</Listbox.Options>
</Portal>
```

### Issue: Options Cut Off in Long Lists

**Current:** Max height set to `max-h-60` (15rem / 240px)
**Solution:** Already has `overflow-y-auto` for scrolling
**Customize:** Adjust `max-h-60` to `max-h-40` or `max-h-80` if needed

### Issue: Z-Index Conflicts

**Current:** `z-10` on dropdown
**Solution:** If dropdown appears behind other elements, increase z-index:

```jsx
<Listbox.Options className="... z-50">
```

### Issue: Focus Ring Wrong Color

**Current:** Global focus styles use `ring-indigo-500`
**Solution:** Button already has `focus:ring-2 focus:ring-purple-600` override
**If issues:** Add `!important` via arbitrary value: `focus:ring-[#9333ea]!`

---

## Future Enhancements (Optional)

Potential improvements for Phase 4 evaluation:

1. **Multi-select variant** - Select multiple options with checkboxes
2. **Searchable dropdown** - Filter options with search input
3. **Grouped options** - Support for `<optgroup>` equivalent
4. **Custom option rendering** - Support for icons, descriptions, avatars
5. **Async loading** - Load options from API
6. **Virtual scrolling** - For very long lists (100+ options)
7. **Mobile optimization** - Native picker on mobile devices
8. **Controlled open state** - Programmatic open/close control

---

## Related Documentation

- **Component:** [client/src/components/Select.jsx](../../client/src/components/Select.jsx)
- **Headless UI Docs:** https://headlessui.com/react/listbox
- **Design System:** [07-Figma-Guide.md](../planning/07-Figma-Guide.md)
- **Accessibility:** [SCREEN-READER-TESTING-GUIDE.md](../testing/SCREEN-READER-TESTING-GUIDE.md)
- **Toast System:** [TOAST-SYSTEM.md](./TOAST-SYSTEM.md)

---

## Changelog

### v1.0.0 - October 17, 2025
- Initial Select component implementation
- Replaced custom dropdown with Headless UI Listbox
- Implemented brand styling (purple hover, slate checkmark)
- Added keyboard navigation and ARIA support
- 75% opacity purple hover background
- No bold text on selected items
- No focus ring on dropdown list
- Full documentation created

---

## Support

For questions or issues with the Select component:
1. Check this documentation first
2. Review Headless UI docs: https://headlessui.com/react/listbox
3. Test with keyboard navigation and screen readers
4. Verify ARIA attributes with browser dev tools
5. Check for z-index or overflow issues in parent containers

---

**Maintainer Note:** When creating new dropdowns, always use this component for consistency. Only create new components if functionality is significantly different (multi-select, searchable, etc.). Document any new variants in this guide.
