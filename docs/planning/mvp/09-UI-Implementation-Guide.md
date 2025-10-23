# CodeScribe AI - UI Implementation Guide

**Project:** CodeScribe AI
**Role:** Frontend Developer
**Tech Stack:** React 18 + Vite, Tailwind CSS 3.4+, Monaco Editor, Lucide React
**Timeline:** Day 2-3 (Frontend Implementation)
**Based on:** Figma Design System (07-Figma-Guide.md)

---

## 📋 Overview

This guide translates the Figma design system into a production-ready React application. It provides component-by-component implementation instructions with code examples, Tailwind classes, and best practices.

---

## 🎨 Design System Translation

### Color Palette → Tailwind Configuration

**File: client/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Purple (Brand)
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          500: '#A855F7',  // Main brand color
          600: '#9333EA',  // Hover states
          700: '#7E22CE',
        },
        // Neutral Slate
        slate: {
          50: '#F8FAFC',   // Page background
          100: '#F1F5F9',  // Light elements
          200: '#E2E8F0',  // Borders
          300: '#CBD5E1',
          500: '#64748B',  // Subtle text
          600: '#475569',  // Body text
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',  // Headers
        },
        // Semantic Colors
        success: '#16A34A',
        warning: '#CA8A04',
        error: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'purple': '0 4px 20px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [],
}
```

### Typography Styles → Tailwind Classes

| Figma Style | Tailwind Classes | Usage |
|-------------|------------------|-------|
| `text/heading-xl` | `text-xl font-semibold leading-7` | Main headings |
| `text/heading-lg` | `text-lg font-semibold leading-6` | Section headings |
| `text/body-base` | `text-sm leading-5` | Body text |
| `text/body-sm` | `text-[13px] leading-[18px]` | Small body text |
| `text/body-xs` | `text-xs leading-4` | Captions, labels |
| `text/label-medium` | `text-sm font-medium leading-5` | Button labels |
| `text/code-sm` | `font-mono text-[13px] leading-5` | Code text |

---

## 🧱 Component Implementation

### Component 1: Button Components

**File: client/src/components/Button.jsx**

```jsx
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-purple hover:from-purple-600 hover:to-purple-700 active:scale-95',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95',
    icon: 'w-10 h-10 p-0 bg-transparent hover:bg-slate-100 text-slate-600',
    dark: 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}

// Icon-only button variant
export function IconButton({ icon: Icon, ...props }) {
  return <Button variant="icon" icon={Icon} {...props} />;
}
```

**Usage Examples:**

```jsx
import { Sparkles, Upload, Menu } from 'lucide-react';

// Primary button with icon
<Button variant="primary" icon={Sparkles}>
  Generate Docs
</Button>

// Secondary button
<Button variant="secondary" icon={Upload}>
  Upload Files
</Button>

// Icon button
<IconButton icon={Menu} />

// Loading state
<Button variant="primary" loading>
  Generating...
</Button>
```

---

### Component 2: Select Dropdown

**File: client/src/components/Select.jsx**

```jsx
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Select({ options, value, onChange, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:border-slate-400 transition-colors min-w-[160px]"
      >
        <span className="flex-1 text-left">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden z-10">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                option.value === value ? 'bg-purple-50 text-purple-700' : 'text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Usage:**

```jsx
const docTypes = [
  { value: 'README', label: 'README.md' },
  { value: 'JSDOC', label: 'JSDoc Comments' },
  { value: 'API', label: 'API Documentation' },
];

<Select
  options={docTypes}
  value={selectedDocType}
  onChange={setSelectedDocType}
/>
```

---

### Component 3: Code Panel

**File: client/src/components/CodePanel.jsx**

```jsx
import { FileCode2, Zap } from 'lucide-react';
import { Editor } from '@monaco-editor/react';

export function CodePanel({
  code,
  onChange,
  filename = 'code.js',
  language = 'javascript',
  readOnly = false
}) {
  // Count lines and characters
  const lines = code.split('\n').length;
  const chars = code.length;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        {/* Left: Traffic lights + filename */}
        <div className="flex items-center gap-3">
          {/* macOS-style traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-sm text-slate-600">{filename}</span>
        </div>

        {/* Right: Language badge */}
        <span className="text-xs text-slate-500 uppercase">{language}</span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            readOnly,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
          }}
          theme="vs-light"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
        <span className="text-xs text-slate-500">
          {lines} lines • {chars} chars
        </span>
        <div className="flex items-center gap-1.5 text-xs">
          <Zap className="w-3 h-3 text-purple-500" />
          <span className="text-slate-600">Ready to analyze</span>
        </div>
      </div>
    </div>
  );
}
```

---

### Component 4: Documentation Panel

**File: client/src/components/DocPanel.jsx**

```jsx
import { Sparkles, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function DocPanel({
  documentation,
  qualityScore = null,
  isGenerating = false,
  onViewBreakdown
}) {
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-200">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-slate-800">
            Generated Documentation
          </span>
        </div>

        {/* Right: Quality Score */}
        {qualityScore && (
          <button
            onClick={onViewBreakdown}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <span className="text-xs text-slate-600">Quality:</span>
            <span className="text-xs font-semibold text-purple-700">
              {qualityScore.score}/100
            </span>
            <span className={`text-sm font-bold ${getGradeColor(qualityScore.grade)}`}>
              {qualityScore.grade}
            </span>
          </button>
        )}
      </div>

      {/* Body - Documentation Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isGenerating && !documentation ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-12 h-12 text-purple-500 animate-pulse mb-4" />
            <p className="text-sm text-slate-600">Generating documentation...</p>
          </div>
        ) : documentation ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vs}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {documentation}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">
              Your generated documentation will appear here
            </p>
          </div>
        )}
      </div>

      {/* Footer - Quick Stats */}
      {qualityScore && (
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-1.5 text-xs">
            <CheckCircle className="w-3 h-3 text-success" />
            <span className="text-slate-600">
              {qualityScore.summary.strengths.length} criteria met
            </span>
          </div>
          {qualityScore.summary.improvements.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <AlertCircle className="w-3 h-3 text-warning" />
              <span className="text-slate-600">
                {qualityScore.summary.improvements.length} areas to improve
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function for grade colors
function getGradeColor(grade) {
  switch (grade) {
    case 'A': return 'text-success';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-warning';
    case 'D':
    case 'F': return 'text-error';
    default: return 'text-slate-600';
  }
}
```

---

### Component 5: Quality Score Breakdown Modal

**File: client/src/components/QualityScore.jsx**

```jsx
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function QualityScoreModal({ qualityScore, onClose }) {
  if (!qualityScore) return null;

  const { score, grade, breakdown, summary } = qualityScore;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Quality Breakdown</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Overall Score */}
        <div className="p-6 bg-gradient-to-br from-purple-50 to-white border-b border-slate-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-1">{score}/100</div>
            <div className={`text-2xl font-bold mb-2 ${getGradeColor(grade)}`}>
              Grade: {grade}
            </div>
            <p className="text-sm text-slate-600">{summary.topSuggestion}</p>
          </div>
        </div>

        {/* Criteria Breakdown */}
        <div className="p-4 overflow-y-auto max-h-96">
          <div className="space-y-3">
            {Object.entries(breakdown).map(([key, criteria]) => (
              <CriteriaItem key={key} name={formatCriteriaName(key)} criteria={criteria} />
            ))}
          </div>
        </div>

        {/* Suggestions */}
        {summary.improvements.length > 0 && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-800 mb-1">
                  Areas to Improve:
                </p>
                <ul className="text-xs text-slate-600 space-y-1">
                  {summary.improvements.map((area) => (
                    <li key={area}>• {formatCriteriaName(area)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CriteriaItem({ name, criteria }) {
  const icon = criteria.status === 'complete'
    ? <CheckCircle className="w-4 h-4 text-success" />
    : criteria.status === 'partial'
    ? <AlertCircle className="w-4 h-4 text-warning" />
    : <AlertCircle className="w-4 h-4 text-error" />;

  const maxPoints = criteria.points || 20;
  const percentage = (criteria.points / maxPoints) * 100;

  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-slate-800">{name}</span>
        </div>
        <span className="text-sm font-semibold text-slate-700">
          {criteria.points}/{maxPoints}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-300 ${
            criteria.status === 'complete' ? 'bg-success' :
            criteria.status === 'partial' ? 'bg-warning' :
            'bg-error'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Suggestion */}
      {criteria.suggestion && (
        <p className="text-xs text-slate-600 mt-1">{criteria.suggestion}</p>
      )}
    </div>
  );
}

// Helper functions
function formatCriteriaName(key) {
  const names = {
    overview: 'Overview',
    installation: 'Installation',
    examples: 'Usage Examples',
    apiDocs: 'API Documentation',
    structure: 'Structure & Formatting',
  };
  return names[key] || key;
}

function getGradeColor(grade) {
  switch (grade) {
    case 'A': return 'text-success';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-warning';
    case 'D':
    case 'F': return 'text-error';
    default: return 'text-slate-600';
  }
}
```

---

### Component 6: Header

**File: client/src/components/Header.jsx**

```jsx
import { FileCode2, Menu } from 'lucide-react';
import { Button } from './Button';

export function Header({ onMenuClick, showMobileMenu = false }) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-purple">
              <FileCode2 className="w-6 h-6 text-white" />
            </div>

            {/* Title + Tagline */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-slate-900">
                CodeScribe AI
              </h1>
              <p className="text-xs text-slate-500 hidden lg:block">
                Intelligent Code Documentation
              </p>
            </div>
          </div>

          {/* Right: Navigation */}
          <nav className="flex items-center gap-2">
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="secondary" onClick={() => window.open('/examples', '_blank')}>
                Examples
              </Button>
              <Button variant="secondary" onClick={() => window.open('/docs', '_blank')}>
                Docs
              </Button>
              <Button variant="dark">
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
```

---

### Component 7: Mobile Menu

**File: client/src/components/MobileMenu.jsx**

```jsx
import { X } from 'lucide-react';
import { Button } from './Button';

export function MobileMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-900">Menu</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2">
            <MenuItem onClick={onClose}>Examples</MenuItem>
            <MenuItem onClick={onClose}>Documentation</MenuItem>
            <MenuItem onClick={onClose}>API Access</MenuItem>
            <MenuItem onClick={onClose}>GitHub Repo</MenuItem>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <Button variant="dark" className="w-full">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function MenuItem({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
    >
      {children}
    </button>
  );
}
```

---

### Component 8: Control Bar

**File: client/src/components/ControlBar.jsx**

```jsx
import { Upload, Github, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';

export function ControlBar({
  docType,
  onDocTypeChange,
  onGenerate,
  onUpload,
  onGithubImport,
  isGenerating = false,
  disabled = false
}) {
  const docTypes = [
    { value: 'README', label: 'README.md' },
    { value: 'JSDOC', label: 'JSDoc Comments' },
    { value: 'API', label: 'API Documentation' },
    { value: 'ARCHITECTURE', label: 'Architecture Docs' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="secondary"
            icon={Upload}
            onClick={onUpload}
            disabled={disabled}
          >
            Upload Files
          </Button>

          <Button
            variant="secondary"
            icon={Github}
            onClick={onGithubImport}
            disabled={disabled}
          >
            <span className="hidden sm:inline">Import from GitHub</span>
            <span className="sm:hidden">GitHub</span>
          </Button>

          {/* Divider (hidden on mobile) */}
          <div className="hidden sm:block w-px h-6 bg-slate-300" />

          {/* Doc Type Select */}
          <Select
            options={docTypes}
            value={docType}
            onChange={onDocTypeChange}
          />
        </div>

        {/* Right: Generate Button */}
        <Button
          variant="primary"
          icon={Sparkles}
          onClick={onGenerate}
          loading={isGenerating}
          disabled={disabled}
          className="w-full lg:w-auto"
        >
          {isGenerating ? 'Generating...' : 'Generate Docs'}
        </Button>
      </div>
    </div>
  );
}
```

---

## 📱 Main App Layout

**File: client/src/App.jsx**

```jsx
import { useState } from 'react';
import { Header } from './components/Header';
import { MobileMenu } from './components/MobileMenu';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import { DocPanel } from './components/DocPanel';
import { QualityScoreModal } from './components/QualityScore';
import { useDocGeneration } from './hooks/useDocGeneration';

function App() {
  // State
  const [code, setCode] = useState('// Your code here...\n');
  const [docType, setDocType] = useState('README');
  const [language, setLanguage] = useState('javascript');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);

  // Custom hook for doc generation
  const {
    generate,
    isGenerating,
    documentation,
    qualityScore,
    error
  } = useDocGeneration();

  // Handlers
  const handleGenerate = () => {
    if (code.trim()) {
      generate(code, docType, language);
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
```

---

## 🎨 Global Styles

**File: client/src/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Scrollbar */
@layer utilities {
  .scrollbar-custom::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .scrollbar-custom::-webkit-scrollbar-track {
    @apply bg-slate-100 rounded;
  }

  .scrollbar-custom::-webkit-scrollbar-thumb {
    @apply bg-slate-300 rounded hover:bg-slate-400;
  }
}

/* Prose Styles for Markdown */
.prose {
  @apply text-slate-700;
}

.prose h1 {
  @apply text-2xl font-semibold text-slate-900 mb-4 mt-6;
}

.prose h2 {
  @apply text-xl font-semibold text-slate-900 mb-3 mt-5;
}

.prose h3 {
  @apply text-lg font-semibold text-slate-900 mb-2 mt-4;
}

.prose p {
  @apply mb-4 leading-relaxed;
}

.prose ul, .prose ol {
  @apply mb-4 ml-6;
}

.prose li {
  @apply mb-1;
}

.prose code {
  @apply bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800;
}

.prose pre {
  @apply bg-slate-50 p-4 rounded-lg overflow-x-auto mb-4 border border-slate-200;
}

.prose pre code {
  @apply bg-transparent p-0;
}

.prose a {
  @apply text-purple-600 hover:text-purple-700 underline;
}

/* Loading Animation */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(to right, #f1f5f9 4%, #e2e8f0 25%, #f1f5f9 36%);
  background-size: 1000px 100%;
}
```

---

## 🎯 Responsive Design Breakpoints

Tailwind's default breakpoints match our Figma design:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Show/hide mobile menu |
| `lg:` | 1024px | Split view side-by-side |
| `xl:` | 1280px | Max content width |

**Key Responsive Patterns:**

```jsx
// Stack on mobile, side-by-side on desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Full width on mobile, auto on desktop
<Button className="w-full lg:w-auto">

// Smaller padding on mobile
<div className="px-4 lg:px-8">
```

---

## ✅ Implementation Checklist

### Phase 1: Setup (30 minutes)
- [ ] Install dependencies: `npm install`
- [ ] Configure Tailwind (tailwind.config.js)
- [ ] Add global styles (index.css)
- [ ] Import Google Fonts (Inter, JetBrains Mono)

### Phase 2: Core Components (2-3 hours)
- [ ] Implement Button component with variants
- [ ] Implement Select dropdown
- [ ] Implement CodePanel with Monaco Editor
- [ ] Implement DocPanel with Markdown rendering
- [ ] Test each component in isolation

### Phase 3: Layout Components (1-2 hours)
- [ ] Implement Header
- [ ] Implement MobileMenu
- [ ] Implement ControlBar
- [ ] Implement QualityScoreModal

### Phase 4: Integration (2 hours)
- [ ] Assemble App.jsx layout
- [ ] Connect useDocGeneration hook
- [ ] Wire up all event handlers
- [ ] Test data flow

### Phase 5: Polish (1-2 hours)
- [ ] Add loading states
- [ ] Add error handling UI
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Add transitions and animations
- [ ] Test accessibility (keyboard navigation, screen readers)

### Phase 6: Testing (1 hour)
- [ ] Test all interactive elements
- [ ] Test streaming documentation generation
- [ ] Test quality score calculation
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing

---

## 🐛 Common Issues & Solutions

### Issue: Monaco Editor not loading
**Solution:** Ensure @monaco-editor/react is installed
```bash
npm install @monaco-editor/react
```

### Issue: Tailwind classes not applying
**Solution:** Check tailwind.config.js content paths
```javascript
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
```

### Issue: Fonts not loading
**Solution:** Verify Google Fonts import in index.css

---

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)
- [Lucide React Icons](https://lucide.dev/)

---

**Document Owner:** Frontend Developer
**Last Updated:** October 12, 2025
**Status:** Ready for Implementation
