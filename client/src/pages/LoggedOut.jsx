/**
 * LoggedOut - Post-logout landing page
 *
 * Shown after user logs out to:
 * - Confirm logout was successful
 * - Prevent automatic session_start tracking (session inflation)
 * - Provide easy path back to the app or login
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LogOut, Home, LogIn } from 'lucide-react';

export function LoggedOut() {
  const navigate = useNavigate();

  // Set a flag to prevent session tracking when user returns to app
  useEffect(() => {
    sessionStorage.setItem('cs_logged_out', 'true');
  }, []);

  const handleContinue = () => {
    // Clear the logged-out flag so session tracking resumes normally
    sessionStorage.removeItem('cs_logged_out');
    navigate('/');
  };

  const handleLogin = () => {
    // Clear the logged-out flag so session tracking resumes normally
    sessionStorage.removeItem('cs_logged_out');
    navigate('/?login=true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <LogOut className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            You've been logged out
          </h1>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-300 mb-8">
            Your session has ended successfully. You can continue browsing or log back in to access your account.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {/* Primary: Continue to app */}
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              Continue to CodeScribe
            </button>

            {/* Secondary: Log back in */}
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg border border-slate-300 dark:border-slate-600 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Log back in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
