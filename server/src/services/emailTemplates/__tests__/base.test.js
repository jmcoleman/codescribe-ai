/**
 * Base Email Template Components Tests
 *
 * Tests for shared email template components and utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  emailHeader,
  emailFooter,
  tierBadge,
  environmentBadge,
  sectionHeading,
  contentBox,
  primaryButton,
  baseHTML,
} from '../base.js';

describe('Base Email Template Components', () => {
  describe('emailHeader', () => {
    it('should render header with title only', () => {
      const html = emailHeader('Welcome');
      expect(html).toContain('Welcome');
      expect(html).toContain('background: linear-gradient');
    });

    it('should render header with title and subtitle', () => {
      const html = emailHeader('Welcome', 'Thanks for signing up');
      expect(html).toContain('Welcome');
      expect(html).toContain('Thanks for signing up');
    });
  });

  describe('emailFooter', () => {
    it('should render footer with links', () => {
      const html = emailFooter('https://codescribeai.com');
      expect(html).toContain('CodeScribe AI');
      expect(html).toContain('Secure documentation automation');
      expect(html).toContain('https://codescribeai.com/contact');
      expect(html).toContain('https://codescribeai.com/privacy');
      expect(html).toContain('https://codescribeai.com/terms');
      expect(html).toContain('Support');
      expect(html).toContain('Privacy');
      expect(html).toContain('Terms');
    });
  });

  describe('tierBadge', () => {
    it('should render free tier', () => {
      const badge = tierBadge('free');
      expect(badge).toBe('Plan: Free');
    });

    it('should render pro tier', () => {
      const badge = tierBadge('pro');
      expect(badge).toBe('Plan: Pro');
    });

    it('should render team tier', () => {
      const badge = tierBadge('team');
      expect(badge).toBe('Plan: Priority');
    });

    it('should render enterprise tier', () => {
      const badge = tierBadge('enterprise');
      expect(badge).toBe('Plan: Priority');
    });

    it('should render starter tier', () => {
      const badge = tierBadge('starter');
      expect(badge).toBe('Plan: Starter');
    });

    it('should handle uppercase tier names', () => {
      const badge = tierBadge('PRO');
      expect(badge).toBe('Plan: Pro');
    });

    it('should default to Free for unknown tiers', () => {
      const badge = tierBadge('unknown');
      expect(badge).toBe('Plan: Free');
    });

    it('should default to Free when tier is null', () => {
      const badge = tierBadge(null);
      expect(badge).toBe('Plan: Free');
    });

    it('should default to Free when tier is undefined', () => {
      const badge = tierBadge(undefined);
      expect(badge).toBe('Plan: Free');
    });

    it('should include environment suffix in development', () => {
      const badge = tierBadge('pro', 'development');
      expect(badge).toBe('Plan: Pro (Development)');
    });

    it('should include environment suffix in staging', () => {
      const badge = tierBadge('free', 'staging');
      expect(badge).toBe('Plan: Free (Staging)');
    });

    it('should include environment suffix in test', () => {
      const badge = tierBadge('team', 'test');
      expect(badge).toBe('Plan: Priority (Test)');
    });

    it('should not include environment suffix in production', () => {
      const badge = tierBadge('pro', 'production');
      expect(badge).toBe('Plan: Pro');
    });

    it('should handle undefined environment', () => {
      const badge = tierBadge('pro', undefined);
      expect(badge).toBe('Plan: Pro');
    });

    it('should handle null environment', () => {
      const badge = tierBadge('pro', null);
      expect(badge).toBe('Plan: Pro');
    });

    it('should capitalize environment name', () => {
      const badge = tierBadge('free', 'development');
      expect(badge).toContain('Development');
      expect(badge).not.toContain('development');
    });
  });

  describe('environmentBadge', () => {
    it('should render development badge', () => {
      const html = environmentBadge('development');
      expect(html).toContain('DEVELOPMENT');
      expect(html).toContain('background: #ecfeff');
    });

    it('should render staging badge', () => {
      const html = environmentBadge('staging');
      expect(html).toContain('STAGING');
    });

    it('should render test badge', () => {
      const html = environmentBadge('test');
      expect(html).toContain('TEST');
    });

    it('should not render badge in production', () => {
      const html = environmentBadge('production');
      expect(html).toBe('');
    });

    it('should default to DEV for undefined environment', () => {
      const html = environmentBadge(undefined);
      expect(html).toContain('DEV');
    });

    it('should default to DEV for null environment', () => {
      const html = environmentBadge(null);
      expect(html).toContain('DEV');
    });

    it('should uppercase environment name', () => {
      const html = environmentBadge('development');
      expect(html).toContain('DEVELOPMENT');
      expect(html).not.toContain('development');
    });
  });

  describe('sectionHeading', () => {
    it('should render section heading with border accent', () => {
      const html = sectionHeading('Features');
      expect(html).toContain('Features');
      expect(html).toContain('border-left: 4px solid #9333ea');
    });
  });

  describe('contentBox', () => {
    it('should wrap content in styled box', () => {
      const html = contentBox('<p>Test content</p>');
      expect(html).toContain('Test content');
      expect(html).toContain('background: #f8fafc');
    });
  });

  describe('primaryButton', () => {
    it('should render button with text and URL', () => {
      const html = primaryButton('Click Here', 'https://example.com');
      expect(html).toContain('Click Here');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('background: #9333ea');
    });
  });

  describe('baseHTML', () => {
    it('should wrap content in HTML structure', () => {
      const html = baseHTML('Test Email', '<div>Content</div>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<title>Test Email</title>');
      expect(html).toContain('<div>Content</div>');
      expect(html).toContain('charset="utf-8"');
      expect(html).toContain('viewport');
    });
  });
});
