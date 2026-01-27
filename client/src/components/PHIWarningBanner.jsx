/**
 * PHI Warning Banner Component
 * Displays warnings when potential Protected Health Information is detected in code
 * WCAG AA compliant with proper color contrast and accessibility features
 */

import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * PHI Warning Banner Component
 * @param {Object} props
 * @param {Object} props.phiDetection - PHI detection results
 * @param {boolean} props.phiDetection.containsPHI - Whether PHI was detected
 * @param {string} props.phiDetection.confidence - Confidence level (high/medium/low)
 * @param {Object} props.phiDetection.findings - Detailed findings
 * @param {number} props.phiDetection.score - PHI confidence score (0-100)
 * @param {Array} props.phiDetection.suggestions - Sanitization suggestions
 * @param {Function} props.onDismiss - Callback when banner is dismissed
 * @param {Function} props.onProceed - Callback when user confirms and proceeds
 * @returns {JSX.Element|null}
 */
export function PHIWarningBanner({ phiDetection, onDismiss, onProceed }) {
  const [confirmed, setConfirmed] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);

  if (!phiDetection || !phiDetection.containsPHI) {
    return null;
  }

  const { confidence, findings, score, suggestions } = phiDetection;

  /**
   * Get appropriate colors based on risk level
   */
  const getRiskColors = () => {
    if (confidence === 'high') {
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-500 dark:border-red-400',
        text: 'text-red-900 dark:text-red-100',
        button: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
      };
    }
    if (confidence === 'medium') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950',
        border: 'border-amber-500 dark:border-amber-400',
        text: 'text-amber-900 dark:text-amber-100',
        button: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600',
      };
    }
    return {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-500 dark:border-yellow-400',
      text: 'text-yellow-900 dark:text-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600',
    };
  };

  /**
   * Format findings into readable text
   */
  const formatFindings = () => {
    const items = Object.entries(findings)
      .filter(([type]) => type !== 'healthKeywords') // Exclude generic keywords
      .map(
        ([type, data]) => `${data.count} ${data.description}${data.count > 1 ? 's' : ''}`
      )
      .join(', ');
    return items || 'Healthcare-related patterns';
  };

  const colors = getRiskColors();

  return (
    <div
      className={`border-l-4 ${colors.border} ${colors.bg} p-4 mb-4 rounded-r-md`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <AlertTriangle
          className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${colors.text}`}
          aria-hidden="true"
        />
        <div className="flex-1">
          {/* Header */}
          <h3 className={`font-semibold mb-1 ${colors.text}`}>
            Potential PHI Detected ({confidence.toUpperCase()} confidence)
          </h3>

          {/* Summary */}
          <p className={`text-sm mb-2 ${colors.text}`}>
            This code may contain Protected Health Information: {formatFindings()}
          </p>

          {/* Recommendation */}
          <p className={`text-sm mb-3 ${colors.text}`}>
            <strong>Recommendation:</strong> Remove or sanitize PHI before generating
            documentation to maintain HIPAA compliance.
          </p>

          {/* Sanitization Suggestions (Collapsible) */}
          {suggestions && suggestions.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                className={`text-sm font-medium ${colors.text} flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 rounded`}
                aria-expanded={suggestionsExpanded}
              >
                {suggestionsExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
                View sanitization suggestions ({suggestions.length})
              </button>

              {suggestionsExpanded && (
                <ul className={`mt-2 ml-6 space-y-2 text-sm ${colors.text}`}>
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <strong>{suggestion.title}:</strong> {suggestion.message}
                      {suggestion.examples && suggestion.examples.length > 0 && (
                        <div className="mt-1 ml-4 text-xs opacity-75">
                          Examples found: {suggestion.examples.join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
            {/* Primary Action: Sanitize */}
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Sanitize Code First (Recommended)
            </button>

            {/* Confirmation Checkbox + Proceed Button */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="phi-confirmation"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
                  aria-describedby="phi-confirmation-label"
                />
                <span
                  id="phi-confirmation-label"
                  className={`text-sm ${colors.text}`}
                >
                  I've verified this code contains no real PHI
                </span>
              </label>

              <button
                onClick={() => {
                  if (confirmed) {
                    onProceed();
                  }
                }}
                disabled={!confirmed}
                className={`px-4 py-2 ${colors.button} text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                aria-label="Proceed with generation after confirming no real PHI"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className={`ml-3 flex-shrink-0 ${colors.text} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 rounded`}
          aria-label="Dismiss PHI warning"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default PHIWarningBanner;
