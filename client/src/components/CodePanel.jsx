import { lazy, Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Zap, Loader2, Upload, RefreshCw, BookOpen, MoreVertical, Copy, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';
import { Tooltip } from './Tooltip';
import { ViewModeToggle } from './ViewModeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { getLanguageDisplayName } from '../constants/languages';
import { sanitizeFilename } from '../utils/fileValidation';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../constants/storage';
import './CodePanel.css';

// Get scrollbar width from CSS variable
const getScrollbarWidth = () => {
  const width = getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-width').trim();
  return parseInt(width) || 8; // fallback to 8px
};

// Lazy load Monaco Editor to reduce initial bundle size
const LazyMonacoEditor = lazy(() =>
  import('./LazyMonacoEditor').then(module => ({ default: module.LazyMonacoEditor }))
);

// Lazy load PHI Editor Enhancer
const LazyPHIEditorEnhancer = lazy(() =>
  import('./PHIEditorEnhancer').then(module => ({ default: module.PHIEditorEnhancer }))
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
  samplesButtonRef,
  phiDetection = null,
  onPhiResolved = null
}) {
  const { effectiveTheme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage, default to 'raw'
    return getStorageItem(STORAGE_KEYS.VIEW_MODE_CODE, 'raw');
  });
  const mobileMenuRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Persist viewMode to localStorage
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.VIEW_MODE_CODE, viewMode);
  }, [viewMode]);

  // Detect if file is markdown
  const isMarkdown = filename && /\.(md|markdown)$/i.test(filename);

  // Track previous filename to detect actual changes
  const previousFilenameRef = useRef(filename);

  // Reset to raw view when filename actually changes (not just prop update)
  useEffect(() => {
    if (previousFilenameRef.current !== filename) {
      setViewMode('raw');
      previousFilenameRef.current = filename;
    }
  }, [filename]);

  // Handle editor mount - store references
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }, []);

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
    // Only enable drag-and-drop if onFileDrop is provided (disabled in multi-file mode)
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
      // Process the first file (single-file mode only)
      onFileDrop(files[0]);
    }
  };

  return (
    <div
      data-testid="code-panel"
      className="@container flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden relative transition-colors"
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
          <Tooltip content={filename}>
            <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{filename}</span>
          </Tooltip>
        </div>

        {/* Right: Desktop buttons + Mobile menu */}
        <div className="flex items-center gap-2">
          {/* Desktop: Show all buttons when container is wide enough */}
          {/* Wide screens: Icon + Label */}
          <div className="@[600px]:flex hidden items-center gap-2">
            {onSamplesClick && (
              <Tooltip content="Load sample code">
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-909"
                  aria-label="Load sample code"
                >
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>Samples</span>
                </button>
              </Tooltip>
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
                ariaLabel="Copy code"
                showLabel={true}
              />
            )}
            {code && !readOnly && onClear && (
              <Tooltip content="Clear code">
                <button
                  type="button"
                  onClick={() => {
                    setIsClearing(true);
                    onClear();
                    // Reset clearing state after animation completes
                    setTimeout(() => setIsClearing(false), 500);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${isClearing ? 'opacity-75 pointer-events-none' : ''}`}
                  aria-label="Clear code"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 flex-shrink-0 ${isClearing ? 'animate-spin-once' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Clear</span>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Medium screens: Icon only */}
          <div className="@[450px]:flex @[600px]:hidden hidden items-center gap-2">
            {onSamplesClick && (
              <Tooltip content="Load sample code">
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
                  aria-label="Load sample code"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>
            )}
            {code && (
              <DownloadButton
                content={code}
                filename={sanitizeFilename(filename)}
                size="md"
                variant="outline"
                ariaLabel="Export code"
                showLabel={false}
              />
            )}
            {code && (
              <CopyButton
                text={code}
                size="md"
                variant="outline"
                ariaLabel="Copy code"
                showLabel={false}
              />
            )}
            {code && !readOnly && onClear && (
              <Tooltip content="Clear code">
                <button
                  type="button"
                  onClick={() => {
                    setIsClearing(true);
                    onClear();
                    // Reset clearing state after animation completes
                    setTimeout(() => setIsClearing(false), 500);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${isClearing ? 'opacity-75 pointer-events-none' : ''}`}
                  aria-label="Clear code"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin-once' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </Tooltip>
            )}
          </div>

          {/* Mobile/Narrow: Overflow menu - show when buttons are hidden */}
          <div className="@[450px]:hidden relative" ref={mobileMenuRef}>
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
                    aria-label="Load sample code"
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
                    aria-label="Copy code"
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
                    aria-label="Clear code"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isClearing ? 'animate-spin-once' : ''}`}
                      aria-hidden="true"
                    />
                    <span>Clear</span>
                  </button>
                )}
                {(onSamplesClick || code) && canGenerate && onGenerate && (
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1" role="separator" />
                )}
                {canGenerate && onGenerate && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onGenerate();
                      setShowMobileMenu(false);
                    }}
                    disabled={isGenerating || !code.trim()}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-inset"
                    aria-label="Generate from code in editor"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Toggle - Sub-header (only for markdown files) */}
      {isMarkdown && code && (
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      )}

      {/* Monaco Editor or Markdown Preview */}
      <div
        className="flex-1 min-h-0 overflow-hidden relative"
        style={{
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        }}
      >
        {isMarkdown && viewMode === 'rendered' ? (
          /* Markdown Preview */
          <div className="absolute inset-0 overflow-y-auto bg-white dark:bg-slate-900">
            <style>{`
              /* Override prose inline code styling for better dark mode contrast */
              .dark .prose :where(code):not(:where([class~="not-prose"] *)) {
                background-color: rgb(30 41 59); /* slate-800 */
                color: rgb(165 243 252); /* cyan-200 */
              }
            `}</style>
            <div className="prose prose-slate dark:prose-invert max-w-none px-6 pt-0 pb-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {code}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          /* Monaco Editor with focusable wrapper */
          <div
            className="absolute inset-0 monaco-editor-wrapper"
            tabIndex={0}
            role="region"
            aria-label="Code editor - press Enter to edit, Escape to exit"
            onKeyDown={(e) => {
              // Enter or any typing key activates the editor
              if (e.key === 'Enter' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                if (editorRef.current) {
                  editorRef.current.focus();
                  // If it was a typing key, let it through to the editor
                  if (e.key.length === 1) {
                    // Don't prevent default - let the key reach the editor
                    return;
                  }
                }
              }
            }}
            onClick={() => {
              // Click also activates editor
              if (editorRef.current) {
                editorRef.current.focus();
              }
            }}
          >
            <Suspense fallback={<EditorLoadingFallback />}>
              <LazyMonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={onChange}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  readOnly,
                  automaticLayout: true,
                  padding: { top: 8, bottom: 16 },
                  ariaLabel: readOnly ? 'Code editor, read-only' : 'Code editor, type or paste your code here',
                  bracketPairColorization: { enabled: false }, // Disable bracket colorization
                  unusualLineTerminators: 'off', // Silently accept unusual line terminators from various sources
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalScrollbarSize: getScrollbarWidth(),
                    horizontalScrollbarSize: getScrollbarWidth(),
                  },
                  glyphMargin: true, // Enable glyph margin for PHI icons
                }}
                theme={effectiveTheme === 'dark' ? 'codescribe-dark' : 'codescribe-light'}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* PHI Editor Enhancer - Bottom Panel */}
      {phiDetection?.containsPHI && editorRef.current && monacoRef.current && !readOnly && (
        <Suspense fallback={null}>
          <LazyPHIEditorEnhancer
            editorInstance={editorRef.current}
            monacoInstance={monacoRef.current}
            phiDetection={phiDetection}
            code={code}
            onCodeChange={onChange}
            onPhiResolved={onPhiResolved}
            effectiveTheme={effectiveTheme}
          />
        </Suspense>
      )}

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