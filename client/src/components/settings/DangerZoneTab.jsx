import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Trash2, X, Shield } from 'lucide-react';
import { toastCompact } from '../../utils/toast';

export function DangerZoneTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const confirmationInputRef = useRef(null);

  // Auto-focus confirmation input when modal opens
  useEffect(() => {
    if (showDeleteConfirmation && confirmationInputRef.current) {
      confirmationInputRef.current.focus();
    }
  }, [showDeleteConfirmation]);

  // ESC key to close modal
  useEffect(() => {
    if (!showDeleteConfirmation) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        setShowDeleteConfirmation(false);
        setConfirmationText('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirmation, isDeleting]);

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      toastCompact('Please type DELETE MY ACCOUNT to confirm', 'error');
      return;
    }

    setIsDeleting(true);

    try {
      // TODO: Call API to delete account
      // await deleteAccount();

      toastCompact('Account deleted successfully', 'success');

      // Log out and redirect to home
      await logout();
      navigate('/');
    } catch (error) {
      toastCompact(error.message || 'Failed to delete account', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Privacy Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Your code is never stored—only account metadata is deleted.
          </span>
        </p>
      </div>

      {/* Delete Account Card - Button Visible */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Delete Account
            </h2>
            <p className="text-sm text-red-700 dark:text-red-400">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Collapsible Details */}
        <details className="mb-6 group">
          <summary className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors list-none flex items-center gap-2">
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            What will be deleted
          </summary>
          <ul className="list-disc list-inside space-y-1.5 mt-3 ml-6 text-sm text-slate-600 dark:text-slate-400">
            <li>Your profile information (name, email)</li>
            <li>Usage history and statistics</li>
            <li>Subscription and billing information</li>
            <li>Account preferences and settings</li>
          </ul>
        </details>

        {/* Button VISIBLE without scrolling */}
        <button
          onClick={() => setShowDeleteConfirmation(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20 transition-all duration-200"
        >
          <Trash2 className="w-5 h-5" aria-hidden="true" />
          <span>Delete My Account</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 ring-1 ring-slate-200 dark:ring-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Confirm Account Deletion
              </h3>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setConfirmationText('');
                }}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p className="font-semibold mb-1">This action is permanent</p>
                  <p>All your data will be deleted immediately and cannot be recovered.</p>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                To confirm, please type{' '}
                <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-900 dark:text-white font-mono text-xs">
                  DELETE MY ACCOUNT
                </code>{' '}
                below:
              </p>

              <input
                ref={confirmationInputRef}
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type here to confirm"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={confirmationText !== 'DELETE MY ACCOUNT' || isDeleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                    <span>Delete Account</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setConfirmationText('');
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
