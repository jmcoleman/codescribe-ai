import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Download, History, RotateCw } from 'lucide-react';

/**
 * FileActions Component
 *
 * Dropdown menu with per-file actions.
 * NEW: Adds "View in History" action if file has documentId (saved to database).
 *
 * Actions:
 * - View in History (NEW) - View document in usage dashboard (if documentId exists)
 * - Regenerate - Re-generate documentation
 * - Download Docs - Download .md file
 * - Remove from List - Remove file (with confirmation)
 *
 * @param {Object} props
 * @param {Object} props.file - File object
 * @param {Function} props.onRemove - Called when remove is clicked
 */
export function FileActions({ file, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { documentId, documentation, filename } = file;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleViewHistory = () => {
    if (documentId) {
      // Navigate to usage dashboard with document highlighted
      window.location.href = `/dashboard?doc=${documentId}`;
    }
    setIsOpen(false);
  };

  const handleRegenerate = () => {
    // TODO: Implement regenerate logic
    console.log('Regenerate:', filename);
    setIsOpen(false);
  };

  const handleDownload = () => {
    if (!documentation) return;

    // Create blob and download
    const blob = new Blob([documentation], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsOpen(false);
  };

  const handleRemove = () => {
    onRemove();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Menu button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="icon-btn interactive-scale-sm focus-ring-light"
        aria-label="File actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {/* View in History (NEW - only if documentId exists) */}
          {documentId && (
            <button
              type="button"
              onClick={handleViewHistory}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              role="menuitem"
            >
              <History className="w-4 h-4" />
              View in History
            </button>
          )}

          {/* Regenerate */}
          {documentation && (
            <button
              type="button"
              onClick={handleRegenerate}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              role="menuitem"
            >
              <RotateCw className="w-4 h-4" />
              Regenerate
            </button>
          )}

          {/* Download Docs */}
          {documentation && (
            <button
              type="button"
              onClick={handleDownload}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              role="menuitem"
            >
              <Download className="w-4 h-4" />
              Download Docs
            </button>
          )}

          {/* Divider */}
          {(documentId || documentation) && (
            <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
          )}

          {/* Remove */}
          <button
            type="button"
            onClick={handleRemove}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            Remove from List
          </button>
        </div>
      )}
    </div>
  );
}
