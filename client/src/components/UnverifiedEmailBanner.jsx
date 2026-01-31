/**
 * UnverifiedEmailBanner Component
 *
 * Shows a banner at the top of the page for users with unverified emails.
 * Allows users to resend verification email.
 * Dismissal state persists for the entire session (until browser tab closes).
 */

import { useState, useEffect } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { toastSuccess, toastError } from '../utils/toast';
import { STORAGE_KEYS, getSessionItem, setSessionItem, removeSessionItem } from '../constants/storage';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { Banner } from './Banner';

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
    <Banner
      type="info"
      icon={Mail}
      iconColor="text-indigo-600 dark:text-indigo-400"
      borderColor="border-indigo-500 dark:border-indigo-400"
      onDismiss={handleDismiss}
      ariaLive="polite"
      alignCenter={true}
      actions={
        <button
          onClick={handleResend}
          disabled={isResending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-md shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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
      }
    >
      <p className="text-sm text-slate-700 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-white">Verify your email</span>
        <span className="hidden sm:inline">
          {' — '}
          Check your inbox and click the verification link
        </span>
      </p>
    </Banner>
  );
}
