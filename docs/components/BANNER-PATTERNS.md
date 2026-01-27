# Banner Design Patterns

**Version:** 1.0
**Last Updated:** January 26, 2026
**Status:** Active Design Pattern

---

## Overview

This document defines the visual design patterns for all banner types in CodeScribe AI. Banners are persistent, dismissible notifications that appear at the top of a page or within modals to communicate important information to users.

**Key Characteristics:**
- Persistent until dismissed or resolved
- Consistent visual language across all types
- Priority-based display (only most critical shown)
- Respects `prefers-reduced-motion`
- WCAG 2.1 AA compliant

---

## Table of Contents

1. [Banner Types](#banner-types)
2. [Visual Design System](#visual-design-system)
3. [Layout Patterns](#layout-patterns)
4. [Animation Specifications](#animation-specifications)
5. [Priority System](#priority-system)
6. [Accessibility](#accessibility)
7. [Implementation Examples](#implementation-examples)

---

## Banner Types

### 1. Info/Promotional Banners (Blue)

**Purpose:** Educational content, feature promotion, account upgrades

**Use Cases:**
- "Connect GitHub" to access private repos
- Feature announcements
- Upgrade prompts (non-blocking)
- Onboarding tips

**Visual Characteristics:**
```css
Background: linear-gradient(to right, blue-50, indigo-50)
           dark: linear-gradient(to right, blue-900/20, indigo-900/20)
Border: 1px solid blue-200 (dark: blue-800)
Icon Color: blue-600 (dark: blue-400)
Text: blue-900 (dark: blue-100) heading
      blue-800 (dark: blue-200) body
```

**Components:**
- Icon (left, top-aligned)
- Heading + description text (center, expanding)
- CTA button (right on desktop, bottom-aligned | below on mobile)
- Dismiss X (absolute, top-right)

**Example:** GitHub OAuth connection banner in GitHubLoadModal

---

### 2. Error Banners (Red)

**Purpose:** Blocking errors requiring user action

**Use Cases:**
- API failures (rate limit, authentication)
- Network errors
- File upload errors
- Validation errors (form-level)

**Visual Characteristics:**
```css
Background: red-50 (dark: red-900/20)
Border: 1px solid red-200 (dark: red-800)
Border-left: 4px solid red-500 (dark: red-400) /* Accent */
Icon: AlertCircle, w-6 h-6, red-600 (dark: red-400)
Text: red-900 (dark: white) heading
      red-700 (dark: red-200) body
```

**Components:**
- AlertCircle icon (left, 24px)
- Heading (bold, 14px)
- Body text (14px, leading-relaxed)
- Dismiss button (right)
- Optional retry countdown or action button

**Example:** Claude API error banner in App.jsx

---

### 3. Warning Banners (Yellow)

**Purpose:** Non-blocking warnings and cautions

**Use Cases:**
- Usage approaching limits (80-99% quota)
- Deprecation notices
- Browser compatibility warnings
- Beta feature notices

**Visual Characteristics:**
```css
Background: slate-50 (dark: slate-800)
Border: 1px solid slate-200 (dark: slate-700)
Border-left: 4px solid yellow-500 (dark: yellow-400) /* Accent */
Icon: AlertTriangle, w-6 h-6, yellow-600 (dark: yellow-400)
Text: slate-900 (dark: white) heading
      slate-600 (dark: slate-300) body
```

**Components:**
- AlertTriangle icon (left, 24px)
- Heading (bold, 14px)
- Body text (14px, leading-relaxed)
- Dismiss button (right)
- Optional action link

**Example:** Usage warning banner (80% quota) in App.jsx

---

### 4. Success Banners (Green) - Optional

**Purpose:** Persistent success messages (rare - usually use toasts)

**Use Cases:**
- Long-running operations completed
- Account verification success
- Settings saved successfully (when persistence matters)

**Visual Characteristics:**
```css
Background: green-50 (dark: green-900/20)
Border: 1px solid green-200 (dark: green-800)
Border-left: 4px solid green-500 (dark: green-400) /* Accent */
Icon: CheckCircle, w-6 h-6, green-600 (dark: green-400)
Text: green-900 (dark: white) heading
      green-700 (dark: green-200) body
```

**Note:** Most success feedback uses toasts. Use banners only when message needs to persist.

---

## Visual Design System

### Common Design Language

All banners share these characteristics for visual cohesion:

#### Left Accent Border (4px)
```css
border-left: 4px solid [color];

/* Color indicates severity */
blue-500   → Info/Promotional
red-500    → Error (blocking)
yellow-500 → Warning (non-blocking)
green-500  → Success (rare)
```

#### Consistent Icon Sizing
```css
.icon {
  width: 1.5rem;   /* w-6 / 24px */
  height: 1.5rem;  /* h-6 / 24px */
}
```

#### Spacing Standards
```css
Padding: p-4 (16px all sides)
Gap (icon to content): gap-4 (16px)
Gap (content to button): gap-4 (16px)
Margin bottom: mb-4 or mb-6 (16px or 24px)
```

#### Typography
```css
Heading: text-sm font-semibold (14px, 600 weight)
Body: text-sm leading-relaxed (14px, 1.625 line-height)
Links/Actions: text-sm font-medium (14px, 500 weight)
```

#### Border Radius
```css
rounded-lg (0.5rem / 8px)
```

#### Shadow
```css
shadow-sm (0 1px 3px rgba(0,0,0,0.1))
```

---

## Layout Patterns

### 1. Simple Banner (Icon + Text + Dismiss)

```
┌─────────────────────────────────────────────────┐
│ [Icon] Heading text                          [X]│
│        Body text explaining the situation        │
└─────────────────────────────────────────────────┘
```

**Structure:**
```jsx
<div className="flex items-start gap-4 p-4 rounded-lg border ...">
  <Icon className="w-6 h-6 flex-shrink-0" />
  <div className="flex-1 min-w-0">
    <h3 className="text-sm font-semibold mb-1">Heading</h3>
    <p className="text-sm leading-relaxed">Body text</p>
  </div>
  <button className="flex-shrink-0" onClick={onDismiss}>
    <X className="w-4 h-4" />
  </button>
</div>
```

---

### 2. Banner with CTA Button (Info/Promo Pattern)

**Desktop Layout (Horizontal):**
```
┌──────────────────────────────────────────────────────────────┐
│ [Icon] Heading text                                       [X]│
│        Body text explaining the situation    [CTA Button]    │
└──────────────────────────────────────────────────────────────┘
```

**Mobile Layout (Vertical):**
```
┌──────────────────────────────────────┐
│ [Icon] Heading text               [X]│
│        Body text explaining the      │
│        situation                     │
│        [CTA Button]                  │
└──────────────────────────────────────┘
```

**Structure:**
```jsx
<div className="relative p-4 rounded-lg border ...">
  {/* Dismiss X - absolute positioned, top-right */}
  <button
    onClick={onDismiss}
    className="absolute top-3 right-3 ..."
  >
    <X className="h-4 w-4" />
  </button>

  {/* Content - horizontal on desktop, vertical on mobile */}
  <div className="flex items-start gap-4 pr-8">
    {/* Icon */}
    <div className="flex-shrink-0">
      <Icon className="w-5 h-5" />
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold mb-1">Heading</h3>
      <p className="text-xs leading-relaxed">Body text</p>
    </div>

    {/* CTA Button - Desktop: right side, bottom-aligned */}
    <div className="flex-shrink-0 hidden sm:block self-end">
      <a href="..." className="inline-flex items-center gap-2 px-4 py-2 ...">
        <Icon className="w-4 h-4" />
        Button Text
      </a>
    </div>
  </div>

  {/* CTA Button - Mobile: below text */}
  <div className="sm:hidden mt-3 pl-9">
    <a href="..." className="inline-flex items-center gap-2 px-4 py-2 ...">
      <Icon className="w-4 h-4" />
      Button Text
    </a>
  </div>
</div>
```

**Key Alignment Details:**
- Container: `items-start` (icon and text top-aligned)
- Button container (desktop): `self-end` (bottom-aligns with text)
- Mobile button: `pl-9` (aligns with text, accounting for icon width)

---

### 3. Banner with Action Button (Error/Warning Pattern)

```
┌─────────────────────────────────────────────────┐
│ [Icon] Heading text                          [X]│
│        Body text with explanation                │
│        [Retry] or [View Details]                 │
└─────────────────────────────────────────────────┘
```

**Structure:**
```jsx
<div className="flex items-start gap-4 p-4 rounded-lg border ...">
  <Icon className="h-6 w-6 flex-shrink-0" />
  <div className="flex-1 min-w-0">
    <h3 className="text-sm font-semibold mb-1">Heading</h3>
    <p className="text-sm leading-relaxed mb-3">Body text</p>
    <button className="text-sm font-medium underline hover:no-underline">
      Action Text
    </button>
  </div>
  <button className="flex-shrink-0" onClick={onDismiss}>
    <X className="h-4 w-4" />
  </button>
</div>
```

---

## Animation Specifications

### Enter Animation (250ms)

```css
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

.banner-entering {
  animation: slideInFade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

**Properties:**
- Duration: 250ms (optimal range 200-300ms)
- Easing: Material Design standard curve
- Movement: 8px slide down (subtle)
- Opacity: 0 → 1

---

### Exit Animation (200ms)

```css
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.banner-exiting {
  animation: fadeOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}
```

**Properties:**
- Duration: 200ms (faster exit)
- Easing: ease-in for exit
- Movement: None (simple fade)
- Opacity: 1 → 0

---

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .banner-entering,
  .banner-exiting {
    animation: none !important;
  }
}
```

**Always respect user preferences for reduced motion.**

---

## Priority System

### Problem Statement

Multiple banners stacking creates:
- Visual clutter (~200px vertical space)
- Reduced impact (messages compete for attention)
- User confusion (unclear what to address first)
- Mobile constraints (limited visible content)

### Solution: Show Only Most Critical

**Priority Hierarchy:**
1. **Error Banners** (Priority 1) - Blocking issues
   - API errors (rate limit, auth failures)
   - Network errors
   - Upload failures

2. **Warning Banners** (Priority 2) - Non-blocking cautions
   - Usage warnings (80-99% quota)
   - Deprecation notices

3. **Info Banners** (Priority 3) - Educational/promotional
   - Feature announcements
   - Upgrade prompts
   - Tips and hints

**Implementation:**
```jsx
{error ? (
  <ErrorBanner error={error} onDismiss={() => setError(null)} />
) : warning ? (
  <WarningBanner warning={warning} onDismiss={() => setWarning(null)} />
) : info ? (
  <InfoBanner info={info} onDismiss={() => setInfo(null)} />
) : null}
```

**Benefits:**
- Single banner (~80px) vs stacked banners (~200px+)
- Clear priority signals
- Better mobile experience
- Professional appearance

---

## Accessibility

### ARIA Attributes

```jsx
<div
  role="alert"              // Error/Warning banners
  role="status"             // Info banners
  aria-live="assertive"     // Error/Warning (announce immediately)
  aria-live="polite"        // Info (announce at next opportunity)
  aria-atomic="true"        // Read entire message as one unit
>
  <Icon aria-hidden="true" />
  <h3>Heading</h3>
  <p>{message}</p>
  <button aria-label="Dismiss notification">
    <X aria-hidden="true" />
  </button>
</div>
```

### Keyboard Navigation

- ✅ Dismiss button keyboard accessible (focusable)
- ✅ Focus ring visible (not just on hover)
- ✅ Enter/Space trigger dismiss
- ✅ Banner doesn't trap focus

### Color Contrast

All text meets WCAG AA standards:
- **Light mode:** Dark text on light backgrounds (4.5:1 ratio)
- **Dark mode:** Light text on dark backgrounds (4.5:1 ratio)

### Focus Management

Banners should NOT auto-focus. Users should be able to continue their task without interruption.

---

## Implementation Examples

### Info Banner with CTA (GitHubLoadModal Pattern)

```jsx
{!user?.has_github_private_access && showBanner && (
  <div className="mx-4 mt-3">
    <div className="relative p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
      {/* Dismiss X */}
      <button
        type="button"
        onClick={() => setShowBanner(false)}
        className="absolute top-3 right-3 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 rounded-md p-1 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-4 pr-8">
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            {/* GitHub icon path */}
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
            Public repositories only
          </h3>
          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            Connect your GitHub account to access private repositories.
          </p>
        </div>

        {/* CTA - Desktop */}
        <div className="flex-shrink-0 hidden sm:block self-end">
          <a
            href="/api/auth/github"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              {/* GitHub icon */}
            </svg>
            Connect GitHub
          </a>
        </div>
      </div>

      {/* CTA - Mobile */}
      <div className="sm:hidden mt-3 pl-9">
        <a
          href="/api/auth/github"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            {/* GitHub icon */}
          </svg>
          Connect GitHub
        </a>
      </div>
    </div>
  </div>
)}
```

---

### Error Banner (Simple)

```jsx
<div
  className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 border-l-4 border-l-red-500 dark:border-l-red-400 rounded-lg shadow-sm"
  role="alert"
  aria-live="assertive"
>
  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
  <div className="flex-1 min-w-0">
    <h3 className="text-sm font-semibold text-red-900 dark:text-white mb-1">
      Connection Error
    </h3>
    <p className="text-sm text-red-700 dark:text-red-200 leading-relaxed">
      Unable to connect to the server. Please check your internet connection.
    </p>
  </div>
  <button
    onClick={onDismiss}
    className="flex-shrink-0 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 rounded-md p-1 transition-colors"
    aria-label="Dismiss error"
  >
    <X className="h-4 w-4" />
  </button>
</div>
```

---

### Warning Banner (Simple)

```jsx
<div
  className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 border-l-yellow-500 dark:border-l-yellow-400 rounded-lg shadow-sm"
  role="alert"
  aria-live="polite"
>
  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
  <div className="flex-1 min-w-0">
    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
      Approaching Usage Limit
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
      You've used 80% of your monthly quota. Consider upgrading to continue.
    </p>
  </div>
  <button
    onClick={onDismiss}
    className="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-md p-1 transition-colors"
    aria-label="Dismiss warning"
  >
    <X className="h-4 w-4" />
  </button>
</div>
```

---

## Related Documentation

- [ERROR-HANDLING-UX.md](./ERROR-HANDLING-UX.md) - When to use banners vs other error display methods
- [MODAL_DESIGN_STANDARDS.md](../design/MODAL_DESIGN_STANDARDS.md) - Modal design patterns
- [TOAST-SYSTEM.md](./TOAST-SYSTEM.md) - Toast notification patterns
- [COLOR-REFERENCE.md](../design/theming/COLOR-REFERENCE.md) - Color system

---

## Version History

- **v1.0** (January 26, 2026) - Initial banner pattern documentation
  - Defined 4 banner types (info, error, warning, success)
  - Documented visual design system with consistent left accent borders
  - Added layout patterns (simple, CTA button, action button)
  - Specified animation timing (250ms enter, 200ms exit)
  - Documented priority system for banner display
  - Added accessibility requirements
  - Included implementation examples from GitHubLoadModal

---

**Maintained by:** CodeScribe AI Design Team
**Questions?** Refer to related documentation or contact UX lead
