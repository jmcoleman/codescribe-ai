/**
 * ScoreDistribution Component
 * Displays quality score distribution as a bar chart
 * Uses grade-based colors (A=green, B=blue, C=yellow, D=orange, F=red)
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
import { getThemeColors, tooltipStyle, formatNumber } from './chartTheme';

/**
 * Score range to grade mapping
 */
const rangeToGrade = {
  '90-100': 'A',
  '80-89': 'B',
  '70-79': 'C',
  '60-69': 'D',
  '0-59': 'F',
};

/**
 * Grade colors
 */
const gradeColors = {
  light: {
    A: '#22c55e', // green-500
    B: '#3b82f6', // blue-500
    C: '#eab308', // yellow-500
    D: '#f97316', // orange-500
    F: '#ef4444', // red-500
  },
  dark: {
    A: '#4ade80', // green-400
    B: '#60a5fa', // blue-400
    C: '#facc15', // yellow-400
    D: '#fb923c', // orange-400
    F: '#f87171', // red-400
  },
};

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
        Score: {data.range} (Grade {data.grade})
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Count: <span className="font-semibold">{formatNumber(data.count)}</span>
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
 * ScoreDistribution Component
 * @param {Object} props
 * @param {Array} props.data - Array of { range, count } objects
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {number} props.height - Chart height in pixels
 */
export default function ScoreDistribution({ data, isDark = false, height = 250 }) {
  const theme = getThemeColors(isDark);
  const colors = isDark ? gradeColors.dark : gradeColors.light;

  // Transform and sort data
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Expected order of ranges
    const rangeOrder = ['90-100', '80-89', '70-79', '60-69', '0-59'];
    const total = data.reduce((sum, item) => sum + (item.count || 0), 0);

    // Create a map for quick lookup
    const dataMap = data.reduce((acc, item) => {
      acc[item.range] = item.count || 0;
      return acc;
    }, {});

    return rangeOrder.map((range) => ({
      range,
      grade: rangeToGrade[range],
      count: dataMap[range] || 0,
      percentage: total > 0 ? ((dataMap[range] || 0) / total) * 100 : 0,
      color: colors[rangeToGrade[range]],
    }));
  }, [data, colors]);

  if (!chartData.length || chartData.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No quality score data available
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="range"
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={500}>
            {chartData.map((entry) => (
              <Cell key={entry.range} fill={entry.color} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              formatter={formatNumber}
              fill={theme.text}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Grade legend */}
      <div className="mt-4 flex justify-center gap-4 text-xs">
        {Object.entries(rangeToGrade).map(([range, grade]) => (
          <div key={range} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: colors[grade] }}
            />
            <span className="text-slate-600 dark:text-slate-400">
              {grade} ({range})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
