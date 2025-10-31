# Authentication Solution Analysis

**Decision Date:** October 23, 2025
**Status:** ✅ **DECISION MADE** - Passport.js Selected
**Applies To:** Phase 2 (Payments), Phase 5 (Developer Tools), Phase 6 (Enterprise)
**Last Updated:** October 23, 2025

---

## 📋 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [Strategic Requirements](#-strategic-requirements-across-all-phases)
3. [Solutions Evaluated](#-solutions-evaluated)
4. [Full Roadmap Compatibility Matrix](#-auth-solution-roadmap-compatibility)
5. [Critical Roadmap Blockers](#-critical-roadmap-blockers)
6. [Why Passport.js Aligns With Vision](#-why-passportjs-aligns-with-your-vision)
7. [Decision Matrix](#-decision-matrix-full-roadmap-view)
8. [Implementation Plan](#-implementation-plan)
9. [Research References](#-research-references)

---

## 🎯 Executive Summary

**Decision:** Use **Passport.js** for all authentication needs across web app, CLI, and VS Code extension.

**Rationale:**
- ✅ **Phase 2:** Supports GitHub OAuth + Stripe integration with full database control
- ✅ **Phase 5:** Enables CLI tool with offline-capable API key/JWT authentication
- ✅ **Phase 6:** Supports self-hosted enterprise deployment (Docker/Kubernetes)
- ✅ **Vision Alignment:** Privacy-first positioning with full control over user data
- ✅ **Revenue Protection:** Unblocks $450K/year enterprise revenue (Year 3 projections)

**Trade-off Accepted:**
- 1.5-2 extra days in Phase 2 implementation vs. Clerk
- Savings: Avoids 2-3 week auth rewrite before Phase 5, unblocks enterprise tier

**Alternatives Rejected:**
- ❌ **Clerk:** Fast Phase 2 setup, but blocks CLI (Phase 5) and self-hosted enterprise (Phase 6)
- ❌ **Lucia Auth:** Deprecated March 2025 (removed from consideration)
- ⚠️ **Auth.js:** Weak Express support, designed for Next.js

---

## 🗺️ Strategic Requirements Across All Phases

### Phase 2: Payments Infrastructure (v2.0.0)
**Timeline:** 2-3 weeks after Phase 1
**Auth Needs:**
- ✅ Email/password authentication with bcrypt hashing
- ✅ GitHub OAuth integration
- ✅ JWT token-based sessions
- ✅ User database (PostgreSQL recommended for Stripe integration)
- ✅ Stripe subscription webhook handling (requires user ID mapping)
- ✅ Tier enforcement (Free/Pro/Team/Enterprise)

**Reference:** [ROADMAP.md Phase 2](roadmap/ROADMAP.md#-phase-2-monetization-foundation-planned)

---

### Phase 5: Developer Tools (v5.0.0)
**Timeline:** 3-4 weeks (after Phase 4)
**Auth Needs:**

#### Epic 5.1: CLI Tool
- ✅ **API key authentication** for command-line usage
- ✅ **JWT token validation** for offline mode
- ✅ **OAuth flow in terminal** (open browser, callback to localhost)
- ✅ **Token storage** in `~/.codescribe/config`
- ✅ **Shared auth layer** with web app (same JWT validation)

**Example CLI Auth Flow:**
```bash
$ codescribe login
# Opens browser to https://codescribeai.com/auth/github
# Redirects to http://localhost:8080/callback?token=eyJhbG...
✓ Logged in as user@example.com

$ codescribe generate README src/index.js
# Uses stored JWT token (no network call for auth)
```

#### Epic 5.2: VS Code Extension
- ✅ **OAuth flow in IDE** (opens browser, captures callback)
- ✅ **Token storage** in VS Code SecretStorage API
- ✅ **Shared auth endpoints** with web app (same OAuth provider)
- ✅ **Extension settings** for API key management

**Reference:** [ROADMAP.md Phase 5](roadmap/ROADMAP.md#-phase-5-developer-tools-planned)

---

### Phase 6: Enterprise Readiness (v6.0.0)
**Timeline:** 3-4 weeks (after Phase 5)
**Auth Needs:**

#### Epic 6.1: SSO & Advanced Authentication
- ✅ **SAML 2.0 integration** (Okta, Auth0, Azure AD)
- ✅ **OAuth 2.0 provider support**
- ✅ **Just-In-Time (JIT) user provisioning**
- ✅ **Multi-factor authentication (MFA)**

#### Epic 6.3: On-Premise Deployment
- ✅ **Self-hosted authentication** (no external dependencies)
- ✅ **Docker containerization** with auth included
- ✅ **Kubernetes deployment** (auth runs in customer's VPC)
- ✅ **Air-gapped environment support** (offline auth validation)
- ✅ **Customer-controlled user data** (compliance requirement)

**Revenue Impact:**
- Year 3 Projection: 25 Enterprise customers @ $1,500/mo = **$450,000/year**
- Requirement: 80% of enterprise customers require self-hosted option
- **Blocker:** Clerk cannot support self-hosted deployment

**Reference:** [ROADMAP.md Phase 6](roadmap/ROADMAP.md#-phase-6-enterprise-readiness-future)

---

## 🔍 Solutions Evaluated

### 1. Passport.js (SELECTED)
**Website:** [passportjs.org](http://www.passportjs.org/)
**Type:** Open-source authentication middleware for Node.js
**Downloads:** 1.5M weekly (npm)
**Maturity:** Battle-tested since 2011, 22k+ GitHub stars

**Key Features:**
- 500+ authentication strategies (local, GitHub, SAML, JWT, bearer tokens)
- Express-native middleware (`req.user` pattern)
- Database-agnostic (works with PostgreSQL, MongoDB, etc.)
- Self-hosted (100% control over auth logic)

**Pricing:** Free, open-source (MIT license)

---

### 2. Clerk (REJECTED)
**Website:** [clerk.com](https://clerk.com)
**Type:** Managed authentication service with React components
**Funding:** Well-funded SaaS startup

**Key Features:**
- Pre-built UI components (`<SignIn />`, `<UserButton />`)
- GitHub OAuth configured via dashboard (no code)
- 10,000 free MAUs, $25/month base after
- MFA, email verification, password resets out-of-the-box

**Pricing:**
- Free: 10,000 MAUs + 100 organizations
- Pro: $25/month + $0.02/MAU after 10k
- Enterprise: Custom pricing for SSO/SAML

**Why Rejected:** See [Critical Roadmap Blockers](#-critical-roadmap-blockers)

---

### 3. Lucia Auth (REMOVED FROM CONSIDERATION)
**Status:** ⚠️ **Deprecated March 2025**
**Reason:** Project transitioning to learning resource, not production library

**Reference:** [Web search - Lucia Auth deprecation](https://github.com/lucia-auth/lucia/discussions/1231)

---

### 4. Auth.js (@auth/express) (NOT RECOMMENDED)
**Website:** [authjs.dev](https://authjs.dev/)
**Type:** Modern TypeScript-first auth library
**Primary Use Case:** Next.js applications

**Key Features:**
- Built-in GitHub OAuth provider
- TypeScript-native
- Express support via `@auth/express` adapter

**Why Not Recommended:**
- Primarily designed for Next.js (Express is secondary)
- Smaller ecosystem than Passport.js
- Less mature Express integration (adapter required)

---

## 📊 Auth Solution Roadmap Compatibility

| Requirement | Passport.js | Clerk | Auth.js |
|-------------|-------------|-------|---------|
| **Phase 2: Payments** |
| GitHub OAuth | ✅ `passport-github2` | ✅ Dashboard config | ✅ Built-in |
| Email/password | ✅ `passport-local` | ✅ Pre-built | ✅ Credentials provider |
| Stripe integration | ✅ Full control (webhook → user ID) | ✅ Native support | ✅ Manual setup |
| PostgreSQL | ✅ Any DB with `connect-pg-simple` | ⚠️ Clerk manages user storage | ✅ Any DB |
| JWT sessions | ✅ `passport-jwt` | ⚠️ Clerk-managed sessions | ✅ JWT support |
| **Phase 5: CLI Tool** |
| API key auth | ✅ `passport-http-bearer` | ⚠️ Clerk SDK (vendor lock) | ✅ Custom tokens |
| JWT token validation | ✅ Offline-capable | ❌ Requires Clerk API call | ✅ Offline-capable |
| OAuth in terminal | ✅ Custom flow (standard pattern) | ⚠️ Clerk SDK friction | ✅ Custom flow |
| Shared auth layer | ✅ Same JWT across platforms | ❌ Clerk-specific SDK | ✅ Same JWT |
| **Phase 5: VS Code Extension** |
| OAuth in IDE | ✅ Standard OAuth flow | ⚠️ Clerk SDK | ✅ Standard OAuth flow |
| Token storage | ✅ VS Code SecretStorage | ⚠️ Clerk SDK | ✅ VS Code SecretStorage |
| Offline mode | ✅ Local JWT validation | ❌ Requires Clerk API | ✅ Local JWT validation |
| **Phase 6: Enterprise** |
| SSO/SAML | ✅ `passport-saml` (free) | ✅ Paid add-on ($$$) | ⚠️ Limited support |
| Self-hosted deployment | ✅ 100% self-hosted | ❌ **BLOCKER** (managed only) | ✅ Self-hosted |
| On-premise (Docker/K8s) | ✅ Compatible | ❌ **BLOCKER** | ✅ Compatible |
| Air-gapped environments | ✅ Works offline | ❌ Requires internet | ✅ Works offline |
| Audit logs (full control) | ✅ Custom implementation | ⚠️ Clerk's logs only | ✅ Custom implementation |
| Customer data control | ✅ Your database | ❌ Clerk's database | ✅ Your database |

**Legend:**
- ✅ Full support / Recommended
- ⚠️ Partial support / Friction
- ❌ Not supported / Blocker

---

## 🚨 Critical Roadmap Blockers

### Clerk is NOT Viable for Full Roadmap

#### Phase 5 (CLI) Issues

**Problem:** CLI authentication requires offline-capable tokens.

**Clerk's Model:**
- Every auth check calls Clerk's API: `clerk.users.getUser(userId)`
- Token validation requires network call to Clerk servers
- CLI users experience latency on every command

**Passport.js Model:**
- JWT tokens validated locally (offline-capable)
- No network call required for auth validation
- Fast CLI experience (instant auth check)

**Example:**
```bash
# With Clerk (slow, always-online)
$ codescribe generate README src/index.js
# → Network call to Clerk API for auth validation (200-500ms latency)

# With Passport.js (fast, offline)
$ codescribe generate README src/index.js
# → Local JWT validation (< 1ms, no network call)
```

**User Impact:**
- CLI users expect **instant commands** (like git, npm, docker)
- Clerk's always-online model creates poor UX
- Users in poor network conditions (planes, coffee shops) blocked

---

#### Phase 6 (Enterprise) BLOCKERS

**Problem 1: Self-Hosted Deployment is Impossible**

Your [ROADMAP.md Epic 6.3](roadmap/ROADMAP.md#epic-63-on-premise-deployment-7-10-days) requires:
> "Docker containerization, Kubernetes deployment manifests, Self-hosted deployment guide"

**Clerk's Limitation:**
- ❌ User data stored on Clerk's servers (cannot be self-hosted)
- ❌ Auth logic runs on Clerk's infrastructure (not in customer's VPC)
- ❌ No Docker image available for on-premise deployment

**Enterprise Customer Requirement:**
- 80% of enterprise customers require self-hosted option (compliance, security)
- Financial services, healthcare, government cannot use external auth providers
- **Revenue Blocker:** Lose $450K/year in enterprise revenue (Year 3)

---

**Problem 2: SSO/SAML Costs Extra**

**Clerk Pricing:**
- SSO/SAML only available on **Enterprise tier** (custom pricing, likely $500+/month)
- Your pricing model: Enterprise tier includes SSO at **$1,500/month** (per [VISION.md](../../private/VISION.md#L239-L248))
- Clerk's pricing eats into your margins

**Passport.js:**
- `passport-saml` is **free** (open-source)
- SSO cost bundled into your $1,500/month pricing (higher margins)

---

**Problem 3: Privacy-First Positioning Conflict**

Your competitive differentiation ([VISION.md](../../private/VISION.md#L64-L72)):
> **vs. Mintlify:**
> - Privacy-focused (no storage) vs. hosted solution
> - Code-first approach vs. documentation-site-first

**Clerk Conflict:**
- User data stored on Clerk's servers (not your database)
- You don't control where user data lives (compliance risk)
- Violates "privacy-first, no storage" positioning

**Passport.js Alignment:**
- User data in **your PostgreSQL database** (your VPC, your control)
- Self-hosted option for enterprise (data never leaves customer premises)
- **Reinforces privacy positioning** (competitive advantage)

---

## ✅ Why Passport.js Aligns With Your Vision

### 1. Phase 5 (CLI) Requirement

**Reference:** [ROADMAP.md Epic 5.1](roadmap/ROADMAP.md#epic-51-cli-tool-5-7-days)

**CLI Authentication Pattern (Industry Standard):**
```bash
# Step 1: Login (one-time setup)
$ codescribe login
Opening browser for authentication...
✓ Logged in as user@example.com
Token saved to ~/.codescribe/config

# Step 2: Use CLI (offline-capable)
$ codescribe generate README src/index.js
# → Reads JWT from ~/.codescribe/config
# → Validates JWT locally (no network call)
# → Calls API with Authorization: Bearer <token>
```

**Implementation with Passport.js:**
```javascript
// server/src/config/passport.js
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  const user = await db.users.findById(payload.userId);
  return done(null, user);
}));
```

**Why Clerk Can't Do This Well:**
- Clerk requires Clerk SDK in CLI (vendor lock-in)
- Token validation requires Clerk API call (slow, online-only)
- Poor UX for developers expecting instant CLI responses

---

### 2. Phase 6 (Enterprise) Requirement

**Reference:** [ROADMAP.md Epic 6.3](roadmap/ROADMAP.md#epic-63-on-premise-deployment-7-10-days)

**Self-Hosted Deployment with Passport.js:**
```dockerfile
# Docker image for enterprise customers
FROM node:20-alpine
COPY server/ /app
RUN npm install passport passport-saml bcrypt jsonwebtoken
# Auth logic runs in customer's infrastructure (no external deps)
CMD ["node", "index.js"]
```

**Kubernetes Deployment:**
```yaml
# codescribe-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codescribe-api
spec:
  containers:
  - name: api
    image: codescribe/api:2.0.0
    env:
    - name: SAML_CERT
      valueFrom:
        secretKeyRef:
          name: customer-saml-cert
          key: cert
```

**Enterprise Customer Value:**
- ✅ User data stays in customer's VPC (compliance)
- ✅ No external dependencies (air-gapped environments)
- ✅ Customer controls SSO/SAML configuration
- ✅ Audit logs stored in customer's database

**Revenue Protection:**
- [VISION.md Year 3 Projections](../../private/VISION.md#L267-L270): 25 Enterprise customers @ $1,500/mo
- **$450,000/year revenue** depends on self-hosted capability
- Clerk blocks this entire revenue stream

---

### 3. Privacy-First Principle

**Reference:** [CLAUDE.md](../../CLAUDE.md#L289), [VISION.md Competitive Positioning](../../private/VISION.md#L64-L72)

**Current Positioning:**
> **vs. Mintlify:** Privacy-focused (no storage) vs. hosted solution

**Phase 2 Privacy Model ([ROADMAP.md](roadmap/ROADMAP.md#L389-L394)):**
> **Privacy & Security Notes:**
> - Database trade-off: Moves from "privacy-first, no storage" to user accounts
> - Document this change in README and privacy policy
> - Emphasize: "We only store email, usage stats, and subscription info - never your code"

**With Passport.js:**
- ✅ User data in **your PostgreSQL** (you control retention policies)
- ✅ Self-hosted option preserves "privacy-first" for enterprise
- ✅ Clear messaging: "We store accounts, not your code"

**With Clerk:**
- ❌ User data on **Clerk's servers** (3rd-party storage)
- ❌ Privacy policy must disclose "user data shared with Clerk"
- ❌ No self-hosted option (weakens privacy positioning)

---

### 4. Revenue Projections Protection

**Reference:** [VISION.md Revenue Projections](../../private/VISION.md#L254-L276)

**Year 3 Revenue Breakdown:**
- 2,000 Pro users = $360,000/year
- 500 Team customers = $720,000/year
- **25 Enterprise customers = $450,000/year** ← **Requires self-hosted**
- Total: **$1,590,000/year**

**Clerk Impact on Enterprise Revenue:**
- ❌ No self-hosted option = **lose 80% of enterprise leads**
- ❌ SSO/SAML costs extra = **lower margins on remaining 20%**
- **Total Revenue Loss:** ~$360,000/year (80% of $450K)

**Passport.js Enables Full Revenue:**
- ✅ Self-hosted option attracts enterprise customers
- ✅ Free SSO/SAML increases margins
- ✅ Full control over roadmap (no vendor limitations)

---

### 5. Competitive Differentiation

**Reference:** [VISION.md Competitive Landscape](../../private/VISION.md#L48-L144)

**Key Differentiators:**
| Competitor | CodeScribe AI Advantage | Auth Dependency |
|------------|-------------------------|-----------------|
| **Mintlify** | Privacy-focused (no storage) vs. hosted | **Passport.js:** Self-hosted option |
| **Swimm** | Lower barrier to entry | **Passport.js:** Simple auth, no vendor lock |
| **GitHub Copilot** | Platform-agnostic (works with any codebase) | **Passport.js:** Auth works everywhere (web/CLI/extension) |

**Clerk Risk:**
- Weakens "privacy-focused" positioning (data on 3rd-party servers)
- Adds vendor dependency (conflicts with "platform-agnostic")
- Blocks self-hosted option (table stakes for enterprise)

---

## 📋 Decision Matrix: Full Roadmap View

| Phase | Clerk | Passport.js | Impact if Wrong Choice |
|-------|-------|-------------|------------------------|
| **Phase 2: Payments** | ✅ Fastest (< 1 day) | ✅ Self-hosted (1.5-2 days) | +1.5 days dev time with Passport |
| **Phase 5: CLI Tool** | ❌ Vendor lock, poor UX | ✅ Standard JWT, offline-capable | **Rewrite entire auth system (2-3 weeks)** |
| **Phase 5: VS Code Extension** | ⚠️ Clerk SDK friction | ✅ Standard OAuth flow | **Rewrite extension auth (1 week)** |
| **Phase 6: Enterprise** | ❌ **BLOCKER** (no self-hosted) | ✅ Self-hosted, SSO/SAML | **Lose $450K/year enterprise revenue** |
| **Vision Alignment** | ❌ Conflicts with privacy-first | ✅ Perfect fit | **Reposition product** or **rebuild auth** |
| **Total Cost of Clerk** | 1 day saved in Phase 2 | **4-5 weeks rework + $450K revenue loss** | ❌ **Unacceptable** |

---

## 🎯 Final Decision Rationale

### Trade-off: Accept 1.5 Days Now, Save Weeks Later

**Clerk Savings (Phase 2):**
- Phase 2 with Clerk: ~3 days (Epic 2.1 - Auth)
- Phase 2 with Passport.js: ~5 days (Epic 2.1 - Auth)
- **Savings: 1.5-2 days**

**Clerk Cost (Phase 5-6):**
- Phase 5 (CLI rewrite): 2-3 weeks (must replace Clerk with JWT auth)
- Phase 6 (Enterprise blocked): Cannot ship self-hosted option
- **Cost: 2-3 weeks rework + $450K/year lost revenue**

**Decision:** Invest 1.5 extra days in Phase 2 to avoid 2-3 weeks of rework and protect $450K revenue.

---

### Strategic Alignment

**CodeScribe AI Vision ([VISION.md](../../private/VISION.md#L32-L36)):**
> Build a comprehensive AI-powered documentation toolkit that transforms how developers create and maintain code documentation, **starting with a web application and expanding to CLI and VS Code integration**.

**Auth Requirements:**
- ✅ Web application (Phase 2) → Passport.js supports
- ✅ CLI tool (Phase 5) → Passport.js enables offline JWT auth
- ✅ VS Code extension (Phase 5) → Passport.js standard OAuth flow
- ✅ Enterprise self-hosted (Phase 6) → Passport.js 100% self-hostable

**Clerk Limitations:**
- ❌ CLI tool → Poor UX (always-online auth checks)
- ❌ VS Code extension → Clerk SDK vendor lock-in
- ❌ Enterprise self-hosted → **IMPOSSIBLE** (managed-only service)

---

## 🚀 Implementation Plan

### Phase 2.1: Authentication & User Management (5 days)

**Reference:** [TODO.md Epic 2.1](TODO.md#epic-21-authentication--user-management)

#### Day 1: Backend Setup & Dependencies
```bash
cd server
npm install passport passport-local passport-github2 passport-jwt bcrypt jsonwebtoken express-session connect-pg-simple
```

**Files to Create:**
- `server/src/config/passport.js` - Passport strategies configuration
- `server/src/middleware/auth.js` - Auth middleware exports
- `server/src/routes/auth.js` - Auth routes (signup, login, logout)
- `server/src/models/User.js` - User model (if using ORM) or schema

---

#### Day 2: Database & User Model

**PostgreSQL Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),  -- NULL if GitHub OAuth only
  github_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) DEFAULT 'free',  -- free, pro, team, enterprise
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  daily_count INT DEFAULT 0,
  monthly_count INT DEFAULT 0,
  reset_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Tools:**
- Vercel Postgres (free tier, 60MB) OR
- Local PostgreSQL (development) + AWS RDS (production)

---

#### Day 3: Passport Strategies Implementation

**Local Strategy (Email/Password):**
```javascript
// server/src/config/passport.js
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await db.users.findByEmail(email);
    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));
```

**GitHub OAuth Strategy:**
```javascript
import { Strategy as GitHubStrategy } from 'passport-github2';

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/api/auth/github/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await db.users.findByGitHubId(profile.id);

    if (!user) {
      user = await db.users.create({
        email: profile.emails[0].value,
        github_id: profile.id,
        tier: 'free'
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));
```

**JWT Strategy (for CLI/API):**
```javascript
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await db.users.findById(payload.userId);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));
```

---

#### Day 4: Auth Routes & Frontend Integration

**Auth Routes:**
```javascript
// server/src/routes/auth.js
import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.users.create({
    email,
    password_hash: hashedPassword,
    tier: 'free'
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  res.json({ token, user: { id: user.id, email: user.email, tier: user.tier } });
});

// POST /api/auth/login
router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  res.json({ token, user: { id: req.user.id, email: req.user.email, tier: req.user.tier } });
});

// GET /api/auth/github
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GET /api/auth/github/callback
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

export default router;
```

**Frontend Components:**
- `client/src/components/LoginModal.jsx` - Email/password login
- `client/src/components/SignupModal.jsx` - Registration form
- `client/src/contexts/AuthContext.jsx` - Auth state management
- `client/src/hooks/useAuth.js` - Auth hook

---

#### Day 5: Testing & Integration

**Test Checklist:**
- [ ] Unit tests for Passport strategies
- [ ] Integration tests for auth routes (`/signup`, `/login`, `/github`)
- [ ] E2E tests for login/signup flow (Playwright)
- [ ] Verify JWT token validation works
- [ ] Test GitHub OAuth callback flow
- [ ] Verify tier gates work with `req.user.tier`

**Integration with Existing Code:**
```javascript
// server/index.js
import passport from 'passport';
import './config/passport.js';  // Load strategies
import authRoutes from './routes/auth.js';

app.use(passport.initialize());
app.use('/api/auth', authRoutes);

// Existing generation routes now protected
import { requireFeature } from './middleware/tierGate.js';

app.post('/api/generate',
  passport.authenticate('jwt', { session: false }),  // ← Add this
  requireFeature('pro'),                             // ← Already exists
  generateHandler
);
```

---

### Success Criteria (Phase 2.1)

From [TODO.md Epic 2.1 Success Criteria](TODO.md#success-criteria):

- [ ] Users can sign up with email/password
- [ ] Users can log in with email/password
- [ ] Users can log in with GitHub OAuth
- [ ] Password reset flow works end-to-end
- [ ] JWT tokens expire correctly (7 days)
- [ ] Auth state persists across page refreshes (localStorage)
- [ ] All auth tests passing (unit + integration + E2E)
- [ ] Sign In button unhidden in Header ([Header.jsx](../../client/src/components/Header.jsx))
- [ ] Auth integrates with existing tierGate middleware ([tierGate.js](../../server/src/middleware/tierGate.js))

---

### Future Phases (Built on Passport.js Foundation)

#### Phase 5: CLI Tool Auth
```bash
# OAuth flow in terminal (standard pattern)
$ codescribe login
Opening browser for authentication...
# → Opens https://codescribeai.com/auth/cli
# → User authenticates with GitHub or email/password
# → Redirects to http://localhost:8080/callback?token=eyJhbG...
# → CLI saves token to ~/.codescribe/config
✓ Logged in as user@example.com
```

**Implementation:**
- Uses existing Passport JWT strategy (no new code needed)
- CLI validates JWT locally (offline-capable)
- Same token works for web app, CLI, and VS Code extension

---

#### Phase 6: Enterprise SSO/SAML
```javascript
// Add passport-saml strategy (no code changes to existing auth)
import { Strategy as SamlStrategy } from 'passport-saml';

passport.use(new SamlStrategy({
  entryPoint: 'https://customer-okta.com/sso',
  issuer: 'codescribe-ai',
  cert: process.env.SAML_CERT
}, (profile, done) => {
  // JIT user provisioning
  const user = await db.users.findOrCreate({
    email: profile.email,
    tier: 'enterprise'
  });
  return done(null, user);
}));
```

**No Auth Rewrite Required:**
- Passport's plugin architecture supports new strategies
- Existing JWT/GitHub auth continues to work
- Enterprise customers can use SSO OR standard auth

---

## 📚 Research References

### Web Search Results (October 23, 2025)

#### Clerk Pricing Research
**Source:** [clerk.com/pricing](https://clerk.com/pricing)

**Key Findings:**
- Free tier: 10,000 MAUs (monthly active users)
- Pro tier: $25/month base + $0.02/MAU after 10k
- "First Day Free" policy (users don't count until 2nd login)
- SSO/SAML only on Enterprise tier (custom pricing)

**Impact on Decision:**
- Generous free tier (good for Phase 2 MVP testing)
- BUT: No self-hosted option at any price (Phase 6 blocker)

---

#### Passport.js Ecosystem Research
**Source:** Web search - "best authentication library Express Node.js 2025"

**Key Findings:**
- 1.5M weekly npm downloads
- 500+ authentication strategies available
- Used by major companies (Walmart, IBM, Intuit)
- Active maintenance (last commit: October 2025)

**Impact on Decision:**
- Battle-tested, production-ready
- Will be maintained for foreseeable future
- Large community for troubleshooting

---

#### Lucia Auth Deprecation
**Source:** [GitHub Discussion #1231](https://github.com/lucia-auth/lucia/discussions/1231)

**Key Findings:**
- Project deprecated as of March 2025
- Transitioning to learning resource (not production library)
- Maintainer recommends building custom auth or using alternatives

**Impact on Decision:**
- Removed from consideration (cannot use deprecated library)

---

### Internal Documentation References

- [ROADMAP.md](roadmap/ROADMAP.md) - Full product roadmap (Phases 2-6)
- [VISION.md](../../private/VISION.md) - Strategic vision and revenue projections
- [TODO.md Epic 2.1](TODO.md#epic-21-authentication--user-management) - Auth implementation tasks
- [tierGate.js](../../server/src/middleware/tierGate.js) - Existing tier enforcement (expects `req.user`)
- [CLAUDE.md](../../CLAUDE.md) - Project context and principles

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Oct 23, 2025 | **Use Passport.js for all auth** | Full roadmap compatibility (CLI, enterprise), privacy-first alignment, revenue protection ($450K/year) |
| Oct 23, 2025 | **Reject Clerk** | Blocks CLI offline auth (Phase 5), blocks self-hosted enterprise (Phase 6), conflicts with privacy positioning |
| Oct 23, 2025 | **Reject Lucia Auth** | Deprecated March 2025 (removed from production use) |
| Oct 23, 2025 | **Reject Auth.js** | Weak Express support (designed for Next.js), smaller ecosystem than Passport.js |

---

**Document Version:** 1.0
**Created:** October 23, 2025
**Last Updated:** October 23, 2025
**Next Review:** After Phase 2.1 implementation (validate decision with real-world usage)

---

**Status:** ✅ **APPROVED** - Ready for implementation in Phase 2.1
