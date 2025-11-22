import { useState, useEffect } from 'react';
import { FileItem } from './FileItem';
import { FileDetailsPanel } from './FileDetailsPanel';
import { FileCode, PanelLeftClose, Plus, Github, Upload, Info, X, Stamp, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Select } from '../Select';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { ConfirmModal } from '../ConfirmModal';
import { fetchDocTypes } from '../../services/api';

/**
 * SparklesPlus - Sparkles icon with + overlay to indicate multiple/batch action
 */
function SparklesPlus({ className }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="absolute -top-0.5 -right-0.5 text-[10px] font-bold leading-none">+</span>
    </div>
  );
}

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
  onApplyDocType,
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
  onFilesDrop,
  bulkGenerationProgress = null // { total, completed, currentBatch, totalBatches }
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [detailsFileId, setDetailsFileId] = useState(null);
  const [showNoCodeBanner, setShowNoCodeBanner] = useState(true);
  const [applyConfirmModal, setApplyConfirmModal] = useState({
    isOpen: false,
    message: '',
    warning: ''
  });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    count: 0
  });

  const generatedCount = files.filter(f => f.documentation).length;
  const canGenerateAll = files.some(f => !f.documentation && !f.isGenerating);
  const canClearAll = files.length > 0;

  // Check if there are files with no code content
  const filesWithoutCode = files.filter(f => !f.content || f.content.length === 0);
  const hasFilesWithoutCode = filesWithoutCode.length > 0;

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl+I - Open details for active file
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        if (activeFileId) {
          setDetailsFileId(activeFileId);
        }
        return;
      }

      // Cmd/Ctrl+G - Generate docs for selected files (or active file if none selected)
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        const filesWithContent = files.filter(f => f.content && f.content.length > 0);
        const selectedFilesWithContent = filesWithContent.filter(f => selectedFileIds.includes(f.id));

        if (selectedFilesWithContent.length > 0 || hasCodeInEditor) {
          onGenerateSelected();
        }
        return;
      }

      // Delete or Backspace - Delete selected files
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCount > 0) {
        // Only trigger if not typing in an input/textarea
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        e.preventDefault();
        onDeleteSelected();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, selectedFileIds, selectedCount, files, hasCodeInEditor, onGenerateSelected, onDeleteSelected]);

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

  // Doc type options - fetch from backend
  const [docTypes, setDocTypes] = useState([
    { value: 'API', label: 'API Documentation' },
    { value: 'ARCHITECTURE', label: 'Architecture Docs' },
    { value: 'JSDOC', label: 'JSDoc Comments' },
    { value: 'README', label: 'README.md' },
  ]);

  // Fetch doc types from backend on mount
  useEffect(() => {
    fetchDocTypes().then(types => {
      if (types && types.length > 0) {
        setDocTypes(types);
      }
    });
  }, []);

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
          {/* Top row: Toggle and Title */}
          <div className="flex items-center gap-2 mb-2">
            <Tooltip content="Collapse sidebar">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </Tooltip>
            <h2 className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Files ({files.length})
            </h2>
          </div>

          {/* Doc Type selector */}
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

          {/* Action buttons - file management (left) and selection actions (right) */}
          <div className="flex gap-2 justify-between">
            {/* Left group: File management */}
            <div className="flex gap-1">
              <Tooltip content="Import from GitHub">
                <button
                  type="button"
                  onClick={onGithubImport}
                  className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
                  aria-label="Import from GitHub"
                >
                  <Github className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </Tooltip>
              <Tooltip content="Add files">
                <button
                  type="button"
                  onClick={onAddFile}
                  className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
                  aria-label="Add files"
                >
                  <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </Tooltip>
            </div>

            {/* Right group: Selection actions */}
            <div className="flex gap-1">
              <Tooltip content={selectedCount > 0 ? 'Apply to selection' : 'Select files to apply doc type'}>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCount === 0) return;

                    // Check if any files have documentation with different docType (will be cleared)
                    const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));
                    const filesWithDifferentDocType = selectedFiles.filter(f =>
                      f.documentation && f.docType !== docType
                    );

                    if (filesWithDifferentDocType.length > 0) {
                      // Show confirmation modal when documentation will be cleared
                      const message = `Apply ${docType} to ${selectedCount} selected file${selectedCount !== 1 ? 's' : ''}?`;
                      const warning = `${filesWithDifferentDocType.length} file${filesWithDifferentDocType.length !== 1 ? 's have' : ' has'} existing documentation that will be cleared. You'll need to regenerate.`;

                      setApplyConfirmModal({
                        isOpen: true,
                        message,
                        warning
                      });
                    } else {
                      // No documentation will be cleared, apply directly
                      if (onApplyDocType) {
                        onApplyDocType(selectedFileIds, docType);
                      }
                    }
                  }}
                  disabled={selectedCount === 0}
                  className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={selectedCount > 0 ? `Apply ${docType} doc type to ${selectedCount} selected file${selectedCount !== 1 ? 's' : ''}` : 'Select files to apply doc type'}
                >
                  <Stamp className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                </button>
              </Tooltip>

              <Tooltip content={selectedCount > 0 ? 'Delete selection (⌫)' : 'Select files to delete'}>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCount === 0) return;
                    setDeleteConfirmModal({
                      isOpen: true,
                      count: selectedCount
                    });
                  }}
                  disabled={selectedCount === 0}
                  className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={selectedCount > 0 ? `Delete ${selectedCount} selected file${selectedCount !== 1 ? 's' : ''}` : 'Select files to delete'}
                >
                  <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                </button>
              </Tooltip>

              <Tooltip content={bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed}/${bulkGenerationProgress.total}` : "Generate for selection (⌘G)"}>
                <button
                  type="button"
                  onClick={onGenerateSelected}
                  disabled={selectedCountWithContent === 0 && !hasCodeInEditor || bulkGenerationProgress}
                  className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed} of ${bulkGenerationProgress.total}` : "Generate for selection"}
                >
                  {bulkGenerationProgress ? (
                    <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {/* Selection controls - just above file list */}
      {!isMobile && files.length > 0 && (
        <div className="flex items-center justify-between text-xs px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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

      {/* Mobile: Action controls (replaces desktop header) */}
      {isMobile && (
        <div className="border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-white dark:bg-slate-900">
          {/* Top row: GitHub Import and Add Files - Always visible */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={onGithubImport}
              className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600"
            >
              <Github className="w-4 h-4" />
              Import from GitHub
            </button>
            <button
              type="button"
              onClick={onAddFile}
              className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600"
            >
              <Plus className="w-4 h-4" />
              Add Files
            </button>
          </div>

          {/* File management controls - Only show when files exist */}
          {files.length > 0 && (
            <>
              {/* Doc Type selector */}
              <div className="flex items-center gap-2 mb-2">
            <label htmlFor="mobile-doc-type-select" className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Doc Type:
            </label>
            <div className="flex-1">
              <Select
                id="mobile-doc-type-select"
                options={docTypes}
                value={docType}
                onChange={onDocTypeChange}
                ariaLabel="Select documentation type"
                size="small"
              />
            </div>
          </div>

          {/* Action buttons - Apply, Delete, Generate */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (selectedCount === 0) return;

                // Check if any files have documentation with different docType (will be cleared)
                const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));
                const filesWithDifferentDocType = selectedFiles.filter(f =>
                  f.documentation && f.docType !== docType
                );

                if (filesWithDifferentDocType.length > 0) {
                  // Show confirmation modal when documentation will be cleared
                  const message = `Apply ${docType} to ${selectedCount} selected file${selectedCount !== 1 ? 's' : ''}?`;
                  const warning = `${filesWithDifferentDocType.length} file${filesWithDifferentDocType.length !== 1 ? 's have' : ' has'} existing documentation that will be cleared. You'll need to regenerate.`;

                  setApplyConfirmModal({
                    isOpen: true,
                    message,
                    warning
                  });
                } else {
                  // No documentation will be cleared, apply directly
                  if (onApplyDocType) {
                    onApplyDocType(selectedFileIds, docType);
                  }
                }
              }}
              disabled={selectedCount === 0}
              className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              aria-label={selectedCount > 0 ? 'Apply to selection' : 'Select files to apply doc type'}
            >
              <Stamp className="w-3.5 h-3.5" />
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedCount === 0) return;
                setDeleteConfirmModal({
                  isOpen: true,
                  count: selectedCount
                });
              }}
              disabled={selectedCount === 0}
              className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              aria-label={selectedCount > 0 ? 'Delete selection' : 'Select files to delete'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              type="button"
              onClick={onGenerateSelected}
              disabled={selectedCountWithContent === 0 && !hasCodeInEditor || bulkGenerationProgress}
              className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              aria-label={bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed} of ${bulkGenerationProgress.total}` : "Generate for selection"}
            >
              {bulkGenerationProgress ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {bulkGenerationProgress.completed}/{bulkGenerationProgress.total}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate
                </>
              )}
            </button>
          </div>
            </>
          )}
        </div>
      )}

      {/* Mobile: Selection controls - Right above file list (consistent with desktop) */}
      {isMobile && files.length > 0 && (
        <div className="flex items-center justify-between text-xs px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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

      {/* No Code Content Banner - Privacy Notice */}
      {hasFilesWithoutCode && showNoCodeBanner && (
        <div className="mx-3 my-2 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Code not saved for privacy. Re-upload files after closing browser. <button
                  onClick={() => {
                    // Select all files first
                    onSelectAllFiles();
                    // Then show confirmation modal
                    setDeleteConfirmModal({
                      isOpen: true,
                      count: files.length
                    });
                  }}
                  className="font-medium hover:underline"
                >
                  Delete workspace
                </button>
              </p>
            </div>
            <button
              onClick={() => setShowNoCodeBanner(false)}
              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex-shrink-0"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
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

      {/* Apply Doc Type Confirmation Modal */}
      <ConfirmModal
        isOpen={applyConfirmModal.isOpen}
        onClose={() => setApplyConfirmModal({ isOpen: false, message: '', warning: '' })}
        onConfirm={() => {
          if (onApplyDocType) {
            onApplyDocType(selectedFileIds, docType);
          }
        }}
        title="Apply Doc Type"
        message={applyConfirmModal.message}
        warning={applyConfirmModal.warning}
        confirmText="Apply"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, count: 0 })}
        onConfirm={() => {
          if (onDeleteSelected) {
            onDeleteSelected();
          }
        }}
        title="Delete Files"
        message={`Delete ${deleteConfirmModal.count} selected file${deleteConfirmModal.count !== 1 ? 's' : ''} from workspace?`}
        warning="Files will be removed from your workspace. Generated documentation is preserved in your history."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
