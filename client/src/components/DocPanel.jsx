import { Sparkles, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';
import { DocPanelGeneratingSkeleton } from './SkeletonLoader';
import { MermaidDiagram } from './MermaidDiagram';
import { STORAGE_KEYS } from '../constants/storage';

export function DocPanel({
  documentation,
  qualityScore = null,
  isGenerating = false,
  onViewBreakdown
}) {
  // Load initial state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REPORT_EXPANDED);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Track mermaid diagram counter to ensure unique IDs
  const mermaidCounterRef = useRef(0);

  // Reset counter when documentation changes (new generation)
  useEffect(() => {
    mermaidCounterRef.current = 0;
  }, [documentation]);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORT_EXPANDED, isExpanded.toString());
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
    <div data-testid="doc-panel" className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Live Region for Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isGenerating && !documentation ? 'Generating documentation...' :
         isGenerating && documentation ? 'Updating documentation...' :
         documentation ? `Documentation generated. Quality score: ${qualityScore?.score} out of 100, grade ${qualityScore?.grade}` :
         'Ready to generate documentation'}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-purple-50 border-b border-purple-200">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" aria-hidden="true" />
          <h2 className="text-sm text-slate-800">
            Generated Documentation
          </h2>
        </div>

        {/* Right: Quality Score + Copy Button */}
        <div className="flex items-center gap-2">
          {/* Quality Score */}
          {qualityScore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onViewBreakdown();
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:scale-[1.02] hover:shadow-sm transition-all duration-200 motion-reduce:transition-none active:scale-[0.98]"
              aria-label="View quality score breakdown"
              title="View breakdown"
            >
              <span className="text-xs text-slate-600">Quality:</span>
              <span className="text-xs font-semibold text-purple-700">
                {qualityScore.score}/100
              </span>
              <span className={`text-sm font-bold ${getGradeColor(qualityScore.grade)}`}>
                {qualityScore.grade} {getGradeLabel(qualityScore.grade)}
              </span>
            </button>
          )}

          {/* Download Button - Only show when documentation exists */}
          {documentation && (
            <DownloadButton
              content={documentation}
              docType={qualityScore?.docType || 'documentation'}
              size="md"
              variant="outline"
              ariaLabel="Download doc"
            />
          )}

          {/* Copy Button - Only show when documentation exists */}
          {documentation && (
            <CopyButton
              text={documentation}
              size="md"
              variant="outline"
              ariaLabel="Copy doc"
            />
          )}
        </div>
      </div>

      {/* Body - Documentation Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isGenerating && !documentation ? (
          <DocPanelGeneratingSkeleton />
        ) : documentation ? (
          <div className="max-w-none text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-0 [&_h1:not(:first-child)]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2:not(:first-child)]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3:not(:first-child)]:mt-4 [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:ml-4 [&_strong]:font-semibold [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ node, children, ...props }) {
                  // Check if this is a code block
                  const codeChild = children?.[0];
                  const isCodeBlock = codeChild?.type === 'code';

                  if (isCodeBlock) {
                    const codeClassName = codeChild?.props?.className || '';
                    // If it's a mermaid code block, skip the pre wrapper
                    if (codeClassName.includes('language-mermaid')) {
                      return <div className="not-prose">{children}</div>;
                    }
                  }

                  // For other code blocks, keep the pre wrapper
                  return <pre {...props}>{children}</pre>;
                },
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeContent = String(children).replace(/\n$/, '');

                  // Handle mermaid diagrams
                  if (!inline && language === 'mermaid') {
                    // Detect incomplete/partial diagrams (common during streaming)
                    const looksIncomplete = !codeContent.includes('-->') &&
                                           !codeContent.includes('->') &&
                                           !codeContent.includes('---') &&
                                           codeContent.split('\n').length < 3;

                    // Show placeholder if still generating OR diagram looks incomplete
                    if (isGenerating || looksIncomplete) {
                      return (
                        <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[300px] flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                            <p className="text-sm text-slate-600">
                              {isGenerating
                                ? 'Diagram will render when generation completes...'
                                : 'Completing diagram...'}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Generate stable, unique ID for this diagram
                    const diagramId = `diagram-${++mermaidCounterRef.current}`;

                    // Render complete diagram only when ready
                    return (
                      <MermaidDiagram
                        chart={codeContent}
                        id={diagramId}
                      />
                    );
                  }

                  // Handle other code blocks
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vs}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        fontSize: '13px !important',
                        lineHeight: '1.5',
                        margin: 0,
                        padding: '1rem',
                      }}
                      codeTagProps={{
                        style: {
                          fontSize: '13px',
                          fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                        }
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[13px] font-mono" {...props}>
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
          <div className="flex flex-col items-center justify-center h-full text-center px-6" role="status">
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Ready to Generate Documentation
            </h3>
            <p className="text-sm text-slate-600 mb-8 max-w-md">
              Your AI-generated documentation will appear here with real-time streaming and quality scoring.
            </p>

            {/* Quick Start Steps */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 max-w-md text-left">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 text-center">
                Quick Start
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-700">
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

            <p className="text-xs text-slate-500 mt-6">
              Not sure where to start? Try the <strong>Examples</strong> button above or click the <strong>?</strong> icon for help.
            </p>
          </div>
        )}
      </div>

      {/* Footer - Quick Stats & Expandable Report */}
      {qualityScore && (
        <div>
            {/* Quick Stats */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle className="w-3 h-3 text-success" aria-hidden="true" />
                  <span className="text-slate-600">
                    {qualityScore.summary.strengths.length} criteria met
                  </span>
                </div>
                {qualityScore.summary.improvements.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertCircle className="w-3 h-3 text-warning" aria-hidden="true" />
                    <span className="text-slate-600">
                      {qualityScore.summary.improvements.length} areas to improve
                    </span>
                  </div>
                )}
              </div>

            {/* Expand/Collapse Button */}
            <button
              type="button"
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              aria-expanded={isExpanded}
              aria-controls="quality-report-details"
              aria-label={isExpanded ? "Hide details" : "Show details"}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-colors duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 rounded px-2 active:bg-purple-100"
            >
              <span className="font-medium">{isExpanded ? "Hide details" : "Show details"}</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
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
                      <CheckCircle className="w-3.5 h-3.5 text-success" aria-hidden="true" />
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
                      <AlertCircle className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
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

function getGradeLabel(grade) {
  switch (grade) {
    case 'A': return '(Excellent)';
    case 'B': return '(Good)';
    case 'C': return '(Fair)';
    case 'D': return '(Poor)';
    case 'F': return '(Failing)';
    default: return '';
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