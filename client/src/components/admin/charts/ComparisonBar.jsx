/**
 * ComparisonBar Component
 * Displays horizontal bar chart for comparing categories
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { getThemeColors, barColors, tooltipStyle, formatNumber } from './chartTheme';

/**
 * Custom tooltip
 */
const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;

  const style = isDark ? tooltipStyle.dark : tooltipStyle.light;
  const data = payload[0].payload;

  return (
    <div style={style} className="p-3">
      <p className="font-medium text-slate-900 dark:text-slate-100">
        {data.name || data.label}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Count: <span className="font-semibold text-purple-600 dark:text-purple-400">
          {formatNumber(data.value)}
        </span>
      </p>
      {data.percentage !== undefined && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.percentage.toFixed(1)}% of total
        </p>
      )}
    </div>
  );
};

/**
 * ComparisonBar Component
 * @param {Object} props
 * @param {Array} props.data - Array of { name/label, value } objects
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {number} props.height - Chart height in pixels
 * @param {boolean} props.horizontal - Whether to render horizontal bars
 * @param {boolean} props.showLabels - Whether to show value labels on bars
 * @param {string} props.labelKey - Key to use for labels (name or label)
 */
export default function ComparisonBar({
  data,
  isDark = false,
  height = 250,
  horizontal = true,
  showLabels = true,
  labelKey = 'name',
}) {
  const theme = getThemeColors(isDark);
  const colors = isDark ? barColors.dark : barColors.light;

  // Calculate percentages and sort by value
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    const total = data.reduce((sum, item) => sum + (item.value || item.count || 0), 0);

    return data
      .map((item) => ({
        name: item[labelKey] || item.name || item.label || item.type || 'Unknown',
        value: item.value || item.count || 0,
        percentage: total > 0 ? ((item.value || item.count || 0) / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, labelKey]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No data available
      </div>
    );
  }

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatNumber}
            stroke={theme.textMuted}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={theme.textMuted}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip content={<CustomTooltip isDark={isDark} />} isAnimationActive={false} cursor={false} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            animationDuration={500}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
            {showLabels && (
              <LabelList
                dataKey="value"
                position="right"
                formatter={formatNumber}
                fill={theme.text}
                fontSize={12}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Vertical bars
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="name"
          stroke={theme.textMuted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatNumber}
          stroke={theme.textMuted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} isAnimationActive={false} cursor={false} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={500}>
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
          {showLabels && (
            <LabelList
              dataKey="value"
              position="top"
              formatter={formatNumber}
              fill={theme.text}
              fontSize={12}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
