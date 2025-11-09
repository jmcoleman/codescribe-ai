import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import Footer from './components/Footer';
import { useDocGeneration } from './hooks/useDocGeneration';
import { useUsageTracking } from './hooks/useUsageTracking';
import { ErrorBanner } from './components/ErrorBanner';
import { UsageWarningBanner } from './components/UsageWarningBanner';
import { UsageLimitModal } from './components/UsageLimitModal';
import UnverifiedEmailBanner from './components/UnverifiedEmailBanner';
import { validateFile, getValidationErrorMessage } from './utils/fileValidation';
import { trackCodeInput, trackFileUpload, trackExampleUsage, trackInteraction } from './utils/analytics';
import { createTestDataLoader, exposeTestDataLoader } from './utils/testData';
import { exposeUsageSimulator } from './utils/usageTestData';
import { useAuth } from './contexts/AuthContext';
import { DEFAULT_CODE } from './constants/defaultCode';

// Lazy load heavy components that aren't needed on initial render
const DocPanel = lazy(() => import('./components/DocPanel').then(m => ({ default: m.DocPanel })));
const QualityScoreModal = lazy(() => import('./components/QualityScore').then(m => ({ default: m.QualityScoreModal })));
const ExamplesModal = lazy(() => import('./components/ExamplesModal').then(m => ({ default: m.ExamplesModal })));
const HelpModal = lazy(() => import('./components/HelpModal').then(m => ({ default: m.HelpModal })));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal').then(m => ({ default: m.ConfirmationModal })));
const TermsAcceptanceModal = lazy(() => import('./components/TermsAcceptanceModal').then(m => ({ default: m.default })));
const ContactSupportModal = lazy(() => import('./components/ContactSupportModal').then(m => ({ default: m.ContactSupportModal })));

// Loading fallback for modals - full screen to prevent layout shift
function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
}

// Loading fallback for panels
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  );
}
import {
  toastDocGenerated,
  toastCompact,
} from './utils/toast';
import { API_URL } from './config/api.js';

function App() {
  const { getToken, user, checkLegalStatus, acceptLegalDocuments } = useAuth();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [docType, setDocType] = useState('README');
  const [language, setLanguage] = useState('javascript');
  const [filename, setFilename] = useState('code.js');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [showUsageWarning, setShowUsageWarning] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [legalStatus, setLegalStatus] = useState(null);
  const [largeCodeStats, setLargeCodeStats] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const examplesButtonRef = useRef(null);
  const headerRef = useRef(null);

  // Track if we just accepted terms to prevent re-checking immediately after
  const justAcceptedTermsRef = useRef(false);

  // Usage tracking
  const { usage, refetch: refetchUsage, checkThreshold, canGenerate, getUsageForPeriod } = useUsageTracking();
  const [mockUsage, setMockUsage] = useState(null);

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

  // Reopen support modal after user logs in (if they came from support modal)
  useEffect(() => {
    if (user && sessionStorage.getItem('pendingSupportModal') === 'true') {
      // User just logged in and had pending support modal
      sessionStorage.removeItem('pendingSupportModal');
      setShowSupportModal(true);
    }
  }, [user]);

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
    const isAnyModalOpen = showQualityModal || showExamplesModal || showHelpModal || showConfirmationModal || showUsageLimitModal || showTermsModal || showSupportModal;

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
  }, [showQualityModal, showExamplesModal, showHelpModal, showTermsModal, showSupportModal]);
  
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
      // Check if code matches the default code (for prompt caching optimization)
      const isDefaultCode = code === DEFAULT_CODE;
      await generate(code, docType, 'javascript', isDefaultCode);
      // Success toast will be shown after generation completes
    } catch (err) {
      // Error handling is done in useDocGeneration hook
      // But we can add a toast here if needed
    }
  };

  const handleUpload = () => {
    // Clear any previous upload errors
    setUploadError(null);
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process file upload (used by both file input and drag-and-drop)
  const processFileUpload = async (file) => {
    if (!file) return;

    // Clear any previous upload errors
    setUploadError(null);

    try {
      // Perform client-side validation
      const validation = validateFile(file);

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
      formData.append('file', file);

      // Get auth token if available
      const token = getToken();
      const headers = {};

      // Add Authorization header if user is authenticated
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'File upload failed');
      }

      const data = await response.json();

      if (data.success && data.file) {
        // Set the code from the uploaded file
        setCode(data.file.content);

        // Set the filename
        setFilename(data.file.name);

        // Detect language from file extension
        const extension = data.file.extension.toLowerCase().replace('.', '');
        const languageMap = {
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'py': 'python',
          'java': 'java',
          'cpp': 'cpp',
          'c': 'c',
          'h': 'c',
          'hpp': 'cpp',
          'cs': 'csharp',
          'go': 'go',
          'rs': 'rust',
          'rb': 'ruby',
          'php': 'php',
        };
        const detectedLanguage = languageMap[extension] || 'javascript';
        setLanguage(detectedLanguage);

        // Track successful file upload
        trackFileUpload({
          fileType: extension,
          fileSize: file.size,
          success: true,
        });

        // Track code input method
        trackCodeInput('upload', data.file.content.length, detectedLanguage);

        // Show success toast with compact variant for non-intrusive feedback
        toastCompact(`File uploaded successfully`, 'success');
      }
    } catch (error) {
      console.error('Error uploading file:', error);

      // Provide more helpful error messages based on error type
      let userFriendlyMessage = 'Unable to upload file';

      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        // Network connectivity issues
        userFriendlyMessage = 'Unable to connect to the server to upload your file. Please check your internet connection and ensure the backend server is running.';
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

      // Track failed file upload
      trackFileUpload({
        fileType: file.name.split('.').pop(),
        fileSize: file.size,
        success: false,
      });

      // No toast needed - error banner will display the error
    }
  };

  // Wrapper for file input change event
  const handleFileChange = async (event) => {
    // Currently only process the first file
    // TODO: Future enhancement - support multiple file uploads
    const file = event.target.files?.[0];
    await processFileUpload(file);
    // Reset the file input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handler for drag-and-drop
  const handleFileDrop = async (file) => {
    await processFileUpload(file);
  };

  const handleGithubImport = () => {
    // TODO: Implement GitHub import
  };

  const handleLoadExample = (example) => {
    setCode(example.code);
    setDocType(example.docType);
    setLanguage(example.language);

    // Set filename based on example title and language
    const exampleName = (example.title || example.docType).toLowerCase().replace(/\s+/g, '-');
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
    const extension = extensionMap[example.language] || '.js';
    setFilename(`${exampleName}${extension}`);

    reset(); // Clear any existing documentation and quality score

    // Track example usage
    trackExampleUsage(example.title || example.docType);
    trackCodeInput('example', example.code.length, example.language);

    // Use compact toast for quick, non-intrusive feedback
    toastCompact('Example loaded successfully', 'success');
  };

  const handleUpgradeClick = () => {
    // Navigate to pricing page
    window.location.href = '/pricing';
  };

  const handleClear = () => {
    // Reset code to default placeholder
    setCode('// Paste your code here or try the example below...\n\n// Example function:\nfunction calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n');
    // Reset filename to default
    setFilename('code.js');
    // Reset language to default (matches code.js)
    setLanguage('javascript');
    // Note: Does not clear documentation or quality score (those remain for reference)
  };

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

  // Show toast notifications for documentation generation success only
  useEffect(() => {
    if (documentation && qualityScore && !isGenerating) {
      // Documentation was successfully generated
      toastDocGenerated(qualityScore.grade, qualityScore.score);
    }
  }, [documentation, qualityScore, isGenerating]);

  // Error toasts removed - errors are displayed via ErrorBanner component instead

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors">
      {/* Skip to Main Content Link - for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only bg-purple-600 text-white rounded-md focus:absolute focus:top-4 focus:left-4 focus:z-50 hover:bg-purple-700 transition-colors"
      >
        Skip to main content
      </a>

      {/* Toast Notifications Container - Uses default styling from toast.jsx */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
      />

      {/* Hidden file input */}
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

      {/* Header */}
      <Header
        ref={headerRef}
        onMenuClick={() => setShowMobileMenu(true)}
        onHelpClick={() => setShowHelpModal(true)}
      />

      {/* Email Verification Banner - Shows at top for unverified users */}
      <UnverifiedEmailBanner user={user} />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        onHelpClick={() => setShowHelpModal(true)}
      />

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 overflow-auto flex flex-col">
        {/* Priority Banner Section - Show only most critical message */}
        {/* Priority Order: 1) Email Verification (handled above), 2) Claude API Error, 3) Upload Error, 4) Generation Error, 5) Usage Warning */}
        {error ? (
          // Priority 1: Claude API rate limit or generation errors (blocking)
          <ErrorBanner
            error={error}
            retryAfter={retryAfter}
            onDismiss={clearError}
          />
        ) : uploadError ? (
          // Priority 2: Upload errors
          <ErrorBanner
            error={uploadError}
            onDismiss={() => setUploadError(null)}
          />
        ) : showUsageWarning && (mockUsage || usage) ? (
          // Priority 3: Usage warning (80%+ usage, non-blocking)
          <div className="mb-6">
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
          isGenerating={isGenerating}
          generateDisabled={!code.trim()}
        />

        {/* Split View: Code + Documentation */}
        <div className="mt-6 flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6 min-h-0">
          {/* Left: Code Panel */}
          <div className="h-[600px] lg:h-full lg:min-w-0 lg:overflow-hidden">
            <CodePanel
              code={code}
              onChange={setCode}
              filename={filename}
              language={language}
              onFileDrop={handleFileDrop}
              onClear={handleClear}
              onExamplesClick={() => setShowExamplesModal(true)}
              examplesButtonRef={examplesButtonRef}
            />
          </div>

          {/* Right: Documentation Panel */}
          <div className="h-[600px] lg:h-full lg:min-w-0 lg:overflow-hidden">
            <Suspense fallback={<LoadingFallback />}>
              <DocPanel
              documentation={documentation}
              qualityScore={qualityScore}
              isGenerating={isGenerating}
              onViewBreakdown={() => {
                setShowQualityModal(true);
                trackInteraction('view_quality_breakdown', {
                  score: qualityScore?.score,
                  grade: qualityScore?.grade,
                });
              }}
              onUpload={handleUpload}
              onGenerate={handleGenerate}
            />
          </Suspense>
          </div>
        </div>

      </main>

      {/* Quality Score Modal */}
      {showQualityModal && qualityScore && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <QualityScoreModal
            qualityScore={qualityScore}
            onClose={() => setShowQualityModal(false)}
          />
        </Suspense>
      )}

      {/* Examples Modal */}
      {showExamplesModal && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ExamplesModal
            isOpen={showExamplesModal}
            onClose={() => {
              setShowExamplesModal(false);
              // Return focus to Examples button after modal closes
              setTimeout(() => {
                examplesButtonRef.current?.focus();
              }, 0);
            }}
            onLoadExample={handleLoadExample}
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
                <p className="text-sm leading-relaxed text-slate-700">
                  You're about to generate documentation for a <strong className="font-semibold text-slate-900">large code file</strong>. This may take longer and consume more API resources.
                </p>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Stats box with purple accent */}
                <div className="bg-white border-l-4 border-purple-500 border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Lines of code</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-purple-900">{largeCodeStats.lines.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 font-medium">lines</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">File size</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-indigo-900">{largeCodeStats.sizeInKB}</span>
                      <span className="text-xs text-slate-500 font-medium">KB</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Characters</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-purple-900">{largeCodeStats.charCount.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 font-medium">chars</span>
                    </div>
                  </div>
                </div>

                {/* Tip box */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-700">💡 Tip:</span> Breaking your code into smaller modules improves documentation quality and generation speed.
                  </p>
                </div>
              </div>
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

      {/* Footer */}
      <Footer onSupportClick={() => setShowSupportModal(true)} />
    </div>
  );
}

export default App;