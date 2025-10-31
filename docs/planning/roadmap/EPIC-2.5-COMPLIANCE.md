# Epic 2.5: Legal Compliance & User Rights Infrastructure

**Phase:** Phase 2 - Payments Infrastructure
**Priority:** CRITICAL (Required before accepting payments)
**Duration:** 3-4 days (split across 90-day challenge + pre-Stripe)
**Target Release:** v2.4.0 (before Stripe integration)
**Status:** 📋 PLANNED

---

## Overview

Complete GDPR/CCPA compliance infrastructure including self-hosted Terms & Privacy, account settings, data export, account deletion, analytics opt-out, and policy update acceptance system.

**Critical Path:** This epic MUST complete before Epic 2.4 (Stripe Integration). GDPR fines: 4% of revenue or €20M (whichever is higher).

---

## Strategic Goal

Build a compliant, user-respecting data infrastructure that:
1. Meets legal requirements (GDPR, CCPA, etc.)
2. Builds user trust (transparency + control)
3. Protects business (limitation of liability)
4. Enables sustainable growth (policy flexibility)

---

## Phased Implementation

### Phase 1: UI Placeholders (Week 1-2 of 90-Day Challenge) - 1 day

**Goal:** Add visual UI elements to show where legal components will go.

**Tasks:**
- [ ] Generate Terms of Service via Termly.io (30 min)
- [ ] Generate Privacy Policy via Termly.io (30 min)
- [ ] Create `Footer.jsx` component with T&Cs links (Termly URLs)
- [ ] Add Footer to `App.jsx`
- [ ] Add T&Cs checkbox to SignupModal (disabled with tooltip: "Coming soon")
- [ ] Add placeholder policy links to:
  - Header user menu
  - Email templates (footer)
  - Pricing page
  - 90-day challenge page
- [ ] Test: All links open Termly-hosted policies in new tab

**Deliverables:**
- Footer visible on all pages
- T&Cs checkbox visible (non-functional)
- Legal links accessible throughout app

**Why now:** Shows professionalism, collects early user feedback on placement.

---

### Phase 2: Self-Hosted Policies (Week 10, Before Stripe) - 1 day

**Goal:** Move from Termly-hosted to self-hosted policies on codescribeai.com domain.

**Tasks:**
- [ ] Create `client/src/pages/TermsOfService.jsx` component
- [ ] Create `client/src/pages/PrivacyPolicy.jsx` component
- [ ] Copy Termly-generated HTML, convert to JSX
- [ ] Style with Tailwind (match brand colors)
- [ ] Add routes to `main.jsx`: `/terms` and `/privacy`
- [ ] Add last updated date + version number (e.g., "v1.0.0 - October 30, 2025")
- [ ] Update Footer links to internal routes
- [ ] Update SignupModal T&Cs checkbox:
  - Remove "disabled" attribute
  - Make required for signup
  - Update links to internal routes
- [ ] Add "By subscribing, you agree to our [Terms](/terms) and [Privacy Policy](/privacy)" to:
  - Pricing page CTAs
  - Stripe checkout description
- [ ] Test: All policies accessible, checkbox blocks signup if unchecked

**Deliverables:**
- `/terms` and `/privacy` routes live
- Self-hosted content (SEO-friendly)
- T&Cs checkbox functional

**Why now:** Required before accepting payments. On-domain hosting improves trust + SEO.

---

### Phase 3: Account Settings UI (Week 10, Before Stripe) - 1 day

**Goal:** Give users control over their account, privacy, and subscriptions.

**Component Structure:**
```
SettingsPage.jsx (or SettingsModal.jsx)
├─ AccountSettings (email, name, password)
├─ PrivacySettings (analytics opt-out)
├─ SubscriptionSettings (tier, usage, manage via Stripe)
└─ DangerZone (delete account)
```

**Tasks:**

#### 3.1: Settings Page/Modal Component
- [ ] Create `client/src/pages/Settings.jsx` (or modal if preferred)
- [ ] Add route: `/settings`
- [ ] Add "Settings" link to user menu in Header
- [ ] Tab navigation: Account | Privacy | Subscription | Danger Zone
- [ ] Responsive design (mobile-friendly)

#### 3.2: Account Settings Tab
- [ ] Display current email (read-only for OAuth users)
- [ ] "Change Email" button → ChangeEmailModal
  - Email input
  - Verification email sent (Resend)
  - Confirm via token link
- [ ] Display current name (editable)
- [ ] "Change Password" button → ChangePasswordModal
  - Current password (skip for OAuth-only users)
  - New password + confirm
  - Password strength indicator
  - Update password_hash via bcrypt
- [ ] "Connected Accounts" section:
  - GitHub: "Connected as @username" or "Connect GitHub"
  - Email/Password: "Set up password" for OAuth-only users

#### 3.3: Privacy Settings Tab
- [ ] **Analytics Tracking Toggle:**
  - Label: "Allow analytics tracking to help improve CodeScribe AI"
  - Description: "We collect anonymous usage data (page views, feature usage) to improve the product. No personal information is tracked."
  - Default: ON (respects existing `user.analytics_enabled`)
  - API: `PUT /api/user/preferences` with `{ analyticsEnabled: boolean }`
  - Update: `user.analytics_enabled` in database
  - Client: Conditionally load Vercel Analytics script
  - Honor DNT: Check `navigator.doNotTrack` and disable if set
- [ ] **Data Rights Information:**
  - Link: "Download My Data" → triggers data export
  - Link: "Learn about your privacy rights" → /privacy page
- [ ] **Communication Preferences (Future):**
  - Checkbox: "Receive product updates via email"
  - Checkbox: "Receive marketing offers"

#### 3.4: Subscription Settings Tab
- [ ] Display current tier: "Free" | "Starter ($12/mo)" | "Pro ($29/mo)"
- [ ] Usage stats widget:
  - "X / 10 docs this month" (Free)
  - Progress bar (green → yellow → red)
  - Reset date: "Resets on March 1, 2026"
- [ ] "View Usage History" button → UsageHistoryModal
  - Table: Date | Doc Type | Language | Quality Score
  - Export CSV button
- [ ] "Manage Subscription" button:
  - Free tier: "Upgrade to Starter" CTA → /pricing
  - Paid tier: "Manage billing" → Stripe Customer Portal
  - Link: `https://billing.stripe.com/p/session/...`
- [ ] Cancellation info: "Cancel anytime. Pro-rated refund within 7 days."

#### 3.5: Danger Zone Tab
- [ ] Red/warning styling
- [ ] "Delete My Account" button → DeleteAccountModal
  - Warning: "This action cannot be undone"
  - Explanation: "Your account will be scheduled for deletion. You have 30 days to restore it by logging in."
  - Password confirmation input (security check)
  - Final confirmation checkbox: "I understand this is permanent"
  - "Delete Account" button (red, disabled until confirmed)

**Deliverables:**
- Settings page accessible from user menu
- All tabs functional
- Analytics opt-out working
- Account deletion triggers soft delete

---

### Phase 4: User Data Rights (Week 11, Before Stripe) - 1 day

**Goal:** GDPR/CCPA compliance with data export, account deletion, and opt-out.

#### 4.1: Data Export (GDPR Article 20 - Right to Portability)

**Backend:**
```javascript
// server/src/routes/user.js
router.get('/data-export', requireAuth, async (req, res) => {
  const userId = req.user.id;

  // Gather all user data
  const userData = await User.findById(userId);
  const usageData = await Usage.getUserUsage(userId);
  const subscriptionData = await Subscription.findByUserId(userId);

  // Compile JSON export
  const exportData = {
    account: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      tier: userData.tier,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    },
    usage: {
      currentPeriod: usageData,
      history: await Usage.getUsageHistory(userId),
    },
    subscription: subscriptionData,
    policies: {
      termsAccepted: await PolicyAcceptance.find({ userId, policyType: 'terms' }),
      privacyAccepted: await PolicyAcceptance.find({ userId, policyType: 'privacy' }),
    },
    privacy: {
      analyticsEnabled: userData.analytics_enabled,
    },
    exportedAt: new Date().toISOString(),
  };

  // Option 1: Direct download
  res.json(exportData);

  // Option 2: Generate download link (for large exports)
  // const url = await uploadToVercelBlob(exportData);
  // await sendDataExportEmail(userData.email, url);
  // res.json({ message: 'Export ready. Check your email.' });
});
```

**Frontend:**
- [ ] Settings → Privacy tab
- [ ] "Download My Data" button
- [ ] onClick: API call → trigger download
- [ ] Toast: "Your data is downloading..."
- [ ] Downloaded file: `codescribe-data-export-YYYY-MM-DD.json`

**Email Template (Optional, for large exports):**
```
Subject: Your CodeScribe AI Data Export is Ready

Hi [Name],

Your data export is ready! Click the link below to download:

[Download My Data] (expires in 7 days)

What's included:
- Account information
- Usage history
- Subscription details
- Policy acceptance records

Questions? Reply to this email or contact support@codescribeai.com

---
CodeScribe AI
```

**Tasks:**
- [ ] Backend: `GET /api/user/data-export` endpoint
- [ ] Data export JSON schema (see format above)
- [ ] Frontend: "Download My Data" button in Settings
- [ ] Optional: Email template for download link (Resend)
- [ ] Optional: `data_exports` table for tracking
- [ ] Test: Download works, JSON is valid
- [ ] Documentation: DATA-EXPORT-FORMAT.md

#### 4.2: Account Deletion (GDPR Article 17 - Right to Erasure)

**Backend:**
```javascript
// server/src/routes/user.js
router.delete('/account', requireAuth, async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  // Verify password (security check)
  const user = await User.findById(userId);
  if (user.password_hash) {
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
  }

  // Soft delete: 30-day grace period
  await User.scheduleDeletion(userId);

  // Cancel subscription (if active)
  await Subscription.cancel(userId);

  // Send confirmation email
  await sendAccountDeletionEmail(user.email, {
    deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    restoreUrl: `${process.env.CLIENT_URL}/restore-account`,
  });

  // Log out user
  req.logout();
  res.json({ message: 'Account scheduled for deletion' });
});

// Cron job or on-login check
async function deleteExpiredAccounts() {
  const expiredUsers = await User.findExpiredDeletions();
  for (const user of expiredUsers) {
    await User.hardDelete(user.id); // Cascade deletes
  }
}
```

**User Model Methods:**
```javascript
// server/src/models/User.js
class User {
  static async scheduleDeletion(userId) {
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET deletion_scheduled_at = $1 WHERE id = $2',
      [deletionDate, userId]
    );
  }

  static async findExpiredDeletions() {
    const result = await pool.query(
      'SELECT * FROM users WHERE deletion_scheduled_at < NOW() AND deleted_at IS NULL'
    );
    return result.rows;
  }

  static async hardDelete(userId) {
    // Cascade deletes: sessions, usage_data, subscriptions, policy_acceptance
    await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [userId]);
    // Or DELETE if you want full removal (GDPR allows anonymization instead)
  }

  static async restoreAccount(userId) {
    await pool.query(
      'UPDATE users SET deletion_scheduled_at = NULL WHERE id = $1',
      [userId]
    );
  }
}
```

**Frontend:**
- [ ] Settings → Danger Zone tab
- [ ] "Delete Account" button → DeleteAccountModal
  - Warning message
  - Password input (security)
  - Confirmation checkbox
  - "Delete Account" button (red)
- [ ] On success:
  - Toast: "Account scheduled for deletion"
  - Redirect to logout + homepage
- [ ] Restore flow: `/restore-account` route
  - Check if `deletion_scheduled_at` is set
  - Show countdown: "X days remaining"
  - "Restore Account" button

**Email Templates:**

**Deletion Scheduled:**
```
Subject: Your CodeScribe AI Account Will Be Deleted

Hi [Name],

Your account is scheduled for deletion on [Date].

If this wasn't you, or you've changed your mind, click below to restore your account:

[Restore My Account]

After [Date], all your data will be permanently deleted:
- Account information
- Usage history
- Subscription details

Questions? Reply to this email.

---
CodeScribe AI
```

**Deletion Completed:**
```
Subject: Your CodeScribe AI Account Has Been Deleted

Hi [Name],

Your account has been permanently deleted as requested.

All your data has been removed from our systems.

If you'd like to use CodeScribe AI again, you're welcome to create a new account at codescribeai.com

---
CodeScribe AI
```

**Tasks:**
- [ ] Database: Add `deletion_scheduled_at`, `deleted_at` to users table
- [ ] Backend: `DELETE /api/user/account` endpoint
- [ ] Backend: `User.scheduleDeletion()`, `User.hardDelete()`, `User.restoreAccount()`
- [ ] Backend: Cron job or on-login check for expired deletions
- [ ] Frontend: DeleteAccountModal component
- [ ] Frontend: `/restore-account` route + RestoreAccount page
- [ ] Email: Deletion scheduled template
- [ ] Email: Deletion completed template
- [ ] Test: Complete deletion flow (schedule → restore → complete)
- [ ] Documentation: ACCOUNT-DELETION-WORKFLOW.md

#### 4.3: Analytics Opt-Out

**Backend:**
```javascript
// server/src/routes/user.js
router.put('/preferences', requireAuth, async (req, res) => {
  const { analyticsEnabled } = req.body;
  const userId = req.user.id;

  await pool.query(
    'UPDATE users SET analytics_enabled = $1 WHERE id = $2',
    [analyticsEnabled, userId]
  );

  res.json({ message: 'Preferences updated' });
});
```

**Frontend:**
```javascript
// client/src/utils/analytics.js
export function shouldLoadAnalytics() {
  const { user } = useAuth();

  // Check user preference (if logged in)
  if (user && !user.analyticsEnabled) {
    return false;
  }

  // Check Do Not Track browser setting
  if (navigator.doNotTrack === '1') {
    return false;
  }

  // Only load in production
  if (import.meta.env.DEV) {
    return false;
  }

  return true;
}

// client/src/App.jsx
function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (shouldLoadAnalytics()) {
      // Load Vercel Analytics
      import('@vercel/analytics').then((module) => {
        module.inject();
      });
    }
  }, [user?.analyticsEnabled]);

  // ...
}
```

**Tasks:**
- [ ] Database: Add `analytics_enabled BOOLEAN DEFAULT true` to users table
- [ ] Backend: `PUT /api/user/preferences` endpoint
- [ ] Frontend: Analytics opt-out toggle in Settings → Privacy
- [ ] Frontend: Conditional Vercel Analytics loading
- [ ] Frontend: Honor `navigator.doNotTrack`
- [ ] Test: Toggle works, analytics script loads/unloads
- [ ] Privacy Policy: Update to mention opt-out option

**Deliverables:**
- Data export downloads JSON
- Account deletion soft-deletes with 30-day grace period
- Analytics opt-out disables tracking
- All email templates working

---

### Phase 5: Policy Updates & Acceptance (Week 11) - 0.5 days

**Goal:** Track policy versions and require acceptance when policies change.

**Database Schema:**
```sql
CREATE TABLE policy_acceptance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  policy_type VARCHAR(50) NOT NULL, -- 'terms' or 'privacy'
  version VARCHAR(20) NOT NULL, -- '1.0.0', '1.1.0', '2.0.0'
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, policy_type, version)
);

CREATE INDEX idx_policy_acceptance_user ON policy_acceptance(user_id);
```

**Backend:**
```javascript
// server/src/config/policies.js
export const CURRENT_POLICY_VERSIONS = {
  terms: '1.0.0',
  privacy: '1.0.0',
};

// server/src/models/PolicyAcceptance.js
class PolicyAcceptance {
  static async hasAcceptedLatest(userId, policyType) {
    const currentVersion = CURRENT_POLICY_VERSIONS[policyType];
    const result = await pool.query(
      'SELECT * FROM policy_acceptance WHERE user_id = $1 AND policy_type = $2 AND version = $3',
      [userId, policyType, currentVersion]
    );
    return result.rows.length > 0;
  }

  static async recordAcceptance(userId, policyType, version) {
    await pool.query(
      'INSERT INTO policy_acceptance (user_id, policy_type, version) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [userId, policyType, version]
    );
  }
}

// server/src/middleware/checkPolicyAcceptance.js
export function requirePolicyAcceptance(req, res, next) {
  if (!req.isAuthenticated()) return next();

  const userId = req.user.id;
  const termsAccepted = await PolicyAcceptance.hasAcceptedLatest(userId, 'terms');
  const privacyAccepted = await PolicyAcceptance.hasAcceptedLatest(userId, 'privacy');

  if (!termsAccepted || !privacyAccepted) {
    return res.status(403).json({
      error: 'Policy acceptance required',
      requiresAcceptance: true,
      policies: {
        terms: !termsAccepted,
        privacy: !privacyAccepted,
      }
    });
  }

  next();
}
```

**Frontend:**
```javascript
// client/src/components/PolicyUpdateBanner.jsx
export function PolicyUpdateBanner() {
  const [showModal, setShowModal] = useState(false);
  const { user, checkPolicyAcceptance } = useAuth();

  useEffect(() => {
    if (user) {
      checkPolicyAcceptance().then((needsAcceptance) => {
        if (needsAcceptance) {
          setShowModal(true);
        }
      });
    }
  }, [user]);

  if (!showModal) return null;

  return (
    <PolicyUpdateModal
      onAccept={async () => {
        await acceptPolicies();
        setShowModal(false);
      }}
    />
  );
}

// PolicyUpdateModal.jsx
function PolicyUpdateModal({ onAccept }) {
  return (
    <Modal>
      <h2>We've Updated Our Policies</h2>
      <p>We've made changes to our Terms of Service and Privacy Policy.</p>

      <div className="changes">
        <h3>What's Changed:</h3>
        <ul>
          <li>Added data export feature</li>
          <li>Updated deletion policy with 30-day grace period</li>
          <li>Added analytics opt-out option</li>
        </ul>
      </div>

      <div className="links">
        <a href="/terms" target="_blank">Read Terms (v1.1.0)</a>
        <a href="/privacy" target="_blank">Read Privacy Policy (v1.1.0)</a>
      </div>

      <Button onClick={onAccept}>
        I Accept the Updated Policies
      </Button>
    </Modal>
  );
}
```

**Email Notification (30 days before):**
```
Subject: Important: Updates to CodeScribe AI Terms & Privacy Policy

Hi [Name],

We're updating our Terms of Service and Privacy Policy, effective [Date].

What's changing:
- Added data export feature (GDPR compliance)
- Updated account deletion process (30-day grace period)
- Added analytics opt-out option

View the updated policies:
- Terms of Service: https://codescribeai.com/terms
- Privacy Policy: https://codescribeai.com/privacy

You'll be asked to accept these changes when you next log in after [Date].

Questions? Reply to this email.

---
CodeScribe AI
```

**Tasks:**
- [ ] Database: `policy_acceptance` table migration
- [ ] Backend: `PolicyAcceptance` model
- [ ] Backend: `requirePolicyAcceptance` middleware
- [ ] Backend: `POST /api/user/accept-policies` endpoint
- [ ] Frontend: `PolicyUpdateBanner` component
- [ ] Frontend: `PolicyUpdateModal` with changes summary
- [ ] Email: Policy update notification template (Resend)
- [ ] Config: Version tracking in `/terms` and `/privacy` pages
- [ ] Test: Policy update flow (banner → modal → acceptance)
- [ ] Documentation: Policy versioning guide (semantic versioning)

**Deliverables:**
- Policy versions tracked
- Users prompted to accept on update
- Email notification 30 days before changes
- Acceptance recorded in database

---

### Phase 6: Email Infrastructure (Week 11) - 0.5 days

**Goal:** All transactional emails configured and tested.

**Email Templates (Resend):**

1. **Account Deletion Scheduled** (see Phase 4.2)
2. **Account Deletion Completed** (see Phase 4.2)
3. **Data Export Ready** (optional, see Phase 4.1)
4. **Policy Update Notification** (see Phase 5)
5. **Subscription Confirmation** (via Stripe webhook)
   ```
   Subject: Welcome to CodeScribe AI [Starter/Pro]!

   Hi [Name],

   Thank you for subscribing to CodeScribe AI [Starter/Pro]!

   Your subscription details:
   - Plan: [Starter $12/mo] or [Pro $29/mo]
   - Monthly limit: [50 or 200] docs
   - Billing date: [Date]
   - Next billing: [Date + 30 days]

   Get started: https://codescribeai.com
   Manage subscription: [Stripe portal link]

   Questions? Reply to this email.

   ---
   CodeScribe AI
   ```

6. **Subscription Cancelled**
   ```
   Subject: Your CodeScribe AI Subscription Has Been Cancelled

   Hi [Name],

   Your [Starter/Pro] subscription has been cancelled.

   You'll continue to have access until [end of billing period].
   After that, your account will revert to the Free tier (10 docs/month).

   Change your mind? Resubscribe anytime: https://codescribeai.com/pricing

   ---
   CodeScribe AI
   ```

7. **Password Reset** (✅ already exists)
8. **Welcome Email** (on signup)
   ```
   Subject: Welcome to CodeScribe AI!

   Hi [Name],

   Welcome to CodeScribe AI! 🎉

   You're on the Free tier with 10 docs per month.

   Quick start:
   1. Paste your code or upload a file
   2. Select doc type (README, JSDoc, API, Architecture)
   3. Generate professional documentation in seconds

   Supported languages: JavaScript, Python, Go, Rust, Java, and more

   Need more? Upgrade to Starter ($12) or Pro ($29) for higher limits.

   Questions? Reply to this email or visit our help center.

   ---
   CodeScribe AI
   ```

**Support Email Configuration:**
- [ ] Configure support@codescribeai.com forwarding (Namecheap → Gmail)
- [ ] Test: Send email to support@, verify receives in Gmail
- [ ] Create email response templates:
  - Data export request response
  - Account deletion request response
  - Refund request response
  - General support response
- [ ] Document SLA: 48h (Starter), 24h (Pro)

**Tasks:**
- [ ] Create all 8 email templates in Resend
- [ ] Test each template (use your email)
- [ ] Configure support@codescribeai.com forwarding
- [ ] Create email response templates (Google Docs or Notion)
- [ ] Document email sending logic in `server/src/services/emailService.js`
- [ ] Add email footer to all templates (unsubscribe, support, policies)
- [ ] Test: All emails render correctly in Gmail, Outlook, Apple Mail

**Deliverables:**
- 8 email templates live in Resend
- support@codescribeai.com working
- Email response templates documented

---

## Database Schema Changes

**Complete migration SQL:**
```sql
-- Migration 007: Add compliance and policy tracking
-- Run before Epic 2.4 (Stripe integration)

-- Add user privacy preferences
ALTER TABLE users ADD COLUMN analytics_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN deletion_scheduled_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_users_deletion ON users(deletion_scheduled_at) WHERE deletion_scheduled_at IS NOT NULL;

-- Policy acceptance tracking
CREATE TABLE policy_acceptance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  policy_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, policy_type, version)
);

CREATE INDEX idx_policy_acceptance_user ON policy_acceptance(user_id);
CREATE INDEX idx_policy_acceptance_type_version ON policy_acceptance(policy_type, version);

-- Data export tracking (optional, for download links)
CREATE TABLE data_exports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  export_url VARCHAR(500),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_exports_user ON data_exports(user_id);
CREATE INDEX idx_data_exports_expires ON data_exports(expires_at) WHERE expires_at > NOW();

-- Verification query
SELECT
  COUNT(*) as user_count,
  COUNT(CASE WHEN analytics_enabled = false THEN 1 END) as analytics_disabled_count,
  COUNT(CASE WHEN deletion_scheduled_at IS NOT NULL THEN 1 END) as pending_deletions
FROM users;

-- Rollback (if needed)
-- DROP TABLE data_exports;
-- DROP TABLE policy_acceptance;
-- ALTER TABLE users DROP COLUMN analytics_enabled;
-- ALTER TABLE users DROP COLUMN deletion_scheduled_at;
-- ALTER TABLE users DROP COLUMN deleted_at;
```

---

## API Endpoints Summary

**New endpoints:**
```
GET    /api/user/data-export          - Download user data (JSON)
DELETE /api/user/account              - Schedule account deletion
POST   /api/user/restore-account      - Restore scheduled deletion
PUT    /api/user/preferences          - Update analytics opt-out
GET    /api/user/policy-status        - Check if policies accepted
POST   /api/user/accept-policies      - Record policy acceptance
```

**Updated endpoints:**
```
POST   /api/auth/signup               - Record initial policy acceptance
GET    /api/user/settings             - Include analytics_enabled, deletion_scheduled_at
```

---

## Testing Requirements

**Unit Tests (40+ new tests):**
- PolicyAcceptance model (10 tests)
- User.scheduleDeletion, hardDelete, restoreAccount (8 tests)
- Data export formatting (6 tests)
- Analytics opt-out logic (6 tests)
- Email template rendering (10 tests)

**Integration Tests (20+ new tests):**
- Data export API endpoint (5 tests)
- Account deletion flow (8 tests)
- Policy acceptance flow (4 tests)
- Settings API endpoints (3 tests)

**E2E Tests (10+ new tests):**
- Complete data export flow (1 test)
- Account deletion with restore (2 tests)
- Policy update acceptance (1 test)
- Analytics opt-out toggle (1 test)
- Settings page navigation (5 tests)

**Manual Testing:**
- [ ] All 8 email templates render in Gmail, Outlook, Apple Mail
- [ ] support@codescribeai.com receives emails
- [ ] Data export JSON opens correctly
- [ ] Policy update banner appears on login
- [ ] Account deletion countdown shows correctly
- [ ] Analytics script loads/unloads based on preference

---

## Documentation Deliverables

**New docs:**
1. **GDPR-COMPLIANCE-GUIDE.md** - Complete compliance implementation
2. **SETTINGS-PAGE-SPEC.md** - UI/UX design for Settings page
3. **DATA-EXPORT-FORMAT.md** - JSON schema for data exports
4. **ACCOUNT-DELETION-WORKFLOW.md** - Soft delete process
5. **POLICY-VERSIONING-GUIDE.md** - Semantic versioning for policies
6. **EMAIL-TEMPLATES-GUIDE.md** - All email templates with usage

**Updated docs:**
- TERMS-AND-PRIVACY-SETUP.md (✅ already created)
- ROADMAP.md (add Epic 2.5)
- roadmap-data.json (add Epic 2.5)
- claude.md (add Epic 2.5 to current status)

---

## Success Criteria

**Phase 1 (UI Placeholders):**
- [ ] Footer visible on all pages
- [ ] T&Cs links accessible (Termly-hosted)
- [ ] SignupModal shows T&Cs checkbox (disabled)

**Phase 2 (Self-Hosted):**
- [ ] `/terms` and `/privacy` routes live
- [ ] T&Cs checkbox functional (blocks signup)
- [ ] All links updated to internal routes

**Phase 3 (Settings UI):**
- [ ] Settings page accessible from user menu
- [ ] All 4 tabs working (Account, Privacy, Subscription, Danger Zone)
- [ ] Analytics opt-out toggle functional

**Phase 4 (Data Rights):**
- [ ] Data export downloads JSON
- [ ] Account deletion soft-deletes (30-day grace)
- [ ] Restore account flow working

**Phase 5 (Policy Updates):**
- [ ] Policy versions tracked in database
- [ ] Users prompted to accept on update
- [ ] Email sent 30 days before change

**Phase 6 (Email):**
- [ ] All 8 email templates working
- [ ] support@codescribeai.com configured
- [ ] Email response templates documented

**Legal Compliance:**
- [ ] GDPR Article 13: Privacy notice ✅
- [ ] GDPR Article 15: Right to access ✅ (data export)
- [ ] GDPR Article 16: Right to rectification ✅ (settings page)
- [ ] GDPR Article 17: Right to erasure ✅ (account deletion)
- [ ] GDPR Article 18: Right to restriction ✅ (analytics opt-out)
- [ ] GDPR Article 20: Right to portability ✅ (data export)
- [ ] GDPR Article 21: Right to object ✅ (analytics opt-out)
- [ ] CCPA: Notice at collection ✅ (privacy policy)
- [ ] CCPA: Right to delete ✅ (account deletion)
- [ ] CCPA: Right to know ✅ (data export)
- [ ] CCPA: Right to opt-out ✅ (analytics opt-out)

---

## Timeline Summary

| Phase | Week | Duration | Priority |
|-------|------|----------|----------|
| Phase 1: UI Placeholders | 1-2 | 1 day | Optional |
| Phase 2-6: Full Implementation | 10-11 | 3-4 days | CRITICAL |

**Total:** 3-4 days (or 4-5 days if Phase 1 included)

**Critical Path:** Must complete before Epic 2.4 (Stripe Integration)

---

## Cost Estimate

**Development time:** 3-4 days ($0, your time)
**Termly.io:** $0 (free tier for policy generation)
**Resend email:** $0 (3K emails/month free)
**Legal review (optional):** $500-2,000 (not needed for standard SaaS)

**Total out-of-pocket:** $0

---

## Risk Mitigation

**Risk:** GDPR non-compliance leads to fines
**Mitigation:** Complete Epic 2.5 BEFORE accepting payments (Epic 2.4)

**Risk:** Users request data deletion, manual work required
**Mitigation:** Automated soft-delete + 30-day grace period

**Risk:** Policy updates require user re-acceptance, friction
**Mitigation:** Clear change summary in modal, 30-day email notice

**Risk:** Email deliverability issues
**Mitigation:** Use Resend (high deliverability), test all templates

---

## Next Steps

**Immediately (Week 1-2 of 90-Day Challenge):**
1. Generate Terms + Privacy at Termly.io
2. Create Footer component
3. Add T&Cs checkbox to SignupModal (disabled)
4. Deploy UI placeholders

**Before Stripe (Week 10-11):**
1. Self-host policies (/terms, /privacy)
2. Build Settings page
3. Implement data export + deletion
4. Set up email templates
5. Test everything

**After completion:**
- Update ROADMAP.md with Epic 2.5 status
- Update claude.md with new features
- Add to CHANGELOG.md
- Deploy to production

---

**Last Updated:** October 30, 2025
**Owner:** Jenni Coleman
**Status:** Specification complete, implementation pending
