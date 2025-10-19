# Custom Domain Setup Guide - codescribeai.com

**Project:** CodeScribe AI
**Domain:** codescribeai.com
**Platform:** Vercel
**Last Updated:** October 19, 2025

---

## 📋 Overview

This guide walks you through setting up your custom domain `codescribeai.com` with your Vercel deployment. After completion, your application will be accessible at both `https://codescribeai.com` and `https://www.codescribeai.com`.

**What you'll accomplish:**
- Configure DNS records with your domain registrar
- Add the custom domain to your Vercel project
- Set up automatic HTTPS with SSL certificates
- Configure redirects (www ↔ non-www)
- Verify everything works correctly

**Time Required:** 10-15 minutes (plus DNS propagation time: 5 minutes - 48 hours)

---

## 🎯 Prerequisites

Before you begin, ensure you have:

- ✅ **Domain purchased:** codescribeai.com (purchased from your registrar)
- ✅ **Vercel project deployed:** codescribe-ai.vercel.app (currently live)
- ✅ **Vercel account access:** Ability to access project settings
- ✅ **Domain registrar access:** Login credentials for where you purchased the domain
- ✅ **DNS management access:** Ability to modify DNS records (usually through registrar)

---

## 🚀 Step-by-Step Setup

### Step 1: Add Domain to Vercel Project

**1.1 Navigate to Project Settings**
```bash
# Go to: https://vercel.com/dashboard
# Click on your project: codescribe-ai
# Click "Settings" tab
# Click "Domains" in the left sidebar
```

**1.2 Add Your Domain**
1. In the "Domains" section, you'll see an input field
2. Enter your domain: `codescribeai.com`
3. Click "Add" button
4. Vercel will show you DNS configuration requirements

**1.3 Add www Subdomain (Recommended)**
1. Repeat the process for: `www.codescribeai.com`
2. Click "Add" button
3. Vercel will provide DNS records for this as well

**Expected Result:**
Vercel displays a configuration panel with DNS records you need to add. Keep this tab open - you'll need these values.

---

### Step 2: Configure DNS Records

**Important:** DNS record types and values depend on your domain registrar. Vercel typically requires one of two configurations:

#### Option A: Using A Records (Most Common)

**For Root Domain (codescribeai.com):**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |

**For www Subdomain (www.codescribeai.com):**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | 3600 |

#### Option B: Using CNAME (If Supported by Registrar)

**For Root Domain (codescribeai.com):**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | cname.vercel-dns.com | 3600 |

**For www Subdomain (www.codescribeai.com):**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | 3600 |

**⚠️ Important Notes:**
- **Use the exact DNS values shown in your Vercel dashboard** (values above are examples and may differ)
- Vercel's IP addresses and CNAME targets may change - always use what Vercel shows you
- Some registrars use `@` for root, others use blank field or the domain name
- TTL (Time To Live) can be set to 3600 (1 hour) or lower for faster propagation

---

### Step 3: Add DNS Records at Namecheap

**3.1 Log into Namecheap**
1. Go to: https://www.namecheap.com
2. Click "Sign In" (top right)
3. Enter your credentials
4. Click "Domain List" in left sidebar

**3.2 Access DNS Management**
1. Find `codescribeai.com` in your domain list
2. Click "Manage" button next to the domain
3. Navigate to the "Advanced DNS" tab
4. You should see the DNS records interface

**3.3 Remove Namecheap Parking Page (If Present)**

⚠️ **IMPORTANT:** Namecheap adds default parking page records that conflict with Vercel. You must remove these first.

**Look for and DELETE these default records:**
- Type: **URL Redirect Record** or **A Record** pointing to Namecheap parking (e.g., `198.54.117.10`)
- Host: **@** or **www**

**How to delete:**
1. Find the parking/redirect record
2. Click the trash icon (🗑️) on the right side
3. Confirm deletion
4. Repeat for both `@` and `www` if present

**3.4 Add A Record for Root Domain**

1. Click "Add New Record" button
2. Configure the A record:
   - **Type:** Select "A Record" from dropdown
   - **Host:** Enter `@` (represents root domain)
   - **Value:** Enter `76.76.21.21` (⚠️ use exact IP from Vercel dashboard)
   - **TTL:** Select "Automatic" or "1 min" for faster propagation
3. Click the green checkmark (✓) to save

**Expected Result:**
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

**3.5 Add CNAME Record for www Subdomain**

1. Click "Add New Record" button
2. Configure the CNAME record:
   - **Type:** Select "CNAME Record" from dropdown
   - **Host:** Enter `www`
   - **Value:** Enter `cname.vercel-dns.com` (⚠️ use exact value from Vercel dashboard)
   - **TTL:** Select "Automatic" or "1 min" for faster propagation
3. Click the green checkmark (✓) to save

**Expected Result:**
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

**3.6 Verify Your DNS Records**

After adding both records, your Advanced DNS tab should show:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 76.76.21.21 | Automatic |
| CNAME Record | www | cname.vercel-dns.com. | Automatic |

**⚠️ Common Namecheap Gotchas:**
- Namecheap may add a trailing dot (`.`) to CNAME values - this is normal
- If you see "Record already exists" error, delete the conflicting record first
- Make sure "Namecheap BasicDNS" or "Namecheap PremiumDNS" is selected (not custom nameservers)
- Changes in Namecheap usually propagate within 5-30 minutes

**3.7 Save and Wait for Propagation**
- Namecheap automatically saves changes (no separate "Save" button)
- DNS propagation typically takes 5-30 minutes with Namecheap
- Some changes may be visible immediately

---

### Step 4: Configure Domain Settings in Vercel

**4.1 Wait for Domain Verification**
1. Go back to Vercel → Project Settings → Domains
2. Find `codescribeai.com` and `www.codescribeai.com` in the list
3. Wait for status to change from "Pending" to "Valid Configuration"
4. This usually takes 5-30 minutes after DNS records are added

**4.2 Configure Redirects**

Vercel automatically handles redirects between your domains. By default:
- The **first domain you add** becomes the primary domain
- Other domains automatically redirect to it

**To change which domain is primary:**

**Method 1: Edit Domain in Vercel Dashboard**
1. Go to Project Settings → Domains
2. Find the domain you want as primary (e.g., `codescribeai.com`)
3. Click **"Edit"** button next to the domain
4. Look for **"Redirect"** toggle or dropdown
5. Make sure "Redirect" is **OFF** or set to **"No redirect"**
6. Save changes

**Method 2: Using Git Integration**
1. Click the domain you want as secondary (e.g., `www.codescribeai.com`)
2. Click **"Edit"**
3. Enable **"Redirect to"** toggle
4. Select the primary domain from dropdown (e.g., `codescribeai.com`)
5. Save changes

**Recommended Configuration:**
- **Primary (no redirect):** `codescribeai.com` (shorter, cleaner)
- **Redirect to primary:** `www.codescribeai.com` → `codescribeai.com`

**Result:** Visiting `www.codescribeai.com` will automatically redirect to `codescribeai.com`

**4.3 Enable HTTPS (Automatic)**
- Vercel automatically provisions SSL certificates via Let's Encrypt
- No action required - certificates are issued within minutes of DNS verification
- Both HTTP → HTTPS redirect and HSTS are enabled by default
- Look for 🔒 icon next to your domain in Vercel dashboard when ready

---

### Step 5: Verify DNS Propagation

**5.1 Check DNS Records**

Use online tools to verify DNS propagation:

**Option A: Command Line (macOS/Linux)**
```bash
# Check A record for root domain
dig codescribeai.com A +short
# Expected output: 76.76.21.21

# Check CNAME record for www
dig www.codescribeai.com CNAME +short
# Expected output: cname.vercel-dns.com
```

**Option B: Online Tools**
- Visit: https://dnschecker.org
- Enter domain: `codescribeai.com`
- Select record type: **A**
- Click "Search" - should show Vercel's IP address globally
- Repeat for `www.codescribeai.com` with type **CNAME**

**5.2 Check Vercel Status**
1. Go to Vercel → Project Settings → Domains
2. Look for status next to your domains:
   - 🟡 **Pending:** DNS not yet detected (wait and refresh)
   - 🔴 **Invalid Configuration:** DNS records incorrect (check Step 3)
   - 🟢 **Valid Configuration:** DNS verified, SSL pending
   - ✅ **Active:** Fully configured with HTTPS

**5.3 Wait for SSL Certificate**
- After DNS verification, Vercel provisions SSL certificates
- This usually takes 1-5 minutes
- You'll see "Valid Configuration" → "Active" status change

---

### Step 6: Test Your Custom Domain

**6.1 Test HTTP and HTTPS**

Visit the following URLs in your browser:

```
http://codescribeai.com
https://codescribeai.com
http://www.codescribeai.com
https://www.codescribeai.com
```

**Expected Behavior:**
- All URLs should load your CodeScribe AI application
- HTTP URLs should automatically redirect to HTTPS
- www/non-www should redirect to your primary domain
- SSL certificate should be valid (green padlock in browser)

**6.2 Test Application Functionality**

Verify that all features work on the custom domain:

- ✅ **Homepage loads:** UI renders correctly
- ✅ **Code input works:** Monaco Editor initializes
- ✅ **File upload works:** Can upload `.js` files
- ✅ **Documentation generation:** Streaming works
- ✅ **Quality score displays:** Algorithm runs correctly
- ✅ **Responsive design:** Mobile/tablet/desktop layouts
- ✅ **Error handling:** Toast notifications appear
- ✅ **API calls succeed:** Backend responds correctly

**6.3 Check SSL Certificate**

```bash
# Option A: Command line
openssl s_client -connect codescribeai.com:443 -servername codescribeai.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Option B: Browser
# 1. Visit https://codescribeai.com
# 2. Click padlock icon in address bar
# 3. Click "Certificate" or "Certificate (Valid)"
# 4. Verify issuer is "Let's Encrypt" or "Vercel"
# 5. Verify expiration date is in the future
```

**6.4 Test Performance**

Run a Lighthouse audit to ensure performance is maintained:

```bash
# Install Lighthouse CLI (if not already installed)
npm install -g lighthouse

# Run audit on custom domain
lighthouse https://codescribeai.com --view
```

**Expected Results:**
- Performance: 75+ (same as codescribe-ai.vercel.app)
- Accessibility: 95+ (WCAG 2.1 AA compliant)
- Best Practices: 90+
- SEO: 90+

---

## 🔧 Troubleshooting

### Issue: Domain shows "Invalid Configuration" in Vercel

**Possible Causes:**
1. DNS records not yet propagated (wait 5-30 minutes, refresh)
2. Incorrect DNS values (must match Vercel's exact values)
3. Conflicting DNS records (delete old A/CNAME records)
4. Registrar DNS not pointing to correct nameservers

**Solutions:**
```bash
# Verify DNS records are correct
dig codescribeai.com A +short
dig www.codescribeai.com CNAME +short

# Check global DNS propagation
# Visit: https://dnschecker.org

# If DNS is correct globally but Vercel shows invalid:
# 1. Remove domain from Vercel
# 2. Wait 5 minutes
# 3. Re-add domain to Vercel
```

---

### Issue: SSL Certificate Not Provisioning

**Possible Causes:**
1. DNS not fully propagated yet
2. Domain verification failed
3. CAA records blocking Let's Encrypt

**Solutions:**
```bash
# Check CAA records (should be empty or allow Let's Encrypt)
dig codescribeai.com CAA +short

# If CAA records exist, add:
# Type: CAA
# Name: @
# Value: 0 issue "letsencrypt.org"

# Remove and re-add domain in Vercel to retry SSL provisioning
```

---

### Issue: Website loads but shows old Vercel URL

**Possible Causes:**
1. Browser cache showing old URL
2. Redirect not configured correctly

**Solutions:**
```bash
# Clear browser cache
# Chrome: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows)
# Firefox: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows)

# Test in incognito/private browsing mode

# Verify redirect in Vercel:
# Settings → Domains → Ensure primary domain is set correctly
```

---

### Issue: API Calls Failing After Domain Change

**Possible Causes:**
1. CORS configuration needs updating
2. Hardcoded API URLs in frontend

**Solutions:**

**Check CORS Configuration:**
```javascript
// server/src/middleware/cors.js
const allowedOrigins = [
  'http://localhost:5173',
  'https://codescribe-ai.vercel.app',
  'https://codescribeai.com',        // Add this
  'https://www.codescribeai.com'     // Add this
];
```

**Check Frontend API URL:**
```javascript
// client/src/config/api.js
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Production domains (includes new custom domain)
  if (window.location.hostname === 'codescribeai.com' ||
      window.location.hostname === 'www.codescribeai.com' ||
      window.location.hostname === 'codescribe-ai.vercel.app') {
    return 'https://codescribe-ai.vercel.app/api';
  }

  // Development
  return 'http://localhost:3000/api';
};
```

**Redeploy if Changes Made:**
```bash
# Commit changes
git add .
git commit -m "Add custom domain CORS support"
git push origin main

# Vercel auto-deploys on push
```

---

### Issue: Email Not Working After DNS Change

**Possible Causes:**
1. Deleted MX records when adding A/CNAME records

**Solutions:**
```bash
# Check if MX records exist
dig codescribeai.com MX +short

# If no MX records, re-add them from your email provider
# (Gmail, Outlook, custom email host, etc.)
```

⚠️ **Important:** MX records are separate from A/CNAME records. Adding A/CNAME should not affect email, but always verify MX records are intact.

---

## ✅ Post-Setup Checklist

After completing setup, verify:

- [ ] ✅ `https://codescribeai.com` loads and shows green padlock
- [ ] ✅ `https://www.codescribeai.com` loads and redirects (if configured)
- [ ] ✅ HTTP URLs redirect to HTTPS automatically
- [ ] ✅ SSL certificate is valid (Let's Encrypt, expires in 90 days)
- [ ] ✅ All application features work (code input, generation, upload)
- [ ] ✅ API calls succeed (no CORS errors in browser console)
- [ ] ✅ Responsive design works on mobile/tablet/desktop
- [ ] ✅ Performance maintained (Lighthouse 75+ performance score)
- [ ] ✅ SEO meta tags reference new domain (optional - check view source)
- [ ] ✅ Analytics tracking works (if enabled)
- [ ] ✅ Email still works (if using custom email with domain)

---

## 📊 DNS Propagation Timeline

**What to expect:**

| Time | Status | What's Happening |
|------|--------|------------------|
| 0-5 min | DNS records added | Records saved at registrar, not yet propagated |
| 5-30 min | Propagating | DNS servers worldwide start updating |
| 30 min - 2 hrs | Mostly propagated | 80%+ of DNS servers have new records |
| 2-24 hrs | Fully propagated | 99%+ of DNS servers updated |
| 24-48 hrs | Complete | 100% propagation (rare edge cases) |

**Typical experience:** Most users see the new domain working within 5-30 minutes.

---

## 🔄 Updating Application URLs

After your custom domain is live, consider updating:

### Update README.md

```markdown
# CodeScribe AI

**Live Demo:** [https://codescribeai.com](https://codescribeai.com)

Intelligent code documentation generator powered by AI...
```

### Update CLAUDE.md

```markdown
**Live Demo:** [https://codescribeai.com](https://codescribeai.com)

**Key Features:**
- Real-time AI-powered documentation generation with streaming
...
```

### Update package.json (Optional)

```json
{
  "name": "codescribe-ai",
  "version": "1.0.0",
  "homepage": "https://codescribeai.com",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/codescribe-ai"
  }
}
```

### Update Social Media & Portfolio

- LinkedIn project links
- GitHub repository description
- Portfolio website
- Resume (if applicable)
- Twitter/X bio (if applicable)

---

## 🎯 Best Practices

### 1. Set Up Both www and Non-www
**Why:** Users may type either version. Setting up both ensures everyone can access your site.

**Recommended Configuration:**
- Primary: `codescribeai.com` (shorter, cleaner)
- Redirect: `www.codescribeai.com` → `codescribeai.com`

### 2. Monitor DNS Health
**Tools:**
- https://dnschecker.org - Global DNS propagation
- https://www.whatsmydns.net - DNS lookup from multiple locations
- https://mxtoolbox.com - DNS, MX, and SPF record checker

**Frequency:** Check weekly for the first month, then monthly

### 3. Set Up Monitoring (Optional)
**Free Tools:**
- UptimeRobot - Free uptime monitoring (50 monitors)
- Pingdom - Website speed and uptime monitoring
- Google Search Console - SEO and indexing monitoring

### 4. Backup DNS Records
**Important:** Save your DNS configuration in a text file or screenshot:
```txt
Domain: codescribeai.com
Registrar: [Your Registrar Name]
Date: October 19, 2025

DNS Records:
-----------
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600

[Include any MX, TXT, or other records]
```

### 5. Plan for Certificate Renewal
**Vercel handles this automatically:**
- SSL certificates from Let's Encrypt renew every 90 days
- Vercel automatically renews before expiration
- No action required from you
- Monitor Vercel dashboard for any renewal issues

---

## 📞 Support Resources

If you encounter issues not covered in this guide:

**Vercel Support:**
- Documentation: https://vercel.com/docs/concepts/projects/domains
- Community: https://github.com/vercel/vercel/discussions
- Support: support@vercel.com (Pro/Enterprise plans)

**Domain Registrar Support:**
- Check your registrar's DNS documentation
- Contact registrar support for DNS-specific issues

**DNS Debugging Tools:**
- https://dnschecker.org
- https://www.whatsmydns.net
- https://mxtoolbox.com/SuperTool.aspx

**CodeScribe AI Issues:**
- GitHub Issues: [Your repo]/issues
- Check [ERROR-HANDLING-UX.md](../components/ERROR-HANDLING-UX.md) for common errors

---

## 📝 Summary

**You've successfully set up `codescribeai.com` when:**

1. ✅ DNS records added at registrar (A + CNAME)
2. ✅ Domain added to Vercel project
3. ✅ Vercel shows "Active" status with green checkmark
4. ✅ HTTPS works with valid SSL certificate
5. ✅ Application loads and functions correctly
6. ✅ Redirects work (www ↔ non-www, HTTP → HTTPS)

**Total time:** 10-15 minutes setup + 5-30 minutes DNS propagation

**Next steps:**
- Update README and documentation with new URL
- Share your custom domain in portfolio/resume
- Monitor domain health and performance
- Enjoy your professional custom domain! 🎉

---

## 🎯 Production Configuration (Actual Setup)

**Deployed:** October 19, 2025

### Domain Configuration
Our production setup follows modern best practices with apex domain as primary:

| Domain | Status | Configuration |
|--------|--------|---------------|
| `codescribeai.com` | ✅ Active | **Primary** - Production domain |
| `www.codescribeai.com` | ✅ Active | **Redirect (308)** → `codescribeai.com` |
| `codescribe-ai.vercel.app` | ✅ Active | Fallback/internal use |

### SSL Certificates
- **Provider:** Let's Encrypt (via Vercel)
- **Issued:** October 19, 2025
- **Expires:** January 17, 2026 (90 days)
- **Auto-renewal:** Enabled (Vercel handles automatically)
- **Certificate Validation:** All domains verified ✅

### Redirect Configuration
- **www → apex:** `https://www.codescribeai.com` → `https://codescribeai.com` (308 Permanent)
- **HTTP → HTTPS:** All HTTP requests automatically redirect to HTTPS
- **HSTS Enabled:** `max-age=63072000` (2 years)

### Why Apex Domain as Primary?
We chose `codescribeai.com` (no www) following modern web best practices:

**✅ Benefits:**
- **Shorter URLs:** Easier to type, remember, and share
- **Modern standard:** Major tech companies use apex (stripe.com, github.com, vercel.com)
- **Better branding:** Cleaner appearance on business cards, social media, resumes
- **SEO neutral:** No SEO advantage to www vs non-www (both work equally)

**Alternative approach:** Using `www.codescribeai.com` as primary would also work, but apex is the current industry trend for new applications.

### Verifying SSL/HTTPS in Browsers

**Desktop Browsers (Chrome, Firefox, Safari, Edge):**
- Look for lock icon 🔒 in the address bar (usually left side)
- May be subtle or hidden behind a menu icon
- Click the icon to see "Connection is secure"
- Modern browsers only show warnings for insecure sites

**Mobile Browsers (Chrome, Safari, Firefox):**
- Lock icon may not be visible by default (space-saving)
- Tap the address bar or menu icon (⋮)
- Look for "Connection is secure" message in the dropdown
- Some browsers show lock icon in expanded view only

**⚠️ Important:** Modern browsers (2019+) de-emphasize security indicators for HTTPS sites since it's now the default expectation. They focus on warning users about insecure (HTTP) sites instead.

### DNS Records (Actual)
```bash
# Root domain (A record)
codescribeai.com → 216.198.79.1

# www subdomain (CNAME)
www.codescribeai.com → 207502b3f0e915e0.vercel-dns-017.com
                     → 64.29.17.65
                     → 216.198.79.65
```

### Testing Commands
```bash
# Check DNS resolution
dig codescribeai.com +short
dig www.codescribeai.com +short

# Verify SSL certificate
openssl s_client -connect codescribeai.com:443 -servername codescribeai.com < /dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates

# Test redirects
curl -I https://www.codescribeai.com  # Should show 308 → codescribeai.com
curl -I http://codescribeai.com       # Should show 308 → https://
```

### Performance Verification
After domain setup, verified performance maintained:
- ✅ Lighthouse Performance: 75/100
- ✅ Lighthouse Accessibility: 100/100
- ✅ Lighthouse Best Practices: 100/100
- ✅ SSL Labs Grade: A+
- ✅ Response Time: <200ms (global CDN)

### Monitoring
**Active monitoring for:**
- SSL certificate expiration (auto-renewed by Vercel)
- DNS health checks
- Uptime monitoring
- Performance metrics

**All systems operational as of October 19, 2025** ✅

---

**Document Version:** 1.1 (Updated with production configuration)
**Last Updated:** October 19, 2025
**Author:** CodeScribe AI Team
**Status:** Production Ready - Deployed
