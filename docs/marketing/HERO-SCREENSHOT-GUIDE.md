# Hero Screenshot Creation Guide

## Overview

This guide walks you through creating the perfect hero screenshot for CodeScribe AI. This single image will be used across your website, LinkedIn featured image, Product Hunt, Twitter, and more.

**Time Required:** 20-30 minutes
**Output:** High-quality hero screenshot at 2560x1600px

---

## Pre-Flight Checklist (5 minutes)

### 1. Browser Setup
- [ ] Open Chrome or Safari (best rendering)
- [ ] Set browser zoom to **100%** (Cmd+0)
- [ ] Hide bookmarks bar (Cmd+Shift+B)
- [ ] Clear any browser extensions from toolbar
- [ ] Window size: **Maximize** or set to 1600x1000px minimum
- [ ] Close all other tabs (clean tab bar)

### 2. Disable Notifications
```bash
# macOS: Temporarily disable notifications
# System Settings → Notifications → Turn on "Do Not Disturb"
```

### 3. Prepare Demo Account

**Option A: Use Existing Account (Recommended)**
- Navigate to https://codescribeai.com
- Log in to your account
- Ensure you have Pro tier access (shows all features)

**Option B: Create Fresh Demo Account**
- Email: `demo@codescribeai.com` or similar professional email
- Name: "Demo User" or your actual name
- Verify email
- Upgrade to Pro tier (for screenshot purposes)

### 4. Set Realistic Usage Numbers

If your usage is at 0/200 or maxed out, adjust for realistic appearance:
- Ideal: 23/200, 47/200, 89/200 (shows active use but not maxed)
- Avoid: 0/200 (looks unused) or 200/200 (looks limited)

**Note:** If you can't adjust usage, it's okay - focus on the generated output quality.

### 5. Screen Resolution

- **Ideal:** 2560x1440 or higher (retina display)
- **Minimum:** 1920x1080
- Check current resolution: Apple menu → About This Mac → Display

---

## Step-by-Step Screenshot Creation

### Step 1: Choose Your Code Example (2 minutes)

**Best for Hero Shot: React Button Component**

This code is:
✅ Familiar to developers (React is widely used)
✅ Medium complexity (not too simple, not overwhelming)
✅ Visually clean (good syntax highlighting)
✅ Generates excellent documentation (85+ quality score)

**The Code:**
```javascript
import React from 'react';
import PropTypes from 'prop-types';

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick
}) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizeClasses = {
    small: 'text-sm px-3 py-1.5',
    medium: 'text-base px-4 py-2',
    large: 'text-lg px-6 py-3'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};
```

**Copy this code** and keep it ready in a text editor or clipboard.

**Alternative: Node.js API Endpoint** (if you want backend appeal)
See VISUAL-ASSET-CREATION-PLAN.md Example #2

---

### Step 2: Navigate to CodeScribe (1 minute)

1. Go to **https://codescribeai.com**
2. Ensure you're logged in
3. You should see the main editor interface
4. Clear any existing code from the editor (if present)

---

### Step 3: Paste Code and Configure (2 minutes)

1. **Paste the code** into the left editor panel
2. **Select doc type:** Choose **"README"** from dropdown
   - README generates the most visually appealing, comprehensive output
   - Shows headers, lists, code blocks, installation instructions
3. **Don't click Generate yet** - we want to prepare the window first

---

### Step 4: Position Your Window (3 minutes)

This is critical for a great screenshot!

**Window Positioning:**
- **Maximize browser window** (green button on Mac, or F11)
- Ensure the entire interface is visible:
  - Top: Logo, doc type selector, Generate button
  - Left: Code editor with your pasted code
  - Right: Output panel (will show docs after generation)
  - Bottom: Usage stats (if visible)

**Scroll Position in Code Editor:**
- Scroll so the **function signature** is visible at top
- You want to see: `export default function Button({`
- Don't scroll too far down - keep the component props visible

**Ideal Composition:**
```
┌─────────────────────────────────────────────────────┐
│ [Logo]  [README ▼]  [Generate Documentation] [User] │ ← Top bar
├──────────────────────┬──────────────────────────────┤
│ import React from... │ (Empty - will show docs)     │
│ import PropTypes...  │                              │
│                      │                              │
│ export default...    │                              │
│   children,          │         Output Panel         │
│   variant = 'prim... │      (After generation)      │
│   size = 'medium',   │                              │
│   disabled = false,  │                              │
│   onClick           │                              │
│ }) {                 │                              │
│   const baseClasses  │                              │
│   ...                │                              │
├──────────────────────┴──────────────────────────────┤
│ Usage: 23/200 docs this month               [Pro] ← │ Bottom
└─────────────────────────────────────────────────────┘
```

---

### Step 5: Generate Documentation (2 minutes)

1. **Click "Generate Documentation"** button
2. **Wait for generation to complete**
   - You'll see real-time streaming (words appearing)
   - Let it fully complete (typically 10-20 seconds)
3. **Wait for quality score to appear**
   - Score should appear at bottom of output (e.g., "87/100")
   - Grade badge should show (A, B+, B, etc.)

**If Quality Score is Below 85:**
- Regenerate (refresh page, paste code again)
- Try a different code example
- Quality score of 85-95 looks most impressive

---

### Step 6: Perfect the Composition (5 minutes)

Now that documentation is generated, adjust for the perfect screenshot:

#### Left Panel (Code)
- [ ] Scroll to show function signature at top
- [ ] Ensure syntax highlighting looks good
- [ ] All code is properly formatted (no weird line breaks)
- [ ] No horizontal scrollbar visible

#### Right Panel (Documentation)
- [ ] Scroll to show the top of the README
- [ ] Title and description should be visible
- [ ] At least one section heading visible (## Installation, ## Usage)
- [ ] Quality score badge visible near bottom

**Ideal scroll position for right panel:**
```
# Button Component          ← Title visible

A reusable Button component... ← Description visible

## Installation            ← First section visible

npm install...

## Usage

import Button from...

[More content below]

Quality Score: 87/100 [B+]  ← Score visible at bottom
```

#### Both Panels
- [ ] Both panels roughly equal width (50/50 split)
- [ ] No empty space or awkward gaps
- [ ] Text is readable (not too small)
- [ ] Colors look vibrant (syntax highlighting, purple theme)

---

### Step 7: Take the Screenshot (3 minutes)

#### macOS Built-in Screenshot

1. **Press Cmd+Shift+4**
2. **Your cursor becomes a crosshair**
3. **Press Spacebar** to switch to window capture mode
   - OR drag to select the entire browser content area
4. **Click on the browser window** (it will highlight)
5. **Screenshot saved to Desktop** as `Screen Shot YYYY-MM-DD at X.XX.XX PM.png`

**Tips:**
- Don't include the macOS menu bar or dock
- Do include the browser's top bar (address bar, tabs)
- Capture should be clean and professional

#### Alternative: CleanShot X (if you have it)

1. **Press Cmd+Shift+4** (or your custom shortcut)
2. **Drag to select area**
3. **CleanShot will auto-hide desktop icons**
4. **Save with annotation tools if needed**

---

### Step 8: Review and Refine (5 minutes)

Open your screenshot and check:

#### Technical Quality
- [ ] **Resolution:** At least 1920px wide (check image properties)
- [ ] **No blur:** Text is crisp and readable
- [ ] **Colors accurate:** Purple theme, syntax highlighting visible
- [ ] **No artifacts:** No compression or pixelation

#### Content Quality
- [ ] **Code is readable:** Can read function names and structure
- [ ] **Docs are readable:** Headers and text are clear
- [ ] **Quality score visible:** Number and grade are clear
- [ ] **No personal info:** No emails, API keys, or private data visible
- [ ] **No errors:** No console errors, red text, or broken UI
- [ ] **Professional:** Looks polished and production-ready

#### Composition Quality
- [ ] **Balanced:** Both panels have good content
- [ ] **Not too much:** Not overwhelming with text
- [ ] **Not too little:** Not mostly empty space
- [ ] **Story told:** Viewer understands: code goes in, docs come out

**If anything looks off:** Retake the screenshot (Steps 6-7)

---

### Step 9: Optimize for Web (3 minutes)

Your raw screenshot is likely 5-15 MB. Let's optimize for web use.

#### Option A: TinyPNG (Easiest)

1. Go to **https://tinypng.com**
2. **Drag and drop** your screenshot
3. **Wait for compression** (usually reduces 60-80%)
4. **Download** optimized image
5. **Rename** to `hero-light-mode.png`

**Result:** ~1-3 MB, perfect for web

#### Option B: ImageOptim (macOS)

```bash
# Install ImageOptim
brew install imageoptim

# Or download from: https://imageoptim.com

# Drag your screenshot onto ImageOptim app
# It will compress automatically
# Original file is replaced with optimized version
```

#### Option C: Command Line

```bash
# Install ImageOptim CLI
brew install imageoptim-cli

# Optimize the screenshot
imageoptim ~/Desktop/Screen\ Shot*.png

# Rename
mv ~/Desktop/Screen\ Shot*.png ~/Desktop/hero-light-mode.png
```

---

### Step 10: Create Variations (5 minutes)

Now that you have your hero screenshot, create variations for different uses:

#### 1. LinkedIn Featured Image (1584x396px)

LinkedIn featured images are wide and short. You'll need to crop:

**Using Preview (macOS):**
1. Open `hero-light-mode.png` in Preview
2. Tools → Adjust Size
3. Width: 1584px
4. Maintain aspect ratio: ✓ (checked)
5. Click OK
6. Tools → Select → Rectangular Selection
7. Drag to select central 1584x396px area
8. Tools → Crop
9. File → Export → `hero-linkedin-featured.png`

**Using Figma (Recommended for precision):**
1. Import your hero screenshot
2. Create frame: 1584x396px
3. Position screenshot to show best content
4. Focus on: Logo, code snippet, part of documentation
5. Export as PNG

**What to show in LinkedIn crop:**
- CodeScribe logo (left)
- Part of code editor (middle-left)
- Part of generated docs (middle-right)
- Quality score badge if possible (right)

#### 2. Twitter Image (1200x675px)

```bash
# Using ImageMagick (if installed)
brew install imagemagick

convert hero-light-mode.png -resize 1200x675^ -gravity center -extent 1200x675 hero-twitter.png
```

Or use online tool: **https://www.iloveimg.com/resize-image**

#### 3. Product Hunt Thumbnail (1270x760px)

Similar to Twitter, resize to 1270x760px maintaining the center content.

---

## Final Checklist

Before publishing your hero screenshot:

### Technical
- [ ] Resolution: 2560x1600px or higher
- [ ] File size: Under 3MB (after optimization)
- [ ] Format: PNG (not JPEG - preserves quality)
- [ ] Filename: `hero-light-mode.png` (clear naming)

### Content
- [ ] Code example is high-quality and realistic
- [ ] Generated documentation looks professional
- [ ] Quality score is 85+ (visible and impressive)
- [ ] No personal information visible
- [ ] No UI bugs or errors visible
- [ ] Text is readable at smaller sizes

### Composition
- [ ] Both code and docs visible
- [ ] Balanced layout (not too much white space)
- [ ] Key elements in focus (function signature, README title)
- [ ] Professional appearance
- [ ] Tells the story: "paste code → get docs"

### Variations Created
- [ ] Original hero (2560x1600px)
- [ ] LinkedIn featured (1584x396px)
- [ ] Twitter image (1200x675px) - optional
- [ ] Product Hunt thumbnail (1270x760px) - optional

---

## Using Your Hero Screenshot

### LinkedIn Featured Image

1. Go to **LinkedIn profile**
2. Click **"Add profile section"** → **"Featured"** → **"Media"**
3. Upload `hero-linkedin-featured.png`
4. Add description: "AI-powered documentation generator - Turn code into beautiful docs in seconds. Try free at codescribeai.com"
5. **Save**

**Pro tip:** LinkedIn featured images are the first thing people see when visiting your profile. Make it count!

### Website Hero Section

```html
<!-- Add to website hero -->
<img
  src="/assets/hero-light-mode.png"
  alt="CodeScribe AI interface showing React component code being transformed into comprehensive README documentation with quality score"
  width="2560"
  height="1600"
  loading="eager"
/>
```

### Product Hunt

When you launch on Product Hunt:
1. Upload `hero-light-mode.png` as **thumbnail** (gallery position 1)
2. This image appears in Product Hunt feed listings
3. Most important image - gets the most views

### Social Media

**Twitter:**
- Use for announcement tweet
- Crop to 1200x675px for optimal display
- Pin tweet to profile after launch

**LinkedIn:**
- Use in launch announcement post
- Also use as featured image (see above)
- Single image posts get more engagement than links

---

## Troubleshooting

### Screenshot is Blurry

**Problem:** Text appears fuzzy or pixelated

**Solutions:**
- Use a retina display (2560x1440 or higher)
- Ensure browser zoom is at 100% (Cmd+0)
- Use PNG format (not JPEG)
- Don't resize up (only resize down)

### Quality Score is Low (<85)

**Problem:** Generated docs scored 72/100 (C+)

**Solutions:**
- Regenerate (click Generate again)
- Try different code example
- Ensure code has good structure and comments
- Use examples from VISUAL-ASSET-CREATION-PLAN.md

### UI Looks Broken

**Problem:** Buttons misaligned, text overlapping, weird spacing

**Solutions:**
- Hard refresh browser (Cmd+Shift+R)
- Clear cache and reload
- Try incognito mode
- Update to latest browser version

### Can't See Whole Interface

**Problem:** Browser window too small, parts cut off

**Solutions:**
- Maximize browser window (green button on Mac)
- Increase screen resolution
- Zoom out in browser (Cmd+-)
- Use wider monitor or external display

### Colors Look Washed Out

**Problem:** Syntax highlighting or theme looks dull

**Solutions:**
- Check display color profile (System Settings → Display → Color Profile)
- Ensure you're in light mode (not dark mode) for this screenshot
- Adjust brightness and contrast
- Use better screenshot tool (CleanShot X)

### File Size Too Large (>10MB)

**Problem:** Screenshot is 15MB, too large to upload

**Solutions:**
- Use TinyPNG.com (easiest, free)
- Use ImageOptim (Mac app)
- Convert to JPEG at 90% quality (last resort)
- Resize to smaller dimensions (2000x1250 instead of 2560x1600)

---

## Next Steps

After creating your hero screenshot:

1. **Get feedback**
   - Share with 2-3 trusted people
   - Ask: "Is it clear what this product does?"
   - Iterate based on feedback

2. **Create dark mode version**
   - Toggle to dark mode in settings
   - Use same code example
   - Take another screenshot
   - Name it `hero-dark-mode.png`

3. **Create demo video**
   - Use same code example
   - Show the complete generation process
   - See VISUAL-ASSET-CREATION-PLAN.md for video script

4. **Publish assets**
   - Update website hero section
   - Upload to LinkedIn featured
   - Prepare for Product Hunt launch
   - Use in social media announcements

---

## Quick Reference

### Screenshot Sizes
- **Original hero:** 2560x1600px (or 1920x1200px minimum)
- **LinkedIn featured:** 1584x396px (wide/short crop)
- **Twitter:** 1200x675px (16:9 ratio)
- **Product Hunt:** 1270x760px (16:9-ish ratio)

### Keyboard Shortcuts
- **Screenshot area:** Cmd+Shift+4
- **Screenshot window:** Cmd+Shift+4, then Spacebar
- **Browser zoom reset:** Cmd+0
- **Maximize window:** Click green button (top-left)

### File Naming
- `hero-light-mode.png` - Original full resolution
- `hero-linkedin-featured.png` - LinkedIn featured image
- `hero-twitter.png` - Twitter optimized
- `hero-product-hunt.png` - Product Hunt thumbnail

---

**You're ready to create an amazing hero screenshot! 🚀**

Remember: This is your product's first impression. Take your time, get it right, and don't be afraid to retake it 5-10 times until it's perfect.

Good luck! 🎨
