/**
 * Email Service
 *
 * Handles sending emails via Resend API for:
 * - Email verification
 * - Password reset
 * - Other transactional emails
 */

import { Resend } from 'resend';

// Initialize Resend lazily - will be created when needed
// This allows tests to set env vars before initialization
let resend = null;

// Detect environment - mock emails in dev/test, send real emails in production
// TEST_RESEND_MOCK allows tests to bypass MOCK_EMAILS and use their own Resend mocks
function shouldMockEmails() {
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  const TEST_RESEND_MOCK = process.env.TEST_RESEND_MOCK === 'true';
  const MOCK_EMAILS_OVERRIDE = process.env.MOCK_EMAILS === 'true';

  return (!IS_PRODUCTION && !TEST_RESEND_MOCK) || MOCK_EMAILS_OVERRIDE;
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Export for testing - allows tests to reset the client
export function __resetResendClient() {
  resend = null;
}

/**
 * Mock email sending for development/test environments
 * Logs email details instead of actually sending
 * @param {Object} emailData - Email data to mock
 * @returns {Promise<Object>} Mock response
 */
async function mockEmailSend(emailData) {
  console.log('\n📧 [MOCK EMAIL] Would have sent:');
  console.log('  To:', emailData.to);
  console.log('  Subject:', emailData.subject);
  console.log('  From:', emailData.from);
  if (emailData.replyTo) {
    console.log('  Reply-To:', emailData.replyTo);
  }
  if (emailData.html) {
    // Extract URLs from HTML for easy testing
    const urls = emailData.html.match(/https?:\/\/[^\s"<>]+/g);
    if (urls && urls.length > 0) {
      console.log('  Links:', urls[0]); // Show first link (usually the action link)
    }
  }
  console.log('  [Email NOT actually sent - mocked in dev/test mode]\n');

  // Return mock response that matches Resend's response format
  return {
    data: {
      id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    },
    error: null
  };
}

// Configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'CodeScribe AI <noreply@mail.codescribeai.com>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Reusable email footer template
 * @param {string} clientUrl - The client URL to link to
 * @returns {string} HTML footer markup
 */
const getEmailFooter = (clientUrl) => `
  <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 4px 0;">CodeScribe AI - AI-Powered Documentation Generator</p>
    <p style="margin: 4px 0;">
      Need help? Contact us at <a href="mailto:support@codescribeai.com" style="color: #6366f1; text-decoration: none;">support@codescribeai.com</a>
    </p>
    <p style="margin: 4px 0;">
      <a href="${clientUrl}" style="color: #6366f1; text-decoration: none;">Visit our website</a>
    </p>
  </div>
`;

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.resetToken - Password reset token
 * @returns {Promise<Object>} Send result
 */
export async function sendPasswordResetEmail({ to, resetToken }) {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;

  const emailData = {
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Password - CodeScribe AI',
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #9333ea 0%, #6366f1 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">CodeScribe AI</h1>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">Reset Your Password</h2>

              <p style="color: #475569; font-size: 16px; margin: 20px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}"
                   style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
                          color: white;
                          padding: 14px 32px;
                          text-decoration: none;
                          border-radius: 6px;
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 24px 0 8px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #6366f1; font-size: 14px; word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 4px; margin: 0;">
                ${resetUrl}
              </p>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 8px 0;">
                  <strong>This link will expire in 1 hour.</strong>
                </p>
                <p style="color: #64748b; font-size: 14px; margin: 8px 0;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                </p>
              </div>
            </div>

            ${getEmailFooter(CLIENT_URL)}
          </body>
        </html>
      `
  };

  // Mock in dev/test, send real emails in production
  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  // Production: send real email via Resend
  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Password Reset');
    console.log('  To:', emailData.to);
    console.log('  Subject:', emailData.subject);
    console.log('  Reset URL:', resetUrl);
    console.log('  Email ID:', result.data?.id);
    console.log('  Timestamp:', new Date().toISOString());
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack?.split('\n')[0]
    });

    // Check if it's a Resend rate limit error (429 Too Many Requests)
    if (error.statusCode === 429 || error.message?.toLowerCase().includes('too many requests')) {
      const customError = new Error('Email service is temporarily unavailable due to high demand. Please try again in a few minutes.');
      customError.code = 'RESEND_RATE_LIMIT';
      customError.statusCode = 503; // Service Unavailable
      throw customError;
    }

    throw new Error('Failed to send password reset email');
  }
}

/**
 * Send email verification email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.verificationToken - Email verification token
 * @returns {Promise<Object>} Send result
 */
export async function sendVerificationEmail({ to, verificationToken }) {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${verificationToken}`;

  const emailData = {
    from: FROM_EMAIL,
    to,
    subject: 'Verify Your Email - CodeScribe AI',
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #9333ea 0%, #6366f1 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">CodeScribe AI</h1>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">Welcome to CodeScribe AI!</h2>

              <p style="color: #475569; font-size: 16px; margin: 20px 0;">
                Thanks for signing up! Please verify your email address to get started:
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}"
                   style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
                          color: white;
                          padding: 14px 32px;
                          text-decoration: none;
                          border-radius: 6px;
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Verify Email
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin: 24px 0 8px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #6366f1; font-size: 14px; word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 4px; margin: 0;">
                ${verifyUrl}
              </p>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 8px 0;">
                  <strong>This link will expire in 24 hours.</strong>
                </p>
                <p style="color: #64748b; font-size: 14px; margin: 8px 0;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
            </div>

            ${getEmailFooter(CLIENT_URL)}
          </body>
        </html>
      `
  };

  // Mock in dev/test, send real emails in production
  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  // Production: send real email via Resend
  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Email Verification');
    console.log('  To:', emailData.to);
    console.log('  Subject:', emailData.subject);
    console.log('  Verify URL:', verifyUrl);
    console.log('  Email ID:', result.data?.id);
    console.log('  Timestamp:', new Date().toISOString());
    return result;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack?.split('\n')[0]
    });

    // Check if it's a Resend rate limit error (429 Too Many Requests)
    if (error.statusCode === 429 || error.message?.toLowerCase().includes('too many requests')) {
      const customError = new Error('Email service is temporarily unavailable due to high demand. Please try again in a few minutes.');
      customError.code = 'RESEND_RATE_LIMIT';
      customError.statusCode = 503; // Service Unavailable
      throw customError;
    }

    throw new Error('Failed to send verification email');
  }
}

/**
 * Send contact sales inquiry email
 * @param {Object} options - Email options
 * @param {string} options.userName - User's full name
 * @param {string} options.userEmail - User's email
 * @param {string} options.userId - User's ID
 * @param {string} options.currentTier - User's current tier
 * @param {string} options.interestedTier - Tier they're interested in (enterprise/team)
 * @param {string} options.message - User's message (optional)
 * @returns {Promise<Object>} Send result
 */
export async function sendContactSalesEmail({ userName, userEmail, userId, currentTier, interestedTier, message }) {
  const subject = `${interestedTier.charAt(0).toUpperCase() + interestedTier.slice(1)} Plan Inquiry from ${userName || userEmail}`;

  const emailData = {
    from: FROM_EMAIL,
    to: 'sales@codescribeai.com',
    replyTo: userEmail,
    subject,
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Contact Sales Inquiry</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #9333ea 0%, #6366f1 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Sales Inquiry</h1>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">
                ${interestedTier.charAt(0).toUpperCase() + interestedTier.slice(1)} Plan Inquiry
              </h2>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <h3 style="color: #475569; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Contact Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 120px;">Name:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${userName || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email:</td>
                    <td style="padding: 8px 0; color: #1e293b;"><a href="mailto:${userEmail}" style="color: #6366f1; text-decoration: none;">${userEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">User ID:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${userId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Current Tier:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Interested In:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${interestedTier.charAt(0).toUpperCase() + interestedTier.slice(1)} Plan</td>
                  </tr>
                </table>
              </div>

              ${message ? `
                <div style="margin: 24px 0;">
                  <h3 style="color: #475569; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Additional Message</h3>
                  <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #6366f1;">
                    <p style="color: #1e293b; margin: 0; white-space: pre-wrap;">${message}</p>
                  </div>
                </div>
              ` : ''}

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  <strong>Next Steps:</strong> Respond directly to this email or reach out to ${userEmail} to schedule a call.
                </p>
              </div>
            </div>

            ${getEmailFooter(CLIENT_URL)}
          </body>
        </html>
      `
  };

  // Mock in dev/test, send real emails in production
  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  // Production: send real email via Resend
  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Contact Sales Inquiry');
    console.log('  To:', emailData.to);
    console.log('  From User:', userEmail);
    console.log('  Subject:', emailData.subject);
    console.log('  Interested Tier:', interestedTier);
    console.log('  Email ID:', result.data?.id);
    console.log('  Timestamp:', new Date().toISOString());
    return result;
  } catch (error) {
    console.error('Failed to send contact sales email:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack?.split('\n')[0]
    });

    // Check if it's a Resend rate limit error (429 Too Many Requests)
    if (error.statusCode === 429 || error.message?.toLowerCase().includes('too many requests')) {
      const customError = new Error('Email service is temporarily unavailable due to high demand. Please try again in a few minutes.');
      customError.code = 'RESEND_RATE_LIMIT';
      customError.statusCode = 503; // Service Unavailable
      throw customError;
    }

    throw new Error('Failed to send contact sales email');
  }
}

/**
 * Send support request email
 * @param {Object} options - Email options
 * @param {string} options.userName - User's name
 * @param {string} options.userEmail - User's email
 * @param {string} [options.userId] - User ID (optional for unauthenticated users)
 * @param {string} [options.currentTier] - User's current tier (optional for unauthenticated users)
 * @param {string} options.subject - Support request category
 * @param {string} options.message - Support request message
 * @returns {Promise<Object>} Send result
 */
export async function sendSupportEmail({ userName, userEmail, userId, currentTier, subject, message }) {
  const subjectLabels = {
    general: 'General Question',
    bug: 'Bug Report',
    feature: 'Feature Request',
    account: 'Account Issue',
    billing: 'Billing Question',
    other: 'Other'
  };

  const subjectLabel = subjectLabels[subject] || 'Support Request';
  const emailSubject = `${subjectLabel} from ${userName || userEmail}`;

  // Format "from" to show user's name for better context
  // e.g., "John Doe via CodeScribe AI <noreply@mail.codescribeai.com>"
  const fromField = userName
    ? `${userName} via CodeScribe AI <noreply@mail.codescribeai.com>`
    : FROM_EMAIL;

  const emailData = {
    from: fromField,
    to: 'support@codescribeai.com',
    replyTo: userEmail,
    subject: emailSubject,
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Support Request</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #9333ea 0%, #6366f1 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Support Request</h1>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #6366f1;">
                <h2 style="color: #1e293b; margin: 0; font-size: 20px;">
                  ${subjectLabel}
                </h2>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <h3 style="color: #475569; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Contact Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 120px;">Name:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${userName || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email:</td>
                    <td style="padding: 8px 0; color: #1e293b;"><a href="mailto:${userEmail}" style="color: #6366f1; text-decoration: none;">${userEmail}</a></td>
                  </tr>
                  ${userId ? `
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">User ID:</td>
                      <td style="padding: 8px 0; color: #1e293b;">${userId}</td>
                    </tr>
                  ` : ''}
                  ${currentTier ? `
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Current Tier:</td>
                      <td style="padding: 8px 0; color: #1e293b;">${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Category:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${subjectLabel}</td>
                  </tr>
                </table>
              </div>

              <div style="margin: 24px 0;">
                <h3 style="color: #475569; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Message</h3>
                <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #6366f1;">
                  <p style="color: #1e293b; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
              </div>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  <strong>Next Steps:</strong> Respond directly to this email or reach out to ${userEmail} to assist with their request.
                </p>
              </div>
            </div>

            ${getEmailFooter(CLIENT_URL)}
          </body>
        </html>
      `
  };

  // Mock in dev/test, send real emails in production
  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  // Production: send real email via Resend
  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Support Request');
    console.log('  To:', emailData.to);
    console.log('  From User:', userEmail);
    console.log('  Subject:', emailData.subject);
    console.log('  Category:', subjectLabel);
    console.log('  Email ID:', result.data?.id);
    console.log('  Timestamp:', new Date().toISOString());
    return result;
  } catch (error) {
    console.error('Failed to send support email:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack?.split('\n')[0]
    });

    // Check if it's a Resend rate limit error (429 Too Many Requests)
    if (error.statusCode === 429 || error.message?.toLowerCase().includes('too many requests')) {
      const customError = new Error('Email service is temporarily unavailable due to high demand. Please try again in a few minutes.');
      customError.code = 'RESEND_RATE_LIMIT';
      customError.statusCode = 503; // Service Unavailable
      throw customError;
    }

    throw new Error('Failed to send support email');
  }
}

/**
 * Send account deletion scheduled email
 * Notifies user that their account is scheduled for deletion with restore link
 *
 * @param {string} userEmail - User email address
 * @param {string} userName - User display name
 * @param {string} restoreToken - Restore token for canceling deletion
 * @param {Date} deletionDate - When permanent deletion will occur
 * @returns {Promise<Object>} Email send result
 */
async function sendDeletionScheduledEmail(userEmail, userName, restoreToken, deletionDate) {
  const restoreUrl = `${CLIENT_URL}/restore-account?token=${restoreToken}`;
  const displayName = userName || userEmail.split('@')[0];

  // Format deletion date
  const deletionDateFormatted = new Date(deletionDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
  });

  const emailData = {
    from: FROM_EMAIL,
    to: userEmail,
    subject: 'Account Deletion Scheduled - CodeScribe AI',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deletion Scheduled</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155;">
        <table role="presentation" style="width: 100%; background-color: #f8fafc;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 40px 32px;">
                    <!-- Header with gradient -->
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 24px; border-radius: 8px 8px 0 0; margin: -40px -40px 32px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
                        ⚠️ Account Deletion Scheduled
                      </h1>
                    </div>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      Hi ${displayName},
                    </p>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      We've received your request to delete your CodeScribe AI account. Your account is scheduled for permanent deletion on:
                    </p>

                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 0 0 24px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #dc2626;">
                        ${deletionDateFormatted}
                      </p>
                    </div>

                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; margin: 0 0 24px; border-radius: 4px;">
                      <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1e40af;">
                        ℹ️ What happens next:
                      </h3>
                      <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 14px; color: #1e3a8a;">
                        <li style="margin-bottom: 4px;">Your account remains accessible for <strong>30 days</strong></li>
                        <li style="margin-bottom: 4px;">You can cancel deletion anytime by clicking the button below</li>
                        <li style="margin-bottom: 4px;">After 30 days, all your data will be permanently deleted</li>
                        <li style="margin-bottom: 0;">Deletion includes: profile, usage history, subscription, and preferences</li>
                      </ul>
                    </div>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      <strong>Changed your mind?</strong> Click the button below to restore your account:
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${restoreUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.2);">
                        Restore My Account
                      </a>
                    </div>

                    <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">
                      Or copy and paste this URL into your browser:<br>
                      <a href="${restoreUrl}" style="color: #7c3aed; word-break: break-all;">${restoreUrl}</a>
                    </p>

                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 14px; color: #64748b;">
                        If you did not request account deletion, please contact us immediately at <a href="mailto:support@codescribeai.com" style="color: #7c3aed;">support@codescribeai.com</a>.
                      </p>
                    </div>

                    ${getEmailFooter(CLIENT_URL)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  // Mock in dev/test, send real emails in production
  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  // Production: send real email via Resend
  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Account Deletion Scheduled');
    console.log('  To:', userEmail);
    console.log('  Deletion Date:', deletionDateFormatted);
    console.log('  Email ID:', result.data?.id);
    return result;
  } catch (error) {
    console.error('Failed to send deletion scheduled email:', error);
    throw new Error('Failed to send deletion scheduled email');
  }
}

/**
 * Send account restored confirmation email
 * Notifies user that their account deletion was successfully canceled
 *
 * @param {string} userEmail - User email address
 * @param {string} userName - User display name
 * @returns {Promise<Object>} Email send result
 */
async function sendAccountRestoredEmail(userEmail, userName) {
  const displayName = userName || userEmail.split('@')[0];

  const emailData = {
    from: FROM_EMAIL,
    to: userEmail,
    subject: 'Account Restored Successfully - CodeScribe AI',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Restored</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155;">
        <table role="presentation" style="width: 100%; background-color: #f8fafc;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 40px 32px;">
                    <!-- Header with gradient -->
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 8px 8px 0 0; margin: -40px -40px 32px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
                        ✅ Account Restored Successfully
                      </h1>
                    </div>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      Hi ${displayName},
                    </p>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      Great news! Your CodeScribe AI account has been successfully restored. The scheduled deletion has been canceled.
                    </p>

                    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 24px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #065f46;">
                        Your account is now active and all features are available.
                      </p>
                    </div>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      You can continue using CodeScribe AI without any interruption. All your data and settings have been preserved.
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${CLIENT_URL}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.2);">
                        Go to Dashboard
                      </a>
                    </div>

                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 14px; color: #64748b;">
                        If you have any questions, feel free to contact us at <a href="mailto:support@codescribeai.com" style="color: #7c3aed;">support@codescribeai.com</a>.
                      </p>
                    </div>

                    ${getEmailFooter(CLIENT_URL)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  // Mock in dev/test, send real emails in production
  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  // Production: send real email via Resend
  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Account Restored');
    console.log('  To:', userEmail);
    console.log('  Email ID:', result.data?.id);
    return result;
  } catch (error) {
    console.error('Failed to send account restored email:', error);
    throw new Error('Failed to send account restored email');
  }
}

/**
 * Send final deletion warning email (sent 24 hours before permanent deletion)
 * Last chance notification before permanent deletion
 *
 * @param {string} userEmail - User email address
 * @param {string} userName - User display name
 * @param {string} restoreToken - Restore token for canceling deletion
 * @returns {Promise<Object>} Email send result
 */
async function sendFinalDeletionWarningEmail(userEmail, userName, restoreToken) {
  const restoreUrl = `${CLIENT_URL}/restore-account?token=${restoreToken}`;
  const displayName = userName || userEmail.split('@')[0];

  const emailData = {
    from: FROM_EMAIL,
    to: userEmail,
    subject: '⚠️ FINAL WARNING: Account Deletion Tomorrow - CodeScribe AI',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Final Deletion Warning</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155;">
        <table role="presentation" style="width: 100%; background-color: #f8fafc;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 40px 32px;">
                    <!-- Header with gradient -->
                    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 24px; border-radius: 8px 8px 0 0; margin: -40px -40px 32px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
                        ⚠️ FINAL WARNING: Deletion Tomorrow
                      </h1>
                    </div>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      Hi ${displayName},
                    </p>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      This is your <strong>final reminder</strong> that your CodeScribe AI account will be <strong>permanently deleted in 24 hours</strong>.
                    </p>

                    <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 16px; margin: 0 0 24px; border-radius: 4px;">
                      <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #dc2626;">
                        ⏰ This is your last chance!
                      </h3>
                      <p style="margin: 0; font-size: 14px; color: #7f1d1d;">
                        After 24 hours, all your data will be permanently deleted and cannot be recovered.
                      </p>
                    </div>

                    <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
                      If you want to keep your account, click the button below immediately:
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${restoreUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                        Restore My Account Now
                      </a>
                    </div>

                    <p style="margin: 24px 0 0; font-size: 14px; color: #64748b;">
                      Or copy and paste this URL into your browser:<br>
                      <a href="${restoreUrl}" style="color: #dc2626; word-break: break-all;">${restoreUrl}</a>
                    </p>

                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 14px; color: #64748b;">
                        If you're ready to say goodbye, you don't need to do anything. Your account will be automatically deleted tomorrow.
                      </p>
                    </div>

                    ${getEmailFooter(CLIENT_URL)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  // Mock in dev/test, send real emails in production
  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  // Production: send real email via Resend
  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Final Deletion Warning');
    console.log('  To:', userEmail);
    console.log('  Email ID:', result.data?.id);
    return result;
  } catch (error) {
    console.error('Failed to send final deletion warning email:', error);
    throw new Error('Failed to send final deletion warning email');
  }
}

export default {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendContactSalesEmail,
  sendSupportEmail,
  sendDeletionScheduledEmail,
  sendAccountRestoredEmail,
  sendFinalDeletionWarningEmail
};
