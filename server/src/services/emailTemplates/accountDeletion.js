/**
 * Account Deletion Email Templates
 *
 * Templates for account deletion flow (scheduled, restored, final warning)
 */

import {
  baseHTML,
  emailHeader,
  emailFooter,
  primaryButton,
  tierBadge,
  environmentBadge
} from './base.js';

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
  const content = `
    ${emailHeader('Account Deletion Scheduled')}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(currentTier)}
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName || 'there'},
      </p>

      <p style="color: #475569; margin: 0 0 24px 0;">
        Your CodeScribe AI account (<strong>${userEmail}</strong>) has been scheduled for deletion on <strong>${deletionDate}</strong>.
      </p>

      <div style="margin: 24px 0; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 12px 0;">
          <strong>Changed your mind?</strong>
        </p>
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          You can restore your account at any time before ${deletionDate} by clicking the button below.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Restore My Account', restoreLink)}
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #6366f1; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
        ${restoreLink}
      </p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          <strong>What happens next:</strong> If you don't restore your account, all your data will be permanently deleted on ${deletionDate}. This action cannot be undone.
        </p>
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Account Deletion Scheduled - CodeScribe AI', content);
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
  const content = `
    ${emailHeader('Account Restored')}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(currentTier)}
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName || 'there'},
      </p>

      <p style="color: #475569; margin: 0 0 24px 0;">
        Good news! Your CodeScribe AI account (<strong>${userEmail}</strong>) has been successfully restored.
      </p>

      <div style="margin: 24px 0; padding: 16px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">
        <p style="color: #065f46; font-size: 14px; margin: 0;">
          <strong>Welcome back!</strong> Your account and all associated data have been restored. You can now log in and continue using CodeScribe AI.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Go to Dashboard', clientUrl)}
      </div>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          If you didn't restore this account, please contact support immediately at <a href="mailto:support@codescribeai.com" style="color: #6366f1; text-decoration: none;">support@codescribeai.com</a>.
        </p>
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Account Restored - CodeScribe AI', content);
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
  const content = `
    ${emailHeader('Final Warning: Account Deletion Tomorrow')}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(currentTier)}
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        Hi ${userName || 'there'},
      </p>

      <div style="margin: 24px 0; padding: 16px; background: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <p style="color: #991b1b; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
          ⚠️ Final Warning
        </p>
        <p style="color: #991b1b; font-size: 14px; margin: 0;">
          Your CodeScribe AI account (<strong>${userEmail}</strong>) will be <strong>permanently deleted tomorrow</strong>.
        </p>
      </div>

      <p style="color: #475569; margin: 24px 0;">
        This is your last chance to restore your account. After tomorrow, all your data will be permanently deleted and cannot be recovered.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Restore My Account Now', restoreLink)}
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #6366f1; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
        ${restoreLink}
      </p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          <strong>What will be deleted:</strong> All your account data, settings, and usage history will be permanently removed. This action cannot be undone.
        </p>
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Final Warning: Account Deletion Tomorrow - CodeScribe AI', content);
}
