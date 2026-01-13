# Google Sheets Campaign Export Template

**Purpose:** Import and visualize CodeScribe AI campaign performance data
**Data Source:** `GET /api/admin/campaigns/export`
**Last Updated:** January 13, 2026

---

## Quick Setup Guide

### Step 1: Create New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create new spreadsheet
3. Name it "CodeScribe Campaign Analytics"

### Step 2: Set Up Sheets

Create these 6 sheets (tabs) in your spreadsheet:

1. **Config** - API settings and import controls
2. **Overview** - Campaign summary and key metrics
3. **Trial Performance** - Campaign vs individual trial comparison
4. **Cohort Funnel** - Signup to activation conversion funnel
5. **Usage Segments** - User engagement breakdown
6. **Daily Metrics** - Day-by-day signup/verification data

### Step 3: Install Apps Script

1. Click **Extensions → Apps Script**
2. Delete default `myFunction()` code
3. Copy the script from Section 3 below
4. Click **Save** (disk icon)
5. Name project "Campaign Import"

### Step 4: Configure API Access

1. Go to **Config** sheet
2. Enter your API token in cell B1
3. Enter campaign dates in B2 and B3
4. Enter campaign source in B4 (usually "auto_campaign")

### Step 5: Run Import

1. In Google Sheets, click **Campaign → Import Campaign Data** from menu
2. Authorize the script (first time only)
3. Data will populate automatically

---

## Sheet Structures

### Sheet 1: Config

**Purpose:** Store API credentials and import parameters

| A | B |
|---|---|
| API Token | [YOUR_TOKEN_HERE] |
| Start Date | 2026-01-01 |
| End Date | 2026-01-31 |
| Campaign Source | auto_campaign |
| Last Import | [Auto-filled] |
| Import Status | [Auto-filled] |

**Named Ranges to Create:**
- `ApiToken` → Config!B1
- `StartDate` → Config!B2
- `EndDate` → Config!B3
- `CampaignSource` → Config!B4

### Sheet 2: Overview

**Purpose:** High-level campaign summary dashboard

```
A                          B              C                D
Campaign Name              [Imported]
Campaign Period            [Start] to [End]
Trial Tier                 [Pro/Business]
Trial Duration             [14/30] days

KEY METRICS
Total Signups              [100]          Verification Rate   [90.0%]
Email Verified             [90]           Activation Rate     [66.7%]
First Generation           [60]

TRIAL PERFORMANCE
Campaign Trials Started    [50]           Individual Trials   [8]
Campaign Conversions       [10]           Individual Conv.    [2]
Campaign Conv. Rate        [20.0%]        Individual Rate     [25.0%]
Campaign Lift              [-20.0%]

USAGE DISTRIBUTION
No Usage                   [40] (40.0%)
Light Users (1-9)          [30] (30.0%)
Engaged Users (10-49)      [20] (20.0%)
Power Users (50-99)        [7] (7.0%)
Max Users (100+)           [3] (3.0%)

TIME TO VALUE
Avg Time to Email Verify   [3.2] hours    Median: [2.5] hours
Avg Time to First Gen      [5.8] hours    Median: [4.2] hours
```

### Sheet 3: Trial Performance

**Purpose:** Detailed trial conversion analysis

| A | B | C | D |
|---|---|---|---|
| **Metric** | **Campaign Trials** | **Individual Trials** | **Total** |
| Trials Started | =TrialData!B2 | =TrialData!C2 | =TrialData!D2 |
| Conversions | =TrialData!B3 | =TrialData!C3 | =TrialData!D3 |
| Conversion Rate | =B3/B2 | =C3/C2 | =D3/D2 |
| Avg Days to Convert | =TrialData!B4 | =TrialData!C4 | - |
| | | | |
| **Campaign Performance** | | | |
| Campaign Lift | =TrialData!B6 | | |
| Performs Better? | =IF(B3/B2>C3/C2,"YES","NO") | | |
| | | | |
| **Revenue Impact** (if conversion = paid) | | | |
| Campaign Value | =B3*49 | | (assume $49/month) |
| Individual Value | =C3*49 | | |
| Additional Revenue | =(B3-C3)*49 | | |

**By Source Breakdown** (if multiple invite codes):

| Source | Trials | Conversions | Rate |
|--------|--------|-------------|------|
| [Source 1] | [8] | [2] | [25.0%] |
| [Source 2] | [5] | [1] | [20.0%] |

### Sheet 4: Cohort Funnel

**Purpose:** Visualize signup to activation conversion

| A | B | C | D |
|---|---|---|---|
| **Stage** | **Users** | **Conversion Rate** | **% of Signups** |
| Signups | =CohortData!B2 | 100% | 100% |
| Email Verified | =CohortData!B3 | =B3/B2 | =B3/$B$2 |
| First Generation | =CohortData!B4 | =B4/B3 | =B4/$B$2 |
| | | | |
| **Drop-off Analysis** | | | |
| Signup → Verify | =B2-B3 | Lost | =C5/B2 |
| Verify → Generate | =B3-B4 | Lost | =C6/B3 |
| | | | |
| **Insights** | | | |
| Verification Success | =IF(B3/B2>0.8,"GOOD","NEEDS IMPROVEMENT") | | |
| Activation Success | =IF(B4/B3>0.5,"GOOD","NEEDS IMPROVEMENT") | | |

**Chart Recommendation:** Create a funnel chart using columns A-B rows 2-4

### Sheet 5: Usage Segments

**Purpose:** User engagement distribution

| A | B | C | D |
|---|---|---|---|
| **Segment** | **Users** | **Percentage** | **Revenue Potential** |
| No Usage | =UsageData!B2 | =C2/SUM($B$2:$B$6) | $0 |
| Light (1-9) | =UsageData!B3 | =C3/SUM($B$2:$B$6) | =$C3*5*49 |
| Engaged (10-49) | =UsageData!B4 | =C4/SUM($B$2:$B$6) | =$C4*25*49 |
| Power (50-99) | =UsageData!B5 | =C5/SUM($B$2:$B$6) | =$C5*75*49 |
| Max (100+) | =UsageData!B6 | =C6/SUM($B$2:$B$6) | =$C6*100*49 |
| **Total** | =SUM(B2:B6) | =SUM(C2:C6) | =SUM(D2:D6) |
| | | | |
| **Engagement Summary** | | | |
| Active Users (>10 gens) | =SUM(B4:B6) | =SUM(C4:C6) | |
| Inactive Users (<10) | =SUM(B2:B3) | =SUM(C2:C3) | |
| Activation Rate | =B9/B11 | | |

**Chart Recommendations:**
1. Pie chart: Segment distribution (A2:B6)
2. Bar chart: Users per segment (A2:B6)
3. Stacked bar: Active vs Inactive (A9:B10)

### Sheet 6: Daily Metrics

**Purpose:** Day-by-day signup and verification trends

| A | B | C | D |
|---|---|---|---|
| **Date** | **Signups** | **Verified** | **Verification Rate** |
| 2026-01-01 | 15 | 14 | =C2/B2 |
| 2026-01-02 | 18 | 17 | =C3/B3 |
| ... | ... | ... | ... |
| | | | |
| **Summary** | | | |
| Total Signups | =SUM(B2:B32) | | |
| Avg Daily Signups | =AVERAGE(B2:B32) | | |
| Peak Day | =MAX(B2:B32) | Date: =INDEX(A:A,MATCH(MAX(B2:B32),B:B,0)) | |
| Lowest Day | =MIN(B2:B32) | Date: =INDEX(A:A,MATCH(MIN(B2:B32),B:B,0)) | |

**Chart Recommendations:**
1. Line chart: Daily signups trend (A2:B32)
2. Line chart: Verification rate trend (A2:A32, D2:D32)
3. Column chart: Signups vs verified (A2:C32)

---

## Apps Script Code

### Code.gs

Copy this entire script into your Apps Script editor:

```javascript
/**
 * CodeScribe Campaign Export - Google Sheets Integration
 *
 * This script fetches campaign data from CodeScribe API and populates
 * a formatted Google Sheet with analytics and visualizations.
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://codescribeai.com/api',
  // API_BASE_URL: 'http://localhost:3000/api', // For local testing
  ENDPOINTS: {
    EXPORT: '/admin/campaigns/export'
  }
};

/**
 * Create custom menu on spreadsheet open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Campaign')
    .addItem('Import Campaign Data', 'importCampaignData')
    .addItem('Refresh All Data', 'refreshAllData')
    .addSeparator()
    .addItem('Clear All Data', 'clearAllData')
    .addItem('Setup Sheets', 'setupSheets')
    .addToUi();
}

/**
 * Main import function - fetches and populates all data
 */
function importCampaignData() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Update status
    updateImportStatus('Importing...', 'In Progress');

    // Get config
    const config = getConfig();

    // Validate config
    if (!config.apiToken || !config.startDate || !config.endDate) {
      throw new Error('Missing required configuration. Please fill Config sheet.');
    }

    // Fetch data from API
    ui.alert('Fetching campaign data...');
    const data = fetchCampaignData(config);

    // Populate sheets
    ui.alert('Populating sheets...');
    populateOverview(data);
    populateTrialPerformance(data);
    populateCohortFunnel(data);
    populateUsageSegments(data);
    populateDailyMetrics(data);

    // Update status
    const timestamp = new Date().toLocaleString();
    updateImportStatus(timestamp, 'Success');

    ui.alert('Import Complete', 'Campaign data imported successfully!', ui.ButtonSet.OK);

  } catch (error) {
    updateImportStatus(new Date().toLocaleString(), 'Failed: ' + error.message);
    ui.alert('Import Failed', error.message, ui.ButtonSet.OK);
    console.error('Import error:', error);
  }
}

/**
 * Get configuration from Config sheet
 */
function getConfig() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');

  if (!sheet) {
    throw new Error('Config sheet not found. Please run Setup Sheets first.');
  }

  return {
    apiToken: sheet.getRange('B1').getValue(),
    startDate: formatDate(sheet.getRange('B2').getValue()),
    endDate: formatDate(sheet.getRange('B3').getValue()),
    campaignSource: sheet.getRange('B4').getValue() || 'auto_campaign'
  };
}

/**
 * Update import status in Config sheet
 */
function updateImportStatus(timestamp, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (sheet) {
    sheet.getRange('B5').setValue(timestamp);
    sheet.getRange('B6').setValue(status);
  }
}

/**
 * Fetch campaign data from API
 */
function fetchCampaignData(config) {
  const url = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.EXPORT}?startDate=${config.startDate}&endDate=${config.endDate}&campaignSource=${config.campaignSource}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error(`API request failed (${statusCode}): ${response.getContentText()}`);
  }

  const result = JSON.parse(response.getContentText());

  if (!result.success) {
    throw new Error(result.error || 'Unknown API error');
  }

  return result.data;
}

/**
 * Populate Overview sheet
 */
function populateOverview(data) {
  const sheet = getOrCreateSheet('Overview');
  sheet.clear();

  // Campaign info
  sheet.getRange('A1').setValue('CAMPAIGN INFORMATION').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A2:B2').setValues([['Campaign Name', data.campaign.name || 'N/A']]);
  sheet.getRange('A3:B3').setValues([['Period', `${data.campaign.startDate} to ${data.campaign.endDate}`]]);
  sheet.getRange('A4:B4').setValues([['Trial Tier', data.campaign.trialTier || 'N/A']]);
  sheet.getRange('A5:B5').setValues([['Trial Duration', (data.campaign.trialDays || 'N/A') + ' days']]);

  // Key metrics
  sheet.getRange('A7').setValue('KEY METRICS').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A8:D8').setValues([['Metric', 'Value', 'Metric', 'Value']]);
  sheet.getRange('A9:D11').setValues([
    ['Total Signups', data.summary.total_signups, 'Verification Rate', data.spreadsheet_ready.cohort_summary.verification_rate + '%'],
    ['Email Verified', data.summary.verified_users, 'Activation Rate', data.spreadsheet_ready.cohort_summary.activation_rate + '%'],
    ['First Generation', data.summary.activated_users, '', '']
  ]);

  // Trial performance
  sheet.getRange('A13').setValue('TRIAL PERFORMANCE').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A14:D14').setValues([['Campaign Trials', '', 'Individual Trials', '']]);
  sheet.getRange('A15:D17').setValues([
    ['Started', data.spreadsheet_ready.trial_comparison.campaign_trials.started, 'Started', data.spreadsheet_ready.trial_comparison.individual_trials.started],
    ['Conversions', data.spreadsheet_ready.trial_comparison.campaign_trials.converted, 'Conversions', data.spreadsheet_ready.trial_comparison.individual_trials.converted],
    ['Conv. Rate', data.spreadsheet_ready.trial_comparison.campaign_trials.conversion_rate + '%', 'Conv. Rate', data.spreadsheet_ready.trial_comparison.individual_trials.conversion_rate + '%']
  ]);
  sheet.getRange('A18:B18').setValues([['Campaign Lift', (data.spreadsheet_ready.trial_comparison.campaign_lift || 'N/A') + '%']]);

  // Usage distribution
  sheet.getRange('A20').setValue('USAGE DISTRIBUTION').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A21:C21').setValues([['Segment', 'Users', 'Percentage']]);

  const segments = data.extended_metrics.usage_segments;
  const segmentData = segments.map(s => [s.segment, s.users, s.percentage + '%']);
  sheet.getRange(22, 1, segmentData.length, 3).setValues(segmentData);

  // Format
  sheet.getRange('A1:D30').setFontFamily('Arial').setFontSize(10);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 120);
}

/**
 * Populate Trial Performance sheet
 */
function populateTrialPerformance(data) {
  const sheet = getOrCreateSheet('Trial Performance');
  sheet.clear();

  const tc = data.spreadsheet_ready.trial_comparison;

  // Headers
  sheet.getRange('A1:D1').setValues([['Metric', 'Campaign Trials', 'Individual Trials', 'Total']])
    .setFontWeight('bold').setBackground('#4285f4').setFontColor('white');

  // Data
  sheet.getRange('A2:D5').setValues([
    ['Trials Started', tc.campaign_trials.started, tc.individual_trials.started, tc.total_trials.started],
    ['Conversions', tc.campaign_trials.converted, tc.individual_trials.converted, tc.total_trials.converted],
    ['Conversion Rate', tc.campaign_trials.conversion_rate / 100, tc.individual_trials.conversion_rate / 100, tc.total_trials.conversion_rate / 100],
    ['Campaign Lift', tc.campaign_lift ? parseFloat(tc.campaign_lift) / 100 : null, '', '']
  ]);

  // Format percentages
  sheet.getRange('B4:D4').setNumberFormat('0.00%');
  sheet.getRange('B5').setNumberFormat('0.00%');

  // Named range for formulas
  sheet.setName('TrialData');

  // Format
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidths(2, 3, 140);
}

/**
 * Populate Cohort Funnel sheet
 */
function populateCohortFunnel(data) {
  const sheet = getOrCreateSheet('Cohort Funnel');
  sheet.clear();

  const cohort = data.spreadsheet_ready.cohort_summary;

  // Headers
  sheet.getRange('A1:D1').setValues([['Stage', 'Users', 'Conversion Rate', '% of Signups']])
    .setFontWeight('bold').setBackground('#34a853').setFontColor('white');

  // Data
  const totalSignups = cohort.signups;
  const verified = cohort.verified;
  const activated = cohort.activated;

  sheet.getRange('A2:D4').setValues([
    ['Signups', totalSignups, 1.0, 1.0],
    ['Email Verified', verified, verified / totalSignups, verified / totalSignups],
    ['First Generation', activated, activated / verified, activated / totalSignups]
  ]);

  // Format percentages
  sheet.getRange('C2:D4').setNumberFormat('0.00%');

  // Named range
  sheet.setName('CohortData');

  // Format
  sheet.setColumnWidths(1, 4, 150);
}

/**
 * Populate Usage Segments sheet
 */
function populateUsageSegments(data) {
  const sheet = getOrCreateSheet('Usage Segments');
  sheet.clear();

  // Headers
  sheet.getRange('A1:C1').setValues([['Segment', 'Users', 'Percentage']])
    .setFontWeight('bold').setBackground('#fbbc04').setFontColor('white');

  // Data
  const segments = data.extended_metrics.usage_segments;
  const segmentData = segments.map(s => [s.segment, s.users, s.percentage / 100]);

  sheet.getRange(2, 1, segmentData.length, 3).setValues(segmentData);

  // Format percentages
  sheet.getRange(2, 3, segmentData.length, 1).setNumberFormat('0.00%');

  // Totals
  const totalRow = segmentData.length + 2;
  sheet.getRange(totalRow, 1, 1, 3).setValues([
    ['TOTAL', `=SUM(B2:B${totalRow - 1})`, `=SUM(C2:C${totalRow - 1})`]
  ]).setFontWeight('bold').setBackground('#f4f4f4');

  // Named range
  sheet.setName('UsageData');

  // Format
  sheet.setColumnWidths(1, 3, 150);
}

/**
 * Populate Daily Metrics sheet
 */
function populateDailyMetrics(data) {
  const sheet = getOrCreateSheet('Daily Metrics');
  sheet.clear();

  // Headers
  sheet.getRange('A1:D1').setValues([['Date', 'Signups', 'Verified', 'Verification Rate']])
    .setFontWeight('bold').setBackground('#ea4335').setFontColor('white');

  // Data
  if (data.daily && data.daily.length > 0) {
    const dailyData = data.daily.map(d => [
      d.date,
      d.signups,
      d.verified,
      d.signups > 0 ? d.verified / d.signups : 0
    ]);

    sheet.getRange(2, 1, dailyData.length, 4).setValues(dailyData);

    // Format
    sheet.getRange(2, 4, dailyData.length, 1).setNumberFormat('0.00%');
  }

  // Named range
  sheet.setName('DailyData');

  // Format
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidths(2, 3, 100);
}

/**
 * Helper: Get or create sheet
 */
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  return sheet;
}

/**
 * Helper: Format date as YYYY-MM-DD
 */
function formatDate(date) {
  if (typeof date === 'string') return date;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Setup all sheets with proper structure
 */
function setupSheets() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create Config sheet
  let configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config', 0);
  }

  configSheet.clear();
  configSheet.getRange('A1:B6').setValues([
    ['API Token', '[YOUR_TOKEN_HERE]'],
    ['Start Date', '2026-01-01'],
    ['End Date', '2026-01-31'],
    ['Campaign Source', 'auto_campaign'],
    ['Last Import', ''],
    ['Import Status', '']
  ]);

  configSheet.getRange('A1:A6').setFontWeight('bold');
  configSheet.setColumnWidth(1, 150);
  configSheet.setColumnWidth(2, 300);

  // Create empty sheets
  const sheets = ['Overview', 'Trial Performance', 'Cohort Funnel', 'Usage Segments', 'Daily Metrics'];
  sheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });

  ui.alert('Setup Complete', 'All sheets created. Please configure API settings in Config sheet.', ui.ButtonSet.OK);
}

/**
 * Clear all data (keeps structure)
 */
function clearAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear All Data',
    'This will clear all imported data. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const sheets = ['Overview', 'Trial Performance', 'Cohort Funnel', 'Usage Segments', 'Daily Metrics'];
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    sheets.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        sheet.clear();
      }
    });

    updateImportStatus('', 'Cleared');
    ui.alert('Data Cleared', 'All campaign data has been cleared.', ui.ButtonSet.OK);
  }
}

/**
 * Refresh all data (re-import)
 */
function refreshAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Refresh Data',
    'This will re-import all campaign data. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    importCampaignData();
  }
}
```

---

## Setup Instructions (Detailed)

### 1. Initial Setup

**Create Spreadsheet:**
1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank**
3. Name: "CodeScribe Campaign Analytics"

**Install Script:**
1. Click **Extensions → Apps Script**
2. Delete default code
3. Paste the Apps Script code from above
4. Click **Save** (💾 icon)
5. Name project: "Campaign Import"

**First Run Authorization:**
1. In Apps Script editor, select `onOpen` from dropdown
2. Click **Run** (▶️ icon)
3. Click **Review Permissions**
4. Choose your Google account
5. Click **Advanced → Go to Campaign Import (unsafe)**
6. Click **Allow**

### 2. Configure API Access

**Get API Token:**
1. Log in to CodeScribe AI as admin (https://codescribeai.com)
2. **IMPORTANT:** Must have `admin`, `support`, or `super_admin` role
3. Open browser console (F12 or right-click → Inspect)
4. Go to **Console** tab
5. Type: `localStorage.getItem('cs_auth_token')`
6. Press Enter
7. Copy the token (long string starting with `eyJ...`)
8. **Note:** Token expires after 7 days. If you get 401 errors later, log out and back in to get a fresh token.

**Configure Sheet:**
1. Go back to your spreadsheet
2. Click **Campaign → Setup Sheets** (creates all tabs)
3. Go to **Config** sheet
4. Paste your token in cell B1 (replace `[YOUR_TOKEN_HERE]`)
5. Set campaign dates in B2 and B3 (YYYY-MM-DD format)
6. Set campaign source in B4 (usually "auto_campaign")

### 3. Import Data

1. Click **Campaign → Import Campaign Data** from menu
2. Click **Allow** if prompted for permissions
3. Wait for "Fetching campaign data..." message
4. Wait for "Import Complete" message
5. Review data in all sheets

### 4. Create Charts (Optional)

**Trial Performance Chart:**
1. Go to **Trial Performance** sheet
2. Select A1:C3 (headers + campaign/individual rows)
3. Click **Insert → Chart**
4. Chart type: **Column chart**
5. Title: "Campaign vs Individual Trial Performance"

**Cohort Funnel Chart:**
1. Go to **Cohort Funnel** sheet
2. Select A1:B4 (stage names and user counts)
3. Click **Insert → Chart**
4. Chart type: **Funnel chart**
5. Title: "User Activation Funnel"

**Usage Segments Pie Chart:**
1. Go to **Usage Segments** sheet
2. Select A1:B6 (segment names and user counts)
3. Click **Insert → Chart**
4. Chart type: **Pie chart**
5. Title: "Usage Segment Distribution"

**Daily Signups Line Chart:**
1. Go to **Daily Metrics** sheet
2. Select A1:B32 (dates and signups)
3. Click **Insert → Chart**
4. Chart type: **Line chart**
5. Title: "Daily Signups Trend"

---

## Usage Guide

### Importing New Campaign Data

**Method 1: Menu (Recommended)**
1. Click **Campaign → Import Campaign Data**
2. Wait for completion message
3. All sheets update automatically

**Method 2: Refresh Data**
1. Click **Campaign → Refresh All Data**
2. Confirms before overwriting
3. Useful for updating existing import

### Changing Date Range

1. Go to **Config** sheet
2. Update **Start Date** (B2) and **End Date** (B3)
3. Click **Campaign → Import Campaign Data**
4. New date range data will populate

### Comparing Multiple Campaigns

**Option 1: Duplicate Spreadsheet**
1. Click **File → Make a copy**
2. Name: "Campaign [Month] [Year]"
3. Update Config dates
4. Import new data

**Option 2: Manual Export**
1. Import first campaign
2. Copy data to separate sheet (e.g., "January")
3. Update Config dates
4. Import second campaign
5. Copy to "February" sheet
6. Compare manually

### Scheduling Auto-Import

**Create Time-Driven Trigger:**
1. In Apps Script editor, click ⏰ **Triggers** (left sidebar)
2. Click **+ Add Trigger**
3. Function: `importCampaignData`
4. Event source: **Time-driven**
5. Type: **Day timer**
6. Time: **6am to 7am** (or preferred time)
7. Click **Save**

Now data imports automatically every day!

---

## Troubleshooting

### Error: "Config sheet not found"

**Solution:** Click **Campaign → Setup Sheets** to create all required sheets

### Error: "API request failed (401)"

**Solution:** API token is invalid or expired
1. Log out of CodeScribe AI completely
2. Log back in to get a fresh token (valid for 7 days)
3. Open browser console: `localStorage.getItem('cs_auth_token')`
4. Copy the new token
5. Update cell B1 in Config sheet
6. Try import again

**Common Cause:** Token older than 7 days needs refresh

### Error: "API request failed (403)"

**Solution:** User account doesn't have admin privileges
1. Your account must have role: `admin`, `support`, or `super_admin`
2. Contact a super admin to grant you admin access
3. Check your role in browser console:
   ```javascript
   fetch('https://codescribeai.com/api/auth/me', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('cs_auth_token') }
   }).then(r => r.json()).then(d => console.log('Your role:', d.user.role))
   ```

### Error: "API request failed (400)"

**Solution:** Invalid date format
1. Dates must be YYYY-MM-DD format
2. Check Config sheet cells B2 and B3
3. Example: 2026-01-01 (not 01/01/2026)

### Error: "API request failed (500)"

**Solution:** Server error (contact support or check server logs)
1. Check Vercel logs for actual error message
2. Common causes:
   - Missing database column (migration needed)
   - Date range contains no data
   - Database connection issue
3. Try a different date range with known data
4. If persists, file an issue with error details

### Error: "Missing required configuration"

**Solution:** Fill all Config sheet fields
1. B1: API token (required)
2. B2: Start date (required)
3. B3: End date (required)
4. B4: Campaign source (defaults to "auto_campaign")

### Data Not Updating

**Solutions:**
1. Click **Campaign → Refresh All Data**
2. Check "Last Import" in Config sheet
3. Verify API token is valid
4. Check date range is correct

### Import Freezes

**Solutions:**
1. Close and reopen spreadsheet
2. Try import again
3. Check Apps Script execution log:
   - Open Apps Script editor
   - Click **Executions** (left sidebar)
   - Check for errors

---

## Advanced Features

### Custom Date Ranges

You can fetch data for any date range:
- Single day: startDate = endDate
- Week: 7-day range
- Month: First to last day of month
- Quarter: 3-month range
- Year: January 1 to December 31

### Multiple Campaign Sources

To track different trial sources separately:
1. Import with `campaignSource = 'auto_campaign'`
2. Save data to separate sheet
3. Change Config B4 to `'invite_code_XYZ'`
4. Import again
5. Compare results

### Financial Analysis

Add revenue calculations:
1. In **Trial Performance** sheet
2. Add column E: "Revenue"
3. Formula: `=B2*49` (assuming $49/month)
4. Calculate LTV: `=E2*12` (annual value)

### Export to CSV

1. Go to any sheet (e.g., **Overview**)
2. Click **File → Download → Comma-separated values (.csv)**
3. Use in Excel, PowerPoint, or reports

---

## API Reference

### Endpoint

```
GET https://codescribeai.com/api/admin/campaigns/export
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | YYYY-MM-DD format |
| endDate | string | Yes | YYYY-MM-DD format |
| campaignSource | string | No | Default: "auto_campaign" |

### Headers

```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

### Response Format

See `CAMPAIGN-EXPORT-VALIDATION.md` for complete response structure.

---

## Support

**Documentation:**
- Campaign Export Validation: `/docs/testing/CAMPAIGN-EXPORT-VALIDATION.md`
- Campaign Management Guide: `/docs/admin/CAMPAIGN-MANAGEMENT-GUIDE.md`

**Issues:**
If you encounter problems:
1. Check Config sheet settings
2. Verify API token is valid
3. Check Apps Script execution log
4. Review test data in validation doc

---

**Last Updated:** January 13, 2026
**Version:** 1.0.0
**Tested With:** Google Sheets, Apps Script V8 Runtime
