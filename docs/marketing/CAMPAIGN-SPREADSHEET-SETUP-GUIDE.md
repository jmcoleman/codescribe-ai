# January 2026 Campaign - Spreadsheet Setup Guide

## 📋 Overview

This guide explains how to set up and use the campaign financial tracking spreadsheets for your January 2026 Pro Trial campaign.

**Campaign Details:**
- **Trial Offer:** 14-Day Pro Trial
- **Expected Signups:** 100 users
- **Budget:** $350 ($210 Claude + $140 OpenAI)
- **Expected ROI:** 723% (Year 1)

---

## 📁 Files Generated

All files are located in `/docs/marketing/` with both TSV and CSV formats:

| File | Format | Purpose |
|------|--------|---------|
| `january-2026-campaign-financials` | .tsv + .csv | Executive summary, cost breakdown, ROI analysis, sensitivity analysis |
| `campaign-weekly-tracking` | .tsv + .csv | Weekly signup tracking, budget monitoring, provider allocation |
| `conversion-funnel-tracking` | .tsv + .csv | Funnel metrics, conversion rates, usage patterns |
| `cohort-analysis` | .tsv + .csv | 12-month revenue tracking, retention analysis, churn metrics |
| `kpi-dashboard` | .tsv + .csv | Consolidated KPIs, daily monitoring, action items |

**Format Recommendation:** Use **TSV files** for cleaner import (no comma conflicts with dollar amounts).

---

## 🚀 Quick Start Guide

### Option 1: Google Sheets (Recommended)

1. **Create New Spreadsheet**
   ```
   File → New → Spreadsheet
   Name it: "January 2026 Campaign Financials"
   ```

2. **Import Files**
   ```
   For each file:
   - File → Import
   - Upload tab → Select file (e.g., january-2026-campaign-financials.tsv)
   - Import location: "Insert new sheet(s)"
   - Separator type: "Tab" (for TSV) or "Comma" (for CSV)
   - Click "Import data"
   ```

3. **Rename Sheets**
   - Sheet 1: "Executive Summary"
   - Sheet 2: "Weekly Tracking"
   - Sheet 3: "Conversion Funnel"
   - Sheet 4: "Cohort Analysis"
   - Sheet 5: "KPI Dashboard"

4. **Verify Formulas**
   - All formulas should auto-calculate
   - Check that cells with `=` show calculations, not text

### Option 2: Microsoft Excel

1. **Create New Workbook**
   ```
   File → New → Blank Workbook
   Save as: "January 2026 Campaign Financials.xlsx"
   ```

2. **Import Files**
   ```
   For each file:
   - Data tab → From Text/CSV
   - Select file
   - Delimiter: Tab (TSV) or Comma (CSV)
   - Load to: New worksheet
   - Click "Load"
   ```

3. **Enable Formulas**
   - Excel may import formulas as text
   - Select all cells → Find & Replace → Replace `=` with `=` (forces recalculation)

### Option 3: Numbers (Mac)

1. **Import Files**
   ```
   File → Open → Select TSV file
   Numbers will auto-detect format
   ```

2. **Combine Sheets**
   - Copy each imported sheet into one workbook
   - Rename tabs appropriately

---

## 📊 Sheet-by-Sheet Setup Instructions

### 1. Executive Summary (january-2026-campaign-financials)

**Purpose:** High-level financial overview and scenario planning.

**Key Sections:**
- **Executive Summary:** Compare Conservative/Baseline/Growth/Aggressive scenarios
- **14-Day vs 30-Day Comparison:** Justifies 14-day trial choice
- **Cost Breakdown:** API costs by provider
- **Unit Economics:** CAC, LTV, LTV:CAC ratio
- **Sensitivity Analysis:** What-if scenarios for key variables

**Setup Steps:**
1. Import the file
2. **Verify formulas calculate** (check cells with `=` show numbers, not text)
3. **Update Actual columns** as campaign progresses (Column C in most tables)
4. **Review Status indicators** (✅/⚠️/🔴 should auto-populate)

**Key Formulas:**
```
Conversions: =ROUND(Signups * ConversionRate, 0)
Year 1 Revenue: =Conversions * $240 * (1 - ChurnRate)
ROI: =GrossProfit / APICost
Payback: =APICost / (Revenue / 12)
```

**What to Monitor:**
- ROI status (target: >200%)
- LTV:CAC ratio (target: >3:1)
- Payback period (target: <12 months)

---

### 2. Weekly Tracking (campaign-weekly-tracking)

**Purpose:** Real-time campaign monitoring and budget management.

**Key Sections:**
- **Weekly Performance Tracker:** Signup goals by week
- **Variance Analysis:** Actual vs Target
- **Daily Tracking:** Optional granular tracking
- **Budget Phase Management:** When to add more credits
- **Provider Allocation:** Claude vs OpenAI spend

**Setup Steps:**
1. Import the file
2. **Enter actual signups** in Column C (New Signups) as each week completes
3. **Monitor Status column** for on-track indicators
4. **Check Budget Remaining** (Column I) to know when to top up
5. **Use Daily Tracking section** if you need more granular data

**Key Formulas:**
```
Cumulative Signups: =SUM(previous weeks)
Weekly API Cost: =DailyAPICost * DaysInWeek
Budget Remaining: =Target - CumulativeCost
Status: =IF(Signups <= Target, "✅ On Track", "⚠️ Monitor")
```

**What to Monitor Daily:**
- Daily signup rate (target: 3-4/day)
- Daily API cost (alert if >$18/day)
- Budget utilization (alert at 90%)

**Budget Top-Up Triggers:**
- Week 2: If >75 signups, add $350
- Week 3: If >150 signups, add $700

---

### 3. Conversion Funnel (conversion-funnel-tracking)

**Purpose:** Track user journey from signup to paid conversion.

**Key Sections:**
- **Funnel Overview:** 7-stage funnel with drop-off rates
- **Key Conversion Metrics:** Industry benchmarks
- **Funnel Breakdown by Week:** Weekly cohort performance
- **Usage Patterns:** Segment users by engagement level
- **Weekly Activity Tracking:** Usage trends over time

**Setup Steps:**
1. Import the file
2. **Update Count column (B)** with actual numbers from `/admin/analytics`
3. **Rates auto-calculate** based on counts
4. **Monitor Status column** for targets

**Funnel Stages:**
1. Trial Signups (100)
2. Email Verified (95) - 95%
3. First Generation (80) - 80%
4. 10+ Generations (40) - 40%
5. 50+ Generations (20) - 20%
6. Trial Completed (75) - 75%
7. Converted to Paid (12) - 12%

**Key Formulas:**
```
Activation Rate: =FirstGeneration / TrialSignups
Engagement Rate: =TenPlusGens / TrialSignups
Conversion Rate: =ConvertedToPaid / TrialCompleted
```

**What to Monitor:**
- Activation rate (target: >70%)
- Engagement rate (target: >30%)
- Trial-to-paid conversion (target: >10%)

**Action Triggers:**
- Activation <70%: Send activation email campaign
- Engagement drops: Trigger re-engagement at 5 generations
- Low conversions: Optimize pricing page

---

### 4. Cohort Analysis (cohort-analysis)

**Purpose:** Track long-term revenue and retention from the January cohort.

**Key Sections:**
- **Monthly Revenue Tracking:** 12-month MRR projection
- **Cohort Performance Metrics:** Retention, churn, revenue
- **Revenue Projections:** 3-year LTV forecast
- **ROI Analysis:** Payback period and profit tracking
- **Churn Analysis:** When and why users churn
- **CLV Calculation:** Customer lifetime value by segment

**Setup Steps:**
1. Import the file
2. **Monthly updates:** Update Active Users (Column C) as each month completes
3. **Churn auto-calculates** from retention changes
4. **MRR and Cumulative Revenue** auto-calculate
5. **Review quarterly** (March, June, September, December)

**Monthly Update Process:**
```
Example: End of February 2026
1. Query database: COUNT users with active Pro subscriptions from Jan cohort
2. Enter result in Feb 2026 row, Column C (Active Users)
3. Churned = Previous month - This month (auto-calculates)
4. MRR = Active Users × $20 (auto-calculates)
5. Review cumulative revenue tracking
```

**Key Formulas:**
```
Churned: =PreviousMonth - CurrentMonth
Churn %: =Churned / PreviousMonth
MRR: =ActiveUsers * $20
Cumulative Revenue: =PreviousTotal + CurrentMRR
Annual Retention: =EndingCustomers / StartingCustomers
```

**What to Monitor:**
- Month 3 retention (target: >85%)
- Month 12 retention (target: >60%)
- Avg monthly churn (target: <5%)
- Payback period (target: <12 months)

**Review Schedule:**
- **Weekly (Month 1):** Monitor early churn signals
- **Monthly:** Update active users, review trends
- **Quarterly:** Deep-dive retention analysis
- **Annually:** Full cohort performance review

---

### 5. KPI Dashboard (kpi-dashboard)

**Purpose:** Consolidated view of all key metrics for quick status checks.

**Key Sections:**
- **Executive Summary:** Top 8 critical metrics
- **Acquisition Metrics:** Signup rates, verification, activation
- **Engagement Metrics:** Usage patterns, power users
- **Conversion Metrics:** Trial-to-paid, timing, CAC
- **Financial Metrics:** API spend by provider
- **Revenue Metrics:** MRR, ARR, ARPU
- **Unit Economics:** LTV, CAC, LTV:CAC, payback
- **Retention Metrics:** 3, 6, 12-month retention projections
- **Competitive Benchmarks:** Industry comparisons
- **Risk Indicators:** Early warning signals
- **Action Items:** Prioritized task list
- **Daily Monitoring Checklist:** Daily/weekly milestones

**Setup Steps:**
1. Import the file
2. **Update Actual column (C)** for each metric category
3. **Status indicators** auto-populate (✅/⚠️/🔴)
4. **Use as daily dashboard** - update top metrics daily
5. **Review full dashboard** weekly

**Daily Update Process:**
```
1. Log into /admin/analytics
2. Pull today's metrics:
   - New signups
   - Total API cost
   - New conversions
3. Update Dashboard Column C (Actual)
4. Review Status column for red flags
5. Check Action Items for tasks
```

**Key Metrics to Track Daily:**
| Metric | How to Get | Target |
|--------|------------|--------|
| Signups | /admin/analytics → User signups | 3-4/day |
| API Cost | Claude dashboard + OpenAI dashboard | <$18/day |
| Conversions | /admin/analytics → Subscription events | Rolling count |
| Activation Rate | First generation / Total signups | >70% |

**Weekly Review Checklist:**
- [ ] Total signups on track (25/week)
- [ ] API spend within budget (<$90/week)
- [ ] Activation rate healthy (>70%)
- [ ] Engagement trending up
- [ ] No red flags in Risk Indicators
- [ ] Action items completed

---

## 🔄 Data Flow: From Admin Dashboard to Spreadsheets

### Daily Data Pipeline

```
CodeScribe Admin Dashboard (/admin/analytics)
           ↓
Extract Metrics (manual or automated)
           ↓
Update Spreadsheets (actual columns)
           ↓
Formulas Auto-Calculate
           ↓
Review Status Indicators
           ↓
Take Action on Red Flags
```

### Key Data Sources

**From `/admin/analytics`:**
- Total signups → Weekly Tracking, KPI Dashboard
- Email verified count → Conversion Funnel
- First generation count → Conversion Funnel
- Usage stats (10+, 50+, 100+ gens) → Conversion Funnel
- Trial-to-paid conversions → All sheets
- Conversion timing → Conversion Funnel

**From Provider Dashboards:**
- Claude API spend → Weekly Tracking, KPI Dashboard
- OpenAI API spend → Weekly Tracking, KPI Dashboard
- Total generations → Usage Metrics

**From Database Queries:**
- Active subscriptions (monthly) → Cohort Analysis
- Churn events → Cohort Analysis
- MRR tracking → Cohort Analysis

---

## 📈 Using the Spreadsheets for Investor Updates

### Weekly Investor Email Template

```
Subject: January 2026 Campaign - Week [X] Update

Hi [Investor Name],

Quick update on our January Pro Trial campaign:

📊 KEY METRICS (Week [X])
- Signups: [Actual] ([% of target])
- API Cost: $[Actual] (Budget: $350)
- Conversions: [Actual] ([X]% conversion rate)
- Status: [On Track / Ahead / Behind]

💰 FINANCIALS
- Cost per user: $[Actual]
- Projected ROI: [X]%
- Payback period: [X] months

🎯 HIGHLIGHTS
- [Key achievement this week]
- [Notable metric improvement]

⚠️ CHALLENGES
- [Any issues or concerns]
- [Mitigation plan]

📅 NEXT WEEK
- [Key focus areas]
- [Expected milestones]

Full dashboard: [Link to Google Sheet]

Best,
[Your Name]
```

### Monthly Board Deck Slides

**Slide 1: Campaign Overview**
- Use Executive Summary table
- Highlight: ROI, LTV:CAC, Payback Period

**Slide 2: Performance vs Target**
- Use Weekly Tracking Status column
- Show: On-track weeks, budget utilization

**Slide 3: Conversion Funnel**
- Use Funnel Overview chart
- Highlight: Activation rate, conversion rate

**Slide 4: Financial Projections**
- Use Cohort Analysis 3-year projections
- Show: Year 1-3 revenue, total LTV

**Slide 5: Key Learnings**
- Use Competitive Benchmarks
- Show: Where you outperform industry

---

## 🎨 Customization Tips

### Adding Charts (Google Sheets)

**1. ROI by Scenario**
```
Select: Executive Summary → Scenario + ROI columns
Insert → Chart → Column chart
```

**2. Weekly Signup Trend**
```
Select: Weekly Tracking → Dates + Cumulative Signups
Insert → Chart → Line chart
```

**3. Conversion Funnel Visualization**
```
Select: Conversion Funnel → Stage + Count columns
Insert → Chart → Funnel chart (or Bar chart)
```

**4. Cohort Revenue Over Time**
```
Select: Cohort Analysis → Month + Cumulative Revenue
Insert → Chart → Line chart
```

### Conditional Formatting

**Highlight Budget Alerts:**
```
Select: Weekly Tracking → Budget Remaining column
Format → Conditional formatting
- If cell value < $50: Red background
- If cell value < $100: Yellow background
```

**Conversion Rate Status:**
```
Select: Conversion Funnel → Status column
Format → Conditional formatting
- If contains "✅": Green text
- If contains "⚠️": Orange text
- If contains "🔴": Red text
```

### Adding Pivot Tables

**Signups by Week:**
```
Data → Pivot table
Rows: Week
Values: SUM of Signups
```

---

## 🔧 Troubleshooting

### Problem: Formulas showing as text

**Solution:**
```
1. Select all cells with formulas
2. Find & Replace (Ctrl/Cmd + H)
3. Find: =
4. Replace: =
5. This forces recalculation
```

### Problem: Imported values have wrong format

**Solution:**
```
1. Select affected cells
2. Format → Number → Automatic (or Currency for $)
3. Google Sheets: Format → Number → Number/Currency/Percent
```

### Problem: #DIV/0! errors

**Cause:** Division by zero (usually when Actual column is empty)

**Solution:**
```
1. Enter actual data in Column C
2. Or update formula to handle zeros:
   =IFERROR(A/B, 0)
```

### Problem: Dates showing as numbers

**Solution:**
```
1. Select date cells
2. Format → Number → Date
```

---

## 📅 Recommended Update Schedule

| Sheet | Update Frequency | Time Required | Data Source |
|-------|------------------|---------------|-------------|
| **KPI Dashboard** | Daily | 5 min | /admin/analytics |
| **Weekly Tracking** | Weekly | 10 min | /admin/analytics + API dashboards |
| **Conversion Funnel** | Weekly | 15 min | /admin/analytics + database queries |
| **Cohort Analysis** | Monthly | 20 min | Database subscription queries |
| **Executive Summary** | As needed | 5 min | Review only (auto-calculates) |

**Total Time Commitment:** ~30 min/week + 20 min/month

---

## 🎯 Success Criteria

Use these spreadsheets to track campaign success:

### Week 1 Success
- [ ] 20-30 signups
- [ ] <$100 API spend
- [ ] >70% activation rate
- [ ] All formulas calculating correctly

### Month 1 Success
- [ ] 90-110 signups (±10% of target)
- [ ] $300-400 API spend (within budget)
- [ ] 10-15 conversions (10-15% conversion rate)
- [ ] >70% trial completion rate

### 3-Month Success
- [ ] 8+ retained customers (67% retention)
- [ ] $160+ MRR from cohort
- [ ] <5% monthly churn
- [ ] Positive feedback from surveys

### 12-Month Success
- [ ] 6+ retained customers (50%+ retention)
- [ ] $2,400+ cumulative revenue
- [ ] 500%+ ROI
- [ ] Learnings applied to future campaigns

---

## 📚 Additional Resources

**Related Documentation:**
- Campaign Management Guide: `/docs/admin/CAMPAIGN-MANAGEMENT-GUIDE.md`
- Analytics Plan: `/docs/planning/WORKFLOW-OUTCOME-METRICS-PLAN.md`
- Admin Dashboard: `/admin/analytics`

**External Resources:**
- [Google Sheets Formulas Guide](https://support.google.com/docs/table/25273)
- [SaaS Metrics Standards](https://www.forentrepreneurs.com/saas-metrics-2/)
- [Cohort Analysis Best Practices](https://www.reforge.com/blog/cohort-analysis)

---

## 💡 Pro Tips

1. **Make a Copy:** Before editing, File → Make a copy for backup
2. **Share with Team:** Share → Add team members (view or edit)
3. **Version Control:** File → Version history to track changes
4. **Export for Backup:** File → Download → Excel format (.xlsx)
5. **Set Up Alerts:** Tools → Notification rules for cell changes
6. **Mobile Access:** Install Google Sheets mobile app for on-the-go updates
7. **Automate Data Entry:** Use Google Sheets API or Zapier to auto-populate from your database
8. **Create Dashboard View:** Hide detailed sheets, pin KPI Dashboard as first sheet

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Don't edit formula cells** - Only update "Actual" columns (usually Column C)
2. ❌ **Don't delete rows/columns** - This breaks formula references
3. ❌ **Don't skip weekly updates** - Data gaps make trends unreliable
4. ❌ **Don't ignore red flags** - Status indicators are early warning signals
5. ❌ **Don't compare apples to oranges** - Baseline scenario is for 100 signups
6. ❌ **Don't forget to save** - Google Sheets auto-saves, but Excel doesn't
7. ❌ **Don't share without permissions** - Set proper view/edit access

---

## ✅ Setup Checklist

- [ ] Downloaded all 5 files (TSV or CSV format)
- [ ] Created new Google Sheets workbook
- [ ] Imported all 5 files as separate sheets
- [ ] Renamed sheets appropriately
- [ ] Verified formulas calculate (not showing as text)
- [ ] Reviewed each sheet's purpose
- [ ] Set up weekly update calendar reminder
- [ ] Bookmarked `/admin/analytics` for data source
- [ ] Shared spreadsheet with team (if applicable)
- [ ] Created backup copy
- [ ] Read through this setup guide completely

---

**Questions or Issues?**
- Review Troubleshooting section above
- Check formula syntax in original TSV/CSV files
- Consult Google Sheets documentation
- File issue in project GitHub repo

**Last Updated:** January 2026
**Maintained By:** Product Team
**Version:** 1.0 (14-Day Trial Campaign)
