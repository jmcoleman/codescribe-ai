# Button Interactions Specification - Enterprise Grade

## 🎯 Design Philosophy

**Goal:** Create subtle, professional micro-interactions that feel polished without being distracting.

**Inspiration:** Linear, Vercel, Stripe, GitHub, Figma

---

## 📏 Interaction Specifications

### Standard Buttons (Primary, Secondary, Dark)

#### States
```css
/* Default */
- Scale: 100%
- Opacity: 100%
- Cursor: pointer

/* Hover */
- Scale: 102% (scale-[1.02])
- Background: Darken/lighten (variant-specific)
- Shadow: Enhanced (where applicable)
- Duration: 200ms
- Easing: ease-out
- Motion: motion-reduce:transition-none

/* Active (Pressed) */
- Scale: 98% (scale-[0.98])
- Brightness: 95% or 90% (brightness-95/90)
- Duration: 200ms

/* Focus (Keyboard) */
- Ring: 2px indigo-500
- Ring offset: 2px
- No scale change

/* Disabled */
- Opacity: 50%
- Cursor: not-allowed
- No hover/active effects
```

---

### Icon Buttons (Menu, Close, etc.)

#### States
```css
/* Default */
- Scale: 100%
- Background: transparent or subtle

/* Hover */
- Scale: 105% (scale-[1.05]) - More noticeable for small targets
- Background: slate-100 or context color
- Duration: 200ms
- Motion: motion-reduce:transition-none

/* Active */
- Scale: 98% (scale-[0.98])
- Duration: 200ms

/* Focus */
- Ring: 2px indigo-500
- Ring offset: 2px
```

---

### Menu Items (Vertical Lists)

#### States
```css
/* Default */
- Transform: translateX(0)
- Background: transparent or subtle

/* Hover */
- Transform: translateX(0.25rem) - 4px slide-right
- Background: slate-50 or context color
- Duration: 200ms
- Motion: motion-reduce:transition-none

/* Active */
- Background: Darken slightly
- No transform change

/* Rationale */
- Scale feels wrong in vertical lists
- Horizontal slide indicates "selectability"
- Common pattern in modern UIs
```

---

### Copy Button

#### Default State
```css
/* Appearance */
- Icon: Copy (lucide-react)
- Variant: outline (white bg, border)
- Size: md (p-2, icon w-4 h-4)
- Text: "Copy to clipboard" (aria-label)

/* Hover */
- Scale: 105% (scale-[1.05])
- Background: slate-50
- Border: slate-300
- Duration: 200ms

/* Active */
- Scale: 98% (scale-[0.98])
```

#### Success State (Copied)
```css
/* Appearance */
- Icon: Check (lucide-react)
- Background: green-50
- Border: green-200/300
- Text color: green-600/700
- Text: "Copied!" (aria-label)

/* Transition (200ms) */
1. Copy icon: opacity 0, rotate 90deg, scale 50%
2. Check icon: opacity 100, rotate 0, scale 100%
3. Background: white → green-50
4. Border: slate → green
5. Text color: slate → green

/* Duration */
- Animation: 200ms ease-out
- Auto-reset: 2000ms
- Total cycle: 2200ms
```

---

## 🎨 Color Specifications

### Button Variants

#### Primary (Purple Gradient)
```css
Default:  from-purple-500 to-purple-600
Hover:    from-purple-600 to-purple-700
Active:   brightness-95
Shadow:   shadow-purple → shadow-purple-lg
```

#### Secondary (Slate)
```css
Default:  bg-slate-100, text-slate-700
Hover:    bg-slate-200
Active:   brightness-95
Shadow:   none → shadow-sm
```

#### Dark (Slate-900)
```css
Default:  bg-slate-900, text-white
Hover:    bg-slate-800
Active:   brightness-90
Shadow:   none → shadow-lg
```

#### Icon (Transparent)
```css
Default:  bg-transparent, text-slate-600
Hover:    bg-slate-100
Active:   scale-98
```

### Copy Button Success State
```css
Background:  green-50
Border:      green-200 (outline) / green-300 (solid)
Text:        green-600 (light) / green-700 (emphasis)
Icon:        Check (green-600/700)
```

---

## ⚡ Animation Specifications

### Timing
```css
Duration:     200ms (all transitions)
Easing:       ease-out (default)
Delay:        0ms
Fill mode:    forwards
```

### Transforms Applied
```css
/* Hover */
scale-[1.02]     - Standard buttons
scale-[1.05]     - Icon buttons, Copy button
translate-x-1    - Menu items (4px right)

/* Active */
scale-[0.98]     - All clickable buttons
brightness-95    - Light backgrounds
brightness-90    - Dark backgrounds
```

### Icon Transitions (Copy Button)
```css
/* Copy → Check */
Copy icon:
  opacity: 100 → 0
  scale: 100 → 50
  rotate: 0deg → 90deg
  position: relative → absolute

Check icon:
  opacity: 0 → 100
  scale: 50 → 100
  rotate: -90deg → 0deg
  position: absolute → relative
```

---

## ♿ Accessibility Specifications

### Motion Preferences
```css
/* Default (motion enabled) */
transition-all duration-200

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  transition: none;
}

/* Tailwind */
motion-reduce:transition-none
```

### ARIA Labels
```javascript
// Default state
aria-label="Copy to clipboard"
title="Copy to clipboard"

// Success state
aria-label="Copied!"
title="Copied!"

// Disabled state
disabled={true}
aria-disabled="true"
```

### Keyboard Navigation
```css
/* Focus ring */
focus:outline-none
focus:ring-2
focus:ring-indigo-500
focus:ring-offset-2

/* Tab order */
- Native button elements maintain natural tab order
- No tabindex modifications needed
- Disabled buttons removed from tab order
```

### Screen Reader Support
```javascript
// State changes announced
- "Copy to clipboard" → "Copied!" (automatic via aria-label change)
- Button disabled during copied state (prevents duplicate announcements)
```

---

## 📐 Size Specifications

### Button Sizes
```css
/* Padding */
Standard:  px-6 py-2  (24px horizontal, 8px vertical)
Icon sm:   p-1.5      (6px all sides)
Icon md:   p-2        (8px all sides)
Icon lg:   p-2.5      (10px all sides)

/* Icon Sizes */
Icon sm:   w-3.5 h-3.5  (14px)
Icon md:   w-4 h-4      (16px)
Icon lg:   w-5 h-5      (20px)
Standard:  w-4 h-4      (16px, matches text size)
```

### Touch Targets
```css
/* Minimum clickable area */
Minimum:   44px × 44px (WCAG 2.1 Level AAA)
Achieved:  Icon buttons (40px+), Standard buttons (40px+ height)

/* Mobile considerations */
- All buttons meet minimum touch target
- No buttons smaller than 40px × 40px
- Adequate spacing between buttons (8px+ gap)
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Hover effects are subtle (2-3% scale)
- [ ] No jarring movements or jumps
- [ ] Consistent timing across all buttons
- [ ] Shadows enhance depth (not distract)
- [ ] Colors meet contrast requirements

### Interaction Testing
- [ ] Hover state appears immediately
- [ ] Active state on mouse down
- [ ] Focus ring visible for keyboard nav
- [ ] Copy button icon changes smoothly
- [ ] Copy button resets after 2 seconds
- [ ] Menu items slide (not scale)

### Accessibility Testing
- [ ] Reduced motion disables animations
- [ ] Keyboard navigation works
- [ ] Focus rings are visible
- [ ] Screen reader announces state changes
- [ ] All buttons have ARIA labels
- [ ] Touch targets meet WCAG AAA (44px)

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Performance Testing
- [ ] No layout thrashing
- [ ] Smooth 60fps animations
- [ ] No memory leaks (timers cleaned up)
- [ ] Efficient re-renders

---

## 📊 Metrics

### Performance Targets
- Animation FPS: 60fps (16.67ms per frame)
- Interaction delay: <100ms (perceived instant)
- Transition duration: 200ms (optimal balance)
- Auto-reset: 2000ms (industry standard)

### Accessibility Scores
- WCAG Level: AA (minimum)
- Contrast ratio: 4.5:1+ (text), 3:1+ (UI components)
- Touch targets: 44px × 44px (AAA level)
- Keyboard support: 100% navigable

---

## 🎨 Button & Menu Styling Hierarchy

### Design Philosophy

Button and dropdown menu styling should reflect their **purpose and importance** in the UI, creating a clear visual hierarchy that guides user attention.

### Component Categories

#### 1. Call-to-Action Buttons (Prominent)

**Purpose:** Navigate to destinations or trigger important actions
**Style:** Button-like with backgrounds, borders, and hover effects
**Prominence:** High - users should easily discover these

**Examples:**
- Pricing / Upgrade / Subscription button
- Help button
- Sign In button
- Generate Docs button
- Add Code dropdown button

**Variants:**
- `primary` - Purple gradient for most important actions
- `secondary` - Gray background for supporting actions
- `dark` - Dark/purple for authentication CTAs

**When to Use:**
- Primary navigation destinations
- Important workflow actions
- Features users need to discover
- Actions that initiate key processes

#### 2. Contextual Dropdowns (Subtle)

**Purpose:** Open menus with multiple related actions
**Style:** Minimal - no background/border until hover
**Prominence:** Low - contextual, not primary actions

**Examples:**
- User account dropdown menu
- Settings/preferences dropdowns (when purely navigational)

**Styling Pattern:**
```jsx
className="flex items-center gap-2 px-3 py-2
  hover:bg-slate-100 dark:hover:bg-slate-800
  rounded-lg transition-colors"
```

**When to Use:**
- User profile/account menus
- Nested navigation menus
- Secondary contextual actions
- When prominence would be distracting

#### 3. Utility Icons (Minimal)

**Purpose:** Quick access to settings and utilities
**Style:** Icon-only, transparent, minimal
**Prominence:** Very low - for power users

**Examples:**
- Appearance/theme toggle
- Quick settings access
- Help tooltips

**Styling Pattern:**
```jsx
className="p-2 rounded-lg text-slate-600 dark:text-slate-400
  hover:bg-slate-100 dark:hover:bg-slate-800
  transition-colors"
```

**When to Use:**
- Settings that don't need discovery
- Secondary utilities
- Power user features
- Icon-only makes sense contextually

---

### Real-World Example: Header Navigation

Our Header component demonstrates this hierarchy perfectly:

```jsx
{/* Call-to-Action Buttons - Prominent (secondary variant) */}
<Button variant="secondary" onClick={() => navigate('/pricing')}>
  {getPricingLabel()}
</Button>

<Button variant="secondary" onClick={onHelpClick}>
  Help
</Button>

{/* Contextual Dropdown - Subtle (no variant) */}
{isAuthenticated && (
  <Menu.Button className="flex items-center gap-2 px-3 py-2
    hover:bg-slate-100 dark:hover:bg-slate-800
    rounded-lg transition-colors">
    <User className="w-5 h-5" />
    <span>{getDisplayName()}</span>
    <ChevronDown className="w-4 h-4" />
  </Menu.Button>
)}

{/* Utility Icon - Minimal (icon-only) */}
{!isAuthenticated && (
  <button
    onClick={() => setShowAppearanceModal(true)}
    className="p-2 rounded-lg text-slate-600 dark:text-slate-400
      hover:bg-slate-100 dark:hover:bg-slate-800
      transition-colors"
  >
    <SlidersHorizontal className="w-5 h-5" />
  </button>
)}

{/* Primary CTA - Most Prominent (dark variant) */}
{!isAuthenticated && (
  <Button variant="dark" onClick={handleSignInClick}>
    Sign In
  </Button>
)}
```

---

### Real-World Example: ControlBar "Add Code" Dropdown

Initially styled as subtle (contextual), but revised to prominent (CTA) because it's a **primary action** for the workflow:

**❌ Incorrect:** Subtle styling for primary action
```jsx
<HeadlessMenu.Button className="px-3 py-2
  hover:bg-slate-100 dark:hover:bg-slate-800">
  Add Code
</HeadlessMenu.Button>
```

**✅ Correct:** Prominent styling for primary action
```jsx
<HeadlessMenu.Button className="px-4 py-2
  bg-slate-100 dark:bg-slate-800
  border border-transparent dark:border-slate-600/50
  hover:bg-slate-200 dark:hover:bg-slate-700
  hover:scale-[1.02] hover:shadow-sm">
  Add Code
</HeadlessMenu.Button>
```

**Rationale:**
- "Add Code" is how users **start their workflow** - it's not contextual
- Should be discoverable like "Pricing" and "Help" buttons
- Dropdown chevron doesn't make it less important
- Primary actions need visual weight regardless of being dropdowns

---

### Decision Framework

When choosing styling for a button or dropdown, ask:

1. **Is this a primary action or navigation destination?**
   → Use prominent button styling (primary/secondary/dark variants)

2. **Is this a contextual menu with multiple related options?**
   → Use subtle dropdown styling (no background/border)

3. **Is this a utility for power users?**
   → Use minimal icon-only styling

4. **Does the user need to discover this?**
   → If yes: Prominent. If no: Subtle or minimal.

---

### Common Patterns

#### Pattern: Action Dropdown Button
**Use Case:** Dropdown that triggers primary actions (e.g., "Add Code", "Create New", "Export")
**Styling:** Prominent button with dropdown chevron
**Variant:** `secondary` or custom with similar prominence

```jsx
<HeadlessMenu.Button className="inline-flex items-center gap-2 px-4 py-2
  bg-slate-100 dark:bg-slate-800
  border border-transparent dark:border-slate-600/50
  rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700
  hover:scale-[1.02] hover:shadow-sm
  transition-all duration-200">
  <Plus className="w-4 h-4" />
  <span>Add Code</span>
  <ChevronDown className="w-4 h-4" />
</HeadlessMenu.Button>
```

#### Pattern: Navigation Dropdown
**Use Case:** User profile, account settings, contextual menus
**Styling:** Subtle with hover effect
**Variant:** Custom minimal styling

```jsx
<Menu.Button className="flex items-center gap-2 px-3 py-2
  hover:bg-slate-100 dark:hover:bg-slate-800
  rounded-lg transition-colors">
  <User className="w-5 h-5" />
  <span>{userName}</span>
  <ChevronDown className="w-4 h-4" />
</Menu.Button>
```

#### Pattern: Icon Button
**Use Case:** Settings, utilities, secondary actions
**Styling:** Icon-only, minimal
**Variant:** `icon` or custom minimal

```jsx
<button className="p-2 rounded-lg
  text-slate-600 dark:text-slate-400
  hover:bg-slate-100 dark:hover:bg-slate-800
  transition-colors">
  <Settings className="w-5 h-5" />
</button>
```

---

### Testing Visual Hierarchy

When reviewing a page or component, verify:

- [ ] Primary actions are visually prominent (backgrounds, borders)
- [ ] Contextual menus are subtle (blend into UI until hover)
- [ ] Icon utilities are minimal (don't distract from content)
- [ ] Hierarchy guides attention to most important actions
- [ ] Dropdown chevrons don't determine prominence (content does)
- [ ] Consistent styling across similar action types

---

## 🔗 References

### Design Systems
- [Linear Design System](https://linear.app)
- [Vercel Design System](https://vercel.com/design)
- [Stripe Design System](https://stripe.com/docs/design)
- [GitHub Primer](https://primer.style)
- [Tailwind UI](https://tailwindui.com)

### Accessibility Standards
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)

### Animation Guides
- [Material Design Motion](https://material.io/design/motion)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Framer Motion](https://www.framer.com/motion/)

---

**Version:** 1.0  
**Last Updated:** 2024-10-14  
**Status:** Production-ready ✅
