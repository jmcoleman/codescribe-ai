/**
 * Tests for Legal Pages (Privacy Policy & Terms of Service)
 *
 * Tests cover both PrivacyPolicy.jsx and TermsOfService.jsx:
 * - Page rendering and structure
 * - Version and effective date display
 * - Section headings and content
 * - Back button navigation
 * - Links and navigation
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PrivacyPolicy from '../PrivacyPolicy';
import TermsOfService from '../TermsOfService';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const RouterWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Privacy Policy Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Privacy Policy heading', () => {
      render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      expect(screen.getByRole('heading', { name: /Privacy Policy/i, level: 1 })).toBeInTheDocument();
    });

    it('should display version and effective date', () => {
      render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      // Pattern 4: Use getAllByText for multiple matches
      expect(screen.getAllByText(/Effective Date:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/November 2, 2025/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Version:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2025-11-02/i).length).toBeGreaterThan(0);
    });

    it('should render all major sections', () => {
      render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      expect(screen.getByText('1. Information We Collect')).toBeInTheDocument();
      expect(screen.getByText('2. How We Use Your Information')).toBeInTheDocument();
      expect(screen.getByText('3. Data Processing and Storage')).toBeInTheDocument();
      expect(screen.getByText('4. Data Sharing and Disclosure')).toBeInTheDocument();
      expect(screen.getByText('5. Data Retention')).toBeInTheDocument();
      expect(screen.getByText('6. Your Rights (GDPR & Privacy)')).toBeInTheDocument();
      expect(screen.getByText('7. Security')).toBeInTheDocument();
      expect(screen.getByText('8. Cookies and Tracking')).toBeInTheDocument();
      expect(screen.getByText('9. International Data Transfers')).toBeInTheDocument();
      expect(screen.getByText('10. Children\'s Privacy')).toBeInTheDocument();
      expect(screen.getByText('11. Changes to Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('12. Contact Us')).toBeInTheDocument();
    });

    it('should emphasize privacy-first code processing', () => {
      render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      expect(screen.getByText(/Your code is processed in memory only and is NEVER stored/i)).toBeInTheDocument();
      expect(screen.getByText(/Code and documentation are purged from memory immediately/i)).toBeInTheDocument();
    });

    it('should render contact email link', () => {
      render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      const emailLinks = screen.getAllByRole('link', { name: /support@codescribeai.com/i });
      expect(emailLinks.length).toBeGreaterThan(0);
      expect(emailLinks[0]).toHaveAttribute('href', 'mailto:support@codescribeai.com');
    });
  });

  describe('Navigation', () => {
    it('should render Back button', () => {
      render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    });

    it('should call navigate(-1) when Back button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      const backButton = screen.getByRole('button', { name: /Back/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });

      // Allow multiple h1s (Header logo + page title)
      expect(h1Elements.length).toBeGreaterThanOrEqual(1);
      expect(h2Elements.length).toBeGreaterThan(0);
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(
        <RouterWrapper>
          <PrivacyPolicy />
        </RouterWrapper>
      );

      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });
});

describe('Terms of Service Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Terms of Service heading', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      expect(screen.getByRole('heading', { name: /Terms of Service/i, level: 1 })).toBeInTheDocument();
    });

    it('should display version and effective date', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      // Pattern 4: Use getAllByText for multiple matches
      expect(screen.getAllByText(/Effective Date:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/November 2, 2025/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Version:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2025-11-02/i).length).toBeGreaterThan(0);
    });

    it('should render all major sections', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      expect(screen.getByText('1. Acceptance of Terms')).toBeInTheDocument();
      expect(screen.getByText('2. Description of Service')).toBeInTheDocument();
      expect(screen.getByText('3. Account Registration')).toBeInTheDocument();
      expect(screen.getByText('4. Subscription Tiers and Billing')).toBeInTheDocument();
      expect(screen.getByText('5. Cancellation and Refunds')).toBeInTheDocument();
      expect(screen.getByText('6. Usage Limits and Fair Use')).toBeInTheDocument();
      expect(screen.getByText('7. Intellectual Property')).toBeInTheDocument();
      expect(screen.getByText('8. Privacy and Data Protection')).toBeInTheDocument();
      expect(screen.getByText('9. Prohibited Conduct')).toBeInTheDocument();
      expect(screen.getByText('10. Termination')).toBeInTheDocument();
      expect(screen.getByText('11. Disclaimers')).toBeInTheDocument();
      expect(screen.getByText('12. Limitation of Liability')).toBeInTheDocument();
      expect(screen.getByText('13. Changes to Terms')).toBeInTheDocument();
      expect(screen.getByText('14. Contact Information')).toBeInTheDocument();
    });

    it('should display subscription tiers with pricing', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      expect(screen.getByText(/Free:/i)).toBeInTheDocument();
      expect(screen.getByText(/Starter:/i)).toBeInTheDocument();
      expect(screen.getByText(/\$12\/month/i)).toBeInTheDocument();
      expect(screen.getByText(/Pro:/i)).toBeInTheDocument();
      expect(screen.getByText(/\$29\/month/i)).toBeInTheDocument();
      expect(screen.getByText(/Team:/i)).toBeInTheDocument();
      expect(screen.getByText(/\$99\/month/i)).toBeInTheDocument();
      expect(screen.getByText(/Enterprise:/i)).toBeInTheDocument();
    });

    it('should mention no refunds policy', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      expect(screen.getByText(/All subscription fees are non-refundable/i)).toBeInTheDocument();
    });

    it('should link to Privacy Policy', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      const privacyLinks = screen.getAllByRole('link', { name: /Privacy Policy/i });
      expect(privacyLinks.length).toBeGreaterThan(0);
      expect(privacyLinks[0]).toHaveAttribute('href', '/privacy');
    });

    it('should render contact email link', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      const emailLinks = screen.getAllByRole('link', { name: /support@codescribeai.com/i });
      expect(emailLinks.length).toBeGreaterThan(0);
      expect(emailLinks[0]).toHaveAttribute('href', 'mailto:support@codescribeai.com');
    });
  });

  describe('Navigation', () => {
    it('should render Back button', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    });

    it('should call navigate(-1) when Back button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      const backButton = screen.getByRole('button', { name: /Back/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });

      // Allow multiple h1s (Header logo + page title)
      expect(h1Elements.length).toBeGreaterThanOrEqual(1);
      expect(h2Elements.length).toBeGreaterThan(0);
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(
        <RouterWrapper>
          <TermsOfService />
        </RouterWrapper>
      );

      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });
});
