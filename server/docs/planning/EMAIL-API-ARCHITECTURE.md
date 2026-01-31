# Email Service API Architecture - Implementation Plan

## Overview

Refactor email service to use a **single source of truth** for all email sending (production, preview, testing). This ensures preview/test emails use the exact same logic as production, prevents code path divergence, and provides an API-first architecture ready for future extraction to other offerings.

## Problem Statement

**Current Issues:**
1. **Code Duplication** - Preview API would duplicate emailService.js logic
2. **Path Divergence** - Different code paths for production vs preview emails
3. **False Testing** - Preview wouldn't test actual production email logic
4. **Hard to Extract** - Tightly coupled internal functions not reusable

**Goal:**
Create a unified email engine where **all emails** (production, preview, test, future external) use the **same code path**.

## Architecture Design

### Core Principle: Single Source of Truth

```
                    EmailEngine (Core Logic)
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
   Production          Preview/Test        Future External
   (internal)          (admin API)         (customer API)
```

All three contexts use identical email generation logic, differing only in:
- Authentication method
- Rate limiting rules
- Environment restrictions

### Component Architecture

**1. EmailEngine (NEW)** - Core email logic
```javascript
class EmailEngine {
  // Single source of truth for ALL email sending
  async send(template, recipient, params, context) {
    // 1. Validate template
    // 2. Build parameters (with defaults)
    // 3. Generate HTML from template
    // 4. Send via Resend (or mock)
    // 5. Log result
    // 6. Return metadata
  }

  async preview(template, recipient, params) {
    // Same logic as send(), but returns HTML without sending
  }

  getTemplateMetadata(template) {
    // Returns template info (params, category, etc.)
  }
}
```

**2. Internal Functions (UPDATED)** - Backward compatible
```javascript
// Existing functions kept for backward compatibility
// But now they route through EmailEngine
export async function sendPasswordResetEmail({ to, resetToken }) {
  return emailEngine.send('passwordReset', to, { resetToken }, 'production');
}

export async function sendVerificationEmail({ to, firstName, verificationToken }) {
  return emailEngine.send('emailVerification', to, { firstName, verificationToken }, 'production');
}
// ... all 13 functions
```

**3. API Endpoints (NEW)** - External access
```javascript
// Preview endpoint - uses same EmailEngine
POST /api/admin/emails/preview
→ emailEngine.preview(template, recipient, params)

// Send endpoint - uses same EmailEngine
POST /api/admin/emails/send
→ emailEngine.send(template, recipient, params, 'preview')

// Templates list - uses same EmailEngine
GET /api/admin/emails/templates
→ emailEngine.getAvailableTemplates()
```

## API Design

### Endpoints

```
GET  /api/admin/emails/templates  - List all 13 templates with metadata
POST /api/admin/emails/preview    - Generate HTML (no send) - uses EmailEngine.preview()
POST /api/admin/emails/send       - Send test email - uses EmailEngine.send()
```

### Security Stack (4 layers)

1. **Bearer Token** - `requireAuth` middleware (existing)
2. **Admin Role** - `requireAdmin` middleware (existing)
3. **API Key** - `requireEmailPreviewKey` middleware (NEW)
   - Header: `X-Email-Preview-Key`
   - Env var: `EMAIL_PREVIEW_API_KEY`
4. **Environment Block** - `requireNonProduction` middleware (NEW)
   - Blocks if `NODE_ENV === 'production'`

### Request/Response Format

**Preview request:**
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
  "params": {
    "resetToken": "custom_token_xyz"  // Optional overrides
  }
}
```

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
    "context": "preview",
    "paramsUsed": {
      "userEmail": "test@example.com",
      "resetToken": "custom_token_xyz",
      "expirationMinutes": 60,
      "currentTier": "pro",
      "environment": "development",
      "clientUrl": "http://localhost:5173"
    }
  }
}
```

**Send request/response:** Same format as preview, but actually sends the email.

**Preview all emails:**
```json
POST /api/admin/emails/preview
Body:
{
  "mode": "all",
  "recipient": "marketing@example.com"
}

Response:
{
  "success": true,
  "mode": "all",
  "templates": [
    { "name": "passwordReset", "html": "...", "metadata": {...} },
    { "name": "emailVerification", "html": "...", "metadata": {...} },
    // ... 11 more
  ],
  "count": 13
}
```

## Implementation Plan

### Phase 1: Extract Core Email Engine (Single Source of Truth)

**Goal:** Create shared logic that ALL email paths use.

#### File Structure

```
server/src/services/
├── emailEngine.js              # NEW - Core email engine (single source of truth)
├── emailService.js             # UPDATED - Wrapper functions using emailEngine
├── emailTemplates/
│   ├── index.js                # Existing - Template exports
│   └── *.js                    # Existing - 13 templates
└── emailTestData.js            # NEW - Default test parameters
```

#### 1. Create EmailEngine (`/server/src/services/emailEngine.js`)

**Purpose:** Single source of truth for all email generation and sending.

**Key Methods:**
```javascript
import { Resend } from 'resend';
import * as templates from './emailTemplates/index.js';
import { getDefaultParams, getSubjectLine } from './emailTestData.js';

class EmailEngine {
  constructor() {
    this.templates = {
      passwordReset: templates.passwordResetTemplate,
      emailVerification: templates.emailVerificationTemplate,
      deletionScheduled: templates.deletionScheduledTemplate,
      accountRestored: templates.accountRestoredTemplate,
      finalDeletionWarning: templates.finalDeletionWarningTemplate,
      trialExpiring: templates.trialExpiringReminderTemplate,
      trialExpired: templates.trialExpiredNoticeTemplate,
      trialExtended: templates.trialExtendedTemplate,
      accountSuspended: templates.accountSuspendedTemplate,
      accountUnsuspended: templates.accountUnsuspendedTemplate,
      trialGrantedByAdmin: templates.trialGrantedByAdminTemplate,
      supportRequest: templates.supportRequestTemplate,
      contactSales: templates.contactSalesTemplate
    };
  }

  /**
   * Get list of all available templates
   */
  getAvailableTemplates() {
    return [
      {
        name: 'passwordReset',
        displayName: 'Password Reset',
        category: 'authentication',
        description: 'Password reset with expiring token link'
      },
      {
        name: 'emailVerification',
        displayName: 'Email Verification',
        category: 'authentication',
        description: 'Email confirmation with verification token'
      },
      // ... all 13 templates
    ];
  }

  /**
   * Build final parameters for template
   * Merges defaults with user-provided params
   */
  buildParams(templateName, userParams = {}, useDefaults = true) {
    if (!useDefaults) {
      return userParams;
    }

    const defaults = getDefaultParams(templateName, userParams.userEmail);
    return { ...defaults, ...userParams };
  }

  /**
   * Generate email HTML (preview mode - no sending)
   * This is used by both API preview AND production email generation
   */
  preview(templateName, recipient, userParams = {}, useDefaults = true) {
    const templateFn = this.templates[templateName];
    if (!templateFn) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Build final params (same logic for production and preview)
    const finalParams = this.buildParams(templateName, {
      ...userParams,
      userEmail: recipient
    }, useDefaults);

    // Generate HTML (same logic for production and preview)
    const html = templateFn(finalParams);

    // Get subject and metadata
    const subject = getSubjectLine(templateName);
    const from = process.env.EMAIL_FROM || 'CodeScribe AI <noreply@mail.codescribeai.com>';

    return {
      html,
      metadata: {
        subject,
        from,
        to: recipient,
        environment: finalParams.environment,
        generatedAt: new Date().toISOString(),
        paramsUsed: finalParams
      }
    };
  }

  /**
   * Send email via Resend
   * This is used by both API send AND production email sending
   */
  async send(templateName, recipient, userParams = {}, context = 'production', useDefaults = true) {
    // Generate email using same preview logic
    const { html, metadata } = this.preview(templateName, recipient, userParams, useDefaults);

    // Prepare email data
    const emailData = {
      from: metadata.from,
      to: recipient,
      subject: metadata.subject,
      html
    };

    // Determine if we should mock
    const shouldMock = this.shouldMockEmails();

    if (shouldMock) {
      // Mock send
      console.log(`\n📧 [MOCK EMAIL - ${context.toUpperCase()}]`);
      console.log(`  To: ${emailData.to}`);
      console.log(`  Subject: ${emailData.subject}`);
      console.log(`  Template: ${templateName}`);

      return {
        emailId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        provider: 'mock',
        sentAt: new Date().toISOString(),
        metadata
      };
    } else {
      // Real send via Resend
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send(emailData);

      console.log(`\n📧 [EMAIL SENT - ${context.toUpperCase()}]`);
      console.log(`  To: ${emailData.to}`);
      console.log(`  Subject: ${emailData.subject}`);
      console.log(`  Template: ${templateName}`);
      console.log(`  Email ID: ${result.data?.id}`);

      return {
        emailId: result.data?.id,
        provider: 'resend',
        sentAt: new Date().toISOString(),
        metadata
      };
    }
  }

  /**
   * Preview all templates at once
   */
  previewAll(recipient = 'test@example.com') {
    const templateNames = Object.keys(this.templates);

    return templateNames.map(name => {
      const { html, metadata } = this.preview(name, recipient, {}, true);
      return { name, html, metadata };
    });
  }

  /**
   * Determine if emails should be mocked
   * (same logic as existing emailService.js)
   */
  shouldMockEmails() {
    if (process.env.MOCK_EMAILS === 'true') return true;
    if (process.env.MOCK_EMAILS === 'false') return false;
    return process.env.NODE_ENV !== 'production';
  }
}

// Export singleton instance
export const emailEngine = new EmailEngine();
```

**Size:** ~400 lines

#### 2. Update emailService.js to use EmailEngine

**Purpose:** Keep backward compatibility while routing through shared engine.

```javascript
import { emailEngine } from './emailEngine.js';

/**
 * All existing functions now route through EmailEngine
 * This ensures production emails use EXACT same logic as preview/test
 */

export async function sendPasswordResetEmail({ to, resetToken }) {
  return emailEngine.send('passwordReset', to, { resetToken }, 'production');
}

export async function sendVerificationEmail({
  to,
  firstName,
  verificationToken,
  trialCode,
  subscriptionTier,
  subscriptionBillingPeriod,
  subscriptionTierName
}) {
  return emailEngine.send('emailVerification', to, {
    firstName,
    verificationLink: buildVerificationLink(to, verificationToken, trialCode, subscriptionTier, subscriptionBillingPeriod, subscriptionTierName)
  }, 'production');
}

export async function sendTrialExpiringEmail({ to, userName, daysRemaining, trialTier, expiresAt }) {
  return emailEngine.send('trialExpiring', to, {
    userName,
    daysRemaining,
    trialTier,
    expiresAt
  }, 'production');
}

// ... all 13 functions route through emailEngine.send()

// Helper functions remain (buildVerificationLink, etc.)
function buildVerificationLink(...) { /* ... */ }
```

**Size:** ~300 lines (reduced from ~1000 by removing duplication)

#### 3. Create emailTestData.js

**Purpose:** Default test parameters for all templates (used by EmailEngine).

```javascript
/**
 * Default test parameters for email templates
 * Used by EmailEngine for preview mode and when useDefaults=true
 */

export function getDefaultParams(templateName, recipientEmail) {
  const baseParams = {
    environment: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    currentTier: 'pro'
  };

  const defaults = {
    passwordReset: {
      userEmail: recipientEmail || 'test@example.com',
      resetLink: `${baseParams.clientUrl}/reset-password?token=test_reset_${Date.now()}`,
      expirationMinutes: 60
    },
    emailVerification: {
      userEmail: recipientEmail || 'test@example.com',
      firstName: 'Test User',
      verificationLink: `${baseParams.clientUrl}/verify-email?token=test_verify_${Date.now()}`,
      expirationHours: 24
    },
    trialExpiring: {
      userName: 'Test User',
      daysRemaining: 3,
      trialTier: 'pro',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    // ... all 13 templates
  };

  return {
    ...baseParams,
    ...(defaults[templateName] || {})
  };
}

export function getSubjectLine(templateName) {
  const subjects = {
    passwordReset: 'Reset Your Password - CodeScribe AI',
    emailVerification: 'Verify Your Email - CodeScribe AI',
    trialExpiring: 'Your Pro trial expires in 3 days',
    // ... all 13 templates
  };

  return subjects[templateName] || 'Email from CodeScribe AI';
}

export const TEMPLATE_METADATA = [
  {
    name: 'passwordReset',
    displayName: 'Password Reset',
    category: 'authentication',
    description: 'Password reset with expiring token link',
    requiredParams: ['userEmail', 'resetLink'],
    optionalParams: ['expirationMinutes', 'currentTier']
  },
  // ... all 13 templates
];
```

**Size:** ~250 lines

### Phase 2: Add API Endpoints

**Goal:** Expose EmailEngine via REST API for preview/testing.

#### Update admin.js routes

**Add to `/server/src/routes/admin.js`:**

```javascript
import { emailEngine } from '../services/emailEngine.js';

// Security middleware (NEW)
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

// Route: List templates (NEW)
router.get('/emails/templates',
  requireAuth,
  requireAdmin,
  requireEmailPreviewKey,
  async (req, res) => {
    try {
      const templates = emailEngine.getAvailableTemplates();
      res.json({
        success: true,
        templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error listing templates:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to list templates'
      });
    }
  }
);

// Route: Preview email(s) (NEW)
router.post('/emails/preview',
  requireAuth,
  requireAdmin,
  requireEmailPreviewKey,
  requireNonProduction,
  async (req, res) => {
    try {
      const { template, mode = 'single', recipient, params = {}, useDefaults = true } = req.body;

      // Mode: preview all
      if (mode === 'all') {
        const previews = emailEngine.previewAll(recipient || 'test@example.com');
        return res.json({
          success: true,
          mode: 'all',
          templates: previews,
          count: previews.length,
          generatedAt: new Date().toISOString()
        });
      }

      // Mode: preview single
      if (!template) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Template name required',
          code: 'TEMPLATE_REQUIRED'
        });
      }

      const result = emailEngine.preview(
        template,
        recipient || params.userEmail || 'test@example.com',
        params,
        useDefaults
      );

      res.json({
        success: true,
        template,
        ...result
      });

    } catch (error) {
      console.error('Error previewing email:', error);

      if (error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message,
          code: 'TEMPLATE_NOT_FOUND',
          availableTemplates: emailEngine.getAvailableTemplates().map(t => t.name)
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to preview email'
      });
    }
  }
);

// Route: Send test email (NEW)
router.post('/emails/send',
  requireAuth,
  requireAdmin,
  requireEmailPreviewKey,
  requireNonProduction,
  async (req, res) => {
    try {
      const { template, recipient, params = {}, useDefaults = true } = req.body;

      if (!template) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Template name required',
          code: 'TEMPLATE_REQUIRED'
        });
      }

      if (!recipient) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Recipient email required',
          code: 'RECIPIENT_REQUIRED'
        });
      }

      const result = await emailEngine.send(
        template,
        recipient,
        params,
        'preview',  // Context: preview (not production)
        useDefaults
      );

      res.json({
        success: true,
        template,
        emailId: result.emailId,
        recipient,
        metadata: {
          ...result.metadata,
          sentAt: result.sentAt,
          provider: result.provider
        }
      });

    } catch (error) {
      console.error('Error sending test email:', error);

      if (error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message,
          code: 'TEMPLATE_NOT_FOUND',
          availableTemplates: emailEngine.getAvailableTemplates().map(t => t.name)
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to send email'
      });
    }
  }
);
```

**Size:** ~200 lines added to admin.js

### Phase 3: Environment Setup

#### Add to .env and .env.example

```bash
# Email Preview/Send API Key (Non-Production Only)
# Generate with: openssl rand -base64 32
# Required for /api/admin/emails/* endpoints
EMAIL_PREVIEW_API_KEY=replace-with-generated-secret-min-32-characters
```

## Benefits of This Architecture

### 1. Single Source of Truth ✅
- **Production emails** via `emailService.sendPasswordResetEmail()` → `emailEngine.send()`
- **Preview emails** via `POST /api/admin/emails/preview` → `emailEngine.preview()`
- **Test emails** via `POST /api/admin/emails/send` → `emailEngine.send()`

All three use **identical logic** for template rendering and parameter building.

### 2. True Testing ✅
When you preview an email via API, you're testing the **exact same code** that sends production emails. No divergence possible.

### 3. Future-Ready ✅
Easy to extract EmailEngine for:
- Multi-tenant offerings
- White-label products
- Separate email microservice
- Customer-facing email API

### 4. Maintainability ✅
- One place to fix bugs (EmailEngine)
- One place to add features (EmailEngine)
- One place to update templates (templates/)
- Impossible for paths to diverge

## Testing & Verification

### 1. Verify Production Emails Use Engine

```javascript
// In your app code
await emailService.sendPasswordResetEmail({ to: 'user@example.com', resetToken: 'abc123' });

// Check console logs - should show:
// 📧 [EMAIL SENT - PRODUCTION]
//   To: user@example.com
//   Subject: Reset Your Password - CodeScribe AI
//   Template: passwordReset
```

### 2. Verify Preview Uses Same Engine

```bash
curl -X POST http://localhost:3000/api/admin/emails/preview \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "X-Email-Preview-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "passwordReset",
    "recipient": "user@example.com",
    "params": {
      "resetToken": "abc123"
    }
  }'
```

Compare the returned HTML with what production sends - should be **identical**.

### 3. Verify Preview All Templates

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

Returns all 13 templates rendered with realistic test data.

### 4. Verify Send Test Email

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

Check your inbox - email should match production exactly.

## Files Summary

### New Files
- `/server/src/services/emailEngine.js` (~400 lines) - Core engine, single source of truth
- `/server/src/services/emailTestData.js` (~250 lines) - Default test parameters

### Modified Files
- `/server/src/services/emailService.js` (reduced from ~1000 to ~300 lines) - Now wrapper functions
- `/server/src/routes/admin.js` (add ~200 lines) - API endpoints
- `/server/.env` and `.env.example` (add 1 var) - EMAIL_PREVIEW_API_KEY

### No Changes Needed
- All template files (`emailTemplates/*.js`) - unchanged
- All app code calling `emailService.*()` - unchanged (backward compatible)
- All tests - unchanged (functions work the same)

## Migration Strategy

### Immediate Benefits (Phase 1 only)
Even without the API, extracting to EmailEngine gives you:
- Single source of truth
- Reduced code duplication
- Easier testing and maintenance

### Short Term (Phase 1 + 2)
With API endpoints added:
- Marketing review via Postman
- True testing of production email logic
- Foundation for future extraction

### Long Term (Future)
When ready to extract for other offerings:
- EmailEngine already isolated
- Clear API boundaries
- Customer API keys separate from internal use
- Can move to separate service with minimal changes

## Postman Usage

### Setup

**Environment Variables:**
- `BASE_URL` = `http://localhost:3000`
- `AUTH_TOKEN` = `<your_admin_jwt_token>`
- `EMAIL_PREVIEW_KEY` = `<generated_api_key>`

**Collection Headers:**
- `Authorization: Bearer {{AUTH_TOKEN}}`
- `X-Email-Preview-Key: {{EMAIL_PREVIEW_KEY}}`
- `Content-Type: application/json`

### Example Requests

**List templates:**
```
GET {{BASE_URL}}/api/admin/emails/templates
```

**Preview single email:**
```
POST {{BASE_URL}}/api/admin/emails/preview
Body:
{
  "template": "passwordReset",
  "recipient": "test@example.com",
  "useDefaults": true
}
```

**Preview all emails (for marketing):**
```
POST {{BASE_URL}}/api/admin/emails/preview
Body:
{
  "mode": "all",
  "recipient": "marketing@example.com"
}
```

**Send test email:**
```
POST {{BASE_URL}}/api/admin/emails/send
Body:
{
  "template": "trialExpiring",
  "recipient": "your-email@gmail.com",
  "params": {
    "daysRemaining": 1
  }
}
```

## Key Architectural Decisions

1. **EmailEngine as singleton** - One instance shared across all contexts
2. **Backward-compatible functions** - No app code changes needed
3. **Identical preview/send logic** - Same buildParams(), same template rendering
4. **Context parameter** - 'production', 'preview', 'api' for logging/tracking
5. **useDefaults flag** - Allows custom params while filling in gaps

This architecture ensures you're **always testing what you're shipping**.
