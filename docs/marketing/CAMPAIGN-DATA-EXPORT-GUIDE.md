# Campaign Data Export Guide

## 🎯 Quick Answer: How to Get Data for Spreadsheets

Your analytics system already captures **~75% of the metrics** you need. Here's how to extract them.

---

## ✅ Method 1: Use Existing Admin Dashboard (Easiest - No Code)

### Step 1: Access Admin Analytics
```
Navigate to: /admin/analytics
Date Range: Jan 1-31, 2026
```

### Step 2: Extract Metrics from Each Tab

#### **Business Tab** → For Weekly Tracking & Financials
| Metric | Where to Find | Copy to Spreadsheet |
|--------|---------------|---------------------|
| Total Signups | Business → Signups count | Weekly Tracking → Actual Signups |
| Trial Conversions | Business → Tier Upgrades count | Financials → Conversions |
| Revenue | Business → Revenue (convert cents to $) | Financials → Year 1 Revenue |

#### **Conversion Funnel Tab** → For Funnel Tracking
| Metric | Where to Find | Copy to Spreadsheet |
|--------|---------------|---------------------|
| Campaign Trials | Funnel → "Campaign Trials" count | Funnel → Trial Signups |
| Paid Conversions | Funnel → "Paid" count | Funnel → Converted to Paid |
| Conversion Rate | Auto-calculated in funnel | Funnel → Trial-to-Paid |

#### **Usage Tab** → For Engagement Metrics
| Metric | Where to Find | Copy to Spreadsheet |
|--------|---------------|---------------------|
| Total Generations | Usage → Total count | KPI Dashboard → Total Generations |
| Doc Type Mix | Usage → By doc type breakdown | KPI Dashboard → Doc Type Mix |

---

## 📥 Method 2: CSV Export (Best for Bulk Analysis)

### Use Existing Export Endpoint

**Your analytics already has a CSV export!**
```bash
# Export all business events (signups, trials, conversions)
GET /api/admin/analytics/events/export?startDate=2026-01-01&endDate=2026-01-31&category=business

# Returns CSV with columns:
# - event_id, event_name, event_action, user_id, created_at, event_data
```

**How to use:**
1. Click "Export" button in `/admin/analytics` (if available in UI)
2. OR use browser console:
   ```javascript
   window.open('/api/admin/analytics/events/export?startDate=2026-01-01&endDate=2026-01-31&category=business')
   ```
3. Open CSV in Excel/Google Sheets
4. Create pivot tables for analysis:
   - Signups by date: `event_name='signup'` → group by `created_at`
   - Conversions: `event_name='trial'` AND `event_action='converted'`
   - Revenue: `event_name='checkout_completed'` → SUM `event_data.amount_cents`

---

## 🔧 Method 3: SQL Queries (For Missing Metrics)

For metrics not in the dashboard, use these queries:

### **Campaign Signups (with trial attribution)**
```sql
-- All signups from January campaign
SELECT
  DATE(u.created_at) as signup_date,
  COUNT(*) as signups,
  COUNT(CASE WHEN ut.source = 'auto_campaign' THEN 1 END) as campaign_signups,
  COUNT(CASE WHEN u.email_verified = true THEN 1 END) as verified
FROM users u
LEFT JOIN user_trials ut ON u.id = ut.user_id
WHERE u.created_at >= '2026-01-01'
  AND u.created_at < '2026-02-01'
  AND u.role != 'admin'
GROUP BY DATE(u.created_at)
ORDER BY signup_date;
```

### **Activation Rate (First Generation)**
```sql
-- Users who created at least 1 generation
SELECT
  DATE(u.created_at) as cohort_date,
  COUNT(DISTINCT u.id) as total_signups,
  COUNT(DISTINCT gd.user_id) as activated_users,
  ROUND(COUNT(DISTINCT gd.user_id) * 100.0 / COUNT(DISTINCT u.id), 2) as activation_rate
FROM users u
LEFT JOIN generated_documents gd ON u.id = gd.user_id
WHERE u.created_at >= '2026-01-01'
  AND u.created_at < '2026-02-01'
  AND u.role != 'admin'
GROUP BY DATE(u.created_at)
ORDER BY cohort_date;
```

### **Usage Milestones (10+, 50+, 100+ generations)**
```sql
-- User segmentation by generation count
SELECT
  CASE
    WHEN monthly_count = 0 THEN 'No Usage'
    WHEN monthly_count BETWEEN 1 AND 9 THEN 'Light (1-9)'
    WHEN monthly_count BETWEEN 10 AND 49 THEN 'Engaged (10-49)'
    WHEN monthly_count BETWEEN 50 AND 99 THEN 'Power (50-99)'
    WHEN monthly_count >= 100 THEN 'Max (100+)'
  END as usage_segment,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_quotas uq
JOIN users u ON uq.user_id = u.id
WHERE u.created_at >= '2026-01-01'
  AND u.created_at < '2026-02-01'
  AND u.role != 'admin'
GROUP BY usage_segment
ORDER BY
  CASE usage_segment
    WHEN 'No Usage' THEN 1
    WHEN 'Light (1-9)' THEN 2
    WHEN 'Engaged (10-49)' THEN 3
    WHEN 'Power (50-99)' THEN 4
    WHEN 'Max (100+)' THEN 5
  END;
```

### **Trial Conversions with Timing**
```sql
-- Trial conversion tracking with days to convert
SELECT
  DATE(ut.started_at) as trial_start_date,
  COUNT(*) as trials_started,
  COUNT(CASE WHEN ut.status = 'converted' THEN 1 END) as conversions,
  ROUND(COUNT(CASE WHEN ut.status = 'converted' THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate,
  ROUND(AVG(CASE WHEN ut.status = 'converted'
    THEN EXTRACT(EPOCH FROM (ut.converted_at - ut.started_at)) / 86400 END), 1) as avg_days_to_convert
FROM user_trials ut
WHERE ut.source = 'auto_campaign'
  AND ut.started_at >= '2026-01-01'
  AND ut.started_at < '2026-02-01'
GROUP BY DATE(ut.started_at)
ORDER BY trial_start_date;
```

### **Monthly Cohort Retention (for Cohort Analysis sheet)**
```sql
-- Active Pro users from January cohort
SELECT
  COUNT(*) as active_users
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.created_at >= '2026-01-01'
  AND u.created_at < '2026-02-01'
  AND us.tier = 'pro'
  AND us.status = 'active'
  AND u.role != 'admin';

-- Run this query monthly and update Cohort Analysis sheet
```

---

## 📊 Method 4: Automated Export Script (Recommended for Weekly Updates)

Create a simple script to extract all metrics at once:

```javascript
// File: scripts/export-campaign-metrics.js

import { pool } from '../server/src/db/index.js';

const CAMPAIGN_START = '2026-01-01';
const CAMPAIGN_END = '2026-01-31';

async function exportCampaignMetrics() {
  // 1. Signups & Verification
  const signups = await pool.query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total_signups,
      COUNT(CASE WHEN email_verified THEN 1 END) as verified
    FROM users
    WHERE created_at >= $1 AND created_at < $2 AND role != 'admin'
    GROUP BY DATE(created_at)
    ORDER BY date
  `, [CAMPAIGN_START, CAMPAIGN_END]);

  // 2. Activations (First Generation)
  const activations = await pool.query(`
    SELECT
      DATE(u.created_at) as cohort_date,
      COUNT(DISTINCT u.id) as signups,
      COUNT(DISTINCT gd.user_id) as activated
    FROM users u
    LEFT JOIN generated_documents gd ON u.id = gd.user_id
    WHERE u.created_at >= $1 AND u.created_at < $2 AND u.role != 'admin'
    GROUP BY DATE(u.created_at)
    ORDER BY cohort_date
  `, [CAMPAIGN_START, CAMPAIGN_END]);

  // 3. Trial Conversions
  const conversions = await pool.query(`
    SELECT
      COUNT(*) as total_trials,
      COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions,
      AVG(CASE WHEN status = 'converted'
        THEN EXTRACT(EPOCH FROM (converted_at - started_at)) / 86400 END) as avg_days
    FROM user_trials
    WHERE source = 'auto_campaign'
      AND started_at >= $1 AND started_at < $2
  `, [CAMPAIGN_START, CAMPAIGN_END]);

  // 4. Usage Segments
  const usageSegments = await pool.query(`
    SELECT
      CASE
        WHEN monthly_count = 0 THEN 'No Usage'
        WHEN monthly_count BETWEEN 1 AND 9 THEN 'Light'
        WHEN monthly_count BETWEEN 10 AND 49 THEN 'Engaged'
        WHEN monthly_count BETWEEN 50 AND 99 THEN 'Power'
        WHEN monthly_count >= 100 THEN 'Max'
      END as segment,
      COUNT(*) as count
    FROM user_quotas uq
    JOIN users u ON uq.user_id = u.id
    WHERE u.created_at >= $1 AND u.created_at < $2 AND u.role != 'admin'
    GROUP BY segment
  `, [CAMPAIGN_START, CAMPAIGN_END]);

  // Export to CSV
  console.log('Campaign Metrics Export\n');
  console.log('SIGNUPS:');
  console.table(signups.rows);
  console.log('\nACTIVATIONS:');
  console.table(activations.rows);
  console.log('\nCONVERSIONS:');
  console.table(conversions.rows);
  console.log('\nUSAGE SEGMENTS:');
  console.table(usageSegments.rows);
}

exportCampaignMetrics().then(() => process.exit(0));
```

**Run weekly:**
```bash
cd server
node scripts/export-campaign-metrics.js > campaign-week1.txt
```

---

## 🎯 Recommended Weekly Workflow (10 minutes)

### Monday Morning Data Collection:

**Step 1: Open Admin Dashboard (2 min)**
```
1. Go to /admin/analytics
2. Set date range: Jan 1 - Today
3. Screenshot Business tab (signups, conversions, revenue)
4. Screenshot Conversion Funnel tab
```

**Step 2: Run SQL Queries (3 min)**
```
1. Copy activation rate query → Run in database
2. Copy usage segments query → Run in database
3. Save results as CSV or copy to spreadsheet
```

**Step 3: Update Spreadsheets (5 min)**
```
1. Open KPI Dashboard sheet
2. Paste signups, conversions, revenue to "Actual" columns
3. Paste activation & engagement rates
4. Review Status indicators for red flags
```

---

## 🚀 QUICK WIN: Add Export Button to Admin UI

To make this even easier, add an export button to `/admin/analytics`:

```jsx
// In client/src/pages/admin/Analytics.jsx

function CampaignExportButton({ startDate, endDate }) {
  const handleExport = async () => {
    const url = `/api/admin/analytics/campaign-export?startDate=${startDate}&endDate=${endDate}`;
    const response = await fetch(url);
    const data = await response.json();

    // Convert to CSV
    const csv = convertToCsv(data);
    downloadCsv(csv, `campaign-${startDate}-${endDate}.csv`);
  };

  return (
    <button onClick={handleExport} className="btn-primary">
      📊 Export Campaign Metrics
    </button>
  );
}
```

**Backend endpoint:**
```javascript
// In server/src/routes/admin-analytics.js

router.get('/campaign-export', requireAuth, requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;

  const metrics = {
    signups: await getSignupsWithVerification(startDate, endDate),
    activations: await getActivationRate(startDate, endDate),
    conversions: await getTrialConversions(startDate, endDate),
    usageSegments: await getUsageSegments(startDate, endDate),
    revenue: await getRevenue(startDate, endDate)
  };

  res.json(metrics);
});
```

**This gives you one-click export of all campaign metrics!**

---

## 📋 Data Mapping: Spreadsheet ← Analytics

| Spreadsheet Cell | Data Source | Query/Endpoint |
|------------------|-------------|----------------|
| **Weekly Tracking → New Signups** | Admin dashboard | Business tab → Signups count |
| **Weekly Tracking → API Cost** | Provider dashboards | Claude + OpenAI dashboards (manual) |
| **Funnel → Email Verified** | SQL query | `SELECT COUNT(*) FROM users WHERE email_verified=true` |
| **Funnel → First Generation** | SQL query | Activation rate query above |
| **Funnel → 10+ Generations** | SQL query | Usage segments query → 'Engaged' + 'Power' + 'Max' |
| **Funnel → Converted to Paid** | Admin dashboard | Business → Tier Upgrades count |
| **Cohort → Active Users** | SQL query | Monthly retention query above |
| **KPI Dashboard → All Metrics** | Combination | Dashboard + SQL queries |

---

## ⚡ Bottom Line

**What you can get NOW (no code changes):**
- ✅ Signups, trials, conversions (from Admin Dashboard)
- ✅ Revenue (from Admin Dashboard)
- ✅ Campaign attribution (from `user_trials` table)
- ✅ CSV export of raw events

**What needs SQL queries (5-10 min/week):**
- ⚠️ Email verification rate
- ⚠️ Activation rate (first generation)
- ⚠️ Usage milestones (10+, 50+, 100+ gens)
- ⚠️ Monthly cohort retention

**What needs manual tracking:**
- ❌ API costs (from Claude/OpenAI dashboards)

**Recommended Next Step:**
1. Use Admin Dashboard for weekly signups/conversions tracking
2. Run SQL queries weekly for activation/engagement metrics
3. (Optional) Add "Export Campaign Metrics" button to Admin UI for one-click export

**Time Required:**
- Current setup: 10 min/week
- With export button: 2 min/week

---

**Want me to create the export button implementation? It would reduce your weekly update time from 10 minutes to 2 minutes.**
