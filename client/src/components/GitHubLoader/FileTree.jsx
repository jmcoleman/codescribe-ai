/**
 * File Tree Component
 * Collapsible tree view for repository files
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, File, Star, GitBranch, Search, AlertCircle, Check } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import { isFileSupported } from '../../services/githubService';

export function FileTree({
  tree,
  onFileSelect,
  onFileClick, // New: handles clicks with keyboard modifiers (Ctrl/Cmd, Shift)
  selectedFile,
  repository,
  expandedPaths,
  onToggleFolder,
  branches,
  onBranchChange,
  // Multi-select props
  multiSelectMode = false,
  selectedFiles = new Set(),
  onToggleFileSelection,
  onClearSelection,
  // Focus control
  searchInputRef
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedFileRef = useRef(null);

  const toggleFolder = (path) => {
    onToggleFolder(path);
  };

  // Scroll selected file into view
  useEffect(() => {
    if (selectedFile && selectedFileRef.current) {
      // Delay to ensure folder expansion and DOM updates complete before scrolling
      setTimeout(() => {
        selectedFileRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 400);
    }
  }, [selectedFile]);

  // Auto-expand folders when searching
  useEffect(() => {
    if (searchTerm) {
      const pathsToExpand = new Set();
      const collectMatchingPaths = (items) => {
        items.forEach((item) => {
          if (item.type === 'tree' && item.children) {
            const hasMatch = item.children.some((child) => {
              if (child.type === 'blob') {
                return child.name.toLowerCase().includes(searchTerm.toLowerCase());
              } else if (child.type === 'tree' && child.children) {
                collectMatchingPaths([child]);
                return pathsToExpand.has(child.path);
              }
              return false;
            });
            if (hasMatch) {
              pathsToExpand.add(item.path);
            }
            collectMatchingPaths(item.children);
          }
        });
      };
      collectMatchingPaths(tree);

      // Expand all paths that have matches
      pathsToExpand.forEach(path => {
        if (!expandedPaths.has(path)) {
          onToggleFolder(path);
        }
      });
    }
  }, [searchTerm, tree]);

  const filterTree = (items, term) => {
    if (!term) return items;

    return items.reduce((acc, item) => {
      if (item.type === 'tree' && item.children) {
        const filteredChildren = filterTree(item.children, term);
        if (filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren });
        }
      } else if (item.type === 'blob') {
        if (item.name.toLowerCase().includes(term.toLowerCase())) {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  };

  const filteredTree = filterTree(tree, searchTerm);

  return (
    <div className="h-full flex flex-col">
      {/* Repository Header - Compact */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {repository.owner}/{repository.repo}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            {branches && branches.length > 0 ? (
              <Listbox value={repository.branch} onChange={onBranchChange}>
                <div className="relative">
                  <Listbox.Button className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <GitBranch className="w-3 h-3" />
                    <span className="text-xs">{repository.branch}</span>
                    <ChevronDown className="w-2.5 h-2.5" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute right-0 mt-1 w-48 max-h-60 overflow-auto rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 py-1">
                    {branches.map((branch) => (
                      <Listbox.Option
                        key={branch.name}
                        value={branch.name}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                              : 'text-slate-900 dark:text-slate-100'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate text-sm ${selected ? 'font-medium' : 'font-normal'}`}>
                              {branch.name}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600 dark:text-purple-400">
                                <Check className="w-4 h-4" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            ) : (
              <div className="flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                <span className="text-xs">{repository.branch}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search - Compact */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors"
          />
        </div>
      </div>

      {/* Selection Status Bar (multi-select mode only) */}
      {multiSelectMode && (
        <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between">
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
            {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
          </span>
          {selectedFiles.size > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Tree - Maximized for height */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filteredTree.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            {searchTerm ? 'No files match your search' : 'No files found'}
          </div>
        ) : (
          <TreeNode
            items={filteredTree}
            onFileSelect={onFileSelect}
            onFileClick={onFileClick}
            selectedFile={selectedFile}
            selectedFileRef={selectedFileRef}
            expandedPaths={expandedPaths}
            toggleFolder={toggleFolder}
            multiSelectMode={multiSelectMode}
            selectedFiles={selectedFiles}
            onToggleFileSelection={onToggleFileSelection}
            level={0}
          />
        )}
      </div>

      {/* Stats - Compact */}
      <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        {searchTerm ? (
          <span>{countFiles(filteredTree)} files found</span>
        ) : (
          <span>{repository.totalItems} items</span>
        )}
      </div>
    </div>
  );
}

function TreeNode({
  items,
  onFileSelect,
  onFileClick, // New: handles clicks with keyboard modifiers
  selectedFile,
  selectedFileRef,
  expandedPaths,
  toggleFolder,
  multiSelectMode,
  selectedFiles,
  onToggleFileSelection,
  level
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isExpanded = expandedPaths.has(item.path);
        const isSingleSelected = selectedFile?.path === item.path;
        const isMultiSelected = multiSelectMode && selectedFiles.has(item.path);
        const isFolder = item.type === 'tree';

        // Check if file is supported
        const fileSupport = !isFolder ? isFileSupported(item.name) : { isSupported: true };
        const isUnsupported = !isFolder && !fileSupport.isSupported;

        return (
          <div key={item.path}>
            <div className="flex items-center gap-2">
              {/* Checkbox for multi-select mode */}
              {multiSelectMode && !isFolder && (
                <div
                  className="flex-shrink-0"
                  style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                  <input
                    type="checkbox"
                    checked={isMultiSelected}
                    disabled={isUnsupported}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (!isUnsupported && onToggleFileSelection) {
                        onToggleFileSelection(item.path);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === ' ') {
                        e.preventDefault();
                        if (!isUnsupported && onToggleFileSelection) {
                          onToggleFileSelection(item.path);
                        }
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Select ${item.name}`}
                  />
                </div>
              )}

              <button
                ref={isSingleSelected ? selectedFileRef : null}
                onClick={(e) => {
                  if (isFolder) {
                    toggleFolder(item.path);
                  } else {
                    // If onFileClick is provided, use it (supports keyboard modifiers)
                    // Otherwise fall back to onFileSelect
                    if (onFileClick) {
                      onFileClick(item, e);
                    } else {
                      onFileSelect(item);
                    }
                  }
                }}
                className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  isSingleSelected
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : isMultiSelected
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : isUnsupported
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                style={{ paddingLeft: multiSelectMode && !isFolder ? '0px' : `${level * 12 + 8}px` }}
                title={isUnsupported ? fileSupport.reason : undefined}
              >
                {isFolder ? (
                  <>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    )}
                    <Folder className="w-4 h-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                  </>
                ) : (
                  <>
                    {!multiSelectMode && <div className="w-4" />} {/* Spacer for single-select mode */}
                    {isUnsupported ? (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                    ) : (
                      <File className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    )}
                  </>
                )}
                <span className="truncate">{item.name}</span>
                {!isFolder && item.size && (
                  <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
                    {formatBytes(item.size)}
                  </span>
                )}
              </button>
            </div>

            {isFolder && isExpanded && item.children && (
              <TreeNode
                items={item.children}
                onFileSelect={onFileSelect}
                onFileClick={onFileClick}
                selectedFile={selectedFile}
                selectedFileRef={selectedFileRef}
                expandedPaths={expandedPaths}
                toggleFolder={toggleFolder}
                multiSelectMode={multiSelectMode}
                selectedFiles={selectedFiles}
                onToggleFileSelection={onToggleFileSelection}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
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

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function countFiles(items) {
  return items.reduce((count, item) => {
    if (item.type === 'blob') {
      return count + 1;
    } else if (item.children) {
      return count + countFiles(item.children);
    }
    return count;
  }, 0);
}
