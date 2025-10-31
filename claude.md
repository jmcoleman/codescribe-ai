# CodeScribe AI - Claude Context Reference

**Project:** AI-Powered Code Documentation Generator
**Status:** ✅ **PRODUCTION** - [codescribeai.com](https://codescribeai.com)
**Tech Stack:** React 19 + Vite | Node.js + Express | Claude API | Tailwind CSS
**Completion:** October 19, 2025 (9 days) | All times in EST/EDT

---

## 📋 Quick Overview

AI-powered documentation generator with real-time streaming, quality scoring (0-100), and WCAG 2.1 AA compliance.

**Key Metrics:**
- 1,662 tests (1,625 passing, 36 skipped, 1 flaky) | 95.81% backend coverage
- Lighthouse: 75/100 performance (+67%), 100/100 accessibility
- Bundle: 78KB gzipped (-85% reduction)
- Accessibility: 95/100 score, 0 axe violations

**Features:** 4 doc types (README, JSDoc, API, ARCHITECTURE) | Monaco Editor | Mermaid diagrams | SSE streaming

---

## 🗺️ Documentation Quick Reference

### 📐 Planning & Requirements
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [01-PRD.md](docs/planning/mvp/01-PRD.md) | Product vision, requirements | Feature specs (FR-1.x to FR-5.x), NFRs, acceptance criteria, roadmap |
| [02-Epics-Stories.md](docs/planning/mvp/02-Epics-Stories.md) | User stories, sprint planning | 5 epics, story points, DoR/DoD, day-by-day breakdown |
| [03-Todo-List.md](docs/planning/mvp/03-Todo-List.md) | Daily task tracking | Day 1-5 tasks, setup instructions, checkpoints |
| [MVP-DELIVERY-SUMMARY.md](docs/planning/mvp/MVP-DELIVERY-SUMMARY.md) | Interview/portfolio highlight ⭐ | 9-day delivery, 100% completion, 1,381+ tests, quality metrics, PM competencies |
| [MVP-DEPLOY-LAUNCH.md](docs/planning/mvp/MVP-DEPLOY-LAUNCH.md) | MVP deployment guide | Vercel deployment, troubleshooting, launch checklist, post-launch monitoring |

### 🏗️ Architecture & Development
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [ARCHITECTURE-OVERVIEW.md](docs/architecture/ARCHITECTURE-OVERVIEW.md) | Visual system architecture | Mermaid diagram, layer overview, quick reference |
| [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | Deep technical details | Design patterns, data flows, security, deployment |
| [SUBSCRIPTION-MANAGEMENT.md](docs/architecture/SUBSCRIPTION-MANAGEMENT.md) | Subscription flows ⭐ | Hybrid proration (upgrade/downgrade), testing guide, webhooks |
| [PROMPT-CACHING-GUIDE.md](docs/architecture/PROMPT-CACHING-GUIDE.md) | Cost optimization ⭐ | Caching strategy, adding examples, savings analysis ($50-300/mo) |
| [05-Dev-Guide.md](docs/planning/mvp/05-Dev-Guide.md) | Implementation patterns | Complete service code, best practices, deployment |
| [API-Reference.md](docs/api/API-Reference.md) | API specs | 4 endpoints, request/response formats, error codes |

### 📊 Performance & Testing
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [OPTIMIZATION-GUIDE.md](docs/performance/OPTIMIZATION-GUIDE.md) | Performance optimization | Lazy loading, bundle analysis, Core Web Vitals, maintenance |
| [Testing README](docs/testing/README.md) | Test navigation hub | 1,662 test stats, quick commands, coverage overview |
| [COMPONENT-TEST-COVERAGE.md](docs/testing/COMPONENT-TEST-COVERAGE.md) | Coverage details ⭐ | 13/18 components tested, category breakdown, gaps |
| [frontend-testing-guide.md](docs/testing/frontend-testing-guide.md) | React testing patterns | Vitest + RTL, mocking, a11y, interactions |
| [TEST-FIXES-OCT-2025.md](docs/testing/TEST-FIXES-OCT-2025.md) | Test fix patterns ⭐ | 75 tests fixed, 10 patterns, 6 technical insights, 97.3% pass rate |

**Specialized Tests:** [ERROR-HANDLING-TESTS.md](docs/testing/ERROR-HANDLING-TESTS.md) (58 tests) | [MERMAID-DIAGRAM-TESTS.md](docs/testing/MERMAID-DIAGRAM-TESTS.md) (14 tests) | [CROSS-BROWSER-TEST-PLAN.md](docs/testing/CROSS-BROWSER-TEST-PLAN.md) | [ACCESSIBILITY-AUDIT.MD](docs/testing/ACCESSIBILITY-AUDIT.MD)

### 🎨 Design & Components
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [07-Figma-Guide.md](docs/planning/mvp/07-Figma-Guide.md) | Design system | Colors (purple/indigo/slate), typography, 8 components, UI patterns |
| [brand-color-palette.html](docs/design/theming/brand-color-palette.html) | Color reference | 27 colors, click-to-copy hex codes, WCAG AA info |
| [THEME-DESIGN-SUMMARY.md](docs/design/theming/THEME-DESIGN-SUMMARY.md) | Theme overview | Light + dark theme design specs, color systems, shadows |
| [TOAST-SYSTEM.md](docs/components/TOAST-SYSTEM.md) | Toast notifications | 20+ utilities, 6 custom toasts, a11y support |
| [MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md) | Diagram patterns | Brand theming, React integration, troubleshooting |
| [ERROR-HANDLING-UX.md](docs/components/ERROR-HANDLING-UX.md) | Error UX | Banners vs modals, animations (250ms/200ms), a11y, priority system |
| [USAGE-PROMPTS.md](docs/components/USAGE-PROMPTS.md) | Usage warnings & limits | 80% banner, 100% modal, dynamic multipliers, simulator |
| [COPYBUTTON.md](docs/components/COPYBUTTON.md) | Copy-to-clipboard | Variants, animation timeline, best practices |
| [SELECT-USAGE.md](docs/components/SELECT-USAGE.md) | Dropdown component | Headless UI patterns, keyboard nav, a11y |

### 🛠️ Utilities
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [VERSION-CHECKER.md](docs/scripts/VERSION-CHECKER.md) | Package versions | `npm run versions`, output format, update protocol |

---

## 🔑 Technical Essentials

### Core Services (Backend)
1. **claudeClient.js** - Claude API, streaming, retries
2. **docGenerator.js** - Doc generation, prompt building, orchestration
3. **codeParser.js** - AST parsing (Acorn), function/class extraction
4. **qualityScorer.js** - 5-criteria scoring (0-100 scale)

### API Endpoints
- `POST /api/generate` - Standard generation
- `POST /api/generate-stream` - SSE streaming
- `POST /api/upload` - File upload
- `GET /api/health` - Health check

### Quality Scoring (100 points)
1. Overview/Description (20) | 2. Installation (15) | 3. Usage Examples (20) | 4. API Docs (25) | 5. Structure (20)
**Grading:** A (90+), B (80-89), C (70-79), D (60-69), F (<60)

### Tech Stack
> **📊 Get exact versions:** `npm run versions` ([VERSION-CHECKER.md](docs/scripts/VERSION-CHECKER.md))

**Frontend:** React 19 + Vite | Tailwind CSS 3.4+ | Monaco Editor | react-markdown | Lucide React
**Backend:** Node.js 20+ | Express 5 | Claude API (Sonnet 4.5) | Acorn | Multer
**Database:** Neon Postgres (via Vercel Marketplace) | @vercel/postgres SDK | connect-pg-simple sessions
**Infrastructure:** Vercel | Neon (free tier: 512 MB, 20 projects) | SSE streaming

### Prompt Caching (Cost Optimization)
> **💰 Saves $50-300/month** | Active November 1, 2025 | See [PROMPT-CACHING-GUIDE.md](docs/architecture/PROMPT-CACHING-GUIDE.md) for details

**What we cache:**
- **System prompts** (doc type instructions ~2K tokens) - Always cached (90% cost reduction)
- **Default/example code** - Cached when detected (additional 50% reduction)

**How it works:**
- Anthropic caches processed prompts for 5 minutes
- Second user within 5 min = 90% savings on cached portions
- Automatic detection: `code === DEFAULT_CODE` triggers caching

**Implementation:**
```javascript
// Backend: claudeClient.js adds cache_control to prompts
cache_control: { type: 'ephemeral' }

// Frontend: App.jsx detects default code
const isDefaultCode = code === DEFAULT_CODE;
await generate(code, docType, language, isDefaultCode);
```

**Monitor performance:**
```bash
# Look for cache stats in backend logs (starts Nov 1)
[ClaudeClient] Cache stats: { cache_read_input_tokens: 2000 } # 90% savings!
```

**Test when API resets:** `node server/tests/prompt-caching.test.js` (November 1, 2025)

**Adding new examples:** Update `EXAMPLE_CODES` in [defaultCode.js](client/src/constants/defaultCode.js), use exact string matching for cache hits

---

## 📖 Claude Usage Guidelines

### 1. Question Type → Document Mapping
| Question Type | Reference |
|--------------|-----------|
| Planning/Scope | PRD, Epics |
| Implementation | Dev Guide, Master Prompt |
| API/Endpoints | API Reference |
| Design/UI | Figma Guide, Brand Color Palette |
| Architecture | ARCHITECTURE-OVERVIEW.md (visual), ARCHITECTURE.md (technical) |
| Subscriptions/Payments | SUBSCRIPTION-MANAGEMENT.md (upgrade/downgrade flows, proration, webhooks) |
| Performance | OPTIMIZATION-GUIDE.md |
| Cost Optimization | PROMPT-CACHING-GUIDE.md (caching strategy, adding examples, savings) |
| Testing | Testing README, COMPONENT-TEST-COVERAGE.md, TEST-FIXES-OCT-2025.md, SKIPPED-TESTS.md |
| Test Fixes/Patterns | TEST-FIXES-OCT-2025.md (10 patterns, 6 insights, frontend + backend) |
| Skipped Tests | SKIPPED-TESTS.md (36 tests documented, quarterly review schedule) |
| Accessibility | ACCESSIBILITY-AUDIT.MD, SCREEN-READER-TESTING-GUIDE.md |
| Components | TOAST-SYSTEM.md, ERROR-HANDLING-UX.md, USAGE-PROMPTS.md, COPYBUTTON.md, etc. |
| Versions | Run `npm run versions`, VERSION-CHECKER.md |
| Database | DB-NAMING-STANDARDS.md, DB-MIGRATION-MANAGEMENT.MD, USAGE-QUOTA-SYSTEM.md, PRODUCTION-DB-SETUP.md |
| Release/Deployment | RELEASE-QUICKSTART.md (prep for release vs. deploy), VERCEL-DEPLOYMENT-GUIDE.md |

### 2. Best Practices
- ✅ **Always cite sources:** Mention document name + file path
- ✅ **Be implementation-ready:** Include code examples, file paths, dependencies
- ✅ **Cross-reference:** Multiple docs cover same topic from different angles
- ✅ **Stay consistent:** Don't invent features; respect scope boundaries
- ✅ **Version accuracy:** Run `npm run versions` before citing package versions

### 3. Key Cross-References
- **Architecture:** ARCHITECTURE-OVERVIEW.md (visual) → ARCHITECTURE.md (technical) → Dev Guide (implementation)
- **Performance:** OPTIMIZATION-GUIDE.md (comprehensive) → Dev Guide (techniques) → ARCHITECTURE.md (targets)
- **Testing:** Testing README (overview) → COMPONENT-TEST-COVERAGE.md (details) → frontend-testing-guide.md (patterns) → TEST-FIXES-OCT-2025.md (fixes & patterns) → SKIPPED-TESTS.md (maintenance)
- **Test Debugging:** TEST-FIXES-OCT-2025.md (10 patterns, 6 insights) for fixing auth tests, mocking, validation
- **Skipped Tests:** SKIPPED-TESTS.md - Update on every release, quarterly review (15 frontend tests intentionally skipped)
- **Error Handling:** ERROR-HANDLING-UX.md (UX patterns, priority system) → USAGE-PROMPTS.md (usage warnings/limits) → TOAST-SYSTEM.md (success toasts)
- **Accessibility:** ACCESSIBILITY-AUDIT.MD (results) → SCREEN-READER-TESTING-GUIDE.md (procedures)
- **Release Process:** RELEASE-QUICKSTART.md - Two-phase process (Phase 1: Prep for Release, Phase 2: Release Deployment)

---

## ⚙️ Critical Implementation Guidelines

### E2E Testing: Wait for Events, Not Timeouts

**❌ NEVER:** Arbitrary timeouts (race conditions, browser-specific failures)
```javascript
await page.setInputFiles('input[type="file"]', file);
await page.waitForTimeout(1000); // BAD: Flaky across browsers
```

**✅ ALWAYS:** Wait for actual events
```javascript
// 1. Network responses
const uploadPromise = page.waitForResponse(
  res => res.url().includes('/api/upload') && res.status() === 200,
  { timeout: 10000 }
);
await page.setInputFiles('input[type="file"]', file);
await uploadPromise; // Guaranteed completion

// 2. DOM state changes
await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });

// 3. Lazy-loaded components
await page.waitForSelector('.monaco-editor', { state: 'visible', timeout: 10000 });
```

**Checklist:**
- [ ] Network request? → `page.waitForResponse()`
- [ ] UI update? → `expect().toBeVisible()` or `waitForFunction()`
- [ ] Lazy component? → Wait for selector + initialization
- [ ] Arbitrary timeout? → Replace with event-based waiting

### Timezone Awareness (EST/EDT)
**When adding session labels to docs:**
1. Check current time in `<env>`
2. Convert to EST (UTC-5) or EDT (UTC-4, Mar-Nov)
3. Use appropriate label:
   - Morning: 6am-12pm | Afternoon: 12pm-5pm | Evening: 5pm-9pm | Night: 9pm-6am
4. Only use generic "Session" if time unavailable or spans multiple periods

### Mermaid Diagrams
**Quick reference** ([full guide](docs/components/MERMAID-DIAGRAMS.md)):
- **Legend placement:** Last in code (renders top-left)
- **Styling:** White bg, slate border, compact `<br/>` format
- **Format:** `L["🟣 Purple - Client<br/>🔵 Indigo - Services<br/>..."]`

### Package Versions
**Always run before citing versions:**
```bash
npm run versions  # See VERSION-CHECKER.md for details
```

### Skipped Tests Documentation
**ALWAYS keep SKIPPED-TESTS.md current** ([full guide](docs/testing/SKIPPED-TESTS.md)):

**When skipping a test:**
1. ✅ Add skip reason comment in test file: `// TODO: Skipped because [reason]`
2. ✅ Use `.skip()` method: `it.skip('test name', () => {})`
3. ✅ Document in SKIPPED-TESTS.md with:
   - File path and line number
   - Category (Database, Feature Not Implemented, Timing, jsdom Limitation, etc.)
   - Clear justification for skipping
   - When to unskip (conditions or phase/epic)
   - Verification that core functionality is tested elsewhere
4. ✅ Update "Total Skipped" count in header
5. ✅ Update Quick Summary table

**When unskipping a test:**
1. ✅ Remove `.skip()` from test
2. ✅ Verify test passes: `npm test -- path/to/test.jsx`
3. ✅ Remove entry from SKIPPED-TESTS.md
4. ✅ Update "Total Skipped" count
5. ✅ Update test counts in documentation

**On every release:**
- [ ] Run verification commands: `cd client && npm test -- --run 2>&1 | grep "skipped"`
- [ ] Check if skipped count changed from previous release (currently 15 frontend tests)
- [ ] Update "Last Updated" date in SKIPPED-TESTS.md
- [ ] Review quarterly (every 3 months) to ensure all skips still valid

**Note:** Backend shows "1 skipped" test suite (database tests in `/src/db/__tests__/`), but these are **intentionally excluded** via jest.config.cjs and run separately in Docker sandbox before deployment. They are NOT counted as "skipped tests" for release tracking - only the 15 frontend `.skip()` tests are tracked.

**Philosophy:** Every skipped test needs clear justification + zero production impact

### Database Naming Standards
**ALWAYS follow these conventions** ([full guide](docs/database/DB-NAMING-STANDARDS.md)):

**When creating/modifying database entities:**
1. ✅ **Tables:** Plural, snake_case (`users`, `user_quotas`)
2. ✅ **Columns:** Singular, snake_case (`user_id`, `created_at`)
3. ✅ **Indexes:** `idx_<table>_<column>` pattern (`idx_users_email`, `idx_user_quotas_user_period`)
4. ✅ **Foreign Keys:** Explicit `ON DELETE` behavior (CASCADE, SET NULL, RESTRICT)
5. ✅ **Constraints:** Descriptive names (`unique_user_period`, `check_positive_count`)
6. ✅ **Migrations:** Use `CREATE TABLE IF NOT EXISTS`, include verification queries

**Pre-migration checklist:**
- [ ] Read [DB-NAMING-STANDARDS.md](docs/database/DB-NAMING-STANDARDS.md) for complete guidelines
- [ ] Test in Docker sandbox first: See [DB-MIGRATION-MANAGEMENT.MD](docs/database/DB-MIGRATION-MANAGEMENT.MD#database-environments--testing-workflow)
- [ ] Apply to Neon dev: `npm run migrate`
- [ ] Validate: `npm run migrate:validate`
- [ ] Never modify migrations after they've been applied

**Migration Testing Workflow:**
1. **Sandbox (Docker):** Test migration in isolated environment (port 5433)
   - Run `npm run test:db:setup` to start Docker container
   - Run `npm run test:db -- migrations-XXX` to test migration
   - Verify all tests pass (schema, indexes, constraints, data insertion)
   - **⚠️ CRITICAL: ALWAYS ask user for approval before proceeding to step 2**
2. **Dev (Neon):** Apply to persistent dev database ONLY after user confirms sandbox passed
   - Run `npm run migrate` to apply migration to Neon dev
   - Run `npm run migrate:validate` to verify integrity
   - Run full test suite: `npm test` (backend) and `cd client && npm test -- --run` (frontend)
3. **Production:** Automatic deployment when pushed to `main` branch

**⚠️ SAFETY RULE: Never run `npm run migrate` (Neon) without explicit user approval after Docker sandbox tests pass.**

---

## 🚀 Quick Commands

```bash
# Development
cd server && npm run dev        # Backend: http://localhost:3000
cd client && npm run dev        # Frontend: http://localhost:5173

# Database (run from server/ directory)
npm run migrate                 # Run pending migrations on Neon dev
npm run migrate:status          # Show migration status
npm run migrate:validate        # Validate migration integrity

# Database Testing (Docker sandbox)
npm run test:db:setup           # Start Docker test database
npm run test:db                 # Run database integration tests
npm run test:db:teardown        # Stop Docker test database
# See: docs/database/DB-MIGRATION-MANAGEMENT.MD for full testing workflow

# Versions
npm run versions                # Comprehensive version report

# Environment
# server/.env: CLAUDE_API_KEY, PORT, NODE_ENV, POSTGRES_URL
# client/.env: VITE_API_URL

# Testing
cd client && npm test -- --run  # Run frontend tests (get counts)
cd server && npm test           # Run backend tests (get counts)
```

---

## 📋 Version Bump Checklist

**IMPORTANT:** When incrementing version in package.json files, always update test counts:

```bash
# 1. Get current test counts
cd client && npm test -- --run 2>&1 | grep "Tests:"
# Output example: Tests  926 passed | 15 skipped (941)

cd .. && cd server && npm test 2>&1 | grep "Tests:"
# Output example: Tests:       21 skipped, 373 passed, 394 total

# 2. Update documentation with new counts
# - claude.md line 15: "1,662 tests (1,625 passing, 36 skipped, 1 flaky)"
# - claude.md line 47: "1,662 test stats"
# - claude.md line 380: "1,662 tests (1,104 frontend, 521 backend, 36 skipped)"
# - docs/testing/README.md lines 11-27: Update all test breakdowns

# 3. Verify skipped tests documentation is current
# Run verification commands from SKIPPED-TESTS.md:
cd client && npm test -- --run 2>&1 | grep "skipped"
# Output shows which test files have skipped tests

cd server && npm test 2>&1 | grep "skipped"
# Output shows: "Test Suites: 1 skipped, X passed"

# If skipped test counts changed:
# - Review docs/testing/SKIPPED-TESTS.md
# - Update "Total Skipped" count in header
# - Update Quick Summary table
# - Update "Last Updated" date to current release date
# - Document any new skipped tests with justification
```

**Files to update on version bump:**
- [ ] `package.json` (root) - Bump version
- [ ] `client/package.json` - Bump version
- [ ] `server/package.json` - Bump version
- [ ] `claude.md` - Update test counts (3 locations: lines 15, 47, 284)
- [ ] `docs/testing/README.md` - Update Quick Stats section (lines 11-27)
- [ ] `docs/testing/SKIPPED-TESTS.md` - Verify skipped test counts and update "Last Updated" date
- [ ] `CHANGELOG.md` - Add version entry with changes
- [ ] Run `npm run versions` to verify all dependencies are current

---

## 🎯 Project Status

**Phase 1 (Days 1-5):** ✅ Complete - Web app, API, services, UI, tests
**Phase 1.5 (Days 6-10):** ✅ Complete - WCAG AA compliance, production deployment

**Final Metrics:**
- Accessibility: 95/100, WCAG 2.1 AA, 0 axe violations
- Performance: 75/100 Lighthouse (+67%), 78KB bundle (-85%)
- Testing: 1,662 tests (1,104 frontend, 521 backend, 36 skipped, 1 failing), 97.8% passing
- Deployment: Vercel + GitHub Actions CI/CD, custom domain

**Optional:** README screenshots, demo video, extended manual a11y testing

---

## 📁 Project Structure (Condensed)

```
codescribe-ai/
├── client/                    # React 19 + Vite frontend
├── server/                    # Node.js + Express backend
│   └── src/services/         # claudeClient, docGenerator, codeParser, qualityScorer
├── docs/
│   ├── planning/
│   │   ├── mvp/              # Phase 1.0 & 1.5 planning docs (COMPLETE)
│   │   ├── roadmap/          # ROADMAP.md, interactive timeline, versioning guide
│   │   ├── DARK-MODE-SPEC.md # Phase 2.5 planning (active)
│   │   └── TODO.md           # Active todo list (current phase)
│   ├── api/                  # API Reference, README
│   ├── architecture/         # ARCHITECTURE-OVERVIEW.md, ARCHITECTURE.md
│   ├── database/             # DB-NAMING-STANDARDS.md, DB-MIGRATION-MANAGEMENT.MD, PRODUCTION-DB-SETUP.md
│   ├── deployment/           # Deployment guides (Vercel, database, OAuth, email, env vars)
│   ├── performance/          # OPTIMIZATION-GUIDE.md
│   ├── components/           # TOAST-SYSTEM, MERMAID-DIAGRAMS, ERROR-HANDLING-UX, USAGE-PROMPTS, etc.
│   ├── testing/              # 12 test docs (README, coverage, guides, specialized)
│   ├── design/
│   │   └── theming/          # Theme design specs, color palettes, preview HTML files
│   ├── scripts/              # VERSION-CHECKER.md
│   └── DOCUMENTATION-MAP.md
├── private/                  # ⚠️ GITIGNORED - Sensitive content
│   ├── VISION.md             # Strategic planning, GTM
│   ├── INTERVIEW-GUIDE.md    # Interview prep, demo scripts
│   ├── design-archive/       # Archived design exploration
│   └── architecture-archive/ # Historical architecture docs
└── CLAUDE.md                 # This file
```

**Private Folder:**
- Strategic planning, interview prep, design/architecture archives
- Financial/customer/investor data, partnerships, legal docs
- **NOT for:** API keys (use `.env`), public docs, code, public roadmap
- Verify exclusion: `git check-ignore private/` → should output `private/`

---

## 📝 Key Principles

1. **Portfolio Project** - Demonstrates full-stack skills, speed, product thinking
2. **API-First Design** - Service layer supports future CLI/VS Code extension
3. **Privacy-First** - Code processed in memory only; database only for auth/usage tracking (optional)
4. **Real-Time Streaming** - SSE for live documentation generation
5. **Educational** - Quality scoring teaches good documentation practices
6. **Scope Discipline** - Achieved 9-day timeline through strict scope management
7. **Cost-Efficient** - Neon free tier ($0/mo) covers first 50K users; database <0.5% of costs

---

## 🌐 Official Docs

[Vercel](https://vercel.com/docs) | [Neon](https://neon.tech/docs) | [GitHub Actions](https://docs.github.com/en/actions) | [Anthropic Claude](https://docs.anthropic.com/) | [React](https://react.dev/) | [Vite](https://vitejs.dev/) | [Tailwind](https://tailwindcss.com/docs) | [Node.js](https://nodejs.org/docs/) | [Express](https://expressjs.com/) | [Vitest](https://vitest.dev/) | [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🔄 Version History

**Current: v2.4.1** - Email Rate Limiting & UI Fixes (October 31, 2025): **Email Rate Limiting System** (5-min cooldown, 10/day limits, industry-standard); **Email Service Mocking** (auto-mock in dev/test, TEST_RESEND_MOCK flag, prevents quota waste); **Enhanced Production Logging** (detailed email logs with URLs, IDs, timestamps); **UnverifiedEmailBanner Redesign** (brand gradient, compact layout, indigo button, 11 tests updated); **ConfirmationModal Fix** (title/close button alignment); **95 tests fixed** (27 emailService, 28 auth-password-reset, 27 email-verification, 13 integration); **1,662 tests** (1,104 frontend, 522 backend, 36 skipped, 0 failing, 97.8% pass rate); EMAIL-RATE-LIMITING.md documentation; removed npm run migrate from vercel.json

<details>
<summary>Previous Versions (v1.0-v2.4)</summary>

- **v2.4.0** - Test Infrastructure & Mobile UX Improvements (October 31, 2025)
  - 41 Backend Tests Fixed (email verification, name sync, origin tracking, webhooks)
  - Pricing Page Mobile Access added to mobile menu
  - GitHub OAuth Test Documentation (21 tests skipped, documented in SKIPPED-TESTS.md)
  - Interactive Roadmap Enhancements (D hotkey for dark mode toggle, multi-line keyboard hints)
  - Epic 6.4 Added (Testing Infrastructure Improvements roadmap)
  - 1,662 tests (1,104 frontend, 521 backend, 36 skipped, 1 failing, 97.8% pass rate)
  - 159 new tests (41 backend fixes, 2 mobile menu, 15 file upload, 101 from previous work)

- **v2.3.0** - UX Enhancements & File Upload Improvements (October 29, 2025)
  - Drag-and-Drop File Upload with visual purple overlay and smart behavior
  - Clear Button for Code Editor with RefreshCw icon to reset code/filename/language
  - Dynamic Filename Display in Monaco editor header
  - Mobile Menu Logout Button for authenticated users
  - Model Upgrade to Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
  - Page Width Expansion for better space utilization
  - 1,503 tests (1,036 frontend, 431 backend, 36 skipped, 97.6% pass rate)
  - 15 new tests (6 drag-drop, 5 clear button, 3 logout, 1 multi-button fix)

- **v2.2.0** - Frontend Integration & Mobile UX (October 29, 2025)
  - Phase 2 Frontend Progress for Epic 2.2 & 2.4 (UI Integration)
  - Pricing Page Component with 4 tiers, language showcase, FAQ (ready for Stripe)
  - Mobile Menu Authentication with Sign In button, auth modals, and user display
  - Password Visibility Toggle added to LoginModal
  - Usage Tracking Frontend with useUsageTracking hook, UsageWarningBanner (80%), UsageLimitModal (100%)
  - Enhanced Error Handling with priority system (Usage Limit > API > Network > Validation)
  - File Upload Improvements with MIME types for cross-platform compatibility
  - Supported Languages Feature prominently showcased in README
  - 1,489 tests (1,022 frontend, 431 backend, 36 skipped, 97.6% pass rate)
  - 60+ new tests across 5 test suites
  - 11 new files (components, hooks, tests, docs)

- **v2.1.0** - Usage Tracking & Quota System Backend (October 28, 2025)
  - Phase 2 Backend Complete for Epic 2.2 (Tier System & Feature Flags)
  - Usage Model created (568 lines, 9 methods, 28 unit tests)
  - Database schema for user_quotas and anonymous_quotas with lazy reset
  - Three new API endpoints for usage tracking
  - 1,363 tests (926 frontend, 401 backend, 36 skipped)

- **v2.0.1** - OAuth UX Fix, Database Migrations & Storage (October 28, 2025)
  - GitHub OAuth loading states hotfix for production bounce rate
  - Database migrations (003, 004, 005) with tier tracking
  - Storage naming conventions established

- **v2.0.0** - Authentication System & Password Reset (October 26, 2025)
  - Complete authentication with GitHub OAuth and email/password
  - Password reset flow with Resend email service
  - Backend test coverage improvements (86.84% models, 65.41% routes)
  - 1,347 tests (97.5% pass rate)

- **v1.33** - OAuth UX Fix & Storage Conventions (October 28, 2025)
  - GitHub OAuth loading states added to fix bounce rate issue
  - OAuth timing analytics with Vercel Analytics integration
  - Storage naming conventions established (codescribeai:type:category:key)
  - sessionStorage helpers added (getSessionItem, setSessionItem, removeSessionItem)
  - All production code migrated to storage helpers
  - STORAGE-CONVENTIONS.md created (322 lines)

- **v1.32** - Database Naming Standards Documentation (October 27, 2025)
  - DB-NAMING-STANDARDS.md created with comprehensive PostgreSQL naming conventions
  - user_quotas table migration (003) completed with proper naming
  - Database guidelines added to CLAUDE.md
  - 3 new migrations: 003 (user_quotas), 004 (index naming fix), 005 (tier tracking)
  - Database testing infrastructure: Docker Compose, Jest config, helpers
  - 4 new database docs created

- **v1.31** - Backend Test Coverage & CI Fixes (October 26, 2025)
  - 25 new tests added (12 User model + 13 password reset integration)
  - Coverage improved: models 86.84%, routes 65.41%
  - All CI thresholds met, GitHub Actions passing ✅

- **v1.30** - Complete Test Suite Fix & Deployment Unblock (75 tests fixed, 0 failures, 97.3% pass rate)
- **v1.29** - Test Suite Improvements Session 1 (41 frontend tests fixed, 73% reduction in failures)
- **v1.28** - Authentication System & Email Verification Setup (authentication fully tested and working)
- **v1.27** - Neon Database Integration (database cost analysis, free tier covers 50K users)

- **v1.26** - Streamlined Documentation (condensed CLAUDE.md -61%)
- **v1.25** - Architecture doc reorganization (ARCHITECTURE-OVERVIEW.md rename)
- **v1.24** - Architecture update with accurate versions, archive organization
- **v1.23** - Test-gated deployment (Vercel Deploy Hooks + GitHub Actions)
- **v1.22** - Deployment fix, design archive to private/
- **v1.21** - Production deployment complete (codescribe-ai.vercel.app)
- **v1.20** - Phase 1.5 status update (95/100 accessibility)
- **v1.19** - E2E testing best practices
- **v1.18** - Accessibility/cross-browser test docs
- **v1.17** - Interview guide moved to private/
- **v1.16** - Testing documentation organization
- **v1.15** - Component doc reorganization (COPYBUTTON.md)
- **v1.14** - Version checker script integration
- **v1.13** - Architecture audit and migration
- **v1.12** - Performance optimization docs (OPTIMIZATION-GUIDE.md)
- **v1.11** - Private folder documentation
- **v1.10** - Timezone awareness enhancements
- **v1.9** - ERROR-HANDLING-UX.md design guide
- **v1.8** - MERMAID-DIAGRAMS.md developer guide
- **v1.7** - UI pattern guidelines (Figma)
- **v1.6** - Phase 4 optional enhancements, TOAST-SYSTEM.md
- **v1.5** - Mermaid diagram guidelines
- **v1.4** - Semantic color expansion (WCAG AA)
- **v1.3** - Indigo secondary brand color
- **v1.2** - Architecture doc clarification
- **v1.1** - Documentation restructure (subdirectories)
- **v1.0** - Initial CLAUDE.md with complete doc map

Last updated: October 31, 2025
</details>

---

**For questions about CodeScribe AI, start here and navigate to the appropriate detailed documentation.**
