import { Sparkles, CheckCircle, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyButton } from './CopyButton';
import { DocPanelGeneratingSkeleton } from './SkeletonLoader';

const STORAGE_KEY = 'codescribe-report-expanded';

export function DocPanel({
  documentation,
  qualityScore = null,
  isGenerating = false,
  onViewBreakdown
}) {
  // Load initial state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isExpanded.toString());
    } catch {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }, [isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-200">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-slate-800">
            Generated Documentation
          </span>
        </div>

        {/* Right: Quality Score + Copy Button */}
        <div className="flex items-center gap-2">
          {/* Quality Score */}
          {qualityScore && (
            <button
              onClick={onViewBreakdown}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:scale-[1.02] hover:shadow-sm transition-all duration-200 motion-reduce:transition-none active:scale-[0.98]"
              aria-label="View quality score breakdown"
            >
              <span className="text-xs text-slate-600">Quality:</span>
              <span className="text-xs font-semibold text-purple-700">
                {qualityScore.score}/100
              </span>
              <span className={`text-sm font-bold ${getGradeColor(qualityScore.grade)}`}>
                {qualityScore.grade}
              </span>
            </button>
          )}

          {/* Copy Button - Only show when documentation exists */}
          {documentation && (
            <CopyButton
              text={documentation}
              size="md"
              variant="outline"
              ariaLabel="Copy documentation to clipboard"
            />
          )}
        </div>
      </div>

      {/* Body - Documentation Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isGenerating && !documentation ? (
          <DocPanelGeneratingSkeleton />
        ) : documentation ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vs}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {documentation}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Ready to Generate Documentation
            </h3>
            <p className="text-sm text-slate-600 mb-6 max-w-md">
              Your AI-generated documentation will appear here with real-time streaming and quality scoring.
            </p>

            {/* Quick Start Steps */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md text-left">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 text-center">
                Quick Start
              </h4>
              <ol className="space-y-2 text-xs text-slate-700">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span>Paste your code or click <strong>"Upload Files"</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span>Select documentation type (README, JSDoc, API, or ARCHITECTURE)</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span>Click <strong>"Generate Docs"</strong> and watch the magic happen!</span>
                </li>
              </ol>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Not sure where to start? Try the <strong>Examples</strong> button above or click the <strong>?</strong> icon for help.
            </p>
          </div>
        )}
      </div>

      {/* Footer - Quick Stats & Expandable Report */}
      {qualityScore && (
        <div className="bg-slate-50 border-t border-slate-200">
          {/* Quick Stats */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="text-slate-600">
                  {qualityScore.summary.strengths.length} criteria met
                </span>
              </div>
              {qualityScore.summary.improvements.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-3 h-3 text-warning" />
                  <span className="text-slate-600">
                    {qualityScore.summary.improvements.length} areas to improve
                  </span>
                </div>
              )}
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              aria-expanded={isExpanded}
              aria-controls="quality-report-details"
              aria-label={isExpanded ? "Hide full quality report" : "Show full quality report"}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1 active:bg-purple-100"
            >
              <span className="font-medium">View full report</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Expandable Section with Smooth Animation */}
          <div
            id="quality-report-details"
            role="region"
            aria-label="Quality report details"
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-3 pt-2 border-t border-slate-200">
              {/* Document Type */}
              <div className="mb-2 pb-2 border-b border-slate-200">
                <span className="text-xs text-slate-600">
                  Document Type: <span className="font-medium text-slate-700">{qualityScore.docType}</span>
                </span>
              </div>

              <div className="space-y-2">
                {/* Strengths */}
                {qualityScore.summary.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      <span className="text-xs font-semibold text-slate-800">Strengths</span>
                    </div>
                    <ul className="space-y-1 ml-5">
                      {qualityScore.summary.strengths.map((key) => {
                        const criteria = qualityScore.breakdown[key];
                        return (
                          <li key={key} className="text-xs text-slate-600">
                            <span className="font-medium text-slate-700">
                              {formatCriteriaName(key, qualityScore.docType)}:
                            </span>{' '}
                            {criteria?.suggestion || 'Well done!'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {qualityScore.summary.improvements.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-warning" />
                      <span className="text-xs font-semibold text-slate-800">Areas to Improve</span>
                    </div>
                    <ul className="space-y-1 ml-5">
                      {qualityScore.summary.improvements.map((key) => {
                        const criteria = qualityScore.breakdown[key];
                        return (
                          <li key={key} className="text-xs text-slate-600">
                            <span className="font-medium text-slate-700">
                              {formatCriteriaName(key, qualityScore.docType)}:
                            </span>{' '}
                            {criteria?.suggestion || 'Consider improving this section'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getGradeColor(grade) {
  switch (grade) {
    case 'A': return 'text-success';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-warning';
    case 'D':
    case 'F': return 'text-error';
    default: return 'text-slate-600';
  }
}

function formatCriteriaName(key, docType = 'README') {
  // Context-aware names based on document type
  const nameMap = {
    'README': {
      overview: 'Overview',
      installation: 'Installation',
      examples: 'Usage Examples',
      apiDocs: 'Function Coverage',
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