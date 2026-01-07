/**
 * DateRangePicker Component
 * Provides preset and custom date range selection
 */

import { useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

/**
 * Get date range from preset
 * @param {string} preset - Preset name
 * @returns {{ startDate: Date, endDate: Date }}
 */
const getPresetRange = (preset) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: tomorrow };

    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { startDate: start, endDate: tomorrow };
    }

    case 'last30days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { startDate: start, endDate: tomorrow };
    }

    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: tomorrow };
    }

    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: end };
    }

    default:
      return { startDate: today, endDate: tomorrow };
  }
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format date for input value
 * @param {Date} date - Date to format
 * @returns {string} YYYY-MM-DD format
 */
const formatInputDate = (date) => {
  return date.toISOString().split('T')[0];
};

const PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];

/**
 * DateRangePicker Component
 * @param {Object} props
 * @param {Date} props.startDate - Selected start date
 * @param {Date} props.endDate - Selected end date
 * @param {Function} props.onChange - Callback when range changes ({ startDate, endDate })
 */
export default function DateRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(formatInputDate(startDate));
  const [customEnd, setCustomEnd] = useState(formatInputDate(endDate));

  // Determine current preset based on dates
  const currentPreset = useMemo(() => {
    for (const preset of PRESETS.slice(0, -1)) {
      const range = getPresetRange(preset.value);
      if (
        startDate.getTime() === range.startDate.getTime() &&
        endDate.getTime() === range.endDate.getTime()
      ) {
        return preset.value;
      }
    }
    return 'custom';
  }, [startDate, endDate]);

  const handlePresetClick = (preset) => {
    if (preset === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(getPresetRange(preset));
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setDate(end.getDate() + 1); // Include end date
    onChange({ startDate: start, endDate: end });
    setIsOpen(false);
    setShowCustom(false);
  };

  const displayText = useMemo(() => {
    const preset = PRESETS.find((p) => p.value === currentPreset);
    if (preset && preset.value !== 'custom') {
      return preset.label;
    }
    return `${formatDate(startDate)} - ${formatDate(new Date(endDate.getTime() - 1))}`;
  }, [currentPreset, startDate, endDate]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {displayText}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowCustom(false);
            }}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50">
            <div className="p-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentPreset === preset.value
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {showCustom && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <button
                    onClick={handleCustomApply}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
