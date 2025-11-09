/**
 * VerificationRequiredModal Component
 *
 * Modal dialog shown when unverified users attempt to subscribe to paid plans.
 * Provides clear messaging and action to resend verification email.
 */

import { useState } from 'react';
import { Mail, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toastSuccess } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function VerificationRequiredModal({ isOpen, onClose, userEmail }) {
  const modalRef = useFocusTrap(isOpen, onClose);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const { getToken } = useAuth();

  if (!isOpen) return null;

  const handleResend = async () => {
    setIsResending(true);
    setError(null); // Clear previous errors

    try {
      const token = getToken();
      console.log('[VerificationRequiredModal] Sending resend request...');

      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[VerificationRequiredModal] Response status:', response.status);

      const data = await response.json();
      console.log('[VerificationRequiredModal] Response data:', data);

      if (response.ok) {
        console.log('[VerificationRequiredModal] Success - showing success state');
        setEmailSent(true);
        toastSuccess('Verification email sent! Please check your inbox.');
      } else {
        console.log('[VerificationRequiredModal] Error response, setting error state');
        // Handle specific error cases - all shown in modal
        if (response.status === 401) {
          // Authentication failed - session expired
          const errorMsg = 'Your session has expired. Please close this modal and sign in again.';
          console.log('[VerificationRequiredModal] 401 error:', errorMsg);
          setError(errorMsg);
        } else if (response.status === 503) {
          // Resend API rate limit - service temporarily unavailable
          const errorMsg = data.error || 'Email service is temporarily unavailable. Please try again in a few minutes.';
          console.log('[VerificationRequiredModal] 503 error:', errorMsg);
          setError(errorMsg);
        } else {
          // All other errors (429, 400, 500, etc.) - show in modal
          const errorMsg = data.error || 'Failed to send verification email. Please try again.';
          console.log('[VerificationRequiredModal] Other error (' + response.status + '):', errorMsg);
          setError(errorMsg);
        }
      }
    } catch (error) {
      // Network errors (fetch failures)
      console.error('[VerificationRequiredModal] Catch block - network error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsResending(false);
      console.log('[VerificationRequiredModal] Request complete, isResending set to false');
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
    >
      <div
        ref={modalRef}
        className="modal-container max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 icon-btn interactive-scale-sm focus-ring-light"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ring-4 ${
              emailSent
                ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 ring-green-50 dark:ring-green-500/20'
                : 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 ring-indigo-50 dark:ring-indigo-500/20'
            }`}>
              {emailSent ? (
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              ) : (
                <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2
              id="verification-modal-title"
              className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2"
            >
              {emailSent ? 'Check Your Email' : 'Email Verification Required'}
            </h2>
            {emailSent ? (
              <>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  We've sent a verification link to your email address.
                </p>
                {userEmail && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-3">
                    {userEmail}
                  </p>
                )}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/50 rounded-lg p-4 text-left">
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    <strong>Next steps:</strong>
                  </p>
                  <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                    <li>Check your email inbox</li>
                    <li>Click the verification link</li>
                    <li>Return here to complete your subscription</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-600 dark:text-slate-400">
                  Please verify your email address to subscribe to paid plans.
                </p>
                {userEmail && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Verification email will be sent to <span className="font-medium">{userEmail}</span>
                  </p>
                )}
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!emailSent && (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isResending}
              className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
                emailSent
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
            >
              {emailSent ? 'Got it, thanks!' : 'Cancel'}
            </button>
          </div>
      </div>
    </div>
  );
}
