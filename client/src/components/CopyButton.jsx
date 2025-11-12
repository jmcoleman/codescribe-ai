import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { toastError } from '../utils/toast';

/**
 * CopyButton - Enterprise-grade copy-to-clipboard button
 *
 * Features:
 * - Smooth icon transition (Copy → Check)
 * - Subtle color change on check icon (cyan accent for code/technical success)
 * - Text label changes (Copy → Copied) when showLabel is true
 * - Auto-reset after 1 second
 * - Accessible with ARIA labels
 * - Reduced motion support
 * - Haptic feedback (if available)
 *
 * Note: No toast notification - button state provides sufficient visual feedback
 * Pattern: Matches Clear button style (subtle, professional, no background change)
 *
 * @param {string} text - Text to copy to clipboard
 * @param {string} className - Additional CSS classes
 * @param {string} size - Button size: 'sm' | 'md' | 'lg'
 * @param {string} variant - Button variant: 'ghost' | 'outline' | 'solid'
 * @param {boolean} showLabel - Show text label alongside icon
 */
export function CopyButton({
  text,
  className = '',
  size = 'md',
  variant = 'ghost',
  ariaLabel = 'Copy to clipboard',
  showLabel = false
}) {
  const [copied, setCopied] = useState(false);

  // Auto-reset after 1 second
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts (e.g., mobile via IP address)
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } finally {
          textArea.remove();
        }
      }

      setCopied(true);

      // Visual feedback via button state change (icon + color)
      // No toast notification - button provides sufficient visual feedback

      // Haptic feedback on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
      toastError('Unable to copy to clipboard. Please try again.');
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

  // Style variants - no background/border change, consistent with Clear button
  const variantClasses = {
    ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent',
    outline: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500',
    solid: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600',
  };

  const iconSize = iconSizes[size];

  return (
    <button
      type="button"
      data-testid="copy-btn"
      onClick={handleCopy}
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
        ${!showLabel ? 'relative' : ''}
        ${copied ? 'pointer-events-none' : ''}
        ${className}
      `}
      aria-label={copied ? 'Copied!' : ariaLabel}
      title={copied ? 'Copied!' : ariaLabel}
    >
      {/* Screen reader announcement */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copied && 'Copied to clipboard'}
      </span>

      {/* Icon with smooth cross-fade animation */}
      <div className="relative flex items-center justify-center">
        {/* Copy Icon */}
        <Copy
          className={`
            ${iconSize}
            transition-all duration-200 ease-out
            ${copied ? 'opacity-0 scale-50 rotate-90 absolute' : 'opacity-100 scale-100 rotate-0'}
          `}
          aria-hidden="true"
        />

        {/* Check Icon */}
        <Check
          className={`
            ${iconSize}
            ${copied ? 'text-cyan-600 dark:text-cyan-400' : ''}
            transition-all duration-200 ease-out
            ${copied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90 absolute'}
          `}
          aria-hidden="true"
        />
      </div>

      {/* Optional text label */}
      {showLabel && (
        <span className={textSizes[size]}>
          {copied ? 'Copied' : 'Copy'}
        </span>
      )}
    </button>
  );
}

/**
 * CopyButtonWithText - Copy button with label text
 * For use in headers, toolbars, etc.
 * Pattern: Matches main CopyButton style (subtle, professional)
 */
export function CopyButtonWithText({
  text,
  className = '',
  label = 'Copy'
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts (e.g., mobile via IP address)
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } finally {
          textArea.remove();
        }
      }

      setCopied(true);

      // Visual feedback via button state change (icon + text)
      // No toast notification - button provides sufficient visual feedback

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
      toastError('Unable to copy to clipboard. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        flex items-center gap-2 px-3 py-1.5
        rounded-lg text-sm font-medium
        transition-all duration-200
        hover:scale-[1.02]
        active:scale-[0.98]
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400
        focus-visible:ring-offset-2
        focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800
        motion-reduce:transition-none
        bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600
        ${copied ? 'pointer-events-none' : ''}
        ${className}
      `}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {/* Icon with smooth transition */}
      <div className="relative flex items-center justify-center">
        <Copy
          className={`
            w-4 h-4
            transition-all duration-200 ease-out
            ${copied ? 'opacity-0 scale-50 rotate-90 absolute' : 'opacity-100 scale-100 rotate-0'}
          `}
          aria-hidden="true"
        />
        <Check
          className={`
            w-4 h-4
            ${copied ? 'text-cyan-600 dark:text-cyan-400' : ''}
            transition-all duration-200 ease-out
            ${copied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90 absolute'}
          `}
          aria-hidden="true"
        />
      </div>

      {/* Text label */}
      <span className="transition-all duration-200">
        {copied ? 'Copied!' : label}
      </span>
    </button>
  );
}
