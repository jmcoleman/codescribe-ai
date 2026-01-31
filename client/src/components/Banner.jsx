/**
 * Shared Banner Component
 *
 * Provides a consistent banner pattern for all alert/notification types.
 * Follows BANNER-PATTERNS.md: left colored border, consistent styling.
 *
 * Features:
 * - Left colored border (varies by type)
 * - Consistent icon display (no background circles)
 * - Consistent dismiss button (slate colored)
 * - Optional action buttons
 * - WCAG AA compliant
 */

import React from 'react';
import { X } from 'lucide-react';

/**
 * Banner Component
 * @param {Object} props
 * @param {string} props.type - Banner type: 'info' | 'warning' | 'error' | 'success' (affects border color)
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.iconColor - Icon color classes (e.g., 'text-indigo-600 dark:text-indigo-400')
 * @param {string} props.borderColor - Border color classes (e.g., 'border-indigo-500 dark:border-indigo-400')
 * @param {React.ReactNode} props.children - Banner content
 * @param {Function} props.onDismiss - Callback when banner is dismissed
 * @param {React.ReactNode} props.actions - Optional action buttons (rendered before dismiss button)
 * @param {string} props.ariaLive - ARIA live region type: 'polite' | 'assertive' (default: 'polite')
 * @param {boolean} props.alignCenter - If true, vertically center all items (for single-line banners). Default: false (items-start)
 * @returns {JSX.Element}
 */
export function Banner({
  type = 'info',
  icon: Icon,
  iconColor,
  borderColor,
  children,
  onDismiss,
  actions = null,
  ariaLive = 'polite',
  alignCenter = false
}) {
  return (
    <div
      className={`border-l-4 ${borderColor} bg-white dark:bg-slate-900 rounded-r-md transition-all duration-200`}
      role="alert"
      aria-live={ariaLive}
    >
      <div className={`flex ${alignCenter ? 'items-center' : 'items-start'} gap-3 p-4`}>
        {/* Icon - consistent display, no background circle */}
        {Icon && (
          <Icon
            className={`h-5 w-5 ${alignCenter ? '' : 'mt-0.5'} flex-shrink-0 ${iconColor}`}
            aria-hidden="true"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Actions + Dismiss Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Optional action buttons */}
          {actions}

          {/* Dismiss button - consistent slate color */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 transition-all"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Banner;
