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
  - [Supported Languages](#-supported-languages)
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
│   ├── database/                  # Database schema, migrations, standards
│   ├── development/               # Development guides & conventions
│   ├── deployment/                # Deployment guides (Vercel, database, OAuth, email)
│   ├── analytics/                 # Analytics implementation
│   ├── performance/               # Performance optimization
│   ├── testing/                   # Test documentation
│   ├── components/                # Component guides
│   └── design/                    # Design assets
├── package.json                   # Root package.json (workspaces)
└── README.md
```

## Features

### 🌐 Supported Languages

Generate professional documentation for **10 programming languages** with **16 file extensions**:

| Language | Extensions | Use Cases |
|----------|-----------|-----------|
| 🟨 **JavaScript** | `.js`, `.jsx` | React, Node.js, frontend development |
| 🔵 **TypeScript** | `.ts`, `.tsx` | Type-safe React, Angular, Vue |
| 🐍 **Python** | `.py` | Data science, ML, Django, Flask |
| ☕ **Java** | `.java` | Enterprise apps, Android, Spring |
| 🔧 **C/C++** | `.c`, `.cpp`, `.h`, `.hpp` | Systems programming, embedded, game engines |
| 💜 **C#** | `.cs` | .NET, Unity, Windows apps |
| 🐹 **Go** | `.go` | Cloud-native, microservices, CLI tools |
| 🦀 **Rust** | `.rs` | High-performance systems, WebAssembly |
| 💎 **Ruby** | `.rb` | Rails, automation, scripting |
| 🐘 **PHP** | `.php` | WordPress, Laravel, legacy web apps |

**Plus:** `.txt` for plain text documentation

All documentation types (README, JSDoc, API docs, Architecture) work with every language!

### 🎯 Core Features
- **Multiple Documentation Types**: Generate README.md, JSDoc/TSDoc comments, API documentation, and ARCHITECTURE overviews
- **Real-Time Streaming**: Watch documentation generate character-by-character using Server-Sent Events
- **Quality Scoring**: Get actionable feedback on documentation completeness (0-100 scale with letter grades)
- **Code Analysis**: AST-based parsing extracts functions, classes, and exports automatically
- **Monaco Editor**: Professional in-browser code editing with syntax highlighting for all 10 languages
- **File Upload**: Drag & drop or browse to upload code files with full MIME type support

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
   # server/.env
   CLAUDE_API_KEY=your-api-key-here
   ```

   Create a `.env` file in the `client/` directory:
   ```bash
   # client/.env
   VITE_API_URL=http://localhost:3000
   ```

   **That's it!** For optional variables and detailed configuration, see [Environment Variables](#environment-variables) below.

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

> **Need authentication, user management, payments, or email features?** See comprehensive setup guides:
>
> - [Vercel Deployment Guide](docs/deployment/VERCEL-DEPLOYMENT-GUIDE.md) - Complete 8-step deployment walkthrough (45-60 min)
> - [Stripe Setup Guide](docs/deployment/STRIPE-SETUP.md) - Payment integration with test mode setup
> - [Environment Variables](docs/deployment/VERCEL-ENVIRONMENT-VARIABLES.md) - All environment variables reference
> - [Database Setup Guide](docs/deployment/VERCEL-POSTGRES-SETUP.md) - Neon Postgres configuration
> - [GitHub OAuth Setup](docs/deployment/GITHUB-OAUTH-SETUP.md) - Social login configuration
> - [Resend Email Setup](docs/deployment/RESEND-SETUP.md) - Email service for password resets
> - [Environment Checklist](docs/deployment/DATABASE-ENVIRONMENT-CHECKLIST.md) - Dev/preview/production isolation

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

**Stripe payment variables** (`server/.env`):

| Variable | Description |
|----------|-------------|
| `STRIPE_ENV` | Stripe environment: `sandbox` (default, test mode) or `production` (live mode) |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode: `sk_test_...`, live mode: `sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test mode: `pk_test_...`, live mode: `pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (get from Stripe Dashboard → Webhooks) |
| `STRIPE_PRICE_STARTER_MONTHLY` | Price ID for Starter tier monthly ($12/mo) |
| `STRIPE_PRICE_STARTER_ANNUAL` | Price ID for Starter tier annual ($120/yr) |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID for Pro tier monthly ($29/mo) |
| `STRIPE_PRICE_PRO_ANNUAL` | Price ID for Pro tier annual ($288/yr) |
| `STRIPE_PRICE_TEAM_MONTHLY` | Price ID for Team tier monthly ($99/mo) |
| `STRIPE_PRICE_TEAM_ANNUAL` | Price ID for Team tier annual ($984/yr) |
| `STRIPE_SUCCESS_URL` | Redirect URL after successful payment (e.g., `http://localhost:5173/payment/success`) |
| `STRIPE_CANCEL_URL` | Redirect URL when payment is cancelled (e.g., `http://localhost:5173/pricing`) |

> **Stripe Environment Modes:**
> - **`sandbox` (default):** Uses Stripe test mode with test cards and test price IDs. No real charges.
> - **`production`:** Uses Stripe live mode with real payments and live price IDs.
>
> By default, both frontend and backend use `sandbox` mode, allowing safe testing even in production deployments. Switch to `production` mode via Vercel environment variables when ready to accept real payments.

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
| `VITE_STRIPE_ENV` | Stripe environment: `sandbox` (default, test cards) or `production` (real payments) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for frontend (test mode: `pk_test_...`, live mode: `pk_live_...`) |

**Example with authentication and payments enabled:**

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

# Stripe Payments
STRIPE_ENV=sandbox  # Use 'sandbox' for testing (default), 'production' for live payments
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_TEAM_MONTHLY=price_xxxxx
STRIPE_PRICE_TEAM_ANNUAL=price_xxxxx
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success
STRIPE_CANCEL_URL=http://localhost:5173/pricing

# OAuth (optional)
GITHUB_CLIENT_ID=Iv1.your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Migration
MIGRATION_SECRET=generated-secret-min-32-chars

# client/.env
VITE_API_URL=http://localhost:3000
VITE_ENABLE_AUTH=true
VITE_STRIPE_ENV=sandbox  # Use 'sandbox' for test cards (default), 'production' for real payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
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
- **[MVP Delivery Summary](docs/planning/mvp/MVP-DELIVERY-SUMMARY.md)** ⭐ - 9-day delivery highlights for interviews/portfolio
- **[Product Requirements (PRD)](docs/planning/mvp/01-PRD.md)** - Vision, features, acceptance criteria
- **[Interactive Roadmap](https://jmcoleman.github.io/codescribe-ai/docs/roadmap/)** - 6-phase product timeline (GitHub Pages)
- **[ROADMAP.md](docs/planning/roadmap/ROADMAP.md)** - Detailed roadmap documentation

**Architecture & API:**
- **[Architecture Overview](docs/architecture/ARCHITECTURE-OVERVIEW.md)** - Visual system diagram (Mermaid)
- **[Architecture Details](docs/architecture/ARCHITECTURE.md)** - Deep technical architecture
- **[API Reference](docs/api/API-Reference.md)** - Complete endpoint specifications

**Development & Testing:**
- **[Dev Guide](docs/planning/mvp/05-Dev-Guide.md)** - Implementation guide with code examples
- **[Testing Hub](docs/testing/README.md)** - 1,955 tests, coverage reports, test patterns
- **[Test Fixes Guide](docs/testing/TEST-PATTERNS-GUIDE.md)** - Testing patterns & best practices

**Design & UX:**
- **[Figma Design System](docs/planning/mvp/07-Figma-Guide.md)** - Complete UI/UX design system
- **[Brand Colors](https://jmcoleman.github.io/codescribe-ai/docs/design/brand-color-palette.html)** - Interactive color palette (27 colors)
- **[Component Guides](docs/components/)** - Toast system, error handling, usage prompts, Mermaid diagrams, etc.

**Performance & Analytics:**
- **[Optimization Guide](docs/performance/OPTIMIZATION-GUIDE.md)** - Performance strategies (+67% Lighthouse)
- **[Analytics](docs/analytics/ANALYTICS.md)** - Privacy-first tracking, Core Web Vitals

**Deployment:**
- **[Vercel Deployment Guide](docs/deployment/VERCEL-DEPLOYMENT-GUIDE.md)** - Complete 8-step deployment walkthrough
- **[Stripe Setup Guide](docs/deployment/STRIPE-SETUP.md)** - Payment integration with test mode setup
- **[Environment Variables](docs/deployment/VERCEL-ENVIRONMENT-VARIABLES.md)** - All environment variables reference
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

**Comprehensive Test Coverage: 2,015 Tests** (1,966 passing, 40 skipped, 9 pre-existing failures, 98.91% pass rate)
- **Backend Tests**: 732 tests (Jest + Supertest)
  - Service layer: qualityScorer, claudeClient, codeParser, docGenerator, emailService
  - Authentication: 102 tests (auth middleware, user model, OAuth flows)
  - Settings: 26 integration tests (profile, email, password, preferences)
  - Database migrations: 50 tests (naming, checksums, ordering, migration 011)
  - Contact Sales & Support: 28 tests (email sending, tier validation, name resolution)
  - Password reset: 25 tests (email verification, token validation, security)
  - Integration: file upload, quality scoring, prompt quality, settings API
  - Mermaid generation tests
  - **Coverage**: 91.83% services statements, 95.81% overall, 88.72% branches
  - **Pass Rate**: 96.0% (702 passing, 21 skipped, 9 pre-existing failures)
- **Frontend Tests**: 1,283 tests (Vitest + React Testing Library)
  - Component tests with accessibility checks (18/18 components tested)
  - Authentication UI: SignupModal, LoginModal, ForgotPasswordModal, ResetPasswordModal
  - Settings UI: AccountTab, PrivacyTab, SubscriptionTab, DangerZoneTab, AnalyticsWrapper
  - Integration tests for App workflows
  - Mermaid diagram rendering tests
  - Toast notification system tests (33 tests)
  - **Coverage**: 100% critical user paths
  - **Pass Rate**: 98.5% (1,264 passing, 19 skipped, 0 failures)
- **E2E Tests**: 10 tests across 5 browsers (Playwright)
  - Cross-browser validation (Chromium, Firefox, WebKit, Chrome, Edge)
  - File upload + generate workflows
  - **Pass Rate**: 100% (10/10 tests passing)
- **Overall Pass Rate**: 97.82% (1,747 passing, 39 skipped)

**Running Tests:**
```bash
# Frontend tests (from client/)
npm test              # Run all tests once (926 tests)
npm run test:ui       # Interactive UI mode
npm run test:coverage # Generate coverage report

# Backend tests (from server/)
npm test              # Run all tests (373 tests, excludes database suite)
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report with thresholds

# Database tests (from server/ - requires Docker PostgreSQL on port 5433)
npm run test:db:setup # Start test database container
npm run test:db       # Run database tests (21 tests)
npm run test:db:teardown # Stop test database container

# E2E tests (from client/)
npm run test:e2e              # All browsers (10 tests)
npm run test:e2e:chromium     # Chromium only
npm run test:e2e:firefox      # Firefox only
npm run test:e2e:webkit       # WebKit (Safari) only
npm run test:e2e:chrome       # Chrome only
npm run test:e2e:edge         # Edge only
npm run test:e2e:headed       # With browser UI (for debugging)
```

**Test Documentation Hub:**

📚 **[Testing README](docs/testing/README.md)** - Complete testing documentation index with:
- Quick Stats: 1,299 tests (926 frontend, 373 backend, 10 E2E)
- Testing Layers: Unit, Integration, Database, E2E
- Database Testing Workflow: Docker setup, migrations, CI exclusion
- Pre-Deployment Checklists: With/without database changes
- Comprehensive Test Documentation Index: 12+ specialized test docs

## Development Status

**Current Phase:** Phase 2 - Payments Infrastructure (Epic 2.1 ✅ COMPLETE)
**Production Status:** 🚀 **LIVE** at [codescribeai.com](https://codescribeai.com)
**Last Updated:** October 28, 2025

### Phase Summary

- **Phase 1.0 (Oct 11-16, 2025):** ✅ Core MVP features, streaming, quality scoring, testing
- **Phase 1.5 (Oct 16-19, 2025):** ✅ WCAG 2.1 AA compliance, production deployment, analytics
- **Phase 2 - Epic 2.1 (Oct 20-28, 2025):** ✅ Authentication & user management system
  - Email/password authentication with bcrypt + JWT
  - GitHub OAuth integration with loading states & analytics
  - Password reset flow with Resend email service
  - PostgreSQL database with Neon (3 migrations: users, sessions, quotas)
  - Storage naming conventions & helper utilities
  - 200+ authentication tests (102 auth tests + password reset + OAuth)
- **Phase 2 - Next Epic:** 🚧 Epic 2.2 - Tier system & feature flags (Free → Starter → Pro → Team → Enterprise)

### ✅ Phase 1.0 & 1.5 Complete (Oct 11-19, 2025)

**Core Features:**
- AI-powered documentation generation with Claude Sonnet 4.5
- Real-time streaming (SSE), quality scoring (0-100), AST code analysis
- Monaco Editor, Mermaid diagrams, Toast notifications, Error handling
- WCAG 2.1 AA accessibility (95/100, 0 violations)
- Performance optimization: 45 → 75 Lighthouse score (+67%), 78KB bundle (-85%)
- Privacy-first analytics with Vercel Analytics
- Production deployment with CI/CD (GitHub Actions)

**Quality Metrics:**
- **1,955 tests** (1,283 frontend, 672 backend) - 97.8% pass rate
- **Backend coverage:** 91.83% overall (649 passing, 21 skipped, 2 pre-existing failures)
- **Frontend coverage:** 100% critical paths, all new legal/terms components tested
- **Database:** 14 migration tests (Docker sandbox + Neon dev validation)

### ✅ Phase 2 - Epic 2.1 Complete (Oct 20-28, 2025)

**Authentication & User Management:**
- Email/password authentication (bcrypt + JWT) with secure session management
- GitHub OAuth integration with loading states & OAuth timing analytics
- Password reset flow with Resend email service (token generation, validation, expiry)
- PostgreSQL database with Neon (free tier: 512MB, supports 50K users)
- 5 database migrations: users, sessions, user_quotas, indexes, tier tracking
- Storage naming conventions (codescribeai:type:category:key) with helper utilities
- Database testing infrastructure (Docker PostgreSQL, Jest config, 21 tests)

**Testing & Documentation:**
- **200+ new authentication tests** added (total now 1,299 tests)
  - 102 auth tests (middleware, user model, OAuth flows, security)
  - 25 password reset tests (email verification, token validation)
  - 21 database tests (migrations, schema, constraints, quotas)
  - OAuth loading states & analytics tests
- Database naming standards documentation (DB-NAMING-STANDARDS.md)
- Storage conventions guide (STORAGE-CONVENTIONS.md)
- Authentication deployment guides (OAuth setup, email setup, database setup)

### 🚀 Future Development

**Phase 2 - Payments Infrastructure (Current - v2.4.2):**
- ✅ Epic 2.1: Authentication & User Management (v2.0.0) - **COMPLETE**
- ✅ Epic 2.2: Tier System & Feature Flags (v2.1.0-v2.2.0) - **COMPLETE**
- ✅ Epic 2.3: UX Enhancements & File Upload (v2.3.0) - **COMPLETE**
- ✅ Epic 2.4: Payment Integration & Test Infrastructure (v2.4.0-v2.4.2) - **COMPLETE**
  - Stripe integration (test + live modes)
  - Email rate limiting & verification
  - Livemode detection for subscriptions
  - 1-hour prompt caching ($100-400/mo savings)
- 📋 Epic 2.5: Essential Legal (Terms & Privacy) - **PLANNED**
- 📋 Epic 2.6: UI Integration & Usage Dashboard - **PLANNED**
- 📋 Epic 2.7: Production Launch (Post-LLC, Jan 14+ 2026) - **PLANNED**

**Upcoming Phases:**
- **Phase 3:** Dark Mode & UI Enhancements (Theming system, layout improvements, accessibility)
- **Phase 4:** Documentation Capabilities (OpenAPI, multi-file support, custom templates)
- **Phase 5:** Developer Tools (CLI, VS Code extension, API client)
- **Phase 6:** Enterprise Readiness (SSO, audit logs, white-label, teams)

📚 **Complete Roadmap:** [ROADMAP.md](docs/planning/roadmap/ROADMAP.md) | 🗺️ **Interactive Timeline:** [codescribe-ai/docs/roadmap/](https://jmcoleman.github.io/codescribe-ai/docs/roadmap/)

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
