# CodeScribe AI

**Intelligent Code Documentation Generator**

Transform code into comprehensive, professional documentation in seconds using AI. CodeScribe AI analyzes your code and generates README files, JSDoc comments, API documentation, and architecture overviews with real-time streaming and quality scoring.

> **Portfolio Project** by Jenni Coleman - Showcasing full-stack development, AI integration, and modern UX design
>
> 🔗 [Live Demo](https://codescribeai.com) | 📖 [Documentation](docs/) | 🎨 [Design System](docs/planning/mvp/07-Figma-Guide.md) | 💻 [GitHub](https://github.com/jmcoleman/codescribe-ai)

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [Quality Scoring](#quality-scoring)
- [Key Implementation Highlights](#key-implementation-highlights)
- [Development Status](#development-status)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Project Structure

```
codescribe-ai/
├── client/                        # Frontend (React + Vite)
│   ├── src/
│   └── package.json
├── server/                        # Backend (Node.js + Express)
│   ├── src/
│   │   ├── services/              # Core services (Claude API, parsers, etc.)
│   │   ├── routes/                # API routes
│   │   └── server.js
│   └── package.json
├── docs/                          # Documentation
│   ├── planning/                  # Product & development docs
│   ├── api/                       # API documentation
│   ├── architecture/              # System architecture
│   ├── analytics/                 # Analytics implementation
│   ├── performance/               # Performance optimization
│   ├── testing/                   # Test documentation
│   ├── components/                # Component guides
│   └── design/                    # Design assets
├── package.json                   # Root package.json (workspaces)
└── README.md
```

## Features

### 🎯 Core Features
- **Multiple Documentation Types**: Generate README.md, JSDoc/TSDoc comments, API documentation, and ARCHITECTURE overviews
- **Real-Time Streaming**: Watch documentation generate character-by-character using Server-Sent Events
- **Quality Scoring**: Get actionable feedback on documentation completeness (0-100 scale with letter grades)
- **Code Analysis**: AST-based parsing extracts functions, classes, and exports automatically
- **Monaco Editor**: Professional in-browser code editing with syntax highlighting
- **File Upload**: Drag & drop or browse to upload code files (JavaScript, TypeScript, Python, Java, etc.)

### 🎨 Advanced UX Features
- **Mermaid Diagram Rendering**: Auto-render system architecture and flowchart diagrams in documentation
- **Toast Notifications**: Enterprise-grade notification system with 20+ variants (success, error, progress, undo)
- **Copy to Clipboard**: One-click copy for generated documentation with visual feedback
- **Error Handling**: Research-based inline error banners with smooth animations
- **Rate Limiting**: Smart throttling with visual indicators and retry-after messaging
- **Help System**: Built-in examples modal with sample code for quick starts
- **Responsive Design**: Optimized layouts for desktop, tablet, and mobile devices
- **Dark Mode Support**: Brand-consistent color palette with accessibility considerations

### 📊 Analytics & Insights
- **Privacy-First Tracking**: Anonymous analytics with Vercel Analytics (no cookies, GDPR compliant)
- **Production-Only Mode**: Analytics disabled in development for optimal performance
- **Custom Event Tracking**: 8 event types including doc generation, quality scores, and user interactions
- **Core Web Vitals**: Automatic FCP, LCP, CLS, and FID performance monitoring
- **Error Monitoring**: Real-time error tracking with sanitized messages (API keys removed)
- **Success Metrics**: Generation success rate, quality score distribution, and performance benchmarks

### ♿ Accessibility
- **WCAG 2.1 AA Compliant**: Full keyboard navigation, ARIA labels, screen reader support
- **Motion Preferences**: Respects `prefers-reduced-motion` for animations
- **Color Contrast**: All text meets WCAG AA standards for readability
- **Focus Management**: Clear focus indicators and logical tab order

## Screenshots

_Screenshots coming soon - planned for portfolio presentation_

**Key Features to Showcase:**
- 📝 Monaco code editor with syntax highlighting
- ✨ Real-time documentation streaming
- 📊 Quality score breakdown modal
- 📱 Responsive mobile layout
- 🎨 Toast notification system
- 📈 Mermaid diagram rendering
- ⚠️ Error handling with inline banners

**Live Demo:** Try all features at [codescribeai.com](https://codescribeai.com)

## Quick Start

### Prerequisites
- Node.js 20+ (developed on v22.19.0)
- npm or yarn
- Anthropic Claude API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/codescribe-ai.git
   cd codescribe-ai
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   Create a `.env` file in the `server/` directory:
   ```bash
   # server/.env
   CLAUDE_API_KEY=your-api-key-here
   PORT=3000
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:5173
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX=10
   RATE_LIMIT_HOURLY_MAX=100
   ```

   Create a `.env` file in the `client/` directory:
   ```bash
   # client/.env
   VITE_API_URL=http://localhost:3000
   ```

   **See `.env.example` files in each directory for complete documentation.**

### Development

**Start both server and client simultaneously:**
```bash
npm run dev
```

This will start:
- Server on http://localhost:3000
- Client on http://localhost:5173

**Or run them separately:**
```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

### Available Scripts

From the **root directory**:
- `npm run dev` - Start both server and client with hot reload (recommended)
- `npm run dev:server` - Start only the server (port 3000)
- `npm run dev:client` - Start only the client (port 5173)
- `npm run build` - Build client for production
- `npm start` - Start server in production mode
- `npm run install:all` - Install dependencies for root, server, and client

From **server/** directory:
- `npm run dev` - Start server with nodemon (hot reload)
- `npm start` - Start server in production mode

From **client/** directory:
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Environment Variables

### Server Environment Variables

Configure these in `server/.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLAUDE_API_KEY` | ✅ Yes | - | Your Anthropic Claude API key ([Get one here](https://console.anthropic.com/)) |
| `PORT` | No | `3000` | Server port number |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated list of allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit time window in milliseconds (1 minute) |
| `RATE_LIMIT_MAX` | No | `10` | Maximum requests per window per IP address |
| `RATE_LIMIT_HOURLY_MAX` | No | `100` | Maximum generation requests per hour per IP |

**Example `server/.env`:**
```bash
CLAUDE_API_KEY=sk-ant-your-api-key-here
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
RATE_LIMIT_HOURLY_MAX=100
```

### Client Environment Variables

Configure these in `client/.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3000` | Backend API URL |

**Example `client/.env`:**
```bash
VITE_API_URL=http://localhost:3000
```

**For production deployment:**
```bash
# Production example
VITE_API_URL=https://your-backend.vercel.app
```

**Note:** All client environment variables must be prefixed with `VITE_` to be accessible in the browser.

### Production Configuration

When deploying to production (e.g., Vercel):

**Server variables:**
```bash
CLAUDE_API_KEY=sk-ant-your-production-key
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
RATE_LIMIT_HOURLY_MAX=100
```

**Client variables:**
```bash
VITE_API_URL=https://your-backend.vercel.app
```

See `.env.example` files in `server/` and `client/` directories for complete documentation.

## Usage

### Basic Workflow

1. **Paste or Upload Code**
   - Paste code directly into the Monaco editor, or
   - Click "Upload File" to load code from a file (supports .js, .ts, .py, .java, .cpp, .go, .rs, .php, .rb, and more)

2. **Select Documentation Type**
   - Choose from: README, JSDoc, API, or ARCHITECTURE documentation

3. **Generate Documentation**
   - Click "Generate Docs" to start AI-powered generation
   - Watch documentation stream in real-time
   - Review quality score and breakdown

4. **Copy and Use**
   - Click the copy button to copy documentation to clipboard
   - View quality breakdown to understand scoring
   - Adjust code and regenerate for better results

### Example Use Cases

**Generate README for a React Component**
```javascript
// Paste this into the editor and select "README"
function UserProfile({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="profile">
      <h2>{user.name}</h2>
      <button onClick={() => setEditing(!editing)}>
        {editing ? 'Save' : 'Edit'}
      </button>
    </div>
  );
}
```

**Generate JSDoc Comments**
```javascript
// Paste this and select "JSDoc"
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Generate API Documentation**
```javascript
// Paste Express routes and select "API"
router.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});
```

### Keyboard Shortcuts

- **Generate**: Click "Generate Docs" button (no keyboard shortcut to prevent accidental generation)
- **Copy**: Click copy button in documentation panel
- **Upload**: Click "Upload File" button
- **Help**: Click "?" icon in header for examples modal

## Documentation

Comprehensive documentation is organized in the [docs/](docs/) folder:

### Planning & Development
- [docs/planning/](docs/planning/) - Product requirements, epics, dev guide
  - [mvp/](docs/planning/mvp/) - Phase 1.0 & 1.5 planning docs (COMPLETE)
    - [01-PRD.md](docs/planning/mvp/01-PRD.md) - Product Requirements Document
    - [02-Epics-Stories.md](docs/planning/mvp/02-Epics-Stories.md) - User stories and acceptance criteria
    - [03-Todo-List.md](docs/planning/mvp/03-Todo-List.md) - Day-by-day implementation tasks
    - [05-Dev-Guide.md](docs/planning/mvp/05-Dev-Guide.md) - Complete development guide with code examples
    - [07-Figma-Guide.md](docs/planning/mvp/07-Figma-Guide.md) - Complete UI/UX design system
    - [08-Master-Prompt.md](docs/planning/mvp/08-Master-Prompt.md) - Master implementation guide
  - [roadmap/](docs/planning/roadmap/) - Product roadmap and future phases
    - [ROADMAP.md](docs/planning/roadmap/ROADMAP.md) - Product roadmap
  - [DARK-MODE-SPEC.md](docs/planning/DARK-MODE-SPEC.md) - Phase 2.5 planning (active)
  - [TODO.md](docs/planning/TODO.md) - Active todo list (current phase)

### Deployment
- [docs/deployment/](docs/deployment/) - Deployment documentation
  - [MVP-DEPLOY-LAUNCH.md](docs/deployment/MVP-DEPLOY-LAUNCH.md) - Deployment checklist and guide

### API Documentation
- [docs/api/](docs/api/) - API specifications and examples
  - [README.md](docs/api/README.md) - API quick start guide
  - [API-Reference.md](docs/api/API-Reference.md) - Complete endpoint specifications

### Architecture
- [docs/architecture/](docs/architecture/) - System design and architecture
  - [ARCHITECTURE-OVERVIEW.md](docs/architecture/ARCHITECTURE-OVERVIEW.md) - System architecture diagram (Mermaid)
  - [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Deep architecture overview

### Component Guides
- [docs/components/](docs/components/) - Component-specific documentation
  - [TOAST-SYSTEM.md](docs/components/TOAST-SYSTEM.md) - Toast notification system guide
  - [MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md) - Mermaid diagram developer guide
  - [ERROR-HANDLING-UX.md](docs/components/ERROR-HANDLING-UX.md) - Error handling UX design guide
  - [COPYBUTTON.md](docs/components/COPYBUTTON.md) - Copy button component guide
  - [DOWNLOADBUTTON.md](docs/components/DOWNLOADBUTTON.md) - Download button component guide
  - [SKELETON-LOADER.md](docs/components/SKELETON-LOADER.md) - Loading skeleton patterns

### Testing Documentation
- [docs/testing/](docs/testing/) - Comprehensive testing documentation
  - [README.md](docs/testing/README.md) - Testing documentation hub (660+ tests)
  - [COMPONENT-TEST-COVERAGE.md](docs/testing/COMPONENT-TEST-COVERAGE.md) - Component coverage report
  - [CROSS-BROWSER-TEST-PLAN.md](docs/testing/CROSS-BROWSER-TEST-PLAN.md) - E2E cross-browser strategy
  - [ACCESSIBILITY-AUDIT.MD](docs/testing/ACCESSIBILITY-AUDIT.MD) - WCAG 2.1 AA audit report
  - [frontend-testing-guide.md](docs/testing/frontend-testing-guide.md) - React testing patterns
  - [ERROR-HANDLING-TESTS.md](docs/testing/ERROR-HANDLING-TESTS.md) - Error component tests
  - [MERMAID-DIAGRAM-TESTS.md](docs/testing/MERMAID-DIAGRAM-TESTS.md) - Diagram rendering tests

### Performance Optimization
- [docs/performance/](docs/performance/) - Performance optimization documentation
  - [OPTIMIZATION-GUIDE.md](docs/performance/OPTIMIZATION-GUIDE.md) - Comprehensive optimization guide

### Design Assets
- [docs/design/](docs/design/) - Brand colors and design resources
  - [brand-color-palette.html](docs/design/brand-color-palette.html) - Interactive color palette
  - [brand-color-palette.pdf](docs/design/brand-color-palette.pdf) - PDF version for sharing

### Analytics
- [docs/analytics/](docs/analytics/) - Analytics implementation and insights
  - [ANALYTICS.md](docs/analytics/ANALYTICS.md) - Complete analytics guide (8 event types, privacy-first tracking)

## Tech Stack

### Frontend
- **React 19** - Modern UI library with latest features
- **Vite 7** - Lightning-fast build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Monaco Editor** - VS Code's editor in the browser
- **react-markdown** - Safe markdown rendering with GitHub Flavored Markdown (GFM)
- **react-syntax-highlighter** - Code syntax highlighting in documentation
- **Mermaid.js** - Interactive diagram rendering (flowcharts, sequence diagrams, etc.)
- **react-hot-toast** - Toast notification system
- **Lucide React** - Beautiful icon library
- **Vitest** - Unit and component testing framework
- **Testing Library** - React component testing utilities
- **Playwright** - E2E testing framework for cross-browser validation
- **Vercel Analytics** - Privacy-first anonymous analytics and Core Web Vitals tracking

### Backend
- **Node.js 22** - JavaScript runtime (v22.19.0)
- **Express 5** - Minimalist web framework
- **Anthropic Claude API** - Claude Sonnet 4.5 (claude-sonnet-4-20250514) for AI generation
- **Acorn** - JavaScript AST parser for code analysis
- **Multer** - File upload middleware with validation
- **express-rate-limit** - Rate limiting middleware (10 requests/min per IP)
- **Jest** - Backend testing framework
- **Supertest** - HTTP assertion testing

### Architecture
- **Server-Sent Events (SSE)** - Real-time streaming with chunked responses
- **RESTful API** - Standard HTTP endpoints with comprehensive error handling
- **Service Layer Pattern** - Clean separation of concerns (services, routes, middleware)
- **No Database** - Stateless, privacy-focused design (code never persisted)
- **Rate Limiting** - Smart throttling with retry-after headers
- **Error Middleware** - Centralized error handling and logging

## API Reference

The backend provides the following endpoints:

- `POST /api/generate` - Generate documentation (standard response)
- `POST /api/generate-stream` - Generate documentation (streaming via SSE)
- `POST /api/upload` - Upload code files
- `GET /api/health` - Health check endpoint

See [docs/api/API-Reference.md](docs/api/API-Reference.md) for complete API documentation.

## Quality Scoring

Documentation is scored on 5 criteria (100 points total):
1. **Overview/Description** (20 pts) - Clear project summary
2. **Installation Instructions** (15 pts) - Setup steps
3. **Usage Examples** (20 pts) - Code examples
4. **API Documentation** (25 pts) - Function/endpoint docs
5. **Structure/Formatting** (20 pts) - Organization and readability

Grading scale: A (90+), B (80-89), C (70-79), D (60-69), F (<60)

## Key Implementation Highlights

### 🔥 Advanced Features

**Mermaid Diagram Support**
- Auto-detects and renders Mermaid diagrams in generated documentation
- Supports flowcharts, sequence diagrams, class diagrams, and more
- Custom theming with brand colors (purple, indigo, slate)
- Comprehensive developer guide at [MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md)

**Enterprise Toast System**
- 20+ toast notification variants with smart queuing
- Progress toasts, undo toasts, grouped notifications
- Custom components with avatars, actions, and expandable content
- Full accessibility with ARIA live regions
- Complete guide at [TOAST-SYSTEM.md](docs/components/TOAST-SYSTEM.md)

**Smart Error Handling**
- Research-based inline error banners (non-blocking)
- Smooth animations (250ms enter, 200ms exit)
- Respects `prefers-reduced-motion` preference
- Rate limit errors show retry-after countdown
- UX design guide at [ERROR-HANDLING-UX.md](docs/components/ERROR-HANDLING-UX.md)

**Code Analysis Engine**
- AST-based parsing using Acorn
- Extracts functions, classes, imports, exports
- Supports JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby
- Provides context to AI for better documentation

**Real-Time Streaming**
- Server-Sent Events for character-by-character streaming
- Non-blocking UI with smooth animations
- Progress indicators and status updates
- Graceful error handling with reconnection logic

**Privacy-First Analytics**
- Anonymous event tracking with Vercel Analytics
- Production-only mode (disabled in development)
- 8 custom event types (doc generation, quality scores, user interactions, errors, etc.)
- Automatic Core Web Vitals monitoring (FCP, LCP, CLS, FID)
- Error sanitization (API keys and tokens removed)
- GDPR compliant, no cookies, no PII
- Complete guide at [ANALYTICS.md](docs/analytics/ANALYTICS.md)

### ⚡ Performance Optimization

**Lighthouse Performance: 45 → 75 (+67% improvement)**
- **Bundle Size Reduction**: 516 KB → 78 KB gzipped (-85%)
- **Core Web Vitals Improvements**:
  - First Contentful Paint (FCP): 5.4s → 0.6s (-89%)
  - Largest Contentful Paint (LCP): 13.9s → 1.0s (-93%)
  - Total Blocking Time (TBT): 3,000ms → 2,100ms (-30%)

**Lazy Loading Strategy**:
- Monaco Editor: Loads on first code interaction (4.85 KB gzipped)
- Mermaid.js: Loads only when diagrams detected (139.30 KB gzipped)
- DocPanel: Lazy loads with ReactMarkdown (281.53 KB gzipped)
- Modals: Individual lazy loading per modal (2-9 KB each)

**Additional Optimizations**:
- React.memo for component re-render prevention
- Hover preloading for improved modal UX
- Full-screen loading fallback to prevent layout shift
- Bundle analysis with rollup-plugin-visualizer

See [OPTIMIZATION-GUIDE.md](docs/performance/OPTIMIZATION-GUIDE.md) for complete performance documentation.

### 📊 Testing & Quality

**Comprehensive Test Coverage: 789+ Tests**
- **Backend Tests**: 133+ tests (Jest + Supertest)
  - Service layer: qualityScorer, claudeClient, codeParser, docGenerator
  - Integration: file upload, quality scoring, prompt quality
  - Mermaid generation tests
  - **Coverage**: 95.81% statements, 88.72% branches
- **Frontend Tests**: 642+ tests (Vitest + React Testing Library)
  - Component tests with accessibility checks (ExamplesModal, QualityScore, ErrorBanner, DownloadButton, etc.)
  - Integration tests for App workflows
  - Mermaid diagram rendering tests
  - **Coverage**: 100% critical user paths
- **E2E Tests**: 10 tests across 5 browsers (Playwright)
  - Cross-browser validation (Chromium, Firefox, WebKit, Chrome, Edge)
  - File upload + generate workflows
  - **Pass Rate**: 100% (10/10 tests passing)

**Running Tests:**
```bash
# Frontend tests (from client/)
npm test              # Run all tests once
npm run test:ui       # Interactive UI mode
npm run test:coverage # Generate coverage report

# Backend tests (from server/)
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report with thresholds

# E2E tests (from client/)
npm run test:e2e              # All browsers
npm run test:e2e:chromium     # Chromium only
npm run test:e2e:firefox      # Firefox only
npm run test:e2e:webkit       # WebKit (Safari) only
npm run test:e2e:chrome       # Chrome only
npm run test:e2e:edge         # Edge only
npm run test:e2e:headed       # With browser UI (for debugging)
```

**Test Documentation:**
- [Testing README](docs/testing/README.md) - Test documentation hub
- [COMPONENT-TEST-COVERAGE.md](docs/testing/COMPONENT-TEST-COVERAGE.md) - Detailed coverage report
- [CROSS-BROWSER-TEST-PLAN.md](docs/testing/CROSS-BROWSER-TEST-PLAN.md) - E2E testing strategy

## Development Status

**Current Phase:** Phase 1.5 - WCAG AA Accessibility Compliance + Deployment - ✅ **COMPLETE AND DEPLOYED!**
**Timeline:** Phase 1.0 (5 days, Oct 11-16) + Phase 1.5 (4 days, Oct 16-19) = 9 days total execution | **Status:** 🚀 **LIVE IN PRODUCTION**
**Production URL:** [codescribeai.com](https://codescribeai.com)
**Last Updated:** October 23, 2025

> **Note:** Original plan was 10 days total (5 days Phase 1 + 4 days Phase 1.5), completed in 9 days actual execution.

### ✅ Completed (Days 1-4)

**Core Features:**
- ✅ Project documentation and planning (8 comprehensive docs)
- ✅ Backend API implementation (4 endpoints)
- ✅ Claude API integration with streaming support (SSE)
- ✅ Code parser with AST analysis (Acorn)
- ✅ Quality scoring algorithm (5 criteria, 100-point scale)
- ✅ React frontend with Monaco Editor
- ✅ Responsive UI design (mobile, tablet, desktop)
- ✅ Real-time streaming with Server-Sent Events
- ✅ File upload with validation (16 file types: .js, .ts, .py, .java, .cpp, .go, .rs, .php, .rb, etc.)
- ✅ Toast notification system (20+ variants)
- ✅ Mermaid diagram rendering in documentation
- ✅ Copy-to-clipboard functionality
- ✅ Error handling with inline banners
- ✅ Rate limiting with visual indicators
- ✅ Help system with examples modal (7 curated examples)

**Testing & Quality (Day 4):**
- ✅ **789+ comprehensive tests** (7890%+ beyond original scope!)
  - 133+ backend tests (Jest + Supertest)
  - 642+ frontend tests (Vitest + React Testing Library)
  - 10 E2E tests across 5 browsers (Playwright)
- ✅ **Backend coverage**: 95.81% statements, 88.72% branches
- ✅ **Frontend coverage**: 100% critical user paths
- ✅ **E2E pass rate**: 100% (10/10 tests passing)
- ✅ **Cross-browser validation**: Chromium, Firefox, WebKit, Chrome, Edge
- ✅ **Accessibility audit**: 95/100 score, WCAG 2.1 AA compliant
- ✅ **Performance optimization**: Lighthouse 45 → 75 (+67% improvement)
  - Bundle size: 516 KB → 78 KB gzipped (-85% reduction)
  - FCP: 5.4s → 0.6s (-89%)
  - LCP: 13.9s → 1.0s (-93%)
  - TBT: 3,000ms → 2,100ms (-30%)
- ✅ Lazy loading for Monaco, Mermaid, DocPanel, Modals
- ✅ Modal UX improvements (hover preloading, loading fallback)

**Documentation:**
- ✅ Comprehensive testing documentation (README, COMPONENT-TEST-COVERAGE, CROSS-BROWSER-TEST-PLAN)
- ✅ Accessibility audit report (ACCESSIBILITY-AUDIT.MD)
- ✅ Performance optimization guide (OPTIMIZATION-GUIDE.md)
- ✅ E2E testing best practices (CLAUDE.md section 6)

### ✅ Phase 1.5 - WCAG AA Accessibility + Deployment (Days 6-10, Oct 16-19) - **COMPLETE**

**Accessibility Compliance (Oct 16-17):**
- ✅ **Days 6-7 (Critical + Keyboard):** 100% Complete
  - Color contrast: WCAG AAA compliance (18.2:1 ratio for body text)
  - Form labels and ARIA attributes across all components
  - Skip navigation link for keyboard users
  - Live regions for screen reader announcements
  - Full keyboard navigation with Headless UI
  - Modal focus traps with focus-trap-react
  - Enhanced focus indicators with `:focus-visible` support
- ✅ **Day 8 (ARIA & Semantics):** 100% Complete
  - 22 decorative icons hidden from screen readers
  - Semantic heading hierarchy (h2 tags in all panels)
  - Loading state announcements in Button component
  - Traffic lights and misc ARIA improvements
- ✅ **Day 9 (Polish & Testing):** 100% Complete
  - Error prevention with ConfirmationModal for large files
  - Enhanced error display with expandable technical details
  - axe DevTools automated scan: **0 violations** (17 checks passed)
  - Structured error objects with user-friendly messaging

**Production Deployment (Oct 17-19):**
- ✅ **Vercel Setup:** Complete deployment configuration
- ✅ **CI/CD Pipeline:** GitHub Actions integration
- ✅ **Security:** Environment variable sanitization, API key protection
- ✅ **Build Optimization:** Dependency restructuring for Vercel
- ✅ **API Configuration:** Centralized URL management
- ✅ **Monorepo Support:** Automatic detection and build
- ✅ **Live Application:** [codescribeai.com](https://codescribeai.com)
- ✅ **Analytics:** Privacy-first tracking with Vercel Analytics (production-only mode)

**Accessibility Scores:**
- ✅ Overall: 95/100 (A grade)
- ✅ Lighthouse: 100/100 accessibility score
- ✅ WCAG 2.1 AA: Fully compliant
- ✅ axe DevTools: 0 violations (automated)
- ✅ Screen reader tested (NVDA, VoiceOver)
- ✅ Production deployed with full compliance

### ✅ Phase 1.5 Complete (Oct 16-19, 2025)

**All Major Deliverables Achieved:**
- [x] ✅ Deploy to production (Vercel) - **LIVE at [codescribeai.com](https://codescribeai.com)**
- [x] ✅ CI/CD pipeline (GitHub Actions)
- [x] ✅ Security hardening (env sanitization, API protection)
- [x] ✅ Accessibility compliance (95/100, 0 violations)
- [x] ✅ Polish main README (completed Oct 16, 2025)
- [x] ✅ Polish API documentation (completed Oct 16, 2025)
- [x] ✅ Error handling enhancements (expandable details, structured errors)

**Remaining Optional Tasks:**
- [ ] Add screenshots to README (waiting for design review)
- [ ] Record demo video (planned for portfolio presentation)
- [ ] Additional manual testing (color blindness, zoom levels)

### 🚀 Planned (Future Phases)

- **Phase 2**: CLI tool for terminal usage
- **Phase 3**: VS Code extension for IDE integration
- **Phase 4**: Optional enhancements (see [01-PRD.md](docs/planning/mvp/01-PRD.md))

## Contributing

This is a portfolio project demonstrating full-stack development skills. Issues and suggestions are welcome!

## License

MIT

## Author

**Jenni Coleman** - Full-Stack Developer & UX Designer

Built as a portfolio project (9 days total: Phase 1.0 + Phase 1.5) to showcase:

### Technical Skills
- **Full-Stack Development**: React 19, Node.js, Express, RESTful APIs
- **AI Integration**: Anthropic Claude API with streaming (SSE)
- **Code Analysis**: AST parsing with Acorn for intelligent extraction
- **Modern Frontend**: Vite, Tailwind CSS, Monaco Editor, Mermaid.js
- **Testing Excellence**: 789+ tests across 3 frameworks (Jest, Vitest, Playwright)
  - Backend: 95.81% statement coverage, 88.72% branch coverage
  - Frontend: 100% critical path coverage
  - E2E: 100% pass rate across 5 browsers
- **Performance Engineering**: +67% Lighthouse score, -85% bundle size, -89% FCP
- **UX Design**: Research-based patterns, WCAG 2.1 AA accessibility (95/100)

### Project Management
- Comprehensive planning documentation (PRD, epics, user stories)
- Day-by-day implementation tracking with 98% completion accuracy
- Architecture design with interactive Mermaid diagrams
- Complete API specifications with examples
- Design system with brand guidelines and color palette

### Highlights
- ⚡ **Real-time streaming** with character-by-character generation via SSE
- 🎨 **Enterprise UX patterns** (toast system, error handling, loading states)
- ♿ **Accessibility-first** design with keyboard navigation and screen readers
- 📊 **Quality algorithms** for documentation scoring (5 criteria, 100-point scale)
- 🧪 **Test-driven development** with 789+ tests (7890%+ beyond original scope!)
- 🚀 **Performance optimization** with lazy loading and Core Web Vitals tracking
- 🌐 **Cross-browser validation** with Playwright E2E tests (5 browsers)
- 📈 **Privacy-first analytics** with anonymous tracking and production-only mode (8 event types)

---

**For complete product documentation, see [01-PRD.md](docs/planning/mvp/01-PRD.md)**
**For technical deep dive, see [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)**
