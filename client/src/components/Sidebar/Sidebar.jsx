import { useState, useEffect } from 'react';
import { PanelLeft, PanelLeftClose, Plus, X, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { FileList } from './FileList';
import { Tooltip } from '../Tooltip';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../../constants/storage';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * Import Error Banner - Shows failed GitHub imports
 */
function ImportErrorBanner({ errors, onDismiss }) {
  if (!errors || errors.length === 0) return null;

  const fileNames = errors.map(e => e.filename || e.path?.split('/').pop() || 'Unknown').slice(0, 3);
  const moreCount = errors.length - fileNames.length;

  return (
    <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
            {errors.length} file{errors.length !== 1 ? 's' : ''} failed to import
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 truncate mt-0.5">
            {fileNames.join(', ')}{moreCount > 0 ? ` +${moreCount} more` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-800/50 text-amber-600 dark:text-amber-400 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Sidebar Component
 *
 * Collapsible sidebar for multi-file documentation management.
 * Supports 3 modes: Expanded, Collapsed, and Mobile Overlay
 *
 * Desktop (>= 1024px):
 * - Expanded (320px): Full file list with details
 * - Collapsed (60px): Thin strip with toggle button
 *
 * Mobile (< 1024px):
 * - Overlay: Full-width drawer that slides in from left, controlled by parent
 *
 * @param {Object} props
 * @param {Array} props.files - Array of file objects
 * @param {string} props.activeFileId - Currently active file ID
 * @param {Array} props.selectedFileIds - Array of selected file IDs
 * @param {number} props.selectedCount - Number of selected files
 * @param {boolean} props.mobileOpen - Mobile overlay open state (controlled by parent)
 * @param {boolean} props.isCollapsed - Controlled collapse state (desktop only)
 * @param {Function} props.onToggleCollapse - Called when collapse button is clicked (desktop only)
 * @param {Function} props.onApplyDocType - Called when user applies a doc type to files
 * @param {Function} props.onGithubImport - Called when GitHub import is clicked
 * @param {Function} props.onMobileClose - Called when mobile overlay should close
 * @param {Function} props.onSelectFile - Called when user selects a file
 * @param {Function} props.onToggleFileSelection - Called when checkbox is toggled
 * @param {Function} props.onSelectAllFiles - Called when Select All is clicked
 * @param {Function} props.onDeselectAllFiles - Called when Deselect All is clicked
 * @param {Function} props.onAddFile - Called when user uploads more files
 * @param {Function} props.onRemoveFile - Called when user removes a file
 * @param {Function} props.onGenerateFile - Called when Generate is clicked for single file
 * @param {Function} props.onGenerateSelected - Called when Generate is clicked for selected files
 * @param {Function} props.onDeleteSelected - Called when Delete is clicked
 * @param {Function} props.onUpdateFile - Called when file content is updated (e.g., after GitHub reload)
 * @param {number|null} props.selectedProjectId - Currently selected project ID (Pro+ only)
 * @param {Function} props.onProjectChange - Called when project selection changes (Pro+ only)
 * @param {boolean} props.canUseProjectManagement - Whether user can use project management (Pro+ only)
 * @param {boolean} props.hasPHI - Whether PHI has been detected and not yet confirmed/sanitized
 */
export function Sidebar({
  files = [],
  activeFileId,
  selectedFileIds = [],
  selectedCount = 0,
  mobileOpen = false,
  isCollapsed: isCollapsedProp,
  onToggleCollapse,
  onApplyDocType,
  onGithubImport,
  onMobileClose,
  onSelectFile,
  onToggleFileSelection,
  onSelectAllFiles,
  onDeselectAllFiles,
  onAddFile,
  onRemoveFile,
  onGenerateFile,
  onGenerateSelected,
  onDeleteSelected,
  hasCodeInEditor = false,
  onFilesDrop,
  bulkGenerationProgress = null,
  onUpdateFile,
  onViewBatchSummary,
  selectedProjectId = null,
  onProjectChange,
  canUseProjectManagement = false,
  importErrors = [],
  onDismissImportErrors,
  hasPHI = false
}) {
  // Sidebar state: 'expanded', 'collapsed' (desktop only)
  // If controlled (isCollapsedProp is defined), use prop, otherwise use local state
  const [sidebarMode, setSidebarMode] = useState(() => {
    // Load from localStorage using proper storage key
    const saved = getStorageItem(STORAGE_KEYS.SIDEBAR_MODE);
    return saved || 'expanded';
  });

  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  // Focus trap for mobile drawer (WCAG 2.1 compliance)
  const mobileDrawerRef = useFocusTrap(isMobile && mobileOpen, onMobileClose);

  // Persist sidebar mode to localStorage (desktop only)
  useEffect(() => {
    if (!isMobile && isCollapsedProp === undefined) {
      setStorageItem(STORAGE_KEYS.SIDEBAR_MODE, sidebarMode);
    }
  }, [sidebarMode, isMobile, isCollapsedProp]);

  // Responsive: Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      // Restore desktop mode when resizing back from mobile
      if (!mobile && isCollapsedProp === undefined) {
        const saved = getStorageItem(STORAGE_KEYS.SIDEBAR_MODE);
        if (saved && saved !== 'hidden') {
          setSidebarMode(saved);
        } else {
          setSidebarMode('expanded');
        }
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsedProp]);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, mobileOpen]);

  const toggleSidebar = () => {
    if (onToggleCollapse) {
      // Controlled mode - notify parent
      onToggleCollapse();
    } else {
      // Uncontrolled mode - update local state
      setSidebarMode(prev => prev === 'expanded' ? 'collapsed' : 'expanded');
    }
  };

  // Use controlled state if provided, otherwise use local state
  const isCollapsed = isCollapsedProp !== undefined
    ? isCollapsedProp
    : sidebarMode === 'collapsed';
  const isExpanded = !isCollapsed;

  // Mobile: Render as overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 z-40 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer */}
        <div
          ref={mobileDrawerRef}
          className={`
            fixed top-0 left-0 bottom-0 z-50 lg:hidden
            w-[320px] max-w-[85vw]
            bg-white dark:bg-slate-900
            border-r border-slate-200 dark:border-slate-700
            flex flex-col
            transition-transform duration-200 ease-out
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Files ({files.length})
            </h2>
            <button
              type="button"
              onClick={onMobileClose}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Import Error Banner */}
          <ImportErrorBanner errors={importErrors} onDismiss={onDismissImportErrors} />

          {/* File List */}
          <FileList
            files={files}
            activeFileId={activeFileId}
            selectedFileIds={selectedFileIds}
            selectedCount={selectedCount}
            bulkGenerationProgress={bulkGenerationProgress}
            onApplyDocType={onApplyDocType}
            onGithubImport={onGithubImport}
            onSelectFile={onSelectFile}
            onToggleFileSelection={onToggleFileSelection}
            onSelectAllFiles={onSelectAllFiles}
            onDeselectAllFiles={onDeselectAllFiles}
            onRemoveFile={onRemoveFile}
            onAddFile={onAddFile}
            onGenerateFile={onGenerateFile}
            onGenerateSelected={onGenerateSelected}
            onDeleteSelected={onDeleteSelected}
            onToggleSidebar={onMobileClose}
            hasCodeInEditor={hasCodeInEditor}
            onFilesDrop={onFilesDrop}
            onUpdateFile={onUpdateFile}
            onViewBatchSummary={onViewBatchSummary}
            isMobile={true}
            selectedProjectId={selectedProjectId}
            onProjectChange={onProjectChange}
            canUseProjectManagement={canUseProjectManagement}
            hasPHI={hasPHI}
          />
        </div>
      </>
    );
  }

  // Desktop: Render as sidebar
  return (
    <div
      className={`
        sidebar-container
        w-full
        h-full
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-700
        flex flex-col
        relative
        transition-all duration-200 ease-out
        motion-reduce:transition-none
      `}
    >
        {/* Compact Header - Toggle and Generate when collapsed */}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
            <Tooltip content="Expand sidebar" side="right">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </Tooltip>
            <Tooltip content={hasPHI ? "Review & sanitize PHI before generating" : bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed}/${bulkGenerationProgress.total}` : "Generate docs (⌘G)"} side="right">
              <button
                type="button"
                onClick={onGenerateSelected}
                disabled={selectedCount === 0 || bulkGenerationProgress || hasPHI}
                className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={hasPHI ? "Review and sanitize PHI before generating" : bulkGenerationProgress ? `Generating ${bulkGenerationProgress.completed} of ${bulkGenerationProgress.total}` : "Generate documentation"}
              >
                {bulkGenerationProgress ? (
                  <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                )}
              </button>
            </Tooltip>
          </div>
        )}

        {/* Import Error Banner (only show when expanded) */}
        {isExpanded && (
          <ImportErrorBanner errors={importErrors} onDismiss={onDismissImportErrors} />
        )}

        {/* File List (only show when expanded) */}
        {isExpanded && (
          <FileList
            files={files}
            activeFileId={activeFileId}
            selectedFileIds={selectedFileIds}
            selectedCount={selectedCount}
            bulkGenerationProgress={bulkGenerationProgress}
            onApplyDocType={onApplyDocType}
            onGithubImport={onGithubImport}
            onSelectFile={onSelectFile}
            onToggleFileSelection={onToggleFileSelection}
            onSelectAllFiles={onSelectAllFiles}
            onDeselectAllFiles={onDeselectAllFiles}
            onRemoveFile={onRemoveFile}
            onAddFile={onAddFile}
            onGenerateFile={onGenerateFile}
            onGenerateSelected={onGenerateSelected}
            onDeleteSelected={onDeleteSelected}
            hasCodeInEditor={hasCodeInEditor}
            onFilesDrop={onFilesDrop}
            onToggleSidebar={toggleSidebar}
            onUpdateFile={onUpdateFile}
            onViewBatchSummary={onViewBatchSummary}
            isMobile={false}
            selectedProjectId={selectedProjectId}
            onProjectChange={onProjectChange}
            canUseProjectManagement={canUseProjectManagement}
            hasPHI={hasPHI}
          />
        )}
    </div>
  );
}
