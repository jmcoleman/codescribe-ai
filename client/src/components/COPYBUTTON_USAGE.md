# CopyButton - Quick Reference

## Enterprise-Grade Features

✅ **Icon Animation:** Copy → Check (200ms, rotation + scale)
✅ **Color Feedback:** White → Green-50 background on success
✅ **Auto-Reset:** Returns to default after 2 seconds
✅ **Accessibility:** ARIA labels, keyboard nav, reduced motion
✅ **Haptic Feedback:** Vibration on supported devices

---

## Quick Examples

### Icon-Only Button (Most Common)
```jsx
import { CopyButton } from './CopyButton';

<CopyButton 
  text={documentation} 
  variant="outline"
  ariaLabel="Copy documentation"
/>
```

### Button with Label
```jsx
import { CopyButtonWithText } from './CopyButton';

<CopyButtonWithText 
  text={codeSnippet}
  label="Copy Code"
/>
```

---

## Variants & Sizes

### Variants
- **ghost** - Transparent, minimal (hover: slate-100)
- **outline** - White with border (hover: slate-50)  
- **solid** - Filled background (hover: slate-200)

### Sizes
- **sm** - `p-1.5` with `w-3.5 h-3.5` icon
- **md** - `p-2` with `w-4 h-4` icon (default)
- **lg** - `p-2.5` with `w-5 h-5` icon

---

## Animation Timeline

```
0ms    - User clicks button
0ms    - Copy icon starts fading/rotating out
0ms    - Text copied to clipboard
50ms   - Haptic vibration (if supported)
100ms  - Check icon fully visible
200ms  - Animation complete, success state shown
2000ms - Auto-reset begins
2200ms - Back to default state
```

---

## Integration Points in CodeScribe AI

### ✅ Already Integrated
- **DocPanel.jsx** - Copy generated documentation

### 🎯 Recommended Additions
- **CodePanel.jsx** - Copy input code
- **ExamplesModal.jsx** - Copy example code snippets
- **QualityScore.jsx** - Copy quality report

---

## Best Practices

### DO ✅
- Use `variant="outline"` in headers/toolbars
- Use `variant="ghost"` overlaying code blocks
- Provide descriptive `ariaLabel` for context
- Copy meaningful content (documentation, code, results)

### DON'T ❌
- Add copy buttons to every piece of text
- Use without clear user value
- Forget `ariaLabel` for accessibility
- Disable auto-reset (users expect consistency)

---

## Enterprise Design Decisions

1. **2% scale on hover** (not 5-10%) - Subtle, professional
2. **200ms transitions** - Fast enough, not jarring
3. **2-second auto-reset** - Industry standard (GitHub, Vercel, etc.)
4. **Green success color** - Universal "success" indicator
5. **Rotation animation** - Adds polish, indicates state change
6. **Reduced motion support** - WCAG 2.1 compliant
