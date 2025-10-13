import { useState } from 'react';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import { DocPanel } from './components/DocPanel';
import { QualityScoreModal } from './components/QualityScore';
import { useDocGeneration } from './hooks/useDocGeneration';

import { RateLimitIndicator } from './components/RateLimitIndicator';
import { ErrorBanner } from './components/ErrorBanner';
// Import other components as they're built

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

  //////////////// remove start
  // return (
  //   <div className="min-h-screen bg-slate-50">
  //     <header className="bg-white border-b border-slate-200 p-4">
  //       <div className="max-w-7xl mx-auto flex items-center justify-between">
  //         <h1 className="text-2xl font-bold text-purple-600">CodeScribe AI</h1>
  //         {rateLimitInfo && (
  //           <RateLimitIndicator 
  //             remaining={rateLimitInfo.remaining} 
  //             limit={rateLimitInfo.limit} 
  //           />
  //         )}
  //       </div>
  //     </header>

  //     <main className="max-w-7xl mx-auto p-4">
  //       <ErrorBanner 
  //         error={error} 
  //         retryAfter={retryAfter}
  //         onDismiss={() => {/* handle dismiss */}}
  //       />
        
  //       {/* Rest of your UI */}
  //     </main>
  //   </div>
  // );
  //////////////////////// remove end

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header
        onMenuClick={() => setShowMobileMenu(true)}
        showMobileMenu={showMobileMenu}
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

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">Error: {error}</p>
          </div>
        )}
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