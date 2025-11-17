/**
 * TierOverrideBanner Component
 *
 * Displays a prominent banner when admin/support user has an active tier override.
 * Shows override tier, remaining time, and quick clear action.
 *
 * Features:
 * - Amber warning theme (distinguishable from other banners)
 * - Real-time countdown of remaining time
 * - One-click clear action
 * - Auto-hide when override expires
 * - Accessible with ARIA labels
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function TierOverrideBanner({ override, onClear }) {
  const [remainingTime, setRemainingTime] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  // Calculate remaining time
  useEffect(() => {
    if (!override || !override.expiresAt) {
      setIsVisible(false);
      return;
    }

    const updateRemainingTime = () => {
      const now = new Date();
      const expiry = new Date(override.expiresAt);
      const remainingMs = expiry.getTime() - now.getTime();

      // Hide banner if expired
      if (remainingMs <= 0) {
        setIsVisible(false);
        return;
      }

      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      setRemainingTime({ hours, minutes });
    };

    // Update immediately
    updateRemainingTime();

    // Update every minute
    const interval = setInterval(updateRemainingTime, 60000);

    return () => clearInterval(interval);
  }, [override]);

  const handleClear = async () => {
    if (onClear) {
      await onClear();
    }
    setIsVisible(false);
  };

  if (!isVisible || !override) {
    return null;
  }

  const timeText = remainingTime
    ? `${remainingTime.hours}h ${remainingTime.minutes}m remaining`
    : 'Calculating...';

  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <AlertTriangle
          className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
            Tier Override Active
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Currently viewing as{' '}
            <span className="font-semibold capitalize">{override.tier}</span> tier
            {' • '}
            {timeText}
          </p>
          {override.reason && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Reason: {override.reason}
            </p>
          )}
        </div>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label="Clear tier override"
        >
          <X className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </button>
      </div>
    </div>
  );
}
