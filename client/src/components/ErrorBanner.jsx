import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { CopyButton } from './CopyButton';

/**
 * Formats error type strings into user-friendly headings
 * @param {string} errorType - Raw error type (e.g., "TypeError", "RateLimitError")
 * @param {object} errorObject - Full error object for context
 * @returns {string} User-friendly error heading
 */
function formatErrorType(errorType, errorObject = {}) {
  if (!errorType || typeof errorType !== 'string') return 'Error';

  // Get both user-friendly message and original message for context
  const userMessage = errorObject.message || '';
  const originalMessage = errorObject.originalMessage || '';

  // Special cases for common error types (check originalMessage for "Failed to fetch")
  if (errorType === 'TypeError' && originalMessage.includes('Failed to fetch')) {
    return 'Connection Error';
  }
  if (errorType === 'RateLimitError' || userMessage.includes('Rate limit') || originalMessage.includes('Rate limit')) {
    return 'Rate Limit Exceeded';
  }
  if (errorType === 'InvalidRequestError') {
    return 'Invalid Request';
  }
  if (errorType === 'AuthenticationError') {
    return 'Authentication Error';
  }
  if (errorType === 'ValidationError') {
    return 'Validation Error';
  }
  if (errorType === 'SyntaxError') {
    return 'Invalid Input';
  }

  // Handle underscore-separated types (e.g., "invalid_request_error")
  if (errorType.includes('_')) {
    return errorType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Handle CamelCase types by adding spaces (e.g., "TypeError" → "Type Error", "RangeError" → "Range Error")
  // Use regex to insert space before capital letters that are preceded by lowercase letters
  return errorType.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function ErrorBanner({ error, retryAfter, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

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

  const handleToggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  const handleDetailsKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleDetails();
    }
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

        // Check if parsed is actually an object with our expected structure
        if (parsed && typeof parsed === 'object') {
          fullErrorObject = parsed;

          // Use the user-friendly message if available, otherwise fall back to original
          if (parsed.message) {
            errorMessage = parsed.message;
          } else if (parsed.originalMessage) {
            errorMessage = parsed.originalMessage;
          }

          // Use the error type for the heading (pass full error object for context)
          if (parsed.type) {
            errorHeading = formatErrorType(parsed.type, parsed);
          }
        } else {
          // Parsed but not an object, treat as plain string
          errorMessage = error;
        }
      } catch (parseError) {
        // Not JSON, treat as plain string
        errorMessage = error;
        // For plain string errors in dev mode, create a simple error object
        if (import.meta.env.DEV) {
          fullErrorObject = {
            message: error,
            type: 'Error',
            originalMessage: error,
            timestamp: new Date().toISOString()
          };
        }
      }
    } else if (typeof error === 'object' && error !== null) {
      // Error is already an object
      fullErrorObject = error;

      // Use the user-friendly message if available, otherwise fall back to original
      if (error.message) {
        errorMessage = error.message;
      } else if (error.originalMessage) {
        errorMessage = error.originalMessage;
      }

      // Use the error type for the heading (pass full error object for context)
      if (error.type) {
        errorHeading = formatErrorType(error.type, error);
      }
    }
  } catch (e) {
    console.error('Error parsing error object:', e);
    errorMessage = String(error);
  }

  // Log full error details to console for technical debugging (dev mode only)
  if (import.meta.env.DEV) {
    console.group('🔴 Error Banner Debug');
    console.log('Raw error:', error);
    console.log('Parsed fullErrorObject:', fullErrorObject);
    if (fullErrorObject) {
      console.log('- has stack?', !!fullErrorObject.stack);
      console.log('- has type?', !!fullErrorObject.type);
      console.log('- has originalMessage?', !!fullErrorObject.originalMessage);
      console.log('- has timestamp?', !!fullErrorObject.timestamp);
    }
    console.groupEnd();
  }

  // Check if error message contains multiple lines (for validation errors)
  const isMultiLine = errorMessage.includes('\n');
  const errorLines = isMultiLine ? errorMessage.split('\n') : [errorMessage];

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

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
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {errorHeading}
          </h3>
          {isMultiLine ? (
            <div className="text-sm text-slate-700 space-y-1.5 leading-relaxed">
              {errorLines.map((line, index) => (
                <p key={index} className={line.trim() ? '' : 'hidden'}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">
              {errorMessage}
            </p>
          )}
          {retryAfter && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs font-medium text-slate-700 flex items-center gap-2">
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

      {/* Technical Details (Development Mode Only) - Positioned at bottom */}
      {isDevelopment && (
        <div className="border-t border-red-200">
          <button
            type="button"
            onClick={handleToggleDetails}
            onKeyDown={handleDetailsKeyDown}
            aria-expanded={isDetailsExpanded}
            aria-controls="error-technical-details"
            aria-label={isDetailsExpanded ? "Hide technical details" : "Show technical details"}
            className="w-full flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-red-100 transition-colors duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-inset"
          >
            <svg className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isDetailsExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>Technical details (development mode)</span>
          </button>
          {/* Expandable Section with Smooth Animation */}
          <div
            id="error-technical-details"
            role="region"
            aria-label="Error technical details"
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isDetailsExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-4 pt-1 space-y-4">
            {/* Full Error Object */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-700">
                  {fullErrorObject ? 'Full error object' : 'Raw error'}
                </h4>
                <CopyButton
                  text={fullErrorObject ? JSON.stringify(fullErrorObject, null, 2) : String(error)}
                  size="sm"
                  variant="outline"
                  ariaLabel={fullErrorObject ? "Copy full error object" : "Copy raw error"}
                />
              </div>
              <pre className="bg-white text-slate-800 p-3 rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto border border-red-200 font-mono leading-relaxed shadow-sm">
                {fullErrorObject ? JSON.stringify(fullErrorObject, null, 2) : String(error)}
              </pre>
            </div>

            {/* Error Type */}
            {fullErrorObject && fullErrorObject.type && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700">Error type</h4>
                  <CopyButton
                    text={fullErrorObject.type}
                    size="sm"
                    variant="outline"
                    ariaLabel="Copy error type"
                  />
                </div>
                <pre className="bg-white text-slate-800 p-3 rounded-md text-xs overflow-x-auto border border-red-200 font-mono shadow-sm">
                  {fullErrorObject.type}
                </pre>
              </div>
            )}

            {/* Original Message */}
            {fullErrorObject && fullErrorObject.originalMessage && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700">Original error message</h4>
                  <CopyButton
                    text={fullErrorObject.originalMessage}
                    size="sm"
                    variant="outline"
                    ariaLabel="Copy original error message"
                  />
                </div>
                <pre className="bg-white text-slate-800 p-3 rounded-md text-xs overflow-x-auto border border-red-200 font-mono shadow-sm">
                  {fullErrorObject.originalMessage}
                </pre>
              </div>
            )}

            {/* Stack Trace */}
            {fullErrorObject && fullErrorObject.stack && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700">Stack trace</h4>
                  <CopyButton
                    text={fullErrorObject.stack}
                    size="sm"
                    variant="outline"
                    ariaLabel="Copy stack trace"
                  />
                </div>
                <pre className="bg-white text-slate-800 p-3 rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto border border-red-200 font-mono leading-relaxed shadow-sm">
                  {fullErrorObject.stack}
                </pre>
              </div>
            )}

            {/* Timestamp */}
            {fullErrorObject && fullErrorObject.timestamp && (
              <div className="pt-3 border-t border-red-200">
                <p className="text-xs text-slate-600">
                  Captured at: <span className="font-mono text-slate-800">{new Date(fullErrorObject.timestamp).toLocaleString()}</span>
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}