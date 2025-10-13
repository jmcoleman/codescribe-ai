import { Sparkles, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function DocPanel({
  documentation,
  qualityScore = null,
  isGenerating = false,
  onViewBreakdown
}) {
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

        {/* Right: Quality Score */}
        {qualityScore && (
          <button
            onClick={onViewBreakdown}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
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
      </div>

      {/* Body - Documentation Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isGenerating && !documentation ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-12 h-12 text-purple-500 animate-pulse mb-4" />
            <p className="text-sm text-slate-600">Generating documentation...</p>
          </div>
        ) : documentation ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
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
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">
              Your generated documentation will appear here
            </p>
          </div>
        )}
      </div>

      {/* Footer - Quick Stats */}
      {qualityScore && (
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-t border-slate-200">
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
      )}
    </div>
  );
}

// Helper function for grade colors
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