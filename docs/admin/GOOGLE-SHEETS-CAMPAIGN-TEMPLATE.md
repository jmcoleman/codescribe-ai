# Google Sheets Campaign Export Template

**Purpose:** Import and visualize CodeScribe AI campaign performance data
**Data Source:** `GET /api/admin/campaigns/export`
**Last Updated:** January 13, 2026

**Base Template:** The master Google Sheet template is stored at:
https://docs.google.com/spreadsheets/d/1NfEyJYTy9QReSeS0CWUUwHUZUQ8LzBBWhVs9IwdqRtk/edit?usp=drive_link

---

## Quick Setup Guide

### Step 1: Create New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create new spreadsheet
3. Name it "CodeScribe Campaign Analytics"

### Step 2: Set Up Sheets

Create these 8 sheets (tabs) in your spreadsheet:

1. **Config** - API settings and import controls
2. **Overview** - Campaign summary and key metrics
3. **Trial Performance** - Campaign vs individual trial comparison
4. **Cohort Funnel** - Signup to activation conversion funnel (all users)
5. **Trial Funnel** - Trial-to-conversion funnel (trial users only)
6. **Usage Segments** - User engagement breakdown
7. **Daily Metrics** - Day-by-day signup/verification data by origin type
8. **User List** - Complete user roster with origin type and activity details

### Step 3: Install Apps Script

1. Click **Extensions → Apps Script**
2. Delete default `myFunction()` code
3. Copy the script from Section 3 below
4. Click **Save** (disk icon)
5. Name project "Campaign Import"

### Step 4: Configure API Access

1. Go to **Config** sheet
2. Enter API Base URL in cell B1:
   - Production: `https://codescribeai.com/api` (default)
   - Dev: `http://localhost:3000/api`
3. Enter your API token in cell B2
4. Enter campaign dates in B3 and B4
5. Enter campaign source in B5 (usually "auto_campaign")

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
| API Base URL | https://codescribeai.com/api |
| API Token | [YOUR_TOKEN_HERE] |
| Start Date | 2026-01-01 |
| End Date | 2026-01-31 |
| Campaign Source | auto_campaign |
| Last Import | [Auto-filled] |
| Import Status | [Auto-filled] |

**Named Ranges to Create:**
- `ApiBaseUrl` → Config!B1
- `ApiToken` → Config!B2
- `StartDate` → Config!B3
- `EndDate` → Config!B4
- `CampaignSource` → Config!B5

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

**Purpose:** Day-by-day signup and verification trends by origin type

| A | B | C | D | E |
|---|---|---|---|---|
| **Date** | **Origin Type** | **Signups** | **Verified** | **Verification Rate** |
| 2026-01-01 | Direct | 5 | 4 | =D2/C2 |
| 2026-01-01 | Individual Trial | 3 | 3 | =D3/C3 |
| 2026-01-01 | Winter Launch Campaign | 10 | 9 | =D4/C4 |
| 2026-01-02 | Direct | 8 | 7 | =D5/C5 |
| ... | ... | ... | ... | ... |

**Origin Types:**
- **Direct:** Users who signed up without starting a trial
- **Individual Trial:** Users who started a self-serve trial (not from a campaign)
- **[Campaign Name]:** Users who started a trial from a specific campaign

**Analysis Tips:**
- Filter by Origin Type to see trends for specific sources
- Create pivot table to compare origin types
- Use SUMIF to calculate totals per origin type

**Chart Recommendations:**
1. Stacked column chart: Daily signups by origin type (A:D)
2. Line chart: Verification rate by origin type (filter data first)
3. Pie chart: Total signups by origin type (aggregate data)

### Sheet 7: User List

**Purpose:** Complete roster of all users in the cohort with detailed activity

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Email** | **First Name** | **Last Name** | **Current Tier** | **Origin Type** | **Signup Date** | **Email Verified** | **Email Verified At** | **Trial Tier** | **Trial Status** | **Trial Started** | **Trial Converted** | **First Generation** | **Usage Count** |
| user1@example.com | John | Doe | pro | Winter Launch Campaign | 2026-01-01 | Yes | 2026-01-01 | pro | converted | 2026-01-01 | 2026-01-05 | 2026-01-02 | 25 |
| user2@example.com | Jane | Smith | free | Individual Trial | 2026-01-02 | Yes | 2026-01-02 | team | active | 2026-01-02 | - | 2026-01-03 | 12 |
| user3@example.com | Bob | Johnson | free | Direct | 2026-01-03 | No | - | - | - | - | - | - | 0 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Column Descriptions:**
- **Email:** User's email address
- **First/Last Name:** User's name (if provided)
- **Current Tier:** Current subscription tier (free, pro, team, business)
- **Origin Type:** How they signed up (Direct, Individual Trial, or Campaign Name)
- **Signup Date:** When they created their account
- **Email Verified:** Whether they verified their email (Yes/No)
- **Email Verified At:** When they verified (if applicable)
- **Trial Tier:** Trial tier if they started a trial (pro, team, or -)
- **Trial Status:** Trial status (active, expired, converted, or -)
- **Trial Started:** When trial started (if applicable)
- **Trial Converted:** When they converted to paid (if applicable)
- **First Generation:** When they first generated documentation (if applicable)
- **Usage Count:** Total documentation generations this period

**Analysis Tips:**
- **Filter by Origin Type** to get email lists for specific campaigns
- **Sort by Usage Count** to find power users or at-risk users
- **Filter by Email Verified = No** to identify verification drop-offs
- **Filter by Trial Status = active** to find users currently in trial
- **Export to CSV** for email marketing or user outreach

**Use Cases:**
1. **Campaign Attribution:** Filter by campaign name to get all users from that campaign
2. **Email Lists:** Export filtered user emails for targeted email campaigns
3. **Engagement Analysis:** Sort by usage count to identify highly engaged users
4. **Conversion Analysis:** Filter converted trials to analyze successful conversion paths
5. **Drop-off Investigation:** Find users who verified but never generated (activation gap)

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
  ENDPOINTS: {
    EXPORT: '/admin/campaigns/export'
  },
  DEFAULT_API_BASE_URL: 'https://codescribeai.com/api'
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
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get config
    const config = getConfig();

    // Validate config
    if (!config.apiToken || !config.startDate || !config.endDate) {
      throw new Error('Missing required configuration. Please fill Config sheet.');
    }

    // Step 1: Fetch data from API
    ss.toast('Fetching campaign data from API...', '⏳ Step 1/7', 5);
    updateImportStatus(new Date().toLocaleString(), '⏳ Fetching data from API...');
    const data = fetchCampaignData(config);

    // Step 2: Populate Overview
    ss.toast('Populating Overview sheet...', '📊 Step 2/7', 3);
    updateImportStatus(new Date().toLocaleString(), '📊 Populating Overview sheet...');
    populateOverview(data);

    // Step 3: Populate Trial Performance
    ss.toast('Populating Trial Performance sheet...', '📊 Step 3/7', 3);
    updateImportStatus(new Date().toLocaleString(), '📊 Populating Trial Performance sheet...');
    populateTrialPerformance(data);

    // Step 4: Populate Cohort Funnel
    ss.toast('Populating Cohort Funnel sheet...', '📊 Step 4/7', 3);
    updateImportStatus(new Date().toLocaleString(), '📊 Populating Cohort Funnel sheet...');
    populateCohortFunnel(data);

    // Step 5: Populate Trial Funnel
    ss.toast('Populating Trial Funnel sheet...', '📊 Step 5/7', 3);
    updateImportStatus(new Date().toLocaleString(), '📊 Populating Trial Funnel sheet...');
    populateTrialFunnel(data);

    // Step 6: Populate Usage Segments
    ss.toast('Populating Usage Segments sheet...', '📊 Step 6/7', 3);
    updateImportStatus(new Date().toLocaleString(), '📊 Populating Usage Segments sheet...');
    populateUsageSegments(data);

    // Step 7: Populate Daily Metrics
    ss.toast('Populating Daily Metrics sheet...', '📊 Step 7/8', 3);
    updateImportStatus(new Date().toLocaleString(), '📊 Populating Daily Metrics sheet...');
    populateDailyMetrics(data);

    // Step 8: Populate User List
    ss.toast('Populating User List sheet...', '📊 Step 8/8', 3);
    updateImportStatus(new Date().toLocaleString(), '📊 Populating User List sheet...');
    populateUserList(data);

    // Final status
    const timestamp = new Date().toLocaleString();
    updateImportStatus(timestamp, '✅ Success');
    ss.toast('Campaign data imported successfully!', '✅ Import Complete', 5);

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
    apiBaseUrl: sheet.getRange('B1').getValue() || CONFIG.DEFAULT_API_BASE_URL,
    apiToken: sheet.getRange('B2').getValue(),
    startDate: formatDate(sheet.getRange('B3').getValue()),
    endDate: formatDate(sheet.getRange('B4').getValue()),
    campaignSource: sheet.getRange('B5').getValue() || 'auto_campaign'
  };
}

/**
 * Update import status in Config sheet
 */
function updateImportStatus(timestamp, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (sheet) {
    sheet.getRange('B6').setValue(timestamp);
    sheet.getRange('B7').setValue(status);
  }
}

/**
 * Fetch campaign data from API
 */
function fetchCampaignData(config) {
  const url = `${config.apiBaseUrl}${CONFIG.ENDPOINTS.EXPORT}?startDate=${config.startDate}&endDate=${config.endDate}&campaignSource=${config.campaignSource}`;

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

  // Unfreeze columns (in case they were frozen previously)
  sheet.setFrozenColumns(0);

  // Campaign info
  sheet.getRange('A1').setValue('CAMPAIGN INFORMATION').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A2:B2').setValues([['Period', `${data.campaign.startDate} to ${data.campaign.endDate}`]]);

  const campaignCount = data.campaign.count || 0;
  const campaigns = data.campaign.campaigns || [];

  if (campaignCount === 0) {
    // No campaigns active during period
    sheet.getRange('A3:B3').setValues([['Campaign Status', 'No Active Campaign']]);
    sheet.getRange('A4:B4').setValues([['Note', 'All trials are individual/self-serve']]);
  } else if (campaignCount === 1) {
    // Single campaign - show details
    const campaign = campaigns[0];
    sheet.getRange('A3:B3').setValues([['Campaign Name', campaign.name]]);
    sheet.getRange('A4:B4').setValues([['Trial Tier', campaign.trialTier]]);
    sheet.getRange('A5:B5').setValues([['Trial Duration', campaign.trialDays + ' days']]);
    sheet.getRange('A6:B6').setValues([['Status', campaign.isActive ? 'Active' : 'Inactive']]);
  } else {
    // Multiple campaigns - show count and note
    sheet.getRange('A3:B3').setValues([['Campaign Status', `Multiple Campaigns (${campaignCount})`]]);
    sheet.getRange('A4:B4').setValues([['Note', 'Use exact campaign dates for specific analysis']]);
  }

  // Campaigns Active During Period section
  let nextRow = campaignCount === 1 ? 8 : 6;
  sheet.getRange(`A${nextRow}`).setValue('CAMPAIGNS ACTIVE DURING PERIOD').setFontWeight('bold').setFontSize(12);
  nextRow++;

  if (campaigns.length > 0) {
    sheet.getRange(`A${nextRow}:E${nextRow}`).setValues([['Campaign Name', 'Trial Tier', 'Days', 'Start Date', 'End Date']])
      .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');
    nextRow++;

    const campaignRows = campaigns.map(c => [
      c.name,
      c.trialTier,
      c.trialDays,
      new Date(c.startsAt).toISOString().split('T')[0],
      c.endsAt ? new Date(c.endsAt).toISOString().split('T')[0] : 'Ongoing'
    ]);

    sheet.getRange(nextRow, 1, campaignRows.length, 5).setValues(campaignRows);
    nextRow += campaignRows.length + 1;
  } else {
    sheet.getRange(`A${nextRow}`).setValue('No campaigns during this period').setFontStyle('italic');
    nextRow += 2;
  }

  // Key metrics
  sheet.getRange(`A${nextRow}`).setValue('KEY METRICS').setFontWeight('bold').setFontSize(12);
  nextRow++;
  sheet.getRange(nextRow, 1, 1, 4).setValues([['Metric', 'Value', 'Metric', 'Value']])
    .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');
  nextRow++;
  sheet.getRange(nextRow, 1, 3, 4).setValues([
    ['Total Signups', data.summary.total_signups, 'Verification Rate', data.spreadsheet_ready.cohort_summary.verification_rate + '%'],
    ['Email Verified', data.summary.verified_users, 'Activation Rate', data.spreadsheet_ready.cohort_summary.activation_rate + '%'],
    ['First Generation', data.summary.activated_users, '', '']
  ]);
  nextRow += 4;

  // Trial performance
  sheet.getRange(`A${nextRow}`).setValue('TRIAL PERFORMANCE').setFontWeight('bold').setFontSize(12);
  nextRow++;
  sheet.getRange(nextRow, 1, 1, 4).setValues([['Campaign Trials', '', 'Individual Trials', '']])
    .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');
  nextRow++;
  sheet.getRange(nextRow, 1, 3, 4).setValues([
    ['Started', data.spreadsheet_ready.trial_comparison.campaign_trials.started, 'Started', data.spreadsheet_ready.trial_comparison.individual_trials.started],
    ['Conversions', data.spreadsheet_ready.trial_comparison.campaign_trials.converted, 'Conversions', data.spreadsheet_ready.trial_comparison.individual_trials.converted],
    ['Conv. Rate', data.spreadsheet_ready.trial_comparison.campaign_trials.conversion_rate + '%', 'Conv. Rate', data.spreadsheet_ready.trial_comparison.individual_trials.conversion_rate + '%']
  ]);
  nextRow += 3;
  sheet.getRange(nextRow, 1, 1, 2).setValues([['Campaign Lift', (data.spreadsheet_ready.trial_comparison.campaign_lift || 'N/A') + '%']]);
  nextRow += 2;

  // Usage distribution
  sheet.getRange(`A${nextRow}`).setValue('USAGE DISTRIBUTION').setFontWeight('bold').setFontSize(12);
  nextRow++;
  sheet.getRange(nextRow, 1, 1, 3).setValues([['Segment', 'Users', 'Percentage']])
    .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');
  nextRow++;

  const segments = data.extended_metrics.usage_segments;
  if (segments && segments.length > 0) {
    const segmentData = segments.map(s => [s.segment, s.users, s.percentage + '%']);
    sheet.getRange(nextRow, 1, segmentData.length, 3).setValues(segmentData);
  }

  // Format
  sheet.getRange('A1:E50').setFontFamily('Arial').setFontSize(10);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 120);
}

/**
 * Populate Trial Performance sheet
 */
function populateTrialPerformance(data) {
  const sheet = getOrCreateSheet('Trial Performance');
  sheet.clear();

  // Unfreeze columns (in case they were frozen previously)
  sheet.setFrozenColumns(0);

  const tc = data.spreadsheet_ready.trial_comparison;

  // Headers
  sheet.getRange('A1:D1').setValues([['Metric', 'Campaign Trials', 'Individual Trials', 'Total']])
    .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');

  // Data
  sheet.getRange('A2:D5').setValues([
    ['Trials Started', tc.campaign_trials.started, tc.individual_trials.started, tc.total_trials.started],
    ['Conversions', tc.campaign_trials.converted, tc.individual_trials.converted, tc.total_trials.converted],
    ['Conversion Rate', tc.campaign_trials.conversion_rate / 100, tc.individual_trials.conversion_rate / 100, tc.total_trials.conversion_rate / 100],
    ['Campaign Lift', tc.campaign_lift ? parseFloat(tc.campaign_lift) / 100 : 'N/A', '', '']
  ]);

  // Add note below data
  sheet.getRange('A7:D7').merge().setValue('Note: Comparison of trial users only - campaign trials vs. individual/self-serve trials started during the period.')
    .setFontStyle('italic').setFontSize(9).setWrap(true);

  // Format percentages
  sheet.getRange('B4:D4').setNumberFormat('0.00%');
  sheet.getRange('B5').setNumberFormat('0.00%');

  // Format
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidths(2, 3, 140);

  // Freeze header row only
  sheet.setFrozenRows(1);
}

/**
 * Populate Cohort Funnel sheet
 */
function populateCohortFunnel(data) {
  const sheet = getOrCreateSheet('Cohort Funnel');
  sheet.clear();

  // Unfreeze columns before merging (in case they were frozen previously)
  sheet.setFrozenColumns(0);

  const cohort = data.spreadsheet_ready.cohort_summary;

  // Headers
  sheet.getRange('A1:D1').setValues([['Stage', 'Users', 'Conversion Rate', '% of Signups']])
    .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');

  // Data
  const totalSignups = cohort.signups;
  const verified = cohort.verified;
  const activated = cohort.activated;

  // Safe division to avoid #NUM! errors when no data
  const verifiedRate = totalSignups > 0 ? verified / totalSignups : 0;
  const activatedFromVerified = verified > 0 ? activated / verified : 0;
  const activatedFromSignups = totalSignups > 0 ? activated / totalSignups : 0;

  sheet.getRange('A2:D4').setValues([
    ['Signups', totalSignups, totalSignups > 0 ? 1.0 : 0, totalSignups > 0 ? 1.0 : 0],
    ['Email Verified', verified, verifiedRate, verifiedRate],
    ['First Generation', activated, activatedFromVerified, activatedFromSignups]
  ]);

  // Add note below data
  sheet.getRange('A6:D6').merge().setValue('Note: Full acquisition funnel showing all users who signed up during the period, regardless of trial status.')
    .setFontStyle('italic').setFontSize(9).setWrap(true);

  // Format percentages
  sheet.getRange('C2:D4').setNumberFormat('0.00%');

  // Format
  sheet.setColumnWidths(1, 4, 150);

  // Freeze header row only (can't freeze columns when merging across them)
  sheet.setFrozenRows(1);
}

/**
 * Populate Trial Funnel sheet
 */
function populateTrialFunnel(data) {
  const sheet = getOrCreateSheet('Trial Funnel');
  sheet.clear();

  // Unfreeze columns before merging (in case they were frozen previously)
  sheet.setFrozenColumns(0);

  const trial = data.spreadsheet_ready.trial_funnel_summary;

  // Headers
  sheet.getRange('A1:D1').setValues([['Stage', 'Users', 'Conversion Rate', '% of Trials Started']])
    .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');

  // Data
  const trialsStarted = trial.trials_started;
  const trialsConverted = trial.trials_converted;

  // Safe division to avoid #NUM! errors when no data
  const conversionRate = trialsStarted > 0 ? trialsConverted / trialsStarted : 0;

  sheet.getRange('A2:D3').setValues([
    ['Trials Started', trialsStarted, trialsStarted > 0 ? 1.0 : 0, trialsStarted > 0 ? 1.0 : 0],
    ['Converted to Paid', trialsConverted, conversionRate, conversionRate]
  ]);

  // Add note below data
  sheet.getRange('A5:D5').merge().setValue('Note: Trial user funnel showing only users who started a trial during the period (campaign or individual).')
    .setFontStyle('italic').setFontSize(9).setWrap(true);

  // Format percentages
  sheet.getRange('C2:D3').setNumberFormat('0.00%');

  // Format
  sheet.setColumnWidths(1, 4, 150);

  // Freeze header row only (can't freeze columns when merging across them)
  sheet.setFrozenRows(1);
}

/**
 * Populate Usage Segments sheet
 */
function populateUsageSegments(data) {
  const sheet = getOrCreateSheet('Usage Segments');
  sheet.clear();

  // Unfreeze columns before merging (in case they were frozen previously)
  sheet.setFrozenColumns(0);

  // Headers
  sheet.getRange('A1:C1').setValues([['Segment', 'Users', 'Percentage']])
    .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');

  // Data
  const segments = data.extended_metrics.usage_segments;

  if (segments && segments.length > 0) {
    const segmentData = segments.map(s => [s.segment, s.users, s.percentage / 100]);

    sheet.getRange(2, 1, segmentData.length, 3).setValues(segmentData);

    // Format percentages
    sheet.getRange(2, 3, segmentData.length, 1).setNumberFormat('0.00%');

    // Totals
    const totalRow = segmentData.length + 2;
    sheet.getRange(totalRow, 1, 1, 3).setValues([
      ['TOTAL', `=SUM(B2:B${totalRow - 1})`, `=SUM(C2:C${totalRow - 1})`]
    ]).setFontWeight('bold').setBackground('#f4f4f4');

    // Add note below totals
    const noteRow = totalRow + 2;
    sheet.getRange(`A${noteRow}:C${noteRow}`).merge().setValue('Note: Usage distribution for all users who signed up during the period (full acquisition cohort).')
      .setFontStyle('italic').setFontSize(9).setWrap(true);
  }

  // Format
  sheet.setColumnWidths(1, 3, 150);

  // Freeze header row only (can't freeze columns when merging across them)
  sheet.setFrozenRows(1);
}

/**
 * Populate Daily Metrics sheet
 */
function populateDailyMetrics(data) {
  const sheet = getOrCreateSheet('Daily Metrics');
  sheet.clear();

  // Unfreeze columns (in case they were frozen previously)
  sheet.setFrozenColumns(0);

  // Headers
  sheet.getRange('A1:E1').setValues([['Date', 'Origin Type', 'Signups', 'Verified', 'Verification Rate']])
    .setFontWeight('bold').setBackground('#6366f1').setFontColor('white');

  // Data
  if (data.daily && data.daily.length > 0) {
    const dailyData = data.daily.map(d => [
      new Date(d.date),  // Convert string to Date object
      d.origin_type,
      d.signups,
      d.verified,
      d.signups > 0 ? d.verified / d.signups : 0
    ]);

    sheet.getRange(2, 1, dailyData.length, 5).setValues(dailyData);

    // Format dates as YYYY-MM-DD
    sheet.getRange(2, 1, dailyData.length, 1).setNumberFormat('yyyy-mm-dd');

    // Format percentages
    sheet.getRange(2, 5, dailyData.length, 1).setNumberFormat('0.00%');
  }

  // Format
  sheet.setColumnWidth(1, 120);  // Date
  sheet.setColumnWidth(2, 200);  // Origin Type
  sheet.setColumnWidths(3, 3, 100);  // Signups, Verified, Verification Rate

  // Freeze header row only
  sheet.setFrozenRows(1);
}

/**
 * Populate User List sheet
 */
function populateUserList(data) {
  const sheet = getOrCreateSheet('User List');
  sheet.clear();

  // Unfreeze columns (in case they were frozen previously)
  sheet.setFrozenColumns(0);

  // Headers
  sheet.getRange('A1:N1').setValues([[
    'Email', 'First Name', 'Last Name', 'Current Tier', 'Origin Type',
    'Signup Date', 'Email Verified', 'Email Verified At',
    'Trial Tier', 'Trial Status', 'Trial Started', 'Trial Converted',
    'First Generation', 'Usage Count'
  ]]).setFontWeight('bold').setBackground('#6366f1').setFontColor('white');

  // Data
  if (data.user_list && data.user_list.length > 0) {
    const userData = data.user_list.map(u => [
      u.email,
      u.first_name || '',
      u.last_name || '',
      u.tier || 'free',
      u.origin_type,
      u.signup_date ? new Date(u.signup_date).toISOString().split('T')[0] : '',
      u.email_verified ? 'Yes' : 'No',
      u.email_verified_at ? new Date(u.email_verified_at).toISOString().split('T')[0] : '',
      u.trial_tier || '-',
      u.trial_status || '-',
      u.trial_started_at ? new Date(u.trial_started_at).toISOString().split('T')[0] : '',
      u.trial_converted_at ? new Date(u.trial_converted_at).toISOString().split('T')[0] : '',
      u.first_generation_at ? new Date(u.first_generation_at).toISOString().split('T')[0] : '',
      u.usage_count
    ]);

    sheet.getRange(2, 1, userData.length, 14).setValues(userData);

    // Add summary row
    const summaryRow = userData.length + 3;
    sheet.getRange(`A${summaryRow}:B${summaryRow}`).setValues([['Total Users', userData.length]])
      .setFontWeight('bold');
  }

  // Format
  sheet.setColumnWidth(1, 200);  // Email
  sheet.setColumnWidths(2, 3, 120);  // First/Last Name
  sheet.setColumnWidth(4, 100);  // Current Tier
  sheet.setColumnWidth(5, 180);  // Origin Type
  sheet.setColumnWidths(6, 8, 120);  // Dates & verified columns
  sheet.setColumnWidths(9, 5, 120);  // Trial columns
  sheet.setColumnWidth(14, 100);  // Usage Count

  // Freeze header row only
  sheet.setFrozenRows(1);
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
  configSheet.getRange('A1:B7').setValues([
    ['API Base URL', 'https://codescribeai.com/api'],
    ['API Token', '[YOUR_TOKEN_HERE]'],
    ['Start Date', '2026-01-01'],
    ['End Date', '2026-01-31'],
    ['Campaign Source', 'auto_campaign'],
    ['Last Import', ''],
    ['Import Status', '']
  ]);

  configSheet.getRange('A1:A7').setFontWeight('bold');
  configSheet.setColumnWidth(1, 150);
  configSheet.setColumnWidth(2, 300);

  // Create empty sheets
  const sheets = ['Overview', 'Trial Performance', 'Cohort Funnel', 'Trial Funnel', 'Usage Segments', 'Daily Metrics', 'User List'];
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
    const sheets = ['Overview', 'Trial Performance', 'Cohort Funnel', 'Trial Funnel', 'Usage Segments', 'Daily Metrics', 'User List'];
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
4. Set API Base URL in cell B1:
   - Production: `https://codescribeai.com/api` (default)
   - Dev: `http://localhost:3000/api`
5. Paste your token in cell B2 (replace `[YOUR_TOKEN_HERE]`)
6. Set campaign dates in B3 and B4 (YYYY-MM-DD format)
7. Set campaign source in B5 (usually "auto_campaign")

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
2. Update **Start Date** (B3) and **End Date** (B4)
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
2. Check Config sheet cells B3 and B4
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
1. B1: API Base URL (defaults to "https://codescribeai.com/api")
2. B2: API token (required)
3. B3: Start date (required)
4. B4: End date (required)
5. B5: Campaign source (defaults to "auto_campaign")

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

### Testing with Dev Environment

**To test with local development server:**

1. Start your local server (e.g., `cd server && npm run dev`)
2. Verify server is running on `http://localhost:3000`
3. Go to **Config** sheet in Google Sheets
4. Change **API Base URL** (B1) to: `http://localhost:3000/api`
5. Get a fresh token from your local dev instance:
   - Open `http://localhost:5173` (or your local frontend URL)
   - Log in as admin
   - Open console: `localStorage.getItem('cs_auth_token')`
   - Copy token
6. Paste token in cell B2
7. Click **Campaign → Import Campaign Data**

**Note:** Dev tokens are separate from production tokens. Make sure to use the token from the same environment as your API Base URL.

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
3. Change Config B5 to `'invite_code_XYZ'`
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
