# CodeScribe AI - Claude API Integration Analysis

**Analysis Date:** November 13, 2025  
**Codebase:** /Users/jcoleman-mbp/Developer/projects/codescribe-ai  
**Focus:** Server-side Claude API integration architecture

---

## 1. Current Architecture Overview

### High-Level Flow

```
API Request (POST /generate or /generate-stream)
    ↓
[API Route Handler] (routes/api.js)
    ↓
[DocGeneratorService] (services/docGenerator.js)
    ├─ parseCode() → [CodeParser] (services/codeParser.js)
    ├─ buildPromptWithCaching()
    └─ claudeClient.generate() or generateWithStreaming()
        ↓
    [ClaudeClient] (services/claudeClient.js)
        ├─ Anthropic SDK (@anthropic-ai/sdk)
        └─ Error handling & retries
    ↓
[QualityScorer] (services/qualityScorer.js)
    ↓
Response to Client
```

---

## 2. ClaudeClient Implementation

### File Location
`/Users/jcoleman-mbp/Developer/projects/codescribe-ai/server/src/services/claudeClient.js`

### Class Structure

```javascript
class ClaudeClient {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
    this.model = 'claude-sonnet-4-5-20250929'
    this.maxRetries = 3
  }
  
  // Main methods
  async generate(prompt, options = {})
  async generateWithStreaming(prompt, onChunk, options = {})
  
  // Utility
  extractErrorMessage(error)
  sleep(ms)
}
```

### Key Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **API Key** | `process.env.CLAUDE_API_KEY` | Anthropic authentication |
| **Model** | `claude-sonnet-4-5-20250929` | Claude Sonnet 4.5 |
| **Max Tokens** | `4000` | Response size limit |
| **Max Retries** | `3` | Failure resilience |
| **Backoff Strategy** | Exponential (2^retries * 1000ms) | Progressive delays |

### Exposed Methods

#### 1. `generate(prompt, options = {})`

**Purpose:** Generate documentation without streaming (blocking)

**Parameters:**
- `prompt` (string): User message content
- `options` (object):
  - `systemPrompt` (string, optional): System prompt (cacheable)
  - `cacheUserMessage` (boolean): Enable prompt caching for user message

**Returns:** Promise<string> - Generated documentation text

**Request Structure:**
```javascript
{
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4000,
  messages: [{
    role: 'user',
    content: cacheUserMessage 
      ? [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral', ttl: '1h' } }]
      : prompt
  }],
  system: [{ 
    type: 'text', 
    text: systemPrompt,
    cache_control: { type: 'ephemeral', ttl: '1h' }
  }] // if systemPrompt provided
}
```

**Error Handling:**
- Retries up to 3 times with exponential backoff
- Throws enhanced error with user-friendly message
- Preserves original error as `enhancedError.originalError`

#### 2. `generateWithStreaming(prompt, onChunk, options = {})`

**Purpose:** Generate documentation with real-time streaming via SSE

**Parameters:**
- `prompt` (string): User message content
- `onChunk` (function): Callback for each text chunk `(chunk: string) => void`
- `options` (object): Same as `generate()`

**Returns:** Promise<string> - Complete accumulated text from all chunks

**Streaming Events Handled:**
- `content_block_delta` with `text_delta` → calls `onChunk()`
- `message_start` → captures cache stats
- Other events → filtered out

**Response Structure (SSE):**
```javascript
// Front-end receives events like:
data: {"type":"chunk","content":"# Documentation"}
data: {"type":"chunk","content":"\n\nThis is..."}
data: {"type":"complete","qualityScore":85,"metadata":{...}}
```

#### 3. `extractErrorMessage(error)`

**Purpose:** Parse Anthropic SDK errors into user-friendly messages

**Handling Logic:**
1. Tries to extract JSON from error.message (format: "400 {...}")
2. Checks nested error object structure
3. Falls back to error.message or generic message

**Example Transformations:**
```javascript
// Input
"400 {"error":{"type":"invalid_request_error","message":"Invalid token"}}"

// Output
{"error":"invalid_request_error","message":"Invalid token"}
```

---

## 3. DocGeneratorService Integration

### File Location
`/Users/jcoleman-mbp/Developer/projects/codescribe-ai/server/src/services/docGenerator.js`

### Main Method: `generateDocumentation(code, options = {})`

**Options:**
```javascript
{
  docType: 'README' | 'JSDOC' | 'API' | 'ARCHITECTURE',
  language: 'javascript' | 'python' | 'java' | etc.,
  streaming: boolean,
  onChunk: (chunk: string) => void,  // Required if streaming=true
  isDefaultCode: boolean,              // Cache user message if true
  userTier: 'free' | 'pro' | 'team' | 'enterprise'
}
```

**Processing Pipeline:**

1. **Code Analysis** (via `parseCode`)
   - Parses code structure (functions, classes, exports)
   - Calculates complexity metrics
   - Falls back to basic analysis if parsing fails

2. **Prompt Building** (via `buildPromptWithCaching`)
   - Creates system prompt (cacheable, instruction-focused)
   - Creates user message (code + context, optionally cacheable)
   - Separates static vs dynamic content for caching efficiency

3. **Claude Generation**
   - Calls `claudeClient.generate()` or `claudeClient.generateWithStreaming()`
   - Passes caching options to enable cost savings

4. **Attribution Addition**
   - Appends tier-based footer:
     - **Free:** Shows watermark with upgrade link
     - **Pro:** Minimal attribution
     - **Team:** Minimal attribution
     - **Enterprise:** No attribution

5. **Quality Scoring** (via `calculateQualityScore`)
   - Scores documentation against 5 criteria (100 points total)
   - Returns grade (A-F) and improvement suggestions

**Response Object:**
```javascript
{
  documentation: string,           // Doc text + attribution
  qualityScore: {
    score: number,                // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F',
    breakdown: {
      overview: { points, maxPoints, status },
      installation: { points, maxPoints, status },
      examples: { count, points, maxPoints, status },
      apiDocs: { coveragePercent, points, maxPoints, status },
      structure: { headers, points, maxPoints, status }
    }
  },
  analysis: { functions, classes, exports, complexity, ... },
  metadata: {
    language: string,
    docType: string,
    generatedAt: ISO8601,
    codeLength: number,
    cacheEnabled: boolean,
    cacheUserMessage: boolean
  }
}
```

### Prompt Templates

All 4 doc types (README, JSDOC, API, ARCHITECTURE) have:

1. **System Prompt** (static, cacheable)
   - Role definition ("You are a technical documentation expert...")
   - Requirements (markdown formatting, Mermaid diagrams)
   - Specific rules per doc type

2. **User Message** (dynamic, optionally cacheable)
   - Code analysis context (function count, classes, exports, complexity)
   - Actual source code
   - Instructions for that specific doc type

**Example System Prompt (README):**
```
You are a technical documentation expert. Generate comprehensive 
README.md documentation for code.

Requirements:
1. Project Overview: Clear description of what the code does
2. Features: List key capabilities (bullet points)
3. Installation: Setup instructions if applicable
4. Usage: Practical examples showing how to use the code
5. API Documentation: Document all exported functions/classes
6. Code Examples: Include at least 2 working examples

IMPORTANT MARKDOWN FORMATTING RULES:
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
...
```

---

## 4. Prompt Caching Strategy

### Implementation Details

**System Prompt Caching (Always Used)**
- 1-hour TTL (ephemeral)
- Contains instruction set (~2K tokens typical)
- Cached across all requests for same doc type
- Expected to be hit frequently (multi-user pattern)

**User Message Caching (Selective)**
- Only when `isDefaultCode = true`
- Contains default/example code (e.g., React Counter component)
- Cached for 1 hour
- Reused when same example code detected by user

### Cache Stats Monitoring

Both methods log cache performance:
```javascript
console.log('[ClaudeClient] Cache stats:', {
  input_tokens: 123,
  cache_creation_input_tokens: 45,
  cache_read_input_tokens: 78
});
```

### Expected Cost Savings

From PROMPT-CACHING-GUIDE.md:
- System prompt caching: 90% reduction on repeated requests
- Estimated savings: $50-300/month depending on usage
- Cache hit rate improves with user count

---

## 5. API Endpoints Using Claude

### POST /api/generate

**Purpose:** Non-streaming documentation generation

**Route Handler:** `routes/api.js` (lines 25-69)

**Request Body:**
```json
{
  "code": "function greet(name) { return `Hello, ${name}!`; }",
  "docType": "README",
  "language": "javascript",
  "isDefaultCode": false
}
```

**Response:**
```json
{
  "documentation": "# Documentation\n\n...",
  "qualityScore": { "score": 85, "grade": "B", ... },
  "analysis": { ... },
  "metadata": { ... }
}
```

**Error Handling:**
- 400: Invalid code input (required, must be string, max 100K chars)
- 500: Generation failed (from ClaudeClient error)

### POST /api/generate-stream

**Purpose:** Streaming documentation generation with SSE

**Route Handler:** `routes/api.js` (lines 72-146)

**Key Differences:**
1. **SSE Headers:**
   ```
   Content-Type: text/event-stream
   Cache-Control: no-cache
   Connection: keep-alive
   X-Accel-Buffering: no
   ```

2. **Event Stream Format:**
   ```
   data: {"type":"connected"}
   data: {"type":"chunk","content":"# Documentation"}
   data: {"type":"chunk","content":"\n\nDetails..."}
   data: {"type":"chunk","content":"attribution footer"}
   data: {"type":"complete","qualityScore":85,"metadata":{...}}
   ```

3. **Attribution Handling:**
   - Generated separately as final chunk
   - Sent to client for proper formatting
   - Allows real-time feedback without buffering

### Usage Tracking

Both endpoints call `incrementUsage(userIdentifier)` after successful generation:
```javascript
const userIdentifier = req.user?.id || `ip:${req.ip || ...}`
await incrementUsage(userIdentifier)
```

This tracks:
- Daily generations (resets at midnight)
- Monthly generations (resets on 1st of month)

---

## 6. Request/Response Structures

### ClaudeClient Internal Request

**Non-Streaming:**
```javascript
{
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4000,
  messages: [{
    role: 'user',
    content: string | [{ type: 'text', text: string, cache_control?: {...} }]
  }],
  system?: [{ type: 'text', text: string, cache_control?: {...} }]
}
```

**Streaming:**
```javascript
{
  ...same as above...,
  stream: true  // Enables async iterator
}
```

### Anthropic SDK Response (Non-Streaming)

```javascript
{
  content: [{ type: 'text', text: 'Generated documentation...' }],
  usage: {
    input_tokens: 500,
    output_tokens: 800,
    cache_creation_input_tokens: 0,  // New cache created
    cache_read_input_tokens: 0       // Existing cache hit
  }
}
```

### Anthropic SDK Response (Streaming)

Events yielded from async iterator:
```javascript
// message_start event
{ 
  type: 'message_start',
  message: { usage: { input_tokens: 500, ... } }
}

// content_block_delta events
{
  type: 'content_block_delta',
  delta: { type: 'text_delta', text: 'chunk of text' }
}

// Other events
{ type: 'message_stop' }
{ type: 'content_block_stop' }
```

---

## 7. Error Handling Architecture

### Error Types Handled

| Error Type | Source | Handling | Retry |
|-----------|--------|----------|-------|
| **Rate Limit** | Anthropic (429) | Exponential backoff | Yes (up to 3x) |
| **Auth Error** | Anthropic (401) | Extract message, throw | No |
| **Malformed Response** | Anthropic | Log error, throw | Yes |
| **Network Error** | System | Extract message, throw | Yes |
| **Stream Interrupted** | Streaming | Error callback → SSE error event | No |
| **Parse Error** | CodeParser | Fall back to basic analysis | No (graceful) |

### Error Message Extraction

The `extractErrorMessage()` method attempts:
1. Parse JSON from error.message
2. Extract nested error.error.message
3. Extract flat error.message
4. Return generic message

**Example:**
```javascript
// Input error
Error {
  message: '400 {"error":{"type":"invalid_request_error","message":"Invalid token"}}'
}

// Output
"An error occurred while generating documentation"
// Actually returns parsed JSON string:
// '{"error":"invalid_request_error","message":"Invalid token"}'
```

### Client-Facing Error Responses

**Non-Streaming:**
```json
{
  "error": "Generation failed",
  "message": "user-friendly message from extractErrorMessage()"
}
```

**Streaming:**
```
data: {"type":"error","error":"Stream interrupted or generation failed"}
```

---

## 8. Dependency Injection & Testing

### Current Setup

**Singleton Instance Export:**
```javascript
// claudeClient.js
export { ClaudeClient }  // Class for testing
export default new ClaudeClient()  // Singleton for production
```

**DocGeneratorService:**
```javascript
// docGenerator.js
import claudeClient from './claudeClient.js'  // Uses singleton

export class DocGeneratorService { ... }
export default new DocGeneratorService()  // Singleton export
```

### Mocking in Tests

**claudeClient.test.js:**
```javascript
jest.mock('@anthropic-ai/sdk')  // Mock Anthropic SDK

mockAnthropicInstance = {
  messages: {
    create: jest.fn()
  }
}

Anthropic.mockImplementation(() => mockAnthropicInstance)
claudeClient = new ClaudeClient()
```

**docGenerator.test.js:**
```javascript
jest.mock('../claudeClient.js')
jest.mock('../codeParser.js')
jest.mock('../qualityScorer.js')

// Tests use mocked versions automatically
```

---

## 9. Configuration & Environment

### Required Environment Variables

```bash
# .env (server directory)
CLAUDE_API_KEY=sk-ant-...  # Anthropic API key
```

### Current Model Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| **API Version** | Latest (@anthropic-ai/sdk ^0.65.0) | Via npm |
| **Model** | claude-sonnet-4-5-20250929 | Hardcoded |
| **Max Tokens** | 4000 | Per request limit |
| **Context Window** | 200K tokens | Model capability (unused in config) |
| **Cache TTL** | 1 hour | Ephemeral cache only |

### Package Dependencies

```json
"@anthropic-ai/sdk": "^0.65.0"
```

No other LLM providers currently included.

---

## 10. Current Limitations & Constraints

### Architecture Constraints

1. **Single Provider (Anthropic Only)**
   - No abstraction layer for multi-provider support
   - No fallback mechanism to alternative providers
   - Model hardcoded in ClaudeClient

2. **No Configuration Management**
   - Model name hardcoded (not environment variable)
   - Max tokens hardcoded (4000)
   - Retry strategy hardcoded (3 retries, exponential backoff)

3. **Limited Streaming Flexibility**
   - SSE-only streaming (no WebSocket)
   - No streaming for non-streaming endpoint
   - Attribution added after streaming completes

4. **Prompt Caching Limitations**
   - Only 1-hour TTL (ephemeral)
   - No persistent cache management
   - No cache key strategy beyond code content

5. **Error Handling Gaps**
   - No rate limit backoff communication to client
   - No request queuing for throttling
   - Stream errors not recoverable

### Performance Characteristics

- **Latency:** 2-10 seconds typical (depends on code size and Claude response)
- **Throughput:** Limited by Anthropic tier (RPM/TPM limits)
- **Memory:** Entire response buffered in streaming (no streaming trim)
- **Cost:** System prompt cached (~90% savings on repeats)

---

## 11. Testing Coverage

### Unit Tests (claudeClient.test.js)

- 27 test cases covering:
  - Constructor initialization
  - Non-streaming generation (success, retries, errors)
  - Streaming generation (chunks, filtering, errors)
  - Sleep/timing utilities
  - Error handling (malformed, auth, network)
  - Integration scenarios (long prompts, special chars, concurrency)

### Integration Tests (docGenerator.test.js)

- Tests full generation pipeline
- Mocks Claude responses
- Verifies caching options passed to claudeClient
- Tests streaming vs non-streaming paths

---

## 12. Key Code Locations

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| **ClaudeClient Class** | `src/services/claudeClient.js` | 1-223 | Core API wrapper |
| **DocGeneratorService** | `src/services/docGenerator.js` | 1-702 | Orchestration logic |
| **API Routes** | `src/routes/api.js` | 25-146 | HTTP endpoints |
| **Code Parser** | `src/services/codeParser.js` | 1-96+ | AST analysis |
| **Quality Scorer** | `src/services/qualityScorer.js` | 1-100+ | Score calculation |
| **Tests (ClaudeClient)** | `src/services/__tests__/claudeClient.test.js` | 1-420 | Unit tests |
| **Tests (DocGenerator)** | `src/services/__tests__/docGenerator.test.js` | 1-150+ | Integration tests |

---

## 13. Data Flow Examples

### Example 1: Non-Streaming README Generation

```
User Request (POST /api/generate)
{
  code: "function add(a, b) { return a + b; }",
  docType: "README",
  language: "javascript"
}
    ↓
[api.js] parseBody, validate code
    ↓
[docGenerator.generateDocumentation()]
    ├─ parseCode(code, 'javascript')
    │  └─ Returns: { functions: [{ name: 'add', ... }], classes: [], ... }
    │
    ├─ buildPromptWithCaching(code, analysis, 'README', 'javascript')
    │  └─ Returns: {
    │       systemPrompt: "You are a technical documentation expert...",
    │       userMessage: "Generate a comprehensive README...\n```javascript\nfunction add(...)\n```"
    │     }
    │
    ├─ claudeClient.generate(userMessage, { systemPrompt, cacheUserMessage: false })
    │  └─ Anthropic SDK call (system prompt cached, user message not cached)
    │  └─ Returns: "# Add Function\n\n..." (800 tokens)
    │
    ├─ buildAttribution('free')
    │  └─ Returns: "\n\n---\n\n*🟣 Generated with [CodeScribe AI]...*"
    │
    ├─ Append attribution to documentation
    │
    └─ calculateQualityScore(docWithAttribution, analysis, 'README', code)
       └─ Returns: { score: 78, grade: 'C', breakdown: {...} }

Response (200 OK)
{
  documentation: "# Add Function\n\n...\n\n---\n\n*🟣 Generated with...*",
  qualityScore: { score: 78, grade: 'C', ... },
  analysis: { functions: [...], ... },
  metadata: { ... }
}
```

### Example 2: Streaming API Documentation

```
User Request (POST /api/generate-stream)
{
  code: "async function fetchUser(id) { ... }",
  docType: "API"
}
    ↓
[api.js] Set SSE headers, stream chunks
    ↓
Send: data: {"type":"connected"}
    ↓
[docGenerator.generateDocumentation(code, {
  docType: "API",
  streaming: true,
  onChunk: (chunk) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
  }
})]
    ├─ parseCode() → { functions: [fetchUser], ... }
    │
    ├─ buildPromptWithCaching()
    │  └─ System + User prompts for API docs
    │
    └─ claudeClient.generateWithStreaming(userMessage, onChunk, { systemPrompt })
       ├─ Opens streaming connection to Anthropic
       ├─ For each content_block_delta event:
       │  └─ Extract text chunk
       │  └─ Call onChunk(chunk)
       │     └─ res.write(`data: {...chunk...}\n\n`)
       │
       └─ Returns complete documentation string (accumulated from all chunks)
    
    ├─ buildAttribution('pro')
    │  └─ Returns: "Generated with CodeScribe AI..."
    │
    ├─ Send attribution as final chunk:
    │  └─ res.write(`data: ${JSON.stringify({ type: 'chunk', content: attribution })}\n\n`)
    │
    ├─ calculateQualityScore()
    │
    └─ Send completion:
       └─ res.write(`data: ${JSON.stringify({ type: 'complete', qualityScore: 85, ... })}\n\n`)

res.end()
```

---

## 14. Summary: Ready for Multi-Provider Abstraction

### What's Currently Tightly Coupled

1. **ClaudeClient** - Direct Anthropic SDK usage
2. **Model name** - Hardcoded 'claude-sonnet-4-5-20250929'
3. **Caching** - Anthropic-specific cache_control syntax
4. **Error extraction** - Anthropic error format parsing

### What's Already Abstracted

1. **API routes** - Don't care which provider
2. **DocGeneratorService** - Just calls claudeClient interface
3. **Prompts** - No provider-specific syntax
4. **Streaming** - Protocol-agnostic callback approach

### Recommended Abstraction Points

1. **LLMProvider interface:**
   ```javascript
   interface LLMProvider {
     generate(prompt, options) → Promise<string>
     generateWithStreaming(prompt, onChunk, options) → Promise<string>
   }
   ```

2. **Factory pattern:**
   ```javascript
   const provider = ProviderFactory.create(
     process.env.LLM_PROVIDER,  // 'anthropic' | 'openai' | 'bedrock'
     process.env.LLM_API_KEY,
     process.env.LLM_MODEL
   )
   ```

3. **Configuration:**
   ```javascript
   // Move hardcoded values to env
   LLM_PROVIDER=anthropic
   LLM_MODEL=claude-sonnet-4-5-20250929
   LLM_MAX_TOKENS=4000
   LLM_MAX_RETRIES=3
   ```

---

## 15. Integration Points Summary

### Where Claude is Used

| Endpoint | Method | Caching | Streaming | Error Handling |
|----------|--------|---------|-----------|-----------------|
| /api/generate | generate() | System + optional user | No | Retries + user message |
| /api/generate-stream | generateWithStreaming() | System + optional user | Yes (SSE) | Stream error events |

### Configuration Inputs

- `CLAUDE_API_KEY` - API authentication
- `NODE_ENV` - Test vs production

### Configuration Outputs

- `docType` - Determines system prompt
- `isDefaultCode` - Determines user message caching
- `userTier` - Determines attribution footer
- `streaming` - Determines generation method

---

**End of Analysis**
