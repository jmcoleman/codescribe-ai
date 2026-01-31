/**
 * PHI Warning Banner Component
 * Displays a simplified warning when potential Protected Health Information is detected in code.
 * Works in conjunction with PHIEditorEnhancer drawer for full sanitization workflow.
 * WCAG AA compliant with proper color contrast and accessibility features.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Banner } from './Banner';

/**
 * PHI Warning Banner Component
 * @param {Object} props
 * @param {Object} props.phiDetection - PHI detection results
 * @param {boolean} props.phiDetection.containsPHI - Whether PHI was detected
 * @param {string} props.phiDetection.confidence - Confidence level (high/medium/low)
 * @param {Object} props.phiDetection.findings - Detailed findings
 * @param {number} props.phiDetection.score - PHI confidence score (0-100)
 * @param {Array} props.phiDetection.suggestions - Sanitization suggestions
 * @param {string} props.code - (Unused) Original code for sanitization
 * @param {Function} props.onCodeSanitized - (Unused) Callback when code is sanitized with new code
 * @param {Function} props.onDismiss - Callback when banner is dismissed
 * @param {Function} props.onProceed - Callback when user confirms and proceeds
 * @returns {JSX.Element|null}
 */
export function PHIWarningBanner({ phiDetection, code, onCodeSanitized, onDismiss, onProceed }) {
  const { effectiveTheme } = useTheme();

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
    <Banner
      type="warning"
      icon={AlertTriangle}
      iconColor={colors.icon}
      borderColor={colors.border}
      onDismiss={onDismiss}
      ariaLive="assertive"
    >
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

      {/* Brief instructions */}
      <div className={`text-sm ${colors.textBody} mt-3`}>
        <p className={`font-semibold ${colors.text} mb-1.5`}>
          <span className="text-xs uppercase tracking-wide mr-2">HIPAA Compliance</span>
          <span className="font-normal">PHI must be removed before documentation generation.</span>
        </p>
        <p>
          Detected PHI is highlighted in the editor with wavy underlines. Use the review panel below to sanitize your code, or confirm this is not actual PHI.
        </p>
      </div>
    </Banner>
  );
}

export default PHIWarningBanner;
