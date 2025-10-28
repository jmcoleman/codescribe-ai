/**
 * SignupModal - User Registration Component
 *
 * Modal dialog for new user registration via email/password or GitHub OAuth.
 * Includes password strength validation and accessibility features.
 */

import { X, Mail, Lock, Github, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { toastCompact } from '../utils/toast';
import { trackOAuth } from '../utils/analytics';
import { STORAGE_KEYS, setSessionItem } from '../constants/storage';
import { API_URL } from '../config/api';

export function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const { signup, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [allowClickOutside, setAllowClickOutside] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0); // Increment to trigger focus
  const lastProcessedTrigger = useRef(0); // Track last trigger we processed
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const modalRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

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

  // Auto-focus email input and clear errors when modal opens
  useEffect(() => {
    if (isOpen) {
      // Clear any existing errors from previous sessions or other modals
      setLocalError('');
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');
      clearError();

      // Focus email input
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only run when modal opens/closes, not when clearError changes

  // Clear form and errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clear form and errors when modal closes
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setLocalError('');
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');
      clearError();
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only run when modal opens/closes, not when clearError changes

  // Focus first field with error
  // Note: We use flushSync in handleSubmit to ensure DOM updates are applied
  // synchronously before this effect runs. This guarantees the error state
  // is committed and the DOM is ready for focus management.
  useEffect(() => {
    // Only run if focusTrigger has CHANGED (new submission)
    // This prevents running when errors change due to typing
    if (focusTrigger === 0 || focusTrigger === lastProcessedTrigger.current) {
      return;
    }

    // Mark this trigger as processed
    lastProcessedTrigger.current = focusTrigger;

    // Skip if there are no errors
    const hasAnyError = emailError || passwordError || confirmPasswordError || localError;
    if (!hasAnyError) return;

    if (emailError && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (passwordError && passwordInputRef.current) {
      passwordInputRef.current.focus();
    } else if (confirmPasswordError && confirmPasswordInputRef.current) {
      confirmPasswordInputRef.current.focus();
    } else if (localError && emailInputRef.current) {
      // Server errors (e.g., "Email already exists") - focus email field
      emailInputRef.current.focus();
    }
  }, [emailError, passwordError, confirmPasswordError, localError, focusTrigger]);

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
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();

    let hasErrors = false;
    let emailValidationError = '';
    let passwordValidationError = '';
    let confirmPasswordValidationError = '';

    // Validate email
    if (!email.trim()) {
      emailValidationError = 'Email is required';
      hasErrors = true;
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailValidationError = 'Please enter a valid email address';
        hasErrors = true;
      }
    }

    // Validate password
    if (!password) {
      passwordValidationError = 'Password is required';
      hasErrors = true;
    } else if (password.length < 8) {
      passwordValidationError = 'Password must be at least 8 characters';
      hasErrors = true;
    }

    // Validate confirm password
    if (!confirmPassword) {
      confirmPasswordValidationError = 'Please confirm your password';
      hasErrors = true;
    } else if (password !== confirmPassword) {
      confirmPasswordValidationError = 'Passwords do not match';
      hasErrors = true;
    }

    // Stop if validation errors exist
    if (hasErrors) {
      // Use flushSync to ensure DOM updates before focus management
      flushSync(() => {
        if (emailValidationError) setEmailError(emailValidationError);
        if (passwordValidationError) setPasswordError(passwordValidationError);
        if (confirmPasswordValidationError) setConfirmPasswordError(confirmPasswordValidationError);
        setFocusTrigger(prev => prev + 1); // Increment to trigger focus effect
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await signup(email.trim(), password);

      if (result.success) {
        toastCompact('Account created successfully!', 'success');
        onClose();
      } else {
        // Server/auth errors - use flushSync to ensure DOM updates before focus
        flushSync(() => {
          setLocalError(result.error || 'Signup failed');
          setFocusTrigger(prev => prev + 1); // Increment to trigger focus effect
        });
      }
    } catch (err) {
      flushSync(() => {
        setLocalError('An unexpected error occurred');
        setFocusTrigger(prev => prev + 1); // Increment to trigger focus effect
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignup = () => {
    // Show loading state before redirect
    setIsGithubLoading(true);

    // Track OAuth initiation with timestamp
    const startTime = Date.now();
    trackOAuth({
      provider: 'github',
      action: 'redirect_started',
      context: 'signup_modal',
    });

    // Store start time in sessionStorage for callback tracking
    setSessionItem(STORAGE_KEYS.OAUTH_START_TIME, startTime.toString());
    setSessionItem(STORAGE_KEYS.OAUTH_CONTEXT, 'signup_modal');

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
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear field error when user starts typing
                    if (emailError) setEmailError('');
                  }}
                  placeholder="you@example.com"
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow ${
                    emailError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  autoComplete="off"
                  disabled={isLoading}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {emailError}
                </p>
              )}
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
                  ref={passwordInputRef}
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear field error when user starts typing
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Create a strong password"
                  className={`block w-full pl-10 pr-11 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow ${
                    passwordError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {passwordError}
                </p>
              )}

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
                  ref={confirmPasswordInputRef}
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    // Clear field error when user starts typing
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  placeholder="Confirm your password"
                  className={`block w-full pl-10 pr-11 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow ${
                    confirmPasswordError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p id="confirm-password-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {confirmPasswordError}
                </p>
              )}
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
            disabled={isLoading || isGithubLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGithubLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" aria-hidden="true" />
                <span className="text-sm font-medium text-slate-700">Connecting to GitHub...</span>
              </>
            ) : (
              <>
                <Github className="w-5 h-5 text-slate-700" aria-hidden="true" />
                <span className="text-sm font-medium text-slate-700">GitHub</span>
              </>
            )}
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
