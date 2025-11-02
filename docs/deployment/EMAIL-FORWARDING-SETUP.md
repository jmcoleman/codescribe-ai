# Email Forwarding Setup - Namecheap

**Purpose:** Configure email forwarding for sales@codescribeai.com and support@codescribeai.com
**Required For:** Contact Sales functionality & Support inquiries
**Time Required:** 5-10 minutes
**Cost:** FREE (included with domain registration)

---

## Overview

Both sales and support emails are sent TO your domain via Resend. To receive these emails, we forward them to your personal email address using Namecheap's free email forwarding.

**Email Addresses:**
- **sales@codescribeai.com** - Contact Sales form (Enterprise/Team tier inquiries)
- **support@codescribeai.com** - Support inquiries (in transactional emails)

**Flow:**
```
App/Email → Resend API → sales/support@codescribeai.com → Namecheap Forwarding → Your Gmail
```

---

## Quick Setup Checklist

- [ ] Log into Namecheap → Domain List → Manage codescribeai.com
- [ ] Go to Advanced DNS → Mail Settings
- [ ] Add forwarder: `sales` → Your Gmail
- [ ] Add forwarder: `support` → Your Gmail
- [ ] Verify MX records are present
- [ ] Test both emails by sending test messages
- [ ] (Optional) Set up Gmail filters for organization

**Time Required:** 5-10 minutes total

---

## Setup Instructions (Namecheap)

### 1. Access Domain Management

1. Go to https://www.namecheap.com/
2. Sign in to your account
3. Click **"Domain List"** in the left sidebar
4. Find `codescribeai.com` and click **"Manage"**

### 2. Navigate to Redirect Email Section

**IMPORTANT:** Email forwarding is under "Redirect Email", NOT "Advanced DNS"

1. On the domain management page, look in the left sidebar
2. Find and click **"Domain List"** (you're already here)
3. Look for **"REDIRECT EMAIL"** section in the main content area
4. You should see:
   - **Alias** column (e.g., "support", "Catch-All")
   - **Forward to** column (e.g., "jenni.m.coleman@gmail.com")
   - **ADD FORWARDER** button (red button at bottom)

### 3. Add Email Forwarder for Sales

**Note:** If you see `support@codescribeai.com` already configured in the list, that's correct! We just need to add `sales@` following the same pattern.

**Add Sales Forwarder:**
1. Click the **"ADD FORWARDER"** button (red button at bottom of the table)
2. Fill in the form:
   - **Alias:** `sales` (this creates sales@codescribeai.com)
   - **Forward To:** Your personal Gmail address (same one used for support@)
3. Click **"Add Forwarder"** or **"Save"**

**Result:**
- sales@codescribeai.com will forward to your Gmail inbox
- support@codescribeai.com continues working as before
- Both email addresses now active and ready to receive inquiries

### 4. Verify DNS Records

Namecheap should automatically configure these MX records:
```
Type: MX
Host: @
Value: mx1.privateemail.com (or similar)
Priority: 10

Type: MX
Host: @
Value: mx2.privateemail.com (or similar)
Priority: 10
```

If not present:
- Namecheap will guide you through adding them
- Or they'll be auto-created within a few minutes

### 5. Wait for Propagation

- DNS changes typically propagate in **5-30 minutes**
- Often instant with Namecheap
- You can check status at: https://dnschecker.org/

---

## Testing Email Forwarding

### Quick Test

Test both email addresses to verify forwarding works:

1. **Test Sales Email:**
   ```
   To: sales@codescribeai.com
   From: Your personal email or another account
   Subject: Test Sales Forwarding
   Body: Testing sales@ forwarding
   ```

2. **Test Support Email:**
   ```
   To: support@codescribeai.com
   From: Your personal email or another account
   Subject: Test Support Forwarding
   Body: Testing support@ forwarding
   ```

3. **Verify Receipt:**
   - Check your Gmail inbox (both emails should arrive)
   - Look in Spam folder if not in inbox
   - Emails should arrive within 1-2 minutes each

### Test via Contact Form (After Deployment)

1. Go to https://codescribeai.com/pricing
2. Sign in to your account
3. Click "Contact Sales" on Enterprise or Team tier
4. Fill out the form and submit
5. Check your Gmail for the inquiry email

**Expected Email:**
- **From:** noreply@mail.codescribeai.com (via Resend)
- **To:** sales@codescribeai.com (forwarded to your Gmail)
- **Reply-To:** User's email address
- **Subject:** "Enterprise Plan Inquiry from [User Name]"
- **Body:** Branded HTML email with user details

---

## Gmail Organization (Optional)

### Set Up Filters for Business Emails

Organize sales and support emails with Gmail filters:

**Filter 1 - Sales Inquiries:**

1. **Create Gmail Filter:**
   - Click the search bar dropdown
   - **To:** sales@codescribeai.com
   - Click "Create filter"

2. **Apply Actions:**
   - ✅ Apply label: "CodeScribe/Sales"
   - ✅ Never send it to Spam
   - ✅ Star it (optional)
   - Click "Create filter"

**Filter 2 - Support Inquiries:**

1. **Create Gmail Filter:**
   - Click the search bar dropdown
   - **To:** support@codescribeai.com
   - Click "Create filter"

2. **Apply Actions:**
   - ✅ Apply label: "CodeScribe/Support"
   - ✅ Never send it to Spam
   - Click "Create filter"

**Benefits:**
- All inquiries automatically labeled and organized
- Easy to find and track by type
- Never miss an inquiry
- Clean inbox organization with nested labels

### Priority Inbox (Optional)

Add both "CodeScribe/Sales" and "CodeScribe/Support" labels to your Gmail Priority Inbox for instant notifications.

---

## Troubleshooting

### Email Not Arriving

1. **Check Spam Folder**
   - Forwarded emails sometimes go to spam
   - Mark as "Not Spam" to train Gmail

2. **Verify MX Records**
   - Go to https://dnschecker.org/
   - Enter `codescribeai.com`
   - Check MX records are present and propagated

3. **Check Namecheap Forwarding Status**
   - Go back to Advanced DNS
   - Verify forwarding rule is active (green checkmark)
   - Try deleting and re-adding the forwarder

4. **Wait for Propagation**
   - If just set up, wait 30 minutes
   - DNS can take up to 24 hours (rare)

### Forwarding Rule Not Saving

- **Issue:** Namecheap requires MX records to be set first
- **Solution:** Click "Activate Email Forwarding" button (if present)
- **Alternative:** Contact Namecheap support (usually instant via chat)

### Multiple Aliases

You can add more forwarders for different purposes:
- `support@codescribeai.com` → Your Gmail
- `hello@codescribeai.com` → Your Gmail
- `team@codescribeai.com` → Your Gmail

---

## Email Address Configuration

### Current Email Addresses

| Email Address | Type | Purpose | Status |
|--------------|------|---------|--------|
| **noreply@mail.codescribeai.com** | Sending | All transactional emails (via Resend) | ✅ Configured |
| **sales@codescribeai.com** | Forwarding | Contact Sales form inquiries | ✅ Configured (this guide) |
| **support@codescribeai.com** | Forwarding | Support link in emails | ✅ Configured (this guide) |

### Where Each Email is Used

**noreply@mail.codescribeai.com** (Sending only):
- Email verification emails
- Password reset emails
- Contact sales inquiry emails
- Future transactional emails

**sales@codescribeai.com** (Receiving only):
- Contact Sales form submissions (Enterprise/Team tiers)
- Sales inquiry emails with user details
- Located at: `/pricing` page → "Contact Sales" button

**support@codescribeai.com** (Receiving only):
- Footer link in all transactional emails
- User support inquiries
- General help requests

---

## Environment Variables

No environment variables needed! The email address is hardcoded in the contact sales email function:

**File:** `server/src/services/emailService.js`
```javascript
to: 'sales@codescribeai.com',
```

To change the destination email, you would need to:
1. Either: Update the forwarding rule in Namecheap
2. Or: Change the hardcoded address in the code (not recommended)

**Recommendation:** Keep using email forwarding for flexibility.

---

## How Reply Flow Works

When customers submit the contact form, the email system is configured to make replies easy and direct.

### Email Headers Example

When you receive a sales inquiry in Gmail, the email headers look like this:

```
From: noreply@mail.codescribeai.com
To: sales@codescribeai.com
Reply-To: customer@example.com  ← This is the magic!
Subject: Enterprise Plan Inquiry from John Doe
```

### Reply Process

1. **Customer submits contact form** with their email (customer@example.com)
2. **App sends email via Resend:**
   - FROM: noreply@mail.codescribeai.com (Resend sending address)
   - TO: sales@codescribeai.com (receives via Namecheap forwarding)
   - REPLY-TO: customer@example.com (customer's email address)
3. **Email arrives in your Gmail** showing:
   - From: noreply@mail.codescribeai.com
   - Reply-To: customer@example.com
4. **When you click "Reply" in Gmail:**
   - Gmail automatically uses the Reply-To address
   - Your reply goes directly to: customer@example.com
   - NOT to noreply@mail.codescribeai.com

### Why This Works

- **Sending domain protected:** Using mail.codescribeai.com keeps main domain reputation safe
- **No customer confusion:** Customer receives reply from your Gmail (or sales@ if configured)
- **Direct communication:** Reply goes straight to customer's inbox
- **Industry standard:** Same pattern used by Stripe, GitHub, Linear, etc.

### Optional Enhancement: Gmail "Send As"

**Not required, but makes replies more professional**

You can configure Gmail to send replies FROM sales@codescribeai.com instead of your personal email:

**Steps:**
1. Open Gmail Settings → Accounts → "Send mail as"
2. Click "Add another email address"
3. Enter: sales@codescribeai.com
4. Choose verification method:
   - **Option A:** Forward through Gmail (easiest)
   - **Option B:** Use Resend SMTP credentials

**Benefits:**
- Replies appear to come from sales@codescribeai.com
- More professional branding
- Consistent sender identity

**Current Setup Works Fine:**
Replying from your personal Gmail is totally acceptable for small businesses/startups. Customers expect it and prefer the human touch!

---

## Cost & Limitations

### Namecheap Email Forwarding

- **Cost:** FREE (included with domain)
- **Limit:** Unlimited forwarding rules
- **Limit:** Unlimited forwarded emails
- **Reliability:** Very high (99.9%+ uptime)

### Alternative: Private Email ($0.99-1.99/mo)

If you want to SEND from sales@codescribeai.com (not needed for current setup):
- Namecheap Private Email: $0.99/mo
- Google Workspace: $6/mo
- Not necessary since Resend handles sending

---

## Security & Privacy

### Forwarding is Secure

✅ **Encryption:** Emails forwarded over TLS/SSL
✅ **No Storage:** Namecheap doesn't store forwarded emails
✅ **Privacy:** Only you receive forwarded emails
✅ **Spam Protection:** Namecheap filters spam before forwarding

### Best Practices

1. **Don't Reply Directly:** Reply-to is set to user's email, so reply directly to them
2. **Archive Inquiries:** Keep track of sales conversations in Gmail
3. **Monitor Spam:** Check spam folder occasionally for false positives

---

## Related Documentation

- [RESEND-SETUP.md](RESEND-SETUP.md) - Configure Resend for sending emails
- [CUSTOM-DOMAIN-SETUP.md](CUSTOM-DOMAIN-SETUP.md) - Domain configuration
- [PASSWORD-RESET-IMPLEMENTATION.md](../architecture/PASSWORD-RESET-IMPLEMENTATION.md#support-email-setup) - Support email setup

---

## Quick Reference

**When to Use This Guide:**
- ✅ First-time email forwarding setup
- ✅ Adding new email aliases (support, team, hello, etc.)
- ✅ Troubleshooting email delivery issues
- ✅ Switching to a different Gmail account

**When Not Needed:**
- ❌ Sending emails (Resend handles this)
- ❌ Verification emails (already configured)
- ❌ Password reset emails (already configured)

---

**Last Updated:** November 2, 2025
**Status:** ✅ Production Ready
**Maintenance:** None required (set and forget)
