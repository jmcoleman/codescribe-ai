# CodeScribe AI - Claude API Integration Quick Reference

## Core Files & Their Purposes

### 1. ClaudeClient Service
**File:** `/Users/jcoleman-mbp/Developer/projects/codescribe-ai/server/src/services/claudeClient.js`
**Lines:** 223 total

**What it does:**
- Wraps Anthropic SDK (@anthropic-ai/sdk)
- Provides 2 main generation methods: `generate()` and `generateWithStreaming()`
- Handles retries with exponential backoff (3 retries)
- Parses Anthropic errors into user-friendly messages
- Manages prompt caching (1-hour ephemeral TTL)

**Key Hardcoded Values:**
```javascript
this.model = 'claude-sonnet-4-5-20250929'  // Line 8
this.maxRetries = 3                        // Line 9
max_tokens: 4000                           // Line 78, 149
```

**Exported:**
```javascript
export { ClaudeClient }           // Class (for testing)
export default new ClaudeClient() // Singleton instance (for production)
```

---

### 2. DocGeneratorService
**File:** `/Users/jcoleman-mbp/Developer/projects/codescribe-ai/server/src/services/docGenerator.js`
**Lines:** 702 total

**What it does:**
- Orchestrates the documentation generation pipeline
- Calls parseCode() → buildPromptWithCaching() → claudeClient
- Adds tier-based attribution footers (lines 72-86)
- Manages 4 doc types with separate system/user prompts
- Handles both streaming and non-streaming paths

**Main Export:**
```javascript
class DocGeneratorService {
  async generateDocumentation(code, options = {})  // Line 12
  buildPromptWithCaching(code, analysis, docType, language)  // Line 422
  buildAttribution(tier)  // Line 72
}

export default new DocGeneratorService()
```

**Prompt Building Strategy:**
- System prompts (cacheable): Lines 437-656
- User messages (optionally cacheable): Lines 659-695
- Caching enabled when `isDefaultCode === true`

---

### 3. API Routes
**File:** `/Users/jcoleman-mbp/Developer/projects/codescribe-ai/server/src/routes/api.js`
**Lines:** 593 total

**POST /api/generate (Non-Streaming)**
- Lines: 25-69
- Calls: `docGenerator.generateDocumentation(code, { streaming: false })`
- Returns: JSON with documentation, qualityScore, analysis, metadata

**POST /api/generate-stream (Streaming via SSE)**
- Lines: 72-146
- Calls: `docGenerator.generateDocumentation(code, { streaming: true, onChunk })`
- Headers: Content-Type: text/event-stream
- Events: connected → chunks → complete

**Both endpoints:**
- Track usage: `incrementUsage(userIdentifier)` (lines 54, 124)
- Support optional authentication via optionalAuth middleware
- Validate code length (max 100,000 chars)

---

## Request/Response Flow Diagrams

### Non-Streaming Flow

```
POST /api/generate
{
  code: "...",
  docType: "README",
  language: "javascript",
  isDefaultCode: false
}
         ↓
[API Route] (api.js:25)
         ↓
[DocGeneratorService.generateDocumentation()]
    ├─ parseCode(code, 'javascript')
    │      ↓
    │  [Acorn AST Parser] (codeParser.js)
    │      ↓
    │  Returns: { functions: [], classes: [], exports: [], ... }
    │
    ├─ buildPromptWithCaching(code, analysis, 'README', 'javascript')
    │      ↓
    │  Returns: {
    │    systemPrompt: "You are a technical documentation expert...",
    │    userMessage: "Generate README for:\n```javascript\n...\n```"
    │  }
    │
    ├─ claudeClient.generate(userMessage, {
    │    systemPrompt,
    │    cacheUserMessage: false
    │  })
    │      ↓
    │  [ClaudeClient.generate()] (claudeClient.js:69)
    │      ↓
    │  [Anthropic SDK] messages.create({
    │    model: 'claude-sonnet-4-5-20250929',
    │    max_tokens: 4000,
    │    system: [{ type: 'text', text: ..., cache_control: {...} }],
    │    messages: [{ role: 'user', content: ... }]
    │  })
    │      ↓
    │  Returns: { content: [{ text: '# Documentation...' }], usage: {...} }
    │      ↓
    │  Return accumulated text from all content blocks
    │
    ├─ buildAttribution(req.user?.tier || 'free')
    │      ↓
    │  Returns: tier-specific footer string
    │
    ├─ Append attribution to documentation
    │
    └─ calculateQualityScore(docWithAttribution, analysis, 'README', code)
           ↓
        Returns: { score: 85, grade: 'B', breakdown: {...} }

         ↓
Response 200 OK
{
  documentation: "# Documentation...\n\n---\n\n*Generated with...*",
  qualityScore: { score: 85, grade: 'B', breakdown: {...} },
  analysis: { functions: [], classes: [], ... },
  metadata: {
    language: 'javascript',
    docType: 'README',
    generatedAt: '2025-11-13T...',
    codeLength: 1234,
    cacheEnabled: true,
    cacheUserMessage: false
  }
}
```

### Streaming Flow

```
POST /api/generate-stream
{
  code: "...",
  docType: "API",
  isDefaultCode: true  // Enable user message caching
}
         ↓
[API Route] (api.js:72)
Set SSE headers:
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
         ↓
Send: data: {"type":"connected"}
         ↓
[DocGeneratorService.generateDocumentation(..., {
  streaming: true,
  onChunk: (chunk) => {
    res.write(`data: ${JSON.stringify({
      type: 'chunk',
      content: chunk
    })}\n\n`)
  }
})]
    ├─ parseCode()
    │
    ├─ buildPromptWithCaching()
    │
    └─ claudeClient.generateWithStreaming(userMessage, onChunk, {
         systemPrompt,
         cacheUserMessage: true  // Cache default code
       })
             ↓
        [ClaudeClient.generateWithStreaming()] (claudeClient.js:142)
             ↓
        [Anthropic SDK] messages.create({
          ...same request...,
          stream: true
        })
             ↓
        AsyncIterator over stream events
             ↓
        for await (const event of stream) {
          if (event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta') {
            onChunk(event.delta.text)
            // ↓ Calls route's onChunk
            // res.write(`data: {...chunk...}\n\n`)
          }
        }
             ↓
        Return accumulated text
         │
    ├─ buildAttribution('team')
    │      ↓
    │  Returns: minimal attribution
    │
    ├─ res.write(attribution as chunk)
    │
    ├─ calculateQualityScore()
    │
    └─ res.write({
         type: 'complete',
         qualityScore: 85,
         metadata: {...}
       })

         ↓
res.end()

Client receives SSE events:
  data: {"type":"chunk","content":"# API"}
  data: {"type":"chunk","content":"\n\nDocumentation..."}
  data: {"type":"chunk","content":"attribution"}
  data: {"type":"complete","qualityScore":85,...}
```

---

## Caching Architecture

### System Prompt Caching (Always Enabled)

**Cached Content:**
- Instructions for doc type (README, API, JSDOC, ARCHITECTURE)
- Markdown formatting rules
- Mermaid diagram examples
- Quality scoring guidance
- Typical size: ~1,500-2,000 tokens

**Cache Control:**
```javascript
cache_control: {
  type: 'ephemeral',
  ttl: '1h'  // 1-hour time-to-live
}
```

**Performance:**
- First request: Creates cache (counts as input tokens)
- Subsequent requests (within 1 hour): Reads from cache (90% cost reduction)
- Across all doc types for same user session

### User Message Caching (Conditional)

**When Enabled:**
- `isDefaultCode === true` (line 18, docGenerator.js)
- Used for example/sample code in UI
- React Counter, Hello World, etc.

**Cache Control:**
```javascript
content: cacheUserMessage
  ? [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral', ttl: '1h' } }]
  : prompt
```

**Hit Rate:**
- Higher with repeated default code usage
- Benefits from multi-user deployments
- Cache warm with 1+ request/hour

---

## Error Handling Chain

### Path: Generate Request Error

```
claudeClient.generate()
    ↓
Try: this.client.messages.create(requestParams)
    ↓
Catch (error)
    ├─ retries < maxRetries? (3)
    │      ↓ YES
    │  await sleep(2^retries * 1000)
    │  Retry loop back to Try
    │      ↓ NO
    │  Continue to error handling below
    │
    ├─ console.error('[ClaudeClient] Full API error after retries:', error)
    │
    ├─ userMessage = extractErrorMessage(error)
    │      ↓
    │  Attempts:
    │  1. Parse JSON from error.message (format: "400 {...}")
    │  2. Extract error.error.message (nested)
    │  3. Extract error.message (flat)
    │  4. Return generic: "An error occurred..."
    │
    ├─ enhancedError = new Error(userMessage)
    │  enhancedError.originalError = error  // Preserve for backend logging
    │
    └─ throw enhancedError

         ↓
[DocGeneratorService] catch (error)
    └─ Propagate to route

         ↓
[API Route] catch (error)
    └─ Response 500:
       {
         error: 'Generation failed',
         message: error.message  // User-friendly message
       }
```

### Path: Streaming Error

```
generateWithStreaming()
    ├─ stream = await this.client.messages.create({...stream: true})
    │
    └─ for await (const event of stream) {
         if (error during iteration)
             ↓
            Throw error
       }

         ↓
[DocGeneratorService] catch (error)
    └─ Propagate to route

         ↓
[API Route] catch (error)
    └─ res.write(`data: ${JSON.stringify({
         type: 'error',
         error: error.message
       })}\n\n`)
       res.end()
```

---

## Configuration Points

### Environment Variables

**Required:**
```bash
CLAUDE_API_KEY=sk-ant-...  # Anthropic API key
```

**Optional:**
```bash
NODE_ENV=production|development|test
```

### Hardcoded Values (Candidates for Configuration)

**In claudeClient.js:**
```javascript
line 8:   this.model = 'claude-sonnet-4-5-20250929'
line 9:   this.maxRetries = 3
line 78:  max_tokens: 4000
line 149: max_tokens: 4000
line 93:  ttl: '1h'
line 165: ttl: '1h'
line 153: ttl: '1h'
```

**In docGenerator.js:**
```javascript
line 93:  ttl: '1h'  // System prompt cache
```

---

## Testing Files & Coverage

### Unit Test: ClaudeClient
**File:** `/Users/jcoleman-mbp/Developer/projects/codescribe-ai/server/src/services/__tests__/claudeClient.test.js`
**Lines:** 420 total
**Test Cases:** 27

**Coverage Areas:**
- Constructor (3 tests)
- generate() method (8 tests)
  - Success cases
  - Retries with backoff
  - Error handling
  - Rate limits
- generateWithStreaming() method (8 tests)
  - Chunk accumulation
  - Event filtering
  - Error handling
- sleep() utility (2 tests)
- Error handling (3 tests)
- Integration scenarios (4 tests)

### Integration Test: DocGeneratorService
**File:** `/Users/jcoleman-mbp/Developer/projects/codescribe-ai/server/src/services/__tests__/docGenerator.test.js`
**Test Cases:** Multiple
**Mocking:**
- claudeClient.js (entire module)
- codeParser.js (entire module)
- qualityScorer.js (entire module)

**Coverage:**
- Full pipeline (parse → prompt → generate → score)
- Streaming path
- Non-streaming path
- Caching options passed correctly

---

## How to Trace a Request

### 1. Start at API Route
```
/server/src/routes/api.js
  ├─ Line 25: POST /api/generate handler
  ├─ Line 72: POST /api/generate-stream handler
  └─ Both call docGenerator.generateDocumentation()
```

### 2. Follow to Service
```
/server/src/services/docGenerator.js
  ├─ Line 12: generateDocumentation() entry point
  ├─ Line 23: Call parseCode()
  ├─ Line 26: Call buildPromptWithCaching()
  ├─ Line 36-42: Call claudeClient.generate() or generateWithStreaming()
  ├─ Line 46: Call buildAttribution()
  ├─ Line 50: Call calculateQualityScore()
  └─ Line 52-64: Return result object
```

### 3. Follow to ClaudeClient
```
/server/src/services/claudeClient.js
  ├─ Line 69: generate() method
  ├─ Line 142: generateWithStreaming() method
  ├─ Line 98: Call this.client.messages.create()
  ├─ Line 170: For streaming: iterate over events
  ├─ Line 17: extractErrorMessage() for errors
  └─ Line 216: sleep() for retries
```

### 4. Follow to CodeParser (Optional)
```
/server/src/services/codeParser.js
  ├─ Line 9: parseCode() entry point
  ├─ Line 17: Call acorn.parse() for JS/TS
  ├─ Line 41: Call walkAST() to extract structure
  ├─ Line 44: Calculate cyclomatic complexity
  └─ Line 47: Calculate overall complexity
```

---

## Key Interfaces

### ClaudeClient.generate()
```javascript
async generate(
  prompt: string,
  options?: {
    systemPrompt?: string,
    cacheUserMessage?: boolean
  }
): Promise<string>
```

### ClaudeClient.generateWithStreaming()
```javascript
async generateWithStreaming(
  prompt: string,
  onChunk: (chunk: string) => void,
  options?: {
    systemPrompt?: string,
    cacheUserMessage?: boolean
  }
): Promise<string>
```

### DocGeneratorService.generateDocumentation()
```javascript
async generateDocumentation(
  code: string,
  options?: {
    docType?: 'README' | 'JSDOC' | 'API' | 'ARCHITECTURE',
    language?: string,
    streaming?: boolean,
    onChunk?: (chunk: string) => void,
    isDefaultCode?: boolean,
    userTier?: 'free' | 'pro' | 'team' | 'enterprise'
  }
): Promise<{
  documentation: string,
  qualityScore: {...},
  analysis: {...},
  metadata: {...}
}>
```

---

## Files Available for Multi-Provider Refactoring

### Core Files to Abstract:
1. `/server/src/services/claudeClient.js` - Create interface
2. `/server/src/services/docGenerator.js` - Already abstractable (no provider coupling)

### Files to Modify:
1. `/server/src/routes/api.js` - Replace direct claudeClient import
2. `/server/.env` - Add LLM_PROVIDER, LLM_MODEL environment vars

### No Changes Needed:
1. `/server/src/services/codeParser.js` - Language agnostic
2. `/server/src/services/qualityScorer.js` - Scorer agnostic
3. All test files - Can mock the interface

---

**Document Location:** `/Users/jcoleman-mbp/Developer/projects/codescribe-ai/docs/architecture/CLAUDE-INTEGRATION-ANALYSIS.md`
