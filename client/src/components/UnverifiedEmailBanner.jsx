/**
 * UnverifiedEmailBanner Component
 *
 * Shows a banner at the top of the page for users with unverified emails.
 * Allows users to resend verification email.
 * Dismissal state persists for the entire session (until browser tab closes).
 */

import { useState, useEffect } from 'react';
import { Mail, X, Loader2 } from 'lucide-react';
import { toastSuccess, toastError } from '../utils/toast';
import { STORAGE_KEYS, getSessionItem, setSessionItem, removeSessionItem } from '../constants/storage';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

export default function UnverifiedEmailBanner({ user, onDismiss }) {
  const [isResending, setIsResending] = useState(false);
  const { getToken } = useAuth();

  // Check sessionStorage for dismiss state (persists across navigation)
  const [isDismissed, setIsDismissed] = useState(() => {
    return getSessionItem(STORAGE_KEYS.EMAIL_VERIFICATION_BANNER_DISMISSED) === 'true';
  });

  // Reset dismiss state when user changes (e.g., login/logout)
  useEffect(() => {
    // If user changes or logs out, reset the dismissed state
    if (!user || user.email_verified) {
      // User logged out or email is now verified - clear dismiss state
      removeSessionItem(STORAGE_KEYS.EMAIL_VERIFICATION_BANNER_DISMISSED);
      setIsDismissed(false);
    }
  }, [user?.id, user?.email_verified]); // Track user ID and verification status

  // Don't show if user is verified or banner is dismissed
  if (!user || user.email_verified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
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
        // Handle specific error cases
        if (response.status === 429) {
          // App rate limit - user can retry later
          toastError(data.error || 'Please wait before requesting another verification email');
        } else if (response.status === 503) {
          // Resend API rate limit - service temporarily unavailable
          toastError(data.error || 'Email service is temporarily unavailable. Please try again in a few minutes.');
        } else if (response.status === 401) {
          // Authentication failed - session expired, need to sign in again
          toastError('Session expired. Please sign in again.');
          // Let the app handle the redirect/login modal
          window.location.reload();
        } else {
          // Other API errors - show in toast
          toastError(data.error || 'Failed to send verification email');
        }
      }
    } catch (error) {
      // Only network errors (fetch failures) end up here
      console.error('Resend verification error:', error);
      toastError('Network error. Please check your connection and try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    // Store dismiss state in sessionStorage (persists until tab closes)
    setSessionItem(STORAGE_KEYS.EMAIL_VERIFICATION_BANNER_DISMISSED, 'true');
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
