# Accessibility Implementation Quick Start Guide

**For:** Development Team  
**Phase:** 1.5 - WCAG AA Compliance  
**Timeline:** Days 6-10  
**Full Assessment:** See `WCAG-AA-Accessibility-Assessment.md`

---

## Quick Reference: Top 7 Critical Issues

### Issue #1: Color Contrast ⚠️ HIGH
**What:** Text doesn't meet 4.5:1 contrast ratio  
**Fix:** Change `text-slate-500` → `text-slate-600`, `text-red-400` → `text-red-900`  
**Files:** CodePanel.jsx (lines 27, 31, 58), Header.jsx (line 22), ErrorBanner.jsx (lines 9, 12)  
**Time:** 2-3 hours

### Issue #2: Missing Labels ⚠️ HIGH
**What:** Form inputs lack labels for screen readers  
**Fix:** Add `<label>` elements and `aria-label` attributes  
**Files:** CodePanel.jsx, Select.jsx, ControlBar.jsx, Header.jsx  
**Time:** 2-3 hours

### Issue #3: Keyboard Navigation ⚠️ HIGH
**What:** Dropdown not accessible with keyboard  
**Fix:** Add arrow key navigation, Enter/Escape handlers  
**Files:** Select.jsx (full rewrite) OR use @radix-ui/react-select  
**Time:** 4-6 hours

### Issue #4: Focus Traps ⚠️ HIGH
**What:** Modals don't trap focus  
**Fix:** Install focus-trap-react, wrap modals  
**Files:** QualityScore.jsx, MobileMenu.jsx  
**Time:** 3-4 hours

### Issue #5: Skip Link ⚠️ HIGH
**What:** No way to bypass header navigation  
**Fix:** Add skip link at top of App.jsx  
**Files:** App.jsx, index.css  
**Time:** 1 hour

### Issue #6: Live Regions ⚠️ HIGH
**What:** Status changes not announced  
**Fix:** Add `role="status"`, `aria-live="polite"`  
**Files:** DocPanel.jsx, ErrorBanner.jsx, RateLimitIndicator.jsx  
**Time:** 2-3 hours

### Issue #7: Page Title ⚠️ HIGH
**What:** Generic "client" title  
**Fix:** Update to "CodeScribe AI - Intelligent Code Documentation Generator"  
**Files:** index.html (line 7)  
**Time:** 30 minutes

---

## Installation Commands

```bash
# Focus trap for modals (required)
npm install focus-trap-react

# Option A: Accessible UI library (RECOMMENDED)
npm install @radix-ui/react-select
# OR
npm install @headlessui/react

# Testing tools
npm install -g pa11y-ci
npm install --save-dev jest-axe @testing-library/react eslint-plugin-jsx-a11y

# Browser extensions (manual install)
# - axe DevTools: https://www.deque.com/axe/devtools/
# - WAVE: https://wave.webaim.org/extension/
```

---

## Day-by-Day Checklist

### Day 6: Critical Fixes (8-11 hours)
- [ ] Fix all color contrast issues (#1)
- [ ] Add all form labels (#2)
- [ ] Fix page title (#7)
- [ ] Add skip navigation link (#5)
- [ ] Implement live regions (#6)
- [ ] Run axe DevTools scan
- [ ] **Goal:** 75% compliant

### Day 7: Keyboard & Focus (9-13 hours)
- [ ] Make dropdown keyboard accessible (#3)
- [ ] Add focus traps to modals (#4)
- [ ] Enhance focus indicators (#9)
- [ ] Keyboard-only navigation test
- [ ] **Goal:** 90% compliant

### Day 8: ARIA & Semantics (6-8 hours)
- [ ] Mark decorative icons aria-hidden (#8)
- [ ] Fix heading hierarchy (#14)
- [ ] Add loading announcements (#13)
- [ ] Screen reader testing
- [ ] **Goal:** 95% compliant

### Day 9: Polish (6 hours)
- [ ] Add error prevention dialogs (#12)
- [ ] Add text labels to colors (#15)
- [ ] Set up testing tools
- [ ] Manual testing checklist
- [ ] **Goal:** 98% compliant

### Day 10: Testing & Certification (11-13 hours)
- [ ] Run axe DevTools (target: 0 violations)
- [ ] Run Lighthouse (target: 100/100)
- [ ] Run Pa11y CI
- [ ] Full screen reader test (NVDA/VoiceOver)
- [ ] Color blindness testing
- [ ] Keyboard-only test
- [ ] Export reports
- [ ] Update documentation
- [ ] **Goal:** 100% WCAG AA certified!

---

## Testing Checklist

### Automated Tools
- [ ] axe DevTools scan: 0 violations
- [ ] Lighthouse accessibility: 100/100
- [ ] Pa11y CI: 0 errors

### Manual Testing
- [ ] Keyboard navigation: All features work
- [ ] Screen reader (NVDA/VoiceOver): No critical issues
- [ ] 200% browser zoom: Content accessible
- [ ] High contrast mode: All UI visible
- [ ] Color blindness sim: Info not lost

---

## Quick Fixes

### Add SR-Only Class (for skip links, hidden labels)
```css
/* index.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
}

.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  margin: inherit;
  overflow: visible;
  clip: auto;
}
```

### Add Skip Link
```jsx
// App.jsx - first element in return
<a href="#main-content" className="sr-only focus:not-sr-only...">
  Skip to main content
</a>
```

### Add Live Region
```jsx
// DocPanel.jsx - add inside component
<div className="sr-only" role="status" aria-live="polite">
  {isGenerating && 'Generating documentation...'}
  {!isGenerating && documentation && 'Documentation complete!'}
</div>
```

### Mark Decorative Icon
```jsx
<Sparkles className="w-4 h-4" aria-hidden="true" />
```

### Add Form Label
```jsx
<label htmlFor="doc-type" className="sr-only">
  Documentation type
</label>
<select id="doc-type" aria-label="Choose documentation type">
  {/* options */}
</select>
```

---

## Resources

**Full Assessment:** `docs/WCAG-AA-Accessibility-Assessment.md` (1,145 lines)  
**WCAG Quick Ref:** https://www.w3.org/WAI/WCAG21/quickref/  
**Code Examples:** See assessment document for full implementations  
**Screen Readers:** NVDA (Windows, free), VoiceOver (macOS, built-in)  
**Contrast Checker:** https://webaim.org/resources/contrastchecker/

---

## Success Criteria

**Phase 1.5 is complete when:**
✅ All 25 accessibility issues resolved  
✅ axe DevTools: 0 violations  
✅ Lighthouse: 100/100 accessibility score  
✅ Keyboard navigation: 100% functional  
✅ Screen reader: No critical issues  
✅ Documentation: Accessibility statement published  

---

**Ready to start? Begin with Day 6 in the Todo List (`docs/planning/mvp/03-Todo-List.md`)**
