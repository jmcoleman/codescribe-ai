/**
 * TierOverridePanel Component
 *
 * Admin/Support control panel for applying and managing tier overrides.
 * Accessible from user profile dropdown or admin dashboard.
 *
 * Features:
 * - Tier selection dropdown (all 5 tiers)
 * - Reason input with validation (min 10 characters)
 * - Duration selector (1h, 2h, 4h, 8h)
 * - Current status display
 * - Clear override action
 * - Audit log preview
 */

import { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Select } from './Select';

const TIER_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
  { value: 'enterprise', label: 'Enterprise' }
];

const DURATION_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 8, label: '8 hours' }
];

export function TierOverridePanel({ currentTier, override, onApply, onClear }) {
  const [selectedTier, setSelectedTier] = useState('pro');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Reset exit animation when banner appears
  useEffect(() => {
    if (showSuccessBanner) {
      setIsExiting(false);
    }
  }, [showSuccessBanner]);

  const handleDismissBanner = () => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      setShowSuccessBanner(false);
      setIsExiting(false);
    }, 200); // Match exit animation duration (200ms)
  };

  const handleApply = async () => {
    // Validate reason
    if (!reason || reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onApply({
        targetTier: selectedTier,
        reason: reason.trim(),
        hoursValid: duration
      });

      // Show success banner
      setShowSuccessBanner(true);

      // Reset form on success
      setReason('');
    } catch (err) {
      setError(err.message || 'Failed to apply tier override');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    setIsSubmitting(true);
    setError(null);
    setShowSuccessBanner(false); // Hide success banner when clearing

    try {
      await onClear();
    } catch (err) {
      setError(err.message || 'Failed to clear tier override');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveOverride = override && override.active;

  return (
    <div>
      {/* Header */}
      <div className={`flex items-start gap-3 ${hasActiveOverride ? 'mb-6' : 'mb-4'}`}>
        <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Tier Override
          </h2>
          {hasActiveOverride && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Viewing As:</span>{' '}
              <span className="font-medium text-amber-600 dark:text-amber-400 capitalize">{override.tier}</span>
              {' '}(expires in {override.remainingTime?.hours}h {override.remainingTime?.minutes}m)
            </p>
          )}
        </div>
        {hasActiveOverride && (
          <button
            onClick={handleClear}
            disabled={isSubmitting}
            className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Success Banner - with slide + fade animation */}
      {showSuccessBanner && hasActiveOverride && (
        <div
          className={`
            flex items-center justify-between gap-3 p-3
            bg-green-50 dark:bg-green-900/20
            border-l-4 border-l-green-500 dark:border-l-green-400
            border border-green-200 dark:border-green-800
            rounded-lg text-sm text-green-700 dark:text-green-300 mb-4
            transition-all duration-200
            ${isExiting
              ? 'opacity-0 translate-y-[-8px]'
              : 'opacity-100 translate-y-0 animate-slideDown'
            }
          `}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>
              Tier override applied successfully. You're now viewing as <span className="font-medium capitalize">{override.tier}</span> for {override.remainingTime?.hours}h {override.remainingTime?.minutes}m.
            </span>
          </div>
          <button
            onClick={handleDismissBanner}
            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex-shrink-0"
            aria-label="Dismiss success message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Compact Form */}
      <div className="space-y-3">
        {/* Tier & Duration in one row */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tier"
            options={TIER_OPTIONS}
            value={selectedTier}
            onChange={setSelectedTier}
            ariaLabel="Select tier to override"
          />
          <Select
            label="Duration"
            options={DURATION_OPTIONS}
            value={duration}
            onChange={setDuration}
            ariaLabel="Select override duration"
          />
        </div>

        {/* Reason */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="reason-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Reason
            </label>
            <span className={`text-xs ${
              reason.trim().length >= 10
                ? 'text-green-600 dark:text-green-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {reason.trim().length}/10 min
            </span>
          </div>
          <input
            type="text"
            id="reason-input"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error && e.target.value.trim().length >= 10) {
                setError(null);
              }
            }}
            placeholder="Testing multi-file feature..."
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-left text-slate-600 dark:text-slate-400">
            Briefly describe why you need to view as this tier (logged for security audit)
          </p>
        </div>

        {/* Apply Button */}
        <div className="flex justify-end">
          <button
            onClick={handleApply}
            disabled={isSubmitting || reason.trim().length < 10}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              'Apply Override'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
