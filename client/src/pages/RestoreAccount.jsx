import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function RestoreAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid restore link. No token provided.');
      return;
    }

    restoreAccount(token);
  }, [searchParams]);

  const restoreAccount = async (token) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${API_URL}/api/user/restore-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore account');
      }

      setStatus('success');
      setMessage('Your account has been successfully restored!');
      setEmail(data.email);

      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to restore account. Please try again or contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        {status === 'loading' && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <RefreshCw className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Restoring Your Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we restore your account...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Account Restored Successfully!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {message}
            </p>

            {email && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Email:</strong> {email}
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ✅ Your scheduled deletion has been canceled<br />
                ✅ All your data and settings are preserved<br />
                ✅ You can now sign in and continue using CodeScribe AI
              </p>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Redirecting you to the home page in 5 seconds...
            </p>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
            >
              Go to Home Page
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Restoration Failed
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {message}
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Possible reasons:</strong><br />
                • The restore link has expired<br />
                • The link has already been used<br />
                • Your account was not scheduled for deletion<br />
                • Your account has already been permanently deleted
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
              >
                Go to Home Page
              </button>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                Need help? Contact us at{' '}
                <a
                  href="mailto:support@codescribeai.com"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  support@codescribeai.com
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
