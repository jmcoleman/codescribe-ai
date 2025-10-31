/**
 * UnverifiedEmailBanner Component
 *
 * Shows a banner at the top of the page for users with unverified emails.
 * Allows users to resend verification email.
 */

import { useState } from 'react';
import { Mail, X, Loader2 } from 'lucide-react';
import { toastSuccess, toastError } from '../utils/toast';

export default function UnverifiedEmailBanner({ user, onDismiss }) {
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user is verified or banner is dismissed
  if (!user || user.email_verified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toastSuccess('Verification email sent! Please check your inbox.');
      } else {
        toastError(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toastError('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div
      className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Icon + Message */}
          <div className="flex items-center gap-3 flex-1">
            <Mail
              className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0"
              aria-label="Warning"
            />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">Verify your email address</span>
              {' — '}
              <span>Please check your inbox and click the verification link to access all features.</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Email'
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="p-1 text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
