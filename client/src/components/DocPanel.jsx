import { Sparkles, CheckCircle, AlertCircle, ChevronDown, ChevronUp, MoreVertical, Download, Copy, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef, memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';
import { DocPanelGeneratingSkeleton } from './SkeletonLoader';
import { MermaidDiagram } from './MermaidDiagram';
import { useTheme } from '../contexts/ThemeContext';

// Custom Prism theme matching Monaco editor theme
const codescribeLightTheme = {
  'code[class*="language-"]': {
    color: '#334155',
    background: 'none',
    textShadow: 'none',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#334155',
    background: 'none',
    textShadow: 'none',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
  },
  'comment': { color: '#94A3B8', fontStyle: 'italic', background: 'none' },
  'prolog': { color: '#94A3B8', background: 'none' },
  'doctype': { color: '#94A3B8', background: 'none' },
  'cdata': { color: '#94A3B8', background: 'none' },
  'punctuation': { color: '#334155', background: 'none' },
  'property': { color: '#334155', background: 'none' },
  'tag': { color: '#334155', background: 'none' },
  'boolean': { color: '#9333EA', background: 'none' },
  'number': { color: '#0891B2', background: 'none' },
  'constant': { color: '#0891B2', background: 'none' },
  'symbol': { color: '#334155', background: 'none' },
  'deleted': { color: '#DC2626', background: 'none' },
  'selector': { color: '#334155', background: 'none' },
  'attr-name': { color: '#334155', background: 'none' },
  'string': { color: '#16A34A', background: 'none' },
  'char': { color: '#16A34A', background: 'none' },
  'builtin': { color: '#334155', background: 'none' },
  'inserted': { color: '#16A34A', background: 'none' },
  'operator': { color: '#334155', background: 'none' },
  'entity': { color: '#334155', background: 'none' },
  'url': { color: '#0891B2', background: 'none' },
  '.language-css .token.string': { color: '#16A34A', background: 'none' },
  '.style .token.string': { color: '#16A34A', background: 'none' },
  'atrule': { color: '#9333EA', background: 'none' },
  'attr-value': { color: '#16A34A', background: 'none' },
  'keyword': { color: '#9333EA', background: 'none' },
  'function': { color: '#334155', background: 'none' },
  'class-name': { color: '#334155', background: 'none' },
  'regex': { color: '#16A34A', background: 'none' },
  'important': { color: '#DC2626', fontWeight: 'bold', background: 'none' },
  'variable': { color: '#334155', background: 'none' },
};

// Dark theme for Prism (Neon Cyberpunk)
const codescribeDarkTheme = {
  'code[class*="language-"]': {
    color: '#E2E8F0',
    background: 'none',
    textShadow: 'none',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#E2E8F0',
    background: 'none',
    textShadow: 'none',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
  },
  'comment': { color: '#64748B', fontStyle: 'italic', background: 'none' },
  'prolog': { color: '#64748B', background: 'none' },
  'doctype': { color: '#64748B', background: 'none' },
  'cdata': { color: '#64748B', background: 'none' },
  'punctuation': { color: '#E2E8F0', background: 'none' },
  'property': { color: '#E2E8F0', background: 'none' },
  'tag': { color: '#E2E8F0', background: 'none' },
  'boolean': { color: '#C084FC', background: 'none' },
  'number': { color: '#22D3EE', background: 'none' },
  'constant': { color: '#22D3EE', background: 'none' },
  'symbol': { color: '#E2E8F0', background: 'none' },
  'deleted': { color: '#F87171', background: 'none' },
  'selector': { color: '#E2E8F0', background: 'none' },
  'attr-name': { color: '#E2E8F0', background: 'none' },
  'string': { color: '#4ADE80', background: 'none' },
  'char': { color: '#4ADE80', background: 'none' },
  'builtin': { color: '#E2E8F0', background: 'none' },
  'inserted': { color: '#4ADE80', background: 'none' },
  'operator': { color: '#E2E8F0', background: 'none' },
  'entity': { color: '#E2E8F0', background: 'none' },
  'url': { color: '#22D3EE', background: 'none' },
  '.language-css .token.string': { color: '#4ADE80', background: 'none' },
  '.style .token.string': { color: '#4ADE80', background: 'none' },
  'atrule': { color: '#C084FC', background: 'none' },
  'attr-value': { color: '#4ADE80', background: 'none' },
  'keyword': { color: '#C084FC', background: 'none' },
  'function': { color: '#E2E8F0', background: 'none' },
  'class-name': { color: '#E2E8F0', background: 'none' },
  'regex': { color: '#4ADE80', background: 'none' },
  'important': { color: '#F87171', fontWeight: 'bold', background: 'none' },
  'variable': { color: '#E2E8F0', background: 'none' },
};

import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../constants/storage';

export const DocPanel = memo(function DocPanel({
  documentation,
  qualityScore = null,
  isGenerating = false,
  onViewBreakdown,
  onUpload,
  onGithubImport,
  onGenerate,
  onReset
}) {
  const { effectiveTheme } = useTheme();

  // Load initial state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = getStorageItem(STORAGE_KEYS.REPORT_EXPANDED);
    return stored === 'true';
  });

  // Track if documentation was just generated (not loaded from storage)
  const [justGenerated, setJustGenerated] = useState(false);
  const prevGeneratingRef = useRef(isGenerating);

  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  // Track mermaid diagram counter to ensure unique IDs
  const mermaidCounterRef = useRef(0);

  // Ref for auto-scroll behavior during generation
  const contentRef = useRef(null);

  // Close mobile menu when clicking outside
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

  // Reset counter when documentation changes (new generation)
  useEffect(() => {
    mermaidCounterRef.current = 0;
  }, [documentation]);

  // Track when generation completes (isGenerating changes from true to false)
  useEffect(() => {
    if (prevGeneratingRef.current && !isGenerating && documentation) {
      // Generation just completed
      setJustGenerated(true);
      // Reset after announcement
      const timeout = setTimeout(() => setJustGenerated(false), 3000);
      return () => clearTimeout(timeout);
    }
    prevGeneratingRef.current = isGenerating;
  }, [isGenerating, documentation]);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.REPORT_EXPANDED, isExpanded.toString());
  }, [isExpanded]);

  // Auto-scroll during generation when user is near bottom
  // Uses requestAnimationFrame to handle dynamic content height changes (e.g., Mermaid diagrams)
  useEffect(() => {
    if (!isGenerating || !contentRef.current) return;

    let frameId;
    let lastScrollHeight = 0;

    const checkAndScroll = () => {
      const element = contentRef.current;
      if (!element) return;

      const threshold = 100; // pixels from bottom
      const currentScrollHeight = element.scrollHeight;

      // Check if user is near bottom before auto-scrolling
      const isNearBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < threshold;

      // Scroll if near bottom OR if content height changed (e.g., Mermaid diagram rendered)
      if (isNearBottom || currentScrollHeight !== lastScrollHeight) {
        element.scrollTop = element.scrollHeight;
        lastScrollHeight = currentScrollHeight;
      }

      // Continue checking while generating
      frameId = requestAnimationFrame(checkAndScroll);
    };

    frameId = requestAnimationFrame(checkAndScroll);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isGenerating]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  // Memoize ReactMarkdown components to prevent unnecessary re-renders
  const markdownComponents = useMemo(() => ({
    pre({ node, children, ...props }) {
      // Styled pre wrapper that matches our theme
      return (
        <pre
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto p-4 my-4 transition-colors"
          {...props}
        >
          {children}
        </pre>
      );
    },
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');

      // Handle mermaid diagrams
      if (!inline && language === 'mermaid') {
        // Detect incomplete/partial diagrams (common during streaming)
        const looksIncomplete = !codeContent.includes('-->') &&
                               !codeContent.includes('->') &&
                               !codeContent.includes('---') &&
                               codeContent.split('\n').length < 3;

        // Show placeholder if still generating OR diagram looks incomplete
        if (isGenerating || looksIncomplete) {
          return (
            <div className="my-6 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg min-h-[300px] flex items-center justify-center transition-colors">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-2"></div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isGenerating
                    ? 'Diagram will render when generation completes...'
                    : 'Completing diagram...'}
                </p>
              </div>
            </div>
          );
        }

        // Generate stable, unique ID based on content hash to prevent re-renders
        // Use a simple hash of the content for stability
        const hash = codeContent.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        const diagramId = `diagram-${Math.abs(hash)}`;

        // Render complete diagram only when ready
        return (
          <MermaidDiagram
            chart={codeContent}
            id={diagramId}
            autoShow={!isGenerating}
          />
        );
      }

      // Handle other code blocks
      return !inline && match ? (
        <SyntaxHighlighter
          style={effectiveTheme === 'dark' ? codescribeDarkTheme : codescribeLightTheme}
          language={language}
          PreTag="div"
          customStyle={{
            margin: '1.5rem 0',
            borderRadius: '0.5rem',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
          {...props}
        >
          {codeContent}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-cyan-300 px-1 py-0.5 rounded text-[13px] font-mono" {...props}>
          {children}
        </code>
      );
    }
  }), [isGenerating, effectiveTheme]);

  return (
    <div data-testid="doc-panel" className="@container flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      {/* Live Region for Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isGenerating && !documentation ? 'Generating documentation...' :
         isGenerating && documentation ? 'Updating documentation...' :
         justGenerated && documentation ? `Documentation generated. Quality score: ${qualityScore?.score} out of 100, grade ${qualityScore?.grade}` :
         ''}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-purple-50 dark:bg-purple-400/15 border-b border-purple-200 dark:border-slate-700 transition-colors">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
          <h2 className="text-sm text-slate-600 dark:text-slate-300 @[500px]:inline hidden">
            Generated Documentation
          </h2>
          <h2 className="text-sm text-slate-600 dark:text-slate-300 @[500px]:hidden truncate">
            Docs
          </h2>
        </div>

        {/* Right: Quality Score + Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quality Score - Responsive based on container width */}
          {qualityScore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onViewBreakdown();
              }}
              className="flex items-center gap-1.5 @[600px]:gap-2 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-400/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-400/15 hover:scale-[1.02] hover:shadow-sm transition-all duration-200 motion-reduce:transition-none active:scale-[0.98]"
              aria-label={`Quality score: ${qualityScore.grade} ${qualityScore.score}/100`}
              title="View breakdown"
            >
              {/* "Quality:" label - always visible */}
              <span className="text-xs text-slate-600 dark:text-slate-400">Quality:</span>
              {/* Score - always visible, add "/100" when wide */}
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                {qualityScore.score}<span className="@[600px]:inline hidden">/100</span>
              </span>
              {/* Grade - always visible, add label when wide */}
              <span className={`text-xs font-semibold ${getGradeColor(qualityScore.grade)}`}>
                {qualityScore.grade}<span className="@[600px]:inline hidden"> {getGradeLabel(qualityScore.grade)}</span>
              </span>
            </button>
          )}

          {/* Desktop: Download, Copy, and Clear Buttons */}
          {documentation && (
            <>
              <div className="@[700px]:flex hidden items-center gap-2">
                <DownloadButton
                  content={documentation}
                  docType={qualityScore?.docType || 'documentation'}
                  size="md"
                  variant="outline"
                  ariaLabel="Export documentation"
                  showLabel={true}
                />
                <CopyButton
                  text={documentation}
                  size="md"
                  variant="outline"
                  ariaLabel="Copy documentation"
                  showLabel={true}
                />
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                  aria-label="Clear documentation"
                  title="Clear documentation"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Mobile: Overflow Menu - show when buttons are hidden */}
              <div className="@[700px]:hidden relative" ref={mobileMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 hover:bg-purple-50 dark:hover:bg-purple-400/15 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                  aria-label="More actions"
                  aria-expanded={showMobileMenu}
                  aria-haspopup="menu"
                >
                  <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                </button>

                {/* Dropdown Menu */}
                {showMobileMenu && (
                  <div
                    role="menu"
                    aria-label="Documentation actions"
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        const blob = new Blob([documentation], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${qualityScore?.docType || 'documentation'}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-inset"
                      aria-label="Export documentation"
                    >
                      <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">Export</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        navigator.clipboard.writeText(documentation);
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-inset"
                      aria-label="Copy documentation to clipboard"
                    >
                      <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">Copy</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onReset();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-inset"
                      aria-label="Clear documentation"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">Clear</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body - Documentation Content */}
      <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 bg-white dark:bg-slate-900">
        {isGenerating && !documentation ? (
          <DocPanelGeneratingSkeleton />
        ) : documentation ? (
          <div className="prose prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {documentation}
            </ReactMarkdown>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center min-h-full text-center px-6 py-8 bg-white dark:bg-slate-900"
            role="status"
          >
            <div className="mb-4 p-3 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50">
              <Sparkles className="w-6 h-6 text-purple-500 dark:text-purple-400" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Ready to Generate Documentation
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-md">
              Your AI-generated documentation will appear here with real-time streaming and quality scoring.
            </p>

            {/* Quick Start Steps */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-5 w-full max-w-md xl:max-w-lg 2xl:max-w-xl text-left shadow-sm transition-colors">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 text-center">
                Quick Start
              </h4>
              <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-400 text-white dark:text-slate-950 flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">Add your code</p>
                    <p className="text-xs leading-relaxed">
                      Paste code directly in the left panel, click{' '}
                      {onUpload ? (
                        <button
                          type="button"
                          onClick={onUpload}
                          className="inline-flex items-center px-2 py-0.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-1"
                        >
                          Upload Files
                        </button>
                      ) : (
                        <strong>Upload Files</strong>
                      )}
                      {' '}to select from your computer, or{' '}
                      {onGithubImport ? (
                        <button
                          type="button"
                          onClick={onGithubImport}
                          className="inline-flex items-center px-2 py-0.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-1"
                        >
                          Import from GitHub
                        </button>
                      ) : (
                        <strong>Import from GitHub</strong>
                      )}
                      .
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-400 text-white dark:text-slate-950 flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">Select documentation type</p>
                    <p className="text-xs leading-relaxed">
                      Choose README for project documentation, JSDoc for inline comments, API for endpoint documentation, or Architecture for system design overviews.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-400 text-white dark:text-slate-950 flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">Generate and review</p>
                    <p className="text-xs leading-relaxed">
                      Click{' '}
                      {onGenerate ? (
                        <button
                          type="button"
                          onClick={onGenerate}
                          className="inline-flex items-center px-2 py-0.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-1"
                        >
                          Generate Docs
                        </button>
                      ) : (
                        <strong>Generate Docs</strong>
                      )}
                      {' '}and watch your documentation stream in real-time. Review the quality score to see what's working well and what could be improved.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
              Not sure where to start? Try the <strong>Samples</strong> button in the code panel header.
            </p>
          </div>
        )}
      </div>

      {/* Footer - Quick Stats & Expandable Report */}
      {qualityScore && (
        <div>
            {/* Quick Stats */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                {/* Primary: Areas to improve (always visible, actionable) */}
                {qualityScore.summary.improvements.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertCircle className="w-3 h-3 text-yellow-600 dark:text-amber-400" aria-hidden="true" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {qualityScore.summary.improvements.length} to improve
                    </span>
                  </div>
                ) : (
                  /* No improvements needed - show success message */
                  <div className="flex items-center gap-1.5 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" aria-hidden="true" />
                    <span className="text-slate-600 dark:text-slate-400">
                      All criteria met
                    </span>
                  </div>
                )}
                {/* Secondary: Criteria met (hide on narrow panels) */}
                {qualityScore.summary.improvements.length > 0 && (
                  <>
                    <span className="@[400px]:inline hidden text-slate-400 dark:text-slate-600">•</span>
                    <div className="@[400px]:flex hidden items-center gap-1.5 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" aria-hidden="true" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {qualityScore.summary.strengths.length} met
                      </span>
                    </div>
                  </>
                )}
              </div>

            {/* Expand/Collapse Button */}
            <button
              type="button"
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              aria-expanded={isExpanded}
              aria-controls="quality-report-details"
              aria-label={isExpanded ? "Hide details" : "Show details"}
              className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-400/15 transition-colors duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 rounded px-2 py-1 active:bg-purple-100 dark:active:bg-purple-400/20"
            >
              <span className="@[450px]:inline hidden font-medium">{isExpanded ? "Hide details" : "Show details"}</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Expandable Section with Smooth Animation */}
          <div
            id="quality-report-details"
            role="region"
            aria-label="Quality report details"
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              {/* Document Type */}
              <div className="mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Document Type: <span className="font-medium text-slate-700 dark:text-slate-300">{qualityScore.docType}</span>
                </span>
              </div>

              <div className="space-y-2">
                {/* Strengths */}
                {qualityScore.summary.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" aria-hidden="true" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Strengths</span>
                    </div>
                    <ul className="space-y-1 ml-5">
                      {qualityScore.summary.strengths.map((key) => {
                        const criteria = qualityScore.breakdown[key];
                        return (
                          <li key={key} className="text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {formatCriteriaName(key, qualityScore.docType)}:
                            </span>{' '}
                            {criteria?.suggestion || 'Well done!'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {qualityScore.summary.improvements.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-amber-400" aria-hidden="true" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Areas to Improve</span>
                    </div>
                    <ul className="space-y-1 ml-5">
                      {qualityScore.summary.improvements.map((key) => {
                        const criteria = qualityScore.breakdown[key];
                        return (
                          <li key={key} className="text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {formatCriteriaName(key, qualityScore.docType)}:
                            </span>{' '}
                            {criteria?.suggestion || 'Consider improving this section'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Helper functions
function getGradeColor(grade) {
  switch (grade) {
    case 'A': return 'text-green-600 dark:text-green-400';
    case 'B': return 'text-blue-600 dark:text-blue-400';
    case 'C': return 'text-yellow-600 dark:text-yellow-400';
    case 'D':
    case 'F': return 'text-red-600 dark:text-red-400';
    default: return 'text-slate-600 dark:text-slate-400';
  }
}

function getGradeLabel(grade) {
  switch (grade) {
    case 'A': return '(Excellent)';
    case 'B': return '(Good)';
    case 'C': return '(Fair)';
    case 'D': return '(Poor)';
    case 'F': return '(Failing)';
    default: return '';
  }
}

function formatCriteriaName(key, docType = 'README') {
  // Context-aware names based on document type
  const nameMap = {
    'README': {
      overview: 'Overview',
      installation: 'Installation',
      examples: 'Usage Examples',
      apiDocs: 'Function Coverage',
      structure: 'Structure & Formatting',
    },
    'JSDOC': {
      overview: 'Overview',
      installation: 'Installation',
      examples: 'Usage Examples',
      apiDocs: 'JSDoc Comments',
      structure: 'Structure & Formatting',
    },
    'API': {
      overview: 'Overview',
      installation: 'Installation',
      examples: 'Usage Examples',
      apiDocs: 'API Endpoints',
      structure: 'Structure & Formatting',
    },
  };

  const names = nameMap[docType] || nameMap['README'];
  return names[key] || key;
}