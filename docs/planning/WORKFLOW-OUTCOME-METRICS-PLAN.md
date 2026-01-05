# Workflow Outcome Metrics Implementation Plan

> **Purpose:** Implement analytics tracking to measure whether CodeScribe AI achieves its workflow outcomes as defined in the Workflow-First PRD.
>
> **Estimated Effort:** 4-6 hours
> **Priority:** High (Cannot evaluate business outcomes without this)

---

## Problem Statement

We have a comprehensive Workflow-First PRD defining 5 core workflows with measurable outcomes, but our current analytics implementation only tracks ~25% of the metrics needed to evaluate success.

**Current State:**
- 8 custom Vercel Analytics events (basic coverage)
- Database stores rich metadata (quality scores, batch stats)
- No session tracking, no funnel tracking, no conversion metrics
- **BUG:** Custom events in `analytics.js` don't respect user's analytics opt-out preference (only `AnalyticsWrapper.jsx` does)

**Gap:** Cannot answer key business questions:
- What is our Time-to-First-Value?
- What % of users complete the paste → copy workflow?
- What is our free-to-paid conversion rate?
- Do users who regenerate get better scores?

---

## Success Criteria

After implementation, we can measure:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time-to-First-Doc | < 3 min | Session start → first generation complete |
| Workflow Completion Rate | > 60% | Users who paste code AND copy output |
| Quality Score Distribution | > 85% score 80+ | Aggregated from quality_score events |
| Free-to-Paid Conversion | > 5% | Limit hit → subscription created funnel |
| Regeneration Success Rate | > 80% improve | Before/after score comparison |

---

## Implementation Phases

### Phase 1: Fix Analytics Opt-Out + Add Session Infrastructure (45 min)

**Goal:**
1. **FIX BUG:** Ensure all custom events respect user's analytics opt-out preference
2. Enable session-level tracking and returning user detection

**Current Bug:** `analytics.js` custom events don't check `user.analytics_enabled`, only `isProduction`. This means opted-out users are still tracked via custom events.

**File:** `client/src/utils/analytics.js`

```javascript
// Add to analytics.js

import { STORAGE_KEYS } from '../constants/storage';

// ===========================================
// ANALYTICS OPT-OUT SUPPORT
// ===========================================

// Module-level state for opt-out (updated by React context)
let analyticsOptedOut = false;

/**
 * Update the analytics opt-out state
 * Called from AuthContext when user data changes
 * @param {boolean} optedOut - Whether user has opted out
 */
export const setAnalyticsOptOut = (optedOut) => {
  analyticsOptedOut = optedOut;
};

/**
 * Check if analytics is currently enabled
 * Respects both production check and user opt-out
 */
const isAnalyticsEnabled = () => {
  if (!isProduction) return false;
  if (analyticsOptedOut) return false;
  return true;
};

// Update trackEvent to use the new check
const trackEvent = (eventName, eventData) => {
  if (isAnalyticsEnabled()) {
    track(eventName, eventData);
  } else if (!isProduction) {
    // Log to console in development for debugging
    console.debug(`[Analytics] ${eventName}:`, eventData);
  }
  // If opted out in production, silently skip
};

// ===========================================
// SESSION MANAGEMENT
// ===========================================

const SESSION_KEY = 'cs_session_id';
const SESSION_START_KEY = 'cs_session_start';
const SESSION_COUNT_KEY = 'cs_session_count';

export const getSessionId = () => {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());

    // Track session count in localStorage for returning user detection
    const sessionCount = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
    localStorage.setItem(SESSION_COUNT_KEY, (sessionCount + 1).toString());
  }
  return sessionId;
};

export const getSessionStart = () => {
  return parseInt(sessionStorage.getItem(SESSION_START_KEY) || Date.now().toString(), 10);
};

export const isReturningUser = () => {
  const sessionCount = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
  return sessionCount > 1;
};

export const getSessionDuration = () => {
  const start = getSessionStart();
  return Date.now() - start;
};

// Enhance all track functions to include session context
const withSessionContext = (data) => ({
  ...data,
  sessionId: getSessionId(),
  isReturningUser: isReturningUser(),
  sessionDurationMs: getSessionDuration(),
});
```

**Update AuthContext to sync opt-out state:**

```javascript
// In AuthContext.jsx - add to useEffect that handles user changes

import { setAnalyticsOptOut } from '../utils/analytics';

// When user changes, update analytics opt-out state
useEffect(() => {
  if (user) {
    // User opted out if analytics_enabled is explicitly false
    setAnalyticsOptOut(user.analytics_enabled === false);
  } else {
    // Anonymous users have analytics enabled by default
    setAnalyticsOptOut(false);
  }
}, [user]);
```

**Update existing track functions to include session context:**
```javascript
export const trackDocGeneration = ({ docType, success, duration, codeSize, language }) => {
  trackEvent('doc_generation', withSessionContext({
    doc_type: docType,
    success: success ? 'true' : 'false',
    duration_ms: Math.round(duration),
    code_size_kb: Math.round(codeSize / 1024),
    language: language || 'unknown',
  }));
};

// ... apply withSessionContext to all existing track functions
```

---

### Phase 2: Copy/Download Tracking (15 min)

**Goal:** Track value capture - when users copy or download documentation.

**Files to modify:**
- `client/src/components/CopyButton.jsx`
- `client/src/components/DownloadButton.jsx`
- `client/src/components/DocPanel.jsx` (for copy code blocks)

**CopyButton.jsx changes:**
```javascript
import { trackInteraction } from '../utils/analytics';

const handleCopy = async () => {
  await navigator.clipboard.writeText(text);
  setCopied(true);

  // Track copy event
  trackInteraction('copy_documentation', {
    contentLength: text.length,
    docType: docType, // Pass from parent
    hasQualityScore: !!qualityScore,
    qualityScore: qualityScore?.score,
  });

  setTimeout(() => setCopied(false), 2000);
};
```

**DownloadButton.jsx changes:**
```javascript
import { trackInteraction } from '../utils/analytics';

const handleDownload = () => {
  // ... existing download logic

  trackInteraction('download_documentation', {
    format: format, // 'md', 'txt', 'zip'
    fileCount: fileCount || 1,
    docType: docType,
    includesQualityReport: includesQualityReport,
  });
};
```

---

### Phase 3: Workflow Funnel Events (45 min)

**Goal:** Track complete workflow funnels for each core workflow.

#### Workflow 1: First Value Moment

**Events to add:**

| Event | Trigger | Location | Funnel Stage |
|-------|---------|----------|--------------|
| `session_start` | Page load (first time) | `App.jsx` or `analytics.js` init | Entry |
| `code_input_start` | User starts typing/pasting | `CodePanel.jsx` | Engage |
| `generation_started` | Click Generate | `useDocGeneration.js` | Commit |
| `generation_complete` | Streaming finishes (score visible inline) | `useDocGeneration.js` | **Value Delivered** |
| `documentation_copied` | Click copy | `CopyButton.jsx` | Value Captured |
| `quality_breakdown_viewed` | Open quality modal (optional) | `QualityScore.jsx` | Engagement (not in funnel) |

**App.jsx - Session start:**
```javascript
import { trackInteraction, getSessionId, isReturningUser } from './utils/analytics';

useEffect(() => {
  // Track session start once per session
  const hasTrackedSession = sessionStorage.getItem('cs_session_tracked');
  if (!hasTrackedSession) {
    trackInteraction('session_start', {
      isReturningUser: isReturningUser(),
      referrer: document.referrer,
      landingPage: window.location.pathname,
    });
    sessionStorage.setItem('cs_session_tracked', 'true');
  }
}, []);
```

**CodePanel.jsx - Code input tracking:**
```javascript
const handleCodeChange = (value) => {
  setCode(value);

  // Track first meaningful input (debounced)
  if (value.length > 50 && !hasTrackedInput.current) {
    trackInteraction('code_input_start', {
      method: inputMethod, // 'typed', 'pasted', 'uploaded', 'github'
      codeLength: value.length,
    });
    hasTrackedInput.current = true;
  }
};
```

#### Workflow 3: Regeneration Tracking

**QualityScore.jsx or regeneration handler:**
```javascript
const handleRegenerate = async () => {
  const previousScore = currentScore;

  // ... regeneration logic

  const newScore = result.qualityScore;

  trackInteraction('regeneration_complete', {
    previousScore: previousScore,
    newScore: newScore,
    improvement: newScore - previousScore,
    improved: newScore > previousScore,
    docType: docType,
  });
};
```

---

### Phase 4: Conversion Funnel (45 min)

**Goal:** Track the complete free-to-paid conversion funnel.

#### Events to add:

| Event | Trigger | Location |
|-------|---------|----------|
| `usage_warning_shown` | 80% banner displayed | `UsageWarningBanner.jsx` |
| `usage_limit_hit` | 100% modal displayed | `UsageLimitModal.jsx` |
| `pricing_page_viewed` | Visit pricing page | `PricingPage.jsx` |
| `upgrade_cta_clicked` | Click upgrade button | `PricingPage.jsx` |
| `checkout_started` | Redirect to Stripe | `PricingPage.jsx` or checkout handler |
| `checkout_completed` | Webhook received | `server/src/routes/webhooks.js` |
| `tier_upgraded` | Subscription confirmed | `server/src/routes/webhooks.js` |

**UsageWarningBanner.jsx:**
```javascript
useEffect(() => {
  if (isVisible) {
    trackInteraction('usage_warning_shown', {
      percentUsed: percentUsed,
      tier: currentTier,
      docsRemaining: docsRemaining,
    });
  }
}, [isVisible]);
```

**UsageLimitModal.jsx:**
```javascript
useEffect(() => {
  if (isOpen) {
    trackInteraction('usage_limit_hit', {
      tier: currentTier,
      limitType: limitType, // 'daily' or 'monthly'
    });
  }
}, [isOpen]);
```

**PricingPage.jsx:**
```javascript
useEffect(() => {
  trackInteraction('pricing_page_viewed', {
    source: searchParams.get('source') || 'direct',
    currentTier: user?.tier || 'anonymous',
    isTrialUser: isTrialUser,
  });
}, []);

const handleUpgradeClick = (targetTier) => {
  trackInteraction('upgrade_cta_clicked', {
    currentTier: user?.tier,
    targetTier: targetTier,
    billingPeriod: billingPeriod,
  });

  // ... proceed to checkout
};
```

**Server-side webhook tracking (webhooks.js):**
```javascript
// Add server-side analytics helper
import { trackServerEvent } from '../utils/serverAnalytics.js';

// In checkout.session.completed handler:
trackServerEvent('checkout_completed', {
  userId: user.id,
  tier: subscription.tier,
  amount: session.amount_total,
  billingPeriod: subscription.billing_period,
});

// In subscription tier change:
trackServerEvent('tier_upgraded', {
  userId: user.id,
  previousTier: previousTier,
  newTier: newTier,
  source: 'stripe_webhook',
});
```

---

### Phase 5: Batch Metrics Export (30 min)

**Goal:** Export existing database batch metrics to analytics events.

**useBatchGeneration.js - After batch completion:**
```javascript
const handleBatchComplete = (results) => {
  const successCount = results.filter(r => r.success).length;
  const avgScore = results
    .filter(r => r.qualityScore)
    .reduce((sum, r) => sum + r.qualityScore, 0) / successCount;

  trackInteraction('batch_generation_complete', {
    totalFiles: results.length,
    successCount: successCount,
    failedCount: results.length - successCount,
    avgQualityScore: Math.round(avgScore),
    docTypes: [...new Set(results.map(r => r.docType))],
    source: batchSource, // 'github', 'upload', 'mixed'
    durationMs: Date.now() - batchStartTime,
  });
};
```

---

### Phase 6: Server-Side Analytics Helper (30 min)

**Goal:** Enable server-side event tracking for webhook events.

**New file:** `server/src/utils/serverAnalytics.js`

```javascript
/**
 * Server-side analytics tracking
 * Sends events to a simple analytics endpoint or logs for processing
 */

const ANALYTICS_ENABLED = process.env.NODE_ENV === 'production';

export const trackServerEvent = async (eventName, data) => {
  if (!ANALYTICS_ENABLED) {
    console.log(`[Analytics] ${eventName}:`, data);
    return;
  }

  try {
    // Option 1: Log to stdout for Vercel log processing
    console.log(JSON.stringify({
      type: 'analytics_event',
      event: eventName,
      timestamp: new Date().toISOString(),
      ...data,
    }));

    // Option 2: Send to analytics endpoint (if we add one)
    // await fetch(ANALYTICS_ENDPOINT, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ event: eventName, ...data }),
    // });
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
};
```

---

## File Changes Summary

| File | Changes | Est. Time |
|------|---------|-----------|
| `client/src/utils/analytics.js` | **FIX:** Add opt-out support, session tracking, withSessionContext | 45 min |
| `client/src/contexts/AuthContext.jsx` | Sync analytics opt-out state when user changes | 5 min |
| `client/src/components/CopyButton.jsx` | Add copy tracking | 5 min |
| `client/src/components/DownloadButton.jsx` | Add download tracking | 5 min |
| `client/src/App.jsx` | Session start event | 5 min |
| `client/src/components/CodePanel.jsx` | Code input start tracking | 10 min |
| `client/src/hooks/useDocGeneration.js` | Generation start/complete events | 10 min |
| `client/src/components/QualityScore.jsx` | Quality viewed, regeneration tracking | 15 min |
| `client/src/components/UsageWarningBanner.jsx` | Warning shown event | 5 min |
| `client/src/components/UsageLimitModal.jsx` | Limit hit event | 5 min |
| `client/src/pages/PricingPage.jsx` | Page view, CTA click events | 10 min |
| `client/src/hooks/useBatchGeneration.js` | Batch complete metrics | 15 min |
| `server/src/utils/serverAnalytics.js` | New file - server-side tracking | 15 min |
| `server/src/routes/webhooks.js` | Checkout/upgrade events | 15 min |

**Total: ~2.5 hours implementation + 1.5 hours testing = 4 hours**

---

## Testing Plan

### Unit Tests

```javascript
// analytics.test.js
describe('Session Tracking', () => {
  it('generates unique session ID', () => {
    const id1 = getSessionId();
    const id2 = getSessionId();
    expect(id1).toBe(id2); // Same session
  });

  it('detects returning users', () => {
    localStorage.setItem('cs_session_count', '3');
    expect(isReturningUser()).toBe(true);
  });

  it('includes session context in events', () => {
    const data = withSessionContext({ foo: 'bar' });
    expect(data.sessionId).toBeDefined();
    expect(data.isReturningUser).toBeDefined();
  });
});
```

### Integration Tests

1. **First Value Funnel:**
   - Load app → paste code → generate → copy
   - Verify events: session_start → code_input_start → generation_started → generation_complete → documentation_copied

2. **Conversion Funnel:**
   - Hit usage limit → view pricing → click upgrade
   - Verify events: usage_limit_hit → pricing_page_viewed → upgrade_cta_clicked

3. **Regeneration:**
   - Generate doc → regenerate → verify score comparison event

---

## Analytics Dashboard Queries

Once implemented, create Vercel Analytics dashboard with:

### Time-to-First-Value
```sql
SELECT
  AVG(generation_complete_time - session_start_time) as avg_time_to_value
FROM events
WHERE event = 'generation_complete'
  AND session_id IN (
    SELECT session_id FROM events WHERE event = 'session_start'
  )
```

### Workflow Completion Rate
```sql
SELECT
  COUNT(DISTINCT CASE WHEN copied THEN session_id END) * 100.0 /
  COUNT(DISTINCT session_id) as completion_rate
FROM (
  SELECT
    session_id,
    MAX(CASE WHEN event = 'code_input_start' THEN 1 END) as started,
    MAX(CASE WHEN event = 'documentation_copied' THEN 1 END) as copied
  FROM events
  GROUP BY session_id
) funnel
WHERE started = 1
```

### Conversion Funnel
```sql
SELECT
  COUNT(DISTINCT CASE WHEN event = 'usage_limit_hit' THEN session_id END) as hit_limit,
  COUNT(DISTINCT CASE WHEN event = 'pricing_page_viewed' THEN session_id END) as viewed_pricing,
  COUNT(DISTINCT CASE WHEN event = 'upgrade_cta_clicked' THEN session_id END) as clicked_upgrade,
  COUNT(DISTINCT CASE WHEN event = 'checkout_completed' THEN user_id END) as completed
FROM events
WHERE timestamp > NOW() - INTERVAL '30 days'
```

---

## Rollout Plan

### Phase 1: Development (Day 1)
- [ ] Implement session tracking infrastructure
- [ ] Add copy/download tracking
- [ ] Test locally with console logging

### Phase 2: Core Funnels (Day 1)
- [ ] Implement workflow funnel events
- [ ] Implement conversion funnel events
- [ ] Add server-side analytics helper

### Phase 3: Testing (Day 1)
- [ ] Write unit tests for analytics utilities
- [ ] Manual testing of all event flows
- [ ] Verify events in Vercel Analytics dev mode

### Phase 4: Deploy & Monitor (Day 2)
- [ ] Deploy to production
- [ ] Monitor events in Vercel Analytics
- [ ] Create dashboard queries
- [ ] Document baseline metrics

---

## Future Enhancements

1. **Analytics Dashboard Page** - Admin page showing key metrics
2. **A/B Testing Infrastructure** - Experiment tracking
3. **Cohort Analysis** - Track user cohorts over time
4. **Funnel Visualization** - Visual funnel charts in admin

---

## References

- [Workflow-First PRD Template](../templates/WORKFLOW-FIRST-PRD-TEMPLATE.md)
- [Workflow-First PRD Example](../templates/WORKFLOW-FIRST-PRD-EXAMPLE-CODESCRIBE.md)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Current Analytics Implementation](../../client/src/utils/analytics.js)
