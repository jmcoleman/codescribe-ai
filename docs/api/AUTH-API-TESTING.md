# Auth API Testing Guide

Complete guide for testing all authentication endpoints in CodeScribe AI.

## Prerequisites

1. **Environment Setup**: Ensure [server/.env](../../server/.env) has the required variables:
   ```bash
   JWT_SECRET=your-super-secret-jwt-key
   SESSION_SECRET=your-super-secret-session-key
   POSTGRES_URL=your-database-connection-string
   CLIENT_URL=http://localhost:5173

   # Optional (for GitHub OAuth)
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
   ```

2. **Start Server**:
   ```bash
   cd server
   npm run dev
   ```
   Server should run on `http://localhost:3000`

3. **Database Initialized**: On startup, the server automatically creates:
   - `users` table
   - `session` table
   - `usage` table

---

## API Endpoints

### 1. POST /api/auth/signup
Register a new user with email and password.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "tier": "free",
    "created_at": "2025-10-23T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- **400**: Validation failed (invalid email, password too short)
- **409**: User already exists

**Notes:**
- Password must be at least 8 characters
- Password is hashed with bcrypt (10 salt rounds)
- Returns JWT token valid for 7 days
- User is also logged in via session

---

### 2. POST /api/auth/login
Authenticate existing user.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "tier": "free",
    "created_at": "2025-10-23T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- **400**: Validation failed
- **401**: Invalid email or password

**Notes:**
- Uses Passport local strategy
- Returns new JWT token on each login
- Establishes session cookie

---

### 3. GET /api/auth/me
Get current authenticated user info.

**Request (with JWT):**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Request (with session cookie):**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "test@example.com",
    "tier": "free",
    "github_id": null,
    "created_at": "2025-10-23T..."
  }
}
```

**Error Responses:**
- **401**: Authentication required (no token or invalid token)
- **404**: User not found

**Notes:**
- Supports both JWT (`Authorization: Bearer <token>`) and session authentication
- Use this to check if user is logged in

---

### 4. POST /api/auth/logout
Log out current user.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**
- **401**: Authentication required

**Notes:**
- Destroys session on server side
- Client should delete stored JWT token
- JWT tokens cannot be invalidated server-side (stateless)

---

### 5. GET /api/auth/github
Initiate GitHub OAuth flow.

**Browser Request:**
```
http://localhost:3000/api/auth/github
```

**Behavior:**
- Redirects to GitHub OAuth authorization page
- User authorizes CodeScribe AI
- GitHub redirects back to `/api/auth/github/callback`

**Error:**
- If GitHub OAuth not configured (missing env vars), returns 500

**Notes:**
- Must be opened in browser (not curl)
- Requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`

---

### 6. GET /api/auth/github/callback
GitHub OAuth callback handler.

**Automatic Request** (from GitHub):
```
http://localhost:3000/api/auth/github/callback?code=GITHUB_AUTH_CODE
```

**Success Redirect:**
```
http://localhost:5173/auth/callback?token=JWT_TOKEN_HERE
```

**Error Redirects:**
- `/login?error=github_auth_failed` - GitHub authentication failed
- `/login?error=no_user_data` - No user data received from GitHub
- `/login?error=callback_failed` - Server error during callback

**Notes:**
- Automatically creates user account if doesn't exist
- Links GitHub account to existing email if email matches
- Frontend should extract token from URL parameter and store it
- User is created with `tier: 'free'` by default

---

### 7. POST /api/auth/forgot-password
Request password reset email.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Notes:**
- ⚠️ **Currently a placeholder** - email functionality not implemented
- Always returns success (prevents email enumeration)
- TODO: Implement email service integration
- TODO: Generate and store reset token
- See code comments in [server/src/routes/auth.js:250-272](../../server/src/routes/auth.js#L250-L272) for implementation notes

---

### 8. POST /api/auth/reset-password
Confirm password reset with token.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_EMAIL",
    "password": "NewSecurePass456"
  }'
```

**Current Response (501 Not Implemented):**
```json
{
  "success": false,
  "error": "Password reset functionality not yet implemented"
}
```

**Notes:**
- ⚠️ **Currently a placeholder** - reset functionality not implemented
- Token should be at least 32 characters
- Password validation applies (min 8 chars)
- TODO: Implement token verification and password update
- See code comments in [server/src/routes/auth.js:291-323](../../server/src/routes/auth.js#L291-L323) for implementation notes

---

## Testing Workflows

### Complete User Registration Flow

1. **Register new user:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"user@test.com","password":"Password123"}'
   ```
   Save the `token` from response.

2. **Get user info:**
   ```bash
   curl -X GET http://localhost:3000/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Logout:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/logout \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Login again:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@test.com","password":"Password123"}'
   ```

---

### GitHub OAuth Flow

1. Open browser to `http://localhost:3000/api/auth/github`
2. Authorize app on GitHub
3. Get redirected to `http://localhost:5173/auth/callback?token=...`
4. Extract token from URL
5. Use token for authenticated requests:
   ```bash
   curl -X GET http://localhost:3000/api/auth/me \
     -H "Authorization: Bearer YOUR_GITHUB_TOKEN"
   ```

---

## Error Handling

All endpoints follow consistent error format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": {
    "field": "Specific validation error"
  }
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created (signup)
- **400**: Bad request / validation error
- **401**: Unauthorized / authentication required
- **403**: Forbidden (insufficient tier)
- **404**: Resource not found
- **409**: Conflict (user already exists)
- **500**: Server error
- **501**: Not implemented (password reset)

---

## Authentication Methods

### 1. JWT Token (Recommended for API clients)

**Include in every request:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Token Details:**
- Expires in 7 days
- Contains user ID in `sub` claim
- Cannot be invalidated server-side (stateless)

### 2. Session Cookie (Recommended for web browsers)

**Automatically sent by browser:**
```
Cookie: connect.sid=SESSION_ID
```

**Session Details:**
- Stored in PostgreSQL `session` table
- Expires in 7 days
- Automatically destroyed on logout

---

## Security Features

### Password Security
- Bcrypt hashing with 10 salt rounds
- Minimum 8 character requirement
- Passwords never returned in responses

### Token Security
- JWT signed with `JWT_SECRET`
- 7-day expiration
- HTTPS only in production

### Session Security
- Stored in PostgreSQL (not memory)
- HTTP-only cookies (JavaScript can't access)
- Secure flag enabled in production
- CSRF protection via SameSite

### Rate Limiting
- IP-based rate limiting on all endpoints
- Additional authentication-specific limits recommended

---

## Database Schema

### users table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),           -- NULL for OAuth-only users
  github_id VARCHAR(255) UNIQUE,        -- NULL for email/password users
  tier VARCHAR(50) DEFAULT 'free',      -- free, pro, team, enterprise
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### session table
```sql
CREATE TABLE session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
```

### usage table
```sql
CREATE TABLE usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,  -- 'generate', 'upload', etc.
  file_size INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Postman Collection

Import this JSON to Postman for quick testing:

```json
{
  "info": {
    "name": "CodeScribe AI Auth",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [{"key": "token", "value": "{{jwt_token}}", "type": "string"}]
  },
  "variable": [
    {"key": "base_url", "value": "http://localhost:3000"},
    {"key": "jwt_token", "value": ""}
  ],
  "item": [
    {
      "name": "Signup",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/signup",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"Password123\"}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"Password123\"}"
        }
      }
    },
    {
      "name": "Get Me",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/auth/me"
      }
    },
    {
      "name": "Logout",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/logout"
      }
    }
  ]
}
```

---

## Next Steps

1. **Implement password reset**:
   - Add email service (SendGrid, AWS SES, etc.)
   - Generate and store reset tokens
   - Implement token verification
   - Add password update logic

2. **Add unit tests**:
   - Test validation logic
   - Test authentication flows
   - Test error handling

3. **Add E2E tests**:
   - Test complete registration flow
   - Test GitHub OAuth flow
   - Test session persistence

4. **Enhance security**:
   - Add rate limiting per user
   - Implement email verification
   - Add 2FA support
   - Add IP logging for security events

---

**Last updated:** October 23, 2025
**Related Documentation:**
- [API Reference](API-Reference.md)
- [User Model](../../server/src/models/User.js)
- [Auth Routes](../../server/src/routes/auth.js)
- [Auth Middleware](../../server/src/middleware/auth.js)
- [Passport Config](../../server/src/config/passport.js)
