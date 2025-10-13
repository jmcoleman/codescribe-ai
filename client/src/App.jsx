import { useState } from 'react';
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
    // TODO: Implement file upload
    console.log('Upload clicked');
  };

  const handleGithubImport = () => {
    // TODO: Implement GitHub import
    console.log('GitHub import clicked');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
          disabled={!code.trim()}
        />

        {/* Error Banner */}
        {error && (
          <ErrorBanner
            error={error}
            retryAfter={retryAfter}
            onDismiss={() => {/* Error will clear on next successful generation */}}
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