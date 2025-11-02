/**
 * VerifyEmail Component
 *
 * Handles email verification from email link.
 * Reads token from URL query parameter and sends to backend.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { STORAGE_KEYS, getSessionItem, removeSessionItem } from '../constants/storage';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken, refreshUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');

          // Refresh user data to update email_verified status
          await refreshUser();

          // Check for pending subscription
          const pendingSubscriptionStr = getSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);

          if (pendingSubscriptionStr) {
            try {
              const pendingSubscription = JSON.parse(pendingSubscriptionStr);

              // Check if this is a Contact Sales tier (enterprise/team)
              const isContactSalesTier = pendingSubscription.tier === 'enterprise' || pendingSubscription.tier === 'team';

              if (isContactSalesTier) {
                // Enterprise/Team tiers: Redirect to pricing (Contact Sales modal will auto-open)
                setMessage(`Your email has been verified! Redirecting to contact our sales team...`);

                // Keep pending subscription in storage (PricingPage will consume it)
                setTimeout(() => {
                  navigate('/pricing');
                }, 2000);
              } else {
                // Pro/Premium tiers: Create Stripe checkout session
                setMessage(`Your email has been verified! Redirecting to complete your ${pendingSubscription.tierName} subscription...`);

                // Clear pending subscription from storage
                removeSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);

                // Redirect to create checkout session
                setTimeout(async () => {
                  try {
                    const token = getToken();
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
                    } else {
                      // If checkout fails, redirect to pricing page
                      navigate('/pricing');
                    }
                  } catch (error) {
                    console.error('Checkout redirect error:', error);
                    navigate('/pricing');
                  }
                }, 2000);
              }
            } catch (error) {
              console.error('Failed to parse pending subscription:', error);
              setMessage('Your email has been verified successfully!');
              setTimeout(() => navigate('/'), 3000);
            }
          } else {
            // No pending subscription, normal redirect
            setMessage('Your email has been verified successfully!');
            setTimeout(() => {
              navigate('/');
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <Loader2
                className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-spin"
                role="status"
                aria-label="Verifying email"
              />
            )}
            {status === 'success' && (
              <CheckCircle2
                className="w-16 h-16 text-green-600 dark:text-green-400"
                role="img"
                aria-label="Success"
              />
            )}
            {status === 'error' && (
              <XCircle
                className="w-16 h-16 text-red-600 dark:text-red-400"
                role="img"
                aria-label="Error"
              />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {status === 'verifying' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* Message */}
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {message}
          </p>

          {/* Actions */}
          {status === 'success' && !message.includes('Redirecting') && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Redirecting you to the home page...
            </p>
          )}

          {status === 'error' && (
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
