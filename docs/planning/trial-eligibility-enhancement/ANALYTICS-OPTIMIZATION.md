# Trial Eligibility Enhancement - Analytics Event Optimization

**Related Documents:**
- [TRIAL-ELIGIBILITY-WF-PRD.md](./TRIAL-ELIGIBILITY-WF-PRD.md) - Workflow-first PRD with business outcomes and user workflows
- [TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md) - Technical implementation specification

---

## Summary

The [workflow PRD](./TRIAL-ELIGIBILITY-WF-PRD.md) proposes **15 new analytics events**. Following our existing patterns of using event actions and metadata instead of separate events, we can reduce this to **3 new events** while maintaining full tracking capability.

## Current Patterns (from analyticsService.js)

We follow these principles:
1. **Single event with actions**: Use `action` or `origin` metadata instead of separate events
2. **Rich metadata**: Store context in JSONB `event_data` field
3. **Event categories**: workflow, business, usage, system

### Examples of Current Patterns:

```javascript
// ❌ DON'T create separate events for each action
code_input_paste
code_input_upload
code_input_sample
code_input_github

// ✅ DO use a single event with origin metadata
code_input: { origin: 'paste' | 'upload' | 'sample' | 'github' }

// ❌ DON'T create separate events for each trial lifecycle
trial_started
trial_expired
trial_converted

// ✅ DO use a single event with action metadata
trial: { action: 'started' | 'expired' | 'converted' }
```

---

## Proposed Events (from PRD) - 15 total

### Phase 1 (8 events):
- `admin_trial_history_viewed`
- `admin_grant_trial_attempted`
- `admin_grant_trial_forced`
- `admin_grant_trial_succeeded`
- `support_eligibility_investigation_started`
- `support_diagnosis_completed`
- `support_resolution_action`
- `ticket_resolved`

### Phase 2 (7 events):
- `campaign_created`
- `eligibility_preview_viewed`
- `campaign_launched`
- `trial_redemption_attempted`
- `trial_redemption_succeeded`
- `trial_redemption_failed`
- `eligibility_error_viewed`

---

## Optimized Events - 3 new + extend 1 existing

### Phase 1 (Extend 1 existing + Add 1 new)

#### 1. Extend existing `trial` event (0 new events)

**Current actions:** `started`, `expired`, `converted`

**Add actions:**
- `admin_grant_attempted` - Admin tried to grant trial
- `admin_grant_succeeded` - Admin successfully granted trial
- `redemption_attempted` - User tried to redeem trial code (Phase 2)
- `redemption_succeeded` - User successfully redeemed trial (Phase 2)
- `redemption_failed` - Trial redemption blocked by eligibility rules (Phase 2)

**Metadata fields:**
```javascript
{
  action: 'admin_grant_succeeded',
  forced: boolean,              // Was eligibility check overridden?
  source: 'admin_grant' | 'admin_grant_forced' | 'invite_code' | 'campaign',
  tier: 'pro' | 'team',
  duration_days: number,
  override_reason: string?,     // Only if forced=true
  previous_trial_count: number?,
  has_previous_trial: boolean,

  // Phase 2 fields
  trial_program_id: number?,         // For campaign redemptions
  invite_code: string?,         // For code redemptions
  error_code: string?,          // For failed redemptions
  eligibility_status: string?,  // For attempted redemptions
  days_since_last_trial: number?
}
```

**Examples:**
```javascript
// Admin force-grants trial
trial: {
  action: 'admin_grant_succeeded',
  forced: true,
  source: 'admin_grant_forced',
  tier: 'pro',
  duration_days: 14,
  override_reason: 'PREVIOUS_TRIAL_EXISTS',
  previous_trial_count: 1,
  has_previous_trial: true
}

// User successfully redeems campaign code (Phase 2)
trial: {
  action: 'redemption_succeeded',
  source: 'campaign',
  tier: 'pro',
  duration_days: 14,
  trial_program_id: 42,
  invite_code: 'COMEBACK30'
}

// User redemption blocked by cooldown (Phase 2)
trial: {
  action: 'redemption_failed',
  error_code: 'COOLDOWN_PERIOD',
  has_previous_trial: true,
  days_since_last_trial: 60,
  trial_program_id: 42,
  invite_code: 'COMEBACK30'
}
```

---

#### 2. Add `admin_action` event (1 new event, category: usage)

Tracks admin/support workflows beyond trial grants.

**Actions:**
- `view_trial_history` - Admin viewed user's trial history
- `investigate_eligibility` - Support started eligibility investigation
- `diagnose_issue` - Support completed diagnosis
- `resolve_ticket` - Support resolved eligibility ticket

**Metadata fields:**
```javascript
{
  action: 'view_trial_history' | 'investigate_eligibility' | 'diagnose_issue' | 'resolve_ticket',
  target_user_id: number,       // User being investigated
  trial_count: number?,         // For view_trial_history
  ticket_id: string?,           // For support workflows
  diagnosis: string?,           // For diagnose_issue: 'cooldown' | 'new_users_only' | 'bug' | 'other'
  resolution: string?,          // For resolve_ticket: 'force_grant' | 'inform_wait' | 'inform_pricing' | 'escalate'
  investigation_time_seconds: number?, // For diagnose_issue
  resolution_time_minutes: number?,    // For resolve_ticket
  required_force_grant: boolean?       // For resolve_ticket
}
```

**Examples:**
```javascript
// Admin views trial history
admin_action: {
  action: 'view_trial_history',
  target_user_id: 123,
  trial_count: 2
}

// Support investigates eligibility issue
admin_action: {
  action: 'investigate_eligibility',
  target_user_id: 123,
  ticket_id: 'SUP-5678'
}

// Support diagnoses cooldown issue
admin_action: {
  action: 'diagnose_issue',
  target_user_id: 123,
  ticket_id: 'SUP-5678',
  diagnosis: 'cooldown',
  investigation_time_seconds: 142
}

// Support resolves ticket
admin_action: {
  action: 'resolve_ticket',
  target_user_id: 123,
  ticket_id: 'SUP-5678',
  resolution: 'force_grant',
  resolution_time_minutes: 8,
  required_force_grant: true
}
```

---

### Phase 2 (Add 2 new events)

#### 3. Add `campaign` event (1 new event, category: business)

Tracks campaign management lifecycle.

**Actions:**
- `created` - Trial Program created by growth lead
- `preview_viewed` - Eligibility preview checked
- `launched` - Trial Program activated

**Metadata fields:**
```javascript
{
  action: 'created' | 'preview_viewed' | 'launched',
  trial_program_id: number,
  source: 'web',                    // Future: 'api', 'cli'
  eligibility_type: 'new_users_only' | 'allow_lapsed' | 'all_users',
  target_tier: 'pro' | 'team',
  duration_days: number,
  allow_previous_trial_users: boolean?,
  cooldown_days: number?,
  max_trials_per_user: number?,
  estimated_reach: number?          // For preview_viewed
}
```

**Examples:**
```javascript
// Growth lead creates re-engagement campaign
campaign: {
  action: 'created',
  trial_program_id: 42,
  source: 'web',
  eligibility_type: 'allow_lapsed',
  target_tier: 'pro',
  duration_days: 14,
  allow_previous_trial_users: true,
  cooldown_days: 90
}

// Growth lead previews reach estimate
campaign: {
  action: 'preview_viewed',
  trial_program_id: 42,
  estimated_reach: 1247
}

// Trial Program goes live
campaign: {
  action: 'launched',
  trial_program_id: 42,
  eligibility_type: 'allow_lapsed',
  target_tier: 'pro',
  duration_days: 14
}
```

---

#### 4. Add `eligibility_error` event (1 new event, category: usage)

Tracks when users see eligibility errors and their actions.

**Metadata fields:**
```javascript
{
  error_code: 'COOLDOWN_PERIOD' | 'NEW_USERS_ONLY' | 'MAX_TRIALS_REACHED' | 'ACTIVE_TRIAL_EXISTS',
  trial_program_id: number?,
  invite_code: string?,
  has_previous_trial: boolean,
  days_since_last_trial: number?,
  clicked_next_step: string?,    // 'pricing' | 'support' | 'dismiss'
  days_until_eligible: number?   // For COOLDOWN_PERIOD
}
```

**Examples:**
```javascript
// User sees cooldown error
eligibility_error: {
  error_code: 'COOLDOWN_PERIOD',
  trial_program_id: 42,
  invite_code: 'COMEBACK30',
  has_previous_trial: true,
  days_since_last_trial: 60,
  days_until_eligible: 30
}

// User clicks "View Pricing" from error
eligibility_error: {
  error_code: 'COOLDOWN_PERIOD',
  trial_program_id: 42,
  clicked_next_step: 'pricing'
}
```

---

## Comparison: Before vs After

### Before (PRD Proposal)
- **15 new events**
- Separate event for each action
- Harder to query related actions
- More database rows

### After (Optimized)
- **3 new events** + extend 1 existing
- Actions grouped by domain
- Easy to query with `WHERE event_name = 'trial' AND event_data->>'action' = 'admin_grant_succeeded'`
- 80% fewer events

---

## Migration Strategy

### analyticsService.js Updates

```javascript
// Add new event category mapping
const EVENT_CATEGORIES = {
  // ... existing events
  admin_action: 'usage',        // NEW
  campaign: 'business',         // NEW (Phase 2)
  eligibility_error: 'usage',   // NEW (Phase 2)
};

// Extend trial event actions
const EVENT_ACTIONS = {
  trial: {
    actionField: 'action',
    actions: [
      'started',
      'expired',
      'converted',
      'admin_grant_attempted',      // NEW
      'admin_grant_succeeded',      // NEW
      'redemption_attempted',       // NEW (Phase 2)
      'redemption_succeeded',       // NEW (Phase 2)
      'redemption_failed',          // NEW (Phase 2)
    ],
  },

  // NEW admin_action event
  admin_action: {
    actionField: 'action',
    actions: [
      'view_trial_history',
      'investigate_eligibility',
      'diagnose_issue',
      'resolve_ticket',
    ],
  },

  // NEW campaign event (Phase 2)
  campaign: {
    actionField: 'action',
    actions: ['created', 'preview_viewed', 'launched'],
  },
};
```

### Helper Methods

```javascript
// Add to analyticsService
async recordTrialAction(action, userId, metadata = {}) {
  return this.recordEvent('trial', { action, ...metadata }, { userId });
}

async recordAdminAction(action, adminUserId, metadata = {}) {
  return this.recordEvent('admin_action', { action, ...metadata }, { userId: adminUserId });
}

async recordCampaignAction(action, userId, metadata = {}) {
  return this.recordEvent('campaign', { action, ...metadata }, { userId });
}

async recordEligibilityError(errorCode, userId, metadata = {}) {
  return this.recordEvent('eligibility_error', { error_code: errorCode, ...metadata }, { userId });
}
```

### Usage Examples

```javascript
// Admin grants trial with force flag
await analyticsService.recordTrialAction('admin_grant_succeeded', userId, {
  forced: true,
  source: 'admin_grant_forced',
  tier: 'pro',
  duration_days: 14,
  override_reason: 'PREVIOUS_TRIAL_EXISTS',
  previous_trial_count: 1,
  has_previous_trial: true
});

// Admin views trial history
await analyticsService.recordAdminAction('view_trial_history', adminId, {
  target_user_id: userId,
  trial_count: 2
});

// Support resolves ticket with force grant
await analyticsService.recordAdminAction('resolve_ticket', supportId, {
  target_user_id: userId,
  ticket_id: 'SUP-5678',
  resolution: 'force_grant',
  resolution_time_minutes: 8,
  required_force_grant: true
});

// User hits cooldown error (Phase 2)
await analyticsService.recordEligibilityError('COOLDOWN_PERIOD', userId, {
  trial_program_id: 42,
  invite_code: 'COMEBACK30',
  has_previous_trial: true,
  days_since_last_trial: 60,
  days_until_eligible: 30
});

// Trial Program launched (Phase 2)
await analyticsService.recordCampaignAction('launched', adminId, {
  trial_program_id: 42,
  eligibility_type: 'allow_lapsed',
  target_tier: 'pro',
  duration_days: 14
});
```

---

## Query Examples

### All admin trial grants (including forced)
```sql
SELECT * FROM analytics_events
WHERE event_name = 'trial'
  AND event_data->>'action' IN ('admin_grant_attempted', 'admin_grant_succeeded')
ORDER BY created_at DESC;
```

### Only forced trial grants
```sql
SELECT * FROM analytics_events
WHERE event_name = 'trial'
  AND event_data->>'action' = 'admin_grant_succeeded'
  AND (event_data->>'forced')::boolean = true
ORDER BY created_at DESC;
```

### Support ticket resolution rate
```sql
SELECT
  event_data->>'resolution' as resolution_type,
  COUNT(*) as count,
  AVG((event_data->>'resolution_time_minutes')::numeric) as avg_time
FROM analytics_events
WHERE event_name = 'admin_action'
  AND event_data->>'action' = 'resolve_ticket'
GROUP BY event_data->>'resolution';
```

### Eligibility error distribution (Phase 2)
```sql
SELECT
  event_data->>'error_code' as error_type,
  COUNT(*) as count,
  COUNT(CASE WHEN event_data->>'clicked_next_step' IS NOT NULL THEN 1 END) as engaged
FROM analytics_events
WHERE event_name = 'eligibility_error'
GROUP BY event_data->>'error_code';
```

---

## Benefits of Optimized Approach

1. **Consistency**: Follows existing patterns (code_input origins, trial actions)
2. **Maintainability**: Fewer event types to track and document
3. **Query Simplicity**: Related actions grouped under single event
4. **Extensibility**: Easy to add new actions without schema changes
5. **Performance**: 80% fewer rows in analytics_events table
6. **Analytics**: Action distribution queries simplified

---

## Implementation Checklist

### Phase 1
- [ ] Update EVENT_CATEGORIES in analyticsService.js (add admin_action)
- [ ] Extend trial event actions (add admin_grant_attempted, admin_grant_succeeded)
- [ ] Add admin_action to EVENT_ACTIONS
- [ ] Add helper methods: recordTrialAction, recordAdminAction
- [ ] Update Users.jsx to call recordTrialAction on grant trial
- [ ] Update Users.jsx to call recordAdminAction on view trial history
- [ ] Add tests for new event actions

### Phase 2
- [ ] Update EVENT_CATEGORIES (add campaign, eligibility_error)
- [ ] Extend trial event actions (add redemption_attempted, redemption_succeeded, redemption_failed)
- [ ] Add campaign to EVENT_ACTIONS
- [ ] Add helper methods: recordCampaignAction, recordEligibilityError
- [ ] Update campaign management UI to call recordCampaignAction
- [ ] Update trial redemption flow to call recordTrialAction
- [ ] Update eligibility error UI to call recordEligibilityError
- [ ] Add tests for Phase 2 event actions

---

## Recommendation

✅ **Use the optimized 3-event approach** instead of the 15-event proposal.

This maintains full tracking capability while:
- Following established patterns
- Reducing database growth by 80%
- Simplifying queries and reporting
- Making future extensions easier

The PRD analytics section should be updated to reflect this optimization before implementation.
