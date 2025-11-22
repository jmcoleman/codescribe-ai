import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Code2, FileText } from 'lucide-react';
import JSZip from 'jszip';
import { useTheme } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { Sidebar } from './components/Sidebar';
import { TierOverrideBanner } from './components/TierOverrideBanner';
import { CodePanel } from './components/CodePanel';
import { SplitPanel } from './components/SplitPanel';
import Footer from './components/Footer';
import { useDocGeneration } from './hooks/useDocGeneration';
import { useUsageTracking } from './hooks/useUsageTracking';
import { useWorkspacePersistence } from './hooks/useWorkspacePersistence';
import { useDocumentPersistence } from './hooks/useDocumentPersistence';
import { useTierOverride } from './hooks/useTierOverride';
import { ErrorBanner } from './components/ErrorBanner';
import { UsageWarningBanner } from './components/UsageWarningBanner';
import { UsageLimitModal } from './components/UsageLimitModal';
import UnverifiedEmailBanner from './components/UnverifiedEmailBanner';
import { validateFile, getValidationErrorMessage, detectLanguageFromFilename } from './utils/fileValidation';
import { trackCodeInput, trackFileUpload, trackExampleUsage, trackInteraction } from './utils/analytics';
import { toastCompact, toastError } from './utils/toastWithHistory';
import { toastDocGenerated } from './utils/toast';
import { createTestDataLoader, exposeTestDataLoader, createSkeletonTestHelper, exposeSkeletonTestHelper } from './utils/testData';
import { exposeUsageSimulator } from './utils/usageTestData';
import { useAuth } from './contexts/AuthContext';
import { hasFeature } from './utils/tierFeatures';
import { DEFAULT_CODE, EXAMPLE_CODES } from './constants/defaultCode';

// Lazy load heavy components that aren't needed on initial render
const DocPanel = lazy(() => import('./components/DocPanel').then(m => ({ default: m.DocPanel })));
const QualityScoreModal = lazy(() => import('./components/QualityScore').then(m => ({ default: m.QualityScoreModal })));
const SamplesModal = lazy(() => import('./components/SamplesModal').then(m => ({ default: m.SamplesModal })));
const HelpModal = lazy(() => import('./components/HelpModal').then(m => ({ default: m.HelpModal })));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal').then(m => ({ default: m.ConfirmationModal })));
const TermsAcceptanceModal = lazy(() => import('./components/TermsAcceptanceModal').then(m => ({ default: m.default })));
const ContactSupportModal = lazy(() => import('./components/ContactSupportModal').then(m => ({ default: m.ContactSupportModal })));
const GitHubLoadModal = lazy(() => import('./components/GitHubLoader').then(m => ({ default: m.GitHubLoadModal })));
const UnsupportedFileModal = lazy(() => import('./components/UnsupportedFileModal').then(m => ({ default: m.UnsupportedFileModal })));

// Loading fallback for modals - full screen to prevent layout shift
function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"
        role="status"
        aria-label="Loading modal"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

// Loading fallback for panels
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

import { API_URL } from './config/api.js';
import { STORAGE_KEYS, getStorageItem, setStorageItem, getEditorKey, getSessionItem, setSessionItem, removeSessionItem } from './constants/storage';

// Default sidebar panel sizes (percentage)
const DEFAULT_SIDEBAR_SIZE = 20;
const DEFAULT_MAIN_SIZE = 80;

function App() {
  const { getToken, user, isAuthenticated, checkLegalStatus, acceptLegalDocuments } = useAuth();
  const { effectiveTheme } = useTheme();

  // Load persisted state from localStorage on mount, fallback to defaults
  const [code, setCode] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_CODE, DEFAULT_CODE));
  const [docType, setDocType] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_DOC_TYPE, 'README'));
  const [filename, setFilename] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_FILENAME, 'code.js'));
  // Language is derived from filename, not stored separately
  const language = detectLanguageFromFilename(filename);

  // Layout mode state (Pro+ feature)
  const [layout, setLayout] = useState(() => getStorageItem(STORAGE_KEYS.LAYOUT_MODE, 'split'));

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showSamplesModal, setShowSamplesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [showUsageWarning, setShowUsageWarning] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [showRegenerateConfirmModal, setShowRegenerateConfirmModal] = useState(false);
  const [showGenerateFromEditorModal, setShowGenerateFromEditorModal] = useState(false);
  const [unsupportedFileModal, setUnsupportedFileModal] = useState({ isOpen: false, fileName: '', fileExtension: '' });
  const [legalStatus, setLegalStatus] = useState(null);
  const [largeCodeStats, setLargeCodeStats] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkGenerationErrors, setBulkGenerationErrors] = useState([]); // Array of {filename, fileId, error}
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState(null); // { total, completed, currentBatch, totalBatches } or null
  const [currentlyGeneratingFile, setCurrentlyGeneratingFile] = useState(null); // { filename, index, total } or null
  const [throttleCountdown, setThrottleCountdown] = useState(null); // Seconds remaining in throttle delay
  // Batch generation state - loaded from localStorage only if user has batch processing access
  const [bulkGenerationSummary, setBulkGenerationSummary] = useState(null);
  const [batchSummaryMarkdown, setBatchSummaryMarkdown] = useState(null);
  const [testSkeletonMode, setTestSkeletonMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth < 1024);
  const [mobileActiveTab, setMobileActiveTab] = useState('code'); // 'code' or 'doc' (mobile only, not persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load sidebar collapsed state from localStorage
    const saved = getStorageItem(STORAGE_KEYS.SIDEBAR_MODE);
    return saved === 'collapsed';
  });
  const [expandedSidebarWidth, setExpandedSidebarWidth] = useState(() => {
    // Load user's preferred expanded width from localStorage
    try {
      const saved = getStorageItem(STORAGE_KEYS.SIDEBAR_WIDTH);
      if (saved) {
        const { sidebar } = JSON.parse(saved);
        return sidebar || DEFAULT_SIDEBAR_SIZE;
      }
    } catch (error) {
      console.error('[App] Error loading sidebar width:', error);
    }
    return DEFAULT_SIDEBAR_SIZE;
  });
  const fileInputRef = useRef(null); // For single-file uploads (Command Bar)
  const multiFileInputRef = useRef(null); // For multi-file uploads (Sidebar)
  const samplesButtonRef = useRef(null);
  const headerRef = useRef(null);
  const sidebarPanelRef = useRef(null); // For programmatically controlling sidebar panel size

  // Load saved sidebar panel sizes from localStorage
  const loadSidebarSizes = useCallback(() => {
    try {
      const saved = getStorageItem(STORAGE_KEYS.SIDEBAR_WIDTH);
      if (saved) {
        const { sidebar, main } = JSON.parse(saved);
        return { sidebar, main };
      }
    } catch (error) {
      console.error('[App] Error loading sidebar sizes:', error);
    }
    return { sidebar: DEFAULT_SIDEBAR_SIZE, main: DEFAULT_MAIN_SIZE };
  }, []);

  // Save sidebar panel sizes to localStorage
  const saveSidebarSizes = useCallback((sizes) => {
    try {
      if (sizes && sizes.length === 2) {
        setStorageItem(STORAGE_KEYS.SIDEBAR_WIDTH, JSON.stringify({
          sidebar: sizes[0],
          main: sizes[1]
        }));
      }
    } catch (error) {
      console.error('[App] Error saving sidebar sizes:', error);
    }
  }, []);

  // Toggle sidebar collapse state
  const handleToggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      // Persist to localStorage
      setStorageItem(STORAGE_KEYS.SIDEBAR_MODE, newValue ? 'collapsed' : 'expanded');

      // Control panel size via ref
      if (sidebarPanelRef.current) {
        if (newValue) {
          // Collapsing: resize to minimum (3% ~ 58px - just enough for icon)
          sidebarPanelRef.current.resize(3);
        } else {
          // Expanding: restore saved width
          sidebarPanelRef.current.resize(expandedSidebarWidth);
        }
      }

      return newValue;
    });
  }, [expandedSidebarWidth]);

  // Handle layout mode change (Pro+ feature)
  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);
    // Persist to localStorage
    setStorageItem(STORAGE_KEYS.LAYOUT_MODE, newLayout);
  }, []);

  // Handle sidebar resize (when user drags the handle)
  const handleSidebarResize = useCallback((sizes) => {
    if (!sidebarCollapsed && sizes && sizes.length >= 2) {
      const sidebarSize = sizes[0];
      // Save the expanded width when user resizes (not when collapsed)
      if (sidebarSize > 10) { // Only save if it's a meaningful size (not collapsed)
        setExpandedSidebarWidth(sidebarSize);
        saveSidebarSizes(sidebarSize, sizes[1]);
      }
    }
  }, [sidebarCollapsed, saveSidebarSizes]);

  // Track if we just accepted terms to prevent re-checking immediately after
  const justAcceptedTermsRef = useRef(false);

  // Detect mobile/tablet view changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Usage tracking
  const { usage, refetch: refetchUsage, checkThreshold, canGenerate, getUsageForPeriod } = useUsageTracking();
  const [mockUsage, setMockUsage] = useState(null);

  // Multi-file state (Phase 3: Multi-file integration)
  const multiFileState = useWorkspacePersistence();
  const documentPersistence = useDocumentPersistence();
  const { override, clearOverride } = useTierOverride();

  // Feature detection: Check if user can use batch processing (Pro+ tier)
  // This single flag controls: multi-file sidebar, GitHub multi-select, batch summary, summary button
  const canUseBatchProcessing = hasFeature(user, 'batchProcessing');

  // Clear batch-related state when user loses batch processing access (tier downgrade/expiry)
  useEffect(() => {
    if (!canUseBatchProcessing) {
      // Clear batch generation state
      setBulkGenerationSummary(null);
      setBulkGenerationProgress(null);
      setBulkGenerationErrors([]);
      setCurrentlyGeneratingFile(null);
      setThrottleCountdown(null);
      setBatchSummaryMarkdown(null);

      // Reset layout to split view (default)
      setLayout('split');
      setStorageItem(STORAGE_KEYS.LAYOUT_MODE, 'split');

      // Clear from sessionStorage
      removeSessionItem('bulk_generation_summary');
      removeSessionItem('batch_summary_markdown');

      console.log('[App] Batch processing access lost - cleared batch state and reset to split view');
    }
  }, [canUseBatchProcessing]);

  // Check legal acceptance status on mount for authenticated users
  useEffect(() => {
    const checkUserLegalStatus = async () => {
      // Only check for authenticated users
      if (!user) {
        setLegalStatus(null);
        setShowTermsModal(false);
        return;
      }

      // Skip check if we just accepted terms (prevents race condition)
      if (justAcceptedTermsRef.current) {
        justAcceptedTermsRef.current = false;
        return;
      }

      try {
        const status = await checkLegalStatus();
        setLegalStatus(status);

        // Show modal if user needs to accept/re-accept terms
        if (status.needs_reacceptance) {
          setShowTermsModal(true);
        }
      } catch (error) {
        console.error('Error checking legal status:', error);
        // Don't block the app if legal status check fails
        // User can still use the app, and we'll check again on next load
      }
    };

    checkUserLegalStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only run when user changes, not when checkLegalStatus changes

  // Load batch data from sessionStorage only if user has batch processing access
  useEffect(() => {
    if (canUseBatchProcessing) {
      // Load bulk generation summary
      try {
        const saved = getSessionItem('bulk_generation_summary');
        if (saved) {
          setBulkGenerationSummary(JSON.parse(saved));
        }
      } catch (error) {
        console.error('[App] Error loading bulk generation summary:', error);
      }

      // Load batch summary markdown
      const markdown = getSessionItem('batch_summary_markdown');
      if (markdown) {
        setBatchSummaryMarkdown(markdown);
      }
    }
  }, [canUseBatchProcessing]);

  // Persist batch data to sessionStorage (only if user has access and data exists)
  useEffect(() => {
    if (canUseBatchProcessing) {
      // Persist both together since they're tightly coupled
      if (bulkGenerationSummary) {
        setSessionItem('bulk_generation_summary', JSON.stringify(bulkGenerationSummary));
      }
      if (batchSummaryMarkdown) {
        setSessionItem('batch_summary_markdown', batchSummaryMarkdown);
      }
    }
  }, [canUseBatchProcessing, bulkGenerationSummary, batchSummaryMarkdown]);

  // Load user-scoped editor content when user logs in
  useEffect(() => {
    if (user && user.id) {
      // Load user's code from user-scoped key
      const codeKey = getEditorKey(user.id, 'code');
      if (codeKey) {
        const savedCode = getStorageItem(codeKey);
        if (savedCode) {
          setCode(savedCode);
        }
      }
    } else {
      // User logged out - clear user's code and show default sample
      setCode(DEFAULT_CODE);
    }
  }, [user?.id]); // Only run when user ID changes (login/logout)

  // Reopen support modal after user logs in (if they came from support modal)
  useEffect(() => {
    if (user && sessionStorage.getItem('pendingSupportModal') === 'true') {
      // User just logged in and had pending support modal
      sessionStorage.removeItem('pendingSupportModal');
      setShowSupportModal(true);
    }
  }, [user]);

  // Persist editor code to localStorage whenever it changes (user-scoped for privacy)
  useEffect(() => {
    if (user && user.id) {
      // User is logged in - use user-scoped key
      const key = getEditorKey(user.id, 'code');
      if (key) {
        setStorageItem(key, code);
      }
    } else {
      // User not logged in - use global key
      setStorageItem(STORAGE_KEYS.EDITOR_CODE, code);
    }
  }, [code, user]);

  // Language is derived from filename, no need to persist separately

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.EDITOR_FILENAME, filename);
  }, [filename]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.EDITOR_DOC_TYPE, docType);
  }, [docType]);

  // Keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar collapse/expand
  useEffect(() => {
    // Only enable keyboard shortcut when multi-file mode is active (Pro+ users)
    if (!canUseBatchProcessing) return;

    const handleKeyDown = (e) => {
      // Check for Cmd+B (Mac) or Ctrl+B (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault(); // Prevent browser bookmark dialog
        handleToggleSidebarCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUseBatchProcessing, handleToggleSidebarCollapse]);

  // Sync active file to CodePanel and DocPanel when selection changes
  // Sync active file to code and doc panels when user clicks a file in sidebar
  useEffect(() => {
    const activeFile = multiFileState.files.find(f => f.id === multiFileState.activeFileId);
    if (activeFile) {
      // Sync code to CodePanel
      if (activeFile.content) {
        setCode(activeFile.content);
        setFilename(activeFile.filename);
        // Language will be derived from filename automatically
      }

      // Sync documentation to DocPanel (overrides batch summary)
      if (activeFile.documentation) {
        setDocumentation(activeFile.documentation);
        setQualityScore(activeFile.qualityScore || null);
      } else {
        // Clear DocPanel if file has no documentation
        setDocumentation('');
        setQualityScore(null);
      }
    } else if (multiFileState.activeFileId === null) {
      // No active file - clear both panels (happens when file is deleted or deselected)
      // UNLESS we're showing a batch summary
      const isShowingBatchSummary = batchSummaryMarkdown && documentation === batchSummaryMarkdown;

      if (!isShowingBatchSummary) {
        // Keep default code in CodePanel
        const defaultCode = DEFAULT_CODE;
        const defaultFilename = 'code.js';
        setCode(defaultCode);
        setFilename(defaultFilename);

        // Clear DocPanel completely
        setDocumentation('');
        setQualityScore(null);

        // Also clear batch summary if showing
        if (batchSummaryMarkdown) {
          setBatchSummaryMarkdown(null);
          setBulkGenerationSummary(null);
        }
      }
    }
  }, [multiFileState.activeFileId, multiFileState.files, batchSummaryMarkdown]);

  // Handle legal document acceptance
  const handleAcceptLegalDocuments = async (acceptance) => {
    try {
      // Set flag to prevent re-checking legal status when user state updates
      justAcceptedTermsRef.current = true;

      await acceptLegalDocuments(acceptance);
      // Close modal on success
      setShowTermsModal(false);
      // Update legal status
      setLegalStatus({
        needs_reacceptance: false,
        details: {
          terms: { needs_acceptance: false },
          privacy: { needs_acceptance: false },
        },
      });
      // Show success toast
      toastCompact('Terms accepted successfully', 'success');
    } catch (error) {
      console.error('Error accepting legal documents:', error);
      // Reset flag on error so user can try again
      justAcceptedTermsRef.current = false;
      // Error will be shown in the modal
      throw error;
    }
  };

  // Listen for direct banner/modal show/hide events (for UI testing)
  useEffect(() => {
    const handleShowBanner = (event) => {
      const { percentage, usage: usageData } = event.detail;
      // Transform to match expected format
      const transformed = {
        percentage: Math.round((usageData.monthly.used / usageData.monthly.limit) * 100),
        remaining: usageData.monthly.remaining,
        limit: usageData.monthly.limit,
        period: 'monthly',
        resetDate: usageData.resetTimes.monthly,
        tier: usageData.tier
      };
      setMockUsage(transformed);

      // At 100%, show modal instead of banner
      if (percentage >= 100 || transformed.remaining === 0) {
        setShowUsageLimitModal(true);
        setShowUsageWarning(false);
      } else {
        // 80-99% shows banner
        setShowUsageWarning(true);
        setShowUsageLimitModal(false);
      }
    };

    const handleHideBanner = () => {
      setMockUsage(null);
      setShowUsageWarning(false);
      setShowUsageLimitModal(false);
    };

    window.addEventListener('show-usage-banner', handleShowBanner);
    window.addEventListener('hide-usage-banner', handleHideBanner);

    return () => {
      window.removeEventListener('show-usage-banner', handleShowBanner);
      window.removeEventListener('hide-usage-banner', handleHideBanner);
    };
  }, []);

  // Check usage thresholds and show appropriate warnings
  useEffect(() => {
    // Don't override mock usage
    if (mockUsage) return;

    if (!usage) return;

    // Check if at 100% limit (hard limit)
    if (!canGenerate()) {
      // Don't auto-show modal, only show when user tries to generate
      setShowUsageWarning(false);
    }
    // Check if at 80%+ (soft limit warning)
    else if (checkThreshold(80)) {
      setShowUsageWarning(true);
    } else {
      setShowUsageWarning(false);
    }
  }, [usage, canGenerate, checkThreshold, mockUsage]);

  // Prevent body scroll and layout shift when any modal opens
  useEffect(() => {
    const isAnyModalOpen = showQualityModal || showSamplesModal || showHelpModal || showConfirmationModal || showUsageLimitModal || showTermsModal || showSupportModal || showGithubModal || showRegenerateConfirmModal || showGenerateFromEditorModal || unsupportedFileModal.isOpen;

    if (isAnyModalOpen) {
      // Calculate scrollbar width BEFORE hiding overflow
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Apply both styles synchronously to prevent flash
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showQualityModal, showSamplesModal, showHelpModal, showTermsModal, showSupportModal]);
  
  const {
    generate,
    reset,
    clearError,
    isGenerating,
    documentation,
    setDocumentation,
    qualityScore,
    setQualityScore,
    error,
    retryAfter
  } = useDocGeneration(refetchUsage);

  // Clear bulk generation progress when single-file generation completes
  useEffect(() => {
    // When isGenerating becomes false AND we have progress for a single file (total: 1)
    // Clear the progress to hide the spinner on Generate Selected button
    if (!isGenerating && bulkGenerationProgress && bulkGenerationProgress.total === 1) {
      setBulkGenerationProgress(null);
    }
  }, [isGenerating, bulkGenerationProgress]);

  // Load user-scoped documentation and quality score when user logs in
  useEffect(() => {
    if (user && user.id) {
      // User is logged in - load from user-scoped keys
      const docKey = getEditorKey(user.id, 'doc');
      const scoreKey = getEditorKey(user.id, 'score');

      if (docKey) {
        const savedDoc = getStorageItem(docKey);
        if (savedDoc) {
          setDocumentation(savedDoc);
        }
      }

      if (scoreKey) {
        const savedScore = getStorageItem(scoreKey);
        if (savedScore) {
          try {
            setQualityScore(JSON.parse(savedScore));
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
      }
    } else {
      // User logged out - clear all documentation and quality score from UI
      setDocumentation('');
      setQualityScore(null);
    }
  }, [user?.id, setDocumentation, setQualityScore]);

  // Persist documentation to localStorage whenever it changes (user-scoped for privacy)
  useEffect(() => {
    if (documentation) {
      if (user && user.id) {
        // User is logged in - use user-scoped key
        const key = getEditorKey(user.id, 'doc');
        if (key) {
          setStorageItem(key, documentation);
        }
      } else {
        // User not logged in - use global key
        setStorageItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, documentation);
      }
    }
  }, [documentation, user]);

  // Persist quality score to localStorage whenever it changes (user-scoped for privacy)
  useEffect(() => {
    if (qualityScore) {
      if (user && user.id) {
        // User is logged in - use user-scoped key
        const key = getEditorKey(user.id, 'score');
        if (key) {
          setStorageItem(key, JSON.stringify(qualityScore));
        }
      } else {
        // User not logged in - use global key
        setStorageItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, JSON.stringify(qualityScore));
      }
    }
  }, [qualityScore, user]);

  // Auto-switch to Doc tab on mobile when generation starts
  useEffect(() => {
    if (isMobileView && isGenerating) {
      setMobileActiveTab('doc');
    }
  }, [isMobileView, isGenerating]);

  const handleGenerate = async () => {
    if (code.trim()) {
      // Check usage quota first
      if (!canGenerate()) {
        // Show usage limit modal (100% limit reached)
        setShowUsageLimitModal(true);
        return;
      }

      // Check line count and file size
      const lines = code.split('\n').length;
      const sizeInKB = (new Blob([code]).size / 1024).toFixed(2);
      const charCount = code.length;

      // Threshold for large code warning (1000+ lines or 50KB+)
      const LARGE_CODE_LINE_THRESHOLD = 1000;
      const LARGE_CODE_SIZE_THRESHOLD_KB = 50;

      if (lines >= LARGE_CODE_LINE_THRESHOLD || parseFloat(sizeInKB) >= LARGE_CODE_SIZE_THRESHOLD_KB) {
        // Show confirmation modal with stats
        setLargeCodeStats({
          lines,
          sizeInKB,
          charCount
        });
        setShowConfirmationModal(true);
        return; // Wait for user confirmation
      }

      // Proceed with generation if code is not too large
      await performGeneration();
    }
  };

  const performGeneration = async () => {
    setShowQualityModal(false); // Close modal when starting new generation
    setShowConfirmationModal(false); // Close confirmation modal if open
    try {
      // Check if code matches the default code or any example (for prompt caching optimization)
      // When cache hits, users benefit from 90% cost reduction!
      const isDefaultCode = code === DEFAULT_CODE;
      const isExampleCode = EXAMPLE_CODES.has(code);
      const shouldCache = isDefaultCode || isExampleCode;
      await generate(code, docType, language, shouldCache);
      // Success toast will be shown after generation completes
    } catch (err) {
      // Error handling is done in useDocGeneration hook
      // But we can add a toast here if needed
    }
  };

  /**
   * Generate documentation for a single file (non-streaming)
   * Used in multi-file mode where each file has its own docType
   * @param {Object} file - File object from multiFileState (must have docType property)
   * @returns {Promise<Object>} - Generated documentation and quality score
   */
  const generateSingleFile = async (file) => {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: file.content,
        docType: file.docType, // Use file's docType (multi-file mode)
        language: file.language,
        isDefaultCode: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Generation failed with status ${response.status}`);
    }

    return response.json();
  };

  /**
   * Format criteria name for markdown display in batch summary
   * @param {string} key - Criteria key (e.g., 'overview', 'apiDocs')
   * @param {string} docType - Document type
   * @returns {string} Formatted criteria name
   */
  const formatCriteriaNameForMarkdown = (key, docType = 'README') => {
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
  };

  /**
   * Generate a batch summary document in markdown format
   * @param {Object} summary - Batch generation summary object
   * @param {Array} failedFiles - Array of failed file objects
   * @returns {string} Markdown formatted summary
   */
  const generateBatchSummaryDocument = (summary, failedFiles = []) => {
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const { totalFiles, successCount, failCount, avgQuality, avgGrade, successfulFiles } = summary;

    // Determine overall status
    const statusText = failCount === 0 ? 'All files processed successfully' :
                      successCount > 0 ? 'Batch completed with some failures' :
                      'Batch processing failed';

    let markdown = `# Generated Summary
**Generated:** ${timestamp}
**Status:** ${statusText}

## Overall Statistics
| Metric | Value |
|--------|-------|
| **Total Files** | ${totalFiles} |
| **Successful** | ${successCount} (${Math.round((successCount / totalFiles) * 100)}%) |
| **Failed** | ${failCount} (${Math.round((failCount / totalFiles) * 100)}%) |`;

    // Add average quality if any files succeeded
    if (successCount > 0) {
      markdown += `
| **Average Quality** | ${avgGrade} (${avgQuality}/100) |`;
    }

    // Success section
    if (successfulFiles && successfulFiles.length > 0) {
      markdown += `

## Successfully Generated (${successfulFiles.length})
Click any file name to view its documentation. Expand quality details to see strengths and improvements.

`;
      successfulFiles.forEach(file => {
        // Format timestamp
        const timestamp = file.generatedAt ? new Date(file.generatedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : 'N/A';

        // Start file section with clickable filename
        markdown += `### [${file.name}](#file:${encodeURIComponent(file.name)})\n`;
        markdown += `**Type:** ${file.docType} | **Score:** **${file.grade}** (${file.score}/100) | **Generated:** ${timestamp} | [Export](#export:${encodeURIComponent(file.name)})\n\n`;

        // Add quality details if available
        if (file.qualityScore) {
          markdown += `<details class="quality-compact">\n<summary>📊 Quality Details</summary>\n\n`;

          // Add strengths and improvements if available
          if (file.qualityScore.summary) {
            const summary = file.qualityScore.summary;

            if (summary.strengths && summary.strengths.length > 0) {
              markdown += `**✅ Strengths:** `;
              const strengthsList = summary.strengths.map(strength => formatCriteriaNameForMarkdown(strength, file.docType));
              markdown += strengthsList.join(', ') + '\n\n';
            }

            if (summary.improvements && summary.improvements.length > 0) {
              markdown += `**💡 Improvements:** `;
              const improvementsList = summary.improvements.map(improvement => {
                const criteriaName = formatCriteriaNameForMarkdown(improvement, file.docType);
                const suggestionText = file.qualityScore.breakdown?.[improvement]?.suggestion || '';
                return suggestionText ? `${criteriaName} (${suggestionText})` : criteriaName;
              });
              markdown += improvementsList.join(', ') + '\n\n';
            }
          }

          // Add detailed breakdown if available
          if (file.qualityScore.breakdown) {
            const breakdown = file.qualityScore.breakdown;
            markdown += `**Breakdown:** `;
            const breakdownList = Object.entries(breakdown).map(([key, value]) => {
              const criteriaName = formatCriteriaNameForMarkdown(key, file.docType);
              const emoji = value.points >= value.maxPoints * 0.8 ? '✅' : value.points >= value.maxPoints * 0.6 ? '⚠️' : '❌';
              return `${emoji} ${criteriaName} ${value.points}/${value.maxPoints}`;
            });
            markdown += breakdownList.join(' · ') + '\n';
          }

          markdown += `\n</details>\n\n`;
        }

        markdown += `---\n\n`;
      });
    }

    // Failed files section
    if (failedFiles && failedFiles.length > 0) {
      markdown += `

## Failed Files (${failedFiles.length})
`;
      failedFiles.forEach(file => {
        markdown += `**${file.filename}**
Error: ${file.error}
`;
      });
    }

    // Next steps
    markdown += `

## Next Steps`;

    if (successCount > 0) {
      markdown += `
- Click any file name above to view its documentation
- Export files individually using the Export link in the table above
- Export all files as a ZIP using the "Export All" button in the header`;
    }

    if (failCount > 0) {
      markdown += `
- Review error messages and correct any issues
- Select failed files and try regenerating`;
    }

    if (successCount === totalFiles) {
      markdown += `
- All files generated successfully - ready for export!`;
    }

    markdown += `

---

*Generated by CodeScribe AI*
`;

    return markdown;
  };

  /**
   * Handle bulk generation for selected files
   * Processes files in batches of 5 concurrently
   */
  const handleGenerateSelected = async (skipPreviouslyGenerated = false) => {
    const filesWithContent = multiFileState.files.filter(f => f.content && f.content.length > 0);
    let selectedFilesWithContent = filesWithContent.filter(f => multiFileState.selectedFileIds.includes(f.id));

    if (selectedFilesWithContent.length === 0) {
      toastCompact.error('No files with content selected');
      return;
    }

    // Check if any selected files already have documentation (only if not explicitly choosing to skip)
    if (!skipPreviouslyGenerated) {
      const filesWithDocs = selectedFilesWithContent.filter(f => f.documentation);
      const filesWithoutDocs = selectedFilesWithContent.filter(f => !f.documentation);

      // If there are files with existing documentation, ask user what to do
      if (filesWithDocs.length > 0 && filesWithoutDocs.length > 0) {
        // Use AskUserQuestion to get user preference
        // For now, use window.confirm as a simple solution
        const regenerateAll = window.confirm(
          `${filesWithDocs.length} of ${selectedFilesWithContent.length} selected files already have documentation.\n\n` +
          `Click OK to regenerate all files.\n` +
          `Click Cancel to only generate new documentation for files without it.`
        );

        if (!regenerateAll) {
          // User chose to skip previously generated files
          selectedFilesWithContent = filesWithoutDocs;
        }
      }
    }

    // Check usage quota for bulk generation
    if (!canGenerate()) {
      setShowUsageLimitModal(true);
      return;
    }

    const totalFiles = selectedFilesWithContent.length;
    const RATE_LIMIT_DELAY = 15000; // 15 seconds between requests to respect Claude API rate limits (8K tokens/min)
    let successCount = 0;
    let failureCount = 0;
    const failedFiles = [];
    const successfulFiles = []; // Track successful files with their quality scores

    // Clear previous doc panel content and summaries
    setDocumentation('');
    setQualityScore(null);
    setBulkGenerationSummary(null);
    setBulkGenerationErrors([]);

    // Initialize progress
    setBulkGenerationProgress({
      total: totalFiles,
      completed: 0,
      currentBatch: 1,
      totalBatches: 1
    });

    // Process files sequentially with rate limiting
    for (let i = 0; i < selectedFilesWithContent.length; i++) {
      const file = selectedFilesWithContent[i];

      // Update progress state
      setBulkGenerationProgress({
        total: totalFiles,
        completed: i,
        currentBatch: 1,
        totalBatches: 1
      });

      // Mark file as generating
      multiFileState.updateFile(file.id, {
        isGenerating: true,
        error: null
      });

      // Show which file is currently being generated
      setCurrentlyGeneratingFile({
        filename: file.filename,
        index: i + 1,
        total: totalFiles,
        docType: file.docType
      });

      // Clear previous documentation to show fresh streaming
      setDocumentation('');
      setQualityScore(null);

      try {
        // Generate documentation with streaming (users see live progress)
        const result = await generate(file.content, file.docType, file.language, false);

        const generatedAt = new Date();

        // Save document to database (if authenticated)
        let documentId = null;
        if (isAuthenticated) {
          try {
            const saveResult = await documentPersistence.saveDocument({
              filename: file.filename,
              language: file.language,
              fileSize: file.fileSize,
              documentation: result.documentation,
              qualityScore: result.qualityScore,
              docType: file.docType,
              origin: file.origin || 'upload',
              provider: result.metadata?.provider || 'claude',
              model: result.metadata?.model || 'claude-sonnet-4-5-20250929',
              github: file.github || null,
              llm: result.metadata || null
            }, 'save'); // Explicitly choose to save (bypass preference check)

            if (saveResult) {
              documentId = saveResult.documentId;
              console.log(`[App] Saved document to database: ${documentId}`);
            }
          } catch (saveError) {
            console.error('[App] Failed to save document to database:', saveError);
            // Continue even if save fails - don't block the generation
          }
        }

        // Update file with generated documentation
        multiFileState.updateFile(file.id, {
          documentation: result.documentation,
          qualityScore: result.qualityScore,
          isGenerating: false,
          error: null,
          documentId: documentId, // Set database ID if saved
          generatedAt // Timestamp of when documentation was generated
        });

        // Update usage tracking
        refetchUsage();

        // Track successful file
        successCount++;
        successfulFiles.push({
          name: file.filename,
          score: result.qualityScore?.score || 0,
          grade: result.qualityScore?.grade || 'N/A',
          qualityScore: result.qualityScore, // Include full quality score for breakdown
          docType: file.docType || 'README',
          generatedAt: generatedAt,
          fileId: file.id
        });

      } catch (error) {
        console.error(`[App] Failed to generate docs for ${file.filename}:`, error);

        // Update file with error state
        multiFileState.updateFile(file.id, {
          isGenerating: false,
          error: error.message
        });

        // Track failed file
        failureCount++;
        failedFiles.push({
          filename: file.filename,
          fileId: file.id,
          error: error.message
        });
      }

      // Update progress after each file
      setBulkGenerationProgress({
        total: totalFiles,
        completed: i + 1,
        currentBatch: 1,
        totalBatches: 1
      });

      // Clear currently generating file indicator
      setCurrentlyGeneratingFile(null);

      // Throttle between requests (except after last file)
      if (i < selectedFilesWithContent.length - 1) {
        console.log(`[App] Throttling for ${RATE_LIMIT_DELAY / 1000}s to respect API rate limits...`);

        // Show countdown during throttle delay
        const delaySeconds = RATE_LIMIT_DELAY / 1000;
        for (let remaining = delaySeconds; remaining > 0; remaining--) {
          setThrottleCountdown(remaining);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setThrottleCountdown(null);
      }
    }

    // Clear selection after generation
    multiFileState.deselectAllFiles();

    // Clear progress state
    setBulkGenerationProgress(null);

    // Calculate average quality score (Option A: Simple average of successes)
    let avgQuality = 0;
    let avgGrade = 'N/A';
    if (successfulFiles.length > 0) {
      const totalQuality = successfulFiles.reduce((sum, file) => sum + file.score, 0);
      avgQuality = Math.round(totalQuality / successfulFiles.length);

      // Calculate average grade
      if (avgQuality >= 90) avgGrade = 'A';
      else if (avgQuality >= 80) avgGrade = 'B';
      else if (avgQuality >= 70) avgGrade = 'C';
      else if (avgQuality >= 60) avgGrade = 'D';
      else avgGrade = 'F';
    }

    // Set summary state for banner
    const summaryData = {
      totalFiles,
      successCount,
      failCount: failureCount,
      avgQuality,
      avgGrade,
      successfulFiles
    };
    setBulkGenerationSummary(summaryData);

    // Also set errors for backward compatibility
    if (failedFiles.length > 0) {
      setBulkGenerationErrors(failedFiles);
    }

    // Clear active file so the sync effect doesn't overwrite the batch summary
    multiFileState.setActiveFile(null);

    // Generate and display batch summary document in DocPanel
    const summaryMarkdown = generateBatchSummaryDocument(summaryData, failedFiles);
    setDocumentation(summaryMarkdown);
    setBatchSummaryMarkdown(summaryMarkdown); // Store for navigation back from individual files

    // Set a special quality score to indicate this is a batch summary
    setQualityScore({
      score: avgQuality,
      grade: avgGrade,
      breakdown: null,
      isBatchSummary: true
    });

    // Show final result toast
    if (failureCount === 0) {
      toastCompact(
        `Successfully generated documentation for ${successCount} file${successCount > 1 ? 's' : ''}`,
        'success',
        { id: 'bulk-generation' }
      );
    } else if (successCount > 0) {
      toastCompact(
        `Generated ${successCount} of ${totalFiles} files. ${failureCount} failed - see banner above.`,
        'warning',
        { id: 'bulk-generation' }
      );
    } else {
      toastCompact(
        `Failed to generate documentation for all ${totalFiles} files - see banner above.`,
        'error',
        { id: 'bulk-generation' }
      );
    }
  };

  /**
   * Handle clicking on a file link in the batch summary
   * Finds the file and displays its documentation
   * @param {string} filename - Name of the file to display
   */
  const handleSummaryFileClick = (filename) => {
    const file = multiFileState.files.find(f => f.filename === filename);

    if (!file) {
      console.warn('[App] File not found in sidebar:', filename);
      toastCompact('File not found', 'error');
      return;
    }

    if (file.documentation) {
      // Display the file's documentation
      setDocumentation(file.documentation);
      setQualityScore(file.qualityScore);
      // Set the file as active in sidebar
      multiFileState.setActiveFile(file.id);
    } else {
      console.warn('[App] File has no documentation:', filename);
      toastCompact('Documentation not available for this file', 'error');
    }
  };

  /**
   * Handle returning to the batch summary from an individual file
   */
  const handleBackToSummary = () => {
    if (batchSummaryMarkdown) {
      setDocumentation(batchSummaryMarkdown);
      // Restore the batch summary quality score
      if (bulkGenerationSummary) {
        setQualityScore({
          score: bulkGenerationSummary.avgQuality,
          grade: bulkGenerationSummary.avgGrade,
          breakdown: null,
          isBatchSummary: true
        });
      }
      // Clear active file in sidebar
      multiFileState.setActiveFile(null);
    }
  };

  /**
   * Export a single file's documentation
   * @param {string} filename - Name of the file to export
   */
  const handleExportFile = (filename) => {
    const file = multiFileState.files.find(f => f.filename === filename);

    if (!file) {
      console.warn('[App] File not found:', filename);
      toastCompact('File not found', 'error');
      return;
    }

    if (!file.documentation) {
      console.warn('[App] File has no documentation:', filename);
      toastCompact('No documentation available for this file', 'error');
      return;
    }

    // Create a blob with the documentation content
    const blob = new Blob([file.documentation], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.filename}.md`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toastCompact(`Downloaded ${file.filename}.md`, 'success');
  };

  /**
   * Download all generated documentation as a ZIP file
   */
  const handleDownloadAllDocs = async () => {
    try {
      // Get all files with documentation
      const filesWithDocs = multiFileState.files.filter(f => f.documentation);

      if (filesWithDocs.length === 0) {
        toastCompact('No documentation available to download', 'error');
        return;
      }

      // Create a new JSZip instance
      const zip = new JSZip();

      // Add each file's documentation to the ZIP
      filesWithDocs.forEach(file => {
        const filename = `${file.filename}.md`;
        zip.file(filename, file.documentation);
      });

      // Also add the batch summary if it exists
      if (batchSummaryMarkdown) {
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        zip.file(`batch-summary-${timestamp}.md`, batchSummaryMarkdown);
      }

      // Generate the ZIP file
      const blob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `documentation-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toastCompact(
        `Downloaded ${filesWithDocs.length} documentation file${filesWithDocs.length > 1 ? 's' : ''}`,
        'success'
      );
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toastCompact('Failed to create ZIP file', 'error');
    }
  };

  /**
   * Apply docType to selected files
   * Clears existing documentation if docType changes on already-generated files
   * @param {Array} fileIds - Array of file IDs to update
   * @param {string} newDocType - New doc type to apply
   */
  const handleApplyDocType = (fileIds, newDocType) => {
    if (!fileIds || fileIds.length === 0) {
      return;
    }

    let filesWithClearedDocs = 0;
    let filesUpdated = 0;

    // Update docType for each selected file
    fileIds.forEach(fileId => {
      const file = multiFileState.files.find(f => f.id === fileId);

      if (!file) return;

      // If file has documentation and docType is changing, clear the docs
      if (file.documentation && file.docType !== newDocType) {
        multiFileState.updateFile(fileId, {
          docType: newDocType,
          documentation: null,    // Clear docs - no longer matches docType
          qualityScore: null      // Clear score
        });
        filesWithClearedDocs++;
      } else {
        // No docs yet, just update docType
        multiFileState.updateFile(fileId, { docType: newDocType });
      }
      filesUpdated++;
    });

    // No toast notification needed - user can see changes in file list
  };

  const handleUpload = () => {
    // Clear any previous upload errors
    setUploadError(null);
    // Trigger the hidden file input (single-file mode)
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleMultiFileUpload = () => {
    // Clear any previous upload errors
    setUploadError(null);
    // Trigger the hidden multi-file input (sidebar mode)
    if (multiFileInputRef.current) {
      multiFileInputRef.current.click();
    }
  };

  // Process file upload (used by both file input and drag-and-drop)
  const processFileUpload = async (file, retryCount = 0) => {
    if (!file) return;

    // Clear any previous upload errors and set loading state
    setUploadError(null);
    setIsUploading(true);

    // Log detailed file information for debugging
    console.log('[App] Processing file upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      lastModifiedDate: file.lastModifiedDate,
      retryCount,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
    });

    // Detect if file might be from cloud storage (Dropbox, Google Drive, etc.)
    // Cloud storage files often have these characteristics on mobile:
    const isLikelyCloudFile = file.size > 0 && (
      !file.lastModified || // No modification date
      file.type === '' // No MIME type initially
    );

    if (isLikelyCloudFile) {
      console.log('[App] Detected potential cloud storage file (Dropbox/Google Drive)');
    }

    try {
      // CRITICAL FIX: For cloud files on mobile, convert to Blob first
      // Mobile browsers may return a File reference that hasn't been downloaded yet from Dropbox/Drive
      // Reading it as ArrayBuffer and converting to Blob ensures we have the actual data
      let fileToUpload = file;

      if (isLikelyCloudFile) {
        console.log('[App] Pre-reading cloud file to ensure it\'s downloaded...');
        try {
          // Create a FileReader to force the browser to download/read the file
          const reader = new FileReader();
          const fileData = await new Promise((resolve, reject) => {
            reader.onload = () => {
              console.log('[App] Cloud file successfully read, size:', reader.result.byteLength);
              resolve(reader.result);
            };
            reader.onerror = () => {
              console.error('[App] Failed to read cloud file:', reader.error);
              reject(new Error('Unable to read file from cloud storage. Please try downloading it to your device first.'));
            };
            // Read as ArrayBuffer to ensure we get the actual file content
            reader.readAsArrayBuffer(file);
          });

          // Convert ArrayBuffer to Blob with correct MIME type
          // Use File constructor to preserve filename
          const blob = new Blob([fileData], { type: file.type || 'text/plain' });
          fileToUpload = new File([blob], file.name, {
            type: file.type || 'text/plain',
            lastModified: file.lastModified || Date.now()
          });
          console.log('[App] Cloud file converted to File object:', {
            name: fileToUpload.name,
            size: fileToUpload.size,
            type: fileToUpload.type
          });
        } catch (readError) {
          console.error('[App] Cloud file read error:', readError);

          // Provide helpful message for cloud storage issues on mobile
          const helpfulError = new Error(
            'Unable to upload file directly from Dropbox or Google Drive.\n\n' +
            '📥 Workaround: Download the file to your device first, then upload it from your Downloads folder.\n\n' +
            'This is a known limitation on mobile browsers when accessing cloud storage files.'
          );
          helpfulError.name = readError.name;
          throw helpfulError;
        }
      }

      // Perform client-side validation (use the potentially converted file)
      const validation = validateFile(fileToUpload);

      if (!validation.valid) {
        const errorMessage = getValidationErrorMessage(validation);
        setUploadError(errorMessage);
        return;
      }

      // Log warnings if any (e.g., unexpected MIME type)
      if (validation.warnings.length > 0) {
        console.warn('File upload warnings:', validation.warnings);
      }

      // Create FormData to send file to backend
      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Get auth token if available
      const token = getToken();
      const headers = {};

      // Add Authorization header if user is authenticated
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Construct the upload URL - use absolute path for production
      const uploadUrl = API_URL ? `${API_URL}/api/upload` : '/api/upload';
      console.log('[App] Uploading file to:', uploadUrl);

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      // Longer timeout for cloud storage files (mobile needs time to download from Dropbox/Drive first)
      const timeoutMs = isLikelyCloudFile ? 30000 : 15000; // 30s for cloud, 15s for local
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'File upload failed');
      }

      const data = await response.json();

      if (data.success && data.file) {
        // Set the uploaded file content in the editor
        setCode(data.file.content);
        setFilename(data.file.name);
        // Language will be derived from filename automatically

        // Detect language for analytics tracking
        const detectedLanguage = detectLanguageFromFilename(data.file.name);

        // Track successful file upload
        trackFileUpload({
          fileType: data.file.extension.toLowerCase().replace('.', ''),
          fileSize: file.size,
          success: true,
        });

        // Track code input method
        trackCodeInput('upload', data.file.content.length, detectedLanguage);

        // Clear loading state (no success toast needed - file appearing in editor is clear feedback)
        setIsUploading(false);
      }
    } catch (error) {
      console.error('[App] Error uploading file:', error);
      console.error('[App] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        apiUrl: API_URL,
        uploadUrl: API_URL ? `${API_URL}/api/upload` : '/api/upload',
        isCloudFile: isLikelyCloudFile,
        retryCount,
        navigator: {
          online: navigator.onLine,
          userAgent: navigator.userAgent,
          connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
          } : 'not available',
        },
      });

      // Check if this is an AbortError (timeout)
      const isTimeout = error.name === 'AbortError';

      // Check if this is a transient network error that might benefit from retry
      const isRetryable = (
        error.name === 'TypeError' ||
        error.message.includes('Failed to fetch') ||
        isTimeout
      ) && retryCount < 2; // Allow up to 2 retries

      // If retryable and we haven't exceeded retry limit, try again
      if (isRetryable) {
        console.log(`[App] Retrying file upload (attempt ${retryCount + 1}/2)...`);
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return processFileUpload(file, retryCount + 1);
      }

      // Provide more helpful error messages based on error type
      let userFriendlyMessage = 'Unable to upload file';

      if (isTimeout) {
        // Timeout error - provide context about cloud storage
        userFriendlyMessage = isLikelyCloudFile
          ? 'File upload timed out. When selecting files from Dropbox or Google Drive, your device needs to download the file first. Please ensure you have a stable connection and try again.'
          : 'File upload timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        // Network connectivity issues - provide more context
        // On mobile, always mention the Dropbox workaround since detection isn't 100% reliable
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile) {
          userFriendlyMessage = 'Unable to upload file.\n\n' +
            'If selecting from Dropbox/Google Drive:\n' +
            '📥 Download the file to your device first, then upload it from your Downloads folder.\n\n' +
            'Otherwise, please check your internet connection and try again.';
        } else {
          userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        }
      } else if (error.message.includes('413') || error.message.includes('too large')) {
        // File too large
        userFriendlyMessage = 'File is too large to upload. Please choose a smaller file.';
      } else if (error.message.includes('415') || error.message.includes('Unsupported')) {
        // Unsupported file type
        userFriendlyMessage = 'Unsupported file type. Please upload a valid code file.';
      } else if (error.message.includes('500')) {
        // Server error
        userFriendlyMessage = 'Server error occurred while uploading the file. Please try again.';
      } else if (error.message.includes('503')) {
        // Service unavailable
        userFriendlyMessage = 'Upload service temporarily unavailable. Please try again in a moment.';
      } else {
        // Use the original error message if it's descriptive
        userFriendlyMessage = error.message && error.message !== 'File upload failed'
          ? `Unable to upload file. ${error.message}`
          : 'Unable to upload file. Please try again.';
      }

      // Create a structured error object with full details for dev mode (similar to useDocGeneration)
      const errorObject = {
        message: userFriendlyMessage,           // User-friendly message
        type: error.name || 'Error',            // Error type
        originalMessage: error.message,         // Original error message from server/network
        stack: error.stack,                     // Stack trace if available
        timestamp: new Date().toISOString(),    // ISO timestamp
      };

      setUploadError(JSON.stringify(errorObject));

      // Clear loading state
      setIsUploading(false);

      // Track failed file upload
      trackFileUpload({
        fileType: file.name.split('.').pop(),
        fileSize: file.size,
        success: false,
      });

      // No toast needed - error banner will display the error
    } finally {
      // Ensure loading state is always cleared
      setIsUploading(false);
    }
  };

  // Wrapper for file input change event (single-file mode)
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    await processFileUpload(file);
    // Reset the file input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handler for multi-file drag and drop (sidebar mode)
  const handleMultiFilesDrop = async (droppedFiles) => {
    if (!droppedFiles || droppedFiles.length === 0) return;

    let validFilesCount = 0;

    // Process all files and add to sidebar
    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];

      // Validate file type and size
      const validation = validateFile(file);
      if (!validation.valid) {
        console.warn('[App] File validation failed:', file.name, validation);
        setUnsupportedFileModal({
          isOpen: true,
          fileName: file.name,
          fileExtension: validation.file?.extension || ''
        });
        continue; // Skip this file
      }

      // Check if file with same name already exists
      const existingFile = multiFileState.files.find(f => f.filename === file.name);
      if (existingFile) {
        console.log('[App] File already exists, skipping:', file.name);
        toastCompact(`File already exists: ${file.name}`, 'warning');
        continue; // Skip this file
      }

      // Track valid files
      validFilesCount++;

      // Add file directly to sidebar without uploading to server yet
      // The actual upload will happen when "Generate All" is clicked
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        // Detect language from filename
        const detectedLanguage = detectLanguageFromFilename(file.name);

        multiFileState.addFile({
          filename: file.name,
          content,
          language: detectedLanguage,
        });

        console.log('[App] File added to sidebar:', file.name);
      };

      reader.onerror = () => {
        console.error('[App] Error reading file:', file.name);
        toastCompact(`Error reading file: ${file.name}`, 'error');
      };

      reader.readAsText(file);
    }

    // Show success toast only if at least one valid file was added
    if (validFilesCount > 0) {
      toastCompact(`${validFilesCount} file${validFilesCount > 1 ? 's' : ''} added`, 'success');
    }
  };

  // Handler for multi-file input change (sidebar mode)
  const handleMultiFileChange = async (event) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    // Process all files and add to sidebar
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Validate file type and size
      const validation = validateFile(file);
      if (!validation.valid) {
        console.warn('[App] File validation failed:', file.name, validation);
        setUnsupportedFileModal({
          isOpen: true,
          fileName: file.name,
          fileExtension: validation.file?.extension || ''
        });
        continue; // Skip this file
      }

      // Check if file with same name already exists
      const existingFile = multiFileState.files.find(f => f.filename === file.name);
      if (existingFile) {
        console.log('[App] File already exists, skipping:', file.name);
        toastCompact(`File already exists: ${file.name}`, 'warning');
        continue; // Skip this file
      }

      // Add file directly to sidebar without uploading to server yet
      // The actual upload will happen when "Generate All" is clicked
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        // Detect language from filename
        const detectedLanguage = detectLanguageFromFilename(file.name);

        multiFileState.addFile({
          filename: file.name,
          language: detectedLanguage,
          content: content,
          docType,
          origin: 'upload',
          fileSize: file.size
        });
      };
      reader.readAsText(file);
    }

    // Reset the file input so the same files can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handler for drag-and-drop
  const handleFileDrop = async (file) => {
    await processFileUpload(file);
  };

  const handleGithubImport = () => {
    setShowGithubModal(true);
  };

  const handleGithubFileLoad = ({ code: fileCode, language: fileLang, filename: fileName, metadata }) => {
    // Set the code from GitHub file
    setCode(fileCode);

    // Set filename (language will be derived from filename)
    if (fileName) {
      setFilename(fileName);
    }

    // Track analytics
    trackInteraction('github_file_loaded', {
      owner: metadata?.owner,
      repo: metadata?.repo,
      path: metadata?.path,
      language: fileLang || detectLanguageFromFilename(fileName)
    });

    // Clear any previous documentation (user-scoped)
    reset();
    if (user && user.id) {
      const docKey = getEditorKey(user.id, 'doc');
      const scoreKey = getEditorKey(user.id, 'score');
      if (docKey) setStorageItem(docKey, '');
      if (scoreKey) setStorageItem(scoreKey, '');
    } else {
      setStorageItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, '');
      setStorageItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, '');
    }
  };

  const handleLoadSample = (sample) => {
    setCode(sample.code);
    setDocType(sample.docType);

    // Set filename based on sample title and language (language will be derived from filename)
    const sampleName = (sample.title || sample.docType).toLowerCase().replace(/\s+/g, '-');
    const extensionMap = {
      'javascript': '.js',
      'typescript': '.ts',
      'python': '.py',
      'java': '.java',
      'cpp': '.cpp',
      'c': '.c',
      'csharp': '.cs',
      'go': '.go',
      'rust': '.rs',
      'ruby': '.rb',
      'php': '.php',
    };
    const extension = extensionMap[sample.language] || '.js';
    setFilename(`${sampleName}${extension}`);

    reset(); // Clear any existing documentation and quality score

    // Track sample usage
    trackExampleUsage(sample.title || sample.docType);
    trackCodeInput('sample', sample.code.length, sample.language);

    // Use compact toast for quick, non-intrusive feedback
    toastCompact('Sample loaded successfully', 'success');
  };

  const handleUpgradeClick = () => {
    // Navigate to pricing page
    window.location.href = '/pricing';
  };

  const handleClear = () => {
    const defaultCode = '// Paste your code here or try the example below...\n\n// Example function:\nfunction calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n';
    const defaultFilename = 'code.js';

    // Reset code to default placeholder
    setCode(defaultCode);
    // Reset filename to default (language will be derived automatically as 'javascript')
    setFilename(defaultFilename);

    // Clear from localStorage (both global and user-scoped keys)
    // IMPORTANT: Clear BOTH keys because initial state loads from global key on mount
    setStorageItem(STORAGE_KEYS.EDITOR_CODE, defaultCode); // Always clear global key
    setStorageItem(STORAGE_KEYS.EDITOR_FILENAME, defaultFilename);

    if (user && user.id) {
      // User is logged in - also clear user-scoped key
      const key = getEditorKey(user.id, 'code');
      if (key) {
        setStorageItem(key, defaultCode);
      }
    }

    // Deselect active file in sidebar (clearing means no file is active in the editor)
    // This also triggers workspace state to save activeFileId=null to localStorage
    multiFileState.setActiveFile(null);

    // Note: Does not clear documentation or quality score (those remain for reference)
  };

  /**
   * Remove a single file from workspace (keeps generated document in history)
   */
  const handleRemoveFile = useCallback(async (fileId) => {
    // Remove file from workspace (persistence layer handles workspace_files table)
    // NOTE: Does NOT delete from generated_documents - keeps doc in user's history
    multiFileState.removeFile(fileId);
  }, [multiFileState]);

  /**
   * Delete selected files from workspace (keeps generated documents in history)
   * Used by both: (1) Delete button and (2) "Delete workspace" link in info banner
   */
  const handleDeleteSelected = useCallback(async () => {
    const selectedIds = multiFileState.selectedFileIds;
    if (selectedIds.length === 0) return;

    const isDeletingAll = selectedIds.length === multiFileState.files.length;

    // Remove files from workspace (persistence layer handles workspace_files table)
    // NOTE: Does NOT delete from generated_documents - keeps docs in user's history
    multiFileState.removeFiles(selectedIds);

    // If deleting ALL files, also clear batch summary and documentation state
    if (isDeletingAll) {
      setBulkGenerationSummary(null);
      setBatchSummaryMarkdown(null);
      removeSessionItem('bulk_generation_summary');
      removeSessionItem('batch_summary_markdown');
      setDocumentation('');
      setQualityScore(null);
    }
  }, [multiFileState]);

  // Expose test data loader to window for console access (development/testing)
  useEffect(() => {
    const loadTestDoc = createTestDataLoader(setDocumentation, setQualityScore, setCode);
    const cleanup = exposeTestDataLoader(loadTestDoc);
    return cleanup;
  }, [setDocumentation, setQualityScore, setCode]);

  // Expose usage simulator to window for console access (development/testing)
  useEffect(() => {
    const cleanup = exposeUsageSimulator();
    return cleanup;
  }, []);

  // Expose skeleton loader test helper (development/testing)
  useEffect(() => {
    const skeletonHelper = createSkeletonTestHelper(setDocumentation, setQualityScore, setTestSkeletonMode);
    const cleanup = exposeSkeletonTestHelper(skeletonHelper);
    return cleanup;
  }, [setDocumentation, setQualityScore, setTestSkeletonMode]);

  // Show toast notifications for documentation generation success only
  // Track previous isGenerating state to detect generation completion
  const prevGeneratingRef = useRef(isGenerating);

  useEffect(() => {
    // Only show toast if generation just completed (not loaded from storage)
    if (prevGeneratingRef.current && !isGenerating && documentation && qualityScore) {
      toastDocGenerated(qualityScore.grade, qualityScore.score);
    }
    prevGeneratingRef.current = isGenerating;
  }, [documentation, qualityScore, isGenerating]);

  // Error toasts removed - errors are displayed via ErrorBanner component instead

  // Memoize DocPanel callbacks to prevent unnecessary re-renders
  const handleViewBreakdown = useCallback(() => {
    setShowQualityModal(true);
    trackInteraction('view_quality_breakdown', {
      score: qualityScore?.score,
      grade: qualityScore?.grade,
    });
  }, [qualityScore]);

  const handleReset = useCallback(() => {
    // Clear documentation and quality score from state
    reset();

    // Clear from localStorage (both global and user-scoped keys)
    // IMPORTANT: Clear BOTH keys because initial state loads from global key on mount
    setStorageItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, ''); // Always clear global keys
    setStorageItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, '');

    if (user && user.id) {
      // User is logged in - also clear user-scoped keys
      const docKey = getEditorKey(user.id, 'doc');
      const scoreKey = getEditorKey(user.id, 'score');
      if (docKey) setStorageItem(docKey, '');
      if (scoreKey) setStorageItem(scoreKey, '');
    }

    // Clear batch summary if that's what's being displayed
    if (batchSummaryMarkdown && documentation === batchSummaryMarkdown) {
      setBatchSummaryMarkdown(null);
      setBulkGenerationSummary(null);
      removeSessionItem('batch_summary_markdown');
      removeSessionItem('bulk_generation_summary');
    }

    // Deselect active file in sidebar (clearing means no file is active in the doc panel)
    // This also triggers workspace state to save activeFileId=null to localStorage
    multiFileState.setActiveFile(null);
  }, [reset, multiFileState, batchSummaryMarkdown, documentation, user]);

  // Memoized panel components to avoid duplication (DRY principle)
  const codePanel = useMemo(() => (
    <CodePanel
      code={code}
      onChange={setCode}
      filename={filename}
      language={language}
      onFileDrop={null}
      onClear={handleClear}
      onSamplesClick={() => setShowSamplesModal(true)}
      samplesButtonRef={samplesButtonRef}
    />
  ), [code, filename, language, samplesButtonRef]);

  const docPanel = useMemo(() => (
    <Suspense fallback={<LoadingFallback />}>
      <DocPanel
        documentation={documentation}
        qualityScore={qualityScore}
        isGenerating={isGenerating || testSkeletonMode}
        onViewBreakdown={handleViewBreakdown}
        onUpload={handleUpload}
        onGithubImport={handleGithubImport}
        onGenerate={handleGenerate}
        onReset={handleReset}
        bulkGenerationProgress={bulkGenerationProgress}
        bulkGenerationSummary={bulkGenerationSummary}
        bulkGenerationErrors={bulkGenerationErrors}
        currentlyGeneratingFile={currentlyGeneratingFile}
        throttleCountdown={throttleCountdown}
        onDismissBulkErrors={() => {
          setBulkGenerationErrors([]);
          setBulkGenerationSummary(null);
        }}
        onSummaryFileClick={handleSummaryFileClick}
        onBackToSummary={handleBackToSummary}
        onDownloadAllDocs={handleDownloadAllDocs}
        batchSummaryMarkdown={batchSummaryMarkdown}
        canUseBatchProcessing={canUseBatchProcessing}
        onExportFile={handleExportFile}
      />
    </Suspense>
  ), [
    documentation,
    qualityScore,
    isGenerating,
    testSkeletonMode,
    bulkGenerationProgress,
    bulkGenerationSummary,
    bulkGenerationErrors,
    currentlyGeneratingFile,
    throttleCountdown,
    batchSummaryMarkdown,
    canUseBatchProcessing
  ]);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors">
      {/* Skip to Main Content Link - for keyboard navigation */}
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            // Find first focusable element in main content
            const focusable = mainContent.querySelector(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (focusable) {
              focusable.focus();
            } else {
              mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }}
        className="absolute left-[-9999px] focus:left-4 focus:top-4 z-[9999] bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950"
      >
        Skip to main content
      </a>

      {/* Toast Notifications Container - Theme-aware styling */}
      <Toaster
        position={isMobileView ? 'top-center' : 'top-right'}
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{
          // Safe area insets for mobile devices with notches/home indicators
          ...(isMobileView && {
            top: 'env(safe-area-inset-top, 0px)',
          }),
        }}
        toastOptions={{
          // Accessibility - prevent toast container from being focusable
          ariaProps: {
            role: 'status',
            'aria-live': 'polite',
          },
          // Mobile-optimized durations (longer than desktop for distraction)
          duration: isMobileView ? 5000 : 4000,
          // Theme-aware default styling
          style: {
            background: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : 'rgb(255 255 255)', // slate-800 : white
            color: effectiveTheme === 'dark' ? 'rgb(248 250 252)' : 'rgb(15 23 42)', // slate-50 : slate-900
            border: effectiveTheme === 'dark' ? '1px solid rgb(51 65 85)' : '1px solid rgb(203 213 225)', // slate-700 : slate-300
            // Mobile-specific: near full-width for better readability
            maxWidth: isMobileView ? 'calc(100vw - 32px)' : '28rem',
            width: isMobileView ? 'auto' : undefined,
          },
          // Success toasts
          success: {
            duration: isMobileView ? 4000 : 3000,
            iconTheme: {
              primary: effectiveTheme === 'dark' ? '#4ADE80' : '#16A34A', // green-400 : green-600
              secondary: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : '#FFFFFF',
            },
          },
          // Error toasts - longer on mobile since errors need attention
          error: {
            duration: isMobileView ? 7000 : 5000,
            iconTheme: {
              primary: effectiveTheme === 'dark' ? '#F87171' : '#DC2626', // red-400 : red-600
              secondary: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : '#FFFFFF',
            },
          },
          // Loading toasts
          loading: {
            iconTheme: {
              primary: effectiveTheme === 'dark' ? '#C084FC' : '#9333EA', // purple-400 : purple-600
              secondary: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : '#FFFFFF',
            },
          },
        }}
      />

      {/* Hidden file input (single-file mode) */}
      <input
        ref={fileInputRef}
        type="file"
        id="file-upload-input"
        name="file-upload"
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.hpp,.cs,.go,.rs,.rb,.php,.txt,text/javascript,text/x-javascript,application/javascript,text/x-typescript,text/typescript,text/x-python,text/x-java-source,text/x-c,text/x-c++,text/x-csharp,text/x-go,text/x-rust,text/x-ruby,text/x-php,text/plain"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload code file"
      />

      {/* Hidden file input (multi-file mode for sidebar) */}
      <input
        ref={multiFileInputRef}
        type="file"
        id="multi-file-upload-input"
        name="multi-file-upload"
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.hpp,.cs,.go,.rs,.rb,.php,.txt,text/javascript,text/x-javascript,application/javascript,text/x-typescript,text/typescript,text/x-python,text/x-java-source,text/x-c,text/x-c++,text/x-csharp,text/x-go,text/x-rust,text/x-ruby,text/x-php,text/plain"
        multiple
        onChange={handleMultiFileChange}
        className="hidden"
        aria-label="Upload multiple code files"
      />

      {/* Header */}
      <Header
        ref={headerRef}
        onMenuClick={() => setShowMobileMenu(true)}
        onHelpClick={() => setShowHelpModal(true)}
        showSidebarMenu={canUseBatchProcessing && isMobileView}
        onSidebarMenuClick={() => setMobileSidebarOpen(true)}
        layout={layout}
        onLayoutChange={handleLayoutChange}
      />

      {/* Email Verification Banner - Shows at top for unverified users */}
      <UnverifiedEmailBanner user={user} />

      {/* Tier Override Banner - Shows for admin/support with active override */}
      {override && override.active && (
        <TierOverrideBanner
          override={override}
          onClear={async () => {
            await clearOverride();
            // Reload to apply tier changes
            window.location.reload();
          }}
        />
      )}

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        onHelpClick={() => setShowHelpModal(true)}
      />

      {/* Main Content - with optional Sidebar for Pro+ users */}
      <div className="flex-1 flex overflow-hidden relative">
        {canUseBatchProcessing ? (
          isMobileView ? (
            // Mobile/Tablet: Sidebar as overlay, no PanelGroup
            <>
              <Sidebar
                files={multiFileState.files}
                activeFileId={multiFileState.activeFileId}
                selectedFileIds={multiFileState.selectedFileIds}
                selectedCount={multiFileState.selectedCount}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={handleToggleSidebarCollapse}
                docType={docType}
                onDocTypeChange={setDocType}
                onApplyDocType={handleApplyDocType}
                onGithubImport={handleGithubImport}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
                onSelectFile={multiFileState.setActiveFile}
                onToggleFileSelection={multiFileState.toggleFileSelection}
                onSelectAllFiles={multiFileState.selectAllFiles}
                onDeselectAllFiles={multiFileState.deselectAllFiles}
                onRemoveFile={handleRemoveFile}
                onAddFile={handleMultiFileUpload}
                hasCodeInEditor={code.trim().length > 0}
                onFilesDrop={handleMultiFilesDrop}
                onGenerateFile={(fileId) => {
                  // Single file generation not implemented - users should use ControlBar
                  // Multi-file sidebar is for batch operations only
                  console.log('[App] Single file generation not supported from sidebar:', fileId);
                }}
                onGenerateSelected={() => {
                  // Check if any files are selected
                  const filesWithContent = multiFileState.files.filter(f => f.content && f.content.length > 0);
                  const selectedFilesWithContent = filesWithContent.filter(f => multiFileState.selectedFileIds.includes(f.id));

                  if (selectedFilesWithContent.length > 0) {
                    // Generate documentation for all selected files
                    handleGenerateSelected();
                  } else {
                    // No files selected, show confirmation to generate from code editor
                    setShowGenerateFromEditorModal(true);
                  }
                }}
                onDeleteSelected={handleDeleteSelected}
                bulkGenerationProgress={bulkGenerationProgress}
              />

              {/* Main Content - Full width on mobile */}
              <div className="flex-1 min-w-0">
                <main id="main-content" className="flex-1 w-full h-full flex flex-col overflow-auto lg:overflow-hidden lg:min-h-0">

        {/* Priority Banner Section - Show only most critical message */}
        {/* Priority Order: 1) Email Verification (handled above), 2) Claude API Error, 3) Upload Error, 4) Generation Error, 5) Usage Warning */}
        {error ? (
          // Priority 1: Claude API rate limit or generation errors (blocking)
          <div role="region" aria-label="Error notification">
            <ErrorBanner
              error={error}
              retryAfter={retryAfter}
              onDismiss={clearError}
            />
          </div>
        ) : uploadError ? (
          // Priority 2: Upload errors
          <div role="region" aria-label="Upload error notification">
            <ErrorBanner
              error={uploadError}
              onDismiss={() => setUploadError(null)}
            />
          </div>
        ) : showUsageWarning && (mockUsage || usage) ? (
          // Priority 3: Usage warning (80%+ usage, non-blocking)
          <div className="mb-6" role="region" aria-label="Usage warning">
            <UsageWarningBanner
              usage={mockUsage || getUsageForPeriod('monthly')}
              currentTier={mockUsage?.tier || usage?.tier}
              onDismiss={() => {
                setShowUsageWarning(false);
                setMockUsage(null); // Clear mock when dismissing
              }}
              onUpgrade={handleUpgradeClick}
            />
          </div>
        ) : null}

        {/* Control Bar - Hidden in Pro+ mode (sidebar has these controls) */}

        {/* Mobile Tabs - Only visible on mobile (<1024px) */}
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex">
            <button
              type="button"
              onClick={() => setMobileActiveTab('code')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                mobileActiveTab === 'code'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileActiveTab('doc')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                mobileActiveTab === 'doc'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documentation</span>
            </button>
          </div>
        </div>

        {/* Content Area - Mobile tabs or Desktop split view */}
        <div className="flex-1 min-h-0">
          {isMobileView ? (
            // Mobile: Show only active tab (full screen)
            mobileActiveTab === 'code' ? codePanel : docPanel
          ) : (
            // Desktop: Split view (side by side)
            <SplitPanel leftPanel={codePanel} rightPanel={docPanel} />
          )}
        </div>

              </main>
              </div>
            </>
          ) : (
            // Desktop: Sidebar with resizable panels
            <PanelGroup direction="horizontal" onLayout={handleSidebarResize} className="flex-1">
              {/* Sidebar Panel - Resizable */}
              <Panel
                ref={sidebarPanelRef}
                defaultSize={sidebarCollapsed ? 3 : expandedSidebarWidth}
                minSize={3}
                maxSize={40}
                collapsible={false}
              >
                <Sidebar
                  files={multiFileState.files}
                  activeFileId={multiFileState.activeFileId}
                  selectedFileIds={multiFileState.selectedFileIds}
                  selectedCount={multiFileState.selectedCount}
                  isCollapsed={sidebarCollapsed}
                  onToggleCollapse={handleToggleSidebarCollapse}
                  docType={docType}
                  onDocTypeChange={setDocType}
                  onApplyDocType={handleApplyDocType}
                  onGithubImport={handleGithubImport}
                  mobileOpen={mobileSidebarOpen}
                  onMobileClose={() => setMobileSidebarOpen(false)}
                  onSelectFile={multiFileState.setActiveFile}
                  onToggleFileSelection={multiFileState.toggleFileSelection}
                  onSelectAllFiles={multiFileState.selectAllFiles}
                  onDeselectAllFiles={multiFileState.deselectAllFiles}
                  onRemoveFile={handleRemoveFile}
                  onAddFile={handleMultiFileUpload}
                  hasCodeInEditor={code.trim().length > 0}
                  onFilesDrop={handleMultiFilesDrop}
                  onGenerateFile={(fileId) => {
                    // TODO: Implement single file generation
                    console.log('[App] Generate file requested:', fileId);
                  }}
                  onGenerateSelected={() => {
                    // Check if any files are selected
                    const filesWithContent = multiFileState.files.filter(f => f.content && f.content.length > 0);
                    const selectedFilesWithContent = filesWithContent.filter(f => multiFileState.selectedFileIds.includes(f.id));

                    if (selectedFilesWithContent.length > 0) {
                      // Generate documentation for all selected files
                      handleGenerateSelected();
                    } else {
                      // No files selected, show confirmation to generate from code editor
                      setShowGenerateFromEditorModal(true);
                    }
                  }}
                  onDeleteSelected={handleDeleteSelected}
                  bulkGenerationProgress={bulkGenerationProgress}
                />
              </Panel>

              {/* Resize Handle - Always present but hidden when collapsed */}
              <PanelResizeHandle
                className={`w-1 transition-colors ${
                  sidebarCollapsed
                    ? 'bg-transparent pointer-events-none'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-purple-400 dark:hover:bg-purple-600 cursor-col-resize'
                }`}
              />

              {/* Main Content Panel */}
              <Panel defaultSize={sidebarCollapsed ? 97 : (100 - expandedSidebarWidth)} minSize={30}>
                <main id="main-content" className="w-full h-full flex flex-col overflow-hidden">

                  {/* Priority Banner Section - Show only most critical message */}
                  {/* Priority Order: 1) Email Verification (handled above), 2) Claude API Error, 3) Upload Error, 4) Generation Error, 5) Usage Warning */}
                  {error ? (
                    // Priority 1: Claude API rate limit or generation errors (blocking)
                    <div role="region" aria-label="Error notification">
                      <ErrorBanner
                        error={error}
                        retryAfter={retryAfter}
                        onDismiss={clearError}
                      />
                    </div>
                  ) : uploadError ? (
                    // Priority 2: Upload errors
                    <div role="region" aria-label="Upload error notification">
                      <ErrorBanner
                        error={uploadError}
                        onDismiss={() => setUploadError(null)}
                      />
                    </div>
                  ) : showUsageWarning && (mockUsage || usage) ? (
                    // Priority 3: Usage warning (80%+ usage, non-blocking)
                    <div className="mb-6" role="region" aria-label="Usage warning">
                      <UsageWarningBanner
                        usage={mockUsage || getUsageForPeriod('monthly')}
                        currentTier={mockUsage?.tier || usage?.tier}
                        onDismiss={() => {
                          setShowUsageWarning(false);
                          setMockUsage(null); // Clear mock when dismissing
                        }}
                        onUpgrade={handleUpgradeClick}
                      />
                    </div>
                  ) : null}

                  {/* Control Bar - Hidden in Pro+ mode (sidebar has these controls) */}

                  {/* Layout Views: Split | Code Only | Doc Only */}
                  <div className="flex-1 min-h-0 transition-all duration-300">
                    {layout === 'split' ? (
                      // Split View: Code + Documentation
                      <SplitPanel
                        leftPanel={
                          <CodePanel
                            code={code}
                            onChange={setCode}
                            filename={filename}
                            language={language}
                            onFileDrop={null}  // Disable drag-and-drop in multi-file mode - use sidebar instead
                            onClear={handleClear}
                            onSamplesClick={() => setShowSamplesModal(true)}
                            samplesButtonRef={samplesButtonRef}
                          />
                        }
                        rightPanel={
                          <Suspense fallback={<LoadingFallback />}>
                            <DocPanel
                              documentation={documentation}
                              qualityScore={qualityScore}
                              isGenerating={isGenerating || testSkeletonMode}
                              onViewBreakdown={handleViewBreakdown}
                              onUpload={handleUpload}
                              onGithubImport={handleGithubImport}
                              onGenerate={handleGenerate}
                              onReset={handleReset}
                              bulkGenerationProgress={bulkGenerationProgress}
                              bulkGenerationSummary={bulkGenerationSummary}
                              bulkGenerationErrors={bulkGenerationErrors}
                              currentlyGeneratingFile={currentlyGeneratingFile}
                              throttleCountdown={throttleCountdown}
                              onDismissBulkErrors={() => {
                                setBulkGenerationErrors([]);
                                setBulkGenerationSummary(null);
                              }}
                              onSummaryFileClick={handleSummaryFileClick}
                              onBackToSummary={handleBackToSummary}
                              onDownloadAllDocs={handleDownloadAllDocs}
                              batchSummaryMarkdown={batchSummaryMarkdown}
                              canUseBatchProcessing={canUseBatchProcessing}
                              onExportFile={handleExportFile}
                            />
                          </Suspense>
                        }
                      />
                    ) : layout === 'code' ? (
                      // Code Only View
                      <CodePanel
                        code={code}
                        onChange={setCode}
                        filename={filename}
                        language={language}
                        onFileDrop={null}
                        onClear={handleClear}
                        onSamplesClick={() => setShowSamplesModal(true)}
                        samplesButtonRef={samplesButtonRef}
                      />
                    ) : (
                      // Doc Only View
                      <Suspense fallback={<LoadingFallback />}>
                        <DocPanel
                          documentation={documentation}
                          qualityScore={qualityScore}
                          isGenerating={isGenerating || testSkeletonMode}
                          onViewBreakdown={handleViewBreakdown}
                          onUpload={handleUpload}
                          onGithubImport={handleGithubImport}
                          onGenerate={handleGenerate}
                          onReset={handleReset}
                          bulkGenerationProgress={bulkGenerationProgress}
                          bulkGenerationSummary={bulkGenerationSummary}
                          bulkGenerationErrors={bulkGenerationErrors}
                          currentlyGeneratingFile={currentlyGeneratingFile}
                          throttleCountdown={throttleCountdown}
                          onDismissBulkErrors={() => {
                            setBulkGenerationErrors([]);
                            setBulkGenerationSummary(null);
                          }}
                          onSummaryFileClick={handleSummaryFileClick}
                          onBackToSummary={handleBackToSummary}
                          onDownloadAllDocs={handleDownloadAllDocs}
                          batchSummaryMarkdown={batchSummaryMarkdown}
                          canUseBatchProcessing={canUseBatchProcessing}
                          onExportFile={handleExportFile}
                        />
                      </Suspense>
                    )}
                  </div>

                </main>
              </Panel>
            </PanelGroup>
          )
        ) : (
          <main id="main-content" className="flex-1 w-full flex flex-col overflow-auto lg:overflow-hidden lg:min-h-0">
            {/* Priority Banner Section - Show only most critical message */}
            {/* Priority Order: 1) Email Verification (handled above), 2) Claude API Error, 3) Upload Error, 4) Generation Error, 5) Usage Warning */}
            {error ? (
              // Priority 1: Claude API rate limit or generation errors (blocking)
              <div role="region" aria-label="Error notification">
                <ErrorBanner
                  error={error}
                  retryAfter={retryAfter}
                  onDismiss={clearError}
                />
              </div>
            ) : uploadError ? (
              // Priority 2: Upload errors
              <div role="region" aria-label="Upload error notification">
                <ErrorBanner
                  error={uploadError}
                  onDismiss={() => setUploadError(null)}
                />
              </div>
            ) : showUsageWarning && (mockUsage || usage) ? (
              // Priority 3: Usage warning (80%+ usage, non-blocking)
              <div className="mb-6" role="region" aria-label="Usage warning">
                <UsageWarningBanner
                  usage={mockUsage || getUsageForPeriod('monthly')}
                  currentTier={mockUsage?.tier || usage?.tier}
                  onDismiss={() => {
                    setShowUsageWarning(false);
                    setMockUsage(null); // Clear mock when dismissing
                  }}
                  onUpgrade={handleUpgradeClick}
                />
              </div>
            ) : null}

            {/* Control Bar */}
            <ControlBar
              docType={docType}
              onDocTypeChange={setDocType}
              onGenerate={handleGenerate}
              onUpload={handleUpload}
              onGithubImport={handleGithubImport}
              onMenuClick={() => setMobileSidebarOpen(true)}
              showMenuButton={canUseBatchProcessing}
              isGenerating={isGenerating}
              isUploading={isUploading}
              generateDisabled={!code.trim()}
            />

            {/* Mobile Tabs - Only visible on mobile (<1024px) */}
            <div className="lg:hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setMobileActiveTab('code')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    mobileActiveTab === 'code'
                      ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveTab('doc')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    mobileActiveTab === 'doc'
                      ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Documentation</span>
                </button>
              </div>
            </div>

            {/* Content Area - Mobile tabs or Desktop split view */}
            <div className="flex-1 min-h-0">
              {isMobileView ? (
                // Mobile: Show only active tab (full screen)
                mobileActiveTab === 'code' ? (
                  <CodePanel
                    code={code}
                    onChange={setCode}
                    filename={filename}
                    language={language}
                    onFileDrop={handleFileDrop}
                    onClear={handleClear}
                    onSamplesClick={() => setShowSamplesModal(true)}
                    samplesButtonRef={samplesButtonRef}
                  />
                ) : (
                  <Suspense fallback={<LoadingFallback />}>
                    <DocPanel
                      documentation={documentation}
                      qualityScore={qualityScore}
                      isGenerating={isGenerating || testSkeletonMode}
                      onViewBreakdown={handleViewBreakdown}
                      onUpload={handleUpload}
                      onGithubImport={handleGithubImport}
                      onGenerate={handleGenerate}
                      onReset={handleReset}
                      bulkGenerationProgress={bulkGenerationProgress}
                      bulkGenerationSummary={bulkGenerationSummary}
                      bulkGenerationErrors={bulkGenerationErrors}
                      currentlyGeneratingFile={currentlyGeneratingFile}
                      throttleCountdown={throttleCountdown}
                      onDismissBulkErrors={() => {
                        setBulkGenerationErrors([]);
                        setBulkGenerationSummary(null);
                      }}
                      onSummaryFileClick={handleSummaryFileClick}
                      onBackToSummary={handleBackToSummary}
                      onDownloadAllDocs={handleDownloadAllDocs}
                      batchSummaryMarkdown={batchSummaryMarkdown}
                      canUseBatchProcessing={canUseBatchProcessing}
                      onExportFile={handleExportFile}
                    />
                  </Suspense>
                )
              ) : (
                // Desktop: Split view (side by side)
                <SplitPanel
                  leftPanel={
                    <CodePanel
                      code={code}
                      onChange={setCode}
                      filename={filename}
                      language={language}
                      onFileDrop={handleFileDrop}
                      onClear={handleClear}
                      onSamplesClick={() => setShowSamplesModal(true)}
                      samplesButtonRef={samplesButtonRef}
                    />
                  }
                  rightPanel={
                    <Suspense fallback={<LoadingFallback />}>
                      <DocPanel
                        documentation={documentation}
                        qualityScore={qualityScore}
                        isGenerating={isGenerating || testSkeletonMode}
                        onViewBreakdown={handleViewBreakdown}
                        onUpload={handleUpload}
                        onGithubImport={handleGithubImport}
                        onGenerate={handleGenerate}
                        onReset={handleReset}
                        bulkGenerationProgress={bulkGenerationProgress}
                        bulkGenerationSummary={bulkGenerationSummary}
                        bulkGenerationErrors={bulkGenerationErrors}
                        currentlyGeneratingFile={currentlyGeneratingFile}
                        throttleCountdown={throttleCountdown}
                        onDismissBulkErrors={() => {
                          setBulkGenerationErrors([]);
                          setBulkGenerationSummary(null);
                        }}
                        onSummaryFileClick={handleSummaryFileClick}
                        onBackToSummary={handleBackToSummary}
                        onDownloadAllDocs={handleDownloadAllDocs}
                        batchSummaryMarkdown={batchSummaryMarkdown}
                        canUseBatchProcessing={canUseBatchProcessing}
                        onExportFile={handleExportFile}
                      />
                    </Suspense>
                  }
                />
              )}
            </div>
          </main>
        )}
      </div>

      {/* Quality Score Modal */}
      {showQualityModal && qualityScore && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <QualityScoreModal
            qualityScore={qualityScore}
            onClose={() => setShowQualityModal(false)}
            filename={filename}
          />
        </Suspense>
      )}

      {/* Samples Modal */}
      {showSamplesModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <SamplesModal
            isOpen={showSamplesModal}
            onClose={() => {
              setShowSamplesModal(false);
              // Return focus to Samples button after modal closes
              setTimeout(() => {
                samplesButtonRef.current?.focus();
              }, 0);
            }}
            onLoadSample={handleLoadSample}
            currentCode={code}
          />
        </Suspense>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
        </Suspense>
      )}

      {/* Confirmation Modal for Large Code Submissions */}
      {showConfirmationModal && largeCodeStats && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ConfirmationModal
            isOpen={showConfirmationModal}
            onClose={() => {
              setShowConfirmationModal(false);
              setLargeCodeStats(null);
            }}
            onConfirm={performGeneration}
            title="Large File Submission"
            variant="warning"
            confirmLabel="Generate Anyway"
            cancelLabel="Cancel"
            message={
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  You're about to generate documentation for a <strong className="font-semibold text-slate-900 dark:text-white">large code file</strong>. This may take longer and consume more API resources.
                </p>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                {/* Stats box with purple accent */}
                <div className="bg-white dark:bg-slate-800 border-l-4 border-purple-500 dark:border-purple-400 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Lines of code</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-300">{largeCodeStats.lines.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">lines</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">File size</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">{largeCodeStats.sizeInKB}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">KB</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Characters</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-300">{largeCodeStats.charCount.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">chars</span>
                    </div>
                  </div>
                </div>

                {/* Tip box */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">💡 Tip:</span> Breaking your code into smaller modules improves documentation quality and generation speed.
                  </p>
                </div>
              </div>
            }
          />
        </Suspense>
      )}

      {/* Confirmation Modal for Generating from Code Editor */}
      {showGenerateFromEditorModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ConfirmationModal
            isOpen={showGenerateFromEditorModal}
            onClose={() => setShowGenerateFromEditorModal(false)}
            onConfirm={() => {
              setShowGenerateFromEditorModal(false);
              // Set progress to show spinner on Generate Selected button
              setBulkGenerationProgress({
                total: 1,
                completed: 0,
                currentBatch: 1,
                totalBatches: 1
              });
              handleGenerate();
            }}
            title="No Files Selected"
            variant="info"
            confirmLabel="Generate from Editor"
            cancelLabel="Cancel"
            message={
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                No files are currently selected in your workspace. Would you like to generate documentation for the code in your editor instead?
              </p>
            }
          />
        </Suspense>
      )}

      {/* Usage Limit Modal (100% limit reached) */}
      {showUsageLimitModal && usage && (
        <UsageLimitModal
          isOpen={showUsageLimitModal}
          onClose={() => setShowUsageLimitModal(false)}
          usage={getUsageForPeriod('monthly')}
          currentTier={usage.tier}
          onUpgrade={handleUpgradeClick}
        />
      )}

      {/* Terms Acceptance Modal - Non-dismissible when terms need acceptance */}
      {showTermsModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TermsAcceptanceModal
            isOpen={showTermsModal}
            onAccept={handleAcceptLegalDocuments}
            missingAcceptance={legalStatus?.details}
            currentVersions={{
              terms: legalStatus?.details?.terms?.current_version,
              privacy: legalStatus?.details?.privacy?.current_version,
            }}
          />
        </Suspense>
      )}

      {/* Contact Support Modal */}
      {showSupportModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ContactSupportModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
            onShowLogin={() => {
              // Set sessionStorage flag so we reopen support modal after login
              // (persists across OAuth redirects which cause page reload)
              sessionStorage.setItem('pendingSupportModal', 'true');
              headerRef.current?.openLoginModal();
            }}
          />
        </Suspense>
      )}

      {/* GitHub Load Modal */}
      {showGithubModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <GitHubLoadModal
            isOpen={showGithubModal}
            onClose={() => setShowGithubModal(false)}
            onFileLoad={handleGithubFileLoad}
            onFilesLoad={multiFileState.reloadWorkspace}
            defaultDocType={docType}
          />
        </Suspense>
      )}

      {/* Unsupported File Type Modal */}
      {unsupportedFileModal.isOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <UnsupportedFileModal
            isOpen={unsupportedFileModal.isOpen}
            onClose={() => setUnsupportedFileModal({ isOpen: false, fileName: '', fileExtension: '' })}
            fileName={unsupportedFileModal.fileName}
            fileExtension={unsupportedFileModal.fileExtension}
          />
        </Suspense>
      )}

      {/* Footer */}
      <Footer onSupportClick={() => setShowSupportModal(true)} />
    </div>
  );
}

export default App;