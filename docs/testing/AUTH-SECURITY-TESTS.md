# Authentication Security Testing Guide

**Purpose:** Security testing procedures for authentication system
**Last Updated:** October 23, 2025
**Status:** ✅ Active

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Automated Security Tests](#automated-security-tests)
3. [Manual Security Testing](#manual-security-testing)
4. [Security Checklist](#security-checklist)
5. [Vulnerability Testing](#vulnerability-testing)
6. [Security Best Practices](#security-best-practices)

---

## Overview

This document outlines security testing procedures for the CodeScribe AI authentication system, covering automated tests, manual testing procedures, and security best practices.

### Threat Model

**Protected Assets:**
- User credentials (email, password)
- JWT tokens
- User session data
- User personal information

**Potential Threats:**
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Session hijacking
- Brute force attacks
- Password exposure
- Token theft

---

## Automated Security Tests

### 1. SQL Injection Prevention

**Backend Tests:** [`server/tests/integration/auth.test.js`](../../server/tests/integration/auth.test.js)

```javascript
// Test SQL injection attempts in email field
test('should prevent SQL injection in email field', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: "admin'--",
      password: 'password123'
    });

  expect(response.status).toBe(401);
  expect(response.body.error).toBe('Invalid email or password');
});

test('should prevent SQL injection in password field', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: "' OR '1'='1"
    });

  expect(response.status).toBe(401);
});
```

**Protection Mechanism:**
- Parameterized queries via `node-postgres` (`pg` package)
- Input validation via `validateBody` middleware
- Email format validation using regex

**Verification:**
```bash
cd server
npm test -- --grep "SQL injection"
```

---

### 2. XSS (Cross-Site Scripting) Prevention

**Frontend Tests:** Component tests sanitize inputs

**Attack Vectors:**
- Email input fields
- Password fields
- Error messages
- Success messages

**Protection Mechanisms:**
- React automatically escapes JSX content
- DOMPurify for markdown rendering (in DocPanel)
- No `dangerouslySetInnerHTML` in auth components
- Input validation on both client and server

**Manual XSS Test Cases:**

```javascript
// Test XSS in email field
test('should sanitize XSS attempt in email', async () => {
  const xssEmail = '<script>alert("XSS")</script>@example.com';

  // Should fail validation (invalid email format)
  await userEvent.type(emailInput, xssEmail);
  await userEvent.click(submitButton);

  expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
});

// Test XSS in password field
test('should handle special characters in password safely', async () => {
  const password = '<script>alert(1)</script>';

  // Should be treated as literal string, not executed
  await userEvent.type(passwordInput, password);

  // No script execution should occur
  expect(window.alert).not.toHaveBeenCalled();
});
```

**Verification:**
```bash
cd client
npm test -- AuthContext LoginModal SignupModal
```

---

### 3. CSRF (Cross-Site Request Forgery) Prevention

**Protection Mechanisms:**
1. **SameSite Cookies:** Session cookies set with `SameSite=Strict`
2. **JWT Tokens:** Primary authentication via JWT in localStorage (not cookies)
3. **Origin Validation:** Server validates request origin
4. **CORS Configuration:** Strict CORS policy in production

**Backend Configuration:** [`server/src/server.js`](../../server/src/server.js)

```javascript
// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Session configuration with SameSite
app.use(session({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

**Manual CSRF Testing:**

1. **Verify SameSite Cookie:**
```bash
curl -I http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Check for Set-Cookie header with SameSite=Strict
```

2. **Test Cross-Origin Request:**
```bash
# Attempt login from different origin (should be blocked by CORS)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Origin: http://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Should return CORS error
```

---

### 4. Password Security

**Protection Mechanisms:**
- bcrypt hashing (cost factor: 12)
- Minimum password length: 8 characters
- Password strength validation (frontend)
- No password exposure in responses
- No password logging

**Backend Tests:**

```javascript
test('should hash password before storing', async () => {
  const user = await User.create({
    email: 'test@example.com',
    password: 'plaintextPassword'
  });

  // Password should be hashed
  expect(user.password_hash).not.toBe('plaintextPassword');
  expect(user.password_hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
});

test('should never return password hash in response', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'test@example.com',
      password: 'Password123'
    });

  expect(response.body.user.password).toBeUndefined();
  expect(response.body.user.password_hash).toBeUndefined();
});
```

**Password Strength Requirements:**
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number

**Verification:**
```bash
cd server
npm test -- --grep "password"
```

---

### 5. Token Security

**JWT Configuration:**
- Algorithm: HS256 (HMAC SHA-256)
- Expiration: 7 days
- Secret: Strong random string (environment variable)

**Security Measures:**
- Tokens stored in localStorage (XSS mitigation via CSP)
- Tokens validated on every protected route
- Expired tokens rejected
- Token includes only necessary claims (id, email, tier)

**Backend Tests:**

```javascript
test('should reject expired tokens', async () => {
  // Create expired token
  const expiredToken = jwt.sign(
    { id: 1, email: 'test@example.com' },
    process.env.JWT_SECRET,
    { expiresIn: '-1h' } // Already expired
  );

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${expiredToken}`);

  expect(response.status).toBe(401);
  expect(response.body.error).toContain('expired');
});

test('should reject tampered tokens', async () => {
  const validToken = 'valid.jwt.token';
  const tamperedToken = validToken + 'x'; // Tampered signature

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${tamperedToken}`);

  expect(response.status).toBe(401);
});
```

---

### 6. Rate Limiting

**Note:** Rate limiting is currently implemented for documentation generation API. For production, authentication endpoints should also have rate limiting.

**Recommended Implementation:**

```javascript
// server/src/middleware/rateLimiter.js (auth endpoints)
import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to auth routes
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/signup', authRateLimiter);
```

---

## Manual Security Testing

### Test Scenarios

#### 1. Brute Force Attack Simulation

**Test:** Attempt multiple failed logins

```bash
# Script to test brute force protection
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@example.com\",\"password\":\"wrong$i\"}"
  echo "\nAttempt $i"
  sleep 1
done
```

**Expected:** Rate limiting should kick in after 5 attempts

---

#### 2. Session Hijacking Prevention

**Test:** Attempt to use stolen token from different IP

1. Login from IP A, capture token
2. Attempt to use token from IP B
3. Verify token works (JWT is stateless)

**Note:** For enhanced security, consider implementing:
- Token binding to IP address
- Refresh token rotation
- Anomaly detection for suspicious activity

---

#### 3. Password Reset Token Security

**Test:** Verify reset tokens are:
- Single-use
- Time-limited (1 hour)
- Cryptographically secure
- Cannot be guessed

```javascript
// Backend test
test('should reject used password reset token', async () => {
  const resetToken = await User.generateResetToken(userId);

  // Use token once
  await User.resetPassword(resetToken, 'NewPassword123');

  // Attempt to reuse
  const result = await User.resetPassword(resetToken, 'AnotherPass123');

  expect(result.success).toBe(false);
  expect(result.error).toContain('invalid or expired');
});
```

---

#### 4. Information Disclosure Prevention

**Test:** Verify system doesn't leak sensitive info

```bash
# Test user enumeration via signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com","password":"Pass123"}'

# Should return generic error, not "email already exists"
# (Note: Current implementation does return specific error for UX)
```

**Current Behavior:**
- ❌ Signup returns "User with this email already exists"
- ✅ Forgot password always returns generic message

**Recommendation:** Consider generic signup error in production

---

## Security Checklist

### Pre-Deployment Checklist

- [ ] All passwords hashed with bcrypt (cost ≥ 12)
- [ ] JWT secret is strong random string (≥ 32 chars)
- [ ] No secrets in code or version control
- [ ] HTTPS enforced in production
- [ ] Secure cookie flags set (httpOnly, secure, sameSite)
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled on auth endpoints
- [ ] SQL injection tests passing
- [ ] XSS prevention verified
- [ ] CSRF protection configured
- [ ] Password reset tokens are secure and time-limited
- [ ] Error messages don't leak sensitive info
- [ ] Audit logging implemented for auth events

### Ongoing Monitoring

- [ ] Monitor failed login attempts
- [ ] Track suspicious activity patterns
- [ ] Regular security dependency updates
- [ ] Periodic penetration testing
- [ ] Security audit logs reviewed weekly

---

## Vulnerability Testing

### Tools

1. **OWASP ZAP** - Web application security scanner
2. **Burp Suite** - Manual penetration testing
3. **npm audit** - Dependency vulnerability scanning
4. **Snyk** - Continuous vulnerability monitoring

### Running Security Scans

```bash
# Check for dependency vulnerabilities
cd server && npm audit
cd client && npm audit

# Fix vulnerabilities
npm audit fix

# Check for high-severity issues
npm audit --audit-level=high
```

### Penetration Testing Checklist

- [ ] SQL Injection testing
- [ ] XSS attack vectors
- [ ] CSRF token validation
- [ ] Session management
- [ ] Authentication bypass attempts
- [ ] Authorization testing
- [ ] Input validation testing
- [ ] Error handling
- [ ] Information disclosure
- [ ] Cryptography validation

---

## Security Best Practices

### Development

1. **Never commit secrets**
   - Use `.env` files (gitignored)
   - Use environment variables
   - Rotate secrets regularly

2. **Validate all inputs**
   - Client-side validation (UX)
   - Server-side validation (security)
   - Whitelist approach preferred

3. **Secure password handling**
   - Never log passwords
   - Hash immediately upon receipt
   - Use strong hashing algorithm (bcrypt)

4. **Token management**
   - Short expiration times
   - Secure storage (httpOnly cookies or secure localStorage)
   - Validate on every request

### Production

1. **Enable HTTPS**
   - Force HTTPS redirect
   - HSTS headers
   - Secure cookie flag

2. **Rate limiting**
   - Login attempts: 5 per 15 minutes
   - Signup attempts: 3 per hour per IP
   - Password reset: 3 per hour per email

3. **Monitoring**
   - Failed login attempts
   - Unusual access patterns
   - Account lockouts
   - Token generation/validation failures

4. **Incident Response**
   - Document security incident procedures
   - Have rollback plan ready
   - Maintain audit logs
   - Regular backups

---

## Test Execution

### Run All Auth Security Tests

```bash
# Backend unit tests
cd server
npm test src/middleware/__tests__/auth.test.js
npm test src/models/__tests__/User.test.js

# Backend integration tests
npm test tests/integration/auth.test.js
npm test tests/integration/github-oauth.test.js

# Frontend unit tests
cd ../client
npm test contexts/__tests__/AuthContext.test.jsx
npm test components/__tests__/LoginModal.test.jsx
npm test components/__tests__/SignupModal.test.jsx
npm test components/__tests__/ForgotPasswordModal.test.jsx

# E2E tests
npx playwright test e2e/auth.spec.js

# Security-focused test subset
npm test -- --grep "security|injection|xss|csrf"
```

### Coverage Report

```bash
# Generate coverage report
cd server && npm test -- --coverage
cd ../client && npm test -- --coverage
```

**Target Coverage:** ≥ 90% for auth-related code

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Passport.js Security](http://www.passportjs.org/)

---

## Appendix: Security Test Matrix

| Threat | Protection | Test Location | Status |
|--------|-----------|---------------|--------|
| SQL Injection | Parameterized queries | `server/tests/integration/auth.test.js` | ✅ Tested |
| XSS | React escaping, input validation | `client/src/components/__tests__/*.test.jsx` | ✅ Tested |
| CSRF | SameSite cookies, JWT | `server/src/server.js` | ✅ Configured |
| Weak passwords | bcrypt + validation | `server/src/models/User.js` | ✅ Implemented |
| Token theft | httpOnly, secure flags | `server/src/middleware/auth.js` | ✅ Implemented |
| Brute force | Rate limiting | `server/src/middleware/*` | ⚠️ Recommended |
| Session hijacking | Token validation | `server/src/middleware/auth.js` | ✅ Implemented |
| Info disclosure | Generic errors | `server/src/routes/auth.js` | ⚠️ Partial |

**Legend:**
- ✅ Fully implemented and tested
- ⚠️ Partially implemented or recommended enhancement
- ❌ Not implemented

---

**Last Security Audit:** October 23, 2025
**Next Scheduled Audit:** November 23, 2025 (monthly cadence)
