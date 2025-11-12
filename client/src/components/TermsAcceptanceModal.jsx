/**
 * Terms Acceptance Modal
 * Blocks user actions until they accept updated Terms of Service and Privacy Policy
 * Triggered when CURRENT_TERMS_VERSION or CURRENT_PRIVACY_VERSION changes
 */

import { useState } from 'react';
import { AlertCircle, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function TermsAcceptanceModal({
  isOpen,
  onAccept,
  missingAcceptance,
  currentVersions,
}) {
  // Note: onClose is not provided for this modal as it's non-dismissible
  // Pass a no-op function to useFocusTrap
  const modalRef = useFocusTrap(isOpen, () => {});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsTerms = missingAcceptance?.terms !== null;
  const needsPrivacy = missingAcceptance?.privacy !== null;

  const handleAccept = async () => {
    // Validate checkboxes
    if (needsTerms && !acceptedTerms) {
      setError('You must accept the Terms of Service to continue');
      return;
    }
    if (needsPrivacy && !acceptedPrivacy) {
      setError('You must accept the Privacy Policy to continue');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onAccept({
        accept_terms: true,
        accept_privacy: true,
      });
      // Reset loading state on success
      setLoading(false);
      // Modal will close via parent component on success
    } catch (err) {
      console.error('Error accepting terms:', err);
      setError(err.message || 'Failed to record acceptance. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - non-dismissible */}
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div ref={modalRef} className="modal-container w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 border border-transparent dark:border-purple-500/50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Updated Legal Documents
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Please review and accept to continue
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Notice */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                We've updated our legal documents. To continue using CodeScribe AI, please review and accept the current
                versions below.
              </p>
            </div>

            {/* Documents to Accept */}
            <div className="space-y-4">
              {needsTerms && (
                <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Terms of Service
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Version: {currentVersions?.terms || 'N/A'}
                      </p>
                      <Link
                        to="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 dark:text-cyan-400 hover:text-purple-700 dark:hover:text-cyan-300 font-medium"
                      >
                        Read Terms of Service →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {needsPrivacy && (
                <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Privacy Policy
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Version: {currentVersions?.privacy || 'N/A'}
                      </p>
                      <Link
                        to="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 dark:text-cyan-400 hover:text-purple-700 dark:hover:text-cyan-300 font-medium"
                      >
                        Read Privacy Policy →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Acceptance Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              {needsTerms && (
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-purple-600 border-slate-300 dark:border-slate-600 rounded focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 cursor-pointer"
                    disabled={loading}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 select-none">
                    I have read and accept the{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 dark:text-cyan-400 hover:text-purple-700 dark:hover:text-cyan-300 font-medium"
                    >
                      Terms of Service
                    </Link>
                  </span>
                </label>
              )}

              {needsPrivacy && (
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 text-purple-600 border-slate-300 dark:border-slate-600 rounded focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 cursor-pointer"
                    disabled={loading}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 select-none">
                    I have read and accept the{' '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 dark:text-cyan-400 hover:text-purple-700 dark:hover:text-cyan-300 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleAccept}
              disabled={loading || (!acceptedTerms && needsTerms) || (!acceptedPrivacy && needsPrivacy)}
              className="btn-primary w-full px-6 py-3 font-semibold disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? 'Accepting...' : 'Accept and Continue'}
            </button>
          </div>

          {/* Footer Note */}
          <p className="mt-6 text-xs text-center text-slate-500 dark:text-slate-400">
            You must accept the updated legal documents to continue using CodeScribe AI.
            This action cannot be dismissed.
          </p>
        </div>
      </div>
    </div>
  );
}
