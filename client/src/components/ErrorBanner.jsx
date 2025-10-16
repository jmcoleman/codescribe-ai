import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ErrorBanner({ error, retryAfter, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Handle enter animation when error appears
  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [error]);

  const handleDismiss = () => {
    setIsExiting(true);
    // Wait for exit animation to complete before calling onDismiss
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 200); // Match exit animation duration (200ms)
  };

  if (!error || !isVisible) return null;

  // Check if error contains multiple lines (for validation errors)
  const isMultiLine = error.includes('\n');
  const errorLines = isMultiLine ? error.split('\n') : [error];

  return (
    <div
      className={`bg-red-50 rounded-lg shadow-sm mb-6 ${
        isExiting ? 'animate-fade-out' : 'animate-slide-in-fade'
      } motion-reduce:animate-none`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4 p-4">
        {/* Error Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 mb-1">
            Error
          </h3>
          {isMultiLine ? (
            <div className="text-sm text-red-700 space-y-1.5 leading-relaxed">
              {errorLines.map((line, index) => (
                <p key={index} className={line.trim() ? '' : 'hidden'}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-700 leading-relaxed">
              {error}
            </p>
          )}
          {retryAfter && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs font-medium text-red-600 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" aria-hidden="true"></span>
                Please wait {retryAfter} seconds before trying again.
              </p>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 motion-reduce:transition-none"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}