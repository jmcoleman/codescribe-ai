export function ErrorBanner({ error, retryAfter, onDismiss }) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          {retryAfter && (
            <p className="text-red-600 text-xs mt-2">
              Please wait {retryAfter} seconds before trying again.
            </p>
          )}
        </div>
        <button 
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 text-xl font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}