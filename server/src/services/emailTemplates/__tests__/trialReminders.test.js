/**
 * Trial Reminder Email Templates Tests
 *
 * Tests for trial-related email notification templates:
 * - trialExpiringReminderTemplate (3 days, 1 day)
 * - trialExpiredNoticeTemplate
 * - trialExtendedTemplate
 */

import {
  trialExpiringReminderTemplate,
  trialExpiredNoticeTemplate,
  trialExtendedTemplate
} from '../trialReminders.js';

describe('Trial Reminder Email Templates', () => {
  const baseParams = {
    userName: 'John Doe',
    trialTier: 'pro',
    environment: 'development',
    clientUrl: 'https://codescribeai.com'
  };

  describe('trialExpiringReminderTemplate', () => {
    const expiresAt = new Date('2025-12-15T23:59:59Z');

    describe('with 3 days remaining', () => {
      const params = {
        ...baseParams,
        daysRemaining: 3,
        expiresAt
      };

      it('should include user name in greeting', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('Hi John Doe');
      });

      it('should include Pro tier display', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('Pro Trial');
      });

      it('should include correct days remaining', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('3 days');
      });

      it('should include formatted expiration date', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('December 15, 2025');
      });

      it('should use amber/warning color for 3-day reminder', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('#f59e0b'); // Amber urgency color
        expect(html).toContain('#fffbeb'); // Amber background
      });

      it('should include "Time is Running Out" message', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('Time is Running Out');
      });

      it('should include upgrade button', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('Upgrade to Pro');
        expect(html).toContain('https://codescribeai.com/pricing');
      });

      it('should include features list', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('Unlimited documentation generations');
        expect(html).toContain('Priority processing');
        expect(html).toContain('Multi-file batch processing');
      });

      it('should include contact link', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('contact our team');
        expect(html).toContain('https://codescribeai.com/contact');
      });

      it('should include tier badge', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('Plan: Pro');
      });

      it('should include environment badge in non-production', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('DEVELOPMENT');
      });

      it('should return valid HTML structure', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('<html>');
        expect(html).toContain('</html>');
        expect(html).toContain('<body');
        expect(html).toContain('</body>');
      });
    });

    describe('with 1 day remaining', () => {
      const params = {
        ...baseParams,
        daysRemaining: 1,
        expiresAt
      };

      it('should use red/urgent color for 1-day reminder', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('#dc2626'); // Red urgency color
        expect(html).toContain('#fef2f2'); // Red background
      });

      it('should include "Last Day!" message', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('Last Day!');
      });

      it('should mention losing access after today', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain("you'll lose access to Pro features");
      });

      it('should not pluralize "day"', () => {
        const html = trialExpiringReminderTemplate(params);
        expect(html).toContain('1 day remaining');
        expect(html).not.toContain('1 days remaining');
      });
    });

    describe('with different tiers', () => {
      it('should display team tier correctly', () => {
        const html = trialExpiringReminderTemplate({
          ...baseParams,
          trialTier: 'team',
          daysRemaining: 3,
          expiresAt
        });
        expect(html).toContain('Team Trial');
      });

      it('should default to pro tier if not specified', () => {
        const html = trialExpiringReminderTemplate({
          userName: 'Test User',
          daysRemaining: 3,
          expiresAt,
          environment: 'development',
          clientUrl: 'https://example.com'
        });
        expect(html).toContain('Pro Trial');
      });
    });

    describe('with production environment', () => {
      it('should not include environment badge in production', () => {
        const html = trialExpiringReminderTemplate({
          ...baseParams,
          daysRemaining: 3,
          expiresAt,
          environment: 'production'
        });
        expect(html).not.toContain('PRODUCTION');
        expect(html).not.toContain('DEVELOPMENT');
      });
    });
  });

  describe('trialExpiredNoticeTemplate', () => {
    const expiredAt = new Date('2025-12-15T23:59:59Z');

    const params = {
      ...baseParams,
      expiredAt
    };

    it('should include user name in greeting', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('Hi John Doe');
    });

    it('should include expired tier display', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('Pro Trial Has Ended');
    });

    it('should include expiration date', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('December 15, 2025');
    });

    it('should mention account downgrade to Free', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('downgraded to the Free tier');
    });

    it('should include reassurance about preserved data', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('Good news');
      expect(html).toContain('Your work is safe');
      expect(html).toContain('documentation is still accessible');
      expect(html).toContain('account and settings are preserved');
    });

    it('should include Free tier limits', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('5 generations per day');
      expect(html).toContain('Basic documentation types only');
      expect(html).toContain('Attribution watermark');
    });

    it('should include upgrade button', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('Upgrade to Pro');
      expect(html).toContain('https://codescribeai.com/pricing');
    });

    it('should include thank you message', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('Thank you for trying CodeScribe AI');
    });

    it('should show free tier badge', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('Plan: Free');
    });

    it('should include footer with links', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('Privacy');
      expect(html).toContain('Terms');
    });

    it('should return valid HTML structure', () => {
      const html = trialExpiredNoticeTemplate(params);
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
    });

    it('should default to pro tier if not specified', () => {
      const html = trialExpiredNoticeTemplate({
        userName: 'Test User',
        expiredAt,
        environment: 'test',
        clientUrl: 'https://example.com'
      });
      expect(html).toContain('Pro Trial Has Ended');
    });
  });

  describe('trialExtendedTemplate', () => {
    const newExpiresAt = new Date('2025-12-22T23:59:59Z');

    const params = {
      ...baseParams,
      additionalDays: 7,
      newExpiresAt
    };

    it('should include user name in greeting', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('Hi John Doe');
    });

    it('should include "Great News!" header', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('Great News');
    });

    it('should include number of additional days', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('Extended by 7 Days');
    });

    it('should include new expiration date', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('December 22, 2025');
    });

    it('should use green success color', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('#22c55e'); // Green color
      expect(html).toContain('#f0fdf4'); // Green background
    });

    it('should include features reminder', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('Generate unlimited documentation');
      expect(html).toContain('Process multiple files');
      expect(html).toContain('priority processing');
    });

    it('should include "Start Generating" button', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('Start Generating');
      expect(html).toContain('https://codescribeai.com');
    });

    it('should include tier badge', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('Plan: Pro');
    });

    it('should include footer', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('CodeScribe AI');
      expect(html).toContain('Privacy');
    });

    it('should return valid HTML structure', () => {
      const html = trialExtendedTemplate(params);
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
    });

    it('should default to pro tier if not specified', () => {
      const html = trialExtendedTemplate({
        userName: 'Test User',
        additionalDays: 3,
        newExpiresAt,
        environment: 'test',
        clientUrl: 'https://example.com'
      });
      expect(html).toContain('Pro trial');
    });

    it('should work with different extension amounts', () => {
      const html = trialExtendedTemplate({
        ...params,
        additionalDays: 14
      });
      expect(html).toContain('Extended by 14 Days');
    });

    it('should work with team tier', () => {
      const html = trialExtendedTemplate({
        ...params,
        trialTier: 'team'
      });
      expect(html).toContain('Team trial');
    });
  });

  describe('formatDate helper (tested through templates)', () => {
    it('should format date correctly', () => {
      const html = trialExpiredNoticeTemplate({
        ...baseParams,
        expiredAt: new Date('2025-01-15T12:00:00Z')
      });
      expect(html).toContain('January 15, 2025');
    });

    it('should handle different months', () => {
      const html = trialExpiredNoticeTemplate({
        ...baseParams,
        expiredAt: new Date('2025-06-01T12:00:00Z')
      });
      expect(html).toContain('June 1, 2025');
    });
  });

  describe('HTML structure and accessibility', () => {
    it('should include viewport meta tag', () => {
      const html = trialExpiringReminderTemplate({
        ...baseParams,
        daysRemaining: 3,
        expiresAt: new Date()
      });
      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });

    it('should include charset meta tag', () => {
      const html = trialExpiringReminderTemplate({
        ...baseParams,
        daysRemaining: 3,
        expiresAt: new Date()
      });
      expect(html).toContain('charset="utf-8"');
    });

    it('should include proper font-family fallbacks', () => {
      const html = trialExpiringReminderTemplate({
        ...baseParams,
        daysRemaining: 3,
        expiresAt: new Date()
      });
      expect(html).toContain('font-family');
      expect(html).toContain('Arial');
      expect(html).toContain('sans-serif');
    });
  });
});
