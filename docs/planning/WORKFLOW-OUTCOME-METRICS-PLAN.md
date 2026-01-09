
# Workflow Outcome Metrics - Implementation Summary

> **Purpose:** Documentation of analytics tracking implementation for measuring CodeScribe AI's workflow outcomes.
>
> **Status:** ✅ **IMPLEMENTED** in v3.3.4 (January 6, 2026)
> **Implementation:** Comprehensive analytics dashboard with conversion funnels, business metrics, and usage patterns

---

## Implementation Summary

**Shipped in v3.3.4** - Complete analytics system with:
- ✅ Session tracking with opt-out support
- ✅ Conversion funnel visualization (5-stage funnel)
- ✅ Business metrics dashboard (signups, upgrades, revenue)
- ✅ Usage pattern analysis (doc types, quality scores, languages)
- ✅ Admin analytics dashboard with Recharts visualizations
- ✅ Database persistence for all events
- ✅ Internal user filtering (exclude admin/support)
- ✅ Date range filtering with presets

**Architecture Decisions:**
- Used **action-based events** (e.g., `user_interaction` with action parameter) instead of creating dozens of event types
- Dual-tracking: Vercel Analytics (web metrics) + PostgreSQL (admin dashboard)
- Server-side tracking for webhooks (checkout, tier changes)
- Automatic internal user detection (admin roles, tier overrides)

---

## Current State (v3.3.4+)

**Implemented Metrics:**

| Metric | Target | Implementation | Status |
|--------|--------|----------------|--------|
| Time-to-First-Doc | < 3 min | session_start → doc_generation (success) | ✅ Tracking |
| Workflow Completion Rate | > 60% | code_input → doc_generation → doc_export | ✅ Funnel visualization |
| Quality Score Distribution | > 85% score 80+ | quality_score events + histogram chart | ✅ Dashboard |
| Free-to-Paid Conversion | > 5% | usage_alert → pricing_page_viewed → tier_change | ✅ Funnel tracking |
| Regeneration Success Rate | > 80% improve | user_interaction (regeneration_complete) | ✅ Tracking |

**Can Now Answer:**
- ✅ What is our Time-to-First-Value? (Funnel tab: session → generation)
- ✅ What % of users complete the paste → copy workflow? (Conversion funnel chart)
- ✅ What is our free-to-paid conversion rate? (Business metrics tab)
- ✅ Do users who regenerate get better scores? (Query regeneration_complete events)
- ✅ What are most popular doc types? (Usage patterns tab)
- ✅ What's our quality score distribution? (Score distribution histogram)

---

## Dashboard Architecture Overview

CodeScribe AI has **three distinct dashboards** serving different stakeholders and use cases:

### 1. UsageDashboard (`/usage`) - User-Facing Personal Quota Tracking

**Route:** `/usage`
**Access:** Authenticated users (view their own data only)
**File:** `client/src/pages/UsageDashboard.jsx`

**Purpose:** Personal quota transparency and upgrade conversion

**Features:**
- Real-time usage metrics (8/10 docs used)
- Daily/monthly limits based on tier
- Reset countdown with calendar integration
- Color-coded status (green → yellow → orange → red at 80%/100%)
- Contextual upgrade prompts based on usage patterns
- Tier comparison cards
- Trial status and expiration warnings

**Data Source:** `GET /api/usage/current` (user-specific)

**Business Value:**
- Transparency → Trust → Conversions when users hit limits
- Self-service upgrade path (reduces support load)
- Trial-to-paid conversion optimization

**Example Questions Answered:**
- "How many docs can I generate today?"
- "When does my quota reset?"
- "What happens if I upgrade to Pro?"

---

### 2. AdminUsage (`/admin/usage`) - Operational Monitoring & Support

**Route:** `/admin/usage`
**Access:** Admin users only
**File:** `client/src/pages/AdminUsage.jsx`

**Purpose:** Individual user activity monitoring, troubleshooting, abuse prevention

**Features:**
- Generations by user table (sortable, filterable)
- Recent generations table (last 50 across all users)
- IP address tracking and grouping
- User type filtering (anonymous vs authenticated)
- Individual user generation history
- Real-time activity monitoring

**Data Source:** `GET /api/admin/usage-stats` (aggregated operational data)

**Business Value:**
- Support troubleshooting ("Why can't I generate docs?")
- Abuse detection (suspicious IP patterns)
- Quota enforcement verification
- User audit trail for disputes

**Example Questions Answered:**
- "What did John Doe generate yesterday?"
- "Is this IP address generating spam?"
- "Which users hit their limits most often?"
- "Show me all failed generations for user X"

---

### 3. Analytics Dashboard (`/admin/analytics`) - Business Intelligence & Product Insights

**Route:** `/admin/analytics`
**Access:** Admin users only
**File:** `client/src/pages/admin/Analytics.jsx`

**Purpose:** Aggregate product insights, workflow outcome measurement, strategic planning

**Features (Three Tabs):**

#### **Funnel Tab**
- 5-stage conversion funnel (Sessions → Code Input → Generation → Completion → Export)
- Breakdown charts:
  - Code input sources (paste, upload, github, etc.)
  - Doc export actions (copy vs download, fresh vs cached)
- Sessions over time trend chart
- Conversion rate calculations

#### **Business Tab**
- New signups trend (daily/weekly)
- Tier changes (upgrades vs downgrades vs cancellations)
- Revenue metrics (MRR, total revenue)
- Free-to-paid conversion funnel

#### **Usage Tab** ⚠️ *Different from AdminUsage*
- **Doc types distribution:** "README: 65%, JSDoc: 20%, API: 10%, Architecture: 5%"
- **Quality score histogram:** "78% of docs score 80+"
- **Language breakdown:** "JavaScript: 45%, Python: 30%, TypeScript: 15%"
- **Code origins:** "Paste: 60%, GitHub: 30%, Upload: 10%"
- **Batch vs single stats:** "Average batch size: 8 files"

**Data Source:** `GET /api/admin/analytics/{funnel,business,usage,timeseries}` (aggregated analytics_events)

**Business Value:**
- Product roadmap prioritization ("Should we improve Python support?")
- Feature adoption tracking ("Are users using GitHub import?")
- Quality target verification ("Are we hitting 80%+ quality scores?")
- Workflow completion rate monitoring (PRD outcome validation)

**Example Questions Answered:**
- "What's our paste → copy conversion rate?" (Workflow 1 outcome)
- "What % of users who hit limits actually upgrade?" (Workflow 4 outcome)
- "Are batch generations growing in popularity?" (Workflow 2 adoption)
- "What documentation types should we optimize?" (Product prioritization)

---

### Key Differences Summary

| Dimension | UsageDashboard | AdminUsage | Analytics Dashboard |
|-----------|----------------|------------|-------------------|
| **Audience** | End users | Support/ops team | Product/leadership |
| **Granularity** | Single user (self) | Individual user activity | Aggregate across all users |
| **Time horizon** | Current period (month/day) | Real-time + historical | Trends (7/30 days, custom) |
| **Primary question** | "How much can I use?" | "What did user X do?" | "How is the product performing?" |
| **Action driven** | Upgrade decision | Troubleshoot, investigate | Prioritize, plan, optimize |
| **Data structure** | User quota + usage | Raw generations table | Aggregated metrics + charts |
| **Query complexity** | O(1) user lookup | O(1) indexed user/IP | O(N) aggregations across events |
| **Update frequency** | Real-time | Real-time | Batch (daily rollups) |
| **Typical use case** | "Should I upgrade?" | "Why can't user generate docs?" | "Should we prioritize TypeScript?" |

---

### Why Three Separate Dashboards?

**Could we consolidate?** Not effectively. Here's why:

1. **Different stakeholders with different mental models:**
   - Users care about "my quota"
   - Support cares about "what went wrong for this user"
   - Product cares about "what are all users doing in aggregate"

2. **Different performance characteristics:**
   - UsageDashboard: Fast single-user query (<50ms)
   - AdminUsage: Fast indexed lookups with filtering (<200ms)
   - Analytics: Complex aggregations across millions of events (1-3s)

3. **Different workflows:**
   - UsageDashboard: Self-service quota awareness
   - AdminUsage: Reactive troubleshooting
   - Analytics: Proactive strategic planning

4. **Different access patterns:**
   - UsageDashboard: High frequency (every doc generation)
   - AdminUsage: Medium frequency (when support tickets come in)
   - Analytics: Low frequency (weekly/monthly reviews)

---

### Real-World Workflow Example

**Scenario:** User emails support: "I can't generate Python docs anymore"

**Step 1: AdminUsage** (`/admin/usage`)
- Filter to user email
- View "Generations by User" table
- See last 10 attempts all failed with "SyntaxError: invalid Python"
- Check IP address for abuse patterns (none found)
- **Action:** Reply to user with specific error, ask for code sample

**Step 2: Analytics Dashboard** (`/admin/analytics` → Usage tab)
- Check "Top Languages" chart
- Notice: Python generation success rate dropped from 95% → 75% this week
- Check "Quality Score Distribution" → Python docs scoring lower than usual
- Filter date range to last 7 days, see spike in Python errors
- **Action:** File bug ticket "Python parser regression affecting 25% of Python generations"

**Step 3: UsageDashboard** (User-facing)
- User checks their `/usage` page
- Sees "0/10 docs used today" (failed generations don't count against quota)
- Sees "10 daily, 100 monthly" limits intact
- **Result:** User understands their quota is safe while bug is being fixed

**Outcome:** All three dashboards contributed to resolving the issue at different levels (individual support, product debugging, user reassurance).

---

## Actual Implementation (v3.3.4)

### Event Architecture

**Core Design Decision:** Use **action-based events** instead of creating separate event types for each user action.

| Event Type | Purpose | Action Parameter |
|------------|---------|------------------|
| `session_start` | Session entry point | N/A |
| `code_input` | Code source tracking | origin: 'paste', 'upload', 'sample', 'github', 'gitlab', 'bitbucket' |
| `doc_generation` | Generation tracking | success: 'true'/'false' |
| `quality_score` | Quality measurement | score, grade, doc_type |
| `doc_export` | Value capture | action: 'copy', 'download' |
| `usage_alert` | Usage warnings | action: 'warning_shown', 'limit_hit' |
| `user_interaction` | General interactions | action: 'pricing_page_viewed', 'upgrade_cta_clicked', 'checkout_started', 'regeneration_complete', 'batch_generation_complete', etc. |
| `login` / `signup` | Auth events | method: 'email', 'oauth_github', 'oauth_google' |
| `checkout_completed` | Server-side payment | Webhook event |
| `tier_change` | Server-side tier changes | action: 'upgrade', 'downgrade', 'cancel' |
| `error` | Error tracking | error_type, context |
| `performance` | LLM metrics | latency, throughput, cache, llm |
| `oauth_flow` | OAuth timing | action: 'initiated', 'redirect_started', 'completed', 'failed' |

### Client-Side Implementation

**File:** `client/src/utils/analytics.js`

**Key Features:**
- ✅ Analytics opt-out support (`setAnalyticsOptOut()`)
- ✅ Session management (`getSessionId()`, `getSessionDuration()`)
- ✅ Session context auto-injected (`withSessionContext()`)
- ✅ Dual tracking: Vercel Analytics + Backend API
- ✅ Development mode console logging
- ✅ Event sanitization (remove API keys, tokens, emails)

**Tracking Functions:**
```javascript
// Session & Auth
trackSessionStart()
trackLogin({ method })
trackSignup({ method, tier, hasTrial })

// Core workflow events
trackCodeInput(origin, codeSize, language, filename, metadata)
trackDocGeneration({ docType, success, duration, codeSize, language, origin, filename, repo, llm })
trackQualityScore({ score, grade, docType })
trackDocExport({ action, docType, filename, format, source })

// Conversion funnel
trackUsageAlert({ action, tier, percentUsed, remaining, limit, period })
trackInteraction(action, metadata) // Flexible for any interaction

// Technical metrics
trackError({ errorType, errorMessage, context, codeInput, llm })
trackPerformance({ latency, throughput, input, cache, request, context, llm })
trackOAuth({ provider, action, context, duration, errorType })
```

**Session Context (Auto-Added):**
```javascript
{
  session_id: "uuid-v4",
  session_duration_ms: 45230,
  // Note: is_internal/is_admin flags set server-side via user lookup
}
```

### Server-Side Implementation

**File:** `server/src/utils/serverAnalytics.js`

**Key Features:**
- ✅ Structured logging for Vercel log drains
- ✅ Database persistence via `analyticsService`
- ✅ Automatic internal user detection
- ✅ Non-blocking (analytics errors don't break business logic)

**Tracking Functions:**
```javascript
trackCheckoutCompleted({ userId, tier, amount, billingPeriod })
trackTierChange({ action, userId, previousTier, newTier, source, reason })
trackSignup({ userId, method })
```

### Database Schema

**Table:** `analytics_events` (Migration 046)

```sql
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50),  -- 'workflow', 'business', 'usage', 'system'
  event_data JSONB NOT NULL,
  session_id VARCHAR(100),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for dashboard queries
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_data ON analytics_events USING GIN(event_data);
```

### Analytics Service

**File:** `server/src/services/analyticsService.js`

**Methods:**
- `recordEvent(eventName, data, context)` - Insert event with internal user detection
- `getConversionFunnel({ startDate, endDate, excludeInternal })` - 5-stage funnel metrics
- `getBusinessMetrics({ startDate, endDate, excludeInternal })` - Signups, upgrades, revenue
- `getUsagePatterns({ startDate, endDate, excludeInternal })` - Doc types, languages, quality
- `getTimeSeries({ metric, startDate, endDate, granularity, excludeInternal })` - Time series
- `trackTierChange({ action, userId, previousTier, newTier, source, reason })` - Tier changes
- `trackTrial({ action, userId, duration, metadata })` - Trial lifecycle tracking

**Internal User Detection:**
- Checks `users.role = 'admin'` or `subscriptions.tier_override IS NOT NULL`
- Retroactively marks session events when user logs in
- Enables "Exclude Internal" toggle in dashboard

### Admin Dashboard

**File:** `client/src/pages/admin/Analytics.jsx`

**Three-Tab Layout:**

1. **Funnel Tab**
   - 5-stage conversion funnel visualization
   - Sessions → Code Input → Generation Started → Generation Completed → Doc Export
   - Breakdown charts showing:
     - Code input sources (paste, upload, github, etc.)
     - Doc export actions (copy vs download)
   - Sessions over time trend chart

2. **Business Tab**
   - New signups trend
   - Tier changes (upgrades vs downgrades vs cancellations)
   - Revenue metrics (MRR, total revenue)

3. **Usage Tab**
   - Doc types breakdown (README, JSDoc, API, ARCHITECTURE)
   - Quality score distribution histogram
   - Batch vs single generation stats
   - Top languages and code origins

**Features:**
- Date range picker with presets (Today, Last 7/30 days, This month, Custom)
- "Exclude Internal" toggle
- Dark mode support
- Accessible "Show as Table" option for all charts
- Recharts visualization library

---

## Implementation Files (v3.3.4)

### Frontend Files

| File | Implementation | Lines |
|------|----------------|-------|
| `client/src/utils/analytics.js` | Complete rewrite with opt-out, session tracking, 13 track functions | ~660 |
| `client/src/contexts/AuthContext.jsx` | Added `setAnalyticsOptOut()` sync, `trackSessionStart()`, `trackLogin()`, `trackSignup()` | ~30 |
| `client/src/components/DocPanel.jsx` | Added `trackDocExport()` for copy/download | ~10 |
| `client/src/components/UsageWarningBanner.jsx` | Added `trackUsageAlert('warning_shown')` | ~8 |
| `client/src/components/UsageLimitModal.jsx` | Added `trackUsageAlert('limit_hit')` | ~8 |
| `client/src/components/PricingPage.jsx` | Added pricing_page_viewed, upgrade_cta_clicked, checkout_started | ~20 |
| `client/src/hooks/useBatchGeneration.js` | Added regeneration_complete, batch_generation_complete | ~15 |
| `client/src/pages/admin/Analytics.jsx` | **NEW** - Complete dashboard with 3 tabs | ~900 |
| `client/src/components/admin/charts/*` | **NEW** - 5 chart components (Funnel, Trend, Comparison, Donut, Score Distribution) | ~600 |
| `client/src/components/admin/DateRangePicker.jsx` | **NEW** - Date range selector with presets | ~150 |
| `client/src/components/admin/EventsTable.jsx` | Event category badges, multi-select filter | ~50 |

### Backend Files

| File | Implementation | Lines |
|------|----------------|-------|
| `server/src/utils/serverAnalytics.js` | **NEW** - Server-side tracking for webhooks | ~125 |
| `server/src/services/analyticsService.js` | **NEW** - Complete analytics service with 7 query methods | ~800 |
| `server/src/routes/analytics.js` | **NEW** - 5 API endpoints for dashboard | ~200 |
| `server/src/routes/webhooks.js` | Added `trackCheckoutCompleted()`, `trackTierChange()` | ~20 |
| `server/src/db/migrations/046-*.sql` | **NEW** - analytics_events table | ~50 |
| `server/src/db/migrations/050-*.sql` | **NEW** - Event category reclassification | ~30 |

### Test Files

| File | Tests Added | Lines |
|------|-------------|-------|
| `client/src/utils/__tests__/analytics.test.js` | Session tracking, opt-out, context injection | ~200 |
| `server/src/services/__tests__/analyticsService.test.js` | **NEW** - 64 tests covering all service methods | ~1200 |
| `server/src/routes/__tests__/admin-analytics.test.js` | **NEW** - API endpoint tests | ~300 |

---

## Dashboard Query Examples

### 1. Time-to-First-Value
```javascript
// analyticsService.getConversionFunnel()
const funnel = await pool.query(`
  WITH sessions AS (
    SELECT session_id, MIN(created_at) as session_start
    FROM analytics_events
    WHERE event_name = 'session_start'
      AND created_at >= $1 AND created_at <= $2
    GROUP BY session_id
  ),
  first_generation AS (
    SELECT session_id, MIN(created_at) as first_gen
    FROM analytics_events
    WHERE event_name = 'doc_generation'
      AND event_data->>'success' = 'true'
    GROUP BY session_id
  )
  SELECT
    AVG(EXTRACT(EPOCH FROM (fg.first_gen - s.session_start))) as avg_ttfv_seconds
  FROM sessions s
  JOIN first_generation fg ON s.session_id = fg.session_id
`, [startDate, endDate]);
```

### 2. Workflow Completion Rate
```javascript
// Already implemented in analyticsService.getConversionFunnel()
{
  sessions: 1250,              // Total sessions
  code_input: 875,            // 70% entered code
  generation_started: 830,     // 66% started generation
  generation_completed: 780,   // 62% completed
  doc_export: 710,            // 57% copied/downloaded
  conversion_rate: 57%         // Sessions → Export
}
```

### 3. Free-to-Paid Conversion
```javascript
// analyticsService.getBusinessMetrics()
const conversion = await pool.query(`
  WITH limits AS (
    SELECT DISTINCT user_id
    FROM analytics_events
    WHERE event_name = 'usage_alert'
      AND event_data->>'action' = 'limit_hit'
      AND created_at >= $1
  ),
  upgrades AS (
    SELECT DISTINCT user_id
    FROM analytics_events
    WHERE event_name = 'tier_change'
      AND event_data->>'action' = 'upgrade'
      AND created_at >= $1
  )
  SELECT
    COUNT(DISTINCT l.user_id) as hit_limit,
    COUNT(DISTINCT u.user_id) as upgraded,
    ROUND(COUNT(DISTINCT u.user_id) * 100.0 / NULLIF(COUNT(DISTINCT l.user_id), 0), 2) as conversion_rate
  FROM limits l
  LEFT JOIN upgrades u ON l.user_id = u.user_id
`, [startDate]);
```

### 4. Regeneration Success Rate
```javascript
// Query regeneration_complete events
const regenerations = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE (event_data->>'improved')::boolean = true) * 100.0 / COUNT(*) as success_rate,
    AVG((event_data->>'improvement')::numeric) as avg_improvement
  FROM analytics_events
  WHERE event_name = 'user_interaction'
    AND event_data->>'action' = 'regeneration_complete'
    AND created_at >= $1
`, [startDate]);
```

---

## Testing Coverage

### Unit Tests (client/src/utils/__tests__/analytics.test.js)
- ✅ Session ID generation and persistence
- ✅ Session duration calculation
- ✅ Analytics opt-out respects user preference
- ✅ Session context auto-injection
- ✅ Development mode console logging
- ✅ Production mode Vercel Analytics + backend tracking
- ✅ Error message sanitization

### Integration Tests (server/src/services/__tests__/analyticsService.test.js)
- ✅ recordEvent with user association
- ✅ Internal user detection (admin role, tier override)
- ✅ Conversion funnel queries with date filtering
- ✅ Business metrics (signups, upgrades, downgrades)
- ✅ Usage patterns (doc types, languages, quality scores)
- ✅ Time series aggregation (daily/weekly)
- ✅ Tier change tracking (upgrade, downgrade, cancel)
- ✅ Trial lifecycle tracking (started, expired, converted)
- ✅ Exclude internal filter (business metrics accuracy)

### API Tests (server/src/routes/__tests__/admin-analytics.test.js)
- ✅ POST /api/analytics/track (public endpoint, rate limited)
- ✅ GET /api/admin/analytics/funnel (admin only)
- ✅ GET /api/admin/analytics/business (admin only)
- ✅ GET /api/admin/analytics/usage (admin only)
- ✅ GET /api/admin/analytics/timeseries (admin only)

---

## Deployment & Rollout (Completed)

### v3.3.4 Release (January 6, 2026)
- ✅ Deployed analytics dashboard to production
- ✅ Backend API endpoints live
- ✅ Database migrations applied (046, 050)
- ✅ Frontend event tracking active
- ✅ Server-side webhook tracking active
- ✅ Admin dashboard accessible at /admin/analytics

### Post-Launch Monitoring
- ✅ Events flowing to database (verified via admin dashboard)
- ✅ Vercel Analytics receiving events
- ✅ Internal user filtering working correctly
- ✅ Date range filtering functional
- ✅ All charts rendering with dark mode support

---

## Future Enhancements (Roadmap)

### Already Implemented
- ✅ **Analytics Dashboard** - Admin page with funnel/business/usage metrics (v3.3.4)
- ✅ **Funnel Visualization** - Recharts-powered conversion funnel (v3.3.4)
- ✅ **Internal User Filtering** - Exclude admin/support from business metrics (v3.3.4)

### Planned
- [ ] **A/B Testing Infrastructure** - Experiment tracking for feature flags
- [ ] **Cohort Analysis** - Track user cohorts over time (weekly/monthly cohorts)
- [ ] **Real-Time Dashboard** - WebSocket updates for live metrics
- [ ] **Custom Event Explorer** - Query builder for ad-hoc analysis
- [ ] **Automated Reporting** - Weekly/monthly email reports for stakeholders
- [ ] **Anomaly Detection** - Alert on unusual patterns (conversion drops, error spikes)

---

## References

### Documentation
- [Workflow-First PRD Example](../templates/WORKFLOW-FIRST-PRD-EXAMPLE-CODESCRIBE.md) - Original workflow definitions
- [WORKFLOW-EVENTING-FLOW.md](./WORKFLOW-EVENTING-FLOW.md) - Sequence diagrams for all 5 workflows
- [Vercel Analytics Docs](https://vercel.com/docs/analytics) - Analytics platform documentation

### Implementation Files
- [client/src/utils/analytics.js](../../client/src/utils/analytics.js) - Frontend tracking (13 functions)
- [server/src/utils/serverAnalytics.js](../../server/src/utils/serverAnalytics.js) - Server-side tracking
- [server/src/services/analyticsService.js](../../server/src/services/analyticsService.js) - Database queries (7 methods)
- [client/src/pages/admin/Analytics.jsx](../../client/src/pages/admin/Analytics.jsx) - Admin dashboard

### Related Guides
- [CHANGELOG.md](../../CHANGELOG.md) - See v3.3.4 release notes
- [Admin Analytics Tests](../../server/src/routes/__tests__/admin-analytics.test.js) - API test examples
- [Analytics Service Tests](../../server/src/services/__tests__/analyticsService.test.js) - Query test examples

---

**Document Status:** ✅ Updated (January 9, 2026)
**Version:** Reflects v3.3.4+ implementation
**Maintainer:** CodeScribe AI Team
