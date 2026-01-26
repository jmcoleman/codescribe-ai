/**
 * EligibilityError Component Tests
 * Tests for all 4 error codes and their displays
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EligibilityError from '../EligibilityError';

// Wrapper for components that use react-router
const RouterWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('EligibilityError Component', () => {
  describe('NEW_USERS_ONLY Error', () => {
    it('should display new users only message', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="NEW_USERS_ONLY"
            error="This campaign is only available to new trial users"
            details={{
              trialCount: 1,
              lastTrialEndedAt: '2025-12-01T12:00:00.000Z'
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/This campaign is for new users only/i)).toBeInTheDocument();
      expect(screen.getByText(/You've already used a trial/i)).toBeInTheDocument();
    });

    it('should show last trial end date', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="NEW_USERS_ONLY"
            error="Trial Program is for new users"
            details={{
              lastTrialEndedAt: '2025-12-01T12:00:00.000Z'
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Your last trial ended on/i)).toBeInTheDocument();
      expect(screen.getByText(/December 1, 2025/i)).toBeInTheDocument();
    });

    it('should display View Paid Plans and Contact Support CTAs', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="NEW_USERS_ONLY"
            error="Trial Program is for new users"
          />
        </RouterWrapper>
      );

      expect(screen.getByText('View Paid Plans')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });

    it('should link to correct pages', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="NEW_USERS_ONLY"
            error="Trial Program is for new users"
          />
        </RouterWrapper>
      );

      const pricingLink = screen.getByText('View Paid Plans').closest('a');
      const contactLink = screen.getByText('Contact Support').closest('a');

      expect(pricingLink).toHaveAttribute('href', '/pricing');
      expect(contactLink).toHaveAttribute('href', '/contact');
    });
  });

  describe('COOLDOWN_PERIOD Error', () => {
    it('should display cooldown period message with days remaining', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="COOLDOWN_PERIOD"
            error="Trial available in 45 days"
            details={{
              daysRemaining: 45,
              daysSinceLastTrial: 45,
              lastTrialEndedAt: '2025-11-30T12:00:00.000Z'
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Trial available in 45 days/i)).toBeInTheDocument();
      expect(screen.getByText(/It's been 45 days since your last trial ended/i)).toBeInTheDocument();
    });

    it('should handle singular day correctly', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="COOLDOWN_PERIOD"
            error="Trial available in 1 day"
            details={{
              daysRemaining: 1,
              daysSinceLastTrial: 89
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Trial available in 1 day$/i)).toBeInTheDocument();
    });

    it('should display Upgrade Now CTA', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="COOLDOWN_PERIOD"
            error="Cooldown active"
            details={{ daysRemaining: 30 }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('Upgrade Now for Immediate Access')).toBeInTheDocument();
    });

    it('should format last trial end date', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="COOLDOWN_PERIOD"
            error="Cooldown active"
            details={{
              daysRemaining: 60,
              lastTrialEndedAt: '2025-10-15T12:00:00.000Z'
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/October 15, 2025/i)).toBeInTheDocument();
    });
  });

  describe('MAX_TRIALS_REACHED Error', () => {
    it('should display max trials reached message', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="MAX_TRIALS_REACHED"
            error="Maximum trial limit reached"
            details={{
              trialCount: 3
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Trial limit reached/i)).toBeInTheDocument();
      expect(screen.getByText(/You've already used 3 trials/i)).toBeInTheDocument();
    });

    it('should handle singular trial count', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="MAX_TRIALS_REACHED"
            error="Maximum trial limit reached"
            details={{
              trialCount: 1
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/You've already used 1 trial\./i)).toBeInTheDocument();
    });

    it('should display View Pricing CTA', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="MAX_TRIALS_REACHED"
            error="Maximum trial limit reached"
            details={{ trialCount: 5 }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('View Pricing')).toBeInTheDocument();
      const link = screen.getByText('View Pricing').closest('a');
      expect(link).toHaveAttribute('href', '/pricing');
    });
  });

  describe('ACTIVE_TRIAL_EXISTS Error', () => {
    it('should display active trial message', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="ACTIVE_TRIAL_EXISTS"
            error="You already have an active trial"
            details={{
              activeTrial: {
                tier: 'pro',
                endsAt: '2026-02-01T00:00:00.000Z'
              }
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/You already have an active trial/i)).toBeInTheDocument();
      expect(screen.getByText(/You're currently on a pro trial/i)).toBeInTheDocument();
    });

    it('should display trial expiration date', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="ACTIVE_TRIAL_EXISTS"
            error="Active trial exists"
            details={{
              activeTrial: {
                tier: 'team',
                endsAt: '2026-01-25T12:00:00.000Z'
              }
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Your trial expires on/i)).toBeInTheDocument();
      expect(screen.getByText(/January 25, 2026/i)).toBeInTheDocument();
    });

    it('should display View Trial Status CTA', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="ACTIVE_TRIAL_EXISTS"
            error="Active trial exists"
            details={{
              activeTrial: { tier: 'pro' }
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('View Trial Status')).toBeInTheDocument();
      const link = screen.getByText('View Trial Status').closest('a');
      expect(link).toHaveAttribute('href', '/usage');
    });

    it('should handle missing activeTrial.endsAt gracefully', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="ACTIVE_TRIAL_EXISTS"
            error="Active trial exists"
            details={{
              activeTrial: { tier: 'team' }
            }}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/You already have an active trial/i)).toBeInTheDocument();
      expect(screen.queryByText(/Your trial expires on/i)).not.toBeInTheDocument();
    });
  });

  describe('Fallback / Unknown Error', () => {
    it('should display generic error message for unknown code', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="UNKNOWN_ERROR"
            error="Something went wrong"
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Unable to redeem trial/i)).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should display fallback message when error prop is missing', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="INVALID_CODE"
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/An error occurred while redeeming your trial code/i)).toBeInTheDocument();
    });

    it('should display both View Pricing and Contact Support CTAs', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="UNKNOWN"
            error="Unknown error"
          />
        </RouterWrapper>
      );

      expect(screen.getByText('View Pricing')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });
  });

  describe('Styling & Accessibility', () => {
    it('should render with appropriate color scheme for each error type', () => {
      const { container: newUsersContainer } = render(
        <RouterWrapper>
          <EligibilityError errorCode="NEW_USERS_ONLY" error="Test" />
        </RouterWrapper>
      );
      expect(newUsersContainer.querySelector('.bg-amber-50')).toBeInTheDocument();

      const { container: cooldownContainer } = render(
        <RouterWrapper>
          <EligibilityError errorCode="COOLDOWN_PERIOD" error="Test" details={{ daysRemaining: 1 }} />
        </RouterWrapper>
      );
      expect(cooldownContainer.querySelector('.bg-amber-50')).toBeInTheDocument();

      const { container: maxTrialsContainer } = render(
        <RouterWrapper>
          <EligibilityError errorCode="MAX_TRIALS_REACHED" error="Test" details={{ trialCount: 3 }} />
        </RouterWrapper>
      );
      expect(maxTrialsContainer.querySelector('.bg-red-50')).toBeInTheDocument();

      const { container: activeTrialContainer } = render(
        <RouterWrapper>
          <EligibilityError errorCode="ACTIVE_TRIAL_EXISTS" error="Test" details={{}} />
        </RouterWrapper>
      );
      expect(activeTrialContainer.querySelector('.bg-blue-50')).toBeInTheDocument();
    });

    it('should have appropriate icons for each error type', () => {
      render(
        <RouterWrapper>
          <EligibilityError errorCode="NEW_USERS_ONLY" error="Test" />
        </RouterWrapper>
      );
      // Users icon rendered
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should have descriptive link text for screen readers', () => {
      render(
        <RouterWrapper>
          <EligibilityError errorCode="MAX_TRIALS_REACHED" error="Test" details={{ trialCount: 2 }} />
        </RouterWrapper>
      );

      const link = screen.getByText('View Pricing');
      expect(link).toHaveAttribute('href', '/pricing');
      // Text content is descriptive enough for screen readers
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing details object', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="COOLDOWN_PERIOD"
            error="Cooldown active"
          />
        </RouterWrapper>
      );

      // Should not crash, should display with default values (0 days remaining)
      expect(screen.getByText(/Trial available in 0 days/i)).toBeInTheDocument();
    });

    it('should handle empty details object', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="NEW_USERS_ONLY"
            error="New users only"
            details={{}}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/New users only/i)).toBeInTheDocument();
    });

    it('should handle zero daysRemaining', () => {
      render(
        <RouterWrapper>
          <EligibilityError
            errorCode="COOLDOWN_PERIOD"
            error="Cooldown period"
            details={{ daysRemaining: 0 }}
          />
        </RouterWrapper>
      );

      // Should handle plural/singular correctly (0 days, not 0 day)
      expect(screen.getByText(/0 days/i)).toBeInTheDocument();
    });
  });
});
