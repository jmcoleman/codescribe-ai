import { useState, useEffect } from 'react';
import { FileItem } from './FileItem';
import { FileDetailsPanel } from './FileDetailsPanel';
import { FileCode, PanelLeftClose, Plus, Github, Upload } from 'lucide-react';
import { Select } from '../Select';
import { Button } from '../Button';

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
 * @param {string} props.docType - Current documentation type
 * @param {Function} props.onDocTypeChange - Called when doc type changes
 * @param {Function} props.onGithubImport - Called when GitHub import is clicked
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
  docType,
  onDocTypeChange,
  onGithubImport,
  onSelectFile,
  onToggleFileSelection,
  onSelectAllFiles,
  onDeselectAllFiles,
  onRemoveFile,
  onAddFile,
  onGenerateFile,
  onGenerateSelected,
  onDeleteSelected,
  onToggleSidebar,
  hasCodeInEditor = false,
  onFilesDrop
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [detailsFileId, setDetailsFileId] = useState(null);

  const generatedCount = files.filter(f => f.documentation).length;
  const canGenerateAll = files.some(f => !f.documentation && !f.isGenerating);
  const canClearAll = files.length > 0;

  // Keyboard shortcut handler for Cmd/Ctrl+I (View Details)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl+I - Open details for active file
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        if (activeFileId) {
          setDetailsFileId(activeFileId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId]);

  // Drag and drop handlers for multi-file upload
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!onFilesDrop) return;

    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      onFilesDrop(Array.from(droppedFiles));
    }
  };

  // Count only files with content in selection
  const filesWithContent = files.filter(f => f.content && f.content.length > 0);
  const selectedFilesWithContent = filesWithContent.filter(f => selectedFileIds.includes(f.id));
  const selectedCountWithContent = selectedFilesWithContent.length;

  // Doc type options
  const docTypes = [
    { value: 'README', label: 'README.md' },
    { value: 'JSDOC', label: 'JSDoc Comments' },
    { value: 'API', label: 'API Documentation' },
    { value: 'ARCHITECTURE', label: 'Architecture Docs' },
  ];

  return (
    <div
      className="flex flex-col h-full @container relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-500/10 dark:bg-purple-400/20 backdrop-blur-sm border-2 border-dashed border-purple-500 dark:border-purple-400 rounded-xl flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 text-purple-600 dark:text-purple-400">
            <Upload className="w-12 h-12" aria-hidden="true" />
            <p className="text-lg font-semibold">Drop files to upload</p>
            <p className="text-sm text-purple-500 dark:text-purple-300">Release to add to your list</p>
          </div>
        </div>
      )}
      {/* Unified Header - Title, Selection, and Actions (desktop only, mobile has its own header) */}
      {!isMobile && (
        <div className="border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-white dark:bg-slate-900">
          {/* Top row: Toggle, Title, GitHub Import, Add button */}
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
              onClick={onGithubImport}
              className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
              aria-label="Import from GitHub"
              title="Import from GitHub"
            >
              <Github className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
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

          {/* Second row: Doc Type selector */}
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="sidebar-doc-type-select" className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
              Doc Type:
            </label>
            <div className="flex-1 min-w-0">
              <Select
                id="sidebar-doc-type-select"
                options={docTypes}
                value={docType}
                onChange={onDocTypeChange}
                ariaLabel="Select documentation type"
                size="small"
              />
            </div>
          </div>

          {/* Selection controls and info - only show when files exist */}
          {files.length > 0 && (
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
          )}

          {/* Action buttons - ALWAYS visible (for code panel + selected files) */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onGenerateSelected}
              disabled={selectedCountWithContent === 0 && !hasCodeInEditor}
              className="flex-1 min-w-0 px-1.5 @[240px]:px-2 @[280px]:px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150 truncate"
              title={selectedCountWithContent > 0 ? `Generate documentation for ${selectedCountWithContent} selected file${selectedCountWithContent !== 1 ? 's' : ''}` : 'Generate documentation for code in editor'}
            >
              <span className="hidden @[280px]:inline">Generate</span>
              <span className="@[280px]:hidden">Gen</span>
              {selectedCountWithContent > 0 && (
                <span className="hidden @[320px]:inline"> ({selectedCountWithContent})</span>
              )}
            </button>
            {files.length > 0 && (
              <button
                type="button"
                onClick={onDeleteSelected}
                disabled={selectedCount === 0}
                className="flex-1 min-w-0 px-1.5 @[240px]:px-2 @[280px]:px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed truncate"
                title={`Delete ${selectedCount} selected file${selectedCount !== 1 ? 's' : ''}`}
              >
                <span className="hidden @[280px]:inline">Delete</span>
                <span className="@[280px]:hidden">Del</span>
                {selectedCount > 0 && (
                  <span className="hidden @[320px]:inline"> ({selectedCount})</span>
                )}
              </button>
            )}
          </div>
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

          {/* Action buttons - mobile always shows full text */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onGenerateSelected}
              disabled={selectedCountWithContent === 0 && !hasCodeInEditor}
              className="flex-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150"
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
              onViewDetails={() => setDetailsFileId(file.id)}
            />
          ))
        )}
      </div>

      {/* File Details Panel */}
      {detailsFileId && (
        <FileDetailsPanel
          file={files.find(f => f.id === detailsFileId)}
          isOpen={true}
          onClose={() => setDetailsFileId(null)}
        />
      )}
    </div>
  );
}
