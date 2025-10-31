/**
 * VerifyEmail Component
 *
 * Handles email verification from email link.
 * Reads token from URL query parameter and sends to backend.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');

          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <Loader2
                className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-spin"
                role="status"
                aria-label="Verifying email"
              />
            )}
            {status === 'success' && (
              <CheckCircle2
                className="w-16 h-16 text-green-600 dark:text-green-400"
                role="img"
                aria-label="Success"
              />
            )}
            {status === 'error' && (
              <XCircle
                className="w-16 h-16 text-red-600 dark:text-red-400"
                role="img"
                aria-label="Error"
              />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {status === 'verifying' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* Message */}
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {message}
          </p>

          {/* Actions */}
          {status === 'success' && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Redirecting you to the home page...
            </p>
          )}

          {status === 'error' && (
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
