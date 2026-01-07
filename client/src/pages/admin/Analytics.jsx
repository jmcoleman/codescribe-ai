/**
 * Analytics Dashboard Page
 * Admin-only dashboard for viewing conversion funnel, business metrics, and usage patterns
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Table,
  ChartBar,
  Database,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/api';
import DateRangePicker from '../../components/admin/DateRangePicker';
import {
  ConversionFunnel,
  TrendChart,
  ComparisonBar,
  ScoreDistribution,
  formatNumber,
  formatCurrency,
  formatPercent,
} from '../../components/admin/charts';
import EventsTable from '../../components/admin/EventsTable';

// Tabs for the dashboard
const TABS = [
  { id: 'funnel', label: 'Conversion Funnel', icon: TrendingUp },
  { id: 'business', label: 'Business Metrics', icon: DollarSign },
  { id: 'usage', label: 'Usage Patterns', icon: BarChart3 },
  { id: 'events', label: 'Raw Events', icon: Database },
];

/**
 * Stats Card Component
 */
function StatsCard({ icon: Icon, label, value, subValue, trend, color = 'purple' }) {
  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {label}
          </div>
        </div>
        {trend !== undefined && (
          <div className={`text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      {subValue && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {subValue}
        </div>
      )}
    </div>
  );
}

/**
 * Chart Section Component with optional table toggle
 */
function ChartSection({ title, children, tableData, tableColumns }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {tableData && tableData.length > 0 && (
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            {showTable ? <ChartBar className="w-4 h-4" /> : <Table className="w-4 h-4" />}
            {showTable ? 'Show Chart' : 'Show Table'}
          </button>
        )}
      </div>

      {showTable && tableData ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {tableColumns.map((col) => (
                  <th key={col.key} className="text-left py-2 px-3 text-slate-600 dark:text-slate-400 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                  {tableColumns.map((col) => (
                    <td key={col.key} className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {col.format ? col.format(row[col.key]) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Main Analytics Dashboard Component
 */
export default function Analytics() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('funnel');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [excludeInternal, setExcludeInternal] = useState(true);

  // Default to last 30 days
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 1);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { startDate: start, endDate: end };
  });

  // Data state
  const [funnelData, setFunnelData] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState({});

  // Detect dark mode
  const isDark = useMemo(() => {
    return document.documentElement.classList.contains('dark');
  }, []);

  /**
   * Fetch data from API
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        excludeInternal: excludeInternal.toString(),
      });

      // Fetch data based on active tab
      const headers = { 'Authorization': `Bearer ${token}` };

      if (activeTab === 'funnel') {
        const [funnelRes, sessionsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/funnel?${params}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=sessions&interval=day`, { headers }),
        ]);

        if (!funnelRes.ok || !sessionsRes.ok) throw new Error('Failed to fetch funnel data');

        const funnel = await funnelRes.json();
        const sessions = await sessionsRes.json();

        setFunnelData(funnel.data);
        setTimeSeriesData((prev) => ({ ...prev, sessions: sessions.data }));
      } else if (activeTab === 'business') {
        const [businessRes, signupsRes, revenueRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/business?${params}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=signups&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=revenue&interval=day`, { headers }),
        ]);

        if (!businessRes.ok) throw new Error('Failed to fetch business data');

        const business = await businessRes.json();
        const signups = await signupsRes.json();
        const revenue = await revenueRes.json();

        setBusinessData(business.data);
        setTimeSeriesData((prev) => ({
          ...prev,
          signups: signups.data,
          revenue: revenue.data,
        }));
      } else if (activeTab === 'usage') {
        const [usageRes, generationsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/usage?${params}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=generations&interval=day`, { headers }),
        ]);

        if (!usageRes.ok) throw new Error('Failed to fetch usage data');

        const usage = await usageRes.json();
        const generations = await generationsRes.json();

        setUsageData(usage.data);
        setTimeSeriesData((prev) => ({ ...prev, generations: generations.data }));
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, dateRange, excludeInternal, activeTab]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track conversion funnel, business metrics, and usage patterns
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Exclude Internal Toggle */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={excludeInternal}
                  onChange={(e) => setExcludeInternal(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-600 dark:text-slate-400">
                  Exclude internal users
                </span>
              </label>

              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={setDateRange}
              />

              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={fetchData}
              className="ml-auto text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Funnel Tab */}
        {!loading && activeTab === 'funnel' && funnelData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                icon={Users}
                label="Total Sessions"
                value={formatNumber(funnelData.totalSessions)}
                color="purple"
              />
              <StatsCard
                icon={TrendingUp}
                label="Completed Sessions"
                value={formatNumber(funnelData.completedSessions)}
                subValue="Users who copied/downloaded docs"
                color="green"
              />
              <StatsCard
                icon={BarChart3}
                label="Overall Conversion"
                value={formatPercent(funnelData.overallConversion)}
                subValue="Session to completion rate"
                color="blue"
              />
              <StatsCard
                icon={TrendingUp}
                label="Input to Generation"
                value={formatPercent(funnelData.conversionRates?.code_input_to_generation_started || 0)}
                subValue="Code input to generation start"
                color="amber"
              />
            </div>

            {/* Funnel Chart */}
            <ChartSection title="Conversion Funnel">
              <ConversionFunnel data={funnelData} isDark={isDark} height={350} />
            </ChartSection>

            {/* Sessions Trend */}
            <ChartSection
              title="Sessions Over Time"
              tableData={timeSeriesData.sessions}
              tableColumns={[
                { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
                { key: 'value', label: 'Sessions', format: formatNumber },
              ]}
            >
              <TrendChart
                data={timeSeriesData.sessions}
                isDark={isDark}
                height={250}
                interval="day"
              />
            </ChartSection>
          </div>
        )}

        {/* Business Tab */}
        {!loading && activeTab === 'business' && businessData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                icon={Users}
                label="New Signups"
                value={formatNumber(businessData.signups)}
                color="purple"
              />
              <StatsCard
                icon={TrendingUp}
                label="Tier Upgrades"
                value={formatNumber(businessData.tierUpgrades)}
                color="green"
              />
              <StatsCard
                icon={DollarSign}
                label="Revenue"
                value={formatCurrency(businessData.revenueCents)}
                color="blue"
              />
              <StatsCard
                icon={AlertCircle}
                label="Cancellations"
                value={formatNumber(businessData.cancellations)}
                color="amber"
              />
            </div>

            {/* Signups Trend */}
            <ChartSection
              title="New Signups Over Time"
              tableData={timeSeriesData.signups}
              tableColumns={[
                { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
                { key: 'value', label: 'Signups', format: formatNumber },
              ]}
            >
              <TrendChart
                data={timeSeriesData.signups}
                isDark={isDark}
                height={250}
                interval="day"
                color={isDark ? '#4ade80' : '#22c55e'}
              />
            </ChartSection>

            {/* Revenue Trend */}
            <ChartSection
              title="Revenue Over Time"
              tableData={timeSeriesData.revenue}
              tableColumns={[
                { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
                { key: 'value', label: 'Revenue', format: formatCurrency },
              ]}
            >
              <TrendChart
                data={timeSeriesData.revenue}
                isDark={isDark}
                height={250}
                interval="day"
                valueType="currency"
                color={isDark ? '#60a5fa' : '#3b82f6'}
              />
            </ChartSection>

            {/* Upgrades by Tier */}
            {businessData.upgradesByTier && Object.keys(businessData.upgradesByTier).length > 0 && (
              <ChartSection title="Upgrades by Tier">
                <ComparisonBar
                  data={Object.entries(businessData.upgradesByTier).map(([tier, count]) => ({
                    name: tier.charAt(0).toUpperCase() + tier.slice(1),
                    value: count,
                  }))}
                  isDark={isDark}
                  height={200}
                  horizontal={false}
                />
              </ChartSection>
            )}
          </div>
        )}

        {/* Usage Tab */}
        {!loading && activeTab === 'usage' && usageData && (
          <div className="space-y-6">
            {/* Batch vs Single Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                icon={BarChart3}
                label="Single Generations"
                value={formatNumber(usageData.batchVsSingle?.single || 0)}
                color="purple"
              />
              <StatsCard
                icon={BarChart3}
                label="Batch Generations"
                value={formatNumber(usageData.batchVsSingle?.batch || 0)}
                color="green"
              />
              <StatsCard
                icon={BarChart3}
                label="Batch Ratio"
                value={formatPercent(
                  usageData.batchVsSingle
                    ? (usageData.batchVsSingle.batch /
                        (usageData.batchVsSingle.batch + usageData.batchVsSingle.single || 1)) *
                        100
                    : 0
                )}
                subValue="Batch as % of all generations"
                color="blue"
              />
            </div>

            {/* Generations Trend */}
            <ChartSection
              title="Generations Over Time"
              tableData={timeSeriesData.generations}
              tableColumns={[
                { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
                { key: 'value', label: 'Generations', format: formatNumber },
              ]}
            >
              <TrendChart
                data={timeSeriesData.generations}
                isDark={isDark}
                height={250}
                interval="day"
              />
            </ChartSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Doc Types */}
              <ChartSection
                title="Documentation Types"
                tableData={usageData.docTypes}
                tableColumns={[
                  { key: 'type', label: 'Doc Type' },
                  { key: 'count', label: 'Count', format: formatNumber },
                ]}
              >
                <ComparisonBar
                  data={usageData.docTypes}
                  isDark={isDark}
                  height={250}
                  labelKey="type"
                />
              </ChartSection>

              {/* Quality Scores */}
              <ChartSection
                title="Quality Score Distribution"
                tableData={usageData.qualityScores}
                tableColumns={[
                  { key: 'range', label: 'Score Range' },
                  { key: 'count', label: 'Count', format: formatNumber },
                ]}
              >
                <ScoreDistribution data={usageData.qualityScores} isDark={isDark} height={250} />
              </ChartSection>

              {/* Languages */}
              <ChartSection
                title="Top Languages"
                tableData={usageData.languages}
                tableColumns={[
                  { key: 'language', label: 'Language' },
                  { key: 'count', label: 'Count', format: formatNumber },
                ]}
              >
                <ComparisonBar
                  data={usageData.languages}
                  isDark={isDark}
                  height={250}
                  labelKey="language"
                />
              </ChartSection>

              {/* Origins */}
              <ChartSection
                title="Code Origins"
                tableData={usageData.origins}
                tableColumns={[
                  { key: 'origin', label: 'Origin' },
                  { key: 'count', label: 'Count', format: formatNumber },
                ]}
              >
                <ComparisonBar
                  data={usageData.origins}
                  isDark={isDark}
                  height={250}
                  labelKey="origin"
                />
              </ChartSection>
            </div>
          </div>
        )}

        {/* Raw Events Tab */}
        {activeTab === 'events' && (
          <EventsTable
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            excludeInternal={excludeInternal}
          />
        )}
      </div>
    </div>
  );
}
