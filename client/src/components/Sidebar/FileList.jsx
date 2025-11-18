import { FileItem } from './FileItem';
import { FileCode, PanelLeftClose, Plus } from 'lucide-react';

/**
 * FileList Component
 *
 * Scrollable list of files with bulk action buttons.
 * Displays file cards with status, metadata, and actions.
 *
 * @param {Object} props
 * @param {Array} props.files - Array of file objects
 * @param {string} props.activeFileId - Currently active file ID
 * @param {Array} props.selectedFileIds - Array of selected file IDs
 * @param {number} props.selectedCount - Number of selected files
 * @param {boolean} props.isMobile - Mobile mode (hides toggle button)
 * @param {Function} props.onSelectFile - Called when user clicks a file
 * @param {Function} props.onToggleFileSelection - Called when checkbox is toggled
 * @param {Function} props.onSelectAllFiles - Called when Select All is clicked
 * @param {Function} props.onDeselectAllFiles - Called when Deselect All is clicked
 * @param {Function} props.onRemoveFile - Called when user removes a file
 * @param {Function} props.onAddFile - Called when Add File button is clicked
 * @param {Function} props.onGenerateFile - Called when Generate is clicked for a single file
 * @param {Function} props.onGenerateSelected - Called when Generate is clicked (for selected files)
 * @param {Function} props.onDeleteSelected - Called when Delete is clicked (for selected files)
 * @param {Function} props.onToggleSidebar - Called when collapse button is clicked
 */
export function FileList({
  files = [],
  activeFileId,
  selectedFileIds = [],
  selectedCount = 0,
  isMobile = false,
  onSelectFile,
  onToggleFileSelection,
  onSelectAllFiles,
  onDeselectAllFiles,
  onRemoveFile,
  onAddFile,
  onGenerateFile,
  onGenerateSelected,
  onDeleteSelected,
  onToggleSidebar
}) {
  const generatedCount = files.filter(f => f.documentation).length;
  const canGenerateAll = files.some(f => !f.documentation && !f.isGenerating);
  const canClearAll = files.length > 0;

  // Count only files with content in selection
  const filesWithContent = files.filter(f => f.content && f.content.length > 0);
  const selectedFilesWithContent = filesWithContent.filter(f => selectedFileIds.includes(f.id));
  const selectedCountWithContent = selectedFilesWithContent.length;

  return (
    <div className="flex flex-col h-full">
      {/* Unified Header - Title, Selection, and Actions (desktop only, mobile has its own header) */}
      {!isMobile && (
        <div className="border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-white dark:bg-slate-900">
          {/* Top row: Toggle, Title, Add button */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h2 className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Files ({files.length})
            </h2>
            <button
              type="button"
              onClick={onAddFile}
              className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
              aria-label="Upload more files"
              title="Upload more files"
            >
              <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

        {/* Selection controls and info - only show when files exist */}
        {files.length > 0 && (
          <>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-600 dark:text-slate-400">
                {selectedCount > 0 ? (
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {selectedCount} selected
                  </span>
                ) : (
                  <span>{generatedCount} / {files.length} generated</span>
                )}
              </span>
              <button
                type="button"
                onClick={selectedCount > 0 ? onDeselectAllFiles : onSelectAllFiles}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                {selectedCount > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Action buttons - horizontal layout */}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onGenerateSelected}
                disabled={selectedCountWithContent === 0}
                className="flex-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 text-white rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150 disabled:cursor-not-allowed"
              >
                Generate{selectedCountWithContent > 0 ? ` (${selectedCountWithContent})` : ''}
              </button>
              <button
                type="button"
                onClick={onDeleteSelected}
                disabled={selectedCount === 0}
                className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </button>
            </div>
          </>
        )}
        </div>
      )}

      {/* Mobile: Action controls (replaces desktop header) */}
      {isMobile && files.length > 0 && (
        <div className="border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-600 dark:text-slate-400">
              {selectedCount > 0 ? (
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {selectedCount} selected
                </span>
              ) : (
                <span>{generatedCount} / {files.length} generated</span>
              )}
            </span>
            <button
              type="button"
              onClick={selectedCount > 0 ? onDeselectAllFiles : onSelectAllFiles}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              {selectedCount > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onGenerateSelected}
              disabled={selectedCountWithContent === 0}
              className="flex-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 text-white rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150 disabled:cursor-not-allowed"
            >
              Generate{selectedCountWithContent > 0 ? ` (${selectedCountWithContent})` : ''}
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </button>
          </div>

          {/* Add File button for mobile */}
          <button
            type="button"
            onClick={onAddFile}
            className="w-full mt-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Files
          </button>
        </div>
      )}

      {/* Scrollable File List */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <FileCode className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              No files yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
              Click the + button above to add files for batch documentation
            </p>
          </div>
        ) : (
          files.map(file => (
            <FileItem
              key={file.id}
              file={file}
              isActive={file.id === activeFileId}
              isSelected={selectedFileIds.includes(file.id)}
              onSelect={() => onSelectFile(file.id)}
              onToggleSelection={() => onToggleFileSelection(file.id)}
              onRemove={() => onRemoveFile(file.id)}
              onGenerate={() => onGenerateFile(file.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
