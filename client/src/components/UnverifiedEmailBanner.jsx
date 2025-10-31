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
      className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Icon + Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center ring-2 ring-indigo-200">
              <Mail
                className="w-4 h-4 text-indigo-600"
                aria-label="Email verification"
              />
            </div>
            <p className="text-sm text-slate-700 truncate">
              <span className="font-semibold text-slate-900">Verify your email</span>
              <span className="hidden sm:inline">
                {' — '}
                Check your inbox and click the verification link
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                'Resend Email'
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-md transition-all duration-200 active:scale-95"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
