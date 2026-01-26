# Event Taxonomy Reference

**Last Updated:** January 11, 2026 (v3.3.9)

Complete reference for all analytics events in CodeScribe AI. Events are categorized into four main categories: Workflow, Business, Usage, and System.

---

## 📊 Event Categories

| Category | Purpose | Use Case |
|----------|---------|----------|
| **workflow** | Core user workflow progression | Track user journey from session start to doc export |
| **business** | Monetization and conversion | Track signups, trials, subscriptions, revenue |
| **usage** | Product usage patterns | Track feature usage, doc types, quality, interactions |
| **system** | Infrastructure and technical | Track errors, performance metrics |

---

## 🔄 Workflow Events

Events that track the core user workflow from arriving at the site to exporting documentation.

### `session_start`
- **Category:** workflow
- **Description:** User starts a new session on the site
- **Triggered:** On page load with new or returning session ID
- **Event Data:**
  - `sessionId` (string): Browser session identifier
  - `userId` (number, optional): Authenticated user ID
- **Use Case:** Track active sessions, calculate session-based metrics

### `code_input`
- **Category:** workflow
- **Description:** User provides code input via any method
- **Triggered:** When code is pasted, uploaded, loaded from GitHub, or selected from samples
- **Event Data:**
  - `origin` (string): **REQUIRED** - Input method
    - `paste`: User pasted code
    - `upload`: User uploaded a file
    - `sample`: User selected from sample codes
    - `github_public`: Loaded from public GitHub repo
    - `github_private`: Loaded from private GitHub repo
    - `default`: Default code loaded on page load
  - `language` (string): Programming language detected
  - `size` (number): Code size in bytes
- **Use Case:** Track how users provide code, most common input methods

### `generation_started`
- **Category:** workflow
- **Description:** Doc generation begins (stored as `doc_generation` event)
- **Triggered:** When user clicks Generate or batch generation starts
- **Event Data:** See `doc_generation` event
- **Use Case:** Track generation attempts, calculate completion rate

### `generation_completed`
- **Category:** workflow
- **Description:** Doc generation completes successfully (stored as `doc_generation` with `success: true`)
- **Triggered:** When generation completes without errors
- **Event Data:** See `doc_generation` event
- **Use Case:** Track successful generations, calculate success rate

### `first_generation`
- **Category:** workflow
- **Description:** User's first successful documentation generation (milestone event)
- **Triggered:** After completing their first documentation generation
- **Event Data:**
  - `doc_type` (string): Type of first documentation generated (README, JSDoc, API, ARCHITECTURE, OPENAPI)
  - `hours_since_signup` (number): Hours from signup to first generation
  - `origin` (string): Generation source (upload, paste, github_public, github_private, sample, default)
- **Use Case:** Track activation rate, time-to-value, conversion funnel optimization
- **Trial Program Tracking:** Key metric for trial campaign success - measures how quickly users reach first value moment

### `doc_export`
- **Category:** workflow
- **Description:** User exports generated documentation
- **Triggered:** When user clicks Copy or Download button
- **Event Data:**
  - `action` (string): **REQUIRED** - Export method
    - `copy`: Copied to clipboard
    - `download`: Downloaded as file
  - `source` (string): Export source
    - `fresh`: Newly generated documentation
    - `cached`: Previously generated (from cache/history)
  - `docType` (string): Documentation type (README, JSDoc, API, ARCHITECTURE, OPENAPI)
  - `language` (string): Programming language
- **Use Case:** Track export behavior, measure conversion to action

---

## 💼 Business Events

Events that track monetization, conversion, and revenue-generating activities.

### `login`
- **Category:** business
- **Description:** User logs into their account
- **Triggered:** Successful authentication (email/password or OAuth)
- **Event Data:**
  - `userId` (number): User ID
  - `method` (string): Login method (email, github)
  - `isNewSession` (boolean): Whether this is a new browser session
- **Use Case:** Track active users, login frequency
- **Special Behavior:** Retroactively updates all session events as `is_internal = TRUE` if user has admin role or tier override

### `signup`
- **Category:** business
- **Description:** New user account created
- **Triggered:** Successful account registration
- **Event Data:**
  - `userId` (number): New user ID
  - `method` (string): Signup method (email, github)
  - `initialTier` (string): Starting subscription tier (free, pro, enterprise)
  - `source` (string, optional): Signup source (invite_code, campaign, direct)
- **Use Case:** Track new user acquisition, conversion from visitor to user

### `email_verified`
- **Category:** business
- **Description:** User verifies their email address
- **Triggered:** When user clicks verification link in email
- **Event Data:**
  - `verification_method` (string): Verification method (email_link)
  - `days_to_verify` (number): Days from signup to email verification
- **Use Case:** Track email verification rate, time-to-verification, activation funnel
- **Trial Program Tracking:** Key metric for trial campaign quality - measures user engagement and prevents spam signups

### `trial`
- **Category:** business
- **Description:** Trial lifecycle events
- **Triggered:** When trial starts, expires, or converts to paid
- **Event Data:**
  - `action` (string): **REQUIRED** - Trial action
    - `started`: Trial begins
    - `expired`: Trial ends without conversion
    - `converted`: Trial converts to paid subscription
  - `source` (string): Trial source
    - `campaign`: Auto-granted during campaign period
    - `invite_code`: Via invite code
    - `admin_grant`: Manually granted by admin
    - `self_serve`: User self-activated (if available)
  - `tier` (string): Trial tier (usually `pro`)
  - `durationDays` (number): Trial duration in days (for `started`)
  - `daysActive` (number): Days trial was active (for `expired`, `converted`)
  - `generationsUsed` (number): Generations used during trial (for `expired`, `converted`)
  - `daysToConvert` (number): Days from start to conversion (for `converted`)
- **Use Case:** Track trial effectiveness, conversion rates, trial usage patterns

### `tier_change`
- **Category:** business
- **Description:** Subscription tier changes
- **Triggered:** When user upgrades, downgrades, or cancels subscription
- **Event Data:**
  - `action` (string): **REQUIRED** - Change type
    - `upgrade`: Move to higher tier
    - `downgrade`: Move to lower tier
    - `cancel`: Cancel subscription
  - `fromTier` (string): Previous tier
  - `toTier` (string): New tier
  - `reason` (string, optional): User-provided reason
  - `proratedAmount` (number, optional): Prorated charge/credit in cents
- **Use Case:** Track subscription changes, churn, expansion revenue

### `checkout_completed`
- **Category:** business
- **Description:** Successful payment transaction
- **Triggered:** Stripe webhook confirms successful payment
- **Event Data:**
  - `tier` (string): Purchased tier
  - `amount` (number): Transaction amount in cents
  - `currency` (string): Currency code (USD)
  - `stripeCustomerId` (string): Stripe customer ID
  - `subscriptionId` (string): Stripe subscription ID
- **Use Case:** Track revenue, subscription activations

### `usage_alert`
- **Category:** business (monetization trigger)
- **Description:** Usage quota warnings and limit enforcement
- **Triggered:** When user approaches or hits usage limits
- **Event Data:**
  - `action` (string): **REQUIRED** - Alert type
    - `warning_shown`: 80% usage warning displayed
    - `limit_hit`: 100% usage limit reached
  - `tier` (string): Current subscription tier
  - `usagePercent` (number): Current usage percentage
  - `generationsUsed` (number): Generations used this period
  - `generationsLimit` (number): Tier generation limit
- **Use Case:** Track upgrade prompts, identify users likely to upgrade

---

## 📈 Usage Events

Events that track how users interact with the product and which features they use.

### `doc_generation`
- **Category:** usage
- **Description:** Complete doc generation lifecycle
- **Triggered:** On generation start AND completion
- **Event Data:**
  - `docType` (string): Documentation type
    - `README`: README.md file
    - `JSDoc`: JSDoc comments
    - `API`: API documentation
    - `ARCHITECTURE`: Architecture overview
    - `OPENAPI`: OpenAPI specification
  - `language` (string): Programming language
  - `codeSize` (number): Input code size in bytes
  - `qualityScore` (number): Quality score (0-100)
  - `success` (boolean): Whether generation succeeded
  - `error` (string, optional): Error message if failed
  - `latencyMs` (number): Total generation time in milliseconds
  - `ttftMs` (number): Time to first token in milliseconds
  - `streamingMs` (number): Streaming duration in milliseconds
  - `inputTokens` (number): LLM input tokens
  - `outputTokens` (number): LLM output tokens
  - `cachedTokens` (number): Cached prompt tokens
  - `provider` (string): LLM provider (claude, openai, gemini)
  - `model` (string): LLM model used
  - `wasCached` (boolean): Whether prompt cache was used
- **Use Case:** Track generation patterns, performance, quality, LLM usage
- **Special Queries:**
  - `generation_started`: All `doc_generation` events
  - `generation_completed`: Only `doc_generation` where `success = true`

### `batch_generation`
- **Category:** usage
- **Description:** Batch generation of multiple files
- **Triggered:** When user generates docs for multiple files
- **Event Data:**
  - `fileCount` (number): Number of files in batch
  - `docTypes` (array): Doc types generated
  - `totalSize` (number): Total code size in bytes
  - `successCount` (number): Successful generations
  - `failureCount` (number): Failed generations
  - `totalLatencyMs` (number): Total time for batch
  - `averageLatencyMs` (number): Average time per file
- **Use Case:** Track batch usage, multi-file workflows

### `quality_score`
- **Category:** usage
- **Description:** Quality score assigned to generated documentation
- **Triggered:** After each successful generation
- **Event Data:**
  - `score` (number): Quality score (0-100)
  - `grade` (string): Letter grade (A, B, C, D, F)
  - `docType` (string): Documentation type
  - `language` (string): Programming language
  - `criteria` (object): Breakdown by scoring criteria
    - `overview` (number): Overview/description score
    - `installation` (number): Installation instructions score
    - `usage` (number): Usage examples score
    - `api` (number): API documentation score
    - `structure` (number): Structure and organization score
- **Use Case:** Track documentation quality trends, identify improvement opportunities

### `oauth_flow`
- **Category:** usage
- **Description:** OAuth authentication flow events
- **Triggered:** During GitHub OAuth process
- **Event Data:**
  - `provider` (string): OAuth provider (github)
  - `action` (string): Flow step
    - `initiated`: User clicked OAuth button
    - `callback_received`: OAuth callback received
    - `success`: OAuth completed successfully
    - `error`: OAuth failed
  - `error` (string, optional): Error message if failed
- **Use Case:** Track OAuth success rate, identify auth issues

### `user_interaction`
- **Category:** usage
- **Description:** Miscellaneous user interactions and feature usage
- **Triggered:** Various UI interactions
- **Event Data:**
  - `action` (string): **REQUIRED** - Interaction type
    - `view_quality_breakdown`: User viewed quality criteria breakdown
    - `pricing_page_viewed`: User visited pricing page
    - `upgrade_cta_clicked`: User clicked upgrade CTA
    - `checkout_started`: User initiated checkout flow
    - `regeneration_complete`: User regenerated documentation
    - `batch_generation_complete`: Batch generation completed
  - `context` (object, optional): Additional context about the interaction
- **Use Case:** Track feature engagement, conversion funnel insights

---

## ⚙️ System Events

Events that track technical performance, errors, and infrastructure metrics.

### `error`
- **Category:** system
- **Description:** Application or API errors
- **Triggered:** When errors occur during generation or API calls
- **Event Data:**
  - `errorType` (string): Error category
    - `generation_error`: Doc generation failed
    - `api_error`: API call failed
    - `validation_error`: Input validation failed
    - `rate_limit_error`: Rate limit exceeded
    - `auth_error`: Authentication failed
  - `message` (string): Error message
  - `stack` (string, optional): Stack trace (sanitized)
  - `endpoint` (string, optional): API endpoint that failed
  - `statusCode` (number, optional): HTTP status code
- **Use Case:** Error monitoring, debugging, reliability tracking

### `performance`
- **Category:** system
- **Description:** Performance metrics and monitoring
- **Triggered:** On key performance measurements
- **Event Data:**
  - `metric` (string): Performance metric type
    - `page_load`: Page load time
    - `api_latency`: API response time
    - `generation_latency`: Doc generation time
    - `ttfb`: Time to first byte
  - `value` (number): Metric value in milliseconds
  - `endpoint` (string, optional): Related API endpoint
  - `context` (object, optional): Additional performance context
- **Use Case:** Performance monitoring, optimization tracking

---

## 🔍 Event Data Standards

### Common Fields

All events automatically include these fields:

- `id` (uuid): Unique event identifier
- `event_name` (string): Event name from taxonomy
- `category` (string): Event category (workflow, business, usage, system)
- `event_data` (jsonb): Event-specific data (see above)
- `session_id` (string): Browser session identifier
- `user_id` (integer, nullable): Authenticated user ID
- `is_internal` (boolean): Whether event is from admin/internal user
- `ip_address` (string, nullable): Client IP address (anonymized)
- `created_at` (timestamp): Event timestamp

### Action Field Convention

Events with sub-types use a consistent pattern:

1. **Action field** in `event_data`: Required string field indicating sub-type
2. **Validation**: Actions validated against allowed list in `EVENT_ACTIONS`
3. **Naming**: Use snake_case for action values (e.g., `warning_shown`, `limit_hit`)

### Data Type Guidelines

- **Strings**: Use for categorical data, identifiers, messages
- **Numbers**: Use for counts, measurements, amounts (use integers for money in cents)
- **Booleans**: Use for binary states (success/failure, enabled/disabled)
- **Objects**: Use for structured sub-data (criteria breakdown, context)
- **Arrays**: Use for lists (doc types, file names)

### Size Limits

- **Event data**: Keep `event_data` JSONB under 5KB
- **Strings**: Limit strings to 500 characters (1000 for error messages)
- **Arrays**: Limit arrays to 100 items

---

## 📝 Usage Examples

### Recording Workflow Events

```javascript
// Session start
await analyticsService.recordEvent('session_start', {}, {
  sessionId: sessionId,
  userId: userId, // optional
});

// Code input
await analyticsService.recordEvent('code_input', {
  origin: 'paste',
  language: 'javascript',
  size: 1234,
}, {
  sessionId: sessionId,
});

// Doc export
await analyticsService.recordEvent('doc_export', {
  action: 'copy',
  source: 'fresh',
  docType: 'README',
  language: 'javascript',
}, {
  sessionId: sessionId,
});
```

### Recording Business Events

```javascript
// Email verification
await analyticsService.trackEvent('email_verified', {
  verification_method: 'email_link',
  days_to_verify: 0.5, // 12 hours
}, {
  userId: userId,
  ipAddress: req.ip,
});

// Trial started
await analyticsService.trackTrial({
  action: 'started',
  userId: userId,
  source: 'campaign',
  tier: 'pro',
  durationDays: 14,
});

// Tier change
await analyticsService.recordEvent('tier_change', {
  action: 'upgrade',
  fromTier: 'free',
  toTier: 'pro',
  proratedAmount: 1500, // $15.00
}, {
  userId: userId,
});

// Usage alert
await analyticsService.recordEvent('usage_alert', {
  action: 'warning_shown',
  tier: 'free',
  usagePercent: 80,
  generationsUsed: 8,
  generationsLimit: 10,
}, {
  sessionId: sessionId,
  userId: userId,
});
```

### Recording Workflow Events

```javascript
// First generation milestone (automatic - tracked in documentService)
await analyticsService.trackEvent('first_generation', {
  doc_type: 'README',
  hours_since_signup: 2.3,
  origin: 'paste',
}, {
  userId: userId,
});
```

### Recording Usage Events

```javascript
// Doc generation
await analyticsService.recordEvent('doc_generation', {
  docType: 'README',
  language: 'python',
  codeSize: 2048,
  qualityScore: 85,
  success: true,
  latencyMs: 3500,
  ttftMs: 800,
  streamingMs: 2700,
  inputTokens: 500,
  outputTokens: 1000,
  cachedTokens: 300,
  provider: 'claude',
  model: 'claude-sonnet-4-5-20250929',
  wasCached: true,
}, {
  sessionId: sessionId,
  userId: userId,
});

// User interaction
await analyticsService.recordEvent('user_interaction', {
  action: 'view_quality_breakdown',
  context: { docType: 'README', score: 85 },
}, {
  sessionId: sessionId,
});
```

---

## 🔄 Event Lifecycle

### Client-Side Events

1. User action triggers event
2. Frontend calls `analytics.track(eventName, eventData)`
3. Analytics utility adds session context
4. POST request to `/api/analytics/track`
5. Backend validates event and records to database

### Server-Side Events

1. Server action triggers event (trial, payment, etc.)
2. Server calls `analyticsService.recordEvent()` or `analyticsService.trackTrial()`
3. Service validates event and records to database
4. No HTTP request needed

### Event Flow Diagram

```
User Action
    ↓
Frontend Analytics Utility
    ↓
POST /api/analytics/track
    ↓
Backend Route (requireAuth optional)
    ↓
analyticsService.recordEvent()
    ↓
Validation (event name, action, data)
    ↓
Database Insert (analytics_events table)
    ↓
Return Event ID
```

---

## 🚀 Best Practices

### Event Design

1. **Be specific**: Use descriptive event names and action values
2. **Be consistent**: Follow naming conventions (snake_case)
3. **Be minimal**: Only include necessary data in event_data
4. **Be actionable**: Design events to answer specific business questions

### Data Quality

1. **Validate early**: Validate data at the source (frontend)
2. **Required fields**: Always include required action fields
3. **Type safety**: Use correct data types (numbers for counts, not strings)
4. **Sanitize PII**: Never include sensitive personal information

### Performance

1. **Batch when possible**: Use batch generation events instead of individual events
2. **Async recording**: Events are fire-and-forget, don't block user actions
3. **Error handling**: Analytics failures shouldn't break app functionality

### Privacy

1. **Anonymize IPs**: Store anonymized IP addresses only
2. **Session-based**: Use session IDs instead of user IDs when possible
3. **Internal flagging**: Mark admin/test events as `is_internal = true`
4. **Retention**: Follow data retention policies for event data

---

## 📚 Related Documentation

- **Analytics Service:** [server/src/services/analyticsService.js](../../server/src/services/analyticsService.js)
- **Database Schema:** [docs/database/DB-NAMING-STANDARDS.md](../database/DB-NAMING-STANDARDS.md)
- **Admin Dashboard:** [client/src/pages/admin/Analytics.jsx](../../client/src/pages/admin/Analytics.jsx)
- **Workflow Metrics:** [WORKFLOW-OUTCOME-METRICS-PLAN.md](WORKFLOW-OUTCOME-METRICS-PLAN.md)
- **Testing Guide:** [docs/testing/README.md](../testing/README.md)

---

**Version:** 3.3.9
**Categories:** 4 (workflow, business, usage, system)
**Total Events:** 19
**Last Audit:** January 11, 2026
**Recent Additions:** `email_verified`, `first_generation` (v3.3.9)
