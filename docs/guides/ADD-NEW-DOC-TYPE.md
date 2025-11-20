# How to Add a New Documentation Type

This guide walks through adding a new doc type to CodeScribe AI, including configuring which LLM provider and model to use.

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Step-by-Step: Adding a New Doc Type](#step-by-step-adding-a-new-doc-type)
3. [Step-by-Step: Changing LLM for Existing Doc Type](#step-by-step-changing-llm-for-existing-doc-type)
4. [Testing Your Changes](#testing-your-changes)
5. [Examples](#examples)

---

## Quick Overview

**What you'll modify:**
1. Create 2 prompt files (system + user message)
2. Configure LLM provider/model in `docTypeConfig.js`
3. Update `promptLoader.js` to load your prompts
4. Restart server

**Time estimate:** 10-15 minutes

**Required knowledge:**
- Basic text editing
- Understanding of what your doc type should produce
- Which LLM model you want to use (Claude or OpenAI)

---

## Step-by-Step: Adding a New Doc Type

### Example: Adding a `CHANGELOG` doc type

We'll create a new doc type that generates changelogs from code changes, using **OpenAI GPT-5.1** for structured output.

---

### Step 1: Create System Prompt

**File:** `server/src/prompts/system/CHANGELOG.txt`

**What it is:** The instructions that tell the LLM how to behave. This prompt is **cached** to save costs.

**Create the file:**

```bash
cd server/src/prompts/system
touch CHANGELOG.txt
```

**Content example:**

```
You are a changelog generator. Create clear, concise changelogs from code changes.

IMPORTANT: This is for commit/release changelogs, not project documentation.
- Use semantic versioning categories: Added, Changed, Deprecated, Removed, Fixed, Security
- List changes as bullet points under each category
- Be specific but concise
- Focus on user-facing changes, not implementation details

Format:
## [Version] - YYYY-MM-DD

### Added
- New feature descriptions

### Changed
- Modifications to existing functionality

### Fixed
- Bug fixes

ONLY include categories that have changes. Do not include empty sections.
Keep descriptions under 80 characters per line for readability.
```

---

### Step 2: Create User Message Template

**File:** `server/src/prompts/user/CHANGELOG.txt`

**What it is:** The per-request message that includes the user's code. Uses template variables.

**Create the file:**

```bash
cd server/src/prompts/user
touch CHANGELOG.txt
```

**Content example:**

```
Generate a changelog entry for the following {{language}} code changes.

{{baseContext}}

Code changes to document:
```{{language}}
{{code}}
```

Focus on what changed from a user's perspective. Be specific but concise.
```

**Available template variables:**
- `{{language}}` - Programming language (e.g., 'javascript')
- `{{code}}` - Source code provided by user
- `{{baseContext}}` - Analysis summary (functions detected, classes, etc.)

---

### Step 3: Configure LLM Provider & Model

**File:** `server/src/prompts/docTypeConfig.js`

**What to do:** Add your doc type configuration to the `DOC_TYPE_CONFIG` object.

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

  API: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.5,
  },

  ARCHITECTURE: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.7,
  },

  // ✨ ADD YOUR NEW DOC TYPE HERE ✨
  CHANGELOG: {
    provider: 'openai',           // Use OpenAI instead of Claude
    model: 'gpt-5.1',              // GPT-5.1 model
    temperature: 0.2,              // Low temp = more consistent/structured
    maxTokens: 1000,               // Optional: limit response length
    // Reason: Changelogs are highly structured, GPT-5.1 excels at this
  },
};
```

**Configuration options:**

| Option | Required | Type | Description | Example |
|--------|----------|------|-------------|---------|
| `provider` | ✅ Yes | string | LLM provider | `'claude'` or `'openai'` |
| `model` | ✅ Yes | string | Model identifier | `'gpt-5.1'`, `'claude-sonnet-4-5-20250929'` |
| `temperature` | ❌ No | number (0-1) | Randomness level | `0.7` (creative), `0.2` (structured) |
| `maxTokens` | ❌ No | number | Max response length | `4000`, `1000` |

**Temperature guidelines:**

| Temperature | Best For | Doc Types |
|-------------|----------|-----------|
| 0.1 - 0.3 | Structured, deterministic | CHANGELOG, TESTS, INLINE_COMMENTS |
| 0.4 - 0.6 | Balanced structure + examples | API, JSDOC |
| 0.7 - 0.9 | Creative, varied output | README, ARCHITECTURE |

---

### Step 4: Update Prompt Loader

**File:** `server/src/prompts/promptLoader.js`

**What to do:** Add your doc type to both loader functions.

**Find this function:**

```javascript
export function loadSystemPrompts() {
  return {
    README: loadPrompt('system', 'README'),
    JSDOC: loadPrompt('system', 'JSDOC'),
    API: loadPrompt('system', 'API'),
    ARCHITECTURE: loadPrompt('system', 'ARCHITECTURE')
  };
}
```

**Update to:**

```javascript
export function loadSystemPrompts() {
  return {
    README: loadPrompt('system', 'README'),
    JSDOC: loadPrompt('system', 'JSDOC'),
    API: loadPrompt('system', 'API'),
    ARCHITECTURE: loadPrompt('system', 'ARCHITECTURE'),
    CHANGELOG: loadPrompt('system', 'CHANGELOG')  // ✨ ADD THIS LINE
  };
}
```

**Then find this function:**

```javascript
export function loadUserMessageTemplates() {
  return {
    README: loadPrompt('user', 'README'),
    JSDOC: loadPrompt('user', 'JSDOC'),
    API: loadPrompt('user', 'API'),
    ARCHITECTURE: loadPrompt('user', 'ARCHITECTURE')
  };
}
```

**Update to:**

```javascript
export function loadUserMessageTemplates() {
  return {
    README: loadPrompt('user', 'README'),
    JSDOC: loadPrompt('user', 'JSDOC'),
    API: loadPrompt('user', 'API'),
    ARCHITECTURE: loadPrompt('user', 'ARCHITECTURE'),
    CHANGELOG: loadPrompt('user', 'CHANGELOG')  // ✨ ADD THIS LINE
  };
}
```

---

### Step 5: Update Prompt Version

**File:** `server/src/prompts/version.js`

**What to do:** Increment the version and add a history entry.

**Before:**

```javascript
/**
 * Version History:
 * - v1.0.0 (2025-11-19): Initial extraction from inline code to external files
 * - v1.0.1 (2025-11-19): Fixed README prompt to exclude Contributing/License sections
 * - v1.1.0 (2025-11-19): Added per-doc-type LLM provider/model configuration
 */

export const PROMPT_VERSION = 'v1.1.0';
```

**After:**

```javascript
/**
 * Version History:
 * - v1.0.0 (2025-11-19): Initial extraction from inline code to external files
 * - v1.0.1 (2025-11-19): Fixed README prompt to exclude Contributing/License sections
 * - v1.1.0 (2025-11-19): Added per-doc-type LLM provider/model configuration
 * - v1.2.0 (2025-11-19): Added CHANGELOG doc type with OpenAI GPT-5.1
 */

export const PROMPT_VERSION = 'v1.2.0';  // ✨ INCREMENT VERSION
```

**Version increment rules:**
- Adding new doc type → bump **minor** version (v1.1.0 → v1.2.0)
- Changing prompt wording → bump **patch** version (v1.1.0 → v1.1.1)
- Major prompt restructure → bump **major** version (v1.1.0 → v2.0.0)

---

### Step 6: Set Environment Variables

**File:** `server/.env`

**What to do:** Ensure you have API keys for both providers if you're using both.

**For Claude:**
```bash
CLAUDE_API_KEY=sk-ant-api03-...
```

**For OpenAI:**
```bash
OPENAI_API_KEY=sk-...
```

**Note:** If you're only using one provider, you only need that API key.

---

### Step 7: Restart Server

**Why:** Prompts are loaded at server startup.

**How:**

```bash
cd server

# Stop current server (Ctrl+C if running)

# Start server
npm run dev
```

**You should see:**
```
Server running on port 3000
LLM Provider: claude (default)
```

---

### Step 8: Test Your New Doc Type

**Option 1: Via API (curl)**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function updateUser(id, data) { /* ... */ }",
    "docType": "CHANGELOG",
    "language": "javascript"
  }' | jq '.metadata'
```

**Expected metadata:**
```json
{
  "provider": "openai",
  "model": "gpt-5.1",
  "promptVersion": "v1.2.0",
  "docType": "CHANGELOG",
  "docTypeConfig": {
    "provider": "openai",
    "model": "gpt-5.1",
    "temperature": 0.2
  }
}
```

**Option 2: Via Frontend**

1. Go to http://localhost:5173
2. Select "CHANGELOG" from doc type dropdown (if you added UI for it)
3. Paste code and generate
4. Check browser Network tab → Response → `metadata.docTypeConfig`

**Option 3: Via Tests**

```javascript
// Create: server/src/services/__tests__/docGenerator.changelog.test.js
import docGenerator from '../docGenerator.js';

describe('CHANGELOG Doc Type', () => {
  it('should use OpenAI GPT-5.1', async () => {
    const result = await docGenerator.generateDocumentation(
      'function updateUser() {}',
      { docType: 'CHANGELOG', language: 'javascript' }
    );

    expect(result.metadata.docTypeConfig.provider).toBe('openai');
    expect(result.metadata.docTypeConfig.model).toBe('gpt-5.1');
    expect(result.documentation).toContain('##'); // Should have markdown headers
  });
});
```

Run test:
```bash
npm test -- __tests__/docGenerator.changelog.test.js
```

---

## Step-by-Step: Changing LLM for Existing Doc Type

**Example:** Switch README from Claude to OpenAI GPT-5.1

### Step 1: Edit Configuration

**File:** `server/src/prompts/docTypeConfig.js`

**Before:**
```javascript
README: {
  provider: 'claude',
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
},
```

**After:**
```javascript
README: {
  provider: 'openai',              // Changed
  model: 'gpt-5.1',                 // Changed
  temperature: 0.7,                 // Same
},
```

### Step 2: Update Version

**File:** `server/src/prompts/version.js`

```javascript
/**
 * Version History:
 * - ...previous versions...
 * - v1.2.1 (2025-11-19): Switched README to OpenAI GPT-5.1 for testing
 */

export const PROMPT_VERSION = 'v1.2.1';
```

### Step 3: Ensure Environment Variables

**File:** `server/.env`

```bash
OPENAI_API_KEY=sk-...  # Make sure this is set
```

### Step 4: Restart Server

```bash
cd server
# Ctrl+C to stop
npm run dev
```

### Step 5: Test

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function hello() {}",
    "docType": "README",
    "language": "javascript"
  }' | jq '.metadata.docTypeConfig'
```

**Should return:**
```json
{
  "provider": "openai",
  "model": "gpt-5.1",
  "temperature": 0.7
}
```

---

## Testing Your Changes

### Checklist

- [ ] System prompt file created (`system/<DOCTYPE>.txt`)
- [ ] User message template created (`user/<DOCTYPE>.txt`)
- [ ] Configuration added to `docTypeConfig.js`
- [ ] Both loader functions updated in `promptLoader.js`
- [ ] Prompt version incremented in `version.js`
- [ ] Environment variables set (API keys)
- [ ] Server restarted
- [ ] Test request made
- [ ] Response metadata verified

### Common Issues

**❌ Error: "No config found for docType: CHANGELOG"**
- **Fix:** Add config to `DOC_TYPE_CONFIG` in `docTypeConfig.js`
- **Check:** Spelling matches exactly (case-sensitive)

**❌ Error: "Failed to load system prompt for CHANGELOG"**
- **Fix:** Check file exists at `server/src/prompts/system/CHANGELOG.txt`
- **Check:** File has content (not empty)

**❌ Error: "Unsupported LLM provider: openai"**
- **Fix:** Set `OPENAI_API_KEY` in `server/.env`
- **Check:** Restart server after adding env var

**❌ Prompt not updating**
- **Fix:** Prompts are cached at startup - restart server
- **Check:** Verify you edited the right file

**❌ Wrong provider being used**
- **Fix:** Check `metadata.docTypeConfig` in response
- **Check:** Verify config in `docTypeConfig.js` matches

---

## Examples

### Example 1: TESTS Doc Type (High Structure)

**Use case:** Generate unit tests from code

**System prompt (`system/TESTS.txt`):**
```
You are a test generation expert. Generate comprehensive unit tests.

Requirements:
1. Use the testing framework appropriate for the language
2. Cover: happy path, edge cases, error cases
3. Include setup/teardown if needed
4. Add descriptive test names
5. Keep tests independent and deterministic

Format tests using best practices for the language:
- JavaScript: Jest or Vitest
- Python: pytest
- Java: JUnit
- etc.
```

**User template (`user/TESTS.txt`):**
```
Generate unit tests for the following {{language}} code.

{{baseContext}}

Code to test:
```{{language}}
{{code}}
```

Create comprehensive tests with good coverage.
```

**Configuration:**
```javascript
TESTS: {
  provider: 'openai',
  model: 'gpt-5.1',
  temperature: 0.2,  // Low for deterministic test generation
  maxTokens: 3000,
},
```

---

### Example 2: INLINE_COMMENTS (Cost-Optimized)

**Use case:** Add inline comments to code (cheap & fast)

**System prompt (`system/INLINE_COMMENTS.txt`):**
```
You are a code commenting expert. Add clear, concise inline comments.

Rules:
- Comment WHY, not WHAT
- Keep comments under 80 characters
- Use language-appropriate comment syntax
- Don't over-comment obvious code
- Add comments for complex logic only

Return the COMPLETE code with comments added.
```

**User template (`user/INLINE_COMMENTS.txt`):**
```
Add inline comments to this {{language}} code:

```{{language}}
{{code}}
```

Keep comments concise and helpful.
```

**Configuration:**
```javascript
INLINE_COMMENTS: {
  provider: 'openai',
  model: 'gpt-5.1-mini',  // Cheapest model
  temperature: 0.3,
  maxTokens: 500,          // Short output
},
```

**Cost savings:** ~10x cheaper than Claude Sonnet

---

### Example 3: A/B Testing Different Models

**Goal:** Compare Claude vs OpenAI for README generation

**Approach:** Create two doc types

```javascript
export const DOC_TYPE_CONFIG = {
  README: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.7,
  },

  README_GPT: {  // Duplicate for A/B testing
    provider: 'openai',
    model: 'gpt-5.1',
    temperature: 0.7,
  },
};
```

**Test script:**
```javascript
// Generate same code with both models
const claudeResult = await generateDocumentation(code, {
  docType: 'README'
});

const gptResult = await generateDocumentation(code, {
  docType: 'README_GPT'
});

// Compare
console.log('Claude quality score:', claudeResult.qualityScore);
console.log('GPT quality score:', gptResult.qualityScore);
console.log('Claude cost:', claudeResult.metadata.inputTokens * 0.003);
console.log('GPT cost:', gptResult.metadata.inputTokens * 0.005);
```

---

## Quick Reference

### File Locations

```
server/
├── src/
│   ├── prompts/
│   │   ├── docTypeConfig.js          ← Configure LLM per doc type
│   │   ├── promptLoader.js           ← Update loader functions
│   │   ├── version.js                ← Increment version
│   │   ├── system/
│   │   │   └── <DOCTYPE>.txt         ← Create system prompt
│   │   └── user/
│   │       └── <DOCTYPE>.txt         ← Create user template
│   └── services/
│       └── docGenerator.js           ← (no changes needed)
└── .env                              ← Set API keys
```

### Commands

```bash
# Create new prompt files
cd server/src/prompts
touch system/CHANGELOG.txt user/CHANGELOG.txt

# Edit files
code system/CHANGELOG.txt
code user/CHANGELOG.txt

# Restart server
cd server
npm run dev

# Test
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "docType": "CHANGELOG"}'
```

### Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{language}}` | Programming language | `javascript`, `python` |
| `{{code}}` | User's source code | Full code snippet |
| `{{baseContext}}` | Analysis summary | `Functions: 3, Classes: 1` |

### Provider/Model Options

**Claude:**
- `provider: 'claude'`
- `model: 'claude-sonnet-4-5-20250929'`
- Supports: Caching (90% discount), Streaming
- Best for: Creative docs, complex reasoning

**OpenAI:**
- `provider: 'openai'`
- `model: 'gpt-5.1'` or `'gpt-5.1-mini'`
- Supports: Streaming (no caching)
- Best for: Structured output, cost optimization

---

## Need Help?

**Documentation:**
- [Prompts System Overview](../../server/src/prompts/README.md)
- [Multi-Provider Architecture](../architecture/MULTI-PROVIDER-SIMPLIFIED-ARCHITECTURE.md)
- [Prompt Caching Guide](../architecture/PROMPT-CACHING-GUIDE.md)

**Common Questions:**

**Q: Can I use different models for different users?**
A: Not currently - it's per doc type only. User-level config would need additional changes.

**Q: How do I know which model is cheaper?**
A: Check pricing in response metadata: `inputTokens * $rate + outputTokens * $rate`

**Q: Can I add my own custom LLM provider?**
A: Yes, but requires code changes. See `server/src/services/llm/providers/` for examples.

**Q: Will changing a doc type's LLM affect existing users?**
A: Yes - all users get the new config immediately after server restart. Plan accordingly.

---

**Last updated:** 2025-11-19
**Prompt version:** v1.1.0+
