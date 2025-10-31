# CodeScribe AI - Light Theme Design System

**Version:** 2.0 - Refined (Aligned with Dark Theme)
**Last Updated:** October 30, 2025
**Status:** Current Production Theme

---

## 📋 Overview

The refined light theme design system for CodeScribe AI, enhanced with subtle shadows, cyan accents, and simplified button hierarchy to match the premium feel of the Neon Cyberpunk dark theme.

### Design Philosophy

1. **Subtle Depth**: 20% opacity shadows add premium feel without overwhelming
2. **Simplified Hierarchy**: One primary button style - emphasis from placement/context
3. **Brand Continuity**: Cyan accents create visual link between light and dark themes
4. **Clean & Professional**: Maintains accessibility and clarity of light mode

### Key Refinements (v2.0)

| Enhancement | Implementation | Rationale |
|-------------|----------------|-----------|
| **Subtle Shadows** | `shadow-lg shadow-purple-600/20` | Adds depth and premium feel like dark theme |
| **Simplified Buttons** | Single primary variant | Removes confusion, matches dark theme philosophy |
| **Cyan Accents** | Code elements use cyan-600 | Brand continuity: "cyan = code" in both themes |
| **Consistent Patterns** | Same interaction models | Themes feel like siblings, not strangers |

---

## 🎨 Color System

### Brand Colors

#### Purple (Primary Brand)

| Shade | Hex | Usage | Notes |
|-------|-----|-------|-------|
| `purple-600` ⭐ | `#9333EA` | Primary buttons, CTAs, links | Main brand color |
| `purple-700` | `#7E22CE` | Hover states | Darker for interaction |
| `purple-50` | `#FAF5FF` | Backgrounds, highlights | Very light tint |
| `purple-100` | `#F3E8FF` | Badge backgrounds | Light tint |

**With Opacity (Shadows):**
```css
purple-600/20:  rgba(147, 51, 234, 0.2)  /* Subtle button shadows */
purple-600/30:  rgba(147, 51, 234, 0.3)  /* Stronger emphasis (rare) */
```

#### Indigo (Secondary Brand)

| Shade | Hex | Usage | Notes |
|-------|-----|-------|-------|
| `indigo-600` | `#4F46E5` | Secondary elements, badges | Complements purple |
| `indigo-700` | `#4338CA` | Hover states | Darker variant |
| `indigo-50` | `#EEF2FF` | Backgrounds | Very light tint |
| `indigo-100` | `#E0E7FF` | Badge backgrounds | Light tint |

#### Cyan (Code/Technical Accent) ⭐ NEW

| Shade | Hex | Usage | Notes |
|-------|-----|-------|-------|
| `cyan-600` ⭐ | `#0891B2` | Code syntax, technical badges | Brand continuity with dark theme |
| `cyan-500` | `#06B6D4` | Links in code context | Lighter variant |
| `cyan-700` | `#0E7490` | Hover states | Darker for interaction |
| `cyan-50` | `#ECFEFF` | Code element backgrounds | Very light tint |

**With Opacity (Shadows):**
```css
cyan-600/20:  rgba(8, 145, 178, 0.2)  /* Code element shadows */
```

**Rationale:** Cyan creates visual consistency between themes. Users see cyan and immediately recognize "this is code-related" whether in light or dark mode.

### Neutral Colors (Slate)

| Shade | Hex | Usage |
|-------|-----|-------|
| `slate-50` | `#F8FAFC` | App background |
| `slate-100` | `#F1F5F9` | Secondary backgrounds, hover states |
| `slate-200` | `#E2E8F0` | Borders, dividers |
| `slate-600` | `#475569` | Secondary text |
| `slate-700` | `#334155` | Body text |
| `slate-900` | `#0F172A` | Headings, primary text |

### Semantic Colors

#### Success (Green)
- `green-600` (#16A34A) - Success text, icons
- `green-500` (#22C55E) - Success buttons (rare)
- `green-50` (#F0FDF4) - Success backgrounds

#### Warning (Amber)
- `amber-600` (#D97706) - Warning text, icons
- `amber-500` (#F59E0B) - Warning buttons
- `amber-50` (#FFFBEB) - Warning backgrounds

#### Error (Red)
- `red-600` (#DC2626) - Error text, icons
- `red-500` (#EF4444) - Error buttons
- `red-50` (#FEF2F2) - Error backgrounds

---

## 🏗️ Shadow System

### Primary CTAs

```css
/* Standard primary button shadow */
box-shadow: 0 10px 15px -3px rgba(147, 51, 234, 0.2),
            0 4px 6px -2px rgba(147, 51, 234, 0.1);
```

**Tailwind:** `shadow-lg shadow-purple-600/20`

**Usage:** All primary action buttons (Generate, Submit, Save, etc.)

**Why 20% opacity?**
- Subtle enough for light mode (not garish)
- Adds noticeable depth and premium feel
- Tested across different screen brightnesses
- Matches dark theme's approach (scaled for light mode)

### Code Element Shadows (Optional)

```css
/* Cyan shadow for code status indicators */
box-shadow: 0 4px 12px -2px rgba(8, 145, 178, 0.2);
```

**Tailwind:** `shadow-md shadow-cyan-600/20`

**Usage:** "Ready to analyze" status, code badges, syntax-related UI

### Standard Component Shadows

```css
/* Cards, panels, modals */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);  /* shadow-sm */
```

**Usage:** White background cards, dropdowns, elevated surfaces

---

## 🎯 Button System

### Philosophy

**One primary button style. Emphasis comes from placement, size, and context - not button variants.**

This matches the dark theme approach and eliminates confusion about when to use which button type.

### Primary Button

```jsx
<button className="
  px-6 py-2
  bg-purple-600 hover:bg-purple-700 active:bg-purple-800
  text-white font-medium
  rounded-lg
  shadow-lg shadow-purple-600/20
  transition-all duration-200
  focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2
">
  Generate Docs
</button>
```

**Key Features:**
- Solid purple background (no gradients)
- 20% opacity purple shadow for depth
- White text for maximum contrast
- Clear hover/active states

**When to use:** All primary actions (Generate, Submit, Save, Sign In, etc.)

### Secondary Button

```jsx
<button className="
  px-4 py-2
  bg-slate-100 hover:bg-slate-200 active:bg-slate-300
  text-slate-700
  rounded-lg
  border border-slate-200
  transition-colors duration-200
">
  Upload Files
</button>
```

**When to use:** Supporting actions that don't require primary emphasis

### Tertiary/Ghost Button

```jsx
<button className="
  px-4 py-2
  bg-transparent hover:bg-slate-50
  text-slate-700 hover:text-slate-900
  rounded-lg
  border border-slate-300
  transition-colors duration-200
">
  Learn More
</button>
```

**When to use:** Low-priority actions, navigation items

### Danger Button (Destructive Actions)

```jsx
<button className="
  px-6 py-2
  bg-red-600 hover:bg-red-700 active:bg-red-800
  text-white font-medium
  rounded-lg
  shadow-lg shadow-red-600/20
  transition-all duration-200
">
  Delete Account
</button>
```

**When to use:** Destructive actions only (delete, remove, reset)

---

## 💡 Cyan Accent Usage

### Code Status Indicators

```jsx
<div className="
  flex items-center gap-2
  px-4 py-2
  bg-cyan-50 border border-cyan-200
  rounded-lg
  shadow-md shadow-cyan-600/20
">
  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
  <span className="text-sm font-medium text-cyan-900">Ready to analyze</span>
</div>
```

### Language/Technology Badges

```jsx
<span className="
  inline-flex items-center
  px-2.5 py-1
  rounded-md
  bg-cyan-100 border border-cyan-300
  text-cyan-800 text-sm font-medium
">
  JavaScript
</span>
```

### Code Links

```jsx
<a className="
  text-cyan-600 hover:text-cyan-700
  font-medium
  underline decoration-cyan-300 hover:decoration-cyan-500
  transition-colors
">
  View source code →
</a>
```

### Syntax Highlighting

```jsx
// In code blocks
<span className="text-cyan-600">functionName</span>  // Functions
<span className="text-cyan-600">ClassName</span>     // Classes
<span className="text-cyan-600">methodName</span>    // Methods
```

---

## 📦 Component Patterns

### Header

```jsx
<header className="
  bg-white
  border-b border-slate-200
  shadow-sm
  sticky top-0 z-40
">
  {/* Content */}
</header>
```

### Card

```jsx
<div className="
  bg-white
  border border-slate-200
  rounded-xl
  p-6
  shadow-sm
  hover:shadow-md
  transition-shadow duration-200
">
  {/* Content */}
</div>
```

### Code Panel

```jsx
<div className="
  bg-white
  border border-slate-200
  rounded-xl
  overflow-hidden
  shadow-sm
">
  {/* Header */}
  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
    <span className="text-slate-600 text-sm">filename.js</span>
  </div>

  {/* Code content */}
  <div className="p-4 bg-slate-50 font-mono text-sm">
    {/* Syntax highlighted code */}
  </div>

  {/* Footer with cyan status */}
  <div className="bg-slate-50 border-t border-slate-200 px-4 py-2">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
      <span className="text-cyan-600 text-xs font-medium">Ready to analyze</span>
    </div>
  </div>
</div>
```

### Input Field

```jsx
<input className="
  w-full px-4 py-2
  bg-white
  border border-slate-200
  rounded-lg
  text-slate-900 placeholder:text-slate-500
  focus:border-purple-600 focus:ring-2 focus:ring-purple-600/50
  transition-colors
" />
```

### Select Dropdown

```jsx
<select className="
  px-4 py-2
  bg-white
  border border-slate-200
  rounded-lg
  text-slate-700
  focus:border-purple-600 focus:ring-2 focus:ring-purple-600/50
">
  <option>README.md</option>
  <option>API Reference</option>
</select>
```

---

## 🎨 Mermaid Diagram Styling

### Theme Configuration

```javascript
mermaid.initialize({
  theme: 'default',
  themeVariables: {
    primaryColor: '#faf5ff',        // Purple-50
    primaryTextColor: '#1f2937',
    primaryBorderColor: '#9333ea',   // Purple-600
    lineColor: '#64748b',            // Slate-500
    secondaryColor: '#ecfeff',       // Cyan-50
    tertiaryColor: '#fff7ed',
    clusterBkg: '#fafafa',
    clusterBorder: '#9333ea',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px'
  }
});
```

### Node Styling

```css
/* Purple - Client/Frontend */
style NodeName fill:#f3e8ff,stroke:#9333ea,stroke-width:2px

/* Slate - API Layer */
style NodeName fill:#e2e8f0,stroke:#64748b,stroke-width:2px

/* Indigo - Services */
style NodeName fill:#e0e7ff,stroke:#4338ca,stroke-width:2px

/* Cyan - External/Code */
style NodeName fill:#ecfeff,stroke:#0891b2,stroke-width:2px
```

---

## ♿ Accessibility

### Contrast Ratios (WCAG AA/AAA)

All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text):

| Foreground | Background | Ratio | WCAG | Usage |
|------------|------------|-------|------|-------|
| `slate-900` | `white` | 18.2:1 | AAA ✅ | Headings |
| `slate-700` | `white` | 10.4:1 | AAA ✅ | Body text |
| `slate-600` | `white` | 7.8:1 | AAA ✅ | Secondary text |
| `purple-600` | `white` | 5.1:1 | AA ✅ | Buttons (large text) |
| `white` | `purple-600` | 5.1:1 | AA ✅ | Button text |
| `cyan-900` | `cyan-50` | 11.3:1 | AAA ✅ | Code badges |

### Focus Indicators

```css
/* Default focus ring */
*:focus-visible {
  @apply ring-2 ring-purple-600 ring-offset-2;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  *:focus-visible {
    @apply ring-4 ring-purple-600 ring-offset-4;
  }
}
```

---

## 📊 Design Tokens

### Spacing

```javascript
{
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '6': '1.5rem',    // 24px
  '8': '2rem',      // 32px
  '12': '3rem',     // 48px
  '16': '4rem'      // 64px
}
```

### Border Radius

```javascript
{
  'DEFAULT': '0.25rem',  // 4px
  'md': '0.375rem',      // 6px
  'lg': '0.5rem',        // 8px
  'xl': '0.75rem',       // 12px
  '2xl': '1rem'          // 16px
}
```

### Typography

```javascript
{
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  fontSize: {
    'xs': '0.75rem',      // 12px
    'sm': '0.875rem',     // 14px
    'base': '1rem',       // 16px
    'lg': '1.125rem',     // 18px
    'xl': '1.25rem',      // 20px
    '2xl': '1.5rem',      // 24px
    '3xl': '1.875rem'     // 30px
  }
}
```

---

## 🔄 Light vs Dark Theme Comparison

| Element | Light Theme | Dark Theme | Notes |
|---------|-------------|------------|-------|
| **Primary Button** | `bg-purple-600` + `shadow-purple-600/20` | `bg-purple-400` + `shadow-purple-400/30` | Same concept, scaled for mode |
| **Button Text** | `text-white` | `text-slate-950` | Inverted for contrast |
| **App Background** | `bg-slate-50` | `bg-slate-950` | Opposite ends of spectrum |
| **Card Background** | `bg-white` | `bg-slate-900` | Light vs dark surfaces |
| **Body Text** | `text-slate-700` | `text-slate-200` | Inverted shades |
| **Heading Text** | `text-slate-900` | `text-slate-100` | Maximum contrast |
| **Cyan Usage** | `cyan-600` | `cyan-400` | Same semantic meaning |
| **Shadow Opacity** | 20% | 30% | Lighter for light mode |

**Design Principle:** Themes are **siblings** - same design language, same patterns, different implementations optimized for each mode.

---

## 🚀 Implementation Checklist

### Phase 1: Core Components
- [ ] Update primary button styles with shadow
- [ ] Add cyan accent colors to Tailwind config
- [ ] Update code status indicators to use cyan
- [ ] Remove hero/special button variants
- [ ] Update focus ring styles

### Phase 2: Component Updates
- [ ] Code panel with cyan status
- [ ] Language badges with cyan
- [ ] Syntax highlighting with cyan for functions/classes
- [ ] Update all cards with shadow-sm
- [ ] Logo with subtle shadow

### Phase 3: Polish
- [ ] Test all button states (hover, active, focus)
- [ ] Verify WCAG contrast ratios
- [ ] Cross-browser shadow rendering
- [ ] Mobile responsiveness
- [ ] Screen reader testing

### Phase 4: Documentation
- [ ] Update component documentation
- [ ] Create migration guide for existing components
- [ ] Screenshot gallery for design reference
- [ ] Storybook/component library updates

---

## 📚 Resources

**Design Files:**
- [light-theme-refined-preview.html](./light-theme-refined-preview.html) - Full preview with examples
- [brand-color-palette.html](./brand-color-palette.html) - Original color palette
- [dark-theme-palette.html](./dark-theme-palette.html) - Dark theme reference

**Related Documentation:**
- [DARK-MODE-SPEC.md](../planning/DARK-MODE-SPEC.md) - Dark theme specification
- [Figma-Guide.md](../planning/mvp/07-Figma-Guide.md) - Original design system

**Tools:**
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 📝 Version History

- **v2.0** (October 30, 2025) - Refined light theme aligned with dark theme philosophy
  - Added subtle shadows (20% opacity)
  - Simplified button hierarchy (removed hero variant)
  - Introduced cyan accents for code elements
  - Updated design philosophy to match dark theme

- **v1.0** (October 2025) - Original light theme design system

---

**Questions or feedback?** Reference this document when implementing light theme components to ensure consistency with the refined design system.
