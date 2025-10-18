import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Formats error type strings by removing underscores and capitalizing each word
 * @param {string} errorType - Raw error type (e.g., "invalid_request_error")
 * @returns {string} Formatted error type (e.g., "Invalid Request Error")
 */
function formatErrorType(errorType) {
  if (!errorType || typeof errorType !== 'string') return 'Error';

  return errorType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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

  // Parse error - could be string or object with type/message
  let errorHeading = 'Error';
  let errorMessage = error;
  let fullErrorObject = null;

  try {
    // If error is a string, try to parse it as JSON
    if (typeof error === 'string') {
      try {
        const parsed = JSON.parse(error);
        fullErrorObject = parsed;

        // Handle nested structure: {error: {type: "...", message: "..."}}
        if (parsed.error && typeof parsed.error === 'object') {
          errorHeading = formatErrorType(parsed.error.type) || 'Error';
          errorMessage = parsed.error.message || JSON.stringify(parsed.error);
        }
        // Handle flat structure: {error: "Type", message: "Message"}
        else if (parsed.type || parsed.error) {
          errorHeading = formatErrorType(parsed.type || parsed.error) || 'Error';
          errorMessage = parsed.message || error;
        }
        else {
          errorMessage = error;
        }
      } catch {
        // Not JSON, treat as plain string
        errorMessage = error;
      }
    } else if (typeof error === 'object' && error !== null) {
      // Error is already an object
      fullErrorObject = error;

      // Handle nested structure: {error: {type: "...", message: "..."}}
      if (error.error && typeof error.error === 'object') {
        errorHeading = formatErrorType(error.error.type) || 'Error';
        errorMessage = error.error.message || JSON.stringify(error.error);
      }
      // Handle flat structure: {type: "Type", error: "Type", message: "Message"}
      else {
        errorHeading = formatErrorType(error.type || error.error) || 'Error';
        errorMessage = error.message || JSON.stringify(error);
      }
    }
  } catch (e) {
    console.error('Error parsing error object:', e);
    errorMessage = String(error);
  }

  // Log full error details to console for technical debugging
  if (fullErrorObject) {
    console.error('Error Banner - Full Details:', fullErrorObject);
  }

  // Check if error message contains multiple lines (for validation errors)
  const isMultiLine = errorMessage.includes('\n');
  const errorLines = isMultiLine ? errorMessage.split('\n') : [errorMessage];

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
          <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 mb-1">
            {errorHeading}
          </h3>
          {isMultiLine ? (
            <div className="text-sm text-red-800 space-y-1.5 leading-relaxed">
              {errorLines.map((line, index) => (
                <p key={index} className={line.trim() ? '' : 'hidden'}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-800 leading-relaxed">
              {errorMessage}
            </p>
          )}
          {retryAfter && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs font-medium text-red-600 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" aria-hidden="true"></span>
                Please wait {retryAfter} seconds before trying again.
              </p>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 motion-reduce:transition-none"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}