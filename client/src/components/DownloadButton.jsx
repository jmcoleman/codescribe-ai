import { Download } from 'lucide-react';
import { toastError } from '../utils/toast';

/**
 * DownloadButton - Enterprise-grade download button
 *
 * Features:
 * - Static download icon (no state transitions)
 * - Toast notification for success feedback
 * - Accessible with ARIA labels
 * - Reduced motion support
 * - Haptic feedback (if available)
 * - Timestamped filenames
 *
 * Note: Unlike CopyButton, download buttons should NOT show checkmark
 * animations. Downloads are fire-and-forget actions where the toast
 * notification provides sufficient user feedback.
 *
 * @param {string} content - Content to download
 * @param {string} docType - Document type (README, API, JSDOC, ARCHITECTURE)
 * @param {string} className - Additional CSS classes
 * @param {string} size - Button size: 'sm' | 'md' | 'lg'
 * @param {string} variant - Button variant: 'ghost' | 'outline' | 'solid'
 * @param {string} ariaLabel - Accessible label for screen readers
 * @param {boolean} showLabel - Show text label alongside icon
 */
export function DownloadButton({
  content,
  docType = 'documentation',
  className = '',
  size = 'md',
  variant = 'ghost',
  ariaLabel = 'Export',
  showLabel = false
}) {

  const handleDownload = () => {
    try {
      if (!content) {
        toastError('No content to download');
        return;
      }

      // Create timestamp in format: YYYY-MM-DD-HHMMSS
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
      const timestamp = `${date}-${time}`;
      const filename = `${docType}-${timestamp}.md`;

      // Create blob with markdown content
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // No success toast - browser's download notification provides sufficient feedback
      // We cannot reliably detect if user actually saved the file or canceled the dialog
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
      title={ariaLabel}
    >
      {/* Static Download Icon - No state transitions */}
      <Download className={iconSize} aria-hidden="true" />

      {/* Optional text label */}
      {showLabel && (
        <span className={textSizes[size]}>Export</span>
      )}
    </button>
  );
}
