/**
 * AuthCallback Component
 *
 * Handles OAuth callback after successful GitHub authentication.
 * Extracts JWT token from URL parameters, stores it in localStorage,
 * and redirects to the home page.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearError } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Get token from URL parameters
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      // Handle error case
      if (error) {
        console.error('OAuth error:', error);
        // Redirect to home with error message
        navigate('/?auth_error=' + encodeURIComponent(error), { replace: true });
        return;
      }

      // Handle success case
      if (token) {
        try {
          // Store token in localStorage
          localStorage.setItem('auth_token', token);

          // Clear any previous auth errors
          clearError();

          // Redirect to home page with full page reload
          // This triggers AuthContext initialization with the new token
          // Using window.location.href instead of navigate + reload
          // ensures a clean navigation without the callback URL in history
          window.location.href = '/';
        } catch (err) {
          console.error('Error storing auth token:', err);
          navigate('/?auth_error=token_storage_failed', { replace: true });
        }
      } else {
        // No token or error - redirect to home
        console.warn('OAuth callback received with no token or error');
        navigate('/?auth_error=missing_token', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, clearError]);

  // Show loading state while processing callback
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
