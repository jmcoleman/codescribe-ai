import { Download } from 'lucide-react';
import { toastError } from '../utils/toast';
import { Tooltip } from './Tooltip';

/**
 * DownloadButton - Enterprise-grade download button
 *
 * Features:
 * - Static download icon (no state transitions)
 * - Toast notification for success feedback
 * - Accessible with ARIA labels
 * - Reduced motion support
 * - Haptic feedback (if available)
 * - Timestamped filenames (when filename not provided)
 *
 * Note: Unlike CopyButton, download buttons should NOT show checkmark
 * animations. Downloads are fire-and-forget actions where the toast
 * notification provides sufficient user feedback.
 *
 * @param {string} content - Content to download
 * @param {string} filename - Optional: specific filename to use (e.g., 'code.js'). If provided, used as-is without timestamp
 * @param {string} docType - Document type (README, API, JSDOC, ARCHITECTURE) - only used if filename not provided
 * @param {string} className - Additional CSS classes
 * @param {string} size - Button size: 'sm' | 'md' | 'lg'
 * @param {string} variant - Button variant: 'ghost' | 'outline' | 'solid'
 * @param {string} ariaLabel - Accessible label for screen readers
 * @param {boolean} showLabel - Show text label alongside icon
 * @param {Function} onSuccess - Optional callback when download succeeds (for analytics)
 */
export function DownloadButton({
  content,
  filename = null,
  docType = 'documentation',
  className = '',
  size = 'md',
  variant = 'ghost',
  ariaLabel = 'Export',
  showLabel = false,
  labelClassName = '',
  onSuccess = null
}) {

  const handleDownload = () => {
    try {
      if (!content) {
        toastError('No content to download');
        return;
      }

      // Use provided filename or generate one with timestamp
      let downloadFilename;
      if (filename) {
        // Use the provided filename as-is
        downloadFilename = filename;
      } else {
        // Generate filename with timestamp: docType-YYYYMMDDHHMMSS.md
        const now = new Date();
        const timestamp = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0') +
          String(now.getHours()).padStart(2, '0') +
          String(now.getMinutes()).padStart(2, '0') +
          String(now.getSeconds()).padStart(2, '0');
        downloadFilename = `${docType}-${timestamp}.md`;
      }

      // Create blob with markdown content
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // No success toast - browser's download notification provides sufficient feedback
      // We cannot reliably detect if user actually saved the file or canceled the dialog

      // Call success callback (for analytics tracking)
      // Note: This fires when download is initiated, not when user saves the file
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to download file:', err);
      toastError('Unable to download file. Please try again.');
    }
  };

  // Size variants
  const sizeClasses = {
    sm: showLabel ? 'px-2.5 py-1.5' : 'p-1.5',
    md: showLabel ? 'px-2.5 py-1.5' : 'p-2',
    lg: showLabel ? 'px-3 py-2' : 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };

  // Style variants (no state changes - icon stays consistent)
  const variantClasses = {
    ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent',
    outline: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500',
    solid: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600',
  };

  const iconSize = iconSizes[size];

  return (
    <Tooltip content={ariaLabel}>
      <button
        type="button"
        data-testid="download-btn"
        onClick={handleDownload}
        className={`
          ${showLabel ? 'inline-flex items-center gap-1.5' : ''}
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${showLabel ? 'font-medium' : ''}
          rounded-lg
          transition-all duration-200
          hover:scale-[1.02]
          active:scale-[0.98]
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400
          focus-visible:ring-offset-2
          focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800
          motion-reduce:transition-none
          ${className}
        `}
        aria-label={ariaLabel}
      >
        {/* Static Download Icon - No state transitions */}
        <Download className={iconSize} aria-hidden="true" />

        {/* Optional text label */}
        {showLabel && (
          <span className={`${textSizes[size]} ${labelClassName}`}>Export</span>
        )}
      </button>
    </Tooltip>
  );
}
