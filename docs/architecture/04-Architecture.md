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