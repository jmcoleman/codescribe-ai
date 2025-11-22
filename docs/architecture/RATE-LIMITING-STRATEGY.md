# Rate Limiting Strategy

**Last Updated:** November 20, 2025
**Status:** Implemented

---

## Problem

**Claude API Rate Limits (Free Tier):**
- 8,000 output tokens per minute (primary constraint)
- Typical doc: 1,000-2,000 tokens
- Max throughput: 4-6 files per minute
- Current issue: Bulk generation hits limit at 5-6 files with `429 rate_limit_error`

**Current Retry Logic:**
- Exponential backoff: 1s, 2s, 4s delays
- **Problem:** 429 errors need 60+ second waits, not 1-4 second retries

---

## Solution: Hybrid Throttling + Smart 429 Handling

### Approach 1: Request Throttling (Primary Prevention)

**Goal:** Prevent rate limit errors before they occur

**Implementation:**
- Add 15-second delay between bulk generation requests
- Allows ~4 files/minute (safely under 8K token limit)
- Shows progress: "⏳ Throttling (15s) to respect API limits..."

**Configuration:**
```javascript
const BULK_GENERATION_DELAY = 15000; // 15 seconds = ~4 files/min
```

### Approach 2: Smart 429 Error Handling (Fallback)

**Goal:** Gracefully handle rate limits if they still occur

**Implementation:**
- Detect 429 rate limit errors
- Read `retry-after` header (typically 60 seconds)
- Wait specified duration before retrying
- Continue bulk generation (don't fail entire batch)

**Logic:**
```javascript
if (error.status === 429) {
  const retryAfterSeconds = error.headers?.['retry-after'] || 60;
  console.log(`Rate limit hit, waiting ${retryAfterSeconds}s...`);
  await sleep(retryAfterSeconds * 1000);
  return await fn(); // Retry request
}
```

---

## Implementation

### Files Modified

1. **client/src/App.jsx** - Add throttling to bulk generation
2. **server/src/services/llm/utils.js** - Smart 429 handling in retry logic

### Expected Behavior

**Before:**
```
✓ File 1/10 complete
✓ File 2/10 complete
✗ Error: Rate limit exceeded (fails batch)
```

**After:**
```
✓ File 1/10 complete (MyComponent.jsx)
⏳ Throttling (15s) to respect API limits...
⚙️ File 2/10 generating (Button.jsx)...
✓ File 2/10 complete (Button.jsx)
```

### Time Estimates

- Small batch (3 files): ~45 seconds
- Medium batch (5 files): ~75 seconds
- Large batch (10 files): ~2.5 minutes

---

## References

- [Claude API Rate Limits](https://docs.anthropic.com/en/api/rate-limits)
- [ERROR-HANDLING-PATTERNS.md](./ERROR-HANDLING-PATTERNS.md)
