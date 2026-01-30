/**
 * PHI Sanitization Modal
 * Interactive line-by-line review and sanitization of detected PHI
 * Allows users to review each detected item with code context and accept/skip replacements
 */

import React, { useState, useEffect } from 'react';
import { X, Check, SkipForward, AlertTriangle, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Find all occurrences of PHI in code with line numbers and context
 * @param {string} code - Source code
 * @param {Array} suggestions - PHI detection suggestions
 * @returns {Array} Array of detected items with context
 */
function findPHIInCode(code, suggestions) {
  const lines = code.split('\n');
  const detectedItems = [];

  suggestions.forEach((suggestion) => {
    if (!suggestion.examples || suggestion.examples.length === 0) return;

    suggestion.examples.forEach((example) => {
      // Find all occurrences of this example in the code
      lines.forEach((line, lineIndex) => {
        const occurrences = [];
        let index = line.indexOf(example);

        while (index !== -1) {
          occurrences.push({
            lineNumber: lineIndex + 1,
            columnStart: index,
            columnEnd: index + example.length,
            value: example,
            line: line,
            suggestion: suggestion,
          });
          index = line.indexOf(example, index + 1);
        }

        occurrences.forEach((occurrence) => {
          // Get context lines (2 before, 2 after)
          const contextStart = Math.max(0, lineIndex - 2);
          const contextEnd = Math.min(lines.length, lineIndex + 3);
          const contextLines = lines.slice(contextStart, contextEnd);
          const highlightLineIndex = lineIndex - contextStart;

          detectedItems.push({
            id: `${occurrence.lineNumber}-${occurrence.columnStart}`,
            lineNumber: occurrence.lineNumber,
            columnStart: occurrence.columnStart,
            columnEnd: occurrence.columnEnd,
            value: occurrence.value,
            line: occurrence.line,
            contextLines: contextLines,
            contextStartLine: contextStart + 1,
            highlightLineIndex: highlightLineIndex,
            type: suggestion.title,
            message: suggestion.message,
            suggestedReplacement: getSuggestedReplacement(suggestion.title, occurrence.value),
          });
        });
      });
    });
  });

  return detectedItems;
}

/**
 * Get suggested replacement text based on PHI type
 * @param {string} type - PHI type (e.g., "Email Address", "Name")
 * @param {string} value - Original value
 * @returns {string} Suggested replacement
 */
function getSuggestedReplacement(type, value) {
  if (type.toLowerCase().includes('email')) {
    return 'user@example.com';
  }
  if (type.toLowerCase().includes('phone')) {
    return '555-0100';
  }
  if (type.toLowerCase().includes('ssn') || type.toLowerCase().includes('social security')) {
    return 'XXX-XX-XXXX';
  }
  if (type.toLowerCase().includes('date')) {
    return 'YYYY-MM-DD';
  }
  if (type.toLowerCase().includes('name')) {
    return 'John Doe';
  }
  if (type.toLowerCase().includes('address')) {
    return '123 Main St';
  }
  if (type.toLowerCase().includes('id') || type.toLowerCase().includes('identifier')) {
    return 'ID-XXXXX';
  }
  // Default: redact with placeholder
  return '[REDACTED]';
}

/**
 * PHI Sanitization Modal Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onComplete - Complete callback with sanitized code
 * @param {string} props.code - Original code
 * @param {Array} props.suggestions - PHI detection suggestions
 */
export function PHISanitizationModal({ isOpen, onClose, onComplete, code, suggestions }) {
  const { effectiveTheme } = useTheme();
  const [detectedItems, setDetectedItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState({});
  const [customReplacements, setCustomReplacements] = useState({});

  // Initialize detected items when modal opens
  useEffect(() => {
    if (isOpen && code && suggestions) {
      const items = findPHIInCode(code, suggestions);
      setDetectedItems(items);
      setCurrentIndex(0);
      setDecisions({});
      setCustomReplacements({});
    }
  }, [isOpen, code, suggestions]);

  if (!isOpen || detectedItems.length === 0) {
    return null;
  }

  const currentItem = detectedItems[currentIndex];
  const progress = ((currentIndex + 1) / detectedItems.length) * 100;
  const hasDecision = decisions[currentItem.id] !== undefined;

  /**
   * Handle accept/skip decision
   */
  const handleDecision = (accept) => {
    setDecisions({
      ...decisions,
      [currentItem.id]: accept,
    });

    // Auto-advance to next item
    if (currentIndex < detectedItems.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
    }
  };

  /**
   * Handle custom replacement text change
   */
  const handleCustomReplacement = (value) => {
    setCustomReplacements({
      ...customReplacements,
      [currentItem.id]: value,
    });
  };

  /**
   * Navigate to previous/next item
   */
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < detectedItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  /**
   * Apply all accepted replacements and return sanitized code
   */
  const handleComplete = () => {
    let sanitizedCode = code;
    const replacements = [];

    // Collect all accepted replacements
    detectedItems.forEach((item) => {
      if (decisions[item.id] === true) {
        const replacement = customReplacements[item.id] || item.suggestedReplacement;
        replacements.push({
          value: item.value,
          replacement: replacement,
          lineNumber: item.lineNumber,
        });
      }
    });

    // Sort by line number descending to avoid offset issues
    replacements.sort((a, b) => b.lineNumber - a.lineNumber);

    // Apply replacements (replace all occurrences)
    replacements.forEach((rep) => {
      sanitizedCode = sanitizedCode.replaceAll(rep.value, rep.replacement);
    });

    onComplete(sanitizedCode);
  };

  const acceptedCount = Object.values(decisions).filter(d => d === true).length;
  const skippedCount = Object.values(decisions).filter(d => d === false).length;
  const pendingCount = detectedItems.length - acceptedCount - skippedCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sanitization-modal-title"
    >
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden ${
          effectiveTheme === 'dark' ? 'bg-slate-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          effectiveTheme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                effectiveTheme === 'dark' ? 'bg-amber-900/20' : 'bg-amber-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  effectiveTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <h2
                  id="sanitization-modal-title"
                  className={`text-lg font-semibold ${
                    effectiveTheme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Review & Sanitize PHI
                </h2>
                <p className={`text-sm ${
                  effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Item {currentIndex + 1} of {detectedItems.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                effectiveTheme === 'dark'
                  ? 'hover:bg-slate-700 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className={`h-2 rounded-full overflow-hidden ${
            effectiveTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
          }`}>
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-3 text-xs font-medium">
            <span className={effectiveTheme === 'dark' ? 'text-green-400' : 'text-green-600'}>
              ✓ {acceptedCount} Accepted
            </span>
            <span className={effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              ⊘ {skippedCount} Skipped
            </span>
            <span className={effectiveTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'}>
              ⋯ {pendingCount} Pending
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Detection Info */}
          <div className={`mb-4 p-4 rounded-lg border ${
            effectiveTheme === 'dark'
              ? 'bg-slate-800 border-slate-700'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start gap-3">
              <FileText className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                effectiveTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'
              }`} />
              <div>
                <p className={`font-semibold text-sm mb-1 ${
                  effectiveTheme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {currentItem.type}
                </p>
                <p className={`text-sm ${
                  effectiveTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {currentItem.message}
                </p>
                <p className={`text-xs mt-1 ${
                  effectiveTheme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  Line {currentItem.lineNumber}, Column {currentItem.columnStart + 1}
                </p>
              </div>
            </div>
          </div>

          {/* Code Context */}
          <div className={`mb-4 rounded-lg border overflow-hidden ${
            effectiveTheme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <div className={`px-3 py-2 text-xs font-semibold ${
              effectiveTheme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              Code Context
            </div>
            <div className={`font-mono text-sm ${
              effectiveTheme === 'dark' ? 'bg-slate-900' : 'bg-white'
            }`}>
              {currentItem.contextLines.map((line, index) => {
                const lineNumber = currentItem.contextStartLine + index;
                const isHighlight = index === currentItem.highlightLineIndex;

                return (
                  <div
                    key={index}
                    className={`flex ${
                      isHighlight
                        ? effectiveTheme === 'dark'
                          ? 'bg-amber-900/30 border-l-4 border-amber-500'
                          : 'bg-amber-50 border-l-4 border-amber-500'
                        : ''
                    }`}
                  >
                    <span className={`px-3 py-1 text-right select-none w-12 flex-shrink-0 ${
                      effectiveTheme === 'dark' ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      {lineNumber}
                    </span>
                    <pre className={`px-3 py-1 flex-1 overflow-x-auto ${
                      effectiveTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {isHighlight ? (
                        <>
                          {line.substring(0, currentItem.columnStart)}
                          <span className={`font-bold ${
                            effectiveTheme === 'dark' ? 'bg-amber-500/40 text-amber-200' : 'bg-amber-300 text-amber-900'
                          }`}>
                            {currentItem.value}
                          </span>
                          {line.substring(currentItem.columnEnd)}
                        </>
                      ) : (
                        line
                      )}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Replacement */}
          <div className={`p-4 rounded-lg border ${
            effectiveTheme === 'dark'
              ? 'bg-slate-800 border-slate-700'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <label className={`block text-sm font-semibold mb-2 ${
              effectiveTheme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Replacement Value
            </label>
            <input
              type="text"
              value={customReplacements[currentItem.id] || currentItem.suggestedReplacement}
              onChange={(e) => handleCustomReplacement(e.target.value)}
              placeholder={currentItem.suggestedReplacement}
              className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${
                effectiveTheme === 'dark'
                  ? 'bg-slate-900 border-slate-600 text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              } focus:outline-none focus:ring-2 focus:ring-amber-500`}
            />
            <p className={`text-xs mt-2 ${
              effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Original: <span className="font-mono font-semibold">{currentItem.value}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          effectiveTheme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between gap-4">
            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  effectiveTheme === 'dark'
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                ← Previous
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex === detectedItems.length - 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  effectiveTheme === 'dark'
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Next →
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  decisions[currentItem.id] === false
                    ? effectiveTheme === 'dark'
                      ? 'bg-slate-600 text-white ring-2 ring-slate-500'
                      : 'bg-slate-300 text-slate-900 ring-2 ring-slate-400'
                    : effectiveTheme === 'dark'
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
              <button
                onClick={() => handleDecision(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  decisions[currentItem.id] === true
                    ? effectiveTheme === 'dark'
                      ? 'bg-green-600 text-white ring-2 ring-green-500 shadow-lg shadow-green-500/30'
                      : 'bg-green-600 text-white ring-2 ring-green-500 shadow-lg shadow-green-500/30'
                    : effectiveTheme === 'dark'
                    ? 'bg-green-700 text-white hover:bg-green-600'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              {acceptedCount + skippedCount === detectedItems.length && (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  Apply Changes ({acceptedCount})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PHISanitizationModal;
