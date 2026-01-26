/**
 * EligibilityError Component
 * Reusable component for displaying trial eligibility errors with contextual messaging and actions
 */

import { AlertTriangle, Clock, Users, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/**
 * EligibilityError Component
 * @param {Object} props
 * @param {string} props.errorCode - Error code (NEW_USERS_ONLY, COOLDOWN_PERIOD, MAX_TRIALS_REACHED, ACTIVE_TRIAL_EXISTS)
 * @param {string} props.error - Error message
 * @param {Object} [props.details] - Additional error details
 * @param {Function} [props.onClose] - Optional close handler
 */
export default function EligibilityError({ errorCode, error, details = {}, onClose }) {
  // NEW_USERS_ONLY: Trial Program is for new users only
  if (errorCode === 'NEW_USERS_ONLY') {
    return (
      <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              This campaign is for new users only
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
              You've already used a trial. This campaign is designed for users who haven't experienced our premium
              features yet.
            </p>
            {details.lastTrialEndedAt && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">
                Your last trial ended on {formatDate(details.lastTrialEndedAt)}.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                View Paid Plans
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  // COOLDOWN_PERIOD: User needs to wait before getting another trial
  if (errorCode === 'COOLDOWN_PERIOD') {
    const daysRemaining = details.daysRemaining || 0;
    const lastTrialEnd = details.lastTrialEndedAt ? formatDate(details.lastTrialEndedAt) : 'recently';

    return (
      <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Trial available in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
              You've already used a trial that ended {lastTrialEnd}. This campaign requires a cooldown period before
              you can redeem another trial.
            </p>
            {details.daysSinceLastTrial !== undefined && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">
                It's been {details.daysSinceLastTrial} day{details.daysSinceLastTrial !== 1 ? 's' : ''} since your last
                trial ended.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Upgrade Now for Immediate Access
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAX_TRIALS_REACHED: User has hit the lifetime trial limit
  if (errorCode === 'MAX_TRIALS_REACHED') {
    const trialCount = details.trialCount || 0;

    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Ban className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">Trial limit reached</h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              You've already used {trialCount} trial{trialCount !== 1 ? 's' : ''}. To continue accessing premium
              features, please upgrade to a paid plan.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE_TRIAL_EXISTS: User already has an active trial
  if (errorCode === 'ACTIVE_TRIAL_EXISTS') {
    const activeTrial = details.activeTrial || {};

    return (
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              You already have an active trial
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              You're currently on a {activeTrial.tier || 'trial'} trial. You can't redeem another trial code until your
              current trial expires.
            </p>
            {activeTrial.endsAt && (
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
                Your trial expires on {formatDate(activeTrial.endsAt)}.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/usage"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                View Trial Status
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for unknown error codes
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">Unable to redeem trial</h3>
          <p className="text-sm text-red-800 dark:text-red-200 mb-4">
            {error || 'An error occurred while redeeming your trial code.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              View Pricing
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
