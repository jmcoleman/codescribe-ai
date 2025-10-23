# Dark Mode Implementation Specification

**Phase:** 2.5 (v2.1.0)
**Duration:** 1.5-2 days
**Approach:** Kevin Powell's CSS Variable + `data-theme` Pattern
**Created:** October 23, 2025

---

## 📋 Overview

Implement a modern, accessible dark mode theming system using:
- CSS custom properties (variables) with semantic naming
- `data-theme` attribute on `<html>` element
- Tailwind CSS dark mode with `darkMode: 'selector'`
- React Context for theme state management
- localStorage for persistence
- System preference detection (`prefers-color-scheme`)

---

## 🎯 Goals

1. **User Experience:** Smooth, flicker-free theme toggling
2. **Developer Experience:** Maintainable, semantic color system
3. **Accessibility:** WCAG AAA compliance (7:1 text, 3:1 UI)
4. **Performance:** Minimal re-renders, instant theme switching
5. **Future-proof:** Easy to add new themes (e.g., high contrast, custom)

---

## 🏗️ Architecture

### File Structure

```
client/src/
├── contexts/
│   └── ThemeContext.jsx          # NEW: Theme state + localStorage
├── hooks/
│   └── useTheme.js                # NEW: Hook to consume theme context
├── components/
│   ├── ThemeToggle.jsx            # NEW: Sun/moon button component
│   └── [existing components]     # UPDATE: Add dark: variants
├── styles/
│   └── theme-variables.css        # NEW: CSS custom properties
├── index.css                      # UPDATE: Import theme-variables.css
└── App.jsx                        # UPDATE: Wrap with ThemeProvider
```

---

## 🎨 Color System Design

### Current Color Usage (Light Mode)

| Semantic Role | Current Value | Usage |
|---------------|---------------|-------|
| Primary Background | `#ffffff` (white) | App bg, panels, modals |
| Secondary Background | `#f8fafc` (slate-50) | Panel headers, footers |
| Tertiary Background | `#f1f5f9` (slate-100) | Hover states |
| Primary Text | `#0f172a` (slate-900) | Headings, body text |
| Secondary Text | `#475569` (slate-600) | Muted text, labels |
| Borders | `#e2e8f0` (slate-200) | Panel borders, dividers |
| Brand Primary | `#a855f7` (purple-500) | Buttons, links, accents |
| Brand Secondary | `#6366f1` (indigo-500) | Secondary buttons |
| Success | `#16a34a` (green-600) | Success states |
| Warning | `#ca8a04` (yellow-600) | Warning states |
| Error | `#dc2626` (red-600) | Error states |

### Dark Mode Color Mapping

| Semantic Role | Dark Mode Value | WCAG AA Ratio |
|---------------|-----------------|---------------|
| Primary Background | `#0f172a` (slate-900) | - |
| Secondary Background | `#1e293b` (slate-800) | - |
| Tertiary Background | `#334155` (slate-700) | - |
| Primary Text | `#f8fafc` (slate-50) | 15.8:1 ✅ AAA |
| Secondary Text | `#cbd5e1` (slate-300) | 9.2:1 ✅ AAA |
| Borders | `#334155` (slate-700) | 3.2:1 ✅ AA |
| Brand Primary | `#a855f7` (purple-500) | 4.8:1 ✅ AA |
| Brand Secondary | `#818cf8` (indigo-400) | 5.1:1 ✅ AA |
| Success | `#22c55e` (green-500) | 5.2:1 ✅ AA |
| Warning | `#eab308` (yellow-500) | 8.1:1 ✅ AAA |
| Error | `#f87171` (red-400) | 4.9:1 ✅ AA |

---

## 📝 Implementation Steps

### Step 1: Tailwind Configuration (30 min)

**File:** `client/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector', // Enable dark mode with selector strategy
  theme: {
    extend: {
      colors: {
        // Existing colors remain unchanged
        // Dark mode handled via dark: variants
      },
    },
  },
  plugins: [],
}
```

**Why `darkMode: 'selector'`?**
- Allows custom selector (we'll use `[data-theme="dark"]`)
- More flexible than `darkMode: 'class'`
- Works with our `data-theme` attribute approach

---

### Step 2: CSS Custom Properties (1 hour)

**File:** `client/src/styles/theme-variables.css` (NEW)

```css
/* ============================================
   THEME VARIABLES - Kevin Powell's Approach
   ============================================
   Semantic naming (purpose-based, not color-based)
   ============================================ */

:root {
  /* Backgrounds */
  --color-bg-primary: 255 255 255;        /* white */
  --color-bg-secondary: 248 250 252;      /* slate-50 */
  --color-bg-tertiary: 241 245 249;       /* slate-100 */
  --color-bg-elevated: 255 255 255;       /* white (modals, dropdowns) */

  /* Text */
  --color-text-primary: 15 23 42;         /* slate-900 */
  --color-text-secondary: 71 85 105;      /* slate-600 */
  --color-text-tertiary: 100 116 139;     /* slate-500 */
  --color-text-inverted: 255 255 255;     /* white (on dark bg) */

  /* Borders */
  --color-border-primary: 226 232 240;    /* slate-200 */
  --color-border-secondary: 203 213 225;  /* slate-300 */
  --color-border-focus: 168 85 247;       /* purple-500 */

  /* Brand */
  --color-brand-primary: 168 85 247;      /* purple-500 */
  --color-brand-secondary: 99 102 241;    /* indigo-500 */
  --color-brand-hover: 147 51 234;        /* purple-600 */

  /* Semantic */
  --color-success: 22 163 74;             /* green-600 */
  --color-warning: 202 138 4;             /* yellow-600 */
  --color-error: 220 38 38;               /* red-600 */
  --color-info: 59 130 246;               /* blue-500 */

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

[data-theme="dark"] {
  /* Backgrounds */
  --color-bg-primary: 15 23 42;           /* slate-900 */
  --color-bg-secondary: 30 41 59;         /* slate-800 */
  --color-bg-tertiary: 51 65 85;          /* slate-700 */
  --color-bg-elevated: 30 41 59;          /* slate-800 (modals, dropdowns) */

  /* Text */
  --color-text-primary: 248 250 252;      /* slate-50 */
  --color-text-secondary: 203 213 225;    /* slate-300 */
  --color-text-tertiary: 148 163 184;     /* slate-400 */
  --color-text-inverted: 15 23 42;        /* slate-900 (on light bg) */

  /* Borders */
  --color-border-primary: 51 65 85;       /* slate-700 */
  --color-border-secondary: 71 85 105;    /* slate-600 */
  --color-border-focus: 168 85 247;       /* purple-500 */

  /* Brand (mostly stay same, just ensure contrast) */
  --color-brand-primary: 168 85 247;      /* purple-500 */
  --color-brand-secondary: 129 140 248;   /* indigo-400 (lighter for contrast) */
  --color-brand-hover: 192 132 252;       /* purple-400 (lighter hover) */

  /* Semantic */
  --color-success: 34 197 94;             /* green-500 (lighter) */
  --color-warning: 234 179 8;             /* yellow-500 (lighter) */
  --color-error: 248 113 113;             /* red-400 (lighter) */
  --color-info: 96 165 250;               /* blue-400 (lighter) */

  /* Shadows (darker for dark mode) */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.5);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.5);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}

/* Smooth transitions for theme changes */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Disable transitions for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0ms !important;
  }
}
```

**Import in `client/src/index.css`:**

```css
@import './styles/theme-variables.css';

/* Rest of existing styles */
```

---

### Step 3: Theme Context (2 hours)

**File:** `client/src/contexts/ThemeContext.jsx` (NEW)

```javascript
import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Priority: localStorage > system preference > default (light)

    // 1. Check localStorage
    const savedTheme = localStorage.getItem('codescribe-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // 2. Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // 3. Default to light
    return 'light';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);

    // Persist to localStorage
    localStorage.setItem('codescribe-theme', theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('codescribe-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**File:** `client/src/hooks/useTheme.js` (NEW)

```javascript
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
```

---

### Step 4: Theme Toggle Component (2 hours)

**File:** `client/src/components/ThemeToggle.jsx` (NEW)

```javascript
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="
        relative p-2 rounded-lg
        bg-slate-100 dark:bg-slate-800
        hover:bg-slate-200 dark:hover:bg-slate-700
        border border-slate-200 dark:border-slate-700
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        dark:focus:ring-offset-slate-900
      "
      type="button"
    >
      {/* Sun icon (visible in dark mode) */}
      <Sun
        className={`
          w-5 h-5 text-yellow-500
          transition-all duration-300
          ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}
          absolute inset-0 m-auto
        `}
        aria-hidden="true"
      />

      {/* Moon icon (visible in light mode) */}
      <Moon
        className={`
          w-5 h-5 text-slate-700 dark:text-slate-300
          transition-all duration-300
          ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
        `}
        aria-hidden="true"
      />
    </button>
  );
}
```

**Integration:** Add to `Header.jsx` next to existing buttons

```jsx
import { ThemeToggle } from './ThemeToggle';

// In Header component, add after other buttons:
<ThemeToggle />
```

---

### Step 5: Update App.jsx (30 min)

**File:** `client/src/App.jsx`

```javascript
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  // ... existing code

  return (
    <ThemeProvider>
      {/* Existing app structure */}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        {/* Rest of app */}
      </div>
    </ThemeProvider>
  );
}
```

---

### Step 6: Update Components with dark: Variants (3-4 hours)

**Priority Components to Update:**

1. **Header** - Add `dark:bg-slate-800`, `dark:border-slate-700`
2. **CodePanel** - Add `dark:bg-slate-800`, `dark:border-slate-700`
3. **DocPanel** - Add `dark:bg-slate-800`, `dark:border-slate-700`
4. **ControlBar** - Add `dark:bg-slate-800`, `dark:border-slate-700`
5. **Modals** (Help, Examples, Quality Score, Confirmation) - Add dark variants
6. **Buttons** - Update variants to support dark mode
7. **ErrorBanner** - Add dark mode colors
8. **Toasts** - Update toast styles for dark mode

**Example Pattern:**

```jsx
// Before
<div className="bg-white border border-slate-200 text-slate-900">

// After
<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50">
```

---

### Step 7: Monaco Editor Theme (30 min)

**File:** `client/src/components/CodePanel.jsx`

```jsx
import { useTheme } from '../hooks/useTheme';

export function CodePanel({ code, onChange, ... }) {
  const { theme } = useTheme();

  return (
    // ... existing code
    <LazyMonacoEditor
      // ... existing props
      theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
    />
  );
}
```

---

### Step 8: Mermaid Theme (30 min)

**File:** `client/src/components/MermaidDiagram.jsx`

Update the existing theme configuration to support dark mode:

```javascript
import { useTheme } from '../hooks/useTheme';

export function MermaidDiagram({ chart }) {
  const { theme } = useTheme();

  const darkThemeConfig = {
    theme: 'dark',
    themeVariables: {
      primaryColor: '#a855f7',        // purple-500
      primaryTextColor: '#f8fafc',    // slate-50
      primaryBorderColor: '#6366f1',  // indigo-500
      lineColor: '#cbd5e1',           // slate-300
      secondaryColor: '#1e293b',      // slate-800
      tertiaryColor: '#334155',       // slate-700
      background: '#0f172a',          // slate-900
      mainBkg: '#1e293b',            // slate-800
      secondBkg: '#334155',          // slate-700
    }
  };

  const lightThemeConfig = {
    // Existing config
  };

  const config = theme === 'dark' ? darkThemeConfig : lightThemeConfig;

  // ... rest of component
}
```

---

### Step 9: Testing (3 hours)

#### Unit Tests

Update component tests to test both themes:

```javascript
// Example: Header.test.jsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Header } from './Header';

describe('Header - Dark Mode', () => {
  it('renders correctly in light mode', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Add assertions
  });

  it('renders correctly in dark mode', () => {
    // Mock localStorage
    localStorage.setItem('codescribe-theme', 'dark');

    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Verify data-theme attribute
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles theme when button clicked', () => {
    // Test theme toggle functionality
  });
});
```

#### E2E Tests

**File:** `client/e2e/dark-mode.spec.js` (NEW)

```javascript
import { test, expect } from '@playwright/test';

test.describe('Dark Mode', () => {
  test('should toggle between light and dark modes', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify initial state (light mode)
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');

    // Click theme toggle button
    await page.click('button[aria-label*="dark mode"]');

    // Verify dark mode activated
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Verify localStorage
    const theme = await page.evaluate(() => localStorage.getItem('codescribe-theme'));
    expect(theme).toBe('dark');

    // Click again to toggle back
    await page.click('button[aria-label*="light mode"]');
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
  });

  test('should persist theme across page reloads', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Set dark mode
    await page.click('button[aria-label*="dark mode"]');
    await page.waitForTimeout(500); // Wait for localStorage write

    // Reload page
    await page.reload();

    // Verify dark mode persisted
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
  });

  test('should respect system preference on first visit', async ({ page, context }) => {
    // Set system to dark mode
    await context.emulateMedia({ colorScheme: 'dark' });

    await page.goto('http://localhost:5173');

    // Verify dark mode activated
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
  });

  test('Monaco Editor should switch themes', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Toggle to dark mode
    await page.click('button[aria-label*="dark mode"]');

    // Wait for Monaco to re-render
    await page.waitForTimeout(1000);

    // Verify Monaco has dark theme (check for dark background)
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    // Monaco dark theme has specific class
    await expect(editor).toHaveClass(/vs-dark/);
  });
});
```

---

## ✅ Success Criteria Checklist

### Functionality
- [ ] Theme toggle button renders in Header
- [ ] Clicking toggle switches between light/dark modes
- [ ] Theme preference persists after page reload
- [ ] System preference (`prefers-color-scheme`) is respected on first visit
- [ ] Manual theme selection overrides system preference
- [ ] No flash of unstyled content (FOUC) on page load

### Visual
- [ ] All components render correctly in both modes
- [ ] Monaco Editor switches between `vs-light` and `vs-dark`
- [ ] Mermaid diagrams use appropriate theme colors
- [ ] Smooth transitions between themes (200ms)
- [ ] No layout shift during theme toggle
- [ ] Focus indicators visible in both modes

### Accessibility
- [ ] Theme toggle has `aria-label`
- [ ] Theme toggle keyboard accessible (Enter/Space)
- [ ] WCAG AAA contrast ratios achieved (7:1 text minimum)
- [ ] `prefers-reduced-motion` users see instant change (no animations)
- [ ] Screen reader announces theme change

### Performance
- [ ] Theme toggle is instant (<50ms)
- [ ] No unnecessary re-renders
- [ ] localStorage writes don't block UI

### Testing
- [ ] All 513+ frontend tests pass for both themes
- [ ] E2E tests verify theme toggle
- [ ] E2E tests verify persistence
- [ ] E2E tests verify system preference
- [ ] Visual regression tests pass

### Documentation
- [ ] Update README with dark mode feature
- [ ] Add dark mode screenshots
- [ ] Document for future developers

---

## 🎨 Design Tokens Reference

### Light Mode
```css
Background: #ffffff, #f8fafc, #f1f5f9
Text: #0f172a, #475569, #64748b
Borders: #e2e8f0, #cbd5e1
Brand: #a855f7, #6366f1
```

### Dark Mode
```css
Background: #0f172a, #1e293b, #334155
Text: #f8fafc, #cbd5e1, #94a3b8
Borders: #334155, #475569
Brand: #a855f7, #818cf8 (lighter for contrast)
```

---

## 🚀 Deployment Notes

1. **Vercel Environment:** No changes needed (client-side only)
2. **Bundle Size Impact:** +2KB (ThemeContext + ThemeToggle)
3. **Performance Impact:** Negligible (CSS variables are native)
4. **Breaking Changes:** None (purely additive)

---

## 📚 References

- **Kevin Powell's CSS Variable Theming:** [Community Discussions](https://www.answeroverflow.com/m/1300509348581085215)
- **Tailwind Dark Mode Docs:** https://tailwindcss.com/docs/dark-mode
- **MDN CSS Custom Properties:** https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- **MDN prefers-color-scheme:** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- **WCAG Contrast Checker:** https://webaim.org/resources/contrastchecker/

---

**Document Version:** 1.0
**Created:** October 23, 2025
**Author:** CodeScribe AI Team
**Status:** Ready for Implementation
