# Screen Reader Testing Guide - CodeScribe AI

**Purpose:** Manual validation of screen reader compatibility
**Time Required:** 30-45 minutes
**WCAG Criteria:** 4.1.2 Name, Role, Value + general screen reader accessibility
**Date Created:** October 16, 2025

---

## Quick Start (macOS - VoiceOver)

### 1. Enable VoiceOver (Built-in macOS Screen Reader)

**Keyboard Shortcut:**
```
Cmd + F5
```

**Or via System Settings:**
1. Open **System Settings** → **Accessibility**
2. Click **VoiceOver** in the sidebar
3. Toggle **"Enable VoiceOver"**

### 2. Start Dev Server

```bash
cd /Users/jcoleman-mbp/Developer/projects/codescribe-ai/client
npm run dev
```

Open browser: `http://localhost:5173`

### 3. Essential VoiceOver Commands

| Action | Command | Use Case |
|--------|---------|----------|
| **Enable/Disable** | `Cmd + F5` | Turn VoiceOver on/off |
| **Read Current** | `VO + A` | Read currently focused element |
| **Next Item** | `VO + →` | Move to next element |
| **Previous Item** | `VO + ←` | Move to previous element |
| **Navigate Headings** | `VO + Cmd + H` | Jump between headings |
| **Navigate Links** | `VO + Cmd + L` | Jump between links |
| **Navigate Forms** | `VO + Cmd + J` | Jump between form controls |
| **Navigate Landmarks** | `VO + U` → Landmarks | Navigate by ARIA landmarks |
| **Interact with Element** | `VO + Space` | Click/activate |
| **Start/Stop Reading** | `VO + A` | Read from current position |

**Note:** `VO` = Control + Option (the VoiceOver keys)

---

## 📋 Testing Checklist

### Phase 1: Basic Navigation (10 minutes)

**Test:** Navigate through the entire application using only VoiceOver

- [ ] **1.1 Page Load**
  - Open `http://localhost:5173`
  - Press `VO + A` to hear page title
  - **Expected:** "CodeScribe AI - Intelligent Code Documentation Generator"

- [ ] **1.2 Heading Navigation**
  - Press `VO + Cmd + H` to navigate headings
  - **Expected:** Hear all headings in order (h1 → h2 → h3)
  - Verify heading hierarchy makes sense

- [ ] **1.3 Landmark Navigation**
  - Press `VO + U` → Select "Landmarks"
  - **Expected:** Hear "header", "main", "navigation" (mobile menu)
  - Navigate between landmarks with arrow keys

- [ ] **1.4 Tab Through Interactive Elements**
  - Press `Tab` repeatedly
  - **Expected:** Focus moves logically through:
    - Generate Docs button
    - Doc Type dropdown
    - Help button
    - Examples button
    - Mobile menu button (if mobile view)
    - File upload button
  - VoiceOver should announce each element's purpose

---

### Phase 2: Form Controls (5 minutes)

**Test:** Verify all form controls are announced correctly

- [ ] **2.1 Doc Type Dropdown**
  - Tab to "Doc Type" select
  - Press `VO + A`
  - **Expected:** "Documentation Type, pop-up button" or similar
  - Press `Space` to open dropdown
  - Use arrow keys to navigate options
  - **Expected:** Hear "README", "JSDoc", "API", "Architecture"

- [ ] **2.2 File Upload**
  - Tab to file upload button
  - **Expected:** "Upload code file, button" or "Choose file, button"

- [ ] **2.3 Generate Button**
  - Tab to Generate Docs button
  - **Expected:** "Generate Docs, button" or "Generate Documentation, button"

---

### Phase 3: Dynamic Content (10 minutes)

**Test:** Verify dynamic content changes are announced

- [ ] **3.1 Error Messages**
  - Click "Generate Docs" without entering code
  - **Expected:** VoiceOver announces error message immediately
  - Error should be announced as "Alert" or with assertive live region
  - Listen for: "Please enter code to generate documentation, alert"

- [ ] **3.2 Loading States**
  - Paste example code and click "Generate Docs"
  - **Expected:** VoiceOver announces "Generating..." or loading state
  - Listen for status updates during generation

- [ ] **3.3 Documentation Generated**
  - Wait for documentation to complete
  - Navigate to documentation panel (right side)
  - **Expected:** Documentation content is readable
  - Should be able to navigate through markdown headings

- [ ] **3.4 Quality Score**
  - After generation, navigate to quality score
  - **Expected:** Hear quality score value (e.g., "Quality Score: 85, Grade B+")

---

### Phase 4: Modals (5 minutes)

**Test:** Verify modal dialogs are accessible

- [ ] **4.1 Help Modal**
  - Tab to "Help" button and press `Space`
  - **Expected:** Focus moves into modal
  - VoiceOver announces: "Help & Documentation, dialog" or similar
  - Tab through modal content
  - Press `Escape` to close
  - **Expected:** Focus returns to Help button

- [ ] **4.2 Examples Modal**
  - Tab to "Examples" button and press `Space`
  - **Expected:** Modal opens, focus moves to close button
  - VoiceOver announces: "Choose an example, dialog"
  - Tab through example cards
  - **Expected:** Each example announced with name and description
  - Press `Escape` to close

- [ ] **4.3 Quality Score Modal**
  - Generate documentation to see quality score
  - Tab to "View full report" button
  - Press `Space` to open modal
  - **Expected:** Modal opens with quality breakdown
  - Navigate through improvement suggestions
  - Close with `Escape`

---

### Phase 5: ARIA Attributes (5 minutes)

**Test:** Verify ARIA attributes are working correctly

- [ ] **5.1 aria-live Regions**
  - Trigger an error (generate without code)
  - **Expected:** Error announced automatically without manual navigation
  - This tests `aria-live="assertive"` on ErrorBanner

- [ ] **5.2 aria-label**
  - Navigate to close buttons in modals
  - **Expected:** Hear descriptive labels like "Close help modal" (not just "Close")

- [ ] **5.3 aria-expanded**
  - In Help modal, navigate to FAQ accordion items
  - **Expected:** Hear "expanded" or "collapsed" state
  - Activate with `Space` to toggle
  - State should change and be announced

- [ ] **5.4 aria-hidden**
  - Decorative icons should NOT be announced
  - **Expected:** VoiceOver skips over decorative icons (marked with `aria-hidden="true"`)

---

### Phase 6: Mobile Menu (Mobile Viewport) (5 minutes)

**Test:** Verify mobile menu accessibility

- [ ] **6.1 Resize Browser**
  - Resize browser to mobile width (375px)
  - **Expected:** Mobile menu button appears

- [ ] **6.2 Open Mobile Menu**
  - Tab to mobile menu button (hamburger icon)
  - **Expected:** Hear "Menu, button" or "Open navigation menu"
  - Press `Space` to open
  - **Expected:** Menu opens, focus trapped inside

- [ ] **6.3 Navigate Menu Items**
  - Tab through menu items
  - **Expected:** Hear each navigation item
  - Press `Escape` to close
  - **Expected:** Focus returns to menu button

---

## 🎯 Pass/Fail Criteria

### ✅ PASS if:
- All interactive elements are announced with descriptive names
- Headings and landmarks can be navigated
- Dynamic content changes are announced (errors, loading states)
- Modals trap focus and announce properly
- Escape key closes modals and returns focus
- Form controls are announced with their labels
- ARIA live regions work (errors announced automatically)

### ❌ FAIL if:
- Interactive elements are announced as "button" with no context
- Headings are missing or out of order
- Dynamic content changes are silent (not announced)
- Focus gets trapped in modals permanently
- Form controls have no labels
- Decorative icons are announced (should be aria-hidden)
- Navigation is confusing or illogical

---

## 🪟 Windows Testing (NVDA)

If you have access to Windows, you can also test with NVDA (free):

### Install NVDA
```
https://www.nvaccess.org/download/
```

### Essential NVDA Commands

| Action | Command |
|--------|---------|
| **Enable/Disable** | `Ctrl + Alt + N` |
| **Read Current** | `Insert + ↑` |
| **Next Item** | `↓` |
| **Previous Item** | `↑` |
| **Navigate Headings** | `H` |
| **Navigate Links** | `K` |
| **Navigate Forms** | `F` |
| **Navigate Buttons** | `B` |
| **Stop Reading** | `Ctrl` |

### NVDA Testing Checklist
Same as VoiceOver checklist above, but use NVDA-specific commands.

---

## 📊 Expected Results (CodeScribe AI)

Based on our implementation, you should hear:

### Header Area:
- "CodeScribe AI, heading level 1"
- "Intelligent Code Documentation Generator, heading level 2"
- "Generate Docs, button"
- "Documentation Type, pop-up button"
- "Help, button"
- "Examples, button"

### Code Panel:
- "Code Input, heading level 2"
- "Enter your code here, text area" (Monaco editor)
- "Upload code file, button"

### Documentation Panel:
- "Generated Documentation, heading level 2"
- "Copy documentation, button"
- (After generation) Documentation content as readable text

### Error Handling:
- "Alert: Please enter code to generate documentation" (announced immediately)

### Modals:
- "Help & Documentation, dialog"
- "Choose an example, dialog"
- "Quality Score Breakdown, dialog"

---

## 🐛 Common Issues to Watch For

### Issue 1: Elements Not Announced
**Symptom:** VoiceOver skips over buttons or says "unlabeled"
**Check:** Look for missing `aria-label` or button text
**Status:** ✅ Should not occur (all elements labeled)

### Issue 2: Dynamic Content Silent
**Symptom:** Error appears but VoiceOver doesn't announce it
**Check:** Verify `aria-live="assertive"` on ErrorBanner
**Status:** ✅ Implemented in ErrorBanner.jsx

### Issue 3: Focus Stuck in Modal
**Symptom:** Can't tab out of modal with keyboard
**Check:** Focus trap implementation
**Status:** ✅ Focus traps implemented + Escape closes modal

### Issue 4: Decorative Icons Announced
**Symptom:** VoiceOver reads icon names (e.g., "X icon")
**Check:** Verify `aria-hidden="true"` on decorative icons
**Status:** ✅ All decorative icons marked aria-hidden

---

## 📝 Documentation Template

Use this template to document your screen reader testing:

```markdown
## Screen Reader Testing Results

**Date:** [Date]
**Tester:** [Your Name]
**Screen Reader:** VoiceOver [Version] / NVDA [Version]
**Browser:** Chrome [Version]
**OS:** macOS [Version] / Windows [Version]

### Results:

#### Basic Navigation: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

#### Form Controls: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

#### Dynamic Content: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

#### Modals: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

#### ARIA Attributes: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

### Overall Assessment:
[Pass/Fail with summary]

### Issues Found:
[List any issues or note "None"]

### Recommendations:
[Any improvements or note "None - fully accessible"]
```

---

## 🎓 Learning Resources

### VoiceOver Guides:
- [Apple VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [WebAIM VoiceOver Guide](https://webaim.org/articles/voiceover/)

### NVDA Guides:
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [WebAIM NVDA Guide](https://webaim.org/articles/nvda/)

### General Screen Reader Testing:
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Screen Reader Testing Best Practices](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/Accessibility#screenreaders)

---

## ⏱️ Time Estimate

**Quick Test (Essential Only):** 15 minutes
- Basic navigation
- One modal test
- Error announcement test

**Thorough Test (Recommended):** 30-45 minutes
- All 6 phases above
- Document results

**Comprehensive Test:** 60+ minutes
- Test with multiple screen readers (VoiceOver + NVDA)
- Test all edge cases
- Document everything

---

## ✅ Completion Checklist

After completing screen reader testing, you should:

- [ ] Test with VoiceOver (macOS) or NVDA (Windows)
- [ ] Complete all 6 testing phases
- [ ] Document results using template above
- [ ] Add results to ACCESSIBILITY-AUDIT.MD
- [ ] Update 03-Todo-List.md to mark screen reader testing complete
- [ ] (Optional) Record a video demonstration for portfolio

---

**Next Steps After Testing:**
1. Document any issues found (if any)
2. Update accessibility audit documentation
3. Proceed with cross-browser testing
4. Prepare for production deployment

---

**Note:** Based on our Lighthouse 100/100 score and comprehensive ARIA implementation, we expect ZERO critical issues during manual testing. This is a validation exercise to confirm what the automated tools have already verified.

**Good luck with your testing!** 🎉
