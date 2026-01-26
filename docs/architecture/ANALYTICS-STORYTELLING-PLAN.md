# Analytics Storytelling Enhancements Plan

> **Status**: Partially Implemented
> **Created**: January 2026
> **Last Updated**: January 8, 2026

## Overview

Enhance the analytics dashboard to tell a clear story about the data through:
1. **Period Comparisons** - "vs last period" trend indicators on KPIs
2. **Health at a Glance** - Top-line summary view across all metrics
3. **User Journey/Retention** - Cohort and return-user metrics
4. **Error Rate** - Prominently surfaced error metrics
5. **Guiding Questions** - Each tab answers specific questions

---

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Period Comparisons | Not Started | Future enhancement |
| Health at a Glance | Not Started | Future enhancement |
| User Journey/Retention | Not Started | Future enhancement |
| Error Rate | **Implemented** | Added to Performance tab (v3.3.5) |
| Guiding Questions | Not Started | Future enhancement |

### Additional Improvements Completed (v3.3.5)

Beyond the original plan, these analytics improvements were implemented:

- **Conversion Funnel Enhancements**
  - Trial breakdown: Trial Program vs Individual sources
  - Paid breakdown: Via Trial vs Direct conversions
  - `signup_to_paid` overall conversion rate metric
  - Percentage-first KPI display with counts as supporting text

- **Performance Tab Polish**
  - Benchmark tooltips using existing Tooltip component (brand consistency)
  - Cleaned up benchmark display (removed distracting borders/colors)
  - Error Rate section with 3 KPIs (Error Rate %, Successful, Failed)

- **Bug Fixes**
  - Fixed generation success rate (use events not sessions)
  - Fixed code sources tracking (`paste` origin when user modifies sample)
  - Fixed bash script detection (shebang without .sh extension)
  - Session Overview grid layout for 3 KPIs

---

## Feature 1: Period Comparisons (vs Last Period)

> **Status**: Not Started

### Goal
Show "+15% vs last week" style indicators on all major KPIs to instantly communicate trends.

### Implementation

#### 1.1 Backend: Add `getMetricComparison()` to analyticsService.js

```javascript
async getMetricComparison({ metric, startDate, endDate, excludeInternal = true }) {
  // Calculate previous period (same duration, immediately prior)
  const duration = endDate - startDate;
  const prevEndDate = startDate;
  const prevStartDate = new Date(startDate - duration);

  // Fetch both periods
  const [current, previous] = await Promise.all([
    this.getMetricValue({ metric, startDate, endDate, excludeInternal }),
    this.getMetricValue({ metric, startDate: prevStartDate, endDate: prevEndDate, excludeInternal })
  ]);

  // Calculate change
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return {
    current: { value: current, period: formatDateRange(startDate, endDate) },
    previous: { value: previous, period: formatDateRange(prevStartDate, prevEndDate) },
    change: {
      value: Math.abs(change),
      percent: change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    }
  };
}
```

**Metrics to support:**
- `sessions`, `signups`, `revenue`, `generations`, `completed_sessions`
- `avg_latency`, `cache_hit_rate`, `throughput`
- `errors`, `error_rate`

#### 1.2 Backend: Add bulk comparison endpoint

```javascript
// GET /api/admin/analytics/comparisons
// Returns comparisons for multiple metrics in one call
router.get('/analytics/comparisons', requireAuth, requireRole(['admin']), async (req, res) => {
  const { startDate, endDate, metrics, excludeInternal } = req.query;
  const comparisons = await analyticsService.getBulkComparisons({
    metrics: metrics.split(','),
    startDate, endDate, excludeInternal
  });
  res.json(comparisons);
});
```

#### 1.3 Frontend: Enhance StatsCard component

```javascript
// Updated StatsCard props
function StatsCard({
  icon: Icon,
  label,
  value,
  subValue,
  comparison,  // NEW: { percent, direction, period }
  color = 'purple'
}) {
  // Render comparison badge
  // e.g., "↑ 12% vs last 7 days" in green
  // or "↓ 5% vs last 7 days" in red
}
```

#### 1.4 Frontend: Fetch comparisons on tab load

Add comparison data fetching to each tab's data loading logic.

### Files to Modify
- `server/src/services/analyticsService.js` - Add comparison methods
- `server/src/routes/admin.js` - Add /comparisons endpoint
- `client/src/pages/admin/Analytics.jsx` - Fetch & pass comparison data
- `client/src/pages/admin/Analytics.jsx` - Enhance StatsCard inline component

---

## Feature 2: Health at a Glance (Summary View)

> **Status**: Not Started

### Goal
A top-level summary showing key health indicators before drilling into tabs.

### Implementation

#### 2.1 Add Summary Section above tabs

```jsx
{/* Health at a Glance - Always visible */}
<div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-lg p-6 mb-6">
  <h2>Health at a Glance</h2>
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {/* Business Health */}
    <MiniMetric label="Signups" value={signups} trend={signupsTrend} />
    <MiniMetric label="Revenue" value={revenue} trend={revenueTrend} />

    {/* Usage Health */}
    <MiniMetric label="Sessions" value={sessions} trend={sessionsTrend} />
    <MiniMetric label="Completion" value={completionRate} trend={completionTrend} />

    {/* Performance Health */}
    <MiniMetric label="Latency" value={avgLatency} trend={latencyTrend} invertTrend />
    <MiniMetric label="Errors" value={errorCount} trend={errorTrend} invertTrend />
  </div>
</div>
```

#### 2.2 Backend: Add `/analytics/summary` endpoint

Returns all summary metrics in one call for efficiency:
```javascript
{
  signups: { value: 45, change: 12.5, direction: 'up' },
  revenue: { value: 1250, change: 8.3, direction: 'up' },
  sessions: { value: 892, change: -2.1, direction: 'down' },
  completionRate: { value: 67.5, change: 5.2, direction: 'up' },
  avgLatency: { value: 1250, change: -15.3, direction: 'down' }, // down is good
  errorCount: { value: 12, change: 50, direction: 'up' } // up is bad
}
```

### Files to Modify
- `server/src/services/analyticsService.js` - Add getSummaryMetrics()
- `server/src/routes/admin.js` - Add /summary endpoint
- `client/src/pages/admin/Analytics.jsx` - Add summary section

---

## Feature 3: User Journey / Retention Metrics

> **Status**: Not Started

### Goal
Show whether users are returning and how different cohorts behave.

### Implementation

#### 3.1 Backend: Add retention query

```javascript
async getRetentionMetrics({ startDate, endDate, excludeInternal = true }) {
  // New vs Returning Sessions
  const newVsReturning = await sql`
    SELECT
      CASE WHEN session_count = 1 THEN 'new' ELSE 'returning' END as user_type,
      COUNT(*) as count
    FROM (
      SELECT user_id, COUNT(DISTINCT session_id) as session_count
      FROM analytics_events
      WHERE created_at >= ${startDate} AND created_at < ${endDate}
      GROUP BY user_id
    ) user_sessions
    GROUP BY user_type
  `;

  // Simple retention: users who returned within 7 days
  const retention = await sql`
    SELECT
      COUNT(DISTINCT a.user_id) as retained_users,
      (SELECT COUNT(DISTINCT user_id) FROM analytics_events
       WHERE created_at >= ${startDate} AND created_at < ${midDate}) as initial_users
    FROM analytics_events a
    WHERE a.user_id IN (
      SELECT DISTINCT user_id FROM analytics_events
      WHERE created_at >= ${startDate} AND created_at < ${midDate}
    )
    AND a.created_at >= ${midDate} AND a.created_at < ${endDate}
  `;

  return {
    newUsers: newVsReturning.find(r => r.user_type === 'new')?.count || 0,
    returningUsers: newVsReturning.find(r => r.user_type === 'returning')?.count || 0,
    retentionRate: (retention.retained_users / retention.initial_users) * 100
  };
}
```

#### 3.2 Frontend: Add to Usage tab

```jsx
{/* User Journey Section */}
<h2>User Journey</h2>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <StatsCard icon={UserPlus} label="New Users" value={newUsers} />
  <StatsCard icon={Users} label="Returning Users" value={returningUsers} />
  <StatsCard icon={RefreshCw} label="Return Rate" value={`${retentionRate}%`} />
</div>
```

### Files to Modify
- `server/src/services/analyticsService.js` - Add getRetentionMetrics()
- `server/src/routes/admin.js` - Add to usage endpoint or new /retention
- `client/src/pages/admin/Analytics.jsx` - Add User Journey section to Usage tab

---

## Feature 4: Error Rate Prominently Surfaced

> **Status**: Implemented (v3.3.5)

### Goal
Make errors visible and trackable, not buried in raw events.

### What Was Implemented

Error Rate section added to Performance tab with 3 KPIs:

```jsx
{/* SECTION 5: Error Rate - How reliable is doc generation? */}
{funnelData && funnelData.stages?.generation_started?.events > 0 && (
  <div className="space-y-4">
    <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        Error Rate
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        How reliable is doc generation?
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        icon={AlertCircle}
        label="Error Rate"
        value={formatPercent(errorRate)}
        subValue="Failed / Started"
        color="amber"
      />
      <StatsCard
        icon={CheckCircle}
        label="Successful"
        value={formatNumber(successfulGenerations)}
        color="green"
      />
      <StatsCard
        icon={XCircle}
        label="Failed"
        value={formatNumber(failedGenerations)}
        color="amber"
      />
    </div>
  </div>
)}
```

**Implementation Details:**
- Uses existing funnel data (`generation_started` vs `generation_completed` events)
- Calculates error rate as: `(started - completed) / started * 100`
- No new backend endpoint needed - leverages existing `/funnel` endpoint
- Fixed bug where success rate showed 100% despite failures (was using sessions instead of events)

### Future Enhancement: Top Errors Table

The original plan included a "Top Errors" table showing error breakdown by type/context. This could be added in a future iteration:

```jsx
{/* Top Errors Table - Future Enhancement */}
{errorMetrics.topErrors.length > 0 && (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
    <h3>Top Errors</h3>
    <table>
      <thead><tr><th>Error Type</th><th>Context</th><th>Count</th></tr></thead>
      <tbody>
        {errorMetrics.topErrors.map(err => (
          <tr key={`${err.error_type}-${err.context}`}>
            <td>{err.error_type}</td>
            <td>{err.context}</td>
            <td>{err.total_errors}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

---

## Feature 5: Guiding Questions per Tab

> **Status**: Not Started

### Goal
Each tab prominently displays the questions it answers, helping users understand what insights they can gain.

### Implementation

Add a "Questions this view answers" section at the top of each tab:

```jsx
const TAB_QUESTIONS = {
  business: [
    "How many visitors are converting to paying customers?",
    "What's our revenue trend?",
    "Are signups growing or declining?",
    "How effective are our trials at converting?"
  ],
  usage: [
    "How engaged are users with the product?",
    "Where is code coming from (GitHub, uploads, samples)?",
    "What documentation types are most popular?",
    "Are users completing their workflows?"
  ],
  performance: [
    "Is the product fast enough?",
    "Is prompt caching saving us money?",
    "What's our error rate?",
    "Which LLM provider performs best?"
  ]
};

// Render at top of each tab
<div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6">
  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
    Questions this view answers:
  </h3>
  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
    {TAB_QUESTIONS[activeTab].map((q, i) => (
      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
        <span className="text-purple-500">•</span>
        {q}
      </li>
    ))}
  </ul>
</div>
```

### Files to Modify
- `client/src/pages/admin/Analytics.jsx` - Add TAB_QUESTIONS and render section

---

## Remaining Implementation Order

### Phase 1: Quick Wins
1. **Guiding Questions** - Quick win, improves UX immediately (~1 hour)

### Phase 2: Comparisons & Summary
2. **StatsCard Enhancement** - Add comparison prop support
3. **Backend Comparison Methods** - Core infrastructure
4. **Bulk Comparisons Endpoint** - Efficient data fetching
5. **Health at a Glance Section** - Top-level summary
6. **Wire up comparisons to all tabs** - Show trends everywhere

### Phase 3: Depth Metrics
7. **Retention Metrics** - Add to Usage tab
8. **Top Errors Table** - Extend existing Error Rate section
9. **Polish & Testing** - Ensure all trends display correctly

---

## Files Modified Summary

### Completed (v3.3.5)

| File | Changes |
|------|---------|
| `client/src/pages/admin/Analytics.jsx` | Error Rate section, InfoTooltip using Tooltip, benchmark cleanup, funnel improvements |
| `client/src/App.jsx` | Code origin tracking fix (paste when modifying sample) |
| `server/src/services/analyticsService.js` | `signup_to_paid` rate, trial/paid breakdowns |
| `server/src/services/codeParser.js` | Bash shebang detection fix |

### Remaining

| File | Changes |
|------|---------|
| `server/src/services/analyticsService.js` | Add: getMetricComparison(), getBulkComparisons(), getSummaryMetrics(), getRetentionMetrics() |
| `server/src/routes/admin.js` | Add: /comparisons, /summary endpoints |
| `client/src/pages/admin/Analytics.jsx` | Add: TAB_QUESTIONS, Health at a Glance section, comparison fetching, enhanced StatsCard, User Journey section |

---

## Verification

1. **Period Comparisons**: Change date range and verify "vs last period" updates correctly
2. **Health at a Glance**: Verify all 6 mini-metrics load and show trends
3. **Retention**: Test with users who have multiple sessions vs single session
4. **Errors**: ~~Trigger an error event, verify it appears in Error Monitoring~~ **Done** - Error Rate section shows in Performance tab
5. **Questions**: Each tab shows relevant questions at the top

---

## Estimated Remaining Effort

- Phase 1 (Guiding Questions): ~1 hour
- Phase 2 (Comparisons & Summary): ~1 day
- Phase 3 (Retention & Polish): ~0.5 day
- **Total Remaining: ~1.5 days**
