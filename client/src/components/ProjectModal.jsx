import { useState, useEffect, useRef, useCallback } from 'react';
import { X, FolderPlus, Check, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import * as projectsApi from '../services/projectsApi';
import { toastCompact } from '../utils/toastWithHistory';

/**
 * ProjectModal Component
 *
 * Modal for selecting or creating a project to associate with batch generation.
 * Used when generating documentation for Pro+ users.
 *
 * Features:
 * - Select existing project from dropdown
 * - Create new project inline
 * - Skip project association (generate without project)
 *
 * Part of: Graph Engine API (Epic 5.4) - Phase 4: Frontend Integration
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Called when modal should close (cancel)
 * @param {Function} props.onConfirm - Called with selected projectId (or null if skipped)
 * @param {number} props.fileCount - Number of files being generated
 */
export function ProjectModal({
  isOpen,
  onClose,
  onConfirm,
  fileCount = 1
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Create new project state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  // Focus input when create form opens
  useEffect(() => {
    if (showCreateForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateForm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showCreateForm) {
          setShowCreateForm(false);
          setNewProjectName('');
        } else if (isDropdownOpen) {
          setIsDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCreateForm, isDropdownOpen, onClose]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await projectsApi.getProjects({ limit: 100 });
      setProjects(result.projects || []);
    } catch (err) {
      console.error('[ProjectModal] Failed to load projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);

    try {
      const result = await projectsApi.createProject({
        name: newProjectName.trim()
      });

      if (result.project) {
        // Add to projects list and select it
        setProjects(prev => [result.project, ...prev]);
        setSelectedProjectId(result.project.id);
        setShowCreateForm(false);
        setNewProjectName('');
        toastCompact('Project created', 'success');
      }
    } catch (err) {
      console.error('[ProjectModal] Failed to create project:', err);
      toastCompact(err.message || 'Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleConfirm = useCallback(() => {
    onConfirm(selectedProjectId);
  }, [selectedProjectId, onConfirm]);

  const handleSkip = useCallback(() => {
    onConfirm(null);
  }, [onConfirm]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
            <FolderPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="project-modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Associate with Project
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Optionally link {fileCount === 1 ? 'this file' : `these ${fileCount} files`} to a project for organized batch history.
          </p>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading projects...</span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Project selection */}
          {!loading && !error && (
            <>
              {/* Dropdown or empty state */}
              {projects.length > 0 && !showCreateForm ? (
                <div className="relative mb-4" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-slate-300 dark:hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors"
                  >
                    <span className={selectedProject ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}>
                      {selectedProject ? selectedProject.name : 'Select a project...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {projects.map(project => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {selectedProjectId === project.id && (
                            <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          )}
                          <span className={`flex-1 truncate ${selectedProjectId === project.id ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-slate-700 dark:text-slate-200'}`}>
                            {project.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Create new project form */}
              {showCreateForm ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    New Project Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newProjectName.trim()) {
                          handleCreateProject();
                        }
                      }}
                      placeholder="My Project"
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={creating}
                    />
                    <button
                      type="button"
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim() || creating}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                    >
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Create
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewProjectName('');
                    }}
                    className="mt-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4"
                >
                  <FolderPlus className="w-4 h-4" />
                  Create new project
                </button>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-700 mt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
            >
              {selectedProjectId ? 'Generate with Project' : 'Generate without Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectModal;
