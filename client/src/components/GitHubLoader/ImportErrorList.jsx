/**
 * Import Error List Component
 * Displays failed imports with retry capability
 */

import { XCircle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function ImportErrorList({
  errors,
  onRetry,
  onClose
}) {
  const [expandedErrors, setExpandedErrors] = useState(new Set());
  const [copiedIndex, setCopiedIndex] = useState(null);

  const toggleError = (index) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedErrors(newExpanded);
  };

  const copyError = (error, index) => {
    const errorText = `File: ${error.path}\nError: ${error.error}`;
    navigator.clipboard.writeText(errorText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const retryAll = () => {
    const failedPaths = errors.map(e => e.path);
    onRetry(failedPaths);
  };

  const retrySingle = (path) => {
    onRetry([path]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Import Errors
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {errors.length} file{errors.length !== 1 ? 's' : ''} failed to import
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {errors.map((error, index) => {
              const isExpanded = expandedErrors.has(index);
              const isCopied = copiedIndex === index;

              return (
                <div
                  key={index}
                  className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden"
                >
                  {/* Error Header */}
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20">
                    <button
                      onClick={() => toggleError(index)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-red-900 dark:text-red-100 truncate">
                        {error.path}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <button
                        onClick={() => copyError(error, index)}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
                        title={isCopied ? 'Copied!' : 'Copy error'}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => retrySingle(error.path)}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
                        title="Retry this file"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Error Details */}
                  {isExpanded && (
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-red-200 dark:border-red-800">
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-mono break-words">
                        {error.error}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click on an error to view details
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={retryAll}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
