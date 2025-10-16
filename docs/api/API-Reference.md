# CodeScribe AI - API Reference

**Project:** CodeScribe AI Portfolio Application  
**API Version:** 1.0.0  
**Base URL (Dev):** `http://localhost:3000/api`  
**Base URL (Prod):** `https://codescribe-ai.vercel.app/api`  
**Last Updated:** October 11, 2025

---

## 📋 Overview

This document describes the REST API endpoints you will build for the CodeScribe AI application. These endpoints power the web frontend and will later support the CLI tool and VS Code extension.

**Technology Stack:**
- **Runtime:** Node.js 20+
- **Framework:** Express 5
- **AI Provider:** Anthropic Claude API (Sonnet 4.5)
- **Code Parser:** Acorn (JavaScript AST)
- **Streaming:** Server-Sent Events (SSE)

---

## 🏗️ API Architecture

```
Client (React/CLI/Extension)
    ↓
Express Router (/api)
    ↓
Service Layer (docGenerator, codeParser, qualityScorer)
    ↓
External APIs (Claude API)
```

**Design Principles:**
- RESTful conventions
- Stateless (no sessions)
- JSON request/response
- Streaming support (SSE)
- Detailed error responses

---

## 🔐 Authentication

**Phase 1 (Current):** No authentication
- Public API for portfolio demonstration
- Rate limiting by IP address only

**Phase 2 (Future Enhancement):**
```javascript
// Optional API key authentication
headers: {
  'Authorization': 'Bearer YOUR_API_KEY'
}
```

---

## 📡 Endpoints

### 1. Generate Documentation (Standard)

Generate documentation synchronously without streaming.

**Endpoint:**
```http
POST /api/generate
```

**Use Case:** 
- When streaming is not needed
- Batch processing
- CLI tool
- Testing

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "export class AuthService {\n  async login(email, password) {\n    return token;\n  }\n}",
  "docType": "README",
  "language": "javascript"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | string | Yes | - | Source code to document (max 100,000 chars) |
| `docType` | string | No | `README` | Documentation type: `README`, `JSDOC`, `API`, `ARCHITECTURE` |
| `language` | string | No | `javascript` | Programming language: `javascript`, `typescript`, `python` |

**Response (200 OK):**
```json
{
  "documentation": "# Authentication Service\n\n## Overview\nThe AuthService class provides secure user authentication...",
  "qualityScore": {
    "score": 92,
    "grade": "A",
    "breakdown": {
      "overview": {
        "present": true,
        "points": 20,
        "status": "complete",
        "suggestion": null
      },
      "installation": {
        "present": true,
        "points": 15,
        "status": "complete",
        "suggestion": null
      },
      "examples": {
        "present": true,
        "count": 3,
        "points": 20,
        "status": "complete",
        "suggestion": null
      },
      "apiDocs": {
        "present": true,
        "coverage": "2/2",
        "coveragePercent": 100,
        "points": 25,
        "status": "complete",
        "suggestion": null
      },
      "structure": {
        "present": true,
        "headers": 5,
        "hasCodeBlocks": true,
        "hasBulletPoints": true,
        "points": 20,
        "status": "complete",
        "suggestion": null
      }
    },
    "summary": {
      "strengths": ["overview", "installation", "examples", "apiDocs", "structure"],
      "improvements": [],
      "topSuggestion": "Documentation looks good!"
    }
  },
  "analysis": {
    "functions": [
      {
        "name": "login",
        "params": ["email", "password"],
        "async": true,
        "line": 2
      }
    ],
    "classes": [
      {
        "name": "AuthService",
        "methods": [
          {
            "name": "login",
            "kind": "method",
            "async": true
          }
        ],
        "line": 1
      }
    ],
    "exports": ["AuthService"],
    "imports": [],
    "variables": [],
    "complexity": "simple",
    "language": "javascript"
  },
  "metadata": {
    "language": "javascript",
    "docType": "README",
    "generatedAt": "2025-10-11T10:30:00.000Z",
    "codeLength": 89
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Code:**
```json
{
  "error": "Invalid request",
  "message": "Code is required and must be a string"
}
```

**400 Bad Request - Code Too Large:**
```json
{
  "error": "Code too large",
  "message": "Maximum code length is 100,000 characters"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Generation failed",
  "message": "Claude API error: rate_limit_exceeded"
}
```

**Implementation Reference:**
```javascript
// server/src/routes/api.js
router.post('/generate', async (req, res) => {
  try {
    const { code, docType, language } = req.body;

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
```

---

### 2. Generate Documentation (Streaming)

Generate documentation with real-time Server-Sent Events streaming.

**Endpoint:**
```http
POST /api/generate-stream
```

**Use Case:**
- Web application real-time updates
- Better user experience (see progress)
- Demonstrates streaming capability

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "docType": "README",
  "language": "javascript"
}
```

**Response:** Server-Sent Events (text/event-stream)

**SSE Event Sequence:**

**1. Connection Established:**
```
data: {"type":"connected"}

```

**2. Documentation Chunks (multiple events):**
```
data: {"type":"chunk","content":"# "}

data: {"type":"chunk","content":"Add Function"}

data: {"type":"chunk","content":"\n\n## Overview\n"}

data: {"type":"chunk","content":"Simple addition utility"}

```

**3. Generation Complete:**
```
data: {"type":"complete","qualityScore":{...},"metadata":{...}}

```

**4. Error (if occurs):**
```
data: {"type":"error","error":"Error message"}

```

**Response Headers:**
```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**Client Implementation Example:**
```javascript
// client/src/hooks/useDocGeneration.js
const response = await fetch(`${API_URL}/api/generate-stream`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, docType, language })
});

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
```

**Server Implementation Reference:**
```javascript
// server/src/routes/api.js
router.post('/generate-stream', async (req, res) => {
  try {
    const { code, docType, language } = req.body;

    // Validation (same as /generate)
    
    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

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

    res.write(`data: ${JSON.stringify({ 
      type: 'complete',
      qualityScore: result.qualityScore,
      metadata: result.metadata
    })}\n\n`);

    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ 
      type: 'error',
      error: error.message 
    })}\n\n`);
    res.end();
  }
});
```

---

### 3. Upload File (Optional - Phase 1.5)

Upload a code file to analyze and document.

**Endpoint:**
```http
POST /api/upload
```

**Use Case:**
- User doesn't want to copy-paste
- Large files
- Batch processing multiple files

**Request:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Code file (.js, .jsx, .ts, .tsx, .py) |

**Response (200 OK):**
```json
{
  "success": true,
  "file": {
    "name": "auth-service.js",
    "originalName": "auth-service.js",
    "size": 1024,
    "sizeFormatted": "1.0 KB",
    "extension": ".js",
    "mimetype": "text/javascript",
    "content": "export class AuthService { ... }"
  }
}
```

**Error Responses:**

**400 Bad Request - No File:**
```json
{
  "success": false,
  "error": "No file uploaded",
  "message": "Please select a file to upload"
}
```

**400 Bad Request - Invalid Type:**
```json
{
  "success": false,
  "error": "Invalid file type",
  "message": "Invalid file type. Allowed: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs, .rb, .php, .txt"
}
```

**400 Bad Request - File Too Large:**
```json
{
  "success": false,
  "error": "File too large",
  "message": "Maximum file size is 500KB"
}
```

**400 Bad Request - Empty File:**
```json
{
  "success": false,
  "error": "Empty file",
  "message": "The uploaded file is empty. Please upload a file with content."
}
```

**400 Bad Request - Empty Content:**
```json
{
  "success": false,
  "error": "Empty content",
  "message": "The uploaded file contains no meaningful content."
}
```

**400 Bad Request - Content Too Large:**
```json
{
  "success": false,
  "error": "File content too large",
  "message": "Maximum file content is 100,000 characters"
}
```

**Implementation Reference:**
```javascript
// server/src/routes/api.js
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 // 500KB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      '.js', '.jsx', '.ts', '.tsx',  // JavaScript/TypeScript
      '.py',                          // Python
      '.java',                        // Java
      '.cpp', '.c', '.h', '.hpp',    // C/C++
      '.cs',                          // C#
      '.go',                          // Go
      '.rs',                          // Rust
      '.rb',                          // Ruby
      '.php',                         // PHP
      '.txt'                          // Plain text
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    // Validate file is not empty
    if (req.file.size === 0) {
      return res.status(400).json({
        success: false,
        error: 'Empty file',
        message: 'The uploaded file is empty. Please upload a file with content.'
      });
    }

    // Convert buffer to string and validate content
    const content = req.file.buffer.toString('utf-8');

    // Additional validation: ensure content is not just whitespace
    if (!content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Empty content',
        message: 'The uploaded file contains no meaningful content.'
      });
    }

    // Validate content length (same as code input validation)
    if (content.length > 100000) {
      return res.status(400).json({
        success: false,
        error: 'File content too large',
        message: 'Maximum file content is 100,000 characters'
      });
    }

    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        size: req.file.size,
        sizeFormatted: formatBytes(req.file.size),
        extension: path.extname(req.file.originalname),
        mimetype: req.file.mimetype,
        content: content
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

**Validation Layers:**

The backend performs comprehensive validation in multiple layers:

1. **File Extension (Multer fileFilter)** - Rejects invalid file types immediately
2. **File Size (Multer limits)** - Enforces 500KB maximum binary size
3. **Empty File Check** - Rejects files with 0 bytes
4. **Content Validation** - Ensures content is not just whitespace
5. **Content Length** - Enforces 100,000 character maximum (same as code input)

**Note on Client-Side Validation:**

While the backend performs all necessary validation, the frontend also implements client-side validation for better UX. This provides immediate feedback to users without requiring a server round-trip. However, all validation is **always re-performed on the backend** for security, as client-side validation can be bypassed.

---

### 4. Health Check

Check API health and version.

**Endpoint:**
```http
GET /api/health
```

**Use Case:**
- Monitoring
- Deployment verification
- Load balancer health checks

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "production"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-11T10:30:00.000Z",
  "error": "Claude API unavailable"
}
```

**Implementation Reference:**
```javascript
// server/src/routes/api.js
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});
```

---

## 📊 Quality Score Breakdown

The quality scoring algorithm analyzes generated documentation across 5 criteria:

### Scoring Criteria

| Criterion | Points | Description |
|-----------|--------|-------------|
| **Overview** | 20 | Has project description/overview section |
| **Installation** | 15 | Includes setup/installation instructions |
| **Examples** | 20 | Contains code examples (3+ = full points) |
| **API Docs** | 25 | Documents functions/classes (coverage based) |
| **Structure** | 20 | Well-organized with headers, code blocks, bullets |

### Score Calculation

```javascript
// Pseudo-code
totalScore = 0;

// 1. Overview (20 points)
if (hasSection(['overview', 'description', 'about'])) {
  totalScore += 20;
}

// 2. Installation (15 points)
if (hasSection(['installation', 'setup', 'getting started'])) {
  totalScore += 15;
}

// 3. Examples (20 points)
exampleCount = countCodeBlocks(documentation);
if (exampleCount >= 3) totalScore += 20;
else if (exampleCount === 2) totalScore += 15;
else if (exampleCount === 1) totalScore += 10;

// 4. API Documentation (25 points)
coverageRatio = documentedFunctions / totalFunctions;
totalScore += Math.round(25 * coverageRatio);

// 5. Structure (20 points)
headerCount = countHeaders(documentation);
if (headerCount >= 3 && hasCodeBlocks && hasBullets) {
  totalScore += 20;
} else if (headerCount >= 2) {
  totalScore += 12;
} else if (headerCount >= 1) {
  totalScore += 8;
}

// Grade assignment
if (totalScore >= 90) grade = 'A';
else if (totalScore >= 80) grade = 'B';
else if (totalScore >= 70) grade = 'C';
else if (totalScore >= 60) grade = 'D';
else grade = 'F';
```

### Status Values

- `complete` - Criterion fully satisfied
- `partial` - Criterion partially satisfied
- `missing` - Criterion not satisfied

### Suggestions

Each criterion includes an actionable suggestion when not complete:
```json
{
  "suggestion": "Add installation or setup instructions"
}
```

---

## 🚦 Rate Limiting

**Current Implementation:**

CodeScribe AI uses a two-tier rate limiting strategy to prevent abuse while allowing reasonable usage:

1. **API-Wide Rate Limiter** (applied to all `/api/*` endpoints)
   - **Limit:** 10 requests per minute per IP address
   - **Window:** 60 seconds (1 minute)
   - **Purpose:** Prevents rapid-fire spam requests

2. **Generation Rate Limiter** (applied to `/api/generate` and `/api/generate-stream`)
   - **Limit:** 100 requests per hour per IP address
   - **Window:** 3600 seconds (1 hour)
   - **Purpose:** Controls expensive Claude API calls and prevents resource exhaustion

**How It Works:**
- Both limiters must be satisfied for generation endpoints to work
- For example, you can make up to 10 generation requests per minute, but no more than 100 per hour total
- Other endpoints (health, upload) only check the API-wide limiter
- Limits are tracked per IP address
- Counters reset automatically after the time window expires

**Response Headers:**

All rate-limited responses include these standard headers:

```http
RateLimit-Limit: 10              # Maximum requests allowed in window
RateLimit-Remaining: 7           # Requests remaining in current window
RateLimit-Reset: 1697123456      # Unix timestamp when limit resets
```

> **Note:** The `RateLimit-*` headers follow the [IETF Rate Limit Headers](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers) draft standard.

**Rate Limit Errors:**

**429 Too Many Requests (Per-Minute Limit Exceeded):**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

**429 Too Many Requests (Hourly Limit Exceeded):**
```json
{
  "error": "Hourly limit exceeded",
  "message": "You have exceeded 100 generations per hour. Please try again later.",
  "retryAfter": 3600
}
```

**Client-Side Handling Best Practices:**

```javascript
async function generateDocumentation(code, docType) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, docType })
    });

    // Check rate limit headers
    const limit = response.headers.get('RateLimit-Limit');
    const remaining = response.headers.get('RateLimit-Remaining');
    const reset = response.headers.get('RateLimit-Reset');

    console.log(`Rate limit: ${remaining}/${limit} requests remaining`);

    if (response.status === 429) {
      const error = await response.json();
      // Show user-friendly message with retry time
      throw new Error(`${error.message} (Retry in ${error.retryAfter} seconds)`);
    }

    return await response.json();
  } catch (error) {
    console.error('Generation failed:', error);
    throw error;
  }
}
```

**Configuration:**

Rate limits can be customized via environment variables:

```bash
# API-wide rate limiter (per minute)
RATE_LIMIT_WINDOW_MS=60000       # Window duration in milliseconds (default: 60000 = 1 minute)
RATE_LIMIT_MAX=10                # Max requests per window (default: 10)

# Generation rate limiter (per hour)
RATE_LIMIT_HOURLY_MAX=100        # Max generations per hour (default: 100)
```

**Implementation Reference:**

```javascript
// server/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Primary rate limiter: 10 requests per minute
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests. Please try again in 60 seconds.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again in 60 seconds.',
      retryAfter: 60
    });
  }
});

// Stricter limiter for generation endpoints
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_HOURLY_MAX) || 100,
  message: {
    error: 'Hourly limit exceeded',
    message: 'You have exceeded 100 generations per hour. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Hourly limit exceeded',
      message: 'You have exceeded 100 generations per hour. Please try again later.',
      retryAfter: 3600
    });
  }
});

// Apply to routes
// server/src/routes/api.js
import { apiLimiter, generationLimiter } from '../middleware/rateLimiter.js';

// All API routes get the per-minute limiter
router.use(apiLimiter);

// Generation endpoints get additional hourly limiter
router.post('/generate', generationLimiter, async (req, res) => { /* ... */ });
router.post('/generate-stream', generationLimiter, async (req, res) => { /* ... */ });
```

**Testing Rate Limits:**

You can test rate limiting behavior with cURL:

```bash
# Test per-minute limit (should fail on 11th request)
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/generate \
    -H "Content-Type: application/json" \
    -d '{"code":"test","docType":"README"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done

# Check rate limit headers
curl -I -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
```

---

## ⚠️ Error Handling

### Error Response Format

All errors follow this structure:
```json
{
  "error": "Error type/category",
  "message": "Human-readable error description",
  "details": {} // Optional additional context
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input, validation error |
| 413 | Payload Too Large | File upload exceeds size limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server or Claude API error |
| 503 | Service Unavailable | Health check fails |

### Error Handling Middleware

```javascript
// server/src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'Maximum file size is 500KB'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message
    });
  }

  // Claude API errors
  if (err.type === 'api_error') {
    return res.status(500).json({
      error: 'AI service error',
      message: 'Failed to generate documentation. Please try again.'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
}

// Apply to Express app
app.use(errorHandler);
```

---

## 🧪 Testing Your API

### Manual Testing with cURL

**1. Generate Documentation:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function greet(name) { return `Hello, ${name}!`; }",
    "docType": "README",
    "language": "javascript"
  }' | jq
```

**2. Stream Documentation:**
```bash
curl -N -X POST http://localhost:3000/api/generate-stream \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const add = (a, b) => a + b;",
    "docType": "JSDOC"
  }'
```

**3. Generate Architecture Documentation:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "export class UserService { async getUser(id) {} }",
    "docType": "ARCHITECTURE",
    "language": "javascript"
  }' | jq
```

**4. Upload File:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@./test-code.js"
```

**5. Health Check:**
```bash
curl http://localhost:3000/api/health
```

### Testing with JavaScript

```javascript
// test-api.js
const API_URL = 'http://localhost:3000/api';

async function testGenerate() {
  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'function test() { return true; }',
      docType: 'README'
    })
  });

  const data = await response.json();
  console.log('Documentation:', data.documentation);
  console.log('Quality Score:', data.qualityScore.score);
}

testGenerate();
```

---

## 📚 Related Documentation

- **Development Guide:** See Development Guide artifact for implementation details
- **Architecture:** See Architecture Diagram for system overview
- **PRD:** See Product Requirements Document for feature specifications
- **User Stories:** See Epics & User Stories for acceptance criteria

---

## 🔄 API Versioning (Future)

**Current:** No versioning (v1 implicit)

**Future Strategy:**
- URL-based versioning: `/api/v2/generate`
- Breaking changes → new version
- Maintain old versions for 6 months
- Deprecation warnings in response headers

---

## 🚀 Deployment Considerations

### Environment Variables

```bash
# Required
CLAUDE_API_KEY=sk-ant-api03-xxxxx
NODE_ENV=production

# Optional
PORT=3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
MAX_FILE_SIZE=524288  # 500KB in bytes
```

### CORS Configuration

```javascript
// server/src/server.js
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://codescribe-ai.vercel.app'
    : 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));
```

### Production Checklist

- [ ] Environment variables set in Vercel
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Health check endpoint working
- [ ] API responds within 30 seconds
- [ ] File upload size limits enforced

---

**API Documentation Version:** 1.0.0  
**Last Updated:** October 11, 2025  
**Status:** Implementation Ready  
**Next Steps:** Build endpoints following this specification