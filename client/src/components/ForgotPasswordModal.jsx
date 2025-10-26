/**
 * ForgotPasswordModal - Password Reset Request Component
 *
 * Modal dialog for requesting a password reset email.
 * Simple, focused interface following accessibility best practices.
 */

import { X, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';

export function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin }) {
  const { forgotPassword, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [allowClickOutside, setAllowClickOutside] = useState(false);

  const modalRef = useRef(null);
  const emailInputRef = useRef(null);

  // Delay enabling click-outside to prevent immediate close on modal open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setAllowClickOutside(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAllowClickOutside(false);
    }
  }, [isOpen]);

  // Auto-focus email input when modal opens
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [isOpen]);

  // Clear form and errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setLocalError('');
      setSuccessMessage('');
      clearError();
      setIsLoading(false);
    }
  }, [isOpen, clearError]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Close on Escape key
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (allowClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setLocalError('');
    setSuccessMessage('');
    clearError();

    // Validate input
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);

      const result = await forgotPassword(email.trim());

      if (result.success) {
        setSuccessMessage(
          result.message ||
          'If an account exists with this email, a password reset link has been sent.'
        );
        setEmail('');
      } else {
        setLocalError(result.error || 'Failed to send reset email');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = localError || authError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2
            id="forgot-password-modal-title"
            className="text-2xl font-semibold text-slate-900"
          >
            Reset Password
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            aria-label="Close forgot password modal"
          >
            <X className="w-5 h-5 text-slate-600" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {!successMessage && (
            <p className="text-sm text-slate-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div
              className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
              role="alert"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-2">
                <p className="text-sm text-green-800">{successMessage}</p>
                <p className="text-xs text-green-700">
                  Please check your email inbox and spam folder.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="forgot-password-email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    ref={emailInputRef}
                    id="forgot-password-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium focus:outline-none focus:underline"
              disabled={isLoading}
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
