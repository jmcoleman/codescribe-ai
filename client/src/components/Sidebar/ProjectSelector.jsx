import { useState, useEffect, useRef } from 'react';
import { FolderOpen, Plus, Check, Loader2, ChevronDown, X } from 'lucide-react';
import * as projectsApi from '../../services/projectsApi';
import { toastCompact } from '../../utils/toastWithHistory';

/**
 * ProjectSelector Component
 *
 * Dropdown for selecting or creating a project to associate with batch generation.
 * Displayed in the Sidebar for Pro+ users with project management feature.
 *
 * Features:
 * - "No Project" option as default (no graph context used)
 * - List existing projects
 * - Create new project inline
 *
 * Part of: Graph Engine API (Epic 5.4) - Phase 4: Frontend Integration
 *
 * @param {Object} props
 * @param {number|null} props.selectedProjectId - Currently selected project ID (null = no project)
 * @param {Function} props.onProjectChange - Called when project selection changes
 * @param {string} [props.size='small'] - Size variant ('small' or 'default')
 */
export function ProjectSelector({
  selectedProjectId,
  onProjectChange,
  size = 'small'
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowCreateForm(false);
        setNewProjectName('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when create form opens
  useEffect(() => {
    if (showCreateForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateForm]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const result = await projectsApi.getProjects({ limit: 100 });
      setProjects(result.projects || []);
    } catch (err) {
      console.error('[ProjectSelector] Failed to load projects:', err);
      // Silent fail - projects are optional
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
        setProjects(prev => [result.project, ...prev]);
        onProjectChange(result.project.id);
        setShowCreateForm(false);
        setNewProjectName('');
        setIsOpen(false);
        toastCompact('Project created', 'success');
      }
    } catch (err) {
      console.error('[ProjectSelector] Failed to create project:', err);
      toastCompact(err.message || 'Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (projectId) => {
    onProjectChange(projectId);
    setIsOpen(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const sizeClasses = size === 'small'
    ? 'text-xs py-1.5 px-2'
    : 'text-sm py-2 px-3';

  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white dark:bg-slate-700
          border border-slate-200 dark:border-slate-600
          rounded-lg
          hover:border-slate-300 dark:hover:border-slate-500
          focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses}
        `}
        aria-label="Select project"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <FolderOpen className={`${iconSize} text-slate-400 dark:text-slate-500 flex-shrink-0`} />
          <span className={`truncate ${selectedProject ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
            {loading ? 'Loading...' : (selectedProject ? selectedProject.name : 'No Project')}
          </span>
        </span>
        <ChevronDown className={`${iconSize} text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Create new project form */}
          {showCreateForm ? (
            <div className="p-2 border-b border-slate-100 dark:border-slate-600">
              <div className="flex gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      handleCreateProject();
                    } else if (e.key === 'Escape') {
                      setShowCreateForm(false);
                      setNewProjectName('');
                    }
                  }}
                  placeholder="Project name"
                  className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={creating}
                />
                <button
                  type="button"
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creating}
                  className="p-1 text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed rounded transition-colors"
                  aria-label="Create project"
                >
                  {creating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProjectName('');
                  }}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  aria-label="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-slate-100 dark:border-slate-600"
            >
              <Plus className="w-3 h-3" />
              New project
            </button>
          )}

          {/* Project list */}
          <div className="max-h-48 overflow-y-auto">
            {/* No Project option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-xs text-left
                hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors
                ${selectedProjectId === null ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
              `}
              role="option"
              aria-selected={selectedProjectId === null}
            >
              {selectedProjectId === null && (
                <Check className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              )}
              <span className={`truncate ${selectedProjectId === null ? 'text-purple-600 dark:text-purple-400 font-medium ml-0' : 'text-slate-600 dark:text-slate-300 ml-5'}`}>
                No Project
              </span>
            </button>

            {/* Project items */}
            {projects.map(project => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelect(project.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-xs text-left
                  hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors
                  ${selectedProjectId === project.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
                `}
                role="option"
                aria-selected={selectedProjectId === project.id}
              >
                {selectedProjectId === project.id && (
                  <Check className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                )}
                <span className={`truncate ${selectedProjectId === project.id ? 'text-purple-600 dark:text-purple-400 font-medium ml-0' : 'text-slate-700 dark:text-slate-200 ml-5'}`}>
                  {project.name}
                </span>
              </button>
            ))}

            {/* Empty state */}
            {projects.length === 0 && !loading && (
              <div className="px-3 py-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                No projects yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectSelector;
