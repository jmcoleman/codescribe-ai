/**
 * Tests for Footer Component
 *
 * Footer with legal links, copyright, and support button
 * Tests cover:
 * - Rendering copyright with current year
 * - Legal links (Terms, Privacy) with correct routing
 * - Support button click handling
 * - Responsive layout
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../Footer';

// Wrapper for router context
const RouterWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('Footer', () => {
  const mockOnSupportClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render footer with copyright text', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(`© ${currentYear} CodeScribe AI. All rights reserved.`)
      ).toBeInTheDocument();
    });

    it('should update copyright year automatically', () => {
      // Mock Date to return a specific year
      const mockDate = new Date('2026-01-15');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      expect(
        screen.getByText('© 2026 CodeScribe AI. All rights reserved.')
      ).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('should render Terms of Service link', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const termsLink = screen.getByRole('link', { name: /Terms of Service/i });
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/terms');
    });

    it('should render Privacy Policy link', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it('should render Support button', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /Support/i });
      expect(supportButton).toBeInTheDocument();
    });

    it('should render footer as a semantic footer element', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should render nav element for legal links', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onSupportClick when Support button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /Support/i });
      await user.click(supportButton);

      expect(mockOnSupportClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple Support button clicks', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /Support/i });

      await user.click(supportButton);
      await user.click(supportButton);
      await user.click(supportButton);

      expect(mockOnSupportClick).toHaveBeenCalledTimes(3);
    });

    it('should work without onSupportClick prop', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <Footer />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /Support/i });

      // Should not throw error when clicked
      await expect(user.click(supportButton)).resolves.not.toThrow();
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper background and border styles', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('bg-white/80');
      expect(footer).toHaveClass('backdrop-blur-sm');
      expect(footer).toHaveClass('border-t');
      expect(footer).toHaveClass('border-slate-200');
    });

    it('should use mt-auto for sticky footer behavior', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('mt-auto');
    });

    it('should have responsive flex layout', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const flexContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should apply hover styles to links', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const termsLink = screen.getByRole('link', { name: /Terms of Service/i });
      const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });

      expect(termsLink).toHaveClass('hover:text-purple-600');
      expect(privacyLink).toHaveClass('hover:text-purple-600');
    });

    it('should apply hover styles to Support button', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /Support/i });
      expect(supportButton).toHaveClass('hover:text-purple-600');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible link text', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: 'Support' })).toBeInTheDocument();
    });

    it('should use semantic HTML elements', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      // Should use <footer>, <nav>, and proper link/button elements
      expect(container.querySelector('footer')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should have proper color contrast for text', () => {
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const currentYear = new Date().getFullYear();
      const copyrightText = screen.getByText(`© ${currentYear} CodeScribe AI. All rights reserved.`);

      // Copyright should use slate-600 for proper contrast
      expect(copyrightText).toHaveClass('text-slate-600');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation between links and button', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const termsLink = screen.getByRole('link', { name: /Terms of Service/i });
      const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });
      const supportButton = screen.getByRole('button', { name: /Support/i });

      // Tab through footer elements
      await user.tab();

      // One of the interactive elements should be focused
      const focusedElement = document.activeElement;
      expect([termsLink, privacyLink, supportButton]).toContain(focusedElement);
    });

    it('should activate Support button with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /Support/i });
      supportButton.focus();

      await user.keyboard('{Enter}');
      expect(mockOnSupportClick).toHaveBeenCalledTimes(1);
    });

    it('should activate Support button with Space key', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /Support/i });
      supportButton.focus();

      await user.keyboard(' ');
      expect(mockOnSupportClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onSupportClick gracefully', () => {
      expect(() => {
        render(
          <RouterWrapper>
            <Footer />
          </RouterWrapper>
        );
      }).not.toThrow();

      expect(screen.getByRole('button', { name: /Support/i })).toBeInTheDocument();
    });

    it('should render correctly at year boundaries', () => {
      // Test year 2099 (far future)
      const futureDate = new Date('2099-12-31');
      vi.spyOn(global, 'Date').mockImplementation(() => futureDate);

      render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      expect(
        screen.getByText('© 2099 CodeScribe AI. All rights reserved.')
      ).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('should maintain structure with long copyright text', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const footer = container.querySelector('footer');
      const currentYear = new Date().getFullYear();

      // Footer should still contain copyright
      expect(footer?.textContent).toContain(`© ${currentYear} CodeScribe AI`);

      // And should still have nav links
      expect(container.querySelector('nav')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive gap spacing', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const flexContainer = container.querySelector('.gap-4');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have responsive padding', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const innerContainer = container.querySelector('.px-4.sm\\:px-6.lg\\:px-8');
      expect(innerContainer).toBeInTheDocument();
    });

    it('should center items on mobile and justify between on desktop', () => {
      const { container } = render(
        <RouterWrapper>
          <Footer onSupportClick={mockOnSupportClick} />
        </RouterWrapper>
      );

      const flexContainer = container.querySelector('.items-center.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });
  });
});
