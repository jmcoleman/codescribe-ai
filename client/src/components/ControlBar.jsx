import { useState, useEffect } from 'react';
import { Upload, Github, Sparkles, Menu } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';
import { fetchDocTypes } from '../services/api';

// Feature flag: GitHub import enabled (v2.8.0+)
const ENABLE_GITHUB_IMPORT = true;

export function ControlBar({
  docType,
  onDocTypeChange,
  onGenerate,
  onUpload,
  onGithubImport,
  onMenuClick,
  showMenuButton = false,
  isGenerating = false,
  isUploading = false,
  generateDisabled = false,
  disabled = false
}) {
  const [docTypes, setDocTypes] = useState([
    { value: 'API', label: 'API Documentation' },
    { value: 'ARCHITECTURE', label: 'Architecture Docs' },
    { value: 'JSDOC', label: 'JSDoc Comments' },
    { value: 'README', label: 'README.md' },
  ]);

  // Fetch doc types from backend on mount
  useEffect(() => {
    fetchDocTypes().then(types => {
      if (types && types.length > 0) {
        setDocTypes(types);
      }
    });
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 transition-colors">
      <h2 className="sr-only">Documentation Controls</h2>
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Mobile Menu Button (only visible on mobile when showMenuButton is true) */}
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start"
              aria-label="Open file menu"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <Button
            variant="secondary"
            icon={Upload}
            onClick={onUpload}
            disabled={disabled || isUploading}
            loading={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>

          {ENABLE_GITHUB_IMPORT && (
            <Button
              variant="secondary"
              icon={Github}
              onClick={onGithubImport}
              disabled={disabled}
              aria-label="Import from GitHub"
            >
              <span className="hidden sm:inline">Import from GitHub</span>
              <span className="sm:hidden">GitHub</span>
            </Button>
          )}

          {/* Divider (hidden on mobile) */}
          <div className="hidden sm:block w-px h-6 bg-slate-300 dark:bg-slate-600" />

          {/* Doc Type Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="doc-type-select" className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Doc Type:
            </label>
            <Select
              id="doc-type-select"
              options={docTypes}
              value={docType}
              onChange={onDocTypeChange}
              ariaLabel="Select documentation type"
            />
          </div>
        </div>

        {/* Right: Generate Button */}
        <Button
          data-testid="generate-btn"
          variant="primary"
          icon={Sparkles}
          onClick={onGenerate}
          loading={isGenerating}
          disabled={generateDisabled || disabled}
          className="w-full lg:w-auto"
        >
          {isGenerating ? 'Generating...' : 'Generate Docs'}
        </Button>
      </div>
    </div>
  );
}