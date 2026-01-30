/**
 * PHI Warning Banner Component
 * Displays warnings when potential Protected Health Information is detected in code
 * WCAG AA compliant with proper color contrast and accessibility features
 */

import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { PHISanitizationModal } from './PHISanitizationModal';

/**
 * PHI Warning Banner Component
 * @param {Object} props
 * @param {Object} props.phiDetection - PHI detection results
 * @param {boolean} props.phiDetection.containsPHI - Whether PHI was detected
 * @param {string} props.phiDetection.confidence - Confidence level (high/medium/low)
 * @param {Object} props.phiDetection.findings - Detailed findings
 * @param {number} props.phiDetection.score - PHI confidence score (0-100)
 * @param {Array} props.phiDetection.suggestions - Sanitization suggestions
 * @param {string} props.code - Original code for sanitization
 * @param {Function} props.onCodeSanitized - Callback when code is sanitized with new code
 * @param {Function} props.onDismiss - Callback when banner is dismissed
 * @param {Function} props.onProceed - Callback when user confirms and proceeds
 * @returns {JSX.Element|null}
 */
export function PHIWarningBanner({ phiDetection, code, onCodeSanitized, onDismiss, onProceed }) {
  const { effectiveTheme } = useTheme();
  const [confirmed, setConfirmed] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [showSanitizationModal, setShowSanitizationModal] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(true); // Banner starts expanded

  if (!phiDetection || !phiDetection.containsPHI) {
    return null;
  }

  const { confidence, findings, score, suggestions } = phiDetection;

  /**
   * Get appropriate colors based on risk level
   * Follows BANNER-PATTERNS.md: slate backgrounds with colored accent borders
   */
  const getRiskColors = () => {
    if (confidence === 'high') {
      return {
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-red-500 dark:border-red-400',
        text: 'text-slate-900 dark:text-white',
        textBody: 'text-slate-700 dark:text-slate-300',
        icon: 'text-red-600 dark:text-red-400',
        button: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
      };
    }
    if (confidence === 'medium') {
      return {
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-amber-500 dark:border-amber-400',
        text: 'text-slate-900 dark:text-white',
        textBody: 'text-slate-700 dark:text-slate-300',
        icon: 'text-amber-600 dark:text-amber-400',
        button: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600',
      };
    }
    return {
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-yellow-500 dark:border-yellow-400',
      text: 'text-slate-900 dark:text-white',
      textBody: 'text-slate-700 dark:text-slate-300',
      icon: 'text-yellow-600 dark:text-yellow-400',
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
      className={`border-l-4 ${colors.border} ${colors.bg} mb-4 rounded-r-md transition-all duration-200`}
      role="alert"
      aria-live="assertive"
    >
      {/* Always Visible: Header with Collapse/Expand Toggle */}
      <div className="flex items-start p-4">
        {/* Left side: Expand/Collapse Toggle + Icon + Header */}
        <button
          onClick={() => setBannerExpanded(!bannerExpanded)}
          className="flex items-start flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 rounded -m-1 p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label={bannerExpanded ? "Collapse banner" : "Expand banner"}
          aria-expanded={bannerExpanded}
        >
          {/* Chevron Icon - Left Side */}
          <span className="flex-shrink-0 mr-2 mt-0.5 text-slate-600 dark:text-slate-400">
            {bannerExpanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </span>

          <AlertTriangle
            className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${colors.icon}`}
            aria-hidden="true"
          />

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-base ${colors.text}`}>
              {confidence === 'high'
                ? 'Protected Health Information Detected'
                : confidence === 'medium'
                ? 'Protected Health Information Detected'
                : 'Possible Protected Health Information Detected'
              }
            </h3>
            <p className={`text-sm font-medium ${colors.textBody} opacity-75 mt-1`}>
              Detection Confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)} • {formatFindings()}
            </p>
          </div>
        </button>

        {/* Right side: Close Button (completely separate) */}
        <button
          onClick={confirmed ? onDismiss : undefined}
          disabled={!confirmed}
          className={`ml-3 p-1.5 rounded flex-shrink-0 ${colors.icon} ${confirmed ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer' : 'opacity-30 cursor-not-allowed'} focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 transition-all`}
          aria-label={confirmed ? "Dismiss PHI warning" : "Confirm no PHI to dismiss"}
          title={confirmed ? undefined : "Check the confirmation box to dismiss"}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Collapsible Content */}
      {bannerExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3"

        >
          {/* Compliance Warning */}
          <div className={`text-sm p-2.5 rounded border ${
            effectiveTheme === 'dark'
              ? 'bg-slate-900/50 border-slate-700'
              : 'bg-transparent border-slate-200'
          }`}>
            <p className={`font-semibold ${colors.text}`}>
              <span className="text-xs uppercase tracking-wide mr-2">HIPAA Compliance</span>
              <span className="font-normal">PHI must be removed or anonymized before documentation generation.</span>
            </p>
            <p className={`text-sm mt-1.5 ${colors.textBody} opacity-75`}>
              💡 Detected PHI is highlighted in the editor with wavy underlines. Click the lightbulb (Ctrl+.) for quick actions, or use the review panel below.
            </p>
          </div>

          {/* Sanitization Suggestions (Collapsible) */}
          {suggestions && suggestions.length > 0 && (
            <div>
              <button
                onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                className={`text-sm font-semibold ${colors.text} flex items-center gap-1.5 hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 rounded px-2 py-1 -ml-2`}
                aria-expanded={suggestionsExpanded}
              >
                {suggestionsExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
                Remediation Guidance ({suggestions.length} {suggestions.length === 1 ? 'item' : 'items'})
              </button>

              {suggestionsExpanded && (
                <div className={`mt-3 ml-1 space-y-3 text-sm ${colors.textBody}`}>
                  {reviewMode && (
                    <div className={`p-3 rounded-lg border-2 ${
                      effectiveTheme === 'dark'
                        ? 'bg-blue-900/20 border-blue-700'
                        : 'bg-blue-50 border-blue-300'
                    }`}>
                      <p className={`text-sm font-semibold ${effectiveTheme === 'dark' ? 'text-blue-300' : 'text-blue-900'} mb-1`}>
                        📋 Review Mode Active
                      </p>
                      <p className={`text-xs ${effectiveTheme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                        Review the detected PHI below, then manually remove or anonymize the sensitive data in your code editor. Click "Done - Code Sanitized" when finished.
                      </p>
                    </div>
                  )}

                  <ul className="space-y-2.5">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-xs font-bold opacity-50 mt-0.5">•</span>
                        <div className="flex-1">
                          <strong className={colors.text}>{suggestion.title}:</strong> {suggestion.message}
                          {suggestion.examples && suggestion.examples.length > 0 && (
                            <div className="mt-1.5 text-sm opacity-75 font-mono">
                              Detected: {suggestion.examples.join(', ')}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            {/* Review Mode Toggle or Dismiss */}
            {!reviewMode ? (
              <button
                onClick={() => {
                  if (code && onCodeSanitized) {
                    // Open interactive sanitization modal
                    setShowSanitizationModal(true);
                  } else {
                    // Fallback to manual review mode if code not provided
                    setReviewMode(true);
                    setSuggestionsExpanded(true);
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400"
              >
                Review & Sanitize Code
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={confirmed ? onDismiss : undefined}
                  disabled={!confirmed}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={confirmed ? undefined : "Check the confirmation box to confirm"}
                >
                  Done - Code Sanitized
                </button>
                <button
                  onClick={() => setReviewMode(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                >
                  Cancel Review
                </button>
              </div>
            )}

            {/* Secondary Action: Confirm No PHI */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  id="phi-confirmation"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    if (e.target.checked && onProceed) {
                      onProceed();
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 dark:text-purple-400 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-0 transition-colors flex-shrink-0"
                  aria-describedby="phi-confirmation-label"
                />
                <span
                  id="phi-confirmation-label"
                  className={`text-sm leading-tight ${colors.textBody} group-hover:opacity-75 transition-opacity`}
                >
                  I confirm this code contains no actual PHI and is safe to process
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Sanitization Modal */}
      {code && onCodeSanitized && (
        <PHISanitizationModal
          isOpen={showSanitizationModal}
          onClose={() => setShowSanitizationModal(false)}
          onComplete={(sanitizedCode) => {
            setShowSanitizationModal(false);
            onCodeSanitized(sanitizedCode);
            onDismiss(); // Dismiss banner after sanitization
          }}
          code={code}
          suggestions={suggestions}
        />
      )}
    </div>
  );
}

export default PHIWarningBanner;
