# Multi-Provider LLM: Simplified Architecture

**A pragmatic, lightweight approach to supporting multiple LLM providers**

---

## Core Principle: KISS (Keep It Simple, Stupid)

Instead of building elaborate abstractions with base classes and factories, we'll use:
- ✅ **Config file** to specify provider
- ✅ **Single service** with conditional logic
- ✅ **Provider adapters** as simple functions (not classes)
- ✅ **~500 lines of code** instead of ~2,500

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONFIG FILE                              │
│                   (config/llm.config.js)                         │
│                                                                   │
│  {                                                               │
│    provider: 'claude',      // 'claude' | 'openai' | 'azure'    │
│    apiKey: process.env.CLAUDE_API_KEY,                          │
│    model: 'claude-sonnet-4-5-20250929',                         │
│    maxTokens: 4000,                                              │
│    maxRetries: 3                                                 │
│  }                                                               │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       LLM SERVICE                                │
│                  (services/llmService.js)                        │
│                                                                   │
│  async generate(prompt, options) {                               │
│    const config = getLLMConfig()                                 │
│                                                                   │
│    switch (config.provider) {                                    │
│      case 'claude':                                              │
│        return await generateWithClaude(prompt, options, config)  │
│      case 'openai':                                              │
│        return await generateWithOpenAI(prompt, options, config)  │
│      case 'azure-openai':                                        │
│        return await generateWithAzure(prompt, options, config)   │
│      default:                                                    │
│        throw new Error(`Unknown provider: ${config.provider}`)   │
│    }                                                             │
│  }                                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
server/
├── src/
│   ├── config/
│   │   └── llm.config.js              (100 lines) - Config management
│   ├── services/
│   │   ├── llm/
│   │   │   ├── llmService.js          (200 lines) - Main service with switch logic
│   │   │   ├── providers/
│   │   │   │   ├── claude.js          (100 lines) - Claude adapter functions
│   │   │   │   ├── openai.js          (100 lines) - OpenAI adapter functions
│   │   │   │   └── azure.js           (100 lines) - Azure adapter functions
│   │   │   └── utils.js               (50 lines)  - Shared utilities (retry, etc.)
│   │   ├── docGenerator.js            (UPDATED: use llmService)
│   │   └── claudeClient.js            (DEPRECATED or remove)
│   └── routes/
│       └── api.js                     (UPDATED: inject config)
└── __tests__/
    ├── llmService.test.js             (300 lines) - Test all providers
    └── docGenerator.test.js           (UPDATED)

**Total new code: ~650 lines + tests (vs 2,500+ in complex approach)**
```

---

## Implementation

### 1. Config File (config/llm.config.js)

```javascript
/**
 * LLM Provider Configuration
 * Change provider here to switch between Claude, OpenAI, Azure, etc.
 */

const LLM_PROVIDERS = {
  CLAUDE: 'claude',
  OPENAI: 'openai',
  AZURE: 'azure-openai'
}

const config = {
  // ============================================================================
  // PROVIDER SELECTION - Change this to switch providers
  // ============================================================================
  provider: process.env.LLM_PROVIDER || LLM_PROVIDERS.CLAUDE,

  // ============================================================================
  // COMMON SETTINGS (apply to all providers)
  // ============================================================================
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000', 10),
  maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3', 10),
  timeout: parseInt(process.env.LLM_TIMEOUT || '60000', 10),
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  topP: parseFloat(process.env.LLM_TOP_P || '1.0'),
  enableCaching: process.env.LLM_ENABLE_CACHING !== 'false',

  // ============================================================================
  // PROVIDER-SPECIFIC SETTINGS
  // ============================================================================
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || process.env.LLM_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
    supportsCaching: true,
    supportsStreaming: true
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-5.1',
    supportsCaching: false,
    supportsStreaming: true
  },

  'azure-openai': {
    apiKey: process.env.AZURE_OPENAI_API_KEY || process.env.LLM_API_KEY,
    model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    supportsCaching: false,
    supportsStreaming: true
  }
}

/**
 * Get current provider config
 */
function getLLMConfig() {
  const provider = config.provider
  const providerConfig = config[provider]

  if (!providerConfig) {
    throw new Error(
      `Unknown provider: "${provider}". ` +
      `Available: ${Object.keys(LLM_PROVIDERS).join(', ')}`
    )
  }

  if (!providerConfig.apiKey) {
    throw new Error(`API key required for provider "${provider}"`)
  }

  return {
    ...config,
    ...providerConfig,
    provider
  }
}

/**
 * Get provider capabilities
 */
function getProviderCapabilities(providerName = null) {
  const provider = providerName || config.provider
  const providerConfig = config[provider]

  return {
    supportsCaching: providerConfig?.supportsCaching || false,
    supportsStreaming: providerConfig?.supportsStreaming || false
  }
}

module.exports = {
  LLM_PROVIDERS,
  getLLMConfig,
  getProviderCapabilities
}
```

---

### 2. Main LLM Service (services/llm/llmService.js)

```javascript
const { getLLMConfig } = require('../../config/llm.config')
const { generateWithClaude, streamWithClaude } = require('./providers/claude')
const { generateWithOpenAI, streamWithOpenAI } = require('./providers/openai')
const { generateWithAzure, streamWithAzure } = require('./providers/azure')

/**
 * Unified LLM Service
 * Routes requests to the appropriate provider based on config
 */
class LLMService {
  constructor() {
    this.config = getLLMConfig()
  }

  /**
   * Generate text (non-streaming)
   *
   * @param {string} prompt - User prompt
   * @param {Object} options
   * @param {string} [options.systemPrompt] - System instructions
   * @param {boolean} [options.enableCaching] - Enable prompt caching (if supported)
   * @param {number} [options.maxTokens] - Override max tokens
   * @returns {Promise<{ text: string, metadata: Object }>}
   */
  async generate(prompt, options = {}) {
    const { provider } = this.config

    switch (provider) {
      case 'claude':
        return await generateWithClaude(prompt, options, this.config)

      case 'openai':
        return await generateWithOpenAI(prompt, options, this.config)

      case 'azure-openai':
        return await generateWithAzure(prompt, options, this.config)

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * Generate text with streaming
   *
   * @param {string} prompt
   * @param {Function} onChunk - Callback for each chunk: (chunk: string) => void
   * @param {Object} options - Same as generate()
   * @returns {Promise<{ text: string, metadata: Object }>}
   */
  async generateWithStreaming(prompt, onChunk, options = {}) {
    const { provider } = this.config

    switch (provider) {
      case 'claude':
        return await streamWithClaude(prompt, onChunk, options, this.config)

      case 'openai':
        return await streamWithOpenAI(prompt, onChunk, options, this.config)

      case 'azure-openai':
        return await streamWithAzure(prompt, onChunk, options, this.config)

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * Get current provider name
   */
  getProvider() {
    return this.config.provider
  }

  /**
   * Get current model
   */
  getModel() {
    return this.config.model
  }
}

module.exports = LLMService
```

---

### 3. Claude Adapter (services/llm/providers/claude.js)

```javascript
const Anthropic = require('@anthropic-ai/sdk')
const { retryWithBackoff, standardizeError } = require('../utils')

let claudeClient = null

/**
 * Get or create Claude client (singleton)
 */
function getClaudeClient(apiKey) {
  if (!claudeClient) {
    claudeClient = new Anthropic({ apiKey })
  }
  return claudeClient
}

/**
 * Generate with Claude (non-streaming)
 */
async function generateWithClaude(prompt, options, config) {
  const client = getClaudeClient(config.apiKey)
  const startTime = Date.now()

  try {
    const response = await retryWithBackoff(async () => {
      // Build messages
      const messages = [{ role: 'user', content: prompt }]

      // Add caching if enabled and supported
      if (options.enableCaching && config.enableCaching) {
        messages[0].content = [
          {
            type: 'text',
            text: prompt,
            cache_control: { type: 'ephemeral' }
          }
        ]
      }

      // Build request params
      const params = {
        model: config.model,
        max_tokens: options.maxTokens || config.maxTokens,
        messages
      }

      // Add system prompt with caching
      if (options.systemPrompt) {
        params.system = [
          {
            type: 'text',
            text: options.systemPrompt,
            cache_control: { type: 'ephemeral' }
          }
        ]
      }

      if (options.temperature !== undefined) params.temperature = options.temperature
      if (options.topP !== undefined) params.top_p = options.topP

      return await client.messages.create(params)
    }, config.maxRetries)

    // Extract text
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Build metadata
    return {
      text,
      metadata: {
        provider: 'claude',
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens || 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens || 0,
        wasCached: (response.usage.cache_read_input_tokens || 0) > 0,
        latencyMs: Date.now() - startTime
      }
    }
  } catch (error) {
    throw standardizeError(error, 'claude', 'generate')
  }
}

/**
 * Stream with Claude
 */
async function streamWithClaude(prompt, onChunk, options, config) {
  const client = getClaudeClient(config.apiKey)
  const startTime = Date.now()
  let fullText = ''
  let usage = null

  try {
    await retryWithBackoff(async () => {
      const messages = [{ role: 'user', content: prompt }]

      if (options.enableCaching && config.enableCaching) {
        messages[0].content = [
          {
            type: 'text',
            text: prompt,
            cache_control: { type: 'ephemeral' }
          }
        ]
      }

      const params = {
        model: config.model,
        max_tokens: options.maxTokens || config.maxTokens,
        messages,
        stream: true
      }

      if (options.systemPrompt) {
        params.system = [
          {
            type: 'text',
            text: options.systemPrompt,
            cache_control: { type: 'ephemeral' }
          }
        ]
      }

      const stream = await client.messages.stream(params)

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const chunk = event.delta.text || ''
          fullText += chunk
          onChunk(chunk)
        } else if (event.type === 'message_start') {
          usage = event.message.usage
        } else if (event.type === 'message_delta') {
          usage = { ...usage, ...event.usage }
        }
      }
    }, config.maxRetries)

    return {
      text: fullText,
      metadata: {
        provider: 'claude',
        model: config.model,
        inputTokens: usage?.input_tokens || 0,
        outputTokens: usage?.output_tokens || 0,
        cacheReadTokens: usage?.cache_read_input_tokens || 0,
        wasCached: (usage?.cache_read_input_tokens || 0) > 0,
        latencyMs: Date.now() - startTime
      }
    }
  } catch (error) {
    throw standardizeError(error, 'claude', 'stream')
  }
}

module.exports = {
  generateWithClaude,
  streamWithClaude
}
```

---

### 4. OpenAI Adapter (services/llm/providers/openai.js)

```javascript
const OpenAI = require('openai')
const { retryWithBackoff, standardizeError } = require('../utils')

let openaiClient = null

function getOpenAIClient(apiKey) {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

async function generateWithOpenAI(prompt, options, config) {
  const client = getOpenAIClient(config.apiKey)
  const startTime = Date.now()

  try {
    const response = await retryWithBackoff(async () => {
      const messages = []

      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt })
      }

      messages.push({ role: 'user', content: prompt })

      return await client.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature || config.temperature,
        top_p: options.topP || config.topP
      })
    }, config.maxRetries)

    return {
      text: response.choices[0].message.content,
      metadata: {
        provider: 'openai',
        model: response.model,
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        cacheReadTokens: 0,
        wasCached: false,
        latencyMs: Date.now() - startTime
      }
    }
  } catch (error) {
    throw standardizeError(error, 'openai', 'generate')
  }
}

async function streamWithOpenAI(prompt, onChunk, options, config) {
  const client = getOpenAIClient(config.apiKey)
  const startTime = Date.now()
  let fullText = ''

  try {
    await retryWithBackoff(async () => {
      const messages = []

      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt })
      }

      messages.push({ role: 'user', content: prompt })

      const stream = await client.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature || config.temperature,
        stream: true
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        if (delta) {
          fullText += delta
          onChunk(delta)
        }
      }
    }, config.maxRetries)

    return {
      text: fullText,
      metadata: {
        provider: 'openai',
        model: config.model,
        inputTokens: 0,  // OpenAI doesn't provide in streaming
        outputTokens: 0,
        wasCached: false,
        latencyMs: Date.now() - startTime
      }
    }
  } catch (error) {
    throw standardizeError(error, 'openai', 'stream')
  }
}

module.exports = {
  generateWithOpenAI,
  streamWithOpenAI
}
```

---

### 5. Shared Utilities (services/llm/utils.js)

```javascript
/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on auth errors or validation errors
      if (error.status === 401 || error.status === 400) {
        throw error
      }

      if (attempt === maxRetries) break

      const delayMs = Math.pow(2, attempt) * 1000
      console.log(`Retry attempt ${attempt + 1}/${maxRetries + 1} in ${delayMs}ms...`)
      await sleep(delayMs)
    }
  }

  throw lastError
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Standardize errors from different providers
 */
function standardizeError(error, provider, operation) {
  let message = `Error in ${provider} ${operation}`
  let statusCode = error.status || 500

  if (error.status === 401) {
    message = `Invalid ${provider} API key`
  } else if (error.status === 429) {
    message = `${provider} rate limit exceeded`
  } else if (error.message) {
    message = error.message
  }

  const standardError = new Error(message)
  standardError.provider = provider
  standardError.operation = operation
  standardError.statusCode = statusCode
  standardError.originalError = error

  return standardError
}

module.exports = {
  retryWithBackoff,
  standardizeError,
  sleep
}
```

---

### 6. Update DocGenerator (services/docGenerator.js)

```javascript
// OLD
const ClaudeClient = require('./claudeClient')

class DocGeneratorService {
  constructor() {
    this.claudeClient = new ClaudeClient()
  }

  async generateDocumentation(code, options = {}) {
    // ...
    const documentation = await this.claudeClient.generate(userMessage, {
      systemPrompt,
      cacheUserMessage: isDefaultCode
    })
    // ...
  }
}

// NEW
const LLMService = require('./llm/llmService')

class DocGeneratorService {
  constructor() {
    this.llmService = new LLMService()
  }

  async generateDocumentation(code, options = {}) {
    // ... (same prompt building)

    const result = await this.llmService.generate(userMessage, {
      systemPrompt,
      enableCaching: isDefaultCode
    })

    const documentation = result.text

    // ... (same quality scoring)

    return {
      documentation,
      qualityScore,
      analysis,
      metadata: {
        ...result.metadata,  // Includes provider, model, tokens, etc.
        usedDefaultCode: isDefaultCode
      }
    }
  }

  async generateDocumentationStream(code, onChunk, options = {}) {
    // ... (same prompt building)

    const result = await this.llmService.generateWithStreaming(
      userMessage,
      onChunk,
      {
        systemPrompt,
        enableCaching: isDefaultCode
      }
    )

    // ... (same post-processing)

    return {
      documentation: result.text,
      qualityScore,
      metadata: result.metadata
    }
  }
}
```

---

## Usage

### Switch Providers

**Option 1: Environment Variable (recommended)**
```bash
# server/.env
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-...

# To switch to OpenAI:
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

**Option 2: Direct Config Edit**
```javascript
// config/llm.config.js
const config = {
  provider: 'openai',  // Change this line
  // ...
}
```

### Test Different Providers

```bash
# Test with Claude (default)
npm run dev

# Test with OpenAI
LLM_PROVIDER=openai OPENAI_API_KEY=$OPENAI_API_KEY npm run dev

# Test with Azure
LLM_PROVIDER=azure-openai \
AZURE_OPENAI_API_KEY=$AZURE_KEY \
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com \
npm run dev
```

---

## Comparison: Simple vs Complex

| Aspect | Simple Approach (This) | Complex Approach (Base Classes) |
|--------|------------------------|--------------------------------|
| **Lines of Code** | ~650 lines | ~2,500 lines |
| **Implementation Time** | 2-3 hours | 12-14 hours |
| **Complexity** | Low (if/else) | High (inheritance, patterns) |
| **Adding Provider** | Add case + adapter file | Create new class extending base |
| **Testability** | Good (mock functions) | Excellent (mock classes) |
| **Maintainability** | Good (all logic visible) | Excellent (separated concerns) |
| **When to Use** | 2-5 providers | 5+ providers or complex logic |

---

## When to Upgrade to Complex Approach?

Consider the full abstraction when:
- ✅ You have 5+ LLM providers
- ✅ Provider-specific logic becomes complex (> 200 lines per adapter)
- ✅ You need runtime provider switching per-user
- ✅ You're building a platform where users bring their own API keys
- ✅ You need load balancing across providers
- ✅ You want A/B testing between providers

**For most projects: The simple approach is enough!**

---

## Testing

```javascript
// __tests__/llmService.test.js
const LLMService = require('../src/services/llm/llmService')

// Mock the config
jest.mock('../src/config/llm.config', () => ({
  getLLMConfig: () => ({
    provider: 'claude',
    apiKey: 'test-key',
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4000,
    maxRetries: 3
  })
}))

// Mock provider adapters
jest.mock('../src/services/llm/providers/claude', () => ({
  generateWithClaude: jest.fn().mockResolvedValue({
    text: 'Generated docs',
    metadata: { provider: 'claude', inputTokens: 100 }
  })
}))

describe('LLMService', () => {
  it('should generate with configured provider', async () => {
    const service = new LLMService()
    const result = await service.generate('Test prompt')

    expect(result.text).toBe('Generated docs')
    expect(result.metadata.provider).toBe('claude')
  })
})
```

---

## Migration Steps

### Step 1: Create Config (30 min)
- Create `config/llm.config.js`
- Add environment variables to `.env`

### Step 2: Create Service + Adapters (1-2 hours)
- Create `services/llm/llmService.js`
- Create `services/llm/providers/claude.js` (refactor from claudeClient)
- Create `services/llm/providers/openai.js`
- Create `services/llm/utils.js`

### Step 3: Update DocGenerator (30 min)
- Replace `claudeClient` with `llmService`
- Update method calls

### Step 4: Test (30 min)
- Test with Claude (should work exactly as before)
- Test with OpenAI (switch provider)
- Verify streaming works

**Total: 3-4 hours vs 12-14 hours with complex approach**

---

## Advantages of This Approach

✅ **Simple**: All logic visible in one place (switch statement)
✅ **Fast to implement**: 3-4 hours vs 12-14 hours
✅ **Easy to debug**: No inheritance chains to trace
✅ **Flexible**: Easy to add provider-specific logic in adapter
✅ **Testable**: Mock functions instead of classes
✅ **Maintainable**: Less code = less bugs
✅ **Pragmatic**: Right amount of abstraction for 2-5 providers

---

## Summary

The simple config-driven approach gives you:
- 75% less code (650 vs 2,500 lines)
- 75% less implementation time (3-4 vs 12-14 hours)
- Same flexibility (can switch providers)
- Easier to understand and maintain

**Unless you need 5+ providers or complex provider logic, this is the better choice!**

---

**Ready to implement? Start with Step 1 (create config file) and work through Step 4.**
