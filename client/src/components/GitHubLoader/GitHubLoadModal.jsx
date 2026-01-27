/**
 * GitHub Load Modal
 * Large modal for loading files from GitHub repositories
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, AlertCircle, Github, Loader2, File, ChevronDown, ChevronRight, Sparkles, Zap, ExternalLink, FolderTree, Eye, Lock, Globe, Search } from 'lucide-react';
import { SmartInput } from './SmartInput';
import { FileTree } from './FileTree';
import { FilePreview } from './FilePreview';
import { ImportErrorList } from './ImportErrorList';
import { Button } from '../Button';
import { ErrorBanner } from '../ErrorBanner';
import * as githubService from '../../services/githubService';
import { isFileSupported, isCodeFile } from '../../services/githubService';
import { toastSuccess, toastInfo, toastWarning, toastError } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature, getEffectiveTier } from '../../utils/tierFeatures';
import { GITHUB_BATCH_LIMITS } from '../../constants/github';
import { STORAGE_KEYS, getWorkspaceKey } from '../../constants/storage';

export function GitHubLoadModal({ isOpen, onClose, onFileLoad, onFilesLoad, onImportErrors, defaultDocType = 'README' }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBranchSwitch, setLoadingBranchSwitch] = useState(false);
  const [error, setError] = useState(null); // Banner errors (403, 429, 5xx)
  const [fieldError, setFieldError] = useState(null); // Field-level errors (404 not found)
  const [filePreviewError, setFilePreviewError] = useState(null);
  const [repository, setRepository] = useState(null);
  const [branches, setBranches] = useState([]);

  // Owner repository list state (when user enters just an owner like "facebook")
  const [ownerName, setOwnerName] = useState(null);
  const [ownerRepositories, setOwnerRepositories] = useState([]);
  const [ownerRepoMetadata, setOwnerRepoMetadata] = useState({ hasMore: false, total: 0, isAuthenticated: false });
  const [loadingOwnerRepos, setLoadingOwnerRepos] = useState(false);
  const [loadingMoreRepos, setLoadingMoreRepos] = useState(false); // Background loading indicator
  const [repoSearchTerm, setRepoSearchTerm] = useState('');
  const [repoCurrentPage, setRepoCurrentPage] = useState(1);
  const REPOS_PER_PAGE = 20;
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showGitHubBanner, setShowGitHubBanner] = useState(true);

  // Multi-select state (always enabled for Pro+, disabled for Free/Starter)
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showProHint, setShowProHint] = useState(true); // Dismissable Pro feature hint
  const lastSelectedFileRef = useRef(null); // Track last selected file for shift-click range selection
  const [extensionFilters, setExtensionFilters] = useState({ extensions: [], mode: 'include' }); // Extension filter for file tree

  // Batch import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    currentFile: '',
    isComplete: false
  });
  const [importErrors, setImportErrors] = useState([]);
  const [showErrorList, setShowErrorList] = useState(false);
  const [batchImportError, setBatchImportError] = useState(null); // For 403/feature gate errors
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [mobileActiveTab, setMobileActiveTab] = useState('tree'); // 'tree' or 'preview' (mobile only)

  const modalRef = useRef(null);
  const smartInputRef = useRef(null);
  const fileTreeSearchRef = useRef(null);

  // Tier features
  const { user, refreshUser } = useAuth();
  const effectiveTier = getEffectiveTier(user);
  const canUseBatchProcessing = hasFeature(user, 'batchProcessing');
  const maxFiles = GITHUB_BATCH_LIMITS[effectiveTier] || 1;

  // Debug tier features
  useEffect(() => {
    if (isOpen && user) {
      console.log('[GitHubLoadModal] Tier Debug:', {
        userTier: user.tier,
        viewingAsTier: user.viewing_as_tier,
        overrideExpires: user.override_expires_at,
        effectiveTier,
        canUseBatchProcessing,
        maxFiles
      });
    }
  }, [isOpen, user, effectiveTier, canUseBatchProcessing, maxFiles]);

  // Refresh user data when modal opens to ensure has_github_private_access is current
  useEffect(() => {
    if (isOpen && user) {
      refreshUser();
    }
  }, [isOpen]); // Only depend on isOpen, not user or refreshUser to avoid loops

  // Load recent files and workspace files on mount
  useEffect(() => {
    if (isOpen) {
      console.log('[GitHubLoadModal] Loading recent files for user:', user?.id);
      // Clean up any duplicate entries first
      githubService.cleanupDuplicateRecentFiles(user?.id);
      setRecentFiles(githubService.getRecentFiles(user?.id));

      // Fetch workspace files if user has batch processing
      if (canUseBatchProcessing) {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        fetch(`${import.meta.env.VITE_API_URL}/api/workspace`, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            if (data.success) {
              setWorkspaceFiles(data.files || []);
            } else {
              setWorkspaceFiles([]);
            }
          })
          .catch(err => {
            // Silently fail - duplicate detection will be disabled
            console.warn('[GitHubLoadModal] Could not fetch workspace files:', err.message);
            setWorkspaceFiles([]);
          });
      }
    }
  }, [isOpen, canUseBatchProcessing]);

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

  // Focus file tree search after repository is loaded
  useEffect(() => {
    if (repository && fileTreeSearchRef.current && !loading) {
      // Small delay to ensure UI updates complete
      const timer = setTimeout(() => {
        fileTreeSearchRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [repository, loading]);

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

  // Handle import completion
  useEffect(() => {
    if (importing && importProgress.isComplete) {
      setImporting(false);

      // If there were errors (check from progress state, not importErrors which may be stale)
      if (importProgress.failed > 0) {
        setShowErrorList(true);
      }
      // Close main modal (error list will show separately if there are errors)
      onClose();
    }
  }, [importing, importProgress.isComplete, importProgress.failed, onClose]);

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

    // Close recent dropdown when submitting
    setShowRecentDropdown(false);

    // Check if input is just an owner (e.g., "facebook", "vercel") without repo
    // Owner format: alphanumeric, hyphens, no slashes or dots suggesting URL
    const trimmedInput = input.trim();
    const isOwnerOnly = /^[a-zA-Z0-9-]+$/.test(trimmedInput) && !trimmedInput.includes('/') && !trimmedInput.includes('.');

    if (isOwnerOnly) {
      // User entered just an owner - fetch their repos
      await handleLoadOwnerRepositories(trimmedInput);
      return;
    }

    // Otherwise, treat as full repo path or URL
    setLoading(true);
    setError(null);
    setRepository(null);
    setBranches([]);
    setSelectedFile(null);
    setFilePreview(null);
    setExpandedPaths(new Set()); // Reset expanded paths
    setExtensionFilters({ extensions: [], mode: 'include' }); // Reset extension filters
    setSelectedFiles(new Set()); // Clear file selection when changing repos
    setOwnerRepositories([]); // Clear owner repo list
    setOwnerRepoMetadata({ hasMore: false, total: 0, isAuthenticated: false });
    setOwnerName(null);

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

      // Auto-expand all folders by default for easier navigation
      setExpandedPaths(getAllFolderPaths(repo.tree));

      // Add repository to recent (for browsing before loading files)
      console.log('[GitHubLoadModal] Adding repo to recent (browsing):', `${repo.owner}/${repo.repo}`);
      const codeFileCount = getAllCodeFiles(repo.tree).length;
      githubService.addRecentFile({
        owner: repo.owner,
        repo: repo.repo,
        path: '', // Empty path indicates this is a repo-level entry
        name: `${repo.owner}/${repo.repo}`,
        language: 'repository',
        isRepo: true,
        fileCount: codeFileCount,
        isPrivate: repo.isPrivate
      }, user?.id);
      // Update recent files state immediately
      setRecentFiles(githubService.getRecentFiles(user?.id));

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

      // Check if this is a 404 "not found" error
      const isNotFound = err.message.includes('not found') || err.message.includes('Not Found');

      if (isNotFound) {
        // Show as inline field error (less intrusive for typos)
        let message = 'Repository not found. Check the spelling or verify it exists.';
        if (!user?.has_github_private_access && err.message.includes('private')) {
          message = 'Repository not found. If this is a private repository, connect your GitHub account to access it.';
        }
        setFieldError(message);
        setError(null); // Clear banner error
      } else {
        // Show other errors (rate limit, forbidden, server errors) as banner
        setError(err.message);
        setFieldError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle loading repositories for a specific owner/org with progressive pagination
  const handleLoadOwnerRepositories = async (owner) => {
    setLoadingOwnerRepos(true);
    setError(null);
    setRepository(null);
    setBranches([]);
    setSelectedFile(null);
    setFilePreview(null);
    setOwnerRepositories([]);
    setOwnerRepoMetadata({ hasMore: false, total: 0, isAuthenticated: false });
    setOwnerName(owner);
    setRepoSearchTerm('');

    try {
      // Fetch first page immediately (100 repos in ~1-2 seconds)
      const firstPage = await githubService.fetchOwnerRepositories(owner, 1, 100);

      // Show first page results immediately
      setOwnerRepositories(firstPage.repositories);
      setOwnerRepoMetadata({
        hasMore: firstPage.hasMore,
        total: firstPage.count,
        isAuthenticated: firstPage.isAuthenticated
      });
      setLoadingOwnerRepos(false); // Stop loading spinner after first page

      // Check for empty results
      if (firstPage.repositories.length === 0) {
        setError(`No public repositories found for "${owner}". Try connecting your GitHub account to access private repositories.`);
        return;
      }

      // Continue fetching remaining pages in background
      if (firstPage.hasMore) {
        setLoadingMoreRepos(true); // Show background loading indicator
        let currentPage = 2;
        let hasMorePages = true;

        // Limit unauthenticated users to 3 pages (300 repos) to preserve server quota
        const maxPages = firstPage.isAuthenticated ? 50 : 3;

        while (hasMorePages && currentPage <= maxPages) {
          try {
            const nextPage = await githubService.fetchOwnerRepositories(owner, currentPage, 100);

            // Append new repos to existing list
            setOwnerRepositories(prev => [...prev, ...nextPage.repositories]);
            setOwnerRepoMetadata(prev => ({
              ...prev,
              hasMore: nextPage.hasMore && currentPage < maxPages, // Update hasMore based on limit
              total: prev.total + nextPage.count
            }));

            hasMorePages = nextPage.hasMore;
            currentPage++;
          } catch (err) {
            console.error('[GitHub] Failed to load page', currentPage, ':', err);
            // Continue with what we have - don't fail the entire operation
            break;
          }
        }

        setLoadingMoreRepos(false); // Background loading complete
      }

    } catch (err) {
      console.error('Failed to load repositories:', err);

      // Check if this is a 404 "not found" error
      const isNotFound = err.message.includes('not found') || err.message.includes('Not Found');

      if (isNotFound) {
        // Show as inline field error
        setFieldError(`User or organization "${owner}" not found. Check the spelling or verify it exists.`);
        setError(null);
      } else {
        // Show other errors as banner
        setError(err.message);
        setFieldError(null);
      }
      setOwnerName(null);
      setLoadingOwnerRepos(false);
    }
  };

  // Handle selecting a repository from the owner's repo list
  const handleOwnerRepoSelect = async (repo) => {
    // Clear owner repo list and load the selected repository
    setOwnerRepositories([]);
    setOwnerName(null);
    setInput(`${repo.owner}/${repo.name}`); // Update input to show full repo path

    setLoading(true);
    setError(null);
    setRepository(null);
    setBranches([]);
    setSelectedFile(null);
    setFilePreview(null);
    setExpandedPaths(new Set());
    setExtensionFilters({ extensions: [], mode: 'include' });
    setSelectedFiles(new Set());

    try {
      // Fetch the repository tree and branches in parallel
      const [repoData, branchesData] = await Promise.all([
        githubService.fetchTree(repo.owner, repo.name, repo.defaultBranch),
        githubService.fetchBranches(repo.owner, repo.name)
      ]);

      setRepository(repoData);
      setBranches(branchesData);

      // Auto-expand all folders by default for easier navigation
      setExpandedPaths(getAllFolderPaths(repoData.tree));

      // Add repository to recent (for browsing before loading files)
      console.log('[GitHubLoadModal] Adding repo to recent (from owner list):', `${repoData.owner}/${repoData.repo}`);
      const codeFileCount = getAllCodeFiles(repoData.tree).length;
      githubService.addRecentFile({
        owner: repoData.owner,
        repo: repoData.repo,
        path: '', // Empty path indicates this is a repo-level entry
        name: `${repoData.owner}/${repoData.repo}`,
        language: 'repository',
        isRepo: true,
        fileCount: codeFileCount,
        isPrivate: repoData.isPrivate
      }, user?.id);
      // Update recent files state immediately
      setRecentFiles(githubService.getRecentFiles(user?.id));
    } catch (err) {
      console.error('Failed to load repository:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = async (newBranch) => {
    if (!repository || newBranch === repository.branch) return;

    // Save previous branch for potential rollback
    const previousBranch = repository.branch;

    // Immediately update the branch name in the UI
    setRepository({
      ...repository,
      branch: newBranch
    });

    setLoadingBranchSwitch(true);
    setError(null);
    setSelectedFile(null);
    setFilePreview(null);
    setExtensionFilters({ extensions: [], mode: 'include' }); // Reset extension filters
    setSelectedFiles(new Set()); // Clear file selection when changing branches

    try {
      // Only fetch the tree, not the full repository metadata
      const treeData = await githubService.fetchTree(repository.owner, repository.repo, newBranch);

      // Update repository state with new tree, preserving existing metadata
      setRepository(prev => ({
        ...prev,
        tree: treeData.tree,
        truncated: treeData.truncated,
        totalItems: treeData.totalItems
      }));

      // Auto-expand all folders by default for easier navigation
      setExpandedPaths(getAllFolderPaths(treeData.tree));
    } catch (err) {
      console.error('Failed to switch branch:', err);
      setError(err.message);
      // Revert to previous branch on error
      setRepository(prev => ({
        ...prev,
        branch: previousBranch
      }));
    } finally {
      setLoadingBranchSwitch(false);
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
        url: filePreview.url,
        isPrivate: repository.isPrivate
      }
    });

    // Add to recent files
    console.log('[GitHubLoadModal] Adding recent file for user:', user?.id);
    githubService.addRecentFile({
      owner: repository.owner,
      repo: repository.repo,
      path: filePreview.path,
      name: filePreview.name,
      language: filePreview.language,
      isPrivate: repository.isPrivate
    }, user?.id);
    // Update recent files state immediately
    setRecentFiles(githubService.getRecentFiles(user?.id));

    // Show success toast
    toastSuccess(`Loaded ${filePreview.name} from ${repository.owner}/${repository.repo}`);

    // Close modal
    onClose();
  };

  // Input change handler - clear field error when user types
  const handleInputChange = (value) => {
    setInput(value);
    // Clear field error when user starts typing
    if (fieldError) {
      setFieldError(null);
    }
  };

  // Input focus handler - show recent repos dropdown (Chrome-style)
  const handleInputFocus = () => {
    if (recentFiles.length > 0 && !repository && !loading && !loadingOwnerRepos) {
      setShowRecentDropdown(true);
    }
  };

  // Input blur handler - hide dropdown with delay to allow clicking items
  const handleInputBlur = (e) => {
    // Delay to allow clicking dropdown items before it closes
    setTimeout(() => {
      setShowRecentDropdown(false);
    }, 200);
  };

  // Input clear handler - clear everything (dropdown shows only on focus)
  const handleInputClear = () => {
    setOwnerRepositories([]);
    setOwnerRepoMetadata({ hasMore: false, total: 0, isAuthenticated: false });
    setOwnerName(null);
    setRepoCurrentPage(1);
    setRepository(null);
    setBranches([]);
    setSelectedFile(null);
    setFilePreview(null);
    setSelectedFiles(new Set());
    setExpandedPaths(new Set());
    setFieldError(null); // Clear field error when input is cleared
    setExtensionFilters({ extensions: [], mode: 'include' });
    // Don't auto-show dropdown - let focus handler do that
  };

  // Watch for input changes - if cleared manually (backspace), trigger same clear behavior
  useEffect(() => {
    if (input.trim() === '' && repository) {
      // Input was manually cleared (backspaced to empty), clear everything
      handleInputClear();
    }
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecentFileClick = async (recent) => {
    setInput(`${recent.owner}/${recent.repo}`);
    setLoading(true);
    setError(null);
    setShowRecentDropdown(false); // Hide dropdown after selection
    setOwnerRepositories([]); // Clear owner repo list
    setOwnerRepoMetadata({ hasMore: false, total: 0, isAuthenticated: false });
    setOwnerName(null);
    setSelectedFiles(new Set()); // Clear file selection when changing repos

    try {
      // Fetch the repository tree and branches in parallel
      const [repo, branchesData] = await Promise.all([
        githubService.fetchTree(recent.owner, recent.repo),
        githubService.fetchBranches(recent.owner, recent.repo)
      ]);

      setRepository(repo);
      setBranches(branchesData);

      // Auto-expand all folders by default for easier navigation
      setExpandedPaths(getAllFolderPaths(repo.tree));

      // Update repository in recent (moves to top if already present)
      console.log('[GitHubLoadModal] Updating repo in recent (from recent click):', `${repo.owner}/${repo.repo}`);
      const codeFileCount = getAllCodeFiles(repo.tree).length;
      githubService.addRecentFile({
        owner: repo.owner,
        repo: repo.repo,
        path: '', // Empty path indicates this is a repo-level entry
        name: `${repo.owner}/${repo.repo}`,
        language: 'repository',
        isRepo: true,
        fileCount: codeFileCount,
        isPrivate: repo.isPrivate
      }, user?.id);
      // Update recent files state immediately
      setRecentFiles(githubService.getRecentFiles(user?.id));

      const file = findFileInTree(repo.tree, recent.path);
      if (file) {
        handleFileSelect(file, repo);
      }
    } catch (err) {
      console.error('Failed to load recent file:', err);

      // Enhance error message for "not found" errors when user doesn't have private repo access
      let errorMessage = err.message;
      if (!user?.has_github_private_access && (
        err.message.includes('not found') ||
        err.message.includes('Not Found') ||
        err.message.includes('private')
      )) {
        errorMessage = 'Repository not found. If this is a private repository, connect your GitHub account using the banner above to access it.';
      }

      setError(errorMessage);
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

  // Multi-select handlers
  const handleToggleFileSelection = (filePath) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      if (newSelected.size >= maxFiles) {
        toastWarning(`Maximum ${maxFiles} files for ${effectiveTier} tier`);
        return;
      }
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  // Get all files in flat array for range selection
  const getAllFilesFlat = (tree) => {
    const files = [];
    const traverse = (items) => {
      items.forEach(item => {
        if (item.type === 'blob') {
          files.push(item);
        } else if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(tree);
    return files;
  };

  // Handle file click with keyboard modifiers (Ctrl/Cmd+click, Shift+click)
  const handleFileClick = (file, event) => {
    if (!canUseBatchProcessing) {
      // Single file mode - just preview the file
      handleFileSelect(file);
      return;
    }

    // Multi-select mode with keyboard modifiers
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    if (isCtrlOrCmd) {
      // Ctrl/Cmd+click - toggle selection
      event.preventDefault();
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        if (newSelected.size >= maxFiles) {
          toastWarning(`Maximum ${maxFiles} files for ${effectiveTier} tier`);
          return;
        }
        newSelected.add(file.path);
      }
      setSelectedFiles(newSelected);
      lastSelectedFileRef.current = file.path;

      // Also show preview
      handleFileSelect(file);
    } else if (isShift && lastSelectedFileRef.current && repository) {
      // Shift+click - range selection
      event.preventDefault();
      const allFiles = getAllFilesFlat(repository.tree);
      const lastIndex = allFiles.findIndex(f => f.path === lastSelectedFileRef.current);
      const currentIndex = allFiles.findIndex(f => f.path === file.path);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const newSelected = new Set(selectedFiles);

        // Add all files in range (up to max limit)
        for (let i = start; i <= end; i++) {
          const fileInRange = allFiles[i];
          const fileSupport = isFileSupported(fileInRange.name);
          if (fileSupport.isSupported) {
            if (newSelected.size >= maxFiles) {
              toastWarning(`Maximum ${maxFiles} files for ${effectiveTier} tier`);
              break;
            }
            newSelected.add(fileInRange.path);
          }
        }

        setSelectedFiles(newSelected);
      }

      // Also show preview
      handleFileSelect(file);
    } else {
      // Regular click - just show preview (don't clear selection)
      handleFileSelect(file);
      lastSelectedFileRef.current = file.path;
    }
  };

  const handleSelectAllFiles = () => {
    let allFiles = getAllCodeFiles(repository.tree);

    // Apply extension filter if any extensions are selected
    if (extensionFilters.extensions.length > 0) {
      allFiles = allFiles.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (extensionFilters.mode === 'include') {
          return extensionFilters.extensions.includes(ext);
        } else {
          return !extensionFilters.extensions.includes(ext);
        }
      });
    }

    const filePaths = allFiles.slice(0, maxFiles).map(f => f.path);
    setSelectedFiles(new Set(filePaths));

    if (allFiles.length > maxFiles) {
      toastInfo(`Selected first ${maxFiles} of ${allFiles.length} files (tier limit)`);
    }
  };

  const handleDeselectAllFiles = () => {
    setSelectedFiles(new Set());
  };

  // Helper to collect all folder paths from a tree
  const getAllFolderPaths = (tree) => {
    const allFolderPaths = new Set();
    const collectFolders = (items) => {
      items.forEach(item => {
        if (item.type === 'tree') {
          allFolderPaths.add(item.path);
          if (item.children) {
            collectFolders(item.children);
          }
        }
      });
    };
    collectFolders(tree);
    return allFolderPaths;
  };

  // Expand all folders in the tree
  const handleExpandAll = () => {
    if (!repository?.tree) return;
    setExpandedPaths(getAllFolderPaths(repository.tree));
  };

  // Collapse all folders in the tree
  const handleCollapseAll = () => {
    setExpandedPaths(new Set());
  };

  // Get all code files (excludes markdown, configs, styles, etc.)
  const getAllCodeFiles = (tree) => {
    const files = [];
    const traverse = (items) => {
      items.forEach(item => {
        if (item.type === 'blob') {
          // Use isCodeFile for selection - more restrictive than isFileSupported
          if (isCodeFile(item.name)) {
            files.push(item);
          }
        } else if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(tree);
    return files;
  };

  // Memoize the count of supported files for the Select All button (respects extension filter)
  const supportedFileCount = useMemo(() => {
    if (!repository?.tree) return 0;
    let files = getAllCodeFiles(repository.tree);

    // Apply extension filter if any extensions are selected
    if (extensionFilters.extensions.length > 0) {
      files = files.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (extensionFilters.mode === 'include') {
          return extensionFilters.extensions.includes(ext);
        } else {
          return !extensionFilters.extensions.includes(ext);
        }
      });
    }

    return files.length;
  }, [repository?.tree, extensionFilters]);

  // Filter recent repos based on input value (Chrome-style filtering)
  const filteredRecentRepos = useMemo(() => {
    if (!input.trim()) return recentFiles;

    const searchLower = input.toLowerCase().trim();
    return recentFiles.filter(recent => {
      const fullName = `${recent.owner}/${recent.repo}`.toLowerCase();
      return fullName.includes(searchLower) ||
             recent.owner.toLowerCase().includes(searchLower) ||
             recent.repo.toLowerCase().includes(searchLower);
    });
  }, [recentFiles, input]);

  // Filter and paginate owner repositories
  const { filteredOwnerRepos, paginatedRepos, totalPages, startIndex, endIndex } = useMemo(() => {
    const filtered = ownerRepositories.filter(repo =>
      !repoSearchTerm ||
      repo.name.toLowerCase().includes(repoSearchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(repoSearchTerm.toLowerCase())
    );

    const total = Math.ceil(filtered.length / REPOS_PER_PAGE);
    const start = (repoCurrentPage - 1) * REPOS_PER_PAGE;
    const end = start + REPOS_PER_PAGE;
    const paginated = filtered.slice(start, end);

    return {
      filteredOwnerRepos: filtered,
      paginatedRepos: paginated,
      totalPages: total,
      startIndex: start + 1,
      endIndex: Math.min(end, filtered.length)
    };
  }, [ownerRepositories, repoSearchTerm, repoCurrentPage, REPOS_PER_PAGE]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setRepoCurrentPage(1);
  }, [repoSearchTerm]);

  // Batch import handler
  const handleBatchImport = async (filePaths = null) => {
    // Ensure we have an array of paths
    let pathsToImport;
    if (filePaths) {
      pathsToImport = Array.isArray(filePaths) ? filePaths : [filePaths];
    } else {
      pathsToImport = Array.from(selectedFiles);
    }

    if (!pathsToImport || pathsToImport.length === 0) {
      toastWarning('No files selected');
      return;
    }

    // Check for duplicates - the DB constraint is on (user_id, filename, doc_type)
    // So we need to find existing files with matching filename (full path) AND doc_type
    // These will be REPLACED with fresh GitHub versions
    const existingFilesMap = new Map(); // "filename|doc_type" -> workspace file id
    workspaceFiles.forEach(f => {
      const key = `${f.filename}|${f.doc_type}`;
      existingFilesMap.set(key, f.id);
    });

    const filesToReplace = [];
    pathsToImport.forEach(path => {
      if (typeof path === 'string') {
        // Use full path as filename (matches how we save files)
        const key = `${path}|${defaultDocType}`;
        if (existingFilesMap.has(key)) {
          filesToReplace.push({
            path,
            filename: path,
            existingId: existingFilesMap.get(key)
          });
        }
      }
    });

    // Show info if replacing files
    if (filesToReplace.length > 0) {
      toastInfo(`Refreshing ${filesToReplace.length} existing file${filesToReplace.length !== 1 ? 's' : ''} from GitHub`);
    }

    // Initialize progress
    setImporting(true);
    setImportProgress({
      total: pathsToImport.length,
      completed: 0,
      failed: 0,
      currentFile: '',
      isComplete: false
    });
    setImportErrors([]);

    try {
      // Call batch endpoint
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      // Delete existing files that will be replaced (in parallel)
      if (filesToReplace.length > 0) {
        await Promise.all(
          filesToReplace.map(({ existingId }) =>
            fetch(`${import.meta.env.VITE_API_URL}/api/workspace/${existingId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': token ? `Bearer ${token}` : ''
              }
            }).catch(err => {
              console.warn(`[GitHubLoadModal] Failed to delete existing file ${existingId}:`, err);
              // Continue anyway - the POST might fail with duplicate error but that's ok
            })
          )
        );
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/github/files-batch`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          owner: repository.owner,
          repo: repository.repo,
          paths: pathsToImport,
          branch: repository.branch
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle 403 feature gate errors specially (show in banner, not toast)
        if (response.status === 403) {
          setBatchImportError({
            message: errorData.message || 'Feature not available',
            currentTier: errorData.currentTier || effectiveTier,
            effectiveTier: errorData.effectiveTier || effectiveTier,
            recommendedTier: errorData.recommendedTier || 'pro'
          });
          setImporting(false);
          setImportProgress({
            total: 0,
            completed: 0,
            failed: 0,
            currentFile: '',
            isComplete: false
          });
          return;
        }

        throw new Error(errorData.message || 'Batch import failed');
      }

      const batchResult = await response.json();

      // Process results and add to workspace
      const errors = [];
      let successCount = 0;

      // Load workspace contents once at the start (user-scoped)
      // Format: { files: { fileId: content, ... } }
      const workspaceKey = getWorkspaceKey(user.id);
      let workspaceContents = {};
      if (workspaceKey) {
        try {
          const stored = localStorage.getItem(workspaceKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            // Handle both old flat format and new nested format
            workspaceContents = parsed.files || parsed;
          }
        } catch (error) {
          console.error('[GitHubLoadModal] Failed to load workspace contents:', error);
          workspaceContents = {};
        }

        // Remove content for files being replaced
        filesToReplace.forEach(({ existingId }) => {
          delete workspaceContents[existingId];
        });
      }

      for (let i = 0; i < batchResult.results.length; i++) {
        const result = batchResult.results[i];

        setImportProgress(prev => ({
          ...prev,
          completed: i + 1,
          currentFile: result.path
        }));

        if (result.success) {
          // Add to workspace
          try {
            const workspaceResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/workspace`, {
              method: 'POST',
              headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                // Use full path as filename to support same-named files in different directories
                // e.g., "src/utils/index.js" and "src/components/index.js" are different files
                filename: result.data.path,
                language: result.data.language,
                fileSizeBytes: result.data.size,
                docType: defaultDocType, // Use doc type from ControlBar
                origin: 'github',
                github: {
                  repo: `${repository.owner}/${repository.repo}`,
                  path: result.data.path,
                  sha: result.data.sha,
                  branch: repository.branch
                }
              })
            });

            if (workspaceResponse.ok) {
              const workspaceData = await workspaceResponse.json();

              // Add code content to localStorage object (privacy: content never goes to DB)
              if (workspaceData.success && workspaceData.file && result.data.content) {
                workspaceContents[workspaceData.file.id] = result.data.content;
              }

              successCount++;
            } else {
              const errorData = await workspaceResponse.json();
              errors.push({
                path: result.path,
                filename: result.data?.name || result.path.split('/').pop(),
                error: errorData.error || 'Failed to add to workspace',
                stage: 'workspace'
              });
            }
          } catch (err) {
            errors.push({
              path: result.path,
              filename: result.data?.name || result.path.split('/').pop(),
              error: `Network error: ${err.message}`,
              stage: 'workspace'
            });
          }
        } else {
          // GitHub fetch failed
          errors.push({
            path: result.path,
            filename: result.path.split('/').pop(),
            error: result.error || 'Failed to fetch from GitHub',
            stage: 'github'
          });
        }
      }

      // Save all workspace contents at once (user-scoped)
      // Use new nested format: { files: { fileId: content, ... } }
      if (workspaceKey) {
        try {
          localStorage.setItem(workspaceKey, JSON.stringify({ files: workspaceContents }));
        } catch (error) {
          console.error('[GitHubLoadModal] Failed to save workspace contents:', error);
          if (error.name === 'QuotaExceededError') {
            console.warn('[GitHubLoadModal] localStorage quota exceeded');
          }
        }
      }

      // Update progress to complete
      setImportProgress(prev => ({
        ...prev,
        failed: errors.length,
        isComplete: true,
        currentFile: ''
      }));

      setImportErrors(errors);

      // Show results
      if (successCount > 0) {
        toastSuccess(`Successfully imported ${successCount} file${successCount !== 1 ? 's' : ''}`);

        // Add repository to recent files (for batch imports, track the repo not individual files)
        console.log('[GitHubLoadModal] Adding repo to recent:', `${repository.owner}/${repository.repo}`);
        githubService.addRecentFile({
          owner: repository.owner,
          repo: repository.repo,
          path: '', // Empty path indicates this is a repo-level entry
          name: `${repository.owner}/${repository.repo}`, // Show full repo name
          language: 'repository', // Special marker for repo entries
          isRepo: true, // Flag to indicate this is a repo, not a file
          fileCount: successCount, // Track how many files were imported
          isPrivate: repository.isPrivate
        }, user?.id);
        // Update recent files state immediately
        setRecentFiles(githubService.getRecentFiles(user?.id));

        // Notify parent to refresh workspace
        if (onFilesLoad) {
          onFilesLoad();
        }
      }

      if (errors.length > 0) {
        // Pass errors to parent for persistent display in sidebar
        if (onImportErrors) {
          onImportErrors(errors);
        }
      }

      // Clear selection
      setSelectedFiles(new Set());

    } catch (err) {
      console.error('Batch import error:', err);
      // Don't show toast for network/API errors - these should be handled by banner
      setBatchImportError({
        message: err.message || 'Batch import failed',
        currentTier: effectiveTier,
        effectiveTier: effectiveTier
      });
      setImporting(false);
      setImportProgress({
        total: 0,
        completed: 0,
        failed: 0,
        currentFile: '',
        isComplete: false
      });
    }
  };

  // Retry failed imports
  const handleRetryImport = (paths) => {
    setShowErrorList(false);
    handleBatchImport(paths);
  };

  // Show error list even if main modal is closed
  if (!isOpen && !showErrorList) return null;

  return (
    <>
      {/* Import Error List Modal - shown even after main modal closes */}
      {showErrorList && (
        <ImportErrorList
          errors={importErrors}
          onRetry={handleRetryImport}
          onClose={() => {
            setShowErrorList(false);
            // Don't call onClose here - main modal is already closed
          }}
        />
      )}

      {/* Main Modal - only show if isOpen */}
      {!isOpen ? null : (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 cursor-default"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{ cursor: 'default' }}
      >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-none lg:rounded-2xl shadow-2xl w-screen h-screen lg:w-[92vw] xl:w-[94vw] 2xl:w-[95vw] lg:h-[95vh] lg:max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] flex flex-col cursor-default"
        role="dialog"
        aria-modal="true"
        aria-labelledby="github-modal-title"
        style={{ cursor: 'default' }}
      >
        {/* Header - Compact */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 id="github-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Import from GitHub
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* GitHub Connection Banner - Only show for users without GitHub OAuth */}
        {!repository && !user?.has_github_private_access && showGitHubBanner && (
          <div className="mx-4 mt-3">
            <div className="relative p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              {/* Dismiss button - top right corner */}
              <button
                type="button"
                onClick={() => setShowGitHubBanner(false)}
                className="absolute top-3 right-3 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md p-1 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Content - Horizontal layout: Icon + Text (left) | Button (right) */}
              <div className="flex items-start gap-4 pr-8">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Limited access without GitHub connection
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                    Currently viewing public repositories only, limited to 300 per organization. Connect your GitHub account to access private repositories and browse unlimited.
                  </p>
                </div>

                {/* CTA Button - Right side, bottom aligned */}
                <div className="flex-shrink-0 hidden sm:block self-end">
                  <a
                    href={`${import.meta.env.VITE_API_URL}/api/auth/github?returnTo=${encodeURIComponent(window.location.pathname)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    Connect GitHub
                  </a>
                </div>
              </div>

              {/* Mobile: Button below on small screens */}
              <div className="sm:hidden mt-3 pl-9">
                <a
                  href={`${import.meta.env.VITE_API_URL}/api/auth/github?returnTo=${encodeURIComponent(window.location.pathname)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  Connect GitHub
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner - Compact */}
        {error && !repository && !loading && (
          <div className="px-4 pt-3 pb-1">
            <ErrorBanner error={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Input Section - Unified smart input */}
        <div className={`${error && !repository && !loading ? 'px-4 pb-4 pt-0' : 'px-4 py-3'} border-b border-slate-200 dark:border-slate-700`}>
          <div className="relative">
            <SmartInput
              ref={smartInputRef}
              value={input}
              onChange={handleInputChange}
              onSubmit={handleLoadRepository}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onClear={handleInputClear}
              loading={loading || loadingOwnerRepos}
              fieldError={fieldError}
            />

            {/* Recent Repos Dropdown - Chrome-style auto-show on focus */}
            {showRecentDropdown && filteredRecentRepos.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 max-h-64 overflow-y-auto">
                {filteredRecentRepos.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentFileClick(recent)}
                    disabled={loading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {recent.isPrivate ? (
                      <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    )}
                    <div className="flex-1 min-w-0 flex items-baseline gap-2">
                      <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
                        {recent.owner}/{recent.repo}
                      </span>
                      {recent.isRepo && recent.fileCount && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          ({recent.fileCount} file{recent.fileCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tabs - Only visible on mobile when repository is loaded */}
        {repository && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex">
              <button
                type="button"
                onClick={() => setMobileActiveTab('tree')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  mobileActiveTab === 'tree'
                    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>File Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileActiveTab('preview')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  mobileActiveTab === 'preview'
                    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loadingOwnerRepos ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading repositories...</p>
              </div>
            </div>
          ) : ownerRepositories.length > 0 ? (
            <div className="h-full flex flex-col px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Repositories for <span className="text-purple-600 dark:text-purple-400">{ownerName}</span>
                    </p>
                    <a
                      href={`https://github.com/${ownerName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      title={`View ${ownerName} on GitHub`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">GitHub</span>
                    </a>
                    {loadingMoreRepos && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Loading more...</span>
                      </div>
                    )}
                  </div>
                  {filteredOwnerRepos.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Showing {startIndex}-{endIndex} of {filteredOwnerRepos.length}{loadingMoreRepos ? '+' : ''}{ownerRepoMetadata.hasMore && !ownerRepoMetadata.isAuthenticated && filteredOwnerRepos.length >= 300 ? '+ (limited to 300 public)' : ''} repositories
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInput('');
                    handleInputClear();
                  }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0"
                >
                  Clear
                </button>
              </div>

              {/* Search repos */}
              {ownerRepositories.length > 5 && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={repoSearchTerm}
                    onChange={(e) => setRepoSearchTerm(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors"
                  />
                </div>
              )}

              {/* Repository list */}
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {paginatedRepos.map((repo) => (
                  <button
                    key={repo.fullName}
                    type="button"
                    onClick={() => handleOwnerRepoSelect(repo)}
                    className="w-full flex items-start gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      {repo.isPrivate ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {repo.name}
                        </span>
                        {repo.language && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
                  <button
                    type="button"
                    onClick={() => setRepoCurrentPage(p => Math.max(1, p - 1))}
                    disabled={repoCurrentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first, last, current, and adjacent pages
                        return page === 1 ||
                               page === totalPages ||
                               Math.abs(page - repoCurrentPage) <= 1;
                      })
                      .map((page, idx, arr) => (
                        <div key={page} className="flex items-center">
                          {/* Add ellipsis for gaps */}
                          {idx > 0 && page > arr[idx - 1] + 1 && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setRepoCurrentPage(page)}
                            className={`min-w-[32px] px-2 py-1 text-sm font-medium rounded transition-colors ${
                              page === repoCurrentPage
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRepoCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={repoCurrentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading repository...</p>
              </div>
            </div>
          ) : repository ? (
            <div className="h-full flex flex-col lg:flex-row">
              {/* File Tree - Hidden on mobile when preview tab is active */}
              <div className={`lg:w-2/5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full lg:h-full ${
                mobileActiveTab === 'preview' ? 'hidden lg:flex' : ''
              }`}>
                {/* Pro Feature Hint for Free/Starter users */}
                {!canUseBatchProcessing && showProHint && (
                  <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <p className="text-xs font-medium text-purple-900 dark:text-purple-100 truncate">
                          Import multiple files with Pro
                        </p>
                        <a
                          href="/pricing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 flex items-center gap-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:underline"
                        >
                          <span>Upgrade</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowProHint(false)}
                        className="flex-shrink-0 text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <FileTree
                  tree={repository.tree}
                  onFileSelect={handleFileSelect}
                  onFileClick={handleFileClick}
                  selectedFile={selectedFile}
                  repository={repository}
                  expandedPaths={expandedPaths}
                  onToggleFolder={toggleFolder}
                  onExpandAll={handleExpandAll}
                  onCollapseAll={handleCollapseAll}
                  branches={branches}
                  onBranchChange={handleBranchChange}
                  loadingBranchSwitch={loadingBranchSwitch}
                  multiSelectMode={canUseBatchProcessing}
                  selectedFiles={selectedFiles}
                  onToggleFileSelection={canUseBatchProcessing ? handleToggleFileSelection : undefined}
                  onClearSelection={handleDeselectAllFiles}
                  onSelectAll={canUseBatchProcessing ? handleSelectAllFiles : undefined}
                  supportedFileCount={supportedFileCount}
                  maxFiles={maxFiles}
                  onExtensionFiltersChange={(extensions, mode) => setExtensionFilters({ extensions, mode })}
                  searchInputRef={fileTreeSearchRef}
                />
              </div>

              {/* File Preview - Hidden on mobile when tree tab is active */}
              <div className={`h-full lg:h-full lg:flex-1 overflow-hidden flex flex-col ${
                mobileActiveTab === 'tree' ? 'hidden lg:flex' : ''
              }`}>
                {/* Batch Import Error Banner (403/feature gate errors) */}
                {batchImportError && (
                  <div className="p-4 pb-0">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 border-l-4 border-l-red-500 dark:border-l-red-400 rounded-lg shadow-sm">
                      <div className="flex items-start gap-4 p-4">
                        {/* Error Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                        </div>

                        {/* Error Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                            {batchImportError.message}
                          </h3>
                          {batchImportError.recommendedTier && (
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              <a
                                href="/pricing"
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-1 rounded"
                              >
                                Upgrade to <strong className="capitalize">{batchImportError.recommendedTier}</strong>
                              </a>{' '}
                              to access batch import.
                            </p>
                          )}
                        </div>

                        {/* Dismiss Button */}
                        <button
                          type="button"
                          onClick={() => setBatchImportError(null)}
                          className="flex-shrink-0 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2"
                          aria-label="Dismiss error"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner for file preview errors */}
                {filePreviewError && (
                  <div className="p-4 pb-0">
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
        {repository ? (
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
            {canUseBatchProcessing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleBatchImport()}
                  disabled={importing || selectedFiles.size === 0}
                  title={selectedFiles.size > 0 ? `Import ${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''}` : 'Select files to import'}
                  className="min-w-[120px]"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>Import {selectedFiles.size > 0 ? `${selectedFiles.size} ` : ''}File{selectedFiles.size !== 1 ? 's' : ''}</>
                  )}
                </Button>
              </>
            ) : (
              <>
                {(() => {
                  const MAX_FILE_SIZE = 100 * 1024; // 100KB
                  const isFileTooLarge = filePreview?.size > MAX_FILE_SIZE;
                  const fileSupport = filePreview ? isFileSupported(filePreview.name) : null;
                  const isUnsupported = fileSupport && !fileSupport.isSupported;
                  const canLoad = filePreview && !isFileTooLarge && !isUnsupported;

                  return canLoad ? (
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
                      Close
                    </Button>
                  );
                })()}
              </>
            )}
          </div>
        ) : (
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        )}
      </div>
      </div>
      )}
    </>
  );
}
