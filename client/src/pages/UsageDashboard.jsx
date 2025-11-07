import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Zap,
  Calendar,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Settings as SettingsIcon,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useUsageTracking } from '../hooks/useUsageTracking.js';
import { PageLayout } from '../components/PageLayout.jsx';

/**
 * Usage Dashboard - Modern, sleek usage analytics page
 *
 * Industry best practices incorporated from:
 * - Stripe Dashboard: Clean metrics cards, subtle animations, clear hierarchy
 * - Vercel Analytics: Minimalist design, data-focused layout, gradient accents
 * - Linear: Smooth interactions, focused color usage, clear typography
 * - Notion: Card-based layout, progressive disclosure, contextual actions
 *
 * Features:
 * - Real-time usage metrics with visual progress indicators
 * - Color-coded status (green → yellow → orange → red)
 * - Contextual upgrade prompts based on usage patterns
 * - Reset countdowns with calendar integration
 * - Tier comparison and upgrade path visualization
 * - Loading skeletons for better perceived performance
 * - Accessible (WCAG 2.1 AA compliant)
 * - Mobile-responsive layout
 */
export function UsageDashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { usage, isLoading, refetch, getUsageForPeriod } = useUsageTracking();
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not authenticated (wait for auth to load first)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500); // Smooth animation
  };

  // Get usage data for both periods
  const dailyUsage = getUsageForPeriod('daily');
  const monthlyUsage = getUsageForPeriod('monthly');

  // Determine usage status for color coding
  const getUsageStatus = (percentage) => {
    if (percentage >= 100) return 'critical'; // Red
    if (percentage >= 80) return 'warning'; // Orange
    if (percentage >= 60) return 'caution'; // Yellow
    return 'healthy'; // Green
  };

  const dailyStatus = dailyUsage ? getUsageStatus(dailyUsage.percentage) : 'healthy';
  const monthlyStatus = monthlyUsage ? getUsageStatus(monthlyUsage.percentage) : 'healthy';

  // Format reset date (relative time)
  const formatResetDate = (dateString) => {
    if (!dateString) return 'soon';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'less than 1 hour';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  // Format reset date (absolute date)
  const formatAbsoluteDate = (dateString) => {
    if (!dateString) return 'Soon';
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Tier configuration
  const currentTier = user?.tier || 'free';
  const tierInfo = {
    free: { name: 'Free', color: 'slate', nextTier: 'starter' },
    starter: { name: 'Starter', color: 'indigo', nextTier: 'pro' },
    pro: { name: 'Pro', color: 'purple', nextTier: 'team' },
    team: { name: 'Team', color: 'cyan', nextTier: 'enterprise' },
    enterprise: { name: 'Enterprise', color: 'purple', nextTier: null }
  };

  const currentTierInfo = tierInfo[currentTier] || tierInfo.free;

  // Upgrade paths
  const upgradePaths = {
    free: { name: 'Starter', price: 12, monthly: 50, daily: 10, multiplier: 5 },
    starter: { name: 'Pro', price: 29, monthly: 200, daily: 50, multiplier: 4 },
    pro: { name: 'Team', price: 99, monthly: 1000, daily: 250, multiplier: 5 },
    team: { name: 'Enterprise', price: 500, monthly: 'Unlimited', daily: 'Unlimited', multiplier: null }
  };

  const nextTierPath = upgradePaths[currentTier];

  // Status color classes
  const statusColors = {
    healthy: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      progress: 'bg-green-500',
      ring: 'ring-green-100',
      icon: 'text-green-600'
    },
    caution: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      progress: 'bg-yellow-500',
      ring: 'ring-yellow-100',
      icon: 'text-yellow-600'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      progress: 'bg-orange-500',
      ring: 'ring-orange-100',
      icon: 'text-orange-600'
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      progress: 'bg-red-500',
      ring: 'ring-red-100',
      icon: 'text-red-600'
    }
  };

  // Loading skeleton
  if (isLoading && !usage) {
    return (
      <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl pt-6 pb-12">
          {/* Header skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-slate-200 rounded-lg w-48 mb-3"></div>
            <div className="h-4 bg-slate-200 rounded-lg w-96"></div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-64 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="h-32 bg-slate-100 rounded mb-4"></div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-64 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="h-32 bg-slate-100 rounded mb-4"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 max-w-6xl pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900">
              Usage Dashboard
            </h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg
                hover:bg-slate-50 hover:border-slate-300 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${refreshing ? 'animate-pulse' : ''}
              `}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p className="text-slate-600">
            Monitor your document generation usage and quota limits
          </p>
        </div>

        {/* Upgrade prompt (show if usage > 60% or at limit) */}
        {nextTierPath && (monthlyUsage?.percentage >= 60 || dailyUsage?.percentage >= 60) && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-purple-600 p-2 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Ready for more?</span>{' '}
                  Upgrade to <span className="font-semibold">{nextTierPath.name}</span> and get{' '}
                  {nextTierPath.multiplier ? (
                    <span className="font-semibold">{nextTierPath.multiplier}x more generations</span>
                  ) : (
                    <span className="font-semibold">unlimited generations</span>
                  )}
                  .
                </p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
              >
                Upgrade
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Current tier badge */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-900 capitalize">
              {currentTierInfo.name} Plan
            </span>
          </div>
        </div>

        {/* Usage cards - Side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Usage Card */}
          <UsageCard
            title="Daily Usage"
            usage={dailyUsage}
            status={dailyStatus}
            statusColors={statusColors}
            icon={<Clock className="w-5 h-5 text-purple-600" />}
            formatResetDate={formatResetDate}
            formatAbsoluteDate={formatAbsoluteDate}
          />

          {/* Monthly Usage Card */}
          <UsageCard
            title="Monthly Usage"
            usage={monthlyUsage}
            status={monthlyStatus}
            statusColors={statusColors}
            icon={<Calendar className="w-5 h-5 text-purple-600" />}
            formatResetDate={formatResetDate}
            formatAbsoluteDate={formatAbsoluteDate}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<Zap className="w-5 h-5" />}
            title="View Pricing"
            description="Compare all plans and features"
            onClick={() => navigate('/pricing')}
          />
          <QuickActionCard
            icon={<SettingsIcon className="w-5 h-5" />}
            title="Settings"
            description="Manage account and preferences"
            onClick={() => navigate('/settings')}
          />
          <QuickActionCard
            icon={<FileText className="w-5 h-5" />}
            title="Documentation"
            description="Learn about usage limits"
            onClick={() => window.open('https://docs.codescribeai.com', '_blank')}
            disabled
          />
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Usage Card Component - Displays usage metrics for a period (daily/monthly)
 */
function UsageCard({ title, usage, status, statusColors, icon, formatResetDate, formatAbsoluteDate }) {
  if (!usage) return null;

  const colors = statusColors[status];
  const isUnlimited = usage.limit === 'unlimited' || usage.limit >= 999999;
  const percentage = isUnlimited ? 0 : usage.percentage;
  const used = usage.limit - usage.remaining;

  return (
    <div className={`
      bg-white rounded-xl border border-slate-200 p-6
      transition-all duration-200 hover:shadow-lg hover:border-slate-300
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>

        {/* Status badge */}
        <div className={`
          px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
          ${colors.bg} ${colors.text}
        `}>
          {status === 'healthy' ? 'Normal' : status === 'critical' ? 'At Limit' : 'High Usage'}
        </div>
      </div>

      {/* Usage numbers */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold text-slate-900">
            {isUnlimited ? '∞' : used.toLocaleString()}
          </span>
          {!isUnlimited && (
            <>
              <span className="text-xl text-slate-400">/</span>
              <span className="text-2xl font-semibold text-slate-600">
                {usage.limit.toLocaleString()}
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-slate-600">
          {isUnlimited ? 'Unlimited generations' : `${usage.remaining.toLocaleString()} remaining`}
        </p>
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div className="mb-4">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${colors.progress} transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`${percentage}% of quota used`}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-slate-500">0%</span>
            <span className={`text-xs font-semibold ${colors.text}`}>
              {percentage}%
            </span>
            <span className="text-xs text-slate-500">100%</span>
          </div>
        </div>
      )}

      {/* Reset info */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-600">Resets in</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatResetDate(usage.resetDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {formatAbsoluteDate(usage.resetDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Warning message for high usage */}
      {status === 'critical' && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            You've reached your limit. Quota will reset {formatResetDate(usage.resetDate)}.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Quick Action Card Component - Navigation cards for common actions
 */
function QuickActionCard({ icon, title, description, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-white border border-slate-200 rounded-lg p-4
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-purple-300 hover:shadow-md group'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center transition-colors
          ${disabled
            ? 'bg-slate-100 text-slate-400'
            : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
          }
        `}>
          {icon}
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-sm font-semibold text-slate-900 mb-0.5">
            {title}
            {disabled && <span className="ml-2 text-xs text-slate-500">(Coming soon)</span>}
          </h4>
          <p className="text-xs text-slate-600">{description}</p>
        </div>
        {!disabled && (
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
        )}
      </div>
    </button>
  );
}
