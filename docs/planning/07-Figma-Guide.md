# CodeScribe AI - Complete Figma Design Guide

**Project:** CodeScribe AI  
**Designer Role:** UX/UI Designer  
**Timeline:** 4-6 hours  
**Deliverable:** Production-ready design system and mockups  

---

## 📋 Overview

This guide will help you recreate the CodeScribe AI interface in Figma with a professional, scalable design system. The design uses a modern SaaS aesthetic with developer-focused sensibilities.

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

### Step 5: Create Color Styles (10 min)

Go to Design System page:

1. Press `R` (Rectangle)
2. Create 50×50 square
3. Fill with color (see palette below)
4. Select square → Click fill color
5. Click "Style" icon (⊕) → Create style
6. Name it (e.g., "color/purple/500")
7. Repeat for all colors

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
```
green/600:  #16A34A  ← Success
yellow/600: #CA8A04  ← Warning
red/400:    #F87171  ← Error
```

**Create in Figma:**
1. Make 50×50 squares for each
2. Apply color
3. Select → Style icon → Create style
4. Use naming convention: `color/[group]/[number]`

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

## 🧱 Component Library

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
- [ ] All interactive elements are components
- [ ] Variants cover all states
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

**Happy Designing! 🎨**