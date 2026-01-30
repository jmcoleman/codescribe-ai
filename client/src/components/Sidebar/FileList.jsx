import { useState, useEffect, useRef, useMemo } from 'react';
import { FileItem } from './FileItem';
import { FileDetailsPanel } from './FileDetailsPanel';
import { ProjectSelector } from './ProjectSelector';
import { FileCode, PanelLeftClose, Plus, Github, Upload, Info, X, Stamp, Trash2, Sparkles, Loader2, RefreshCw, FolderUp, Search, ChevronDown } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { Tooltip } from '../Tooltip';
import { ConfirmModal } from '../ConfirmModal';
import { fetchDocTypes } from '../../services/api';
import { fetchFile as fetchGitHubFile } from '../../services/githubService';

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
 * GitHubSync - GitHub icon with sync/refresh indicator overlay
 * Used for "reload from GitHub" actions
 */
function GitHubSync({ className, isLoading = false }) {
  return (
    <span className={`relative ${className}`}>
      <Github className="w-4 h-4" aria-hidden="true" />
      {isLoading ? (
        <Loader2 className="absolute -bottom-0.5 -right-1 w-2 h-2 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="absolute -bottom-0.5 -right-1 w-2 h-2" aria-hidden="true" />
      )}
    </span>
  );
}

/**
 * LocalSync - Upload icon with sync/refresh indicator overlay
 * Used for "re-upload local files" actions
 */
function LocalSync({ className, isLoading = false }) {
  return (
    <span className={`relative ${className}`}>
      <FolderUp className="w-4 h-4" aria-hidden="true" />
      {isLoading ? (
        <Loader2 className="absolute -bottom-0.5 -right-1 w-2 h-2 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="absolute -bottom-0.5 -right-1 w-2 h-2" aria-hidden="true" />
      )}
    </span>
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
 * @param {Function} props.onApplyDocType - Called when user applies a doc type to selected files
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
 * @param {Function} props.onUpdateFile - Called when file content is updated (e.g., after GitHub reload)
 * @param {number|null} props.selectedProjectId - Currently selected project ID (Pro+ only)
 * @param {Function} props.onProjectChange - Called when project selection changes (Pro+ only)
 * @param {boolean} props.canUseProjectManagement - Whether user can use project management (Pro+ only)
 * @param {boolean} props.hasPHI - Whether PHI has been detected and not yet confirmed/sanitized
 */
export function FileList({
  files = [],
  activeFileId,
  selectedFileIds = [],
  selectedCount = 0,
  isMobile = false,
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
  bulkGenerationProgress = null, // { total, completed, currentBatch, totalBatches }
  onUpdateFile,
  onViewBatchSummary,
  selectedProjectId = null,
  onProjectChange,
  canUseProjectManagement = false,
  hasPHI = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [detailsFileId, setDetailsFileId] = useState(null);
  const [showNoCodeBanner, setShowNoCodeBanner] = useState(true);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    count: 0
  });
  const [reloadingFileIds, setReloadingFileIds] = useState(new Set());
  const [bulkReloadProgress, setBulkReloadProgress] = useState(null); // { total, completed }
  const [searchFilter, setSearchFilter] = useState(''); // Search/filter for file list
  const [selectedExtensions, setSelectedExtensions] = useState([]); // Extension filter pills

  const generatedCount = files.filter(f => f.documentation).length;
  const canGenerateAll = files.some(f => !f.documentation && !f.isGenerating);
  const canClearAll = files.length > 0;

  // Check if there are files with no code content
  const filesWithoutCode = files.filter(f => !f.content || f.content.length === 0);
  const hasFilesWithoutCode = filesWithoutCode.length > 0;

  // Count GitHub-origin files that can be reloaded
  const githubFiles = files.filter(f => f.origin === 'github' && f.github?.repo && f.github?.path);
  const hasGitHubFiles = githubFiles.length > 0;

  // Count local-origin files that can be re-uploaded
  // Supports: upload, paste, sample (not github - use "Reload from GitHub" instead)
  const localFiles = files.filter(f => f.origin === 'upload' || f.origin === 'paste' || f.origin === 'sample');
  const hasLocalFiles = localFiles.length > 0;

  // Ref for hidden file input (for bulk re-upload)
  const reuploadInputRef = useRef(null);
  const [localReuploadProgress, setLocalReuploadProgress] = useState(null); // { total, matched, updated }

  // Ref and state for single file re-upload
  const singleReuploadInputRef = useRef(null);
  const [reuploadTargetFileId, setReuploadTargetFileId] = useState(null);

  // Files without code that can be reloaded from GitHub
  const reloadableFilesWithoutCode = filesWithoutCode.filter(f => f.origin === 'github' && f.github?.repo && f.github?.path);
  const hasReloadableFiles = reloadableFilesWithoutCode.length > 0;

  // Compute available file extensions for filter pills
  const availableExtensions = useMemo(() => {
    const extensions = new Set();
    files.forEach(file => {
      const ext = file.filename.split('.').pop()?.toLowerCase();
      if (ext && ext !== file.filename.toLowerCase()) {
        extensions.add(ext);
      }
    });
    return Array.from(extensions).sort();
  }, [files]);

  // Toggle extension filter
  const toggleExtension = (ext) => {
    setSelectedExtensions(prev => {
      if (prev.includes(ext)) {
        return prev.filter(e => e !== ext);
      } else {
        return [...prev, ext];
      }
    });
  };

  // Clear all extension filters
  const clearExtensionFilters = () => {
    setSelectedExtensions([]);
  };

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

  /**
   * Handle reloading a file from GitHub
   * Fetches the file content from GitHub and updates the file in state
   */
  const handleReloadFromGitHub = async (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.github) return;

    const { repo, path, branch } = file.github;
    // Parse owner/repo from the repo string (e.g., "owner/repo")
    const [owner, repoName] = repo.split('/');

    if (!owner || !repoName || !path) {
      console.error('[FileList] Invalid GitHub metadata for file:', file);
      return;
    }

    // Mark file as reloading
    setReloadingFileIds(prev => new Set([...prev, fileId]));

    try {
      // Fetch file content from GitHub
      const fetchedFile = await fetchGitHubFile(owner, repoName, path, branch || null);

      if (fetchedFile && fetchedFile.content && onUpdateFile) {
        // Update the file with the new content
        onUpdateFile(fileId, {
          content: fetchedFile.content,
          fileSize: fetchedFile.content.length
        });
      }
    } catch (error) {
      console.error('[FileList] Failed to reload file from GitHub:', error);
      // Could show a toast here if needed
    } finally {
      // Remove from reloading state
      setReloadingFileIds(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  /**
   * Handle reloading all GitHub files
   * Fetches the latest content from GitHub for all GitHub-origin files
   */
  const handleReloadAllFromGitHub = async () => {
    if (!hasGitHubFiles || bulkReloadProgress) return;

    const filesToReload = githubFiles;
    setBulkReloadProgress({ total: filesToReload.length, completed: 0 });

    for (let i = 0; i < filesToReload.length; i++) {
      const file = filesToReload[i];
      const { repo, path, branch } = file.github;
      const [owner, repoName] = repo.split('/');

      if (!owner || !repoName || !path) {
        console.error('[FileList] Invalid GitHub metadata for file:', file);
        setBulkReloadProgress(prev => ({ ...prev, completed: i + 1 }));
        continue;
      }

      try {
        const fetchedFile = await fetchGitHubFile(owner, repoName, path, branch || null);

        if (fetchedFile && fetchedFile.content && onUpdateFile) {
          onUpdateFile(file.id, {
            content: fetchedFile.content,
            fileSize: fetchedFile.content.length
          });
        }
      } catch (error) {
        console.error('[FileList] Failed to reload file from GitHub:', file.filename, error);
      }

      setBulkReloadProgress(prev => ({ ...prev, completed: i + 1 }));
    }

    // Clear progress after a short delay
    setTimeout(() => setBulkReloadProgress(null), 500);
  };

  /**
   * Handle re-uploading local files
   * Opens file picker and matches uploaded files by filename to update existing files
   */
  const handleReuploadLocalFiles = async (uploadedFiles) => {
    if (!uploadedFiles || uploadedFiles.length === 0 || !onUpdateFile) return;

    // Build a map of local files by filename for quick lookup
    const localFilesByName = new Map();
    localFiles.forEach(f => {
      // Use just the filename (last part of path)
      const filename = f.filename.split('/').pop();
      localFilesByName.set(filename, f);
    });

    let matchedCount = 0;
    let updatedCount = 0;

    setLocalReuploadProgress({ total: uploadedFiles.length, matched: 0, updated: 0 });

    for (const uploadedFile of uploadedFiles) {
      const filename = uploadedFile.name;
      const existingFile = localFilesByName.get(filename);

      if (existingFile) {
        matchedCount++;
        setLocalReuploadProgress(prev => ({ ...prev, matched: matchedCount }));

        try {
          // Read the file content
          const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(uploadedFile);
          });

          // Update the file with new content
          onUpdateFile(existingFile.id, {
            content: content,
            fileSize: content.length
          });

          updatedCount++;
          setLocalReuploadProgress(prev => ({ ...prev, updated: updatedCount }));
        } catch (error) {
          console.error('[FileList] Failed to read uploaded file:', filename, error);
        }
      }
    }

    // Clear progress after a short delay
    setTimeout(() => setLocalReuploadProgress(null), 1500);
  };

  /**
   * Handle file input change for bulk re-upload
   */
  const handleReuploadInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleReuploadLocalFiles(Array.from(files));
    }
    // Reset the input so the same files can be selected again
    e.target.value = '';
  };

  /**
   * Handle single file re-upload from the file menu
   * Opens file picker and updates the specific file with selected content
   */
  const handleSingleFileReupload = (fileId) => {
    setReuploadTargetFileId(fileId);
    singleReuploadInputRef.current?.click();
  };

  /**
   * Handle file input change for single file re-upload
   */
  const handleSingleReuploadInputChange = async (e) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0 || !reuploadTargetFileId || !onUpdateFile) {
      setReuploadTargetFileId(null);
      e.target.value = '';
      return;
    }

    const uploadedFile = uploadedFiles[0];

    try {
      // Read the file content
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target.result);
        reader.onerror = reject;
        reader.readAsText(uploadedFile);
      });

      // Update the file with new content
      onUpdateFile(reuploadTargetFileId, {
        content: content,
        fileSize: content.length
      });
    } catch (error) {
      console.error('[FileList] Failed to read uploaded file:', error);
    }

    // Clean up
    setReuploadTargetFileId(null);
    e.target.value = '';
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
        <div className="border-b border-slate-200 dark:border-slate-700 px-3 bg-white dark:bg-slate-900">
          {/* Top row: Toggle and Title */}
          <div className="flex items-center gap-2 mb-1.5">
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

          {/* Project selector (Pro+ only) - includes integrated graph info */}
          {canUseProjectManagement && onProjectChange && (
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                Project:
              </label>
              <div className="flex-1 min-w-0">
                <ProjectSelector
                  selectedProjectId={selectedProjectId}
                  onProjectChange={onProjectChange}
                  size="small"
                />
              </div>
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            {/* Left: Add files dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="@[180px]:inline hidden">Add</span>
                <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              </Menu.Button>

              <Menu.Items
                anchor="bottom start"
                className="w-52 rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 dark:ring-opacity-50 focus:outline-none z-[100] [--anchor-gap:4px]"
              >
                <div className="p-1">
                  {/* Add new files */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={onAddFile}
                        className={`${active ? 'bg-slate-100 dark:bg-slate-700' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                      >
                        <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        Add local files
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={onGithubImport}
                        className={`${active ? 'bg-slate-100 dark:bg-slate-700' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                      >
                        <Github className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        Import from GitHub
                      </button>
                    )}
                  </Menu.Item>

                  {/* Divider - only show if there are reloadable files */}
                  {(hasLocalFiles || hasGitHubFiles) && (
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                  )}

                  {/* Reload existing files */}
                  {hasLocalFiles && (
                    <Menu.Item disabled={localReuploadProgress}>
                      {({ active, disabled }) => (
                        <button
                          type="button"
                          onClick={() => reuploadInputRef.current?.click()}
                          disabled={disabled}
                          className={`${active && !disabled ? 'bg-slate-100 dark:bg-slate-700' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                        >
                          <LocalSync className="text-slate-500 dark:text-slate-400" isLoading={!!localReuploadProgress} />
                          {localReuploadProgress
                            ? `Updating ${localReuploadProgress.updated}/${localReuploadProgress.matched}...`
                            : `Re-upload local (${localFiles.length})`
                          }
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {hasGitHubFiles && (
                    <Menu.Item disabled={bulkReloadProgress}>
                      {({ active, disabled }) => (
                        <button
                          type="button"
                          onClick={handleReloadAllFromGitHub}
                          disabled={disabled}
                          className={`${active && !disabled ? 'bg-slate-100 dark:bg-slate-700' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                        >
                          <GitHubSync className="text-slate-500 dark:text-slate-400" isLoading={!!bulkReloadProgress} />
                          {bulkReloadProgress
                            ? `Reloading ${bulkReloadProgress.completed}/${bulkReloadProgress.total}...`
                            : `Reload from GitHub (${githubFiles.length})`
                          }
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </div>
              </Menu.Items>
            </Menu>

            {/* Right group: Selection actions (Apply, Delete, Generate) - visually grouped */}
            <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {/* Apply doc type menu */}
              <Menu as="div" className="relative">
                <Tooltip content={selectedCount > 0 ? 'Apply doc type to selection' : 'Select files to apply doc type'}>
                  <Menu.Button
                    disabled={selectedCount === 0}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400"
                  >
                    <Stamp className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="@[300px]:inline hidden">Apply</span>
                    <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 @[300px]:inline hidden" aria-hidden="true" />
                  </Menu.Button>
                </Tooltip>

                <Menu.Items
                  anchor="bottom start"
                  className="w-48 rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 dark:ring-opacity-50 focus:outline-none z-[100] [--anchor-gap:4px]"
                >
                  <div className="p-1">
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Apply to {selectedCount} file{selectedCount !== 1 ? 's' : ''}
                    </div>
                    {docTypes.map((type) => (
                      <Menu.Item key={type.value}>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => {
                              if (onApplyDocType) {
                                onApplyDocType(selectedFileIds, type.value);
                                onDeselectAllFiles?.();
                              }
                            }}
                            className={`${active ? 'bg-slate-100 dark:bg-slate-700' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                          >
                            {type.label}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Menu>

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
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400"
                  aria-label={selectedCount > 0 ? `Delete ${selectedCount} selected file${selectedCount !== 1 ? 's' : ''}` : 'Select files to delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="@[300px]:inline hidden">Delete</span>
                </button>
              </Tooltip>

              <Tooltip content={hasPHI ? "Review & sanitize PHI before generating" : bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed}/${bulkGenerationProgress.total}` : "Generate documentation (⌘G)"}>
                <button
                  type="button"
                  onClick={onGenerateSelected}
                  disabled={selectedCountWithContent === 0 && !hasCodeInEditor || bulkGenerationProgress || hasPHI}
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 bg-purple-600 dark:bg-purple-400 text-white dark:text-slate-950 shadow-md shadow-purple-600/20 dark:shadow-purple-400/30 hover:enabled:scale-[1.02] active:enabled:scale-[0.98] disabled:cursor-not-allowed disabled:shadow-none disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400"
                  aria-label={hasPHI ? "Review and sanitize PHI before generating" : bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed} of ${bulkGenerationProgress.total}` : "Generate documentation (⌘G)"}
                >
                  {bulkGenerationProgress ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span className="@[300px]:inline hidden">Generate</span>
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
          {/* Project selector (Pro+ only) - Mobile - includes integrated graph info */}
          {canUseProjectManagement && onProjectChange && (
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Project:
              </label>
              <div className="flex-1">
                <ProjectSelector
                  selectedProjectId={selectedProjectId}
                  onProjectChange={onProjectChange}
                  size="small"
                />
              </div>
            </div>
          )}

          {/* Action buttons row: Add dropdown + Apply, Delete, Generate */}
          <div className="flex items-center gap-2">
            {/* Add files dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600">
                <Plus className="w-4 h-4" />
                Add
                <ChevronDown className="w-3 h-3 text-slate-500" aria-hidden="true" />
              </Menu.Button>

              <Menu.Items
                anchor="bottom start"
                className="w-52 rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 dark:ring-opacity-50 focus:outline-none z-[100] [--anchor-gap:4px]"
              >
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={onAddFile}
                        className={`${active ? 'bg-slate-100 dark:bg-slate-700' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                      >
                        <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        Add local files
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={onGithubImport}
                        className={`${active ? 'bg-slate-100 dark:bg-slate-700' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                      >
                        <Github className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        Import from GitHub
                      </button>
                    )}
                  </Menu.Item>

                  {(hasLocalFiles || hasGitHubFiles) && (
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                  )}

                  {hasLocalFiles && (
                    <Menu.Item disabled={localReuploadProgress}>
                      {({ active, disabled }) => (
                        <button
                          type="button"
                          onClick={() => reuploadInputRef.current?.click()}
                          disabled={disabled}
                          className={`${active && !disabled ? 'bg-slate-100 dark:bg-slate-700' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                        >
                          <LocalSync className="text-slate-500 dark:text-slate-400" isLoading={!!localReuploadProgress} />
                          {localReuploadProgress
                            ? `Updating ${localReuploadProgress.updated}/${localReuploadProgress.matched}...`
                            : `Re-upload local (${localFiles.length})`
                          }
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {hasGitHubFiles && (
                    <Menu.Item disabled={bulkReloadProgress}>
                      {({ active, disabled }) => (
                        <button
                          type="button"
                          onClick={handleReloadAllFromGitHub}
                          disabled={disabled}
                          className={`${active && !disabled ? 'bg-slate-100 dark:bg-slate-700' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                        >
                          <GitHubSync className="text-slate-500 dark:text-slate-400" isLoading={!!bulkReloadProgress} />
                          {bulkReloadProgress
                            ? `Reloading ${bulkReloadProgress.completed}/${bulkReloadProgress.total}...`
                            : `Reload from GitHub (${githubFiles.length})`
                          }
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </div>
              </Menu.Items>
            </Menu>

            {/* Selection actions group (Apply, Delete, Generate) - visually grouped */}
            <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {/* Apply doc type menu */}
              <Menu as="div" className="relative">
                <Tooltip content={selectedCount > 0 ? 'Apply doc type' : 'Select files to apply doc type'}>
                  <Menu.Button
                    disabled={selectedCount === 0}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Stamp className="w-4 h-4" />
                  </Menu.Button>
                </Tooltip>

                <Menu.Items
                  anchor="bottom start"
                  className="w-48 rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 dark:ring-opacity-50 focus:outline-none z-[100] [--anchor-gap:4px]"
                >
                  <div className="p-1">
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Apply to {selectedCount} file{selectedCount !== 1 ? 's' : ''}
                    </div>
                    {docTypes.map((type) => (
                      <Menu.Item key={type.value}>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => {
                              if (onApplyDocType) {
                                onApplyDocType(selectedFileIds, type.value);
                                onDeselectAllFiles?.();
                              }
                            }}
                            className={`${active ? 'bg-slate-100 dark:bg-slate-700' : ''} group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                          >
                            {type.label}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Menu>

              <Tooltip content="Delete selected">
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
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={selectedCount > 0 ? 'Delete selection' : 'Select files to delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content={bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed}/${bulkGenerationProgress.total}` : "Generate docs"}>
                <button
                  type="button"
                  onClick={() => {
                    onGenerateSelected();
                    if (onToggleSidebar) onToggleSidebar();
                  }}
                  disabled={selectedCountWithContent === 0 && !hasCodeInEditor || bulkGenerationProgress}
                  className="p-1.5 rounded bg-purple-600 dark:bg-purple-400 text-white dark:text-slate-950 shadow-sm shadow-purple-600/20 dark:shadow-purple-400/30 hover:enabled:scale-[1.02] active:enabled:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
                  aria-label={bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed} of ${bulkGenerationProgress.total}` : "Generate for selection"}
                >
                  {bulkGenerationProgress ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
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

      {/* Search/Filter Bar - Only show when there are files */}
      {files.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter files..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              aria-label="Filter files by name"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Extension Filter Pills - Only show when multiple extensions exist */}
          {availableExtensions.length > 1 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {availableExtensions.map((ext) => {
                const isActive = selectedExtensions.includes(ext);
                return (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => toggleExtension(ext)}
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    .{ext}
                  </button>
                );
              })}
              {/* Clear all button - only show when filters are active */}
              {selectedExtensions.length > 0 && (
                <button
                  type="button"
                  onClick={clearExtensionFilters}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  aria-label="Clear extension filters"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* No Code Content Banner - Privacy Notice */}
      {hasFilesWithoutCode && showNoCodeBanner && (
        <div className="mx-3 my-2 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                {hasReloadableFiles ? (
                  <>
                    Some files have no code.{' '}
                    <button
                      onClick={handleReloadAllFromGitHub}
                      disabled={bulkReloadProgress}
                      className="font-medium hover:underline disabled:opacity-50"
                    >
                      Reload from source
                    </button>
                    {' '}or{' '}
                    <button
                      onClick={() => {
                        onSelectAllFiles();
                        setDeleteConfirmModal({
                          isOpen: true,
                          count: files.length
                        });
                      }}
                      className="font-medium hover:underline"
                    >
                      delete all
                    </button>.
                  </>
                ) : (
                  <>
                    Code not saved for privacy. Re-upload or{' '}
                    <button
                      onClick={() => {
                        onSelectAllFiles();
                        setDeleteConfirmModal({
                          isOpen: true,
                          count: files.length
                        });
                      }}
                      className="font-medium hover:underline"
                    >
                      delete all
                    </button>.
                  </>
                )}
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
          (() => {
            // Filter files: selected files always show, others are filtered by search and extension pills
            const searchLower = searchFilter.toLowerCase().trim();
            const isExtensionSearch = searchLower.startsWith('.');
            const hasActiveFilters = searchFilter || selectedExtensions.length > 0;

            const filteredFiles = hasActiveFilters
              ? files.filter(file => {
                  // Always show selected files
                  if (selectedFileIds.includes(file.id)) return true;

                  const filenameLower = file.filename.toLowerCase();
                  const fileExt = file.filename.split('.').pop()?.toLowerCase();

                  // Apply extension pill filters first (if any selected)
                  if (selectedExtensions.length > 0 && !selectedExtensions.includes(fileExt)) {
                    return false;
                  }

                  // If no search filter, extension match is enough
                  if (!searchFilter) return true;

                  // Extension search from search bar (e.g., ".js", ".jsx", ".ts")
                  if (isExtensionSearch) {
                    return filenameLower.endsWith(searchLower);
                  }

                  // Regular search - match anywhere in filename
                  return filenameLower.includes(searchLower);
                })
              : files;

            // Show "no matches" message if filter active but no results
            const filterDescription = selectedExtensions.length > 0
              ? (searchFilter ? `"${searchFilter}" + .${selectedExtensions.join(', .')}` : `.${selectedExtensions.join(', .')}`)
              : `"${searchFilter}"`;

            if (filteredFiles.length === 0 && hasActiveFilters) {
              return (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No files match {filterDescription}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilter('');
                      clearExtensionFilters();
                    }}
                    className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              );
            }

            return filteredFiles.map(file => (
              <FileItem
                key={file.id}
                file={file}
                isActive={file.id === activeFileId}
                isSelected={selectedFileIds.includes(file.id)}
                onSelect={() => onSelectFile(file.id)}
                onToggleSelection={() => onToggleFileSelection(file.id)}
                onRemove={() => onRemoveFile(file.id)}
                onGenerate={() => onGenerateFile(file.id)}
                onApplyDocType={null}
                onViewDetails={() => setDetailsFileId(file.id)}
                onReloadFromSource={() => handleReloadFromGitHub(file.id)}
                onReuploadFile={() => handleSingleFileReupload(file.id)}
                isReloading={reloadingFileIds.has(file.id)}
              />
            ));
          })()
        )}
      </div>

      {/* File Details Panel */}
      {detailsFileId && (
        <FileDetailsPanel
          file={files.find(f => f.id === detailsFileId)}
          isOpen={true}
          onClose={() => setDetailsFileId(null)}
          onViewBatchSummary={onViewBatchSummary}
        />
      )}

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

      {/* Hidden file input for bulk re-uploading local files */}
      <input
        ref={reuploadInputRef}
        type="file"
        multiple
        onChange={handleReuploadInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Hidden file input for single file re-upload */}
      <input
        ref={singleReuploadInputRef}
        type="file"
        onChange={handleSingleReuploadInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
