# CodeScribe AI - Master Implementation Prompt

**Version:** 1.0  
**Created:** October 11, 2025  
**Purpose:** Complete guide for building CodeScribe AI portfolio project  

---

## 📦 Package Overview

This document synthesizes everything discussed across our conversation into a single, actionable implementation guide. Use this as your source of truth while building.

---

## 🎯 Project Summary

**Name:** CodeScribe AI  
**Tagline:** Intelligent Code Documentation Generator  
**Timeline:** 5-7 days  
**Goal:** Portfolio-ready full-stack application demonstrating technical excellence  

**What it does:**
Analyzes code and generates comprehensive documentation (README, JSDoc, API docs) with real-time streaming and quality scoring to help developers improve their documentation.

**Why it matters:**
- Solves real problem (developers spend 20% of time on docs)
- Demonstrates full-stack skills
- Shows AI integration capability
- Exhibits product thinking
- Portfolio piece for job interviews

---

## 🏗️ Architecture at a Glance

```
User → React Frontend (Vite + Tailwind) → Express API → Claude API
                ↓                              ↓
          Monaco Editor                 Code Parser
          Doc Renderer                  Quality Scorer
```

**Key Design Principles:**
1. API-first (scales to CLI and VS Code extension)
2. Streaming-first (better UX)
3. Quality-focused (scoring + suggestions)
4. Privacy-conscious (no code storage)
5. Fast iteration (ship in 5 days)

---

## 📋 Phase Breakdown

### Phase 1: Web Application (Days 1-5) ← **START HERE**
Core MVP with all essential features

### Phase 2: CLI Tool (Days 6-7)
Command-line interface using same API

### Phase 3: VS Code Extension (Week 2+)
Deep editor integration

**This guide focuses on Phase 1.**

---

## 🗂️ Project Structure (Copy This Exactly)

```
codescribe-ai/
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── MobileMenu.jsx
│   │   │   ├── ControlBar.jsx
│   │   │   ├── CodePanel.jsx
│   │   │   ├── DocPanel.jsx
│   │   │   └── QualityScore.jsx
│   │   ├── hooks/
│   │   │   └── useDocGeneration.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── constants/
│   │   │   └── examples.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
├── server/                        # Node.js backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── docGenerator.js
│   │   │   ├── claudeClient.js
│   │   │   ├── codeParser.js
│   │   │   └── qualityScorer.js
│   │   ├── routes/
│   │   │   └── api.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── server.js
│   ├── .env
│   └── package.json
├── docs/
│   ├── API.md
│   └── ARCHITECTURE.md
└── README.md
```

---

## 🚀 Day-by-Day Implementation Plan

### DAY 1: Foundation (Backend + API)

**Morning (4 hours):**

1. **Project Setup**
```bash
# Create repo
mkdir codescribe-ai && cd codescribe-ai
git init

# Backend
mkdir server && cd server
npm init -y
npm install express cors dotenv @anthropic-ai/sdk acorn
npm install --save-dev nodemon

# Frontend
cd ..
npm create vite@latest client -- --template react
cd client
npm install
npm install -D tailwindcss postcss autoprefixer
npm install tailwindcss @tailwindcss/vite
# npx tailwindcss init -p (removed, replaced with @import "tailwindcss" in css; also added the line above)
npm install @monaco-editor/react react-markdown lucide-react
```

2. **Create .env file**
```
CLAUDE_API_KEY=your_key_here
PORT=3000
NODE_ENV=development
```

3. **Implement Claude Client** (see Development Guide artifact for full code)
   - `server/src/services/claudeClient.js`
   - Methods: `generate()`, `generateWithStreaming()`
   - Retry logic with exponential backoff

4. **Create Doc Generator Service**
   - `server/src/services/docGenerator.js`
   - Method: `generateDocumentation()`
   - Prompts for README, JSDoc, API docs

**Afternoon (4 hours):**

5. **Set up API Routes**
   - `server/src/routes/api.js`
   - POST `/api/generate` (non-streaming)
   - POST `/api/generate-stream` (SSE)
   - GET `/api/health`

6. **Create Express Server**
```javascript
// server/src/server.js
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

7. **Test API with Postman**
   - Send POST to `/api/generate`
   - Verify Claude generates docs
   - Test streaming endpoint

**End of Day 1 Checkpoint:**
✅ Backend API functional
✅ Claude integration working
✅ Can generate documentation via API

---

### DAY 2: Core Features (Parsing + Scoring)

**Morning (4 hours):**

1. **Implement Code Parser**
   - `server/src/services/codeParser.js`
   - Use Acorn for JavaScript AST
   - Extract functions, classes, exports
   - Fallback to regex for other languages

2. **Implement Quality Scorer**
   - `server/src/services/qualityScorer.js`
   - 5 criteria scoring (see Development Guide)
   - Return breakdown with suggestions
   - Calculate letter grade

3. **Add File Upload Endpoint**
   - Install multer: `npm install multer`
   - POST `/api/upload`
   - Validate file type and size
   - Return file content

**Afternoon (4 hours):**

4. **Enhance Prompts**
   - Update `buildPrompt()` in docGenerator
   - Add code analysis context
   - Create templates for all 3 doc types

5. **Test All Doc Types**
   - README generation
   - JSDoc comments
   - API documentation
   - Verify quality scores accurate

6. **Basic Frontend Setup**
   - Create React App structure
   - Install dependencies
   - Configure Tailwind CSS

**End of Day 2 Checkpoint:**
✅ Code parser extracts structure
✅ Quality scorer working
✅ All 3 doc types generate correctly
✅ Frontend scaffolded

---

### DAY 3: UI Implementation

**Morning (4 hours):**

1. **Create Components**
   - Header.jsx (logo, nav, mobile menu)
   - ControlBar.jsx (upload, generate button, doc type selector)
   - CodePanel.jsx (Monaco Editor integration)
   - DocPanel.jsx (Markdown renderer)
   - QualityScore.jsx (score badge + breakdown)

2. **Integrate Monaco Editor**
   - Configure syntax highlighting
   - Set up themes
   - Handle file metadata display

3. **Create API Client Hook**
   - `client/src/hooks/useDocGeneration.js`
   - Handle streaming with fetch + ReadableStream
   - Manage state (loading, error, success)

**Afternoon (4 hours):**

4. **Implement Responsive Design**
   - Mobile: Stacked panels, hamburger menu
   - Tablet: Adjusted spacing
   - Desktop: Side-by-side panels
   - Test on 5 viewport sizes

5. **Add Quality Score Display**
   - Animated count-up effect
   - Color-coded badge
   - Expandable breakdown
   - Suggestions in footer

6. **Error Handling**
   - Display errors gracefully
   - Retry button
   - Loading states
   - Toast notifications (optional)

**End of Day 3 Checkpoint:**
✅ Full UI functional
✅ Streaming works end-to-end
✅ Quality score displays
✅ Responsive on all devices

---

### DAY 4: Polish & Testing

**Morning (4 hours):**

1. **Add Example Code Library**
   - Create `client/src/constants/examples.js`
   - 5 code samples:
     - Authentication service
     - REST API endpoint
     - React component
     - Utility functions
     - Data processing module
   - Add dropdown to ControlBar
   - Implement load example functionality

2. **Animations & Micro-interactions**
   - Button hover effects
   - Copy button animation (icon change)
   - Smooth transitions
   - Loading spinner during generation

3. **Copy/Download Features**
   - Copy documentation to clipboard
   - Download as .md file
   - Visual confirmation on copy

**Afternoon (4 hours):**

4. **Cross-Browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Document any issues
   - Fix critical bugs

5. **Performance Optimization**
   - Run Lighthouse audit
   - Optimize bundle size
   - Lazy load Monaco if needed
   - Add rate limiting to API

6. **Accessibility Audit**
   - Run axe DevTools
   - Fix color contrast issues
   - Add ARIA labels
   - Ensure keyboard navigation
   - Test with screen reader (if possible)

**End of Day 4 Checkpoint:**
✅ Examples load instantly
✅ Animations polished
✅ No critical bugs
✅ Performance good (Lighthouse >80)
✅ Accessible

---

### DAY 5: Deploy & Document

**Morning (4 hours):**

1. **Pre-Deployment**
   - Remove console.logs
   - Update API URLs for production
   - Test build locally
   - Fix any build errors

2. **Deploy to Vercel**
```bash
npm i -g vercel
vercel login
vercel
```

3. **Configure Environment Variables**
   - Add `CLAUDE_API_KEY` in Vercel dashboard
   - Set `NODE_ENV=production`
   - Verify deployment works

4. **Custom Domain** (optional)
   - Purchase domain
   - Configure DNS
   - Wait for SSL

**Afternoon (4 hours):**

5. **Write README.md**
   - Project overview
   - Features list (with emoji)
   - Tech stack
   - Architecture diagram (Mermaid - see Architecture artifact)
   - Screenshots (3-5 key screens)
   - Quick start guide
   - Setup instructions
   - API documentation link
   - Roadmap (Phase 2: CLI, Phase 3: Extension)
   - License (MIT)

6. **Create Demo Video**
   - Option A: Use Arcade.software (recommended)
   - Option B: Use Loom with script (see Interview Guide)
   - Option C: Use Guidde for AI voiceover
   - Record 2-minute walkthrough:
     - Landing page → Paste code → Select type → Generate → Show quality score
   - Upload to YouTube/Loom
   - Add captions
   - Embed in README

7. **Create Demo GIF**
   - Use ScreenToGif (Windows) or Gifski (Mac)
   - 10-second key interaction
   - Optimize to <5MB
   - Add to README header

8. **Final QA**
   - Test deployed app thoroughly
   - Check all links in README
   - Verify demo video works
   - Push all changes to GitHub

**End of Day 5 Checkpoint:**
✅ App live at public URL
✅ README comprehensive
✅ Demo video published
✅ All documentation complete
✅ Portfolio-ready! 🎉

---

## 💻 Essential Code Snippets

### Environment Variables (.env)

```bash
# Server
CLAUDE_API_KEY=sk-ant-your-key-here
PORT=3000
NODE_ENV=development

# Client (.env)
VITE_API_URL=http://localhost:3000
```

### Package.json Scripts

**Client (package.json):**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

**Server (package.json):**
```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

### Tailwind Configuration

```javascript
// client/tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#faf5ff',
          500: '#a855f7',
          600: '#9333ea',
        }
      }
    },
  },
  plugins: [],
}
```

### API Client

```javascript
// client/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function generateDocumentation(code, docType, language) {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, docType, language })
  });

  if (!response.ok) {
    throw new Error('Generation failed');
  }

  return response.json();
}
```

---

## 🎨 Design System (from Figma Guide)

### Colors

```javascript
// Primary
purple-500: #A855F7  // Main brand color
purple-600: #9333EA  // Hover states
purple-50: #FAF5FF   // Light backgrounds

// Neutrals
slate-50: #F8FAFC    // Page background
slate-100: #F1F5F9   // Light elements
slate-200: #E2E8F0   // Borders
slate-600: #475569   // Body text
slate-900: #0F172A   // Headings

// Semantic
green-600: #16A34A   // Success
yellow-600: #CA8A04  // Warning
red-400: #F87171     // Error
```

### Typography

```javascript
// Headings
text-xl: 20px, font-semibold    // Main title
text-lg: 18px, font-semibold    // Section headers

// Body
text-sm: 14px, regular          // Primary text
text-xs: 12px, regular          // Metadata

// Code
font-mono: JetBrains Mono, Consolas, monospace
```

### Spacing

```javascript
// Base unit: 4px
gap-2: 8px
gap-3: 12px
gap-4: 16px
gap-6: 24px
gap-8: 32px
```

### Breakpoints

```javascript
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
```

---

## 🧪 Testing Checklist

### Manual Testing

**Functionality:**
- [ ] Code input via paste works
- [ ] File upload works (.js, .jsx, .ts, .tsx)
- [ ] README generation works
- [ ] JSDoc generation works
- [ ] API docs generation works
- [ ] Streaming displays in real-time
- [ ] Quality score appears after completion
- [ ] Copy button copies to clipboard
- [ ] Download button saves .md file
- [ ] Examples load correctly
- [ ] All 5 examples generate good docs

**Error Handling:**
- [ ] Invalid file type shows error
- [ ] File too large shows error
- [ ] Network failure shows error
- [ ] API failure shows retry button
- [ ] Rate limit shows appropriate message

**Responsive Design:**
- [ ] Works on 375px (iPhone SE)
- [ ] Works on 768px (iPad)
- [ ] Works on 1024px (laptop)
- [ ] Works on 1440px (desktop)
- [ ] Mobile menu opens/closes
- [ ] Panels stack on mobile
- [ ] Touch targets are >44px

**Cross-Browser:**
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Performance:**
- [ ] Lighthouse score >80
- [ ] Initial load <3 seconds
- [ ] Time to interactive <5 seconds
- [ ] Generation completes <30 seconds
- [ ] No console errors in production

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Color contrast ratio ≥4.5:1
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Screen reader compatible (test if possible)

---

## 📚 Documentation Templates

### README.md Template

```markdown
# CodeScribe AI

> Transform code into comprehensive documentation in seconds

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://your-url)
[![GitHub](https://img.shields.io/badge/github-view_code-blue?style=for-the-badge&logo=github)](https://github.com/you/codescribe-ai)

## 🎯 Overview

CodeScribe AI is an intelligent documentation generator powered by Claude's API. It analyzes your code and generates professional documentation with real-time streaming and quality scoring.

**[Try it live →](https://your-url)**

## ✨ Features

- 📝 **Multiple Formats**: Generate README, JSDoc, API documentation, or ARCHITECTURE overviews
- ⚡ **Real-time Streaming**: Watch docs generate character-by-character
- 📊 **Quality Scoring**: Get objective feedback with actionable suggestions
- 🎨 **Beautiful UI**: Clean, responsive interface that works everywhere
- 🔐 **Privacy-First**: Your code never touches a database

## 🛠️ Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS
- Monaco Editor
- react-markdown

**Backend:**
- Node.js 20+ + Express 5
- Claude API (Sonnet 4.5)
- Acorn (AST parsing)

**Infrastructure:**
- Vercel (hosting)
- Server-Sent Events (streaming)

## 🏗️ Architecture

\`\`\`mermaid
[Include architecture diagram from artifact]
\`\`\`

## 🚀 Quick Start

\`\`\`bash
# Clone repository
git clone https://github.com/yourusername/codescribe-ai.git
cd codescribe-ai

# Install dependencies
npm install

# Set up environment variables
cp server/.env.example server/.env
# Add your CLAUDE_API_KEY

# Run development servers
npm run dev
\`\`\`

Visit http://localhost:5173

## 📖 API Documentation

See [API-Reference.md](../api/API-Reference.md) for full API documentation.

**Quick example:**

\`\`\`javascript
POST /api/generate
{
  "code": "function hello() { return 'world'; }",
  "docType": "README",
  "language": "javascript"
}
\`\`\`

## 🗺️ Roadmap

- [x] Web application (v1.0) - **Complete**
- [ ] CLI tool (v1.1) - *Next*
- [ ] VS Code extension (v2.0) - *Planned*
- [ ] GitHub integration
- [ ] Custom templates
- [ ] Team collaboration

## 🎬 Demo

[Embed demo video here]

## 📸 Screenshots

[Add 3-5 key screenshots]

## 🤝 Contributing

This is a portfolio project, but suggestions are welcome! Feel free to open an issue or submit a PR.

## 📄 License

MIT © [Your Name]

---

Built with ❤️ by [Your Name] | [LinkedIn](your-linkedin) | [Portfolio](your-portfolio)
\`\`\`

---

## 🎤 Interview Preparation (Quick Reference)

### Elevator Pitch (30 seconds)

> "CodeScribe AI generates intelligent documentation for code. I built it in under a week using React, Node.js, and Claude's API. What makes it unique is the quality scoring—it doesn't just generate docs, it teaches you how to improve them. I designed it API-first so it can scale from web to CLI to VS Code extension."

### Key Technical Highlights

1. **Streaming Implementation**: Real-time doc generation using SSE
2. **Quality Scoring**: 5-criteria algorithm with actionable feedback
3. **AST Parsing**: Deep code analysis using Acorn
4. **API-First Design**: Service layer works with any client
5. **Production-Ready**: Error handling, rate limiting, responsive design

### Common Questions

**"Why this tech stack?"**
> "React and Node.js—JavaScript full-stack for speed. Claude API for best code understanding. Monaco Editor because it's what VS Code uses. Tailwind for rapid prototyping."

**"Hardest challenge?"**
> "Streaming implementation with SSE. Had to handle backpressure, connection failures, and cleanup. Implemented retry logic with exponential backoff for resilience."

**"How would you scale it?"**
> "Three things: caching for common code samples, queue system for burst traffic, and CDN for frontend assets. The API-first architecture makes backend swapping easy."

---

## ✅ Pre-Launch Checklist

### Code Quality
- [ ] No console.logs in production
- [ ] ESLint passes
- [ ] No TypeScript errors (if using TS)
- [ ] Code is commented
- [ ] Git history is clean

### Documentation
- [ ] README is comprehensive
- [ ] API documentation exists
- [ ] Architecture diagram included
- [ ] Setup instructions tested
- [ ] All links work

### Deployment
- [ ] App is live
- [ ] Environment variables set
- [ ] HTTPS working
- [ ] Analytics configured (optional)
- [ ] Domain configured (optional)

### Demo Materials
- [ ] Demo video uploaded
- [ ] Screenshots captured
- [ ] GIF created for README
- [ ] LinkedIn post drafted
- [ ] Portfolio site updated

### Testing
- [ ] All features work in production
- [ ] Tested on 3+ browsers
- [ ] Tested on mobile
- [ ] No critical bugs
- [ ] Performance acceptable

---

## 🎯 Success Criteria

Your project is successful when:

✅ **Functional**: All P0 features work  
✅ **Accessible**: Works on all devices and browsers  
✅ **Fast**: Lighthouse score >80  
✅ **Professional**: Clean code, good design  
✅ **Documented**: Comprehensive README + demo  
✅ **Live**: Deployed with public URL  
✅ **Interview-Ready**: You can explain every decision  

---

## 📦 Downloadable Artifacts Summary

All artifacts created in this conversation:

1. **Product Requirements Document (PRD)** - Complete feature specs
2. **Epics & User Stories** - Product owner perspective
3. **Project Manager Todo List** - Day-by-day tasks
4. **Architecture Diagram (Mermaid)** - System design visualization
5. **Development Guide** - Senior engineer implementation details
6. **Interview Preparation Guide** - Q&A and talking points
7. **This Master Prompt** - Complete synthesis

**How to use:**
- Save each artifact as a separate markdown file
- Reference during development
- Use as interview prep materials
- Include relevant parts in your portfolio

---

## 🚀 Get Started Now

**Your next steps:**

1. **Today**: Set up project structure, implement backend API
2. **Tomorrow**: Build code parser and quality scorer
3. **Day 3**: Create React UI and connect to backend
4. **Day 4**: Add examples, animations, test thoroughly
5. **Day 5**: Deploy, write docs, record demo

**Remember:**
- Ship fast, iterate later
- Good enough > perfect
- Document as you go
- Test continuously
- Stay focused on MVP

---

## 💪 Motivation

**You're building something impressive:**

✨ This isn't just another CRUD app—it's an intelligent tool that solves real problems  
🚀 You're demonstrating full-stack skills, AI integration, and product thinking  
🎯 In less than a week, you'll have a live, working product in your portfolio  
💼 This will help you land interviews and showcase your capabilities  

**Now go build! 🔥**

---

## 📞 Need Help?

### Resources
- **Anthropic API Docs**: https://docs.anthropic.com
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Monaco Editor**: https://microsoft.github.io/monaco-editor/
- **Vercel Docs**: https://vercel.com/docs

### Community
- Stack Overflow (tag questions properly)
- Anthropic Discord
- React Discord
- Dev.to community

### Debugging Tips
1. Check browser console first
2. Verify environment variables
3. Test API endpoints with Postman
4. Use React DevTools
5. Check Network tab for API calls

---

## 🎉 Final Notes

**This is everything you need to build CodeScribe AI from scratch.**

Every technical decision has been thought through. Every artifact is production-ready. The timeline is realistic. The scope is achievable.

**Trust the process. Follow the plan. Ship something amazing.**

Good luck! 🚀

---

**Document Version:** 1.0  
**Last Updated:** October 11, 2025  
**Status:** Ready for Implementation  
**Estimated Time:** 5-7 days  

**Begin Day 1 when ready. You've got this!**