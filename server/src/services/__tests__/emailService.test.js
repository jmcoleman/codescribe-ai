/**
 * Email Service Tests
 *
 * Tests for Resend email service integration:
 * - Password reset emails
 * - Email verification emails
 * - Template rendering
 * - Error handling
 */

// Set environment variables before anything else
process.env.RESEND_API_KEY = 'test_api_key';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.TEST_RESEND_MOCK = 'true'; // Use Resend mocks instead of email mocking

// Mock Resend before importing emailService
// Note: Variables must be prefixed with 'mock' to be accessible in jest.mock factory
const mockSendEmail = jest.fn();

jest.mock('resend', () => {
  // The factory function creates the mock module
  // We return a constructor that creates an object with emails.send
  const Resend = function() {
    this.emails = {
      send: mockSendEmail
    };
  };
  return { Resend };
});

// Now import emailService (after env vars and mock are set)
import emailService, { sendPasswordResetEmail, sendVerificationEmail, sendContactSalesEmail, sendSupportEmail, __resetResendClient } from '../emailService.js';

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockClear();
    __resetResendClient(); // Reset client so mock is used
  });

  // ============================================================================
  // Password Reset Emails
  // ============================================================================
  describe('sendPasswordResetEmail', () => {
    const validEmail = 'user@example.com';
    const validToken = 'a'.repeat(64);

    it('should send email with correct recipient', async () => {
      // Try returning just the id wrapped in data
      mockSendEmail.mockImplementation(async () => {
        return { data: { id: 'email_123' }, error: null };
      });

      await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validEmail
        })
      );
    });

    it('should include reset link with token in email', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('/reset-password?token=' + validToken);
    });

    it('should include correct subject line', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Reset Your Password - CodeScribe AI'
        })
      );
    });

    it('should use correct from address', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.from).toMatch(/CodeScribe AI/);
    });

    it('should include expiration warning in email', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('1 hour');
      expect(callArgs.html.toLowerCase()).toContain('expire');
    });

    it('should include security message', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html.toLowerCase()).toContain("didn't request");
      expect(callArgs.html.toLowerCase()).toContain('ignore');
    });

    it('should return email ID on success', async () => {
      const emailId = 'email_123';
      mockSendEmail.mockResolvedValue({ data: { id: emailId } });

      const result = await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      expect(result.data.id).toBe(emailId);
    });

    it('should throw error on email service failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendPasswordResetEmail({
          to: validEmail,
          resetToken: validToken
        })
      ).rejects.toThrow('Failed to send password reset email');
    });

    it('should log email sending', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL SENT] Password Reset')
      );

      consoleSpy.mockRestore();
    });

    it('should handle special characters in email', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
      const specialEmail = 'user+test@example.co.uk';

      await sendPasswordResetEmail({
        to: specialEmail,
        resetToken: validToken
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: specialEmail
        })
      );
    });

    it('should use CLIENT_URL from environment', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: validEmail,
        resetToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:5173/reset-password');
    });
  });

  // ============================================================================
  // Verification Emails
  // ============================================================================
  describe('sendVerificationEmail', () => {
    const validEmail = 'user@example.com';
    const validToken = 'verification_token_123';

    it('should send email with correct recipient', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      await sendVerificationEmail({
        to: validEmail,
        verificationToken: validToken
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validEmail
        })
      );
    });

    it('should include verification link with token', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      await sendVerificationEmail({
        to: validEmail,
        verificationToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('/verify-email?token=' + validToken);
    });

    it('should include correct subject line', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      await sendVerificationEmail({
        to: validEmail,
        verificationToken: validToken
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Verify Your Email - CodeScribe AI'
        })
      );
    });

    it('should include welcome message', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      await sendVerificationEmail({
        to: validEmail,
        verificationToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html.toLowerCase()).toContain('welcome');
    });

    it('should include expiration warning (24 hours)', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      await sendVerificationEmail({
        to: validEmail,
        verificationToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('24 hours');
    });

    it('should return email ID on success', async () => {
      const emailId = 'email_456';
      mockSendEmail.mockResolvedValue({ data: { id: emailId } });

      const result = await sendVerificationEmail({
        to: validEmail,
        verificationToken: validToken
      });

      expect(result.data.id).toBe(emailId);
    });

    it('should throw error on email service failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendVerificationEmail({
          to: validEmail,
          verificationToken: validToken
        })
      ).rejects.toThrow('Failed to send verification email');
    });

    it('should log email sending', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      await sendVerificationEmail({
        to: validEmail,
        verificationToken: validToken
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL SENT] Email Verification')
      );

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // Email Template Quality
  // ============================================================================
  describe('Email Template Quality', () => {
    it('should include CodeScribe AI branding in password reset', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'a'.repeat(64)
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('CodeScribe AI');
    });

    it('should include CodeScribe AI branding in verification', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      await sendVerificationEmail({
        to: 'user@example.com',
        verificationToken: 'token123'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('CodeScribe AI');
    });

    it('should include clickable button in password reset', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'a'.repeat(64)
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toMatch(/href=.*reset-password/);
      expect(callArgs.html.toLowerCase()).toContain('reset password');
    });

    it('should include plain text link as fallback', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'a'.repeat(64)
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Should have both clickable button and plain text URL
      const matches = callArgs.html.match(/reset-password\?token=/g);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should be mobile responsive', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'a'.repeat(64)
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('viewport');
    });

    it('should use brand colors (purple/indigo)', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendPasswordResetEmail({
        to: 'user@example.com',
        resetToken: 'a'.repeat(64)
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toMatch(/#9333ea|#6366f1|purple|indigo/i);
    });
  });

  // ============================================================================
  // Error Logging
  // ============================================================================
  describe('Error Logging', () => {
    it('should log errors when password reset email fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendPasswordResetEmail({
          to: 'user@example.com',
          resetToken: 'token123'
        })
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send password reset email'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should log errors when verification email fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendVerificationEmail({
          to: 'user@example.com',
          verificationToken: 'token123'
        })
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send verification email'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // Contact Sales Emails
  // ============================================================================
  describe('sendContactSalesEmail', () => {
    const validParams = {
      userName: 'John Doe',
      userEmail: 'john@example.com',
      userId: 'user_123',
      currentTier: 'free',
      interestedTier: 'enterprise',
      message: 'I would like to learn more about enterprise features.'
    };

    it('should send email to sales@codescribeai.com', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sales@codescribeai.com'
        })
      );
    });

    it('should include replyTo with user email', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'john@example.com'
        })
      );
    });

    it('should include correct subject line with tier and user name', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Enterprise Plan Inquiry from John Doe'
        })
      );
    });

    it('should use email in subject when name not provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        userName: ''
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Enterprise Plan Inquiry from john@example.com'
        })
      );
    });

    it('should capitalize tier name in subject', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        interestedTier: 'team'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Team Plan Inquiry');
    });

    it('should include user name in email HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('John Doe');
    });

    it('should display "Not provided" when userName is empty', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        userName: ''
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Not provided');
    });

    it('should include user email in HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('john@example.com');
    });

    it('should include user ID in HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('user_123');
    });

    it('should include current tier in HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Free'); // Capitalized
    });

    it('should include interested tier in HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Enterprise Plan');
    });

    it('should include user message when provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('I would like to learn more about enterprise features.');
    });

    it('should omit message section when message is empty', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        message: ''
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).not.toContain('Additional Message');
    });

    it('should omit message section when message is not provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      const { message, ...paramsWithoutMessage } = validParams;
      await sendContactSalesEmail(paramsWithoutMessage);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).not.toContain('Additional Message');
    });

    it('should return email ID on success', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      const result = await sendContactSalesEmail(validParams);

      expect(result.data.id).toBe('email_456');
    });

    it('should log email details on success', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockSendEmail.mockResolvedValue({ data: { id: 'email_789' } });

      await sendContactSalesEmail(validParams);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📧 [EMAIL SENT] Contact Sales Inquiry'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('To:'), 'sales@codescribeai.com');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('From User:'), 'john@example.com');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Interested Tier:'), 'enterprise');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Email ID:'), 'email_789');

      consoleSpy.mockRestore();
    });

    it('should throw error on email service failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendContactSalesEmail(validParams)
      ).rejects.toThrow('Failed to send contact sales email');
    });

    it('should log error details on failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Service error');
      testError.statusCode = 500;
      mockSendEmail.mockRejectedValue(testError);

      await expect(
        sendContactSalesEmail(validParams)
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send contact sales email'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle Resend rate limit errors (429)', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendContactSalesEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');

      try {
        await sendContactSalesEmail(validParams);
      } catch (error) {
        expect(error.code).toBe('RESEND_RATE_LIMIT');
        expect(error.statusCode).toBe(503);
      }
    });

    it('should handle rate limit errors by message content', async () => {
      const rateLimitError = new Error('Too many requests - rate limit exceeded');
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendContactSalesEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
    });

    it('should use correct from address', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      // Uses EMAIL_FROM from environment (dev@mail.codescribeai.com in dev/test)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('CodeScribe AI')
        })
      );
    });

    it('should handle special characters in user name', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        userName: "O'Reilly & Associates"
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Template literals don't auto-escape, so check for original string
      expect(callArgs.html).toContain("O'Reilly & Associates");
    });

    it('should handle special characters in message', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        message: 'Price range: <$1000 & >$500'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Template literals don't auto-escape, so check for original string
      expect(callArgs.html).toContain('Price range: <$1000 & >$500');
    });

    it('should preserve newlines in message', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        message: 'Line 1\nLine 2\nLine 3'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('white-space: pre-wrap');
      expect(callArgs.html).toContain('Line 1\nLine 2\nLine 3');
    });
  });

  // ============================================================================
  // Support Request Emails
  // ============================================================================
  describe('sendSupportEmail', () => {
    const validParams = {
      userName: 'John Doe',
      userEmail: 'john@example.com',
      userId: 'user_123',
      currentTier: 'pro',
      subject: 'bug',
      message: 'I found a bug in the documentation generator.'
    };

    it('should send email to support@codescribeai.com', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'support@codescribeai.com'
        })
      );
    });

    it('should include replyTo with user email', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'john@example.com'
        })
      );
    });

    it('should map subject codes to labels correctly', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      const subjects = [
        { code: 'general', label: 'General Question' },
        { code: 'bug', label: 'Bug Report' },
        { code: 'feature', label: 'Feature Request' },
        { code: 'account', label: 'Account Issue' },
        { code: 'billing', label: 'Billing Question' },
        { code: 'other', label: 'Other' }
      ];

      for (const { code, label } of subjects) {
        mockSendEmail.mockClear();
        await sendSupportEmail({ ...validParams, subject: code });

        const callArgs = mockSendEmail.mock.calls[0][0];
        expect(callArgs.subject).toContain(label);
      }
    });

    it('should include subject label and user name in subject line', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Bug Report from John Doe'
        })
      );
    });

    it('should use email in subject when name not provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        userName: ''
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Bug Report from john@example.com'
        })
      );
    });

    it('should use "Support Request" for unknown subject codes', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        subject: 'unknown_code'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Support Request');
    });

    it('should include user name in from field when provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'John Doe via CodeScribe AI <noreply@mail.codescribeai.com>'
        })
      );
    });

    it('should use FROM_EMAIL when user name not provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        userName: ''
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('CodeScribe AI')
        })
      );
    });

    it('should include user name in email HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('John Doe');
    });

    it('should display "Not provided" when userName is empty', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        userName: ''
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Not provided');
    });

    it('should include user email in HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('john@example.com');
    });

    it('should include user ID when provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('user_123');
    });

    it('should omit user ID section when not provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      const { userId, ...paramsWithoutUserId } = validParams;
      await sendSupportEmail(paramsWithoutUserId);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).not.toContain('User ID:');
    });

    it('should include current tier when provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Pro'); // Capitalized
    });

    it('should omit current tier section when not provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      const { currentTier, ...paramsWithoutTier } = validParams;
      await sendSupportEmail(paramsWithoutTier);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).not.toContain('Current Tier:');
    });

    it('should include subject category label in HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Bug Report');
    });

    it('should include user message in HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('I found a bug in the documentation generator.');
    });

    it('should return email ID on success', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      const result = await sendSupportEmail(validParams);

      expect(result.data.id).toBe('email_456');
    });

    it('should log email details on success', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockSendEmail.mockResolvedValue({ data: { id: 'email_789' } });

      await sendSupportEmail(validParams);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📧 [EMAIL SENT] Support Request'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('To:'), 'support@codescribeai.com');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('From User:'), 'john@example.com');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Category:'), 'Bug Report');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Email ID:'), 'email_789');

      consoleSpy.mockRestore();
    });

    it('should throw error on email service failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendSupportEmail(validParams)
      ).rejects.toThrow('Failed to send support email');
    });

    it('should log error details on failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Service error');
      testError.statusCode = 500;
      mockSendEmail.mockRejectedValue(testError);

      await expect(
        sendSupportEmail(validParams)
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send support email'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle Resend rate limit errors (429)', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendSupportEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');

      try {
        await sendSupportEmail(validParams);
      } catch (error) {
        expect(error.code).toBe('RESEND_RATE_LIMIT');
        expect(error.statusCode).toBe(503);
      }
    });

    it('should handle rate limit errors by message content', async () => {
      const rateLimitError = new Error('Too many requests - rate limit exceeded');
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendSupportEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
    });

    it('should handle special characters in user name', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        userName: "O'Reilly & Associates"
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain("O'Reilly & Associates");
    });

    it('should handle special characters in message', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        message: 'Error: <div> tags & symbols'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Error: <div> tags & symbols');
    });

    it('should preserve newlines in message', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        message: 'Step 1: Do this\nStep 2: Do that\nStep 3: Done'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('white-space: pre-wrap');
      expect(callArgs.html).toContain('Step 1: Do this\nStep 2: Do that\nStep 3: Done');
    });

    it('should work for unauthenticated users (no userId or currentTier)', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        subject: 'general',
        message: 'I have a question about pricing.'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.to).toBe('support@codescribeai.com');
      expect(callArgs.html).toContain('Jane Smith');
      expect(callArgs.html).toContain('jane@example.com');
      expect(callArgs.html).not.toContain('User ID:');
      expect(callArgs.html).not.toContain('Current Tier:');
    });

    it('should handle all subject categories', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      const categories = ['general', 'bug', 'feature', 'account', 'billing', 'other'];

      for (const category of categories) {
        mockSendEmail.mockClear();
        await sendSupportEmail({ ...validParams, subject: category });

        const callArgs = mockSendEmail.mock.calls[0][0];
        expect(callArgs.html).toContain('Category:');
        expect(callArgs.to).toBe('support@codescribeai.com');
      }
    });
  });

  // ============================================================================
  // Account Deletion Emails (Epic 2.5 Phase 4)
  // ============================================================================
  describe('sendDeletionScheduledEmail', () => {
    const validEmail = 'user@example.com';
    const validName = 'John Doe';
    const validToken = 'restore-token-abc123';
    const validDeletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    beforeEach(() => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
    });

    it('should send email with correct recipient', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validEmail
        })
      );
    });

    it('should include correct subject line', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Account Deletion Scheduled - CodeScribe AI'
        })
      );
    });

    it('should include restore link with token', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('/restore-account?token=' + validToken);
    });

    it('should include formatted deletion date', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Should contain date components
      expect(callArgs.html).toMatch(/\d{4}/); // Year
      expect(callArgs.html).toContain('day'); // Weekday (e.g., "Monday")
    });

    it('should display user name in greeting', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain(`Hi ${validName}`);
    });

    it('should fallback to email username when name not provided', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        null,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hi user'); // From user@example.com
    });

    it('should mention 30-day grace period', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('30 days');
    });

    it('should include restore button CTA', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Restore My Account');
    });

    it('should list what data will be deleted', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('profile');
      expect(callArgs.html).toContain('usage history');
      expect(callArgs.html).toContain('subscription');
      expect(callArgs.html).toContain('preferences');
    });

    it('should include warning emoji in subject', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('⚠️');
    });

    it('should use correct from address', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('CodeScribe AI')
        })
      );
    });

    it('should throw error when email sending fails', async () => {
      mockSendEmail.mockRejectedValue(new Error('Network error'));

      await expect(
        emailService.sendDeletionScheduledEmail(
          validEmail,
          validName,
          validToken,
          validDeletionDate
        )
      ).rejects.toThrow('Failed to send deletion scheduled email');
    });

    it('should include footer with support contact', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('support@codescribeai.com');
    });
  });

  describe('sendAccountRestoredEmail', () => {
    const validEmail = 'user@example.com';
    const validName = 'John Doe';

    beforeEach(() => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
    });

    it('should send email with correct recipient', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validEmail
        })
      );
    });

    it('should include correct subject line', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Account Restored Successfully - CodeScribe AI'
        })
      );
    });

    it('should display user name in greeting', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain(`Hi ${validName}`);
    });

    it('should fallback to email username when name not provided', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, null);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hi user'); // From user@example.com
    });

    it('should confirm account is active', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('successfully restored');
      expect(callArgs.html).toContain('now active');
    });

    it('should mention deletion was canceled', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('canceled');
    });

    it('should include success emoji', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('✅');
    });

    it('should include dashboard link CTA', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Go to Dashboard');
      expect(callArgs.html).toContain(process.env.CLIENT_URL);
    });

    it('should use green gradient for success header', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('#10b981'); // Green gradient
    });

    it('should use correct from address', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('CodeScribe AI')
        })
      );
    });

    it('should throw error when email sending fails', async () => {
      mockSendEmail.mockRejectedValue(new Error('Network error'));

      await expect(
        emailService.sendAccountRestoredEmail(validEmail, validName)
      ).rejects.toThrow('Failed to send account restored email');
    });

    it('should mention data was preserved', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('data');
      expect(callArgs.html).toContain('preserved');
    });
  });

  describe('sendFinalDeletionWarningEmail', () => {
    const validEmail = 'user@example.com';
    const validName = 'John Doe';
    const validToken = 'restore-token-abc123';

    beforeEach(() => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
    });

    it('should send email with correct recipient', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validEmail
        })
      );
    });

    it('should include urgent subject line with warning emoji', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('⚠️ FINAL WARNING')
        })
      );
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Tomorrow')
        })
      );
    });

    it('should include restore link with token', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('/restore-account?token=' + validToken);
    });

    it('should display user name in greeting', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain(`Hi ${validName}`);
    });

    it('should fallback to email username when name not provided', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        null,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hi user'); // From user@example.com
    });

    it('should emphasize 24-hour deadline', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('24 hours');
    });

    it('should use urgent language and styling', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('final reminder');
      expect(callArgs.html).toContain('last chance');
      expect(callArgs.html).toContain('permanently deleted');
    });

    it('should use red gradient for urgency', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('#dc2626'); // Red gradient
    });

    it('should include urgent CTA button', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Restore My Account Now');
    });

    it('should warn data cannot be recovered', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('cannot be recovered');
    });

    it('should use correct from address', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('CodeScribe AI')
        })
      );
    });

    it('should throw error when email sending fails', async () => {
      mockSendEmail.mockRejectedValue(new Error('Network error'));

      await expect(
        emailService.sendFinalDeletionWarningEmail(
          validEmail,
          validName,
          validToken
        )
      ).rejects.toThrow('Failed to send final deletion warning email');
    });

    it('should mention automatic deletion if no action taken', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('automatically deleted');
      expect(callArgs.html).toContain('tomorrow');
    });
  });
});
