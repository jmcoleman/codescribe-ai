# Email Templating Guide

Complete guide to CodeScribe AI's modular email template system.

**Last Updated:** November 5, 2025
**Related Files:** [server/src/services/emailTemplates/](../../server/src/services/emailTemplates/)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Design System](#design-system)
4. [Component Library](#component-library)
5. [Email Templates](#email-templates)
6. [Custom Email Headers](#custom-email-headers)
7. [Creating New Templates](#creating-new-templates)
8. [Modifying Templates](#modifying-templates)
9. [Testing](#testing)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

CodeScribe AI uses a modular, component-based email template system built on shared base components. This approach ensures:

- **Consistency:** All emails use the same brand colors, typography, and spacing
- **Maintainability:** Changes to shared components automatically apply to all emails
- **Testability:** 117 comprehensive tests ensure email quality
- **Flexibility:** Individual templates can be customized without affecting others

### Key Benefits

- **DRY Principle:** Eliminated 500+ lines of duplicate HTML across 8 email types
- **Brand Compliance:** Automatic CodeScribe AI logo and footer in all emails
- **Email Client Compatibility:** Inline SVG logo and table-based layouts for maximum compatibility
- **Development Speed:** New templates take 10-15 minutes vs 1-2 hours with inline HTML

---

## Architecture

### File Structure

```
server/src/services/emailTemplates/
├── base.js                    # Shared components (header, footer, buttons, etc.)
├── index.js                   # Central export point
├── README.md                  # Technical documentation
├── passwordReset.js           # Password reset template
├── emailVerification.js       # Email verification template
├── supportRequest.js          # Support form template
├── contactSales.js            # Sales inquiry template
└── accountDeletion.js         # 3 account deletion templates
```

### Component Hierarchy

```
baseHTML()
└── emailHeader() + content + emailFooter()
    ├── Logo SVG (64x64)
    ├── Title + Subtitle
    ├── Content Area
    │   ├── primaryButton()
    │   ├── contentBox()
    │   ├── sectionHeading()
    │   ├── tierBadge()
    │   └── environmentBadge()
    └── Footer (links, copyright)
```

### Data Flow

```javascript
// 1. Service layer calls template function
import { passwordResetTemplate } from './emailTemplates/passwordReset.js';

const html = passwordResetTemplate({
  userEmail: 'user@example.com',
  resetLink: 'https://app.com/reset?token=abc123',
  expirationMinutes: 60,
  clientUrl: 'https://codescribeai.com'
});

// 2. Template uses base components
import { baseHTML, emailHeader, emailFooter, primaryButton } from './base.js';

export function passwordResetTemplate({ userEmail, resetLink, expirationMinutes, clientUrl }) {
  const content = `
    ${emailHeader('Reset Your Password')}

    <div style="background: #ffffff; padding: 40px 30px;">
      <p>We received a request to reset your password...</p>
      ${primaryButton('Reset Password', resetLink)}
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Reset Your Password - CodeScribe AI', content);
}

// 3. HTML is sent via Resend API
await resend.emails.send({
  from: 'CodeScribe AI <noreply@codescribeai.com>',
  to: userEmail,
  subject: 'Reset Your Password - CodeScribe AI',
  html
});
```

---

## Design System

### Brand Identity

CodeScribe AI uses a **refined light theme** with clean, professional styling:

- **Logo:** White curly braces with document lines (64x64 SVG)
- **Primary Color:** Purple `#9333ea` (buttons, header background, links)
- **Secondary Color:** Indigo `#6366f1` (links, accents)
- **No Gradients:** Solid colors only for better email client compatibility

### Color Palette

```css
/* Brand Colors */
--purple-600: #9333ea;    /* Primary (buttons, header, links) */
--indigo-500: #6366f1;    /* Secondary (links) */

/* Neutral Colors */
--slate-800: #1e293b;     /* Primary text */
--slate-600: #475569;     /* Secondary text */
--slate-500: #64748b;     /* Tertiary text */
--slate-200: #e2e8f0;     /* Borders */
--slate-50: #f8fafc;      /* Background boxes */
--white: #ffffff;         /* Main background */

/* Badge Colors */
--cyan-50: #ecfeff;       /* Badge background */
--cyan-800: #155e75;      /* Badge text */

/* Status Colors */
--green-500: #10b981;     /* Success (border) */
--green-50: #d1fae5;      /* Success (background) */
--green-800: #065f46;     /* Success (text) */

--amber-500: #f59e0b;     /* Warning (border) */
--amber-50: #fef3c7;      /* Warning (background) */
--amber-900: #92400e;     /* Warning (text) */

--red-500: #ef4444;       /* Error/Urgent (border) */
--red-50: #fee2e2;        /* Error/Urgent (background) */
--red-900: #991b1b;       /* Error/Urgent (text) */
```

### Typography

```css
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;

/* Font Sizes */
--title: 28px;           /* Email header title */
--heading: 16px;         /* Section headings */
--body: 16px;            /* Primary body text */
--small: 14px;           /* Secondary text, footer */
--tiny: 12px;            /* Footer links */
--badge: 11px;           /* Tier/environment badges */

/* Font Weights */
--bold: 700;             /* Titles */
--semibold: 600;         /* Headings */
--medium: 500;           /* Badges */
--normal: 400;           /* Body text */
```

### Spacing System

```css
/* Consistent Padding (8px increments) */
--spacing-xs: 8px;       /* Tight spacing */
--spacing-sm: 16px;      /* Small spacing */
--spacing-md: 20px;      /* Medium spacing */
--spacing-lg: 24px;      /* Large spacing */
--spacing-xl: 32px;      /* Extra large spacing */
--spacing-2xl: 40px;     /* Section padding */

/* Border Radius */
--radius-sm: 4px;        /* Small elements */
--radius-md: 6px;        /* Buttons, badges */
--radius-lg: 8px;        /* Cards, boxes */
```

### Layout Rules

1. **Maximum Width:** 600px (centered with `margin: 0 auto`)
2. **Outer Padding:** 20px (body element)
3. **Card Padding:** 40px horizontal, 30px vertical
4. **Section Spacing:** 32px between major sections
5. **Paragraph Spacing:** 24px between paragraphs
6. **Border Style:** 1px solid `#e2e8f0` for dividers

---

## Component Library

### 1. `baseHTML(title, content)`

Wraps email content with HTML structure.

**Parameters:**
- `title` (string) - Email title for `<title>` tag
- `content` (string) - Email body HTML

**Example:**
```javascript
return baseHTML('Welcome - CodeScribe AI', content);
```

**Output:**
```html
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome - CodeScribe AI</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- content here -->
  </body>
</html>
```

---

### 2. `emailHeader(title, subtitle = '')`

Creates branded header with logo and title.

**Parameters:**
- `title` (string) - Main heading text
- `subtitle` (string, optional) - Subtitle text below title

**Example:**
```javascript
emailHeader('Reset Your Password')
emailHeader('Support Request', 'Mon, Nov 4, 2024 at 2:30 PM EST')
```

**Features:**
- 64x64 CodeScribe AI logo (inline SVG)
- Solid purple background (`#9333ea`)
- White text on purple
- Centered layout
- 8px margin between title and subtitle

**Visual Hierarchy:**
```
┌──────────────────────────────┐
│      [Logo SVG 64x64]        │
│                              │
│   Reset Your Password        │  ← title (28px, bold)
│   Mon, Nov 4, 2024...        │  ← subtitle (14px, 90% opacity)
└──────────────────────────────┘
```

---

### 3. `emailFooter(clientUrl)`

Standard footer with links and copyright.

**Parameters:**
- `clientUrl` (string) - Base URL for the application

**Example:**
```javascript
emailFooter('https://codescribeai.com')
```

**Output:**
```
─────────────────────────────────
© 2025 CodeScribe AI. All rights reserved.
Visit CodeScribe AI | Privacy Policy | Terms of Service
```

**Features:**
- Automatic current year in copyright
- Purple links (`#9333ea`)
- No underlines on hover
- Slate gray text (`#64748b`)

---

### 4. `primaryButton(text, url)`

Call-to-action button with purple background.

**Parameters:**
- `text` (string) - Button label
- `url` (string) - Button destination URL

**Example:**
```javascript
primaryButton('Reset Password', 'https://app.com/reset?token=abc123')
```

**Styling:**
- Background: `#9333ea` (purple)
- Text: white
- Padding: 12px vertical, 30px horizontal
- Border radius: 6px
- Font weight: 600 (semibold)
- Font size: 16px

**Usage Pattern:**
```javascript
<div style="text-align: center; margin: 32px 0;">
  ${primaryButton('Verify Email', verificationLink)}
</div>
```

---

### 5. `contentBox(content)`

Light gray background box for content grouping.

**Parameters:**
- `content` (string) - HTML content to wrap

**Example:**
```javascript
contentBox(`
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Name:</td>
      <td style="padding: 8px 0; color: #1e293b;">John Doe</td>
    </tr>
  </table>
`)
```

**Styling:**
- Background: `#f8fafc` (slate-50)
- Padding: 20px
- Border radius: 8px

---

### 6. `sectionHeading(title)`

Section heading with left purple border accent.

**Parameters:**
- `title` (string) - Section title text

**Example:**
```javascript
sectionHeading('Request Details')
```

**Output:**
```
┃ Request Details
```

**Styling:**
- Left border: 4px solid `#9333ea`
- Padding left: 12px
- Color: `#475569` (slate-600)
- Font size: 16px
- Font weight: 600 (semibold)

---

### 7. `tierBadge(tier)`

User tier badge (no icons, refined light theme).

**Parameters:**
- `tier` (string) - User tier: `'free'`, `'starter'`, `'pro'`, `'team'`, or `'enterprise'`

**Example:**
```javascript
tierBadge('pro')        // "Tier: PRO"
tierBadge('enterprise') // "Tier: PRIORITY"
tierBadge('free')       // "Tier: FREE"
```

**Badge Mappings:**
- `enterprise` → **Tier: PRIORITY**
- `team` → **Tier: PRIORITY**
- `pro` → **Tier: PRO**
- `starter` → **Tier: STARTER**
- `free` → **Tier: FREE**

**Styling:**
- Background: `#ecfeff` (cyan-50)
- Text: `#155e75` (cyan-800)
- Padding: 4px horizontal, 8px vertical
- Border radius: 6px
- Font size: 11px
- Font weight: 500 (medium)
- Text transform: uppercase

---

### 8. `environmentBadge(env)`

Environment indicator (only shown in dev/staging).

**Parameters:**
- `env` (string) - Environment name from `process.env.NODE_ENV`

**Example:**
```javascript
environmentBadge('development') // Shows "DEV" badge
environmentBadge('staging')     // Shows "STAGING" badge
environmentBadge('production')  // Returns empty string (no badge)
```

**Styling:**
- Same as `tierBadge()` styling
- Only displayed in non-production environments

---

## Email Templates

### Current Templates (8 Total)

| Template | File | Purpose | Triggers |
|----------|------|---------|----------|
| Password Reset | `passwordReset.js` | Password reset requests | User clicks "Forgot Password" |
| Email Verification | `emailVerification.js` | New account email verification | User signs up with email/password |
| Support Request | `supportRequest.js` | Support form submissions | User submits support request |
| Contact Sales | `contactSales.js` | Sales inquiry submissions | User requests enterprise info |
| Deletion Scheduled | `accountDeletion.js` | Account scheduled for deletion | User requests account deletion |
| Account Restored | `accountDeletion.js` | Account restored from deletion | User restores scheduled account |
| Final Warning | `accountDeletion.js` | 24-hour deletion warning | 24 hours before permanent deletion |
| (Future) Welcome | TBD | Welcome new users | User completes signup |

### Template Anatomy

Every template follows this structure:

```javascript
/**
 * Template Name
 *
 * Brief description of when/why this email is sent
 */

import {
  baseHTML,
  emailHeader,
  emailFooter,
  primaryButton,
  // ... other components as needed
} from './base.js';

/**
 * Generate [template name] email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userName - User's full name
 * @param {string} params.actionLink - Link for user action
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function templateNameTemplate({
  userEmail,
  userName,
  actionLink,
  clientUrl
}) {
  const content = `
    ${emailHeader('Email Title', 'Optional Subtitle')}

    <div style="background: #ffffff; padding: 40px 30px;">
      <!-- Email body content -->
      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName || 'there'},
      </p>

      <p style="color: #475569; margin: 0 0 24px 0;">
        Main email message goes here...
      </p>

      <!-- Call-to-action button -->
      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Action Button', actionLink)}
      </div>

      <!-- Fallback link -->
      <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #6366f1; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
        ${actionLink}
      </p>

      <!-- Additional info/warnings -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Additional information or disclaimers...
        </p>
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Email Title - CodeScribe AI', content);
}
```

---

## Custom Email Headers

### Overview

CodeScribe AI includes custom email headers for **support and sales emails** to enable priority-based sorting, SLA tracking, and automation. These headers complement the HTML template content and provide metadata for email filtering and organization.

### Headers Included

#### Standard Priority Headers (All Support/Sales Emails)

```javascript
headers: {
  'X-Priority': '1',                    // RFC 2076 - 1=urgent, 5=low
  'X-MSMail-Priority': 'High',          // Outlook compatibility
  'Importance': 'high'                  // General email client compatibility
}
```

**Email Client Benefits:**
- ✅ **Outlook**: Shows "!" icon for urgent emails
- ✅ **Gmail**: Natural sorting by importance
- ✅ **Apple Mail**: Priority indicators in inbox
- ✅ **Mobile apps**: Push notification priority

#### Custom Metadata Headers (Support/Sales Only)

```javascript
headers: {
  'X-CodeScribe-Tier': 'ENTERPRISE',    // User's subscription tier
  'X-CodeScribe-SLA': '4 hours'         // Expected response time
}
```

**Use Cases:**
- 📊 **Email filtering**: Advanced email clients (Outlook, Apple Mail) can filter by custom headers
- 🤖 **Automation**: Zapier, Make.com, and custom scripts can read headers
- 🐛 **Debugging**: View "Show original" to verify tier/SLA was sent correctly
- 📈 **Analytics**: Track support volume by tier programmatically

### Email Types & Headers

| Email Type | Standard Priority | Custom Metadata | Rationale |
|------------|-------------------|-----------------|-----------|
| Support Request | ✅ Yes | ✅ Yes | Priority sorting by tier |
| Contact Sales | ✅ Yes | ✅ Yes | Priority sorting by interest tier |
| Password Reset | ❌ No | ❌ No | Transactional, no priority needed |
| Email Verification | ❌ No | ❌ No | Transactional, no priority needed |
| Account Deletion | ❌ No | ❌ No | Transactional, no priority needed |

### Priority Mapping

Support and sales emails use tier-based priority mapping:

| Tier | Priority (1-5) | X-MSMail-Priority | Importance | SLA |
|------|----------------|-------------------|------------|-----|
| Enterprise | 1 (Urgent) | High | high | 4 hours |
| Team | 1 (Urgent) | High | high | 4 hours |
| Pro | 2 (High) | High | high | 24 hours |
| Starter | 3 (Normal) | Normal | normal | 48 hours |
| Free | 5 (Low) | Normal | normal | 5 days |

### Implementation

Headers are set in `emailService.js` when sending support/sales emails:

```javascript
// Example: sendSupportEmail()
const priority = getPriorityFromTier(currentTier); // 1-5
const sla = getSLAFromTier(currentTier);          // "4 hours", "24 hours", etc.

await resend.emails.send({
  from: process.env.EMAIL_FROM,
  to: process.env.SUPPORT_EMAIL,
  replyTo: userEmail,
  subject: `${subjectLabel} from ${userName || userEmail}`,
  html: supportRequestTemplate({ ... }),
  headers: {
    // Standard priority headers
    'X-Priority': String(priority),
    'X-MSMail-Priority': priority === 1 ? 'High' : priority === 2 ? 'High' : 'Normal',
    'Importance': priority === 1 ? 'high' : priority === 2 ? 'high' : 'normal',

    // Custom metadata headers
    'X-CodeScribe-Tier': tier.toUpperCase(),
    'X-CodeScribe-SLA': sla
  }
});
```

### Gmail Filtering (Body Content)

**Important:** Gmail's filter UI does **not** support custom X-headers. Instead, Gmail filters use the tier badge that appears in the email body:

```html
<strong>Tier:</strong> FREE
```

**Gmail filter syntax:**
```
from:(noreply@mail.codescribeai.com) Tier:FREE
```

See [EMAIL-PRIORITY-FILTERING.md](../../docs/support/EMAIL-PRIORITY-FILTERING.md) for complete Gmail filter setup.

### Other Email Clients

#### Outlook Rules

Outlook **does** support custom header filtering:

1. **Create Rule → Advanced Options**
2. **Condition:** Message header contains specific words
   - Header: `X-CodeScribe-Tier`
   - Words: `ENTERPRISE` or `TEAM`
3. **Action:** Move to folder, mark as high importance

#### Apple Mail (AppleScript)

Apple Mail can read custom headers via AppleScript:

```applescript
if messageSource contains "X-CodeScribe-Tier: ENTERPRISE" then
  set mailbox of eachMessage to mailbox "Support/Urgent-4hr"
  set flag index of eachMessage to 2 -- Orange flag
end if
```

### Adding Headers to New Templates

When creating a new support/sales email template:

1. **Determine if priority matters** - Transactional emails (password reset, verification) don't need priority headers
2. **Get tier from parameters** - Pass `currentTier` to email service function
3. **Calculate priority** - Use `getPriorityFromTier()` helper
4. **Include headers** - Add standard + custom headers to `resend.emails.send()`

**Example:**
```javascript
// In emailService.js
export async function sendNewSupportEmail({ userEmail, currentTier, ... }) {
  const tier = currentTier || 'free';
  const priority = getPriorityFromTier(tier);
  const sla = getSLAFromTier(tier);

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: process.env.SUPPORT_EMAIL,
    subject: `Support Request from ${userEmail}`,
    html: newSupportTemplate({ tier, ... }),
    headers: {
      'X-Priority': String(priority),
      'X-MSMail-Priority': priority <= 2 ? 'High' : 'Normal',
      'Importance': priority <= 2 ? 'high' : 'normal',
      'X-CodeScribe-Tier': tier.toUpperCase(),
      'X-CodeScribe-SLA': sla
    }
  });
}
```

### Testing Headers

#### View Headers in Gmail

1. Open email
2. Click "⋮" (More) → "Show original"
3. Look for headers:
   ```
   X-Priority: 1
   X-MSMail-Priority: High
   Importance: high
   X-CodeScribe-Tier: ENTERPRISE
   X-CodeScribe-SLA: 4 hours
   ```

#### Test with Unit Tests

```javascript
it('should include priority headers for enterprise tier', async () => {
  await sendSupportEmail({
    currentTier: 'enterprise',
    userEmail: 'user@example.com',
    contactType: 'bug',
    message: 'Test'
  });

  expect(mockSendEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-CodeScribe-Tier': 'ENTERPRISE',
        'X-CodeScribe-SLA': '4 hours'
      })
    })
  );
});
```

### Best Practices

1. ✅ **Always include tier badge in email body** - Gmail filtering requires it
2. ✅ **Send both standard + custom headers** - Maximizes compatibility
3. ✅ **Use uppercase for tier values** - Consistent with `X-CodeScribe-Tier: ENTERPRISE`
4. ✅ **Test headers in "Show original"** - Verify headers are sent correctly
5. ❌ **Don't rely on custom headers alone** - Gmail UI can't filter on them
6. ❌ **Don't add priority to transactional emails** - Verification/password reset are always urgent

### Related Documentation

- [EMAIL-PRIORITY-FILTERING.md](../../docs/support/EMAIL-PRIORITY-FILTERING.md) - Gmail filter setup guide
- [emailService.js](../../server/src/services/emailService.js) - Header implementation
- [supportRequest.js](../../server/src/services/emailTemplates/supportRequest.js) - Tier badge in email body

---

## Creating New Templates

### Step 1: Create Template File

Create a new file in `server/src/services/emailTemplates/`:

```bash
touch server/src/services/emailTemplates/welcome.js
```

### Step 2: Write Template Function

```javascript
/**
 * Welcome Email Template
 *
 * Sent to new users after completing signup
 */

import {
  baseHTML,
  emailHeader,
  emailFooter,
  primaryButton
} from './base.js';

/**
 * Generate welcome email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's full name
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function welcomeTemplate({ userName, clientUrl }) {
  const content = `
    ${emailHeader('Welcome to CodeScribe AI!')}

    <div style="background: #ffffff; padding: 40px 30px;">
      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>

      <p style="color: #475569; margin: 0 0 24px 0;">
        Welcome to CodeScribe AI! We're excited to have you on board.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Get Started', clientUrl)}
      </div>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Need help? Contact us at <a href="mailto:support@codescribeai.com" style="color: #6366f1; text-decoration: none;">support@codescribeai.com</a>
        </p>
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Welcome - CodeScribe AI', content);
}
```

### Step 3: Export Template

Add to `server/src/services/emailTemplates/index.js`:

```javascript
export { welcomeTemplate } from './welcome.js';
```

### Step 4: Use in Email Service

In `server/src/services/emailService.js`:

```javascript
import { welcomeTemplate } from './emailTemplates/welcome.js';

export async function sendWelcomeEmail({ to, userName }) {
  const emailData = {
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to CodeScribe AI!',
    html: welcomeTemplate({
      userName,
      clientUrl: CLIENT_URL
    })
  };

  // Mock in dev/test, send real emails in production
  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  try {
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('[Resend Error]', error);
      throw error;
    }

    console.log(`📧 [EMAIL SENT] Welcome Email`);
    console.log(`   To: ${to}`);
    console.log(`   Email ID: ${data.id}`);

    return data;
  } catch (error) {
    throw new Error('Failed to send welcome email');
  }
}
```

### Step 5: Write Tests

In `server/src/services/__tests__/emailService.test.js`:

```javascript
describe('sendWelcomeEmail', () => {
  const validEmail = 'user@example.com';
  const validName = 'John Doe';

  beforeEach(() => {
    mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
  });

  it('should send email with correct recipient', async () => {
    await emailService.sendWelcomeEmail({
      to: validEmail,
      userName: validName
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: validEmail
      })
    );
  });

  it('should include correct subject line', async () => {
    await emailService.sendWelcomeEmail({
      to: validEmail,
      userName: validName
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Welcome to CodeScribe AI!'
      })
    );
  });

  it('should display user name in greeting', async () => {
    await emailService.sendWelcomeEmail({
      to: validEmail,
      userName: validName
    });

    const callArgs = mockSendEmail.mock.calls[0][0];
    expect(callArgs.html).toContain(`Hi ${validName}`);
  });

  it('should include Get Started button', async () => {
    await emailService.sendWelcomeEmail({
      to: validEmail,
      userName: validName
    });

    const callArgs = mockSendEmail.mock.calls[0][0];
    expect(callArgs.html).toContain('Get Started');
    expect(callArgs.html).toContain(process.env.CLIENT_URL);
  });

  it('should throw error when email sending fails', async () => {
    mockSendEmail.mockRejectedValue(new Error('Network error'));

    await expect(
      emailService.sendWelcomeEmail({
        to: validEmail,
        userName: validName
      })
    ).rejects.toThrow('Failed to send welcome email');
  });
});
```

### Step 6: Test Locally

```bash
# Run tests
npm test emailService

# Check output in console (when MOCK_EMAILS=true)
# Full HTML will be logged for verification
```

---

## Modifying Templates

### Changing Brand Colors

Edit `server/src/services/emailTemplates/base.js`:

```javascript
// Old: Purple header
<div style="background: #9333ea; padding: 40px 20px; text-align: center;">

// New: Blue header
<div style="background: #3b82f6; padding: 40px 20px; text-align: center;">
```

**Files to update:**
- `base.js` - Header background, button background, link colors
- Update color palette documentation in this guide
- Update brand color palette HTML preview (`docs/design/theming/brand-color-palette.html`)

### Changing Logo

Edit `emailHeader()` in `base.js`:

```javascript
export function emailHeader(title, subtitle = '') {
  // Replace logoSvg with new SVG code
  const logoSvg = `<svg width="64" height="64" viewBox="0 0 512 512">
    <!-- New logo SVG paths -->
  </svg>`;

  // ... rest of function
}
```

**Requirements:**
- 64x64px display size (viewBox can be larger)
- Inline SVG (no external files)
- White fill color for visibility on purple background
- Minimize SVG size for email client compatibility

### Changing Typography

Edit `baseHTML()` in `base.js`:

```javascript
// Old: System font stack
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

// New: Custom font (use web-safe fonts only!)
font-family: Georgia, 'Times New Roman', serif;
```

**⚠️ Warning:** Only use web-safe fonts. Custom fonts via `@import` or `<link>` are blocked by many email clients.

### Modifying Individual Templates

Templates are self-contained - edit directly without affecting others:

```javascript
// In passwordReset.js

// Old: Generic warning
<p style="color: #64748b; font-size: 14px;">
  This link will expire in ${expirationMinutes} minutes.
</p>

// New: More urgent warning
<div style="margin: 24px 0; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
  <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0;">
    ⚠️ This link expires in ${expirationMinutes} minutes
  </p>
</div>
```

---

## Testing

### Test Coverage

**Current:** 117 email service tests (100% pass rate)

**Breakdown by Template:**
- Password Reset: 9 tests
- Email Verification: 8 tests
- Support Request: 28 tests
- Contact Sales: 18 tests
- Deletion Scheduled: 13 tests
- Account Restored: 12 tests
- Final Deletion Warning: 12 tests
- General Email Service: 17 tests

### Running Tests

```bash
# Run all email service tests
npm test emailService

# Run specific test suite
npm test -- --testNamePattern="sendPasswordResetEmail"

# Run with coverage
npm test -- --coverage emailService
```

### Test Structure

Each template should test:

1. **Recipient:** Correct email address
2. **Subject:** Correct subject line
3. **From Address:** CodeScribe AI sender
4. **Content:** Key text/links present
5. **Personalization:** User name/email displayed
6. **CTAs:** Buttons/links included
7. **Error Handling:** Throws on failure

### Example Test Pattern

```javascript
describe('sendWelcomeEmail', () => {
  const validEmail = 'user@example.com';
  const validName = 'John Doe';

  beforeEach(() => {
    mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
  });

  // ✅ Test 1: Correct recipient
  it('should send email with correct recipient', async () => {
    await emailService.sendWelcomeEmail({ to: validEmail, userName: validName });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: validEmail })
    );
  });

  // ✅ Test 2: Correct subject
  it('should include correct subject line', async () => {
    await emailService.sendWelcomeEmail({ to: validEmail, userName: validName });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Welcome to CodeScribe AI!' })
    );
  });

  // ✅ Test 3: Personalization
  it('should display user name in greeting', async () => {
    await emailService.sendWelcomeEmail({ to: validEmail, userName: validName });

    const callArgs = mockSendEmail.mock.calls[0][0];
    expect(callArgs.html).toContain(`Hi ${validName}`);
  });

  // ✅ Test 4: CTA present
  it('should include Get Started button', async () => {
    await emailService.sendWelcomeEmail({ to: validEmail, userName: validName });

    const callArgs = mockSendEmail.mock.calls[0][0];
    expect(callArgs.html).toContain('Get Started');
  });

  // ✅ Test 5: Error handling
  it('should throw error when email sending fails', async () => {
    mockSendEmail.mockRejectedValue(new Error('Network error'));

    await expect(
      emailService.sendWelcomeEmail({ to: validEmail, userName: validName })
    ).rejects.toThrow('Failed to send welcome email');
  });
});
```

### Local Testing Tips

**View full HTML output:**

```javascript
// In emailService.js mockEmailSend()
console.log('\n📧 ========== EMAIL PREVIEW ==========');
console.log(emailData.html);
console.log('====================================\n');
```

**Save to file for browser preview:**

```javascript
import fs from 'fs';

// In test or development
fs.writeFileSync('/tmp/email-preview.html', html);
console.log('Email saved to /tmp/email-preview.html');
```

**Test in email clients:**
1. Set `MOCK_EMAILS=false` in `.env`
2. Set up Resend test domain
3. Send to your email address
4. Check rendering in Gmail, Outlook, Apple Mail

---

## Best Practices

### 1. Always Use Base Components

**❌ Bad:**
```javascript
// Inline HTML - hard to maintain
const html = `
  <div style="background: #9333ea; padding: 40px;">
    <h1 style="color: white;">Password Reset</h1>
  </div>
`;
```

**✅ Good:**
```javascript
// Use base component - automatic brand consistency
const content = `
  ${emailHeader('Password Reset')}
  <!-- rest of template -->
`;
```

### 2. Provide Fallback Links

Always include a text link below buttons:

```javascript
<div style="text-align: center; margin: 32px 0;">
  ${primaryButton('Verify Email', verificationLink)}
</div>

<p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
  If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="color: #6366f1; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
  ${verificationLink}
</p>
```

### 3. Use Inline Styles Only

**❌ Bad:**
```html
<style>
  .button { background: #9333ea; }
</style>
<a class="button" href="...">Click Here</a>
```

**✅ Good:**
```html
<a href="..." style="background: #9333ea; padding: 12px 30px;">Click Here</a>
```

**Why:** Many email clients strip `<style>` tags and external stylesheets.

### 4. Test Across Email Clients

Minimum test matrix:
- **Gmail** (web, iOS app, Android app)
- **Outlook** (Windows desktop, web)
- **Apple Mail** (macOS, iOS)

Use [Litmus](https://litmus.com) or [Email on Acid](https://www.emailonacid.com) for comprehensive testing.

### 5. Keep Templates Simple

- Maximum width: 600px
- Single-column layout (no complex grids)
- Table-based layouts for compatibility
- Minimal use of positioned elements

### 6. Handle Missing Data Gracefully

```javascript
// Use fallbacks for optional data
<p>Hi ${userName || userEmail.split('@')[0] || 'there'},</p>

// Conditionally show sections
${tier ? tierBadge(tier) : ''}

${attachments && attachments.length > 0 ? `
  <div>Attachments: ${attachments.length}</div>
` : ''}
```

### 7. Use Semantic HTML

```javascript
// ✅ Good: Semantic structure
<p style="...">Paragraph text</p>
<h3 style="...">Heading text</h3>
<ul style="...">
  <li>List item</li>
</ul>

// ❌ Bad: Div soup
<div style="...">Paragraph text</div>
<div style="font-weight: bold;">Heading text</div>
<div>• List item</div>
```

### 8. Optimize for Mobile

- Font sizes ≥14px for body text
- Button padding ≥12px vertical, ≥30px horizontal (easy to tap)
- Avoid tiny links (minimum 44x44px touch target)
- Test on actual mobile devices

### 9. Accessibility

- Use semantic HTML (`<p>`, `<h1>`, `<table>`, etc.)
- Provide `alt` text for images (if adding any)
- Sufficient color contrast (WCAG AA: 4.5:1 for body text)
- Logical reading order
- Meaningful link text (not "click here")

### 10. Performance

- Inline SVG for logos (no external images when possible)
- Minimize HTML size (<100KB ideal)
- Avoid unnecessary nested tables
- Test load time on slow connections

---

## Troubleshooting

### Issue: Email Not Rendering Correctly

**Symptoms:** Layout broken, styles missing, images not loading

**Solutions:**
1. **Check inline styles:** All styles must be inline (`style="..."`)
2. **Remove `<style>` tags:** Move CSS to inline styles
3. **Test SVG compatibility:** Some clients don't support SVG (provide PNG fallback)
4. **Validate HTML:** Use [W3C Validator](https://validator.w3.org/)
5. **Check email client:** Test in Gmail, Outlook, Apple Mail

### Issue: Tests Failing After Template Changes

**Symptoms:** Tests expect old text/structure

**Solutions:**
1. **Update test expectations:** Change `expect().toContain('old text')` to match new content
2. **Run tests locally:** `npm test emailService`
3. **Check test output:** Read error messages carefully
4. **Review template changes:** Ensure new content is correct

**Example fix:**
```javascript
// Old test (fails after template update)
expect(callArgs.html).toContain('1 hour');

// New test (matches new template)
expect(callArgs.html).toContain('60 minutes');
```

### Issue: Mock Emails Not Working

**Symptoms:** Real emails sent in development/test

**Solutions:**
1. **Check environment:** Ensure `NODE_ENV !== 'production'`
2. **Verify mock function:** `shouldMockEmails()` should return `true`
3. **Check env var:** `MOCK_EMAILS` should not be explicitly set to `'false'`
4. **Review logs:** Look for "📧 [MOCK EMAIL]" vs "📧 [EMAIL SENT]"

### Issue: Logo Not Displaying

**Symptoms:** Logo missing or broken in emails

**Solutions:**
1. **Check SVG syntax:** Validate SVG code in `base.js`
2. **Test in multiple clients:** Some clients block SVG (provide PNG fallback)
3. **Verify logo size:** Should be 64x64px display size
4. **Check white fill:** Logo should be white for purple background

**Fallback pattern:**
```javascript
// Option 1: Conditional rendering
const logoSvg = clientSupportssSVG ? `<svg>...</svg>` : `<img src="logo.png" width="64" height="64" alt="CodeScribe AI">`;

// Option 2: Hosted image (requires external hosting)
const logo = `<img src="https://codescribeai.com/logo.png" width="64" height="64" alt="CodeScribe AI">`;
```

### Issue: Links Not Working

**Symptoms:** Links don't navigate, buttons unclickable

**Solutions:**
1. **Check `href` attribute:** Ensure URL is complete and valid
2. **Test URL encoding:** Encode query parameters (`?token=abc123`)
3. **Verify link color:** Links should be visually distinct
4. **Test on mobile:** Touch targets should be ≥44x44px

### Issue: Slow Email Rendering

**Symptoms:** Long load times, spinning indicators

**Solutions:**
1. **Reduce HTML size:** Remove unnecessary whitespace/comments
2. **Optimize inline SVG:** Minimize SVG code
3. **Avoid external resources:** No external CSS/fonts/images
4. **Test file size:** Aim for <100KB total

---

## Changelog

### November 5, 2025
- ✅ Added Custom Email Headers section
- ✅ Documented standard priority headers (X-Priority, X-MSMail-Priority, Importance)
- ✅ Documented custom metadata headers (X-CodeScribe-Tier, X-CodeScribe-SLA)
- ✅ Added priority mapping table (Enterprise to Free tiers)
- ✅ Included Gmail filtering limitations and workarounds
- ✅ Added Outlook and Apple Mail filtering examples
- ✅ Documented when to use headers (support/sales vs transactional emails)
- ✅ Added testing examples for headers in unit tests
- ✅ Created comprehensive email templating guide
- ✅ Documented all 8 base components with examples
- ✅ Added design system reference (colors, typography, spacing)
- ✅ Included step-by-step guide for creating new templates
- ✅ Documented testing patterns and best practices
- ✅ Added troubleshooting section

### November 4, 2025
- ✅ Added CodeScribe AI logo to email header (64x64 SVG)
- ✅ Converted 5 email functions to use templates
- ✅ Fixed 13 failing tests for template migration
- ✅ Updated emailTemplates/README.md with logo documentation

### October 28, 2025
- ✅ Created modular email template system
- ✅ Implemented 8 base components in `base.js`
- ✅ Created 5 email templates (password reset, verification, support, sales, deletion)
- ✅ Achieved 117/117 tests passing (100% pass rate)
- ✅ Documented template architecture in emailTemplates/README.md

---

## Related Documentation

- [Email Templates README](../../server/src/services/emailTemplates/README.md) - Technical implementation details
- [Email Priority Filtering](../support/EMAIL-PRIORITY-FILTERING.md) - Gmail filter setup for support emails
- [Email Rate Limiting](../security/EMAIL-RATE-LIMITING.md) - Rate limit rules and testing
- [Error Handling Patterns](../architecture/ERROR-HANDLING-PATTERNS.md) - Email error handling
- [Brand Color Palette](../design/theming/brand-color-palette.html) - Visual color reference
- [Theme Design Summary](../design/theming/THEME-DESIGN-SUMMARY.md) - Overall design system

---

**Questions or Issues?**

- Check [server/src/services/emailTemplates/README.md](../../server/src/services/emailTemplates/README.md) for quick reference
- Review test output: `npm test emailService`
- Contact: support@codescribeai.com
