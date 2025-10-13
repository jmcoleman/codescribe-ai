# CodeScribe AI - System Architecture

> **Quick Visual Reference:** This document provides an interactive Mermaid diagram and high-level architecture overview.
> **For Deep Technical Details:** See [ARCHITECTURE.md](ARCHITECTURE.md) for comprehensive architecture documentation including security, performance, scalability, and deployment strategies.

This diagram shows the complete system architecture for CodeScribe AI across all planned phases.

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        CLI[CLI Tool<br/>Phase 2]
        VSCode[VS Code Extension<br/>Phase 3]
    end

    subgraph "Frontend - React Application"
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

    subgraph "API Layer - Express Server"
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

    subgraph "Service Layer"
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

    subgraph "External Services"
        Claude[Claude API<br/>Anthropic]
        Claude --> ClaudeClient
    end

    subgraph "Infrastructure"
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
    
    style Browser fill:#e1f5ff
    style CLI fill:#fff4e1
    style VSCode fill:#fff4e1
    style App fill:#f0e6ff
    style DocGen fill:#e6f7ff
    style Claude fill:#ffe6e6
    style Vercel fill:#e6ffe6
    
    classDef phase2 stroke-dasharray: 5 5
    classDef phase3 stroke-dasharray: 5 5
    class CLI phase2
    class VSCode phase3
```

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