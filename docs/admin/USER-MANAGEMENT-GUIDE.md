# User Management Guide

**Audience:** Admins and Support Team
**Purpose:** How to manage users, grant trials, handle special cases
**Last Updated:** January 14, 2026

---

## Table of Contents

1. [Grant Trial Workflow](#grant-trial-workflow)
2. [Force Grant Feature](#force-grant-feature)
3. [Trial History](#trial-history)
4. [When to Use Force Grants](#when-to-use-force-grants)
5. [Audit & Analytics](#audit--analytics)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Grant Trial Workflow

### Standard Grant (Eligible Users)

**When to Use:** User has never had a trial before and qualifies for the trialProgram.

**Steps:**

1. Navigate to **Admin > Users**
2. Find the user (search by email or name)
3. Click **Grant Trial** button
4. Fill in the modal:
   - **Trial Tier:** Pro or Team
   - **Duration:** 1-90 days (default: 14)
   - **Reason:** Minimum 5 characters (e.g., "Customer request via support ticket #1234")
5. Click **Grant Trial**

**Result:**
- User receives trial immediately
- Email notification sent
- Analytics event: `trial.admin_grant_succeeded`
- Audit log entry created
- Source: `admin_grant`

**Example Reasons (Regular Grant):**
- "Customer request via support ticket #1234"
- "Sales demo for enterprise prospect"
- "Apology for service outage"
- "Partner referral program"

---

## Force Grant Feature

### Overview

The **force grant** feature allows admins to override eligibility checks and grant trials to users who have already used a trial. This is designed for exceptional cases only.

### When Force Option Appears

The force checkbox appears automatically when:
- User has used a trial before, OR
- User has an active trial, OR
- User is blocked by campaign eligibility rules (cooldown, max trials)

When you attempt a regular grant and the user is ineligible, the modal will:
1. Show an **eligibility warning banner** with the specific reason
2. Display the user's **trial history** (last 3 trials)
3. Reveal the **Force grant trial** checkbox

### Force Grant Requirements

**Minimum Reason Length:** 20 characters (vs. 5 for regular grants)

**Why?** Force grants bypass business rules and should only be used for exceptional cases. A detailed justification helps with:
- Audit compliance
- Pattern detection (are we forcing grants too often?)
- Support ticket tracking
- Business decision review

**Example Reasons (Force Grant):**
- "Urgent enterprise deal - CEO approved exception for key prospect (Acme Corp) - Ticket #5678"
- "User experienced severe platform bug that consumed entire trial period - Compensation approved by Product Manager"
- "VIP customer (lifetime value $50k+) requested second trial for new team members - Sales Director authorized"
- "Partner program exception: User signed up before realizing partner discount available - Marketing approved"

**Bad Reasons (Too Short/Vague):**
- ❌ "Customer request" (11 chars, no context)
- ❌ "Special case" (12 chars, vague)
- ❌ "Sales approved" (14 chars, no details)

### Force Grant Workflow

**Steps:**

1. Attempt a regular grant (as above)
2. If ineligible, modal shows:
   - ⚠️ **Warning banner** with eligibility reason
   - **Trial history** (last 3 trials with dates and sources)
   - **Force checkbox** (unchecked by default)
3. Review the trial history:
   - How many trials has this user had?
   - When did they end?
   - Were any of them forced grants? (marked with ⚠️)
4. Check the checkbox: **"Force grant trial (override eligibility check)"**
5. Enter a **detailed reason** (minimum 20 characters)
   - Include: ticket number, approver, business context
6. Button text changes to **"Force Grant Trial"** (visual confirmation)
7. Click **Force Grant Trial**

**Result:**
- Trial granted despite ineligibility
- Source set to: `admin_grant_forced` (vs. `admin_grant`)
- Analytics event includes:
  - `forced: true`
  - `override_reason: <eligibility reason that was bypassed>`
  - `previous_trial_count: <number>`
  - `has_previous_trial: true`
- Audit log metadata includes:
  - `forced: true`
  - `override_reason: <reason>`
  - `previous_trial_count: <number>`
- Email notification sent to user
- Trial history shows ⚠️ indicator next to forced grants

---

## Trial History

### Viewing Trial History

**Access:** Automatically loaded when you open the Grant Trial modal for any user.

**What You See:**
- Last 3 trials (most recent first)
- For each trial:
  - **Tier** (Pro/Team)
  - **Source** (invite, campaign, admin_grant, admin_grant_forced)
  - **Date range** (started_at to ends_at)
  - **Forced indicator** (⚠️ if source includes "forced")

**Example Display:**
```
Trial History (Last 3):
• Team (admin_grant_forced) - Dec 1, 2025 to Dec 31, 2025 ⚠️ Forced
• Pro (trialProgram) - Jun 15, 2025 to Jun 29, 2025
• Pro (invite) - Jan 10, 2025 to Jan 24, 2025
```

**Full History API Endpoint:**

If you need to see all trials (not just last 3):

```bash
GET /api/admin/users/:userId/trial-history
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "success": true,
  "trials": [
    {
      "id": 1,
      "trial_tier": "pro",
      "source": "invite",
      "status": "expired",
      "started_at": "2025-01-10T00:00:00.000Z",
      "ends_at": "2025-01-24T00:00:00.000Z",
      "duration_days": 14,
      "converted_at": null,
      "converted_to_tier": null,
      "created_at": "2025-01-10T00:00:00.000Z"
    }
  ]
}
```

**Analytics Tracking:**

When you view trial history, we track:
- Event: `admin_action`
- Metadata:
  - `action: "view_trial_history"`
  - `target_user_id: <user-id>`
  - `trial_count: <number>`
  - `is_internal: true`

---

## When to Use Force Grants

### Decision Matrix

| Scenario | Use Force? | Reason |
|----------|------------|--------|
| User never had a trial | ❌ No | Use regular grant (no force needed) |
| User had trial 6 months ago, expired | ❌ No | User is likely eligible for re-engagement campaigns |
| User had trial last week, wants another | ⚠️ Maybe | Only if urgent business reason (sales deal, VIP, bug compensation) |
| User has active trial, wants different tier | ❌ No | User should cancel current trial first, or wait for it to expire |
| User hit campaign trial limit (3 trials) | ⚠️ Maybe | Only if exceptional case (VIP, partner program, major bug) |
| Sales team needs trial for enterprise demo | ✅ Yes (if user ineligible) | Business-critical, sales approved |
| User experienced platform bug during trial | ✅ Yes | Compensation for poor experience, Product/Support approved |
| VIP customer (high lifetime value) | ✅ Yes | Retention, executive approved |
| Partner program exception | ✅ Yes | Marketing/Partnerships approved |

### Red Flags (When NOT to Force)

❌ **Don't force grant if:**
- User is abusing trials (multiple trials with no payment intent)
- Reason is vague or lacks approval
- You don't have business justification
- User is attempting fraud (e.g., multiple accounts)
- Request is from unverified source

⚠️ **Warning Signs:**
- User has 3+ forced grants in history
- User has never paid despite 5+ trials
- User requesting trials for "testing purposes" repeatedly
- Same user requesting trials for "different team members" without verification

**Escalate to Leadership if:**
- User has 2+ forced grants already
- Request lacks clear business justification
- You suspect fraud or abuse
- Request involves financial compensation or legal concerns

---

## Audit & Analytics

### What Gets Logged

**Every trial grant (regular or forced) creates:**

1. **Trial Record** (trials table)
   - `user_id`, `trial_tier`, `duration_days`
   - `source`: "admin_grant" or "admin_grant_forced"
   - `started_at`, `ends_at`, `status`

2. **Audit Log Entry** (user_audit_log table)
   - `user_id`, `user_email`
   - `field_name: "trial"`
   - `old_value: null`, `new_value: <tier>`
   - `change_type: "update"`
   - `changed_by: <admin-user-id>`
   - `reason: <your justification>`
   - `metadata: { admin_email, trial_tier, duration_days, trial_id, action: "grant_trial", forced: true/false, override_reason: <eligibility reason if forced>, previous_trial_count: <number> }`

3. **Analytics Event** (analytics_events table via analyticsService)
   - `event_name: "trial"`
   - `user_id: <target-user-id>`
   - `metadata: { action: "admin_grant_succeeded", forced: true/false, source: "admin_grant" or "admin_grant_forced", tier, duration_days, override_reason: <if forced>, previous_trial_count: <if forced>, has_previous_trial: true/false, is_internal: true }`

### Monitoring Force Grants

**Query Example (PostgreSQL):**

```sql
-- Count force grants by admin in last 30 days
SELECT
  changed_by,
  u.email as admin_email,
  COUNT(*) as force_grant_count
FROM user_audit_log ual
LEFT JOIN users u ON u.id = ual.changed_by
WHERE
  ual.field_name = 'trial'
  AND ual.metadata::jsonb->>'forced' = 'true'
  AND ual.created_at >= NOW() - INTERVAL '30 days'
GROUP BY changed_by, u.email
ORDER BY force_grant_count DESC;
```

**Analytics Dashboard (Future):**

We track force grants in analytics, which will power dashboards showing:
- Force grant rate (% of total grants)
- Top admins by force grants
- Common override reasons
- User abuse patterns (users with multiple forced grants)
- Force grant trends over time

---

## Best Practices

### 1. Always Check Trial History First

Before granting any trial, review the user's history:
- How many trials have they had?
- When did they end?
- Did they convert to paid?
- Were any forced grants?

**Why?** Helps you identify:
- Repeat trial users who never pay
- Abuse patterns
- Whether user qualifies for campaign vs. force grant

### 2. Document Your Reason Thoroughly

**Include:**
- Ticket number (if applicable)
- Approver name and role (if applicable)
- Business context (sales deal, bug compensation, VIP, etc.)
- User account details (company name, deal size, etc.)

**Example:**
"Enterprise deal with Acme Corp ($100k ARR) - Sales VP approved extended trial for technical evaluation - Ticket #5678"

### 3. Escalate Unusual Requests

**Escalate to Support Lead or Product Manager if:**
- User has 2+ forced grants already
- Request involves financial compensation
- User is flagged for fraud or abuse
- Request lacks clear business justification
- You're uncertain whether to approve

### 4. Use Regular Campaigns When Possible

**Instead of forcing grants, consider:**
- Creating a re-engagement campaign with 90-day cooldown
- Creating a partner program campaign with higher trial limits
- Creating a VIP campaign for high-value customers

**Why?** Campaigns are tracked separately and designed for specific user segments. Force grants should be truly exceptional.

### 5. Review Force Grant Patterns Quarterly

**Questions to Ask:**
- Are we forcing grants too often?
- Are certain admins forcing more than others?
- Are users with forced grants converting to paid?
- Do we need to adjust campaign eligibility rules?

**Goal:** Keep force grants under 5% of total grants.

---

## Troubleshooting

### Issue: "User has already used a trial" but I need to grant one

**Solution:** Use the force grant feature (see [Force Grant Feature](#force-grant-feature) above).

**Steps:**
1. Attempt regular grant
2. Modal shows warning and force checkbox
3. Check force checkbox
4. Enter detailed reason (20+ chars)
5. Click "Force Grant Trial"

---

### Issue: Force checkbox doesn't appear

**Possible Causes:**
1. User has never had a trial → No force needed, use regular grant
2. JavaScript error in modal → Check browser console
3. API response missing `canForce: true` → Check network tab

**Solution:**
- If user is eligible, use regular grant (no force needed)
- If user is ineligible but checkbox missing, check browser console for errors
- Contact engineering if API response is malformed

---

### Issue: "Reason must be at least 20 characters" error

**Cause:** You checked the force checkbox but your reason is too short.

**Solution:** Expand your reason to include:
- Ticket number
- Approver
- Business context
- User details

**Example:**
- ❌ "Sales approved" (14 chars)
- ✅ "Sales VP approved trial for Acme Corp enterprise deal - Ticket #5678" (69 chars)

---

### Issue: User not receiving trial email

**Possible Causes:**
1. Email verification not completed
2. Email bounced (invalid address)
3. Email in spam folder
4. Resend API failure

**Solutions:**
1. Check user's email verification status (Admin > Users > View Details)
2. Check Resend dashboard for bounces/failures
3. Ask user to check spam folder
4. Resend trial email manually via Admin UI (future feature)

**Temporary Workaround:**
- Contact user directly with trial details
- Confirm they can log in and see trial status in Usage page

---

### Issue: User says trial didn't start but grant succeeded

**Debugging Steps:**

1. **Verify trial record created:**
   ```sql
   SELECT * FROM trials WHERE user_id = <user-id> ORDER BY created_at DESC LIMIT 1;
   ```

2. **Check trial status:**
   - `status: "active"` → Trial is active
   - `status: "expired"` → Trial ended (check ends_at)
   - `status: "converted"` → User already paid

3. **Check user's tier:**
   ```sql
   SELECT id, email, tier, trial_tier, trial_ends_at FROM users WHERE id = <user-id>;
   ```
   - `trial_tier` should match granted tier
   - `trial_ends_at` should be in the future

4. **Check auth middleware:**
   - Middleware attaches `isOnTrial`, `trialTier`, `effectiveTier` to user object
   - Frontend reads from this data
   - Ask user to log out and log back in (refreshes token)

**Common Fix:**
- User needs to log out and log back in to see trial (token needs refresh)
- Trial may have been granted but user's session is stale

---

### Issue: Force grant failed with validation error

**Possible Causes:**
1. Reason too short (<20 chars)
2. Invalid trial tier (not "pro" or "team")
3. Invalid duration (not 1-90 days)
4. User ID not found

**Solution:**
1. Check reason length
2. Use only "pro" or "team" for tier
3. Use duration between 1-90 days
4. Verify user exists in database

**If error persists:**
- Check browser console for full error message
- Check server logs for backend validation errors
- Contact engineering if validation logic seems incorrect

---

## Related Documentation

- [Trial Program Management Guide](./CAMPAIGN-MANAGEMENT-GUIDE.md) - Creating and managing trial programs
- [Admin Usage Stats](./ADMIN-USAGE-STATS.md) - Monitoring user activity and quotas
- [Trial Eligibility WF PRD](../planning/trial-eligibility-enhancement/TRIAL-ELIGIBILITY-WF-PRD.md) - Product requirements and workflows

---

**Questions or Issues?**
Contact the engineering team or refer to the troubleshooting section above.
