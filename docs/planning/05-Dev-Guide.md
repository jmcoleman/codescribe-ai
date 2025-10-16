# CodeScribe AI - Senior Engineer Development Guide

**Role:** Senior Full-Stack Architect & Engineer  
**Tech Stack:** React, Node.js, Express, Claude API  
**Timeline:** 5-7 Days  

---

## 🏗️ Current Project Structure

```
codescribe-ai/
├── client/                        # React Frontend
│   ├── public/
│   │   ├── favicon.ico
│   │   └── og-image.png          # Open Graph for sharing
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.jsx
│   │   │   ├── CodePanel.jsx
│   │   │   ├── ControlBar.jsx
│   │   │   ├── CopyButton.jsx
│   │   │   ├── DocPanel.jsx
│   │   │   ├── ErrorBanner.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ExamplesModal.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── HelpModal.jsx
│   │   │   ├── LazyMermaidRenderer.jsx  # Lazy-loaded Mermaid wrapper
│   │   │   ├── LazyMonacoEditor.jsx     # Lazy-loaded Monaco wrapper
│   │   │   ├── MermaidDiagram.jsx       # Mermaid diagram component
│   │   │   ├── MobileMenu.jsx
│   │   │   ├── QualityScore.jsx
│   │   │   ├── RateLimitIndicator.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── SkeletonLoader.jsx
│   │   │   ├── toast/
│   │   │   │   ├── CustomToast.jsx      # Custom toast components
│   │   │   │   └── ToastHistory.jsx     # Toast history modal
│   │   │   └── __tests__/               # Component tests
│   │   ├── hooks/
│   │   │   ├── useDocGeneration.js
│   │   │   └── useToastKeyboardShortcuts.js
│   │   ├── services/
│   │   │   └── api.js                   # API client
│   │   ├── constants/
│   │   │   └── examples.js              # Deprecated (use data/examples.js)
│   │   ├── data/
│   │   │   ├── examples.js              # Pre-loaded code samples
│   │   │   └── __tests__/
│   │   ├── utils/
│   │   │   ├── fileValidation.js        # File upload validation
│   │   │   ├── toast.jsx                # Toast utility functions
│   │   │   ├── toastWithHistory.js      # Toast with history tracking
│   │   │   └── __tests__/
│   │   ├── test/
│   │   │   └── setup.js                 # Vitest setup
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── README.md
├── server/                        # Node.js Backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── claudeClient.js          # Claude API wrapper
│   │   │   ├── codeParser.js            # AST analysis
│   │   │   ├── docGenerator.js          # Core service
│   │   │   ├── qualityScorer.js         # Scoring logic
│   │   │   └── __tests__/               # Service tests
│   │   ├── routes/
│   │   │   └── api.js                   # All API routes
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   └── server.js                    # Express app
│   ├── tests/
│   │   ├── manual/                      # Manual testing scripts
│   │   │   ├── test-api.js              # Quick API smoke test
│   │   │   ├── test-parser.js           # AST parser testing utility
│   │   │   └── test-rate-limit.js       # Rate limiting test suite
│   │   ├── integration/                 # Integration tests (planned)
│   │   └── helpers/                     # Test utilities
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── docs/                          # Documentation
│   ├── planning/                  # Project planning
│   │   ├── 01-PRD.md
│   │   ├── 02-Epics-Stories.md
│   │   ├── 03-Todo-List.md
│   │   ├── 05-Dev-Guide.md              # This file
│   │   ├── 06-InterviewGuide.md
│   │   ├── 07-Figma-Guide.md
│   │   └── 08-Master-Prompt.md
│   ├── api/                       # API documentation
│   │   ├── README.md
│   │   └── API-Reference.md
│   ├── architecture/              # Architecture documentation
│   │   ├── 04-Architecture.md
│   │   └── ARCHITECTURE.md
│   ├── performance/               # Performance optimization
│   │   └── OPTIMIZATION-GUIDE.md
│   ├── components/                # Component documentation
│   │   ├── TOAST-SYSTEM.md
│   │   ├── MERMAID-DIAGRAMS.md
│   │   └── ERROR-HANDLING-UX.md
│   ├── design/                    # Design assets
│   │   ├── brand-color-palette.html
│   │   └── brand-color-palette.pdf
│   ├── scripts/                   # Script documentation
│   │   └── VERSION-CHECKER.md
│   └── CONTEXT.md
├── private/                       # ⚠️ GITIGNORED - Sensitive content
│   ├── README.md
│   └── VISION.md
├── scripts/                       # Utility scripts
│   └── check-versions.js          # Version checker utility
├── .gitignore
├── CLAUDE.md                      # Claude context reference
├── LICENSE
└── README.md                      # Main project README
```

---

## 🔧 Technology Stack

> **📊 For Real-Time Version Information:** Run `npm run versions` to get exact installed versions.
> See [VERSION-CHECKER.md](../scripts/VERSION-CHECKER.md) for details.

### Frontend Stack

**Core Framework**
- **React** 19.2.0 - Latest React with improved performance and concurrent features
  - ✅ Fast HMR for rapid development
  - ✅ Industry standard, great for portfolio
  - ✅ Concurrent rendering for better UX
- **React DOM** 19.2.0
- **Vite** 7.1.9 - Modern build tool
  - ✅ Faster than Create React App
  - ✅ Tree-shaking for smaller bundles
  - ✅ Optimized hot module replacement

**UI & Styling**
- **Tailwind CSS** 3.4.18
  - ✅ Rapid prototyping with utility classes
  - ✅ Consistent design system
  - ✅ Small production bundle (only used classes)
  - ✅ Responsive utilities built-in
- **Lucide React** 0.545.0 - Icon library
  - ✅ Modern, clean icon set
  - ✅ Tree-shakeable
- **react-hot-toast** 2.6.0 - Toast notifications
  - ✅ Accessible toast system
  - ✅ Customizable and animated
  - See [TOAST-SYSTEM.md](../components/TOAST-SYSTEM.md)

**Code Editor & Markdown**
- **Monaco Editor** (@monaco-editor/react) 4.7.0
  - ✅ Industry-grade code editor (VS Code's engine)
  - ✅ Syntax highlighting out of the box
  - ✅ Lazy-loaded for performance (see LazyMonacoEditor.jsx)
- **react-markdown** 10.1.0
  - ✅ Lightweight Markdown renderer
  - ✅ Security-focused (sanitizes HTML)
  - ✅ Customizable components
- **react-syntax-highlighter** 15.6.6 - Code block syntax highlighting
- **remark-gfm** 4.0.1 - GitHub Flavored Markdown support

**Diagrams & Visualization**
- **Mermaid** 11.12.0
  - ✅ Diagram and flowchart rendering
  - ✅ Lazy-loaded for performance
  - See [MERMAID-DIAGRAMS.md](../components/MERMAID-DIAGRAMS.md)

**Development Tools**
- **ESLint** 9.37.0 - Code linting
- **Vitest** 3.2.4 - Testing framework
- **React Testing Library** 16.3.0 - Component testing
- **PostCSS** 8.5.6 + **Autoprefixer** 10.4.21 - CSS processing
- **rollup-plugin-visualizer** 6.0.5 - Bundle analysis
  - See [OPTIMIZATION-GUIDE.md](../performance/OPTIMIZATION-GUIDE.md)

### Backend Stack

**Core Framework**
- **Node.js** 22.19.0
  - ✅ Non-blocking I/O perfect for streaming
  - ✅ Massive ecosystem
  - ✅ Easy deployment to Vercel/Railway
- **Express** 5.1.0
  - ✅ Mature, battle-tested framework
  - ✅ Middleware ecosystem
  - ✅ Perfect for API development
- **CORS** 2.8.5 - Cross-origin resource sharing
- **dotenv** 17.2.3 - Environment variable management

**AI & Code Analysis**
- **Anthropic SDK** (@anthropic-ai/sdk) 0.65.0
  - ✅ Claude Sonnet 4.5 (claude-sonnet-4-20250514)
  - ✅ Best-in-class code understanding
  - ✅ Long context window (200K tokens)
  - ✅ Streaming support for real-time UX
- **Acorn** 8.15.0 - JavaScript AST parser
  - ✅ Fast and reliable
  - ✅ Generates AST for code analysis
  - ✅ Widely used in tooling
  - ✅ Minimal dependencies

**Middleware & Utilities**
- **express-rate-limit** 8.1.0 - API rate limiting
- **Multer** 2.0.2 - File upload handling

**Development Tools**
- **Nodemon** 3.1.10 - Auto-restart during development
- **Jest** 30.2.0 - Testing framework
- **Supertest** 7.1.4 - API testing

### Infrastructure

**Deployment**
- **Vercel** (Primary)
  - ✅ Zero-config deployment
  - ✅ Automatic HTTPS & CDN
  - ✅ Serverless functions support
  - ✅ Great for monorepo setups
  - ✅ Free tier generous for portfolios

**Alternatives**
- Netlify + Railway/Render
  - Netlify for frontend
  - Railway/Render for Node.js backend
  - Good if Vercel limits are reached

---

## 📝 Core Implementation Details

### 1. Claude API Integration (Day 1)

**File: server/src/services/claudeClient.js**

```javascript
import Anthropic from '@anthropic-ai/sdk';

class ClaudeClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.model = 'claude-sonnet-4-20250514';
    this.maxRetries = 3;
  }

  /**
   * Generate documentation without streaming
   * @param {string} prompt - The prompt to send to Claude
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt) {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        });

        return response.content[0].text;
      } catch (error) {
        retries++;
        if (retries === this.maxRetries) throw error;
        
        // Exponential backoff
        await this.sleep(Math.pow(2, retries) * 1000);
      }
    }
  }

  /**
   * Generate documentation with streaming
   * @param {string} prompt - The prompt to send to Claude
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<string>} Complete generated text
   */
  async generateWithStreaming(prompt, onChunk) {
    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let fullText = '';
    
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && 
          event.delta.type === 'text_delta') {
        const chunk = event.delta.text;
        fullText += chunk;
        onChunk(chunk);
      }
    }

    return fullText;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ClaudeClient();
```

**Key Design Decisions:**
- Singleton pattern for API client (single instance)
- Retry logic with exponential backoff for resilience
- Separate methods for streaming vs non-streaming
- Clear JSDoc comments for maintainability

---

### 2. Documentation Generator Service (Day 1-2)

**File: server/src/services/docGenerator.js**

```javascript
import claudeClient from './claudeClient.js';
import { parseCode } from './codeParser.js';
import { calculateQualityScore } from './qualityScorer.js';

export class DocGeneratorService {
  /**
   * Generate documentation for provided code
   * @param {string} code - Source code to document
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Documentation result
   */
  async generateDocumentation(code, options = {}) {
    const {
      docType = 'README',
      language = 'javascript',
      streaming = false,
      onChunk = null
    } = options;

    // Step 1: Parse code to understand structure
    const analysis = await parseCode(code, language);

    // Step 2: Build context-aware prompt
    const prompt = this.buildPrompt(code, analysis, docType, language);

    // Step 3: Generate documentation using Claude
    let documentation;
    if (streaming && onChunk) {
      documentation = await claudeClient.generateWithStreaming(
        prompt, 
        onChunk
      );
    } else {
      documentation = await claudeClient.generate(prompt);
    }

    // Step 4: Calculate quality score
    const qualityScore = calculateQualityScore(documentation, analysis);

    return {
      documentation,
      qualityScore,
      analysis,
      metadata: {
        language,
        docType,
        generatedAt: new Date().toISOString(),
        codeLength: code.length
      }
    };
  }

  /**
   * Build prompt based on documentation type
   * @param {string} code - Source code
   * @param {Object} analysis - Code analysis data
   * @param {string} docType - Type of documentation
   * @param {string} language - Programming language
   * @returns {string} Formatted prompt
   */
  buildPrompt(code, analysis, docType, language) {
    const baseContext = `
Language: ${language}
Functions detected: ${analysis.functions.length}
Classes detected: ${analysis.classes.length}
Exports: ${analysis.exports.join(', ') || 'None'}
Complexity: ${analysis.complexity || 'Unknown'}
`;

    const prompts = {
      README: `You are a technical documentation expert. Generate a comprehensive README.md for the following ${language} code.

${baseContext}

Requirements:
1. Project Overview: Clear description of what the code does
2. Features: List key capabilities (bullet points)
3. Installation: Setup instructions if applicable
4. Usage: Practical examples showing how to use the code
5. API Documentation: Document all exported functions/classes with:
   - Purpose
   - Parameters (with types)
   - Return values
   - Example usage
6. Code Examples: Include at least 2 working examples

Code to document:
\`\`\`${language}
${code}
\`\`\`

Generate professional, clear documentation in Markdown format. Use proper formatting with headers, code blocks, and bullet points.`,

      JSDOC: `You are a code documentation expert. Add comprehensive JSDoc comments to the following ${language} code.

${baseContext}

Requirements for each function/class:
1. Description: What it does
2. @param tags: All parameters with types and descriptions
3. @returns tag: Return value type and description
4. @throws tag: Possible errors/exceptions
5. @example tag: At least one usage example

Code to document:
\`\`\`${language}
${code}
\`\`\`

Return the COMPLETE code with JSDoc comments added. Maintain all original code exactly as is, only add comments above declarations. Use proper JSDoc syntax.`,

      API: `You are an API documentation specialist. Generate comprehensive API documentation for the following ${language} code.

${baseContext}

Requirements:
1. Endpoint/Function Overview: High-level description
2. For each public function/endpoint:
   - Name and signature
   - Purpose
   - Parameters: Name, type, required/optional, description
   - Return value: Type and description
   - Error responses: Possible errors and codes
   - Example request/response
3. Authentication: Requirements if any
4. Rate limiting: Mention if applicable

Code to document:
\`\`\`${language}
${code}
\`\`\`

Generate clear API documentation in Markdown format. Use tables for parameters where appropriate.`,

      ARCHITECTURE: `You are a software architect. Analyze the following ${language} code and generate an architectural overview.

${baseContext}

Requirements:
1. Architecture Overview: High-level system design
2. Component Breakdown: Key modules and their responsibilities
3. Data Flow: How information moves through the system
4. Dependencies: External libraries and internal modules
5. Design Patterns: Patterns used (if any)
6. Scalability Considerations: How the system could scale

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Generate architectural documentation in Markdown. Include a text-based diagram if helpful.`
    };

    return prompts[docType] || prompts.README;
  }
}

export default new DocGeneratorService();
```

**Key Design Decisions:**
- Service layer is framework-agnostic (can be used by web, CLI, extension)
- Clear separation of concerns (parsing, generation, scoring)
- Extensible prompt system (easy to add new doc types)
- Rich metadata for debugging and analytics

---

### 3. Code Parser (Day 2)

**File: server/src/services/codeParser.js**

```javascript
import * as acorn from 'acorn';

/**
 * Parse code and extract structural information
 * @param {string} code - Source code to parse
 * @param {string} language - Programming language
 * @returns {Promise<Object>} Analysis results
 */
export async function parseCode(code, language) {
  // Only parse JavaScript/TypeScript for now
  if (language !== 'javascript' && language !== 'typescript') {
    return basicAnalysis(code, language);
  }

  try {
    // Parse with acorn
    const ast = acorn.parse(code, {
      ecmaVersion: 2022,
      sourceType: 'module',
      locations: true
    });

    const analysis = {
      functions: [],
      classes: [],
      exports: [],
      imports: [],
      variables: [],
      complexity: 'medium',
      language
    };

    // Walk the AST and extract information
    walkAST(ast, analysis);

    // Calculate complexity
    analysis.complexity = calculateComplexity(analysis);

    return analysis;
  } catch (error) {
    console.error('Parse error:', error.message);
    return basicAnalysis(code, language);
  }
}

/**
 * Walk AST and extract structural elements
 */
function walkAST(node, analysis) {
  if (!node || typeof node !== 'object') return;

  switch (node.type) {
    case 'FunctionDeclaration':
      analysis.functions.push({
        name: node.id?.name || 'anonymous',
        params: node.params.map(p => p.name || p.type),
        async: node.async,
        generator: node.generator,
        line: node.loc?.start.line
      });
      break;

    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      if (node.parent?.type === 'VariableDeclarator') {
        analysis.functions.push({
          name: node.parent.id.name,
          params: node.params.map(p => p.name || p.type),
          async: node.async,
          type: 'arrow'
        });
      }
      break;

    case 'ClassDeclaration':
      analysis.classes.push({
        name: node.id?.name || 'anonymous',
        methods: extractClassMethods(node),
        line: node.loc?.start.line
      });
      break;

    case 'ExportNamedDeclaration':
      if (node.declaration) {
        const name = node.declaration.id?.name || 
                     node.declaration.declarations?.[0]?.id?.name;
        if (name) analysis.exports.push(name);
      }
      if (node.specifiers) {
        node.specifiers.forEach(spec => {
          analysis.exports.push(spec.exported.name);
        });
      }
      break;

    case 'ExportDefaultDeclaration':
      analysis.exports.push('default');
      break;

    case 'ImportDeclaration':
      analysis.imports.push({
        source: node.source.value,
        specifiers: node.specifiers.map(s => s.local.name)
      });
      break;

    case 'VariableDeclaration':
      node.declarations.forEach(decl => {
        if (decl.id.name) {
          analysis.variables.push(decl.id.name);
        }
      });
      break;
  }

  // Recursively walk children
  for (const key in node) {
    if (key === 'parent' || key === 'loc') continue;
    const child = node[key];
    
    if (Array.isArray(child)) {
      child.forEach(c => {
        if (c && typeof c === 'object') {
          c.parent = node;
          walkAST(c, analysis);
        }
      });
    } else if (child && typeof child === 'object') {
      child.parent = node;
      walkAST(child, analysis);
    }
  }
}

/**
 * Extract methods from a class node
 */
function extractClassMethods(classNode) {
  const methods = [];
  const body = classNode.body.body;

  body.forEach(node => {
    if (node.type === 'MethodDefinition') {
      methods.push({
        name: node.key.name,
        kind: node.kind, // 'method', 'constructor', 'get', 'set'
        static: node.static,
        async: node.value.async
      });
    }
  });

  return methods;
}

/**
 * Calculate code complexity
 */
function calculateComplexity(analysis) {
  const score = 
    analysis.functions.length * 2 +
    analysis.classes.length * 3 +
    analysis.exports.length;

  if (score < 10) return 'simple';
  if (score < 30) return 'medium';
  return 'complex';
}

/**
 * Basic analysis for unsupported languages
 */
function basicAnalysis(code, language) {
  const lines = code.split('\n');
  
  return {
    language,
    lines: lines.length,
    characters: code.length,
    functions: (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
    classes: (code.match(/class\s+\w+/g) || []).length,
    exports: extractBasicExports(code),
    imports: [],
    variables: [],
    complexity: lines.length > 100 ? 'complex' : 'simple'
  };
}

/**
 * Extract exports using regex (fallback)
 */
function extractBasicExports(code) {
  const exports = [];
  const exportMatches = code.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
  
  for (const match of exportMatches) {
    exports.push(match[1]);
  }
  
  return exports;
}
```

**Key Design Decisions:**
- Graceful degradation (falls back to regex if AST fails)
- Rich metadata extraction for better prompts
- Language extensibility (easy to add Python, etc.)
- Performance-conscious (single AST walk)

---

### 4. Quality Scorer (Day 2)

**File: server/src/services/qualityScorer.js**

```javascript
/**
 * Calculate documentation quality score
 * @param {string} documentation - Generated documentation
 * @param {Object} codeAnalysis - Code analysis data
 * @returns {Object} Score and breakdown
 */
export function calculateQualityScore(documentation, codeAnalysis) {
  let score = 0;
  const breakdown = {};

  // 1. Overview/Description (20 points)
  const hasOverview = hasSection(documentation, [
    'overview', 'description', 'about', 'introduction', 'what is'
  ]);
  
  if (hasOverview) {
    score += 20;
    breakdown.overview = { 
      present: true, 
      points: 20,
      status: 'complete'
    };
  } else {
    breakdown.overview = { 
      present: false, 
      points: 0,
      status: 'missing',
      suggestion: 'Add an overview section describing what the code does'
    };
  }

  // 2. Installation/Setup Instructions (15 points)
  const hasInstallation = hasSection(documentation, [
    'installation', 'setup', 'getting started', 'install', 'requirements'
  ]);
  
  if (hasInstallation) {
    score += 15;
    breakdown.installation = { 
      present: true, 
      points: 15,
      status: 'complete'
    };
  } else {
    breakdown.installation = { 
      present: false, 
      points: 0,
      status: 'missing',
      suggestion: 'Add installation or setup instructions'
    };
  }

  // 3. Usage Examples (20 points)
  const exampleCount = countCodeBlocks(documentation);
  let examplePoints = 0;
  let exampleStatus = 'missing';
  let exampleSuggestion = 'Add usage examples with code blocks';

  if (exampleCount >= 3) {
    examplePoints = 20;
    exampleStatus = 'complete';
    exampleSuggestion = null;
  } else if (exampleCount === 2) {
    examplePoints = 15;
    exampleStatus = 'partial';
    exampleSuggestion = 'Add one more usage example';
  } else if (exampleCount === 1) {
    examplePoints = 10;
    exampleStatus = 'partial';
    exampleSuggestion = 'Add more usage examples (currently only 1)';
  }

  score += examplePoints;
  breakdown.examples = { 
    present: exampleCount > 0, 
    count: exampleCount,
    points: examplePoints,
    status: exampleStatus,
    suggestion: exampleSuggestion
  };

  // 4. API Documentation (25 points)
  const functionsCovered = countFunctionDocs(documentation, codeAnalysis);
  const totalFunctions = codeAnalysis.functions?.length || 0;
  const coverageRatio = totalFunctions > 0 
    ? functionsCovered / totalFunctions 
    : 1;
  
  const apiPoints = Math.round(25 * coverageRatio);
  score += apiPoints;

  let apiStatus = 'complete';
  let apiSuggestion = null;

  if (coverageRatio < 0.5) {
    apiStatus = 'missing';
    apiSuggestion = `Document all functions (currently ${functionsCovered}/${totalFunctions})`;
  } else if (coverageRatio < 1) {
    apiStatus = 'partial';
    apiSuggestion = `Document remaining functions (${functionsCovered}/${totalFunctions} covered)`;
  }

  breakdown.apiDocs = { 
    present: apiPoints > 0, 
    coverage: `${functionsCovered}/${totalFunctions}`,
    coveragePercent: Math.round(coverageRatio * 100),
    points: apiPoints,
    status: apiStatus,
    suggestion: apiSuggestion
  };

  // 5. Structure/Formatting (20 points)
  const headerCount = countHeaders(documentation);
  const hasCodeBlocks = exampleCount > 0;
  const hasBulletPoints = documentation.includes('- ') || documentation.includes('* ');
  
  let structurePoints = 0;
  let structureStatus = 'missing';
  let structureSuggestion = 'Add section headers and formatting';

  if (headerCount >= 3 && hasCodeBlocks && hasBulletPoints) {
    structurePoints = 20;
    structureStatus = 'complete';
    structureSuggestion = null;
  } else if (headerCount >= 2) {
    structurePoints = 12;
    structureStatus = 'partial';
    structureSuggestion = 'Add more section headers for better organization';
  } else if (headerCount >= 1) {
    structurePoints = 8;
    structureStatus = 'partial';
    structureSuggestion = 'Improve structure with more headers and formatting';
  }

  score += structurePoints;
  breakdown.structure = { 
    present: headerCount > 0, 
    headers: headerCount,
    hasCodeBlocks,
    hasBulletPoints,
    points: structurePoints,
    status: structureStatus,
    suggestion: structureSuggestion
  };

  // Calculate grade
  const grade = getGrade(score);

  return {
    score,
    grade,
    breakdown,
    summary: generateSummary(score, breakdown)
  };
}

/**
 * Check if documentation has a section
 */
function hasSection(doc, keywords) {
  const lowerDoc = doc.toLowerCase();
  return keywords.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    return lowerDoc.includes(keywordLower) || 
           lowerDoc.includes(`# ${keywordLower}`) ||
           lowerDoc.includes(`## ${keywordLower}`);
  });
}

/**
 * Count code blocks in documentation
 */
function countCodeBlocks(doc) {
  const matches = doc.match(/```/g);
  return matches ? matches.length / 2 : 0;
}

/**
 * Count markdown headers
 */
function countHeaders(doc) {
  const matches = doc.match(/^#{1,6}\s+.+$/gm);
  return matches ? matches.length : 0;
}

/**
 * Count how many functions are documented
 */
function countFunctionDocs(doc, analysis) {
  if (!analysis.functions || analysis.functions.length === 0) {
    return 1; // Give credit if no functions to document
  }

  let count = 0;
  const lowerDoc = doc.toLowerCase();

  analysis.functions.forEach(func => {
    const funcName = func.name.toLowerCase();
    // Check if function name appears in documentation
    if (lowerDoc.includes(funcName)) {
      count++;
    }
  });

  return count;
}

/**
 * Convert score to letter grade
 */
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate human-readable summary
 */
function generateSummary(score, breakdown) {
  const complete = [];
  const missing = [];

  for (const [key, value] of Object.entries(breakdown)) {
    if (value.status === 'complete') {
      complete.push(key);
    } else if (value.status === 'missing') {
      missing.push(key);
    }
  }

  return {
    strengths: complete,
    improvements: missing,
    topSuggestion: getTopSuggestion(breakdown)
  };
}

/**
 * Get the most impactful suggestion
 */
function getTopSuggestion(breakdown) {
  const suggestions = Object.values(breakdown)
    .filter(item => item.suggestion)
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  return suggestions[0]?.suggestion || 'Documentation looks good!';
}
```

**Key Design Decisions:**
- Objective, deterministic scoring
- Actionable suggestions tied to missing criteria
- Detailed breakdown for transparency
- Extensible (easy to add new criteria)

---

### 5. API Routes (Day 1-2)

**File: server/src/routes/api.js**

```javascript
import express from 'express';
import docGenerator from '../services/docGenerator.js';

const router = express.Router();

/**
 * POST /api/generate
 * Generate documentation (non-streaming)
 */
router.post('/generate', async (req, res) => {
  try {
    const { code, docType, language } = req.body;

    // Validation
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Code is required and must be a string'
      });
    }

    if (code.length > 100000) {
      return res.status(400).json({ 
        error: 'Code too large',
        message: 'Maximum code length is 100,000 characters'
      });
    }

    // Generate documentation
    const result = await docGenerator.generateDocumentation(code, {
      docType: docType || 'README',
      language: language || 'javascript',
      streaming: false
    });

    res.json(result);
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ 
      error: 'Generation failed',
      message: error.message 
    });
  }
});

/**
 * POST /api/generate-stream
 * Generate documentation with streaming (SSE)
 */
router.post('/generate-stream', async (req, res) => {
  try {
    const { code, docType, language } = req.body;

    // Validation
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Code is required'
      });
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Generate with streaming
    const result = await docGenerator.generateDocumentation(code, {
      docType: docType || 'README',
      language: language || 'javascript',
      streaming: true,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content: chunk 
        })}\n\n`);
      }
    });

    // Send completion with quality score
    res.write(`data: ${JSON.stringify({ 
      type: 'complete',
      qualityScore: result.qualityScore,
      metadata: result.metadata
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error',
      error: error.message 
    })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
```

---

### 6. React Frontend Hook (Day 3)

**File: client/src/hooks/useDocGeneration.js**

```javascript
import { useState, useCallback, useRef } from 'react';

export function useDocGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState('');
  const [qualityScore, setQualityScore] = useState(null);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const generate = useCallback(async (code, docType, language) => {
    // Reset state
    setIsGenerating(true);
    setError(null);
    setDocumentation('');
    setQualityScore(null);

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Use fetch with POST to send data
      const response = await fetch(`${apiUrl}/api/generate-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, docType, language })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk') {
              setDocumentation(prev => prev + data.content);
            } else if (data.type === 'complete') {
              setQualityScore(data.qualityScore);
              setIsGenerating(false);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message);
      setIsGenerating(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  return {
    generate,
    cancel,
    isGenerating,
    documentation,
    qualityScore,
    error
  };
}
```

---

## 🎨 Modern Component Patterns (Implemented)

### 7. Lazy Loading Components

**Pattern:** Reduce initial bundle size by lazy-loading heavy dependencies.

**File: client/src/components/LazyMonacoEditor.jsx**

```javascript
import { Editor } from '@monaco-editor/react';

/**
 * Monaco Editor wrapper component for lazy loading
 * This component is dynamically imported to reduce initial bundle size
 */
export function LazyMonacoEditor({ height, language, value, onChange, options, theme }) {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      options={options}
      theme={theme}
    />
  );
}
```

**Usage in CodePanel.jsx:**

```javascript
import { lazy, Suspense } from 'react';
import { SkeletonLoader } from './SkeletonLoader';

// Lazy load Monaco Editor (reduces initial bundle by ~4.85 KB gzipped)
const LazyMonacoEditor = lazy(() =>
  import('./LazyMonacoEditor').then(mod => ({ default: mod.LazyMonacoEditor }))
);

export function CodePanel({ code, onChange, language }) {
  return (
    <Suspense fallback={<SkeletonLoader type="editor" />}>
      <LazyMonacoEditor
        height="100%"
        language={language}
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on'
        }}
        theme="vs-light"
      />
    </Suspense>
  );
}
```

**Key Benefits:**
- ✅ Reduces initial bundle size by 4.85 KB gzipped (Monaco Editor)
- ✅ Improves First Contentful Paint (FCP) by 89%
- ✅ Skeleton loader provides instant visual feedback
- ✅ Maintains same functionality, better performance

---

### 8. Mermaid Diagram Rendering (Lazy Loaded)

**Pattern:** Lazy-load Mermaid.js library and render diagrams only when needed.

**File: client/src/components/LazyMermaidRenderer.jsx**

```javascript
import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with CodeScribe AI brand theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  themeVariables: {
    primaryColor: '#9333ea',      // Purple primary
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#c084fc',
    lineColor: '#64748b',
    secondaryColor: '#e0e7ff',
    tertiaryColor: '#f1f5f9',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px'
  }
});

export function LazyMermaidRenderer({ chart, id, onError, onSuccess }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      if (!chart) return;

      try {
        const uniqueId = `mermaid-${id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, chart.trim());

        if (cancelled) return;

        setSvg(svg);
        setError(null);
        if (onSuccess) onSuccess();
      } catch (err) {
        if (cancelled) return;

        const errorMsg = err.message || 'Failed to render diagram';
        setError(errorMsg);
        setSvg('');
        if (onError) onError(errorMsg);
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, id, onError, onSuccess]);

  if (error) {
    return (
      <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          <strong>Error rendering diagram:</strong> {error}
        </p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">Rendering diagram...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose my-6 w-full overflow-x-auto">
      <div
        className="w-full flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
```

**Usage in DocPanel.jsx:**

```javascript
import { lazy, Suspense } from 'react';
import { SkeletonLoader } from './SkeletonLoader';

// Lazy load Mermaid renderer (reduces initial bundle by ~139.30 KB gzipped)
const LazyMermaidRenderer = lazy(() =>
  import('./LazyMermaidRenderer').then(mod => ({ default: mod.LazyMermaidRenderer }))
);

// In MermaidDiagram component
<Suspense fallback={<SkeletonLoader type="diagram" />}>
  <LazyMermaidRenderer
    chart={content}
    id={index}
    onError={handleError}
    onSuccess={handleSuccess}
  />
</Suspense>
```

**Key Benefits:**
- ✅ Reduces initial bundle by 139.30 KB gzipped
- ✅ Diagrams render with CodeScribe AI brand colors (purple, indigo, slate)
- ✅ Proper error handling and loading states
- ✅ Prevents memory leaks with cleanup function

**Documentation:** See [MERMAID-DIAGRAMS.md](../components/MERMAID-DIAGRAMS.md) for comprehensive guide.

---

### 9. Error Banner Component

**Pattern:** User-friendly error display with animations and accessibility.

**File: client/src/components/ErrorBanner.jsx**

```javascript
import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ErrorBanner({ error, retryAfter, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [error]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 200); // Match exit animation duration
  };

  if (!error || !isVisible) return null;

  const isMultiLine = error.includes('\n');
  const errorLines = isMultiLine ? error.split('\n') : [error];

  return (
    <div
      className={`bg-red-50 rounded-lg shadow-sm mb-6 ${
        isExiting ? 'animate-fade-out' : 'animate-slide-in-fade'
      } motion-reduce:animate-none`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4 p-4">
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
          {isMultiLine ? (
            <div className="text-sm text-red-700 space-y-1.5 leading-relaxed">
              {errorLines.map((line, index) => (
                <p key={index} className={line.trim() ? '' : 'hidden'}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-700 leading-relaxed">{error}</p>
          )}
          {retryAfter && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs font-medium text-red-600">
                Please wait {retryAfter} seconds before trying again.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md p-1.5 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
```

**Usage:**

```javascript
const [error, setError] = useState(null);
const [retryAfter, setRetryAfter] = useState(null);

<ErrorBanner
  error={error}
  retryAfter={retryAfter}
  onDismiss={() => {
    setError(null);
    setRetryAfter(null);
  }}
/>
```

**Key Features:**
- ✅ Enter animation: 250ms slide-in with fade
- ✅ Exit animation: 200ms fade-out
- ✅ Respects `prefers-reduced-motion`
- ✅ ARIA attributes for screen readers
- ✅ Multi-line error support
- ✅ Rate limit retry countdown

**Documentation:** See [ERROR-HANDLING-UX.md](../components/ERROR-HANDLING-UX.md) for research-backed patterns.

---

### 10. Toast Notification System

**Pattern:** Global toast notifications with history and keyboard shortcuts.

**File: client/src/utils/toast.jsx**

```javascript
import toast from 'react-hot-toast';
import { CustomToast } from '../components/toast/CustomToast';

// Success toast
export const toastSuccess = (message, options = {}) => {
  return toast.custom(
    (t) => <CustomToast t={t} type="success" message={message} />,
    { duration: 4000, ...options }
  );
};

// Error toast
export const toastError = (message, options = {}) => {
  return toast.custom(
    (t) => <CustomToast t={t} type="error" message={message} />,
    { duration: 6000, ...options }
  );
};

// Info toast
export const toastInfo = (message, options = {}) => {
  return toast.custom(
    (t) => <CustomToast t={t} type="info" message={message} />,
    { duration: 4000, ...options }
  );
};

// File upload toast with progress
export const toastFileUpload = (fileName, options = {}) => {
  return toast.success(`File loaded: ${fileName}`, {
    duration: 3000,
    icon: '📄',
    ...options
  });
};
```

**Usage:**

```javascript
import { toastSuccess, toastError } from './utils/toast';

// Success notification
toastSuccess('Documentation generated successfully!');

// Error notification
toastError('Failed to generate documentation. Please try again.');

// File upload notification
toastFileUpload('example.js');
```

**Key Features:**
- ✅ 20+ utility functions for common scenarios
- ✅ Custom toast components with brand styling
- ✅ Toast history modal (Cmd/Ctrl + H)
- ✅ Keyboard shortcuts (dismiss all, show history)
- ✅ WCAG 2.1 AA compliant
- ✅ Progress toasts for long operations

**Documentation:** See [TOAST-SYSTEM.md](../components/TOAST-SYSTEM.md) for complete API reference.

---

### 11. Skeleton Loaders

**Pattern:** Provide instant visual feedback during lazy loading.

**File: client/src/components/SkeletonLoader.jsx**

```javascript
export function SkeletonLoader({ type = 'editor' }) {
  if (type === 'editor') {
    return (
      <div className="animate-pulse w-full h-full bg-slate-100 rounded-lg p-4">
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (type === 'diagram') {
    return (
      <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">Loading diagram renderer...</p>
        </div>
      </div>
    );
  }

  return null;
}
```

**Key Benefits:**
- ✅ Instant visual feedback (no blank screens)
- ✅ Reduces perceived loading time
- ✅ Matches component dimensions to prevent layout shift

---

## 📊 Performance Optimization

### Bundle Size Reduction

**Results from Optimization:**
- **Initial bundle:** 516 KB (uncompressed)
- **Optimized bundle:** 78 KB gzipped (-85% reduction)
- **Lighthouse score:** 45 → 75 (+67% improvement)

**Key Optimizations Implemented:**

1. **Lazy Loading Heavy Components**
   ```javascript
   // Monaco Editor: -4.85 KB gzipped
   const LazyMonacoEditor = lazy(() => import('./LazyMonacoEditor'));

   // Mermaid.js: -139.30 KB gzipped
   const LazyMermaidRenderer = lazy(() => import('./LazyMermaidRenderer'));

   // DocPanel with react-markdown: -281.53 KB gzipped
   const DocPanel = lazy(() => import('./DocPanel'));
   ```

2. **Modal Components Lazy Loading**
   ```javascript
   // ExamplesModal: -2.43 KB gzipped
   const ExamplesModal = lazy(() => import('./ExamplesModal'));

   // HelpModal: -9.21 KB gzipped
   const HelpModal = lazy(() => import('./HelpModal'));
   ```

3. **Core Web Vitals Improvements**
   - **FCP (First Contentful Paint):** 5.5s → 0.6s (-89%)
   - **LCP (Largest Contentful Paint):** 10.5s → 0.7s (-93%)
   - **TBT (Total Blocking Time):** 900ms → 630ms (-30%)

**Bundle Analysis:**
```bash
npm run build
npm run preview
# Bundle visualizer at http://localhost:4173/stats.html
```

**Documentation:** See [OPTIMIZATION-GUIDE.md](../performance/OPTIMIZATION-GUIDE.md) for comprehensive guide.

---

## 🚀 Deployment Guide

### Vercel Deployment

**Step 1: Prepare for deployment**

```bash
# In client directory
npm run build

# Test locally
npm run preview
```

**Step 2: Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

**Step 3: Configure Environment Variables**

In Vercel Dashboard:
1. Go to Project Settings
2. Environment Variables
3. Add:
   - `CLAUDE_API_KEY`: Your Anthropic API key
   - `NODE_ENV`: production

**Step 4: Configure Build Settings**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Optional but Recommended)

```javascript
// server/src/__tests__/qualityScorer.test.js
import { calculateQualityScore } from '../services/qualityScorer.js';

describe('Quality Scorer', () => {
  it('should give perfect score for complete documentation', () => {
    const doc = `
# Overview
This is a great project.

## Installation
npm install

## Usage
\`\`\`javascript
const x = 1;
\`\`\`

## API
### myFunction()
Does something great.
    `;

    const analysis = { functions: [{ name: 'myFunction' }] };
    const result = calculateQualityScore(doc, analysis);

    expect(result.score).toBeGreaterThan(80);
  });
});
```

---

## 🔐 Additional Best Practices

### Frontend Performance Patterns

1. **Memoization for Expensive Computations**
```javascript
const MemoizedCodePanel = memo(CodePanel);
```

2. **Debounce API Calls**
```javascript
const debouncedGenerate = useMemo(
  () => debounce(generate, 500),
  [generate]
);
```

### Backend Rate Limiting

**File: server/src/middleware/rateLimiter.js**

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
});

// Apply to all API routes
app.use('/api/', limiter);
```

**Features:**
- ✅ Prevents API abuse
- ✅ Returns `Retry-After` header
- ✅ Configurable per endpoint

---

## 🎯 Key Architectural Principles

1. **API-First Design**: Service layer can be used by any client
2. **Separation of Concerns**: Clear boundaries between layers
3. **Error Resilience**: Graceful degradation, retry logic
4. **Extensibility**: Easy to add new doc types, languages
5. **Performance**: Streaming for better UX, efficient parsing
6. **Maintainability**: Clear code structure, good naming, comments

---

## 📚 Related Documentation

### Component Documentation
- [TOAST-SYSTEM.md](../components/TOAST-SYSTEM.md) - Complete toast notification system guide
- [MERMAID-DIAGRAMS.md](../components/MERMAID-DIAGRAMS.md) - Mermaid diagram rendering guide
- [ERROR-HANDLING-UX.md](../components/ERROR-HANDLING-UX.md) - Error handling UX patterns
- [COPYBUTTON.md](../components/COPYBUTTON.md) - CopyButton component guide

### Performance Documentation
- [OPTIMIZATION-GUIDE.md](../performance/OPTIMIZATION-GUIDE.md) - Comprehensive optimization guide
  - Lazy loading patterns
  - Bundle analysis
  - Core Web Vitals tracking
  - Lighthouse auditing

### Architecture Documentation
- [04-Architecture.md](../architecture/04-Architecture.md) - System architecture diagram
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Deep technical architecture

### API Documentation
- [API-Reference.md](../api/API-Reference.md) - Complete API specification
- [README.md](../api/README.md) - API quick start

### Utilities
- [VERSION-CHECKER.md](../scripts/VERSION-CHECKER.md) - Version checker script documentation
  - Run `npm run versions` for current package versions

---

**Document Owner:** Senior Engineer
**Last Updated:** October 16, 2025
**Status:** Current (Reflects Production Implementation)
**Version:** 2.0

**Changelog:**
- **v2.0** (Oct 16, 2025) - Major update: Updated project structure, added accurate package versions from version checker, documented new components (LazyMonacoEditor, LazyMermaidRenderer, ErrorBanner, SkeletonLoader, Toast system), added performance optimization section, added related documentation references
- **v1.0** (Oct 11, 2025) - Initial version