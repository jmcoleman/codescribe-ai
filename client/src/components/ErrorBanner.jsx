import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { formatDateTime } from '../utils/formatters';

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
  // Claude API rate limit (check BEFORE generic usage limit since message may contain "usage limit")
  if (errorType === 'RateLimitError' || userMessage.includes('Rate limit') || originalMessage.includes('Rate limit')) {
    if (userMessage.includes('Claude API') || originalMessage.includes('Claude API')) {
      return 'Claude API Rate Limit';
    }
    return 'Rate Limit Exceeded';
  }
  // CodeScribe usage limit (quota exceeded) - but NOT Claude API limits
  if (errorType === 'UsageLimitError' ||
      (userMessage.includes('usage limit') && !userMessage.includes('Claude API'))) {
    // Check for specific limit type in message
    if (userMessage.includes('daily')) {
      return 'Daily Limit Reached';
    }
    if (userMessage.includes('monthly')) {
      return 'Monthly Limit Reached';
    }
    return 'Usage Limit Reached';
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


  // Check if error message contains multiple lines (for validation errors)
  const isMultiLine = errorMessage.includes('\n');
  const errorLines = isMultiLine ? errorMessage.split('\n') : [errorMessage];

  // Check if we're in development mode OR if it's an upload error (temporary for debugging)
  const isUploadError = fullErrorObject && fullErrorObject.navigator;
  const isDevelopment = import.meta.env.DEV || isUploadError;

  return (
    <div
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 border-l-4 border-l-red-500 dark:border-l-red-400 rounded-lg shadow-sm mb-6 ${
        isExiting ? 'animate-fade-out' : 'animate-slide-in-fade'
      } motion-reduce:animate-none`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4 p-4">
        {/* Error Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            {errorHeading}
          </h3>
          {isMultiLine ? (
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
              {errorLines.map((line, index) => (
                <p key={index} className={line.trim() ? '' : 'hidden'}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {errorMessage}
            </p>
          )}
          {retryAfter && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full animate-pulse" aria-hidden="true"></span>
                Please wait {retryAfter} seconds before trying again.
              </p>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 motion-reduce:transition-none"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Technical Details (Development Mode Only) - Positioned at bottom */}
      {isDevelopment && (
        <div className="border-t border-red-200 dark:border-red-800">
          <button
            type="button"
            onClick={handleToggleDetails}
            onKeyDown={handleDetailsKeyDown}
            aria-expanded={isDetailsExpanded}
            aria-controls="error-technical-details"
            aria-label={isDetailsExpanded ? "Hide technical details" : "Show technical details"}
            className="w-full flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:focus-visible:ring-red-400 focus-visible:ring-inset"
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
            className={`transition-all duration-300 ease-in-out ${
              isDetailsExpanded ? 'max-h-[800px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            <div className="px-4 pb-4 pt-1 space-y-4">
            {/* Error Object */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {fullErrorObject ? 'Error object' : 'Raw error'}
                </h4>
                <CopyButton
                  text={fullErrorObject ? JSON.stringify(fullErrorObject, null, 2) : String(error)}
                  size="sm"
                  variant="outline"
                  ariaLabel={fullErrorObject ? "Copy error object" : "Copy raw error"}
                />
              </div>
              <pre className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto border border-red-200 dark:border-red-800 font-mono leading-relaxed shadow-sm whitespace-pre-wrap">
                {fullErrorObject ? (() => {
                  // Custom formatter: display each field with proper formatting
                  const obj = { ...fullErrorObject };
                  const lines = ['{'];

                  Object.keys(obj).forEach((key, index, array) => {
                    const value = obj[key];
                    const isLast = index === array.length - 1;

                    if (key === 'stack' && typeof value === 'string') {
                      // Display stack trace with actual line breaks (no escaping)
                      lines.push(`  "${key}": "${value}"${isLast ? '' : ','}`);
                    } else if (key === 'originalMessage' && typeof value === 'string') {
                      // originalMessage contains JSON - display it without double-escaping
                      lines.push(`  "${key}": ${value}${isLast ? '' : ','}`);
                    } else if (typeof value === 'string') {
                      // Display strings normally (JSON.stringify handles escaping)
                      lines.push(`  "${key}": ${JSON.stringify(value)}${isLast ? '' : ','}`);
                    } else if (typeof value === 'number' || typeof value === 'boolean') {
                      lines.push(`  "${key}": ${value}${isLast ? '' : ','}`);
                    } else if (value === null) {
                      lines.push(`  "${key}": null${isLast ? '' : ','}`);
                    } else {
                      // For objects, use JSON.stringify
                      lines.push(`  "${key}": ${JSON.stringify(value)}${isLast ? '' : ','}`);
                    }
                  });

                  lines.push('}');
                  return lines.join('\n');
                })() : String(error)}
              </pre>
            </div>

            {/* Error Message */}
            {fullErrorObject && fullErrorObject.originalMessage && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Error message</h4>
                  <CopyButton
                    text={fullErrorObject.originalMessage}
                    size="sm"
                    variant="outline"
                    ariaLabel="Copy error message"
                  />
                </div>
                <pre className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-md text-xs overflow-x-auto border border-red-200 dark:border-red-800 font-mono shadow-sm">
                  {fullErrorObject.originalMessage}
                </pre>
              </div>
            )}

            {/* Stack Trace */}
            {fullErrorObject && fullErrorObject.stack && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Stack trace</h4>
                  <CopyButton
                    text={fullErrorObject.stack}
                    size="sm"
                    variant="outline"
                    ariaLabel="Copy stack trace"
                  />
                </div>
                <pre className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto border border-red-200 dark:border-red-800 font-mono leading-relaxed shadow-sm">
                  {fullErrorObject.stack}
                </pre>
              </div>
            )}

            {/* Timestamp */}
            {fullErrorObject && fullErrorObject.timestamp && (
              <div className="pt-3 border-t border-red-200 dark:border-red-800">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Captured at: <span className="font-mono text-slate-800 dark:text-slate-200">{formatDateTime(fullErrorObject.timestamp)}</span>
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