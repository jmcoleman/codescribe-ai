# Trial System Guide

Complete guide for managing the invite-based trial system in CodeScribe AI.

---

## Overview

The trial system allows admins to invite users to experience Pro features for a limited time. Key features:

- **Invite-only access** via unique codes (XXXX-XXXX-XXXX format)
- **Configurable duration** (default 14 days)
- **Configurable tier** (Pro, Team, or Enterprise)
- **Watermarked output** during trial period
- **Admin controls** for code management and trial extensions

---

## Quick Start

### 1. Create an Invite Code

**Option A: Admin UI**
1. Navigate to `/admin/invite-codes`
2. Click "Create Code"
3. Configure:
   - **Trial Tier**: Pro (default), Team, or Enterprise
   - **Duration**: Number of days (default 14)
   - **Max Uses**: How many users can redeem this code (default 1)
   - **Valid Until**: Optional expiration date for the code itself
   - **Trial Program**: Optional tracking label (e.g., "beta-launch", "twitter-promo")
   - **Notes**: Internal notes
4. Click "Create"
5. The invite link is automatically copied to your clipboard

**Option B: API**
```bash
curl -X POST https://codescribeai.com/api/admin/invite-codes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trialTier": "pro",
    "durationDays": 14,
    "maxUses": 1,
    "campaign": "beta-testers"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "A1B2-C3D4-E5F6",
    "trialTier": "pro",
    "durationDays": 14,
    "maxUses": 1,
    "currentUses": 0,
    "status": "active",
    "inviteLink": "https://codescribeai.com/trial?code=A1B2-C3D4-E5F6"
  }
}
```

### 2. Share the Invite Link

Send the invite link to your beta tester:
```
https://codescribeai.com/trial?code=A1B2-C3D4-E5F6
```

Or share just the code: `A1B2-C3D4-E5F6`

### 3. User Redeems the Code

The user:
1. Visits the invite link (or goes to `/trial` and enters the code)
2. Signs in or creates an account
3. Code is automatically validated and redeemed
4. Trial begins immediately

---

## Admin Management

### Viewing All Codes

**UI**: Navigate to `/admin/invite-codes`

**API**:
```bash
curl https://codescribeai.com/api/admin/invite-codes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Pausing/Resuming a Code

Paused codes cannot be redeemed but aren't deleted.

**UI**: Click the pause/play button next to the code

**API**:
```bash
# Pause
curl -X PATCH https://codescribeai.com/api/admin/invite-codes/A1B2-C3D4-E5F6 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "paused"}'

# Resume
curl -X PATCH https://codescribeai.com/api/admin/invite-codes/A1B2-C3D4-E5F6 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### Extending a User's Trial

If a user needs more time:

```bash
curl -X PATCH https://codescribeai.com/api/admin/trials/USER_ID/extend \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "additionalDays": 7,
    "reason": "User requested more evaluation time"
  }'
```

### Viewing Trial Analytics

```bash
curl https://codescribeai.com/api/admin/trials/analytics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Returns conversion rates, active trials, expiring soon counts, etc.

---

## Code Statuses

| Status | Description |
|--------|-------------|
| `active` | Code can be redeemed |
| `paused` | Temporarily disabled, can be resumed |
| `exhausted` | Max uses reached |
| `expired` | Past valid_until date |

---

## User Experience

### Trial Banner

When a user has an active trial, a banner appears at the top of the app:

- **Purple theme**: Normal state, shows days remaining
- **Amber theme**: Urgent state (≤3 days remaining)
- Includes "Upgrade" button linking to pricing page
- Dismissable (persists for session)

### Trial Watermark

Generated documentation includes a footer watermark:

```
---
*🔶 Trial Access - Generated with [CodeScribe AI](https://codescribeai.com)*
*Trial expires: January 15, 2025 | [Upgrade to Pro](https://codescribeai.com/pricing) to remove this watermark*
```

### Trial Expiration

When a trial expires:
1. User is downgraded to Free tier
2. Account and documents are preserved
3. Pro features become inaccessible
4. Watermark remains on previously generated docs

---

## API Reference

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trials/status` | Get current trial status |
| POST | `/api/trials/redeem` | Redeem an invite code |
| GET | `/api/trials/validate/:code` | Validate code without redeeming |
| GET | `/api/trials/eligibility` | Check if user can start a trial |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/invite-codes` | Create new invite code |
| GET | `/api/admin/invite-codes` | List all invite codes |
| GET | `/api/admin/invite-codes/:code/stats` | Get code usage stats |
| PATCH | `/api/admin/invite-codes/:code` | Update code (pause, extend validity) |
| DELETE | `/api/admin/invite-codes/:code` | Delete a code |
| GET | `/api/admin/trials` | List all active/recent trials |
| GET | `/api/admin/trials/:userId` | Get user's trial details |
| PATCH | `/api/admin/trials/:userId/extend` | Extend user's trial |
| POST | `/api/admin/trials/:userId/cancel` | Cancel user's trial |
| GET | `/api/admin/trials/analytics` | Trial conversion analytics |

---

## Database Schema

### invite_codes
```sql
- id: SERIAL PRIMARY KEY
- code: VARCHAR(32) UNIQUE NOT NULL
- trial_tier: VARCHAR(50) DEFAULT 'pro'
- duration_days: INTEGER DEFAULT 14
- max_uses: INTEGER DEFAULT 1
- current_uses: INTEGER DEFAULT 0
- valid_from: TIMESTAMPTZ DEFAULT NOW()
- valid_until: TIMESTAMPTZ (optional)
- status: 'active' | 'paused' | 'exhausted' | 'expired'
- source: VARCHAR(100) DEFAULT 'admin' (origin type: admin, sales, marketing, partner)
- campaign: VARCHAR(100) (optional tracking label)
- notes: TEXT (optional internal notes)
- created_by_user_id: INTEGER REFERENCES users(id) (admin who created the code)
- created_at, updated_at: TIMESTAMPTZ
```

### user_trials
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER REFERENCES users(id)
- invite_code_id: INTEGER REFERENCES invite_codes(id)
- trial_tier: VARCHAR(50) DEFAULT 'pro'
- duration_days: INTEGER DEFAULT 14
- started_at: TIMESTAMPTZ DEFAULT NOW()
- ends_at: TIMESTAMPTZ NOT NULL
- status: 'active' | 'expired' | 'converted' | 'cancelled'
- converted_at: TIMESTAMPTZ (optional)
- converted_to_tier: VARCHAR(50) (optional)
- extended_at: TIMESTAMPTZ (optional)
- extended_by_user_id: INTEGER (optional)
- extension_reason: TEXT (optional)
- original_ends_at: TIMESTAMPTZ (optional)
- source: 'invite' | 'self_serve'
- created_at, updated_at: TIMESTAMPTZ
```

---

## Cron Jobs

### Trial Expiration Job

Runs daily at 9:00 AM EST (14:00 UTC) via Vercel Cron.

Tasks:
1. Send 3-day expiration reminder emails
2. Send 1-day expiration reminder emails
3. Mark expired trials as expired
4. Update exhausted invite codes

Endpoint: `POST /api/cron/trial-expirations`

---

## Troubleshooting

### Code shows "Invalid"
- Check if code exists and is spelled correctly
- Verify code status is "active" (not paused/exhausted/expired)
- Check if valid_until date has passed

### User can't redeem code
- Ensure user is logged in
- Check if user already has an active trial
- Verify code has remaining uses (current_uses < max_uses)

### Trial features not working
- Refresh the page to update user session
- Check browser console for auth errors
- Verify trial is still active (not expired)

### Watermark not appearing
- Watermark only appears on newly generated docs
- Previously generated docs retain their original attribution

---

## Future Enhancements

The architecture supports future self-serve trials:
- `user_trials.source` distinguishes 'invite' vs 'self_serve'
- `invite_code_id` is nullable for self-serve trials
- Add `POST /api/trials/start` endpoint (no code required)
- Use `trial_eligible` column to enforce one trial per user
