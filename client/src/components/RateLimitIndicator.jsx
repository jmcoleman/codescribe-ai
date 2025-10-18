export function RateLimitIndicator({ remaining, limit }) {
  const percentage = (remaining / limit) * 100;
  const isLow = percentage < 30;

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Live Region for Screen Reader Warnings */}
      {isLow && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          Warning: Only {remaining} of {limit} requests remaining
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className={isLow ? 'text-red-600' : 'text-slate-500'}>
          {remaining}/{limit} requests remaining
        </span>
        {isLow && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Low
          </span>
        )}
      </div>

      {/* Progress Bar with ARIA Attributes */}
      <div
        className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`Rate limit: ${remaining} of ${limit} requests remaining`}
      >
        <div
          className={`h-full transition-all ${isLow ? 'bg-red-600' : 'bg-purple-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}