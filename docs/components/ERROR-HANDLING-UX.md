# Error Handling UX Design Guide

**Project:** CodeScribe AI
**Component:** Error Banner & Notification System
**Last Updated:** October 28, 2025 (Evening Session)
**Status:** Active Design Guidelines

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Error Notification Strategy](#error-notification-strategy)
3. [Priority Banner System](#priority-banner-system)
4. [Research Summary](#research-summary)
5. [Decision Framework](#decision-framework)
6. [Animation Specifications](#animation-specifications)
7. [Implementation Guidelines](#implementation-guidelines)
8. [CodeScribe AI Error Patterns](#codescribe-ai-error-patterns)
9. [Accessibility Considerations](#accessibility-considerations)
10. [References](#references)

---

## Overview

This guide documents research-based best practices for error handling UX in CodeScribe AI. It provides clear guidelines for choosing between different error display methods (inline banners vs modals) and specifies animation standards based on industry research and enterprise design systems.

### Key Principles

1. **Inline banners are preferred** for most errors (non-blocking, recoverable)
2. **Modal dialogs are reserved** for critical, workflow-blocking errors only
3. **Animations should be subtle** and follow industry timing standards (200-300ms)
4. **Error messages must persist** until user dismisses or resolves the issue
5. **Accessibility is paramount** - respect `prefers-reduced-motion` and use ARIA
6. **No duplicate notifications** - errors use banners only, not toasts
7. **Priority-based display** - show only the most critical message at a time
8. **Consistent styling** - all banners use left accent borders for visual cohesion

---

## Error Notification Strategy

### Decision: Banners for Errors, Toasts for Success

**Implemented:** October 18, 2025

CodeScribe AI uses a **clear separation** between error and success notifications to avoid notification spam and provide better UX.

#### ✅ Use Error Banners (Persistent, Dismissible)

**All error scenarios:**
- Documentation generation errors (network, rate limit, server errors)
- File upload errors (network, validation, server errors)
- Any recoverable error state

**Why banners instead of toasts:**
- ✅ **Persistent** - Stay visible until user dismisses (toasts auto-hide)
- ✅ **More prominent** - Harder to miss, better for critical information
- ✅ **Context available** - User can see the error while fixing the issue
- ✅ **Technical details** - Can expand to show stack traces in dev mode
- ✅ **No notification spam** - One persistent banner vs multiple toasts

**Implementation:**
```javascript
// App.jsx - File upload error
setUploadError(JSON.stringify(errorObject));
// No toast - error banner will display the error

// useDocGeneration.js - Generation error
setError(JSON.stringify(errorObject));
// No toast - error banner will display the error
```

#### ✅ Use Toasts (Quick Feedback)

**Success scenarios only:**
- Documentation generated successfully (`toastDocGenerated`)
- Example loaded (`toastCompact`)
- File uploaded successfully (`toastCompact`)

**Why toasts for success:**
- ✅ **Celebratory** - Positive reinforcement for completed actions
- ✅ **Non-blocking** - Quick feedback that auto-dismisses
- ✅ **Unobtrusive** - Doesn't take up permanent screen space

**Implementation:**
```javascript
// Success toast for documentation generation
toastDocGenerated(qualityScore.grade, qualityScore.score);

// Success toast for quick actions
toastCompact('Example loaded successfully', 'success');
```

#### ❌ DO NOT Use (Removed)

**Error toasts** - These create notification overload:
- ~~`toastError()` for errors~~ → Use ErrorBanner instead
- ~~`toastRateLimited()` for rate limits~~ → Use ErrorBanner with retry countdown
- ~~`toastNetworkError()` for network errors~~ → Use ErrorBanner instead
- ~~`toastGrouped()` for upload errors~~ → Use ErrorBanner instead

### Benefits of This Approach

1. **No duplicate notifications** - Each error shown once in persistent banner
2. **Clear mental model** - Red banner = error, green toast = success
3. **Better error visibility** - Errors don't auto-dismiss and get missed
4. **Technical details available** - Dev mode shows full error object in banner
5. **Reduced notification spam** - Only success actions trigger toasts

### Error Banner Features

**User-facing:**
- Clear error heading (e.g., "Connection Error" instead of "TypeError")
- User-friendly error message with actionable guidance
- Retry countdown for rate limit errors
- Dismiss button to clear error

**Developer-facing (dev mode only):**
- Expandable "Technical details" section
- Full error object (JSON)
- Error type
- Original error message from server/network
- Stack trace (if available)
- Timestamp

**Example error object structure:**
```javascript
{
  message: "Unable to connect to the server...",  // User-friendly
  type: "TypeError",                              // Error type
  originalMessage: "Failed to fetch",             // Original from network
  stack: "...",                                   // Stack trace
  timestamp: "2025-10-18T11:39:41.342Z"          // ISO timestamp
}
```

### API Error Parsing

**Enhanced Feature:** Automatic parsing of Claude API JSON error responses

**Problem:** Claude API returns errors as JSON objects that were displayed as raw strings:
```json
{"error":"invalid_request_error","message":"Your credit balance is too low..."}
```

**Solution:** Intelligent API error detection and parsing in `useDocGeneration.js`:

```javascript
// Check if the error message is a JSON string from the API
let apiError = null;
try {
  if (typeof err.message === 'string' && err.message.startsWith('{')) {
    apiError = JSON.parse(err.message);
  }
} catch (parseError) {
  // Not JSON, continue with normal error handling
}

// If we have a parsed API error, use it
if (apiError) {
  // Use the API's message directly (it's already user-friendly)
  errorMessage = apiError.message || errorMessage;
  // Map API error types to better names
  if (apiError.error === 'invalid_request_error') {
    errorType = 'InvalidRequestError';
  } else if (apiError.error === 'authentication_error') {
    errorType = 'AuthenticationError';
  } else if (apiError.error === 'rate_limit_error') {
    errorType = 'RateLimitError';
  }
}
```

**API Error Type Mapping:**

| API Error Code | Mapped Type | User-Friendly Heading |
|----------------|-------------|----------------------|
| `invalid_request_error` | InvalidRequestError | "Invalid Request" |
| `authentication_error` | AuthenticationError | "Authentication Error" |
| `rate_limit_error` | RateLimitError | "Rate Limit Exceeded" |

**Benefits:**
- ✅ API messages used directly (already user-friendly)
- ✅ Raw API JSON preserved in `originalMessage` for debugging
- ✅ Proper error type categorization
- ✅ No more raw JSON displayed to users

---

## Priority Banner System

**Implemented:** October 28, 2025

### Problem Statement

Multiple banners stacking vertically creates several UX issues:
- **Visual clutter** - Takes up ~200px of vertical space
- **Reduced impact** - Multiple messages compete for attention
- **User confusion** - Unclear which issue to address first
- **Mobile constraints** - Severely limits visible content area

### Solution: Priority-Based Display

**Design Decision:** Show only the most critical message at any time.

```javascript
// Priority Order (highest to lowest)
{error ? (
  // Priority 1: Claude API Errors (blocking - rate limits, auth)
  <ErrorBanner error={error} />
) : uploadError ? (
  // Priority 2: Upload Errors (file validation, network)
  <ErrorBanner error={uploadError} />
) : showUsageWarning ? (
  // Priority 3: Usage Warnings (80%+ quota, non-blocking)
  <UsageWarningBanner usage={usage} />
) : null}
```

### Priority Hierarchy Rationale

**Why this order?**

1. **Claude API Errors (Priority 1)**
   - **Blocks generation** - User cannot proceed until resolved
   - **Time-sensitive** - Rate limits have retry countdowns
   - **App-critical** - Core functionality unavailable
   - **Examples**: Rate limit exceeded, authentication error, insufficient credits

2. **Upload Errors (Priority 2)**
   - **Blocks input** - User cannot provide code to generate
   - **Immediate** - Happens during active user action
   - **Recoverable** - User can fix file and retry
   - **Examples**: File too large, invalid format, network error

3. **Usage Warnings (Priority 3)**
   - **Non-blocking** - User can still generate (until 100%)
   - **Informational** - Alerts about approaching limits
   - **Dismissible** - User can acknowledge and continue
   - **Examples**: 80% quota used, 90% quota used

### Banner Placement

**All banners appear at the top of the page** (below header, above control bar):

```
┌─────────────────────────────────┐
│ Header / Navigation             │
├─────────────────────────────────┤
│ [BANNER - Most Critical Only]   │  ← Consistent location
├─────────────────────────────────┤
│ Control Bar                      │
│ Main Content                     │
└─────────────────────────────────┘
```

**Why top placement?**
- **Immediate visibility** - First thing user sees
- **Consistent location** - All banners in same spot
- **No workflow interruption** - Doesn't cover working area
- **Mobile friendly** - Easy to scroll past once read

### Consistent Visual Language

All banners follow the same design pattern for cohesion:

**Common Elements:**
```css
/* Left accent border (4px) - Color indicates severity */
border-left: 4px solid [color];

/* Same icon size across all banners */
.icon { width: 1.5rem; height: 1.5rem; } /* w-6 h-6 */

/* Same animations */
.entering { animation: slide-in-fade 250ms ... }
.exiting { animation: fade-out 200ms ... }

/* Neutral slate background with colored accent */
background: slate-50;
border: slate-200;
border-left-color: [severity-color];
```

**Color Coding:**
- **Red accent** (`border-l-red-500`) - Blocking errors (API, upload)
- **Yellow accent** (`border-l-yellow-500`) - Warnings (usage 80-99%)

**Implementation:**
```jsx
// ErrorBanner.jsx - Red accent for blocking errors
<div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 ...">
  <AlertCircle className="h-6 w-6 text-red-600" />
  {/* Error content */}
</div>

// UsageWarningBanner.jsx - Yellow accent for warnings
<div className="bg-slate-50 border border-slate-200 border-l-4 border-l-yellow-500 ...">
  <AlertTriangle className="h-6 w-6 text-yellow-600" />
  {/* Warning content */}
</div>
```

### Benefits

1. **Reduced clutter** - ~200px of stacked banners → single 80px banner
2. **Clear priorities** - User knows which issue is most critical
3. **Better mobile experience** - More content visible on small screens
4. **Consistent UX** - All banners appear in same location
5. **Visual hierarchy** - Color-coded severity at a glance
6. **Professional appearance** - Clean, enterprise-grade design

### Implementation Notes

**State Management:**
```jsx
const [error, setError] = useState(null);           // API errors
const [uploadError, setUploadError] = useState(null); // Upload errors
const [showUsageWarning, setShowUsageWarning] = useState(false); // Usage

// Each error type has independent state
// Only highest-priority non-null state displays
```

**Dismissal Behavior:**
```jsx
// Each banner dismisses independently
onDismiss={() => setError(null)}        // API error
onDismiss={() => setUploadError(null)}  // Upload error
onDismiss={() => setShowUsageWarning(false)} // Usage warning

// When dismissed, next-highest-priority banner appears automatically
```

### Error Type Formatting

**CamelCase Auto-Formatting:** Error types like `TypeError`, `RangeError` automatically formatted with spaces

**Formatting Rules:**
1. **Special cases** (highest priority):
   - `TypeError` + "Failed to fetch" → "Connection Error"
   - `RateLimitError` → "Rate Limit Exceeded"
   - `InvalidRequestError` → "Invalid Request"
   - `AuthenticationError` → "Authentication Error"
   - `ValidationError` → "Validation Error"
   - `SyntaxError` → "Invalid Input"

2. **Underscore-separated** (e.g., `invalid_request_error`):
   - Split on underscores
   - Capitalize each word
   - Join with spaces: "Invalid Request Error"

3. **CamelCase** (e.g., `TypeError`, `RangeError`):
   - Insert space before capital letters
   - Result: "Type Error", "Range Error"

**Examples:**

| Original Error Type | Formatted Heading | Technical Details (unchanged) |
|---------------------|-------------------|-------------------------------|
| `TypeError` + "Failed to fetch" | Connection Error | TypeError |
| `InvalidRequestError` | Invalid Request | InvalidRequestError |
| `AuthenticationError` | Authentication Error | AuthenticationError |
| `ReferenceError` | Reference Error | ReferenceError |
| `NetworkError` | Network Error | NetworkError |

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
/* Error Banner (Red - Blocking) */
.error-banner {
  /* Base styles */
  background-color: #fef2f2; /* red-50 */
  border: 1px solid #fecaca; /* red-200 */
  border-left: 4px solid #ef4444; /* red-500 accent */
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

/* Usage Warning Banner (Yellow - Non-blocking) */
.usage-warning-banner {
  /* Base styles */
  background-color: #f8fafc; /* slate-50 */
  border: 1px solid #e2e8f0; /* slate-200 */
  border-left: 4px solid #eab308; /* yellow-500 accent */
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

/* Animation states (same for all banners) */
.error-banner.entering,
.usage-warning-banner.entering {
  animation: slide-in-fade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.error-banner.exiting,
.usage-warning-banner.exiting {
  animation: fade-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .error-banner.entering,
  .error-banner.exiting,
  .usage-warning-banner.entering,
  .usage-warning-banner.exiting {
    animation: none;
  }
}
```

---

## CodeScribe AI Error Patterns

### Error Classification

| Error Type | Severity | Blocking? | Display Method | Color Accent | Priority |
|------------|----------|-----------|----------------|--------------|----------|
| **Rate Limit Exceeded** | High | Yes | ErrorBanner | Red | 1 |
| **API Auth Failure** | High | Yes | ErrorBanner | Red | 1 |
| **Network/Server Down** | Medium-High | Temporarily | ErrorBanner | Red | 1 |
| **File Upload Validation** | Medium | Partially | ErrorBanner | Red | 2 |
| **File Upload Network** | Medium | Partially | ErrorBanner | Red | 2 |
| **Usage Warning (80-99%)** | Low | No | UsageWarningBanner | Yellow | 3 |
| **Usage Limit (100%)** | High | Yes | UsageLimitModal | Red | N/A* |
| **Code Parser Error** | Medium | No (can edit) | Inline Banner | Red | N/A |
| **Invalid Input** | Low | No | Inline (near field) | Red | N/A |

*Note: UsageLimitModal is a blocking modal, not part of the banner priority system.

**Priority System:**
- **Priority 1**: Claude API errors (rate limit, auth, network)
- **Priority 2**: Upload errors (validation, network)
- **Priority 3**: Usage warnings (80-99% quota)
- **Only one banner displays at a time** based on priority hierarchy

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
/* Error Banners (API errors, Upload errors) */
Background: #fef2f2 (red-50)
Border: #fecaca (red-200)
Left Accent: #ef4444 (red-500) - 4px
Text (Header): #7f1d1d (red-900)
Text (Body): #991b1b (red-700)
Icon: #dc2626 (red-600)
Button (Dismiss): #f87171 (red-400) → #dc2626 (red-600) on hover

/* Usage Warning Banners (80-99% quota) */
Background: #f8fafc (slate-50)
Border: #e2e8f0 (slate-200)
Left Accent: #eab308 (yellow-500) - 4px
Text (Header): #0f172a (slate-900)
Text (Body): #475569 (slate-600)
Icon: #ca8a04 (yellow-600)
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
- **Error**: `AlertCircle` (24px / w-6 h-6) - Red banners
- **Warning**: `AlertTriangle` (24px / w-6 h-6) - Yellow banners
- **Dismiss**: `X` (16px)
- **Retry Indicator**: Pulsing dot (6px) with `animate-pulse`

**Icon Size Consistency:**
All banners use the same icon size (w-6 h-6 / 24px) for visual cohesion across error states and warning states.

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

### v2.0 (Oct 28, 2025 - Evening Session)

**Major Updates:**

1. **Priority Banner System**
   - Implemented priority-based display (show only most critical message)
   - Priority hierarchy: API errors (1) > Upload errors (2) > Usage warnings (3)
   - Reduces UI clutter from ~200px stacked banners to single 80px banner
   - Added detailed rationale for priority order

2. **Consistent Visual Language**
   - All banners now use left accent border pattern (4px)
   - Standard icon size across all banners (w-6 h-6 / 24px)
   - Color-coded severity: Red (blocking) vs Yellow (warning)
   - Neutral slate background for warning banners instead of yellow

3. **Banner Placement Standardization**
   - All banners appear at top of page (below header, above control bar)
   - Consistent location improves visibility and UX
   - Mobile-friendly placement

4. **Updated Classification Table**
   - Added priority column to error classification
   - Included usage warning patterns (80-99% quota)
   - Distinguished between ErrorBanner and UsageWarningBanner
   - Added UsageLimitModal (100% blocking state)

5. **Enhanced Documentation**
   - Added implementation notes for state management
   - Documented dismissal behavior with priority system
   - Updated color specifications for both red and yellow banners
   - Added icon consistency guidelines

### v1.0 (Oct 16, 2025)

- Initial design guide created based on UX research
- Documented inline banner vs modal decision framework
- Specified animation timing standards (250ms enter, 200ms exit)
- Defined CodeScribe AI error patterns and classification
- Added accessibility guidelines and ARIA specifications

---

**Maintained by:** CodeScribe AI Design Team
**Questions?** Refer to research sources or contact UX lead

**Related Documentation:**
- [USAGE-PROMPTS.md](./USAGE-PROMPTS.md) - Usage warning and limit modal patterns
- [TOAST-SYSTEM.md](./TOAST-SYSTEM.md) - Success notification patterns
