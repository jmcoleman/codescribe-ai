# CodeScribe AI Testing Documentation

**Project:** CodeScribe AI - Intelligent Code Documentation Generator
**Testing Status:** ✅ Comprehensive Coverage Across 3 Frameworks
**Last Updated:** January 8, 2026 (v3.3.8)

---

## 📊 Quick Stats

- **Total Tests:** 4,029 tests (4,029 passing, 100 skipped, 0 failures)
  - **Frontend:** 2,067 tests | 67 skipped (Vitest + React Testing Library)
    - Component Tests: All components with dark mode variants tested (including AppearanceModal, SamplesModal)
    - GitHub Loader: FileTree, TreeNode, GitHubLoadModal integration tests
    - Dark Mode Tests: 106+ tests (ThemeContext with 3-state cycling, ThemeToggle, all components, integration)
    - Integration Tests: Auth, OAuth, password reset, upload, error handling, usage tracking, legal pages
    - UI Tests: Toast system, modals, forms, storage helpers, pricing page, focus trap
    - Contact Modals: ContactSalesModal (25 tests), ContactSupportModal (12 tests - getToken Promise fix)
    - Batch Generation: 35 tests (useBatchGeneration hook - buildAttribution, generateBatchSummaryDocument)
    - Settings: AccountTab (36 tests - profile, password, data export, GitHub status fetch)
    - Analytics: EventsTable multi-select filter, Select Portal tests
    - **Pass Rate:** 96.8% (2,067 passing, 67 skipped, 0 failures)
  - **Backend:** 1,962 tests | 33 skipped (Jest + Supertest)
    - Unit Tests: Services, models, utilities, middleware (emailService, requireTermsAcceptance, tierGate, rateLimitBypass, githubService)
    - LLM Provider Tests: 69 tests (llmService, config, utils, adapters for Claude/OpenAI/Gemini)
    - Integration Tests: Prompt quality, API contracts, authentication, tier system, contact sales/support, legal endpoints
    - Security Tests: Password hashing, JWT validation, OAuth flows, usage quotas, email rate limiting
    - Email Tests: 73 tests (contact route 45, emailService 28 - templates, attachments, rate limits)
    - Usage Tests: 29 tests (all passing)
    - Middleware Tests: 14 rateLimitBypass tests (2 skipped after debug logging cleanup)
    - Graph Engine: graph analysis, project dependencies, architecture generation
    - Private Repo Tests: 55 tests (encryption 14, User model 15, GitHubService 13, API routes 13)
    - Campaign Tests: Campaign model, admin routes, config validation
    - Analytics Tests: getConversionFunnel with 6 query mocks, getBusinessConversionFunnel, multi-select eventNames filter combinations
    - **Pass Rate:** 98.3% (1,962 passing, 33 skipped, 0 failures)
  - **Database:** 37 migration tests (Docker sandbox + Neon dev validation)
    - Migration-010: 14 tests (terms/privacy acceptance tracking)
    - Migration-011: 10 tests (analytics_enabled column + index)
    - Migration-017: 13 tests (total_generations column with triggers)
  - **E2E:** 10 tests (Playwright - file upload flow)
- **Pass Rate:** 97.5% (3,945/4,045 total tests passing, 100 skipped, 0 failures) ✅
- **Backend Coverage:** 82.38% statements, 70.11% branches, 82.54% lines, 85%+ functions (CI passing)
- **Test Execution Time:** Frontend ~20.3s, Backend ~12.1s, Database ~0.3s, E2E ~45s
- **Coverage Target:** 90% ✅ EXCEEDED (96.71% middleware statements, 93.49% middleware branches)
- **Recent Updates:** Multi-Select Analytics & Campaign Trials (January 7, 2026 - v3.3.5)

---

## 🏗️ Testing Layers

### Layer 1: Unit Tests (Fastest, ~7s)
**What:** Test individual functions/components in isolation
**When:** Every code change
**Database Required:** No

```bash
# Backend
cd server && npm run test:unit          # 133 tests

# Frontend
cd client && npm test                    # 513 tests
```

### Layer 2: Integration Tests (~5s)
**What:** Test multiple components working together
**When:** Feature complete, before merge
**Database Required:** No

```bash
cd server && npm run test:integration    # 111 tests
```

### Layer 3: Database Tests (~0.25s)
**What:** Test database schema, migrations, constraints
**When:** Database changes made
**Database Required:** Yes (Docker PostgreSQL on port 5433)

```bash
# See "Database Testing Workflow" section below
cd server && npm run test:db             # 25 tests
```

### Layer 4: E2E Tests (~45s)
**What:** Test complete user flows in real browser
**When:** Critical paths, before major releases
**Database Required:** Optional

```bash
cd client && npm run test:e2e            # 10 tests
```

---

## 🗂️ Database Testing Workflow

**For releases with database migrations:**

```bash
# 1. Start test database (if not already running)
cd server && npm run test:db:setup
# Creates Docker container: postgres:16 on port 5433

# 2. Apply migrations to test DB
POSTGRES_URL=postgresql://test_user:test_password@localhost:5433/codescribe_test \
  npm run migrate

# 3. Run database tests
npm run test:db
# Expected: All 25+ tests pass

# 4. Apply migrations to development DB
npm run migrate
# Uses .env POSTGRES_URL (your local/Neon dev database)

# 5. Test application with new schema
npm run dev
# Verify all features work with migrated schema

# 6. Commit migration + tests
git add src/db/migrations/*.sql src/db/__tests__/*.test.js
git commit -m "Add migration XXX with tests"

# Production deployment: Vercel automatically runs migrations
# See vercel.json buildCommand: "npm run migrate"
```

**Note:** Database tests are **excluded from CI** (GitHub Actions). They run locally before merge to verify migrations work correctly. Vercel applies migrations automatically during deployment.

---

## 📋 Pre-Deployment Checklists

### For Releases WITHOUT Database Changes
**Example:** v2.0.1 (OAuth UX, storage improvements)

```bash
# Testing
□ cd server && npm test                 # Backend unit/integration
□ cd client && npm test                 # Frontend tests
□ Manual smoke test: npm run dev

# Quality
□ npx prettier --check "src/**/*.js"   # Linting
□ cd client && npm run build           # Build succeeds
□ No console errors in browser

# Documentation
□ CHANGELOG.md updated
□ package.json versions bumped (root, client, server)

# Deployment
□ git push origin main
□ GitHub Actions green ✅
□ Vercel deployment succeeds
□ Production smoke test (visit site, test OAuth flow)
□ Monitor Vercel Analytics for 24 hours
```

### For Releases WITH Database Changes
**Example:** v2.1.0 (migrations 004-005)

```bash
# Database Testing (see workflow above)
□ Docker test DB running
□ Migrations applied to test DB
□ npm run test:db passes (all 25+ tests)
□ Migrations applied to dev DB
□ npm run migrate:validate passes
□ App tested with new schema

# Standard Testing
□ All unit/integration tests pass
□ Build succeeds, linting passes
□ Documentation updated

# Database Documentation
□ Migration documented in CHANGELOG.md
□ Follows DB-NAMING-STANDARDS.md (if schema changes)
□ Migration has descriptive name and SQL comments

# Deployment
□ git push origin main
□ GitHub Actions green ✅
□ Monitor Vercel build logs (migrations auto-run)
□ Verify production database (check Neon dashboard)
□ Production smoke test (test DB-dependent features)
□ Monitor for 24-48 hours (error rates, DB performance)
```

**Emergency Rollback:**
- If migration fails: Create fix-forward migration (never modify applied migrations)
- Prevention: Always use `IF NOT EXISTS`, test in Docker first, make migrations idempotent

---

## 📚 Testing Documentation Index

### 🎯 Component Testing

#### [Component Test Coverage](./COMPONENT-TEST-COVERAGE.md) ⭐ **START HERE**
**Complete overview of all component tests**

- ✅ **1,172 frontend tests** - 1,154 passing, 18 skipped (98.5%)
- ✅ **18/18 components** - All components tested
- ✅ **Recent additions:** PricingPage (35 tests), ContactSalesModal, HelpModal

**Key Features:**
- Detailed test breakdown by component
- Coverage metrics and analysis
- Testing patterns and best practices
- Recommendations for untested components

---

### 📖 Guides & References

#### [Frontend Testing Guide](./frontend-testing-guide.md)
**Comprehensive guide for React component testing patterns**

- Testing framework (Vitest + React Testing Library)
- Best practices and patterns
- Mocking strategies
- Accessibility testing

#### [Test Guide](./TEST-GUIDE.md)
**Quick reference for running tests**

- Quick start commands
- Watch mode
- Coverage reports
- Debugging tips

---

### 🔍 Specialized Test Documentation

#### [Skipped Tests Reference](./SKIPPED-TESTS.md) ⭐ **MAINTENANCE**
**Central reference for all intentionally skipped tests**

- 85 total skipped tests (57 frontend, 28 backend)
- Complete justification for each skip
- Line numbers and file paths for quick reference
- Verification commands and review schedule
- Zero production impact - all intentional

#### [Error Handling Tests](./ERROR-HANDLING-TESTS.md)
**Error handling test suite documentation**

- ErrorBanner (58 tests) - User-facing error notifications
- ErrorBoundary (12 tests) - Technical error catching
- Animation specs (250ms enter, 200ms exit)
- WCAG 2.1 AA accessibility compliance

#### [Mermaid Diagram Tests](./MERMAID-DIAGRAM-TESTS.md)
**Mermaid diagram rendering test suite**

- Diagram rendering (14 tests)
- Brand theming (purple, indigo, slate)
- Error handling
- Async rendering and cleanup

#### [Monaco Syntax Highlighting Tests](./monaco-syntax-highlighting-tests.md)
**Monaco Editor syntax highlighting tests**

- Language support verification
- Theme configuration
- Editor integration

#### [Database Testing Guide](./DATABASE-TESTING-GUIDE.md) ⭐ **RECOMMENDED**
**Comprehensive database testing best practices**

- Testing layers (unit, schema, integration, performance)
- Migration testing strategy
- Test database setup (Docker PostgreSQL)
- CI/CD integration patterns
- **Test suite separation** (database tests excluded from default suite)
- Current implementation (25 tests, migrations 004-005)

#### [Database Migration Tests](./DATABASE-MIGRATION-TESTS.md)
**Automated migration system test suite**

- Migration file naming conventions (40 tests)
- Checksum calculation and validation
- Migration sorting and ordering
- Environment detection (local/dev/preview/production)
- PostgreSQL error code handling

#### [Authentication Tests](./AUTH-TESTS.md)
**Authentication system test suite**

- Auth middleware (41 tests) - JWT, session, OAuth validation
- User model (33 tests) - CRUD operations, password hashing
- Auth routes (28 tests) - Login, register, logout, OAuth
- Total: 102 tests covering complete auth flow

#### [Auth Security Tests](./AUTH-SECURITY-TESTS.md)
**Security-focused authentication tests**

- Password security (bcrypt, strength validation)
- JWT token security (signature, expiration)
- Session security (hijacking, fixation prevention)
- OAuth security (CSRF, state validation)

#### [Password Reset E2E Tests](./PASSWORD-RESET-E2E-TESTS.md)
**End-to-end password reset flow tests**

- Email verification flow
- Token generation and validation
- Password update workflow
- Email service integration (Resend)

---

### 📋 Implementation & Reports

#### [Implementation Summary](./IMPLEMENTATION-SUMMARY.md)
**Backend test implementation summary**

- Jest configuration
- Service layer tests
- Integration tests
- Coverage requirements

#### [Prompt Quality Report](./PROMPT-QUALITY-REPORT.md)
**AI prompt quality testing results**

- Prompt validation tests
- Quality metrics
- Claude API integration tests

---

### 🌐 Accessibility & Cross-Browser Testing

#### [Cross-Browser Test Plan](./CROSS-BROWSER-TEST-PLAN.md)
**Comprehensive cross-browser testing strategy**

- Browser compatibility matrix (Chrome, Firefox, Safari, Edge)
- Test execution procedures
- Known issues and workarounds
- Responsive design verification

#### [Screen Reader Testing Guide](./SCREEN-READER-TESTING-GUIDE.md)
**Accessibility testing with assistive technologies**

- Screen reader setup (NVDA, JAWS, VoiceOver)
- Testing procedures for key user flows
- WCAG 2.1 AA compliance verification
- Keyboard navigation testing

---

### 📊 Performance & Audit Reports

#### [Accessibility Audit](./ACCESSIBILITY-AUDIT.MD)
**Comprehensive accessibility audit results**

- Lighthouse accessibility scores
- WCAG compliance verification
- Remediation status tracking
- Testing methodology

---

## 🧪 Component Test Status

---

### Backend Testing
**Framework:** Jest

#### [Monaco Editor Syntax Highlighting Tests](./monaco-syntax-highlighting-tests.md)
**Ensures generated documentation has proper syntax highlighting markers**

- ✅ **11 tests** - Validates Monaco Editor integration
- ✅ **24+ languages** - Multi-language support verification
- ✅ **Performance metrics** - Render time benchmarks
- ✅ **Accessibility** - WCAG 2.1 Level AA compliance

**Test Categories:**
1. Code Block Format Verification
2. Multi-Language Support
3. Code Block Patterns
4. Theme Compatibility
5. Special Character Handling
6. Performance Considerations
7. Accessibility Compliance

---

## 🚀 Quick Start

### Running Frontend Tests

```bash
# Navigate to client directory
cd client

# Run all tests
npm test

# Run tests once (no watch)
npm test -- --run

# Run with coverage
npm test:coverage

# Run specific test file
npm test -- DocPanel.test.jsx
```

### Running Backend Tests

```bash
# Navigate to server directory
cd server

# Run all tests
npm test

# Run specific test suite
npm test -- prompt-quality.test.js

# Run Monaco syntax highlighting tests only
npm test -- prompt-quality.test.js -t "Monaco Editor"
```

---

## 📊 Test Coverage Summary

### Frontend
| Component | Tests | Statements | Branches | Functions | Lines |
|-----------|-------|------------|----------|-----------|-------|
| DocPanel  | 45    | 95.45%     | 88.89%   | 100%      | 95.24%|
| ControlBar| 51    | 100%       | 100%     | 100%      | 100%  |
| **Total** | **96**| **97%+**   | **94%+** | **100%**  | **97%+**|

### Backend
| Service       | Tests | Status |
|---------------|-------|--------|
| docGenerator  | ✅    | Passing|
| claudeClient  | ✅    | Passing|
| codeParser    | ✅    | Passing|
| qualityScorer | ✅    | Passing|
| **Monaco Integration** | **11** | **✅ Passing**|

---

## 🎯 Testing Strategy

### Test Pyramid

```
        /\
       /  \         E2E Tests (Manual QA for MVP)
      /----\        Integration Tests (File Upload, Prompt Quality)
     /------\       Unit Tests (Components, Services)
    /--------\
```

### Coverage Goals
- ✅ **Frontend:** ≥ 90% (Current: 95.45%)
- ✅ **Backend:** ≥ 85% (Current: ~90%)
- ✅ **Integration:** Critical paths covered
- ⏳ **E2E:** Manual QA before launch

---

## 📝 What's Tested

### Frontend (Client)
✅ **Component Rendering**
- Empty states
- Loading states
- Documentation display
- Quality score badges

✅ **User Interactions**
- Button clicks
- Form submissions
- Modal triggers

✅ **Markdown Rendering**
- Headings, lists, links
- GitHub Flavored Markdown (tables, task lists, strikethrough)
- Code blocks with syntax highlighting
- Inline code formatting

✅ **Syntax Highlighting**
- Multiple languages (JS, TS, Python, Java, Go, etc.)
- react-syntax-highlighter integration
- Special character escaping
- Code tokenization

✅ **State Management**
- Empty → Loading transitions
- Loading → Documentation transitions
- Streaming documentation updates
- Quality score updates

✅ **Accessibility**
- Heading hierarchy
- Button accessibility
- Link attributes
- Screen reader support

✅ **Edge Cases**
- Empty strings
- Very long documentation
- Malformed markdown
- HTML entities
- Special characters

---

### Backend (Server)
✅ **Documentation Generation**
- README templates
- JSDoc templates
- API documentation templates
- ARCHITECTURE templates

✅ **Code Analysis**
- Function detection
- Class detection
- Import/export analysis
- Complexity metrics
- Cyclomatic complexity
- Maintainability index

✅ **Quality Scoring**
- 5 criteria scoring (Overview, Installation, Usage, API, Structure)
- Grade calculation (A-F)
- Feedback generation
- Strengths/improvements identification

✅ **Claude API Integration**
- Streaming responses (SSE)
- Error handling
- Retry logic
- Rate limiting

✅ **File Upload**
- Single file uploads
- Multiple file uploads
- File size validation
- File type validation
- Temporary file cleanup

✅ **Monaco Editor Prompts**
- Code block formatting instructions
- Language identifier validation
- Multi-language support
- Theme compatibility
- Performance considerations
- Accessibility standards

---

## 🔧 Test Infrastructure

### Frontend Setup
```
client/
├── vitest.config.js          # Vitest configuration
├── src/
│   ├── test/
│   │   └── setup.js          # Test environment setup
│   └── components/
│       └── __tests__/
│           └── DocPanel.test.jsx  # DocPanel tests (45)
└── package.json              # Test scripts
```

### Backend Setup
```
server/
├── jest.config.cjs           # Jest configuration
├── src/
│   └── services/
│       └── __tests__/        # Unit tests
│           ├── docGenerator.test.js
│           ├── claudeClient.test.js
│           ├── codeParser.test.js
│           └── qualityScorer.test.js
└── tests/
    └── integration/          # Integration tests
        ├── prompt-quality.test.js  # Monaco tests (11)
        ├── quality-scoring.test.js
        └── file-upload.test.js
```

---

## 🎓 Best Practices

### 1. **Test User Behavior, Not Implementation**
```javascript
// ✅ Good: Test what the user sees
expect(screen.getByText('Submit')).toBeInTheDocument();

// ❌ Bad: Test internal state
expect(component.state.isSubmitting).toBe(false);
```

### 2. **Use Accessible Queries**
```javascript
// ✅ Good: Use semantic roles
screen.getByRole('button', { name: /submit/i });

// ❌ Bad: Use test IDs
screen.getByTestId('submit-button');
```

### 3. **Test Edge Cases**
```javascript
// Test empty states, loading states, error states
// Test long inputs, special characters, malformed data
// Test rapid state changes, concurrent operations
```

### 4. **Keep Tests Fast**
```javascript
// ✅ Good: Mock expensive operations
vi.mock('./api', () => ({ fetch: vi.fn() }));

// ❌ Bad: Make real API calls
await fetch('http://api.example.com/data');
```

### 5. **Write Descriptive Test Names**
```javascript
// ✅ Good
it('should display error message when email is invalid', () => {});

// ❌ Bad
it('test email validation', () => {});
```

---

## 📈 Continuous Integration

### Pre-commit Hooks (Recommended)
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test -- --run"
    }
  }
}
```

### GitHub Actions (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --run
      - run: npm test:coverage
```

---

## 🐛 Debugging Tests

### View Test Output
```bash
# Verbose output
npm test -- --reporter=verbose

# Show all console.logs
npm test -- --silent=false

# Run single test
npm test -- -t "should render documentation"
```

### Debug in VS Code
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["--run"],
  "console": "integratedTerminal"
}
```

### Common Issues
1. **Tests timeout** → Increase timeout in test
2. **Element not found** → Use waitFor for async elements
3. **Multiple elements** → Use getAllBy instead of getBy
4. **Flaky tests** → Add proper async handling

---

## 📚 Additional Resources

### Documentation
- [Frontend Testing Guide](./frontend-testing-guide.md) - Complete frontend testing documentation
- [Monaco Syntax Highlighting Tests](./monaco-syntax-highlighting-tests.md) - Backend prompt validation
- [Cross-Browser Test Plan](./CROSS-BROWSER-TEST-PLAN.md) - Cross-browser testing strategy
- [Screen Reader Testing Guide](./SCREEN-READER-TESTING-GUIDE.md) - Accessibility testing with screen readers
- [Accessibility Audit](./ACCESSIBILITY-AUDIT.MD) - Comprehensive accessibility audit results
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)

### CodeScribe AI Docs
- [PRD](../planning/01-PRD.md) - Product requirements
- [Architecture](../architecture/ARCHITECTURE.md) - System design
- [Dev Guide](../planning/05-Dev-Guide.md) - Implementation guide
- [API Reference](../api/API-Reference.md) - API documentation

---

## ✅ Testing Checklist

### Before Committing
- [ ] All tests passing (`npm test -- --run`)
- [ ] Coverage ≥ 90% (`npm test:coverage`)
- [ ] No console errors or warnings
- [ ] New features have tests
- [ ] Tests are descriptive and clear

### Before Deploying
- [ ] All integration tests passing
- [ ] Manual QA on critical paths
- [ ] Performance benchmarks met
- [ ] Accessibility verified (see [ACCESSIBILITY-AUDIT.MD](./ACCESSIBILITY-AUDIT.MD))
- [ ] Cross-browser testing complete (see [CROSS-BROWSER-TEST-PLAN.md](./CROSS-BROWSER-TEST-PLAN.md))
- [ ] Screen reader testing complete (see [SCREEN-READER-TESTING-GUIDE.md](./SCREEN-READER-TESTING-GUIDE.md))

---

## 🎯 Success Metrics

### Current Status
✅ **Frontend:** 96 tests, 97%+ coverage, 0 failures
✅ **Backend:** 50+ tests, ~90% coverage, 0 failures
✅ **Monaco Integration:** 11 tests, 100% passing
✅ **Test Speed:** < 2 seconds (frontend), < 60 seconds (backend)

**Overall:** 🎉 **Excellent test coverage and quality!**

### Component Breakdown
- ✅ **DocPanel:** 45 tests, 95.45% coverage
- ✅ **ControlBar:** 51 tests, 100% coverage
- ⏳ **CodePanel:** Planned
- ⏳ **QualityScore:** Planned

---

**Last Updated:** December 4, 2025 (v3.0.0)
**Test Framework Versions:**
- Vitest: 3.2.4
- React Testing Library: 16.3.0
- Jest: 29.7.0

**Status:** ✅ All tests passing (97.4%), ready for production
