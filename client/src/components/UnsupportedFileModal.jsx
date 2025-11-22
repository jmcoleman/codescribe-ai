import { XCircle, FileCode, X } from 'lucide-react';

/**
 * UnsupportedFileModal - Shows when user tries to upload unsupported file types
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {string} fileName - Name of the rejected file
 * @param {string} fileExtension - Extension of the rejected file (e.g., '.pdf')
 */
export function UnsupportedFileModal({ isOpen, onClose, fileName, fileExtension }) {
  if (!isOpen) return null;

  // Grouped by language for better readability
  const supportedFileTypes = {
    'JavaScript/TypeScript': ['.js', '.jsx', '.ts', '.tsx'],
    'Python': ['.py'],
    'Java': ['.java'],
    'C/C++': ['.c', '.cpp', '.h', '.hpp'],
    'C#': ['.cs'],
    'Go': ['.go'],
    'Rust': ['.rs'],
    'Ruby': ['.rb'],
    'PHP': ['.php'],
    'Kotlin': ['.kt', '.kts'],
    'Swift': ['.swift'],
    'Dart': ['.dart'],
    'Shell': ['.sh', '.bash', '.zsh'],
    'Other': ['.gs', '.txt']
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsupported-file-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
            <XCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="unsupported-file-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Unsupported File Type
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {fileName && (
                <>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{fileName}</span>
                  {' '}cannot be processed
                </>
              )}
              {!fileName && fileExtension && (
                <>
                  Files with <span className="font-medium text-slate-900 dark:text-slate-100">{fileExtension}</span> extension are not supported
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Supported File Types
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {Object.entries(supportedFileTypes).map(([language, extensions]) => (
              <div key={language} className="text-sm">
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language}
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-mono text-xs">
                  {extensions.join(', ')}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-100">Max file size:</strong> 500 KB
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 active:bg-purple-800 dark:active:bg-purple-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
