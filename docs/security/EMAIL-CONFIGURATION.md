# Email Configuration Guide

**Last Updated:** November 5, 2025 (v2.5.3)

## Overview

CodeScribe AI uses [Resend](https://resend.com/) for transactional emails (password reset, email verification, support requests). The email system supports both **real email sending** and **console mocking** for development/testing.

---

## Configuration

### Environment Variables

**Required for real emails:**
- `RESEND_API_KEY`: Your Resend API key (get from [resend.com/api-keys](https://resend.com/api-keys))
- `EMAIL_FROM`: Sender email address (e.g., `"CodeScribe AI <dev@mail.codescribeai.com>"`)

**Optional destinations:**
- `SUPPORT_EMAIL`: Where support requests go (default: `support@codescribeai.com`)
- `SALES_EMAIL`: Where sales inquiries go (default: `sales@codescribeai.com`)

**Email mocking control:**
- `MOCK_EMAILS`: Controls whether emails are sent or mocked (see below)

---

## Email Mocking Behavior

The `MOCK_EMAILS` environment variable controls whether emails are actually sent via Resend or just logged to the console.

### Behavior

| `MOCK_EMAILS` Value | Behavior |
|---------------------|----------|
| `true` | **Always mock** (dev, test, production) - logs to console only |
| `false` | **Always send real emails** via Resend (dev, test, production) |
| Not set (default) | **Mock in dev/test**, send real in production (safe default) |

### Use Cases

**Development testing** (test real email delivery):
```bash
MOCK_EMAILS=false
RESEND_API_KEY=re_your_key_here
EMAIL_FROM="CodeScribe AI <dev@mail.codescribeai.com>"
```

**CI/CD tests** (avoid sending emails):
```bash
# Option 1: Explicitly mock
MOCK_EMAILS=true

# Option 2: Leave unset (will default to mocking in dev/test)
# MOCK_EMAILS=
```

**Production** (always send real emails):
```bash
# Option 1: Leave unset (recommended - will auto-detect production)
# MOCK_EMAILS=

# Option 2: Explicitly enable (not needed, but works)
MOCK_EMAILS=false
RESEND_API_KEY=re_your_production_key_here
EMAIL_FROM="CodeScribe AI <noreply@mail.codescribeai.com>"
```

### Safety Features

If you set `MOCK_EMAILS=false` but don't provide a `RESEND_API_KEY`, the system will:
1. Force mocking to prevent errors
2. Log a warning: `⚠️ MOCK_EMAILS=false but RESEND_API_KEY not set. Forcing mocking.`

---

## Server Startup Messages

The server displays the email configuration on startup:

```bash
============================================================
🚀 CodeScribe AI Server
============================================================
📍 URL: http://localhost:3000
🔐 Auth: ENABLED
📧 Emails: ENABLED (Resend - dev mode)  # ← Email status
============================================================
```

**Possible email statuses:**

| Status | Meaning |
|--------|---------|
| `MOCKED (MOCK_EMAILS=true)` | Explicitly mocking via env var |
| `MOCKED (development)` | Auto-mocking (dev mode, has API key) |
| `MOCKED (no API key)` | Auto-mocking (no API key provided) |
| `MOCKED (no API key - forced)` | Forced mocking (MOCK_EMAILS=false but no key) |
| `ENABLED (Resend)` | Real emails in production |
| `ENABLED (Resend - dev mode)` | Real emails in development (MOCK_EMAILS=false) |
| `DISABLED (no API key)` | Production without API key (error state) |

---

## Mock Email Output

When emails are mocked, you'll see detailed console logs:

```
📧 [MOCK EMAIL] Would have sent:
  To: user@example.com
  Subject: Reset Your Password - CodeScribe AI
  From: CodeScribe AI <dev@mail.codescribeai.com>
  Links: https://codescribeai.com/reset-password?token=abc123
  [Email NOT actually sent - mocked in dev/test mode]
```

---

## Real Email Output

When emails are sent via Resend, you'll see success logs:

```
📧 [EMAIL SENT] Support Request
  To: support@codescribeai.com
  From User: user@example.com
  Subject: [FREE] Bug Report: App crashes on upload
  Type: Bug Report
  Email ID: 3d4f5g6h-7i8j-9k0l-1m2n-3o4p5q6r7s8t
  Timestamp: 2025-11-05T17:34:29.794Z
```

---

## Implementation Details

### `shouldMockEmails()` Function

Located in `/server/src/services/emailService.js`:

```javascript
function shouldMockEmails() {
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  const MOCK_EMAILS = process.env.MOCK_EMAILS;
  const HAS_RESEND_KEY = !!process.env.RESEND_API_KEY;

  // If MOCK_EMAILS is explicitly set, respect it
  if (MOCK_EMAILS === 'true') return true;
  if (MOCK_EMAILS === 'false') {
    // Safety check: don't send real emails if no API key
    if (!HAS_RESEND_KEY) {
      console.warn('⚠️ MOCK_EMAILS=false but RESEND_API_KEY not set. Forcing mocking.');
      return true;
    }
    return false;
  }

  // Otherwise: mock in dev/test, real in production (safe default)
  return !IS_PRODUCTION;
}
```

### `getEmailStatus()` Function

Located in `/server/src/server.js` - matches `shouldMockEmails()` logic to display accurate startup messages.

---

## Email Types

CodeScribe AI sends these transactional emails:

1. **Email Verification** (`sendVerificationEmail`)
   - Sent when user signs up with email/password
   - Contains verification link (24-hour expiry)

2. **Password Reset** (`sendPasswordResetEmail`)
   - Sent when user requests password reset
   - Contains reset link (1-hour expiry)

3. **Support Request** (`sendSupportEmail`)
   - Sent when user submits support form
   - Goes to `SUPPORT_EMAIL` destination
   - Includes tier badge for triage priority

4. **Contact Sales** (`sendContactSalesEmail`)
   - Sent when user inquires about Enterprise/Team plans
   - Goes to `SALES_EMAIL` destination

5. **Account Deletion Scheduled** (`sendDeletionScheduledEmail`)
   - Sent when user requests account deletion
   - Contains restore link (30-day grace period)

6. **Account Restored** (`sendAccountRestoredEmail`)
   - Sent when user cancels account deletion
   - Confirmation of restore

7. **Final Deletion Warning** (`sendFinalDeletionWarningEmail`)
   - Sent 24 hours before permanent deletion
   - Last chance to restore account

---

## Troubleshooting

### Emails not arriving

1. **Check server logs**: Look for `[EMAIL SENT]` or `[MOCK EMAIL]`
2. **Verify configuration**: Run `grep MOCK_EMAILS server/.env` and `grep RESEND_API_KEY server/.env`
3. **Check spam folder**: Resend emails may be flagged by some providers
4. **Verify sender domain**: Ensure `EMAIL_FROM` uses a verified domain in Resend dashboard

### "Would have sent" logs but no email

This means emails are being mocked. Check:
1. Is `MOCK_EMAILS=true` in your `.env`?
2. Is `NODE_ENV=development` and `MOCK_EMAILS` not set?
3. Server startup shows `MOCKED` status?

**Fix:** Set `MOCK_EMAILS=false` in your `.env` and restart server.

### Warning: "Forcing mocking"

This warning means you set `MOCK_EMAILS=false` but didn't provide `RESEND_API_KEY`.

**Fix:** Add your Resend API key to `.env`:
```bash
RESEND_API_KEY=re_your_key_here
```

---

## Production Deployment

For production (Vercel), ensure these environment variables are set:

```bash
NODE_ENV=production
RESEND_API_KEY=re_your_production_key_here
EMAIL_FROM="CodeScribe AI <noreply@mail.codescribeai.com>"
SUPPORT_EMAIL=support@codescribeai.com
SALES_EMAIL=sales@codescribeai.com
# MOCK_EMAILS=  # Leave unset - will auto-detect production
```

**Verify domain in Resend:**
1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Add `mail.codescribeai.com` (or your custom domain)
3. Configure DNS records (SPF, DKIM, DMARC)
4. Wait for verification (usually 5-10 minutes)

---

## Related Documentation

- [RESEND-SETUP.md](../deployment/RESEND-SETUP.md) - Initial Resend setup guide
- [EMAIL-RATE-LIMITING.md](EMAIL-RATE-LIMITING.md) - Rate limiting for email sends
- [VERCEL-ENVIRONMENT-VARIABLES.md](../deployment/VERCEL-ENVIRONMENT-VARIABLES.md) - Vercel env var setup

---

## Changelog

### v2.5.3 (November 5, 2025)
- **Simplified email mocking logic**: Removed confusing `TEST_RESEND_MOCK` variable
- **Intuitive behavior**: `MOCK_EMAILS=false` now works as expected in development
- **Safety features**: Auto-force mocking if API key missing
- **Documentation**: Created comprehensive email configuration guide

### Previous Versions
- Email rate limiting added in v2.4.4
- Support/sales email functions added in v2.4.1
- Initial Resend integration in v2.0.0

---

**For questions or issues, contact support at support@codescribeai.com**
