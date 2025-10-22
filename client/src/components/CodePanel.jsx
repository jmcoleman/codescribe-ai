import { lazy, Suspense } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { CopyButton } from './CopyButton';

// Lazy load Monaco Editor to reduce initial bundle size
const LazyMonacoEditor = lazy(() =>
  import('./LazyMonacoEditor').then(module => ({ default: module.LazyMonacoEditor }))
);

// Loading fallback component with skeleton UI
function EditorLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" aria-hidden="true" />
        <p className="text-sm text-slate-600">Loading editor...</p>
      </div>
    </div>
  );
}

export function CodePanel({
  code,
  onChange,
  filename = 'code.js',
  language = 'javascript',
  readOnly = false
}) {
  // Count lines and characters
  const lines = code.split('\n').length;
  const chars = code.length;

  return (
    <div data-testid="code-panel" className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-slate-50 border-b border-slate-200">
        <h2 className="sr-only">Code Input</h2>
        {/* Left: Traffic lights + filename */}
        <div className="flex items-center gap-3">
          {/* macOS-style traffic lights */}
          <div className="flex gap-2" role="presentation" aria-hidden="true">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-sm text-slate-600">{filename}</span>
        </div>

        {/* Right: Language badge + Copy button */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 uppercase">{language}</span>
          {code && (
            <CopyButton
              text={code}
              size="md"
              variant="outline"
              ariaLabel="Copy code to clipboard"
            />
          )}
        </div>
      </div>

      {/* Monaco Editor - Lazy loaded */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<EditorLoadingFallback />}>
          <LazyMonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={onChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              readOnly,
              automaticLayout: true,
              padding: { top: 24, bottom: 16 },
              ariaLabel: readOnly ? 'Code editor, read-only' : 'Code editor, type or paste your code here',
            }}
            theme="vs-light"
          />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
        <span className="text-xs text-slate-600">
          {lines} lines • {chars} chars
        </span>
        <div className="flex items-center gap-1.5 text-xs">
          <Zap className="w-3 h-3 text-purple-500" aria-hidden="true" />
          <span className="text-slate-600">Ready to analyze</span>
        </div>
      </div>
    </div>
  );
}