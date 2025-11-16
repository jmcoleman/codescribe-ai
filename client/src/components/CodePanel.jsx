import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Zap, Loader2, Upload, RefreshCw, BookOpen, MoreVertical, Copy, Download } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';
import { useTheme } from '../contexts/ThemeContext';
import { getLanguageDisplayName } from '../constants/languages';
import { sanitizeFilename } from '../utils/fileValidation';

// Get scrollbar width from CSS variable
const getScrollbarWidth = () => {
  const width = getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-width').trim();
  return parseInt(width) || 8; // fallback to 8px
};

// Lazy load Monaco Editor to reduce initial bundle size
const LazyMonacoEditor = lazy(() =>
  import('./LazyMonacoEditor').then(module => ({ default: module.LazyMonacoEditor }))
);

// Loading fallback component with skeleton UI
function EditorLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-800">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 dark:text-purple-400 animate-spin" aria-hidden="true" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading editor...</p>
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
  onClear,
  onSamplesClick,
  samplesButtonRef
}) {
  const { effectiveTheme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  // Count lines, characters, and calculate file size
  const lines = code.split('\n').length;
  const chars = code.length;
  const bytes = new Blob([code]).size;

  // Click-outside detection for mobile menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    }
    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMobileMenu]);

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
      className="@container flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden relative transition-colors"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors">
        <h2 className="sr-only">Code Input</h2>
        {/* Screen reader announcement for clear action */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {isClearing && 'Editor cleared'}
        </div>
        {/* Left: Filename */}
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 truncate" title={filename}>{filename}</span>
        </div>

        {/* Right: Desktop buttons + Mobile menu */}
        <div className="flex items-center gap-2">
          {/* Desktop: Show all buttons when container is wide enough */}
          <div className="@[600px]:flex hidden items-center gap-2">
            {onSamplesClick && (
              <button
                type="button"
                ref={samplesButtonRef}
                onClick={() => {
                  // Preload SamplesModal on click
                  import('./SamplesModal').catch(() => {});
                  onSamplesClick();
                }}
                onMouseEnter={() => {
                  // Preload SamplesModal on hover
                  import('./SamplesModal').catch(() => {});
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                aria-label="Load code samples"
                title="Load code samples"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Samples</span>
              </button>
            )}
            {code && (
              <DownloadButton
                content={code}
                filename={sanitizeFilename(filename)}
                size="md"
                variant="outline"
                ariaLabel="Export code"
                showLabel={true}
              />
            )}
            {code && (
              <CopyButton
                text={code}
                size="md"
                variant="outline"
                ariaLabel="Copy code to clipboard"
                showLabel={true}
              />
            )}
            {code && !readOnly && onClear && (
              <button
                type="button"
                onClick={() => {
                  setIsClearing(true);
                  onClear();
                  // Reset clearing state after animation completes
                  setTimeout(() => setIsClearing(false), 500);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${isClearing ? 'opacity-75 pointer-events-none' : ''}`}
                aria-label="Clear editor"
                title="Clear editor"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin-once' : ''}`}
                  aria-hidden="true"
                />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Mobile/Narrow: Overflow menu - show when buttons are hidden */}
          <div className="@[600px]:hidden relative" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              aria-label="More actions"
              aria-expanded={showMobileMenu}
              aria-haspopup="menu"
            >
              <MoreVertical className="w-4 h-4" aria-hidden="true" />
            </button>

            {showMobileMenu && (
              <div
                role="menu"
                aria-label="Code panel actions"
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50"
              >
                {onSamplesClick && (
                  <button
                    type="button"
                    role="menuitem"
                    ref={samplesButtonRef}
                    onClick={() => {
                      import('./SamplesModal').catch(() => {});
                      onSamplesClick();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-inset"
                    aria-label="Load code samples"
                  >
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    <span>Samples</span>
                  </button>
                )}
                {onSamplesClick && code && (
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1" role="separator" />
                )}
                {code && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      // Create a blob and download
                      const blob = new Blob([code], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      // Use the actual filename shown in the header (sanitized)
                      a.download = sanitizeFilename(filename);
                      a.click();
                      URL.revokeObjectURL(url);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-inset"
                    aria-label="Export code"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Export</span>
                  </button>
                )}
                {code && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={async () => {
                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(code);
                        } else {
                          const textArea = document.createElement('textarea');
                          textArea.value = code;
                          textArea.style.position = 'fixed';
                          textArea.style.left = '-999999px';
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          textArea.remove();
                        }
                        setShowMobileMenu(false);
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-inset"
                    aria-label="Copy code to clipboard"
                  >
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>Copy</span>
                  </button>
                )}
                {code && !readOnly && onClear && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsClearing(true);
                      onClear();
                      setTimeout(() => setIsClearing(false), 500);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-inset ${isClearing ? 'opacity-75 pointer-events-none' : ''}`}
                    aria-label="Clear editor"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isClearing ? 'animate-spin-once' : ''}`}
                      aria-hidden="true"
                    />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monaco Editor - Lazy loaded */}
      <div
        className="flex-1 min-h-0 overflow-hidden relative"
        style={{
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        }}
      >
        <div className="absolute inset-0">
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
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalScrollbarSize: getScrollbarWidth(),
                  horizontalScrollbarSize: getScrollbarWidth(),
                },
              }}
              theme={effectiveTheme === 'dark' ? 'codescribe-dark' : 'codescribe-light'}
            />
          </Suspense>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span>{lines} lines</span>
          <span className="@[400px]:inline hidden">•</span>
          <span className="@[400px]:inline hidden">{chars} chars</span>
          <span className="@[500px]:inline hidden">•</span>
          <span className="@[500px]:inline hidden">{formatBytes(bytes)}</span>
          <span>•</span>
          <span className="capitalize">{getLanguageDisplayName(language)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-2 py-1">
          <Zap className="w-3 h-3 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
          <span className="@[450px]:inline hidden text-cyan-600 dark:text-cyan-400 font-medium">Ready to analyze</span>
        </div>
      </div>

      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-500/10 dark:bg-purple-400/20 backdrop-blur-sm border-2 border-dashed border-purple-500 dark:border-purple-400 rounded-xl flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 text-purple-600 dark:text-purple-400">
            <Upload className="w-12 h-12" aria-hidden="true" />
            <p className="text-lg font-semibold">Drop file to upload</p>
            <p className="text-sm text-purple-500 dark:text-purple-300">Release to load your code</p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}