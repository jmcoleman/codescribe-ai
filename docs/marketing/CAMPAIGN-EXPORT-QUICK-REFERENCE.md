# Campaign Export - Quick Reference for Spreadsheets

## 📥 What Gets Exported

When you click "Export Campaign Metrics" in Admin Analytics → Business tab, you get a CSV file that opens directly in Excel or Google Sheets with:

### CSV Structure

The CSV file contains the following sections (already formatted for spreadsheets):

**Section 1: Campaign Information**
- Campaign Name (if active campaign exists)
- Date Range
- Trial Offer (tier and duration)

**Section 2: Summary Metrics**
- Total Signups
- Email Verified
- Activated Users

**Section 3: Trial Breakdown**
| Trial Type | Trials Started | Conversions | Conversion Rate |
|------------|---------------|-------------|-----------------|
| Campaign Trials | 45 | 9 | 20.0% |
| Individual Trials | 12 | 2 | 16.67% |
| Total Trials | 57 | 11 | 19.3% |

**Section 4: Campaign Performance**
- Campaign Lift (e.g., "+20%")
- Campaign Performs Better (Yes/No)

**Section 5: Individual Trial Sources** (if available)
| Source | Trials Started | Conversions | Conversion Rate |
|--------|---------------|-------------|-----------------|
| Invite Code | 8 | 2 | 25.0% |
| Admin Grant | 2 | 0 | 0% |
| Self Serve | 2 | 0 | 0% |

**Section 6: Daily Breakdown**
| Date | Signups | Verified |
|------|---------|----------|
| 2026-01-10 | 15 | 14 |
| 2026-01-11 | 18 | 17 |
| ... | ... | ... |

---

## 📋 Using the CSV File

### Opening in Excel or Google Sheets

1. **Double-click** the downloaded CSV file - it will open automatically in your default spreadsheet application
2. **Import manually:** File → Import → Upload the CSV file
3. All data is properly formatted with:
   - CSV escaping for special characters (quotes, commas)
   - UTF-8 encoding for international characters
   - Standard CSV format compatible with all spreadsheet apps

### For Google Sheets / Excel

**Campaign Info Section (Top of spreadsheet):**

| Spreadsheet Cell | JSON Path | Example Value |
|------------------|-----------|---------------|
| Campaign Name | `campaign.name` | "January 2026 Pro Trial" |
| Start Date | `campaign.startDate` | 2026-01-10 |
| End Date | `campaign.endDate` | 2026-01-24 |
| Duration (days) | Calculate: `endDate - startDate` | 14 |
| Trial Tier | `campaign.trialTier` | Pro |
| Trial Days | `campaign.trialDays` | 14 |

**Signup Metrics:**

| Metric | JSON Path | Example |
|--------|-----------|---------|
| Total Signups | `summary.total_signups` | 100 |
| Email Verified | `summary.verified_users` | 95 |
| Verification Rate | Calculate: `(verified / signups) * 100` | 95% |
| Activated | `summary.activated_users` | 62 |
| Activation Rate | Calculate: `(activated / verified) * 100` | 65.3% |

**Trial Breakdown:**

| Metric | JSON Path | Example |
|--------|-----------|---------|
| Campaign Trials Started | `summary.trials_breakdown.campaign_trials.started` | 45 |
| Campaign Conversions | `summary.trials_breakdown.campaign_trials.converted` | 9 |
| Campaign Conversion Rate | `summary.trials_breakdown.campaign_trials.conversion_rate` | 20.0% |
| Individual Trials Started | `summary.trials_breakdown.individual_trials.started` | 12 |
| Individual Conversions | `summary.trials_breakdown.individual_trials.converted` | 2 |
| Individual Conversion Rate | `summary.trials_breakdown.individual_trials.conversion_rate` | 16.67% |
| **Campaign Lift** | `summary.comparison.campaign_vs_individual.campaign_lift` | **+20%** |

---

## 🔄 Weekly Update Workflow

### During Campaign (Weekly)

1. **Monday morning:** Export metrics with cumulative date range
   ```
   Start: Campaign start date (2026-01-10)
   End: Today (2026-01-17)
   ```

2. **Copy to "Weekly Tracking" sheet:**
   - Week 1 signups: `summary.total_signups` (this week's total)
   - Week 1 verified: `summary.verified_users`
   - Week 1 activated: `summary.activated_users`

3. **Save JSON file** with naming pattern:
   ```
   campaign-export-week1-2026-01-10-to-2026-01-17.json
   ```

### End of Campaign (Final Export)

1. **Export full date range:**
   ```
   Start: 2026-01-10 (campaign start)
   End: 2026-01-24 (campaign end)
   ```

2. **Update ALL spreadsheets** with final numbers

3. **Archive:**
   ```
   /campaigns/2026-01-january/
     ├── campaign-export-FINAL.json
     ├── campaign-export-week1.json
     ├── campaign-export-week2.json
     ├── financials-final.xlsx
     └── campaign-screenshots/
   ```

---

## 📊 Spreadsheet Examples

### Financial Model Header

```
CAMPAIGN: {campaign.name}
Period: {campaign.startDate} to {campaign.endDate} ({duration} days)
Trial Offer: {campaign.trialDays}-Day {campaign.trialTier} Trial
Last Export: {today's date}
```

**Example filled out:**
```
CAMPAIGN: January 2026 Pro Trial
Period: 2026-01-10 to 2026-01-24 (14 days)
Trial Offer: 14-Day Pro Trial
Last Export: 2026-01-25
```

### Trial Performance Table

```
Metric                  Campaign  Individual  Total   Lift
Trials Started          45        12          57      -
Conversions             9         2           11      -
Conversion Rate         20.0%     16.67%      19.3%   +20%
Avg Days to Convert     18.3      21.5        19.1    -
```

**Auto-populate from JSON:**
- Campaign Trials: `summary.trials_breakdown.campaign_trials.*`
- Individual Trials: `summary.trials_breakdown.individual_trials.*`
- Total: `summary.trials_breakdown.total_trials.*`
- Lift: `summary.comparison.campaign_vs_individual.campaign_lift`

---

## 🎯 Key Metrics for Investors

**What investors want to see:**

1. **Campaign Identity**
   - Name: `campaign.name`
   - Date Range: `campaign.startDate` - `campaign.endDate`

2. **Signup Funnel**
   - Signups: `summary.total_signups`
   - Verified %: `(verified_users / total_signups) * 100`
   - Activated %: `(activated_users / verified_users) * 100`

3. **Trial Performance**
   - Campaign conversion: `trials_breakdown.campaign_trials.conversion_rate`
   - Baseline conversion: `trials_breakdown.individual_trials.conversion_rate`
   - **Campaign Lift**: `comparison.campaign_vs_individual.campaign_lift` ← KEY METRIC!

4. **Quality Indicators**
   - Email verification rate (high = quality signups)
   - Activation rate (high = product-market fit)
   - Campaign outperforms baseline (yes/no)

---

## ✅ Checklist: After Every Export

**Immediate (2 min):**
- [ ] Campaign name captured: `campaign.name`
- [ ] Date range captured: `campaign.startDate` to `campaign.endDate`
- [ ] Total signups recorded: `summary.total_signups`
- [ ] JSON file renamed and saved

**Weekly Update (5 min):**
- [ ] Update weekly tracking sheet
- [ ] Check conversion trends
- [ ] Verify budget burn rate

**Final Export (15 min):**
- [ ] All 5 spreadsheets updated from final export
- [ ] Campaign lift calculated and highlighted
- [ ] Archive JSON + spreadsheets in campaign folder
- [ ] Screenshots saved from Admin UI
- [ ] Ready for investor presentation

---

## 📁 File Naming Convention

**During campaign (weekly exports):**
```
campaign-export-week1-{start}-to-{end}.json
campaign-export-week2-{start}-to-{end}.json
```

**Final export:**
```
campaign-export-FINAL-{campaign.name}-{start}-to-{end}.json
```

**Example:**
```
campaign-export-FINAL-January-2026-Pro-Trial-2026-01-10-to-2026-01-24.json
```

This makes it easy to identify the campaign and date range just from the filename!

---

**Quick Tip:** Open the JSON in VS Code or any text editor, then use this guide to copy-paste values into your spreadsheet. The whole process takes less than 5 minutes once you're familiar with the field mapping!
