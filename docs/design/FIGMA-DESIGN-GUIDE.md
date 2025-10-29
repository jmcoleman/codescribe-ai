# CodeScribe AI - Figma Design Guide (Current + Future)

**Project:** CodeScribe AI
**Purpose:** Create mockups for current app state + future features (Phase 2-6)
**Designer Role:** UX/UI Designer
**Timeline:** 6-8 hours (base system) + additional time for new features
**Deliverable:** Production-ready design system and mockups with WCAG 2.1 AA compliance
**Document Version:** 3.0 (Updated October 23, 2025)
**Location:** `docs/planning/FIGMA-DESIGN-GUIDE.md`

---

## 📋 Overview

This guide helps you create Figma mockups for **CodeScribe AI** that match the current production app (Phase 1 - **COMPLETE**) and design future features (Phases 2-6 - **PLANNED**).

**Use Cases:**
1. **Current State Mockups:** Generate designs matching [codescribeai.com](https://codescribeai.com) for presentations, portfolios, or documentation
2. **Future Feature Mockups:** Design Phase 2-6 features (authentication, dark mode, payment UI, etc.) before implementation
3. **Design System Reference:** Maintain consistency as the app evolves

**Production Status:**
- ✅ **Phase 1 Complete:** Web app, 4 doc types, WCAG 2.1 AA compliance, 660+ tests passing
- ✅ **Live URL:** [https://codescribeai.com](https://codescribeai.com)
- 📋 **Phase 2 Planned:** Authentication, tier system, payments (see [ROADMAP.md](roadmap/ROADMAP.md))

**Updated in v3.0:**
- Moved to planning folder for easier access
- Added guidance for designing Phase 2-6 features
- Maintained all Phase 1 component specs (14 components)
- Added authentication UI patterns (for Phase 2)
- References current production app as design baseline

---

## 🎨 Design Philosophy

**Core Principles:**
- **Developer-First**: Familiar patterns (VS Code-inspired)
- **Modern SaaS**: Clean, professional, trustworthy
- **Purple Accent**: Vibrant but not overwhelming
- **Content-Forward**: Minimal chrome, maximum workspace
- **Accessible**: WCAG AA compliant throughout

---

## 🚀 Quick Start (30 minutes)

### Step 1: Create New File (5 min)

1. Open Figma
2. Click "New design file"
3. Name it: "CodeScribe AI - Design System"
4. Create 3 pages:
   - **🎨 Design System** (components & styles)
   - **💻 Desktop** (1440px mockups)
   - **📱 Mobile** (375px mockups)

### Step 2: Set Up Frames (5 min)

**Desktop Page:**
1. Press `F` to create frame
2. Select "Desktop" → Custom: 1440 × 1024
3. Name: "Desktop - Main"
4. Add layout grid:
   - Type: Columns
   - Count: 12
   - Width: 80px
   - Gutter: 24px
   - Margin: 48px

**Mobile Page:**
1. Press `F` to create frame
2. Select "iPhone 14" or Custom: 375 × 812
3. Name: "Mobile - Main"
4. Add layout grid:
   - Type: Columns
   - Count: 4
   - Gutter: 20px
   - Margin: 16px

### Step 3: Install Required Fonts (5 min)

Download and install:
- **Inter** (headers, body text)
  - https://fonts.google.com/specimen/Inter
  - Weights needed: 400 (Regular), 500 (Medium), 600 (Semibold)
- **JetBrains Mono** (code)
  - https://fonts.google.com/specimen/JetBrains+Mono
  - Weight: 400 (Regular)

### Step 4: Install Icon Plugin (5 min)

1. Open Figma Plugins (Right sidebar)
2. Search "Iconify"
3. Click "Install"
4. We'll use **Lucide** icon set

### Step 5: Create Color Styles (15 min)

Go to Design System page and create color swatches:

**Method:**
1. Press `R` (Rectangle)
2. Create 50×50 square
3. Fill with color from palette below
4. Select square → Click fill color in right sidebar
5. Click "Style" icon (⊕) next to the color
6. Click "Create style"
7. Name using convention: `color/[family]/[shade]`
8. Add description with usage guidance
9. Repeat for all **27 colors** below

**Naming Convention Examples:**
- Primary: `color/purple/500`, `color/purple/600`
- Secondary: `color/indigo/500`, `color/indigo/600`
- Neutral: `color/slate/50`, `color/slate/900`
- Semantic: `color/green/600`, `color/yellow/600`, `color/red/600`

**Pro Tip:** Group swatches visually by color family for easy reference

---

## 🎨 Design Tokens

### Color Palette

**Primary (Purple)**
```
purple/50:  #FAF5FF  ← Light backgrounds
purple/100: #F3E8FF
purple/200: #E9D5FF
purple/500: #A855F7  ← Main brand
purple/600: #9333EA  ← Hover states
purple/700: #7E22CE
```

**Secondary (Indigo)**
```
indigo/50:  #EEF2FF  ← Light backgrounds
indigo/100: #E0E7FF
indigo/200: #C7D2FE
indigo/500: #6366F1  ← Secondary brand
indigo/600: #4F46E5  ← Hover states
indigo/700: #4338CA
```

**Neutral (Slate)**
```
slate/50:   #F8FAFC  ← Page background
slate/100:  #F1F5F9  ← Light elements
slate/200:  #E2E8F0  ← Borders
slate/300:  #CBD5E1
slate/500:  #64748B  ← Subtle text
slate/600:  #475569  ← Body text
slate/700:  #334155
slate/800:  #1E293B
slate/900:  #0F172A  ← Headers
white:      #FFFFFF
```

**Semantic Colors**

Success (Green):
```
green/50:   #F0FDF4  ← Success message backgrounds
green/100:  #DCFCE7  ← Subtle success states
green/600:  #16A34A  ← Success text, icons (main)
green/700:  #15803D  ← Success buttons, badges
```

Warning (Yellow):
```
yellow/50:  #FEFCE8  ← Warning message backgrounds
yellow/100: #FEF9C3  ← Subtle warnings
yellow/600: #CA8A04  ← Warning text, icons (main)
yellow/700: #A16207  ← Warning buttons, badges
```

Error (Red):
```
red/50:     #FEF2F2  ← Error message backgrounds
red/100:    #FEE2E2  ← Subtle error states
red/600:    #DC2626  ← Error text, icons (main)
red/700:    #B91C1C  ← Error buttons, destructive actions
```

---

### Color Usage Guidelines

**When to use each color family:**

#### Purple (Primary Brand)
**Best for:** User-facing elements, primary actions, brand moments
- **50-200**: Light backgrounds, hover states, subtle highlights
- **500**: Main brand color for primary CTAs, hero elements
- **600**: Hover states for buttons, focus rings, active states
- **700**: Pressed states, emphasized elements

**Examples:**
- Primary buttons: `purple/600` background, hover to `purple/700`
- Links: `purple/600` text, hover to `purple/700`
- Brand accents: `purple/500` or `purple/600`

#### Indigo (Secondary Brand)
**Best for:** Technical features, secondary actions, service layer elements
- **50-200**: Light backgrounds for technical content
- **500**: Secondary CTAs, badges, technical highlights
- **600**: Hover states for secondary elements
- **700**: Active/pressed states

**Examples:**
- Secondary buttons: `indigo/600` background
- Code-related badges: `indigo/500` or `indigo/600`
- Service layer in architecture diagrams: `indigo/200` fills

#### Slate (Neutral)
**Best for:** Text, backgrounds, borders, UI chrome
- **50-100**: Page backgrounds, card backgrounds
- **200-300**: Borders, dividers, disabled states
- **500-600**: Body text, labels, subtle content
- **700-900**: Headings, emphasis, high-contrast text

**Examples:**
- Page background: `slate/50`
- Card backgrounds: `white` or `slate/100`
- Borders: `slate/200` or `slate/300`
- Body text: `slate/600` or `slate/700`
- Headings: `slate/900`

#### Green (Success)
**Best for:** Success messages, confirmations, positive states
- **50-100**: Alert/message backgrounds
- **600**: Main success color (text, icons) - WCAG AA compliant
- **700**: Success buttons, badges with white text

**Examples:**
- Success alert: `green/50` background, `green/600` text
- Success icon: `green/600`
- Success button: `green/700` background

#### Yellow (Warning)
**Best for:** Warnings, cautions, external dependencies
- **50-100**: Warning message backgrounds
- **600**: Main warning color (text, icons) - WCAG AA compliant
- **700**: Warning buttons, badges with white text

**Examples:**
- Warning alert: `yellow/50` background, `yellow/600` text
- Warning icon: `yellow/600`
- External API indicator: `yellow/600` or `yellow/700`

#### Red (Error)
**Best for:** Errors, validation failures, destructive actions
- **50-100**: Error message backgrounds
- **600**: Main error color (text, icons) - WCAG AA compliant (5.9:1)
- **700**: Destructive action buttons with white text

**Examples:**
- Error alert: `red/50` background, `red/600` text
- Error icon: `red/600`
- Delete button: `red/700` background

---

### UI Pattern Guidelines

**Established patterns for consistent implementation across the app:**

#### Helper Text / Instructional Banners
**Pattern:** Use neutral slate colors to avoid competing with content
- **Background:** `slate/100` (light, subtle)
- **Text:** `slate/700` (readable, not too bold)
- **Purpose:** Instructional text that guides users without drawing excessive attention

**Examples:**
- Modal helper text: "Click a card to preview • Click → to load"
- Inline instructions
- Contextual hints

**Why slate?** Helper text should inform without distraction. Slate maintains visual hierarchy and keeps focus on the actual content/actions.

#### Badges & Tags
**Pattern:** Use color to convey hierarchy and meaning

**Primary Information (Important/Distinguishing):**
- **Background:** `indigo/100`
- **Text:** `indigo/700`
- **Purpose:** Key distinguishing features that help users make decisions

**Examples:**
- Doc type badges (README, JSDOC, API)
- Primary category tags
- Feature highlights

**Secondary Information (Supplementary):**
- **Background:** `slate/100`
- **Text:** `slate/600`
- **Purpose:** Supporting details that provide context

**Examples:**
- Language badges (javascript, python, etc.)
- Metadata tags
- Supplementary info

**Why indigo for primary?** Adds a subtle pop of color that creates visual hierarchy without being as bold as purple (which is reserved for user actions). Indigo signals "technical/informative" while slate signals "neutral/supplementary."

#### Color Hierarchy Summary
Use this hierarchy to maintain consistency:
1. **Purple** → User actions (buttons, links, CTAs)
2. **Indigo** → Primary information/categories (badges, important tags)
3. **Slate** → Secondary information, UI chrome, helper text
4. **Green/Yellow/Red** → Semantic states (success, warning, error)

**Decision Rationale:**
- Tested slate vs indigo for helper text → slate wins (less visual competition)
- Tested slate vs indigo for docType badges → indigo wins (adds visual interest)
- This creates a balanced color distribution: not too much color, not too bland

---

### Accessibility Notes

**All colors meet WCAG AA standards (4.5:1 minimum contrast):**

✅ **purple/600** on white: 6.5:1 contrast
✅ **indigo/600** on white: 6.8:1 contrast
✅ **green/600** on white: 4.8:1 contrast
✅ **yellow/600** on white: 6.3:1 contrast
✅ **red/600** on white: 5.9:1 contrast (fixed from red/400)
✅ **slate/600** on white: 7.8:1 contrast

**Important:** Always use the /600 shade for text on white backgrounds to ensure accessibility.

---

### Typography Styles

**Create these text styles:**

| Style Name | Font | Size | Weight | Line Height |
|------------|------|------|--------|-------------|
| `text/heading-xl` | Inter | 20px | Semibold (600) | 28px |
| `text/heading-lg` | Inter | 18px | Semibold (600) | 24px |
| `text/body-base` | Inter | 14px | Regular (400) | 20px |
| `text/body-sm` | Inter | 13px | Regular (400) | 18px |
| `text/body-xs` | Inter | 12px | Regular (400) | 16px |
| `text/label-medium` | Inter | 14px | Medium (500) | 20px |
| `text/code-sm` | JetBrains Mono | 13px | Regular (400) | 20px |

**How to create:**
1. Press `T` (Text tool)
2. Type sample text: "Sample Text 123"
3. Set font, size, weight, line height
4. Select text → Right-click → "Create style"
5. Name it (e.g., `text/heading-xl`)
6. Repeat for all styles

---

### Effect Styles (Shadows)

| Name | Offset | Blur | Color |
|------|--------|------|-------|
| `shadow/sm` | 0, 1px | 2px | rgba(0,0,0,0.05) |
| `shadow/base` | 0, 1px | 3px | rgba(0,0,0,0.1) |
| `shadow/md` | 0, 4px | 6px | rgba(0,0,0,0.1) |
| `shadow/purple` | 0, 4px | 20px | rgba(168,85,247,0.3) |

**How to create:**
1. Draw rectangle
2. Effects → + → Drop Shadow
3. Set X, Y, Blur, Color
4. Click style icon → Create style
5. Name it (e.g., `shadow/sm`)

---

## 🧱 Component Library (14 Components)

**Total Components:** 14 (8 core + 6 accessibility components from Phase 1.5)

**Core UI Components (Original - Phase 1):**
1. Button (Primary)
2. Button (Secondary)
3. Icon Button
4. Select Dropdown
5. Code Panel
6. Documentation Panel
7. Quality Score Breakdown
8. Mobile Menu

**Accessibility Components (Phase 1.5 - Oct 2025):**
9. Error Banner
10. Confirmation Modal
11. Skip Navigation Link
12. Focus Indicator Pattern
13. Copy Button
14. Rate Limit Indicator

---

### Component 1: Button (Primary)

**Desktop Version (30 min):**

1. **Create Base**
   - Rectangle: 160 × 40px
   - Fill: Linear gradient
     - Stop 1 (0%): #A855F7
     - Stop 2 (100%): #9333EA
     - Angle: 90°
   - Corner radius: 8px
   - Effect: `shadow/purple`

2. **Add Auto Layout**
   - Select rectangle
   - Shift + A (Auto layout)
   - Direction: Horizontal
   - Padding: 24px horizontal, 8px vertical
   - Gap: 8px
   - Align: Center

3. **Add Icon**
   - Plugins → Iconify → Search "sparkles"
   - Choose Lucide icon
   - Resize to 16×16
   - Color: white (#FFFFFF)

4. **Add Text**
   - Text: "Generate Docs"
   - Style: `text/body-sm`
   - Color: white

5. **Create Component**
   - Select all → Ctrl/Cmd + Alt + K
   - Name: "Button/Primary"

6. **Add Variants**
   - Click "+" next to component name
   - Add property: "State"
   - Values: Default, Hover, Loading, Disabled
   - For Hover: Darken gradient to #9333EA → #7E22CE
   - For Loading: Replace text with spinner icon
   - For Disabled: Opacity 50%

**Result:** 
✅ Reusable button component with 4 states

---

### Component 2: Button (Secondary)

1. Duplicate Primary button
2. Change fill to solid: `color/slate/100`
3. Change text color: `color/slate/700`
4. Remove shadow
5. Create component: "Button/Secondary"
6. Add same 4 variants

---

### Component 3: Icon Button

1. Square: 40 × 40px
2. Fill: Transparent
3. Corner radius: 8px
4. Add icon (16×16, centered)
5. Create component: "Button/Icon"
6. Variant for hover: Fill `color/slate/100`

---

### Component 4: Select Dropdown

**Structure:**

1. **Container**
   - Rectangle: Auto width × 40px
   - Fill: `color/white`
   - Border: 1px, `color/slate/300`
   - Corner radius: 8px

2. **Add Auto Layout**
   - Padding: 12px horizontal, 8px vertical
   - Gap: 8px
   - Horizontal direction

3. **Add Text**
   - Text: "README.md"
   - Style: `text/body-sm`
   - Color: `color/slate/700`

4. **Add Chevron Icon**
   - Iconify → Search "chevron-down"
   - 16×16, color: `color/slate/600`

5. **Create Component**
   - Name: "Select/Dropdown"
   - Variants: Default, Open, Disabled

---

### Component 5: Code Panel

**This is a complex component. Build in sections:**

#### Section 1: Header (20 min)

1. **Frame**: 600 × 48px
2. **Add Auto Layout**
   - Direction: Horizontal
   - Justify: Space-between
   - Padding: 16px
   - Fill: `color/slate/50`

3. **Left Side**
   - Frame with horizontal auto layout
   - Traffic lights (3 circles, 12×12):
     - Red: #F87171
     - Yellow: #FBBF24
     - Green: #34D399
   - Gap: 8px
   - Text: "auth-service.js"
   - Style: `text/body-sm`, `color/slate/600`

4. **Right Side**
   - Text: "JavaScript"
   - Style: `text/body-xs`, `color/slate/500`

5. **Add Border**
   - Bottom border: 1px, `color/slate/200`

#### Section 2: Body (10 min)

1. **Frame**: 600 × 400px
2. **Fill**: `color/white`
3. **Add Code Text**
   - Use `text/code-sm` style
   - Color: `color/slate/800`
   - Sample code:
```javascript
// Sample code
export class AuthService {
  async login(email, password) {
    return token;
  }
}
```

#### Section 3: Footer (10 min)

1. **Frame**: 600 × 36px
2. **Fill**: `color/slate/50`
3. **Border**: Top 1px, `color/slate/200`
4. **Auto Layout**: Horizontal, space-between
5. **Left Text**: "25 lines • 589 chars"
6. **Right Group**:
   - Zap icon (12×12, `color/purple/500`)
   - Text: "Ready to analyze"
   - Style: `text/body-xs`

#### Combine Sections:

1. Select all 3 sections
2. Frame → Name: "Panel/Code"
3. Add vertical auto layout (gap: 0)
4. Corner radius: 12px
5. Effect: `shadow/base`
6. Border: 1px, `color/slate/200`
7. Create component

---

### Component 6: Documentation Panel

**Similar to Code Panel, but:**

1. **Header**
   - Background: `color/purple/50`
   - Border: `color/purple/200`
   - Icon: Sparkles (purple)
   - Title: "Generated Documentation"

2. **Quality Score Badge** (new element)
   - Frame: Auto × 28px
   - Fill: `color/white`
   - Border: 1px, `color/purple/200`
   - Corner radius: 8px
   - Padding: 12px horizontal
   - Text: "Quality: 92/100"
   - Styles: `text/body-xs` + `text/label-bold` (for number)

3. **Body**
   - Markdown-style text
   - Headers, code blocks, bullets

4. **Footer**
   - Checkmarks for completed criteria
   - Warning icons for missing
   - "View full report" button

5. Create component: "Panel/Documentation"

---

### Component 7: Quality Score Breakdown

**Modal/Expandable Section:**

1. **Container**
   - Frame: 400 × Auto
   - Fill: `color/white`
   - Corner radius: 12px
   - Effect: `shadow/md`
   - Border: 1px, `color/slate/200`

2. **Header**
   - Text: "Quality Breakdown"
   - Style: `text/heading-lg`
   - Close button (X icon)

3. **Criteria List**
   - 5 rows, each with:
     - Icon (✓ green or ! yellow)
     - Label (e.g., "Overview")
     - Points (e.g., "20/20")
     - Progress bar (visual)

4. **Suggestions**
   - Bullet list of improvements
   - Use `text/body-sm`

5. Create component: "Modal/QualityBreakdown"

---

### Component 8: Mobile Menu

1. **Hamburger Icon Button**
   - 40×40 square
   - Menu icon (20×20)
   - Create variants: Closed (Menu), Open (X)

2. **Dropdown Menu**
   - Frame: 100% width × Auto height
   - Fill: `color/white`
   - Border top: 1px, `color/slate/200`
   - Vertical auto layout
   - Padding: 16px
   - Gap: 8px

3. **Menu Items**
   - Full-width buttons
   - Left-aligned text
   - Hover state: `color/slate/50` background

4. Create component: "Nav/MobileMenu"

---

### Component 9: Error Banner (Accessibility - Phase 1.5)

**Purpose:** Inline error notifications with smooth animations and ARIA support

1. **Container Frame**
   - Width: Fill container (100%)
   - Auto layout: Horizontal
   - Padding: 16px
   - Gap: 16px
   - Border radius: 8px
   - Fill: `color/red/50`
   - Shadow: `shadow/sm`

2. **Error Icon**
   - Icon: AlertCircle (Lucide)
   - Size: 20×20
   - Color: `color/red/600`
   - Flex: 0 (fixed width)
   - Add `aria-hidden="true"` note

3. **Content Area**
   - Auto layout: Vertical
   - Gap: 4px
   - Flex: 1 (flexible width)

   **Error Heading:**
   - Text: "Invalid Request Error" (example)
   - Style: `text/label-medium`
   - Color: `color/red/900`

   **Error Message:**
   - Text: "Detailed error message here..."
   - Style: `text/body-sm`
   - Color: `color/red/800`
   - Line height: Relaxed (22px)

   **Retry After (Optional):**
   - Border top: 1px, `color/red/200`
   - Padding top: 12px
   - Margin top: 12px
   - Text: "⚫ Please wait 60 seconds before trying again."
   - Style: `text/body-xs`
   - Color: `color/red/600`
   - Font weight: Medium (500)

4. **Dismiss Button**
   - Size: 32×32
   - Icon: X (16×16)
   - Color: `color/red/400`
   - Hover: `color/red/600` + `color/red/100` background
   - Border radius: 6px
   - Padding: 8px
   - Add `aria-label="Dismiss error"` note

5. **Animation Specs**
   - **Enter:** 250ms slide-in + fade
   - **Exit:** 200ms fade-out
   - **Motion-safe:** Respects `prefers-reduced-motion`

6. **ARIA Attributes** (add as annotations)
   - `role="alert"`
   - `aria-live="assertive"`

7. Create component: "UI/ErrorBanner"

---

### Component 10: Confirmation Modal (Accessibility - Phase 1.5)

**Purpose:** Warning dialog for large file submissions

1. **Backdrop**
   - Full screen: 100vw × 100vh
   - Fill: Black with 50% opacity
   - Position: Fixed, z-index: 50

2. **Modal Container**
   - Width: 480px (max)
   - Auto layout: Vertical
   - Padding: 32px
   - Gap: 24px
   - Border radius: 16px
   - Fill: `color/white`
   - Shadow: `shadow/xl`
   - Position: Centered

3. **Icon**
   - Icon: AlertTriangle (Lucide)
   - Size: 48×48
   - Color: `color/yellow/600`
   - Center-aligned

4. **Heading**
   - Text: "Large File Submission"
   - Style: `text/heading-xl`
   - Color: `color/slate/900`
   - Text align: Center

5. **Description**
   - Text: "You're about to generate documentation for..."
   - Style: `text/body-base`
   - Color: `color/slate/600`
   - Text align: Center
   - Line height: 24px

6. **Stats Card**
   - Auto layout: Horizontal, space-between
   - Padding: 16px
   - Gap: 24px
   - Border radius: 12px
   - Fill: `color/slate/50`
   - Border: 2px, `color/purple/200`

   **Each Stat:**
   - Auto layout: Vertical, center-aligned
   - Gap: 4px

   **Value:**
   - Text: "1,303" (example)
   - Font size: 28px
   - Font weight: Bold (700)
   - Color: `color/purple/600`

   **Label:**
   - Text: "Lines" (example)
   - Style: `text/body-xs`
   - Color: `color/slate/600`

7. **Actions (Auto layout: Horizontal)**
   - Gap: 12px
   - Full width

   **Cancel Button:**
   - Component instance: Button/Secondary
   - Text: "Cancel"
   - Flex: 1

   **Confirm Button:**
   - Component instance: Button/Primary
   - Text: "Continue Anyway"
   - Flex: 1

8. **ARIA Attributes** (add as annotations)
   - `role="dialog"`
   - `aria-modal="true"`
   - `aria-labelledby="modal-title"`
   - Focus trap implemented

9. Create component: "UI/ConfirmationModal"

---

### Component 11: Skip Navigation Link (Accessibility - Phase 1.5)

**Purpose:** Keyboard users can bypass navigation and jump to main content

1. **Link Button**
   - Width: Auto (intrinsic)
   - Padding: 12px 20px
   - Border radius: 6px
   - Fill: `color/purple/600`
   - Text: "Skip to main content"
   - Style: `text/label-medium`
   - Color: `color/white`

2. **States:**
   - **Default:** Screen reader only (invisible)
   - **Focus:** Visible, positioned at top-left
   - **Hover (when focused):** `color/purple/700`

3. **Position Specs:**
   - Position: Absolute
   - Top: 16px
   - Left: 16px
   - Z-index: 50

4. **Visual Indicator:**
   - Add annotation: "Hidden by default, visible on keyboard focus"
   - Add annotation: "Uses sr-only + focus:not-sr-only classes"

5. Create component: "A11y/SkipLink"

---

### Component 12: Focus Indicator Pattern (Accessibility - Phase 1.5)

**Purpose:** Visual indicator for keyboard navigation

**Global Focus Style:**
- **Ring:** 2px solid `color/purple/600`
- **Offset:** 2px from element edge
- **Border radius:** Matches element (inherit)
- **Apply to:** All interactive elements (buttons, links, inputs)

**High Contrast Mode:**
- **Ring:** 4px solid `color/purple/600`
- **Offset:** 2px

**Visual Example:**
1. Create any button
2. Duplicate it
3. Add outer ring: 2px stroke, `color/purple/600`, 2px offset
4. Label: "Focus State (Keyboard Only)"
5. Annotation: "Uses :focus-visible - only shows for keyboard"

---

### Component 13: Copy Button (Accessibility - Phase 1.5)

**Purpose:** One-click copy to clipboard with visual feedback

1. **Button Variants:**

   **Icon Only:**
   - Size: 32×32
   - Icon: Copy (16×16)
   - Colors: `color/slate/600` text, `color/slate/100` background
   - Hover: `color/purple/600` text, `color/purple/50` background
   - Border radius: 6px

   **With Label:**
   - Auto layout: Horizontal
   - Padding: 8px 12px
   - Gap: 8px
   - Icon: Copy (16×16)
   - Text: "Copy"
   - Same color scheme

2. **Success State** (after copy):
   - Icon changes to: Check (16×16)
   - Color: `color/green/600`
   - Background: `color/green/50`
   - Text: "Copied!"
   - Duration: 2 seconds, then auto-reset

3. **Animation:**
   - Icon swap: 150ms scale transition
   - Color change: 200ms ease

4. **ARIA:**
   - `aria-label="Copy to clipboard"`
   - Add tooltip: "Copied!" on success

5. Create component: "UI/CopyButton" with variants

---

### Component 14: Rate Limit Indicator (Accessibility - Phase 1.5)

**Purpose:** Shows API usage and warns when limits approaching

1. **Container**
   - Auto layout: Horizontal
   - Padding: 12px 16px
   - Gap: 12px
   - Border radius: 8px
   - Fill: `color/yellow/50`
   - Border: 1px, `color/yellow/200`

2. **Warning Icon**
   - Icon: AlertTriangle (Lucide)
   - Size: 20×20
   - Color: `color/yellow/600`

3. **Content**
   - Auto layout: Vertical
   - Gap: 6px

   **Label:**
   - Text: "Rate Limit Warning"
   - Style: `text/label-medium`
   - Color: `color/yellow/900`

   **Message:**
   - Text: "Please wait before trying again"
   - Style: `text/body-sm`
   - Color: `color/yellow/800`

4. **Progress Bar (Optional)**
   - Width: 200px
   - Height: 4px
   - Border radius: 2px
   - Background: `color/yellow/200`

   **Fill:**
   - Fill: `color/yellow/600`
   - Width: Percentage based on time remaining
   - Animated: Smooth countdown

5. **ARIA Attributes:**
   - `role="status"`
   - `aria-live="polite"`
   - Progress bar: `role="progressbar"` with `aria-valuenow`

6. Create component: "UI/RateLimitIndicator"

---

## 🎯 Accessibility Design Patterns (Phase 1.5)

### Pattern 1: Keyboard Navigation Indicators

**Visual Design for Interactive States:**

**Default State:**
- No special indication
- Normal colors and styling

**Hover State (Mouse):**
- Subtle background change
- Color shift (e.g., `purple/600` → `purple/700`)
- Cursor: pointer

**Focus State (Keyboard):**
- Purple focus ring: 2px solid `color/purple/600`
- Ring offset: 2px
- Background stays default (no hover style on focus)
- **Key:** Focus ring should be MORE prominent than hover

**Active State (Click/Press):**
- Slight scale: 98%
- Brightness: 95%
- All states combined

### Pattern 2: Screen Reader Only Text

**Visual Indicator in Designs:**
- Create text layer
- Add red border/background to indicate "SR-only"
- Label: "Screen Reader Only: [text content]"
- Position where it logically belongs in DOM order

**Examples:**
- "Loading" text in buttons (hidden visually, read by SR)
- Form labels for inputs without visible labels
- Additional context for icons

**Implementation Note:**
- Uses `sr-only` class (position: absolute, width: 1px, height: 1px, clip)

### Pattern 3: Live Regions (Dynamic Content)

**Visual Indicators:**
- Add megaphone icon or "LIVE" badge to designs
- Annotation: "Announces changes to screen readers"
- Color: `color/indigo/600`

**Usage:**
- Error messages (assertive)
- Success toasts (polite)
- Loading states (polite)
- Status updates (polite)

**ARIA Roles:**
- `role="alert"` (assertive) - interrupts immediately
- `role="status"` (polite) - announces when convenient
- `aria-live="assertive|polite|off"`

### Pattern 4: Modal Focus Management

**Design Specifications:**

**Modal Open:**
1. Backdrop appears with fade (200ms)
2. Modal slides up and fades in (250ms)
3. Focus moves to first focusable element (close button)
4. Background content: aria-hidden="true"

**Focus Trap:**
- User can only Tab within modal
- Tab from last element → first element (loops)
- Shift+Tab from first → last element (reverse loop)
- Escape key closes modal

**Visual Design:**
- Add flow arrows showing Tab order
- Annotate: "Focus trapped inside modal"
- Mark close button as "Focus target on open"

**Modal Close:**
1. Modal fades out (200ms)
2. Backdrop fades out (200ms)
3. Focus returns to trigger element
4. Background content: aria-hidden removed

### Pattern 5: Icon Accessibility

**Decorative Icons:**
- Add annotation: `aria-hidden="true"`
- No additional text needed
- Examples: Icons next to labeled buttons, purely visual elements

**Meaningful Icons:**
- Add annotation: `aria-label="[description]"`
- Provide text alternative
- Examples: Icon-only buttons, status indicators

**Icon + Text Combos:**
- Icon: `aria-hidden="true"`
- Text provides full context
- Example: Button with icon and "Copy" text

### Pattern 6: Color + Non-Color Indicators

**Never rely on color alone:**

**Quality Scores (A-F):**
- ✅ Color: Green (A), Red (F)
- ✅ Letter: "A", "F"
- ✅ Text label: "(Excellent)", "(Failing)"

**Status Indicators:**
- ✅ Color: Green, Yellow, Red
- ✅ Icon: CheckCircle, AlertTriangle, XCircle
- ✅ Text: "Success", "Warning", "Error"

**Form Validation:**
- ✅ Color: Red border
- ✅ Icon: AlertCircle
- ✅ Text: Error message below field

**Design Checklist:**
- [ ] Every colored state has a non-color indicator
- [ ] Works in grayscale
- [ ] Works for colorblind users

---

## 📐 Layout Construction

### Desktop Layout (1440px) - 2 hours

**Step 1: Header (20 min)**

1. Frame: 1440 × 64px
2. Auto layout: Horizontal, space-between
3. Padding: 24px
4. Fill: `color/white`
5. Border bottom: 1px, `color/slate/200`

**Left Section:**
- Logo (40×40 rounded square, purple gradient)
- Icon: FileCode2 (24×24, white)
- Title: "CodeScribe AI" (`text/heading-xl`)
- Subtitle: "Intelligent Code Documentation" (`text/body-xs`, `color/slate/500`)

**Right Section:**
- "Examples" button (instance of Button/Secondary)
- "Docs" button (instance of Button/Secondary)
- "Sign In" button (dark: `color/slate/900` fill, white text)

**Step 2: Control Bar (20 min)**

1. Frame: 1344 × 72px (with margins)
2. Auto layout: Horizontal, space-between
3. Padding: 16px
4. Fill: `color/white`
5. Border: 1px, `color/slate/200`
6. Corner radius: 12px
7. Effect: `shadow/sm`
8. Margin top: 24px

**Left Side:**
- "Upload Files" button (Button/Secondary instance)
- "Import from GitHub" button (Button/Secondary instance)
- Divider (1px × 24px, `color/slate/300`)
- Select dropdown (Select/Dropdown instance)

**Right Side:**
- "Generate Docs" button (Button/Primary instance)

**Step 3: Split View (60 min)**

1. Frame: 1344 × 600px
2. Auto layout: Horizontal
3. Gap: 16px
4. Margin top: 16px

**Left Panel:**
- Insert instance of "Panel/Code"
- Set width: 50% (use constraints)

**Right Panel:**
- Insert instance of "Panel/Documentation"
- Set width: 50%

**Step 4: Assemble**

1. Select all (Header, Control Bar, Split View)
2. Frame selection
3. Name: "Desktop - Main"
4. Set background: `color/slate/50`
5. Apply layout grid

---

### Mobile Layout (375px) - 1.5 hours

**Adaptations:**

**Header:**
- Remove "Examples" and "Docs" buttons
- Hide tagline
- Add mobile menu button (instance of Nav/MobileMenu)
- Reduce padding to 16px

**Control Bar:**
- Stack vertically (change auto layout direction)
- Full-width buttons
- Shorten labels:
  - "Upload Files" → "Upload"
  - "Import from GitHub" → "GitHub"
- Select dropdown full-width
- Generate button full-width, larger hit area

**Split View:**
- Change to vertical auto layout
- Stack panels (Code on top, Docs below)
- Fixed height: 400px each
- Add scrolling

**Mobile Menu (when open):**
- Insert below header
- Full-width dropdown
- Menu items:
  - Examples
  - Documentation
  - API Access
  - GitHub Repo

---

## 🎨 Interactions & Prototyping

### Add Prototype Flows (30 min)

**Button Hover States:**
1. Select Button/Primary component
2. Open Prototype panel
3. On variant "Default" → While hovering → Change to "Hover"
4. Animation: Instant
5. Repeat for all buttons

**Generate Button Click:**
1. On "Generate Docs" button click
2. Navigate to → Same frame (to show loading state)
3. Change button variant to "Loading"
4. After delay (2000ms) → Change Panel/Documentation to show results

**Mobile Menu Toggle:**
1. On hamburger menu click
2. Change to → "Open" variant
3. Show mobile dropdown
4. Animation: Dissolve, 200ms

**Quality Score Animation:**
1. After generation completes
2. Animate score from 0 → 92
3. Smart animate, ease-out, 500ms

---

## 🎯 Design System Checklist

Before finalizing:

### Colors
- [ ] All colors are styles (not raw hex)
- [ ] Naming follows convention
- [ ] Semantic colors defined
- [ ] Contrast ratios checked (use Stark plugin)

### Typography
- [ ] All text uses styles
- [ ] Fonts installed and loading
- [ ] Line heights set correctly
- [ ] Letter spacing adjusted

### Components
- [ ] All 14 components created (8 core + 6 accessibility)
- [ ] Variants cover all states (default, hover, focus, active, disabled)
- [ ] ARIA annotations added to accessibility components
- [ ] Focus states use purple ring (2px, 2px offset)
- [ ] Decorative icons marked with aria-hidden notes
- [ ] Interactive icons have aria-label annotations
- [ ] Auto layout used throughout
- [ ] Constraints set for responsive behavior

### Shadows
- [ ] All shadows are styles
- [ ] Consistently applied
- [ ] Not too heavy

### Spacing
- [ ] Consistent padding/gaps (multiples of 4px)
- [ ] Auto layout everywhere
- [ ] Margins follow grid

---

## 🚀 Export & Handoff

### For Development

1. **Select All Frames**
2. Right panel → Export
3. Format: PNG, 2x scale
4. Export

### For Documentation

1. **Screenshot Each Component**
2. Export specs:
   - Colors (with hex codes)
   - Typography (font, size, weight)
   - Spacing (padding, gaps)
   - Shadows

### Share with Developer

1. Click "Share" button
2. Set permissions: Can view
3. Copy link
4. Enable "Dev Mode" toggle
5. Developer can inspect and extract CSS

---

## 🎨 Pro Tips

### Speed Up Design

1. **Use Plugins**
   - Iconify for icons
   - Stark for accessibility
   - Content Reel for placeholder text

2. **Keyboard Shortcuts**
   - `F`: Frame
   - `R`: Rectangle
   - `T`: Text
   - `Shift + A`: Auto layout
   - `Cmd/Ctrl + D`: Duplicate
   - `Cmd/Ctrl + G`: Group
   - `Cmd/Ctrl + Alt + K`: Create component

3. **Copy Styles Quickly**
   - Select element with style
   - `Cmd/Ctrl + Alt + C`: Copy style
   - Select target element
   - `Cmd/Ctrl + Alt + V`: Paste style

### Maintain Consistency

1. **Use Styles for Everything**
   - Never use raw colors/text
   - Always create and apply styles

2. **Name Logically**
   - Follow naming conventions
   - Use folders/slashes for organization

3. **Document Decisions**
   - Add notes to design system page
   - Explain color usage
   - Show component examples

---

## ✅ Final Deliverables

After completing this guide, you'll have:

✅ Complete design system with all styles
✅ Component library (8+ components with variants)
✅ Desktop mockup (1440px)
✅ Mobile mockup (375px)
✅ Interactive prototype
✅ Export-ready assets
✅ Developer handoff link

**Time Investment:** 4-6 hours  
**Result:** Production-ready design system

---

## 💻 Implementation Guide for Developers

### Tailwind CSS Configuration

The brand colors are already configured in `client/tailwind.config.js`. Use these Tailwind utilities in your components:

#### Primary Brand (Purple)
```jsx
// Buttons
<button className="bg-purple-600 hover:bg-purple-700 text-white">
  Primary Action
</button>

// Text/Links
<a className="text-purple-600 hover:text-purple-700">
  Learn More
</a>

// Backgrounds
<div className="bg-purple-50 border border-purple-200">
  Light purple container
</div>
```

#### Secondary Brand (Indigo)
```jsx
// Secondary buttons
<button className="bg-indigo-600 hover:bg-indigo-700 text-white">
  Secondary Action
</button>

// Technical badges
<span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
  Technical Feature
</span>
```

#### Semantic Colors
```jsx
// Success alert
<div className="bg-green-50 border border-green-200 text-green-600">
  Success message
</div>

// Warning alert
<div className="bg-yellow-50 border border-yellow-200 text-yellow-600">
  Warning message
</div>

// Error alert
<div className="bg-red-50 border border-red-200 text-red-600">
  Error message
</div>
```

#### Neutral (Slate)
```jsx
// Page background
<div className="bg-slate-50">

// Card backgrounds
<div className="bg-white border border-slate-200">

// Text hierarchy
<h1 className="text-slate-900">Main Heading</h1>
<p className="text-slate-700">Body text</p>
<span className="text-slate-500">Subtle text</span>
```

### Available Color Utilities

**Purple:** `purple-50`, `purple-100`, `purple-200`, `purple-500`, `purple-600`, `purple-700`
**Indigo:** `indigo-50`, `indigo-100`, `indigo-200`, `indigo-500`, `indigo-600`, `indigo-700`
**Slate:** `slate-50`, `slate-100`, `slate-200`, `slate-300`, `slate-500`, `slate-600`, `slate-700`, `slate-800`, `slate-900`
**Green:** `green-50`, `green-100`, `green-600`, `green-700`
**Yellow:** `yellow-50`, `yellow-100`, `yellow-600`, `yellow-700`
**Red:** `red-50`, `red-100`, `red-600`, `red-700`

### Color Naming in Code

For semantic colors, you can use descriptive names that map to the Tailwind colors:

```javascript
const semanticColors = {
  success: 'green-600',
  warning: 'yellow-600',
  error: 'red-600',
  successBg: 'green-50',
  warningBg: 'yellow-50',
  errorBg: 'red-50',
};
```

### Accessibility Requirements

**Always use these shades for text on white backgrounds:**
- Purple: `purple-600` or darker
- Indigo: `indigo-600` or darker
- Slate: `slate-600` or darker
- Green: `green-600` or `green-700`
- Yellow: `yellow-600` or `yellow-700`
- Red: `red-600` or `red-700`

**Never use:**
- Light shades (50, 100, 200) for text
- `red-400` (old error color - not accessible)

### Testing Colors

Use the brand color palette reference:

**Interactive HTML (recommended for development):**
- File: `docs/design/brand-color-palette.html`
- Features: Click-to-copy hex codes, interactive color swatches
- View all colors visually
- Copy hex codes instantly
- Verify usage guidelines
- Check accessibility notes

**PDF Version (for sharing/printing):**
- File: `docs/design/brand-color-palette.pdf`
- Use for presentations, stakeholder reviews, printing

Open in your browser:
```bash
# Interactive HTML version
open docs/design/brand-color-palette.html

# PDF version
open docs/design/brand-color-palette.pdf
```

---

## 📚 Resources

**Learn More:**
- Figma Tutorial: https://help.figma.com/hc/en-us/categories/360002051613
- Auto Layout Guide: https://help.figma.com/hc/en-us/articles/360040451373
- Component Guide: https://help.figma.com/hc/en-us/articles/360038662654

**Inspiration:**
- Dribbble (search "code editor"): https://dribbble.com
- Mobbin (app design patterns): https://mobbin.com

**Plugins to Install:**
- **Iconify** - Icon library
- **Stark** - Accessibility checker
- **Content Reel** - Placeholder content
- **Figmotion** - Advanced animations (optional)

---

---

## 🚀 Phase 2+ UI Components (Future Features)

**Status:** Planning guide for designing features from [ROADMAP.md](roadmap/ROADMAP.md)

### Authentication UI (Phase 2.1)

**Reference:** [TODO.md Epic 2.1](TODO.md#epic-21-authentication--user-management)

#### Component 15: Login Modal

**Specifications:**

1. **Modal Container**
   - Width: 480px
   - Auto layout: Vertical
   - Padding: 32px
   - Gap: 24px
   - Border radius: 16px
   - Fill: `color/white`
   - Shadow: `shadow/xl`
   - Backdrop: Black 50% opacity

2. **Header**
   - Logo icon (40×40)
   - Heading: "Welcome to CodeScribe AI"
   - Style: `text/heading-xl`
   - Subtext: "Sign in to continue"
   - Style: `text/body-sm`, `color/slate/600`

3. **GitHub OAuth Button**
   - Auto layout: Horizontal
   - Padding: 12px 24px
   - Gap: 12px
   - Fill: `color/slate/900`
   - Icon: GitHub logo (20×20, white)
   - Text: "Continue with GitHub"
   - Full width
   - Border radius: 8px

4. **Divider**
   - Line: 1px, `color/slate/200`
   - Text: "or sign in with email"
   - Style: `text/body-xs`, `color/slate/500`

5. **Email/Password Form**
   - Input fields:
     - Email input (with icon)
     - Password input (with show/hide toggle)
     - Each: 48px height, `color/white` fill, `color/slate/300` border
   - "Forgot password?" link (right-aligned, `color/purple/600`)
   - Gap: 16px

6. **Sign In Button**
   - Instance of Button/Primary
   - Text: "Sign In"
   - Full width

7. **Footer**
   - Text: "Don't have an account?"
   - Link: "Sign up" (`color/purple/600`)
   - Center-aligned

8. **ARIA Annotations:**
   - `role="dialog"`
   - `aria-modal="true"`
   - `aria-labelledby="login-modal-title"`
   - Focus trap on open

**Create component:** "Auth/LoginModal"

---

#### Component 16: Signup Modal

**Similar to Login Modal with additions:**

1. **Additional Fields:**
   - Full Name input
   - Confirm Password input

2. **Terms Checkbox:**
   - Checkbox: 20×20, `color/slate/300` border
   - Label: "I agree to Terms of Service and Privacy Policy"
   - Links: `color/purple/600`

3. **Button Text:** "Create Account"

**Create component:** "Auth/SignupModal"

---

#### Component 17: User Profile Menu

**Dropdown from Header:**

1. **Trigger Button**
   - Size: 40×40
   - Border radius: 20px (circular)
   - Fill: `color/purple/100`
   - Text: User initials (e.g., "JD")
   - Color: `color/purple/700`
   - Font weight: Semibold

2. **Dropdown Panel**
   - Width: 280px
   - Auto layout: Vertical
   - Padding: 8px
   - Gap: 4px
   - Border radius: 12px
   - Fill: `color/white`
   - Shadow: `shadow/md`
   - Border: 1px, `color/slate/200`

3. **User Info Section**
   - Padding: 12px
   - Auto layout: Vertical
   - Gap: 4px

   **Name:**
   - Style: `text/label-medium`
   - Color: `color/slate/900`

   **Email:**
   - Style: `text/body-xs`
   - Color: `color/slate/600`

   **Tier Badge:**
   - Background: `color/purple/100`
   - Text: "Pro Plan"
   - Padding: 4px 8px
   - Border radius: 6px
   - Style: `text/body-xs`, `color/purple/700`

4. **Divider:** 1px, `color/slate/200`

5. **Menu Items**
   - Each item: 48px height
   - Padding: 12px
   - Gap: 12px
   - Hover: `color/slate/50`

   **Items:**
   - Account Settings (Settings icon)
   - Usage & Billing (CreditCard icon)
   - Documentation (Book icon)
   - Support (HelpCircle icon)
   - Divider
   - Sign Out (LogOut icon, `color/red/600`)

**Create component:** "Auth/UserMenu"

---

### Payment UI (Phase 2.4)

**Reference:** [TODO.md Epic 2.4](TODO.md#epic-24-payment-integration)

#### Component 18: Pricing Card

**Specifications:**

1. **Container**
   - Width: 360px
   - Auto layout: Vertical
   - Padding: 32px
   - Gap: 24px
   - Border radius: 16px
   - Border: 2px, `color/purple/200`
   - Fill: `color/white`
   - Hover: Shadow `shadow/md`, border `color/purple/400`

2. **Header**
   - Tier Name: "Pro"
   - Style: `text/heading-xl`
   - Badge (optional): "Most Popular"
     - Fill: `color/purple/100`
     - Text: `color/purple/700`

3. **Price**
   - Large number: "$9"
   - Font size: 48px, weight: Bold
   - Color: `color/slate/900`
   - Per month text: "/month"
   - Style: `text/body-sm`, `color/slate/600`

4. **Features List**
   - Auto layout: Vertical
   - Gap: 12px

   **Each Feature:**
   - Icon: Check (16×16, `color/green/600`)
   - Text: Feature description
   - Style: `text/body-sm`

5. **CTA Button**
   - Instance of Button/Primary
   - Text: "Upgrade to Pro"
   - Full width

6. **Variants:**
   - Free tier: Border `color/slate/200`
   - Pro tier: Border `color/purple/200` (featured)
   - Team tier: Border `color/indigo/200`
   - Enterprise: Border `color/slate/900`

**Create component:** "Payment/PricingCard"

---

### Dark Mode UI (Phase 3.1)

**Reference:** [ROADMAP.md Phase 3](roadmap/ROADMAP.md#-phase-3-ux-enhancements-planned)

#### Dark Mode Color Palette (Create Additional Styles)

**Dark Background Colors:**
```
dark/bg-primary: #0F172A  (slate-900)
dark/bg-secondary: #1E293B  (slate-800)
dark/bg-tertiary: #334155  (slate-700)
```

**Dark Text Colors:**
```
dark/text-primary: #F1F5F9  (slate-100)
dark/text-secondary: #CBD5E1  (slate-300)
dark/text-tertiary: #94A3B8  (slate-400)
```

**Dark Borders:**
```
dark/border: #334155  (slate-700)
dark/border-hover: #475569  (slate-600)
```

**Create Variants:**
- For each existing component, add "Theme" property
- Values: Light (default), Dark
- Dark variants use dark color palette

---

## 📝 Version History

**Document Version:** 3.0
**Last Updated:** October 23, 2025
**Location:** Moved from `docs/planning/mvp/07-Figma-Guide.md` to `docs/planning/FIGMA-DESIGN-GUIDE.md`

**Changes in v3.0:**
- Moved to planning folder for easier access when designing Phase 2-6 features
- Added **Phase 2+ UI Components** section (auth, payment, dark mode)
- Added Component 15: Login Modal
- Added Component 16: Signup Modal
- Added Component 17: User Profile Menu
- Added Component 18: Pricing Card
- Added Dark Mode color palette specifications
- Updated overview to clarify use for current + future mockups
- Total components: 14 (Phase 1) + 4 (Phase 2+) = **18 components**

**Changes in v2.0:** (October 18, 2025)
- Added 6 accessibility components (Phase 1.5)
- Added Accessibility Design Patterns section
- Updated component library count (8 → 14 components)
- Added ARIA annotation guidelines
- Added focus indicator specifications
- Added animation specifications for Error Banner
- Updated component checklist with accessibility requirements

**Previous Version:** 1.0 (October 2025 - Pre-Accessibility)

---

**Happy Designing! 🎨**

**Need help?** Reference [ROADMAP.md](roadmap/ROADMAP.md) for feature details and [TODO.md](TODO.md) for implementation specs.