import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Plus, Check, Loader2, ChevronDown, X, ExternalLink } from 'lucide-react';
import * as projectsApi from '../../services/projectsApi';
import { getGraphByProjectId } from '../../services/graphApi';
import { toastCompact } from '../../utils/toastWithHistory';

/**
 * Format relative time (e.g., "2h ago", "in 3d")
 */
function formatRelativeTime(date) {
  if (!date) return null;

  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 0) {
    // Past
    const absMins = Math.abs(diffMins);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);

    if (absMins < 60) return `${absMins}m ago`;
    if (absHours < 24) return `${absHours}h ago`;
    return `${absDays}d ago`;
  } else {
    // Future
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    return `in ${diffDays}d`;
  }
}

/**
 * ProjectSelector Component
 *
 * Dropdown for selecting or creating a project to associate with batch generation.
 * Displayed in the Sidebar for Pro+ users with project management feature.
 *
 * Features:
 * - "No Project" option as default (no graph context used)
 * - List existing projects with graph status (two-line items)
 * - Create new project inline
 *
 * Part of: Graph Engine API (Epic 5.4) - Phase 4: Frontend Integration
 *
 * @param {Object} props
 * @param {number|null} props.selectedProjectId - Currently selected project ID (null = no project)
 * @param {Function} props.onProjectChange - Called when project selection changes (receives id, name)
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

  // Graph info for all projects (keyed by project ID)
  const [projectGraphs, setProjectGraphs] = useState({});
  const [graphsLoading, setGraphsLoading] = useState(false);

  // Graph info for selected project (for status badge)
  const [selectedGraphInfo, setSelectedGraphInfo] = useState(null);
  const [selectedGraphLoading, setSelectedGraphLoading] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Fetch graph info for selected project (for status badge display)
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedGraphInfo(null);
      return;
    }

    let cancelled = false;

    async function fetchSelectedGraphInfo() {
      setSelectedGraphLoading(true);

      try {
        const result = await getGraphByProjectId(selectedProjectId);
        if (cancelled) return;

        if (result.success && result.graph) {
          setSelectedGraphInfo(result.graph);
        } else {
          setSelectedGraphInfo(null);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[ProjectSelector] Error fetching selected graph:', err);
        setSelectedGraphInfo(null);
      } finally {
        if (!cancelled) {
          setSelectedGraphLoading(false);
        }
      }
    }

    fetchSelectedGraphInfo();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  // Fetch graph info for all projects when dropdown opens
  useEffect(() => {
    if (!isOpen || projects.length === 0) return;

    let cancelled = false;

    async function fetchAllGraphs() {
      setGraphsLoading(true);

      const graphsMap = {};

      // Fetch graphs in parallel
      await Promise.all(
        projects.map(async (project) => {
          try {
            const result = await getGraphByProjectId(project.id);
            if (!cancelled && result.success && result.graph) {
              graphsMap[project.id] = result.graph;
            }
          } catch (err) {
            // Silent fail for individual projects
            console.error(`[ProjectSelector] Error fetching graph for project ${project.id}:`, err);
          }
        })
      );

      if (!cancelled) {
        setProjectGraphs(graphsMap);
        setGraphsLoading(false);
      }
    }

    fetchAllGraphs();

    return () => {
      cancelled = true;
    };
  }, [isOpen, projects]);

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
        onProjectChange(result.project.id, result.project.name);
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

  const handleSelect = (projectId, projectName = null) => {
    onProjectChange(projectId, projectName);
    setIsOpen(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const sizeClasses = size === 'small'
    ? 'text-xs py-1.5 px-2'
    : 'text-sm py-2 px-3';

  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  // Get graph status info for a project
  const getGraphStatus = (projectId) => {
    const graph = projectGraphs[projectId];
    if (!graph) {
      return { status: 'none', label: 'No graph' };
    }

    const expiresAt = graph.expiresAt;
    const isExpired = expiresAt && new Date(expiresAt) < new Date();
    const fileCount = graph.stats?.totalFiles || 0;

    if (isExpired) {
      return { status: 'expired', label: `${fileCount} files • Expired`, fileCount };
    }

    const expiresIn = formatRelativeTime(expiresAt);
    return { status: 'active', label: `${fileCount} files • Expires ${expiresIn}`, fileCount };
  };

  // Selected project graph status (for badge)
  const selectedHasGraph = selectedGraphInfo !== null;
  const selectedIsExpired = selectedGraphInfo?.expiresAt && new Date(selectedGraphInfo.expiresAt) < new Date();

  // Render status badge for selected project
  const renderStatusBadge = () => {
    if (!selectedProjectId) return null;

    if (selectedGraphLoading) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
          ...
        </span>
      );
    }
    if (!selectedHasGraph) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
          No Graph
        </span>
      );
    }
    if (selectedIsExpired) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
          Expired
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
        Active
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector row: Button + View Details link */}
      <div className="flex items-center gap-1">
        {/* Selector Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={`
            flex-1 flex items-center justify-between gap-2
            bg-white dark:bg-slate-700
            border border-slate-200 dark:border-slate-600
            rounded-lg
            hover:border-slate-300 dark:hover:border-slate-500
            focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            min-w-0
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
          <span className="flex items-center gap-1.5">
            {renderStatusBadge()}
            <ChevronDown className={`${iconSize} text-slate-400 flex-shrink-0 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {/* View Project Details link - only when project is selected */}
        {selectedProjectId && (
          <Link
            to={`/projects/${selectedProjectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors flex-shrink-0"
            aria-label="View project details (opens in new tab)"
            title="View project details (opens in new tab)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-72 overflow-hidden">
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
                  className="p-1 text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
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

          {/* Loading indicator for graphs */}
          {graphsLoading && (
            <div className="px-3 py-1.5 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading graph info...
            </div>
          )}

          {/* Project list */}
          <div className="max-h-56 overflow-y-auto">
            {/* No Project option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`
                w-full flex items-start gap-2 px-3 py-2 text-left
                hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors
                ${selectedProjectId === null ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
              `}
              role="option"
              aria-selected={selectedProjectId === null}
            >
              <div className="w-3 h-3 flex-shrink-0 mt-0.5">
                {selectedProjectId === null && (
                  <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs truncate ${selectedProjectId === null ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                  No Project
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  Generate without graph context
                </div>
              </div>
            </button>

            {/* Project items - two-line layout */}
            {projects.map(project => {
              const graphStatus = getGraphStatus(project.id);
              const isSelected = selectedProjectId === project.id;

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSelect(project.id, project.name)}
                  className={`
                    w-full flex items-start gap-2 px-3 py-2 text-left
                    hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors
                    ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="w-3 h-3 flex-shrink-0 mt-0.5">
                    {isSelected && (
                      <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${isSelected ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-slate-700 dark:text-slate-200'}`}>
                      {project.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {graphsLoading ? '...' : graphStatus.label}
                    </div>
                  </div>
                </button>
              );
            })}

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
