import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import { DocPanel } from './components/DocPanel';
import { QualityScoreModal } from './components/QualityScore';
import { useDocGeneration } from './hooks/useDocGeneration';
import { ErrorBanner } from './components/ErrorBanner';

function App() {
  const [code, setCode] = useState('// Paste your code here or try the example below...\n\n// Example function:\nfunction calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n');
  const [docType, setDocType] = useState('README');
  const [language, setLanguage] = useState('javascript');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  
  const {
    generate,
    isGenerating, 
    documentation,
    qualityScore,
    error,
    rateLimitInfo,
    retryAfter
  } = useDocGeneration();

  const handleGenerate = () => {
    if (code.trim()) {
      generate(code, docType, 'javascript');
    }
  };

  const handleUpload = () => {
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

        console.log(`File uploaded successfully: ${data.file.name} (${data.file.sizeFormatted})`);
      }

      // Reset the file input so the same file can be selected again
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.message);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleGithubImport = () => {
    // TODO: Implement GitHub import
    console.log('GitHub import clicked');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
        showMobileMenu={showMobileMenu}
        rateLimitInfo={rateLimitInfo}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            onDismiss={() => {/* Error will clear on next successful generation */}}
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
          <DocPanel
            documentation={documentation}
            qualityScore={qualityScore}
            isGenerating={isGenerating}
            onViewBreakdown={() => setShowQualityModal(true)}
          />
        </div>

      </main>

      {/* Quality Score Modal */}
      {showQualityModal && qualityScore && (
        <QualityScoreModal
          qualityScore={qualityScore}
          onClose={() => setShowQualityModal(false)}
        />
      )}
    </div>
  );
}

export default App;