# Prompts Configuration System

This directory contains the external prompt files and configuration for CodeScribe AI's documentation generation system.

## Directory Structure

```
prompts/
├── README.md                   # This file
├── version.js                  # Prompt version tracking
├── promptLoader.js             # Loads prompts from files
├── docTypeConfig.js            # LLM provider/model configuration per doc type
├── system/                     # System prompts (cacheable)
│   ├── README.txt              # README documentation prompts
│   ├── JSDOC.txt               # JSDoc comments prompts
│   ├── API.txt                 # API documentation prompts
│   └── ARCHITECTURE.txt        # Architecture overview prompts
└── user/                       # User message templates
    ├── README.txt              # README user message template
    ├── JSDOC.txt               # JSDoc user message template
    ├── API.txt                 # API user message template
    └── ARCHITECTURE.txt        # Architecture user message template
```

## Per-Doc-Type LLM Configuration

**📖 See Full Guide:** [How to Add a New Doc Type](../../../docs/guides/ADD-NEW-DOC-TYPE.md)

**File:** `docTypeConfig.js`

Each documentation type can use a **different LLM provider and model**. This allows you to:
- Use Claude Sonnet for creative documentation (README, ARCHITECTURE)
- Use OpenAI GPT-5.1 for structured tasks (TESTS, CHANGELOG)
- Optimize costs by using cheaper models for simple tasks
- Set different temperatures for different doc types

### Current Configuration

```javascript
export const DOC_TYPE_CONFIG = {
  README: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.7,
  },
  JSDOC: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.3,
  },
  // ... etc
};
```

### Adding a New Doc Type

**Example: Adding a CHANGELOG doc type using OpenAI**

1. **Add prompts:**
   ```bash
   # Create system prompt
   echo "You are a changelog generator..." > system/CHANGELOG.txt

   # Create user message template
   echo "Generate a changelog for: {{code}}" > user/CHANGELOG.txt
   ```

2. **Configure LLM provider:**
   ```javascript
   // In docTypeConfig.js
   export const DOC_TYPE_CONFIG = {
     // ... existing doc types

     CHANGELOG: {
       provider: 'openai',           // Use OpenAI
       model: 'gpt-5.1',              // GPT-5.1 model
       temperature: 0.2,              // Low temp for structured output
       maxTokens: 1000,               // Optional: limit response length
     },
   };
   ```

3. **Load prompts in promptLoader.js:**
   ```javascript
   export function loadSystemPrompts() {
     return {
       // ... existing
       CHANGELOG: loadPrompt('system', 'CHANGELOG'),
     };
   }
   ```

4. **Restart server** to load new prompts

5. **Use it:**
   ```javascript
   const result = await docGenerator.generateDocumentation(code, {
     docType: 'CHANGELOG',
     language: 'javascript'
   });
   // Uses OpenAI GPT-5.1 automatically!
   ```

## Configuration Options

**Per doc type, you can configure:**

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `provider` | string | LLM provider | `'claude'` or `'openai'` |
| `model` | string | Model identifier | `'gpt-5.1'`, `'claude-sonnet-4-5-20250929'` |
| `temperature` | number | Randomness (0-1) | `0.7` (creative), `0.2` (structured) |
| `maxTokens` | number | Max response length | `4000`, `1000` |

## Environment Variables

**Required (at least one):**
```bash
# For Claude
CLAUDE_API_KEY=sk-ant-...

# For OpenAI
OPENAI_API_KEY=sk-...
```

**Optional overrides:**
```bash
# Default provider (if not specified per doc type)
LLM_PROVIDER=claude

# Default models (if not specified per doc type)
CLAUDE_MODEL=claude-sonnet-4-5-20250929
OPENAI_MODEL=gpt-5.1
```

## Response Metadata

Every API response includes the configuration used:

```json
{
  "documentation": "...",
  "qualityScore": 85,
  "metadata": {
    "provider": "openai",
    "model": "gpt-5.1",
    "promptVersion": "v1.1.0",
    "docTypeConfig": {
      "provider": "openai",
      "model": "gpt-5.1",
      "temperature": 0.2
    },
    "inputTokens": 500,
    "outputTokens": 1200
  }
}
```

## Prompt Versioning

**File:** `version.js`

Tracks prompt changes for rollback and analytics:

```javascript
export const PROMPT_VERSION = 'v1.1.0';
```

**When to increment:**
- Major changes to prompt structure → bump minor version (v1.1.0 → v1.2.0)
- Small wording tweaks → bump patch version (v1.1.0 → v1.1.1)
- New doc type added → bump minor version

## Template Variables

**User message templates** support variable substitution:

```
Generate a README for the following {{language}} code:

{{baseContext}}

Code to document:
```{{language}}
{{code}}
```
```

**Available variables:**
- `{{language}}` - Programming language (e.g., 'javascript')
- `{{code}}` - Source code to document
- `{{baseContext}}` - Analysis summary (functions, classes, complexity)

## Best Practices

### Temperature Guidelines

| Task Type | Temperature | Reasoning |
|-----------|-------------|-----------|
| Creative docs (README, ARCHITECTURE) | 0.6-0.8 | Need variety in examples and descriptions |
| Structured docs (API, JSDOC) | 0.3-0.5 | Balance structure with helpful examples |
| Deterministic (TESTS, CHANGELOG) | 0.1-0.3 | Consistent, predictable output |

### Cost Optimization

**Use cheaper models for simple tasks:**

```javascript
INLINE_COMMENTS: {
  provider: 'openai',
  model: 'gpt-5.1-mini',  // Cheaper, faster for short comments
  temperature: 0.3,
  maxTokens: 200,
},
```

**Use caching for frequently used prompts:**
- System prompts are always cached (90% cost reduction)
- Enable user message caching for example code: `isDefaultCode: true`

### Prompt Caching Strategy

**What gets cached:**
- ✅ System prompts (always)
- ✅ User messages when `isDefaultCode: true`
- ❌ User-provided code (changes every request)

**Claude caching savings:**
- Cached input: ~$0.30 per 1M tokens (90% discount)
- Regular input: ~$3.00 per 1M tokens

## Debugging

**Check which provider is being used:**

```javascript
// In logs
console.log(result.metadata.provider);     // 'claude' or 'openai'
console.log(result.metadata.model);        // 'gpt-5.1'
console.log(result.metadata.docTypeConfig); // Full config used
```

**Test a specific doc type:**

```bash
# From your app, generate docs and check metadata
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function hello() {}",
    "docType": "README"
  }' | jq '.metadata.docTypeConfig'
```

## Migration from Inline Prompts

**Before (v1.0.0):** Prompts hardcoded in `docGenerator.js` (~760 lines)

**After (v1.1.0):** External files + per-doc-type config
- System prompts: `prompts/system/*.txt`
- User templates: `prompts/user/*.txt`
- LLM config: `prompts/docTypeConfig.js`
- Benefits: Easy editing, A/B testing, version control, non-dev friendly

## Troubleshooting

**Error: "No config found for docType: X"**
- Add config to `DOC_TYPE_CONFIG` in `docTypeConfig.js`
- Or it will fall back to default Claude Sonnet (with warning)

**Error: "Unsupported LLM provider: X"**
- Check `provider` value in config (must be 'claude' or 'openai')
- Verify API key is set in environment

**Prompts not updating:**
- Prompts are loaded at server startup
- Restart server: `npm run dev`
- Check file paths are correct

**Wrong model being used:**
- Check `result.metadata.docTypeConfig` in response
- Verify config in `docTypeConfig.js`
- Check environment variables aren't overriding

## Examples

### Example 1: Using Different Providers for Different Doc Types

```javascript
// docTypeConfig.js
export const DOC_TYPE_CONFIG = {
  README: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.7,
  },
  TESTS: {
    provider: 'openai',  // Use OpenAI for test generation
    model: 'gpt-5.1',
    temperature: 0.2,    // Low temp for deterministic output
  },
};
```

### Example 2: Cost-Optimized Configuration

```javascript
// Use expensive model for complex tasks, cheap model for simple ones
export const DOC_TYPE_CONFIG = {
  ARCHITECTURE: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',  // Expensive but smart
    temperature: 0.7,
  },
  INLINE_COMMENTS: {
    provider: 'openai',
    model: 'gpt-5.1-mini',  // Cheap and fast
    temperature: 0.3,
    maxTokens: 200,
  },
};
```

### Example 3: A/B Testing Different Models

```javascript
// Test which model produces better quality scores
export const DOC_TYPE_CONFIG = {
  README: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.7,
  },
  // Duplicate with different model to A/B test
  README_GPT: {
    provider: 'openai',
    model: 'gpt-5.1',
    temperature: 0.7,
  },
};

// Compare:
const claudeResult = await generateDocumentation(code, { docType: 'README' });
const gptResult = await generateDocumentation(code, { docType: 'README_GPT' });

console.log('Claude score:', claudeResult.qualityScore);
console.log('GPT score:', gptResult.qualityScore);
```

## See Also

- [Multi-Provider Architecture](../../docs/architecture/MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md)
- [Prompt Caching Guide](../../docs/architecture/PROMPT-CACHING-GUIDE.md)
- [LLM Service Documentation](../services/llm/README.md)
