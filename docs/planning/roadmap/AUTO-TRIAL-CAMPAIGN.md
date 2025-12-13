# Auto-Trial Campaign Plan

## Overview
Automatically grant Pro tier trial access to all new signups during a promotional campaign period. This enables gathering product feedback from users with full feature access.

## Configuration

### Environment Variables
```bash
# Enable/disable auto-trial for new signups
CAMPAIGN_AUTO_TRIAL=true

# Trial duration in days (default: 14)
CAMPAIGN_TRIAL_DAYS=14

# Trial tier to grant (default: pro)
CAMPAIGN_TRIAL_TIER=pro

# Optional: Campaign end date (ISO format) - auto-disables after this date
CAMPAIGN_END_DATE=2025-02-01T00:00:00Z
```

## Implementation Steps

### 1. Update Server Environment Config
**File:** `server/src/config/environment.js` (or equivalent)

```javascript
export const campaignConfig = {
  autoTrialEnabled: process.env.CAMPAIGN_AUTO_TRIAL === 'true',
  trialDays: parseInt(process.env.CAMPAIGN_TRIAL_DAYS) || 14,
  trialTier: process.env.CAMPAIGN_TRIAL_TIER || 'pro',
  endDate: process.env.CAMPAIGN_END_DATE ? new Date(process.env.CAMPAIGN_END_DATE) : null,
};

export function isCampaignActive() {
  if (!campaignConfig.autoTrialEnabled) return false;
  if (campaignConfig.endDate && new Date() > campaignConfig.endDate) return false;
  return true;
}
```

### 2. Modify User Registration Flow
**File:** `server/src/routes/auth.js`

After successful user creation (both email signup and OAuth):

```javascript
import { isCampaignActive, campaignConfig } from '../config/environment.js';
import { grantTrial } from '../services/trialService.js'; // or wherever trial logic lives

// After user is created successfully
if (isCampaignActive()) {
  await grantTrial(
    newUser.id,
    campaignConfig.trialTier,
    campaignConfig.trialDays,
    'auto-campaign' // source for tracking
  );
  console.log(`[Campaign] Auto-granted ${campaignConfig.trialTier} trial to user ${newUser.id}`);
}
```

### 3. Add Trial Source Tracking (Optional Enhancement)
**File:** `server/src/db/migrations/XXX-add-trial-source.sql`

```sql
ALTER TABLE user_trials ADD COLUMN source VARCHAR(50) DEFAULT 'invite_code';
-- Values: 'invite_code', 'auto-campaign', 'admin-granted', 'promotion'
```

This helps track how users received their trial for analytics.

### 4. Admin Visibility
Add campaign status to admin dashboard:

**File:** `server/src/routes/admin.js`

```javascript
router.get('/campaign-status', requireAdmin, (req, res) => {
  res.json({
    active: isCampaignActive(),
    config: {
      tier: campaignConfig.trialTier,
      days: campaignConfig.trialDays,
      endDate: campaignConfig.endDate,
    }
  });
});
```

### 5. Welcome Email Update (Optional)
Modify welcome email template to mention trial access during campaign:

**File:** `server/src/services/emailService.js` (or email templates)

```javascript
if (isCampaignActive()) {
  // Use campaign welcome template that highlights Pro features
  await sendCampaignWelcomeEmail(user.email, campaignConfig.trialDays);
} else {
  await sendStandardWelcomeEmail(user.email);
}
```

## Deployment Checklist

### To Activate Campaign
1. Add environment variables to Vercel:
   - `CAMPAIGN_AUTO_TRIAL=true`
   - `CAMPAIGN_TRIAL_DAYS=14` (or desired duration)
   - `CAMPAIGN_TRIAL_TIER=pro`
   - `CAMPAIGN_END_DATE=2025-XX-XXTXX:XX:XXZ` (optional)
2. Deploy changes
3. Verify with test signup

### To Deactivate Campaign
**Option A:** Set `CAMPAIGN_AUTO_TRIAL=false` in Vercel and redeploy

**Option B:** Let `CAMPAIGN_END_DATE` pass (auto-disables)

## Existing User Coverage
For existing free users who want to participate:
- Create a public invite code (e.g., `PROFEEDBACK`) using existing invite code system
- Share via email campaign or in-app banner
- This requires no additional code changes

## Metrics to Track
- New signups during campaign period
- Trial-to-paid conversion rate
- Feature usage during trial (multi-file, batch, private repos)
- Feedback received (via feedback form or support emails)

## Rollback Plan
If issues arise:
1. Set `CAMPAIGN_AUTO_TRIAL=false` in Vercel
2. Redeploy (takes ~2 minutes)
3. New signups will no longer receive auto-trial
4. Existing trials continue until expiration (no disruption)

## Future Enhancements
- In-app feedback prompt for trial users
- Trial extension for users who provide feedback
- A/B test different trial durations
- Segment campaigns by referral source
