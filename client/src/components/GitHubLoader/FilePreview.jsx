/**
 * File Preview Component
 * Shows file content preview with metadata
 */

import { Loader2, FileCode, ExternalLink, AlertTriangle } from 'lucide-react';
import { isFileSupported } from '../../services/githubService';

export function FilePreview({ file, loading, repository }) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Loading file preview...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <FileCode className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Select a file to preview
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Click on any file in the tree to see its content
          </p>
        </div>
      </div>
    );
  }

  const lines = file.content.split('\n');
  const previewLines = lines.slice(0, 50); // Show first 50 lines
  const hasMore = lines.length > 50;

  // Check if file is too large (100KB limit)
  const MAX_FILE_SIZE = 100 * 1024; // 100KB
  const isFileTooLarge = file.size > MAX_FILE_SIZE;

  // Check if file type is supported
  const fileSupport = isFileSupported(file.name);
  const isUnsupported = !fileSupport.isSupported;

  return (
    <div className="h-full flex flex-col">
      {/* File Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              {file.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              From{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {repository.owner}/{repository.repo}/{file.path}
              </span>
              {' '}on branch{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {repository.branch}
              </span>
            </p>
          </div>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-4"
          >
            <span>Open in GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Error Warnings - Priority: Unsupported > Too Large */}
      {isUnsupported ? (
        <div className="mx-4 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
                Unsupported File Type
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                {fileSupport.reason}. This file cannot be loaded into the editor.
                You can view it on GitHub instead.
              </p>
            </div>
          </div>
        </div>
      ) : isFileTooLarge ? (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                File Too Large
              </h4>
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                This file is {formatBytes(file.size)}. The maximum file size is {formatBytes(MAX_FILE_SIZE)}.
                Please select a smaller file or view it on GitHub instead.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* File Content */}
      <div className="flex-1 overflow-y-auto">
        {fileSupport.isBinary ? (
          <div className="h-full flex items-center justify-center p-8 bg-white dark:bg-slate-900">
            <div className="text-center max-w-md">
              <FileCode className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Binary File
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                This file cannot be previewed as text. Use the "Open in GitHub" button above to view it on GitHub.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 h-full">
            <pre className="p-4 text-xs font-mono leading-relaxed">
              <code className="text-slate-800 dark:text-slate-200">
                {previewLines.map((line, index) => (
                  <div key={index} className="hover:bg-slate-100 dark:hover:bg-slate-800 -mx-4 px-4">
                    <span className="inline-block w-12 text-right pr-4 text-slate-400 dark:text-slate-600 select-none">
                      {index + 1}
                    </span>
                    <span>{line || ' '}</span>
                  </div>
                ))}
              </code>
            </pre>
            {hasMore && (
              <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-1.5 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  ... {lines.length - 50} more lines
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {!fileSupport.isBinary && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{lines.length} lines</span>
            <span>•</span>
            <span>{file.content.length} chars</span>
            <span>•</span>
            <span className={!isUnsupported && isFileTooLarge ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
              {formatBytes(file.size)}
            </span>
            <span>•</span>
            <span className="capitalize">{file.language}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}
