/**
 * TrendChart Component
 * Displays time series data as an area chart
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getThemeColors, tooltipStyle, formatNumber, formatCurrency } from './chartTheme';

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
 * Custom tooltip
 */
const CustomTooltip = ({ active, payload, label, isDark, valueFormatter, interval }) => {
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
      <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
        {formattedDate}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Value: <span className="font-semibold text-purple-600 dark:text-purple-400">
          {valueFormatter(payload[0].value)}
        </span>
      </p>
    </div>
  );
};

/**
 * TrendChart Component
 * @param {Object} props
 * @param {Array} props.data - Array of { date, value } objects
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {number} props.height - Chart height in pixels
 * @param {string} props.interval - day, week, or month
 * @param {string} props.valueType - number or currency
 * @param {string} props.color - Override color (optional)
 */
export default function TrendChart({
  data,
  isDark = false,
  height = 250,
  interval = 'day',
  valueType = 'number',
  color,
}) {
  const theme = getThemeColors(isDark);
  const chartColor = color || theme.primary;

  const valueFormatter = useMemo(() => {
    return valueType === 'currency' ? formatCurrency : formatNumber;
  }, [valueType]);

  // Sort data by date
  const sortedData = useMemo(() => {
    if (!data?.length) return [];
    return [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  if (!sortedData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No data available for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${chartColor}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={valueFormatter}
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
              valueFormatter={valueFormatter}
              interval={interval}
            />
          }
          isAnimationActive={false}
          trigger="item"
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={chartColor}
          strokeWidth={2}
          fill={`url(#gradient-${chartColor})`}
          animationDuration={500}
          dot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: chartColor, stroke: isDark ? '#1e293b' : '#ffffff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
