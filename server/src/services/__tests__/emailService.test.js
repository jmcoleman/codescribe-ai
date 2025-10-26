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
import { sendPasswordResetEmail, sendVerificationEmail, __resetResendClient } from '../emailService.js';

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
        expect.stringContaining('Password reset email sent'),
        expect.any(Object)
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
        expect.stringContaining('Verification email sent'),
        expect.any(Object)
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
});
