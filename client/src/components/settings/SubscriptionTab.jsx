import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { CreditCard, TrendingUp, Calendar, ExternalLink, Check } from 'lucide-react';

const TIER_INFO = {
  FREE: {
    name: 'Free',
    color: 'slate',
    features: ['10 docs/month', 'All documentation types', 'Basic support'],
  },
  STARTER: {
    name: 'Starter',
    color: 'purple',
    features: ['100 docs/month', 'Priority support', 'Advanced features'],
  },
  TEAM: {
    name: 'Team',
    color: 'indigo',
    features: ['500 docs/month', 'Team collaboration', 'Premium support'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    color: 'blue',
    features: ['Unlimited docs', 'Dedicated support', 'Custom features'],
  },
};

export function SubscriptionTab() {
  const { user } = useAuth();
  const { usage, getUsageForPeriod } = useUsageTracking();
  const navigate = useNavigate();
  const [isManaging, setIsManaging] = useState(false);

  const currentTier = (user?.tier || 'FREE').toUpperCase();
  const tierInfo = TIER_INFO[currentTier] || TIER_INFO.FREE;
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
    <div className="space-y-8">
      {/* Current Plan */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" aria-hidden="true" />
              Current Plan
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Your subscription tier and included features
            </p>
          </div>
          {currentTier === 'FREE' && (
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {tierInfo.name}
            </h3>
            {currentTier !== 'FREE' && (
              <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                Active
              </span>
            )}
          </div>

          <ul className="space-y-2.5">
            {tierInfo.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
            Usage This Month
          </h2>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Track your document generation usage
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          {usage ? (
            <>
              {/* Usage Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Documents Generated
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {usage.monthly || 0} / {monthlyUsage?.limit || 10} ({monthlyUsage?.percentage || 0}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
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

                {/* Warning text when approaching limits */}
                {(monthlyUsage?.percentage || 0) >= 80 && (monthlyUsage?.percentage || 0) < 100 && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>You're using {monthlyUsage.percentage}% of your monthly quota</span>
                  </p>
                )}
                {(monthlyUsage?.percentage || 0) >= 100 && (
                  <p className="text-sm text-red-700 dark:text-red-400 mt-2 flex items-center gap-1">
                    <span>🚫</span>
                    <span>You've reached your monthly limit</span>
                  </p>
                )}
              </div>

              {/* Reset Date */}
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>
                  Usage resets on{' '}
                  {monthlyUsage?.resetDate
                    ? new Date(monthlyUsage.resetDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'the 1st of next month'}
                </span>
              </div>

              {/* Upgrade CTA if approaching limit */}
              {currentTier === 'FREE' && (monthlyUsage?.percentage || 0) >= 80 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    You're running low on documents this month. Upgrade to get more!
                  </p>
                  <button
                    onClick={handleUpgrade}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    View Upgrade Options
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">Loading usage data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Billing Portal Link */}
      {currentTier !== 'FREE' && (
        <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ExternalLink className="w-5 h-5" aria-hidden="true" />
              Billing & Invoices
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Manage your subscription and billing details
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Access your billing history, update payment methods, and download invoices through the Stripe customer portal.
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={isManaging}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span>{isManaging ? 'Opening...' : 'Open Billing Portal'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
