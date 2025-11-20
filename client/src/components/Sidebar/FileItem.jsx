import { useState, useRef, useEffect } from 'react';
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
 * @param {Function} props.onViewDetails - Called when view details action is clicked
 */
export function FileItem({ file, isActive, isSelected, onSelect, onToggleSelection, onRemove, onGenerate, onViewDetails }) {
  const {
    filename,
    language,
    fileSize,
    content,
    documentation,
    qualityScore,
    isGenerating,
    error,
    documentId,
    docType
  } = file;

  const [showTooltip, setShowTooltip] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const metadataRef = useRef(null);

  // Determine file state
  const hasDocumentation = Boolean(documentation);
  const hasError = Boolean(error);
  const isSavedToDb = Boolean(documentId);
  const hasContent = Boolean(content && content.length > 0);

  // Quality grade badge (defined early for use in useEffect)
  const qualityGrade = qualityScore?.grade || null;

  // Check if metadata content is truncated
  useEffect(() => {
    const checkTruncation = () => {
      if (metadataRef.current) {
        const element = metadataRef.current;
        // Check if parent or any child element is truncated
        let truncated = element.scrollWidth > element.clientWidth;

        // Also check if any child with 'truncate' class is truncated
        if (!truncated) {
          const truncateElements = element.querySelectorAll('.truncate');
          truncated = Array.from(truncateElements).some(el => el.scrollWidth > el.clientWidth);
        }

        setIsTruncated(truncated);
      }
    };

    // Use RAF to avoid flashing during render
    const rafId = requestAnimationFrame(checkTruncation);
    window.addEventListener('resize', checkTruncation);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [docType, language, fileSize, qualityGrade]);

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
          <div className="relative">
            <div
              ref={metadataRef}
              className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0 overflow-hidden"
              onMouseEnter={(e) => {
                if (isTruncated && metadataRef.current) {
                  const rect = metadataRef.current.getBoundingClientRect();
                  setTooltipPosition({ top: rect.bottom + 4, left: rect.left });
                  setShowTooltip(true);
                }
              }}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {docType && (
                <>
                  <span className="font-semibold text-purple-600 dark:text-purple-400 flex-shrink-0">
                    {docType}
                  </span>
                  <span className="flex-shrink-0">•</span>
                </>
              )}
              {qualityGrade && (
                <>
                  <span className={`px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${qualityColor}`}>
                    {qualityGrade} {qualityScore.score}
                  </span>
                  <span className="flex-shrink-0">•</span>
                </>
              )}
              <span className="truncate">{language || 'Unknown'}</span>
              <span className="flex-shrink-0">•</span>
              <span className="flex-shrink-0">{formatSize(fileSize)}</span>
            </div>

            {/* Custom tooltip - using fixed positioning to escape sidebar boundaries */}
            {showTooltip && (
              <div
                className="fixed px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded shadow-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap z-[9999]"
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`
                }}
              >
                {docType || 'No doc type'} • {qualityGrade ? `${qualityGrade} ${qualityScore.score}` : 'Not generated'} • {language || 'Unknown'} • {formatSize(fileSize)}
              </div>
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
            onGenerate={onGenerate}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>
    </div>
  );
}
