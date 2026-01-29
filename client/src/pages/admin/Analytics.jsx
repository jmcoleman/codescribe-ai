/**
 * Analytics Dashboard Page
 * Admin-only dashboard for viewing conversion funnel, business metrics, and usage patterns
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Mail,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/api';
import { PageLayout } from '../../components/PageLayout';
import DateRangePicker from '../../components/admin/DateRangePicker';
import { STORAGE_KEYS, getSessionItem, setSessionItem } from '../../constants/storage';
import { useDateRange } from '../../hooks/useDateRange';
import {
  TrendChart,
  MultiLineTrendChart,
  QualityHeatmap,
  formatNumber,
  formatLatency,
  formatCurrency,
  formatPercent,
} from '../../components/admin/charts';
import {
  ChartSection,
  TrendChartSection,
  MultiLineTrendChartSection,
  FunnelChartSection,
  BarChartSection,
  SuccessChartSection,
  DistributionChartSection,
  HeatmapChartSection,
} from '../../components/admin/ChartSections';
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
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
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
      {comparison && comparison.change && (
        <div className={`mt-1 flex items-center gap-1 ${getChangeColor(comparison.change.direction)}`}>
          {getChangeIcon(comparison.change.direction)}
        </div>
      )}
      {subValue && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {subValue}
        </div>
      )}
      {breakdown && (
        <div className="mt-2">
          {breakdown}
        </div>
      )}
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
 * Main Analytics Dashboard Component
 */
export default function Analytics() {
  const { getToken } = useAuth();

  // Load saved active tab from sessionStorage
  const [activeTab, setActiveTab] = useState(() => {
    const saved = getSessionItem(STORAGE_KEYS.ANALYTICS_ACTIVE_TAB);
    return saved || 'usage'; // Default to 'usage' if not saved
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // For in-place refreshes (exclusion changes)
  const [error, setError] = useState(null);
  const isInitialMount = useRef(true);

  // Exclusion filters state - multi-select for internal/anonymous users
  const [exclusions, setExclusions] = useState(() => {
    const savedInternal = getSessionItem(STORAGE_KEYS.ANALYTICS_EXCLUDE_INTERNAL);
    const savedAnonymous = getSessionItem(STORAGE_KEYS.ANALYTICS_EXCLUDE_ANONYMOUS);

    return {
      internal: savedInternal !== null ? savedInternal === 'true' : true, // Default exclude
      anonymous: savedAnonymous !== null ? savedAnonymous === 'true' : true, // Default exclude
    };
  });

  // Exclusion dropdown open/close state
  const [exclusionDropdownOpen, setExclusionDropdownOpen] = useState(false);
  const exclusionDropdownRef = useRef(null);

  // Temporary exclusions state for dropdown (only applied when dropdown closes)
  const [tempExclusions, setTempExclusions] = useState(exclusions);

  // Model filter for quality heatmap
  const [selectedModel, setSelectedModel] = useState('all');

  // Default to last 30 days (or restore from session)
  const { dateRange, setDateRange } = useDateRange(STORAGE_KEYS.ANALYTICS_DATE_RANGE);

  // Trial Program export dates (separate from main dashboard dateRange)
  const [campaignExportDates, setCampaignExportDates] = useState(() => {
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
  const fetchData = useCallback(async (showLoadingSpinner = true, isRefresh = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    } else if (isRefresh) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        excludeInternal: exclusions.internal.toString(),
        excludeAnonymous: exclusions.anonymous.toString(),
      });

      // Add model parameter for usage queries
      const usageParams = new URLSearchParams(params);
      usageParams.set('model', selectedModel);

      // Fetch data based on active tab
      const headers = { 'Authorization': `Bearer ${token}` };

      if (activeTab === 'usage') {
        // Fetch both usage patterns AND usage funnel data
        const [usageRes, generationsRes, funnelRes, sessionsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/usage?${usageParams}`, { headers }),
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
      if (isRefresh) {
        setRefreshing(false);
      }
      // Mark this tab as loaded
      setLoadedTabs(prev => new Set([...prev, activeTab]));
    }
  }, [getToken, dateRange, exclusions, activeTab, selectedModel]);

  /**
   * Fetch period comparisons for key metrics
   */
  const fetchComparisons = useCallback(async () => {
    try {
      const token = await getToken();

      // Define metrics to compare based on active tab
      let metrics = [];
      if (activeTab === 'usage') {
        metrics = ['sessions', 'code_input', 'generations', 'completed_sessions', 'doc_export'];
      } else if (activeTab === 'business') {
        metrics = ['visitors', 'engaged', 'signups', 'verified', 'activated', 'trials', 'paid', 'revenue'];
      } else if (activeTab === 'performance') {
        metrics = ['avg_latency', 'cache_hit_rate', 'throughput'];
      }

      if (metrics.length === 0) return;

      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        metrics: metrics.join(','),
        excludeInternal: exclusions.internal.toString(),
        excludeAnonymous: exclusions.anonymous.toString(),
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
  }, [getToken, dateRange, exclusions, activeTab]);

  /**
   * Fetch summary metrics for Health at a Glance
   */
  const fetchSummary = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        excludeInternal: exclusions.internal.toString(),
        excludeAnonymous: exclusions.anonymous.toString(),
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
  }, [getToken, dateRange, exclusions]);

  // Fetch data when date range or exclusions change
  useEffect(() => {
    // Clear loaded tabs and refetch everything
    setLoadedTabs(new Set([activeTab]));

    if (isInitialMount.current) {
      // Initial page load - show full loading spinner
      isInitialMount.current = false;
      fetchData(true); // Show loading spinner
      fetchComparisons();
      fetchSummary();
    } else if (activeTab === 'events') {
      // For Raw Events tab, only refresh summary (EventsTable handles its own refresh)
      fetchSummary();
    } else {
      // For other tabs, do in-place refresh without unmounting content
      fetchData(false, true); // isRefresh = true
      fetchComparisons();
      fetchSummary();
    }
  }, [dateRange, exclusions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch only quality scores by doc type when model filter changes (no full page refresh)
  useEffect(() => {
    const fetchQualityScoresByDocType = async () => {
      if (activeTab !== 'usage') return; // Only relevant for usage tab

      try {
        const token = await getToken();
        const params = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          excludeInternal: exclusions.internal.toString(),
          excludeAnonymous: exclusions.anonymous.toString(),
          model: selectedModel,
        });

        const response = await fetch(`${API_URL}/api/admin/analytics/usage?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          // Only update the qualityScoresByDocType data, not the entire usageData
          setUsageData(prev => ({
            ...prev,
            qualityScoresByDocType: data.data.qualityScoresByDocType,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch quality scores by doc type:', err);
      }
    };

    fetchQualityScoresByDocType();
  }, [selectedModel, getToken, dateRange, exclusions, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data when tab changes (only if not already loaded, no loading spinner)
  useEffect(() => {
    if (!loadedTabs.has(activeTab) && activeTab !== 'events') {
      fetchData(false); // Don't show loading spinner for tab switches
      fetchComparisons();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save exclusion preferences to sessionStorage
  useEffect(() => {
    setSessionItem(STORAGE_KEYS.ANALYTICS_EXCLUDE_INTERNAL, exclusions.internal.toString());
    setSessionItem(STORAGE_KEYS.ANALYTICS_EXCLUDE_ANONYMOUS, exclusions.anonymous.toString());
  }, [exclusions]);

  // Handle click outside exclusion dropdown to close it and apply changes
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exclusionDropdownRef.current && !exclusionDropdownRef.current.contains(event.target)) {
        setExclusionDropdownOpen(false);
        // Apply temp exclusions when dropdown closes
        setExclusions(tempExclusions);
      }
    };

    if (exclusionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [exclusionDropdownOpen, tempExclusions]);

  // Save active tab to sessionStorage
  useEffect(() => {
    setSessionItem(STORAGE_KEYS.ANALYTICS_ACTIVE_TAB, activeTab);
  }, [activeTab]);

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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Analytics Dashboard
                </h1>
                <button
                  onClick={toggleSummary}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label={summaryCollapsed ? "Show KPIs" : "Hide KPIs"}
                >
                  <ChevronDown className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${summaryCollapsed ? '-rotate-90' : ''}`} />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Understand user engagement, business growth, and product performance
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Exclusion Filter - Multi-select */}
              <div className="relative">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Exclude:</span>
                  <div className="relative inline-block" ref={exclusionDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!exclusionDropdownOpen) {
                          // Initialize temp state when opening dropdown
                          setTempExclusions(exclusions);
                        } else {
                          // Apply temp exclusions when closing via button click
                          setExclusions(tempExclusions);
                        }
                        setExclusionDropdownOpen(!exclusionDropdownOpen);
                      }}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-[200px]"
                    >
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {exclusions.internal && exclusions.anonymous ? 'Internal, Anonymous' :
                         exclusions.internal ? 'Internal users' :
                         exclusions.anonymous ? 'Anonymous users' :
                         'None'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    </button>
                    {exclusionDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50"
                    >
                      <div className="p-2">
                        <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempExclusions.internal}
                            onChange={(e) => setTempExclusions(prev => ({ ...prev, internal: e.target.checked }))}
                            className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-purple-600 dark:checked:bg-purple-500 checked:border-purple-600 dark:checked:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Internal users</span>
                        </label>
                        <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempExclusions.anonymous}
                            onChange={(e) => setTempExclusions(prev => ({ ...prev, anonymous: e.target.checked }))}
                            className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 checked:bg-purple-600 dark:checked:bg-purple-500 checked:border-purple-600 dark:checked:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Anonymous users</span>
                        </label>
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              </div>

              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={setDateRange}
              />

              <button
                onClick={async () => {
                  if (activeTab === 'events') {
                    // For Raw Events tab, only refresh KPIs (EventsTable has its own refresh)
                    setLoading(true);
                    await fetchSummary();
                    setLoading(false);
                  } else {
                    // For other tabs, refresh everything
                    fetchData(true);
                    fetchComparisons();
                    fetchSummary();
                  }
                }}
                disabled={loading}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* KPIs Grid - Collapsible - Always show structure */}
        {!summaryCollapsed && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Business Health */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Signups</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {summaryData ? formatNumber(summaryData.signups.value) : (
                    <div className="h-8 w-16 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded"></div>
                  )}
                </div>
                {summaryData && summaryData.signups.direction !== 'neutral' && (
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
                  {summaryData ? formatCurrency(summaryData.revenue.value) : (
                    <div className="h-8 w-20 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded"></div>
                  )}
                </div>
                {summaryData && summaryData.revenue.direction !== 'neutral' && (
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
                  {summaryData ? formatNumber(summaryData.sessions.value) : (
                    <div className="h-8 w-16 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded"></div>
                  )}
                </div>
                {summaryData && summaryData.sessions.direction !== 'neutral' && (
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
                  {summaryData ? formatPercent(summaryData.completionRate.value) : (
                    <div className="h-8 w-16 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded"></div>
                  )}
                </div>
                {summaryData && summaryData.completionRate.direction !== 'neutral' && (
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
                  {summaryData ? formatLatency(summaryData.avgLatency.value) : (
                    <div className="h-8 w-20 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded"></div>
                  )}
                </div>
                {summaryData && summaryData.avgLatency.direction !== 'neutral' && (
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
                  {summaryData ? formatNumber(summaryData.errorCount.value) : (
                    <div className="h-8 w-12 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded"></div>
                  )}
                </div>
                {summaryData && summaryData.errorCount.direction !== 'neutral' && (
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

        {/* Loading State - For Raw Events tab only (above tabs) */}
        {loading && activeTab === 'events' && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-600 dark:text-slate-400 animate-spin" />
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

        {/* Loading State - For other tabs (below tabs) */}
        {loading && activeTab !== 'events' && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-600 dark:text-slate-400 animate-spin" />
          </div>
        )}

        {/* Business Tab */}
        {!loading && activeTab === 'business' && businessData && (
          <div className="space-y-6 relative">
            {/* Refreshing overlay */}
            {refreshing && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-start justify-center pt-8">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Refreshing data...</span>
                </div>
              </div>
            )}
            {/* Business Conversion Funnel Section */}
            {businessData.conversionFunnel && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                  Conversion Funnel
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 italic">
                  How are conversion metrics trending compared to the prior period?
                </p>

                {/* Conversion Funnel Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                  <StatsCard
                    icon={Eye}
                    label="Visitors"
                    value={comparisons.visitors?.change ? `${comparisons.visitors.change.percent > 0 ? '+' : ''}${comparisons.visitors.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.visitors}
                    color="purple"
                  />
                  <StatsCard
                    icon={Activity}
                    label="Engaged"
                    value={comparisons.engaged?.change ? `${comparisons.engaged.change.percent > 0 ? '+' : ''}${comparisons.engaged.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.engaged}
                    color="purple"
                  />
                  <StatsCard
                    icon={UserPlus}
                    label="Signups"
                    value={comparisons.signups?.change ? `${comparisons.signups.change.percent > 0 ? '+' : ''}${comparisons.signups.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.signups}
                    color="purple"
                  />
                  <StatsCard
                    icon={Mail}
                    label="Verified"
                    value={comparisons.verified?.change ? `${comparisons.verified.change.percent > 0 ? '+' : ''}${comparisons.verified.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.verified}
                    color="purple"
                  />
                  <StatsCard
                    icon={Zap}
                    label="Activated"
                    value={comparisons.activated?.change ? `${comparisons.activated.change.percent > 0 ? '+' : ''}${comparisons.activated.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.activated}
                    color="purple"
                  />
                  <StatsCard
                    icon={Gift}
                    label="Trials"
                    value={comparisons.trials?.change ? `${comparisons.trials.change.percent > 0 ? '+' : ''}${comparisons.trials.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.trials}
                    color="purple"
                  />
                  <StatsCard
                    icon={DollarSign}
                    label="Paid"
                    value={comparisons.paid?.change ? `${comparisons.paid.change.percent > 0 ? '+' : ''}${comparisons.paid.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.paid}
                    color="purple"
                  />
                </div>

                {/* Conversion Funnel Chart */}
                <ChartSection
                  title="Business Conversion Funnel"
                  question="How do visitors progress through the conversion funnel?"
                  height={450}
                  tableData={businessData.conversionFunnel.stages ? Object.entries(businessData.conversionFunnel.stages).map(([stage, data]) => ({
                    stage,
                    count: data.count,
                    percentage: ((data.count / (businessData.conversionFunnel.stages.visitors?.count || 1)) * 100),
                  })) : []}
                  tableColumns={[
                    { key: 'stage', label: 'Stage', format: (val) => {
                      const labels = {
                        visitors: 'Visitors',
                        engaged: 'Engaged (Used Product)',
                        signups: 'Signups',
                        emailVerified: 'Email Verified',
                        activated: 'Activated (First Doc)',
                        trials: 'Trial Started',
                        paid: 'Paid',
                      };
                      return labels[val] || val;
                    }},
                    { key: 'count', label: 'Count', format: formatNumber },
                    { key: 'percentage', label: '% of Visitors', format: (val) => formatPercent(val) },
                  ]}
                >
                  <div className="space-y-4">
                    {/* Funnel visualization as stacked bars */}
                    {['visitors', 'engaged', 'signups', 'emailVerified', 'activated', 'trials', 'paid'].map((stage, index) => {
                      const stageData = businessData.conversionFunnel.stages?.[stage];
                      const maxCount = businessData.conversionFunnel.stages?.visitors?.count || 1;
                      const percentage = maxCount > 0 ? (stageData?.count / maxCount) * 100 : 0;
                      const colors = ['bg-purple-600 dark:bg-purple-500', 'bg-indigo-600 dark:bg-indigo-500', 'bg-blue-600 dark:bg-blue-500', 'bg-cyan-600 dark:bg-cyan-500', 'bg-teal-600 dark:bg-teal-500', 'bg-amber-600 dark:bg-amber-500', 'bg-green-600 dark:bg-green-500'];
                      const labels = ['Visitors', 'Engaged (Used Product)', 'Signups', 'Email Verified', 'Activated (First Doc)', 'Trial Started', 'Paid'];

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
                                style={{ width: `${Math.min(Math.max(percentage, 2), 100)}%` }}
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
                                      <div className="w-24 text-xs text-slate-500 dark:text-slate-400 text-right">Trial Program</div>
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

            {/* Trial Program Export Section */}
            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Trial Program Metrics Export
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Export comprehensive campaign metrics including trial breakdowns, conversion rates, and cohort analysis for investor reporting.
              </p>

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label htmlFor="export-start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="export-start-date"
                    value={campaignExportDates.startDate instanceof Date ? campaignExportDates.startDate.toISOString().split('T')[0] : campaignExportDates.startDate}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      setCampaignExportDates(prev => ({ ...prev, startDate: newDate }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  />
                </div>

                <div className="flex-1">
                  <label htmlFor="export-end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="export-end-date"
                    value={campaignExportDates.endDate instanceof Date ? campaignExportDates.endDate.toISOString().split('T')[0] : campaignExportDates.endDate}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      setCampaignExportDates(prev => ({ ...prev, endDate: newDate }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={async () => {
                    try {
                      const token = getToken();
                      if (!token) {
                        console.error('No auth token available');
                        return;
                      }

                      // Format dates as YYYY-MM-DD
                      const startDateStr = campaignExportDates.startDate instanceof Date
                        ? campaignExportDates.startDate.toISOString().split('T')[0]
                        : campaignExportDates.startDate;
                      const endDateStr = campaignExportDates.endDate instanceof Date
                        ? campaignExportDates.endDate.toISOString().split('T')[0]
                        : campaignExportDates.endDate;

                      const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/admin/trial-programs/export?startDate=${startDateStr}&endDate=${endDateStr}&campaignSource=auto_campaign`,
                        {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        }
                      );

                      if (!response.ok) {
                        throw new Error(`Export failed: ${response.statusText}`);
                      }

                      const result = await response.json();
                      const data = result.data;

                      // Helper function to escape CSV fields
                      const escapeCSV = (field) => {
                        if (field == null) return '';
                        const stringField = String(field);
                        // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
                        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                          return `"${stringField.replace(/"/g, '""')}"`;
                        }
                        return stringField;
                      };

                      // Convert to CSV format
                      const csvRows = [];

                      // Trial Program metadata section
                      csvRows.push('CAMPAIGN METRICS EXPORT');
                      csvRows.push('');
                      csvRows.push('Trial Program Information');
                      csvRows.push(`Date Range,${escapeCSV(data.trialProgram.startDate + ' to ' + data.trialProgram.endDate)}`);
                      csvRows.push(`Trial Program Source,${escapeCSV(data.trialProgram.source)}`);

                      // Handle multiple campaigns
                      if (data.trialProgram.campaigns && data.trialProgram.trialPrograms.length > 0) {
                        csvRows.push(`Active Campaigns,${data.trialProgram.count}`);
                        csvRows.push('');
                        csvRows.push('Trial Program,Trial Tier,Trial Days,Start Date,End Date,Status');
                        data.trialProgram.trialPrograms.forEach(c => {
                          csvRows.push([
                            escapeCSV(c.name),
                            escapeCSV(c.trialTier),
                            c.trialDays,
                            new Date(c.startsAt).toISOString().split('T')[0],
                            c.endsAt ? new Date(c.endsAt).toISOString().split('T')[0] : 'Ongoing',
                            c.isActive ? 'Active' : 'Inactive'
                          ].join(','));
                        });
                      } else {
                        csvRows.push(`Active Campaigns,None`);
                      }
                      csvRows.push('');

                      // Summary metrics section
                      csvRows.push('Summary Metrics');
                      csvRows.push(`Total Signups,${data.summary.total_signups}`);
                      csvRows.push(`Email Verified,${data.summary.verified_users}`);
                      csvRows.push(`Activated Users,${data.summary.activated_users}`);
                      csvRows.push('');

                      // Trial breakdown section
                      csvRows.push('Trial Breakdown');
                      csvRows.push('Trial Type,Trials Started,Conversions,Conversion Rate');
                      csvRows.push(`Trial Program Trials,${data.summary.trials_breakdown.campaign_trials.started},${data.summary.trials_breakdown.campaign_trials.converted},${data.summary.trials_breakdown.campaign_trials.conversion_rate}%`);
                      csvRows.push(`Individual Trials,${data.summary.trials_breakdown.individual_trials.started},${data.summary.trials_breakdown.individual_trials.converted},${data.summary.trials_breakdown.individual_trials.conversion_rate}%`);
                      csvRows.push(`Total Trials,${data.summary.trials_breakdown.total_trials.started},${data.summary.trials_breakdown.total_trials.converted},${data.summary.trials_breakdown.total_trials.conversion_rate}%`);
                      csvRows.push('');

                      // Trial Program performance comparison
                      csvRows.push('Trial Program Performance');
                      csvRows.push(`Trial Program Lift,${data.summary.comparison.campaign_vs_individual.campaign_lift}`);
                      csvRows.push(`Trial Program Performs Better,${data.summary.comparison.campaign_vs_individual.campaign_performs_better ? 'Yes' : 'No'}`);
                      csvRows.push('');

                      // Individual trial sources breakdown
                      if (data.summary.trials_breakdown.individual_trials.by_source && data.summary.trials_breakdown.individual_trials.by_source.length > 0) {
                        csvRows.push('Individual Trial Sources');
                        csvRows.push('Source,Trials Started,Conversions,Conversion Rate');
                        data.summary.trials_breakdown.individual_trials.by_source.forEach(source => {
                          const sourceName = source.source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          csvRows.push(`${escapeCSV(sourceName)},${source.trials_started},${source.conversions},${source.conversion_rate}%`);
                        });
                        csvRows.push('');
                      }

                      // Daily metrics section
                      if (data.daily && data.daily.length > 0) {
                        csvRows.push('Daily Breakdown');
                        csvRows.push('Date,Origin Type,Signups,Verified');
                        data.daily.forEach(day => {
                          csvRows.push(`${day.date},${escapeCSV(day.origin_type || 'Unknown')},${day.signups},${day.verified}`);
                        });
                        csvRows.push('');
                      }

                      // ✨ NEW: Time-to-Value Metrics
                      if (data.extended_metrics?.time_to_value) {
                        csvRows.push('Time-to-Value Metrics');

                        // Email verification timing
                        const emailVerif = data.extended_metrics.time_to_value.email_verification;
                        csvRows.push('Email Verification');
                        csvRows.push(`Total Verified,${emailVerif.total_verified}`);
                        if (emailVerif.avg_hours !== null) {
                          csvRows.push(`Average Hours to Verify,${emailVerif.avg_hours}`);
                          csvRows.push(`Average Days to Verify,${emailVerif.avg_days}`);
                        }
                        if (emailVerif.median_hours !== null) {
                          csvRows.push(`Median Hours to Verify,${emailVerif.median_hours}`);
                        }
                        csvRows.push('');

                        // First generation timing
                        const firstGen = data.extended_metrics.time_to_value.first_generation;
                        csvRows.push('First Generation');
                        csvRows.push(`Total Activated Users,${firstGen.total_activated}`);
                        if (firstGen.avg_hours !== null) {
                          csvRows.push(`Average Hours to First Doc,${firstGen.avg_hours}`);
                          csvRows.push(`Average Days to First Doc,${firstGen.avg_days}`);
                        }
                        if (firstGen.median_hours !== null) {
                          csvRows.push(`Median Hours to First Doc,${firstGen.median_hours}`);
                        }
                        csvRows.push('');
                      }

                      // ✨ NEW: Usage Segment Breakdown
                      if (data.extended_metrics?.usage_segments && data.extended_metrics.usage_segments.length > 0) {
                        csvRows.push('Usage Segment Breakdown');
                        csvRows.push('Segment,Users,Percentage');
                        data.extended_metrics.usage_segments.forEach(segment => {
                          csvRows.push(`${escapeCSV(segment.segment)},${segment.users},${segment.percentage}%`);
                        });
                        csvRows.push('');

                        // Engagement summary
                        const engagement = data.extended_metrics.engagement_summary;
                        csvRows.push('Engagement Summary');
                        csvRows.push(`No Usage,${engagement.no_usage}`);
                        csvRows.push(`Light Users (1-9),${engagement.light_users}`);
                        csvRows.push(`Engaged Users (10-49),${engagement.engaged_users}`);
                        csvRows.push(`Power Users (50-99),${engagement.power_users}`);
                        csvRows.push(`Max Users (100+),${engagement.max_users}`);
                        csvRows.push('');
                      }

                      // ✨ NEW: User List
                      if (data.user_list && data.user_list.length > 0) {
                        csvRows.push('User List');
                        csvRows.push('Email,First Name,Last Name,Current Tier,Origin Type,Signup Date,Email Verified,Trial Tier,Trial Status,Usage Count');
                        data.user_list.forEach(user => {
                          csvRows.push([
                            escapeCSV(user.email),
                            escapeCSV(user.first_name || ''),
                            escapeCSV(user.last_name || ''),
                            escapeCSV(user.tier || 'free'),
                            escapeCSV(user.origin_type || 'Unknown'),
                            user.signup_date ? new Date(user.signup_date).toISOString().split('T')[0] : '',
                            user.email_verified ? 'Yes' : 'No',
                            escapeCSV(user.trial_tier || '-'),
                            escapeCSV(user.trial_status || '-'),
                            user.usage_count || 0
                          ].join(','));
                        });
                        csvRows.push('');
                      }

                      // Create CSV blob and download
                      const csvContent = csvRows.join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `campaign-export-${startDateStr}-to-${endDateStr}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);

                      console.log('[Trial Program Export] Successfully exported campaign metrics as CSV');
                    } catch (error) {
                      console.error('[Trial Program Export] Error:', error);
                    }
                  }}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-md transition-colors font-medium"
                >
                  Export Trial Program Metrics
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Downloads a CSV file with trial breakdown (campaign vs individual), conversion rates, cohort analysis, daily metrics by origin type, <strong>time-to-value metrics</strong> (email verification, first generation), <strong>usage segments</strong> (engagement levels), and <strong>complete user list</strong> with origin attribution. Opens directly in Excel or Google Sheets.
              </p>
            </div>

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
            <TrendChartSection
              title="New Signups Over Time"
              question="Are signups growing or declining?"
              data={timeSeriesData.signups}
              valueLabel="Signups"
              isDark={isDark}
              color={isDark ? '#4ade80' : '#22c55e'}
            />

            {/* Revenue Trend */}
            <TrendChartSection
              title="Revenue Over Time"
              question="What's our revenue trend?"
              data={timeSeriesData.revenue}
              valueLabel="Revenue"
              valueType="currency"
              isDark={isDark}
              color={isDark ? '#60a5fa' : '#3b82f6'}
            />

            {/* Upgrades by Tier */}
            {businessData.upgradesByTier && Object.keys(businessData.upgradesByTier).length > 0 && (
              <BarChartSection
                title="Upgrades by Tier"
                question="Which tiers are users upgrading to?"
                data={Object.entries(businessData.upgradesByTier).map(([tier, count]) => ({
                  name: tier,
                  count,
                }))}
                itemLabels={{
                  starter: 'Starter',
                  pro: 'Pro',
                  team: 'Team',
                  enterprise: 'Enterprise',
                }}
                isDark={isDark}
                horizontal={false}
              />
            )}
          </div>
        )}

        {/* Usage Tab */}
        {!loading && activeTab === 'usage' && usageData && (
          <div className="space-y-8 relative">
            {/* Refreshing overlay */}
            {refreshing && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-start justify-center pt-8">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Refreshing data...</span>
                </div>
              </div>
            )}
            {/* ================================================================
                GROUP 1: Traffic & Engagement
                Who's using the product and how often?
                ================================================================ */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Traffic & Engagement
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                  Who's using the product and how often?
                </p>
              </div>

              {/* User Retention Metrics */}
              {usageData.retentionMetrics && (
                <>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
                    Note: Metrics track authenticated users only. Anonymous users cannot be tracked across sessions. Compared to immediately prior period of equal length.
                  </p>
                </>
              )}

              {/* Session and Generation Trends */}
              {funnelData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sessions Trend */}
                  <TrendChartSection
                    title="Sessions Over Time"
                    question="What's the engagement trend?"
                    data={timeSeriesData.sessions}
                    valueLabel="Sessions"
                    isDark={isDark}
                  />

                  {/* Generations Trend */}
                  <TrendChartSection
                    title="Generations Over Time"
                    question="Are users completing workflows?"
                    data={timeSeriesData.generations}
                    valueLabel="Generations"
                    isDark={isDark}
                  />
                </div>
              )}
            </div>

            {/* ================================================================
                GROUP 2: Workflow Funnel
                Where do users drop off in the documentation workflow?
                ================================================================ */}
            {funnelData && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Workflow Funnel
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                    How are workflow metrics trending compared to the prior period?
                  </p>
                </div>

                {/* Workflow Funnel Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatsCard
                    icon={Activity}
                    label="Sessions Started"
                    value={comparisons.sessions?.change ? `${comparisons.sessions.change.percent > 0 ? '+' : ''}${comparisons.sessions.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.sessions}
                    color="purple"
                  />
                  <StatsCard
                    icon={FileText}
                    label="Code Input"
                    value={comparisons.code_input?.change ? `${comparisons.code_input.change.percent > 0 ? '+' : ''}${comparisons.code_input.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.code_input}
                    color="purple"
                  />
                  <StatsCard
                    icon={RefreshCw}
                    label="Gen Started"
                    value={comparisons.generations?.change ? `${comparisons.generations.change.percent > 0 ? '+' : ''}${comparisons.generations.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.generations}
                    color="purple"
                  />
                  <StatsCard
                    icon={CheckCircle}
                    label="Gen Completed"
                    value={comparisons.completed_sessions?.change ? `${comparisons.completed_sessions.change.percent > 0 ? '+' : ''}${comparisons.completed_sessions.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.completed_sessions}
                    color="purple"
                  />
                  <StatsCard
                    icon={ArrowDownToLine}
                    label="Copied/Downloaded"
                    value={comparisons.doc_export?.change ? `${comparisons.doc_export.change.percent > 0 ? '+' : ''}${comparisons.doc_export.change.percent.toFixed(1)}%` : 'N/A'}
                    subValue="vs prior period"
                    comparison={comparisons.doc_export}
                    color="purple"
                  />
                </div>

                {/* Session Drop-off Analysis */}
                <ChartSection
                  title="Session Drop-off by Stage"
                  question="Where are users abandoning the workflow?"
                  height={250}
                  tableData={funnelData.stages ? Object.entries(funnelData.stages).map(([stage, data]) => ({
                    stage,
                    sessions: data.sessions,
                    percentage: ((data.sessions / (funnelData.stages.session_start?.sessions || 1)) * 100),
                  })) : []}
                  tableColumns={[
                    { key: 'stage', label: 'Stage', format: (val) => {
                      const labels = {
                        session_start: 'Sessions Started',
                        code_input: 'Code Input',
                        generation_started: 'Generation Started',
                        generation_completed: 'Generation Completed',
                        doc_export: 'Copied/Downloaded',
                      };
                      return labels[val] || val;
                    }},
                    { key: 'sessions', label: 'Sessions', format: formatNumber },
                    { key: 'percentage', label: '% of Total', format: (val) => formatPercent(val) },
                  ]}
                >
                  <div className="space-y-4">
                    {['session_start', 'code_input', 'generation_started', 'generation_completed', 'doc_export'].map((stage, index) => {
                      const stageData = funnelData.stages?.[stage];

                      // Calculate percentage relative to first stage (original sessions)
                      const firstStageCount = funnelData.stages?.session_start?.sessions || 1;
                      const percentage = firstStageCount > 0 ? ((stageData?.sessions || 0) / firstStageCount) * 100 : 0;

                      const colors = ['bg-purple-600 dark:bg-purple-500', 'bg-indigo-600 dark:bg-indigo-500', 'bg-blue-600 dark:bg-blue-500', 'bg-amber-600 dark:bg-amber-500', 'bg-green-600 dark:bg-green-500'];
                      const labels = ['Sessions Started', 'Code Input', 'Generation Started', 'Generation Completed', 'Copied/Downloaded'];

                      return (
                        <div key={stage}>
                          <div className="flex items-center gap-4">
                            <div className="w-40 text-sm text-slate-600 dark:text-slate-400 text-right">
                              {labels[index]}
                            </div>
                            <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                              <div
                                className={`h-full ${colors[index]} transition-all duration-500 flex items-center justify-end pr-2`}
                                style={{ width: `${Math.min(Math.max(percentage, 2), 100)}%` }}
                              >
                                <span className="text-xs font-medium text-white">
                                  {formatNumber(stageData?.sessions || 0)}
                                </span>
                              </div>
                            </div>
                            <div className="w-16 text-sm text-slate-500 dark:text-slate-400">
                              {formatPercent(percentage)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ChartSection>
              </div>
            )}

            {/* ================================================================
                GROUP 3: Input Patterns
                What are users documenting?
                ================================================================ */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Input Patterns
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                  What are users documenting?
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Code Input Methods */}
                <ChartSection
                  title={(() => {
                    const total = usageData.codeInputMethods?.reduce((sum, o) => sum + o.count, 0) || 0;
                    return (
                      <span>
                        Code Input Methods{' '}
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                          ({formatNumber(total)} total)
                        </span>
                      </span>
                    );
                  })()}
                  question="How are users providing code for documentation?"
                  height={200}
                  tableData={usageData.codeInputMethods?.map((method) => {
                    const total = usageData.codeInputMethods.reduce((sum, o) => sum + o.count, 0);
                    return {
                      origin: method.origin,
                      count: method.count,
                      percentage: total > 0 ? (method.count / total) * 100 : 0,
                    };
                  }) || []}
                  tableColumns={[
                    { key: 'origin', label: 'Input Method', format: (val) => {
                      const labels = {
                        default: 'Default Code',
                        github_private: 'Private GitHub',
                        github_public: 'Public GitHub',
                        upload: 'File Upload',
                        sample: 'Sample Code',
                        paste: 'Paste Code',
                      };
                      return labels[val] || val;
                    }},
                    { key: 'count', label: 'Count', format: formatNumber },
                    { key: 'percentage', label: 'Percentage', format: (val) => formatPercent(val) },
                  ]}
                >
                  {usageData.codeInputMethods && usageData.codeInputMethods.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        const originLabels = {
                          default: 'Default Code',
                          github_private: 'Private GitHub',
                          github_public: 'Public GitHub',
                          upload: 'File Upload',
                          sample: 'Sample Code',
                          paste: 'Paste Code',
                        };
                        const originIcons = {
                          default: '⚙️',
                          github_private: '🔒',
                          github_public: '🌐',
                          upload: '📁',
                          sample: '📝',
                          paste: '📋',
                        };
                        const total = usageData.codeInputMethods.reduce((sum, o) => sum + o.count, 0);
                        return usageData.codeInputMethods.map((method) => {
                          const percent = total > 0 ? (method.count / total) * 100 : 0;
                          return (
                            <div key={method.origin} className="flex items-center gap-3">
                              <span className="text-lg w-6">{originIcons[method.origin] || '📄'}</span>
                              <span className="text-sm text-slate-700 dark:text-slate-300 w-32">
                                {originLabels[method.origin] || method.origin}
                              </span>
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                                <div
                                  className="bg-purple-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 w-12 text-right">
                                {method.count}
                              </span>
                              <span className="text-sm text-slate-500 dark:text-slate-400 w-14 text-right">
                                {formatPercent(percent)}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                      No code input data available
                    </div>
                  )}
                </ChartSection>

                {/* Top Languages */}
                <SuccessChartSection
                  title="Top Languages"
                  question="Which languages are users documenting?"
                  data={usageData.languages}
                  itemKey="language"
                  chartType="language"
                  isDark={isDark}
                />
              </div>
            </div>

            {/* ================================================================
                GROUP 4: Generation Outcomes
                What gets generated and how?
                ================================================================ */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Generation Outcomes
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                  What gets generated and how?
                </p>
              </div>

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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doc Types */}
                <SuccessChartSection
                  title="Documentation Types"
                  question="Which doc types are most used?"
                  data={usageData.docTypes}
                  itemKey="type"
                  chartType="docType"
                  isDark={isDark}
                />

                {/* Export Sources */}
                <ChartSection
                  title={(() => {
                    const total = usageData.exportSources?.reduce((sum, s) => sum + s.count, 0) || 0;
                    return (
                      <span>
                        Export Sources{' '}
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                          ({formatNumber(total)} total)
                        </span>
                      </span>
                    );
                  })()}
                  question="Are users exporting fresh docs or exporting from history?"
                  height={150}
                  tableData={usageData.exportSources?.map((source) => {
                    const total = usageData.exportSources.reduce((sum, s) => sum + s.count, 0);
                    return {
                      source: source.source,
                      count: source.count,
                      percentage: total > 0 ? (source.count / total) * 100 : 0,
                    };
                  }) || []}
                  tableColumns={[
                    { key: 'source', label: 'Export Source', format: (val) => {
                      const labels = {
                        fresh: 'Fresh Generation',
                        cached: 'Cache/History',
                      };
                      return labels[val] || val;
                    }},
                    { key: 'count', label: 'Count', format: formatNumber },
                    { key: 'percentage', label: 'Percentage', format: (val) => formatPercent(val) },
                  ]}
                >
                  {usageData.exportSources && usageData.exportSources.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        const sourceLabels = {
                          fresh: 'Fresh Generation',
                          cached: 'Cache/History',
                        };
                        const sourceIcons = {
                          fresh: '✨',
                          cached: '💾',
                        };
                        const total = usageData.exportSources.reduce((sum, s) => sum + s.count, 0);
                        return usageData.exportSources.map((source) => {
                          const percent = total > 0 ? (source.count / total) * 100 : 0;
                          return (
                            <div key={source.source} className="flex items-center gap-3">
                              <span className="text-lg w-6">{sourceIcons[source.source] || '📄'}</span>
                              <span className="text-sm text-slate-700 dark:text-slate-300 w-28">
                                {sourceLabels[source.source] || source.source}
                              </span>
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                                <div
                                  className="bg-green-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 w-12 text-right">
                                {source.count}
                              </span>
                              <span className="text-sm text-slate-500 dark:text-slate-400 w-14 text-right">
                                {formatPercent(percent)}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                      No export source data available
                    </div>
                  )}
                </ChartSection>
              </div>
            </div>

            {/* ================================================================
                GROUP 5: Quality Analysis
                How good is the output?
                ================================================================ */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Quality Analysis
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                  How good is the output?
                </p>
              </div>

              {/* Quality Score Analysis - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quality Score Distribution */}
                <DistributionChartSection
                  title="Quality Score Distribution"
                  question="How good is the generated documentation?"
                  data={usageData.qualityScores}
                  isDark={isDark}
                />

                {/* Quality Scores by Doc Type Heatmap */}
                {usageData.qualityScoresByDocType && usageData.qualityScoresByDocType.length > 0 && (
                  <HeatmapChartSection
                    title="Quality Scores by Documentation Type"
                    question="How do quality scores vary by doc type and model?"
                    data={usageData.qualityScoresByDocType}
                  >
                    {/* Model Filter */}
                    <div className="mb-4 flex items-center gap-3">
                      <label
                        htmlFor="model-filter"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Model:
                      </label>
                      <select
                        id="model-filter"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Models</option>
                        <option value="claude">Claude</option>
                        <option value="openai">OpenAI</option>
                      </select>
                    </div>

                    <QualityHeatmap
                      data={usageData.qualityScoresByDocType}
                      isDark={isDark}
                      height={300}
                    />
                  </HeatmapChartSection>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {!loading && activeTab === 'performance' && performanceData && (
          <div className="space-y-8 relative">
            {/* Refreshing overlay */}
            {refreshing && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-start justify-center pt-8">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Refreshing data...</span>
                </div>
              </div>
            )}
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
                  height={280}
                  tableData={[
                    { metric: 'Average TTFT', value: performanceData.latencyBreakdown.avgTtftMs },
                    { metric: 'Median TTFT', value: performanceData.latencyBreakdown.medianTtftMs },
                    { metric: 'P95 TTFT', value: performanceData.latencyBreakdown.p95TtftMs },
                    { metric: 'Average Streaming', value: performanceData.latencyBreakdown.avgStreamingMs },
                    { metric: 'Average Total', value: performanceData.latencyBreakdown.avgTotalMs },
                    { metric: 'Average TPOT', value: performanceData.latencyBreakdown.avgTpotMs },
                  ]}
                  tableColumns={[
                    { key: 'metric', label: 'Metric' },
                    { key: 'value', label: 'Time (ms)', format: (v) => formatNumber(v) },
                  ]}
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

              <MultiLineTrendChartSection
                title="Latency Trend (Total, TTFT, Streaming)"
                question="How has response time changed over time?"
                series={[
                  {
                    name: 'Total Latency',
                    data: timeSeriesData.latency || [],
                    valueType: 'latency',
                  },
                  {
                    name: 'Time to First Token',
                    data: timeSeriesData.ttft || [],
                    valueType: 'latency',
                  },
                  {
                    name: 'Streaming Time',
                    data: timeSeriesData.streamingTime || [],
                    valueType: 'latency',
                  },
                ]}
                isDark={isDark}
              />
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

              <TrendChartSection
                title="Cache Hit Rate Trend"
                question="Is caching improving over time?"
                data={timeSeriesData.cacheHitRate}
                valueLabel="Cache Hit Rate"
                valueType="percent"
                isDark={isDark}
                height={200}
              />
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

              <TrendChartSection
                title="Throughput Trend"
                question="Is throughput consistent over time?"
                data={timeSeriesData.throughput}
                valueLabel="Throughput (tok/s)"
                isDark={isDark}
                height={200}
              />
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
            excludeInternal={exclusions.internal}
            excludeAnonymous={exclusions.anonymous}
          />
        )}
      </div>
    </PageLayout>
  );
}
