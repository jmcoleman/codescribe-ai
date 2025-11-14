/**
 * File Tree Component
 * Collapsible tree view for repository files
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, File, Star, GitBranch, Search, AlertCircle, Check } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import { isFileSupported } from '../../services/githubService';

export function FileTree({ tree, onFileSelect, selectedFile, repository, expandedPaths, onToggleFolder, branches, onBranchChange }) {
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
      {/* Repository Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {repository.owner}/{repository.repo}
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              <span>{formatNumber(repository.stars)}</span>
            </div>
            {branches && branches.length > 0 ? (
              <Listbox value={repository.branch} onChange={onBranchChange}>
                <div className="relative">
                  <Listbox.Button className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{repository.branch}</span>
                    <ChevronDown className="w-3 h-3" />
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
                <GitBranch className="w-3.5 h-3.5" />
                <span>{repository.branch}</span>
              </div>
            )}
          </div>
        </div>
        {repository.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
            {repository.description}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredTree.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            {searchTerm ? 'No files match your search' : 'No files found'}
          </div>
        ) : (
          <TreeNode
            items={filteredTree}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            selectedFileRef={selectedFileRef}
            expandedPaths={expandedPaths}
            toggleFolder={toggleFolder}
            level={0}
          />
        )}
      </div>

      {/* Stats */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        {searchTerm ? (
          <span>{countFiles(filteredTree)} files found</span>
        ) : (
          <span>{repository.totalItems} items total</span>
        )}
      </div>
    </div>
  );
}

function TreeNode({ items, onFileSelect, selectedFile, selectedFileRef, expandedPaths, toggleFolder, level }) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isExpanded = expandedPaths.has(item.path);
        const isSelected = selectedFile?.path === item.path;
        const isFolder = item.type === 'tree';

        // Check if file is supported
        const fileSupport = !isFolder ? isFileSupported(item.name) : { isSupported: true };
        const isUnsupported = !isFolder && !fileSupport.isSupported;

        return (
          <div key={item.path}>
            <button
              ref={isSelected ? selectedFileRef : null}
              onClick={() => {
                if (isFolder) {
                  toggleFolder(item.path);
                } else {
                  onFileSelect(item);
                }
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : isUnsupported
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
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
                  <div className="w-4" /> {/* Spacer */}
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

            {isFolder && isExpanded && item.children && (
              <TreeNode
                items={item.children}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                selectedFileRef={selectedFileRef}
                expandedPaths={expandedPaths}
                toggleFolder={toggleFolder}
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
