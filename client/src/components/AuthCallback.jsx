/**
 * AuthCallback Component
 *
 * Handles OAuth callback after successful GitHub authentication.
 * Extracts JWT token from URL parameters, stores it in localStorage,
 * and redirects to the home page.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trackOAuth } from '../utils/analytics';
import { STORAGE_KEYS, getSessionItem, removeSessionItem, setStorageItem } from '../constants/storage';
import { API_URL } from '../config/api';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearError } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Calculate OAuth flow duration
      const startTimeStr = getSessionItem(STORAGE_KEYS.OAUTH_START_TIME);
      const context = getSessionItem(STORAGE_KEYS.OAUTH_CONTEXT, 'unknown');
      const duration = startTimeStr ? Date.now() - parseInt(startTimeStr, 10) : undefined;

      // Get token from URL parameters
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      // Handle error case
      if (error) {
        console.error('OAuth error:', error);

        // Track OAuth failure with duration
        trackOAuth({
          provider: 'github',
          action: 'failed',
          context,
          duration,
          errorType: error,
        });

        // Clean up sessionStorage
        removeSessionItem(STORAGE_KEYS.OAUTH_START_TIME);
        removeSessionItem(STORAGE_KEYS.OAUTH_CONTEXT);

        // Redirect to home with error message
        navigate('/?auth_error=' + encodeURIComponent(error), { replace: true });
        return;
      }

      // Handle success case
      if (token) {
        try {
          // Store token in localStorage
          setStorageItem(STORAGE_KEYS.AUTH_TOKEN, token);

          // Track OAuth success with duration
          trackOAuth({
            provider: 'github',
            action: 'completed',
            context,
            duration,
          });

          // Clean up sessionStorage
          removeSessionItem(STORAGE_KEYS.OAUTH_START_TIME);
          removeSessionItem(STORAGE_KEYS.OAUTH_CONTEXT);

          // Clear any previous auth errors
          clearError();

          // Check for pending subscription
          const pendingSubscriptionStr = getSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);

          if (pendingSubscriptionStr) {
            try {
              const pendingSubscription = JSON.parse(pendingSubscriptionStr);

              // Check if this is a Contact Sales tier (enterprise/team)
              const isContactSalesTier = pendingSubscription.tier === 'enterprise' || pendingSubscription.tier === 'team';

              if (isContactSalesTier) {
                // Enterprise/Team tiers: Redirect to pricing (Contact Sales modal will auto-open)
                // Keep pending subscription in storage (PricingPage will consume it)
                window.location.href = '/pricing';
                return;
              } else {
                // Pro/Premium tiers: Create Stripe checkout session
                // Clear pending subscription from storage
                removeSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);

                // Redirect to create checkout session
                // OAuth users are automatically verified, so we can proceed directly
                const checkoutResponse = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    tier: pendingSubscription.tier,
                    billingPeriod: pendingSubscription.billingPeriod,
                  }),
                });

                if (checkoutResponse.ok) {
                  const { url } = await checkoutResponse.json();
                  window.location.href = url; // Redirect to Stripe Checkout
                  return;
                } else {
                  // If checkout fails, redirect to pricing page
                  console.error('Checkout creation failed after OAuth');
                  window.location.href = '/pricing';
                  return;
                }
              }
            } catch (error) {
              console.error('Failed to process pending subscription:', error);
              // Fall through to normal home redirect
            }
          }

          // Check for returnTo param (e.g., from Settings page GitHub connect)
          const returnTo = searchParams.get('returnTo');

          // Redirect to returnTo or home page with full page reload
          // This triggers AuthContext initialization with the new token
          // Using window.location.href instead of navigate + reload
          // ensures a clean navigation without the callback URL in history
          window.location.href = returnTo || '/';
        } catch (err) {
          console.error('Error storing auth token:', err);

          // Track OAuth failure
          trackOAuth({
            provider: 'github',
            action: 'failed',
            context,
            duration,
            errorType: 'token_storage_failed',
          });

          // Clean up sessionStorage
          removeSessionItem(STORAGE_KEYS.OAUTH_START_TIME);
          removeSessionItem(STORAGE_KEYS.OAUTH_CONTEXT);

          navigate('/?auth_error=token_storage_failed', { replace: true });
        }
      } else {
        // No token or error - redirect to home
        console.warn('OAuth callback received with no token or error');

        // Track OAuth failure
        trackOAuth({
          provider: 'github',
          action: 'failed',
          context,
          duration,
          errorType: 'missing_token',
        });

        // Clean up sessionStorage
        removeSessionItem(STORAGE_KEYS.OAUTH_START_TIME);
        removeSessionItem(STORAGE_KEYS.OAUTH_CONTEXT);

        navigate('/?auth_error=missing_token', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, clearError]);

  // Show loading state while processing callback
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
