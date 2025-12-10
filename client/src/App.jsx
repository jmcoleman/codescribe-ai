import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import JSZip from 'jszip';
import { useTheme } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { Sidebar } from './components/Sidebar';
import { TierOverrideBanner } from './components/TierOverrideBanner';
import { TrialBanner } from './components/trial/TrialBanner';
import { CodePanel } from './components/CodePanel';
import { SplitPanel } from './components/SplitPanel';
import Footer from './components/Footer';
import { useDocGeneration } from './hooks/useDocGeneration';
import { useUsageTracking } from './hooks/useUsageTracking';
import { useWorkspace } from './contexts/WorkspaceContext';
import { useDocumentPersistence } from './hooks/useDocumentPersistence';
import { useTierOverride } from './hooks/useTierOverride';
import { useBatchGeneration } from './hooks/useBatchGeneration';
import UnverifiedEmailBanner from './components/UnverifiedEmailBanner';
import { PriorityBannerSection } from './components/PriorityBannerSection';
import { MobileTabBar } from './components/MobileTabBar';
import { AppModals } from './components/AppModals';
import { validateFile, getValidationErrorMessage, detectLanguageFromFilename } from './utils/fileValidation';
import { trackCodeInput, trackFileUpload, trackExampleUsage, trackInteraction } from './utils/analytics';
import { toastCompact, toastError } from './utils/toastWithHistory';
import { toastDocGenerated } from './utils/toast';
import { createTestDataLoader, exposeTestDataLoader, createSkeletonTestHelper, exposeSkeletonTestHelper } from './utils/testData';
import { exposeUsageSimulator } from './utils/usageTestData';
import { useAuth } from './contexts/AuthContext';
import { useTrial } from './contexts/TrialContext';
import { usePreferences } from './contexts/PreferencesContext';
import { hasFeature } from './utils/tierFeatures';
import { DEFAULT_CODE, EXAMPLE_CODES } from './constants/defaultCode';
import * as batchesApi from './services/batchesApi';
import { fetchFile as fetchGitHubFile } from './services/githubService';

// Lazy load heavy components that aren't needed on initial render
const DocPanel = lazy(() => import('./components/DocPanel').then(m => ({ default: m.DocPanel })));

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

import { useSearchParams } from 'react-router-dom';
import { API_URL } from './config/api.js';
import { STORAGE_KEYS, getStorageItem, setStorageItem, removeStorageItem, getEditorKey, getSessionItem, setSessionItem, removeSessionItem } from './constants/storage';

// Default sidebar panel sizes (percentage)
const DEFAULT_SIDEBAR_SIZE = 20;
const DEFAULT_MAIN_SIZE = 80;

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getToken, user, isAuthenticated, isLoading: authLoading, checkLegalStatus, acceptLegalDocuments } = useAuth();
  const { effectiveTheme } = useTheme();
  const { isOnTrial, trialEndsAt } = useTrial();
  const {
    layoutMode: prefsLayoutMode,
    sidebarCollapsed: prefsSidebarCollapsed,
    sidebarWidth: prefsSidebarWidth,
    selectedProjectId: prefsSelectedProjectId,
    setLayoutMode: setPrefsLayoutMode,
    setSidebarCollapsed: setPrefsSidebarCollapsed,
    setSidebarWidth: setPrefsSidebarWidth,
    setSelectedProjectId: setPrefsSelectedProjectId
  } = usePreferences();

  // Load persisted state from localStorage on mount, fallback to defaults
  const [code, setCode] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_CODE, DEFAULT_CODE));
  const [docType, setDocType] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_DOC_TYPE, 'README'));
  const [filename, setFilename] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_FILENAME, 'code.js'));
  // Track where the code came from (valid: 'upload', 'github', 'paste', 'sample')
  const [codeOrigin, setCodeOrigin] = useState('sample'); // Default code is a sample
  // Source metadata for reloadable origins (github, gitlab, bitbucket, etc.)
  // Structure: { source: 'github'|'gitlab'|etc, repo: string, path: string, sha?: string, branch?: string }
  const [sourceMetadata, setSourceMetadata] = useState(null);
  // Language is derived from filename, not stored separately
  const language = detectLanguageFromFilename(filename);

  // Layout mode state - sync with PreferencesContext
  const [layout, setLayout] = useState(() => {
    // Use localStorage for fast initial render, PreferencesContext will sync after load
    const stored = getStorageItem(STORAGE_KEYS.LAYOUT_MODE);
    return stored && ['split', 'code', 'doc'].includes(stored) ? stored : 'split';
  });

  // Sync layout with PreferencesContext when it loads from API
  useEffect(() => {
    if (prefsLayoutMode && prefsLayoutMode !== layout) {
      setLayout(prefsLayoutMode);
      setStorageItem(STORAGE_KEYS.LAYOUT_MODE, prefsLayoutMode);
    }
  }, [prefsLayoutMode]);

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
  const [showReloadFromSourceModal, setShowReloadFromSourceModal] = useState(false);
  const [filesToReloadFromSource, setFilesToReloadFromSource] = useState([]);
  const [reloadFromSourceProgress, setReloadFromSourceProgress] = useState(null); // { total, completed, successIds: [] }
  const [unsupportedFileModal, setUnsupportedFileModal] = useState({ isOpen: false, fileName: '', fileExtension: '' });
  const [legalStatus, setLegalStatus] = useState(null);
  const [largeCodeStats, setLargeCodeStats] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [testSkeletonMode, setTestSkeletonMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth < 1024);
  const [mobileActiveTab, setMobileActiveTab] = useState('code'); // 'code' or 'doc' (mobile only, not persisted)
  // Sidebar collapsed state - sync with PreferencesContext
  const [sidebarCollapsed, setSidebarCollapsedLocal] = useState(() => {
    // Load sidebar collapsed state from localStorage for fast initial render
    const saved = getStorageItem(STORAGE_KEYS.SIDEBAR_MODE);
    return saved === 'collapsed';
  });

  // Sync sidebarCollapsed with PreferencesContext when it loads from API
  useEffect(() => {
    if (prefsSidebarCollapsed !== undefined && prefsSidebarCollapsed !== sidebarCollapsed) {
      setSidebarCollapsedLocal(prefsSidebarCollapsed);
      setStorageItem(STORAGE_KEYS.SIDEBAR_MODE, prefsSidebarCollapsed ? 'collapsed' : 'expanded');
    }
  }, [prefsSidebarCollapsed]);

  // Expanded sidebar width state - sync with PreferencesContext
  const [expandedSidebarWidth, setExpandedSidebarWidthLocal] = useState(() => {
    // Load user's preferred expanded width from localStorage for fast initial render
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

  // Sync sidebarWidth with PreferencesContext when it loads from API
  useEffect(() => {
    if (prefsSidebarWidth && prefsSidebarWidth !== expandedSidebarWidth) {
      setExpandedSidebarWidthLocal(prefsSidebarWidth);
      setStorageItem(STORAGE_KEYS.SIDEBAR_WIDTH, JSON.stringify({
        sidebar: prefsSidebarWidth,
        main: 100 - prefsSidebarWidth
      }));
    }
  }, [prefsSidebarWidth]);
  const fileInputRef = useRef(null); // For single-file uploads (Command Bar)
  const multiFileInputRef = useRef(null); // For multi-file uploads (Sidebar)
  const samplesButtonRef = useRef(null);
  const headerRef = useRef(null);
  const sidebarPanelRef = useRef(null); // For programmatically controlling sidebar panel size
  const prevFilesLengthRef = useRef(0); // Track previous files count to detect "all files deleted"
  const hasUserInteractedWithWorkspaceRef = useRef(false); // Track if user has selected/deselected files

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
    setSidebarCollapsedLocal(prev => {
      const newValue = !prev;
      // Persist to localStorage
      setStorageItem(STORAGE_KEYS.SIDEBAR_MODE, newValue ? 'collapsed' : 'expanded');
      // Sync to PreferencesContext (which syncs to API)
      setPrefsSidebarCollapsed(newValue);

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
  }, [expandedSidebarWidth, setPrefsSidebarCollapsed]);

  // Handle layout mode change (Pro+ feature)
  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);
    // Persist to localStorage
    setStorageItem(STORAGE_KEYS.LAYOUT_MODE, newLayout);
    // Sync to PreferencesContext (which syncs to API)
    setPrefsLayoutMode(newLayout);
  }, [setPrefsLayoutMode]);

  // Handle sidebar resize (when user drags the handle)
  const handleSidebarResize = useCallback((sizes) => {
    if (!sidebarCollapsed && sizes && sizes.length >= 2) {
      const sidebarSize = sizes[0];
      // Save the expanded width when user resizes (not when collapsed)
      if (sidebarSize > 10) { // Only save if it's a meaningful size (not collapsed)
        setExpandedSidebarWidthLocal(sidebarSize);
        saveSidebarSizes(sidebarSize, sizes[1]);
        // Sync to PreferencesContext (which syncs to API)
        setPrefsSidebarWidth(Math.round(sidebarSize));
      }
    }
  }, [sidebarCollapsed, saveSidebarSizes, setPrefsSidebarWidth]);

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

  // Trial code from URL (for signup flow from trial redemption page)
  const [pendingTrialCode, setPendingTrialCode] = useState(null);

  // Handle URL params for opening auth modals (e.g., from trial redemption flow)
  useEffect(() => {
    const signupParam = searchParams.get('signup');
    const trialCode = searchParams.get('trial_code');

    if (signupParam === 'true' && !isAuthenticated && !authLoading) {
      // Store trial code if present
      if (trialCode) {
        setPendingTrialCode(trialCode);
      }
      // Open signup modal and clear the URL params
      headerRef.current?.openSignupModal();
      // Remove params from URL to prevent re-triggering
      searchParams.delete('signup');
      searchParams.delete('trial_code');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isAuthenticated, authLoading]);

  // Usage tracking
  const { usage, refetch: refetchUsage, checkThreshold, canGenerate, getUsageForPeriod } = useUsageTracking();
  const [mockUsage, setMockUsage] = useState(null);

  // Multi-file state (Phase 3: Multi-file integration)
  // selectedProjectId and setSelectedProjectId now come from PreferencesContext (syncs to DB)
  const multiFileState = useWorkspace();
  // Alias preferences for easier use (and consistency with old API)
  const selectedProjectId = prefsSelectedProjectId;
  const setSelectedProjectId = setPrefsSelectedProjectId;
  // Track selected project name for graph analysis (not persisted, derived from selection)
  const [selectedProjectName, setSelectedProjectName] = useState(null);

  // Handler for project selection that captures both id and name
  const handleProjectChange = useCallback((projectId, projectName = null) => {
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
  }, [setSelectedProjectId]);

  // Fetch project name when we have an ID but no name (e.g., after page refresh)
  // This ensures graph analysis has the correct project name
  useEffect(() => {
    const fetchProjectName = async () => {
      if (selectedProjectId && !selectedProjectName && isAuthenticated) {
        try {
          const { getProject } = await import('./services/projectsApi');
          const result = await getProject(selectedProjectId);
          // API returns { success, project: { id, name, ... } }
          if (result?.project?.name) {
            setSelectedProjectName(result.project.name);
          }
        } catch (err) {
          console.warn('[App] Could not fetch project name:', err.message);
        }
      }
    };
    fetchProjectName();
  }, [selectedProjectId, selectedProjectName, isAuthenticated]);

  // Check for project info stored by History page when loading batch into workspace
  // This runs once on mount to set the project selector to match the loaded batch
  useEffect(() => {
    const historyProjectId = sessionStorage.getItem('history_load_project_id');
    const historyProjectName = sessionStorage.getItem('history_load_project_name');

    if (historyProjectId) {
      const projectId = parseInt(historyProjectId, 10);
      if (!isNaN(projectId)) {
        setSelectedProjectId(projectId);
        setSelectedProjectName(historyProjectName || null);
      }
      // Clear after reading to prevent re-applying on refresh
      sessionStorage.removeItem('history_load_project_id');
      sessionStorage.removeItem('history_load_project_name');
    }
  }, [setSelectedProjectId]);

  const documentPersistence = useDocumentPersistence();
  const { override, clearOverride } = useTierOverride();

  // Feature detection: Check if user can use batch processing (Pro+ tier)
  // This single flag controls: multi-file sidebar, GitHub multi-select, batch summary, summary button
  const canUseBatchProcessing = hasFeature(user, 'batchProcessing');

  // Feature detection: Check if user can use project management (Pro+ tier)
  const canUseProjectManagement = hasFeature(user, 'projectManagement');

  // Note: Batch state clearing for tier downgrade is handled after useBatchGeneration hook

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

  // Note: Batch data persistence is handled after useBatchGeneration hook initialization

  // Load user-scoped editor content when user logs in
  // Track if we've seen a logged-in user to differentiate logout from initial load
  const hasSeenUserRef = useRef(false);
  useEffect(() => {
    if (user && user.id) {
      hasSeenUserRef.current = true;
      // Load user's code from user-scoped key
      const codeKey = getEditorKey(user.id, 'code');
      if (codeKey) {
        const savedCode = getStorageItem(codeKey);
        if (savedCode) {
          setCode(savedCode);
        }
      }
    } else if (hasSeenUserRef.current) {
      // User logged out (not initial page load) - clear all UI state
      // Batch state clearing is handled separately after useBatchGeneration hook
      setCode(DEFAULT_CODE);
      setCodeOrigin('sample'); // Default code is a sample
      setFilename('code.js');
      setDocType('README');
      // Clear documentation panel
      setDocumentation('');
      setQualityScore(null);
      // Reset "doc panel cleared" flag so next login will load from DB
      localStorage.removeItem(STORAGE_KEYS.DOC_PANEL_CLEARED);
      hasSeenUserRef.current = false;
    }
    // Note: If user is null/undefined on initial load, we do nothing - preserving localStorage state
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
    const isAnyModalOpen = showQualityModal || showSamplesModal || showHelpModal || showConfirmationModal || showUsageLimitModal || showTermsModal || showSupportModal || showGithubModal || showRegenerateConfirmModal || showGenerateFromEditorModal || showReloadFromSourceModal || unsupportedFileModal.isOpen;

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
  }, [showQualityModal, showSamplesModal, showHelpModal, showConfirmationModal, showUsageLimitModal, showTermsModal, showSupportModal, showGithubModal, showRegenerateConfirmModal, showGenerateFromEditorModal, showReloadFromSourceModal, unsupportedFileModal.isOpen]);
  
  const {
    generate,
    cancel: cancelGeneration,
    reset,
    clearError,
    isGenerating,
    setIsGenerating,
    documentation,
    setDocumentation,
    qualityScore,
    setQualityScore,
    error,
    retryAfter,
    retryStatus,
    setRetryStatus
  } = useDocGeneration(refetchUsage);

  // DEV ONLY: State for testing retry UI
  const [testRetryMode, setTestRetryMode] = useState(false);

  // Batch generation hook - manages bulk doc generation state and logic
  const {
    bulkGenerationProgress,
    currentlyGeneratingFile,
    throttleCountdown,
    isCancelling,
    isBatchModeRef,
    bulkGenerationSummary,
    batchSummaryMarkdown,
    bulkGenerationErrors,
    currentBatchId,
    bannerDismissed,
    showRegenerateModal,
    regenerateModalData,
    isAnalyzingGraph,
    setBulkGenerationSummary,
    setBatchSummaryMarkdown,
    setCurrentBatchId,
    setBulkGenerationErrors,
    handleGenerateSelected,
    handleGenerateSingleFile,
    handleDocumentClick,
    handleBackToSummary,
    clearBatchState,
    restoreBatchState,
    dismissBanner,
    handleRegenerateAll,
    handleGenerateNewOnly,
    handleCancelRegenerate,
    cancelBatchGeneration
  } = useBatchGeneration({
    generate,
    cancelGeneration,
    setDocumentation,
    setQualityScore,
    setDocType,
    setFilename,
    multiFileState,
    documentPersistence,
    isAuthenticated,
    canGenerate,
    setShowUsageLimitModal,
    refetchUsage,
    userTier: user?.effectiveTier || user?.tier || 'free',
    trialInfo: isOnTrial ? { isOnTrial, trialEndsAt } : null,
    projectId: canUseProjectManagement ? selectedProjectId : null,
    projectName: canUseProjectManagement ? selectedProjectName : null,
    user
  });

  // Clear batch-related state when user loses batch processing access (tier downgrade/expiry)
  // Skip during initial auth loading to avoid clearing state before we know user's tier
  useEffect(() => {
    if (authLoading) return; // Don't run until auth has finished loading

    if (!canUseBatchProcessing) {
      // Clear batch generation state using hook's clearBatchState
      clearBatchState();

      // Reset layout to split view (default)
      setLayout('split');
      setStorageItem(STORAGE_KEYS.LAYOUT_MODE, 'split');

      // Clear from sessionStorage
      removeSessionItem('bulk_generation_summary');
      removeSessionItem('batch_summary_markdown');
    }
  }, [authLoading, canUseBatchProcessing, clearBatchState]);

  // Note: Bulk generation progress clearing is handled internally by useBatchGeneration

  // Load batch data from sessionStorage or database if user has batch processing access
  // NOTE: This should NOT run after logout - batch data is ephemeral for the session
  useEffect(() => {
    if (!canUseBatchProcessing || !isAuthenticated) return;

    const loadBatchData = async () => {
      try {
        // First try sessionStorage (faster, for current session)
        const saved = getSessionItem('bulk_generation_summary');
        const markdown = getSessionItem('batch_summary_markdown');

        if (saved || markdown) {
          const parsedSummary = saved ? JSON.parse(saved) : null;
          restoreBatchState({
            bulkGenerationSummary: parsedSummary,
            batchSummaryMarkdown: markdown || null
          });

          // Also restore the documentation display if we have a batch summary
          // and no active file is selected
          if (markdown && !multiFileState.activeFileId) {
            setDocumentation(markdown);
            // Restore the quality score from summary if available
            if (parsedSummary) {
              setQualityScore({
                score: parsedSummary.avgQuality || 0,
                grade: parsedSummary.avgGrade || 'N/A',
                breakdown: null,
                isBatchSummary: true,
                generatedAt: parsedSummary.generatedAt || null
              });
            }
          }
          return; // Found in sessionStorage, no need to fetch from DB
        }

        // DON'T load from database on login - batch summaries are ephemeral
        // Only load from sessionStorage (same session) not from DB (previous sessions)
        // The batch summary should only persist within the same browser session
      } catch (error) {
        console.error('[App] Error loading batch data:', error);
      }
    };

    loadBatchData();
  }, [canUseBatchProcessing, isAuthenticated, restoreBatchState, multiFileState.activeFileId, setDocumentation, setQualityScore]);

  // Persist batch data to sessionStorage (sync both writes AND clears)
  // When batch state is cleared via flushSync at start of new generation,
  // we must also clear sessionStorage to prevent stale data from being restored
  useEffect(() => {
    if (canUseBatchProcessing) {
      if (bulkGenerationSummary) {
        setSessionItem('bulk_generation_summary', JSON.stringify(bulkGenerationSummary));
      } else {
        removeSessionItem('bulk_generation_summary');
      }
      if (batchSummaryMarkdown) {
        setSessionItem('batch_summary_markdown', batchSummaryMarkdown);
      } else {
        removeSessionItem('batch_summary_markdown');
      }
      if (currentBatchId) {
        setSessionItem('current_batch_id', currentBatchId);
      } else {
        removeSessionItem('current_batch_id');
      }
    }
  }, [canUseBatchProcessing, bulkGenerationSummary, batchSummaryMarkdown, currentBatchId]);

  // Clear batch state on logout (batch data is in sessionStorage)
  // NOTE: Documentation clearing is handled in a separate effect below
  const prevUserIdRef = useRef(user?.id);
  useEffect(() => {
    const wasLoggedIn = prevUserIdRef.current !== undefined && prevUserIdRef.current !== null;
    const isLoggedOut = !user?.id;

    // Only clear on actual logout (was logged in, now logged out)
    // This prevents clearing on initial page load
    if (wasLoggedIn && isLoggedOut) {
      clearBatchState();
    }

    prevUserIdRef.current = user?.id;
  }, [user?.id, clearBatchState]);

  // Load most recent document from database for free tier users (who don't have workspace/multi-file)
  // Pro+ users get their docs loaded via useWorkspacePersistence → multiFileState
  // Free tier users need this separate effect since they don't have workspace access
  useEffect(() => {
    // Only run for authenticated users WITHOUT multi-file access (free tier)
    // Pro+ users get their workspace loaded via useWorkspacePersistence
    if (!isAuthenticated || !user?.id || authLoading || canUseBatchProcessing) return;

    // Skip if user intentionally cleared the doc panel (prevents reload after clear → refresh)
    // Uses localStorage so it survives browser refresh; cleared on logout or new generation
    const docPanelCleared = getStorageItem(STORAGE_KEYS.DOC_PANEL_CLEARED);
    if (docPanelCleared === 'true') {
      return;
    }

    // Skip if there's already documentation showing
    if (documentation) return;

    // Skip if there are files in the workspace (e.g., loaded from History)
    if (multiFileState.files.length > 0) return;

    // Skip if in batch mode
    if (isBatchModeRef.current || bulkGenerationProgress) return;

    const loadMostRecentDoc = async () => {
      try {
        const result = await documentPersistence.loadDocuments({ limit: 1 });

        if (result.documents && result.documents.length > 0) {
          const doc = result.documents[0];
          console.log('[App] Loaded most recent document from DB for free tier user:', doc.filename);

          // Set the documentation panel state
          setDocumentation(doc.documentation);

          // Set quality score with full structure
          if (doc.quality_score) {
            setQualityScore({
              score: doc.quality_score.score || doc.quality_score,
              grade: doc.quality_score.grade || null,
              breakdown: doc.quality_score.breakdown || null
            });
          }

          // Set filename and docType to match the loaded doc
          if (doc.filename) setFilename(doc.filename);
          if (doc.doc_type) setDocType(doc.doc_type);
        }
      } catch (error) {
        console.error('[App] Error loading most recent document:', error);
        // Don't block the app - just log the error
      }
    };

    loadMostRecentDoc();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, authLoading, canUseBatchProcessing]); // Intentionally minimal deps - only run on auth changes

  // Sync active file to CodePanel and DocPanel when selection changes
  // Sync active file to code and doc panels when user clicks a file in sidebar
  useEffect(() => {
    // Skip all syncing during batch generation - the batch hook manages state directly
    // Check both the ref (synchronous) and state (async) to handle React batching race conditions
    // The ref is set synchronously at the START of batch generation, before any state updates
    if (isBatchModeRef.current || bulkGenerationProgress) {
      return;
    }

    const activeFile = multiFileState.files.find(f => f.id === multiFileState.activeFileId);
    if (activeFile) {
      // Skip syncing if file is actively generating (SSE streaming in progress)
      if (activeFile.isGenerating) {
        return; // Don't interfere with streaming
      }

      // Sync code to CodePanel
      if (activeFile.content) {
        setCode(activeFile.content);
        setCodeOrigin(activeFile.origin || 'paste'); // Use file's origin
        // Sync source metadata for reload functionality (github, gitlab, etc.)
        if (activeFile.origin === 'github' && activeFile.github) {
          setSourceMetadata({
            source: 'github',
            repo: activeFile.github.repo,
            path: activeFile.github.path,
            sha: activeFile.github.sha,
            branch: activeFile.github.branch
          });
        } else {
          setSourceMetadata(null);
        }
        setFilename(activeFile.filename);
        // Language will be derived from filename automatically
      }

      // Sync documentation to DocPanel (overrides batch summary)
      if (activeFile.documentation) {
        setDocumentation(activeFile.documentation);
        setQualityScore(activeFile.qualityScore || null);
        // Also sync docType and filename for the panel title
        if (activeFile.docType) {
          setDocType(activeFile.docType);
        }
        // Set filename even if no content (e.g., files loaded from history)
        if (activeFile.filename) {
          setFilename(activeFile.filename);
        }
      } else {
        // Clear DocPanel if file has no documentation
        setDocumentation('');
        setQualityScore(null);
      }

      // If file belongs to a batch and we don't have the batch summary loaded (or it's a different batch), fetch it
      // But don't fetch if a batch generation is currently in progress (we're creating a new batch)
      const needsBatchLoad = activeFile.batchId && (!batchSummaryMarkdown || activeFile.batchId !== currentBatchId) && !bulkGenerationProgress && canUseBatchProcessing;
      if (needsBatchLoad) {
        const loadBatchForFile = async () => {
          try {
            console.log('[App] Loading batch for file:', activeFile.batchId);
            const batchData = await batchesApi.getBatch(activeFile.batchId);

            if (batchData && batchData.summary_markdown) {
              const summaryData = {
                totalFiles: batchData.total_files,
                successCount: batchData.success_count,
                failCount: batchData.fail_count,
                avgQuality: batchData.avg_quality_score,
                avgGrade: batchData.avg_grade,
                generatedAt: batchData.created_at
              };

              restoreBatchState({
                bulkGenerationSummary: summaryData,
                batchSummaryMarkdown: batchData.summary_markdown,
                currentBatchId: activeFile.batchId
              });
              // Also set qualityScore with the batch's generatedAt for display in DocPanel header
              setQualityScore({
                score: batchData.avg_quality_score || 0,
                grade: batchData.avg_grade || 'N/A',
                breakdown: null,
                isBatchSummary: true,
                generatedAt: batchData.created_at
              });
            }
          } catch (error) {
            console.error('[App] Failed to load batch for file:', error);
          }
        };
        loadBatchForFile();
      }
    } else if (multiFileState.activeFileId === null) {
      // No active file - determine what to show based on context
      const hadFilesBeforeNowEmpty = prevFilesLengthRef.current > 0 && multiFileState.files.length === 0;

      // UNLESS we're showing a batch summary or batch generation is in progress
      // Check ref for synchronous batch mode check (handles React batching race conditions)
      if (!batchSummaryMarkdown && !bulkGenerationProgress && !isBatchModeRef.current) {
        // Only clear documentation if user has explicitly interacted with the workspace
        // This prevents clearing on initial load when workspace loads from DB but no file is selected yet
        if (hadFilesBeforeNowEmpty && hasUserInteractedWithWorkspaceRef.current) {
          // User deleted all files (transition from files > 0 to files === 0)
          // Reset to default code
          setCode(DEFAULT_CODE);
          setCodeOrigin('sample');
          setFilename('code.js');
          setDocumentation('');
          setQualityScore(null);
        }
        // Note: When files exist but none are selected (hasFilesButNoneActive),
        // we no longer clear - keep showing whatever was there before.
        // The user can click a file to see its documentation.
      }
    }

    // Track that files have loaded (for detecting "all deleted" vs "initial empty")
    if (multiFileState.files.length > 0) {
      prevFilesLengthRef.current = multiFileState.files.length;
    } else if (prevFilesLengthRef.current > 0) {
      // Transition from files to no files - update ref
      prevFilesLengthRef.current = 0;
    }

    // Note: Only depend on activeFileId and files changes, not on documentation
    // to avoid re-triggering during SSE streaming
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiFileState.activeFileId, multiFileState.files, batchSummaryMarkdown, bulkGenerationProgress, canUseBatchProcessing, restoreBatchState, currentBatchId]);

  // NOTE: Documentation clearing on logout is now handled in the main user ID effect above
  // (where hasSeenUserRef.current is checked before being set to false)
  // This effect is kept as a safety net but won't typically trigger since
  // hasSeenUserRef.current is set to false before this effect runs

  // Restore documentation from sessionStorage for UNAUTHENTICATED users on initial mount
  // Uses sessionStorage (not localStorage) for privacy - clears when tab/browser closes
  // This allows refresh protection without leaving persistent data on shared computers
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Only restore for unauthenticated users
    if (user?.id) return;

    // Skip if there's already documentation (e.g., just generated)
    if (documentation) return;

    // Restore documentation from sessionStorage
    const savedDoc = getSessionItem(STORAGE_KEYS.EDITOR_DOCUMENTATION);
    if (savedDoc) {
      setDocumentation(savedDoc);
    }

    // Restore quality score from sessionStorage
    const savedScore = getSessionItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE);
    if (savedScore) {
      try {
        const parsedScore = JSON.parse(savedScore);
        setQualityScore(parsedScore);
      } catch (e) {
        console.warn('[App] Failed to parse saved quality score:', e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]); // Only run when auth state changes, not when documentation changes

  // Persist documentation to sessionStorage for UNAUTHENTICATED users only
  // Uses sessionStorage for privacy - survives refresh but clears on tab/browser close
  // Authenticated users' docs are persisted to the database, not storage
  useEffect(() => {
    // Only persist for unauthenticated users
    if (!user?.id && documentation) {
      setSessionItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, documentation);
    }
  }, [documentation, user?.id]);

  // Persist quality score to sessionStorage for UNAUTHENTICATED users only
  useEffect(() => {
    // Only persist for unauthenticated users
    if (!user?.id && qualityScore) {
      setSessionItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, JSON.stringify(qualityScore));
    }
  }, [qualityScore, user?.id]);

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
    // Reset "doc panel cleared" flag since user is generating new content
    removeStorageItem(STORAGE_KEYS.DOC_PANEL_CLEARED);
    try {
      // Check if code matches the default code or any example (for prompt caching optimization)
      // When cache hits, users benefit from 90% cost reduction!
      const isDefaultCode = code === DEFAULT_CODE;
      const isExampleCode = EXAMPLE_CODES.has(code);
      const shouldCache = isDefaultCode || isExampleCode;

      // Get file path for graph context (from sourceMetadata if available)
      const filePath = sourceMetadata?.source === 'github' ? sourceMetadata.path : null;

      const result = await generate(code, docType, language, shouldCache, filename, {
        projectId: selectedProjectId, // For graph context lookup (FK to projects table)
        filePath, // For identifying file in the project graph
        testRetry: testRetryMode // DEV ONLY: Simulate retry for testing UI
      });

      // Reset test retry mode after generation
      if (testRetryMode) setTestRetryMode(false);

      // Save document to database for authenticated users
      if (isAuthenticated && result) {
        try {
          const fileSize = new Blob([code]).size;
          // Extract github-specific metadata if source is github (extensible for gitlab, etc.)
          const githubData = sourceMetadata?.source === 'github' ? {
            repo: sourceMetadata.repo,
            path: sourceMetadata.path,
            sha: sourceMetadata.sha,
            branch: sourceMetadata.branch
          } : null;

          const saveResult = await documentPersistence.saveDocument({
            filename: filename,
            language: language,
            fileSize: fileSize,
            documentation: result.documentation,
            qualityScore: result.qualityScore,
            docType: docType,
            origin: codeOrigin, // Tracked from where code was loaded (upload, github, paste, sample)
            github: githubData, // GitHub metadata for reload functionality
            provider: result.metadata?.provider || 'claude',
            model: result.metadata?.model || 'claude-sonnet-4-5-20250929',
            llm: result.metadata || null
          });
          console.log('[App] Single-file generation saved to database:', saveResult?.documentId);

          // Create a batch record for History page (batch_type = 'single')
          if (saveResult?.documentId) {
            try {
              const score = result.qualityScore?.score || 0;
              const grade = result.qualityScore?.grade || (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F');

              const batchResult = await batchesApi.createBatch({
                batchType: 'single',
                totalFiles: 1,
                successCount: 1,
                failCount: 0,
                avgQualityScore: score,
                avgGrade: grade,
                docTypes: [docType],
                projectId: canUseProjectManagement ? selectedProjectId : null,
                projectName: canUseProjectManagement ? selectedProjectName : null
              });
              console.log('[App] Created single-file batch:', batchResult.batchId);

              // Link document to batch
              await batchesApi.linkDocumentsToBatch(batchResult.batchId, [saveResult.documentId]);
              console.log('[App] Linked document to batch');

              // Add file to workspace so it persists across navigation
              // Clear existing files first to avoid duplicates
              multiFileState.clearFiles();
              multiFileState.addFile({
                id: saveResult.documentId,
                filename: filename,
                language: language,
                content: code,
                documentation: result.documentation,
                qualityScore: result.qualityScore,
                docType: docType,
                origin: codeOrigin,
                github: githubData, // GitHub metadata for reload functionality
                documentId: saveResult.documentId,
                batchId: batchResult.batchId,
                generatedAt: new Date()
              });
              console.log('[App] Added file to workspace for persistence');
            } catch (batchError) {
              console.error('[App] Failed to create batch for single-file generation:', batchError);
              // Don't throw - document saved, just batch creation failed
            }
          }
        } catch (saveError) {
          console.error('[App] Failed to save single-file generation to database:', saveError);
          // Don't throw - generation succeeded, just saving failed
        }
      }
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

    // Get file path for graph context (GitHub files have github.path)
    const filePath = file.github?.path || null;

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: file.content,
        docType: file.docType, // Use file's docType (multi-file mode)
        language: file.language,
        isDefaultCode: false,
        filename: file.filename, // Pass filename for title formatting
        projectId: selectedProjectId, // For graph context lookup (FK to projects table)
        filePath // For identifying file in the project graph
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Generation failed with status ${response.status}`);
    }

    return response.json();
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
   * Uses server-side batch export when authenticated and batchId is available (includes MANIFEST.json, README.md)
   * Falls back to client-side JSZip when not authenticated or no batchId
   */
  const handleDownloadAllDocs = async () => {
    try {
      // Get all files with documentation
      const filesWithDocs = multiFileState.files.filter(f => f.documentation);

      if (filesWithDocs.length === 0) {
        toastCompact('No documentation available to download', 'error');
        return;
      }

      // Try server-side batch export if authenticated and we have a batch ID
      // This provides richer exports with MANIFEST.json, README.md, and proper file organization
      if (isAuthenticated && currentBatchId) {
        try {
          console.log(`[App] Exporting batch ${currentBatchId} via server API`);
          const { blob, filename } = await batchesApi.exportBatchZip(currentBatchId);
          batchesApi.downloadBlob(blob, filename);

          toastCompact(
            `Downloaded ${filesWithDocs.length} documentation file${filesWithDocs.length > 1 ? 's' : ''} (with manifest)`,
            'success'
          );
          return;
        } catch (serverError) {
          console.warn('[App] Server-side batch export failed, falling back to client-side:', serverError);
          // Fall through to client-side export
        }
      }

      // Client-side export fallback (unauthenticated users or no batch data)
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
        setCodeOrigin('upload'); // File was uploaded
        setSourceMetadata(null); // Clear any previous source metadata (upload is not reloadable)
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
    setCodeOrigin('github'); // Code is from GitHub

    // Store source metadata for reload functionality (extensible for gitlab, bitbucket, etc.)
    if (metadata?.owner && metadata?.repo && metadata?.path) {
      setSourceMetadata({
        source: 'github',
        repo: `${metadata.owner}/${metadata.repo}`,
        path: metadata.path,
        sha: metadata.sha || null,
        branch: metadata.branch || null
      });
    } else {
      setSourceMetadata(null);
    }

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

    // Clear any previous documentation
    reset();
    // For unauthenticated users, clear sessionStorage too
    if (!user?.id) {
      setSessionItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, '');
      setSessionItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, '');
    }
    // For authenticated users, docs are in DB - no sessionStorage to clear
  };

  /**
   * Handle reloading multiple files from their source (GitHub, etc.)
   * Used when generating files loaded from history that have no code content
   */
  const handleReloadFilesFromSource = async () => {
    if (!filesToReloadFromSource || filesToReloadFromSource.length === 0) {
      setShowReloadFromSourceModal(false);
      return;
    }

    const total = filesToReloadFromSource.length;
    const successIds = [];

    // Initialize progress
    setReloadFromSourceProgress({ total, completed: 0, successIds: [] });

    for (let i = 0; i < filesToReloadFromSource.length; i++) {
      const file = filesToReloadFromSource[i];

      if (!file.github?.repo || !file.github?.path) {
        setReloadFromSourceProgress(prev => ({ ...prev, completed: i + 1 }));
        continue;
      }

      const { repo, path, branch } = file.github;
      const [owner, repoName] = repo.split('/');

      if (!owner || !repoName || !path) {
        setReloadFromSourceProgress(prev => ({ ...prev, completed: i + 1 }));
        continue;
      }

      try {
        const fetchedFile = await fetchGitHubFile(owner, repoName, path, branch || null);

        if (fetchedFile?.content) {
          multiFileState.updateFile(file.id, {
            content: fetchedFile.content,
            fileSize: fetchedFile.content.length,
            dateModified: new Date().toISOString()
          });
          successIds.push(file.id);
        }
      } catch (error) {
        console.error(`[App] Failed to reload ${file.filename} from GitHub:`, error);
      }

      // Update progress
      setReloadFromSourceProgress({ total, completed: i + 1, successIds: [...successIds] });
    }
  };

  const handleGenerateAfterReload = () => {
    const successIds = reloadFromSourceProgress?.successIds || [];

    // Close modal and clear state
    setShowReloadFromSourceModal(false);
    setFilesToReloadFromSource([]);
    setReloadFromSourceProgress(null);

    if (successIds.length > 0) {
      // Clear any existing batch summary from previously loaded history
      clearBatchState();
      // Files are already selected - just trigger generation
      // The files now have content loaded, so handleGenerateSelected will work
      handleGenerateSelected();
    }
  };

  const handleLoadSample = (sample) => {
    setCode(sample.code);
    setCodeOrigin('sample'); // Code is from a sample
    setSourceMetadata(null); // Clear any previous source metadata
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
    setCodeOrigin('sample'); // Cleared editor shows sample placeholder
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

  // Destructure the specific functions we need to avoid stale closure issues
  const { removeFile, removeFiles, setActiveFile } = multiFileState;

  /**
   * Wrapped setActiveFile that tracks user interaction
   */
  const handleSelectFile = useCallback((fileId) => {
    // Mark that user has interacted with workspace (for clearing logic on delete)
    if (fileId !== null) {
      hasUserInteractedWithWorkspaceRef.current = true;
    }
    setActiveFile(fileId);
  }, [setActiveFile]);

  /**
   * Remove a single file from workspace (keeps generated document in history)
   */
  const handleRemoveFile = useCallback(async (fileId) => {
    // Mark that user has interacted with workspace (for clearing logic)
    hasUserInteractedWithWorkspaceRef.current = true;
    // Remove file from workspace (persistence layer handles workspace_files table)
    // NOTE: Does NOT delete from generated_documents - keeps doc in user's history
    removeFile(fileId);
  }, [removeFile]);

  /**
   * Delete selected files from workspace (keeps generated documents in history)
   * Used by both: (1) Delete button and (2) "Delete workspace" link in info banner
   */
  const handleDeleteSelected = useCallback(async () => {
    const selectedIds = multiFileState.selectedFileIds;
    if (selectedIds.length === 0) return;

    // Mark that user has interacted with workspace (for clearing logic)
    hasUserInteractedWithWorkspaceRef.current = true;

    const isDeletingAll = selectedIds.length === multiFileState.files.length;

    // Remove files from workspace (persistence layer handles workspace_files table)
    // NOTE: Does NOT delete from generated_documents - keeps docs in user's history
    removeFiles(selectedIds);

    // If deleting ALL files, also clear batch summary, documentation, and reset code to default
    if (isDeletingAll) {
      setBulkGenerationSummary(null);
      setBatchSummaryMarkdown(null);
      removeSessionItem('bulk_generation_summary');
      removeSessionItem('batch_summary_markdown');
      setDocumentation('');
      setQualityScore(null);
      setCode(DEFAULT_CODE); // Reset to default code when workspace is fully cleared
      setFilename('code.js');
      setCodeOrigin('sample');
    }
  }, [multiFileState.selectedFileIds, multiFileState.files.length, removeFiles, setBulkGenerationSummary, setBatchSummaryMarkdown, setDocumentation, setQualityScore, setCode, setFilename, setCodeOrigin]);

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

  // DEV ONLY: Expose retry test mode helper
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Preview retry banner UI without making any API calls
      // Usage: window.__previewRetry('claude') - shows banner for Claude API
      // Usage: window.__previewRetry('openai') - shows banner for OpenAI API
      window.__previewRetry = (provider = 'claude') => {
        const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
        console.log(`[DEV] Showing ${providerName} retry banner. Call window.__stopRetry() to clear.`);

        // Clear any existing doc and simulate generating state
        setDocumentation('');
        setIsGenerating(true);

        setRetryStatus({
          attempt: 1,
          maxAttempts: 3,
          message: `${providerName} API: Retrying... (attempt 1/3)`,
          reason: 'rate_limit',
          provider: provider
        });
      };

      window.__stopRetry = () => {
        setRetryStatus(null);
        setIsGenerating(false);
        console.log('[DEV] Retry preview cleared.');
      };

      console.log('[DEV] Retry preview: window.__previewRetry("claude"|"openai"|"gemini") and window.__stopRetry()');
    }
    return () => {
      delete window.__previewRetry;
    };
  }, [setDocumentation, setIsGenerating, setRetryStatus]);

  // Show toast notifications for documentation generation success only
  // Track previous isGenerating state to detect generation completion
  const prevGeneratingRef = useRef(isGenerating);

  useEffect(() => {
    // Only show toast if:
    // 1. Generation just completed (not loaded from storage)
    // 2. NOT in batch generation mode (batch has its own completion toast)
    const isBatchMode = bulkGenerationProgress !== null;
    if (prevGeneratingRef.current && !isGenerating && documentation && qualityScore && !isBatchMode) {
      toastDocGenerated(qualityScore.grade, qualityScore.score);
    }
    prevGeneratingRef.current = isGenerating;
  }, [documentation, qualityScore, isGenerating, bulkGenerationProgress]);

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
    // Mark that user intentionally cleared doc panel - prevents auto-reload from DB on refresh
    // Uses localStorage so it survives browser refresh; cleared on logout or new generation
    setStorageItem(STORAGE_KEYS.DOC_PANEL_CLEARED, 'true');

    // Clear documentation and quality score from state
    reset();

    // For unauthenticated users, clear sessionStorage too
    if (!user?.id) {
      setSessionItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, '');
      setSessionItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, '');
    }
    // For authenticated users, docs are in DB - no sessionStorage to clear

    // Always clear batch state when resetting (clears state and sessionStorage)
    // This removes the "batch complete" banner and prevents it from returning after refresh
    clearBatchState();

    // Deselect active file in sidebar (clearing means no file is active in the doc panel)
    // This also triggers workspace state to save activeFileId=null to localStorage
    multiFileState.setActiveFile(null);
  }, [reset, multiFileState, clearBatchState, user]);

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
        key="doc-panel-multi-file-memoized"
        documentation={documentation}
        qualityScore={qualityScore}
        isGenerating={isGenerating || testSkeletonMode}
        onViewBreakdown={handleViewBreakdown}
        onUpload={handleUpload}
        onGithubImport={handleGithubImport}
        onGenerate={handleGenerate}
        onReset={handleReset}
        bulkGenerationProgress={bulkGenerationProgress}
        bulkGenerationSummary={(bannerDismissed || bulkGenerationProgress || isAnalyzingGraph) ? null : bulkGenerationSummary}
        bulkGenerationErrors={bulkGenerationErrors}
        currentlyGeneratingFile={currentlyGeneratingFile}
        throttleCountdown={throttleCountdown}
        isAnalyzingGraph={isAnalyzingGraph}
        onDismissBulkErrors={dismissBanner}
        onDocumentClick={handleDocumentClick}
        onBackToSummary={handleBackToSummary}
        onDownloadAllDocs={handleDownloadAllDocs}
        batchSummaryMarkdown={batchSummaryMarkdown}
        canUseBatchProcessing={canUseBatchProcessing}
        onExportFile={handleExportFile}
        docType={docType}
        filename={filename}
        onCancelBatch={cancelBatchGeneration}
        isCancelling={isCancelling}
        retryStatus={retryStatus}
      />
    </Suspense>
  ), [
    documentation,
    qualityScore,
    isGenerating,
    testSkeletonMode,
    bulkGenerationProgress,
    bulkGenerationSummary,
    bannerDismissed,
    bulkGenerationErrors,
    currentlyGeneratingFile,
    throttleCountdown,
    batchSummaryMarkdown,
    canUseBatchProcessing,
    docType,
    filename,
    cancelBatchGeneration,
    isCancelling,
    retryStatus
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
        trialCode={pendingTrialCode}
        onTrialCodeConsumed={() => setPendingTrialCode(null)}
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

      {/* Trial Banner - Shows when user has active trial */}
      <TrialBanner
        onUpgrade={() => { window.location.href = '/pricing'; }}
      />

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
                onSelectFile={handleSelectFile}
                onToggleFileSelection={multiFileState.toggleFileSelection}
                onSelectAllFiles={multiFileState.selectAllFiles}
                onDeselectAllFiles={multiFileState.deselectAllFiles}
                onRemoveFile={handleRemoveFile}
                onAddFile={handleMultiFileUpload}
                hasCodeInEditor={code.trim().length > 0}
                onFilesDrop={handleMultiFilesDrop}
                onGenerateFile={handleGenerateSingleFile}
                onGenerateSelected={() => {
                  // Check if any files are selected
                  const filesWithContent = multiFileState.files.filter(f => f.content && f.content.length > 0);
                  const selectedFilesWithContent = filesWithContent.filter(f => multiFileState.selectedFileIds.includes(f.id));

                  if (selectedFilesWithContent.length > 0) {
                    // Generate documentation for all selected files
                    handleGenerateSelected();
                  } else if (multiFileState.selectedFileIds.length > 0) {
                    // Files are selected but none have content - show reload modal
                    const selectedFiles = multiFileState.files.filter(f => multiFileState.selectedFileIds.includes(f.id));
                    const reloadableFiles = selectedFiles.filter(f => f.origin === 'github' && f.github?.repo && f.github?.path);
                    setFilesToReloadFromSource(reloadableFiles);
                    setShowReloadFromSourceModal(true);
                  } else {
                    // No files selected, show confirmation to generate from code editor
                    setShowGenerateFromEditorModal(true);
                  }
                }}
                onDeleteSelected={handleDeleteSelected}
                bulkGenerationProgress={bulkGenerationProgress}
                onUpdateFile={multiFileState.updateFile}
                onViewBatchSummary={handleBackToSummary}
                selectedProjectId={selectedProjectId}
                selectedProjectName={selectedProjectName}
                onProjectChange={handleProjectChange}
                canUseProjectManagement={canUseProjectManagement}
              />

              {/* Main Content - Full width on mobile */}
              <div className="flex-1 min-w-0">
                <main id="main-content" className="flex-1 w-full h-full flex flex-col overflow-auto lg:overflow-hidden lg:min-h-0">

        <PriorityBannerSection
          error={error}
          retryAfter={retryAfter}
          uploadError={uploadError}
          showUsageWarning={showUsageWarning}
          usage={mockUsage || getUsageForPeriod('monthly')}
          currentTier={mockUsage?.tier || usage?.tier}
          onDismissError={clearError}
          onDismissUploadError={() => setUploadError(null)}
          onDismissUsageWarning={() => {
            setShowUsageWarning(false);
            setMockUsage(null);
          }}
          onUpgrade={handleUpgradeClick}
        />

        <MobileTabBar
          activeTab={mobileActiveTab}
          onTabChange={setMobileActiveTab}
        />

        {/* Content Area - Mobile tabs or Desktop split view */}
        <div className="flex-1 min-h-0">
          {isMobileView ? (
            // Mobile: Show only active tab (full screen)
            mobileActiveTab === 'code' ? codePanel : docPanel
          ) : (
            // Desktop: Split view (side by side)
            <SplitPanel layout={layout} leftPanel={codePanel} rightPanel={docPanel} />
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
                  onSelectFile={handleSelectFile}
                  onToggleFileSelection={multiFileState.toggleFileSelection}
                  onSelectAllFiles={multiFileState.selectAllFiles}
                  onDeselectAllFiles={multiFileState.deselectAllFiles}
                  onRemoveFile={handleRemoveFile}
                  onAddFile={handleMultiFileUpload}
                  hasCodeInEditor={code.trim().length > 0}
                  onFilesDrop={handleMultiFilesDrop}
                  onGenerateFile={handleGenerateSingleFile}
                  onGenerateSelected={() => {
                    // Check if any files are selected
                    const filesWithContent = multiFileState.files.filter(f => f.content && f.content.length > 0);
                    const selectedFilesWithContent = filesWithContent.filter(f => multiFileState.selectedFileIds.includes(f.id));

                    if (selectedFilesWithContent.length > 0) {
                      // Generate documentation for all selected files
                      handleGenerateSelected();
                    } else if (multiFileState.selectedFileIds.length > 0) {
                      // Files are selected but none have content - show reload modal
                      const selectedFiles = multiFileState.files.filter(f => multiFileState.selectedFileIds.includes(f.id));
                      const reloadableFiles = selectedFiles.filter(f => f.origin === 'github' && f.github?.repo && f.github?.path);
                      setFilesToReloadFromSource(reloadableFiles);
                      setShowReloadFromSourceModal(true);
                    } else {
                      // No files selected, show confirmation to generate from code editor
                      setShowGenerateFromEditorModal(true);
                    }
                  }}
                  onDeleteSelected={handleDeleteSelected}
                  bulkGenerationProgress={bulkGenerationProgress}
                  onUpdateFile={multiFileState.updateFile}
                  onViewBatchSummary={handleBackToSummary}
                  selectedProjectId={selectedProjectId}
                  selectedProjectName={selectedProjectName}
                  onProjectChange={handleProjectChange}
                  canUseProjectManagement={canUseProjectManagement}
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

                  <PriorityBannerSection
                    error={error}
                    retryAfter={retryAfter}
                    uploadError={uploadError}
                    showUsageWarning={showUsageWarning}
                    usage={mockUsage || getUsageForPeriod('monthly')}
                    currentTier={mockUsage?.tier || usage?.tier}
                    onDismissError={clearError}
                    onDismissUploadError={() => setUploadError(null)}
                    onDismissUsageWarning={() => {
                      setShowUsageWarning(false);
                      setMockUsage(null);
                    }}
                    onUpgrade={handleUpgradeClick}
                  />

                  {/* Layout Views: Split | Code Only | Doc Only */}
                  <div className="flex-1 min-h-0 transition-all duration-300">
                    <SplitPanel
                      layout={layout}
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
                            bulkGenerationSummary={(bannerDismissed || bulkGenerationProgress || isAnalyzingGraph) ? null : bulkGenerationSummary}
                            bulkGenerationErrors={bulkGenerationErrors}
                            currentlyGeneratingFile={currentlyGeneratingFile}
                            throttleCountdown={throttleCountdown}
                            isAnalyzingGraph={isAnalyzingGraph}
                            onDismissBulkErrors={dismissBanner}
                            onDocumentClick={handleDocumentClick}
                            onBackToSummary={handleBackToSummary}
                            onDownloadAllDocs={handleDownloadAllDocs}
                            batchSummaryMarkdown={batchSummaryMarkdown}
                            canUseBatchProcessing={canUseBatchProcessing}
                            onExportFile={handleExportFile}
                            docType={docType}
                            filename={filename}
                            onCancelBatch={cancelBatchGeneration}
                            isCancelling={isCancelling}
                            retryStatus={retryStatus}
                          />
                        </Suspense>
                      }
                    />
                  </div>

                </main>
              </Panel>
            </PanelGroup>
          )
        ) : (
          <main id="main-content" className="flex-1 w-full flex flex-col overflow-auto lg:overflow-hidden lg:min-h-0">
            <PriorityBannerSection
              error={error}
              retryAfter={retryAfter}
              uploadError={uploadError}
              showUsageWarning={showUsageWarning}
              usage={mockUsage || getUsageForPeriod('monthly')}
              currentTier={mockUsage?.tier || usage?.tier}
              onDismissError={clearError}
              onDismissUploadError={() => setUploadError(null)}
              onDismissUsageWarning={() => {
                setShowUsageWarning(false);
                setMockUsage(null);
              }}
              onUpgrade={handleUpgradeClick}
            />

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

            <MobileTabBar
              activeTab={mobileActiveTab}
              onTabChange={setMobileActiveTab}
            />

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
                      key="doc-panel-single-file"
                      documentation={documentation}
                      qualityScore={qualityScore}
                      isGenerating={isGenerating || testSkeletonMode}
                      onViewBreakdown={handleViewBreakdown}
                      onUpload={handleUpload}
                      onGithubImport={handleGithubImport}
                      onGenerate={handleGenerate}
                      onReset={handleReset}
                      bulkGenerationProgress={bulkGenerationProgress}
                      bulkGenerationSummary={(bannerDismissed || bulkGenerationProgress || isAnalyzingGraph) ? null : bulkGenerationSummary}
                      bulkGenerationErrors={bulkGenerationErrors}
                      currentlyGeneratingFile={currentlyGeneratingFile}
                      throttleCountdown={throttleCountdown}
                      isAnalyzingGraph={isAnalyzingGraph}
                      onDismissBulkErrors={dismissBanner}
                      onDocumentClick={handleDocumentClick}
                      onBackToSummary={handleBackToSummary}
                      onDownloadAllDocs={handleDownloadAllDocs}
                      batchSummaryMarkdown={batchSummaryMarkdown}
                      canUseBatchProcessing={canUseBatchProcessing}
                      onExportFile={handleExportFile}
                      docType={docType}
                      filename={filename}
                      onCancelBatch={cancelBatchGeneration}
                      isCancelling={isCancelling}
                      retryStatus={retryStatus}
                    />
                  </Suspense>
                )
              ) : (
                // Desktop: Split view (side by side)
                <SplitPanel
                  layout={layout}
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
                        key="doc-panel-single-file"
                        documentation={documentation}
                        qualityScore={qualityScore}
                        isGenerating={isGenerating || testSkeletonMode}
                        onViewBreakdown={handleViewBreakdown}
                        onUpload={handleUpload}
                        onGithubImport={handleGithubImport}
                        onGenerate={handleGenerate}
                        onReset={handleReset}
                        bulkGenerationProgress={bulkGenerationProgress}
                        bulkGenerationSummary={(bannerDismissed || bulkGenerationProgress || isAnalyzingGraph) ? null : bulkGenerationSummary}
                        bulkGenerationErrors={bulkGenerationErrors}
                        currentlyGeneratingFile={currentlyGeneratingFile}
                        throttleCountdown={throttleCountdown}
                        isAnalyzingGraph={isAnalyzingGraph}
                        onDismissBulkErrors={dismissBanner}
                        onDocumentClick={handleDocumentClick}
                        onBackToSummary={handleBackToSummary}
                        onDownloadAllDocs={handleDownloadAllDocs}
                        batchSummaryMarkdown={batchSummaryMarkdown}
                        canUseBatchProcessing={canUseBatchProcessing}
                        onExportFile={handleExportFile}
                        docType={docType}
                        filename={filename}
                        onCancelBatch={cancelBatchGeneration}
                        isCancelling={isCancelling}
                        retryStatus={retryStatus}
                      />
                    </Suspense>
                  }
                />
              )}
            </div>
          </main>
        )}
      </div>

      {/* All Application Modals */}
      <AppModals
        // Quality Score Modal
        showQualityModal={showQualityModal}
        qualityScore={qualityScore}
        onCloseQualityModal={() => setShowQualityModal(false)}
        filename={filename}

        // Samples Modal
        showSamplesModal={showSamplesModal}
        onCloseSamplesModal={() => setShowSamplesModal(false)}
        onLoadSample={handleLoadSample}
        currentCode={code}
        samplesButtonRef={samplesButtonRef}

        // Help Modal
        showHelpModal={showHelpModal}
        onCloseHelpModal={() => setShowHelpModal(false)}

        // Large Code Confirmation Modal
        showConfirmationModal={showConfirmationModal}
        largeCodeStats={largeCodeStats}
        onCloseConfirmationModal={() => {
          setShowConfirmationModal(false);
          setLargeCodeStats(null);
        }}
        onConfirmLargeCode={performGeneration}

        // Generate From Editor Modal
        showGenerateFromEditorModal={showGenerateFromEditorModal}
        onCloseGenerateFromEditorModal={() => setShowGenerateFromEditorModal(false)}
        onConfirmGenerateFromEditor={() => {
          setShowGenerateFromEditorModal(false);
          handleGenerate();
        }}

        // Regenerate Modal
        showRegenerateModal={showRegenerateModal}
        regenerateModalData={regenerateModalData}
        onRegenerateAll={handleRegenerateAll}
        onGenerateNewOnly={handleGenerateNewOnly}
        onCancelRegenerate={handleCancelRegenerate}

        // Usage Limit Modal
        showUsageLimitModal={showUsageLimitModal}
        onCloseUsageLimitModal={() => setShowUsageLimitModal(false)}
        usage={getUsageForPeriod('monthly')}
        onUpgrade={handleUpgradeClick}

        // Terms Modal
        showTermsModal={showTermsModal}
        onAcceptTerms={handleAcceptLegalDocuments}
        legalStatus={legalStatus}

        // Contact Support Modal
        showSupportModal={showSupportModal}
        onCloseSupportModal={() => setShowSupportModal(false)}
        onShowLoginFromSupport={() => {
          sessionStorage.setItem('pendingSupportModal', 'true');
          headerRef.current?.openLoginModal();
        }}

        // GitHub Modal
        showGithubModal={showGithubModal}
        onCloseGithubModal={() => setShowGithubModal(false)}
        onGithubFileLoad={handleGithubFileLoad}
        onGithubFilesLoad={multiFileState.reloadWorkspace}
        defaultDocType={docType}

        // Unsupported File Modal
        unsupportedFileModal={unsupportedFileModal}
        onCloseUnsupportedFileModal={() => setUnsupportedFileModal({ isOpen: false, fileName: '', fileExtension: '' })}

        // Reload From Source Modal
        showReloadFromSourceModal={showReloadFromSourceModal}
        filesToReloadFromSource={filesToReloadFromSource}
        reloadFromSourceProgress={reloadFromSourceProgress}
        onCloseReloadFromSourceModal={() => {
          setShowReloadFromSourceModal(false);
          setFilesToReloadFromSource([]);
          setReloadFromSourceProgress(null);
        }}
        onConfirmReloadFromSource={handleReloadFilesFromSource}
        onGenerateAfterReload={handleGenerateAfterReload}
      />

      {/* Footer */}
      <Footer onSupportClick={() => setShowSupportModal(true)} />
    </div>
  );
}

export default App;