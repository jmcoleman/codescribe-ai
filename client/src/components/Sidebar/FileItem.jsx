import { FileText, CheckCircle, Loader2, AlertCircle, Star } from 'lucide-react';
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
 * @param {Function} props.onViewDetails - Called when view details action is clicked
 */
export function FileItem({ file, isActive, isSelected, onSelect, onToggleSelection, onRemove, onGenerate, onViewDetails }) {
  const {
    filename,
    language,
    fileSize,
    content,
    documentation,
    isGenerating,
    error,
    docType
  } = file;

  // Determine file state
  const hasDocumentation = Boolean(documentation);
  const hasError = Boolean(error);
  const hasContent = Boolean(content && content.length > 0);

  // Status icon
  const StatusIcon = () => {
    if (isGenerating) {
      return <Loader2 className="w-4 h-4 text-slate-400 dark:text-slate-500 animate-spin" />;
    }
    if (hasError) {
      return <AlertCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
    }
    if (hasDocumentation) {
      return <CheckCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
    }
    return <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
  };

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
      onClick={hasContent ? onSelect : undefined}
      className={`
        group
        relative
        p-3
        border-b border-slate-200 dark:border-slate-700
        ${hasContent ? 'cursor-pointer' : 'cursor-default opacity-60'}
        transition-all duration-150
        ${isActive
          ? 'bg-purple-50 dark:bg-purple-900/20'
          : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset
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
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 dark:bg-purple-500" />
      )}

      {/* File info */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
            aria-label={`Select ${filename}`}
          />
        </div>

        {/* File details */}
        <div className="flex-1 min-w-0">
          {/* Filename */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-slate-900 dark:text-slate-100 truncate">
              {filename}
            </span>
            {/* Status Icon */}
            <span className="flex-shrink-0" title={
              isGenerating ? 'Generating documentation...' :
              hasError ? `Error: ${error}` :
              hasDocumentation ? 'Documentation generated' :
              'Ready to generate'
            }>
              <StatusIcon />
            </span>
            {isActive && (
              <Star className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="currentColor" />
            )}
            {!hasContent && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded flex-shrink-0"
                title="Code content not available. Re-upload this file to edit or generate docs."
              >
                No Code
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {docType && (
              <>
                <span className="font-semibold text-purple-600 dark:text-purple-400 flex-shrink-0">
                  {docType}
                </span>
                <span className="flex-shrink-0">•</span>
              </>
            )}
            <span className="truncate">{language || 'Unknown'}</span>
            <span className="flex-shrink-0">•</span>
            <span className="flex-shrink-0">{formatSize(fileSize)}</span>
          </div>

          {/* Status text */}
          {isGenerating && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generating...
            </div>
          )}
          {hasError && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {error}
            </div>
          )}
        </div>

        {/* Actions menu */}
        <div className="flex-shrink-0">
          <FileActions
            file={file}
            onRemove={onRemove}
            onGenerate={onGenerate}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>
    </div>
  );
}
