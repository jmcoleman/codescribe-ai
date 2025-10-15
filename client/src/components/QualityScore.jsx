import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { CopyButtonWithText } from './CopyButton';

export function QualityScoreModal({ qualityScore, onClose }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus management: auto-focus close button when modal opens
  useEffect(() => {
    if (qualityScore && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [qualityScore]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!qualityScore) return;

    const handleKeyDown = (e) => {
      // Close on Escape key
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          // Shift+Tab on first element: go to last
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          // Tab on last element: go to first
          e.preventDefault();
          firstElement?.focus();
        }
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
      const maxPoints = criteria.maxPoints || 20;
      report += `\n${name}: ${criteria.points}/${maxPoints}\n`;
      if (criteria.suggestion) {
        report += `  ${criteria.suggestion}\n`;
      }
    });

    return report;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quality-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 id="quality-modal-title" className="text-lg font-semibold text-slate-900">Quality Breakdown</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-purple-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            aria-label="Close quality breakdown modal"
          >
            <X className="w-5 h-5 text-slate-600 hover:text-purple-600 transition-colors" />
          </button>
        </div>

        {/* Overall Score */}
        <div className="px-6 py-4 bg-gradient-to-br from-purple-50 to-white border-b border-slate-200 flex-shrink-0">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{score}/100</div>
            <div className={`text-lg font-bold ${getGradeColor(grade)}`}>
              Grade: {grade}
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Document Type: <span className="font-medium text-slate-700">{docType}</span>
            </div>
          </div>
        </div>

        {/* Criteria Breakdown */}
        <div className="px-4 py-4 flex-1 min-h-0 overflow-y-auto bg-slate-50">
          <div className="space-y-2.5">
            {Object.entries(breakdown).map(([key, criteria]) => (
              <CriteriaItem key={key} name={formatCriteriaName(key, docType)} criteria={criteria} />
            ))}
          </div>
        </div>

        {/* Footer - Copy Report Button */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Share this quality report</p>
            <CopyButtonWithText
              text={generateQualityReportText()}
              label="Copy Report"
              className="shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CriteriaItem({ name, criteria }) {
  // Use subtle, muted colors that provide context without being distracting
  const icon = criteria.status === 'complete'
    ? <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
    : criteria.status === 'partial'
    ? <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
    : <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />;

  const maxPoints = criteria.maxPoints || 20;
  const percentage = (criteria.points / maxPoints) * 100;

  return (
    <div className="p-3 bg-white rounded-lg border border-slate-200 hover:border-purple-200 hover:bg-purple-50/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-slate-800">{name}</span>
        </div>
        <span className="text-sm font-semibold text-slate-700">
          {criteria.points}/{maxPoints}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2"
        role="progressbar"
        aria-valuenow={criteria.points}
        aria-valuemin={0}
        aria-valuemax={maxPoints}
        aria-label={`${name} score: ${criteria.points} out of ${maxPoints} points`}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${
            criteria.status === 'complete' ? 'bg-purple-500' :
            criteria.status === 'partial' ? 'bg-indigo-400' :
            'bg-slate-300'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Suggestion */}
      {criteria.suggestion && (
        <p className="text-sm text-slate-600 leading-relaxed">{criteria.suggestion}</p>
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
    case 'A': return 'text-purple-600';
    case 'B': return 'text-indigo-600';
    case 'C': return 'text-slate-600';
    case 'D':
    case 'F': return 'text-slate-500';
    default: return 'text-slate-600';
  }
}