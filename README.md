# CodeScribe AI

**Intelligent Code Documentation Generator**

Transform code into comprehensive, professional documentation in seconds using AI. CodeScribe AI analyzes your code and generates README files, JSDoc comments, API documentation, and architecture overviews with real-time streaming and quality scoring.

> **Portfolio Project** by Jenni Coleman - Showcasing full-stack development, AI integration, and modern UX design
>
> 🔗 [Live Demo](#) | 📖 [Documentation](docs/) | 🎨 [Design System](docs/planning/07-Figma-Guide.md)

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Quick Start](#quick-start)
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
│   └── architecture/              # System architecture
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

### ♿ Accessibility
- **WCAG 2.1 AA Compliant**: Full keyboard navigation, ARIA labels, screen reader support
- **Motion Preferences**: Respects `prefers-reduced-motion` for animations
- **Color Contrast**: All text meets WCAG AA standards for readability
- **Focus Management**: Clear focus indicators and logical tab order

## Screenshots

_Screenshots coming soon - application is currently in development_

**Key Features to Showcase:**
- 📝 Monaco code editor with syntax highlighting
- ✨ Real-time documentation streaming
- 📊 Quality score breakdown modal
- 📱 Responsive mobile layout
- 🎨 Toast notification system
- 📈 Mermaid diagram rendering
- ⚠️ Error handling with inline banners

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
  - [04-Architecture.md](docs/architecture/04-Architecture.md) - System architecture diagram (Mermaid)
  - [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Deep architecture overview

### Component Guides
- [docs/components/](docs/components/) - Component-specific documentation
  - [TOAST-SYSTEM.md](docs/components/TOAST-SYSTEM.md) - Toast notification system guide
  - [MERMAID-DIAGRAMS.md](docs/components/MERMAID-DIAGRAMS.md) - Mermaid diagram developer guide
  - [ERROR-HANDLING-UX.md](docs/components/ERROR-HANDLING-UX.md) - Error handling UX design guide
  - [COPYBUTTON.md](docs/components/COPYBUTTON.md) - Copy button component guide
  - [SKELETON-LOADER.md](docs/components/SKELETON-LOADER.md) - Loading skeleton patterns

### Design Assets
- [docs/design/](docs/design/) - Brand colors and design resources
  - [brand-color-palette.html](docs/design/brand-color-palette.html) - Interactive color palette
  - [brand-color-palette.pdf](docs/design/brand-color-palette.pdf) - PDF version for sharing

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

### Backend
- **Node.js 20+** - JavaScript runtime
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

### 📊 Testing & Quality

**Comprehensive Test Coverage**
- Frontend: Vitest + React Testing Library
- Backend: Jest + Supertest
- Unit tests for all services and utilities
- Component tests with accessibility checks
- Integration tests for API endpoints

**Running Tests:**
```bash
# Frontend tests
cd client
npm test              # Run tests once
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report

# Backend tests
cd server
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Development Status

**Current Phase:** Phase 1 - Web Application (MVP)
**Timeline:** 5-7 days to production

**Completed:**
- ✅ Project documentation and planning (8 comprehensive docs)
- ✅ Backend API implementation (4 endpoints)
- ✅ Claude API integration with streaming support
- ✅ Code parser with AST analysis (Acorn)
- ✅ Quality scoring algorithm (5 criteria, 100-point scale)
- ✅ React frontend with Monaco Editor
- ✅ Responsive UI design (mobile, tablet, desktop)
- ✅ Real-time streaming with Server-Sent Events
- ✅ File upload with validation (10+ file types)
- ✅ Toast notification system (20+ variants)
- ✅ Mermaid diagram rendering in documentation
- ✅ Copy-to-clipboard functionality
- ✅ Error handling with inline banners
- ✅ Rate limiting with visual indicators
- ✅ Help system with examples modal
- ✅ Comprehensive test suites (Jest + Vitest)
- ✅ Accessibility features (WCAG 2.1 AA)

**Planned (Future Phases):**
- Phase 2: CLI tool for terminal usage
- Phase 3: VS Code extension for IDE integration
- Phase 4: Optional enhancements (see [01-PRD.md](docs/planning/01-PRD.md))

## Contributing

This is a portfolio project demonstrating full-stack development skills. Issues and suggestions are welcome!

## License

MIT

## Author

**Jenni Coleman** - Full-Stack Developer & UX Designer

Built as a portfolio project (5-7 days) to showcase:

### Technical Skills
- **Full-Stack Development**: React 19, Node.js, Express, RESTful APIs
- **AI Integration**: Anthropic Claude API with streaming (SSE)
- **Code Analysis**: AST parsing with Acorn for intelligent extraction
- **Modern Frontend**: Vite, Tailwind CSS, Monaco Editor, Mermaid.js
- **Testing**: Comprehensive test suites (Jest, Vitest, Testing Library)
- **UX Design**: Research-based patterns, accessibility (WCAG 2.1 AA)

### Project Management
- Comprehensive planning documentation (PRD, epics, user stories)
- Day-by-day implementation tracking
- Architecture design with Mermaid diagrams
- Complete API specifications
- Design system with brand guidelines

### Highlights
- ⚡ **Real-time streaming** with character-by-character generation
- 🎨 **Enterprise UX patterns** (toast system, error handling, loading states)
- ♿ **Accessibility-first** design with keyboard navigation and screen readers
- 📊 **Quality algorithms** for documentation scoring
- 🧪 **Test-driven development** with comprehensive coverage

---

**For complete product documentation, see [01-PRD.md](docs/planning/01-PRD.md)**
**For technical deep dive, see [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)**
