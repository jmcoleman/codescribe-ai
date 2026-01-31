# Email Preview & Send API - Implementation Plan

## Overview

Create a RESTful API endpoint suite for previewing and sending test emails from all 13 email templates. Designed for Postman-based testing and marketing review in non-production environments.

## API Design

### Endpoints

```
GET  /api/admin/emails/templates  - List all available templates
POST /api/admin/emails/preview    - Generate HTML preview (no send)
POST /api/admin/emails/send       - Send test email via Resend
```

### Security Stack (4 layers)

1. **Bearer Token** - `requireAuth` middleware (existing)
2. **Admin Role** - `requireAdmin` middleware (existing)
3. **API Key** - `requireEmailPreviewKey` middleware (NEW)
   - Header: `X-Email-Preview-Key`
   - Env var: `EMAIL_PREVIEW_API_KEY`
4. **Environment Block** - `requireNonProduction` middleware (NEW)
   - Blocks if `NODE_ENV === 'production'`

### Request Examples

**Preview single email:**
```json
POST /api/admin/emails/preview
Headers:
  Authorization: Bearer <jwt_token>
  X-Email-Preview-Key: <api_key>
Body:
{
  "template": "passwordReset",
  "recipient": "test@example.com",
  "useDefaults": true,
  "params": { /* optional overrides */ }
}
```

**Preview all emails:**
```json
POST /api/admin/emails/preview
Body:
{
  "mode": "all",
  "recipient": "test@example.com"
}
```

**Send test email:**
```json
POST /api/admin/emails/send
Headers:
  Authorization: Bearer <jwt_token>
  X-Email-Preview-Key: <api_key>
Body:
{
  "template": "emailVerification",
  "recipient": "marketing@example.com",
  "useDefaults": true
}
```

### Response Format

**Preview response:**
```json
{
  "success": true,
  "template": "passwordReset",
  "html": "<html>...</html>",
  "metadata": {
    "subject": "Reset Your Password - CodeScribe AI",
    "from": "CodeScribe AI <noreply@mail.codescribeai.com>",
    "to": "test@example.com",
    "environment": "development",
    "generatedAt": "2026-01-30T12:34:56.789Z",
    "paramsUsed": { /* ... */ }
  }
}
```

**Send response:**
```json
{
  "success": true,
  "template": "passwordReset",
  "emailId": "re_abc123xyz",
  "recipient": "test@example.com",
  "metadata": {
    "sentAt": "2026-01-30T12:34:56.789Z",
    "provider": "resend",  // or "mock"
    "subject": "Reset Your Password - CodeScribe AI"
  }
}
```

## Implementation

### Files to Create

**1. `/server/src/services/emailPreviewService.js`** (NEW - ~300 lines)

Core logic for email preview/send:
- `getAvailableTemplates()` - Returns list of all 13 templates with metadata
- `previewEmail(templateName, params, useDefaults)` - Generates HTML preview
- `sendTestEmail(templateName, recipient, params, useDefaults)` - Sends via Resend
- `previewAllEmails(recipient)` - Generates all 13 templates at once
- `getDefaultParams(templateName, recipient)` - Realistic test data generator
- Template name → function mapping

**2. `/server/src/utils/emailTestData.js`** (NEW - ~200 lines)

Realistic test parameters for all 13 templates:
- Pre-populated with realistic names, dates, reasons
- Generates proper tokens/links for preview mode
- Subject line mapping for each template
- Environment-aware URLs (CLIENT_URL)

### Files to Modify

**3. `/server/src/routes/admin.js`** (MODIFY - add ~200 lines)

Add three new route handlers:
```javascript
// At top: Add imports
import {
  previewEmail,
  sendTestEmail,
  previewAllEmails,
  getAvailableTemplates
} from '../services/emailPreviewService.js';

// After requireAdmin: Add security middleware
const requireEmailPreviewKey = (req, res, next) => {
  const key = req.headers['x-email-preview-key'];
  if (!key || key !== process.env.EMAIL_PREVIEW_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Valid X-Email-Preview-Key header required',
      code: 'INVALID_API_KEY'
    });
  }
  next();
};

const requireNonProduction = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Email preview/send is not available in production',
      code: 'PRODUCTION_BLOCKED'
    });
  }
  next();
};

// Before export: Add route handlers
router.get('/emails/templates',
  requireAuth, requireAdmin, requireEmailPreviewKey,
  async (req, res) => { /* handler */ }
);

router.post('/emails/preview',
  requireAuth, requireAdmin, requireEmailPreviewKey, requireNonProduction,
  async (req, res) => { /* handler */ }
);

router.post('/emails/send',
  requireAuth, requireAdmin, requireEmailPreviewKey, requireNonProduction,
  async (req, res) => { /* handler */ }
);
```

**4. `/server/.env` and `.env.example`** (MODIFY)

Add new environment variable:
```bash
# Email Preview/Send API Key (Non-Production Only)
# Generate with: openssl rand -base64 32
EMAIL_PREVIEW_API_KEY=replace-with-generated-secret-min-32-characters
```

## Available Templates (13 total)

1. **passwordReset** - Password reset with expiring link
2. **emailVerification** - Email confirmation with token
3. **deletionScheduled** - Account deletion scheduled (7-day warning)
4. **accountRestored** - Account successfully restored
5. **finalDeletionWarning** - Final 24-hour deletion warning
6. **trialExpiring** - Trial expires in 1-3 days (urgent colors)
7. **trialExpired** - Trial has ended, downgraded to Free
8. **trialExtended** - Trial extended by admin
9. **accountSuspended** - Account suspended with reason
10. **accountUnsuspended** - Account reactivated
11. **trialGrantedByAdmin** - Admin granted trial access
12. **supportRequest** - Support ticket from user (sent to team)
13. **contactSales** - Sales inquiry from user (sent to sales)

## Environment Setup

### Development Setup

1. Generate API key:
```bash
openssl rand -base64 32
```

2. Add to `/server/.env`:
```bash
EMAIL_PREVIEW_API_KEY=<generated_key_here>
```

3. Get your admin auth token:
   - Log in as admin user
   - Copy JWT from browser localStorage: `localStorage.getItem('authToken')`

### Postman Setup

Create environment variables:
- `BASE_URL` = `http://localhost:3000`
- `AUTH_TOKEN` = `<your_jwt_token>`
- `EMAIL_PREVIEW_KEY` = `<your_api_key>`

Set headers for all requests:
- `Authorization: Bearer {{AUTH_TOKEN}}`
- `X-Email-Preview-Key: {{EMAIL_PREVIEW_KEY}}`

## Testing & Verification

### 1. List Available Templates

```bash
curl -X GET http://localhost:3000/api/admin/emails/templates \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Email-Preview-Key: $API_KEY"
```

Expected: JSON array of 13 templates with metadata.

### 2. Preview Single Email

```bash
curl -X POST http://localhost:3000/api/admin/emails/preview \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Email-Preview-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "passwordReset",
    "recipient": "test@example.com",
    "useDefaults": true
  }'
```

Expected: Full HTML email in response, realistic test data populated.

### 3. Preview All Emails (Marketing Review)

```bash
curl -X POST http://localhost:3000/api/admin/emails/preview \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Email-Preview-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "all",
    "recipient": "marketing@example.com"
  }'
```

Expected: Array of 13 email templates with HTML and metadata.

**For Marketing:** Save response to file, extract HTML for each template, open in browsers to review all emails at once.

### 4. Send Test Email

```bash
curl -X POST http://localhost:3000/api/admin/emails/send \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Email-Preview-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "emailVerification",
    "recipient": "your-email@gmail.com",
    "useDefaults": true
  }'
```

Expected:
- Mock mode (`MOCK_EMAILS=true`): Console log confirmation, no actual email
- Real mode (`MOCK_EMAILS=false`): Resend API sends email, response includes email ID

### 5. Verify Security

**Test: Invalid API key**
```bash
curl -X POST http://localhost:3000/api/admin/emails/preview \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Email-Preview-Key: wrong_key" \
  -d '{"template": "passwordReset"}'
```
Expected: 401 Unauthorized, `INVALID_API_KEY` code

**Test: Production block**
```bash
# Set NODE_ENV=production temporarily
curl -X POST http://localhost:3000/api/admin/emails/preview \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Email-Preview-Key: $API_KEY" \
  -d '{"template": "passwordReset"}'
```
Expected: 403 Forbidden, `PRODUCTION_BLOCKED` code

**Test: Non-admin user**
```bash
# Use non-admin JWT token
curl -X POST http://localhost:3000/api/admin/emails/preview \
  -H "Authorization: Bearer $NON_ADMIN_TOKEN" \
  -H "X-Email-Preview-Key: $API_KEY" \
  -d '{"template": "passwordReset"}'
```
Expected: 403 Forbidden, admin access required

## Usage Workflow

### For Marketing Review (All Emails)

1. Open Postman
2. POST to `/api/admin/emails/preview` with `"mode": "all"`
3. Response contains 13 templates
4. Extract HTML for each template
5. Save to individual `.html` files or view in browser
6. Review design, copy, branding

### For Single Email Testing

1. Choose template from list (GET `/emails/templates`)
2. Preview first: POST `/emails/preview` with template name
3. Review HTML output
4. If satisfied, send test: POST `/emails/send` with your email
5. Check inbox (or console if mocked)

### For Parameter Customization

```json
POST /api/admin/emails/preview
{
  "template": "trialExpiring",
  "recipient": "test@example.com",
  "useDefaults": true,
  "params": {
    "userName": "Jane Smith",
    "daysRemaining": 1,
    "trialTier": "team"
  }
}
```

Parameters specified in `params` override defaults, but `useDefaults: true` fills in missing values (environment, clientUrl, etc).

## Error Handling

All errors return structured JSON:

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Template 'invalidName' not found",
  "code": "TEMPLATE_NOT_FOUND",
  "availableTemplates": ["passwordReset", "emailVerification", ...]
}
```

**Error codes:**
- `INVALID_API_KEY` - Wrong or missing X-Email-Preview-Key header
- `PRODUCTION_BLOCKED` - Attempted use in production environment
- `TEMPLATE_REQUIRED` - Missing template name in request
- `TEMPLATE_NOT_FOUND` - Invalid template name
- `RECIPIENT_REQUIRED` - Missing recipient for send mode

## Critical Files

**Implementation:**
- `/server/src/services/emailPreviewService.js` - Core logic (NEW)
- `/server/src/utils/emailTestData.js` - Test data (NEW)
- `/server/src/routes/admin.js` - Route handlers (MODIFY)
- `/server/.env` - API key config (MODIFY)

**Reference:**
- `/server/src/services/emailService.js` - Email sending patterns
- `/server/src/services/emailTemplates/index.js` - All 13 template exports
- `/server/src/middleware/auth.js` - Auth middleware patterns

## Notes

- **Mock vs Real**: Respects `MOCK_EMAILS` env var. In development, emails are mocked by default unless `MOCK_EMAILS=false`.
- **Rate Limits**: Inherits existing admin route rate limiting (500 req/15min window).
- **Token Generation**: Preview mode generates fake tokens (e.g., `test_reset_abc123xyz`). Real tokens should be used for actual email flows.
- **Dark Mode**: All templates support dark mode via CSS media queries.
- **Resend Limits**: Free tier = 3,000 emails/month, 100/day. Suggest keeping `MOCK_EMAILS=true` for most testing.
