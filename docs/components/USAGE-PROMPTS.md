# Usage Prompts & Upgrade Flow

**Component:** Usage Warning Banner & Limit Modal
**Status:** ✅ **IMPLEMENTED** (October 28, 2025)
**Purpose:** Guide users to upgrade when approaching or reaching quota limits
**Version:** 2.1.0 (Updated: October 28, 2025 - Evening Session)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Design Philosophy](#design-philosophy)
- [Priority Banner System](#priority-banner-system)
- [Components](#components)
- [User Journeys](#user-journeys)
- [Implementation Guide](#implementation-guide)
- [Developer Tools](#developer-tools)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What Are Usage Prompts?

Usage prompts are strategic UI interventions that notify users when they're approaching or have reached their quota limits. They serve three purposes:

1. **Prevent frustration** - Warn users before they hit limits
2. **Drive upgrades** - Present upgrade options at optimal moments
3. **Maintain transparency** - Keep users informed about their usage

### Two-Tier Approach

| Threshold | UI Pattern | Behavior | Purpose |
|-----------|-----------|----------|---------|
| **80%+ usage** | Banner | Non-blocking, dismissible | Early warning, gentle nudge |
| **100% usage** | Modal | Blocking, requires action | Hard stop, clear upgrade path |

---

## Design Philosophy

### Research-Based Decisions

Our implementation follows industry best practices backed by UX research:

**✅ Why Banner for 80%?**
- **Less disruptive** - User can continue working
- **Persistent** - Stays visible until dismissed (not auto-hide)
- **Context available** - User sees warning while working
- **Nielsen Norman Group**: *"Inline banners are preferred for most error scenarios"*
- **Carbon Design System**: *"Replace popups with thin, easy-to-dismiss banners"*

**✅ Why Modal for 100%?**
- **Action required** - Generation will fail anyway, so modal is appropriate
- **Clear messaging** - User must acknowledge limit before proceeding
- **No workflow confusion** - Prevents failed generate attempts
- **Industry standard** - Matches Stripe, Vercel, GitHub patterns for hard limits

### Key Principles

1. **Progressive disclosure** - Start gentle (banner), escalate to blocking (modal)
2. **Transparency** - Always show exact usage, remaining count, reset time
3. **Clear upgrade path** - One-click navigation to pricing page
4. **No surprise blocks** - Users warned at 80% before hitting 100%
5. **Priority messaging** - Show only the most critical message at a time

---

## Priority Banner System

### Design Philosophy

**Problem:** Multiple banners stacking vertically creates visual clutter and reduces the impact of critical messages.

**Solution:** Priority-based system that shows only the most critical message at any time.

### Priority Order

```javascript
// Priority 1: Claude API Errors (blocking)
error ? <ErrorBanner error={error} />

// Priority 2: Upload Errors
: uploadError ? <ErrorBanner error={uploadError} />

// Priority 3: Usage Warnings (80-99%)
: showUsageWarning ? <UsageWarningBanner />

// Nothing shown
: null
```

### Banner Placement

All banners appear **at the top of the page** (below header, above control bar) for maximum visibility:

```
┌─────────────────────────────────┐
│ Header / Navigation             │
├─────────────────────────────────┤
│ [BANNER - Most Critical Only]   │  ← All banners display here
├─────────────────────────────────┤
│ Control Bar (doc type, etc.)    │
│ Main Content                     │
│ ...                              │
└─────────────────────────────────┘
```

**Why top placement?**
- **Immediate visibility** - User sees critical info first
- **Consistent location** - All banners in same position
- **No workflow interruption** - Banner doesn't cover working area
- **Mobile friendly** - Easy to scroll past once read

### Consistent Styling

All banners follow the same visual pattern for consistency:

**Common Elements:**
- **Left accent border** (4px) - Color indicates severity
- **Large icon** (w-6 h-6) - Immediate visual recognition
- **Slate neutral background** - Maintains readability
- **Same animations** - 250ms enter (slide-down + fade), 200ms exit (fade)

**Color Coding:**
```javascript
// Red accent (border-l-red-500) - Blocking errors
<ErrorBanner error={claudeApiError} />

// Yellow accent (border-l-yellow-500) - Warnings
<UsageWarningBanner usage={usage} />
```

---

## Components

### 1. UsageWarningBanner (80% Soft Limit)

**File:** `client/src/components/UsageWarningBanner.jsx`

#### When It Shows

```javascript
// Automatically shown when usage >= 80%
const showBanner = usage.percentage >= 80 && usage.remaining > 0;
```

#### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ │ ⚠️ Usage Warning                                      [×] │ ← Yellow left accent
│ │                                                           │
│ │ You've used 85% of your monthly limit.                   │
│ │ 2 documents remaining                                     │
│ │                                                           │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ 85%                  │
│ │                                                           │
│ │ 8 / 10 used  •  Quota resets in 2 days                   │
│ │ ──────────────────────────────────────────────────────   │
│ │ Upgrade to Starter — Get 5x more docs per month          │
│ │ Starting at $12/month                      [Upgrade →]   │
└─────────────────────────────────────────────────────────────┘
```

**Colors:**
- Background: `slate-50` (neutral #f8fafc)
- Border: `slate-200` with `border-l-yellow-500` (left accent, 4px)
- Progress bar: `yellow-500` fill, `slate-200` background
- Text: `slate-600`, `slate-900` (headings)
- Icon: `yellow-600`

**Animation:**
- Enter: 250ms slide-down + fade-in (`animate-slide-in-fade`)
- Exit: 200ms fade-out (`animate-fade-out`)
- Respects `prefers-reduced-motion` (disables animation)

**Key Design Decisions:**
- **Neutral background** - Uses slate instead of yellow to reduce visual fatigue
- **Left accent bar** - Yellow border provides color cue without overwhelming
- **Dynamic multiplier** - "5x more docs" auto-calculates from tier limits
- **Verbiage consistency** - "Quota resets in X days" matches modal wording

#### Props

```typescript
interface UsageWarningBannerProps {
  usage: {
    percentage: number;      // 0-100
    remaining: number;       // Documents left
    limit: number;           // Total limit
    period: 'daily' | 'monthly';
    resetDate: string;       // ISO 8601 date string
  };
  currentTier: 'free' | 'starter' | 'pro' | 'team' | 'enterprise';
  onDismiss: () => void;     // Called when user dismisses banner
  onUpgrade: () => void;     // Called when user clicks upgrade
}
```

#### Usage Example

```jsx
import { UsageWarningBanner } from './components/UsageWarningBanner';
import { useUsageTracking } from './hooks/useUsageTracking';

function App() {
  const { usage, getUsageForPeriod } = useUsageTracking();
  const [showWarning, setShowWarning] = useState(false);

  // Show banner when usage >= 80%
  useEffect(() => {
    if (usage && usage.monthlyPercentage >= 80) {
      setShowWarning(true);
    }
  }, [usage]);

  return (
    <>
      {showWarning && (
        <UsageWarningBanner
          usage={getUsageForPeriod('monthly')}
          currentTier={usage.tier}
          onDismiss={() => setShowWarning(false)}
          onUpgrade={() => window.location.href = '/pricing'}
        />
      )}
    </>
  );
}
```

---

### 2. UsageLimitModal (100% Hard Limit)

**File:** `client/src/components/UsageLimitModal.jsx`

#### When It Shows

```javascript
// Shown when user tries to generate at 100% limit
const showModal = usage.remaining === 0; // Or usage.percentage >= 100
```

#### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│                    [Background Overlay - backdrop blur]      │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ 🔴 Monthly Limit Reached                       [×]  │   │
│   │                                                      │   │
│   │ You've reached your limit of 10 documents this      │   │
│   │ month.                                               │   │
│   │                                                      │   │
│   │ ┌──────────────────────────────────────────────┐   │   │
│   │ │ Current Usage                        10 / 10 │   │   │ Red accent box
│   │ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%        │   │   │
│   │ │ Quota resets in 2 days                       │   │   │
│   │ └──────────────────────────────────────────────┘   │   │
│   │                                                      │   │
│   │ ┌──────────────────────────────────────────────┐   │   │
│   │ │ Upgrade for More Generations                 │   │   │ White box
│   │ │ Get 5x more docs and unlock premium features │   │   │
│   │ │                                               │   │   │
│   │ │ ✓ 50 generations per month (5x more)         │   │   │
│   │ │ ✓ 10 generations per day                     │   │   │
│   │ │ ✓ Priority support                           │   │   │
│   │ │ ✓ No ads                                     │   │   │
│   │ │ ─────────────────────────────────            │   │   │
│   │ │ Starting at $12 /month                       │   │   │
│   │ │                                               │   │   │
│   │ │ [        Upgrade Now →        ]               │   │   │
│   │ └──────────────────────────────────────────────┘   │   │
│   │                                                      │   │
│   │ Not ready? Wait for reset on Nov 1                  │   │
│   │                                                      │   │
│   │ Current plan: free  •  Compare all plans             │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Colors:**
- Background: White (modal card)
- Overlay: `black/50` with backdrop blur
- **Usage box (blocking state):**
  - Background: `red-50`
  - Border: `red-200`
  - Progress bar: `red-600` fill, `red-200` background
  - Text: `red-900`, `red-700`
- **Upgrade box:**
  - Background: White
  - Border: `purple-100`
  - Features: Green checkmarks (`green-600`)
- **CTA button:** `purple-600`

**Behavior:**
- Focus trapped within modal
- Esc key closes modal
- Click outside closes modal
- Primary action button auto-focused

**Key Design Decisions:**
- **Red blocking state** - Uses `red-*` colors because user cannot proceed (not just a warning)
- **Dynamic multiplier** - "5x more" auto-calculates: `Math.floor(nextTier.monthly / currentTier.monthly)`
- **Features-first layout** - Benefits shown prominently, pricing secondary
- **Benefit-focused heading** - "Upgrade for More Generations" instead of generic "Upgrade to Starter"
- **Compact spacing** - Reduced padding throughout to eliminate vertical scroll
- **Specific reset dates** - "on Nov 1" in escape hatch, "in 2 days" in usage box
- **Verbiage consistency** - "Quota resets" matches banner wording

#### Props

```typescript
interface UsageLimitModalProps {
  isOpen: boolean;           // Controls modal visibility
  onClose: () => void;       // Called when modal closes
  usage: {
    limit: number;           // Total limit
    period: 'daily' | 'monthly';
    resetDate: string;       // ISO 8601 date string
  };
  currentTier: 'free' | 'starter' | 'pro' | 'team' | 'enterprise';
  onUpgrade: () => void;     // Called when user clicks upgrade
}
```

#### Usage Example

```jsx
import { UsageLimitModal } from './components/UsageLimitModal';
import { useUsageTracking } from './hooks/useUsageTracking';

function App() {
  const { usage, canGenerate, getUsageForPeriod } = useUsageTracking();
  const [showLimitModal, setShowLimitModal] = useState(false);

  const handleGenerate = () => {
    // Check quota before generating
    if (!canGenerate()) {
      setShowLimitModal(true);
      return;
    }

    // Proceed with generation...
  };

  return (
    <>
      <button onClick={handleGenerate}>Generate</button>

      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        usage={getUsageForPeriod('monthly')}
        currentTier={usage?.tier}
        onUpgrade={() => window.location.href = '/pricing'}
      />
    </>
  );
}
```

---

### 3. Dynamic Multiplier System

Both `UsageWarningBanner` and `UsageLimitModal` calculate tier multipliers dynamically to ensure accuracy when tier limits change.

#### How It Works

```javascript
// 1. Define current tier limits (source of truth)
const currentTierLimits = {
  free: { daily: 3, monthly: 10 },
  starter: { daily: 10, monthly: 50 },
  pro: { daily: 50, monthly: 200 }
};

// 2. Define next tier's limits
const tiers = {
  free: { name: 'Starter', monthly: 50, daily: 10 },
  starter: { name: 'Pro', monthly: 200, daily: 50 },
  pro: { name: 'Team', monthly: 1000, daily: 250 }
};

// 3. Calculate multiplier dynamically
const nextTier = tiers[currentTier];
const currentLimits = currentTierLimits[currentTier];

const monthlyMultiplier = Math.floor(
  nextTier.monthly / currentLimits.monthly
);
// Free → Starter: 50 / 10 = 5x
// Starter → Pro: 200 / 50 = 4x
// Pro → Team: 1000 / 200 = 5x

// 4. Build feature list with dynamic multiplier
const features = [
  `${nextTier.monthly.toLocaleString()} generations per month (${monthlyMultiplier}x more)`,
  `${nextTier.daily} generations per day`,
  ...nextTier.additionalFeatures
];
```

#### Benefits

- **Single source of truth** - Change tier limits in one place
- **Auto-updates** - Multipliers recalculate when limits change
- **Accurate messaging** - Always shows correct "Xx more" values
- **Maintainable** - No manual updates needed for marketing copy

#### Example Output

```javascript
// Free user (10 monthly limit) → Starter (50 monthly limit)
"50 generations per month (5x more)"

// Starter user (50 monthly limit) → Pro (200 monthly limit)
"200 generations per month (4x more)"

// Pro user (200 monthly limit) → Team (1,000 monthly limit)
"1,000 generations per month (5x more)"
```

---

### 4. useUsageTracking Hook

**File:** `client/src/hooks/useUsageTracking.js`

#### Purpose

Centralized hook for fetching and monitoring user quota usage from the backend.

#### API Integration

**Endpoint:** `GET /api/user/usage`

**Expected Response:**
```json
{
  "usage": {
    "daily": 8,
    "monthly": 8
  },
  "limits": {
    "daily": 10,
    "monthly": 10
  },
  "remaining": {
    "daily": 2,
    "monthly": 2
  },
  "resetDates": {
    "daily": "2025-10-29T00:00:00Z",
    "monthly": "2025-11-01T00:00:00Z"
  },
  "tier": "free",
  "allowed": true
}
```

#### Hook API

```typescript
const {
  usage,              // Full usage data (transformed)
  isLoading,          // Loading state
  error,              // Error state
  refetch,            // Manually refetch usage
  checkThreshold,     // (threshold: number, period?: string) => boolean
  canGenerate,        // () => boolean (checks if user can generate)
  getUsageForPeriod,  // (period: 'daily' | 'monthly') => UsageData
} = useUsageTracking();
```

#### Methods

**`checkThreshold(threshold, period)`**
```javascript
// Check if usage >= 80%
if (checkThreshold(80, 'monthly')) {
  // Show warning banner
}

// Check if at 100%
if (checkThreshold(100, 'monthly')) {
  // Block generation
}
```

**`canGenerate()`**
```javascript
// Simple check: can user generate?
if (!canGenerate()) {
  setShowLimitModal(true);
  return;
}

// Proceed with generation
await generate(code, docType, language);
```

**`getUsageForPeriod(period)`**
```javascript
// Get formatted usage for components
const monthlyUsage = getUsageForPeriod('monthly');
// Returns: { percentage, remaining, limit, period, resetDate }

<UsageWarningBanner usage={monthlyUsage} />
```

---

## User Journeys

### Journey 1: Free User Approaching Limit

```
Day 1-5: User at 0-79% usage
├─ No warnings shown
└─ Normal generation flow

Day 6: User reaches 80% (8/10 documents used)
├─ 📋 Banner appears at top of page
│  "You've used 80% of your monthly limit. 2 documents remaining."
├─ User dismisses banner
└─ Banner gone, but reappears on next page load

Day 7: User reaches 100% (10/10 documents used)
├─ User clicks "Generate" button
├─ 🚫 Modal blocks action
│  "Generation Limit Reached"
│  "You've reached your monthly generation limit of 10 documents."
│
├─ Option 1: User clicks "Upgrade to Starter"
│  └─ Navigates to /pricing page
│
└─ Option 2: User clicks "Wait for reset"
   └─ Modal closes, user waits for monthly reset
```

### Journey 2: Starter User Hitting Daily Limit

```
Morning: User generates 9 documents (90% of daily limit)
├─ 📋 Banner appears
│  "You've used 90% of your daily limit. 1 document remaining."
└─ User continues working with banner visible

Afternoon: User generates 10th document (100% of daily)
├─ Next generation attempt triggers modal
├─ 🚫 Modal shows daily reset time
│  "Quota resets in 8 hours"
│
├─ Option 1: Upgrade to Pro (higher daily limit)
└─ Option 2: Wait for daily reset at midnight
```

---

## Implementation Guide

### Step 1: Install Hook

Add `useUsageTracking` to your component:

```jsx
import { useUsageTracking } from './hooks/useUsageTracking';

function App() {
  const { usage, checkThreshold, canGenerate, getUsageForPeriod } = useUsageTracking();
  // ... rest of component
}
```

### Step 2: Add Priority Banner System

Implement priority-based banner display (show only most critical message):

```jsx
const [showWarning, setShowWarning] = useState(false);
const [error, setError] = useState(null);
const [uploadError, setUploadError] = useState(null);

useEffect(() => {
  if (usage && checkThreshold(80)) {
    setShowWarning(true);
  } else {
    setShowWarning(false);
  }
}, [usage, checkThreshold]);

return (
  <main>
    {/* Priority Banner Section - Show only most critical message */}
    {/* Priority Order: 1) Claude API Error, 2) Upload Error, 3) Usage Warning */}
    {error ? (
      // Priority 1: Claude API errors (blocking)
      <ErrorBanner
        error={error}
        retryAfter={retryAfter}
        onDismiss={() => setError(null)}
      />
    ) : uploadError ? (
      // Priority 2: Upload errors
      <ErrorBanner
        error={uploadError}
        onDismiss={() => setUploadError(null)}
      />
    ) : showWarning && usage ? (
      // Priority 3: Usage warning (80%+ usage, non-blocking)
      <UsageWarningBanner
        usage={getUsageForPeriod('monthly')}
        currentTier={usage.tier}
        onDismiss={() => setShowWarning(false)}
        onUpgrade={() => window.location.href = '/pricing'}
      />
    ) : null}

    {/* Rest of content */}
  </main>
);
```

**Why ternary chain?**
- Shows only one banner at a time
- Prevents stacking (~200px → single banner)
- Most critical message always visible
- Clean, readable code pattern

### Step 3: Add Limit Modal

Block generation when at 100%:

```jsx
const [showLimitModal, setShowLimitModal] = useState(false);

const handleGenerate = async () => {
  // Check quota before generating
  if (!canGenerate()) {
    setShowLimitModal(true);
    return;
  }

  // Proceed with generation
  await generate(code, docType, language);
};

return (
  <>
    <button onClick={handleGenerate}>Generate</button>

    <UsageLimitModal
      isOpen={showLimitModal}
      onClose={() => setShowLimitModal(false)}
      usage={getUsageForPeriod('monthly')}
      currentTier={usage?.tier}
      onUpgrade={() => window.location.href = '/pricing'}
    />
  </>
);
```

### Step 4: Handle Simulator Events (Development Only)

For testing, add event listeners for the simulator:

```jsx
// In App.jsx
useEffect(() => {
  const handleShowUsageBanner = (event) => {
    const { percentage, usage } = event.detail;
    setMockUsage(usage);

    // At 100%, show modal instead of banner
    if (percentage >= 100 || usage.remaining === 0) {
      setShowUsageLimitModal(true);
      setShowUsageWarning(false);
    } else {
      // 80-99% shows banner
      setShowUsageWarning(true);
      setShowUsageLimitModal(false);
    }
  };

  const handleHideUsageBanner = () => {
    setMockUsage(null);
    setShowUsageWarning(false);
    setShowUsageLimitModal(false);
  };

  window.addEventListener('show-usage-banner', handleShowUsageBanner);
  window.addEventListener('hide-usage-banner', handleHideUsageBanner);

  return () => {
    window.removeEventListener('show-usage-banner', handleShowUsageBanner);
    window.removeEventListener('hide-usage-banner', handleHideUsageBanner);
  };
}, []);
```

### Step 5: Refresh Usage After Generation

```jsx
import { useDocGeneration } from './hooks/useDocGeneration';

function App() {
  const { refetch: refetchUsage } = useUsageTracking();

  // Pass refetch callback to useDocGeneration
  const { generate } = useDocGeneration(refetchUsage);

  // Usage will auto-refresh after each generation
}
```

---

## Developer Tools

### Usage Simulator

**File:** `client/src/utils/usageTestData.js`

The simulator provides instant banner/modal testing without API calls or page refreshes.

#### Quick Usage

```javascript
// In browser console:

// Show 80% warning banner
simulateUsage.show(80)

// Show 90% warning banner (more urgent)
simulateUsage.show(90)

// Show 100% blocking modal
simulateUsage.show(100)

// Hide banner/modal
simulateUsage.hide()
```

#### Available Scenarios

```javascript
simulateUsage.show(10)   // 10% usage (1/10 used)
simulateUsage.show(50)   // 50% usage (5/10 used)
simulateUsage.show(80)   // 80% warning (8/10 used) - Yellow banner
simulateUsage.show(90)   // 90% warning (9/10 used) - Yellow banner
simulateUsage.show(100)  // 100% limit (10/10 used) - Red modal
```

#### How It Works

```javascript
// Dispatches custom events that App.jsx listens for
window.dispatchEvent(new CustomEvent('show-usage-banner', {
  detail: { percentage, usage: scenarioData }
}));

// In App.jsx:
useEffect(() => {
  const handleShowUsageBanner = (event) => {
    const { percentage, usage } = event.detail;
    setMockUsage(usage);

    if (percentage >= 100) {
      setShowUsageLimitModal(true);
      setShowUsageWarning(false);
    } else {
      setShowUsageWarning(true);
      setShowUsageLimitModal(false);
    }
  };

  window.addEventListener('show-usage-banner', handleShowUsageBanner);
  return () => window.removeEventListener('show-usage-banner', handleShowUsageBanner);
}, []);
```

#### Design Philosophy

**Why this approach?**
- **No API mocking** - Avoids complex fetch interception
- **Instant feedback** - No page refresh required
- **HMR friendly** - Works with Vite hot reload
- **Clean code** - Simple show/hide interface
- **Event-based** - Decoupled from component internals

**Previous approach (removed):**
- Used fetch mocking with localStorage persistence
- Required page refreshes for HMR
- Complex state management across reloads
- 286 lines → 151 lines (47% reduction)

#### Testing Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Open browser console
# 3. Test warning banner (80%)
simulateUsage.show(80)

# 4. Verify:
#    - Banner appears at top of page (below header)
#    - Yellow left accent border
#    - Shows "You've used 80% of your monthly limit"
#    - Shows "2 documents remaining"
#    - Shows "Quota resets in X days"
#    - Dismiss button works

# 5. Test blocking modal (100%)
simulateUsage.show(100)

# 6. Verify:
#    - Modal appears (blocks interaction)
#    - Red usage box
#    - Shows "You've reached your limit of 10 documents"
#    - Shows upgrade section with 5x multiplier
#    - Esc key closes modal
#    - Close button works

# 7. Clean up
simulateUsage.hide()
```

---

## Testing

### Manual Testing Checklist

**Banner (80% threshold) - Yellow Warning:**
- [ ] Banner appears at top of page (below header, above control bar)
- [ ] Yellow left accent border (4px)
- [ ] Shows correct percentage and remaining count
- [ ] Shows "Quota resets in X days" (consistent verbiage)
- [ ] Icon size is w-6 h-6
- [ ] Background is slate-50 (neutral, not yellow)
- [ ] Dismiss button works
- [ ] Banner disappears after dismiss
- [ ] Upgrade button navigates to /pricing
- [ ] Progress bar shows correct percentage (yellow-500)
- [ ] Dynamic multiplier shows correct "Xx more" value
- [ ] Respects `prefers-reduced-motion`
- [ ] Animation: 250ms slide-down + fade-in
- [ ] Exit animation: 200ms fade-out

**Modal (100% threshold) - Red Blocking:**
- [ ] Modal appears when clicking generate at 100%
- [ ] Title is "Monthly Limit Reached" (properly aligned)
- [ ] Red usage box with red-50 background
- [ ] Shows "You've reached your limit of 10 documents this month"
- [ ] No redundant "Limit Reached" badge
- [ ] Usage box shows "Quota resets in X days"
- [ ] Escape hatch shows "Wait for reset on Nov 1" (specific date)
- [ ] Features listed first, pricing secondary
- [ ] Heading is "Upgrade for More Generations" (benefit-focused)
- [ ] Dynamic multiplier shows correct "Xx more" value
- [ ] Shows "Starting at $12/month" (neutral pricing)
- [ ] No vertical scroll (compact spacing)
- [ ] Esc key closes modal
- [ ] Close button works
- [ ] Upgrade button navigates to /pricing
- [ ] Focus trapped within modal
- [ ] Body scroll prevented when open

**Priority Banner System:**
- [ ] Only one banner shows at a time
- [ ] Claude API error takes priority over usage warning
- [ ] Upload error takes priority over usage warning
- [ ] Usage warning only shows when no errors present
- [ ] All banners appear in same location (top of page)
- [ ] ErrorBanner has red left accent border (4px)
- [ ] ErrorBanner icon is w-6 h-6 (matches UsageWarningBanner)

**Simulator (Development):**
- [ ] `simulateUsage.show(80)` shows yellow banner
- [ ] `simulateUsage.show(90)` shows yellow banner
- [ ] `simulateUsage.show(100)` shows red modal
- [ ] `simulateUsage.hide()` removes banner/modal
- [ ] No page refresh required
- [ ] Works with HMR (hot reload)

### Automated Tests

**Run tests:**
```bash
npm test -- UsageWarningBanner.test.jsx --run
npm test -- UsageLimitModal.test.jsx --run
```

**Coverage:**
- ✅ 6 tests for UsageWarningBanner
- ✅ 8 tests for UsageLimitModal
- ✅ Total: 14 component tests

---

## Accessibility

### WCAG 2.1 AA Compliance

**✅ Implemented:**

1. **Semantic HTML** - `role="alert"` on banner, `role="dialog"` on modal
2. **Keyboard Navigation** - Tab, Esc, Enter/Space support
3. **Screen Readers** - Proper ARIA labels and live regions
4. **Visual** - Color contrast ratios meet AA standards
5. **Motion** - Respects `prefers-reduced-motion`

---

## Troubleshooting

### Banner Not Showing

```jsx
// Debug usage data
useEffect(() => {
  console.log('Usage data:', usage);
  console.log('Monthly %:', usage?.monthlyPercentage);
  console.log('Check 80%:', checkThreshold(80));
}, [usage, checkThreshold]);
```

### Modal Not Blocking

```jsx
// Debug generation check
const handleGenerate = () => {
  console.log('Can generate:', canGenerate());
  console.log('Remaining:', usage?.monthlyRemaining);

  if (!canGenerate()) {
    setShowLimitModal(true);
    return;
  }
};
```

---

## Related Documentation

- **[ERROR-HANDLING-UX.md](ERROR-HANDLING-UX.md)** - Design philosophy for banners vs modals
- **[USAGE-QUOTA-SYSTEM.md](../database/USAGE-QUOTA-SYSTEM.md)** - Backend quota tracking system
- **[07-Figma-Guide.md](../planning/mvp/07-Figma-Guide.md)** - Color system and design tokens

---

## Version History

### v2.1.0 (Oct 28, 2025 - Evening Session)

**Major Improvements:**

1. **Industry-Standard Modal Design**
   - Changed modal to red (blocking) from amber (warning)
   - Updated copy: "Monthly Limit Reached", "You've reached your limit of 10 documents this month"
   - Removed redundant "Limit Reached" badge
   - Features-first layout with pricing secondary
   - Benefit-focused heading: "Upgrade for More Generations"
   - Compact spacing to eliminate vertical scroll
   - Title alignment fixed (items-center)

2. **Dynamic Multiplier System**
   - Auto-calculates tier multipliers: `Math.floor(nextTier.monthly / currentLimits.monthly)`
   - Free → Starter: 5x more
   - Starter → Pro: 4x more
   - Pro → Team: 5x more
   - Single source of truth for tier limits
   - No manual copy updates needed

3. **Priority-Based Banner System**
   - Shows only most critical message at a time
   - Priority order: Claude API errors > Upload errors > Usage warnings
   - Reduces UI clutter (~200px → single banner)
   - Clean user experience

4. **Consistent Styling**
   - All banners use left accent border (4px)
   - Same icon sizes (w-6 h-6)
   - Same animations (250ms enter, 200ms exit)
   - Color-coded severity (red=blocking, yellow=warning)
   - ErrorBanner updated with left accent border

5. **Banner Placement**
   - Moved to top of page (below header, above control bar)
   - Maximum visibility
   - Consistent location across all banner types

6. **Verbiage Consistency**
   - Both components use "Quota resets in X days"
   - Specific reset dates: "in 2 days" (usage box), "on Nov 1" (escape hatch)
   - Two-variant date formatting system

7. **Simplified Simulator**
   - Removed API mocking functionality (286 → 151 lines, 47% reduction)
   - Direct show/hide methods via custom events
   - No page refresh required
   - HMR friendly

8. **Accessibility Enhancements**
   - Added motion-reduce support to UsageWarningBanner
   - Consistent ARIA attributes across all banners
   - Focus management improvements

### v1.0 (Oct 28, 2025 - Initial)

- UsageWarningBanner component for 80% threshold
- UsageLimitModal component for 100% threshold
- useUsageTracking hook for API integration
- Research-based design decisions
- 14 automated tests
- WCAG 2.1 AA compliance

---

**Maintained by:** CodeScribe AI Frontend Team
