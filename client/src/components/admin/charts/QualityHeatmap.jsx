/**
 * QualityHeatmap Component
 * Heatmap showing quality score distribution across documentation types
 * Follows BI best practices for categorical cross-analysis
 */

import { useMemo } from 'react';
import { getThemeColors, tooltipStyle, formatNumber } from './chartTheme';

/**
 * QualityHeatmap Component
 * @param {Object} props
 * @param {Array} props.data - Array of { docType, scoreRange, count } objects
 * @param {boolean} props.isDark - Whether dark mode is active
 * @param {number} props.height - Chart height in pixels
 */
export default function QualityHeatmap({
  data,
  isDark = false,
  height = 400,
}) {
  const theme = getThemeColors(isDark);

  // Transform data into heatmap matrix
  const { matrix, docTypes, scoreRanges, maxCount } = useMemo(() => {
    if (!data?.length) return { matrix: {}, docTypes: [], scoreRanges: [], maxCount: 0 };

    // Extract unique doc types and score ranges
    const docTypeSet = new Set();
    const scoreRangeSet = new Set();
    let max = 0;

    data.forEach((item) => {
      if (item.docType) docTypeSet.add(item.docType);
      if (item.scoreRange) scoreRangeSet.add(item.scoreRange);
      if (item.count > max) max = item.count;
    });

    // Sort score ranges in descending order
    const sortedRanges = Array.from(scoreRangeSet).sort((a, b) => {
      const order = ['90-100', '80-89', '70-79', '60-69', '0-59'];
      return order.indexOf(a) - order.indexOf(b);
    });

    const sortedDocTypes = Array.from(docTypeSet).sort();

    // Build matrix
    const matrixData = {};
    data.forEach((item) => {
      const key = `${item.docType}_${item.scoreRange}`;
      matrixData[key] = item.count;
    });

    return {
      matrix: matrixData,
      docTypes: sortedDocTypes,
      scoreRanges: sortedRanges,
      maxCount: max,
    };
  }, [data]);

  // Get color intensity based on count - enterprise-grade purple sequential scale
  const getColor = (count) => {
    if (!count || maxCount === 0) {
      return isDark ? '#1e293b' : '#f8fafc'; // Empty cell (slate-800 / slate-50)
    }

    const intensity = count / maxCount;

    if (isDark) {
      // Dark mode: subtle, professional purple progression (brand-aligned)
      if (intensity <= 0.15) return '#581c87'; // purple-900
      if (intensity <= 0.3) return '#6b21a8'; // purple-800
      if (intensity <= 0.45) return '#7e22ce'; // purple-700
      if (intensity <= 0.6) return '#9333ea'; // purple-600
      if (intensity <= 0.75) return '#a855f7'; // purple-500
      if (intensity <= 0.9) return '#c084fc'; // purple-400
      return '#d8b4fe'; // purple-300 (max)
    } else {
      // Light mode: clean, minimal purple progression (brand-aligned)
      if (intensity <= 0.15) return '#faf5ff'; // purple-50
      if (intensity <= 0.3) return '#f3e8ff'; // purple-100
      if (intensity <= 0.45) return '#e9d5ff'; // purple-200
      if (intensity <= 0.6) return '#d8b4fe'; // purple-300
      if (intensity <= 0.75) return '#c084fc'; // purple-400
      if (intensity <= 0.9) return '#a855f7'; // purple-500
      return '#9333ea'; // purple-600 (max)
    }
  };

  // Get text color for optimal readability on purple sequential scale
  const getTextColor = (count) => {
    if (!count) return isDark ? '#64748b' : '#94a3b8';

    const intensity = count / maxCount;

    if (isDark) {
      // Dark mode: white text on dark/medium purples, dark text on light purples
      if (intensity > 0.9) return '#0f172a'; // purple-300 (lightest) → dark text
      return '#ffffff'; // purple-900 through purple-400 → white text
    } else {
      // Light mode: dark text on light purples, white text on dark purples
      if (intensity <= 0.6) return '#0f172a'; // purple-50/100/200/300 → dark text
      return '#ffffff'; // purple-400/500/600 → white text
    }
  };

  if (!docTypes.length || !scoreRanges.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No data available
      </div>
    );
  }

  const cellHeight = 50;
  const headerHeight = 60;

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Header - Score Ranges */}
        <div className="flex">
          {/* Empty cell for label column */}
          <div className="w-32 flex-shrink-0" style={{ height: headerHeight }} />

          {/* Score range headers */}
          {scoreRanges.map((range) => (
            <div
              key={range}
              className="flex-1 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-300"
              style={{ height: headerHeight, maxWidth: '80px' }}
            >
              {range}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        {docTypes.map((docType) => (
          <div key={docType} className="flex">
            {/* Row Label - Doc Type */}
            <div
              className="w-32 flex-shrink-0 flex items-center justify-end pr-3 text-xs font-medium text-slate-700 dark:text-slate-300"
              style={{ height: cellHeight }}
            >
              {docType}
            </div>

            {/* Cells */}
            {scoreRanges.map((range) => {
              const key = `${docType}_${range}`;
              const count = matrix[key] || 0;
              const bgColor = getColor(count);
              const textColor = getTextColor(count);

              return (
                <div
                  key={range}
                  className="flex-1 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 cursor-pointer"
                  style={{
                    height: cellHeight,
                    maxWidth: '80px',
                    backgroundColor: bgColor,
                    color: textColor,
                  }}
                  title={`${docType} - ${range}: ${formatNumber(count)} generations`}
                >
                  <span className="text-sm font-semibold">
                    {count > 0 ? formatNumber(count) : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span>Lower</span>
          <div className="flex gap-1">
            {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0].map((intensity, idx) => {
              const dummyCount = Math.ceil(intensity * (maxCount || 100));
              return (
                <div
                  key={idx}
                  className="w-6 h-4 border border-slate-300 dark:border-slate-600"
                  style={{
                    backgroundColor: getColor(dummyCount),
                  }}
                />
              );
            })}
          </div>
          <span>Higher</span>
        </div>
      </div>
    </div>
  );
}
