# Navigation Design Patterns

**Version:** 1.0
**Last Updated:** November 7, 2025
**Status:** Production Standard

---

## 📋 Overview

Consistent navigation patterns across all pages in CodeScribe AI, following industry best practices from Stripe, GitHub, Linear, Notion, and Vercel.

### Design Philosophy

1. **Consistent Chrome**: Header and Footer present on all secondary pages
2. **Mobile-Optimized**: Industry-standard sizing for maximum viewport space
3. **Browser History Navigation**: Back buttons use `navigate(-1)` for user control
4. **Responsive Sizing**: Progressive scaling from mobile to desktop

---

## 🏗️ Layout Structure

### PageLayout Component Pattern

All secondary pages use the `PageLayout` wrapper component that provides:

- **Header**: Logo, navigation, authentication
- **MobileMenu**: Collapsible mobile navigation
- **HelpModal**: Context-sensitive help system
- **Footer**: Legal links, copyright, support
- **Main Content Area**: Flexible content container

```jsx
import { PageLayout } from '../components/PageLayout';

export default function YourPage() {
  return (
    <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Your page content */}
      </div>
    </PageLayout>
  );
}
```

**Props:**
- `showGradient` (boolean): Controls purple gradient background (default: true)
- `className` (string): Custom background classes for page-specific styling
- `children` (ReactNode): Page content

---

## 📐 Header Component

### Mobile-Responsive Sizing

Following industry standards (Stripe, Vercel, Linear, GitHub):

| Breakpoint | Height | Rationale |
|------------|--------|-----------|
| Mobile (< 640px) | **56px** (h-14) | Maximizes viewport space on small screens |
| Desktop (≥ 640px) | **64px** (h-16) | Standard desktop header height |

```jsx
<header className="bg-white border-b border-slate-200">
  <div className="w-full px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-14 sm:h-16">
      {/* Header content */}
    </div>
  </div>
</header>
```

### Progressive Scaling Elements

**Logo:**
```jsx
<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
  <Logo className="w-full h-full" />
</div>
```

**Title:**
```jsx
<h1 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900">
  CodeScribe AI
</h1>
```

**Tagline:**
```jsx
<p className="text-xs text-slate-600 hidden lg:block">
  Intelligent Code Documentation
</p>
```

### Navigation Elements

**Desktop:**
- Pricing button (context-aware label: "Pricing", "Upgrade", or "Subscription")
- Help button
- Authentication (Sign In button or User menu dropdown)

**Mobile:**
- Pricing button hidden (available in mobile menu)
- Help button hidden (available in mobile menu)
- Mobile menu button (hamburger icon)

---

## 📐 Footer Component

### Mobile-Responsive Sizing

| Breakpoint | Vertical Padding | Text Size | Rationale |
|------------|------------------|-----------|-----------|
| Mobile (< 640px) | **12px** (py-3) | **12px** (text-xs) | Compact on mobile |
| Desktop (≥ 640px) | **16px** (py-4) | **14px** (text-sm) | Standard desktop sizing |

```jsx
<footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 mt-auto">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      {/* Copyright */}
      <div className="text-slate-600 text-xs sm:text-sm">
        © {currentYear} CodeScribe AI. All rights reserved.
      </div>

      {/* Legal Links */}
      <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
        <Link to="/terms">Terms of Service</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <button onClick={onSupportClick}>Support</button>
      </nav>
    </div>
  </div>
</footer>
```

**Key Features:**
- Backdrop blur effect (`backdrop-blur-sm`)
- Semi-transparent background (`bg-white/80`)
- Auto margin top (`mt-auto`) pushes to bottom
- Responsive layout (column on mobile, row on desktop)

---

## 🔙 Back Button Pattern

### Standard Implementation

All secondary pages include a back button in the top-left corner:

```jsx
<button
  onClick={() => navigate(-1)}
  className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors group mb-4"
>
  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
  <span className="font-medium">Back</span>
</button>
```

### Design Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Text** | "Back" | Simple, universal label |
| **Icon** | ArrowLeft (Lucide) | 16×16px (w-4 h-4) |
| **Default Color** | `slate-600` | Subtle, not distracting |
| **Hover Color** | `purple-600` | Brand color for interaction |
| **Icon Animation** | `-translate-x-1` | Subtle left slide on hover |
| **Margin Bottom** | `mb-4` (16px) | Spacing before page heading |

### Navigation Behavior

**✅ Correct:** Use browser history navigation
```jsx
onClick={() => navigate(-1)}
```

**❌ Incorrect:** Hardcoded home navigation
```jsx
onClick={() => navigate('/')}  // DON'T DO THIS
```

**Rationale:**
- Respects user's navigation path
- Works correctly when arriving from different pages
- Standard browser "back" behavior
- User retains control of navigation

**Example User Flow:**
1. User on Home → clicks "Pricing" → Pricing page
2. User clicks "Back" → returns to Home ✅

vs.

1. User on Settings → clicks "Subscription" tab → Pricing page
2. User clicks "Back" → returns to Settings ✅ (not forced to Home)

---

## 📱 Mobile Menu

### Tab Overflow Handling

For pages with multiple tabs (e.g., Settings page with Account, Privacy, Subscription, Danger Zone):

**Pattern:** Horizontal scrolling with `overflow-x-auto`

```jsx
<nav className="flex -mb-px overflow-x-auto" aria-label="Settings tabs">
  {TABS.map((tab) => (
    <button key={tab.id} onClick={() => handleTabChange(tab.id)}>
      <Icon className="w-5 h-5" />
      <span>{tab.label}</span>
    </button>
  ))}
</nav>
```

**Why This Works:**
- ✅ Industry standard (GitHub, Stripe, Linear, Vercel all use this)
- ✅ Accessible (keyboard navigation works)
- ✅ Touch-friendly (swipe to scroll)
- ✅ No layout shift or truncation
- ✅ User intuition (common mobile pattern)

**Alternative Rejected:** Dropdown/select for tabs
- ❌ More clicks required
- ❌ Hides available options
- ❌ Less discoverable
- ❌ Not industry standard

---

## 📱 Mobile Drawer Patterns

### When to Use Bottom Drawers vs Side Drawers

Following iOS, Android, and modern web app conventions (Instagram, Twitter/X, Google Photos, Airbnb, Slack, Notion).

#### ✅ Bottom Drawers (Bottom Sheets)

**Best for: Quick actions and modal selections**

**Use Cases:**
1. **Quick Action Menus** (3-7 items)
   - Share sheets (iOS/Android native pattern)
   - Context menus: "Edit", "Delete", "Share", "Download"
   - Examples: Instagram three-dot menu, Twitter/X share options, Google Photos

2. **Modal Selections**
   - Pickers (date, time, dropdowns)
   - Filters (e-commerce: price range, categories)
   - Sort options
   - Examples: Airbnb filters, Amazon sort options

3. **Native Mobile Apps**
   - iOS Action Sheets (standard iOS pattern)
   - Android Bottom Sheets (Material Design)
   - Thumb-friendly on large phones (easier to reach)

**Implementation Pattern:**
```jsx
// Example: File action menu (if implemented)
<BottomSheet isOpen={showActions}>
  <button onClick={handleEdit}>Edit</button>
  <button onClick={handleDownload}>Download</button>
  <button onClick={handleDelete}>Delete</button>
  <button onClick={handleShare}>Share</button>
</BottomSheet>
```

#### ✅ Side Drawers

**Best for: Navigation and content-heavy panels**

**Use Cases:**
1. **Primary Navigation** (Our hamburger menu)
   - Many items (Help, Settings, Profile, Admin, etc.)
   - Hierarchical structure with nested menus
   - Industry standard: Gmail, Slack, Medium, Reddit mobile
   - Better for desktop consistency

2. **Content-Heavy Panels** (Our file sidebar)
   - Lists of items (files, channels, folders, conversations)
   - Scrollable content (10+ items)
   - Persistent state (user might keep open while working)
   - Examples: Notion sidebar, Slack channels, VS Code mobile, Figma

**Implementation Pattern:**
```jsx
// Right side drawer: Main navigation
<SideDrawer position="right" isOpen={showMenu}>
  <nav>
    <NavLink to="/help">Help</NavLink>
    <NavLink to="/settings">Settings</NavLink>
    <NavLink to="/profile">Profile</NavLink>
  </nav>
</SideDrawer>

// Left side drawer: File sidebar
<SideDrawer position="left" isOpen={showFiles}>
  <FileList files={files} />
</SideDrawer>
```

### CodeScribe AI Implementation

**Current Approach (Correct):**
- ✅ **Right hamburger → Side drawer** - Multiple navigation items, desktop consistency
- ✅ **Left PanelLeft → Side drawer** - File list is content-heavy, scrollable, many files

**Future Considerations:**
- **File actions** - Could use bottom drawer for per-file "Delete", "Download", "Rename"
- **Quick filters** - Could use bottom drawer for doc type filters or sort options

### Design Guidelines

| Pattern | Content Type | Item Count | Persistence | Examples |
|---------|--------------|------------|-------------|----------|
| **Bottom Drawer** | Actions/selections | 3-7 items | Temporary | Share, filter, sort, context menu |
| **Side Drawer** | Navigation/lists | 5+ items | Semi-persistent | Menu, files, channels, folders |

**Key Principle:** Bottom drawers for **quick actions**, side drawers for **navigation** and **content lists**.

---

## 🎨 Spacing & Padding Standards

### Page Container

```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
  {/* Page content */}
</div>
```

**Breakdowns:**
- `max-w-7xl`: 1280px maximum width
- `mx-auto`: Centered on large screens
- `px-4 sm:px-6 lg:px-8`: Responsive horizontal padding (16px → 24px → 32px)
- `pt-6`: Top padding 24px (consistent across all pages)
- `pb-12`: Bottom padding 48px (breathing room before footer)

### Back Button Spacing

```jsx
<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
  <button onClick={() => navigate(-1)} className="...mb-4">
    Back
  </button>
</div>

<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
  {/* Main page content */}
</div>
```

**Spacing Stack:**
1. Container top padding: `pt-6` (24px)
2. Back button bottom margin: `mb-4` (16px)
3. Content container: Separate div with own padding

**Total space from top:**
- 24px (container padding) + 16px (button margin) = **40px** before main content

---

## 🎯 Responsive Breakpoints

### Tailwind Breakpoint System

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile-first base styles |
| `sm:` | 640px | Small tablets, large phones landscape |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

### Common Responsive Patterns

**Height:**
```jsx
h-14 sm:h-16          // 56px → 64px
```

**Width/Size:**
```jsx
w-9 sm:w-10           // 36px → 40px
```

**Padding:**
```jsx
px-4 sm:px-6 lg:px-8  // 16px → 24px → 32px
py-3 sm:py-4          // 12px → 16px
```

**Text Size:**
```jsx
text-xs sm:text-sm    // 12px → 14px
text-base sm:text-lg  // 16px → 18px
```

**Gaps:**
```jsx
gap-2 sm:gap-3        // 8px → 12px
gap-3 sm:gap-4        // 12px → 16px
```

---

## 🎯 Implementation Checklist

### For New Secondary Pages

- [ ] Import and use `PageLayout` wrapper component
- [ ] Set appropriate `showGradient` and `className` props
- [ ] Add back button with `navigate(-1)` in top-left
- [ ] Use standard container max-width (`max-w-7xl` or page-specific)
- [ ] Apply responsive padding (`px-4 sm:px-6 lg:px-8`)
- [ ] Add vertical spacing (`pt-6 pb-12` or page-specific)
- [ ] Ensure mobile-responsive text/element sizing
- [ ] Test horizontal scrolling for tab overflow (if applicable)

### For Existing Pages

- [ ] Remove custom Header/Footer implementations
- [ ] Replace with `PageLayout` wrapper
- [ ] Update back button to use `navigate(-1)` if using `navigate('/')`
- [ ] Verify mobile spacing (header height, footer padding, text sizes)
- [ ] Test on mobile device/emulator
- [ ] Verify accessibility (keyboard navigation, screen reader)

---

## 📊 Viewport Space Optimization

### Mobile Savings Breakdown

| Element | Before | After | Savings |
|---------|--------|-------|---------|
| **Header Height** | 64px fixed | 56px mobile | **8px** |
| **Footer Padding** | 16px fixed | 12px mobile | **8px** |
| **Footer Text** | 14px fixed | 12px mobile | **~4px** |
| **Total Header/Footer** | 96px | 80px | **16px** |

**Additional Savings from Content Spacing:**
- Reduced margins/padding on page-specific content: **~60-80px**
- Progressive text sizing: **~10-15px**

**Total Mobile Viewport Reclaimed:** ~150-180px (15-20% on iPhone 14)

---

## 🔗 Related Documentation

- [PageLayout.jsx](../../client/src/components/PageLayout.jsx) - Layout wrapper component
- [Header.jsx](../../client/src/components/Header.jsx) - Header component with responsive sizing
- [Footer.jsx](../../client/src/components/Footer.jsx) - Footer component with responsive sizing
- [LIGHT-THEME-DESIGN-SYSTEM.md](./theming/LIGHT-THEME-DESIGN-SYSTEM.md) - Theme design system
- [07-Figma-Guide.md](../planning/mvp/07-Figma-Guide.md) - Complete design system

---

## 📝 Version History

- **v1.1** (November 20, 2025) - Mobile drawer patterns
  - Added bottom drawer vs side drawer guidelines
  - Documented when to use each pattern
  - Included industry examples and use cases
  - Added CodeScribe AI implementation notes
  - Standardized header icon sizing (24px/w-6)

- **v1.0** (November 7, 2025) - Initial navigation design patterns
  - Mobile-responsive Header/Footer sizing (56px/64px)
  - Back button navigation pattern (`navigate(-1)`)
  - Tab overflow handling (horizontal scroll)
  - Spacing and padding standards
  - Responsive breakpoint guidelines

---

**Questions or feedback?** Reference this document when implementing navigation on new pages to ensure consistency across the application.
