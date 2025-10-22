import { useState, useEffect } from 'react';
import { Download, Check } from 'lucide-react';
import { toastCompact, toastError } from '../utils/toast';

/**
 * DownloadButton - Enterprise-grade download button
 *
 * Features:
 * - Smooth icon transition (Download → Check)
 * - Color animation on success
 * - Auto-reset after 2 seconds
 * - Accessible with ARIA labels
 * - Reduced motion support
 * - Haptic feedback (if available)
 * - Timestamped filenames
 *
 * @param {string} content - Content to download
 * @param {string} docType - Document type (README, API, JSDOC, ARCHITECTURE)
 * @param {string} className - Additional CSS classes
 * @param {string} size - Button size: 'sm' | 'md' | 'lg'
 * @param {string} variant - Button variant: 'ghost' | 'outline' | 'solid'
 * @param {string} ariaLabel - Accessible label for screen readers
 */
export function DownloadButton({
  content,
  docType = 'documentation',
  className = '',
  size = 'md',
  variant = 'ghost',
  ariaLabel = 'Download'
}) {
  const [downloaded, setDownloaded] = useState(false);

  // Auto-reset after 2 seconds
  useEffect(() => {
    if (downloaded) {
      const timer = setTimeout(() => {
        setDownloaded(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [downloaded]);

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

      setDownloaded(true);

      // Show success toast
      toastCompact('Downloaded!', 'success');

      // Haptic feedback on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error('Failed to download file:', err);
      toastError('Unable to download file. Please try again.');
    }
  };

  // Size variants
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Style variants
  const variantClasses = {
    ghost: downloaded
      ? 'bg-green-50 text-green-600 border border-green-200'
      : 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
    outline: downloaded
      ? 'bg-green-50 text-green-600 border border-green-300'
      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300',
    solid: downloaded
      ? 'bg-green-600 text-white border border-green-600'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
  };

  const iconSize = iconSizes[size];

  return (
    <button
      type="button"
      data-testid="download-btn"
      onClick={handleDownload}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg
        transition-all duration-200
        hover:scale-[1.05]
        active:scale-[0.98]
        focus:outline-none
        focus:ring-2
        focus:ring-purple-600
        focus:ring-offset-2
        motion-reduce:transition-none
        relative
        ${className}
      `}
      aria-label={downloaded ? 'Downloaded!' : ariaLabel}
      title={downloaded ? 'Downloaded!' : ariaLabel}
      disabled={downloaded}
    >
      {/* Icon with smooth cross-fade animation */}
      <div className="relative flex items-center justify-center">
        {/* Download Icon */}
        <Download
          className={`
            ${iconSize}
            transition-all duration-200 ease-out
            ${downloaded ? 'opacity-0 scale-50 rotate-90 absolute' : 'opacity-100 scale-100 rotate-0'}
          `}
        />

        {/* Check Icon */}
        <Check
          className={`
            ${iconSize}
            transition-all duration-200 ease-out
            ${downloaded ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90 absolute'}
          `}
        />
      </div>
    </button>
  );
}
