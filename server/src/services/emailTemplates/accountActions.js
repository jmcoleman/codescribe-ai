/**
 * Account Action Email Templates
 *
 * Production-grade templates with table-based layout for maximum email client compatibility
 * Templates for admin-initiated account actions:
 * - Account suspended
 * - Account unsuspended/restored
 * - Trial granted by admin
 */

/**
 * Format date for display in emails
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Generate account suspended email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's name or email
 * @param {string} params.reason - Reason for suspension
 * @param {Date|string|null} params.suspendedUntil - Date when account will be deleted (null for indefinite suspension)
 * @param {string} params.environment - Current environment
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function accountSuspendedTemplate({
  userName,
  reason,
  suspendedUntil,
  environment,
  clientUrl
}) {
  const hasDeleteDate = suspendedUntil !== null && suspendedUntil !== undefined;
  const deletionDate = hasDeleteDate ? formatDate(suspendedUntil) : null;
  const isNonProd = environment !== 'production';
  const currentYear = new Date().getFullYear();

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Account Suspended</title>

    <style>
      @media (prefers-color-scheme: dark) {
        .bg-body { background: #0b0b0f !important; }
        .card { background: #141420 !important; border-color: #2a2a3a !important; }
        .text { color: #e7e7ef !important; }
        .muted { color: #b5b5c7 !important; }
        .divider { border-color: #2a2a3a !important; }
        .link { color: #c8b6ff !important; }
        .btn { background: #7c3aed !important; }
        .warning-box { background: #2a1f0d !important; border-color: #f59e0b !important; }
        .info-box { background: #1a1a28 !important; border-color: #2a2a3a !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Your account has been suspended.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#7c3aed; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  Account Suspended
                </div>
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; color:#e9d5ff; margin:6px 0 0 0;">
                  Your account has been suspended
                </div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e7e9f2; border-top:none; border-radius:0 0 14px 14px; padding:32px 24px;">
                ${isNonProd ? `<div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 28px 0;">
                  ${environment.charAt(0).toUpperCase() + environment.slice(1)} environment · Non-production email
                </div>` : ''}

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:24px; color:#111827; margin:0 0 14px 0;">
                  Hi ${userName},
                </div>

                <div class="warning-box" style="background:#fffbeb; border-left:3px solid #f59e0b; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#f59e0b; margin:0 0 8px 0;">
                    Account Suspended
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; margin:0;">
                    Your account has been suspended${hasDeleteDate ? ` and is scheduled for deletion on <strong>${deletionDate}</strong>` : ''}.
                  </div>
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#111827; margin:0 0 12px 0;">
                  Reason for Suspension
                </div>

                <div class="info-box" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px 14px; margin:0 0 18px 0;">
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; white-space:pre-wrap; margin:0;">
                    ${reason}
                  </div>
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 12px 0;">
                  During the suspension period:
                </div>

                <ul style="margin:0 0 18px 0; padding-left:20px; color:#6b7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:22px;">
                  <li style="margin-bottom:6px;">You cannot log in to your account</li>
                  <li style="margin-bottom:6px;">All services are temporarily unavailable</li>
                  <li>Your data ${hasDeleteDate ? 'will be retained until the deletion date' : 'is preserved and will not be deleted'}</li>
                </ul>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#111827; margin:0 0 12px 0;">
                  Need Help?
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 18px 0;">
                  If you believe this suspension was made in error or would like to discuss this decision, please contact our support team.
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 18px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${clientUrl}/settings" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Contact Support
                      </a>
                    </td>
                  </tr>
                </table>

                ${hasDeleteDate ? `<div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:22px 0 0 0; padding-top:18px; border-top:1px solid #e5e7eb;">
                  <strong>Important:</strong> If your account remains suspended until ${deletionDate}, all your data will be permanently deleted and cannot be recovered.
                </div>` : ''}

                <div class="divider" style="border-top:1px solid #e5e7eb; margin:18px 0 16px 0;"></div>

                <div style="text-align:center;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:700; color:#111827; margin:0 0 6px 0;">
                    CodeScribe AI
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 10px 0;">
                    Secure documentation automation for engineering teams
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280;">
                    <a class="link" href="mailto:support@codescribeai.com" style="color:#4f46e5; text-decoration:underline;">Support</a>
                    <span style="padding:0 6px;">·</span>
                    <a class="link" href="${clientUrl}/privacy" style="color:#4f46e5; text-decoration:underline;">Privacy</a>
                    <span style="padding:0 6px;">·</span>
                    <a class="link" href="${clientUrl}/terms" style="color:#4f46e5; text-decoration:underline;">Terms</a>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 0 0 0; text-align:center;">
                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; line-height:16px; color:#9ca3af;">
                  © ${currentYear} CodeScribe AI. All rights reserved.
                </div>
              </td>
            </tr>
          </table>

          <div style="display:none; white-space:nowrap; font-size:15px; line-height:0;">
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Generate account unsuspended email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's name or email
 * @param {string} params.environment - Current environment
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function accountUnsuspendedTemplate({
  userName,
  environment,
  clientUrl
}) {
  const isNonProd = environment !== 'production';
  const currentYear = new Date().getFullYear();

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Account Restored</title>

    <style>
      @media (prefers-color-scheme: dark) {
        .bg-body { background: #0b0b0f !important; }
        .card { background: #141420 !important; border-color: #2a2a3a !important; }
        .text { color: #e7e7ef !important; }
        .muted { color: #b5b5c7 !important; }
        .divider { border-color: #2a2a3a !important; }
        .link { color: #c8b6ff !important; }
        .btn { background: #7c3aed !important; }
        .success-box { background: #0d2818 !important; border-color: #22c55e !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Your account has been reactivated.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#7c3aed; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  Account Restored
                </div>
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; color:#e9d5ff; margin:6px 0 0 0;">
                  Your account has been reactivated
                </div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e7e9f2; border-top:none; border-radius:0 0 14px 14px; padding:32px 24px;">
                ${isNonProd ? `<div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 28px 0;">
                  ${environment.charAt(0).toUpperCase() + environment.slice(1)} environment · Non-production email
                </div>` : ''}

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:24px; color:#111827; margin:0 0 14px 0;">
                  Hi ${userName},
                </div>

                <div class="success-box" style="background:#f0fdf4; border-left:3px solid #22c55e; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#22c55e; margin:0 0 8px 0;">
                    Welcome Back!
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; margin:0;">
                    Your account suspension has been lifted and your account is now fully restored.
                  </div>
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 12px 0;">
                  You now have full access to:
                </div>

                <ul style="margin:0 0 22px 0; padding-left:20px; color:#6b7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:22px;">
                  <li style="margin-bottom:6px;">All your account features and services</li>
                  <li style="margin-bottom:6px;">Your saved data and documentation history</li>
                  <li>Any active subscriptions or trials</li>
                </ul>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 18px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${clientUrl}/" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Access Your Account
                      </a>
                    </td>
                  </tr>
                </table>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:22px 0 0 0; padding-top:18px; border-top:1px solid #e5e7eb;">
                  If you have any questions or concerns, please don't hesitate to reach out to our support team.
                </div>

                <div class="divider" style="border-top:1px solid #e5e7eb; margin:18px 0 16px 0;"></div>

                <div style="text-align:center;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:700; color:#111827; margin:0 0 6px 0;">
                    CodeScribe AI
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 10px 0;">
                    Secure documentation automation for engineering teams
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280;">
                    <a class="link" href="mailto:support@codescribeai.com" style="color:#4f46e5; text-decoration:underline;">Support</a>
                    <span style="padding:0 6px;">·</span>
                    <a class="link" href="${clientUrl}/privacy" style="color:#4f46e5; text-decoration:underline;">Privacy</a>
                    <span style="padding:0 6px;">·</span>
                    <a class="link" href="${clientUrl}/terms" style="color:#4f46e5; text-decoration:underline;">Terms</a>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 0 0 0; text-align:center;">
                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; line-height:16px; color:#9ca3af;">
                  © ${currentYear} CodeScribe AI. All rights reserved.
                </div>
              </td>
            </tr>
          </table>

          <div style="display:none; white-space:nowrap; font-size:15px; line-height:0;">
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Generate trial granted by admin email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's name or email
 * @param {string} params.trialTier - Trial tier granted (e.g., 'pro', 'team')
 * @param {number} params.durationDays - Trial duration in days
 * @param {Date|string} params.expiresAt - Trial expiration date
 * @param {string} params.environment - Current environment
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function trialGrantedByAdminTemplate({
  userName,
  trialTier = 'pro',
  durationDays,
  expiresAt,
  environment,
  clientUrl
}) {
  const tierDisplay = trialTier.charAt(0).toUpperCase() + trialTier.slice(1);
  const expirationDate = formatDate(expiresAt);
  const isNonProd = environment !== 'production';
  const currentYear = new Date().getFullYear();

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${tierDisplay} Trial Granted</title>

    <style>
      @media (prefers-color-scheme: dark) {
        .bg-body { background: #0b0b0f !important; }
        .card { background: #141420 !important; border-color: #2a2a3a !important; }
        .text { color: #e7e7ef !important; }
        .muted { color: #b5b5c7 !important; }
        .divider { border-color: #2a2a3a !important; }
        .link { color: #c8b6ff !important; }
        .btn { background: #7c3aed !important; }
        .grant-box { background: #1a1628 !important; border-color: #8b5cf6 !important; }
        .info-box { background: #1a1a28 !important; border-color: #2a2a3a !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      You've been given ${durationDays} days of ${tierDisplay} access.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#7c3aed; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  ${tierDisplay} Trial Granted
                </div>
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; color:#e9d5ff; margin:6px 0 0 0;">
                  You've been given ${durationDays} days of ${tierDisplay} access
                </div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e7e9f2; border-top:none; border-radius:0 0 14px 14px; padding:32px 24px;">
                ${isNonProd ? `<div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  ${environment.charAt(0).toUpperCase() + environment.slice(1)} environment · Non-production email
                </div>` : ''}

                <div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  Plan: ${tierDisplay} Trial ${isNonProd ? `(${environment.charAt(0).toUpperCase() + environment.slice(1)})` : ''}
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:24px; color:#111827; margin:0 0 14px 0;">
                  Hi ${userName},
                </div>

                <div class="grant-box" style="background:#f5f3ff; border-left:3px solid #8b5cf6; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#8b5cf6; margin:0 0 8px 0;">
                    🎉 Trial Access Granted
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; margin:0;">
                    You've been granted ${durationDays} days of ${tierDisplay} access by our team.
                  </div>
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#111827; margin:0 0 12px 0;">
                  Trial Details
                </div>

                <div class="info-box" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px 14px; margin:0 0 18px 0;">
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; margin:0;">
                    <strong>Tier:</strong> ${tierDisplay}<br>
                    <strong>Duration:</strong> ${durationDays} days<br>
                    <strong>Expires:</strong> ${expirationDate}
                  </div>
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 12px 0;">
                  During your trial, you'll have access to:
                </div>

                <ul style="margin:0 0 22px 0; padding-left:20px; color:#6b7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:22px;">
                  <li style="margin-bottom:6px;">Advanced documentation generation features</li>
                  <li style="margin-bottom:6px;">Higher usage limits</li>
                  <li style="margin-bottom:6px;">Priority support</li>
                  ${trialTier === 'team' ? '<li>Team collaboration features</li>' : ''}
                </ul>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 18px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${clientUrl}/" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Get Started
                      </a>
                    </td>
                  </tr>
                </table>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:22px 0 0 0; padding-top:18px; border-top:1px solid #e5e7eb;">
                  <strong>Note:</strong> When your trial expires on ${expirationDate}, you can continue using CodeScribe on the Free tier or upgrade to a paid plan to keep your ${tierDisplay} features.
                </div>

                <div class="divider" style="border-top:1px solid #e5e7eb; margin:18px 0 16px 0;"></div>

                <div style="text-align:center;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:700; color:#111827; margin:0 0 6px 0;">
                    CodeScribe AI
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 10px 0;">
                    Secure documentation automation for engineering teams
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280;">
                    <a class="link" href="mailto:support@codescribeai.com" style="color:#4f46e5; text-decoration:underline;">Support</a>
                    <span style="padding:0 6px;">·</span>
                    <a class="link" href="${clientUrl}/privacy" style="color:#4f46e5; text-decoration:underline;">Privacy</a>
                    <span style="padding:0 6px;">·</span>
                    <a class="link" href="${clientUrl}/terms" style="color:#4f46e5; text-decoration:underline;">Terms</a>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 0 0 0; text-align:center;">
                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; line-height:16px; color:#9ca3af;">
                  © ${currentYear} CodeScribe AI. All rights reserved.
                </div>
              </td>
            </tr>
          </table>

          <div style="display:none; white-space:nowrap; font-size:15px; line-height:0;">
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
