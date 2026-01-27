# Resend Email Service Setup Guide

Complete guide for configuring Resend email service with custom domain verification for CodeScribe AI.

**Last Updated:** October 27, 2025
**Service:** [Resend](https://resend.com)
**Tier:** Free (3,000 emails/month, 100 emails/day)

---

## 🎯 Quick Start - Your Actual Setup

**This is the configuration currently running for CodeScribe AI:**

### Email Sending (Resend)
- **Domain Verified:** `mail.codescribeai.com` (subdomain)
- **Sender Addresses:**
  - Development: `dev@mail.codescribeai.com`
  - Preview: `preview@mail.codescribeai.com`
  - Production: `noreply@mail.codescribeai.com`
- **DNS Records (in Namecheap):**
  - SPF: `send.mail` → `v=spf1 include:_spf.resend.com ~all`
  - DKIM: `resend._domainkey` → `p=MIGfMA0GCSq...` (from Resend)
  - MX: `send.mail` → `feedback-smtp.us-east-1.amazonses.com` priority 10
  - DMARC: `_dmarc` → `v=DMARC1; p=none;`

### Email Receiving (Namecheap Forwarding)
- **Support Email:** `support@codescribeai.com` (root domain)
- **Forwards To:** `jenni.m.coleman@gmail.com`
- **Setup Location:** Namecheap → Domain tab → "Redirect Email"
- **Mail Settings Mode:** Email Forwarding (not Custom MX)

### Key Decisions Made
1. ✅ **Used subdomain** (`mail.codescribeai.com`) for sending to protect main domain reputation
2. ✅ **Single API key** across all environments (dev/preview/prod) for simplicity
3. ✅ **Environment-specific sender emails** to differentiate traffic
4. ✅ **Free Namecheap email forwarding** for support inbox (no paid hosting needed)

**Why this setup works:**
- Sending domain (`mail.codescribeai.com`) and receiving domain (`codescribeai.com`) are separate
- No DNS conflicts between Resend and email forwarding
- Cost: $0/month (both services free tier)
- Simple to maintain

**Jump to:** [Step-by-Step Setup Instructions](#step-1-create-resend-account) | [Alternative Configurations (Appendix)](#appendix-alternative-configurations)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Email Address Overview](#email-address-overview)
3. [Inbound Email Setup (support@)](#inbound-email-setup-support)
4. [Gmail "Send Mail As" Configuration](#gmail-send-mail-as-configuration)
5. [Environment Configuration Strategy](#environment-configuration-strategy)
6. [Step 1: Create Resend Account](#step-1-create-resend-account)
7. [Step 2: Generate API Key](#step-2-generate-api-key)
8. [Step 3: Add Domain in Resend](#step-3-add-domain-in-resend)
9. [Step 4: Configure DNS Records in Namecheap](#step-4-configure-dns-records-in-namecheap)
10. [Step 5: Verify Domain](#step-5-verify-domain)
11. [Step 6: Update Environment Variables](#step-6-update-environment-variables)
12. [Step 7: Test Email Sending](#step-7-test-email-sending)
13. [Troubleshooting](#troubleshooting)
14. [Cost Analysis](#cost-analysis)

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
| `noreply@mail.codescribeai.com` | Password resets, verification emails | Production | `EMAIL_FROM` env var |
| `preview@mail.codescribeai.com` | Testing on Vercel preview deployments | Preview | `EMAIL_FROM` env var |
| `dev@mail.codescribeai.com` | Local development testing | Development | `EMAIL_FROM` env var |

**How they work:**
- Uses subdomain `mail.codescribeai.com` verified in Resend
- Configured via `EMAIL_FROM` environment variable
- Use Resend API for sending (one-way only)
- Users **cannot reply** to these addresses
- Setup covered in this guide (Steps 5-11)

### Inbound Email (Customer Contact - Email Forwarding)
These are **contact addresses** for customer inquiries:

| Email Address | Purpose | Setup Required |
|---------------|---------|----------------|
| `sales@codescribeai.com` | Sales inquiries (Enterprise/Team tiers) | Email forwarding (Namecheap or Google Workspace) |
| `support@codescribeai.com` | Customer support, help requests | Email forwarding (Namecheap or Google Workspace) |
| `baa-requests@codescribeai.com` | HIPAA/BAA inquiries (Enterprise Healthcare) | Email forwarding (Namecheap or Google Workspace) |

**How it works:**
- Appear as `mailto:` links in email templates and documentation
- Receive customer inquiries and manual requests
- Require separate email hosting/forwarding setup
- See [Inbound Email Setup](#inbound-email-setup-support) below

**Key Distinction:**
- **Outbound (Resend):** Application sends emails automatically
- **Inbound (Email Forwarding):** Customers send emails to you manually

---

## Inbound Email Setup (sales@, support@, baa-requests@)

These addresses are referenced in the application and documentation as customer contact points:

**support@codescribeai.com:**
```javascript
// From server/src/services/emailService.js
Need help? Contact us at <a href="mailto:support@codescribeai.com">support@codescribeai.com</a>
```

**sales@codescribeai.com:**
- Used in Contact Sales form (`/pricing` page)
- Environment variable: `SALES_EMAIL`

**baa-requests@codescribeai.com:**
- Referenced in HIPAA documentation (`docs/hipaa/`)
- For Business Associate Agreement inquiries
- No environment variable needed (receive-only)

**Important:** Resend is **outbound-only** (sending emails). To receive emails at these addresses, you need a separate email hosting or forwarding solution.

---

### Option A: Email Forwarding via Namecheap (Free, Recommended) ⭐ **CURRENT SETUP**

Forward `sales@`, `support@`, and `baa-requests@codescribeai.com` to your personal Gmail/Outlook account.

**Benefits:**
- ✅ Free (included with domain registration)
- ✅ Simple setup (5 minutes)
- ✅ No additional accounts needed
- ✅ Reply from personal email or set up "Send as" in Gmail

**Drawbacks:**
- ⚠️ Replies come from personal email (unless using Gmail "Send as")
- ⚠️ Limited to 100 forwarding addresses per domain
- ⚠️ No shared inbox for team collaboration

#### Setup Steps:

1. **Log in to Namecheap Dashboard**
   - Navigate to [Namecheap](https://www.namecheap.com/)
   - Go to **Domain List** → Click **"Manage"** next to your domain

2. **Access Email Forwarding (Redirect Email)**
   - Click the **"Domain"** tab (not Advanced DNS)
   - Scroll down to find **"Redirect Email"** section
   - This is where email forwarding is configured

3. **Configure Forwarding Rules**

   **Add all three forwarders:**

   a. **Sales Forwarder:**
   - Click **"ADD FORWARDER"** button
   - **Alias:** `sales` (creates sales@codescribeai.com)
   - **Forward To:** Your personal email (e.g., `jenni.m.coleman@gmail.com`)
   - Click **"Save"** or **"Add"**

   b. **Support Forwarder:**
   - Click **"ADD FORWARDER"** button
   - **Alias:** `support` (creates support@codescribeai.com)
   - **Forward To:** Your personal email (same as above)
   - Click **"Save"** or **"Add"**

   c. **BAA Requests Forwarder:**
   - Click **"ADD FORWARDER"** button
   - **Alias:** `baa-requests` (creates baa-requests@codescribeai.com)
   - **Forward To:** Your personal email (same as above)
   - Click **"Save"** or **"Add"**

4. **Activate Forwarding (Important!)**
   - Check your destination email inbox for confirmation emails from Namecheap (you'll receive 3 emails, one for each forwarder)
   - Subject will be something like "Confirm Email Forwarding"
   - **Click the confirmation link in each email** to activate the forwarding
   - Forwarding will NOT work until you confirm all three!

5. **Set Mail Settings to Email Forwarding Mode**
   - Go to **Advanced DNS** tab
   - Scroll to **"Mail Settings"** dropdown
   - Select **"Email Forwarding"** (not "Custom MX")
   - This automatically configures the necessary MX records for forwarding
   - **Important:** Switching to "Custom MX" will disable email forwarding!

6. **Verify Forwarding**
   - Send test emails to all three addresses:
     - `sales@codescribeai.com`
     - `support@codescribeai.com`
     - `baa-requests@codescribeai.com`
   - Check your personal inbox (and spam folder)
   - Expected delivery time: 1-5 minutes each

6. **Optional: Set Up "Send As" in Gmail (Recommended)**

   See [Gmail "Send Mail As" Configuration](#gmail-send-mail-as-configuration) below for detailed setup instructions.

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

## Gmail "Send Mail As" Configuration

**Purpose:** Reply to support emails FROM `support@codescribeai.com` instead of your personal Gmail address.

**Why this matters:**
- Maintains professional brand identity
- Users see replies from `support@codescribeai.com` (not your personal email)
- Your personal email remains private
- Works with free Namecheap email forwarding (no paid hosting needed)

**Prerequisites:**
- Email forwarding already set up (see [Option A: Namecheap Email Forwarding](#option-a-email-forwarding-via-namecheap-free-recommended-) above)
- Support emails successfully forwarding to your personal Gmail
- Access to Gmail account where emails are forwarded

---

### Step-by-Step Setup

#### 1. Access Gmail Settings

1. Log in to your Gmail account (where `support@codescribeai.com` emails are forwarded)
2. Click the **gear icon** (⚙️) in the top-right corner
3. Click **"See all settings"**
4. Navigate to the **"Accounts and Import"** tab

#### 2. Add Another Email Address

1. Find the section: **"Send mail as:"**
2. Click **"Add another email address"**

   A popup window will appear:

   ```
   ┌─────────────────────────────────────────────────────────┐
   │ Add another email address                               │
   ├─────────────────────────────────────────────────────────┤
   │ Name:  [CodeScribe AI Support                        ]  │
   │ Email: [support@codescribeai.com                     ]  │
   │                                                         │
   │ ☑ Treat as an alias                                    │
   │                                                         │
   │                                    [Next Step] [Cancel] │
   └─────────────────────────────────────────────────────────┘
   ```

3. Fill in the fields:
   - **Name:** `CodeScribe AI Support` (this is what users will see)
   - **Email address:** `support@codescribeai.com`
   - **Treat as an alias:** ✅ Keep this checked (recommended)

4. Click **"Next Step"**

#### 3. Choose Verification Method

Gmail will show two options:

**Option A: Send through Gmail (Recommended for Free Forwarding) ⭐**

```
┌─────────────────────────────────────────────────────────────────┐
│ Send mail through:                                              │
├─────────────────────────────────────────────────────────────────┤
│ ○ Gmail (easier to set up)                                     │
│   Reply from support@codescribeai.com using Gmail's servers.   │
│   Recommended if you don't have SMTP credentials.              │
│                                                                 │
│ ○ Other SMTP server (advanced)                                 │
│   Requires SMTP credentials from email hosting provider.       │
└─────────────────────────────────────────────────────────────────┘
```

- **Select:** ○ **Gmail (easier to set up)**
- Click **"Next Step"**

**Why choose "Gmail"?**
- ✅ No SMTP credentials needed
- ✅ Works with free Namecheap forwarding
- ✅ Simpler setup (5 minutes)
- ✅ Uses Gmail's reliable infrastructure
- ⚠️ "Reply-To" header shows your Gmail (only visible if recipient inspects headers)
- ⚠️ "From" still shows `support@codescribeai.com` to users (most important!)

**Option B: Other SMTP server (Advanced)**

Only choose this if:
- You have paid email hosting (Namecheap Private Email, Google Workspace, etc.)
- You have SMTP credentials for `support@codescribeai.com`
- You need complete email header control

**SMTP Settings (if using Option B):**

For **Namecheap Private Email** ($0.99/mo first year):
- **SMTP Server:** `mail.privateemail.com`
- **Port:** `587` (TLS recommended) or `465` (SSL)
- **Username:** `support@codescribeai.com`
- **Password:** Your email account password (set in Namecheap)

For **Google Workspace**:
- **SMTP Server:** `smtp.gmail.com`
- **Port:** `587` (TLS recommended) or `465` (SSL)
- **Username:** `support@codescribeai.com`
- **Password:** Your Google Workspace password (or App Password if 2FA enabled)

**Note:** Free Namecheap email forwarding does NOT provide SMTP access - you would need to upgrade to Namecheap Private Email or use Option A (Gmail).

#### 4. Verify Email Address

Gmail will send a verification email to `support@codescribeai.com`:

1. **Check your Gmail inbox** - The verification email will be forwarded to your personal Gmail (due to email forwarding setup)

2. **Find the verification email** from Gmail Team:
   - **Subject:** "Gmail Confirmation - Send mail as support@codescribeai.com"
   - **From:** `email-forwarding-noreply@google.com`

3. **Two verification options:**

   **Option 1: Click the link in the email (easiest)**
   - Open the verification email
   - Click the confirmation link
   - You'll see: "The email address has been verified!"

   **Option 2: Enter the confirmation code**
   - Copy the 9-digit confirmation code from the email
   - Return to the Gmail settings window (still open)
   - Paste the code in the "Confirmation code" field
   - Click **"Verify"**

4. **Success confirmation:**
   - You'll see a green checkmark: ✅ "Verification complete"
   - The new email address will appear in your "Send mail as" list

#### 5. Set as Default (Optional)

1. In **Gmail Settings** → **Accounts and Import** → **"Send mail as:"**
2. Find: `CodeScribe AI Support <support@codescribeai.com>`
3. Click **"make default"** next to it

**Effect:**
- All new emails will default to sending FROM `support@codescribeai.com`
- You can still switch to your personal email when composing

**Recommendation:**
- **Don't set as default** if you use Gmail for personal emails
- **Do set as default** if this Gmail account is dedicated to CodeScribe AI support

#### 6. Reply to Support Emails

**When replying to forwarded support emails:**

1. Open a support request email (forwarded from `support@codescribeai.com`)
2. Click **"Reply"**
3. Check the **"From:"** field at the top of the compose window:

   ```
   From: [CodeScribe AI Support <support@codescribeai.com> ▼]
   ```

4. **If needed, change the sender:**
   - Click the dropdown (▼) next to the "From:" field
   - Select: `CodeScribe AI Support <support@codescribeai.com>`

5. Compose your reply and click **"Send"**

**What the recipient sees:**
```
From: CodeScribe AI Support <support@codescribeai.com>
To: customer@example.com
Subject: Re: Help with account issue

Hi [Customer Name],

Thanks for reaching out! I can help with that...

Best regards,
CodeScribe AI Support Team
```

**What the recipient does NOT see:**
- Your personal Gmail address (protected by Gmail's "Send as" system)
- Your real name (unless you include it in the signature)

---

### How It Works

**Email Flow Diagram:**

```
Customer Sends Email
        │
        ▼
support@codescribeai.com (Namecheap forwarding)
        │
        ▼
your-personal@gmail.com (received in inbox)
        │
        ▼
You Reply (select "Send as" support@codescribeai.com)
        │
        ▼
Gmail sends email
        │
        ▼
Customer receives email FROM support@codescribeai.com ✅
```

**Technical Details:**

**Using Option A (Gmail SMTP):**
- Gmail sends the email on behalf of `support@codescribeai.com`
- Email headers include:
  - `From: CodeScribe AI Support <support@codescribeai.com>`
  - `Reply-To: your-personal@gmail.com` (hidden from normal view)
  - `X-Google-Original-From: support@codescribeai.com`
- Most users only see the "From" field, which shows `support@codescribeai.com`
- Technical recipients inspecting full headers may see Gmail infrastructure
- **Privacy:** Your personal email is NOT exposed to normal users

**Using Option B (Custom SMTP):**
- Gmail connects to your email hosting's SMTP server
- Email headers include:
  - `From: CodeScribe AI Support <support@codescribeai.com>`
  - `Reply-To: support@codescribeai.com`
  - No Gmail references in headers
- Complete control over email headers
- Requires paid email hosting with SMTP access

---

### Troubleshooting

#### Verification Email Not Arriving

**Problem:** No verification email in inbox after 5-10 minutes

**Solutions:**
1. **Check spam folder** - Gmail verification emails sometimes get filtered
2. **Verify email forwarding is working:**
   - Send a test email to `support@codescribeai.com` from another account
   - Confirm it arrives in your Gmail inbox
   - If forwarding isn't working, see [Option A: Email Forwarding](#option-a-email-forwarding-via-namecheap-free-recommended-) setup
3. **Check Namecheap forwarding activation:**
   - You must click the confirmation link Namecheap sent when you set up forwarding
   - Forwarding will NOT work until confirmed
4. **Wait longer:** DNS changes can take up to 30 minutes
5. **Try again:** Click "Resend verification email" in Gmail settings

#### "Send as" Not Appearing in Dropdown

**Problem:** `support@codescribeai.com` doesn't show in "From:" dropdown when composing

**Solutions:**
1. **Verify email address is verified:**
   - Go to Gmail Settings → Accounts and Import → "Send mail as:"
   - Check for green checkmark next to `support@codescribeai.com`
   - If no checkmark, complete verification first
2. **Refresh Gmail:**
   - Close and reopen Gmail
   - Or hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. **Clear browser cache** (if still not appearing)

#### Emails Rejected or Bounced

**Problem:** Emails sent as `support@codescribeai.com` are rejected by recipient's server

**Solutions:**
1. **Check SPF record:** Add Gmail to your SPF record if using Option A (Gmail SMTP):
   ```
   v=spf1 include:_spf.resend.com include:_spf.google.com ~all
   ```
   - This authorizes Gmail to send on behalf of your domain
   - Add to Namecheap Advanced DNS as TXT record (Host: `@`)

2. **Wait for DNS propagation:** After adding SPF record, wait 30 minutes to 2 hours

3. **Test email deliverability:** Use [mail-tester.com](https://www.mail-tester.com/)
   - Send email from `support@codescribeai.com` to the address provided
   - Check your spam score and authentication results

4. **Consider DMARC policy:** Add or update DMARC record to allow Gmail:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@codescribeai.com
   ```
   - `p=none` allows both Resend and Gmail to send
   - Monitor reports at `dmarc@codescribeai.com` (also set up forwarding)

#### "Reply-To" Concerns

**Problem:** Worried that your personal email is exposed in "Reply-To" header

**Understanding:**
- **Normal users:** Only see "From: support@codescribeai.com" in their email client
- **Technical users:** Can inspect full headers and see "Reply-To: your-personal@gmail.com"
- **Privacy level:** Medium (exposed only to advanced users inspecting headers)

**Solutions if you need higher privacy:**
1. **Use Option B (Custom SMTP):**
   - Requires paid email hosting (Namecheap Private Email $0.99/mo, Google Workspace $6/mo)
   - Provides complete header control, no Gmail references
2. **Use Google Workspace:**
   - Full professional email hosting
   - No "Send as" needed - you directly log in as `support@codescribeai.com`
   - See [Option B: Google Workspace](#option-b-google-workspace--microsoft-365-paid-professional)
3. **Accept the trade-off:**
   - For most small businesses and startups, Gmail "Send as" is perfectly acceptable
   - 99%+ of users never inspect email headers
   - Cost savings vs paid hosting may be worth it

---

### Best Practices

1. **Use a Professional Signature:**
   ```
   Best regards,
   CodeScribe AI Support Team

   https://codescribeai.com
   support@codescribeai.com
   ```

2. **Create a Gmail Filter:**
   - Auto-label emails forwarded from `support@codescribeai.com`
   - Keep support requests organized
   - Set up in Gmail Settings → Filters and Blocked Addresses

3. **Set Up Canned Responses:**
   - Gmail Settings → Advanced → Enable "Templates"
   - Create templates for common support replies
   - Saves time responding to frequent questions

4. **Use Gmail Keyboard Shortcuts:**
   - Enable in Gmail Settings → General → Keyboard shortcuts
   - `R` = Reply (auto-selects "Send as" if default)
   - `Shift+R` = Reply all
   - `F` = Forward

5. **Monitor Email Deliverability:**
   - Periodically check spam folder for false positives
   - Ask customers to whitelist `support@codescribeai.com`
   - Use [mail-tester.com](https://www.mail-tester.com/) to check spam score

---

### Privacy & Security Notes

**What is exposed:**
- Your "Send as" configuration (only to you in Gmail settings)
- Technical email headers (only visible to advanced users)

**What is NOT exposed:**
- Your personal email address (to normal users)
- Your real name (unless you include it in signature)
- Your Gmail account password

**Security recommendations:**
1. **Enable 2-Factor Authentication (2FA)** on your Gmail account
2. **Use a strong password** for Gmail
3. **Review account activity** regularly in Gmail settings
4. **Don't share Gmail login credentials** with team members (use Google Workspace instead)

**When to upgrade to paid hosting:**
- Your team grows beyond 1-2 people (use Google Workspace shared mailbox)
- You need complete email header privacy
- You require advanced email features (shared calendars, team drives)
- You're processing sensitive customer data (HIPAA, PCI compliance)

---

### Related Documentation

- [Option A: Namecheap Email Forwarding](#option-a-email-forwarding-via-namecheap-free-recommended-) - Initial setup
- [Option B: Google Workspace](#option-b-google-workspace--microsoft-365-paid-professional) - Professional alternative
- [Support Email Configuration](#inbound-email-setup-support) - Overview of support email setup
- [EMAIL-RATE-LIMITING.md](../security/EMAIL-RATE-LIMITING.md) - Support email quotas

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
| **Development** | `dev@codescribeai.com` * | Local testing, feature development |
| **Preview** | `preview@codescribeai.com` * | Feature branch previews |
| **Production** | `noreply@codescribeai.com` * | Live user emails |

**\* Important:** If you verified a subdomain in Resend (e.g., `mail.codescribeai.com`), use that subdomain in all email addresses above (e.g., `dev@mail.codescribeai.com`, `preview@mail.codescribeai.com`, `noreply@mail.codescribeai.com`).

**Vercel Environment Variables:**

```env
# Development/Local (.env)
RESEND_API_KEY=re_xxxxxxxx  # Same key
EMAIL_FROM=dev@codescribeai.com  # Or dev@mail.codescribeai.com if using subdomain

# Preview (Vercel → Preview)
RESEND_API_KEY=re_xxxxxxxx  # Same key
EMAIL_FROM=preview@codescribeai.com  # Or preview@mail.codescribeai.com if using subdomain

# Production (Vercel → Production)
RESEND_API_KEY=re_xxxxxxxx  # Same key
EMAIL_FROM=noreply@codescribeai.com  # Or noreply@mail.codescribeai.com if using subdomain
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

### ⭐ Current Setup: Subdomain (mail.codescribeai.com)

**This is what CodeScribe AI uses:**

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click **"Add Domain"**
3. Enter subdomain: `mail.codescribeai.com`
4. Select **"Use this domain for sending"**
5. Click **"Add"**

### Why Use a Subdomain?

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

**Technical Details:**
- Domain verified in Resend: `mail.codescribeai.com`
- Emails sent from: `dev@mail.codescribeai.com`, `noreply@mail.codescribeai.com`, etc.
- DNS records use subdomain hosts (e.g., `send.mail`, `resend._domainkey`, etc.)
- Separate from root domain email forwarding (`support@codescribeai.com`)

**Alternative:** See [Appendix: Root Domain Setup](#appendix-root-domain-setup) if you prefer using the root domain instead.

---

## Step 4: Configure DNS Records in Namecheap

After adding your domain, Resend will display DNS records to configure. Follow these steps:

### 4.1 Access Namecheap DNS Settings

1. Log in to [Namecheap](https://www.namecheap.com/)
2. Go to **"Domain List"**
3. Click **"Manage"** next to your domain
4. Navigate to **"Advanced DNS"** tab

### 4.2 Get DNS Records from Resend

Before adding records in Namecheap, you need to get the exact values from Resend:

1. **Navigate to Resend Domain Settings:**
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Click on your domain (e.g., `codescribeai.com`)
   - You'll see a page titled "Domain Settings"

2. **Locate DNS Records Section:**
   - Scroll down to find the **"DNS Records"** section
   - You'll see a table with records you need to add
   - Each record will have: **Type**, **Name**, **Value**, and **Priority** (for MX records)

3. **Copy Records to Notepad (Recommended):**
   - Open a text editor or notepad
   - Copy each record's details from Resend
   - This prevents mistakes when entering values in Namecheap

**Example of what you'll see in Resend (subdomain `mail.codescribeai.com`):**

```
DNS Records for mail.codescribeai.com

┌──────────┬────────────────────────┬──────────────────────────────────────┬──────────┐
│ Type     │ Name                   │ Value                                │ Priority │
├──────────┼────────────────────────┼──────────────────────────────────────┼──────────┤
│ TXT      │ send.mail              │ v=spf1 include:_spf.resend.com ~all  │ -        │
│ TXT      │ resend._domainkey.mail │ p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...   │ -        │
│ MX       │ send.mail              │ feedback-smtp.us-east-1.amazonses... │ 10       │
│ TXT      │ _dmarc                 │ v=DMARC1; p=none;                    │ -        │
└──────────┴────────────────────────┴──────────────────────────────────────┴──────────┘
```

**⚠️ Important Notes:**
- Resend uses AWS SES infrastructure - your MX record will point to `feedback-smtp.us-east-1.amazonses.com` (not `feedback-smtp.resend.com`)
- The SPF record includes `_spf.resend.com` (note the underscore and "spf" subdomain)
- The exact record names/hosts depend on whether you're using a root domain or subdomain
- **Always copy the exact values from YOUR Resend dashboard** - they are the authoritative source

---

### 4.3 Add SPF Record (TXT)

**Purpose:** Authorizes Resend to send emails on your behalf

**⚠️ Note:** There is no "SPF Record" type in Namecheap - SPF records are implemented as **TXT Records**.

**Step-by-step in Namecheap:**

1. **In the Advanced DNS tab, scroll down to "HOST RECORDS" section**

2. **Click the "ADD NEW RECORD" button**

3. **Select Record Type:**
   - Click the **Type** dropdown
   - Select **"TXT Record"**

4. **Fill in the fields:**

   | Field | Value from Resend | What to Enter |
   |-------|-------------------|---------------|
   | **Type** | TXT | Select "TXT Record" from dropdown |
   | **Host** | `@` (in Resend's "Name" column) | Enter `@` |
   | **Value** | `v=spf1 include:_spf.resend.com ~all` | Copy exact value from Resend |
   | **TTL** | - | Select "Automatic" from dropdown |

5. **Click the green checkmark (✓) button to save**

**Visual Guide:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ADD NEW RECORD                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Type:  [TXT Record ▼]                                          │
│ Host:  [@                                ]                      │
│ Value: [v=spf1 include:_spf.resend.com ~all]                   │
│ TTL:   [Automatic ▼]                                           │
│                                                      [✓] [✗]    │
└─────────────────────────────────────────────────────────────────┘
```

**⚠️ Important:** If you already have an SPF record (check existing records first), **DO NOT create a duplicate**. Instead:
1. Find the existing TXT record with `v=spf1` in the value
2. Click the **Edit** (pencil) icon
3. Modify the existing value to include Resend:
   ```
   v=spf1 include:_spf.resend.com include:other-service.com ~all
   ```

---

### 4.4 Add DKIM Records (TXT)

**Purpose:** Cryptographic signature to verify email authenticity

Resend will provide **1-3 DKIM records**. You need to add each one separately.

**Step-by-step for EACH DKIM record:**

1. **In Resend, find the DKIM record:**
   - Look for records with Type: **TXT**
   - Name will be something like: `resend._domainkey` or `resend._domainkey.codescribeai.com`
   - Value will be a long string starting with `p=MIGfMA0GCSq...`

2. **In Namecheap, click "ADD NEW RECORD" again**

3. **Select Record Type:**
   - Type dropdown → **"TXT Record"**

4. **Fill in the fields carefully:**

   | Field | What Resend Shows | What to Enter in Namecheap |
   |-------|-------------------|----------------------------|
   | **Type** | TXT | Select "TXT Record" |
   | **Host** | `resend._domainkey` or `resend._domainkey.codescribeai.com` | Enter **only** `resend._domainkey` (remove domain if shown) |
   | **Value** | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...` (very long) | Copy the **entire** value exactly as shown |
   | **TTL** | - | Select "Automatic" |

5. **Click the green checkmark (✓) to save**

**Visual Guide:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ ADD NEW RECORD                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Type:  [TXT Record ▼]                                               │
│ Host:  [resend._domainkey                         ]                 │
│ Value: [p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...]               │
│        (very long string - paste entire value)                       │
│ TTL:   [Automatic ▼]                                                │
│                                                           [✓] [✗]    │
└──────────────────────────────────────────────────────────────────────┘
```

**⚠️ Critical Tips:**

1. **Host field - Remove domain suffix:**
   - If Resend shows: `resend._domainkey.codescribeai.com`
   - Enter in Namecheap: `resend._domainkey` (without `.codescribeai.com`)
   - Namecheap automatically appends your domain

2. **Value field - Copy entire string:**
   - DKIM values are typically 200-400 characters long
   - Copy the **entire** value from Resend
   - Don't add quotes or extra spaces
   - Don't truncate or split the value

3. **Character Limit (if exceeded):**
   - Namecheap has a ~255 character limit per TXT record
   - If Resend's DKIM value is longer, you have options:
     - **Option A:** Resend may provide the key split into multiple records (add each separately)
     - **Option B:** Contact Namecheap support to increase limit
     - **Option C:** Use a subdomain (often has higher limits)

**Repeat for all DKIM records** (Resend may provide 1-3 DKIM records - add each one)

### 4.5 Add MX Record (Optional)

**Purpose:** Receive bounce/feedback notifications (recommended)

**⚠️ Note:** This is optional but recommended for production email monitoring.

**Step-by-step in Namecheap:**

1. **In Resend, find the MX record:**
   - Look for record with Type: **MX**
   - Name: `@` (or your domain)
   - Value: `feedback-smtp.resend.com`
   - Priority: `10`

2. **In Namecheap, click "ADD NEW RECORD"**

3. **Select Record Type:**
   - Type dropdown → **"MX Record"**

4. **Fill in the fields:**

   | Field | Value from Resend | What to Enter |
   |-------|-------------------|---------------|
   | **Type** | MX | Select "MX Record" from dropdown |
   | **Host** | Check Resend (e.g., `send`, `send.mail`) | Copy exact host from Resend |
   | **Value** | `feedback-smtp.us-east-1.amazonses.com` | Copy exact value from Resend |
   | **Priority** | `10` | Enter `10` |
   | **TTL** | - | Select "Automatic" |

5. **Click the green checkmark (✓) to save**

**Visual Guide:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ADD NEW RECORD                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Type:     [MX Record ▼]                                        │
│ Host:     [send.mail                      ]  (example)         │
│ Value:    [feedback-smtp.us-east-1.amazonses.com]             │
│ Priority: [10                            ]                     │
│ TTL:      [Automatic ▼]                                        │
│                                                      [✓] [✗]    │
└─────────────────────────────────────────────────────────────────┘
```

**⚠️ Important:** If you already have MX records configured (for email hosting):
- This MX record is ONLY for Resend bounce notifications
- If you're using email forwarding or Google Workspace, those MX records are separate
- You can have multiple MX records with different priorities
- Lower priority number = higher priority (e.g., Priority 10 is checked before Priority 20)

---

### 4.6 Add DMARC Record (Optional but Recommended)

**Purpose:** Email authentication policy and reporting

**⚠️ Note:** This is optional for initial setup but recommended for production email security.

**Step-by-step in Namecheap:**

1. **DMARC is not shown in Resend - you create this manually**

2. **In Namecheap, click "ADD NEW RECORD"**

3. **Select Record Type:**
   - Type dropdown → **"TXT Record"**

4. **Fill in the fields:**

   | Field | What to Enter |
   |-------|---------------|
   | **Type** | Select "TXT Record" from dropdown |
   | **Host** | Enter `_dmarc` |
   | **Value** | `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com` (replace `yourdomain.com` with your actual domain) |
   | **TTL** | Select "Automatic" |

5. **Click the green checkmark (✓) to save**

**Visual Guide:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ADD NEW RECORD                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Type:  [TXT Record ▼]                                                   │
│ Host:  [_dmarc                                ]                          │
│ Value: [v=DMARC1; p=none; rua=mailto:dmarc@codescribeai.com]           │
│ TTL:   [Automatic ▼]                                                    │
│                                                              [✓] [✗]     │
└──────────────────────────────────────────────────────────────────────────┘
```

**DMARC Policy Levels:**
- `p=none` - Monitor only (recommended for initial setup)
- `p=quarantine` - Mark suspicious emails as spam (after testing)
- `p=reject` - Reject unauthorized emails (production, after confidence)

**Recommended Progression:**
1. Start with `p=none` for 2-4 weeks
2. Monitor DMARC reports sent to your email
3. Once confident, change to `p=quarantine`
4. After stable period, upgrade to `p=reject` for maximum security

---

### 4.7 Verify All Records Are Added

**Final Checklist - Your Namecheap "HOST RECORDS" should now show:**

```
┌──────────┬────────────────────┬──────────────────────────────────────┬──────────┬─────┐
│ Type     │ Host               │ Value                                │ Priority │ TTL │
├──────────┼────────────────────┼──────────────────────────────────────┼──────────┼─────┤
│ TXT      │ send.mail          │ v=spf1 include:_spf.resend.com ~all  │ -        │ Auto│
│ TXT      │ resend._domainkey  │ p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...   │ -        │ Auto│
│ MX       │ send.mail          │ feedback-smtp.us-east-1.amazonses... │ 10       │ Auto│
│ TXT      │ _dmarc             │ v=DMARC1; p=none;                    │ -        │ Auto│
└──────────┴────────────────────┴──────────────────────────────────────┴──────────┴─────┘
```

**Note:** Host values (`send.mail`, `resend._domainkey`, etc.) depend on your domain configuration in Resend. Always verify against your Resend dashboard.

**Required Records (minimum):**
- ✅ 1 SPF record (TXT with `v=spf1`)
- ✅ 1+ DKIM records (TXT with `resend._domainkey`)

**Optional but Recommended:**
- ⚠️ 1 MX record (for bounce notifications)
- ⚠️ 1 DMARC record (for email authentication policy)

**Save and Continue:**
- Once all records are added, proceed to Step 5: Verify Domain
- DNS propagation typically takes 30 minutes to 2 hours

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

**⚠️ IMPORTANT - Subdomain vs Root Domain:**

If you verified a **subdomain** in Resend (e.g., `mail.codescribeai.com`), you MUST use that subdomain in all `EMAIL_FROM` addresses:

```env
# If you verified mail.codescribeai.com (subdomain):
EMAIL_FROM=dev@mail.codescribeai.com

# If you verified codescribeai.com (root domain):
EMAIL_FROM=dev@codescribeai.com
```

**How to check which domain you verified:**
1. Go to [Resend Domains](https://resend.com/domains)
2. Look at your verified domain - it will show either:
   - `codescribeai.com` (root domain)
   - `mail.codescribeai.com` (subdomain)
3. Use the **exact verified domain** in your `EMAIL_FROM` addresses

**Note:** Using `dev@` prefix clearly marks emails as development/testing.

### 6.2 Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **codescribe-ai**
3. Navigate to **Settings** → **Environment Variables**
4. Add environment-specific variables:

#### Option 1: Single API Key (Recommended)

**⚠️ IMPORTANT:** Replace `codescribeai.com` with your **actual verified domain** from Resend. If you verified a subdomain like `mail.codescribeai.com`, use that subdomain in all email addresses below.

| Key | Value | Environments |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_xxxxx...` | ✅ Production, ✅ Preview, ✅ Development |
| `EMAIL_FROM` | `noreply@codescribeai.com` * | ✅ Production only |
| `EMAIL_FROM` | `preview@codescribeai.com` * | ✅ Preview only |
| `EMAIL_FROM` | `dev@codescribeai.com` * | ✅ Development only |

**\* Domain Note:** If you verified `mail.codescribeai.com` (subdomain), use:
- Production: `noreply@mail.codescribeai.com`
- Preview: `preview@mail.codescribeai.com`
- Development: `dev@mail.codescribeai.com`

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
3. **Value:** `noreply@codescribeai.com` (or `noreply@mail.codescribeai.com` if using subdomain)
4. **Environments:** Check **Production only** ✅ (uncheck Preview and Development)
5. Click **"Save"**

**Step 3: Add EMAIL_FROM for Preview**
1. Click **"Add Variable"** again (same key name!)
2. **Key:** `EMAIL_FROM`
3. **Value:** `preview@codescribeai.com` (or `preview@mail.codescribeai.com` if using subdomain)
4. **Environments:** Check **Preview only** ✅ (uncheck Production and Development)
5. Click **"Save"**

**Step 4: Add EMAIL_FROM for Development**
1. Click **"Add Variable"** again (same key name!)
2. **Key:** `EMAIL_FROM`
3. **Value:** `dev@codescribeai.com` (or `dev@mail.codescribeai.com` if using subdomain)
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

### DNS Verification Failures

**Problem:** Resend shows "Loading..." or fails to verify DNS records even after waiting

**Common Causes:**

1. **Wrong SPF include domain**
   - ❌ `v=spf1 include:resend.com ~all` (WRONG)
   - ✅ `v=spf1 include:_spf.resend.com ~all` (CORRECT)

2. **Wrong MX record**
   - ❌ `feedback-smtp.resend.com` (outdated)
   - ✅ `feedback-smtp.us-east-1.amazonses.com` (correct - Resend uses AWS SES)

3. **DNS not propagated yet**
   - Wait 5-30 minutes after adding records
   - Click "Restart" button in Resend dashboard to force re-check

**Verification Commands:**

```bash
# Verify SPF record (check for _spf.resend.com)
dig TXT send.mail.codescribeai.com

# Verify DKIM record
dig TXT resend._domainkey.mail.codescribeai.com

# Verify MX record (check for amazonses.com)
dig MX send.mail.codescribeai.com
```

**What to look for:**
- Each command should have an `ANSWER SECTION` with the record
- SPF must contain `include:_spf.resend.com`
- MX must point to `feedback-smtp.us-east-1.amazonses.com`
- If no ANSWER section, DNS hasn't propagated yet

**Solution:**
1. Verify records match exactly what Resend dashboard shows
2. Wait 15-30 minutes for DNS propagation
3. Run verification commands above to confirm records are live
4. Click "Restart" button in Resend dashboard
5. Verification should succeed within seconds

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
TXT @ v=spf1 include:_spf.resend.com ~all
TXT @ v=spf1 include:mailgun.org ~all
```

**✅ Correct (Single combined SPF):**
```
TXT @ v=spf1 include:_spf.resend.com include:mailgun.org ~all
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
- [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) - Complete deployment guide
- [VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md) - All environment variables
- [MVP-DEPLOY-LAUNCH.md](../planning/mvp/MVP-DEPLOY-LAUNCH.md) - Production deployment

**Authentication:**
- [PASSWORD-RESET-SETUP.md](../authentication/PASSWORD-RESET-SETUP.md) - Password reset configuration
- [PASSWORD-RESET-IMPLEMENTATION.md](../authentication/PASSWORD-RESET-IMPLEMENTATION.md) - Implementation guide
- [GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md) - OAuth configuration

---

## Appendix: Alternative Configurations

### Appendix A: Root Domain Setup

If you prefer to use your root domain (`codescribeai.com`) instead of a subdomain:

**Pros:**
- Simpler email addresses (`noreply@codescribeai.com` vs `noreply@mail.codescribeai.com`)
- One less DNS layer to manage
- Good for small projects or MVPs

**Cons:**
- Email reputation tied to main domain
- Risk to SEO if email issues occur
- Less professional for high-volume sending

**Setup Changes:**
1. In Resend, add `codescribeai.com` instead of `mail.codescribeai.com`
2. DNS records use `@` or root domain hosts instead of subdomain hosts
3. Environment variables: `EMAIL_FROM=dev@codescribeai.com` (no subdomain)

**Compatibility with Email Forwarding:**
- Can conflict if both use root domain
- Requires careful MX record configuration
- Not recommended if using Namecheap email forwarding for support@

### Appendix B: Separate API Keys (Enterprise Setup)

If you need complete isolation between dev and production:

**When to Use:**
- High email volume in development
- Compliance requirements (HIPAA, SOC 2)
- Multiple team members
- Need separate rate limits

**Setup:**
1. Create two domains in Resend:
   - `dev.codescribeai.com` for development
   - `mail.codescribeai.com` for production
2. Generate separate API keys scoped to each domain
3. Set environment-specific `RESEND_API_KEY` in Vercel
4. Configure separate DNS records for each domain

**Benefits:**
- Complete isolation (quotas, reputation, monitoring)
- Dev testing doesn't affect production limits
- Better security (key compromise affects only one env)

**Drawbacks:**
- More DNS records to manage
- Two dashboards to monitor
- Higher complexity

### Appendix C: Professional Email Hosting (Google Workspace)

For teams needing full inbox functionality:

**When to Use:**
- Multiple team members need access to support@
- Need to send AND receive as support@codescribeai.com
- Want shared inbox, calendar, drive integration
- Professional appearance for customer support

**Cost:** $6/user/month (Google Workspace Business Starter)

**Setup Summary:**
1. Sign up at workspace.google.com
2. Verify domain ownership (TXT record)
3. Configure MX records (replaces Namecheap forwarding)
4. Create support@codescribeai.com user
5. Set up as shared mailbox for team

**Note:** Requires replacing Namecheap email forwarding with Google's MX records.

See [RESEND-SETUP.md lines 157-231](RESEND-SETUP.md#option-b-google-workspace--microsoft-365-paid-professional) for full instructions.

### Appendix D: Resend Inbound Webhooks

For programmatic email handling (advanced):

**Use Case:** Automatically create support tickets when customers email `support@codescribeai.com`

**Requirements:**
- Backend webhook endpoint
- Resend inbound configuration
- Database for ticket storage

**Complexity:** High - requires custom development

See [RESEND-SETUP.md lines 234-346](RESEND-SETUP.md#option-c-resend-inbound-webhooks-advanced-programmatic) for full implementation guide.

---

## Changelog

- **v4.1** (November 5, 2025) - Gmail "Send Mail As" Configuration
  - **New Section Added:**
    - Comprehensive [Gmail "Send Mail As" Configuration](#gmail-send-mail-as-configuration) guide (350+ lines)
    - Step-by-step setup instructions with visual diagrams
    - Two verification methods: Gmail SMTP (recommended) vs Custom SMTP (advanced)
    - SMTP configuration details for Namecheap Private Email and Google Workspace
    - Complete troubleshooting section (verification issues, bounced emails, privacy concerns)
    - Email flow diagrams showing how forwarding + "Send as" works together
    - Technical details about email headers and privacy implications
    - Best practices for professional support workflows
    - Security recommendations and when to upgrade to paid hosting
  - **Updated Quick Start:**
    - Changed step 6 in Namecheap Email Forwarding to reference new Gmail configuration section
    - Removed brief inline instructions (now in dedicated section)
  - **Updated Table of Contents:**
    - Added Gmail "Send Mail As" Configuration as item #4
    - Renumbered subsequent sections
  - **Goal:** Provide complete guidance for replying FROM `support@codescribeai.com` using free Gmail "Send as" feature, eliminating need for paid email hosting for solo founders

- **v4.0** (October 27, 2025) - Documentation Reorganization & Real-World Setup
  - **Major Restructure:**
    - Added "Quick Start - Your Actual Setup" section at top showing CodeScribe AI's actual configuration
    - Reorganized to show subdomain (`mail.codescribeai.com`) as primary setup (was previously Option B)
    - Moved alternative configurations (root domain, separate API keys, Google Workspace) to Appendix
    - Updated email address examples throughout to use `@mail.codescribeai.com` subdomain
  - **Namecheap Email Forwarding Corrections:**
    - Fixed location: Domain tab → "Redirect Email" (not Advanced DNS)
    - Documented Mail Settings dropdown (Email Forwarding vs Custom MX modes)
    - Added warning about confirming forwarding activation via email
    - Clarified that switching to "Custom MX" disables email forwarding
  - **Key Decisions Documented:**
    - Why subdomain was chosen (reputation protection, professional best practice)
    - Why single API key across environments (simplicity for portfolio project)
    - Why Namecheap forwarding vs paid hosting (cost efficiency)
  - **Improved Navigation:**
    - Clear markers showing "CURRENT SETUP" vs alternatives
    - Jump links to appendixes for alternative configurations
    - Summary comparison tables for different approaches
  - **Goal:** Make it easier for future users to follow the actual implementation path used by CodeScribe AI
- **v3.2** (October 27, 2025) - DNS Record Corrections (AWS SES Infrastructure Update)
  - **Critical Fixes:**
    - Fixed SPF record value from `include:resend.com` to `include:_spf.resend.com` (all instances)
    - Updated MX record value from `feedback-smtp.resend.com` to `feedback-smtp.us-east-1.amazonses.com`
    - Corrected all visual guides and examples to reflect actual Resend infrastructure
    - Added warnings emphasizing that Resend uses AWS SES backend
  - **New Troubleshooting Section:**
    - Added "DNS Verification Failures" section with common causes
    - Included verification commands using `dig` for SPF, DKIM, and MX records
    - Added step-by-step debugging workflow with expected output
    - Documented "Restart" button usage in Resend dashboard
  - **Enhanced Examples:**
    - Updated Section 4.2 DNS record example table with correct values
    - Updated Section 4.3 (SPF) with correct `_spf.resend.com` include
    - Updated Section 4.5 (MX) with correct `amazonses.com` hostname
    - Updated Section 4.7 verification checklist with real-world values
  - **Note:** These changes reflect Resend's current AWS SES-based infrastructure. Previous versions showed outdated DNS values.
- **v3.1** (October 26, 2025) - Enhanced DNS configuration and subdomain clarification
  - **DNS Configuration Enhancements:**
    - Added detailed Section 4.2: "Get DNS Records from Resend" with visual example
    - Expanded Section 4.3 (SPF) with step-by-step Namecheap instructions and visual guide
    - Expanded Section 4.4 (DKIM) with detailed field mapping and critical tips
    - Enhanced Section 4.5 (MX) with complete Namecheap workflow
    - Enhanced Section 4.6 (DMARC) with manual setup instructions
    - Added new Section 4.7: Verification checklist with visual table
    - Included exact UI element names ("ADD NEW RECORD" button, green checkmark, etc.)
    - Added visual ASCII diagrams of Namecheap form fields
    - Clarified Host field domain suffix removal for DKIM records
    - Added warnings about character limits and duplicate SPF records
    - Improved progression from Resend → Notepad → Namecheap workflow
  - **Subdomain Impact on EMAIL_FROM:**
    - Added prominent warning in Section 6.1 about subdomain vs root domain
    - Added "How to check which domain you verified" instructions
    - Updated Section 6.2 with subdomain variations for all environment variables
    - Added inline examples showing both root domain and subdomain options
    - Updated environment configuration strategy table with subdomain note
    - Updated all Vercel environment variable examples with subdomain alternatives

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

**Last Updated:** November 5, 2025
**Maintained By:** CodeScribe AI Team
