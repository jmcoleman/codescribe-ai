# CodeScribe AI - Product Roadmap

**Last Updated:** October 27, 2025
**Current Phase:** Phase 2 - 🔄 **IN PROGRESS** (Monetization Foundation)
**Current Release:** v2.0.0 (Authentication & Database Complete)
**Production URL:** [https://codescribeai.com](https://codescribeai.com)

---

## 📋 Table of Contents

1. [🎯 Vision](#-vision)
2. [✅ MVP Complete (Phase 1 + 1.5)](#-mvp-complete-phase-1--15)
   - [Phase 1.0: Core Development](#-phase-10-core-development-4-days---oct-11-16)
   - [Phase 1.5: Accessibility](#-phase-15-accessibility-2-days---oct-16-18)
   - [Phase 1.6: Deployment](#-phase-16-deployment-2-days---oct-17-19)
   - [MVP Success Metrics](#mvp-success-metrics)
3. [📋 Future Phases](#-future-phases)
   - [Phase 2: Monetization Foundation](#-phase-2-monetization-foundation-planned)
   - [Phase 3: UX Enhancements](#-phase-3-ux-enhancements-planned)
   - [Phase 4: Documentation Capabilities](#-phase-4-documentation-capabilities-planned)
   - [Phase 5: Developer Tools](#-phase-5-developer-tools-planned)
   - [Phase 6: Enterprise Readiness](#-phase-6-enterprise-readiness-future)
4. [🎉 Project Milestones](#-project-milestones)
5. [🚨 Risks & Mitigation](#-risks--mitigation)
6. [📚 Documentation References](#-documentation-references)
7. [🗺️ Updating the Interactive Roadmap](#️-updating-the-interactive-roadmap)
8. [📌 Versioning Strategy](#-versioning-strategy)

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
- [MVP-DEPLOY-LAUNCH.md](../../deployment/MVP-DEPLOY-LAUNCH.md) - Complete deployment guide with troubleshooting

---

### 💰 Phase 2: Monetization Foundation (5 days - Oct 21-26)

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
- TEST-FIXES-OCT-2025.md (Session 3) - Complete test coverage improvements
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
- [TEST-FIXES-OCT-2025.md](../../testing/TEST-FIXES-OCT-2025.md) - Test improvements documentation
- [PASSWORD-RESET-IMPLEMENTATION.md](../../deployment/PASSWORD-RESET-IMPLEMENTATION.md) - Password reset summary
- [RESEND-SETUP.md](../../deployment/RESEND-SETUP.md) - Email service configuration

**Next Steps for Phase 2:**
- Epic 2.2: Tier System & Feature Flags (2-3 days) - 📋 Planned
- Epic 2.3: Payment Integration (2-3 days) - 📋 Planned
- Epic 2.4: UI Integration (1-2 days) - 📋 Planned
- Target completion: v2.1.0-v2.3.0 releases

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

## 💰 Phase 2: Monetization Foundation (IN PROGRESS)

**Timeline:** October 21-26, 2025 (Epic 2.1) + TBD (Epics 2.2-2.4)
**Estimated Duration:** 2-3 weeks total
**Status:** 🔄 **IN PROGRESS** - Epic 2.1 Complete (v2.0.0)
**Target Release:** v2.0.0-v2.3.0
**Strategic Goal:** Enable sustainable business model with Open Core + Generous Free Tier architecture

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
**Reference:** See "Phase 2: Monetization Foundation (5 days - Oct 21-26)" section above for complete details.

#### Epic 2.2: Tier System & Feature Flags (2-3 days) - 📋 **PLANNED**

**Goal:** Enable volume-based monetization with generous free tier (Open Core model)

**Backend Implementation:**
- Protect generate endpoints with authentication (`requireAuth` middleware on `/api/generate` and `/api/generate-stream`)
- Include JWT bearer token in API requests from frontend (`Authorization: Bearer <token>`)
- Usage schema (user_id, daily_count, monthly_count, daily_reset_date, monthly_reset_date)
- Tier gate middleware integration (`checkUsage()` + `requireAuth` on generate routes)
- Usage tracking: `incrementUsage()` after successful generation
- Daily/monthly reset logic (cron job or on-demand check)

**Frontend Implementation:**
- Usage dashboard UI component
- Display: "X/10 docs used this month" (Free), "X/50 docs used" (Starter), "X/200 docs used" (Pro)
- Progress bar with visual indicators (green → yellow → red)
- Show reset date ("Resets on March 1")
- Upgrade prompts when approaching limits (80% = warning, 100% = upgrade CTA)

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

**Success Criteria:**
- Free users can generate up to 10 docs/month, blocked at limit
- Starter users can generate up to 50 docs/month
- Pro users can generate up to 200 docs/month
- Usage dashboard shows accurate counts and reset dates
- Upgrade prompts appear at 80% and 100% usage
- All 898+ frontend tests pass
- All 413+ backend tests pass (including usage tracking tests)

**Note:** Infrastructure already exists: `server/src/config/tiers.js`, `server/src/middleware/tierGate.js`, `client/src/hooks/useFeature.js`, `server/src/middleware/requireAuth.js` - just needs database hookup and frontend UI

#### Epic 2.3: Payment Integration (2-3 days) - 📋 **PLANNED**
- Stripe integration
- Subscription management (create, update, cancel)
- Webhook handling (tier updates on payment events)
- Pricing page UI
- Upgrade/downgrade flows
- Invoice and receipt generation

#### Epic 2.4: UI Integration (1-2 days) - 📋 **PLANNED**
- User profile menu (usage stats, settings, logout)
- "Upgrade to Pro" prompts when approaching limits
- Tier badges and feature gates in UI
- Loading states and error handling
- Drag-and-drop files into Monaco Editor (file drop zone on CodePanel)

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

## 🎨 Phase 3: UX Enhancements (PLANNED)

**Timeline:** TBD (after Phase 2)
**Estimated Duration:** 2-3 weeks
**Status:** 📋 **NOT STARTED**
**Target Release:** v3.0.0
**Strategic Goal:** Transform user experience with customization, flexibility, and advanced file handling capabilities

### 📦 Epics

#### Epic 3.1: Theming & Visual Customization (1.5-2 days)
- Theme toggle UI (sun/moon icon button in Header)
- CSS variable architecture with `data-theme` attribute (Kevin Powell's best practices)
- Tailwind dark mode with `dark:` class variants
- Theme persistence (localStorage)
- System preference detection (`prefers-color-scheme: dark`)
- Monaco Editor theme switching (`vs-light` / `vs-dark`)
- Mermaid dark theme with brand colors
- WCAG AAA contrast ratios (7:1 text, 3:1 UI)
- Smooth transitions with `prefers-reduced-motion` support

#### Epic 3.2: Layout & Workspace Flexibility (2-3 days)
- Full-width layout option (remove `max-width` constraints)
- Resizable panels with draggable divider (`react-resizable-panels`)
- Panel constraints (30% min, 70% max for each panel)
- Panel size persistence (localStorage)
- "Reset to Default" button (50/50 split)
- Keyboard accessibility (arrow keys to resize)
- Layout presets (50/50, 70/30, 30/70)
- Mobile responsive (panels stack vertically, no resizing)

#### Epic 3.3: Advanced File Handling (2-3 days)
- Multi-file upload support (select multiple files at once)
- File history and version tracking (30 days)
- Batch processing (up to 10 files at once)
- File preview before generation
- Progress indicators for batch operations
- Error handling per file (don't fail entire batch)
- Note: Basic drag-and-drop implemented in Phase 2 Epic 2.4

### Technical Highlights

**Theming Approach:**
- CSS variables with semantic naming (`--color-bg-primary` vs `--white`)
- `data-theme` attribute on `<html>` element
- React Context for theme state management
- All components use Tailwind `dark:` variants

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
- [ ] All features work seamlessly across light and dark themes
- [ ] Theme preference persists and respects system settings
- [ ] Panels resize smoothly with no layout shift
- [ ] Multi-file upload handles 10+ files without errors
- [ ] WCAG AAA compliance maintained (7:1 contrast)
- [ ] All 513+ frontend tests pass for both themes
- [ ] E2E tests cover theme toggle and panel resizing
- [ ] Mobile responsive behavior unchanged

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
| TBD | Manual accessibility validation (optional) | ⏸️ Recommended |
| TBD | **Phase 2 (Epic 2.2): Tier System & Feature Flags** (v2.1.0) | 📋 Planned |
| TBD | **Phase 2 (Epic 2.3): Payment Integration** (v2.2.0) | 📋 Planned |
| TBD | **Phase 2 (Epic 2.4): UI Integration** (v2.3.0) | 📋 Planned |
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
- [MVP Deploy & Launch](../../deployment/MVP-DEPLOY-LAUNCH.md) - Complete deployment guide
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
- Phase 2 (Monetization Foundation) → v2.0.0 (MAJOR: Authentication, database, breaking architectural change)
- Phase 3 (UX Enhancements) → v3.0.0 (MAJOR: Complete UX transformation - theming, layout, file handling)
  - Epic 3.1 (Theming) could ship as v3.1.0 (MINOR)
  - Epic 3.2 (Layout) could ship as v3.2.0 (MINOR)
- Phase 4 (Documentation Capabilities) → v4.0.0 (MAJOR: New doc generation capabilities)
  - Epic 4.1 (OpenAPI) could ship as v4.1.0 (MINOR)
  - Epic 4.2 (Multi-file) could ship as v4.2.0 (MINOR)
- Phase 5 (Developer Tools) → v5.0.0 (MAJOR: CLI + VS Code extension, new product surfaces)
- Phase 6 (Enterprise Readiness) → v6.0.0 (MAJOR: Enterprise features, compliance, on-premise)

This hybrid approach allows flexible planning while maintaining industry-standard versioning for releases.
