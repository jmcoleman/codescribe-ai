# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Password Reset System**
  - Complete password reset flow with email-based token verification
  - ResetPassword component with dedicated route (`/reset-password?token=...`)
  - Email service using Resend API with beautiful HTML templates
  - Database migrations for reset token fields (reset_token_hash, reset_token_expires)
  - User model methods: setResetToken, findByResetToken, updatePassword, clearResetToken
  - API endpoints: POST /api/auth/forgot-password, POST /api/auth/reset-password
  - E2E tests for password reset flow (password-reset.spec.js, password-reset-core.spec.js)
  - Show/hide password toggles in ResetPassword component
  - Auto-redirect to home after successful password reset (2 seconds)

- **Email Service Infrastructure**
  - Resend SDK integration (npm package: resend)
  - sendPasswordResetEmail with branded HTML template
  - sendVerificationEmail for future email verification feature
  - Brand-consistent design (purple/indigo gradient, CodeScribe AI branding)
  - Mobile-responsive email templates
  - Accessible email layout

- **Database Migration System**
  - runMigration.js utility for executing SQL migrations
  - Migration: add-reset-token-fields.sql
  - Safe migration execution with rollback support
  - Migration logging and error handling

- **Form Validation & Focus Management**
  - Comprehensive form validation guide (FORM-VALIDATION-GUIDE.md v1.3)
  - Server-side validation documentation with middleware patterns
  - Client-server validation flow diagrams (Mermaid sequence + decision tree)
  - Complete focus management implementation using `flushSync` from react-dom
  - Automatic focus on first error field for both client and server errors
  - Enhanced checklist organized by: client-side, focus management, server integration, testing

- **Documentation**
  - PASSWORD-RESET-IMPLEMENTATION.md - Complete implementation summary
  - PASSWORD-RESET-SETUP.md - Step-by-step password reset configuration
  - RESEND-SETUP.md - Resend email service setup with custom domain
  - DB-MIGRATION-MANAGEMENT.md - Database migration procedures
  - PASSWORD-RESET-E2E-TESTS.md - E2E testing documentation (20 test scenarios)
  - FORM-VALIDATION-GUIDE.md v1.3 - Complete form validation patterns

- **Storage Constants**
  - client/src/constants/storage.js - Centralized localStorage key definitions
  - Prevents key conflicts and typos
  - AUTH_TOKEN_KEY constant for JWT token storage

### Changed
- **Authentication Context**
  - Added forgotPassword(email) method
  - Added resetPassword(token, password) method
  - Enhanced error handling for password reset flows
  - Better error messages for expired/invalid tokens

- **User Model**
  - Added reset token management methods
  - Token hashing for security (SHA-256)
  - Token expiration validation (1 hour default)
  - Password update with bcrypt re-hashing

- **Auth Routes**
  - Implemented forgot-password endpoint with email sending
  - Implemented reset-password endpoint with token validation
  - Added comprehensive error handling for edge cases
  - Email validation and user existence checks

- **App Router**
  - Added /reset-password route for password reset page
  - Updated main.jsx with new route configuration
  - Maintained existing / and /auth/callback routes

- **Form Validation Documentation**
  - Updated FORM-VALIDATION-GUIDE.md from v1.2 to v1.3
  - Added "What's New in v1.3" section highlighting key improvements
  - Expanded Table of Contents with server validation section
  - Enhanced implementation examples from all 3 auth forms
  - Updated reference implementations: LoginModal, SignupModal, ResetPassword

- **Environment Variables**
  - Added RESEND_API_KEY to server/.env.example
  - Added FROM_EMAIL configuration for sent emails
  - Updated deployment checklist with Resend setup

### Fixed
- **Password Reset Flow**
  - Token expiration properly validated (prevents use of expired tokens)
  - Token cleared after successful password reset (prevents reuse)
  - Password validation ensures minimum 8 characters
  - Proper error messages for invalid/expired/missing tokens

- **Focus Management**
  - Documented critical `flushSync` pattern for reliable focus management
  - Fixed focus timing issues with synchronous DOM updates
  - Ensured focus works consistently for both client and server validation errors
  - Resolved race conditions in focus trigger mechanism

- **Email Sending**
  - Reset token properly encoded in email URLs
  - Email templates render correctly in major email clients
  - Brand colors match application theme

### Testing
- **Backend Tests**
  - 28 new password reset route tests (auth-password-reset.test.js)
  - 15 new email service tests (emailService.test.js)
  - Token validation and expiration tests
  - Email sending mock tests

- **Frontend Tests**
  - ResetPassword component unit tests (ResetPassword.test.jsx)
  - AuthContext password reset method tests
  - Token extraction and validation tests

- **E2E Tests**
  - password-reset-core.spec.js - Core password reset flow (4 scenarios)
  - password-reset.spec.js - Comprehensive scenarios (16 scenarios)
  - Total: 20 E2E test scenarios covering happy path and edge cases
  - Tests: expired tokens, invalid tokens, missing tokens, password validation

### Security
- **Token Security**
  - Reset tokens hashed before database storage (SHA-256)
  - Tokens expire after 1 hour
  - Tokens single-use (cleared after password reset)
  - Cryptographically secure token generation (32 bytes)

- **Email Security**
  - Rate limiting on password reset requests (prevents abuse)
  - Email validation before sending reset links
  - User existence verification (prevents enumeration)
  - Secure URL encoding of tokens

### Dependencies Added
- **Backend:**
  - resend (^4.0.1) - Email sending service

### Testing - Form Validation Test Suite
- **Client-Side Tests (LoginModal.test.jsx)**
  - 10 new focus management tests covering client and server error scenarios
  - Focus on first error field validation (email, password, server errors)
  - Progressive validation behavior tests (clear on input, no refocus)
  - ARIA attributes verification (aria-invalid, aria-describedby, role="alert")
  - Multiple error handling and focus priority testing
  - Total: 29 comprehensive LoginModal tests

- **Server-Side Tests (auth.test.js)**
  - 13 validateBody middleware tests
  - Required field validation
  - Email/password format validation
  - Length constraints (minLength, maxLength)
  - Custom validator function tests
  - Empty string handling as missing fields

- **Coverage Areas**
  - Client-side validation (required fields, email format, progressive validation)
  - Server-side middleware validation (validateBody)
  - Focus management (automatic focus on first error, client + server errors)
  - Accessibility (ARIA attributes, screen reader compatibility)
  - Total validation tests: 42+ (29 client + 13 server)

---

## [1.3.0] - 2025-10-24

**Status:** ✅ Feature Release - Authentication System

### Added
- **Authentication System**
  - GitHub OAuth integration with Passport.js
  - Email/password authentication with JWT tokens
  - User model with Neon Postgres database integration
  - Session management with express-session
  - Password hashing with bcrypt (10 salt rounds)
  - Auth middleware (requireAuth, optionalAuth, requireTier)
  - JWT token generation and validation
  - User sanitization (removes password_hash from responses)

- **Frontend Auth UI**
  - LoginModal component with email/password and GitHub OAuth
  - SignupModal with password strength indicator (4-level visual)
  - ForgotPasswordModal (UI only, backend planned for v1.4.0)
  - AuthContext for global authentication state
  - React Router integration for OAuth callback handling
  - AuthCallback component for processing GitHub OAuth redirects
  - Feature flag system: VITE_ENABLE_AUTH environment variable

- **Database Schema**
  - Users table with email, password_hash, github_id, tier fields
  - Email verification fields: email_verified, verification_token, verification_token_expires
  - Indexes on email, github_id, and verification_token
  - Session storage with connect-pg-simple

- **API Endpoints**
  - POST /api/auth/signup - User registration
  - POST /api/auth/login - Email/password login
  - POST /api/auth/logout - Session/token cleanup
  - GET /api/auth/me - Get current authenticated user
  - GET /api/auth/github - Initiate GitHub OAuth flow
  - GET /api/auth/github/callback - Handle GitHub OAuth callback
  - POST /api/auth/forgot-password - Password reset request (stub)
  - POST /api/auth/reset-password - Password reset confirmation (stub)

- **Email Service Integration (Setup)**
  - Resend email service selected for verification emails
  - Cost analysis: Free tier covers 3K emails/month (1,500 signups)
  - Appendix C added to MONETIZATION-STRATEGY.md
  - Database schema prepared for email verification

- **Documentation**
  - VERCEL-POSTGRES-SETUP.md - Neon database integration guide
  - GITHUB-OAUTH-SETUP.md - OAuth configuration and testing
  - AUTH-TESTS.md - 102 authentication tests documented
  - AUTH-SECURITY-TESTS.md - Security testing coverage
  - AUTH-API-TESTING.md - API endpoint testing guide
  - MONETIZATION-STRATEGY.md Appendix B - Neon database cost analysis
  - MONETIZATION-STRATEGY.md Appendix C - Resend email cost analysis

### Changed
- **Routing**
  - Added React Router (react-router-dom) for SPA routing
  - Created routes: / (main app) and /auth/callback (OAuth handler)
  - Wrapped app in BrowserRouter for navigation support

- **Header Component**
  - Shows "Sign In" button when not authenticated
  - Shows username and logout button when authenticated
  - Dynamic rendering based on authentication state
  - Lazy loads auth modals on hover for performance

- **Logout Endpoint**
  - Fixed to handle JWT-only authentication (no session errors)
  - Gracefully handles missing session support for JWT users
  - Cleans up both session and Passport state if present

### Fixed
- Project structure cleanup: Removed incorrect src/models/ directory (kept server/src/models/)
- Logout errors for JWT-authenticated users (Passport session support warning)
- OAuth callback token extraction and localStorage storage
- UI updates after login/logout (AuthContext reinitialization)

### Security
- JWT secret stored in environment variables (JWT_SECRET)
- Passwords hashed with bcrypt before storage
- Tokens expire after 7 days (configurable)
- Session cookies: httpOnly, secure (production), sameSite strict
- Input validation on all auth endpoints
- Email format validation with regex
- Password minimum length: 8 characters
- GitHub OAuth scope limited to user:email only

### Testing
- **Backend Tests:** 102+ authentication tests
  - 41 auth middleware tests (100% coverage)
  - 33 User model tests (89% coverage)
  - 28 auth routes integration tests
  - GitHub OAuth flow tests
- **Frontend Tests:** AuthContext tests with React Testing Library
- **Manual Testing:** GitHub OAuth and email/password flows verified end-to-end

### Infrastructure
- **Database:** Neon Postgres via Vercel Marketplace
  - Free tier: 512 MB storage (supports 50K users)
  - Cost: $0/month for first 50K users
  - Storage per user: ~160 bytes (users) + ~544 bytes (sessions)
  - Database costs: <0.5% of total COGS

- **Email Service:** Resend (setup complete, implementation pending)
  - Free tier: 3,000 emails/month
  - Covers: 1,500 signups/month (18K annual signups)
  - Cost: $0/month for first 25K users
  - Email costs: <0.5% of total COGS

### Dependencies Added
- **Backend:**
  - @vercel/postgres (^0.10.0) - Neon database SDK
  - bcrypt (^5.1.1) - Password hashing
  - connect-pg-simple (^10.0.0) - PostgreSQL session store
  - express-session (^1.18.1) - Session middleware
  - passport (^0.7.0) - Authentication middleware
  - passport-github2 (^0.1.12) - GitHub OAuth strategy
  - passport-local (^1.0.0) - Local strategy for email/password

- **Frontend:**
  - react-router-dom (^7.0.2) - Client-side routing

### Statistics
- **Files Added:** 15+ (auth routes, models, middleware, modals, context)
- **Files Modified:** 20+
- **Lines Added:** 3,500+
- **Tests:** 102+ new authentication tests (all passing)
- **Test Coverage:** Backend 95.81% maintained
- **Duration:** 1 day (full session)

### Notes
- Email verification implementation in progress (schema ready, Resend selected)
- Password reset functionality stubbed (planned for v1.4.0)
- Account linking (GitHub + password on same account) planned for v1.4.0
- Authentication is feature-flagged: Set VITE_ENABLE_AUTH=true to enable

---

## [1.2.2] - 2025-10-22

**Status:** ✅ Maintenance Release - Mobile & UX Polish

### Added
- **Mobile Compatibility**
  - Clipboard fallback for non-secure contexts (HTTP/IP access)
  - Document.execCommand('copy') fallback when Clipboard API unavailable
  - Test coverage for non-secure context clipboard operations

- **Documentation**
  - Mobile-Specific Testing section in Cross-Browser Test Plan (110+ lines)
  - Native OS file picker behavior documentation (iOS Safari, Chrome Android)
  - 8-step manual testing procedure for mobile file uploads
  - Browser-specific notes table (Safari iOS, Chrome Android, Samsung Browser)
  - Debugging tips for chrome://inspect mobile workflow
  - Testing patterns for secure vs non-secure contexts

- **Feature Management**
  - Feature flag system for incomplete features (following ENABLE_AUTH pattern)
  - ENABLE_GITHUB_IMPORT flag (disabled until v2.0 implementation)

### Changed
- **UX Improvements**
  - Download button simplified: removed checkmark animation (fire-and-forget UX pattern)
  - Enhanced mobile focus indicators (larger rings, better visibility)
  - Improved touch target sizing across mobile components
  - Better visual hierarchy in mobile menu
  - Clearer active/hover states for mobile interactions

- **Accessibility Enhancements**
  - Enhanced focus ring visibility in Header component
  - Improved keyboard navigation visual feedback
  - Better contrast for WCAG compliance
  - Mobile-friendly focus indicators in ExamplesModal
  - Enhanced focus styles for all interactive elements in MobileMenu

- **Component Refinements**
  - DocPanel spacing and layout improvements
  - App.jsx integration cleanup (simplified DownloadButton API)
  - Removed unnecessary state management for downloads

- **Testing**
  - Updated ControlBar tests: 6 skipped (GitHub button hidden), 1 new verification test
  - Removed 3 obsolete download button checkmark tests
  - Added non-secure context clipboard tests
  - Cleaned up duplicate test helpers in QualityScore tests

### Fixed
- Copy-to-clipboard now works on mobile via IP/HTTP (non-secure contexts)
- Download button no longer shows confusing checkmark after download
- GitHub import button hidden (non-functional placeholder removed)
- Mobile file upload expectations documented (Camera/Photos/Files picker)
- Server error handling and logging improvements
- Test suite consistency (660+ tests passing, 100% pass rate)

### Documentation
- Updated Cross-Browser Test Plan v1.0 → v1.1
- Enhanced Frontend Testing Guide with mobile patterns
- Updated Todo List v1.3 with v1.2.2 completion details
- Updated Roadmap.md and roadmap-data.json
- Comprehensive maintenance release documentation

### Statistics
- **Files Modified:** 16
- **Lines Added:** 513
- **Lines Removed:** 253
- **Net Change:** +260 lines
- **Tests:** 660+ passing (46 ControlBar + 6 skipped appropriately)
- **Test Coverage:** Maintained at 95.81% backend
- **Duration:** 1 day (afternoon session)

---

## [1.2.1] - 2025-10-22

**Status:** ✅ Bug Fixes (Included in v1.2.2 release)

### Fixed
- **DocPanel Footer Alignment**
  - Fixed DocPanel footer to match CodePanel footer alignment
  - Ensured consistent padding (`px-4 py-2`) across both panels
  - Verified proper flex alignment (`items-center justify-between`)
  - Verified vertical centering of all footer elements
  - Tested with and without quality score display
  - Tested expandable section transitions

- **Download Button UX**
  - Removed checkmark animation from download button (downloads don't need success confirmation like copy does)
  - Simplified to static Download icon with toast notification
  - Removed unnecessary state management and timer logic
  - Maintained hover/active states for visual feedback
  - Updated component tests to match new behavior

- **Sign In Button**
  - Hidden non-functional Sign In button until authentication is implemented (planned for v1.5.0)
  - Added feature flag system: `ENABLE_AUTH = false`
  - Implemented conditional rendering for cleaner code
  - Verified header layout remains balanced without button
  - Applied to both desktop header and mobile menu

- **Examples Modal**
  - Fixed preview persistence and focus alignment issues
  - Enhanced focus styles for mobile (larger ring, better visibility)
  - Improved touch target clarity
  - Better visual feedback for keyboard navigation

### Changed
- Updated DownloadButton component to remove checkmark pattern (fire-and-forget UX)
- Applied feature flag pattern to authentication UI elements
- Enhanced mobile accessibility in ExamplesModal

### Testing
- Visual regression testing across Chrome, Firefox, Safari
- Cross-browser testing for all fixes
- Mobile testing (iOS, Android) for responsive behavior
- Verified 660+ tests passing with 100% pass rate
- No regressions in existing UI

---

## [1.2.0] - 2025-10-19

**Status:** ✅ Production Release - [codescribeai.com](https://codescribeai.com)

### Added
- **AI-Powered Documentation Generation**
  - 4 documentation types: README, JSDoc, API, ARCHITECTURE
  - Real-time streaming with Server-Sent Events (SSE)
  - Powered by Claude Sonnet 4.5 (claude-sonnet-4-20250514)

- **Quality Scoring System**
  - 0-100 scale with letter grades (A-F)
  - 5 criteria breakdown: Overview, Installation, Usage, API, Structure
  - Visual traffic light indicators (green/yellow/red)

- **Code Input Methods**
  - Monaco Editor with syntax highlighting (24+ languages)
  - File upload support (.js, .jsx, .ts, .tsx, .py, .java, .go, etc.)
  - Drag-and-drop file upload

- **User Interface**
  - Responsive design (mobile, tablet, desktop)
  - Real-time markdown preview with GitHub Flavored Markdown
  - Mermaid diagram support in generated documentation
  - Copy-to-clipboard functionality with visual feedback
  - Toast notifications for user feedback
  - Error handling with expandable technical details
  - Confirmation modals for large file uploads

- **Accessibility Features**
  - WCAG 2.1 AA compliance (95/100 Lighthouse score)
  - Full keyboard navigation support
  - Screen reader compatibility (NVDA, VoiceOver tested)
  - Skip navigation link
  - Focus traps in modals
  - ARIA labels and live regions
  - AAA color contrast (18.2:1 ratio for body text)
  - 0 automated accessibility violations (axe DevTools)

- **Testing & Quality**
  - 660+ tests across 3 frameworks (Vitest, Jest, Playwright)
  - 513+ frontend component tests (100% passing)
  - 133+ backend service tests (100% passing)
  - 10 E2E tests (100% passing, cross-browser)
  - 95.81% backend code coverage
  - Cross-browser testing (Chrome, Firefox, Safari, Edge, WebKit)

- **Performance Optimizations**
  - Lazy loading for Monaco Editor, Mermaid, and DocPanel
  - Bundle size: 78 KB gzipped (main), 425.68 KB total lazy chunks
  - Lighthouse performance score: 75/100 (+67% improvement)
  - Core Web Vitals optimized (FCP: -89%, LCP: -93%, TBT: -30%)

- **Infrastructure**
  - Vercel deployment with custom domain
  - GitHub Actions CI/CD pipeline
  - Test-gated deployments with Deploy Hooks
  - Environment variable security
  - Rate limiting (10 requests/minute, 100/hour per IP)
  - CORS configuration
  - HSTS headers for security

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Environment variable sanitization
- API key protection (server-side only)
- Input validation and sanitization
- File upload security (type/size validation)
- Rate limiting to prevent abuse
- Strict Transport Security (HSTS) headers

---

## Development Timeline

- **Phase 1 (Oct 11-16, 2025):** Core application development (5 days)
- **Phase 1.5 (Oct 16-19, 2025):** Accessibility compliance + deployment (4 days)
- **Total:** 9 days from start to production

---

## Version History Summary

- **v1.3.0** - Feature release: Authentication system (GitHub OAuth + email/password), Neon database, Resend email service
- **v1.2.2** - Maintenance release: mobile compatibility, UX polish, feature flag management
- **v1.2.1** - Bug fixes: footer alignment, download button UX, sign-in button hiding
- **v1.2.0** - Production release with full feature set, accessibility compliance, and comprehensive testing

---

## Links

- **Live Application:** [https://codescribeai.com](https://codescribeai.com)
- **Documentation:** [docs/](docs/)
- **API Reference:** [docs/api/API-Reference.md](docs/api/API-Reference.md)
- **Architecture:** [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)
- **Testing Guide:** [docs/testing/README.md](docs/testing/README.md)
