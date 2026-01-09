/**
 * Analytics Dashboard Page
 * Admin-only dashboard for viewing conversion funnel, business metrics, and usage patterns
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  UserPlus,
  UserMinus,
  Eye,
  DollarSign,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Table,
  ChartBar,
  Database,
  Zap,
  Clock,
  Activity,
  Server,
  Gift,
  CheckCircle,
  XCircle,
  Info,
  Percent,
  FileText,
  Layers,
  Gauge,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/api';
import { PageLayout } from '../../components/PageLayout';
import DateRangePicker from '../../components/admin/DateRangePicker';
import {
  TrendChart,
  MultiLineTrendChart,
  ComparisonBar,
  ScoreDistribution,
  formatNumber,
  formatLatency,
  formatCurrency,
  formatPercent,
} from '../../components/admin/charts';
import EventsTable from '../../components/admin/EventsTable';
import { Tooltip } from '../../components/Tooltip';

// Tabs for the dashboard
const TABS = [
  { id: 'usage', label: 'Usage Patterns', icon: BarChart3 },
  { id: 'business', label: 'Business Metrics', icon: DollarSign },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'events', label: 'Raw Events', icon: Database },
];

/**
 * Format LLM provider name for display
 * Handles special casing like OpenAI, Claude, etc.
 */
function formatProviderName(provider) {
  const specialCases = {
    openai: 'OpenAI',
    claude: 'Claude',
    anthropic: 'Anthropic',
    gemini: 'Gemini',
  };
  return specialCases[provider?.toLowerCase()] || provider?.charAt(0).toUpperCase() + provider?.slice(1) || 'Unknown';
}

/**
 * Stats Card Component
 * Displays a metric with optional comparison to previous period
 */
function StatsCard({ icon: Icon, label, value, subValue, trend, comparison, color = 'purple', breakdown, invertTrend = false }) {
  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  // Determine if change is positive/negative for display
  // invertTrend: for metrics where down is good (latency, errors)
  const getChangeColor = (direction) => {
    if (direction === 'neutral') return 'text-slate-500 dark:text-slate-400';
    const isGood = invertTrend ? direction === 'down' : direction === 'up';
    return isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getChangeIcon = (direction) => {
    if (direction === 'up') return <TrendingUp className="w-3 h-3" />;
    if (direction === 'down') return <TrendingUp className="w-3 h-3 rotate-180" />;
    return null;
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
      {comparison && comparison.change && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${getChangeColor(comparison.change.direction)}`}>
          {getChangeIcon(comparison.change.direction)}
          <span>
            {comparison.change.percent > 0 ? '+' : ''}{comparison.change.percent.toFixed(1)}% vs last period
          </span>
        </div>
      )}
      {breakdown}
    </div>
  );
}

/**
 * Info Tooltip Component - Shows benchmark info on hover
 * Uses existing Tooltip component for brand consistency
 */
function InfoTooltip({ content }) {
  return (
    <Tooltip content={content} placement="top">
      <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" />
    </Tooltip>
  );
}

/**
 * Chart Section Component with optional table toggle and guiding question
 */
function ChartSection({ title, question, children, tableData, tableColumns }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {question && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
              {question}
            </p>
          )}
        </div>
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
  const [activeTab, setActiveTab] = useState('usage');
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
  const [performanceData, setPerformanceData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState({});
  const [comparisons, setComparisons] = useState({});
  const [summaryData, setSummaryData] = useState(null);
  const [summaryCollapsed, setSummaryCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('analytics-summary-collapsed');
    return saved === 'true';
  });
  const [loadedTabs, setLoadedTabs] = useState(new Set([activeTab])); // Track which tabs have loaded data

  // Save collapsed state to localStorage
  const toggleSummary = useCallback(() => {
    setSummaryCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('analytics-summary-collapsed', newValue.toString());
      return newValue;
    });
  }, []);

  // Detect dark mode
  const isDark = useMemo(() => {
    return document.documentElement.classList.contains('dark');
  }, []);

  /**
   * Fetch data from API
   */
  const fetchData = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
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

      if (activeTab === 'usage') {
        // Fetch both usage patterns AND usage funnel data
        const [usageRes, generationsRes, funnelRes, sessionsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/usage?${params}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=generations&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/funnel?${params}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=sessions&interval=day`, { headers }),
        ]);

        if (!usageRes.ok || !funnelRes.ok) throw new Error('Failed to fetch usage data');

        const usage = await usageRes.json();
        const generations = await generationsRes.json();
        const funnel = await funnelRes.json();
        const sessions = await sessionsRes.json();

        setUsageData(usage.data);
        setFunnelData(funnel.data);
        setTimeSeriesData((prev) => ({
          ...prev,
          generations: generations.data,
          sessions: sessions.data,
        }));
      } else if (activeTab === 'business') {
        // Fetch business metrics AND business conversion funnel
        const [businessRes, signupsRes, revenueRes, conversionRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/business?${params}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=signups&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=revenue&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/conversion-funnel?${params}`, { headers }),
        ]);

        if (!businessRes.ok) throw new Error('Failed to fetch business data');

        const business = await businessRes.json();
        const signups = await signupsRes.json();
        const revenue = await revenueRes.json();
        const conversion = conversionRes.ok ? await conversionRes.json() : { data: null };

        setBusinessData({
          ...business.data,
          conversionFunnel: conversion.data,
        });
        setTimeSeriesData((prev) => ({
          ...prev,
          signups: signups.data,
          revenue: revenue.data,
        }));
      } else if (activeTab === 'performance') {
        // Fetch performance metrics, time series, and funnel data (for error rate)
        const [perfRes, latencyRes, cacheHitRes, throughputRes, ttftRes, streamingRes, funnelRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/performance?${params}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=latency&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=cache_hit_rate&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=throughput&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=ttft&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/timeseries?${params}&metric=streaming_time&interval=day`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/funnel?${params}`, { headers }),
        ]);

        if (!perfRes.ok) throw new Error('Failed to fetch performance data');

        const perf = await perfRes.json();
        const latency = await latencyRes.json();
        const cacheHit = await cacheHitRes.json();
        const throughput = await throughputRes.json();
        const ttft = await ttftRes.json();
        const streaming = await streamingRes.json();
        const funnel = funnelRes.ok ? await funnelRes.json() : { data: null };

        setPerformanceData(perf.data);
        setFunnelData(funnel.data);
        setTimeSeriesData((prev) => ({
          ...prev,
          latency: latency.data,
          cacheHitRate: cacheHit.data,
          throughput: throughput.data,
          ttft: ttft.data,
          streamingTime: streaming.data,
        }));
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
      // Mark this tab as loaded
      setLoadedTabs(prev => new Set([...prev, activeTab]));
    }
  }, [getToken, dateRange, excludeInternal, activeTab]);

  /**
   * Fetch period comparisons for key metrics
   */
  const fetchComparisons = useCallback(async () => {
    try {
      const token = await getToken();

      // Define metrics to compare based on active tab
      let metrics = [];
      if (activeTab === 'usage') {
        metrics = ['sessions', 'generations', 'completed_sessions'];
      } else if (activeTab === 'business') {
        metrics = ['signups', 'revenue'];
      } else if (activeTab === 'performance') {
        metrics = ['avg_latency', 'cache_hit_rate', 'throughput'];
      }

      if (metrics.length === 0) return;

      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        metrics: metrics.join(','),
        excludeInternal: excludeInternal.toString(),
      });

      const response = await fetch(`${API_URL}/api/admin/analytics/comparisons?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch comparisons');

      const data = await response.json();
      setComparisons(data.data || {});
    } catch (err) {
      console.error('Comparisons fetch error:', err);
      // Don't show error to user, comparisons are optional
      setComparisons({});
    }
  }, [getToken, dateRange, excludeInternal, activeTab]);

  /**
   * Fetch summary metrics for Health at a Glance
   */
  const fetchSummary = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        excludeInternal: excludeInternal.toString(),
      });

      const response = await fetch(`${API_URL}/api/admin/analytics/summary?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch summary');

      const data = await response.json();
      setSummaryData(data.data || null);
    } catch (err) {
      console.error('Summary fetch error:', err);
      // Don't show error to user, summary is optional
      setSummaryData(null);
    }
  }, [getToken, dateRange, excludeInternal]);

  // Fetch data when date range or excludeInternal changes (full refresh with loading)
  useEffect(() => {
    // Clear loaded tabs and refetch everything
    setLoadedTabs(new Set([activeTab]));
    fetchData(true); // Show loading spinner
    fetchComparisons();
    fetchSummary();
  }, [dateRange, excludeInternal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data when tab changes (only if not already loaded, no loading spinner)
  useEffect(() => {
    if (!loadedTabs.has(activeTab) && activeTab !== 'events') {
      fetchData(false); // Don't show loading spinner for tab switches
      fetchComparisons();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageLayout>
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Analytics Dashboard
                </h1>
                {summaryData && !loading && (
                  <button
                    onClick={toggleSummary}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label={summaryCollapsed ? "Show KPIs" : "Hide KPIs"}
                  >
                    <ChevronDown className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${summaryCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Understand user engagement, business growth, and product performance
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Exclude Internal Toggle */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={excludeInternal}
                  onChange={(e) => setExcludeInternal(e.target.checked)}
                  className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-slate-600 dark:checked:bg-slate-500 checked:border-slate-600 dark:checked:border-slate-500 focus:ring-0 focus:ring-offset-0"
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

        {/* KPIs Grid - Collapsible */}
        {summaryData && !loading && !summaryCollapsed && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Business Health */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Signups</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {formatNumber(summaryData.signups.value)}
                </div>
                {summaryData.signups.direction !== 'neutral' && (
                  <div className={`flex items-center gap-1 text-xs ${
                    summaryData.signups.direction === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {summaryData.signups.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {Math.abs(summaryData.signups.change).toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Revenue</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {formatCurrency(summaryData.revenue.value)}
                </div>
                {summaryData.revenue.direction !== 'neutral' && (
                  <div className={`flex items-center gap-1 text-xs ${
                    summaryData.revenue.direction === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {summaryData.revenue.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {Math.abs(summaryData.revenue.change).toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Usage Health */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Sessions</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {formatNumber(summaryData.sessions.value)}
                </div>
                {summaryData.sessions.direction !== 'neutral' && (
                  <div className={`flex items-center gap-1 text-xs ${
                    summaryData.sessions.direction === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {summaryData.sessions.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {Math.abs(summaryData.sessions.change).toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Completion</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {formatPercent(summaryData.completionRate.value)}
                </div>
                {summaryData.completionRate.direction !== 'neutral' && (
                  <div className={`flex items-center gap-1 text-xs ${
                    summaryData.completionRate.direction === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {summaryData.completionRate.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {Math.abs(summaryData.completionRate.change).toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Performance Health */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Latency</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {formatLatency(summaryData.avgLatency.value)}
                </div>
                {summaryData.avgLatency.direction !== 'neutral' && (
                  <div className={`flex items-center gap-1 text-xs ${
                    summaryData.avgLatency.direction === 'down'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {summaryData.avgLatency.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {Math.abs(summaryData.avgLatency.change).toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Errors</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {formatNumber(summaryData.errorCount.value)}
                </div>
                {summaryData.errorCount.direction !== 'neutral' && (
                  <div className={`flex items-center gap-1 text-xs ${
                    summaryData.errorCount.direction === 'down'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {summaryData.errorCount.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {Math.abs(summaryData.errorCount.change).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Analytics tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${isActive
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
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

        {/* Business Tab */}
        {!loading && activeTab === 'business' && businessData && (
          <div className="space-y-6">
            {/* Business Conversion Funnel Section */}
            {businessData.conversionFunnel && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                  Conversion Funnel
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 italic">
                  How many visitors are converting to paying customers?
                </p>

                {/* Conversion Funnel Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatsCard
                    icon={Eye}
                    label="Visitors"
                    value={formatNumber(businessData.conversionFunnel.stages?.visitors?.count || 0)}
                    subValue="Unique sessions"
                    color="purple"
                  />
                  <StatsCard
                    icon={Activity}
                    label="Engaged"
                    value={formatPercent(businessData.conversionFunnel.conversionRates?.visitor_to_engaged || 0)}
                    subValue={`${formatNumber(businessData.conversionFunnel.stages?.engaged?.count || 0)} of ${formatNumber(businessData.conversionFunnel.stages?.visitors?.count || 0)} visitors`}
                    color="purple"
                  />
                  <StatsCard
                    icon={UserPlus}
                    label="Signups"
                    value={formatPercent(businessData.conversionFunnel.conversionRates?.engaged_to_signup || 0)}
                    subValue={`${formatNumber(businessData.conversionFunnel.stages?.signups?.count || 0)} of ${formatNumber(businessData.conversionFunnel.stages?.engaged?.count || 0)} engaged`}
                    comparison={comparisons.signups}
                    color="purple"
                  />
                  <StatsCard
                    icon={Gift}
                    label="Trial Started"
                    value={formatPercent(businessData.conversionFunnel.conversionRates?.signup_to_trial || 0)}
                    subValue={`${formatNumber(businessData.conversionFunnel.stages?.trials?.count || 0)} of ${formatNumber(businessData.conversionFunnel.stages?.signups?.count || 0)} signups`}
                    color="purple"
                    breakdown={
                      businessData.conversionFunnel.stages?.trials?.breakdown && (
                        <div className="flex gap-3 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Campaign: <span className="font-medium text-slate-700 dark:text-slate-300">{formatNumber(businessData.conversionFunnel.stages.trials.breakdown.campaign?.count || 0)}</span>
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Individual: <span className="font-medium text-slate-700 dark:text-slate-300">{formatNumber(businessData.conversionFunnel.stages.trials.breakdown.individual?.count || 0)}</span>
                          </span>
                        </div>
                      )
                    }
                  />
                  <StatsCard
                    icon={DollarSign}
                    label="Paid Conversion"
                    value={formatPercent(businessData.conversionFunnel.conversionRates?.signup_to_paid || 0)}
                    subValue={`${formatNumber(businessData.conversionFunnel.stages?.paid?.count || 0)} of ${formatNumber(businessData.conversionFunnel.stages?.signups?.count || 0)} signups`}
                    color="purple"
                    breakdown={
                      businessData.conversionFunnel.stages?.paid?.breakdown && (
                        <div className="flex gap-3 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Via Trial: <span className="font-medium text-slate-700 dark:text-slate-300">{formatNumber(businessData.conversionFunnel.stages.paid.breakdown.viaTrial?.count || 0)}</span>
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Direct: <span className="font-medium text-slate-700 dark:text-slate-300">{formatNumber(businessData.conversionFunnel.stages.paid.breakdown.direct?.count || 0)}</span>
                          </span>
                        </div>
                      )
                    }
                  />
                </div>

                {/* Conversion Funnel Chart */}
                <ChartSection
                  title="Business Conversion Funnel"
                  question="How do visitors progress through the conversion funnel?"
                >
                  <div className="space-y-4">
                    {/* Funnel visualization as stacked bars */}
                    {['visitors', 'engaged', 'signups', 'trials', 'paid'].map((stage, index) => {
                      const stageData = businessData.conversionFunnel.stages?.[stage];
                      const maxCount = businessData.conversionFunnel.stages?.visitors?.count || 1;
                      const percentage = maxCount > 0 ? (stageData?.count / maxCount) * 100 : 0;
                      const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];
                      const labels = ['Visitors', 'Engaged (Used Product)', 'Signups', 'Trial Started', 'Paid'];

                      // Check if this stage has a breakdown
                      const hasBreakdown = stage === 'trials' || stage === 'paid';
                      const breakdown = stageData?.breakdown;

                      return (
                        <div key={stage}>
                          <div className="flex items-center gap-4">
                            <div className="w-40 text-sm text-slate-600 dark:text-slate-400 text-right">
                              {labels[index]}
                            </div>
                            <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                              <div
                                className={`h-full ${colors[index]} transition-all duration-500 flex items-center justify-end pr-2`}
                                style={{ width: `${Math.max(percentage, 2)}%` }}
                              >
                                <span className="text-xs font-medium text-white">
                                  {formatNumber(stageData?.count || 0)}
                                </span>
                              </div>
                            </div>
                            <div className="w-16 text-sm text-slate-500 dark:text-slate-400">
                              {formatPercent(percentage)}
                            </div>
                          </div>

                          {/* Show breakdown sub-bars for trials and paid */}
                          {hasBreakdown && breakdown && (
                            <div className="ml-44 mt-1 space-y-1">
                              {stage === 'trials' && (() => {
                                const signups = businessData.conversionFunnel.stages?.signups?.count || 0;
                                const campaignRate = signups > 0 ? (breakdown.campaign?.count / signups) * 100 : 0;
                                const individualRate = signups > 0 ? (breakdown.individual?.count / signups) * 100 : 0;
                                return (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 text-xs text-slate-500 dark:text-slate-400 text-right">Campaign</div>
                                      <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                                        <div
                                          className="h-full bg-amber-400 dark:bg-amber-500 transition-all duration-500 flex items-center justify-end pr-1"
                                          style={{ width: `${Math.max((breakdown.campaign?.count / maxCount) * 100, breakdown.campaign?.count > 0 ? 1 : 0)}%` }}
                                        >
                                          <span className="text-[10px] font-medium text-white">{formatNumber(breakdown.campaign?.count || 0)}</span>
                                        </div>
                                      </div>
                                      <div className="w-12 text-xs text-slate-500 dark:text-slate-400">{formatPercent(campaignRate)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 text-xs text-slate-500 dark:text-slate-400 text-right">Individual</div>
                                      <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                                        <div
                                          className="h-full bg-amber-300 dark:bg-amber-600 transition-all duration-500 flex items-center justify-end pr-1"
                                          style={{ width: `${Math.max((breakdown.individual?.count / maxCount) * 100, breakdown.individual?.count > 0 ? 1 : 0)}%` }}
                                        >
                                          <span className="text-[10px] font-medium text-white">{formatNumber(breakdown.individual?.count || 0)}</span>
                                        </div>
                                      </div>
                                      <div className="w-12 text-xs text-slate-500 dark:text-slate-400">{formatPercent(individualRate)}</div>
                                    </div>
                                  </>
                                );
                              })()}
                              {stage === 'paid' && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 text-xs text-slate-500 dark:text-slate-400 text-right">Via Trial</div>
                                    <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                                      <div
                                        className="h-full bg-green-400 dark:bg-green-500 transition-all duration-500 flex items-center justify-end pr-1"
                                        style={{ width: `${Math.max((breakdown.viaTrial?.count / maxCount) * 100, breakdown.viaTrial?.count > 0 ? 1 : 0)}%` }}
                                      >
                                        <span className="text-[10px] font-medium text-white">{formatNumber(breakdown.viaTrial?.count || 0)}</span>
                                      </div>
                                    </div>
                                    <div className="w-12 text-xs text-slate-500 dark:text-slate-400">{formatPercent(businessData.conversionFunnel.conversionRates?.trial_to_paid || 0)}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 text-xs text-slate-500 dark:text-slate-400 text-right">Direct</div>
                                    <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                                      <div
                                        className="h-full bg-blue-400 dark:bg-blue-500 transition-all duration-500 flex items-center justify-end pr-1"
                                        style={{ width: `${Math.max((breakdown.direct?.count / maxCount) * 100, breakdown.direct?.count > 0 ? 1 : 0)}%` }}
                                      >
                                        <span className="text-[10px] font-medium text-white">{formatNumber(breakdown.direct?.count || 0)}</span>
                                      </div>
                                    </div>
                                    <div className="w-12 text-xs text-slate-500 dark:text-slate-400">{formatPercent(businessData.conversionFunnel.conversionRates?.signup_to_direct_paid || 0)}</div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                    Overall conversion rate: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPercent(businessData.conversionFunnel.overallConversion)}</span> (visitor to paid)
                  </div>
                </ChartSection>
              </>
            )}

            {/* Business Metrics Section */}
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">
              Business Metrics
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 italic">
              How is the business performing overall?
            </p>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                icon={UserPlus}
                label="New Signups"
                value={formatNumber(businessData.signups)}
                color="purple"
              />
              <StatsCard
                icon={TrendingUp}
                label="Tier Upgrades"
                value={formatNumber(businessData.tierUpgrades)}
                color="purple"
              />
              <StatsCard
                icon={DollarSign}
                label="Revenue"
                value={formatCurrency(businessData.revenueCents)}
                color="purple"
              />
              <StatsCard
                icon={UserMinus}
                label="Cancellations"
                value={formatNumber(businessData.cancellations)}
                color="purple"
              />
            </div>

            {/* Signups Trend */}
            <ChartSection
              title="New Signups Over Time"
              question="Are signups growing or declining?"
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
              question="What's our revenue trend?"
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
              <ChartSection
                title="Upgrades by Tier"
                question="Which tiers are users upgrading to?"
              >
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
            {/* Session Overview Section */}
            {funnelData && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                  Session Overview
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 italic">
                  How engaged are users with the product?
                </p>

                {/* Session Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatsCard
                    icon={Activity}
                    label="Total Sessions"
                    value={formatNumber(funnelData.totalSessions)}
                    comparison={comparisons.sessions}
                    color="purple"
                  />
                  <StatsCard
                    icon={CheckCircle}
                    label="Completed Sessions"
                    value={formatNumber(funnelData.completedSessions)}
                    subValue="Sessions with copy/download"
                    comparison={comparisons.completed_sessions}
                    color="purple"
                  />
                  <StatsCard
                    icon={CheckCircle}
                    label="Completion Rate"
                    value={formatPercent(funnelData.overallConversion)}
                    subValue="Sessions ending in copy/download"
                    color="purple"
                  />
                </div>

                {/* Sessions Trend */}
                <ChartSection
                  title="Sessions Over Time"
                  question="What's the engagement trend over time?"
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
              </>
            )}

            {/* User Journey / Retention Section */}
            {usageData.retentionMetrics && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">
                  User Journey & Retention
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 italic">
                  Are authenticated users returning to the product?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatsCard
                    icon={UserPlus}
                    label="New Users"
                    value={formatNumber(usageData.retentionMetrics.newUsers || 0)}
                    subValue={usageData.retentionMetrics.totalUsers > 0
                      ? `${((usageData.retentionMetrics.newUsers / usageData.retentionMetrics.totalUsers) * 100).toFixed(1)}% of total`
                      : '0% of total'
                    }
                    color="purple"
                  />
                  <StatsCard
                    icon={Activity}
                    label="Returning Users"
                    value={formatNumber(usageData.retentionMetrics.returningUsers || 0)}
                    subValue={usageData.retentionMetrics.totalUsers > 0
                      ? `${((usageData.retentionMetrics.returningUsers / usageData.retentionMetrics.totalUsers) * 100).toFixed(1)}% of total`
                      : '0% of total'
                    }
                    color="purple"
                  />
                  <StatsCard
                    icon={TrendingUp}
                    label="Return Rate"
                    value={formatPercent(usageData.retentionMetrics.returnRate || 0)}
                    subValue={`${formatNumber(usageData.retentionMetrics.returningUsers || 0)} of ${formatNumber(usageData.retentionMetrics.totalUsers || 0)} users returned`}
                    color="purple"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Note: Metrics track authenticated users only. Anonymous users cannot be tracked across sessions.
                </p>
              </>
            )}

            {/* Code Origin Section */}
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">
              Code Sources
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 italic">
              Where are users importing their code from?
            </p>

            {/* Code Origin Breakdown */}
            {usageData.origins && usageData.origins.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="space-y-3">
                  {(() => {
                    const originLabels = {
                      github_private: 'Private Repos',
                      github_public: 'Public Repos',
                      upload: 'Local Files',
                      sample: 'Sample Code',
                      paste: 'Pasted Code',
                    };
                    const originIcons = {
                      github_private: '🔒',
                      github_public: '🌐',
                      upload: '📁',
                      sample: '📝',
                      paste: '📋',
                    };
                    const total = usageData.origins.reduce((sum, o) => sum + o.count, 0);
                    return usageData.origins.map((origin) => {
                      const percent = total > 0 ? (origin.count / total) * 100 : 0;
                      return (
                        <div key={origin.origin} className="flex items-center gap-3">
                          <span className="text-lg w-6">{originIcons[origin.origin] || '📄'}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 w-28">
                            {originLabels[origin.origin] || origin.origin}
                          </span>
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-purple-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 w-12 text-right">
                            {origin.count}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 w-14 text-right">
                            {formatPercent(percent)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
                No code origin data available for this period
              </div>
            )}

            {/* Generation Modes Section */}
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">
              Generation Modes
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 italic">
              Are users generating single files or batches?
            </p>

            {/* Batch vs Single Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                icon={FileText}
                label="Single Generations"
                value={formatNumber(usageData.batchVsSingle?.single || 0)}
                color="purple"
              />
              <StatsCard
                icon={Layers}
                label="Batch Generations"
                value={formatNumber(usageData.batchVsSingle?.batch || 0)}
                color="purple"
              />
              <StatsCard
                icon={Percent}
                label="Batch Ratio"
                value={formatPercent(
                  usageData.batchVsSingle
                    ? (usageData.batchVsSingle.batch /
                        (usageData.batchVsSingle.batch + usageData.batchVsSingle.single || 1)) *
                        100
                    : 0
                )}
                subValue="Batch as % of all generations"
                color="purple"
              />
            </div>

            {/* Generations Trend */}
            <ChartSection
              title="Generations Over Time"
              question="Are users completing their workflows?"
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
                question="What documentation types are most popular?"
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
                question="How good is the generated documentation?"
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
                question="What programming languages are being documented?"
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
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {!loading && activeTab === 'performance' && performanceData && (
          <div className="space-y-8">
            {/* ================================================================
                SECTION 1: Response Time - How fast are we generating docs?
                ================================================================ */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Response Time
                  <InfoTooltip content="Excellent <3s • Good 3-8s • Acceptable 8-15s • Slow >15s" />
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                  Is the product fast enough?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                  icon={Clock}
                  label="Average Latency"
                  value={formatLatency(performanceData.avgLatencyMs)}
                  subValue="Mean response time"
                  comparison={comparisons.avg_latency}
                  invertTrend={true}
                  color="purple"
                />
                <StatsCard
                  icon={Clock}
                  label="Median Latency"
                  value={formatLatency(performanceData.medianLatencyMs)}
                  subValue="50th percentile (typical)"
                  color="purple"
                />
                <StatsCard
                  icon={Clock}
                  label="P95 Latency"
                  value={formatLatency(performanceData.p95LatencyMs)}
                  subValue="Worst 5% of requests"
                  color="purple"
                />
              </div>

              {/* Latency Breakdown: TTFT vs Streaming */}
              {performanceData.latencyBreakdown && performanceData.latencyBreakdown.totalEvents > 0 && (
                <ChartSection
                  title="Latency Breakdown (Where Time is Spent)"
                  question="Is prompt caching saving us money?"
                >
                  <div className="space-y-4">
                    {/* Visual breakdown bar */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Average Total:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatLatency(performanceData.latencyBreakdown.avgTotalMs)}
                        </span>
                      </div>

                      {/* Stacked bar showing TTFT vs Streaming */}
                      <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex">
                        {(() => {
                          const ttft = performanceData.latencyBreakdown.avgTtftMs || 0;
                          const streaming = performanceData.latencyBreakdown.avgStreamingMs || 0;
                          const total = ttft + streaming || 1;
                          const ttftPct = (ttft / total) * 100;
                          const streamingPct = (streaming / total) * 100;

                          return (
                            <>
                              <div
                                className="bg-purple-400 dark:bg-purple-500 flex items-center justify-center text-xs font-medium text-white"
                                style={{ width: `${ttftPct}%`, minWidth: ttftPct > 5 ? '60px' : '0' }}
                              >
                                {ttftPct > 10 && `TTFT ${formatLatency(ttft)}`}
                              </div>
                              <div
                                className="bg-purple-600 dark:bg-purple-700 flex items-center justify-center text-xs font-medium text-white"
                                style={{ width: `${streamingPct}%`, minWidth: streamingPct > 5 ? '60px' : '0' }}
                              >
                                {streamingPct > 10 && `Streaming ${formatLatency(streaming)}`}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Legend */}
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-purple-400 dark:bg-purple-500" />
                          <span className="text-slate-600 dark:text-slate-400">
                            TTFT: <span className="font-medium text-slate-900 dark:text-slate-100">{formatLatency(performanceData.latencyBreakdown.avgTtftMs)}</span>
                            <span className="text-slate-500 dark:text-slate-500 ml-1">(time to first token)</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-purple-600 dark:bg-purple-700" />
                          <span className="text-slate-600 dark:text-slate-400">
                            Streaming: <span className="font-medium text-slate-900 dark:text-slate-100">{formatLatency(performanceData.latencyBreakdown.avgStreamingMs)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatLatency(performanceData.latencyBreakdown.avgTtftMs)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Avg TTFT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatLatency(performanceData.latencyBreakdown.medianTtftMs)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Median TTFT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatLatency(performanceData.latencyBreakdown.p95TtftMs)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">P95 TTFT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {performanceData.latencyBreakdown.avgTpotMs.toFixed(1)} ms
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Avg TPOT (per token)</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-2">
                      <span>
                        Based on {formatNumber(performanceData.latencyBreakdown.totalEvents)} streaming events.
                        TTFT = Time to First Token (API overhead). TPOT = Time Per Output Token (generation speed).
                      </span>
                      <InfoTooltip content="TTFT (time until streaming starts): <500ms excellent • 500ms-1s good • 1-2s acceptable • >2s slow. Throughput: >50 tok/s excellent • 30-50 good • <30 slow. Total generation scales with output (~30ms/token)." />
                    </p>
                  </div>
                </ChartSection>
              )}

              <ChartSection
                title="Latency Trend (Total, TTFT, Streaming)"
                question="How has response time changed over time?"
                tableData={(() => {
                  // Combine latency, ttft, and streaming data by date for table view
                  const dataByDate = new Map();
                  (timeSeriesData.latency || []).forEach(item => {
                    dataByDate.set(item.date, { ...dataByDate.get(item.date), date: item.date, totalMs: item.value });
                  });
                  (timeSeriesData.ttft || []).forEach(item => {
                    dataByDate.set(item.date, { ...dataByDate.get(item.date), date: item.date, ttftMs: item.value });
                  });
                  (timeSeriesData.streamingTime || []).forEach(item => {
                    dataByDate.set(item.date, { ...dataByDate.get(item.date), date: item.date, streamingMs: item.value });
                  });
                  return Array.from(dataByDate.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
                })()}
                tableColumns={[
                  { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
                  { key: 'totalMs', label: 'Total (ms)', format: (v) => v ? formatNumber(v) : '-' },
                  { key: 'ttftMs', label: 'TTFT (ms)', format: (v) => v ? formatNumber(v) : '-' },
                  { key: 'streamingMs', label: 'Streaming (ms)', format: (v) => v ? formatNumber(v) : '-' },
                ]}
              >
                {(timeSeriesData.ttft?.length > 0 || timeSeriesData.streamingTime?.length > 0) ? (
                  <MultiLineTrendChart
                    series={[
                      {
                        key: 'total',
                        label: 'Total Latency',
                        data: timeSeriesData.latency,
                        color: isDark ? '#a855f7' : '#9333ea',
                      },
                      {
                        key: 'ttft',
                        label: 'Time to First Token',
                        data: timeSeriesData.ttft,
                        color: isDark ? '#c084fc' : '#a855f7',
                      },
                      {
                        key: 'streaming',
                        label: 'Streaming Time',
                        data: timeSeriesData.streamingTime,
                        color: isDark ? '#e9d5ff' : '#c084fc',
                      },
                    ]}
                    isDark={isDark}
                    height={250}
                    interval="day"
                  />
                ) : (
                  <TrendChart
                    data={timeSeriesData.latency}
                    isDark={isDark}
                    height={200}
                    interval="day"
                    color={isDark ? '#a855f7' : '#9333ea'}
                  />
                )}
              </ChartSection>
            </div>

            {/* ================================================================
                SECTION 2: Cost Efficiency - Are we saving money with caching?
                ================================================================ */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Cost Efficiency
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                  Are we saving money with prompt caching?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                  icon={Zap}
                  label="Cache Hit Rate"
                  value={formatPercent(performanceData.cacheHitRate)}
                  subValue="Requests using cached prompts"
                  comparison={comparisons.cache_hit_rate}
                  color="purple"
                />
                <StatsCard
                  icon={ArrowDownToLine}
                  label="Input Tokens"
                  value={formatNumber(performanceData.totalInputTokens)}
                  subValue="Total tokens sent to LLM"
                  color="purple"
                />
                <StatsCard
                  icon={ArrowUpFromLine}
                  label="Output Tokens"
                  value={formatNumber(performanceData.totalOutputTokens)}
                  subValue="Total tokens generated"
                  color="purple"
                />
              </div>

              <ChartSection
                title="Cache Hit Rate Trend"
                question="Is caching improving over time?"
                tableData={timeSeriesData.cacheHitRate}
                tableColumns={[
                  { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
                  { key: 'value', label: 'Cache Hit Rate (%)', format: (v) => formatPercent(v) },
                ]}
              >
                <TrendChart
                  data={timeSeriesData.cacheHitRate}
                  isDark={isDark}
                  height={200}
                  interval="day"
                  color={isDark ? '#a855f7' : '#9333ea'}
                />
              </ChartSection>
            </div>

            {/* ================================================================
                SECTION 3: Throughput - How much capacity are we using?
                ================================================================ */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Throughput & Volume
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                  How much generation capacity are we using?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatsCard
                  icon={FileText}
                  label="Total Generations"
                  value={formatNumber(performanceData.totalGenerations)}
                  subValue="Documents generated in period"
                  comparison={comparisons.generations}
                  color="purple"
                />
                <StatsCard
                  icon={Gauge}
                  label="Avg Throughput"
                  value={`${formatNumber(performanceData.avgThroughput)} tok/s`}
                  subValue="Output tokens per second"
                  comparison={comparisons.throughput}
                  color="purple"
                />
              </div>

              <ChartSection
                title="Throughput Trend"
                question="Is throughput consistent over time?"
                tableData={timeSeriesData.throughput}
                tableColumns={[
                  { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
                  { key: 'value', label: 'Throughput (tok/s)', format: formatNumber },
                ]}
              >
                <TrendChart
                  data={timeSeriesData.throughput}
                  isDark={isDark}
                  height={200}
                  interval="day"
                  color={isDark ? '#a855f7' : '#9333ea'}
                />
              </ChartSection>
            </div>

            {/* ================================================================
                SECTION 4: Provider Analysis - Which LLMs are we using?
                ================================================================ */}
            {performanceData.providerBreakdown && Object.keys(performanceData.providerBreakdown).length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Provider & Model Analysis
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                    Which LLM providers and models perform best?
                  </p>
                </div>

                {/* Provider comparison cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(performanceData.providerBreakdown).map(([provider, data]) => (
                    <div key={provider} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatProviderName(provider)}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Generations</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{formatNumber(data.count)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Avg Latency</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{formatLatency(data.avgLatencyMs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Cache Hit Rate</span>
                          <span className="font-medium text-purple-600 dark:text-purple-400">{formatPercent(data.cacheHitRate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Model breakdown table */}
                {performanceData.modelUsage && Object.keys(performanceData.modelUsage).length > 0 && (
                  <ChartSection
                    title="Model Breakdown"
                    question="What's the performance difference between models?"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-2 px-3 text-slate-600 dark:text-slate-400 font-medium">Model</th>
                            <th className="text-right py-2 px-3 text-slate-600 dark:text-slate-400 font-medium">Generations</th>
                            <th className="text-right py-2 px-3 text-slate-600 dark:text-slate-400 font-medium">% of Total</th>
                            <th className="text-right py-2 px-3 text-slate-600 dark:text-slate-400 font-medium">Avg Latency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(performanceData.modelUsage).map(([model, data]) => (
                            <tr key={model} className="border-b border-slate-100 dark:border-slate-700/50">
                              <td className="py-2 px-3 text-slate-900 dark:text-slate-100 font-mono text-xs">{model}</td>
                              <td className="py-2 px-3 text-slate-900 dark:text-slate-100 text-right">{formatNumber(data.count)}</td>
                              <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-right">
                                {formatPercent((data.count / performanceData.totalGenerations) * 100)}
                              </td>
                              <td className="py-2 px-3 text-slate-900 dark:text-slate-100 text-right">{formatLatency(data.avgLatencyMs)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartSection>
                )}
              </div>
            )}

            {/* ================================================================
                SECTION 5: Error Rate - How reliable is doc generation?
                ================================================================ */}
            {funnelData && funnelData.stages?.generation_started?.events > 0 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Error Rate
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                    How reliable is document generation?
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatsCard
                    icon={AlertCircle}
                    label="Error Rate"
                    value={formatPercent(
                      funnelData.stages?.generation_started?.events > 0
                        ? ((funnelData.stages.generation_started.events - funnelData.stages.generation_completed.events) /
                            funnelData.stages.generation_started.events) *
                            100
                        : 0
                    )}
                    subValue={`${formatNumber((funnelData.stages?.generation_started?.events || 0) - (funnelData.stages?.generation_completed?.events || 0))} of ${formatNumber(funnelData.stages?.generation_started?.events || 0)} failed`}
                    color="purple"
                  />
                  <StatsCard
                    icon={CheckCircle}
                    label="Successful"
                    value={formatNumber(funnelData.stages?.generation_completed?.events || 0)}
                    subValue="Generations completed"
                    color="purple"
                  />
                  <StatsCard
                    icon={XCircle}
                    label="Failed"
                    value={formatNumber((funnelData.stages?.generation_started?.events || 0) - (funnelData.stages?.generation_completed?.events || 0))}
                    subValue="Generations failed"
                    color="purple"
                  />
                </div>

                {/* Error Breakdown Table */}
                {performanceData.errorMetrics && performanceData.errorMetrics.topErrors && performanceData.errorMetrics.topErrors.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-6">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100">
                        Error Breakdown
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                        What types of errors are users encountering?
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Error Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Context
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:border-slate-700">
                          {performanceData.errorMetrics.topErrors.map((err, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                                {err.errorType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                {err.context}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-900 dark:text-slate-100">
                                {formatNumber(err.count)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
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
    </PageLayout>
  );
}
