# Gemini Integration Implementation Guide

**Status:** Implementation Ready
**Target:** Add Google Gemini 2.0 Flash to CodeScribe AI's multi-provider LLM architecture
**Estimated Time:** 5-6 hours (2-3 hours implementation + 3 hours analytics)
**Last Updated:** November 21, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Add Gemini Provider (2-3 hours)](#phase-1-add-gemini-provider)
4. [Phase 2: Test with 1-2 Doc Types (1-2 days)](#phase-2-test-with-doc-types)
5. [Phase 3: Build Analytics (3 hours)](#phase-3-build-analytics)
6. [Phase 4: Gradual Rollout](#phase-4-gradual-rollout)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Plan](#rollback-plan)

---

## Overview

### What This Guide Covers

This guide walks through adding **Google Gemini 2.0 Flash** as a third LLM provider alongside Claude and OpenAI.

**Goals:**
- Add Gemini provider to multi-provider architecture
- Test quality on structured doc types (JSDOC, OPENAPI)
- Build analytics to track costs across 3 providers
- Achieve **63% cost savings** if Gemini quality is acceptable

**Expected Outcomes:**
- ✅ Gemini 2.0 Flash available for doc generation
- ✅ Cost tracking across Claude, OpenAI, AND Gemini
- ✅ Data-driven decision on which doc types work best with each provider
- ✅ Potential monthly savings: $80.99/month (from $128 → $47)

---

## Prerequisites

### 1. Get Gemini API Key

**Steps:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **"Create API Key"**
4. Copy the API key (format: `AIza...`)

**Pricing:**
- **Free tier**: 15 requests per minute (RPM), 1M tokens per day
- **Paid tier**: 2000 RPM, unlimited tokens, same pricing ($0.075/MTok input)

### 2. Install Gemini SDK

```bash
cd server
npm install @google/generative-ai
```

### 3. Current Architecture Understanding

Review these files to understand the multi-provider pattern:
- `server/src/services/llm/llmService.js` - Unified service
- `server/src/services/llm/providers/claude.js` - Claude adapter
- `server/src/services/llm/providers/openai.js` - OpenAI adapter
- `server/src/config/llm.config.js` - Provider configuration

---

## Phase 1: Add Gemini Provider

**Time:** 2-3 hours
**Goal:** Create Gemini adapter following same pattern as Claude/OpenAI

### Step 1.1: Create Gemini Provider File

Create `server/src/services/llm/providers/gemini.js`:

```javascript
/**
 * Google Gemini Provider Adapter
 * Supports Gemini 2.0 Flash, Gemini 1.5 Pro, and compatible models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { retryWithBackoff, standardizeError, estimateTokens } from '../utils.js';

// Singleton Gemini client
let geminiClient = null;

/**
 * Get or create Gemini client instance
 * @param {string} apiKey - Google API key
 * @returns {GoogleGenerativeAI} Gemini client instance
 */
function getGeminiClient(apiKey) {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Generate text with Gemini (non-streaming)
 *
 * @param {string} prompt - User message/prompt
 * @param {Object} options - Generation options
 * @param {string} [options.systemPrompt] - System instructions
 * @param {boolean} [options.enableCaching] - Ignored for Gemini (no prompt caching support yet)
 * @param {number} [options.maxTokens] - Override max tokens
 * @param {number} [options.temperature] - Sampling temperature
 * @param {number} [options.topP] - Nucleus sampling parameter
 * @param {Object} config - Provider configuration from llm.config.js
 * @returns {Promise<{text: string, metadata: Object}>}
 */
async function generateWithGemini(prompt, options = {}, config) {
  const client = getGeminiClient(config.apiKey);
  const startTime = Date.now();

  try {
    const response = await retryWithBackoff(async () => {
      // Get the generative model
      const model = client.getGenerativeModel({ model: config.model });

      // Build generation config
      const generationConfig = {
        maxOutputTokens: options.maxTokens || config.maxTokens,
      };

      // Add temperature if specified
      if (options.temperature !== undefined) {
        generationConfig.temperature = options.temperature;
      } else if (config.temperature !== undefined) {
        generationConfig.temperature = config.temperature;
      }

      // Add topP if specified
      if (options.topP !== undefined) {
        generationConfig.topP = options.topP;
      } else if (config.topP !== undefined) {
        generationConfig.topP = config.topP;
      }

      // Build request parts
      const parts = [];

      // Add system instruction if provided (Gemini handles this differently)
      if (options.systemPrompt) {
        parts.push({ text: `System: ${options.systemPrompt}\n\nUser: ${prompt}` });
      } else {
        parts.push({ text: prompt });
      }

      // Make API call
      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig,
      });

      return result.response;
    }, config.maxRetries, 'Gemini generate');

    // Extract text from response
    const text = response.text();

    // Extract token usage (if available)
    const usageMetadata = response.usageMetadata || {};

    // Build metadata
    const metadata = {
      provider: 'gemini',
      model: config.model,
      inputTokens: usageMetadata.promptTokenCount || estimateTokens(prompt),
      outputTokens: usageMetadata.candidatesTokenCount || estimateTokens(text),
      cacheReadTokens: 0,  // Gemini doesn't support prompt caching yet
      cacheWriteTokens: 0,
      wasCached: false,
      latencyMs: Date.now() - startTime,
      timestamp: new Date(),
      isEstimated: !usageMetadata.promptTokenCount  // Flag if we estimated tokens
    };

    return { text, metadata };

  } catch (error) {
    // Standardize error and throw
    throw standardizeError(error, 'gemini', 'generate');
  }
}

/**
 * Generate text with Gemini (streaming)
 *
 * @param {string} prompt - User message/prompt
 * @param {Function} onChunk - Callback for each text chunk: (chunk: string) => void
 * @param {Object} options - Generation options (same as generateWithGemini)
 * @param {Object} config - Provider configuration
 * @returns {Promise<{text: string, metadata: Object}>}
 */
async function streamWithGemini(prompt, onChunk, options = {}, config) {
  const client = getGeminiClient(config.apiKey);
  const startTime = Date.now();
  let fullText = '';
  let usageMetadata = null;

  try {
    await retryWithBackoff(async () => {
      // Get the generative model
      const model = client.getGenerativeModel({ model: config.model });

      // Build generation config
      const generationConfig = {
        maxOutputTokens: options.maxTokens || config.maxTokens,
      };

      // Add temperature if specified
      if (options.temperature !== undefined) {
        generationConfig.temperature = options.temperature;
      } else if (config.temperature !== undefined) {
        generationConfig.temperature = config.temperature;
      }

      // Add topP if specified
      if (options.topP !== undefined) {
        generationConfig.topP = options.topP;
      } else if (config.topP !== undefined) {
        generationConfig.topP = config.topP;
      }

      // Build request parts
      const parts = [];

      // Add system instruction if provided
      if (options.systemPrompt) {
        parts.push({ text: `System: ${options.systemPrompt}\n\nUser: ${prompt}` });
      } else {
        parts.push({ text: prompt });
      }

      // Create streaming request
      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts }],
        generationConfig,
      });

      // Process stream chunks
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(chunkText);

        // Capture usage metadata if available
        if (chunk.usageMetadata) {
          usageMetadata = chunk.usageMetadata;
        }
      }
    }, config.maxRetries, 'Gemini stream');

    // Build metadata
    // Note: Gemini may not provide token counts in streaming mode,
    // so we estimate them
    const systemPromptTokens = options.systemPrompt
      ? estimateTokens(options.systemPrompt)
      : 0;
    const promptTokens = estimateTokens(prompt);
    const outputTokens = estimateTokens(fullText);

    const metadata = {
      provider: 'gemini',
      model: config.model,
      inputTokens: usageMetadata?.promptTokenCount || (systemPromptTokens + promptTokens),
      outputTokens: usageMetadata?.candidatesTokenCount || outputTokens,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      wasCached: false,
      latencyMs: Date.now() - startTime,
      timestamp: new Date(),
      isEstimated: !usageMetadata?.promptTokenCount  // Flag to indicate token counts are estimated
    };

    return { text: fullText, metadata };

  } catch (error) {
    // Standardize error and throw
    throw standardizeError(error, 'gemini', 'stream');
  }
}

export {
  generateWithGemini,
  streamWithGemini
};
```

### Step 1.2: Update LLM Service

Update `server/src/services/llm/llmService.js` to support Gemini:

```javascript
// Add import at top
import { generateWithGemini, streamWithGemini } from './providers/gemini.js';

// Update generate() method switch statement
async generate(prompt, options = {}) {
  const provider = options.provider || this.config.provider;
  const requestConfig = this._buildRequestConfig(provider, options);

  switch (provider) {
    case 'claude':
      return await generateWithClaude(prompt, options, requestConfig);

    case 'openai':
      return await generateWithOpenAI(prompt, options, requestConfig);

    case 'gemini':  // ADD THIS
      return await generateWithGemini(prompt, options, requestConfig);

    default:
      throw new Error(
        `Unsupported LLM provider: ${provider}. ` +
        `Supported providers: claude, openai, gemini`  // Update error message
      );
  }
}

// Update generateWithStreaming() method switch statement
async generateWithStreaming(prompt, onChunk, options = {}) {
  const provider = options.provider || this.config.provider;
  const requestConfig = this._buildRequestConfig(provider, options);

  switch (provider) {
    case 'claude':
      return await streamWithClaude(prompt, onChunk, options, requestConfig);

    case 'openai':
      return await streamWithOpenAI(prompt, onChunk, options, requestConfig);

    case 'gemini':  // ADD THIS
      return await streamWithGemini(prompt, onChunk, options, requestConfig);

    default:
      throw new Error(
        `Unsupported LLM provider: ${provider}. ` +
        `Supported providers: claude, openai, gemini`  // Update error message
      );
  }
}
```

### Step 1.3: Update Configuration

Update `server/src/config/llm.config.js`:

```javascript
const LLM_PROVIDERS = {
  CLAUDE: 'claude',
  OPENAI: 'openai',
  GEMINI: 'gemini'  // ADD THIS
}

const config = {
  provider: process.env.LLM_PROVIDER || LLM_PROVIDERS.CLAUDE,

  // ... existing common settings ...

  // ... existing claude and openai config ...

  // ADD THIS:
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY,
    model: process.env.GEMINI_MODEL || process.env.LLM_MODEL || 'gemini-2.0-flash-exp',
    supportsCaching: false,  // Gemini doesn't support prompt caching yet
    supportsStreaming: true
  }
}

// ADD THIS: Model pricing for analytics (single source of truth)
export const MODEL_PRICING = {
  // Claude models
  'claude-sonnet-4-5-20250929': {
    input: 3,
    output: 15,
    cacheRead: 0.30,
    cacheWrite: 3.75,
    supportsCaching: true
  },
  'claude-3-5-sonnet-20241022': {
    input: 3,
    output: 15,
    cacheRead: 0.30,
    cacheWrite: 3.75,
    supportsCaching: true
  },
  'claude-3-opus-20240229': {
    input: 15,
    output: 75,
    cacheRead: 1.50,
    cacheWrite: 18.75,
    supportsCaching: true
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
    cacheRead: 0.025,
    cacheWrite: 0.3125,
    supportsCaching: true
  },

  // OpenAI models
  'gpt-5.1': { input: 2, output: 10, supportsCaching: false },
  'gpt-4-turbo': { input: 10, output: 30, supportsCaching: false },
  'gpt-4': { input: 30, output: 60, supportsCaching: false },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50, supportsCaching: false },

  // Gemini models
  'gemini-2.0-flash-exp': { input: 0.075, output: 0.30, supportsCaching: false },
  'gemini-1.5-pro': { input: 1.25, output: 5.00, supportsCaching: false },
  'gemini-1.5-flash': { input: 0.075, output: 0.30, supportsCaching: false }
};

// Update getLLMConfig to validate gemini
function getLLMConfig() {
  // ... existing validation ...

  // ADD gemini to result
  const result = {
    provider,
    apiKey: providerConfig.apiKey,
    model: providerConfig.model,
    maxTokens: config.maxTokens,
    maxRetries: config.maxRetries,
    timeout: config.timeout,
    temperature: config.temperature,
    enableCaching: config.enableCaching,
    supportsCaching: providerConfig.supportsCaching,
    supportsStreaming: providerConfig.supportsStreaming,
    claude: config.claude,
    openai: config.openai,
    gemini: config.gemini  // ADD THIS
  }

  return result
}
```

### Step 1.4: Update Environment Variables

Update `server/.env.example`:

```bash
# ==============================================================================
# LLM Provider Configuration (Multi-Provider Support)
# ==============================================================================

# Provider Selection (claude, openai, or gemini)
LLM_PROVIDER=claude

# Provider API Keys
# Claude (Anthropic)
CLAUDE_API_KEY=sk-ant-api03-your-key-here

# OpenAI
OPENAI_API_KEY=sk-your-openai-key-here

# Google Gemini
GEMINI_API_KEY=AIza-your-gemini-key-here

# Model Selection (optional, uses provider defaults if not set)
# Claude: claude-sonnet-4-5-20250929, claude-3-5-sonnet-20241022, claude-3-haiku-20240307
# OpenAI: gpt-5.1, gpt-4-turbo, gpt-3.5-turbo
# Gemini: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash
# LLM_MODEL=claude-sonnet-4-5-20250929

# Common LLM Settings (apply to all providers)
# ... rest of settings ...
```

Add to your local `server/.env`:

```bash
GEMINI_API_KEY=AIza... # Your actual key from Google AI Studio
```

### Step 1.5: Write Tests

Create `server/src/services/llm/__tests__/gemini.test.js`:

```javascript
import { jest } from '@jest/globals';
import { generateWithGemini, streamWithGemini } from '../providers/gemini.js';

// Mock the Gemini SDK
jest.mock('@google/generative-ai');

describe('Gemini Provider', () => {
  describe('generateWithGemini', () => {
    it('should generate text successfully', async () => {
      // Mock implementation
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'Generated documentation',
          usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 200
          }
        }
      });

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }));

      const config = {
        apiKey: 'test-key',
        model: 'gemini-2.0-flash-exp',
        maxTokens: 4000,
        maxRetries: 3
      };

      const result = await generateWithGemini('Test prompt', {}, config);

      expect(result.text).toBe('Generated documentation');
      expect(result.metadata.provider).toBe('gemini');
      expect(result.metadata.inputTokens).toBe(100);
      expect(result.metadata.outputTokens).toBe(200);
      expect(result.metadata.wasCached).toBe(false);
    });

    it('should handle system prompts', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'Response',
          usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 100 }
        }
      });

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }));

      const config = { apiKey: 'test-key', model: 'gemini-2.0-flash-exp', maxTokens: 4000, maxRetries: 3 };
      const options = { systemPrompt: 'You are a helpful assistant' };

      await generateWithGemini('Test prompt', options, config);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                expect.objectContaining({
                  text: expect.stringContaining('System: You are a helpful assistant')
                })
              ])
            })
          ])
        })
      );
    });
  });

  describe('streamWithGemini', () => {
    it('should stream text successfully', async () => {
      const chunks = ['Generated ', 'documentation'];
      let chunkIndex = 0;

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield {
              text: () => chunk,
              usageMetadata: null
            };
          }
        }
      };

      const mockGenerateContentStream = jest.fn().mockResolvedValue({
        stream: mockStream
      });

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: mockGenerateContentStream
        })
      }));

      const config = { apiKey: 'test-key', model: 'gemini-2.0-flash-exp', maxTokens: 4000, maxRetries: 3 };
      const onChunk = jest.fn();

      const result = await streamWithGemini('Test prompt', onChunk, {}, config);

      expect(result.text).toBe('Generated documentation');
      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Generated ');
      expect(onChunk).toHaveBeenNthCalledWith(2, 'documentation');
      expect(result.metadata.provider).toBe('gemini');
    });
  });
});
```

Run tests:

```bash
cd server
npm test -- gemini.test.js
```

---

## Phase 2: Test with Doc Types

**Time:** 1-2 days
**Goal:** Validate Gemini quality on 1-2 structured doc types

### Step 2.1: Start with JSDOC (Simplest Doc Type)

Update `server/src/prompts/docTypeConfig.js`:

```javascript
export const DOC_TYPE_CONFIG = {
  // ... existing README, API, ARCHITECTURE ...

  JSDOC: {
    label: 'JSDoc Comments',
    active: true,
    provider: 'gemini',  // CHANGED from 'claude'
    model: 'gemini-2.0-flash-exp',  // CHANGED
    temperature: 0.3,
    // Reason: Highly structured output, test Gemini quality
  },

  // Keep OPENAPI on OpenAI for now (will compare later)
  OPENAPI: {
    label: 'OpenAPI (YAML)',
    active: true,
    provider: 'openai',  // Keep as-is
    model: 'gpt-5.1',
    temperature: 0.3,
  },
};
```

### Step 2.2: Generate Test Docs

Generate 10-20 JSDOC outputs with Gemini:

```bash
# Use CodeScribe UI to generate JSDoc for various codebases
# Or use the API directly for testing
curl -X POST http://localhost:3000/api/generate-stream \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a, b) { return a + b; }",
    "docType": "JSDOC",
    "language": "javascript"
  }'
```

### Step 2.3: Quality Validation Checklist

For each generated JSDOC:

**Accuracy:**
- [ ] Correctly identifies function parameters
- [ ] Correctly identifies return types
- [ ] Correctly describes what the function does
- [ ] No hallucinated features or parameters

**Completeness:**
- [ ] Includes `@param` for all parameters
- [ ] Includes `@returns` for return value
- [ ] Includes `@throws` if exceptions are thrown
- [ ] Includes `@example` if applicable

**Format:**
- [ ] Valid JSDoc syntax (no parse errors)
- [ ] Proper indentation
- [ ] Consistent style

**Quality Score:**
- [ ] Quality score ≥ 70 (minimum acceptable)
- [ ] Quality score ≥ 85 (excellent)

### Step 2.4: Compare vs Claude Sonnet

Generate the same docs with Claude Sonnet (temporarily change config back):

```javascript
JSDOC: {
  provider: 'claude',
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.3,
}
```

**Comparison Metrics:**

| Metric | Gemini 2.0 Flash | Claude Sonnet | Winner |
|--------|------------------|---------------|--------|
| Avg Quality Score | ___ | ___ | ___ |
| Accuracy (%) | ___ | ___ | ___ |
| Completeness (%) | ___ | ___ | ___ |
| Format Quality (%) | ___ | ___ | ___ |
| Avg Latency (ms) | ___ | ___ | ___ |
| Cost per Request | ___ | ___ | ___ |

**Decision Criteria:**

- ✅ **Keep Gemini** if: Quality score ≥ 90% of Claude's score
- ⚠️ **Monitor** if: Quality score is 80-90% of Claude's score
- ❌ **Revert to Claude** if: Quality score < 80% of Claude's score

### Step 2.5: Test OPENAPI Next (If JSDOC Passes)

If JSDOC quality is acceptable, test OPENAPI:

```javascript
OPENAPI: {
  provider: 'gemini',  // CHANGED from 'openai'
  model: 'gemini-2.0-flash-exp',
  temperature: 0.3,
}
```

Repeat quality validation and comparison with OpenAI GPT-5.1.

---

## Phase 3: Build Analytics

**Time:** 3 hours
**Goal:** Track costs across all 3 providers with self-maintaining system

### Step 3.1: Create Database Table

Create migration file `server/src/db/migrations/YYYY-MM-DD-create-llm-requests-table.sql`:

```sql
-- LLM Request Analytics Table
-- Tracks all LLM requests across all providers (Claude, OpenAI, Gemini, future providers)

CREATE TABLE IF NOT EXISTS llm_requests (
  id SERIAL PRIMARY KEY,

  -- Provider and model info
  provider VARCHAR(50) NOT NULL,  -- 'claude', 'openai', 'gemini'
  model VARCHAR(100) NOT NULL,    -- Full model identifier
  doc_type VARCHAR(50),            -- 'README', 'JSDOC', 'API', 'OPENAPI', 'ARCHITECTURE'

  -- Token usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,   -- Claude only
  cache_write_tokens INTEGER DEFAULT 0,  -- Claude only
  was_cached BOOLEAN DEFAULT FALSE,      -- Claude only

  -- Performance
  latency_ms INTEGER NOT NULL,

  -- Cost (calculated at request time)
  cost DECIMAL(10, 6) NOT NULL,  -- Pre-calculated cost in USD

  -- Metadata
  is_estimated BOOLEAN DEFAULT FALSE,  -- True if token counts are estimated
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT valid_provider CHECK (provider IN ('claude', 'openai', 'gemini'))
);

-- Indexes for performance
CREATE INDEX idx_llm_requests_timestamp ON llm_requests(timestamp DESC);
CREATE INDEX idx_llm_requests_provider_model ON llm_requests(provider, model);
CREATE INDEX idx_llm_requests_doc_type ON llm_requests(doc_type);
CREATE INDEX idx_llm_requests_provider_doc_type ON llm_requests(provider, doc_type);

-- Comments
COMMENT ON TABLE llm_requests IS 'Tracks LLM API requests across all providers for cost and performance analytics';
COMMENT ON COLUMN llm_requests.cost IS 'Pre-calculated cost in USD using MODEL_PRICING from llm.config.js';
COMMENT ON COLUMN llm_requests.is_estimated IS 'True when token counts are estimated (e.g., OpenAI/Gemini streaming)';
```

Run migration:

```bash
cd server
npm run migrate
```

### Step 3.2: Create Analytics Service

Create `server/src/services/llm/analytics.js`:

```javascript
/**
 * LLM Analytics Service
 * Tracks costs and performance across all LLM providers
 *
 * Features:
 * - Self-maintaining: Add new models to MODEL_PRICING in llm.config.js, analytics updates automatically
 * - Multi-provider: Supports Claude, OpenAI, Gemini, and future providers
 * - Cost calculation: Accurate per-model pricing with caching support
 */

import { sql } from '@vercel/postgres';
import { MODEL_PRICING } from '../../config/llm.config.js';

class LLMAnalytics {
  /**
   * Log an LLM request for analytics
   * @param {Object} metadata - Metadata from LLM response
   * @param {string} docType - Type of documentation generated
   */
  async logRequest(metadata, docType) {
    const cost = this.calculateCost(metadata);

    try {
      await sql`
        INSERT INTO llm_requests (
          provider,
          model,
          doc_type,
          input_tokens,
          output_tokens,
          cache_read_tokens,
          cache_write_tokens,
          was_cached,
          latency_ms,
          cost,
          is_estimated,
          timestamp
        ) VALUES (
          ${metadata.provider},
          ${metadata.model},
          ${docType},
          ${metadata.inputTokens},
          ${metadata.outputTokens},
          ${metadata.cacheReadTokens || 0},
          ${metadata.cacheWriteTokens || 0},
          ${metadata.wasCached || false},
          ${metadata.latencyMs},
          ${cost},
          ${metadata.isEstimated || false},
          ${metadata.timestamp}
        )
      `;
    } catch (error) {
      // Log error but don't fail the request
      console.error('[LLMAnalytics] Failed to log request:', error);
    }
  }

  /**
   * Calculate cost for an LLM request
   * DYNAMIC: Uses MODEL_PRICING from llm.config.js (single source of truth)
   * @param {Object} metadata - Metadata from LLM response
   * @returns {number} Cost in USD
   */
  calculateCost(metadata) {
    const pricing = this.getPricingForModel(metadata.model, metadata.provider);

    if (pricing.supportsCaching) {
      // Provider supports caching (e.g., Claude)
      const inputCost = (metadata.inputTokens - (metadata.cacheReadTokens || 0)) * pricing.input / 1_000_000;
      const cacheReadCost = (metadata.cacheReadTokens || 0) * pricing.cacheRead / 1_000_000;
      const cacheWriteCost = (metadata.cacheWriteTokens || 0) * pricing.cacheWrite / 1_000_000;
      const outputCost = metadata.outputTokens * pricing.output / 1_000_000;
      return inputCost + cacheReadCost + cacheWriteCost + outputCost;
    } else {
      // Standard pricing (no caching)
      const inputCost = metadata.inputTokens * pricing.input / 1_000_000;
      const outputCost = metadata.outputTokens * pricing.output / 1_000_000;
      return inputCost + outputCost;
    }
  }

  /**
   * Get pricing for a specific model
   * SELF-MAINTAINING: Add new models to MODEL_PRICING in llm.config.js, this updates automatically
   * @param {string} model - Model identifier
   * @param {string} provider - Provider name
   * @returns {Object} Pricing object
   */
  getPricingForModel(model, provider) {
    // Try to get pricing from MODEL_PRICING constant
    const pricing = MODEL_PRICING[model];

    if (pricing) {
      return pricing;
    }

    // Unknown model - log warning and use provider defaults
    console.warn(
      `[LLMAnalytics] Unknown model pricing: ${model} (${provider}). ` +
      `Using provider defaults. Add to MODEL_PRICING in llm.config.js for accurate costs.`
    );

    // Fallback to provider defaults (rough estimates)
    const PROVIDER_DEFAULTS = {
      'claude': { input: 3, output: 15, cacheRead: 0.30, cacheWrite: 3.75, supportsCaching: true },
      'openai': { input: 2, output: 10, supportsCaching: false },
      'gemini': { input: 0.075, output: 0.30, supportsCaching: false }
    };

    return PROVIDER_DEFAULTS[provider] || { input: 1, output: 5, supportsCaching: false };
  }

  /**
   * Get analytics for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Analytics results
   */
  async getAnalytics(startDate, endDate) {
    const results = await sql`
      SELECT
        provider,
        model,
        doc_type,
        COUNT(*) as requests,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cache_read_tokens) as total_cache_read_tokens,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost_per_request,
        AVG(latency_ms) as avg_latency_ms,
        SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) as cache_hits,
        ROUND(100.0 * SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate
      FROM llm_requests
      WHERE timestamp BETWEEN ${startDate} AND ${endDate}
      GROUP BY provider, model, doc_type
      ORDER BY total_cost DESC
    `;

    return results.rows;
  }

  /**
   * Get cost breakdown by provider
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Provider cost breakdown
   */
  async getCostByProvider(startDate, endDate) {
    const results = await sql`
      SELECT
        provider,
        COUNT(*) as requests,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost_per_request
      FROM llm_requests
      WHERE timestamp BETWEEN ${startDate} AND ${endDate}
      GROUP BY provider
      ORDER BY total_cost DESC
    `;

    return results.rows;
  }

  /**
   * Get cost breakdown by doc type
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Doc type cost breakdown
   */
  async getCostByDocType(startDate, endDate) {
    const results = await sql`
      SELECT
        doc_type,
        provider,
        model,
        COUNT(*) as requests,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost_per_request,
        AVG(latency_ms) as avg_latency_ms
      FROM llm_requests
      WHERE timestamp BETWEEN ${startDate} AND ${endDate}
      GROUP BY doc_type, provider, model
      ORDER BY doc_type, total_cost DESC
    `;

    return results.rows;
  }

  /**
   * Get cache effectiveness (Claude only)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheEffectiveness(startDate, endDate) {
    const results = await sql`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) as cache_hits,
        ROUND(100.0 * SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate,
        SUM(cache_read_tokens) as total_cache_read_tokens,
        SUM(input_tokens) as total_input_tokens
      FROM llm_requests
      WHERE provider = 'claude'
        AND timestamp BETWEEN ${startDate} AND ${endDate}
    `;

    return results.rows[0];
  }
}

export default new LLMAnalytics();
```

### Step 3.3: Integrate with DocGenerator

Update `server/src/services/docGenerator.js` to log requests:

```javascript
import llmAnalytics from './llm/analytics.js';  // ADD THIS IMPORT

export class DocGeneratorService {
  async generateDocumentation(code, options = {}) {
    // ... existing code ...

    // After getting result from LLM
    const result = streaming
      ? await this.llmService.generateWithStreaming(userMessage, onChunk, llmOptions)
      : await this.llmService.generate(userMessage, llmOptions);

    // ADD THIS: Log request for analytics
    try {
      await llmAnalytics.logRequest(result.metadata, docType);
    } catch (error) {
      // Don't fail the request if analytics fails
      console.error('[DocGenerator] Failed to log analytics:', error);
    }

    // ... rest of existing code ...
  }
}
```

### Step 3.4: Create Admin Dashboard Endpoint

Create `server/src/routes/admin.js` (or update existing):

```javascript
import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import llmAnalytics from '../services/llm/analytics.js';

const router = express.Router();

/**
 * GET /api/admin/llm-analytics
 * Get LLM cost and performance analytics
 */
router.get('/llm-analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      overallAnalytics,
      costByProvider,
      costByDocType,
      cacheEffectiveness
    ] = await Promise.all([
      llmAnalytics.getAnalytics(start, end),
      llmAnalytics.getCostByProvider(start, end),
      llmAnalytics.getCostByDocType(start, end),
      llmAnalytics.getCacheEffectiveness(start, end)
    ]);

    res.json({
      period: { startDate: start, endDate: end },
      overall: overallAnalytics,
      byProvider: costByProvider,
      byDocType: costByDocType,
      cacheEffectiveness
    });
  } catch (error) {
    console.error('[AdminRoutes] Error fetching LLM analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
```

### Step 3.5: Test Analytics

Generate some docs with all 3 providers, then query analytics:

```bash
# Generate docs with Gemini (JSDOC)
curl -X POST http://localhost:3000/api/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "docType": "JSDOC"}'

# Generate docs with Claude (README)
curl -X POST http://localhost:3000/api/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "docType": "README"}'

# Query analytics
curl http://localhost:3000/api/admin/llm-analytics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected response:

```json
{
  "period": {
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-21T23:59:59.999Z"
  },
  "overall": [
    {
      "provider": "claude",
      "model": "claude-sonnet-4-5-20250929",
      "doc_type": "README",
      "requests": 150,
      "total_cost": 45.50,
      "avg_cost_per_request": 0.0303,
      "cache_hit_rate": 85.0
    },
    {
      "provider": "gemini",
      "model": "gemini-2.0-flash-exp",
      "doc_type": "JSDOC",
      "requests": 200,
      "total_cost": 1.25,
      "avg_cost_per_request": 0.00625,
      "cache_hit_rate": 0.0
    }
  ],
  "byProvider": [...],
  "byDocType": [...],
  "cacheEffectiveness": {
    "total_requests": 150,
    "cache_hits": 128,
    "cache_hit_rate": 85.33
  }
}
```

---

## Phase 4: Gradual Rollout

**Timeline:** 2-4 weeks
**Goal:** Gradually move more doc types to Gemini based on quality data

### Week 1: JSDOC Only

```javascript
// docTypeConfig.js
JSDOC: { provider: 'gemini', model: 'gemini-2.0-flash-exp' }
```

**Monitor:**
- Quality scores vs Claude baseline
- User feedback
- Error rates
- Cost savings

### Week 2: Add OPENAPI (If JSDOC Successful)

```javascript
JSDOC: { provider: 'gemini' },
OPENAPI: { provider: 'gemini' }  // Switch from OpenAI
```

**Monitor:**
- YAML validity
- Schema completeness
- Compare vs OpenAI GPT-5.1

### Week 3: Add API Docs (If Both Pass)

```javascript
JSDOC: { provider: 'gemini' },
OPENAPI: { provider: 'gemini' },
API: { provider: 'gemini' }  // Switch from Claude
```

### Week 4: Consider ARCHITECTURE

```javascript
// Only if Gemini quality is consistently high
ARCHITECTURE: { provider: 'gemini' }  // Switch from Claude
```

**Keep on Claude:**
```javascript
README: { provider: 'claude' }  // Most creative doc type, keep Claude
```

### Optimization Decision Tree

```
For each doc type:
├── Quality Score ≥ 90% of Claude? ────── YES ──→ Switch to Gemini (63-97% cost savings)
│   └── NO ──→ Try GPT-3.5 Turbo (90% cheaper than GPT-5.1)
│       └── Quality good? ──→ YES ──→ Use GPT-3.5
│           └── NO ──→ Keep on Claude/GPT-5.1
```

---

## Troubleshooting

### Issue: `MODULE_NOT_FOUND: @google/generative-ai`

**Solution:**
```bash
cd server
npm install @google/generative-ai
```

### Issue: `Error: API key not valid`

**Symptoms:**
- 400 errors from Gemini API
- "API key not valid" message

**Solutions:**
1. Verify API key format: Should start with `AIza`
2. Check `.env` file has `GEMINI_API_KEY=AIza...`
3. Regenerate key in [Google AI Studio](https://makersuite.google.com/app/apikey)
4. Restart server after updating `.env`

### Issue: Rate limit errors (429)

**Symptoms:**
- `RESOURCE_EXHAUSTED` error
- "Quota exceeded" message

**Solutions:**
1. **Free tier limit**: 15 RPM, upgrade to paid tier for 2000 RPM
2. **Daily limit**: 1M tokens/day on free tier
3. **Implement backoff**: Already handled by `retryWithBackoff` in utils.js

### Issue: Quality is lower than Claude

**Symptoms:**
- Lower quality scores
- Missing information
- Incorrect formatting

**Solutions:**
1. **Adjust temperature**: Try 0.1-0.2 for more deterministic output
2. **Improve prompts**: Gemini may need different prompt phrasing
3. **Try Gemini 1.5 Pro**: Higher quality but more expensive ($1.25/MTok vs $0.075/MTok)
4. **Revert to Claude**: If quality gap is >20%, keep using Claude

### Issue: Streaming is slow

**Symptoms:**
- Slow time-to-first-token
- Choppy streaming

**Solutions:**
1. **Check network**: Ensure stable connection to Google APIs
2. **Try non-streaming**: Use `generate()` instead of `generateWithStreaming()`
3. **Monitor latency**: Check `metadata.latencyMs` in analytics

### Issue: Token counts are estimated

**Symptoms:**
- `metadata.isEstimated === true`
- `usageMetadata` not available

**Solutions:**
1. **Expected for streaming**: Gemini doesn't provide token counts in streaming mode
2. **Use non-streaming for accuracy**: If exact token counts matter
3. **Accept estimates**: ~4 chars/token heuristic is reasonably accurate

---

## Rollback Plan

If Gemini doesn't meet quality standards:

### Quick Rollback (Immediate)

Update `docTypeConfig.js`:

```javascript
// Revert JSDOC to Claude
JSDOC: {
  provider: 'claude',  // CHANGED back
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.3
}
```

No code changes needed - just update config!

### Full Rollback (Remove Gemini)

If you decide not to use Gemini at all:

1. **Revert docTypeConfig.js** to use Claude/OpenAI
2. **Remove gemini.js provider** (optional - can keep for future)
3. **Analytics still work** - historic Gemini data is preserved
4. **No database changes needed**

---

## Success Metrics

Track these metrics to validate Gemini integration:

### Quality Metrics
- [ ] Quality score ≥ 85% of Claude Sonnet
- [ ] Error rate < 2%
- [ ] User satisfaction maintained or improved

### Performance Metrics
- [ ] Latency acceptable (< 5 seconds for most docs)
- [ ] No timeout errors
- [ ] Cache hit rate tracked (even though Gemini doesn't cache)

### Cost Metrics
- [ ] Monthly costs reduced by 40-60%
- [ ] Cost per request reduced by 90%+ for Gemini doc types
- [ ] ROI achieved within 6-7 months

### Operational Metrics
- [ ] Analytics working for all 3 providers
- [ ] Dashboard showing accurate costs
- [ ] No increase in error rates or support tickets

---

## Next Steps After Implementation

1. **Monitor for 2 weeks** - Track quality, costs, errors
2. **Gather user feedback** - Ask users about doc quality
3. **Compare providers** - Use analytics to find best provider per doc type
4. **Optimize costs** - Switch more doc types to Gemini if quality is good
5. **Document learnings** - Update this guide with findings

---

## Related Documentation

- [LLM-GATEWAY-COMPARISON.md](./LLM-GATEWAY-COMPARISON.md) - Comparison of direct management vs AI Gateway, includes Gemini analysis
- [MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md](./MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md) - Current multi-provider architecture
- [PROMPT-CACHING-GUIDE.md](./PROMPT-CACHING-GUIDE.md) - Claude prompt caching strategy

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-21 | Claude | Initial implementation guide created |

---

**Questions or Issues?**

If you encounter any problems during implementation, check:
1. Troubleshooting section above
2. Google Gemini API docs: https://ai.google.dev/docs
3. CodeScribe test suite for reference patterns
4. Analytics dashboard for cost/quality insights

Good luck with the integration! 🚀
