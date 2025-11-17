import { FileText, CheckCircle, Loader2, AlertCircle, Edit, Star } from 'lucide-react';
import { FileActions } from './FileActions';

/**
 * FileItem Component
 *
 * Individual file card in the sidebar with status, metadata, and actions.
 *
 * File States:
 * - Uploaded: File uploaded, not generated (📄)
 * - Generating: AI is generating docs (⏳ animated spinner)
 * - Generated: Documentation complete (✓)
 * - Error: Generation failed (❌)
 * - Modified: Code changed after generation (📝)
 * - Active: Currently viewing this file (⭐ purple highlight)
 *
 * @param {Object} props
 * @param {Object} props.file - File object
 * @param {boolean} props.isActive - Is this the active file?
 * @param {Function} props.onSelect - Called when file is clicked
 * @param {Function} props.onRemove - Called when remove action is clicked
 */
export function FileItem({ file, isActive, onSelect, onRemove }) {
  const {
    filename,
    language,
    fileSize,
    documentation,
    qualityScore,
    isGenerating,
    error,
    documentId
  } = file;

  // Determine file state
  const hasDocumentation = Boolean(documentation);
  const hasError = Boolean(error);
  const isSavedToDb = Boolean(documentId);

  // Status icon
  const StatusIcon = () => {
    if (isGenerating) {
      return <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />;
    }
    if (hasError) {
      return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
    if (hasDocumentation) {
      return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    }
    return <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
  };

  // Quality grade badge
  const qualityGrade = qualityScore?.grade || null;
  const qualityColor = {
    'A': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'B': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'C': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    'D': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    'F': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }[qualityGrade];

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1) return `${bytes} B`;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      onClick={onSelect}
      className={`
        group
        relative
        p-3 rounded-lg
        border
        cursor-pointer
        transition-all duration-150
        ${isActive
          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 shadow-sm'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-sm'
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
      `}
      role="button"
      tabIndex={0}
      aria-label={`${filename} - ${isGenerating ? 'Generating' : hasDocumentation ? 'Generated' : 'Not generated'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 dark:bg-purple-500 rounded-l-lg" />
      )}

      {/* File info */}
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          <StatusIcon />
        </div>

        {/* File details */}
        <div className="flex-1 min-w-0">
          {/* Filename */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {filename}
            </span>
            {isActive && (
              <Star className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="currentColor" />
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{formatSize(fileSize)}</span>
            <span>•</span>
            <span className="truncate">{language || 'Unknown'}</span>
            {qualityGrade && (
              <>
                <span>•</span>
                <span className={`px-1.5 py-0.5 rounded font-medium ${qualityColor}`}>
                  {qualityGrade} {qualityScore.score}
                </span>
              </>
            )}
          </div>

          {/* Status text */}
          {isGenerating && (
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Generating...
            </div>
          )}
          {hasError && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
              {error}
            </div>
          )}
          {isSavedToDb && !isGenerating && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Saved to database
            </div>
          )}
        </div>

        {/* Actions menu */}
        <div className="flex-shrink-0">
          <FileActions
            file={file}
            onRemove={onRemove}
          />
        </div>
      </div>
    </div>
  );
}
