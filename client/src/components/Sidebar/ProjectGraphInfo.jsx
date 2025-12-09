import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react';
import { getGraphByProjectId } from '../../services/graphApi';

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
 * ProjectGraphInfo - Collapsible project header with nested graph details
 *
 * Hierarchy: Project → Graph (graph belongs to project)
 *
 * Collapsed: ▶ Project Name →    [Active]
 * Expanded:  ▼ Project Name →    [Active]
 *               12 files • Analyzed 2h ago
 *               Expires in 22h
 *
 * @param {Object} props
 * @param {number} props.selectedProjectId - Currently selected project ID
 * @param {string} props.selectedProjectName - Currently selected project name
 */
export function ProjectGraphInfo({ selectedProjectId, selectedProjectName }) {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const [graphInfo, setGraphInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch graph info when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setGraphInfo(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchGraphInfo() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getGraphByProjectId(selectedProjectId);
        if (cancelled) return;

        if (result.success && result.graph) {
          setGraphInfo(result.graph);
        } else {
          setGraphInfo(null);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[ProjectGraphInfo] Error fetching graph:', err);
        setError('Failed to load');
        setGraphInfo(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchGraphInfo();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  if (!selectedProjectId) {
    return null;
  }

  const hasGraph = graphInfo !== null;
  const fileCount = graphInfo?.stats?.totalFiles || 0;
  const analyzedAt = graphInfo?.analyzedAt;
  const expiresAt = graphInfo?.expiresAt;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  // Determine status badge
  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          ...
        </span>
      );
    }
    if (error) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
          Error
        </span>
      );
    }
    if (!hasGraph) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          No Graph
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
          Expired
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        Active
      </span>
    );
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
      {/* Project header row - clickable to expand/collapse */}
      <div className="flex items-center gap-1">
        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse project info' : 'Expand project info'}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Project name as link */}
        <Link
          to={`/projects/${selectedProjectId}`}
          className="flex items-center gap-1 min-w-0 flex-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
          title={`View ${selectedProjectName} details`}
        >
          <span className="truncate">{selectedProjectName || 'Unnamed Project'}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Status badge */}
        {getStatusBadge()}
      </div>

      {/* Expanded content - Graph details */}
      {isExpanded && (
        <div className="mt-1.5 ml-5 space-y-1 text-xs text-slate-500 dark:text-slate-400">
          {isLoading && (
            <div className="italic">Loading graph info...</div>
          )}

          {error && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && hasGraph && (
            <>
              {/* File count and analyzed time on one line */}
              <div>
                <span className="text-slate-700 dark:text-slate-300">{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
                {analyzedAt && (
                  <span> • Analyzed {formatRelativeTime(analyzedAt)}</span>
                )}
              </div>

              {/* Expiration */}
              {expiresAt && (
                <div className={isExpired ? 'text-amber-600 dark:text-amber-400' : ''}>
                  {isExpired ? 'Expired' : 'Expires'} {formatRelativeTime(expiresAt)}
                </div>
              )}
            </>
          )}

          {!isLoading && !error && !hasGraph && (
            <div className="italic">
              No graph yet. Generate docs to analyze.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectGraphInfo;
