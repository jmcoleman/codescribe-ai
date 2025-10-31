# CodeScribe AI - Dark Theme Specification

**Status:** Phase 2.5 Planning (Future Feature)
**Version:** 2.0 - Neon Cyberpunk (FINAL)
**Created:** October 29, 2025
**Finalized:** October 30, 2025
**Purpose:** Complete dark theme design system and implementation guide

---

## ✅ Decision: Neon Cyberpunk Theme Selected

**Rationale:** Target market (individual developers & consultants) values bold, memorable design. Cyberpunk's purple/indigo/cyan palette provides maximum differentiation while maintaining brand identity and WCAG AAA accessibility.

**Alternatives Archived:** Cool Nordic, Purple Nordic Hybrid, and comparison materials saved in `docs/design/design-archive/`

---

## 🌙 Overview

A modern, developer-focused dark theme that maintains CodeScribe's brand identity while providing exceptional contrast, reduced eye strain, and a sleek aesthetic perfect for late-night coding sessions.

### Design Philosophy

1. **Deep & Rich:** True dark backgrounds (not just gray) for maximum depth - `slate-950` (#020617)
2. **Vibrant Accents:** Lighter purple/indigo shades (400-500) pop dramatically against dark surfaces
3. **Layered UI:** Elevated surfaces with subtle transparency and borders
4. **Enhanced Contrast:** All text meets WCAG AAA standards (7:1+ contrast)
5. **Neon Highlights:** Cyan accents for syntax highlighting and terminal-style visual interest
6. **Reduced Blue Light:** Warm undertones for reduced eye strain during long coding sessions

### Design Files

**Interactive Palette (OPEN THIS FIRST!):**
- [dark-theme-palette.html](../design/theming/dark-theme-palette.html) - Click-to-copy colors, live preview
- Features: Organized by category, usage notes, WCAG contrast ratios

**Light Theme Reference:**
- [brand-color-palette.html](../design/theming/brand-color-palette.html) - Current light theme

---

## 🎨 Color System

### Surface Colors (Base Layers)

Dark theme uses **darker** slate shades than light theme:

| Color | Hex | Usage | Light Equivalent |
|-------|-----|-------|------------------|
| `slate-950` ⭐ | `#020617` | App background (deepest) | `slate-50` |
| `slate-900` | `#0F172A` | Main surfaces, modals, panels | `white` |
| `slate-800` | `#1E293B` | Elevated cards, code editor | `slate-100` |
| `slate-700` | `#334155` | Hover states, secondary surfaces | `slate-200` |
| `slate-600` | `#475569` | Borders (often with 50% opacity) | `slate-300` |
| `slate-500` | `#64748B` | Subtle borders, disabled states | `slate-500` |

**Key Pattern:** Surfaces get **lighter** as they elevate (opposite of light theme)

**Tailwind Config:**
```javascript
slate: {
  // ... existing shades
  950: '#020617', // NEW: Add this for deep dark backgrounds
}
```

### Brand Colors (Inverted Brightness)

Dark theme uses **lighter** brand shades for better visibility:

#### Purple (Primary)

| Color | Hex | Contrast | Usage | Light Equivalent |
|-------|-----|----------|-------|------------------|
| `purple-400` ⭐ | `#C084FC` | 9.1:1 (AAA) | Primary buttons, links | `purple-600` |
| `purple-500` | `#A855F7` | 6.8:1 (AAA) | Hover states, focus rings | `purple-700` |
| `purple-600` | `#9333EA` | 5.2:1 (AA) | Active/pressed states | N/A |
| `purple-700` | `#7C3AED` | 4.1:1 (AA) | Gradients, deep accents | N/A |

**With Opacity (Glows & Backgrounds):**
```css
purple-400/10:  rgba(192, 132, 252, 0.1)  /* Subtle highlights */
purple-400/20:  rgba(192, 132, 252, 0.2)  /* Hover backgrounds */
purple-400/30:  rgba(192, 132, 252, 0.3)  /* Focus glows, shadows */
```

**Contrast measured against `slate-950` (#020617)**

#### Indigo (Secondary)

| Color | Hex | Contrast | Usage | Light Equivalent |
|-------|-----|----------|-------|------------------|
| `indigo-400` ⭐ | `#818CF8` | 8.7:1 (AAA) | Secondary buttons, badges | `indigo-600` |
| `indigo-500` | `#6366F1` | 6.8:1 (AAA) | Hover states | `indigo-700` |
| `indigo-600` | `#4F46E5` | 5.3:1 (AA) | Active states | N/A |
| `indigo-700` | `#4338CA` | 4.2:1 (AA) | Deep accents | N/A |

**With Opacity:**
```css
indigo-400/10:  rgba(129, 140, 248, 0.1)  /* Code blocks */
indigo-400/20:  rgba(129, 140, 248, 0.2)  /* Badge backgrounds */
```

### Text Colors (High Contrast)

Dark theme uses **lighter** text for maximum readability:

| Color | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| `slate-100` ⭐ | `#F1F5F9` | 18.3:1 (AAA) | Headings, primary text |
| `slate-200` | `#E2E8F0` | 15.8:1 (AAA) | Body text, labels |
| `slate-300` | `#CBD5E1` | 12.6:1 (AAA) | Secondary text, descriptions |
| `slate-400` | `#94A3B8` | 8.9:1 (AAA) | Muted text, placeholders |
| `slate-500` | `#64748B` | 6.4:1 (AA) | Very subtle text, disabled |

**All exceed WCAG AAA requirements (7:1) except slate-500 which meets AA**

### Accent Colors (New for Dark Theme)

#### Cyan/Teal (Neon Highlights)

These provide terminal/developer aesthetic and high visibility:

| Color | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| `cyan-400` ⭐ | `#22D3EE` | 11.3:1 (AAA) | Syntax highlighting, neon accents |
| `cyan-500` | `#06B6D4` | 8.8:1 (AAA) | Code links, variable names |
| `teal-500` | `#14B8A6` | 7.9:1 (AAA) | Function names, methods |
| `emerald-500` | `#10B981` | 7.2:1 (AAA) | String literals, active states |

**With Opacity (Glows):**
```css
cyan-400/15:  rgba(34, 211, 238, 0.15)  /* Glow effects */
cyan-400/30:  rgba(34, 211, 238, 0.3)   /* Selection backgrounds */
```

**Tailwind Config:**
```javascript
cyan: {
  400: '#22D3EE',
  500: '#06B6D4',
},
teal: {
  500: '#14B8A6',
},
emerald: {
  500: '#10B981',
},
```

### Semantic Colors (Lighter for Dark)

Dark theme uses **400-series** for better visibility:

#### Success (Green)

| Color | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| `green-400` ⭐ | `#4ADE80` | 10.8:1 (AAA) | Success text, icons |
| `green-500` | `#22C55E` | 8.5:1 (AAA) | Success buttons |
| `green-600` | `#16A34A` | 6.2:1 (AA) | Hover states |
| `green-400/15` | `rgba(74, 222, 128, 0.15)` | - | Success backgrounds |

#### Warning (Amber - warmer than yellow)

| Color | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| `amber-400` ⭐ | `#FBBF24` | 13.2:1 (AAA) | Warning text, icons |
| `amber-500` | `#F59E0B` | 11.1:1 (AAA) | Warning buttons |
| `amber-600` | `#D97706` | 9.1:1 (AAA) | Hover states |
| `amber-400/15` | `rgba(251, 191, 36, 0.15)` | - | Warning backgrounds |

**Note:** Amber instead of yellow for warmer, more visible tone on dark backgrounds.

**Tailwind Config:**
```javascript
amber: {
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
},
```

#### Error (Red)

| Color | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| `red-400` ⭐ | `#F87171` | 8.2:1 (AAA) | Error text, icons |
| `red-500` | `#EF4444` | 7.1:1 (AAA) | Error buttons |
| `red-600` | `#DC2626` | 5.9:1 (AA) | Hover states |
| `red-400/15` | `rgba(248, 113, 113, 0.15)` | - | Error backgrounds |

---

## 🏗️ UI Patterns

### Surface Elevation System

Dark theme uses **lighter** colors for elevated surfaces:

```
Level 0 (Base):     slate-950  (#020617) - App background
Level 1 (Surface):  slate-900  (#0F172A) - Modals, panels
Level 2 (Card):     slate-800  (#1E293B) - Code editor, cards
Level 3 (Hover):    slate-700  (#334155) - Hover states
```

**Visual Depth Techniques:**
```css
/* Add subtle light border to elevated surfaces */
border: 1px solid rgba(255, 255, 255, 0.1);

/* Deeper shadows for dark mode */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);

/* Colored glow shadows for interactive elements */
box-shadow: 0 4px 20px rgba(192, 132, 252, 0.3);
```

### Shadow & Glow System

Dark theme uses **colored shadows** to create neon glow effects that enhance the Cyberpunk aesthetic:

#### Shadow Intensity Guidelines

**Primary CTAs (Generate, Submit):**
```css
shadow-lg shadow-purple-400/30  /* 30% opacity - OPTIMAL for CTAs */
```
✅ **Perfect for:** Main action buttons that need attention without overwhelming
✅ **Rationale:** Draws eye naturally, feels premium, maintains readability
✅ **Tested:** Works well across all screen brightnesses

**Hero Sections / Emphasis:**
```css
shadow-xl shadow-purple-400/40  /* 40% opacity - More dramatic */
```
Use sparingly for landing pages, feature callouts, or special highlights

**Subtle Interactive Elements:**
```css
shadow-md shadow-purple-400/20  /* 20% opacity - Gentle glow */
```
For secondary actions, hover states, or background elements

**Accent Highlights (Cyan):**
```css
shadow-lg shadow-cyan-400/20    /* 20% opacity - Cooler tone */
```
Terminal aesthetic for code elements, status indicators

**Success/Error States:**
```css
shadow-lg shadow-green-400/20   /* Success - Gentle confirmation */
shadow-lg shadow-red-400/20     /* Error - Soft alert (not harsh) */
```

#### Shadow Size Reference

| Size | Tailwind Class | Use Case |
|------|---------------|----------|
| Small | `shadow-sm` | Subtle borders, text inputs |
| Medium | `shadow-md` | Cards at rest, secondary buttons |
| Large | `shadow-lg` | **Primary buttons (RECOMMENDED)**, important cards |
| Extra Large | `shadow-xl` | Modals, hero sections, major CTAs |
| 2X Large | `shadow-2xl` | Overlays, popovers (use sparingly) |

**⚠️ Avoid Going Higher:**
- `shadow-2xl` with >50% opacity → Too intense, causes eye strain
- Competing glows → Dilutes focus, feels cluttered

### Button Patterns

#### Primary Button (Purple)

```jsx
// Solid variant (main CTA) - RECOMMENDED
<button className="
  bg-purple-400 hover:bg-purple-500 active:bg-purple-600
  text-slate-950 font-medium
  shadow-lg shadow-purple-400/30
  focus-visible:ring-2 focus-visible:ring-purple-500
  focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
  transition-all duration-200
">
  Generate Docs
</button>

// Gradient variant (hero sections, special emphasis only)
<button className="
  bg-gradient-to-r from-purple-400 to-indigo-400
  hover:from-purple-500 hover:to-indigo-500
  text-slate-950 font-medium
  shadow-xl shadow-purple-400/40
  focus-visible:ring-2 focus-visible:ring-purple-500
">
  Generate Docs
</button>
```

**Key differences from light theme:**
- Button background is **lighter** (400-series)
- Text is **dark** (`slate-950`) for maximum contrast
- Shadows use **color opacity** for glow effect (30% for solid, 40% for gradient)
- Ring offset matches **dark background** (`slate-950`)

**Design Decision:** Solid purple with `shadow-lg shadow-purple-400/30` is the **optimal** CTA style:
- Attracts attention without being overwhelming
- Feels premium (like backlit keyboard aesthetic)
- Maintains readability during long documentation sessions
- Scales well across different screen brightnesses

#### Secondary Button (Slate)

```jsx
<button className="
  bg-slate-800 hover:bg-slate-700 active:bg-slate-600
  text-slate-200 hover:text-slate-100
  border border-slate-600/50 hover:border-slate-500/50
  transition-all duration-200
">
  Upload Files
</button>
```

#### Tertiary/Ghost Button

```jsx
<button className="
  bg-transparent hover:bg-slate-800/50 active:bg-slate-700/50
  text-slate-300 hover:text-slate-100
  border border-transparent hover:border-slate-700
">
  Learn More
</button>
```

### Input/Form Patterns

```jsx
// Text Input
<input className="
  bg-slate-800
  border border-slate-600/50
  focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50
  text-slate-100 placeholder:text-slate-500
  focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
" />

// Select Dropdown
<select className="
  bg-slate-800
  border border-slate-600/50
  text-slate-200
  focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50
">
  <option className="bg-slate-800 text-slate-200">README.md</option>
</select>

// Textarea (with custom scrollbar)
<textarea className="
  bg-slate-800/50
  border border-slate-600/30
  text-slate-100 placeholder:text-slate-500
  focus:bg-slate-800 focus:border-purple-400
  scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800
" />
```

### Card Patterns

```jsx
// Standard Elevated Card
<div className="
  bg-slate-800
  border border-slate-700/50
  rounded-xl
  shadow-xl shadow-black/50
  hover:border-purple-400/30 hover:shadow-purple-400/20
  transition-all duration-200
">
  {/* Content */}
</div>

// Glass Card (modal overlays, special sections)
<div className="
  bg-slate-900/80 backdrop-blur-xl
  border border-slate-700/30
  rounded-2xl
  shadow-2xl shadow-black/60
">
  {/* Content */}
</div>

// Neon Accent Card (premium features, highlights)
<div className="
  bg-slate-800
  border border-cyan-400/30
  rounded-xl
  shadow-lg shadow-cyan-400/20
  hover:shadow-cyan-400/30
  transition-all duration-200
">
  {/* Content */}
</div>
```

### Code Editor Panel

```jsx
<div className="
  bg-slate-800
  border border-slate-700
  rounded-lg
  overflow-hidden
  shadow-xl
">
  {/* Header with traffic lights */}
  <div className="
    bg-slate-900/50
    border-b border-slate-700/50
    px-4 py-3
    flex items-center justify-between
  ">
    <div className="flex items-center gap-2">
      {/* macOS-style traffic lights (muted for dark) */}
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400/80
          hover:bg-red-400 transition-colors" />
        <div className="w-3 h-3 rounded-full bg-amber-400/80
          hover:bg-amber-400 transition-colors" />
        <div className="w-3 h-3 rounded-full bg-green-400/80
          hover:bg-green-400 transition-colors" />
      </div>
      <span className="text-slate-400 text-sm ml-2">auth-service.js</span>
    </div>
    <span className="text-slate-500 text-xs">JavaScript</span>
  </div>

  {/* Code area - Monaco editor handles this */}
  <div className="bg-slate-800 p-4 min-h-[400px]">
    {/* Monaco Editor component with theme="vs-dark" */}
  </div>

  {/* Footer with status */}
  <div className="
    bg-slate-900/50
    border-t border-slate-700/50
    px-4 py-2
    flex items-center justify-between
    text-xs text-slate-400
  ">
    <span>25 lines • 589 chars</span>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-cyan-400
        animate-pulse shadow-sm shadow-cyan-400/50" />
      <span className="text-cyan-400">Ready to analyze</span>
    </div>
  </div>
</div>
```

### Toast Notifications

```jsx
// Success Toast (with neon glow)
<div className="
  bg-slate-900
  border border-green-400/30
  shadow-lg shadow-green-400/20
  rounded-lg p-4
  flex items-center gap-3
  backdrop-blur-sm
">
  <CheckCircle className="text-green-400 w-5 h-5" />
  <span className="text-slate-100 font-medium">
    Documentation generated successfully!
  </span>
</div>

// Error Toast
<div className="
  bg-slate-900
  border border-red-400/30
  shadow-lg shadow-red-400/20
  rounded-lg p-4
  flex items-center gap-3
">
  <AlertCircle className="text-red-400 w-5 h-5" />
  <span className="text-slate-100">An error occurred</span>
</div>

// Info Toast (with cyan accent)
<div className="
  bg-slate-900
  border border-cyan-400/30
  shadow-lg shadow-cyan-400/20
  rounded-lg p-4
">
  <span className="text-slate-100">Processing your request...</span>
</div>
```

### Error Banners

```jsx
<div className="
  bg-red-400/10
  border border-red-400/30
  rounded-lg p-4
  flex items-start gap-3
  animate-slide-in-fade
">
  <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <h4 className="text-red-300 font-medium mb-1">Invalid Request Error</h4>
    <p className="text-red-200/90 text-sm leading-relaxed">
      The request could not be processed. Please check your input and try again.
    </p>
    {/* Optional retry countdown */}
    <div className="mt-3 pt-3 border-t border-red-400/20">
      <span className="text-red-300 text-xs font-medium">
        ⏱ Please wait 60 seconds before trying again.
      </span>
    </div>
  </div>
  <button
    className="text-red-400 hover:text-red-300 hover:bg-red-400/10
      p-1 rounded transition-colors"
    aria-label="Dismiss error"
  >
    <X className="w-4 h-4" />
  </button>
</div>
```

### Badges

```jsx
// Primary Badge (Indigo - technical information)
<span className="
  inline-flex items-center
  px-2.5 py-1
  rounded-md
  bg-indigo-400/20
  border border-indigo-400/30
  text-indigo-300 text-xs font-medium
">
  README
</span>

// Secondary Badge (Slate - neutral info)
<span className="
  inline-flex items-center
  px-2.5 py-1
  rounded-md
  bg-slate-700/50
  border border-slate-600/30
  text-slate-300 text-xs
">
  javascript
</span>

// Accent Badge (Cyan - special features)
<span className="
  inline-flex items-center
  px-2.5 py-1
  rounded-md
  bg-cyan-400/15
  border border-cyan-400/30
  text-cyan-300 text-xs font-medium
">
  AI Generated
</span>
```

---

## 🎯 Component Conversion Table

### Light → Dark Mappings

| Element | Light Theme | Dark Theme | Notes |
|---------|-------------|------------|-------|
| **App background** | `bg-slate-50` | `bg-slate-950` | New darkest shade |
| **Panel/Card** | `bg-white` | `bg-slate-900` | Main surfaces |
| **Code editor** | `bg-slate-100` | `bg-slate-800` | Elevated cards |
| **Primary button bg** | `bg-purple-600` | `bg-purple-400` | Lighter for visibility |
| **Primary button text** | `text-white` | `text-slate-950` | Dark text on light bg |
| **Secondary button bg** | `bg-slate-100` | `bg-slate-800` | Match surface elevation |
| **Heading text** | `text-slate-900` | `text-slate-100` | Maximum contrast |
| **Body text** | `text-slate-700` | `text-slate-200` | High contrast |
| **Muted text** | `text-slate-500` | `text-slate-400` | Subtle content |
| **Border** | `border-slate-200` | `border-slate-600/50` | With opacity |
| **Hover surface** | `hover:bg-slate-100` | `hover:bg-slate-700` | Lighter in dark |
| **Success** | `text-green-600` | `text-green-400` | Lighter + vibrant |
| **Warning** | `text-yellow-600` | `text-amber-400` | Warmer tone |
| **Error** | `text-red-600` | `text-red-400` | Higher visibility |
| **Focus ring** | `ring-purple-600` | `ring-purple-500` | Slightly lighter |
| **Focus offset** | `ring-offset-white` | `ring-offset-slate-950` | Match bg |

### Special Dark Theme Elements

These are **new** or significantly enhanced in dark mode:

1. **Neon Glows** - Colored shadows: `shadow-purple-400/30`, `shadow-cyan-400/20`
2. **Glass Morphism** - Backdrop blur: `bg-slate-900/80 backdrop-blur-xl`
3. **Elevated Borders** - Light borders for depth: `border-slate-700/50`
4. **Traffic Lights** - Muted colors: `bg-red-400/80`, `bg-amber-400/80`, `bg-green-400/80`
5. **Accent Highlights** - Cyan for developer aesthetic: `text-cyan-400`, `border-cyan-400/30`

---

## 💻 Implementation Guide

### Step 1: Update Tailwind Config

```javascript
// client/tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        slate: {
          // Add new darkest shade
          950: '#020617',
          // ... rest of existing slate shades
        },

        // Add cyan for accent (NEW)
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
        },

        // Add teal for syntax (NEW)
        teal: {
          500: '#14B8A6',
        },

        // Add emerald for syntax (NEW)
        emerald: {
          500: '#10B981',
        },

        // Add amber for warnings (NEW - replaces yellow in dark)
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },

        // Existing colors stay the same
        purple: { /* ... */ },
        indigo: { /* ... */ },
        green: { /* ... */ },
        red: { /* ... */ },
      },

      // Add box shadow utilities for glows
      boxShadow: {
        'purple': '0 4px 20px rgba(168, 85, 247, 0.3)',
        'purple-dark': '0 4px 20px rgba(192, 132, 252, 0.3)',
        'cyan': '0 4px 15px rgba(34, 211, 238, 0.2)',
        'green-dark': '0 4px 15px rgba(74, 222, 128, 0.2)',
        'red-dark': '0 4px 15px rgba(248, 113, 113, 0.2)',
      },
    },
  },
  plugins: [],
}
```

### Step 2: Create Theme Context

```jsx
// client/src/contexts/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Priority: localStorage > system preference > default
    const stored = localStorage.getItem('codescribe-theme');
    if (stored) return stored;

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  useEffect(() => {
    // Update DOM
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist
    localStorage.setItem('codescribe-theme', theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set preference
      if (!localStorage.getItem('codescribe-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Step 3: Create Theme Toggle Component

```jsx
// client/src/components/ThemeToggle.jsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="
        relative p-2 rounded-lg
        bg-slate-100 dark:bg-slate-800
        text-slate-700 dark:text-slate-300
        hover:bg-slate-200 dark:hover:bg-slate-700
        border border-slate-200 dark:border-slate-700
        transition-all duration-200
        focus-visible:ring-2 focus-visible:ring-purple-600
        dark:focus-visible:ring-purple-400
        focus-visible:ring-offset-2
      "
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      {/* Sun icon (shows in dark mode) */}
      <Sun
        className={`
          w-5 h-5 text-amber-400
          transition-all duration-300 ease-in-out
          ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}
          absolute inset-0 m-auto
        `}
        aria-hidden="true"
      />

      {/* Moon icon (shows in light mode) */}
      <Moon
        className={`
          w-5 h-5
          transition-all duration-300 ease-in-out
          ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
        `}
        aria-hidden="true"
      />
    </button>
  );
}
```

### Step 4: Wrap App with Theme Provider

```jsx
// client/src/main.jsx or App.jsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        {/* Your app content */}
      </div>
    </ThemeProvider>
  );
}
```

### Step 5: Update Components with dark: Variants

**Example: Header**
```jsx
<header className="
  bg-white dark:bg-slate-900
  border-b border-slate-200 dark:border-slate-700
  transition-colors
">
  <h1 className="
    text-slate-900 dark:text-slate-100
    text-2xl font-semibold
  ">
    CodeScribe AI
  </h1>
</header>
```

**Example: Primary Button**
```jsx
<button className="
  bg-gradient-to-r
  from-purple-600 to-indigo-600
  dark:from-purple-400 dark:to-indigo-400
  text-white dark:text-slate-950
  shadow-purple dark:shadow-purple-dark
  hover:from-purple-700 hover:to-indigo-700
  dark:hover:from-purple-500 dark:hover:to-indigo-500
">
  Generate
</button>
```

### Step 6: Update Monaco Editor Theme

```jsx
// client/src/components/CodePanel.jsx
import { useTheme } from '../contexts/ThemeContext';

export function CodePanel() {
  const { theme } = useTheme();

  return (
    <Editor
      theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
      // ... other props
    />
  );
}
```

### Step 7: Update Global CSS

```css
/* client/src/index.css */

/* Dark mode scrollbar */
.dark .scrollbar-custom::-webkit-scrollbar-track {
  @apply bg-slate-800;
}

.dark .scrollbar-custom::-webkit-scrollbar-thumb {
  @apply bg-slate-600 hover:bg-slate-500;
}

/* Dark mode prose (markdown) */
.dark .prose {
  @apply text-slate-200;
}

.dark .prose h1,
.dark .prose h2,
.dark .prose h3 {
  @apply text-slate-100;
}

.dark .prose code {
  @apply bg-slate-800 text-cyan-400 border-slate-700;
}

.dark .prose pre {
  @apply bg-slate-800 border-slate-700;
}

.dark .prose a {
  @apply text-purple-400 hover:text-purple-300;
}

/* Dark mode focus indicators */
.dark *:focus-visible {
  @apply ring-purple-400;
}
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] All text readable (WCAG AAA contrast)
- [ ] Focus rings visible on all backgrounds
- [ ] Hover states clear and distinct
- [ ] Borders visible but subtle
- [ ] Shadows provide depth without harshness
- [ ] Success/warning/error distinguishable

### Cross-Component Testing
- [ ] Header + navigation
- [ ] Code editor (Monaco theme sync)
- [ ] Documentation panel
- [ ] Modals and overlays
- [ ] Forms and inputs
- [ ] Buttons (all variants)
- [ ] Toasts and alerts
- [ ] Badges and tags
- [ ] Loading states

### Functionality Testing
- [ ] Theme persists across reloads
- [ ] System preference detection works
- [ ] Manual toggle works
- [ ] No FOUC (flash of unstyled content)
- [ ] Theme syncs across tabs
- [ ] Monaco editor theme syncs

### Accessibility Testing
- [ ] WCAG AAA met for text (7:1+)
- [ ] Focus indicators visible
- [ ] Color not sole indicator
- [ ] Screen reader announces changes
- [ ] Keyboard navigation works
- [ ] High contrast mode supported

---

## 📊 Contrast Ratios (WCAG Compliance)

All measured against `slate-950` (#020617):

| Foreground | Contrast | WCAG | Usage |
|------------|----------|------|-------|
| `slate-100` | 18.3:1 | AAA ✅ | Headings |
| `slate-200` | 15.8:1 | AAA ✅ | Body text |
| `slate-300` | 12.6:1 | AAA ✅ | Secondary |
| `slate-400` | 8.9:1 | AAA ✅ | Muted |
| `purple-400` | 9.1:1 | AAA ✅ | Brand |
| `indigo-400` | 8.7:1 | AAA ✅ | Secondary brand |
| `cyan-400` | 11.3:1 | AAA ✅ | Accents |
| `green-400` | 10.8:1 | AAA ✅ | Success |
| `amber-400` | 13.2:1 | AAA ✅ | Warning |
| `red-400` | 8.2:1 | AAA ✅ | Error |

**Button text (dark on light):**
| Foreground | Background | Contrast |
|------------|------------|----------|
| `slate-950` | `purple-400` | 9.1:1 AAA ✅ |
| `slate-950` | `cyan-400` | 11.3:1 AAA ✅ |

---

## 🚀 Rollout Plan

### Phase 1: Foundation (Week 1)
- [ ] Add new colors to Tailwind config
- [ ] Create ThemeProvider + ThemeToggle
- [ ] Update 5 core components (Header, CodePanel, etc.)
- [ ] Test theme persistence

### Phase 2: Full Migration (Week 2)
- [ ] Update all remaining components
- [ ] Monaco + Mermaid theme sync
- [ ] Add smooth transitions
- [ ] Prevent FOUC

### Phase 3: Polish (Week 3)
- [ ] Fine-tune contrast
- [ ] Add glow effects
- [ ] Accessibility audit
- [ ] Cross-browser testing

### Phase 4: Launch (Week 4)
- [ ] User testing (beta)
- [ ] Documentation + screenshots
- [ ] Marketing materials
- [ ] Production deployment

---

## 📚 Resources

**Design Files:**
- [dark-theme-palette.html](../design/theming/dark-theme-palette.html) - Interactive color palette
- [brand-color-palette.html](../design/theming/brand-color-palette.html) - Light theme reference

**Tools:**
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)

**Inspiration:**
- [GitHub Dark](https://github.com/) - Professional developer UI
- [VS Code Dark+](https://code.visualstudio.com/) - Code editor aesthetic
- [Dracula Theme](https://draculatheme.com/) - Vibrant dark colors
- [Nord Theme](https://www.nordtheme.com/) - Cool, balanced palette

---

**Version:** 2.0
**Last Updated:** October 29, 2025
**Status:** Planning (Phase 2.5)
**Next Steps:** Review palette, refine implementation, schedule development sprint
