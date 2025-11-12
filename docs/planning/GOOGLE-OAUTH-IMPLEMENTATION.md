# Google OAuth Implementation Plan

**Status:** 📋 Planned (Not Yet Prioritized)
**Created:** November 12, 2025
**Estimated Effort:** 6-10 hours
**Priority:** TBD

---

## Overview

Add Google OAuth as a third authentication option alongside existing email/password and GitHub OAuth. The implementation follows the same patterns as GitHub OAuth for consistency and reuses existing infrastructure.

### Goals

- Provide users with Google sign-in option
- Support account linking (users can connect Google to existing accounts)
- Maintain consistency with GitHub OAuth patterns
- Auto-verify emails for Google OAuth users
- Enable multi-provider accounts (email + GitHub + Google)

### User Benefits

- **Convenience:** Single-click sign-in with Google account
- **Security:** No need to remember another password
- **Flexibility:** Choose preferred authentication method
- **Account Recovery:** Multiple sign-in options if one is unavailable

---

## Current State Analysis

### Existing OAuth Infrastructure

✅ **GitHub OAuth implemented** with:
- Passport.js integration (`passport-github2` strategy)
- Account linking by email
- Auto-verification for OAuth users
- JWT-based authentication
- Anonymous usage migration
- Comprehensive testing patterns

✅ **Database schema supports** multiple OAuth providers:
- `github_id` column already exists
- Pattern established for adding more providers
- Account linking logic in place

✅ **Frontend components** ready for expansion:
- LoginModal and SignupModal handle OAuth redirects
- AuthCallback component is provider-agnostic
- OAuth timing analytics in place

### What's Missing

❌ `google_id` column in users table
❌ Google Passport strategy
❌ Google OAuth routes
❌ `findOrCreateByGoogle()` user model method
❌ Google OAuth button in UI
❌ Google Cloud Console OAuth app
❌ Environment variables for Google credentials
❌ Tests for Google OAuth flow
❌ Documentation for Google setup

---

## Implementation Plan

### Phase 1: Backend Implementation (2-3 hours)

#### 1.1 Install Dependencies

```bash
cd server
npm install passport-google-oauth20
```

**Package:** `passport-google-oauth20` (official Google OAuth 2.0 strategy for Passport)

---

#### 1.2 Database Migration

**File:** `server/src/db/migrations/013-add-google-oauth.sql`

```sql
-- Migration: Add Google OAuth support
-- Version: 013
-- Date: 2025-11-12
-- Description: Adds google_id column and index to users table

DO $$
BEGIN
  -- Add google_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'google_id'
  ) THEN
    ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
  END IF;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_google_id_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_google_id_key UNIQUE (google_id);
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Verify column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'google_id';
```

**Migration Steps:**
1. Test in Docker sandbox: `npm run test:db`
2. Apply to Neon dev: `npm run migrate`
3. Validate: `npm run migrate:validate`
4. Deploy to production (automatic via Vercel)

---

#### 1.3 Passport Configuration

**File:** `server/src/config/passport.js`

Add after GitHub strategy (around line 92):

```javascript
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// ============================================================================
// Google OAuth Strategy
// ============================================================================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/api/auth/google/callback';

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('[Passport] Google OAuth callback invoked for user:', profile.displayName);

          // Extract email from Google profile
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          console.log('[Passport] Email extracted:', email);

          // Find or create user
          const user = await User.findOrCreateByGoogle({
            googleId: profile.id,
            email,
          });

          console.log('[Passport] User found/created:', user.id);
          return done(null, user);
        } catch (error) {
          console.error('[Passport] Google strategy error:', error);
          return done(error);
        }
      }
    )
  );

  const maskedClientId = process.env.GOOGLE_CLIENT_ID.substring(0, 8) + '...';
  console.log(`✅ Google OAuth configured (Client ID: ${maskedClientId})`);
  console.log(`✅ Google callback URL: ${callbackURL}`);
} else {
  console.warn('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
}
```

**Key Differences from GitHub:**
- Uses `passport-google-oauth20` instead of `passport-github2`
- Email is in `profile.emails[0].value` (not `profile.emails?.[0]?.value || fallback`)
- Google IDs are numeric strings (GitHub IDs are also strings)

---

#### 1.4 User Model Updates

**File:** `server/src/models/User.js`

Add new method after `findOrCreateByGithub` (around line 156):

```javascript
/**
 * Create or update a user from Google OAuth
 * Google OAuth users are automatically marked as verified since Google
 * has already verified their email address.
 *
 * @param {string} googleId - Google user ID
 * @param {string} email - User email
 * @returns {Promise<Object>} User object with email_verified=true
 */
static async findOrCreateByGoogle({ googleId, email }) {
  // Try to find existing user by Google ID
  let result = await sql`
    SELECT id, email, google_id, github_id, tier, email_verified,
           terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted,
           deletion_scheduled_at, deleted_at, created_at
    FROM users
    WHERE google_id = ${googleId}
  `;

  if (result.rows.length > 0) {
    const user = result.rows[0];

    // If account is scheduled for deletion, restore it
    if (user.deletion_scheduled_at && !user.deleted_at) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Google OAuth] User ${user.id} signing in with scheduled-deletion account - restoring account`);
      }
      await User.restoreAccount(user.id);
      return await User.findById(user.id);
    }

    return user;
  }

  // Try to find by email and link Google account
  result = await sql`
    SELECT id, email, google_id, github_id, tier, email_verified,
           terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted,
           deletion_scheduled_at, deleted_at, created_at
    FROM users
    WHERE email = ${email}
  `;

  if (result.rows.length > 0) {
    const existingUser = result.rows[0];

    // If account is scheduled for deletion, restore it before linking
    if (existingUser.deletion_scheduled_at && !existingUser.deleted_at) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Google OAuth] User ${existingUser.id} linking Google to scheduled-deletion account - restoring account`);
      }
      await User.restoreAccount(existingUser.id);
    }

    // Link Google account to existing user and mark email as verified
    const updateResult = await sql`
      UPDATE users
      SET google_id = ${googleId},
          email_verified = true,
          updated_at = NOW()
      WHERE id = ${existingUser.id}
      RETURNING id, email, google_id, github_id, tier, email_verified,
                terms_accepted_at, terms_version_accepted,
                privacy_accepted_at, privacy_version_accepted, created_at
    `;
    return updateResult.rows[0];
  }

  // Create new user with verified email
  const createResult = await sql`
    INSERT INTO users (email, google_id, tier, email_verified)
    VALUES (${email}, ${googleId}, 'free', true)
    RETURNING id, email, google_id, github_id, tier, email_verified,
              terms_accepted_at, terms_version_accepted,
              privacy_accepted_at, privacy_version_accepted, created_at
  `;

  return createResult.rows[0];
}
```

**Also update these methods to include `google_id`:**

1. **`findById`** (line ~166):
```javascript
SELECT id, email, first_name, last_name, github_id, google_id, tier, ...
```

2. **`findByEmail`** (line ~210):
```javascript
SELECT id, email, first_name, last_name, password_hash, github_id, google_id, tier, ...
```

---

#### 1.5 Auth Routes

**File:** `server/src/routes/auth.js`

Add after GitHub routes (around line 683):

```javascript
// ============================================================================
// GET /api/auth/google - Google OAuth Initiation
// ============================================================================
/**
 * Initiates Google OAuth flow
 * Redirects user to Google's OAuth consent screen
 * Scopes: profile, email
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// ============================================================================
// GET /api/auth/google/callback - Google OAuth Callback
// ============================================================================
/**
 * Handles callback from Google OAuth
 *
 * Success flow:
 * 1. Exchange auth code for access token
 * 2. Fetch user profile from Google
 * 3. Find or create user in database
 * 4. Migrate anonymous usage by IP
 * 5. Generate JWT token
 * 6. Redirect to frontend with token
 *
 * Error flow:
 * 1. Log error details
 * 2. Redirect to frontend with error parameter
 */
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', async (err, user, info) => {
      if (err) {
        console.error('[Auth] Google OAuth error:', err);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Google authentication failed',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      if (!user) {
        console.error('[Auth] Google OAuth failed - no user returned:', info);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?auth_error=google_auth_failed`);
      }

      try {
        // Migrate any anonymous usage from this IP to the user account
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        if (ipAddress && ipAddress !== 'unknown') {
          try {
            await Usage.migrateAnonymousUsage(ipAddress, user.id);
            console.log(`[Auth] Migrated anonymous usage for IP ${ipAddress} to user ${user.id} (Google OAuth)`);
          } catch (migrationError) {
            // Don't fail OAuth callback if migration fails - log and continue
            console.error('[Auth] Failed to migrate anonymous usage:', migrationError);
          }
        }

        // Generate JWT token
        const token = generateToken(user);

        // Redirect to frontend with token
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      } catch (error) {
        console.error('[Auth] Error in Google OAuth callback:', error);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?auth_error=callback_processing_failed`);
      }
    })(req, res, next);
  }
);
```

**Error Codes:**
- `google_auth_failed` - Google rejected auth or user cancelled
- `callback_processing_failed` - Token generation or DB error

---

#### 1.6 Environment Variables

**Local Development** (`server/.env`):
```env
# Google OAuth Configuration - Development
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

**Vercel Production** (Environment Variables):
- `GOOGLE_CLIENT_ID` - OAuth Client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - OAuth Client Secret
- `GOOGLE_CALLBACK_URL` - `https://codescribeai.com/api/auth/google/callback`

---

### Phase 2: Frontend Implementation (1-2 hours)

#### 2.1 Update LoginModal

**File:** `client/src/components/LoginModal.jsx`

**Add state** (around line 23):
```javascript
const [isGoogleLoading, setIsGoogleLoading] = useState(false);
```

**Add handler** (after `handleGithubLogin`, around line 145):
```javascript
const handleGoogleLogin = () => {
  // Show loading state before redirect
  setIsGoogleLoading(true);

  // Track OAuth initiation with timestamp
  const startTime = Date.now();
  trackOAuth({
    provider: 'google',
    action: 'redirect_started',
    context: 'login_modal',
  });

  // Store start time in sessionStorage for callback tracking
  setSessionItem(STORAGE_KEYS.OAUTH_START_TIME, startTime.toString());
  setSessionItem(STORAGE_KEYS.OAUTH_CONTEXT, 'login_modal');

  // Redirect to Google OAuth endpoint
  window.location.href = `${API_URL}/api/auth/google`;
};
```

**Update OAuth section** (around line 476-530):

Replace single GitHub button with 2-column grid:

```jsx
{/* Divider */}
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
      Or continue with
    </span>
  </div>
</div>

{/* OAuth Buttons */}
<div className="grid grid-cols-2 gap-3">
  {/* GitHub OAuth Button */}
  <button
    type="button"
    onClick={handleGithubLogin}
    disabled={isLoading || isGithubLoading}
    className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isGithubLoading ? (
      <>
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-slate-700 rounded-full animate-spin" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">GitHub</span>
      </>
    ) : (
      <>
        <Github className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">GitHub</span>
      </>
    )}
  </button>

  {/* Google OAuth Button */}
  <button
    type="button"
    onClick={handleGoogleLogin}
    disabled={isLoading || isGoogleLoading}
    className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isGoogleLoading ? (
      <>
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-slate-700 rounded-full animate-spin" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
      </>
    ) : (
      <>
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
      </>
    )}
  </button>
</div>
```

**Key Changes:**
- Two-column grid layout for OAuth buttons
- Compact button design (removed "Continue with" prefix)
- Google branded icon (official 4-color logo)
- Loading states for both providers
- Disabled state prevents double-clicks

---

#### 2.2 Update SignupModal

**File:** `client/src/components/SignupModal.jsx`

Apply identical changes as LoginModal:

1. Add `isGoogleLoading` state (around line 24)
2. Add `handleGoogleSignup` handler (around line 268):
   ```javascript
   const handleGoogleSignup = () => {
     setIsGoogleLoading(true);

     const startTime = Date.now();
     trackOAuth({
       provider: 'google',
       action: 'redirect_started',
       context: 'signup_modal', // Different context
     });

     setSessionItem(STORAGE_KEYS.OAUTH_START_TIME, startTime.toString());
     setSessionItem(STORAGE_KEYS.OAUTH_CONTEXT, 'signup_modal');

     window.location.href = `${API_URL}/api/auth/google`;
   };
   ```
3. Update OAuth buttons section to 2-column grid (same as LoginModal)

---

#### 2.3 AuthCallback Component

**File:** `client/src/components/AuthCallback.jsx`

**No changes needed!**

The component already:
- Extracts generic `token` from URL
- Works with any OAuth provider (GitHub, Google, future providers)
- Handles pending subscription intents
- Tracks OAuth completion timing

---

### Phase 3: Google Cloud Console Setup (1 hour)

#### 3.1 Create OAuth Application

**Navigate to:** [Google Cloud Console](https://console.cloud.google.com/)

**Steps:**

1. **Create Project** (or select existing)
   - Project name: `CodeScribe AI`
   - Organization: Personal (or your org)
   - Click **CREATE**

2. **Enable Google+ API** (if not already enabled)
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **ENABLE**

3. **Configure OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**
   - User Type: **External**
   - Click **CREATE**

   **App Information:**
   - App name: `CodeScribe AI`
   - User support email: `your-email@example.com`
   - App logo: (optional - upload logo)

   **App Domain:**
   - Application home page: `https://codescribeai.com`
   - Application privacy policy: `https://codescribeai.com/privacy`
   - Application terms of service: `https://codescribeai.com/terms`

   **Authorized Domains:**
   - `codescribeai.com`
   - `localhost` (for development)

   **Developer Contact:**
   - Email: `your-email@example.com`

   Click **SAVE AND CONTINUE**

4. **Scopes**
   - Click **ADD OR REMOVE SCOPES**
   - Select:
     - `.../auth/userinfo.email` - Email address
     - `.../auth/userinfo.profile` - Basic profile info
   - Click **UPDATE** → **SAVE AND CONTINUE**

5. **Test Users** (while in testing mode)
   - Add your email address
   - Add any team members' emails
   - Click **SAVE AND CONTINUE**

6. **Create OAuth Client ID**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**

   **Development Client:**
   - Application type: **Web application**
   - Name: `CodeScribe AI (Development)`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
   - Click **CREATE**
   - **Copy Client ID and Client Secret** → Save to `server/.env`

7. **Create Production OAuth Client**
   - Repeat step 6 with:
     - Name: `CodeScribe AI (Production)`
     - Authorized redirect URI: `https://codescribeai.com/api/auth/google/callback`
   - **Copy Client ID and Client Secret** → Save to Vercel environment variables

8. **Publish App** (when ready for production)
   - Go to **OAuth consent screen**
   - Click **PUBLISH APP**
   - Submit for verification (if needed for large user base)

---

#### 3.2 Environment Variable Setup

**Local Development:**

Add to `server/.env`:
```env
GOOGLE_CLIENT_ID=123456789012-abc123xyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

**Vercel Production:**

1. Go to Vercel dashboard
2. Select **codescribe-ai** project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `GOOGLE_CLIENT_ID` = `production-client-id.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` = `GOCSPX-production-secret`
   - `GOOGLE_CALLBACK_URL` = `https://codescribeai.com/api/auth/google/callback`
5. Apply to: **Production**, **Preview**, **Development**
6. Click **Save**
7. Redeploy: `git push origin main`

---

#### 3.3 Security Considerations

**OAuth Consent Screen:**
- Use **External** user type (allows any Google account)
- Keep app in **Testing** mode during development
- **Publish** app before production launch
- May need verification for > 100 users (Google review process)

**Redirect URIs:**
- Must match exactly (including protocol, port, path)
- Use different OAuth apps for dev/prod (recommended)
- OR use single app with multiple redirect URIs (current pattern)

**Scopes:**
- Only request `profile` and `email` (minimal required)
- Users see clear permission request
- No sensitive scopes (Calendar, Drive, etc.)

**Client Secret:**
- Never commit to Git
- Rotate if compromised
- Store in environment variables only
- Use different secrets for dev/prod

---

### Phase 4: Testing (1-2 hours)

#### 4.1 Backend Integration Tests

**Create:** `server/tests/integration/google-oauth.test.js`

```javascript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import passport from 'passport';
import jwt from 'jsonwebtoken';

// Mock dependencies BEFORE importing routes
jest.mock('../../models/User.js', () => ({
  default: {
    findOrCreateByGoogle: jest.fn(),
  },
}));

jest.mock('../../models/Usage.js', () => ({
  default: {
    migrateAnonymousUsage: jest.fn(),
  },
}));

// Import after mocks
import User from '../../models/User.js';
import Usage from '../../models/Usage.js';

// Mock Google OAuth strategy
class MockGoogleStrategy extends passport.Strategy {
  constructor(options, verify) {
    super();
    this.name = 'google';
    this._verify = verify;
  }

  authenticate(req, options) {
    // Simulate successful Google OAuth
    const mockProfile = {
      id: 'google-user-123',
      displayName: 'Test User',
      emails: [{ value: 'test@example.com', verified: true }],
    };

    this._verify(
      'mock-access-token',
      'mock-refresh-token',
      mockProfile,
      (err, user) => {
        if (err) return this.error(err);
        if (!user) return this.fail();
        this.success(user);
      }
    );
  }
}

// Install mock strategy
passport.use(new MockGoogleStrategy(
  {
    clientID: 'test-client-id',
    clientSecret: 'test-client-secret',
    callbackURL: 'http://localhost:3000/api/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found'));
      }
      const user = await User.findOrCreateByGoogle({
        googleId: profile.id,
        email,
      });
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

describe('Google OAuth Integration', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    const { default: createApp } = await import('../../app.js');
    app = createApp();
  });

  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await request(app)
        .get('/api/auth/google')
        .expect(302);

      expect(response.headers.location).toMatch(/accounts\.google\.com/);
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('should create new user from Google profile', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        google_id: 'google-user-123',
        tier: 'free',
        email_verified: true,
      };

      User.findOrCreateByGoogle.mockResolvedValue(mockUser);
      Usage.migrateAnonymousUsage.mockResolvedValue();

      const response = await request(app)
        .get('/api/auth/google/callback')
        .expect(302);

      expect(User.findOrCreateByGoogle).toHaveBeenCalledWith({
        googleId: 'google-user-123',
        email: 'test@example.com',
      });

      expect(response.headers.location).toMatch(/\/auth\/callback\?token=/);

      // Verify JWT token
      const token = response.headers.location.split('token=')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(mockUser.id);
    });

    it('should link Google account to existing user by email', async () => {
      const existingUser = {
        id: 5,
        email: 'existing@example.com',
        password_hash: 'hashed-password',
        github_id: null,
        google_id: null,
      };

      const updatedUser = {
        ...existingUser,
        google_id: 'google-user-456',
        email_verified: true,
      };

      User.findOrCreateByGoogle.mockResolvedValue(updatedUser);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .expect(302);

      expect(response.headers.location).toMatch(/\/auth\/callback\?token=/);
    });

    it('should migrate anonymous usage to user account', async () => {
      const mockUser = {
        id: 2,
        email: 'user@example.com',
        google_id: 'google-user-789',
      };

      User.findOrCreateByGoogle.mockResolvedValue(mockUser);
      Usage.migrateAnonymousUsage.mockResolvedValue();

      await request(app)
        .get('/api/auth/google/callback')
        .expect(302);

      expect(Usage.migrateAnonymousUsage).toHaveBeenCalled();
    });

    it('should handle missing email in Google profile', async () => {
      // Mock Google strategy to return profile without email
      passport.use('google', new MockGoogleStrategy(
        {},
        async (accessToken, refreshToken, profile, done) => {
          done(new Error('No email found'));
        }
      ));

      const response = await request(app)
        .get('/api/auth/google/callback')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle database errors gracefully', async () => {
      User.findOrCreateByGoogle.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/auth/google/callback')
        .expect(302);

      expect(response.headers.location).toMatch(/\?auth_error=/);
    });
  });
});
```

**Test Coverage:**
- ✅ OAuth initiation redirects to Google
- ✅ New user creation from Google profile
- ✅ Account linking by email
- ✅ Anonymous usage migration
- ✅ Missing email error handling
- ✅ Database error handling
- ✅ JWT token generation

**Run tests:**
```bash
cd server
npm test google-oauth.test.js
```

---

#### 4.2 Manual Testing Checklist

**Development Environment:**

- [ ] **New User Signup**
  - Click "Continue with Google" in signup modal
  - Complete Google OAuth consent
  - Verify redirect to app with token
  - Check database: user created with `google_id`, `email_verified=true`
  - Verify user is logged in (token in localStorage)

- [ ] **Existing User Login** (email/password account)
  - Create account with email/password first
  - Log out
  - Click "Continue with Google" with same email
  - Verify account linked (same user ID, `google_id` now populated)
  - Verify `email_verified` changed to `true`
  - Verify can now log in with either method

- [ ] **Existing GitHub User**
  - Create account with GitHub OAuth
  - Log out
  - Click "Continue with Google" with same email
  - Verify both `github_id` and `google_id` populated
  - Verify can log in with either GitHub or Google

- [ ] **Anonymous Usage Migration**
  - Generate documentation without logging in (as anonymous user)
  - Sign up with Google OAuth
  - Check database: anonymous usage migrated to user account

- [ ] **Subscription Flow**
  - On Pricing page, click "Get Started" on paid tier
  - If not logged in, signup modal appears with subscription context
  - Complete Google OAuth
  - Verify redirected to Stripe checkout

- [ ] **Error Handling**
  - Start OAuth flow, click "Cancel" on Google consent screen
  - Verify redirected to app with error message
  - Start OAuth flow, disconnect internet mid-flow
  - Verify graceful error handling

- [ ] **Multiple Browsers/Devices**
  - Sign up with Google on Chrome
  - Log in with Google on Firefox
  - Verify same user account

**Production Environment:**

- [ ] Repeat all development tests
- [ ] Test with different Google account than dev
- [ ] Verify HTTPS callback URL works
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Check Vercel logs for any errors

**Database Verification:**

```sql
-- Check Google OAuth users
SELECT id, email, google_id, github_id, email_verified, created_at
FROM users
WHERE google_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check multi-provider accounts
SELECT id, email, google_id, github_id, password_hash IS NOT NULL AS has_password
FROM users
WHERE (google_id IS NOT NULL AND github_id IS NOT NULL)
   OR (google_id IS NOT NULL AND password_hash IS NOT NULL);
```

---

### Phase 5: Documentation (1-2 hours)

#### 5.1 Create Google OAuth Setup Guide

**File:** `docs/deployment/GOOGLE-OAUTH-SETUP.md`

**Sections:**
1. Overview
2. Google Cloud Console setup (step-by-step with screenshots)
3. OAuth consent screen configuration
4. Creating OAuth credentials (dev + prod)
5. Environment variables setup
6. Testing procedures
7. Troubleshooting (10+ common issues)
8. Security best practices
9. Production deployment checklist
10. Appendix (scopes explanation, error codes)

**Reference:** Mirror structure of `GITHUB-OAUTH-SETUP.md` (1,353 lines)

---

#### 5.2 Update Project Documentation

**File:** `CLAUDE.md`

Update authentication section (around line 350):
```markdown
### Authentication Options

1. **Email & Password** - Traditional authentication with email verification
2. **GitHub OAuth** - Sign in with GitHub account
3. **Google OAuth** - Sign in with Google account (✨ NEW)

**Multi-Provider Accounts:**
Users can link multiple authentication methods:
- Email/password + GitHub
- Email/password + Google
- GitHub + Google
- Email/password + GitHub + Google

**Email Verification:**
- Email/password users: Require verification email
- GitHub OAuth users: Auto-verified (GitHub verified)
- Google OAuth users: Auto-verified (Google verified)
```

Update environment variables section:
```markdown
### OAuth Configuration

**GitHub OAuth:**
- `GITHUB_CLIENT_ID` - OAuth app client ID
- `GITHUB_CLIENT_SECRET` - OAuth app secret
- `GITHUB_CALLBACK_URL` - Callback URL

**Google OAuth:** (✨ NEW)
- `GOOGLE_CLIENT_ID` - OAuth client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_CALLBACK_URL` - Callback URL
```

---

**File:** `docs/deployment/VERCEL-ENVIRONMENT-VARIABLES.md`

Add Google OAuth section:
```markdown
### Google OAuth

**Required for:** Google sign-in feature

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console | `123456789012-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-abc123xyz` |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `https://codescribeai.com/api/auth/google/callback` |

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth application
3. Copy Client ID and Client Secret
4. Add to Vercel environment variables
5. Redeploy application

**Security:**
- Use different credentials for production vs. development
- Rotate credentials if compromised
- Never commit to Git
```

---

**File:** `docs/api/API-Reference.md`

Add Google OAuth endpoints:

```markdown
### Google OAuth

#### Initiate Google OAuth

```http
GET /api/auth/google
```

**Description:** Redirects user to Google's OAuth consent screen.

**Query Parameters:** None

**Scopes Requested:**
- `profile` - Basic profile information
- `email` - Email address

**Response:** 302 Redirect to Google

---

#### Google OAuth Callback

```http
GET /api/auth/google/callback
```

**Description:** Handles OAuth callback from Google after user authorization.

**Query Parameters:**
- `code` - Authorization code from Google (provided by Google)
- `state` - CSRF protection token (provided by Google)

**Success Response:**
- **Code:** 302 Redirect
- **Location:** `{CLIENT_URL}/auth/callback?token={jwt_token}`

**Error Response:**
- **Code:** 302 Redirect
- **Location:** `{CLIENT_URL}/?auth_error={error_code}`

**Error Codes:**
- `google_auth_failed` - User cancelled or Google rejected
- `callback_processing_failed` - Server error during token generation

**User Creation:**
- New users created with `email_verified=true`
- Existing users (by email) linked to Google account
- Anonymous usage migrated by IP address
```

---

#### 5.3 Update Other Docs

**File:** `docs/authentication/PASSWORD-RESET-SETUP.md`

Add note about OAuth users:
```markdown
### OAuth Users

Users who sign up with GitHub or Google OAuth do **not** have passwords and cannot use the password reset flow.

If an OAuth user tries to reset their password:
- The system checks for `github_id` or `google_id`
- Returns error: "Password management is handled through your GitHub/Google account"
- User must log in via OAuth instead

If a user has both password and OAuth linked:
- They can use password reset (password takes precedence)
- They can also log in via OAuth
```

---

### Phase 6: Optional Enhancements (Future)

#### 6.1 Settings Page - Connected Accounts

**File:** `client/src/pages/Settings.jsx` (Account tab)

**Feature:** Show OAuth providers connected to account

```jsx
{/* Connected Accounts Section */}
<div className="pt-6 border-t border-slate-200 dark:border-slate-700">
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
    Connected Accounts
  </h3>
  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
    Connect multiple sign-in methods to your account for easier access.
  </p>

  <div className="space-y-3">
    {/* GitHub */}
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <Github className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">GitHub</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Sign in with your GitHub account
          </div>
        </div>
      </div>
      {user?.github_id ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            Connected
          </span>
          <button
            className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            onClick={() => handleDisconnectProvider('github')}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="btn-secondary text-sm"
          onClick={() => handleConnectProvider('github')}
        >
          Connect
        </button>
      )}
    </div>

    {/* Google */}
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          {/* Google icon SVG */}
        </svg>
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">Google</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Sign in with your Google account
          </div>
        </div>
      </div>
      {user?.google_id ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            Connected
          </span>
          <button
            className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            onClick={() => handleDisconnectProvider('google')}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="btn-secondary text-sm"
          onClick={() => handleConnectProvider('google')}
        >
          Connect
        </button>
      )}
    </div>
  </div>

  {/* Warning if only one provider connected */}
  {(user?.google_id || user?.github_id) && !user?.password_hash && (
    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <p className="text-xs text-yellow-800 dark:text-yellow-200">
        <strong>Tip:</strong> Consider setting a password as a backup sign-in method.
      </p>
    </div>
  )}
</div>
```

**Backend Route:** `POST /api/auth/disconnect-oauth`
```javascript
router.post('/disconnect-oauth', requireAuth, async (req, res) => {
  const { provider } = req.body; // 'github' or 'google'
  const userId = req.user.userId;

  // Prevent disconnecting if it's the only auth method
  const user = await User.findById(userId);
  const authMethodCount =
    (user.password_hash ? 1 : 0) +
    (user.github_id ? 1 : 0) +
    (user.google_id ? 1 : 0);

  if (authMethodCount <= 1) {
    return res.status(400).json({
      error: 'Cannot disconnect your only authentication method'
    });
  }

  // Disconnect provider
  const field = provider === 'github' ? 'github_id' : 'google_id';
  await sql`
    UPDATE users
    SET ${sql(field)} = NULL
    WHERE id = ${userId}
  `;

  res.json({ success: true });
});
```

---

#### 6.2 Account Recovery via OAuth

**Scenario:** User forgets password but has OAuth linked

**UX Flow:**
1. User clicks "Forgot Password"
2. Enters email
3. If email has OAuth linked, show:
   ```
   Your account is connected to Google/GitHub.
   You can sign in using those methods instead.

   [Sign in with Google] [Sign in with GitHub]

   Or, we can send a password reset email if you prefer.
   ```

**Implementation:**
- Check `User.findByEmail()` for `github_id` / `google_id`
- Show OAuth buttons if linked
- Still allow password reset (don't force OAuth)

---

#### 6.3 OAuth Provider Icons in UI

**Show provider used for signup:**
- User profile menu: "Signed in with Google"
- Admin dashboard: Show signup method (email/GitHub/Google)
- Usage dashboard: Display account type

---

## Implementation Checklist

### Backend Tasks

- [ ] Install `passport-google-oauth20` package
- [ ] Create database migration `013-add-google-oauth.sql`
- [ ] Test migration in Docker sandbox
- [ ] Apply migration to Neon dev database
- [ ] Update `server/src/config/passport.js` with Google strategy
- [ ] Add `findOrCreateByGoogle()` to User model
- [ ] Update `findById` and `findByEmail` to include `google_id`
- [ ] Add Google OAuth routes to `server/src/routes/auth.js`
- [ ] Add environment variables to `server/.env`
- [ ] Test backend routes with Postman/curl

### Frontend Tasks

- [ ] Update `LoginModal.jsx` with Google button
- [ ] Add `handleGoogleLogin()` handler
- [ ] Add `isGoogleLoading` state
- [ ] Update `SignupModal.jsx` with Google button
- [ ] Add `handleGoogleSignup()` handler
- [ ] Change OAuth layout to 2-column grid
- [ ] Test modal functionality

### Google Cloud Setup

- [ ] Create/select project in Google Cloud Console
- [ ] Configure OAuth consent screen
- [ ] Create development OAuth client
- [ ] Create production OAuth client
- [ ] Copy credentials to environment variables
- [ ] Test OAuth flow in development

### Testing

- [ ] Create `google-oauth.test.js` integration tests
- [ ] Run backend tests
- [ ] Manual test: new user signup with Google
- [ ] Manual test: account linking by email
- [ ] Manual test: multi-provider account (email + GitHub + Google)
- [ ] Manual test: anonymous usage migration
- [ ] Manual test: subscription flow with Google OAuth
- [ ] Test on production domain
- [ ] Test on mobile devices

### Documentation

- [ ] Create `GOOGLE-OAUTH-SETUP.md` guide
- [ ] Update `CLAUDE.md` authentication section
- [ ] Update `VERCEL-ENVIRONMENT-VARIABLES.md`
- [ ] Update `API-Reference.md` with Google endpoints
- [ ] Update `PASSWORD-RESET-SETUP.md` with OAuth notes
- [ ] Review all docs for accuracy

### Deployment

- [ ] Commit changes to dev branch
- [ ] Create PR with detailed description
- [ ] Run full test suite
- [ ] Deploy to Vercel preview environment
- [ ] Test on preview URL
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Verify production OAuth flow
- [ ] Monitor Vercel logs for errors

---

## File Summary

### Files to Create (4)

1. `server/src/db/migrations/013-add-google-oauth.sql` - Database migration
2. `server/tests/integration/google-oauth.test.js` - Integration tests
3. `docs/deployment/GOOGLE-OAUTH-SETUP.md` - Setup guide
4. `docs/planning/GOOGLE-OAUTH-IMPLEMENTATION.md` - This document

### Files to Modify (10)

**Backend (5):**
1. `server/src/config/passport.js` - Add Google strategy
2. `server/src/routes/auth.js` - Add Google OAuth routes
3. `server/src/models/User.js` - Add `findOrCreateByGoogle()`
4. `server/package.json` - Add `passport-google-oauth20`
5. `server/.env` - Add Google environment variables

**Frontend (2):**
1. `client/src/components/LoginModal.jsx` - Add Google button
2. `client/src/components/SignupModal.jsx` - Add Google button

**Documentation (3):**
1. `CLAUDE.md` - Update auth section
2. `docs/deployment/VERCEL-ENVIRONMENT-VARIABLES.md` - Add Google vars
3. `docs/api/API-Reference.md` - Document Google endpoints

---

## Dependencies

### New Package

**Name:** `passport-google-oauth20`
**Version:** Latest (check npm)
**License:** MIT
**Purpose:** Google OAuth 2.0 authentication strategy for Passport
**Size:** ~50KB

**Install:**
```bash
npm install passport-google-oauth20
```

### Existing Dependencies (No Changes)

- `passport` - Core authentication middleware
- `passport-jwt` - JWT authentication strategy
- `passport-local` - Email/password strategy
- `passport-github2` - GitHub OAuth strategy
- `jsonwebtoken` - JWT token generation/verification

---

## Security Considerations

### OAuth Security Best Practices

1. **Client Secret Protection**
   - Never commit to Git
   - Use environment variables
   - Rotate if compromised
   - Different secrets for dev/prod

2. **Redirect URI Validation**
   - Google validates against registered URIs
   - Use HTTPS in production
   - No wildcards allowed
   - Exact match required (including trailing slash)

3. **State Parameter** (CSRF Protection)
   - Passport automatically handles state
   - Validates state token on callback
   - Prevents CSRF attacks

4. **Scope Minimization**
   - Only request `profile` and `email`
   - No sensitive scopes (Calendar, Drive, etc.)
   - Users see clear permission request

5. **Token Security**
   - JWT tokens expire after 7 days
   - Stored in localStorage (XSS risk mitigation via CSP)
   - HTTPOnly cookie would be more secure (future enhancement)

6. **Account Takeover Prevention**
   - Email verification required for email/password
   - OAuth users auto-verified (Google/GitHub verified)
   - Account linking requires matching email
   - Cannot disconnect last authentication method

### Common Vulnerabilities (Mitigated)

✅ **CSRF** - State parameter validates requests
✅ **Account takeover** - Email matching for account linking
✅ **Token theft** - Short expiration, secure storage
✅ **Scope creep** - Minimal scopes requested
✅ **Redirect URI manipulation** - Google validates exact match

---

## Performance Impact

### Backend

**Database:**
- One additional column: `google_id VARCHAR(255)`
- One additional index: `idx_users_google_id`
- Negligible impact on query performance

**OAuth Flow:**
- Redirect to Google: <100ms
- Callback processing: ~200ms (same as GitHub)
- JWT generation: <10ms

**Memory:**
- Passport Google strategy: ~1MB
- No significant memory impact

### Frontend

**Bundle Size:**
- Google icon SVG: ~1KB
- No additional JavaScript (OAuth via redirect)
- Button layout change: 0 bytes

**User Experience:**
- OAuth flow: 2-5 seconds (depends on Google response time)
- Same as GitHub OAuth
- No impact on page load times

---

## Analytics & Monitoring

### Metrics to Track

**OAuth Events:**
- `oauth_flow` - Initiation, completion, failure
- Provider: `'google'`
- Context: `'login_modal'` | `'signup_modal'`
- Duration: Time from redirect to callback

**User Metrics:**
- New users via Google OAuth
- Account linking events (Google → existing user)
- Multi-provider accounts (email + GitHub + Google)
- Google OAuth login frequency

**Errors:**
- OAuth failures (user cancelled, consent denied)
- Missing email errors
- Database errors during user creation
- Token generation failures

### Vercel Logs

Monitor for:
```
[Passport] Google OAuth callback invoked
[Passport] Email extracted: {email}
[Passport] User found/created: {id}
[Auth] Google OAuth error: {error}
```

---

## Rollback Plan

If issues arise after deployment:

### Quick Rollback (< 5 minutes)

1. **Disable Google OAuth** (no code changes required):
   - Remove `GOOGLE_CLIENT_ID` from Vercel environment variables
   - Passport will not initialize Google strategy
   - Users see GitHub + email/password only

2. **Revert Frontend Changes:**
   ```bash
   git revert <commit-sha>
   git push origin main
   ```

### Full Rollback (< 15 minutes)

1. Revert all commits
2. Redeploy previous version
3. Database migration can stay (harmless null column)

### Data Integrity

- No risk to existing users
- Google OAuth users can still use email/password if linked
- Migration can be reverted (remove `google_id` column)

---

## Future Enhancements

### Phase 7: Additional OAuth Providers (Future)

Following the same pattern:

**Microsoft OAuth** (`passport-azure-ad-oauth2`):
- Enterprise users (Outlook, Office 365)
- Same implementation pattern
- Add `microsoft_id` column

**Apple OAuth** (`passport-apple`):
- iOS users preference
- Requires Apple Developer account
- Add `apple_id` column

**Twitter/X OAuth** (`passport-twitter`):
- Social media integration
- OAuth 1.0a (different from OAuth 2.0)
- Add `twitter_id` column

### Settings Page Enhancements

- Show last sign-in method
- OAuth provider icons in user menu
- "Disconnect" functionality
- Primary authentication method selector

### Security Enhancements

- HTTPOnly cookies for JWT (instead of localStorage)
- Refresh tokens for longer sessions
- Multi-factor authentication (MFA)
- OAuth provider rate limiting

---

## Questions to Resolve Before Implementation

1. **OAuth App Strategy:**
   - Use single OAuth app for dev/prod? (Current GitHub pattern)
   - OR separate apps per environment? (Recommended)

2. **Email Conflicts:**
   - What if Google email doesn't match existing user exactly?
   - Support for email aliases (user+alias@gmail.com)?

3. **Disconnecting OAuth:**
   - Allow users to disconnect Google if it's their only auth method?
   - Require password setup before disconnecting?

4. **Testing Scope:**
   - How many test users needed for QA?
   - Test with G Suite accounts? (Organizational accounts)

5. **Production Verification:**
   - Google requires app verification for >100 users
   - Submit for verification before launch?
   - Or launch in "Testing" mode first?

---

## Success Criteria

### Functional Requirements

✅ Users can sign up with Google
✅ Users can log in with Google
✅ Existing users can link Google to their account
✅ Multi-provider accounts work (email + GitHub + Google)
✅ Anonymous usage migrated on first OAuth login
✅ Subscription flow works with Google OAuth
✅ Email auto-verified for Google OAuth users

### Non-Functional Requirements

✅ OAuth flow completes in <5 seconds
✅ No increase in page load times
✅ All tests pass (100% coverage for new code)
✅ Documentation complete and accurate
✅ Production deployment successful
✅ Zero downtime during deployment
✅ No errors in Vercel logs for 24 hours post-launch

### User Experience

✅ Google button appears in login/signup modals
✅ Loading states during OAuth flow
✅ Clear error messages if OAuth fails
✅ Seamless account linking (no double accounts)
✅ Consistent with GitHub OAuth UX

---

## Conclusion

This plan provides a complete roadmap for implementing Google OAuth in CodeScribe AI. The implementation follows established patterns from the existing GitHub OAuth integration, making it a straightforward addition with minimal risk.

**Key Benefits:**
- Increased sign-up conversion (more authentication options)
- Better user experience (one-click sign-in)
- Account linking flexibility (users can have multiple sign-in methods)
- Consistency with industry standards (Google OAuth widely used)

**Next Steps:**
1. Review and approve this plan
2. Prioritize implementation (add to roadmap)
3. Create Google Cloud Console OAuth app
4. Begin Phase 1 (Backend Implementation)

---

**Document Status:** ✅ Complete and Ready for Implementation
**Last Updated:** November 12, 2025
**Maintainer:** Development Team
