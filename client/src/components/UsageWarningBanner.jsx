import { X, AlertCircle, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

/**
 * Usage warning banner for 80-99% quota usage (soft limit)
 *
 * Displays persistent, dismissible banner at top of page when user reaches 80% of their quota.
 * Non-blocking - user can continue working and dismiss the warning.
 *
 * NOTE: At 100% usage, UsageLimitModal is shown instead (blocking modal, see App.jsx lines 158-161)
 *
 * Design: Based on ERROR-HANDLING-UX.md guidelines
 * - Slide + fade animation (250ms enter, 200ms exit)
 * - Yellow accent bar for warning state (neutral background)
 * - Persistent until dismissed (no auto-dismiss)
 * - WCAG 2.1 AA compliant
 *
 * @param {Object} props
 * @param {Object} props.usage - Usage data from API (should be 80-99% only)
 * @param {number} props.usage.percentage - Usage percentage (80-99)
 * @param {number} props.usage.remaining - Documents remaining (1+)
 * @param {number} props.usage.limit - Total limit
 * @param {string} props.usage.period - 'daily' or 'monthly'
 * @param {string} props.usage.resetDate - ISO date string for reset
 * @param {string} props.currentTier - Current user tier
 * @param {Function} props.onDismiss - Called when user dismisses banner
 * @param {Function} props.onUpgrade - Called when user clicks upgrade CTA
 */
export function UsageWarningBanner({
  usage,
  currentTier = 'free',
  onDismiss,
  onUpgrade
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimerRef = useRef(null);

  // Reset visibility when usage changes
  useEffect(() => {
    if (usage) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [usage]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    // Wait for exit animation to complete
    dismissTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 200); // Match exit animation duration
  };

  if (!usage || !isVisible) return null;

  // Tier upgrade paths
  const tiers = {
    free: {
      name: 'Starter',
      price: 12,
      daily: 10,
      monthly: 50,
    },
    starter: {
      name: 'Pro',
      price: 29,
      daily: 50,
      monthly: 200,
    },
    pro: {
      name: 'Team',
      price: 99,
      daily: 250,
      monthly: 1000,
    }
  };

  const nextTier = tiers[currentTier] || tiers.free;
  const usedCount = usage.limit - usage.remaining;

  // Format reset date
  const formatResetDate = (dateString) => {
    if (!dateString) return 'soon';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'in less than 1 hour';
    if (diffHours < 24) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;

    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <div
      className={`
        relative overflow-hidden
        bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 border-l-yellow-500 dark:border-l-yellow-400 rounded-lg shadow-sm
        ${isExiting ? 'animate-fade-out' : 'animate-slide-in-fade'}
        motion-reduce:animate-none
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Usage alert: ${usedCount} of ${usage.limit} documents used, ${usage.remaining} remaining`}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Usage Alert
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                You've used <strong className="font-semibold">{usedCount} of {usage.limit}</strong> documents this month.{' '}
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {usage.remaining} remaining
                </span>
              </p>
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 dark:focus-visible:ring-yellow-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
              aria-label="Dismiss usage warning"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-3">
            <span>
              Quota resets {formatResetDate(usage.resetDate)}
            </span>
          </div>

          {/* CTA Section */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex-1">
              <p className="text-xs text-slate-700 dark:text-slate-300 mb-1">
                <strong className="font-semibold">Need more?</strong> Get {Math.floor(nextTier[usage.period || 'monthly'] / usage.limit)}x more with {nextTier.name} ({nextTier[usage.period || 'monthly']} docs/month)
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Just ${nextTier.price}/month
              </p>
            </div>

            <button
              type="button"
              onClick={onUpgrade}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
            >
              Upgrade
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
