# Trial Eligibility Enhancement

**Feature**: Campaign-Level Trial Eligibility Settings
**Status**: 📋 Planning
**Priority**: Medium
**Estimated Effort**: 8-12 hours
**Target Version**: v3.5.0

---

## Problem Statement

### Current Inconsistency

**Campaign Trials (via invite codes):**
- ❌ Blocks users with ANY previous trial (expired or active)
- Policy: **ONE TRIAL PER USER LIFETIME** (strict)
- Location: `server/src/models/Trial.js:457-482` (`checkEligibility()`)

**Admin-Granted Trials:**
- ❌ Only blocks users with ACTIVE trials
- ✅ Allows multiple trials to same user (just not simultaneously)
- Policy: **MULTIPLE TRIALS ALLOWED** (lenient)
- Location: `server/src/routes/admin.js:3332-3339`

### User Experience Problem

**Scenario:**
1. User redeems campaign code `NEWUSER14` → Gets 14-day Pro trial
2. Trial expires after 14 days
3. 6 months later: New campaign launches with code `COMEBACK30` → 30-day Team trial
4. User tries to redeem `COMEBACK30` → ❌ **BLOCKED** ("You have already used a trial")
5. Only option: Contact support → Admin force-grants trial

**Issues:**
- Can't run re-engagement campaigns for lapsed users
- Support burden increases (users requesting exceptions)
- Misses re-activation opportunity
- Inconsistent rules between campaign and admin trials

---

## Solution: Three-Phase Rollout

### Phase 1: Consistency & Admin Force Flag ✅ **NEXT RELEASE**
**Goal:** Make both systems consistent, add admin override capability
**Effort:** 2-3 hours
**Dependencies:** None

#### Changes

**1. Standardize Admin Trial Validation**

Update `server/src/routes/admin.js` grant-trial endpoint:

```javascript
// POST /api/admin/users/:userId/grant-trial
router.post('/users/:userId/grant-trial', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { trial_tier, duration_days, reason, force } = req.body;

    // ... existing validation ...

    // Check eligibility (same as campaigns)
    const eligibility = await Trial.checkEligibility(parseInt(userId, 10));

    if (!eligibility.eligible && !force) {
      // Get trial history for context
      const trialHistory = await Trial.findAllByUserId(parseInt(userId, 10));

      return res.status(400).json({
        success: false,
        error: eligibility.reason,
        hasUsedTrial: true,
        canForce: true,
        trialHistory: trialHistory.map(t => ({
          tier: t.trial_tier,
          source: t.source,
          startedAt: t.started_at,
          endedAt: t.ends_at,
          status: t.status
        }))
      });
    }

    // If force=true, admin is overriding eligibility check
    if (force && !eligibility.eligible) {
      console.log(`[Admin] Force-granting trial to user ${userId} despite ineligibility. Admin: ${req.user.id}, Reason: ${reason}`);
    }

    // Create trial (existing logic)
    const trial = await Trial.create({
      user_id: parseInt(userId, 10),
      trial_tier,
      duration_days: parseInt(duration_days, 10),
      started_at: new Date(),
      ends_at: new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000),
      source: force ? 'admin_grant_forced' : 'admin_grant',
      status: 'active'
    });

    // Log with force flag in metadata
    await sql.query(
      `INSERT INTO user_audit_log (user_id, user_email, field_name, old_value, new_value, change_type, changed_by, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        user.email,
        'trial',
        null,
        trial_tier,
        'update',
        req.user.id,
        reason.trim(),
        JSON.stringify({
          admin_email: req.user.email,
          trial_tier,
          duration_days: parseInt(duration_days, 10),
          trial_id: trial.id,
          action: 'grant_trial',
          forced: force || false, // Track if this was forced
          override_reason: force ? eligibility.reason : null
        })
      ]
    );

    // ... rest of existing logic ...
  } catch (error) {
    // ... error handling ...
  }
});
```

**2. Update Frontend Grant Trial Modal**

`client/src/pages/admin/Users.jsx` - Add force flag option:

```jsx
function GrantTrialModal({ user, onClose, onSuccess }) {
  const [trialTier, setTrialTier] = useState('pro');
  const [durationDays, setDurationDays] = useState(14);
  const [reason, setReason] = useState('');
  const [force, setForce] = useState(false);
  const [showForceOption, setShowForceOption] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(null);
  const [trialHistory, setTrialHistory] = useState(null);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${user.id}/grant-trial`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trial_tier: trialTier,
          duration_days: durationDays,
          reason,
          force
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if user has trial history
        if (data.hasUsedTrial && data.canForce) {
          setEligibilityError(data.error);
          setTrialHistory(data.trialHistory);
          setShowForceOption(true);
          return; // Don't close modal, show force option
        }

        throw new Error(data.error || 'Failed to grant trial');
      }

      toast.success('Trial granted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Modal>
      <h2>Grant Trial to {user.email}</h2>

      {/* Show eligibility warning if user has previous trials */}
      {eligibilityError && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {eligibilityError}
              </p>

              {trialHistory && trialHistory.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                    Trial History:
                  </p>
                  <div className="space-y-1">
                    {trialHistory.map((trial, idx) => (
                      <div key={idx} className="text-xs text-amber-600 dark:text-amber-400">
                        • {trial.tier} ({trial.source}) - {formatDate(trial.startedAt)} to {formatDate(trial.endedAt)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form fields */}
      <Select
        label="Trial Tier"
        value={trialTier}
        onChange={setTrialTier}
        options={[
          { value: 'pro', label: 'Pro' },
          { value: 'team', label: 'Team' }
        ]}
      />

      <Input
        label="Duration (days)"
        type="number"
        value={durationDays}
        onChange={setDurationDays}
        min={1}
        max={90}
      />

      <Textarea
        label="Reason"
        value={reason}
        onChange={setReason}
        placeholder="Why is this trial being granted?"
        required
        minLength={10}
      />

      {/* Show force option only when eligibility check fails */}
      {showForceOption && (
        <Checkbox
          label="Force grant trial (override eligibility check)"
          checked={force}
          onChange={setForce}
          description="⚠️ This user has already used a trial. Only use this for exceptional cases with strong justification."
        />
      )}

      <div className="flex gap-3">
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!reason || reason.length < 10}
          className="btn-primary"
        >
          {force ? 'Force Grant Trial' : 'Grant Trial'}
        </button>
      </div>
    </Modal>
  );
}
```

**3. Add Trial History Display**

Add trial history section to Users.jsx user detail view:

```jsx
function UserTrialHistory({ userId }) {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrialHistory();
  }, [userId]);

  const fetchTrialHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/trial-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTrials(data.trials || []);
    } catch (error) {
      console.error('Failed to fetch trial history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading trial history...</div>;
  if (trials.length === 0) return <div className="text-sm text-slate-500">No trial history</div>;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-900 dark:text-white">Trial History</h4>
      {trials.map((trial) => (
        <div key={trial.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{trial.trial_tier.toUpperCase()} Trial</span>
            <StatusBadge status={trial.status} />
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            <div>Source: {trial.source}</div>
            <div>Started: {formatDate(trial.started_at)}</div>
            <div>Ended: {formatDate(trial.ends_at)}</div>
            {trial.source.includes('forced') && (
              <div className="mt-1 text-amber-600 dark:text-amber-400">
                ⚠️ Force-granted by admin
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**4. Add Backend Trial History Endpoint**

`server/src/routes/admin.js`:

```javascript
/**
 * GET /api/admin/users/:userId/trial-history - Get user's trial history
 */
router.get('/users/:userId/trial-history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const trials = await Trial.findAllByUserId(parseInt(userId, 10));

    res.json({
      success: true,
      trials: trials.map(t => ({
        id: t.id,
        trial_tier: t.trial_tier,
        source: t.source,
        status: t.status,
        started_at: t.started_at,
        ends_at: t.ends_at,
        duration_days: t.duration_days,
        created_at: t.created_at
      }))
    });
  } catch (error) {
    console.error('[Admin] Trial history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trial history'
    });
  }
});
```

#### Testing

**Test Cases:**

1. ✅ Admin tries to grant trial to user with no history → Success
2. ✅ Admin tries to grant trial to user with active trial → Error (no force option)
3. ✅ Admin tries to grant trial to user with expired trial → Warning + Force option shown
4. ✅ Admin force-grants trial → Success with audit log entry
5. ✅ Audit log shows `forced: true` and `override_reason` in metadata
6. ✅ Trial history displays all previous trials with source

#### Documentation Updates

- Update `docs/admin/USER-MANAGEMENT-GUIDE.md` with force flag workflow
- Add trial history section
- Document when to use force flag (exceptional cases only)

---

### Phase 2: Campaign-Level Eligibility Settings 🎯 **FUTURE RELEASE**
**Goal:** Enable re-engagement campaigns with flexible eligibility rules
**Effort:** 6-8 hours
**Dependencies:** Phase 1 complete

#### Database Schema Changes

**Migration: `053-add-campaign-eligibility-settings.sql`**

```sql
-- Add eligibility settings to campaigns table
ALTER TABLE campaigns
  ADD COLUMN allow_previous_trial_users BOOLEAN DEFAULT FALSE,
  ADD COLUMN cooldown_days INTEGER DEFAULT 0,
  ADD COLUMN max_trials_per_user INTEGER DEFAULT 1;

-- Add comment explaining fields
COMMENT ON COLUMN campaigns.allow_previous_trial_users IS
  'If TRUE, users with expired trials can participate. If FALSE, only new trial users eligible.';

COMMENT ON COLUMN campaigns.cooldown_days IS
  'Minimum days required since last trial ended. Only applies if allow_previous_trial_users=TRUE.';

COMMENT ON COLUMN campaigns.max_trials_per_user IS
  'Maximum number of trials a user can receive from ANY campaign (lifetime). Default 1.';

-- Index for eligibility queries
CREATE INDEX idx_campaigns_eligibility ON campaigns(allow_previous_trial_users, cooldown_days);
```

#### Backend Changes

**1. Update Trial Model**

`server/src/models/Trial.js`:

```javascript
/**
 * Check eligibility with campaign-specific rules
 * @param {number} userId - User ID
 * @param {Object} campaignSettings - Campaign eligibility settings
 * @returns {Promise<Object>} Eligibility status with detailed reason
 */
static async checkEligibilityForCampaign(userId, campaignSettings = {}) {
  const {
    allowPreviousTrialUsers = false,
    cooldownDays = 0,
    maxTrialsPerUser = 1
  } = campaignSettings;

  // 1. Check for active trial (always blocks)
  const activeTrial = await this.findActiveByUserId(userId);
  if (activeTrial) {
    return {
      eligible: false,
      reason: 'You already have an active trial',
      code: 'ACTIVE_TRIAL_EXISTS'
    };
  }

  // 2. Get all previous trials
  const allTrials = await this.findAllByUserId(userId);

  // 3. No previous trials - always eligible
  if (allTrials.length === 0) {
    return {
      eligible: true,
      reason: null,
      code: 'NEW_USER'
    };
  }

  // 4. Check lifetime trial limit
  if (allTrials.length >= maxTrialsPerUser) {
    return {
      eligible: false,
      reason: `Maximum trial limit reached (${maxTrialsPerUser} trial${maxTrialsPerUser > 1 ? 's' : ''} per user)`,
      code: 'MAX_TRIALS_REACHED',
      trialCount: allTrials.length
    };
  }

  // 5. Campaign doesn't allow previous trial users
  if (!allowPreviousTrialUsers) {
    return {
      eligible: false,
      reason: 'This campaign is only available to new trial users',
      code: 'NEW_USERS_ONLY',
      trialCount: allTrials.length
    };
  }

  // 6. Check cooldown period
  const lastTrial = allTrials[0]; // Already sorted by DESC
  const lastTrialEnd = new Date(lastTrial.ends_at);
  const now = new Date();
  const daysSinceLastTrial = Math.floor((now - lastTrialEnd) / (1000 * 60 * 60 * 24));

  if (daysSinceLastTrial < cooldownDays) {
    const daysRemaining = cooldownDays - daysSinceLastTrial;
    return {
      eligible: false,
      reason: `Trial available again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      code: 'COOLDOWN_PERIOD',
      daysRemaining,
      lastTrialEndedAt: lastTrial.ends_at
    };
  }

  // 7. All checks passed
  return {
    eligible: true,
    reason: null,
    code: 'ELIGIBLE_RETURNING_USER',
    trialCount: allTrials.length,
    lastTrialEndedAt: lastTrial.ends_at
  };
}
```

**2. Update Campaign Model**

`server/src/models/Campaign.js`:

```javascript
/**
 * Get campaign by invite code (includes eligibility settings)
 */
static async findByCampaignCode(campaignCode) {
  const result = await sql`
    SELECT
      c.id,
      c.campaign_code,
      c.name,
      c.trial_tier,
      c.duration_days,
      c.allow_previous_trial_users,
      c.cooldown_days,
      c.max_trials_per_user,
      c.status,
      c.starts_at,
      c.ends_at
    FROM campaigns c
    WHERE c.campaign_code = ${campaignCode.toUpperCase()}
    LIMIT 1
  `;

  return result.rows[0] || null;
}
```

**3. Update Trial Service**

`server/src/services/trialService.js`:

```javascript
async redeemInviteCode(code, userId) {
  // 1. Validate invite code
  const inviteCode = await InviteCode.findByCode(code);
  if (!inviteCode) {
    throw new Error('Invalid invite code');
  }

  const validation = await InviteCode.validate(code);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  // 2. Get campaign (if invite code belongs to a campaign)
  let campaignSettings = null;
  if (inviteCode.campaign_id) {
    const campaign = await Campaign.findById(inviteCode.campaign_id);
    if (campaign) {
      campaignSettings = {
        allowPreviousTrialUsers: campaign.allow_previous_trial_users,
        cooldownDays: campaign.cooldown_days,
        maxTrialsPerUser: campaign.max_trials_per_user
      };
    }
  }

  // 3. Check eligibility with campaign-specific rules
  let eligibility;
  if (campaignSettings) {
    eligibility = await Trial.checkEligibilityForCampaign(userId, campaignSettings);
  } else {
    // Legacy invite codes (not part of campaign) use strict rules
    eligibility = await Trial.checkEligibility(userId);
  }

  if (!eligibility.eligible) {
    const error = new Error(eligibility.reason);
    error.code = eligibility.code;
    error.details = eligibility;
    throw error;
  }

  // 4. Create trial (existing logic)
  const trial = await Trial.create({
    userId,
    inviteCodeId: inviteCode.id,
    trialTier: inviteCode.trial_tier,
    durationDays: inviteCode.duration_days,
    source: inviteCode.campaign_id ? 'campaign' : 'invite'
  });

  // 5. Redeem invite code
  await InviteCode.redeem(code);

  // 6. Update user's trial_used_at
  await sql`
    UPDATE users
    SET trial_used_at = NOW(),
        updated_at = NOW()
    WHERE id = ${userId}
  `;

  return {
    trialId: trial.id,
    trialTier: trial.trial_tier,
    durationDays: trial.duration_days,
    startedAt: trial.started_at,
    endsAt: trial.ends_at
  };
}
```

#### Frontend Changes

**1. Campaign Creation UI**

`client/src/pages/admin/Campaigns.jsx`:

```jsx
<FormSection title="Eligibility Rules">
  <div className="space-y-4">
    <Checkbox
      label="Allow users with previous trials"
      checked={allowPreviousTrialUsers}
      onChange={setAllowPreviousTrialUsers}
      description="Enable this for re-engagement campaigns targeting lapsed users"
    />

    {allowPreviousTrialUsers && (
      <>
        <Input
          label="Cooldown period (days)"
          type="number"
          value={cooldownDays}
          onChange={setCooldownDays}
          min={0}
          max={365}
          description="Minimum days required since user's last trial ended"
          helperText="0 = no cooldown, user can redeem immediately after previous trial expires"
        />

        <Input
          label="Max trials per user (lifetime)"
          type="number"
          value={maxTrialsPerUser}
          onChange={setMaxTrialsPerUser}
          min={1}
          max={10}
          description="Maximum number of trials a user can receive from any campaign"
          helperText="Default: 1 trial per user"
        />
      </>
    )}

    {/* Show preview of eligibility rules */}
    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
        Eligibility Preview:
      </p>
      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
        {!allowPreviousTrialUsers ? (
          <>
            <li>✅ Users who never had a trial</li>
            <li>❌ Users with expired trials</li>
            <li>❌ Users with active trials</li>
          </>
        ) : (
          <>
            <li>✅ Users who never had a trial</li>
            <li>✅ Users with expired trials (after {cooldownDays} day cooldown)</li>
            <li>❌ Users with active trials</li>
            <li>❌ Users who reached {maxTrialsPerUser} trial limit</li>
          </>
        )}
      </ul>
    </div>
  </div>
</FormSection>
```

**2. Trial Redemption Error Messages**

`client/src/pages/TrialRedemption.jsx`:

```jsx
function EligibilityError({ error, errorCode, details }) {
  if (errorCode === 'NEW_USERS_ONLY') {
    return (
      <ErrorBanner>
        <h3>This campaign is for new users only</h3>
        <p>
          You've already used a trial. This campaign is designed for users
          who haven't experienced our premium features yet.
        </p>
        <div className="mt-4 flex gap-3">
          <a href="/pricing" className="btn-primary">
            View Paid Plans
          </a>
          <a href="/contact" className="btn-secondary">
            Contact Support
          </a>
        </div>
      </ErrorBanner>
    );
  }

  if (errorCode === 'COOLDOWN_PERIOD') {
    return (
      <ErrorBanner>
        <h3>Trial cooldown period active</h3>
        <p>
          You can redeem a new trial in {details.daysRemaining} day{details.daysRemaining !== 1 ? 's' : ''}.
          Your last trial ended on {formatDate(details.lastTrialEndedAt)}.
        </p>
        <p className="mt-2">
          Want immediate access?
          <a href="/pricing" className="link">Upgrade to a paid plan</a>
        </p>
      </ErrorBanner>
    );
  }

  if (errorCode === 'MAX_TRIALS_REACHED') {
    return (
      <ErrorBanner>
        <h3>Trial limit reached</h3>
        <p>
          You've already used {details.trialCount} trial{details.trialCount !== 1 ? 's' : ''}.
          To continue accessing premium features, upgrade to a paid plan.
        </p>
        <div className="mt-4">
          <a href="/pricing" className="btn-primary">
            View Pricing
          </a>
        </div>
      </ErrorBanner>
    );
  }

  if (errorCode === 'ACTIVE_TRIAL_EXISTS') {
    return (
      <ErrorBanner>
        <h3>You already have an active trial</h3>
        <p>
          You're currently on a trial. You can't redeem another trial code
          until your current trial expires.
        </p>
        <div className="mt-4">
          <a href="/usage" className="btn-primary">
            View Trial Status
          </a>
        </div>
      </ErrorBanner>
    );
  }

  // Fallback error message
  return (
    <ErrorBanner>
      <h3>Unable to redeem trial</h3>
      <p>{error || 'An error occurred while redeeming your trial code.'}</p>
    </ErrorBanner>
  );
}
```

#### Campaign Templates

**Template 1: New User Campaign**
```javascript
{
  name: "New User Welcome",
  campaign_code: "WELCOME2025",
  trial_tier: "pro",
  duration_days: 14,
  allow_previous_trial_users: false,
  cooldown_days: 0,
  max_trials_per_user: 1,
  description: "First-time trial for new sign-ups"
}
```

**Template 2: Re-Engagement Campaign (90-Day Cooldown)**
```javascript
{
  name: "Come Back Special",
  campaign_code: "COMEBACK30",
  trial_tier: "team",
  duration_days: 30,
  allow_previous_trial_users: true,
  cooldown_days: 90,
  max_trials_per_user: 2,
  description: "Re-engage lapsed users who haven't tried Team tier"
}
```

**Template 3: Seasonal Promotion (Aggressive Re-Engagement)**
```javascript
{
  name: "Summer Sale 2025",
  campaign_code: "SUMMER2025",
  trial_tier: "pro",
  duration_days: 21,
  allow_previous_trial_users: true,
  cooldown_days: 30,
  max_trials_per_user: 3,
  description: "Seasonal promotion allowing multiple trials"
}
```

#### Testing

**Test Matrix:**

| User State | Campaign Type | Cooldown | Expected Result |
|------------|---------------|----------|-----------------|
| Never tried | New users only | N/A | ✅ Eligible |
| Active trial | Any | N/A | ❌ Blocked |
| Expired trial (30 days ago) | New users only | N/A | ❌ Blocked |
| Expired trial (30 days ago) | Allow previous | 90 days | ❌ Cooldown (60 days left) |
| Expired trial (100 days ago) | Allow previous | 90 days | ✅ Eligible |
| 2 previous trials | Allow previous | 0 days | Max=2: ❌ / Max=3: ✅ |

---

### Phase 3: Advanced Eligibility Features 🚀 **FUTURE**
**Goal:** Per-tier trial history, dynamic cooldowns, predictive eligibility
**Effort:** 8-10 hours
**Dependencies:** Phase 2 complete + analytics data

#### Features

**1. Tier-Specific Trial History**

Allow users to try different tiers:
- User tries Pro → Expires → Can try Team (different tier)
- User tries Pro → Expires → Cannot try Pro again (same tier)

```javascript
// Trial.js - Add tier-specific eligibility
static async checkEligibilityByTier(userId, targetTier, campaignSettings) {
  // Check if user has tried THIS SPECIFIC TIER before
  const tierTrials = await sql`
    SELECT * FROM user_trials
    WHERE user_id = ${userId}
    AND trial_tier = ${targetTier}
  `;

  if (tierTrials.rows.length > 0 && !campaignSettings.allowSameTierRetrial) {
    return {
      eligible: false,
      reason: `You've already tried ${targetTier} tier`,
      code: 'TIER_ALREADY_TRIED'
    };
  }

  // Continue with standard eligibility checks...
}
```

**2. Dynamic Cooldown Based on Conversion Probability**

Machine learning model predicts conversion likelihood:
- High probability users: Shorter cooldown (30 days)
- Low probability users: Longer cooldown (180 days)

```javascript
// campaignService.js
async calculateDynamicCooldown(userId) {
  const userMetrics = await analyticsService.getUserMetrics(userId);
  const conversionScore = await mlService.predictConversion(userMetrics);

  if (conversionScore > 0.7) {
    return 30; // High probability - short cooldown
  } else if (conversionScore > 0.4) {
    return 90; // Medium probability - standard cooldown
  } else {
    return 180; // Low probability - long cooldown
  }
}
```

**3. Trial Quota System**

Per-user annual trial budget:
- Users get 2 trials per calendar year
- Resets January 1st
- Admin can adjust quota per user

```javascript
// Database schema
ALTER TABLE users
  ADD COLUMN trial_quota INTEGER DEFAULT 2,
  ADD COLUMN trial_quota_year INTEGER;

// Check quota
static async checkAnnualQuota(userId) {
  const currentYear = new Date().getFullYear();

  const result = await sql`
    SELECT COUNT(*) as trial_count
    FROM user_trials
    WHERE user_id = ${userId}
    AND EXTRACT(YEAR FROM started_at) = ${currentYear}
  `;

  const user = await User.findById(userId);
  const quota = user.trial_quota || 2;
  const used = parseInt(result.rows[0].trial_count, 10);

  if (used >= quota) {
    return {
      eligible: false,
      reason: `Annual trial quota reached (${used}/${quota} used)`,
      resetsAt: `${currentYear + 1}-01-01`
    };
  }

  return {
    eligible: true,
    remaining: quota - used
  };
}
```

**4. Behavioral Triggers**

Auto-offer trials based on user behavior:
- User hits free tier limit → Offer Pro trial
- User churns → Offer win-back trial after 60 days
- Power user on free tier → Offer Team trial

```javascript
// behavioralTrialService.js
async checkBehavioralEligibility(userId) {
  const user = await User.findById(userId);
  const usage = await usageService.getUsageStats(userId);

  // Trigger 1: Free tier limit reached
  if (user.tier === 'free' && usage.generationsThisMonth >= 50) {
    return {
      eligible: true,
      trigger: 'LIMIT_REACHED',
      recommendedTier: 'pro',
      message: 'You've reached your free tier limit. Try Pro for 14 days!'
    };
  }

  // Trigger 2: High engagement, no subscription
  if (usage.activeStreakDays >= 7 && !user.subscription_id) {
    return {
      eligible: true,
      trigger: 'POWER_USER',
      recommendedTier: 'team',
      message: 'You're a power user! Try Team features for 21 days.'
    };
  }

  return { eligible: false };
}
```

---

## Migration Path

### From Current State to Phase 1

**No breaking changes** - Phase 1 is purely additive:
1. Admin grant-trial endpoint gains new `force` parameter (optional)
2. Existing trials continue to work
3. No database schema changes
4. Frontend gracefully handles missing `force` parameter

### From Phase 1 to Phase 2

**Database migration required**:
1. Add new columns to `campaigns` table
2. Backfill existing campaigns with default values (`allow_previous_trial_users = false`)
3. Update redemption logic to check campaign settings
4. Frontend campaign creation UI gains new fields

**Rollback plan:**
```sql
-- If Phase 2 needs to be reverted
ALTER TABLE campaigns
  DROP COLUMN allow_previous_trial_users,
  DROP COLUMN cooldown_days,
  DROP COLUMN max_trials_per_user;
```

### From Phase 2 to Phase 3

**Optional enhancements** - Phase 3 features are independent:
- Tier-specific eligibility: New logic, no schema changes
- Dynamic cooldown: Requires ML model integration
- Quota system: New user columns, backward compatible
- Behavioral triggers: New service, no breaking changes

---

## Success Metrics

### Phase 1
- Admin force-grant usage rate < 5% of total trials
- Support tickets for "can't redeem trial" decrease by 50%
- Audit log tracks 100% of forced grants

### Phase 2
- Re-engagement campaign adoption > 2 campaigns per quarter
- Trial redemption rate for returning users > 15%
- Cooldown rejection rate < 10%

### Phase 3
- Conversion rate improvement: +20% for behavioral trials
- Dynamic cooldown optimization: +10% trial-to-paid conversion
- Quota system prevents abuse: <1% users hit annual limit

---

## Technical Debt & Considerations

### Current Issues

1. **Inconsistent validation**: Campaign vs admin trials have different rules
   - **Fixed in Phase 1** ✅

2. **No trial history visibility**: Admins can't see why user is ineligible
   - **Fixed in Phase 1** ✅

3. **Inflexible campaign rules**: All campaigns treat users the same
   - **Fixed in Phase 2** ✅

### Future Considerations

1. **Trial attribution**: Track which trials lead to conversions
2. **A/B testing**: Test different eligibility rules per campaign
3. **Regional restrictions**: Limit trials by geography (GDPR, licensing)
4. **Partner trials**: Special rules for partner-referred users
5. **Trial extensions**: Allow admins to extend active trials (already exists)

---

## Related Documentation

- **Trial System Overview**: [TIER-ARCHITECTURE.md](../architecture/TIER-ARCHITECTURE.md)
- **Campaign Management**: [CAMPAIGN-MANAGEMENT-GUIDE.md](../admin/CAMPAIGN-MANAGEMENT-GUIDE.md)
- **User Management**: [USER-MANAGEMENT-GUIDE.md](../admin/USER-MANAGEMENT-GUIDE.md)
- **Admin Analytics**: [ADMIN-USAGE-STATS.md](../admin/ADMIN-USAGE-STATS.md)

---

## Implementation Checklist

### Phase 1: Admin Force Flag ✅
- [ ] Update admin grant-trial endpoint with eligibility check
- [ ] Add `force` parameter to request body
- [ ] Update audit log to track forced grants
- [ ] Create trial history endpoint
- [ ] Add trial history display to Users.jsx
- [ ] Update Grant Trial modal with force option
- [ ] Add eligibility warning UI
- [ ] Write 10 test cases for force grant scenarios
- [ ] Update USER-MANAGEMENT-GUIDE.md
- [ ] Add force flag best practices documentation

### Phase 2: Campaign Eligibility Settings 🎯
- [ ] Create database migration for campaign eligibility fields
- [ ] Add `checkEligibilityForCampaign()` method to Trial model
- [ ] Update Campaign model with eligibility getters
- [ ] Update trialService redemption logic
- [ ] Add eligibility settings to Campaign creation UI
- [ ] Add eligibility preview component
- [ ] Update TrialRedemption error handling
- [ ] Create detailed error messages per eligibility code
- [ ] Write 15 test cases for campaign eligibility matrix
- [ ] Create campaign templates documentation
- [ ] Update CAMPAIGN-MANAGEMENT-GUIDE.md

### Phase 3: Advanced Features 🚀
- [ ] Implement tier-specific eligibility
- [ ] Build conversion prediction ML model
- [ ] Add dynamic cooldown calculation
- [ ] Create trial quota system
- [ ] Build behavioral trigger service
- [ ] Add admin quota management UI
- [ ] Create behavioral trial recommendations
- [ ] Write 20 test cases for advanced features
- [ ] Performance testing for ML predictions
- [ ] Document advanced eligibility strategies

---

## Questions for Product Decision

1. **Phase 1 Priority**: Should we implement Phase 1 in next release (v3.5.0)?
   - Estimated effort: 2-3 hours
   - Provides consistency and admin flexibility immediately

2. **Phase 2 Timeline**: When should campaign-level eligibility be prioritized?
   - Blocks re-engagement campaigns until implemented
   - Requires business decision on trial reuse policy

3. **Force Grant Policy**: What constitutes a valid force-grant scenario?
   - Support escalations?
   - Partnership agreements?
   - Bug/system error compensation?

4. **Cooldown Duration**: What default cooldown should Phase 2 campaigns use?
   - Recommendation: 90 days (quarterly re-engagement)
   - Alternative: 180 days (bi-annual)

5. **Max Trials Per User**: Should there be a global lifetime limit?
   - Recommendation: 3 trials per user lifetime
   - Prevents abuse while allowing tier testing

---

**Last Updated**: January 13, 2026
**Status**: Ready for Phase 1 implementation
**Next Review**: After Phase 1 deployment
