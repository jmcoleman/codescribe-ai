# Multi-Provider LLM Implementation Prompt

**Purpose**: Step-by-step guide to implement multi-provider LLM support in CodeScribe AI

**Context**: See [MULTI-PROVIDER-LLM-ARCHITECTURE.md](./MULTI-PROVIDER-LLM-ARCHITECTURE.md) for complete design

---

## Quick Start: What Are We Building?

We're refactoring the LLM integration to support multiple providers (Claude, OpenAI, Azure, Bedrock) while:
- ✅ Maintaining current Claude implementation (zero breaking changes)
- ✅ Enabling runtime provider switching via environment variables
- ✅ Following SOLID principles (Strategy + Factory patterns)
- ✅ Preserving prompt caching and streaming capabilities

---

## Implementation Phases (8 Phases, ~8-12 hours)

### Phase 1: Create Base Abstraction (2-3 hours)

**Goal**: Create provider interface and utilities WITHOUT changing existing code.

#### Step 1.1: Create Directory Structure
```bash
cd server/src/services
mkdir -p llm/providers/{base,anthropic,openai}
mkdir -p llm/{factory,config,types}
```

#### Step 1.2: Implement Base Files

**File 1: `llm/providers/base/LLMError.js`** (50 lines)
```javascript
/**
 * Standard error class for all LLM operations.
 */
class LLMError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'LLMError'
    this.provider = details.provider
    this.operation = details.operation
    this.errorType = details.errorType || 'UNKNOWN'
    this.statusCode = details.statusCode
    this.retryAfter = details.retryAfter
    this.originalError = details.originalError
    this.timestamp = new Date()
  }

  isRetryable() {
    const retryableTypes = ['NETWORK', 'TIMEOUT', 'SERVER_ERROR', 'RATE_LIMIT']
    return retryableTypes.includes(this.errorType)
  }

  isRateLimit() { return this.errorType === 'RATE_LIMIT' }
  isAuthError() { return this.errorType === 'AUTH' }

  toJSON() {
    return {
      error: this.message,
      provider: this.provider,
      errorType: this.errorType,
      statusCode: this.statusCode,
      retryAfter: this.retryAfter
    }
  }
}

LLMError.Types = {
  AUTH: 'AUTH',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION: 'VALIDATION',
  TIMEOUT: 'TIMEOUT',
  NETWORK: 'NETWORK',
  SERVER_ERROR: 'SERVER_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  UNKNOWN: 'UNKNOWN'
}

module.exports = LLMError
```

**File 2: `llm/providers/base/RetryHelper.js`** (60 lines)
```javascript
/**
 * Exponential backoff retry logic (extracted from claudeClient.js).
 */
class RetryHelper {
  constructor(maxRetries = 3, backoffMultiplier = 2) {
    this.maxRetries = maxRetries
    this.backoffMultiplier = backoffMultiplier
  }

  async execute(fn, operation, provider) {
    let lastError

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        // Don't retry on non-retryable errors
        if (error.isRetryable && !error.isRetryable()) {
          throw error
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) break

        const delayMs = Math.pow(this.backoffMultiplier, attempt) * 1000

        console.log(
          `[${provider}] ${operation} failed (attempt ${attempt + 1}/${this.maxRetries + 1}), ` +
          `retrying in ${delayMs}ms...`
        )

        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    throw lastError
  }
}

module.exports = RetryHelper
```

**File 3: `llm/providers/base/BaseLLMProvider.js`** (200 lines)

See [MULTI-PROVIDER-LLM-ARCHITECTURE.md](./MULTI-PROVIDER-LLM-ARCHITECTURE.md#provider-interface-design) for full implementation.

Key methods to implement:
```javascript
class BaseLLMProvider {
  constructor(config) {
    // Validate config, initialize retry helper
  }

  // ABSTRACT (must be implemented by subclasses)
  async generate(prompt, options = {}) {
    throw new Error('Must implement generate()')
  }

  async generateWithStreaming(prompt, onChunk, options = {}) {
    throw new Error('Must implement generateWithStreaming()')
  }

  getCapabilities() {
    throw new Error('Must implement getCapabilities()')
  }

  // CONCRETE (provided by base class)
  _validateConfig(config) { /* ... */ }
  async _executeWithRetry(fn, operation) { /* ... */ }
  supportsStreaming() { return this.getCapabilities().streaming }
  supportsCaching() { return this.getCapabilities().caching }
  getProviderName() { return this.constructor.name.replace('Provider', '').toLowerCase() }
  getModel() { return this.config.model }
}
```

#### Step 1.3: Test Base Classes

Create `__tests__/llm/providers/base/LLMError.test.js`:
```javascript
const LLMError = require('../../../../src/services/llm/providers/base/LLMError')

describe('LLMError', () => {
  it('should create error with details', () => {
    const error = new LLMError('Test error', {
      provider: 'claude',
      errorType: LLMError.Types.RATE_LIMIT,
      statusCode: 429
    })

    expect(error.message).toBe('Test error')
    expect(error.isRateLimit()).toBe(true)
    expect(error.isRetryable()).toBe(true)
  })
})
```

**✅ Checkpoint**: Run tests → All pass

---

### Phase 2: Refactor ClaudeClient → ClaudeProvider (2-3 hours)

**Goal**: Move current Claude logic into new provider structure.

#### Step 2.1: Create ClaudeProvider

**File: `llm/providers/anthropic/ClaudeProvider.js`** (250 lines)

See [MULTI-PROVIDER-LLM-ARCHITECTURE.md](./MULTI-PROVIDER-LLM-ARCHITECTURE.md#1-claudeprovider-refactored-from-claudeclientjs) for full implementation.

**Migration checklist:**
- ✅ Copy logic from `claudeClient.js`
- ✅ Extend `BaseLLMProvider`
- ✅ Implement `generate()` with caching support
- ✅ Implement `generateWithStreaming()`
- ✅ Implement `getCapabilities()` → `{ streaming: true, caching: true, ... }`
- ✅ Add `_adaptError()` method (convert Anthropic errors to LLMError)
- ✅ Keep prompt caching logic (cache_control)

Key changes from original:
```javascript
// OLD (claudeClient.js)
async generate(prompt, options = {}) {
  const response = await this.client.messages.create({ /* ... */ })
  return response.content[0].text
}

// NEW (ClaudeProvider.js)
async generate(prompt, options = {}) {
  const result = await this._executeWithRetry(async () => {
    try {
      const response = await this.client.messages.create({ /* ... */ })
      return {
        text: response.content[0].text,
        metadata: {
          model: response.model,
          provider: 'claude',
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheReadTokens: response.usage.cache_read_input_tokens || 0,
          wasCached: (response.usage.cache_read_input_tokens || 0) > 0,
          latencyMs: Date.now() - startTime
        }
      }
    } catch (error) {
      throw this._adaptError(error, 'generate')
    }
  }, 'generate')
  return result
}
```

#### Step 2.2: Create Legacy Wrapper

**File: `claudeClient.js`** (UPDATED - keep for backward compatibility)
```javascript
const ClaudeProvider = require('./llm/providers/anthropic/ClaudeProvider')

/**
 * Legacy wrapper around ClaudeProvider.
 * @deprecated Use LLMFactory.createFromEnv() instead
 */
class ClaudeClient {
  constructor() {
    console.warn('[ClaudeClient] Deprecated. Use LLMFactory instead.')

    this.provider = new ClaudeProvider({
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
      maxTokens: 4000,
      maxRetries: 3
    })
  }

  async generate(prompt, options = {}) {
    const result = await this.provider.generate(prompt, {
      systemPrompt: options.systemPrompt,
      enableCaching: options.cacheUserMessage
    })
    return result.text  // Keep old interface (just text, no metadata)
  }

  async generateWithStreaming(prompt, onChunk, options = {}) {
    const result = await this.provider.generateWithStreaming(prompt, onChunk, {
      systemPrompt: options.systemPrompt,
      enableCaching: options.cacheUserMessage
    })
    return result.text
  }
}

module.exports = ClaudeClient
```

#### Step 2.3: Test ClaudeProvider

Create `__tests__/llm/providers/anthropic/ClaudeProvider.test.js` (see architecture doc for full example).

**✅ Checkpoint**: Run existing tests → Should pass with wrapper

---

### Phase 3: Create Factory & Config (1-2 hours)

**Goal**: Enable runtime provider switching.

#### Step 3.1: Implement LLMFactory

**File: `llm/factory/LLMFactory.js`** (150 lines)

```javascript
const ClaudeProvider = require('../providers/anthropic/ClaudeProvider')

class LLMFactory {
  constructor() {
    this.registry = new Map([
      ['anthropic', ClaudeProvider],
      ['claude', ClaudeProvider]
    ])
    this.instances = new Map()
  }

  register(name, ProviderClass) {
    this.registry.set(name.toLowerCase(), ProviderClass)
  }

  create(config) {
    const providerName = config.provider.toLowerCase()
    const ProviderClass = this.registry.get(providerName)

    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${config.provider}`)
    }

    // Singleton pattern
    const key = `${providerName}:${config.model}`
    if (this.instances.has(key)) {
      return this.instances.get(key)
    }

    const instance = new ProviderClass(config)
    this.instances.set(key, instance)
    return instance
  }

  createFromEnv(overrides = {}) {
    return this.create({
      provider: process.env.LLM_PROVIDER || 'anthropic',
      apiKey: process.env.LLM_API_KEY || process.env.CLAUDE_API_KEY,
      model: process.env.LLM_MODEL || 'claude-sonnet-4-5-20250929',
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000'),
      maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3'),
      ...overrides
    })
  }
}

const factory = new LLMFactory()
module.exports = factory
```

#### Step 3.2: Implement LLMConfig

**File: `llm/config/LLMConfig.js`** (100 lines)

See [MULTI-PROVIDER-LLM-ARCHITECTURE.md](./MULTI-PROVIDER-LLM-ARCHITECTURE.md#llm-config-module) for full implementation.

#### Step 3.3: Update .env

```bash
# Add to server/.env
LLM_PROVIDER=anthropic
LLM_API_KEY=${CLAUDE_API_KEY}
LLM_MODEL=claude-sonnet-4-5-20250929
LLM_MAX_TOKENS=4000
LLM_MAX_RETRIES=3
```

**✅ Checkpoint**: Test factory creation → Provider instantiates correctly

---

### Phase 4: Update DocGenerator (1 hour)

**Goal**: Use injected provider instead of direct ClaudeClient import.

#### Step 4.1: Refactor Constructor

**File: `services/docGenerator.js`** (UPDATED)

```javascript
// OLD
const ClaudeClient = require('./claudeClient')

class DocGeneratorService {
  constructor() {
    this.claudeClient = new ClaudeClient()
  }
}

// NEW
const llmFactory = require('./llm/factory/LLMFactory')

class DocGeneratorService {
  /**
   * @param {BaseLLMProvider} [llmProvider] - Injected provider (optional)
   */
  constructor(llmProvider = null) {
    this.llmProvider = llmProvider || llmFactory.createFromEnv()
  }
}
```

#### Step 4.2: Update Generation Methods

```javascript
// OLD
async generateDocumentation(code, options = {}) {
  // ... (prompt building)

  const documentation = await this.claudeClient.generate(userMessage, {
    systemPrompt: systemMessages,
    cacheUserMessage: isDefaultCode
  })

  // ... (quality scoring)
}

// NEW
async generateDocumentation(code, options = {}) {
  // ... (same prompt building)

  const result = await this.llmProvider.generate(userMessage, {
    systemPrompt: systemMessages,
    enableCaching: isDefaultCode
  })

  const documentation = result.text

  // ... (same quality scoring)

  return {
    documentation,
    qualityScore,
    analysis,
    metadata: {
      ...result.metadata,  // Now includes provider, tokens, latency
      usedDefaultCode: isDefaultCode
    }
  }
}
```

#### Step 4.3: Update Tests

```javascript
// __tests__/docGenerator.test.js (UPDATED)
const DocGeneratorService = require('../src/services/docGenerator')

describe('DocGeneratorService', () => {
  let mockProvider

  beforeEach(() => {
    // Mock provider instead of mocking claudeClient
    mockProvider = {
      generate: jest.fn(),
      generateWithStreaming: jest.fn(),
      getProviderName: () => 'mock',
      getModel: () => 'mock-model'
    }
  })

  it('should generate documentation', async () => {
    mockProvider.generate.mockResolvedValue({
      text: '# Generated Docs',
      metadata: { inputTokens: 100, outputTokens: 50, provider: 'mock' }
    })

    const docGenerator = new DocGeneratorService(mockProvider)
    const result = await docGenerator.generateDocumentation('code')

    expect(result.documentation).toContain('Generated')
    expect(result.metadata.provider).toBe('mock')
  })
})
```

**✅ Checkpoint**: Run tests → All pass with injected provider

---

### Phase 5: Update API Routes (1 hour)

**Goal**: Inject provider into request context via middleware.

#### Step 5.1: Create Middleware

**File: `middleware/llmProvider.js`** (NEW)
```javascript
const llmFactory = require('../services/llm/factory/LLMFactory')

/**
 * Middleware to inject LLM provider into request.
 */
function injectLLMProvider(req, res, next) {
  try {
    // Allow header-based provider override (for testing)
    const providerOverride = req.headers['x-llm-provider']
    const modelOverride = req.headers['x-llm-model']

    if (providerOverride || modelOverride) {
      req.llmProvider = llmFactory.create({
        provider: providerOverride || process.env.LLM_PROVIDER,
        apiKey: process.env.LLM_API_KEY,
        model: modelOverride || process.env.LLM_MODEL,
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000')
      })
    } else {
      req.llmProvider = llmFactory.createFromEnv()
    }

    next()
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initialize LLM provider',
      details: error.message
    })
  }
}

module.exports = injectLLMProvider
```

#### Step 5.2: Update Routes

**File: `routes/api.js`** (UPDATED)
```javascript
const injectLLMProvider = require('../middleware/llmProvider')
const DocGeneratorService = require('../services/docGenerator')

// Apply middleware to generation routes
router.use('/generate*', injectLLMProvider)

router.post('/generate', async (req, res) => {
  try {
    const { code, docType, language, isDefaultCode } = req.body

    // Inject provider from middleware
    const docGenerator = new DocGeneratorService(req.llmProvider)

    const result = await docGenerator.generateDocumentation(code, {
      docType,
      language,
      isDefaultCode
    })

    res.json(result)
  } catch (error) {
    // ... (same error handling)
  }
})
```

**✅ Checkpoint**: Test API → Generation works with injected provider

---

### Phase 6: Add OpenAI Provider (2 hours)

**Goal**: Implement alternative provider to validate abstraction.

#### Step 6.1: Install OpenAI SDK
```bash
cd server
npm install openai
```

#### Step 6.2: Implement OpenAIProvider

**File: `llm/providers/openai/OpenAIProvider.js`** (200 lines)

See [MULTI-PROVIDER-LLM-ARCHITECTURE.md](./MULTI-PROVIDER-LLM-ARCHITECTURE.md#2-openaiprovider-example-alternative) for full implementation.

Key differences from Claude:
- No prompt caching support
- Different message format (system = separate message)
- Different streaming API
- Different error structure

#### Step 6.3: Register in Factory

```javascript
// llm/factory/LLMFactory.js (UPDATED)
const OpenAIProvider = require('../providers/openai/OpenAIProvider')

constructor() {
  this.registry = new Map([
    ['anthropic', ClaudeProvider],
    ['claude', ClaudeProvider],
    ['openai', OpenAIProvider],  // ADD THIS
    ['gpt', OpenAIProvider]       // Alias
  ])
}
```

#### Step 6.4: Test OpenAI Provider

```bash
# Test with OpenAI
LLM_PROVIDER=openai \
LLM_API_KEY=$OPENAI_API_KEY \
LLM_MODEL=gpt-4-turbo-preview \
npm test
```

**✅ Checkpoint**: Provider switching works → Can generate docs with OpenAI

---

### Phase 7: Testing & Validation (2 hours)

**Goal**: Comprehensive test coverage for all providers.

#### Step 7.1: Unit Tests (create these files)

1. `__tests__/llm/providers/base/BaseLLMProvider.test.js`
2. `__tests__/llm/providers/base/LLMError.test.js`
3. `__tests__/llm/providers/base/RetryHelper.test.js`
4. `__tests__/llm/providers/anthropic/ClaudeProvider.test.js`
5. `__tests__/llm/providers/openai/OpenAIProvider.test.js`
6. `__tests__/llm/factory/LLMFactory.test.js`

#### Step 7.2: Integration Tests

**File: `__tests__/llm/integration/provider-switching.test.js`**
```javascript
describe('Provider Switching', () => {
  it('should generate with Claude', async () => {
    const provider = llmFactory.create({
      provider: 'anthropic',
      apiKey: process.env.CLAUDE_API_KEY,
      model: 'claude-sonnet-4-5-20250929'
    })

    const docGenerator = new DocGeneratorService(provider)
    const result = await docGenerator.generateDocumentation('code')

    expect(result.metadata.provider).toBe('claude')
  })

  it('should generate with OpenAI', async () => {
    const provider = llmFactory.create({
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview'
    })

    const docGenerator = new DocGeneratorService(provider)
    const result = await docGenerator.generateDocumentation('code')

    expect(result.metadata.provider).toBe('openai')
  })
})
```

#### Step 7.3: E2E API Tests

```bash
# Test Claude via API
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code": "function add(a,b) { return a+b }", "docType": "README"}'

# Test OpenAI via API (header override)
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "X-LLM-Provider: openai" \
  -H "X-LLM-Model: gpt-4-turbo-preview" \
  -d '{"code": "function add(a,b) { return a+b }", "docType": "README"}'
```

**✅ Checkpoint**: All tests pass → 95%+ coverage

---

### Phase 8: Documentation & Deployment (1 hour)

#### Step 8.1: Update Documentation

1. **Update `CLAUDE.md`**:
```markdown
## LLM Provider Configuration

CodeScribe AI supports multiple LLM providers:
- Anthropic Claude (default)
- OpenAI GPT-4
- Azure OpenAI
- AWS Bedrock (coming soon)

### Configuration
Set environment variables in `server/.env`:
```bash
LLM_PROVIDER=anthropic  # or 'openai', 'azure-openai'
LLM_API_KEY=your-api-key
LLM_MODEL=claude-sonnet-4-5-20250929  # or 'gpt-4-turbo-preview'
```

### Switching Providers
Change `LLM_PROVIDER` and restart server. No code changes needed.

See [MULTI-PROVIDER-LLM-ARCHITECTURE.md](docs/architecture/MULTI-PROVIDER-LLM-ARCHITECTURE.md) for details.
```

2. **Update `.env.example`**:
```bash
# LLM Provider Configuration
LLM_PROVIDER=anthropic              # anthropic, openai, azure-openai
LLM_API_KEY=                        # Your API key
LLM_MODEL=claude-sonnet-4-5-20250929  # Model identifier

# Provider-specific (backward compatibility)
CLAUDE_API_KEY=                     # Anthropic API key
OPENAI_API_KEY=                     # OpenAI API key

# Optional settings
LLM_MAX_TOKENS=4000
LLM_MAX_RETRIES=3
LLM_TIMEOUT=60000
LLM_ENABLE_CACHING=true
```

3. **Update API docs** (if provider metadata exposed):
```json
// Response includes provider info
{
  "documentation": "...",
  "qualityScore": 85,
  "metadata": {
    "provider": "claude",
    "model": "claude-sonnet-4-5-20250929",
    "inputTokens": 500,
    "outputTokens": 1000,
    "wasCached": true,
    "latencyMs": 1250
  }
}
```

#### Step 8.2: Deprecate ClaudeClient

Add deprecation notice:
```javascript
/**
 * @deprecated Since v3.0.0. Use LLMFactory instead.
 * This file will be removed in v4.0.0.
 *
 * Migration:
 *   const client = new ClaudeClient()
 *   → const provider = llmFactory.createFromEnv()
 */
```

#### Step 8.3: Deploy

```bash
# Run full test suite
cd server && npm test

# Deploy to Vercel
git add .
git commit -m "feat: multi-provider LLM support (Claude, OpenAI)"
git push origin main
```

**✅ Final Checkpoint**: Production deployment successful

---

## Testing Your Implementation

### Quick Validation

1. **Test Claude (default)**:
```bash
cd server
npm test
npm run dev
# Should work exactly as before
```

2. **Test OpenAI**:
```bash
LLM_PROVIDER=openai \
LLM_API_KEY=$OPENAI_API_KEY \
LLM_MODEL=gpt-4-turbo-preview \
npm run dev
# Generate docs → Should use OpenAI
```

3. **Test provider switching**:
```bash
# Terminal 1: Start server with Claude
npm run dev

# Terminal 2: Test with Claude
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"hi\")", "docType": "README"}'

# Test with OpenAI (header override)
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "X-LLM-Provider: openai" \
  -d '{"code": "console.log(\"hi\")", "docType": "README"}'
```

### Test Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| BaseLLMProvider | 95% | ⬜ |
| LLMError | 100% | ⬜ |
| RetryHelper | 95% | ⬜ |
| ClaudeProvider | 90% | ⬜ |
| OpenAIProvider | 90% | ⬜ |
| LLMFactory | 95% | ⬜ |
| DocGenerator (updated) | 95% | ⬜ |
| API routes (updated) | 90% | ⬜ |

---

## Troubleshooting

### Common Issues

**Issue**: "Unknown provider: openai"
```bash
# Fix: Register provider in factory
// llm/factory/LLMFactory.js
this.registry.set('openai', OpenAIProvider)
```

**Issue**: "API key required for anthropic"
```bash
# Fix: Set environment variable
export LLM_API_KEY=$CLAUDE_API_KEY
# or
export CLAUDE_API_KEY=sk-ant-...
```

**Issue**: Tests fail after refactoring
```bash
# Fix: Update mocks to use provider interface
mockProvider = {
  generate: jest.fn().mockResolvedValue({
    text: 'Generated text',
    metadata: { provider: 'mock', inputTokens: 100 }
  })
}
```

**Issue**: Caching not working with OpenAI
```bash
# Expected: OpenAI doesn't support explicit prompt caching
# Check: provider.supportsCaching() returns false
```

---

## Success Criteria

✅ **Phase 1-3 Complete**: Base abstraction + Claude refactor
✅ **Phase 4-5 Complete**: DocGenerator + API routes updated
✅ **Phase 6 Complete**: OpenAI provider working
✅ **Phase 7 Complete**: 95%+ test coverage
✅ **Phase 8 Complete**: Documentation + deployment

### Validation Checklist

- ✅ All existing tests pass (no breaking changes)
- ✅ Can switch providers via environment variable
- ✅ Can switch providers via API header (X-LLM-Provider)
- ✅ Claude caching still works (cache hit metrics in response)
- ✅ Streaming works with both providers
- ✅ Error handling consistent across providers
- ✅ Retry logic works for transient errors
- ✅ Performance overhead < 5% (measure with profiler)
- ✅ Documentation updated (CLAUDE.md, .env.example)
- ✅ API response includes provider metadata

---

## Next Steps After Implementation

### Phase 9: Additional Providers (Optional)

1. **Azure OpenAI**: OpenAI-compatible with different endpoint
2. **AWS Bedrock**: Claude + other models via AWS
3. **Google Vertex AI**: PaLM 2, Gemini models
4. **Local Models**: Ollama, LM Studio integration

### Phase 10: Advanced Features

1. **Load balancing**: Distribute requests across providers
2. **Fallback chains**: If Claude fails, retry with OpenAI
3. **Cost optimization**: Route to cheapest provider based on request
4. **A/B testing**: Compare quality across providers
5. **Provider analytics**: Dashboard for usage, cost, latency

---

## Key Design Decisions

### Why Strategy Pattern?
- Each provider implements same interface
- Interchangeable at runtime
- Easy to add new providers

### Why Factory Pattern?
- Centralized provider creation
- Singleton instances for performance
- Environment-based configuration

### Why Dependency Injection?
- Testable (mock providers in tests)
- Flexible (can override per-request)
- Loosely coupled

### Why Keep Legacy Wrapper?
- Zero breaking changes
- Gradual migration path
- Remove in major version bump

---

## Questions?

- **Architecture**: See [MULTI-PROVIDER-LLM-ARCHITECTURE.md](./MULTI-PROVIDER-LLM-ARCHITECTURE.md)
- **Current Claude Implementation**: See [CLAUDE-INTEGRATION-ANALYSIS.md](./CLAUDE-INTEGRATION-ANALYSIS.md)
- **Project Context**: See [CLAUDE.md](../../CLAUDE.md)
- **API Documentation**: See [API-Reference.md](../api/API-Reference.md)

---

**Ready to implement? Start with Phase 1 and work sequentially through Phase 8.**
