/**
 * GitHub Load Modal
 * Large modal for loading files from GitHub repositories
 */

import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Github, Loader2, File, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { SmartInput } from './SmartInput';
import { FileTree } from './FileTree';
import { FilePreview } from './FilePreview';
import { Button } from '../Button';
import { ErrorBanner } from '../ErrorBanner';
import * as githubService from '../../services/githubService';
import { isFileSupported } from '../../services/githubService';
import { toastSuccess } from '../../utils/toast';

export function GitHubLoadModal({ isOpen, onClose, onFileLoad }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filePreviewError, setFilePreviewError] = useState(null);
  const [repository, setRepository] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [recentFilesExpanded, setRecentFilesExpanded] = useState(false);

  const modalRef = useRef(null);
  const smartInputRef = useRef(null);

  // Load recent files on mount
  useEffect(() => {
    if (isOpen) {
      setRecentFiles(githubService.getRecentFiles());
    }
  }, [isOpen]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && smartInputRef.current) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        smartInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Toggle folder expansion
  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  // Expand all parent folders for a given file path
  const expandParentFolders = (filePath) => {
    const parts = filePath.split('/');
    const newExpanded = new Set(expandedPaths);

    // Build and add each parent path
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      newExpanded.add(currentPath);
    }

    setExpandedPaths(newExpanded);
  };

  const handleLoadRepository = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setRepository(null);
    setBranches([]);
    setSelectedFile(null);
    setFilePreview(null);
    setExpandedPaths(new Set()); // Reset expanded paths

    try {
      // Parse the input
      const parsed = await githubService.parseGitHubUrl(input);

      // Fetch the repository tree and branches in parallel
      const [repo, branchesData] = await Promise.all([
        githubService.fetchTree(parsed.owner, parsed.repo, parsed.ref),
        githubService.fetchBranches(parsed.owner, parsed.repo)
      ]);

      setRepository(repo);
      setBranches(branchesData);

      // If a file was specified in the URL, auto-select it
      if (parsed.type === 'file' && parsed.path) {
        // Find the file in the tree
        const file = findFileInTree(repo.tree, parsed.path);
        if (file) {
          expandParentFolders(parsed.path);
          handleFileSelect(file, repo);
        }
      }
    } catch (err) {
      console.error('Failed to load repository:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = async (newBranch) => {
    if (!repository || newBranch === repository.branch) return;

    setLoading(true);
    setError(null);
    setSelectedFile(null);
    setFilePreview(null);
    setExpandedPaths(new Set()); // Reset expanded paths

    try {
      // Refetch the tree with the new branch
      const repo = await githubService.fetchTree(repository.owner, repository.repo, newBranch);
      setRepository(repo);
    } catch (err) {
      console.error('Failed to switch branch:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file, repo = repository) => {
    setSelectedFile(file);
    setLoadingPreview(true);
    setFilePreview(null);
    setFilePreviewError(null);

    // Check if it's a binary file that we shouldn't even try to fetch
    const fileSupport = isFileSupported(file.name);
    if (fileSupport.isBinary) {
      // Create a placeholder preview for binary files (no content to show)
      setFilePreview({
        name: file.name,
        path: file.path,
        size: file.size || 0,
        content: '', // No content for binary files
        language: 'text',
        url: `https://github.com/${repo.owner}/${repo.repo}/blob/${repo.branch}/${file.path}`
      });
      setLoadingPreview(false);
      return;
    }

    try {
      const fileData = await githubService.fetchFile(
        repo.owner,
        repo.repo,
        file.path,
        repo.branch
      );
      setFilePreview(fileData);
      setFilePreviewError(null);
    } catch (err) {
      console.error('Failed to load file preview:', err);
      setFilePreviewError(`Failed to preview file: ${err.message}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleLoadFile = () => {
    if (!filePreview || !repository) return;

    // Validate file type before loading
    const fileSupport = isFileSupported(filePreview.name);
    if (!fileSupport.isSupported) {
      setError(fileSupport.reason);
      return;
    }

    // Pass file content to parent
    onFileLoad({
      code: filePreview.content,
      language: filePreview.language,
      filename: filePreview.name,
      metadata: {
        source: 'github',
        owner: repository.owner,
        repo: repository.repo,
        path: filePreview.path,
        url: filePreview.url
      }
    });

    // Add to recent files
    githubService.addRecentFile({
      owner: repository.owner,
      repo: repository.repo,
      path: filePreview.path,
      name: filePreview.name,
      language: filePreview.language
    });

    // Show success toast
    toastSuccess(`Loaded ${filePreview.name} from ${repository.owner}/${repository.repo}`);

    // Close modal
    onClose();
  };

  const handleRecentFileClick = async (recent) => {
    setInput(`${recent.owner}/${recent.repo}`);
    setLoading(true);
    setError(null);
    setRecentFilesExpanded(false); // Collapse after selection

    try {
      // Fetch the repository tree and branches in parallel
      const [repo, branchesData] = await Promise.all([
        githubService.fetchTree(recent.owner, recent.repo),
        githubService.fetchBranches(recent.owner, recent.repo)
      ]);

      setRepository(repo);
      setBranches(branchesData);

      const file = findFileInTree(repo.tree, recent.path);
      if (file) {
        expandParentFolders(recent.path);
        handleFileSelect(file, repo);
      }
    } catch (err) {
      console.error('Failed to load recent file:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const findFileInTree = (tree, path) => {
    for (const item of tree) {
      if (item.path === path) {
        return item;
      }
      if (item.children) {
        const found = findFileInTree(item.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[90vw] lg:w-[92vw] xl:w-[94vw] 2xl:w-[95vw] h-[90vh] max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="github-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Github className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h2 id="github-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">
              Import from GitHub
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Error Banner - Appears at top for immediate visibility */}
        {error && !repository && !loading && (
          <div className="px-6 pt-4 pb-2">
            <ErrorBanner error={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Input Section */}
        <div className={`${error && !repository && !loading ? 'px-6 pb-6 pt-0' : 'p-6'} border-b border-slate-200 dark:border-slate-700`}>
          <SmartInput
            ref={smartInputRef}
            value={input}
            onChange={setInput}
            onSubmit={handleLoadRepository}
            loading={loading}
          />

          {/* Recent Files */}
          {recentFiles.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setRecentFilesExpanded(!recentFilesExpanded)}
                className="flex items-center gap-1.5 mb-2 w-full hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md px-1 py-1 -mx-1 transition-colors"
                aria-expanded={recentFilesExpanded}
                aria-controls="recent-files-list"
              >
                {recentFilesExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Recent Files ({recentFiles.length})
                </p>
              </button>
              {recentFilesExpanded && (
                <div id="recent-files-list" className="flex flex-col gap-0.5">
                  {recentFiles.map((recent, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentFileClick(recent)}
                      disabled={loading}
                      className="group flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <File className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500 group-hover:enabled:text-slate-600 dark:group-hover:enabled:text-slate-300 transition-colors" />
                      <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400 text-xs truncate">
                          {recent.owner}/{recent.repo}/
                        </span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                          {recent.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading repository...</p>
              </div>
            </div>
          ) : repository ? (
            <div className="h-full flex">
              {/* File Tree */}
              <div className="w-2/5 border-r border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <FileTree
                  tree={repository.tree}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  repository={repository}
                  expandedPaths={expandedPaths}
                  onToggleFolder={toggleFolder}
                  branches={branches}
                  onBranchChange={handleBranchChange}
                />
              </div>

              {/* File Preview */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Error Banner for file preview errors */}
                {filePreviewError && (
                  <div className="p-4">
                    <ErrorBanner error={filePreviewError} onDismiss={() => setFilePreviewError(null)} />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <FilePreview
                    file={filePreview}
                    loading={loadingPreview}
                    repository={repository}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center px-8 py-4">
              <div className="max-w-md text-center">
                <Github className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Import Code from GitHub
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                  Enter a repository or file URL to browse and select code
                </p>
                <div className="text-left bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-sm">
                  <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Examples:</p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-xs">
                    <li>• facebook/react</li>
                    <li>• github.com/vercel/next.js/blob/canary/readme.md</li>
                    <li>• https://github.com/facebook/react</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(() => {
          const MAX_FILE_SIZE = 100 * 1024; // 100KB
          const isFileTooLarge = filePreview?.size > MAX_FILE_SIZE;
          const fileSupport = filePreview ? isFileSupported(filePreview.name) : null;
          const isUnsupported = fileSupport && !fileSupport.isSupported;
          const canLoad = filePreview && !isFileTooLarge && !isUnsupported;

          return (
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              {canLoad && (
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              )}
              {canLoad ? (
                <Button
                  variant="primary"
                  onClick={handleLoadFile}
                  title="Load this file into the editor"
                >
                  Load File
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
