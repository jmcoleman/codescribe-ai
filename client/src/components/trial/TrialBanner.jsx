/**
 * TrialBanner Component
 *
 * Displays a banner showing trial status when user has an active trial.
 * Shows days remaining with visual urgency for low days.
 *
 * Features:
 * - Purple/indigo brand theme (distinguishes from other banners)
 * - Warning state when <= 3 days remaining
 * - Upgrade CTA
 * - Dismissable with session persistence
 * - Accessible with ARIA labels
 */

import { useState, useEffect } from 'react';
import { Sparkles, Clock, X, ArrowRight } from 'lucide-react';
import { useTrial } from '../../contexts/TrialContext';
import { formatDateCompact } from '../../utils/formatters';

export function TrialBanner({ onUpgrade, onDismiss }) {
  const { isOnTrial, trialTier, daysRemaining, trialEndsAt } = useTrial();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check session storage for dismissed state
  useEffect(() => {
    const dismissed = sessionStorage.getItem('cs_trial_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('cs_trial_banner_dismissed', 'true');
    onDismiss?.();
  };

  // Don't show if not on trial or dismissed
  if (!isOnTrial || isDismissed) {
    return null;
  }

  // Determine urgency level
  const isUrgent = daysRemaining !== null && daysRemaining <= 3;
  const isExpiringSoon = daysRemaining === 1;

  // Format expiry date
  const formattedExpiry = trialEndsAt
    ? formatDateCompact(trialEndsAt)
    : null;

  // Dynamic styling based on urgency
  const bannerClasses = isUrgent
    ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500'
    : 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500';

  const iconClasses = isUrgent
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-purple-600 dark:text-purple-400';

  const textClasses = isUrgent
    ? 'text-amber-900 dark:text-amber-100'
    : 'text-purple-900 dark:text-purple-100';

  const buttonClasses = isUrgent
    ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
    : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500';

  const dismissButtonClasses = isUrgent
    ? 'hover:bg-amber-100 dark:hover:bg-amber-800/30 focus:ring-amber-500'
    : 'hover:bg-purple-100 dark:hover:bg-purple-800/30 focus:ring-purple-500';

  // Build days remaining text
  const getDaysText = () => {
    if (daysRemaining === null) return '';
    if (daysRemaining === 0) return 'Trial expires today';
    if (daysRemaining === 1) return '1 day remaining';
    return `${daysRemaining} days remaining`;
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${bannerClasses} p-4`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {isUrgent ? (
          <Clock
            className={`w-5 h-5 ${iconClasses} flex-shrink-0 mt-0.5`}
            aria-hidden="true"
          />
        ) : (
          <Sparkles
            className={`w-5 h-5 ${iconClasses} flex-shrink-0 mt-0.5`}
            aria-hidden="true"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${textClasses}`}>
            {isExpiringSoon ? (
              <>
                <span className="font-semibold">Trial Expires Tomorrow!</span>{' '}
                Upgrade now to keep your {trialTier || 'Pro'} features.
              </>
            ) : isUrgent ? (
              <>
                <span className="font-semibold">Trial Ending Soon:</span>{' '}
                {getDaysText()}.{' '}
                {formattedExpiry && (
                  <span className="text-amber-700 dark:text-amber-300">
                    (Expires {formattedExpiry})
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="font-semibold">Pro Trial Active:</span>{' '}
                {getDaysText()}.{' '}
                Enjoying the experience? Upgrade to keep all features.
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Upgrade Button */}
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className={`${buttonClasses} text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-1.5`}
            >
              Upgrade
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className={`p-1.5 rounded-lg ${dismissButtonClasses} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
            aria-label="Dismiss trial banner"
          >
            <X className={`w-5 h-5 ${iconClasses}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrialBanner;
