# Password Reset Setup Guide

This guide covers setting up the password reset functionality for CodeScribe AI.

## Overview

The password reset flow allows users to securely reset their passwords via email:

1. User requests password reset by entering their email
2. System generates a secure random token (64 chars hex)
3. Token is stored in database with 1-hour expiration
4. Email sent to user with reset link containing token
5. User clicks link, enters new password
6. Token is validated and password is updated
7. Token is invalidated after use

## Database Setup

### Run Migration

The password reset feature requires two new database columns. We use a Node.js migration runner that works without requiring `psql` installed locally.

**Prerequisites:**
- `POSTGRES_URL` set in `server/.env`

**Run the migration:**

```bash
cd server
node src/db/runMigration.js
```

**What it does:**
1. Connects to your Neon database using the `pg` package
2. Reads and executes `migrations/add-reset-token-fields.sql`
3. Adds `reset_token_hash` and `reset_token_expires` columns (idempotent)
4. Creates index on `reset_token_hash` for fast lookups
5. Verifies the migration and displays results

**Expected output:**
```
📦 Running migration: add-reset-token-fields.sql

✅ Migration completed successfully!

📋 Verification Results:
┌─────────┬────────────────────────┬─────────────────────┬─────────────┐
│ (index) │      column_name       │      data_type      │ is_nullable │
├─────────┼────────────────────────┼─────────────────────┼─────────────┤
│    0    │ 'reset_token_hash'     │ 'character varying' │    'YES'    │
│    1    │ 'reset_token_expires'  │ 'timestamp...'      │    'YES'    │
└─────────┴────────────────────────┴─────────────────────┴─────────────┘
```

### Migration Features

**Idempotent:**
- Safe to run multiple times
- Checks if columns exist before adding
- Uses `CREATE INDEX IF NOT EXISTS`

**No local dependencies:**
- No `psql` required on your machine
- Works directly with Neon via SSL connection
- Uses existing `pg` package from project dependencies

**Alternative: Manual SQL**

If you prefer to run SQL manually via Neon Console:

```sql
-- Add reset token columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_token_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_token_expires'
    ) THEN
        ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
    END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token_hash);
```

## Email Service Setup

### Install Resend Package

```bash
cd server
npm install resend
```

### Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

### Environment Variables

Add to `server/.env`:

```bash
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="CodeScribe AI <onboarding@codescribeai.com>"

# Client URL (for email links)
CLIENT_URL=http://localhost:5173  # Development
# CLIENT_URL=https://codescribeai.com  # Production
```

### Domain Setup (Production Only)

For production, you'll need to:

1. **Add and verify your domain** in Resend dashboard
2. **Update DNS records** with provided values:
   - TXT record for domain verification
   - MX records for email receiving (optional)
   - DKIM records for email authentication
3. **Update EMAIL_FROM** to use your verified domain

**Free Tier Limits:**
- 3,000 emails/month
- 100 emails/day
- Single domain verification

**Development:**
- You can test without domain verification
- Emails will only be sent to your verified Resend account email
- Perfect for testing the flow

## Frontend Setup

### Enable Authentication

Add to `client/.env`:

```bash
VITE_ENABLE_AUTH=true
```

### Test the Flow

1. Start both servers:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

2. Navigate to http://localhost:5173

3. Click "Sign In" → "Forgot Password?"

4. Enter your email and submit

5. Check your email for reset link

6. Click link or navigate to:
   ```
   http://localhost:5173/reset-password?token=YOUR_TOKEN
   ```

7. Enter new password and submit

8. Sign in with new password

## API Endpoints

### Request Password Reset

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Notes:**
- Always returns success (prevents email enumeration)
- Only sends email if user exists
- Only works for email/password users (not OAuth-only)
- Token expires in 1 hour

### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "64-character-hex-token",
  "password": "newSecurePassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

```json
{
  "success": false,
  "error": "This account uses OAuth authentication and cannot reset password"
}
```

## Security Features

### Token Security
- **Cryptographically random**: Uses `crypto.randomBytes(32)`
- **64 characters**: Hex encoding provides 256 bits of entropy
- **Single-use**: Token is deleted after successful reset
- **Time-limited**: 1-hour expiration
- **Stored securely**: Only token value stored (not hashed for lookup efficiency)

### Attack Prevention
- **Email enumeration**: Always returns success
- **Rate limiting**: TODO - Add rate limiting middleware
- **OAuth users**: Prevented from using password reset
- **Token reuse**: Invalidated after use
- **Expiration**: Automatic after 1 hour

### Best Practices
1. Use HTTPS in production (Vercel provides automatically)
2. Consider adding rate limiting to prevent abuse
3. Monitor for suspicious activity
4. Log all password reset attempts
5. Consider adding CAPTCHA for high-traffic sites

## Email Template Customization

The email template is in `server/src/services/emailService.js`:

```javascript
export async function sendPasswordResetEmail({ to, resetToken }) {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;

  // Customize the email HTML here
  // Current template uses CodeScribe AI brand colors
  // - Purple gradient header (#9333ea to #6366f1)
  // - Clean, accessible layout
  // - Mobile responsive
}
```

**Customization points:**
- Brand colors and logo
- Email copy and tone
- Button styling
- Footer information
- Support contact

## Testing

### Manual Testing Checklist

- [ ] Request reset for existing user → Receive email
- [ ] Request reset for non-existent user → No email, still shows success
- [ ] Request reset for OAuth-only user → No email, still shows success
- [ ] Click email link → Redirected to reset page with token
- [ ] Submit new password → Success message and redirect
- [ ] Try to reuse token → Error message
- [ ] Wait 1 hour and try token → Error message
- [ ] Sign in with new password → Success

### Automated Testing

TODO: Add E2E tests for password reset flow

```javascript
// Example test structure
describe('Password Reset Flow', () => {
  it('should send reset email for valid user', async () => {
    // Test implementation
  });

  it('should reset password with valid token', async () => {
    // Test implementation
  });

  it('should reject expired tokens', async () => {
    // Test implementation
  });

  it('should reject reused tokens', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Email not received

1. **Check spam folder**: Reset emails might be filtered
2. **Verify Resend API key**: Check `RESEND_API_KEY` in `.env`
3. **Check email address**: Ensure it's the one registered
4. **Domain verification**: In production, verify domain in Resend
5. **Check logs**: Look for email sending errors in server logs

### Token invalid or expired

1. **Check expiration**: Tokens expire after 1 hour
2. **Single use**: Token is deleted after first use
3. **Database sync**: Ensure migration ran successfully
4. **Clock skew**: Check server time is correct

### OAuth users cannot reset

This is expected behavior:
- OAuth users (GitHub) don't have passwords
- They should use "Sign in with GitHub" instead
- If they need password auth, they must create a new account

## Production Deployment

### Vercel Deployment

1. **Add environment variables** in Vercel dashboard:
   ```
   RESEND_API_KEY=re_live_...
   EMAIL_FROM=CodeScribe AI <onboarding@codescribeai.com>
   CLIENT_URL=https://codescribeai.com
   ```

2. **Run database migration** on production database:
   ```bash
   # Set production POSTGRES_URL in your local .env temporarily
   # OR run this directly with the connection string:
   cd server
   POSTGRES_URL="your-production-postgres-url" node src/db/runMigration.js
   ```

   The migration runner automatically:
   - Connects via SSL to Neon
   - Executes the migration idempotently
   - Verifies the results

3. **Verify domain** in Resend (production only)

4. **Deploy** and test the flow

### Monitoring

Monitor these metrics:
- Password reset requests per day
- Successful password resets
- Email delivery failures
- Token expiration rate
- Failed reset attempts

### Cost Estimate

**Resend Free Tier:**
- 3,000 emails/month = $0
- Supports ~100 password resets/day
- Sufficient for first 1,500 users (assuming 2 resets/user)

**Resend Pro Tier ($20/month):**
- 50,000 emails/month
- Supports ~1,600 password resets/day
- Sufficient for 25,000+ users

## Future Enhancements

1. **Rate limiting**: Prevent abuse of password reset endpoint
2. **Email verification**: Require email verification before password reset
3. **Password strength meter**: Visual feedback on password strength
4. **Security notifications**: Email user when password is changed
5. **2FA integration**: Require 2FA code for password reset
6. **Password history**: Prevent reusing recent passwords
7. **Account recovery**: Additional recovery options (security questions, backup codes)

## Related Documentation

- [Authentication System](../planning/mvp/06-Auth-Implementation.md)
- [Email Service Integration](../planning/mvp/08-Email-Integration.md)
- [API Reference](../api/API-Reference.md)
- [Security Best Practices](../security/SECURITY.md)

---

**Last Updated:** October 24, 2025
**Version:** 1.0
**Status:** Complete - Ready for production
