import { X, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * SaveDocsConsentModal Component
 *
 * Modal shown on first document generation if user.save_docs_preference === 'ask'.
 * Allows user to choose whether to save generated documentation to the database.
 *
 * Privacy-First Design:
 * - Only saves generated documentation (our output)
 * - Never stores user's source code
 * - Transparent about what we save vs. don't save
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onChoice - Called with choice: 'always' | 'once' | 'never' | 'cancel'
 */
export function SaveDocsConsentModal({ isOpen, onChoice }) {
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);

  // Focus management - focus first button when modal opens
  useEffect(() => {
    if (isOpen && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation - Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onChoice('cancel');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onChoice]);

  // Focus trap - keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={() => onChoice('cancel')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-docs-modal-title"
      aria-describedby="save-docs-modal-description"
    >
      <div
        ref={modalRef}
        className="modal-container max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Info Icon */}
            <div className="flex-shrink-0 bg-slate-100 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-500/50 p-3 rounded-full">
              <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>

            {/* Title and close button */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 id="save-docs-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Save Generated Documentation?
                </h2>
                <button
                  type="button"
                  onClick={() => onChoice('cancel')}
                  className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div id="save-docs-modal-description" className="px-6 pb-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              We can save your generated documentation to your account for easy access across devices and sessions.
            </p>

            {/* Privacy Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Privacy Note:</strong> We never store your code. Only the documentation we generate for you is saved.
                If your code contains sensitive information in comments, consider choosing "Never Save".
              </p>
            </div>

            {/* What we save */}
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <strong>What we save:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Generated documentation text</li>
                <li>Quality scores and feedback</li>
                <li>File metadata (name, language, size)</li>
              </ul>
            </div>

            {/* What we DON'T save */}
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <strong>What we DON&apos;T save:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Your source code</li>
                <li>Sensitive information or secrets</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 px-6 py-4 rounded-b-xl">
          <div className="space-y-3">
            {/* Primary action - Always Save */}
            <button
              ref={firstButtonRef}
              type="button"
              onClick={() => onChoice('always')}
              className="w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:active:bg-indigo-900 text-white rounded-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 shadow-lg shadow-indigo-600/20 dark:shadow-indigo-900/30 transition-all duration-200"
            >
              Always Save
            </button>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChoice('once')}
                className="btn-secondary px-5 py-2.5 shadow-sm"
              >
                Save This Time
              </button>
              <button
                type="button"
                onClick={() => onChoice('never')}
                className="btn-secondary px-5 py-2.5 shadow-sm"
              >
                Never Save
              </button>
            </div>

            {/* Tertiary action - Cancel */}
            <button
              type="button"
              onClick={() => onChoice('cancel')}
              className="w-full px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 transition-colors duration-200"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
