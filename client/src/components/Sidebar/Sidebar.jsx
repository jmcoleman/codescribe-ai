import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { FileList } from './FileList';

/**
 * Sidebar Component
 *
 * Collapsible sidebar for multi-file documentation management.
 * Supports 4 modes: Expanded (320px), Collapsed (60px), Hover-Overlay (320px), Hidden (0px).
 *
 * Modes:
 * - Expanded: Full file list with details
 * - Collapsed: Icons only, hoverable for overlay
 * - Hover-Overlay: Temporary overlay on hover (collapsed mode)
 * - Hidden: Mobile only (< 1024px)
 *
 * @param {Object} props
 * @param {Array} props.files - Array of file objects
 * @param {string} props.activeFileId - Currently active file ID
 * @param {Function} props.onSelectFile - Called when user selects a file
 * @param {Function} props.onAddFiles - Called when user uploads more files
 * @param {Function} props.onRemoveFile - Called when user removes a file
 * @param {Function} props.onGenerateAll - Called when Generate All is clicked
 * @param {Function} props.onClearAll - Called when Clear All is clicked
 */
export function Sidebar({
  files = [],
  activeFileId,
  onSelectFile,
  onAddFiles,
  onRemoveFile,
  onGenerateAll,
  onClearAll
}) {
  // Sidebar state: 'expanded', 'collapsed', 'hidden'
  const [sidebarMode, setSidebarMode] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('sidebar-mode');
    return saved || 'expanded';
  });

  // Hover overlay state (only active when collapsed)
  const [showHoverOverlay, setShowHoverOverlay] = useState(false);

  // Persist sidebar mode to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-mode', sidebarMode);
  }, [sidebarMode]);

  // Responsive: Hide sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarMode('hidden');
      } else {
        // Restore from localStorage when resizing back to desktop
        const saved = localStorage.getItem('sidebar-mode');
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
  }, []);

  const toggleSidebar = () => {
    setSidebarMode(prev => prev === 'expanded' ? 'collapsed' : 'expanded');
  };

  // If hidden, don't render anything
  if (sidebarMode === 'hidden') {
    return null;
  }

  const isCollapsed = sidebarMode === 'collapsed';
  const isExpanded = sidebarMode === 'expanded';

  return (
    <>
      {/* Main Sidebar */}
      <div
        className={`
          sidebar-container
          ${isCollapsed ? 'w-[60px]' : 'w-[320px]'}
          transition-[width] duration-200 ease-in-out
          h-full
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-700
          flex flex-col
          relative
        `}
        onMouseEnter={() => {
          if (isCollapsed) {
            setShowHoverOverlay(true);
          }
        }}
        onMouseLeave={() => {
          if (isCollapsed) {
            setShowHoverOverlay(false);
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          {isExpanded && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Files ({files.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onAddFiles}
                  className="icon-btn interactive-scale-sm focus-ring-light"
                  aria-label="Upload more files"
                  title="Upload more files"
                >
                  <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="icon-btn interactive-scale-sm focus-ring-light"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </>
          )}

          {isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="icon-btn interactive-scale-sm focus-ring-light mx-auto"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>

        {/* File List (only show when expanded) */}
        {isExpanded && (
          <FileList
            files={files}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onRemoveFile={onRemoveFile}
            onGenerateAll={onGenerateAll}
            onClearAll={onClearAll}
          />
        )}

        {/* Collapsed state - icon badges */}
        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center py-4 gap-3">
            {files.slice(0, 5).map(file => (
              <button
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  text-xs font-medium
                  ${activeFileId === file.id
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                `}
                aria-label={`View ${file.filename}`}
                title={file.filename}
              >
                {file.filename.slice(0, 2).toUpperCase()}
              </button>
            ))}
            {files.length > 5 && (
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                +{files.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hover Overlay (only when collapsed and hovering) */}
      {isCollapsed && showHoverOverlay && (
        <div
          className="
            fixed left-[60px] top-0 h-full w-[320px]
            bg-white dark:bg-slate-900
            border-r border-slate-200 dark:border-slate-700
            shadow-xl
            z-50
            animate-slideInFade
          "
          style={{
            animation: 'slideInFade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Files ({files.length})
            </h2>
            <button
              type="button"
              onClick={onAddFiles}
              className="icon-btn interactive-scale-sm focus-ring-light"
              aria-label="Upload more files"
              title="Upload more files"
            >
              <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* File List in Overlay */}
          <FileList
            files={files}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onRemoveFile={onRemoveFile}
            onGenerateAll={onGenerateAll}
            onClearAll={onClearAll}
          />
        </div>
      )}
    </>
  );
}
