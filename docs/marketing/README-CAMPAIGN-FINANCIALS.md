# January 2026 Campaign Financial Tracking - Quick Start

## 📦 What's Included

This package contains everything you need to track and analyze your January 2026 Pro Trial campaign (14-day trial).

### 📊 Spreadsheet Files (TSV + CSV)

1. **january-2026-campaign-financials** - Financial overview and ROI analysis
2. **campaign-weekly-tracking** - Weekly monitoring and budget tracking
3. **conversion-funnel-tracking** - User journey and conversion metrics
4. **cohort-analysis** - 12-month retention and revenue tracking
5. **kpi-dashboard** - Consolidated KPIs and daily monitoring

### 📖 Documentation

- **CAMPAIGN-SPREADSHEET-SETUP-GUIDE.md** - Complete setup and usage guide (28 pages)
- **README-CAMPAIGN-FINANCIALS.md** - This file

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Choose Your Format

- **TSV (Recommended):** Cleaner import, no comma conflicts
- **CSV:** More universal, but may have formatting issues with dollar amounts

### Step 2: Import to Google Sheets

```
1. Go to sheets.google.com
2. Create new spreadsheet: "January 2026 Campaign"
3. For each file:
   - File → Import → Upload
   - Select file (start with january-2026-campaign-financials.tsv)
   - Import location: "Insert new sheet(s)"
   - Separator: Tab (for TSV) or Comma (for CSV)
   - Click Import
4. Rename sheets:
   - Sheet 1: "Financials"
   - Sheet 2: "Weekly Tracking"
   - Sheet 3: "Funnel"
   - Sheet 4: "Cohort"
   - Sheet 5: "Dashboard"
```

### Step 3: Verify & Start Tracking

```
1. Check that formulas calculate (not showing as text)
2. Start with KPI Dashboard sheet
3. Update "Actual" column as campaign runs
4. Review Status indicators (✅/⚠️/🔴)
```

---

## 📋 Campaign Summary (14-Day Trial)

### Key Assumptions

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Trial Duration** | 14 days | Optimal for conversion |
| **Trial Tier** | Pro (200 gens/month) | $20/mo value |
| **Target Signups** | 100 users | January 1-31, 2026 |
| **API Budget** | $350 total | $210 Claude + $140 OpenAI |
| **Cost Per User** | $3.50 | 70 generations average |
| **Expected Conversions** | 12 users | 12% conversion rate |
| **Year 1 Revenue** | $2,880 | 12 users × $240/year |
| **ROI** | 723% | Year 1 return |
| **Payback Period** | 0.7 months | ~21 days |

### Why 14-Day Trial vs 30-Day?

| Metric | 14-Day | 30-Day | Winner |
|--------|--------|--------|--------|
| Cost per user | $3.50 | $5.00 | 14-day (-30%) |
| Conversion rate | 12% | 8% | 14-day (+50%) |
| ROI | 723% | 284% | 14-day (+155%) |
| Urgency | High | Low | 14-day ✅ |

**Decision:** 14-day trial wins on all metrics. Users need 2-3 documentation sessions to evaluate, which fits easily in 14 days.

---

## 📊 What Each Sheet Does

### 1. Financials (Executive Summary)
**Use for:** Investor presentations, board updates, scenario planning

**Key Metrics:**
- 4 scenarios: Conservative/Baseline/Growth/Aggressive
- Cost breakdown by provider (Claude vs OpenAI)
- Unit economics: CAC ($29.17), LTV ($600), LTV:CAC (20.6:1)
- Sensitivity analysis for key variables
- Risk scenarios (worst/base/best case)

**Update:** As needed (auto-calculates from other sheets)

---

### 2. Weekly Tracking
**Use for:** Daily/weekly monitoring, budget management, signup tracking

**Key Metrics:**
- Weekly signup goals (25/25/20/30)
- Daily API cost tracking
- Budget remaining alerts
- Provider allocation (60% Claude, 40% OpenAI)
- Top-up triggers

**Update:** Weekly (enter new signups each Monday)

---

### 3. Conversion Funnel
**Use for:** Understanding user journey, identifying drop-off points, optimizing conversion

**Key Metrics:**
- 7-stage funnel (Signup → Email → First Gen → 10+ → 50+ → Complete → Paid)
- Activation rate (target: 80%)
- Engagement rate (target: 40%)
- Trial-to-paid conversion (target: 12%)
- Usage segments (No Use, Light, Engaged, Power, Max)

**Update:** Weekly (pull from /admin/analytics)

---

### 4. Cohort Analysis
**Use for:** Long-term revenue tracking, retention analysis, LTV calculation

**Key Metrics:**
- 12-month MRR tracking
- Monthly churn rates
- Cumulative revenue
- 3-year LTV projections ($4,800 total)
- Retention targets (92% @ 3mo, 67% @ 12mo)

**Update:** Monthly (update active user count)

---

### 5. KPI Dashboard
**Use for:** Daily monitoring, team standups, quick status checks

**Key Metrics:**
- Top 8 executive metrics
- Acquisition, engagement, conversion metrics
- Financial tracking by provider
- Revenue metrics (MRR, ARR, ARPU)
- Risk indicators with alerts
- Action items by priority

**Update:** Daily (5 min update each morning)

---

## 🎯 Success Milestones

### Week 1 (Jan 1-7)
- [ ] 25 signups
- [ ] <$90 API spend
- [ ] >70% activation rate
- [ ] Spreadsheets updated daily

### Week 2 (Jan 8-14)
- [ ] 50 cumulative signups
- [ ] <$175 cumulative spend
- [ ] First conversions (2-3 users)
- [ ] Engagement rate >30%

### Week 3 (Jan 15-21)
- [ ] 70 cumulative signups
- [ ] <$245 cumulative spend
- [ ] 4-6 cumulative conversions
- [ ] Trial completion rate >60%

### Week 4 (Jan 22-31)
- [ ] 90-110 total signups
- [ ] $300-400 total spend
- [ ] 10-15 total conversions
- [ ] 12%+ conversion rate

### Month 3 (March 2026)
- [ ] 92% retention (11/12 users)
- [ ] <5% monthly churn
- [ ] $220+ cumulative revenue
- [ ] User feedback collected

### Month 12 (January 2027)
- [ ] 67% retention (8/12 users)
- [ ] $2,400+ cumulative revenue
- [ ] 500%+ ROI achieved
- [ ] Case studies created

---

## 💰 Budget Management

### Initial Load (January 1)
```
Claude API:  $210
OpenAI API:  $140
Total:       $350
```

### Top-Up Triggers
```
Week 2 (Jan 15):
- IF signups > 75: Add $350 ($210 Claude + $140 OpenAI)
- New total: $700

Week 3 (Jan 25):
- IF signups > 150: Add $700 ($420 Claude + $280 OpenAI)
- New total: $1,400
```

### Daily Spend Alerts
```
Green:  <$15/day  (On track for 100 users)
Yellow: $15-18/day (Monitor closely)
Red:    >$18/day  (Usage spike - investigate)
```

---

## 📈 Data Sources

### From `/admin/analytics` Dashboard
- Total signups
- Email verification rate
- First generation count
- Usage stats (10+, 50+, 100+ generations)
- Trial-to-paid conversions
- Conversion timing

### From API Provider Dashboards

**Claude (console.anthropic.com):**
- Daily API spend
- Total requests
- Token usage

**OpenAI (platform.openai.com/usage):**
- Daily API spend
- Total requests
- Token usage

### From Database Queries
```sql
-- Active subscriptions (monthly update)
SELECT COUNT(*) FROM subscriptions
WHERE tier = 'pro'
AND status = 'active'
AND created_at >= '2026-01-01'
AND created_at < '2026-02-01';

-- Churn events
SELECT COUNT(*) FROM subscriptions
WHERE tier = 'pro'
AND status = 'cancelled'
AND created_at >= '2026-01-01'
AND cancelled_at BETWEEN '2026-02-01' AND '2026-03-01';
```

---

## 🔄 Weekly Update Workflow

**Monday Morning (10 min):**
```
1. Open KPI Dashboard sheet
2. Log into /admin/analytics
3. Update last week's metrics:
   - New signups
   - Cumulative signups
   - New conversions
   - Activation rate
4. Check Claude & OpenAI dashboards
5. Update API spend
6. Review Status column for alerts
7. Share snapshot with team
```

**Monthly (20 min):**
```
1. Open Cohort Analysis sheet
2. Run database query for active users
3. Update Month X → Active Users column
4. Review churn rate (should auto-calculate)
5. Check MRR and cumulative revenue
6. Compare to projections
7. Document any anomalies
```

---

## ⚠️ Red Flags to Watch

### Budget Red Flags
- 🚨 Daily spend >$18 for 3+ days
- 🚨 Budget utilization >90% before week 4
- 🚨 Cost per user >$4.50

**Action:** Investigate usage spike, review user activity, consider pausing campaign

### Conversion Red Flags
- 🚨 Activation rate <60%
- 🚨 Trial-to-paid conversion <8%
- 🚨 No conversions by week 2

**Action:** Send activation emails, optimize pricing page, review trial UX

### Retention Red Flags
- 🚨 Month 1 churn >10%
- 🚨 Month 3 retention <80%
- 🚨 Month 6 retention <70%

**Action:** User surveys, feature improvements, annual discount offer

---

## 📞 Support

**Setup Questions:**
- Read: CAMPAIGN-SPREADSHEET-SETUP-GUIDE.md (comprehensive 28-page guide)
- Check: Troubleshooting section

**Data Questions:**
- Admin Analytics: /admin/analytics
- Database queries: server/src/services/analyticsService.js

**Formula Issues:**
- Google Sheets Help: support.google.com/docs
- Formula reference: Original TSV files

---

## 📚 Next Steps

1. **Right Now:**
   - [ ] Import all 5 files to Google Sheets
   - [ ] Verify formulas calculate
   - [ ] Bookmark the Dashboard sheet
   - [ ] Set calendar reminder for weekly updates

2. **Before Campaign Launch (Jan 1):**
   - [ ] Load $350 API budget ($210 Claude + $140 OpenAI)
   - [ ] Activate campaign in /admin/campaigns
   - [ ] Test with dummy signup
   - [ ] Confirm tracking works

3. **Week 1:**
   - [ ] Update Dashboard daily
   - [ ] Monitor activation rate
   - [ ] Check API spend
   - [ ] Send Week 1 investor update

4. **Ongoing:**
   - [ ] Weekly Monday updates (10 min)
   - [ ] Monthly cohort tracking (20 min)
   - [ ] Quarterly deep-dive review
   - [ ] Annual campaign retrospective

---

## 🎉 You're Ready!

You now have:
- ✅ 5 comprehensive tracking spreadsheets (TSV + CSV)
- ✅ Full setup guide with instructions
- ✅ Weekly/monthly update workflows
- ✅ Red flag indicators and alerts
- ✅ Data source documentation
- ✅ Success milestone checklist

**Estimated time to full setup:** 30 minutes
**Ongoing maintenance:** 10 min/week + 20 min/month

---

**Campaign Details:**
- **Start:** January 1, 2026
- **End:** January 31, 2026
- **Trial:** 14-Day Pro Trial
- **Budget:** $350 initial
- **Target:** 100 signups, 12 conversions, 723% ROI

**Good luck with your campaign! 🚀**

---

**Files in this package:**
```
docs/marketing/
├── january-2026-campaign-financials.tsv
├── january-2026-campaign-financials.csv
├── campaign-weekly-tracking.tsv
├── campaign-weekly-tracking.csv
├── conversion-funnel-tracking.tsv
├── conversion-funnel-tracking.csv
├── cohort-analysis.tsv
├── cohort-analysis.csv
├── kpi-dashboard.tsv
├── kpi-dashboard.csv
├── CAMPAIGN-SPREADSHEET-SETUP-GUIDE.md  (28 pages, comprehensive)
└── README-CAMPAIGN-FINANCIALS.md  (this file)
```

**Last Updated:** January 2026
**Version:** 1.0 (14-Day Trial Campaign)
**Maintained By:** Product & Finance Teams
