import { Sparkles, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, MoreVertical, Download, Copy, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef, memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';
import { Tooltip } from './Tooltip';
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
  onReset,
  bulkGenerationProgress = null,
  bulkGenerationSummary = null,
  bulkGenerationErrors = [],
  onDismissBulkErrors,
  onSummaryFileClick,
  onBackToSummary,
  onDownloadAllDocs,
  batchSummaryMarkdown = null,
  canUseBatchProcessing = false,
  onExportFile,
  currentlyGeneratingFile = null,
  throttleCountdown = null
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

  // Error details toggle state
  const [showErrorDetails, setShowErrorDetails] = useState(false);

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
    let lastScrollTop = 0;
    let userHasScrolledUp = false;
    let isAutoScrolling = false; // Track if we're actively auto-scrolling

    const checkAndScroll = () => {
      const element = contentRef.current;
      if (!element) return;

      const threshold = 200; // pixels from bottom - increased for better UX
      const currentScrollHeight = element.scrollHeight;
      const currentScrollTop = element.scrollTop;

      // Check if user is near bottom
      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      const isNearBottom = distanceFromBottom < threshold;

      // Detect if content grew (e.g., Mermaid diagram rendering)
      const contentGrew = currentScrollHeight > lastScrollHeight;
      const contentGrowth = currentScrollHeight - lastScrollHeight;

      // Detect if user manually scrolled (scroll position changed without content growing)
      const scrollChanged = Math.abs(currentScrollTop - lastScrollTop) > 1;

      if (scrollChanged && !contentGrew) {
        // User manually scrolled (not auto-scroll from content growth)
        if (currentScrollTop < lastScrollTop) {
          // Scrolled up - stop auto-scrolling
          userHasScrolledUp = true;
          isAutoScrolling = false;
        } else if (isNearBottom) {
          // Scrolled down to near bottom - resume auto-scrolling
          userHasScrolledUp = false;
          isAutoScrolling = true;
        }
      }

      // Auto-scroll if:
      // 1. Already auto-scrolling and content grew (maintain auto-scroll through Mermaid renders) OR
      // 2. User is near bottom OR
      // 3. Content is very short (starting fresh) AND user hasn't scrolled up
      const shouldAutoScroll =
        (isAutoScrolling && contentGrew) ||
        isNearBottom ||
        (element.scrollHeight < 500 && !userHasScrolledUp);

      if (shouldAutoScroll) {
        element.scrollTop = element.scrollHeight;
        lastScrollTop = element.scrollHeight;
        userHasScrolledUp = false;
        isAutoScrolling = true; // Mark as actively auto-scrolling
      } else {
        lastScrollTop = currentScrollTop;
      }

      // Always track height for next comparison
      lastScrollHeight = currentScrollHeight;

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

  // Auto-scroll to top when batch summary is displayed (but not during active generation)
  // Only trigger when batchSummaryMarkdown changes, not on every documentation update
  useEffect(() => {
    if (!isGenerating && batchSummaryMarkdown && documentation === batchSummaryMarkdown && contentRef.current) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [batchSummaryMarkdown]); // Only depend on batch summary changing, not documentation or isGenerating

  // Auto-scroll to top when single file generation completes
  useEffect(() => {
    // Only scroll to top if:
    // 1. Generation just completed (justGenerated flag is set)
    // 2. NOT a batch summary (batch has its own scroll logic above)
    // 3. We have documentation to show
    if (justGenerated && documentation && !batchSummaryMarkdown && contentRef.current) {
      // Small delay to ensure content is fully rendered
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  }, [justGenerated, documentation, batchSummaryMarkdown]);

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
    pre({ children }) {
      // Just pass through - SyntaxHighlighter handles all styling
      return <>{children}</>;
    },
    a({ node, href, children, ...props }) {
      // Custom rendering for export links to use Download icon
      if (href && href.startsWith('#export:')) {
        return (
          <a href={href} className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors no-underline hover:underline" {...props}>
            <Download className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>Export</span>
          </a>
        );
      }
      // Default link rendering for other links
      return <a href={href} {...props}>{children}</a>;
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
        <div className="relative group">
          <SyntaxHighlighter
            style={effectiveTheme === 'dark' ? codescribeDarkTheme : codescribeLightTheme}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              paddingTop: '1rem',
              borderRadius: '0.5rem',
              fontSize: '13px',
              lineHeight: '1.6',
              backgroundColor: effectiveTheme === 'dark' ? '#1e293b' : '#f8fafc',
              border: effectiveTheme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
            }}
            {...props}
          >
            {codeContent}
          </SyntaxHighlighter>
          <div className="absolute top-2 right-3">
            <CopyButton
              text={codeContent}
              size="md"
              variant="ghost"
              ariaLabel={`Copy ${language} code`}
              showLabel={false}
            />
          </div>
        </div>
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
            Generated Docs
          </h2>
          <h2 className="text-sm text-slate-600 dark:text-slate-300 @[500px]:hidden truncate">
            Generated Docs
          </h2>
        </div>

        {/* Right: Quality Score + Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quality Score or Batch Summary Badge */}
          {qualityScore && (
            qualityScore.isBatchSummary ? (
              // Batch Summary Chip - Non-interactive status indicator
              <span
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                role="status"
                aria-label="Viewing batch summary"
              >
                Batch Summary
              </span>
            ) : (
              // Regular Quality Score Button - Clickable
              <Tooltip content="View breakdown">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onViewBreakdown();
                  }}
                  className="flex items-center gap-1.5 @[600px]:gap-2 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-400/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-400/15 hover:scale-[1.02] hover:shadow-sm transition-all duration-200 motion-reduce:transition-none active:scale-[0.98]"
                  aria-label={`Quality score: ${qualityScore.grade} ${qualityScore.score}/100`}
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
              </Tooltip>
            )
          )}

          {/* Export All button - show when viewing batch summary */}
          {qualityScore?.isBatchSummary && onDownloadAllDocs && (
            <Tooltip content="Export all generated documentation as ZIP">
              <button
                type="button"
                onClick={onDownloadAllDocs}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                aria-label="Export all generated documentation as ZIP"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="@[600px]:inline hidden">Export All</span>
                <span className="@[600px]:hidden">All</span>
              </button>
            </Tooltip>
          )}

          {/* Desktop: Download, Copy, and Clear Buttons */}
          {documentation && (
            <>
              {/* Wide screens: Icon + Label */}
              <div className="@[600px]:flex hidden items-center gap-2">
                <DownloadButton
                  content={documentation}
                  docType={qualityScore?.isBatchSummary ? 'batch-summary' : (qualityScore?.docType || 'documentation')}
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
                <Tooltip content="Clear documentation">
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                    aria-label="Clear documentation"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Clear</span>
                  </button>
                </Tooltip>
              </div>

              {/* Medium screens: Icon only */}
              <div className="@[450px]:flex @[600px]:hidden hidden items-center gap-2">
                <DownloadButton
                  content={documentation}
                  docType={qualityScore?.isBatchSummary ? 'batch-summary' : (qualityScore?.docType || 'documentation')}
                  size="md"
                  variant="outline"
                  ariaLabel="Export documentation"
                  showLabel={false}
                />
                <CopyButton
                  text={documentation}
                  size="md"
                  variant="outline"
                  ariaLabel="Copy documentation"
                  showLabel={false}
                />
                <Tooltip content="Clear documentation">
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                    aria-label="Clear documentation"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </Tooltip>
              </div>

              {/* Mobile: Overflow Menu - show when buttons are hidden */}
              <div className="@[450px]:hidden relative" ref={mobileMenuRef}>
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

      {/* Batch Summary Banner - Shows Final Summary Only (Pro+ tier only) */}
      {canUseBatchProcessing && bulkGenerationSummary && (
        <div className="mx-4 mt-3 bg-white dark:bg-slate-800 border-2 border-indigo-600 dark:border-indigo-400 rounded-lg overflow-hidden shadow-sm transition-all">
          <div className="flex items-start justify-between p-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon based on state */}
              <div className="flex-shrink-0">
                {bulkGenerationSummary.successCount === 0 && bulkGenerationSummary.failCount > 0 ? (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                ) : bulkGenerationSummary.failCount > 0 ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Summary State */}
                {bulkGenerationSummary && (
                  <>
                    {/* Main status line */}
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Batch Complete: <span className="text-slate-700 dark:text-slate-300">
                        {bulkGenerationSummary.failCount === 0 ? (
                          <>{bulkGenerationSummary.successCount} {bulkGenerationSummary.successCount === 1 ? 'file' : 'files'}</>
                        ) : (
                          <>
                            {bulkGenerationSummary.successCount > 0 ? (
                              <>{bulkGenerationSummary.successCount} of {bulkGenerationSummary.totalFiles} files</>
                            ) : (
                              <>0 of {bulkGenerationSummary.totalFiles} files</>
                            )}
                          </>
                        )}
                      </span>
                    </p>

                    {/* Metadata line */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {bulkGenerationSummary.successCount > 0 && (
                        <>
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            Avg Quality: <span className="font-medium">{bulkGenerationSummary.avgQuality}/100 ({bulkGenerationSummary.avgGrade})</span>
                          </p>
                        </>
                      )}
                      {bulkGenerationSummary.failCount > 0 && (
                        <>
                          {bulkGenerationSummary.successCount > 0 && (
                            <span className="text-slate-400 dark:text-slate-500">•</span>
                          )}
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{bulkGenerationSummary.failCount}</span> failed
                          </p>
                        </>
                      )}
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <button
                        type="button"
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
                        aria-expanded={showErrorDetails}
                        aria-label={showErrorDetails ? 'Hide details' : 'Show details'}
                      >
                        {showErrorDetails ? (
                          <>
                            <span>Hide Details</span>
                            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          </>
                        ) : (
                          <>
                            <span>Show Details</span>
                            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {showErrorDetails && (
                      <div className="space-y-2 mt-3">
                        {/* Success Section */}
                        {bulkGenerationSummary.successfulFiles.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                              Success ({bulkGenerationSummary.successfulFiles.length} {bulkGenerationSummary.successfulFiles.length === 1 ? 'file' : 'files'})
                            </h4>
                            <div className="space-y-1">
                              {bulkGenerationSummary.successfulFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors"
                                >
                                  <span className="font-medium text-slate-900 dark:text-slate-100">{file.name}</span>
                                  <span className="text-slate-700 dark:text-slate-300">{file.score}/100 ({file.grade})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Failed Section */}
                        {bulkGenerationErrors.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                              Failed ({bulkGenerationErrors.length} {bulkGenerationErrors.length === 1 ? 'file' : 'files'})
                            </h4>
                            <div className="space-y-1">
                              {bulkGenerationErrors.map((error, index) => (
                                <div
                                  key={index}
                                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2.5 text-xs transition-colors"
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium text-slate-900 dark:text-slate-100 flex-shrink-0">
                                      {error.filename}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-slate-800 dark:text-slate-200/90 leading-relaxed">
                                    {error.error}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Dismiss button - only show for summary, not progress */}
            {bulkGenerationSummary && (
              <button
                type="button"
                onClick={onDismissBulkErrors}
                className="flex-shrink-0 ml-2 p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:ring-slate-600 dark:focus-visible:ring-slate-400"
                aria-label="Dismiss summary banner"
              >
                <svg
                  className="w-4 h-4 text-slate-600 dark:text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Currently Generating File Banner (Pro+ tier only) */}
      {canUseBatchProcessing && currentlyGeneratingFile && (
        <div className="mx-4 mt-3 bg-white dark:bg-slate-800 border-2 border-indigo-600 dark:border-indigo-400 rounded-lg overflow-hidden shadow-sm transition-all">
          <div className="flex items-center gap-3 p-3">
            {/* Sparkles icon with animated glow */}
            <div className="relative flex-shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" aria-hidden="true" />
              <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/20 rounded-full blur-md animate-pulse" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                Generating: <span className="text-indigo-700 dark:text-indigo-300">{currentlyGeneratingFile.filename}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  File {currentlyGeneratingFile.index} of {currentlyGeneratingFile.total}
                </p>
                <span className="text-indigo-400 dark:text-indigo-500">•</span>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {currentlyGeneratingFile.docType}
                </p>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-indigo-200/50 dark:bg-indigo-800/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 rounded-full transition-all duration-300"
                  style={{ width: `${(currentlyGeneratingFile.index / currentlyGeneratingFile.total) * 100}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Throttle Countdown Banner (Pro+ tier only) */}
      {canUseBatchProcessing && throttleCountdown !== null && throttleCountdown > 0 && (
        <div className="mx-4 mt-3 bg-white dark:bg-slate-800 border-2 border-indigo-600 dark:border-indigo-400 rounded-lg overflow-hidden shadow-sm transition-all">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-shrink-0 text-2xl animate-pulse" role="img" aria-label="hourglass">⏳</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                Next file in <span className="text-indigo-700 dark:text-indigo-300">{throttleCountdown}s</span>
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                Rate limiting to respect API limits
              </p>
              {/* Countdown progress bar */}
              <div className="mt-2 h-1 bg-indigo-200/50 dark:bg-indigo-800/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(15 - throttleCountdown) / 15 * 100}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Back to Summary button - show when viewing any file from a batch generation */}
      {canUseBatchProcessing && batchSummaryMarkdown && documentation && documentation !== batchSummaryMarkdown && (
        <div className="px-4 pt-3 pb-2 bg-white dark:bg-slate-900" data-no-export="true">
          <button
            type="button"
            onClick={onBackToSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-xs font-medium text-indigo-900 dark:text-indigo-100"
            aria-label="Back to batch summary"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Summary</span>
          </button>
        </div>
      )}

      {/* Body - Documentation Content */}
      <div
        ref={contentRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 bg-white dark:bg-slate-900"
        onClick={(e) => {
          // Find the closest anchor element (handles clicks on nested elements like <strong>)
          const link = e.target.closest('a');
          if (!link) return;

          // Intercept clicks on file links in batch summary
          if (link.hash && link.hash.startsWith('#file:')) {
            e.preventDefault();
            const filename = decodeURIComponent(link.hash.substring(6)); // Remove '#file:'
            if (onSummaryFileClick) {
              onSummaryFileClick(filename);
            }
          }

          // Intercept clicks on export links in batch summary
          if (link.hash && link.hash.startsWith('#export:')) {
            e.preventDefault();
            const filename = decodeURIComponent(link.hash.substring(8)); // Remove '#export:'
            if (onExportFile) {
              onExportFile(filename);
            }
          }
        }}
      >
        {(isGenerating || bulkGenerationProgress) && !documentation ? (
          <DocPanelGeneratingSkeleton />
        ) : documentation ? (
          <>
            <style>{`
              .file-card {
                margin: 1rem 0;
                border: 1px solid;
                border-radius: 0.5rem;
                overflow: hidden;
                transition: all 0.2s;
              }

              .dark .file-card {
                border-color: rgb(51 65 85);
                background-color: rgb(30 41 59);
              }

              .file-card:not(.dark) {
                border-color: rgb(226 232 240);
                background-color: rgb(248 250 252);
              }

              .file-summary {
                cursor: pointer;
                padding: 1rem;
                list-style: none;
                user-select: none;
              }

              .file-summary::-webkit-details-marker {
                display: none;
              }

              .file-summary::marker {
                display: none;
              }

              .file-summary:hover {
                background-color: rgb(241 245 249);
              }

              .dark .file-summary:hover {
                background-color: rgb(51 65 85 / 0.5);
              }

              .file-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                flex-wrap: wrap;
              }

              .file-info {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                flex: 1;
                min-width: 0;
              }

              .file-meta {
                font-size: 0.875rem;
                opacity: 0.7;
              }

              .file-actions {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex-shrink: 0;
              }

              .file-score {
                font-size: 0.875rem;
                white-space: nowrap;
              }

              .file-details {
                padding: 0 1rem 1rem 1rem;
                border-top: 1px solid;
              }

              .dark .file-details {
                border-color: rgb(51 65 85);
              }

              .file-details:not(.dark) {
                border-color: rgb(226 232 240);
              }

              .file-summary::before {
                content: "▶";
                display: inline-block;
                margin-right: 0.5rem;
                transition: transform 0.2s;
                font-size: 0.75rem;
                opacity: 0.6;
              }

              details[open] > .file-summary::before {
                transform: rotate(90deg);
              }
            `}</style>

            <div className="prose prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {documentation}
              </ReactMarkdown>
            </div>
          </>
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

      {/* Footer - Quick Stats & Expandable Report (skip for batch summaries) */}
      {qualityScore && !qualityScore.isBatchSummary && qualityScore.summary && (
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
                  Document Type: <span className="font-semibold text-purple-600 dark:text-purple-400">{qualityScore.docType}</span>
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