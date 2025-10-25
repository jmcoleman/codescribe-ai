## 🔧 CODESCRIBE AI TODO LIST

**Status:** 📋 **ACTIVE** (Post-Production Enhancements)
**Current Phase:** Phase 1 ✅ Complete | Phase 2 🚧 In Progress (Epic 2.1 Complete)
**Last Updated:** October 25, 2025

> **📌 Navigation Tip:**
> - **In VS Code:** Use `Cmd+Shift+O` (Mac) or `Ctrl+Shift+O` (Windows/Linux) to see all headings and jump to sections
> - **On GitHub:** The Table of Contents links below are clickable and will jump to each section
> - **Outline View:** Open the Outline panel in VS Code sidebar for a hierarchical document view

---

## 📑 Table of Contents

**Quick Navigation:**
- [✅ Phase 1: MVP Complete (PRODUCTION)](#-phase-1-mvp-complete-production)
  - [v1.2.2 - Maintenance Release](#v122---maintenance-release)
  - [v1.2.1 - Bug Fixes](#v121---bug-fixes)
- [📋 Phase 2: Monetization Foundation (v2.0.0)](#-phase-2-monetization-foundation-v200)
  - [Epic 2.1: Authentication & User Management](#epic-21-authentication--user-management)
  - [Epic 2.2: Tier System & Feature Flags](#epic-22-tier-system--feature-flags)
  - [Epic 2.3: Payment Integration](#epic-23-payment-integration)
  - [Epic 2.4: UI Integration](#epic-24-ui-integration)
- [📋 Phase 3: UX Enhancements (v3.0.0)](#-phase-3-ux-enhancements-v300)
  - [Epic 3.1: Theming & Visual Customization](#epic-31-theming--visual-customization)
  - [Epic 3.2: Layout & Workspace Flexibility](#epic-32-layout--workspace-flexibility)
  - [Epic 3.3: Advanced File Handling](#epic-33-advanced-file-handling)
- [📋 Phase 4: Documentation Capabilities (v4.0.0)](#-phase-4-documentation-capabilities-v400)
  - [Epic 4.1: OpenAPI/Swagger Generation](#epic-41-openapiswagger-generation)
  - [Epic 4.2: Multi-File Project Documentation](#epic-42-multi-file-project-documentation)
  - [Epic 4.3: Custom Templates & Export Formats](#epic-43-custom-templates--export-formats)
- [📋 Phase 5: Developer Tools (v5.0.0)](#-phase-5-developer-tools-v500)
- [📋 Phase 6: Enterprise Readiness (v6.0.0)](#-phase-6-enterprise-readiness-v600)
- [Phase Summary](#-phase-summary)
- [Backlog (Unscheduled)](#-backlog-unscheduled)

---

## ✅ Phase 1: MVP Complete (PRODUCTION)

**Status:** ✅ **100% COMPLETE** - Deployed to Production
**Production URL:** [https://codescribeai.com](https://codescribeai.com)
**Duration:** 8 days (October 11-19, 2025)

### v1.2.2 - Maintenance Release

**Completed:** October 22, 2025
**Status:** ✅ **DEPLOYED**
**Goal:** Mobile compatibility fixes, UX polish, and feature flag management

#### Completed Items (16/16)

1. ✅ Copy Button - Non-Secure Context Fallback
2. ✅ Download Button - UX Simplification (removed checkmark)
3. ✅ Download Button Tests - Cleanup
4. ✅ Copy Button Tests - Secure Context Coverage
5. ✅ Quality Score Tests - Cleanup
6. ✅ Examples Modal - Mobile Accessibility
7. ✅ Header - Focus Indicator Improvements
8. ✅ Mobile Menu - Accessibility & UX
9. ✅ DocPanel - Minor Refinements
10. ✅ App.jsx - Integration Updates
11. ✅ Server - Error Handling
12. ✅ Frontend Testing Guide - Test Patterns
13. ✅ Cross-Browser Test Plan - Mobile File Upload
14. ✅ GitHub Import Button - Feature Flag
15. ✅ Roadmap - Documentation
16. ✅ Roadmap Data - JSON Update

**Key Achievements:**
- 660+ tests passing (100% pass rate)
- Mobile clipboard fallback for HTTP contexts
- Enhanced accessibility (focus indicators, touch targets)
- Feature flags for non-functional features
- Comprehensive mobile testing documentation

---

### v1.2.1 - Bug Fixes

**Completed:** Included in v1.2.2 release
**Status:** ✅ **DEPLOYED**
**Goal:** Critical UI fixes for footer alignment, download button UX, and sign-in button

#### Completed Items (3/3)

1. ✅ DocPanel Footer Alignment - Fixed pixel-perfect alignment with CodePanel
2. ✅ Download Button Checkmark - Removed inappropriate success animation
3. ✅ Hide Sign In Button - Hidden until authentication implemented (Phase 2)

---

## 📋 Phase 2: Monetization Foundation (v2.0.0)

**Timeline:** TBD (after Phase 1)
**Estimated Duration:** 2-3 weeks
**Status:** 📋 **PLANNING COMPLETE** - Implementation Files Ready
**Target Release:** v2.0.0
**Strategic Goal:** Enable sustainable business model with Open Core + Generous Free Tier architecture

**Key Decision:** Authentication will use **Passport.js** (not Clerk) to support CLI tools (Phase 5) and self-hosted enterprise deployment (Phase 6). See [AUTH-ANALYSIS.md](AUTH-ANALYSIS.md) for detailed rationale.

**Reference:** See [ROADMAP.md Phase 2](roadmap/ROADMAP.md#-phase-2-monetization-foundation-planned) for complete details


### 🚩 Feature Flag Status

All authentication features are currently **DISABLED** via feature flags:
- **Backend:** `ENABLE_AUTH=false` in `server/.env.example`
- **Frontend:** `VITE_ENABLE_AUTH=false` in `client/.env.example`

This allows the codebase to include auth implementation without requiring database or OAuth credentials.

**To enable auth features:** Set both flags to `true` and configure:
- Database: `POSTGRES_URL` and related Vercel Postgres variables
- Auth: `JWT_SECRET`, `SESSION_SECRET`
- OAuth (optional): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
---

### Epic 2.1: Authentication & User Management

**Estimated Duration:** 3-5 days
**Status:** ✅ **COMPLETE** (October 24, 2025)
**Implementation:** Passport.js (see [AUTH-ANALYSIS.md](AUTH-ANALYSIS.md) for rationale)

#### Tasks

- [x] **Backend Setup**
  - [x] Install Passport.js dependencies (passport, passport-local, passport-github2, passport-jwt, bcrypt, jsonwebtoken, express-session, connect-pg-simple)
  - [x] Create User model/schema (id, email, password_hash, github_id, tier, created_at)
  - [x] Set up PostgreSQL database connection (Vercel Postgres or local)
  - [x] Create Passport strategies configuration (`server/src/config/passport.js`)
  - [x] Implement password hashing (bcrypt)

- [x] **Auth Routes**
  - [x] POST `/api/auth/signup` - User registration (Passport local strategy)
  - [x] POST `/api/auth/login` - User login (Passport local strategy)
  - [x] POST `/api/auth/logout` - User logout
  - [x] POST `/api/auth/forgot-password` - Password reset request
  - [x] POST `/api/auth/reset-password` - Password reset confirmation
  - [x] GET `/api/auth/me` - Get current user
  - [x] GET `/api/auth/github` - GitHub OAuth initiation (Passport GitHub strategy)
  - [x] GET `/api/auth/github/callback` - GitHub OAuth callback

- [x] **GitHub OAuth**
  - [x] Set up GitHub OAuth app in GitHub Developer Settings
  - [x] Configure `passport-github2` strategy with client ID/secret
  - [x] Implement OAuth callback handler
  - [x] Link GitHub accounts to existing users (find or create user)
  - [x] Handle OAuth errors and edge cases

- [x] **Frontend Components**
  - [x] Create AuthContext (React Context or Zustand)
  - [x] Create Login modal
  - [x] Create Signup modal
  - [x] Create ForgotPassword modal
  - [x] Add auth state management
  - [x] Unhide Sign In button in Header (ENABLE_AUTH = true)

- [x] **Testing**
  - [x] Unit tests for auth routes
  - [x] Integration tests for auth flow
  - [x] E2E tests for login/signup/logout
  - [x] Security testing (SQL injection, XSS, CSRF)

#### Success Criteria

- [x] Users can sign up with email/password ✅ **Tested and working**
- [x] Users can log in with email/password ✅ **Tested and working**
- [x] Users can log in with GitHub OAuth ✅ **Tested and working**
- [x] Password reset flow works end-to-end ✅ **Complete with email service (October 25, 2025)**
- [x] JWT tokens expire correctly ✅ **7-day expiration configured**
- [x] Auth state persists across page refreshes ✅ **localStorage + AuthContext**
- [x] All auth tests passing ✅ **190+ tests including comprehensive form validation suite**

#### Additional Completions (October 24-25, 2025)

- [x] ✅ React Router integration for OAuth callback
- [x] ✅ AuthCallback component implemented
- [x] ✅ Fixed logout endpoint for JWT-only auth (no Passport errors)
- [x] ✅ UI updates correctly after login/logout
- [x] ✅ Email verification database schema added
- [x] ✅ Resend email service selected and cost analysis complete
- [x] ✅ Comprehensive auth documentation added (5 docs)
- [x] ✅ Neon database cost analysis (Appendix B)
- [x] ✅ Resend email cost analysis (Appendix C)
- [x] ✅ **Password reset implementation (complete end-to-end)**
  - [x] Database migrations (reset_token_hash, reset_token_expires fields)
  - [x] User model reset token methods (setResetToken, findByResetToken, updatePassword, clearResetToken)
  - [x] Email service with Resend SDK (sendPasswordResetEmail, sendVerificationEmail)
  - [x] Branded HTML email templates (purple/indigo gradient, mobile-responsive)
  - [x] API endpoints (POST /api/auth/forgot-password, POST /api/auth/reset-password)
  - [x] ResetPassword component with show/hide password toggles
  - [x] Token security (SHA-256 hashing, 1-hour expiration, single-use)
  - [x] 28 backend tests (auth-password-reset.test.js)
  - [x] 15 email service tests (emailService.test.js)
  - [x] 20 E2E test scenarios (password-reset.spec.js, password-reset-core.spec.js)
  - [x] Documentation (PASSWORD-RESET-IMPLEMENTATION.md, PASSWORD-RESET-SETUP.md, RESEND-SETUP.md, DB-MIGRATION-MANAGEMENT.md, PASSWORD-RESET-E2E-TESTS.md)
- [x] ✅ **Form validation & focus management documentation (v1.3)**
  - [x] Client-side validation patterns (progressive validation)
  - [x] Server-side validation middleware documentation
  - [x] Focus management using `flushSync` for reliable DOM updates
  - [x] Client-server validation flow diagrams (Mermaid)
  - [x] Complete implementation examples from all 3 auth forms
  - [x] Enhanced checklist with 4 categories (client, focus, server, testing)
- [x] ✅ **Additional improvements**
  - [x] Storage constants file (client/src/constants/storage.js)
  - [x] Database migration system (runMigration.js utility)
  - [x] Updated deployment checklist with Resend setup
  - [x] Enhanced AuthContext with forgotPassword and resetPassword methods
- [x] ✅ **Form validation test suite (comprehensive coverage)**
  - [x] 10 new focus management tests for LoginModal
  - [x] Client-side validation tests (required fields, email format, progressive validation)
  - [x] Server-side validateBody middleware tests (13 tests)
  - [x] Focus management verification (automatic focus on first error field)
  - [x] ARIA attributes testing (aria-invalid, aria-describedby, role="alert")
  - [x] Server error focus management tests
  - [x] Network error handling tests
  - [x] Total: 42+ validation tests (29 client + 13 server)
- [x] ✅ **README.md update - Product Management showcase**
  - [x] Expanded Author section with PM skills and competencies
  - [x] Added "Product Management & Strategy" section (9 skills)
  - [x] Added "Demonstrated PM Competencies" section (8 core skills)
  - [x] Updated subtitle to highlight product management and execution
  - [x] Added Product Requirements link to quick navigation
- [x] ✅ **Form validation standardization (October 25, 2025)**
  - [x] Unified form validation patterns across LoginModal and SignupModal
  - [x] Both modals use `noValidate` with custom validation
  - [x] Consistent auto-focus behavior and error handling
  - [x] Browser autocomplete properly handled
- [x] ✅ **Email service improvements (October 25, 2025)**
  - [x] Extracted email footer to reusable `getEmailFooter()` constant
  - [x] Added support email to all transactional emails
  - [x] Optimized footer hierarchy (branding → support → website)
- [x] ✅ **Password reset security enhancements (October 25, 2025)**
  - [x] Implemented rate limiting (3 requests per hour per email)
  - [x] Prevents email bombing and quota abuse
  - [x] In-memory tracking with automatic expiration
  - [x] HTTP 429 response when limit exceeded
  - [x] Documentation updated with rate limiting details
- [x] ✅ **Support email configuration (October 25, 2025)**
  - [x] Email forwarding documentation for `support@codescribeai.com`
  - [x] Namecheap-specific setup instructions
  - [x] Gmail organization best practices (Priority Inbox setup)
  - [x] Support email now functional via forwarding
- [x] ✅ **OAuth account linking (October 25, 2025)**
  - [x] GitHub users can now add email/password to their accounts
  - [x] Password reset flow supports both "reset" and "set password" scenarios
  - [x] Removed OAuth-only user blocking from forgot-password endpoint
  - [x] Symmetric account linking (Email/Password ↔ GitHub)
  - [x] Industry standard pattern (Slack, Spotify, Figma, Dropbox)
  - [x] Comprehensive documentation in PASSWORD-RESET-IMPLEMENTATION.md
  - [x] Password strength indicator added to ResetPassword component
- [x] ✅ **Migration API endpoints (October 25, 2025)**
  - [x] Created separate migration routes file (server/src/routes/migrate.js)
  - [x] Public endpoint: GET /api/migrate/status (no authentication)
  - [x] Admin endpoint: POST /api/migrate/run (Bearer token auth)
  - [x] Admin status endpoint: POST /api/migrate/run with {"action":"status"}
  - [x] Custom authentication middleware (requireMigrationSecret)
  - [x] Comprehensive test suite (28 endpoint tests, 67 total migration tests)
  - [x] Environment variable: MIGRATION_SECRET added
  - [x] Production error handling (hides sensitive details)
  - [x] Documentation updated: PRODUCTION-DB-SETUP.md

#### Next Steps (Epic 2.1.1 - Email Verification)

**Status:** 📋 **READY TO START**
**Estimated Duration:** 2-3 hours
**Prerequisites:** ✅ All complete (database schema ready, Resend selected)

**Implementation Tasks:**
- [ ] Install Resend SDK (`npm install resend`)
- [ ] Create email service module (`server/src/services/emailService.js`)
- [ ] Add User model verification methods (setVerificationToken, verifyEmail, etc.)
- [ ] Update signup route to send verification email
- [ ] Create verification endpoints (GET `/api/auth/verify-email`, POST `/api/auth/resend-verification`)
- [ ] Create UI components (verification banner, success/error pages)
- [ ] Test email verification flow end-to-end

**Reference:** See [MONETIZATION-STRATEGY.md Appendix C](../../private/strategic-planning/MONETIZATION-STRATEGY.md#appendix-c-resend-email-service-cost-analysis) for email service details

---

### Epic 2.2: Tier System & Feature Flags

**Estimated Duration:** 2-3 days
**Status:** 📋 **NOT STARTED**
**Implementation Files:** `server/src/config/tiers.js`, `server/src/middleware/tierGate.js`, `client/src/hooks/useFeature.js` (already created)

#### Tasks

- [ ] **Database Schema**
  - [ ] Create Usage table (user_id, daily_count, monthly_count, reset_date)
  - [ ] Add tier column to User table (FREE, PRO, TEAM, ENTERPRISE)
  - [ ] Create indexes for performance

- [ ] **Backend Implementation**
  - [ ] Integrate `tierGate.js` middleware into generation routes
  - [ ] Implement usage tracking on `/api/generate` and `/api/generate-stream`
  - [ ] Add usage reset cron job (daily/monthly)
  - [ ] Create usage query endpoints (GET `/api/usage`)

- [ ] **Frontend Implementation**
  - [ ] Integrate `useFeature.js` hook into components
  - [ ] Create usage dashboard UI
  - [ ] Show remaining quota in header or sidebar
  - [ ] Add "Upgrade to Pro" prompts when approaching limits
  - [ ] Disable features based on tier (batch processing, custom templates)

- [ ] **Tier Configuration**
  - [ ] Configure FREE tier limits (10 docs/month)
  - [ ] Configure PRO tier limits (100 docs/month)
  - [ ] Configure TEAM tier limits (500 docs/month)
  - [ ] Configure ENTERPRISE tier (unlimited)

- [ ] **Testing**
  - [ ] Unit tests for tierGate middleware
  - [ ] Integration tests for usage tracking
  - [ ] E2E tests for quota enforcement
  - [ ] Test tier upgrades and downgrades

#### Success Criteria

- [ ] Free tier limited to 10 docs/month
- [ ] Usage tracking accurate and performant
- [ ] Usage dashboard displays correct data
- [ ] Tier gates prevent unauthorized feature access
- [ ] Usage resets correctly (daily/monthly)
- [ ] All tier tests passing

---

### Epic 2.3: Payment Integration

**Estimated Duration:** 2-3 days
**Status:** 📋 **NOT STARTED**

#### Tasks

- [ ] **Stripe Setup**
  - [ ] Create Stripe account
  - [ ] Configure Stripe products and pricing
  - [ ] Set up Stripe webhooks
  - [ ] Install Stripe SDK (stripe npm package)

- [ ] **Backend Routes**
  - [ ] POST `/api/payments/create-checkout-session` - Start subscription
  - [ ] POST `/api/payments/create-portal-session` - Manage subscription
  - [ ] POST `/api/webhooks/stripe` - Handle Stripe events
  - [ ] Implement webhook signature verification

- [ ] **Webhook Handlers**
  - [ ] `checkout.session.completed` - Upgrade user tier
  - [ ] `customer.subscription.updated` - Update user tier
  - [ ] `customer.subscription.deleted` - Downgrade to FREE
  - [ ] `invoice.payment_succeeded` - Extend subscription
  - [ ] `invoice.payment_failed` - Handle failed payments

- [ ] **Frontend Components**
  - [ ] Create Pricing page
  - [ ] Create CheckoutModal (Stripe Checkout redirect)
  - [ ] Add "Upgrade" button in usage dashboard
  - [ ] Add "Manage Subscription" button for Pro users
  - [ ] Show subscription status in user profile

- [ ] **Testing**
  - [ ] Test with Stripe test mode
  - [ ] Unit tests for payment routes
  - [ ] Integration tests for webhooks
  - [ ] E2E tests for checkout flow
  - [ ] Test failed payment scenarios

#### Success Criteria

- [ ] Users can subscribe to Pro tier ($9/mo)
- [ ] Stripe webhooks update user tiers correctly
- [ ] Subscription management portal works
- [ ] Invoice generation works
- [ ] Failed payments handled gracefully
- [ ] All payment tests passing

---

### Epic 2.4: UI Integration

**Estimated Duration:** 1-2 days
**Status:** 📋 **NOT STARTED**

#### Tasks

- [ ] **Header Updates**
  - [ ] Unhide Sign In button (ENABLE_AUTH = true)
  - [ ] Add user profile dropdown (usage, settings, logout)
  - [ ] Show current tier badge
  - [ ] Add "Upgrade" link for FREE users

- [ ] **Usage Dashboard**
  - [ ] Create dashboard page/modal
  - [ ] Show daily/monthly usage stats
  - [ ] Show quota limits
  - [ ] Show usage history chart
  - [ ] Add "Upgrade" CTA when approaching limits

- [ ] **Feature Gates**
  - [ ] Show "Pro" badges on locked features
  - [ ] Disable batch processing for FREE users
  - [ ] Disable custom templates for FREE users
  - [ ] Show upgrade modal when clicking locked features

- [ ] **Loading States**
  - [ ] Auth loading spinners
  - [ ] Payment processing states
  - [ ] Subscription status loading

- [ ] **Error Handling**
  - [ ] Auth errors (invalid credentials, network errors)
  - [ ] Payment errors (card declined, Stripe errors)
  - [ ] Quota exceeded errors

- [ ] **Testing**
  - [ ] Visual regression testing
  - [ ] Accessibility testing
  - [ ] E2E tests for complete user flows

#### Success Criteria

- [ ] Sign In button functional and visible
- [ ] User profile menu works correctly
- [ ] Usage dashboard accurate and real-time
- [ ] Feature gates work correctly
- [ ] Upgrade prompts appear at appropriate times
- [ ] All UI tests passing

---

### Phase 2 Success Criteria

- [ ] Feature flag architecture integrated into existing codebase
- [ ] Users can sign up with email/password or GitHub OAuth
- [ ] Free tier tracked accurately (10 generations/month)
- [ ] Usage dashboard functional
- [ ] Stripe subscription flow working end-to-end
- [ ] All 660+ tests passing (including new auth/tier tests)
- [ ] Documentation updated (API docs, user guide, privacy policy)
- [ ] Deployed to production with monitoring

---

## 📋 Phase 3: UX Enhancements (v3.0.0)

**Timeline:** TBD (after Phase 2)
**Estimated Duration:** 2-3 weeks
**Status:** 📋 **NOT STARTED**
**Target Release:** v3.0.0
**Strategic Goal:** Transform user experience with customization, flexibility, and advanced file handling capabilities

**Reference:** See [ROADMAP.md Phase 3](roadmap/ROADMAP.md#-phase-3-ux-enhancements-planned) for complete details

---

### Epic 3.1: Theming & Visual Customization

**Estimated Duration:** 1.5-2 days
**Status:** 📋 **NOT STARTED**

#### Tasks

- [ ] **Theme Infrastructure**
  - [ ] Install theme dependencies (if needed)
  - [ ] Set up CSS variable architecture
  - [ ] Add `data-theme` attribute to `<html>` element
  - [ ] Create ThemeContext (React Context)
  - [ ] Implement theme persistence (localStorage)

- [ ] **Dark Theme Design**
  - [ ] Define dark theme color palette (CSS variables)
  - [ ] Ensure WCAG AAA contrast (7:1 text, 3:1 UI)
  - [ ] Design dark mode Mermaid theme
  - [ ] Design dark mode Monaco Editor theme

- [ ] **Component Updates**
  - [ ] Update all components with `dark:` Tailwind variants
  - [ ] Update Header component
  - [ ] Update CodePanel component
  - [ ] Update DocPanel component
  - [ ] Update Modal components
  - [ ] Update Button components
  - [ ] Update all 18 components

- [ ] **Theme Toggle UI**
  - [ ] Add sun/moon icon button to Header
  - [ ] Implement smooth theme transitions
  - [ ] Add `prefers-reduced-motion` support
  - [ ] System preference detection (`prefers-color-scheme: dark`)

- [ ] **Monaco & Mermaid**
  - [ ] Switch Monaco theme (`vs-light` / `vs-dark`)
  - [ ] Update Mermaid diagram theming
  - [ ] Ensure diagrams readable in both themes

- [ ] **Testing**
  - [ ] Visual regression testing (both themes)
  - [ ] Accessibility audit (WCAG AAA for both themes)
  - [ ] Test theme persistence
  - [ ] Test system preference detection
  - [ ] All 513+ frontend tests pass for both themes

#### Success Criteria

- [ ] Theme toggle works seamlessly
- [ ] All features work in both light and dark themes
- [ ] Theme preference persists across sessions
- [ ] WCAG AAA compliance maintained in both themes
- [ ] Smooth transitions with `prefers-reduced-motion` support
- [ ] System preference detected and respected
- [ ] All tests passing for both themes

---

### Epic 3.2: Layout & Workspace Flexibility

**Estimated Duration:** 2-3 days
**Status:** 📋 **NOT STARTED**

#### Tasks

- [ ] **Full-Width Layout**
  - [ ] Remove `max-w-7xl` constraint from main container
  - [ ] Add `max-w-prose` to DocPanel markdown content (65ch)
  - [ ] Test on multiple monitor sizes (1920px, 2560px, 3440px)

- [ ] **Resizable Panels**
  - [ ] Install `react-resizable-panels` library
  - [ ] Wrap CodePanel and DocPanel in Panel components
  - [ ] Add PanelResizeHandle with drag functionality
  - [ ] Implement panel constraints (30% min, 70% max)
  - [ ] Style resize handle (hover, active states)

- [ ] **Panel Persistence**
  - [ ] Save panel sizes to localStorage on resize
  - [ ] Load sizes from localStorage on mount
  - [ ] Validate stored data before applying
  - [ ] Handle localStorage edge cases (disabled, corrupt data)
  - [ ] Add "Reset to Default" button (50/50 split)

- [ ] **Keyboard Accessibility**
  - [ ] Arrow keys to resize panels
  - [ ] ARIA labels for resize handle
  - [ ] Screen reader announcements for size changes
  - [ ] Focus management during resize

- [ ] **Responsive Behavior**
  - [ ] Mobile: Stack panels vertically (no resizing)
  - [ ] Tablet: Decide if resizing enabled (<768px)
  - [ ] Desktop: Full resizable functionality

- [ ] **Testing**
  - [ ] Drag divider and verify smooth resize
  - [ ] Verify panel constraints enforce correctly
  - [ ] Test persistence across page refreshes
  - [ ] Test "Reset to Default" button
  - [ ] Test keyboard resize (arrow keys)
  - [ ] Test mobile stacking behavior
  - [ ] Accessibility audit

#### Success Criteria

- [ ] App uses full browser width on large monitors
- [ ] Doc text remains readable with `max-w-prose`
- [ ] Panels resize smoothly with draggable handle
- [ ] Panel sizes persist across page refreshes
- [ ] Constraints prevent unusable layouts
- [ ] Keyboard users can resize panels
- [ ] Mobile users see stacked panels
- [ ] All tests passing

---

### Epic 3.3: Advanced File Handling

**Estimated Duration:** 2-3 days
**Status:** 📋 **NOT STARTED**

#### Tasks

- [ ] **Multi-File Upload**
  - [ ] Update file input to accept multiple files
  - [ ] Create file queue UI component
  - [ ] Show file list with thumbnails/icons
  - [ ] Allow removing files from queue
  - [ ] Limit to 10 files maximum (Pro tier)

- [ ] **Drag-and-Drop Interface**
  - [ ] Implement drag-and-drop zone
  - [ ] Show drop zone highlight on drag over
  - [ ] Handle file drop events
  - [ ] Support both single and multiple files
  - [ ] Show drag-and-drop instructions

- [ ] **Batch Processing**
  - [ ] Process files sequentially (not parallel)
  - [ ] Show progress for each file
  - [ ] Show overall batch progress (3/10 complete)
  - [ ] Handle per-file errors (don't fail entire batch)
  - [ ] Aggregate results in DocPanel or separate view

- [ ] **File Preview**
  - [ ] Show file preview before generation
  - [ ] Display file size, type, name
  - [ ] Syntax highlighting for code preview
  - [ ] Allow editing files before generation

- [ ] **GitHub Single-File Import**
  - [ ] Create GitHub URL parser utility
  - [ ] Add "Load from GitHub" button to ControlBar
  - [ ] Create GitHubImportModal component
  - [ ] Fetch file from raw.githubusercontent.com
  - [ ] Handle CORS, 404, rate limits
  - [ ] Show loading and error states
  - [ ] Unhide GitHub button (ENABLE_GITHUB_IMPORT = true)

- [ ] **Filename Display**
  - [ ] Show filename in CodePanel header
  - [ ] Add file type icon
  - [ ] Handle "Untitled" for pasted code
  - [ ] Truncate long filenames with ellipsis

- [ ] **Testing**
  - [ ] Test multi-file upload (2, 5, 10 files)
  - [ ] Test drag-and-drop functionality
  - [ ] Test batch processing with errors
  - [ ] Test GitHub import with various URLs
  - [ ] Test file preview functionality
  - [ ] Test filename display edge cases
  - [ ] Accessibility testing

#### Success Criteria

- [ ] Multi-file upload supports up to 10 files
- [ ] Drag-and-drop interface intuitive and accessible
- [ ] Batch processing handles errors gracefully
- [ ] File preview shows accurate information
- [ ] GitHub import works with public repositories
- [ ] Filename displays correctly in all scenarios
- [ ] All tests passing

---

## 📋 Phase 4: Documentation Capabilities (v4.0.0)

**Timeline:** TBD (after Phase 3)
**Estimated Duration:** 2-3 weeks
**Status:** 📋 **NOT STARTED**
**Target Release:** v4.0.0
**Strategic Goal:** Expand documentation generation capabilities with new doc types and advanced features

**Reference:** See [ROADMAP.md Phase 4](roadmap/ROADMAP.md#-phase-4-documentation-capabilities-planned) for complete details

---

### Epic 4.1: OpenAPI/Swagger Generation

**Estimated Duration:** 3-4 days
**Status:** 📋 **NOT STARTED**

#### Tasks

- [ ] **Backend Service Updates**
  - [ ] Add "OPENAPI" doc type to docGenerator.js
  - [ ] Create OpenAPI-specific prompt template
  - [ ] Implement OpenAPI parser (detect routes, endpoints)
  - [ ] Add OpenAPI quality scoring algorithm (5 criteria)

- [ ] **Quality Scoring Criteria**
  - [ ] API overview and metadata (20 points)
  - [ ] Endpoint documentation completeness (25 points)
  - [ ] Schema definitions (20 points)
  - [ ] Examples and request/response samples (20 points)
  - [ ] Security and authentication docs (15 points)

- [ ] **Frontend Updates**
  - [ ] Add "OpenAPI/Swagger" to doc type selector
  - [ ] Update DocPanel to handle YAML output
  - [ ] Add syntax highlighting for YAML
  - [ ] Update quality scoring display for OpenAPI criteria

- [ ] **Testing**
  - [ ] Test with Express.js API
  - [ ] Test with Flask/FastAPI
  - [ ] Validate OpenAPI 3.0 compliance
  - [ ] Test quality scoring accuracy
  - [ ] E2E tests for OpenAPI generation

#### Success Criteria

- [ ] OpenAPI generation produces valid OpenAPI 3.0 YAML
- [ ] Quality scores provide actionable feedback
- [ ] Works with multiple backend frameworks
- [ ] All tests passing

---

### Epic 4.2: Multi-File Project Documentation

**Estimated Duration:** 4-5 days
**Status:** 📋 **NOT STARTED**

#### Tasks

- [ ] **File Upload Enhancement**
  - [ ] Support .zip file upload
  - [ ] Extract and parse directory structure
  - [ ] Identify project patterns (MVC, microservices, monorepo)

- [ ] **Project Analysis**
  - [ ] Analyze project-wide architecture
  - [ ] Detect frameworks and dependencies
  - [ ] Generate comprehensive project README
  - [ ] Create cross-references between files

- [ ] **Quality Scoring (Project-Level)**
  - [ ] Project overview and purpose (20 points)
  - [ ] Architecture and structure (25 points)
  - [ ] Setup and installation (15 points)
  - [ ] Usage examples and workflows (20 points)
  - [ ] Documentation completeness (20 points)

- [ ] **Testing**
  - [ ] Test with monorepo projects
  - [ ] Test with microservices architecture
  - [ ] Test cross-references accuracy
  - [ ] Validate project-level quality scoring

#### Success Criteria

- [ ] Multi-file upload analyzes project structure accurately
- [ ] Generated project docs include cross-references
- [ ] Quality scoring evaluates entire project
- [ ] All tests passing

---

### Epic 4.3: Custom Templates & Export Formats

**Estimated Duration:** 2-3 days
**Status:** 📋 **NOT STARTED**

#### Tasks

- [ ] **Template System**
  - [ ] Create template schema
  - [ ] Allow users to define custom templates
  - [ ] Template variables and placeholders
  - [ ] Template preview and validation
  - [ ] Save templates to database (Pro feature)

- [ ] **Export Formats**
  - [ ] Markdown (.md) - already supported
  - [ ] Plain text (.txt) - already supported
  - [ ] HTML export with styling
  - [ ] PDF export (using html2pdf or similar)

- [ ] **Testing**
  - [ ] Test custom template creation
  - [ ] Test template variables substitution
  - [ ] Test all export formats
  - [ ] Test PDF formatting

#### Success Criteria

- [ ] Custom templates work with all doc types
- [ ] Export formats maintain formatting
- [ ] PDF export readable and professional
- [ ] All tests passing

---

## 📋 Phase 5: Developer Tools (v5.0.0)

**Timeline:** TBD (after Phase 4)
**Estimated Duration:** 3-4 weeks
**Status:** 📋 **NOT STARTED**
**Target Release:** v5.0.0
**Strategic Goal:** Bring CodeScribe AI to developers' local workflows with CLI and VS Code extension

**Reference:** See [ROADMAP.md Phase 5](roadmap/ROADMAP.md#-phase-5-developer-tools-planned) for complete details

### Epic 5.1: CLI Tool (5-7 days)

- [ ] Command-line interface using Commander.js
- [ ] File path support (single file or directory)
- [ ] Batch processing (multiple files)
- [ ] Configuration file support (`.codescriberc`)
- [ ] npm package publication

### Epic 5.2: VS Code Extension (7-10 days)

- [ ] Right-click "Generate Documentation" context menu
- [ ] Inline documentation preview
- [ ] Quality score in status bar
- [ ] VS Code Marketplace publication

---

## 📋 Phase 6: Enterprise Readiness (v6.0.0)

**Timeline:** TBD (after Phase 5)
**Estimated Duration:** 3-4 weeks
**Status:** 💡 **TO BE EVALUATED**
**Target Release:** v6.0.0
**Priority:** P2 (Evaluate based on demand)

**Reference:** See [ROADMAP.md Phase 6](roadmap/ROADMAP.md#-phase-6-enterprise-readiness-future) for complete details

### Epic 6.1: SSO & Advanced Authentication (5-7 days)

- [ ] SAML 2.0 integration
- [ ] OAuth 2.0 provider support (Okta, Auth0, Azure AD)
- [ ] Multi-factor authentication (MFA)

### Epic 6.2: Audit Logs & Compliance (3-4 days)

- [ ] Comprehensive audit logging
- [ ] GDPR compliance tools
- [ ] SOC 2 Type II preparation

### Epic 6.3: On-Premise Deployment (7-10 days)

- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] Self-hosted deployment guide

---

## 📊 Phase Summary

| Phase | Version | Focus | Duration | Priority | Status |
|-------|---------|-------|----------|----------|--------|
| **Phase 1** | v1.0.0 - v1.2.2 | MVP + Production Deployment | 8 days | P0 | ✅ Complete |
| **Phase 2** | v2.0.0 | Monetization Foundation | 2-3 weeks | P1 | 📋 Planned |
| **Phase 3** | v3.0.0 | UX Enhancements | 2-3 weeks | P1 | 📋 Planned |
| **Phase 4** | v4.0.0 | Documentation Capabilities | 2-3 weeks | P2 | 📋 Planned |
| **Phase 5** | v5.0.0 | Developer Tools (CLI, VS Code) | 3-4 weeks | P2 | 📋 Planned |
| **Phase 6** | v6.0.0 | Enterprise Readiness | 3-4 weeks | P3 | 💡 Future |

---

## 🗂️ Backlog (Unscheduled)

**Status:** 💡 **IDEA CAPTURE** - Not yet scoped or scheduled
**Purpose:** Quick capture of bugs, enhancements, and ideas

**Process:**
1. Capture ideas here quickly (1 line, no detailed planning)
2. When ready to implement → Move to appropriate phase/epic
3. Add full implementation details at that time

**Format:** `[TYPE]` Brief description
- Types: BUG, ENHANCEMENT, FEATURE, TECH-DEBT

---

### Backlog Items

- [ ] **[ENHANCEMENT]** App needs to be responsive to larger monitor sizes - reduce excessive whitespace on wide screens *(covered in Epic 3.2)*
- [ ] **[BUG]** Remove max-w-7xl constraint - app should use full width on laptop screens *(covered in Epic 3.2)*
- [ ] **[FEATURE]** Add changelog generation from git history
- [ ] **[FEATURE]** Multi-language support (i18n for UI)
- [ ] **[FEATURE]** Advanced Mermaid diagram auto-generation from code
- [ ] **[FEATURE]** Team collaboration features (share, comment, review)
- [ ] **[ENHANCEMENT]** Advanced analytics and monitoring dashboard
- [ ] **[TECH-DEBT]** Evaluate and upgrade to React 19 stable (currently RC)
- [ ] **[ENHANCEMENT]** Consider adding support for more programming languages

#### Email Service Improvements (Future Evaluation)

- [ ] **[TECH-DEBT]** Extract email templates to separate files (Handlebars/EJS) for easier editing and version control
- [ ] **[TECH-DEBT]** Create reusable email template components (header, footer, buttons) to reduce duplication
- [ ] **[ENHANCEMENT]** Add email preview/testing mode for development (Ethereal Email or Mailtrap)
- [ ] **[ENHANCEMENT]** Implement email queue (Bull/BullMQ) for reliability and async processing at scale
- [ ] **[ENHANCEMENT]** Add email analytics tracking (opens, clicks) via Resend's built-in features
- [ ] **[ENHANCEMENT]** Add better error logging with detailed context (to, error message, stack trace)
- [ ] **[ENHANCEMENT]** Implement email input validation before sending
- [ ] **[FEATURE]** A/B test email templates to optimize engagement (when scaling)

---

**Document Version:** 2.4
**Last Updated:** October 25, 2025
**Aligned with:** ROADMAP.md v2.0 (Phase-based organization)

**Major Changes in v2.4:**
- ✅ **Form validation test suite complete** - 42+ comprehensive tests (29 client + 13 server)
- Added 10 new focus management tests for LoginModal
- Complete coverage: client validation, server validation, focus management, accessibility
- Updated test count: 190+ tests total (was 150+)

**Major Changes in v2.3:**
- ✅ **Password reset implementation complete** - Full end-to-end flow with email service
- Updated success criteria: Password reset now fully working (was stubbed)
- Added comprehensive password reset completion details (database, email, tests, docs)
- Updated test count: 150+ tests (was 102+)
- Added 5 new documentation files for password reset and database migrations

**Major Changes in v2.2:**
- Added form validation & focus management documentation completion
- Updated "Additional Completions" with FORM-VALIDATION-GUIDE.md v1.3
- Documented progressive validation patterns and flushSync implementation
- Added comprehensive client-server validation flow documentation

**Major Changes in v2.1:**
- Epic 2.1 (Authentication & User Management) marked as COMPLETE ✅
- Updated success criteria to reflect tested and working features
- Added "Additional Completions" section documenting extra work completed
- Added "Next Steps" section for Epic 2.1.1 (Email Verification)
- Updated Phase 2 status to "In Progress" (Epic 2.1 Complete)

**Major Changes in v2.0:**
- Reorganized from version-based (v2.0.0, v2.2.0) to phase-based structure (Phase 2, 3, 4, 5, 6)
- Each phase contains multiple epics (shippable feature sets)
- Aligned with ROADMAP.md strategic themes
- Phases represent strategic goals (2-3 weeks), not individual features
- Maintained detailed task breakdowns for immediate next steps (Phase 2)
