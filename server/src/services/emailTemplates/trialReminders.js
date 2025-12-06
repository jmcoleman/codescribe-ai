/**
 * Trial Reminder Email Templates
 *
 * Templates for trial-related email notifications:
 * - Trial expiring reminders (3 days, 1 day)
 * - Trial expired notice
 * - Trial extended confirmation
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
  const urgencyBg = daysRemaining === 1 ? '#fef2f2' : '#fffbeb';
  const expirationDate = formatDate(expiresAt);

  const content = `
    ${emailHeader(`Your ${tierDisplay} Trial Ends Soon`, `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`)}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(trialTier)}
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>

      <div style="margin: 24px 0; padding: 16px; background: ${urgencyBg}; border-left: 4px solid ${urgencyColor}; border-radius: 4px;">
        <p style="color: ${urgencyColor}; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          ${daysRemaining === 1 ? 'Last Day!' : 'Time is Running Out'}
        </p>
        <p style="color: #475569; font-size: 14px; margin: 0;">
          Your ${tierDisplay} trial expires on <strong>${expirationDate}</strong>.
          ${daysRemaining === 1
            ? "After today, you'll lose access to Pro features."
            : `You have ${daysRemaining} days left to explore all ${tierDisplay} features.`}
        </p>
      </div>

      ${sectionHeading('What You\'ll Miss')}
      ${contentBox(`
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          <li style="margin-bottom: 8px;">Unlimited documentation generations</li>
          <li style="margin-bottom: 8px;">Priority processing and faster generation</li>
          <li style="margin-bottom: 8px;">All documentation types</li>
          <li style="margin-bottom: 8px;">Multi-file batch processing</li>
          <li>Clean, attribution-free output</li>
        </ul>
      `)}

      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Upgrade to Pro', `${clientUrl}/pricing`)}
      </div>

      <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
        Questions? Reply to this email or <a href="${clientUrl}/contact" style="color: #9333ea;">contact our team</a>.
      </p>
    </div>

    ${emailFooter(clientUrl)}
  `;

  const subject = daysRemaining === 1
    ? `Last day! Your ${tierDisplay} trial expires tomorrow`
    : `Your ${tierDisplay} trial expires in ${daysRemaining} days`;

  return baseHTML(subject, content);
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

  const content = `
    ${emailHeader(`Your ${tierDisplay} Trial Has Ended`)}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge('free')}
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>

      <p style="color: #475569; margin: 0 0 24px 0;">
        Your ${tierDisplay} trial ended on ${expirationDate}. Your account has been downgraded to the Free tier.
      </p>

      <div style="margin: 24px 0; padding: 16px; background: #f1f5f9; border-radius: 8px;">
        <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
          Good news! Your work is safe.
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px;">
          <li style="margin-bottom: 4px;">All your generated documentation is still accessible</li>
          <li style="margin-bottom: 4px;">Your account and settings are preserved</li>
          <li>You can upgrade anytime to unlock Pro features again</li>
        </ul>
      </div>

      ${sectionHeading('Free Tier Limits')}
      ${contentBox(`
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          <li style="margin-bottom: 8px;">5 generations per day</li>
          <li style="margin-bottom: 8px;">Basic documentation types only</li>
          <li>Attribution watermark in output</li>
        </ul>
      `)}

      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Upgrade to Pro', `${clientUrl}/pricing`)}
      </div>

      <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
        Thank you for trying CodeScribe AI!
      </p>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML(`Your ${tierDisplay} Trial Has Ended - CodeScribe AI`, content);
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

  const content = `
    ${emailHeader('Great News!', `Your ${tierDisplay} trial has been extended`)}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(trialTier)}
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>

      <div style="margin: 24px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
        <p style="color: #166534; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          Trial Extended by ${additionalDays} Days!
        </p>
        <p style="color: #475569; font-size: 14px; margin: 0;">
          Your ${tierDisplay} trial now expires on <strong>${newExpirationDate}</strong>.
        </p>
      </div>

      <p style="color: #475569; margin: 0 0 24px 0;">
        Continue exploring all the powerful features CodeScribe AI has to offer:
      </p>

      ${contentBox(`
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          <li style="margin-bottom: 8px;">Generate unlimited documentation</li>
          <li style="margin-bottom: 8px;">Process multiple files at once</li>
          <li style="margin-bottom: 8px;">Use all documentation types</li>
          <li>Get priority processing speeds</li>
        </ul>
      `)}

      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Start Generating', clientUrl)}
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML(`Your ${tierDisplay} Trial Extended - CodeScribe AI`, content);
}
