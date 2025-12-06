import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTrial } from '../../contexts/TrialContext';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { formatDateCompact } from '../../utils/formatters';
import { getEffectiveTier } from '../../utils/tierFeatures';
import { CreditCard, TrendingUp, Calendar, ExternalLink, Check, Clock, Shield } from 'lucide-react';

const TIER_INFO = {
  FREE: {
    name: 'Free',
    features: ['10 docs/month', 'All documentation types', 'Basic support'],
  },
  STARTER: {
    name: 'Starter',
    features: ['100 docs/month', 'Priority support', 'Advanced features'],
  },
  PRO: {
    name: 'Pro',
    features: ['Unlimited docs', 'Multi-file processing', 'Priority support'],
  },
  TEAM: {
    name: 'Team',
    features: ['Unlimited docs', 'Team collaboration', 'Premium support'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    features: ['Unlimited docs', 'Dedicated support', 'Custom features'],
  },
};

export function SubscriptionTab() {
  const { user } = useAuth();
  const { isOnTrial, trialTier, daysRemaining, trialEndsAt } = useTrial();
  const { usage, getUsageForPeriod } = useUsageTracking();
  const navigate = useNavigate();
  const [isManaging, setIsManaging] = useState(false);

  const currentTier = (user?.tier || 'FREE').toUpperCase();
  const effectiveTier = getEffectiveTier(user);

  // Check admin status and tier override
  const isAdmin = ['admin', 'support', 'super_admin'].includes(user?.role);
  const hasAdminOverride = isAdmin && user?.effectiveTier && user.effectiveTier !== user.tier;
  // Admins get unlimited usage by role (separate from tier override)
  const hasUnlimitedAccess = isAdmin;

  // For trial users or admin override, show effective tier info
  const displayTier = isOnTrial
    ? (trialTier || 'PRO').toUpperCase()
    : hasAdminOverride
      ? effectiveTier.toUpperCase()
      : currentTier;
  const tierInfo = TIER_INFO[displayTier] || TIER_INFO.FREE;
  const monthlyUsage = getUsageForPeriod('monthly');

  const handleManageSubscription = async () => {
    setIsManaging(true);

    try {
      // TODO: Create Stripe billing portal session
      // const response = await fetch(`${API_URL}/api/payments/create-portal-session`, {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${getToken()}` },
      // });
      // const { url } = await response.json();
      // window.location.href = url;

      // For now, just show a toast
      console.log('Manage subscription clicked');
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setIsManaging(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <div className="space-y-6">
      {/* Usage limit warning - shown at top for visibility */}
      {currentTier === 'FREE' && !hasUnlimitedAccess && (monthlyUsage?.percentage || 0) >= 80 && (
        <div className={`flex items-center justify-between gap-4 p-4 rounded-lg border ${
          (monthlyUsage?.percentage || 0) >= 100
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
        }`}>
          <p className={`text-sm ${
            (monthlyUsage?.percentage || 0) >= 100
              ? 'text-red-800 dark:text-red-200'
              : 'text-amber-800 dark:text-amber-200'
          }`}>
            {(monthlyUsage?.percentage || 0) >= 100
              ? "You've reached your monthly limit. Upgrade to continue generating documentation."
              : `You've used ${monthlyUsage?.percentage || 0}% of your monthly limit.`}
          </p>
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Current Plan */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" aria-hidden="true" />
            Current Plan
          </h2>
          {currentTier === 'FREE' && (
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {tierInfo.name}
          </h3>
          {isOnTrial ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Trial ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left)
              </span>
            </div>
          ) : hasAdminOverride ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full">
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Admin Override
              </span>
            </div>
          ) : hasUnlimitedAccess ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-full">
              <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">
                Unlimited Access
              </span>
            </div>
          ) : currentTier !== 'FREE' && (
            <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
              Active
            </span>
          )}
        </div>

        {/* Trial info banner */}
        {isOnTrial && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You're currently on a <span className="font-semibold">{trialTier || 'Pro'}</span> trial.
              {trialEndsAt && (
                <> Your trial ends on <span className="font-semibold">{formatDateCompact(trialEndsAt)}</span>.</>
              )}
              {' '}Upgrade to keep your access after the trial ends.
            </p>
          </div>
        )}

        {/* Admin override info banner */}
        {hasAdminOverride && !isOnTrial && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You have an admin tier override active. You're viewing the app as a{' '}
              <span className="font-semibold capitalize">{effectiveTier}</span> user.
              Your actual plan is <span className="font-semibold capitalize">{user?.tier || 'Free'}</span>.
              Usage limits reflect the override tier.
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {tierInfo.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Usage This Month */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" aria-hidden="true" />
          Usage This Month
        </h2>

        {usage ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Documents Generated
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {hasUnlimitedAccess
                  ? <>{usage.monthly || 0} / <span className="text-lg">∞</span></>
                  : <>{usage.monthly || 0} / {monthlyUsage?.limit || 10}</>
                }
              </span>
            </div>

            {/* Progress Bar - hidden for unlimited access */}
            {!hasUnlimitedAccess && (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (monthlyUsage?.percentage || 0) >= 100
                      ? 'bg-red-600'
                      : (monthlyUsage?.percentage || 0) >= 80
                      ? 'bg-yellow-500'
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${Math.min(monthlyUsage?.percentage || 0, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={monthlyUsage?.percentage || 0}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="Monthly usage progress"
                />
              </div>
            )}

            {/* Reset Date */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  Resets{' '}
                  {monthlyUsage?.resetDate
                    ? formatDateCompact(monthlyUsage.resetDate)
                    : 'next month'}
                </span>
              </div>
              {!hasUnlimitedAccess && (
                <span className="font-medium">{monthlyUsage?.percentage || 0}% used</span>
              )}
            </div>

          </>
        ) : (
          <div className="flex items-center gap-2 py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Loading usage...</span>
          </div>
        )}
      </div>

      {/* Billing & Invoices */}
      {currentTier !== 'FREE' && (
        <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <ExternalLink className="w-5 h-5" aria-hidden="true" />
            Billing & Invoices
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            Manage payment methods, view invoices, and update subscription details.
          </p>
          <button
            onClick={handleManageSubscription}
            disabled={isManaging}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            <span>{isManaging ? 'Opening...' : 'Open Billing Portal'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
