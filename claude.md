# CodeScribe AI - Claude Context Reference

**Project:** CodeScribe AI - Intelligent Code Documentation Generator
**Current Phase:** Day 1 - Backend Setup
**Tech Stack:** React 19 + Vite, Node.js + Express, Claude API, Tailwind CSS, Monaco Editor
**Timeline:** 5-7 days to MVP
**Status:** In Development
**Timezone:** Eastern Standard Time (EST/EDT) - All dates and times in documentation reference this timezone

---

## 📋 Project Overview

CodeScribe AI is an AI-powered documentation generator that analyzes code and produces comprehensive documentation (README, JSDoc, API docs) with real-time streaming and quality scoring. Built as a full-stack portfolio project demonstrating technical excellence across:

- Full-stack JavaScript development (React + Node.js)
- AI integration (Anthropic Claude API)
- Real-time streaming (Server-Sent Events)
- Code analysis (AST parsing with Acorn)
- Quality algorithms (documentation scoring)
- Modern UX (Monaco Editor, responsive design)

**Current Goal:** Complete Phase 1 (Web Application) within 5 days.

---

## 🗺️ Documentation Map

This project has comprehensive documentation organized by purpose. Use this as your guide to understand which document to reference for different questions.

### 📐 Planning & Requirements

#### [01-PRD.md](docs/planning/01-PRD.md) - Product Requirements Document
**When to use:** Understanding product vision, features, requirements, success criteria

**Contains:**
- Executive summary and mission
- Problem statement and target audience
- Complete feature specifications (FR-1.x through FR-5.x)
- Non-functional requirements (performance, security, accessibility)
- Technical architecture overview
- User flows and acceptance criteria
- Release plan and timeline (Phases 1-4)
- Phase 4: Optional Enhancements (future evaluation)
- Out-of-scope items

**Key for:** Feature decisions, scope questions, acceptance criteria validation, future roadmap

---

#### [02-Epics-Stories.md](docs/planning/02-Epics-Stories.md) - Epics & User Stories
**When to use:** Understanding implementation from product owner perspective

**Contains:**
- 5 epics broken into user stories
- Epic 1: Code Input & Management (E1-S1 through E1-S3)
- Epic 2: AI Documentation Generation (E2-S1 through E2-S4)
- Epic 3: Quality Assessment (E3-S1 through E3-S3)
- Epic 4: User Interface (E4-S1 through E4-S3)
- Epic 5: Deployment & Documentation (E5-S1 through E5-S3)
- Story points, acceptance criteria, technical notes
- Sprint planning breakdown by day
- Definition of Ready and Definition of Done

**Key for:** User-centric feature understanding, acceptance testing, sprint planning

---

#### [03-Todo-List.md](docs/planning/03-Todo-List.md) - Project Manager Todo List
**When to use:** Day-by-day task breakdown, current progress tracking

**Contains:**
- Day 1-5 detailed task lists
- Morning/afternoon session breakdowns
- Setup instructions (dependencies, project structure)
- Checkpoints and time checks
- Risk management strategies
- Progress tracking checklists

**Key for:** Daily task planning, dependency installation, setup procedures

---

### 🏗️ Architecture & Development

#### [04-Architecture.md](docs/architecture/04-Architecture.md) - System Architecture Diagram & Overview
**When to use:** Visual system architecture reference, quick component overview

**Contains:**
- **Interactive Mermaid diagram** (renders on GitHub) showing full system architecture
- Architecture layer overview:
  - Client layer (Browser, CLI, VS Code Extension)
  - Frontend layer (React components: App, Header, ControlBar, CodePanel, DocPanel, QualityScore)
  - API layer (Express routes: /generate, /generate-stream, /upload, /health)
  - Service layer (DocGenerator, ClaudeClient, CodeParser, QualityScorer)
  - External services (Claude API)
  - Infrastructure (Vercel, Analytics, Environment Variables)
- Simplified data flow explanation
- Technology stack summary

**Key for:** Visual system understanding, quick architecture reference, stakeholder presentations

> **Note:** For deep technical details, see [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)

---

#### [05-Dev-Guide.md](docs/planning/05-Dev-Guide.md) - Senior Engineer Development Guide
**When to use:** Implementation details, code examples, technical decisions

**Contains:**
- Complete project structure with folder layouts
- Technology stack justification
- Full implementation code for:
  - Claude API integration (claudeClient.js)
  - Documentation generator service (docGenerator.js)
  - Code parser with AST analysis (codeParser.js)
  - Quality scoring algorithm (qualityScorer.js)
  - API routes (api.js)
  - React hooks (useDocGeneration.js)
- Deployment guide (Vercel)
- Testing strategy
- Performance optimization techniques
- Key architectural principles

**Key for:** Writing code, implementation patterns, best practices, deployment

---

#### [API-Reference.md](docs/api/API-Reference.md) - API Documentation
**When to use:** API endpoint specifications, request/response formats

**Contains:**
- Complete API endpoint specifications:
  - POST /api/generate (standard)
  - POST /api/generate-stream (SSE streaming)
  - POST /api/upload (file upload)
  - GET /api/health
- Request/response formats with examples
- Error handling and status codes
- Quality score breakdown algorithm
- Rate limiting details
- cURL examples and testing instructions

**Key for:** API implementation, testing, integration, error handling

---

### 📊 Performance & Optimization

#### [OPTIMIZATION-GUIDE.md](docs/performance/OPTIMIZATION-GUIDE.md) - Performance Optimization Guide
**When to use:** Understanding performance improvements, lazy loading strategy, bundle analysis, Core Web Vitals tracking

**Contains:**
- Performance audit results timeline (45 → 75 Lighthouse score, +67% improvement)
- Bundle size evolution (516 KB → 78 KB gzipped, -85% reduction)
- Core Web Vitals metrics (FCP: -89%, LCP: -93%, TBT: -30%)
- Lazy loading implementation patterns:
  - Monaco Editor (4.85 KB gzipped)
  - Mermaid.js (139.30 KB gzipped)
  - DocPanel with ReactMarkdown (281.53 KB gzipped)
  - Modal components (2-9 KB each)
- Bundle analysis with rollup-plugin-visualizer
- Testing & validation procedures (Lighthouse CLI, dev tools verification)
- Future optimization recommendations (Service Worker, HTTP/2, font optimization, edge computing)
- Maintenance guidelines and troubleshooting (decision trees, audit checklists)
- Complete changelog with optimization stages

**Key for:** Performance optimization decisions, lazy loading patterns, bundle analysis, Lighthouse auditing, Core Web Vitals tracking, maintenance best practices

---

### 🎨 Design & UX

#### [07-Figma-Guide.md](docs/planning/07-Figma-Guide.md) - Complete Figma Design Guide
**When to use:** UI/UX design, component specifications, visual design system

**Contains:**
- Complete design system:
  - Color palette (purple primary, indigo secondary, slate neutrals, semantic colors)
  - Typography styles (Inter + JetBrains Mono)
  - Shadow/effect styles
  - Spacing system (4px base unit)
- **UI Pattern Guidelines** (NEW):
  - Helper text / instructional banners → Use **slate** (`slate/100` bg, `slate/700` text)
  - Primary badges (docType, categories) → Use **indigo** (`indigo/100` bg, `indigo/700` text)
  - Secondary badges (language, metadata) → Use **slate** (`slate/100` bg, `slate/600` text)
  - Color hierarchy: Purple (actions) > Indigo (primary info) > Slate (secondary/chrome)
- Component library (8 components with variants):
  - Buttons (Primary, Secondary, Icon)
  - Select dropdown
  - Code panel
  - Documentation panel
  - Quality score breakdown
  - Mobile menu
- Desktop layout (1440px)
- Mobile layout (375px)
- Responsive design patterns
- Interaction & prototyping flows

**Key for:** UI implementation, styling decisions, component design, responsive behavior, color selection for new UI elements

---

### 📝 Implementation & Prompts

#### [08-Master-Prompt.md](docs/planning/08-Master-Prompt.md) - Master Implementation Prompt
**When to use:** Comprehensive guide synthesizing all documentation

**Contains:**
- Project summary and philosophy
- Day-by-day implementation plan (Days 1-5)
- Essential code snippets:
  - Environment variables
  - Package.json scripts
  - Tailwind configuration
  - API client code
- Design system quick reference
- Testing checklist (functionality, responsive, cross-browser, performance, accessibility)
- README template
- Pre-launch checklist
- Success criteria

**Key for:** Holistic project understanding, quick code references, launch preparation

---

### 🎨 Design Assets

#### Brand Color Palette - Interactive Reference & PDF
**When to use:** Visual reference for brand colors, sharing with designers/developers, presentations

**Files:**
- **[brand-color-palette.html](docs/design/brand-color-palette.html)** - Interactive version with click-to-copy
- **[brand-color-palette.pdf](docs/design/brand-color-palette.pdf)** - Printable/shareable PDF version

**Contains:**
- 27 colors across 6 families (Purple, Indigo, Slate, Green, Yellow, Red)
- Click-to-copy hex codes for each color (HTML version)
- Usage guidelines for each color family
- Accessibility information (WCAG AA compliance)
- Examples for buttons, alerts, text, backgrounds

**Key for:** Color selection, design consistency, developer implementation, accessibility verification, stakeholder presentations

**How to open:**
```bash
# Interactive HTML version
open docs/design/brand-color-palette.html

# PDF version
open docs/design/brand-color-palette.pdf
```

---

### 📚 Supporting Context

#### [CONTEXT.md](docs/CONTEXT.md) - Project Context (Quick Reference)
**When to use:** Quick project orientation, current task reminder

**Contains:**
- One-line project description
- Tech stack summary
- Timeline (5 days)
- Current phase indicator
- Key file references
- Current task note
- Important reminders

**Key for:** Quick context refresh, orienting to current work

---

#### [README.md](docs/api/README.md) - API Overview
**When to use:** Quick start guide for API usage, endpoint overview

**Contains:**
- API quick start guide
- Base URLs (development/production)
- Available endpoints summary
- Quick examples (cURL, JavaScript)
- Links to detailed API reference

**Key for:** API onboarding, quick testing, endpoint discovery

---

#### [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Architecture Deep Dive
**When to use:** In-depth technical architecture, security, performance, scalability, deployment

**Contains:**
- Detailed architecture explanations with ASCII diagrams
- Component design patterns (Singleton, Strategy, Decorator)
- Comprehensive data flow diagrams (standard, streaming, parsing)
- Complete API architecture with request/response examples
- Security architecture (API key management, input validation, rate limiting, CORS, privacy)
- Performance & scalability targets and optimization strategies
- Deployment architecture and CI/CD pipeline details
- Monitoring & observability strategies
- Future enhancement plans (Phase 2: CLI, Phase 3: VS Code)

**Key for:** Deep technical understanding, security/performance decisions, deployment planning, scaling strategies

---

#### [TOAST-SYSTEM.md](docs/components/TOAST-SYSTEM.md) - Toast Notification System Guide
**When to use:** Implementing toast notifications, understanding toast patterns, accessibility requirements

**Contains:**
- Complete toast system architecture and usage guide
- 20+ toast utility functions with examples
- 6 custom toast components (CustomToast, ProgressToast, UndoToast, etc.)
- Best practices for user notifications
- Full accessibility support (WCAG 2.1 AA compliant)
- Testing strategies and examples
- API reference for all toast functions
- Optional enhancements for Phase 4 evaluation

**Key for:** Toast implementation, notification patterns, accessibility compliance, UX best practices

---

#### [MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md) - Mermaid Diagram Developer Guide
**When to use:** Creating or modifying Mermaid diagrams, understanding diagram patterns, troubleshooting rendering issues

**Contains:**
- Complete Mermaid implementation guide for CodeScribe AI
- CodeScribe AI diagram patterns (brand colors, legend placement, theme configuration)
- React component implementation (`MermaidDiagram.jsx`, `DocPanel.jsx` integration)
- Best practices for diagram structure, accessibility, performance
- Configuration reference (theme variables, flowchart settings, security levels)
- Practical examples (system architecture, sequence diagrams, state machines)
- Testing & debugging strategies (console debugging, validation checklist, cross-browser testing)
- Troubleshooting guide (rendering issues, style application, legend placement, performance)
- Future enhancement ideas for Phase 4 evaluation

**Key for:** Diagram creation, brand consistency, React integration, debugging rendering issues, maintaining visual standards

---

#### [ERROR-HANDLING-UX.md](docs/components/ERROR-HANDLING-UX.md) - Error Handling UX Design Guide
**When to use:** Implementing error banners, choosing between banners vs modals, animation specifications, error UX patterns

**Contains:**
- Research-based best practices from Nielsen Norman Group, Material Design, Carbon Design System
- Decision framework for inline banners vs modal popups (when to use each)
- Animation specifications (250ms enter with slide+fade, 200ms exit with fade)
- React component implementation examples with state management
- Tailwind CSS configuration for error animations
- CodeScribe AI-specific error patterns and classification table
- Error message content standards (network errors, rate limits, validation, server errors)
- Visual design standards (colors, typography, spacing, icons)
- Complete accessibility considerations (ARIA attributes, motion preferences, keyboard navigation)
- Screen reader testing checklist
- References to all UX research sources

**Key for:** Error banner implementation, animation timing decisions, accessibility compliance, UX research-backed patterns, choosing notification display methods

---

#### [COPYBUTTON.md](docs/components/COPYBUTTON.md) - CopyButton Component Guide
**When to use:** Implementing copy-to-clipboard functionality, understanding CopyButton component variants and usage

**Contains:**
- Enterprise-grade feature overview (icon animation, color feedback, auto-reset, accessibility, haptic feedback)
- Quick examples for icon-only and labeled buttons
- Variants and sizes reference (ghost, outline, solid)
- Animation timeline (0ms to 2200ms state transitions)
- Integration points in CodeScribe AI (DocPanel, CodePanel, ExamplesModal, QualityScore)
- Best practices (DO/DON'T guidelines)
- Enterprise design decisions (timing, colors, animations, accessibility)

**Key for:** CopyButton implementation, variant selection, accessibility patterns, animation specifications

---

### 🧪 Testing Documentation

#### [Testing README](docs/testing/README.md) - Testing Documentation Hub
**When to use:** Starting point for all testing documentation, quick stats, running tests

**Contains:**
- Quick stats (319 tests, 72.2% coverage, 100% passing)
- Testing documentation index with links to all test guides
- Quick start commands for frontend and backend tests
- Test coverage summary tables
- Testing strategy and pyramid
- Best practices overview
- Related documentation links

**Key for:** Test navigation, quick test commands, coverage overview

---

#### [COMPONENT-TEST-COVERAGE.md](docs/testing/COMPONENT-TEST-COVERAGE.md) - Component Test Coverage Report ⭐ **START HERE**
**When to use:** Understanding which components are tested, test breakdown details, coverage analysis

**Contains:**
- Overall statistics (13/18 components tested, 319 tests, 100% passing)
- Detailed breakdown of all 13 tested components with test counts
- Analysis of 5 untested components with justification for skipping
- Test categories for each component (rendering, interactions, accessibility, edge cases)
- Testing patterns and best practices
- Running tests commands
- Coverage metrics by component type and test category
- Recent updates timeline (Oct 16, 2025: +124 tests, +16.6% coverage)

**Key for:** Test coverage decisions, understanding test organization, identifying gaps, tracking progress

---

#### [Frontend Testing Guide](docs/testing/frontend-testing-guide.md) - Comprehensive React Testing Patterns
**When to use:** Writing new component tests, understanding testing patterns, best practices

**Contains:**
- Testing framework details (Vitest + React Testing Library)
- Component testing patterns and examples
- Mocking strategies (Monaco Editor, Mermaid, APIs)
- Accessibility testing guidelines
- User interaction testing
- Edge case testing
- Performance testing considerations

**Key for:** Test implementation, mocking patterns, accessibility compliance, writing quality tests

---

#### [TEST-GUIDE.md](docs/testing/TEST-GUIDE.md) - Quick Reference for Running Tests
**When to use:** Running tests, debugging test failures, coverage reports

**Contains:**
- Quick start commands
- Watch mode usage
- Coverage report generation
- Debugging tips
- Common troubleshooting

**Key for:** Day-to-day test execution, debugging, CI/CD setup

---

#### [IMPLEMENTATION-SUMMARY.md](docs/testing/IMPLEMENTATION-SUMMARY.md) - Backend Test Implementation
**When to use:** Understanding backend test setup, service layer testing, integration tests

**Contains:**
- Jest configuration
- Service layer test examples
- Integration test patterns
- Coverage requirements
- Backend-specific testing strategies

**Key for:** Backend test implementation, Jest configuration, service testing

---

#### Specialized Test Documentation

**[ERROR-HANDLING-TESTS.md](docs/testing/ERROR-HANDLING-TESTS.md)** - Error handling test suites
- ErrorBanner (58 tests) - User-facing error notifications
- ErrorBoundary (12 tests) - Technical error catching
- Animation specs (250ms enter, 200ms exit)
- WCAG 2.1 AA accessibility compliance

**[MERMAID-DIAGRAM-TESTS.md](docs/testing/MERMAID-DIAGRAM-TESTS.md)** - Mermaid diagram rendering tests
- Diagram rendering (14 tests)
- Brand theming (purple, indigo, slate)
- Error handling and async cleanup

**[monaco-syntax-highlighting-tests.md](docs/testing/monaco-syntax-highlighting-tests.md)** - Monaco Editor tests
- Language support verification (24+ languages)
- Theme configuration
- Editor integration

**[PROMPT-QUALITY-REPORT.md](docs/testing/PROMPT-QUALITY-REPORT.md)** - AI prompt quality testing
- Prompt validation tests
- Quality metrics
- Claude API integration tests

**Key for:** Specialized component testing, specific test suites, detailed test documentation

---

### 🛠️ Scripts & Utilities

#### [VERSION-CHECKER.md](docs/scripts/VERSION-CHECKER.md) - Version Checker Script Documentation
**When to use:** Retrieving accurate package versions, updating documentation with current technology versions, dependency audits

**Contains:**
- Complete documentation for `scripts/check-versions.js` utility script
- Usage instructions (`npm run versions` or `npm run check-versions`)
- Output sections breakdown (System Environment, Frontend Stack, Backend Stack, AI Model, Summary)
- Use cases (documentation updates, debugging, audits, onboarding, CI/CD)
- Troubleshooting guide for version detection issues
- Maintenance guidelines for adding new packages
- Example output with colorized terminal display

**Key for:** Getting accurate installed versions for all packages, updating ARCHITECTURE.md tech stack tables, verifying package installations, dependency management

**⚠️ IMPORTANT:** When updating documentation that references package versions (ARCHITECTURE.md, CLAUDE.md Tech Stack section, API-Reference.md, etc.), **ALWAYS run the version checker script first** to ensure accuracy:
```bash
npm run versions
```

---

## 🔑 Key Technical Details

### Tech Stack

> **📊 For Accurate Version Information:** Run `npm run versions` to get the exact installed versions of all packages. See [VERSION-CHECKER.md](docs/scripts/VERSION-CHECKER.md) for details.

**Frontend:**
- React 19 with Vite
- Tailwind CSS 3.4+
- Monaco Editor (@monaco-editor/react)
- react-markdown
- Lucide React (icons)

**Backend:**
- Node.js 20+
- Express 5
- Anthropic Claude API (Sonnet 4.5: claude-sonnet-4-20250514)
- Acorn (JavaScript AST parsing)
- Multer (file uploads)

**Infrastructure:**
- Vercel (hosting)
- Server-Sent Events (streaming)
- Environment variables for secrets

> **Note:** The versions listed above are approximate. For exact installed versions, use the version checker script.

### Project Structure
```
codescribe-ai/
├── client/                        # Frontend
│   ├── src/
│   └── package.json
├── server/                        # Backend
│   ├── src/
│   │   ├── services/             # Core services (claudeClient, docGenerator, etc.)
│   │   ├── routes/               # API routes
│   │   └── server.js
│   └── package.json
├── docs/                          # Documentation
│   ├── planning/                 # Project planning
│   │   ├── 01-PRD.md
│   │   ├── 02-Epics-Stories.md
│   │   ├── 03-Todo-List.md
│   │   ├── 05-Dev-Guide.md
│   │   ├── 07-Figma-Guide.md
│   │   └── 08-Master-Prompt.md
│   ├── api/                      # API documentation
│   │   ├── README.md             # API overview
│   │   ├── API-Reference.md      # Detailed API docs
│   │   ├── API-Examples.md       # cURL/JS examples (planned)
│   │   └── CHANGELOG.md          # API version history (planned)
│   ├── architecture/             # Architecture documentation
│   │   ├── 04-Architecture.md    # System architecture diagram
│   │   └── ARCHITECTURE.md       # Architecture overview
│   ├── performance/              # Performance optimization
│   │   └── OPTIMIZATION-GUIDE.md # Performance optimization guide
│   ├── components/               # Component documentation
│   │   ├── TOAST-SYSTEM.md       # Toast notification system guide
│   │   ├── MERMAID-DIAGRAMS.md   # Mermaid diagram developer guide
│   │   ├── ERROR-HANDLING-UX.md  # Error handling UX guide
│   │   └── COPYBUTTON.md         # CopyButton component guide
│   ├── testing/                  # Testing documentation
│   │   ├── README.md             # Testing documentation hub
│   │   ├── COMPONENT-TEST-COVERAGE.md  # Component test coverage report
│   │   ├── frontend-testing-guide.md   # React testing patterns
│   │   ├── TEST-GUIDE.md         # Quick reference for running tests
│   │   ├── IMPLEMENTATION-SUMMARY.md   # Backend test implementation
│   │   ├── ERROR-HANDLING-TESTS.md     # Error component tests
│   │   ├── MERMAID-DIAGRAM-TESTS.md    # Diagram rendering tests
│   │   ├── monaco-syntax-highlighting-tests.md  # Monaco Editor tests
│   │   └── PROMPT-QUALITY-REPORT.md    # AI prompt quality tests
│   ├── design/                   # Design assets
│   │   ├── brand-color-palette.html  # Interactive color palette
│   │   └── brand-color-palette.pdf   # PDF version for sharing
│   ├── scripts/                  # Script documentation
│   │   └── VERSION-CHECKER.md    # Version checker utility guide
│   └── CONTEXT.md                # Quick reference
├── private/                       # ⚠️ GITIGNORED - Sensitive content only
│   ├── README.md                 # Guidelines for private folder usage
│   ├── VISION.md                 # Strategic vision, market analysis, GTM strategy
│   ├── INTERVIEW-GUIDE.md        # Interview prep, talking points, demo scripts
│   ├── financials/               # Revenue projections, budgets (suggested)
│   ├── investors/                # Pitch decks, investor comms (suggested)
│   ├── customers/                # Interview notes, PII data (suggested)
│   ├── strategy/                 # Competitive analysis (suggested)
│   ├── partnerships/             # Partnership negotiations (suggested)
│   └── legal/                    # Legal documents (suggested)
├── .gitignore
├── README.md                      # Main project README
└── CLAUDE.md                      # This file
```

### Private Folder (Sensitive Content)

**⚠️ IMPORTANT:** The `private/` folder is **excluded from version control** via `.gitignore`. This folder contains sensitive business information that should never be committed to the repository.

**What belongs in `private/`:**
- **Strategic planning** - Vision documents, market analysis, competitive research, GTM strategy
- **Interview preparation** - Interview guides, talking points, demo scripts, personal Q&A
- **Financial information** - Revenue projections, pricing models, budgets, cost analysis
- **Customer data** - Interview transcripts, beta feedback, research notes (may contain PII)
- **Investor relations** - Pitch decks, investor communications, term sheets, cap table
- **Partnership docs** - Proposals, negotiations, contract drafts
- **Internal docs** - Postmortems, employee info, compensation planning

**What does NOT belong in `private/`:**
- **Actual API keys/secrets** → Use `.env` files (also gitignored)
- **Public documentation** → Use `docs/` folder
- **Code and specs** → Use appropriate repo folders
- **Public roadmap** → Can go in `docs/planning/`

**Security best practices:**
- Back up `private/` regularly to secure cloud storage (not in Git!)
- Verify folder is excluded: `git check-ignore private/` (should output: `private/`)
- Be cautious during screen shares - this folder won't be on GitHub
- When in doubt, keep it private - easier to make public later

**Reference:** See [private/README.md](private/README.md) for complete guidelines

### Core Services (Backend)
1. **claudeClient.js** - Handles Claude API communication, streaming, retries
2. **docGenerator.js** - Core service generating docs, builds prompts, orchestrates
3. **codeParser.js** - Parses code to AST, extracts functions/classes/exports
4. **qualityScorer.js** - Scores documentation on 5 criteria (0-100 scale)

### Documentation Types Supported
1. **README.md** - Comprehensive project documentation
2. **JSDoc** - Inline code comments with @param/@returns/@example
3. **API** - Endpoint/function documentation
4. **ARCHITECTURE** - System design overview

### Quality Scoring Criteria
1. Overview/Description (20 points)
2. Installation Instructions (15 points)
3. Usage Examples (20 points)
4. API Documentation (25 points)
5. Structure/Formatting (20 points)

**Grading:** A (90+), B (80-89), C (70-79), D (60-69), F (<60)

---

## 📖 How to Use This Documentation (Claude Guidelines)

When answering questions about CodeScribe AI:

### 1. Identify Question Type
- **Planning/Scope** → Reference PRD or Epics
- **Implementation** → Reference Dev Guide or Master Prompt
- **API/Endpoints** → Reference API Reference
- **Design/UI** → Reference Figma Guide or Brand Color Palette
- **Architecture** → Reference Architecture diagram or ARCHITECTURE.md
- **Performance/Optimization** → Reference OPTIMIZATION-GUIDE.md
- **Diagrams/Visualization** → Reference MERMAID-DIAGRAMS.md
- **Components** → Reference TOAST-SYSTEM.md, MERMAID-DIAGRAMS.md, ERROR-HANDLING-UX.md, or COPYBUTTON.md
- **Testing** → Reference Testing README, COMPONENT-TEST-COVERAGE.md, or frontend-testing-guide.md
- **Current Tasks** → Reference Todo List
- **Explanation/Demo** → Reference Interview Guide
- **Package Versions/Dependencies** → Run version checker script (`npm run versions`), reference VERSION-CHECKER.md

### 2. Provide Context
- Always mention which document you're referencing
- Include file path for easy navigation (e.g., `docs/planning/05-Dev-Guide.md`)
- Quote relevant sections when helpful
- Reference specific line numbers if available

### 3. Be Implementation-Ready
- Provide code examples from Dev Guide when relevant
- Reference specific component/service names
- Include file paths for where code should be written
- Mention dependencies that need installation

### 4. Stay Consistent with Documentation
- Don't invent features not in the PRD
- Stick to the tech stack specified
- Follow the architectural patterns documented
- Respect scope boundaries (Phase 1 vs Phase 2/3)

### 5. Cross-Reference When Needed
Multiple docs cover the same topic from different angles:
- **Quality Scoring**: PRD (requirements), Dev Guide (implementation), API Reference (algorithm details)
- **Architecture**: 04-Architecture.md (visual diagram + quick overview), ARCHITECTURE.md (deep technical dive), Dev Guide (implementation), Master Prompt (summary)
- **Setup**: Todo List (tasks), Dev Guide (code), Master Prompt (quick commands)
- **Performance**: OPTIMIZATION-GUIDE.md (comprehensive guide), Dev Guide (optimization techniques), ARCHITECTURE.md (performance targets)
- **Lazy Loading**: OPTIMIZATION-GUIDE.md (implementation patterns), Dev Guide (React best practices)
- **Mermaid Diagrams**: MERMAID-DIAGRAMS.md (comprehensive guide), CLAUDE.md section 7 (quick reference), 04-Architecture.md (implementation example)
- **Component Patterns**: TOAST-SYSTEM.md (toast notifications), MERMAID-DIAGRAMS.md (diagram rendering), ERROR-HANDLING-UX.md (error banners and modals), COPYBUTTON.md (copy-to-clipboard functionality)
- **Error Handling**: ERROR-HANDLING-UX.md (UX patterns, animations, accessibility), TOAST-SYSTEM.md (error toasts for non-blocking notifications)
- **Testing**: Testing README (overview and quick commands), COMPONENT-TEST-COVERAGE.md (detailed coverage report), frontend-testing-guide.md (patterns and best practices), TEST-GUIDE.md (running tests)
- **Package Versions**: VERSION-CHECKER.md (script documentation), ARCHITECTURE.md (tech stack tables), CLAUDE.md Tech Stack section (quick reference)

Always provide the most relevant reference for the question asked.

### 6. Timezone Awareness for Documentation Updates
**IMPORTANT:** When updating documentation (especially the Todo List) with timestamps:
- **All times reference Eastern Standard Time (EST/EDT)**
- **Automatic Session Labeling:** When adding session labels to documentation, you MUST:
  1. Check the current date/time in the `<env>` section
  2. Convert the system time to EST/EDT timezone (account for UTC offset)
  3. Use the appropriate session label based on EST time:
     - **Morning Session**: 6:00 AM - 12:00 PM EST
     - **Afternoon Session**: 12:00 PM - 5:00 PM EST
     - **Evening Session**: 5:00 PM - 9:00 PM EST
     - **Night Session**: 9:00 PM - 6:00 AM EST
  4. Example: If system time is 4:00 PM UTC and EST is UTC-5, then EST time is 11:00 AM → Use "Morning Session"
  5. Example: If system time is 7:00 PM UTC and EST is UTC-4 (EDT), then EST time is 3:00 PM → Use "Afternoon Session"
- **When to use generic "Session":** Only use generic "Session" label if:
  - System time is unavailable in `<env>`
  - Timezone conversion is unclear
  - Session spans multiple timeframes
- **The user is located in EST timezone** - always label based on their local time, not system/server time
- **Pro tip:** During daylight saving time (March-November), EST becomes EDT (UTC-4 instead of UTC-5)

### 7. Mermaid Diagram Guidelines
When creating or modifying Mermaid diagrams for this project, refer to the **[MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md)** comprehensive developer guide.

**Quick Reference (see full guide for details):**

**Legend/Index Placement:**
- **Place legend last** in the Mermaid code (after all subgraphs, before node connections)
- **Position:** Top-left area (Mermaid's auto-layout places standalone subgraphs here - ideal for immediate reference!)
- **Use compact format** with `<br/>` tags to stack legend items vertically
- **Simple title:** `subgraph legend ["🗺️ LEGEND"]`

**Legend Styling:**
- White background: `style legend fill:#ffffff`
- Light slate border: `style legend stroke:#e2e8f0,stroke-width:2px`
- No border on legend items: `style L fill:#ffffff,stroke:none,text-align:left`
- Left-align text for readability

**Spacing Configuration:**
```javascript
'flowchart': {
  'padding': 15,
  'nodeSpacing': 50,
  'rankSpacing': 80,
  'subGraphTitleMargin': {'top': 5, 'bottom': 5}
}
```

**Legend Content Format:**
```
L["🟣 Purple - Client/Frontend<br/>⚪ Slate - API Layer<br/>🔵 Indigo - Services<br/>🟡 Yellow - External<br/>🟢 Green - Infrastructure<br/>--- Dashed - Future"]
```

**Best Practices:**
- Keep legend compact and scannable
- Use emojis for visual color indicators
- Place legend last in code (renders top-left, perfect for F-pattern reading!)
- Ensure all colors in diagram are documented in legend
- **Note:** Mermaid's auto-layout places standalone subgraphs in top-left - this works perfectly for legends

**For comprehensive details, see:** [MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md) including React implementation, troubleshooting, examples, and configuration reference.

### 8. Package Version Reference Guidelines
When questions involve package versions, dependencies, or tech stack details:

**Always Use the Version Checker First:**
```bash
npm run versions
```

**When to use the version checker:**
- User asks "what version of X are we using?"
- Updating documentation that lists package versions
- Debugging dependency conflicts
- Verifying installations
- Creating dependency audits
- Onboarding documentation

**Documentation Update Protocol:**
1. Run `npm run versions` to get accurate installed versions
2. Update the relevant documentation (ARCHITECTURE.md, CLAUDE.md, etc.)
3. Reference the version checker in your response to the user
4. Never guess or estimate version numbers

**Example Response:**
> "Let me check the exact version using the version checker script..."
> [Runs npm run versions]
> "According to the version checker, React is at version 19.2.0. I'll update the documentation with this accurate information."

---

## 🚀 Quick Reference Commands

### Development Setup
```bash
# Backend setup
cd server
npm install express cors dotenv @anthropic-ai/sdk acorn
npm install --save-dev nodemon

# Frontend setup
cd client
npm install
npm install -D tailwindcss postcss autoprefixer
npm install @monaco-editor/react react-markdown lucide-react
```

### Running the Application
```bash
# Backend (from server/)
npm run dev          # Starts on http://localhost:3000

# Frontend (from client/)
npm run dev          # Starts on http://localhost:5173
```

### Version Checking
```bash
# Check all package versions (from project root)
npm run versions     # Comprehensive version report
npm run check-versions  # Alternative command (same output)
node scripts/check-versions.js  # Direct execution

# Redirect output to file for documentation
npm run versions > current-versions.txt
```

### Key Environment Variables
```bash
# server/.env
CLAUDE_API_KEY=sk-ant-your-key-here
PORT=3000
NODE_ENV=development

# client/.env
VITE_API_URL=http://localhost:3000
```

---

## 🎯 Current Phase Status

**Phase 1: Web Application (Days 1-5)**
- ✅ Project documentation complete
- ✅ Project structure initialized (client/ and server/ directories exist)
- [ ] Backend API implementation
- [ ] Claude integration
- [ ] Code parser service
- [ ] Quality scorer service
- [ ] React frontend
- [ ] UI components
- [ ] Responsive design
- [ ] Deployment
- [ ] Documentation finalization

**Next Steps:**
1. Implement backend services (Day 1)
2. Build React UI (Day 2-3)
3. Polish and test (Day 4)
4. Deploy and document (Day 5)

---

## 📝 Important Notes

1. **This is a Portfolio Project**: Demonstrates technical skills, speed of execution, and product thinking
2. **API-First Design**: Service layer is framework-agnostic to support future CLI and VS Code extension
3. **No Database in MVP**: Code is processed in memory only (privacy feature)
4. **Streaming is Key**: Real-time documentation generation using Server-Sent Events
5. **Quality Scoring Differentiator**: Not just generation, but education on what good docs look like
6. **Timeline is Aggressive**: 5-7 days requires strict scope discipline

---

## 🔄 Version History

- **v1.17** (Current) - Moved interview guide to private folder: Comprehensive update to INTERVIEW-GUIDE.md with actual project learnings and real metrics (319 tests, 85% bundle reduction, 67% performance improvement, 72.2% component coverage); moved from docs/planning/06-InterviewGuide.md to private/INTERVIEW-GUIDE.md (gitignored); removed Interview & Presentation section from CLAUDE.md documentation map; updated project structure and private folder documentation to reflect new location; added interview preparation to private folder contents list
- **v1.16** - Organized testing documentation: Created comprehensive Testing Documentation section in documentation map with 9 test docs under docs/testing/; added Testing README (hub), COMPONENT-TEST-COVERAGE.md (detailed coverage report with 319 tests), frontend-testing-guide.md, TEST-GUIDE.md, IMPLEMENTATION-SUMMARY.md, and 4 specialized test docs; moved TEST-GUIDE.md from client/ to docs/testing/ and IMPLEMENTATION-SUMMARY.md from docs/planning/ to docs/testing/; deleted outdated root files (TESTING-COMPLETE.md, TEST_SUITE_SUMMARY.md); updated project structure to show docs/testing/ folder; added Testing to question type identification and cross-reference list
- **v1.15** - Reorganized component documentation: Moved COPYBUTTON_USAGE.md from client/src/components/ to docs/components/COPYBUTTON.md; added COPYBUTTON.md to documentation map with complete feature overview, variants, animation timeline, and best practices; updated project structure in CLAUDE.md to reflect new location; added COPYBUTTON.md to Component Patterns cross-reference list and question type identification
- **v1.14** - Added version checker script integration: Created comprehensive VERSION-CHECKER.md documentation for scripts/check-versions.js utility; added new Scripts & Utilities section to documentation map; updated Tech Stack section with version checker references and accuracy notes; added Package Versions/Dependencies to question type identification; added Package Versions to cross-reference list; created new section 8 "Package Version Reference Guidelines" with protocol for using version checker when updating documentation; added Version Checking commands to Quick Reference; updated project structure to include docs/scripts/ and scripts/ folders
- **v1.13** - Architecture documentation audit and migration: Comprehensive update to 04-Architecture.md reflecting actual production implementation including all components (ErrorBanner, Toaster, MobileMenu, LazyMonacoEditor, LazyMermaidRenderer), middleware stack (CORS, RateLimit, Multer, ErrorHandler), service patterns (Singleton, Strategy, Decorator), performance metrics, and current tech stack versions; updated ARCHITECTURE.md to v1.1 with detailed component trees, service architecture, implementation status, data flows, testing strategies, deployment guide, monitoring approaches, and complete technical details matching production codebase; created ARCHITECTURE-OLD.md backup, ARCHITECTURE-AUDIT-SUMMARY.md documentation of changes, and ARCHITECTURE-MIGRATION-GUIDE.md for maintaining accuracy
- **v1.12** - Added Performance & Optimization documentation section: Created comprehensive OPTIMIZATION-GUIDE.md covering Lighthouse audits (+67% performance improvement), bundle size reduction (-85%), Core Web Vitals tracking, lazy loading patterns, and maintenance guidelines; updated documentation map with new Performance & Optimization section, cross-references for performance/lazy loading topics, and project structure to include docs/performance/ folder
- **v1.11** - Added private/ folder documentation: Created dedicated folder structure for sensitive content (strategic planning, financials, customer data, investor relations); updated project structure diagram and added security best practices section; moved VISION-PRIVATE.md to private/VISION.md
- **v1.10** - Enhanced timezone awareness instructions for documentation updates: Added automatic session labeling requirements with step-by-step timezone conversion process, EST/EDT timeframe definitions, and practical examples for converting UTC to EST when adding session labels to documentation
- **v1.9** - Created comprehensive ERROR-HANDLING-UX.md design guide with research-based best practices for error banners vs modals, animation specifications (250ms/200ms), accessibility considerations, and CodeScribe AI error patterns; updated CLAUDE.md documentation map and cross-references
- **v1.8** - Created comprehensive MERMAID-DIAGRAMS.md developer guide with patterns, React implementation, best practices, troubleshooting, and examples; updated CLAUDE.md documentation map
- **v1.7** - Added UI Pattern Guidelines to Figma Guide establishing color usage patterns: slate for helper text, indigo for primary badges, slate for secondary badges; updated CLAUDE.md documentation map
- **v1.6** - Added Phase 4: Optional Enhancements to PRD, created TOAST-SYSTEM.md documentation with future enhancement section, updated documentation map
- **v1.5** - Added Mermaid diagram guidelines section with legend placement best practices, spacing configuration, and styling standards
- **v1.4** - Expanded semantic colors for accessibility (fixed red contrast to WCAG AA, added background/button shades for green/yellow/red)
- **v1.3** - Added Indigo as secondary brand color to design system (purple primary + indigo secondary)
- **v1.2** - Clarified architecture document purposes: 04-Architecture.md (visual diagram + overview) vs ARCHITECTURE.md (deep technical dive)
- **v1.1** - Reorganized documentation structure (planning/, api/, architecture/ subdirectories)
- **v1.0** - Initial claude.md created with complete documentation map
- Documentation last updated: October 16, 2025

---

**For any questions about CodeScribe AI, start here and navigate to the appropriate detailed documentation.**
