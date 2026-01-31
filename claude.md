# CodeScribe AI - Claude Context Reference

**Status:** ✅ PRODUCTION - [codescribeai.com](https://codescribeai.com) | React 19 + Vite | Node.js + Express | Claude API
**Metrics:** 4,617 tests (96.4% pass) | Lighthouse 75/100 perf, 100/100 a11y | 78KB bundle | 0 axe violations
**Features:** 4 doc types | Monaco Editor | Mermaid diagrams | SSE streaming | Quality scoring (0-100)

---

## 📚 Key Documentation (⭐ = Most Referenced)

**Architecture:** [ARCHITECTURE-OVERVIEW.md](docs/architecture/ARCHITECTURE-OVERVIEW.md) (visual) | [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) (technical) | [ERROR-HANDLING-PATTERNS.md](docs/architecture/ERROR-HANDLING-PATTERNS.md) ⭐ | [SUBSCRIPTION-FLOWS.md](docs/architecture/SUBSCRIPTION-FLOWS.md) ⭐ | [SUBSCRIPTION-MANAGEMENT.md](docs/architecture/SUBSCRIPTION-MANAGEMENT.md) ⭐ | [PROMPT-CACHING-GUIDE.md](docs/architecture/PROMPT-CACHING-GUIDE.md) ⭐ | [GITHUB-API-SCALING.md](docs/architecture/GITHUB-API-SCALING.md) ⭐ | [MULTI-FILE-ARCHITECTURE-ANALYSIS.md](docs/architecture/MULTI-FILE-ARCHITECTURE-ANALYSIS.md) ⭐

**Testing:** [Testing README](docs/testing/README.md) | [TEST-PATTERNS-GUIDE.md](docs/testing/TEST-PATTERNS-GUIDE.md) ⭐ (11 patterns, ES Modules) | [COMPONENT-TEST-COVERAGE.md](docs/testing/COMPONENT-TEST-COVERAGE.md) ⭐ | [SKIPPED-TESTS.md](docs/testing/SKIPPED-TESTS.md) | [REACT-OPTIMIZATION-LESSONS.md](docs/performance/REACT-OPTIMIZATION-LESSONS.md) ⭐

**Design/UI:** [UI-STANDARDS.md](docs/design/UI-STANDARDS.md) ⭐ (button labels, text conventions) | [brand-palette-unified.html](docs/design/theming/brand-palette-unified.html) ⭐ | [BANNER-PATTERNS.md](docs/components/BANNER-PATTERNS.md) ⭐ | [ERROR-HANDLING-UX.md](docs/components/ERROR-HANDLING-UX.md) ⭐

**Deployment:** [RELEASE-QUICKSTART.md](docs/deployment/RELEASE-QUICKSTART.md) ⭐ | [STRIPE-PRODUCTION-SWITCH.md](docs/deployment/STRIPE-PRODUCTION-SWITCH.md) ⭐ | [VERCEL-DEPLOYMENT-GUIDE.md](docs/deployment/VERCEL-DEPLOYMENT-GUIDE.md)

**Admin/Analytics:** [USER-MANAGEMENT-GUIDE.md](docs/admin/USER-MANAGEMENT-GUIDE.md) ⭐ | [CAMPAIGN-MANAGEMENT-GUIDE.md](docs/admin/CAMPAIGN-MANAGEMENT-GUIDE.md) ⭐ | [WORKFLOW-OUTCOME-METRICS-PLAN.md](docs/planning/WORKFLOW-OUTCOME-METRICS-PLAN.md) ⭐

**Planning:** [WORKFLOW-FIRST-PRD-TEMPLATE.md](docs/templates/WORKFLOW-FIRST-PRD-TEMPLATE.md) ⭐ | [MVP-DELIVERY-SUMMARY.md](docs/planning/mvp/MVP-DELIVERY-SUMMARY.md) ⭐ | [VISUAL-ASSET-CREATION-PLAN.md](docs/marketing/VISUAL-ASSET-CREATION-PLAN.md) ⭐

<details>
<summary>Full Documentation Index (by category)</summary>

**Architecture & Dev:** [05-Dev-Guide.md](docs/planning/mvp/05-Dev-Guide.md) | [API-Reference.md](docs/api/API-Reference.md) | [CLAUDE-INTEGRATION-QUICK-REFERENCE.md](docs/architecture/CLAUDE-INTEGRATION-QUICK-REFERENCE.md) | [TIER-ARCHITECTURE.md](docs/architecture/TIER-ARCHITECTURE.md) | [WORKSPACE-FILES-REFACTOR.md](docs/architecture/WORKSPACE-FILES-REFACTOR.md) | [GENERATION-HISTORY-SPEC.md](docs/architecture/GENERATION-HISTORY-SPEC.md) | [MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md](docs/architecture/MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md)

**Performance:** [OPTIMIZATION-GUIDE.md](docs/performance/OPTIMIZATION-GUIDE.md) | [REACT-OPTIMIZATION-LESSONS.md](docs/performance/REACT-OPTIMIZATION-LESSONS.md)

**Testing:** [frontend-testing-guide.md](docs/testing/frontend-testing-guide.md) | [ERROR-HANDLING-TESTS.md](docs/testing/ERROR-HANDLING-TESTS.md) | [MERMAID-DIAGRAM-TESTS.md](docs/testing/MERMAID-DIAGRAM-TESTS.md) | [ACCESSIBILITY-AUDIT.md](docs/testing/ACCESSIBILITY-AUDIT.md) | [SCREEN-READER-TESTING-GUIDE.md](docs/testing/SCREEN-READER-TESTING-GUIDE.md)

**Components:** [TOAST-SYSTEM.md](docs/components/TOAST-SYSTEM.md) | [MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md) | [USAGE-PROMPTS.md](docs/components/USAGE-PROMPTS.md) | [COPYBUTTON.md](docs/components/COPYBUTTON.md) | [SELECT-USAGE.md](docs/components/SELECT-USAGE.md) | [MULTI-FILE-SIDEBAR-UX.md](docs/components/MULTI-FILE-SIDEBAR-UX.md) | [GITHUB-LOADER.md](docs/components/GITHUB-LOADER.md) | [FORM-VALIDATION-GUIDE.md](docs/components/FORM-VALIDATION-GUIDE.md)

**Auth/Security:** [EMAIL-VERIFICATION-SYSTEM.md](docs/authentication/EMAIL-VERIFICATION-SYSTEM.md) | [PASSWORD-RESET-IMPLEMENTATION.md](docs/authentication/PASSWORD-RESET-IMPLEMENTATION.md) | [JWT-AUTHENTICATION-SECURITY.md](docs/security/JWT-AUTHENTICATION-SECURITY.md) | [EMAIL-RATE-LIMITING.md](docs/security/EMAIL-RATE-LIMITING.md) | [FREEMIUM-API-PROTECTION.md](docs/security/FREEMIUM-API-PROTECTION.md)

**Deployment:** [STRIPE-SETUP.md](docs/deployment/STRIPE-SETUP.md) | [STRIPE-TESTING-GUIDE.md](docs/deployment/STRIPE-TESTING-GUIDE.md) | [RESEND-SETUP.md](docs/deployment/RESEND-SETUP.md) | [GITHUB-OAUTH-SETUP.md](docs/deployment/GITHUB-OAUTH-SETUP.md) | [VERCEL-POSTGRES-SETUP.md](docs/deployment/VERCEL-POSTGRES-SETUP.md) | [DEPLOYMENT-CHECKLIST.md](docs/deployment/DEPLOYMENT-CHECKLIST.md)

**Database:** [DB-NAMING-STANDARDS.md](docs/database/DB-NAMING-STANDARDS.md) | [DB-MIGRATION-MANAGEMENT.md](docs/database/DB-MIGRATION-MANAGEMENT.md) | [SQL-BEST-PRACTICES.md](docs/database/SQL-BEST-PRACTICES.md) ⭐ | [USAGE-QUOTA-SYSTEM.md](docs/database/USAGE-QUOTA-SYSTEM.md)

**Development:** [FEATURE-BRANCH-WORKFLOW.md](docs/development/FEATURE-BRANCH-WORKFLOW.md) | [FEATURE-FLAGS.md](docs/development/FEATURE-FLAGS.md) | [STORAGE-CONVENTIONS.md](docs/development/STORAGE-CONVENTIONS.md) | [VERSION-CHECKER.md](docs/scripts/VERSION-CHECKER.md)
</details>

---

## 🔑 Technical Essentials

### Core Services (Backend)
1. **claudeClient.js** - Claude API, streaming, retries
2. **docGenerator.js** - Doc generation, prompt building, orchestration
3. **codeParser.js** - AST parsing (Acorn), function/class extraction
4. **qualityScorer.js** - 5-criteria scoring (0-100 scale)

### Authentication Pattern ⚠️ CRITICAL
**All authenticated API endpoints use Bearer token authentication, NOT cookies!**

**Backend (Express routes):**
```javascript
// ALWAYS add requireAuth middleware first
router.post('/api/protected-endpoint', requireAuth, apiLimiter, async (req, res) => {
  // req.user is now available
});
```

**Frontend (fetch calls):**
```javascript
// ALWAYS use Bearer token from localStorage
import { STORAGE_KEYS } from '../constants/storage';

const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
const response = await fetch(`${API_URL}/api/protected-endpoint`, {
  method: 'POST',
  headers: {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  },
  // NEVER use credentials: 'include' for authenticated routes
  body: JSON.stringify(data)
});
```

**Common Pitfall:**
- ❌ Using `credentials: 'include'` (cookie-based) → Results in 401 Unauthorized
- ✅ Using `Authorization: Bearer ${token}` (token-based) → Works correctly

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

### Prompt Caching
> **💰 Saves $100-400/month** | 90% cost reduction on cached prompts | 1-hour TTL with auto-refresh | [Full Guide](docs/architecture/PROMPT-CACHING-GUIDE.md)

- System prompts (~2K tokens) always cached
- Default/example code cached when detected
- Cache stays warm with 1+ user/hour (quasi-indefinite)
- Adding examples: Update `EXAMPLE_CODES` in [defaultCode.js](client/src/constants/defaultCode.js)

---

## 📖 Usage Guidelines

**Best Practices:**
- Always cite sources (document name + file path)
- Include code examples and file paths for implementation questions
- Check version with `npm run versions` before citing package versions
- Don't invent features—stay within documented scope

**Quick Lookups:**
- **UI/Design:** UI-STANDARDS.md (button labels) | brand-palette-unified.html (colors) | BANNER-PATTERNS.md (banner types) | ERROR-HANDLING-UX.md (when to use banners vs inline vs modals)
- **Testing:** TEST-PATTERNS-GUIDE.md (11 patterns, ES Modules) | SKIPPED-TESTS.md (update every release, quarterly review)
- **Architecture:** ARCHITECTURE-OVERVIEW.md → ARCHITECTURE.md → Dev Guide
- **Error Handling:** ERROR-HANDLING-PATTERNS.md (app vs API errors, 429 vs 503) → ERROR-HANDLING-UX.md (UI patterns) → BANNER-PATTERNS.md (visual design)
- **Database/SQL:** SQL-BEST-PRACTICES.md (dynamic queries, security patterns) | DB-NAMING-STANDARDS.md (naming conventions) | DB-MIGRATION-MANAGEMENT.md (migration workflow)
- **Subscriptions:** SUBSCRIPTION-FLOWS.md (signup flows) → SUBSCRIPTION-MANAGEMENT.md (upgrades/proration)
- **Stripe:** STRIPE-SETUP.md → STRIPE-TESTING-GUIDE.md → STRIPE-PRODUCTION-SWITCH.md (go-live)
- **Release:** RELEASE-QUICKSTART.md (two-phase: prep vs deploy)

---

## ⚙️ Critical Patterns

### Testing
- **E2E:** Never use `waitForTimeout()` → Use `page.waitForResponse()`, `expect().toBeVisible()`, `waitForSelector()`
- **Backend:** ES modules only (import from `@jest/globals`, mock BEFORE imports) - see [TEST-PATTERNS-GUIDE.md Pattern 11](docs/testing/TEST-PATTERNS-GUIDE.md)
- **Skipped Tests:** Add `.skip()` + comment, document in SKIPPED-TESTS.md. Update counts on every release, quarterly review.

### Database ([guides](docs/database/))
- **Naming:** Tables `plural_snake_case`, columns singular, indexes `idx_<table>_<column>`
- **Migration:** 1) Docker sandbox test → 2) Get approval → 3) Neon dev `npm run migrate` → 4) Auto-deploy on `main`
- **SQL Security:** Always use parameterized queries (`$1`, `$2` placeholders) | Use `sql.query(queryText, params)` | Whitelist ORDER BY columns | Never concatenate user input into SQL strings - see [SQL-BEST-PRACTICES.md](docs/database/SQL-BEST-PRACTICES.md)

```javascript
// Dynamic WHERE clauses with parameterized queries
import { sql } from '@vercel/postgres';

let queryText = 'SELECT * FROM users';
const conditions = [];
const params = [];
let paramCounter = 1;

if (status) {
  conditions.push(`status = $${paramCounter++}`);
  params.push(status);
}

if (role) {
  conditions.push(`role = $${paramCounter++}`);
  params.push(role);
}

if (conditions.length > 0) {
  queryText += ' WHERE ' + conditions.join(' AND ');
}

const result = await sql.query(queryText, params);  // ✅ Safe

// ❌ NEVER: String concatenation with user input
const where = `WHERE status = '${status}'`;  // SQL injection risk!
```

### UI Components
- **Buttons:** "New [Noun]" (primary) | "Create [Noun]" (modal/submit) | "Add" (import only) - see [UI-STANDARDS.md](docs/design/UI-STANDARDS.md)
- **Dropdowns:** Always use `<Select>` component (not native `<select>`) for consistent styling, a11y, portal rendering
- **Modals:** Never auto-close confirmations—require explicit Close click (industry standard)

```jsx
// Button labeling
<button><Plus /> New Project</button>           // Primary ✅
<button type="submit">Create Project</button>   // Submit ✅
<button>Add Code</button>                       // Import ✅

// Select component
import { Select } from '../../components/Select';
<Select value={val} onChange={setVal} options={OPTIONS} ariaLabel="Filter" />
```

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
# See: docs/database/DB-MIGRATION-MANAGEMENT.md for full testing workflow

# Versions
npm run versions                # Comprehensive version report

# Environment
# server/.env: LLM_PROVIDER, CLAUDE_API_KEY or OPENAI_API_KEY, PORT, NODE_ENV, POSTGRES_URL
# client/.env: VITE_API_URL

# Testing
cd client && npm test -- --run  # Run frontend tests (get counts)
cd server && npm test           # Run backend tests (get counts)
```

---

## 🔧 LLM Provider Configuration

**Supported:** Claude (default, Sonnet 4.5) | OpenAI (gpt-5.1)
**Switching:** Update `server/.env` → Restart server (no code changes)

```bash
# Claude (default) - 200K context, 90% prompt caching savings
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-...

# OpenAI - 128K context, no prompt caching
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-5.1
```

**Response Metadata:** Includes `provider`, `model`, `inputTokens`, `outputTokens`, `wasCached`, `latencyMs`
**Docs:** [MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md](docs/architecture/MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md) | [MULTI-PROVIDER-DECISION-GUIDE.md](docs/architecture/MULTI-PROVIDER-DECISION-GUIDE.md)

---

## 📋 Release Process

**"Prep for Release" Automation:**
Say "prep for release" after bumping package.json versions → I auto-update CHANGELOG/README/TODO/test counts

**Manual Commands:**
```bash
cd client && npm test -- --run 2>&1 | grep "Tests:"  # Frontend counts
cd server && npm test 2>&1 | grep "Tests:"           # Backend counts
```

**Files Updated:** 3 package.json, CHANGELOG.md, README.md, TODO.md, claude.md, docs/testing/README.md, SKIPPED-TESTS.md

**Roadmap Conventions:**

*Ordering:* In `docs/planning/roadmap/roadmap-data.json`, the "done" column phases array is ordered **newest first** (most recent release at top, oldest at bottom). When adding new releases, insert them at the **beginning** of the phases array, not the end. This ensures users see the latest features first when viewing the roadmap.

*Content:* All feature descriptions in roadmap-data.json must be **user-focused**, not technical. Focus on what users can do, not how it's implemented. The roadmap is for external visibility (users, stakeholders, investors).

**❌ Avoid:** Component names, service names, test coverage stats, database details, storage keys, code patterns, implementation methods, file paths, SQL queries, API internals

**✅ Include:** New capabilities, UX improvements, what users can accomplish, business impact, feature availability

Examples:
- ❌ "Implemented sessionStorage persistence for date range with ANALYTICS_DATE_RANGE storage key"
- ✅ "Date range selection now persists across page refreshes"
- ❌ "Added backend comparison support for code_input and doc_export metrics in analyticsService"
- ✅ "Enhanced analytics dashboard with workflow trend metrics"
- ❌ "Test coverage: 4,137 tests (2,134 frontend, 2,003 backend)"
- ✅ (Omit entirely - not user-facing)

---

## 🎯 Project Status

✅ **Production Ready** - MVP delivered in 9 days (Oct 19, 2025)
- Phase 1 (Days 1-5): Web app, API, services, UI, tests
- Phase 1.5 (Days 6-10): WCAG AA compliance, production deployment
- Current: v3.5.6 - PHI workflow overhaul with inline editing, resizable columns, WCAG accessibility

---

## 📁 Project Structure

```
codescribe-ai/
├── client/         # React 19 + Vite
├── server/         # Node.js + Express (claudeClient, docGenerator, codeParser, qualityScorer)
├── docs/           # planning/, api/, architecture/, database/, deployment/, testing/, components/, design/
├── private/        # ⚠️ GITIGNORED (VISION, INTERVIEW-GUIDE, archives)
└── CLAUDE.md
```

**Private:** Strategic planning, interview prep, archives. NOT for API keys, public docs, code.

---

## 📝 Design Principles

**Portfolio** (full-stack, speed, product thinking) | **API-First** (extensible service layer) | **Privacy** (code in-memory only) | **Real-Time** (SSE streaming) | **Educational** (quality scoring) | **Cost-Efficient** (Neon free tier → 50K users)

---

## 🌐 Official Docs

[Vercel](https://vercel.com/docs) | [Neon](https://neon.tech/docs) | [GitHub Actions](https://docs.github.com/en/actions) | [Anthropic Claude](https://docs.anthropic.com/) | [React](https://react.dev/) | [Vite](https://vitejs.dev/) | [Tailwind](https://tailwindcss.com/docs) | [Node.js](https://nodejs.org/docs/) | [Express](https://expressjs.com/) | [Vitest](https://vitest.dev/) | [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🔄 Version History

**Current: v3.5.6** (January 31, 2026) - PHI Workflow Overhaul with Inline Editing & Accessibility
- Inline replacement editing: Edit PHI directly in table with real-time Monaco sync
- Resizable table columns with 1px minimum, weight-based allocation, responsive hiding
- Revert functionality for accepted/skipped items, Skip All button for bulk operations
- WCAG accessibility: Improved keyboard navigation, tab order, focus indicators
- Banner component refactoring for consistent styling across app
- Monaco tab focus mode for seamless editing workflow
- Tests: 4,617 (4,446 passing, 144 skipped, 27 failing)

**v3.5.5** (January 29, 2026) - Email Template Enterprise Polish
- Email verification template redesign: purpose-first messaging, neutral environment labeling
- Changed header from "Welcome" to "Confirm your email address", CTA to "Confirm email address"
- Normalized tier badge to "Plan: Free (Development)" format, added branded footer
- Tests: 4,580 (4,580 passing, 144 skipped, 0 failing)

**v3.5.4** (January 28, 2026) - Admin Table UX & Analytics Charts
- Admin table standardization: FilterBar component, icon-only exports, server-side pagination
- Analytics chart enhancements: Table view toggles, ChartSections.jsx wrappers, overflow fixes
- UX improvements: Sticky headers, 25-row pagination, portal-rendered Select dropdowns
- Tests: 4,550 (4,406 passing, 144 skipped, 0 failing)

<details>
<summary>Recent Releases (v3.5.3-v2.9.0) & Milestones</summary>

**v3.5.3** (January 28, 2026) - Analytics Infrastructure & Pricing Polish
- Pricing restructure: Free/$49/$199/Custom (38-66% margins), Starter = trial-only
- Server-side analytics: `doc_generation`/`quality_score` events, API key auth (`X-Analytics-Key`)
- Admin UX: HIPAA dashboard fixes, aligned headers/cards, shared `useDateRange` hook
- GitHub import: Background pagination stops on repo selection
- Tests: 4,550 (4,406 passing, 144 skipped)

**v3.5.2** (Jan 27, 2026): Enterprise Healthcare HIPAA Compliance - 5 HIPAA features (224 tests), audit logging, PHI detection, encryption, compliance dashboard, BAA docs
**v3.5.1** (Jan 26, 2026): GitHub Private Repos & Progressive Loading - Private repo access, progressive loading, pagination API, field-level errors
**v3.5.0** (Jan 25, 2026): Trial Programs & Enhanced Eligibility System - Renamed Campaigns to Trial Programs, flexible eligibility rules, auto-enrollment, force grants
**v3.4.4** (Jan 14, 2026): User Management System - Account suspension/deletion, admin controls, audit logging
**v3.4.3** (Jan 14, 2026): Campaign Management Enhancements - Sortable tables, export, attribution tracking
**v3.4.2** (Jan 13, 2026): Campaign Export Fix & Google Sheets Integration
**v3.4.1** (Jan 10, 2026): Analytics Dashboard Workflow Metrics & UX Improvements
**v3.4.0** (Jan 9, 2026): Analytics Dashboard Launch - Admin analytics with funnel visualization
**v3.3.9** (Jan 9, 2026): Analytics Dashboard Reorganization - Reorganized Usage tab into 5 user-journey groups, added model filtering
**v3.3.8** (Jan 8, 2026): Analytics Funnel Polish - Better color contrast, fixed count visibility, capped bar widths
**v3.3.7** (Jan 8, 2026): Event Category Reclassification & Test Coverage - Renamed 'funnel' to 'workflow', added 'system' category, comprehensive test coverage
**v3.3.6** (Jan 7, 2026): Admin Analytics Performance & UX - Event filters, enhanced user list, performance optimizations
**v3.3.5** (Jan 7, 2026): Multi-select Event Filter & Campaign Trials - Portal rendering, grouped performance metrics, auth tracking
**v3.3.4** (Jan 6, 2026): Admin Analytics Dashboard & Workflow Outcome Metrics - Recharts funnel/business/usage tabs, session tracking, conversion metrics
**v3.3.3** (Dec 12, 2025): Private GitHub Repository Support - AES-256-GCM token encryption, per-user auth, private/public badges
**v3.3.2** (Dec 10, 2025): Sidebar UX Polish - Apply dropdown, ProjectSelector graph status, toolbar grouping
**v3.3.1** (Dec 10, 2025): Batch Generation & Mermaid Dark Mode Fixes - Race condition fixes, workspace stability
**v3.3.0** (Dec 9, 2025): Graph Engine API & Project Analysis - Project Details page, graph stats, architecture diagrams
**v3.2.2** (Dec 7, 2025): UX Polish & Tier Access Updates - Trial user usage limits fix, code block rendering
**v3.2.1** (Dec 7, 2025): Workspace Persistence Fix - Single-file generation persists to sessionStorage
**v3.2.0** (Dec 6, 2025): Batch Generation & Workspace Fixes - Race condition fix, Mermaid cleanup, async prompts
**v3.1.0** (Dec 5, 2025): Trial System Production Ready - Full user-facing flow, admin UI, attribution
**v3.0.0** (Dec 4, 2025): Trial System Core - Invite codes, user trials, trial-aware tier system
**v2.11.0** (Dec 4, 2025): Doc-type specific quality scoring, regeneration confirmation, batch cancellation
**v2.10.0** (Dec 3, 2025): Multi-file workspace, batch generation, GitHub integration, tier-based attribution
**v2.9.0** (Nov 23, 2025): Layout toggle streaming, OPENAPI doc type, Gemini 3.0 Pro integration
**v2.8.0-v2.8.1** (Nov 16-20, 2025): Arrow key nav, ESC key nav, Mermaid fixes, overflow fixes

**v2.7.x Series (Nov 2025):**
- v2.7.11: Appearance modal, 3-state theme cycling, DocPanel empty state, multi-file sidebar design doc
- v2.7.10: Mermaid diagram auto-show, ER diagram theming, amber error colors, modal consistency improvements
- v2.7.9: GitHub repository integration (public repos, tree browsing, branch switching, @octokit/rest, 4 API routes)
- v2.7.8: Multi-provider LLM architecture (Claude + OpenAI support, config-driven switching, 69 new tests)
- v2.7.7: Admin dashboard performance optimization (O(1) lifetime usage), smart auto-scroll, middleware coverage fix
- v2.7.6: Dual-tab quality breakdown, transformation header, enhanced markdown export
- v2.7.5: UX refinements, dark mode docs, Google OAuth docs
- v2.7.4: Samples modal optimization, terminology refactoring
- v2.7.3: Toast fixes, terminology consistency, dark mode fixes
- v2.7.2: Mobile UX, appearance settings tab, auto theme mode
- v2.7.1: Admin dashboard fixes, production logging security
- v2.7.0: Dark mode complete, 106 new tests, 100% CI pass rate

**Key Milestones:**
- **v2.6.0** (Nov 7): Usage dashboard, tier badges, profile dropdown (+146 tests)
- **v2.5.0-v2.5.3** (Nov 3-6): Legal compliance (privacy/terms/settings), email system overhaul, 7 email templates
- **v2.4.x** (Oct 31-Nov 2): Email rate limiting, contact sales, help modal, refined light theme
- **v2.3.0** (Oct 29): Drag-drop upload, clear button, Claude Sonnet 4.5 upgrade
- **v2.0.0** (Oct 26): Authentication system (GitHub OAuth + email/password), password reset
- **v1.32** (Oct 27): Database naming standards, testing infrastructure
- **v1.21** (Oct 19): Production deployment, codescribe-ai.vercel.app

Full history: [CHANGELOG.md](CHANGELOG.md)
Last updated: January 26, 2026
</details>

---

**For questions about CodeScribe AI, start here and navigate to the appropriate detailed documentation.**
