# Error Handling UX Design Guide

**Project:** CodeScribe AI
**Component:** Error Banner & Notification System
**Last Updated:** October 16, 2025
**Status:** Active Design Guidelines

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Research Summary](#research-summary)
3. [Decision Framework](#decision-framework)
4. [Animation Specifications](#animation-specifications)
5. [Implementation Guidelines](#implementation-guidelines)
6. [CodeScribe AI Error Patterns](#codescribe-ai-error-patterns)
7. [Accessibility Considerations](#accessibility-considerations)
8. [References](#references)

---

## Overview

This guide documents research-based best practices for error handling UX in CodeScribe AI. It provides clear guidelines for choosing between different error display methods (inline banners vs modals) and specifies animation standards based on industry research and enterprise design systems.

### Key Principles

1. **Inline banners are preferred** for most errors (non-blocking, recoverable)
2. **Modal dialogs are reserved** for critical, workflow-blocking errors only
3. **Animations should be subtle** and follow industry timing standards (200-300ms)
4. **Error messages must persist** until user dismisses or resolves the issue
5. **Accessibility is paramount** - respect `prefers-reduced-motion` and use ARIA

---

## Research Summary

### Sources Analyzed

- **Nielsen Norman Group** - Animation Duration & Error Message Guidelines
- **Material Design** - Motion System, Easing & Duration Specs
- **Carbon Design System** - Notification Pattern Guidelines
- **PatternFly Design System** - Alert Component Best Practices
- **UX Planet** - Enterprise Notification Design
- **Pencil & Paper** - Error Message UX Analysis

### Key Findings

#### 1. **Inline Banners vs Modal Popups**

**Research Consensus:** Inline banners are strongly preferred for most error scenarios.

> **Nielsen Norman Group**: *"Once an error is made, it may be easier to fix if the error message is presented within the main content instead of in a modal dialog."*

> **UX Best Practice**: *"Don't show critical information in a popup, since people tend to close them without reading."*

> **Carbon Design System**: *"Replace popups with thin, easy-to-dismiss banners at the top of the page to let users self-serve."*

**Why Users Prefer Banners:**
- Less disruptive to workflow
- User can see context while addressing error
- Persist until resolved (don't auto-dismiss)
- Don't block the entire interface
- Users reflexively close modals without reading

#### 2. **Animation Duration Standards**

**Nielsen Norman Group Research:**
- **Optimal range**: 100-400ms
- **Banner appear**: 200-300ms (entering animations slightly longer)
- **Banner dismiss**: 150-250ms (exiting animations faster)
- **Maximum**: 400-500ms (becomes "cumbersome and annoying")
- **Key principle**: "Look for the shortest time that an animation can take without being jarring"

**Material Design Standards:**
- **Mobile transitions**: 300ms typical
- **Complex transitions**: 375ms max
- **Small animations**: 150-200ms
- **Standard easing curve**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)

#### 3. **Error Display Best Practices**

**DO:**
- ✅ Persist errors until dismissed or resolved
- ✅ Use color/icons to indicate severity
- ✅ Provide actionable recovery steps
- ✅ Keep messages clear and jargon-free
- ✅ Use subtle animations to attract attention
- ✅ Make animations smooth and purposeful

**DON'T:**
- ❌ Auto-dismiss errors (users need time to read)
- ❌ Use animations longer than 400ms
- ❌ Make animations flashy or distracting
- ❌ Use humor in error messages
- ❌ Block workflow unnecessarily

---

## Decision Framework

### Notification Type Selection Matrix

```
Error Severity    | Blocks Workflow? | User Action Required? | Recommended UI
------------------------------------------------------------------------------------
Low               | No               | No                    | Toast (auto-dismiss)
Medium            | No               | Optional              | Banner (persists)
Medium-High       | Partially        | Yes                   | Banner (persists)
Critical          | Completely       | Immediate             | Modal Dialog
```

### ✅ Use INLINE BANNERS When:

1. **Error is NOT blocking critical workflow**
   - Server connection errors
   - API failures
   - File upload errors
   - Rate limiting
   - Network issues

2. **User can continue working or retry**
   - Non-destructive errors
   - Recoverable issues
   - System-generated problems

3. **Error relates to a specific area of the page**
   - Form validation errors (show inline near field)
   - Section-specific issues

4. **Low-to-medium severity**
   - Informational errors
   - Temporary issues
   - User can dismiss and continue

**Benefits:**
- Less disruptive to user flow
- User stays in context
- Can persist until resolved
- More accessible
- Users can reference error while fixing

### ⚠️ Use MODAL POPUPS ONLY When:

1. **Critical/severe errors requiring IMMEDIATE attention**
   - Data loss imminent
   - Security breaches
   - Payment failures (financial impact)
   - Session expiration requiring re-auth

2. **User MUST take action before proceeding**
   - Destructive actions needing confirmation
   - Legal/compliance acknowledgments
   - System-wide failures

3. **Error blocks ALL workflow**
   - App-breaking errors
   - Authentication failures
   - License/permission issues

**Drawbacks:**
- Users close without reading
- Blocks entire interface
- Can't reference context while fixing
- Frustrating/disruptive
- Should NOT be used for critical info (counterintuitively!)

---

## Animation Specifications

### Recommended Approach: Option 1 - Minimal Fade + Slide

**Based on Nielsen Norman Group and Material Design research**, this approach is:
- Professional and non-intrusive
- Follows industry standards (200-300ms)
- Accessible (respects `prefers-reduced-motion`)
- Enterprise-appropriate

### Animation Specs

#### **Enter Animation**
```css
animation: slideInFade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;

@keyframes slideInFade {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Properties:**
- **Duration**: 250ms (within 200-300ms optimal range)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard curve)
- **Movement**: 8px slide down (subtle, not jarring)
- **Opacity**: 0 → 1 (fade in)
- **Fill mode**: forwards (maintains final state)

#### **Exit Animation**
```css
animation: fadeOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards;

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
```

**Properties:**
- **Duration**: 200ms (faster exit, within 150-250ms range)
- **Easing**: `cubic-bezier(0.4, 0, 1, 1)` (ease-in for exit)
- **Movement**: None (simple fade)
- **Opacity**: 1 → 0 (fade out)
- **Fill mode**: forwards (maintains final state)

### Alternative Options (For Reference)

#### **Option 2: Slide + Slight Scale**
```
Enter: 300ms slide-down + scale(0.95 → 1.0) + fade-in
Exit: 200ms fade-out + scale(1.0 → 0.98)
Easing: cubic-bezier(0.16, 1, 0.3, 1) - Smooth bounce
```

**Pros**: More noticeable, creates depth
**Cons**: Slightly more complex, could feel "bouncy"
**Use case**: Consumer apps, when errors need more attention

#### **Option 3: Height Expand (Drawer Style)**
```
Enter: 300ms height 0 → auto with overflow hidden
Exit: 200ms height auto → 0
Easing: ease-in-out
```

**Pros**: Pushes content down smoothly, no overlap
**Cons**: More complex implementation, causes layout reflow
**Use case**: Fixed-position layouts, dense UIs

---

## Implementation Guidelines

### React Component Structure

```jsx
import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ErrorBanner({ error, retryAfter, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [error]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 200); // Match exit animation duration
  };

  if (!error || !isVisible) return null;

  return (
    <div
      className={`error-banner ${isExiting ? 'exiting' : 'entering'}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Banner content */}
    </div>
  );
}
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'slide-in-fade': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-8px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'slide-in-fade': 'slide-in-fade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-out': 'fade-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards',
      },
    },
  },
};
```

### CSS Classes

```css
.error-banner {
  /* Base styles */
  background-color: #fef2f2; /* red-50 */
  border-left: 4px solid #ef4444; /* red-500 */
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.error-banner.entering {
  animation: slide-in-fade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.error-banner.exiting {
  animation: fade-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .error-banner.entering,
  .error-banner.exiting {
    animation: none;
  }
}
```

---

## CodeScribe AI Error Patterns

### Error Classification

| Error Type | Severity | Blocking? | Display Method | Animation |
|------------|----------|-----------|----------------|-----------|
| **Network/Server Down** | Medium | No (can retry) | Inline Banner | Slide + Fade |
| **Rate Limit Exceeded** | Medium | Temporarily | Inline Banner | Slide + Fade |
| **File Upload Validation** | Low | No (can fix) | Inline Banner | Slide + Fade |
| **API Auth Failure** | High | Yes | Inline Banner* | Slide + Fade |
| **Code Parser Error** | Medium | No (can edit) | Inline Banner | Slide + Fade |
| **Invalid Input** | Low | No | Inline (near field) | Fade only |

*Note: Even auth failures use banners in CodeScribe AI because user can refresh/retry without losing work.

### Error Message Content Standards

#### Network Errors
```
Message: "Unable to connect to the server. Please check your internet
         connection and ensure the backend server is running."
Action: [Retry] button or instructions
Recovery: Clear, actionable steps
```

#### Rate Limit Errors
```
Message: "Rate limit exceeded. Too many requests."
Action: Display retry countdown
Recovery: "Please wait X seconds before trying again."
Visual: Pulsing dot indicator
```

#### Validation Errors
```
Message: Multi-line explanation of specific validation failures
Action: Dismiss button
Recovery: List each validation issue separately
```

#### Server Errors (5xx)
```
Message: "Server error occurred while generating documentation.
         Please try again."
Action: [Retry] or [Dismiss]
Recovery: "If the issue persists, contact support."
```

### Visual Design Standards

#### Colors (From Figma Design System)
```css
Background: #fef2f2 (red-50)
Border: #ef4444 (red-500) - 4px left accent
Text (Header): #7f1d1d (red-900)
Text (Body): #991b1b (red-700)
Icon: #ef4444 (red-500)
Button (Dismiss): #f87171 (red-400) → #dc2626 (red-600) on hover
```

#### Typography
```css
Header: text-sm font-semibold (14px, 600 weight)
Body: text-sm leading-relaxed (14px, 1.625 line-height)
Retry Message: text-xs font-medium (12px, 500 weight)
```

#### Spacing
```css
Padding: 1rem (16px)
Gap (Icon to Content): 1rem (16px)
Gap (Content to Button): 1rem (16px)
Margin Bottom: 1.5rem (24px)
```

#### Icons (Lucide React)
- **Error**: `AlertCircle` (20px)
- **Dismiss**: `X` (16px)
- **Retry Indicator**: Pulsing dot (6px) with `animate-pulse`

---

## Accessibility Considerations

### ARIA Attributes

```html
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  <AlertCircle aria-hidden="true" />
  <h3>Error</h3>
  <p>{errorMessage}</p>
  <button aria-label="Dismiss error">
    <X aria-hidden="true" />
  </button>
</div>
```

**Key Attributes:**
- `role="alert"` - Identifies as error/alert region
- `aria-live="assertive"` - Screen reader announces immediately
- `aria-atomic="true"` - Reads entire message as one unit
- `aria-hidden="true"` - Hides decorative icons from screen readers
- `aria-label` - Provides clear button purpose

### Motion Preferences

**Always respect `prefers-reduced-motion`:**

```css
@media (prefers-reduced-motion: reduce) {
  .error-banner {
    animation: none !important;
  }

  .error-banner.entering {
    opacity: 1;
    transform: none;
  }
}
```

### Keyboard Navigation

- ✅ Dismiss button must be keyboard accessible (focusable)
- ✅ Focus ring visible on focus (not just on hover)
- ✅ Enter/Space keys trigger dismiss action
- ✅ Error banner doesn't trap focus

### Screen Reader Testing

**Test with:**
- VoiceOver (macOS/iOS)
- NVDA (Windows)
- JAWS (Windows)

**Expected behavior:**
1. Error appears → Screen reader announces: "Alert: Error. [error message]"
2. User can navigate to dismiss button
3. User can activate dismiss button with keyboard
4. Error dismissed → Screen reader announces removal (implicit via aria-live)

---

## References

### Research Sources

1. **Nielsen Norman Group**
   - [Animation Duration Guidelines](https://www.nngroup.com/articles/animation-duration/)
   - [Error Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)
   - [Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/)

2. **Material Design**
   - [Easing and Duration Specs](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
   - [Duration & Easing (M1)](https://m1.material.io/motion/duration-easing.html)

3. **Carbon Design System**
   - [Notification Pattern](https://carbondesignsystem.com/patterns/notification-pattern/)
   - [Notification Component](https://carbondesignsystem.com/components/notification/usage/)

4. **Other Design Systems**
   - [PatternFly Alert Guidelines](https://www.patternfly.org/components/alert/design-guidelines/)
   - [HPE Design System - Toast Notifications](https://design-system.hpe.design/templates/toast-notifications)

5. **UX Research Articles**
   - [Error Message UX - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-error-feedback)
   - [UX Planet - Notification Design](https://uxplanet.org/notification-banners-for-building-trust-factor-in-enterprise-ux-c73e35de83e2)
   - [Smashing Magazine - Error Messages UX](https://www.smashingmagazine.com/2022/08/error-messages-ux-design/)

### CodeScribe AI Documentation

- [Figma Design Guide](../planning/07-Figma-Guide.md) - Color system and typography
- [Toast System Guide](./TOAST-SYSTEM.md) - Toast notification patterns (separate from error banners)
- [Product Requirements](../planning/01-PRD.md) - Feature specifications

---

## Version History

- **v1.0** (Oct 16, 2025) - Initial design guide created based on UX research
  - Documented inline banner vs modal decision framework
  - Specified animation timing standards (250ms enter, 200ms exit)
  - Defined CodeScribe AI error patterns and classification
  - Added accessibility guidelines and ARIA specifications

---

**Next Steps:**
1. Implement Option 1 animation (250ms slide + fade in, 200ms fade out)
2. Test with users to validate animation timing feels natural
3. Conduct accessibility audit with screen readers
4. Monitor user feedback on error message clarity

**Maintained by:** CodeScribe AI Design Team
**Questions?** Refer to research sources or contact UX lead
