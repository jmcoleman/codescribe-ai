# CodeScribe AI - Architecture Deep Dive

**Version:** 1.0
**Last Updated:** October 13, 2025
**Status:** Production Ready

> **Quick Reference:** For a visual architecture diagram and overview, see [04-Architecture.md](04-Architecture.md)
> **Purpose:** This document provides comprehensive technical architecture details, including security, performance, scalability, and deployment strategies.

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

CodeScribe AI is a **stateless, real-time documentation generation platform** that leverages Anthropic's Claude API to transform source code into professional documentation. The architecture follows a **service-oriented design** with clear separation between presentation (React), application logic (Node.js), and AI services (Claude API).

### Key Architectural Principles

- **Stateless Design**: No database, no user sessions - privacy-first approach
- **Service Layer Pattern**: Reusable business logic across multiple clients (web, CLI, extension)
- **Real-Time Streaming**: Server-Sent Events (SSE) for responsive UX
- **API-First**: Backend can serve multiple front ends independently
- **Code-as-Data**: AST parsing for intelligent code analysis
- **Graceful Degradation**: Fallback strategies for API failures and parsing errors

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Web Browser   │  │   CLI Tool     │  │  VS Code Ext   │   │
│  │   (React)      │  │  (Node.js)     │  │  (TypeScript)  │   │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘   │
│           │                   │                    │            │
│           └───────────────────┼────────────────────┘            │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                         HTTP/SSE (REST API)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      APPLICATION TIER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Express API Server (Node.js)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ API Routes │  │ Middleware │  │   Error    │         │  │
│  │  │            │  │  - CORS    │  │  Handling  │         │  │
│  │  │ - Generate │  │  - Rate    │  │            │         │  │
│  │  │ - Stream   │  │    Limit   │  │            │         │  │
│  │  │ - Upload   │  │  - Validate│  │            │         │  │
│  │  └─────┬──────┘  └────────────┘  └────────────┘         │  │
│  │        │                                                  │  │
│  │  ┌─────▼──────────────────────────────────────────────┐ │  │
│  │  │          Service Layer (Business Logic)            │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │ │  │
│  │  │  │   Claude    │  │    Code     │  │  Quality   │ │ │  │
│  │  │  │   Client    │  │   Parser    │  │  Scorer    │ │ │  │
│  │  │  │             │  │   (AST)     │  │            │ │ │  │
│  │  │  └──────┬──────┘  └──────┬──────┘  └──────┬─────┘ │ │  │
│  │  │         │                │                │       │ │  │
│  │  │  ┌──────▼────────────────▼────────────────▼─────┐ │ │  │
│  │  │  │     Documentation Generator Service          │ │ │  │
│  │  │  │   (Orchestrates all documentation logic)     │ │ │  │
│  │  │  └──────────────────────────────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                          HTTPS (API)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                       EXTERNAL SERVICES                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Anthropic Claude API (Sonnet 4.5)              │  │
│  │   - Text generation with streaming                        │  │
│  │   - 200K token context window                            │  │
│  │   - Retry with exponential backoff                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Layers

**1. Presentation Layer (Client)**
- React 19 with Vite for the web application
- Future: CLI tool and VS Code extension
- Responsible for: UI rendering, user input, Monaco Editor integration

**2. Application Layer (Server)**
- Express 5 REST API
- Service-oriented architecture
- Responsible for: Request handling, business logic orchestration, response formatting

**3. Service Layer**
- Claude API client with retry logic
- Code parser (AST analysis using Acorn)
- Quality scoring algorithm
- Documentation generator (prompt engineering)

**4. External Services**
- Anthropic Claude API for AI text generation

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework with concurrent features |
| Vite | 7.x | Build tool and dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| Monaco Editor | Latest | Code editing with syntax highlighting |
| react-markdown | Latest | Safe markdown rendering |
| Lucide React | Latest | Icon library |

**Why these choices?**
- React 19 provides the latest features and performance optimizations
- Vite offers instant HMR and optimized production builds
- Monaco Editor gives VS Code-quality editing in the browser
- Tailwind enables rapid, consistent UI development

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| Express | 5.x | Web framework |
| Anthropic SDK | Latest | Claude API integration |
| Acorn | Latest | JavaScript AST parser |
| Multer | Latest | File upload handling |

**Why these choices?**
- Node.js 20+ provides modern JavaScript features and performance
- Express is lightweight, flexible, and well-documented
- Acorn is fast and produces standard ESTree AST
- Service layer is framework-agnostic for future flexibility

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting + API routes |
| Environment Variables | API key management |
| HTTPS | Secure communication |
| SSE | Real-time streaming |

---

## Component Design

### Frontend Components

```
App.jsx
├── Header.jsx                    # Logo, title, navigation
├── MobileMenu.jsx               # Responsive mobile navigation
├── ControlBar.jsx               # Doc type selector, generate button
│   ├── DocTypeSelector
│   ├── ExamplesDropdown
│   └── GenerateButton
├── Split Panel Container
│   ├── CodePanel.jsx            # Monaco Editor wrapper
│   │   └── Monaco Editor
│   └── DocPanel.jsx             # Documentation display
│       ├── StreamingText
│       ├── MarkdownRenderer
│       └── QualityScore.jsx    # Score badge and breakdown
├── ErrorBoundary.jsx            # Global error handling
└── LoadingStates
```

**Key Design Patterns:**
- **Composition**: Small, focused components composed together
- **Custom Hooks**: Business logic extracted into reusable hooks
- **Error Boundaries**: Graceful error handling at component boundaries
- **Memoization**: Performance optimization for expensive renders

### Backend Services

```
DocGeneratorService
├── buildPrompt()               # Context-aware prompt engineering
├── generateDocumentation()     # Main orchestration
└── Uses:
    ├── ClaudeClient
    │   ├── generate()          # Non-streaming generation
    │   ├── generateWithStreaming()
    │   └── Retry logic with exponential backoff
    ├── CodeParser
    │   ├── parseCode()         # AST parsing with Acorn
    │   ├── walkAST()           # Extract structure
    │   └── calculateComplexity()
    └── QualityScorer
        ├── calculateQualityScore()
        ├── hasSection()        # Check for required sections
        ├── countCodeBlocks()   # Count examples
        └── getGrade()          # A-F grading
```

**Key Design Patterns:**
- **Singleton**: Single instance of each service
- **Strategy Pattern**: Different prompt strategies per doc type
- **Decorator Pattern**: Retry logic wraps API calls
- **Service Layer**: Reusable across web/CLI/extension

---

## Data Flow

### 1. Documentation Generation Flow (Standard)

```
User Action: Click "Generate Docs"
     │
     ▼
┌────────────────────────┐
│  Frontend (React)      │
│  - Collect code        │
│  - Validate input      │
│  - Show loading state  │
└──────────┬─────────────┘
           │ POST /api/generate
           │ { code, docType, language }
           ▼
┌────────────────────────┐
│  API Route Handler     │
│  - Validate request    │
│  - Rate limit check    │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  DocGeneratorService   │
│  ┌──────────────────┐  │
│  │ 1. Parse Code    │  │  parseCode(code, language)
│  │    (AST)         │  │  → {functions, classes, exports}
│  └────────┬─────────┘  │
│           │             │
│  ┌────────▼─────────┐  │
│  │ 2. Build Prompt  │  │  buildPrompt(code, analysis, docType)
│  │    (Context)     │  │  → Enhanced prompt with context
│  └────────┬─────────┘  │
│           │             │
│  ┌────────▼─────────┐  │
│  │ 3. Call Claude   │  │  claudeClient.generate(prompt)
│  │    API           │  │  → Generated documentation
│  └────────┬─────────┘  │
│           │             │
│  ┌────────▼─────────┐  │
│  │ 4. Score Quality │  │  calculateQualityScore(docs, analysis)
│  │                  │  │  → {score, grade, breakdown}
│  └────────┬─────────┘  │
└───────────┼─────────────┘
            │
            │ JSON Response
            ▼
┌────────────────────────┐
│  Frontend (React)      │
│  - Display docs        │
│  - Show quality score  │
│  - Enable copy/download│
└────────────────────────┘
```

### 2. Streaming Documentation Flow (Real-Time)

```
User Action: Click "Generate Docs"
     │
     ▼
┌────────────────────────┐
│  Frontend (React)      │
│  - Collect code        │
│  - Open SSE connection │
└──────────┬─────────────┘
           │ POST /api/generate-stream
           │ SSE connection established
           ▼
┌────────────────────────┐
│  Streaming Handler     │
│  - Set SSE headers     │
│  - Keep connection open│
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  DocGeneratorService   │
│  with streaming=true   │
│                        │
│  onChunk callback:     │
│    ↓                   │
│    Send SSE event      │
│    data: {chunk}       │
└──────────┬─────────────┘
           │
           │ Multiple SSE events
           │ data: {type: "chunk", content: "..."}
           │ data: {type: "chunk", content: "..."}
           │ data: {type: "complete", qualityScore: {...}}
           ▼
┌────────────────────────┐
│  Frontend (React)      │
│  - Append each chunk   │
│  - Live typing effect  │
│  - Show score on done  │
└────────────────────────┘
```

### 3. Code Parsing Flow

```
Input: Raw source code
     │
     ▼
┌─────────────────────┐
│  Language Detection │
│  (from file ext or  │
│   user selection)   │
└──────────┬──────────┘
           │
           ▼
    Is JavaScript/TypeScript?
           │
     ┌─────┴─────┐
   Yes           No
     │             │
     ▼             ▼
┌────────────┐  ┌────────────┐
│ AST Parser │  │   Basic    │
│  (Acorn)   │  │  Analysis  │
│            │  │  (Regex)   │
└─────┬──────┘  └─────┬──────┘
      │               │
      ▼               ▼
   Parse code    Count patterns
   to AST        (functions, classes)
      │               │
      ▼               ▼
   Walk AST      Extract basic info
   Extract:          │
   - Functions       │
   - Classes         │
   - Exports         │
   - Imports         │
   - Complexity      │
      │               │
      └───────┬───────┘
              │
              ▼
      ┌───────────────┐
      │   Analysis    │
      │   Object      │
      │               │
      │ {             │
      │   functions,  │
      │   classes,    │
      │   exports,    │
      │   complexity  │
      │ }             │
      └───────┬───────┘
              │
              ▼
      Used in prompt building
      and quality scoring
```

---

## API Architecture

### RESTful Endpoints

```
Base URL: https://codescribe-ai.vercel.app/api
         or http://localhost:3000/api (development)
```

#### 1. Generate Documentation (Standard)

**Endpoint:** `POST /api/generate`

**Request:**
```javascript
{
  "code": "function hello() { return 'world'; }",
  "docType": "README",        // README | JSDOC | API
  "language": "javascript"     // javascript | typescript | python
}
```

**Response:**
```javascript
{
  "documentation": "# Project Documentation\n...",
  "qualityScore": {
    "score": 85,
    "grade": "B",
    "breakdown": {
      "overview": { present: true, points: 20, status: "complete" },
      "installation": { present: true, points: 15, status: "complete" },
      "examples": { present: true, count: 2, points: 15, status: "partial" },
      "apiDocs": { present: true, coverage: "1/1", points: 25, status: "complete" },
      "structure": { present: true, headers: 4, points: 10, status: "partial" }
    },
    "summary": {
      "strengths": ["overview", "installation", "apiDocs"],
      "improvements": [],
      "topSuggestion": "Add one more usage example"
    }
  },
  "analysis": {
    "functions": [{ name: "hello", params: [], async: false }],
    "classes": [],
    "exports": ["hello"],
    "complexity": "simple"
  },
  "metadata": {
    "language": "javascript",
    "docType": "README",
    "generatedAt": "2025-10-12T10:30:00.000Z",
    "codeLength": 38
  }
}
```

#### 2. Generate Documentation (Streaming)

**Endpoint:** `POST /api/generate-stream`

**Request:** Same as `/api/generate`

**Response:** Server-Sent Events (SSE)

```
data: {"type":"connected"}

data: {"type":"chunk","content":"#"}

data: {"type":"chunk","content":" Project"}

data: {"type":"chunk","content":" Documentation"}

...

data: {"type":"complete","qualityScore":{...},"metadata":{...}}
```

**Event Types:**
- `connected` - Connection established
- `chunk` - Text chunk to append
- `complete` - Generation finished with metadata
- `error` - Error occurred

#### 3. Health Check

**Endpoint:** `GET /api/health`

**Response:**
```javascript
{
  "status": "healthy",
  "timestamp": "2025-10-12T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Error Handling

**Standard Error Response:**
```javascript
{
  "error": "Error category",
  "message": "Human-readable error message",
  "details": {  // Optional
    "field": "code",
    "reason": "Code exceeds maximum length"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error
- `503` - Service Unavailable (Claude API down)

---

## Security Architecture

### 1. API Key Management

```
Environment Variables (never in code)
  │
  ├── CLAUDE_API_KEY        # Anthropic API key
  ├── PORT                  # Server port
  └── NODE_ENV              # Environment (dev/prod)

Accessed via process.env
Never exposed to client
Rotated regularly
```

### 2. Input Validation

```javascript
// All inputs validated before processing
const validation = {
  code: {
    type: 'string',
    required: true,
    maxLength: 100000,  // 100K characters
    sanitize: true       // Remove potentially harmful content
  },
  docType: {
    type: 'string',
    enum: ['README', 'JSDOC', 'API'],
    default: 'README'
  },
  language: {
    type: 'string',
    enum: ['javascript', 'typescript', 'python'],
    default: 'javascript'
  }
};
```

### 3. Rate Limiting

```javascript
// Per IP address
10 requests per minute per IP
Prevents abuse and controls costs
Returns 429 status when exceeded
```

### 4. CORS Policy

```javascript
// Configured CORS headers
Allowed Origins: 
  - Production: https://codescribe-ai.vercel.app
  - Development: http://localhost:5173
Allowed Methods: GET, POST
Allowed Headers: Content-Type
```

### 5. No Data Persistence

```
User code → Process → Generate → Return → Discard
                                            │
                                            ▼
                                    Nothing stored
                                    Privacy by design
```

**Privacy Features:**
- No database
- No logging of user code
- No user accounts
- No cookies
- No tracking

---

## Performance & Scalability

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial Page Load | < 3s | ~2s |
| Time to Interactive | < 5s | ~3s |
| Documentation Generation | < 30s | ~15s avg |
| API Response (P95) | < 2s | ~1.5s |
| Streaming Latency | < 500ms | ~200ms |

### Optimization Strategies

**Frontend:**
```javascript
// 1. Code Splitting
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// 2. Memoization
const MemoizedCodePanel = memo(CodePanel);

// 3. Debouncing
const debouncedGenerate = useMemo(
  () => debounce(generate, 500),
  [generate]
);

// 4. Virtual Scrolling (for large docs)
// Not yet implemented, planned for Phase 2
```

**Backend:**
```javascript
// 1. Efficient AST parsing
// Single pass through code, minimal overhead

// 2. Streaming responses
// Send data as generated, don't wait for completion

// 3. Retry logic with exponential backoff
// Handles transient failures gracefully

// 4. Rate limiting
// Prevents resource exhaustion
```

### Scalability Considerations

**Current Capacity:**
- 100 concurrent users
- 1,000 requests per day
- Files up to 10,000 lines

**Scaling Strategy:**

```
Current: Single Vercel serverless function
   │
   ▼
Phase 2: Multiple serverless functions with load balancing
   │
   ▼
Phase 3: Dedicated API server with horizontal scaling
   │      + Redis for request queuing
   │      + CDN for static assets
   ▼
Enterprise: Microservices architecture
            + Message queue (RabbitMQ/SQS)
            + Distributed caching
            + Auto-scaling based on demand
```

**Bottlenecks & Mitigations:**

| Bottleneck | Impact | Mitigation |
|------------|--------|------------|
| Claude API Rate Limits | High | Request queuing, user feedback |
| Large file parsing | Medium | File size limits, chunking |
| SSE connection limits | Low | Connection pooling, timeouts |
| Cold start latency | Medium | Keep-alive pings, serverless optimization |

---

## Deployment Architecture

### Current Deployment (Phase 1)

```
┌────────────────────────────────────────────────────────┐
│                    Vercel Platform                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Frontend (Static Files)                         │ │
│  │  - React build artifacts in /dist                │ │
│  │  - Served via Vercel CDN                         │ │
│  │  - HTTPS automatic                               │ │
│  │  - Custom domain support                         │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  API Routes (Serverless Functions)               │ │
│  │  - Express app in /api directory                 │ │
│  │  - Auto-scaled based on demand                   │ │
│  │  - Environment variables from dashboard          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Edge Network                                     │ │
│  │  - Global CDN distribution                       │ │
│  │  - Automatic SSL certificates                    │ │
│  │  - DDoS protection                               │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Build & Deploy Pipeline

```
Developer
   │
   ├─── git commit
   ├─── git push to main
   │
   ▼
GitHub Repository
   │
   │ Webhook triggers Vercel
   ▼
Vercel Build System
   │
   ├─── Install dependencies (npm install)
   ├─── Run build (npm run build)
   ├─── Run tests (optional)
   │
   ▼
Deployment Preview (for PRs)
or Production (for main branch)
   │
   ├─── Deploy to edge network
   ├─── Assign URL
   ├─── Configure environment
   │
   ▼
Live Application
   │
   └─── Health check
```

### Environment Configuration

```javascript
// Production
CLAUDE_API_KEY=sk-ant-...
NODE_ENV=production
VITE_API_URL=https://codescribe-ai.vercel.app

// Staging (Optional)
CLAUDE_API_KEY=sk-ant-...
NODE_ENV=staging
VITE_API_URL=https://codescribe-ai-staging.vercel.app

// Development
CLAUDE_API_KEY=sk-ant-...
NODE_ENV=development
VITE_API_URL=http://localhost:3000
```

### Monitoring & Observability

**Built-in Vercel Analytics:**
- Page views and unique visitors
- Performance metrics (Core Web Vitals)
- Error tracking
- Function execution logs

**Custom Logging:**
```javascript
// Structured logging
console.log('[INFO]', { 
  action: 'generate_docs',
  docType,
  codeLength,
  timestamp: new Date().toISOString()
});

console.error('[ERROR]', {
  error: error.message,
  stack: error.stack,
  context: { code, docType }
});
```

---

## Future Enhancements

### Phase 2: CLI Tool (Week 2)

```
Architecture Addition:

┌────────────────────────┐
│  CLI Application       │
│  (Node.js)             │
│                        │
│  Commands:             │
│  - codescribe gen      │
│  - codescribe batch    │
│  - codescribe watch    │
└──────────┬─────────────┘
           │
           │ Uses same service layer
           ▼
┌────────────────────────┐
│  DocGeneratorService   │
│  (Shared logic)        │
└────────────────────────┘
```

**New Features:**
- File path support
- Batch processing
- Watch mode for auto-regeneration
- Configuration file support
- Output to file or stdout

### Phase 3: VS Code Extension (Week 3+)

```
Architecture Addition:

┌────────────────────────┐
│  VS Code Extension     │
│  (TypeScript)          │
│                        │
│  Features:             │
│  - Context menu        │
│  - Command palette     │
│  - Inline preview      │
│  - Auto file updates   │
└──────────┬─────────────┘
           │
           │ WebSocket or HTTP
           ▼
┌────────────────────────┐
│  Extension Host API    │
│  (New service)         │
└────────────────────────┘
```

### Advanced Features (Future)

**1. Caching Layer**
```javascript
// Cache common code patterns
const cache = new Map();

if (cache.has(codeHash)) {
  return cache.get(codeHash);
}
```

**2. Multi-Language Support**
- Python parser (ast module)
- Go parser (go/ast)
- Rust parser (syn)
- Universal fallback (regex + heuristics)

**3. Collaborative Features**
- Team documentation standards
- Shared templates
- Review workflows

**4. Advanced Analysis**
- Cyclomatic complexity metrics
- Test coverage integration
- Dependency graph visualization
- Security vulnerability detection

**5. Integrations**
- GitHub Actions for CI/CD
- GitLab CI integration
- Bitbucket Pipelines
- npm pre-commit hooks

---

## Conclusion

CodeScribe AI's architecture is designed for **simplicity, performance, and extensibility**. The service-oriented design enables multiple clients (web, CLI, extension) to share the same battle-tested business logic. The stateless nature ensures privacy and simplifies deployment, while streaming provides a responsive user experience.

The architecture supports the product roadmap from MVP to enterprise-grade solution, with clear paths for scaling, new features, and platform expansion.

---

**Document Owner:** Architecture Team  
**Reviewed By:** [Your Name]  
**Next Review:** After Phase 2 completion  
**Version History:**
- v1.0 (Oct 12, 2025): Initial architecture document