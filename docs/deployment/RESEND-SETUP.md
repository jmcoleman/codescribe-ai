# Resend Email Service Setup Guide

Complete guide for configuring Resend email service with custom domain verification for CodeScribe AI.

**Last Updated:** October 26, 2025
**Service:** [Resend](https://resend.com)
**Tier:** Free (3,000 emails/month, 100 emails/day)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Email Address Overview](#email-address-overview)
3. [Inbound Email Setup (support@)](#inbound-email-setup-support)
4. [Environment Configuration Strategy](#environment-configuration-strategy)
5. [Step 1: Create Resend Account](#step-1-create-resend-account)
6. [Step 2: Generate API Key](#step-2-generate-api-key)
7. [Step 3: Add Domain in Resend](#step-3-add-domain-in-resend)
8. [Step 4: Configure DNS Records in Namecheap](#step-4-configure-dns-records-in-namecheap)
9. [Step 5: Verify Domain](#step-5-verify-domain)
10. [Step 6: Update Environment Variables](#step-6-update-environment-variables)
11. [Step 7: Test Email Sending](#step-7-test-email-sending)
12. [Troubleshooting](#troubleshooting)
13. [Cost Analysis](#cost-analysis)

---

## Prerequisites

- Active Namecheap account with domain access
- Access to DNS management for your domain
- Resend account (free tier available)
- CodeScribe AI application deployed
- Separate development and production databases configured (see [DATABASE-ENVIRONMENT-CHECKLIST.md](../deployment/DATABASE-ENVIRONMENT-CHECKLIST.md))

---

## Email Address Overview

CodeScribe AI uses different email addresses for different purposes:

### Outbound Emails (Automated - Resend)
These are **sender addresses** configured via Resend for automated application emails:

| Email Address | Purpose | Environment | Configuration |
|---------------|---------|-------------|---------------|
| `noreply@codescribeai.com` | Password resets, verification emails | Production | `EMAIL_FROM` env var |
| `preview@codescribeai.com` | Testing on Vercel preview deployments | Preview | `EMAIL_FROM` env var |
| `dev@codescribeai.com` | Local development testing | Development | `EMAIL_FROM` env var |

**How they work:**
- Configured via `EMAIL_FROM` environment variable
- Use Resend API for sending (one-way only)
- Users **cannot reply** to these addresses
- Setup covered in this guide (Steps 5-11)

### Inbound Email (Customer Support - Email Forwarding)
This is a **contact address** for customer support:

| Email Address | Purpose | Setup Required |
|---------------|---------|----------------|
| `support@codescribeai.com` | Customer inquiries, help requests | Email forwarding (Namecheap or Google Workspace) |

**How it works:**
- Appears as `mailto:` link in email templates
- Receives customer replies and inquiries
- Requires separate email hosting/forwarding setup
- See [Inbound Email Setup](#inbound-email-setup-support) below

**Key Distinction:**
- **Outbound (Resend):** Application sends emails automatically
- **Inbound (Email Forwarding):** Customers send emails to you manually

---

## Inbound Email Setup (support@)

The `support@codescribeai.com` address is referenced in email templates as a customer contact point:

```javascript
// From server/src/services/emailService.js
Need help? Contact us at <a href="mailto:support@codescribeai.com">support@codescribeai.com</a>
```

**Important:** Resend is **outbound-only** (sending emails). To receive emails at `support@codescribeai.com`, you need a separate email hosting or forwarding solution.

---

### Option A: Email Forwarding via Namecheap (Free, Recommended)

Forward `support@codescribeai.com` to your personal Gmail/Outlook account.

**Benefits:**
- ✅ Free (included with domain registration)
- ✅ Simple setup (5 minutes)
- ✅ No additional accounts needed
- ✅ Reply from personal email or set up "Send as" in Gmail

**Drawbacks:**
- ⚠️ Replies come from personal email (unless using Gmail "Send as")
- ⚠️ Limited to 1-3 forwarding addresses
- ⚠️ No shared inbox for team collaboration

#### Setup Steps:

1. **Log in to Namecheap Dashboard**
   - Navigate to [Namecheap](https://www.namecheap.com/)
   - Go to **Domain List** → Select your domain

2. **Enable Email Forwarding**
   - Click **"Manage"** next to your domain
   - Go to **"Advanced DNS"** tab
   - Scroll to **"Mail Settings"** section
   - Click **"Add Forwarder"** or **"Email Forwarding"**

3. **Configure Forwarding Rule**
   - **Alias:** `support`
   - **Forward To:** Your personal email (e.g., `yourname@gmail.com`)
   - Click **"Add"** or **"Save"**

4. **Add MX Records (if not already present)**

   Namecheap may auto-configure MX records. If not, add these manually in **Advanced DNS**:

   | Type | Host | Value | Priority | TTL |
   |------|------|-------|----------|-----|
   | `MX Record` | `@` | `mx1.privateemail.com` | `10` | Automatic |
   | `MX Record` | `@` | `mx2.privateemail.com` | `20` | Automatic |

   **Note:** Namecheap uses `privateemail.com` for free email forwarding. Values may differ—check Namecheap's dashboard for exact records.

5. **Verify Forwarding**
   - Send a test email to `support@codescribeai.com`
   - Check your personal inbox (and spam folder)
   - Expected delivery time: 1-5 minutes

6. **Optional: Set Up "Send As" in Gmail**

   To reply **as** `support@codescribeai.com` from Gmail:

   - In Gmail, go to **Settings** → **Accounts and Import**
   - Click **"Add another email address"**
   - Enter name: `CodeScribe AI Support`
   - Enter email: `support@codescribeai.com`
   - Follow Gmail's verification steps (may require SMTP credentials)

   **SMTP Settings for Namecheap Private Email (if required):**
   - **SMTP Server:** `mail.privateemail.com`
   - **Port:** `587` (TLS) or `465` (SSL)
   - **Username:** `support@codescribeai.com`
   - **Password:** Your email password (set in Namecheap)

   **Note:** Free forwarding may not support SMTP "Send as" without upgrading to Namecheap Private Email ($0.99/mo first year, then ~$9.88/yr).

---

### Option B: Google Workspace / Microsoft 365 (Paid, Professional)

Use professional email hosting for a full inbox experience.

**Benefits:**
- ✅ Professional `@codescribeai.com` inbox
- ✅ Send **and** receive as `support@codescribeai.com`
- ✅ Shared inbox for team collaboration
- ✅ Email aliases (e.g., `hello@`, `contact@`, `sales@`)
- ✅ Integrated calendar, drive, and productivity tools

**Drawbacks:**
- ❌ Costs $6-12/user/month
- ⚠️ Requires domain ownership verification
- ⚠️ More complex setup (30-60 minutes)

#### Pricing Comparison:

| Service | Price | Mailbox Size | Aliases | Best For |
|---------|-------|--------------|---------|----------|
| **Google Workspace** | $6/user/mo | 30 GB | Unlimited | Startups, small teams |
| **Microsoft 365 Business Basic** | $6/user/mo | 50 GB | Unlimited | Enterprise integration |
| **Namecheap Private Email** | $0.99/mo (first year) | 3 GB | 3 aliases | Solo founders |

#### Setup Steps (Google Workspace):

1. **Sign Up for Google Workspace**
   - Go to [workspace.google.com](https://workspace.google.com/)
   - Click **"Get Started"**
   - Enter your domain: `codescribeai.com`
   - Create admin account (e.g., `admin@codescribeai.com`)

2. **Verify Domain Ownership**
   - Google will provide a TXT record to add to Namecheap DNS
   - Go to Namecheap → **Advanced DNS** → Add TXT record:
     - **Type:** `TXT Record`
     - **Host:** `@`
     - **Value:** `google-site-verification=xxxxxx` (from Google)
     - **TTL:** Automatic
   - Return to Google Workspace and click **"Verify"**

3. **Configure MX Records in Namecheap**

   Replace existing MX records with Google's:

   | Priority | Hostname | Points To |
   |----------|----------|-----------|
   | `1` | `@` | `aspmx.l.google.com` |
   | `5` | `@` | `alt1.aspmx.l.google.com` |
   | `5` | `@` | `alt2.aspmx.l.google.com` |
   | `10` | `@` | `alt3.aspmx.l.google.com` |
   | `10` | `@` | `alt4.aspmx.l.google.com` |

   **⚠️ Important:** Changing MX records will affect **all** email for `@codescribeai.com`. Make sure to configure all needed addresses in Google Workspace.

4. **Create `support@` Email Address**
   - In Google Workspace Admin, go to **Users**
   - Click **"Add new user"**
   - Username: `support`
   - Full name: `CodeScribe AI Support`
   - Primary email: `support@codescribeai.com`
   - Set password and click **"Add"**

5. **Optional: Set Up as Shared Mailbox**
   - In Google Workspace Admin, go to **Groups**
   - Create group: `support@codescribeai.com`
   - Add team members as collaborators
   - Enable **"Collaborative Inbox"** setting

6. **Test Email Flow**
   - Send email to `support@codescribeai.com`
   - Check Gmail inbox at [mail.google.com](https://mail.google.com/)
   - Reply to verify sending works

---

### Option C: Resend Inbound Webhooks (Advanced, Programmatic)

**⚠️ Note:** This option is for developers who want to **process** support emails programmatically (e.g., auto-create support tickets). Not recommended for manual customer support.

**Use Case:** Automatically create support tickets in your database when customers email `support@codescribeai.com`.

**Benefits:**
- ✅ Fully automated email handling
- ✅ Integrate with CRM/ticketing systems
- ✅ Parse email content programmatically
- ✅ No additional email hosting costs

**Drawbacks:**
- ❌ Requires backend development (webhook endpoint)
- ❌ Manual replies require separate email sending
- ❌ Complex troubleshooting (webhook failures)
- ⚠️ Not suitable for small teams needing a traditional inbox

#### Setup Steps:

1. **Enable Inbound Email in Resend**
   - Go to [Resend Dashboard](https://resend.com/dashboard)
   - Navigate to **Domains** → Select your domain
   - Click **"Inbound"** tab
   - Click **"Enable Inbound Email"**

2. **Create Webhook Endpoint**

   Add a new route in your backend to receive inbound emails:

   ```javascript
   // server/src/routes/webhooks.js
   import express from 'express';
   const router = express.Router();

   router.post('/resend-inbound', express.json(), async (req, res) => {
     const { from, to, subject, html, text } = req.body;

     // Verify webhook signature (recommended)
     const signature = req.headers['resend-webhook-signature'];
     // TODO: Verify signature with Resend webhook secret

     // Process email (e.g., create support ticket)
     console.log('Received email:', { from, to, subject });

     // Store in database or forward to support system
     // await createSupportTicket({ from, subject, body: text });

     res.status(200).json({ received: true });
   });

   export default router;
   ```

3. **Configure Webhook URL in Resend**
   - In Resend **Inbound** settings, add webhook URL:
     - **URL:** `https://codescribeai.com/api/webhooks/resend-inbound`
     - **Events:** Select **"Email Received"**
   - Click **"Save"**

4. **Add MX Records for Inbound**

   Resend will provide MX records to add in Namecheap:

   | Type | Host | Value | Priority |
   |------|------|-------|----------|
   | `MX Record` | `@` | `inbound-mail.resend.com` | `10` |

   **⚠️ Important:** This replaces existing MX records and affects all `@codescribeai.com` email routing.

5. **Create Email Route**
   - In Resend dashboard, go to **Inbound** → **Routes**
   - Click **"Add Route"**
   - **Match:** `support@codescribeai.com`
   - **Forward to:** Your webhook URL
   - Click **"Save"**

6. **Test Webhook**
   - Send test email to `support@codescribeai.com`
   - Check server logs for webhook POST request
   - Verify email data is parsed correctly

#### Example: Create Support Ticket

```javascript
// server/src/routes/webhooks.js
router.post('/resend-inbound', async (req, res) => {
  const { from, subject, text, html } = req.body;

  // Extract sender email and name
  const senderEmail = from[0].address; // 'user@example.com'
  const senderName = from[0].name || 'Unknown';

  // Store in database
  await db.query(`
    INSERT INTO support_tickets (sender_email, sender_name, subject, message, status, created_at)
    VALUES ($1, $2, $3, $4, 'open', NOW())
  `, [senderEmail, senderName, subject, text]);

  // Optional: Send auto-reply
  await sendEmail({
    to: senderEmail,
    subject: `Re: ${subject}`,
    html: `
      <p>Hi ${senderName},</p>
      <p>Thank you for contacting CodeScribe AI support. We've received your message and will respond within 24 hours.</p>
      <p><strong>Your ticket ID:</strong> ${ticketId}</p>
    `
  });

  res.status(200).json({ received: true });
});
```

---

### Recommended Setup for CodeScribe AI

Based on your current stage:

**For Solo Founder / MVP:**
- ✅ **Option A: Namecheap Email Forwarding** (Free, 5 minutes)
- Use Gmail "Send as" for professional replies (optional)
- Upgrade to Google Workspace when you have team members

**For Growing Team (2-5 people):**
- ✅ **Option B: Google Workspace** ($6/user/mo)
- Shared `support@` inbox for collaboration
- Professional email experience

**For High-Volume Support:**
- ✅ **Option C: Resend Webhooks** + **Option B: Google Workspace**
- Webhooks for automated ticket creation
- Google Workspace for manual replies
- Requires custom development

---

### Current Configuration in CodeScribe AI

The application references `support@codescribeai.com` in:

**1. Email Templates** ([server/src/services/emailService.js:44](server/src/services/emailService.js#L44)):
```javascript
Need help? Contact us at <a href="mailto:support@codescribeai.com">support@codescribeai.com</a>
```

**2. Password Reset Email Template**:
- Users see "Need help?" link at bottom of emails
- Clicking opens mail client with `support@codescribeai.com` pre-filled

**Next Steps:**
1. Choose email hosting option (A, B, or C above)
2. Configure DNS/MX records in Namecheap
3. Test email delivery by sending to `support@codescribeai.com`
4. Update email templates if needed (e.g., add ticket system link)

---

## Environment Configuration Strategy

**IMPORTANT:** Like your database setup, Resend should be configured differently for development and production environments.

### Strategy Comparison

| Aspect | Option 1: Single API Key | Option 2: Separate API Keys |
|--------|-------------------------|----------------------------|
| **API Keys** | 1 shared key | Dev key + Prod key |
| **Domains** | 1 domain | Separate domains/subdomains |
| **Sender Email** | Different per env | Different per env |
| **Cost** | Lower (one domain) | Higher (multiple domains) |
| **Complexity** | Simpler | More complex |
| **Isolation** | Email-level only | Complete separation |
| **Best For** | Portfolio, small SaaS | Enterprise, compliance-critical |

### **Recommended for CodeScribe AI: Option 1 (Single API Key)**

**Why:**
- Simpler to manage (one API key, one domain)
- Cost-effective (free tier covers both environments)
- Easy to differentiate with sender emails
- Sufficient isolation for portfolio/small SaaS projects

**Configuration:**

| Environment | Sender Email | Purpose |
|-------------|--------------|---------|
| **Development** | `dev@codescribeai.com` | Local testing, feature development |
| **Preview** | `preview@codescribeai.com` | Feature branch previews |
| **Production** | `noreply@codescribeai.com` | Live user emails |

**Vercel Environment Variables:**

```env
# Development/Local (.env)
RESEND_API_KEY=re_xxxxxxxx  # Same key
EMAIL_FROM=dev@codescribeai.com

# Preview (Vercel → Preview)
RESEND_API_KEY=re_xxxxxxxx  # Same key
EMAIL_FROM=preview@codescribeai.com

# Production (Vercel → Production)
RESEND_API_KEY=re_xxxxxxxx  # Same key
EMAIL_FROM=noreply@codescribeai.com
```

**Benefits:**
- ✅ Easy to identify email source by sender
- ✅ All emails visible in one Resend dashboard
- ✅ Single domain verification required
- ✅ Free tier covers combined dev + prod volume
- ✅ Production emails clearly marked in inbox

**Limitations:**
- ⚠️ Dev/test emails count toward same quota (3K/month)
- ⚠️ Reputation shared between environments (minor risk)
- ⚠️ Single point of failure if API key compromised

---

### Alternative: Option 2 (Separate API Keys) - Enterprise Approach

**When to use:**
- High email volume in development (many developers)
- Compliance requirements (HIPAA, SOC 2)
- Need complete environment isolation
- Budget for multiple domains/subdomains

**Configuration:**

| Environment | Domain | API Key | Sender Email |
|-------------|--------|---------|--------------|
| **Development** | `dev.codescribeai.com` | `re_dev_xxx` | `noreply@dev.codescribeai.com` |
| **Production** | `codescribeai.com` | `re_prod_xxx` | `noreply@codescribeai.com` |

**Setup Steps:**
1. Create two separate domains in Resend
2. Configure DNS for each domain
3. Generate separate API keys (scoped to each domain)
4. Set environment-specific variables in Vercel

**Benefits:**
- ✅ Complete isolation (reputation, quotas, monitoring)
- ✅ Separate rate limits
- ✅ Dev testing doesn't affect prod quota
- ✅ Better security (key compromise affects only one env)

**Drawbacks:**
- ❌ More DNS records to manage
- ❌ Higher cost if domains require paid subdomains
- ❌ More complex troubleshooting (two dashboards)

---

### Verification Checklist

After configuring Resend, verify your setup:

**✅ Local Development:**
- [ ] `RESEND_API_KEY` set in `server/.env`
- [ ] `EMAIL_FROM` uses dev/test email (e.g., `dev@codescribeai.com`)
- [ ] Test email sends successfully
- [ ] Email appears from dev sender in inbox

**✅ Vercel Preview:**
- [ ] Preview environment variables configured
- [ ] `EMAIL_FROM` uses preview email (e.g., `preview@codescribeai.com`)
- [ ] Test deployment sends email correctly

**✅ Vercel Production:**
- [ ] Production environment variables configured
- [ ] `EMAIL_FROM` uses production email (e.g., `noreply@codescribeai.com`)
- [ ] Production emails verified in Resend dashboard
- [ ] Production sender email is professional (no "dev" or "test")

**✅ Monitoring:**
- [ ] Resend dashboard shows all environments' emails
- [ ] Can filter by sender email to identify environment
- [ ] Rate limits appropriate for production volume

**Related:** [DATABASE-ENVIRONMENT-CHECKLIST.md](../deployment/DATABASE-ENVIRONMENT-CHECKLIST.md)

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

### Option 1: Single API Key (Recommended)

**For shared dev/prod setup:**

1. Navigate to [API Keys](https://resend.com/api-keys) in the Resend dashboard
2. Click **"Create API Key"**
3. Configure:
   - **Name:** `CodeScribe AI - All Environments`
   - **Permission:** `Sending Access` (recommended) or `Full Access`
   - **Domain:** Select your domain after adding it (or `All Domains` initially)
4. Click **"Create"**
5. **⚠️ COPY THE API KEY IMMEDIATELY** - it will only be shown once
6. Store securely:
   - Add to `server/.env` for local development
   - Add to Vercel environment variables for all environments (Development, Preview, Production)

**API Key Format:**
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Security Note:** This single key will be used across all environments. Differentiate environments using the `EMAIL_FROM` variable (see [Environment Configuration Strategy](#environment-configuration-strategy)).

---

### Option 2: Separate API Keys (Enterprise)

**For complete isolation:**

**Development API Key:**
1. Create API key named `CodeScribe AI - Development`
2. Scope to development domain (e.g., `dev.codescribeai.com`)
3. Use only in local `.env` and Vercel Preview environment

**Production API Key:**
1. Create API key named `CodeScribe AI - Production`
2. Scope to production domain (e.g., `codescribeai.com`)
3. Use only in Vercel Production environment

**Security:** Keep keys separate, never mix environments.

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

**IMPORTANT:** Configure environment-specific email addresses to differentiate dev/preview/production emails. See [Environment Configuration Strategy](#environment-configuration-strategy).

### 6.1 Local Development

Add to `server/.env`:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=dev@codescribeai.com
```

**Note:** Using `dev@codescribeai.com` clearly marks emails as development/testing.

### 6.2 Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **codescribe-ai**
3. Navigate to **Settings** → **Environment Variables**
4. Add environment-specific variables:

#### Option 1: Single API Key (Recommended)

| Key | Value | Environments |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_xxxxx...` | ✅ Production, ✅ Preview, ✅ Development |
| `EMAIL_FROM` | `noreply@codescribeai.com` | ✅ Production only |
| `EMAIL_FROM` | `preview@codescribeai.com` | ✅ Preview only |
| `EMAIL_FROM` | `dev@codescribeai.com` | ✅ Development only |

**How to configure in Vercel:**

**Step 1: Add RESEND_API_KEY (shared across all environments)**
1. Click **"Add Variable"**
2. **Key:** `RESEND_API_KEY`
3. **Value:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your actual API key)
4. **Environments:** Check all three: ✅ Production, ✅ Preview, ✅ Development
5. Click **"Save"**

**Step 2: Add EMAIL_FROM for Production**
1. Click **"Add Variable"**
2. **Key:** `EMAIL_FROM`
3. **Value:** `noreply@codescribeai.com`
4. **Environments:** Check **Production only** ✅ (uncheck Preview and Development)
5. Click **"Save"**

**Step 3: Add EMAIL_FROM for Preview**
1. Click **"Add Variable"** again (same key name!)
2. **Key:** `EMAIL_FROM`
3. **Value:** `preview@codescribeai.com`
4. **Environments:** Check **Preview only** ✅ (uncheck Production and Development)
5. Click **"Save"**

**Step 4: Add EMAIL_FROM for Development**
1. Click **"Add Variable"** again (same key name!)
2. **Key:** `EMAIL_FROM`
3. **Value:** `dev@codescribeai.com`
4. **Environments:** Check **Development only** ✅ (uncheck Production and Preview)
5. Click **"Save"**

**What you'll see in Vercel Environment Variables table:**

After completing the setup, you should see these rows:

| Variable | Value (truncated) | Production | Preview | Development |
|----------|------------------|------------|---------|-------------|
| `RESEND_API_KEY` | `re_xxxxxxxx...` | ✅ | ✅ | ✅ |
| `EMAIL_FROM` | `noreply@codes...` | ✅ | - | - |
| `EMAIL_FROM` | `preview@codes...` | - | ✅ | - |
| `EMAIL_FROM` | `dev@codescrib...` | - | - | ✅ |

**How it works:**
- Vercel allows the **same variable name** to have **different values** scoped to different environments
- When your code runs `process.env.EMAIL_FROM`, Vercel injects the correct value based on the deployment environment
- No conflicts occur because only one environment is active at a time
- This is a built-in Vercel feature for environment-specific configuration

#### Option 2: Separate API Keys (Enterprise)

| Key | Value | Environment |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_prod_xxxxx...` | ✅ Production only |
| `RESEND_API_KEY` | `re_dev_xxxxx...` | ✅ Preview, ✅ Development |
| `EMAIL_FROM` | `noreply@codescribeai.com` | ✅ Production only |
| `EMAIL_FROM` | `noreply@dev.codescribeai.com` | ✅ Preview, ✅ Development |

### 6.3 Verify Configuration After Deployment

**Check local development:**
```bash
cd server
node -e "console.log('API Key:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'); console.log('From:', process.env.EMAIL_FROM)"
```

**Expected output:**
```
API Key: ✅ Set
From: dev@codescribeai.com
```

**Check Vercel environments:**
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Check production
vercel env ls --environment production

# Check preview
vercel env ls --environment preview
```

5. **Redeploy** your application for changes to take effect

### 6.4 Code Integration

Verify `server/src/services/emailService.js` uses environment variables:

```javascript
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  return await resend.emails.send({
    from: process.env.EMAIL_FROM,  // Uses environment-specific sender
    to,
    subject,
    html,
  });
};
```

**Note:** `EMAIL_FROM` should already include the sender name if needed:
- `"CodeScribe AI <noreply@codescribeai.com>"` (with name)
- `"noreply@codescribeai.com"` (without name)

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

1. ✅ Test all email flows (verification, password reset) in each environment
2. ✅ Verify environment-specific sender emails in inbox
3. ✅ Monitor email deliverability in Resend dashboard
4. ✅ Complete [DATABASE-ENVIRONMENT-CHECKLIST.md](./DATABASE-ENVIRONMENT-CHECKLIST.md)
5. ✅ Add email monitoring/alerting for failed sends
6. ✅ Consider implementing email templates in Resend dashboard
7. ✅ Set up email rate limiting to prevent abuse

---

## Related Documentation

**Deployment:**
- [DATABASE-ENVIRONMENT-CHECKLIST.md](./DATABASE-ENVIRONMENT-CHECKLIST.md) - Database environment separation
- [VERCEL-POSTGRES-SETUP.md](./VERCEL-POSTGRES-SETUP.md) - Database setup guide
- [VERCEL-CONFIGURATION.md](./VERCEL-CONFIGURATION.md) - Vercel environment configuration
- [MVP-DEPLOY-LAUNCH.md](./MVP-DEPLOY-LAUNCH.md) - Production deployment

**Authentication:**
- [PASSWORD-RESET-SETUP.md](../authentication/PASSWORD-RESET-SETUP.md) - Password reset configuration
- [PASSWORD-RESET-IMPLEMENTATION.md](../authentication/PASSWORD-RESET-IMPLEMENTATION.md) - Implementation guide
- [GITHUB-OAUTH-SETUP.md](../authentication/GITHUB-OAUTH-SETUP.md) - OAuth configuration

---

## Changelog

- **v3.0** (October 26, 2025) - Inbound email configuration
  - Added [Email Address Overview](#email-address-overview) section
  - Added comprehensive [Inbound Email Setup (support@)](#inbound-email-setup-support) section
  - Documented three approaches for receiving support emails:
    - **Option A:** Namecheap Email Forwarding (free, recommended for solo founders)
    - **Option B:** Google Workspace / Microsoft 365 (paid, professional)
    - **Option C:** Resend Inbound Webhooks (advanced, programmatic)
  - Added step-by-step setup instructions for each option
  - Included MX record configuration for email forwarding
  - Added Gmail "Send as" setup for professional replies
  - Documented webhook endpoint implementation for automated ticket creation
  - Added recommendations based on team size and use case
  - Updated Table of Contents with new sections
- **v2.0** (October 26, 2025) - Environment configuration overhaul
  - Moved from `docs/authentication/` to `docs/deployment/`
  - Added comprehensive [Environment Configuration Strategy](#environment-configuration-strategy) section
  - Documented two approaches: Single API Key vs Separate API Keys
  - Added environment-specific `EMAIL_FROM` configuration
  - Updated Step 2 with Option 1 (single key) and Option 2 (separate keys)
  - Enhanced Step 6 with detailed Vercel environment variable setup
  - Added verification checklist for all environments (dev/preview/prod)
  - Added verification commands for local and Vercel configuration
  - Cross-referenced DATABASE-ENVIRONMENT-CHECKLIST.md
  - Updated Related Documentation section
- **v1.0** (October 24, 2025) - Initial Resend setup guide
  - Resend account creation and API key generation
  - Domain configuration (root domain and subdomain options)
  - DNS record setup for SPF, DKIM, DMARC
  - Environment variable configuration
  - Testing procedures and troubleshooting
  - Cost analysis and tier comparison

---

**Last Updated:** October 26, 2025
**Maintained By:** CodeScribe AI Team
