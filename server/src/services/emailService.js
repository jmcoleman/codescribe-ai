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

export default {
  sendPasswordResetEmail,
  sendVerificationEmail
};
