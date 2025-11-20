import { useEffect, useRef, useState, useCallback } from 'react';
import { X, FileText, Calendar, Info } from 'lucide-react';
import {
  formatOrigin,
  formatFileType,
  formatTimestamp,
  getDocumentationStatus,
  getMetadataValue
} from '../../constants/fileMetadata';

/**
 * FileDetailsPanel Component
 *
 * Slide-out panel displaying detailed file metadata.
 * Desktop: Right slide-out (320px width)
 * Mobile: Bottom sheet (60vh height)
 *
 * Access:
 * - Via FileActions menu "View Details"
 * - Via keyboard shortcut Cmd/Ctrl+I
 *
 * @param {Object} props
 * @param {Object} props.file - File object
 * @param {boolean} props.isOpen - Whether panel is open
 * @param {Function} props.onClose - Called when panel closes
 */
export function FileDetailsPanel({ file, isOpen, onClose }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  if (!file) return null;

  // Handle enter animation
  useEffect(() => {
    if (isOpen) {
      setIsEntering(true);
      setIsExiting(false);
      // Remove entering state after animation completes
      const timer = setTimeout(() => setIsEntering(false), 250); // Match enter duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle close with exit animation
  const handleClose = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before actually closing
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 200); // Match exit duration
  }, [onClose]);

  // Focus management and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Store the element that had focus before panel opened
    previousActiveElement.current = document.activeElement;

    const panel = panelRef.current;
    if (!panel) return;

    // Focus close button when panel opens
    if (closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current.focus();
      }, 50);
    }

    // Get all focusable elements within the panel
    const getFocusableElements = () => {
      const selector = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');

      return Array.from(panel.querySelectorAll(selector));
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
      // ESC closes panel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      // Tab key - focus trap
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Shift+Tab on first element -> focus last element
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab on last element -> focus first element
        if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
          return;
        }
      }
    };

    panel.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      panel.removeEventListener('keydown', handleKeyDown);

      // Return focus to element that opened the panel
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  // Extract file data
  const {
    filename,
    content,
    docType,
    qualityScore,
    documentation,
    isGenerating,
    error,
    documentId,
    fileSize,
    origin,
    dateAdded,
    dateModified
  } = file;

  // Calculate metadata
  const fileType = formatFileType(filename);
  const formattedSize = getMetadataValue('fileSize', file);
  const linesOfCode = content?.split('\n').length || 0;
  const formattedOrigin = formatOrigin(origin);
  const docStatus = getDocumentationStatus(file);
  const qualityDisplay = qualityScore
    ? `${qualityScore.grade} ${qualityScore.score} / 100`
    : 'Not generated';

  // Quality grade color (matches FileItem styling)
  const qualityColor = qualityScore?.grade
    ? {
        'A': 'text-green-600 dark:text-green-400',
        'B': 'text-blue-600 dark:text-blue-400',
        'C': 'text-yellow-600 dark:text-yellow-400',
        'D': 'text-orange-600 dark:text-orange-400',
        'F': 'text-red-600 dark:text-red-400'
      }[qualityScore.grade] || 'text-slate-600 dark:text-slate-400'
    : 'text-slate-500 dark:text-slate-400';

  // Format timestamps
  const formattedDateAdded = formatTimestamp(dateAdded);
  const formattedDateModified = formatTimestamp(dateModified);
  const dateGenerated = documentation ? formatTimestamp(new Date()) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-sm
          transition-opacity duration-200
          ${isExiting ? 'opacity-0' : 'opacity-100'}
        `}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-details-title"
        className={`
          relative bg-white dark:bg-slate-800 shadow-xl border-l border-slate-200 dark:border-slate-700
          h-full overflow-y-auto
          w-80
          max-md:w-full max-md:h-[60vh] max-md:border-l-0 max-md:border-t
          max-md:mt-auto max-md:rounded-t-xl
          ${isEntering
            ? 'animate-slideInFromRight max-md:animate-slideInFromBottom'
            : isExiting
            ? 'animate-fadeOut'
            : ''
          }
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between z-10">
          <h2
            id="file-details-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            File Details
          </h2>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            aria-label="Close file details"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Filename */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 break-all">
              {filename}
            </h3>
          </div>

          {/* File Information */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" />
              File Information
            </h3>
            <dl className="space-y-2">
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Type</dt>
                <dd className="text-sm text-slate-900 dark:text-slate-100 text-right">{fileType}</dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Size</dt>
                <dd className="text-sm text-slate-900 dark:text-slate-100 text-right">{formattedSize}</dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Lines</dt>
                <dd className="text-sm text-slate-900 dark:text-slate-100 text-right">{linesOfCode}</dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Origin</dt>
                <dd className="text-sm text-slate-900 dark:text-slate-100 text-right">{formattedOrigin}</dd>
              </div>
            </dl>
          </div>

          {/* Documentation (Always visible - Requirement #4) */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" aria-hidden="true" />
              Documentation
            </h3>
            <dl className="space-y-2">
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Type</dt>
                <dd className="text-sm font-medium text-purple-600 dark:text-purple-400 text-right">
                  {docType || 'README'}
                </dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Quality</dt>
                <dd className={`text-sm text-right font-medium ${qualityColor}`}>{qualityDisplay}</dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Status</dt>
                <dd className={`text-sm text-right font-medium ${
                  isGenerating
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : error
                    ? 'text-red-600 dark:text-red-400'
                    : documentation
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {docStatus}
                </dd>
              </div>
              {dateGenerated && (
                <div className="flex justify-between items-start gap-4">
                  <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Generated</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100 text-right">{dateGenerated}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Timestamps
            </h3>
            <dl className="space-y-2">
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Added</dt>
                <dd className="text-sm text-slate-900 dark:text-slate-100 text-right">{formattedDateAdded}</dd>
              </div>
              <div className="flex justify-between items-start gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">Modified</dt>
                <dd className="text-sm text-slate-900 dark:text-slate-100 text-right">{formattedDateModified}</dd>
              </div>
            </dl>
          </div>

          {/* Error message (if any) */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-1">Error</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Database ID (if saved) */}
          {documentId && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Document ID: <span className="font-mono">{documentId}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
