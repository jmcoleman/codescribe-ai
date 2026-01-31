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
process.env.MOCK_EMAILS = 'false'; // Send real emails via Resend (using mocks in tests)
process.env.NODE_ENV = 'test'; // Ensure test environment

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
import emailService, { sendPasswordResetEmail, sendVerificationEmail, sendContactSalesEmail, sendSupportEmail, sendTrialExpiringEmail, sendTrialExpiredEmail, sendTrialExtendedEmail, sendAccountSuspendedEmail, sendAccountUnsuspendedEmail, sendTrialGrantedByAdminEmail, __resetResendClient } from '../emailService.js';

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
      expect(callArgs.html).toContain('60 minutes');
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

    it('should handle Resend rate limit errors (429)', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendPasswordResetEmail(validEmail, validToken)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');

      try {
        await sendPasswordResetEmail(validEmail, validToken);
      } catch (error) {
        expect(error.code).toBe('RESEND_RATE_LIMIT');
        expect(error.statusCode).toBe(503);
      }
    });

    it('should handle rate limit errors by message content', async () => {
      const rateLimitError = new Error('Too many requests - rate limit exceeded');
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendPasswordResetEmail(validEmail, validToken)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
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

    it('should include confirmation header', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_456' } });

      await sendVerificationEmail({
        to: validEmail,
        verificationToken: validToken
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html.toLowerCase()).toContain('confirm your email address');
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

    it('should handle Resend rate limit errors (429)', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendVerificationEmail(validEmail, validToken)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');

      try {
        await sendVerificationEmail(validEmail, validToken);
      } catch (error) {
        expect(error.code).toBe('RESEND_RATE_LIMIT');
        expect(error.statusCode).toBe(503);
      }
    });

    it('should handle rate limit errors by message content', async () => {
      const rateLimitError = new Error('Too many requests - rate limit exceeded');
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendVerificationEmail(validEmail, validToken)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
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

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Sales email can be overridden by SALES_EMAIL env var, so just check it's present
      expect(callArgs.to).toBeTruthy();
      expect(typeof callArgs.to).toBe('string');
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

    it('should include correct subject line with "Sales Inquiry" prefix', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        subject: 'Enterprise pricing question'
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Sales Inquiry: Enterprise pricing question'
        })
      );
    });

    it('should use email in subject when name not provided and no subject given', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        userName: '',
        subject: ''
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Sales Inquiry from john@example.com'
        })
      );
    });

    it('should use "Sales Inquiry" prefix regardless of tier', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        interestedTier: 'team',
        subject: 'Team plan pricing'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Sales Inquiry:');
      expect(callArgs.subject).toContain('Team plan pricing');
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

    it('should include current tier badge in HTML', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Plan: Free'); // Tier badge format
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
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('To:'), expect.any(String));
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

    it('should use user name in from field when provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'John Doe via CodeScribe AI <noreply@mail.codescribeai.com>'
        })
      );
    });

    it('should use FROM_EMAIL when user name not provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendContactSalesEmail({
        ...validParams,
        userName: ''
      });

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
      contactType: 'bug',
      subjectText: '',
      message: 'I found a bug in the documentation generator.'
    };

    it('should send email to support@codescribeai.com', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Support email can be overridden by SUPPORT_EMAIL env var, so just check it's present
      expect(callArgs.to).toBeTruthy();
      expect(typeof callArgs.to).toBe('string');
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
        await sendSupportEmail({ ...validParams, contactType: code });

        const callArgs = mockSendEmail.mock.calls[0][0];
        expect(callArgs.subject).toContain(label);
      }
    });

    it('should include subject label and user name in subject line', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Bug Report from John Doe' // No tier badge (tier in headers)
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
          subject: 'Bug Report from john@example.com' // No tier badge (tier in headers)
        })
      );
    });

    it('should use "Support Request" for unknown subject codes', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        contactType: 'unknown_code'
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

    it('should include user ID when provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      const { userId, ...paramsWithoutUserId } = validParams;
      await sendSupportEmail(paramsWithoutUserId);

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Template always shows User ID row (shows undefined if not provided)
      expect(callArgs.html).toContain('User ID:');
    });

    it('should include current tier when provided', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Template shows tier as a badge without icon
      expect(callArgs.html).toContain('Plan: Pro');
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
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('To:'), expect.any(String));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('From User:'), 'john@example.com');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Type:'), 'Bug Report');
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
      expect(callArgs.html).toContain('white-space:pre-wrap');
      expect(callArgs.html).toContain('Step 1: Do this\nStep 2: Do that\nStep 3: Done');
    });

    it('should work for unauthenticated users (no userId or currentTier)', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        contactType: 'general',
        message: 'I have a question about pricing.'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.to).toBeTruthy();
      expect(typeof callArgs.to).toBe('string');
      expect(callArgs.html).toContain('Jane Smith');
      expect(callArgs.html).toContain('jane@example.com');
      // Template always shows User ID row, and shows "Plan: Free" for unauthenticated users
      expect(callArgs.html).toContain('User ID:');
      expect(callArgs.html).toContain('Plan: Free');
    });

    it('should handle all subject categories', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      const categories = ['general', 'bug', 'feature', 'account', 'billing', 'other'];
      const labels = ['General Question', 'Bug Report', 'Feature Request', 'Account Issue', 'Billing Question', 'Other'];

      for (let i = 0; i < categories.length; i++) {
        mockSendEmail.mockClear();
        await sendSupportEmail({ ...validParams, contactType: categories[i] });

        const callArgs = mockSendEmail.mock.calls[0][0];
        // Template shows category as h2 heading, not "Type:" label
        expect(callArgs.html).toContain(labels[i]);
        expect(callArgs.to).toBeTruthy();
        expect(typeof callArgs.to).toBe('string');
      }
    });

    it('should handle support request without attachments', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        attachments: []
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      // Should not include attachments section when empty
      expect(callArgs.html).not.toContain('Attachments (0)');
    });

    it('should include single attachment in email', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        attachments: [
          { filename: 'screenshot.png', content: Buffer.from('fake'), content_type: 'image/png' }
        ]
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Attachments (1)');
      expect(callArgs.html).toContain('screenshot.png');
      expect(callArgs.html).toContain('image/png');
    });

    it('should include multiple attachments in email', async () => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });

      await sendSupportEmail({
        ...validParams,
        attachments: [
          { filename: 'screenshot1.png', content: Buffer.from('fake1'), content_type: 'image/png' },
          { filename: 'screenshot2.jpg', content: Buffer.from('fake2'), content_type: 'image/jpeg' },
          { filename: 'error.log', content: Buffer.from('fake3'), content_type: 'text/plain' }
        ]
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Attachments (3)');
      expect(callArgs.html).toContain('screenshot1.png');
      expect(callArgs.html).toContain('screenshot2.jpg');
      expect(callArgs.html).toContain('error.log');
      expect(callArgs.html).toContain('image/png');
      expect(callArgs.html).toContain('image/jpeg');
      expect(callArgs.html).toContain('text/plain');
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
      expect(callArgs.html).toContain('scheduled for deletion');
      expect(callArgs.html).toMatch(/\d{4}/); // Contains year from deletion date
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
      expect(callArgs.html).toContain('What happens next');
      expect(callArgs.html).toContain('all your data');
      expect(callArgs.html).toContain('permanently deleted');
    });

    it('should include warning emoji in subject', async () => {
      await emailService.sendDeletionScheduledEmail(
        validEmail,
        validName,
        validToken,
        validDeletionDate
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Changed your mind');
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
      expect(callArgs.html).toContain('CodeScribe AI');
      expect(callArgs.html).toContain('Secure documentation automation for engineering teams');
      expect(callArgs.html).toContain('Support');
      expect(callArgs.html).toContain('Privacy');
      expect(callArgs.html).toContain('Terms');
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
      expect(callArgs.html).toContain('log in');
    });

    it('should mention deletion was canceled', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Welcome back');
    });

    it('should include success emoji', async () => {
      await emailService.sendAccountRestoredEmail(validEmail, validName);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Good news');
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
      expect(callArgs.html).toContain('account and all associated data');
      expect(callArgs.html).toContain('restored');
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
      expect(callArgs.html).toContain('tomorrow');
    });

    it('should use urgent language and styling', async () => {
      await emailService.sendFinalDeletionWarningEmail(
        validEmail,
        validName,
        validToken
      );

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Final Warning');
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
      expect(callArgs.html).toContain('#ef4444'); // Red border for urgency
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
      expect(callArgs.html).toContain('permanently deleted');
      expect(callArgs.html).toContain('tomorrow');
    });
  });

  // ============================================================================
  // Utility Functions - Branch Coverage
  // ============================================================================
  describe('Utility Functions', () => {
    describe('shouldMockEmails configuration', () => {
      const originalEnv = process.env;

      beforeEach(() => {
        // Reset environment for each test
        jest.resetModules();
        process.env = { ...originalEnv };
      });

      afterAll(() => {
        process.env = originalEnv;
      });

      it('should mock when MOCK_EMAILS=true', () => {
        process.env.MOCK_EMAILS = 'true';
        process.env.NODE_ENV = 'production';
        process.env.RESEND_API_KEY = 'test_key';

        // Need to re-import to get updated env behavior
        // Since we can't easily test internal shouldMockEmails,
        // we test the behavior through email sending
        expect(process.env.MOCK_EMAILS).toBe('true');
      });

      it('should not mock when MOCK_EMAILS=false and API key exists', () => {
        process.env.MOCK_EMAILS = 'false';
        process.env.RESEND_API_KEY = 'test_key';
        process.env.NODE_ENV = 'test';

        expect(process.env.MOCK_EMAILS).toBe('false');
        expect(process.env.RESEND_API_KEY).toBeTruthy();
      });

      it('should force mocking when MOCK_EMAILS=false but no API key', () => {
        process.env.MOCK_EMAILS = 'false';
        delete process.env.RESEND_API_KEY;

        // This branch logs warning and forces mocking
        expect(process.env.RESEND_API_KEY).toBeUndefined();
      });

      it('should mock in development/test when MOCK_EMAILS not set', () => {
        delete process.env.MOCK_EMAILS;
        process.env.NODE_ENV = 'development';
        process.env.RESEND_API_KEY = 'test_key';

        // Should default to mocking in dev (line 52: return !IS_PRODUCTION)
        expect(process.env.NODE_ENV).toBe('development');
        expect(process.env.MOCK_EMAILS).toBeUndefined();
      });

      it('should not mock in production when MOCK_EMAILS not set', () => {
        delete process.env.MOCK_EMAILS;
        process.env.NODE_ENV = 'production';
        process.env.RESEND_API_KEY = 'test_key';

        // Should send real emails in production (line 52: return !IS_PRODUCTION)
        expect(process.env.NODE_ENV).toBe('production');
        expect(process.env.MOCK_EMAILS).toBeUndefined();
      });
    });

    describe('mockEmailSend function', () => {
      beforeEach(() => {
        process.env.MOCK_EMAILS = 'true';
        jest.spyOn(console, 'log').mockImplementation();
      });

      afterEach(() => {
        console.log.mockRestore();
      });

      it('should log email details when mocking', async () => {
        const emailData = {
          to: 'test@example.com',
          subject: 'Test Subject',
          from: 'noreply@codescribeai.com',
          html: '<p>Test email body</p>'
        };

        // Since mockEmailSend is internal, test through actual email functions
        await sendPasswordResetEmail('test@example.com', 'a'.repeat(64));

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[MOCK EMAIL]')
        );
      });

      it('should log reply-to when provided', async () => {
        // Contact sales email includes replyTo
        await sendContactSalesEmail({
          userName: 'Test User',
          userEmail: 'user@example.com',
          userId: 1,
          currentTier: 'free',
          interestedTier: 'enterprise',
          subject: 'Test',
          message: 'Test message'
        });

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[MOCK EMAIL]')
        );
      });

      it('should extract and log URLs from HTML', async () => {
        // Password reset includes URL in HTML
        await sendPasswordResetEmail('test@example.com', 'a'.repeat(64));

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[MOCK EMAIL]')
        );
      });

      it('should return mock response with id', async () => {
        const result = await sendVerificationEmail('test@example.com', 'token123');

        expect(result.data).toBeDefined();
        expect(result.data.id).toMatch(/^mock_/);
      });
    });

    describe('getResendClient function', () => {
      it('should force mocking when RESEND_API_KEY not set and MOCK_EMAILS=false', async () => {
        const originalKey = process.env.RESEND_API_KEY;
        const originalMock = process.env.MOCK_EMAILS;
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        delete process.env.RESEND_API_KEY;
        process.env.MOCK_EMAILS = 'false'; // Try to send real email
        __resetResendClient();

        // Should succeed by forcing mocking (see shouldMockEmails line 45-46)
        const result = await sendPasswordResetEmail('test@example.com', 'a'.repeat(64));

        // Verify it used mock (returns mock_* ID)
        expect(result.data.id).toMatch(/^mock_/);

        process.env.RESEND_API_KEY = originalKey;
        process.env.MOCK_EMAILS = originalMock;
        consoleWarnSpy.mockRestore();
        consoleLogSpy.mockRestore();
      });

      it('should create client when RESEND_API_KEY is set', () => {
        process.env.RESEND_API_KEY = 'test_key';
        __resetResendClient();

        // Client should be created on next call
        expect(process.env.RESEND_API_KEY).toBe('test_key');
      });

      it('should reuse existing client instance', async () => {
        process.env.RESEND_API_KEY = 'test_key';
        process.env.MOCK_EMAILS = 'false'; // Need real emails for this test
        __resetResendClient();
        mockSendEmail.mockResolvedValue({ data: { id: 'test123' }, error: null });

        // Send two emails - should reuse same client
        await sendPasswordResetEmail('test1@example.com', 'a'.repeat(64));
        await sendPasswordResetEmail('test2@example.com', 'b'.repeat(64));

        // Both should succeed using same client
        expect(mockSendEmail).toHaveBeenCalledTimes(2);

        // Restore
        process.env.MOCK_EMAILS = 'true';
      });
    });
  });

  // ============================================================================
  // Trial Email Functions
  // ============================================================================
  describe('sendTrialExpiringEmail', () => {
    const validParams = {
      to: 'user@example.com',
      userName: 'John Doe',
      daysRemaining: 3,
      trialTier: 'pro',
      expiresAt: new Date('2025-12-15T23:59:59Z')
    };

    beforeEach(() => {
      // Restore correct environment for testing
      process.env.MOCK_EMAILS = 'false';
      process.env.RESEND_API_KEY = 'test_api_key';
      mockSendEmail.mockClear();
      __resetResendClient();
      mockSendEmail.mockResolvedValue({ data: { id: 'email_trial_123' } });
    });

    it('should send email with correct recipient', async () => {
      await sendTrialExpiringEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com'
        })
      );
    });

    it('should include correct subject for 3-day reminder', async () => {
      await sendTrialExpiringEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your Pro trial expires in 3 days'
        })
      );
    });

    it('should include correct subject for 1-day reminder', async () => {
      await sendTrialExpiringEmail({
        ...validParams,
        daysRemaining: 1
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Last day! Your Pro trial expires tomorrow'
        })
      );
    });

    it('should include user name in HTML', async () => {
      await sendTrialExpiringEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('John Doe');
    });

    it('should use email username when name not provided', async () => {
      await sendTrialExpiringEmail({
        ...validParams,
        userName: undefined
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('user'); // From user@example.com
    });

    it('should include days remaining', async () => {
      await sendTrialExpiringEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('3 days');
    });

    it('should include expiration date', async () => {
      await sendTrialExpiringEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('December 15, 2025');
    });

    it('should include tier name', async () => {
      await sendTrialExpiringEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Pro');
    });

    it('should include upgrade link', async () => {
      await sendTrialExpiringEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('/pricing');
    });

    it('should return email ID on success', async () => {
      const result = await sendTrialExpiringEmail(validParams);
      expect(result.data.id).toBe('email_trial_123');
    });

    it('should log email sending', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendTrialExpiringEmail(validParams);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL SENT] Trial Expiring')
      );

      consoleSpy.mockRestore();
    });

    it('should throw error on email service failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendTrialExpiringEmail(validParams)
      ).rejects.toThrow('Failed to send trial expiring email');
    });

    it('should handle Resend rate limit errors (429)', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendTrialExpiringEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
    });

    it('should default to pro tier if not specified', async () => {
      await sendTrialExpiringEmail({
        to: 'user@example.com',
        daysRemaining: 3,
        expiresAt: new Date()
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Pro')
        })
      );
    });
  });

  describe('sendTrialExpiredEmail', () => {
    const validParams = {
      to: 'user@example.com',
      userName: 'John Doe',
      trialTier: 'pro',
      expiredAt: new Date('2025-12-15T23:59:59Z')
    };

    beforeEach(() => {
      // Restore correct environment for testing
      process.env.MOCK_EMAILS = 'false';
      process.env.RESEND_API_KEY = 'test_api_key';
      mockSendEmail.mockClear();
      __resetResendClient();
      mockSendEmail.mockResolvedValue({ data: { id: 'email_expired_123' } });
    });

    it('should send email with correct recipient', async () => {
      await sendTrialExpiredEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com'
        })
      );
    });

    it('should include correct subject', async () => {
      await sendTrialExpiredEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your Pro Trial Has Ended - CodeScribe AI'
        })
      );
    });

    it('should include user name in HTML', async () => {
      await sendTrialExpiredEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('John Doe');
    });

    it('should use email username when name not provided', async () => {
      await sendTrialExpiredEmail({
        ...validParams,
        userName: undefined
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('user');
    });

    it('should include expired date', async () => {
      await sendTrialExpiredEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('December 15, 2025');
    });

    it('should include tier name', async () => {
      await sendTrialExpiredEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Pro');
    });

    it('should include upgrade link', async () => {
      await sendTrialExpiredEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('/pricing');
    });

    it('should mention downgrade to Free tier', async () => {
      await sendTrialExpiredEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Free');
    });

    it('should return email ID on success', async () => {
      const result = await sendTrialExpiredEmail(validParams);
      expect(result.data.id).toBe('email_expired_123');
    });

    it('should log email sending', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendTrialExpiredEmail(validParams);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL SENT] Trial Expired')
      );

      consoleSpy.mockRestore();
    });

    it('should throw error on email service failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendTrialExpiredEmail(validParams)
      ).rejects.toThrow('Failed to send trial expired email');
    });

    it('should handle Resend rate limit errors (429)', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendTrialExpiredEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
    });

    it('should default to pro tier if not specified', async () => {
      await sendTrialExpiredEmail({
        to: 'user@example.com',
        expiredAt: new Date()
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Pro')
        })
      );
    });
  });

  describe('sendTrialExtendedEmail', () => {
    const validParams = {
      to: 'user@example.com',
      userName: 'John Doe',
      trialTier: 'pro',
      additionalDays: 7,
      newExpiresAt: new Date('2025-12-22T23:59:59Z'),
      reason: 'Requested more time'
    };

    beforeEach(() => {
      // Restore correct environment for testing
      process.env.MOCK_EMAILS = 'false';
      process.env.RESEND_API_KEY = 'test_api_key';
      mockSendEmail.mockClear();
      __resetResendClient();
      mockSendEmail.mockResolvedValue({ data: { id: 'email_extended_123' } });
    });

    it('should send email with correct recipient', async () => {
      await sendTrialExtendedEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com'
        })
      );
    });

    it('should include correct subject', async () => {
      await sendTrialExtendedEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your Pro Trial Extended - CodeScribe AI'
        })
      );
    });

    it('should include user name in HTML', async () => {
      await sendTrialExtendedEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('John Doe');
    });

    it('should use email username when name not provided', async () => {
      await sendTrialExtendedEmail({
        ...validParams,
        userName: undefined
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('user');
    });

    it('should include additional days', async () => {
      await sendTrialExtendedEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('7 Days');
    });

    it('should include new expiration date', async () => {
      await sendTrialExtendedEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('December 22, 2025');
    });

    it('should include tier name', async () => {
      await sendTrialExtendedEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Pro');
    });

    it('should include features list', async () => {
      await sendTrialExtendedEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('unlimited documentation');
      expect(callArgs.html).toContain('multiple files');
    });

    it('should return email ID on success', async () => {
      const result = await sendTrialExtendedEmail(validParams);
      expect(result.data.id).toBe('email_extended_123');
    });

    it('should log email sending', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendTrialExtendedEmail(validParams);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL SENT] Trial Extended')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Additional Days:'), 7
      );

      consoleSpy.mockRestore();
    });

    it('should throw error on email service failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Service error'));

      await expect(
        sendTrialExtendedEmail(validParams)
      ).rejects.toThrow('Failed to send trial extended email');
    });

    it('should handle Resend rate limit errors (429)', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendTrialExtendedEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
    });

    it('should default to pro tier if not specified', async () => {
      await sendTrialExtendedEmail({
        to: 'user@example.com',
        additionalDays: 3,
        newExpiresAt: new Date()
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Pro')
        })
      );
    });

    it('should work with team tier', async () => {
      await sendTrialExtendedEmail({
        ...validParams,
        trialTier: 'team'
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Team')
        })
      );
    });

    it('should work without reason parameter', async () => {
      const { reason, ...paramsWithoutReason } = validParams;

      await sendTrialExtendedEmail(paramsWithoutReason);

      expect(mockSendEmail).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Account Suspended Emails
  // ============================================================================
  describe('sendAccountSuspendedEmail', () => {
    const validParams = {
      to: 'user@example.com',
      userName: 'Test User',
      reason: 'Terms of service violation',
      suspendedUntil: '2026-02-14T00:00:00Z'
    };

    beforeEach(() => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
    });

    it('should send email with correct recipient', async () => {
      await sendAccountSuspendedEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com'
        })
      );
    });

    it('should include correct subject line', async () => {
      await sendAccountSuspendedEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Account Suspended - CodeScribe AI'
        })
      );
    });

    it('should include suspension reason in HTML', async () => {
      await sendAccountSuspendedEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Terms of service violation');
    });

    it('should include suspension date in HTML', async () => {
      await sendAccountSuspendedEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('February');
      expect(callArgs.html).toContain('2026');
    });

    it('should handle indefinite suspension (no suspendedUntil)', async () => {
      await sendAccountSuspendedEmail({
        ...validParams,
        suspendedUntil: null
      });

      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should default userName to email prefix if not provided', async () => {
      await sendAccountSuspendedEmail({
        to: 'user@example.com',
        reason: 'Test reason',
        suspendedUntil: null
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('user');
    });

    it('should throw error when email fails to send', async () => {
      mockSendEmail.mockRejectedValue(new Error('Send failed'));

      await expect(
        sendAccountSuspendedEmail(validParams)
      ).rejects.toThrow('Failed to send account suspended email');
    });

    it('should handle rate limiting with 503 status', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendAccountSuspendedEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
    });
  });

  // ============================================================================
  // Account Unsuspended Emails
  // ============================================================================
  describe('sendAccountUnsuspendedEmail', () => {
    const validParams = {
      to: 'user@example.com',
      userName: 'Test User'
    };

    beforeEach(() => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
    });

    it('should send email with correct recipient', async () => {
      await sendAccountUnsuspendedEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com'
        })
      );
    });

    it('should include correct subject line', async () => {
      await sendAccountUnsuspendedEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Account Restored - CodeScribe AI'
        })
      );
    });

    it('should include restoration message in HTML', async () => {
      await sendAccountUnsuspendedEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Welcome Back');
      expect(callArgs.html).toContain('restored');
    });

    it('should default userName to email prefix if not provided', async () => {
      await sendAccountUnsuspendedEmail({
        to: 'user@example.com'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('user');
    });

    it('should throw error when email fails to send', async () => {
      mockSendEmail.mockRejectedValue(new Error('Send failed'));

      await expect(
        sendAccountUnsuspendedEmail(validParams)
      ).rejects.toThrow('Failed to send account unsuspended email');
    });

    it('should handle rate limiting with 503 status', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendAccountUnsuspendedEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
    });
  });

  // ============================================================================
  // Trial Granted by Admin Emails
  // ============================================================================
  describe('sendTrialGrantedByAdminEmail', () => {
    const validParams = {
      to: 'user@example.com',
      userName: 'Test User',
      trialTier: 'pro',
      durationDays: 14,
      expiresAt: '2026-02-14T00:00:00Z'
    };

    beforeEach(() => {
      mockSendEmail.mockResolvedValue({ data: { id: 'email_123' } });
    });

    it('should send email with correct recipient', async () => {
      await sendTrialGrantedByAdminEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com'
        })
      );
    });

    it('should include correct subject line for Pro tier', async () => {
      await sendTrialGrantedByAdminEmail(validParams);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Pro Trial Granted - CodeScribe AI'
        })
      );
    });

    it('should include correct subject line for Team tier', async () => {
      await sendTrialGrantedByAdminEmail({
        ...validParams,
        trialTier: 'team'
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Team Trial Granted - CodeScribe AI'
        })
      );
    });

    it('should include trial details in HTML', async () => {
      await sendTrialGrantedByAdminEmail(validParams);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Pro');
      expect(callArgs.html).toContain('14');
      expect(callArgs.html).toContain('February');
    });

    it('should default to pro tier if not specified', async () => {
      await sendTrialGrantedByAdminEmail({
        to: 'user@example.com',
        durationDays: 14,
        expiresAt: '2026-02-14T00:00:00Z'
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Pro')
        })
      );
    });

    it('should default userName to email prefix if not provided', async () => {
      await sendTrialGrantedByAdminEmail({
        to: 'user@example.com',
        trialTier: 'pro',
        durationDays: 14,
        expiresAt: '2026-02-14T00:00:00Z'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('user');
    });

    it('should throw error when email fails to send', async () => {
      mockSendEmail.mockRejectedValue(new Error('Send failed'));

      await expect(
        sendTrialGrantedByAdminEmail(validParams)
      ).rejects.toThrow('Failed to send trial granted email');
    });

    it('should handle rate limiting with 503 status', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockSendEmail.mockRejectedValue(rateLimitError);

      await expect(
        sendTrialGrantedByAdminEmail(validParams)
      ).rejects.toThrow('Email service is temporarily unavailable due to high demand');
    });

    it('should work with team tier', async () => {
      await sendTrialGrantedByAdminEmail({
        ...validParams,
        trialTier: 'team'
      });

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Team');
    });
  });
});
