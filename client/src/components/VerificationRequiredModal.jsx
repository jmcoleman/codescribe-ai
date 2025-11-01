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

export default function VerificationRequiredModal({ isOpen, onClose, userEmail }) {
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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, {
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-modal-title"
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ring-4 ${
              emailSent
                ? 'bg-gradient-to-br from-green-100 to-emerald-100 ring-green-50'
                : 'bg-gradient-to-br from-indigo-100 to-purple-100 ring-indigo-50'
            }`}>
              {emailSent ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
              ) : (
                <Mail className="w-8 h-8 text-indigo-600" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2
              id="verification-modal-title"
              className="text-2xl font-bold text-slate-900 mb-2"
            >
              {emailSent ? 'Check Your Email' : 'Email Verification Required'}
            </h2>
            {emailSent ? (
              <>
                <p className="text-slate-600 mb-3">
                  We've sent a verification link to your email address.
                </p>
                {userEmail && (
                  <p className="text-sm text-slate-700 font-medium mb-3">
                    {userEmail}
                  </p>
                )}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-slate-700 mb-2">
                    <strong>Next steps:</strong>
                  </p>
                  <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Check your email inbox</li>
                    <li>Click the verification link</li>
                    <li>Return here to complete your subscription</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-600">
                  Please verify your email address to subscribe to paid plans.
                </p>
                {userEmail && (
                  <p className="text-sm text-slate-500 mt-2">
                    Verification email will be sent to <span className="font-medium">{userEmail}</span>
                  </p>
                )}
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!emailSent && (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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
                  ? 'text-white bg-purple-600 hover:bg-purple-700 shadow-sm'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {emailSent ? 'Got it, thanks!' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
