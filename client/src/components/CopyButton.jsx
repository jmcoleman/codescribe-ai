import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * CopyButton - Enterprise-grade copy-to-clipboard button
 *
 * Features:
 * - Smooth icon transition (Copy → Check)
 * - Color animation on success
 * - Auto-reset after 2 seconds
 * - Accessible with ARIA labels
 * - Reduced motion support
 * - Haptic feedback (if available)
 *
 * @param {string} text - Text to copy to clipboard
 * @param {string} className - Additional CSS classes
 * @param {string} size - Button size: 'sm' | 'md' | 'lg'
 * @param {string} variant - Button variant: 'ghost' | 'outline' | 'solid'
 */
export function CopyButton({
  text,
  className = '',
  size = 'md',
  variant = 'ghost',
  ariaLabel = 'Copy to clipboard'
}) {
  const [copied, setCopied] = useState(false);

  // Auto-reset after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Haptic feedback on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
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
    ghost: copied
      ? 'bg-green-50 text-green-600 border border-green-200'
      : 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
    outline: copied
      ? 'bg-green-50 text-green-600 border border-green-300'
      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300',
    solid: copied
      ? 'bg-green-600 text-white border border-green-600'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
  };

  const iconSize = iconSizes[size];

  return (
    <button
      onClick={handleCopy}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg
        transition-all duration-200
        hover:scale-[1.05]
        active:scale-[0.98]
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-500
        focus:ring-offset-2
        motion-reduce:transition-none
        relative
        ${className}
      `}
      aria-label={copied ? 'Copied!' : ariaLabel}
      title={copied ? 'Copied!' : ariaLabel}
      disabled={copied}
    >
      {/* Icon with smooth cross-fade animation */}
      <div className="relative flex items-center justify-center">
        {/* Copy Icon */}
        <Copy
          className={`
            ${iconSize}
            transition-all duration-200 ease-out
            ${copied ? 'opacity-0 scale-50 rotate-90 absolute' : 'opacity-100 scale-100 rotate-0'}
          `}
        />

        {/* Check Icon */}
        <Check
          className={`
            ${iconSize}
            transition-all duration-200 ease-out
            ${copied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90 absolute'}
          `}
        />
      </div>
    </button>
  );
}

/**
 * CopyButtonWithText - Copy button with label text
 * For use in headers, toolbars, etc.
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
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center gap-2 px-3 py-1.5
        rounded-lg text-sm font-medium
        transition-all duration-200
        hover:scale-[1.02]
        active:scale-[0.98]
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-500
        focus:ring-offset-2
        motion-reduce:transition-none
        ${copied
          ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
        }
        ${className}
      `}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
      disabled={copied}
    >
      {/* Icon with smooth transition */}
      <Copy
        className={`
          w-4 h-4
          transition-all duration-200
          ${copied ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}
        `}
      />
      <Check
        className={`
          w-4 h-4
          absolute
          transition-all duration-200
          ${copied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}
        `}
      />

      {/* Text label */}
      <span className="transition-all duration-200">
        {copied ? 'Copied!' : label}
      </span>
    </button>
  );
}
