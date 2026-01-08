# Event Taxonomy Reference

> **Status**: Reference documentation
> **Updated**: January 2026
> **Related**: [ANALYTICS-SCALING-PLAN.md](./ANALYTICS-SCALING-PLAN.md)

## Overview

This document defines all analytics events tracked in CodeScribe AI. Events are organized into three categories based on their purpose in understanding user behavior and product health.

---

## Event Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Funnel** | Track user progression through core workflow | session_start → code_input → generation → export |
| **Business** | Track conversion and monetization | signup, trial, tier_change, checkout |
| **Usage** | Track product usage and performance | doc_generation, quality_score, performance |

---

## Funnel Events

Track user progression through the core workflow.

| Event | Purpose | Key Attributes |
|-------|---------|----------------|
| `session_start` | New browser session begins | `referrer`, `landing_page` |
| `code_input` | Code loaded into editor | `origin`, `language`, `filename`, `repo.*`, `file.*` |
| `generation_started` | Doc generation initiated | Derived from `doc_generation` events |
| `generation_completed` | Doc generation succeeded | Derived from `doc_generation` where success=true |
| `doc_export` | User exports documentation | `action`, `doc_type`, `filename`, `format` |

### Funnel Flow
```
session_start → code_input → generation_started → generation_completed → doc_export
```

---

## Business Events

Track conversion and monetization milestones.

| Event | Purpose | Key Attributes |
|-------|---------|----------------|
| `login` | User authenticates | `method` (email/github/google) |
| `signup` | New account created | `method`, `tier`, `has_trial` |
| `trial` | Trial lifecycle event | `action`, `source`, `days_active`, `generations_used` |
| `tier_change` | Subscription tier changed | `action`, `previous_tier`, `new_tier`, `reason`, `source` |
| `checkout_completed` | Payment successful | `tier`, `amount_cents`, `billing_period` |

### Business Funnel Flow
```
signup → trial (started) → tier_change (upgrade) OR trial (expired)
                        → checkout_completed
```

---

## Usage Events

Track product usage patterns and performance.

| Event | Purpose | Key Attributes |
|-------|---------|----------------|
| `doc_generation` | Generation attempt with full details | `success`, `doc_type`, `language`, `duration`, `llm.*` |
| `quality_score` | Quality score recorded | `score`, `grade`, `doc_type` |
| `usage_alert` | Usage threshold reached | `action`, `tier`, `percent_used`, `docs_remaining` |
| `performance` | LLM performance metrics | `latency.*`, `throughput.*`, `cache.*` |
| `error` | Error occurred | `error_type`, `error_message`, `context` |
| `oauth_flow` | OAuth authentication flow | `provider`, `action`, `duration` |
| `user_interaction` | Generic UI interactions | `action`, varies by interaction |

---

## Event Actions Reference

Some events use an `action` field to distinguish sub-types.

### `code_input` origins

| Origin | Description |
|--------|-------------|
| `paste` | User typed or pasted code directly |
| `upload` | File uploaded from local machine |
| `sample` | Sample code loaded from gallery |
| `github` | File imported from GitHub repository |

**Additional attributes by origin:**
- `github`: includes `repo.owner`, `repo.name`, `repo.path`, `repo.is_private`
- `upload`: includes `file.type`, `file.size_kb`, `file.success`

### `doc_export` actions

| Action | Description |
|--------|-------------|
| `copy` | Documentation copied to clipboard |
| `download` | Documentation downloaded as file |

**Attributes:** `doc_type`, `filename`, `format` (for download)

### `trial` actions

| Action | Description |
|--------|-------------|
| `started` | Trial period began |
| `expired` | Trial period ended without conversion |
| `converted` | Trial user upgraded to paid |

**Attributes:**
- `started`: `source`, `tier`, `duration_days`
- `expired`/`converted`: `days_active`, `generations_used`
- `converted`: `days_to_convert`

### `tier_change` actions

| Action | Description |
|--------|-------------|
| `upgrade` | User upgraded to a higher tier |
| `downgrade` | User downgraded to a lower tier |
| `cancel` | User cancelled their subscription |

**Attributes:**
- All: `previous_tier`, `source`
- `upgrade`/`downgrade`: `new_tier`
- `cancel`: `reason`

### `usage_alert` actions

| Action | Description |
|--------|-------------|
| `warning_shown` | 80% usage warning banner displayed |
| `limit_hit` | 100% usage limit modal displayed |

**Attributes:** `tier`, `percent_used`, `docs_remaining`, `limit`, `period`

### `user_interaction` actions

| Action | Description |
|--------|-------------|
| `view_quality_breakdown` | User viewed quality score details |
| `pricing_page_viewed` | Pricing page opened |
| `upgrade_cta_clicked` | Upgrade button clicked |
| `checkout_started` | Stripe checkout initiated |
| `regeneration_complete` | Doc regeneration finished |
| `batch_generation_complete` | Batch generation finished |

---

## Event Data Structure

All events share a common structure:

```javascript
{
  id: 'uuid',
  event_name: 'string',
  event_category: 'funnel' | 'business' | 'usage',
  session_id: 'string',
  user_id: number | null,
  ip_address: 'string',
  is_internal: boolean,
  event_data: {
    // Event-specific attributes (JSONB)
  },
  created_at: 'timestamp'
}
```

### Internal User Detection

Events are automatically flagged as `is_internal = true` when:
- User has admin/support/super_admin role
- User has an active tier override (`viewing_as_tier`)

This allows filtering internal testing from business metrics.

---

## Quick Reference

### Client-Side Tracking (analytics.js)

```javascript
import {
  trackSessionStart,
  trackCodeInput,
  trackDocExport,
  trackUsageAlert,
  trackPerformance,
  trackError,
  trackInteraction
} from '../utils/analytics';

// Session start
trackSessionStart();

// Code input with GitHub metadata
trackCodeInput('github', code.length, 'javascript', 'index.js', {
  owner: 'user',
  name: 'repo',
  path: 'src/index.js',
  isPrivate: false
});

// Doc export
trackDocExport({ action: 'copy', docType: 'README', filename: 'README.md' });

// Usage alert
trackUsageAlert({ action: 'warning_shown', tier: 'free', percentUsed: 80 });
```

### Server-Side Tracking (serverAnalytics.js)

```javascript
import {
  trackCheckoutCompleted,
  trackTierChange,
  trackSignup
} from '../utils/serverAnalytics';

// Tier change
trackTierChange({
  action: 'upgrade',
  userId: 42,
  previousTier: 'free',
  newTier: 'pro',
  source: 'stripe_checkout'
});

// Trial tracking (via analyticsService)
analyticsService.trackTrial({
  action: 'started',
  userId: 42,
  source: 'campaign',
  tier: 'pro',
  durationDays: 14
});
```

---

## Related Documentation

- [ANALYTICS-SCALING-PLAN.md](./ANALYTICS-SCALING-PLAN.md) - Scaling strategy and query optimization
- [WORKFLOW-OUTCOME-METRICS-PLAN.md](../planning/WORKFLOW-OUTCOME-METRICS-PLAN.md) - Original analytics implementation plan
