# CodeScribe AI - Claude Context Reference

**Project:** AI-Powered Code Documentation Generator
**Status:** ✅ **PRODUCTION** - [codescribeai.com](https://codescribeai.com)
**Tech Stack:** React 19 + Vite | Node.js + Express | Claude API | Tailwind CSS
**Completion:** October 19, 2025 (9 days) | All times in EST/EDT

---

## 📋 Quick Overview

AI-powered documentation generator with real-time streaming, quality scoring (0-100), and WCAG 2.1 AA compliance.

**Key Metrics:**
- 3,440 tests (3,340 passing, 97 skipped, 0 failing) | 97.2% pass rate | 95.45% middleware coverage
- Lighthouse: 75/100 performance (+67%), 100/100 accessibility
- Bundle: 78KB gzipped (-85% reduction)
- Accessibility: 95/100 score, 0 axe violations

**Features:** 4 doc types (README, JSDoc, API, ARCHITECTURE) | Monaco Editor | Mermaid diagrams | SSE streaming | Input code health scoring

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
| [ERROR-HANDLING-PATTERNS.md](docs/architecture/ERROR-HANDLING-PATTERNS.md) | Error handling patterns ⭐ | App vs external API errors (429 vs 503), email/Claude patterns, HTTP status codes |
| [SUBSCRIPTION-FLOWS.md](docs/architecture/SUBSCRIPTION-FLOWS.md) | Subscription flows ⭐ | Unauthenticated users, email/OAuth signup, billing periods, sessionStorage intent |
| [SUBSCRIPTION-MANAGEMENT.md](docs/architecture/SUBSCRIPTION-MANAGEMENT.md) | Subscription management ⭐ | Hybrid proration (upgrade/downgrade), testing guide, webhooks |
| [PROMPT-CACHING-GUIDE.md](docs/architecture/PROMPT-CACHING-GUIDE.md) | Cost optimization ⭐ | Caching strategy, adding examples, savings analysis ($50-300/mo) |
| [GITHUB-API-SCALING.md](docs/architecture/GITHUB-API-SCALING.md) | GitHub API scaling ⭐ | Rate limits (60/5000/hr), server token vs per-user, caching strategy, scaling path |
| [MULTI-FILE-ARCHITECTURE-ANALYSIS.md](docs/architecture/MULTI-FILE-ARCHITECTURE-ANALYSIS.md) | Multi-file feature ⭐ | Architecture analysis, design decisions, state management (v2.9.0) |
| [CLAUDE-INTEGRATION-QUICK-REFERENCE.md](docs/architecture/CLAUDE-INTEGRATION-QUICK-REFERENCE.md) | Claude API | Quick reference guide, request/response patterns, best practices |
| [TIER-ARCHITECTURE.md](docs/architecture/TIER-ARCHITECTURE.md) | Subscription tiers | Tier system architecture, feature gates, access control |
| [WORKSPACE-FILES-REFACTOR.md](docs/architecture/WORKSPACE-FILES-REFACTOR.md) | Workspace refactor | Refactoring strategy, file management, migration path |
| [GENERATION-HISTORY-SPEC.md](docs/architecture/GENERATION-HISTORY-SPEC.md) | History feature | Generation history specification, storage, retrieval |
| [05-Dev-Guide.md](docs/planning/mvp/05-Dev-Guide.md) | Implementation patterns | Complete service code, best practices, deployment |
| [API-Reference.md](docs/api/API-Reference.md) | API specs | 4 endpoints, request/response formats, error codes |

### 📊 Performance & Testing
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [OPTIMIZATION-GUIDE.md](docs/performance/OPTIMIZATION-GUIDE.md) | Performance optimization | Lazy loading, bundle analysis, Core Web Vitals, maintenance |
| [REACT-OPTIMIZATION-LESSONS.md](docs/performance/REACT-OPTIMIZATION-LESSONS.md) | React performance ⭐ | Memoization patterns, v2.8.0 lessons, overflow fixes, re-render prevention |
| [Testing README](docs/testing/README.md) | Test navigation hub | 2,391 test stats, quick commands, coverage overview |
| [COMPONENT-TEST-COVERAGE.md](docs/testing/COMPONENT-TEST-COVERAGE.md) | Coverage details ⭐ | 13/18 components tested, category breakdown, gaps |
| [frontend-testing-guide.md](docs/testing/frontend-testing-guide.md) | React testing patterns | Vitest + RTL, mocking, a11y, interactions |
| [TEST-PATTERNS-GUIDE.md](docs/testing/TEST-PATTERNS-GUIDE.md) | Test fix patterns ⭐⚠️ | **103 tests fixed, 11 patterns** (Pattern 11: ES Modules!), 6 insights, 97.8% pass rate |
| [SKIPPED-TESTS.md](docs/testing/SKIPPED-TESTS.md) | Skipped tests tracking | 56 tests documented, quarterly review schedule, justifications |

**Specialized Tests:** [ERROR-HANDLING-TESTS.md](docs/testing/ERROR-HANDLING-TESTS.md) (58 tests) | [MERMAID-DIAGRAM-TESTS.md](docs/testing/MERMAID-DIAGRAM-TESTS.md) (14 tests) | [CROSS-BROWSER-TEST-PLAN.md](docs/testing/CROSS-BROWSER-TEST-PLAN.md) | [ACCESSIBILITY-AUDIT.md](docs/testing/ACCESSIBILITY-AUDIT.md) | [SCREEN-READER-TESTING-GUIDE.md](docs/testing/SCREEN-READER-TESTING-GUIDE.md)

### 🎨 Design & Components
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [07-Figma-Guide.md](docs/planning/mvp/07-Figma-Guide.md) | Design system | Colors (purple/indigo/slate), typography, 8 components, UI patterns |
| [brand-palette-unified.html](docs/design/theming/brand-palette-unified.html) | Unified color palette ⭐ | Interactive palette with light+dark themes, click-to-copy hex codes, WCAG AA |
| [COLOR-REFERENCE.md](docs/design/theming/COLOR-REFERENCE.md) | Color quick reference | Complete color table for both themes, usage guidelines, semantic colors |
| [TOAST-SYSTEM.md](docs/components/TOAST-SYSTEM.md) | Toast notifications | 20+ utilities, 6 custom toasts, a11y support |
| [MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md) | Diagram patterns | Brand theming, React integration, troubleshooting |
| [ERROR-HANDLING-UX.md](docs/components/ERROR-HANDLING-UX.md) | Error UX | Banners vs modals, animations (250ms/200ms), a11y, priority system |
| [USAGE-PROMPTS.md](docs/components/USAGE-PROMPTS.md) | Usage warnings & limits | 80% banner, 100% modal, dynamic multipliers, simulator |
| [COPYBUTTON.md](docs/components/COPYBUTTON.md) | Copy-to-clipboard | Variants, animation timeline, best practices |
| [SELECT-USAGE.md](docs/components/SELECT-USAGE.md) | Dropdown component | Headless UI patterns, keyboard nav, a11y |
| [MULTI-FILE-SIDEBAR-UX.md](docs/components/MULTI-FILE-SIDEBAR-UX.md) | Multi-file sidebar ⭐ | Sidebar UX design, file list management, selection patterns (v2.9.0) |
| [FILE-DETAILS-PANEL.md](docs/components/FILE-DETAILS-PANEL.md) | File details panel | Panel component design, metadata display, interactions |
| [GITHUB-LOADER.md](docs/components/GITHUB-LOADER.md) | GitHub import UI | Loading states, error handling, progress feedback |
| [PRICING-PAGE.md](docs/components/PRICING-PAGE.md) | Pricing page | Tier comparison design, pricing table, CTAs |
| [SETTINGS-UI-PATTERNS.md](docs/components/SETTINGS-UI-PATTERNS.md) | Settings UI | Layout patterns, form design, accessibility |
| [FORM-VALIDATION-GUIDE.md](docs/components/FORM-VALIDATION-GUIDE.md) | Form validation | Validation patterns, error messages, real-time feedback |
| [EMAIL-TEMPLATING-GUIDE.md](docs/components/EMAIL-TEMPLATING-GUIDE.md) | Email templates | Template system, styling constraints, testing |
| [BUTTON-IMPLEMENTATION-SUMMARY.md](docs/components/BUTTON-IMPLEMENTATION-SUMMARY.md) | Button component | Variants (primary/secondary), states, accessibility |
| [SKELETON-LOADER.md](docs/components/SKELETON-LOADER.md) | Loading skeletons | Loading state patterns, animation, content placeholders |
| [DOWNLOADBUTTON.md](docs/components/DOWNLOADBUTTON.md) | Download button | Download patterns, file export, user feedback |

### 🛠️ Utilities
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [VERSION-CHECKER.md](docs/scripts/VERSION-CHECKER.md) | Package versions | `npm run versions`, output format, update protocol |

### 🔐 Authentication & Security
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [EMAIL-VERIFICATION-SYSTEM.md](docs/authentication/EMAIL-VERIFICATION-SYSTEM.md) | Email verification | System design, user flow, 158+ tests, token lifecycle |
| [PASSWORD-RESET-IMPLEMENTATION.md](docs/authentication/PASSWORD-RESET-IMPLEMENTATION.md) | Password reset | Flow implementation, testing, token expiration |
| [PASSWORD-RESET-SETUP.md](docs/authentication/PASSWORD-RESET-SETUP.md) | Password reset setup | Resend configuration, template setup, testing |
| [JWT-AUTHENTICATION-SECURITY.md](docs/security/JWT-AUTHENTICATION-SECURITY.md) | JWT security | Token handling, refresh strategy, best practices |
| [EMAIL-RATE-LIMITING.md](docs/security/EMAIL-RATE-LIMITING.md) | Email rate limiting | Throttling strategy, abuse prevention, limits |
| [FREEMIUM-API-PROTECTION.md](docs/security/FREEMIUM-API-PROTECTION.md) | API protection | Free tier security, rate limits, quota enforcement |
| [EMAIL-CONFIGURATION.md](docs/security/EMAIL-CONFIGURATION.md) | Email security | Resend setup, DNS records, SPF/DKIM configuration |

### 🚀 Deployment & Configuration
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [RELEASE-QUICKSTART.md](docs/deployment/RELEASE-QUICKSTART.md) | Release process ⭐ | Two-phase process (prep vs. deploy), checklist, automation |
| [VERCEL-DEPLOYMENT-GUIDE.md](docs/deployment/VERCEL-DEPLOYMENT-GUIDE.md) | Vercel deployment | Project setup, environment variables, custom domains |
| [STRIPE-SETUP.md](docs/deployment/STRIPE-SETUP.md) | Payment processing | Stripe configuration, webhooks, test mode vs. production |
| [STRIPE-TESTING-GUIDE.md](docs/deployment/STRIPE-TESTING-GUIDE.md) | Payment testing | Test scenarios, test card numbers, webhook testing |
| [RESEND-SETUP.md](docs/deployment/RESEND-SETUP.md) | Email service | Resend API configuration, domain verification, templates |
| [GITHUB-OAUTH-SETUP.md](docs/deployment/GITHUB-OAUTH-SETUP.md) | OAuth provider | GitHub App setup, credentials, callback URLs |
| [CUSTOM-DOMAIN-SETUP.md](docs/deployment/CUSTOM-DOMAIN-SETUP.md) | Domain configuration | DNS setup, SSL certificates, Vercel configuration |
| [DEPLOYMENT-CHECKLIST.md](docs/deployment/DEPLOYMENT-CHECKLIST.md) | Pre-deployment | Complete deployment checklist, environment validation |
| [VERCEL-ENVIRONMENT-VARIABLES.md](docs/deployment/VERCEL-ENVIRONMENT-VARIABLES.md) | Environment config | All environment variables, per-environment setup |
| [VERCEL-POSTGRES-SETUP.md](docs/deployment/VERCEL-POSTGRES-SETUP.md) | Database setup | Neon Postgres via Vercel Marketplace, connection strings |
| [EMAIL-FORWARDING-SETUP.md](docs/deployment/EMAIL-FORWARDING-SETUP.md) | Email forwarding | sales@, support@ configuration via Namecheap |
| [DATABASE-ENVIRONMENT-CHECKLIST.md](docs/deployment/DATABASE-ENVIRONMENT-CHECKLIST.md) | Database env | Database environment setup, connection validation |
| [TERMS-AND-PRIVACY-SETUP.md](docs/deployment/TERMS-AND-PRIVACY-SETUP.md) | Legal pages | Terms of Service, Privacy Policy setup |
| [DEPLOYMENT-LEARNINGS.md](docs/deployment/DEPLOYMENT-LEARNINGS.md) | Lessons learned | Deployment gotchas, troubleshooting tips |

### 🛠️ Development Practices
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [FEATURE-BRANCH-WORKFLOW.md](docs/development/FEATURE-BRANCH-WORKFLOW.md) | Git workflow | Branch naming conventions, PR process, merge strategy |
| [FEATURE-FLAGS.md](docs/development/FEATURE-FLAGS.md) | Feature flags | Feature flag system, implementation, testing patterns |
| [SECURITY-GIT-SECRETS.md](docs/development/SECURITY-GIT-SECRETS.md) | Secret management | .env patterns, .gitignore, credential security |
| [STORAGE-CONVENTIONS.md](docs/development/STORAGE-CONVENTIONS.md) | Browser storage | localStorage/sessionStorage naming conventions |

### 📈 Features & Extensions
| Document | Use Case | Key Contents |
|----------|----------|--------------|
| [GITHUB-MULTI-FILE-IMPORT.md](docs/features/GITHUB-MULTI-FILE-IMPORT.md) | GitHub import ⭐ | Multi-file import from GitHub repos, tree browsing, file selection |
| [ADD-NEW-DOC-TYPE.md](docs/guides/ADD-NEW-DOC-TYPE.md) | Extension guide | Adding new documentation types, prompt templates |

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

## 📖 Claude Usage Guidelines

### 1. Question Type → Document Mapping
| Question Type | Reference |
|--------------|-----------|
| Planning/Scope | PRD, Epics |
| Implementation | Dev Guide, Master Prompt |
| API/Endpoints | API Reference |
| Design/UI | Figma Guide, Unified Brand Palette, COLOR-REFERENCE.md |
| Architecture | ARCHITECTURE-OVERVIEW.md (visual), ARCHITECTURE.md (technical) |
| Error Handling | ERROR-HANDLING-PATTERNS.md (app vs external API errors, 429 vs 503, email/Claude patterns) |
| Subscription Flows | SUBSCRIPTION-FLOWS.md (unauthenticated signup, email/OAuth, billing periods) |
| Subscriptions/Payments | SUBSCRIPTION-MANAGEMENT.md (upgrade/downgrade flows, proration, webhooks) |
| Authentication | EMAIL-VERIFICATION-SYSTEM.md, PASSWORD-RESET-IMPLEMENTATION.md, PASSWORD-RESET-SETUP.md |
| Security | JWT-AUTHENTICATION-SECURITY.md, EMAIL-RATE-LIMITING.md, FREEMIUM-API-PROTECTION.md, EMAIL-CONFIGURATION.md |
| Deployment Setup | STRIPE-SETUP.md, RESEND-SETUP.md, GITHUB-OAUTH-SETUP.md, CUSTOM-DOMAIN-SETUP.md, DEPLOYMENT-CHECKLIST.md |
| Git Workflow | FEATURE-BRANCH-WORKFLOW.md |
| Feature Flags | FEATURE-FLAGS.md |
| Multi-File Feature | MULTI-FILE-ARCHITECTURE-ANALYSIS.md, GITHUB-MULTI-FILE-IMPORT.md, MULTI-FILE-SIDEBAR-UX.md |
| Performance | OPTIMIZATION-GUIDE.md |
| React Performance | REACT-OPTIMIZATION-LESSONS.md (memoization, re-renders, v2.8.0 lessons) |
| Cost Optimization | PROMPT-CACHING-GUIDE.md (caching strategy, adding examples, savings) |
| GitHub API / Scaling | GITHUB-API-SCALING.md (rate limits, server token vs per-user, caching, scaling path) |
| Testing | Testing README, COMPONENT-TEST-COVERAGE.md, TEST-PATTERNS-GUIDE.md, SKIPPED-TESTS.md |
| Test Fixes/Patterns | TEST-PATTERNS-GUIDE.md (11 patterns, 6 insights, frontend + backend) |
| Skipped Tests | SKIPPED-TESTS.md (56 tests documented, quarterly review schedule) |
| Accessibility | ACCESSIBILITY-AUDIT.md, SCREEN-READER-TESTING-GUIDE.md |
| Components | TOAST-SYSTEM.md, ERROR-HANDLING-UX.md, USAGE-PROMPTS.md, COPYBUTTON.md, MULTI-FILE-SIDEBAR-UX.md, etc. |
| Versions | Run `npm run versions`, VERSION-CHECKER.md |
| Database | DB-NAMING-STANDARDS.md, DB-MIGRATION-MANAGEMENT.md, USAGE-QUOTA-SYSTEM.md, PRODUCTION-DB-SETUP.md |
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
- **Testing:** Testing README (overview) → COMPONENT-TEST-COVERAGE.md (details) → frontend-testing-guide.md (patterns) → TEST-PATTERNS-GUIDE.md (fixes & patterns) → SKIPPED-TESTS.md (maintenance)
- **Test Debugging:** TEST-PATTERNS-GUIDE.md (10 patterns, 6 insights) for fixing auth tests, mocking, validation
- **Skipped Tests:** SKIPPED-TESTS.md - Update on every release, quarterly review (15 frontend tests intentionally skipped)
- **Error Handling:** ERROR-HANDLING-PATTERNS.md (app vs API errors, HTTP status codes) → ERROR-HANDLING-UX.md (UX patterns, priority system) → USAGE-PROMPTS.md (usage warnings/limits) → TOAST-SYSTEM.md (success toasts)
- **Subscriptions:** SUBSCRIPTION-FLOWS.md (unauthenticated flow, sessionStorage) → SUBSCRIPTION-MANAGEMENT.md (upgrades, proration, webhooks)
- **Accessibility:** ACCESSIBILITY-AUDIT.md (results) → SCREEN-READER-TESTING-GUIDE.md (procedures)
- **Release Process:** RELEASE-QUICKSTART.md - Two-phase process (Phase 1: Prep for Release, Phase 2: Release Deployment)

---

## ⚙️ Critical Implementation Guidelines

### E2E Testing: Event-Based Waiting
❌ **Never use `waitForTimeout()`** - causes race conditions
✅ **Always wait for events:**
- Network: `page.waitForResponse()`
- DOM: `expect().toBeVisible()`
- Components: `waitForSelector()`

### Backend Testing: ES Modules Required ⚠️
❌ **Never use CommonJS `require()`** in tests
✅ **Always use ES modules `import`:**
- Import jest from `@jest/globals`
- Mock BEFORE importing routes
- See [Pattern 11 in TEST-PATTERNS-GUIDE.md](docs/testing/TEST-PATTERNS-GUIDE.md#pattern-11-es-modules-vs-commonjs-in-backend-tests--new-v244)

### Quick References
- **Timezone:** EST/EDT labels (Morning 6-12, Afternoon 12-5, Evening 5-9, Night 9-6)
- **Mermaid:** Legend last in code, white bg, compact `<br/>` format ([guide](docs/components/MERMAID-DIAGRAMS.md))
- **Versions:** Run `npm run versions` before citing ([guide](docs/scripts/VERSION-CHECKER.md))

### Skipped Tests ([full guide](docs/testing/SKIPPED-TESTS.md))
**When skipping:** Add `.skip()`, comment reason, document in SKIPPED-TESTS.md with category/justification
**When unskipping:** Remove `.skip()`, verify passes, remove from SKIPPED-TESTS.md
**On release:** Run `grep "skipped"`, update counts, review quarterly
**Note:** Currently 54 frontend tests skipped. Database tests run separately in Docker (not counted).

### Database ([naming guide](docs/database/DB-NAMING-STANDARDS.md), [migration guide](docs/database/DB-MIGRATION-MANAGEMENT.md))
**Naming:** Tables plural snake_case, columns singular, indexes `idx_<table>_<column>`, explicit `ON DELETE`
**Migration Workflow:**
1. Docker sandbox: `npm run test:db -- migrations-XXX` ⚠️ **Get user approval before step 2**
2. Neon dev: `npm run migrate` + `npm run migrate:validate`
3. Production: Auto-deploy on `main` push

### Modal UX: No Auto-Close
❌ **Never auto-close** confirmation modals (email/payment/account changes)
✅ **Always require** explicit Close button click
**Why:** Users need time to read confirmations. Industry standard (Stripe, Gmail, Slack).

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

CodeScribe AI now supports multiple LLM providers with easy switching.

### Current Implementation
- **Architecture**: Simplified config-driven approach
- **Supported Providers**: Claude (Anthropic), OpenAI
- **Default Provider**: Claude Sonnet 4.5
- **Implementation**: ~650 lines of code

### Switching Providers

**Environment Variables** (`server/.env`):
```bash
# Use Claude (default)
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-...

# Use OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-5.1
```

**No code changes required** - just update environment variables and restart server.

### Provider Capabilities

| Feature | Claude | OpenAI |
|---------|--------|--------|
| Streaming | ✅ Yes | ✅ Yes |
| Prompt Caching | ✅ Yes (90% savings) | ❌ No |
| Max Context | 200K tokens | 128K tokens |
| Default Model | claude-sonnet-4-5-20250929 | gpt-5.1 |

### Documentation
- **Architecture Guide**: [MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md](docs/architecture/MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md)
- **Decision Guide**: [MULTI-PROVIDER-DECISION-GUIDE.md](docs/architecture/MULTI-PROVIDER-DECISION-GUIDE.md)
- **Visual Guide**: [MULTI-PROVIDER-ARCHITECTURE-VISUAL.md](docs/architecture/MULTI-PROVIDER-ARCHITECTURE-VISUAL.md)

### API Response Changes

Responses now include provider metadata:

```json
{
  "documentation": "...",
  "qualityScore": 85,
  "metadata": {
    "provider": "claude",          // NEW: Provider used
    "model": "claude-sonnet-4...", // NEW: Model used
    "inputTokens": 500,            // NEW: Token counts
    "outputTokens": 1000,
    "wasCached": true,             // NEW: Cache status
    "latencyMs": 1250,
    "language": "javascript",
    "docType": "README"
  }
}
```

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

---

## 🎯 Project Status

**Phase 1 (Days 1-5):** ✅ Complete - Web app, API, services, UI, tests
**Phase 1.5 (Days 6-10):** ✅ Complete - WCAG AA compliance, production deployment

**Final Metrics:**
- Accessibility: 95/100, WCAG 2.1 AA, 0 axe violations
- Performance: 75/100 Lighthouse (+67%), 78KB bundle (-85%)
- Testing: 3,231 tests (1,840 frontend, 1,391 backend, 90 skipped), 100% passing
- Deployment: Vercel + GitHub Actions CI/CD, custom domain

**Optional:** README screenshots, demo video, extended manual a11y testing

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

## 📝 Key Principles

1. **Portfolio** - Full-stack skills, speed, product thinking
2. **API-First** - Service layer supports CLI/VS Code extension
3. **Privacy** - Code in memory only; DB for auth/usage
4. **Real-Time** - SSE streaming for live doc generation
5. **Educational** - Quality scoring teaches best practices
6. **Scope** - 9-day timeline via strict discipline
7. **Cost** - Neon free tier covers 50K users ($0/mo)

---

## 🌐 Official Docs

[Vercel](https://vercel.com/docs) | [Neon](https://neon.tech/docs) | [GitHub Actions](https://docs.github.com/en/actions) | [Anthropic Claude](https://docs.anthropic.com/) | [React](https://react.dev/) | [Vite](https://vitejs.dev/) | [Tailwind](https://tailwindcss.com/docs) | [Node.js](https://nodejs.org/docs/) | [Express](https://expressjs.com/) | [Vitest](https://vitest.dev/) | [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🔄 Version History

**Current: v3.3.0** (December 9, 2025)
- Graph Engine API & Project Analysis
- Project Details page with Graph Analysis section (stats grid, architecture diagram, analyzed files list)
- Extended graph data in project API (functions, classes, exports, dependencies)
- Fixed doc panel not clearing on logout (race condition fix)
- Project Architecture Document spec (Epic 5.6 roadmap)
- 3,724 tests (3,637 passing, 87 skipped)
- Frontend: 1,913 passing, 54 skipped
- Backend: 1,724 passing, 33 skipped

<details>
<summary>Recent Releases (v2.9.0-v3.2.2) & Milestones</summary>

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
Last updated: December 9, 2025
</details>

---

**For questions about CodeScribe AI, start here and navigate to the appropriate detailed documentation.**
