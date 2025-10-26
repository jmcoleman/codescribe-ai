# Resend Email Service Setup Guide

Complete guide for configuring Resend email service with custom domain verification for CodeScribe AI.

**Last Updated:** October 24, 2025
**Service:** [Resend](https://resend.com)
**Tier:** Free (3,000 emails/month, 100 emails/day)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Resend Account](#step-1-create-resend-account)
3. [Step 2: Generate API Key](#step-2-generate-api-key)
4. [Step 3: Add Domain in Resend](#step-3-add-domain-in-resend)
5. [Step 4: Configure DNS Records in Namecheap](#step-4-configure-dns-records-in-namecheap)
6. [Step 5: Verify Domain](#step-5-verify-domain)
7. [Step 6: Update Environment Variables](#step-6-update-environment-variables)
8. [Step 7: Test Email Sending](#step-7-test-email-sending)
9. [Troubleshooting](#troubleshooting)
10. [Cost Analysis](#cost-analysis)

---

## Prerequisites

- Active Namecheap account with domain access
- Access to DNS management for your domain
- Resend account (free tier available)
- CodeScribe AI application deployed

---

## Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with:
   - Email address
   - Or GitHub account (recommended for developers)
4. Verify your email address
5. Complete onboarding questionnaire (optional)

---

## Step 2: Generate API Key

1. Navigate to [API Keys](https://resend.com/api-keys) in the Resend dashboard
2. Click **"Create API Key"**
3. Configure:
   - **Name:** `CodeScribe AI Production` (or `Development`)
   - **Permission:** `Full Access` or `Sending Access`
   - **Domain:** Select your domain after adding it (or `All Domains` initially)
4. Click **"Create"**
5. **⚠️ COPY THE API KEY IMMEDIATELY** - it will only be shown once
6. Store securely (add to `.env` file, Vercel environment variables)

**API Key Format:**
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 3: Add Domain in Resend

### Option A: Root Domain (Recommended)

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click **"Add Domain"**
3. Enter your root domain: `codescribeai.com`
4. Select **"Use this domain for sending"**
5. Click **"Add"**

### Option B: Subdomain (Recommended for Production)

Using a subdomain like `mail.codescribeai.com` or `email.codescribeai.com` provides several benefits:

**Reputation Isolation:**
- Subdomain email reputation is separate from your main domain
- Protects your primary domain's SEO and website reputation if email issues occur
- Can replace/rotate subdomains without affecting main domain

**Better Deliverability:**
- Easier to track and troubleshoot email-specific metrics
- Clear separation in analytics between transactional emails and other services
- Subdomain-specific SPF/DKIM/DMARC policies optimized for email

**Security & Flexibility:**
- Limits DNS record scope to just the subdomain
- Reduces risk of misconfiguration affecting main domain
- Easy to add more subdomains for different email types (e.g., `marketing.codescribeai.com`)

**Professional Best Practice:**
- Used by major SaaS companies (e.g., `notifications.github.com`, `email.stripe.com`)
- Shows email deliverability expertise
- Recommended by most ESP providers including Resend

**Setup:**
- Domain: `mail.codescribeai.com` or `email.codescribeai.com`
- Emails sent from: `noreply@mail.codescribeai.com`
- DNS records use subdomain as host (e.g., `mail` instead of `@`)

**When to Use:**
- ✅ Production environments (reputation protection)
- ✅ High-volume sending (easier monitoring)
- ✅ Long-term projects (flexibility for growth)
- ⚠️ Optional for small portfolio projects or development

---

## Step 4: Configure DNS Records in Namecheap

After adding your domain, Resend will display DNS records to configure. Follow these steps:

### 4.1 Access Namecheap DNS Settings

1. Log in to [Namecheap](https://www.namecheap.com/)
2. Go to **"Domain List"**
3. Click **"Manage"** next to your domain
4. Navigate to **"Advanced DNS"** tab

### 4.2 Add SPF Record (TXT)

**Purpose:** Authorizes Resend to send emails on your behalf

**⚠️ Note:** There is no "SPF Record" type in Namecheap - SPF records are implemented as **TXT Records**.

- **Type:** `TXT Record` (not "SPF Record")
- **Host:** `@` (for root domain) or `mail` (for mail.codescribeai.com subdomain)
- **Value:** `v=spf1 include:resend.com ~all`
- **TTL:** `Automatic` or `300` (5 minutes)

**Example for subdomain mail.codescribeai.com:**
- Type: `TXT Record`
- Host: `mail`
- Value: `v=spf1 include:resend.com ~all`

**⚠️ Important:** If you already have an SPF record, **DO NOT create a duplicate**. Instead, modify the existing record to include Resend:

```
v=spf1 include:resend.com include:other-service.com ~all
```

### 4.3 Add DKIM Records (TXT)

**Purpose:** Cryptographic signature to verify email authenticity

Resend will provide 1-3 DKIM records. For each record:

- **Type:** `TXT Record`
- **Host:** Copy from Resend (e.g., `resend._domainkey`)
- **Value:** Copy exact value from Resend (long cryptographic key)
- **TTL:** `Automatic` or `300`

**Example:**
```
Host: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (long key)
```

**Note:** If the DKIM value exceeds Namecheap's character limit (~255 chars), Resend may provide it in multiple parts. Add each part as instructed by Resend.

### 4.4 Add MX Record (Optional)

**Purpose:** Receive bounce/feedback notifications (recommended)

- **Type:** `MX Record`
- **Host:** `@`
- **Value:** `feedback-smtp.resend.com`
- **Priority:** `10`
- **TTL:** `Automatic`

### 4.5 Add DMARC Record (Optional but Recommended)

**Purpose:** Email authentication policy

- **Type:** `TXT Record`
- **Host:** `_dmarc`
- **Value:** `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
- **TTL:** `Automatic`

**DMARC Policy Levels:**
- `p=none` - Monitor only (recommended for initial setup)
- `p=quarantine` - Mark suspicious emails as spam
- `p=reject` - Reject unauthorized emails (use after testing)

---

## Step 5: Verify Domain

### 5.1 Initiate Verification

1. Return to [Domains](https://resend.com/domains) in Resend dashboard
2. Find your domain in the list
3. Click **"Verify"** or **"Check DNS Records"**

### 5.2 Wait for DNS Propagation

**Typical Propagation Times:**
- Namecheap: 30 minutes to 2 hours
- Maximum: Up to 48 hours (rare)

**Check Propagation Status:**

**Online Tools:**
- [whatsmydns.net](https://www.whatsmydns.net/) - Global DNS checker
- [mxtoolbox.com](https://mxtoolbox.com/SuperTool.aspx) - Email DNS diagnostics

**Terminal Commands:**
```bash
# Check TXT records (SPF/DKIM)
dig TXT codescribeai.com
dig TXT resend._domainkey.codescribeai.com

# macOS/Linux
nslookup -type=TXT codescribeai.com

# Check MX records
dig MX codescribeai.com
```

### 5.3 Retry Verification

If verification fails:
1. Wait 15-30 minutes for DNS propagation
2. Click **"Retry Verification"** in Resend dashboard
3. Verify DNS records are correctly entered in Namecheap
4. Check for typos in Host/Value fields
5. Clear local DNS cache (see [Troubleshooting](#troubleshooting))

### 5.4 Verification Success

Once verified, you'll see:
- ✅ Green checkmark next to your domain
- Status: **"Verified"**
- Ability to send emails from `@yourdomain.com` addresses

---

## Step 6: Update Environment Variables

### 6.1 Local Development

Add to `server/.env`:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@codescribeai.com
EMAIL_FROM_NAME=CodeScribe AI
```

### 6.2 Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **codescribe-ai**
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_xxxxx...` | Production, Preview, Development |
| `EMAIL_FROM` | `noreply@codescribeai.com` | Production, Preview, Development |
| `EMAIL_FROM_NAME` | `CodeScribe AI` | Production, Preview, Development |

5. Click **"Save"**
6. **Redeploy** your application for changes to take effect

### 6.3 Verify Configuration

Check that `server/src/services/emailService.js` uses these variables:

```javascript
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  return await resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};
```

---

## Step 7: Test Email Sending

### 7.1 Test Verification Email

1. Register a new user account in your application
2. Check the terminal/logs for email sending confirmation
3. Check your email inbox (including spam folder)
4. Click the verification link and confirm it works

### 7.2 Test Password Reset Email

1. Go to login page and click "Forgot Password"
2. Enter your email address
3. Check email for reset link
4. Verify the reset flow works end-to-end

### 7.3 Monitor in Resend Dashboard

1. Go to [Emails](https://resend.com/emails) in Resend dashboard
2. View sent emails with status:
   - ✅ **Delivered** - Successfully sent
   - ⏳ **Queued** - Waiting to send
   - ❌ **Bounced** - Recipient email invalid
   - 📋 **Complained** - Marked as spam

### 7.4 Test with Multiple Email Providers

Send test emails to:
- Gmail (`user@gmail.com`)
- Outlook (`user@outlook.com`)
- Yahoo (`user@yahoo.com`)
- Custom domain (`user@yourdomain.com`)

Check deliverability and spam folder placement.

---

## Troubleshooting

### DNS Propagation Taking Too Long

**Solution 1: Lower TTL Before Adding Records**
1. In Namecheap Advanced DNS, set TTL to `300` seconds (5 minutes)
2. Wait for current TTL to expire
3. Add/update DNS records
4. Verification will happen faster

**Solution 2: Clear Local DNS Cache**

**macOS:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Windows:**
```bash
ipconfig /flushdns
```

**Linux:**
```bash
sudo systemd-resolve --flush-caches
```

### DKIM Record Too Long

**Problem:** Namecheap has a ~255 character limit for TXT records

**Solution:**
1. Check if Resend provides the DKIM key in multiple parts
2. Add each part as a separate TXT record with the same host
3. Contact Namecheap support if you need to exceed limits

**Alternative:** Use a subdomain for email (often has higher limits)

### SPF Record Conflicts

**Problem:** Multiple SPF records cause validation failures

**Solution:** Combine all services into ONE SPF record:

**❌ Wrong (Multiple SPF records):**
```
TXT @ v=spf1 include:resend.com ~all
TXT @ v=spf1 include:mailgun.org ~all
```

**✅ Correct (Single combined SPF):**
```
TXT @ v=spf1 include:resend.com include:mailgun.org ~all
```

### Emails Going to Spam

**Solutions:**
1. **Add DMARC record** (see Step 4.5)
2. **Warm up your domain:** Start with low volume, gradually increase
3. **Avoid spam trigger words:** "Free", "Click here", excessive punctuation
4. **Use plain text + HTML:** Include both versions in emails
5. **Authenticate sending domain:** Ensure SPF/DKIM/DMARC are all verified
6. **Monitor sender reputation:** Use [mail-tester.com](https://www.mail-tester.com/)

### API Key Not Working

**Checklist:**
- ✅ API key copied correctly (no extra spaces)
- ✅ Environment variables set correctly (check Vercel dashboard)
- ✅ Application redeployed after adding env vars
- ✅ API key has correct permissions (Sending Access or Full Access)
- ✅ API key not revoked in Resend dashboard

### Email Not Sending (No Errors)

**Debug Steps:**

1. **Check Resend Dashboard Logs:**
   - Go to [Emails](https://resend.com/emails)
   - Look for failed sends or error messages

2. **Check Application Logs:**
   ```bash
   # Local
   cd server && npm run dev

   # Vercel
   vercel logs [deployment-url]
   ```

3. **Verify Email Service:**
   ```javascript
   // Add console.log to emailService.js
   console.log('Sending email with Resend:', { to, subject });
   const result = await resend.emails.send({ ... });
   console.log('Resend result:', result);
   ```

4. **Test API Key Directly:**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_xxxxx" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "noreply@codescribeai.com",
       "to": "test@example.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

---

## Cost Analysis

### Free Tier Limits

| Metric | Free Tier | Notes |
|--------|-----------|-------|
| **Emails/Month** | 3,000 | Resets monthly |
| **Emails/Day** | 100 | Rolling 24-hour limit |
| **Emails/Second** | 2 | Rate limiting |
| **Domains** | 1 | Verified sending domain |
| **API Keys** | Unlimited | Create separate keys per environment |
| **Email Size** | 40 MB | Including attachments |

### Paid Tier Pricing

| Tier | Price | Emails/Month | Cost per Additional Email |
|------|-------|--------------|--------------------------|
| **Free** | $0 | 3,000 | N/A |
| **Pro** | $20/mo | 50,000 | $1 per 1,000 |
| **Enterprise** | Custom | Custom | Negotiated |

### Cost Projections

**Scenario 1: 1,000 Users (Low Activity)**
- 1,000 verification emails
- 50 password resets/month
- **Total:** 1,050 emails → ✅ Free Tier

**Scenario 2: 10,000 Users (Moderate Activity)**
- 10,000 verification emails
- 500 password resets
- 200 notification emails
- **Total:** 10,700 emails → 💰 $20/mo (Pro Tier)

**Scenario 3: 50,000 Users (High Activity)**
- 50,000 verification emails (1 per user)
- 2,500 password resets (5% monthly)
- 1,000 notifications
- **Total:** 53,500 emails → 💰 $23.50/mo (Pro + overage)

**Cost Formula:**
```
Cost = $20 + max(0, (total_emails - 50,000) / 1,000)
```

### Comparison with Alternatives

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| **Resend** | 3K/mo | $20/mo (50K) | Best DX, modern API |
| **SendGrid** | 100/day | $20/mo (50K) | Established, complex API |
| **Mailgun** | 5K/mo | $35/mo (50K) | Good deliverability |
| **AWS SES** | 62K/mo* | $0.10/1K | *Requires EC2, complex setup |
| **Postmark** | 100/mo | $15/mo (10K) | Transactional focus |

**Recommendation:** Resend offers the best balance of cost, developer experience, and deliverability for CodeScribe AI.

---

## Additional Resources

- **Resend Documentation:** [resend.com/docs](https://resend.com/docs)
- **Namecheap DNS Guide:** [namecheap.com/support/knowledgebase](https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-spf-record-for-my-domain)
- **SPF Record Checker:** [mxtoolbox.com/spf.aspx](https://mxtoolbox.com/spf.aspx)
- **DKIM Validator:** [dkimvalidator.com](https://dkimvalidator.com/)
- **Email Deliverability Test:** [mail-tester.com](https://www.mail-tester.com/)
- **DNS Propagation Checker:** [whatsmydns.net](https://www.whatsmydns.net/)

---

## Next Steps

After completing Resend setup:

1. ✅ Test all email flows (verification, password reset)
2. ✅ Monitor email deliverability in Resend dashboard
3. ✅ Update [PASSWORD-RESET-SETUP.md](PASSWORD-RESET-SETUP.md) with domain-specific examples
4. ✅ Update [MONETIZATION-STRATEGY.md](../../private/strategic-planning/MONETIZATION-STRATEGY.md) with actual email costs
5. ✅ Add email monitoring/alerting for failed sends
6. ✅ Consider implementing email templates in Resend dashboard

---

**Last Updated:** October 24, 2025
**Maintained By:** CodeScribe AI Team
**Related Docs:** [PASSWORD-RESET-SETUP.md](PASSWORD-RESET-SETUP.md) | [PASSWORD-RESET-IMPLEMENTATION.md](PASSWORD-RESET-IMPLEMENTATION.md)
