# Email Templates

This directory contains modular, reusable email templates for CodeScribe AI.

## Overview

Email templates are separated into individual modules for easier maintenance and customization. Each template can be swapped out or modified independently without affecting other emails.

## Architecture

### Base Components (`base.js`)

Shared components used across all email templates:

- `baseHTML()` - Wrapper with HTML structure
- `emailHeader()` - Brand header with CodeScribe AI logo (64x64 SVG) and solid purple background
- `emailFooter()` - Footer with links and copyright
- `tierBadge()` - User tier badge (refined light theme, no icons)
- `environmentBadge()` - Environment indicator (dev/staging only, no icons)
- `sectionHeading()` - Section title with left border accent
- `contentBox()` - Light background content wrapper
- `primaryButton()` - Call-to-action button

### Email Templates

| Template | File | Purpose |
|----------|------|---------|
| Password Reset | `passwordReset.js` | Password reset requests |
| Email Verification | `emailVerification.js` | Email verification for new accounts |
| Support Request | `supportRequest.js` | Support form submissions |
| Contact Sales | `contactSales.js` | Sales inquiry form submissions |
| Account Deletion | `accountDeletion.js` | Account deletion scheduled |
| Account Restored | `accountRestored.js` | Account restored from deletion |
| Final Warning | `finalWarning.js` | Final deletion warning (24h before) |

## Usage

### In `emailService.js`:

```javascript
import { supportRequestTemplate } from './emailTemplates/supportRequest.js';

// Build email HTML
const html = supportRequestTemplate({
  userName: 'John Doe',
  userEmail: 'john@example.com',
  userId: '12345',
  currentTier: 'pro',
  contactType: 'bug',
  subjectText: 'Issue with generation',
  message: 'I found a bug...',
  attachments: [],
  requestDateTime: 'Mon, Nov 4, 2024 at 2:30 PM EST',
  contactTypeLabel: 'Bug Report',
  environment: process.env.NODE_ENV,
  clientUrl: process.env.CLIENT_URL
});

// Send via Resend
await resend.emails.send({
  from: FROM_EMAIL,
  to: supportEmail,
  subject: '[PRO] Bug Report: Issue with generation',
  html
});
```

## Customization

### Changing Colors

Edit brand colors in `base.js`:

```javascript
// Primary color (buttons, header)
background: #9333ea;

// Accent color (links, borders)
color: #9333ea;

// Secondary color (if needed)
color: #6366f1;
```

### Modifying Layout

Each template is self-contained. Edit the template file directly:

```javascript
// In supportRequest.js
export function supportRequestTemplate({ ... }) {
  const content = `
    ${emailHeader('Support Request', requestDateTime)}

    <!-- Add your custom sections here -->

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Support Request', content);
}
```

### Creating New Templates

1. Create new file in `emailTemplates/` directory
2. Import base components
3. Export template function
4. Add to `index.js` exports
5. Use in `emailService.js`

Example:

```javascript
// emailTemplates/welcome.js
import { baseHTML, emailHeader, emailFooter, primaryButton } from './base.js';

export function welcomeTemplate({ userName, clientUrl }) {
  const content = `
    ${emailHeader('Welcome to CodeScribe AI!')}

    <div style="background: #ffffff; padding: 40px 30px;">
      <p>Hi ${userName},</p>
      <p>Welcome to CodeScribe AI!</p>

      ${primaryButton('Get Started', clientUrl)}
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Welcome - CodeScribe AI', content);
}
```

## Brand Consistency

All templates use the CodeScribe AI refined light theme design system:

- **Logo**: White curly braces with document lines (64x64 SVG, inline in email header)
- **Colors**: Purple primary (#9333ea), indigo secondary (#6366f1), no gradients
- **Typography**: System font stack (-apple-system, BlinkMacSystemFont, ...)
- **Spacing**: Consistent padding (8px, 16px, 20px, 24px, 32px, 40px)
- **Borders**: Clean 2px slate borders (#e2e8f0), 8px radius for cards, 6px for badges/buttons
- **Badges**: Cyan-50 background (#ecfeff) with cyan-800 text (#155e75), no icons
- **Headers**: Solid purple background (#9333ea), centered logo above title, no gradients

## Testing

Test email rendering across clients:

1. **Local Testing**: Use `MOCK_EMAILS=false` to see full HTML in console
2. **Email Clients**: Test in Gmail, Outlook, Apple Mail
3. **Mobile**: Check responsive behavior on mobile devices
4. **Dark Mode**: Verify readability in dark mode email clients

## Migration Status

- ✅ `base.js` - Base components created
- ✅ `supportRequest.js` - Support request template created
- ✅ `passwordReset.js` - Password reset template created
- ⏳ `emailVerification.js` - TODO
- ⏳ `contactSales.js` - TODO
- ⏳ `accountDeletion.js` - TODO
- ⏳ `accountRestored.js` - TODO
- ⏳ `finalWarning.js` - TODO
- ⏳ `emailService.js` - TODO: Update to use templates

## Next Steps

1. Create remaining template files
2. Update `emailService.js` to import and use templates
3. Test all email types in development
4. Update tests to verify new template structure
5. Document any template-specific customization needs
