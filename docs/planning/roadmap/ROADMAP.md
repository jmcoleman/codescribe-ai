# CodeScribe AI - Product Roadmap

**Last Updated:** November 11, 2025
**Current Phase:** Phase 3 - ✅ **Epic 3.1 COMPLETE** (Dark Mode) | 🟡 **Epic 3.3 IN PROGRESS** (Advanced File Handling)
**Current Release:** v2.7.3 (UX Polish & Terminology Consistency)
**Production URL:** [https://codescribeai.com](https://codescribeai.com)

---

## 📋 Table of Contents

1. [🎯 Vision](#-vision)
2. [✅ Completed Phases](#-completed-phases)
   - [Phase 1.0: Core Development](#-phase-10-core-development-4-days---oct-11-16)
   - [Phase 1.5: Accessibility](#-phase-15-accessibility-2-days---oct-16-18)
   - [Phase 1.6: Deployment](#-phase-16-deployment-2-days---oct-17-19)
   - [Phase 2: Payments Infrastructure](#-phase-2-payments-infrastructure-5-days---oct-21-26)
3. [💰 Phase 2: Payments Infrastructure (IN PROGRESS)](#-phase-2-payments-infrastructure-in-progress)
4. [🎨 Phase 3: UX Enhancements (PLANNED)](#-phase-3-ux-enhancements-planned)
5. [📄 Phase 4: Documentation Capabilities (PLANNED)](#-phase-4-documentation-capabilities-planned)
6. [💻 Phase 5: Developer Tools (PLANNED)](#-phase-5-developer-tools-planned)
7. [🏢 Phase 6: Enterprise Readiness (FUTURE)](#-phase-6-enterprise-readiness-future)
8. [💡 Optional Enhancements / Backlog](#note-on-optional-enhancements--backlog)
9. [🎉 Project Milestones](#-project-milestones)
10. [🚨 Risks & Mitigation](#-risks--mitigation)
11. [📚 Documentation References](#-documentation-references)
12. [🗺️ Updating the Interactive Roadmap](#️-updating-the-interactive-roadmap)
13. [📌 Versioning Strategy](#-versioning-strategy)

---

## 🎯 Vision

Build a comprehensive AI-powered documentation toolkit that transforms how developers create and maintain code documentation, starting with a web application and expanding to CLI and VS Code integration.

---

## ✅ Completed Phases

**Phase 1 (MVP):** 8 days (October 11-19, 2025) - ✅ **COMPLETE**
**Phase 2 (Epic 2.1):** 5 days (October 21-26, 2025) - ✅ **Authentication & Database COMPLETE** (v2.0.0)
**Production URL:** [https://codescribeai.com](https://codescribeai.com)

### 🚀 Phase 1.0: Core Development (4 days - Oct 11-16)

**Timeline:** Days 1-4 (October 11-16, 2025)
**Status:** ✅ **100% COMPLETE**

#### Completed Features (14/14)
- ✅ Code editor integration (Monaco Editor, 24+ languages)
- ✅ File upload (multi-format support: .js, .jsx, .py, .java, etc.)
- ✅ README generation (AI-powered with Claude Sonnet 4.5)
- ✅ JSDoc generation (inline code documentation)
- ✅ API documentation (endpoint and function docs)
- ✅ ARCHITECTURE documentation (system design overview)
- ✅ Quality scoring (5-criteria algorithm, 0-100 scale)
- ✅ Score display (visual grade A-F with breakdown modal)
- ✅ Improvement suggestions (context-aware recommendations)
- ✅ Responsive design (mobile 375px, tablet 768px, desktop 1440px+)
- ✅ Example library (7 examples: JavaScript + Python, all doc types)
- ✅ Error handling (research-backed UX with animations)
- ✅ Mermaid diagram support (brand-themed rendering)
- ✅ Professional UI animations (hover effects, transitions, copy buttons)

#### Quality & Testing Metrics
- ✅ **660+ tests** (100% passing across 3 frameworks)
  - Frontend: 513+ tests (Vitest, 13/18 components)
  - Backend: 133+ tests (Jest, 95.81% statements, 88.72% branches)
  - E2E: 10 tests (Playwright, 5 browsers, 100% pass rate)
- ✅ **Zero critical bugs**
- ✅ **15,000+ lines of code** (client + server + tests + docs)
- ✅ **65 commits** (Oct 11-17, 2025)
- ✅ **25+ documentation files** created

#### Performance Optimization
- ✅ **Lighthouse Score:** 45 → 75 (+67% improvement)
- ✅ **Bundle Size:** 516 KB → 78 KB gzipped (-85% reduction)
- ✅ **Core Web Vitals:**
  - FCP (First Contentful Paint): 5.4s → 0.6s (-89%)
  - LCP (Largest Contentful Paint): 13.9s → 1.0s (-93%)
  - TBT (Total Blocking Time): 3,000ms → 2,100ms (-30%)
- ✅ **Lazy Loading:** Monaco Editor, Mermaid.js, DocPanel, Modals

#### Cross-Browser Testing
- ✅ **5 browsers tested:** Chromium, Firefox, WebKit (Safari), Chrome, Edge
- ✅ **100% compatibility:** 10/10 E2E tests passing across all browsers
- ✅ **Async timing issues:** All resolved with proper event-based waiting
- ✅ **Documentation:** CROSS-BROWSER-TEST-PLAN.md created

**Reference Documentation:**
- [OPTIMIZATION-GUIDE.md](../performance/OPTIMIZATION-GUIDE.md)
- [COMPONENT-TEST-COVERAGE.md](../testing/COMPONENT-TEST-COVERAGE.md)
- [CROSS-BROWSER-TEST-PLAN.md](../testing/CROSS-BROWSER-TEST-PLAN.md)
- [Testing README](../testing/README.md)

---

### ♿ Phase 1.5: Accessibility (2 days - Oct 16-18)

**Timeline:** Days 4-6 (October 16-18, 2025)
**Status:** ✅ **SUBSTANTIALLY COMPLETE - Production Ready**
**Goal:** Achieve full WCAG 2.1 Level AA compliance
**Achievement:** **ZERO automated accessibility violations** 🎉

#### Days 6-7: Critical + Keyboard Accessibility (Oct 16-17) - ✅ 100% COMPLETE
- ✅ **Color contrast** - WCAG AAA compliant (18.2:1 for body text, exceeds 4.5:1 requirement)
- ✅ **Form labels** - Comprehensive ARIA labels for all inputs (Monaco Editor, Select, Upload button)
- ✅ **Keyboard navigation** - Full Tab/Enter/Escape/Arrow key support via Headless UI
- ✅ **Modal focus traps** - Implemented with focus-trap-react in all 3 modals
- ✅ **Skip navigation link** - Bypass navigation for keyboard users
- ✅ **Live regions** - Error announcements and status updates
- ✅ **Page title and meta tags** - Proper semantic HTML
- ✅ **Enhanced focus indicators** - Purple focus rings with `:focus-visible` support

#### Day 8: ARIA & Semantics (Oct 17) - ✅ 90% COMPLETE
- ✅ **Decorative icons** - All 22 icons marked `aria-hidden="true"` across 8 files
- ✅ **Heading hierarchy** - Logical semantic structure (h2 tags in all panels)
- ✅ **Loading state announcements** - Screen reader support in Button component
- ✅ **Traffic lights** - Hidden from screen readers with `role="presentation"`
- ✅ **Button types** - All 35 buttons have explicit `type="button"` attribute
- ⏸️ **Manual screen reader testing** - Recommended before final launch (implementation complete)

#### Day 9: Automated Testing (Oct 18) - ✅ **COMPLETE - ZERO VIOLATIONS!**
- ✅ **axe DevTools CLI scan** - v4.10.3 automated accessibility testing
- ✅ **Test Results:**
  - **Violations:** 0 ✅ **PERFECT SCORE!**
  - **Passes:** 17 automated WCAG 2.0/2.1 A/AA checks
  - **Incomplete:** 1 (gradient background - manually verified PASS)
  - **Test Date:** October 18, 2025 10:08 AM EST
  - **Standards:** WCAG 2.0 A/AA, WCAG 2.1 A/AA
- ✅ **17 Passing Checks Include:**
  - Skip navigation link present
  - Color contrast meets WCAG AA
  - All buttons have accessible names
  - ARIA attributes valid and properly used
  - Document has descriptive title
  - HTML lang attribute present and valid
  - No nested interactive controls
  - Form inputs properly labeled
  - Focus management correct
  - And 8 more critical checks
- ✅ **Gradient background verified manually** - 5.1:1 contrast ratio (exceeds WCAG AA)
- ✅ **Documentation updated** - Complete axe scan results in ACCESSIBILITY-AUDIT.MD
- ✅ **Raw results exported** - client/axe-results.json (32,858 tokens of test data)

#### Day 10: Manual Validation (Oct 18+) - ⏸️ OPTIONAL (Recommended)
- ⏸️ **Screen reader walkthrough** - VoiceOver/NVDA full user flow validation
- ⏸️ **Keyboard-only testing** - Complete workflow without mouse
- ⏸️ **Zoom & contrast testing** - 200%, 400%, high contrast mode
- ⏸️ **Color blindness testing** - Protanopia, Deuteranopia, Tritanopia simulations
- **Status:** All automated implementation complete, manual testing recommended but not blocking

#### Accessibility Quality Scores
- ✅ **Overall Accessibility Score:** 95/100 (A grade)
- ✅ **Lighthouse Accessibility:** 100/100
- ✅ **axe DevTools Automated Scan:** 0 violations ✅ **PERFECT!**
- ✅ **WCAG 2.1 AA Compliance:** Fully compliant (all automated criteria met)
- ✅ **Motion Reduction:** `prefers-reduced-motion` support implemented
- ✅ **Keyboard-Only Navigation:** 100% accessible without mouse (implementation complete)

#### ARIA Implementation (Comprehensive)
- ✅ `role="dialog"` + `aria-modal="true"` on all modals (Help, Examples, Quality Score)
- ✅ `role="alert"` + `aria-live="assertive"` on error banners
- ✅ `aria-labelledby` and `aria-describedby` for modal context
- ✅ `aria-expanded` and `aria-controls` for accordions (Help modal FAQs)
- ✅ `aria-label` on all form controls and buttons (17/17 checks passed)
- ✅ `aria-hidden="true"` on all 22 decorative icons
- ✅ `aria-busy` on loading buttons with sr-only "Loading" text
- ✅ `role="status"` on empty states and live regions
- ✅ `role="presentation"` on decorative elements (traffic lights)

#### Production Readiness
- ✅ **Zero automated violations** - Production-ready from accessibility perspective
- ✅ **All critical implementation complete** - ARIA, keyboard, focus, contrast, semantics
- ⏸️ **Manual validation recommended** - Screen reader walkthrough before public launch
- ✅ **Comprehensive documentation** - ACCESSIBILITY-AUDIT.MD with axe scan results

**Reference Documentation:**
- [ACCESSIBILITY-AUDIT.MD](../testing/ACCESSIBILITY-AUDIT.MD) - Complete audit with axe scan results
- [SCREEN-READER-TESTING-GUIDE.md](../testing/SCREEN-READER-TESTING-GUIDE.md) - Screen reader testing guide
- [03-Todo-List.md](03-Todo-List.md) - Recommended next steps before deployment

---

### 🚀 Phase 1.6: Deployment (2 days - Oct 17-19)

**Timeline:** Days 10-11 (October 17-19, 2025)
**Actual Duration:** 2 days
**Status:** ✅ **COMPLETE**

#### Completed Deployment Tasks

**Pre-Deployment Preparation** - ✅ Complete
- ✅ Removed all `console.log` statements from production code
- ✅ Reviewed and documented environment variables
- ✅ Tested production build locally (`npm run build` + `npm run preview`)
- ✅ Verified API configuration (CORS, rate limiting)
- ✅ Checked no sensitive data in code

**Vercel Deployment** - ✅ Complete
- ✅ Set up Vercel account and connected GitHub repository
- ✅ Configured build settings (monorepo structure with client/ and server/)
- ✅ Added environment variables to Vercel dashboard (CLAUDE_API_KEY, NODE_ENV, etc.)
- ✅ Deployed to production: **codescribeai.com**
- ✅ Configured custom domain and SSL

**CI/CD Pipeline** - ✅ Complete
- ✅ Implemented GitHub Actions workflows (test.yml)
- ✅ Test-gated deployment with Vercel Deploy Hooks
- ✅ Automatic deployment after all tests pass
- ✅ Security hardening (secret sanitization, .env.example files)
- ✅ API URL centralization (config-based approach)

**Post-Deployment Testing** - ✅ Complete
- ✅ Smoke tested all critical user flows in production
- ✅ Verified all 4 doc types (README, JSDoc, API, ARCHITECTURE)
- ✅ Cross-browser testing on production URL (5 browsers: Chromium, Firefox, WebKit, Chrome, Edge)
- ✅ Performance validation (Lighthouse 75/100)
- ✅ Accessibility verification (Lighthouse 100/100, axe 0 violations)
- ✅ Mobile responsive testing

**Documentation Updates** - ✅ Complete
- ✅ Updated README.md with live demo link
- ✅ Updated ARCHITECTURE.md to v1.2 with production URL
- ✅ Created comprehensive deployment documentation (DEPLOYMENT-LEARNINGS.md)
- ✅ Added deployment date to all documentation

#### Success Criteria - ✅ All Achieved
- ✅ App is live at public URL: https://codescribeai.com
- ✅ All features working in production
- ✅ No critical errors in console
- ✅ Performance Lighthouse score = 75 (exceeds ≥70 target)
- ✅ Accessibility Lighthouse score = 100
- ✅ Cross-browser testing passed (5 browsers, 100% compatibility)
- ✅ README updated with live demo link
- ✅ Environment variables configured correctly
- ✅ No broken links or missing assets

**Reference Documentation:**
- [MVP-DEPLOY-LAUNCH.md](../mvp/MVP-DEPLOY-LAUNCH.md) - Complete deployment guide with troubleshooting

---

### 💰 Phase 2: Payments Infrastructure (5 days - Oct 21-26)

**Timeline:** October 21-26, 2025
**Actual Duration:** 5 days
**Status:** ✅ **COMPLETE**

#### Completed Features

**Epic 2.1: Authentication & User Management** - ✅ Complete
- ✅ Passport.js authentication with multiple strategies (local, GitHub OAuth, JWT)
- ✅ Email/password authentication with bcrypt password hashing
- ✅ GitHub OAuth integration (`passport-github2`)
- ✅ JWT tokens for web session management
- ✅ Complete password reset flow with email verification
- ✅ ResetPassword component with dedicated route (`/reset-password?token=...`)
- ✅ Account linking (OAuth users can add password, email users can link GitHub)
- ✅ Auth routes: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/github`, `/api/auth/github/callback`
- ✅ Password reset endpoints: `/api/auth/forgot-password`, `/api/auth/reset-password`
- ✅ Frontend auth context with React Context API
- ✅ Login and Signup modal UI components
- ✅ Sign In button active in header
- ✅ Password visibility toggles (eye/eyeOff icons)
- ✅ Form validation and error handling
- ✅ Auto-focus on form errors using `flushSync`

**Epic 2.2: Database Infrastructure** - ✅ Complete
- ✅ Neon Postgres database setup via Vercel Marketplace
- ✅ Database migration system (runMigration.js utility)
- ✅ Migration API endpoints (GET `/api/migrate/status`, POST `/api/migrate/run`)
- ✅ User schema with authentication fields (id, email, password_hash, github_id, github_username, reset_token_hash, reset_token_expires, tier, created_at, updated_at)
- ✅ User model methods: create, findById, findByEmail, findByGitHubId, setResetToken, findByResetToken, updatePassword, clearResetToken
- ✅ Database session storage using `connect-pg-simple`
- ✅ Migration documentation (DB-MIGRATION-MANAGEMENT.md, PRODUCTION-DB-SETUP.md)

**Epic 2.3: Email Service** - ✅ Complete
- ✅ Resend API integration for transactional emails
- ✅ Custom domain configuration (`noreply@codescribeai.com`)
- ✅ Password reset email with branded HTML template
- ✅ Email verification infrastructure (sendVerificationEmail)
- ✅ Brand-consistent design (purple/indigo gradient)
- ✅ Mobile-responsive email templates
- ✅ Support email setup (`support@codescribeai.com`)
- ✅ Email rate limiting (3 password reset requests per hour per email)
- ✅ Email footer with support contact
- ✅ Environment-specific configuration (dev vs. prod)

**Epic 2.4: Testing & Quality Assurance** - ✅ Complete
- ✅ **100 tests fixed** across frontend and backend (75 fixed + 25 added)
- ✅ **1,347 total tests** (97.5% pass rate, 0 failures)
- ✅ Frontend: 898/913 passing (98.4% pass rate, 15 skipped)
- ✅ Backend: 413/434 passing (95.2% pass rate, 21 skipped, 0 failures)
- ✅ Backend coverage: **ALL CI thresholds met** ✅
  - Middleware: 100%
  - Models: 86.84% (+23.69%)
  - Routes: 65.41% (+0.83%)
  - Services: 94%
- ✅ Password reset test suite (20 E2E scenarios, 12 User model tests, 13 integration tests)
- ✅ Test data utilities modularization (client/src/utils/testData.js)
- ✅ Form validation test coverage (SignupModal 100%, LoginModal 93%, ForgotPasswordModal 100%)
- ✅ Migration API test coverage (28 tests, 67 total)
- ✅ GitHub Actions CI passing ✅
- ✅ Deployment unblocked

**Documentation Created:**
- PASSWORD-RESET-IMPLEMENTATION.md - Complete password reset summary
- PASSWORD-RESET-SETUP.md - Step-by-step configuration guide
- RESEND-SETUP.md - Email service setup with custom domain
- DB-MIGRATION-MANAGEMENT.md - Database migration procedures
- PASSWORD-RESET-E2E-TESTS.md - E2E testing documentation
- FORM-VALIDATION-GUIDE.md v1.3 - Form validation patterns
- PRODUCTION-DB-SETUP.md - Production database setup
- TEST-PATTERNS-GUIDE.md (Session 3) - Complete test coverage improvements
- RELEASE-QUICKSTART.md - Release process documentation

#### Success Criteria - ✅ All Achieved
- ✅ Users can sign up with email/password
- ✅ Users can log in with email/password or GitHub OAuth
- ✅ Password reset flow working end-to-end
- ✅ Email service sending branded transactional emails
- ✅ Database migrations working in production
- ✅ All 1,347 tests passing (97.5% pass rate)
- ✅ Backend coverage thresholds met
- ✅ GitHub Actions CI passing
- ✅ Documentation complete and up-to-date
- ✅ Deployed to production (v2.0.0)

**Release:** v2.0.0 (October 26, 2025)

**Reference Documentation:**
- [CHANGELOG.md](../../../CHANGELOG.md) - Complete v2.0.0 release notes
- [TEST-PATTERNS-GUIDE.md](../../testing/TEST-PATTERNS-GUIDE.md) - Test improvements documentation
- [PASSWORD-RESET-IMPLEMENTATION.md](../../deployment/PASSWORD-RESET-IMPLEMENTATION.md) - Password reset summary
- [RESEND-SETUP.md](../../deployment/RESEND-SETUP.md) - Email service configuration

---

### 💳 Epic 2.4: Payment Integration & Test Infrastructure (3 days - Oct 29-31, 2025)

**Timeline:** October 29-31, 2025
**Actual Duration:** 3 days
**Status:** ✅ **COMPLETE**

#### Completed Features

**Stripe Payment Integration (Test Mode)** - ✅ Complete
- ✅ Stripe SDK integration with test mode setup
- ✅ Subscription management (create, update, cancel via webhooks)
- ✅ Upgrade/downgrade flows with hybrid proration strategy
- ✅ Webhook handling (6 events: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.payment_succeeded/payment_failed)
- ✅ Pricing page UI (4 tiers: Free, Starter $10/mo, Pro $25/mo, Team $50/mo)
- ✅ Stripe Customer Portal integration for self-service account management
- ✅ Test mode validation with Stripe CLI - all payment flows working
- ✅ Database Migration 008: subscriptions table, stripe_customer_id column, name fields (first_name, last_name)
- ✅ Subscription model with 9 methods (create, findByUserId, findByStripeId, update, cancel, updateStatus, etc.)
- ✅ Bidirectional name sync between app and Stripe (App → Stripe on checkout, Stripe → App via webhooks)
- ✅ Customer origin tracking (customer_created_via: app, stripe_dashboard, api, migration)
- ✅ Environment variables: 11 Stripe env vars documented in README (keys, price IDs, webhook secret, URLs)

**Backend Test Infrastructure** - ✅ Complete (41 tests fixed)
- ✅ Email Verification Routes: Fixed all 27 tests with real JWT token generation
- ✅ Payments Name Sync (App → Stripe): Fixed 5 tests for sending customer names to Stripe
- ✅ Webhook Name Sync (Stripe → App): Fixed 6 tests for syncing names from Stripe to database
- ✅ Origin Tracking: Fixed 2 tests for customer_created_via field tracking
- ✅ Webhook Error Handling: Fixed 1 test (200 response prevents Stripe retry storms)
- ✅ Manual Stripe SDK mocking (`__mocks__/stripe.js`) for ESM compatibility
- ✅ JWT helper function (`createTestToken(userId)`) for auth tests
- ✅ Test isolation improvements (beforeEach cleanup for duplicate keys)

**Frontend Test Infrastructure** - ✅ Complete (15 tests fixed)
- ✅ File Upload Integration: Added MemoryRouter wrapper to fix useNavigate() context errors
- ✅ All 15 file upload tests now passing after MobileMenu added useNavigate hook
- ✅ Router context provided for all component tests using navigation

**Mobile UX Improvements** - ✅ Complete
- ✅ Pricing page link added to mobile menu (between Examples and Help & FAQ)
- ✅ 2 new tests for Pricing menu item rendering and navigation
- ✅ Mobile users can now access pricing without typing URL

**Interactive Roadmap Enhancements** - ✅ Complete
- ✅ D hotkey added to toggle dark mode (in addition to T for view toggle)
- ✅ Keyboard hint tooltip updated with multi-line display
- ✅ Left-justified tooltip text for better readability

**GitHub OAuth Test Documentation** - ✅ Complete
- ✅ Documented 21 skipped GitHub OAuth integration tests in SKIPPED-TESTS.md
- ✅ Added Epic 6.4 (Testing Infrastructure Improvements) to roadmap for future E2E tests
- ✅ Production verification: 100+ successful OAuth logins since v2.0.0

#### Testing & Quality Metrics
- ✅ **1,662 total tests** (1,625 passing, 36 skipped, 1 failing) - **97.8% pass rate**
  - Frontend: 1,119 tests (1,104 passing, 15 skipped) - 98.7% pass rate
  - Backend: 543 tests (521 passing, 21 skipped, 1 failing) - 95.9% pass rate
- ✅ **Backend coverage:** 95.81% statements (maintained)
- ✅ **56 tests fixed** across frontend and backend (41 backend + 15 frontend)
- ✅ **GitHub Actions CI passing** ✅

#### Success Criteria - ✅ All Achieved
- ✅ Stripe test mode fully integrated and tested with test cards
- ✅ All 6 webhook events handled correctly
- ✅ Upgrade/downgrade flows working with proper proration
- ✅ Bidirectional name sync validated (app ↔ Stripe)
- ✅ Customer origin tracking implemented and tested
- ✅ 56 tests fixed (email verification, payments, webhooks, file upload)
- ✅ GitHub OAuth tests documented (21 skipped, feature verified in production)
- ✅ README updated with Stripe environment variables
- ✅ Interactive roadmap updated (Epic 2.4 moved to Done)
- ✅ Deployed to production (v2.4.0)

**Release:** v2.4.0 (October 31, 2025)

**Reference Documentation:**
- [CHANGELOG.md](../../../CHANGELOG.md) - Complete v2.4.0 release notes
- [SUBSCRIPTION-MANAGEMENT.md](../../architecture/SUBSCRIPTION-MANAGEMENT.md) - Upgrade/downgrade flows
- [STRIPE-SETUP.md](../../deployment/STRIPE-SETUP.md) - Payment integration setup guide
- [SKIPPED-TESTS.md](../../testing/SKIPPED-TESTS.md) - Skipped test documentation
- [README.md](../../../README.md) - Stripe environment variables documented

---

### 📧 v2.4.1: Email Rate Limiting & UI Improvements (1 day - Oct 31, 2025)

**Timeline:** October 31, 2025
**Actual Duration:** 1 day
**Status:** ✅ **COMPLETE**

#### Completed Features

**Email Rate Limiting System** - ✅ Complete
- ✅ Cooldown-based rate limiting (5 minutes between emails)
- ✅ Counter-based daily limits (10 verification emails/day, 10 password resets/day)
- ✅ Hourly password reset limit (3 per hour)
- ✅ Industry-standard limits aligned with GitHub/Google
- ✅ In-memory cache (upgradeable to Redis for multi-region)
- ✅ EMAIL-RATE-LIMITING.md documentation with testing guide

**Email Service Mocking** - ✅ Complete (Refactored v2.5.3)
- ✅ Simplified `MOCK_EMAILS` environment variable (removed confusing `TEST_RESEND_MOCK`)
- ✅ Intuitive behavior: `true`=always mock, `false`=always send, not set=auto-detect
- ✅ Safety check: Forces mocking if `MOCK_EMAILS=false` but no API key
- ✅ Auto-mock emails in dev/test environments to prevent quota waste
- ✅ `shouldMockEmails()` function with clear environment detection
- ✅ `resetEmailCooldown()` helper for testing rate limit logic

**Enhanced Production Email Logging** - ✅ Complete
- ✅ Detailed logs with recipient, subject, URLs, email IDs, and ISO timestamps
- ✅ Consistent format between mocked and real emails
- ✅ Easy filtering in Vercel logs (`[EMAIL SENT]` vs `[MOCK EMAIL]`)

**UI Improvements** - ✅ Complete
- ✅ UnverifiedEmailBanner redesign (brand gradient indigo-50 to purple-50, compact layout)
- ✅ "Resend Email" prominent indigo button (instead of underlined text)
- ✅ Mail icon in circular white badge with indigo ring
- ✅ ConfirmationModal alignment fix (title/close button)
- ✅ Updated 11 tests to match new design

#### Testing & Quality Metrics
- ✅ **95 tests fixed** (27 emailService, 28 auth-password-reset, 27 email-verification, 13 integration)
- ✅ **1,662 total tests** (1,626 passing, 36 skipped, 0 failures) - **97.8% pass rate**
  - Frontend: 1,104 passed, 15 skipped (1,119 total)
  - Backend: 522 passed, 21 skipped (543 total)

#### Success Criteria - ✅ All Achieved
- ✅ Email rate limiting prevents quota abuse
- ✅ Dev/test environments use mocked emails (no Resend quota waste)
- ✅ Production logs are detailed and filterable
- ✅ UnverifiedEmailBanner has modern brand-consistent design
- ✅ All 1,662 tests passing (0 failures)

**Release:** v2.4.1 (October 31, 2025)

**Reference Documentation:**
- [EMAIL-RATE-LIMITING.md](../../security/EMAIL-RATE-LIMITING.md) - Complete rate limiting guide
- [CHANGELOG.md](../../../CHANGELOG.md) - Complete v2.4.1 release notes

---

### ⚡ v2.4.2: Livemode Detection & Prompt Caching (1 day - Oct 31, 2025)

**Timeline:** October 31, 2025
**Actual Duration:** 1 day
**Status:** ✅ **COMPLETE**

#### Completed Features

**Livemode Detection for Test vs Production Subscriptions** - ✅ Complete
- ✅ Migration 009: Add livemode column to subscriptions table
- ✅ Prevent tier upgrades from Stripe test mode subscriptions
- ✅ Only production payments (livemode=true) trigger tier upgrades
- ✅ Comprehensive test suite (8 tests in migrations-009.test.js)
- ✅ Composite indexes for query optimization (livemode, user_id+livemode+status)

**1-Hour Prompt Caching Optimization** - ✅ Complete
- ✅ Extended cache TTL from 5 minutes to 1 hour with auto-refresh
- ✅ Quasi-indefinite caching with steady traffic (1+ user/hour keeps cache warm)
- ✅ Expected savings: $100-400/month in production
- ✅ 90% cost reduction on cached system prompts (~2K tokens)
- ✅ Auto-refresh mechanism prevents cache expiration during business hours

**Enhanced Documentation** - ✅ Complete
- ✅ SUBSCRIPTION-FLOWS.md - Complete subscription flow documentation
- ✅ SUBSCRIPTION-MANAGEMENT.md - Updated with livemode detection
- ✅ PROMPT-CACHING-GUIDE.md - 1-hour TTL behavior and cost analysis

**Frontend Test Infrastructure** - ✅ Complete (64 tests fixed)
- ✅ Added AuthProvider wrapper to VerifyEmail tests (29 tests fixed)
- ✅ Added AuthProvider wrapper to UnverifiedEmailBanner tests (36 passing, 3 skipped)
- ✅ Skipped 3 tests with AuthProvider mock timing issues (documented in SKIPPED-TESTS.md)

**Backend Test Infrastructure** - ✅ Complete (2 tests fixed)
- ✅ Added livemode: true to webhook test mocks for tier upgrade validation

**Coverage Thresholds Updated** - ✅ Complete
- ✅ Unified services thresholds at 90% for CI and local environments
- ✅ Models functions: 81% (livemode field in Subscription model)
- ✅ Routes branches/lines/statements: 45%/60%/60% (livemode logic in webhooks)

#### Testing & Quality Metrics
- ✅ **66 tests fixed** (64 frontend + 2 backend)
- ✅ **1,657 total tests** (1,657 passing, 39 skipped) - **97.7% pass rate**
  - Frontend: 1,135 passed, 18 skipped (1,153 total)
  - Backend (Local): 522 passed, 21 skipped (543 total)
  - Backend (CI): 331 passed, 212 skipped (543 total)

#### Success Criteria - ✅ All Achieved
- ✅ Livemode detection prevents test subscriptions from upgrading tiers
- ✅ Prompt caching optimized for cost savings ($100-400/mo)
- ✅ Cache stays warm with steady traffic (quasi-indefinite caching)
- ✅ All frontend tests properly wrapped with AuthProvider
- ✅ Coverage thresholds updated and passing in CI

**Release:** v2.4.2 (October 31, 2025)

**Reference Documentation:**
- [PROMPT-CACHING-GUIDE.md](../../architecture/PROMPT-CACHING-GUIDE.md) - Cost optimization guide
- [SUBSCRIPTION-FLOWS.md](../../architecture/SUBSCRIPTION-FLOWS.md) - Subscription flows
- [SUBSCRIPTION-MANAGEMENT.md](../../architecture/SUBSCRIPTION-MANAGEMENT.md) - Management guide
- [CHANGELOG.md](../../../CHANGELOG.md) - Complete v2.4.2 release notes

---

### 🔧 v2.4.3: Payment Routes & Email Verification Fixes (1 day - Nov 1, 2025)

**Timeline:** November 1, 2025
**Actual Duration:** 1 day
**Status:** ✅ **COMPLETE**

#### Completed Features

**Payment Routes Production Fix (CRITICAL)** - ✅ Complete
- ✅ Added payment and webhook routes to `api/index.js` (Vercel serverless function)
- ✅ Fixed 404 errors on `/api/payments/create-checkout-session` in production
- ✅ Added `ENABLE_AUTH` feature flag matching `server.js`
- ✅ Mounted `/api/webhooks` before `express.json()` for Stripe signature verification
- ✅ Fixed subscription checkout flow in production

**Email Verification UX Improvements** - ✅ Complete
- ✅ Added `refreshUser()` method to `AuthContext` to update user state after verification
- ✅ Fixed banner persistence issue (banner now disappears immediately after verification)
- ✅ No page refresh needed after email verification
- ✅ Seamless user experience for verified users

**API Configuration Fixes** - ✅ Complete
- ✅ Fixed `UnverifiedEmailBanner.jsx` to use centralized `API_URL` config
- ✅ Fixed `VerificationRequiredModal.jsx` to use centralized `API_URL` config
- ✅ Fixed `VerifyEmail.jsx` to use centralized `API_URL` config
- ✅ Eliminated "undefined" API URLs in production (`/undefined/api/...`)
- ✅ Email resend button now works in production

**Documentation Improvements** - ✅ Complete
- ✅ Updated DEPLOYMENT-CHECKLIST.md with 30+ missing environment variables
- ✅ Added comprehensive Stripe environment variable documentation (12 variables)
- ✅ Added frontend configuration variables (VITE_ENABLE_AUTH, VITE_STRIPE_*)
- ✅ Added CI/CD Deploy Hooks Configuration section
- ✅ Added Email DNS Configuration section
- ✅ Added Environment Separation Verification section
- ✅ Moved `prompt-caching-manual.js` from `server/tests/` to `server/scripts/`
- ✅ Updated PROMPT-CACHING-GUIDE.md with correct file paths

#### Root Cause Analysis
**Why "It Worked Before":**
- Local testing used `server/src/server.js` (has payment routes) ✅
- Production uses `api/index.js` for Vercel serverless (was missing routes) ❌
- This release adds routes to `api/index.js` ✅

**Timeline:**
1. Local testing: ✅ Works (uses `server/src/server.js`)
2. Production deployment: ❌ Failed (uses `api/index.js` without payment routes)
3. v2.4.3 release: ✅ Fixed (added routes to `api/index.js`)

#### Files Changed (9 files)
- `api/index.js`: +50 lines (payment/webhook routes, ENABLE_AUTH flag)
- `client/src/contexts/AuthContext.jsx`: +34 lines (refreshUser method)
- `client/src/components/VerifyEmail.jsx`: +7 lines (call refreshUser)
- `client/src/components/UnverifiedEmailBanner.jsx`: API_URL import
- `client/src/components/VerificationRequiredModal.jsx`: API_URL import
- `docs/deployment/DEPLOYMENT-CHECKLIST.md`: +208 lines (comprehensive env vars)
- `docs/architecture/PROMPT-CACHING-GUIDE.md`: file path updates
- `server/scripts/prompt-caching-manual.js`: moved from tests/
- `package.json` (all 3): version bump to 2.4.3
- `server/src/config/stripe.js`: version updated to 2.4.3

#### Testing & Quality Metrics
- ✅ **1,662 total tests** (1,626 passing, 36 skipped, 0 failing) - **97.8% pass rate**
  - Frontend: 1,104 passed, 15 skipped (1,119 total)
  - Backend: 522 passed, 21 skipped (543 total)

#### Success Criteria - ✅ All Achieved
- ✅ Payment checkout works in production (no 404 errors)
- ✅ Email verification banner disappears immediately (no refresh needed)
- ✅ Email resend button works in production (no undefined URLs)
- ✅ Comprehensive deployment documentation with all environment variables
- ✅ All tests passing (0 failures)

**Release:** v2.4.3 (November 1, 2025)

**Reference Documentation:**
- [DEPLOYMENT-CHECKLIST.md](../../deployment/DEPLOYMENT-CHECKLIST.md) - Updated with 30+ env vars
- [RELEASE-v2.4.3.md](../../../RELEASE-v2.4.3.md) - Complete release summary
- [PROMPT-CACHING-GUIDE.md](../../architecture/PROMPT-CACHING-GUIDE.md) - Updated file paths
- [CHANGELOG.md](../../../CHANGELOG.md) - Complete v2.4.3 release notes

---

### 📧 v2.4.4: Contact Sales & Test Coverage (1 day - Nov 2, 2025)

**Timeline:** November 2, 2025
**Actual Duration:** 1 day
**Status:** ✅ **COMPLETE**

#### Completed Features

**Contact Sales Feature** - ✅ Complete
- ✅ Authenticated contact form for interested customers
- ✅ Tier validation (only Starter/Professional/Business can contact sales)
- ✅ Email delivery to support@codescribeai.com
- ✅ User-friendly modal UI with tier/billing period pre-filling
- ✅ 28 comprehensive tests (form validation, tier validation, email delivery)

**Backend Test Coverage Improvements** - ✅ Complete
- ✅ 24 new emailService tests (91.83% coverage achieved)
- ✅ Pattern 11 documentation: ES Modules in Backend Tests
- ✅ Fixed UsageWarningBanner timeout cleanup (prevent memory leaks)
- ✅ All CI thresholds met

#### Testing & Quality Metrics
- ✅ **1,786 total tests** (1,747 passing, 39 skipped, 0 failing) - **97.82% pass rate**
  - Frontend: 1,173 passed, 18 skipped (1,191 total)
  - Backend: 574 passed, 21 skipped (595 total)
- ✅ Backend coverage: 91.83% services, 95.81% overall

**Release:** v2.4.4 (November 2, 2025)

**Reference Documentation:**
- [CHANGELOG.md](../../../CHANGELOG.md) - Complete v2.4.4 release notes
- [TEST-PATTERNS-GUIDE.md](../../testing/TEST-PATTERNS-GUIDE.md) - Pattern 11: ES Modules

---

### 🎨 v2.4.5: Refined Light Theme v2.0 & UX Improvements (1 day - Nov 2, 2025)

**Timeline:** November 2, 2025
**Actual Duration:** 1 day
**Status:** ✅ **COMPLETE**

#### Completed Features

**Custom Monaco Editor Theme** - ✅ Complete
- ✅ Purple keywords, green strings, cyan numbers matching brand
- ✅ Custom Prism syntax highlighting for markdown code blocks
- ✅ Consistent theming across editor and documentation panels

**Mermaid Diagram Enhancements** - ✅ Complete
- ✅ Darkened borders for better visual hierarchy
- ✅ Improved node contrast and readability
- ✅ Better integration with light theme

**Pricing Page UX** - ✅ Complete
- ✅ Large display improvements (constrained cards, better spacing)
- ✅ Contact Sales Modal intent cleanup (sessionStorage cleanup on close)
- ✅ Fixed code block background artifacts

**Monaco Editor Rendering** - ✅ Complete
- ✅ Fixed background artifacts in code display
- ✅ Improved editor initialization and rendering

#### Testing & Quality Metrics
- ✅ **1,786 total tests** (1,747 passing, 39 skipped, 0 failing) - **97.82% pass rate**
  - Frontend: 1,173 passed, 18 skipped (1,191 total)
  - Backend: 574 passed, 21 skipped (595 total)

**Release:** v2.4.5 (November 2, 2025)

**Reference Documentation:**
- [CHANGELOG.md](../../../CHANGELOG.md) - Complete v2.4.5 release notes
- [THEME-DESIGN-SUMMARY.md](../../design/theming/THEME-DESIGN-SUMMARY.md) - Light theme specs

---

### 🔄 v2.4.6: Billing Period Persistence & Help Modal UX (1 day - Nov 2, 2025)

**Timeline:** November 2, 2025
**Actual Duration:** 1 day
**Status:** ✅ **COMPLETE**

#### Completed Features

**Help Modal Tabbed Interface** - ✅ Complete
- ✅ 3-tab organization: Quick Start, Quality Scores, FAQs
- ✅ FAQ accordion UI with smooth animations
- ✅ Refined light theme consistency (white backgrounds, slate borders)
- ✅ Improved content accessibility and discoverability

**Billing Period Persistence** - ✅ Complete
- ✅ Monthly/annual selection persists via sessionStorage
- ✅ Seamless user experience across page refreshes
- ✅ Consistent with subscription intent storage pattern

**Help Button UX Improvements** - ✅ Complete
- ✅ Desktop: Text "Help" button for better clarity
- ✅ Mobile: Removed redundant header icon (only in hamburger menu)
- ✅ Cleaner mobile navigation experience

**Contact Sales Character Limit** - ✅ Complete
- ✅ 750 character limit with live counter
- ✅ User-friendly validation messaging

**Stripe API Alignment** - ✅ Complete
- ✅ Updated 'yearly' to 'annual' for backend consistency
- ✅ Fixed 4 PricingPage test failures

**Viewport Optimization** - ✅ Complete
- ✅ Increased modal max-height by 60px for better content visibility

#### Files Changed (9 files)
- `client/src/components/Header.jsx`: Help button UX
- `client/src/components/HelpModal.jsx`: Tabbed interface
- `client/src/components/PricingPage.jsx`: Billing period persistence
- `client/src/components/ContactSalesModal.jsx`: Character counter
- `client/src/components/__tests__/PricingPage.test.jsx`: yearly → annual
- `client/src/constants/storage.js`: BILLING_PERIOD key
- `CHANGELOG.md`, `README.md`, `CLAUDE.md`: Updated test counts and version info
- `docs/testing/README.md`, `docs/testing/SKIPPED-TESTS.md`: Updated test metrics

#### Testing & Quality Metrics
- ✅ **1,785 total tests** (1,746 passing, 39 skipped, 0 failing) - **97.82% pass rate**
  - Frontend: 1,172 passed, 18 skipped (1,190 total)
  - Backend: 574 passed, 21 skipped (595 total)

#### Success Criteria - ✅ All Achieved
- ✅ Help Modal provides organized, accessible content
- ✅ Billing period selection persists across sessions
- ✅ Help button UX is clear on desktop, clean on mobile
- ✅ Stripe API terminology is consistent (annual)
- ✅ All tests passing (97.82% pass rate)

**Release:** v2.4.6 (November 2, 2025)

**Reference Documentation:**
- [CHANGELOG.md](../../../CHANGELOG.md) - Complete v2.4.6 release notes
- [STORAGE-CONVENTIONS.md](../../architecture/STORAGE-CONVENTIONS.md) - sessionStorage patterns

---

**Completed Phase 2 Epics:**
- Epic 2.1: Authentication & User Management (5 days) - ✅ **COMPLETE** (v2.0.0)
- Epic 2.2: Tier System & Feature Flags (3 days) - ✅ **COMPLETE** (v2.1.0-v2.2.0)
- Epic 2.3: UX Enhancements & File Upload (1 day) - ✅ **COMPLETE** (v2.3.0)
- Epic 2.4: Payment Integration & Test Infrastructure (3 days) - ✅ **COMPLETE** (v2.4.0-v2.4.2)

**Completed in Phase 2:**
- Epic 2.5: Legal Compliance - Phase 1-2 (2 days) - ✅ **COMPLETE** (v2.5.0)
- Epic 2.5: Legal Compliance - Phase 3 (1 day) - ✅ **COMPLETE** (v2.5.1)
- Epic 2.5: Legal Compliance - Phase 4 (2.5 days) - ✅ **COMPLETE** (v2.5.2)

**Next Steps for Phase 2:**
- Epic 2.6: UI Integration & Usage Dashboard (3 days) - ✅ **COMPLETE** (v2.6.0)
- Epic 2.7: Production Launch (Post-LLC) (1-2 days) - 📋 Planned (Jan 14+ 2026)
- Epic 2.8: Subscription Management UI (2-3 days) - 📋 Planned (Nov 8-20, 2025)
- Target completion: v2.8.0 releases

---

### 📊 MVP Success Metrics

**Development & Testing - ✅ ACHIEVED**
- ✅ **Features:** 14/14 P0 features complete (100%)
- ✅ **Testing:** 660+ tests (100% passing)
  - Frontend: 513+ tests (Vitest, 13/18 components)
  - Backend: 133+ tests (Jest, 95.81% statements, 88.72% branches)
  - E2E: 10 tests (Playwright, 5 browsers, 100% pass rate)
- ✅ **Coverage:** 72.2% frontend, 85%+ backend
- ✅ **Code Quality:** Zero critical bugs
- ✅ **Documentation:** 25+ comprehensive docs
- ✅ **15,000+ lines of code** (client + server + tests + docs)

**Performance - ✅ ACHIEVED**
- ✅ **Lighthouse Score:** 45 → 75 (+67% improvement)
- ✅ **Bundle Size:** -85% reduction (516KB → 78KB gzipped)
- ✅ **Core Web Vitals:**
  - FCP: 5.4s → 0.6s (-89%)
  - LCP: 13.9s → 1.0s (-93%)
  - TBT: 3,000ms → 2,100ms (-30%)

**Accessibility - ✅ ACHIEVED**
- ✅ **Overall Score:** 95/100 (A grade)
- ✅ **Lighthouse Accessibility:** 100/100
- ✅ **axe DevTools:** 0 violations ✅ **PERFECT SCORE!**
- ✅ **WCAG 2.1 AA:** Fully compliant
- ✅ **Cross-Browser:** 100% compatibility (5 browsers)

**Deployment - ✅ COMPLETE**
- ✅ **Production URL:** https://codescribeai.com
- ✅ **CI/CD:** Test-gated deployment via GitHub Actions
- ✅ **SSL & Custom Domain:** Configured
- ✅ **All features working in production**

---


> **Note:** Phases represent **strategic themes**, not individual features. Each phase contains multiple **epics** (feature sets) that work together toward a cohesive goal. See [PHASE-ORGANIZATION.md](../PHASE-ORGANIZATION.md) for best practices.

---

## 💰 Phase 2: Payments Infrastructure - ✅ COMPLETE

**Timeline:** October 21 - November 7, 2025
**Status:** ✅ **COMPLETE** - All epics shipped (v2.0.0-v2.6.0)
**Final Release:** v2.6.0 (Usage Dashboard Complete)
**Target Launch:** Mid-January 2026 (validation-driven, not calendar-driven)
**Strategic Goal:** Enable sustainable business model with Open Core + Generous Free Tier architecture

### 📅 Phase 2 Completed Timeline

**Foundation:**
- ✅ Oct 21-26: Epic 2.1 (Authentication & Database) - v2.0.0
- ✅ Oct 27-29: Epic 2.2 (Tier System & Feature Flags) - v2.1.0-v2.2.0
- ✅ Oct 29: Epic 2.3 (UX Enhancements) - v2.3.0
- ✅ Oct 30-Nov 2: Epic 2.4 (Payment Integration - Test Mode) - v2.4.0-v2.4.6
- ✅ Nov 3: Epic 2.5 Phase 1-2 (Legal Compliance Foundation) - v2.5.0
- ✅ Nov 4: Epic 2.5 Phase 3 (Account Settings UI) - v2.5.1
- ✅ Nov 4: Epic 2.5 Phase 4 (User Data Rights) - v2.5.2
- ✅ Nov 6: v2.5.3 (Email System Overhaul & Test Suite Coverage)
- ✅ Nov 7: Epic 2.6 (Usage Dashboard + Admin Tools + Bug Fixes) - v2.6.0

**Phase 2 Complete:** All payment infrastructure, authentication, legal compliance, and user management features shipped

**Validation & Marketing (Dec 2025 - Jan 2026):**
- 🎯 User acquisition and feedback collection
- 🎯 Test checkout conversions with Stripe test mode
- 🎯 User interviews and product iteration
- 🎯 Build to validation criteria (not calendar date)

**Launch Prep (Early January 2026):**
- 🏢 Jan 2-3: Form Georgia LLC (optimal timing for annual report)
- 🏢 Jan 3-5: Receive EIN from IRS
- 🏢 Jan 6-10: Open business bank account
- 🏢 Jan 11-13: Complete Stripe business verification

**Production Launch (Mid-January 2026):**
- 💰 Jan 14+: Epic 2.7 (Deploy live Stripe keys) - when validation criteria met
- 🚀 Launch when ready (likely Jan 15-20, 2026)

**Validation Criteria (Launch When These Hit):**
- ✅ 50+ active users (using app weekly)
- ✅ 10+ user interviews completed
- ✅ 20+ test checkout conversions (proves willingness to pay)
- ✅ 3+ positive testimonials/case studies
- ✅ Clear understanding of target customer

**Why This Approach:**
- ⚡ Build fast (no waiting for arbitrary dates)
- 🎯 Validate thoroughly (user-driven timeline)
- 🏢 LLC formed at optimal time (Jan 2 = 15 months before first GA annual report)
- 💰 Launch when confident (PMF first, revenue second)
- 📊 Authentic story ("Launched in X days" where X is what actually happened)

### 📦 Epics

#### Epic 2.1: Authentication & User Management (3-5 days) - ✅ **COMPLETE** (v2.0.0)
**Implementation:** Passport.js (decision documented in [AUTH-ANALYSIS.md](../AUTH-ANALYSIS.md))

- ✅ Email/password authentication with bcrypt hashing (`passport-local`)
- ✅ GitHub OAuth integration (`passport-github2`)
- ✅ JWT token-based sessions for web authentication
- ✅ Complete password reset flow with email verification
- ✅ Database setup (Neon Postgres via Vercel Marketplace)
- ✅ User schema (id, email, password_hash, github_id, github_username, reset_token_hash, reset_token_expires, tier, created_at, updated_at)
- ✅ Auth routes: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/github`, `/api/auth/github/callback`, `/api/auth/forgot-password`, `/api/auth/reset-password`
- ✅ Frontend auth context (React Context)
- ✅ Login and Signup modal UI
- ✅ Sign In button active in header
- ✅ Email service (Resend) with branded templates
- ✅ 100 tests fixed/added (1,347 total tests, 97.5% pass rate)

**Rationale:** Passport.js selected over Clerk to support CLI authentication (Phase 5) and self-hosted enterprise deployment (Phase 6). See [AUTH-ANALYSIS.md](../AUTH-ANALYSIS.md) for full comparison.

**Release:** v2.0.0 (October 26, 2025)
**Reference:** See "Phase 2: Payments Infrastructure (5 days - Oct 21-26)" section above for complete details.

#### Epic 2.2: Tier System & Feature Flags (3 days) - ✅ **COMPLETE**

**Release:** v2.1.0-v2.2.0 (October 27-29, 2025)
**Goal:** Enable volume-based monetization with generous free tier (Open Core model)

**Backend Implementation:**
- Protect generate endpoints with authentication (`requireAuth` middleware on `/api/generate` and `/api/generate-stream`)
- Include JWT bearer token in API requests from frontend (`Authorization: Bearer <token>`)
- Usage schema (user_id, daily_count, monthly_count, daily_reset_date, monthly_reset_date)
- Tier gate middleware integration (`checkUsage()` + `requireAuth` on generate routes)
- Usage tracking: `incrementUsage()` after successful generation
- Daily/monthly reset logic (cron job or on-demand check)

**Frontend Implementation (Completed in v2.2.0):**
- ✅ Usage warning banner (80% threshold with dynamic multipliers)
- ✅ Usage limit modal (100% threshold - blocks further usage)
- ✅ useUsageTracking hook for fetching usage data
- ✅ Error handling priority system (Usage Limit > API > Network > Validation)
- ✅ Upgrade prompts at 80% and 100% usage

**Frontend Implementation (Deferred to Epic 2.5):**
- ❌ Usage dashboard page/modal (proactive viewing)
- ❌ Display: "X/10 docs used this month" with progress bar
- ❌ Visual indicators (green → yellow → red)
- ❌ Show reset date ("Resets on March 1")
- ❌ Usage history chart

**Tier Structure (3 tiers for Phase 2):**
- **Free:** 10 docs/month, all 4 doc types, all features (adoption engine)
- **Starter:** 50 docs/month (5x Free), email support 48h
- **Pro:** 200 docs/month (20x Free), email support 24h

**What You're Actually Paying For:**
- ✅ **Volume:** Higher monthly limits (10 → 50 → 200)
- ✅ **Support:** Community → Email 48h → Email 24h
- ⚠️ **"Built-in API credits"** is a soft feature (marketing only - all tiers use server's API key)
- ⚠️ **"Priority queue"** is a soft feature (flag only - all tiers same speed in v2.1)

**NOT Implemented in Epic 2.2 (Deferred):**
- ❌ Batch processing (Phase 3 Epic 3.3)
- ❌ Custom templates (Phase 4 Epic 4.3)
- ❌ Team/Enterprise tiers (Phase 2 Epic 2.3/2.4 or later)

**Success Criteria (v2.2.0):**
- ✅ Backend tier system operational (Free, Starter, Pro tiers configured)
- ✅ Usage tracking with lazy reset mechanism (no cron jobs needed)
- ✅ Upgrade prompts appear at 80% (banner) and 100% (modal)
- ✅ useUsageTracking hook fetches and caches usage data
- ✅ Error priority system handles usage limits correctly
- ✅ All 1,489 tests pass (1,022 frontend, 431 backend, 36 skipped)
- ✅ 100+ new tests for tier system, usage tracking, and UI components

**Note:** Full usage dashboard UI (proactive viewing with progress bars, charts) deferred to Epic 2.5

**Note:** Infrastructure already exists: `server/src/config/tiers.js`, `server/src/middleware/tierGate.js`, `client/src/hooks/useFeature.js`, `server/src/middleware/requireAuth.js` - just needs database hookup and frontend UI

#### Epic 2.3: UX Enhancements & File Upload (1 day) - ✅ **COMPLETE**

**Release:** v2.3.0 (October 29, 2025)
**Goal:** Improve user experience with enhanced file upload and editor usability

**Features Implemented:**
- Drag-and-drop file upload with visual purple overlay
- Clear button for code editor (RefreshCw icon to reset code/filename/language)
- Dynamic filename display in Monaco editor header
- Mobile menu logout button for authenticated users
- Upgrade to Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- Page width expansion for better space utilization

**Testing:**
- 15 new tests added (6 drag-drop, 5 clear button, 3 logout, 1 multi-button fix)
- Total: 1,503 tests (1,467 passing, 36 skipped, 97.6% pass rate)

**Success Criteria:**
- ✅ Users can drag files directly onto Monaco editor
- ✅ Clear button resets editor to default state
- ✅ Uploaded filenames display dynamically
- ✅ Mobile menu shows logout for authenticated users
- ✅ All tests pass (1,467/1,503)

#### Epic 2.4: Payment Integration (2-3 days) - ✅ **COMPLETE** (v2.4.0)

**Release:** v2.4.0 (October 30, 2025)
**Goal:** Stripe payment integration for subscription management (Test Mode)

**Features Implemented:**
- ✅ Stripe SDK integration with test mode
- ✅ Subscription management (create via Checkout, cancel via webhooks)
- ✅ Webhook handling (6 events: checkout completed, subscription created/updated/deleted, invoice paid/failed)
- ✅ Pricing page UI (4 tiers with monthly/annual toggle)
- ✅ Test mode validation with Stripe CLI
- ✅ Database schema: subscriptions table, stripe_customer_id column
- ✅ Subscription model with 9 methods (create, find, update, cancel, etc.)

**Testing:**
- ✅ Manual E2E testing with Stripe test cards (4242 4242 4242 4242)
- ✅ Webhook events verified (all 6 events firing correctly)
- ✅ Subscription model: 16/16 tests passing
- ✅ Full payment flow working (test mode)

**Success Criteria:**
- ✅ Users can subscribe to paid tiers via Stripe Checkout
- ✅ Webhooks automatically update user tier in database
- ✅ Stripe CLI captures all webhook events
- ✅ No live payments accepted (test mode only)

**Note:** Upgrade/downgrade flows moved to Epic 2.8. Custom receipts/invoices moved to Epic 2.7.

#### Epic 2.5: Legal Compliance & User Rights (5.5 days total) - ✅ **COMPLETE**

**Releases:** v2.5.0-v2.5.3 (November 3-6, 2025)
**Priority:** CRITICAL (must complete before accepting payments)
**Goal:** GDPR/CCPA compliance + user data rights infrastructure
**Reference:** [EPIC-2.5-COMPLIANCE.md](./EPIC-2.5-COMPLIANCE.md) for full implementation spec

**Phase 1: UI Placeholders (1 day) - ✅ COMPLETE (v2.5.0)**
- ✅ Footer component with Terms/Privacy links (appears on all pages)
- ✅ Contact Support button in footer
- ✅ Responsive design with proper spacing

**Phase 2: Self-Hosted Policies (1 day) - ✅ COMPLETE (v2.5.0)**
- ✅ TermsOfService.jsx component with comprehensive content
- ✅ PrivacyPolicy.jsx component with GDPR compliance
- ✅ Routes: `/terms` and `/privacy`
- ✅ Version tracking system (2025-11-02 format)
- ✅ Back button navigation to previous page
- ✅ TermsAcceptanceModal with smart acceptance detection
- ✅ Version-based re-acceptance system (tracks terms_version_accepted, privacy_version_accepted)
- ✅ Backend legal routes (/api/legal/versions, /api/legal/status, /api/legal/accept)
- ✅ Database migration 010: 4 new columns + 4 indexes
- ✅ Contact Support Modal for legal questions and support inquiries
- ✅ Email service: sendSupportEmail() for contact support flow
- ✅ Full test coverage: 1,955 tests (1,283 frontend, 672 backend, 97.8% pass rate)
- ✅ +134 new tests across 9 new test files

**Phase 3: Account Settings UI (1 day) - ✅ COMPLETE (v2.5.1 - Nov 4, 2025)**
- ✅ Settings page with 4 tabs: Account | Privacy | Subscription | Danger Zone
- ✅ AccountTab: Profile display, email/password change forms with validation
- ✅ PrivacyTab: Analytics opt-out toggle (stored in database preferences)
- ✅ SubscriptionTab: Usage stats, billing info, Stripe Customer Portal integration
- ✅ DangerZoneTab: Account deletion with confirmation modal
- ✅ AnalyticsWrapper: Conditional Vercel Analytics loading based on user preference
- ✅ Backend API: 5 new endpoints (profile, email, password, preferences)
- ✅ Database migration 011: analytics_enabled column + index
- ✅ Cache Control: Strict headers on user-specific endpoints (no 304 responses)
- ✅ Attribution Footer: CodeScribe AI branding on all generated documentation
- ✅ Mobile-responsive layout with proper tab keyboard navigation
- ✅ Settings integration tests: 26 new tests
- ✅ SETTINGS-UX-PATTERNS.md documentation
- ✅ 2,015 tests (1,283 frontend, 732 backend, 98.91% pass rate)
- ✅ +60 tests (26 settings, 10 migration-011, 24 emailService improvements)

**Phase 4: User Data Rights (2.5 days) - ✅ COMPLETE (v2.5.2 - Nov 4, 2025)**
- ✅ Permanent deletion cron job (2:00 AM UTC / 9:00 PM EST daily)
- ✅ Cron endpoint: POST /api/cron/permanent-deletions with Bearer token auth
- ✅ Tombstone deletion pattern (preserves user_id/stripe_customer_id, NULLs PII)
- ✅ Automatic account restoration via email/password signup
- ✅ GitHub OAuth account restoration (2 scenarios: pre-existing GitHub link, new GitHub link)
- ✅ Email notifications: sendAccountDeletionEmail, sendAccountRestoredEmail
- ✅ Data retention: 7-year financial records, aggregate-then-delete usage analytics
- ✅ GDPR/CCPA compliance: Article 17 + Article 17(3)(b) + Article 5
- ✅ Database migration 012: soft delete columns (deletion_scheduled_at, deleted_at, deletion_reason)
- ✅ Database migration 013: subscription retention (prevents CASCADE deletion)
- ✅ Database migration 014: usage analytics aggregation table
- ✅ Vercel Cron Jobs configuration in vercel.json
- ✅ Settings ESC handler fix (checks for open modals before navigating)
- ✅ 96+ tests (64 deletion/restoration, 32 cron/migrations)
- ✅ 2,225 tests (1,370 frontend, 855 backend, 100% pass rate)
- ✅ USER-DELETION-COMPLIANCE.md (1,500+ lines, industry research)

**v2.5.3: Email System Overhaul & Test Suite Coverage (Nov 6, 2025) - ✅ COMPLETE**
- ✅ Email Templating System: 7 branded templates (password reset, verification, support, sales, welcome, deletion, restoration)
- ✅ Base email template architecture with responsive design and CodeScribe AI branding
- ✅ Support Request Attachments: File upload support (5 files max, 10MB each, 7 allowed types)
- ✅ Email Priority Filtering: X-Priority headers (Enterprise=1, Team=2, Pro=3, Free=4, System=5)
- ✅ ContactSupportModal redesign with drag-and-drop attachment UI
- ✅ Backend Test Coverage: Fixed 45 contact route tests (Pattern 11: ES Modules mocking)
- ✅ Backend Test Coverage: Added 19 emailService tests (79.41% branches, exceeded 79% threshold)
- ✅ Frontend Test Coverage: Fixed 37 modal tests (ContactSalesModal 25/25, ContactSupportModal 12/12)
- ✅ Documentation: 5 new guides (EMAIL-TEMPLATING-GUIDE.md, EMAIL-PRIORITY-FILTERING.md, COMMUNITY-SUPPORT-STRATEGY.md, EMAIL-CONFIGURATION.md, SECURITY-GIT-SECRETS.md)
- ✅ Test Pattern 11: ES Modules mocking documented in TEST-PATTERNS-GUIDE.md
- ✅ 2,250 tests (1,373 frontend, 877 backend, 100% pass rate)
- ✅ CI/CD: All GitHub Actions checks passing, zero test failures

**Database Migrations (Complete):**
```sql
-- ✅ Migration 010: Implemented in v2.5.0
ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN terms_version_accepted VARCHAR(20);
ALTER TABLE users ADD COLUMN privacy_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN privacy_version_accepted VARCHAR(20);

-- ✅ Migration 011: Implemented in v2.5.1
ALTER TABLE users ADD COLUMN analytics_enabled BOOLEAN DEFAULT true;

-- ✅ Migration 012: Implemented in v2.5.2
ALTER TABLE users ADD COLUMN deletion_scheduled_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN deletion_reason VARCHAR(500);

-- ✅ Migration 013: Implemented in v2.5.2 (subscription retention)
-- ✅ Migration 014: Implemented in v2.5.2 (usage analytics aggregation)
```

#### Epic 2.6: UI Integration & Usage Dashboard (3 days) - ✅ **COMPLETE** (v2.6.0)

**Timeline:** November 5-7, 2025
**Status:** ✅ **100% COMPLETE**

**Usage Dashboard UI:**
- ✅ Modern usage dashboard page with daily/monthly tracking
- ✅ Visual progress bars with color-coded status (Normal/High Usage/At Limit)
- ✅ Reset countdown timers with absolute dates
- ✅ Tier upgrade prompts with dynamic multipliers
- ✅ Refresh button with loading states
- ✅ Quick action cards (Pricing, Settings, Documentation)
- ✅ Responsive layout (desktop grid, mobile stacked)

**Admin Dashboard:**
- ✅ Admin-only usage analytics page (/admin/usage)
- ✅ Global metrics (total users, generations, active subscriptions)
- ✅ Tier distribution breakdown
- ✅ Recent activity table with user details
- ✅ Export to CSV functionality
- ✅ Role-based access control (admin email whitelist)

**Bug Fixes:**
- ✅ Authentication fix: Added credentials: 'include' for session cookies
- ✅ SQL period matching: Changed from range (<=) to exact match (=)
- ✅ Migration fix: Added GREATEST() for last_reset_date preservation
- ✅ UI improvements: RefreshCw icon, banner repositioning, compact tier badge

**Testing:**
- ✅ 2,238 tests passing (1,381 frontend, 857 backend)
- ✅ 22 new/updated tests (useUsageTracking, Usage model, UsageDashboard, LegalPages)
- ✅ 100% pass rate (41 intentionally skipped)

**Reference:** [CHANGELOG.md v2.6.0](../../CHANGELOG.md)

#### Epic 2.7: Production Launch (1-2 days) - 📋 **PLANNED (Post-LLC)**

**Priority:** CRITICAL (deploy after LLC formation + Stripe business verification)
**Timeline:** January 14+, 2026 (when validation criteria met)
**Goal:** Switch from test mode to live payments

**Stripe Production Deployment:**
- Replace test API keys with live keys (publishable + secret)
- Update webhook endpoints to production URLs
- Verify Stripe business account (requires LLC EIN + bank account)
- Test live checkout flow with real payment method
- Monitor first live transactions

**Custom Branded Communications:**
- Custom email receipt templates (override Stripe defaults)
- Invoice PDF customization with CodeScribe AI branding
- Email templates: Subscription created, payment succeeded, payment failed, subscription canceled
- Integration with Resend for email delivery

**Receipt/Invoice Storage:**
- Store Stripe receipt URLs only (no PII in database)
- Display Stripe-hosted receipts via API links
- Users access receipts via Stripe Customer Portal

**Success Criteria:**
- ✅ Live Stripe keys deployed and working
- ✅ First real payment processed successfully
- ✅ Custom branded emails sent for all events
- ✅ Users can access receipts via Customer Portal
- ✅ No test mode data in production

**Database Changes:**
```sql
ALTER TABLE subscriptions ADD COLUMN stripe_receipt_url VARCHAR(500);
```

**Note:** This epic deploys AFTER Georgia LLC formation (Jan 2-3) and Stripe business verification (Jan 11-13).

#### Epic 2.8: Subscription Management UI (2-3 days) - 📋 **PLANNED**

**Priority:** MEDIUM (enhances paid user experience)
**Timeline:** November 23-29, 2025
**Goal:** Self-service subscription management UI (upgrade, downgrade, cancel)

**Customer Portal Integration:**
- Stripe Customer Portal for payment method updates
- Link from Account Settings → "Manage Subscription" button
- Portal handles: Update card, view invoices, download receipts
- Automatic redirect back to app after portal actions

**Upgrade/Downgrade Flows:**
- Upgrade from Free → Starter/Pro/Team (via Pricing page)
- Downgrade from Pro → Starter or Free (self-service)
- Plan change UI with preview: "New plan starts at next billing cycle"
- No proration handling (keep it simple)
- Clear messaging: "Change takes effect on [next billing date]"

**Cancellation Flow:**
- Cancel button in Account Settings → Subscription tab
- Confirmation modal: "Your subscription will end on [date]. You'll retain access until then."
- Soft cancel: Tier remains active until period_end
- Post-cancellation: Downgrade to Free tier automatically
- Email notification: "Your subscription has been canceled"

**UI Components:**
- SubscriptionCard component (current plan, billing date, usage)
- PlanChangeModal (preview new plan, confirm change)
- CancellationModal (confirm cancel, show end date)
- UpgradePrompt (contextual nudges at usage limits)

**Backend:**
- Update existing Subscription model methods (already has cancel)
- Add: upgradePlan(), downgradePlan() methods
- Webhook handling for plan changes (subscription.updated)

**Success Criteria:**
- ✅ Users can upgrade/downgrade via UI
- ✅ Stripe Customer Portal accessible from settings
- ✅ Cancellations take effect at next billing cycle (no proration)
- ✅ All plan changes logged and reflected in database
- ✅ Email notifications sent for all subscription changes

**Philosophy:** Keep it simple - no proration, changes at next billing cycle, self-service for common actions.

### Tier Structure (Feature Flags Ready)

**Source of Truth:** [MONETIZATION-STRATEGY.md](../../../private/strategic-planning/MONETIZATION-STRATEGY.md) lines 486-492, 654-686

**Free Tier ($0/mo - Adoption Engine):**
- ✅ **10 docs/month** (enough to be portfolio-worthy, not enough for regular use)
- ✅ **All 4 documentation types** (README, JSDoc, API, ARCHITECTURE)
- ✅ **All core features:** Real-time streaming, quality scoring (0-100), Monaco editor, Mermaid diagrams, markdown export
- ✅ **Self-hosting option:** Clone repo and use own API key for unlimited docs
- ❌ Built-in API credits (soft feature - all tiers use server API key)
- ❌ Priority queue (soft feature - flag only)
- 💬 **Support:** Community (GitHub Discussions, Discord)
- 💡 **Philosophy:** Showcase full feature set, drive adoption via generosity, natural upgrade at volume limits

**Starter Tier ($12/mo - Convenience):**
- ✅ **50 docs/month** (5x Free tier)
- ✅ **All Free tier features** (4 doc types, streaming, quality scoring, Monaco, Mermaid)
- ✅ **Built-in API credits** (marketing feature - no setup needed, but uses same server API key)
- ✅ **Priority queue** (flag only in v2.1 - same speed, future enhancement)
- 💬 **Support:** Email support (48-hour response)
- 💡 **Philosophy:** "My time is worth more than $12. Just charge me." Convenience over API key setup.

**Pro Tier ($29/mo - Power Users):**
- ✅ **200 docs/month** (20x Free tier, 4x Starter)
- ✅ **All Starter tier features**
- ✅ **Batch processing** (up to 10 files at once) - *Deferred to Phase 3 Epic 3.3*
- ✅ **Custom templates** (save/reuse templates) - *Deferred to Phase 4 Epic 4.3*
- ✅ **Export formats** (markdown, HTML, PDF) - *Deferred to Phase 4 Epic 4.3*
- 💬 **Support:** Email support (24-hour response)
- 💡 **Philosophy:** "Cost = 1 hour of my time, saves 10+ hours/month"

**Team Tier ($99/mo - Collaboration):**
- ✅ 1,000 docs/month shared across 10 users
- ✅ Team workspace, shared templates
- ✅ Usage analytics dashboard
- ✅ Role-based access (admin, member, viewer)
- ✅ Slack + GitHub + CI/CD integrations
- ✅ Priority email support (24hr business hours)

**Enterprise Tier (Custom - Compliance + Control):**
- ✅ Unlimited docs, unlimited users
- ✅ SSO/SAML, audit logs, custom model fine-tuning
- ✅ Dedicated infrastructure, custom integrations
- ✅ White-label branding, on-premise deployment
- ✅ 99.9% SLA, dedicated Slack channel, account manager

### Strategic Rationale

**Why Open Core + Generous Free Tier?**
1. ✅ Free tier is portfolio-worthy (drives adoption)
2. ✅ Showcases full feature set (interview strength)
3. ✅ Feature flags demonstrate enterprise architecture
4. ✅ Volume limits create natural upgrade paths
5. ✅ Compounds over time (SEO, stars, testimonials)

**Conversion Psychology:**
- **Volume:** Hit 10-doc limit → Starter ($12 feels cheap for 50 docs)
- **Convenience:** Avoid API key setup → Starter (20 min vs. 30 sec)
- **Power User:** Need 200 docs/month → Pro ($29 for advanced features)
- **Collaboration:** Team needs workspace → Team ($99 solves chaos)
- **Professional:** Company context → Enterprise (compliance ready)

**Proven Model (GitLab, Supabase, Ghost):**
- Generous free tier → 30M users → <1% paying → $150M ARR (GitLab)
- 5-tier structure: Free → Starter → Pro → Team → Enterprise
- Year 1: ~$31-39K MRR (750-1,250 paid users at 3-5% conversion)
- Year 3: ~$78K MRR (2,500 paid users) due to viral growth and SEO dominance

### Success Criteria
- [ ] Feature flag architecture integrated into existing codebase
- [ ] Users can sign up with email/password or GitHub OAuth
- [ ] Free tier tracked accurately (10 generations/month)
- [ ] Usage dashboard functional
- [ ] Stripe subscription flow working end-to-end
- [ ] All 660+ tests passing (including new auth/tier tests)
- [ ] Documentation updated (API docs, user guide, privacy policy)
- [ ] Deployed to production with monitoring

### Privacy & Security Notes
- **Database trade-off:** Moves from "privacy-first, no storage" to user accounts
  - Document this change in README and privacy policy
  - Emphasize: "We only store email, usage stats, and subscription info - never your code"
- **GDPR compliance:** Data export, account deletion
- **Security:** bcrypt password hashing, rate limiting on auth endpoints, HTTPS-only cookies, CSRF protection

**Reference Documentation:**
- [AUTH-ANALYSIS.md](../AUTH-ANALYSIS.md) - Authentication solution analysis and Passport.js decision
- [private/MONETIZATION-MODEL.md](../../../private/MONETIZATION-MODEL.md) - Complete monetization strategy
- [server/src/config/tiers.js](../../server/src/config/tiers.js) - Tier configuration
- [server/src/middleware/tierGate.js](../../server/src/middleware/tierGate.js) - Authorization middleware
- [client/src/hooks/useFeature.js](../../client/src/hooks/useFeature.js) - Frontend feature gating

---

## 🎨 Phase 3: UX Enhancements (IN PROGRESS)

**Timeline:** November 8 - TBD
**Status:** 🔄 **IN PROGRESS** - Epic 3.1 Complete (v2.7.3), Epic 3.3 Active
**Current Release:** v2.7.3 (UX Polish & Terminology Consistency)
**Target Release:** v3.x.x series
**Strategic Goal:** Transform user experience with customization, flexibility, and advanced file handling capabilities

### 📅 Phase 3 Timeline

**Completed:**
- ✅ Nov 8: Epic 3.1 (Dark Mode Complete) - v2.7.0
- ✅ Nov 9: v2.7.1 (ErrorBoundary Dark Mode & Production Bug Fix)
- ✅ Nov 11: v2.7.2 (Mobile UX Fixes & Appearance Settings Tab)
- ✅ Nov 11: v2.7.3 (UX Polish & Terminology Consistency)

**In Progress:**
- 🟡 Nov 8+: Epic 3.3 (Advanced File Handling) - IN PROGRESS

**Planned:**
- 📋 Epic 3.2 (Layout & Workspace Flexibility)

### 📦 Epics

#### Epic 3.1: Theme Refinements & Dark Mode (2 days) - ✅ COMPLETE
**Status:** ✅ Complete | Released November 8, 2025 (v2.7.0)
**Test Results:** 2,343 passed | 43 skipped (2,386 total) - 100% CI pass rate

**Completed Features:**
- ✅ Theme System: ThemeContext with React Context API for global theme state
- ✅ ThemeToggle component with smooth Sun/Moon icon transitions
- ✅ Theme persistence via localStorage (codescribeai:settings:theme)
- ✅ System preference detection via window.matchMedia('(prefers-color-scheme: dark)')
- ✅ Auto-sync with system theme changes when no manual preference set
- ✅ Defensive error handling for browser APIs (localStorage, matchMedia)
- ✅ Comprehensive Tailwind dark: variants across all 13 components
- ✅ Custom Monaco Editor dark theme (Neon Cyberpunk): purple keywords, green strings, cyan numbers
- ✅ Custom Prism syntax highlighting matching Monaco theme
- ✅ Mermaid diagram dark theme with enhanced borders and hierarchy
- ✅ 106 new dark mode tests (100% passing)
- ✅ 3 critical test infrastructure fixes (ContactSupportModal, DocPanel, UsageLimitModal)
- ✅ ThemeContext error handling with try/catch for localStorage and matchMedia

**Test Results:**
- Frontend: 1,486 passed | 22 skipped (1,508 total) - 98.5% pass rate
- Backend: 857 passed | 21 skipped (878 total) - 100% pass rate
- Total: 2,343 passed | 43 skipped (2,386 total) - **100% CI pass rate**

**Documentation:**
- [DARK-MODE-SPEC.md](../DARK-MODE-SPEC.md) - Implementation guide
- [CHANGELOG.md v2.7.0](../../CHANGELOG.md) - Complete release notes

#### v2.7.1: ErrorBoundary Dark Mode & Production Bug Fix (1 day) - ✅ COMPLETE
**Status:** ✅ Complete | Released November 9, 2025 (v2.7.1)
**Type:** Bug Fix Release

**Fixed:**
- ✅ ErrorBoundary Dark Mode: Theme detection from localStorage and system preferences
- ✅ Manual dark class application to document.documentElement (ErrorBoundary wraps ThemeProvider)
- ✅ Full dark mode styling with dark: variants for all colors
- ✅ Improved error message readability: dark:bg-red-950/30 dark:text-red-200
- ✅ Better contrast for stack traces: dark:bg-slate-800/50
- ✅ Icon border in dark mode: border-2 border-transparent dark:border-red-800/50
- ✅ Horizontal scrolling for long stack traces (removed CSS Grid interference)
- ✅ Modal width increased from max-w-2xl to max-w-4xl
- ✅ Production bug: Fixed missing AlertCircle icon import in AdminUsage.jsx

**Added:**
- ✅ /test-error manual testing route for ErrorBoundary verification
- ✅ ErrorTest.jsx component to intentionally trigger errors
- ✅ Route documented in main.jsx with inline comments
- ✅ Manual Testing Route section in ERROR-HANDLING-TESTS.md

**Test Results:**
- Frontend: 1,486 passed | 22 skipped (1,508 total) - 98.5% pass rate
- Backend: 857 passed | 21 skipped (878 total) - 100% pass rate
- Total: 2,343 passed | 43 skipped (2,386 total) - **100% pass rate**

**Documentation:**
- [CHANGELOG.md v2.7.1](../../CHANGELOG.md) - Complete release notes
- [ERROR-HANDLING-TESTS.md](../../testing/ERROR-HANDLING-TESTS.md) - Manual testing route documentation

#### v2.7.2: Mobile UX Fixes & Appearance Settings Tab (1 day) - ✅ COMPLETE
**Status:** ✅ Complete | Released November 11, 2025 (v2.7.2)
**Type:** Mobile UX & Theme Enhancement Release

**Fixed:**
- ✅ Mobile File Upload: Enhanced error logging with explicit URL construction (API_URL)
- ✅ Mobile File Upload: Improved diagnostic information for connection failures
- ✅ Mobile File Upload: Better error messages showing attempted URLs
- ✅ Mobile Code Editor: Changed from fixed h-[600px] to responsive min-h-[600px] h-[70vh]
- ✅ Mobile Code Editor: Prevents collapse when browser hides address bar
- ✅ Mobile Code Editor: Adapts to different mobile screen sizes and orientations

**Added:**
- ✅ Appearance Settings Tab: New dedicated tab in Settings (2nd position)
- ✅ Light/Dark/Auto Theme Options: Card-based UI with Sun/Moon/Monitor icons
- ✅ Auto Theme Mode: Follows system preferences via matchMedia API
- ✅ System Preference Detection: Auto-refresh when system preferences change

**Changed:**
- ✅ Theme System: ThemeContext now supports 'auto', 'light', 'dark' modes
- ✅ Default Theme: Changed from 'light' to 'auto' (system preference)
- ✅ Theme Controls: Removed from desktop Header and mobile menu
- ✅ Theme Controls: Centralized in Settings → Appearance tab
- ✅ UX Pattern: Follows industry standards (Discord, GitHub, Slack)

**Test Suite:**
- ✅ Fixed 7 ThemeContext tests for 'auto' default behavior
- ✅ Skipped 3 Header ThemeToggle integration tests (feature moved to Settings)
- ✅ Added comprehensive TODO comments explaining skipped tests
- ✅ Maintained 100% pass rate on non-skipped tests

**Test Results:**
- Frontend: 1,479 passed | 29 skipped (1,508 total) - 98.1% pass rate
- Backend: 860 passed | 21 skipped (881 total) - 100% pass rate
- Total: 2,339 passed | 50 skipped (2,389 total) - **97.9% pass rate**

**Documentation:**
- [CHANGELOG.md v2.7.2](../../CHANGELOG.md) - Complete release notes
- [SKIPPED-TESTS.md](../../testing/SKIPPED-TESTS.md) - Updated with Header ThemeToggle category

#### v2.7.3: UX Polish & Terminology Consistency (0.5 days) - ✅ COMPLETE
**Status:** ✅ Complete | Released November 11, 2025 (v2.7.3)
**Type:** UX Polish Release

**Fixed:**
- ✅ Toast Notification: Added prevGeneratingRef to track previous isGenerating state
- ✅ Toast Notification: Only shows when generation actually completes (not on page load)
- ✅ Toast Notification: Prevents false 'documentation ready' notifications from localStorage data
- ✅ Dark Mode Skeleton: Added dark:bg-slate-700 to skeleton bars
- ✅ Dark Mode Skeleton: Added dark:bg-purple-900/30 to purple glow
- ✅ Dark Mode Skeleton: Added dark:text-slate-200 and dark:text-slate-400 to status text
- ✅ Dark Mode Skeleton: 'Generating documentation...' text now readable in dark mode
- ✅ DocPanel Spacing: Reduced padding from py-4 to py-3
- ✅ DocPanel Spacing: Added [&>*:first-child]:mt-0 to remove first child top margin
- ✅ DocPanel Spacing: Documentation content now aligns with code panel

**Changed:**
- ✅ Button Terminology: Changed 'Download' to 'Export' across all download buttons
- ✅ Button Terminology: Shorter terminology better fits mobile UI constraints
- ✅ Button Terminology: Updated DownloadButton, CodePanel, DocPanel components
- ✅ Examples → Samples: Changed 'Examples' to 'Samples' for more accurate representation
- ✅ Examples → Samples: Updated button labels, modal title, placeholder text
- ✅ Examples → Samples: Modal now says 'Code Samples', 'Select a code sample to preview', 'Load Sample'
- ✅ Examples → Samples: Updated CodePanel, ExamplesModal, App.jsx toast notifications
- ✅ User Display: Added getDisplayName() function in Header component
- ✅ User Display: Shows first name only (industry standard: Gmail, Slack, Discord, GitHub)
- ✅ User Display: Fallback to email username when first/last name not provided

**Added:**
- ✅ Test Helper: New loadSkeleton() console function for manual QA testing
- ✅ Test Helper: Toggles skeleton UI without triggering API calls
- ✅ Test Helper: Added testSkeletonMode state for isolated testing
- ✅ Test Helper: Exposed to window object for easy browser console access

**Test Suite:**
- ✅ Fixed 22 tests for terminology changes
- ✅ CodePanel.test.jsx: Updated 'examples' → 'samples'
- ✅ ExamplesModal.test.jsx: Multiple pattern replacements
- ✅ DownloadButton.test.jsx: Updated 'Download' → 'Export'
- ✅ DocPanel.test.jsx: Updated 'Download doc' → 'Export doc'
- ✅ Maintained 100% pass rate on non-skipped tests

**Test Results:**
- Frontend: 1,478 passed | 29 skipped (1,507 total) - 98.1% pass rate
- Backend: 857 passed | 21 skipped (878 total) - 100% pass rate
- Total: 2,335 passed | 50 skipped (2,385 total) - **97.9% pass rate**

**Documentation:**
- [CHANGELOG.md v2.7.3](../../CHANGELOG.md) - Complete release notes
- [README.md](../../README.md) - Updated test counts and metrics
- [CLAUDE.md](../../CLAUDE.md) - Updated version entry
- [Testing README](../../testing/README.md) - Updated test statistics

#### Epic 3.3: Advanced File Handling (2-3 days) - 🟡 IN PROGRESS
**Status:** 🟡 In Progress | Started November 8, 2025
**Priority:** Infrastructure First - Required before Epic 4.1 and Epic 4.2

**Planned Features:**
- Multi-file upload support (select multiple files at once)
- Batch processing (up to 10 files at once)
- File preview before generation
- File history and version tracking (30 days)
- Progress indicators for batch operations
- Error handling per file (don't fail entire batch)
- Note: Basic drag-and-drop implemented in Phase 2 Epic 2.4

#### Epic 3.2: Layout & Workspace Flexibility (2-3 days) - 📋 PLANNED
**Status:** 📋 Planned | Natural follow-up to Epic 4.2 for improved workspace UX

**Planned Features:**
- Full-width layout option (remove `max-width` constraints)
- Resizable panels with draggable divider (`react-resizable-panels`)
- Panel constraints (30% min, 70% max for each panel)
- Panel size persistence (localStorage)
- "Reset to Default" button (50/50 split)
- Keyboard accessibility (arrow keys to resize)
- Layout presets (50/50, 70/30, 30/70)
- Mobile responsive (panels stack vertically, no resizing)

### Technical Highlights

**Theming Approach (Finalized):**
- Tailwind class-based dark mode (`darkMode: 'class'` in config)
- `dark` class on `<html>` element toggles theme
- React Context (ThemeProvider) for state management
- All components use Tailwind `dark:` variants (e.g., `bg-white dark:bg-slate-900`)
- No CSS variables needed - Tailwind handles everything
- Shadow system: `shadow-lg shadow-purple-600/20` (light) vs `shadow-lg shadow-purple-400/30` (dark)

**Layout System:**
- `react-resizable-panels` for draggable panels
- localStorage for persistence with validation
- Constraint system prevents unusable layouts
- Keyboard navigation for accessibility

**File Handling:**
- Browser File API for drag-and-drop
- Progress indicators using Server-Sent Events (SSE)
- Per-file error boundaries for batch resilience

### Success Criteria

**Epic 3.1 (Complete):**
- ✅ All features work seamlessly across light and dark themes
- ✅ Theme preference persists and respects system settings
- ✅ WCAG AAA compliance maintained (7:1 contrast)
- ✅ All 1,486 frontend tests pass for both themes
- ✅ Mobile responsive behavior unchanged
- ✅ 100% CI pass rate (2,343/2,386 tests passing)

**Epic 3.3 (In Progress):**
- [ ] Multi-file upload handles 10+ files without errors
- [ ] File preview UI works across all file types
- [ ] Batch processing maintains UI responsiveness
- [ ] Error handling per file prevents batch failure
- [ ] File history tracks versions for 30 days

**Epic 3.2 (Planned):**
- [ ] Panels resize smoothly with no layout shift
- [ ] E2E tests cover panel resizing
- [ ] Keyboard accessibility for panel controls

**Reference Documentation:**
- [DARK-MODE-SPEC.md](../DARK-MODE-SPEC.md) - Dark mode implementation details

---

## 📄 Phase 4: Documentation Capabilities (PLANNED)

**Timeline:** TBD (after Phase 3)
**Estimated Duration:** 2-3 weeks
**Status:** 📋 **NOT STARTED**
**Target Release:** v4.0.0
**Strategic Goal:** Expand documentation generation capabilities with new doc types and advanced features

### 📦 Epics

#### Epic 4.1: OpenAPI/Swagger Generation (3-4 days)
- New doc type: "OPENAPI" or "SWAGGER"
- AI-powered generation from code
- Output in YAML format (OpenAPI 3.0 specification)
- Quality scoring with 5 criteria (0-100 scale)
- Parse code for API routes/endpoints (Express, Flask, FastAPI, etc.)
- Swagger-specific quality scoring algorithm

**Quality Scoring Criteria:**
1. API overview and metadata (20 points)
2. Endpoint documentation completeness (25 points)
3. Schema definitions (20 points)
4. Examples and request/response samples (20 points)
5. Security and authentication docs (15 points)

#### Epic 4.2: Multi-File Project Documentation (4-5 days)
- Accept multiple files or directory structures (.zip upload)
- Analyze project-wide architecture
- Generate comprehensive README for entire project
- Cross-reference between files
- Identify project patterns (MVC, microservices, monorepo, etc.)
- Project-level quality scoring

**Quality Scoring Criteria (Project-Level):**
1. Project overview and purpose (20 points)
2. Architecture and structure (25 points)
3. Setup and installation (15 points)
4. Usage examples and workflows (20 points)
5. Documentation completeness (20 points)

#### Epic 4.3: Custom Templates & Export Formats (2-3 days)
- Custom documentation templates (user-defined)
- Template library (community templates)
- Export formats: markdown, HTML, PDF
- Template variables and placeholders
- Template preview and validation

### Success Criteria
- [ ] OpenAPI generation produces valid OpenAPI 3.0 YAML
- [ ] Quality scores provide actionable feedback for all doc types
- [ ] Multi-file upload analyzes project structure accurately
- [ ] Generated project docs include cross-references
- [ ] Custom templates work with all doc types
- [ ] PDF export maintains formatting and readability
- [ ] All doc types work with quality scoring system

---

## 💻 Phase 5: Developer Tools (PLANNED)

**Timeline:** TBD (after Phase 4)
**Estimated Duration:** 3-4 weeks
**Status:** 📋 **NOT STARTED**
**Target Release:** v5.0.0
**Strategic Goal:** Bring CodeScribe AI to developers' local workflows with CLI and VS Code extension

### 📦 Epics

#### Epic 5.1: CLI Tool (5-7 days)
- Command-line interface using Commander.js
- File path support (single file or directory)
- Batch processing (multiple files)
- Output to file or stdout
- Configuration file support (`.codescriberc`)
- Glob patterns for file selection
- Progress indicators for batch operations
- Cross-platform support (Windows, macOS, Linux)
- npm package publication

**Example Commands:**
```bash
# Generate README for single file
codescribe generate README src/index.js

# Generate docs for all files in directory
codescribe generate JSDoc src/**/*.js --output docs/

# Use configuration file
codescribe generate --config .codescriberc
```

#### Epic 5.2: VS Code Extension (7-10 days)
- Right-click "Generate Documentation" context menu
- Inline documentation preview (WebView)
- Automatic file updates (create/overwrite docs)
- Quality score in status bar
- Suggestions in problems panel
- Extension settings (API key, doc type preferences)
- VS Code Marketplace publication
- Keyboard shortcuts (e.g., Cmd+Shift+D)

**Features:**
- Integration with VS Code's existing documentation systems
- Support for all doc types (README, JSDoc, API, ARCHITECTURE, OPENAPI, PROJECT)
- Theme support (respects VS Code theme)
- Offline mode (using cached API responses)

### Technical Approach
- **Shared Service Layer:** Reuse existing `docGenerator`, `codeParser`, `qualityScorer` services
- **CLI Framework:** Commander.js for command parsing
- **VS Code API:** Extension API for editor integration, WebView API for previews
- **Cross-Platform:** Node.js for universal compatibility

### Success Criteria
- [ ] CLI published to npm registry
- [ ] CLI works on Windows, macOS, and Linux
- [ ] VS Code extension published to Marketplace
- [ ] Extension has 4+ star average rating
- [ ] All doc types supported in both CLI and extension
- [ ] CLI documentation complete with examples
- [ ] Extension documentation includes video walkthrough
- [ ] Both tools integrate seamlessly with existing workflows

---

## 🏢 Phase 6: Enterprise Readiness (FUTURE)

**Timeline:** TBD (after Phase 5)
**Estimated Duration:** 3-4 weeks
**Status:** 💡 **TO BE EVALUATED**
**Target Release:** v6.0.0
**Strategic Goal:** Enable enterprise adoption with compliance, security, and scalability features
**Priority:** P2 (Evaluate based on demand)

### 📦 Epics

#### Epic 6.1: SSO & Advanced Authentication (5-7 days)
- SAML 2.0 integration
- OAuth 2.0 provider support (Okta, Auth0, Azure AD)
- Just-In-Time (JIT) user provisioning
- Role-based access control (RBAC) enhancement
- Multi-factor authentication (MFA)

#### Epic 6.2: Audit Logs & Compliance (3-4 days)
- Comprehensive audit logging (all user actions)
- Log export (CSV, JSON formats)
- GDPR compliance tools (data export, right to be forgotten)
- SOC 2 Type II preparation
- Retention policies and data lifecycle management

#### Epic 6.3: On-Premise Deployment (7-10 days)
- Docker containerization
- Kubernetes deployment manifests
- Self-hosted deployment guide
- Air-gapped environment support
- License key validation system
- Automatic updates (opt-in)

### Success Criteria
- [ ] SAML integration works with major providers (Okta, Auth0, Azure AD)
- [ ] All user actions logged with timestamp and context
- [ ] GDPR data export completes in < 5 minutes for typical user
- [ ] On-premise deployment documented with video walkthrough
- [ ] Docker images published to Docker Hub
- [ ] Kubernetes deployment tested on AWS EKS, Google GKE, Azure AKS

### Note on Optional Enhancements / Backlog

**This section tracks optional enhancements and backlog items** that don't fit into the current strategic phases (2-6).

Features are tracked here when they:
- Don't align with current phase themes
- Are speculative or exploratory
- Require user feedback to validate demand
- May become their own phase in the future

**Potential Future Features (Backlog):**

**Security & Compliance Enhancements (Post-v2.5.0):**
- **Audit Logging System** (v2.6.0 or later)
  - Separate audit table for legal acceptance events
  - Log IP address + user agent for compliance
  - Immutable audit trail (append-only)
  - Estimated: 2-3 days
- **Legal Acceptance Email Confirmations** (Optional UX enhancement)
  - Send confirmation email after T&Cs acceptance
  - Example: "You accepted Terms v2025-11-02 on Nov 2, 2025"
  - Builds trust, provides user records
  - Estimated: 1 day
- **Terms Change Notification Emails** (Optional UX enhancement)
  - Send email notification when Terms/Privacy Policy change
  - Example: "We've updated our Terms of Service (v2025-12-01)"
  - Include summary of changes and deadline to re-accept
  - Industry standard: GitHub, Stripe, Vercel all do this
  - Estimated: 1-2 days
- **Compliance Admin Dashboard** (Enterprise feature)
  - View acceptance rates by version
  - Track users needing re-acceptance
  - Compliance reporting (GDPR, SOC 2)
  - Estimated: 3-4 days

**Product Features:**
- Calendly integration for Enterprise/Team sales
- Gmail "Send As" setup for sales@codescribeai.com replies
- Documentation history and saved projects
- GitHub repository integration (auto-detect repo, generate docs)
- Multi-language support (i18n for UI)
- Advanced Mermaid diagram generation (auto-generate from code)
- Changelog generation from git history
- Team collaboration features (share, comment, review)
- Advanced analytics and monitoring

**Status:** These will be evaluated after Phases 2-6 based on user feedback and demand. Items may be promoted to epics within existing phases or become new strategic phases if they gain traction.

---

## 🎉 Project Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| Oct 11, 2025 | Project kickoff | ✅ Complete |
| Oct 12, 2025 | Backend & API integration | ✅ Complete |
| Oct 13, 2025 | Core features & UI | ✅ Complete |
| Oct 14, 2025 | Animations & polish | ✅ Complete |
| Oct 15, 2025 | Examples & testing | ✅ Complete |
| Oct 16, 2025 | **MVP Development Complete** | ✅ Complete |
| Oct 16-17, 2025 | **Phase 1.5: Critical Accessibility** (Days 6-7) | ✅ Complete |
| Oct 17, 2025 | **Phase 1.5: ARIA & Semantics** (Day 8) | ✅ 90% Complete |
| Oct 18, 2025 | **Phase 1.5: axe DevTools Scan - 0 Violations!** | ✅ Complete |
| Oct 18, 2025 | **Production Ready - Zero Accessibility Violations** | ✅ Complete |
| Oct 17-19, 2025 | **Vercel Deployment & CI/CD Setup** | ✅ Complete |
| Oct 19, 2025 | **Production Launch** (codescribeai.com) | ✅ Complete |
| Oct 21, 2025 | **Documentation Update** (ARCHITECTURE.md v1.2, ROADMAP.md v1.4) | ✅ Complete |
| Oct 23, 2025 | **Monetization Planning** (Feature flags, tier architecture) | ✅ Complete |
| Oct 21-26, 2025 | **Phase 2 (Epic 2.1): Authentication & Database** (v2.0.0) | ✅ Complete |
| Oct 26, 2025 | **Backend Test Coverage & CI Fixes** (100 tests fixed/added) | ✅ Complete |
| Oct 27-29, 2025 | **Phase 2 (Epic 2.2): Tier System & Feature Flags** (v2.1.0-v2.2.0) | ✅ Complete |
| Oct 29, 2025 | **Phase 2 (Epic 2.3): UX Enhancements & File Upload** (v2.3.0) | ✅ Complete |
| TBD | Manual accessibility validation (optional) | ⏸️ Recommended |
| TBD | **Phase 2 (Epic 2.4): Payment Integration** (Stripe) | 📋 Planned |
| TBD | **Phase 2 (Epic 2.5): UI Integration** (UX polish) | 📋 Planned |
| TBD | **Phase 3: UX Enhancements** (v3.0.0) | 📋 Planned |
| TBD | **Phase 4: Documentation Capabilities** (v4.0.0) | 📋 Planned |
| TBD | **Phase 5: Developer Tools** (v5.0.0) | 📋 Planned |
| TBD | **Phase 6: Enterprise Readiness** (v6.0.0) | 💡 Future (Evaluate based on demand) |

---

## 🚨 Risks & Mitigation

### Deployment Risks

**Risk: Deployment Issues**
- **Impact:** Medium
- **Probability:** Low
- **Mitigation:** Test build locally first, Vercel has excellent docs, have Netlify as backup hosting

**Risk: Production Performance**
- **Impact:** Medium
- **Probability:** Low
- **Mitigation:** Already optimized (-85% bundle), lazy loading implemented, production build tested locally

**Risk: Environment Variable Issues**
- **Impact:** Medium
- **Probability:** Low
- **Mitigation:** Document all variables, test in Vercel preview environment before production

**Risk: Claude API Rate Limits**
- **Impact:** High
- **Probability:** Medium
- **Mitigation:** Implement request queuing, show clear limits to users, monitor usage closely

### Future Risks (Phases 2-3)

**Risk: Scope Creep**
- **Impact:** High
- **Probability:** High
- **Mitigation:** Strict adherence to planned features only, defer all enhancements to Phase 4

**Risk: Maintenance Burden**
- **Impact:** Medium
- **Probability:** Medium
- **Mitigation:** Comprehensive testing (660+ tests), documentation (25+ files), modular architecture

---

## 📚 Documentation References

### Planning & Requirements
- [PRD](01-PRD.md) - Product requirements and features
- [Epics & Stories](02-Epics-Stories.md) - User stories and acceptance criteria
- [Todo List](03-Todo-List.md) - Day-by-day task breakdown (COMPLETE)
- [Dev Guide](05-Dev-Guide.md) - Implementation patterns and code examples

### Architecture & Performance
- [Architecture Diagram](../architecture/ARCHITECTURE-OVERVIEW.md) - System architecture visual
- [Architecture Deep Dive](../architecture/ARCHITECTURE.md) - Technical details
- [Optimization Guide](../performance/OPTIMIZATION-GUIDE.md) - Performance improvements

### Testing & Quality
- [Testing README](../testing/README.md) - Testing documentation hub
- [Component Test Coverage](../testing/COMPONENT-TEST-COVERAGE.md) - Detailed coverage report
- [Accessibility Audit](../testing/ACCESSIBILITY-AUDIT.MD) - WCAG 2.1 AA results
- [Cross-Browser Test Plan](../testing/CROSS-BROWSER-TEST-PLAN.md) - Browser compatibility
- [Screen Reader Testing Guide](../testing/SCREEN-READER-TESTING-GUIDE.md) - Accessibility testing

### Deployment & Launch
- [MVP Deploy & Launch](../mvp/MVP-DEPLOY-LAUNCH.md) - Complete deployment guide
- [Roadmap](ROADMAP.md) - This document

---

## 🗺️ Updating the Interactive Roadmap

The project includes an interactive HTML roadmap ([ROADMAP-TIMELINE.html](ROADMAP-TIMELINE.html)) that visualizes the project timeline with embedded data. This section explains how to update it.

### Data Source

The roadmap data is stored in [roadmap-data.json](roadmap-data.json) and includes:
- Column structure (Done, Now, Next, Later)
- Phase details (versions, titles, features, durations)
- Metadata (title, links, footer text)
- Color scheme options (purple, indigo, slate, default)

### Update Workflow

**Prerequisites:** Have the HTML file open in a browser (locally via file:// or live-server)

1. **Edit the data source:**
   ```bash
   # Edit the JSON file with your changes
   vim docs/planning/roadmap/roadmap-data.json
   ```

2. **Load data into HTML:**
   - Open [ROADMAP-TIMELINE.html](ROADMAP-TIMELINE.html) in browser
   - Press **Shift+L** - Loads fresh data from roadmap-data.json
   - Verify changes appear correctly in the UI

3. **Save with embedded data:**
   - Press **Shift+S** - Downloads updated HTML with embedded data
   - File downloads to `~/Downloads/ROADMAP-TIMELINE.html`

4. **Copy back to project with automatic backup:**
   ```bash
   # Automated script (recommended)
   npm run roadmap:update

   # This script automatically:
   # 1. Backs up current HTML and JSON to private/roadmap-archives/
   # 2. Copies the latest downloaded HTML to project directory
   ```

   **Manual alternative (not recommended):**
   ```bash
   cp ~/Downloads/ROADMAP-TIMELINE.html docs/planning/roadmap/ROADMAP-TIMELINE.html
   # Note: This skips the automatic backup step
   ```

5. **Verify the update:**
   - **Hard refresh:** **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux)
   - Browser cache must be bypassed to load new embedded data
   - If using live-server, it may also need a restart

### Keyboard Shortcuts

When viewing [ROADMAP-TIMELINE.html](ROADMAP-TIMELINE.html) in browser:
- **T** - Toggle between full timeline view (4 columns) and planned-only view (3 columns)
- **Shift+L** - Load data from external roadmap-data.json file
- **Shift+S** - Save HTML with current embedded data (downloads file)

### Troubleshooting

**Issue: Changes don't appear after reloading HTML**
- **Cause:** Browser caching the old HTML file
- **Solution:** Hard refresh with **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux)
- **Alternative:** Clear browser cache or open in incognito/private window

**Issue: "Failed to fetch roadmap-data.json"**
- **Cause:** HTML file not in same directory as JSON file
- **Solution:** Either:
  - Open HTML from project directory (where JSON exists)
  - Use embedded data (don't press Shift+L, just rely on embedded data)

**Issue: Downloaded file named "ROADMAP-TIMELINE (2).html"**
- **Cause:** Browser auto-numbering duplicate downloads
- **Solution:** `npm run roadmap:update` always uses the most recent file

### Backup System

The update script automatically creates timestamped backups before making changes:

**Backup Location:** `private/roadmap-archives/`
- Directories are created automatically if they don't exist
- Safe to run on fresh clones or new machines

**Backup Format:**
- `ROADMAP-TIMELINE YYYYMMDD:HH:MM:SS.html` - Previous HTML state
- `roadmap-data YYYYMMDD:HH:MM:SS.json` - Previous JSON state

**Example:**
- `ROADMAP-TIMELINE 20251023:07:39:57.html`
- `roadmap-data 20251023:07:39:57.json`

**Benefits:**
- Safely revert to any previous version
- Track roadmap evolution over time
- Compare changes between versions
- No data loss if update goes wrong
- Zero manual setup required

### How It Works

1. **Embedded Data:** The HTML file contains a JavaScript object `ROADMAP_DATA` with all roadmap information
2. **Initial Render:** On page load, the HTML renders using its embedded data
3. **External Load:** Shift+L fetches roadmap-data.json and updates both the display and the embedded data in memory
4. **Save Operation:** Shift+S captures the entire HTML including the updated embedded data and downloads it
5. **Backup & Update:** Script backs up current files, then copies new HTML to project directory
6. **Standalone:** The HTML file works independently without the JSON file (uses embedded data)

### Files

- **[roadmap-data.json](roadmap-data.json)** - Source of truth for roadmap data
- **[ROADMAP-TIMELINE.html](ROADMAP-TIMELINE.html)** - Interactive visualization with embedded data
- **[../scripts/update-roadmap.sh](../../scripts/update-roadmap.sh)** - Automated update script with backup
- **`private/roadmap-archives/`** - Timestamped backups of HTML and JSON files

---

**Document Version:** 2.1
**Timeline Version:** 3.1 (Phase 2 Epic 2.1 complete, Epics 2.2-2.4 planned)
**Created:** October 17, 2025
**Last Updated:** October 27, 2025
**Status:** Phase 2 In Progress - v2.0.0 Released (Authentication & Database)
**Next Review:** Before Phase 2 Epic 2.2 (Tier System & Feature Flags) implementation

**Major Changes in v2.1:**
- Updated Phase 2 status to reflect v2.0.0 completion (Epic 2.1: Authentication & Database)
- Added comprehensive Phase 2 completion section with all features, metrics, and documentation
- Updated milestones table with v2.0.0 release and test suite improvements
- Clarified remaining Phase 2 epics (2.2-2.4) as planned for v2.1.0-v2.3.0 releases
- Updated current status: Phase 2 In Progress (1 of 4 epics complete)

**Major Changes in v2.0:**
- Reorganized 8 feature-driven phases into 5 strategic phase themes
- Each phase now contains 2-4 epics (shippable feature sets)
- Phases represent strategic goals (2-3 weeks), not individual features
- See [PHASE-ORGANIZATION.md](../PHASE-ORGANIZATION.md) for methodology

---

## 📌 Versioning Strategy

**Internal Planning (Phases):** Sequential phase numbers (Phase 2, 3, 4, 5, 6, 7, 8)
- Used for project planning, roadmaps, and internal communication
- Phases can be flexible and evolve as needed

**Public Releases (SemVer):** Semantic versioning (v2.0.0, v3.0.0, v4.0.0, etc.)
- Used for GitHub releases, npm packages, changelogs, and user-facing documentation
- Allows for maintenance releases (v2.0.1, v2.1.1) between phases
- MAJOR.MINOR.PATCH format:
  - **MAJOR** (v1 → v2): Breaking changes or major user-facing transformations (UX/UI overhaul, auth/database, CLI, extension)
  - **MINOR** (v2.0 → v2.1): New features within major version (dark mode, layout, new doc types)
  - **PATCH** (v2.0.0 → v2.0.1): Bug fixes, maintenance, no new features

**Mapping:**
- Phase 1 (MVP) → v1.0.0 (Initial production release)
- Phase 2 (Payments Infrastructure) → v2.0.0 (MAJOR: Authentication, database, breaking architectural change)
- Phase 3 (UX Enhancements) → v3.0.0 (MAJOR: Complete UX transformation - theming, layout, file handling)
  - Epic 3.1 (Theming) could ship as v3.1.0 (MINOR)
  - Epic 3.2 (Layout) could ship as v3.2.0 (MINOR)
- Phase 4 (Documentation Capabilities) → v4.0.0 (MAJOR: New doc generation capabilities)
  - Epic 4.1 (OpenAPI) could ship as v4.1.0 (MINOR)
  - Epic 4.2 (Multi-file) could ship as v4.2.0 (MINOR)
- Phase 5 (Developer Tools) → v5.0.0 (MAJOR: CLI + VS Code extension, new product surfaces)
- Phase 6 (Enterprise Readiness) → v6.0.0 (MAJOR: Enterprise features, compliance, on-premise)

This hybrid approach allows flexible planning while maintaining industry-standard versioning for releases.
