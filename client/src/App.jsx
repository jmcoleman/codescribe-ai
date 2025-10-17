import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import { useDocGeneration } from './hooks/useDocGeneration';
import { ErrorBanner } from './components/ErrorBanner';
import { validateFile, getValidationErrorMessage } from './utils/fileValidation';

// Lazy load heavy components that aren't needed on initial render
const DocPanel = lazy(() => import('./components/DocPanel').then(m => ({ default: m.DocPanel })));
const QualityScoreModal = lazy(() => import('./components/QualityScore').then(m => ({ default: m.QualityScoreModal })));
const ExamplesModal = lazy(() => import('./components/ExamplesModal').then(m => ({ default: m.ExamplesModal })));
const HelpModal = lazy(() => import('./components/HelpModal').then(m => ({ default: m.HelpModal })));

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
  toastError,
  toastDocGenerated,
  toastRateLimited,
  toastGrouped,
  toastCompact,
} from './utils/toast';

function App() {
  const [code, setCode] = useState('// Paste your code here or try the example below...\n\n// Example function:\nfunction calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n');
  const [docType, setDocType] = useState('README');
  const [language, setLanguage] = useState('javascript');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Prevent body scroll and layout shift when any modal opens
  useEffect(() => {
    const isAnyModalOpen = showQualityModal || showExamplesModal || showHelpModal;

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
      setShowQualityModal(false); // Close modal when starting new generation
      try {
        await generate(code, docType, 'javascript');
        // Success toast will be shown after generation completes
      } catch (err) {
        // Error handling is done in useDocGeneration hook
        // But we can add a toast here if needed
      }
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

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/upload`, {
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
        setLanguage(languageMap[extension] || 'javascript');

        // Show success toast with compact variant for non-intrusive feedback
        toastCompact(`File uploaded successfully`, 'success');
        console.log(`File uploaded successfully: ${data.file.name} (${data.file.sizeFormatted})`);
      }

      // Reset the file input so the same file can be selected again
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.message);
      // Use grouped toasts for upload errors to prevent duplicate notifications
      toastGrouped('upload-error', toastError, `Unable to upload file. ${error.message}`);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleGithubImport = () => {
    // TODO: Implement GitHub import
    console.log('GitHub import clicked');
  };

  const handleLoadExample = (example) => {
    setCode(example.code);
    setDocType(example.docType);
    setLanguage(example.language);
    reset(); // Clear any existing documentation and quality score
    // Use compact toast for quick, non-intrusive feedback
    toastCompact('Example loaded successfully', 'success');
  };

  // Show toast notifications for documentation generation success/error
  useEffect(() => {
    if (documentation && qualityScore && !isGenerating) {
      // Documentation was successfully generated
      toastDocGenerated(qualityScore.grade, qualityScore.score);
    }
  }, [documentation, qualityScore, isGenerating]);

  // Show toast for rate limit errors (grouped to prevent duplicates)
  useEffect(() => {
    if (error && error.includes('rate limit')) {
      if (retryAfter) {
        toastGrouped('rate-limit', toastRateLimited, retryAfter);
      }
    } else if (error && error.includes('network')) {
      // Group network errors separately
      toastGrouped('network-error', toastError, error);
    }
  }, [error, retryAfter]);

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
              onViewBreakdown={() => setShowQualityModal(true)}
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
    </div>
  );
}

export default App;