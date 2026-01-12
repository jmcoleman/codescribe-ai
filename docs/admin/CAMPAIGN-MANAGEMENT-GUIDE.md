# Campaign Management Guide

## Overview

CodeScribe's Campaign system allows admins to automatically grant Pro or Team tier trials to all new signups during promotional periods. Campaigns are fully managed through the Admin UI with no code changes required.

**Use Cases:**
- Product launch promotions
- Seasonal marketing campaigns
- User acquisition initiatives
- Beta testing periods
- Feedback collection drives

---

## Prerequisites

- Admin account access
- Access to `/admin/campaigns` page
- Understanding of your tier structure (Free/Pro/Team)

---

## Creating a Campaign

### Step 1: Navigate to Campaigns

1. Log into your admin account
2. Go to `/admin` dashboard
3. Click **"Campaigns"** in the admin menu
4. Or navigate directly to `/admin/campaigns`

### Step 2: Click "New Campaign"

Click the **"+ New Campaign"** button in the top-right corner.

### Step 3: Configure Campaign Settings

Fill in the campaign form:

#### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Campaign Name** | Internal name for tracking | "January 2026 Pro Trial" |
| **Trial Tier** | Tier to grant (Pro or Team) | Pro |
| **Trial Days** | Duration of trial access | 14 (or 7, 21, 30, etc.) |
| **Start Date** | When campaign begins | 2026-01-10 |

#### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Description** | Internal notes/context | "All new signups get Pro access through January 2026" |
| **End Date** | When campaign auto-expires | 2026-01-31 |
| **Activate immediately** | Check to make campaign active now | ✓ |

### Step 4: Save and Activate

1. Click **"Create Campaign"**
2. If "Activate immediately" was checked, the campaign starts instantly
3. A green banner confirms: "Campaign Active - All new signups receive a [tier] trial"

---

## What Happens Automatically

When a campaign is active:

✅ **Auto-granting:** Every new signup (email or OAuth) automatically receives the configured trial
✅ **Attribution tracking:** All trials are tagged with `source: 'auto-campaign'` for analytics
✅ **Usage counting:** Campaign tracks signup count and conversion metrics
✅ **Auto-expiration:** Campaign automatically becomes inactive after the end date (if set)
✅ **Single active limit:** System ensures only one campaign can be active at a time

**Important:** Campaigns only affect NEW signups. Existing users are not affected.

---

## Managing Active Campaigns

### Viewing Campaign Status

The Campaigns page displays:

| Column | Information |
|--------|-------------|
| **Campaign** | Name and description |
| **Status** | Active / Scheduled / Ended / Inactive |
| **Trial** | Tier and duration (e.g., "Pro (14 days)") |
| **Dates** | Start and end dates |
| **Signups** | Total signups and conversions |

### Status Badge Meanings

| Badge | Meaning |
|-------|---------|
| 🟢 **Active** | Campaign is running, granting trials to new signups |
| 🔵 **Scheduled** | Campaign starts in the future (not yet active) |
| 🟡 **Ended** | Campaign end date has passed (no longer granting trials) |
| ⚫ **Inactive** | Campaign manually deactivated |

### Quick Actions

Each campaign has action buttons:

- **⏸️ Pause** - Deactivate the campaign (stops granting trials)
- **▶️ Play** - Reactivate the campaign
- **✏️ Edit** - Modify campaign settings
- **🗑️ Delete** - Remove campaign (only available if signups_count = 0)

---

## Common Use Cases

### Example 1: Month-Long Promotion
**Goal:** Grant Pro access to all January signups

```
Name: "January 2026 Pro Promotion"
Description: "New Year promotion - gather feedback from Pro users"
Trial Tier: Pro
Trial Days: 30
Start Date: 2026-01-01
End Date: 2026-01-31
Activate immediately: ✓
```

**Result:** Every signup from Jan 1-31 gets 30 days of Pro access

### Example 2: Product Launch Week
**Goal:** Give Team access for 7 days during launch week

```
Name: "Product Launch Week"
Description: "Launch campaign for new Team features"
Trial Tier: Team
Trial Days: 7
Start Date: 2026-02-15
End Date: 2026-02-22
Activate immediately: ✓
```

**Result:** Every signup during Feb 15-22 gets 7 days of Team access

### Example 3: Scheduled Future Campaign
**Goal:** Prepare campaign for next month, activate later

```
Name: "Q2 Growth Campaign"
Description: "Scheduled for April 1 start"
Trial Tier: Pro
Trial Days: 14
Start Date: 2026-04-01
End Date: 2026-04-30
Activate immediately: ✗ (leave unchecked)
```

**Result:** Campaign shows as "Scheduled" until April 1, then auto-activates

---

## Monitoring Campaign Performance

### Real-Time Metrics

Track these metrics in the Campaigns table:

1. **Signups Count** - Total users who signed up during campaign
2. **Conversions Count** - How many trial users converted to paid subscriptions
3. **Conversion Rate** - Calculate: (conversions / signups) × 100%

**Enhanced Metrics (v3.3.9):**

Use the Campaign Export button to get additional metrics:

4. **Email Verification Rate** - % of signups who verified email
5. **Time to Verify** - Average hours/days from signup to verification
6. **Activation Rate** - % who completed first generation
7. **Time to First Value** - Average hours from signup to first doc
8. **Campaign Lift** - Campaign conversion vs individual trial conversion
9. **Trial Source Distribution** - Campaign trials vs organic trials %

### Detailed Analytics

**Automated Event Tracking (v3.3.9):**

CodeScribe automatically tracks key campaign milestones:

1. **Email Verification** (`email_verified`)
   - When: User clicks verification link
   - Tracks: `days_to_verify` from signup
   - Use: Measure engagement quality, filter spam

2. **First Generation** (`first_generation`)
   - When: User completes first documentation
   - Tracks: `hours_since_signup`, `doc_type`, `origin`
   - Use: Activation rate, time-to-value

3. **Trial Attribution** (`trial` with `source: 'auto-campaign'`)
   - Automatically tags all campaign trials
   - Enables campaign vs organic comparison
   - Tracks conversion lift

**View in Dashboard:**

1. Navigate to `/admin/analytics` → **Business** tab
2. See real-time conversion funnel with trial breakdown
3. Filter by date range to match campaign period
4. Export comprehensive metrics with one click

**User Journey Tracking:**
```
signup → email_verified → first_generation → trial (auto-campaign) → conversion
```

### Export Campaign Data

**New in v3.3.9:** Automated campaign metrics export with trial breakdown!

To analyze campaign performance:

1. Navigate to `/admin/analytics` → **Business** tab
2. Scroll to the **"Campaign Metrics Export"** section
3. Select date range (auto-filled with current dashboard dates)
4. Click **"Export Campaign Metrics"** button
5. Download JSON file with comprehensive metrics

**What's Included in Export:**

✅ **Trial Breakdown:**
- Campaign trials (auto_campaign source) - independently tracked
- Individual trials (invite codes, admin grants, self-serve) - separately tracked
- Total trials combined
- Campaign performance comparison and lift calculation

✅ **Cohort Analysis:**
- Total signups in date range
- Email verification rate and time-to-verify
- Activation rate (first generation milestone)
- Trial conversion rates

✅ **Daily Metrics:**
- Day-by-day signup breakdown
- Verification tracking
- Weekly aggregations ready

✅ **Spreadsheet-Ready Format:**
- All metrics formatted for easy import to Excel/Sheets
- ROI calculations included
- Conversion funnel tracking

**Key Metrics Automatically Tracked:**
- `email_verified` - Measures user engagement and prevents spam signups
- `first_generation` - Tracks activation rate and time-to-value
- Trial source attribution - Separates campaign vs organic trials
- Conversion lift - Shows campaign performance vs baseline

---

## Best Practices

### Campaign Duration

| Duration | Best For |
|----------|----------|
| 7 days | Quick product launch, limited-time offers |
| 14 days | Standard trial period, balanced evaluation time |
| 21-30 days | Major campaigns, comprehensive feature testing |
| 60-90 days | Beta programs, long-term feedback collection |

### Timing Strategies

- **Start campaigns on Mondays** - Capture full business week signups
- **Avoid month-end starts** - Users may forget trial start date
- **Set clear end dates** - Prevents indefinite campaigns
- **Schedule ahead** - Prepare campaigns before marketing push

### Communication

- **Welcome email** - Inform users they received campaign trial
- **Feature highlight** - Show what Pro/Team features are available
- **Expiration reminder** - Send reminder before trial ends
- **Conversion prompt** - Offer upgrade discount before expiration

### Campaign Naming Conventions

Use descriptive names for easy tracking:

- `[Month] [Year] [Tier] [Purpose]` - "January 2026 Pro Promotion"
- `[Event] [Tier] Launch` - "Product Hunt Pro Launch"
- `Q[X] [Year] [Strategy]` - "Q2 2026 Growth Campaign"

---

## Troubleshooting

### Campaign Not Granting Trials

**Symptoms:** New signups not receiving trials

**Check:**
1. ✅ Campaign status is "Active" (green badge)
2. ✅ Current date is between Start Date and End Date
3. ✅ Only ONE campaign is active (system enforces this)
4. ✅ User is NEW signup (existing users not affected)
5. ✅ Check server logs for `[Campaign] Auto-granted` messages

**Resolution:**
- Click "Refresh" button to reload campaign data
- Verify campaign dates are correct
- Check Admin Analytics for `trial_granted` events

### Multiple Campaigns Active

**Symptoms:** Error when activating second campaign

**Cause:** System allows only one active campaign at a time

**Resolution:**
1. Deactivate currently active campaign first (click Pause)
2. Then activate new campaign (click Play)
3. Or set new campaign to start AFTER current campaign ends

### Campaign Ended Early

**Symptoms:** Campaign shows "Ended" status before end date

**Check:**
1. Verify end date is correct (may have been misconfigured)
2. Check system timezone settings (dates stored as UTC)
3. Review recent edits to campaign

**Resolution:**
- Edit campaign and update end date
- Reactivate campaign if needed

### Signup Count Not Increasing

**Symptoms:** Signups column shows 0 despite new signups

**Possible Causes:**
- Campaign not active during signup
- Users signing up before start date or after end date
- Database tracking issue

**Resolution:**
1. Verify campaign is "Active" during signup period
2. Check Admin Analytics for `user_signup` events during campaign dates
3. Cross-reference with `trial_granted` events (source: auto-campaign)
4. Check server logs for campaign attribution

---

## Campaign Lifecycle

### States and Transitions

```
Created → Scheduled → Active → Ended
          ↓           ↓        ↓
          Inactive ←──┴────────┘
```

1. **Created** - Campaign saved but not activated
2. **Scheduled** - Campaign set to start in future
3. **Active** - Campaign running, granting trials
4. **Ended** - End date passed, no longer granting trials
5. **Inactive** - Manually paused by admin

### Manual Controls

| Action | Effect | Reversible? |
|--------|--------|-------------|
| Activate | Makes campaign active, starts granting trials | Yes (can pause) |
| Deactivate | Stops granting trials to new signups | Yes (can reactivate) |
| Edit | Updates campaign settings | Yes (can edit again) |
| Delete | Removes campaign entirely | No (only if 0 signups) |

---

## Technical Details

### Database Schema

Campaigns are stored in the `campaigns` table:

```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  trial_tier VARCHAR(50) DEFAULT 'pro',
  trial_days INTEGER DEFAULT 14,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  signups_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Attribution Tracking

Trials granted via campaigns are tracked in `user_trials` table:

- `source: 'auto-campaign'` - Auto-granted during campaign
- `source: 'invite_code'` - Granted via invite code
- `source: 'admin-granted'` - Manually granted by admin

This enables campaign-specific analytics and ROI tracking.

### API Endpoints

Campaign management uses these authenticated admin routes:

- `GET /api/admin/campaigns` - List all campaigns
- `POST /api/admin/campaigns` - Create new campaign
- `PUT /api/admin/campaigns/:id` - Update campaign
- `POST /api/admin/campaigns/:id/toggle` - Activate/deactivate
- `DELETE /api/admin/campaigns/:id` - Delete campaign

---

## Security Considerations

- **Admin-only access** - Campaign routes require admin role
- **Single active campaign** - Prevents abuse/conflicts
- **Attribution tracking** - Audit trail for all granted trials
- **Signup verification** - Only applies to verified new users
- **Rate limiting** - Standard API rate limits apply

---

## Related Documentation

- [Trial System](../features/TRIAL-SYSTEM.md) - Overall trial system architecture
- [Admin Analytics](../architecture/WORKFLOW-OUTCOME-METRICS-PLAN.md) - Campaign performance tracking
- [Admin Dashboard](./ADMIN-USAGE-STATS.md) - General admin features

---

## Quick Reference

### Campaign Creation Checklist

- [ ] Define campaign goal and target audience
- [ ] Choose trial tier (Pro or Team)
- [ ] Set trial duration (7-90 days)
- [ ] Select start and end dates
- [ ] Write descriptive campaign name
- [ ] Add internal notes in description
- [ ] Decide activation timing (immediate or scheduled)
- [ ] Create campaign in admin UI
- [ ] Verify campaign shows as Active
- [ ] Test with new signup account
- [ ] Monitor signup count increases
- [ ] Track conversion metrics

### Campaign End Checklist

- [ ] Review final signup count
- [ ] Calculate conversion rate
- [ ] **Export campaign metrics** via Admin Analytics → Business → Campaign Export button
- [ ] Review trial breakdown (campaign vs individual trials)
- [ ] Calculate campaign lift and ROI
- [ ] Check email verification and activation rates
- [ ] Analyze time-to-value metrics
- [ ] Document learnings for future campaigns
- [ ] Deactivate campaign (if not auto-expired)
- [ ] Archive exported JSON data

---

---

## Campaign Export API (New in v3.3.9)

### Automated Metrics Endpoint

**Endpoint:** `GET /api/admin/campaigns/export`

**Query Parameters:**
- `startDate` (required) - Campaign start date (YYYY-MM-DD)
- `endDate` (required) - Campaign end date (YYYY-MM-DD)
- `campaignSource` (optional) - Source filter (default: 'auto_campaign')

**Response Includes:**
- Trial breakdown (campaign vs individual trials)
- Conversion rates and campaign lift
- Email verification metrics
- Activation metrics (first generation)
- Cohort summary (signups, verified, activated)
- Daily breakdown for weekly aggregations
- Spreadsheet-ready format

**Access via UI:**
- Admin Analytics → Business tab → "Campaign Metrics Export" section
- Pre-filled with current dashboard date range
- One-click JSON download

### Example Export Data Structure

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
    "verified_users": 95,
    "activated_users": 62,

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
        "by_source": [
          {"source": "invite_code", "trials_started": 8, "conversions": 2},
          {"source": "admin_grant", "trials_started": 2, "conversions": 0},
          {"source": "self_serve", "trials_started": 2, "conversions": 0}
        ]
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
        "campaign_lift": "+20%",
        "campaign_performs_better": true
      }
    }
  }
}
```

---

**Last Updated:** January 11, 2026 (v3.3.9)
**Maintained By:** Admin Team
**New in v3.3.9:** Automated campaign export, trial breakdown, milestone tracking
**Questions?** Contact support or file an issue
