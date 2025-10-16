export function RateLimitIndicator({ remaining, limit }) {
  const percentage = (remaining / limit) * 100;
  const isLow = percentage < 30;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <span className={isLow ? 'text-red-600' : 'text-slate-500'}>
          {remaining}/{limit} requests remaining
        </span>
      </div>
      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${isLow ? 'bg-red-600' : 'bg-purple-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}