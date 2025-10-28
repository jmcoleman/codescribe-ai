# Browser Storage Naming Conventions

**Version:** 1.0
**Last Updated:** October 28, 2025
**Status:** ✅ **ACTIVE** - Required for all new storage usage

---

## 📋 Overview

This document defines naming conventions and best practices for using `localStorage` and `sessionStorage` in CodeScribe AI. Following these conventions ensures consistency, prevents key collisions, and makes debugging easier.

---

## 🎯 Core Principles

### 1. **Centralized Constants**
- ✅ All storage keys defined in [`client/src/constants/storage.js`](../../client/src/constants/storage.js)
- ❌ Never use hardcoded string literals in components
- ✅ Use `STORAGE_KEYS` constants everywhere

### 2. **Namespaced Keys**
- All keys use the format: `codescribeai:storage_type:category:key`
- Prevents collisions with other apps on the same domain
- Makes it easy to identify our app's data in DevTools

### 3. **Type Safety**
- Use helper functions (`getStorageItem`, `setStorageItem`, `getSessionItem`, `setSessionItem`)
- Automatic error handling and fallbacks
- Consistent error logging

---

## 📝 Naming Convention

### Format
```
codescribeai:storage_type:category:key
```

| Part | Options | Description | Example |
|------|---------|-------------|---------|
| **Namespace** | `codescribeai` | Fixed app namespace | `codescribeai` |
| **Storage Type** | `local`, `session` | Storage mechanism | `local` for localStorage<br/>`session` for sessionStorage |
| **Category** | Domain area | Logical grouping | `auth`, `ui`, `analytics`, `oauth` |
| **Key** | kebab-case | Specific data item | `auth-token`, `start-time` |

### Examples

```javascript
// localStorage keys (persist across sessions)
'codescribeai:local:auth:token'              // Authentication token
'codescribeai:local:ui:report-expanded'      // UI preference
'codescribeai:local:toast:history'           // Toast notification history

// sessionStorage keys (temporary, per-tab)
'codescribeai:session:oauth:start-time'      // OAuth timing data
'codescribeai:session:oauth:context'         // OAuth context (login/signup)
```

---

## 🔑 When to Use localStorage vs sessionStorage

### Use localStorage When:
- ✅ Data should persist across browser sessions
- ✅ User preferences and settings
- ✅ Authentication tokens (with proper expiration)
- ✅ Debugging/history data

**Examples:**
- Auth tokens
- UI preferences (sidebar expanded, theme)
- Toast notification history
- User settings

### Use sessionStorage When:
- ✅ Data only needed for current session/tab
- ✅ Temporary state during multi-step operations
- ✅ Timing/analytics data for in-flight operations
- ✅ Data that should not persist after browser/tab close

**Examples:**
- OAuth flow timing (start time, context)
- Wizard/multi-step form progress
- Temporary redirect data
- Analytics event batching

---

## 🛠️ Implementation Guide

### Step 1: Define Key in Constants

```javascript
// client/src/constants/storage.js

export const STORAGE_KEYS = {
  // Add your key here with appropriate storage type prefix
  MY_NEW_FEATURE: 'codescribeai:local:category:my-feature',
};
```

### Step 2: Use Helper Functions

```javascript
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../constants/storage';

// Set value
setStorageItem(STORAGE_KEYS.MY_NEW_FEATURE, 'some-value');

// Get value with default
const value = getStorageItem(STORAGE_KEYS.MY_NEW_FEATURE, 'default-value');

// Remove value
removeStorageItem(STORAGE_KEYS.MY_NEW_FEATURE);
```

### Step 3: For sessionStorage

```javascript
import { STORAGE_KEYS, getSessionItem, setSessionItem, removeSessionItem } from '../constants/storage';

// Set value
setSessionItem(STORAGE_KEYS.OAUTH_START_TIME, Date.now().toString());

// Get value with default
const startTime = getSessionItem(STORAGE_KEYS.OAUTH_START_TIME, null);

// Remove value
removeSessionItem(STORAGE_KEYS.OAUTH_START_TIME);
```

---

## ✅ Best Practices

### DO ✅

```javascript
// Use constants
import { STORAGE_KEYS, setStorageItem } from '../constants/storage';
setStorageItem(STORAGE_KEYS.AUTH_TOKEN, token);

// Use helper functions (automatic error handling)
const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN, null);

// Provide defaults for missing keys
const theme = getStorageItem(STORAGE_KEYS.UI_THEME, 'light');

// Clean up sessionStorage when done
removeSessionItem(STORAGE_KEYS.OAUTH_START_TIME);
removeSessionItem(STORAGE_KEYS.OAUTH_CONTEXT);
```

### DON'T ❌

```javascript
// Hardcoded string literals
localStorage.setItem('auth_token', token); // ❌ No namespace, no constants

// Missing error handling
const token = localStorage.getItem('token'); // ❌ Will throw in incognito mode

// Wrong storage type
localStorage.setItem('oauth_start_time', Date.now()); // ❌ Should be sessionStorage

// Missing cleanup
// Leaving sessionStorage data after operation completes // ❌ Memory leak
```

---

## 📦 Storage Structure

### Current Keys (as of v1.0)

| Key | Storage | Category | Description | Lifetime |
|-----|---------|----------|-------------|----------|
| `AUTH_TOKEN` | localStorage | auth | JWT authentication token | Until logout |
| `REPORT_EXPANDED` | localStorage | ui | Quality report panel state | Indefinite |
| `TOAST_HISTORY` | localStorage | toast | Toast notification history | 7 days |
| `OAUTH_START_TIME` | sessionStorage | oauth | OAuth redirect start timestamp | Until callback |
| `OAUTH_CONTEXT` | sessionStorage | oauth | OAuth context (login/signup) | Until callback |

---

## 🔍 Debugging Tips

### View All CodeScribe Storage in DevTools

```javascript
// In browser console
Object.keys(localStorage)
  .filter(key => key.startsWith('codescribeai:'))
  .forEach(key => console.log(key, localStorage.getItem(key)));

Object.keys(sessionStorage)
  .filter(key => key.startsWith('codescribeai:'))
  .forEach(key => console.log(key, sessionStorage.getItem(key)));
```

### Clear All App Storage

```javascript
import { clearAppStorage } from '../constants/storage';

// Clear all localStorage and sessionStorage for the app
const result = clearAppStorage();
console.log(`Cleared ${result.localStorage} localStorage items`);
console.log(`Cleared ${result.sessionStorage} sessionStorage items`);
```

---

## 🚨 Security Considerations

### Sensitive Data

- ⚠️ **Never store** plain-text passwords in storage
- ⚠️ **Never store** credit card numbers or PII
- ✅ **Always encrypt** or hash sensitive data before storing
- ✅ **Use short-lived tokens** with expiration checks

### Token Expiration

```javascript
// Good: Store token with expiration
const tokenData = {
  token: jwtToken,
  expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
};
setStorageItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokenData));

// Check expiration when retrieving
const stored = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
if (stored) {
  const { token, expiresAt } = JSON.parse(stored);
  if (Date.now() > expiresAt) {
    // Token expired, remove it
    removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}
```

---

## 📚 References

### Helper Functions

| Function | Storage Type | Description |
|----------|-------------|-------------|
| `getStorageItem(key, default)` | localStorage | Safe get with default value |
| `setStorageItem(key, value)` | localStorage | Safe set with error handling |
| `removeStorageItem(key)` | localStorage | Safe remove |
| `getSessionItem(key, default)` | sessionStorage | Safe get with default value |
| `setSessionItem(key, value)` | sessionStorage | Safe set with error handling |
| `removeSessionItem(key)` | sessionStorage | Safe remove |
| `clearAppStorage()` | Both | Clear all app storage (returns counts) |

### Related Files

- [`client/src/constants/storage.js`](../../client/src/constants/storage.js) - Storage constants and helpers
- [`client/src/contexts/AuthContext.jsx`](../../client/src/contexts/AuthContext.jsx) - Auth token storage example
- [`client/src/components/AuthCallback.jsx`](../../client/src/components/AuthCallback.jsx) - SessionStorage cleanup example

---

## 🔄 Migration Guide

### Migrating Existing Code

If you have existing code using hardcoded storage keys:

1. **Add constant** to `STORAGE_KEYS` in `storage.js`:
   ```javascript
   MY_OLD_KEY: 'codescribeai:local:category:my-old-key',
   ```

2. **Update all references**:
   ```javascript
   // Before
   localStorage.setItem('my_old_key', value);

   // After
   import { STORAGE_KEYS, setStorageItem } from '../constants/storage';
   setStorageItem(STORAGE_KEYS.MY_OLD_KEY, value);
   ```

3. **Handle migration** if key name changed:
   ```javascript
   // Migrate old data to new key
   const oldValue = localStorage.getItem('my_old_key');
   if (oldValue) {
     setStorageItem(STORAGE_KEYS.MY_OLD_KEY, oldValue);
     localStorage.removeItem('my_old_key'); // Clean up old key
   }
   ```

---

## ✅ Checklist for Adding New Storage

Before committing code that uses browser storage:

- [ ] Key defined in `STORAGE_KEYS` constant
- [ ] Uses `local` or `session` prefix appropriately
- [ ] Uses helper functions (not direct `localStorage`/`sessionStorage` calls)
- [ ] Provides sensible default values
- [ ] sessionStorage cleaned up when no longer needed
- [ ] Documented in this file's "Current Keys" section
- [ ] Security considerations addressed (if sensitive data)

---

**Version History:**
- **v1.0** (October 28, 2025) - Initial storage conventions, OAuth sessionStorage support

**Last Review:** October 28, 2025
**Next Review:** When adding new storage types or categories
