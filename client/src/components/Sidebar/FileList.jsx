import { FileItem } from './FileItem';

/**
 * FileList Component
 *
 * Scrollable list of files with bulk action buttons.
 * Displays file cards with status, metadata, and actions.
 *
 * @param {Object} props
 * @param {Array} props.files - Array of file objects
 * @param {string} props.activeFileId - Currently active file ID
 * @param {Function} props.onSelectFile - Called when user clicks a file
 * @param {Function} props.onRemoveFile - Called when user removes a file
 * @param {Function} props.onGenerateAll - Called when Generate All is clicked
 * @param {Function} props.onClearAll - Called when Clear All is clicked
 */
export function FileList({
  files = [],
  activeFileId,
  onSelectFile,
  onRemoveFile,
  onGenerateAll,
  onClearAll
}) {
  const generatedCount = files.filter(f => f.documentation).length;
  const canGenerateAll = files.some(f => !f.documentation && !f.isGenerating);
  const canClearAll = files.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable File List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {files.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-sm">No files uploaded yet</p>
            <p className="text-xs mt-2">Upload files to get started</p>
          </div>
        ) : (
          files.map(file => (
            <FileItem
              key={file.id}
              file={file}
              isActive={file.id === activeFileId}
              onSelect={() => onSelectFile(file.id)}
              onRemove={() => onRemoveFile(file.id)}
            />
          ))
        )}
      </div>

      {/* Bulk Actions Footer */}
      {files.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3">
            <span>
              {generatedCount} / {files.length} generated
            </span>
            <span>
              {files.filter(f => f.isGenerating).length > 0 && 'Generating...'}
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onGenerateAll}
              disabled={!canGenerateAll}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 text-white rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150 disabled:cursor-not-allowed"
            >
              Generate All
            </button>
            <button
              type="button"
              onClick={onClearAll}
              disabled={!canClearAll}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canClearAll}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
