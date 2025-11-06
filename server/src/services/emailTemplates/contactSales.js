/**
 * Contact Sales Email Template
 *
 * Template for sales inquiries from authenticated users
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
 * Generate contact sales email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userName - User's full name
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userId - User's ID
 * @param {string} params.currentTier - User's current subscription tier
 * @param {string} params.interestedTier - Tier user is interested in (team/enterprise)
 * @param {string} params.subject - Subject/topic of inquiry (free-form text)
 * @param {string} params.message - Optional message from user
 * @param {string} params.environment - Current environment (development, production, etc.)
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function contactSalesTemplate({
  userName,
  userEmail,
  userId,
  currentTier,
  interestedTier,
  subject,
  message,
  environment,
  clientUrl
}) {
  const tierLabels = {
    team: 'Team',
    enterprise: 'Enterprise'
  };

  const interestedTierLabel = tierLabels[interestedTier?.toLowerCase()] || interestedTier;

  const content = `
    ${emailHeader('Sales Inquiry')}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(currentTier)}
        ${environmentBadge(environment)}
      </div>

      <!-- Inquiry Summary -->
      <div style="margin-bottom: 32px;">
        <h2 style="color: #1e293b; margin: 0 0 4px 0; font-size: 20px; font-weight: 600;">
          ${subject ? subject : `Interested in ${interestedTierLabel} Plan`}
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

      <!-- Message (if provided) -->
      ${message ? `
      <div style="margin: 24px 0;">
        ${sectionHeading('Message')}
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <p style="color: #1e293b; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
      ` : ''}

      <!-- Next Steps -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          <strong>Next Steps:</strong> Respond directly to this email or reach out to <a href="mailto:${userEmail}" style="color: #9333ea; text-decoration: none;">${userEmail}</a> to discuss ${interestedTierLabel} plan pricing and features.
        </p>
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Sales Inquiry', content);
}
