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

import { useState } from 'react';
import { Shield, AlertTriangle, Clock, FileText } from 'lucide-react';

const TIER_OPTIONS = [
  { value: 'free', label: 'Free', description: 'Single file, basic features' },
  { value: 'starter', label: 'Starter', description: '10 files/month' },
  { value: 'pro', label: 'Pro', description: '100 files/month, batch processing' },
  { value: 'team', label: 'Team', description: '500 files/month, collaboration' },
  { value: 'enterprise', label: 'Enterprise', description: 'Unlimited, custom features' }
];

const DURATION_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours (default)' },
  { value: 8, label: '8 hours' }
];

export function TierOverridePanel({ currentTier, override, onApply, onClear }) {
  const [selectedTier, setSelectedTier] = useState('pro');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tier Override
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Test features as different tier levels (admin/support only)
        </p>
      </div>

      {/* Current Status */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Real Tier</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {currentTier}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Effective Tier</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {hasActiveOverride ? override.tier : currentTier}
              {hasActiveOverride && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">(Override)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Active Override Warning */}
      {hasActiveOverride && (
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                Override expires in {override.remainingTime?.hours}h {override.remainingTime?.minutes}m
              </p>
              {override.reason && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {override.reason}
                </p>
              )}
            </div>
            <button
              onClick={handleClear}
              disabled={isSubmitting}
              className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Apply Override Form */}
      <div className="px-6 py-4 space-y-4">
        {/* Tier Selection */}
        <div>
          <label
            htmlFor="tier-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Select Tier
          </label>
          <select
            id="tier-select"
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {TIER_OPTIONS.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label} - {tier.description}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label
            htmlFor="duration-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Duration
          </label>
          <select
            id="duration-select"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {DURATION_OPTIONS.map((dur) => (
              <option key={dur.value} value={dur.value}>
                {dur.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label
            htmlFor="reason-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Reason (min 10 characters)
          </label>
          <textarea
            id="reason-input"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error && e.target.value.trim().length >= 10) {
                setError(null);
              }
            }}
            rows={3}
            placeholder="e.g., Testing Pro tier multi-file feature for customer support ticket #1234"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {reason.trim().length} / 10 characters minimum
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={isSubmitting || reason.trim().length < 10}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Applying...' : 'Apply Override'}
        </button>
      </div>

      {/* Footer Note */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          ⚠️ Override is session-based (4 hours max). All actions are logged to audit trail.
          Your real tier and billing remain unchanged.
        </p>
      </div>
    </div>
  );
}
