import { useEffect, useRef } from 'react';
import { AlertTriangle, FileCode, X } from 'lucide-react';

/**
 * UnsupportedFileModal - Shows when user tries to upload unsupported file types
 * Matches ConfirmModal brand patterns and UX guidelines
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {string} fileName - Name of the rejected file
 * @param {string} fileExtension - Extension of the rejected file (e.g., '.pdf')
 */
export function UnsupportedFileModal({ isOpen, onClose, fileName, fileExtension }) {
  const closeButtonRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Condensed list of common examples
  const commonExamples = [
    { lang: 'JavaScript/TypeScript', exts: '.js, .jsx, .ts, .tsx' },
    { lang: 'Python', exts: '.py' },
    { lang: 'Java', exts: '.java' },
    { lang: 'C/C++/C#', exts: '.c, .cpp, .cs, .h' },
    { lang: 'Go/Rust/Ruby', exts: '.go, .rs, .rb' },
    { lang: 'Others', exts: '.php, .kt, .swift, .dart, .sh' }
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsupported-file-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h2
              id="unsupported-file-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Unsupported File Type
            </h2>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* File rejection message */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 border-l-4 border-l-amber-500 dark:border-l-amber-400 rounded-lg mb-4">
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              {fileName && (
                <>
                  <strong className="font-semibold">{fileName}</strong> cannot be processed.
                </>
              )}
              {!fileName && fileExtension && (
                <>
                  Files with <strong className="font-semibold">{fileExtension}</strong> extension are not supported.
                </>
              )}
              {' '}Please use a supported source code file.
            </p>
          </div>

          {/* Supported types - condensed */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FileCode className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Supported File Types
              </h3>
            </div>

            <div className="space-y-2">
              {commonExamples.map((item) => (
                <div key={item.lang} className="grid grid-cols-[minmax(0,160px)_1fr] gap-3 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.lang}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {item.exts}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Max file size notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-100">Max file size:</strong> 500 KB per file
            </p>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-4">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
