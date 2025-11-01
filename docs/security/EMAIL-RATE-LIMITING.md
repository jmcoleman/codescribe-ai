# Email Rate Limiting

**Purpose:** Prevent email quota exhaustion and abuse
**Created:** October 31, 2025
**Last Updated:** October 31, 2025
**Status:** ✅ Implemented (Rate Limiting + Email Mocking)

---

## Overview

Email rate limiting prevents:
- **Quota exhaustion** - Avoid hitting daily/monthly email service limits (Resend free tier: 100/day)
- **Abuse prevention** - Stop malicious users from spamming
- **Cost control** - Reduce email service costs
- **Better UX** - Prevent accidental duplicate emails
- **Development safety** - Mock emails in dev/test to prevent quota waste

---

## Rate Limit Strategy

### Email Verification Resend

**Limits:**
- **Cooldown:** 5 minutes (300 seconds) between resends
- **Daily Max:** 10 emails per user per day
- **Scope:** Per user ID (authenticated users only)

**Rationale:**
- Prevents accidental button spam
- Allows legitimate retries (email didn't arrive, wrong inbox, etc.)
- Industry standard: GitHub uses 5-minute cooldown

**Implementation:**
```javascript
// File: server/src/routes/auth.js
POST /api/auth/resend-verification

Rate limit: 1 email per 5 minutes per user
Daily limit: 10 emails per user
```

---

### Password Reset

**Limits:**
- **Cooldown:** 5 minutes (300 seconds) between requests
- **Hourly Max:** 3 emails per email address
- **Daily Max:** 10 emails per email address
- **Scope:** Per email address (unauthenticated endpoint)

**Rationale:**
- Prevents brute force attacks
- Stops email enumeration
- Allows legitimate use cases (forgot which email, multiple retries)
- Industry standard: Google uses 3 per hour

**Implementation:**
```javascript
// File: server/src/routes/auth.js
POST /api/auth/forgot-password

Cooldown: 5 minutes per email address
Hourly limit: 3 emails per email address
Daily limit: 10 emails per email address
```

---

### New User Signup

**No rate limiting applied**

**Rationale:**
- IP-based limiting is problematic:
  - Corporate/university networks share IPs
  - Public WiFi (coffee shops, airports)
  - Mobile carriers use carrier-grade NAT
  - VPNs share exit nodes
- Protection via:
  - Email verification required
  - Unique email constraint in database
  - Can add reCAPTCHA/Turnstile later if needed

---

## Implementation Details

### Rate Limit Storage

**Option 1: In-Memory Cache (Current)**
```javascript
const emailRateLimitCache = new Map();
// Key: userId or email
// Value: timestamp of last email sent
```

**Pros:**
- Simple, no dependencies
- Fast lookups
- Good for single-server deployments

**Cons:**
- Resets on server restart
- Doesn't work across multiple servers/regions
- Not persistent

**Option 2: Redis (Future)**
```javascript
// Store in Redis with TTL
await redis.setex(`email:resend:${userId}`, 300, Date.now());
```

**Pros:**
- Persistent across restarts
- Works with multiple servers
- Built-in TTL expiration

**When to upgrade:** If you deploy across multiple regions or see rate limit cache inconsistencies

---

## Error Responses

### Cooldown Active (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Please wait 234 seconds before requesting another verification email"
}
```

**Frontend Handling:**
- Show friendly message: "Please wait 4 minutes before trying again"
- Disable "Resend Email" button with countdown timer
- Use toast notification

### Daily Limit Exceeded (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Daily email limit exceeded. Please try again tomorrow or contact support."
}
```

**Frontend Handling:**
- Show error message
- Suggest alternative: "Check spam folder" or "Contact support"
- Disable resend button until next day

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Email Send Rate**
   - Total emails sent per hour/day
   - Group by type (verification, password reset)
   - Alert if approaching quota (80% of daily limit)

2. **Rate Limit Hits**
   - Number of 429 responses per endpoint
   - Alert if sudden spike (possible attack)

3. **Email Service Quota**
   - Current usage vs. plan limits
   - Resend free tier: 100/day, 3,000/month
   - Alert at 80% and 95% of quota

### Vercel Logs

Search for rate limit violations:
```bash
# Search production logs
vercel logs --project=codescribe-ai | grep "Please wait"
vercel logs --project=codescribe-ai | grep "429"
```

---

## Configuration

### Environment Variables

No environment variables needed currently. All limits are hardcoded constants.

### Adjusting Limits

To change rate limits, edit:
- **File:** `server/src/routes/auth.js`
- **Constants:**
  - `EMAIL_VERIFICATION_COOLDOWN_MS`
  - `EMAIL_VERIFICATION_DAILY_MAX`
  - `PASSWORD_RESET_COOLDOWN_MS`
  - `PASSWORD_RESET_HOURLY_MAX`
  - `PASSWORD_RESET_DAILY_MAX`

---

## Email Mocking (Development/Test)

**Status:** ✅ Implemented in `server/src/services/emailService.js`

### How It Works

Emails are automatically mocked in non-production environments to prevent quota waste:

**Environment Detection:**
- `NODE_ENV !== 'production'` → Emails are mocked
- `NODE_ENV === 'production'` → Real emails sent via Resend

**Mock Email Output:**
```
📧 [MOCK EMAIL] Would have sent:
  To: user@example.com
  Subject: Verify Your Email - CodeScribe AI
  From: CodeScribe AI <noreply@mail.codescribeai.com>
  Links: http://localhost:5173/verify-email?token=abc123
  [Email NOT actually sent - mocked in dev/test mode]
```

**Production Email Output:**
```
📧 [EMAIL SENT] Email Verification
  To: user@example.com
  Subject: Verify Your Email - CodeScribe AI
  Verify URL: https://codescribeai.com/verify-email?token=abc123
  Email ID: re_xyz789
  Timestamp: 2025-10-31T23:45:00.000Z
```

### Benefits

✅ **No quota waste** - Development testing doesn't consume Resend quota
✅ **Safe testing** - Test rate limiting without hitting real email limits
✅ **Easy debugging** - See verification/reset URLs directly in logs
✅ **Consistent logging** - Same format in dev and production for easy monitoring

---

## Testing

### Manual Testing (No Quota Usage!)

**Test verification resend cooldown:**
```bash
# Start dev server (emails will be mocked automatically)
cd server && npm run dev

# 1. Sign up new user
POST http://localhost:3000/api/auth/signup
{ "email": "test@example.com", "password": "Password123!" }

# 2. Immediately resend (should succeed, see mock email in logs)
POST http://localhost:3000/api/auth/resend-verification
Authorization: Bearer <token>

# 3. Try again within 5 minutes (should fail with 429)
POST /api/auth/resend-verification
Authorization: Bearer <token>
# Expected: "Please wait X seconds..."

# 4. Wait 5 minutes and retry (should succeed)
```

### Automated Tests

See: `server/src/routes/__tests__/auth-rate-limiting.test.js` (TODO)

---

## Incident Response

### What to do if quota is exceeded:

**1. Investigate (5 minutes)**
- Check Resend dashboard for email breakdown
- Check Vercel logs for unusual activity
- Run: `RESEND_API_KEY=xxx node /tmp/check_resend_emails.js`

**2. Immediate Mitigation (10 minutes)**
- Remove `RESEND_API_KEY` from Vercel environment variables (stops all emails)
- Deploy rate limiting fix if bug found
- Switch to backup email service if needed

**3. Root Cause Analysis (30 minutes)**
- Review code changes in last 24 hours
- Check for loops or automation sending emails
- Verify test suite doesn't send real emails

**4. Prevention (ongoing)**
- Add monitoring/alerting at 80% quota
- Consider upgrading email service plan
- Add frontend button debouncing

---

## Alternative Email Services

If Resend quota is consistently exceeded:

| Service | Free Tier | Pricing | Notes |
|---------|-----------|---------|-------|
| **Resend** | 100/day, 3,000/mo | $20/mo for 50K | Current service |
| **Mailgun** | 5,000/mo for 3 months | $35/mo for 50K | Good for production |
| **SendGrid** | 100/day forever | $20/mo for 40K | Reliable, established |
| **AWS SES** | 3,000/mo (with AWS free tier) | $0.10/1,000 emails | Cheapest at scale |
| **Postmark** | 100/mo trial | $15/mo for 10K | Best deliverability |

**Recommendation:** Start with Resend (easy setup), upgrade to Mailgun or AWS SES if volume grows.

---

## Industry Best Practices

### Email Rate Limiting Standards

| Company | Verification Resend | Password Reset |
|---------|-------------------|----------------|
| **GitHub** | 1 per 5 minutes | 3 per hour |
| **Google** | 1 per 5 minutes | 3 per hour |
| **Stripe** | Exponential backoff | 5 per hour |
| **Twitter** | 1 per 10 minutes | 3 per hour |

**Our limits:** Aligned with GitHub/Google (5 min cooldown, 3/hour for resets)

---

## Related Documentation

- [ERROR-HANDLING-PATTERNS.md](../architecture/ERROR-HANDLING-PATTERNS.md) - App vs external API error handling (429 vs 503)
- [FREEMIUM-API-PROTECTION.md](./FREEMIUM-API-PROTECTION.md) - API rate limiting
- [RESEND-SETUP.md](../deployment/RESEND-SETUP.md) - Email service setup
- [EMAIL-VERIFICATION-SYSTEM.md](../authentication/EMAIL-VERIFICATION-SYSTEM.md) - Email verification flow
- [PASSWORD-RESET-SETUP.md](../authentication/PASSWORD-RESET-SETUP.md) - Password reset flow

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0
