# CodeScribe AI - System Architecture

> **Quick Visual Reference:** This document provides an interactive Mermaid diagram and high-level architecture overview.
> **For Deep Technical Details:** See [ARCHITECTURE.md](ARCHITECTURE.md) for comprehensive architecture documentation including security, performance, scalability, and deployment strategies.

This diagram shows the complete system architecture for CodeScribe AI across all planned phases.

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#faf5ff','primaryTextColor':'#1f2937','primaryBorderColor':'#9333ea','lineColor':'#64748b','secondaryColor':'#ecfeff','tertiaryColor':'#fff7ed','clusterBkg':'#fafafa','clusterBorder':'#9333ea'}}}%%
graph TB
    subgraph client ["Client Layer"]
        Browser[Web Browser]
        CLI[CLI Tool<br/>Phase 2]
        VSCode[VS Code Extension<br/>Phase 3]
    end

    subgraph frontend ["Frontend - React Application"]
        App[App.jsx<br/>Main Component]
        Header[Header Component<br/>Logo, Nav, Menu]
        ControlBar[Control Bar<br/>Upload, GitHub, Generate]
        CodePanel[Code Panel<br/>Monaco Editor]
        DocPanel[Doc Panel<br/>Markdown Renderer]
        QualityScore[Quality Score<br/>Badge & Suggestions]
        
        App --> Header
        App --> ControlBar
        App --> CodePanel
        App --> DocPanel
        DocPanel --> QualityScore
    end

    subgraph api ["API Layer - Express Server"]
        Router[API Router]
        GenerateRoute[POST /api/generate]
        StreamRoute[POST /api/generate-stream<br/>SSE]
        UploadRoute[POST /api/upload]
        HealthRoute[GET /api/health]
        
        Router --> GenerateRoute
        Router --> StreamRoute
        Router --> UploadRoute
        Router --> HealthRoute
    end

    subgraph services ["Service Layer"]
        DocGen[DocGeneratorService<br/>Core Logic]
        ClaudeClient[ClaudeClient<br/>API Wrapper]
        CodeParser[CodeParser<br/>AST Analysis]
        QualityScorer[QualityScorer<br/>Scoring Algorithm]
        
        GenerateRoute --> DocGen
        StreamRoute --> DocGen
        DocGen --> ClaudeClient
        DocGen --> CodeParser
        DocGen --> QualityScorer
    end

    subgraph external ["External Services"]
        Claude[Claude API<br/>Anthropic]
        Claude --> ClaudeClient
    end

    subgraph infra ["Infrastructure"]
        Vercel[Vercel<br/>Hosting & CDN]
        Analytics[Vercel Analytics]
        Env[Environment Variables<br/>CLAUDE_API_KEY]
    end

    Browser --> App
    CLI -.-> Router
    VSCode -.-> Router
    
    ControlBar --> |User Action| Router
    Router --> |JSON Response| DocPanel
    StreamRoute --> |SSE Stream| DocPanel
    
    App --> Vercel
    Vercel --> Analytics
    Router --> Env

    style Browser fill:#e9d5ff,stroke:#9333ea,stroke-width:2px
    style CLI fill:#fae8ff,stroke:#c026d3,stroke-width:2px
    style VSCode fill:#fae8ff,stroke:#c026d3,stroke-width:2px
    style App fill:#c084fc,stroke:#9333ea,stroke-width:2px
    style Header fill:#e9d5ff,stroke:#9333ea
    style ControlBar fill:#e9d5ff,stroke:#9333ea
    style CodePanel fill:#e9d5ff,stroke:#9333ea
    style DocPanel fill:#e9d5ff,stroke:#9333ea
    style QualityScore fill:#e9d5ff,stroke:#9333ea
    style Router fill:#cbd5e1,stroke:#475569,stroke-width:2px
    style GenerateRoute fill:#e2e8f0,stroke:#64748b
    style StreamRoute fill:#e2e8f0,stroke:#64748b
    style UploadRoute fill:#e2e8f0,stroke:#64748b
    style HealthRoute fill:#e2e8f0,stroke:#64748b
    style DocGen fill:#c7d2fe,stroke:#4338ca,stroke-width:2px
    style ClaudeClient fill:#e0e7ff,stroke:#4f46e5
    style CodeParser fill:#e0e7ff,stroke:#4f46e5
    style QualityScorer fill:#e0e7ff,stroke:#4f46e5
    style Claude fill:#fbbf24,stroke:#ca8a04,stroke-width:2px
    style Vercel fill:#86efac,stroke:#16a34a,stroke-width:2px
    style Analytics fill:#bbf7d0,stroke:#22c55e
    style Env fill:#bbf7d0,stroke:#22c55e

    classDef phase2 stroke-dasharray: 5 5
    classDef phase3 stroke-dasharray: 5 5
    class CLI phase2
    class VSCode phase3
```

### Legend

**Color Coding by Layer:**

| Color | Layer | Purpose | Design System |
|-------|-------|---------|---------------|
| 🟣 **Purple** | Client & Frontend | User-facing components and interfaces | Primary brand color |
| ⚪ **Slate Gray** | API Layer | Backend routing and request handling | Neutral palette |
| 🔵 **Indigo** | Service Layer | Core business logic and processing | Secondary brand color |
| 🟡 **Yellow** | External Services | Third-party APIs and external dependencies | Warning/dependency color |
| 🟢 **Green** | Infrastructure | Hosting, deployment, and environment | Success/production color |

**Visual Indicators:**
- **Solid border** = Phase 1 (Current MVP)
- **Dashed border** = Future phases (CLI in Phase 2, VS Code Extension in Phase 3)
- **Thicker borders** = Primary components in each layer

---

## Architecture Overview

### Client Layer
- **Web Browser**: Primary interface for Phase 1 (MVP)
- **CLI Tool**: Command-line interface (Phase 2)
- **VS Code Extension**: IDE integration (Phase 3)

### Frontend (React Application)
- **App.jsx**: Main application component and state management
- **Header**: Branding and navigation
- **Control Bar**: File upload, GitHub integration, and generation controls
- **Code Panel**: Monaco editor for code input
- **Doc Panel**: Markdown renderer for generated documentation
- **Quality Score**: Visual scoring with improvement suggestions

### API Layer (Express Server)
- **POST /api/generate**: Standard documentation generation endpoint
- **POST /api/generate-stream**: Server-Sent Events (SSE) streaming endpoint
- **POST /api/upload**: File upload handling
- **GET /api/health**: Health check endpoint

### Service Layer
- **DocGeneratorService**: Core orchestration logic for documentation generation
- **ClaudeClient**: Wrapper for Anthropic Claude API with retry logic
- **CodeParser**: AST-based code analysis using Acorn
- **QualityScorer**: Documentation quality assessment algorithm

### External Services
- **Claude API**: Anthropic's Claude Sonnet 4.5 for AI generation

### Infrastructure
- **Vercel**: Hosting platform with CDN
- **Vercel Analytics**: Usage tracking and performance monitoring
- **Environment Variables**: Secure configuration management (API keys, etc.)

## Data Flow

1. User inputs code via browser → React App
2. User triggers generation → API request to Express server
3. Server routes request → DocGeneratorService
4. DocGenerator orchestrates:
   - CodeParser extracts structure (functions, classes, exports)
   - ClaudeClient sends enriched prompt to Claude API
   - Claude streams response back through SSE
   - QualityScorer analyzes generated documentation
5. Documentation and quality score → Frontend for display

## Technology Stack

**Frontend**: React 18, Vite, Tailwind CSS, Monaco Editor, react-markdown
**Backend**: Node.js, Express, Anthropic SDK, Acorn (AST parser)
**Infrastructure**: Vercel, Server-Sent Events (SSE)
**AI**: Claude Sonnet 4.5 (claude-sonnet-4-20250514)