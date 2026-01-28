/**
 * Chart Section Wrappers
 *
 * Specialized chart components that encapsulate:
 * - Default heights and table configurations
 * - Data transformation logic for table views
 * - Consistent rendering patterns
 *
 * Usage:
 * <TrendChartSection
 *   title="Sessions Over Time"
 *   question="What's the engagement trend?"
 *   data={timeSeriesData.sessions}
 *   valueLabel="Sessions"
 *   isDark={isDark}
 * />
 */

import { useState } from 'react';
import { ChartBar, Table } from 'lucide-react';
import {
  TrendChart,
  MultiLineTrendChart,
  ComparisonBar,
  ScoreDistribution,
  LanguageSuccessChart,
  DocTypeSuccessChart,
  QualityHeatmap,
  formatNumber,
  formatCurrency,
  formatPercent,
} from './charts';

/**
 * Base Chart Section Component
 * For charts with custom rendering that don't fit specialized wrappers
 */
export function ChartSection({ title, question, children, tableData, tableColumns, height = 300 }) {
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
        <div className="overflow-x-auto overflow-y-auto" style={{ height: `${height}px` }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
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
        <div style={{ height: `${height}px` }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Trend Chart Section
 * For time series data (sessions, generations, signups, revenue, etc.)
 */
export function TrendChartSection({
  title,
  question,
  data,
  valueLabel = 'Value',
  valueType = 'number', // 'number' | 'currency' | 'percent'
  isDark,
  height = 250,
  interval = 'day',
  color,
}) {
  const tableData = data || [];
  const tableColumns = [
    { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
    {
      key: 'value',
      label: valueLabel,
      format: valueType === 'currency' ? formatCurrency : valueType === 'percent' ? formatPercent : formatNumber
    },
  ];

  return (
    <ChartSection
      title={title}
      question={question}
      tableData={tableData}
      tableColumns={tableColumns}
      height={height}
    >
      <TrendChart
        data={data}
        isDark={isDark}
        height={height}
        interval={interval}
        valueType={valueType}
        color={color}
      />
    </ChartSection>
  );
}

/**
 * Multi-Line Trend Chart Section
 * For multiple time series on the same chart
 */
export function MultiLineTrendChartSection({
  title,
  question,
  series,
  isDark,
  height = 250,
  interval = 'day',
}) {
  // Default colors for series (purple shades)
  const defaultColors = isDark
    ? ['#a855f7', '#c084fc', '#e9d5ff']
    : ['#9333ea', '#a855f7', '#c084fc'];

  // Transform series to include key, label, and color if not provided
  const transformedSeries = series.map((s, idx) => ({
    key: s.key || s.name?.toLowerCase().replace(/\s+/g, '_'),
    label: s.label || s.name,
    data: s.data,
    color: s.color || defaultColors[idx % defaultColors.length],
    valueType: s.valueType,
  }));

  // Flatten all series data for table view - merge all dates from all series
  const tableData = (() => {
    const dateMap = new Map();

    // Collect all dates from all series
    transformedSeries.forEach(s => {
      if (!s.data) return;
      s.data.forEach(point => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        dateMap.get(point.date)[s.label] = point.value;
      });
    });

    // Convert to array and sort by date (newest first for table view)
    return Array.from(dateMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  })();

  const tableColumns = [
    { key: 'date', label: 'Date', format: (d) => new Date(d).toLocaleDateString() },
    ...transformedSeries.map(s => ({
      key: s.label,
      label: s.label,
      format: s.valueType === 'latency' ? (val) => val != null ? `${val}ms` : '-' : (val) => val != null ? formatNumber(val) : '-',
    })),
  ];

  return (
    <ChartSection
      title={title}
      question={question}
      tableData={tableData}
      tableColumns={tableColumns}
      height={height}
    >
      <MultiLineTrendChart
        series={transformedSeries}
        isDark={isDark}
        height={height}
        interval={interval}
      />
    </ChartSection>
  );
}

/**
 * Funnel Chart Section
 * For conversion/drop-off funnels with horizontal bars
 */
export function FunnelChartSection({
  title,
  question,
  stages,
  stageLabels,
  height = 250,
  children, // Custom render function for the funnel visualization
}) {
  const tableData = Object.entries(stages).map(([stage, data]) => ({
    stage,
    count: data.sessions || data.count,
    percentage: ((data.sessions || data.count) / (Object.values(stages)[0]?.sessions || Object.values(stages)[0]?.count || 1)) * 100,
  }));

  const tableColumns = [
    {
      key: 'stage',
      label: 'Stage',
      format: (val) => stageLabels[val] || val
    },
    { key: 'count', label: 'Count', format: formatNumber },
    { key: 'percentage', label: '% of Total', format: (val) => formatPercent(val) },
  ];

  return (
    <ChartSection
      title={title}
      question={question}
      tableData={tableData}
      tableColumns={tableColumns}
      height={height}
    >
      {children}
    </ChartSection>
  );
}

/**
 * Bar Chart Section
 * For simple horizontal/vertical bar charts
 */
export function BarChartSection({
  title,
  question,
  data,
  itemLabels = {},
  isDark,
  height = 200,
  horizontal = false,
}) {
  const tableData = data.map(item => ({
    item: item.origin || item.source || item.name,
    count: item.count || item.value,
    percentage: item.percentage,
  }));

  const tableColumns = [
    {
      key: 'item',
      label: 'Item',
      format: (val) => itemLabels[val] || val
    },
    { key: 'count', label: 'Count', format: formatNumber },
    ...(data[0]?.percentage != null ? [
      { key: 'percentage', label: 'Percentage', format: (val) => formatPercent(val) }
    ] : []),
  ];

  return (
    <ChartSection
      title={title}
      question={question}
      tableData={tableData}
      tableColumns={tableColumns}
      height={height}
    >
      <ComparisonBar
        data={data.map(item => ({
          name: itemLabels[item.origin || item.source || item.name] || item.origin || item.source || item.name,
          value: item.count || item.value,
        }))}
        isDark={isDark}
        height={height}
        horizontal={horizontal}
      />
    </ChartSection>
  );
}

/**
 * Language/DocType Success Chart Section
 * For charts showing success rates by language or doc type
 */
export function SuccessChartSection({
  title,
  question,
  data,
  itemKey = 'language', // 'language' | 'type'
  chartType = 'language', // 'language' | 'docType'
  isDark,
  height = 300,
}) {
  const tableData = data || [];
  const tableColumns = [
    { key: itemKey, label: itemKey === 'language' ? 'Language' : 'Doc Type' },
    { key: 'successful', label: 'Successful', format: formatNumber },
    { key: 'failed', label: 'Failed', format: formatNumber },
    { key: 'total', label: 'Total', format: formatNumber },
    { key: 'successRate', label: 'Success Rate', format: (val) => formatPercent(val) },
  ];

  const ChartComponent = chartType === 'language' ? LanguageSuccessChart : DocTypeSuccessChart;

  return (
    <ChartSection
      title={title}
      question={question}
      tableData={tableData}
      tableColumns={tableColumns}
      height={height}
    >
      <ChartComponent
        data={data}
        isDark={isDark}
        height={height}
      />
    </ChartSection>
  );
}

/**
 * Score Distribution Chart Section
 * For quality score distribution histogram
 */
export function DistributionChartSection({
  title,
  question,
  data,
  isDark,
  height = 250,
}) {
  const tableData = data || [];
  const tableColumns = [
    { key: 'range', label: 'Score Range' },
    { key: 'count', label: 'Count', format: formatNumber },
  ];

  return (
    <ChartSection
      title={title}
      question={question}
      tableData={tableData}
      tableColumns={tableColumns}
      height={height}
    >
      <ScoreDistribution
        data={data}
        isDark={isDark}
        height={height}
      />
    </ChartSection>
  );
}

/**
 * Heatmap Chart Section
 * For quality scores by doc type heatmap
 */
export function HeatmapChartSection({
  title,
  question,
  data,
  height = 300,
  children, // For additional controls like model filter
}) {
  const tableData = data || [];
  const tableColumns = [
    { key: 'docType', label: 'Doc Type' },
    { key: 'avgScore', label: 'Avg Score', format: (val) => val != null ? val.toFixed(1) : 'N/A' },
    { key: 'count', label: 'Count', format: formatNumber },
  ];

  return (
    <ChartSection
      title={title}
      question={question}
      tableData={tableData}
      tableColumns={tableColumns}
      height={height}
    >
      {children}
    </ChartSection>
  );
}
