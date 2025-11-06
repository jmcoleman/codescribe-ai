/**
 * Password Reset Email Template
 *
 * Template for password reset requests
 */

import {
  baseHTML,
  emailHeader,
  emailFooter,
  sectionHeading,
  primaryButton,
  tierBadge,
  environmentBadge
} from './base.js';

/**
 * Generate password reset email HTML
 *
 * @param {Object} params - Template parameters
 * @param {string} params.userEmail - User's email address
 * @param {string} params.resetLink - Password reset link with token
 * @param {string} params.expirationMinutes - Minutes until link expires
 * @param {string} params.currentTier - User's subscription tier (optional)
 * @param {string} params.environment - Current environment (development, production, etc.)
 * @param {string} params.clientUrl - Base URL for the application
 * @returns {string} HTML email content
 */
export function passwordResetTemplate({
  userEmail,
  resetLink,
  expirationMinutes = 60,
  currentTier,
  environment,
  clientUrl
}) {
  const content = `
    ${emailHeader('Reset Your Password')}

    <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <!-- Tier and Environment Badges -->
      <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
        ${tierBadge(currentTier)}
        ${environmentBadge(environment)}
      </div>

      <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">
        We received a request to reset the password for your CodeScribe AI account: <strong>${userEmail}</strong>
      </p>

      <p style="color: #475569; margin: 0 0 24px 0;">
        Click the button below to reset your password. This link will expire in ${expirationMinutes} minutes.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        ${primaryButton('Reset Password', resetLink)}
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #6366f1; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
        ${resetLink}
      </p>

      <div style="margin-top: 32px; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
      </div>
    </div>

    ${emailFooter(clientUrl)}
  `;

  return baseHTML('Reset Your Password - CodeScribe AI', content);
}
