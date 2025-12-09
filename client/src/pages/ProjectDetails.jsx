import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FolderOpen,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  GitBranch,
  Calendar,
  FileText,
  Layers,
  Clock,
  Trash2,
  Edit3,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageLayout } from '../components/PageLayout.jsx';
import {
  getProjectSummary,
  updateProject,
  deleteProject,
  getProjectBatches
} from '../services/projectsApi.js';
import { getEffectiveTier, hasFeature } from '../utils/tierFeatures.js';
import { toastCompact } from '../utils/toastWithHistory.js';

/**
 * Project Details Page
 *
 * Shows full project information including:
 * - Project metadata (editable)
 * - Graph info (file count, last analyzed, expiry)
 * - Associated batches
 * - Delete option with confirmation
 *
 * Route: /projects/:id
 * Note: Not yet linked from main navigation - access directly via URL
 */

export function ProjectDetails() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { user, isLoading: authLoading } = useAuth();

  // Data state
  const [project, setProject] = useState(null);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGithubUrl, setEditGithubUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Check feature access
  const effectiveTier = user ? getEffectiveTier(user) : 'free';
  const canAccessProjects = hasFeature(effectiveTier, 'projectManagement');

  // Load project data
  const loadProject = useCallback(async (showRefreshIndicator = false) => {
    if (!user || !projectId) return;

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [summaryResult, batchesResult] = await Promise.all([
        getProjectSummary(projectId),
        getProjectBatches(projectId, { limit: 10 })
      ]);

      setProject(summaryResult.project);
      setBatches(batchesResult.batches || []);

      // Initialize edit fields
      if (summaryResult.project) {
        setEditName(summaryResult.project.name || '');
        setEditDescription(summaryResult.project.description || '');
        setEditGithubUrl(summaryResult.project.githubRepoUrl || '');
      }
    } catch (err) {
      console.error('[ProjectDetails] Failed to load project:', err);
      setError(err.message || 'Failed to load project');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, projectId]);

  // Initial load
  useEffect(() => {
    if (!authLoading && user && canAccessProjects) {
      loadProject();
    }
  }, [authLoading, user, canAccessProjects, loadProject]);

  // Handle save edits
  const handleSave = async () => {
    if (!editName.trim()) {
      toastCompact('Project name is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProject(projectId, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        githubRepoUrl: editGithubUrl.trim() || null
      });

      if (result.project) {
        setProject(prev => ({ ...prev, ...result.project }));
        setIsEditing(false);
        toastCompact('Project updated', 'success');
      }
    } catch (err) {
      console.error('[ProjectDetails] Failed to update project:', err);
      toastCompact(err.message || 'Failed to update project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (deleteConfirmText !== project?.name) {
      toastCompact('Please type the project name to confirm', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      toastCompact('Project deleted', 'success');
      navigate('/projects');
    } catch (err) {
      console.error('[ProjectDetails] Failed to delete project:', err);
      toastCompact(err.message || 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(project?.name || '');
    setEditDescription(project?.description || '');
    setEditGithubUrl(project?.githubRepoUrl || '');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    return formatDate(dateString);
  };

  // Auth loading state
  if (authLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <FolderOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Sign in to view project
          </h1>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </PageLayout>
    );
  }

  // Feature not available for tier
  if (!canAccessProjects) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <FolderOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Projects require Pro plan
          </h1>
          <button
            onClick={() => navigate('/settings?tab=subscription')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      </PageLayout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {error || 'Project not found'}
          </h1>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Back to projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {project.name}
                </h1>
              </div>
              {project.description && !isEditing && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadProject(true)}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="mb-6 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Edit Project
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={editGithubUrl}
                  onChange={e => setEditGithubUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editName.trim() || isSaving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Graph Status */}
          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Graph</span>
            </div>
            {project.graph ? (
              <>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {project.graph.fileCount} files
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Expires: {formatRelativeTime(project.graph.expiresAt)}
                </p>
              </>
            ) : (
              <p className="text-lg font-semibold text-slate-400 dark:text-slate-500">
                No graph
              </p>
            )}
          </div>

          {/* Batch Count */}
          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Batches</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {project.batchStats?.batchCount || 0}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {project.batchStats?.totalFiles || 0} total files
            </p>
          </div>

          {/* Average Quality */}
          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Avg Quality</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {project.batchStats?.avgQuality ? Math.round(project.batchStats.avgQuality) : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {project.batchStats?.successCount || 0} successful
            </p>
          </div>

          {/* Created Date */}
          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Created</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(project.createdAt).split(',')[0]}
            </p>
            {project.githubRepoUrl && (
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                onClick={e => e.stopPropagation()}
              >
                <GitBranch className="w-3 h-3" />
                GitHub
              </a>
            )}
          </div>
        </div>

        {/* Recent Batches */}
        {batches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Recent Batches
              </h2>
              <button
                onClick={() => navigate(`/history?projectId=${projectId}`)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all in History
              </button>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Files</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {batches.slice(0, 5).map(batch => (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                        {formatDate(batch.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {batch.total_files} file{batch.total_files !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          batch.avg_grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          batch.avg_grade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          batch.avg_grade === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          batch.avg_grade === 'D' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {batch.avg_grade || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            Deleting this project will remove it permanently. Associated batches will be preserved but unlinked from this project.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Project
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Delete Project
                  </h2>
                </div>

                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  This action cannot be undone. The project graph will be deleted, but associated batches will be preserved.
                </p>

                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                  Type <span className="font-mono font-semibold text-red-600 dark:text-red-400">{project.name}</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Project name"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirmText !== project.name || isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default ProjectDetails;
