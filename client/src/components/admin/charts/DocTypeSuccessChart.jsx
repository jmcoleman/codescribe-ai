/**
 * DocTypeSuccessChart Component
 * Combo chart showing successful/failed generations (stacked bars) and success rate (line)
 * Follows BI best practices for volume + rate visualization
 */

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getThemeColors, tooltipStyle, formatNumber, formatPercent } from './chartTheme';

/**
 * Custom tooltip
 */
const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;

  const style = isDark ? tooltipStyle.dark : tooltipStyle.light;
  const data = payload[0]?.payload;

  return (
    <div style={style} className="p-3">
      <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">
        {data.type}
      </p>
      <div className="space-y-1">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Successful: <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatNumber(data.successful)}
          </span>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Failed: <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatNumber(data.failed)}
          </span>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-600">
          Success Rate: <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatPercent(data.successRate)}
          </span>
        </p>
      </div>
    </div>
  );
};

/**
 * DocTypeSuccessChart Component
 * @param {Object} props
 * @param {Array} props.data - Array of { type, successful, failed, total, successRate } objects
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {number} props.height - Chart height in pixels
 */
export default function DocTypeSuccessChart({
  data,
  isDark = false,
  height = 300,
}) {
  const theme = getThemeColors(isDark);

  // Sort by total (successful + failed) descending
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    return [...data].sort((a, b) => b.total - a.total);
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="type"
          stroke={theme.textMuted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {/* Left Y-axis for counts */}
        <YAxis
          yAxisId="left"
          tickFormatter={formatNumber}
          stroke={theme.textMuted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Generations', angle: -90, position: 'insideLeft', style: { fill: theme.textMuted, fontSize: 12 } }}
        />
        {/* Right Y-axis for success rate % */}
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          stroke={theme.textMuted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Success Rate', angle: 90, position: 'insideRight', style: { fill: theme.textMuted, fontSize: 12 } }}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} isAnimationActive={false} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          iconType="rect"
        />
        {/* Successful generations bar (bottom of stack) */}
        <Bar
          yAxisId="left"
          dataKey="successful"
          name="Successful"
          fill={isDark ? '#a855f7' : '#9333ea'}
          stackId="stack"
          animationDuration={500}
        />
        {/* Failed generations bar (top of stack) */}
        <Bar
          yAxisId="left"
          dataKey="failed"
          name="Failed"
          fill={isDark ? '#fb923c' : '#f97316'}
          stackId="stack"
          radius={[4, 4, 0, 0]}
          animationDuration={500}
        />
        {/* Success rate line - rendered last to appear on top */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="successRate"
          name="Success Rate (%)"
          stroke={isDark ? '#3b82f6' : '#2563eb'}
          strokeWidth={3}
          dot={{ fill: isDark ? '#3b82f6' : '#2563eb', r: 5, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          animationDuration={500}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
