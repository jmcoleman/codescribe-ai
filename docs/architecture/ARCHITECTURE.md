# CodeScribe AI - Architecture Deep Dive

**Version:** 1.2
**Last Updated:** October 21, 2025
**Status:** Production Ready - Phase 1.5 Complete (Deployed)
**Model:** Claude Sonnet 4.5 (claude-sonnet-4-20250514)

> **Quick Reference:** For a visual architecture diagram and overview, see [ARCHITECTURE-OVERVIEW.md](ARCHITECTURE-OVERVIEW.md)
> **Purpose:** This document provides comprehensive technical architecture details reflecting the actual production implementation, including all components, services, middleware, and design patterns currently in use.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Component Design](#component-design)
5. [Data Flow](#data-flow)
6. [API Architecture](#api-architecture)
7. [Security Architecture](#security-architecture)
8. [Performance & Scalability](#performance--scalability)
9. [Deployment Architecture](#deployment-architecture)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

CodeScribe AI is a **stateless, real-time documentation generation platform** that leverages Anthropic's Claude Sonnet 4.5 API to transform source code into professional documentation. The architecture follows a **service-oriented design** with clear separation between presentation (React), application logic (Node.js/Express), and AI services (Claude API).

### Key Architectural Principles

- **Stateless Design**: No database, no user sessions - privacy-first approach
- **Service Layer Pattern**: Reusable business logic across multiple clients
- **Real-Time Streaming**: Fetch API with ReadableStream for responsive UX
- **API-First**: Backend can serve multiple front ends independently
- **Code-as-Data**: AST parsing using Acorn for intelligent code analysis
- **Graceful Degradation**: Fallback strategies for API failures and parsing errors
- **Performance Optimized**: Lazy loading, code splitting, and bundle optimization
- **Middleware-Driven**: Rate limiting, error handling, and CORS as reusable middleware

### Current Implementation Status

**✅ Completed Features:**
- Full-stack web application (React + Express)
- Real-time streaming documentation generation
- AST-based code analysis for JavaScript/TypeScript
- Quality scoring algorithm (5 criteria, 100-point scale)
- File upload with validation (500KB limit, 10+ file types)
- Rate limiting (10/min per IP, 100/hour for generation)
- Error handling with user-friendly messages
- Toast notification system with history
- Lazy-loaded components for performance
- Mermaid diagram rendering in documentation
- Comprehensive test coverage (Jest + React Testing Library)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Web Browser   │  │   CLI Tool     │  │  VS Code Ext   │   │
│  │   (React 19)   │  │  (Phase 2)     │  │  (Phase 3)     │   │
│  │   + Vite       │  │                │  │                │   │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘   │
│           │                   │                    │           │
│           └───────────────────┼────────────────────┘           │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                     HTTP/Fetch API (Streaming)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      APPLICATION TIER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Express API Server (Node.js 20+)            │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │ API Routes │  │ Middleware │  │   Error    │         │   │
│  │  │            │  │  - CORS    │  │  Handling  │         │   │
│  │  │ - Generate │  │  - Rate    │  │            │         │   │
│  │  │ - Stream   │  │    Limit   │  │            │         │   │
│  │  │ - Upload   │  │  - Multer  │  │            │         │   │
│  │  │ - Health   │  │            │  │            │         │   │
│  │  └─────┬──────┘  └────────────┘  └────────────┘         │   │
│  │        │                                                 │   │
│  │  ┌─────▼──────────────────────────────────────────────┐  │   │
│  │  │          Service Layer (Singleton Pattern)         │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │  │   │
│  │  │  │   Claude    │  │    Code     │  │  Quality   │  │  │   │
│  │  │  │   Client    │  │   Parser    │  │  Scorer    │  │  │   │
│  │  │  │  (Retry)    │  │   (Acorn)   │  │ (5 Criteria│  │  │   │
│  │  │  └──────┬──────┘  └──────┬──────┘  └──────┬─────┘  │  │   │
│  │  │         │                │                │        │  │   │
│  │  │  ┌──────▼────────────────▼────────────────▼─────┐  │  │   │
│  │  │  │     DocGeneratorService (Orchestrator)       │  │  │   │
│  │  │  │   - buildPrompt() (4 doc types)              │  │  │   │
│  │  │  │   - generateDocumentation()                  │  │  │   │
│  │  │  └──────────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                          HTTPS (API)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                       EXTERNAL SERVICES                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Anthropic Claude API (Sonnet 4.5)                      │   │
│  │   Model: claude-sonnet-4-20250514                        │   │
│  │   - Streaming with message.create({ stream: true })      │   │
│  │   - 200K token context window                            │   │
│  │   - Max tokens: 4000                                     │   │
│  │   - Retry with exponential backoff (3 attempts)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Layers

**1. Presentation Layer (Client)**
- **React 19.2.0** with Vite 7.1.9 for fast dev server and optimized builds
- **Lazy Loading**: DocPanel, modals, Monaco Editor, Mermaid renderer
- **Component Library**: 20+ components with comprehensive test coverage (660+ tests)
- **State Management**: React hooks (useState, useCallback, useEffect, useRef)
- **Custom Hooks**: useDocGeneration, useToastKeyboardShortcuts
- **Accessibility**: WCAG 2.1 AA compliant (95/100 Lighthouse score, 0 violations)
- **Responsible for**: UI rendering, user input, code editing (Monaco), markdown display

**2. Application Layer (Server)**
- **Express 5** REST API with middleware architecture
- **Middleware Stack**: CORS → Rate Limiting → Body Parser → Routes → Error Handler
- **Service-oriented architecture** for reusability
- **Responsible for**: Request handling, validation, rate limiting, streaming, error responses

**3. Service Layer**
- **ClaudeClient**: API wrapper with retry logic (3 attempts, exponential backoff)
- **CodeParser**: Acorn-based AST analysis with fallback regex parsing
- **QualityScorer**: 5-criteria algorithm (Overview, Installation, Examples, API Docs, Structure)
- **DocGeneratorService**: Orchestrates parsing → prompting → generation → scoring

**4. External Services**
- **Anthropic Claude API**: Sonnet 4.5 model for AI text generation
- **Vercel**: Hosting and CDN (planned for production deployment)

---

## Technology Stack

### Frontend Stack (Current Implementation)

| Technology | Version | Purpose | Implementation Details |
|------------|---------|---------|------------------------|
| React | 19.2.0 | UI framework | Hooks-based, no class components |
| React DOM | 19.2.0 | React renderer | DOM-specific rendering methods |
| Vite | 7.1.9 | Build tool | Fast HMR, bundle optimization with rollup-plugin-visualizer |
| Tailwind CSS | 3.4.18 | Utility styling | Custom animations for errors, toasts, modals |
| Monaco Editor | @monaco-editor/react 4.7.0 | Code editing | Lazy loaded, syntax highlighting |
| react-markdown | 10.1.0 | Markdown rendering | Lazy loaded via DocPanel |
| react-syntax-highlighter | 15.6.6 | Code highlighting | Syntax highlighting in markdown code blocks |
| remark-gfm | 4.0.1 | GitHub Flavored Markdown | Extended markdown support (tables, task lists) |
| Mermaid | 11.12.0 | Diagram rendering | Lazy loaded renderer component |
| react-hot-toast | 2.6.0 | Notifications | Custom toast components with history |
| Lucide React | 0.545.0 | Icon library | Tree-shakeable icons |
| @headlessui/react | 2.2.9 | Headless UI components | Accessible select dropdowns, modals |
| focus-trap-react | 11.0.4 | Focus management | Modal focus trapping for accessibility |

**Performance Optimizations:**
- Lazy loading reduces initial bundle: 516KB → 78KB gzipped (-85%)
- Code splitting for modals (ExamplesModal, HelpModal, QualityScoreModal)
- Lighthouse score: 45 → 75 (+67% improvement)
- Core Web Vitals: FCP -89%, LCP -93%, TBT -30%

### Backend Stack (Current Implementation)

| Technology | Version | Purpose | Implementation Details |
|------------|---------|---------|------------------------|
| Node.js | 22.19.0 | JavaScript runtime | ES modules (import/export) |
| npm | 11.6.0 | Package manager | Workspaces for monorepo |
| Express | 5.1.0 | Web framework | Middleware-driven architecture |
| @anthropic-ai/sdk | 0.65.0 | Claude API | Streaming support via async iterators |
| Acorn | 8.15.0 | AST parser | JavaScript/TypeScript parsing |
| Multer | 2.0.2 | File upload | Memory storage, 500KB limit |
| express-rate-limit | 8.1.0 | Rate limiting | 2 limiters: per-minute + hourly |
| cors | 2.8.5 | CORS handling | Exposes rate limit headers |
| dotenv | 17.2.3 | Environment variables | Secure API key management |

**Service Architecture:**
- **Singleton Pattern**: Single instance of each service (ClaudeClient, DocGeneratorService)
- **Strategy Pattern**: Different prompts per doc type (README, JSDoc, API, ARCHITECTURE)
- **Decorator Pattern**: Retry logic wraps Claude API calls

### Infrastructure

| Service | Purpose | Status |
|---------|---------|--------|
| Vercel | Frontend hosting + API routes | ✅ Deployed (codescribeai.com) |
| GitHub Actions | CI/CD pipeline | ✅ Test-gated deployment with Deploy Hooks |
| Environment Variables | API key management | ✅ Implemented (.env + Vercel secrets) |
| HTTPS | Secure communication | ✅ Vercel-managed |
| Fetch API Streaming | Real-time updates | ✅ Implemented (ReadableStream) |
| Git | Version control | git 2.51.0 |

---

## Component Design

### Frontend Component Tree (Actual Implementation)

```
App.jsx (Main orchestrator)
├── Toaster (react-hot-toast container)
├── <input type="file" /> (Hidden file upload)
├── Header.jsx
│   ├── Logo + Title
│   ├── Desktop Navigation
│   │   ├── Examples Button
│   │   ├── Help Button
│   │   └── RateLimitIndicator
│   └── Mobile Menu Button
├── MobileMenu.jsx (Slide-in sidebar)
│   ├── Examples Button
│   ├── Help Button
│   └── Close Button
├── ControlBar.jsx
│   ├── Select (Doc Type Dropdown)
│   │   └── Options: README, JSDoc, API, ARCHITECTURE
│   ├── Button (Upload File)
│   ├── Button (GitHub Import - Future)
│   └── Button (Generate Docs)
│       └── Disabled when code empty
├── ErrorBanner.jsx (Inline error display)
│   ├── Error message
│   ├── Retry timer (for rate limits)
│   └── Dismiss button
├── Split Panel Container (Grid layout)
│   ├── CodePanel.jsx
│   │   └── LazyMonacoEditor
│   │       └── Monaco Editor (lazy loaded)
│   └── DocPanel.jsx (lazy loaded)
│       ├── SkeletonLoader (while generating)
│       ├── LazyMermaidRenderer (for diagrams)
│       ├── ReactMarkdown
│       ├── QualityScoreBadge
│       └── CopyButton
├── Modals (All lazy loaded with Suspense)
│   ├── QualityScoreModal.jsx
│   │   ├── Overall Score Display
│   │   ├── Criteria Breakdown (5 items)
│   │   │   └── CriteriaItem (progress bars)
│   │   └── CopyButtonWithText (Copy Report)
│   ├── ExamplesModal.jsx
│   │   ├── Example cards (JavaScript, React, API)
│   │   ├── Preview code snippets
│   │   └── Load Example buttons
│   └── HelpModal.jsx
│       ├── Feature list
│       ├── Keyboard shortcuts
│       └── Tips
└── ErrorBoundary.jsx (Top-level error catching)
```

**Component Patterns:**
- **Lazy Loading**: DocPanel, all modals, Monaco Editor, Mermaid renderer
- **Suspense Boundaries**: LoadingFallback for panels, ModalLoadingFallback for modals
- **Custom Hooks**: useDocGeneration (API calls), useToastKeyboardShortcuts
- **Error Boundaries**: ErrorBoundary catches React errors, displays fallback UI
- **Memoization**: Not extensively used (React 18 handles most optimizations)
- **Focus Management**: Modals trap focus, auto-focus close button
- **Accessibility**: ARIA labels, roles, keyboard navigation, screen reader support

### Backend Service Architecture (Actual Implementation)

```
server/src/
├── server.js (Express app setup)
│   ├── CORS middleware
│   ├── Body parser (10MB limit)
│   ├── API routes (/api)
│   └── Error handler middleware
├── middleware/
│   ├── rateLimiter.js
│   │   ├── apiLimiter (10 req/min)
│   │   └── generationLimiter (100 req/hour)
│   └── errorHandler.js
│       └── Global error handler
├── routes/
│   └── api.js (All API endpoints)
│       ├── POST /api/generate (non-streaming)
│       ├── POST /api/generate-stream (SSE)
│       ├── POST /api/upload (Multer)
│       └── GET /api/health
└── services/
    ├── claudeClient.js
    │   ├── ClaudeClient class
    │   ├── generate() → single completion
    │   ├── generateWithStreaming() → async iterator
    │   └── sleep() → exponential backoff
    ├── docGenerator.js
    │   ├── DocGeneratorService class
    │   ├── generateDocumentation() → main flow
    │   └── buildPrompt() → 4 doc type strategies
    ├── codeParser.js
    │   ├── parseCode() → AST analysis
    │   ├── walkAST() → extract functions/classes
    │   ├── calculateComplexity() → simple/medium/complex
    │   ├── calculateMetrics() → comprehensive stats
    │   └── basicAnalysis() → fallback for non-JS
    └── qualityScorer.js
        ├── calculateQualityScore() → 5 criteria
        ├── hasSection() → keyword matching
        ├── countCodeBlocks() → example detection
        ├── countFunctionDocs() → API coverage
        └── getGrade() → A-F grading
```

**Service Patterns:**
- **Singleton**: `export default new ClaudeClient()` - single instance
- **Strategy**: `buildPrompt()` selects prompt based on docType
- **Retry Decorator**: `generate()` wraps API calls with retry logic (3 attempts)
- **Template Method**: `generateDocumentation()` defines algorithm skeleton
- **AST Visitor**: `walkAST()` walks tree, extracts structure

---

## Data Flow

### 1. Streaming Documentation Flow (Primary Implementation)

```
User Action: Click "Generate Docs"
     │
     ▼
┌────────────────────────┐
│  App.jsx               │
│  - handleGenerate()    │
│  - Close quality modal │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  useDocGeneration Hook │
│  - Reset state         │
│  - Clear errors        │
│  - Set isGenerating    │
└──────────┬─────────────┘
           │ fetch() with POST
           │ { code, docType, language }
           ▼
┌────────────────────────┐
│  Express Middleware    │
│  1. CORS headers       │
│  2. apiLimiter         │ → 429 if > 10/min
│  3. generationLimiter  │ → 429 if > 100/hour
│  4. Body validation    │ → 400 if invalid
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  POST /api/generate-   │
│  stream Handler        │
│  - Validate code       │
│  - Set SSE headers     │
│  - Write connected     │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  DocGeneratorService                   │
│  ┌──────────────────────────────────┐  │
│  │ 1. parseCode(code, language)     │  │
│  │    → Acorn AST parsing           │  │
│  │    → Extract functions, classes  │  │
│  │    → Calculate complexity        │  │
│  │    → Fallback to regex if fails  │  │
│  └──────────┬───────────────────────┘  │
│             │                          │
│  ┌──────────▼───────────────────────┐  │
│  │ 2. buildPrompt(code, analysis,   │  │
│  │    docType, language)            │  │
│  │    → Select prompt strategy      │  │
│  │    → Inject code context         │  │
│  │    → Add Mermaid rules           │  │
│  │    → Add markdown formatting     │  │
│  └──────────┬───────────────────────┘  │
│             │                          │
│  ┌──────────▼───────────────────────┐  │
│  │ 3. claudeClient.generate         │  │
│  │    WithStreaming(prompt, onChunk)│  │
│  │    → Create stream with SDK      │  │
│  │    → Iterate events              │  │
│  │    → Call onChunk() per delta    │  │
│  └──────────┬───────────────────────┘  │
│             │ Each chunk              │
└─────────────┼───────────────────────────┘
              │
              ▼ res.write(SSE chunk)
┌─────────────────────────┐
│  Streaming Response     │
│  For each chunk:        │
│  data: {                │
│    type: 'chunk',       │
│    content: '...'       │
│  }                      │
└──────────┬──────────────┘
           │ ReadableStream
           ▼
┌─────────────────────────┐
│  useDocGeneration       │
│  - reader.read()        │
│  - Decode UTF-8         │
│  - Parse SSE format     │
│  - Update doc state     │
└──────────┬──────────────┘
           │ Each chunk
           ▼
┌─────────────────────────┐
│  DocPanel.jsx           │
│  - Display streaming    │
│  - Markdown render      │
│  - Scroll to bottom     │
└─────────────────────────┘
           │
           │ When complete
           ▼
┌──────────────────────────────────────┐
│  DocGeneratorService                 │
│  ┌────────────────────────────────┐  │
│  │ 4. calculateQualityScore       │  │
│  │    (documentation, analysis)   │  │
│  │    → Check 5 criteria          │  │
│  │    → Count sections, examples  │  │
│  │    → Calculate API coverage    │  │
│  │    → Generate grade A-F        │  │
│  └──────────┬─────────────────────┘  │
└─────────────┼──────────────────────────┘
              │
              ▼ res.write(SSE complete)
┌─────────────────────────┐
│  data: {                │
│    type: 'complete',    │
│    qualityScore: {...}, │
│    metadata: {...}      │
│  }                      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  useDocGeneration       │
│  - Set qualityScore     │
│  - Set isGenerating=off │
│  - Trigger toast        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  App.jsx useEffect      │
│  - toastDocGenerated()  │
│  - Show quality badge   │
└─────────────────────────┘
```

### 2. File Upload Flow

```
User Action: Click "Upload File"
     │
     ▼
┌────────────────────────┐
│  App.jsx               │
│  - handleUpload()      │
│  - Trigger file input  │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  <input type="file">   │
│  - User selects file   │
│  - onChange fires      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  handleFileChange()    │
│  - Client validation   │
│  - Check extension     │
│  - Check size (<500KB) │
│  - Check not empty     │
└──────────┬─────────────┘
           │ If valid
           │ FormData
           ▼
┌────────────────────────┐
│  fetch POST /api/upload│
│  - multipart/form-data │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  Multer Middleware     │
│  - memoryStorage       │
│  - 500KB limit         │
│  - Extension filter    │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  POST /api/upload      │
│  - Validate not empty  │
│  - Check content       │
│  - Convert to UTF-8    │
│  - Return JSON         │
└──────────┬─────────────┘
           │ Success
           ▼
┌────────────────────────┐
│  App.jsx               │
│  - setCode(content)    │
│  - Detect language     │
│  - Show toast          │
└─────────────────────────┘
```

### 3. Error Handling Flow

```
Error occurs (API, network, validation)
     │
     ▼
┌────────────────────────┐
│  useDocGeneration      │
│  - Catch error         │
│  - Categorize type     │
│  - Set error state     │
│  - Set retryAfter      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  App.jsx useEffect     │
│  - Detect error        │
│  - Show ErrorBanner    │
│  - Grouped toast       │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  ErrorBanner.jsx       │
│  - Display message     │
│  - Show retry timer    │
│  - Animate in (250ms)  │
│  - Dismiss button      │
└─────────────────────────┘
```

---

## API Architecture

### Endpoints (Current Implementation)

#### 1. POST /api/generate (Non-Streaming)

**Purpose:** Generate documentation without streaming (for CLI/extension future use)

**Request:**
```json
{
  "code": "function example() { return 'Hello'; }",
  "docType": "README",  // README | JSDoc | API | ARCHITECTURE
  "language": "javascript"
}
```

**Response (Success 200):**
```json
{
  "documentation": "# Example\n\nGenerated markdown...",
  "qualityScore": {
    "score": 85,
    "grade": "B",
    "breakdown": {
      "overview": { "present": true, "points": 20, "maxPoints": 20, ... },
      "installation": { "present": true, "points": 15, ... },
      "examples": { "count": 2, "points": 15, ... },
      "apiDocs": { "coverage": "3/3", "points": 25, ... },
      "structure": { "headers": 5, "points": 18, ... }
    },
    "summary": {
      "strengths": ["overview", "apiDocs"],
      "improvements": ["examples"],
      "topSuggestion": "Add one more usage example"
    },
    "docType": "README"
  },
  "analysis": {
    "functions": [{ "name": "example", "params": [], ... }],
    "classes": [],
    "exports": [],
    "complexity": "simple",
    "cyclomaticComplexity": 1,
    "metrics": { ... }
  },
  "metadata": {
    "language": "javascript",
    "docType": "README",
    "generatedAt": "2025-10-16T12:00:00.000Z",
    "codeLength": 42
  }
}
```

**Error Responses:**
- `400`: Invalid request (missing code, too large)
- `429`: Rate limit exceeded
- `500`: Generation failed

**Middleware:** apiLimiter → generationLimiter

---

#### 2. POST /api/generate-stream (Server-Sent Events)

**Purpose:** Primary generation endpoint with real-time streaming

**Request:** Same as /api/generate

**Response (SSE Stream):**
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no

data: {"type":"connected"}

data: {"type":"chunk","content":"#"}

data: {"type":"chunk","content":" Example"}

data: {"type":"chunk","content":"\n\nThis is"}

...

data: {"type":"complete","qualityScore":{...},"metadata":{...}}
```

**Event Types:**
- `connected`: Initial handshake
- `chunk`: Documentation text chunk
- `complete`: Final event with quality score
- `error`: Error occurred during generation

**Middleware:** apiLimiter → generationLimiter

---

#### 3. POST /api/upload

**Purpose:** File upload for code input

**Request (multipart/form-data):**
```
Content-Type: multipart/form-data
file: [Binary file data]
```

**Response (Success 200):**
```json
{
  "success": true,
  "file": {
    "name": "example.js",
    "size": 1024,
    "sizeFormatted": "1.00 KB",
    "extension": ".js",
    "mimetype": "application/javascript",
    "content": "function example() { ... }"
  }
}
```

**Validation:**
- Max size: 500KB
- Allowed extensions: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs, .rb, .php, .txt
- Content must not be empty

**Error Responses:**
- `400`: File too large, invalid type, empty file
- `500`: Upload failed

**Middleware:** apiLimiter → multer

---

#### 4. GET /api/health

**Purpose:** Health check and status monitoring

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 12345.67,
  "environment": "production"
}
```

**No middleware** (publicly accessible)

---

### Rate Limiting Configuration

**Per-Minute Limiter (apiLimiter):**
- Window: 60 seconds
- Max requests: 10
- Applied to: ALL /api/* endpoints
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Hourly Limiter (generationLimiter):**
- Window: 3600 seconds (1 hour)
- Max requests: 100
- Applied to: /api/generate, /api/generate-stream
- Prevents Claude API abuse

**429 Response:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

---

## Security Architecture

### 1. API Key Management

**Current Implementation:**
- Claude API key stored in environment variable: `CLAUDE_API_KEY`
- Never exposed to frontend
- Loaded via `dotenv` in server startup
- Validated on server initialization

**Best Practices:**
- Use `.env` file locally (gitignored)
- Use Vercel environment variables in production
- Rotate keys periodically
- Monitor usage via Anthropic dashboard

### 2. Input Validation

**Code Input:**
- Max length: 100,000 characters (prevent abuse)
- String type validation
- SQL injection: N/A (no database)
- XSS: Handled by react-markdown sanitization

**File Upload:**
- Size limit: 500KB
- Extension whitelist: 10+ approved types
- Empty file detection
- Content validation: Must contain non-whitespace

**Request Validation:**
- Body parser limit: 10MB
- JSON parsing errors caught
- Missing field validation

### 3. CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://codescribeai.com'
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
```

**Production:** Strict origin check (custom domain: codescribeai.com)
**Development:** Allow local Vite servers

### 4. Rate Limiting (DDoS Protection)

- IP-based rate limiting
- Two-tier system: per-minute + hourly
- Prevents API abuse
- Protects Claude API quota

### 5. Error Handling

**Never expose sensitive data:**
- Stack traces hidden in production
- Generic error messages to client
- Detailed errors logged server-side
- No API key leakage

**Error Handler Middleware:**
```javascript
function errorHandler(err, req, res, next) {
  console.error(err); // Server-side logging
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An error occurred'
  });
}
```

### 6. Privacy

**No Data Storage:**
- Code never saved to database
- Documentation generated in memory
- No user tracking (except Vercel Analytics)
- No cookies (except session management if added)

**Stateless Architecture:**
- Each request independent
- No user accounts
- No session persistence

---

## Performance & Scalability

### Performance Metrics (Lighthouse Audit)

**Before Optimization:**
- Performance Score: 45
- First Contentful Paint: 3.8s
- Largest Contentful Paint: 8.2s
- Total Blocking Time: 980ms
- Bundle Size: 516 KB gzipped

**After Optimization (Current):**
- Performance Score: 75 (+67% improvement)
- First Contentful Paint: 0.4s (-89%)
- Largest Contentful Paint: 0.6s (-93%)
- Total Blocking Time: 680ms (-30%)
- Bundle Size: 78 KB gzipped (-85%)

### Optimization Strategies

**1. Lazy Loading:**
- DocPanel: 281.53 KB gzipped (lazy loaded)
- Monaco Editor: 4.85 KB wrapper (editor loaded on interaction)
- Mermaid: 139.30 KB gzipped (lazy loaded)
- Modals: 2-9 KB each (lazy loaded)

**Implementation:**
```javascript
const DocPanel = lazy(() => import('./components/DocPanel').then(m => ({ default: m.DocPanel })));
const QualityScoreModal = lazy(() => import('./components/QualityScore').then(...));
```

**2. Code Splitting:**
- Vite automatic code splitting
- Dynamic imports for heavy components
- Suspense boundaries with fallbacks

**3. Bundle Analysis:**
- Tool: rollup-plugin-visualizer
- Identified large dependencies
- Moved to lazy loading
- Result: 85% size reduction

**4. Streaming:**
- Real-time documentation generation
- Perceived performance improvement
- User sees progress immediately
- No waiting for full response

### Scalability Considerations

**Current Architecture:**
- **Horizontal Scaling**: Stateless design allows multiple server instances
- **Bottleneck**: Claude API rate limits (check Anthropic tier)
- **Caching**: Not implemented (future enhancement)

**Future Enhancements:**
- **Caching Layer**: Redis for repeated code snippets
- **Queue System**: Background job processing for large files
- **CDN**: Vercel Edge Network for static assets
- **Load Balancing**: Vercel automatic load balancing

**Claude API Limits:**
- Check tier limits on Anthropic dashboard
- Monitor usage to avoid quota exhaustion
- Implement backpressure if needed
- Consider prompt caching (if available in API)

---

## Deployment Architecture

### Current Deployment Strategy

**Development:**
- Frontend: `npm run dev` (Vite dev server on port 5173)
- Backend: `npm run dev` (Nodemon on port 3000)
- Concurrently: `npm run dev` (both servers simultaneously)

**Production (Planned for Vercel):**
```
┌─────────────────────────────────────┐
│        Vercel Edge Network          │
│  - Global CDN                       │
│  - Automatic SSL                    │
│  - Edge caching                     │
└──────────┬──────────────────────────┘
           │
           ▼
┌──────────────────────┬──────────────┐
│   Static Frontend    │  API Routes  │
│   (React Build)      │  (Express)   │
│   /                  │  /api/*      │
└──────────────────────┴──────────────┘
```

**Build Process:**
```bash
# Client build
cd client && npm run build
# Outputs to client/dist/

# Server (no build needed - runs directly)
cd server && npm start
```

**Environment Variables (Vercel):**
- `CLAUDE_API_KEY`: Anthropic API key
- `NODE_ENV`: production
- `VITE_API_URL`: https://codescribeai.com (custom domain)

### CI/CD Pipeline ✅ **IMPLEMENTED**

**GitHub Actions Workflow:**
1. Trigger: Push to `main` branch
2. Install dependencies: `npm run install:all`
3. Run tests: `npm test` (client + server)
   - ✅ 660+ tests must pass before deployment
4. Build frontend: `cd client && npm run build`
5. Deploy to Vercel: Test-gated deployment via Deploy Hooks
   - ✅ Only deploys after all tests pass

**Testing Strategy:**
- ✅ Unit tests: Jest + Vitest + React Testing Library (660+ tests)
- ✅ Integration tests: API endpoint testing with Supertest
- ✅ E2E tests: Playwright (10 tests across 5 browsers, 100% pass rate)
- ✅ Backend coverage: 95.81% statements, 88.72% branches

---

## Future Enhancements

### Phase 2: CLI Tool

**Architecture:**
- Standalone Node.js CLI package
- Reuses service layer (claudeClient, docGenerator, etc.)
- File system operations for reading/writing
- Interactive prompts via inquirer

**Commands:**
```bash
codescribe generate ./src/index.js --type README
codescribe batch ./src/**/*.js --type JSDoc
codescribe config --api-key sk-ant-xxx
```

### Phase 3: VS Code Extension

**Architecture:**
- TypeScript extension
- Reuses service layer via API calls
- Editor integration via VS Code API
- Context menu: "Generate Documentation"

**Features:**
- Right-click on file → Generate docs
- Inline documentation insertion
- Quality score in status bar

### Phase 4: Optional Enhancements

**Feature Enhancements:**
- Toast History panel (implemented)
- Advanced Mermaid diagrams (implemented)
- Error handling UX (implemented)
- Copy/download documentation (implemented)

**Performance:**
- Service Worker for offline support
- HTTP/2 Server Push
- Font optimization
- Edge computing (Vercel Edge Functions)

**Caching:**
- Redis for repeated code snippets
- Cache prompt templates
- Cache AST analysis results

**Monitoring:**
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Usage analytics (Vercel Analytics)
- Claude API cost tracking

---

## Appendix: File Structure

```
codescribe-ai/
├── client/                     # Frontend application
│   ├── src/
│   │   ├── components/        # React components (20+)
│   │   │   ├── App.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── ControlBar.jsx
│   │   │   ├── CodePanel.jsx
│   │   │   ├── DocPanel.jsx
│   │   │   ├── QualityScore.jsx
│   │   │   ├── ErrorBanner.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LazyMonacoEditor.jsx
│   │   │   ├── LazyMermaidRenderer.jsx
│   │   │   ├── toast/
│   │   │   │   ├── CustomToast.jsx
│   │   │   │   └── ToastHistory.jsx
│   │   │   └── __tests__/     # Component tests
│   │   ├── hooks/
│   │   │   ├── useDocGeneration.js
│   │   │   └── useToastKeyboardShortcuts.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── toast.jsx
│   │   │   ├── toastWithHistory.js
│   │   │   └── fileValidation.js
│   │   ├── constants/
│   │   │   └── examples.js
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                     # Backend application
│   ├── src/
│   │   ├── server.js          # Express app setup
│   │   ├── routes/
│   │   │   └── api.js         # API endpoints
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js
│   │   │   └── errorHandler.js
│   │   └── services/
│   │       ├── claudeClient.js
│   │       ├── docGenerator.js
│   │       ├── codeParser.js
│   │       ├── qualityScorer.js
│   │       └── __tests__/     # Service tests
│   ├── .env                   # Environment variables (gitignored)
│   └── package.json
├── docs/                       # Documentation
│   ├── architecture/
│   │   ├── ARCHITECTURE-OVERVIEW.md  # Visual diagram
│   │   └── ARCHITECTURE.md     # This file (deep dive)
│   ├── planning/
│   ├── api/
│   ├── components/
│   └── performance/
└── package.json                # Root package (scripts)
```

---

**Document Version:** 1.2
**Last Updated:** October 21, 2025
**Next Review:** Phase 2 planning
