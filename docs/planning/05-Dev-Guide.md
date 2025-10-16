# CodeScribe AI - Senior Engineer Development Guide

**Role:** Senior Full-Stack Architect & Engineer  
**Tech Stack:** React, Node.js, Express, Claude API  
**Timeline:** 5-7 Days  

---

## 🏗️ Optimal Project Structure

```
codescribe-ai/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions (optional)
├── client/                        # React Frontend
│   ├── public/
│   │   ├── favicon.ico
│   │   └── og-image.png          # Open Graph for sharing
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── MobileMenu.jsx
│   │   │   ├── ControlBar.jsx
│   │   │   ├── CodePanel.jsx
│   │   │   ├── DocPanel.jsx
│   │   │   ├── QualityScore.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── hooks/
│   │   │   ├── useDocGeneration.js
│   │   │   ├── useFileUpload.js
│   │   │   └── useStreamingResponse.js
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   ├── constants/
│   │   │   └── examples.js       # Pre-loaded code samples
│   │   ├── utils/
│   │   │   └── markdown.js       # Markdown helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── README.md
├── server/                        # Node.js Backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── docGenerator.js   # Core service
│   │   │   ├── claudeClient.js   # Claude API wrapper
│   │   │   ├── codeParser.js     # AST analysis
│   │   │   └── qualityScorer.js  # Scoring logic
│   │   ├── routes/
│   │   │   └── api.js            # All API routes
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validator.js
│   │   ├── utils/
│   │   │   └── logger.js
│   │   └── server.js             # Express app
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── docs/                          # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── CONTRIBUTING.md
├── .gitignore
├── LICENSE
└── README.md                      # Main project README
```

---

## 🔧 Technology Stack Justification

### Frontend

**React 19 with Vite**
- ✅ Fast HMR for rapid development
- ✅ Modern build tool (faster than CRA)
- ✅ Tree-shaking for smaller bundles
- ✅ Industry standard, great for portfolio

**Tailwind CSS**
- ✅ Rapid prototyping
- ✅ Consistent design system
- ✅ Small production bundle (only used classes)
- ✅ Responsive utilities built-in

**Monaco Editor (@monaco-editor/react)**
- ✅ Industry-grade code editor (VS Code's engine)
- ✅ Syntax highlighting out of the box
- ✅ Familiar to developers
- ✅ Shows technical sophistication

**react-markdown**
- ✅ Lightweight Markdown renderer
- ✅ Security-focused (sanitizes HTML)
- ✅ Customizable components
- ✅ Syntax highlighting support

### Backend

**Node.js 20+ with Express 5**
- ✅ Matches your JavaScript/Node.js background
- ✅ Non-blocking I/O perfect for streaming
- ✅ Massive ecosystem
- ✅ Easy deployment to Vercel/Railway

**Anthropic Claude API**
- ✅ Best-in-class code understanding
- ✅ Long context window (200K tokens)
- ✅ Streaming support for real-time UX
- ✅ Reliable, production-ready

**acorn / @babel/parser**
- ✅ Fast JavaScript parser
- ✅ Generates AST for code analysis
- ✅ Widely used in tooling
- ✅ Minimal dependencies

### Infrastructure

**Vercel**
- ✅ Zero-config deployment
- ✅ Automatic HTTPS & CDN
- ✅ Serverless functions support
- ✅ Great for Next.js (future migration path)
- ✅ Free tier generous for portfolios

**Alternative: Netlify + Railway/Render**
- Netlify for frontend
- Railway/Render for Node.js backend
- Good if Vercel limits hit

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

## 📊 Performance Optimization

### Frontend

1. **Code Splitting**
```javascript
// Lazy load Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
```

2. **Memoization**
```javascript
const MemoizedCodePanel = memo(CodePanel);
```

3. **Debounce API Calls**
```javascript
const debouncedGenerate = useMemo(
  () => debounce(generate, 500),
  [generate]
);
```

### Backend

1. **Caching** (Future Enhancement)
```javascript
// Cache common code samples
const cache = new Map();
```

2. **Rate Limiting**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
});

app.use('/api/', limiter);
```

---

## 🎯 Key Architectural Principles

1. **API-First Design**: Service layer can be used by any client
2. **Separation of Concerns**: Clear boundaries between layers
3. **Error Resilience**: Graceful degradation, retry logic
4. **Extensibility**: Easy to add new doc types, languages
5. **Performance**: Streaming for better UX, efficient parsing
6. **Maintainability**: Clear code structure, good naming, comments

---

**Document Owner:** Senior Engineer  
**Last Updated:** October 11, 2025  
**Status:** Ready for Implementation