import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, RotateCw, Sparkles, Info } from 'lucide-react';

/**
 * FileActions Component
 *
 * Dropdown menu with per-file actions.
 *
 * Actions (in order):
 * - Generate - Generate documentation for this file (if not generated)
 * - Regenerate - Re-generate documentation (if already generated)
 * - View Details - View detailed file metadata (keyboard shortcut: Cmd/Ctrl+I)
 * - Delete - Remove file from list
 *
 * @param {Object} props
 * @param {Object} props.file - File object
 * @param {Function} props.onRemove - Called when remove is clicked
 * @param {Function} props.onGenerate - Called when generate is clicked
 * @param {Function} props.onViewDetails - Called when view details is clicked
 */
export function FileActions({ file, onRemove, onGenerate, onViewDetails }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { documentation, content } = file;
  const hasContent = Boolean(content && content.length > 0);

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

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    }
    setIsOpen(false);
  };

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate();
    }
    setIsOpen(false);
  };

  const handleRegenerate = () => {
    if (onGenerate) {
      onGenerate();
    }
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
          {/* Generate - only if not yet generated AND has content */}
          {!documentation && hasContent && (
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-150"
              role="menuitem"
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
          )}

          {/* Regenerate - only if already generated AND has content */}
          {documentation && hasContent && (
            <button
              type="button"
              onClick={handleRegenerate}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-150"
              role="menuitem"
            >
              <RotateCw className="w-4 h-4" />
              Regenerate
            </button>
          )}

          {/* View Details - always available */}
          <button
            type="button"
            onClick={handleViewDetails}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 justify-between transition-colors duration-150"
            role="menuitem"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              View Details
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">⌘I</span>
          </button>

          {/* Divider before destructive action */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

          {/* Delete */}
          <button
            type="button"
            onClick={handleRemove}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-150"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
