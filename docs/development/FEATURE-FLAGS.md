# Feature Flags Development Guide

**Version:** 1.0
**Last Updated:** October 24, 2025
**Status:** Active

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Implementation Patterns](#implementation-patterns)
  - [Backend Feature Flags](#backend-feature-flags)
  - [Frontend Feature Flags](#frontend-feature-flags)
- [Case Study: ENABLE_AUTH Flag](#case-study-enable_auth-flag)
- [Testing Feature Flags](#testing-feature-flags)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)
- [Migration Guide](#migration-guide)

---

## Overview

Feature flags allow you to conditionally enable/disable features without deploying new code. They're essential for:

- **Progressive rollout** - Ship code that's not yet ready for production
- **A/B testing** - Test different implementations with different users
- **Kill switches** - Quickly disable problematic features
- **Development** - Work on features that require external dependencies (databases, APIs)
- **Technical debt management** - Keep incomplete work out of production

### When to Use Feature Flags

✅ **Use feature flags when:**
- Feature requires external dependencies (database, OAuth, payment APIs)
- Feature is incomplete but needs to be merged
- Feature needs gradual rollout to users
- Feature is experimental/testing
- Feature has performance implications

❌ **Don't use feature flags when:**
- Feature is simple and complete
- No external dependencies
- No risk to stability
- Short-lived changes (use branches instead)

---

## Architecture

CodeScribe AI uses **environment-based feature flags** for simplicity and transparency.

### Flag Types

1. **Boolean Flags** - Simple on/off switches (most common)
2. **String Flags** - Enable different implementations (e.g., `ANALYTICS_PROVIDER=google|plausible`)
3. **Numeric Flags** - Control limits or percentages (e.g., `ROLLOUT_PERCENTAGE=25`)

### Storage

- **Backend:** Environment variables via `.env` files
- **Frontend:** Environment variables prefixed with `VITE_` (Vite convention)
- **Configuration:** `.env.example` files document all flags

### Naming Convention

```bash
# Backend flags (server/.env)
ENABLE_<FEATURE_NAME>=true|false
<FEATURE_NAME>_<CONFIG>=value

# Frontend flags (client/.env)
VITE_ENABLE_<FEATURE_NAME>=true|false
VITE_<FEATURE_NAME>_<CONFIG>=value
```

**Examples:**
- `ENABLE_AUTH=true` - Enable authentication system
- `ENABLE_ANALYTICS=false` - Disable analytics
- `VITE_ENABLE_DARK_MODE=true` - Enable dark mode UI
- `VITE_MAX_FILE_SIZE=10485760` - Set file size limit

---

## Implementation Patterns

### Backend Feature Flags

#### Pattern 1: Conditional Imports (Recommended for Large Features)

**Use when:** Feature has many dependencies that shouldn't load when disabled

```javascript
// server/src/server.js
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

let authRoutes;
if (ENABLE_AUTH) {
  // Dynamic imports - only loads when needed
  const session = await import('express-session');
  const passport = await import('passport');
  const { initializeDatabase } = await import('./db/connection.js');
  const authRoutesModule = await import('./routes/auth.js');
  authRoutes = authRoutesModule.default;

  // Initialize feature
  await initializeDatabase();
  app.use(session.default({ /* config */ }));
  app.use(passport.default.initialize());

  console.log('✓ Authentication features enabled');
} else {
  console.log('ℹ Authentication features disabled (ENABLE_AUTH=false)');
}

// Conditionally mount routes
if (ENABLE_AUTH && authRoutes) {
  app.use('/api/auth', authRoutes);
}
```

**Benefits:**
- No unused dependencies loaded
- Faster startup when disabled
- Clearer separation of concerns
- No wasted memory

#### Pattern 2: Runtime Checks (Recommended for Small Features)

**Use when:** Feature is lightweight with minimal dependencies

```javascript
// server/src/routes/api.js
import { Router } from 'express';

const router = Router();
const ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS === 'true';

router.post('/api/generate', async (req, res) => {
  // ... generation logic ...

  // Conditional feature execution
  if (ENABLE_ANALYTICS) {
    await trackUsage(req.user?.id, 'generate', req.body.code.length);
  }

  res.json({ success: true, documentation });
});

export default router;
```

#### Pattern 3: Middleware Guards

**Use when:** Protecting entire route groups

```javascript
// server/src/middleware/featureFlags.js
export function requireFeature(featureName) {
  return (req, res, next) => {
    const flagName = `ENABLE_${featureName.toUpperCase()}`;
    const isEnabled = process.env[flagName] === 'true';

    if (!isEnabled) {
      return res.status(503).json({
        error: `Feature '${featureName}' is currently disabled`,
        code: 'FEATURE_DISABLED'
      });
    }

    next();
  };
}

// Usage
import { requireFeature } from './middleware/featureFlags.js';

app.use('/api/premium', requireFeature('premium'));
```

---

### Frontend Feature Flags

#### Pattern 1: Conditional Rendering (Component Level)

**Use when:** Entire UI section should be hidden

```jsx
// client/src/components/Header.jsx
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header>
      <Logo />
      <nav>
        <Button onClick={onExamplesClick}>Examples</Button>

        {/* Conditional auth UI */}
        {ENABLE_AUTH && (
          <>
            {isAuthenticated ? (
              <div>
                <span>{user?.email}</span>
                <button onClick={logout}>Sign Out</button>
              </div>
            ) : (
              <Button onClick={handleSignIn}>Sign In</Button>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
```

#### Pattern 2: Conditional Providers (Context Level)

**Use when:** Feature provides app-wide context/state

```jsx
// client/src/main.jsx
import { AuthProvider } from './contexts/AuthContext.jsx';

const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

// Conditional wrapper component
const AppWrapper = ENABLE_AUTH
  ? ({ children }) => <AuthProvider>{children}</AuthProvider>
  : ({ children }) => <>{children}</>;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppWrapper>
        <App />
      </AppWrapper>
    </ErrorBoundary>
  </StrictMode>
);
```

#### Pattern 3: No-Op Implementations (Graceful Degradation)

**Use when:** Components may call feature APIs that don't exist

```jsx
// client/src/contexts/AuthContext.jsx
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

// Dummy context for when auth is disabled
const dummyAuthContext = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  signup: async () => { throw new Error('Authentication is disabled'); },
  login: async () => { throw new Error('Authentication is disabled'); },
  logout: async () => {},
  forgotPassword: async () => { throw new Error('Authentication is disabled'); },
  getToken: () => null,
  clearError: () => {},
};

export function AuthProvider({ children }) {
  // Return no-op version when disabled
  if (!ENABLE_AUTH) {
    return <AuthContext.Provider value={dummyAuthContext}>{children}</AuthContext.Provider>;
  }

  // Full implementation when enabled
  const [user, setUser] = useState(null);
  // ... rest of implementation ...
}
```

#### Pattern 4: Custom Hook (Advanced)

**Use when:** Need centralized flag management with reactive updates

```jsx
// client/src/hooks/useFeatureFlag.js
import { useMemo } from 'react';

/**
 * Hook to check if a feature is enabled
 * @param {string} featureName - Name of the feature (e.g., 'AUTH', 'DARK_MODE')
 * @returns {boolean} - Whether the feature is enabled
 */
export function useFeatureFlag(featureName) {
  return useMemo(() => {
    const flagName = `VITE_ENABLE_${featureName.toUpperCase()}`;
    return import.meta.env[flagName] === 'true';
  }, [featureName]);
}

// Usage in components
function DarkModeToggle() {
  const isDarkModeEnabled = useFeatureFlag('DARK_MODE');

  if (!isDarkModeEnabled) {
    return null;
  }

  return <button onClick={toggleDarkMode}>Toggle Dark Mode</button>;
}
```

---

## Case Study: ENABLE_AUTH Flag

The authentication feature flag demonstrates all patterns working together.

### Requirements

- **Goal:** Ship auth code without requiring database/OAuth setup
- **Scope:** Authentication system (login, signup, GitHub OAuth, JWT)
- **Dependencies:** PostgreSQL, Passport.js, express-session, OAuth credentials
- **Risk:** High (database required, external OAuth, session management)

### Implementation Overview

| Layer | Pattern | Files Modified |
|-------|---------|---------------|
| Backend Entry | Conditional Imports | [server/src/server.js](../../server/src/server.js) |
| Backend Config | Environment Check | [server/src/config/passport.js](../../server/src/config/passport.js) |
| Frontend Entry | Conditional Provider | [client/src/main.jsx](../../client/src/main.jsx) |
| Frontend UI | Conditional Rendering | [client/src/components/Header.jsx](../../client/src/components/Header.jsx) |
| Frontend Context | No-Op Implementation | [client/src/contexts/AuthContext.jsx](../../client/src/contexts/AuthContext.jsx) |
| Config | Environment Variables | [server/.env.example](../../server/.env.example), [client/.env.example](../../client/.env.example) |

### Backend Implementation

#### Step 1: Add Environment Variable

```bash
# server/.env.example
# Feature Flags
ENABLE_AUTH=false  # Set to true to enable authentication features (requires DB and auth env vars)
```

#### Step 2: Conditional Imports in Server Entry

```javascript
// server/src/server.js
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Feature flag for authentication
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

// Conditional imports and initialization for auth features
let authRoutes;
if (ENABLE_AUTH) {
  // Dynamic imports - only load when enabled
  const session = await import('express-session');
  const connectPgSimple = await import('connect-pg-simple');
  const passport = await import('passport');
  const { initializeDatabase, testConnection } = await import('./db/connection.js');
  const authRoutesModule = await import('./routes/auth.js');
  authRoutes = authRoutesModule.default;

  // Import passport configuration
  await import('./config/passport.js');

  // Initialize database on startup
  (async () => {
    try {
      await testConnection();
      console.log('✓ Database connection established');

      await initializeDatabase();
      console.log('✓ Database tables initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Don't exit - allow server to start for health checks
    }
  })();

  // Session configuration (for Passport)
  const PgSession = connectPgSimple.default(session.default);

  app.use(
    session.default({
      store: new PgSession({
        conObject: {
          connectionString: process.env.POSTGRES_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        },
        tableName: 'session',
        createTableIfMissing: false
      }),
      secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    })
  );

  // Initialize Passport
  app.use(passport.default.initialize());
  app.use(passport.default.session());

  console.log('✓ Authentication features enabled');
} else {
  console.log('ℹ Authentication features disabled (ENABLE_AUTH=false)');
}

// CORS configuration
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Mount routes - conditionally mount auth routes
if (ENABLE_AUTH && authRoutes) {
  app.use('/api/auth', authRoutes);
}
app.use('/api', apiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Key Points:**
- ✅ Dynamic imports prevent loading unused dependencies
- ✅ Database initialization only runs when enabled
- ✅ Session middleware only configured when enabled
- ✅ Clear console logging for debugging
- ✅ Auth routes only mounted when enabled

#### Step 3: Graceful Degradation in Passport Config

```javascript
// server/src/config/passport.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.js';

// Local Strategy (always configured if this file is loaded)
passport.use(new LocalStrategy({ /* ... */ }));

// GitHub OAuth Strategy (conditional based on env vars)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        // OAuth callback logic
      }
    )
  );
} else {
  console.warn('⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)');
}

// JWT Strategy (conditional based on env vars)
if (process.env.JWT_SECRET) {
  passport.use(new JwtStrategy({ /* ... */ }));
} else {
  console.warn('⚠️  JWT authentication not configured (missing JWT_SECRET)');
}

export default passport;
```

**Key Points:**
- ✅ Graceful warnings when optional features missing
- ✅ Core auth can work without OAuth
- ✅ Clear feedback in console

### Frontend Implementation

#### Step 1: Add Environment Variable

```bash
# client/.env.example
# Feature Flags
VITE_ENABLE_AUTH=false  # Set to true to enable authentication features
```

#### Step 2: Conditional Provider Wrapper

```jsx
// client/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';

// Feature flag for authentication
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

// Conditional wrapper for AuthProvider
const AppWrapper = ENABLE_AUTH
  ? ({ children }) => <AuthProvider>{children}</AuthProvider>
  : ({ children }) => <>{children}</>;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppWrapper>
        <App />
      </AppWrapper>
    </ErrorBoundary>
  </StrictMode>
);
```

**Key Points:**
- ✅ Simple ternary for conditional provider
- ✅ Fragment wrapper when disabled (no-op)
- ✅ Type-safe (both paths return valid React components)

#### Step 3: No-Op Context Implementation

```jsx
// client/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const AuthContext = createContext(null);

// Feature flag for authentication
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

// Dummy auth context for when auth is disabled
const dummyAuthContext = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  signup: async () => { throw new Error('Authentication is disabled'); },
  login: async () => { throw new Error('Authentication is disabled'); },
  logout: async () => {},
  forgotPassword: async () => { throw new Error('Authentication is disabled'); },
  getToken: () => null,
  clearError: () => {},
};

export function AuthProvider({ children }) {
  // If auth is disabled, return dummy context
  if (!ENABLE_AUTH) {
    return <AuthContext.Provider value={dummyAuthContext}>{children}</AuthContext.Provider>;
  }

  // Full implementation when enabled
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    // ... full auth initialization ...
  };

  const signup = async (email, password) => {
    // ... full signup implementation ...
  };

  const login = async (email, password) => {
    // ... full login implementation ...
  };

  const logout = async () => {
    // ... full logout implementation ...
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    forgotPassword,
    getToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
```

**Key Points:**
- ✅ Dummy context prevents runtime errors
- ✅ Error messages for accidental usage
- ✅ No API calls when disabled
- ✅ Same interface regardless of flag state

#### Step 4: Conditional UI Rendering

```jsx
// client/src/components/Header.jsx
import { useState, lazy, Suspense } from 'react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';

// Lazy load auth modals
const LoginModal = lazy(() => import('./LoginModal').then(m => ({ default: m.LoginModal })));
const SignupModal = lazy(() => import('./SignupModal').then(m => ({ default: m.SignupModal })));

// Feature flag: Authentication enabled (from environment variable)
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

export function Header({ onMenuClick, onExamplesClick, onHelpClick }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <header>
      <Logo />

      <nav>
        <Button onClick={onExamplesClick}>Examples</Button>

        {/* Auth UI only shown when feature is enabled */}
        {ENABLE_AUTH && (
          <>
            {isAuthenticated ? (
              <div>
                <span>{user?.email}</span>
                <button onClick={logout}>Sign Out</button>
              </div>
            ) : (
              <Button onClick={() => setShowLoginModal(true)}>Sign In</Button>
            )}
          </>
        )}
      </nav>

      {/* Auth Modals - only render when feature enabled */}
      {ENABLE_AUTH && (
        <Suspense fallback={null}>
          {showLoginModal && (
            <LoginModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
            />
          )}
          {showSignupModal && (
            <SignupModal
              isOpen={showSignupModal}
              onClose={() => setShowSignupModal(false)}
            />
          )}
        </Suspense>
      )}
    </header>
  );
}
```

**Key Points:**
- ✅ Conditional rendering hides UI completely
- ✅ Lazy loading prevents loading unused components
- ✅ useAuth hook safe to call (returns dummy context)
- ✅ Clean, readable code

### Verification

#### Backend Test

```bash
# Test with auth disabled
cd server
ENABLE_AUTH=false PORT=3001 node src/server.js

# Expected output:
# ℹ Authentication features disabled (ENABLE_AUTH=false)
# Server running on http://localhost:3001

# Test health endpoint
curl http://localhost:3001/api/health
# {"status":"healthy",...}

# Test auth endpoint (should not exist)
curl http://localhost:3001/api/auth/me
# 404 Not Found
```

#### Frontend Test

```bash
# Build with auth disabled
cd client
VITE_ENABLE_AUTH=false npm run build

# Should build successfully
# Sign In button should not appear in Header
```

### Results

✅ **Server starts without:**
- Database connection
- OAuth credentials
- JWT secrets
- Session secrets

✅ **Frontend builds without:**
- Auth modals rendering
- Auth API calls
- Auth context initialization

✅ **Easy to enable:**
- Set `ENABLE_AUTH=true` and `VITE_ENABLE_AUTH=true`
- Add required environment variables
- Restart server and rebuild frontend

---

## Testing Feature Flags

### Unit Tests

Test both states of the flag:

```javascript
// server/src/__tests__/server.test.js
describe('Feature Flags', () => {
  describe('ENABLE_AUTH', () => {
    it('should not mount auth routes when ENABLE_AUTH=false', async () => {
      process.env.ENABLE_AUTH = 'false';
      const app = await import('../server.js');
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(404);
    });

    it('should mount auth routes when ENABLE_AUTH=true', async () => {
      process.env.ENABLE_AUTH = 'true';
      process.env.POSTGRES_URL = 'mock://db';
      const app = await import('../server.js');
      const response = await request(app).get('/api/auth/me');
      expect(response.status).not.toBe(404); // May be 401 unauthorized
    });
  });
});
```

```jsx
// client/src/__tests__/Header.test.jsx
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';

describe('Header - Feature Flags', () => {
  it('should not show Sign In button when VITE_ENABLE_AUTH=false', () => {
    import.meta.env.VITE_ENABLE_AUTH = 'false';
    render(<Header />);
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  it('should show Sign In button when VITE_ENABLE_AUTH=true', () => {
    import.meta.env.VITE_ENABLE_AUTH = 'true';
    render(<Header />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test feature interactions:

```javascript
// server/tests/integration/featureFlags.test.js
describe('Feature Flag Integration', () => {
  it('should generate docs without auth when ENABLE_AUTH=false', async () => {
    process.env.ENABLE_AUTH = 'false';

    const response = await request(app)
      .post('/api/generate')
      .send({ code: 'function test() {}', type: 'README' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should require auth for generation when ENABLE_AUTH=true', async () => {
    process.env.ENABLE_AUTH = 'true';

    const response = await request(app)
      .post('/api/generate')
      .send({ code: 'function test() {}', type: 'README' });

    // Depends on your implementation
    expect(response.status).toBe(401); // or 200 if auth optional
  });
});
```

### E2E Tests

```javascript
// client/e2e/featureFlags.spec.js
import { test, expect } from '@playwright/test';

test.describe('Feature Flags - Auth', () => {
  test('should not show auth UI when disabled', async ({ page }) => {
    // Set env var before loading page
    await page.goto('/?VITE_ENABLE_AUTH=false');

    await expect(page.locator('text=Sign In')).not.toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });
});
```

---

## Best Practices

### 1. ✅ Default to Disabled

New features should be disabled by default:

```bash
# Good - safe default
ENABLE_NEW_FEATURE=false

# Bad - risky default
ENABLE_NEW_FEATURE=true
```

**Rationale:** Prevents accidental deployment of incomplete features.

### 2. ✅ Document Required Dependencies

Always document what's needed when flag is enabled:

```bash
# Good - clear requirements
ENABLE_AUTH=false  # Requires: POSTGRES_URL, JWT_SECRET, SESSION_SECRET

# Bad - no context
ENABLE_AUTH=false
```

### 3. ✅ Use Explicit String Comparison

```javascript
// Good - explicit
const isEnabled = process.env.ENABLE_FEATURE === 'true';

// Bad - truthy check (any value would enable)
const isEnabled = !!process.env.ENABLE_FEATURE;

// Bad - will be string "false" which is truthy
const isEnabled = process.env.ENABLE_FEATURE;
```

### 4. ✅ Provide No-Op Implementations

```javascript
// Good - safe fallback
const dummyService = {
  track: () => {},
  identify: () => {},
  page: () => {},
};

// Bad - throws errors everywhere
const dummyService = null;
```

### 5. ✅ Log Flag State on Startup

```javascript
// Good - clear visibility
if (ENABLE_AUTH) {
  console.log('✓ Authentication enabled');
} else {
  console.log('ℹ Authentication disabled (ENABLE_AUTH=false)');
}

// Bad - silent
if (ENABLE_AUTH) {
  // Initialize auth
}
```

### 6. ✅ Keep Flags Temporary

Feature flags should have a lifecycle:

```markdown
## Feature Flag Lifecycle

1. **Development** (1-4 weeks) - Flag off by default
2. **Testing** (1-2 weeks) - Flag on in staging
3. **Rollout** (1-2 weeks) - Flag on in production
4. **Stabilization** (1 week) - Monitor production
5. **Cleanup** (1 week) - Remove flag, make permanent

**Total lifecycle:** 4-9 weeks maximum
```

### 7. ✅ Use Type-Safe Flags (TypeScript)

```typescript
// types/env.d.ts
interface ImportMetaEnv {
  readonly VITE_ENABLE_AUTH: 'true' | 'false';
  readonly VITE_ENABLE_DARK_MODE: 'true' | 'false';
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Usage - autocomplete and type checking
const isAuthEnabled = import.meta.env.VITE_ENABLE_AUTH === 'true';
```

### 8. ✅ Centralize Flag Configuration

```javascript
// config/features.js
export const FEATURES = {
  AUTH: process.env.ENABLE_AUTH === 'true',
  ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  DARK_MODE: process.env.ENABLE_DARK_MODE === 'true',
  PAYMENT: process.env.ENABLE_PAYMENT === 'true',
};

// Usage
import { FEATURES } from './config/features.js';

if (FEATURES.AUTH) {
  // Initialize auth
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to Check Flag in All Locations

```javascript
// Bad - flag checked in route, but not in middleware
if (ENABLE_AUTH) {
  app.use('/api/auth', authRoutes);
}
app.use(requireAuth); // ← Still runs even if auth disabled!

// Good - consistent checks
if (ENABLE_AUTH) {
  app.use('/api/auth', authRoutes);
  app.use(requireAuth);
}
```

### ❌ Pitfall 2: Mixing Build-Time and Runtime Flags

```javascript
// Bad - different flag values between build and runtime
// Built with VITE_ENABLE_AUTH=true, but env has false
const isEnabled = import.meta.env.VITE_ENABLE_AUTH === 'true';

// Solution: Use consistent env vars or accept build-time is permanent
```

**Vite Note:** Frontend flags are **build-time** constants. They're replaced during build, not evaluated at runtime.

### ❌ Pitfall 3: Not Handling Missing Dependencies

```javascript
// Bad - crashes when dependency missing
if (ENABLE_AUTH) {
  const session = require('express-session'); // ← might not be installed!
}

// Good - handle missing dependencies
if (ENABLE_AUTH) {
  try {
    const session = await import('express-session');
  } catch (error) {
    console.error('express-session not installed. Install with: npm install express-session');
    process.exit(1);
  }
}
```

### ❌ Pitfall 4: Incomplete Conditional Logic

```javascript
// Bad - inconsistent state
if (ENABLE_PAYMENT) {
  initializeStripe();
}
// User can still access payment UI but backend isn't initialized!

// Good - consistent state
if (ENABLE_PAYMENT) {
  // Backend
  initializeStripe();
}

// Frontend
{ENABLE_PAYMENT && <PaymentForm />}
```

### ❌ Pitfall 5: Not Cleaning Up Old Flags

```javascript
// Bad - 2-year-old flag still in code
if (ENABLE_NEW_DASHBOARD) { // ← "new" in 2023!
  return <NewDashboard />;
}

// Good - remove flags after feature is stable
return <Dashboard />; // Flag removed, feature permanent
```

---

## Migration Guide

### Adding a New Feature Flag

**Step 1:** Define the flag in `.env.example` files

```bash
# server/.env.example
ENABLE_NEW_FEATURE=false  # Description and requirements

# client/.env.example
VITE_ENABLE_NEW_FEATURE=false  # Description
```

**Step 2:** Implement backend conditional logic

```javascript
// server/src/server.js
const ENABLE_NEW_FEATURE = process.env.ENABLE_NEW_FEATURE === 'true';

if (ENABLE_NEW_FEATURE) {
  const { newFeatureRoutes } = await import('./routes/newFeature.js');
  app.use('/api/new-feature', newFeatureRoutes);
  console.log('✓ New feature enabled');
} else {
  console.log('ℹ New feature disabled');
}
```

**Step 3:** Implement frontend conditional logic

```jsx
// client/src/App.jsx
const ENABLE_NEW_FEATURE = import.meta.env.VITE_ENABLE_NEW_FEATURE === 'true';

function App() {
  return (
    <div>
      <Header />
      {ENABLE_NEW_FEATURE && <NewFeaturePanel />}
      <MainContent />
    </div>
  );
}
```

**Step 4:** Add tests for both states

```javascript
describe('New Feature Flag', () => {
  it('works when enabled', () => { /* ... */ });
  it('works when disabled', () => { /* ... */ });
});
```

**Step 5:** Document in TODO.md or ROADMAP.md

```markdown
## Phase X: New Feature

**Status:** 🚩 Behind Feature Flag
**Flag:** `ENABLE_NEW_FEATURE=false` (backend), `VITE_ENABLE_NEW_FEATURE=false` (frontend)
**Requirements when enabled:** List dependencies here
```

### Removing a Feature Flag

**Step 1:** Verify flag is enabled in all environments

```bash
# Check production
vercel env pull .env.production
grep ENABLE_STABLE_FEATURE .env.production
# Should be: ENABLE_STABLE_FEATURE=true
```

**Step 2:** Remove conditional logic, keep feature code

```javascript
// Before
if (ENABLE_STABLE_FEATURE) {
  return <StableFeature />;
}
return <OldFeature />;

// After
return <StableFeature />;
```

**Step 3:** Remove flag from .env.example files

```bash
# Delete these lines
- ENABLE_STABLE_FEATURE=true
- VITE_ENABLE_STABLE_FEATURE=true
```

**Step 4:** Remove flag from environment in production

```bash
vercel env rm ENABLE_STABLE_FEATURE production
```

**Step 5:** Update documentation

```markdown
## Phase X: Stable Feature

**Status:** ✅ Complete (flag removed October 2025)
```

**Step 6:** Create cleanup PR

```markdown
# PR Title: Remove ENABLE_STABLE_FEATURE flag

## Summary
Feature has been stable in production for 4 weeks. Removing feature flag as planned.

## Changes
- Removed conditional logic in server.js, App.jsx
- Removed env vars from .env.example
- Updated documentation
- Deleted old implementation files

## Verification
- [ ] Feature works in production
- [ ] No references to flag in codebase: `git grep ENABLE_STABLE_FEATURE`
- [ ] Tests still passing
```

---

## Summary Checklist

When implementing a feature flag:

- [ ] Add flag to both `.env.example` files with clear documentation
- [ ] Default to `false` (disabled)
- [ ] Use explicit string comparison: `=== 'true'`
- [ ] Implement backend conditional imports/routing
- [ ] Implement frontend conditional rendering/providers
- [ ] Provide no-op implementations where needed
- [ ] Add startup logging for flag state
- [ ] Test both enabled and disabled states
- [ ] Document in TODO.md/ROADMAP.md
- [ ] Plan flag removal date (4-9 weeks after deployment)
- [ ] Add flag to removal tracking list

---

## References

- **Example Implementation:** [ENABLE_AUTH Flag](#case-study-enable_auth-flag)
- **Environment Files:** [server/.env.example](../../server/.env.example), [client/.env.example](../../client/.env.example)
- **Documentation:** [TODO.md - Feature Flags](../planning/TODO.md#-feature-flag-status)
- **Vite Env Docs:** https://vitejs.dev/guide/env-and-mode.html

---

**Questions or suggestions?** Open an issue or PR with the `documentation` label.
