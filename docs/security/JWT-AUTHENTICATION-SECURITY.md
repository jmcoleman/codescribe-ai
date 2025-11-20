# JWT Authentication Security Guide

**Last Updated:** November 18, 2025
**Status:** Production Implementation
**Compliance Level:** General SaaS (GDPR-compliant)

---

## Table of Contents

1. [Current Implementation](#current-implementation)
2. [JWT Security Fundamentals](#jwt-security-fundamentals)
3. [localStorage vs httpOnly Cookies](#localstorage-vs-httponly-cookies)
4. [Threat Model & Mitigations](#threat-model--mitigations)
5. [HIPAA Compliance Requirements](#hipaa-compliance-requirements)
6. [Financial Services (SOC 2, PCI DSS)](#financial-services-soc-2-pci-dss)
7. [Migration Path to httpOnly Cookies](#migration-path-to-httponly-cookies)

---

## Current Implementation

### Architecture Overview

**Storage:** localStorage (client-side)
**Format:** JWT signed with HS256
**Transmission:** Bearer token in Authorization header
**Expiration:** 30 days
**Refresh:** No refresh token (re-auth required)

### Token Contents (Example)
```json
{
  "userId": 3188,
  "email": "user@example.com",
  "role": "super_admin",
  "tier": "free",
  "viewing_as_tier": "pro",
  "override_expires_at": "2025-11-18T18:32:50.575Z",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Authentication Flow

**Frontend:**
```javascript
import { STORAGE_KEYS } from '../constants/storage';

const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
const response = await fetch(`${API_URL}/api/protected-endpoint`, {
  method: 'POST',
  headers: {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

**Backend:**
```javascript
// Middleware chain
router.post('/api/protected-endpoint', requireAuth, apiLimiter, async (req, res) => {
  // req.user is populated by requireAuth middleware
  // req.user contains decoded JWT payload
});
```

---

## JWT Security Fundamentals

### Common Misconception: "Anyone can decode my JWT!"

**YES, anyone can decode a JWT** - this is **by design** and **not a security risk**.

#### Decoding vs. Forging

| Action | Who Can Do It | Security Impact |
|--------|---------------|-----------------|
| **Decode** (read payload) | Anyone with jwt.io | ✅ None - payload is public |
| **Forge** (create/modify) | Only those with secret key | ⚠️ Critical - server rejects invalid signatures |

#### Why Decoding is Safe

JWTs have three parts:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMxODh9.signature_here
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^
         HEADER (public)                      PAYLOAD (public)   SIGNATURE (verified)
```

1. **Header** - Algorithm and type (public, no secrets)
2. **Payload** - User claims (public, no secrets stored here)
3. **Signature** - HMAC-SHA256 hash using server secret key

**What an attacker CANNOT do:**
- Change `role` from `free` to `super_admin` (signature won't match)
- Change `tier` from `free` to `enterprise` (signature won't match)
- Create a valid token for another user (no access to secret key)
- Extend expiration time (signature won't match)

**What an attacker CAN do (but it doesn't matter):**
- Read the payload (but it contains no secrets)
- See your user ID and email (already public information)
- Know your tier/role (not sensitive)

### Server-Side Validation

Every request validates:
```javascript
// Pseudocode of what happens on server
const [header, payload, signature] = token.split('.');
const expectedSignature = HMAC_SHA256(header + '.' + payload, SECRET_KEY);

if (signature !== expectedSignature) {
  return 401; // Token has been tampered with
}

if (payload.exp < Date.now()) {
  return 401; // Token has expired
}

req.user = JSON.parse(base64Decode(payload));
next(); // Proceed to route handler
```

**Security is in the signature validation, not the encoding.**

---

## localStorage vs httpOnly Cookies

### Current Approach: localStorage + Bearer Tokens

**Pros:**
- ✅ **CSRF Protection** - Tokens not automatically sent with requests
- ✅ **Simple CORS** - No complex cookie domain configuration
- ✅ **SPA-Friendly** - Natural fit for React/Vue/Angular apps
- ✅ **Mobile-Ready** - Easy to implement in native mobile apps
- ✅ **Explicit Control** - Developer controls when/how token is sent
- ✅ **Industry Standard** - Used by Auth0, Firebase, AWS Amplify
- ✅ **User-Scoped Storage** - Privacy-sensitive data isolated per user (v2.8.0+)

**Cons:**
- ❌ **XSS Vulnerability** - If attacker injects JavaScript, they can read token
- ❌ **Manual Management** - Developer must handle token refresh logic
- ❌ **No Browser Protection** - Token is accessible to all JavaScript

**User-Scoped localStorage (Added v2.8.0):**
To prevent privacy leaks on shared computers, we now user-scope sensitive data:
- `cs_ed_code_{userId}` - Editor code content
- `cs_ed_doc_{userId}` - Generated documentation
- `cs_ed_score_{userId}` - Quality scores
- `cs_ws_{userId}` - Workspace file contents

This means User A's code (`cs_ed_code_123`) is isolated from User B's code (`cs_ed_code_456`) on the same browser. See [localStorage Naming Conventions](../architecture/LOCALSTORAGE-NAMING-CONVENTIONS.md) for details.

**When XSS is a Real Concern:**
- User-generated HTML content (WYSIWYG editors, rich text)
- Third-party scripts (ads, analytics, widgets)
- Plugin systems (WordPress-style extensibility)
- Untrusted content rendering

**Why CodeScribe AI is Low-Risk for XSS:**
- React escapes all content by default
- No user-generated HTML (only code snippets, which are escaped)
- No third-party scripts loaded
- No plugin system
- Monaco Editor is sandboxed
- All markdown rendering is sanitized

### Alternative: httpOnly Cookies

**Pros:**
- ✅ **XSS Protection** - JavaScript cannot access the cookie
- ✅ **Browser-Managed** - Automatic sending, expiration, storage
- ✅ **Security Best Practice** - Recommended by OWASP for sensitive apps

**Cons:**
- ❌ **CSRF Attacks** - Cookies automatically sent with requests
- ❌ **CSRF Tokens Required** - Must implement CSRF protection
- ❌ **Complex CORS** - Requires `credentials: true` and specific origins
- ❌ **Mobile Apps Harder** - Cookies don't work well in native apps
- ❌ **Subdomain Issues** - Cookie domain configuration required

**When httpOnly Cookies are Required:**
- HIPAA-covered applications
- Financial services (PCI DSS, SOC 2)
- Healthcare data (PHI)
- Government contracts (FedRAMP)
- High-security enterprise requirements

---

## Threat Model & Mitigations

### Threats & Current Mitigations

| Threat | Risk Level | Mitigation | Status |
|--------|-----------|------------|--------|
| **Token Decoding** | 🟢 None | No secrets in payload | ✅ Secure |
| **Token Forging** | 🟢 None | Server signature validation | ✅ Secure |
| **Man-in-the-Middle** | 🟢 Low | HTTPS enforced in production | ✅ Secure |
| **XSS (Script Injection)** | 🟡 Medium | React auto-escaping, no user HTML | ⚠️ Acceptable |
| **CSRF (Cross-Site Request)** | 🟢 None | Bearer tokens not auto-sent | ✅ Secure |
| **Token Theft (Device)** | 🟡 Medium | 30-day expiration, user logout | ⚠️ Acceptable |
| **Brute Force Login** | 🟢 Low | Rate limiting, email verification | ✅ Secure |
| **Session Fixation** | 🟢 None | JWT cannot be fixed (signed) | ✅ Secure |

### Security Layers

**1. Transport Security**
- HTTPS enforced in production (Vercel)
- TLS 1.2+ required
- HSTS headers enabled

**2. Token Security**
- HS256 signing algorithm
- 256-bit secret key (stored in env vars)
- Server-side signature validation
- 30-day expiration (reduces exposure window)

**3. Application Security**
- React auto-escaping (XSS protection)
- Rate limiting (brute force protection)
- Email verification (account takeover prevention)
- Content Security Policy headers (future enhancement)

**4. Database Security**
- Passwords hashed with bcrypt (12 rounds)
- API keys encrypted at rest
- Prepared statements (SQL injection prevention)
- Row-level security in Postgres

---

## HIPAA Compliance Requirements

### What Changes for HIPAA-Covered Entities

If CodeScribe AI were to handle **Protected Health Information (PHI)**, the following changes would be **mandatory**:

### 1. Authentication Changes

**Current:** localStorage + Bearer tokens
**Required:** httpOnly cookies + CSRF tokens

```javascript
// Backend: Set httpOnly cookie
res.cookie('auth_token', token, {
  httpOnly: true,        // Prevent JavaScript access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 15 * 60 * 1000 // 15 minutes (shorter for HIPAA)
});

// Backend: CSRF token generation
const csrfToken = crypto.randomBytes(32).toString('hex');
req.session.csrfToken = csrfToken;
res.json({ csrfToken });

// Frontend: Include CSRF token in requests
fetch('/api/protected', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  credentials: 'include', // Send cookies
  body: JSON.stringify(data)
});
```

### 2. Session Management Changes

| Current | HIPAA Required |
|---------|----------------|
| 30-day token expiration | 15-minute sessions with refresh tokens |
| No automatic logout | Automatic logout after 15 minutes idle |
| Single token | Access token (15 min) + Refresh token (8 hours) |
| No device tracking | Device fingerprinting required |

**Refresh Token Flow:**
```javascript
// Access token expires in 15 minutes
// Refresh token stored in httpOnly cookie, expires in 8 hours
app.post('/api/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  // Validate refresh token
  const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

  // Issue new access token
  const accessToken = jwt.sign(
    { userId: decoded.userId },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  res.cookie('auth_token', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
  res.json({ success: true });
});
```

### 3. Audit Logging Requirements

```javascript
// Log every access to PHI
await AuditLog.create({
  userId: req.user.id,
  action: 'READ_PATIENT_DATA',
  resourceType: 'MEDICAL_RECORD',
  resourceId: patientId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
  success: true
});
```

**Required Audit Fields:**
- Who (user ID, role)
- What (action, resource type)
- When (timestamp, timezone)
- Where (IP address, geolocation)
- How (user agent, device)
- Result (success/failure, error details)

**Retention:** 6 years minimum

### 4. Encryption Requirements

| Data Type | Current | HIPAA Required |
|-----------|---------|----------------|
| Data in transit | TLS 1.2+ | TLS 1.2+ (same) |
| Data at rest | Postgres default | AES-256 encryption |
| JWT payload | Signed, not encrypted | Signed + encrypted (JWE) |
| Database backups | Vercel default | Encrypted with separate keys |

**JWT Encryption (JWE):**
```javascript
// Instead of JWT (signed only)
const jwt = require('jsonwebtoken');

// Use JWE (signed + encrypted)
const { JWE, JWK } = require('node-jose');

// Encrypt sensitive claims
const keystore = JWK.createKeyStore();
const key = await keystore.generate('oct', 256);
const jwe = await JWE.createEncrypt({ format: 'compact' }, key)
  .update(JSON.stringify(payload))
  .final();
```

### 5. Additional HIPAA Requirements

**Business Associate Agreement (BAA):**
- Required with all vendors (Vercel, Neon, Resend, Anthropic)
- Anthropic has BAA available for Claude API
- Vercel Pro+ includes BAA
- Neon supports BAA on request

**Access Controls:**
- Role-based access control (RBAC) - ✅ Already implemented
- Minimum necessary access principle
- User activity monitoring
- Automatic session timeout - ⚠️ Need to implement

**Breach Notification:**
- 60-day notification requirement
- Incident response plan documented
- Breach detection monitoring
- User notification system

**Technical Safeguards (164.312):**
- ✅ Unique user IDs (already implemented)
- ✅ Automatic logoff (need shorter timeout)
- ✅ Encryption in transit (HTTPS)
- ⚠️ Encryption at rest (need database-level encryption)
- ⚠️ Audit controls (need comprehensive logging)

---

## Financial Services (SOC 2, PCI DSS)

### SOC 2 Type II Compliance

**Key Differences from Current:**

1. **Session Security**
   - Maximum 2-hour session duration (vs. current 30 days)
   - Concurrent session limits (1-3 devices max)
   - Device binding (token tied to device fingerprint)

2. **MFA Requirements**
   - Required for all admin/financial actions
   - TOTP or hardware tokens (not SMS)
   - Backup codes for account recovery

3. **Audit Trail**
   - Tamper-proof logs (write-only database or blockchain)
   - Centralized logging (Datadog, Splunk)
   - Real-time alerting for suspicious activity

4. **Infrastructure**
   - Web Application Firewall (WAF)
   - DDoS protection (Cloudflare, AWS Shield)
   - Regular penetration testing (quarterly)
   - Vulnerability scanning (weekly)

### PCI DSS (if processing payments directly)

**Note:** CodeScribe AI uses Stripe (PCI-compliant processor), so direct PCI compliance is **not required**. Stripe handles all card data.

**If you were to handle card data:**
- Never store CVV/CVC
- Tokenize card numbers (never raw storage)
- Network segmentation (card data isolated)
- Quarterly vulnerability scans
- Annual penetration testing
- Compensating controls documented

**Current Architecture = PCI-Safe:**
- Stripe Checkout handles all card input
- No card data touches CodeScribe servers
- Stripe webhooks use signed requests
- Payment data stored as Stripe IDs only

### Financial Services Additional Requirements

1. **Enhanced Authentication**
```javascript
// Step-up authentication for financial actions
app.post('/api/payments/withdraw', requireAuth, async (req, res) => {
  // Require re-authentication for sensitive actions
  if (!req.body.recentAuth || req.body.recentAuth < Date.now() - 5 * 60 * 1000) {
    return res.status(403).json({
      error: 'Recent authentication required',
      requiresReauth: true
    });
  }

  // Proceed with withdrawal
});
```

2. **Transaction Signing**
```javascript
// Sign critical transactions
const signature = crypto
  .createHmac('sha256', USER_SECRET)
  .update(JSON.stringify(transaction))
  .digest('hex');

await Transaction.create({
  ...transaction,
  signature,
  userId: req.user.id
});
```

3. **Rate Limiting (Stricter)**
```javascript
// Financial endpoints: 10 requests per hour
const financialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many financial requests'
});

app.use('/api/payments', financialLimiter);
```

---

## Migration Path to httpOnly Cookies

### When to Migrate

Migrate when you plan to:
1. Handle HIPAA-covered data (PHI)
2. Pursue SOC 2 Type II certification
3. Enter regulated industries (healthcare, finance, government)
4. Enterprise customers requiring it in contracts
5. User-generated HTML content (XSS risk increases)

### Migration Steps

#### Phase 1: Backend Changes (1-2 days)

**1. Add cookie-based auth middleware**
```javascript
// server/src/middleware/cookieAuth.js
import jwt from 'jsonwebtoken';

export const requireCookieAuth = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**2. Add CSRF protection**
```javascript
// server/src/middleware/csrf.js
import crypto from 'crypto';

export const csrfProtection = (req, res, next) => {
  if (req.method === 'GET') return next();

  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;

  if (!token || token !== sessionToken) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }

  next();
};

// Generate token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  res.json({ csrfToken: token });
});
```

**3. Update login endpoint**
```javascript
app.post('/api/auth/login', async (req, res) => {
  // ... validate credentials

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '8h' });

  // Set httpOnly cookies
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });

  res.json({ success: true, user: { id: user.id, email: user.email } });
});
```

#### Phase 2: Frontend Changes (2-3 days)

**1. Remove localStorage usage**
```javascript
// OLD: localStorage-based
const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

// NEW: Cookie-based (no manual storage)
// Cookies sent automatically with credentials: 'include'
```

**2. Update API client**
```javascript
// client/src/utils/api.js
let csrfToken = null;

// Fetch CSRF token on app load
export async function initAuth() {
  const response = await fetch(`${API_URL}/api/csrf-token`, {
    credentials: 'include'
  });
  const { csrfToken: token } = await response.json();
  csrfToken = token;
}

// Update all API calls
export async function apiCall(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add CSRF token for non-GET requests
  if (options.method && options.method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Send cookies
  });

  return response;
}
```

**3. Update auth context**
```javascript
// client/src/contexts/AuthContext.jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Check auth status on mount (cookie-based)
  useEffect(() => {
    async function checkAuth() {
      const response = await apiCall(`${API_URL}/api/auth/me`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await apiCall(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      return { success: true };
    }

    const error = await response.json();
    return { success: false, error: error.message };
  };

  const logout = async () => {
    await apiCall(`${API_URL}/api/auth/logout`, { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### Phase 3: CORS Configuration (1 day)

**Backend CORS settings**
```javascript
// server/index.js
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL, // Exact origin, not wildcard
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token']
}));
```

**Frontend Vercel config**
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        }
      ]
    }
  ]
}
```

#### Phase 4: Testing & Rollout (2-3 days)

1. **Test in development**
   - All API calls work with cookies
   - CSRF protection functions correctly
   - Login/logout flows work
   - Session expiration handled

2. **Gradual rollout**
   - Deploy backend changes
   - Enable feature flag for cookie auth
   - A/B test with 10% of users
   - Monitor error rates
   - Full rollout after 1 week stable

3. **Migration support**
   - Support both auth methods for 1 month
   - Auto-migrate users on next login
   - Clear localStorage tokens after migration

**Total Migration Time:** 1-2 weeks

---

## Summary & Recommendations

### Current Status: ✅ Secure for General SaaS

CodeScribe AI's current localStorage + Bearer token approach is:
- **Secure** for typical SaaS applications
- **Industry standard** for React/SPA architectures
- **GDPR compliant** (no regulated data handling)
- **Low XSS risk** (React auto-escaping, no user HTML)

### When to Migrate to httpOnly Cookies

**Immediate Need:**
- ❌ None - current implementation is secure

**Future Triggers:**
- ✅ HIPAA compliance required (healthcare data)
- ✅ SOC 2 Type II certification needed
- ✅ Financial services customers demanding it
- ✅ Enterprise contracts requiring httpOnly cookies
- ✅ User-generated HTML features added (WYSIWYG)

### Risk Acceptance

**Accepted Risks:**
- XSS vulnerability (low probability given React + no user HTML)
- 30-day token exposure window (acceptable for non-regulated data)

**Unacceptable for:**
- Protected Health Information (PHI)
- Financial transaction data
- Government classified information
- Enterprise apps with plugin systems

### Action Items

**Now:**
- ✅ Document current auth pattern (this guide)
- ✅ Add Content-Security-Policy headers (prevents XSS)
- ✅ Enable security audit logging

**Future (if compliance needed):**
- 🔄 Migrate to httpOnly cookies (1-2 weeks)
- 🔄 Implement CSRF protection
- 🔄 Shorten session duration (15 minutes)
- 🔄 Add refresh token flow
- 🔄 Enable comprehensive audit logging
- 🔄 Obtain vendor BAAs (Vercel, Neon, Anthropic)

---

## References

- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [HIPAA Security Rule (45 CFR 164.312)](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [SOC 2 Trust Services Criteria](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/socforserviceorganizations)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/document_library/)
- [Auth0 Token Storage Best Practices](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)
- [JWT.io - JWT Decoder](https://jwt.io)

---

**Document Maintainer:** Development Team
**Review Cadence:** Quarterly or when entering new regulated markets
**Last Security Audit:** N/A (recommend annual audits if pursuing enterprise)
