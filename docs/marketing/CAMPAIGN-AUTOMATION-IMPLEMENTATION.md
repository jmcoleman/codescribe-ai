# Trial Program Metrics Automation - Implementation Plan

## 🎯 Goal
Eliminate manual SQL queries and provide one-click export of all campaign metrics for spreadsheet tracking.

---

## 📊 Solution: Hybrid Approach

**Philosophy:** Add events for important milestones, compute aggregations on-demand.

### What Gets Event Tracking (Real-time monitoring)
- ✅ Email verification (new)
- ✅ First generation milestone (new)

### What Gets Computed On-Demand (Export only)
- ✅ Usage segments (10+, 50+, 100+ gens)
- ✅ Cohort retention
- ✅ Trial Program attribution
- ✅ All aggregations

**Result:** Minimal database growth, maximum automation.

---

## 🚀 Implementation (3 Changes)

### Change 1: Add Email Verification Event

**File:** `server/src/routes/auth.js`

**Location:** Email verification handler (around line 200-250)

```javascript
// After successful email verification
router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // ... existing verification logic ...

    // Update user
    await User.update(userId, { email_verified: true });

    // ✨ NEW: Track email verification event
    await trackEvent({
      userId,
      eventName: 'email_verified',
      category: 'business',
      eventData: {
        verification_method: 'email_link',
        days_to_verify: daysFromSignup
      }
    });

    // ... rest of existing code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

**Impact:** Email verification now appears in analytics events → can track verification rate automatically.

---

### Change 2: Add First Generation Milestone Event

**File:** `server/src/routes/generate.js` or `server/src/services/docGenerator.js`

**Location:** After successful document generation

```javascript
// In the generation completion handler
async function handleGenerationSuccess(userId, docData) {
  // Save generated document
  const doc = await GeneratedDocument.create({ userId, ...docData });

  // ✨ NEW: Check if this is user's first generation
  const generationCount = await GeneratedDocument.countByUser(userId);

  if (generationCount === 1) {
    // Track first generation milestone
    await trackEvent({
      userId,
      eventName: 'first_generation',
      category: 'workflow',
      action: 'activated',
      eventData: {
        doc_type: docData.docType,
        hours_since_signup: hoursFromSignup,
        origin: docData.origin // paste/upload/sample/github
      }
    });
  }

  // Existing success handling...
  return doc;
}
```

**Impact:** First generation (activation) now tracked as event → activation rate automatically available.

---

### Change 3: Trial Program Export API Endpoint

**File:** `server/src/routes/admin-analytics.js`

**Location:** Add new route

```javascript
/**
 * GET /api/admin/analytics/campaign-export
 *
 * One-click export of all campaign metrics for spreadsheet import.
 * Returns data formatted for easy copy-paste into Google Sheets/Excel.
 */
router.get('/campaign-export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, campaignSource = 'auto_campaign' } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }

    // 1. Get signups & verification (from events + users table)
    const signups = await pool.query(`
      SELECT
        DATE(u.created_at) as date,
        COUNT(DISTINCT u.id) as total_signups,
        COUNT(DISTINCT CASE WHEN u.email_verified THEN u.id END) as verified_signups,
        COUNT(DISTINCT ut.user_id) as campaign_signups
      FROM users u
      LEFT JOIN user_trials ut ON u.id = ut.user_id AND ut.source = $3
      WHERE u.created_at >= $1
        AND u.created_at < $2
        AND u.role != 'admin'
      GROUP BY DATE(u.created_at)
      ORDER BY date
    `, [startDate, endDate, campaignSource]);

    // 2. Get activation metrics (first generation)
    const activation = await pool.query(`
      SELECT
        DATE(u.created_at) as cohort_date,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT gd.user_id) as activated_users,
        ROUND(COUNT(DISTINCT gd.user_id) * 100.0 / NULLIF(COUNT(DISTINCT u.id), 0), 2) as activation_rate
      FROM users u
      LEFT JOIN generated_documents gd ON u.id = gd.user_id
      WHERE u.created_at >= $1
        AND u.created_at < $2
        AND u.role != 'admin'
      GROUP BY DATE(u.created_at)
      ORDER BY cohort_date
    `, [startDate, endDate]);

    // 3. Get usage segments
    const usageSegments = await pool.query(`
      SELECT
        CASE
          WHEN COALESCE(uq.monthly_count, 0) = 0 THEN 'No Usage (0 gens)'
          WHEN uq.monthly_count BETWEEN 1 AND 9 THEN 'Light Users (1-9 gens)'
          WHEN uq.monthly_count BETWEEN 10 AND 49 THEN 'Engaged Users (10-49 gens)'
          WHEN uq.monthly_count BETWEEN 50 AND 99 THEN 'Power Users (50-99 gens)'
          WHEN uq.monthly_count >= 100 THEN 'Max Users (100+ gens)'
        END as segment,
        COUNT(*) as user_count,
        ROUND(AVG(uq.monthly_count), 1) as avg_generations,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM users u
      LEFT JOIN user_quotas uq ON u.id = uq.user_id
      WHERE u.created_at >= $1
        AND u.created_at < $2
        AND u.role != 'admin'
      GROUP BY segment
      ORDER BY
        CASE segment
          WHEN 'No Usage (0 gens)' THEN 1
          WHEN 'Light Users (1-9 gens)' THEN 2
          WHEN 'Engaged Users (10-49 gens)' THEN 3
          WHEN 'Power Users (50-99 gens)' THEN 4
          WHEN 'Max Users (100+ gens)' THEN 5
        END
    `, [startDate, endDate]);

    // 4. Get trial conversions
    const conversions = await pool.query(`
      SELECT
        DATE(ut.started_at) as trial_date,
        COUNT(*) as trials_started,
        COUNT(CASE WHEN ut.status = 'converted' THEN 1 END) as conversions,
        ROUND(COUNT(CASE WHEN ut.status = 'converted' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as conversion_rate,
        ROUND(AVG(CASE
          WHEN ut.status = 'converted'
          THEN EXTRACT(EPOCH FROM (ut.converted_at - ut.started_at)) / 86400
        END), 1) as avg_days_to_convert
      FROM user_trials ut
      WHERE ut.source = $3
        AND ut.started_at >= $1
        AND ut.started_at < $2
      GROUP BY DATE(ut.started_at)
      ORDER BY trial_date
    `, [startDate, endDate, campaignSource]);

    // 5. Get revenue metrics
    const revenue = await pool.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as transactions,
        SUM(event_data->>'amount_cents')::int as revenue_cents,
        ROUND(SUM(event_data->>'amount_cents')::int / 100.0, 2) as revenue_dollars
      FROM raw_events
      WHERE event_name = 'checkout_completed'
        AND category = 'business'
        AND created_at >= $1
        AND created_at < $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);

    // 6. Get cohort summary
    const cohortSummary = await pool.query(`
      SELECT
        COUNT(DISTINCT u.id) as total_signups,
        COUNT(DISTINCT CASE WHEN u.email_verified THEN u.id END) as verified_users,
        COUNT(DISTINCT gd.user_id) as activated_users,
        COUNT(DISTINCT ut.user_id) FILTER (WHERE ut.status = 'converted') as converted_users,
        COUNT(DISTINCT us.user_id) FILTER (WHERE us.status = 'active') as active_subscribers
      FROM users u
      LEFT JOIN generated_documents gd ON u.id = gd.user_id
      LEFT JOIN user_trials ut ON u.id = ut.user_id AND ut.source = $3
      LEFT JOIN user_subscriptions us ON u.id = us.user_id
      WHERE u.created_at >= $1
        AND u.created_at < $2
        AND u.role != 'admin'
    `, [startDate, endDate, campaignSource]);

    // 7. Calculate key metrics
    const summary = cohortSummary.rows[0];
    const totalSignups = parseInt(summary.total_signups) || 0;
    const verificationRate = totalSignups > 0
      ? ((parseInt(summary.verified_users) / totalSignups) * 100).toFixed(2)
      : 0;
    const activationRate = totalSignups > 0
      ? ((parseInt(summary.activated_users) / totalSignups) * 100).toFixed(2)
      : 0;
    const conversionRate = totalSignups > 0
      ? ((parseInt(summary.converted_users) / totalSignups) * 100).toFixed(2)
      : 0;

    // Return formatted data
    res.json({
      campaign: {
        startDate,
        endDate,
        source: campaignSource
      },
      summary: {
        total_signups: totalSignups,
        verified_users: parseInt(summary.verified_users),
        activated_users: parseInt(summary.activated_users),
        converted_users: parseInt(summary.converted_users),
        active_subscribers: parseInt(summary.active_subscribers),
        verification_rate: parseFloat(verificationRate),
        activation_rate: parseFloat(activationRate),
        conversion_rate: parseFloat(conversionRate)
      },
      daily: {
        signups: signups.rows,
        activation: activation.rows,
        conversions: conversions.rows,
        revenue: revenue.rows
      },
      segments: usageSegments.rows,

      // ✨ Formatted for spreadsheet import
      spreadsheet_ready: {
        // For Weekly Tracking sheet
        weekly_tracking: formatWeeklyData(signups.rows, conversions.rows),

        // For Conversion Funnel sheet
        funnel_metrics: {
          trial_signups: totalSignups,
          email_verified: parseInt(summary.verified_users),
          first_generation: parseInt(summary.activated_users),
          engaged_10plus: usageSegments.rows.find(s => s.segment.includes('Engaged'))?.user_count || 0,
          power_50plus: usageSegments.rows.find(s => s.segment.includes('Power'))?.user_count || 0,
          converted_to_paid: parseInt(summary.converted_users),
          activation_rate: parseFloat(activationRate),
          conversion_rate: parseFloat(conversionRate)
        },

        // For KPI Dashboard
        kpi_metrics: {
          total_signups: totalSignups,
          total_conversions: parseInt(summary.converted_users),
          verification_rate: parseFloat(verificationRate),
          activation_rate: parseFloat(activationRate),
          engagement_rate: calculateEngagementRate(usageSegments.rows),
          conversion_rate: parseFloat(conversionRate),
          avg_days_to_convert: calculateAvgDaysToConvert(conversions.rows)
        }
      }
    });

  } catch (error) {
    console.error('[Trial Program Export] Error:', error);
    res.status(500).json({ error: 'Failed to export campaign metrics' });
  }
});

// Helper functions
function formatWeeklyData(signups, conversions) {
  // Group by week and return array ready for spreadsheet
  const weeks = {};

  signups.forEach(day => {
    const week = getWeekNumber(day.date);
    if (!weeks[week]) {
      weeks[week] = { signups: 0, conversions: 0 };
    }
    weeks[week].signups += parseInt(day.total_signups);
  });

  conversions.forEach(day => {
    const week = getWeekNumber(day.trial_date);
    if (weeks[week]) {
      weeks[week].conversions += parseInt(day.conversions);
    }
  });

  return Object.entries(weeks).map(([week, data]) => ({
    week: `Week ${week}`,
    signups: data.signups,
    conversions: data.conversions
  }));
}

function calculateEngagementRate(segments) {
  const totalUsers = segments.reduce((sum, s) => sum + parseInt(s.user_count), 0);
  const engagedUsers = segments
    .filter(s => !s.segment.includes('No Usage') && !s.segment.includes('Light'))
    .reduce((sum, s) => sum + parseInt(s.user_count), 0);

  return totalUsers > 0 ? ((engagedUsers / totalUsers) * 100).toFixed(2) : 0;
}

function calculateAvgDaysToConvert(conversions) {
  const validDays = conversions
    .map(c => parseFloat(c.avg_days_to_convert))
    .filter(d => !isNaN(d) && d > 0);

  return validDays.length > 0
    ? (validDays.reduce((sum, d) => sum + d, 0) / validDays.length).toFixed(1)
    : null;
}

function getWeekNumber(date) {
  const d = new Date(date);
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const diff = d - startOfMonth;
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
}
```

**Impact:** One API call returns ALL campaign metrics, formatted for spreadsheets.

---

### Change 4: Add Export Button to Admin UI

**File:** `client/src/pages/admin/Analytics.jsx`

**Location:** Add button to header/toolbar

```jsx
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

function CampaignExportButton({ startDate, endDate }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        startDate: startDate || '2026-01-01',
        endDate: endDate || '2026-01-31'
      });

      const response = await fetch(`/api/admin/analytics/campaign-export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();

      // Option 1: Download as JSON (for programmatic use)
      downloadJson(data, `campaign-metrics-${startDate}-${endDate}.json`);

      // Option 2: Show modal with copy-paste ready data
      showExportModal(data);

      // Option 3: Convert to CSV and download
      // const csv = convertToCsv(data.spreadsheet_ready);
      // downloadCsv(csv, `campaign-metrics-${startDate}-${endDate}.csv`);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export campaign metrics');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isExporting ? 'Exporting...' : 'Export Trial Program Metrics'}
    </button>
  );
}

// Helper: Show modal with formatted data
function showExportModal(data) {
  const modalContent = `
📊 CAMPAIGN METRICS EXPORT
Trial Program: ${data.trialProgram.startDate} to ${data.trialProgram.endDate}

SUMMARY:
- Total Signups: ${data.summary.total_signups}
- Verified: ${data.summary.verified_users} (${data.summary.verification_rate}%)
- Activated: ${data.summary.activated_users} (${data.summary.activation_rate}%)
- Converted: ${data.summary.converted_users} (${data.summary.conversion_rate}%)

SPREADSHEET DATA (copy sections below):

=== WEEKLY TRACKING ===
${JSON.stringify(data.spreadsheet_ready.weekly_tracking, null, 2)}

=== FUNNEL METRICS ===
${JSON.stringify(data.spreadsheet_ready.funnel_metrics, null, 2)}

=== KPI METRICS ===
${JSON.stringify(data.spreadsheet_ready.kpi_metrics, null, 2)}

=== USAGE SEGMENTS ===
${JSON.stringify(data.segments, null, 2)}
  `;

  // Show in modal or copy to clipboard
  navigator.clipboard.writeText(modalContent);
  toast.success('Trial Program metrics copied to clipboard!');
}

// Helper: Download JSON
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Add to Analytics page header
export default function Analytics() {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>

        {/* ✨ NEW: Export button */}
        <div className="flex gap-4">
          <CampaignExportButton startDate={startDate} endDate={endDate} />
          {/* Other existing buttons */}
        </div>
      </div>

      {/* Rest of analytics dashboard */}
      {/* ... */}
    </div>
  );
}
```

**Impact:** One-click button copies all metrics to clipboard or downloads JSON.

---

## 📋 Summary of Changes

| Change | File | Lines of Code | Effort |
|--------|------|---------------|--------|
| 1. Email verification event | `server/src/routes/auth.js` | ~8 lines | 5 min |
| 2. First generation milestone | `server/src/services/docGenerator.js` | ~15 lines | 10 min |
| 3. Trial Program export API | `server/src/routes/admin-analytics.js` | ~200 lines | 30 min |
| 4. Export button UI | `client/src/pages/admin/Analytics.jsx` | ~80 lines | 20 min |
| **TOTAL** | | **~300 lines** | **1 hour** |

---

## ✅ After Implementation

### Before (Current State):
```
Monday morning campaign update:
1. Open /admin/analytics (2 min)
2. Copy signups/conversions manually (2 min)
3. Run 4 SQL queries in database (5 min)
4. Copy results to spreadsheet (3 min)
5. Check API provider dashboards (2 min)
6. Update spreadsheet formulas (3 min)

Total: 17 minutes/week
```

### After (With Automation):
```
Monday morning campaign update:
1. Open /admin/analytics (1 min)
2. Click "Export Trial Program Metrics" (1 min)
3. Copy/paste JSON to spreadsheet (1 min)
4. Check API provider dashboards (2 min) ← Still manual

Total: 5 minutes/week
```

**Time Saved:** 12 min/week = **48 min/month** = ~1 hour over campaign period

---

## 🎯 Output Format Example

**API Response (`/api/admin/analytics/campaign-export`):**

```json
{
  "campaign": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "source": "auto_campaign"
  },
  "summary": {
    "total_signups": 100,
    "verified_users": 95,
    "activated_users": 80,
    "converted_users": 12,
    "active_subscribers": 12,
    "verification_rate": 95.0,
    "activation_rate": 80.0,
    "conversion_rate": 12.0
  },
  "spreadsheet_ready": {
    "weekly_tracking": [
      { "week": "Week 1", "signups": 25, "conversions": 0 },
      { "week": "Week 2", "signups": 25, "conversions": 3 },
      { "week": "Week 3", "signups": 20, "conversions": 4 },
      { "week": "Week 4", "signups": 30, "conversions": 5 }
    ],
    "funnel_metrics": {
      "trial_signups": 100,
      "email_verified": 95,
      "first_generation": 80,
      "engaged_10plus": 40,
      "power_50plus": 20,
      "converted_to_paid": 12,
      "activation_rate": 80.0,
      "conversion_rate": 12.0
    },
    "kpi_metrics": {
      "total_signups": 100,
      "total_conversions": 12,
      "verification_rate": 95.0,
      "activation_rate": 80.0,
      "engagement_rate": 40.0,
      "conversion_rate": 12.0,
      "avg_days_to_convert": 18.3
    }
  },
  "segments": [
    { "segment": "No Usage (0 gens)", "user_count": 20, "percentage": 20.0 },
    { "segment": "Light Users (1-9 gens)", "user_count": 20, "percentage": 20.0 },
    { "segment": "Engaged Users (10-49 gens)", "user_count": 20, "percentage": 20.0 },
    { "segment": "Power Users (50-99 gens)", "user_count": 15, "percentage": 15.0 },
    { "segment": "Max Users (100+ gens)", "user_count": 25, "percentage": 25.0 }
  ]
}
```

**You can directly copy values from JSON into your spreadsheet cells!**

---

## 🚀 Recommended: Implement This Week

**Priority 1 (Critical for campaign):**
- ✅ Change 3: Trial Program export API (30 min)
- ✅ Change 4: Export button UI (20 min)

**Priority 2 (Nice to have):**
- ✅ Change 1: Email verification event (5 min)
- ✅ Change 2: First generation milestone (10 min)

**Deploy before Jan 1 campaign launch** and you'll have fully automated metrics!

---

## ❓ FAQ

**Q: Do we need to add events for usage milestones (10+, 50+, 100+ gens)?**
A: No. The export API computes these from `user_quotas.monthly_count` on-demand. Adding events would create 3 events per user (bloat).

**Q: What about cohort retention tracking?**
A: Computed on-demand in the export API by querying `user_subscriptions.status = 'active'`. Update monthly.

**Q: Can we auto-populate the spreadsheets?**
A: Yes! Use Google Sheets API to push data directly, or use the JSON output with a simple script. But copy-paste is honestly faster for a 1-month trialProgram.

**Q: What about API costs from Claude/OpenAI?**
A: Still manual - need to check provider dashboards. Could add cost tracking events, but providers already have dashboards. Not worth the effort for 1 trialProgram.

---

**Want me to implement this? It's ~1 hour of work and eliminates all SQL queries.**
