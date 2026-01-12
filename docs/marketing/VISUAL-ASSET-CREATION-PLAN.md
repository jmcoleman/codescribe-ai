# Visual Asset Creation Plan - Product Launch

## Overview

This guide provides a complete plan for creating visual assets for CodeScribe AI's product launch. All assets are designed to showcase the product's core value proposition: "Generate beautiful documentation from code in seconds."

**Total Estimated Time:** 3-4 hours
**Deliverables:** 8 screenshots, 1 demo video, 3 feature GIFs
**Tools Needed:** Browser, screen recorder, image editor (optional)

---

## Pre-Production Checklist

### Environment Setup

Before creating any assets:

- [ ] **Clear browser state**
  - Clear cache and cookies
  - Disable browser extensions (except necessary dev tools)
  - Hide bookmarks bar
  - Set zoom to 100%

- [ ] **Prepare demo account**
  - Create fresh account with clean username (e.g., "demo@codescribeai.com")
  - Set display name to "Demo User" or professional name
  - Ensure Pro tier access for showcasing all features
  - Reset usage stats to realistic numbers (not 0, not maxed out)

- [ ] **Configure appearance**
  - Test both light and dark modes
  - Ensure proper contrast and readability
  - Verify all fonts load correctly
  - Check that all icons render properly

- [ ] **Prepare example code**
  - Select 3-5 high-quality code samples (see "Example Code Library" below)
  - Test each sample generates good output
  - Verify quality scores are 85+ (looks impressive)
  - Save samples in easily accessible location

- [ ] **Screen recording setup**
  - Test microphone (if doing voiceover)
  - Close unnecessary applications
  - Disable notifications (System Preferences → Notifications)
  - Set screen resolution to 1920x1080 or 2560x1440
  - Test cursor visibility and smoothness

### Display Settings

- **Resolution:** 1920x1080 minimum (2560x1440 preferred for retina)
- **Scaling:** 100% (no browser zoom)
- **Window size:** Full screen or consistent 1600x1000px
- **Cursor:** Visible, smooth movement, no acceleration
- **Audio:** Quiet environment, good microphone

---

## Asset List & Specifications

### Priority 1: Must-Have Assets (90 minutes)

#### 1. Hero Screenshot - Main Interface
**Filename:** `hero-light-mode.png`
**Dimensions:** 2560x1600px (or 1920x1200px minimum)
**Purpose:** Primary marketing image, website hero, social media
**Time:** 20 minutes

**Composition:**
- **Left panel:** Monaco editor with example code (React component)
- **Top bar:** Logo, doc type selector showing "README", Generate button
- **Right panel:** Generated README with:
  - Clear heading structure
  - Code examples with syntax highlighting
  - Quality score badge (85-95/100) visible
  - "A" or "B" grade displayed
- **Bottom:** Usage stats showing realistic numbers (e.g., 23/200 docs used)

**Checklist:**
- [ ] Code is realistic and production-quality
- [ ] All text is readable at thumbnail size
- [ ] Quality score is prominently visible
- [ ] No personal information visible
- [ ] UI looks polished (no bugs, misalignments)
- [ ] Scroll position shows most important content
- [ ] Browser chrome visible (shows it's a real web app)

**Steps:**
1. Open CodeScribe in Chrome/Safari
2. Paste React component from Example Code Library (#1)
3. Select "README" doc type
4. Click "Generate Documentation"
5. Wait for generation to complete
6. Scroll to show quality score
7. Take screenshot (Cmd+Shift+4 on Mac, select area)
8. Save as `hero-light-mode.png`

---

#### 2. Demo Video - Complete Workflow
**Filename:** `demo-video-60s.mp4`
**Duration:** 45-60 seconds
**Resolution:** 1920x1080 @ 30fps minimum
**Purpose:** Product Hunt, social media, landing page
**Time:** 45 minutes (recording + editing)

**Script & Timing:**
```
[0:00-0:03] Open CodeScribe AI (fade in from logo)
[0:03-0:05] Show clean interface, empty editor
[0:05-0:08] Paste code (React component, smooth paste animation)
[0:08-0:10] Select "README" from doc type dropdown
[0:10-0:12] Click "Generate Documentation" button
[0:12-0:22] Watch real-time streaming (10 seconds of generation)
            Show words appearing line by line
            Highlight syntax in generated output
[0:22-0:25] Generation completes, show full documentation
[0:25-0:28] Scroll to reveal quality score: 87/100 (Grade: B+)
[0:28-0:31] Click quality score to show breakdown modal
[0:31-0:33] Close modal
[0:33-0:36] Click "Copy to Clipboard" button
[0:36-0:38] Success toast appears: "Documentation copied!"
[0:38-0:42] Switch to README.md file in VS Code
[0:42-0:45] Paste documentation (Cmd+V)
[0:45-0:48] Show formatted documentation in VS Code
[0:48-0:50] Zoom out to show before/after comparison
[0:50-0:55] Quick montage of other doc types:
            - JSDoc generation (3 seconds)
            - API docs generation (2 seconds)
[0:55-0:60] End screen: "Start documenting at codescribeai.com"
            + QR code or URL
```

**Voiceover Script (Optional):**
```
"CodeScribe AI turns your code into beautiful documentation in seconds.
[pause]
Just paste your code, select a documentation type, and click generate.
[pause]
Watch as AI creates comprehensive documentation in real-time.
[pause]
Complete with quality scoring to ensure documentation meets standards.
[pause]
Copy and paste directly into your project.
[pause]
Start documenting at codescribeai.com."
```

**Checklist:**
- [ ] No audio distractions (notifications, background noise)
- [ ] Smooth cursor movements (practice first)
- [ ] No long pauses or hesitations
- [ ] Quality score prominently shown
- [ ] Real-time streaming clearly visible
- [ ] Success moments highlighted (completion, copy)
- [ ] Ends with clear call-to-action
- [ ] Captions/subtitles added (accessibility)

**Tools:**
- **Recording:** Loom, QuickTime, OBS Studio
- **Editing:** iMovie, DaVinci Resolve (free), Camtasia
- **Captions:** Kapwing, Rev.com, YouTube auto-captions

---

#### 3. Dark Mode Screenshot
**Filename:** `hero-dark-mode.png`
**Dimensions:** 2560x1600px
**Purpose:** Show theme support, appeal to developers
**Time:** 10 minutes

**Steps:**
1. Same composition as hero-light-mode.png
2. Toggle to dark mode (Settings → Appearance → Dark)
3. Use same code example
4. Regenerate documentation (to ensure fresh state)
5. Take screenshot in same position

**Why This Matters:**
- Developers expect dark mode
- Shows attention to detail
- Appeals to aesthetic preferences
- Demonstrates feature parity

---

#### 4. Quality Score Breakdown
**Filename:** `quality-score-breakdown.png`
**Dimensions:** 2560x1600px
**Purpose:** Highlight unique feature, show educational value
**Time:** 15 minutes

**Composition:**
- **Background:** Blurred main interface
- **Foreground:** Quality score modal prominently displayed
- **Content visible:**
  - Overall score: 87/100 (Grade: B+)
  - 5 criteria scores:
    - Overview & Description: 18/20 ⭐
    - Installation Instructions: 12/15 ⭐
    - Usage Examples: 17/20 ⭐
    - API Documentation: 22/25 ⭐
    - Structure & Formatting: 18/20 ⭐
  - Improvement suggestions visible

**Steps:**
1. Generate documentation (same as hero shot)
2. Click on quality score badge
3. Wait for modal to open with animation
4. Ensure all scores are visible
5. Take screenshot
6. Annotate if needed (arrows, highlights)

**Annotation Ideas (Optional):**
- Arrow pointing to overall score: "AI-powered quality analysis"
- Highlight on criteria: "5 documentation standards"
- Note on suggestions: "Actionable improvement tips"

---

### Priority 2: Should-Have Assets (60 minutes)

#### 5. GitHub Repository Import
**Filename:** `github-import-multi-file.png`
**Dimensions:** 2560x1600px
**Purpose:** Showcase unique feature, demonstrate scale
**Time:** 15 minutes

**Composition:**
- **Left sidebar:** GitHub repo tree with multiple files
  - Show recognizable repository (e.g., "facebook/react" or your own)
  - Multiple files selected (checkboxes)
  - Branch selector visible
- **Main area:** File preview or import progress
- **Right panel:** Generated documentation for selected files

**Steps:**
1. Navigate to multi-file import
2. Connect GitHub (use a public repo like "facebook/react" or "vercel/next.js")
3. Browse to src/ folder
4. Select 3-5 interesting files (components, utils)
5. Show file tree with selections
6. Take screenshot before clicking "Generate"
7. Optional: Take second screenshot showing generation progress

**Why This Matters:**
- Differentiates from competitors
- Shows CodeScribe handles real-world scale
- Appeals to teams with large codebases

---

#### 6. Before/After Comparison
**Filename:** `before-after-comparison.png`
**Dimensions:** 2560x1600px (split view) or 1920x1080 each
**Purpose:** Show transformation, demonstrate value
**Time:** 20 minutes

**Composition:**
- **Left side:** Undocumented code
  - Raw function/class with no comments
  - No README
  - Looks cluttered or unclear
- **Right side:** Same code with generated docs
  - Beautiful README with structure
  - Comprehensive descriptions
  - Code examples
  - Installation instructions

**Steps:**
1. Find or create undocumented code example
2. Take screenshot of raw code in editor
3. Generate documentation in CodeScribe
4. Take screenshot of generated output
5. Use image editor to create side-by-side comparison
6. Add labels: "Before" and "After"

**Design Tips:**
- Use split-screen template
- Add subtle divider line between sides
- Include small CodeScribe logo in corner
- Label clearly: "Before" and "After"

**Tools:**
- Figma (free)
- Canva (free)
- Photoshop/Sketch (paid)
- macOS Preview (basic merge)

---

#### 7. Multi-Doc Type Tabs
**Filename:** `doc-types-all.png`
**Dimensions:** 2560x1600px
**Purpose:** Show versatility, multiple output formats
**Time:** 15 minutes

**Composition:**
- Main interface with doc type tabs visible
- Show at least 3 tabs: README, JSDoc, API Reference
- Current tab displays generated documentation
- Other tabs visible but not active

**Steps:**
1. Generate documentation for same code in multiple formats:
   - README
   - JSDoc
   - API Reference
   - ARCHITECTURE (if applicable)
2. Take screenshot with all tabs visible
3. Annotate to highlight the tabs if needed

**Alternative:** Create 4 separate screenshots, one for each doc type, then combine into grid:
- Top-left: README
- Top-right: JSDoc
- Bottom-left: API
- Bottom-right: ARCHITECTURE

---

#### 8. Usage Dashboard / Tier Comparison
**Filename:** `usage-dashboard-pro.png`
**Dimensions:** 2560x1600px
**Purpose:** Show subscription value, clear pricing
**Time:** 10 minutes

**Composition:**
- Usage stats showing Pro tier benefits
- Clear visualization of limits
- Tier badge prominently displayed
- Month-to-date usage visible

**Steps:**
1. Navigate to /usage or user dashboard
2. Ensure realistic usage numbers (not 0, not maxed)
3. Show Pro tier with clear benefits
4. Take screenshot

---

### Priority 3: Nice-to-Have Assets (60 minutes)

#### 9. Feature GIF - Real-Time Streaming
**Filename:** `feature-streaming.gif`
**Duration:** 3-5 seconds (looping)
**Dimensions:** 800x600px
**Purpose:** Social media, show speed and real-time nature
**Time:** 20 minutes

**Content:**
- Close-up of output panel
- Documentation appearing line by line
- Shows 5-10 lines being generated
- Loops seamlessly

**Steps:**
1. Start recording with Gifox/LICEcap
2. Click "Generate Documentation"
3. Record 5 seconds of generation
4. Stop recording
5. Trim to best 3-5 seconds
6. Export as optimized GIF (<5MB)

**Tips:**
- Record at 15fps for smaller file size
- Trim to most interesting part
- Ensure smooth loop transition
- Optimize file size for web (<5MB)

---

#### 10. Feature GIF - Quality Score Animation
**Filename:** `feature-quality-score.gif`
**Duration:** 2-3 seconds
**Dimensions:** 600x400px
**Purpose:** Highlight unique feature
**Time:** 20 minutes

**Content:**
- Quality score badge appearing
- Score counting up (0 → 87)
- Grade letter appearing (B+)
- Subtle celebration animation

**Steps:**
1. Generate documentation
2. Start recording before score appears
3. Capture score animation
4. Stop after animation completes
5. Trim and optimize

---

#### 11. Feature GIF - Copy to Clipboard
**Filename:** `feature-copy.gif`
**Duration:** 2-3 seconds
**Dimensions:** 400x300px
**Purpose:** Show ease of use
**Time:** 20 minutes

**Content:**
- Cursor hovering over Copy button
- Button click
- Success toast appearing
- Toast sliding in from top

**Steps:**
1. Generate documentation
2. Start recording
3. Hover and click Copy button
4. Capture toast animation
5. Trim and optimize

---

## Example Code Library

Use these code samples for different scenarios. All should generate 85+ quality scores.

### Example 1: React Component (Best for Hero Shot)
**Language:** JavaScript/TypeScript
**File:** `Button.jsx`

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

**Why This Works:**
- Familiar to developers (React)
- Shows props, PropTypes, Tailwind
- Medium complexity (not too simple, not too complex)
- Clear structure and purpose

---

### Example 2: API Endpoint (Good for API Docs)
**Language:** JavaScript (Node.js/Express)
**File:** `userController.js`

```javascript
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

/**
 * User Controller
 * Handles all user-related API endpoints
 */
class UserController {
  /**
   * Get user profile by ID
   * @route GET /api/users/:id
   */
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update user profile
   * @route PUT /api/users/:id
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await User.findByIdAndUpdate(id, updates, { new: true });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Send confirmation email
      await sendEmail(user.email, 'Profile Updated', 'Your profile has been successfully updated.');

      return res.json({ user, message: 'Profile updated successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete user account
   * @route DELETE /api/users/:id
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
```

**Why This Works:**
- Shows CRUD operations
- RESTful API structure
- Error handling
- JSDoc comments (for JSDoc doc type)
- Real-world business logic

---

### Example 3: Utility Function (Good for JSDoc)
**Language:** JavaScript
**File:** `formatters.js`

```javascript
/**
 * Formatting Utilities
 * Helper functions for formatting dates, numbers, and text
 */

/**
 * Format date to human-readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (short, long, iso)
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const formats = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    iso: null
  };

  if (format === 'iso') {
    return d.toISOString();
  }

  return d.toLocaleDateString('en-US', formats[format]);
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(num, decimals = 0) {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength, suffix = '...') {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}
```

**Why This Works:**
- Multiple functions to document
- Clear JSDoc annotations
- Shows different param/return types
- Practical, reusable code

---

### Example 4: Class (Good for Architecture Docs)
**Language:** Python
**File:** `cache.py`

```python
import time
from typing import Any, Optional

class Cache:
    """
    Simple in-memory cache with TTL support.

    Stores key-value pairs with optional expiration times.
    Automatically removes expired entries on access.
    """

    def __init__(self, default_ttl: int = 3600):
        """
        Initialize cache with default TTL.

        Args:
            default_ttl: Default time-to-live in seconds (default: 1 hour)
        """
        self._cache = {}
        self._default_ttl = default_ttl

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Store value in cache with optional TTL.

        Args:
            key: Cache key
            value: Value to store
            ttl: Time-to-live in seconds (uses default if not specified)
        """
        expiry = time.time() + (ttl or self._default_ttl)
        self._cache[key] = {'value': value, 'expiry': expiry}

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value if exists and not expired, None otherwise
        """
        if key not in self._cache:
            return None

        entry = self._cache[key]

        if time.time() > entry['expiry']:
            del self._cache[key]
            return None

        return entry['value']

    def delete(self, key: str) -> bool:
        """
        Remove key from cache.

        Args:
            key: Cache key

        Returns:
            True if key existed, False otherwise
        """
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> None:
        """Remove all entries from cache."""
        self._cache.clear()
```

**Why This Works:**
- Python (appeals to different audience)
- Well-documented with docstrings
- Clear class structure
- Shows type hints
- Practical caching implementation

---

### Example 5: Configuration (Good for README)
**Language:** JavaScript
**File:** `config.js`

```javascript
/**
 * Application Configuration
 * Central configuration management for the application
 */

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: 20,
    ssl: process.env.NODE_ENV === 'production'
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: '7d',
    bcryptRounds: 10
  },

  // Email Configuration
  email: {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    from: 'noreply@example.com'
  },

  // Feature Flags
  features: {
    registration: true,
    socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    emailVerification: true
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

module.exports = config;
```

**Why This Works:**
- Shows configuration patterns
- Environment variable usage
- Clear organization
- Documentation will explain setup

---

## Platform-Specific Requirements

### Product Hunt

**Main Gallery:**
- **Thumbnail:** 1270x760px (featured image)
- **Gallery images:** 5-7 screenshots at 1270x760px
- **Video:** MP4, max 100MB, 16:9 aspect ratio

**Recommended Order:**
1. Hero screenshot (light mode)
2. Demo video (auto-plays)
3. Real-time streaming GIF
4. Quality score breakdown
5. Dark mode screenshot
6. GitHub import screenshot
7. Before/after comparison

**Tips:**
- First image is crucial (shows in listings)
- Video auto-plays muted (add captions!)
- GIFs perform better than static images
- Show progression/story across gallery

---

### Twitter/X

**Image Posts:**
- **Single image:** 1200x675px (16:9)
- **2 images:** 700x800px each (7:8)
- **4 images:** 1200x600px each (2:1)
- **Max file size:** 5MB PNG, 15MB GIF

**Video Posts:**
- **Resolution:** 1280x720px minimum
- **Duration:** 2:20 maximum (shorter is better)
- **Format:** MP4
- **Captions:** Always add (auto-play is muted)

**Recommended Thread:**
```
Tweet 1: Hero screenshot + intro
"Introducing CodeScribe AI 🚀
Generate beautiful documentation from code in seconds.
No templates. No formatting. Just paste and generate.
[Hero screenshot]"

Tweet 2: Demo video
"Watch it in action 👇
[60-second demo video]"

Tweet 3: Feature highlight (quality scoring)
"Every generation includes AI-powered quality analysis ✨
Get actionable feedback to improve your docs.
[Quality score screenshot]"

Tweet 4: Call to action
"Try it free at codescribeai.com
✅ 10 docs/month free
✅ All doc types
✅ No credit card required"
```

---

### LinkedIn

**Image Posts:**
- **Single image:** 1200x627px (1.91:1)
- **Carousel:** 1080x1080px per slide (square)
- **Max file size:** 10MB

**Video Posts:**
- **Resolution:** 1920x1080px
- **Duration:** 3 minutes max (under 60s recommended)
- **Format:** MP4
- **Native upload** performs better than YouTube links

**Recommended Approach:**
- Professional tone (business value focus)
- Carousel post showing workflow steps
- Video demo with professional commentary
- Case study format ("How we save developers X hours")

---

### Hacker News (Show HN)

**No images in post, but:**
- Ensure live demo is perfect
- Screenshots in GitHub README get clicked
- Video demo as supplementary link

**What to prepare:**
- Live demo link that loads fast
- GitHub README with clear screenshots
- Demo video as "supplementary materials"

---

### Dev.to / Hashnode

**Article Format:**
- **Cover image:** 1000x420px (mandatory)
- **Inline images:** 800-1200px wide
- **GIFs:** Highly encouraged, <10MB

**Recommended Article Structure:**
```markdown
# Introducing CodeScribe AI: AI-Powered Documentation Generator

[Hero screenshot]

## The Problem
Writing documentation is tedious...

## The Solution
CodeScribe AI generates beautiful documentation in seconds.

[Demo video or GIF]

## How It Works
1. Paste your code
2. Select doc type
3. Generate

[Screenshots of each step]

## Features
### Real-Time Streaming
[Streaming GIF]

### Quality Scoring
[Quality score screenshot]

### Multiple Doc Types
[Doc types screenshot]

## Try It Now
Visit codescribeai.com to start documenting.
```

---

## File Organization

Create this folder structure:

```
/assets/
├── launch/
│   ├── screenshots/
│   │   ├── 1-hero-light-mode.png
│   │   ├── 2-hero-dark-mode.png
│   │   ├── 3-quality-score-breakdown.png
│   │   ├── 4-github-import.png
│   │   ├── 5-before-after-comparison.png
│   │   ├── 6-doc-types-all.png
│   │   ├── 7-usage-dashboard.png
│   │   └── 8-streaming-in-action.png
│   ├── video/
│   │   ├── demo-video-60s.mp4
│   │   ├── demo-video-60s-captions.srt
│   │   └── demo-video-30s.mp4 (short version)
│   ├── gifs/
│   │   ├── feature-streaming.gif
│   │   ├── feature-quality-score.gif
│   │   └── feature-copy.gif
│   ├── platform-specific/
│   │   ├── product-hunt/
│   │   │   ├── thumbnail-1270x760.png
│   │   │   ├── gallery-1.png
│   │   │   ├── gallery-2.png
│   │   │   └── ...
│   │   ├── twitter/
│   │   │   ├── thread-image-1.png (1200x675)
│   │   │   ├── thread-image-2.png
│   │   │   └── ...
│   │   └── linkedin/
│   │       ├── carousel-slide-1.png (1080x1080)
│   │       └── ...
│   └── raw/
│       └── (unedited originals)
```

---

## Quality Checklist

Before publishing any asset:

### Technical Quality
- [ ] **Resolution:** At least 1920px wide for screenshots
- [ ] **File size:** <5MB for images, <100MB for videos
- [ ] **Format:** PNG for screenshots, MP4 for videos, GIF for animations
- [ ] **Compression:** Optimized for web (TinyPNG, ImageOptim)
- [ ] **Aspect ratio:** Correct for target platform

### Content Quality
- [ ] **No personal info:** No real emails, API keys, passwords visible
- [ ] **No errors:** No console errors, broken UI, misalignments
- [ ] **Realistic data:** Not "lorem ipsum" or empty states
- [ ] **Professional:** Clean, polished, production-ready
- [ ] **Readable:** Text is legible even at thumbnail size

### Brand Consistency
- [ ] **Colors:** Match brand palette (purple, indigo, slate)
- [ ] **Fonts:** Consistent typography
- [ ] **Logo:** Visible where appropriate
- [ ] **Voice:** Professional yet approachable

### Accessibility
- [ ] **Alt text:** Written for all images
- [ ] **Captions:** Added to all videos
- [ ] **Contrast:** WCAG AA compliant
- [ ] **Text size:** Minimum 14px in screenshots

---

## Timeline & Production Schedule

### Day 1: Setup & Preparation (30 minutes)
- [ ] Complete pre-production checklist
- [ ] Set up recording environment
- [ ] Test all tools
- [ ] Prepare example code
- [ ] Create demo account

### Day 2: Priority 1 Assets (90 minutes)
- [ ] 1. Hero screenshot (20 min)
- [ ] 2. Demo video (45 min)
- [ ] 3. Dark mode screenshot (10 min)
- [ ] 4. Quality score breakdown (15 min)

**Checkpoint:** Review and QA all Priority 1 assets

### Day 3: Priority 2 Assets (60 minutes)
- [ ] 5. GitHub import screenshot (15 min)
- [ ] 6. Before/after comparison (20 min)
- [ ] 7. Multi-doc type tabs (15 min)
- [ ] 8. Usage dashboard (10 min)

**Checkpoint:** Review and QA all Priority 2 assets

### Day 4: Priority 3 Assets (60 minutes)
- [ ] 9. Streaming GIF (20 min)
- [ ] 10. Quality score GIF (20 min)
- [ ] 11. Copy to clipboard GIF (20 min)

### Day 5: Platform Optimization (60 minutes)
- [ ] Resize for Product Hunt
- [ ] Resize for Twitter
- [ ] Resize for LinkedIn
- [ ] Create thumbnails
- [ ] Optimize file sizes
- [ ] Write alt text for all images

### Day 6: Final QA (30 minutes)
- [ ] Review all assets against quality checklist
- [ ] Test assets on actual platforms (upload drafts)
- [ ] Get feedback from team/friends
- [ ] Make final adjustments

**Total:** 5.5 hours spread across 6 days

---

## Post-Production Optimization

### Image Optimization Tools

**macOS:**
- **ImageOptim** (free) - Drag and drop optimization
- **TinyPNG** (web) - Excellent compression, free tier
- **Squoosh** (web, Google) - Advanced options

**Commands:**
```bash
# Install ImageOptim CLI
brew install imageoptim-cli

# Optimize all PNGs in folder
imageoptim --quality=85 *.png
```

### Video Optimization

**FFmpeg (command line):**
```bash
# Install FFmpeg
brew install ffmpeg

# Optimize video for web
ffmpeg -i demo-video.mp4 -vcodec h264 -acodec aac -b:v 2M -b:a 128k demo-video-optimized.mp4

# Create 720p version
ffmpeg -i demo-video.mp4 -vf scale=1280:720 -vcodec h264 -b:v 1.5M demo-video-720p.mp4

# Extract first frame as thumbnail
ffmpeg -i demo-video.mp4 -ss 00:00:05 -vframes 1 thumbnail.png
```

**Online Tools:**
- **CloudConvert** - Format conversion
- **Kapwing** - Video editing + compression
- **HandBrake** - Desktop video encoder

### GIF Optimization

**Gifski (best quality):**
```bash
# Install Gifski
brew install gifski

# Convert video to GIF
gifski -o output.gif input.mp4 --fps 15 --quality 90 --width 800
```

**Online:**
- **Ezgif.com** - Compress, resize, optimize GIFs
- **Gifox** (Mac app, $5) - Create optimized GIFs directly

---

## Tools & Resources

### Screen Recording
- **Loom** (free) - https://loom.com - Easiest, includes cursor emphasis
- **QuickTime** (Mac, free) - Built-in, simple screen recording
- **OBS Studio** (free) - https://obsproject.com - Professional, complex
- **ScreenFlow** (Mac, $169) - Professional with editing

### Screen Capture
- **macOS built-in** (free) - Cmd+Shift+4 for area, Cmd+Shift+3 for full
- **CleanShot X** (Mac, $29) - Enhanced screenshots with annotations
- **Snagit** ($50) - Cross-platform with editing

### GIF Creation
- **Gifox** (Mac, $5) - https://gifox.app - Easiest, optimized output
- **LICEcap** (free) - https://licecap.org - Simple, cross-platform
- **ScreenToGif** (Windows, free) - Feature-rich
- **Gifski** (free) - https://gif.ski - CLI, best quality

### Video Editing
- **iMovie** (Mac, free) - Simple, intuitive
- **DaVinci Resolve** (free) - Professional-grade
- **Camtasia** ($299) - Screen recording + editing
- **Final Cut Pro** (Mac, $299) - Professional

### Image Editing
- **Figma** (free) - https://figma.com - Best for layouts, annotations
- **Canva** (free) - https://canva.com - Templates, easy design
- **Photoshop** ($20/mo) - Industry standard
- **Pixelmator Pro** (Mac, $40) - Affordable Photoshop alternative

### Compression & Optimization
- **ImageOptim** (Mac, free) - Lossless compression
- **TinyPNG** (web, free) - https://tinypng.com - Excellent compression
- **FFmpeg** (free) - Command-line video processing
- **HandBrake** (free) - Video compression GUI

### Captioning & Subtitles
- **Kapwing** (free tier) - https://kapwing.com - Auto-captions
- **Rev.com** ($1.50/min) - Professional human captions
- **YouTube** (free) - Auto-generate, export SRT

---

## Next Steps

1. **Start with Priority 1 assets** (hero screenshot + demo video)
2. **Get feedback** from 2-3 trusted people
3. **Iterate** based on feedback
4. **Create Priority 2 assets** once Priority 1 is approved
5. **Optimize for platforms** after all assets created
6. **Schedule launch** once assets are complete

---

**Ready to create amazing launch assets! 🚀**
