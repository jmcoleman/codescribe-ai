import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function QualityScoreModal({ qualityScore, onClose }) {
  if (!qualityScore) return null;

  const { score, grade, breakdown, summary } = qualityScore;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Quality Breakdown</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Overall Score */}
        <div className="p-6 bg-gradient-to-br from-purple-50 to-white border-b border-slate-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-1">{score}/100</div>
            <div className={`text-2xl font-bold mb-2 ${getGradeColor(grade)}`}>
              Grade: {grade}
            </div>
            <p className="text-sm text-slate-600">{summary.topSuggestion}</p>
          </div>
        </div>

        {/* Criteria Breakdown */}
        <div className="p-4 overflow-y-auto max-h-96">
          <div className="space-y-3">
            {Object.entries(breakdown).map(([key, criteria]) => (
              <CriteriaItem key={key} name={formatCriteriaName(key)} criteria={criteria} />
            ))}
          </div>
        </div>

        {/* Suggestions */}
        {summary.improvements.length > 0 && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-800 mb-1">
                  Areas to Improve:
                </p>
                <ul className="text-xs text-slate-600 space-y-1">
                  {summary.improvements.map((area) => (
                    <li key={area}>• {formatCriteriaName(area)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CriteriaItem({ name, criteria }) {
  const icon = criteria.status === 'complete'
    ? <CheckCircle className="w-4 h-4 text-success" />
    : criteria.status === 'partial'
    ? <AlertCircle className="w-4 h-4 text-warning" />
    : <AlertCircle className="w-4 h-4 text-error" />;

  const maxPoints = criteria.points || 20;
  const percentage = (criteria.points / maxPoints) * 100;

  return (
    <div className="p-3 bg-slate-50 rounded-lg">
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
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-300 ${
            criteria.status === 'complete' ? 'bg-success' :
            criteria.status === 'partial' ? 'bg-warning' :
            'bg-error'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Suggestion */}
      {criteria.suggestion && (
        <p className="text-xs text-slate-600 mt-1">{criteria.suggestion}</p>
      )}
    </div>
  );
}

// Helper functions
function formatCriteriaName(key) {
  const names = {
    overview: 'Overview',
    installation: 'Installation',
    examples: 'Usage Examples',
    apiDocs: 'API Documentation',
    structure: 'Structure & Formatting',
  };
  return names[key] || key;
}

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