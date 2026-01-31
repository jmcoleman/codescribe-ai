/**
 * Support Request Email Template
 *
 * Production-grade template with table-based layout for maximum email client compatibility
 */

/**
 * Generate support request email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's full name
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userId - User's ID
 * @param {string} params.currentTier - User's subscription tier
 * @param {string} params.contactType - Type of support request
 * @param {string} params.subjectText - Optional subject line
 * @param {string} params.message - Support request message
 * @param {Array} params.attachments - Array of attachments (if any)
 * @param {string} params.requestDateTime - Formatted date/time of request
 * @param {string} params.contactTypeLabel - Human-readable contact type
 * @param {string} params.environment - Current environment (development, production, etc.)
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function supportRequestTemplate({
  userName,
  userEmail,
  userId,
  currentTier,
  contactType,
  subjectText,
  message,
  attachments = [],
  requestDateTime,
  contactTypeLabel,
  environment,
  clientUrl
}) {
  const isNonProd = environment !== 'production';
  const currentYear = new Date().getFullYear();

  // Normalize tier for display
  const tierNames = {
    enterprise: 'Priority',
    team: 'Priority',
    pro: 'Pro',
    starter: 'Starter',
    free: 'Free'
  };
  const tierDisplay = tierNames[currentTier?.toLowerCase()] || 'Free';

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Support Request</title>

    <style>
      @media (prefers-color-scheme: dark) {
        .bg-body { background: #0b0b0f !important; }
        .card { background: #141420 !important; border-color: #2a2a3a !important; }
        .text { color: #e7e7ef !important; }
        .muted { color: #b5b5c7 !important; }
        .divider { border-color: #2a2a3a !important; }
        .link { color: #c8b6ff !important; }
        .content-box { background: #1f1f2e !important; }
      }
    </style>
  </head>

  <body class="bg-body" style="margin:0; padding:0; background:#f6f7fb;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      New support request from ${userName || userEmail}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px;">
            <tr>
              <td style="background:#7c3aed; border-radius:14px 14px 0 0; padding:26px 24px; text-align:center;">
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:22px; font-weight:600; color:rgba(255,255,255,0.9); margin:0 0 6px 0;">
                  ${requestDateTime}
                </div>
                <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">
                  Support Request
                </div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e7e9f2; border-top:none; border-radius:0 0 14px 14px; padding:32px 24px;">
                ${isNonProd ? `<div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#6b7280; margin:0 0 28px 0;">
                  ${environment.charAt(0).toUpperCase() + environment.slice(1)} environment · Non-production email
                </div>` : ''}

                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:18px; line-height:26px; font-weight:700; color:#111827; margin:0 0 6px 0;">
                  ${contactTypeLabel}${subjectText ? `: ${subjectText}` : ''}
                </div>

                <div class="muted" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; margin:0 0 24px 0;">
                  Plan: ${tierDisplay}${isNonProd ? ` (${environment.charAt(0).toUpperCase() + environment.slice(1)})` : ''}
                </div>

                <!-- Contact Information -->
                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:700; color:#475569; margin:0 0 12px 0; border-left:4px solid #7c3aed; padding-left:12px;">
                  Contact Information
                </div>

                <div class="content-box" style="background:#f8fafc; border-radius:12px; padding:16px; margin:0 0 24px 0;">
                  <table style="width:100%; border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:18px; font-weight:600; color:#64748b; width:80px;">
                        Name:
                      </td>
                      <td style="padding:6px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:18px; color:#111827;">
                        ${userName || 'Not provided'}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:18px; font-weight:600; color:#64748b;">
                        Email:
                      </td>
                      <td style="padding:6px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:18px;">
                        <a class="link" href="mailto:${userEmail}" style="color:#4f46e5; text-decoration:underline;">${userEmail}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:18px; font-weight:600; color:#64748b;">
                        User ID:
                      </td>
                      <td style="padding:6px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:18px; color:#111827;">
                        ${userId}
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Message -->
                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:700; color:#475569; margin:0 0 12px 0; border-left:4px solid #7c3aed; padding-left:12px;">
                  Message
                </div>

                <div class="content-box" style="background:#f8fafc; border-radius:12px; padding:16px; margin:0 0 24px 0;">
                  <div class="text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#111827; white-space:pre-wrap; margin:0;">
                    ${message}
                  </div>
                </div>

                ${attachments.length > 0 ? `
                <!-- Attachments -->
                <div class="text" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:20px; font-weight:700; color:#475569; margin:0 0 12px 0; border-left:4px solid #7c3aed; padding-left:12px;">
                  Attachments (${attachments.length})
                </div>

                <div class="content-box" style="background:#f8fafc; border-radius:12px; padding:16px; margin:0 0 24px 0;">
                  <ul style="margin:0; padding-left:20px;">
                    ${attachments.map(att => `<li style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#111827; margin:4px 0;">${att.filename} (${att.content_type})</li>`).join('')}
                  </ul>
                </div>
                ` : ''}

                <!-- Next Steps -->
                <div class="divider" style="border-top:1px solid #e5e7eb; margin:24px 0 20px 0;"></div>

                <div class="muted" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#6b7280; margin:0 0 16px 0;">
                  <strong>Next Steps:</strong> Respond directly to this email or reach out to <a class="link" href="mailto:${userEmail}" style="color:#4f46e5; text-decoration:underline;">${userEmail}</a> to assist with their request.
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
