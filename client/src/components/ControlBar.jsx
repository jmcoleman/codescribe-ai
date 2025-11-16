import { Upload, Github, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';

// Feature flag: GitHub import enabled (v2.8.0+)
const ENABLE_GITHUB_IMPORT = true;

export function ControlBar({
  docType,
  onDocTypeChange,
  onGenerate,
  onUpload,
  onGithubImport,
  isGenerating = false,
  isUploading = false,
  generateDisabled = false,
  disabled = false
}) {
  const docTypes = [
    { value: 'README', label: 'README.md' },
    { value: 'JSDOC', label: 'JSDoc Comments' },
    { value: 'API', label: 'API Documentation' },
    { value: 'ARCHITECTURE', label: 'Architecture Docs' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 transition-colors">
      <h2 className="sr-only">Documentation Controls</h2>
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="secondary"
            icon={Upload}
            onClick={onUpload}
            disabled={disabled || isUploading}
            loading={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
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