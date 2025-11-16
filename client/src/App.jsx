import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import { SplitPanel } from './components/SplitPanel';
import Footer from './components/Footer';
import { useDocGeneration } from './hooks/useDocGeneration';
import { useUsageTracking } from './hooks/useUsageTracking';
import { ErrorBanner } from './components/ErrorBanner';
import { UsageWarningBanner } from './components/UsageWarningBanner';
import { UsageLimitModal } from './components/UsageLimitModal';
import UnverifiedEmailBanner from './components/UnverifiedEmailBanner';
import { validateFile, getValidationErrorMessage } from './utils/fileValidation';
import { trackCodeInput, trackFileUpload, trackExampleUsage, trackInteraction } from './utils/analytics';
import { createTestDataLoader, exposeTestDataLoader, createSkeletonTestHelper, exposeSkeletonTestHelper } from './utils/testData';
import { exposeUsageSimulator } from './utils/usageTestData';
import { useAuth } from './contexts/AuthContext';
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
import {
  toastDocGenerated,
  toastCompact,
} from './utils/toast';
import { API_URL } from './config/api.js';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from './constants/storage';

function App() {
  const { getToken, user, checkLegalStatus, acceptLegalDocuments } = useAuth();
  const { effectiveTheme } = useTheme();

  // Load persisted state from localStorage on mount, fallback to defaults
  const [code, setCode] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_CODE, DEFAULT_CODE));
  const [docType, setDocType] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_DOC_TYPE, 'README'));
  const [language, setLanguage] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_LANGUAGE, 'javascript'));
  const [filename, setFilename] = useState(() => getStorageItem(STORAGE_KEYS.EDITOR_FILENAME, 'code.js'));
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
  const [legalStatus, setLegalStatus] = useState(null);
  const [largeCodeStats, setLargeCodeStats] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [testSkeletonMode, setTestSkeletonMode] = useState(false);
  const fileInputRef = useRef(null);
  const samplesButtonRef = useRef(null);
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

  // Persist editor state to localStorage whenever it changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.EDITOR_CODE, code);
  }, [code]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.EDITOR_LANGUAGE, language);
  }, [language]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.EDITOR_FILENAME, filename);
  }, [filename]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.EDITOR_DOC_TYPE, docType);
  }, [docType]);

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
    const isAnyModalOpen = showQualityModal || showSamplesModal || showHelpModal || showConfirmationModal || showUsageLimitModal || showTermsModal || showSupportModal || showGithubModal;

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

  // Load persisted documentation and quality score on mount
  useEffect(() => {
    const savedDoc = getStorageItem(STORAGE_KEYS.EDITOR_DOCUMENTATION);
    const savedScore = getStorageItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE);

    if (savedDoc) {
      setDocumentation(savedDoc);
    }
    if (savedScore) {
      try {
        setQualityScore(JSON.parse(savedScore));
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [setDocumentation, setQualityScore]);

  // Persist documentation and quality score to localStorage whenever they change
  useEffect(() => {
    if (documentation) {
      setStorageItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, documentation);
    }
  }, [documentation]);

  useEffect(() => {
    if (qualityScore) {
      setStorageItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, JSON.stringify(qualityScore));
    }
  }, [qualityScore]);

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
      await generate(code, docType, 'javascript', shouldCache);
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
    setShowGithubModal(true);
  };

  const handleGithubFileLoad = ({ code: fileCode, language: fileLang, filename: fileName, metadata }) => {
    // Set the code from GitHub file
    setCode(fileCode);

    // Detect and set language
    if (fileLang) {
      setLanguage(fileLang);
    }

    // Set filename
    if (fileName) {
      setFilename(fileName);
    }

    // Track analytics
    trackInteraction('github_file_loaded', {
      owner: metadata?.owner,
      repo: metadata?.repo,
      path: metadata?.path,
      language: fileLang
    });

    // Clear any previous documentation
    reset();
    setStorageItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, '');
    setStorageItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, '');
  };

  const handleLoadSample = (sample) => {
    setCode(sample.code);
    setDocType(sample.docType);
    setLanguage(sample.language);

    // Set filename based on sample title and language
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

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors">
      {/* Skip to Main Content Link - for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only bg-purple-600 text-white px-4 py-2 rounded-md focus:absolute focus:top-4 focus:left-4 focus:z-50 hover:bg-purple-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Toast Notifications Container - Theme-aware styling */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Theme-aware default styling
          style: {
            background: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : 'rgb(255 255 255)', // slate-800 : white
            color: effectiveTheme === 'dark' ? 'rgb(248 250 252)' : 'rgb(15 23 42)', // slate-50 : slate-900
            border: effectiveTheme === 'dark' ? '1px solid rgb(51 65 85)' : '1px solid rgb(203 213 225)', // slate-700 : slate-300
          },
          // Success toasts
          success: {
            iconTheme: {
              primary: effectiveTheme === 'dark' ? '#4ADE80' : '#16A34A', // green-400 : green-600
              secondary: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : '#FFFFFF',
            },
          },
          // Error toasts
          error: {
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
      <main id="main-content" className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col overflow-auto lg:overflow-hidden lg:min-h-0">
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
          isGenerating={isGenerating}
          isUploading={isUploading}
          generateDisabled={!code.trim()}
        />

        {/* Split View: Code + Documentation */}
        <div className="mt-6 flex-1 min-h-0">
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
                  onViewBreakdown={() => {
                    setShowQualityModal(true);
                    trackInteraction('view_quality_breakdown', {
                      score: qualityScore?.score,
                      grade: qualityScore?.grade,
                    });
                  }}
                  onUpload={handleUpload}
                  onGithubImport={handleGithubImport}
                  onGenerate={handleGenerate}
                  onReset={() => {
                    // Clear documentation and quality score from state
                    reset();
                    // Clear from localStorage (set to empty string so persistence effect doesn't re-add)
                    setStorageItem(STORAGE_KEYS.EDITOR_DOCUMENTATION, '');
                    setStorageItem(STORAGE_KEYS.EDITOR_QUALITY_SCORE, '');
                  }}
                />
              </Suspense>
            }
          />
        </div>

      </main>

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
          />
        </Suspense>
      )}

      {/* Footer */}
      <Footer onSupportClick={() => setShowSupportModal(true)} />
    </div>
  );
}

export default App;