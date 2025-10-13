# CodeScribe AI - Claude Context Reference

**Project:** CodeScribe AI - Intelligent Code Documentation Generator
**Current Phase:** Day 1 - Backend Setup
**Tech Stack:** React 18 + Vite, Node.js + Express, Claude API, Tailwind CSS, Monaco Editor
**Timeline:** 5-7 days to MVP
**Status:** In Development

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
- Release plan and timeline
- Out-of-scope items

**Key for:** Feature decisions, scope questions, acceptance criteria validation

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

### 🎨 Design & UX

#### [07-Figma-Guide.md](docs/planning/07-Figma-Guide.md) - Complete Figma Design Guide
**When to use:** UI/UX design, component specifications, visual design system

**Contains:**
- Complete design system:
  - Color palette (purple primary, indigo secondary, slate neutrals, semantic colors)
  - Typography styles (Inter + JetBrains Mono)
  - Shadow/effect styles
  - Spacing system (4px base unit)
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

**Key for:** UI implementation, styling decisions, component design, responsive behavior

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

### 🎤 Interview & Presentation

#### [06-InterviewGuide.md](docs/planning/06-InterviewGuide.md) - Interview Preparation Guide
**When to use:** Explaining the project to stakeholders, preparing for technical interviews

**Contains:**
- 30-second elevator pitch
- Core talking points:
  - Problem statement explanation
  - Technical stack justification
  - Architecture deep dive
  - Interesting technical challenges
  - Trade-offs and decisions
- Live demo script (90 seconds)
- Anticipated Q&A:
  - Technical questions (rate limiting, security, React structure, why not Next.js)
  - Product questions (target audience, monetization, differentiation)
  - Process questions (time management, what to do differently)
- Key messages to emphasize
- What NOT to say
- LinkedIn post template
- Closing statements

**Key for:** Articulating technical decisions, demo presentations, interview preparation

---

### 🎨 Design Assets

#### [brand-color-palette.html](docs/design/brand-color-palette.html) - Interactive Brand Color Palette
**When to use:** Visual reference for brand colors, sharing with designers/developers

**Contains:**
- 27 colors across 6 families (Purple, Indigo, Slate, Green, Yellow, Red)
- Click-to-copy hex codes for each color
- Usage guidelines for each color family
- Accessibility information (WCAG AA compliance)
- Examples for buttons, alerts, text, backgrounds

**Key for:** Color selection, design consistency, developer implementation, accessibility verification

**How to open:**
```bash
open docs/design/brand-color-palette.html
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

## 🔑 Key Technical Details

### Tech Stack
**Frontend:**
- React 18 with Vite
- Tailwind CSS 3.4+
- Monaco Editor (@monaco-editor/react)
- react-markdown
- Lucide React (icons)

**Backend:**
- Node.js 20+
- Express 4.18+
- Anthropic Claude API (Sonnet 4.5: claude-sonnet-4-20250514)
- Acorn (JavaScript AST parsing)
- Multer (file uploads)

**Infrastructure:**
- Vercel (hosting)
- Server-Sent Events (streaming)
- Environment variables for secrets

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
│   │   ├── 06-InterviewGuide.md
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
│   ├── design/                   # Design assets
│   │   └── brand-color-palette.html  # Interactive color palette
│   └── CONTEXT.md                # Quick reference
├── .gitignore
├── README.md                      # Main project README
└── CLAUDE.md                      # This file
```

### Core Services (Backend)
1. **claudeClient.js** - Handles Claude API communication, streaming, retries
2. **docGenerator.js** - Core service generating docs, builds prompts, orchestrates
3. **codeParser.js** - Parses code to AST, extracts functions/classes/exports
4. **qualityScorer.js** - Scores documentation on 5 criteria (0-100 scale)

### Documentation Types Supported
1. **README.md** - Comprehensive project documentation
2. **JSDoc** - Inline code comments with @param/@returns/@example
3. **API** - Endpoint/function documentation
4. **ARCHITECTURE** - System design overview (future)

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
- **Design/UI** → Reference Figma Guide
- **Architecture** → Reference Architecture diagram
- **Current Tasks** → Reference Todo List
- **Explanation/Demo** → Reference Interview Guide

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

Always provide the most relevant reference for the question asked.

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

- **v1.4** (Current) - Expanded semantic colors for accessibility (fixed red contrast to WCAG AA, added background/button shades for green/yellow/red)
- **v1.3** - Added Indigo as secondary brand color to design system (purple primary + indigo secondary)
- **v1.2** - Clarified architecture document purposes: 04-Architecture.md (visual diagram + overview) vs ARCHITECTURE.md (deep technical dive)
- **v1.1** - Reorganized documentation structure (planning/, api/, architecture/ subdirectories)
- **v1.0** - Initial claude.md created with complete documentation map
- Documentation last updated: October 13, 2025

---

**For any questions about CodeScribe AI, start here and navigate to the appropriate detailed documentation.**
