/**
 * ConversionFunnel Component
 * Displays conversion funnel stages using Recharts Funnel
 */

import { useMemo } from 'react';
import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { funnelColors, tooltipStyle, formatNumber, formatPercent } from './chartTheme';

/**
 * Custom label renderer - positions labels centered within each segment
 */
const CustomLabel = ({ x, y, width, height, value, isDark }) => {
  // Position label to the right of the funnel
  const labelX = x + width + 16;
  // Center vertically within the segment
  const labelY = y + (height || 0) / 2;

  return (
    <text
      x={labelX}
      y={labelY}
      fill={isDark ? '#f1f5f9' : '#1e293b'}
      fontSize={12}
      dominantBaseline="middle"
      textAnchor="start"
    >
      {value}
    </text>
  );
};

/**
 * Custom tooltip for funnel
 */
const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const style = isDark ? tooltipStyle.dark : tooltipStyle.light;

  return (
    <div style={style} className="p-3">
      <p className="font-medium text-slate-900 dark:text-slate-100">
        {data.name}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Sessions: {formatNumber(data.value)}
      </p>
      {data.conversionRate !== undefined && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Conversion: {formatPercent(data.conversionRate)}
        </p>
      )}
    </div>
  );
};

/**
 * ConversionFunnel Component
 * @param {Object} props
 * @param {Object} props.data - Funnel data with stages and conversionRates
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {number} props.height - Chart height in pixels
 */
export default function ConversionFunnel({ data, isDark = false, height = 300 }) {
  // Transform data for Recharts Funnel
  const chartData = useMemo(() => {
    if (!data?.stages) return [];

    const stageLabels = {
      session_start: 'Sessions',
      code_input: 'Code Input',
      generation_started: 'Gen Started',
      generation_completed: 'Gen Completed',
      doc_copied: 'Copied/Downloaded',
    };

    const stages = ['session_start', 'code_input', 'generation_started', 'generation_completed', 'doc_copied'];
    const colors = isDark ? funnelColors.dark : funnelColors.light;

    return stages.map((stage, index) => {
      const stageData = data.stages[stage] || { sessions: 0 };
      const nextStage = stages[index + 1];
      const conversionKey = nextStage ? `${stage}_to_${nextStage}` : null;

      return {
        name: stageLabels[stage],
        value: stageData.sessions,
        fill: colors[index],
        conversionRate: conversionKey ? data.conversionRates?.[conversionKey] : undefined,
      };
    });
  }, [data, isDark]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No funnel data available
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <FunnelChart margin={{ top: 10, right: 120, bottom: 10, left: 10 }}>
          <Tooltip content={<CustomTooltip isDark={isDark} />} isAnimationActive={false} />
          <Funnel
            dataKey="value"
            data={chartData}
            isAnimationActive
            animationDuration={500}
          >
            <LabelList
              dataKey="name"
              content={(props) => <CustomLabel {...props} isDark={isDark} />}
            />
            <LabelList
              position="center"
              fill="#ffffff"
              stroke="none"
              dataKey="value"
              formatter={formatNumber}
              fontSize={14}
              fontWeight="bold"
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>

      {/* Conversion rates below funnel */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
        {chartData.slice(0, -1).map((stage) => (
          <div key={stage.name} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <div className="text-slate-500 dark:text-slate-400 text-xs">
              {stage.name} &rarr;
            </div>
            <div className="font-semibold text-purple-600 dark:text-purple-400">
              {stage.conversionRate !== undefined ? formatPercent(stage.conversionRate) : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
