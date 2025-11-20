# localStorage Naming Conventions

**Last Updated:** November 18, 2025
**Status:** Active Standard

---

## Overview

CodeScribe AI uses a concise, consistent naming convention for localStorage keys to:
- Minimize storage space usage
- Prevent collisions with other applications
- Support multi-user scenarios (user-scoped keys)
- Maintain privacy on shared computers

---

## Naming Convention

### Format

```
cs_{category}_{key}
cs_{category}_{userId}  // For user-scoped data
```

### Components

- **`cs`** - CodeScribe namespace (2 chars)
- **`category`** - Short domain area (2-6 chars)
- **`key`** - Specific data identifier (snake_case)
- **`userId`** - User ID for user-scoped data

### Examples

```javascript
cs_auth_token           // Authentication token
cs_ui_theme             // UI theme preference
cs_ed_code              // Editor code content
cs_ws_123               // Workspace contents for user 123
```

---

## Category Codes

| Code | Category | Purpose |
|------|----------|---------|
| `auth` | Authentication | Tokens, session data |
| `ui` | User Interface | Theme, layout preferences |
| `ed` | Editor | Code, filename, language |
| `ws` | Workspace | Multi-file workspace contents |
| `toast` | Toast System | Toast history for debugging |
| `oauth` | OAuth Flow | Temporary OAuth state (sessionStorage) |
| `banner` | UI Banners | Banner dismissed state (sessionStorage) |
| `sub` | Subscription | Subscription intent (sessionStorage) |

---

## Current Keys

### localStorage (Persistent)

| Key | Type | Description |
|-----|------|-------------|
| `cs_auth_token` | String | JWT authentication token |
| `cs_ui_report_exp` | Boolean | Report panel expanded state |
| `cs_ui_split_sizes` | JSON | Split panel sizes |
| `cs_ui_sidebar` | String | Sidebar mode (expanded/collapsed) |
| `cs_ui_theme` | String | Theme preference (light/dark/auto) |
| `cs_ed_code_{userId}` | String | Editor code content (user-scoped for privacy) |
| `cs_ed_doc_{userId}` | String | Editor documentation (user-scoped for privacy) |
| `cs_ed_score_{userId}` | Number | Editor quality score (user-scoped for privacy) |
| `cs_ed_file` | String | Editor filename (global preference) |
| `cs_ed_doctype` | String | Editor document type (global preference) |
| `cs_toast_hist` | JSON Array | Toast notification history |

**Note:** Editor language is **not** stored in localStorage. It's dynamically derived from the filename extension using `detectLanguageFromFilename()` (see `/client/src/utils/fileValidation.js`).
| `cs_ws_{userId}` | JSON Object | Workspace file contents (user-scoped) |

### sessionStorage (Temporary)

| Key | Type | Description |
|-----|------|-------------|
| `cs_oauth_start` | Number | OAuth flow start time |
| `cs_oauth_ctx` | JSON | OAuth context data |
| `cs_banner_email` | Boolean | Email verification banner dismissed |
| `cs_sub_pending` | JSON | Pending subscription intent |
| `cs_sub_period` | String | Billing period selection |

---

## User-Scoped Keys

### Why User-Scoped?

User-scoped keys prevent **privacy leaks** on shared computers:

**Problem:**
```
User A logs in → imports files → code stored in localStorage
User A logs out
User B logs in → sees User A's file contents!  ❌
```

**Solution:**
```
User A: cs_ws_123 (User A's workspace)
User B: cs_ws_456 (User B's workspace)
Each user has isolated storage  ✅
```

### Implementation

```javascript
import { getWorkspaceKey, getEditorKey } from '../constants/storage';

// Get user-scoped workspace key
const workspaceKey = getWorkspaceKey(user.id);  // Returns 'cs_ws_123'

// Save workspace contents
const contents = { fileId: 'code content', ... };
localStorage.setItem(workspaceKey, JSON.stringify(contents));

// Load workspace contents
const stored = localStorage.getItem(workspaceKey);
const contents = stored ? JSON.parse(stored) : {};

// Get user-scoped editor keys (for privacy-sensitive content)
const codeKey = getEditorKey(user.id, 'code');    // Returns 'cs_ed_code_123'
const docKey = getEditorKey(user.id, 'doc');      // Returns 'cs_ed_doc_123'
const scoreKey = getEditorKey(user.id, 'score');  // Returns 'cs_ed_score_123'

// Save editor code (user-scoped)
localStorage.setItem(codeKey, code);

// Load editor code (user-scoped)
const savedCode = localStorage.getItem(codeKey);
```

### Cleanup on Logout

```javascript
import { clearAppStorage, getWorkspaceKey } from '../constants/storage';

// Clear all app storage including user workspace
clearAppStorage(user.id);

// Or clear just workspace
const workspaceKey = getWorkspaceKey(user.id);
localStorage.removeItem(workspaceKey);
```

---

## Storage Limits

### Browser Limits

- **localStorage:** ~5-10 MB per domain
- **sessionStorage:** ~5-10 MB per domain
- **Varies by browser:** Chrome (10MB), Firefox (10MB), Safari (5MB)

### Strategies

1. **Minimize key length** - Use `cs_` prefix instead of `codescribeai:`
2. **User-scoped data** - Each user gets own quota for workspace
3. **Compress data** - Consider LZ-string for large code files (future)
4. **Quota handling** - Catch `QuotaExceededError` and warn user

### Quota Error Handling

```javascript
try {
  localStorage.setItem(key, value);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.warn('localStorage quota exceeded');
    // Show user warning toast
    // Suggest clearing old files
  }
}
```

---

## API Reference

### Storage Helper Functions

Located in `/client/src/constants/storage.js`:

```javascript
// Get item from localStorage
const value = getStorageItem(STORAGE_KEYS.AUTH_TOKEN, defaultValue);

// Set item in localStorage
setStorageItem(STORAGE_KEYS.AUTH_TOKEN, token);

// Remove item from localStorage
removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);

// Get user-scoped workspace key
const workspaceKey = getWorkspaceKey(userId);  // Returns 'cs_ws_123'

// Get user-scoped editor key
const codeKey = getEditorKey(userId, 'code');    // Returns 'cs_ed_code_123'
const docKey = getEditorKey(userId, 'doc');      // Returns 'cs_ed_doc_123'
const scoreKey = getEditorKey(userId, 'score');  // Returns 'cs_ed_score_123'

// Clear all app storage (optional userId for user-scoped data)
clearAppStorage(userId);
```

### Constants

```javascript
import { STORAGE_KEYS } from '../constants/storage';

// Use constants, never hardcode keys
localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);  // ✅ Good
localStorage.setItem('cs_auth_token', token);          // ❌ Bad (magic string)
```

---

## Migration Guide

### No Migration Required

The new naming convention is a **clean break** - no migration from old keys:

- **Old keys** (`codescribeai:local:*`) will remain until users clear storage
- **New code** uses new keys (`cs_*`) immediately
- **No data loss** - users will just need to re-configure preferences

### Why No Migration?

1. **Simpler** - Avoid complex migration code
2. **Cleaner** - Fresh start with consistent naming
3. **Privacy** - User-scoped workspace prevents data mixing
4. **Performance** - No overhead checking old keys

---

## Best Practices

### DO ✅

- Always use `STORAGE_KEYS` constants
- Use helper functions (`getStorageItem`, `setStorageItem`)
- Use user-scoped keys for private data
- Handle `QuotaExceededError` gracefully
- Clear storage on logout (especially user-scoped)

### DON'T ❌

- Never hardcode key strings
- Never store sensitive data in localStorage (passwords, API keys)
- Never assume localStorage is always available
- Never store large binary data (use IndexedDB instead)
- Never share keys between users

---

## Security Considerations

### What's Safe to Store

✅ **Safe:**
- Authentication tokens (JWT - public payload)
- User preferences (theme, layout)
- Non-sensitive code content
- UI state

❌ **Unsafe:**
- Passwords (plain text)
- API keys (secret)
- Credit card numbers
- Social Security Numbers
- Private encryption keys

### XSS Protection

localStorage is vulnerable to XSS attacks. CodeScribe AI mitigates this with:

1. **React auto-escaping** - All user input sanitized
2. **No user HTML** - Only code snippets (escaped)
3. **No third-party scripts** - Controlled bundle
4. **JWT tokens** - Public payload, signed by server

For HIPAA/SOC2 compliance, consider migrating to httpOnly cookies.
See: `/docs/security/JWT-AUTHENTICATION-SECURITY.md`

---

## Troubleshooting

### Issue: Storage quota exceeded

**Symptoms:** `QuotaExceededError` thrown

**Solutions:**
1. Clear old workspace files
2. Logout/login to reset
3. Use browser dev tools to inspect storage size
4. Check for duplicate keys from old naming convention

### Issue: Data not persisting

**Symptoms:** Settings reset on refresh

**Check:**
1. Browser allows localStorage (not in private mode)
2. Using correct key from `STORAGE_KEYS`
3. Not exceeding 5MB quota
4. Try-catch around storage operations

### Issue: User sees another user's data

**Cause:** Shared computer with non-user-scoped keys

**Solution:** Ensure workspace uses `getWorkspaceKey(userId)`

---

## Changelog

### v2.8.0 (November 18, 2025)
- **BREAKING:** New concise naming convention (`cs_*`)
- Added user-scoped workspace keys (`cs_ws_{userId}`)
- No migration from old keys
- Updated all components to use new keys

### Previous
- Used `codescribeai:local:*` format (verbose)
- No user scoping (privacy issue on shared computers)

---

## References

- Implementation: `/client/src/constants/storage.js`
- Workspace Persistence: `/client/src/hooks/useWorkspacePersistence.js`
- Security Guide: `/docs/security/JWT-AUTHENTICATION-SECURITY.md`
- MDN localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
