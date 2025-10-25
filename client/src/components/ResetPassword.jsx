/**
 * ResetPassword - Password Reset Confirmation Page
 *
 * Allows users to set a new password using the reset token from email.
 * Validates token, shows appropriate error/success states.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './Button';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, error: authError, clearError } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const passwordInputRef = useRef(null);
  const token = searchParams.get('token');

  // Auto-focus password input on mount
  useEffect(() => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  // Check if token is present
  useEffect(() => {
    if (!token) {
      setLocalError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setLocalError('');
    setSuccessMessage('');
    clearError();

    // Validate inputs
    if (!password.trim()) {
      setLocalError('Password is required');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setLocalError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!token) {
      setLocalError('Invalid or missing reset token');
      return;
    }

    try {
      setIsLoading(true);

      const result = await resetPassword(token, password);

      if (result.success) {
        setSuccessMessage(result.message || 'Password reset successfully!');
        setPassword('');
        setConfirmPassword('');

        // Redirect to home page after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setLocalError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">
      {/* Logo and Header */}
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <Logo className="h-12 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset Your Password</h1>
        <p className="text-slate-600">Enter your new password below</p>
      </div>

      {/* Reset Form Card */}
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        {/* Success Message */}
        {successMessage && (
          <div
            className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
            role="alert"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm text-green-800 font-medium">{successMessage}</p>
              <p className="text-xs text-green-700">Redirecting to home page...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && !successMessage && (
          <div
            className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Input */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  ref={passwordInputRef}
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
                  autoComplete="new-password"
                  disabled={isLoading || !!successMessage}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-shadow"
                  autoComplete="new-password"
                  disabled={isLoading || !!successMessage}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading || !token || !!successMessage}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        )}

        {/* Back to Home Link */}
        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium focus:outline-none focus:underline"
            disabled={isLoading}
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>Need help? Contact support at support@codescribeai.com</p>
      </div>
    </div>
  );
}
