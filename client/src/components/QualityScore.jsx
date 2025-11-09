import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CopyButtonWithText } from './CopyButton';

export function QualityScoreModal({ qualityScore, onClose }) {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [allowClickOutside, setAllowClickOutside] = useState(false);

  // Delay enabling click-outside to prevent immediate close on modal open
  useEffect(() => {
    const timer = setTimeout(() => {
      setAllowClickOutside(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Store previous focus on mount
  useEffect(() => {
    if (qualityScore) {
      previousFocusRef.current = document.activeElement;
    }
  }, [qualityScore]);

  // Restore focus when modal closes
  useEffect(() => {
    return () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (!qualityScore) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [qualityScore, onClose]);

  if (!qualityScore) return null;

  const { score, grade, breakdown, docType } = qualityScore;

  // Generate formatted text for copying
  const generateQualityReportText = () => {
    let report = `Documentation Quality Report\n`;
    report += `${'='.repeat(35)}\n\n`;
    report += `Overall Score: ${score}/100\n`;
    report += `Grade: ${grade}\n`;
    report += `Document Type: ${docType}\n\n`;
    report += `Criteria Breakdown:\n`;
    report += `${'-'.repeat(35)}\n`;

    Object.entries(breakdown).forEach(([key, criteria]) => {
      const name = formatCriteriaName(key, docType);
      const points = criteria.points ?? criteria.score ?? 0;
      const maxPoints = criteria.maxPoints ?? criteria.max ?? 20;
      report += `\n${name}: ${points}/${maxPoints}\n`;
      if (criteria.suggestion) {
        report += `  ${criteria.suggestion}\n`;
      }
    });

    return report;
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself (not the modal content)
    if (allowClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quality-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 id="quality-modal-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quality Breakdown</h2>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            aria-label="Close quality breakdown modal"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" aria-hidden="true" />
          </button>
        </div>

        {/* Overall Score */}
        <div className="px-4 py-2.5 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-0.5">{score}/100</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className={`font-bold ${getGradeColor(grade)}`}>Grade: {grade}</span>
              <span className="mx-1">•</span>
              <span>{docType}</span>
            </div>
          </div>
        </div>

        {/* Criteria Breakdown */}
        <div className="px-3 py-3 flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-900" tabIndex={-1}>
          <div className="space-y-2">
            {Object.entries(breakdown).map(([key, criteria]) => (
              <CriteriaItem key={key} name={formatCriteriaName(key, docType)} criteria={criteria} />
            ))}
          </div>
        </div>

        {/* Footer - Copy Report Button */}
        <div className="px-4 py-2.5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <CopyButtonWithText
            text={generateQualityReportText()}
            label="Copy Report"
            className="shadow-sm w-full justify-center"
          />
        </div>
      </div>
    </div>
  );
}

function CriteriaItem({ name, criteria }) {
  // Handle both formats: {points, maxPoints} OR {score, max} for backward compatibility
  const points = criteria.points ?? criteria.score ?? 0;
  const maxPoints = criteria.maxPoints ?? criteria.max ?? 20;
  const status = criteria.status || (points === maxPoints ? 'complete' : points > 0 ? 'partial' : 'missing');

  // Use subtle, muted colors that provide context without being distracting
  const statusText = status === 'complete'
    ? 'Complete'
    : status === 'partial'
    ? 'Partial'
    : 'Incomplete';

  const icon = status === 'complete'
    ? <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" aria-hidden="true" />
    : status === 'partial'
    ? <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" aria-hidden="true" />
    : <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />;

  const percentage = (points / maxPoints) * 100;

  return (
    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Screen reader status text */}
      <span className="sr-only">
        {name}: {statusText}. Score: {points} out of {maxPoints} points.
      </span>

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200" aria-hidden="true">{name}</span>
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300" aria-hidden="true">
          {points}/{maxPoints}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5"
        role="progressbar"
        aria-valuenow={points}
        aria-valuemin={0}
        aria-valuemax={maxPoints}
        aria-label={`${name} score: {points} out of ${maxPoints} points`}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${
            status === 'complete' ? 'bg-purple-500 dark:bg-purple-400' :
            status === 'partial' ? 'bg-indigo-400 dark:bg-indigo-300' :
            'bg-slate-300 dark:bg-slate-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Suggestion */}
      {criteria.suggestion && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{criteria.suggestion}</p>
      )}
    </div>
  );
}

// Helper functions
function formatCriteriaName(key, docType = 'README') {
  // Context-aware names based on document type
  const nameMap = {
    'README': {
      overview: 'Overview',
      installation: 'Installation',
      examples: 'Usage Examples',
      apiDocs: 'Code Documentation',
      structure: 'Structure & Formatting',
    },
    'JSDOC': {
      overview: 'Overview',
      installation: 'Installation',
      examples: 'Usage Examples',
      apiDocs: 'JSDoc Comments',
      structure: 'Structure & Formatting',
    },
    'API': {
      overview: 'Overview',
      installation: 'Installation',
      examples: 'Usage Examples',
      apiDocs: 'API Endpoints',
      structure: 'Structure & Formatting',
    },
  };

  const names = nameMap[docType] || nameMap['README'];
  return names[key] || key;
}

function getGradeColor(grade) {
  switch (grade) {
    case 'A': return 'text-purple-600 dark:text-purple-400';
    case 'B': return 'text-indigo-600 dark:text-indigo-400';
    case 'C': return 'text-slate-600 dark:text-slate-400';
    case 'D':
    case 'F': return 'text-slate-500 dark:text-slate-500';
    default: return 'text-slate-600 dark:text-slate-400';
  }
}