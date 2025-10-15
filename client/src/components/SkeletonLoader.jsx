/**
 * Reusable skeleton loader component for loading states
 * Provides animated placeholder elements with different variants
 */
export function SkeletonLoader({ variant = 'text', className = '' }) {
  const baseClasses = 'animate-pulse bg-slate-200 rounded';

  const variants = {
    text: 'h-4 w-full',
    'text-short': 'h-4 w-3/4',
    'text-xs': 'h-3 w-1/2',
    heading: 'h-6 w-2/3',
    circle: 'h-3 w-3 rounded-full',
    badge: 'h-6 w-16',
    button: 'h-9 w-24',
    line: 'h-px w-full',
    code: 'h-4 w-11/12 font-mono',
  };

  return <div className={`${baseClasses} ${variants[variant]} ${className}`} />;
}

/**
 * Skeleton loader for CodePanel
 * Shows animated placeholder for code editor loading state
 */
export function CodePanelSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        {/* Left: Traffic lights + filename */}
        <div className="flex items-center gap-3">
          {/* macOS-style traffic lights */}
          <div className="flex gap-2">
            <SkeletonLoader variant="circle" className="animate-pulse" />
            <SkeletonLoader variant="circle" className="animate-pulse" />
            <SkeletonLoader variant="circle" className="animate-pulse" />
          </div>
          <SkeletonLoader variant="text-xs" className="w-24" />
        </div>

        {/* Right: Language badge */}
        <SkeletonLoader variant="badge" className="w-16 h-5" />
      </div>

      {/* Monaco Editor Placeholder */}
      <div className="flex-1 overflow-hidden p-4 space-y-3">
        {/* Simulate code lines */}
        {[...Array(12)].map((_, i) => (
          <SkeletonLoader
            key={i}
            variant="code"
            className="animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
        <SkeletonLoader variant="text-xs" className="w-32" />
        <div className="flex items-center gap-1.5">
          <SkeletonLoader variant="circle" className="w-3 h-3" />
          <SkeletonLoader variant="text-xs" className="w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for DocPanel
 * Shows animated placeholder for documentation loading state
 */
export function DocPanelSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-200">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2">
          <SkeletonLoader variant="circle" className="w-4 h-4" />
          <SkeletonLoader variant="text-xs" className="w-48" />
        </div>

        {/* Right: Buttons placeholder */}
        <div className="flex items-center gap-2">
          <SkeletonLoader variant="button" className="w-20 h-8" />
          <SkeletonLoader variant="button" className="w-24 h-8" />
        </div>
      </div>

      {/* Body - Documentation Content Skeleton */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Heading */}
        <SkeletonLoader variant="heading" className="mb-4" />

        {/* Paragraph lines */}
        <div className="space-y-2">
          <SkeletonLoader variant="text" />
          <SkeletonLoader variant="text" />
          <SkeletonLoader variant="text-short" />
        </div>

        {/* Subheading */}
        <SkeletonLoader variant="heading" className="mb-3 mt-6" />

        {/* Code block placeholder */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          <SkeletonLoader variant="code" />
          <SkeletonLoader variant="code" />
          <SkeletonLoader variant="code" className="w-4/5" />
        </div>

        {/* More paragraph lines */}
        <div className="space-y-2">
          <SkeletonLoader variant="text" />
          <SkeletonLoader variant="text" />
          <SkeletonLoader variant="text" />
          <SkeletonLoader variant="text-short" />
        </div>

        {/* Subheading */}
        <SkeletonLoader variant="heading" className="mb-3 mt-6" />

        {/* List items */}
        <div className="space-y-2 ml-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <SkeletonLoader variant="circle" className="w-1.5 h-1.5" />
              <SkeletonLoader variant="text" className="flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SkeletonLoader variant="text-xs" className="w-28" />
            <SkeletonLoader variant="text-xs" className="w-32" />
          </div>
          <SkeletonLoader variant="text-xs" className="w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for generating state in DocPanel
 * More minimal version focused on the generating experience
 */
export function DocPanelGeneratingSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 text-purple-600 animate-pulse">✨</div>
          <span className="text-sm font-medium text-slate-800">
            Generated Documentation
          </span>
        </div>
      </div>

      {/* Body - Generating Animation */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
          {/* Animated icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 flex items-center justify-center text-4xl animate-bounce">
              ✨
            </div>
          </div>

          {/* Status text */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Generating documentation...</p>
            <p className="text-xs text-slate-500">This may take a few moments</p>
          </div>

          {/* Animated lines representing streaming content */}
          <div className="w-full max-w-md space-y-2 mt-8">
            <SkeletonLoader variant="text" className="animate-pulse" style={{ animationDelay: '0ms' }} />
            <SkeletonLoader variant="text-short" className="animate-pulse" style={{ animationDelay: '100ms' }} />
            <SkeletonLoader variant="text" className="animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
