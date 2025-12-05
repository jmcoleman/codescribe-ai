import { X, CheckCircle, AlertTriangle, XCircle, Download, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CopyButtonWithText } from './CopyButton';
import { formatDateLong, formatTime } from '../utils/formatters';

export function QualityScoreModal({ qualityScore, onClose, filename = 'code.js' }) {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [allowClickOutside, setAllowClickOutside] = useState(false);
  const [activeTab, setActiveTab] = useState('output'); // 'input' or 'output' - default to generated doc as primary focus

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

  const { score, grade, breakdown, docType, inputCodeHealth, improvement } = qualityScore;

  // Generate formatted text for copying
  const generateQualityReportText = () => {
    const now = new Date();
    const dateStr = formatDateLong(now);
    const timeStr = formatTime(now);

    let report = `# Documentation Quality Report\n\n`;

    // File and generation info
    report += `**Source File:** \`${filename}\`  \n`;
    report += `**Document Type:** ${docType}  \n`;
    report += `**Generated:** ${dateStr} at ${timeStr}\n\n`;
    report += `---\n\n`;

    // Add before/after comparison if available
    if (inputCodeHealth) {
      report += `## Summary\n\n`;
      report += `### Input Code Health\n`;
      report += `- **Score:** ${inputCodeHealth.score}/100\n`;
      report += `- **Grade:** ${inputCodeHealth.grade}\n\n`;

      report += `### Generated Documentation\n`;
      report += `- **Score:** ${score}/100\n`;
      report += `- **Grade:** ${grade}\n\n`;

      if (improvement > 0) {
        report += `### Improvement\n`;
        report += `**+${improvement} points!** 🎉\n\n`;
      }
      report += `---\n\n`;

      // Input Code Health Breakdown
      report += `## Input Code Health Breakdown\n\n`;
      Object.entries(inputCodeHealth.breakdown).forEach(([key, criteria]) => {
        const name = formatInputCodeCriteriaName(key);
        const points = criteria.points ?? criteria.score ?? 0;
        const maxPoints = criteria.maxPoints ?? criteria.max ?? 20;
        report += `### ${name}\n`;
        report += `**Score:** ${points}/${maxPoints}\n\n`;
        if (criteria.issues && criteria.issues.length > 0) {
          report += `**Issues:**\n`;
          criteria.issues.forEach(issue => {
            report += `- ${issue}\n`;
          });
          report += `\n`;
        }
        if (criteria.features && criteria.features.length > 0) {
          report += `**Found:**\n`;
          criteria.features.forEach(feature => {
            report += `- ${feature}\n`;
          });
          report += `\n`;
        }
      });

      report += `---\n\n`;

      // Generated Documentation Breakdown
      report += `## Generated Documentation Breakdown\n\n`;
    } else {
      report += `## Overall Score\n\n`;
      report += `- **Score:** ${score}/100\n`;
      report += `- **Grade:** ${grade}\n\n`;
      report += `---\n\n`;
      report += `## Criteria Breakdown\n\n`;
    }

    Object.entries(breakdown).forEach(([key, criteria]) => {
      const name = formatCriteriaName(key, docType);
      const points = criteria.points ?? criteria.score ?? 0;
      const maxPoints = criteria.maxPoints ?? criteria.max ?? 20;
      report += `### ${name}\n`;
      report += `**Score:** ${points}/${maxPoints}\n\n`;
      if (criteria.suggestion) {
        report += `${criteria.suggestion}\n\n`;
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

  const handleDownload = () => {
    const reportText = generateQualityReportText();
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    // Extract filename without extension
    const baseFilename = filename.replace(/\.[^/.]+$/, '');

    // Format timestamp as YYYYMMDDHHMMSS
    const now = new Date();
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const downloadFilename = `quality-report-${baseFilename}-${docType.toLowerCase()}-${timestamp}.md`;

    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl xl:max-w-3xl 2xl:max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quality-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 id="quality-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">Quality Breakdown</h2>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            aria-label="Close quality breakdown modal"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" aria-hidden="true" />
          </button>
        </div>

        {/* Overall Score - With Before/After Comparison if available */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
          {inputCodeHealth ? (
            /* Before & After Comparison - Horizontal Layout */
            <div className="grid grid-cols-3 items-center max-w-3xl mx-auto">
              {/* Before: Input Code Health */}
              <div className="text-center">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Input Code</div>
                <div className="text-4xl font-bold text-slate-700 dark:text-slate-200 mb-1">{inputCodeHealth.score}</div>
                <div className="text-base font-semibold text-slate-600 dark:text-slate-300">{inputCodeHealth.grade}</div>
              </div>

              {/* AI Transformation Arrow */}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  <div className="text-slate-600 dark:text-slate-400 text-4xl leading-none">→</div>
                </div>
                {/* Improvement Delta - Right under arrow */}
                {improvement !== null && improvement > 0 && (
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">+{improvement}</div>
                )}
              </div>

              {/* After: Generated Documentation */}
              <div className="text-center">
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">Generated Docs</div>
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{score}</div>
                <div className="text-base font-semibold text-purple-600 dark:text-purple-400">{grade}</div>
              </div>
            </div>
          ) : (
            /* Standard Single Score Display */
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{score}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className={`font-semibold ${getGradeColor(grade)}`}>Grade {grade}</span>
                <span className="mx-1.5">•</span>
                <span>{docType}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation (only show if we have input code health) */}
        {inputCodeHealth && (
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
            <nav className="flex -mb-px px-6" aria-label="Quality breakdown tabs">
              <button
                type="button"
                onClick={() => setActiveTab('input')}
                className={`px-4 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'input'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                aria-current={activeTab === 'input' ? 'page' : undefined}
              >
                Input Code Health
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('output')}
                className={`px-4 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'output'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                aria-current={activeTab === 'output' ? 'page' : undefined}
              >
                Generated Documentation
              </button>
            </nav>
          </div>
        )}

        {/* Criteria Breakdown - Changes based on active tab */}
        <div className="px-6 py-5 h-[420px] overflow-y-auto bg-slate-50 dark:bg-slate-900 flex-shrink-0" tabIndex={-1}>
          {activeTab === 'output' ? (
            /* Output Documentation Breakdown */
            <div className="space-y-3">
              {Object.entries(breakdown).map(([key, criteria]) => (
                <CriteriaItem key={key} name={formatCriteriaName(key, docType)} criteria={criteria} />
              ))}
            </div>
          ) : inputCodeHealth ? (
            /* Input Code Health Breakdown */
            <div className="space-y-3">
              {Object.entries(inputCodeHealth.breakdown).map(([key, criteria]) => (
                <CriteriaItem key={key} name={formatInputCodeCriteriaName(key)} criteria={criteria} />
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer - Close, Copy & Download Buttons */}
        <div className="px-6 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            >
              Cancel
            </button>
            <CopyButtonWithText
              text={generateQualityReportText()}
              label="Copy Report"
              className="shadow-sm"
            />
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download</span>
            </button>
          </div>
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

  // Format suggestion/issues for display
  let displaySuggestion = criteria.suggestion;
  if (!displaySuggestion && criteria.issues && criteria.issues.length > 0) {
    displaySuggestion = criteria.issues.join(', ');
  }
  if (!displaySuggestion && criteria.features && criteria.features.length > 0) {
    displaySuggestion = 'Found: ' + criteria.features.join(', ');
  }

  // Use subtle, muted colors that provide context without being distracting
  const statusText = status === 'complete'
    ? 'Complete'
    : status === 'partial'
    ? 'Partial'
    : 'Incomplete';

  const icon = status === 'complete'
    ? <CheckCircle className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" aria-hidden="true" />
    : status === 'partial'
    ? <AlertTriangle className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" aria-hidden="true" />
    : <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />;

  const percentage = (points / maxPoints) * 100;

  return (
    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
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
        className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5"
        role="progressbar"
        aria-valuenow={points}
        aria-valuemin={0}
        aria-valuemax={maxPoints}
        aria-label={`${name} score: ${points} out of ${maxPoints} points`}
      >
        <div
          className="h-full transition-all duration-300 ease-out bg-purple-500 dark:bg-purple-400"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Suggestion/Issues */}
      {displaySuggestion && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{displaySuggestion}</p>
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

function formatInputCodeCriteriaName(key) {
  const nameMap = {
    comments: 'Comments',
    naming: 'Naming Quality',
    existingDocs: 'Existing Documentation',
    codeStructure: 'Code Structure & Formatting',
  };
  return nameMap[key] || key;
}

function getGradeColor(grade) {
  switch (grade) {
    case 'A': return 'text-purple-600 dark:text-purple-300';
    case 'B': return 'text-indigo-600 dark:text-indigo-300';
    case 'C': return 'text-slate-600 dark:text-slate-300';
    case 'D':
    case 'F': return 'text-slate-500 dark:text-slate-400';
    default: return 'text-slate-600 dark:text-slate-300';
  }
}