/**
 * Support Request Email Template
 *
 * Template for support requests from authenticated users
 */

import {
  baseHTML,
  emailHeader,
  emailFooter,
  tierBadge,
  environmentBadge,
  sectionHeading,
  contentBox
} from './base.js';

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
  const content = `
    ${emailHeader('Support Request', requestDateTime)}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(currentTier)}
        ${environmentBadge(environment)}
      </div>

      <!-- Request Type and Subject -->
      <div style="margin-bottom: 32px;">
        <h2 style="color: #1e293b; margin: 0 0 4px 0; font-size: 20px; font-weight: 600;">
          ${contactTypeLabel}${subjectText ? `: ${subjectText}` : ''}
        </h2>
      </div>

      <!-- Contact Information -->
      <div style="margin: 24px 0;">
        ${sectionHeading('Contact Information')}
        ${contentBox(`
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 100px;">Name:</td>
              <td style="padding: 8px 0; color: #1e293b;">${userName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${userEmail}" style="color: #9333ea; text-decoration: none;">${userEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">User ID:</td>
              <td style="padding: 8px 0; color: #1e293b;">${userId}</td>
            </tr>
          </table>
        `)}
      </div>

      <!-- Message -->
      <div style="margin: 24px 0;">
        ${sectionHeading('Message')}
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <p style="color: #1e293b; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
      </div>

      <!-- Attachments (if any) -->
      ${attachments.length > 0 ? `
      <div style="margin: 24px 0;">
        ${sectionHeading(`Attachments (${attachments.length})`)}
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #1e293b;">
            ${attachments.map(att => `<li style="margin: 4px 0;">${att.filename} (${att.content_type})</li>`).join('')}
          </ul>
        </div>
      </div>
      ` : ''}

      <!-- Next Steps -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          <strong>Next Steps:</strong> Respond directly to this email or reach out to <a href="mailto:${userEmail}" style="color: #9333ea; text-decoration: none;">${userEmail}</a> to assist with their request.
        </p>
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Support Request', content);
}
