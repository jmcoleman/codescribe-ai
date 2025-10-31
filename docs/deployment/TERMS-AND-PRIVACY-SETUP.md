# Terms & Conditions and Privacy Policy Setup

**Status:** 🚧 To Be Implemented (Before Stripe Integration)
**Timeline:** Complete before Phase 2 Epic 2.4 (accepting payments)
**Recommended Tool:** Termly.io (free tier)

---

## Why You Need These

### Terms of Service (Required)
- Legal contract between you and users
- Protects you from liability
- Defines acceptable use, refunds, dispute resolution
- **Required before:** Accepting any payments

### Privacy Policy (Required by Law)
- GDPR (EU) and CCPA (California) compliance
- Explains data collection and usage
- User rights (access, deletion, portability)
- **Required for:** Any website with user accounts or cookies

---

## Recommended: Termly.io (Free Tier)

**URL:** https://termly.io

**Why Termly:**
- ✅ Free tier includes Terms + Privacy Policy
- ✅ GDPR/CCPA compliant templates
- ✅ Easy questionnaire-based generation
- ✅ Auto-updates when laws change
- ✅ Hosted on their subdomain (free)
- ✅ No credit card required

**Paid tier ($10-25/month):**
- Custom domain hosting
- Cookie consent banner
- Compliance monitoring
- **Upgrade when:** You have paying customers

---

## Step-by-Step: Generate Your Policies (30 minutes)

### Step 1: Create Termly Account

1. Go to https://termly.io
2. Sign up (free account, no CC)
3. Verify email

---

### Step 2: Generate Terms of Service

**Click:** "Create Policy" → "Terms and Conditions"

**Answer these questions:**

#### Business Information
- **Business name:** CodeScribe AI
- **Website URL:** https://codescribeai.com
- **Business type:** Limited Liability Company (LLC) - *after formation*
- **Business address:** Your Georgia address
- **Contact email:** support@codescribeai.com

#### Service Type
- **Type of service:** SaaS / Web Application
- **What you provide:** AI-powered code documentation generation

#### User Accounts
- **User accounts:** Yes
- **Registration required:** Yes (for paid tiers)
- **Authentication:** Email/password and GitHub OAuth
- **Account deletion:** Yes (user can request)

#### Payments & Subscriptions
- **Accept payments:** Yes
- **Payment processor:** Stripe
- **Subscription model:** Yes (Free, Starter $12, Pro $29, Team $99)
- **Payment terms:** Monthly subscription, auto-renewal
- **Refunds:** Yes - "Pro-rated refund within 7 days of subscription start"
- **Free trial:** No (Free tier available)

#### Content & IP
- **User-generated content:** No (code is not stored permanently)
- **Who owns content:**
  - User owns their code (input)
  - User owns generated documentation (output)
  - CodeScribe AI retains IP on the software/AI model
- **User restrictions:** Cannot use service for illegal purposes, cannot abuse API limits

#### Liability & Warranties
- **Limitation of liability:** Yes - "Service provided 'as is', no warranty for accuracy of generated docs"
- **Maximum liability:** Subscription cost for current billing period
- **Service availability:** Best effort, no SLA guarantee (99% uptime goal)

#### Dispute Resolution
- **Governing law:** Georgia, USA
- **Dispute resolution:** Arbitration preferred (cheaper than lawsuits)
- **Small claims court:** Allowed for disputes under $10,000

#### Additional Clauses
- **Age restriction:** Users must be 18+ or have parental consent
- **Termination rights:** You can terminate accounts for ToS violations
- **Service changes:** You can modify service with 30 days notice
- **Contact for legal:** support@codescribeai.com

**Generate → Download HTML**

---

### Step 3: Generate Privacy Policy

**Click:** "Create Policy" → "Privacy Policy"

**Answer these questions:**

#### Business Information
- Same as Terms of Service above

#### Data Collection
**What data do you collect:**
- ✅ Email address (required for account)
- ✅ Name (optional, from GitHub OAuth)
- ✅ GitHub username (if using OAuth)
- ✅ Password (hashed with bcrypt)
- ✅ IP address (for rate limiting and anonymous usage tracking)
- ✅ Usage data (docs generated, tier, timestamps)
- ✅ Browser/device info (via Vercel Analytics)
- ❌ Code content (NOT stored permanently - privacy-first)

**Why you collect it:**
- Account management and authentication
- Service delivery (documentation generation)
- Usage tracking and quota enforcement
- Analytics and product improvement
- Security and fraud prevention

#### Cookies & Tracking
- **Use cookies:** Yes
- **Types:**
  - Essential: Authentication token (JWT), session ID
  - Analytics: Vercel Analytics (anonymous, no PII)
  - Preferences: Theme preference, language selection (future)
- **Third-party cookies:** None (Vercel Analytics is first-party)
- **Cookie consent:** Implied consent (essential cookies) + analytics opt-out available

#### Third-Party Services
**List all services that process user data:**

1. **Anthropic Claude API**
   - Purpose: AI documentation generation
   - Data shared: Code snippets (temporary, not stored by Anthropic per their policy)
   - Location: USA
   - Privacy policy: https://www.anthropic.com/privacy

2. **Stripe**
   - Purpose: Payment processing
   - Data shared: Email, name, payment info
   - Location: USA
   - Privacy policy: https://stripe.com/privacy

3. **Vercel Analytics**
   - Purpose: Anonymous usage analytics, Core Web Vitals
   - Data shared: Page views, performance metrics (no PII)
   - Location: USA
   - Privacy policy: https://vercel.com/legal/privacy-policy

4. **Resend**
   - Purpose: Transactional emails (password reset, verification)
   - Data shared: Email address, name
   - Location: USA
   - Privacy policy: https://resend.com/legal/privacy-policy

5. **Neon (Vercel Postgres)**
   - Purpose: Database hosting (user accounts, usage tracking)
   - Data shared: All user account data
   - Location: USA (AWS us-east-1)
   - Privacy policy: https://neon.tech/privacy-policy

#### Data Retention
- **User accounts:** Retained until account deletion requested
- **Usage data:** Retained for 90 days (quota tracking), then aggregated
- **Code snippets:** NOT stored (processed in memory only)
- **Generated docs:** NOT stored (user downloads/copies)
- **Deleted accounts:** 30-day grace period, then permanent deletion

#### User Rights (GDPR/CCPA)
- **Access:** Users can request copy of their data
- **Correction:** Users can update account info in settings
- **Deletion:** Users can request account deletion (support@codescribeai.com)
- **Portability:** Users can export their usage data (JSON format)
- **Opt-out:** Users can disable analytics tracking
- **Response time:** 30 days for data requests

#### Security
- **Data encryption:** HTTPS for all traffic, bcrypt for passwords
- **Data breach notification:** Users notified within 72 hours
- **Security contact:** support@codescribeai.com

#### Children's Privacy
- **COPPA compliance:** Service not directed at children under 13
- **Age verification:** Terms require 18+ or parental consent
- **Action if violated:** Immediate account termination + data deletion

#### International Users
- **GDPR (EU):** Compliant with all user rights
- **CCPA (California):** Compliant with disclosure and opt-out rights
- **Data transfers:** USA-based processing, adequate safeguards

#### Policy Updates
- **Notification:** Email to users 30 days before changes
- **Effective date:** Clearly posted on policy page
- **Material changes:** Require acceptance on next login

**Generate → Download HTML**

---

### Step 4: Host Policies

**Option 1: Termly Hosting (Free, Recommended for Now)**
- Termly generates URLs: `https://app.termly.io/document/terms-of-service/[your-id]`
- Pro: Easy, automatic updates
- Con: External domain (not ideal long-term)

**Option 2: Self-Host (After Paid Tier Launch)**
- Download HTML from Termly
- Create React components: `TermsOfService.jsx`, `PrivacyPolicy.jsx`
- Add routes: `/terms` and `/privacy`
- Pro: On your domain, better SEO
- Con: Manual updates when laws change

**For 90-day challenge:** Use Termly hosting (Option 1).
**After launch:** Self-host (Option 2) once you upgrade to paid tier.

---

## Implementation Guide

### Add Footer Component

Create `client/src/components/Footer.jsx`:

```jsx
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-slate-600">
            © {currentYear} CodeScribe AI. All rights reserved.
          </div>

          {/* Legal Links */}
          <div className="flex gap-6 text-sm">
            <a
              href="https://app.termly.io/document/terms-of-service/YOUR-ID-HERE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-purple-600 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="https://app.termly.io/document/privacy-policy/YOUR-ID-HERE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-purple-600 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="mailto:support@codescribeai.com"
              className="text-slate-600 hover:text-purple-600 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**Add to App.jsx:**

```jsx
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Existing content */}
      <Header />
      <main className="flex-1">
        {/* Your app content */}
      </main>
      <Footer />
    </div>
  );
}
```

---

### Update SignupModal (T&Cs Acceptance)

Add checkbox to `SignupModal.jsx`:

```jsx
const [acceptedTerms, setAcceptedTerms] = useState(false);

// In form, before submit button:
<div className="flex items-start gap-2">
  <input
    type="checkbox"
    id="terms"
    checked={acceptedTerms}
    onChange={(e) => setAcceptedTerms(e.target.checked)}
    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded"
  />
  <label htmlFor="terms" className="text-sm text-slate-600">
    I agree to the{' '}
    <a
      href="https://app.termly.io/document/terms-of-service/YOUR-ID-HERE"
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-600 hover:underline"
    >
      Terms of Service
    </a>
    {' '}and{' '}
    <a
      href="https://app.termly.io/document/privacy-policy/YOUR-ID-HERE"
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-600 hover:underline"
    >
      Privacy Policy
    </a>
  </label>
</div>

<Button
  type="submit"
  disabled={!acceptedTerms || loading}
  className="w-full"
>
  {loading ? 'Creating Account...' : 'Sign Up'}
</Button>
```

---

## Where to Display T&Cs

### Required Locations

1. **Footer (Every Page)** ✅
   - Terms of Service link
   - Privacy Policy link
   - Contact link

2. **Signup Flow** ✅
   - Checkbox with links
   - Must accept before creating account

3. **Before Payment/Checkout** ✅
   - Link in Stripe checkout description
   - "By subscribing, you agree to our Terms"

### Optional Locations

4. **Settings Page** (Future)
   - Links to policies
   - "Delete my account" triggers privacy rights

5. **Email Footers**
   - Password reset emails
   - Subscription confirmation emails

---

## Testing Checklist

Before going live with payments:

- [ ] Terms of Service generated and hosted
- [ ] Privacy Policy generated and hosted
- [ ] Footer component added to all pages
- [ ] Signup modal includes T&Cs checkbox
- [ ] Stripe checkout mentions Terms
- [ ] support@codescribeai.com email working
- [ ] All third-party services listed in Privacy Policy
- [ ] Data retention policy documented
- [ ] GDPR/CCPA user rights explained

---

## Timeline

### Before 90-Day Challenge Launch (Optional)
- Generate basic Terms + Privacy (takes 30 min)
- Add Footer with links
- **Why:** Shows professionalism, starts compliance

### Before Stripe Integration (Required)
- Finalize Terms with payment/refund policies
- Update Privacy with Stripe data sharing
- Add T&Cs checkbox to SignupModal
- **Why:** Legal requirement before accepting payments

### After Paid Launch (Upgrade)
- Upgrade Termly to paid tier ($10-25/mo)
- Self-host policies on your domain
- Add cookie consent banner (if needed)
- **Why:** Better branding, custom domain

---

## Cost Summary

| Item | Cost | When |
|------|------|------|
| **Termly free tier** | $0 | Now → First 100 users |
| **Termly paid tier** | $10-25/mo | After paying customers |
| **Custom hosting** | $0 | After paid tier (optional) |

**Recommendation:** Start free, upgrade at $500+ MRR.

---

## Support & Resources

**Termly Help:**
- Knowledge base: https://termly.io/resources/
- Support: support@termly.io

**Legal Review (Optional):**
- Only needed if: Raising investment, complex IP, high-risk users
- Cost: $500-2,000 lawyer review
- **You don't need this for standard SaaS**

**Compliance Tools:**
- GDPR checklist: https://gdpr.eu/checklist/
- CCPA guide: https://oag.ca.gov/privacy/ccpa

---

## FAQ

**Q: Do I need a lawyer to review these?**
**A:** No. Termly templates are legally sufficient for standard SaaS. Only hire lawyer if you have complex IP, investors, or handle sensitive data (health, financial).

**Q: What if I miss something in the policies?**
**A:** Termly auto-updates templates when laws change. Review quarterly and update when you add new features (e.g., CLI, API access).

**Q: Can users sue me even with T&Cs?**
**A:** T&Cs reduce risk but don't eliminate it. That's why you need LLC + insurance. Arbitration clause in T&Cs makes disputes cheaper.

**Q: What's my refund policy?**
**A:** Suggested: "Full refund within 7 days of subscription start. Pro-rated refund for annual plans canceled within 30 days. No refunds for monthly plans after first month."

**Q: Do I need cookie consent banner?**
**A:** Not immediately. You only use essential cookies (auth) and anonymous analytics. Add banner when you use marketing cookies (Google Ads, Facebook Pixel).

**Q: What about GDPR right to deletion?**
**A:** Add "Delete Account" button in settings + handle email requests to support@codescribeai.com. Must delete within 30 days.

---

## Next Steps

**Today:**
1. Create Termly account
2. Generate Terms of Service
3. Generate Privacy Policy
4. Save URLs (update this guide)

**Before Stripe:**
1. Create Footer component
2. Add T&Cs checkbox to SignupModal
3. Test all links
4. Review policies one more time

**After Launch:**
1. Monitor support@ for privacy requests
2. Review policies quarterly
3. Upgrade Termly when profitable
4. Self-host on custom domain

---

**Last Updated:** October 30, 2025
**Status:** Guide complete, implementation pending
**Owner:** Jenni Coleman
