# Campaign Export Button - Smart Implementation

## 🎯 Problem
The export button needs to know:
1. Which campaign to export (campaign ID, name, source)
2. What date ranges to use (campaign start/end dates)
3. Handle multiple campaigns or manual date overrides

---

## ✅ Smart Solution: Auto-Detect Active Campaign

### Approach
1. **Fetch active campaign** from database on page load
2. **Auto-populate** date range and campaign info
3. **Allow override** for historical campaigns or custom ranges
4. **Show campaign context** (name, status, date range)

---

## 🚀 Implementation

### Step 1: Add Campaign Info to Admin Analytics API

**File:** `server/src/routes/admin-analytics.js`

```javascript
/**
 * GET /api/admin/analytics/active-campaign
 *
 * Get currently active campaign for export defaults
 */
router.get('/active-campaign', requireAuth, requireAdmin, async (req, res) => {
  try {
    const campaign = await pool.query(`
      SELECT
        id,
        name,
        description,
        trial_tier,
        trial_days,
        starts_at,
        ends_at,
        is_active,
        signups_count,
        conversions_count
      FROM campaigns
      WHERE is_active = true
        AND starts_at <= NOW()
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY starts_at DESC
      LIMIT 1
    `);

    if (campaign.rows.length === 0) {
      return res.json({ activeCampaign: null });
    }

    res.json({ activeCampaign: campaign.rows[0] });

  } catch (error) {
    console.error('[Admin Analytics] Error fetching active campaign:', error);
    res.status(500).json({ error: 'Failed to fetch active campaign' });
  }
});

/**
 * GET /api/admin/analytics/campaigns
 *
 * List all campaigns (for dropdown selection)
 */
router.get('/campaigns', requireAuth, requireAdmin, async (req, res) => {
  try {
    const campaigns = await pool.query(`
      SELECT
        id,
        name,
        trial_tier,
        trial_days,
        starts_at,
        ends_at,
        is_active,
        signups_count,
        conversions_count,
        CASE
          WHEN is_active AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at >= NOW())
            THEN 'active'
          WHEN starts_at > NOW()
            THEN 'scheduled'
          WHEN ends_at < NOW()
            THEN 'ended'
          ELSE 'inactive'
        END as status
      FROM campaigns
      ORDER BY starts_at DESC
    `);

    res.json({ campaigns: campaigns.rows });

  } catch (error) {
    console.error('[Admin Analytics] Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});
```

---

### Step 2: Smart Campaign Export Component

**File:** `client/src/pages/admin/Analytics.jsx`

```jsx
import { useState, useEffect } from 'react';
import { Download, Loader2, Calendar, ChevronDown } from 'lucide-react';
import { STORAGE_KEYS } from '../../constants/storage';

function CampaignExportSection() {
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showCampaignPicker, setShowCampaignPicker] = useState(false);

  // Fetch active campaign on mount
  useEffect(() => {
    fetchActiveCampaign();
    fetchAllCampaigns();
  }, []);

  const fetchActiveCampaign = async () => {
    try {
      const response = await fetch('/api/admin/analytics/active-campaign', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch active campaign');

      const data = await response.json();

      if (data.activeCampaign) {
        setActiveCampaign(data.activeCampaign);
        setSelectedCampaignId(data.activeCampaign.id);

        // Auto-populate dates from campaign
        setStartDate(formatDate(data.activeCampaign.starts_at));
        setEndDate(data.activeCampaign.ends_at
          ? formatDate(data.activeCampaign.ends_at)
          : formatDate(new Date())
        );
      }
    } catch (error) {
      console.error('Error fetching active campaign:', error);
    }
  };

  const fetchAllCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/analytics/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setAllCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleCampaignSelect = (campaign) => {
    setSelectedCampaignId(campaign.id);
    setActiveCampaign(campaign);
    setStartDate(formatDate(campaign.starts_at));
    setEndDate(campaign.ends_at
      ? formatDate(campaign.ends_at)
      : formatDate(new Date())
    );
    setShowCampaignPicker(false);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Determine campaign source for filtering
      const campaignSource = activeCampaign
        ? 'auto_campaign' // If campaign exists, filter by campaign source
        : null; // If no campaign, export all data in date range

      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(campaignSource && { campaignSource })
      });

      const response = await fetch(`/api/admin/analytics/campaign-export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();

      // Create formatted export with campaign context
      const exportData = {
        campaign: {
          id: activeCampaign?.id,
          name: activeCampaign?.name || 'Custom Date Range',
          startDate,
          endDate,
          trial_tier: activeCampaign?.trial_tier,
          trial_days: activeCampaign?.trial_days
        },
        exported_at: new Date().toISOString(),
        ...data
      };

      // Download as JSON
      downloadJson(exportData, `campaign-export-${startDate}-to-${endDate}.json`);

      // Also copy summary to clipboard for quick paste
      const summary = formatSummaryForClipboard(exportData);
      navigator.clipboard.writeText(summary);

      toast.success('Campaign metrics exported! Summary copied to clipboard.');

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export campaign metrics');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSummaryForClipboard = (data) => {
    return `
📊 CAMPAIGN EXPORT: ${data.campaign.name}
Date Range: ${data.campaign.startDate} to ${data.campaign.endDate}
${data.campaign.trial_tier ? `Trial: ${data.campaign.trial_tier} (${data.campaign.trial_days} days)` : ''}

SUMMARY METRICS (paste into spreadsheet):
Total Signups: ${data.summary.total_signups}
Verified Users: ${data.summary.verified_users}
Activation Rate: ${data.summary.activation_rate}%
Converted Users: ${data.summary.converted_users}
Conversion Rate: ${data.summary.conversion_rate}%

KPI METRICS (for KPI Dashboard sheet):
${JSON.stringify(data.spreadsheet_ready.kpi_metrics, null, 2)}

FUNNEL METRICS (for Conversion Funnel sheet):
${JSON.stringify(data.spreadsheet_ready.funnel_metrics, null, 2)}

Full JSON exported to downloads folder.
    `.trim();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Campaign Metrics Export</h2>

      {/* Campaign Info Display */}
      {activeCampaign ? (
        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-purple-900">{activeCampaign.name}</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                  Active
                </span>
              </div>
              {activeCampaign.description && (
                <p className="text-sm text-gray-600 mb-2">{activeCampaign.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span>Trial: {activeCampaign.trial_tier} ({activeCampaign.trial_days} days)</span>
                <span>Signups: {activeCampaign.signups_count || 0}</span>
                <span>Conversions: {activeCampaign.conversions_count || 0}</span>
              </div>
            </div>
            <button
              onClick={() => setShowCampaignPicker(!showCampaignPicker)}
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              Change Campaign
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            No active campaign. Exporting custom date range.
          </p>
          <button
            onClick={() => setShowCampaignPicker(!showCampaignPicker)}
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            Select Campaign
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Campaign Picker Dropdown */}
      {showCampaignPicker && (
        <div className="mb-4 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          {allCampaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => handleCampaignSelect(campaign)}
              className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                selectedCampaignId === campaign.id ? 'bg-purple-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{campaign.name}</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(campaign.starts_at)} to {campaign.ends_at ? formatDate(campaign.ends_at) : 'ongoing'}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {campaign.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Date Range Inputs */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || !startDate || !endDate}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Exporting Campaign Metrics...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Export Campaign Metrics
          </>
        )}
      </button>

      {/* Help Text */}
      <p className="mt-3 text-xs text-gray-500 text-center">
        Exports JSON file + copies summary to clipboard for spreadsheet import
      </p>
    </div>
  );
}

// Add to Analytics page
export default function Analytics() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

      {/* ✨ NEW: Campaign Export Section */}
      <div className="mb-8">
        <CampaignExportSection />
      </div>

      {/* Existing analytics tabs/charts */}
      {/* ... */}
    </div>
  );
}
```

---

## 🎯 How It Works

### On Page Load:
1. ✅ **Fetches active campaign** from database
2. ✅ **Auto-populates** campaign name, dates, trial info
3. ✅ **Shows campaign status** (Active, Scheduled, Ended)
4. ✅ **Displays signup/conversion counts** from campaign

### User Experience:

**Scenario 1: Active Campaign Running**
```
┌─────────────────────────────────────────────────────┐
│ Campaign Metrics Export                             │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ January 2026 Pro Trial          [Active]        │ │
│ │ New Year promotion - gather feedback            │ │
│ │ Trial: pro (14 days) | Signups: 87 | Conv: 9   │ │
│ │                          [Change Campaign ▼]    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Start Date: [2026-01-01]  End Date: [2026-01-31]  │
│                                                     │
│ [📊 Export Campaign Metrics]                       │
└─────────────────────────────────────────────────────┘
```

**Scenario 2: No Active Campaign**
```
┌─────────────────────────────────────────────────────┐
│ Campaign Metrics Export                             │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ No active campaign. Exporting custom date range.│ │
│ │ [Select Campaign ▼]                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Start Date: [________]  End Date: [________]       │
│                                                     │
│ [📊 Export Campaign Metrics]                       │
└─────────────────────────────────────────────────────┘
```

**Scenario 3: Campaign Picker Open**
```
┌─────────────────────────────────────────────────────┐
│ Select Campaign:                                    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ January 2026 Pro Trial          [Active]   ✓   │ │
│ │ 2026-01-01 to 2026-01-31                        │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ December 2025 Launch           [Ended]          │ │
│ │ 2025-12-01 to 2025-12-31                        │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ Q2 2026 Growth Campaign        [Scheduled]      │ │
│ │ 2026-04-01 to 2026-04-30                        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Features

1. **Auto-Detection**
   - Fetches active campaign on page load
   - Pre-fills dates from campaign start/end
   - Shows campaign context (name, description, trial info)

2. **Manual Override**
   - Can select different campaign from dropdown
   - Can manually adjust date range
   - Works even with no active campaign

3. **Campaign Context**
   - Shows which campaign you're exporting
   - Displays current signup/conversion counts
   - Color-coded status badges (Active/Scheduled/Ended)

4. **Smart Filtering**
   - If campaign selected: filters by `user_trials.source = 'auto_campaign'`
   - If no campaign: exports all data in date range
   - Campaign info included in exported JSON

5. **User Feedback**
   - Disabled state when dates missing
   - Loading state during export
   - Success toast + clipboard copy
   - Help text explaining output format

---

## 📋 Export Output Example

```json
{
  "campaign": {
    "id": 3,
    "name": "January 2026 Pro Trial",
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "trial_tier": "pro",
    "trial_days": 14
  },
  "exported_at": "2026-01-22T10:30:00.000Z",
  "summary": {
    "total_signups": 87,
    "verified_users": 83,
    "activated_users": 70,
    "converted_users": 9,
    "activation_rate": 80.46,
    "conversion_rate": 10.34
  },
  "spreadsheet_ready": {
    "weekly_tracking": [...],
    "funnel_metrics": {...},
    "kpi_metrics": {...}
  }
}
```

**Plus summary is auto-copied to clipboard for quick paste!**

---

## 🎯 Summary

**Yes, the button is smart:**
- ✅ Auto-detects active campaign
- ✅ Pre-fills campaign dates
- ✅ Shows campaign context
- ✅ Allows manual override
- ✅ Supports historical campaigns
- ✅ Works with no campaign (custom dates)

**User just needs to:**
1. Open `/admin/analytics`
2. Click "Export Campaign Metrics"
3. Paste results into spreadsheet

**No manual date entry needed if there's an active campaign!**
