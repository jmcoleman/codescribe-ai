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