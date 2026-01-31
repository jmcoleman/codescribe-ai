/**
 * Trial Reminder Email Templates
 *
 * Production-grade templates with table-based layout for maximum email client compatibility
 * Templates for trial-related email notifications:
 * - Trial expiring reminders (3 days, 1 day)
 * - Trial expired notice
 * - Trial extended confirmation
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
 * Generate trial expiring reminder email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's name or email
 * @param {number} params.daysRemaining - Days until trial expires (1 or 3)
 * @param {string} params.trialTier - Trial tier (e.g., 'pro')
 * @param {Date|string} params.expiresAt - Trial expiration date
 * @param {string} params.environment - Current environment
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function trialExpiringReminderTemplate({
  userName,
  daysRemaining,
  trialTier = 'pro',
  expiresAt,
  environment,
  clientUrl
}) {
  const tierDisplay = trialTier.charAt(0).toUpperCase() + trialTier.slice(1);
  const urgencyColor = daysRemaining === 1 ? '#dc2626' : '#f59e0b';
  const urgencyBg = daysRemaining === 1 ? '#fee2e2' : '#fffbeb';
  const urgencyTextColor = daysRemaining === 1 ? '#991b1b' : '#92400e';
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
    <title>Your ${tierDisplay} Trial Ends Soon</title>

    <style>
      @media (prefers-color-scheme: dark) {
        .bg-body { background: #0b0b0f !important; }
        .card { background: #141420 !important; border-color: #2a2a3a !important; }
        .text { color: #e7e7ef !important; }
        .muted { color: #b5b5c7 !important; }
        .divider { border-color: #2a2a3a !important; }
        .link { color: #c8b6ff !important; }
        .btn { background: #7c3aed !important; }
        .info-box { background: #1a1a28 !important; border-color: #2a2a3a !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Your ${tierDisplay} trial expires on ${expirationDate}.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#7c3aed; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  Your ${tierDisplay} Trial Ends Soon
                </div>
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; color:#e9d5ff; margin:6px 0 0 0;">
                  ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining
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

                <div style="background:${urgencyBg}; border-left:3px solid ${urgencyColor}; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:${urgencyTextColor}; margin:0 0 8px 0;">
                    ${daysRemaining === 1 ? 'Last Day!' : 'Time is Running Out'}
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; margin:0;">
                    Your ${tierDisplay} trial expires on <strong>${expirationDate}</strong>.
                    ${daysRemaining === 1
                      ? "After today, you'll lose access to Pro features."
                      : `You have ${daysRemaining} days left to explore all ${tierDisplay} features.`}
                  </div>
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#111827; margin:0 0 12px 0;">
                  What You'll Miss
                </div>

                <div class="info-box" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <ul style="margin:0; padding-left:20px; color:#6b7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px;">
                    <li style="margin-bottom:8px;">Unlimited documentation generations</li>
                    <li style="margin-bottom:8px;">Priority processing and faster generation</li>
                    <li style="margin-bottom:8px;">All documentation types</li>
                    <li style="margin-bottom:8px;">Multi-file batch processing</li>
                    <li>Clean, attribution-free output</li>
                  </ul>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 18px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${clientUrl}/pricing" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Upgrade to Pro
                      </a>
                    </td>
                  </tr>
                </table>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; text-align:center; margin:0 0 22px 0;">
                  Questions? Reply to this email or <a class="link" href="${clientUrl}/contact" style="color:#4f46e5; text-decoration:underline;">contact our team</a>.
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
 * Generate trial expired notice email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's name or email
 * @param {string} params.trialTier - Trial tier that expired (e.g., 'pro')
 * @param {Date|string} params.expiredAt - When the trial expired
 * @param {string} params.environment - Current environment
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function trialExpiredNoticeTemplate({
  userName,
  trialTier = 'pro',
  expiredAt,
  environment,
  clientUrl
}) {
  const tierDisplay = trialTier.charAt(0).toUpperCase() + trialTier.slice(1);
  const expirationDate = formatDate(expiredAt);
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
    <title>Your ${tierDisplay} Trial Has Ended</title>

    <style>
      @media (prefers-color-scheme: dark) {
        .bg-body { background: #0b0b0f !important; }
        .card { background: #141420 !important; border-color: #2a2a3a !important; }
        .text { color: #e7e7ef !important; }
        .muted { color: #b5b5c7 !important; }
        .divider { border-color: #2a2a3a !important; }
        .link { color: #c8b6ff !important; }
        .btn { background: #7c3aed !important; }
        .info-box { background: #1a1a28 !important; border-color: #2a2a3a !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Your ${tierDisplay} trial ended on ${expirationDate}.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#7c3aed; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  Your ${tierDisplay} Trial Has Ended
                </div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e7e9f2; border-top:none; border-radius:0 0 14px 14px; padding:32px 24px;">
                ${isNonProd ? `<div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  ${environment.charAt(0).toUpperCase() + environment.slice(1)} environment · Non-production email
                </div>` : ''}

                <div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 18px 0;">
                  Plan: Free ${isNonProd ? `(${environment.charAt(0).toUpperCase() + environment.slice(1)})` : ''}
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:24px; color:#111827; margin:0 0 14px 0;">
                  Hi ${userName},
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 22px 0;">
                  Your ${tierDisplay} trial ended on ${expirationDate}. Your account has been downgraded to the Free tier.
                </div>

                <div class="info-box" style="background:#f1f5f9; border-radius:10px; padding:14px 14px; margin:0 0 18px 0;">
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#6b7280; margin:0 0 10px 0;">
                    Good news! Your work is safe.
                  </div>
                  <ul style="margin:0; padding-left:20px; color:#6b7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px;">
                    <li style="margin-bottom:6px;">All your generated documentation is still accessible</li>
                    <li style="margin-bottom:6px;">Your account and settings are preserved</li>
                    <li>You can upgrade anytime to unlock Pro features again</li>
                  </ul>
                </div>

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#111827; margin:0 0 12px 0;">
                  Free Tier Limits
                </div>

                <div class="info-box" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <ul style="margin:0; padding-left:20px; color:#6b7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px;">
                    <li style="margin-bottom:8px;">5 generations per day</li>
                    <li style="margin-bottom:8px;">Basic documentation types only</li>
                    <li>Attribution watermark in output</li>
                  </ul>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 18px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${clientUrl}/pricing" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Upgrade to Pro
                      </a>
                    </td>
                  </tr>
                </table>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; text-align:center; margin:0 0 22px 0;">
                  Thank you for trying CodeScribe AI!
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
 * Generate trial extended confirmation email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's name or email
 * @param {string} params.trialTier - Trial tier (e.g., 'pro')
 * @param {number} params.additionalDays - Number of days extended
 * @param {Date|string} params.newExpiresAt - New expiration date
 * @param {string} params.environment - Current environment
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function trialExtendedTemplate({
  userName,
  trialTier = 'pro',
  additionalDays,
  newExpiresAt,
  environment,
  clientUrl
}) {
  const tierDisplay = trialTier.charAt(0).toUpperCase() + trialTier.slice(1);
  const newExpirationDate = formatDate(newExpiresAt);
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
    <title>Great News! Your ${tierDisplay} Trial Extended</title>

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
        .info-box { background: #1a1a28 !important; border-color: #2a2a3a !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Your ${tierDisplay} trial has been extended by ${additionalDays} days!
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#7c3aed; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  Great News!
                </div>
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; color:#e9d5ff; margin:6px 0 0 0;">
                  Your ${tierDisplay} trial has been extended
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

                <div class="success-box" style="background:#f0fdf4; border-left:3px solid #22c55e; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; font-weight:700; color:#166534; margin:0 0 8px 0;">
                    Trial Extended by ${additionalDays} Days!
                  </div>
                  <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; margin:0;">
                    Your ${tierDisplay} trial now expires on <strong>${newExpirationDate}</strong>.
                  </div>
                </div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280; margin:0 0 18px 0;">
                  Continue exploring all the powerful features CodeScribe AI has to offer:
                </div>

                <div class="info-box" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px 14px; margin:0 0 22px 0;">
                  <ul style="margin:0; padding-left:20px; color:#6b7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px;">
                    <li style="margin-bottom:8px;">Generate unlimited documentation</li>
                    <li style="margin-bottom:8px;">Process multiple files at once</li>
                    <li style="margin-bottom:8px;">Use all documentation types</li>
                    <li>Get priority processing speeds</li>
                  </ul>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 22px auto;">
                  <tr>
                    <td align="center" class="btn" style="background:#7c3aed; border-radius:10px;">
                      <a href="${clientUrl}" style="display:inline-block; padding:10px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;" target="_blank" rel="noopener">
                        Start Generating
                      </a>
                    </td>
                  </tr>
                </table>

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
