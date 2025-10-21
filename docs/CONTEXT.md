# CodeScribe AI - Project Context

**What:** AI-powered code documentation generator with real-time streaming and quality scoring
**Tech Stack:** React 19, Node.js, Express, Claude API (Sonnet 4.5), Tailwind CSS, Monaco Editor
**Timeline:** Phase 1 (5 days) + Phase 1.5 (4 days) = 9 days total
**Current Phase:** ✅ Phase 1.5 Complete - Production Deployment
**Production URL:** [codescribeai.com](https://codescribeai.com)
**Status:** 🚀 Live in Production

---

## 🎯 Quick Reference

### What This Project Does
- Analyzes code using AST parsing (Acorn)
- Generates comprehensive documentation using Claude API
- Provides real-time streaming with Server-Sent Events
- Scores documentation quality (0-100 scale, 5 criteria)
- Supports 4 doc types: README, JSDoc, API, ARCHITECTURE
- 100% privacy-focused (no database, code never persisted)

### Key Achievements
- ✅ 660+ tests (100% pass rate across 5 browsers)
- ✅ 95/100 accessibility score (WCAG 2.1 AA compliant)
- ✅ +67% Lighthouse performance improvement (45→75)
- ✅ -85% bundle size reduction (516KB→78KB gzipped)
- ✅ Privacy-first analytics (production-only mode)
- ✅ Deployed to production with CI/CD pipeline

---

## 📚 Complete Documentation Map

For the **comprehensive documentation map** with descriptions of when to use each document, see **[CLAUDE.md](../CLAUDE.md)** - the master reference guide.

### Quick Navigation by Topic

**Planning & Requirements:**
- [01-PRD.md](planning/01-PRD.md) - Product vision, features, requirements, acceptance criteria
- [02-Epics-Stories.md](planning/02-Epics-Stories.md) - User stories, sprint planning
- [03-Todo-List.md](planning/03-Todo-List.md) - Day-by-day implementation tasks

**Development & Architecture:**
- [ARCHITECTURE-OVERVIEW.md](architecture/ARCHITECTURE-OVERVIEW.md) - Visual system diagram (Mermaid)
- [ARCHITECTURE.md](architecture/ARCHITECTURE.md) - Deep technical architecture
- [05-Dev-Guide.md](planning/05-Dev-Guide.md) - Implementation guide with code examples

**Design & UX:**
- [07-Figma-Guide.md](planning/07-Figma-Guide.md) - Complete design system
- [brand-color-palette.html](design/brand-color-palette.html) - Interactive color reference
- [brand-color-palette.pdf](design/brand-color-palette.pdf) - PDF version

**API & Backend:**
- [API-Reference.md](api/API-Reference.md) - Complete endpoint specifications
- [README.md](api/README.md) - API quick start guide

**Performance & Optimization:**
- [OPTIMIZATION-GUIDE.md](performance/OPTIMIZATION-GUIDE.md) - Complete performance guide
  - Lighthouse improvements (+67%)
  - Bundle size reduction (-85%)
  - Core Web Vitals tracking
  - Lazy loading patterns

**Component Guides:**
- [TOAST-SYSTEM.md](components/TOAST-SYSTEM.md) - Toast notification system (20+ variants)
- [MERMAID-DIAGRAMS.md](components/MERMAID-DIAGRAMS.md) - Diagram rendering guide
- [ERROR-HANDLING-UX.md](components/ERROR-HANDLING-UX.md) - Error UX patterns
- [COPYBUTTON.md](components/COPYBUTTON.md) - Copy-to-clipboard component
- [SELECT-USAGE.md](components/SELECT-USAGE.md) - Dropdown component guide

**Testing Documentation:**
- [testing/README.md](testing/README.md) - Testing hub (660+ tests)
- [COMPONENT-TEST-COVERAGE.md](testing/COMPONENT-TEST-COVERAGE.md) - Coverage report
- [frontend-testing-guide.md](testing/frontend-testing-guide.md) - React testing patterns
- [CROSS-BROWSER-TEST-PLAN.md](testing/CROSS-BROWSER-TEST-PLAN.md) - E2E strategy
- [ACCESSIBILITY-AUDIT.MD](testing/ACCESSIBILITY-AUDIT.MD) - WCAG audit
- [ERROR-HANDLING-TESTS.md](testing/ERROR-HANDLING-TESTS.md) - Error tests
- [MERMAID-DIAGRAM-TESTS.md](testing/MERMAID-DIAGRAM-TESTS.md) - Diagram tests
- [SCREEN-READER-TESTING-GUIDE.md](testing/SCREEN-READER-TESTING-GUIDE.md) - A11y testing

**Analytics & Insights:**
- [ANALYTICS.md](analytics/ANALYTICS.md) - Complete analytics guide
  - 8 event types (doc generation, quality scores, errors, etc.)
  - Production-only mode (disabled in development)
  - Privacy-first tracking (anonymous, no cookies, GDPR compliant)
  - Core Web Vitals monitoring

**Scripts & Utilities:**
- [VERSION-CHECKER.md](scripts/VERSION-CHECKER.md) - Package version utility
  - Run: `npm run versions`
  - Use before updating version docs

---

## 🔑 Critical Information

### Current State
- **Status:** Production deployment complete
- **URL:** https://codescribeai.com
- **Phase:** Phase 1.5 complete (Oct 16-19, 2025)
- **Next:** Phase 2 (CLI), Phase 3 (VS Code), Phase 4 (Optional enhancements)

### Tech Stack Versions
> **📊 Always use version checker for accuracy:** `npm run versions`
> See [VERSION-CHECKER.md](scripts/VERSION-CHECKER.md) for details

**Frontend:**
- React 19, Vite 7, Tailwind CSS 3.4
- Monaco Editor, react-markdown, Mermaid.js
- Lucide React (icons), react-hot-toast
- Vercel Analytics (privacy-first)
- Vitest, Testing Library, Playwright

**Backend:**
- Node.js 20+, Express 5
- Claude API (Sonnet 4.5: claude-sonnet-4-20250514)
- Acorn (AST parsing), Multer (uploads)
- Jest, Supertest

**Infrastructure:**
- Vercel (hosting)
- Server-Sent Events (streaming)
- GitHub Actions (CI/CD)

### API Endpoints
- `POST /api/generate` - Standard generation
- `POST /api/generate-stream` - Streaming with SSE
- `POST /api/upload` - File upload
- `GET /api/health` - Health check

### Quality Scoring Criteria (100 points)
1. Overview/Description (20 pts)
2. Installation Instructions (15 pts)
3. Usage Examples (20 pts)
4. API Documentation (25 pts)
5. Structure/Formatting (20 pts)

**Grading:** A (90+), B (80-89), C (70-79), D (60-69), F (<60)

---

## 🎨 Design System Quick Reference

### Brand Colors
- **Purple** (Primary): Actions, CTAs, brand elements
- **Indigo** (Secondary): Primary badges/info, highlights
- **Slate** (Neutral): Helper text, secondary badges, chrome
- **Green** (Success): Positive feedback
- **Yellow** (Warning): Caution states
- **Red** (Error): Errors, destructive actions

**Full Reference:** [brand-color-palette.html](design/brand-color-palette.html)

### UI Pattern Guidelines
- **Helper text / instructional banners** → Slate (`slate/100` bg, `slate/700` text)
- **Primary badges** (docType, categories) → Indigo (`indigo/100` bg, `indigo/700` text)
- **Secondary badges** (language, metadata) → Slate (`slate/100` bg, `slate/600` text)
- **Color hierarchy:** Purple (actions) > Indigo (primary info) > Slate (secondary/chrome)

---

## 🧪 Testing Quick Reference

### Running Tests
```bash
# Frontend (from client/)
npm test              # Run all tests
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report

# Backend (from server/)
npm test              # Run all tests
npm run test:coverage # Coverage with thresholds

# E2E (from client/)
npm run test:e2e              # All browsers
npm run test:e2e:chromium     # Chromium only
npm run test:e2e:headed       # With browser UI
```

### Test Stats
- **Total Tests:** 660+ (100% passing)
- **Backend:** 133+ tests (95.81% statements, 88.72% branches)
- **Frontend:** 513+ tests (100% critical paths)
- **E2E:** 10 tests across 5 browsers (100% pass rate)

---

## 📊 Analytics Quick Reference

### Event Types (8 total)
1. **doc_generation** - Generation attempts (success/failure)
2. **quality_score** - Score tracking (0-100)
3. **code_input** - Input methods (paste/upload/example)
4. **file_upload** - Upload attempts
5. **example_usage** - Example loading
6. **user_interaction** - UI actions
7. **performance** - Operation timing
8. **error** - Error tracking (sanitized)

### Key Features
- **Production-only mode** - Disabled in development
- **Privacy-first** - Anonymous, no cookies, GDPR compliant
- **Sanitized errors** - API keys/tokens removed
- **Core Web Vitals** - Automatic FCP, LCP, CLS, FID tracking

**Full Guide:** [ANALYTICS.md](analytics/ANALYTICS.md)

---

## 🚀 Development Commands

### Setup
```bash
npm run install:all   # Install all dependencies
```

### Development
```bash
npm run dev           # Start both server and client
npm run dev:server    # Server only (port 3000)
npm run dev:client    # Client only (port 5173)
```

### Building & Deployment
```bash
npm run build         # Build client for production
npm start             # Start server in production mode
```

### Utilities
```bash
npm run versions      # Check all package versions
```

---

## 📝 Important Notes for Development

### Best Practices
1. **Always use version checker** before updating docs: `npm run versions`
2. **Reference CLAUDE.md** for comprehensive documentation map
3. **Check existing docs** before creating new ones
4. **Follow design system** in [07-Figma-Guide.md](planning/07-Figma-Guide.md)
5. **Maintain accessibility** - WCAG 2.1 AA compliance required
6. **Test across browsers** - Use Playwright E2E tests

### Architecture Principles
- **API-first design** - Service layer is framework-agnostic
- **No database** - Privacy-focused, code never persisted
- **Streaming** - Real-time with Server-Sent Events
- **Quality scoring** - Educational tool for documentation best practices
- **Accessibility-first** - WCAG 2.1 AA compliance

### Key Differentiators
1. **Real-time streaming** - Character-by-character generation
2. **Quality scoring** - Not just generation, but education
3. **Privacy-focused** - No storage, anonymous analytics
4. **Enterprise UX** - Toast system, error handling, accessibility
5. **Performance optimized** - Lazy loading, Core Web Vitals tracking
6. **Comprehensive testing** - 660+ tests across 3 frameworks

---

## 🔄 Project Timeline

**Phase 1 (Oct 11-16, 2025)** ✅ Complete
- Days 1-5: Core application development
- Full-stack implementation with 660+ tests
- Performance optimization (+67% Lighthouse)
- Accessibility improvements

**Phase 1.5 (Oct 16-19, 2025)** ✅ Complete
- Days 6-9: WCAG AA compliance
- Production deployment to Vercel
- CI/CD pipeline setup
- Analytics implementation

**Phase 2 (Future)** - CLI Tool
**Phase 3 (Future)** - VS Code Extension
**Phase 4 (Future)** - Optional Enhancements

---

## 📖 Documentation Usage Guidelines

### When Working on Different Tasks

**Need product requirements?** → [01-PRD.md](planning/01-PRD.md)
**Need implementation details?** → [05-Dev-Guide.md](planning/05-Dev-Guide.md)
**Need API specs?** → [API-Reference.md](api/API-Reference.md)
**Need architecture info?** → [ARCHITECTURE-OVERVIEW.md](architecture/ARCHITECTURE-OVERVIEW.md) or [ARCHITECTURE.md](architecture/ARCHITECTURE.md)
**Need design guidance?** → [07-Figma-Guide.md](planning/07-Figma-Guide.md)
**Need performance info?** → [OPTIMIZATION-GUIDE.md](performance/OPTIMIZATION-GUIDE.md)
**Need analytics info?** → [ANALYTICS.md](analytics/ANALYTICS.md)
**Need testing info?** → [testing/README.md](testing/README.md)
**Need component guidance?** → [components/](components/) folder

**For the complete documentation map with detailed descriptions, always refer to [CLAUDE.md](../CLAUDE.md)**

---

**Last Updated:** October 20, 2025
**Project Status:** Production Ready ✅
**Version:** 1.21
