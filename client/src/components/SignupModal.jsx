/**
 * SignupModal - User Registration Component
 *
 * Modal dialog for new user registration via email/password or GitHub OAuth.
 * Includes password strength validation and accessibility features.
 */

import { X, Mail, Lock, Github, AlertCircle, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { toastCompact } from '../utils/toast';
import { API_URL } from '../config/api';

export function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const { signup, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [allowClickOutside, setAllowClickOutside] = useState(false);

  const modalRef = useRef(null);
  const emailInputRef = useRef(null);

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

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
      setPassword('');
      setConfirmPassword('');
      setLocalError('');
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

    // Clear previous errors
    setLocalError('');
    clearError();

    // Validate inputs
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

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);

      const result = await signup(email.trim(), password);

      if (result.success) {
        toastCompact('Account created successfully!', 'success');
        onClose();
      } else {
        setLocalError(result.error || 'Signup failed');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignup = () => {
    // Redirect to GitHub OAuth endpoint
    window.location.href = `${API_URL}/api/auth/github`;
  };

  const errorMessage = localError || authError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2
            id="signup-modal-title"
            className="text-2xl font-semibold text-slate-900"
          >
            Create Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            aria-label="Close signup modal"
          >
            <X className="w-5 h-5 text-slate-600" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="signup-email"
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
                  id="signup-email"
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

            {/* Password Input */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength === 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <PasswordCheck met={passwordChecks.length}>
                      At least 8 characters
                    </PasswordCheck>
                    <PasswordCheck met={passwordChecks.hasUpper}>
                      One uppercase letter
                    </PasswordCheck>
                    <PasswordCheck met={passwordChecks.hasLower}>
                      One lowercase letter
                    </PasswordCheck>
                    <PasswordCheck met={passwordChecks.hasNumber}>
                      One number
                    </PasswordCheck>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
                  autoComplete="new-password"
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
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* GitHub OAuth Button */}
          <button
            type="button"
            onClick={handleGithubSignup}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Github className="w-5 h-5 text-slate-700" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">GitHub</span>
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-purple-600 hover:text-purple-700 font-medium focus:outline-none focus:underline"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Password requirement check component
 */
function PasswordCheck({ met, children }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
          met ? 'bg-green-100' : 'bg-slate-100'
        }`}
      >
        {met && <Check className="w-3 h-3 text-green-600" aria-hidden="true" />}
      </div>
      <span className={met ? 'text-green-700' : 'text-slate-500'}>
        {children}
      </span>
    </div>
  );
}
