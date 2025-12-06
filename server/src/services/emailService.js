/**
 * Email Service
 *
 * Handles sending emails via Resend API for:
 * - Email verification
 * - Password reset
 * - Other transactional emails
 */

import { Resend } from 'resend';
import {
  passwordResetTemplate,
  emailVerificationTemplate,
  supportRequestTemplate,
  contactSalesTemplate,
  deletionScheduledTemplate,
  accountRestoredTemplate,
  finalDeletionWarningTemplate,
  trialExpiringReminderTemplate,
  trialExpiredNoticeTemplate,
  trialExtendedTemplate
} from './emailTemplates/index.js';

// Initialize Resend lazily - will be created when needed
// This allows tests to set env vars before initialization
let resend = null;

/**
 * Determine whether to mock emails or send real emails via Resend
 *
 * Behavior:
 * - MOCK_EMAILS=true: Always mock (dev, test, production)
 * - MOCK_EMAILS=false: Always send real emails (dev, test, production)
 * - MOCK_EMAILS not set: Mock in dev/test, real in production (safe default)
 *
 * @returns {boolean} True if emails should be mocked, false to send real emails
 */
function shouldMockEmails() {
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  const MOCK_EMAILS = process.env.MOCK_EMAILS;
  const HAS_RESEND_KEY = !!process.env.RESEND_API_KEY;

  // If MOCK_EMAILS is explicitly set, respect it
  if (MOCK_EMAILS === 'true') return true;
  if (MOCK_EMAILS === 'false') {
    // Safety check: don't send real emails if no API key
    if (!HAS_RESEND_KEY) {
      console.warn('⚠️ MOCK_EMAILS=false but RESEND_API_KEY not set. Forcing mocking.');
      return true;
    }
    return false;
  }

  // Otherwise: mock in dev/test, real in production (safe default)
  return !IS_PRODUCTION;
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
    html: passwordResetTemplate({
      userEmail: to,
      resetLink: resetUrl,
      expirationMinutes: 60,
      currentTier: undefined, // No tier for transactional emails
      environment: process.env.NODE_ENV,
      clientUrl: CLIENT_URL
    })
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
 * @param {string} [options.trialCode] - Optional trial invite code to embed in URL
 * @param {string} [options.subscriptionTier] - Optional subscription tier to embed in URL
 * @param {string} [options.subscriptionBillingPeriod] - Optional billing period (monthly/yearly)
 * @param {string} [options.subscriptionTierName] - Optional display name for the tier
 * @returns {Promise<Object>} Send result
 */
export async function sendVerificationEmail({ to, verificationToken, trialCode, subscriptionTier, subscriptionBillingPeriod, subscriptionTierName }) {
  let verifyUrl = `${CLIENT_URL}/verify-email?token=${verificationToken}`;
  // Append trial code to verification URL if provided
  if (trialCode) {
    verifyUrl += `&trial_code=${encodeURIComponent(trialCode)}`;
  }
  // Append subscription info to verification URL if provided
  if (subscriptionTier) {
    verifyUrl += `&sub_tier=${encodeURIComponent(subscriptionTier)}`;
    if (subscriptionBillingPeriod) {
      verifyUrl += `&sub_period=${encodeURIComponent(subscriptionBillingPeriod)}`;
    }
    if (subscriptionTierName) {
      verifyUrl += `&sub_name=${encodeURIComponent(subscriptionTierName)}`;
    }
  }

  const emailData = {
    from: FROM_EMAIL,
    to,
    subject: 'Verify Your Email - CodeScribe AI',
    html: emailVerificationTemplate({
      userEmail: to,
      verificationLink: verifyUrl,
      expirationHours: 24,
      currentTier: undefined, // No tier for transactional emails
      environment: process.env.NODE_ENV,
      clientUrl: CLIENT_URL
    })
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
export async function sendContactSalesEmail({ userName, userEmail, userId, currentTier, interestedTier, subject: userSubject, message }) {
  // Build email subject line using free-form subject text
  const subject = userSubject
    ? `Sales Inquiry: ${userSubject}`
    : `Sales Inquiry from ${userName || userEmail}`;

  // Sales email destination
  // Default to sales@codescribeai.com (works if domain is verified in Resend)
  // Override with SALES_EMAIL env var to send directly to personal email (useful for dev/free tier)
  const salesEmail = process.env.SALES_EMAIL || 'sales@codescribeai.com';

  // Generate email HTML using template
  const html = contactSalesTemplate({
    userName,
    userEmail,
    userId,
    currentTier,
    interestedTier,
    subject: userSubject,
    message,
    environment: process.env.NODE_ENV,
    clientUrl: CLIENT_URL
  });

  // Format "from" to show user's name for better context
  // e.g., "John Doe via CodeScribe AI <noreply@mail.codescribeai.com>"
  const fromField = userName
    ? `${userName} via CodeScribe AI <noreply@mail.codescribeai.com>`
    : FROM_EMAIL;

  const emailData = {
    from: fromField,
    to: salesEmail,
    replyTo: userEmail,
    subject,
    html
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
 * @param {Array} [options.attachments] - Optional file attachments (array of {filename, content, contentType})
 * @returns {Promise<Object>} Send result
 */
export async function sendSupportEmail({ userName, userEmail, userId, currentTier, contactType, subjectText, message, attachments = [] }) {
  const contactTypeLabels = {
    general: 'General Question',
    bug: 'Bug Report',
    feature: 'Feature Request',
    account: 'Account Issue',
    billing: 'Billing Question',
    other: 'Other'
  };

  const contactTypeLabel = contactTypeLabels[contactType] || 'Support Request';

  // Format current date/time for display
  // Format: "Wed, Nov 5, 2025 at 1:53 PM EST"
  const date = new Date();
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  const requestDateTime = `${dateStr} at ${timeStr}`;

  // Build email subject: no tier badge (tier info is in email body + X-Priority header)
  const emailSubject = subjectText
    ? `${contactTypeLabel}: ${subjectText}`
    : `${contactTypeLabel} from ${userName || userEmail}`;

  // Format "from" to show user's name for better context
  // e.g., "John Doe via CodeScribe AI <noreply@mail.codescribeai.com>"
  const fromField = userName
    ? `${userName} via CodeScribe AI <noreply@mail.codescribeai.com>`
    : FROM_EMAIL;

  // Support email destination
  // Default to support@codescribeai.com (works if domain is verified in Resend)
  // Override with SUPPORT_EMAIL env var to send directly to personal email (useful for dev/free tier)
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@codescribeai.com';

  // Generate email HTML using template
  const html = supportRequestTemplate({
    userName,
    userEmail,
    userId,
    currentTier,
    contactType,
    subjectText,
    message,
    attachments,
    requestDateTime,
    contactTypeLabel,
    environment: process.env.NODE_ENV,
    clientUrl: CLIENT_URL
  });

  // Map tier to email priority (for sorting in inbox)
  // Enterprise/Team: Urgent (1) - 4-hour SLA
  // Pro: High (2) - 24-hour SLA
  // Starter: Normal (3) - 48-hour SLA
  // Free: Low (5) - 5-day SLA
  const tierPriority = {
    enterprise: { priority: 1, sla: '4 hours' },
    team: { priority: 1, sla: '4 hours' },
    pro: { priority: 2, sla: '24 hours' },
    starter: { priority: 3, sla: '48 hours' },
    free: { priority: 5, sla: '5 days' }
  };

  const tier = (currentTier || 'free').toLowerCase();
  const { priority, sla } = tierPriority[tier] || tierPriority.free;

  const emailData = {
    from: fromField,
    to: supportEmail,
    replyTo: userEmail,
    subject: emailSubject,
    html,
    headers: {
      'X-Priority': String(priority),
      'X-MSMail-Priority': priority === 1 ? 'High' : priority === 2 ? 'High' : 'Normal',
      'Importance': priority === 1 ? 'high' : priority === 2 ? 'high' : 'normal',
      'X-CodeScribe-Tier': tier.toUpperCase(),
      'X-CodeScribe-SLA': sla
    }
  };

  // Add attachments to email data if provided
  if (attachments.length > 0) {
    emailData.attachments = attachments;
  }

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
    console.log('  Type:', contactTypeLabel);
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
    html: deletionScheduledTemplate({
      userEmail,
      userName: displayName,
      restoreLink: restoreUrl,
      deletionDate: deletionDateFormatted,
      currentTier: undefined, // No tier for transactional emails
      environment: process.env.NODE_ENV,
      clientUrl: CLIENT_URL
    })
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
    html: accountRestoredTemplate({
      userEmail,
      userName: displayName,
      currentTier: undefined, // No tier for transactional emails
      environment: process.env.NODE_ENV,
      clientUrl: CLIENT_URL
    })
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
    html: finalDeletionWarningTemplate({
      userEmail,
      userName: displayName,
      restoreLink: restoreUrl,
      currentTier: undefined, // No tier for transactional emails
      environment: process.env.NODE_ENV,
      clientUrl: CLIENT_URL
    })
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

/**
 * Send trial expiring reminder email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name or email
 * @param {number} options.daysRemaining - Days until trial expires (1 or 3)
 * @param {string} options.trialTier - Trial tier (e.g., 'pro')
 * @param {Date|string} options.expiresAt - Trial expiration date
 * @returns {Promise<Object>} Send result
 */
export async function sendTrialExpiringEmail({ to, userName, daysRemaining, trialTier = 'pro', expiresAt }) {
  const tierDisplay = trialTier.charAt(0).toUpperCase() + trialTier.slice(1);
  const subject = daysRemaining === 1
    ? `Last day! Your ${tierDisplay} trial expires tomorrow`
    : `Your ${tierDisplay} trial expires in ${daysRemaining} days`;

  const emailData = {
    from: FROM_EMAIL,
    to,
    subject,
    html: trialExpiringReminderTemplate({
      userName: userName || to.split('@')[0],
      daysRemaining,
      trialTier,
      expiresAt,
      environment: process.env.NODE_ENV,
      clientUrl: CLIENT_URL
    })
  };

  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Trial Expiring Reminder');
    console.log('  To:', emailData.to);
    console.log('  Days Remaining:', daysRemaining);
    console.log('  Expires At:', expiresAt);
    console.log('  Email ID:', result.data?.id);
    return result;
  } catch (error) {
    console.error('Failed to send trial expiring email:', error);
    if (error.statusCode === 429 || error.message?.toLowerCase().includes('too many requests')) {
      const customError = new Error('Email service is temporarily unavailable due to high demand. Please try again in a few minutes.');
      customError.code = 'RESEND_RATE_LIMIT';
      customError.statusCode = 503;
      throw customError;
    }
    throw new Error('Failed to send trial expiring email');
  }
}

/**
 * Send trial expired notice email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name or email
 * @param {string} options.trialTier - Trial tier that expired (e.g., 'pro')
 * @param {Date|string} options.expiredAt - When the trial expired
 * @returns {Promise<Object>} Send result
 */
export async function sendTrialExpiredEmail({ to, userName, trialTier = 'pro', expiredAt }) {
  const tierDisplay = trialTier.charAt(0).toUpperCase() + trialTier.slice(1);

  const emailData = {
    from: FROM_EMAIL,
    to,
    subject: `Your ${tierDisplay} Trial Has Ended - CodeScribe AI`,
    html: trialExpiredNoticeTemplate({
      userName: userName || to.split('@')[0],
      trialTier,
      expiredAt,
      environment: process.env.NODE_ENV,
      clientUrl: CLIENT_URL
    })
  };

  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Trial Expired Notice');
    console.log('  To:', emailData.to);
    console.log('  Trial Tier:', trialTier);
    console.log('  Email ID:', result.data?.id);
    return result;
  } catch (error) {
    console.error('Failed to send trial expired email:', error);
    if (error.statusCode === 429 || error.message?.toLowerCase().includes('too many requests')) {
      const customError = new Error('Email service is temporarily unavailable due to high demand. Please try again in a few minutes.');
      customError.code = 'RESEND_RATE_LIMIT';
      customError.statusCode = 503;
      throw customError;
    }
    throw new Error('Failed to send trial expired email');
  }
}

/**
 * Send trial extended confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name or email
 * @param {string} options.trialTier - Trial tier (e.g., 'pro')
 * @param {number} options.additionalDays - Number of days extended
 * @param {Date|string} options.newExpiresAt - New expiration date
 * @param {string} options.reason - Optional reason for extension
 * @returns {Promise<Object>} Send result
 */
export async function sendTrialExtendedEmail({ to, userName, trialTier = 'pro', additionalDays, newExpiresAt, reason }) {
  const tierDisplay = trialTier.charAt(0).toUpperCase() + trialTier.slice(1);

  const emailData = {
    from: FROM_EMAIL,
    to,
    subject: `Your ${tierDisplay} Trial Extended - CodeScribe AI`,
    html: trialExtendedTemplate({
      userName: userName || to.split('@')[0],
      trialTier,
      additionalDays,
      newExpiresAt,
      reason,
      environment: process.env.NODE_ENV,
      clientUrl: CLIENT_URL
    })
  };

  if (shouldMockEmails()) {
    return await mockEmailSend(emailData);
  }

  const client = getResendClient();
  if (!client) {
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    const result = await client.emails.send(emailData);
    console.log('\n📧 [EMAIL SENT] Trial Extended');
    console.log('  To:', emailData.to);
    console.log('  Additional Days:', additionalDays);
    console.log('  New Expires At:', newExpiresAt);
    console.log('  Email ID:', result.data?.id);
    return result;
  } catch (error) {
    console.error('Failed to send trial extended email:', error);
    if (error.statusCode === 429 || error.message?.toLowerCase().includes('too many requests')) {
      const customError = new Error('Email service is temporarily unavailable due to high demand. Please try again in a few minutes.');
      customError.code = 'RESEND_RATE_LIMIT';
      customError.statusCode = 503;
      throw customError;
    }
    throw new Error('Failed to send trial extended email');
  }
}

export default {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendContactSalesEmail,
  sendSupportEmail,
  sendDeletionScheduledEmail,
  sendAccountRestoredEmail,
  sendFinalDeletionWarningEmail,
  sendTrialExpiringEmail,
  sendTrialExpiredEmail,
  sendTrialExtendedEmail
};
