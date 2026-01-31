/**
 * Account Deletion Email Templates
 *
 * Production-grade templates with table-based layout for maximum email client compatibility
 * Templates for account deletion flow (scheduled, restored, final warning)
 */

/**
 * Generate deletion scheduled email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userName - User's full name
 * @param {string} params.restoreLink - Account restoration link with token
 * @param {string} params.deletionDate - Formatted deletion date
 * @param {string} params.currentTier - User's subscription tier (optional)
 * @param {string} params.environment - Current environment (development, production, etc.)
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function deletionScheduledTemplate({
  userEmail,
  userName,
  restoreLink,
  deletionDate,
  currentTier,
  environment,
  clientUrl
}) {
  const isNonProd = environment !== 'production';
  const currentYear = new Date().getFullYear();
  const tierDisplay = currentTier ? currentTier.charAt(0).toUpperCase() + currentTier.slice(1) : 'Free';

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Account Deletion Scheduled</title>

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
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Your account has been scheduled for deletion on ${deletionDate}.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#7c3aed; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  Account Deletion Scheduled
                </div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e7e9f2; border-top:none; border-radius:0 0 14px 14px; padding:32px 24px;">
                ${isNonProd ? `<div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  ${environment.charAt(0).toUpperCase() + environment.slice(1)} environment · Non-production email
                </div>` : ''}

                <div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  Plan: ${tierDisplay} ${isNonProd ? `(${environment.charAt(0).toUpperCase() + environment.slice(1)})` : ''}
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:24px; color:#111827; margin:0 0 14px 0;">
                  Hi ${userName || 'there'},
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 22px 0;">
                  Your CodeScribe AI account (<a class="link" href="mailto:${userEmail}" style="color:#4f46e5; text-decoration:underline;">${userEmail}</a>) has been scheduled for deletion on <strong>${deletionDate}</strong>.
                </div>

                <div class="warning-box" style="background:#fffbeb; border-left:3px solid #f59e0b; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#111827; margin:0 0 8px 0;">
                    Changed your mind?
                  </div>
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#92400e; margin:0;">
                    You can restore your account at any time before ${deletionDate} by clicking the button below.
                  </div>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 22px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${restoreLink}" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Restore My Account
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="background:#f3f4f6; border:1px solid #e5e7eb; border-radius:12px; padding:14px 14px; margin:0 0 14px 0;">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; font-weight:700; color:#374151; margin:0 0 8px 0;">
                    Direct restoration link
                  </div>
                  <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:12px; line-height:18px; color:#111827; word-break:break-all;">
                    <a class="link" href="${restoreLink}" style="color:#4f46e5; text-decoration:underline;">${restoreLink}</a>
                  </div>
                </div>

                <div style="border-left:3px solid #7c3aed; background:#f9fafb; border-radius:10px; padding:12px 12px; margin:0 0 22px 0;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#111827; margin:0;">
                    <strong>What happens next:</strong>
                    If you don't restore your account, all your data will be permanently deleted on ${deletionDate}. This action cannot be undone.
                  </div>
                </div>

                <div class="divider" style="border-top:1px solid #e5e7eb; margin:10px 0 16px 0;"></div>

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
 * Generate account restored email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userName - User's full name
 * @param {string} params.currentTier - User's subscription tier (optional)
 * @param {string} params.environment - Current environment (development, production, etc.)
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function accountRestoredTemplate({
  userEmail,
  userName,
  currentTier,
  environment,
  clientUrl
}) {
  const isNonProd = environment !== 'production';
  const currentYear = new Date().getFullYear();
  const tierDisplay = currentTier ? currentTier.charAt(0).toUpperCase() + currentTier.slice(1) : 'Free';

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
        .success-box { background: #0d2818 !important; border-color: #10b981 !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Your CodeScribe AI account has been successfully restored.
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
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e7e9f2; border-top:none; border-radius:0 0 14px 14px; padding:32px 24px;">
                ${isNonProd ? `<div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  ${environment.charAt(0).toUpperCase() + environment.slice(1)} environment · Non-production email
                </div>` : ''}

                <div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  Plan: ${tierDisplay} ${isNonProd ? `(${environment.charAt(0).toUpperCase() + environment.slice(1)})` : ''}
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:24px; color:#111827; margin:0 0 14px 0;">
                  Hi ${userName || 'there'},
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 22px 0;">
                  Good news! Your CodeScribe AI account (<a class="link" href="mailto:${userEmail}" style="color:#4f46e5; text-decoration:underline;">${userEmail}</a>) has been successfully restored.
                </div>

                <div class="success-box" style="background:#d1fae5; border-left:3px solid #10b981; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#065f46; margin:0;">
                    <strong>Welcome back!</strong> Your account and all associated data have been restored. You can now log in and continue using CodeScribe AI.
                  </div>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 22px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${clientUrl}" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Go to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="border-left:3px solid #7c3aed; background:#f9fafb; border-radius:10px; padding:12px 12px; margin:0 0 22px 0;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#111827; margin:0;">
                    If you didn't restore this account, please contact support immediately at <a class="link" href="mailto:support@codescribeai.com" style="color:#4f46e5; text-decoration:underline;">support@codescribeai.com</a>.
                  </div>
                </div>

                <div class="divider" style="border-top:1px solid #e5e7eb; margin:10px 0 16px 0;"></div>

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
 * Generate final deletion warning email HTML (sent 24 hours before deletion)
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userName - User's full name
 * @param {string} params.restoreLink - Account restoration link with token
 * @param {string} params.currentTier - User's subscription tier (optional)
 * @param {string} params.environment - Current environment (development, production, etc.)
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function finalDeletionWarningTemplate({
  userEmail,
  userName,
  restoreLink,
  currentTier,
  environment,
  clientUrl
}) {
  const isNonProd = environment !== 'production';
  const currentYear = new Date().getFullYear();
  const tierDisplay = currentTier ? currentTier.charAt(0).toUpperCase() + currentTier.slice(1) : 'Free';

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Final Warning: Account Deletion Tomorrow</title>

    <style>
      @media (prefers-color-scheme: dark) {
        .bg-body { background: #0b0b0f !important; }
        .card { background: #141420 !important; border-color: #2a2a3a !important; }
        .text { color: #e7e7ef !important; }
        .muted { color: #b5b5c7 !important; }
        .divider { border-color: #2a2a3a !important; }
        .link { color: #c8b6ff !important; }
        .btn { background: #7c3aed !important; }
        .danger-box { background: #2a0d0d !important; border-color: #ef4444 !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Final warning: Your account will be permanently deleted tomorrow.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#dc2626; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  ⚠️ Final Warning: Account Deletion Tomorrow
                </div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e7e9f2; border-top:none; border-radius:0 0 14px 14px; padding:32px 24px;">
                ${isNonProd ? `<div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  ${environment.charAt(0).toUpperCase() + environment.slice(1)} environment · Non-production email
                </div>` : ''}

                <div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  Plan: ${tierDisplay} ${isNonProd ? `(${environment.charAt(0).toUpperCase() + environment.slice(1)})` : ''}
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:24px; color:#111827; margin:0 0 14px 0;">
                  Hi ${userName || 'there'},
                </div>

                <div class="danger-box" style="background:#fee2e2; border-left:3px solid #ef4444; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#991b1b; margin:0 0 8px 0;">
                    ⚠️ Final Warning
                  </div>
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#991b1b; margin:0;">
                    Your CodeScribe AI account (<strong>${userEmail}</strong>) will be <strong>permanently deleted tomorrow</strong>.
                  </div>
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 22px 0;">
                  This is your last chance to restore your account. After tomorrow, all your data will be permanently deleted and cannot be recovered.
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 22px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${restoreLink}" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Restore My Account Now
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="background:#f3f4f6; border:1px solid #e5e7eb; border-radius:12px; padding:14px 14px; margin:0 0 14px 0;">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; font-weight:700; color:#374151; margin:0 0 8px 0;">
                    Direct restoration link
                  </div>
                  <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:12px; line-height:18px; color:#111827; word-break:break-all;">
                    <a class="link" href="${restoreLink}" style="color:#4f46e5; text-decoration:underline;">${restoreLink}</a>
                  </div>
                </div>

                <div style="border-left:3px solid #7c3aed; background:#f9fafb; border-radius:10px; padding:12px 12px; margin:0 0 22px 0;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#111827; margin:0;">
                    <strong>What will be deleted:</strong>
                    All your account data, settings, and usage history will be permanently removed. This action cannot be undone.
                  </div>
                </div>

                <div class="divider" style="border-top:1px solid #e5e7eb; margin:10px 0 16px 0;"></div>

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
