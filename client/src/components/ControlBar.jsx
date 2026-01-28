import { useState, useEffect } from 'react';
import { Upload, Github, Sparkles, Menu, ChevronDown, Plus } from 'lucide-react';
import { Menu as HeadlessMenu } from '@headlessui/react';
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

          {/* Add Code Dropdown Menu */}
          <HeadlessMenu as="div" className="relative">
            {({ open }) => (
              <>
                <HeadlessMenu.Button
                  disabled={disabled || isUploading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-600/50 rounded-lg hover:enabled:bg-slate-200 dark:hover:enabled:bg-slate-700 hover:enabled:scale-[1.02] hover:enabled:shadow-sm active:enabled:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none motion-reduce:transition-none"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{isUploading ? 'Uploading...' : 'Add Code'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </HeadlessMenu.Button>

                <HeadlessMenu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-200 dark:border-slate-700">
                  <div className="py-1">
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <button
                          onClick={onUpload}
                          disabled={disabled || isUploading}
                          className={`${
                            active ? 'bg-slate-100 dark:bg-slate-700' : ''
                          } group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span>Upload File</span>
                        </button>
                      )}
                    </HeadlessMenu.Item>

                    {ENABLE_GITHUB_IMPORT && (
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={onGithubImport}
                            disabled={disabled}
                            className={`${
                              active ? 'bg-slate-100 dark:bg-slate-700' : ''
                            } group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Github className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span>Import from GitHub</span>
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    )}
                  </div>
                </HeadlessMenu.Items>
              </>
            )}
          </HeadlessMenu>

          {/* Divider (hidden on mobile) */}
          <div className="hidden sm:block w-px h-6 bg-slate-300 dark:bg-slate-600" />

          {/* Doc Type Select */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="doc-type-select" className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Doc Type:
            </label>
            <Select
              id="doc-type-select"
              options={docTypes}
              value={docType}
              onChange={onDocTypeChange}
              ariaLabel="Select documentation type"
              className="flex-1 sm:flex-none"
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