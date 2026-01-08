import { X, AlertTriangle, Zap, ArrowRight, Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { trackUsageAlert } from '../utils/analytics';

/**
 * Usage limit modal for 100% quota reached (hard limit)
 *
 * Blocks generation action when user has exhausted their quota.
 * Modal is appropriate here because the action will fail anyway (blocking state).
 *
 * Design: Based on ERROR-HANDLING-UX.md guidelines
 * - Modal for critical, workflow-blocking errors
 * - Red color scheme for limit reached state
 * - Focus trap and keyboard navigation (Esc to close)
 * - WCAG 2.1 AA compliant
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Called when user closes modal
 * @param {Object} props.usage - Usage data from API
 * @param {number} props.usage.limit - Total limit
 * @param {string} props.usage.period - 'daily' or 'monthly'
 * @param {string} props.usage.resetDate - ISO date string for reset
 * @param {string} props.currentTier - Current user tier
 * @param {Function} props.onUpgrade - Called when user clicks upgrade CTA
 */
export function UsageLimitModal({
  isOpen,
  onClose,
  usage,
  currentTier = 'free',
  onUpgrade
}) {
  const modalRef = useRef(null);
  const upgradeButtonRef = useRef(null);

  // Focus management - focus upgrade button when modal opens
  useEffect(() => {
    if (isOpen && upgradeButtonRef.current) {
      upgradeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Track when limit modal is shown (conversion funnel event)
  useEffect(() => {
    if (isOpen) {
      trackUsageAlert({
        action: 'limit_hit',
        tier: currentTier,
        percentUsed: 100,
        remaining: 0,
        limit: usage?.limit || 0,
        period: usage?.period,
      });
    }
  }, [isOpen, currentTier, usage]);

  // Keyboard navigation - Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap - keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  // Current tier limits (for calculating multiplier)
  const currentTierLimits = {
    free: { daily: 3, monthly: 10 },
    starter: { daily: 10, monthly: 50 },
    pro: { daily: 50, monthly: 200 }
  };

  // Tier upgrade paths
  const tiers = {
    free: {
      name: 'Starter',
      price: 12,
      daily: 10,
      monthly: 50,
      additionalFeatures: ['Priority support', 'No ads']
    },
    starter: {
      name: 'Pro',
      price: 29,
      daily: 50,
      monthly: 200,
      additionalFeatures: ['Custom templates', 'API access']
    },
    pro: {
      name: 'Team',
      price: 99,
      daily: 250,
      monthly: 1000,
      additionalFeatures: ['Team workspace', 'Slack integration']
    }
  };

  const nextTier = tiers[currentTier] || tiers.free;
  const currentLimits = currentTierLimits[currentTier] || currentTierLimits.free;

  // Calculate multiplier dynamically
  const monthlyMultiplier = Math.floor(nextTier.monthly / currentLimits.monthly);

  // Build features array dynamically
  const features = [
    `${nextTier.monthly.toLocaleString()} generations per month (${monthlyMultiplier}x more)`,
    `${nextTier.daily} generations per day`,
    ...nextTier.additionalFeatures
  ];

  // Format reset date with specific date
  const formatResetDate = (dateString, variant = 'modal') => {
    if (!dateString) return 'soon';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    // Format the specific date (e.g., "Jan 1")
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const specificDate = `${month} ${day}`;

    // For modal usage box - "Quota resets in X days"
    if (variant === 'modal') {
      if (diffHours < 1) return `in less than 1 hour`;
      if (diffHours < 24) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;

      const diffDays = Math.floor(diffHours / 24);
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }

    // For escape hatch - "on Nov 1"
    return `on ${specificDate}`;
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="usage-limit-modal-title"
      aria-describedby="usage-limit-modal-description"
    >
      <div
        ref={modalRef}
        className="modal-container max-w-2xl xl:max-w-3xl 2xl:max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-full ring-2 ring-red-200 dark:ring-red-500/50">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>

            {/* Title and close button */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 id="usage-limit-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Monthly Limit Reached
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="icon-btn interactive-scale-sm focus-ring-light"
                  aria-label="Close usage limit modal"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-5 space-y-4">
          {/* Description */}
          <div id="usage-limit-modal-description">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              You've reached your limit of <strong className="font-semibold">{usage?.limit || 10} documents</strong> this month.
            </p>

            {/* Limit reached indicator */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-900 dark:text-red-100">Current Usage</span>
                <span className="text-sm text-red-700 dark:text-red-300 font-semibold">
                  {usage?.limit || 0} / {usage?.limit || 0} documents
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-red-200 dark:bg-red-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-red-600 dark:bg-red-500 transition-all duration-300"
                  style={{ width: '100%' }}
                  role="progressbar"
                  aria-valuenow={100}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="100% of quota used"
                />
              </div>

              {/* Reset info */}
              <div className="flex items-center gap-2 mt-2 text-sm text-red-700 dark:text-red-300">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>
                  Quota resets {formatResetDate(usage?.resetDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4">
            <div className="flex items-start gap-2.5 mb-3">
              <div className="flex-shrink-0 bg-purple-600 dark:bg-purple-700 p-1.5 rounded-lg">
                <Zap className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                  Get {monthlyMultiplier}x more docs and unlock premium features
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upgrade to unlock more generations and premium features
                </p>
              </div>
            </div>

            {/* Features first */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3 border border-purple-100 dark:border-slate-700">
              {/* Features list */}
              <ul className="space-y-2 mb-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Pricing secondary */}
              <div className="pt-2 border-t border-purple-100 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Starting at <span className="text-base font-semibold text-slate-900 dark:text-slate-100">${nextTier.price}</span><span className="text-slate-600 dark:text-slate-400">/month</span>
                </p>
              </div>
            </div>

            {/* Action button */}
            <button
              ref={upgradeButtonRef}
              type="button"
              onClick={onUpgrade}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 hover:shadow-purple-600/30 dark:hover:shadow-purple-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Alternative actions */}
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1.5">
              Not ready to upgrade?
            </p>
            <button
              onClick={onClose}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-1 rounded px-2 py-1"
            >
              Wait for reset {formatResetDate(usage?.resetDate, false)}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 px-6 py-2.5 rounded-b-xl">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Current plan: <span className="font-medium capitalize">{currentTier}</span>
            {' • '}
            <a
              href="/pricing"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-1 rounded"
            >
              Compare all plans
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
