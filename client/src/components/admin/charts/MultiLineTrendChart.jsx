/**
 * MultiLineTrendChart Component
 * Displays multiple time series as overlapping line charts
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getThemeColors, tooltipStyle, formatNumber } from './chartTheme';

/**
 * Format date for X axis
 * @param {string} dateStr - ISO date string
 * @param {string} interval - day, week, month
 * @returns {string} Formatted date
 */
const formatDate = (dateStr, interval) => {
  const date = new Date(dateStr);
  switch (interval) {
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short' });
    case 'week':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

/**
 * Custom tooltip for multi-line chart
 */
const CustomTooltip = ({ active, payload, label, isDark, series, interval }) => {
  if (!active || !payload?.length) return null;

  const style = isDark ? tooltipStyle.dark : tooltipStyle.light;
  const date = new Date(label);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: interval === 'month' ? 'numeric' : undefined,
  });

  return (
    <div style={style} className="p-3">
      <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">
        {formattedDate}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const seriesConfig = series.find(s => s.key === entry.dataKey);
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600 dark:text-slate-400">
                {seriesConfig?.label || entry.dataKey}:
              </span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {formatNumber(entry.value)} ms
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Custom legend
 */
const CustomLegend = ({ payload, series }) => {
  return (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry, index) => {
        const seriesConfig = series.find(s => s.key === entry.dataKey);
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 dark:text-slate-400">
              {seriesConfig?.label || entry.dataKey}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * MultiLineTrendChart Component
 * @param {Object} props
 * @param {Array} props.series - Array of { key, label, data, color } objects
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {number} props.height - Chart height in pixels
 * @param {string} props.interval - day, week, or month
 */
export default function MultiLineTrendChart({
  series,
  isDark = false,
  height = 250,
  interval = 'day',
}) {
  const theme = getThemeColors(isDark);

  // Merge all series data into a single array keyed by date
  const mergedData = useMemo(() => {
    if (!series?.length) return [];

    // Collect all unique dates
    const dateMap = new Map();

    series.forEach(s => {
      if (!s.data?.length) return;
      s.data.forEach(point => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        dateMap.get(point.date)[s.key] = point.value;
      });
    });

    // Convert to array and sort by date
    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [series]);

  if (!mergedData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No data available for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDate(d, interval)}
          stroke={theme.textMuted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${formatNumber(v)}`}
          stroke={theme.textMuted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          content={
            <CustomTooltip
              isDark={isDark}
              series={series}
              interval={interval}
            />
          }
          isAnimationActive={false}
        />
        <Legend content={<CustomLegend series={series} />} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: s.color, stroke: isDark ? '#1e293b' : '#ffffff', strokeWidth: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
