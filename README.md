# CodeScribe AI

**Intelligent Code Documentation Generator**

Transform code into comprehensive, professional documentation in seconds using AI. CodeScribe AI analyzes your code and generates README files, JSDoc comments, API documentation, and architecture overviews with real-time streaming and quality scoring.

> **Portfolio Project** by Jenni Coleman - Showcasing product management, full-stack development, and end-to-end execution from PRD to production
>
> 🔗 [Live Demo](https://codescribeai.com) | 📖 [Documentation](docs/) | 🗺️ [Interactive Roadmap](https://jmcoleman.github.io/codescribe-ai/docs/roadmap/) | 📋 [Product Requirements](docs/planning/mvp/01-PRD.md) | 🎨 [Design System](docs/design/FIGMA-DESIGN-GUIDE.md) | 💻 [GitHub](https://github.com/jmcoleman/codescribe-ai)

## 🌐 Deployment URLs

**Production (Custom Domain):**
- Frontend: https://codescribeai.com
- API: https://codescribeai.com/api

**Vercel Default URLs:**
- Production: https://codescribe-ai.vercel.app
- Preview/Dev: https://codescribe-ai-[branch-name].vercel.app

**Local Development:**
- Frontend: http://localhost:5173
- API: http://localhost:3000

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
│   │   ├── components/            # React components + tests
│   │   ├── hooks/                 # Custom hooks (useDocGeneration, etc.)
│   │   ├── utils/                 # Utilities (analytics, testData, etc.)
│   │   ├── contexts/              # React contexts (AuthContext)
│   │   └── App.jsx
│   ├── e2e/                       # E2E tests (Playwright)
│   └── package.json
├── server/                        # Backend (Node.js + Express)
│   ├── src/
│   │   ├── services/              # Core services (Claude API, parsers, etc.)
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Express middleware
│   │   ├── models/                # Database models
│   │   └── server.js
│   ├── tests/                     # Backend tests (Jest)
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

> **Basic Setup:** Get started in 5 minutes with just a Claude API key. No database, authentication, or email service required.
>
> **Production Setup:** For authentication, user management, and email features, see [Advanced Configuration](#advanced-configuration) below.

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
   # server/.env - Basic Configuration (No Auth)
   CLAUDE_API_KEY=your-api-key-here
   PORT=3000
   NODE_ENV=development
   ```

   Create a `.env` file in the `client/` directory:
   ```bash
   # client/.env
   VITE_API_URL=http://localhost:3000
   ```

   **That's it!** The app runs without authentication by default (no `ENABLE_AUTH` or `VITE_ENABLE_AUTH` needed).

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

### Basic Configuration (No Auth)

For the basic setup without authentication, you only need these minimal environment variables:

**Server variables** (`server/.env`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLAUDE_API_KEY` | ✅ Yes | - | Your Anthropic Claude API key ([Get one here](https://console.anthropic.com/)) |
| `PORT` | No | `3000` | Server port number |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |

**Client variables** (`client/.env`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3000` | Backend API URL |

**Example basic configuration:**

```bash
# server/.env
CLAUDE_API_KEY=sk-ant-your-api-key-here
PORT=3000
NODE_ENV=development

# client/.env
VITE_API_URL=http://localhost:3000
```

**Note:** `ENABLE_AUTH` and `VITE_ENABLE_AUTH` default to `false` in the code, so you can omit them entirely for basic setup. All client environment variables must be prefixed with `VITE_` to be accessible in the browser.

---

## Advanced Configuration

> **Need authentication, user management, or email features?** See comprehensive setup guides:
>
> - [Database Setup Guide](docs/deployment/VERCEL-POSTGRES-SETUP.md) - Neon Postgres configuration
> - [Resend Email Setup](docs/deployment/RESEND-SETUP.md) - Email service for password resets
> - [Environment Checklist](docs/deployment/DATABASE-ENVIRONMENT-CHECKLIST.md) - Dev/preview/production isolation
> - [Deployment Guide](docs/deployment/MVP-DEPLOY-LAUNCH.md) - Production deployment
> - [GitHub OAuth Setup](docs/authentication/GITHUB-OAUTH-SETUP.md) - Social login configuration

### Enabling Authentication

To enable authentication features, set `ENABLE_AUTH=true` and configure additional environment variables:

**Required authentication variables** (`server/.env`):

| Variable | Description |
|----------|-------------|
| `ENABLE_AUTH` | Set to `true` to enable authentication features |
| `DATABASE_URL` | Neon Postgres connection string (pooled) |
| `JWT_SECRET` | Secret key for JWT tokens (generate with `openssl rand -base64 32`) |
| `SESSION_SECRET` | Secret key for session cookies (generate with `openssl rand -base64 32`) |
| `RESEND_API_KEY` | Resend API key for password reset emails |
| `EMAIL_FROM` | From address for system emails (e.g., `"CodeScribe AI <noreply@yourdomain.com>"`) |
| `MIGRATION_SECRET` | Secret for database migration API endpoint |

**Optional OAuth variables** (`server/.env`):

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `GITHUB_CALLBACK_URL` | OAuth callback URL (e.g., `http://localhost:3000/api/auth/github/callback`) |
| `CLIENT_URL` | Frontend URL for OAuth redirects (default: `http://localhost:5173`) |

**Client variables** (`client/.env`):

| Variable | Description |
|----------|-------------|
| `VITE_ENABLE_AUTH` | Set to `true` to show authentication UI (Sign In button, user menu, etc.) |

**Example with authentication enabled:**

```bash
# server/.env
CLAUDE_API_KEY=sk-ant-your-api-key-here
PORT=3000
NODE_ENV=development

# Authentication & Database
ENABLE_AUTH=true
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
JWT_SECRET=generated-secret-min-32-chars
SESSION_SECRET=generated-secret-min-32-chars

# Email
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="CodeScribe AI <noreply@codescribeai.com>"

# OAuth (optional)
GITHUB_CLIENT_ID=Iv1.your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Migration
MIGRATION_SECRET=generated-secret-min-32-chars

# client/.env
VITE_API_URL=http://localhost:3000
VITE_ENABLE_AUTH=true
```

**See `.env.example` files in `server/` and `client/` directories for complete documentation.**

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

## Documentation

📚 **Comprehensive documentation organized in [docs/](docs/)**

For a complete navigation guide with descriptions of all documentation, see **[Documentation Map](docs/DOCUMENTATION-MAP.md)**.

### Quick Links to Essential Docs

**Planning & Product:**
- **[Product Requirements (PRD)](docs/planning/mvp/01-PRD.md)** - Vision, features, acceptance criteria
- **[Interactive Roadmap](https://jmcoleman.github.io/codescribe-ai/docs/roadmap/)** - 6-phase product timeline (GitHub Pages)
- **[ROADMAP.md](docs/planning/roadmap/ROADMAP.md)** - Detailed roadmap documentation

**Architecture & API:**
- **[Architecture Overview](docs/architecture/ARCHITECTURE-OVERVIEW.md)** - Visual system diagram (Mermaid)
- **[Architecture Details](docs/architecture/ARCHITECTURE.md)** - Deep technical architecture
- **[API Reference](docs/api/API-Reference.md)** - Complete endpoint specifications

**Development & Testing:**
- **[Dev Guide](docs/planning/mvp/05-Dev-Guide.md)** - Implementation guide with code examples
- **[Testing Hub](docs/testing/README.md)** - 1,381+ tests, coverage reports, test patterns
- **[Test Fixes Guide](docs/testing/TEST-FIXES-OCT-2025.md)** - Testing patterns & best practices

**Design & UX:**
- **[Figma Design System](docs/planning/mvp/07-Figma-Guide.md)** - Complete UI/UX design system
- **[Brand Colors](docs/design/brand-color-palette.html)** - Interactive color palette (27 colors)
- **[Component Guides](docs/components/)** - Toast system, error handling, Mermaid diagrams, etc.

**Performance & Analytics:**
- **[Optimization Guide](docs/performance/OPTIMIZATION-GUIDE.md)** - Performance strategies (+67% Lighthouse)
- **[Analytics](docs/analytics/ANALYTICS.md)** - Privacy-first tracking, Core Web Vitals

**Deployment:**
- **[Deployment Guide](docs/deployment/MVP-DEPLOY-LAUNCH.md)** - Vercel deployment checklist
- **[Database Setup](docs/deployment/VERCEL-POSTGRES-SETUP.md)** - Neon Postgres configuration

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

**Comprehensive Test Coverage: 1,381+ Tests**
- **Backend Tests**: 434 tests (Jest + Supertest)
  - Service layer: qualityScorer, claudeClient, codeParser, docGenerator
  - Authentication: 102 tests (auth middleware, user model, OAuth flows)
  - Database migrations: 40 tests (naming, checksums, ordering)
  - Password reset: 25 tests (email verification, token validation, security)
  - Integration: file upload, quality scoring, prompt quality
  - Mermaid generation tests
  - **Coverage**: 95.81% statements, 88.72% branches, 86.84% models, 65.41% routes
  - **Pass Rate**: 95.2% (413 passing, 21 skipped, 0 failures)
- **Frontend Tests**: 937 tests (Vitest + React Testing Library)
  - Component tests with accessibility checks (18/18 components tested)
  - Authentication UI: SignupModal, LoginModal, ForgotPasswordModal, ResetPasswordModal
  - Integration tests for App workflows
  - Mermaid diagram rendering tests
  - Toast notification system tests (33 tests)
  - **Coverage**: 100% critical user paths
  - **Pass Rate**: 98.4% (922 passing, 15 skipped, 0 failures)
- **E2E Tests**: 10 tests across 5 browsers (Playwright)
  - Cross-browser validation (Chromium, Firefox, WebKit, Chrome, Edge)
  - File upload + generate workflows
  - **Pass Rate**: 100% (10/10 tests passing)
- **Overall Pass Rate**: 97.5% (1,335 passing, 36 skipped, 0 failures)

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
- [Testing README](docs/testing/README.md) - Test documentation hub (1,381+ tests)
- [TEST-FIXES-OCT-2025.md](docs/testing/TEST-FIXES-OCT-2025.md) - Test fix patterns (75 tests fixed, 25 added)
- [COMPONENT-TEST-COVERAGE.md](docs/testing/COMPONENT-TEST-COVERAGE.md) - Detailed coverage report (18/18 components)
- [CROSS-BROWSER-TEST-PLAN.md](docs/testing/CROSS-BROWSER-TEST-PLAN.md) - E2E testing strategy
- [AUTH-TESTS.md](docs/testing/AUTH-TESTS.md) - Authentication tests (102 tests)
- [DATABASE-MIGRATION-TESTS.md](docs/testing/DATABASE-MIGRATION-TESTS.md) - Migration tests (40 tests)

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
- ✅ **1,381+ comprehensive tests** (13,810%+ beyond original scope!)
  - 434 backend tests (Jest + Supertest)
  - 937 frontend tests (Vitest + React Testing Library)
  - 10 E2E tests across 5 browsers (Playwright)
- ✅ **Backend coverage**: 95.81% statements, 88.72% branches, 86.84% models, 65.41% routes
- ✅ **Frontend coverage**: 100% critical user paths, 18/18 components tested
- ✅ **Overall pass rate**: 97.5% (1,335 passing, 36 skipped, 0 failures)
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

### 🚀 Future Development

For detailed information about upcoming features and development phases, see the comprehensive roadmap:

- **[Product Roadmap](docs/planning/roadmap/ROADMAP.md)** - Complete 6-phase development plan (Phase 2-6)
- **[Interactive Roadmap Timeline](https://jmcoleman.github.io/codescribe-ai/docs/roadmap/)** - Visual timeline with keyboard shortcuts

**Current Phase:** Phase 2 - Monetization Foundation (Epic 2.1 Complete)
- ✅ Epic 2.1: Authentication & User Management
- 🚧 Epic 2.2: Tier System & Feature Flags (5 tiers: Free → Starter → Pro → Team → Enterprise)
- 📋 Epic 2.3: Payment Integration (Stripe)
- 📋 Epic 2.4: UI Integration

**Future Phases:**
- **Phase 3**: UX Enhancements (Dark mode, multi-file support)
- **Phase 4**: Documentation Capabilities (OpenAPI, custom templates)
- **Phase 5**: Developer Tools (CLI, VS Code extension)
- **Phase 6**: Enterprise Readiness (SSO, audit logs, white-label)

## Contributing

This is a portfolio project, but feedback and suggestions are welcome! Feel free to:
- Open an issue for bugs or feature requests
- Submit a pull request with improvements
- Share your experience using CodeScribe AI

Please note: As a portfolio project, contributions may be reviewed on a limited schedule.

## License

MIT

## Author

**Jenni Coleman** - Full-Stack Developer & Product Manager

Built as a portfolio project (9 days total: Phase 1.0 + Phase 1.5) to showcase both **technical execution** and **product management** capabilities:

### Product Management & Strategy
- **Product Vision & Requirements**: Authored comprehensive [PRD](docs/planning/mvp/01-PRD.md) with clear success metrics, user personas, and feature prioritization
- **Roadmap Planning**: Designed [6-phase product roadmap](docs/planning/roadmap/ROADMAP.md) from MVP to enterprise features, with interactive [visual timeline](https://jmcoleman.github.io/codescribe-ai/docs/roadmap/)
- **User-Centric Design**: Translated user needs into 5 epics and 20+ user stories with acceptance criteria
- **Scope Management**: Delivered 100% of Phase 1 features on time (9 days planned, 9 days actual)
- **Execution Excellence**: Maintained 98% accuracy between planned vs. actual implementation tasks
- **Documentation Standards**: Created comprehensive planning docs (PRD, epics, dev guide, design system) ensuring team alignment
- **Strategic Prioritization**: Balanced feature completeness with shipping velocity (MVP → accessibility → deployment)
- **Metrics-Driven**: Defined measurable success criteria (1,381+ tests, 95/100 accessibility, +67% performance)
- **Stakeholder Communication**: Complete project documentation for technical and non-technical audiences

### Technical Skills
- **Full-Stack Development**: React 19, Node.js, Express, RESTful APIs
- **AI Integration**: Anthropic Claude API with streaming (SSE)
- **Code Analysis**: AST parsing with Acorn for intelligent extraction
- **Modern Frontend**: Vite, Tailwind CSS, Monaco Editor, Mermaid.js
- **Testing Excellence**: 1,381+ tests across 3 frameworks (Jest, Vitest, Playwright)
  - Backend: 95.81% statement coverage, 88.72% branch coverage, 434 tests
  - Frontend: 100% critical path coverage, 18/18 components tested, 937 tests
  - E2E: 100% pass rate across 5 browsers, 10 tests
  - Overall: 97.5% pass rate (0 failures)
- **Performance Engineering**: +67% Lighthouse score, -85% bundle size, -89% FCP
- **UX Design**: Research-based patterns, WCAG 2.1 AA accessibility (95/100)

### Product & Engineering Highlights
- 📋 **End-to-End Product Ownership**: From PRD to production deployment in 9 days
- 📊 **Data-Driven Decisions**: Quality scoring algorithm based on documentation best practices
- 🎯 **Feature Scoping**: Strategically deferred CLI/VS Code extensions to Phase 2-3 for faster MVP launch
- ⚡ **Technical Execution**: Real-time streaming with SSE, enterprise UX patterns, accessibility-first design
- 🧪 **Quality Standards**: 1,381+ tests (13,810%+ beyond original scope) ensuring production readiness
- 🚀 **Performance Focus**: Lazy loading strategy reduced bundle size by 85%, improved FCP by 89%
- 🌐 **Cross-Browser Strategy**: E2E validation across 5 browsers for enterprise reliability
- 📈 **Analytics Implementation**: Privacy-first tracking with 8 event types for product insights
- 🔄 **Iterative Improvement**: Phase-based roadmap enables continuous value delivery

### Demonstrated PM Competencies
- ✅ **Product Strategy**: Vision, roadmap, and go-to-market planning
- ✅ **Stakeholder Management**: Clear documentation for technical and business audiences
- ✅ **Agile Execution**: Daily progress tracking, scope management, deadline adherence
- ✅ **Requirements Gathering**: User personas, use cases, acceptance criteria
- ✅ **Technical Depth**: Can code, review PRs, make architectural decisions
- ✅ **Metrics & Analytics**: Defined KPIs, instrumented tracking, measured outcomes
- ✅ **Risk Management**: Identified dependencies, planned mitigation (e.g., accessibility early)
- ✅ **Resource Planning**: Realistic estimates, task breakdown, timeline accuracy

---

**For complete product documentation, see [01-PRD.md](docs/planning/mvp/01-PRD.md)**
**For technical deep dive, see [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)**
