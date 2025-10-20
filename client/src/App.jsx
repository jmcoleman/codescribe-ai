import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import { useDocGeneration } from './hooks/useDocGeneration';
import { ErrorBanner } from './components/ErrorBanner';
import { validateFile, getValidationErrorMessage } from './utils/fileValidation';
import { trackCodeInput, trackFileUpload, trackExampleUsage, trackInteraction } from './utils/analytics';

// Lazy load heavy components that aren't needed on initial render
const DocPanel = lazy(() => import('./components/DocPanel').then(m => ({ default: m.DocPanel })));
const QualityScoreModal = lazy(() => import('./components/QualityScore').then(m => ({ default: m.QualityScoreModal })));
const ExamplesModal = lazy(() => import('./components/ExamplesModal').then(m => ({ default: m.ExamplesModal })));
const HelpModal = lazy(() => import('./components/HelpModal').then(m => ({ default: m.HelpModal })));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal').then(m => ({ default: m.ConfirmationModal })));

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
  const [code, setCode] = useState('// Paste your code here or try the example below...\n\n// Example function:\nfunction calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n');
  const [docType, setDocType] = useState('README');
  const [language, setLanguage] = useState('javascript');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [largeCodeStats, setLargeCodeStats] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Prevent body scroll and layout shift when any modal opens
  useEffect(() => {
    const isAnyModalOpen = showQualityModal || showExamplesModal || showHelpModal || showConfirmationModal;

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
  }, [showQualityModal, showExamplesModal, showHelpModal]);
  
  const {
    generate,
    reset,
    clearError,
    isGenerating,
    documentation,
    qualityScore,
    error,
    rateLimitInfo,
    retryAfter
  } = useDocGeneration();

  const handleGenerate = async () => {
    if (code.trim()) {
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
      await generate(code, docType, 'javascript');
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

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear any previous upload errors
    setUploadError(null);

    try {
      // Perform client-side validation
      const validation = validateFile(file);

      if (!validation.valid) {
        const errorMessage = getValidationErrorMessage(validation);
        setUploadError(errorMessage);
        // Reset the file input
        event.target.value = '';
        return;
      }

      // Log warnings if any (e.g., unexpected MIME type)
      if (validation.warnings.length > 0) {
        console.warn('File upload warnings:', validation.warnings);
      }

      // Create FormData to send file to backend
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
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

      // Reset the file input so the same file can be selected again
      event.target.value = '';
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
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleGithubImport = () => {
    // TODO: Implement GitHub import
  };

  const handleLoadExample = (example) => {
    setCode(example.code);
    setDocType(example.docType);
    setLanguage(example.language);
    reset(); // Clear any existing documentation and quality score

    // Track example usage
    trackExampleUsage(example.name || example.docType);
    trackCodeInput('example', example.code.length, example.language);

    // Use compact toast for quick, non-intrusive feedback
    toastCompact('Example loaded successfully', 'success');
  };

  // Show toast notifications for documentation generation success only
  useEffect(() => {
    if (documentation && qualityScore && !isGenerating) {
      // Documentation was successfully generated
      toastDocGenerated(qualityScore.grade, qualityScore.score);
    }
  }, [documentation, qualityScore, isGenerating]);

  // Error toasts removed - errors are displayed via ErrorBanner component instead

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.hpp,.cs,.go,.rs,.rb,.php,.txt"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload code file"
      />

      {/* Header */}
      <Header
        onMenuClick={() => setShowMobileMenu(true)}
        onExamplesClick={() => setShowExamplesModal(true)}
        onHelpClick={() => setShowHelpModal(true)}
        showMobileMenu={showMobileMenu}
        rateLimitInfo={rateLimitInfo}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        onExamplesClick={() => setShowExamplesModal(true)}
        onHelpClick={() => setShowHelpModal(true)}
      />

      {/* Main Content */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {/* Error Banners */}
        {error && (
          <ErrorBanner
            error={error}
            retryAfter={retryAfter}
            onDismiss={clearError}
          />
        )}
        {uploadError && (
          <ErrorBanner
            error={uploadError}
            onDismiss={() => setUploadError(null)}
          />
        )}

        {/* Split View: Code + Documentation */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-[600px] lg:h-[calc(100vh-280px)]">
          {/* Left: Code Panel */}
          <CodePanel
            code={code}
            onChange={setCode}
            filename="code.js"
            language={language}
          />

          {/* Right: Documentation Panel */}
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
            />
          </Suspense>
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
            onClose={() => setShowExamplesModal(false)}
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
    </div>
  );
}

export default App;