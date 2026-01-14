/**
 * Account Action Email Templates
 *
 * Templates for admin-initiated account actions:
 * - Account suspended
 * - Account unsuspended/restored
 * - Trial granted by admin
 */

import {
  baseHTML,
  emailHeader,
  emailFooter,
  sectionHeading,
  primaryButton,
  contentBox,
  tierBadge,
  environmentBadge
} from './base.js';

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

  const content = `
    ${emailHeader('Account Suspended', 'Your account has been suspended')}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Environment Badge -->
      <div style="margin-bottom: 20px;">
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>

      <div style="margin: 24px 0; padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="color: #f59e0b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          Account Suspended
        </p>
        <p style="color: #475569; font-size: 14px; margin: 0;">
          Your account has been suspended${hasDeleteDate ? ` and is scheduled for deletion on <strong>${deletionDate}</strong>` : ''}.
        </p>
      </div>

      ${sectionHeading('Reason for Suspension')}
      ${contentBox(`
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">
          ${reason}
        </p>
      `)}

      <div style="margin: 30px 0;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          During the suspension period:
        </p>
        <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>You cannot log in to your account</li>
          <li>All services are temporarily unavailable</li>
          <li>Your data ${hasDeleteDate ? 'will be retained until the deletion date' : 'is preserved and will not be deleted'}</li>
        </ul>
      </div>

      ${sectionHeading('Need Help?')}
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        If you believe this suspension was made in error or would like to discuss this decision, please contact our support team.
      </p>

      ${primaryButton('Contact Support', `${clientUrl}/settings`)}

      ${hasDeleteDate ? `
        <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #e2e8f0;">
          <strong>Important:</strong> If your account remains suspended until ${deletionDate}, all your data will be permanently deleted and cannot be recovered.
        </p>
      ` : ''}
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Account Suspended - CodeScribe', content);
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
  const content = `
    ${emailHeader('Account Restored', 'Your account has been reactivated')}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Environment Badge -->
      <div style="margin-bottom: 20px;">
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>

      <div style="margin: 24px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
        <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          Welcome Back!
        </p>
        <p style="color: #475569; font-size: 14px; margin: 0;">
          Your account suspension has been lifted and your account is now fully restored.
        </p>
      </div>

      <div style="margin: 30px 0;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          You now have full access to:
        </p>
        <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>All your account features and services</li>
          <li>Your saved data and documentation history</li>
          <li>Any active subscriptions or trials</li>
        </ul>
      </div>

      ${primaryButton('Access Your Account', `${clientUrl}/`)}

      <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #e2e8f0;">
        If you have any questions or concerns, please don't hesitate to reach out to our support team.
      </p>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Account Restored - CodeScribe', content);
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

  const content = `
    ${emailHeader(`${tierDisplay} Trial Granted`, `You've been given ${durationDays} days of ${tierDisplay} access`)}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(trialTier)}
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>

      <div style="margin: 24px 0; padding: 16px; background: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
        <p style="color: #8b5cf6; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          🎉 Trial Access Granted
        </p>
        <p style="color: #475569; font-size: 14px; margin: 0;">
          You've been granted ${durationDays} days of ${tierDisplay} access by our team.
        </p>
      </div>

      ${sectionHeading('Trial Details')}
      ${contentBox(`
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
          <strong>Tier:</strong> ${tierDisplay}<br>
          <strong>Duration:</strong> ${durationDays} days<br>
          <strong>Expires:</strong> ${expirationDate}
        </p>
      `)}

      <div style="margin: 30px 0;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          During your trial, you'll have access to:
        </p>
        <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Advanced documentation generation features</li>
          <li>Higher usage limits</li>
          <li>Priority support</li>
          ${trialTier === 'team' ? '<li>Team collaboration features</li>' : ''}
        </ul>
      </div>

      ${primaryButton('Get Started', `${clientUrl}/`)}

      <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #e2e8f0;">
        <strong>Note:</strong> When your trial expires on ${expirationDate}, you can continue using CodeScribe on the Free tier or upgrade to a paid plan to keep your ${tierDisplay} features.
      </p>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML(`${tierDisplay} Trial Granted - CodeScribe`, content);
}
