# CodeScribe AI

**Intelligent Code Documentation Generator**

Transform code into comprehensive, professional documentation in seconds using AI. CodeScribe AI analyzes your code and generates README files, JSDoc comments, and API documentation with real-time streaming and quality scoring.

## Project Structure

```
codescribe-ai/
├── client/                        # Frontend (React + Vite)
│   ├── src/
│   └── package.json
├── server/                        # Backend (Node.js + Express)
│   ├── src/
│   │   ├── services/             # Core services (Claude API, parsers, etc.)
│   │   ├── routes/               # API routes
│   │   └── server.js
│   └── package.json
├── docs/                          # Documentation
│   ├── planning/                 # Product & development docs
│   ├── api/                      # API documentation
│   ├── architecture/             # System architecture
│   └── CONTEXT.md
├── package.json                   # Root package.json (workspaces)
└── README.md
```

## Features

- **Multiple Documentation Types**: Generate README.md, JSDoc/TSDoc comments, and API documentation
- **Real-Time Streaming**: Watch documentation generate character-by-character using Server-Sent Events
- **Quality Scoring**: Get actionable feedback on documentation completeness (0-100 scale with letter grades)
- **Code Analysis**: AST-based parsing extracts functions, classes, and exports automatically
- **Monaco Editor**: Professional in-browser code editing with syntax highlighting
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Quick Start

### Prerequisites
- Node.js 20+
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
   ```

   Create a `.env` file in the `client/` directory (optional, defaults shown):
   ```bash
   # client/.env
   VITE_API_URL=http://localhost:3000
   ```

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

## Documentation

Comprehensive documentation is organized in the [docs/](docs/) folder:

### Planning & Development
- [docs/planning/](docs/planning/) - Product requirements, epics, dev guide, interview prep
  - [01-PRD.md](docs/planning/01-PRD.md) - Product Requirements Document
  - [02-Epics-Stories.md](docs/planning/02-Epics-Stories.md) - User stories and acceptance criteria
  - [03-Todo-List.md](docs/planning/03-Todo-List.md) - Day-by-day implementation tasks
  - [05-Dev-Guide.md](docs/planning/05-Dev-Guide.md) - Complete development guide with code examples
  - [06-InterviewGuide.md](docs/planning/06-InterviewGuide.md) - Interview preparation & talking points
  - [07-Figma-Guide.md](docs/planning/07-Figma-Guide.md) - Complete UI/UX design system
  - [08-Master-Prompt.md](docs/planning/08-Master-Prompt.md) - Master implementation guide

### API Documentation
- [docs/api/](docs/api/) - API specifications and examples
  - [README.md](docs/api/README.md) - API quick start guide
  - [API-Reference.md](docs/api/API-Reference.md) - Complete endpoint specifications

### Architecture
- [docs/architecture/](docs/architecture/) - System design and architecture
  - [04-Architecture.md](docs/architecture/04-Architecture.md) - System architecture diagram
  - [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Architecture overview

### Quick Reference
- [CLAUDE.md](CLAUDE.md) - Complete documentation map and project context
- [docs/CONTEXT.md](docs/CONTEXT.md) - Quick project reference

## Tech Stack

### Frontend
- **React 19** - Modern UI library with latest features
- **Vite 7** - Lightning-fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Monaco Editor** - VS Code's editor in the browser
- **react-markdown** - Safe markdown rendering
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js 20+** - JavaScript runtime
- **Express 5** - Minimalist web framework
- **Anthropic Claude API** - Claude Sonnet 4.5 for AI generation
- **Acorn** - JavaScript AST parser
- **Multer** - File upload middleware

### Architecture
- **Server-Sent Events (SSE)** - Real-time streaming
- **RESTful API** - Standard HTTP endpoints
- **Service Layer Pattern** - Clean separation of concerns
- **No Database** - Stateless, privacy-focused design

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

## Development Status

**Current Phase:** Phase 1 - Web Application (MVP)
**Timeline:** 5-7 days to production

**Completed:**
- Project documentation and planning
- Backend API implementation
- Claude API integration
- Code parser (AST analysis)
- Quality scoring algorithm
- React frontend with Monaco Editor
- Responsive UI design
- Real-time streaming

**Planned (Future Phases):**
- Phase 2: CLI tool for terminal usage
- Phase 3: VS Code extension for IDE integration

## Contributing

This is a portfolio project demonstrating full-stack development skills. Issues and suggestions are welcome!

## License

ISC

## Author

Built as a portfolio project showcasing:
- Full-stack JavaScript development (React + Node.js)
- AI integration (Anthropic Claude API)
- Real-time streaming (Server-Sent Events)
- Code analysis (AST parsing)
- Quality algorithms
- Modern UX design

---

**For detailed documentation, see [CLAUDE.md](CLAUDE.md) - Complete project reference and documentation map.**
