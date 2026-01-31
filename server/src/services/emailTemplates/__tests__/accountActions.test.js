/**
 * Tests for Account Action Email Templates
 */

import { describe, it, expect } from '@jest/globals';
import {
  accountSuspendedTemplate,
  accountUnsuspendedTemplate,
  trialGrantedByAdminTemplate
} from '../accountActions.js';

describe('Account Action Email Templates', () => {
  const baseParams = {
    userName: 'John Doe',
    environment: 'production',
    clientUrl: 'https://codescribeai.com'
  };

  describe('accountSuspendedTemplate', () => {
    it('should generate valid HTML email', () => {
      const html = accountSuspendedTemplate({
        ...baseParams,
        reason: 'Terms of service violation',
        suspendedUntil: '2026-02-14T00:00:00Z'
      });

      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<html lang="en"');
      expect(html).toContain('Account Suspended');
      expect(html).toContain('John Doe');
      expect(html).toContain('Reason for Suspension');
      expect(html).toContain('Terms of service violation');
      expect(html).toContain('February');
      expect(html).toContain('2026');
    });

    it('should handle indefinite suspension', () => {
      const html = accountSuspendedTemplate({
        ...baseParams,
        reason: 'Payment fraud detected',
        suspendedUntil: null
      });

      expect(html).toContain('Account Suspended');
      expect(html).toContain('Payment fraud detected');
      expect(html).not.toContain('scheduled for deletion');
    });
  });

  describe('accountUnsuspendedTemplate', () => {
    it('should generate valid HTML email', () => {
      const html = accountUnsuspendedTemplate(baseParams);

      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<html lang="en"');
      expect(html).toContain('Account Restored');
      expect(html).toContain('John Doe');
      expect(html).toContain('suspension');
      expect(html).toContain('Welcome Back');
      expect(html).toContain('Access Your Account');
    });

    it('should have substantive content', () => {
      const html = accountUnsuspendedTemplate(baseParams);

      expect(html.length).toBeGreaterThan(1000);
      expect(html).toContain('reactivated');
      expect(html).toContain('restored');
    });
  });

  describe('trialGrantedByAdminTemplate', () => {
    it('should generate valid HTML email for Pro tier', () => {
      const html = trialGrantedByAdminTemplate({
        ...baseParams,
        trialTier: 'pro',
        durationDays: 14,
        expiresAt: '2026-02-14T00:00:00Z'
      });

      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<html lang="en"');
      expect(html).toContain('Trial');
      expect(html).toContain('John Doe');
      expect(html).toContain('Pro');
      expect(html).toContain('14');
      expect(html).toContain('February');
    });

    it('should generate valid HTML email for Team tier', () => {
      const html = trialGrantedByAdminTemplate({
        ...baseParams,
        trialTier: 'team',
        durationDays: 30,
        expiresAt: '2026-03-14T00:00:00Z'
      });

      expect(html).toContain('Team');
      expect(html).toContain('30');
      expect(html).toContain('March');
    });
  });


  describe('HTML structure validation', () => {
    it('should have complete HTML structure in all templates', () => {
      const templates = [
        accountSuspendedTemplate({
          ...baseParams,
          reason: 'Test',
          suspendedUntil: null
        }),
        accountUnsuspendedTemplate(baseParams),
        trialGrantedByAdminTemplate({
          ...baseParams,
          trialTier: 'pro',
          durationDays: 14,
          expiresAt: '2026-02-14T00:00:00Z'
        })
      ];

      templates.forEach(html => {
        expect(html).toContain('<!doctype html>');
        expect(html).toContain('<html lang="en"');
        expect(html).toContain('<head>');
        expect(html).toContain('<body');
        expect(html).toContain('</body>');
        expect(html).toContain('</html>');
        expect(html).toContain('CodeScribe');
        expect(html.length).toBeGreaterThan(500); // Ensure substantive content
      });
    });

    it('should include proper meta tags', () => {
      const html = accountSuspendedTemplate({
        ...baseParams,
        reason: 'Test',
        suspendedUntil: null
      });

      expect(html).toContain('charset="utf-8"');
      expect(html).toContain('viewport');
    });
  });

  describe('Environment handling', () => {
    it('should include environment label in non-production', () => {
      const html = accountSuspendedTemplate({
        ...baseParams,
        reason: 'Test suspension',
        suspendedUntil: null,
        environment: 'development'
      });

      expect(html).toContain('Development environment');
      expect(html).toContain('Non-production email');
    });

    it('should not include environment label in production', () => {
      const html = accountSuspendedTemplate({
        ...baseParams,
        reason: 'Test suspension',
        suspendedUntil: null,
        environment: 'production'
      });

      expect(html).not.toContain('Development environment');
      expect(html).not.toContain('Staging environment');
      expect(html).not.toContain('Non-production email');
    });
  });

  describe('Date formatting', () => {
    it('should format dates correctly', () => {
      const html = accountSuspendedTemplate({
        ...baseParams,
        reason: 'Test',
        suspendedUntil: '2026-06-15T00:00:00Z'
      });

      expect(html).toContain('June');
      expect(html).toContain('15');
      expect(html).toContain('2026');
    });

    it('should handle various date formats', () => {
      const dateFormats = [
        '2026-02-14T00:00:00Z',
        '2026-02-14T12:30:45.123Z',
        new Date('2026-02-14')
      ];

      dateFormats.forEach(date => {
        const html = accountSuspendedTemplate({
          ...baseParams,
          reason: 'Test',
          suspendedUntil: date
        });

        expect(html).toContain('February');
        expect(html).toContain('14');
        expect(html).toContain('2026');
      });
    });
  });
});
