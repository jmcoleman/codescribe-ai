# Trial Program Export - Trial Source Breakdown

## 🎯 Goal
Show campaign trials AND individual trials separately in the same export, so you can compare:
- Trial Program performance (auto-campaign trials)
- Baseline performance (invite codes, admin grants, self-serve)
- Total performance (all trials combined)

---

## 📊 What You'll Get

### Export Output Example:
```json
{
  "campaign": {
    "startDate": "2026-01-10",
    "endDate": "2026-01-24",
    "source": "auto_campaign",
    "id": 1,
    "name": "January 2026 Pro Trial",
    "trialTier": "pro",
    "trialDays": 14
  },

  "summary": {
    "total_signups": 100,

    "trials_breakdown": {
      "campaign_trials": {
        "started": 45,
        "converted": 9,
        "conversion_rate": 20.0,
        "source": "auto_campaign"
      },
      "individual_trials": {
        "started": 12,
        "converted": 2,
        "conversion_rate": 16.67,
        "sources": {
          "invite_code": 8,
          "admin_grant": 2,
          "self_serve": 2
        }
      },
      "total_trials": {
        "started": 57,
        "converted": 11,
        "conversion_rate": 19.3
      }
    },

    "comparison": {
      "campaign_vs_individual": {
        "campaign_conversion_rate": 20.0,
        "individual_conversion_rate": 16.67,
        "campaign_lift": "+20%"
      }
    }
  }
}
```

---

## 🔧 Updated Export Endpoint

**File:** `server/src/routes/admin-analytics.js`

Update the `/campaign-export` endpoint to include trial source breakdown:

```javascript
router.get('/campaign-export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, campaignSource = 'auto_campaign' } = req.query;

    // ... existing validation ...

    // ✨ NEW: Get trial breakdown by source
    const trialBreakdown = await pool.query(`
      SELECT
        source,
        COUNT(*) as trials_started,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions,
        ROUND(COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as conversion_rate,
        ROUND(AVG(CASE
          WHEN status = 'converted'
          THEN EXTRACT(EPOCH FROM (converted_at - started_at)) / 86400
        END), 1) as avg_days_to_convert
      FROM user_trials
      WHERE started_at >= $1
        AND started_at < $2
      GROUP BY source
      ORDER BY trials_started DESC
    `, [startDate, endDate]);

    // ✨ NEW: Separate campaign vs individual trials
    const campaignTrials = trialBreakdown.rows.find(t => t.source === campaignSource) || {
      source: campaignSource,
      trials_started: 0,
      conversions: 0,
      conversion_rate: 0,
      avg_days_to_convert: null
    };

    const individualTrials = trialBreakdown.rows.filter(t => t.source !== campaignSource);
    const individualTrialsTotal = individualTrials.reduce((acc, trial) => ({
      trials_started: acc.trials_started + parseInt(trial.trials_started),
      conversions: acc.conversions + parseInt(trial.conversions)
    }), { trials_started: 0, conversions: 0 });

    const individualConversionRate = individualTrialsTotal.trials_started > 0
      ? ((individualTrialsTotal.conversions / individualTrialsTotal.trials_started) * 100).toFixed(2)
      : 0;

    // Calculate campaign lift
    const campaignLift = individualConversionRate > 0
      ? (((parseFloat(campaignTrials.conversion_rate) - parseFloat(individualConversionRate)) / parseFloat(individualConversionRate)) * 100).toFixed(1)
      : null;

    // ... existing cohort summary query ...

    // ✨ NEW: Enhanced response with trial breakdown
    res.json({
      campaign: {
        startDate,
        endDate,
        source: campaignSource
      },

      summary: {
        total_signups: parseInt(cohortSummary.rows[0].total_signups),
        verified_users: parseInt(cohortSummary.rows[0].verified_users),
        activated_users: parseInt(cohortSummary.rows[0].activated_users),

        // ✨ NEW: Trial breakdown
        trials_breakdown: {
          campaign_trials: {
            started: parseInt(campaignTrials.trials_started),
            converted: parseInt(campaignTrials.conversions),
            conversion_rate: parseFloat(campaignTrials.conversion_rate),
            avg_days_to_convert: campaignTrials.avg_days_to_convert ? parseFloat(campaignTrials.avg_days_to_convert) : null,
            source: campaignSource
          },

          individual_trials: {
            started: individualTrialsTotal.trials_started,
            converted: individualTrialsTotal.conversions,
            conversion_rate: parseFloat(individualConversionRate),

            // Breakdown by source
            by_source: individualTrials.map(trial => ({
              source: trial.source,
              trials_started: parseInt(trial.trials_started),
              conversions: parseInt(trial.conversions),
              conversion_rate: parseFloat(trial.conversion_rate),
              avg_days_to_convert: trial.avg_days_to_convert ? parseFloat(trial.avg_days_to_convert) : null
            }))
          },

          total_trials: {
            started: parseInt(campaignTrials.trials_started) + individualTrialsTotal.trials_started,
            converted: parseInt(campaignTrials.conversions) + individualTrialsTotal.conversions,
            conversion_rate: ((parseInt(campaignTrials.conversions) + individualTrialsTotal.conversions) /
              (parseInt(campaignTrials.trials_started) + individualTrialsTotal.trials_started) * 100).toFixed(2)
          }
        },

        // ✨ NEW: Trial Program performance comparison
        comparison: {
          campaign_vs_individual: {
            campaign_conversion_rate: parseFloat(campaignTrials.conversion_rate),
            individual_conversion_rate: parseFloat(individualConversionRate),
            campaign_lift: campaignLift ? `${campaignLift > 0 ? '+' : ''}${campaignLift}%` : 'N/A',
            campaign_performs_better: parseFloat(campaignTrials.conversion_rate) > parseFloat(individualConversionRate)
          },

          trial_source_distribution: {
            campaign_percentage: ((parseInt(campaignTrials.trials_started) /
              (parseInt(campaignTrials.trials_started) + individualTrialsTotal.trials_started)) * 100).toFixed(1),
            individual_percentage: ((individualTrialsTotal.trials_started /
              (parseInt(campaignTrials.trials_started) + individualTrialsTotal.trials_started)) * 100).toFixed(1)
          }
        }
      },

      // ... existing daily, segments, spreadsheet_ready sections ...

      // ✨ NEW: Enhanced spreadsheet data with trial breakdown
      spreadsheet_ready: {
        // ... existing sections ...

        trial_comparison: {
          campaign_trials: {
            started: parseInt(campaignTrials.trials_started),
            converted: parseInt(campaignTrials.conversions),
            conversion_rate: parseFloat(campaignTrials.conversion_rate)
          },
          individual_trials: {
            started: individualTrialsTotal.trials_started,
            converted: individualTrialsTotal.conversions,
            conversion_rate: parseFloat(individualConversionRate)
          },
          total_trials: {
            started: parseInt(campaignTrials.trials_started) + individualTrialsTotal.trials_started,
            converted: parseInt(campaignTrials.conversions) + individualTrialsTotal.conversions
          },
          campaign_lift: campaignLift
        }
      }
    });

  } catch (error) {
    console.error('[Trial Program Export] Error:', error);
    res.status(500).json({ error: 'Failed to export campaign metrics' });
  }
});
```

---

## 📊 Updated UI Display

**File:** `client/src/pages/admin/Analytics.jsx`

Add trial breakdown visualization to the export section:

```jsx
function TrialBreakdownPreview({ data }) {
  if (!data?.summary?.trials_breakdown) return null;

  const { campaign_trials, individual_trials, total_trials } = data.summary.trials_breakdown;
  const { comparison } = data.summary;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-sm mb-3">Trial Source Breakdown</h3>

      <div className="grid grid-cols-3 gap-3">
        {/* Trial Program Trials */}
        <div className="bg-purple-50 border border-purple-200 rounded p-3">
          <div className="text-xs text-purple-600 font-medium mb-1">Trial Program Trials</div>
          <div className="text-2xl font-bold text-purple-900">{campaign_trials.started}</div>
          <div className="text-xs text-purple-700 mt-1">
            {campaign_trials.converted} converted ({campaign_trials.conversion_rate}%)
          </div>
        </div>

        {/* Individual Trials */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-xs text-blue-600 font-medium mb-1">Individual Trials</div>
          <div className="text-2xl font-bold text-blue-900">{individual_trials.started}</div>
          <div className="text-xs text-blue-700 mt-1">
            {individual_trials.converted} converted ({individual_trials.conversion_rate}%)
          </div>
        </div>

        {/* Total Trials */}
        <div className="bg-gray-100 border border-gray-300 rounded p-3">
          <div className="text-xs text-gray-600 font-medium mb-1">Total Trials</div>
          <div className="text-2xl font-bold text-gray-900">{total_trials.started}</div>
          <div className="text-xs text-gray-700 mt-1">
            {total_trials.converted} converted ({total_trials.conversion_rate}%)
          </div>
        </div>
      </div>

      {/* Trial Program Lift */}
      {comparison?.campaign_vs_individual && (
        <div className="mt-3 p-2 bg-white rounded border border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Trial Program Performance Lift:</span>
            <span className={`font-semibold ${
              comparison.campaign_vs_individual.campaign_performs_better
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {comparison.campaign_vs_individual.campaign_lift}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Trial Program trials converting at {comparison.campaign_vs_individual.campaign_conversion_rate}%
            vs {comparison.campaign_vs_individual.individual_conversion_rate}% for individual trials
          </div>
        </div>
      )}

      {/* Individual Trial Sources Breakdown */}
      {individual_trials.by_source && individual_trials.by_source.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Individual Trial Sources:</div>
          <div className="space-y-1">
            {individual_trials.by_source.map((source) => (
              <div key={source.source} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 capitalize">
                  {source.source.replace(/_/g, ' ')}:
                </span>
                <span className="text-gray-900">
                  {source.trials_started} trials, {source.conversions} converted ({source.conversion_rate}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add to CampaignExportSection after export button
function CampaignExportSection() {
  const [exportData, setExportData] = useState(null);

  // ... existing code ...

  const handleExport = async () => {
    // ... existing export logic ...

    const data = await response.json();
    setExportData(data); // Save for preview

    // ... rest of export logic ...
  };

  return (
    <div>
      {/* ... existing export UI ... */}

      {/* ✨ NEW: Show trial breakdown preview after export */}
      {exportData && <TrialBreakdownPreview data={exportData} />}
    </div>
  );
}
```

---

## 📋 Spreadsheet Import Format

With the trial breakdown, your spreadsheets get cleaner data:

### **Conversion Funnel Sheet:**
```
TRIAL BREAKDOWN:
Trial Program Trials (auto_campaign):    45 started,  9 converted (20.0%)
Individual Trials:                   12 started,  2 converted (16.67%)
  ├─ Invite Codes:                    8 started,  2 converted (25.0%)
  ├─ Admin Grants:                    2 started,  0 converted (0%)
  └─ Self-Serve:                      2 started,  0 converted (0%)
TOTAL TRIALS:                        57 started, 11 converted (19.3%)

Trial Program Lift: +20%
```

### **KPI Dashboard Sheet:**
```
METRIC                          CAMPAIGN    INDIVIDUAL    TOTAL
Trial Starts                         45            12       57
Trial Conversions                     9             2       11
Conversion Rate                   20.0%         16.67%   19.3%
Avg Days to Convert                18.3          21.5     19.1
```

---

## 🎯 Use Cases

### 1. **Measure Trial Program Effectiveness**
```
Trial Program conversion: 20%
Baseline conversion: 16.67%
Trial Program lift: +20%

✅ Trial Program is performing better than baseline!
```

### 2. **Calculate True Trial Program ROI**
```
Trial Program cost: $350
Trial Program conversions: 9
Cost per conversion: $38.89

Individual conversions: 2 (would have happened anyway)
Trial Program-specific conversions: 9
True campaign ROI: Based on incremental 9 conversions
```

### 3. **Compare Trial Sources**
```
Auto-campaign trials: 45 (79% of trials)
Invite code trials: 8 (14% of trials)
Admin grant trials: 2 (3.5% of trials)
Self-serve trials: 2 (3.5% of trials)

✅ Trial Program is dominant trial source this month
```

### 4. **Track Baseline Growth**
```
October individual trials: 8
November individual trials: 10
December individual trials: 12

✅ Organic growth even without campaigns
```

---

## ✅ What You Get

### **Always Available:**
- ✅ Trial Program trial metrics (if campaign exists)
- ✅ Individual trial metrics (always)
- ✅ Total trial metrics (combined)
- ✅ Trial source breakdown (invite codes, admin grants, etc.)
- ✅ Trial Program performance comparison
- ✅ Trial Program lift calculation

### **Even Without a Trial Program:**
```json
{
  "trials_breakdown": {
    "campaign_trials": {
      "started": 0,
      "converted": 0,
      "conversion_rate": 0
    },
    "individual_trials": {
      "started": 12,
      "converted": 2,
      "conversion_rate": 16.67,
      "by_source": [
        { "source": "invite_code", "trials_started": 8, ... },
        { "source": "self_serve", "trials_started": 4, ... }
      ]
    },
    "total_trials": {
      "started": 12,
      "converted": 2
    }
  }
}
```

---

## 📊 Summary

**Yes, the export now shows:**
- ✅ Trial Program trials independently
- ✅ Individual trials independently
- ✅ Total trials (combined)
- ✅ Trial source breakdown (invite code, admin grant, self-serve)
- ✅ Trial Program vs baseline comparison
- ✅ Performance lift calculation

**This lets you answer:**
- How many trials came from the campaign?
- How many trials would have happened anyway?
- Is the campaign converting better than baseline?
- What's the true incremental value of the campaign?
- Which trial sources perform best?

**Perfect for investor reporting and campaign ROI analysis!**
