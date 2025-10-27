# GitHub OAuth Setup Guide

Complete guide for configuring GitHub OAuth authentication for CodeScribe AI across all environments.

**Last Updated:** October 27, 2025
**Service:** [GitHub OAuth Apps](https://github.com/settings/developers)
**Cost:** Free (unlimited OAuth apps)

---

## 🎯 Quick Start - Your Actual Setup

**This is the GitHub OAuth configuration currently running for CodeScribe AI:**

### OAuth Configuration
- **Strategy:** Single OAuth App (shared across environments)
- **App Name:** CodeScribe AI Production
- **Homepage URL:** https://codescribeai.com
- **Callback URLs:**
  - Production: `https://codescribeai.com/api/auth/github/callback`
  - Preview: `https://codescribe-ai-*.vercel.app/api/auth/github/callback`
  - Development: `http://localhost:3000/api/auth/github/callback`

### Environment Variables
- **Client ID:** Same across all environments
- **Client Secret:** Same across all environments (stored securely in Vercel)
- **Callback URL:** Environment-specific (configured per deployment)

### Key Decisions Made
1. ✅ **Single OAuth app** for all environments (simpler to manage)
2. ✅ **Multiple callback URLs** registered (supports all deployment types)
3. ✅ **Shared credentials** (same client ID/secret everywhere)
4. ✅ **Vercel handles callback routing** (automatic per environment)

**Why single app:**
- Simpler to maintain (one app instead of three)
- GitHub allows multiple callback URLs per app
- No credential management complexity
- Works for portfolio/MVP projects

**Alternative:** See detailed guide for separate OAuth apps per environment (enterprise approach)

**Jump to:** [Setup Instructions](#step-1-create-github-oauth-apps) | [Complete Guide](#oauth-strategy-overview)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [OAuth Strategy Overview](#oauth-strategy-overview)
3. [Environment Configuration Strategy](#environment-configuration-strategy)
4. [Step 1: Create GitHub OAuth App(s)](#step-1-create-github-oauth-apps)
5. [Step 2: Configure Callback URLs](#step-2-configure-callback-urls)
6. [Step 3: Generate Client Credentials](#step-3-generate-client-credentials)
7. [Step 4: Update Environment Variables](#step-4-update-environment-variables)
8. [Step 5: Test OAuth Flow](#step-5-test-oauth-flow)
9. [Step 6: Production Deployment](#step-6-production-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Security Best Practices](#security-best-practices)

---

## Prerequisites

- GitHub account with OAuth app creation access
- CodeScribe AI application running locally
- Vercel account and project configured
- Production domain configured (e.g., `codescribeai.com`)
- Database connection configured (see [PRODUCTION-DB-SETUP.md](../database/PRODUCTION-DB-SETUP.md))

---

## OAuth Strategy Overview

CodeScribe AI uses GitHub OAuth 2.0 for social authentication, allowing users to sign in with their GitHub account instead of creating a password.

### How It Works

1. **User Initiates Login:**
   - User clicks "Sign in with GitHub" button
   - Frontend redirects to `GET /api/auth/github`

2. **GitHub Authorization:**
   - Backend redirects to GitHub OAuth consent screen
   - User approves access (scope: `user:email`)
   - GitHub redirects back to your callback URL with authorization code

3. **Token Exchange:**
   - Passport GitHub strategy exchanges code for access token
   - Retrieves user profile (GitHub ID, email, username)

4. **User Creation/Login:**
   - `User.findOrCreateByGithub()` checks if user exists by GitHub ID
   - If not found, checks by email (account linking)
   - Creates new user if no match found
   - Returns user object to Passport

5. **Session Creation:**
   - Generates JWT token for user
   - Redirects to frontend with token in URL
   - Frontend stores token in localStorage

### Benefits

- ✅ **No password management:** Users don't need to remember another password
- ✅ **Faster signup:** One-click registration
- ✅ **Account linking:** Can link GitHub to existing email/password account
- ✅ **Developer-friendly:** Target audience already has GitHub accounts
- ✅ **Secure:** OAuth 2.0 standard with HTTPS enforcement

### Code Flow

```
Frontend Button → GET /api/auth/github
                    ↓
                  GitHub Consent Screen
                    ↓
                  GET /api/auth/github/callback?code=xxx
                    ↓
                  Passport exchanges code for token
                    ↓
                  User.findOrCreateByGithub()
                    ↓
                  Generate JWT
                    ↓
                  Redirect to /auth/callback?token=xxx
                    ↓
                  Frontend stores token
```

**Key Files:**
- [server/src/config/passport.js:70-98](server/src/config/passport.js#L70-L98) - GitHub strategy configuration
- [server/src/routes/auth.js:189-225](server/src/routes/auth.js#L189-L225) - OAuth routes
- [server/src/models/User.js:81-119](server/src/models/User.js#L81-L119) - User creation/linking logic

---

## Environment Configuration Strategy

**IMPORTANT:** Like your database and email setup, GitHub OAuth should be configured differently for development and production environments.

### Strategy Comparison

| Aspect | Option 1: Single OAuth App | Option 2: Separate OAuth Apps |
|--------|----------------------------|------------------------------|
| **OAuth Apps** | 1 shared app | Dev app + Prod app |
| **Callback URLs** | Multiple URLs on one app | One URL per app |
| **Client Credentials** | 1 set of credentials | 2 sets of credentials |
| **Complexity** | Simpler (one app) | More complex (two apps) |
| **Isolation** | Shared user consent | Separate consent per env |
| **Security** | Medium (credential leakage affects both) | High (complete separation) |
| **Best For** | Portfolio, small SaaS | Production apps, teams |

### **Recommended for CodeScribe AI: Option 2 (Separate OAuth Apps)**

**Why:**
- ✅ **Security:** Production credentials never exposed in local development
- ✅ **Testing:** Can test OAuth flow without affecting production user data
- ✅ **Debugging:** Separate user consent screens help identify environment issues
- ✅ **Best Practice:** Matches industry standard for OAuth configuration
- ✅ **Vercel Integration:** Preview deployments can use development app

**Configuration:**

| Environment | OAuth App Name | Callback URL | Client Credentials |
|-------------|---------------|--------------|-------------------|
| **Development** | `CodeScribe AI (Development)` | `http://localhost:3000/api/auth/github/callback` | `GITHUB_CLIENT_ID_DEV`, `GITHUB_CLIENT_SECRET_DEV` |
| **Preview** | `CodeScribe AI (Development)` | Use development app | Same as development |
| **Production** | `CodeScribe AI` | `https://codescribeai.com/api/auth/github/callback` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |

**Benefits:**
- ✅ Dev credentials can't accidentally be used in production
- ✅ Production OAuth app can have stricter security settings
- ✅ Easy to revoke dev credentials without affecting production
- ✅ Separate analytics for dev vs prod OAuth usage

**Limitations:**
- ⚠️ Requires managing two OAuth apps
- ⚠️ Users see different app names in consent screen (minor)
- ⚠️ Must update callback URLs if dev environment changes

---

### Alternative: Option 1 (Single OAuth App) - Quick Setup

**When to use:**
- Solo developer, no team
- Portfolio project with minimal traffic
- Want simplest possible setup

**Configuration:**

Add multiple callback URLs to one OAuth app:
- `http://localhost:3000/api/auth/github/callback` (development)
- `https://codescribeai.com/api/auth/github/callback` (production)

**Benefits:**
- ✅ Single OAuth app to manage
- ✅ Fewer credentials to track
- ✅ Faster initial setup (5 minutes vs 10 minutes)

**Drawbacks:**
- ❌ Same credentials used in all environments (security risk)
- ❌ No isolation between dev and prod
- ❌ Credential leakage affects production immediately

**Not Recommended:** This guide focuses on **Option 2 (Separate Apps)** for better security and production-readiness.

---

## Step 1: Create GitHub OAuth App(s)

### 1.1 Create Development OAuth App

1. **Navigate to GitHub Developer Settings:**
   - Go to [github.com/settings/developers](https://github.com/settings/developers)
   - Or: GitHub Profile → Settings → Developer settings → OAuth Apps

2. **Create New OAuth App:**
   - Click **"New OAuth App"**
   - Fill in application details:

   | Field | Value |
   |-------|-------|
   | **Application name** | `CodeScribe AI (Development)` |
   | **Homepage URL** | `http://localhost:5173` |
   | **Application description** | AI-powered code documentation generator - Development environment |
   | **Authorization callback URL** | `http://localhost:3000/api/auth/github/callback` |

   - ⚠️ **Important:** Use `http://` for localhost (HTTPS not required for local development)
   - ⚠️ **Port 3000:** This is your backend server port, not frontend (5173)

3. **Register Application:**
   - Click **"Register application"**
   - You'll be redirected to the app settings page

4. **Note Down Client ID:**
   - Copy the **Client ID** (e.g., `Iv1.abc123xyz`)
   - Save it securely (you'll need it in Step 4)

---

### 1.2 Generate Client Secret (Development)

1. **Generate Client Secret:**
   - On the OAuth app settings page, click **"Generate a new client secret"**
   - You may be prompted to authenticate with 2FA

2. **Copy Client Secret:**
   - ⚠️ **COPY IMMEDIATELY:** GitHub shows the secret only once
   - Secret format: 40-character alphanumeric string (e.g., `abc123def456...`)
   - Store securely in password manager or `.env` file

3. **Security Note:**
   - Treat client secrets like passwords
   - Never commit to Git
   - Never share publicly
   - Rotate periodically (every 6-12 months)

---

### 1.3 Create Production OAuth App

1. **Create Second OAuth App:**
   - Go back to [github.com/settings/developers](https://github.com/settings/developers)
   - Click **"New OAuth App"** again

2. **Fill in Production Details:**

   | Field | Value |
   |-------|-------|
   | **Application name** | `CodeScribe AI` |
   | **Homepage URL** | `https://codescribeai.com` |
   | **Application description** | AI-powered code documentation generator |
   | **Authorization callback URL** | `https://codescribeai.com/api/auth/github/callback` |

   - ✅ **Must use HTTPS** for production
   - ✅ Use your actual production domain
   - ⚠️ Do NOT include `www.` unless that's your primary domain

3. **Register and Generate Credentials:**
   - Click **"Register application"**
   - Copy **Client ID** (different from dev app)
   - Click **"Generate a new client secret"**
   - Copy **Client Secret** immediately

4. **Verify Production App:**
   - You should now have **two** OAuth apps:
     - `CodeScribe AI (Development)` - for local development
     - `CodeScribe AI` - for production

---

### 1.4 Optional: Upload App Logo

**For Production OAuth App:**
1. Go to production OAuth app settings
2. Click **"Upload new logo"**
3. Upload your app icon/logo (recommended: 200x200px PNG)
4. Benefits:
   - ✅ Professional appearance in OAuth consent screen
   - ✅ User trust and brand recognition
   - ✅ Differentiates your app from generic apps

---

## Step 2: Configure Callback URLs

### 2.1 Understanding Callback URLs

The **Authorization callback URL** is where GitHub redirects users after they authorize your app.

**Format:**
```
{PROTOCOL}://{DOMAIN}:{PORT}/api/auth/github/callback
```

**Examples:**
- Development: `http://localhost:3000/api/auth/github/callback`
- Production: `https://codescribeai.com/api/auth/github/callback`
- Staging: `https://staging.codescribeai.com/api/auth/github/callback`

**⚠️ Critical Rules:**
1. **Must match exactly:** GitHub rejects mismatched URLs
2. **HTTPS required in production:** GitHub enforces HTTPS for non-localhost
3. **Port must be specified:** Use port 3000 (backend), not 5173 (frontend)
4. **No trailing slash:** `/callback` not `/callback/`
5. **No query parameters:** Base URL only

---

### 2.2 Verify Callback URL Configuration

**Development App:**
1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click on `CodeScribe AI (Development)`
3. Verify **Authorization callback URL:** `http://localhost:3000/api/auth/github/callback`
4. If incorrect, update and click **"Update application"**

**Production App:**
1. Click on `CodeScribe AI` (production app)
2. Verify **Authorization callback URL:** `https://codescribeai.com/api/auth/github/callback`
3. Update if needed

---

### 2.3 Handling Multiple Environments (Alternative)

If using **Option 1 (Single OAuth App)**, you can add multiple callback URLs:

1. In OAuth app settings, update **Authorization callback URL** to include all environments:
   ```
   http://localhost:3000/api/auth/github/callback
   https://codescribeai.com/api/auth/github/callback
   https://preview.codescribeai.com/api/auth/github/callback
   ```

2. GitHub will accept any of these URLs during OAuth flow

**Note:** This guide uses **Option 2 (Separate Apps)**, so one URL per app.

---

## Step 3: Generate Client Credentials

You should have already generated credentials in Step 1. This section documents how to manage and rotate them.

### 3.1 Current Credentials Checklist

**Development OAuth App:**
- [ ] Client ID (starts with `Iv1.`)
- [ ] Client Secret (40 characters)

**Production OAuth App:**
- [ ] Client ID (different from development)
- [ ] Client Secret (different from development)

---

### 3.2 Rotating Client Secrets

**When to rotate:**
- Every 6-12 months (security best practice)
- If credentials are accidentally exposed (e.g., committed to Git)
- When team member with access leaves
- If suspicious OAuth activity detected

**How to rotate:**
1. Go to OAuth app settings in GitHub
2. Click **"Generate a new client secret"**
3. Copy new secret immediately
4. Update environment variables in:
   - Local `.env` file
   - Vercel environment variables
5. Click **"Revoke"** next to old secret
6. Test OAuth flow with new credentials
7. **Only revoke old secret AFTER verifying new one works**

---

### 3.3 Credential Storage Best Practices

**✅ Secure Storage:**
- Use environment variables (`.env` files)
- Store in password manager (1Password, LastPass, Bitwarden)
- Use secret management services (Vercel encrypted env vars, AWS Secrets Manager)

**❌ Never Store In:**
- Git repositories (even private repos)
- Frontend JavaScript files
- Plain text files
- Slack messages or email
- Documentation (use placeholders like `Iv1.YOUR_CLIENT_ID_HERE`)

**`.gitignore` Verification:**
```bash
# Verify .env is ignored
git check-ignore server/.env
# Should output: server/.env

# If not ignored, add to .gitignore:
echo "server/.env" >> .gitignore
```

---

## Step 4: Update Environment Variables

### 4.1 Local Development Environment

Add to `server/.env`:

```env
# ============================================================================
# GitHub OAuth Configuration - Development
# ============================================================================
# OAuth app: "CodeScribe AI (Development)"
# Callback URL: http://localhost:3000/api/auth/github/callback
# Created: [DATE]
# Environment: Local development only
# ============================================================================

GITHUB_CLIENT_ID=Iv1.your_development_client_id_here
GITHUB_CLIENT_SECRET=your_development_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Frontend URL for OAuth redirect after login
CLIENT_URL=http://localhost:5173
```

**Notes:**
- Replace `your_development_client_id_here` with actual Client ID from Step 1.1
- Replace `your_development_client_secret_here` with actual Client Secret from Step 1.2
- `CLIENT_URL` is where users are redirected after successful OAuth (frontend)
- `GITHUB_CALLBACK_URL` is where GitHub redirects during OAuth (backend)

---

### 4.2 Vercel Environment Variables (Production)

1. **Navigate to Vercel Project Settings:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select project: **codescribe-ai**
   - Go to **Settings** → **Environment Variables**

2. **Add Production GitHub OAuth Variables:**

   Click **"Add Variable"** for each:

   | Key | Value | Environments |
   |-----|-------|-------------|
   | `GITHUB_CLIENT_ID` | `Iv1.production_client_id` | ✅ Production only |
   | `GITHUB_CLIENT_SECRET` | `production_client_secret` | ✅ Production only |
   | `GITHUB_CALLBACK_URL` | `https://codescribeai.com/api/auth/github/callback` | ✅ Production only |
   | `CLIENT_URL` | `https://codescribeai.com` | ✅ Production only |

   **How to add:**
   - **Step 1:** Click **"Add Variable"**
   - **Step 2:** Enter **Key:** `GITHUB_CLIENT_ID`
   - **Step 3:** Enter **Value:** Your production Client ID from Step 1.3
   - **Step 4:** **Environments:** Check **Production only** ✅ (uncheck Preview and Development)
   - **Step 5:** Click **"Save"**
   - **Repeat** for all four variables above

3. **Add Development/Preview GitHub OAuth Variables:**

   For Preview and Development environments, use your development OAuth app:

   | Key | Value | Environments |
   |-----|-------|-------------|
   | `GITHUB_CLIENT_ID` | `Iv1.development_client_id` | ✅ Preview, ✅ Development |
   | `GITHUB_CLIENT_SECRET` | `development_client_secret` | ✅ Preview, ✅ Development |
   | `GITHUB_CALLBACK_URL` | `http://localhost:3000/api/auth/github/callback` | ✅ Development only |
   | `GITHUB_CALLBACK_URL` | `https://your-preview-url.vercel.app/api/auth/github/callback` | ✅ Preview only* |
   | `CLIENT_URL` | `http://localhost:5173` | ✅ Development only |
   | `CLIENT_URL` | `https://your-preview-url.vercel.app` | ✅ Preview only* |

   **\*Preview Note:** Preview deployments have dynamic URLs. You can either:
   - Use development OAuth app with `http://localhost` (won't work for Vercel previews)
   - Add specific preview URLs to development OAuth app callback URLs
   - Skip OAuth testing in preview environments (recommended)

4. **Verify Environment Variables:**

   After adding all variables, your Vercel Environment Variables table should show:

   | Variable | Value (truncated) | Production | Preview | Development |
   |----------|------------------|------------|---------|-------------|
   | `GITHUB_CLIENT_ID` | `Iv1.abc123...` | ✅ | - | - |
   | `GITHUB_CLIENT_ID` | `Iv1.def456...` | - | ✅ | ✅ |
   | `GITHUB_CLIENT_SECRET` | `secret123...` | ✅ | - | - |
   | `GITHUB_CLIENT_SECRET` | `secret456...` | - | ✅ | ✅ |
   | `GITHUB_CALLBACK_URL` | `https://code...` | ✅ | - | - |
   | `GITHUB_CALLBACK_URL` | `http://local...` | - | - | ✅ |
   | `CLIENT_URL` | `https://code...` | ✅ | - | - |
   | `CLIENT_URL` | `http://local...` | - | - | ✅ |

---

### 4.3 Verify Configuration

**Local Development:**

Option 1: Check `.env` file directly:
```bash
cd server
cat .env | grep GITHUB
```

**Expected Output:**
```
GITHUB_CLIENT_ID=Iv1.your_development_client_id_here
GITHUB_CLIENT_SECRET=your_development_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

Option 2: Check when starting your dev server (recommended):
```bash
cd server
npm run dev
```

Look for this line in the startup logs:
```
✅ GitHub OAuth configured (Client ID: Iv1.abc123...)
```

Or if not configured, you'll see:
```
⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)
```

**Vercel Production:**
```bash
vercel env ls production
```

Should show:
```
GITHUB_CLIENT_ID (production)
GITHUB_CLIENT_SECRET (production)
GITHUB_CALLBACK_URL (production)
CLIENT_URL (production)
```

---

### 4.4 Code Integration Verification

Verify `server/src/config/passport.js` uses environment variables correctly:

```javascript
// Lines 70-98 in passport.js
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || `${profile.username}@github.user`;
          const user = await User.findOrCreateByGithub({
            githubId: profile.id,
            email,
          });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.warn('⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)');
}
```

**✅ Good:** Environment variables are checked before registering strategy
**✅ Good:** Fallback callback URL provided for development

---

## Step 5: Test OAuth Flow

### 5.1 Test Local Development

1. **Start Backend Server:**
   ```bash
   cd server
   npm run dev
   ```

   **Expected Output:**
   ```
   Server running on port 3000
   Passport GitHub OAuth strategy configured ✅
   ```

   **⚠️ If you see warning:**
   ```
   ⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)
   ```
   → Check `.env` file has correct variables (Step 4.1)

2. **Start Frontend Server:**
   ```bash
   cd client
   npm run dev
   ```

   **Expected Output:**
   ```
   Local: http://localhost:5173/
   ```

3. **Test OAuth Flow:**
   - Open browser: `http://localhost:5173`
   - Click **"Sign in with GitHub"** button
   - You should be redirected to GitHub OAuth consent screen

4. **Authorize Application:**
   - Review permissions (user:email)
   - Click **"Authorize [Your Name]"**
   - You should be redirected back to your application

5. **Verify Successful Login:**
   - Check if you're logged in (user menu/avatar visible)
   - Open browser DevTools → Console
   - Should see: `User logged in: { id: 1, email: "your@email.com", ... }`

6. **Check Database:**
   ```bash
   # Connect to your database
   psql $DATABASE_URL -c "SELECT id, email, github_id FROM users ORDER BY created_at DESC LIMIT 1;"
   ```

   **Expected Output:**
   ```
    id |      email       | github_id
   ----+------------------+-----------
     1  | your@email.com   | 12345678
   ```

---

### 5.2 Test Account Linking

**Scenario:** User already has an email/password account and wants to link GitHub.

1. **Create Email/Password Account:**
   - Sign up with email: `test@example.com` and password
   - Verify account is created in database

2. **Sign Out:**
   - Click logout

3. **Sign In with GitHub:**
   - Click **"Sign in with GitHub"**
   - GitHub account has same email: `test@example.com`

4. **Verify Account Linking:**
   - User should be logged into existing account (not create duplicate)
   - Check database:
     ```bash
     psql $DATABASE_URL -c "SELECT id, email, github_id, password_hash IS NOT NULL as has_password FROM users WHERE email = 'test@example.com';"
     ```

   **Expected Output:**
   ```
    id |       email       | github_id  | has_password
   ----+-------------------+------------+--------------
     1  | test@example.com  | 12345678   | t
   ```

   - ✅ `github_id` is populated (linked)
   - ✅ `has_password = t` (password still exists)
   - ✅ User can now log in with EITHER email/password OR GitHub

---

### 5.3 Debug OAuth Errors

**Common Errors:**

**Error 1: "Redirect URI mismatch"**
```
The redirect_uri MUST match the registered callback URL for this application.
```

**Solution:**
- Verify callback URL in GitHub OAuth app settings matches exactly:
  - Development: `http://localhost:3000/api/auth/github/callback`
  - Production: `https://codescribeai.com/api/auth/github/callback`
- Check for typos (trailing slash, http vs https, wrong port)
- Verify `GITHUB_CALLBACK_URL` environment variable

**Error 2: "Application suspended or disabled"**
```
This application has been suspended.
```

**Solution:**
- Check OAuth app status in GitHub developer settings
- Ensure you haven't violated GitHub Terms of Service
- Contact GitHub support if suspended incorrectly

**Error 3: "Internal server error"**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Solution:**
- Check server logs for detailed error:
  ```bash
  cd server
  npm run dev
  # Look for error messages after OAuth redirect
  ```
- Common causes:
  - Database connection failure
  - Missing environment variables
  - `User.findOrCreateByGithub()` throwing error
- Verify database is running and accessible
- Check [Troubleshooting](#troubleshooting) section below

---

## Step 6: Production Deployment

### 6.1 Pre-Deployment Checklist

**✅ GitHub OAuth Apps:**
- [ ] Production OAuth app created (`CodeScribe AI`)
- [ ] Callback URL configured: `https://codescribeai.com/api/auth/github/callback`
- [ ] Client ID and Secret generated and saved

**✅ Vercel Environment Variables:**
- [ ] `GITHUB_CLIENT_ID` set for Production environment
- [ ] `GITHUB_CLIENT_SECRET` set for Production environment
- [ ] `GITHUB_CALLBACK_URL` set to `https://codescribeai.com/api/auth/github/callback`
- [ ] `CLIENT_URL` set to `https://codescribeai.com`

**✅ Database:**
- [ ] Production database has `users` table with `github_id` column
- [ ] Database migrations applied (if using migrations)
- [ ] Database connection string in Vercel (`POSTGRES_URL` or similar)

**✅ Domain:**
- [ ] Custom domain configured in Vercel (`codescribeai.com`)
- [ ] HTTPS certificate active (automatic with Vercel)
- [ ] DNS records propagated (A/CNAME records pointing to Vercel)

---

### 6.2 Deploy to Production

1. **Commit Changes (if any):**
   ```bash
   git add .
   git commit -m "docs: add GitHub OAuth setup guide"
   git push origin main
   ```

2. **Deploy via Vercel:**
   - Vercel auto-deploys on push to `main` branch
   - Or manual deploy:
     ```bash
     vercel --prod
     ```

3. **Wait for Deployment:**
   - Monitor deployment in Vercel dashboard
   - Wait for "Ready" status (~2-3 minutes)

4. **Verify Deployment:**
   - Visit `https://codescribeai.com`
   - Check that site loads correctly

---

### 6.3 Test Production OAuth Flow

**⚠️ Important:** Test with a DIFFERENT GitHub account than used in development to avoid confusion.

1. **Navigate to Production Site:**
   - Open `https://codescribeai.com` in browser
   - Use incognito/private window for clean test

2. **Initiate OAuth Flow:**
   - Click **"Sign in with GitHub"**
   - Should redirect to GitHub consent screen

3. **Verify OAuth App Name:**
   - Consent screen should show: **"CodeScribe AI"** (production app)
   - NOT "CodeScribe AI (Development)"
   - If wrong app shown, check Vercel environment variables

4. **Authorize Application:**
   - Click **"Authorize"**
   - Should redirect to `https://codescribeai.com/auth/callback?token=xxx`

5. **Verify Login Success:**
   - Should redirect to dashboard or home page
   - User should be logged in (check user menu/avatar)
   - Token stored in localStorage

6. **Check Production Database:**
   ```bash
   # Connect to production database
   psql $PROD_DATABASE_URL -c "SELECT id, email, github_id, created_at FROM users ORDER BY created_at DESC LIMIT 1;"
   ```

   **Expected Output:**
   ```
    id |       email        | github_id  |      created_at
   ----+--------------------+------------+---------------------
     1  | user@example.com   | 87654321   | 2025-10-26 14:30:00
   ```

---

### 6.4 Verify Environment Isolation

**Test that development and production use separate OAuth apps:**

1. **Check Development (Local):**
   - Start local server: `npm run dev` in `server/`
   - Open `http://localhost:5173`
   - Click "Sign in with GitHub"
   - Consent screen should show: **"CodeScribe AI (Development)"**

2. **Check Production:**
   - Open `https://codescribeai.com`
   - Click "Sign in with GitHub"
   - Consent screen should show: **"CodeScribe AI"** (no "Development")

**✅ Success:** Different app names confirm separate OAuth apps are being used.

**❌ Failure:** If both show the same app name:
- Check Vercel environment variables (Step 4.2)
- Verify production variables are set for "Production" environment only
- Redeploy if needed: `vercel --prod`

---

## Troubleshooting

### Issue 1: "Internal server error" on Production

**Symptoms:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Root Cause:** Usually missing environment variables or database connection issues.

**Solutions:**

**1. Check Vercel Environment Variables:**
```bash
vercel env ls production
```

Verify all required variables are set:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `CLIENT_URL`
- `POSTGRES_URL` (or database connection string)
- `JWT_SECRET`
- `SESSION_SECRET`

**2. Check Vercel Deployment Logs:**
```bash
vercel logs [deployment-url]
```

Look for errors like:
- `⚠️  GitHub OAuth not configured`
- `Database connection failed`
- `User.findOrCreateByGithub is not a function`

**3. Verify Database Connection:**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Check `POSTGRES_URL` is set for Production
- Test connection:
  ```bash
  psql $PROD_DATABASE_URL -c "SELECT 1;"
  ```

**4. Verify Passport Strategy Registration:**
- Check server logs during startup
- Should see passport strategy registered
- If warning appears, environment variables are missing

**5. Redeploy After Fixing:**
```bash
vercel --prod
```

---

### Issue 2: Redirect URI Mismatch

**Symptoms:**
```
The redirect_uri MUST match the registered callback URL for this application.
```

**Solution:**

**1. Verify Callback URL in GitHub:**
- Go to [github.com/settings/developers](https://github.com/settings/developers)
- Click on your production OAuth app
- Check **Authorization callback URL:** `https://codescribeai.com/api/auth/github/callback`

**2. Verify Environment Variable:**
```bash
vercel env ls production | grep GITHUB_CALLBACK_URL
```

Expected output:
```
GITHUB_CALLBACK_URL: https://codescribeai.com/api/auth/github/callback
```

**3. Common Mistakes:**
- ❌ `http://codescribeai.com/...` (should be HTTPS)
- ❌ `https://www.codescribeai.com/...` (if domain is non-www)
- ❌ `https://codescribeai.com/api/auth/github/callback/` (trailing slash)
- ❌ `https://codescribe-ai.vercel.app/...` (Vercel URL, not custom domain)

**4. Update and Redeploy:**
- Fix callback URL in GitHub OAuth app settings
- Update `GITHUB_CALLBACK_URL` in Vercel if needed
- Redeploy: `vercel --prod`

---

### Issue 3: Wrong OAuth App in Production

**Symptoms:**
- Production shows "CodeScribe AI (Development)" in consent screen
- Or: Development shows "CodeScribe AI" (production app)

**Root Cause:** Environment variables not properly scoped to environments.

**Solution:**

**1. Check Vercel Environment Variable Scoping:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Find `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Verify checkboxes:
  - Production variables should have **Production only** ✅
  - Development variables should have **Preview** ✅ and **Development** ✅

**2. Fix Scoping:**
- Click **Edit** on each variable
- Adjust environment checkboxes
- Click **Save**

**3. Redeploy:**
```bash
vercel --prod
```

**4. Clear Browser Cache:**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
- Or use incognito/private window

---

### Issue 4: Database Error "Column 'github_id' does not exist"

**Symptoms:**
```
ERROR: column "github_id" does not exist
```

**Root Cause:** Production database schema not updated.

**Solution:**

**1. Verify Database Schema:**
```bash
psql $PROD_DATABASE_URL -c "\d users"
```

Check for `github_id` column:
```
 Column      |  Type   | Nullable
-------------+---------+----------
 id          | integer | not null
 email       | text    | not null
 github_id   | text    |          <-- Should exist
 ...
```

**2. If Missing, Run Migration:**

If you have migrations:
```bash
# Connect to production database
psql $PROD_DATABASE_URL -f server/migrations/add_github_id.sql
```

Or manually add column:
```sql
ALTER TABLE users ADD COLUMN github_id TEXT UNIQUE;
CREATE INDEX idx_users_github_id ON users(github_id);
```

**3. Verify Schema:**
```bash
psql $PROD_DATABASE_URL -c "\d users"
```

---

### Issue 5: Email Not Found in GitHub Profile

**Symptoms:**
- User created with email like `username@github.user`
- OAuth flow succeeds but email is invalid

**Root Cause:** GitHub user has no public email address.

**Solution:**

**1. Update OAuth Scope (Already Configured):**
- CodeScribe AI already requests `user:email` scope
- This includes private email addresses

**2. User Must Set Public Email:**
- Ask user to verify email in GitHub settings
- Or: Application can handle GitHub-generated emails

**3. Fallback Email Handling:**

Already implemented in `passport.js:81`:
```javascript
const email = profile.emails?.[0]?.value || `${profile.username}@github.user`;
```

- If email exists: uses real email
- If no email: generates `username@github.user`

**Note:** GitHub-generated emails (`@github.user`) won't receive password reset emails. Document this in user help articles.

---

### Issue 6: "Session support is required" Error

**Symptoms:**
```
Error: session support is required for OAuth strategy
```

**Root Cause:** Missing session middleware or configuration.

**Solution:**

**1. Verify Session Middleware in `server/src/app.js`:**
```javascript
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());
```

**2. Verify `SESSION_SECRET` Environment Variable:**
```bash
vercel env ls production | grep SESSION_SECRET
```

If missing, add:
```bash
vercel env add SESSION_SECRET production
# Enter a long random string (e.g., use `openssl rand -base64 32`)
```

**3. Redeploy:**
```bash
vercel --prod
```

---

### Issue 7: Token Not Passed to Frontend

**Symptoms:**
- OAuth flow completes successfully
- User redirected to `/auth/callback` but stays logged out
- No token in URL

**Root Cause:** `CLIENT_URL` environment variable missing or incorrect.

**Solution:**

**1. Check `CLIENT_URL` in Vercel:**
```bash
vercel env ls production | grep CLIENT_URL
```

Expected: `CLIENT_URL: https://codescribeai.com`

**2. Verify Redirect in `auth.js:219`:**
```javascript
const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
```

**3. Add `CLIENT_URL` if Missing:**
```bash
vercel env add CLIENT_URL production
# Enter: https://codescribeai.com
```

**4. Redeploy:**
```bash
vercel --prod
```

**5. Test Redirect:**
- Complete OAuth flow
- Should redirect to: `https://codescribeai.com/auth/callback?token=eyJhbGciOi...`
- Token should be in URL

---

## Security Best Practices

### 1. Environment Variable Security

**✅ Do:**
- Use environment variables for all secrets
- Scope variables to specific environments (Production, Preview, Development)
- Rotate client secrets every 6-12 months
- Use Vercel's encrypted environment variables (automatic)
- Store backup of credentials in password manager

**❌ Don't:**
- Commit `.env` files to Git
- Share credentials via email, Slack, or text
- Reuse same credentials across projects
- Log credentials in application logs
- Expose credentials in frontend JavaScript

---

### 2. OAuth App Security

**✅ Do:**
- Use separate OAuth apps for development and production
- Request minimal scopes (`user:email` only)
- Verify callback URLs match exactly
- Enable HTTPS for all production callback URLs
- Monitor OAuth app usage in GitHub dashboard

**❌ Don't:**
- Add wildcard callback URLs (e.g., `*`)
- Use `localhost` callback URLs in production OAuth app
- Request excessive scopes (e.g., `repo`, `admin:org`)
- Share OAuth apps across multiple projects

---

### 3. User Data Security

**✅ Do:**
- Hash passwords with bcrypt (already implemented)
- Use JWT tokens with expiration (already implemented)
- Validate user input (email, GitHub ID)
- Implement CSRF protection (Passport handles this)
- Use HTTPS in production (Vercel enforces this)

**❌ Don't:**
- Store GitHub access tokens in database (not needed)
- Log sensitive user data (emails, passwords)
- Expose internal user IDs in frontend
- Allow account takeover via GitHub email changes

---

### 4. Account Linking Security

**Current Implementation:**

CodeScribe AI links GitHub accounts to existing email accounts if emails match:

```javascript
// From User.findOrCreateByGithub()
const user = await User.findByEmail(email);
if (user) {
  // Link GitHub account to existing user
  await User.update(user.id, { github_id: githubId });
}
```

**Security Considerations:**

**✅ Safe:**
- GitHub email is verified by GitHub
- User must prove ownership of GitHub account
- Prevents duplicate accounts for same user

**⚠️ Risk:**
- If user changes GitHub email to someone else's email, they could link accounts
- Mitigation: GitHub requires email verification before OAuth uses it

**Best Practice:**
- Consider adding email confirmation step before linking
- Or: Require password re-authentication before linking
- For MVP: Current implementation is acceptable

---

### 5. Rate Limiting

**Recommendation:** Add rate limiting to OAuth endpoints to prevent abuse.

**Implementation:**

```javascript
// server/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OAuth attempts per window
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// In server/src/routes/auth.js
import { oauthLimiter } from '../middleware/rateLimiter.js';

router.get('/github', oauthLimiter, passport.authenticate('github', {
  scope: ['user:email']
}));
```

**Benefits:**
- Prevents brute force OAuth abuse
- Reduces server load from automated attacks
- Protects against denial of service

---

## Additional Resources

- **GitHub OAuth Documentation:** [docs.github.com/en/apps/oauth-apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- **Passport GitHub Strategy:** [passportjs.org/packages/passport-github2](http://www.passportjs.org/packages/passport-github2/)
- **OAuth 2.0 Specification:** [oauth.net/2](https://oauth.net/2/)
- **Vercel Environment Variables:** [vercel.com/docs/environment-variables](https://vercel.com/docs/projects/environment-variables)
- **Security Best Practices:** [owasp.org/www-project-oauth-top-ten](https://owasp.org/www-project-oauth-top-10/)

---

## Next Steps

After completing GitHub OAuth setup:

1. ✅ Test OAuth flow in all environments (development, production)
2. ✅ Verify account linking works correctly
3. ✅ Monitor OAuth app usage in GitHub dashboard
4. ✅ Set up rate limiting on OAuth endpoints (recommended)
5. ✅ Document OAuth flow for users (help docs, FAQ)
6. ✅ Add OAuth error handling UI (user-friendly messages)
7. ✅ Consider adding other OAuth providers (Google, GitLab, etc.)
8. ✅ Implement OAuth token refresh if storing access tokens (optional)

---

## Related Documentation

**Deployment:**
- [RESEND-SETUP.md](./RESEND-SETUP.md) - Email service configuration
- [PRODUCTION-DB-SETUP.md](../database/PRODUCTION-DB-SETUP.md) - Database setup guide
- [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) - Complete deployment guide
- [VERCEL-ENVIRONMENT-VARIABLES.md](./VERCEL-ENVIRONMENT-VARIABLES.md) - All environment variables
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Pre-deployment verification

**Authentication:**
- [PASSWORD-RESET-SETUP.md](../authentication/PASSWORD-RESET-SETUP.md) - Password reset configuration
- [AUTH-ANALYSIS.md](../planning/AUTH-ANALYSIS.md) - Authentication architecture analysis

---

## Changelog

- **v1.1** (October 26, 2025) - Updated Vercel CLI syntax
  - Updated all `vercel env ls --environment` commands to `vercel env ls` (positional argument syntax)
  - Reflects Vercel CLI v48+ command syntax changes
  - Updated 5 command examples throughout troubleshooting and verification sections

- **v1.0** (October 26, 2025) - Initial GitHub OAuth setup guide
  - Comprehensive environment configuration strategy (Option 1 vs Option 2)
  - Step-by-step OAuth app creation for development and production
  - Detailed callback URL configuration and troubleshooting
  - Vercel environment variable setup with scoping instructions
  - Complete testing procedures for local and production
  - Account linking security considerations
  - 7 common troubleshooting scenarios with solutions
  - Security best practices for OAuth apps and credentials
  - Rate limiting recommendations

---

**Last Updated:** October 26, 2025
**Maintained By:** CodeScribe AI Team
