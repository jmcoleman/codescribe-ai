import { lazy, Suspense, useState } from 'react';
import { Zap, Loader2, Upload, RefreshCw } from 'lucide-react';
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
  readOnly = false,
  onFileDrop,
  onClear
}) {
  const [isDragging, setIsDragging] = useState(false);

  // Count lines and characters
  const lines = code.split('\n').length;
  const chars = code.length;

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!readOnly && onFileDrop) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the CodePanel entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (readOnly || !onFileDrop) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Currently only process the first file
      // TODO: Future enhancement - support multiple file uploads
      onFileDrop(files[0]);
    }
  };

  return (
    <div
      data-testid="code-panel"
      className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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

        {/* Right: Language badge + Clear + Copy buttons */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-cyan-800 bg-cyan-100 border border-cyan-300 rounded-md uppercase">{language}</span>
          {code && !readOnly && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-2 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all duration-200 hover:scale-[1.05] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 motion-reduce:transition-none"
              aria-label="Clear editor"
              title="Clear editor"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
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
      <div
        className="flex-1 overflow-hidden"
        style={{
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        }}
      >
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
              bracketPairColorization: { enabled: false }, // Disable bracket colorization
            }}
            theme="codescribe-light"
          />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
        <span className="text-xs text-slate-600">
          {lines} lines • {chars} chars
        </span>
        <div className="flex items-center gap-1.5 text-xs">
          <Zap className="w-3 h-3 text-cyan-600" aria-hidden="true" />
          <span className="text-cyan-600 font-medium">Ready to analyze</span>
        </div>
      </div>

      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-500/10 backdrop-blur-sm border-2 border-dashed border-purple-500 rounded-xl flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 text-purple-600">
            <Upload className="w-12 h-12" aria-hidden="true" />
            <p className="text-lg font-semibold">Drop file to upload</p>
            <p className="text-sm text-purple-500">Release to load your code</p>
          </div>
        </div>
      )}
    </div>
  );
}