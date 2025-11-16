import { lazy, Suspense, useState, useEffect, memo } from 'react';

// Lazy load the Mermaid renderer to reduce initial bundle size
const LazyMermaidRenderer = lazy(() =>
  import('./LazyMermaidRenderer').then(module => ({ default: module.LazyMermaidRenderer }))
);

// Loading fallback for when Mermaid library is being loaded
function MermaidLoadingFallback() {
  return (
    <div className="not-prose my-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg min-h-[300px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-2"></div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading diagram renderer...</p>
      </div>
    </div>
  );
}

/**
 * MermaidDiagram component renders Mermaid diagrams from text
 * Uses lazy loading to reduce initial bundle size
 * @param {Object} props
 * @param {string} props.chart - Mermaid diagram syntax
 * @param {string} props.id - Unique identifier for this diagram
 * @param {boolean} props.autoShow - If true, automatically show diagram (default: false)
 */
export const MermaidDiagram = memo(function MermaidDiagram({ chart, id, autoShow = false }) {
  const [showDiagram, setShowDiagram] = useState(autoShow);

  // Auto-show diagram when autoShow prop changes to true
  useEffect(() => {
    if (autoShow) {
      setShowDiagram(true);
    }
  }, [autoShow]);

  // Show button to load diagram
  if (!showDiagram) {
    return (
      <div className="not-prose my-6 w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
        <div className="flex items-center justify-between gap-4 p-4">
          {/* Left side: Icon + Text */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Diagram Available
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Click to render visualization
              </p>
            </div>
          </div>

          {/* Right side: Button */}
          <button
            type="button"
            onClick={() => setShowDiagram(true)}
            className="flex-shrink-0 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 active:bg-purple-800 dark:active:bg-purple-700 shadow-lg shadow-purple-600/20 dark:shadow-purple-500/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            Show
          </button>
        </div>
      </div>
    );
  }

  // Once user clicks "Show", lazy load the Mermaid renderer
  return (
    <Suspense fallback={<MermaidLoadingFallback />}>
      <LazyMermaidRenderer chart={chart} id={id} />
    </Suspense>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if chart or id changes
  // Ignore autoShow changes to prevent unnecessary re-renders
  return prevProps.chart === nextProps.chart && prevProps.id === nextProps.id;
});
